---
title: "第十一章：网络优化"
description: "HTTP/2、CDN、DNS 预解析、连接优化等网络技术"
---

# 第十一章：网络优化

## 网络优化维度

| 维度 | 优化目标 |
| --- | --- |
| 延迟 | 减少请求往返时间 |
| 带宽 | 提高数据传输效率 |
| 连接 | 优化连接建立和复用 |
| 路由 | 选择最优传输路径 |

## HTTP/2 优化

### 多路复用

```
HTTP/1.1：每个请求需要独立连接
HTTP/2：单个连接上并行多个请求

优势：
- 消除队头阻塞
- 减少连接数
- 降低延迟
```

### 服务器推送

```nginx
# Nginx 配置服务器推送
location / {
    http2_push /styles.css;
    http2_push /main.js;
}
```

```html
<!-- 或使用资源提示 -->
<link rel="preload" href="/styles.css" as="style">
```

### 头部压缩

```
HTTP/2 使用 HPACK 算法压缩头部：
- 静态字典：常见头部预定义
- 动态字典：记录连接中的头部
- 霍夫曼编码：压缩头部值

效果：头部体积减少 80-90%
```

## HTTP/3 (QUIC)

### 特性

```
基于 UDP：
- 0-RTT 连接建立
- 无队头阻塞
- 连接迁移

优势：
- 弱网环境表现更好
- 移动网络切换无缝
- 更快的连接建立
```

### 启用 HTTP/3

```nginx
# Nginx 配置
server {
    listen 443 quic reuseport;
    listen 443 ssl http2;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

## CDN 优化

### CDN 原理

```
用户请求 → 边缘节点 → 源站

缓存命中：边缘节点直接返回
缓存未命中：回源获取，缓存后返回
```

### CDN 配置

```html
<!-- 使用 CDN 加载资源 -->
<script src="https://cdn.example.com/vue@3.3.4/dist/vue.global.min.js"></script>

<!-- 多 CDN 容灾 -->
<script src="https://cdn1.example.com/lib.js"
        onerror="this.src='https://cdn2.example.com/lib.js'"></script>
```

### CDN 选择策略

```
考虑因素：
- 节点覆盖：是否覆盖目标用户区域
- 缓存命中率：热门资源缓存效果
- 回源策略：回源带宽和延迟
- 价格：流量计费模式
```

## DNS 优化

### DNS 预解析

```html
<!-- 提前解析域名 -->
<link rel="dns-prefetch" href="https://api.example.com">
<link rel="dns-prefetch" href="https://cdn.example.com">
```

### 预连接

```html
<!-- 完整连接建立 -->
<link rel="preconnect" href="https://api.example.com">
<link rel="preconnect" href="https://cdn.example.com" crossorigin>
```

### DNS 优化策略

```
1. 减少域名数量
   - 合并资源到同一域名
   - 减少 DNS 查询

2. 使用 DNS 缓存
   - 浏览器缓存 DNS
   - 操作系统缓存

3. 选择优质 DNS 服务商
   - 低延迟
   - 高可用
```

## 连接优化

### 连接复用

```
HTTP/1.1：Keep-Alive 保持连接
HTTP/2：单连接多路复用

减少连接数：
- 合并域名
- 使用雪碧图
- 内联小资源
```

### 请求合并

```
HTTP/1.1 时代：
- CSS 雪碧图
- JS/CSS 合并
- 减少请求数

HTTP/2 时代：
- 多路复用，无需合并
- 保持独立，利于缓存
- 按需加载，减少浪费
```

## 数据压缩

### Gzip / Brotli

```nginx
# Nginx 配置
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;
gzip_vary on;

# Brotli（需要模块）
brotli on;
brotli_types text/plain text/css application/json;
```

### 压缩选择

```
Gzip：
- 兼容性好
- 压缩率中等
- 所有浏览器支持

Brotli：
- 压缩率更高（15-20%）
- 压缩速度较慢
- 现代浏览器支持
```

## 请求优化

### 减少请求数

```
策略：
- 合并小文件
- 内联关键资源
- 使用雪碧图（HTTP/1.1）
- 使用 Data URI（小图片）
```

### 减少请求体积

```
策略：
- 代码压缩
- 图片压缩
- 字体子集化
- 移除未使用代码
```

### 减少请求延迟

```
策略：
- CDN 加速
- DNS 预解析
- 预连接
- HTTP/2 多路复用
```

## 移动端网络优化

### 弱网优化

```
策略：
- 离线支持（Service Worker）
- 请求重试机制
- 降级策略
- 骨架屏
```

### 网络感知

```javascript
// 检测网络状态
if ('connection' in navigator) {
  const connection = navigator.connection;

  console.log('有效类型:', connection.effectiveType);
  console.log('下行速度:', connection.downlink);
  console.log('RTT:', connection.rtt);

  // 根据网络类型调整策略
  if (connection.effectiveType === '2g') {
    // 加载精简版本
    loadLiteVersion();
  }
}

// 监听网络变化
navigator.connection.addEventListener('change', () => {
  console.log('网络变化:', navigator.connection.effectiveType);
});
```

## 核心知识点

1. **HTTP/2**：多路复用、头部压缩、服务器推送
2. **HTTP/3**：基于 UDP，0-RTT，无队头阻塞
3. **CDN**：边缘缓存，减少回源，加速资源加载
4. **DNS 优化**：预解析、预连接，减少域名查询
5. **数据压缩**：Gzip/Brotli 减少传输体积
