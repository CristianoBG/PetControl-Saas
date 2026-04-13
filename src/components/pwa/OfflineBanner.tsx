import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-destructive py-2 px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom border-t border-destructive-foreground/20">
      <WifiOff className="h-4 w-4 text-white shrink-0" />
      <p className="text-xs sm:text-sm font-bold text-white leading-tight">
        Sua conexão caiu. Operando em modo Offline.
      </p>
    </div>
  );
}
