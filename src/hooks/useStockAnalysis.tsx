import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEstoque, MOVEMENTS_QUERY_KEY } from './useEstoque';
import { differenceInDays, startOfMonth } from 'date-fns';

export interface StockAnalysis {
  critical: number;
  expiring30: number;
  lowStock: number;
  noMovement: number;
  lossesThisMonth: number;
  valorTotal: number;
  valorRisco: number;
  valorPerdido: number;
  topLosses: { nome: string; valor: number; count: number }[];
  stagnantProducts: { nome: string; dias: number }[];
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function useStockAnalysis() {
  const { user } = useAuth();
  // Usa os dados já em cache do useEstoque — sem nova query duplicada
  const { estoque, movements } = useEstoque();

  const { data: perdas = [] } = useQuery({
    queryKey: ['perdas', user?.id ?? ''],
    queryFn: async () => {
      const { data } = await supabase
        .from('perdas')
        .select('*')
        .eq('user_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const analysis = useMemo<StockAnalysis>(() => {
    const today = new Date();
    const in7days = new Date(today); in7days.setDate(today.getDate() + 7);
    const in30days = new Date(today); in30days.setDate(today.getDate() + 30);
    const ago60days = new Date(today); ago60days.setDate(today.getDate() - 60);
    const monthStart = startOfMonth(today);

    const val = (p: { quantidade?: number; preco_unitario?: number | null }) =>
      (p.preco_unitario ?? 0) * (p.quantidade ?? 1);

    const criticalItems = estoque.filter((p) => new Date(p.data_validade) <= in7days);
    const expiring30Items = estoque.filter((p) => {
      const d = new Date(p.data_validade);
      return d > in7days && d <= in30days;
    });

    const lowStockCount = estoque.filter((p) => p.quantidade <= 3).length;

    const recentMoved = new Set(
      movements
        .filter((m) => new Date(m.created_at) >= ago60days)
        .map((m) => m.produto_nome.toLowerCase())
    );

    const stagnantProducts = estoque
      .filter((p) => !recentMoved.has(p.nome_produto.toLowerCase()))
      .map((p) => {
        const lastMove = movements
          .filter((m) => m.produto_nome.toLowerCase() === p.nome_produto.toLowerCase())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        const dias = lastMove
          ? differenceInDays(today, new Date(lastMove.created_at))
          : differenceInDays(today, new Date(p.created_at));
        return { nome: p.nome_produto, dias };
      })
      .sort((a, b) => b.dias - a.dias);

    const monthlyLosses = perdas.filter((p) => new Date(p.removido_em) >= monthStart);

    const lossMap = new Map<string, { valor: number; count: number }>();
    monthlyLosses.forEach((p) => {
      const key = p.nome_produto;
      const existing = lossMap.get(key) || { valor: 0, count: 0 };
      existing.valor += p.preco_unitario ?? 0;
      existing.count += 1;
      lossMap.set(key, existing);
    });

    const topLosses = Array.from(lossMap.entries())
      .map(([nome, { valor, count }]) => ({ nome, valor, count }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    const valorTotal = estoque.reduce((sum, p) => sum + val(p), 0);
    const valorRisco = [...criticalItems, ...expiring30Items].reduce((sum, p) => sum + val(p), 0);
    const valorPerdido = monthlyLosses.reduce((sum, p) => sum + (p.preco_unitario ?? 0), 0);

    return {
      critical: criticalItems.length,
      expiring30: expiring30Items.length,
      lowStock: lowStockCount,
      noMovement: stagnantProducts.length,
      lossesThisMonth: monthlyLosses.length,
      valorTotal,
      valorRisco,
      valorPerdido,
      topLosses,
      stagnantProducts: stagnantProducts.slice(0, 5),
    };
  }, [estoque, movements, perdas]);

  return { analysis, fmt };
}
