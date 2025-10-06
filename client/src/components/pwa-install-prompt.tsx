import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Info } from 'lucide-react';

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

// Feature toggles / tuning
const AUTO_SHOW_DELAY_MS = 600;            // how soon after event/manual detection to show overlay
const ATTEMPT_AUTO_INSTALL_ON_FIRST_GESTURE = true; // try to call prompt() on first pointer interaction (Android/Chromium only)
const SUPPRESS_MANUAL_DELAY_IF_FIRST_VISIT = true;  // show iOS/mac instructions immediately (no 2.5s delay) on first visit

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMacSafari, setIsMacSafari] = useState(false);
  const [manualMode, setManualMode] = useState<'ios' | 'mac' | null>(null); // show manual instructions (no BIP)
  const [autoInstallAttempted, setAutoInstallAttempted] = useState(false);

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
      if (SUPPRESS_MANUAL_DELAY_IF_FIRST_VISIT && !localStorage.getItem(MANUAL_IOS_KEY)) {
        setManualMode('ios'); setShowPrompt(true);
      } else {
        const t = setTimeout(() => { setManualMode('ios'); setShowPrompt(true); }, 2500);
        return () => clearTimeout(t);
      }
    }
    // macOS Safari manual path (no beforeinstallprompt event)
    if (isMacSafari && !withinCooldown(MANUAL_MAC_KEY)) {
      if (SUPPRESS_MANUAL_DELAY_IF_FIRST_VISIT && !localStorage.getItem(MANUAL_MAC_KEY)) {
        setManualMode('mac'); setShowPrompt(true);
      } else {
        const t = setTimeout(() => { setManualMode('mac'); setShowPrompt(true); }, 2500);
        return () => clearTimeout(t);
      }
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
      // Show after a small delay to avoid layout shift on initial paint
      setTimeout(() => setShowPrompt(true), AUTO_SHOW_DELAY_MS);
      if (ATTEMPT_AUTO_INSTALL_ON_FIRST_GESTURE) {
        // Attach one-time listener to attempt automatic prompt on first explicit user gesture
        const gestureHandler = () => {
          if (!autoInstallAttempted && deferredPrompt) {
            try {
              deferredPrompt.prompt();
              setAutoInstallAttempted(true);
            } catch (err) {
              // swallow errors; user can still click Install
              console.warn('[PWA] auto install attempt failed:', err);
            }
          }
        };
        window.addEventListener('pointerdown', gestureHandler, { once: true });
      }
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
  };

  const handleDismiss = () => {
    if (manualMode === 'ios') markDismiss(MANUAL_IOS_KEY);
    else if (manualMode === 'mac') markDismiss(MANUAL_MAC_KEY);
    else markDismiss(DISMISS_KEY);
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

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
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          className="flex-1"
        >
          Not now
        </Button>
        {!showManualInstructions && deferredPrompt && (
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