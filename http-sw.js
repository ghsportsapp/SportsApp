// Simple HTTP-compatible service worker for SportsApp
const CACHE_NAME = 'sportsapp-http-v1';
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('SportsApp SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SportsApp SW: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('SportsApp SW: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.log('SportsApp SW: Cache install failed:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('SportsApp SW: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SportsApp SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SportsApp SW: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - Network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone it and store in cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try to get from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If it's a navigation request and we don't have it cached, return offline page
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
            // For other requests, just fail
            return new Response('Network error and no cached version available', {
              status: 503,
              statusText: 'Network Error'
            });
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});