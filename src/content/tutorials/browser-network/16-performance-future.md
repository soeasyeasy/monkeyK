---
title: "第十六章：性能优化与未来"
description: "加载优化、Service Worker、HTTP/3 展望"
---

# 第十六章：性能优化与未来

## 性能优化概述

Web 性能优化是提升用户体验的关键，涉及加载速度、响应时间、资源消耗等多个方面。

### 性能指标

| 指标 | 全称 | 说明 | 目标值 |
| --- | --- | --- | --- |
| FCP | First Contentful Paint | 首次内容绘制 | < 1.8s |
| LCP | Largest Contentful Paint | 最大内容绘制 | < 2.5s |
| FID | First Input Delay | 首次输入延迟 | < 100ms |
| CLS | Cumulative Layout Shift | 累积布局偏移 | < 0.1 |
| TTFB | Time to First Byte | 首字节时间 | < 800ms |
| INP | Interaction to Next Paint | 交互到下一绘制 | < 200ms |

## 加载优化

### 资源压缩

| 资源类型 | 压缩方式 | 效果 |
| --- | --- | --- |
| HTML | 移除空白、注释 | 减少 20-30% |
| CSS | 压缩、移除未使用 | 减少 30-50% |
| JavaScript | 压缩、Tree Shaking | 减少 40-60% |
| 图片 | WebP、AVIF 格式 | 减少 30-50% |

### 代码分割

```javascript
// 路由级别代码分割
const Home = () => import('./views/Home.vue');
const About = () => import('./views/About.vue');

// 动态导入
if (condition) {
  import('./heavy-module').then(module => {
    module.doSomething();
  });
}
```

### 预加载与预获取

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="main.js" as="script">

<!-- 预获取可能需要的资源 -->
<link rel="prefetch" href="next-page.js">
<link rel="dns-prefetch" href="//api.example.com">
```

### 图片优化

| 技术 | 说明 |
| --- | --- |
| 响应式图片 | 根据屏幕尺寸加载不同尺寸 |
| 懒加载 | 视口外图片延迟加载 |
| 现代格式 | WebP、AVIF 替代 JPEG/PNG |
| 图片 CDN | 自动优化和格式转换 |

```html
<!-- 响应式图片 -->
<img srcset="small.jpg 480w, medium.jpg 800w, large.jpg 1200w"
     sizes="(max-width: 600px) 480px, 800px"
     src="medium.jpg"
     alt="响应式图片">

<!-- 懒加载 -->
<img loading="lazy" src="image.jpg" alt="懒加载图片">
```

## 渲染优化

### 关键渲染路径

优化关键渲染路径可以减少首次渲染时间：

1. **减少关键资源数量**
2. **最小化关键路径长度**
3. **减少关键字节数**

### 避免重排重绘

```javascript
// 避免频繁触发重排
const element = document.getElementById('box');

// 批量修改样式
element.style.cssText += 'width: 100px; height: 100px;';

// 使用 transform 代替位置变化
element.style.transform = 'translateX(100px)';

// 使用 requestAnimationFrame
function animate() {
  element.style.transform = `translateX(${x}px)`;
  x += 1;
  requestAnimationFrame(animate);
}
```

### 虚拟列表

对于长列表，使用虚拟列表只渲染可见部分：

```vue
<template>
  <div class="virtual-list" @scroll="onScroll">
    <div :style="{ height: totalHeight + 'px' }">
      <div :style="{ transform: `translateY(${offset}px)` }">
        <div v-for="item in visibleItems" :key="item.id">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>
```

## Service Worker

Service Worker 是运行在浏览器后台的脚本，可以拦截网络请求、管理缓存、推送通知。

### 生命周期

```
注册 → 下载 → 安装 → 激活 → 控制页面
```

### 注册 Service Worker

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker 注册成功:', registration);
    })
    .catch(error => {
      console.log('Service Worker 注册失败:', error);
    });
}
```

### 缓存策略

```javascript
// sw.js

// 安装时缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/main.js'
      ]);
    })
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 缓存命中返回缓存
      if (response) {
        return response;
      }
      // 否则发起网络请求
      return fetch(event.request).then(response => {
        // 缓存响应
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open('v1').then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// 更新时清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== 'v1') {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
```

### 离线支持

Service Worker 可以实现离线访问：

```javascript
// 离线页面缓存
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
```

## PWA（渐进式 Web 应用）

PWA 结合了 Web 和原生应用的优点。

### PWA 特性

| 特性 | 说明 |
| --- | --- |
| 可靠性 | 离线可用，快速加载 |
| 快速 | 流畅的动画和响应 |
| 可安装 | 添加到主屏幕 |
| 推送通知 | 接收服务器推送 |
| 后台同步 | 后台处理任务 |

### Manifest 文件

```json
{
  "name": "我的应用",
  "short_name": "应用",
  "description": "应用描述",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## HTTP/3 与 QUIC

HTTP/3 基于 QUIC 协议，是下一代 HTTP 协议。

### QUIC 优势

| 特性 | 说明 |
| --- | --- |
| 0-RTT 连接 | 首次连接即可发送数据 |
| 无队头阻塞 | 每个流独立，不互相阻塞 |
| 连接迁移 | 网络切换不中断连接 |
| 改进的拥塞控制 | 用户空间实现，快速迭代 |

### 部署 HTTP/3

```nginx
# Nginx 配置
server {
    listen 443 quic reuseport;
    listen 443 ssl http2;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

## Web 未来趋势

### WebAssembly

WebAssembly（Wasm）是一种低级字节码格式，可以在浏览器中运行高性能应用。

```javascript
// 加载 Wasm 模块
const response = await fetch('module.wasm');
const buffer = await response.arrayBuffer();
const { instance } = await WebAssembly.instantiate(buffer);
instance.exports.main();
```

### Web Components

Web Components 提供原生的组件化能力：

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
      </style>
      <slot></slot>
    `;
  }
}

customElements.define('my-component', MyComponent);
```

### 边缘计算

边缘计算将计算推向离用户更近的地方：

- CDN 边缘节点执行逻辑
- 降低延迟
- 提高性能

### AI 集成

浏览器内置 AI 能力：

- Web Neural Network API
- 本地模型推理
- 隐私保护

## 性能监控

### 性能 API

```javascript
// 获取性能指标
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.startTime, entry.duration);
  }
});

observer.observe({ entryTypes: ['measure', 'navigation'] });

// 测量代码执行时间
performance.mark('start');
// 执行代码
performance.mark('end');
performance.measure('执行时间', 'start', 'end');
```

### 真实用户监控（RUM）

收集真实用户的性能数据：

```javascript
// 发送性能数据到服务器
const metrics = {
  fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
  lcp: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime,
  fid: performance.getEntriesByName('first-input-delay')[0]?.processingStart
};

navigator.sendBeacon('/analytics', JSON.stringify(metrics));
```

## 本章小结

Web 性能优化是一个系统工程，涉及加载优化、渲染优化、缓存策略等多个方面。Service Worker 和 PWA 提供了离线能力和更好的用户体验。HTTP/3 和 QUIC 协议将进一步提升网络性能。未来，WebAssembly、Web Components、边缘计算和 AI 集成将推动 Web 平台持续发展。持续的性能监控和优化是保持应用竞争力的关键。
