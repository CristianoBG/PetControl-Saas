import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useStockAnalysis } from '@/hooks/useStockAnalysis';
import { useScanMetrics } from '@/hooks/useScanMetrics';
import AppLayout from '@/components/AppLayout';
import { BarChart3, Trash2, Package, Syringe, Clock, ArrowUpCircle, ArrowDownCircle, TrendingDown, DollarSign, AlertTriangle, ScanLine } from 'lucide-react';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RelatoriosPage() {
  const { user } = useAuth();
  const { activities } = useActivityLog();
  const { analysis, fmt } = useStockAnalysis();
  const { scansByDay, totalScans, todayScans, isLoading: isLoadingScans } = useScanMetrics();

  const { data: perdas = [] } = useQuery({
    queryKey: ['perdas', user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('perdas')
        .select('*')
        .eq('user_id', user!.id)
        .gte('removido_em', thirtyDaysAgo)
        .order('removido_em', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['inventory_movements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Array<{
        id: string;
        produto_nome: string;
        codigo_barras: string | null;
        tipo: string;
        quantidade: number;
        origem: string;
        created_at: string;
      }>;
    },
    enabled: !!user,
  });

  const getActivityIcon = (tipo: string) => {
    if (tipo.startsWith('estoque')) return <Package className="h-4 w-4 text-primary" />;
    if (tipo.startsWith('vacina')) return <Syringe className="h-4 w-4 text-primary" />;
    if (tipo === 'perda') return <Trash2 className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Relatórios
        </h2>

        {/* Análise de Perdas do Estoque */}
        <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Análise de Perdas do Estoque</h3>
              <p className="text-xs text-muted-foreground">Impacto financeiro e riscos</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <DollarSign className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-sm font-extrabold text-foreground">{fmt(analysis.valorTotal)}</p>
              <p className="text-[9px] text-muted-foreground">Total em estoque</p>
            </div>
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-center">
              <AlertTriangle className="h-4 w-4 text-warning mx-auto mb-1" />
              <p className="text-sm font-extrabold text-warning">{fmt(analysis.valorRisco)}</p>
              <p className="text-[9px] text-muted-foreground">Em risco</p>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-center">
              <TrendingDown className="h-4 w-4 text-destructive mx-auto mb-1" />
              <p className="text-sm font-extrabold text-destructive">{fmt(analysis.valorPerdido)}</p>
              <p className="text-[9px] text-muted-foreground">Perdido no mês</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground">Produtos críticos:</span>
              <span className="float-right font-bold text-destructive">{analysis.critical}</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground">Vencendo ≤30d:</span>
              <span className="float-right font-bold text-warning">{analysis.expiring30}</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground">Estoque baixo:</span>
              <span className="float-right font-bold text-foreground">{analysis.lowStock}</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground">Sem movimentação:</span>
              <span className="float-right font-bold text-foreground">{analysis.noMovement}</span>
            </div>
          </div>

          {/* Ranking perdas */}
          {analysis.topLosses.length > 0 && (
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs font-semibold text-foreground mb-2">🏆 Produtos com mais perdas</p>
              <div className="space-y-1.5">
                {analysis.topLosses.map((item, i) => (
                  <div key={item.nome} className="flex items-center justify-between text-xs">
                    <span className="text-foreground truncate">
                      <span className="text-muted-foreground mr-1">{i + 1}.</span>
                      {item.nome}
                    </span>
                    <span className="text-destructive font-semibold whitespace-nowrap ml-2">
                      {item.valor > 0 ? fmt(item.valor) : `${item.count}x`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produtos parados */}
          {analysis.stagnantProducts.length > 0 && (
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Produtos sem movimentação
              </p>
              <div className="space-y-1.5">
                {analysis.stagnantProducts.map((item) => (
                  <div key={item.nome} className="flex items-center justify-between text-xs">
                    <span className="text-foreground truncate">{item.nome}</span>
                    <span className="text-muted-foreground whitespace-nowrap ml-2">{item.dias} dias parado</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scans por Dia */}
        <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ScanLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Scans por Dia</h3>
              <p className="text-xs text-muted-foreground">Leituras via câmera — últimos 7 dias</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xl font-extrabold text-foreground">{todayScans}</p>
              <p className="text-[10px] text-muted-foreground">Hoje</p>
            </div>
          </div>

          {isLoadingScans ? (
            <p className="text-xs text-muted-foreground py-4 text-center animate-pulse">Carregando...</p>
          ) : totalScans === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Nenhum scan registrado nos últimos 7 dias</p>
          ) : (
            <div className="space-y-2">
              {(() => {
                const maxCount = Math.max(...scansByDay.map((d) => d.count), 1);
                return scansByDay.map((day) => (
                  <div key={day.date} className="flex items-center gap-2">
                    <span className="w-12 text-right text-[11px] font-medium text-muted-foreground shrink-0">
                      {day.label}
                    </span>
                    <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: day.count === 0 ? '0%' : `${Math.max(4, (day.count / maxCount) * 100)}%` }}
                      />
                    </div>
                    <span className={`w-8 text-right text-[11px] font-bold shrink-0 ${
                      day.count > 0 ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {day.count}
                    </span>
                  </div>
                ));
              })()}
              <p className="text-[10px] text-muted-foreground pt-1 text-right">
                Total 7 dias: <span className="font-semibold text-foreground">{totalScans} scans</span>
              </p>
            </div>
          )}
        </div>

        {/* Histórico de Movimentação */}
        <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Histórico de Movimentação</h3>
              <p className="text-xs text-muted-foreground">Últimas 20 movimentações de estoque</p>
            </div>
          </div>

          {movements.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma movimentação registrada ainda</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {movements.map((m) => {
                const isEntrada = m.tipo === 'entrada';
                return (
                  <div key={m.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className="mt-0.5 shrink-0">
                      {isEntrada ? (
                        <ArrowUpCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className={`font-bold ${isEntrada ? 'text-primary' : 'text-destructive'}`}>
                          {isEntrada ? '+' : '-'}{m.quantidade}
                        </span>{' '}
                        {m.produto_nome}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {isEntrada ? 'Entrada' : 'Remoção'} via {m.origem} · {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumo de Perdas */}
        <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Perdas do Mês</h3>
              <p className="text-xs text-muted-foreground">Produtos críticos removidos nos últimos 30 dias</p>
            </div>
          </div>
          <p className="text-4xl font-extrabold text-foreground tracking-tight">{perdas.length}</p>
          {perdas.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
              {perdas.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                  <span className="text-foreground font-medium truncate">{p.nome_produto}</span>
                  <span className="text-muted-foreground whitespace-nowrap ml-2">
                    {format(new Date(p.removido_em), 'dd/MM', { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          )}
          {perdas.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">Nenhuma perda registrada este mês 🎉</p>
          )}
        </div>

        {/* Últimas Ações */}
        <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Últimas Ações
          </h3>
          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma atividade registrada ainda</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="mt-0.5 shrink-0">{getActivityIcon(a.tipo)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{a.descricao}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
