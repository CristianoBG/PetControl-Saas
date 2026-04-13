/**
 * useScanMetrics — scans por dia dos últimos 7 dias.
 *
 * Usa a tabela inventory_movements já existente, filtrada por origem='scanner'.
 * O agrupamento por data é feito no frontend para evitar RPC/function no banco.
 *
 * Retorna:
 *   scansByDay — array [{date, label, count}] ordenado do mais recente ao mais antigo
 *   totalScans — soma dos últimos 7 dias
 *   todayScans — scans de hoje
 *   isLoading
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, format, startOfDay, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ScanDayStat {
  date: string;   // 'yyyy-MM-dd'
  label: string;  // 'Hoje' | 'Ontem' | 'seg' | 'ter' …
  count: number;
}

export function useScanMetrics() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['scan-metrics', user?.id],
    queryFn: async () => {
      const since = subDays(new Date(), 6).toISOString(); // últimos 7 dias (hoje + 6)
      const { data: rows, error } = await supabase
        .from('inventory_movements')
        .select('created_at')
        .eq('user_id', user!.id)
        .eq('origem', 'scanner')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return rows ?? [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // revalida a cada 5 min
  });

  // ── Agrupamento por dia ──────────────────────────────────────────────────
  const today = startOfDay(new Date());

  const scansByDay: ScanDayStat[] = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, i);
    const dateKey = format(date, 'yyyy-MM-dd');

    const dayLabel = (() => {
      if (i === 0) return 'Hoje';
      if (i === 1) return 'Ontem';
      return format(date, 'EEE', { locale: ptBR }); // 'seg', 'ter'…
    })();

    const count = (data ?? []).filter((row) => {
      return format(new Date(row.created_at), 'yyyy-MM-dd') === dateKey;
    }).length;

    return { date: dateKey, label: dayLabel, count };
  });

  const totalScans = scansByDay.reduce((s, d) => s + d.count, 0);
  const todayScans = scansByDay[0]?.count ?? 0;

  return { scansByDay, totalScans, todayScans, isLoading };
}
