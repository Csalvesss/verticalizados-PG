import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallReturn {
  canInstallAndroid: boolean;
  showIOSInstructions: boolean;
  triggerInstall: () => Promise<void>;
  dismissIOSModal: () => void;
}

function getIsIOS(): boolean {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

function getIsStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isIOS = getIsIOS();
    const isStandalone = getIsStandalone();

    // Android/Chrome: captura o evento antes de mostrar o prompt nativo
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Limpa o botão após instalação confirmada
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS: exibe modal de instruções se não estiver em modo standalone
    // e não tiver sido dispensado nesta sessão
    if (isIOS && !isStandalone) {
      const alreadyDismissed = sessionStorage.getItem('pwa-ios-dismissed') === '1';
      if (!alreadyDismissed) {
        const timer = setTimeout(() => setShowIOSModal(true), 2500);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
          window.removeEventListener('appinstalled', handleAppInstalled);
        };
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const dismissIOSModal = () => {
    setShowIOSModal(false);
    sessionStorage.setItem('pwa-ios-dismissed', '1');
  };

  return {
    canInstallAndroid: deferredPrompt !== null,
    showIOSInstructions: showIOSModal,
    triggerInstall,
    dismissIOSModal,
  };
}
