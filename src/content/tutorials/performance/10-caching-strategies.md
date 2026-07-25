---
title: "第十章：缓存策略"
description: "掌握 HTTP 缓存、Service Worker、Workbox 等缓存技术，让二次访问秒开"
---

# 第十章：缓存策略

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 浏览器缓存到底有几种？它们之间什么关系？
- Cache-Control 的 `max-age`、`no-cache`、`no-store` 有什么区别？
- Service Worker 怎么实现离线访问？
- 怎么设计缓存策略，既快又能及时更新？

这一章就是为了解答这些问题。缓存是性能优化的"免费午餐"——配置好后，用户的二次访问可以瞬间加载，不需要任何额外优化。

---

## 10.1 为什么需要缓存策略？

### 痛点分析

你可能遇到过这些问题：

- 用户每次打开页面都要重新下载所有资源，加载很慢
- 明明只改了一行代码，用户却要重新下载整个 bundle
- 静态资源（图片、字体）每次都要重复下载，浪费流量
- 离线状态下页面完全无法使用

打个比方：

> 缓存就像你的书桌：
> - 没有缓存 = 每次写作业都要去图书馆借书，用完还回去
> - 强缓存 = 把常用的书直接买回来放桌上，随时看
> - 协商缓存 = 每次看书前打电话问图书馆有没有新版本
> - Service Worker = 请了个私人图书管理员，帮你管理所有书

### 缓存的目标

```
缓存目标：
├── 减少请求 → 命中缓存时不发网络请求
├── 减少延迟 → 本地读取比网络快得多
├── 离线支持 → 没网也能用
└── 节省流量 → 不重复下载相同资源
```

---

## 10.2 缓存类型概览

### 浏览器缓存体系

浏览器有 4 层缓存，查找顺序从上到下：

```
请求资源时，浏览器按以下顺序查找缓存：
├── 1. 内存缓存（Memory Cache）→ 最快，但关闭标签就没了
├── 2. 磁盘缓存（Disk Cache）→ 持久化，关闭浏览器还在
├── 3. Service Worker 缓存 → 可编程控制，支持离线
└── 4. 网络请求 → 以上都没命中，才发网络请求
```

打个比方：

> 找缓存就像找东西：
> - 内存缓存 = 手里的东西（最快，但放下就没了）
> - 磁盘缓存 = 抽屉里的东西（要打开抽屉，但持久）
> - Service Worker = 管家帮你存的东西（可编程，灵活）
> - 网络请求 = 去商店买（最慢，要等快递）

### 对比表格

| 缓存类型 | 位置 | 速度 | 容量 | 持久性 | 可控性 |
| --- | --- | --- | --- | --- | --- |
| 内存缓存 | 内存 | 最快 | 小 | 标签页关闭即失效 | 不可控 |
| 磁盘缓存 | 磁盘 | 快 | 中等 | 持久化 | 通过 HTTP 头控制 |
| Service Worker | 磁盘 | 快 | 大 | 持久化 | 完全可编程 |
| CDN 缓存 | 边缘节点 | 快 | 大 | 由 CDN 配置决定 | 通过 CDN 控制台 |

---

## 10.3 HTTP 缓存机制

HTTP 缓存是最常用的缓存方式，通过响应头控制。分为两种：强缓存和协商缓存。

### 强缓存

强缓存：在缓存有效期内，直接使用本地缓存，不发任何网络请求。

```
浏览器收到响应后：
├── 检查 Cache-Control 或 Expires
├── 如果没过期 → 直接使用缓存（状态码 200，from cache）
└── 如果过期了 → 进入协商缓存阶段
```

#### Cache-Control（推荐）

```nginx
# Nginx 配置
# 静态资源：缓存 1 年，不可变
location ~* \.(js|css|png|jpg|webp|woff2)$ {
    expires 1y;
    # public: 允许 CDN 等中间节点缓存
    # immutable: 在有效期内不会变化（配合文件名 hash）
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML 文件：不做强缓存，每次验证
location ~* \.html$ {
    add_header Cache-Control "no-cache";
}
```

**Cache-Control 常用指令**：

| 指令 | 含义 | 使用场景 |
| --- | --- | --- |
| `max-age=31536000` | 缓存有效期（秒） | 静态资源 |
| `public` | 允许中间节点（CDN）缓存 | 公开资源 |
| `private` | 只允许浏览器缓存 | 用户私有数据 |
| `no-cache` | 每次使用前要验证 | HTML 文件 |
| `no-store` | 完全不缓存 | 敏感数据 |
| `immutable` | 有效期内内容不会变 | 带 hash 的文件 |

#### Expires（旧版）

```
Expires: Wed, 21 Oct 2025 07:28:00 GMT
```

**注意**：Expires 使用绝对时间，受客户端时间影响。如果用户电脑时间不对，缓存会失效。Cache-Control 使用相对时间，更可靠。当两者同时存在时，Cache-Control 优先。

### 协商缓存

协商缓存：缓存过期后，向服务器确认资源是否更新。没更新就用缓存（304），更新了就重新下载。

```
第一次请求：
浏览器 → 服务器：我要 /main.js
服务器 → 浏览器：给你，ETag 是 "abc123"，最后修改时间是 10:00

第二次请求（缓存过期后）：
浏览器 → 服务器：/main.js 有更新吗？ETag 是 "abc123"
服务器 → 浏览器：没更新，返回 304（用你的缓存吧）

或者：
服务器 → 浏览器：更新了，返回 200 + 新内容
```

#### ETag（推荐）

```
响应头：ETag: "abc123"    ← 服务器根据文件内容生成的唯一标识
请求头：If-None-Match: "abc123"  ← 浏览器把缓存的 ETag 发回去

服务器对比：
├── ETag 相同 → 304 Not Modified（用缓存）
└── ETag 不同 → 200 OK + 新内容
```

**原理**：ETag 是根据文件内容生成的 hash，只要文件内容没变，ETag 就不变。

#### Last-Modified（旧版）

```
响应头：Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
请求头：If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT

服务器对比：
├── 修改时间没变 → 304（但文件内容可能变了，只是时间没变）
└── 修改时间变了 → 200 + 新内容
```

**对比**：

| 特性 | ETag | Last-Modified |
| --- | --- | --- |
| 精度 | 高（基于内容） | 低（基于时间） |
| 速度 | 快 | 慢（要解析时间） |
| 可靠性 | 高 | 低（时间精度只有秒级） |
| 推荐 | 推荐 | 不推荐（作为兜底） |

### 缓存策略设计

不同类型资源的缓存策略：

```
HTML 文件：
  Cache-Control: no-cache
  原因：HTML 是入口，每次都要检查更新

静态资源（带 hash）：
  Cache-Control: max-age=31536000, immutable
  原因：文件名包含 hash，内容变了文件名就变了

API 响应：
  Cache-Control: private, max-age=60
  原因：用户私有数据，短期缓存

图片/字体：
  Cache-Control: public, max-age=31536000, immutable
  原因：很少变化，长期缓存
```

---

## 10.4 Service Worker 缓存

Service Worker 是浏览器提供的可编程缓存层，可以拦截网络请求，实现离线访问。

### 核心原理

```
Service Worker 工作流程：
├── 1. 注册 → 浏览器下载并安装 SW
├── 2. 激活 → SW 开始运行，可以拦截请求
├── 3. 拦截 → 所有网络请求都经过 SW
├── 4. 响应 → SW 决定返回缓存还是发网络请求
└── 5. 更新 → 新的 SW 文件会触发更新流程
```

打个比方：

> Service Worker 就像一个门卫：
> - 注册 = 雇佣门卫
> - 激活 = 门卫上岗
> - 拦截 = 所有快递都经过门卫
> - 响应 = 门卫决定：仓库有就直接给，没有就去外面买
> - 更新 = 换新门卫，旧门卫离开

### 基本注册

```javascript
// main.js - 在页面中注册 Service Worker

// 检查浏览器是否支持 Service Worker
if ('serviceWorker' in navigator) {
  // 注册 Service Worker，sw.js 放在根目录
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      // 注册成功
      console.log('SW 注册成功，scope:', registration.scope);
    })
    .catch(error => {
      // 注册失败（可能是路径问题）
      console.log('SW 注册失败:', error);
    });
}
```

**说明**：

- Service Worker 只能注册在 HTTPS 环境（localhost 除外）
- sw.js 的路径决定了它的控制范围（scope）
- 放在根目录 `/sw.js` 可以控制整个站点

### 安装与预缓存

```javascript
// sw.js - Service Worker 文件

// 缓存版本号（更新时修改这个值，触发旧缓存清理）
const CACHE_VERSION = 'v1';
// 缓存名称（带版本号，方便区分）
const CACHE_NAME = `my-app-${CACHE_VERSION}`;

// 需要预缓存的资源列表
const PRECACHE_URLS = [
  '/',                    // 首页
  '/index.html',          // HTML 入口
  '/styles.css',          // 样式文件
  '/main.js',             // 主脚本
  '/logo.png'             // Logo 图片
];

// install 事件：SW 安装时触发
self.addEventListener('install', (event) => {
  // event.waitUntil：等待内部 Promise 完成，SW 才安装成功
  event.waitUntil(
    caches.open(CACHE_NAME)       // 打开（或创建）指定名称的缓存
      .then(cache => {
        // 将所有预缓存资源添加到缓存中
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // 跳过等待阶段，立即激活
        return self.skipWaiting();
      })
  );
});
```

**说明**：

- `install` 事件在 SW 首次注册或发现新版本时触发
- `cache.addAll()` 是原子操作：任何一个资源失败，整个缓存操作失败
- `self.skipWaiting()` 让新 SW 跳过等待阶段，立即接管

### 激活与清理旧缓存

```javascript
// sw.js - 激活阶段清理旧缓存

// activate 事件：SW 激活时触发
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()                   // 获取所有缓存名称
      .then(cacheNames => {
        return Promise.all(
          // 遍历所有缓存名称
          cacheNames.map(cacheName => {
            // 如果不是当前版本的缓存，删除它
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 立即接管所有客户端
        return self.clients.claim();
      })
  );
});
```

**说明**：

- `activate` 事件在 SW 安装成功后触发
- 清理旧版本缓存，避免磁盘空间浪费
- `self.clients.claim()` 让新 SW 立即控制所有页面

### 请求拦截与缓存策略

```javascript
// sw.js - 拦截网络请求

// fetch 事件：每个网络请求都会触发
self.addEventListener('fetch', (event) => {
  // 只处理同源请求（忽略第三方请求）
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 缓存优先策略（Cache First）
  event.respondWith(
    caches.match(event.request)     // 在缓存中查找匹配的资源
      .then(cachedResponse => {
        // 如果缓存命中，直接返回
        if (cachedResponse) {
          return cachedResponse;
        }

        // 缓存没命中，发网络请求
        return fetch(event.request)
          .then(networkResponse => {
            // 请求成功，把响应存入缓存（供下次使用）
            if (networkResponse.ok) {
              const cache = caches.open(CACHE_NAME);
              cache.then(c => c.put(event.request, networkResponse.clone()));
            }
            // 返回网络响应
            return networkResponse;
          });
      })
  );
});
```

**说明**：

- `event.respondWith()` 接管请求的响应
- `caches.match()` 查找缓存，返回 Promise
- `response.clone()` 克隆响应（因为 Response 只能读取一次）
- 缓存优先策略适合静态资源

---

## 10.5 常用缓存策略对比

不同的资源适合不同的缓存策略：

| 策略 | 流程 | 适用场景 | 优点 | 缺点 |
| --- | --- | --- | --- | --- |
| Cache First | 缓存 → 网络 | 图片、字体、静态资源 | 速度最快 | 可能返回旧内容 |
| Network First | 网络 → 缓存 | API 请求、动态内容 | 内容最新 | 离线时只能用缓存 |
| Stale While Revalidate | 缓存（立即返回）+ 网络（后台更新） | JS/CSS 等不太频繁更新的资源 | 速度快，内容较新 | 第一次更新前是旧内容 |
| Network Only | 仅网络 | 敏感数据、实时数据 | 始终最新 | 无离线支持 |
| Cache Only | 仅缓存 | 预缓存的核心资源 | 速度最快 | 无法更新 |

### 策略详解

```javascript
// Cache First（缓存优先）
// 适合：图片、字体、第三方库
event.respondWith(
  caches.match(event.request).then(cached => {
    return cached || fetch(event.request);
  })
);

// Network First（网络优先）
// 适合：API 请求、动态内容
event.respondWith(
  fetch(event.request).then(response => {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
    return response;
  }).catch(() => {
    return caches.match(event.request);
  })
);

// Stale While Revalidate（过时重验证）
// 适合：JS/CSS 等资源
event.respondWith(
  caches.match(event.request).then(cached => {
    // 先返回缓存（快）
    const fetchPromise = fetch(event.request).then(response => {
      // 后台更新缓存
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    });
    // 返回缓存或网络请求的结果
    return cached || fetchPromise;
  })
);
```

---

## 10.6 Workbox：简化 Service Worker

手写 Service Worker 很复杂，Workbox 是 Google 提供的库，封装了常用缓存策略。

### 基础用法

```javascript
// sw.js - 使用 Workbox

// 引入 Workbox 模块
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// 预缓存：构建时自动注入资源列表
// self.__WB_MANIFEST 由构建工具自动生成
precacheAndRoute(self.__WB_MANIFEST);

// 运行时缓存：图片使用 Cache First 策略
registerRoute(
  // 匹配条件：请求目标是图片
  ({ request }) => request.destination === 'image',
  // 缓存策略：Cache First
  new CacheFirst({
    cacheName: 'images',              // 缓存名称
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,               // 最多缓存 50 张图片
        maxAgeSeconds: 30 * 24 * 60 * 60  // 最多缓存 30 天
      })
    ]
  })
);

// 运行时缓存：JS/CSS 使用 Stale While Revalidate
registerRoute(
  // 匹配条件：请求目标是样式或脚本
  ({ request }) => ['style', 'script'].includes(request.destination),
  // 缓存策略：Stale While Revalidate
  new StaleWhileRevalidate({
    cacheName: 'assets'               // 缓存名称
  })
);

// 运行时缓存：API 请求使用 Network First
registerRoute(
  // 匹配条件：请求目标是 API
  ({ url }) => url.pathname.startsWith('/api/'),
  // 缓存策略：Network First
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,               // 最多缓存 50 个 API 响应
        maxAgeSeconds: 60 * 60        // 最多缓存 1 小时
      })
    ]
  })
);
```

### Vite 集成

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      // 自动更新：发现新版本时自动激活
      registerType: 'autoUpdate',
      workbox: {
        // 预缓存的文件模式
        globPatterns: ['**/*.{js,css,html,ico,png,webp}'],
        // 运行时缓存配置
        runtimeCaching: [
          {
            // 匹配 API 请求
            urlPattern: /^https:\/\/api\.example\.com\/.*/,
            // 使用 Network First 策略
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,         // 最多 50 条
                maxAgeSeconds: 60 * 60  // 1 小时
              }
            }
          },
          {
            // 匹配图片请求
            urlPattern: /\.(png|jpg|webp|svg)$/,
            // 使用 Cache First 策略
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60  // 30 天
              }
            }
          }
        ]
      }
    })
  ]
});
```

**说明**：

- `vite-plugin-pwa` 会自动生成 Service Worker
- `globPatterns` 指定哪些文件需要预缓存
- `runtimeCaching` 配置运行时缓存策略

---

## 10.7 缓存最佳实践

### 文件名 Hash

```
构建输出示例：
├── main.a1b2c3d4.js      ← 内容变了，hash 就变
├── styles.e5f6g7h8.css   ← 内容变了，hash 就变
└── logo.i9j0k1l2.webp    ← 内容变了，hash 就变

工作流程：
├── 1. 构建时文件名带 hash
├── 2. 配置长期缓存（max-age=31536000）
├── 3. 内容变化 → hash 变化 → 文件名变化 → 浏览器认为是新资源
└── 4. 内容不变 → 文件名不变 → 命中缓存
```

**原理**：文件名 Hash 是"缓存破坏"策略——内容变了就换文件名，不需要手动清除缓存。

### 缓存分层

```
第一层：HTTP 缓存（磁盘缓存）
  ├── 通过 Cache-Control 控制
  ├── 适合静态资源
  └── 浏览器自动管理

第二层：Service Worker 缓存
  ├── 可编程控制
  ├── 支持离线访问
  └── 精细控制不同资源的策略

第三层：CDN 缓存
  ├── 边缘节点缓存
  ├── 减少回源请求
  └── 通过 CDN 控制台配置
```

### 缓存更新通知

```javascript
// 监听 Service Worker 更新
navigator.serviceWorker.addEventListener('message', (event) => {
  // 收到 SW 发来的消息
  if (event.data.type === 'UPDATE_READY') {
    // 提示用户有新版本
    showToast('新版本可用，刷新页面更新');
  }
});

// 手动清除所有缓存（调试用）
async function clearAllCache() {
  // 获取所有缓存名称
  const keys = await caches.keys();
  // 并行删除所有缓存
  await Promise.all(keys.map(key => caches.delete(key)));
  console.log('所有缓存已清除');
}
```

---

## 10.8 新手常见误区

### 误区 1："no-cache 是不缓存"

**错！** `no-cache` 不是不缓存，而是每次使用前要验证。

**正确理解**：

- `no-cache` = 缓存了，但每次用之前要问服务器"有更新吗？"
- `no-store` = 真正的不缓存，连缓存都不存
- 需要完全不缓存用 `no-store`，需要每次验证用 `no-cache`

### 误区 2："缓存时间越长越好"

**错！** 缓存时间太长，用户可能一直看到旧内容。

**正确做法**：

1. 带 hash 的静态资源：长期缓存（1 年）
2. HTML 文件：不做强缓存（`no-cache`）
3. API 响应：短期缓存（几分钟）
4. 动态内容：不缓存或很短的缓存

### 误区 3："Service Worker 更新后立即可用"

**错！** 新 Service Worker 需要等待旧 SW 完全退出才能激活。

**正确做法**：

1. 使用 `self.skipWaiting()` 跳过等待
2. 使用 `self.clients.claim()` 立即接管
3. 或者提示用户刷新页面

### 误区 4："所有资源都用同一种缓存策略"

**错！** 不同资源适合不同策略。

**正确做法**：

1. 图片/字体：Cache First（很少变化）
2. API 请求：Network First（需要最新数据）
3. JS/CSS：Stale While Revalidate（平衡速度和新鲜度）
4. HTML：Network Only 或协商缓存

---

## 10.9 动手练习

### 练习 1：基础练习 - HTTP 缓存配置

**题目**：为 Nginx 配置以下缓存策略：

1. HTML 文件：不做强缓存，每次验证
2. JS/CSS（带 hash）：缓存 1 年
3. 图片：缓存 30 天
4. API 响应：不缓存

<details>
<summary>点击查看答案</summary>

```nginx
# HTML 文件
location ~* \.html$ {
    add_header Cache-Control "no-cache";
}

# JS/CSS（带 hash）
location ~* \.(js|css)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# 图片
location ~* \.(png|jpg|webp|svg|ico)$ {
    add_header Cache-Control "public, max-age=2592000";
}

# API 响应
location /api/ {
    add_header Cache-Control "no-store";
}
```

**要点**：

1. HTML 用 `no-cache`（每次验证）
2. 带 hash 的静态资源用 `immutable`（绝对不变）
3. 图片用中等时长缓存
4. API 用 `no-store`（完全不缓存）

</details>

### 练习 2：进阶练习 - Service Worker 缓存策略

**题目**：实现一个 Service Worker，对不同类型的请求使用不同的缓存策略：

1. 图片请求：Cache First
2. API 请求：Network First
3. 其他请求：Stale While Revalidate

<details>
<summary>点击查看答案</summary>

```javascript
// sw.js
const CACHE_NAME = 'app-v1';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 图片请求：Cache First
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // API 请求：Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // 其他请求：Stale While Revalidate
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
```

**要点**：

1. 根据 `request.destination` 判断图片
2. 根据 `url.pathname` 判断 API
3. 不同策略使用不同的 `event.respondWith()`

</details>

### 练习 3（挑战）：综合练习 - Workbox 完整配置

**题目**：使用 `vite-plugin-pwa` 配置完整的 PWA 缓存策略。

<details>
<summary>点击查看答案</summary>

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // 预缓存所有静态资源
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff2}'],
        // 运行时缓存
        runtimeCaching: [
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            // 图片
            urlPattern: /\.(png|jpg|webp|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          },
          {
            // API
            urlPattern: /^https:\/\/api\.example\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60
              },
              // 网络超时 3 秒后使用缓存
              networkTimeoutSeconds: 3
            }
          }
        ]
      },
      // manifest 配置
      manifest: {
        name: 'My App',
        short_name: 'App',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

**要点**：

1. `globPatterns` 预缓存静态资源
2. 不同资源类型使用不同策略
3. API 配置 `networkTimeoutSeconds` 超时兜底
4. 配置 PWA manifest

</details>

---

## 下一章预告

下一章我们会学习 **网络优化**——也就是如何减少网络请求的延迟和体积。

你会学到：

- HTTP/2 多路复用和头部压缩
- HTTP/3 (QUIC) 的优势
- CDN 加速原理
- DNS 预解析和预连接
- 数据压缩（Gzip/Brotli）

网络优化是缓存之外的另一个重要维度，可以让用户更快地获取资源。
