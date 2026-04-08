const CACHE_NAME = 'yijian-v2'

// 安装：跳过等待
self.addEventListener('install', () => self.skipWaiting())

// 激活：清理旧缓存，立即接管
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// 请求策略
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return

  // 带hash的静态资源(JS/CSS)：缓存优先（内容不会变）
  if (url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone()
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone))
          }
          return resp
        })
      })
    )
    return
  }

  // HTML和其他资源：网络优先，失败用缓存
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp.ok) {
        const clone = resp.clone()
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone))
      }
      return resp
    }).catch(() =>
      caches.match(e.request).then(r => r || caches.match(location.registration?.scope || './'))
    )
  )
})
