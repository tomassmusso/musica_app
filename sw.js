const CACHE_NAME = 'music-tracker-v1';

// Solo cacheamos lo básico que sí existe en tu carpeta
const assets = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    }).catch(() => {
        // Si todo falla, no hacemos nada
    })
  );
});