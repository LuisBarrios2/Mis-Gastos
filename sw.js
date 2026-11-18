/* Mis Gastos — guarda la app en el dispositivo para usarla sin conexión.
   No guarda ni envía tus datos: estos viven en IndexedDB del navegador. */
const CACHE = 'mis-gastos-1.2.0';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin === location.origin) {
    // Primero la red (para recibir actualizaciones); sin conexión, la copia guardada.
    e.respondWith(fetch(r).then(resp => {
      if (resp.ok) { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return resp;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./index.html'))));
  } else if (url.hostname === 'cdnjs.cloudflare.com') {
    // Librería de Excel: se guarda la primera vez que se usa para poder exportar sin conexión.
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(resp => {
      if (resp.ok) { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return resp;
    })));
  }
});
