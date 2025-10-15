import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global { interface Window { __bipEvent?: BeforeInstallPromptEvent | null } }

const DISMISS_KEY = 'pwa_install_dismissed_at';        // Android (BIP event) cooldown
const MANUAL_IOS_KEY = 'pwa_ios_dismissed_at';         // iOS instructions cooldown
const MANUAL_MAC_KEY = 'pwa_mac_dismissed_at';         // macOS Safari instructions cooldown
const DISMISS_HOURS = 24; // cooldown to re-show any prompt

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  console.log('PWA: Component state -', { deferredPrompt: !!deferredPrompt, showInstallPrompt, isInstalled });

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      const installed = isStandalone || isFullscreen || isMinimalUI;
      setIsInstalled(installed);
      
      console.log('PWA: Install status check -', { 
        installed, 
        isStandalone, 
        isFullscreen, 
        isMinimalUI,
        dismissed: !!sessionStorage.getItem('pwa-install-dismissed')
      });
      
      // If not installed and not dismissed recently, show prompt after delay
      if (!installed && !sessionStorage.getItem('pwa-install-dismissed')) {
        console.log('PWA: Scheduling initial prompt to show in 3 seconds');
        setTimeout(() => {
          console.log('PWA: Showing initial prompt');
          setShowInstallPrompt(true);
        }, 3000); // Show after 3 seconds on initial load
      }
    };

    checkInstallStatus();

    // Listen for the beforeinstallprompt event
    const beforeInstallPromptHandler = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault(); // Prevent the browser's default install prompt
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // If we weren't already showing the prompt, show it now
      if (!isInstalled && !sessionStorage.getItem('pwa-install-dismissed')) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 1000); // Shorter delay when event fires
      }
    };

    // Listen for app installation
    const appInstalledHandler = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Listen for custom event to show install prompt
    const showInstallPromptHandler = () => {
      console.log('PWA: Custom show install prompt event');
      // Clear dismissal and always show prompt when manually triggered
      sessionStorage.removeItem('pwa-install-dismissed');
      if (!isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    window.addEventListener('appinstalled', appInstalledHandler);
    window.addEventListener('show-pwa-install-prompt', showInstallPromptHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
      window.removeEventListener('show-pwa-install-prompt', showInstallPromptHandler);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`User response to the install prompt: ${outcome}`);

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowInstallPrompt(false);

        if (outcome === 'accepted') {
          console.log('PWA: User accepted the install prompt');
        }
      } catch (error) {
        console.error('PWA: Error during installation:', error);
      }
    } else {
      // Fallback: Show manual installation instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      let instructions = '';
      if (isIOS) {
        instructions = 'To install this app on iOS:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
      } else if (isSafari) {
        instructions = 'To install this app on Safari:\n\n1. Click the Share button in the toolbar\n2. Click "Add to Dock" or "Add to Home Screen"';
      } else {
        instructions = 'To install this app:\n\n1. Look for an install icon in your browser\'s address bar\n2. Or check your browser\'s menu for "Install" or "Add to Home Screen" option\n3. Follow the prompts to install';
      }
      
      alert(instructions);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
    // Remember that user dismissed it for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed
  if (isInstalled) return null;

  // Don't show if not supposed to show
  if (!showInstallPrompt) return null;

  // Don't show if dismissed this session (unless manually triggered)
  if (sessionStorage.getItem('pwa-install-dismissed') && !showInstallPrompt) return null;

  return (
    <div 
      data-pwa-install-prompt
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900 dark:text-white">Install SportsApp</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {deferredPrompt 
          ? "Install SportsApp for a faster, app-like experience with offline access and push notifications."
          : "Get the SportsApp on your device for quick access and better performance."
        }
      </p>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          className="flex-1"
        >
          Not now
        </Button>
        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          {deferredPrompt ? "Install" : "How to Install"}
        </Button>
      </div>
    </div>
  );
}