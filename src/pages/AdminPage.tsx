import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ImpersonateDialog } from '@/components/admin/ImpersonateDialog';
import {
  Users,
  Activity,
  Crown,
  MoreVertical,
  Search,
  ShieldCheck,
  Zap,
  ArrowLeftRight,
  Eye,
  Trash2,
  LogOut,
  UserPlus,
  UserX,
  UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Subscription {
  user_id: string;
  plan_type: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  product_limit: number | null;
}

interface AdminLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_user_id: string | null;
  details: string | null;
  created_at: string;
}

interface Config {
  user_id: string;
  nome_petshop: string;
  nome_usuario: string | null;
}

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free', limit: 10 },
  { value: 'pro', label: 'Pro Mensal', limit: 50 },
  { value: 'premium', label: 'Premium Mensal', limit: 99999 },
  { value: 'premium_anual', label: 'Premium Anual', limit: 99999 },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'Pago', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
    trial: { label: 'Trial', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
    expired: { label: 'Vencido', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
    cancelled: { label: 'Cancelado', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
  };
  const s = map[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
}

export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<UserRow | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<UserRow | null>(null);

  // Metrics
  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_metrics');
      if (error) throw error;
      return data as { total_users: number; active_users: number; new_today: number };
    },
    enabled: isAdmin,
  });

  // Users
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users');
      if (error) throw error;
      return (data || []) as UserRow[];
    },
    enabled: isAdmin,
  });

  // Subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_subscriptions').select('*');
      if (error) throw error;
      return data as Subscription[];
    },
    enabled: isAdmin,
  });

  // Configs (for names)
  const { data: configs = [] } = useQuery({
    queryKey: ['admin-configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracoes').select('user_id, nome_petshop, nome_usuario');
      if (error) throw error;
      return data as Config[];
    },
    enabled: isAdmin,
  });

  // Logs
  const { data: logs = [] } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as AdminLog[];
    },
    enabled: isAdmin,
  });

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const subMap = new Map(subscriptions.map((s) => [s.user_id, s]));
  const configMap = new Map(configs.map((c) => [c.user_id, c]));

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const cfg = configMap.get(u.id);
    const matchesSearch =
      u.email?.toLowerCase().includes(q) ||
      cfg?.nome_usuario?.toLowerCase().includes(q) ||
      cfg?.nome_petshop?.toLowerCase().includes(q);

    if (showInactive) {
      const lastLogin = u.last_sign_in_at ? new Date(u.last_sign_in_at) : new Date(u.created_at);
      const isInactive = lastLogin < sixtyDaysAgo;
      return matchesSearch && isInactive;
    }

    return matchesSearch;
  });

  const inactiveCount = users.filter((u) => {
    const lastLogin = u.last_sign_in_at ? new Date(u.last_sign_in_at) : new Date(u.created_at);
    return lastLogin < sixtyDaysAgo;
  }).length;

  const handleForceActivate = async (targetUser: UserRow) => {
    try {
      const { error } = await supabase.rpc('admin_force_activate', { target_user: targetUser.id });
      if (error) throw error;
      toast.success(`Assinatura de ${targetUser.email} ativada por 30 dias`);
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao ativar');
    }
  };

  const handleChangePlan = async (targetUser: UserRow, plan: string) => {
    const opt = PLAN_OPTIONS.find((p) => p.value === plan);
    if (!opt) return;
    try {
      const { error } = await supabase.rpc('admin_change_plan', {
        target_user: targetUser.id,
        new_plan: plan,
        new_limit: opt.limit,
      });
      if (error) throw error;
      toast.success(`Plano de ${targetUser.email} alterado para ${opt.label}`);
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar plano');
    }
  };

  const handleResetData = async () => {
    if (!resetTarget) return;
    try {
      const { error } = await supabase.rpc('admin_reset_user_data', { target_user: resetTarget.id });
      if (error) throw error;
      toast.success(`Dados de ${resetTarget.email} resetados`);
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      setResetTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resetar');
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelTarget) return;
    try {
      const { error } = await supabase.rpc('admin_cancel_subscription', { target_user: cancelTarget.id });
      if (error) throw error;
      toast.success(`Conta de ${cancelTarget.email} desativada (Exclusão Normal)`);
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      setCancelTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao desativar conta');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.rpc('admin_delete_user', { target_user: deleteTarget.id });
      if (error) throw error;
      toast.success(`Conta de ${deleteTarget.email} excluída permanentemente`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-configs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir conta');
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-slate-400 hover:text-slate-100 hover:bg-slate-800">
              <LogOut className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <h1 className="text-lg font-bold">Painel Admin</h1>
            </div>
          </div>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
            Administrador
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{metrics?.total_users ?? '—'}</p>
                <p className="text-xs text-slate-400">Total Usuários</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Crown className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{metrics?.active_users ?? '—'}</p>
                <p className="text-xs text-slate-400">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{metrics?.new_today ?? '—'}</p>
                <p className="text-xs text-slate-400">Novos Hoje</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">
              <Users className="h-4 w-4 mr-1.5" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">
              <Activity className="h-4 w-4 mr-1.5" /> Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-4">
            {/* Search + Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <Button
                variant={showInactive ? 'default' : 'outline'}
                onClick={() => setShowInactive(!showInactive)}
                className={showInactive
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 shrink-0'
                  : 'border-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-800 shrink-0'
                }
              >
                <UserX className="h-4 w-4 mr-1.5" />
                Inativos ({inactiveCount})
              </Button>
            </div>

            {/* User List */}
            <div className="space-y-2">
              {filteredUsers.map((u) => {
                const sub = subMap.get(u.id);
                const cfg = configMap.get(u.id);
                return (
                  <Card key={u.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-slate-100 truncate">{cfg?.nome_usuario || u.email}</p>
                            <StatusBadge status={sub?.subscription_status || 'trial'} />
                            {sub?.plan_type && (
                              <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                                {sub.plan_type.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            Criado: {formatDate(u.created_at)} · Último login: {formatDate(u.last_sign_in_at)}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100">
                            <DropdownMenuItem
                              onClick={() => handleForceActivate(u)}
                              className="hover:bg-slate-800 cursor-pointer"
                            >
                              <Zap className="h-4 w-4 mr-2 text-emerald-400" />
                              Forçar Liberação (30 dias)
                            </DropdownMenuItem>

                            {PLAN_OPTIONS.map((plan) => (
                              <DropdownMenuItem
                                key={plan.value}
                                onClick={() => handleChangePlan(u, plan.value)}
                                className="hover:bg-slate-800 cursor-pointer"
                              >
                                <ArrowLeftRight className="h-4 w-4 mr-2 text-blue-400" />
                                Trocar para {plan.label}
                              </DropdownMenuItem>
                            ))}

                            <DropdownMenuItem
                              onClick={() => setImpersonateTarget(u)}
                              className="hover:bg-slate-800 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2 text-amber-400" />
                              Personificar (Leitura)
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setResetTarget(u)}
                              className="hover:bg-slate-800 cursor-pointer text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Resetar Dados
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-800" />

                            <DropdownMenuItem
                              onClick={() => setCancelTarget(u)}
                              className="hover:bg-amber-950 cursor-pointer text-amber-500 font-medium"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Desativar (Exclusão Normal)
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(u)}
                              className="hover:bg-red-950 cursor-pointer text-red-500 font-medium"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Excluir Conta Permanente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-8">Nenhum usuário encontrado</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Últimas 20 ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {logs.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Nenhum log registrado</p>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between border-b border-slate-800 pb-2 last:border-0">
                    <div>
                      <p className="text-sm text-slate-200">{log.details || log.action}</p>
                      <p className="text-[10px] text-slate-500">
                        Alvo: {log.target_user_id?.slice(0, 8)}... · {formatDate(log.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px] shrink-0">
                      {log.action}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDeleteDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        onConfirm={handleResetData}
        title="Resetar dados do usuário"
        description={`Isso irá apagar TODOS os dados (estoque, vacinas, atividades, perdas, movimentações e mensagens) de ${resetTarget?.email}. Esta ação não pode ser desfeita.`}
      />

      <ConfirmDeleteDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        onConfirm={handleCancelSubscription}
        title="Desativar Conta (Exclusão Normal)"
        description={`Isso irá cancelar a assinatura de ${cancelTarget?.email} e bloquear o acesso ao sistema. Os dados ESTOQUE, VACINAS, etc, SERÃO MANTIDOS intactos. O usuário poderá voltar a acessar se renovar.`}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Excluir conta permanentemente"
        description={`ATENÇÃO: Isso irá EXCLUIR PERMANENTEMENTE a conta de ${deleteTarget?.email}, incluindo TODOS os dados e o login. O usuário não poderá mais acessar o sistema. Esta ação é IRREVERSÍVEL.`}
      />

      <ImpersonateDialog
        open={!!impersonateTarget}
        onOpenChange={(open) => !open && setImpersonateTarget(null)}
        targetUser={impersonateTarget}
      />
    </div>
  );
}
