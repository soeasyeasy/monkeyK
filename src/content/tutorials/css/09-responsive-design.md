---
title: 响应式设计
description: 媒体查询、移动优先、断点设计
---

# 响应式设计

响应式设计（Responsive Web Design）是一种让网页在不同设备和屏幕尺寸上都能良好显示的设计方法。

## 核心原则

### 1. 流式布局

使用相对单位（`%`、`fr`、`vw`、`vh`）而非固定像素。

```css
.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}
```

### 2. 弹性图片

```css
img {
  max-width: 100%;
  height: auto;
}
```

### 3. 媒体查询

根据设备特征应用不同样式。

```css
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}
```

## 视口（Viewport）

### 设置视口

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

- `width=device-width`：宽度等于设备宽度
- `initial-scale=1.0`：初始缩放比例为 1

### 视口单位

| 单位   | 描述              |
| ------ | ----------------- |
| `vw`   | 视口宽度的 1%     |
| `vh`   | 视口高度的 1%     |
| `vmin` | vw 和 vh 中较小的 |
| `vmax` | vw 和 vh 中较大的 |

```css
.hero {
  height: 100vh;
  font-size: 5vw;
}
```

## 媒体查询

### 基本语法

```css
@media 媒体特征 {
  /* 样式规则 */
}
```

### 常用媒体特征

| 特征                   | 描述                           |
| ---------------------- | ------------------------------ |
| `width`                | 视口宽度                       |
| `height`               | 视口高度                       |
| `min-width`            | 最小宽度（大于等于）           |
| `max-width`            | 最大宽度（小于等于）           |
| `orientation`          | 方向（`portrait`/`landscape`） |
| `hover`                | 是否支持悬停                   |
| `prefers-color-scheme` | 颜色主题偏好                   |

### 示例

```css
/* 屏幕宽度小于 768px 时 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}

/* 屏幕宽度在 768px 到 1024px 之间 */
@media (min-width: 768px) and (max-width: 1024px) {
  .container {
    padding: 16px;
  }
}

/* 横屏模式 */
@media (orientation: landscape) {
  .hero {
    height: 50vh;
  }
}

/* 深色模式偏好 */
@media (prefers-color-scheme: dark) {
  body {
    background: #1a1a1a;
    color: #fff;
  }
}

/* 支持悬停的设备 */
@media (hover: hover) {
  .btn:hover {
    background: blue;
  }
}
```

### 逻辑运算符

```css
/* and：同时满足 */
@media (min-width: 768px) and (max-width: 1024px) {
}

/* ,（逗号）：满足任一条件 */
@media (max-width: 768px), (orientation: portrait) {
}

/* not：取反 */
@media not screen and (color) {
}

/* only：仅用于阻止旧浏览器识别 */
@media only screen and (max-width: 768px) {
}
```

## 断点设计

断点是媒体查询中使用的特定宽度值。

### 常用断点

```css
/* 手机 */
@media (max-width: 576px) {
}

/* 平板竖屏 */
@media (min-width: 577px) and (max-width: 768px) {
}

/* 平板横屏 / 小笔记本 */
@media (min-width: 769px) and (max-width: 1024px) {
}

/* 笔记本 / 桌面 */
@media (min-width: 1025px) and (max-width: 1440px) {
}

/* 大屏幕 */
@media (min-width: 1441px) {
}
```

### Bootstrap 断点参考

| 名称  | 范围     |
| ----- | -------- |
| `xs`  | < 576px  |
| `sm`  | ≥ 576px  |
| `md`  | ≥ 768px  |
| `lg`  | ≥ 992px  |
| `xl`  | ≥ 1200px |
| `xxl` | ≥ 1400px |

## 移动优先 vs 桌面优先

### 移动优先（推荐）

先编写移动端样式，再使用 `min-width` 逐步增强。

```css
/* 基础样式（移动端） */
.container {
  padding: 16px;
}

.grid {
  display: flex;
  flex-direction: column;
}

/* 平板及以上 */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }

  .grid {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .grid-item {
    width: 50%;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .grid-item {
    width: 33.333%;
  }
}
```

### 桌面优先

先编写桌面端样式，再使用 `max-width` 逐步降级。

```css
/* 基础样式（桌面端） */
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.grid-item {
  width: 33.333%;
}

/* 平板及以下 */
@media (max-width: 1024px) {
  .grid-item {
    width: 50%;
  }
}

/* 移动端 */
@media (max-width: 768px) {
  .grid-item {
    width: 100%;
  }
}
```

**推荐移动优先**：

- 移动端样式更简单
- 渐进增强比优雅降级更好
- 移动设备流量更少

## 响应式单位

### rem

相对于根元素字体大小。

```css
html {
  font-size: 16px;
}

h1 {
  font-size: 2rem; /* 32px */
}

@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
  /* h1 自动变为 28px */
}
```

### clamp()

设置响应式值的范围。

```css
h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
  /* 最小 1.5rem，首选 4vw，最大 3rem */
}

.container {
  width: clamp(300px, 80%, 1200px);
}
```

### calc()

动态计算值。

```css
.sidebar {
  width: calc(100% - 250px);
}

.item {
  width: calc(33.333% - 16px);
}
```

## 实际示例

### 响应式导航

```html
<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
  }

  .nav-links {
    display: flex;
    gap: 24px;
    list-style: none;
  }

  /* 移动端 */
  @media (max-width: 768px) {
    .navbar {
      flex-direction: column;
      gap: 16px;
    }

    .nav-links {
      flex-direction: column;
      gap: 8px;
      width: 100%;
      text-align: center;
    }
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

### 响应式卡片网格

```html
<style>
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    padding: 24px;
  }

  .card {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 576px) {
    .card-grid {
      grid-template-columns: 1fr;
      padding: 16px;
      gap: 16px;
    }
  }
</style>

<div class="card-grid">
  <div class="card">卡片 1</div>
  <div class="card">卡片 2</div>
  <div class="card">卡片 3</div>
</div>
```

### 响应式图片

```html
<style>
  .responsive-img {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  /* 使用 picture 元素提供不同图片 */
  picture source {
    /* 根据屏幕大小加载不同图片 */
  }
</style>

<picture>
  <source media="(min-width: 1024px)" srcset="large.jpg" />
  <source media="(min-width: 768px)" srcset="medium.jpg" />
  <img src="small.jpg" alt="响应式图片" class="responsive-img" />
</picture>
```

## 测试响应式设计

### 浏览器开发者工具

1. 按 F12 打开开发者工具
2. 点击设备工具栏图标（Ctrl+Shift+M）
3. 选择设备或自定义尺寸

### 常用测试尺寸

| 设备         | 宽度   |
| ------------ | ------ |
| iPhone SE    | 375px  |
| iPhone 12/13 | 390px  |
| iPad         | 768px  |
| iPad Pro     | 1024px |
| 笔记本       | 1366px |
| 桌面         | 1920px |

## 最佳实践

1. **移动优先**：先编写移动端样式
2. **使用相对单位**：`rem`、`%`、`vw/vh` 替代 `px`
3. **设置视口**：添加 viewport meta 标签
4. **弹性图片**：使用 `max-width: 100%`
5. **使用 clamp()**：简化响应式值设置
6. **测试多种设备**：确保在各种尺寸下表现良好
7. **避免固定高度**：使用 `min-height` 替代

## 小结

- 响应式设计让网页适配各种设备
- 使用视口 meta 标签和视口单位
- 媒体查询根据设备特征应用样式
- 移动优先是推荐的开发策略
- `clamp()` 简化响应式值设置
- 使用相对单位提升灵活性

下一章我们将学习 CSS 过渡与动画。
