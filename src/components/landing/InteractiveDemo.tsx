import { useState } from 'react';
import { Syringe, Package, Users, PawPrint, Bell, TrendingUp, Calendar, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const screens = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: TrendingUp,
    content: {
      title: 'Dashboard',
      stats: [
        { label: 'Vacinas Hoje', value: '8', color: 'text-primary' },
        { label: 'Estoque Baixo', value: '3', color: 'text-destructive' },
        { label: 'Clientes Ativos', value: '124', color: 'text-foreground' },
        { label: 'Lembretes Enviados', value: '47', color: 'text-primary' },
      ],
      alerts: [
        { text: 'Vacina do Thor vence em 2 dias', type: 'warning' },
        { text: 'Estoque de V10 abaixo do mínimo', type: 'danger' },
        { text: '5 lembretes enviados hoje', type: 'success' },
      ],
    },
  },
  {
    id: 'vacinas',
    label: 'Vacinas',
    icon: Syringe,
    content: {
      title: 'Controle de Vacinas',
      items: [
        { pet: '🐶 Thor', vacina: 'V10', data: '15/03/2026', status: 'pendente' },
        { pet: '🐱 Mia', vacina: 'Antirrábica', data: '20/03/2026', status: 'agendada' },
        { pet: '🐶 Rex', vacina: 'V8', data: '10/03/2026', status: 'aplicada' },
        { pet: '🐱 Luna', vacina: 'Tríplice', data: '25/03/2026', status: 'pendente' },
      ],
    },
  },
  {
    id: 'estoque',
    label: 'Estoque',
    icon: Package,
    content: {
      title: 'Gestão de Estoque',
      items: [
        { nome: 'Vacina V10', qtd: 12, validade: '06/2026', status: 'ok' },
        { nome: 'Vacina V8', qtd: 3, validade: '04/2026', status: 'baixo' },
        { nome: 'Antirrábica', qtd: 25, validade: '12/2026', status: 'ok' },
        { nome: 'Vermífugo Plus', qtd: 1, validade: '03/2026', status: 'crítico' },
      ],
    },
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: Users,
    content: {
      title: 'Cadastro de Clientes',
      items: [
        { nome: 'Carlos Silva', pets: '🐶 Thor, 🐶 Rex', whatsapp: '(11) 99999-1234' },
        { nome: 'Ana Souza', pets: '🐱 Mia', whatsapp: '(11) 98888-5678' },
        { nome: 'João Lima', pets: '🐶 Bob, 🐱 Luna', whatsapp: '(21) 97777-9012' },
      ],
    },
  },
  {
    id: 'pets',
    label: 'Pets',
    icon: PawPrint,
    content: {
      title: 'Pets Cadastrados',
      items: [
        { nome: 'Thor', especie: '🐶 Cão', raca: 'Golden Retriever', idade: '3 anos' },
        { nome: 'Mia', especie: '🐱 Gato', raca: 'Siamês', idade: '2 anos' },
        { nome: 'Rex', especie: '🐶 Cão', raca: 'Pastor Alemão', idade: '5 anos' },
        { nome: 'Luna', especie: '🐱 Gato', raca: 'Persa', idade: '1 ano' },
      ],
    },
  },
];

const statusColors: Record<string, string> = {
  pendente: 'bg-warning/20 text-warning',
  agendada: 'bg-primary/20 text-primary',
  aplicada: 'bg-success/20 text-success',
  ok: 'bg-primary/20 text-primary',
  baixo: 'bg-warning/20 text-warning',
  crítico: 'bg-destructive/20 text-destructive',
};

export default function InteractiveDemo() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const screen = screens.find((s) => s.id === activeScreen)!;

  return (
    <section className="py-16 md:py-24 bg-card border-y border-border">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary mb-4">
              <PawPrint className="h-4 w-4" /> Demo Interativa
            </span>
            <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">
              Experimente o sistema agora
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Clique nas abas e veja como o PetControl funciona na prática
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="rounded-2xl border border-border bg-background shadow-2xl overflow-hidden max-w-4xl mx-auto">
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-primary/60" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">app.petcontrol.com.br</span>
            </div>

            <div className="flex min-h-[420px]">
              {/* Sidebar */}
              <div className="w-48 shrink-0 border-r border-border bg-muted/30 p-3 hidden sm:block">
                <div className="flex items-center gap-2 mb-6 px-2">
                  <PawPrint className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm text-foreground">PetControl</span>
                </div>
                <nav className="space-y-1">
                  {screens.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveScreen(s.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeScreen === s.id
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <s.icon className="h-4 w-4" />
                      {s.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Mobile tabs */}
              <div className="sm:hidden flex border-b border-border overflow-x-auto w-full">
                {screens.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveScreen(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                      activeScreen === s.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground'
                    }`}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 p-6" key={activeScreen} style={{ animation: 'demoFadeIn 0.35s ease-out' }}>
                <h3 className="text-lg font-bold text-foreground mb-5">{screen.content.title}</h3>

                {activeScreen === 'dashboard' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      {screen.content.stats?.map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
                          <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" /> Alertas recentes
                      </p>
                      {screen.content.alerts?.map((alert, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-all hover:shadow-sm">
                          {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
                          {alert.type === 'danger' && <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />}
                          {alert.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0 text-primary" />}
                          <span className="text-muted-foreground">{alert.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeScreen === 'vacinas' && (
                  <div className="space-y-2">
                    {screen.content.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.pet.slice(0, 2)}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.pet.slice(2)} — {item.vacina}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {item.data}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {activeScreen === 'estoque' && (
                  <div className="space-y-2">
                    {screen.content.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">Val: {item.validade} · Qtd: {item.qtd}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {activeScreen === 'clientes' && (
                  <div className="space-y-2">
                    {screen.content.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">{item.pets}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.whatsapp}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeScreen === 'pets' && (
                  <div className="space-y-2">
                    {screen.content.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.especie.slice(0, 2)}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.nome}</p>
                            <p className="text-xs text-muted-foreground">{item.raca} · {item.idade}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <style>{`
        @keyframes demoFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
