import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacidadePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <h1 className="text-3xl font-extrabold text-foreground mb-8">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Informações que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coletamos as seguintes informações: e-mail de cadastro, nome do pet shop, dados de estoque (produtos, validades, quantidades), dados de vacinas (nome do pet, dono, WhatsApp, datas) e logs de atividades na plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. Como Utilizamos seus Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados são utilizados exclusivamente para: fornecer e melhorar o serviço do PetControl, enviar lembretes de vacinas via WhatsApp (conforme configurado por você), gerar relatórios de gestão e comunicações sobre o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. Proteção dos Dados (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), implementamos medidas técnicas e organizacionais para proteger seus dados pessoais, incluindo criptografia em trânsito e em repouso, controle de acesso baseado em funções e políticas de segurança em nível de linha (RLS).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. Dados podem ser compartilhados apenas com provedores de infraestrutura necessários para operar o serviço, sempre sob contratos de proteção de dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conforme a LGPD, você tem direito a: acessar seus dados pessoais, corrigir dados incompletos ou desatualizados, solicitar a exclusão de seus dados, revogar o consentimento para o tratamento de dados e solicitar a portabilidade dos dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">6. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, todos os dados pessoais serão removidos permanentemente em até 30 dias, exceto quando houver obrigação legal de retenção.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">7. Cookies e Armazenamento Local</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos armazenamento local (localStorage) apenas para manter sua sessão de autenticação ativa. Não utilizamos cookies de rastreamento de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">8. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações significativas por e-mail ou notificação no sistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">9. Contato do Encarregado de Dados (DPO)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para questões relacionadas à privacidade e proteção de dados, entre em contato: vexoz.oficial@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
