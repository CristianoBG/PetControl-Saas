import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConfig } from '@/hooks/useConfig';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, CheckCircle, Send } from 'lucide-react';
import { format, isBefore, isAfter, startOfDay, addDays } from 'date-fns';
import { toast } from 'sonner';
import { getVacinaStatus, getVacinaStatusStyles, buildWhatsAppMessage, buildWhatsAppUrl, DEFAULT_TEMPLATE } from '@/lib/vacinas';

type FilterType = 'hoje' | '7dias' | '30dias';

export default function LembretesPage() {
  const { user } = useAuth();
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<FilterType>('7dias');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: vacinas = [] } = useQuery({
    queryKey: ['vacinas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacinas').select('*').eq('user_id', user!.id)
        .order('data_proxima_dose', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const template = config?.template_mensagem || DEFAULT_TEMPLATE;
  const petshopName = config?.nome_petshop || 'nosso Pet Shop';

  const marcarAvisado = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const v = vacinas.find((x) => x.id === id);
        if (!v || !user) continue;
        await supabase.from('vacinas').update({ avisado: true }).eq('id', id);
        const msg = buildWhatsAppMessage(template, v, petshopName, (d) => format(d, 'dd/MM/yyyy'));
        await supabase.from('historico_mensagens').insert({
          user_id: user.id, vacina_id: id, nome_pet: v.nome_pet,
          nome_dono: v.nome_dono, tipo_vacina: v.tipo_vacina, mensagem_enviada: msg,
        });
      }
    },
    onSuccess: () => {
      toast.success('Mensagem enviada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['vacinas'] });
      setSelectedIds(new Set());
    },
  });

  const today = startOfDay(new Date());

  const filtered = useMemo(() => {
    return vacinas.filter((v) => {
      if (!v.data_proxima_dose) return false;
      const d = new Date(v.data_proxima_dose);
      if (filtro === 'hoje') return !isBefore(d, today) && !isAfter(d, today);
      if (filtro === '7dias') return !isAfter(d, addDays(today, 7));
      return !isAfter(d, addDays(today, 30));
    });
  }, [vacinas, filtro, today]);

  const getWhatsAppLink = (v: typeof vacinas[0]) => {
    const msg = buildWhatsAppMessage(template, v, petshopName, (d) => format(d, 'dd/MM/yyyy'));
    return buildWhatsAppUrl(v.whatsapp_dono, msg);
  };

  const handleSendAndMark = (v: typeof vacinas[0]) => {
    window.open(getWhatsAppLink(v), '_blank');
    marcarAvisado.mutate([v.id]);
  };

  const handleBatchSend = () => {
    const ids = Array.from(selectedIds);
    ids.forEach((id) => {
      const v = vacinas.find((x) => x.id === id);
      if (v) window.open(getWhatsAppLink(v), '_blank');
    });
    marcarAvisado.mutate(ids);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: '7dias', label: '7 dias' },
    { key: '30dias', label: '30 dias' },
  ];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5" /> Lembretes
          </h2>
          {selectedIds.size > 0 && (
            <Button size="sm" className="gap-1.5" onClick={handleBatchSend} disabled={marcarAvisado.isPending}>
              <Send className="h-3.5 w-3.5" /> Enviar ({selectedIds.size})
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filtro === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <CheckCircle className="h-10 w-10 text-primary mb-3" />
            <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
            <p className="text-xs text-muted-foreground mt-1">Nenhum lembrete para esse período</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((v) => {
              const status = getVacinaStatus(v.data_proxima_dose, v.avisado);
              const styles = getVacinaStatusStyles(status);
              const isSelected = selectedIds.has(v.id);

              return (
                <div
                  key={v.id}
                  className={`rounded-xl border bg-card p-4 space-y-3 transition-all ${
                    isSelected ? 'border-primary ring-1 ring-primary' : 'border-border'
                  }`}
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {status !== 'enviado' && (
                        <button
                          onClick={() => toggleSelect(v.id)}
                          className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-primary bg-primary' : 'border-border'
                          }`}
                        >
                          {isSelected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                        </button>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {v.nome_pet} <span className="font-normal text-muted-foreground">({v.nome_dono})</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{v.tipo_vacina}</p>
                        <p className={`text-xs font-medium mt-0.5 ${status === 'atrasado' ? 'text-destructive' : 'text-primary'}`}>
                          {status === 'atrasado' ? 'Atrasada' : `Vence ${format(new Date(v.data_proxima_dose!), 'dd/MM/yyyy')}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`${styles.badge} text-[10px]`}>
                      {styles.label}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => handleSendAndMark(v)}>
                      <MessageCircle className="h-3.5 w-3.5" /> Enviar WhatsApp
                    </Button>
                    {!v.avisado && (
                      <Button
                        size="sm" variant="outline" className="flex-1 gap-1.5 text-xs"
                        onClick={() => marcarAvisado.mutate([v.id])}
                        disabled={marcarAvisado.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Marcar como enviado
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
