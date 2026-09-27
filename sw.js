/* 可选：把同目录的 csharp-ide.html 变成可离线打开的桌面 App。
   仅当页面通过 https:// 或 http://localhost 打开时才生效。 */
const CACHE = "cs-ide-v1";
const PRECACHE = ["./csharp-ide.html", "./manifest.json", "./sw.js"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isAsset = url.origin === self.location.origin ||
                  url.hostname.endsWith("jsdelivr.net");
  if (!isAsset) return;

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === "basic" || (res && res.status === 200 && /jsdelivr/.test(url.hostname))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
