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

  // Cache portal API responses for offline access (5min max-age, 20 entries max)
  const isPortalApi = url.pathname.startsWith('/api/portal/')
  if (isPortalApi) {
    event.respondWith(
      caches.open(PORTAL_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        const cachedTime = cached ? parseInt(cached.headers.get('x-sw-cached') || '0', 10) : 0
        const isExpired = !cached || (Date.now() - cachedTime > 300000)

        if (!isExpired) return cached

        try {
          const response = await fetch(event.request)
          if (response.ok) {
            const headers = new Headers(response.headers)
            headers.set('x-sw-cached', String(Date.now()))
            const body = await response.clone().arrayBuffer()
            const cachedResp = new Response(body, { status: response.status, statusText: response.statusText, headers })
            await cache.put(event.request, cachedResp)
            // Limit cache to 20 entries
            const keys = await cache.keys()
            if (keys.length > 20) await cache.delete(keys[0])
          }
          return response
        } catch {
          return cached || new Response(JSON.stringify({ offline: true }), { headers: { 'Content-Type': 'application/json' } })
        }
      })
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
