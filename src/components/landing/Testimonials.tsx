import { Star } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const testimonials = [
  {
    name: 'Carlos Mendes',
    role: 'Dono do Pet Shop Amigo Fiel',
    text: 'Antes do PetControl eu perdia vacinas por vencimento todo mês. Agora o sistema me avisa antes e os clientes voltam sozinhos com os lembretes automáticos.',
    stars: 5,
    avatar: '🐕',
  },
  {
    name: 'Ana Paula',
    role: 'Gerente da Clínica Pet Vida',
    text: 'Economizei horas por semana. Não preciso mais ficar olhando planilha e mandando mensagem um por um no WhatsApp. O PetControl faz tudo sozinho.',
    stars: 5,
    avatar: '🐈',
  },
  {
    name: 'Roberto Silva',
    role: 'Veterinário autônomo',
    text: 'O controle de estoque com semáforo de validade é genial. Nunca mais perdi um produto por vencimento. Vale cada centavo.',
    stars: 5,
    avatar: '🩺',
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-card border-y border-border">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">
              Quem usa, recomenda
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Veja o que donos de pet shops dizem sobre o PetControl
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 150}>
              <div className="rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
