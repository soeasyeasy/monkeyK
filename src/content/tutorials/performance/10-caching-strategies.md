---
title: "第十章：缓存策略"
description: "浏览器缓存、Service Worker、缓存设计模式"
---

# 第十章：缓存策略

## 缓存类型概览

| 缓存类型 | 位置 | 速度 | 容量 |
| --- | --- | --- | --- |
| 浏览器缓存 | 本地磁盘 | 快 | 中等 |
| Service Worker | 本地磁盘 | 快 | 大 |
| CDN 缓存 | 边缘节点 | 快 | 大 |
| HTTP 缓存 | 浏览器 | 最快 | 小 |

## HTTP 缓存

### 强缓存

```
响应头控制：
- Cache-Control: max-age=31536000  (1年)
- Expires: Wed, 21 Oct 2025 07:28:00 GMT

优先级：Cache-Control > Expires
```

```nginx
# Nginx 配置
location ~* \.(js|css|png|jpg|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 协商缓存

```
响应头：
- ETag: "abc123"
- Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT

请求头：
- If-None-Match: "abc123"
- If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT

返回 304 表示未修改，使用缓存
```

### 缓存策略设计

```
HTML：
  Cache-Control: no-cache
  （每次验证，但可使用协商缓存）

静态资源（带 hash）：
  Cache-Control: max-age=31536000, immutable
  （长期缓存，文件名变化时更新）

API 响应：
  Cache-Control: private, max-age=60
  （短期缓存，私有缓存）
```

## Service Worker

### 基本注册

```javascript
// main.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW 注册成功', reg))
    .catch(err => console.log('SW 注册失败', err));
}
```

### 缓存策略

```javascript
// sw.js

// 安装时预缓存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/main.js'
      ]);
    })
  );
});

// 缓存优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

// 网络优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open('v1').then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 过期策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        caches.open('v1').then(cache => cache.put(event.request, response.clone()));
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
```

### 缓存更新

```javascript
// sw.js
const CACHE_VERSION = 'v2';

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key))
      );
    })
  );
});
```

## Workbox

### 安装使用

```javascript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

// 预缓存构建时注入
precacheAndRoute(self.__WB_MANIFEST);

// 图片缓存优先
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
    }
  })
);

// 样式和脚本过时重新验证
registerRoute(
  ({ request }) => ['style', 'script'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'assets'
  })
);
```

### Vite 集成

```javascript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1小时
              }
            }
          }
        ]
      }
    })
  ]
});
```

## 缓存最佳实践

### 文件名 Hash

```
构建输出：
- main.a1b2c3d4.js
- styles.e5f6g7h8.css
- logo.i9j0k1l2.webp

文件名包含内容 hash，内容变化时文件名变化
配合长期缓存使用
```

### 缓存分层

```
第一层：浏览器缓存
  - HTTP 缓存头控制
  - 适合静态资源

第二层：Service Worker
  - 离线支持
  - 精细控制

第三层：CDN 缓存
  - 边缘节点缓存
  - 减少回源
```

### 缓存失效策略

```javascript
// 版本控制
const CACHE_VERSION = 'v1';

// 手动清除
async function clearCache() {
  const keys = await caches.keys();
  await Promise.all(keys.map(key => caches.delete(key)));
}

// 通知更新
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_READY') {
    // 提示用户刷新
    showToast('新版本可用，刷新页面更新');
  }
});
```

## 核心知识点

1. **HTTP 缓存**：Cache-Control 控制强缓存，ETag/Last-Modified 控制协商缓存
2. **Service Worker**：拦截请求，实现离线支持和自定义缓存策略
3. **缓存策略**：Cache First、Network First、Stale While Revalidate
4. **文件名 Hash**：配合长期缓存，内容变化时自动失效
5. **版本管理**：及时清理旧缓存，通知用户更新
