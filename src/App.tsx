import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useAdmin } from "@/hooks/useAdmin";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const TermosPage = lazy(() => import("./pages/TermosPage"));
const PrivacidadePage = lazy(() => import("./pages/PrivacidadePage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ScannerPage = lazy(() => import("./pages/ScannerPage"));
const EstoquePage = lazy(() => import("./pages/EstoquePage"));
const VacinasPage = lazy(() => import("./pages/VacinasPage"));
const PetProfilePage = lazy(() => import("./pages/PetProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const RelatoriosPage = lazy(() => import("./pages/RelatoriosPage"));
const PlanosPage = lazy(() => import("./pages/PlanosPage"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,  // 2 minutos — evita refetch desnecessário no window focus
      gcTime:    1000 * 60 * 10, // 10 minutos — mantém cache na memória
      retry: 1,
    },
  },
});

function AppRoutes() {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const fallback = (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (loading || (user && adminLoading)) {
    return fallback;
  }

  if (!user) {
    return (
      <Suspense fallback={fallback}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/termos" element={<TermosPage />} />
          <Route path="/privacidade" element={<PrivacidadePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (isAdmin) {
    return (
      <Suspense fallback={fallback}>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <Routes>
        {/* Rotas de transição e planos (Sempre acessíveis se logado) */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/planos" element={<PlanosPage />} />
        <Route path="/termos" element={<TermosPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />

        {/* Rotas Protegidas por Assinatura */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/scanner" element={<ProtectedRoute><ScannerPage /></ProtectedRoute>} />
        <Route path="/estoque" element={<ProtectedRoute><EstoquePage /></ProtectedRoute>} />
        <Route path="/vacinas" element={<ProtectedRoute><VacinasPage /></ProtectedRoute>} />
        <Route path="/pet/:petKey" element={<ProtectedRoute><PetProfilePage /></ProtectedRoute>} />
        <Route path="/ajustes" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />

        <Route path="/lembretes" element={<Navigate to="/dashboard" replace />} />
        {/* /admin só acessível por admins — usuários normais são redirecionados */}
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
        
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
