const CACHE_NAME = 'cobrahub-v2'
const PORTAL_CACHE = 'cobrahub-portal-v1'
const PRECACHE = ['/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== PORTAL_CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Clear portal cache on logout (triggered by client-side code)
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_PORTAL_CACHE') {
    caches.delete(PORTAL_CACHE)
  }
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  // Cache portal API responses for offline access
  const isPortalApi = url.pathname.startsWith('/api/portal/')
  if (isPortalApi) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(PORTAL_CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request).then((cached) =>
          cached || new Response(JSON.stringify({ offline: true }), { headers: { 'Content-Type': 'application/json' } })
        ))
    )
    return
  }

  // Cache static assets
  const isStatic = url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')

  if (!isStatic) return

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    )
  )
})
