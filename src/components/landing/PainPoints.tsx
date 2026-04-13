import { AlertTriangle, XCircle, Clock, MessageCircle, CalendarX, CheckCircle, Syringe, Package, Bell, ClipboardList } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const pains = [
  { icon: AlertTriangle, text: 'Produtos caros vencendo no estoque sem você perceber' },
  { icon: XCircle, text: 'Perda de dinheiro imediata com mercadoria jogada no lixo' },
  { icon: CalendarX, text: 'Clientes que fazem a 1ª dose e nunca mais voltam para o reforço' },
  { icon: ClipboardList, text: 'Controle manual em cadernos que causa furos no estoque' },
  { icon: Clock, text: 'Horas perdidas tentando lembrar quem avisar sobre vacinas' },
];

const solutions = [
  { icon: Package, title: 'Blindagem de Estoque', desc: 'Semáforo visual identifica produtos perto do vencimento. Zero desperdício.' },
  { icon: MessageCircle, title: 'Recuperação de Clientes', desc: 'Envie lembretes de vacina pelo WhatsApp no momento certo e garanta o retorno.' },
  { icon: Syringe, title: 'Gestão de Vacinas Proativa', desc: 'O sistema calcula e agenda as próximas doses sozinho. Você só executa.' },
  { icon: ClipboardList, title: 'Organização Total (Sem Papel)', desc: 'Toda informação acessível em segundos no celular. Controle absoluto do lucro.' },
];

export default function PainPoints() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Pain */}
        <ScrollReveal>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive mb-4">
              <XCircle className="h-4 w-4" /> Problemas comuns
            </span>
            <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">
              Problemas que fazem pet shops{' '}
              <span className="text-destructive">perder dinheiro</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto mb-20">
          {pains.map((pain, i) => (
            <ScrollReveal key={pain.text} delay={i * 100}>
              <div className="flex items-start gap-3 rounded-2xl border border-destructive/10 bg-destructive/[0.03] p-5 transition-all hover:border-destructive/20 hover:shadow-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                  <pain.icon className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed">{pain.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Solution */}
        <ScrollReveal>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary mb-4">
              <CheckCircle className="h-4 w-4" /> A solução
            </span>
            <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">
              O PetControl resolve isso{' '}
              <span className="text-primary">automaticamente</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          {solutions.map((sol, i) => (
            <ScrollReveal key={sol.title} delay={i * 100}>
              <div className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:-translate-y-1">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <sol.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{sol.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{sol.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
