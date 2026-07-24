---
title: "第五章：URL 与资源定位"
description: "URL 结构、URI 规范、资源寻址机制"
---

# 第五章：URL 与资源定位

## URL 基础

URL（Uniform Resource Locator）是统一资源定位符，用于标识互联网上的资源地址。

### URL 结构

```
协议://用户名:密码@主机:端口/路径?查询参数#片段
```

### URL 组成部分

| 部分 | 说明 | 示例 |
| --- | --- | --- |
| 协议 | 访问资源使用的协议 | http、https、ftp |
| 主机 | 服务器域名或 IP | www.example.com |
| 端口 | 服务器端口号（可选） | 80、443 |
| 路径 | 资源在服务器上的位置 | /path/to/resource |
| 查询参数 | 传递给服务器的参数 | ?key=value |
| 片段 | 页面内的锚点 | #section1 |

## URI vs URL vs URN

| 概念 | 全称 | 说明 | 示例 |
| --- | --- | --- | --- |
| URI | 统一资源标识符 | 资源的唯一标识 | urn:isbn:0451450523 |
| URL | 统一资源定位符 | 资源的访问地址 | https://example.com/page |
| URN | 统一资源名称 | 资源的持久名称 | urn:uuid:6e8bc430-9c3a-11d9-9669-0800200c9a66 |

URL 是 URI 的子集，URN 也是 URI 的子集。

## 常见协议

| 协议 | 用途 | 默认端口 |
| --- | --- | --- |
| http | 超文本传输 | 80 |
| https | 安全超文本传输 | 443 |
| ftp | 文件传输 | 21 |
| ssh | 安全 shell | 22 |
| mailto | 电子邮件 | - |
| tel | 电话 | - |
| file | 本地文件 | - |

## 相对路径与绝对路径

### 绝对路径
包含完整 URL，可以直接访问：
```
https://www.example.com/path/to/resource.html
```

### 相对路径
相对于当前页面的路径：

| 相对路径 | 说明 |
| --- | --- |
| `resource.html` | 同级目录 |
| `./resource.html` | 当前目录 |
| `../resource.html` | 上级目录 |
| `/resource.html` | 根目录 |
| `//cdn.example.com/file.js` | 协议相对 |

## URL 编码

URL 中某些字符有特殊含义，需要进行编码：

### 保留字符
```
! * ' ( ) ; : @ & = + $ , / ? # [ ]
```

### 编码规则
- 使用 `%` 后跟两位十六进制数
- 空格编码为 `%20` 或 `+`
- 中文需要 UTF-8 编码后转换

### 示例
```
原始：https://example.com/search?q=你好 世界
编码：https://example.com/search?q=%E4%BD%A0%E5%A5%BD%20%E4%B8%96%E7%95%8C
```

## URL 最佳实践

### SEO 友好
- 使用小写字母
- 使用连字符分隔单词
- 避免特殊字符
- 保持简短有意义

### 安全性
- 使用 HTTPS
- 避免在 URL 中暴露敏感信息
- 对输入进行验证和过滤

### 可维护性
- 使用 RESTful 风格
- 避免过深的目录结构
- 使用语义化的路径名

## 本章小结

URL 是互联网资源的地址，理解其结构和编码规则对于 Web 开发至关重要。良好的 URL 设计不仅有利于 SEO，还能提升用户体验和系统安全性。
