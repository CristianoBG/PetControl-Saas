import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Crown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Props {
  productCount: number;
}

export default function SubscriptionBanner({ productCount }: Props) {
  const navigate = useNavigate();
  const {
    planType,
    planLabel,
    status,
    productLimit,
    isUnlimited,
    isTrial,
    trialDaysRemaining,
    subscriptionDaysRemaining,
  } = useSubscription();

  const usagePercent = isUnlimited ? 0 : productLimit > 0 ? Math.round((productCount / productLimit) * 100) : 0;
  const isNearLimit = usagePercent >= 80 && !isUnlimited;

  return (
    <div className="space-y-3">
      {/* Plan status card */}
      <div className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Plano: {planLabel}</span>
          </div>
          <Button size="sm" className="text-sm font-bold h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" onClick={() => navigate('/planos')}>
            Ver Planos
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Produtos: {productCount}{isUnlimited ? '' : ` / ${productLimit}`}</span>
            {!isUnlimited && <span>{usagePercent}%</span>}
          </div>
          {!isUnlimited && (
            <Progress value={Math.min(usagePercent, 100)} className="h-2" />
          )}
        </div>
      </div>

      {/* Trial banner */}
      {isTrial && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Você está usando o teste gratuito de 30 dias.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Seu teste termina em <span className="font-bold text-foreground">{trialDaysRemaining} dias</span>.
              </p>
              {trialDaysRemaining <= 7 && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {trialDaysRemaining <= 3
                    ? 'Seu teste gratuito termina em breve. Escolha um plano para continuar usando o sistema.'
                    : `Seu teste gratuito termina em ${trialDaysRemaining} dias.`}
                </p>
              )}
              <Button size="sm" className="mt-3 h-8 text-xs" onClick={() => navigate('/planos')}>
                Ver Planos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription expiration alert */}
      {status === 'active' && subscriptionDaysRemaining <= 3 && subscriptionDaysRemaining > 0 && (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Seu plano expira em {subscriptionDaysRemaining} dias.
              </p>
              <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={() => navigate('/planos')}>
                Renovar Plano
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Near limit warning */}
      {isNearLimit && !isTrial && (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Você está usando quase todo o limite do seu plano.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você está usando {productCount} de {productLimit} produtos.
              </p>
              <Button size="sm" className="mt-2 h-8 text-xs" onClick={() => navigate('/planos')}>
                Atualizar Plano
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
