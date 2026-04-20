/* sw.js — Docentes Hub (PWA) — PRO++ (auto-update-friendly)
   Estrategia:
   - Precachéa SOLO lo esencial estable (HTML + manifest + icons + logo)
     (NO precachea app.js / styles.css para evitar “pegues” en iOS)
   - Navegación: Network-first con fallback offline a index.html
   - JS/CSS/manifest (same-origin): Network-first + cache:"reload" (siempre lo último)
   - Otros same-origin assets: Stale-While-Revalidate
   - Limpieza suave de cachés viejos + mensajería a la UI
*/

const BUILD = "2026-03-05.3";
const VERSION = `v7-${BUILD}`;

// Nombres sin versión (para no acumular basura)
const CACHE_STATIC  = "musicala-static";
const CACHE_RUNTIME = "musicala-runtime";

// Por si antes usaste otros nombres:
const OLD_CACHES_PREFIXES = ["musicala-", "fm-", "ferma-", "hub-"];

// Core assets: mínimo estable (NO app.js / styles.css)
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

/* =========================
   Utils
========================= */
const isHttp = (url) => url.protocol === "http:" || url.protocol === "https:";
const isRangeRequest = (req) => req.headers && req.headers.has("range");

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isHTML(req) {
  // Navegación o accept HTML
  return req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
}

function isCriticalFreshAsset(url) {
  // Fuerza “siempre lo último” para estos (evita pegues + asegura update)
  const p = url.pathname;
  return (
    p.endsWith("/app.js") ||
    p.endsWith("/styles.css") ||
    p.endsWith("/manifest.webmanifest")
  );
}

function indexCacheKeyRequest() {
  // Clave única para fallback offline
  return new Request("./index.html", { cache: "reload" });
}

async function postToAllClients(payload) {
  try {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) client.postMessage(payload);
  } catch (_) {}
}

async function safeCachePut(cache, request, response) {
  try {
    if (!cache || !request || !response) return;

    // No guardar respuestas parciales (range) o errores
    if (response.status === 206) return;
    if (response.status >= 400) return;

    // Opaque = cross-origin no-inspectable. No lo cacheamos aquí.
    if (response.type === "opaque") return;

    await cache.put(request, response);
  } catch (_) {}
}

async function cacheCoreAssets_() {
  const cache = await caches.open(CACHE_STATIC);

  await Promise.allSettled(
    CORE_ASSETS.map(async (path) => {
      try {
        // cache:"reload" evita quedarnos con caché HTTP viejo
        const req = new Request(path, { cache: "reload" });
        const res = await fetch(req);

        // Guardamos con la misma key Request (más correcto)
        await safeCachePut(cache, req, res.clone());
      } catch (_) {
        // si falla, no dramatizamos: el runtime puede rescatar luego
      }
    })
  );
}

async function cleanupOldCaches_() {
  try {
    const keys = await caches.keys();
    const keep = new Set([CACHE_STATIC, CACHE_RUNTIME]);

    await Promise.allSettled(
      keys.map(async (k) => {
        if (keep.has(k)) return;

        // Limpieza “suave”: solo los que sabemos que eran del ecosistema
        const shouldDelete = OLD_CACHES_PREFIXES.some((p) => k.startsWith(p));
        if (shouldDelete) await caches.delete(k);
      })
    );
  } catch (_) {}
}

/* =========================
   Messages
========================= */
self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "GET_VERSION") {
    event.source?.postMessage({ type: "SW_VERSION", version: VERSION, build: BUILD });
    return;
  }

  if (data.type === "CLEAR_CACHES") {
    event.waitUntil((async () => {
      await caches.delete(CACHE_STATIC);
      await caches.delete(CACHE_RUNTIME);
      await postToAllClients({ type: "SW_CACHES_CLEARED", version: VERSION, build: BUILD });
    })());
  }
});

/* =========================
   Install
========================= */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    await cacheCoreAssets_();

    // Instalación rápida
    self.skipWaiting();
  })());
});

/* =========================
   Activate
========================= */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await cleanupOldCaches_();
    await self.clients.claim();

    await postToAllClients({ type: "SW_ACTIVATED", version: VERSION, build: BUILD });
  })());
});

/* =========================
   Fetch
========================= */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo GET
  if (req.method !== "GET") return;

  // Evita Range (media/video)
  if (isRangeRequest(req)) return;

  const url = new URL(req.url);
  if (!isHttp(url)) return;

  const sameOrigin = isSameOrigin(url);

  // ===== Navegación (HTML) =====
  if (isHTML(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_RUNTIME);

      try {
        // Network-first: siempre lo último
        const fresh = await fetch(new Request(req, { cache: "no-store" }));

        // Guardar SIEMPRE bajo la misma key
        await safeCachePut(cache, indexCacheKeyRequest(), fresh.clone());

        return fresh;
      } catch (_) {
        // Offline fallback: match index ignorando querystring (clave para start_url con ?source=...)
        const cached =
          (await cache.match(indexCacheKeyRequest(), { ignoreSearch: true })) ||
          (await caches.match("./index.html", { ignoreSearch: true })) ||
          (await caches.match("./", { ignoreSearch: true }));

        return (
          cached ||
          new Response(
            "<h1>Sin conexión</h1><p>No hay internet y no hay copia offline disponible.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
        );
      }
    })());
    return;
  }

  // ===== Same-origin =====
  if (sameOrigin) {
    // 1) JS/CSS/manifest: Network-first para auto-update
    if (isCriticalFreshAsset(url)) {
      event.respondWith((async () => {
        const cache = await caches.open(CACHE_RUNTIME);

        try {
          // cache:"reload" para pelear con caches HTTP agresivos
          const fresh = await fetch(new Request(req, { cache: "reload" }));
          await safeCachePut(cache, req, fresh.clone());
          return fresh;
        } catch (_) {
          // fallback al cache (sin romper)
          const cached = await cache.match(req, { ignoreSearch: false });
          return cached || new Response("", { status: 504 });
        }
      })());
      return;
    }

    // 2) Resto same-origin: Stale-While-Revalidate
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_RUNTIME);
      const cached = await cache.match(req, { ignoreSearch: false });

      const fetchPromise = (async () => {
        try {
          const fresh = await fetch(req);
          await safeCachePut(cache, req, fresh.clone());
          return fresh;
        } catch (_) {
          return null;
        }
      })();

      return cached || (await fetchPromise) || new Response("", { status: 504 });
    })());
    return;
  }

  // ===== Cross-origin =====
  // Passthrough (no cache externo).
});