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

  const type = data.type

  if (type === 'logistics_sla_breach' || type === 'logistics_dispatch') {
    if (data.job_id) return `/logistics/orders/${data.job_id}`
    return '/logistics/dispatch'
  }
  if (type === 'logistics_courier_underperforming') {
    if (data.courier_id) return `/logistics/fleet/${data.courier_id}`
    return '/logistics/quality'
  }
  if (type === 'logistics_onboarding_complete') return '/logistics'
  if (type === 'delivery_dispute_open') {
    if (data.logistics_partner_id) return '/logistics/quality'
    if (data.order_id) return `/profile/orders/${data.order_id}`
  }
  if (type === 'delivery_contract_proposal') {
    return '/merchant/shop/delivery-zones?tab=partners'
  }
  if (type === 'logistics_contract_request') {
    if (data.contract_id) return `/logistics/contracts/${data.contract_id}`
    return '/logistics/contracts'
  }
  if (type === 'delivery_job_offered') {
    return data.logistics_partner_id ? '/logistics/dispatch' : '/courier/missions'
  }
  if (data.job_id && data.logistics_partner_id) {
    return `/logistics/orders/${data.job_id}`
  }
  if (type === 'order_created') {
    if (data.merchant_id && data.order_id) return `/merchant/shop/orders/${data.order_id}`
    if (data.order_id) return '/shop/manage/orders'
  }
  if (type === 'booking_created' || type === 'booking_updated') {
    return data.merchant_id ? '/merchant/bookings' : '/profile/bookings'
  }
  if (data.order_id) return `/profile/orders/${data.order_id}`
  if (type === 'admin_merchant_pending') {
    return data.merchant_id ? `/admin/merchants/${data.merchant_id}` : '/admin/merchants?filter=pending'
  }
  if (type === 'admin_shop_pending') {
    return data.shop_id ? `/admin/shops/${data.shop_id}` : '/admin/shops'
  }
  if (type === 'admin_product_pending') {
    return data.product_id ? `/admin/products/${data.product_id}` : '/admin/products'
  }
  if (type === 'admin_review_pending') return '/admin/reviews'
  if (type === 'admin_product_review_pending') return '/admin/product-reviews'
  if (type === 'admin_complaint_open') return '/admin/complaints'
  if (type === 'admin_courier_kyc') return '/admin/delivery/couriers'
  if (type === 'admin_delivery_dispute') return '/admin/delivery/disputes'
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
