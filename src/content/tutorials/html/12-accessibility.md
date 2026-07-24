---
title: "第十二章：无障碍访问"
description: "ARIA 属性、可访问性最佳实践"
---

# 第十二章：无障碍访问

## 什么是无障碍

无障碍（Accessibility，简称 a11y）是指让所有人都能使用网页，包括残障人士。

## ARIA 属性

### 角色

```html
<div role="button">按钮</div>
<div role="alert">警告信息</div>
<div role="navigation">导航</div>
```

### 状态

```html
<button aria-pressed="true">切换</button>
<input aria-required="true" aria-invalid="false">
<div aria-hidden="true">隐藏内容</div>
```

### 属性

```html
<button aria-label="关闭">X</button>
<input aria-describedby="help-text">
<p id="help-text">帮助文本</p>

<div aria-live="polite">动态内容</div>
```

## 最佳实践

### 使用语义化标签

```html
<!-- 不好 -->
<div onclick="...">按钮</div>

<!-- 好 -->
<button onclick="...">按钮</button>
```

### 图片替代文本

```html
<!-- 装饰性图片 -->
<img src="decoration.png" alt="">

<!-- 有意义的图片 -->
<img src="chart.png" alt="销售图表显示增长趋势">
```

### 表单标签

```html
<!-- 好 -->
<label for="email">邮箱：</label>
<input type="email" id="email">

<!-- 不好 -->
<input type="email" placeholder="邮箱">
```

### 键盘可访问

```html
<!-- 确保所有交互元素可通过键盘访问 -->
<button tabindex="0">可聚焦</button>
<a href="#" tabindex="0">链接</a>
```

### 跳过导航

```html
<a href="#main-content" class="skip-link">跳到主要内容</a>

<nav>...</nav>

<main id="main-content">
  <!-- 主要内容 -->
</main>
```

## 颜色对比度

确保文本与背景有足够的对比度：

- 普通文本：至少 4.5:1
- 大文本：至少 3:1

## 焦点管理

```css
/* 不要移除焦点样式 */
:focus {
  outline: 2px solid #0066cc;
}

/* 自定义焦点样式 */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

## 测试工具

- WAVE Web Accessibility Evaluation Tool
- axe DevTools
- Lighthouse
- 键盘测试（Tab 键导航）

## 总结

无障碍不仅是道德责任，也是法律要求。良好的无障碍实践可以提升所有用户的体验。
