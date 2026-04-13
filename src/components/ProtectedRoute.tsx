import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useConfig } from '@/hooks/useConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { status, isActive, isLoading: subLoading } = useSubscription();
  const { config, isLoading: configLoading } = useConfig();
  const location = useLocation();

  if (authLoading || subLoading || configLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Fonte Única da Verdade: se não estiver 'active' (ou 'trial'), bloqueia
  // A lógica de expiração (current_period_end < NOW) já é contemplada no 'isActive' do useSubscription
  if (!isActive) {
    console.warn(`[SaaS Security] Bloqueio de acesso para usuário ${user.id}. Status: ${status}`);
    return <Navigate to="/planos" replace />;
  }

  // Obriga usuários novos a passarem pela tela de boas-vindas
  if (config && !config.nome_usuario && location.pathname !== '/welcome') {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}
