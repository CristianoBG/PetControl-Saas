import { useQuery } from '@tanstack/react-query';
import logoImg from '@/assets/logo-petcontrol.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConfig } from '@/hooks/useConfig';
import { useSubscription } from '@/hooks/useSubscription';
import { useEstoque } from '@/hooks/useEstoque';
import { useVacinas } from '@/hooks/useVacinas';
import { Package, AlertTriangle, Syringe, ChevronRight, CheckCircle2, Users, PawPrint, AlertCircle, Crown, Bell, Moon, Sun, Plus, ScanLine } from 'lucide-react';
import { addDays, isBefore, isAfter, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import AlertsSheet from '@/components/AlertsSheet';
import { useAlerts } from '@/hooks/useAlerts';
import { useDarkMode } from '@/hooks/useTheme';
import { useState, useEffect } from 'react';
import { SubscriptionAlert } from '@/components/SubscriptionAlert';
import { toast } from 'sonner';
import { format } from 'date-fns';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const logoGradient = 'linear-gradient(135deg, hsl(43, 96%, 56%), hsl(36, 100%, 40%), hsl(48, 100%, 67%), hsl(36, 100%, 40%), hsl(43, 96%, 56%))';
const logoShadow = '0 0 10px hsla(43, 96%, 56%, 0.3)';

// Skeleton simples reutilizável
function StatSkeleton() {
  return (
    <div className="rounded-2xl bg-card border-2 border-muted p-4 text-center animate-pulse">
      <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-muted" />
      <div className="mx-auto h-7 w-8 rounded bg-muted mb-1" />
      <div className="mx-auto h-3 w-16 rounded bg-muted" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();
  const { alerts, vacinaCounts } = useAlerts();
  const {
    planLabel,
    subscriptionDaysRemaining,
    status,
    isActive,
  } = useSubscription();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Dados via hooks centralizados — sem queries duplicadas
  const { estoque, isLoadingEstoque } = useEstoque();
  const { vacinas, isLoadingVacinas } = useVacinas();

  const isLoading = isLoadingEstoque || isLoadingVacinas;

  const today = startOfDay(new Date());
  const in7Days = addDays(today, 7);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const vencidos = estoque.filter((p) => isBefore(new Date(p.data_validade), today));
  const vencendo7 = estoque.filter((p) => {
    const d = new Date(p.data_validade);
    return !isBefore(d, today) && !isAfter(d, in7Days);
  });
  const vacinasSemana = vacinas.filter((v) => {
    if (!v.data_proxima_dose) return false;
    const d = new Date(v.data_proxima_dose);
    return !isBefore(d, startOfDay(weekStart)) && !isAfter(d, endOfDay(weekEnd));
  });

  const uniqueClients = new Set(vacinas.map((v) => v.whatsapp_dono)).size;
  const uniquePets = new Set(vacinas.map((v) => `${v.nome_pet}-${v.whatsapp_dono}`)).size;
  const displayName = config?.nome_usuario || 'Usuário';
  const hasAlerts = vencendo7.length > 0 || vacinaCounts.atrasadas > 0;

  // Alerta de expiração de plano — 1x por dia, com namespace de usuário
  useEffect(() => {
    if (!user || !isActive || status !== 'active' || subscriptionDaysRemaining > 7) return;
    const todayKey = `last_expiry_alert_${user.id}_${format(new Date(), 'yyyy-MM-dd')}`;
    if (localStorage.getItem(todayKey)) return;

    toast.warning(
      `Atenção: Seu plano vence em ${subscriptionDaysRemaining} ${subscriptionDaysRemaining === 1 ? 'dia' : 'dias'}.`,
      {
        description: 'Renove agora para evitar bloqueio de acesso.',
        action: { label: 'Renovar', onClick: () => navigate('/planos') },
        duration: 6000,
      }
    );
    localStorage.setItem(todayKey, 'true');
  }, [user, isActive, status, subscriptionDaysRemaining, navigate]);

  const statCards = [
    { icon: Users,    value: uniqueClients,      label: 'Clientes',          onClick: () => navigate('/vacinas'),               isDestructive: false },
    { icon: PawPrint, value: uniquePets,          label: 'Pets',              onClick: () => navigate('/vacinas'),               isDestructive: false },
    { icon: Syringe,  value: vacinasSemana.length,label: 'Vacinas da semana', onClick: () => navigate('/vacinas'),               isDestructive: false },
    { icon: Package,  value: vencidos.length,     label: 'Produtos vencidos', onClick: () => navigate('/estoque?filtro=red'),    isDestructive: true  },
  ];

  return (
    <AppLayout hideHeader>
      <div className="space-y-4">
        {/* Store Banner */}
        <div className="rounded-2xl border border-border bg-card p-3.5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3">
            <div
              className="relative flex shrink-0 items-center justify-center"
              style={{ padding: '3px', borderRadius: '14px', background: logoGradient, boxShadow: logoShadow }}
            >
              <img
                src={config?.logo_url || logoImg}
                alt={config?.nome_petshop || 'PetControl'}
                className="h-14 w-14 rounded-xl object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground truncate">{config?.nome_petshop || 'PetControl'}</h2>
                <button
                  onClick={() => navigate('/planos')}
                  className="flex items-center gap-1 shrink-0 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5"
                >
                  <Crown className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold text-primary">{planLabel}</span>
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{getGreeting()}, {displayName} 🐾</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={toggleDark}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                title={isDark ? 'Modo claro' : 'Modo escuro'}
              >
                {isDark ? <Sun className="h-4.5 w-4.5 text-muted-foreground" /> : <Moon className="h-4.5 w-4.5 text-muted-foreground" />}
              </button>
              <button
                onClick={() => setAlertsOpen(true)}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
              >
                <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                {alerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {alerts.length > 99 ? '99+' : alerts.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Alerta de Expiração de Assinatura */}
        <SubscriptionAlert />

        {/* Alertas urgentes */}
        {!isLoading && (
          hasAlerts ? (
            <div className="space-y-2">
              {vencendo7.length > 0 && (
                <button
                  onClick={() => setAlertsOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-left transition-all active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-destructive">
                      {vencendo7.length} produto{vencendo7.length > 1 ? 's' : ''} vencendo em 7 dias
                    </p>
                    <p className="text-xs text-muted-foreground">Toque para ver detalhes</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-destructive shrink-0" />
                </button>
              )}
              {vacinaCounts.atrasadas > 0 && (
                <button
                  onClick={() => navigate('/vacinas?filtro=atrasado')}
                  className="flex w-full items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-left transition-all active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-destructive">
                      ⚠️ {vacinaCounts.atrasadas} vacina{vacinaCounts.atrasadas > 1 ? 's' : ''} atrasada{vacinaCounts.atrasadas > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">Alguns pets precisam de reforço · Toque para enviar lembretes</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-destructive shrink-0" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/15 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Tudo em dia ✨</p>
                <p className="text-xs text-muted-foreground">Nenhuma vacina atrasada ou produto vencendo</p>
              </div>
            </div>
          )
        )}

        {/* Cards resumo 2x2 — com skeleton durante loading */}
        <div className="grid grid-cols-2 gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            : statCards.map(({ icon: Icon, value, label, onClick, isDestructive }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className={`rounded-2xl bg-card p-4 text-center transition-all active:scale-[0.97] ${isDestructive ? 'border-2 border-destructive/40' : 'border-2 border-primary/40'}`}
                  style={{ boxShadow: isDestructive ? '0 0 14px hsla(0, 72%, 51%, 0.15)' : '0 0 14px hsl(var(--primary) / 0.15)' }}
                >
                  <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${isDestructive ? 'bg-destructive/15 border border-destructive/30' : 'bg-primary/15 border border-primary/30'}`}>
                    <Icon className={`h-5 w-5 ${isDestructive ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
                </button>
              ))
          }
        </div>

        {/* Ações rápidas */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ações rápidas</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Syringe,  label: 'Nova vacina',   onClick: () => navigate('/vacinas') },
              { icon: Plus,     label: 'Novo produto',  onClick: () => navigate('/estoque') },
              { icon: ScanLine, label: 'Escanear',      onClick: () => navigate('/scanner') },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-primary/35 bg-card p-3 transition-all active:scale-[0.97]"
                style={{ boxShadow: '0 0 12px hsl(var(--primary) / 0.12)' }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <AlertsSheet open={alertsOpen} onOpenChange={setAlertsOpen} alerts={alerts} />
    </AppLayout>
  );
}
