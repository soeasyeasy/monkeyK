---
title: "第12章：网络编程基础"
description: "掌握 Socket 编程、HTTP 请求与 WebSocket 通信"
---

# 第12章：网络编程基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Socket 是什么？怎么用它实现网络通信？
- 如何用代码发送 HTTP 请求？
- WebSocket 和 HTTP 有什么区别？
- 如何实现实时通信（如聊天室）？

这一章就是为了解答这些问题。我们会先搞清楚**Socket 编程的基本原理**，再学习**HTTP 请求的编程方法**，最后理解**WebSocket 的实时通信**。

---

## 12.1 为什么需要网络编程？

### 痛点分析

如果没有网络编程：

- 应用程序无法与其他程序通信
- 无法实现客户端-服务器架构
- 无法访问远程 API 或服务
- 就像**手机没有通信功能**，只能本地使用

### 解决方案

网络编程提供了**让程序之间通过网络通信的能力**。

打个比方：

> 网络编程就像**教两个人打电话**，需要知道对方的电话号码（IP+端口），需要一种共同语言（协议），还需要听和说的能力（读写数据）。

---

## 12.2 Socket 编程

### 什么是 Socket？

**定义**：套接字，是网络通信的端点，封装了 IP 地址和端口号

**生活类比**：像**电话插口**，一端连接你的电话，一端连接电话线，通过它就能和别人通话。

### Socket 类型

| 类型 | 协议 | 特点 |
|------|------|------|
| SOCK_STREAM | TCP | 可靠、面向连接 |
| SOCK_DGRAM | UDP | 不可靠、无连接 |
| SOCK_RAW | IP | 原始套接字，可自定义协议 |

### TCP Socket 通信流程

#### 服务器端

```python
import socket

# 1. 创建 Socket 对象
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 2. 绑定 IP 和端口
server_socket.bind(('127.0.0.1', 8080))

# 3. 开始监听
server_socket.listen(5)  # 最多 5 个等待连接

# 4. 接受客户端连接
client_socket, client_address = server_socket.accept()

# 5. 接收数据
data = client_socket.recv(1024)  # 最多接收 1024 字节
print(f"收到: {data.decode()}")

# 6. 发送数据
client_socket.send("你好，客户端！".encode())

# 7. 关闭连接
client_socket.close()
server_socket.close()
```

#### 客户端

```python
import socket

# 1. 创建 Socket 对象
client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 2. 连接服务器
client_socket.connect(('127.0.0.1', 8080))

# 3. 发送数据
client_socket.send("你好，服务器！".encode())

# 4. 接收数据
data = client_socket.recv(1024)
print(f"收到: {data.decode()}")

# 5. 关闭连接
client_socket.close()
```

### UDP Socket 通信

#### 发送端

```python
import socket

# 1. 创建 UDP Socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# 2. 发送数据（不需要连接）
message = "Hello, UDP!"
sock.sendto(message.encode(), ('127.0.0.1', 8080))

# 3. 关闭
sock.close()
```

#### 接收端

```python
import socket

# 1. 创建 UDP Socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# 2. 绑定端口
sock.bind(('127.0.0.1', 8080))

# 3. 接收数据
data, address = sock.recvfrom(1024)
print(f"收到来自 {address}: {data.decode()}")

# 4. 关闭
sock.close()
```

### TCP vs UDP Socket 对比

| 对比项 | TCP Socket | UDP Socket |
|--------|-----------|-----------|
| 连接 | 需要先建立连接 | 无需连接 |
| 函数 | connect/accept | sendto/recvfrom |
| 可靠性 | 可靠 | 不可靠 |
| 顺序 | 保证顺序 | 不保证 |
| 速度 | 较慢 | 快 |

---

## 12.3 HTTP 请求编程

### 使用 Fetch API（浏览器）

```javascript
// GET 请求
fetch('https://api.example.com/users')
  .then(response => response.json())  // 解析 JSON 响应
  .then(data => console.log(data))    // 处理数据
  .catch(error => console.error(error)); // 错误处理

// POST 请求
fetch('https://api.example.com/users', {
  method: 'POST',                    // 请求方法
  headers: {
    'Content-Type': 'application/json', // 请求头
  },
  body: JSON.stringify({              // 请求体
    name: '张三',
    age: 25,
  }),
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### 使用 async/await

```javascript
// 使用 async/await 简化异步代码
async function getUsers() {
  try {
    const response = await fetch('https://api.example.com/users');
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 调用
getUsers().then(data => console.log(data));
```

### 使用 Node.js（http 模块）

```javascript
const http = require('http');

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 设置响应头
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  // 发送响应
  res.end('<h1>Hello, World!</h1>');
});

// 监听端口
server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

### 使用 axios 库

```javascript
import axios from 'axios';

// GET 请求
const response = await axios.get('https://api.example.com/users');
console.log(response.data);

// POST 请求
const response = await axios.post('https://api.example.com/users', {
  name: '张三',
  age: 25,
});
console.log(response.data);

// 带配置的请求
const response = await axios({
  method: 'get',
  url: 'https://api.example.com/users',
  timeout: 5000,          // 超时时间
  headers: {
    'Authorization': 'Bearer token123', // 认证头
  },
});
```

---

## 12.4 WebSocket 通信

### 什么是 WebSocket？

**定义**：全双工通信协议，在单个 TCP 连接上进行双向通信

**特点**：
- 全双工：双方可以同时发送和接收
- 持久连接：一次握手，持续通信
- 低延迟：无需重复建立连接

### WebSocket vs HTTP

| 对比项 | HTTP | WebSocket |
|--------|------|-----------|
| 通信方式 | 请求-响应（半双工） | 全双工 |
| 连接 | 短连接（每次新建） | 长连接（持久） |
| 延迟 | 高（每次有头部开销） | 低（数据帧小） |
| 状态 | 无状态 | 有状态 |
| 应用场景 | 网页浏览、API | 实时通信、游戏 |

### WebSocket 握手过程

```
客户端 → 服务器：
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

服务器 → 客户端：
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

### 浏览器端 WebSocket

```javascript
// 1. 创建 WebSocket 连接
const ws = new WebSocket('ws://localhost:8080');

// 2. 连接成功回调
ws.onopen = () => {
  console.log('连接已建立');
  // 发送消息
  ws.send('Hello, Server!');
};

// 3. 接收消息回调
ws.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

// 4. 连接关闭回调
ws.onclose = (event) => {
  console.log(`连接关闭: code=${event.code}, reason=${event.reason}`);
};

// 5. 错误回调
ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};

// 6. 关闭连接
// ws.close();
```

### Node.js WebSocket 服务器

```javascript
const WebSocket = require('ws');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8080 });

// 监听连接
wss.on('connection', (ws) => {
  console.log('新客户端连接');

  // 接收消息
  ws.on('message', (message) => {
    console.log('收到消息:', message.toString());

    // 广播给所有客户端
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`广播: ${message.toString()}`);
      }
    });
  });

  // 连接关闭
  ws.on('close', () => {
    console.log('客户端断开');
  });

  // 发送欢迎消息
  ws.send('欢迎连接到 WebSocket 服务器！');
});

console.log('WebSocket 服务器运行在 ws://localhost:8080');
```

---

## 12.5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Socket | 网络通信端点，封装 IP+端口 |
| TCP Socket | 面向连接，可靠传输 |
| UDP Socket | 无连接，快速传输 |
| Fetch API | 浏览器 HTTP 请求 |
| WebSocket | 全双工长连接通信 |
| HTTP vs WebSocket | 请求-响应 vs 全双工 |

---

## 12.6 新手常见误区

### 误区 1："WebSocket 就是 HTTP 的升级版"

**错！** WebSocket 和 HTTP 是不同的协议。WebSocket 通过 HTTP 握手建立连接后，切换到自己的协议，不再使用 HTTP 的请求-响应模式。

### 误区 2："Socket 就是 TCP"

不准确。Socket 是一种抽象接口，可以基于 TCP（SOCK_STREAM）也可以基于 UDP（SOCK_DGRAM）。TCP 和 UDP 是传输层协议，Socket 是编程接口。

### 误区 3："WebSocket 不需要处理断线重连"

不对。网络不稳定时 WebSocket 连接可能断开，需要在客户端实现自动重连机制，如指数退避重连策略。

### 误区 4："所有实时通信都应该用 WebSocket"

不一定。WebSocket 适合双向实时通信，但如果只是服务器推送（如通知），可以使用 SSE（Server-Sent Events）；如果是简单轮询，HTTP 短轮询也可以。

---

## 12.7 动手练习

### 练习 1：TCP Socket 编程

请用 Python 编写一个简单的 TCP 回声服务器，接收客户端消息并原样返回。

<details>
<summary>点击查看答案</summary>

```python
# 服务器端
import socket

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(('127.0.0.1', 8080))
server.listen(5)
print("服务器启动，等待连接...")

while True:
    client, addr = server.accept()
    print(f"客户端 {addr} 已连接")

    while True:
        data = client.recv(1024)
        if not data:
            break
        # 回声：原样返回
        client.send(data)

    client.close()
```

```python
# 客户端
import socket

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(('127.0.0.1', 8080))

while True:
    message = input("输入消息（输入 quit 退出）: ")
    if message == 'quit':
        break
    client.send(message.encode())
    data = client.recv(1024)
    print(f"收到回声: {data.decode()}")

client.close()
```

</details>

### 练习 2：HTTP 请求

使用 JavaScript Fetch API，实现一个函数，从 `https://jsonplaceholder.typicode.com/users` 获取用户列表，并打印每个用户的名字和邮箱。

<details>
<summary>点击查看答案</summary>

```javascript
async function fetchUsers() {
  try {
    // 发送 GET 请求
    const response = await fetch('https://jsonplaceholder.typicode.com/users');

    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status}`);
    }

    // 解析 JSON
    const users = await response.json();

    // 遍历打印
    users.forEach(user => {
      console.log(`名字: ${user.name}, 邮箱: ${user.email}`);
    });
  } catch (error) {
    console.error('请求失败:', error);
  }
}

fetchUsers();
```

</details>

### 练习 3（挑战）：WebSocket 聊天室

请实现一个简单的 WebSocket 聊天室，支持多个客户端互相发送消息。

<details>
<summary>点击查看答案</summary>

```javascript
// 服务器端（Node.js）
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// 记录所有连接的客户端
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`当前在线: ${clients.size} 人`);

  ws.on('message', (message) => {
    const msg = message.toString();
    console.log(`收到消息: ${msg}`);

    // 广播给所有客户端
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`客户端断开，当前在线: ${clients.size} 人`);
  });
});
```

```html
<!-- 客户端（HTML） -->
<!DOCTYPE html>
<html>
<head><title>WebSocket 聊天室</title></head>
<body>
  <input id="msgInput" placeholder="输入消息..." />
  <button onclick="sendMessage()">发送</button>
  <div id="chatBox"></div>

  <script>
    const ws = new WebSocket('ws://localhost:8080');
    const chatBox = document.getElementById('chatBox');

    ws.onopen = () => {
      chatBox.innerHTML += '<p>已连接到聊天室</p>';
    };

    ws.onmessage = (event) => {
      chatBox.innerHTML += `<p>${event.data}</p>`;
    };

    function sendMessage() {
      const input = document.getElementById('msgInput');
      ws.send(input.value);
      input.value = '';
    }
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习**网络调试与分析**——也就是 Wireshark 抓包、tcpdump 和网络协议分析。你会学到如何查看网络中传输的数据包，分析协议细节，以及排查网络问题。
