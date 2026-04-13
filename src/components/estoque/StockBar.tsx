interface StockBarProps {
  quantity: number;
  maxDisplay?: number;
}

function getBarColor(pct: number) {
  if (pct < 20) return { h: 0, s: 72, l: 51 };   // red
  if (pct <= 60) return { h: 38, s: 92, l: 50 };  // orange
  return { h: 160, s: 84, l: 39 };                  // green
}

export default function StockBar({ quantity, maxDisplay = 100 }: StockBarProps) {
  const pct = Math.min((quantity / maxDisplay) * 100, 100);
  const c = getBarColor(pct);
  const hsl = `hsl(${c.h}, ${c.s}%, ${c.l}%)`;
  const hsla = (a: number) => `hsla(${c.h}, ${c.s}%, ${c.l}%, ${a})`;
  const hslLight = `hsl(${c.h}, ${c.s}%, ${Math.min(c.l + 15, 80)}%)`;
  const hslDark = `hsl(${c.h}, ${c.s}%, ${Math.max(c.l - 14, 10)}%)`;

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        {/* 3D channel — thicker bar */}
        <div
          className="relative h-5 flex-1 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, hsl(215, 28%, 14%) 0%, hsl(215, 28%, 20%) 40%, hsl(215, 28%, 12%) 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(255,255,255,0.05)',
          }}
        >
          {/* Fill glow */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(180deg, ${hsla(0.3)} 0%, ${hsla(0.1)} 100%)`,
            }}
          />
          {/* Glossy ball */}
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
            style={{
              left: `calc(${pct}% - 8px)`,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${hslLight}, ${hsl} 50%, ${hslDark} 100%)`,
              boxShadow: `0 0 8px ${hsla(0.6)}, 0 0 3px ${hsla(0.8)}, inset 0 -2px 4px ${hsla(0.4)}`,
            }}
          />
        </div>
        {/* Percentage */}
        <span
          className="text-sm font-mono font-bold shrink-0 w-10 text-right"
          style={{ color: hsl, textShadow: `0 0 4px ${hsla(0.4)}` }}
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}
