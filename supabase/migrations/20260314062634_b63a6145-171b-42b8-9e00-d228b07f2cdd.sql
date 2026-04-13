
-- 1. Fix RLS policies: change {public} to {authenticated} for vacinas, estoque, configuracoes

-- VACINAS: drop public policies and recreate as authenticated
DROP POLICY IF EXISTS "Users can view own vacinas" ON public.vacinas;
DROP POLICY IF EXISTS "Users can insert own vacinas" ON public.vacinas;
DROP POLICY IF EXISTS "Users can update own vacinas" ON public.vacinas;
DROP POLICY IF EXISTS "Users can delete own vacinas" ON public.vacinas;

CREATE POLICY "Users can view own vacinas" ON public.vacinas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vacinas" ON public.vacinas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vacinas" ON public.vacinas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vacinas" ON public.vacinas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ESTOQUE: drop public policies and recreate as authenticated
DROP POLICY IF EXISTS "Users can view own estoque" ON public.estoque;
DROP POLICY IF EXISTS "Users can insert own estoque" ON public.estoque;
DROP POLICY IF EXISTS "Users can update own estoque" ON public.estoque;
DROP POLICY IF EXISTS "Users can delete own estoque" ON public.estoque;

CREATE POLICY "Users can view own estoque" ON public.estoque FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own estoque" ON public.estoque FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own estoque" ON public.estoque FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own estoque" ON public.estoque FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CONFIGURACOES: drop public policies and recreate as authenticated
DROP POLICY IF EXISTS "Users can view own config" ON public.configuracoes;
DROP POLICY IF EXISTS "Users can insert own config" ON public.configuracoes;
DROP POLICY IF EXISTS "Users can update own config" ON public.configuracoes;

CREATE POLICY "Users can view own config" ON public.configuracoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own config" ON public.configuracoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own config" ON public.configuracoes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 2. Fix subscription privilege escalation: remove user INSERT/UPDATE, keep only backend/admin
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

-- Create restricted INSERT policy that only allows initial trial creation
CREATE POLICY "Users can create initial subscription" ON public.user_subscriptions 
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id 
    AND plan_type = 'trial' 
    AND subscription_status = 'trial'
    AND product_limit = 50
    AND NOT EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = auth.uid())
  );

-- No user UPDATE policy - subscriptions managed only by backend/admin functions
