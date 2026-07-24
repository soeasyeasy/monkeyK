---
title: "第四章：HTTP 协议详解"
description: "HTTP 方法、状态码、请求响应结构"
---

# 第四章：HTTP 协议详解

## HTTP 协议概述

HTTP（HyperText Transfer Protocol）是超文本传输协议，用于在 Web 浏览器和服务器之间传输数据。

### HTTP 特点

| 特点 | 说明 |
| --- | --- |
| 无状态 | 服务器不保存客户端状态 |
| 无连接 | 每次请求都需要建立新连接 |
| 基于请求/响应 | 客户端发起请求，服务器返回响应 |
| 明文传输 | 数据未加密（HTTPS 加密） |

## HTTP 请求方法

HTTP 定义了多种请求方法，表示对资源的不同操作：

| 方法 | 用途 | 特点 |
| --- | --- | --- |
| GET | 获取资源 | 幂等，可缓存，参数在 URL |
| POST | 提交数据 | 非幂等，不可缓存，参数在请求体 |
| PUT | 更新资源 | 幂等，完整替换 |
| PATCH | 部分更新 | 非幂等，部分修改 |
| DELETE | 删除资源 | 幂等 |
| HEAD | 获取响应头 | 不返回响应体 |
| OPTIONS | 查询支持的方法 | 用于 CORS 预检 |

### GET vs POST

| 对比项 | GET | POST |
| --- | --- | --- |
| 参数位置 | URL | 请求体 |
| 数据长度 | 受限（URL 长度限制） | 无限制 |
| 安全性 | 较低（参数可见） | 较高 |
| 缓存 | 可缓存 | 不可缓存 |
| 幂等性 | 幂等 | 非幂等 |

## HTTP 状态码

服务器返回的状态码表示请求的处理结果：

### 状态码分类

| 范围 | 类别 | 说明 |
| --- | --- | --- |
| 1xx | 信息性 | 请求已接收，继续处理 |
| 2xx | 成功 | 请求已成功处理 |
| 3xx | 重定向 | 需要进一步操作 |
| 4xx | 客户端错误 | 请求有误 |
| 5xx | 服务器错误 | 服务器处理失败 |

### 常见状态码

| 状态码 | 含义 | 场景 |
| --- | --- | --- |
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 成功但无内容 |
| 301 | Moved Permanently | 永久重定向 |
| 302 | Found | 临时重定向 |
| 304 | Not Modified | 使用缓存 |
| 400 | Bad Request | 请求格式错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误 |
| 503 | Service Unavailable | 服务不可用 |

## HTTP 请求结构

HTTP 请求由三部分组成：

```
GET /index.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0
Accept: text/html

[请求体]
```

### 请求行
- 方法：GET、POST 等
- URI：请求的资源路径
- 协议版本：HTTP/1.1、HTTP/2

### 请求头
- Host：目标主机
- User-Agent：客户端信息
- Accept：可接受的响应类型
- Content-Type：请求体格式

### 请求体
- POST/PUT 请求的数据
- GET 请求无请求体

## HTTP 响应结构

HTTP 响应同样由三部分组成：

```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1234

<html>...</html>
```

### 状态行
- 协议版本：HTTP/1.1
- 状态码：200
- 状态描述：OK

### 响应头
- Content-Type：响应体类型
- Content-Length：响应体长度
- Set-Cookie：设置 Cookie
- Cache-Control：缓存控制

### 响应体
- 实际的资源内容
- HTML、JSON、图片等

## 本章小结

HTTP 是 Web 的基础协议，理解请求方法、状态码和请求响应结构是前端开发的必备知识。掌握这些概念有助于调试网络问题和优化应用性能。
