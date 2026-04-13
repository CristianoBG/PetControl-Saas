import { useMemo } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, addYears } from 'date-fns';
import { getVacinaStatus, buildWhatsAppMessage, buildWhatsAppUrl, DEFAULT_TEMPLATE } from '@/lib/vacinas';
import { normalizePhone } from '@/lib/phone';
import { useConfig } from './useConfig';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface Vacina {
  id: string;
  user_id: string;
  pet_id: string | null;
  nome_pet: string;
  nome_dono: string;
  whatsapp_dono: string;
  tipo_vacina: string;
  data_dose: string;
  data_proxima_dose: string | null;
  foto_pet_url: string | null;
  avisado: boolean;
  aplicada: boolean;
  data_aplicacao: string | null;
  lote_aplicacao: string | null;
  observacao_aplicacao: string | null;
  created_at: string;
}

export interface RegistrarAplicacaoPayload {
  id: string;
  dataAplicacao: string;
  lote: string;
  observacao: string;
  autoScheduleDays?: number;
}

export interface PetGrouped {
  id: string; // nome_pet + whatsapp_dono
  nome_pet: string;
  nome_dono: string;
  whatsapp_dono: string;
  foto_pet_url: string | null;
  vacinas: (Vacina & { status: string })[];
}

// ── QueryKey Padronizada ─────────────────────────────────────────────────────

export const VACINAS_QUERY_KEY = (userId: string) => ['vacinas', userId] as const;

// ── Hook Principal ───────────────────────────────────────────────────────────

export function useVacinas() {
  const { user } = useAuth();
  const { config } = useConfig();
  const queryClient = useQueryClient();

  const template = config?.template_mensagem || DEFAULT_TEMPLATE;
  const petshopName = config?.nome_petshop || 'nosso Pet Shop';

  // 1. Fetch from 'pets' joined with 'vacinas' using Infinite Pagination
  const {
    data: fetchPetsPages,
    isLoading: isLoadingVacinas,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: VACINAS_QUERY_KEY(user?.id ?? ''),
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('pets')
        .select(`
          id, nome, dono_nome, telefone, foto_url,
          vacinas (*)
        `)
        .eq('user_id', user!.id)
        .order('nome', { ascending: true })
        .range(pageParam * 20, (pageParam + 1) * 20 - 1);
      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // Se a última página retornou exatos 20 registros, assumimos que há mais.
      return lastPage.length === 20 ? allPages.length : undefined;
    },
    enabled: !!user,
  });

  const fetchPets = useMemo(() => {
    return fetchPetsPages?.pages.flat() || [];
  }, [fetchPetsPages]);

  // 1.B Aggregate Dashboard Stats directly from PostgreSQL (O(1) footprint)
  const { data: dashboardStats } = useQuery({
    queryKey: ['vacinas_stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats', { p_user_id: user!.id });
      if (error) throw error;
      return data as { aplicadas: number, atrasadas: number, vencendo: number, pendentes: number } | null;
    },
    enabled: !!user,
  });

  const { data: dashboardChart } = useQuery({
    queryKey: ['vacinas_chart', user?.id, new Date().getFullYear()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_chart', { 
        p_user_id: user!.id, 
        p_year: new Date().getFullYear() 
      });
      if (error) throw error;
      return data as { month: number, total: number }[];
    },
    enabled: !!user,
  });

  // 2. Map directly from DB into the structured format Expected by the Dashboard
  const petsGrouped: PetGrouped[] = useMemo(() => {
    return fetchPets.map((p) => {
      // Sort each pet's vaccines inside the block
      const sortedVacinas = (p.vacinas as Vacina[] || []).sort(
        (a, b) => new Date(a.data_dose).getTime() - new Date(b.data_dose).getTime()
      );
      
      const vComStatus = sortedVacinas.map(v => ({
         ...v,
         status: getVacinaStatus(v.data_proxima_dose, v.avisado, v.aplicada)
      }));

      return {
        id: p.id,
        nome_pet: p.nome,
        nome_dono: p.dono_nome,
        whatsapp_dono: p.telefone,
        foto_pet_url: p.foto_url,
        vacinas: vComStatus,
      };
    });
  }, [fetchPets]);

  // 3. Flatten vaccines recursively for the Top Stats and Bar Chart 
  const vacinasComStatus = useMemo(() => {
    return petsGrouped.flatMap(p => p.vacinas);
  }, [petsGrouped]);

  // Plain untouched vaccines
  const vacinas = useMemo(() => {
     return vacinasComStatus.map((v) => { 
        // strip out status for standard usage
        const { status, ...rest } = v; 
        return rest; 
     });
  }, [vacinasComStatus]);

  // ── Helpers de mensagem ────────────────────────────────────────────────────

  const getWhatsAppLink = (v: Vacina) => {
    const msg = buildWhatsAppMessage(template, v, petshopName, (d) =>
      format(d, 'dd/MM/yyyy')
    );
    return buildWhatsAppUrl(v.whatsapp_dono, msg);
  };

  // ── Upload de foto de pet ──────────────────────────────────────────────────

  const uploadPetPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const { compressImage } = await import('@/lib/image');
    const compressed = await compressImage(file);
    const path = `${user.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('pet-photos').upload(path, compressed, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const removePetPhoto = async (url: string) => {
    if (!url) return;
    // Extrai o path após o bucket name na URL pública
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/pet-photos/');
      if (pathParts.length > 1) {
        await supabase.storage.from('pet-photos').remove([pathParts[1]]);
      }
    } catch {
      // ignora erros de remoção de foto — não crítico
    }
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addVacina = useMutation({
    mutationFn: async ({
      formData,
      petPhoto,
    }: {
      formData: {
        nome_pet: string;
        nome_dono: string;
        whatsapp: string;
        tipo_vacina: string;
        data_dose: string;
        data_proxima?: string;
      };
      petPhoto: File | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      let foto_pet_url: string | null = null;
      if (petPhoto) foto_pet_url = await uploadPetPhoto(petPhoto);
      
      // Upsert Pet
      const phoneClean = formData.whatsapp.replace(/\D/g, '');
      let pet_id: string;
      
      const { data: existingPets } = await supabase.from('pets')
        .select('id')
        .eq('user_id', user.id)
        .eq('nome', formData.nome_pet)
        .eq('telefone', phoneClean)
        .limit(1);
        
      if (existingPets && existingPets.length > 0) {
         pet_id = existingPets[0].id;
         if (foto_pet_url) {
            await supabase.from('pets').update({ foto_url: foto_pet_url }).eq('id', pet_id);
         }
      } else {
         const { data: newPet, error: petErr } = await supabase.from('pets').insert({
            user_id: user.id,
            nome: formData.nome_pet,
            dono_nome: formData.nome_dono,
            telefone: phoneClean,
            foto_url: foto_pet_url
         }).select('id').single();
         if (petErr) throw petErr;
         pet_id = newPet.id;
      }
      
      const { error } = await supabase.from('vacinas').insert({
        user_id: user.id,
        pet_id: pet_id,
        nome_pet: formData.nome_pet,          // Retro-compatibility legacy field
        nome_dono: formData.nome_dono,        // Retro-compatibility legacy field
        whatsapp_dono: phoneClean,            // Retro-compatibility legacy field
        tipo_vacina: formData.tipo_vacina,
        data_dose: formData.data_dose,
        data_proxima_dose: formData.data_proxima || null,
        foto_pet_url: foto_pet_url,           // Retro-compatibility legacy field
      });
      if (error) throw error;
      return formData.nome_pet;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VACINAS_QUERY_KEY(user?.id ?? '') }),
  });

  const updateVacina = useMutation({
    mutationFn: async ({
      id,
      formData,
      petPhoto,
      existingPhotoUrl,
    }: {
      id: string;
      formData: {
        nome_pet: string;
        nome_dono: string;
        whatsapp: string;
        tipo_vacina: string;
        data_dose: string;
        data_proxima?: string;
      };
      petPhoto: File | null;
      existingPhotoUrl: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      let foto_pet_url = existingPhotoUrl;
      if (petPhoto) {
        if (existingPhotoUrl) await removePetPhoto(existingPhotoUrl);
        foto_pet_url = (await uploadPetPhoto(petPhoto)) || undefined;
      }
      
      const phoneClean = formData.whatsapp.replace(/\D/g, '');
      const { error } = await supabase
        .from('vacinas')
        .update({
          nome_pet: formData.nome_pet,
          nome_dono: formData.nome_dono,
          whatsapp_dono: phoneClean,
          tipo_vacina: formData.tipo_vacina,
          data_dose: formData.data_dose,
          data_proxima_dose: formData.data_proxima || null,
          foto_pet_url: foto_pet_url,
        })
        .eq('id', id);
      if (error) throw error;
      
      // Attempt to sync Pet table
      const v = vacinas.find(x => x.id === id);
      if (v && v.pet_id) {
         await supabase.from('pets').update({
            nome: formData.nome_pet, 
            dono_nome: formData.nome_dono, 
            telefone: phoneClean,
            foto_url: foto_pet_url || existingPhotoUrl
         }).eq('id', v.pet_id);
      }
      return formData.nome_pet;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VACINAS_QUERY_KEY(user?.id ?? '') }),
  });

  const deleteVacina = useMutation({
    mutationFn: async (vacina: Pick<Vacina, 'id' | 'foto_pet_url'>) => {
      // Remove foto do Storage antes de deletar o registro
      if (vacina.foto_pet_url) await removePetPhoto(vacina.foto_pet_url);
      const { error } = await supabase.from('vacinas').delete().eq('id', vacina.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VACINAS_QUERY_KEY(user?.id ?? '') }),
  });

  const marcarAvisado = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) return;
      const { error: updateError } = await supabase
        .from('vacinas')
        .update({ avisado: true })
        .in('id', ids);
      if (updateError) throw updateError;

      const historyRows = ids
        .map((id) => {
          const v = vacinas.find((x) => x.id === id);
          if (!v) return null;
          const msg = buildWhatsAppMessage(template, v, petshopName, (d) =>
            format(d, 'dd/MM/yyyy')
          );
          return {
            user_id: user.id,
            vacina_id: id,
            nome_pet: v.nome_pet,
            nome_dono: v.nome_dono,
            tipo_vacina: v.tipo_vacina,
            mensagem_enviada: msg,
          };
        })
        .filter(Boolean);

      if (historyRows.length > 0) {
        const { error: insertError } = await supabase
          .from('historico_mensagens')
          .insert(historyRows);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VACINAS_QUERY_KEY(user?.id ?? '') }),
  });

  const registrarAplicacao = useMutation({
    mutationFn: async ({ id, dataAplicacao, lote, observacao, autoScheduleDays }: RegistrarAplicacaoPayload) => {
      if (!user) throw new Error('Not authenticated');
      const v = vacinas.find((x) => x.id === id);
      if (!v) throw new Error('Vacina não encontrada');

      // Uses the NEW RPC that handles the autoSchedule insertion gracefully via SQL Transactions!
      const { error } = await supabase.rpc('apply_vaccine_and_schedule', {
        p_vacina_id: id,
        p_data_aplicacao: dataAplicacao,
        p_lote: lote || null,
        p_observacao: observacao || null,
        p_agendar_dias: autoScheduleDays || 0
      });
      
      if (error) throw error;

      return v.nome_pet;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VACINAS_QUERY_KEY(user?.id ?? '') }),
  });

  return {
    vacinas,
    vacinasComStatus,
    petsGrouped,
    dashboardStats,
    dashboardChart,
    isLoadingVacinas,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    getWhatsAppLink,
    addVacina,
    updateVacina,
    deleteVacina,
    marcarAvisado,
    registrarAplicacao,
  };
}
