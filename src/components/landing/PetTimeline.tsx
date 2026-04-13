import { Syringe, Calendar, Bell } from 'lucide-react';

const events = [
  { year: '2024', month: 'Jan', icon: Syringe, title: 'Vacina V10 — 1ª dose', desc: 'Aplicada no Pet Shop Amigo Fiel', color: 'bg-primary' },
  { year: '2024', month: 'Fev', icon: Syringe, title: 'Vacina V10 — 2ª dose', desc: 'Reforço aplicado com sucesso', color: 'bg-primary' },
  { year: '2024', month: 'Mar', icon: Syringe, title: 'Antirrábica', desc: 'Dose única anual aplicada', color: 'bg-primary' },
  { year: '2025', month: 'Mar', icon: Bell, title: 'Lembrete enviado', desc: 'WhatsApp para dono: reforço em 5 dias', color: 'bg-warning' },
  { year: '2025', month: 'Mar', icon: Syringe, title: 'Antirrábica — Reforço', desc: 'Dose anual reaplicada', color: 'bg-primary' },
  { year: '2026', month: 'Mar', icon: Calendar, title: 'Próxima vacina', desc: 'Antirrábica agendada para 15/03', color: 'bg-accent' },
];

export default function PetTimeline() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-bold text-foreground md:text-4xl">
            Histórico completo do pet
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Acompanhe toda a linha do tempo de vacinas — exemplo: 🐶 Thor
          </p>
        </div>

        <div className="max-w-2xl mx-auto relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-translate-x-0.5" />

          <div className="space-y-8">
            {events.map((event, i) => (
              <div key={i} className={`relative flex items-start gap-4 md:gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Dot */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                  <div className={`w-12 h-12 rounded-full ${event.color} flex items-center justify-center shadow-lg`}>
                    <event.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className={`ml-20 md:ml-0 md:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8 md:ml-auto'}`}>
                  <span className="text-xs font-bold text-primary">{event.year} · {event.month}</span>
                  <h4 className="text-sm font-bold text-foreground mt-1">{event.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
