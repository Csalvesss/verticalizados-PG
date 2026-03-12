import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallContextValue {
  canInstallAndroid: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  showIOSModal: boolean;
  triggerInstall: () => Promise<void>;
  openIOSModal: () => void;
  dismissIOSModal: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextValue | null>(null);

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => setDeferredPrompt(null);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const openIOSModal = () => setShowIOSModal(true);

  const dismissIOSModal = () => {
    setShowIOSModal(false);
    sessionStorage.setItem('pwa-ios-dismissed', '1');
  };

  return (
    <PWAInstallContext.Provider value={{
      canInstallAndroid: deferredPrompt !== null,
      isIOS,
      isStandalone,
      showIOSModal,
      triggerInstall,
      openIOSModal,
      dismissIOSModal,
    }}>
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstallContext(): PWAInstallContextValue {
  const ctx = useContext(PWAInstallContext);
  if (!ctx) throw new Error('usePWAInstallContext must be used inside PWAInstallProvider');
  return ctx;
}
