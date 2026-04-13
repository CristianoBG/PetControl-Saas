import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Syringe, Activity, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImpersonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: { id: string; email: string } | null;
}

interface DashboardData {
  config: any;
  subscription: any;
  estoque_count: number;
  vacinas_count: number;
  perdas_count: number;
  recent_activities: any[];
  estoque: any[];
  vacinas: any[];
}

export function ImpersonateDialog({ open, onOpenChange, targetUser }: ImpersonateDialogProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!targetUser) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.rpc('admin_get_user_dashboard', {
        target_user: targetUser.id,
      });
      if (error) throw error;
      setData(result as unknown as DashboardData);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && targetUser) {
      loadData();
    } else {
      setData(null);
    }
    onOpenChange(isOpen);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <Eye className="h-5 w-5 text-blue-400" />
            Visualizando: {targetUser?.email}
          </DialogTitle>
          <Badge variant="outline" className="w-fit border-amber-500/30 text-amber-400 text-[10px]">
            SOMENTE LEITURA
          </Badge>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* User Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-3 space-y-1">
                <p className="text-sm font-medium text-slate-200">
                  {data.config?.nome_usuario || 'Sem nome'} — {data.config?.nome_petshop || 'Sem pet shop'}
                </p>
                <p className="text-xs text-slate-400">
                  Plano: <span className="text-slate-200">{data.subscription?.plan_type?.toUpperCase() || 'N/A'}</span>
                  {' · '}Status: <span className="text-slate-200">{data.subscription?.subscription_status || 'N/A'}</span>
                </p>
              </CardContent>
            </Card>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-3 text-center">
                  <Package className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                  <p className="text-lg font-bold text-slate-100">{data.estoque_count}</p>
                  <p className="text-[10px] text-slate-400">Produtos</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-3 text-center">
                  <Syringe className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
                  <p className="text-lg font-bold text-slate-100">{data.vacinas_count}</p>
                  <p className="text-[10px] text-slate-400">Vacinas</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-3 text-center">
                  <Activity className="h-4 w-4 mx-auto text-red-400 mb-1" />
                  <p className="text-lg font-bold text-slate-100">{data.perdas_count}</p>
                  <p className="text-[10px] text-slate-400">Perdas</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="estoque">
              <TabsList className="bg-slate-800 border border-slate-700 w-full">
                <TabsTrigger value="estoque" className="data-[state=active]:bg-slate-700 flex-1 text-xs">Estoque</TabsTrigger>
                <TabsTrigger value="vacinas" className="data-[state=active]:bg-slate-700 flex-1 text-xs">Vacinas</TabsTrigger>
                <TabsTrigger value="atividades" className="data-[state=active]:bg-slate-700 flex-1 text-xs">Atividades</TabsTrigger>
              </TabsList>

              <TabsContent value="estoque" className="mt-2 space-y-1">
                {data.estoque.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Sem produtos</p>}
                {data.estoque.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-800 rounded-lg p-2 text-xs">
                    <div>
                      <p className="text-slate-200 font-medium">{item.nome_produto}</p>
                      <p className="text-slate-500">Qtd: {item.quantidade} · Val: {formatDate(item.data_validade)}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="vacinas" className="mt-2 space-y-1">
                {data.vacinas.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Sem vacinas</p>}
                {data.vacinas.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-800 rounded-lg p-2 text-xs">
                    <div>
                      <p className="text-slate-200 font-medium">{item.nome_pet} — {item.tipo_vacina}</p>
                      <p className="text-slate-500">Dono: {item.nome_dono} · Próx: {formatDate(item.data_proxima_dose)}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="atividades" className="mt-2 space-y-1">
                {data.recent_activities.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Sem atividades</p>}
                {data.recent_activities.map((item: any) => (
                  <div key={item.id} className="bg-slate-800 rounded-lg p-2 text-xs">
                    <p className="text-slate-200">{item.descricao}</p>
                    <p className="text-slate-500">{formatDate(item.created_at)}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
