---
title: "第二章：浏览器渲染原理"
description: "深入理解浏览器渲染流程，掌握关键渲染路径"
---

# 第二章：浏览器渲染原理

## 浏览器渲染流程概览

浏览器将 HTML、CSS、JavaScript 转换为屏幕上的像素，需要经过以下关键步骤：

```
HTML → DOM → CSSOM → 渲染树 → 布局 → 绘制 → 合成
```

## 构建 DOM

浏览器解析 HTML 文档，逐步构建 DOM 树。

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

DOM 构建过程是渐进式的，浏览器不会等待全部 HTML 解析完成。

## 构建 CSSOM

浏览器解析 CSS，构建 CSS 对象模型（CSSOM）。

```css
/* 示例 CSS */
h1 {
  color: red;
  font-size: 24px;
}

p {
  color: blue;
}
```

CSSOM 的构建会阻塞渲染，但不会阻塞 DOM 的构建。

## 渲染树构建

将 DOM 和 CSSOM 合并为渲染树，只包含可见元素。

```
渲染树 ≠ DOM 树

以下元素不会进入渲染树：
- display: none 的元素
- head 及其子元素
- 空文本节点
```

注意：`visibility: hidden` 的元素会进入渲染树，占据空间但不显示。

## 布局（Layout）

计算每个元素在视口中的精确位置和大小。

```
布局输出：盒模型信息
- 位置 (x, y)
- 尺寸 (width, height)
```

布局是递归进行的，从根元素开始向下计算。

## 绘制（Paint）

将元素的视觉属性转换为像素。

```
绘制顺序（从后到前）：
1. 背景
2. 边框
3. 内容
4. 定位元素
```

## 合成（Composite）

将页面分层，独立合成各层，最终组合为完整画面。

```
合成优势：
- 固定定位元素独立图层
- transform/opacity 动画在合成线程执行
- 避免重绘整个页面
```

## 关键渲染路径

关键渲染路径是指从接收 HTML 到页面首次渲染的最短路径。

```
关键资源：
- HTML（必须）
- 阻塞渲染的 CSS
- 阻塞解析的 JavaScript

优化策略：
1. 减少关键资源数量
2. 减少关键路径长度
3. 减少关键字节数
```

## 渲染阻塞资源

### CSS 是渲染阻塞资源

```html
<!-- 浏览器会等待 CSS 加载完成才渲染 -->
<link rel="stylesheet" href="styles.css">
```

### JavaScript 是解析阻塞资源

```html
<!-- 默认情况下，JS 会阻塞 DOM 解析 -->
<script src="app.js"></script>

<!-- 使用 defer 延迟执行 -->
<script defer src="app.js"></script>

<!-- 使用 async 异步加载 -->
<script async src="analytics.js"></script>
```

## 优化关键渲染路径

### 1. 内联关键 CSS

```html
<head>
  <!-- 内联首屏关键样式 -->
  <style>
    /* 首屏关键 CSS */
    body { margin: 0; font-family: sans-serif; }
    .header { /* ... */ }
  </style>

  <!-- 非关键 CSS 异步加载 -->
  <link rel="preload" href="non-critical.css" as="style"
        onload="this.rel='stylesheet'">
</head>
```

### 2. 延迟 JavaScript

```html
<!-- 将脚本放在 body 底部 -->
<body>
  <!-- 页面内容 -->
  <script src="app.js" defer></script>
</body>
```

### 3. 预加载关键资源

```html
<!-- 预加载字体 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 预加载关键图片 -->
<link rel="preload" href="hero.jpg" as="image">
```

## 核心知识点

1. **渲染流程**：DOM + CSSOM → 渲染树 → 布局 → 绘制 → 合成
2. **关键渲染路径**：优化关键资源数量和体积是提速核心
3. **CSS 阻塞渲染**：CSS 加载完成前页面不会渲染
4. **JS 阻塞解析**：默认情况下 JS 会阻塞 DOM 构建
5. **合成层优化**：transform 和 opacity 动画性能最佳
