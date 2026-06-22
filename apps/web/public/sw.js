const CACHE_VERSION = 'laplasse-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

const PRECACHE = ['/', '/offline.html', '/marketplace', '/manifest.webmanifest']

const RUNTIME_CACHEABLE = [
  '/api/marketplace/product-categories',
  '/api/marketplace/featured',
  '/api/marketplace/recommendations',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
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

function isRuntimeCacheable(url) {
  if (url.pathname.startsWith('/_next/static/')) return true
  if (url.pathname.startsWith('/icons/')) return true
  return RUNTIME_CACHEABLE.some(path => url.pathname.endsWith(path.replace('/api', '')))
    || RUNTIME_CACHEABLE.some(path => url.href.includes(path))
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.origin !== self.location.origin && !url.pathname.includes('/api/marketplace/')) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const offline = await caches.match('/offline.html')
          return offline ?? new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain' } })
        }),
    )
    return
  }

  if (isRuntimeCacheable(url) || url.pathname.includes('/api/marketplace/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async cache => {
        try {
          const response = await fetch(request)
          if (response.ok) cache.put(request, response.clone())
          return response
        } catch {
          const cached = await cache.match(request)
          if (cached) return cached
          throw new Error('offline')
        }
      }),
    )
  }
})
