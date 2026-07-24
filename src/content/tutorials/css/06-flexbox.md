---
title: Flexbox 布局
description: 弹性盒子、主轴、交叉轴
---

# Flexbox 布局

Flexbox（弹性盒子布局）是 CSS3 引入的一维布局模型，专门用于解决元素在容器中的对齐和分布问题。它让布局变得更加简单和灵活。

## 基本概念

Flexbox 由**容器**（flex container）和**项目**（flex item）组成。

```html
<div class="container">
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
</div>
```

```css
.container {
  display: flex; /* 定义为 flex 容器 */
}

.item {
  /* 自动成为 flex 项目 */
}
```

### 两根轴

- **主轴（Main Axis）**：项目排列的方向，默认水平方向
- **交叉轴（Cross Axis）**：垂直于主轴的方向

```
              主轴 →
交叉轴  ┌─────────────────────────┐
  ↓     │  [1]  [2]  [3]  [4]    │
        └─────────────────────────┘
```

## 容器属性

### 1. flex-direction（主轴方向）

```css
.row {
  flex-direction: row; /* 默认：从左到右 */
}

.row-reverse {
  flex-direction: row-reverse; /* 从右到左 */
}

.column {
  flex-direction: column; /* 从上到下 */
}

.column-reverse {
  flex-direction: column-reverse; /* 从下到上 */
}
```

### 2. flex-wrap（换行）

```css
.nowrap {
  flex-wrap: nowrap; /* 默认：不换行 */
}

.wrap {
  flex-wrap: wrap; /* 换行 */
}

.wrap-reverse {
  flex-wrap: wrap-reverse; /* 反向换行 */
}
```

### 3. flex-flow（简写）

```css
.container {
  flex-flow: row wrap; /* flex-direction + flex-wrap */
}
```

### 4. justify-content（主轴对齐）

```css
.start {
  justify-content: flex-start; /* 默认：起始对齐 */
}

.end {
  justify-content: flex-end; /* 末尾对齐 */
}

.center {
  justify-content: center; /* 居中 */
}

.between {
  justify-content: space-between; /* 两端对齐，项目间等距 */
}

.around {
  justify-content: space-around; /* 每个项目两侧等距 */
}

.evenly {
  justify-content: space-evenly; /* 项目间及两端完全等距 */
}
```

**对比**：

```
space-between:  [1]     [2]     [3]
space-around:   [1]    [2]    [3]
space-evenly:   [1]   [2]   [3]
```

### 5. align-items（交叉轴对齐）

```css
.stretch {
  align-items: stretch; /* 默认：拉伸填满 */
}

.start {
  align-items: flex-start; /* 交叉轴起始 */
}

.end {
  align-items: flex-end; /* 交叉轴末尾 */
}

.center {
  align-items: center; /* 交叉轴居中 */
}

.baseline {
  align-items: baseline; /* 文字基线对齐 */
}
```

### 6. align-content（多行交叉轴对齐）

当 flex 容器有多行内容时生效。

```css
.stretch {
  align-content: stretch; /* 默认：拉伸填满 */
}

.start {
  align-content: flex-start;
}

.end {
  align-content: flex-end;
}

.center {
  align-content: center;
}

.between {
  align-content: space-between;
}

.around {
  align-content: space-around;
}
```

## 项目属性

### 1. order（排列顺序）

```css
.item1 {
  order: 3;
}
.item2 {
  order: 1;
}
.item3 {
  order: 2;
}
/* 显示顺序：2, 3, 1 */
```

### 2. flex-grow（放大比例）

定义项目的放大比例，默认为 0（不放大）。

```css
.item {
  flex-grow: 0; /* 默认：不放大 */
}

.item-grow {
  flex-grow: 1; /* 有剩余空间时，按比例放大 */
}
```

**示例**：

```css
.container {
  display: flex;
  width: 600px;
}
.item1 {
  flex-grow: 1;
} /* 占 1/3 剩余空间 */
.item2 {
  flex-grow: 2;
} /* 占 2/3 剩余空间 */
```

### 3. flex-shrink（缩小比例）

定义项目的缩小比例，默认为 1。

```css
.item {
  flex-shrink: 0; /* 不缩小 */
}

.item-shrink {
  flex-shrink: 2; /* 空间不足时，按比例缩小 */
}
```

### 4. flex-basis（初始大小）

定义项目在分配多余空间前的大小。

```css
.item {
  flex-basis: 200px; /* 初始宽度 200px */
}

.item-percent {
  flex-basis: 50%; /* 初始宽度 50% */
}

.item-auto {
  flex-basis: auto; /* 默认：根据内容决定 */
}
```

### 5. flex（简写）

```css
.item {
  flex: 1; /* 等同于 flex: 1 1 0% */
}

.item-auto {
  flex: auto; /* 等同于 flex: 1 1 auto */
}

.item-none {
  flex: none; /* 等同于 flex: 0 0 auto */
}
```

**推荐**：使用 `flex` 简写，避免单独设置 `flex-grow`、`flex-shrink`、`flex-basis` 时的优先级问题。

### 6. align-self（单独对齐）

覆盖容器的 `align-items` 设置。

```css
.item {
  align-self: flex-start;
}

.item-center {
  align-self: center;
}

.item-end {
  align-self: flex-end;
}

.item-stretch {
  align-self: stretch;
}
```

## 常见布局模式

### 1. 水平居中

```css
.container {
  display: flex;
  justify-content: center;
}
```

### 2. 垂直居中

```css
.container {
  display: flex;
  align-items: center;
  min-height: 100vh;
}
```

### 3. 水平垂直居中

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
```

### 4. 两端对齐

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### 5. 等分布局

```css
.container {
  display: flex;
}

.item {
  flex: 1; /* 每个项目等宽 */
}
```

### 6. 圣杯布局

```css
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar-left {
  flex: 0 0 200px;
}

.main {
  flex: 1;
}

.sidebar-right {
  flex: 0 0 200px;
}
```

### 7. 固定底部

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  flex: 0 0 auto;
}
.content {
  flex: 1;
}
.footer {
  flex: 0 0 auto;
}
```

## 实际示例

### 导航栏

```html
<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #333;
    color: white;
  }

  .nav-links {
    display: flex;
    gap: 16px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-links a {
    color: white;
    text-decoration: none;
    padding: 8px 12px;
    border-radius: 4px;
  }

  .nav-links a:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>

<nav class="navbar">
  <div class="logo">Logo</div>
  <ul class="nav-links">
    <li><a href="#">首页</a></li>
    <li><a href="#">关于</a></li>
    <li><a href="#">联系</a></li>
  </ul>
</nav>
```

### 卡片网格

```html
<style>
  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
  }

  .card {
    flex: 1 1 300px; /* 最小宽度 300px，自动放大 */
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>

<div class="card-grid">
  <div class="card">卡片 1</div>
  <div class="card">卡片 2</div>
  <div class="card">卡片 3</div>
</div>
```

### 居中弹窗

```html
<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
  }

  .modal {
    background: white;
    padding: 32px;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
  }
</style>

<div class="modal-overlay">
  <div class="modal">
    <h2>弹窗标题</h2>
    <p>弹窗内容</p>
  </div>
</div>
```

## gap 属性

`gap` 属性用于设置 flex 项目之间的间距。

```css
.container {
  display: flex;
  gap: 16px; /* 所有方向间距 */
}

.container {
  display: flex;
  gap: 16px 24px; /* 行间距 16px，列间距 24px */
}

.container {
  display: flex;
  row-gap: 16px;
  column-gap: 24px;
}
```

**注意**：`gap` 只作用于项目之间，不会作用于项目与容器边缘之间。

## 小结

- Flexbox 是一维布局模型，处理行或列
- 容器属性控制项目排列方向和对齐方式
- 项目属性控制单个项目的大小和位置
- 使用 `flex` 简写属性更高效
- `gap` 属性简化了项目间距设置
- Flexbox 适合组件级和小规模页面布局

下一章我们将学习 Grid 布局，这是 CSS 的二维布局系统。
