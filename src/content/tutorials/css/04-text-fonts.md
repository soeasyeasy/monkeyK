---
title: "第四章：CSS 文本与字体"
description: "font-family、text-align、line-height 详解"
---

# 第四章：CSS 文本与字体

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么要设置这么多字体？直接写一个字体不行吗？
- px、em、rem 这些单位有什么区别？用哪个好？
- 行高（line-height）到底是什么？怎么设置才合理？
- 字体那么多属性，每次都要一个个写吗？有没有简写方式？

这一章就是为了解答这些问题。我们会先搞清楚 **字体和文本的核心概念**，再逐个学习各种属性的用法，最后掌握排版的最佳实践。

---

## 4.1 为什么需要文本样式？

### 痛点分析

想象一下，如果网页只有默认的文字样式，会是什么样子？

- 所有文字都是一样的字体，标题和正文区分不开
- 密密麻麻挤在一起，读起来特别累
- 没有层次感，不知道哪里是重点
- 不同系统显示的字体不一样，效果没法保证
- 网站看起来很粗糙，没有专业感

打个比方：

> 如果把网页内容比作"一本书"，那文本样式就是"排版设计"。一本排版糟糕的书，内容再好也让人读不下去；好的排版能让读者心情愉悦，不知不觉就看完了。

### 解决方案

CSS 文本样式就是用来给文字"排版化妆"的。通过设置字体、字号、颜色、行高、对齐方式等，你可以：

- 让文字清晰易读，提升阅读体验
- 建立视觉层次，突出重点内容
- 打造独特的品牌风格
- 确保在不同设备上都有良好的显示效果

> **一句话总结**：文本样式是网页的"排版师"，让文字既好看又好读。

---

## 4.2 核心原理

### 概念解释

文本样式主要分为两大类：

1. **字体属性（Font）**：控制文字本身的样子
   - 字体类型（font-family）
   - 字体大小（font-size）
   - 字体粗细（font-weight）
   - 字体样式（font-style）

2. **文本属性（Text）**：控制文字的排版布局
   - 文字颜色（color）
   - 对齐方式（text-align）
   - 行高（line-height）
   - 字间距（letter-spacing）
   - 文本装饰（text-decoration）

打个比方：
- **字体属性**就像选什么样的笔——毛笔、钢笔、铅笔，写出来的字本身不一样
- **文本属性**就像排版——字写多大、行间距多少、靠左还是居中

### 字体族分类

| 字体族类型 | 特点 | 代表字体 | 适用场景 |
| --- | --- | --- | --- |
| `serif`（衬线体） | 笔画末端有装饰性小线条 | Times New Roman、Georgia | 书籍、报纸正文 |
| `sans-serif`（无衬线体） | 笔画干净，没有装饰线 | Arial、Helvetica | 网页、屏幕阅读 ✅ |
| `monospace`（等宽字体） | 每个字母宽度一样 | Courier New、Consolas | 代码、终端 |
| `cursive`（手写体） | 像手写的 | Comic Sans MS | 装饰、标题 |

---

## 4.3 字体属性详解

### 1. font-family（字体族）

指定文字用什么字体显示。

```css
body {
  /* 从左到右依次尝试，第一个不可用就试下一个 */
  font-family: Arial, "Microsoft YaHei", sans-serif;
}
```

#### 字体回退机制

浏览器会按顺序尝试字体：
1. 先试第一个字体（Arial），如果用户电脑上有就用
2. 没有就试第二个（微软雅黑）
3. 都没有就用最后那个通用字体族（sans-serif）

> 💡 **为什么要写多个字体？** 因为你不知道用户电脑上装了什么字体，多写几个保险。最后一定要加通用字体族兜底。

#### 系统字体栈（推荐写法）

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif;
}
```

这个写法的好处：
- 在苹果设备上用系统字体，最清晰
- 在 Windows 上用微软雅黑
- 各种设备都能显示最佳效果
- 不用加载外部字体，速度快

> ✅ **推荐**：日常开发就用系统字体栈，性能好，体验佳。

### 2. font-size（字体大小）

设置文字的大小。

```css
h1 {
  font-size: 32px;         /* 标题32像素 */
}

p {
  font-size: 16px;         /* 正文16像素 */
}
```

#### 常用单位对比

| 单位 | 含义 | 特点 | 推荐度 |
| --- | --- | --- | --- |
| `px` | 像素，绝对单位 | 固定大小，好理解 | ⭐⭐⭐ |
| `em` | 相对于父元素字体大小 | 会继承，容易出问题 | ⭐⭐ |
| `rem` | 相对于根元素（html）字体大小 | 全局可控，响应式方便 | ⭐⭐⭐⭐⭐ |
| `%` | 相对于父元素的百分比 | 和 em 类似 | ⭐⭐ |

#### rem 的用法

```css
/* 根元素默认 16px，1rem = 16px */
html {
  font-size: 16px;
}

h1 {
  font-size: 2rem;         /* 2 * 16 = 32px */
}

p {
  font-size: 1rem;         /* 1 * 16 = 16px */
}
```

> 💡 **rem 的好处**：以后想把全站字体调大一点，只改 `html` 的 `font-size` 就行，不用一个个改。

### 3. font-weight（字体粗细）

设置文字的粗细程度。

```css
.normal {
  font-weight: normal;     /* 正常粗细，等同于 400 */
}

.bold {
  font-weight: bold;       /* 加粗，等同于 700 */
}

.light {
  font-weight: 300;        /* 细体 */
}

.heavy {
  font-weight: 900;        /* 超粗体 */
}
```

#### 数值对照表

| 数值 | 对应关键字 | 说明 |
| --- | --- | --- |
| 100 | Thin | 极细 |
| 200 | Extra Light | 特细 |
| 300 | Light | 细 |
| 400 | Normal | 正常 ✅ |
| 500 | Medium | 中等 |
| 600 | Semi Bold | 半粗 |
| 700 | Bold | 粗体 |
| 800 | Extra Bold | 特粗 |
| 900 | Black | 超粗 |

> ⚠️ **注意**：不是所有字体都支持这么多粗细值的。如果字体没有对应的粗细，浏览器会自动找最接近的。

### 4. font-style（字体样式）

设置文字是否倾斜。

```css
.normal {
  font-style: normal;      /* 正常 */
}

.italic {
  font-style: italic;      /* 斜体 */
}
```

> 💡 **小提示**：`italic` 和 `oblique` 都是斜体，区别不大，一般用 `italic` 就行。

### 5. font 简写属性 ✨

用一个属性设置所有字体样式，写起来更简洁。

```css
p {
  /* 顺序：font-style font-weight font-size/line-height font-family */
  font: italic bold 16px/1.5 Arial, sans-serif;
}
```

**语法顺序**：`font-style font-weight font-size/line-height font-family`

> ⚠️ **注意**：`font-size` 和 `font-family` 是必须的，其他可以省略。顺序不能乱！

---

## 4.4 文本属性详解

### 1. color（文字颜色）

设置文字的颜色。

```css
h1 {
  color: #333;             /* 十六进制，最常用 */
}

p {
  color: rgb(100, 100, 100); /* RGB */
}

a {
  color: rgba(0, 123, 255, 0.8); /* RGBA，带透明度 */
}
```

#### 颜色值写法

| 写法 | 示例 | 说明 |
| --- | --- | --- |
| 颜色名 | `red`、`blue` | 简单但可选少 |
| HEX | `#333`、`#007bff` | 最常用 ✅ |
| RGB | `rgb(255, 0, 0)` | 红绿蓝 |
| RGBA | `rgba(255,0,0,0.5)` | 带透明度 |

> 💡 **小技巧**：正文文字不要用纯黑（`#000`），用深灰色（`#333` 或 `#444`）更柔和，看着不累。

### 2. text-align（文本对齐）

设置文字的水平对齐方式。

```css
.left {
  text-align: left;        /* 左对齐（默认） */
}

.center {
  text-align: center;      /* 居中对齐 */
}

.right {
  text-align: right;       /* 右对齐 */
}

.justify {
  text-align: justify;     /* 两端对齐 */
}
```

> ⚠️ **注意**：`text-align` 只对**行内内容**有效，是给父元素设置的，用来控制子元素的对齐。

### 3. line-height（行高）⭐ 非常重要

设置每行文字的高度，也就是行与行之间的距离。

```css
p {
  line-height: 1.6;        /* 推荐：无单位的倍数 */
}
```

#### 行高的几种写法

| 写法 | 示例 | 说明 | 推荐度 |
| --- | --- | --- | --- |
| 无单位数字 | `1.6` | 相对于当前字体大小的倍数 | ⭐⭐⭐⭐⭐ |
| 像素值 | `24px` | 固定高度 | ⭐⭐⭐ |
| 百分比 | `160%` | 相对于字体大小 | ⭐⭐ |
| normal | `normal` | 浏览器默认（约1.2） | ⭐ |

**为什么推荐无单位？**
- 用无单位数字，子元素会继承这个倍数
- 用像素或百分比，子元素继承的是计算后的值，可能出问题

> ✅ **最佳实践**：正文行高设为 `1.5` 到 `1.8` 之间，读起来最舒服。

### 4. letter-spacing（字间距）

设置字符之间的间距。

```css
h1 {
  letter-spacing: 2px;     /* 字间距2像素 */
}

.spaced {
  letter-spacing: 0.1em;   /* 相对于字号的间距 */
}
```

> 💡 使用场景：标题字间距稍微调大一点，会显得更有质感。

### 5. text-decoration（文本装饰）

给文字加装饰线（下划线、删除线等）。

```css
.none {
  text-decoration: none;   /* 没有装饰，最常用 */
}

.underline {
  text-decoration: underline; /* 下划线 */
}

.line-through {
  text-decoration: line-through; /* 删除线 */
}
```

**最常见的用法——去掉链接的下划线：**
```css
a {
  text-decoration: none;   /* 去掉链接默认的下划线 */
}
```

### 6. text-indent（首行缩进）

设置段落第一行的缩进。

```css
p {
  text-indent: 2em;        /* 缩进两个字符 */
}
```

> 💡 中文段落习惯首行缩进两格，用 `text-indent: 2em` 正好。

### 7. text-transform（文字大小写）

转换英文字母的大小写。

```css
.uppercase {
  text-transform: uppercase;  /* 全部大写 */
}

.lowercase {
  text-transform: lowercase;  /* 全部小写 */
}

.capitalize {
  text-transform: capitalize; /* 首字母大写 */
}
```

> ⚠️ 对中文无效，只对英文有用。

---

## 4.5 文本阴影

用 `text-shadow` 给文字加阴影效果。

```css
h1 {
  /* 水平偏移 垂直偏移 模糊半径 颜色 */
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}
```

**参数说明：**
1. 水平偏移（正数向右，负数向左）
2. 垂直偏移（正数向下，负数向上）
3. 模糊半径（可选，越大越模糊）
4. 颜色（可选）

**多个阴影叠加：**
```css
.text {
  text-shadow:
    1px 1px 2px black,
    0 0 10px blue,
    0 0 20px white;
}
```

> 💡 标题加个淡淡的阴影，会更有层次感。但不要加太多，否则会很花哨。

---

## 4.6 核心知识点总结

| 分类 | 属性 | 作用 | 重要程度 |
| --- | --- | --- | --- |
| 字体 | `font-family` | 设置字体 | ⭐⭐⭐⭐⭐ |
| 字体 | `font-size` | 设置字号 | ⭐⭐⭐⭐⭐ |
| 字体 | `font-weight` | 设置粗细 | ⭐⭐⭐⭐ |
| 字体 | `font-style` | 设置斜体 | ⭐⭐⭐ |
| 字体 | `font` | 简写属性 | ⭐⭐⭐⭐ |
| 文本 | `color` | 文字颜色 | ⭐⭐⭐⭐⭐ |
| 文本 | `text-align` | 水平对齐 | ⭐⭐⭐⭐⭐ |
| 文本 | `line-height` | 行高 | ⭐⭐⭐⭐⭐ |
| 文本 | `letter-spacing` | 字间距 | ⭐⭐⭐ |
| 文本 | `text-decoration` | 装饰线 | ⭐⭐⭐⭐ |
| 文本 | `text-indent` | 首行缩进 | ⭐⭐⭐ |
| 效果 | `text-shadow` | 文字阴影 | ⭐⭐⭐ |

---

## 4.7 新手常见误区

### 误区 1："字体写一个就行，写那么多干嘛？"

**错！** 你不知道用户的电脑上装了什么字体。如果你只写了一个字体，而用户电脑上没有，浏览器就会用默认字体，效果可能差很多。

正确做法：
- 多写几个字体作为备选
- 最后一定要加通用字体族（如 `sans-serif`）兜底
- 推荐用系统字体栈，各种设备都有最佳效果

### 误区 2："line-height 就是行间距，越大间距越大"

**不完全对。** `line-height` 是**行高**，不是行间距。

- 行高 = 文字高度 + 上下间距
- 行高 1.5 意思是行高是字号的 1.5 倍
- 行高越大，行与行之间的距离确实越大，但概念不一样

为什么行高很重要？
- 行高太小，文字挤在一起，读着累
- 行高太大，文字太散，找下一行费劲
- 正文 1.5 到 1.8 最合适

### 误区 3："text-align: center 能让任何元素居中"

**错！** `text-align: center` 只能让**行内内容**（文字、图片、行内块等）在父元素里居中，不能让块级元素本身居中。

```css
/* ❌ 这样不能让 div 居中 */
div {
  text-align: center;
}

/* ✅ 块级元素水平居中要用 margin */
div {
  width: 200px;
  margin: 0 auto;
}
```

记住：
- 行内内容居中 → 给父元素加 `text-align: center`
- 块级元素本身居中 → 给元素自己加 `margin: 0 auto`（要有宽度）

### 误区 4："font 简写随便写顺序就行"

**错！** `font` 简写的顺序是固定的：

```
font: [font-style] [font-weight] font-size/line-height font-family;
```

- `font-size` 和 `font-family` 是必须的，不能少
- 其他可以省略，但顺序不能乱
- `line-height` 要写在 `font-size` 后面，用斜杠分开

```css
/* ✅ 正确写法 */
font: bold 16px/1.5 Arial, sans-serif;

/* ❌ 错误：顺序乱了 */
font: 16px bold Arial/1.5 sans-serif;
```

### 误区 5："字重（font-weight）随便写数字都有效"

**不一定。** 字体粗细取决于字体文件本身有没有对应粗细的字形。

比如很多中文字体只有正常（400）和加粗（700）两种，你写 300、500 可能都没效果，浏览器会自动找最接近的。

正确做法：
- 正文用 `normal`（400）
- 需要强调用 `bold`（700）
- 特殊设计需求再用具体数值，并且确保字体支持

---

## 4.8 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，实现以下文本样式：

- 页面整体字体用系统字体栈，字号 16px，行高 1.6
- 一级标题：32px、加粗、居中、深灰色（`#333`）、字间距 1px
- 二级标题：24px、加粗、蓝色（`#007bff`）
- 段落：深灰色（`#555`）、首行缩进 2 字符
- 引用文字：斜体、灰色（`#888`）、左边框 4px 蓝色、左边距 0

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1：文本样式基础</title>
  <style>
    /* 全局基础样式 */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: #f9f9f9;
    }

    /* 一级标题 */
    h1 {
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      color: #333;
      letter-spacing: 1px;
      margin-bottom: 30px;
    }

    /* 二级标题 */
    h2 {
      font-size: 24px;
      font-weight: bold;
      color: #007bff;
      margin-top: 30px;
      margin-bottom: 16px;
    }

    /* 段落 */
    p {
      color: #555;
      text-indent: 2em;
      margin-bottom: 16px;
    }

    /* 引用文字 */
    blockquote {
      font-style: italic;
      color: #888;
      border-left: 4px solid #007bff;
      padding-left: 16px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>CSS 文本样式学习</h1>

  <h2>什么是 CSS？</h2>
  <p>CSS 叫做层叠样式表，是用来控制网页外观的技术。通过 CSS，我们可以设置文字的字体、大小、颜色、行高等属性，让网页变得美观易读。</p>

  <blockquote>
    "好的排版是看不见的，它只有在做得不好时才引人注目。"
  </blockquote>

  <h2>为什么要学习文本样式？</h2>
  <p>网页上大部分内容都是文字，好的文本样式能大大提升用户的阅读体验。合理的字号、行高、颜色搭配，能让读者更愿意阅读你的内容。</p>

  <p>学习 CSS 文本样式，是前端开发的基础中的基础。掌握了这些属性，你就能让文字既好看又好读。</p>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一篇文章页面，实现完整的排版效果：

- 页面宽度限制在 700px，水平居中
- 文章标题：大字号、加粗、居中
- 文章元信息（日期、作者）：灰色、小字号、居中
- 正文段落：合理的行高、首行缩进
- 重点文字高亮：黄色背景
- 链接：蓝色、去掉下划线、鼠标悬停下划线
- 代码片段：等宽字体、浅灰背景、圆角
- 适当的间距，整体看起来舒适

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2：文章排版</title>
  <style>
    /* 全局重置 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* 全局基础样式 */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif;
      font-size: 16px;
      line-height: 1.8;
      color: #333;
      background-color: #f8f9fa;
      padding: 40px 20px;
    }

    /* 文章容器 */
    .article {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      padding: 50px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    /* 文章标题 */
    .article-title {
      font-size: 30px;
      font-weight: 700;
      color: #1a1a1a;
      text-align: center;
      line-height: 1.4;
      margin-bottom: 16px;
    }

    /* 文章元信息 */
    .article-meta {
      font-size: 14px;
      color: #999;
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    /* 正文段落 */
    .article-content p {
      color: #444;
      text-indent: 2em;
      margin-bottom: 20px;
    }

    /* 二级标题 */
    .article-content h2 {
      font-size: 22px;
      font-weight: 600;
      color: #222;
      margin-top: 40px;
      margin-bottom: 16px;
    }

    /* 高亮文字 */
    .highlight {
      background-color: #fff3cd;
      padding: 2px 6px;
      border-radius: 3px;
    }

    /* 链接样式 */
    a {
      color: #007bff;
      text-decoration: none;
      transition: color 0.2s;
    }

    a:hover {
      text-decoration: underline;
      color: #0056b3;
    }

    /* 代码样式 */
    code {
      font-family: "Consolas", "Monaco", "Courier New", monospace;
      font-size: 14px;
      background-color: #f5f5f5;
      padding: 2px 8px;
      border-radius: 4px;
      color: #e83e8c;
    }
  </style>
</head>
<body>
  <article class="article">
    <h1 class="article-title">学习 CSS 的正确姿势</h1>
    
    <div class="article-meta">
      作者：张三 · 发布于 2024年1月15日 · 阅读时间 5 分钟
    </div>

    <div class="article-content">
      <p>很多初学者觉得 CSS 很简单，就是调调颜色、改改进去。但其实 CSS 是一门很深的学问，想要真正掌握并不容易。</p>

      <h2>打好基础很重要</h2>

      <p>学习 CSS 首先要打好基础，比如<strong class="highlight">选择器、盒模型、文本样式</strong>这些都是基础中的基础。只有把基础打牢了，后面学布局、动画这些高级内容才会轻松。</p>

      <p>举个例子，很多人学布局的时候搞不清 <code>margin</code> 和 <code>padding</code> 的区别，其实就是盒模型没学好。回去把盒模型搞懂，布局就简单了。</p>

      <h2>多写多练才是王道</h2>

      <p>CSS 是一门实践性很强的技术，光看教程是学不会的，一定要多写多练。看到好看的网页，就试着去模仿它的样式，写多了自然就会了。</p>

      <p>如果你想系统学习 CSS，可以参考 <a href="#">MDN Web Docs</a>，上面有非常详细的教程和文档。</p>

      <p>最后祝大家都能学好 CSS，写出漂亮的网页！</p>
    </div>
  </article>
</body>
</html>
```

</details>

### 练习 3（挑战）：精美卡片排版

创建一个精美设计的内容卡片：

- 卡片有圆角、阴影、白色背景
- 顶部有一个"标签"（如"前端开发"）：小字号、大写、浅色背景
- 卡片标题：大字号、加粗、深色
- 描述文字：灰色、适中行高
- 底部有作者信息：头像（圆形）、名字、日期
- 整体排版精美，间距合理
- 鼠标悬停时卡片有微妙的上浮效果

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3：精美卡片</title>
  <style>
    /* 全局重置 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif;
      background-color: #f0f2f5;
      padding: 60px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    /* 卡片容器 */
    .card {
      width: 400px;
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    /* 鼠标悬停效果 */
    .card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.1);
    }

    /* 标签 */
    .tag {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #667eea;
      background-color: #f0f3ff;
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 20px;
    }

    /* 卡片标题 */
    .card-title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    /* 卡片描述 */
    .card-desc {
      font-size: 15px;
      color: #666;
      line-height: 1.7;
      margin-bottom: 24px;
    }

    /* 分割线 */
    .divider {
      height: 1px;
      background-color: #f0f0f0;
      margin-bottom: 20px;
    }

    /* 作者信息 */
    .author {
      display: flex;
      align-items: center;
    }

    /* 头像 */
    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 16px;
      margin-right: 12px;
    }

    /* 作者信息文字 */
    .author-info {
      flex: 1;
    }

    .author-name {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }

    .author-date {
      font-size: 12px;
      color: #999;
    }

    /* 阅读时间 */
    .read-time {
      font-size: 12px;
      color: #999;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <!-- 标签 -->
    <span class="tag">前端开发</span>

    <!-- 标题 -->
    <h2 class="card-title">2024 年 CSS 新特性一览</h2>

    <!-- 描述 -->
    <p class="card-desc">
      今年 CSS 又新增了很多实用的新特性，比如容器查询、级联层、嵌套语法等，让我们一起来看看这些新特性能带来什么改变。
    </p>

    <!-- 分割线 -->
    <div class="divider"></div>

    <!-- 作者信息 -->
    <div class="author">
      <div class="avatar">李</div>
      <div class="author-info">
        <div class="author-name">李四</div>
        <div class="author-date">2024年1月20日</div>
      </div>
      <div class="read-time">
        <span>📖</span>
        <span>8 分钟</span>
      </div>
    </div>
  </div>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **CSS 颜色与背景**——也就是如何给元素设置漂亮的颜色和背景。你会学到各种颜色表示方法、渐变色、背景图片、背景定位等技巧，掌握了颜色和背景，才能让你的网页丰富多彩。
