// Retire the former public app cache when an existing installation reconnects.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('plr-profit-check-')).map(key => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({type: 'window'});
    const scope = new URL(self.registration.scope);
    await Promise.all(windows.filter(client => {
      const url = new URL(client.url);
      return url.origin === scope.origin && (url.pathname === scope.pathname || url.pathname === scope.pathname + 'index.html');
    }).map(client => client.navigate(client.url).catch(() => {})));
    await self.registration.unregister();
  })());
});
