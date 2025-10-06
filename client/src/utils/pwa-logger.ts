// PWA Event Logger - Add this to main.tsx for debugging
export function logPWAEvents() {
  // Log when beforeinstallprompt fires
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🚀 PWA: beforeinstallprompt event fired', e);
    console.log('📱 PWA: User can install the app now');
  });

  // Log when app gets installed
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA: App was installed successfully');
  });

  // Log service worker events
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 PWA: Service worker controller changed');
    });

    navigator.serviceWorker.ready.then((registration) => {
      console.log('✅ PWA: Service worker is ready', registration);
    });
  }

  // Log display mode
  const getDisplayMode = () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    return 'browser';
  };

  console.log('📺 PWA: Display mode:', getDisplayMode());

  // Log user agent for debugging
  console.log('🌐 PWA: User Agent:', navigator.userAgent);
  
  // Check if PWA criteria are met
  const checkPWACriteria = async () => {
    const criteria = {
      https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      serviceWorker: 'serviceWorker' in navigator,
      manifest: false
    };

    try {
      const manifestResponse = await fetch('/manifest.webmanifest');
      criteria.manifest = manifestResponse.ok;
    } catch (error) {
      console.warn('PWA: Could not fetch manifest');
    }

    console.log('📋 PWA: Criteria check:', criteria);
    
    const allMet = Object.values(criteria).every(Boolean);
    console.log(allMet ? '✅ PWA: All criteria met' : '❌ PWA: Some criteria not met');
  };

  // Check criteria after a delay
  setTimeout(checkPWACriteria, 1000);
}