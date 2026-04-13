
-- Step 1: Drop ALL policies that depend on has_role(uuid, app_role)
DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can view all configs" ON public.configuracoes;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;

-- Step 2: Drop old function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Step 3: Create new has_role with single parameter
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(app_role) TO authenticated;

-- Step 4: Recreate all policies with new signature
CREATE POLICY "Admins can view logs" ON public.admin_logs FOR SELECT TO authenticated USING (has_role('admin'::app_role));
CREATE POLICY "Admins can insert logs" ON public.admin_logs FOR INSERT TO authenticated WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "Admins can view all configs" ON public.configuracoes FOR SELECT TO authenticated USING (has_role('admin'::app_role));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role('admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role('admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role('admin'::app_role));
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions FOR SELECT TO authenticated USING (has_role('admin'::app_role));
