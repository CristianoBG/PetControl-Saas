-- Migration: SaaS Evolution (Robust Subscriptions & Payments)
-- Evolui as tabelas existentes para garantir segurança e lógica de SaaS.

-- 1. Garantir idempotência e índices
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_transaction_hash_key;
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_transaction_hash_key UNIQUE (transaction_hash);

CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payment_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_expires ON public.user_subscriptions(subscription_expires_at);

-- 2. Garantir estados permitidos em user_subscriptions
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_status_check 
CHECK (subscription_status IN ('pending', 'active', 'past_due', 'canceled', 'trial', 'expired'));

-- 3. Garantir estados permitidos em payment_transactions
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_status_check;
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_status_check 
CHECK (status IN ('pending', 'paid', 'failed', 'refunded'));
