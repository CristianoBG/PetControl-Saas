import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Check } from 'lucide-react';

const messages = [
  { from: 'bot', text: 'Olá Maria! 🐾 Aqui é do Pet Shop Amigo Fiel.', delay: 500 },
  { from: 'bot', text: 'A vacina V10 do Thor vence em 3 dias! 💉', delay: 1500 },
  { from: 'bot', text: 'Gostaria de agendar a próxima dose?', delay: 2500 },
  { from: 'user', text: 'Obrigada pelo aviso! Vou agendar para sexta 😊', delay: 4000 },
  { from: 'bot', text: 'Perfeito! Agendado para sexta-feira às 10h. ✅', delay: 5500 },
];

export default function WhatsAppSimulation() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [started, setStarted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    messages.forEach((_, i) => {
      setTimeout(() => setVisibleMessages(i + 1), messages[i].delay);
    });
  }, [started]);

  return (
    <section className="py-20" ref={sectionRef}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary mb-4">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </div>
          <h2 className="text-2xl font-bold text-foreground md:text-4xl">
            Lembretes automáticos por WhatsApp
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Veja como seus clientes recebem os lembretes
          </p>
        </div>

        <div className="max-w-sm mx-auto">
          {/* Phone frame */}
          <div className="rounded-[2rem] border-4 border-foreground/20 bg-background shadow-2xl overflow-hidden">
            {/* WhatsApp header */}
            <div className="bg-primary px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground text-sm font-bold">
                PC
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Pet Shop Amigo Fiel</p>
                <p className="text-xs text-primary-foreground/70">online</p>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-[hsl(var(--muted))] min-h-[320px] p-4 space-y-3" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
              {messages.slice(0, visibleMessages).map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      msg.from === 'user'
                        ? 'bg-primary/20 text-foreground rounded-br-sm'
                        : 'bg-card text-foreground rounded-bl-sm'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, '0')}
                      </span>
                      {msg.from === 'user' && <Check className="h-3 w-3 text-primary" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
