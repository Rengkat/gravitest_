// Gravitest service worker
//
// Scope, deliberately: cache the app shell (static assets + visited pages)
// so the app opens instantly on repeat visits and shows something useful
// when the network drops — this is what "works offline" means here.
//
// What this does NOT do: queue exam answers taken while offline and sync
// them later. That's a real, separate feature (needs an IndexedDB queue +
// conflict resolution against ExamSession state on the server) and hasn't
// been built. If a student loses connectivity mid-exam right now, submitting
// an answer will fail like a normal network error — this service worker
// doesn't change that. Don't advertise "take exams offline" until that's
// actually built.

const VERSION = "v1";
const STATIC_CACHE = `gravitest-static-${VERSION}`;
const PAGES_CACHE = `gravitest-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";

// Precached at install time — the minimum needed to render *something*
// (including the offline fallback itself) with zero network.
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isApiRequest(url) {
  // Never cache API calls — exam/session/AI data must always be live.
  // Adjust this if the API is proxied under a different path/origin.
  return (
    url.pathname.startsWith("/api/") ||
    url.hostname !== self.location.hostname
  );
}

function isStaticAsset(request, url) {
  return (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never intercept mutating requests

  const url = new URL(request.url);
  if (isApiRequest(url)) return; // let the network handle it, no caching

  // Navigations (page loads): network-first, falling back to a cached
  // copy of the page, then to the offline page as a last resort.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(
          () =>
            caches.match(request).then((cached) => cached) ||
            caches.match(OFFLINE_URL),
        ),
    );
    return;
  }

  // Static assets (JS/CSS/fonts/images): cache-first, since these are
  // content-hashed by Next.js and safe to cache aggressively.
  if (isStaticAsset(request, url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else: just go to the network, no special handling.
});
