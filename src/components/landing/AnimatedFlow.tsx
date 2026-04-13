import { useState, useEffect, useRef } from 'react';
import { Syringe, Smartphone, User, ArrowRight, Store } from 'lucide-react';

const flowSteps = [
  { icon: '🐶', label: 'Pet recebe vacina', sub: 'No pet shop' },
  { icon: '💻', label: 'Registrado no sistema', sub: 'PetControl salva' },
  { icon: '📲', label: 'WhatsApp enviado', sub: 'Lembrete automático' },
  { icon: '👤', label: 'Dono é avisado', sub: 'Antes de vencer' },
];

export default function AnimatedFlow() {
  const [activeStep, setActiveStep] = useState(-1);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    flowSteps.forEach((_, i) => {
      setTimeout(() => setActiveStep(i), (i + 1) * 800);
    });
  }, [started]);

  return (
    <section ref={ref} className="py-20 bg-card border-y border-border">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-bold text-foreground md:text-4xl">
            Como o fluxo funciona
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Do pet shop até o dono do pet, tudo automatizado
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
          {flowSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 md:gap-4">
              <div
                className={`flex flex-col items-center text-center transition-all duration-500 ${
                  i <= activeStep ? 'opacity-100 scale-100' : 'opacity-20 scale-90'
                }`}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all duration-500 ${
                  i <= activeStep ? 'border-primary bg-primary/10 shadow-lg' : 'border-border bg-muted'
                }`}>
                  {step.icon}
                </div>
                <p className="text-sm font-bold text-foreground mt-3">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.sub}</p>
              </div>
              {i < flowSteps.length - 1 && (
                <ArrowRight className={`h-6 w-6 shrink-0 transition-all duration-500 hidden md:block ${
                  i < activeStep ? 'text-primary' : 'text-muted-foreground/30'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
