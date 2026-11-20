/* Florial Manager online-only service worker. Push delivery is independent of the 15-minute list refresh. */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || request.method !== 'GET' ||
      request.mode !== 'navigate' || !url.pathname.startsWith('/manager/')) return
  event.respondWith(fetch(request))
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = {} }
  const title = typeof data.title === 'string' ? data.title.slice(0, 80) : 'Florial Manager'
  const body = typeof data.body === 'string' ? data.body.slice(0, 160) : 'Имате ново известие.'
  const target = typeof data.url === 'string' && data.url.startsWith('/manager/') ? data.url : '/manager/'
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/manager/icons/icon-192.png',
    badge: '/manager/icons/icon-192.png',
    tag: typeof data.tag === 'string' ? data.tag.slice(0, 100) : undefined,
    data: { url: target },
    renotify: false,
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data && typeof event.notification.data.url === 'string'
    ? event.notification.data.url : '/manager/'
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(target)
        return client.focus()
      }
    }
    return self.clients.openWindow(target)
  })())
})
