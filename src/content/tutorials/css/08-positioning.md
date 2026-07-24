---
title: 定位
description: static、relative、absolute、fixed、sticky
---

# CSS 定位

CSS 定位允许你精确控制元素在页面中的位置。通过 `position` 属性，可以将元素从正常的文档流中取出，放置到任意位置。

## position 属性

### 1. static（静态定位）

默认值，元素按照正常文档流排列。

```css
.box {
  position: static; /* 默认值 */
}
```

`top`、`right`、`bottom`、`left` 属性对 `static` 定位无效。

### 2. relative（相对定位）

相对于元素原本的位置进行偏移，**不脱离文档流**。

```css
.box {
  position: relative;
  top: 20px; /* 向下偏移 20px */
  left: 30px; /* 向右偏移 30px */
}
```

**特点**：

- 元素原本占据的空间保留
- 偏移后可能覆盖其他元素
- 常作为绝对定位元素的参考点

### 3. absolute（绝对定位）

相对于最近的**非 static 定位祖先元素**进行定位，**脱离文档流**。

```css
.parent {
  position: relative; /* 作为参考点 */
}

.child {
  position: absolute;
  top: 0;
  right: 0;
}
```

**特点**：

- 脱离文档流，不占据空间
- 如果没有非 static 祖先，则相对于 `<html>` 定位
- 常用于弹窗、下拉菜单、角标等

### 4. fixed（固定定位）

相对于**浏览器视口**进行定位，滚动时位置不变。

```css
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}
```

**特点**：

- 脱离文档流
- 始终相对于视口定位
- 滚动时位置不变
- 常用于固定导航栏、返回顶部按钮

### 5. sticky（粘性定位）

在滚动过程中，在相对定位和固定定位之间切换。

```css
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
}
```

**特点**：

- 不脱离文档流
- 在达到指定位置前，表现为相对定位
- 达到指定位置后，表现为固定定位
- 常用于粘性导航栏、表头固定

## 偏移属性

| 属性     | 描述                   |
| -------- | ---------------------- |
| `top`    | 距离参考元素顶部的距离 |
| `right`  | 距离参考元素右侧的距离 |
| `bottom` | 距离参考元素底部的距离 |
| `left`   | 距离参考元素左侧的距离 |

```css
.box {
  position: absolute;
  top: 10px;
  right: 20px;
  bottom: 30px;
  left: 40px;
}
```

## z-index（层叠顺序）

控制定位元素的堆叠顺序，值越大越在上层。

```css
.overlay {
  position: fixed;
  z-index: 1000;
}

.modal {
  position: fixed;
  z-index: 1001;
}
```

**注意**：

- `z-index` 只对定位元素生效
- 同一层叠上下文中比较
- 负值会置于底层

## 实际示例

### 1. 固定导航栏

```html
<style>
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 100;
    display: flex;
    align-items: center;
    padding: 0 24px;
  }

  .content {
    margin-top: 60px; /* 避免被导航栏遮挡 */
  }
</style>

<nav class="navbar">导航栏</nav>
<main class="content">页面内容</main>
```

### 2. 粘性侧边栏

```html
<style>
  .layout {
    display: flex;
  }

  .sidebar {
    position: sticky;
    top: 80px;
    height: calc(100vh - 80px);
    width: 250px;
    overflow-y: auto;
  }

  .main {
    flex: 1;
  }
</style>

<div class="layout">
  <aside class="sidebar">侧边栏</aside>
  <main class="main">内容</main>
</div>
```

### 3. 绝对定位角标

```html
<style>
  .card {
    position: relative;
    width: 200px;
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 8px;
  }

  .badge {
    position: absolute;
    top: -10px;
    right: -10px;
    background: red;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
  }
</style>

<div class="card">
  <span class="badge">NEW</span>
  <h3>产品标题</h3>
  <p>产品描述</p>
</div>
```

### 4. 模态框

```html
<style>
  .modal-overlay {
    position: fixed;
    inset: 0; /* 等同于 top:0; right:0; bottom:0; left:0; */
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
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
    <h2>模态框标题</h2>
    <p>模态框内容</p>
  </div>
</div>
```

### 5. 返回顶部按钮

```html
<style>
  .back-to-top {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 48px;
    height: 48px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: opacity 0.3s;
  }

  .back-to-top:hover {
    background: #0056b3;
  }
</style>

<button class="back-to-top">↑</button>
```

### 6. 工具提示（Tooltip）

```html
<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-block;
  }

  .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    padding: 8px 12px;
    background: #333;
    color: white;
    font-size: 14px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }

  .tooltip-wrapper:hover .tooltip {
    opacity: 1;
  }
</style>

<div class="tooltip-wrapper">
  <button>悬停查看</button>
  <div class="tooltip">这是提示文字</div>
</div>
```

## 层叠上下文

层叠上下文决定了元素在 Z 轴上的堆叠顺序。

### 创建层叠上下文的条件

- `position` 为 `absolute`、`relative`、`fixed` 且 `z-index` 不为 `auto`
- `opacity` 小于 1
- `transform` 不为 `none`
- `filter` 不为 `none`
- `will-change` 值为上述属性之一

### 层叠顺序（从下到上）

1. 背景和边框
2. 负 `z-index`
3. 块级元素
4. 浮动元素
5. 行内元素
6. 正 `z-index`

## 小结

- `static`：默认值，正常文档流
- `relative`：相对自身偏移，不脱离文档流
- `absolute`：相对最近定位祖先定位，脱离文档流
- `fixed`：相对视口定位，脱离文档流
- `sticky`：滚动时切换相对/固定定位
- `z-index` 控制层叠顺序
- `inset` 是 `top/right/bottom/left` 的简写

下一章我们将学习响应式设计。
