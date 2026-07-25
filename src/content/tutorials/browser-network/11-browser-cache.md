---
title: "第十一章：浏览器缓存机制"
description: "强缓存、协商缓存、Cache-Control 与缓存策略"
---

# 第十一章：浏览器缓存机制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 浏览器是怎么缓存资源的？缓存存在哪里？
- 强缓存和协商缓存有什么区别？
- Cache-Control 的 max-age、no-cache、no-store 分别是什么意思？
- 怎么配置缓存策略才能让网站又快又不会加载旧资源？

这一章就是为了解答这些问题。我们会从缓存的基本概念开始，逐步学习强缓存、协商缓存的工作原理，最后给出实用的缓存策略。学完之后，你就能合理配置缓存，让网站加载更快。

---

## 11.1 为什么需要浏览器缓存？

### 痛点分析

想象一下这个场景：你每天打开同一个网站，每次都要重新下载 HTML、CSS、JS 和图片。即使这些内容没有变化，浏览器也要从服务器重新获取。这就像你每天去超市买同样的东西，即使冰箱里还有，也要重新买。

**没有缓存的问题：**

- 每次都要从服务器下载，浪费带宽
- 服务器压力大，响应变慢
- 用户等待时间长，体验差
- 网络不稳定时，页面加载失败

### 解决方案

浏览器缓存就是让浏览器记住已经下载过的资源，下次直接从本地读取，不用再请求服务器。

打个比方：

> 浏览器缓存就像你家的冰箱。第一次去超市买菜（从服务器下载），把菜放进冰箱（缓存）。下次做饭时，直接从冰箱拿（使用缓存），不用再去超市（请求服务器）。只有冰箱里的菜过期了（缓存过期），才需要去超市买新的。

**缓存的优势：**

| 优势 | 说明 | 效果 |
| --- | --- | --- |
| 减少延迟 | 本地读取比网络快 | 页面加载更快 |
| 节省带宽 | 减少数据传输 | 节省流量 |
| 降低服务器压力 | 减少请求数量 | 服务器更稳定 |
| 提升用户体验 | 页面秒开 | 用户满意度高 |

---

## 11.2 核心原理：缓存的分类

浏览器缓存分为两大类：强缓存和协商缓存。

```
浏览器缓存
├── 强缓存（本地缓存）
│   ├── Expires（HTTP/1.0）
│   └── Cache-Control（HTTP/1.1）
└── 协商缓存（对比缓存）
    ├── Last-Modified / If-Modified-Since
    └── ETag / If-None-Match
```

**缓存决策流程：**

```
请求资源
  ↓
检查强缓存（Cache-Control / Expires）
  ↓
未过期 → 使用缓存（200 from cache），不发送请求
  ↓
已过期 → 发送请求，检查协商缓存
  ↓
资源未修改 → 返回 304 Not Modified，使用缓存
  ↓
资源已修改 → 返回 200 和新资源，更新缓存
```

---

## 11.3 强缓存：不发送请求，直接使用本地缓存

### 11.3.1 Expires（HTTP/1.0）

Expires 是最早的缓存控制方式，通过一个绝对时间来指定缓存过期时间：

```http
Expires: Wed, 21 Oct 2025 07:28:00 GMT
```

**工作原理：**

- 服务器返回资源时，带上 Expires 头部
- 浏览器比较本地时间和 Expires 时间
- 如果本地时间还没到 Expires 时间，使用缓存
- 如果本地时间已经超过 Expires 时间，发送请求

**缺点：**

- 依赖本地时间，如果用户修改了系统时间，缓存会失效
- 精度不够，无法灵活控制

```javascript
// Expires 的问题示例
// 服务器设置：Expires: Wed, 21 Oct 2025 07:28:00 GMT
// 用户把系统时间改成：Thu, 22 Oct 2025 07:28:00 GMT
// 结果：缓存立即过期，即使还没到真正的过期时间
```

### 11.3.2 Cache-Control（HTTP/1.1）

Cache-Control 是 HTTP/1.1 引入的缓存控制方式，优先级高于 Expires：

```http
Cache-Control: max-age=31536000, public
```

**常用指令：**

| 指令 | 说明 | 示例 |
| --- | --- | --- |
| max-age=秒数 | 缓存有效期（相对时间） | max-age=31536000（1 年） |
| no-cache | 使用协商缓存（不直接使用本地缓存） | no-cache |
| no-store | 不缓存任何内容 | no-store |
| public | 可被所有缓存（浏览器、CDN、代理） | public |
| private | 仅浏览器可缓存 | private |
| must-revalidate | 过期后必须验证，不能使用过期缓存 | must-revalidate |
| immutable | 资源在有效期内不会改变 | immutable |

**Cache-Control 指令详解：**

```http
# 缓存 1 年，可被所有缓存，资源不会改变
Cache-Control: max-age=31536000, public, immutable

# 每次都需要验证（使用协商缓存）
Cache-Control: no-cache

# 完全不缓存
Cache-Control: no-store, no-cache, must-revalidate

# 缓存 1 小时，仅浏览器可缓存
Cache-Control: max-age=3600, private
```

**max-age 和 Expires 的区别：**

| 特性 | Expires | Cache-Control (max-age) |
| --- | --- | --- |
| 时间类型 | 绝对时间 | 相对时间（秒数） |
| 依赖 | 依赖本地时间 | 不依赖本地时间 |
| 优先级 | 低 | 高（同时存在时使用 max-age） |
| HTTP 版本 | HTTP/1.0 | HTTP/1.1 |

---

## 11.4 协商缓存：发送请求，验证资源是否更新

### 11.4.1 Last-Modified / If-Modified-Since

基于最后修改时间的协商缓存：

**第一次请求（服务器响应）：**

```http
HTTP/1.1 200 OK
Content-Type: text/css
Last-Modified: Wed, 21 Oct 2025 07:28:00 GMT
Cache-Control: max-age=0
```

**第二次请求（浏览器发送）：**

```http
GET /style.css HTTP/1.1
If-Modified-Since: Wed, 21 Oct 2025 07:28:00 GMT
```

**服务器判断：**

- 如果资源未修改 → 返回 304 Not Modified（不返回资源体）
- 如果资源已修改 → 返回 200 OK 和新资源

```javascript
// Last-Modified 的问题
// 问题 1：精度只有秒级，1 秒内的修改无法检测
// 问题 2：文件内容没变，但修改时间变了，会重新下载
// 问题 3：服务器时间可能不准确
```

### 11.4.2 ETag / If-None-Match

基于资源内容哈希值的协商缓存，比 Last-Modified 更精确：

**第一次请求（服务器响应）：**

```http
HTTP/1.1 200 OK
Content-Type: text/css
ETag: "5d8c72a1ed8ed21:0"
Cache-Control: max-age=0
```

**第二次请求（浏览器发送）：**

```http
GET /style.css HTTP/1.1
If-None-Match: "5d8c72a1ed8ed21:0"
```

**服务器判断：**

- 如果 ETag 匹配 → 返回 304 Not Modified
- 如果 ETag 不匹配 → 返回 200 OK 和新资源

**Last-Modified 和 ETag 的对比：**

| 特性 | Last-Modified | ETag |
| --- | --- | --- |
| 判断依据 | 最后修改时间 | 资源内容哈希 |
| 精度 | 秒级 | 内容级（精确） |
| 性能 | 较好（只需读取时间） | 稍差（需计算哈希） |
| 优先级 | 低 | 高（同时存在时优先使用 ETag） |
| 适用场景 | 文件修改时间准确 | 需要精确判断内容是否变化 |

---

## 11.5 基础用法：缓存策略配置

### 11.5.1 不同资源的缓存策略

| 资源类型 | 缓存策略 | Cache-Control | 说明 |
| --- | --- | --- | --- |
| HTML | 协商缓存 | no-cache | 每次验证，确保内容最新 |
| CSS/JS（带哈希） | 强缓存 | max-age=31536000, immutable | 文件名含哈希，可长期缓存 |
| CSS/JS（不带哈希） | 协商缓存 | no-cache | 每次验证，避免加载旧资源 |
| 图片 | 强缓存 | max-age=31536000 | 图片变化少，可长期缓存 |
| 字体 | 强缓存 | max-age=31536000, immutable | 字体几乎不变 |
| API 响应 | 不缓存 | no-store | 数据实时变化，不缓存 |

### 11.5.2 Nginx 配置缓存

```nginx
# 静态资源（带哈希文件名）：长期缓存
location ~* \.(js|css|png|jpg|gif|woff|woff2|svg)$ {
    # 缓存 1 年
    expires 1y;
    
    # 设置 Cache-Control
    add_header Cache-Control "public, immutable";
    
    # 允许跨域（如果需要）
    add_header Access-Control-Allow-Origin *;
}

# HTML 文件：协商缓存
location ~* \.html$ {
    # 不缓存，每次验证
    add_header Cache-Control "no-cache";
}

# API 接口：不缓存
location /api/ {
    # 完全不缓存
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

### 11.5.3 文件名哈希：内容更新时自动失效

```html
<!-- 文件名包含内容哈希，内容变化时文件名也变化 -->
<script src="app.a1b2c3d4.js"></script>
<link rel="stylesheet" href="style.e5f6g7h8.css">

<!-- 内容变化后，文件名改变，浏览器会重新下载 -->
<script src="app.x9y8z7w6.js"></script>
<link rel="stylesheet" href="style.m5n4o3p2.css">
```

**工作原理：**

- 构建工具（如 Webpack、Vite）会在文件名中加入内容哈希
- 内容变化时，哈希值变化，文件名变化
- 浏览器发现是新文件，会重新下载
- 旧文件虽然还在缓存中，但不会被引用

---

## 11.6 缓存位置

浏览器缓存有多个存储位置，优先级从高到低：

| 位置 | 优先级 | 说明 | 特点 |
| --- | --- | --- | --- |
| Service Worker | 最高 | 可编程控制缓存 | 自定义缓存策略 |
| Memory Cache | 高 | 内存缓存 | 速度快，关闭标签后消失 |
| Disk Cache | 中 | 磁盘缓存 | 持久化，关闭浏览器后仍存在 |
| Push Cache | 低 | HTTP/2 推送缓存 | 会话级别，关闭后消失 |

**缓存位置选择规则：**

```
请求资源
  ↓
Service Worker 缓存？ → 有 → 使用 Service Worker 缓存
  ↓ 无
Memory Cache 缓存？ → 有 → 使用 Memory Cache
  ↓ 无
Disk Cache 缓存？ → 有 → 使用 Disk Cache
  ↓ 无
发送网络请求
```

---

## 11.7 新手常见误区

### 误区 1："no-cache 就是不缓存"

**错！** no-cache 的意思是"使用协商缓存"，不是"不缓存"。

- `no-cache`：缓存资源，但每次使用前都要验证
- `no-store`：完全不缓存，每次都从服务器下载

```http
# 错误理解
Cache-Control: no-cache  # 这不是不缓存！

# 正确理解
Cache-Control: no-cache  # 缓存，但每次验证
Cache-Control: no-store  # 完全不缓存
```

### 误区 2："max-age=0 就是不缓存"

**错！** max-age=0 的意思是"缓存立即过期"，会进入协商缓存流程：

```http
# max-age=0：缓存立即过期，但会发送协商缓存请求
Cache-Control: max-age=0

# 完全不缓存：不发送请求，直接从服务器下载
Cache-Control: no-store
```

### 误区 3："ETag 一定比 Last-Modified 好"

**不一定！** ETag 虽然更精确，但也有缺点：

- 需要计算哈希值，服务器性能开销大
- 分布式服务器可能生成不同的 ETag
- Last-Modified 性能更好，适合大多数场景

建议：优先使用 ETag，如果性能敏感可以使用 Last-Modified。

### 误区 4："缓存设置得越长越好"

**错！** 缓存时间需要根据资源类型合理设置：

- HTML 设置长期缓存：用户可能看不到最新内容
- JS/CSS 不带哈希设置长期缓存：可能加载旧代码
- API 响应设置缓存：可能显示过期数据

建议：带哈希的资源设置长期缓存，不带哈希的资源使用协商缓存。

### 误区 5："清除浏览器缓存就能解决所有问题"

**不完全对！** 清除缓存只能解决本地问题：

- 其他用户的缓存仍然存在
- CDN 缓存仍然存在
- 代理服务器缓存仍然存在

建议：通过文件名哈希和合理的缓存策略来管理缓存，而不是依赖用户清除缓存。

---

## 11.8 动手练习

### 练习 1：基础练习

观察以下 Cache-Control 配置，判断每个配置的缓存行为：

```http
配置 1：Cache-Control: max-age=3600
配置 2：Cache-Control: no-cache
配置 3：Cache-Control: no-store
配置 4：Cache-Control: max-age=0, must-revalidate
配置 5：Cache-Control: max-age=31536000, immutable
```

<details>
<summary>点击查看答案</summary>

```
配置 1：缓存 1 小时，过期后发送请求验证
配置 2：缓存资源，但每次使用前都要验证（协商缓存）
配置 3：完全不缓存，每次都从服务器下载
配置 4：缓存立即过期，必须验证后才能使用
配置 5：缓存 1 年，资源不会改变，过期后也不验证
```

</details>

### 练习 2：进阶练习

你的网站有以下资源，请为每种资源配置合适的 Cache-Control：

```
资源 1：index.html（入口页面）
资源 2：app.a1b2c3d4.js（带哈希的 JS 文件）
资源 3：style.css（不带哈希的 CSS 文件）
资源 4：logo.png（网站 Logo）
资源 5：/api/user（用户信息接口）
```

<details>
<summary>点击查看答案</summary>

```http
# 资源 1：HTML 入口页面，使用协商缓存
Cache-Control: no-cache

# 资源 2：带哈希的 JS，内容变化时文件名变化，可长期缓存
Cache-Control: max-age=31536000, immutable

# 资源 3：不带哈希的 CSS，使用协商缓存
Cache-Control: no-cache

# 资源 4：Logo 图片，变化少，可长期缓存
Cache-Control: max-age=31536000

# 资源 5：用户信息接口，数据实时变化，不缓存
Cache-Control: no-store, no-cache, must-revalidate
```

</details>

### 练习 3（挑战）：综合练习

请设计一个完整的 Nginx 缓存配置，满足以下需求：

```
需求：
1. HTML 文件每次验证
2. 带哈希的静态资源缓存 1 年
3. 不带哈希的 CSS/JS 使用协商缓存
4. 图片缓存 1 个月
5. API 接口不缓存
6. 字体缓存 1 年
```

<details>
<summary>点击查看答案</summary>

```nginx
# HTML 文件：协商缓存
location ~* \.html$ {
    add_header Cache-Control "no-cache";
}

# 带哈希的静态资源：长期缓存
location ~* \.(js|css)\.[a-f0-9]{8}\.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 不带哈希的 CSS/JS：协商缓存
location ~* \.(js|css)$ {
    add_header Cache-Control "no-cache";
}

# 图片：缓存 1 个月
location ~* \.(png|jpg|gif|svg|ico)$ {
    expires 1M;
    add_header Cache-Control "public";
}

# API 接口：不缓存
location /api/ {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

# 字体：长期缓存
location ~* \.(woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

</details>

---

## 下一章预告

下一章我们会学习 **跨域与 CORS**——也就是浏览器如何限制不同源之间的请求。你会学到同源策略是什么，为什么会有跨域问题，CORS 是怎么解决跨域的，以及常见的跨域解决方案。跨域是前端开发中经常遇到的问题，学完后你就能轻松解决各种跨域难题。
