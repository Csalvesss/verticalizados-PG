import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { prepareInstallToken } from '../hooks/useInstallTransfer';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallContextValue {
  canInstallAndroid: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  showIOSModal: boolean;
  iosAdded: boolean;
  triggerInstall: () => Promise<void>;
  openIOSModal: () => void;
  dismissIOSModal: () => void;
  confirmIOSAdded: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextValue | null>(null);

export function PWAInstallProvider({ children, uid }: { children: ReactNode; uid?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [iosAdded, setIosAdded] = useState(
    () => localStorage.getItem('pwa-ios-added') === '1'
  );

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
    // Gera token de transferência de sessão antes de mostrar o prompt de instalação
    if (uid) prepareInstallToken(uid).catch(() => null);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const openIOSModal = () => {
    // Gera token de transferência de sessão para iOS (antes de "Adicionar à Tela")
    if (uid) prepareInstallToken(uid).catch(() => null);
    setShowIOSModal(true);
  };

  const dismissIOSModal = () => {
    setShowIOSModal(false);
  };

  const confirmIOSAdded = () => {
    setShowIOSModal(false);
    setIosAdded(true);
    localStorage.setItem('pwa-ios-added', '1');
  };

  return (
    <PWAInstallContext.Provider value={{
      canInstallAndroid: deferredPrompt !== null,
      isIOS,
      isStandalone,
      showIOSModal,
      iosAdded,
      triggerInstall,
      openIOSModal,
      dismissIOSModal,
      confirmIOSAdded,
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
