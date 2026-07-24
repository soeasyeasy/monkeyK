---
title: "第四章：资源加载优化"
description: "掌握资源预加载、懒加载、优先级控制等优化技术"
---

# 第四章：资源加载优化

## 资源加载策略概览

资源加载优化的核心是：在正确的时间加载正确的资源。

```
策略层次：
1. 减少资源数量
2. 减少资源体积
3. 优化加载顺序
4. 按需加载
```

## 预加载（Preload）

提前加载当前页面即将需要的资源。

```html
<!-- 预加载字体 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 预加载关键图片 -->
<link rel="preload" href="hero.webp" as="image" type="image/webp">

<!-- 预加载关键脚本 -->
<link rel="preload" href="critical.js" as="script">
```

注意事项：
- 预加载的资源会在当前页面加载
- 不使用的预加载会浪费带宽
- `crossorigin` 属性对字体文件必需

## 预连接（Preconnect）

提前建立与第三方域名的连接。

```html
<!-- 预连接 CDN -->
<link rel="preconnect" href="https://cdn.example.com">

<!-- 预连接 API -->
<link rel="preconnect" href="https://api.example.com">

<!-- 带跨域凭证 -->
<link rel="preconnect" href="https://api.example.com" crossorigin>
```

预连接会执行：DNS 解析 → TCP 握手 → TLS 协商

## DNS 预解析（DNS-prefetch）

提前解析域名，适用于不需要预连接的场景。

```html
<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://analytics.example.com">
```

与 preconnect 的区别：
- dns-prefetch 只解析 DNS，更快但连接未建立
- preconnect 完成完整连接，更耗时但更彻底

## 资源优先级

### fetchpriority 属性

```html
<!-- 高优先级 -->
<img src="hero.webp" fetchpriority="high">

<!-- 低优先级 -->
<img src="gallery-1.webp" fetchpriority="low">

<!-- 默认优先级 -->
<img src="content.webp">
```

### 隐式优先级

浏览器根据资源类型自动分配优先级：

| 资源类型 | 默认优先级 |
| --- | --- |
| 首屏图片 | High |
| 字体 | High |
| 非首屏图片 | Low |
| 预加载脚本 | Low |
| defer 脚本 | Low |

## 懒加载（Lazy Loading）

### 原生图片懒加载

```html
<!-- 浏览器原生支持 -->
<img src="image.webp" loading="lazy" alt="描述">
```

注意事项：
- 视口内的图片会立即加载
- 需要设置明确的宽高避免布局偏移
- 首屏图片不要使用 lazy

### 图片占位符

```html
<!-- 使用低质量占位图 -->
<img
  src="placeholder.webp"
  data-src="full-image.webp"
  loading="lazy"
  width="800"
  height="600"
  alt="描述"
>
```

### JavaScript 懒加载

```javascript
// 使用 IntersectionObserver
const lazyImages = document.querySelectorAll('img[data-src]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

lazyImages.forEach((img) => observer.observe(img));
```

## 组件懒加载

### 动态导入

```javascript
// 按需加载模块
button.addEventListener('click', async () => {
  const { openModal } = await import('./modal.js');
  openModal();
});
```

### 路由懒加载

```javascript
// Vue Router 懒加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue')
  }
];

// React Router 懒加载
const Dashboard = React.lazy(() => import('./Dashboard'));
```

## 资源提示组合策略

```html
<head>
  <!-- 1. 预连接关键域名 -->
  <link rel="preconnect" href="https://cdn.example.com">

  <!-- 2. 预加载关键资源 -->
  <link rel="preload" href="critical.css" as="style">
  <link rel="preload" href="hero.webp" as="image">
  <link rel="preload" href="font.woff2" as="font" crossorigin>

  <!-- 3. 预获取下一页资源 -->
  <link rel="prefetch" href="/next-page.html">
</head>
```

## 预获取（Prefetch）

提前获取未来导航可能需要的资源。

```html
<!-- 预获取下一页 -->
<link rel="prefetch" href="/next-page.html">

<!-- 预获取交互资源 -->
<link rel="prefetch" href="modal.js">
```

特点：
- 空闲时下载，优先级最低
- 不阻塞当前页面
- 缓存供未来使用

## 资源加载模式对比

| 方式 | 用途 | 优先级 | 时机 |
| --- | --- | --- | --- |
| preload | 当前页面必需 | 高 | 立即 |
| prefetch | 未来导航需要 | 低 | 空闲 |
| preconnect | 第三方域名 | - | 立即 |
| dns-prefetch | 第三方域名 | - | 立即 |

## 代码分割策略

### 按路由分割

```javascript
// 每个路由独立 chunk
const routes = [
  { path: '/', component: () => import('./Home.vue') },
  { path: '/about', component: () => import('./About.vue') },
  { path: '/contact', component: () => import('./Contact.vue') }
];
```

### 按交互分割

```javascript
// 用户触发时才加载
async function showEditor() {
  const { Editor } = await import('./editor.js');
  new Editor().mount('#editor');
}
```

### 按视口分割

```javascript
// 首屏和非首屏分离
// 首屏：内联或 preload
// 非首屏：prefetch 或 lazy import
```

## 核心知识点

1. **preload**：当前页面必需资源，高优先级立即加载
2. **prefetch**：未来可能需要的资源，空闲时低优先级加载
3. **preconnect**：提前建立第三方连接，减少连接耗时
4. **loading=lazy**：原生图片懒加载，首屏图片禁用
5. **代码分割**：按路由、交互、视口分割，减少初始加载体积
