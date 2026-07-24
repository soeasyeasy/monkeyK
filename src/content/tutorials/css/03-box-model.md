---
title: 盒模型
description: content、padding、border、margin
---

# CSS 盒模型

盒模型是 CSS 布局的基础。每个 HTML 元素都可以看作一个矩形盒子，由内容（content）、内边距（padding）、边框（border）和外边距（margin）组成。

## 盒模型的组成

```
┌─────────────────────────────────────┐
│              margin                 │
│  ┌─────────────────────────────┐    │
│  │         border              │    │
│  │  ┌─────────────────────┐    │    │
│  │  │      padding        │    │    │
│  │  │  ┌─────────────┐    │    │    │
│  │  │  │   content   │    │    │    │
│  │  │  │             │    │    │    │
│  │  │  └─────────────┘    │    │    │
│  │  └─────────────────────┘    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 1. Content（内容）

盒子的实际内容区域，显示文本、图片等。

```css
.box {
  width: 200px;
  height: 100px;
}
```

### 2. Padding（内边距）

内容与边框之间的空间，背景色会延伸到 padding 区域。

```css
.box {
  padding: 20px; /* 四个方向相同 */
}

.box {
  padding: 10px 20px; /* 上下 10px，左右 20px */
}

.box {
  padding: 10px 20px 30px; /* 上 10px，左右 20px，下 30px */
}

.box {
  padding: 10px 20px 30px 40px; /* 上、右、下、左（顺时针） */
}

/* 单独设置某个方向 */
.box {
  padding-top: 10px;
  padding-right: 20px;
  padding-bottom: 30px;
  padding-left: 40px;
}
```

### 3. Border（边框）

围绕内容和 padding 的边框。

```css
.box {
  border: 1px solid black; /* 宽度、样式、颜色 */
}

/* 单独设置属性 */
.box {
  border-width: 2px;
  border-style: solid;
  border-color: #333;
}

/* 单独设置某个方向 */
.box {
  border-top: 2px solid red;
  border-right: 1px dashed blue;
  border-bottom: 3px double green;
  border-left: 1px dotted gray;
}
```

#### 边框样式

| 值 | 描述 |
|----|------|
| `none` | 无边框 |
| `solid` | 实线边框 |
| `dashed` | 虚线边框 |
| `dotted` | 点线边框 |
| `double` | 双线边框 |
| `groove` | 3D 凹槽边框 |
| `ridge` | 3D 凸槽边框 |
| `inset` | 3D 内凹边框 |
| `outset` | 3D 外凸边框 |

#### 圆角边框

```css
.box {
  border-radius: 8px; /* 四个角相同 */
}

.box {
  border-radius: 10px 20px; /* 左上右下、右上左下 */
}

.box {
  border-radius: 10px 20px 30px; /* 左上、右上左下、右下 */
}

.box {
  border-radius: 10px 20px 30px 40px; /* 左上、右上、右下、左下（顺时针） */
}

/* 圆形 */
.circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}
```

### 4. Margin（外边距）

盒子与其他元素之间的空间。

```css
.box {
  margin: 20px; /* 四个方向相同 */
}

.box {
  margin: 10px 20px; /* 上下 10px，左右 20px */
}

.box {
  margin: 10px 20px 30px; /* 上 10px，左右 20px，下 30px */
}

.box {
  margin: 10px 20px 30px 40px; /* 上、右、下、左（顺时针） */
}

/* 单独设置某个方向 */
.box {
  margin-top: 10px;
  margin-right: 20px;
  margin-bottom: 30px;
  margin-left: 40px;
}

/* 水平居中 */
.center {
  width: 200px;
  margin: 0 auto;
}
```

#### Margin 合并

垂直方向上的相邻 margin 会合并（取较大值），而不是相加。

```css
.box1 {
  margin-bottom: 20px;
}

.box2 {
  margin-top: 30px;
}
```

两个盒子之间的实际距离是 30px，而不是 50px。

## 盒模型计算

### 标准盒模型（content-box）

默认情况下，`width` 和 `height` 只包含 content 区域。

```
总宽度 = width + padding-left + padding-right + border-left + border-right
总高度 = height + padding-top + padding-bottom + border-top + border-bottom
```

```css
.box {
  width: 200px;
  padding: 20px;
  border: 1px solid #ccc;
}
/* 实际宽度 = 200 + 20*2 + 1*2 = 242px */
```

### 替代盒模型（border-box）

使用 `box-sizing: border-box` 后，`width` 和 `height` 包含 content、padding 和 border。

```css
* {
  box-sizing: border-box;
}

.box {
  width: 200px;
  padding: 20px;
  border: 1px solid #ccc;
}
/* 实际宽度 = 200px（content 自动调整为 158px） */
```

**推荐**：全局使用 `border-box`，更符合直觉。

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

## 盒模型可视化

使用浏览器开发者工具可以直观地查看盒模型。

### 调试技巧

1. 按 F12 打开开发者工具
2. 选中元素
3. 在 Computed/Styles 面板查看盒模型图

## 实际示例

### 卡片组件

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>盒模型示例</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background-color: #f5f5f5;
    }

    .card {
      width: 300px;
      margin: 20px auto;
      padding: 20px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card h3 {
      margin-bottom: 12px;
      color: #333;
    }

    .card p {
      margin-bottom: 16px;
      color: #666;
      line-height: 1.5;
    }

    .card .btn {
      display: inline-block;
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      border: none;
      cursor: pointer;
    }

    .card .btn:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <div class="card">
    <h3>卡片标题</h3>
    <p>这是一个使用盒模型构建的卡片组件。通过合理设置 padding、margin 和 border，我们可以创建美观的布局。</p>
    <button class="btn">了解更多</button>
  </div>
</body>
</html>
```

### 导航栏示例

```html
<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background-color: #333;
    color: white;
  }

  .navbar .logo {
    font-size: 20px;
    font-weight: bold;
  }

  .navbar .nav-links {
    display: flex;
    gap: 24px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .navbar .nav-links a {
    color: white;
    text-decoration: none;
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .navbar .nav-links a:hover {
    background-color: #555;
  }
</style>

<nav class="navbar">
  <div class="logo">MyWebsite</div>
  <ul class="nav-links">
    <li><a href="#">首页</a></li>
    <li><a href="#">关于</a></li>
    <li><a href="#">服务</a></li>
    <li><a href="#">联系</a></li>
  </ul>
</nav>
```

## 外边距塌陷（Margin Collapse）

### 1. 相邻兄弟元素

垂直方向上的 margin 会合并。

```css
.box1 {
  margin-bottom: 20px;
}

.box2 {
  margin-top: 30px;
}
/* 两者之间的距离是 30px，不是 50px */
```

### 2. 父子元素

如果父元素没有 border 或 padding，子元素的 margin-top 会与父元素的 margin-top 合并。

```html
<div class="parent">
  <div class="child">内容</div>
</div>
```

```css
.parent {
  margin-top: 20px;
}

.child {
  margin-top: 30px;
}
/* 父元素的实际 margin-top 是 30px */
```

**解决方案**：

- 给父元素添加 `overflow: hidden`
- 给父元素添加 border 或 padding
- 使用 Flexbox 或 Grid 布局

### 3. 空元素

如果一个元素没有内容，也没有 border 或 padding，它的 margin-top 和 margin-bottom 会合并。

```css
.empty {
  margin-top: 20px;
  margin-bottom: 30px;
}
/* 实际高度是 30px，不是 50px */
```

## 盒模型最佳实践

1. **全局使用 border-box**：更符合直觉，计算更简单
2. **重置默认样式**：使用 `* { margin: 0; padding: 0; }` 清除浏览器默认样式
3. **使用 margin 创建间距**：避免使用空元素或 `<br>` 标签
4. **注意 margin 合并**：垂直方向上的 margin 会合并
5. **使用开发者工具调试**：可视化查看盒模型

## 小结

- 盒模型由 content、padding、border、margin 组成
- 标准盒模型（content-box）的 width/height 只包含 content
- 替代盒模型（border-box）的 width/height 包含 content、padding、border
- 推荐使用 `box-sizing: border-box`
- 垂直方向上的 margin 会合并（取较大值）
- 使用开发者工具可以直观地查看盒模型

下一章我们将学习文本与字体的样式设置。
