const CACHE_VERSION = 'laplasse-v4'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

const PRECACHE = ['/', '/offline.html', '/marketplace', '/search', '/manifest.webmanifest']

const RUNTIME_PREFIXES = ['/_next/static/', '/icons/']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('laplasse-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map(key => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

function isRuntimeCacheable(url) {
  if (RUNTIME_PREFIXES.some(p => url.pathname.startsWith(p))) return true
  if (url.pathname.includes('/api/marketplace/')) return true
  return false
}

self.addEventListener('push', event => {
  let payload = { title: 'LaPlasse', body: 'Nouvelle notification', type: 'default', data: {} }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    if (event.data) payload.body = event.data.text()
  }

  const innerData = payload.data && typeof payload.data === 'object' ? payload.data : {}
  const notifData = { ...innerData, type: payload.type ?? innerData.type }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: notifData.type ?? 'laplasse',
      data: notifData,
      vibrate: [200, 100, 200],
    }),
  )
})

function resolveNotificationTarget(data) {
  if (data.href) return data.href
  if (data.type === 'delivery_job_offered' || data.job_id) {
    return data.href || '/courier/missions'
  }
  if (data.type === 'order_created') {
    if (data.merchant_id && data.order_id) return `/merchant/shop/orders/${data.order_id}`
    if (data.order_id) return '/shop/manage/orders'
  }
  if (data.type === 'booking_created' || data.type === 'booking_updated') {
    return data.merchant_id ? '/merchant/bookings' : '/profile/bookings'
  }
  if (data.order_id) return `/profile/orders/${data.order_id}`
  return '/profile/notifications'
}

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = event.notification.data ?? {}
  const target = resolveNotificationTarget(data)

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(target)
    }),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin

  if (!sameOrigin && !url.pathname.includes('/api/marketplace/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const offline = await caches.match('/offline.html')
          return offline ?? new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        }),
    )
    return
  }

  if (isRuntimeCacheable(url)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async cache => {
        try {
          const response = await fetch(request)
          if (response.ok) cache.put(request, response.clone())
          return response
        } catch {
          const cached = await cache.match(request)
          if (cached) return cached
          return new Response('', { status: 503 })
        }
      }),
    )
  }
})
