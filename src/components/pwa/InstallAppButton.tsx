import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';

export function InstallAppButton() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Detect if the app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    // 2. Detect if the user is on iOS
    const ios = (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    setIsIOS(ios);

    // 3. Bonus: Listen for installation success
    const handleAppInstalled = () => {
      console.log('PWA was installed successfully');
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  // 3. Do NOT appear if installation is not available and not iOS and not already installed
  if (!isInstallable && !isIOS && !isInstalled) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="text-left space-y-1">
          <h3 className="text-sm font-bold text-foreground">Aplicativo PetControl</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Install the app for faster access and never miss your pet’s care reminders 🐶
          </p>
        </div>
      </div>

      <div className="pt-1">
        {isInstalled ? (
          <Button disabled className="w-full gap-2 bg-muted text-muted-foreground border-none">
            <CheckCircle2 className="h-4 w-4" />
            App already installed ✅
          </Button>
        ) : isIOS ? (
          <div className="rounded-lg bg-background/50 p-3 border border-border/50">
            <p className="text-xs text-foreground font-medium text-center">
              To install on iPhone: tap the share icon and then 'Add to Home Screen'.
            </p>
          </div>
        ) : (
          <Button 
            onClick={promptInstall} 
            className="w-full gap-2 font-bold shadow-sm shadow-primary/20 hover:scale-[1.01] transition-transform"
          >
            <Download className="h-4 w-4" />
            Install App 📲
          </Button>
        )}
      </div>
    </div>
  );
}
