const CACHE_NAME = "minikenterprise-gallery-v2";
const SCOPE_URL = new URL(self.registration.scope);
const scopedUrl = (path) => new URL(path, SCOPE_URL).href;
const GALLERY_MANIFEST_URL = scopedUrl("js/data/gallery-manifest.json");
const APP_SHELL = [
  scopedUrl(""),
  scopedUrl("index.html"),
  scopedUrl("style.css"),
  scopedUrl("js/gallery.js"),
  GALLERY_MANIFEST_URL,
];

async function cacheGalleryImages(cache) {
  const response = await fetch(GALLERY_MANIFEST_URL);
  if (!response.ok) throw new Error(`Could not load gallery manifest: ${response.status}`);

  const photos = await response.clone().json();
  await cache.put(GALLERY_MANIFEST_URL, response);
  await cache.addAll(photos.map((photo) => scopedUrl(`images/gallery/${photo.file}`)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL.filter((url) => url !== GALLERY_MANIFEST_URL));
      await cacheGalleryImages(cache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    ).then(() => self.clients.claim())
  );
});

function isGalleryRequest(requestUrl) {
  return requestUrl.href === GALLERY_MANIFEST_URL ||
    requestUrl.href.startsWith(scopedUrl("images/gallery/"));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(scopedUrl("index.html")))
    );
    return;
  }

  if (!isGalleryRequest(requestUrl)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkResponse = fetch(event.request).then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      });

      if (cachedResponse) {
        event.waitUntil(networkResponse.catch(() => undefined));
        return cachedResponse;
      }

      return networkResponse;
    })
  );
});