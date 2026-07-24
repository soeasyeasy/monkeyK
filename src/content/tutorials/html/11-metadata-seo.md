---
title: "第十一章：元数据与 SEO"
description: "meta、Open Graph、结构化数据"
---

# 第十一章：元数据与 SEO

## meta 标签

### 字符编码

```html
<meta charset="UTF-8">
```

### 视口设置

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 页面描述

```html
<meta name="description" content="页面描述，用于搜索引擎显示">
```

### 关键词

```html
<meta name="keywords" content="HTML,CSS,JavaScript">
```

### 作者

```html
<meta name="author" content="作者名">
```

### 刷新和重定向

```html
<!-- 30秒后刷新 -->
<meta http-equiv="refresh" content="30">

<!-- 5秒后跳转 -->
<meta http-equiv="refresh" content="5;url=https://example.com">
```

## Open Graph

用于社交媒体分享：

```html
<meta property="og:title" content="页面标题">
<meta property="og:description" content="页面描述">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">
```

## Twitter Card

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="页面标题">
<meta name="twitter:description" content="页面描述">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

## 结构化数据

### JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "页面标题",
  "description": "页面描述",
  "author": {
    "@type": "Person",
    "name": "作者名"
  }
}
</script>
```

### 文章结构化数据

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "文章标题",
  "datePublished": "2024-01-01",
  "author": {
    "@type": "Person",
    "name": "作者名"
  },
  "image": "https://example.com/image.jpg"
}
</script>
```

## SEO 最佳实践

### 标题标签

```html
<title>页面标题 - 网站名称</title>
```

### 规范链接

```html
<link rel="canonical" href="https://example.com/page">
```

### 机器人指令

```html
<meta name="robots" content="index, follow">
<meta name="robots" content="noindex, nofollow">
```

### 语言替代

```html
<link rel="alternate" hreflang="zh-CN" href="https://example.com/zh">
<link rel="alternate" hreflang="en" href="https://example.com/en">
```

## 总结

合理使用元数据和结构化数据可以提升网站的搜索排名和社交分享效果。
