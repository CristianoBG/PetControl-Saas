import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertItem } from '@/hooks/useAlerts';
import { Package, Syringe, AlertTriangle, Clock } from 'lucide-react';
import { differenceInDays, startOfDay } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: AlertItem[];
}

export default function AlertsSheet({ open, onOpenChange, alerts }: Props) {
  const today = startOfDay(new Date());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-background">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Central de Alertas
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {alerts.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                <Package className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground mt-1">Nenhum alerta no momento.</p>
            </div>
          )}

          {alerts.map((item) => {
            const dias = differenceInDays(new Date(item.date), today);
            const Icon = item.type === 'estoque' ? Package : Syringe;
            const dateLabel =
              item.isExpired
                ? dias === 0 ? 'Vence hoje' : `Vencido há ${Math.abs(dias)}d`
                : dias === 0 ? 'Hoje' : `${dias}d restantes`;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  item.isExpired
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-warning/30 bg-warning/5'
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  item.isExpired ? 'bg-destructive/10' : 'bg-warning/10'
                }`}>
                  <Icon className={`h-4 w-4 ${item.isExpired ? 'text-destructive' : 'text-warning'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className={`h-3 w-3 ${item.isExpired ? 'text-destructive' : 'text-warning'}`} />
                  <span className={`text-xs font-semibold whitespace-nowrap ${
                    item.isExpired ? 'text-destructive' : 'text-warning'
                  }`}>
                    {dateLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
