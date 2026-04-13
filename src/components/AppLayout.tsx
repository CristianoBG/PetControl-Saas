import { ReactNode, useState } from 'react';
import BottomNav from './BottomNav';
import AlertsSheet from './AlertsSheet';
import DrPataAssistant from './DrPataAssistant';
import { useConfig } from '@/hooks/useConfig';
import { useThemeColor, useDarkMode } from '@/hooks/useTheme';
import { useAlerts } from '@/hooks/useAlerts';
import OfflineBanner from '@/components/pwa/OfflineBanner';
import InstallPWABanner from '@/components/pwa/InstallPWABanner';
import { Bell, Moon, Sun } from 'lucide-react';
import logoImg from '@/assets/logo-petcontrol.png';

export default function AppLayout({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  const { config } = useConfig();
  const { alerts, count } = useAlerts();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();
  useThemeColor();

  const nomeLoja = config?.nome_petshop || 'PetControl';

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <InstallPWABanner />
      <OfflineBanner />
      {!hideHeader && (
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-3 h-[50px]">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={config?.logo_url || logoImg}
                alt={nomeLoja}
                className="h-8 w-8 shrink-0 rounded-lg object-cover"
              />
              <span className="text-sm font-bold text-foreground truncate">
                {nomeLoja}
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={toggleDark}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                title={isDark ? 'Modo claro' : 'Modo escuro'}
              >
                {isDark ? <Sun className="h-4.5 w-4.5 text-muted-foreground" /> : <Moon className="h-4.5 w-4.5 text-muted-foreground" />}
              </button>
              <button
                onClick={() => setAlertsOpen(true)}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
              >
                <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      )}
      <main className="px-4 py-4">{children}</main>
      <BottomNav />
      <DrPataAssistant />
      <AlertsSheet open={alertsOpen} onOpenChange={setAlertsOpen} alerts={alerts} />
    </div>
  );
}
