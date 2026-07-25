---
title: "第二章：浏览器渲染原理"
description: "深入理解浏览器渲染流程，掌握关键渲染路径"
---

# 第二章：浏览器渲染原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 浏览器是怎么把代码变成页面的？
- 为什么 CSS 放在 head 里，JS 放在 body 底部？
- 什么是"关键渲染路径"？为什么要优化它？
- 为什么有些操作会导致页面卡顿？

这一章就是为了解答这些问题。我们会从浏览器的渲染流程讲起，帮你理解 **为什么页面会慢**，以及 **怎么从根源上提速**。

---

## 2.1 为什么需要理解渲染原理？

### 痛点分析

你可能遇到过这些问题：

- 页面白屏很久才显示内容
- 动画卡顿、不流畅
- 不知道为什么要用 `defer`、`async`
- 做了优化但不知道有没有效果

打个比方：

> 理解渲染原理就像医生了解人体结构。不知道骨骼和肌肉的位置，怎么能做手术？不理解渲染流程，怎么能做好性能优化？

### 学习价值

| 理解渲染原理后 | 你能做到 |
| --- | --- |
| 知道 CSS 为什么阻塞渲染 | 合理安排 CSS 加载顺序 |
| 知道 JS 为什么阻塞解析 | 正确使用 defer/async |
| 知道重排重绘的代价 | 避免触发不必要的布局计算 |
| 知道合成层的优势 | 使用高性能动画属性 |

> **一句话总结**：理解渲染原理是性能优化的基础，它让你知道"为什么这样优化有效"。

---

## 2.2 浏览器渲染流程

### 完整渲染流程

浏览器将 HTML、CSS、JavaScript 转换为屏幕上的像素，需要经过以下步骤：

```
HTML → DOM 构建
         ↓
CSS → CSSOM 构建
         ↓
    DOM + CSSOM → 渲染树
         ↓
       布局（Layout）
         ↓
       绘制（Paint）
         ↓
       合成（Composite）
```

打个比方：

> 渲染流程就像盖房子：
> - DOM 构建 = 搭骨架（钢筋结构）
> - CSSOM 构建 = 设计图纸（装修风格）
> - 渲染树 = 合并（只建需要 visible 的房间）
> - 布局 = 量尺寸（每个房间多大、在哪）
> - 绘制 = 刷油漆（上色、贴瓷砖）
> - 合成 = 拍照（最终呈现给你看）

### 第一步：构建 DOM

浏览器读取 HTML，逐步构建 DOM 树。

```html
<!-- 示例 HTML -->
<html>
  <head>
    <title>示例页面</title>
  </head>
  <body>
    <h1>标题</h1>
    <p>段落内容</p>
  </body>
</html>
```

```
DOM 树：
html
├── head
│   └── title
└── body
    ├── h1
    └── p
```

**关键点**：DOM 构建是渐进式的，浏览器不会等待全部 HTML 解析完成。

### 第二步：构建 CSSOM

浏览器解析 CSS，构建 CSS 对象模型（CSSOM）。

```css
/* 示例 CSS */
h1 {
  color: red;        /* 样式 1 */
  font-size: 24px;   /* 样式 2 */
}

p {
  color: blue;       /* 样式 3 */
}
```

```
CSSOM 树：
├── h1 { color: red; font-size: 24px; }
└── p  { color: blue; }
```

**关键点**：CSSOM 构建会阻塞渲染，但不会阻塞 DOM 构建。

### 第三步：构建渲染树

将 DOM 和 CSSOM 合并为渲染树，只包含可见元素。

```
渲染树 ≠ DOM 树

以下元素不会进入渲染树：
- display: none 的元素
- head 及其子元素
- 空文本节点

注意：visibility: hidden 的元素会进入渲染树
（占据空间但不显示）
```

### 第四步：布局（Layout）

计算每个元素在视口中的精确位置和大小。

```
布局输出：盒模型信息
├── 位置 (x, y)
├── 尺寸 (width, height)
├── 外边距 (margin)
├── 内边距 (padding)
└── 边框 (border)
```

**关键点**：布局是递归进行的，从根元素开始向下计算。

### 第五步：绘制（Paint）

将元素的视觉属性转换为像素。

```
绘制顺序（从后到前）：
1. 背景（background）
2. 边框（border）
3. 内容（content）
4. 定位元素（positioned elements）
```

### 第六步：合成（Composite）

将页面分层，独立合成各层，最终组合为完整画面。

```
合成优势：
├── 固定定位元素独立图层
├── transform/opacity 动画在合成线程执行
├── 不需要重绘整个页面
└── GPU 加速，性能更好
```

---

## 2.3 关键渲染路径

### 什么是关键渲染路径？

关键渲染路径是指从接收 HTML 到页面首次渲染的最短路径。

```
关键资源：
├── HTML（必须）
├── 阻塞渲染的 CSS
└── 阻塞解析的 JavaScript

优化策略：
├── 减少关键资源数量
├── 减少关键路径长度
└── 减少关键字节数
```

打个比方：

> 关键渲染路径就像从家到公司的最短路线。路越短、红绿灯越少、路越窄，到达越快。

### CSS 是渲染阻塞资源

```html
<!-- 浏览器会等待 CSS 加载完成才渲染 -->
<link rel="stylesheet" href="styles.css">

<!-- 原因：没有样式，页面没法显示 -->
```

### JavaScript 是解析阻塞资源

```html
<!-- ❌ 默认情况下，JS 会阻塞 DOM 解析 -->
<script src="app.js"></script>

<!-- ✅ 使用 defer 延迟执行（DOM 解析完成后执行） -->
<script defer src="app.js"></script>

<!-- ✅ 使用 async 异步加载（加载完立即执行） -->
<script async src="analytics.js"></script>
```

---

## 2.4 渲染阻塞资源对比

| 资源类型 | 阻塞行为 | 原因 |
| --- | --- | --- |
| CSS | 阻塞渲染 | 没有样式无法显示 |
| JavaScript | 阻塞 DOM 解析 | 可能修改 DOM |
| 图片 | 不阻塞渲染 | 异步加载 |
| 字体 | 可能阻塞文本显示 | 等待字体加载 |

---

## 2.5 优化关键渲染路径

### 1. 内联关键 CSS

```html
<head>
  <!-- ✅ 内联首屏关键样式 -->
  <style>
    /* 只包含首屏必需的样式 */
    body { margin: 0; font-family: sans-serif; }
    .header { /* 头部样式 */ }
    .hero { /* 首屏大图样式 */ }
  </style>

  <!-- ✅ 非关键 CSS 异步加载 -->
  <link rel="preload" href="non-critical.css" as="style"
        onload="this.rel='stylesheet'">
</head>
```

**原理**：

- 内联 CSS 不需要额外请求，立即可用
- 异步加载的 CSS 不阻塞渲染

### 2. 延迟 JavaScript

```html
<!-- ✅ 将脚本放在 body 底部 -->
<body>
  <!-- 页面内容 -->
  <script src="app.js" defer></script>
</body>
```

**原理**：

- `defer` 让 JS 在 DOM 解析完成后执行
- 不阻塞 DOM 构建

### 3. 预加载关键资源

```html
<!-- ✅ 预加载字体 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- ✅ 预加载关键图片 -->
<link rel="preload" href="hero.jpg" as="image">
```

**原理**：

- `preload` 提前加载关键资源
- 高优先级，不延迟页面渲染

---

## 2.6 重排与重绘

### 什么是重排（Reflow）？

当元素的几何属性（尺寸、位置）发生变化时，浏览器需要重新计算布局。

```
触发重排的属性：
├── width, height, padding, margin
├── border-width
├── top, left, right, bottom
├── font-size
└── display
```

### 什么是重绘（Repaint）？

当元素的视觉属性发生变化，但不影响布局时，只需要重新绘制。

```
触发重绘的属性：
├── color, background
├── border-color
├── box-shadow
├── outline
└── visibility
```

### 重排 vs 重绘 vs 合成

| 操作 | 代价 | 示例 |
| --- | --- | --- |
| 重排 | 最高 | 修改 width/height |
| 重绘 | 中等 | 修改 color/background |
| 合成 | 最低 | 修改 transform/opacity |

**关键点**：优先使用 `transform` 和 `opacity` 做动画，因为它们在合成层运行，性能最好。

---

## 2.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 渲染流程 | DOM + CSSOM → 渲染树 → 布局 → 绘制 → 合成 |
| 关键渲染路径 | 优化关键资源数量和体积是提速核心 |
| CSS 阻塞渲染 | CSS 加载完成前页面不会渲染 |
| JS 阻塞解析 | 默认情况下 JS 会阻塞 DOM 构建 |
| 合成层优化 | transform 和 opacity 动画性能最佳 |
| 重排重绘 | 重排代价最高，重绘次之，合成最低 |

---

## 2.8 新手常见误区

### 误区 1："CSS 放在 body 里也行"

**错！** CSS 放在 body 里会导致页面先显示无样式内容，然后突然跳变（FOUC）。

**正确做法**：

1. CSS 放在 `<head>` 中
2. 尽早加载 CSS，避免渲染阻塞时间过长

### 误区 2："JS 放在 head 里没问题"

**错！** JS 放在 head 里会阻塞 DOM 解析，导致页面白屏。

**正确做法**：

1. 使用 `defer` 或 `async` 属性
2. 或者将 JS 放在 body 底部

### 误区 3："动画用 top/left 也行"

**错！** `top/left` 会触发重排，性能很差。

**正确做法**：

1. 使用 `transform: translate()` 替代 `top/left`
2. 使用 `opacity` 做淡入淡出

### 误区 4："visibility:hidden 和 display:none 一样"

**错！** 两者区别很大：

- `display: none`：不进入渲染树，不占据空间
- `visibility: hidden`：进入渲染树，占据空间但不显示

**正确做法**：

1. 完全隐藏用 `display: none`
2. 占位但不可见用 `visibility: hidden`

---

## 2.9 动手练习

### 练习 1：基础练习 - 分析渲染阻塞

**题目**：以下 HTML 中，哪些资源会阻塞渲染？哪些会阻塞 DOM 解析？

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
  <script src="app.js"></script>
</head>
<body>
  <h1>标题</h1>
  <script src="main.js"></script>
</body>
</html>
```

<details>
<summary>点击查看答案</summary>

**分析**：

| 资源 | 阻塞行为 | 原因 |
| --- | --- | --- |
| styles.css | 阻塞渲染 | CSS 是渲染阻塞资源 |
| app.js（head 中） | 阻塞 DOM 解析 | JS 是解析阻塞资源 |
| main.js（body 底部） | 阻塞 DOM 解析 | 但在 body 底部，DOM 已构建完成 |

**优化建议**：

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
  <script defer src="app.js"></script>  <!-- 添加 defer -->
</head>
<body>
  <h1>标题</h1>
  <!-- main.js 在 body 底部，可以不加 defer -->
  <script src="main.js"></script>
</body>
</html>
```

</details>

### 练习 2：进阶练习 - 优化动画性能

**题目**：以下动画代码性能不好，请优化。

```css
/* 性能差的动画 */
@keyframes moveRight {
  from {
    left: 0;
    top: 0;
  }
  to {
    left: 100px;
    top: 100px;
  }
}

.box {
  position: absolute;
  animation: moveRight 1s;
}
```

<details>
<summary>点击查看答案</summary>

**优化后**：

```css
/* ✅ 使用 transform 替代 top/left */
@keyframes moveRight {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(100px, 100px);
  }
}

.box {
  /* 不需要 position: absolute */
  animation: moveRight 1s;
  /* 可选：提示浏览器这个元素会变化 */
  will-change: transform;
}
```

**优化点**：

1. `transform` 在合成层运行，不触发重排重绘
2. `top/left` 会触发重排，性能差
3. `will-change` 提示浏览器提前优化

</details>

### 练习 3（挑战）：综合练习 - 优化关键渲染路径

**题目**：优化以下 HTML 的关键渲染路径。

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>我的页面</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="print.css">
  <script src="analytics.js"></script>
  <script src="app.js"></script>
</head>
<body>
  <h1>欢迎</h1>
  <p>这是首屏内容</p>
  <img src="hero.jpg" alt="大图">
  <script src="chat-widget.js"></script>
</body>
</html>
```

<details>
<summary>点击查看答案</summary>

**优化后**：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>我的页面</title>
  
  <!-- ✅ 内联首屏关键 CSS -->
  <style>
    body { margin: 0; font-family: sans-serif; }
    h1 { font-size: 24px; color: #333; }
    .hero { width: 100%; height: 400px; }
  </style>
  
  <!-- ✅ 非关键 CSS 异步加载 -->
  <link rel="preload" href="styles.css" as="style"
        onload="this.rel='stylesheet'">
  
  <!-- ✅ 打印样式不阻塞渲染 -->
  <link rel="stylesheet" href="print.css" media="print">
  
  <!-- ✅ 预加载关键图片 -->
  <link rel="preload" href="hero.jpg" as="image">
  
  <!-- ✅ 非关键脚本延迟加载 -->
  <script defer src="app.js"></script>
  
  <!-- ✅ 第三方脚本异步加载 -->
  <script async src="analytics.js"></script>
</head>
<body>
  <h1>欢迎</h1>
  <p>这是首屏内容</p>
  <img src="hero.jpg" alt="大图" class="hero"
       width="1200" height="400">
  
  <!-- ✅ 聊天组件延迟加载 -->
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        const script = document.createElement('script');
        script.src = 'chat-widget.js';
        document.body.appendChild(script);
      }, 3000);
    });
  </script>
</body>
</html>
```

**优化点**：

1. 内联首屏关键 CSS，避免渲染阻塞
2. 非关键 CSS 异步加载
3. 打印样式使用 `media="print"`，不阻塞渲染
4. JS 使用 `defer/async`，不阻塞 DOM 解析
5. 预加载关键图片
6. 聊天组件延迟到页面加载完成后加载

</details>

---

## 下一章预告

下一章我们会学习 **性能指标与测量**——也就是如何量化评估页面性能。

你会学到：

- Core Web Vitals（LCP、INP、CLS）的含义和标准
- 如何使用 Chrome DevTools 测量性能
- 如何使用 Performance API 自定义测量
- 如何建立性能监控体系

测量是优化的第一步，没有测量就没有优化。
