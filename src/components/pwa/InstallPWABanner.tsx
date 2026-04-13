import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstallPWABanner() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    if (isStandalone) return;

    // Detectar iOS
    const ios = (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    setIsIOS(ios);

    // Verificar se foi dispensado recentemente (7 dias)
    const dismissedAt = localStorage.getItem('pwaBannerDismissedAt');
    if (dismissedAt) {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < sevenDaysInMs) {
        return;
      }
    }

    // Se for iOS ou se o navegador disparou o evento de instalação
    if (ios || isInstallable) {
      setShowBanner(true);
    }
  }, [isInstallable]);

  if (!showBanner) return null;

  const handleDismiss = () => {
    localStorage.setItem('pwaBannerDismissedAt', Date.now().toString());
    setShowBanner(false);
  };

  const handleInstall = () => {
    if (isIOS) {
      alert('Para instalar no seu iPhone:\n1. Toque no ícone de "Compartilhar" (quadrado com seta)\n2. Role para baixo e toque em "Adicionar à Tela de Início"\n3. Toque em "Adicionar"');
    } else {
      promptInstall();
    }
  };

  return (
    <div className="bg-primary text-primary-foreground py-2.5 px-4 flex items-center justify-between shadow-md relative z-[100] animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg shrink-0">
          <Download className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-sm font-bold leading-tight truncate">Baixar App PetControl</span>
          <span className="text-[11px] opacity-90 leading-tight">
            {isIOS ? 'Adicione à tela de início para acesso rápido' : 'Mais rápido e funciona offline'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <Button 
          size="sm" 
          variant="secondary" 
          className="h-8 px-3 shadow-sm font-bold text-xs whitespace-nowrap" 
          onClick={handleInstall}
        >
          {isIOS ? 'Como Instalar?' : 'Instalar'}
        </Button>
        <button 
          className="p-1.5 opacity-70 hover:opacity-100 transition-opacity rounded-full hover:bg-black/10" 
          onClick={handleDismiss} 
          title="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
