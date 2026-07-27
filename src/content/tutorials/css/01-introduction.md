---
title: "第一章：CSS 简介"
description: "什么是 CSS，样式表基础概念"
---

# 第一章：CSS 简介

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 CSS？它和 HTML 有什么关系？
- 为什么学习前端一定要学 CSS？只写 HTML 不行吗？
- CSS 有哪几种引入方式？平时开发用哪种最好？
- CSS 的基本语法长什么样？难不难学？

这一章就是为了解答这些问题。我们会先搞清楚 **CSS 的本质**，再动手写第一个样式页面。

---

## 1 为什么需要 CSS？

### 痛点分析

想象一下，如果只有 HTML 没有 CSS，网页会是什么样子？

- 就像一个人只有骨架没有皮肤和衣服，所有元素都是默认的黑白样式
- 所有文字都是一样的字体大小，标题和正文区分不开
- 元素都是从上到下堆在一起，没法做出漂亮的布局
- 想改个颜色，得给每个标签都加 style 属性，改起来非常麻烦
- 网站没有视觉层次，用户看着累，也记不住你的品牌

打个比方：

> HTML 就像是房子的骨架和砖块，CSS 就像是装修和家具。只有骨架的房子没法住人，有了 CSS 的"装修"，网页才能变得美观、舒适、有个性。

### 解决方案

CSS（Cascading Style Sheets，层叠样式表）就是用来给网页"化妆"的技术。它让你可以：

- 统一控制整个网站的颜色、字体、间距
- 轻松创建各种复杂的布局
- 做出动画和交互效果，提升用户体验
- 一套样式复用在多个页面，维护起来超简单

> **一句话总结**：CSS 是网页的"美容师"和"造型师"，负责网页的外观和布局。

---

## 2 CSS 核心原理

### 概念解释

CSS 的核心思想是**分离**：把内容（HTML）和样式（CSS）分开。

- **HTML**：负责"有什么"——定义内容结构和语义
- **CSS**：负责"长什么样"——定义外观和布局

为什么要分离？好处太多了：

1. **复用性高**：一份样式表可以用在成百上千个页面上
2. **维护方便**：改一个颜色，全站都变，不用一个个页面改
3. **加载更快**：浏览器可以缓存 CSS 文件，打开新页面不用重复下载
4. **分工协作**：设计师写样式，工程师写结构，互不干扰

### 对比分析

| 特性 | 只有 HTML | HTML + CSS |
| --- | --- | --- |
| 外观 | 浏览器默认样式，很丑 | 可以自定义，想怎么美就怎么美 |
| 布局 | 只能从上到下堆 | 可以做横向布局、网格布局、各种复杂布局 |
| 维护成本 | 改样式要改每个标签，累死 | 改一处，全站生效，轻松 |
| 用户体验 | 枯燥乏味，没人愿意看 | 美观舒适，用户愿意停留 |
| 品牌形象 | 没有辨识度 | 可以打造独特的品牌视觉 |

---

## 3 CSS 的三种引入方式

CSS 有三种引入方式，各有各的使用场景。

### 方式一：行内样式

直接在 HTML 标签的 `style` 属性里写样式。

```html
<!-- 给段落设置蓝色文字和16px字号 -->
<p style="color: blue; font-size: 16px;">这是一段蓝色文字</p>
```

**优点**：优先级最高，写起来最快
**缺点**：不能复用，维护困难，代码又脏又乱

> ❌ **不推荐日常使用**：除非是临时测试或者非常特殊的情况，否则不要用行内样式。

### 方式二：内部样式表

把 CSS 写在 HTML 的 `<style>` 标签里，放在 `<head>` 中。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <!-- 字符编码设置 -->
  <meta charset="UTF-8">
  <!-- 页面标题 -->
  <title>内部样式表示例</title>
  <!-- 样式表区域 -->
  <style>
    /* 选择所有 p 标签 */
    p {
      color: blue;        /* 文字颜色设为蓝色 */
      font-size: 16px;    /* 字号设为16像素 */
    }
  </style>
</head>
<body>
  <!-- 这个 p 标签会自动应用上面的样式 -->
  <p>这是一段蓝色文字</p>
</body>
</html>
```

**优点**：样式和结构分离，单页面内可以复用
**缺点**：只能在当前页面用，不能跨页面复用

> ⚠️ **适用场景**：单页 Demo、临时测试页面

### 方式三：外部样式表（✅ 推荐）

把 CSS 写在独立的 `.css` 文件里，用 `<link>` 标签引入。

**HTML 文件：**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>外部样式表示例</title>
  <!-- 引入外部 CSS 文件 -->
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <p>这是一段蓝色文字</p>
</body>
</html>
```

**styles.css 文件：**
```css
/* 所有 p 标签的样式 */
p {
  color: blue;        /* 蓝色文字 */
  font-size: 16px;    /* 16像素字号 */
}
```

**优点**：
- 可以跨页面复用，一个网站共用一套样式
- 维护方便，改一个文件全站生效
- 浏览器可以缓存，打开新页面更快
- HTML 和 CSS 完全分离，代码更清晰

**缺点**：需要多一次 HTTP 请求（但可以被缓存抵消）

> ✅ **强烈推荐**：实际项目中一定要用外部样式表！

### 三种方式对比表

| 方式 | 复用性 | 维护性 | 使用场景 | 推荐度 |
| --- | --- | --- | --- | --- |
| 行内样式 | 不能复用 | 极差 | 临时测试、特殊情况 | ⭐ |
| 内部样式表 | 当前页面复用 | 一般 | 单页 Demo | ⭐⭐ |
| 外部样式表 | 全站复用 | 极好 | 正式项目 | ⭐⭐⭐⭐⭐ |

---

## 4 CSS 基本语法

### 语法规则

CSS 的语法非常简单，由两部分组成：**选择器** + **声明块**。

```css
/* 选择器 { 属性: 值; } */
p {
  color: blue;
  font-size: 16px;
}
```

逐行解释：

```css
/* 这是选择器：告诉浏览器"给谁"加样式 */
/* 这里的 p 表示"选择所有 p 标签" */
p {
  /* 这是一条声明：告诉浏览器"加什么样式" */
  /* 属性: 值; 属性就像是设置项，值就是具体设置 */
  color: blue;       /* color 是属性，blue 是值——把文字颜色设为蓝色 */
  font-size: 16px;   /* font-size 是属性，16px 是值——把字号设为16像素 */
}
```

### 组成部分说明

| 部分 | 作用 | 比喻 |
| --- | --- | --- |
| 选择器 | 选中要加样式的元素 | 点名："张三、李四，你们过来" |
| 属性 | 要修改什么样式 | 项目："身高、体重、服装" |
| 值 | 属性的具体设置 | 具体值："身高180cm，穿蓝色衣服" |
| 声明 | 属性 + 值的组合 | 一条指令："穿蓝色衣服" |

### CSS 注释

写注释是好习惯，方便自己和别人看懂代码。

```css
/* 这是单行注释 */

/* 
  这是多行注释
  可以写很多行
  用来解释复杂的样式逻辑
*/

p {
  color: blue; /* 也可以写在代码行后面 */
}
```

> 💡 **小提示**：注释不会被浏览器解析，只给人看的。多写注释不吃亏！

---

## 5 第一个完整的 CSS 示例

让我们来写一个完整的页面，感受一下 CSS 的魔力。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>第一个 CSS 示例</title>
  <style>
    /* 给整个页面设置基础样式 */
    body {
      font-family: Arial, sans-serif;  /* 字体：Arial，没有就用系统无衬线字体 */
      margin: 0;                       /* 清除默认外边距 */
      padding: 20px;                   /* 内边距20像素 */
      background-color: #f5f5f5;       /* 背景色：浅灰色 */
    }

    /* 一级标题样式 */
    h1 {
      color: #333;             /* 深灰色文字，比纯黑更柔和 */
      text-align: center;      /* 文字居中 */
    }

    /* 卡片组件样式 */
    .card {
      background: white;            /* 白色背景 */
      padding: 20px;                /* 内边距20px */
      border-radius: 8px;           /* 圆角8px，看起来更圆润 */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);  /* 淡淡的阴影，有悬浮感 */
      max-width: 600px;             /* 最大宽度600px */
      margin: 20px auto;            /* 上下20px，左右自动（水平居中） */
    }

    /* 卡片里的段落 */
    .card p {
      color: #666;             /* 中灰色文字 */
      line-height: 1.6;        /* 行高1.6倍，读起来更舒服 */
    }

    /* 按钮样式 */
    .btn {
      display: inline-block;      /* 行内块级，可以设置宽高 */
      padding: 10px 20px;         /* 上下10px，左右20px内边距 */
      background-color: #007bff;  /* 蓝色背景 */
      color: white;               /* 白色文字 */
      text-decoration: none;      /* 去掉下划线 */
      border-radius: 4px;         /* 圆角4px */
      transition: background-color 0.3s;  /* 背景色变化时有0.3秒过渡动画 */
    }

    /* 鼠标悬停时的按钮样式 */
    .btn:hover {
      background-color: #0056b3;  /* 深蓝色，鼠标移上去变深 */
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

> **原理**：浏览器加载页面时，先解析 HTML 构建结构，再应用 CSS 样式，最后渲染出漂亮的页面。CSS 就像是给 HTML 元素"穿衣服"，让它们变得好看。

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| CSS | 层叠样式表，控制网页外观和布局 |
| 选择器 | 指定要加样式的元素 |
| 声明块 | 花括号包裹的多条声明 |
| 声明 | 属性 + 值，以分号结尾 |
| 行内样式 | 写在 style 属性里，不推荐 |
| 内部样式表 | 写在 style 标签里，单页用 |
| 外部样式表 | 写在 .css 文件里，✅ 推荐 |
| 注释 | `/* 注释内容 */`，给人看的 |

---

## 7 新手常见误区

### 误区 1："CSS 就是随便调调颜色，很简单"

**错！** CSS 可不只是调颜色。CSS 涉及布局、动画、响应式设计、性能优化等很多方面，想学好 CSS 并不容易。很多前端工程师工作好几年，CSS 还没完全搞明白。

正确做法：认真对待 CSS，它是前端三大核心技术之一，非常重要。

### 误区 2："样式怎么写都行，能跑就行"

不是的。糟糕的 CSS 代码会导致：

- 样式冲突，改一个地方崩十个地方
- 页面性能差，加载慢、卡顿
- 不同浏览器显示不一样
- 后期维护成本极高

正确做法：遵循最佳实践，写规范、可维护的 CSS 代码。

### 误区 3："所有样式都用行内样式写最方便"

**大错特错！** 行内样式虽然写起来快，但：

- 不能复用，每个元素都要写一遍
- 优先级太高，后期想覆盖都覆盖不了
- HTML 和 CSS 混在一起，代码又脏又乱
- 维护起来就是噩梦

正确做法：优先用外部样式表，用类选择器来控制样式。

### 误区 4："CSS 不需要注释，看得懂"

**错！** 你现在写的代码，三个月后再看，可能自己都忘了当时为什么这么写。更别说团队协作了，别人怎么知道你的思路？

正确做法：复杂的样式逻辑一定要写注释，说明"为什么这样写"。

---

## 8 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，使用内部样式表实现：

- 页面背景色设为浅黄色（`lightyellow`）
- 一级标题设为红色，居中对齐
- 段落文字设为深灰色，字号 18px

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1</title>
  <style>
    body {
      background-color: lightyellow;
    }
    
    h1 {
      color: red;
      text-align: center;
    }
    
    p {
      color: #333;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <h1>欢迎学习 CSS</h1>
  <p>这是我的第一个 CSS 练习页面。</p>
  <p>CSS 真有趣！</p>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个 HTML 页面和一个 CSS 文件（外部样式表），实现一个简单的个人介绍卡片：

- 卡片有白色背景、圆角、阴影
- 卡片内有姓名（标题）、职业、简介（段落）
- 有一个"关注"按钮，鼠标悬停时变色
- 整体水平居中

<details>
<summary>点击查看答案</summary>

**index.html：**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>个人介绍卡片</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="profile-card">
    <h2>张三</h2>
    <p class="job">前端工程师</p>
    <p class="intro">热爱编程，喜欢分享技术。专注于 Web 前端开发，擅长 Vue、React 等框架。</p>
    <button class="follow-btn">关注</button>
  </div>
</body>
</html>
```

**style.css：**
```css
body {
  margin: 0;
  padding: 40px;
  background-color: #f0f0f0;
  font-family: Arial, sans-serif;
}

.profile-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

.profile-card h2 {
  color: #333;
  margin: 0 0 8px 0;
}

.profile-card .job {
  color: #007bff;
  font-size: 16px;
  margin: 0 0 16px 0;
}

.profile-card .intro {
  color: #666;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.follow-btn {
  padding: 10px 30px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.follow-btn:hover {
  background-color: #0056b3;
}
```

</details>

### 练习 3（挑战）：综合练习

创建一个简单的文章页面，包含以下元素：

- 页面顶部导航栏（深色背景，白色文字）
- 文章标题和发布日期
- 文章正文（至少3段）
- 文章底部的"点赞"和"分享"按钮
- 使用外部样式表，合理组织代码
- 适当使用注释说明

<details>
<summary>点击查看答案</summary>

**index.html：**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>我的第一篇博客</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- 顶部导航栏 -->
  <nav class="navbar">
    <div class="nav-container">
      <span class="logo">我的博客</span>
      <div class="nav-links">
        <a href="#">首页</a>
        <a href="#">归档</a>
        <a href="#">关于</a>
      </div>
    </div>
  </nav>

  <!-- 文章主体 -->
  <main class="article-container">
    <article class="article">
      <!-- 文章标题区 -->
      <header class="article-header">
        <h1>学习 CSS 的第一天</h1>
        <p class="article-meta">发布于 2024年1月1日 · 阅读时间 5 分钟</p>
      </header>

      <!-- 文章内容 -->
      <div class="article-content">
        <p>今天是我学习 CSS 的第一天，感觉收获很大！以前我以为 CSS 就是调调颜色，没想到里面有这么多学问。</p>
        
        <p>CSS 叫做层叠样式表，是用来控制网页外观的技术。有了 CSS，我们可以让网页变得漂亮，可以做出各种复杂的布局，还能添加动画效果。</p>
        
        <p>我学会了三种引入 CSS 的方式：行内样式、内部样式表和外部样式表。其中外部样式表是最推荐的，因为它可以复用，维护起来也方便。</p>
        
        <p>CSS 的基本语法很简单，就是"选择器 { 属性: 值; }"。选择器用来选中元素，属性和值用来设置样式。虽然语法简单，但要学好 CSS 还需要很多练习。</p>
        
        <p>接下来我会继续学习 CSS 选择器、盒模型、布局等知识，争取早日成为 CSS 高手！</p>
      </div>

      <!-- 文章底部操作区 -->
      <footer class="article-footer">
        <button class="btn-like">👍 点赞</button>
        <button class="btn-share">📤 分享</button>
      </footer>
    </article>
  </main>
</body>
</html>
```

**style.css：**
```css
/* ===== 全局重置 ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f8f9fa;
  color: #333;
  line-height: 1.6;
}

/* ===== 导航栏样式 ===== */
.navbar {
  background-color: #333;
  color: white;
  padding: 16px 0;
}

.nav-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.nav-links a {
  color: white;
  text-decoration: none;
  margin-left: 24px;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #007bff;
}

/* ===== 文章容器 ===== */
.article-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

.article {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* ===== 文章头部 ===== */
.article-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.article-header h1 {
  font-size: 32px;
  color: #1a1a1a;
  margin-bottom: 12px;
  line-height: 1.3;
}

.article-meta {
  color: #999;
  font-size: 14px;
}

/* ===== 文章内容 ===== */
.article-content p {
  margin-bottom: 20px;
  color: #444;
  font-size: 16px;
}

/* ===== 文章底部 ===== */
.article-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
}

.btn-like,
.btn-share {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-like:hover {
  background-color: #fff0f0;
  border-color: #ff6b6b;
}

.btn-share:hover {
  background-color: #f0f7ff;
  border-color: #007bff;
}
```

</details>

---

## 下一章预告

下一章我们会学习 **CSS 选择器**——也就是如何精确地选中你想要加样式的元素。你会学到各种选择器的用法，掌握了选择器，才能让 CSS 样式指哪打哪。
