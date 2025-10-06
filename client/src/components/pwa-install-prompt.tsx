import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global { interface Window { __bipEvent?: BeforeInstallPromptEvent | null } }

const DISMISS_KEY = 'pwa_install_dismissed_at';
const IOS_DISMISS_KEY = 'pwa_ios_dismissed_at';
const DISMISS_HOURS = 24; // cooldown to re-show

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [iosMode, setIOSMode] = useState(false); // show iOS instructions

  const now = () => Date.now();
  const withinCooldown = (key: string) => {
    try { const v = localStorage.getItem(key); return v ? ((now() - parseInt(v, 10))/36e5) < DISMISS_HOURS : false; } catch { return false; }
  };
  const markDismiss = (key: string) => { try { localStorage.setItem(key, now().toString()); } catch {} };

  const detect = useCallback(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
  }, []);

  const maybeShowIOS = useCallback(() => {
    if (!isIOS || isStandalone) return;
    if (withinCooldown(IOS_DISMISS_KEY)) return;
    // delay a little to avoid flash during initial load
    const t = setTimeout(() => { setIOSMode(true); setShowPrompt(true); }, 2500);
    return () => clearTimeout(t);
  }, [isIOS, isStandalone]);

  useEffect(() => {
    detect();
    // If app already installed, skip everything
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) return;

    const processEvent = (evt: BeforeInstallPromptEvent) => {
      if (withinCooldown(DISMISS_KEY)) return;
      setDeferredPrompt(evt);
      setIOSMode(false);
      setShowPrompt(true);
    };

    // If early-captured
    if (window.__bipEvent) {
      processEvent(window.__bipEvent);
    }

    const bipReady = () => { if (window.__bipEvent) processEvent(window.__bipEvent); };
    const lateHandler = (e: Event) => { e.preventDefault(); processEvent(e as BeforeInstallPromptEvent); };
    window.addEventListener('bip-ready', bipReady);
    window.addEventListener('beforeinstallprompt', lateHandler);
    window.addEventListener('appinstalled', () => { setShowPrompt(false); setDeferredPrompt(null); });

    const cleanupIOS = maybeShowIOS();

    return () => {
      window.removeEventListener('bip-ready', bipReady);
      window.removeEventListener('beforeinstallprompt', lateHandler);
      if (cleanupIOS) cleanupIOS();
    };
  }, [detect, maybeShowIOS]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] user choice:', outcome);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    if (iosMode) markDismiss(IOS_DISMISS_KEY); else markDismiss(DISMISS_KEY);
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  // External manual trigger (e.g. header button can dispatch new Event('open-install-prompt'))
  useEffect(() => {
    const manual = () => {
      if (deferredPrompt) {
        setIOSMode(false);
        setShowPrompt(true);
      } else if (isIOS && !isStandalone && !withinCooldown(IOS_DISMISS_KEY)) {
        setIOSMode(true);
        setShowPrompt(true);
      }
    };
    window.addEventListener('open-install-prompt', manual);
    return () => window.removeEventListener('open-install-prompt', manual);
  }, [deferredPrompt, isIOS, isStandalone]);

  if (!showPrompt) return null;

  const showIOSInstructions = iosMode && !deferredPrompt;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {showIOSInstructions ? <Info className="h-5 w-5 text-blue-600" /> : <Download className="h-5 w-5 text-blue-600" />}
          <h3 className="font-medium text-gray-900 dark:text-white">{showIOSInstructions ? 'Add to Home Screen' : 'Install SportsApp'}</h3>
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
      {showIOSInstructions ? (
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 space-y-2">
          <p>To install on iOS:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Tap the <span className="font-medium">Share</span> icon in Safari.</li>
            <li>Select <span className="font-medium">Add to Home Screen</span>.</li>
            <li>Tap <span className="font-medium">Add</span> to finish.</li>
          </ol>
          <p className="text-xs text-gray-500 dark:text-gray-400">iOS does not show an automatic prompt.</p>
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Install SportsApp for a faster, app-like experience with offline access.
        </p>
      )}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          className="flex-1"
        >
          Not now
        </Button>
        {!showIOSInstructions && deferredPrompt && (
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1"
          >
            Install
          </Button>
        )}
      </div>
    </div>
  );
}