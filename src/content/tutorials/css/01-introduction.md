---
title: CSS 简介
description: 什么是 CSS，样式表基础概念
---

# CSS 简介

CSS（Cascading Style Sheets，层叠样式表）是用于控制网页外观和布局的样式语言。如果说 HTML 是网页的骨架，那么 CSS 就是网页的皮肤和服装。

## 什么是 CSS

CSS 是一种样式表语言，用于描述 HTML 文档的呈现方式。它控制元素的颜色、字体、布局、动画等视觉效果。

### CSS 的作用

- **控制外观**：设置颜色、字体、大小、间距等
- **布局页面**：使用 Flexbox、Grid 等现代布局技术
- **响应式设计**：适配不同设备和屏幕尺寸
- **动画效果**：创建过渡和动画，提升用户体验

## CSS 的引入方式

CSS 可以通过三种方式引入到 HTML 文档中：

### 1. 行内样式

直接在 HTML 元素的 `style` 属性中定义样式：

```html
<p style="color: blue; font-size: 16px;">这是一段蓝色文字</p>
```

**优点**：优先级最高，样式直接作用于元素
**缺点**：无法复用，维护困难，不符合关注点分离原则

### 2. 内部样式表

在 HTML 文档的 `<head>` 部分使用 `<style>` 标签定义：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>内部样式表示例</title>
  <style>
    p {
      color: blue;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <p>这是一段蓝色文字</p>
</body>
</html>
```

**优点**：样式与结构分离，适合单页应用
**缺点**：无法跨页面复用

### 3. 外部样式表（推荐）

将 CSS 代码写在独立的 `.css` 文件中，通过 `<link>` 标签引入：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>外部样式表示例</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <p>这是一段蓝色文字</p>
</body>
</html>
```

`styles.css` 文件内容：

```css
p {
  color: blue;
  font-size: 16px;
}
```

**优点**：样式可复用，易于维护，浏览器可缓存
**缺点**：需要额外的 HTTP 请求

## CSS 语法规则

CSS 规则由两部分组成：**选择器**和**声明块**。

```css
选择器 {
  属性: 值;
  属性: 值;
}
```

### 示例

```css
/* 选择器：p 标签 */
/* 声明块：设置颜色和字体大小 */
p {
  color: blue;
  font-size: 16px;
  line-height: 1.5;
}
```

### 规则解析

- **选择器**：指定要应用样式的 HTML 元素
- **属性**：要修改的样式属性（如 `color`、`font-size`）
- **值**：属性的具体设置（如 `blue`、`16px`）
- **声明**：属性-值对，每条声明以分号结尾

## CSS 注释

使用 `/* */` 添加注释，提高代码可读性：

```css
/* 这是单行注释 */

/* 
  这是多行注释
  可以跨越多行
*/

p {
  color: blue; /* 行内注释 */
}
```

## 第一个 CSS 示例

让我们创建一个简单的样式示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>第一个 CSS 示例</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }

    h1 {
      color: #333;
      text-align: center;
    }

    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 20px auto;
    }

    .card p {
      color: #666;
      line-height: 1.6;
    }

    .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.3s;
    }

    .btn:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <h1>我的第一个 CSS 页面</h1>
  
  <div class="card">
    <p>这是一个使用 CSS 美化的卡片组件。通过 CSS，我们可以控制颜色、间距、阴影等视觉效果。</p>
    <a href="#" class="btn">了解更多</a>
  </div>
</body>
</html>
```

## CSS 学习建议

1. **多实践**：边学边练，动手写代码
2. **使用开发者工具**：浏览器开发者工具是调试 CSS 的利器
3. **从简单开始**：先掌握基础，再学习高级特性
4. **参考优秀案例**：查看优秀网站的 CSS 实现

## 小结

- CSS 是用于控制网页外观的样式语言
- 可以通过行内样式、内部样式表、外部样式表引入
- 推荐使用外部样式表，便于维护和复用
- CSS 规则由选择器和声明块组成
- 良好的注释习惯有助于代码维护

下一章我们将学习 CSS 选择器，这是控制样式作用范围的关键技术。
