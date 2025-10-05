// PWA Utilities
export class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: any = null;

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
    });
  }

  // Check if app is installed
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  // Check if app is installable
  isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  // Trigger install prompt
  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      this.deferredPrompt = null;
      return true;
    }
    
    return false;
  }

  // Check if browser supports PWA
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  // Send local notification
  sendNotification(title: string, options: NotificationOptions = {}): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    }
  }

  // Get network status
  getNetworkStatus(): { online: boolean; connection?: any } {
    return {
      online: navigator.onLine,
      connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    };
  }

  // Cache management
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  // Update available detection
  async checkForUpdates(): Promise<boolean> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return registration.waiting !== null;
      }
    }
    return false;
  }

  // Skip waiting and activate new service worker
  async activateUpdate(): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();

// Hook for React components
export function usePWA() {
  return {
    isInstalled: pwaManager.isInstalled(),
    isInstallable: pwaManager.isInstallable(),
    isSupported: pwaManager.isSupported(),
    install: () => pwaManager.install(),
    requestNotificationPermission: () => pwaManager.requestNotificationPermission(),
    sendNotification: (title: string, options?: NotificationOptions) => 
      pwaManager.sendNotification(title, options),
    getNetworkStatus: () => pwaManager.getNetworkStatus(),
    clearCache: () => pwaManager.clearCache(),
    checkForUpdates: () => pwaManager.checkForUpdates(),
    activateUpdate: () => pwaManager.activateUpdate()
  };
}