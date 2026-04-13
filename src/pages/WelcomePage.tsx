import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConfig } from '@/hooks/useConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PawPrint } from 'lucide-react';
import { toast } from 'sonner';

export default function WelcomePage() {
  const { user } = useAuth();
  const { config, upsertConfig } = useConfig();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  // Redireciona usuários que já preencheram o nome para fora da welcome page
  useEffect(() => {
    if (config?.nome_usuario) {
      navigate('/dashboard', { replace: true });
    }
  }, [config, navigate]);

  const handleSave = async () => {
    const trimmed = nome.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await upsertConfig.mutateAsync({
        nome_petshop: 'Meu Pet Shop',
        nome_usuario: trimmed,
      });
      toast.success('Bem-vindo(a)!');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <PawPrint className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Bem-vindo(a) ao PetControl! 🐾
          </h1>
          <p className="text-sm text-muted-foreground">
            Como você gostaria de ser chamado(a)?
          </p>
        </div>

        <div className="space-y-4">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="text-center text-lg h-12"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button
            onClick={handleSave}
            disabled={!nome.trim() || saving}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            <PawPrint className="h-5 w-5" />
            {saving ? 'Salvando...' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}