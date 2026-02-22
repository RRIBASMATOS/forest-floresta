/* Forest Shuffle Automa PWA Service Worker */
const CACHE_NAME = "fs-floresta-v19";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/tabela_desafios.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
      // Cache all automa images
      try {
        const imgList = await fetch("./asset-manifest.json").then(r => r.json());
        if (Array.isArray(imgList.images)) {
          await cache.addAll(imgList.images);
        }
      } catch(e) {}
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // stale-while-revalidate (robusto para GitHub Pages)

  const req = event.request;
  // Only handle GET
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        // cache successful same-origin responses
        const url = new URL(req.url);
        if (url.origin === self.location.origin && resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return resp;
      }).catch(() => {
        // Offline fallback: return index for navigations
        if (req.mode === "navigate") return caches.match("./index.html");
        return cached;
      });
    })
  );
});
