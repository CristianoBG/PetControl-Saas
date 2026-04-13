
-- Fix: Remove NULL branch from trial_expires_at, require explicit expiration
DROP POLICY IF EXISTS "Users can create initial subscription" ON public.user_subscriptions;

CREATE POLICY "Users can create initial subscription"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND plan_type = 'trial'
  AND subscription_status = 'trial'
  AND product_limit = 50
  AND trial_expires_at > now()
  AND trial_expires_at <= (now() + interval '14 days')
  AND subscription_expires_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us WHERE us.user_id = auth.uid()
  )
);
