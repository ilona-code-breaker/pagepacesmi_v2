// PagePace offline support: pages network-first, built files and covers cached.
const VERSION = 'pagepace-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/~oauth')) return;
  if (url.origin !== self.location.origin && !url.hostname.endsWith('books.google.com') && !['covers.openlibrary.org','fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const c = res.clone(); caches.open(VERSION + '-pages').then((cache) => cache.put(req, c)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match('/'))));
    return;
  }
  const isAsset = url.origin === self.location.origin && /\.(js|css|png|svg|ico|woff2)$/.test(url.pathname);
  const isExternal = ['covers.openlibrary.org', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) || url.hostname.endsWith('books.google.com');
  if (isAsset || isExternal) {
    e.respondWith(caches.open(VERSION + '-assets').then((cache) => cache.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }))));
  }
});
