import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Syringe, Package, MessageCircle, Camera, Users, CheckCircle, ArrowRight, PawPrint, Menu, X, Shield, Clock, Smartphone, CreditCard, Zap, Lock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoIcon from '@/assets/logo-icon-petcontrol.png';
import SystemShowcase from '@/components/landing/SystemShowcase';
import PainPoints from '@/components/landing/PainPoints';
import InteractiveDemo from '@/components/landing/InteractiveDemo';
import VaccineSimulator from '@/components/landing/VaccineSimulator';
import AnimatedCounters from '@/components/landing/AnimatedCounters';
import WhatsAppSimulation from '@/components/landing/WhatsAppSimulation';
import AnimatedFlow from '@/components/landing/AnimatedFlow';
import PetTimeline from '@/components/landing/PetTimeline';
import FloatingPaws from '@/components/landing/FloatingPaws';
import DogEntrance from '@/components/landing/DogEntrance';
import DrPata from '@/components/landing/DrPata';
import Testimonials from '@/components/landing/Testimonials';
import ScrollReveal from '@/components/landing/ScrollReveal';
import FAQ from '@/components/landing/FAQ';
import InstallPWABanner from '@/components/pwa/InstallPWABanner';

const navLinks = [
  { label: 'Início', href: '#inicio' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Planos', href: '#planos' },
  { label: 'Contato', href: '#contato' },
];


const features = [
  { icon: Syringe, title: 'Controle de Vacinas', desc: 'Registre doses, próximas datas e histórico completo de cada pet.' },
  { icon: Package, title: 'Estoque com Alertas', desc: 'Monitore validades com semáforo visual e alertas automáticos.' },
  { icon: MessageCircle, title: 'Lembretes por WhatsApp', desc: 'Envie mensagens prontas para os donos sobre vacinas pendentes.' },
  { icon: Camera, title: 'Scanner de Barras', desc: 'Cadastre produtos rapidamente escaneando a embalagem.' },
  { icon: Users, title: 'Clientes e Pets', desc: 'Cadastro completo de clientes com vínculo aos seus pets.' },
];

const steps = [
  { num: '1', title: 'Crie sua conta', desc: 'Cadastro rápido e gratuito em menos de 1 minuto.' },
  { num: '2', title: 'Configure seu pet shop', desc: 'Adicione seu logo, nome e personalize o sistema.' },
  { num: '3', title: 'Comece a gerenciar', desc: 'Cadastre vacinas, estoque e envie lembretes facilmente.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden" id="inicio">
      <InstallPWABanner />
      <FloatingPaws />
      <DogEntrance />
      <DrPata />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="PetControl" className="h-12 w-12 object-contain" />
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              Pet<span className="text-primary">Control</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => scrollTo(link.href)} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
            <Button onClick={() => navigate('/login')} className="gap-1">
              Criar Conta Grátis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-card px-4 py-4 md:hidden animate-fade-in">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <button key={link.href} onClick={() => scrollTo(link.href)} className="text-left text-sm font-medium text-muted-foreground py-2">
                  {link.label}
                </button>
              ))}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="ghost" className="flex-1" onClick={() => navigate('/login')}>Entrar</Button>
                <Button className="flex-1" onClick={() => navigate('/login')}>Criar Conta</Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Persuasive */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-32 lg:py-40">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" /> Gestão profissional para seu pet shop
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl max-w-4xl leading-[1.1]">
              Pare de perder dinheiro com{' '}
              <span className="text-primary relative">
                produtos vencidos
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8C50 2 150 2 298 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                </svg>
              </span>{' '}
              e traga seus clientes de volta.
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl max-w-2xl leading-relaxed">
              Organize seu estoque automaticamente e envie lembretes de vacina pelo WhatsApp no momento certo. Simples, rápido e feito para lucrar mais.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row pt-2">
              <Button size="lg" className="gap-2 text-base px-8 h-14 text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold" onClick={() => navigate('/login')}>
                Quero parar de perder dinheiro <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-base h-14 text-lg px-8" onClick={() => scrollTo('#funcionalidades')}>
                Ver como funciona
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Leva menos de 1 minuto</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Cancele quando quiser</span>
            </div>

            <p className="text-xs text-muted-foreground/70 mt-2 italic max-w-lg">
              Criado especialmente para pet shops que ainda controlam vacinas em caderno ou planilha.
            </p>
          </div>
        </div>
      </section>

      {/* Pain Points + Solution */}
      <PainPoints />

      {/* Antes vs Depois - Bloco de Conversão Rápida */}
      <section className="py-12 bg-primary/5">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-destructive/20 bg-background p-8">
              <h3 className="text-xl font-bold text-destructive mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5" /> SEM PetControl
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">❌ Produtos vencem no fundo da prateleira</li>
                <li className="flex items-center gap-2">❌ Clientes esquecem de voltar e não dão lucro</li>
                <li className="flex items-center gap-2">❌ Caos e furos no estoque com controle manual</li>
                <li className="flex items-center gap-2">❌ Aquela sensação de "estou perdendo dinheiro"</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-background p-8 shadow-xl shadow-primary/5">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> COM PetControl
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">✅ Alertas automáticos antes do vencimento</li>
                <li className="flex items-center gap-2">✅ Clientes fidelizados com avisos no WhatsApp</li>
                <li className="flex items-center gap-2">✅ Controle total do seu lucro em um só lugar</li>
                <li className="flex items-center gap-2">✅ Tranquilidade de um pet shop profissional</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Counters */}
      <AnimatedCounters />

      {/* Interactive Demo */}
      <InteractiveDemo />

      {/* System Showcase */}
      <SystemShowcase />

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-16 md:py-24 bg-card border-y border-border">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">Funcionalidades</h2>
              <p className="mt-3 text-muted-foreground text-lg">Tudo que seu pet shop precisa em um só lugar</p>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 100}>
                <div className="group rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 h-full">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <f.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Flow */}
      <AnimatedFlow />

      {/* Vaccine Simulator */}
      <VaccineSimulator />

      {/* Pet Timeline */}
      <PetTimeline />

      {/* WhatsApp Simulation */}
      <WhatsAppSimulation />

      {/* Testimonials */}
      <Testimonials />

      {/* Como funciona */}
      <section id="como-funciona" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">Como funciona</h2>
              <p className="mt-3 text-muted-foreground text-lg">Comece a usar em 3 passos simples</p>
            </div>
          </ScrollReveal>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 150}>
                <div className="text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-extrabold shadow-lg shadow-primary/20">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Por que escolher */}
      <section className="py-20 md:py-28 bg-card border-y border-border">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">Por que escolher o PetControl?</h2>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Shield, title: 'Seguro e confiável', desc: 'Seus dados protegidos com criptografia de ponta.' },
              { icon: Smartphone, title: 'Mobile-first', desc: 'Funciona perfeitamente no celular ou computador.' },
              { icon: Clock, title: 'Economize tempo', desc: 'Automatize tarefas repetitivas e foque no que importa.' },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg hover:-translate-y-1 h-full">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">Planos Sustentáveis</h2>
              <p className="mt-3 text-muted-foreground text-lg">O investimento que se paga sozinho ao evitar a perda de um único produto.</p>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-semibold text-foreground"><CheckCircle className="h-4 w-4 text-primary" /> Cancele quando quiser</span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground"><CheckCircle className="h-4 w-4 text-primary" /> Sem contrato</span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground"><CheckCircle className="h-4 w-4 text-primary" /> Comece grátis</span>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {[
              { name: 'Free', price: 'R$ 0', period: '', limit: 'Até 10 produtos', features: ['10 produtos no estoque', 'Controle de vacinas', 'Scanner de código de barras', 'Lembretes básicos'], cta: 'Começar grátis', highlight: false, badge: null },
              { name: 'Pro Mensal', price: 'R$ 49,90', period: '/mês', limit: 'Até 50 produtos', features: ['50 produtos no estoque', 'Controle de vacinas', 'Scanner de código de barras', 'Lembretes por WhatsApp', 'Relatórios avançados', 'Suporte prioritário'], cta: 'Parar de perder dinheiro', highlight: false, badge: 'Melhor para Iniciantes' },
              { name: 'Premium Mensal', price: 'R$ 79,90', period: '/mês', limit: 'Produtos ilimitados', features: ['Produtos ilimitados', 'Controle de vacinas', 'Scanner de código de barras', 'Lembretes por WhatsApp', 'Relatórios avançados', 'Suporte prioritário', 'Funcionalidades exclusivas'], cta: 'Assinar Premium agora', highlight: true, badge: '⭐ Mais Vendido' },
              { name: 'Premium Anual', price: 'R$ 699,90', period: '/ano', limit: 'Produtos ilimitados', features: ['Produtos ilimitados', 'Todas as funcionalidades Premium', 'Lembretes por WhatsApp', 'Relatórios avançados', 'Suporte prioritário', 'Funcionalidades exclusivas', 'Economize ~R$260 por ano'], cta: 'Garantir Desconto Anual', highlight: false, badge: '💰 Melhor Custo-Benefício' },
            ].map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 100}>
                <div className={`relative rounded-2xl border p-6 transition-all h-full flex flex-col ${plan.highlight ? 'border-primary bg-primary/5 shadow-xl scale-[1.02] lg:scale-105' : 'border-border bg-card hover:border-primary/30 hover:shadow-lg'}`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground whitespace-nowrap shadow-lg">{plan.badge}</div>
                  )}
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plan.limit}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                  <ul className="mt-5 space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 shrink-0 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant={plan.highlight ? 'default' : 'outline'} onClick={() => navigate('/login')}>
                    {plan.cta}
                  </Button>
                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CreditCard className="h-3.5 w-3.5 text-primary/60" /> Cartão de crédito</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Zap className="h-3.5 w-3.5 text-primary/60" /> Pix</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Lock className="h-3.5 w-3.5 text-primary/60" /> Pagamento seguro</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* CTA Final */}
      <section id="contato" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <ScrollReveal>
            <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-12 md:p-20">
              <h2 className="text-3xl font-extrabold text-primary md:text-4xl lg:text-5xl leading-tight">
                Pronto para eliminar o prejuízo<br className="hidden md:block" /> com produtos vencidos?
              </h2>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Junte-se a centenas de pet shops que protegem seu lucro com o PetControl. Leva menos de 1 minuto para começar.
              </p>
              <Button size="lg" className="mt-8 gap-2 text-lg px-10 h-16 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all font-bold" onClick={() => navigate('/login')}>
                Quero proteger meu lucro agora <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Sem compromisso • Cancele quando quiser
              </p>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "PetControl",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Sistema de gestão para pet shops com controle de validade, vacinas e lembretes por WhatsApp.",
            "url": "https://petcontrol-saas.com",
            "offers": [
              { "@type": "Offer", "price": "0", "priceCurrency": "BRL", "name": "Free" },
              { "@type": "Offer", "price": "49.90", "priceCurrency": "BRL", "name": "Pro Mensal" },
              { "@type": "Offer", "price": "79.90", "priceCurrency": "BRL", "name": "Premium Mensal" },
            ],
            "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "150" },
          })
        }}
      />

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="PetControl" className="h-8 w-8 object-contain" />
              <span className="font-bold text-foreground">Pet<span className="text-primary">Control</span></span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => navigate('/termos')} className="hover:text-foreground transition-colors">
                Termos de Uso
              </button>
              <span>·</span>
              <button onClick={() => navigate('/privacidade')} className="hover:text-foreground transition-colors">
                Política de Privacidade
              </button>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} PetControl. Todos os direitos reservados.
              </p>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase opacity-70 leading-tight">Desenvolvido por</span>
                <span className="text-sm font-bold tracking-wide text-foreground leading-tight">Vexoz</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
