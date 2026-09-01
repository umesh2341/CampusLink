/* CampusLink Service Worker — Push Notifications + Offline Caching */

const CACHE_NAME = 'campuslink-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/favicon.svg',
  '/icon.svg',
  '/icon-maskable.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => clients.claim())
  );
});

// Handle incoming Web Push notifications
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'CampusLink Alert', body: event.data.text() };
    }
  }

  const title = payload.title || '[ CAMPUSLINK EVENT ALERT ]';
  const options = {
    body: payload.body || 'A new event has been published on campus!',
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    tag: payload.tag || 'campuslink-event',
    data: {
      url: payload.url || '/',
      eventId: payload.eventId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click to open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle fetch events for offline caching
// Strategy: Cache-first for same-origin static assets, network-first for API requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API requests: network-first (never cache API responses)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Same-origin static assets: cache-first, fall back to network
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Only cache successful responses for navigation/resource requests
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Network failed and not in cache — serve offline page for navigation requests only
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response(null, { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
    return;
  }
});
