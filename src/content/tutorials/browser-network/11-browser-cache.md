---
title: "第十一章：浏览器缓存机制"
description: "强缓存、协商缓存、Cache-Control"
---

# 第十一章：浏览器缓存机制

## 缓存概述

浏览器缓存可以减少网络请求，提升页面加载速度。

### 缓存优势

| 优势 | 说明 |
| --- | --- |
| 减少延迟 | 本地读取比网络快 |
| 节省带宽 | 减少数据传输 |
| 降低服务器压力 | 减少请求数量 |

### 缓存分类

```
缓存
├── 强缓存（本地缓存）
│   ├── Expires
│   └── Cache-Control
└── 协商缓存（对比缓存）
    ├── Last-Modified / If-Modified-Since
    └── ETag / If-None-Match
```

## 强缓存

强缓存命中时，不发送请求，直接使用本地缓存。

### Expires

HTTP/1.0 的缓存控制：

```http
Expires: Wed, 21 Oct 2025 07:28:00 GMT
```

**缺点**：依赖本地时间，可能被修改

### Cache-Control

HTTP/1.1 的缓存控制，优先级高于 Expires：

| 指令 | 说明 |
| --- | --- |
| max-age=秒数 | 缓存有效期 |
| no-cache | 使用协商缓存 |
| no-store | 不缓存 |
| public | 可被所有缓存 |
| private | 仅浏览器可缓存 |
| must-revalidate | 过期后必须验证 |

```http
Cache-Control: max-age=31536000, public
```

### 强缓存流程

```
请求资源
  ↓
检查 Cache-Control
  ↓
未过期 → 使用缓存（200 from cache）
  ↓
已过期 → 进入协商缓存
```

## 协商缓存

强缓存过期后，使用协商缓存验证资源是否更新。

### Last-Modified / If-Modified-Since

基于最后修改时间：

**服务器响应**：
```http
Last-Modified: Wed, 21 Oct 2025 07:28:00 GMT
```

**客户端请求**：
```http
If-Modified-Since: Wed, 21 Oct 2025 07:28:00 GMT
```

**服务器判断**：
- 资源未修改 → 返回 304 Not Modified
- 资源已修改 → 返回 200 和新资源

### ETag / If-None-Match

基于资源内容的哈希值：

**服务器响应**：
```http
ETag: "5d8c72a1ed8ed21:0"
```

**客户端请求**：
```http
If-None-Match: "5d8c72a1ed8ed21:0"
```

**服务器判断**：
- ETag 匹配 → 返回 304
- ETag 不匹配 → 返回 200 和新资源

### 协商缓存优先级

| 对比项 | Last-Modified | ETag |
| --- | --- | --- |
| 精度 | 秒级 | 内容哈希 |
| 性能 | 较好 | 稍差（需计算） |
| 优先级 | 低 | 高 |

## 缓存策略

### 静态资源策略

| 资源类型 | 策略 | 说明 |
| --- | --- | --- |
| HTML | no-cache | 每次验证 |
| CSS/JS | 长期缓存 + 文件名哈希 | 强缓存 |
| 图片 | 长期缓存 | 强缓存 |
| 字体 | 长期缓存 | 强缓存 |

### 文件名哈希

```html
<!-- 文件名包含内容哈希 -->
<script src="app.a1b2c3d4.js"></script>
<link rel="stylesheet" href="style.e5f6g7h8.css">
```

内容变化时，文件名改变，自动更新缓存。

## 缓存位置

| 位置 | 优先级 | 说明 |
| --- | --- | --- |
| Service Worker | 最高 | 可编程控制 |
| Memory Cache | 高 | 内存缓存，快速 |
| Disk Cache | 中 | 磁盘缓存，持久 |
| Push Cache | 低 | HTTP/2 推送缓存 |

## 缓存最佳实践

### 开发环境
```http
Cache-Control: no-cache, no-store, must-revalidate
```

### 生产环境
```http
# HTML
Cache-Control: no-cache

# 静态资源（带哈希）
Cache-Control: max-age=31536000, immutable
```

### Nginx 配置

```nginx
location ~* \.(js|css|png|jpg|gif|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.html$ {
    add_header Cache-Control "no-cache";
}
```

## 本章小结

浏览器缓存分为强缓存和协商缓存。强缓存通过 Cache-Control 控制，协商缓存通过 ETag 和 Last-Modified 验证。合理的缓存策略可以显著提升网站性能。
