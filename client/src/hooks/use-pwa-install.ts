import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      // Also check for iOS Safari standalone mode
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone || isFullscreen || isMinimalUI || isIOSStandalone);
    };

    checkInstallStatus();

    // Listen for the beforeinstallprompt event
    const beforeInstallPromptHandler = (e: Event) => {
      e.preventDefault(); // Prevent the mini-infobar from appearing on mobile
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('PWA: Install prompt available');
    };

    // Listen for app installation
    const appInstalledHandler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA: App was installed');
    };

    // Listen for display mode changes (e.g., when user adds/removes from home screen)
    const displayModeHandler = () => {
      checkInstallStatus();
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    window.addEventListener('appinstalled', appInstalledHandler);
    
    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', displayModeHandler);
    window.matchMedia('(display-mode: fullscreen)').addEventListener('change', displayModeHandler);
    window.matchMedia('(display-mode: minimal-ui)').addEventListener('change', displayModeHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', displayModeHandler);
      window.matchMedia('(display-mode: fullscreen)').removeEventListener('change', displayModeHandler);
      window.matchMedia('(display-mode: minimal-ui)').removeEventListener('change', displayModeHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      alert('To install this app:\n\n1. On Chrome/Edge: Click the install icon in the address bar\n2. On Safari: Tap Share → Add to Home Screen\n3. On Firefox: Look for the install option in the menu');
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to the install prompt: ${outcome}`);

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('PWA: Error during installation:', error);
    }
  };

  return {
    isInstalled,
    isInstallable,
    canInstall: !isInstalled && isInstallable,
    handleInstall,
    deferredPrompt
  };
}