import { AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VacinasAlertBannerProps {
  lateCount: number;
  onSendAll: () => void;
  isPending: boolean;
}

export default function VacinasAlertBanner({ lateCount, onSendAll, isPending }: VacinasAlertBannerProps) {
  if (lateCount === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-3 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-sm font-semibold text-destructive">
          {lateCount} vacina{lateCount > 1 ? 's' : ''} atrasada{lateCount > 1 ? 's' : ''}
        </span>
      </div>
      <Button
        size="sm"
        variant="destructive"
        className="gap-1.5 shrink-0 text-xs"
        onClick={onSendAll}
        disabled={isPending}
      >
        <Send className="h-3.5 w-3.5" /> Enviar lembretes
      </Button>
    </div>
  );
}
