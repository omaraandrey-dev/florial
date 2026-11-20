/* Florial Manager online-only service worker.
 * This worker intentionally does not use Cache Storage or serve stale content.
 * Only Manager navigations are passed straight through to the network.
 */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (
    url.origin !== self.location.origin ||
    request.method !== 'GET' ||
    request.mode !== 'navigate' ||
    !url.pathname.startsWith('/manager/')
  ) return

  // Online-only: no offline fallback and no response caching.
  event.respondWith(fetch(request))
})
