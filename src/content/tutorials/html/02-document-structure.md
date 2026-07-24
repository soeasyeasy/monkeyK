---
title: "第二章：文档结构"
description: "DOCTYPE、html、head、body"
---

# 第二章：文档结构

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 一个完整的 HTML 页面应该包含哪些部分？
- DOCTYPE 是什么？为什么必须写在最前面？
- head 和 body 分别放什么内容？
- lang 属性和 charset 属性有什么用？

这一章就是为了解答这些问题。我们会深入了解 HTML 文档的基本结构，学会正确组织一个网页。

---

## 2.1 为什么需要规范的文档结构？

### 痛点分析

想象一下，如果每个网页的结构都不一样：

- 有的网页没有 DOCTYPE 声明，浏览器不知道用什么标准解析
- 有的网页把标题写在 body 外面，导致标题不显示
- 有的网页没有设置字符编码，中文变成乱码
- 搜索引擎无法正确理解页面结构，影响排名

### 解决方案

HTML 定义了一套标准的文档结构，就像写信一样有固定格式：

> **一句话总结**：规范的文档结构让浏览器、搜索引擎、屏幕阅读器都能正确理解你的页面。

打个比方：

> HTML 文档结构就像一封信的格式：信封（DOCTYPE）+ 信纸（html）+ 信封上的地址（head）+ 信的内容（body）。缺少任何一部分，这封信就不完整。

---

## 2.2 核心原理

### 概念解释

一个标准的 HTML5 文档由四个核心部分组成：

1. **DOCTYPE**：告诉浏览器这是一个 HTML5 文档
2. **html**：根元素，包含整个文档的内容
3. **head**：头部区域，存放页面的元数据（配置信息）
4. **body**：主体区域，存放页面的可见内容

浏览器解析 HTML 的过程：

1. 看到 `<!DOCTYPE html>`，知道用 HTML5 标准解析
2. 看到 `<html>`，开始解析根元素
3. 看到 `<head>`，读取配置信息（标题、编码等）
4. 看到 `<body>`，开始渲染可见内容

### 对比分析

| 组成部分 | 作用 | 是否可见 |
| --- | --- | --- |
| DOCTYPE | 声明文档类型 | 不可见 |
| html | 根容器，包含所有内容 | 不可见（是容器） |
| head | 存放元数据和配置 | 不可见 |
| body | 存放页面内容 | 可见 |

---

## 2.3 基础用法

### 完整的 HTML5 文档结构

```html
<!-- 声明文档类型为 HTML5，必须放在最前面 -->
<!DOCTYPE html>

<!-- 根元素，lang 属性指定页面语言为中文 -->
<html lang="zh-CN">

<!-- 头部区域，存放页面的配置信息 -->
<head>
  <!-- 设置字符编码为 UTF-8，支持中文显示 -->
  <meta charset="UTF-8">
  
  <!-- 视口设置，让页面在移动端正确显示 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- 页面标题，显示在浏览器标签上 -->
  <title>页面标题</title>
  
  <!-- 引入外部 CSS 样式文件 -->
  <link rel="stylesheet" href="style.css">
  
  <!-- 引入外部 JavaScript 文件 -->
  <script src="script.js"></script>
</head>

<!-- 主体区域，存放页面的所有可见内容 -->
<body>
  <!-- 这里写页面内容 -->
  <h1>这是页面标题</h1>
  <p>这是页面内容。</p>
</body>

</html>
```

> **原理**：浏览器从上到下依次解析，先读取 head 中的配置，再渲染 body 中的内容。

### 各部分详细说明

#### DOCTYPE 声明

```html
<!DOCTYPE html>
```

- **作用**：告诉浏览器使用 HTML5 标准解析页面
- **位置**：必须放在文档最开头，在 `<html>` 标签之前
- **注意**：没有结束标签，这是一个声明，不是标签

#### html 根元素

```html
<html lang="zh-CN">
```

- **作用**：作为整个 HTML 文档的根容器
- **lang 属性**：指定页面的语言
  - `zh-CN`：中文（中国）
  - `en`：英文
  - 有利于搜索引擎和屏幕阅读器识别语言

#### head 头部

```html
<head>
  <!-- 字符编码 -->
  <meta charset="UTF-8">
  
  <!-- 视口设置（移动端适配） -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- 页面标题 -->
  <title>我的网页</title>
  
  <!-- 引入 CSS -->
  <link rel="stylesheet" href="style.css">
  
  <!-- 引入 JavaScript -->
  <script src="script.js"></script>
</head>
```

**head 中常见的标签**：

| 标签 | 作用 |
| --- | --- |
| `<meta>` | 定义元数据（字符编码、视口、描述等） |
| `<title>` | 定义页面标题 |
| `<link>` | 引入外部资源（CSS、图标等） |
| `<script>` | 引入或定义 JavaScript |
| `<style>` | 定义内部 CSS 样式 |

#### body 主体

```html
<body>
  <h1>欢迎来到我的网站</h1>
  <p>这是页面的主要内容。</p>
</body>
```

- **作用**：存放页面所有可见的内容
- **包含**：文本、图片、链接、表格、表单、视频等

---

## 2.4 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| `<!DOCTYPE html>` | HTML5 文档类型声明，必须放在最前面 |
| `<html>` | 根元素，包含整个文档 |
| `lang="zh-CN"` | 指定页面语言为中文 |
| `<head>` | 头部，存放元数据（不可见） |
| `<meta charset="UTF-8">` | 设置字符编码，支持中文 |
| `<meta name="viewport">` | 视口设置，移动端适配 |
| `<title>` | 页面标题，显示在浏览器标签 |
| `<body>` | 主体，存放可见内容 |

---

## 2.5 新手常见误区

### 误区 1："DOCTYPE 可以省略"

**错！** 虽然现代浏览器会自动识别 HTML5，但省略 DOCTYPE 会触发"怪异模式"（Quirks Mode），导致页面在不同浏览器显示不一致。

正确做法：始终在文档开头添加 `<!DOCTYPE html>`。

### 误区 2："head 中的内容会显示在页面上"

不是的。head 中的内容是给浏览器和搜索引擎看的元数据，不会直接显示在页面上。

**错误写法 ❌**：
```html
<head>
  <h1>页面标题</h1>  <!-- 不会显示！ -->
</head>
```

**正确写法 ✅**：
```html
<head>
  <title>页面标题</title>  <!-- 显示在浏览器标签上 -->
</head>
<body>
  <h1>页面标题</h1>  <!-- 显示在页面上 -->
</body>
```

### 误区 3："charset 可以随便设置"

**错！** 如果字符编码设置不正确，中文会变成乱码。

**错误写法 ❌**：
```html
<meta charset="GBK">  <!-- 可能导致乱码 -->
```

**正确写法 ✅**：
```html
<meta charset="UTF-8">  <!-- 推荐，支持所有语言 -->
```

### 误区 4："不需要设置 lang 属性"

不是的。lang 属性对搜索引擎优化（SEO）和屏幕阅读器非常重要。

**错误写法 ❌**：
```html
<html>  <!-- 没有指定语言 -->
```

**正确写法 ✅**：
```html
<html lang="zh-CN">  <!-- 指定中文 -->
```

### 误区 5："HTML 标签大小写敏感"

不是的。HTML 标签不区分大小写，但推荐使用小写。

```html
<!-- 这两种写法都能正常工作 -->
<H1>标题</H1>
<h1>标题</h1>

<!-- 推荐使用小写 -->
<h1>标题</h1>
```

---

## 2.6 动手练习

### 练习 1：基础练习

创建一个完整的 HTML5 文档，包含：
- DOCTYPE 声明
- html 根元素（设置 lang="zh-CN"）
- head 中设置字符编码和页面标题"我的第一个页面"
- body 中包含一个一级标题和一个段落

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>我的第一个页面</title>
</head>
<body>
  <h1>欢迎来到我的网页</h1>
  <p>这是一个完整的 HTML5 文档。</p>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个 HTML5 文档，包含：
- 完整的文档结构
- 视口设置（移动端适配）
- 页面标题"个人介绍"
- body 中包含多个标题和段落，介绍你自己

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>个人介绍</title>
</head>
<body>
  <h1>关于我</h1>
  
  <h2>基本信息</h2>
  <p>我是一名前端开发者，热爱编程。</p>
  
  <h2>技术栈</h2>
  <p>我熟悉 HTML、CSS、JavaScript 和 Vue.js。</p>
  
  <h2>兴趣爱好</h2>
  <p>工作之余，我喜欢阅读和户外运动。</p>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

创建一个 HTML5 文档，模拟一个简单的新闻页面，包含：
- 完整的文档结构（DOCTYPE、html、head、body）
- 设置字符编码和视口
- 页面标题"科技新闻"
- 页面内容包含：新闻标题、发布时间、新闻正文、相关新闻链接

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>科技新闻</title>
</head>
<body>
  <h1>HTML5 发布十周年，重新定义网页标准</h1>
  
  <p>发布时间：2024年1月1日</p>
  
  <p>HTML5 于 2014 年正式发布，十年间已经成为网页开发的标准。</p>
  <p>它引入了语义化标签、原生多媒体支持、本地存储等重要特性。</p>
  <p>如今，几乎所有现代网站都在使用 HTML5 技术。</p>
  
  <h2>相关新闻</h2>
  <p>• CSS3 动画教程</p>
  <p>• JavaScript 最新特性</p>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **文本标签**——也就是如何用 HTML 组织和格式化文本内容。你会学到标题、段落、强调、引用等常用标签，让你的文字内容更有层次。