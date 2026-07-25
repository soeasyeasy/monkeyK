---
title: "第六章：CSS 性能优化"
description: "掌握 CSS 加载优化、选择器优化、动画性能优化"
---

# 第六章：CSS 性能优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- CSS 为什么会阻塞渲染？怎么优化？
- 什么样的 CSS 选择器性能好？什么样的差？
- 为什么动画用 `transform` 比 `top/left` 流畅？
- 关键 CSS 是什么？怎么内联？

这一章就是为了解答这些问题。CSS 优化直接影响首屏渲染速度和动画流畅度。

---

## 6.1 为什么需要 CSS 性能优化？

### 痛点分析

你可能遇到过这些问题：

- 页面白屏很久才显示内容
- 滚动时页面卡顿
- 动画掉帧、不流畅
- 样式计算很慢

打个比方：

> CSS 优化就像整理衣柜：
> - 乱塞衣服 = 复杂选择器，找衣服慢
> - 分类整理 = 简洁选择器，一目了然
> - 常用衣服放手边 = 关键 CSS 内联，立即显示

### 优化方向

```
CSS 优化方向：
1. 加载优化 → 减少阻塞渲染时间
2. 选择器优化 → 提高样式匹配速度
3. 动画优化 → 使用高性能属性
4. 布局优化 → 减少重排重绘
```

---

## 6.2 CSS 加载优化

### 关键 CSS 内联

```html
<head>
  <!-- ✅ 内联首屏关键 CSS -->
  <style>
    /* 只包含首屏必需的样式 */
    body { margin: 0; font-family: sans-serif; }
    .header { height: 60px; background: #fff; }
    .hero { height: 400px; background: #f0f0f0; }
  </style>

  <!-- ✅ 非关键 CSS 异步加载 -->
  <link rel="preload" href="styles.css" as="style"
        onload="this.rel='stylesheet'">
  <noscript>
    <link rel="stylesheet" href="styles.css">
  </noscript>
</head>
```

**原理**：

- 内联 CSS 不需要额外请求，立即可用
- 异步加载的 CSS 不阻塞渲染
- 首屏内容可以立即显示

### CSS 压缩

```css
/* ❌ 压缩前 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ✅ 压缩后 */
.container{width:100%;max-width:1200px;margin:0 auto;padding:0 20px}
```

**工具**：

- cssnano（PostCSS 插件）
- clean-css
- SVGO（SVG 压缩）

---

## 6.3 CSS 选择器优化

### 选择器性能

```css
/* ❌ 差：后代选择器，需要遍历所有元素 */
.box .item .text {
  color: red;
}

/* ✅ 好：类选择器，直接匹配 */
.text {
  color: red;
}
```

### 选择器效率对比

| 选择器类型 | 效率 | 示例 |
| --- | --- | --- |
| ID 选择器 | 最高 | `#header` |
| 类选择器 | 高 | `.container` |
| 标签选择器 | 中 | `div` |
| 属性选择器 | 低 | `[data-id]` |
| 伪类选择器 | 低 | `:hover` |
| 后代选择器 | 最低 | `.box .item` |

### 避免过度嵌套

```css
/* ❌ 差：嵌套过深 */
.page .header .nav .item .link {
  color: blue;
}

/* ✅ 好：扁平化 */
.nav-link {
  color: blue;
}
```

---

## 6.4 减少重排重绘

### 重排（Reflow）

当元素的几何属性变化时触发。

```javascript
// ❌ 差：每次循环都触发重排
for (let i = 0; i < 100; i++) {
  element.style.width = i + 'px';  // 触发 100 次重排
}

// ✅ 好：批量修改
const styles = [];
for (let i = 0; i < 100; i++) {
  styles.push(i + 'px');
}
element.style.width = styles[styles.length - 1];  // 只触发 1 次重排
```

### 触发重排的属性

```
几何属性：
├── width, height
├── padding, margin
├── border-width
├── top, left, right, bottom
├── font-size
└── display
```

### 触发重绘的属性

```
视觉属性：
├── color, background
├── border-color
├── box-shadow
├── outline
└── visibility
```

### 使用 transform

```css
/* ❌ 差：触发重排 */
.box {
  position: absolute;
  top: 0;
  left: 0;
  transition: top 0.3s, left 0.3s;
}

.box:hover {
  top: 100px;
  left: 100px;
}

/* ✅ 好：使用 transform，不触发重排 */
.box {
  transition: transform 0.3s;
}

.box:hover {
  transform: translate(100px, 100px);
}
```

---

## 6.5 动画性能优化

### 使用 will-change

```css
/* 提示浏览器这个元素会变化 */
.animated {
  will-change: transform;
}

/* 动画结束后移除 */
.animated.done {
  will-change: auto;
}
```

**注意事项**：

- 不要滥用 will-change，会消耗内存
- 只在动画开始前添加
- 动画结束后移除

### 使用 GPU 加速

```css
/* 触发 GPU 加速 */
.gpu-accelerated {
  transform: translateZ(0);
  /* 或 */
  transform: translate3d(0, 0, 0);
}
```

**原理**：

- 创建合成层，在 GPU 上运行
- 不阻塞主线程
- 动画更流畅

### 动画性能对比

| 属性 | 性能 | 原因 |
| --- | --- | --- |
| transform | 最佳 | 合成层，GPU 加速 |
| opacity | 最佳 | 合成层，GPU 加速 |
| top/left | 差 | 触发重排 |
| width/height | 差 | 触发重排 |
| background | 中 | 触发重绘 |

---

## 6.6 CSS  containment

### contain 属性

```css
/* 限制元素的影响范围 */
.independent {
  contain: layout style paint;
}
```

**值说明**：

| 值 | 作用 |
| --- | --- |
| layout | 元素内部布局不影响外部 |
| style | 计数器、引用等不影响外部 |
| paint | 元素内容不会溢出 |
| size | 元素尺寸不依赖子元素 |

**使用场景**：

- 独立组件（如卡片、列表项）
- 频繁更新的区域
- 第三方组件

---

## 6.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 关键 CSS | 内联首屏必需样式，异步加载其他样式 |
| 选择器优化 | 使用类选择器，避免深层嵌套 |
| 重排重绘 | 重排代价最高，重绘次之，合成最低 |
| transform | 动画优先使用 transform 和 opacity |
| will-change | 提示浏览器元素会变化，但不要滥用 |
| contain | 限制元素影响范围，提高性能 |

---

## 6.8 新手常见误区

### 误区 1："CSS 选择器怎么写都行"

**错！** 复杂选择器会降低样式匹配速度。

**正确做法**：

1. 优先使用类选择器
2. 避免深层嵌套（不超过 3 层）
3. 使用 BEM 等命名规范

### 误区 2："动画用 top/left 也行"

**错！** `top/left` 会触发重排，性能很差。

**正确做法**：

1. 使用 `transform: translate()` 替代
2. 使用 `opacity` 做淡入淡出
3. 添加 `will-change` 提示浏览器

### 误区 3："will-change 越多越好"

**错！** will-change 会创建合成层，消耗内存。

**正确做法**：

1. 只在动画开始前添加
2. 动画结束后移除
3. 不要给所有元素添加

### 误区 4："CSS 不需要优化"

**错！** CSS 会阻塞渲染，影响首屏速度。

**正确做法**：

1. 内联关键 CSS
2. 异步加载非关键 CSS
3. 压缩 CSS 文件

---

## 6.9 动手练习

### 练习 1：基础练习 - 关键 CSS 内联

**题目**：优化以下 HTML 的 CSS 加载。

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="header">头部</header>
  <main class="content">内容</main>
</body>
</html>
```

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html>
<head>
  <!-- ✅ 内联首屏关键 CSS -->
  <style>
    body { margin: 0; font-family: sans-serif; }
    .header { height: 60px; background: #333; color: #fff; }
    .content { padding: 20px; }
  </style>

  <!-- ✅ 非关键 CSS 异步加载 -->
  <link rel="preload" href="styles.css" as="style"
        onload="this.rel='stylesheet'">
  <noscript>
    <link rel="stylesheet" href="styles.css">
  </noscript>
</head>
<body>
  <header class="header">头部</header>
  <main class="content">内容</main>
</body>
</html>
```

**优化点**：

1. 内联首屏关键 CSS，避免渲染阻塞
2. 非关键 CSS 异步加载
3. 添加 noscript 回退

</details>

### 练习 2：进阶练习 - 动画优化

**题目**：优化以下动画代码。

```css
.box {
  position: absolute;
  width: 100px;
  height: 100px;
  background: red;
  transition: top 0.3s, left 0.3s;
}

.box:hover {
  top: 100px;
  left: 100px;
}
```

<details>
<summary>点击查看答案</summary>

```css
.box {
  width: 100px;
  height: 100px;
  background: red;
  /* ✅ 使用 transform 替代 top/left */
  transition: transform 0.3s;
  /* ✅ 提示浏览器会变化 */
  will-change: transform;
}

.box:hover {
  /* ✅ 使用 transform */
  transform: translate(100px, 100px);
}

/* ✅ 动画结束后移除 will-change */
.box:not(:hover) {
  will-change: auto;
}
```

**优化点**：

1. 使用 `transform` 替代 `top/left`，不触发重排
2. 添加 `will-change` 提示浏览器
3. 动画结束后移除 `will-change`

</details>

### 练习 3（挑战）：综合练习 - CSS 性能优化

**题目**：优化以下页面的 CSS 性能。

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="reset.css">
  <link rel="stylesheet" href="layout.css">
  <link rel="stylesheet" href="components.css">
  <link rel="stylesheet" href="utilities.css">
</head>
<body>
  <header class="header">
    <nav class="nav">
      <a href="#" class="nav-item">首页</a>
      <a href="#" class="nav-item">关于</a>
    </nav>
  </header>
  <main class="content">
    <div class="card">
      <h2 class="card-title">标题</h2>
      <p class="card-text">内容</p>
    </div>
  </main>
</body>
</html>
```

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html>
<head>
  <!-- ✅ 内联关键 CSS -->
  <style>
    /* Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; }
    
    /* Layout */
    .header { height: 60px; background: #333; }
    .nav { display: flex; gap: 20px; padding: 0 20px; }
    .nav-item { color: #fff; text-decoration: none; }
    
    /* Components */
    .content { padding: 20px; }
    .card { border: 1px solid #ddd; padding: 20px; }
    .card-title { font-size: 24px; margin-bottom: 10px; }
    .card-text { color: #666; }
  </style>

  <!-- ✅ 非关键 CSS 异步加载 -->
  <link rel="preload" href="utilities.css" as="style"
        onload="this.rel='stylesheet'">
  <noscript>
    <link rel="stylesheet" href="utilities.css">
  </noscript>
</head>
<body>
  <header class="header">
    <nav class="nav">
      <a href="#" class="nav-item">首页</a>
      <a href="#" class="nav-item">关于</a>
    </nav>
  </header>
  <main class="content">
    <div class="card">
      <h2 class="card-title">标题</h2>
      <p class="card-text">内容</p>
    </div>
  </main>
</body>
</html>
```

**优化点**：

1. 内联首屏关键 CSS（reset、layout、components）
2. 非关键 CSS（utilities）异步加载
3. 减少 CSS 文件数量，合并关键样式
4. 使用类选择器，避免复杂选择器

</details>

---

## 下一章预告

下一章我们会学习 **JavaScript 性能优化**——也就是如何优化 JavaScript 的加载和执行性能。

你会学到：

- defer 和 async 的区别
- 代码分割和懒加载
- 防抖和节流
- 避免长任务阻塞主线程
