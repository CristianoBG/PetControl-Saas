import { useState, useEffect, useRef } from 'react';
import { PawPrint, Syringe, Store, MessageCircle } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const counters = [
  { icon: PawPrint, value: 12340, label: 'Pets cadastrados', color: 'bg-primary/10 text-primary' },
  { icon: Syringe, value: 8912, label: 'Vacinas controladas', color: 'bg-primary/10 text-primary' },
  { icon: Store, value: 124, label: 'Pet shops usando', color: 'bg-primary/10 text-primary' },
  { icon: MessageCircle, value: 5430, label: 'Lembretes enviados', color: 'bg-primary/10 text-primary' },
];

function useCountUp(target: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
}

function CounterItem({ icon: Icon, value, label, color, started, index }: { icon: any; value: number; label: string; color: string; started: boolean; index: number }) {
  const count = useCountUp(value, 2000, started);
  return (
    <ScrollReveal delay={index * 100}>
      <div className="text-center space-y-4 rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
          <Icon className="h-7 w-7" />
        </div>
        <p className="text-3xl font-extrabold text-foreground md:text-4xl tabular-nums">
          {count.toLocaleString('pt-BR')}
          <span className="text-primary">+</span>
        </p>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      </div>
    </ScrollReveal>
  );
}

export default function AnimatedCounters() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">
              Números que crescem todo dia
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Junte-se a centenas de pet shops que já confiam no PetControl
            </p>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {counters.map((c, i) => (
            <CounterItem key={c.label} {...c} started={started} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
