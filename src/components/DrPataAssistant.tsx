import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, ChevronRight, Sparkles, Package, Syringe, AlertTriangle, PlusCircle, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAlerts } from '@/hooks/useAlerts';
import { useConfig } from '@/hooks/useConfig';
import { useStockAnalysis } from '@/hooks/useStockAnalysis';
import drPataImg from '@/assets/dr-pata.png';

const SESSION_KEY = 'drpata_shown_this_session';
const MINIMIZED_KEY = 'drpata_minimized';
const POSITION_KEY = 'drpata_position';

export default function DrPataAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { alerts } = useAlerts();
  const { config } = useConfig();
  const { analysis, fmt } = useStockAnalysis();

  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(() => localStorage.getItem(MINIMIZED_KEY) === 'true');
  const [panelOpen, setPanelOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [wag, setWag] = useState(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(POSITION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: window.innerWidth - 72, y: window.innerHeight - 152 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, moved: false });
  const avatarRef = useRef<HTMLButtonElement>(null);

  const isDisabled = config?.assistente_ativo === false;
  const alertTotal = alerts.length;

  // Show greeting only ONCE per session
  useEffect(() => {
    if (isDisabled) return;

    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) {
      setVisible(true);
      return;
    }

    const timeout = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(SESSION_KEY, 'true');

      const h = new Date().getHours();
      const greeting = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';

      if (alertTotal > 0) {
        setMessage(`${greeting}! ⚠️ Detectei ${alertTotal} item${alertTotal > 1 ? 'ns' : ''} que precisa${alertTotal > 1 ? 'm' : ''} de atenção. Clique em mim para ver mais.`);
      } else {
        setMessage(`${greeting}! Tudo organizado por aqui. Continue assim! 🐶`);
      }
      setBounce(true);
      setTimeout(() => setBounce(false), 600);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [isDisabled, alertTotal]);

  // Save position
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    }
  }, [position, isDragging]);

  // Clamp position on resize
  useEffect(() => {
    const onResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 56),
        y: Math.min(prev.y, window.innerHeight - 56),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: position.x, startPosY: position.y, moved: false };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 56, dragRef.current.startPosX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, dragRef.current.startPosY + dy));
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Persist minimized state
  useEffect(() => {
    localStorage.setItem(MINIMIZED_KEY, String(minimized));
  }, [minimized]);

  const handleAvatarClick = useCallback(() => {
    // Ignore click if user just dragged
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => setClickCount(0), 1500);

    if (newCount >= 3) {
      setClickCount(0);
      setEasterEgg(true);
      setPanelOpen(false);
      setMessage(null);
      setAnalysisResult(null);
      setTimeout(() => setEasterEgg(false), 4000);
      return;
    }

    if (message) setMessage(null);
    setAnalysisResult(null);
    setPanelOpen(prev => !prev);
    setWag(true);
    setTimeout(() => setWag(false), 500);
  }, [clickCount, message]);

  const handleAnalyze = useCallback(() => {
    const { critical, expiring30, lowStock, noMovement, lossesThisMonth,
            valorTotal, valorRisco, valorPerdido, topLosses, stagnantProducts } = analysis;
    const vacinasPending = alerts.filter(a => a.type === 'vacina').length;

    const hasIssues = critical > 0 || expiring30 > 0 || lowStock > 0 || noMovement > 0 || lossesThisMonth > 0 || vacinasPending > 0;

    if (!hasIssues && valorTotal === 0) {
      setAnalysisResult('✅ Seu estoque está saudável!\nNenhum risco imediato detectado. Continue assim! 🐶');
    } else {
      const lines = ['📊 Resumo do sistema\n'];
      if (critical > 0) lines.push(`🔴 Produtos críticos (≤7 dias): ${critical}`);
      if (expiring30 > 0) lines.push(`🟡 Próximos da validade (≤30 dias): ${expiring30}`);
      if (lowStock > 0) lines.push(`📦 Estoque baixo (≤3 un.): ${lowStock}`);
      if (noMovement > 0) lines.push(`⏸️ Sem movimentação (60+ dias): ${noMovement}`);
      if (lossesThisMonth > 0) lines.push(`🗑️ Perdas no mês: ${lossesThisMonth}`);
      if (vacinasPending > 0) lines.push(`💉 Vacinas pendentes: ${vacinasPending}`);
      lines.push('');
      if (valorTotal > 0) lines.push(`💰 Valor em estoque: ${fmt(valorTotal)}`);
      if (valorRisco > 0) lines.push(`⚠️ Valor em risco: ${fmt(valorRisco)}`);
      if (valorPerdido > 0) lines.push(`📉 Perdido no mês: ${fmt(valorPerdido)}`);

      if (topLosses.length > 0) {
        lines.push('\n🏆 Maiores perdas:');
        topLosses.slice(0, 3).forEach((item, i) => {
          lines.push(`${i + 1}. ${item.nome} — ${item.valor > 0 ? fmt(item.valor) : `${item.count}x`}`);
        });
      }

      if (stagnantProducts.length > 0) {
        lines.push('\n⏸️ Parados:');
        stagnantProducts.slice(0, 3).forEach(item => {
          lines.push(`• ${item.nome} — ${item.dias}d sem saída`);
        });
      }

      if (!hasIssues) {
        lines.push('\n✅ Nenhum problema detectado!');
      } else {
        lines.push('\n⚠️ Atenção! Itens que precisam de ação.');
      }
      setAnalysisResult(lines.join('\n'));
    }
  }, [analysis, alerts, fmt]);

  const menuOptions = [
    { icon: AlertTriangle, label: 'Ver alertas do dia', action: () => navigate('/dashboard') },
    { icon: Syringe, label: 'Ver vacinas pendentes', action: () => navigate('/vacinas') },
    { icon: Package, label: 'Produtos perto da validade', action: () => navigate('/estoque?filtro=orange') },
    { icon: BarChart3, label: 'Analisar estoque completo', action: () => handleAnalyze() },
    { icon: AlertTriangle, label: 'Ver produtos críticos', action: () => navigate('/estoque?filtro=red') },
    { icon: PlusCircle, label: 'Cadastrar produto', action: () => navigate('/estoque?novo=1') },
    { icon: PlusCircle, label: 'Cadastrar vacina', action: () => navigate('/vacinas?novo=1') },
  ];

  if (isDisabled) return null;

  if (!visible || minimized) {
    return minimized ? (
      <button
        onClick={() => setMinimized(false)}
        className="fixed z-50 h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-md hover:scale-110 transition-transform overflow-hidden"
        style={{ left: position.x, top: position.y }}
        aria-label="Mostrar Dr. Pata"
      >
        <img src={drPataImg} alt="Dr. Pata" className="w-full h-full object-cover" />
      </button>
    ) : null;
  }

  return (
    <>
      {easterEgg && (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
          <div className="easter-egg-dog-app">
            <img src={drPataImg} alt="Dr. Pata correndo" className="h-16 w-16 object-cover rounded-full" />
          </div>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl opacity-0 easter-egg-paw-app"
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
            <div className="easter-egg-msg-app rounded-2xl bg-card border border-primary/30 p-6 shadow-2xl text-center max-w-xs">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-bold text-foreground text-lg">Modo secreto do Dr. Pata! 🎉</p>
              <p className="text-sm text-muted-foreground mt-2">Pet shops organizados cuidam melhor dos pets. 💛</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed z-50 flex flex-col items-end gap-2" style={{ left: Math.min(position.x - 248, window.innerWidth - 300), top: Math.max(0, position.y - (panelOpen ? 400 : message ? 100 : 0)), maxWidth: '300px' }}>
        {panelOpen && (
          <div
            className="animate-scale-in rounded-2xl border border-primary/20 bg-card p-4 shadow-lg w-72"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)', maxHeight: '70vh', overflowY: 'auto' }}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <img src={drPataImg} alt="Dr. Pata" className="h-8 w-8 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-foreground">Dr. Pata 🐶</p>
                <p className="text-xs text-muted-foreground">Como posso ajudar?</p>
              </div>
              <button onClick={() => setPanelOpen(false)} className="ml-auto p-1 rounded-full hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {analysisResult && (
              <div className="mb-3 p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{analysisResult}</p>
              </div>
            )}

            {alertTotal > 0 && !analysisResult && (
              <div className="mb-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-xs font-semibold text-destructive mb-1">⚠️ Itens que precisam de atenção</p>
                <p className="text-xs text-muted-foreground">
                  {analysis.critical > 0 && `${analysis.critical} produto${analysis.critical > 1 ? 's' : ''} crítico${analysis.critical > 1 ? 's' : ''} · `}
                  {analysis.expiring30 > 0 && `${analysis.expiring30} vencendo em breve · `}
                  {analysis.lowStock > 0 && `${analysis.lowStock} estoque baixo`}
                </p>
              </div>
            )}

            <div className="space-y-0.5">
              {menuOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    if (opt.label !== 'Analisar estoque completo') setPanelOpen(false);
                    opt.action();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <opt.icon className="h-4 w-4 text-primary shrink-0" />
                  {opt.label}
                  {opt.label !== 'Analisar estoque completo' && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setPanelOpen(false); setMinimized(true); }}
              className="mt-3 pt-2 border-t border-border w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Minimizar mascote
            </button>
          </div>
        )}

        {message && !panelOpen && (
          <div
            className="animate-scale-in relative rounded-2xl border border-primary/20 bg-card p-4 shadow-lg"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
          >
            <button
              onClick={() => setMessage(null)}
              className="absolute top-2 right-2 rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Fechar dica"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
            <p className="text-sm text-foreground whitespace-pre-line pr-4 leading-relaxed">{message}</p>
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-card" />
          </div>
        )}
      </div>

      <button
        ref={avatarRef}
        onClick={handleAvatarClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => setWag(true)}
        onMouseLeave={() => setWag(false)}
        className={`shrink-0 w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 overflow-hidden shadow-lg cursor-grab active:cursor-grabbing touch-none ${isDragging ? '' : 'transition-transform'} ${bounce ? 'dr-pata-bounce-app' : ''} ${wag && !isDragging ? 'dr-pata-wag-app' : ''}`}
        style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 51 }}
        aria-label="Dr. Pata - assistente (arraste para mover)"
      >
        <img src={drPataImg} alt="Dr. Pata" className="w-full h-full object-cover pointer-events-none" />
      </button>

      <style>{`
        .dr-pata-bounce-app { animation: drPataBounceApp 0.6s ease; }
        .dr-pata-wag-app { animation: drPataWagApp 0.5s ease; }
        @keyframes drPataBounceApp {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-12px); }
          50% { transform: translateY(-6px); }
          70% { transform: translateY(-10px); }
        }
        @keyframes drPataWagApp {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        .easter-egg-dog-app {
          position: absolute;
          bottom: 30%;
          animation: easterDogRunApp 3s ease-in-out forwards;
        }
        @keyframes easterDogRunApp {
          0% { left: -80px; }
          40% { left: 45%; transform: translateY(0); }
          50% { left: 47%; transform: translateY(-30px); }
          60% { left: 49%; transform: translateY(0); }
          100% { left: 110%; }
        }
        .easter-egg-paw-app { animation: easterPawApp 0.5s ease-out forwards; }
        @keyframes easterPawApp {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8) translateY(-10px); }
        }
        .easter-egg-msg-app {
          opacity: 0;
          animation: easterMsgApp 0.5s ease-out 1.5s forwards;
        }
        @keyframes easterMsgApp {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
