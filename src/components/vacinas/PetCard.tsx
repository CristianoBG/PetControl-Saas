import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Plus, Heart, HeartPulse, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PetTimeline } from './PetTimeline';
import { getVacinaStatusStyles, getRelativeTime } from '@/lib/vacinas';
import type { VacinaStatus } from '@/lib/vacinas';
import { formatPhoneForDisplay } from '@/lib/phone';

interface PetCardProps {
  pet: {
    id: string;
    nome_pet: string;
    nome_dono: string;
    whatsapp_dono: string;
    foto_pet_url: string | null;
    vacinas: Array<{
      id: string;
      tipo_vacina: string;
      data_dose: string;
      data_proxima_dose: string | null;
      status: string;
      avisado: boolean;
      aplicada: boolean;
    }>;
  };
  onSendWhatsApp: (vacinaId: string) => void;
  onMarkSent: (vacinaId: string) => void;
  onApplyVaccine: (vacinaId: string) => void;
}

export function PetCard({ pet, onSendWhatsApp, onMarkSent, onApplyVaccine }: PetCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Mapear eventos da Timeline
  const timelineEvents = pet.vacinas.map(v => {
    let title = `${v.tipo_vacina} `;
    if (v.status === 'aplicada') {
      title += 'Aplicada';
    } else if (v.status === 'enviado') {
      title += 'Aviso Enviado';
    } else {
      title += 'Cadastrada';
    }

    return {
      id: v.id,
      date: v.status === 'aplicada' && v.data_dose ? v.data_dose : (v.data_proxima_dose || v.data_dose),
      title,
      status: v.status as any
    };
  });

  // Vacinas ativas (não aplicadas) para listar no card principal
  const activeVaccines = pet.vacinas.filter(v => v.status !== 'aplicada');

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow">
      {/* ── Pet Header ── */}
      <div className="flex gap-4 items-center mb-5">
        <img
          src={pet.foto_pet_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80'}
          alt={pet.nome_pet}
          className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/10"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground truncate">{pet.nome_pet}</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
              <HeartPulse className="w-3.5 h-3.5 mr-1" /> {pet.vacinas.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span className="font-medium text-foreground">{pet.nome_dono}</span>
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-0.5 opacity-80">
            📞 {formatPhoneForDisplay(pet.whatsapp_dono)}
          </p>
        </div>
      </div>

      {/* ── Lista de Vacinas (Ativas) ── */}
      <div className="space-y-3 mb-5">
        {activeVaccines.length > 0 ? (
          activeVaccines.map((v) => {
            const styles = getVacinaStatusStyles(v.status as VacinaStatus);
            
            // Container styles based on status
            const containerClass = v.status === 'atrasado' 
              ? 'border-destructive/30 bg-destructive/5' 
              : v.status === 'vencendo' 
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-border bg-muted/30';
                
            return (
              <div key={v.id} className={`rounded-xl border ${containerClass} overflow-hidden`}>
                <div className="bg-muted px-3 py-2 border-b flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    {v.status === 'atrasado' ? <ShieldAlert className="w-4 h-4 text-destructive" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
                    {v.tipo_vacina}
                  </span>
                </div>
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <Badge variant="outline" className={`${styles.badge} mb-2 border-0`}>
                      {styles.label}
                    </Badge>
                    
                    {v.data_proxima_dose ? (
                      <div className="space-y-0.5">
                        <p className="text-base font-black text-foreground leading-tight tracking-tight">
                          {getRelativeTime(v.data_proxima_dose)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Próx. Dose: {format(new Date(v.data_proxima_dose), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground font-medium italic">Sem data agendada</p>
                    )}
                  </div>
                  
                  {/* Action Buttons specific to this vaccine */}
                  <div className="flex flex-col gap-1.5">
                    {!v.avisado && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => onSendWhatsApp(v.id)} className="h-7 px-2 text-[10px] bg-[#25D366] hover:bg-[#20bd5a] text-white">
                          WhatsApp
                        </Button>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onMarkSent(v.id)} title="Marcar Enviado">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        </Button>
                      </div>
                    )}
                    <Button size="sm" onClick={() => onApplyVaccine(v.id)} className="h-7 px-2 text-[10px] font-bold">
                      <SyringeIcon /> Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Tudo em dia!</p>
            <p className="text-xs text-emerald-600/70">Todas as vacinas estão aplicadas.</p>
          </div>
        )}
      </div>

      {/* ── Timeline Section ── */}
      <div className="pt-2 border-t border-border/50">
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="flex w-full items-center justify-between py-1.5 text-xs text-muted-foreground font-semibold hover:text-foreground transition-colors"
        >
          Histórico Completo
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expanded && (
          <div className="mt-2 pl-1 animate-in slide-in-from-top-2 duration-200">
            <PetTimeline events={timelineEvents} />
          </div>
        )}
      </div>
    </div>
  );
}

function SyringeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
      <path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>
    </svg>
  );
}
