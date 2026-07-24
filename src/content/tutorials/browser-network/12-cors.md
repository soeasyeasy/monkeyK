---
title: "第十二章：跨域与 CORS"
description: "同源策略、CORS 机制、跨域解决方案"
---

# 第十二章：跨域与 CORS

## 同源策略

同源策略是浏览器的安全机制，限制不同源的文档或脚本交互。

### 同源定义

两个 URL 同源需要满足：
- 协议相同
- 域名相同
- 端口相同

| URL | 是否同源 |
| --- | --- |
| http://example.com/a | 同源 |
| http://example.com/b | 同源 |
| https://example.com/c | 不同源（协议不同） |
| http://api.example.com/d | 不同源（域名不同） |
| http://example.com:8080/e | 不同源（端口不同） |

### 同源策略限制

| 操作 | 是否允许 |
| --- | --- |
| 读取 Cookie | 不允许 |
| 读取 DOM | 不允许 |
| 发送 AJAX | 不允许 |
| 嵌入脚本 | 允许 |
| 嵌入样式 | 允许 |
| 嵌入图片 | 允许 |

## CORS 机制

CORS（Cross-Origin Resource Sharing）是跨域资源共享机制，允许服务器声明哪些源可以访问其资源。

### 简单请求

满足以下条件的为简单请求：

| 条件 | 说明 |
| --- | --- |
| 方法 | GET、HEAD、POST |
| Content-Type | text/plain、multipart/form-data、application/x-www-form-urlencoded |
| 头部 | 仅限简单头部 |

**简单请求流程**：
```
浏览器                    服务器
  |                         |
  |--- 跨域请求 ----------->|
  |                         |
  |<-- Access-Control-Allow-Origin: * ----|
  |                         |
  |===== 允许/拒绝 =========|
```

### 预检请求

不满足简单请求条件的，会先发送 OPTIONS 预检请求：

```
浏览器                    服务器
  |                         |
  |--- OPTIONS 预检 ------->|
  |                         |
  |<-- Access-Control-Allow-Origin ----|
  |<-- Access-Control-Allow-Methods ---|
  |<-- Access-Control-Allow-Headers ---|
  |                         |
  |--- 实际请求 ----------->|
  |                         |
  |<-- 响应 ----------------|
```

### CORS 响应头

| 头部 | 说明 | 示例 |
| --- | --- | --- |
| Access-Control-Allow-Origin | 允许的源 | `*` 或 `https://example.com` |
| Access-Control-Allow-Methods | 允许的方法 | `GET, POST, PUT` |
| Access-Control-Allow-Headers | 允许的头部 | `Content-Type, Authorization` |
| Access-Control-Allow-Credentials | 允许携带凭证 | `true` |
| Access-Control-Max-Age | 预检缓存时间 | `86400` |

## 跨域解决方案

### 1. CORS（推荐）

**服务器配置**：

```javascript
// Express
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

```nginx
# Nginx
add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
add_header 'Access-Control-Allow-Headers' 'Content-Type';
```

### 2. JSONP

利用 `<script>` 标签不受同源策略限制：

```html
<script>
function callback(data) {
  console.log(data);
}
</script>
<script src="http://api.example.com/data?callback=callback"></script>
```

**缺点**：只支持 GET 请求，不安全

### 3. 代理服务器

开发环境使用代理转发请求：

```javascript
// Vite 配置
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
}
```

### 4. WebSocket

WebSocket 不受同源策略限制：

```javascript
const ws = new WebSocket('ws://api.example.com');
ws.onmessage = (event) => {
  console.log(event.data);
};
```

### 5. postMessage

用于窗口间通信：

```javascript
// 发送方
iframe.contentWindow.postMessage('data', 'http://target.com');

// 接收方
window.addEventListener('message', (event) => {
  if (event.origin === 'http://sender.com') {
    console.log(event.data);
  }
});
```

## 凭证与跨域

### 携带 Cookie

默认情况下，跨域请求不携带 Cookie：

```javascript
// 客户端
fetch('http://api.example.com', {
  credentials: 'include'
});
```

```http
# 服务器
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://example.com  # 不能为 *
```

## 安全建议

| 建议 | 说明 |
| --- | --- |
| 限制源 | 不要使用 `*`，指定具体源 |
| 限制方法 | 只允许必要的 HTTP 方法 |
| 限制头部 | 只允许必要的请求头 |
| 验证来源 | 服务端验证 Origin 头部 |

## 本章小结

同源策略是浏览器的安全机制，CORS 是跨域的标准解决方案。理解简单请求和预检请求的区别，正确配置 CORS 头部，是前端开发的必备技能。
