
const CACHE = 'nm-v7-proto-5';

const FILES = [
  './',
  './index.html',
  './app.js',
  './catalog.js',
  './defaults.js',
  './training.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(
        FILES.map(url => new Request(url, {
          cache: 'reload'
        }))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k =>
          k.startsWith('nm-v7-proto-') &&
          k !== CACHE
        ).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (
    e.request.method !== 'GET' ||
    new URL(e.request.url).origin !== self.location.origin ||
    !e.request.url.startsWith(self.registration.scope)
  ) return;

  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(async response => {
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(e.request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE);
        return await cache.match(e.request) ||
          (e.request.mode === 'navigate'
            ? await cache.match('./index.html')
            : null) ||
          Response.error();
      })
  );
});
