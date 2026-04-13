import { useState } from 'react';
import { Syringe, Bell, Calendar, ClipboardList, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const vaccineSchedules: Record<string, { name: string; age: string; next: string }[]> = {
  cão: [
    { name: 'V10 (Polivalente)', age: '6 semanas', next: '21 dias' },
    { name: 'Antirrábica', age: '12 semanas', next: '1 ano' },
    { name: 'Gripe Canina', age: '8 semanas', next: '1 ano' },
    { name: 'Giárdia', age: '8 semanas', next: '6 meses' },
  ],
  gato: [
    { name: 'Tríplice Felina', age: '6 semanas', next: '21 dias' },
    { name: 'Antirrábica', age: '12 semanas', next: '1 ano' },
    { name: 'Leucemia Felina', age: '8 semanas', next: '1 ano' },
  ],
};

export default function VaccineSimulator() {
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleSimulate = () => {
    if (petName && species && age) setShowResult(true);
  };

  const vaccines = vaccineSchedules[species] || vaccineSchedules['cão'];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary mb-4">
            <Sparkles className="h-4 w-4" /> Simulador
          </div>
          <h2 className="text-2xl font-bold text-foreground md:text-4xl">
            Simulador de Vacinas
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Veja como o PetControl organiza as vacinas do seu pet
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-lg">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Nome do pet</label>
                <Input
                  placeholder="Ex: Thor"
                  value={petName}
                  onChange={(e) => { setPetName(e.target.value); setShowResult(false); }}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Espécie</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSpecies('cão'); setShowResult(false); }}
                    className={`flex-1 rounded-lg border p-2.5 text-sm font-medium transition-all ${
                      species === 'cão'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    🐶 Cão
                  </button>
                  <button
                    onClick={() => { setSpecies('gato'); setShowResult(false); }}
                    className={`flex-1 rounded-lg border p-2.5 text-sm font-medium transition-all ${
                      species === 'gato'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    🐱 Gato
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Idade</label>
                <Input
                  placeholder="Ex: 3 anos"
                  value={age}
                  onChange={(e) => { setAge(e.target.value); setShowResult(false); }}
                />
              </div>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handleSimulate} disabled={!petName || !species || !age}>
              <Syringe className="h-4 w-4" /> Simular Vacinas
            </Button>

            {showResult && (
              <div className="mt-8 space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <span className="text-3xl">{species === 'gato' ? '🐱' : '🐶'}</span>
                  <div>
                    <p className="font-bold text-foreground">{petName}</p>
                    <p className="text-sm text-muted-foreground">{species === 'gato' ? 'Gato' : 'Cão'} · {age}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-primary" /> Próximas Vacinas
                  </h4>
                  <div className="space-y-2">
                    {vaccines.map((v, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                        <div className="flex items-center gap-3">
                          <Syringe className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{v.name}</p>
                            <p className="text-xs text-muted-foreground">A partir de {v.age}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Próx: {v.next}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <Bell className="h-4 w-4 text-primary" /> Lembrete Automático
                  </h4>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm text-muted-foreground">
                      📲 O dono de <strong className="text-foreground">{petName}</strong> receberá um lembrete por WhatsApp
                      automaticamente antes de cada vacina vencer.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <ClipboardList className="h-4 w-4 text-primary" /> Histórico Completo
                  </h4>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm text-muted-foreground">
                      Todo o histórico de vacinas de <strong className="text-foreground">{petName}</strong> ficará registrado
                      e acessível a qualquer momento.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
