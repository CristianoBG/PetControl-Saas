import { Circle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  status: 'aplicada' | 'pendente' | 'vencendo' | 'atrasada' | 'enviado';
}

interface PetTimelineProps {
  events: TimelineEvent[];
}

export function PetTimeline({ events }: PetTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="relative border-l border-muted-foreground/20 ml-3 py-2 space-y-4">
      {events.map((event, index) => {
        let Icon = Circle;
        let iconColor = 'text-muted-foreground';
        let bgColor = 'bg-background';

        if (event.status === 'aplicada') {
          Icon = CheckCircle2;
          iconColor = 'text-emerald-500';
          bgColor = 'bg-emerald-500/10';
        } else if (event.status === 'atrasada') {
          Icon = AlertCircle;
          iconColor = 'text-destructive';
          bgColor = 'bg-destructive/10';
        } else if (event.status === 'vencendo') {
          Icon = Clock;
          iconColor = 'text-amber-500';
          bgColor = 'bg-amber-500/10';
        } else if (event.status === 'enviado') {
          Icon = CheckCircle2;
          iconColor = 'text-primary';
          bgColor = 'bg-primary/10';
        }

        return (
          <div key={event.id} className="relative flex items-center group">
            {/* Timeline Line Connector Dot */}
            <div className="absolute -left-[5px] flex h-[10px] w-[10px] items-center justify-center rounded-full bg-background ring-2 ring-muted-foreground/20" />
            
            <div className={`ml-4 flex items-center gap-2 rounded-lg px-2 py-1 transition-colors ${bgColor}`}>
              <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
              <span className="text-xs font-medium text-muted-foreground">
                {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}:
              </span>
              <span className={`text-xs font-semibold ${event.status === 'aplicada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                {event.title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
