import { useState, useEffect } from 'react';

// Tipagem básica para o evento
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Impede o Chrome mobile de exibir o banner mini-infobar automático
      e.preventDefault();
      // Armazena o evento para acionar manualmente depois
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Atualiza a UI para exibir o botão de instalar
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    
    // Mostra o pop-up nativo de instalação
    await deferredPrompt.prompt();
    
    // Aguarda o usuário responder
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA prompt');
      setIsInstallable(false);
    } else {
      console.log('User dismissed the PWA prompt');
    }
    
    // O evento só pode ser usado uma vez
    setDeferredPrompt(null);
  };

  return { isInstallable, promptInstall };
}
