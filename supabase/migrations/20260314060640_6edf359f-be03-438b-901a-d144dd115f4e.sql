-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a database function to handle subscription downgrades
CREATE OR REPLACE FUNCTION public.downgrade_expired_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
  affected2 integer;
BEGIN
  UPDATE public.user_subscriptions
  SET plan_type = 'free',
      subscription_status = 'expired',
      product_limit = 10,
      updated_at = now()
  WHERE subscription_status = 'trial'
    AND trial_expires_at IS NOT NULL
    AND trial_expires_at < now();

  GET DIAGNOSTICS affected = ROW_COUNT;

  UPDATE public.user_subscriptions
  SET plan_type = 'free',
      subscription_status = 'expired',
      product_limit = 10,
      billing_cycle = NULL,
      updated_at = now()
  WHERE subscription_status = 'active'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at < now();

  GET DIAGNOSTICS affected2 = ROW_COUNT;

  RETURN affected + affected2;
END;
$$;