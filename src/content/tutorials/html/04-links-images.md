---
title: "第四章：链接与图片"
description: "超链接、锚点、图片插入"
---

# 第四章：链接与图片

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何在网页中添加超链接？`<a>` 标签有哪些属性？
- 链接的 target="_blank" 是什么意思？为什么需要 rel="noopener"？
- 如何在页面内跳转到指定位置？
- 如何正确插入图片？alt 属性为什么很重要？

这一章就是为了解答这些问题。我们会学习如何创建链接和插入图片，让你的网页更加丰富多彩。

---

## 4.1 为什么需要链接和图片？

### 痛点分析

想象一下，如果网页没有链接和图片：

- 所有内容都在一个页面上，无法跳转到其他页面
- 无法引用外部资源和网站
- 页面只有文字，枯燥乏味，缺乏视觉吸引力
- 无法分享图片、产品照片等视觉内容

### 解决方案

链接让网页之间可以相互连接，形成互联网；图片让网页更加生动有趣。

> **一句话总结**：链接是网页的"桥梁"，图片是网页的"装饰画"。

打个比方：

> 链接就像书籍中的目录和参考文献，让你可以跳转到其他章节或外部资料。图片就像书籍中的插图，让内容更加生动直观。

---

## 4.2 核心原理

### 概念解释

**链接**（超链接）：使用 `<a>` 标签创建，通过 `href` 属性指定目标地址。点击链接可以跳转到其他页面或资源。

**图片**：使用 `<img>` 标签插入，通过 `src` 属性指定图片路径。`alt` 属性提供图片的替代文本，当图片无法加载时显示。

浏览器处理链接和图片的过程：

1. 遇到 `<a>` 标签，显示可点击的链接文本
2. 用户点击时，根据 `href` 属性跳转到目标地址
3. 遇到 `<img>` 标签，根据 `src` 属性加载图片
4. 如果图片加载失败，显示 `alt` 属性的文本

### 对比分析

| 元素 | 标签 | 核心属性 | 作用 |
| --- | --- | --- | --- |
| 链接 | `<a>` | `href` | 创建超链接 |
| 图片 | `<img>` | `src`, `alt` | 插入图片 |

---

## 4.3 基础用法

### 超链接

#### 基本链接

```html
<!-- 创建指向外部网站的链接 -->
<a href="https://www.example.com">访问示例网站</a>
```

> **原理**：`<a>` 是 anchor（锚点）的缩写，`href` 是 hypertext reference（超文本引用）的缩写。

#### 链接属性

```html
<!-- 在新窗口打开链接 -->
<a href="https://www.example.com" target="_blank" rel="noopener noreferrer">
  在新窗口打开
</a>

<!-- 下载文件 -->
<a href="document.pdf" download>下载PDF文档</a>
<a href="image.png" download="my-image.png">下载图片</a>

<!-- 邮件链接 -->
<a href="mailto:contact@example.com">发送邮件</a>
<a href="mailto:contact@example.com?subject=咨询&body=您好">发送带主题的邮件</a>

<!-- 电话链接 -->
<a href="tel:+8613800138000">拨打电话</a>

<!-- SMS 短信链接 -->
<a href="sms:+8613800138000&body=您好">发送短信</a>
```

> **安全提示**：使用 `target="_blank"` 时，应该同时添加 `rel="noopener noreferrer"`，防止被打开的页面通过 `window.opener` 访问原页面，造成安全风险。

#### 锚点链接

```html
<!-- 跳转到页面内的某个位置 -->
<a href="#section1">跳转到第一节</a>
<a href="#section2">跳转到第二节</a>
<a href="#footer">跳转到页脚</a>

<!-- 目标位置，使用 id 属性标记 -->
<h2 id="section1">第一节：简介</h2>
<p>这里是第一节的内容...</p>

<h2 id="section2">第二节：详细说明</h2>
<p>这里是第二节的内容...</p>

<footer id="footer">
  <p>页脚内容</p>
</footer>

<!-- 跳转到其他页面的指定位置 -->
<a href="about.html#team">查看团队介绍</a>
```

### 图片

#### 基本图片

```html
<!-- 插入图片，alt 是必需属性 -->
<img src="image.jpg" alt="图片描述">
```

> **原理**：`src` 指定图片路径，`alt` 提供替代文本，用于图片无法加载时显示，同时也有利于屏幕阅读器和 SEO。

#### 图片属性

```html
<!-- 设置图片尺寸 -->
<img 
  src="image.jpg" 
  alt="图片描述" 
  width="300" 
  height="200"
>

<!-- 添加鼠标悬停提示 -->
<img 
  src="logo.png" 
  alt="网站Logo" 
  title="点击返回首页"
>

<!-- 响应式图片（最大宽度不超过容器） -->
<img 
  src="image.jpg" 
  alt="响应式图片" 
  style="max-width: 100%; height: auto;"
>
```

#### 响应式图片（使用 picture 元素）

```html
<!-- 根据屏幕尺寸加载不同大小的图片 -->
<picture>
  <!-- 大屏幕：800px 以上 -->
  <source media="(min-width: 800px)" srcset="large.jpg">
  <!-- 中等屏幕：400px 以上 -->
  <source media="(min-width: 400px)" srcset="medium.jpg">
  <!-- 默认：小屏幕 -->
  <img src="small.jpg" alt="响应式图片">
</picture>

<!-- 根据设备像素比加载不同分辨率的图片 -->
<img 
  src="image.jpg" 
  srcset="image-2x.jpg 2x, image-3x.jpg 3x" 
  alt="高清图片"
>
```

### 图片作为链接

```html
<!-- 将图片作为可点击的链接 -->
<a href="https://www.example.com">
  <img src="logo.png" alt="网站Logo">
</a>

<!-- 添加图片说明 -->
<a href="https://www.example.com">
  <img src="product.jpg" alt="产品图片">
</a>
<p>点击图片查看详情</p>
```

---

## 4.4 核心知识点总结

| 标签 | 属性 | 说明 |
| --- | --- | --- |
| `<a>` | `href` | 目标地址 |
| `<a>` | `target="_blank"` | 在新窗口打开 |
| `<a>` | `rel="noopener"` | 安全属性 |
| `<a>` | `download` | 下载文件 |
| `<a>` | `href="#id"` | 页面内锚点 |
| `<img>` | `src` | 图片路径 |
| `<img>` | `alt` | 替代文本（必需） |
| `<img>` | `width/height` | 图片尺寸 |
| `<img>` | `title` | 悬停提示 |
| `<picture>` | - | 响应式图片容器 |
| `<source>` | `media` | 媒体查询条件 |
| `<source>` | `srcset` | 图片源 |

---

## 4.5 新手常见误区

### 误区 1："忘记添加 alt 属性"

**错！** `alt` 属性是必需的，它在图片无法加载时显示替代文本，同时帮助屏幕阅读器和搜索引擎理解图片内容。

**错误写法 ❌**：
```html
<img src="image.jpg">  <!-- 没有 alt 属性 -->
```

**正确写法 ✅**：
```html
<img src="image.jpg" alt="图片描述">
```

### 误区 2："用 `<img>` 做装饰性图片时不加 alt"

不是的。装饰性图片应该使用空的 `alt=""`，而不是省略。

**错误写法 ❌**：
```html
<img src="decoration.png">  <!-- 省略了 alt -->
```

**正确写法 ✅**：
```html
<img src="decoration.png" alt="">  <!-- 空 alt 表示装饰性图片 -->
```

### 误区 3："target="_blank" 不需要 rel 属性"

**错！** 使用 `target="_blank"` 打开新窗口时，如果不添加 `rel="noopener"`，被打开的页面可以通过 `window.opener` 访问原页面，存在安全风险。

**错误写法 ❌**：
```html
<a href="https://example.com" target="_blank">链接</a>
```

**正确写法 ✅**：
```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">链接</a>
```

### 误区 4："图片尺寸用 CSS 控制就够了"

不是的。虽然 CSS 可以控制显示尺寸，但 HTML 的 `width` 和 `height` 属性可以帮助浏览器预留空间，避免页面布局抖动。

**错误写法 ❌**：
```html
<img src="image.jpg" alt="图片">  <!-- 没有设置尺寸 -->
```

**正确写法 ✅**：
```html
<img src="image.jpg" alt="图片" width="300" height="200">
```

### 误区 5："图片路径写错了也没关系"

**错！** 如果图片路径错误，图片无法显示，只会显示 alt 文本或破损图片图标。

**错误写法 ❌**：
```html
<img src="images/photo.jpg" alt="照片">  <!-- 路径可能不存在 -->
```

**正确写法 ✅**：
```html
<!-- 使用相对路径 -->
<img src="../images/photo.jpg" alt="照片">

<!-- 使用绝对路径 -->
<img src="/images/photo.jpg" alt="照片">

<!-- 使用完整 URL -->
<img src="https://example.com/images/photo.jpg" alt="照片">
```

---

## 4.6 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，包含：
- 页面标题"我的链接练习"
- 一个指向百度的链接
- 一个指向 Google 的链接，在新窗口打开
- 插入一张图片（可以使用占位图片 URL）

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>我的链接练习</title>
</head>
<body>
  <h1>链接与图片练习</h1>
  
  <p><a href="https://www.baidu.com">访问百度</a></p>
  
  <p><a href="https://www.google.com" target="_blank" rel="noopener noreferrer">
    在新窗口打开 Google
  </a></p>
  
  <img src="https://picsum.photos/400/200" alt="占位图片">
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个 HTML 页面，包含：
- 页面标题"个人作品集"
- 导航链接（首页、作品、关于我、联系）
- 页面内锚点跳转
- 多张图片展示
- 邮件链接和电话链接

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>个人作品集</title>
</head>
<body>
  <nav>
    <a href="#home">首页</a> | 
    <a href="#works">作品</a> | 
    <a href="#about">关于我</a> | 
    <a href="#contact">联系</a>
  </nav>
  
  <section id="home">
    <h1>欢迎来到我的作品集</h1>
    <p>这里展示了我的一些作品。</p>
  </section>
  
  <section id="works">
    <h2>我的作品</h2>
    <img src="https://picsum.photos/300/200" alt="作品1">
    <img src="https://picsum.photos/300/200" alt="作品2">
    <img src="https://picsum.photos/300/200" alt="作品3">
  </section>
  
  <section id="about">
    <h2>关于我</h2>
    <p>我是一名前端开发者，热爱设计和编程。</p>
  </section>
  
  <section id="contact">
    <h2>联系我</h2>
    <p><a href="mailto:hello@example.com">发送邮件</a></p>
    <p><a href="tel:+8613800138000">拨打电话</a></p>
  </section>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

创建一个 HTML 页面，模拟一个图片画廊页面，包含：
- 页面标题"风景画廊"
- 页面内导航（自然风光、城市建筑、人物肖像）
- 每个分类下有多张图片
- 图片可以点击放大（链接到原图）
- 使用响应式图片技巧

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>风景画廊</title>
  <style>
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>风景画廊</h1>
  
  <nav>
    <a href="#nature">自然风光</a> | 
    <a href="#city">城市建筑</a> | 
    <a href="#people">人物肖像</a>
  </nav>
  
  <section id="nature">
    <h2>自然风光</h2>
    <a href="https://picsum.photos/800/600?random=1" target="_blank">
      <img src="https://picsum.photos/400/300?random=1" alt="自然风光1" width="400" height="300">
    </a>
    <a href="https://picsum.photos/800/600?random=2" target="_blank">
      <img src="https://picsum.photos/400/300?random=2" alt="自然风光2" width="400" height="300">
    </a>
  </section>
  
  <section id="city">
    <h2>城市建筑</h2>
    <a href="https://picsum.photos/800/600?random=3" target="_blank">
      <img src="https://picsum.photos/400/300?random=3" alt="城市建筑1" width="400" height="300">
    </a>
    <a href="https://picsum.photos/800/600?random=4" target="_blank">
      <img src="https://picsum.photos/400/300?random=4" alt="城市建筑2" width="400" height="300">
    </a>
  </section>
  
  <section id="people">
    <h2>人物肖像</h2>
    <a href="https://picsum.photos/800/600?random=5" target="_blank">
      <img src="https://picsum.photos/400/300?random=5" alt="人物肖像1" width="400" height="300">
    </a>
    <a href="https://picsum.photos/800/600?random=6" target="_blank">
      <img src="https://picsum.photos/400/300?random=6" alt="人物肖像2" width="400" height="300">
    </a>
  </section>
  
  <p>点击图片查看大图</p>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **列表**——也就是如何用 HTML 组织一系列相关的内容。你会学到无序列表、有序列表和定义列表，让你的内容更加有条理。