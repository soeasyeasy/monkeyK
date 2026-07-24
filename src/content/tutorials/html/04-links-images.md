---
title: "第四章：链接与图片"
description: "超链接、锚点、图片插入"
---

# 第四章：链接与图片

## 超链接

### 基本链接

```html
<a href="https://example.com">访问示例网站</a>
```

### 链接属性

```html
<!-- 新窗口打开 -->
<a href="https://example.com" target="_blank">新窗口打开</a>

<!-- 下载链接 -->
<a href="file.pdf" download>下载文件</a>

<!-- 邮件链接 -->
<a href="mailto:test@example.com">发送邮件</a>

<!-- 电话链接 -->
<a href="tel:+8613800138000">拨打电话</a>
```

### 锚点链接

```html
<!-- 跳转到页面内位置 -->
<a href="#section1">跳转到第一节</a>

<h2 id="section1">第一节</h2>
```

## 图片

### 基本图片

```html
<img src="image.jpg" alt="图片描述">
```

### 图片属性

```html
<img 
  src="image.jpg" 
  alt="图片描述" 
  width="300" 
  height="200"
  title="鼠标悬停提示"
>
```

### 响应式图片

```html
<picture>
  <source media="(min-width: 800px)" srcset="large.jpg">
  <source media="(min-width: 400px)" srcset="medium.jpg">
  <img src="small.jpg" alt="响应式图片">
</picture>
```

## 图片作为链接

```html
<a href="https://example.com">
  <img src="logo.png" alt="网站Logo">
</a>
```

## 总结

链接和图片是网页中最重要的元素之一，合理使用它们可以大大提升用户体验。
