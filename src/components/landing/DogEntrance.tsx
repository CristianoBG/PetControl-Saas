import { useState, useEffect } from 'react';

const PAW_COUNT = 6;

export default function DogEntrance() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<'running' | 'jump' | 'exit' | 'done'>('running');

  useEffect(() => {
    const visited = sessionStorage.getItem('petcontrol_visited');
    if (visited) return;
    sessionStorage.setItem('petcontrol_visited', '1');
    setShow(true);

    // Timeline: run 600ms → jump 300ms → exit 400ms → done
    const t1 = setTimeout(() => setPhase('jump'), 600);
    const t2 = setTimeout(() => setPhase('exit'), 900);
    const t3 = setTimeout(() => {
      setPhase('done');
      setShow(false);
    }, 1400);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!show || phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Paw prints trail */}
      {Array.from({ length: PAW_COUNT }).map((_, i) => (
        <span
          key={i}
          className="absolute text-primary/40 text-lg"
          style={{
            left: `${5 + i * 12}%`,
            bottom: '48%',
            animation: `pawFade 0.4s ease-out ${i * 0.08}s both`,
            transform: `rotate(${i % 2 === 0 ? -15 : 15}deg)`,
          }}
        >
          🐾
        </span>
      ))}

      {/* Dog SVG character */}
      <div
        className="absolute bottom-[42%]"
        style={{
          animation:
            phase === 'running'
              ? 'dogRun 0.6s ease-out forwards'
              : phase === 'jump'
              ? 'dogJump 0.3s ease-out forwards'
              : 'dogExit 0.4s ease-in forwards',
        }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <ellipse cx="32" cy="38" rx="16" ry="12" fill="hsl(var(--primary))" opacity="0.9" />
          {/* Head */}
          <circle cx="32" cy="22" r="12" fill="hsl(var(--primary))" />
          {/* Ears */}
          <ellipse cx="22" cy="14" rx="5" ry="8" fill="hsl(var(--primary))" transform="rotate(-15 22 14)" />
          <ellipse cx="42" cy="14" rx="5" ry="8" fill="hsl(var(--primary))" transform="rotate(15 42 14)" />
          {/* Eyes */}
          <circle cx="27" cy="20" r="2.5" fill="hsl(var(--background))" />
          <circle cx="37" cy="20" r="2.5" fill="hsl(var(--background))" />
          <circle cx="28" cy="19.5" r="1" fill="hsl(var(--foreground))" />
          <circle cx="38" cy="19.5" r="1" fill="hsl(var(--foreground))" />
          {/* Nose */}
          <ellipse cx="32" cy="26" rx="2.5" ry="2" fill="hsl(var(--foreground))" />
          {/* Mouth */}
          <path d="M29 28 Q32 31 35 28" stroke="hsl(var(--foreground))" strokeWidth="1" fill="none" />
          {/* Legs (animated with CSS) */}
          <rect x="24" y="46" width="4" height="8" rx="2" fill="hsl(var(--primary))" className="animate-[legMove_0.15s_ease-in-out_infinite_alternate]" />
          <rect x="36" y="46" width="4" height="8" rx="2" fill="hsl(var(--primary))" className="animate-[legMove_0.15s_ease-in-out_infinite_alternate_0.08s]" />
          {/* Tail */}
          <path d="M48 34 Q56 28 52 22" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" fill="none" className="animate-[tailWag_0.2s_ease-in-out_infinite_alternate]" />
        </svg>
      </div>

      <style>{`
        @keyframes dogRun {
          from { left: -80px; }
          to { left: calc(50% - 32px); }
        }
        @keyframes dogJump {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.1); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes dogExit {
          from { left: calc(50% - 32px); opacity: 1; }
          to { left: calc(100% + 80px); opacity: 0; }
        }
        @keyframes pawFade {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        @keyframes legMove {
          from { transform: translateY(0); }
          to { transform: translateY(-3px); }
        }
        @keyframes tailWag {
          from { transform: rotate(-10deg); }
          to { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  );
}
