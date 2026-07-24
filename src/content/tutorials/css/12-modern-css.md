---
title: 现代 CSS 特性
description: 容器查询、层叠层、嵌套规则
---

# 现代 CSS 特性

CSS 在不断发展，新增了许多强大的特性。本章介绍一些现代 CSS 特性，它们可以让样式编写更加高效和灵活。

## 容器查询（Container Queries）

容器查询允许根据父容器的大小来应用样式，而不是根据视口大小。

### 基本用法

```css
/* 定义容器 */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* 根据容器大小应用样式 */
@container card (min-width: 400px) {
  .card {
    display: flex;
  }
  
  .card-image {
    width: 40%;
  }
  
  .card-content {
    width: 60%;
  }
}

@container card (max-width: 399px) {
  .card {
    display: block;
  }
  
  .card-image {
    width: 100%;
  }
}
```

### container-type 值

| 值 | 描述 |
|----|------|
| `inline-size` | 监听行内容轴（宽度） |
| `block-size` | 监听块内容轴（高度） |
| `size` | 同时监听两个轴 |
| `normal` | 默认，不成为查询容器 |

### 实际示例

```html
<style>
  .wrapper {
    container-type: inline-size;
    container-name: main;
  }

  .product {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .product-image {
    width: 100%;
    aspect-ratio: 1;
  }

  @container main (min-width: 600px) {
    .product {
      flex-direction: row;
    }
    
    .product-image {
      width: 300px;
      flex-shrink: 0;
    }
  }
</style>

<div class="wrapper">
  <div class="product">
    <img src="product.jpg" alt="产品" class="product-image">
    <div class="product-info">
      <h3>产品名称</h3>
      <p>产品描述</p>
    </div>
  </div>
</div>
```

## 层叠层（Cascade Layers）

`@layer` 允许你显式控制样式的优先级，而不依赖于选择器的特异性。

### 基本用法

```css
/* 定义层 */
@layer base, components, utilities;

/* 在层中添加样式 */
@layer base {
  body {
    margin: 0;
    font-family: sans-serif;
  }
  
  a {
    color: blue;
  }
}

@layer components {
  .btn {
    padding: 8px 16px;
    border-radius: 4px;
  }
  
  .card {
    padding: 16px;
    border: 1px solid #eee;
  }
}

@layer utilities {
  .text-center {
    text-align: center;
  }
  
  .mt-4 {
    margin-top: 16px;
  }
}
```

### 层的优先级

层的优先级按声明顺序确定，后声明的层优先级更高。

```css
@layer base, components, utilities;

/* 即使选择器特异性更高，base 层的样式也会被 utilities 层覆盖 */
@layer base {
  #header .btn {
    color: red;
  }
}

@layer utilities {
  .btn {
    color: blue; /* 优先级更高 */
  }
}
```

### 未分层的样式

未分层的样式优先级高于所有层。

```css
@layer base {
  .btn {
    color: blue;
  }
}

/* 未分层，优先级最高 */
.btn {
  color: red;
}
```

### 实际示例

```css
/* 定义层顺序 */
@layer reset, base, components, utilities;

@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
}

@layer base {
  body {
    font-family: system-ui, sans-serif;
    line-height: 1.5;
  }
  
  h1, h2, h3, h4, h5, h6 {
    line-height: 1.2;
  }
}

@layer components {
  .btn {
    display: inline-block;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-primary {
    background: #007bff;
    color: white;
  }
}

@layer utilities {
  .hidden {
    display: none;
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
}
```

## 嵌套规则（Nested Rules）

CSS 嵌套允许在父选择器内编写子选择器，类似 Sass 的嵌套语法。

### 基本用法

```css
.card {
  padding: 16px;
  background: white;
  border-radius: 8px;
  
  /* 嵌套选择器 */
  .card-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .card-content {
    color: #666;
    line-height: 1.6;
  }
  
  /* 嵌套伪类 */
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  /* 嵌套媒体查询 */
  @media (max-width: 768px) {
    padding: 12px;
  }
}
```

### & 选择器

`&` 代表父选择器。

```css
.btn {
  padding: 8px 16px;
  
  /* 等同于 .btn:hover */
  &:hover {
    background: #0056b3;
  }
  
  /* 等同于 .btn.btn-large */
  &.btn-large {
    padding: 12px 24px;
    font-size: 18px;
  }
  
  /* 等同于 .btn-primary .btn */
  .btn-primary & {
    background: #007bff;
  }
}
```

### 实际示例

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #333;
  color: white;
  
  .logo {
    font-size: 20px;
    font-weight: bold;
  }
  
  .nav-links {
    display: flex;
    gap: 24px;
    list-style: none;
    
    a {
      color: white;
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      &.active {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    
    .nav-links {
      flex-direction: column;
      width: 100%;
      text-align: center;
    }
  }
}
```

## :has() 选择器

`:has()` 允许根据元素是否包含特定子元素来选择父元素。

### 基本用法

```css
/* 选择包含 img 的 a 标签 */
a:has(img) {
  display: block;
}

/* 选择包含 h2 的 section */
section:has(h2) {
  margin-bottom: 32px;
}

/* 选择包含必填输入框的表单 */
form:has(input:required) {
  border-left: 3px solid red;
  padding-left: 16px;
}

/* 选择没有子元素的 div */
div:not(:has(*)) {
  display: none;
}
```

### 实际示例

```css
.card {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
}

/* 如果卡片包含图片，调整布局 */
.card:has(img) {
  display: flex;
  gap: 16px;
}

.card:has(img) img {
  width: 200px;
  object-fit: cover;
  border-radius: 4px;
}

/* 如果表单有错误，显示提示 */
.form:has(:invalid) .error-message {
  display: block;
}
```

## 颜色空间

### oklch()

一种感知均匀的颜色空间，更容易创建和谐的颜色。

```css
:root {
  --primary: oklch(0.6 0.2 250);
  --primary-light: oklch(0.8 0.15 250);
  --primary-dark: oklch(0.4 0.2 250);
}
```

### color-mix()

混合两种颜色。

```css
.btn {
  background: var(--primary);
}

.btn:hover {
  background: color-mix(in srgb, var(--primary), black 20%);
}

.btn:active {
  background: color-mix(in srgb, var(--primary), black 30%);
}
```

### light-dark()

根据颜色方案自动切换颜色。

```css
:root {
  --bg: light-dark(white, #1a1a1a);
  --text: light-dark(#333, #fff);
}

body {
  background: var(--bg);
  color: var(--text);
}
```

## 逻辑属性

逻辑属性根据书写方向自动调整，适合国际化。

### 边距、边框、内边距

```css
/* 传统 */
.box {
  margin-left: 16px;
  padding-right: 24px;
  border-top: 1px solid #eee;
}

/* 逻辑属性 */
.box {
  margin-inline-start: 16px; /* LTR: margin-left, RTL: margin-right */
  padding-inline-end: 24px;
  border-block-start: 1px solid #eee;
}
```

### 尺寸

```css
/* 传统 */
.box {
  width: 100%;
  min-height: 100vh;
}

/* 逻辑属性 */
.box {
  inline-size: 100%;
  min-block-size: 100vh;
}
```

### 定位

```css
/* 传统 */
.box {
  top: 0;
  left: 0;
}

/* 逻辑属性 */
.box {
  inset-block-start: 0;
  inset-inline-start: 0;
}

/* 简写 */
.box {
  inset: 0; /* 等同于 top:0; right:0; bottom:0; left:0; */
}
```

## Subgrid

子网格允许子元素继承父网格的轨道定义。

```css
.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.child {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 3;
}
```

## 浏览器兼容性

| 特性 | Chrome | Firefox | Safari |
|------|--------|---------|--------|
| 容器查询 | 105+ | 110+ | 16+ |
| 层叠层 | 99+ | 97+ | 15.4+ |
| 嵌套规则 | 120+ | 117+ | 17.2+ |
| :has() | 105+ | 121+ | 15.4+ |
| oklch() | 111+ | 113+ | 15.4+ |
| color-mix() | 111+ | 113+ | 16.2+ |
| 逻辑属性 | 89+ | 66+ | 15+ |
| Subgrid | 117+ | 71+ | 16+ |

## 最佳实践

1. **渐进增强**：现代特性作为增强，提供回退方案
2. **使用 @supports**：检测浏览器是否支持某特性
3. **容器查询**：组件级响应式设计
4. **层叠层**：管理复杂项目的样式优先级
5. **嵌套规则**：提高代码可读性
6. **逻辑属性**：为国际化做准备

## 小结

- 容器查询实现组件级响应式设计
- 层叠层显式控制样式优先级
- 嵌套规则提高代码可读性
- `:has()` 选择器根据子元素选择父元素
- 现代颜色空间提供更直观的颜色控制
- 逻辑属性适合国际化
- Subgrid 简化嵌套网格布局

恭喜！你已经完成了 CSS 完全指南的学习。继续实践和探索，不断提升你的 CSS 技能。
