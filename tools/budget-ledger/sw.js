// Budget Ledger offline support. Keeps the app working without internet.
// Your entries are never sent anywhere; they stay in this browser on this device.
const CACHE = 'budget-ledger-v4';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Use the newest version when online; fall back to the saved copy when offline.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Skip the walkthrough video so it streams from the site instead of filling the offline copy.
  if (e.request.method !== 'GET' || u.origin !== location.origin || /\.(mp4|jpg)$/i.test(u.pathname)) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html'))));
});
