const CACHE_NAME = 'sukoon-shell-v2';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/css/styles.css',
  '/js/app.js',
  '/js/config.js',
  '/js/api.js',
  '/js/storage.js',
  '/js/helplines.js',
  '/js/i18n/en.js',
  '/js/modules/index.js',
  '/js/modules/stress.js',
  '/js/ui/modal.js',
  '/js/exercises/breathing.js',
  '/js/exercises/grounding.js',
  '/js/exercises/brain-dump.js',
  '/data/helplines.json',
  '/fonts/figtree-latin.woff2',
  '/fonts/newsreader-latin.woff2',
  '/fonts/noto-naskh-arabic.woff2',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache /api/* requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic' &&
            !url.pathname.startsWith('/api/')
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
