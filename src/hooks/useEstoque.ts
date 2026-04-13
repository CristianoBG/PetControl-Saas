import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { isBefore, startOfDay } from 'date-fns';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface ProdutoEstoque {
  id: string;
  user_id: string;
  nome_produto: string;
  quantidade: number;
  data_validade: string;
  lote: string | null;
  codigo_barras: string | null;
  preco_unitario: number | null;
  categoria: string | null;
  created_at: string;
}

export interface MovimentacaoEstoque {
  id: string;
  user_id: string;
  produto_nome: string;
  codigo_barras: string | null;
  tipo: string;
  quantidade: number;
  origem: string;
  created_at: string;
}

// ── QueryKeys Padronizadas ───────────────────────────────────────────────────

export const ESTOQUE_QUERY_KEY = (userId: string) => ['estoque', userId] as const;
export const MOVEMENTS_QUERY_KEY = (userId: string) => ['inventory_movements', userId] as const;

// ── Hook Principal ───────────────────────────────────────────────────────────

export function useEstoque() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: estoque = [], isLoading: isLoadingEstoque } = useQuery({
    queryKey: ESTOQUE_QUERY_KEY(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .eq('user_id', user!.id)
        .order('data_validade', { ascending: true });
      if (error) throw error;
      return data as ProdutoEstoque[];
    },
    enabled: !!user,
  });

  const { data: movements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: MOVEMENTS_QUERY_KEY(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MovimentacaoEstoque[];
    },
    enabled: !!user,
  });

  // Mapa de última movimentação por produto (calculado uma vez)
  const lastMovementMap = useMemo(() => {
    const map: Record<string, string> = {};
    movements.forEach((m) => {
      const key = m.produto_nome.toLowerCase();
      if (!map[key]) map[key] = m.created_at;
    });
    return map;
  }, [movements]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteProduct = useMutation({
    mutationFn: async (product: Pick<ProdutoEstoque, 'id' | 'nome_produto' | 'data_validade' | 'lote' | 'preco_unitario'>) => {
      // Se vencido, registrar como perda antes de remover
      if (user && isBefore(new Date(product.data_validade), startOfDay(new Date()))) {
        await supabase.from('perdas').insert({
          user_id: user.id,
          nome_produto: product.nome_produto,
          lote: product.lote,
          data_validade: product.data_validade,
          preco_unitario: product.preco_unitario ?? null,
        });
      }
      const { error } = await supabase.from('estoque').delete().eq('id', product.id);
      if (error) throw error;
      return product.nome_produto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async (data: Omit<ProdutoEstoque, 'user_id' | 'created_at'> & { delta_quantidade: number }) => {
      const { error } = await supabase.rpc('update_stock_safely' as any, {
        p_id: data.id,
        p_delta_quantidade: data.delta_quantidade,
        p_nome: data.nome_produto,
        p_validade: data.data_validade,
        p_lote: data.lote || null,
        p_codigo_barras: data.codigo_barras || null,
        p_preco: data.preco_unitario || null,
        p_categoria: data.categoria || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
    },
  });

  const clearExpired = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('clear_expired_stock' as any);
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
    },
  });

  return {
    estoque,
    movements,
    lastMovementMap,
    isLoadingEstoque,
    isLoadingMovements,
    deleteProduct,
    updateProduct,
    clearExpired,
  };
}
