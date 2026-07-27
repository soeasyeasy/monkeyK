---
title: "第四章：资源加载优化"
description: "掌握资源预加载、懒加载、优先级控制等优化技术"
---

# 第四章：资源加载优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- preload、prefetch、preconnect 有什么区别？
- 为什么要用懒加载？什么时候不该用？
- 怎么控制资源的加载优先级？
- 代码分割到底怎么分？

这一章就是为了解答这些问题。资源加载优化的核心是：**在正确的时间加载正确的资源**。

---

## 1 为什么需要资源加载优化？

### 痛点分析

你可能遇到过这些问题：

- 首屏加载慢，用户等不及
- 加载了很多用不到的资源，浪费带宽
- 关键资源加载太慢，非关键资源反而先加载
- 页面交互功能用不到，但代码全打包在一起

打个比方：

> 资源加载优化就像搬家：
> - 先把今天用的东西搬出来（关键资源）
> - 明天用的东西放门口（预获取）
> - 明年用的东西放仓库（懒加载）
> - 别把所有东西一次性堆在客厅（按需加载）

### 优化策略

```
策略层次：
1. 减少资源数量 → 合并、内联
2. 减少资源体积 → 压缩、优化
3. 优化加载顺序 → 预加载、优先级
4. 按需加载 → 懒加载、代码分割
```

---

## 2 预加载（Preload）

### 什么是预加载？

提前加载当前页面即将需要的资源，高优先级。

```html
<!-- 预加载字体 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 预加载关键图片 -->
<link rel="preload" href="hero.webp" as="image" type="image/webp">

<!-- 预加载关键脚本 -->
<link rel="preload" href="critical.js" as="script">
```

**注意事项**：

- 预加载的资源会在当前页面加载
- 不使用的预加载会浪费带宽
- `crossorigin` 属性对字体文件必需

### 使用场景

```html
<!-- 场景 1：字体文件 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 场景 2：首屏大图 -->
<link rel="preload" href="hero.webp" as="image">

<!-- 场景 3：关键 CSS -->
<link rel="preload" href="critical.css" as="style">
```

---

## 3 预连接（Preconnect）

### 什么是预连接？

提前建立与第三方域名的连接，减少连接耗时。

```html
<!-- 预连接 CDN -->
<link rel="preconnect" href="https://cdn.example.com">

<!-- 预连接 API -->
<link rel="preconnect" href="https://api.example.com">

<!-- 带跨域凭证 -->
<link rel="preconnect" href="https://api.example.com" crossorigin>
```

**原理**：预连接会执行 DNS 解析 → TCP 握手 → TLS 协商

### 使用场景

```html
<head>
  <!-- 预连接关键域名 -->
  <link rel="preconnect" href="https://cdn.example.com">
  <link rel="preconnect" href="https://api.example.com" crossorigin>
  
  <!-- 预加载关键资源 -->
  <link rel="preload" href="critical.css" as="style">
  <link rel="preload" href="hero.webp" as="image">
</head>
```

---

## 4 DNS 预解析（DNS-prefetch）

### 什么是 DNS 预解析？

提前解析域名，比 preconnect 更快但更浅。

```html
<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://analytics.example.com">
```

### 对比 preconnect

| 特性 | preconnect | dns-prefetch |
| --- | --- | --- |
| 执行操作 | DNS + TCP + TLS | 仅 DNS |
| 耗时 | 较长 | 较短 |
| 效果 | 更彻底 | 较浅 |
| 适用场景 | 关键域名 | 非关键域名 |

---

## 5 资源优先级

### fetchpriority 属性

控制资源的加载优先级。

```html
<!-- 高优先级：首屏关键图片 -->
<img src="hero.webp" fetchpriority="high">

<!-- 低优先级：非首屏图片 -->
<img src="gallery-1.webp" fetchpriority="low">

<!-- 默认优先级 -->
<img src="content.webp">
```

### 浏览器默认优先级

| 资源类型 | 默认优先级 |
| --- | --- |
| 首屏图片 | High |
| 字体 | High |
| 非首屏图片 | Low |
| 预加载脚本 | Low |
| defer 脚本 | Low |

---

## 6 懒加载（Lazy Loading）

### 原生图片懒加载

```html
<!-- 浏览器原生支持 -->
<img src="image.webp" loading="lazy" alt="描述">
```

**注意事项**：

- 视口内的图片会立即加载
- 需要设置明确的宽高避免布局偏移
- 首屏图片不要使用 lazy

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

---

## 7 组件懒加载

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

---

## 8 预获取（Prefetch）

### 什么是预获取？

提前获取未来导航可能需要的资源，低优先级。

```html
<!-- 预获取下一页 -->
<link rel="prefetch" href="/next-page.html">

<!-- 预获取交互资源 -->
<link rel="prefetch" href="modal.js">
```

**特点**：

- 空闲时下载，优先级最低
- 不阻塞当前页面
- 缓存供未来使用

---

## 9 资源提示对比

| 方式 | 用途 | 优先级 | 时机 |
| --- | --- | --- | --- |
| preload | 当前页面必需 | 高 | 立即 |
| prefetch | 未来导航需要 | 低 | 空闲 |
| preconnect | 第三方域名 | - | 立即 |
| dns-prefetch | 第三方域名 | - | 立即 |

---

## 10 代码分割策略

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

---

## 11 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| preload | 当前页面必需资源，高优先级立即加载 |
| prefetch | 未来可能需要的资源，空闲时低优先级加载 |
| preconnect | 提前建立第三方连接，减少连接耗时 |
| loading=lazy | 原生图片懒加载，首屏图片禁用 |
| 代码分割 | 按路由、交互、视口分割，减少初始加载体积 |

---

## 12 新手常见误区

### 误区 1："preload 所有资源"

**错！** preload 的资源会立即加载，滥用会浪费带宽。

**正确做法**：

1. 只 preload 当前页面必需的关键资源
2. 非关键资源使用 prefetch 或不加载
3. 避免 preload 用不到的资源

### 误区 2："首屏图片用 lazy"

**错！** 首屏图片应该立即加载，用 lazy 会延迟显示。

**正确做法**：

1. 首屏图片使用 `loading="eager"` 或不设置
2. 非首屏图片使用 `loading="lazy"`
3. 首屏图片可以配合 preload

### 误区 3："preconnect 越多越好"

**错！** 每个 preconnect 都会消耗资源，过多会适得其反。

**正确做法**：

1. 只 preconnect 关键的第三方域名
2. 一般不超过 3-4 个
3. 非关键域名使用 dns-prefetch

### 误区 4："代码分割越细越好"

**错！** 分割太细会导致请求数过多，反而变慢。

**正确做法**：

1. 按路由分割是基础
2. 重量级组件单独分割
3. 平衡分割粒度和请求数

---

## 13 动手练习

### 练习 1：基础练习 - 资源提示

**题目**：为以下场景选择合适的资源提示方式。

```html
<!-- 场景 1：首屏大图 -->
<img src="hero.webp">

<!-- 场景 2：第三方字体 -->
<link rel="stylesheet" href="https://fonts.example.com/font.css">

<!-- 场景 3：下一页链接 -->
<a href="/next">下一页</a>
```

<details>
<summary>点击查看答案</summary>

```html
<!-- 场景 1：首屏大图 - 使用 preload -->
<link rel="preload" href="hero.webp" as="image" type="image/webp">
<img src="hero.webp" fetchpriority="high">

<!-- 场景 2：第三方字体 - 使用 preconnect -->
<link rel="preconnect" href="https://fonts.example.com" crossorigin>
<link rel="stylesheet" href="https://fonts.example.com/font.css">

<!-- 场景 3：下一页链接 - 使用 prefetch -->
<link rel="prefetch" href="/next">
<a href="/next">下一页</a>
```

</details>

### 练习 2：进阶练习 - 图片懒加载

**题目**：使用 IntersectionObserver 实现图片懒加载。

<details>
<summary>点击查看答案</summary>

```html
<!-- HTML -->
<img data-src="image1.webp" class="lazy" alt="图片1">
<img data-src="image2.webp" class="lazy" alt="图片2">
<img data-src="image3.webp" class="lazy" alt="图片3">

<script>
// 创建观察器
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      // 加载真实图片
      img.src = img.dataset.src;
      // 添加加载完成类名
      img.classList.add('loaded');
      // 停止观察
      observer.unobserve(img);
    }
  });
}, {
  // 提前 50px 开始加载
  rootMargin: '50px 0px',
  threshold: 0.01
});

// 观察所有懒加载图片
document.querySelectorAll('.lazy').forEach(img => {
  observer.observe(img);
});
</script>

<style>
.lazy {
  opacity: 0;
  transition: opacity 0.3s;
}
.lazy.loaded {
  opacity: 1;
}
</style>
```

</details>

### 练习 3（挑战）：综合练习 - 资源加载策略

**题目**：优化以下页面的资源加载策略。

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>我的页面</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://fonts.example.com/font.css">
  <script src="app.js"></script>
  <script src="analytics.js"></script>
</head>
<body>
  <img src="hero.jpg">
  <img src="gallery1.jpg">
  <img src="gallery2.jpg">
  <a href="/next">下一页</a>
</body>
</html>
```

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>我的页面</title>
  
  <!-- 预连接第三方域名 -->
  <link rel="preconnect" href="https://fonts.example.com" crossorigin>
  
  <!-- 预加载关键资源 -->
  <link rel="preload" href="hero.jpg" as="image">
  <link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- 关键 CSS -->
  <link rel="stylesheet" href="styles.css">
  
  <!-- 字体 CSS -->
  <link rel="stylesheet" href="https://fonts.example.com/font.css">
  
  <!-- 延迟脚本 -->
  <script defer src="app.js"></script>
  <script async src="analytics.js"></script>
  
  <!-- 预获取下一页 -->
  <link rel="prefetch" href="/next">
</head>
<body>
  <!-- 首屏图片：高优先级，立即加载 -->
  <img src="hero.jpg" fetchpriority="high" width="1200" height="600">
  
  <!-- 非首屏图片：懒加载 -->
  <img src="gallery1.jpg" loading="lazy" width="800" height="600">
  <img src="gallery2.jpg" loading="lazy" width="800" height="600">
  
  <a href="/next">下一页</a>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **图片与媒体优化**——也就是如何优化图片、视频等媒体资源。

你会学到：

- WebP、AVIF 等现代图片格式
- 响应式图片的实现
- 图片压缩和懒加载
- 视频优化和 GIF 替代方案
