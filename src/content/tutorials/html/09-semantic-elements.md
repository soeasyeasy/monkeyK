---
title: "第九章：语义化标签"
description: "header、nav、main、article、section、footer"
---

# 第九章：语义化标签

## 什么是语义化

语义化是使用合适的 HTML 标签来表达内容的含义，而不是仅仅关注外观。

## 语义化的好处

- 提高代码可读性
- 有利于 SEO
- 提高可访问性
- 便于团队协作

## 常用语义化标签

### 页面结构

```html
<body>
  <header>
    <h1>网站标题</h1>
    <nav>
      <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/about">关于</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <article>
      <h2>文章标题</h2>
      <section>
        <h3>章节标题</h3>
        <p>内容...</p>
      </section>
    </article>
    
    <aside>
      <h3>侧边栏</h3>
      <p>相关内容...</p>
    </aside>
  </main>
  
  <footer>
    <p>版权信息</p>
  </footer>
</body>
```

### header

```html
<header>
  <h1>页面标题</h1>
  <p>副标题</p>
</header>
```

### nav

```html
<nav>
  <ul>
    <li><a href="/">首页</a></li>
    <li><a href="/products">产品</a></li>
    <li><a href="/contact">联系</a></li>
  </ul>
</nav>
```

### main

```html
<main>
  <h1>主要内容</h1>
  <p>页面的核心内容...</p>
</main>
```

### article

```html
<article>
  <h2>独立的文章</h2>
  <p>文章内容...</p>
  <footer>
    <p>作者：张三</p>
  </footer>
</article>
```

### section

```html
<section>
  <h2>章节标题</h2>
  <p>章节内容...</p>
</section>
```

### aside

```html
<aside>
  <h3>相关内容</h3>
  <p>侧边栏内容...</p>
</aside>
```

### footer

```html
<footer>
  <p>版权 2024</p>
  <nav>
    <a href="/privacy">隐私政策</a>
    <a href="/terms">使用条款</a>
  </nav>
</footer>
```

### figure 和 figcaption

```html
<figure>
  <img src="chart.png" alt="图表">
  <figcaption>图 1：销售数据</figcaption>
</figure>
```

### time

```html
<time datetime="2024-01-01">2024年1月1日</time>
<time datetime="2024-01-01T10:00">上午10点</time>
```

### address

```html
<address>
  联系地址：北京市朝阳区<br>
  电话：010-12345678
</address>
```

## 对比：非语义化 vs 语义化

```html
<!-- 非语义化 -->
<div class="header">
  <div class="nav">...</div>
</div>

<!-- 语义化 -->
<header>
  <nav>...</nav>
</header>
```

## 总结

使用语义化标签可以让代码更清晰，有利于 SEO 和可访问性。
