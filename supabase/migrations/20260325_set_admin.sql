-- Migration: Set Admin User
-- Role: admin
-- Target User: vexoz.oficial@gmail.com

-- 1. Garante que o usuário exista na tabela de roles com a role 'admin'
-- Buscamos o ID do usuário pelo e-mail na tabela auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'vexoz.oficial@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. (Opcional) Log da ação se houver uma tabela de logs que aceite inserts manuais
-- INSERT INTO public.admin_logs (action, details)
-- VALUES ('setup_admin', 'Definido vexoz.oficial@gmail.com como administrador via migration');
