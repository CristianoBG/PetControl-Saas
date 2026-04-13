-- Migration: SaaS Production Hardened (Logs & RLS Security)
-- Implementa rastreabilidade e segurança real server-side.

-- 1. Tabela de Logs de Assinatura
CREATE TABLE IF NOT EXISTS public.subscription_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'activated', 'expired', 'payment_failed', 'renewed', 'sync'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nos logs (apenas admin e o próprio usuário podem ver seus logs)
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.subscription_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Função de Validação Server-Side (A fonte única da verdade no SQL)
CREATE OR REPLACE FUNCTION public.is_subscription_active()
RETURNS BOOLEAN AS $$
DECLARE
    is_active BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = auth.uid()
        AND (subscription_status = 'active' OR subscription_status = 'trial')
        AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
    ) INTO is_active;
    RETURN is_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Aplicar Segurança Hardened em Tabelas Críticas (RLS)
-- Nota: Isso garante que o usuário não consiga gravar dados se não estiver pago.

-- Tabela: estoque
DROP POLICY IF EXISTS "Users can insert own stock if active" ON public.estoque;
CREATE POLICY "Users can insert own stock if active" ON public.estoque
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_subscription_active());

DROP POLICY IF EXISTS "Users can update own stock if active" ON public.estoque;
CREATE POLICY "Users can update own stock if active" ON public.estoque
    FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_subscription_active());

-- Tabela: vacinas
DROP POLICY IF EXISTS "Users can insert own vaccines if active" ON public.vacinas;
CREATE POLICY "Users can insert own vaccines if active" ON public.vacinas
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_subscription_active());

DROP POLICY IF EXISTS "Users can update own vaccines if active" ON public.vacinas;
CREATE POLICY "Users can update own vaccines if active" ON public.vacinas
    FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_subscription_active());

-- 4. Função de Auto-Correção (Self-Healing RPC)
-- Permite que o frontend peça uma re-sincronização segura se detectar inconsistências.
CREATE OR REPLACE FUNCTION public.sync_subscription()
RETURNS JSONB AS $$
DECLARE
    user_id UUID := auth.uid();
    paid_transaction RECORD;
    plan_text TEXT;
    expires_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Procurar a transação paga mais recente que não foi processada (ou que o webhook falhou)
    SELECT * INTO paid_transaction 
    FROM public.payment_transactions 
    WHERE user_id = user_id 
    AND status = 'paid' 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF paid_transaction IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'No paid transaction found');
    END IF;

    -- Se encontramos um pagamento mas a assinatura está inativa, corrigimos.
    IF NOT EXISTS (
        SELECT 1 FROM public.user_subscriptions 
        WHERE user_id = user_id AND subscription_status = 'active'
    ) THEN
        plan_text := CASE 
            WHEN paid_transaction.plan_type LIKE '%premium%' THEN 'premium' 
            ELSE 'pro' 
        END;

        expires_date := CASE 
            WHEN paid_transaction.plan_type LIKE '%yearly%' THEN now() + interval '1 year'
            WHEN paid_transaction.plan_type LIKE '%lifetime%' THEN now() + interval '99 years'
            ELSE now() + interval '1 month'
        END;

        UPDATE public.user_subscriptions 
        SET 
            plan_type = plan_text,
            subscription_status = 'active',
            subscription_expires_at = expires_date,
            updated_at = now()
        WHERE user_id = user_id;

        INSERT INTO public.subscription_logs (user_id, action, metadata)
        VALUES (user_id, 'sync', jsonb_build_object('reason', 'Self-healing triggered', 'tx_id', paid_transaction.id));

        RETURN jsonb_build_object('ok', true, 'action', 'activated', 'plan', plan_text);
    END IF;

    RETURN jsonb_build_object('ok', true, 'reason', 'Already active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para Auditoria Automática de Mudança de Status
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) THEN
        INSERT INTO public.subscription_logs (user_id, action, metadata)
        VALUES (NEW.user_id, 'status_changed', 
            jsonb_build_object(
                'old_status', OLD.subscription_status, 
                'new_status', NEW.subscription_status,
                'plan', NEW.plan_type
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_subscription_change
    AFTER UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_subscription_change();

-- 7. Criar índice para performance de Logs
CREATE INDEX IF NOT EXISTS idx_subscription_logs_user ON public.subscription_logs(user_id);


