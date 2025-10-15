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

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      setIsInstalled(isStandalone || isFullscreen || isMinimalUI);
    };

    checkInstallStatus();

    // Listen for the beforeinstallprompt event
    const beforeInstallPromptHandler = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      // Don't prevent the default - let the browser show its native prompt
      // But also store the event for our custom prompt
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom prompt after a short delay to not interfere
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 3000); // Wait 3 seconds to allow native prompt first
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
      // Clear dismissal and show prompt if we have a deferred prompt
      sessionStorage.removeItem('pwa-install-dismissed');
      if (deferredPrompt && !isInstalled) {
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
  }, [isInstalled, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

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
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
    // Remember that user dismissed it for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showInstallPrompt || !deferredPrompt) return null;

  // Don't show if dismissed this session
  if (sessionStorage.getItem('pwa-install-dismissed')) return null;

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
        Install SportsApp for a faster, app-like experience with offline access and push notifications.
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
          Install
        </Button>
      </div>
    </div>
  );
}