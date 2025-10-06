import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const isStandalone = () => (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
  const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  useEffect(() => {
    // If already installed, do nothing
    if (isStandalone()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari does NOT fire beforeinstallprompt. Show custom instructions after a short delay
    if (isIOS() && !isStandalone()) {
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        const timeout = setTimeout(() => setShowIOSInstructions(true), 3000);
        return () => {
          clearTimeout(timeout);
          window.removeEventListener('beforeinstallprompt', handler);
        };
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  const handleIOSDismiss = () => {
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-ios-dismissed', '1');
  };

  // Render iOS instructions if applicable
  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Add SportsApp to Home Screen</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleIOSDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
          Tap <span className="font-semibold">Share</span> {"("}
          <span role="img" aria-label="share" className="inline-block">⬆️</span>{")"} then choose <span className="font-semibold">Add to Home Screen</span> to install the app.
        </p>
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          iOS doesn’t show an automatic install prompt like Android.
        </div>
      </div>
    );
  }

  if (!showInstallPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Download className="h-5 w-5 text-blue-600" />
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
        Install SportsApp for a faster, app-like experience with offline access.
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
          className="flex-1"
        >
          Install
        </Button>
      </div>
    </div>
  );
}