// Bump VERSION whenever you change any cached file, so users get the update.
const VERSION = 'v1';
const CACHE = 'mte-procurement-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
// Export libraries (XLSX, PDF). Cached on first online visit so exports also work offline.
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) =>
    c.addAll(ASSETS).then(() => Promise.allSettled(LIBS.map((u) => fetch(new Request(u, { mode: 'no-cors' })).then((r) => c.put(u, r)))))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mte-procurement-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    if (LIBS.includes(req.url)) e.respondWith(caches.match(req.url).then((hit) => hit || fetch(req)));
    return; // everything else cross-origin goes straight to the network
  }
  if (req.mode === 'navigate') {
    // Network first so updates show up; cached page when offline.
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
});
