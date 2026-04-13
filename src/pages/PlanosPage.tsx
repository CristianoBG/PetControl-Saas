import { useState } from 'react';
import { Check, Zap, Star, Crown, CreditCard, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import AppLayout from '@/components/AppLayout';
import { KlivopayDialog } from '@/components/checkout/KlivopayDialog';
import { cn } from '@/lib/utils';

const plans = [
  {
    key: 'free',
    name: 'Free',
    icon: Zap,
    price: 0,
    period: null,
    limit: '10 produtos',
    features: [
      '10 produtos no estoque',
      'Controle de vacinas',
      'Scanner de código de barras',
      'Lembretes básicos',
    ],
    highlighted: false,
    badge: null,
    checkoutKey: null,
  },
  {
    key: 'pro',
    name: 'Pro Mensal',
    icon: Star,
    price: 49.90,
    period: 'mês',
    limit: '50 produtos',
    features: [
      '50 produtos no estoque',
      'Controle de vacinas',
      'Scanner de código de barras',
      'Lembretes por WhatsApp',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    highlighted: false,
    badge: null,
    checkoutKey: 'pro_monthly',
  },
  {
    key: 'premium_monthly',
    name: 'Premium Mensal',
    icon: Crown,
    price: 79.90,
    period: 'mês',
    limit: 'Produtos ilimitados',
    features: [
      'Produtos ilimitados',
      'Controle de vacinas',
      'Scanner de código de barras',
      'Lembretes por WhatsApp',
      'Relatórios avançados',
      'Suporte prioritário',
      'Funcionalidades exclusivas',
    ],
    highlighted: true,
    badge: '⭐ Mais Popular',
    checkoutKey: 'premium_monthly',
  },
  {
    key: 'premium_yearly',
    name: 'Premium Anual',
    icon: Crown,
    price: 699.90,
    period: 'ano',
    limit: 'Produtos ilimitados',
    features: [
      'Produtos ilimitados',
      'Controle de vacinas',
      'Scanner de código de barras',
      'Lembretes por WhatsApp',
      'Relatórios avançados',
      'Suporte prioritário',
      'Funcionalidades exclusivas',
      'Economize ~R$260 por ano',
    ],
    highlighted: false,
    badge: '💰 Melhor Custo-Benefício',
    checkoutKey: 'premium_yearly',
  },
];

export default function PlanosPage() {
  const { planType, isTrial } = useSubscription();
  const [checkout, setCheckout] = useState<{
    key: string;
    name: string;
    defaultTab: 'pix' | 'credit_card';
  } | null>(null);

  const openCheckout = (
    plan: typeof plans[number],
    tab: 'pix' | 'credit_card'
  ) => {
    if (!plan.checkoutKey) return;
    setCheckout({ key: plan.checkoutKey, name: plan.name, defaultTab: tab });
  };

  const isCurrentPlan = (planKey: string) => {
    if (isTrial) return false;
    if (planKey === 'premium_monthly' || planKey === 'premium_yearly') return planType === 'premium';
    if (planKey === 'pro') return planType === 'pro';
    return planType === planKey;
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground">Escolha seu Plano</h1>
          <p className="text-sm text-muted-foreground">
            Selecione o plano ideal para o seu pet shop
          </p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.key);

            return (
              <div
                key={plan.key}
                className={cn(
                  'relative rounded-2xl border-2 bg-card p-5 transition-all duration-300 hover:scale-[1.02]',
                  plan.highlighted
                    ? 'border-primary shadow-lg shadow-primary/10'
                    : 'border-border',
                  isCurrent && 'ring-2 ring-primary/30'
                )}
                style={{ boxShadow: plan.highlighted ? 'var(--shadow-elevated)' : 'var(--shadow-card)' }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      plan.highlighted ? 'bg-primary/15' : 'bg-muted'
                    )}>
                      <plan.icon className={cn('h-5 w-5', plan.highlighted ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.limit}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  {plan.price === 0 ? (
                    <p className="text-3xl font-extrabold text-foreground">Grátis</p>
                  ) : (
                    <p className="text-3xl font-extrabold text-foreground">
                      R${plan.price.toFixed(2).replace('.', ',')}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.period}
                      </span>
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano atual
                  </Button>
                ) : plan.price === 0 ? (
                  <Button variant="outline" className="w-full" disabled>
                    Começar Grátis
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      className={cn('w-full', plan.highlighted && 'bg-primary hover:bg-primary/90')}
                      onClick={() => openCheckout(plan, 'pix')}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Pagar com PIX
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                      onClick={() => openCheckout(plan, 'credit_card')}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar com Cartão
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Single Klivopay dialog handles both PIX and credit card */}
      <KlivopayDialog
        isOpen={!!checkout}
        onClose={() => setCheckout(null)}
        planKey={checkout?.key ?? null}
        planName={checkout?.name ?? ''}
        defaultTab={checkout?.defaultTab ?? 'pix'}
      />
    </AppLayout>
  );
}
