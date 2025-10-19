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
    console.log('PWA: Initializing PWA install hook');
    
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      // Also check for iOS Safari standalone mode
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      const installed = isStandalone || isFullscreen || isMinimalUI || isIOSStandalone;
      console.log('PWA: Install status check', { 
        isStandalone, 
        isFullscreen, 
        isMinimalUI, 
        isIOSStandalone, 
        installed 
      });
      
      setIsInstalled(installed);
    };

    checkInstallStatus();

    // Listen for the beforeinstallprompt event
    const beforeInstallPromptHandler = (e: Event) => {
      console.log('PWA: beforeinstallprompt event received', e);
      e.preventDefault(); // Prevent the mini-infobar from appearing on mobile
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('PWA: Install prompt available and deferred');
    };

    // Listen for app installation
    const appInstalledHandler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA: App was installed via appinstalled event');
    };

    // Listen for display mode changes (e.g., when user adds/removes from home screen)
    const displayModeHandler = () => {
      console.log('PWA: Display mode changed, rechecking install status');
      checkInstallStatus();
    };

    // Check if beforeinstallprompt has already fired (in some cases it fires before our listener is attached)
    if ((window as any).deferredPrompt) {
      console.log('PWA: Found existing deferred prompt on window object');
      setDeferredPrompt((window as any).deferredPrompt);
      setIsInstallable(true);
    }

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    window.addEventListener('appinstalled', appInstalledHandler);
    
    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', displayModeHandler);
    window.matchMedia('(display-mode: fullscreen)').addEventListener('change', displayModeHandler);
    window.matchMedia('(display-mode: minimal-ui)').addEventListener('change', displayModeHandler);

    // For debugging: Check if PWA criteria are met
    setTimeout(() => {
      console.log('PWA: Status after 2 seconds', {
        isInstalled,
        isInstallable,
        hasDeferredPrompt: !!deferredPrompt,
        hasServiceWorker: 'serviceWorker' in navigator,
        isSecureContext: window.isSecureContext,
        manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href')
      });
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', displayModeHandler);
      window.matchMedia('(display-mode: fullscreen)').removeEventListener('change', displayModeHandler);
      window.matchMedia('(display-mode: minimal-ui)').removeEventListener('change', displayModeHandler);
    };
  }, []);

  const handleInstall = async () => {
    console.log('PWA: handleInstall called', { 
      hasDeferredPrompt: !!deferredPrompt, 
      isInstallable, 
      isInstalled 
    });
    
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available, showing manual instructions');
      
      // Fallback: Show manual instructions only if no prompt is available
      alert('To install this app:\n\n1. On Chrome/Edge: Click the install icon in the address bar\n2. On Safari: Tap Share → Add to Home Screen\n3. On Firefox: Look for the install option in the menu');
      return;
    }

    try {
      // Show the native install prompt
      console.log('PWA: Showing native install prompt...');
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`PWA: User response to the install prompt: ${outcome}`);

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
    } catch (error) {
      console.error('PWA: Error during installation:', error);
      // Fallback to manual instructions on error
      alert('To install this app:\n\n1. On Chrome/Edge: Click the install icon in the address bar\n2. On Safari: Tap Share → Add to Home Screen\n3. On Firefox: Look for the install option in the menu');
    }
  };

  return {
    isInstalled,
    isInstallable,
    canInstall: !isInstalled && (isInstallable || deferredPrompt !== null),
    handleInstall,
    deferredPrompt,
    hasNativePrompt: deferredPrompt !== null
  };
}