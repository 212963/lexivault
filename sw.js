/* LexiVault Service Worker · 网络优先，失败才用缓存 */
const CACHE = 'lexivault-v2';

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 只处理同源请求，WebDAV / 外部 API 不拦
  if (url.origin !== location.origin) return;

  // 网络优先：能联网就拿最新，失败再回退缓存
  e.respondWith(
    fetch(req).then(resp => {
      if (resp && resp.ok && resp.type === 'basic') {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => caches.match(req))
  );
});