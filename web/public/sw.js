/* Burmanlabs service worker: small, dependency-free, built for patchy mobile data.
 *
 *  - Pages and Next.js RSC data: network first (3.5 s), then the cached copy, then /offline.html.
 *  - Hashed static assets (/_next/static/*, fonts, icons): cache first, they never change.
 *  - "Save on this phone" posts the page list here; we download the pages and the JS/CSS/fonts
 *    they reference so they open with no network at all.
 *
 * Bump VERSION to drop every old cache.
 */
const VERSION = "v2";
const CACHE = `burmanlabs-${VERSION}`;
const SHELL = ["/offline.html", "/fonts/noto-myanmar-400.woff2", "/fonts/noto-myanmar-700.woff2", "/icon-192.png"];
const NETWORK_TIMEOUT = 3500;
const ASSET_RE = /(?:\/_next\/)?static\/(?:chunks|css|media)\/[A-Za-z0-9_\-.~%]+\.(?:js|css|woff2?)/g;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Cache only responses that are safe to replay for a navigation. */
function cacheable(res) {
  return res && res.ok && !res.redirected && res.type !== "opaque";
}

async function networkFirst(request, { fallbackToOfflinePage = false } = {}) {
  const cache = await caches.open(CACHE);
  try {
    const res = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT);
      fetch(request).then(
        (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        },
      );
    });
    if (cacheable(res)) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(request);
    if (hit) return hit;

    // Timed out on a slow link and nothing cached: keep waiting for the real response.
    if (err && err.message === "timeout") {
      try {
        const res = await fetch(request);
        if (cacheable(res)) cache.put(request, res.clone());
        return res;
      } catch {}
    }
    if (fallbackToOfflinePage) {
      const url = new URL(request.url);
      if (url.pathname === "/") {
        const home = (await cache.match("/my")) || (await cache.match("/en"));
        if (home) return home;
      }
      const offline = await cache.match("/offline.html");
      if (offline) return offline;
    }
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (cacheable(res)) cache.put(request, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, { fallbackToOfflinePage: true }));
    return;
  }
  if (url.searchParams.has("_rsc") || request.headers.get("rsc")) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/studio/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:png|jpg|jpeg|webp|svg|woff2?|ico)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
  }
});

async function precache(urls) {
  const cache = await caches.open(CACHE);
  const assets = new Set();
  let failed = 0;

  for (const u of urls) {
    try {
      const res = await fetch(u, { credentials: "same-origin" });
      if (!cacheable(res)) throw new Error("bad response");
      const copy = res.clone();
      const html = await res.text();
      await cache.put(u, copy);
      for (const m of html.matchAll(ASSET_RE)) {
        assets.add("/_next/" + m[0].replace(/^\/?(?:_next\/)?/, ""));
      }
    } catch {
      failed++;
    }
  }
  for (const a of assets) {
    try {
      if (await cache.match(a)) continue;
      const res = await fetch(a);
      if (cacheable(res)) await cache.put(a, res);
      else failed++;
    } catch {
      failed++;
    }
  }
  return failed;
}

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "precache") return;
  const source = event.source;
  event.waitUntil(
    precache(event.data.urls || []).then(async (failed) => {
      const clients = source ? [source] : await self.clients.matchAll();
      clients.forEach((c) => c.postMessage({ type: "precache-done", failed }));
    }),
  );
});
