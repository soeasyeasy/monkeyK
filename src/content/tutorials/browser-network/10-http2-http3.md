---
title: "第十章：HTTP/2 与 HTTP/3"
description: "多路复用、头部压缩、QUIC 协议"
---

# 第十章：HTTP/2 与 HTTP/3

## HTTP/1.x 的局限

### 主要问题

| 问题 | 说明 |
| --- | --- |
| 队头阻塞 | 同一连接同时只能处理一个请求 |
| 头部冗余 | 每次请求都携带完整头部 |
| 文本传输 | 未压缩，效率低 |
| 无服务器推送 | 客户端需要主动请求 |

### 解决方案（HTTP/1.x 时代）
- 精灵图（CSS Sprites）
- 域名分片
- 长连接（Keep-Alive）
- 管道化（Pipelining）

## HTTP/2 特性

### 二进制分帧

HTTP/2 将请求和响应分为更小的二进制帧：

```
HTTP/2 消息
├── 帧 1（头部）
├── 帧 2（数据）
├── 帧 3（数据）
└── 帧 4（结束）
```

### 多路复用

一个 TCP 连接可以同时处理多个请求：

| HTTP/1.x | HTTP/2 |
| --- | --- |
| 串行请求 | 并行请求 |
| 需要多个连接 | 单个连接 |
| 队头阻塞 | 无阻塞 |

### 头部压缩

使用 HPACK 算法压缩头部：

- 静态字典：预定义常用头部
- 动态字典：记录已传输的头部
- 哈夫曼编码：压缩字符串

### 服务器推送

服务器可以主动推送资源：

```http
HTTP/2 200 OK
Link: </style.css>; rel=preload; as=style
```

### 请求优先级

客户端可以为请求设置优先级：

| 优先级 | 说明 |
| --- | --- |
| 高 | HTML 文档 |
| 中 | CSS、字体 |
| 低 | 图片、视频 |

## HTTP/2 配置

### Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

### 检测支持

```javascript
// 检查是否支持 HTTP/2
const response = await fetch('/');
console.log(response.headers.get('alt-svc'));
```

## HTTP/3 特性

### 基于 QUIC 协议

HTTP/3 使用 QUIC（Quick UDP Internet Connections）协议：

| 特性 | TCP | QUIC |
| --- | --- | --- |
| 传输层 | TCP | UDP |
| 握手 | 3 次 | 0-1 次 |
| 队头阻塞 | 有 | 无 |
| 连接迁移 | 不支持 | 支持 |
| 拥塞控制 | 内核实现 | 用户空间 |

### 0-RTT 连接建立

QUIC 支持 0-RTT（零往返时间）连接建立：

```
客户端                    服务器
  |                         |
  |--- Initial + Data ----->|  第一次请求
  |                         |
  |<-- Initial + Data ------|  响应
  |                         |
  |===== 立即通信 ==========|
```

### 连接迁移

QUIC 使用 Connection ID 标识连接，而不是 IP+端口：

- 网络切换时保持连接
- 移动设备友好
- 无需重新建立连接

### 改进的拥塞控制

- 用户空间实现，可快速迭代
- 更精确的 RTT 测量
- 更好的丢包恢复

## HTTP 版本对比

| 特性 | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| 传输协议 | TCP | TCP | QUIC (UDP) |
| 二进制 | 否 | 是 | 是 |
| 多路复用 | 否 | 是 | 是 |
| 头部压缩 | 否 | HPACK | QPACK |
| 服务器推送 | 否 | 是 | 是 |
| 0-RTT | 否 | 否 | 是 |
| 连接迁移 | 否 | 否 | 是 |

## 部署建议

### 启用 HTTP/2
1. 配置 HTTPS
2. 升级服务器软件
3. 测试兼容性

### 启用 HTTP/3
1. 确保服务器支持
2. 配置 Alt-Svc 头部
3. 测试防火墙兼容性

## 本章小结

HTTP/2 通过二进制分帧、多路复用、头部压缩等特性解决了 HTTP/1.x 的性能问题。HTTP/3 基于 QUIC 协议，进一步消除了 TCP 层的队头阻塞，支持 0-RTT 连接和连接迁移。升级到新版本可以显著提升网站性能。
