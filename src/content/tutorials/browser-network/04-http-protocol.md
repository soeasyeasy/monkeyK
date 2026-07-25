---
title: "第四章：HTTP 协议详解"
description: "深入理解 HTTP 请求方法、状态码、请求响应结构及 HTTPS 原理"
---

# 第四章：HTTP 协议详解

## 本章导读

在开始学习 HTTP 协议之前，你可能会有这些疑问：

- HTTP 到底是什么？为什么前端开发天天都要跟它打交道？
- GET 和 POST 到底有什么区别？什么时候该用哪个？
- 看到 404、500 这些状态码，只知道是"出错了"，但不知道具体含义
- HTTP 请求和响应的结构是什么样的？怎么查看和调试？

这一章会带你彻底搞懂 HTTP 协议。我们会从 HTTP 的基本概念讲起，了解请求方法、状态码、请求和响应的结构，最后还会介绍 HTTPS 和 HTTP/2 的新特性。掌握这些知识，你就能更好地调试接口、理解网络问题，面试时也能对答如流。

---

## 4.1 为什么需要学习 HTTP 协议？

### 痛点分析

很多前端开发者会遇到这些问题：

- 接口调用失败了，控制台报了一堆错误，但看不懂是什么意思
- 面试官问"GET 和 POST 的区别"，你只能说"参数位置不一样"
- 调试接口时，不知道请求发出去没有，也不知道服务器返回了什么
- 看到 304 状态码，不知道是缓存还是出错

这些问题的根源，都在于对 HTTP 协议不了解。不懂 HTTP，就像你不会外语却要去国外谈生意——完全不知道怎么沟通。

### 了解 HTTP 的价值

打个比方：HTTP 协议就像你和服务器之间的"对话规则"。

你去餐厅吃饭，需要遵循一定的规则：

1. 你先看菜单点菜（发请求）
2. 服务员记下你的订单（服务器接收）
3. 厨房做菜（服务器处理）
4. 服务员把菜端给你（返回响应）
5. 你检查菜品是否正确（处理响应）

HTTP 协议也是这样：浏览器按照固定格式发请求，服务器按照固定格式返回响应。了解这个格式，你就能：

- 看懂请求和响应的内容，快速定位问题
- 知道什么情况下该用什么请求方法
- 理解状态码的含义，判断问题出在哪一方
- 优化网络请求，提升页面性能

> 一句话总结：HTTP 是前端开发的基础，不懂 HTTP 就无法真正理解 Web 开发。

---

## 4.2 核心原理：HTTP 协议是什么？

### HTTP 的基本概念

HTTP（HyperText Transfer Protocol）是**超文本传输协议**，用于在浏览器和服务器之间传输数据。

"超文本"就是网页内容（HTML、图片、视频等），"传输协议"就是传输数据时遵循的规则。

打个比方：HTTP 就像快递公司的服务规则——你按照规则打包（发请求），快递公司按照规则送货（返回响应）。

### HTTP 的四大特点

| 特点 | 含义 | 生活类比 |
| --- | --- | --- |
| 无状态 | 服务器不记得你是谁，每次请求都是独立的 | 自动售货机：投币出货，不记得上次谁来过 |
| 无连接 | 每次请求都要重新建立连接，用完就断 | 打电话：每次都要拨号，挂断后连接断开 |
| 请求-响应 | 客户端主动发请求，服务器被动返回响应 | 你去餐厅点菜，服务员端菜给你 |
| 明文传输 | 数据没有加密，任何人都能看懂（HTTPS 加密） | 寄明信片：内容公开，谁都能看 |

### 无状态是什么意思？

HTTP 是"无状态"的，意思是服务器不会记住你是谁。你第一次访问网站和第二次访问，服务器看待你就像两个不同的人。

这带来一个问题：你怎么登录？服务器怎么知道你已经付过钱了？

解决方案是使用 **Cookie** 和 **Session**：

- Cookie：服务器在你的浏览器里放一个小纸条，下次请求时带上
- Session：服务器给你一个"会员卡"（Session ID），每次出示会员卡就行

打个比方：HTTP 无状态就像你去便利店买东西，店员不记得你。但如果你办了会员卡（Session），每次出示会员卡，店员就知道你是老顾客了。

---

## 4.3 HTTP 请求方法：GET、POST 等

### 什么是请求方法？

HTTP 定义了多种"请求方法"，表示你想对服务器上的资源做什么操作。就像你去餐厅，可以说"我要点菜"、"我要结账"、"我要看菜单"，每种说法代表不同的意图。

### 常用请求方法详解

| 方法 | 用途 | 特点 | 生活类比 |
| --- | --- | --- | --- |
| GET | 获取资源 | 幂等，可缓存，参数在 URL | 看菜单，点一道菜 |
| POST | 提交数据 | 非幂等，不可缓存，参数在请求体 | 下单做菜 |
| PUT | 更新资源（完整替换） | 幂等，整体替换 | 把整道菜换掉 |
| PATCH | 更新资源（部分修改） | 非幂等，只改一部分 | 只换菜里的某个配料 |
| DELETE | 删除资源 | 幂等 | 把菜退掉 |
| HEAD | 只获取响应头 | 不返回响应体 | 只看菜单，不要菜 |
| OPTIONS | 查询支持的方法 | 用于跨域预检 | 问服务员"你们支持哪些服务" |

### 什么是幂等性？

"幂等"的意思是：不管执行多少次，结果都一样。

- GET 是幂等的：查询 1 次和查询 100 次，结果一样
- DELETE 是幂等的：删除 1 次和删除 100 次，资源都没了（第一次就删了）
- POST 不是幂等的：提交 1 次创建 1 条数据，提交 100 次创建 100 条

打个比方：GET 像看菜单，看多少次菜单都不会改变什么；POST 像点菜，点一次就多一道菜。

### GET vs POST 详细对比

| 对比项 | GET | POST |
| --- | --- | --- |
| 用途 | 获取数据 | 提交数据 |
| 参数位置 | URL 中（?key=value） | 请求体中 |
| 数据长度 | 受限（URL 长度限制，约 2KB） | 无限制 |
| 安全性 | 较低（参数在 URL 中可见） | 较高（参数在请求体中） |
| 缓存 | 可被缓存 | 默认不缓存 |
| 幂等性 | 幂等 | 非幂等 |
| 书签 | 可收藏 | 不可收藏 |
| 浏览器回退 | 无影响 | 会重新提交 |

### 什么时候用 GET，什么时候用 POST？

| 场景 | 推荐方法 | 原因 |
| --- | --- | --- |
| 查询文章列表 | GET | 只是获取数据，不修改服务器 |
| 搜索商品 | GET | 搜索条件在 URL 中，方便分享 |
| 用户登录 | POST | 密码等敏感信息不应在 URL 中 |
| 提交表单 | POST | 数据量可能较大 |
| 上传文件 | POST | 文件数据放在请求体中 |
| 删除用户 | DELETE（或 POST） | 语义上应该用 DELETE |

---

## 4.4 HTTP 状态码：服务器想告诉你什么？

### 什么是状态码？

服务器处理完你的请求后，会返回一个"状态码"，告诉你请求的结果。就像你去餐厅点菜，服务员会告诉你"好的"（200）、"这道菜没了"（404）、"厨房着火了"（500）。

### 状态码分类

| 范围 | 类别 | 含义 | 生活类比 |
| --- | --- | --- | --- |
| 1xx | 信息性 | 请求已接收，继续处理 | "我听到你说的了，稍等" |
| 2xx | 成功 | 请求成功处理 | "好的，马上给你" |
| 3xx | 重定向 | 需要进一步操作 | "这道菜换了个地方，去那边点" |
| 4xx | 客户端错误 | 请求有误 | "你说的菜我们没有" |
| 5xx | 服务器错误 | 服务器处理失败 | "厨房出问题了，做不了" |

### 常见状态码详解

#### 2xx 成功类

| 状态码 | 含义 | 场景 |
| --- | --- | --- |
| 200 OK | 请求成功 | 最常见的成功状态 |
| 201 Created | 资源创建成功 | POST 创建新用户后返回 |
| 204 No Content | 成功但无内容 | DELETE 删除成功后返回 |

#### 3xx 重定向类

| 状态码 | 含义 | 场景 |
| --- | --- | --- |
| 301 Moved Permanently | 永久重定向 | 网站换域名，SEO 友好 |
| 302 Found | 临时重定向 | 临时跳转到其他页面 |
| 304 Not Modified | 资源未修改 | 使用缓存，节省带宽 |

#### 4xx 客户端错误类

| 状态码 | 含义 | 场景 | 解决方法 |
| --- | --- | --- | --- |
| 400 Bad Request | 请求格式错误 | 参数格式不对 | 检查请求参数 |
| 401 Unauthorized | 未认证 | 未登录或 token 过期 | 重新登录 |
| 403 Forbidden | 无权限 | 登录了但没权限访问 | 联系管理员 |
| 404 Not Found | 资源不存在 | URL 写错了 | 检查 URL 路径 |
| 405 Method Not Allowed | 方法不允许 | 用 GET 请求了 POST 接口 | 换请求方法 |
| 429 Too Many Requests | 请求过多 | 请求频率太高 | 降低请求频率 |

#### 5xx 服务器错误类

| 状态码 | 含义 | 场景 | 解决方法 |
| --- | --- | --- | --- |
| 500 Internal Server Error | 服务器内部错误 | 代码报错了 | 联系后端开发 |
| 502 Bad Gateway | 网关错误 | 代理服务器出错 | 联系运维 |
| 503 Service Unavailable | 服务不可用 | 服务器过载或维护 | 稍后重试 |
| 504 Gateway Timeout | 网关超时 | 上游服务器响应太慢 | 联系运维 |

### 状态码速记口诀

- 2xx：成功啦！
- 3xx：去别处找！
- 4xx：你（客户端）的错！
- 5xx：我（服务器）的错！

---

## 4.5 HTTP 请求和响应的结构

### HTTP 请求的三部分

一个 HTTP 请求由三部分组成：

```
请求行（Request Line）
请求头（Request Headers）
请求体（Request Body）
```

#### 请求行

请求行包含三个部分：

```
GET /api/users?page=1 HTTP/1.1
```

- 方法：GET（请求方法）
- 路径：/api/users?page=1（请求的资源路径和参数）
- 协议版本：HTTP/1.1

#### 请求头

请求头是"键值对"格式，告诉服务器一些额外信息：

```
Host: www.example.com          // 目标主机
User-Agent: Mozilla/5.0        // 客户端信息（浏览器类型）
Accept: application/json       // 期望的响应格式
Content-Type: application/json // 请求体的格式
Cookie: token=abc123           // 携带的 Cookie
```

#### 请求体

请求体只在 POST、PUT 等方法中有，GET 请求没有请求体：

```json
{
  "username": "zhangsan",
  "password": "123456"
}
```

### 完整的 GET 请求示例

```
GET /api/users?page=1&limit=10 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

```

逐行解释：

- 第 1 行：请求行，GET 方法，请求 /api/users，参数 page=1&limit=10
- 第 2 行：Host 头，指定目标主机
- 第 3 行：User-Agent 头，告诉服务器我是谁（什么浏览器）
- 第 4 行：Accept 头，告诉服务器我能处理什么格式
- 第 5 行：Authorization 头，携带认证 token
- 第 6 行：空行，表示请求头结束（GET 请求没有请求体）

### 完整的 POST 请求示例

```
POST /api/users HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Content-Type: application/json
Content-Length: 45

{
  "username": "zhangsan",
  "password": "123456"
}
```

逐行解释：

- 第 1 行：请求行，POST 方法，请求 /api/users
- 第 2 行：Host 头，指定目标主机
- 第 3 行：User-Agent 头，客户端信息
- 第 4 行：Content-Type 头，告诉服务器请求体是 JSON 格式
- 第 5 行：Content-Length 头，请求体长度（字节数）
- 第 6 行：空行，表示请求头结束
- 第 7-10 行：请求体，JSON 格式的用户数据

### HTTP 响应的三部分

HTTP 响应也由三部分组成：

```
状态行（Status Line）
响应头（Response Headers）
响应体（Response Body）
```

#### 状态行

```
HTTP/1.1 200 OK
```

- 协议版本：HTTP/1.1
- 状态码：200
- 状态描述：OK

#### 响应头

```
Content-Type: application/json    // 响应体格式
Content-Length: 123               // 响应体长度
Cache-Control: max-age=3600       // 缓存控制
Set-Cookie: sessionId=abc123      // 设置 Cookie
```

#### 响应体

```json
{
  "id": 1,
  "username": "zhangsan",
  "email": "zhangsan@example.com"
}
```

### 完整的响应示例

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 67
Cache-Control: no-cache
Date: Sat, 25 Jul 2026 10:00:00 GMT

{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "zhangsan"
  }
}
```

逐行解释：

- 第 1 行：状态行，HTTP/1.1 协议，200 状态码，OK 描述
- 第 2 行：Content-Type 头，响应体是 JSON 格式
- 第 3 行：Content-Length 头，响应体长度 67 字节
- 第 4 行：Cache-Control 头，不缓存
- 第 5 行：Date 头，响应时间
- 第 6 行：空行，表示响应头结束
- 第 7-13 行：响应体，JSON 格式的数据

---

## 4.6 基础用法：用代码实践 HTTP 请求

### 使用 fetch 发起 GET 请求

```javascript
// 使用 fetch API 发起 GET 请求
// fetch 是现代浏览器提供的网络请求 API，返回 Promise

// 发起 GET 请求到指定 URL
fetch('https://jsonplaceholder.typicode.com/posts/1')
  // 第一个 then：接收响应对象
  .then(response => {
    // response.ok 检查状态码是否在 200-299 范围内
    if (!response.ok) {
      // 如果状态码不在成功范围，抛出错误
      throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    }
    // 将响应体解析为 JSON 格式
    // response.json() 返回一个 Promise
    return response.json();
  })
  // 第二个 then：处理解析后的数据
  .then(data => {
    // 在控制台输出获取到的数据
    console.log('获取到的数据:', data);
    // 输出示例: { userId: 1, id: 1, title: "...", body: "..." }
  })
  // catch：捕获并处理错误
  .catch(error => {
    // 输出错误信息
    console.error('请求失败:', error);
    // 常见错误：网络断开、跨域问题、服务器错误等
  });
```

### 使用 fetch 发起 POST 请求

```javascript
// 使用 fetch 发起 POST 请求
// 需要配置请求方法、请求头、请求体

// 准备要发送的数据
const userData = {
  username: 'zhangsan',      // 用户名
  email: 'zhangsan@example.com', // 邮箱
  password: '123456'         // 密码
};

// 发起 POST 请求
fetch('https://jsonplaceholder.typicode.com/posts', {
  // 配置对象
  method: 'POST',            // 请求方法：POST
  headers: {
    // 请求头：指定内容类型为 JSON
    'Content-Type': 'application/json',
    // 如果有 token，在这里添加
    // 'Authorization': 'Bearer your-token-here'
  },
  // 请求体：将对象转换为 JSON 字符串
  body: JSON.stringify(userData)
})
  // 接收响应
  .then(response => {
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    }
    // 解析响应为 JSON
    return response.json();
  })
  // 处理响应数据
  .then(data => {
    // 输出创建成功的资源
    console.log('创建成功:', data);
    // 输出示例: { id: 101, username: "zhangsan", ... }
  })
  // 捕获错误
  .catch(error => {
    // 输出错误信息
    console.error('请求失败:', error);
  });
```

### 使用 async/await 简化代码

```javascript
// 使用 async/await 语法让异步代码看起来像同步代码
// 这是目前最推荐的写法

// 定义一个异步函数
async function fetchUserData() {
  try {
    // 发起 GET 请求，await 等待响应
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    
    // 检查响应状态
    if (!response.ok) {
      // 如果失败，抛出错误
      throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    }
    
    // 解析 JSON，await 等待解析完成
    const data = await response.json();
    
    // 输出数据
    console.log('获取到的数据:', data);
    
    // 返回数据，供其他地方使用
    return data;
  } catch (error) {
    // 捕获并处理错误
    console.error('请求失败:', error);
    // 可以返回默认值或抛出错误
    throw error;
  }
}

// 调用异步函数
fetchUserData();
```

### 封装一个通用的请求函数

```javascript
// 封装一个通用的 HTTP 请求函数
// 避免重复代码，统一处理错误

/**
 * 发起 HTTP 请求
 * @param {string} url - 请求的 URL
 * @param {object} options - 配置选项
 * @param {string} options.method - 请求方法，默认 'GET'
 * @param {object} options.headers - 请求头
 * @param {object} options.body - 请求体（POST/PUT 时使用）
 * @returns {Promise} 返回 Promise 对象
 */
async function request(url, options = {}) {
  // 设置默认配置
  const config = {
    method: options.method || 'GET',      // 默认 GET 方法
    headers: {
      'Content-Type': 'application/json', // 默认 JSON 格式
      ...options.headers                  // 合并自定义请求头
    }
  };
  
  // 如果有请求体，转换为 JSON 字符串
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  
  try {
    // 发起请求
    const response = await fetch(url, config);
    
    // 检查响应状态
    if (!response.ok) {
      // 根据状态码抛出不同的错误信息
      const errorMessages = {
        400: '请求参数错误',
        401: '未授权，请重新登录',
        403: '拒绝访问',
        404: '请求资源不存在',
        500: '服务器内部错误',
        502: '网关错误',
        503: '服务不可用'
      };
      
      // 获取错误信息，如果没有则使用默认信息
      const message = errorMessages[response.status] || `请求失败: ${response.status}`;
      throw new Error(message);
    }
    
    // 解析响应
    const data = await response.json();
    
    // 返回数据
    return data;
  } catch (error) {
    // 输出错误日志
    console.error('请求错误:', error);
    // 抛出错误，让调用者处理
    throw error;
  }
}

// 使用示例 1：GET 请求
async function getUser() {
  try {
    // 调用封装的函数
    const data = await request('https://jsonplaceholder.typicode.com/posts/1');
    // 处理数据
    console.log('用户数据:', data);
  } catch (error) {
    // 处理错误
    console.error('获取失败:', error);
  }
}

// 使用示例 2：POST 请求
async function createUser() {
  try {
    // 调用封装的函数，传入配置
    const data = await request('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',                    // 指定方法
      body: {                            // 请求体
        username: 'zhangsan',
        email: 'zhangsan@example.com'
      }
    });
    // 处理数据
    console.log('创建成功:', data);
  } catch (error) {
    // 处理错误
    console.error('创建失败:', error);
  }
}

// 执行示例
getUser();
createUser();
```

---

## 4.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| HTTP 特点 | 无状态、无连接、请求-响应、明文传输 |
| GET 方法 | 获取数据，参数在 URL，可缓存，幂等 |
| POST 方法 | 提交数据，参数在请求体，不可缓存，非幂等 |
| 状态码分类 | 1xx 信息、2xx 成功、3xx 重定向、4xx 客户端错误、5xx 服务器错误 |
| 常见状态码 | 200 成功、404 未找到、500 服务器错误 |
| 请求结构 | 请求行 + 请求头 + 请求体 |
| 响应结构 | 状态行 + 响应头 + 响应体 |
| fetch API | 现代浏览器提供的网络请求 API，返回 Promise |
| async/await | 让异步代码看起来像同步代码的语法糖 |

---

## 4.8 新手常见误区

### 误区 1："GET 和 POST 只是参数位置不同"

**不完全对！** 虽然参数位置是最明显的区别，但两者还有更多差异：

- GET 请求会被浏览器缓存，POST 不会
- GET 请求有长度限制（URL 长度限制），POST 没有
- GET 请求是幂等的，POST 不是
- GET 请求可以收藏为书签，POST 不行
- GET 请求在浏览器回退时无影响，POST 会提示重新提交

正确做法：根据语义选择方法。获取数据用 GET，提交数据用 POST。

### 误区 2："POST 比 GET 更安全"

**错！** HTTP 是明文传输的，不管用 GET 还是 POST，数据都能被截获。POST 的参数在请求体中，看起来"隐藏"了，但实际上抓包工具一样能看到。

真正的安全应该用 HTTPS 加密，而不是依赖 GET 或 POST。

正确做法：敏感数据（密码、token）应该用 HTTPS 传输，而不是依赖 POST "隐藏"。

### 误区 3："状态码 200 就代表成功，其他都是失败"

**错！** 2xx 系列的状态码都代表成功：

- 200：成功，返回数据
- 201：创建成功
- 204：成功但无内容

3xx 代表重定向，4xx 代表客户端错误，5xx 代表服务器错误。

正确做法：根据状态码范围判断，2xx 都是成功，其他范围有不同含义。

### 误区 4："请求头不重要，可以随便写"

**错！** 请求头告诉服务器很多重要信息：

- Content-Type：告诉服务器请求体是什么格式（JSON、表单等）
- Authorization：携带认证 token
- Accept：告诉服务器你能处理什么格式
- Cookie：携带用户身份信息

如果请求头写错了，服务器可能无法正确解析你的请求。

正确做法：根据请求内容正确设置请求头，特别是 Content-Type 和 Authorization。

### 误区 5："fetch 报错就是网络错误"

**不完全对！** fetch 只在以下情况会 reject：

- 网络断开
- DNS 解析失败
- 跨域问题

如果服务器返回 404、500 等错误状态码，fetch 仍然会 resolve，只是 response.ok 为 false。

正确做法：检查 response.ok 判断请求是否成功，而不是只依赖 catch。

---

## 4.9 动手练习

### 练习 1（基础）：查看 HTTP 请求和响应

打开浏览器的开发者工具（F12），切换到 Network（网络）标签页，访问任意网站（如 https://www.baidu.com），观察并记录：

1. 请求行中的方法、路径、协议版本
2. 至少 3 个请求头及其含义
3. 响应状态行中的状态码和描述
4. 至少 3 个响应头及其含义

<details>
<summary>点击查看答案</summary>

**预期观察结果**（以百度为例）：

1. **请求行**：
```
GET / HTTP/1.1
```
- 方法：GET
- 路径：/
- 协议版本：HTTP/1.1

2. **请求头**（至少 3 个）：
```
Host: www.baidu.com              // 目标主机
User-Agent: Mozilla/5.0          // 浏览器信息
Accept: text/html                // 接受 HTML 格式
Accept-Language: zh-CN           // 接受中文
Accept-Encoding: gzip, deflate   // 支持的压缩格式
```

3. **响应状态行**：
```
HTTP/1.1 200 OK
```
- 状态码：200
- 描述：OK

4. **响应头**（至少 3 个）：
```
Content-Type: text/html          // 响应体格式
Content-Length: 1234             // 响应体长度
Cache-Control: no-cache          // 不缓存
Set-Cookie: BAIDUID=xxx          // 设置 Cookie
Server: BWS/1.1                  // 服务器类型
```

</details>

### 练习 2（进阶）：使用 fetch 实现 CRUD

使用 fetch API 实现对 https://jsonplaceholder.typicode.com/posts 的增删改查操作：

1. 查询所有文章（GET）
2. 查询单篇文章（GET）
3. 创建新文章（POST）
4. 更新文章（PUT）
5. 删除文章（DELETE）

<details>
<summary>点击查看答案</summary>

```javascript
// 基础 URL
const baseUrl = 'https://jsonplaceholder.typicode.com/posts';

// 1. 查询所有文章（GET）
async function getAllPosts() {
  try {
    // 发起 GET 请求
    const response = await fetch(baseUrl);
    // 检查响应状态
    if (!response.ok) throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    // 解析 JSON
    const posts = await response.json();
    // 输出结果
    console.log('所有文章:', posts);
    // 返回数据
    return posts;
  } catch (error) {
    // 处理错误
    console.error('获取失败:', error);
  }
}

// 2. 查询单篇文章（GET）
async function getPostById(id) {
  try {
    // 发起 GET 请求，URL 中包含 ID
    const response = await fetch(`${baseUrl}/${id}`);
    // 检查响应状态
    if (!response.ok) throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    // 解析 JSON
    const post = await response.json();
    // 输出结果
    console.log(`文章 ${id}:`, post);
    // 返回数据
    return post;
  } catch (error) {
    // 处理错误
    console.error('获取失败:', error);
  }
}

// 3. 创建新文章（POST）
async function createPost(data) {
  try {
    // 发起 POST 请求
    const response = await fetch(baseUrl, {
      method: 'POST',                    // 指定方法
      headers: {
        'Content-Type': 'application/json' // 指定内容类型
      },
      body: JSON.stringify(data)         // 请求体
    });
    // 检查响应状态
    if (!response.ok) throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    // 解析 JSON
    const post = await response.json();
    // 输出结果
    console.log('创建成功:', post);
    // 返回数据
    return post;
  } catch (error) {
    // 处理错误
    console.error('创建失败:', error);
  }
}

// 4. 更新文章（PUT）
async function updatePost(id, data) {
  try {
    // 发起 PUT 请求
    const response = await fetch(`${baseUrl}/${id}`, {
      method: 'PUT',                     // 指定方法
      headers: {
        'Content-Type': 'application/json' // 指定内容类型
      },
      body: JSON.stringify(data)         // 请求体
    });
    // 检查响应状态
    if (!response.ok) throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    // 解析 JSON
    const post = await response.json();
    // 输出结果
    console.log('更新成功:', post);
    // 返回数据
    return post;
  } catch (error) {
    // 处理错误
    console.error('更新失败:', error);
  }
}

// 5. 删除文章（DELETE）
async function deletePost(id) {
  try {
    // 发起 DELETE 请求
    const response = await fetch(`${baseUrl}/${id}`, {
      method: 'DELETE'                   // 指定方法
    });
    // 检查响应状态
    if (!response.ok) throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    // 输出结果
    console.log(`文章 ${id} 删除成功`);
  } catch (error) {
    // 处理错误
    console.error('删除失败:', error);
  }
}

// 测试所有操作
async function test() {
  // 查询所有
  await getAllPosts();
  // 查询单个
  await getPostById(1);
  // 创建
  await createPost({ title: '新文章', body: '内容', userId: 1 });
  // 更新
  await updatePost(1, { title: '更新后的标题', body: '更新后的内容', userId: 1 });
  // 删除
  await deletePost(1);
}

// 执行测试
test();
```

</details>

### 练习 3（挑战）：封装一个完整的 HTTP 客户端

封装一个功能完整的 HTTP 客户端，要求：

1. 支持 GET、POST、PUT、DELETE 方法
2. 支持设置请求头（如 token）
3. 统一处理错误（根据状态码返回不同错误信息）
4. 支持请求拦截器（如添加 token）
5. 支持响应拦截器（如统一处理数据格式）

<details>
<summary>点击查看答案</summary>

```javascript
// 封装一个完整的 HTTP 客户端

class HttpClient {
  // 构造函数
  constructor(baseURL = '') {
    // 基础 URL
    this.baseURL = baseURL;
    // 默认请求头
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
    // 请求拦截器数组
    this.requestInterceptors = [];
    // 响应拦截器数组
    this.responseInterceptors = [];
  }
  
  // 设置默认请求头
  setHeader(key, value) {
    // 设置请求头
    this.defaultHeaders[key] = value;
  }
  
  // 添加请求拦截器
  addRequestInterceptor(interceptor) {
    // 将拦截器添加到数组中
    this.requestInterceptors.push(interceptor);
  }
  
  // 添加响应拦截器
  addResponseInterceptor(interceptor) {
    // 将拦截器添加到数组中
    this.responseInterceptors.push(interceptor);
  }
  
  // 执行请求拦截器
  async runRequestInterceptors(config) {
    // 遍历所有拦截器
    for (const interceptor of this.requestInterceptors) {
      // 执行拦截器，传入配置
      config = await interceptor(config);
    }
    // 返回处理后的配置
    return config;
  }
  
  // 执行响应拦截器
  async runResponseInterceptors(response) {
    // 遍历所有拦截器
    for (const interceptor of this.responseInterceptors) {
      // 执行拦截器，传入响应
      response = await interceptor(response);
    }
    // 返回处理后的响应
    return response;
  }
  
  // 核心请求方法
  async request(url, options = {}) {
    // 合并 URL
    const fullURL = this.baseURL + url;
    
    // 准备配置
    let config = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };
    
    // 如果有请求体，转换为 JSON
    if (options.body) {
      config.body = JSON.stringify(options.body);
    }
    
    // 执行请求拦截器
    config = await this.runRequestInterceptors(config);
    
    try {
      // 发起请求
      let response = await fetch(fullURL, config);
      
      // 执行响应拦截器
      response = await this.runResponseInterceptors(response);
      
      // 检查响应状态
      if (!response.ok) {
        // 根据状态码返回不同错误
        const errorMessages = {
          400: '请求参数错误',
          401: '未授权，请重新登录',
          403: '拒绝访问',
          404: '请求资源不存在',
          500: '服务器内部错误',
          502: '网关错误',
          503: '服务不可用'
        };
        
        // 获取错误信息
        const message = errorMessages[response.status] || `请求失败: ${response.status}`;
        // 创建错误对象
        const error = new Error(message);
        // 附加状态码
        error.status = response.status;
        // 附加响应对象
        error.response = response;
        // 抛出错误
        throw error;
      }
      
      // 解析响应
      const data = await response.json();
      
      // 返回数据
      return data;
    } catch (error) {
      // 输出错误日志
      console.error('请求错误:', error);
      // 抛出错误
      throw error;
    }
  }
  
  // GET 方法
  get(url, params = {}) {
    // 拼接查询参数
    const queryString = new URLSearchParams(params).toString();
    // 如果有参数，添加到 URL 中
    const fullURL = queryString ? `${url}?${queryString}` : url;
    // 发起 GET 请求
    return this.request(fullURL, { method: 'GET' });
  }
  
  // POST 方法
  post(url, data = {}) {
    // 发起 POST 请求
    return this.request(url, {
      method: 'POST',
      body: data
    });
  }
  
  // PUT 方法
  put(url, data = {}) {
    // 发起 PUT 请求
    return this.request(url, {
      method: 'PUT',
      body: data
    });
  }
  
  // DELETE 方法
  delete(url) {
    // 发起 DELETE 请求
    return this.request(url, { method: 'DELETE' });
  }
}

// 使用示例

// 创建 HTTP 客户端实例
const http = new HttpClient('https://jsonplaceholder.typicode.com');

// 添加请求拦截器：自动添加 token
http.addRequestInterceptor(async (config) => {
  // 从 localStorage 获取 token
  const token = localStorage.getItem('token');
  // 如果有 token，添加到请求头
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  // 返回配置
  return config;
});

// 添加响应拦截器：统一处理数据格式
http.addResponseInterceptor(async (response) => {
  // 可以在这里统一处理响应
  // 例如：解密数据、转换格式等
  // 这里只是示例，直接返回
  return response;
});

// 使用示例 1：GET 请求
async function testGet() {
  try {
    // 发起 GET 请求，带查询参数
    const data = await http.get('/posts', { userId: 1, _limit: 5 });
    // 输出结果
    console.log('GET 请求成功:', data);
  } catch (error) {
    // 处理错误
    console.error('GET 请求失败:', error);
  }
}

// 使用示例 2：POST 请求
async function testPost() {
  try {
    // 发起 POST 请求
    const data = await http.post('/posts', {
      title: '新文章',
      body: '文章内容',
      userId: 1
    });
    // 输出结果
    console.log('POST 请求成功:', data);
  } catch (error) {
    // 处理错误
    console.error('POST 请求失败:', error);
  }
}

// 执行测试
testGet();
testPost();
```

</details>

---

## 下一章预告

恭喜你完成了浏览器与网络基础的前四章学习！接下来，我们会进入更实战的阶段。下一章会学习如何使用浏览器开发者工具调试网络请求、分析性能瓶颈，以及了解 HTTPS 和 HTTP/2 的新特性。这些知识能帮你写出更快、更安全的 Web 应用。
