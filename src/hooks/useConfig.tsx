import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ConfigData {
  nome_petshop: string;
  tema_cor?: string;
  logo_url?: string | null;
  whatsapp?: string | null;
  nome_usuario?: string | null;
  template_mensagem?: string | null;
  dias_aviso_antecipado?: number;
  assistente_ativo?: boolean;
}

export function useConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['config', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const upsertConfig = useMutation({
    mutationFn: async (configData: ConfigData) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('configuracoes')
        .upsert({ user_id: user.id, ...configData }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', user?.id] }),
  });

  return { config, isLoading, upsertConfig };
}
