const CACHE_NAME = 'dailylifesync-v2';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - Bypass local WebView assets and use Network-First strategy
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Do NOT intercept local Capacitor or localhost requests to avoid breaking native app bundles
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('capacitor')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
