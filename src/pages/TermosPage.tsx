import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermosPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <h1 className="text-3xl font-extrabold text-foreground mb-8">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e utilizar o PetControl, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O PetControl é uma plataforma de gestão para pet shops que oferece controle de estoque, vacinas, lembretes por WhatsApp e relatórios. O serviço é oferecido em planos gratuitos e pagos, conforme descrito na página de planos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar o PetControl, é necessário criar uma conta com e-mail válido. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você concorda em utilizar o PetControl apenas para fins legítimos relacionados à gestão do seu pet shop. É proibido utilizar o serviço para fins ilegais, fraudulentos ou que violem direitos de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. Planos e Pagamentos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os planos pagos são cobrados conforme o ciclo escolhido (mensal ou anual). O cancelamento pode ser realizado a qualquer momento, sendo o acesso mantido até o final do período pago. Não há reembolso proporcional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo, design, código e funcionalidades do PetControl são de propriedade exclusiva da plataforma. Os dados inseridos pelo usuário permanecem de sua propriedade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O PetControl é fornecido "como está". Não garantimos disponibilidade ininterrupta do serviço. Não nos responsabilizamos por perdas ou danos indiretos decorrentes do uso da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">8. Alterações nos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de alterar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação no sistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">9. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail: vexoz.oficial@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
