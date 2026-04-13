import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import drPataImg from '@/assets/dr-pata.png';
import { useNavigate } from 'react-router-dom';

interface Tip {
  sectionId: string;
  message: string;
}

const tips: Tip[] = [
  {
    sectionId: 'funcionalidades',
    message: 'Oi! Eu sou o Dr. Pata 🐶\nVou te mostrar como o PetControl facilita a gestão do seu pet shop.',
  },
  {
    sectionId: 'como-funciona',
    message: 'O PetControl envia lembretes automáticos de vacinas para seus clientes! 📲',
  },
  {
    sectionId: 'planos',
    message: 'Você pode controlar estoque, vacinas e clientes em um só lugar. Comece grátis! 💛',
  },
];

const menuOptions = [
  { label: 'Ver funcionalidades', anchor: '#funcionalidades' },
  { label: 'Como funciona o controle de vacinas', anchor: '#funcionalidades' },
  { label: 'Abrir suporte', anchor: '#contato' },
  { label: 'Criar conta grátis', route: '/login' },
];

const randomTips = [
  'Dica do Dr. Pata: manter o histórico de vacinas atualizado aumenta a confiança dos clientes! 📋',
  'Dica do Dr. Pata: controle de estoque evita produtos vencidos! 📦',
  'Dica do Dr. Pata: enviar lembretes automáticos aumenta o retorno dos clientes! 📲',
];

export default function DrPata() {
  const navigate = useNavigate();
  const [activeTip, setActiveTip] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [wag, setWag] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 2000);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const tip = tips.find((t) => t.sectionId === id);
            if (tip && !dismissed.has(id) && !panelOpen) {
              setActiveTip(id);
              setCustomMessage(null);
              setBounce(true);
              setTimeout(() => setBounce(false), 600);
            }
          }
        });
      },
      { threshold: 0.4 }
    );

    tips.forEach((tip) => {
      const el = document.getElementById(tip.sectionId);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      clearTimeout(timeout);
      observerRef.current?.disconnect();
    };
  }, [dismissed, panelOpen]);

  // Random tips every 30s when idle
  useEffect(() => {
    if (!visible || panelOpen || activeTip) return;
    const interval = setInterval(() => {
      if (!panelOpen && !activeTip) {
        const tip = randomTips[Math.floor(Math.random() * randomTips.length)];
        setCustomMessage(tip);
        setBounce(true);
        setTimeout(() => setBounce(false), 600);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [visible, panelOpen, activeTip]);

  const handleDismiss = () => {
    if (activeTip) {
      setDismissed((prev) => new Set(prev).add(activeTip));
    }
    setActiveTip(null);
    setCustomMessage(null);
  };

  const handleAvatarClick = useCallback(() => {
    // Easter egg: 3 clicks
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => setClickCount(0), 1500);

    if (newCount >= 3) {
      setClickCount(0);
      setEasterEgg(true);
      setPanelOpen(false);
      setActiveTip(null);
      setCustomMessage(null);
      setTimeout(() => setEasterEgg(false), 4000);
      return;
    }

    // Toggle panel
    if (activeTip || customMessage) {
      handleDismiss();
    } else {
      setPanelOpen((prev) => !prev);
    }

    setWag(true);
    setTimeout(() => setWag(false), 500);
  }, [clickCount, activeTip, customMessage]);

  const handleMenuClick = (option: typeof menuOptions[0]) => {
    setPanelOpen(false);
    if (option.route) {
      navigate(option.route);
    } else if (option.anchor) {
      const el = document.querySelector(option.anchor);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentTip = tips.find((t) => t.sectionId === activeTip);
  const displayMessage = customMessage || currentTip?.message;

  if (!visible || minimized) {
    return minimized ? (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-4 z-50 h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        aria-label="Mostrar Dr. Pata"
      >
        <span className="text-xs">🐾</span>
      </button>
    ) : null;
  }

  return (
    <>
      {/* Easter Egg Animation */}
      {easterEgg && (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
          <div className="easter-egg-dog">
            <img src={drPataImg} alt="Dr. Pata correndo" className="h-16 w-16 object-cover rounded-full" />
          </div>
          {/* Paw prints */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl opacity-0 easter-egg-paw"
              style={{
                bottom: `${20 + Math.random() * 20}%`,
                left: `${10 + i * 10}%`,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              🐾
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="easter-egg-message rounded-2xl bg-card border border-primary/30 p-6 shadow-2xl text-center max-w-xs">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-bold text-foreground text-lg">Você encontrou o modo secreto do Dr. Pata! 🎉</p>
              <p className="text-sm text-muted-foreground mt-2">Pet shops organizados cuidam melhor dos pets. 💛</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2" style={{ maxWidth: '320px' }}>
        {/* Panel */}
        {panelOpen && (
          <div
            className="animate-scale-in rounded-2xl border border-primary/20 bg-card p-4 shadow-lg w-64"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <img src={drPataImg} alt="Dr. Pata" className="h-8 w-8 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-foreground">Dr. Pata 🐶</p>
                <p className="text-xs text-muted-foreground">Posso ajudar?</p>
              </div>
              <button onClick={() => setPanelOpen(false)} className="ml-auto p-1 rounded-full hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-1">
              {menuOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleMenuClick(opt)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setPanelOpen(false); setMinimized(true); }}
              className="mt-2 pt-2 border-t border-border w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Minimizar mascote
            </button>
          </div>
        )}

        {/* Tip balloon */}
        {displayMessage && !panelOpen && (
          <div
            className="animate-scale-in relative rounded-2xl border border-primary/20 bg-card p-4 shadow-lg"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Fechar dica"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
            <p className="text-sm text-foreground whitespace-pre-line pr-4 leading-relaxed">
              {displayMessage}
            </p>
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-card" />
          </div>
        )}

        {/* Mascot avatar */}
        <button
          onClick={handleAvatarClick}
          onMouseEnter={() => setWag(true)}
          onMouseLeave={() => setWag(false)}
          className={`shrink-0 w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 overflow-hidden shadow-lg transition-transform cursor-pointer ${bounce ? 'dr-pata-bounce' : ''} ${wag ? 'dr-pata-wag' : ''}`}
          aria-label="Dr. Pata - mascote do PetControl"
        >
          <img src={drPataImg} alt="Dr. Pata" className="w-full h-full object-cover" />
        </button>
      </div>

      <style>{`
        .dr-pata-bounce {
          animation: drPataBounce 0.6s ease;
        }
        .dr-pata-wag {
          animation: drPataWag 0.5s ease;
        }
        @keyframes drPataBounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-12px); }
          50% { transform: translateY(-6px); }
          70% { transform: translateY(-10px); }
        }
        @keyframes drPataWag {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        .easter-egg-dog {
          position: absolute;
          bottom: 30%;
          animation: easterDogRun 3s ease-in-out forwards;
        }
        @keyframes easterDogRun {
          0% { left: -80px; }
          40% { left: 45%; transform: translateY(0); }
          50% { left: 47%; transform: translateY(-30px); }
          60% { left: 49%; transform: translateY(0); }
          100% { left: 110%; }
        }
        .easter-egg-paw {
          animation: easterPaw 0.5s ease-out forwards;
        }
        @keyframes easterPaw {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8) translateY(-10px); }
        }
        .easter-egg-message {
          opacity: 0;
          animation: easterMessage 0.5s ease-out 1.5s forwards;
        }
        @keyframes easterMessage {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
