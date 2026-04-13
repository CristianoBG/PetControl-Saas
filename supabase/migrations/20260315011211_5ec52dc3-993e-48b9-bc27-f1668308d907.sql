
-- Update all admin functions to use new has_role(app_role) signature

CREATE OR REPLACE FUNCTION public.admin_change_plan(target_user uuid, new_plan text, new_limit integer)
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
  SET plan_type = new_plan, product_limit = new_limit, subscription_status = 'active', updated_at = now()
  WHERE user_id = target_user;
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'change_plan', target_user, 'Plano alterado para ' || new_plan);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  DELETE FROM public.estoque WHERE user_id = target_user;
  DELETE FROM public.vacinas WHERE user_id = target_user;
  DELETE FROM public.atividades WHERE user_id = target_user;
  DELETE FROM public.perdas WHERE user_id = target_user;
  DELETE FROM public.inventory_movements WHERE user_id = target_user;
  DELETE FROM public.historico_mensagens WHERE user_id = target_user;
  DELETE FROM public.produtos_catalogo WHERE user_id = target_user;
  DELETE FROM public.configuracoes WHERE user_id = target_user;
  DELETE FROM public.user_subscriptions WHERE user_id = target_user;
  DELETE FROM public.user_roles WHERE user_id = target_user;
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'delete_user', target_user, 'Conta excluída permanentemente');
  DELETE FROM auth.users WHERE id = target_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_force_activate(target_user uuid)
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
  SET subscription_status = 'active', subscription_expires_at = now() + interval '30 days', updated_at = now()
  WHERE user_id = target_user;
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'force_activate', target_user, 'Assinatura ativada por 30 dias');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  IF NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users', (SELECT COUNT(*) FROM public.user_subscriptions WHERE subscription_status IN ('active', 'trial')),
    'new_today', (SELECT COUNT(*) FROM auth.users WHERE created_at::date = CURRENT_DATE)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user_dashboard(target_user uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  IF NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT json_build_object(
    'config', (SELECT row_to_json(c) FROM public.configuracoes c WHERE c.user_id = target_user LIMIT 1),
    'subscription', (SELECT row_to_json(s) FROM public.user_subscriptions s WHERE s.user_id = target_user LIMIT 1),
    'estoque_count', (SELECT COUNT(*) FROM public.estoque WHERE user_id = target_user),
    'vacinas_count', (SELECT COUNT(*) FROM public.vacinas WHERE user_id = target_user),
    'perdas_count', (SELECT COUNT(*) FROM public.perdas WHERE user_id = target_user),
    'recent_activities', (SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json) FROM (SELECT * FROM public.atividades WHERE user_id = target_user ORDER BY created_at DESC LIMIT 10) a),
    'estoque', (SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json) FROM (SELECT * FROM public.estoque WHERE user_id = target_user ORDER BY created_at DESC LIMIT 20) e),
    'vacinas', (SELECT COALESCE(json_agg(row_to_json(v)), '[]'::json) FROM (SELECT * FROM public.vacinas WHERE user_id = target_user ORDER BY created_at DESC LIMIT 20) v)
  ) INTO result;
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'impersonate', target_user, 'Visualização de dados do usuário');
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email::TEXT, u.created_at, u.last_sign_in_at
  FROM auth.users u
  WHERE public.has_role('admin'::app_role)
  ORDER BY u.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_user_data(target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  DELETE FROM public.estoque WHERE user_id = target_user;
  DELETE FROM public.vacinas WHERE user_id = target_user;
  DELETE FROM public.atividades WHERE user_id = target_user;
  DELETE FROM public.perdas WHERE user_id = target_user;
  DELETE FROM public.inventory_movements WHERE user_id = target_user;
  DELETE FROM public.historico_mensagens WHERE user_id = target_user;
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'reset_data', target_user, 'Dados do usuário resetados');
END;
$$;
