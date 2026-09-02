import { useCallback, useEffect, useState } from 'react';

// Captures the browser's deferred install prompt (Chrome/Edge Android/Desktop).
// On iOS Safari, the API doesn't exist — we surface an iOS-specific hint instead.

type AndroidDeferredPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallKind = 'idle' | 'available' | 'installed' | 'ios';

type InstallPromptResult = {
  kind: InstallKind;
  accept: () => Promise<void>;
  dismiss: () => void;
};

const isIos = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
};

const isInStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // Safari iOS uses a non-standard prop.
  const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return standalone === true;
};

export const useInstallPrompt = (): InstallPromptResult => {
  const [kind, setKind] = useState<InstallKind>('idle');
  const [deferred, setDeferred] = useState<AndroidDeferredPrompt | null>(null);

  useEffect(() => {
    if (isInStandalone()) {
      setKind('installed');
      return;
    }
    if (sessionStorage.getItem('alarm-clock:v1:install-dismissed') === '1') {
      return;
    }
    if (isIos()) {
      setKind('ios');
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as AndroidDeferredPrompt);
      setKind('available');
    };
    const onInstalled = () => setKind('installed');

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const accept = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      setKind('installed');
    } else {
      sessionStorage.setItem('alarm-clock:v1:install-dismissed', '1');
      setKind('idle');
    }
    setDeferred(null);
  }, [deferred]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem('alarm-clock:v1:install-dismissed', '1');
    setKind('idle');
    setDeferred(null);
  }, []);

  return { kind, accept, dismiss };
};