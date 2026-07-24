---
title: "第六章：CSS 性能优化"
description: "优化 CSS 选择器、减少重排重绘、提升渲染性能"
---

# 第六章：CSS 性能优化

## CSS 性能影响

CSS 对性能的影响主要体现在：

| 影响维度 | 说明 |
| --- | --- |
| 加载性能 | CSS 是渲染阻塞资源 |
| 样式计算 | 复杂选择器增加计算成本 |
| 布局 | 某些属性触发重排 |
| 绘制 | 某些属性触发重绘 |

## 选择器优化

### 选择器效率

```css
/* 低效：通配符 + 深层嵌套 */
* > div > ul > li > a { }

/* 高效：简洁的类选择器 */
.nav-link { }
```

选择器从右向左匹配，关键选择器（最右边）决定匹配效率。

### 避免过度限定

```css
/* 过度限定 */
div.container ul.nav-list li.nav-item a.nav-link { }

/* 简洁高效 */
.nav-link { }
```

### 避免祖先选择器

```css
/* 低效：需要遍历所有祖先 */
html body div ul li a { }

/* 高效：直接类选择 */
.nav-link { }
```

## 减少重排（Reflow）

### 触发重排的属性

```
几何属性：
- width, height, padding, margin
- border-width
- top, left, right, bottom
- font-size
- display

布局属性：
- position
- float
- overflow
```

### 批量修改样式

```javascript
// 低效：每次修改触发重排
element.style.width = '100px';
element.style.height = '100px';
element.style.margin = '10px';

// 高效：一次性修改
element.style.cssText = 'width: 100px; height: 100px; margin: 10px;';

// 或使用 class
element.classList.add('resized');
```

### 离线 DOM 操作

```javascript
// 使用 DocumentFragment
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li');
  li.textContent = `Item ${i}`;
  fragment.appendChild(li);
}
list.appendChild(fragment); // 只触发一次重排
```

### 避免布局抖动

```javascript
// 低效：读写交替触发强制同步布局
elements.forEach(el => {
  const height = el.offsetHeight; // 读
  el.style.height = (height + 10) + 'px'; // 写
});

// 高效：先读后写
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => {
  el.style.height = (heights[i] + 10) + 'px';
});
```

## 减少重绘（Repaint）

### 触发重绘的属性

```
视觉属性：
- color, background
- border-color, border-style
- box-shadow
- outline
- visibility（不触发重排）
```

### 使用 will-change

```css
/* 提示浏览器元素将变化 */
.animated {
  will-change: transform, opacity;
}

/* 动画结束后移除 */
.animated.done {
  will-change: auto;
}
```

注意：不要滥用 will-change，会消耗内存。

## CSS 加载策略

### 内联关键 CSS

```html
<head>
  <!-- 内联首屏关键 CSS -->
  <style>
    /* 首屏必需样式 */
    body { margin: 0; }
    .header { /* ... */ }
    .hero { /* ... */ }
  </style>

  <!-- 异步加载非关键 CSS -->
  <link rel="preload" href="styles.css" as="style"
        onload="this.rel='stylesheet'">
</head>
```

### CSS 媒体查询分离

```html
<!-- 打印样式不阻塞渲染 -->
<link rel="stylesheet" href="print.css" media="print">

<!-- 暗色模式样式 -->
<link rel="stylesheet" href="dark.css" media="(prefers-color-scheme: dark)">
```

### 提取公共 CSS

```
CSS 分割策略：
- critical.css：首屏关键样式，内联
- main.css：主要样式，异步加载
- page-specific.css：页面特定样式，按需加载
```

## 动画性能

### 使用合成属性

```css
/* 高性能：只在合成层运行 */
.element {
  transition: transform 0.3s, opacity 0.3s;
}

.element:hover {
  transform: translateY(-10px);
  opacity: 0.8;
}
```

### 避免动画触发重排

```css
/* 低效：动画触发重排 */
@keyframes badAnimation {
  from { width: 100px; }
  to { width: 200px; }
}

/* 高效：使用 transform */
@keyframes goodAnimation {
  from { transform: scaleX(1); }
  to { transform: scaleX(2); }
}
```

### 使用 requestAnimationFrame

```javascript
// 低效：setTimeout 不保证同步
function animate() {
  element.style.left = position + 'px';
  position += 1;
  setTimeout(animate, 16);
}

// 高效：requestAnimationFrame 同步刷新
function animate() {
  element.style.left = position + 'px';
  position += 1;
  requestAnimationFrame(animate);
}
```

## CSS  containment

```css
/* 限制元素的影响范围 */
.sidebar {
  contain: layout style paint;
}

/* 各值含义：
- layout：内部布局不影响外部
- style：计数器、样式不泄漏
- paint：内容不溢出边界
- size：尺寸不依赖内容
*/
```

## content-visibility

```css
/* 延迟渲染屏幕外内容 */
.section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* 预估高度 */
}
```

浏览器会跳过屏幕外元素的渲染工作，显著提升长页面性能。

## 核心知识点

1. **选择器优化**：使用简洁的类选择器，避免深层嵌套
2. **批量修改**：避免读写交替，减少强制同步布局
3. **动画优化**：优先使用 transform 和 opacity
4. **CSS 分割**：内联关键 CSS，异步加载非关键 CSS
5. **contain 属性**：限制元素影响范围，减少浏览器计算
