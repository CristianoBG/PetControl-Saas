import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { differenceInDays, addDays } from 'date-fns';

export type PlanType = 'trial' | 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';
export type BillingCycle = 'monthly' | 'yearly' | null;

export interface SubscriptionData {
  id: string;
  user_id: string;
  plan_type: PlanType;
  subscription_status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  trial_expires_at: string | null;
  subscription_expires_at: string | null;
  product_limit: number | null;
  created_at: string;
  updated_at: string;
}

export const PLAN_LIMITS: Record<string, number | null> = {
  trial: 50,
  free: 10,
  pro: 50,
  premium: null,
};

export const PLAN_LABELS: Record<string, string> = {
  trial: 'Teste Grátis',
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Query principal: apenas leitura, sem efeitos colaterais ─────────────────
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id ?? ''],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionData | null;
    },
    enabled: !!user,
  });

  // ── Mutation: criar trial (separado do queryFn) ──────────────────────────────
  const ensureTrial = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const trialExpires = addDays(new Date(), 7).toISOString();
      const { error } = await supabase.from('user_subscriptions').insert({
        user_id: user.id,
        plan_type: 'trial',
        subscription_status: 'trial',
        trial_expires_at: trialExpires,
        product_limit: 50,
      });
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  });

  // ── Mutation: self-healing (separado do queryFn) ─────────────────────────────
  const syncSubscription = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('sync_subscription');
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  });

  // Cria trial se não existe ainda — efeito controlado fora do queryFn
  useEffect(() => {
    if (!isLoading && user && subscription === null) {
      ensureTrial.mutate();
    }
  }, [isLoading, user, subscription]); // eslint-disable-line react-hooks/exhaustive-deps

  // Self-healing: se inativo mas tem pagamento aprovado
  useEffect(() => {
    if (!user || !subscription || subscription.subscription_status === 'active') return;
    const check = async () => {
      const { data: paidTx } = await supabase
        .from('payment_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .limit(1)
        .maybeSingle();
      if (paidTx) {
        console.warn('[SaaS Resilience] Inconsistência detectada — acionando sync_subscription');
        syncSubscription.mutate();
      }
    };
    check();
  }, [user?.id, subscription?.subscription_status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Valores derivados ────────────────────────────────────────────────────────
  const planType = (subscription?.plan_type || 'free') as PlanType;
  const dbStatus = (subscription?.subscription_status || 'expired') as SubscriptionStatus;

  const isExpired = subscription?.subscription_expires_at
    ? new Date(subscription.subscription_expires_at) < new Date()
    : false;

  const status = isExpired ? 'expired' : dbStatus;
  const productLimit = subscription?.product_limit ?? PLAN_LIMITS[planType] ?? 10;
  const isUnlimited = productLimit === null || planType === 'premium';
  const isTrial = status === 'trial';
  const isActive = (status === 'active' || isTrial) && !isExpired;

  let trialDaysRemaining = 0;
  if (isTrial && subscription?.trial_expires_at) {
    trialDaysRemaining = Math.max(0, differenceInDays(new Date(subscription.trial_expires_at), new Date()));
  }

  let subscriptionDaysRemaining = 0;
  if (status === 'active' && subscription?.subscription_expires_at) {
    subscriptionDaysRemaining = Math.max(0, differenceInDays(new Date(subscription.subscription_expires_at), new Date()));
  }

  const updateSubscription = useMutation({
    mutationFn: async (updates: Partial<Omit<SubscriptionData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user || !subscription) throw new Error('No subscription');
      const { error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription'] }),
  });

  return {
    subscription: subscription ? { ...subscription, subscription_status: status } : null,
    isLoading,
    planType,
    status,
    productLimit,
    isUnlimited,
    isTrial,
    isActive,
    isExpired,
    trialDaysRemaining,
    subscriptionDaysRemaining,
    updateSubscription,
    planLabel: PLAN_LABELS[planType] || 'Free',
  };
}
