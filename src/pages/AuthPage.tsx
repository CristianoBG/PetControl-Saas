import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import logoImg from '@/assets/logo-icon-petcontrol.png';
import { supabase } from '@/integrations/supabase/client';
import InstallPWABanner from '@/components/pwa/InstallPWABanner';

const authSchema = z.object({
  email: z.string().trim().email('E-mail inválido').max(255, 'E-mail muito longo'),
  password: z.string().min(8, 'Sua senha precisa ter pelo menos 8 caracteres.').max(72, 'Máximo 72 caracteres'),
});

function translateAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (lower.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (lower.includes('user already registered')) return 'Este e-mail já está cadastrado.';
  if (lower.includes('weak') || lower.includes('too short')) return 'Sua senha precisa ter pelo menos 8 caracteres.';
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Muitas tentativas. Aguarde um momento.';
  if (lower.includes('signup is disabled')) return 'Cadastro desabilitado temporariamente.';
  return msg;
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, signUp } = useAuth();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) {
        toast.error('Erro ao entrar com Google. Tente novamente.');
      }
    } catch {
      toast.error('Erro ao conectar com Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === 'reset') {
      const emailResult = z.string().trim().email('E-mail inválido').safeParse(email);
      if (!emailResult.success) {
        setErrors({ email: emailResult.error.issues[0].message });
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) {
          toast.error(translateAuthError(error.message));
        } else {
          toast.success('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
          setMode('login');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof typeof errors;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = mode === 'login'
        ? await signIn(result.data.email, result.data.password)
        : await signUp(result.data.email, result.data.password);
      if (error) {
        toast.error(translateAuthError(error.message));
      } else if (mode === 'signup') {
        toast.success('Conta criada! Verifique seu e-mail.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <InstallPWABanner />
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center space-y-2 pb-4">
            <img src={logoImg} alt="PetControl" className="h-14 w-14 rounded-2xl object-contain" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">PetControl</h1>
              <p className="text-xs text-muted-foreground">Controle inteligente para seu pet shop</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth */}
            {mode !== 'reset' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {googleLoading ? 'Conectando...' : 'Continuar com Google'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
              </>
            )}

            {/* Email/Password form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="seu@email.com"
                  required
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              {mode !== 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                {loading
                  ? 'Carregando...'
                  : mode === 'login'
                  ? 'Entrar'
                  : mode === 'signup'
                  ? 'Criar conta'
                  : 'Enviar link de redefinição'}
              </Button>
            </form>

            {mode === 'login' && (
              <button
                onClick={() => setMode('reset')}
                className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueceu sua senha?
              </button>
            )}

            <button
              onClick={() => { setMode(mode === 'signup' ? 'login' : mode === 'login' ? 'signup' : 'login'); setErrors({}); }}
              className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'signup' ? 'Já tem conta? Entrar' : mode === 'login' ? 'Não tem conta? Cadastre-se' : '← Voltar para login'}
            </button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
