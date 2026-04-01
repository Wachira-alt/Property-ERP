const CACHE_NAME = "property-erp-v1"

// App shell — files that form the UI skeleton
const APP_SHELL = [
  "/",
  "/contacts",
  "/login",
]

// Install — cache the shell immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL)
    })
  )
  self.skipWaiting()
})

// Activate — remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch — strategy depends on request type
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Always network-first for API routes — never serve stale data
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/")
  ) {
    event.respondWith(fetch(request))
    return
  }

  // Network-first for navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigations for offline fallback
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
          return response
        })
        .catch(() => {
          // Offline fallback — serve from cache
          return caches.match(request).then(
            (cached) => cached ?? caches.match("/")
          )
        })
    )
    return
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(
      (cached) => cached ?? fetch(request)
    )
  )
})