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
<<<<<<< HEAD
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
=======
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMacSafari, setIsMacSafari] = useState(false);
  const [manualMode, setManualMode] = useState<'ios' | 'mac' | null>(null); // show manual instructions (no BIP)

  const now = () => Date.now();
  const withinCooldown = (key: string) => {
    try { const v = localStorage.getItem(key); return v ? ((now() - parseInt(v, 10))/36e5) < DISMISS_HOURS : false; } catch { return false; }
  };
  const markDismiss = (key: string) => { try { localStorage.setItem(key, now().toString()); } catch {} };

  const detect = useCallback(() => {
    const ua = window.navigator.userAgent;
    const lower = ua.toLowerCase();
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    const isiOS = /iphone|ipad|ipod/.test(lower);
    setIsIOS(isiOS);
    // Heuristic for macOS Safari: contains Safari, not Chrome/Chromium/Edge/Firefox, platform Mac, not iOS
    const safariLike = /safari/i.test(ua) && !/(chrome|chromium|crios|edg|firefox|fxios|opera|opr)/i.test(ua);
    const isMac = !isiOS && /Macintosh|Mac OS X/.test(ua);
    setIsMacSafari(safariLike && isMac);
  }, []);

  const maybeShowManual = useCallback(() => {
    if (isStandalone) return;
    // iOS manual path
    if (isIOS && !withinCooldown(MANUAL_IOS_KEY)) {
      const t = setTimeout(() => { setManualMode('ios'); setShowPrompt(true); }, 2500);
      return () => clearTimeout(t);
    }
    // macOS Safari manual path (no beforeinstallprompt event)
    if (isMacSafari && !withinCooldown(MANUAL_MAC_KEY)) {
      const t = setTimeout(() => { setManualMode('mac'); setShowPrompt(true); }, 2500);
      return () => clearTimeout(t);
    }
  }, [isIOS, isMacSafari, isStandalone]);

  useEffect(() => {
    detect();
    // If app already installed, skip everything
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) return;

    const processEvent = (evt: BeforeInstallPromptEvent) => {
      if (withinCooldown(DISMISS_KEY)) return;
      // Android / Chromium path: we have an install event so no manual instructions
      setDeferredPrompt(evt);
      setManualMode(null);
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

  const cleanupManual = maybeShowManual();

    return () => {
      window.removeEventListener('bip-ready', bipReady);
      window.removeEventListener('beforeinstallprompt', lateHandler);
      if (cleanupManual) cleanupManual();
    };
  }, [detect, maybeShowManual]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] user choice:', outcome);
    setDeferredPrompt(null);
    setShowPrompt(false);
>>>>>>> 08ddb41446674dee4598f2828faf56b1c1136014
  };

  const handleDismiss = () => {
    if (manualMode === 'ios') markDismiss(MANUAL_IOS_KEY);
    else if (manualMode === 'mac') markDismiss(MANUAL_MAC_KEY);
    else markDismiss(DISMISS_KEY);
    setShowPrompt(false);
    setDeferredPrompt(null);
    // Remember that user dismissed it for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

<<<<<<< HEAD
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
=======
  // External manual trigger (e.g. header button can dispatch new Event('open-install-prompt'))
  useEffect(() => {
    const manual = () => {
      if (deferredPrompt) {
        setManualMode(null);
        setShowPrompt(true);
      } else if (isIOS && !isStandalone && !withinCooldown(MANUAL_IOS_KEY)) {
        setManualMode('ios');
        setShowPrompt(true);
      } else if (isMacSafari && !isStandalone && !withinCooldown(MANUAL_MAC_KEY)) {
        setManualMode('mac');
        setShowPrompt(true);
      }
    };
    window.addEventListener('open-install-prompt', manual);
    return () => window.removeEventListener('open-install-prompt', manual);
  }, [deferredPrompt, isIOS, isMacSafari, isStandalone]);

  if (!showPrompt) return null;

  const showManualInstructions = !!manualMode && !deferredPrompt;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {showManualInstructions ? <Info className="h-5 w-5 text-blue-600" /> : <Download className="h-5 w-5 text-blue-600" />}
          <h3 className="font-medium text-gray-900 dark:text-white">
            {showManualInstructions ? (manualMode === 'mac' ? 'Add to Dock' : 'Add to Home Screen') : 'Install SportsApp'}
          </h3>
>>>>>>> 08ddb41446674dee4598f2828faf56b1c1136014
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
<<<<<<< HEAD
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Install SportsApp for a faster, app-like experience with offline access and push notifications.
      </p>
=======
      {showManualInstructions ? (
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 space-y-2">
          {manualMode === 'ios' && (
            <>
              <p>To install on iPhone / iPad:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tap the <span className="font-medium">Share</span> icon in Safari.</li>
                <li>Select <span className="font-medium">Add to Home Screen</span>.</li>
                <li>Tap <span className="font-medium">Add</span> to finish.</li>
              </ol>
              <p className="text-xs text-gray-500 dark:text-gray-400">Safari on iOS doesn’t fire an install prompt automatically.</p>
            </>
          )}
          {manualMode === 'mac' && (
            <>
              <p>To install as a macOS web app:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>In Safari menu choose <span className="font-medium">File → Add to Dock</span> (or Share → Add to Dock).</li>
                <li>Optionally rename, then click <span className="font-medium">Add</span>.</li>
                <li>Launch it from the Dock like a native app.</li>
              </ol>
              <p className="text-xs text-gray-500 dark:text-gray-400">Safari doesn’t show the Chromium install banner.</p>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Install SportsApp for a faster, app-like experience with offline access.</p>
      )}
>>>>>>> 08ddb41446674dee4598f2828faf56b1c1136014
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          className="flex-1"
        >
          Not now
        </Button>
<<<<<<< HEAD
        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Install
        </Button>
=======
        {!showManualInstructions && deferredPrompt && (
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1"
          >
            Install
          </Button>
        )}
>>>>>>> 08ddb41446674dee4598f2828faf56b1c1136014
      </div>
    </div>
  );
}