// Bundle optimization and code splitting utilities

// Dynamic import wrapper with error handling and loading states
export function createDynamicImport<T = any>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
) {
  return async (): Promise<T> => {
    try {
      const module = await importFn();
      return module.default;
    } catch (error) {
      console.error('Dynamic import failed:', error);
      if (fallback) {
        return fallback;
      }
      throw error;
    }
  };
}

// Preload critical chunks
export function preloadChunk(chunkName: string) {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = `/src/${chunkName}`;
  document.head.appendChild(link);
}

// Critical resource preloader
export function preloadCriticalResources() {
  // Preload essential fonts
  const fonts = [
    '/fonts/inter-var.woff2',
    '/fonts/space-grotesk.woff2'
  ];
  
  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload critical API endpoints
  const criticalEndpoints = [
    '/api/user',
    '/api/posts',
    '/api/notifications/unread-count'
  ];

  criticalEndpoints.forEach(endpoint => {
    fetch(endpoint, { credentials: 'include' }).catch(() => {
      // Silently fail for preloading
    });
  });
}

// Service Worker registration for caching
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', registration);
      } catch (error) {
        console.log('SW registration failed:', error);
      }
    });
  }
}

// Resource prioritization
export function optimizeResourceLoading() {
  // Mark critical images as high priority
  document.querySelectorAll('[data-critical-image]').forEach(img => {
    if (img instanceof HTMLImageElement) {
      img.fetchPriority = 'high';
    }
  });

  // Defer non-critical scripts
  document.querySelectorAll('script[data-defer]').forEach(script => {
    if (script instanceof HTMLScriptElement) {
      script.defer = true;
    }
  });
}

// Initialize all optimizations
export function initializeBundleOptimizations() {
  // Run immediately
  preloadCriticalResources();
  registerServiceWorker();
  
  // Run after DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeResourceLoading);
  } else {
    optimizeResourceLoading();
  }
}