
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Delete all user data from public tables
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

  -- Log before deleting user
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'delete_user', target_user, 'Conta excluída permanentemente');

  -- Delete from auth.users (cascade)
  DELETE FROM auth.users WHERE id = target_user;
END;
$$;
