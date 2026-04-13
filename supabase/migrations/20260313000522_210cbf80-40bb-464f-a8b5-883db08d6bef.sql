CREATE OR REPLACE FUNCTION public.admin_get_user_dashboard(target_user uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
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