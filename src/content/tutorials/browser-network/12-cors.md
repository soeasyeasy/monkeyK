---
title: "第十二章：跨域与 CORS"
description: "同源策略、CORS 机制、跨域解决方案"
---

# 第十二章：跨域与 CORS

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是跨域？为什么浏览器会阻止我的请求？
- 同源策略是什么？它到底限制了哪些操作？
- CORS 是怎么解决跨域问题的？简单请求和预检请求有什么区别？
- 除了 CORS，还有哪些跨域解决方案？各自适合什么场景？

这一章就是为了解答这些问题。我们会从同源策略开始，逐步学习 CORS 的工作原理，最后介绍各种跨域解决方案。学完之后，你就能理解跨域报错的原因，并知道怎么解决。

---

## 1 为什么需要跨域机制？

### 痛点分析：没有同源策略的世界

想象一下这个场景：你登录了银行网站，然后打开了一个恶意网站。如果没有同源策略，恶意网站可以用 JavaScript 读取银行网站的 Cookie，直接操作你的账户。这就像你家没有门锁，任何人都可以进来翻你的东西。

**同源策略的作用：**

- 防止恶意网站读取其他网站的 Cookie
- 防止恶意网站操作其他网站的 DOM
- 防止恶意网站发送跨域 AJAX 请求

### 解决方案

同源策略是浏览器的安全基石，但有时候我们确实需要跨域请求（比如前后端分离的开发模式）。CORS 就是浏览器提供的官方跨域方案，让服务器声明"我允许哪些网站来访问我的资源"。

打个比方：

> 同源策略就像小区的门禁系统，不同小区的人不能随便进入。CORS 就像小区物业给外来人员发临时通行证，只有得到许可的人才能进入。

---

## 2 核心原理：同源策略

### 12.2.1 什么是同源？

两个 URL 同源需要同时满足三个条件：协议相同、域名相同、端口相同。

| URL | 与 http://example.com/a 是否同源 | 原因 |
| --- | --- | --- |
| http://example.com/b | 同源 | 协议、域名、端口都相同 |
| https://example.com/c | 不同源 | 协议不同（http vs https） |
| http://api.example.com/d | 不同源 | 域名不同（example.com vs api.example.com） |
| http://example.com:8080/e | 不同源 | 端口不同（80 vs 8080） |
| http://other.com/f | 不同源 | 域名不同 |

### 12.2.2 同源策略限制了什么？

同源策略限制了不同源之间的以下操作：

| 操作 | 是否允许 | 说明 |
| --- | --- | --- |
| 读取 Cookie | 不允许 | 不能读取其他源的 Cookie |
| 读取 DOM | 不允许 | 不能操作其他源的 DOM |
| 发送 AJAX | 不允许 | 不能发送跨域 XMLHttpRequest |
| 嵌入 script 标签 | 允许 | 但无法读取响应内容 |
| 嵌入 link 样式 | 允许 | 但无法读取样式内容 |
| 嵌入 img 图片 | 允许 | 但无法读取图片像素 |
| 嵌入 iframe | 允许 | 但无法跨域操作 DOM |

---

## 3 核心原理：CORS 机制

### 12.3.1 什么是 CORS？

CORS（Cross-Origin Resource Sharing）是跨域资源共享机制。它允许服务器声明哪些源可以访问其资源，浏览器根据这些声明来决定是否允许跨域请求。

### 12.3.2 简单请求

满足以下全部条件的请求为简单请求：

| 条件 | 说明 |
| --- | --- |
| 请求方法 | GET、HEAD、POST 之一 |
| Content-Type | text/plain、multipart/form-data、application/x-www-form-urlencoded 之一 |
| 自定义头部 | 不包含自定义头部（只有简单头部） |

**简单请求流程：**

```
浏览器                          服务器
  |                               |
  |--- GET /api/data ----------->|  发送跨域请求
  |    Origin: http://example.com |  带上 Origin 头部
  |                               |
  |<-- 200 OK --------------------|  服务器响应
  |    Access-Control-Allow-Origin: *  |  允许所有源访问
  |                               |
  |===== 浏览器检查响应头 =========|  检查是否允许
```

**代码示例：**

```javascript
// 客户端：发送跨域请求
// 这是一个简单请求（GET 方法，无自定义头部）
fetch('http://api.example.com/data')  // 发送 GET 请求
  .then(response => response.json())  // 解析 JSON 响应
  .then(data => console.log(data))    // 打印数据
  .catch(error => console.error(error)); // 错误处理
```

```javascript
// 服务器端：设置 CORS 响应头
// Express 示例
app.get('/api/data', (req, res) => {
  // 允许所有源访问（生产环境不建议用 *）
  res.header('Access-Control-Allow-Origin', '*');
  
  // 返回数据
  res.json({ name: '张三', age: 25 });
});
```

### 12.3.3 预检请求（非简单请求）

不满足简单请求条件的，浏览器会先发送一个 OPTIONS 预检请求，询问服务器是否允许：

```
浏览器                          服务器
  |                               |
  |--- OPTIONS /api/data -------->|  第一步：预检请求
  |    Origin: http://example.com |  告诉服务器我的源
  |    Access-Control-Request-Method: PUT  |  告诉服务器我要用的方法
  |    Access-Control-Request-Headers: Content-Type  |  告诉服务器我要用的头部
  |                               |
  |<-- 200 OK --------------------|  服务器回复预检
  |    Access-Control-Allow-Origin: *  |  允许这个源
  |    Access-Control-Allow-Methods: PUT, POST  |  允许这些方法
  |    Access-Control-Allow-Headers: Content-Type  |  允许这些头部
  |                               |
  |--- PUT /api/data ------------>|  第二步：发送实际请求
  |    Content-Type: application/json  |  携带 JSON 数据
  |    {"name": "张三"}           |
  |                               |
  |<-- 200 OK --------------------|  服务器返回数据
  |    Access-Control-Allow-Origin: *  |
  |                               |
  |===== 完成 ===================|
```

**代码示例：**

```javascript
// 客户端：发送非简单请求（PUT 方法 + JSON 数据）
// 浏览器会自动先发 OPTIONS 预检请求
fetch('http://api.example.com/api/data', {
  method: 'PUT',                    // 使用 PUT 方法（非简单方法）
  headers: {
    'Content-Type': 'application/json'  // JSON 类型（非简单 Content-Type）
  },
  body: JSON.stringify({ name: '张三' })  // 请求体
})
  .then(response => response.json())  // 解析响应
  .then(data => console.log(data))    // 打印数据
  .catch(error => console.error(error)); // 错误处理
```

```javascript
// 服务器端：处理预检请求和实际请求
// Express 示例
app.options('/api/data', (req, res) => {
  // 处理 OPTIONS 预检请求
  res.header('Access-Control-Allow-Origin', '*');        // 允许的源
  res.header('Access-Control-Allow-Methods', 'PUT, POST, DELETE'); // 允许的方法
  res.header('Access-Control-Allow-Headers', 'Content-Type');      // 允许的头部
  res.sendStatus(200);  // 返回 200，表示允许
});

app.put('/api/data', (req, res) => {
  // 处理实际的 PUT 请求
  res.header('Access-Control-Allow-Origin', '*');  // 也要设置 CORS 头部
  res.json({ success: true });  // 返回数据
});
```

### 12.3.4 CORS 响应头详解

| 头部 | 说明 | 示例 | 设置位置 |
| --- | --- | --- | --- |
| Access-Control-Allow-Origin | 允许访问的源 | `*` 或 `https://example.com` | 服务器 |
| Access-Control-Allow-Methods | 允许的 HTTP 方法 | `GET, POST, PUT, DELETE` | 服务器 |
| Access-Control-Allow-Headers | 允许的请求头 | `Content-Type, Authorization` | 服务器 |
| Access-Control-Allow-Credentials | 是否允许携带凭证（Cookie） | `true` | 服务器 |
| Access-Control-Max-Age | 预检请求缓存时间（秒） | `86400`（1 天） | 服务器 |
| Access-Control-Expose-Headers | 允许客户端读取的响应头 | `X-Custom-Header` | 服务器 |

---

## 4 基础用法：跨域解决方案

### 12.4.1 CORS（推荐方案）

CORS 是跨域的标准解决方案，需要服务器端配置：

```javascript
// Express 完整 CORS 中间件
// 逐行注释
app.use((req, res, next) => {
  // 获取请求的 Origin 头部
  const origin = req.headers.origin;
  
  // 允许的源列表（生产环境不要用 *）
  const allowedOrigins = ['http://localhost:3000', 'https://example.com'];
  
  // 如果 Origin 在允许列表中，设置响应头
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);  // 设置允许的源
  }
  
  // 设置允许的 HTTP 方法
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // 设置允许的请求头
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 允许携带凭证（Cookie）
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 预检请求缓存 1 天
  res.header('Access-Control-Max-Age', '86400');
  
  // 如果是 OPTIONS 预检请求，直接返回 200
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // 继续处理请求
  next();
});
```

```nginx
# Nginx 配置 CORS
server {
    listen 80;
    server_name api.example.com;
    
    location / {
        # 允许的源（不要用 *，指定具体域名）
        add_header 'Access-Control-Allow-Origin' 'https://example.com';
        
        # 允许的 HTTP 方法
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        
        # 允许的请求头
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
        
        # 允许携带凭证
        add_header 'Access-Control-Allow-Credentials' 'true';
        
        # 预检请求缓存 1 天
        add_header 'Access-Control-Max-Age' '86400';
        
        # 处理 OPTIONS 预检请求
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        # 代理到后端
        proxy_pass http://localhost:3000;
    }
}
```

### 12.4.2 开发环境代理（Vite / Webpack）

开发环境中最简单的跨域方案，通过开发服务器代理转发请求：

```javascript
// Vite 配置（vite.config.js）
export default {
  server: {
    proxy: {
      // 所有 /api 开头的请求都会被代理
      '/api': {
        target: 'http://api.example.com',  // 目标服务器地址
        changeOrigin: true,                 // 修改请求头中的 Origin
        rewrite: (path) => path.replace(/^\/api/, '')  // 去掉 /api 前缀
      }
    }
  }
}

// 使用方式：
// 前端代码中请求 /api/users
// 实际会被代理到 http://api.example.com/users
// 浏览器看到的是同源请求，不会有跨域问题
```

```javascript
// Webpack 配置（vue.config.js）
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://api.example.com',  // 目标服务器
        changeOrigin: true,                 // 修改 Origin
        pathRewrite: { '^/api': '' }        // 重写路径
      }
    }
  }
}
```

### 12.4.3 JSONP（老方案，不推荐）

利用 script 标签不受同源策略限制的特性，只支持 GET 请求：

```html
<!-- 第一步：定义回调函数 -->
<script>
// 定义全局回调函数，服务器返回的数据会作为参数传入
function handleData(data) {
  console.log('收到数据：', data);  // 打印数据
}
</script>

<!-- 第二步：通过 script 标签请求数据 -->
<!-- 服务器返回：handleData({"name": "张三", "age": 25}) -->
<script src="http://api.example.com/data?callback=handleData"></script>
```

```javascript
// 封装 JSONP 请求
function jsonp(url, callbackName) {
  // 创建 script 标签
  const script = document.createElement('script');  // 创建 script 元素
  
  // 拼接 URL，带上回调函数名
  script.src = url + '?callback=' + callbackName;   // 设置 src 属性
  
  // 添加到页面，开始加载
  document.body.appendChild(script);                // 插入到 body
  
  // 加载完成后移除 script 标签
  script.onload = () => {                           // 监听加载完成
    document.body.removeChild(script);              // 移除 script 标签
  };
}

// 使用 JSONP
// 注意：handleData 必须是全局函数
jsonp('http://api.example.com/data', 'handleData');
```

### 12.4.4 WebSocket（不受同源策略限制）

WebSocket 协议不受同源策略限制，可以直接跨域通信：

```javascript
// 创建 WebSocket 连接（可以跨域）
const ws = new WebSocket('ws://api.example.com/socket');  // 连接到 WebSocket 服务器

// 监听连接成功
ws.onopen = () => {
  console.log('WebSocket 连接成功');       // 连接成功回调
  ws.send('你好，服务器');                  // 发送消息
};

// 监听收到消息
ws.onmessage = (event) => {
  console.log('收到消息：', event.data);    // 打印服务器返回的消息
};

// 监听连接关闭
ws.onclose = () => {
  console.log('WebSocket 连接关闭');       // 连接关闭回调
};

// 监听错误
ws.onerror = (error) => {
  console.error('WebSocket 错误：', error); // 错误回调
};
```

### 12.4.5 postMessage（窗口间通信）

用于不同窗口、iframe 之间的跨域通信：

```javascript
// 发送方：向 iframe 发送消息
const iframe = document.getElementById('myIframe');  // 获取 iframe 元素
iframe.contentWindow.postMessage(
  '你好，iframe',                                     // 要发送的数据
  'http://target.com'                                // 目标源的地址（不要用 *）
);

// 接收方：监听消息事件
window.addEventListener('message', (event) => {
  // 验证消息来源（安全检查）
  if (event.origin === 'http://sender.com') {        // 检查来源是否可信
    console.log('收到消息：', event.data);            // 打印消息内容
    
    // 回复消息
    event.source.postMessage('收到！', event.origin); // 回复发送方
  }
});
```

---

## 5 对比表格：跨域方案全面对比

| 方案 | 原理 | 支持方法 | 安全性 | 兼容性 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| CORS | 服务器设置响应头 | 所有方法 | 高 | 好（现代浏览器） | 生产环境（推荐） |
| 代理服务器 | 开发服务器转发 | 所有方法 | 高 | 好 | 开发环境（推荐） |
| JSONP | script 标签 | 仅 GET | 低 | 好（所有浏览器） | 老旧系统兼容 |
| WebSocket | ws/wss 协议 | 双向通信 | 高 | 好 | 实时通信 |
| postMessage | 窗口间消息传递 | - | 中 | 好 | iframe 通信 |
| Nginx 反向代理 | 服务器转发 | 所有方法 | 高 | 好 | 生产环境 |

---

## 6 凭证与跨域

### 12.6.1 携带 Cookie 跨域

默认情况下，跨域请求不携带 Cookie。如果需要携带 Cookie，需要客户端和服务器同时配置：

```javascript
// 客户端：fetch 携带 Cookie
fetch('http://api.example.com/data', {
  credentials: 'include'  // 告诉浏览器携带 Cookie
})
  .then(response => response.json())  // 解析响应
  .then(data => console.log(data));   // 打印数据
```

```javascript
// 客户端：axios 携带 Cookie
import axios from 'axios';

// 设置 axios 默认携带 Cookie
axios.defaults.withCredentials = true;  // 所有请求都携带 Cookie

// 或者单个请求设置
axios.get('http://api.example.com/data', {
  withCredentials: true  // 这个请求携带 Cookie
});
```

```http
# 服务器端：允许携带 Cookie
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://example.com
```

**注意：** 携带 Cookie 时，`Access-Control-Allow-Origin` 不能为 `*`，必须指定具体的源。

---

## 7 新手常见误区

### 误区 1："跨域请求根本没发到服务器"

**错！** 跨域请求实际上已经发送到了服务器，服务器也返回了响应，只是浏览器在收到响应后检查 CORS 头部，发现不允许跨域访问，就把响应拦截了。

```
浏览器                        服务器
  |--- 跨域请求 ------------->|  请求已经发出
  |                            |  服务器正常处理
  |<-- 200 OK ----------------|  服务器返回了数据
  |                            |
  |  浏览器检查 CORS 头部      |
  |  发现没有 Access-Control-Allow-Origin
  |  拦截响应，报错            |
```

### 误区 2："Access-Control-Allow-Origin 设置为 * 最方便"

**方便但不安全！** 设置为 `*` 意味着任何网站都可以访问你的 API。

```javascript
// 错误写法：任何源都可以访问
res.header('Access-Control-Allow-Origin', '*');

// 正确写法：只允许特定源
const allowedOrigins = ['https://example.com', 'https://app.example.com'];
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.header('Access-Control-Allow-Origin', origin);
}
```

### 误区 3："开发环境代理能解决生产环境的跨域"

**错！** 开发环境的代理（如 Vite proxy）只在开发时有效，生产环境需要：

- 服务器配置 CORS 响应头
- 或者使用 Nginx 反向代理
- 或者前后端部署在同源下

### 误区 4："JSONP 是解决跨域的最佳方案"

**错！** JSONP 有很多缺点：

- 只支持 GET 请求
- 不安全（可能遭受 XSS 攻击）
- 错误处理困难
- 现代浏览器已经不需要 JSONP

建议：使用 CORS 替代 JSONP。

### 误区 5："跨域请求不能携带 Cookie"

**错！** 跨域请求可以携带 Cookie，但需要：

- 客户端设置 `credentials: 'include'`（fetch）或 `withCredentials: true`（axios）
- 服务器设置 `Access-Control-Allow-Credentials: true`
- 服务器 `Access-Control-Allow-Origin` 不能为 `*`

---

## 8 动手练习

### 练习 1：基础练习

判断以下 URL 对是否同源，并说明原因：

```
URL 对 1：
  http://example.com/page1
  http://example.com/page2

URL 对 2：
  http://example.com/page1
  https://example.com/page1

URL 对 3：
  http://example.com/page1
  http://example.com:8080/page1

URL 对 4：
  http://example.com/page1
  http://api.example.com/page1
```

<details>
<summary>点击查看答案</summary>

```
URL 对 1：同源
  原因：协议（http）、域名（example.com）、端口（80）都相同

URL 对 2：不同源
  原因：协议不同（http vs https）

URL 对 3：不同源
  原因：端口不同（80 vs 8080）

URL 对 4：不同源
  原因：域名不同（example.com vs api.example.com）
```

</details>

### 练习 2：进阶练习

你的前端运行在 `http://localhost:3000`，后端 API 在 `http://localhost:8080`。请写出完整的 CORS 配置代码（Express 服务器端），满足以下要求：

- 允许 `http://localhost:3000` 跨域访问
- 允许 GET、POST、PUT、DELETE 方法
- 允许 Content-Type 和 Authorization 头部
- 允许携带 Cookie
- 预检请求缓存 1 天

<details>
<summary>点击查看答案</summary>

```javascript
// Express CORS 配置
app.use((req, res, next) => {
  // 获取请求的 Origin
  const origin = req.headers.origin;
  
  // 只允许 localhost:3000
  if (origin === 'http://localhost:3000') {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  // 允许携带 Cookie
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 允许的 HTTP 方法
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  
  // 允许的请求头
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 预检请求缓存 1 天（86400 秒）
  res.header('Access-Control-Max-Age', '86400');
  
  // OPTIONS 预检请求直接返回
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

</details>

### 练习 3（挑战）：综合练习

请解释以下场景的跨域问题，并给出解决方案：

```
场景：
- 前端部署在 https://www.example.com
- 后端 API 在 https://api.example.com
- 用户需要登录后才能访问 API
- 登录状态通过 Cookie 维护

问题：
1. 前端请求 API 会遇到什么问题？
2. 如何解决跨域问题？
3. 如何让请求携带 Cookie？
4. 服务器端需要怎么配置？
```

<details>
<summary>点击查看答案</summary>

```
问题分析：
1. 前端和后端域名不同（www.example.com vs api.example.com），属于跨域请求
2. 需要携带 Cookie 来维持登录状态

解决方案：

步骤 1：服务器端配置 CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://www.example.com'];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);  // 不能用 *
    res.header('Access-Control-Allow-Credentials', 'true');  // 允许携带 Cookie
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

步骤 2：服务器 Cookie 配置
// Cookie 的 SameSite 属性需要设置为 None（跨域必须）
// Cookie 的 Secure 属性需要设置为 true（HTTPS 必须）
res.cookie('session', 'abc123', {
  sameSite: 'none',    // 跨域 Cookie 必须设置为 none
  secure: true,        // HTTPS 必须设置为 true
  httpOnly: true,      // 防止 XSS
  maxAge: 3600000      // 1 小时过期
});

步骤 3：前端请求配置
// fetch 方式
fetch('https://api.example.com/user/info', {
  credentials: 'include',  // 携带 Cookie
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));

// axios 方式
axios.get('https://api.example.com/user/info', {
  withCredentials: true  // 携带 Cookie
});
```

</details>

---

## 下一章预告

恭喜你完成了浏览器与网络基础教程的全部章节！从第九章到第十二章，我们学习了浏览器渲染流程、HTTP/2 与 HTTP/3、浏览器缓存机制和跨域与 CORS。这些知识是前端开发的基础，理解它们能帮助你写出性能更好、更安全的代码。接下来，你可以回顾前面的章节，或者开始学习 Vue 3 的进阶内容。
