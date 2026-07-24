---
title: Grid 布局
description: 网格容器、行列定义、区域划分
---

# CSS Grid 布局

CSS Grid 是一个强大的二维布局系统，可以同时控制行和列。它让复杂的页面布局变得简单直观。

## 基本概念

Grid 布局由**容器**（grid container）和**项目**（grid item）组成。

```html
<div class="container">
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
</div>
```

```css
.container {
  display: grid;
}
```

### 核心概念

- **网格容器**：设置 `display: grid` 的元素
- **网格项目**：容器的直接子元素
- **网格线**：划分网格的线，编号从 1 开始
- **网格轨道**：两条网格线之间的空间（行或列）
- **网格单元格**：最小的网格单位
- **网格区域**：由一个或多个单元格组成的矩形区域

## 容器属性

### 1. grid-template-columns / grid-template-rows

定义列和行的大小。

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 200px; /* 三列 */
  grid-template-rows: auto 1fr auto; /* 三行 */
}
```

#### 单位

| 单位          | 描述           |
| ------------- | -------------- |
| `px`          | 固定像素       |
| `%`           | 百分比         |
| `fr`          | 剩余空间的份数 |
| `auto`        | 自动大小       |
| `min-content` | 最小内容大小   |
| `max-content` | 最大内容大小   |

#### `repeat()` 函数

```css
/* 重复 3 次 1fr */
.container {
  grid-template-columns: repeat(3, 1fr);
}

/* 重复模式 */
.container {
  grid-template-columns: repeat(3, 1fr 2fr);
  /* 等同于 1fr 2fr 1fr 2fr 1fr 2fr */
}

/* auto-fill：自动填充 */
.container {
  grid-template-columns: repeat(auto-fill, 200px);
}

/* auto-fit：自适应填充 */
.container {
  grid-template-columns: repeat(auto-fit, 200px);
}
```

#### `minmax()` 函数

```css
.container {
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  /* 每列最小 200px，最大 1fr */
}
```

### 2. gap（间距）

```css
.container {
  gap: 16px; /* 行列间距相同 */
}

.container {
  gap: 16px 24px; /* 行间距 16px，列间距 24px */
}

.container {
  row-gap: 16px;
  column-gap: 24px;
}
```

### 3. justify-items / align-items

控制项目在单元格内的对齐。

```css
.container {
  justify-items: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}
```

| 值        | 描述             |
| --------- | ---------------- |
| `start`   | 起始对齐         |
| `end`     | 末尾对齐         |
| `center`  | 居中             |
| `stretch` | 拉伸填满（默认） |

### 4. justify-content / align-content

当网格总大小小于容器时，控制整个网格的对齐。

```css
.container {
  justify-content: center; /* 水平居中 */
  align-content: center; /* 垂直居中 */
}
```

### 5. grid-template-areas

使用命名区域定义布局。

```css
.container {
  display: grid;
  grid-template-areas:
    'header header header'
    'sidebar main main'
    'footer footer footer';
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: auto 1fr auto;
}

.header {
  grid-area: header;
}
.sidebar {
  grid-area: sidebar;
}
.main {
  grid-area: main;
}
.footer {
  grid-area: footer;
}
```

使用 `.` 表示空单元格：

```css
.container {
  grid-template-areas:
    'header header header'
    '. main main'
    'footer footer footer';
}
```

## 项目属性

### 1. grid-column / grid-row

指定项目在哪条网格线开始和结束。

```css
.item {
  grid-column: 1 / 3; /* 从第 1 条线到第 3 条线（占 2 列） */
  grid-row: 1 / 2; /* 从第 1 条线到第 2 条线（占 1 行） */
}
```

#### 关键字

```css
.item {
  grid-column: 1 / -1; /* 从第 1 条线到最后一条线（占满整行） */
}

.item {
  grid-column: span 2; /* 跨越 2 列 */
}

.item {
  grid-row: span 3; /* 跨越 3 行 */
}
```

### 2. grid-area

指定项目所在的命名区域，或作为 `grid-row` 和 `grid-column` 的简写。

```css
/* 命名区域 */
.item {
  grid-area: header;
}

/* 简写：row-start / column-start / row-end / column-end */
.item {
  grid-area: 1 / 1 / 2 / 3;
}
```

### 3. justify-self / align-self

控制单个项目在单元格内的对齐。

```css
.item {
  justify-self: center; /* 水平居中 */
  align-self: center; /* 垂直居中 */
}
```

## 常见布局模式

### 1. 响应式网格

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
```

### 2. 圣杯布局

```css
.layout {
  display: grid;
  grid-template-areas:
    'header header header'
    'left   main   right'
    'footer footer footer';
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header {
  grid-area: header;
}
.sidebar-left {
  grid-area: left;
}
.main {
  grid-area: main;
}
.sidebar-right {
  grid-area: right;
}
.footer {
  grid-area: footer;
}
```

### 3. 12 列网格

```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

.col-6 {
  grid-column: span 6;
}
.col-4 {
  grid-column: span 4;
}
.col-3 {
  grid-column: span 3;
}
```

### 4. 居中单个项目

```css
.container {
  display: grid;
  place-items: center;
  min-height: 100vh;
}
```

## 实际示例

### 图片画廊

```html
<style>
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .gallery-item {
    aspect-ratio: 1;
    background: #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .featured {
    grid-column: span 2;
    grid-row: span 2;
  }
</style>

<div class="gallery">
  <div class="gallery-item featured">大图</div>
  <div class="gallery-item">小图 1</div>
  <div class="gallery-item">小图 2</div>
  <div class="gallery-item">小图 3</div>
  <div class="gallery-item">小图 4</div>
</div>
```

### 仪表盘布局

```html
<style>
  .dashboard {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto 1fr auto;
    gap: 16px;
    padding: 16px;
    min-height: 100vh;
  }

  .header {
    grid-column: 1 / -1;
  }

  .sidebar {
    grid-row: 2 / 3;
  }

  .main-content {
    grid-column: 2 / -1;
  }

  .footer {
    grid-column: 1 / -1;
  }
</style>
```

## Grid vs Flexbox

| 特性       | Flexbox        | Grid           |
| ---------- | -------------- | -------------- |
| 维度       | 一维（行或列） | 二维（行和列） |
| 适用场景   | 组件级布局     | 页面级布局     |
| 对齐方式   | 沿主轴或交叉轴 | 同时控制行列   |
| 内容驱动   | 是             | 否             |
| 浏览器支持 | 广泛           | 现代浏览器     |

**建议**：

- 简单的一维布局使用 Flexbox
- 复杂的二维布局使用 Grid
- 两者可以嵌套使用

## 小结

- Grid 是二维布局系统，同时控制行和列
- 使用 `grid-template-columns/rows` 定义轨道
- `fr` 单位表示剩余空间的比例
- `repeat()` 简化重复定义
- `grid-template-areas` 提供直观的布局方式
- `auto-fit` 和 `minmax()` 实现响应式布局
- Grid 和 Flexbox 可以结合使用

下一章我们将学习 CSS 定位。
