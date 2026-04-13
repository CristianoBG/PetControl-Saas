import { useState } from 'react';
import { TrendingUp, Syringe, Package, Settings, Moon, X, ZoomIn } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

import screenDashboard from '@/assets/screen-dashboard.png';
import screenVacinas from '@/assets/screen-vacinas.png';
import screenEstoque from '@/assets/screen-estoque.png';
import screenAjustes from '@/assets/screen-ajustes.png';
import screenDark from '@/assets/screen-dark.png';

const screens = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, img: screenDashboard, desc: 'Visão geral com alertas, clientes e ações rápidas' },
  { id: 'vacinas', label: 'Vacinas', icon: Syringe, img: screenVacinas, desc: 'Controle completo de doses, status e lembretes' },
  { id: 'estoque', label: 'Estoque', icon: Package, img: screenEstoque, desc: 'Gestão de produtos com alertas de validade' },
  { id: 'ajustes', label: 'Ajustes', icon: Settings, img: screenAjustes, desc: 'Configurações, relatórios e contato' },
  { id: 'dark', label: 'Modo Escuro', icon: Moon, img: screenDark, desc: 'Interface adaptável com tema claro e escuro' },
];

export default function SystemShowcase() {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">Conheça o sistema</h2>
            <p className="mt-3 text-muted-foreground text-lg">Veja como o PetControl funciona na prática</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            {screens.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  active === i
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                <s.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Phone mockup — larger */}
          <div className="flex flex-col items-center">
            <div
              className="relative mx-auto w-full max-w-[420px] sm:max-w-[480px] md:max-w-[520px] group cursor-pointer"
              onClick={() => setZoomed(true)}
            >
              {/* Phone frame — thinner borders */}
              <div className="rounded-[2rem] border-[4px] border-foreground/8 bg-foreground/4 p-1.5 shadow-xl shadow-foreground/8 transition-transform duration-300 group-hover:scale-[1.03]">
                {/* Notch */}
                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/8 rounded-full z-10" />
                {/* Screen */}
                <div className="relative overflow-hidden rounded-[1.6rem] bg-background">
                  {screens.map((s, i) => (
                    <img
                      key={s.id}
                      src={s.img}
                      alt={s.label}
                      className={`w-full transition-all duration-500 ${
                        active === i
                          ? 'opacity-100 relative'
                          : 'opacity-0 absolute inset-0'
                      }`}
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
              {/* Zoom hint */}
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-foreground/70 px-3 py-1.5 text-xs font-medium text-background opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ZoomIn className="h-3.5 w-3.5" />
                Ampliar
              </div>
              {/* Glow */}
              <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Description */}
            <div className="mt-6 text-center" key={active} style={{ animation: 'demoFadeIn 0.35s ease-out' }}>
              <p className="text-lg font-bold text-foreground">{screens[active].label}</p>
              <p className="text-sm text-muted-foreground mt-1">{screens[active].desc}</p>
            </div>

            {/* Dots */}
            <div className="flex gap-2 mt-4">
              {screens.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Zoom modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 z-50 rounded-full bg-foreground/20 p-2 text-background hover:bg-foreground/40 transition-colors"
            onClick={() => setZoomed(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={screens[active].img}
            alt={screens[active].label}
            className="max-h-[90vh] max-w-[95vw] rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <style>{`
        @keyframes demoFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
