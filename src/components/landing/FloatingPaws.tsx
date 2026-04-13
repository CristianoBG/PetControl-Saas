import { useEffect, useState } from 'react';

interface Paw {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  duration: number;
  delay: number;
}

export default function FloatingPaws() {
  const [paws, setPaws] = useState<Paw[]>([]);

  useEffect(() => {
    const generated: Paw[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 12 + Math.random() * 20,
      opacity: 0.03 + Math.random() * 0.05,
      rotation: Math.random() * 360,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
    }));
    setPaws(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {paws.map((paw) => (
        <div
          key={paw.id}
          className="absolute"
          style={{
            left: `${paw.x}%`,
            top: `${paw.y}%`,
            opacity: paw.opacity,
            fontSize: `${paw.size}px`,
            transform: `rotate(${paw.rotation}deg)`,
            animation: `float ${paw.duration}s ease-in-out ${paw.delay}s infinite alternate`,
          }}
        >
          🐾
        </div>
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-30px) rotate(15deg); }
        }
      `}</style>
    </div>
  );
}
