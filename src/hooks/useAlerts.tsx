import { useMemo } from 'react';
import { isBefore, startOfDay, isAfter, addDays } from 'date-fns';
import { getVacinaStatus } from '@/lib/vacinas';
import { useConfig } from '@/hooks/useConfig';
import { useEstoque } from '@/hooks/useEstoque';
import { useVacinas } from '@/hooks/useVacinas';

export interface AlertItem {
  id: string;
  type: 'estoque' | 'vacina';
  title: string;
  subtitle: string;
  date: string;
  isExpired: boolean;
  status?: string;
}

export function useAlerts() {
  const { config } = useConfig();
  const { estoque } = useEstoque();
  const { vacinas } = useVacinas();

  const diasAviso = config?.dias_aviso_antecipado ?? 7;

  const alerts = useMemo<AlertItem[]>(() => {
    // Datas calculadas dentro do useMemo para evitar re-renders desnecessários
    const today = startOfDay(new Date());
    const alertDays = addDays(today, diasAviso);

    const items: AlertItem[] = [];

    estoque.forEach((p) => {
      const d = new Date(p.data_validade);
      const expired = isBefore(d, today);
      const expiringSoon = !expired && !isAfter(d, addDays(today, 7));
      if (expired || expiringSoon) {
        items.push({
          id: p.id,
          type: 'estoque',
          title: p.nome_produto,
          subtitle: `Lote ${p.lote || '—'} · Qtd: ${p.quantidade}`,
          date: p.data_validade,
          isExpired: expired,
        });
      }
    });

    vacinas.forEach((v) => {
      if (!v.data_proxima_dose) return;
      const status = getVacinaStatus(v.data_proxima_dose, v.avisado, v.aplicada);
      const d = new Date(v.data_proxima_dose);
      const overdue = isBefore(d, today);
      const upcoming = !overdue && !isAfter(d, alertDays);
      if ((overdue || upcoming) && status !== 'enviado' && status !== 'aplicada') {
        items.push({
          id: v.id,
          type: 'vacina',
          title: `${v.nome_pet} — ${v.tipo_vacina}`,
          subtitle: `Dono: ${v.nome_dono}`,
          date: v.data_proxima_dose,
          isExpired: overdue,
          status,
        });
      }
    });

    items.sort((a, b) => {
      if (a.isExpired !== b.isExpired) return a.isExpired ? -1 : 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return items;
  }, [estoque, vacinas, diasAviso]);

  const vacinaCounts = useMemo(() => {
    let atrasadas = 0, pendentes = 0, enviadas = 0, aplicadas = 0;
    vacinas.forEach((v) => {
      const s = getVacinaStatus(v.data_proxima_dose, v.avisado, v.aplicada);
      if (s === 'atrasado') atrasadas++;
      else if (s === 'pendente') pendentes++;
      else if (s === 'aplicada') aplicadas++;
      else enviadas++;
    });
    return { atrasadas, pendentes, enviadas, aplicadas };
  }, [vacinas]);

  return { alerts, count: alerts.length, vacinaCounts };
}
