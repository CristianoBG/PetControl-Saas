import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConfig } from '@/hooks/useConfig';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { InstallAppButton } from '@/components/pwa/InstallAppButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Save, Upload, Palette, BarChart3, ChevronRight, MessageSquare, Bell, Mail, Bot, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DEFAULT_TEMPLATE } from '@/lib/vacinas';
import { normalizePhone } from '@/lib/phone';

const THEME_COLORS = [
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Índigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
];

const AVISO_OPTIONS = [
  { value: 0, label: 'No dia exato' },
  { value: 3, label: '3 dias antes' },
  { value: 7, label: '7 dias antes' },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { config, upsertConfig } = useConfig();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [temaCor, setTemaCor] = useState('#10B981');
  const [whatsapp, setWhatsapp] = useState('');
  const [templateMsg, setTemplateMsg] = useState(DEFAULT_TEMPLATE);
  const [diasAviso, setDiasAviso] = useState(7);
  const [assistenteAtivo, setAssistenteAtivo] = useState(true);
  const [showTemplate, setShowTemplate] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (config) {
      setNome(config.nome_petshop);
      setNomeUsuario(config.nome_usuario || '');
      setTemaCor(config.tema_cor || '#10B981');
      setWhatsapp(config.whatsapp || '');
      setTemplateMsg(config.template_mensagem || DEFAULT_TEMPLATE);
      setDiasAviso(config.dias_aviso_antecipado ?? 7);
      setAssistenteAtivo(config.assistente_ativo !== false);
    }
  }, [config]);

  const handleSave = async () => {
    const nomeFinal = nome.trim() || 'Meu Pet Shop';
    try {
      await upsertConfig.mutateAsync({
        nome_petshop: nomeFinal,
        tema_cor: temaCor,
        whatsapp: normalizePhone(whatsapp) || null,
        nome_usuario: nomeUsuario.trim() || null,
        template_mensagem: templateMsg.trim() || DEFAULT_TEMPLATE,
        dias_aviso_antecipado: diasAviso,
        assistente_ativo: assistenteAtivo,
      });
      toast.success('Configurações salvas!');
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/logo.${ext}`;
      await supabase.storage.from('logos').remove([path]).catch(() => {});
      const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('logos').getPublicUrl(path);
      await upsertConfig.mutateAsync({
        nome_petshop: nome.trim() || 'Meu Pet Shop',
        tema_cor: temaCor,
        logo_url: data.publicUrl,
        whatsapp: normalizePhone(whatsapp) || null,
      });
      toast.success('Logo atualizado!');
    } catch {
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Ajustes</h2>

        {/* Identidade Visual */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Palette className="h-4 w-4" /> Identidade Visual
          </h3>
          <div className="space-y-1.5">
            <Label className="text-xs">Logo do Pet Shop</Label>
            <div className="flex items-center gap-3">
              {config?.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="h-14 w-14 rounded-xl object-cover border border-border" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground text-lg">🏪</div>
              )}
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Enviando...' : 'Enviar Logo'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cor do Tema</Label>
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTemaCor(c.value)}
                  className={`h-8 w-8 rounded-full transition-all ${temaCor === c.value ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Perfil */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Perfil</h3>
          <div className="space-y-1.5">
            <Label className="text-xs">Seu Nome</Label>
            <Input value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} placeholder="Como quer ser chamado(a)" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nome do Pet Shop</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Meu Pet Shop" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Meu WhatsApp</Label>
            <Input 
              value={whatsapp} 
              onChange={(e) => setWhatsapp(e.target.value)} 
              placeholder="+55 11 99999-9999" 
              inputMode="tel" 
            />
            <p className="text-[10px] text-muted-foreground">Para receber alertas e notificações</p>
          </div>
        </div>

        {/* Template de Mensagem */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowTemplate((v) => !v)}
            className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span className="text-lg leading-none">💬</span> Template
            </h3>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                showTemplate ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showTemplate && (
            <div className="space-y-3 px-4 pb-4">
              <Textarea
                value={templateMsg}
                onChange={(e) => setTemplateMsg(e.target.value)}
                rows={4}
                className="text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {['{nome_pet}', '{nome_dono}', '{tipo_vacina}', '{data}', '{nome_petshop}'].map((tag) => (
                  <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{tag}</span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Use os placeholders acima para personalizar a mensagem</p>
            </div>
          )}
        </div>


        {/* Assistente Dr. Pata */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Bot className="h-4 w-4" /> Assistente Dr. Pata
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Mascote inteligente</p>
              <p className="text-[10px] text-muted-foreground">Exibe alertas e atalhos na tela</p>
            </div>
            <Switch checked={assistenteAtivo} onCheckedChange={setAssistenteAtivo} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={upsertConfig.isPending} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {upsertConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>

        {/* Aplicativo PWA */}
        <InstallAppButton />

        {/* Relatórios */}
        <button
          onClick={() => navigate('/relatorios')}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground">Relatórios</h3>
              <p className="text-xs text-muted-foreground">Perdas e histórico de ações</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Contato WhatsApp */}
        <a
          href="https://wa.me/5517991243282"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <MessageSquare className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground">Contato</h3>
              <p className="text-xs text-muted-foreground">Fale conosco pelo WhatsApp</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </a>

        {/* E-mail */}
        <a
          href="mailto:vexoz.oficial@gmail.com?subject=Contato%20PetControl"
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground">E-mail</h3>
              <p className="text-xs text-muted-foreground">Cancelamento, estorno ou sugestões</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </a>

        {/* Conta */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Conta</h3>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="outline" onClick={signOut} className="w-full gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
