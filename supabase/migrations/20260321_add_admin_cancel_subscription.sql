CREATE OR REPLACE FUNCTION public.admin_cancel_subscription(target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE public.user_subscriptions
  SET subscription_status = 'cancelled', updated_at = now()
  WHERE user_id = target_user;
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'cancel_subscription', target_user, 'Conta desativada (exclusão normal)');
END;
$$;
