---
title: "第十六章：性能优化实战案例"
description: "真实项目优化案例、性能优化清单与最佳实践总结"
---

# 第十六章：性能优化实战案例

## 案例一：电商首页优化

### 优化前状况

```
问题诊断：
- LCP：4.2s（差）
- FID：280ms（需改进）
- CLS：0.25（差）
- 首屏加载时间：5.8s
- 资源总大小：3.2MB
```

### 优化措施

#### 1. 图片优化

```html
<!-- 优化前 -->
<img src="banner.jpg" width="1920" height="600">

<!-- 优化后 -->
<picture>
  <source srcset="banner-mobile.avif" type="image/avif" media="(max-width: 768px)">
  <source srcset="banner-mobile.webp" type="image/webp" media="(max-width: 768px)">
  <source srcset="banner.avif" type="image/avif">
  <source srcset="banner.webp" type="image/webp">
  <img src="banner.jpg" alt="促销活动" loading="eager" fetchpriority="high"
       width="1920" height="600" decoding="async">
</picture>
```

#### 2. 关键 CSS 内联

```html
<head>
  <!-- 内联首屏关键 CSS -->
  <style>
    /* 关键样式：header, hero, product-grid */
    .header { /* ... */ }
    .hero { /* ... */ }
    .product-card { /* ... */ }
  </style>

  <!-- 异步加载非关键 CSS -->
  <link rel="preload" href="styles.css" as="style"
        onload="this.rel='stylesheet'">
</head>
```

#### 3. JavaScript 优化

```javascript
// 优化前：同步加载所有脚本
<script src="analytics.js"></script>
<script src="chat-widget.js"></script>
<script src="main.js"></script>

// 优化后：延迟非关键脚本
<script defer src="main.js"></script>
<script async src="analytics.js"></script>

// 聊天组件懒加载
window.addEventListener('load', () => {
  setTimeout(() => {
    import('./chat-widget.js').then(module => {
      module.initChat();
    });
  }, 3000);
});
```

### 优化结果

```
优化后指标：
- LCP：1.8s（良好）- 提升 57%
- FID：80ms（良好）- 提升 71%
- CLS：0.05（良好）- 提升 80%
- 首屏加载时间：2.1s - 提升 64%
- 资源总大小：1.1MB - 减少 66%
```

## 案例二：SaaS 应用性能优化

### 优化前状况

```
问题诊断：
- 首屏加载：6.5s
- 路由切换：1.2s
- 大数据表格渲染卡顿
- 内存泄漏导致页面变慢
```

### 优化措施

#### 1. 代码分割

```javascript
// 路由级别分割
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue'),
    meta: { chunkName: 'dashboard' }
  },
  {
    path: '/analytics',
    component: () => import('./views/Analytics.vue'),
    meta: { chunkName: 'analytics' }
  },
  {
    path: '/settings',
    component: () => import('./views/Settings.vue'),
    meta: { chunkName: 'settings' }
  }
];

// 组件级别分割
const HeavyChart = defineAsyncComponent({
  loader: () => import('./components/HeavyChart.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 10000
});
```

#### 2. 虚拟列表

```vue
<script setup>
import { ref, computed } from 'vue';

const props = defineProps<{
  data: any[];
}>();

const scrollTop = ref(0);
const itemHeight = 50;
const containerHeight = 600;
const buffer = 5;

const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  return {
    start: Math.max(0, start - buffer),
    end: Math.min(props.data.length, start + visibleCount + buffer)
  };
});

const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  return props.data.slice(start, end);
});

const totalHeight = computed(() => props.data.length * itemHeight);
const offsetY = computed(() => visibleRange.value.start * itemHeight);
</script>

<template>
  <div class="virtual-list" @scroll="scrollTop = $event.target.scrollTop">
    <div class="spacer" :style="{ height: totalHeight + 'px' }">
      <div class="content" :style="{ transform: `translateY(${offsetY}px)` }">
        <div v-for="item in visibleItems" :key="item.id" class="item">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>
```

#### 3. 内存泄漏修复

```javascript
// 问题代码：事件监听器未清理
class DataGrid {
  constructor() {
    window.addEventListener('resize', this.handleResize);
    this.interval = setInterval(() => this.refresh(), 5000);
  }

  handleResize() { /* ... */ }
  refresh() { /* ... */ }
}

// 修复后
class DataGrid {
  constructor() {
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.interval = setInterval(() => this.refresh(), 5000);
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    clearInterval(this.interval);
  }

  handleResize() { /* ... */ }
  refresh() { /* ... */ }
}
```

### 优化结果

```
优化后指标：
- 首屏加载：2.3s - 提升 65%
- 路由切换：0.3s - 提升 75%
- 表格渲染：流畅 60fps
- 内存占用：减少 40%
```

## 案例三：内容网站优化

### 优化前状况

```
问题诊断：
- 文章页加载慢
- 图片过多导致页面卡顿
- 广告脚本影响性能
- 移动端体验差
```

### 优化措施

#### 1. 图片懒加载

```javascript
// 使用 IntersectionObserver
const lazyImages = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      observer.unobserve(img);
    }
  });
}, {
  rootMargin: '50px 0px',
  threshold: 0.01
});

lazyImages.forEach(img => imageObserver.observe(img));
```

#### 2. 广告脚本延迟

```javascript
// 广告脚本在空闲时加载
function loadAds() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      loadAdScripts();
    }, { timeout: 5000 });
  } else {
    setTimeout(loadAdScripts, 3000);
  }
}

// 页面加载完成后执行
window.addEventListener('load', () => {
  if (document.visibilityState === 'visible') {
    loadAds();
  }
});
```

#### 3. 阅读模式优化

```css
/* 文章阅读体验优化 */
.article-content {
  font-size: 18px;
  line-height: 1.8;
  max-width: 680px;
  margin: 0 auto;
  padding: 20px;
}

/* 图片居中 */
.article-content img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 2em auto;
}

/* 代码块优化 */
.article-content pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}
```

### 优化结果

```
优化后指标：
- 文章页加载：1.5s - 提升 70%
- 图片加载：按需加载，减少初始 80%
- 广告影响：INP 改善 60%
- 移动端：LCP 提升 65%
```

## 性能优化检查清单

### 开发阶段

```
□ 使用 Lighthouse 定期审计
□ 建立性能预算
□ 代码分割策略
□ 图片优化流程
□ 字体加载策略
□ 缓存策略设计
```

### 构建阶段

```
□ Tree Shaking 配置
□ 代码压缩
□ 资源压缩（Gzip/Brotli）
□ 文件名 Hash
□ 预压缩资源
□ 构建分析
```

### 部署阶段

```
□ CDN 配置
□ HTTP/2 启用
□ 缓存头配置
□ Service Worker
□ 监控埋点
□ 错误追踪
```

### 监控阶段

```
□ Core Web Vitals 监控
□ 真实用户监控（RUM）
□ 性能预算检查
□ 错误率监控
□ 定期性能报告
```

## 性能优化最佳实践

### 1. 性能优先文化

```
- 将性能纳入 Definition of Done
- 建立性能预算和监控
- 定期性能审查
- 团队性能培训
```

### 2. 渐进增强

```
- 核心功能优先
- 逐步增强体验
- 降级策略
- 网络感知
```

### 3. 持续优化

```
- 性能不是一次性工作
- 建立性能监控体系
- 定期回顾和优化
- 跟踪新技术和最佳实践
```

## 核心知识点

1. **实战案例**：电商、SaaS、内容网站的优化策略
2. **系统化方法**：诊断 → 优化 → 验证 → 监控
3. **检查清单**：开发、构建、部署、监控各阶段要点
4. **最佳实践**：性能文化、渐进增强、持续优化
5. **量化驱动**：用数据指导优化，验证优化效果
