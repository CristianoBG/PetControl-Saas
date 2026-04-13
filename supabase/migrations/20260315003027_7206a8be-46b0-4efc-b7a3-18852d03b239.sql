-- Fix: constrain trial_expires_at to max 14 days from now
DROP POLICY IF EXISTS "Users can create initial subscription" ON public.user_subscriptions;

CREATE POLICY "Users can create initial subscription" ON public.user_subscriptions 
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id 
    AND plan_type = 'trial' 
    AND subscription_status = 'trial'
    AND product_limit = 50
    AND (trial_expires_at IS NULL OR trial_expires_at <= now() + interval '14 days')
    AND subscription_expires_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = auth.uid())
  );