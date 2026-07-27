---
title: "第十三章：WebSocket 实时通信"
description: "WebSocket 协议、双向通信、心跳重连、应用场景"
---

# 第十三章：WebSocket 实时通信

## 本章导读

在学这一章之前，你可能会有这些疑问：

- HTTP 不能做实时通信吗？为什么还要学 WebSocket？
- WebSocket 和 HTTP 到底有什么本质区别？
- WebSocket 连接断了怎么办？怎么做到断线重连？
- 实际项目中 WebSocket 该怎么用？有哪些坑要避？

这一章就是为了解答这些问题。我们会从"为什么需要 WebSocket"讲起，搞懂它的底层原理，然后手把手写一个完整的 WebSocket 客户端，包括心跳保活和断线重连。

---

## 1 为什么需要 WebSocket？

### 痛点分析：HTTP 的"先天缺陷"

想象一下这个场景：你在用微信聊天，你发了一条消息给对方。对方那边需要"立刻"看到这条消息。

用 HTTP 怎么做？你只能让对方不停地问服务器："有没有新消息？有没有新消息？有没有新消息？"——这就是**轮询**。

轮询的问题很明显：

```javascript
// ❌ 轮询方式：每隔 1 秒问一次服务器
setInterval(async () => {
  // 每次都要带上完整的 HTTP 请求头
  const res = await fetch('/api/messages')
  const data = await res.json()
  // 大部分时候返回的都是空数组，白白浪费了带宽
  if (data.length > 0) {
    renderMessages(data)
  }
}, 1000)
```

这种方式有三个大问题：

1. **浪费带宽**：每次请求都要带上完整的 HTTP 头部（几百字节），但大部分时候服务器说"没有新消息"
2. **延迟高**：你 1 秒问一次，那消息最多延迟 1 秒才能被收到。想要更低的延迟？那就得问得更频繁，服务器压力更大
3. **连接数多**：如果有 1 万个用户在线，服务器就要同时处理 1 万个频繁的 HTTP 连接

### WebSocket 的解决方案

WebSocket 就像是在你和服务器之间**拉了一根电话线**。接通之后，双方可以随时说话，不用每次都重新拨号。

打个比方：

> HTTP 像是**写信**——你写一封，寄出去，等回信。每封信都要写地址、贴邮票。
> WebSocket 像是**打电话**——拨通之后，双方可以随时聊天，不用每次重新拨号。

```javascript
// ✅ WebSocket 方式：建立连接后，服务器有新消息会主动推送
const ws = new WebSocket('ws://localhost:8080')

// 连接建立后，服务器有新数据会主动推给我们
ws.onmessage = (event) => {
  // 不需要反复请求，服务器主动推送
  const data = JSON.parse(event.data)
  renderMessages(data)
}

// 我们发消息也很简单，直接 send
ws.send(JSON.stringify({ text: '你好' }))
```

> **一句话总结**：WebSocket 解决了 HTTP 无法高效实现"服务器主动推送"的问题，让实时通信变得简单高效。

---

## 2 核心原理

### 13.2.1 WebSocket 的连接过程

WebSocket 的连接过程分两步：

**第一步：握手（通过 HTTP 完成）**

WebSocket 的连接不是凭空建立的，它先要通过一个 HTTP 请求来"握手"。就像打电话时先拨号，对方接了才能聊。

客户端发送一个特殊的 HTTP 请求，意思是"我想升级到 WebSocket 协议"：

```
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket                  // 关键：告诉服务器我想升级协议
Connection: Upgrade                 // 连接要升级
Sec-WebSocket-Key: dGhlIHNhbXBsZQ== // 一个随机密钥，用于验证
Sec-WebSocket-Version: 13           // WebSocket 协议版本号
```

服务器如果同意升级，会返回一个特殊的响应：

```
HTTP/1.1 101 Switching Protocols    // 101 表示"切换协议"
Upgrade: websocket                  // 确认升级
Connection: Upgrade                 // 确认升级
Sec-WebSocket-Accept: s3pPLMBiTxaQ= // 根据客户端密钥计算的值，证明服务器理解协议
```

**第二步：全双工通信**

握手成功后，HTTP 连接就"升级"成了 WebSocket 连接。此后双方可以随时发送数据，就像一根双向车道。

打个比方：

> 握手过程就像两个人见面先握手打招呼（HTTP 请求/响应），然后开始聊天（WebSocket 通信）。握手只有一次，但聊天可以一直持续。

### 13.2.2 全双工 vs 半双工 vs 单工

| 通信方式 | 特点 | 生活类比 | 技术示例 |
| --- | --- | --- | --- |
| 单工 | 只能一个方向传 | 收音机，只能听不能说话 | 传统的 HTTP 请求（客户端发，服务器回） |
| 半双工 | 双方都能发，但不能同时 | 对讲机，一个人说完另一个才能说 | — |
| 全双工 | 双方可以同时互相发送 | 打电话，两个人可以同时说话 | WebSocket |

### 13.2.3 HTTP vs WebSocket 详细对比

| 对比项 | HTTP | WebSocket |
| --- | --- | --- |
| 连接方式 | 短连接（请求完就断） | 持久连接（一次握手，持续通信） |
| 通信模式 | 请求-响应（客户端主动问） | 全双工（双方都能主动发） |
| 数据格式 | 文本（JSON/XML/HTML） | 文本 + 二进制都支持 |
| 协议标识 | http:// 或 https:// | ws:// 或 wss://（加密版） |
| 头部开销 | 每次请求都带完整头部（几百字节） | 握手后数据帧头部只有 2-14 字节 |
| 实时性 | 差（轮询有延迟） | 好（服务器主动推送） |
| 状态 | 无状态 | 有状态（连接保持中） |
| 适用场景 | 普通的增删改查 | 实时聊天、在线游戏、股票行情 |

### 13.2.4 WebSocket 数据帧

WebSocket 传输数据时，不是直接把数据扔过去，而是把数据包装成一个个"帧"（Frame）。就像寄快递时要把东西装进箱子里。

每个帧都有一个小的头部信息，告诉对方这是什么类型的数据：

| 操作码 | 含义 | 说明 |
| --- | --- | --- |
| 0x1 | 文本帧 | 发送的是文本数据（比如 JSON 字符串） |
| 0x2 | 二进制帧 | 发送的是二进制数据（比如图片、文件） |
| 0x8 | 关闭帧 | 通知对方要关闭连接 |
| 0x9 | Ping | "你还活着吗？"（心跳探测） |
| 0xA | Pong | "我还活着！"（心跳回应） |

---

## 3 基础用法

### 13.3.1 创建 WebSocket 连接

```javascript
// 创建一个 WebSocket 连接
// ws:// 是未加密的，wss:// 是加密的（类似 http 和 https 的关系）
const ws = new WebSocket('ws://localhost:8080')

// 监听连接成功事件
// 当握手完成后触发，表示连接已建立，可以开始通信了
ws.onopen = () => {
  // 连接建立成功后，给服务器发一条消息
  console.log('WebSocket 连接已建立')
  // send 方法用来发送数据给服务器
  ws.send('你好，服务器！')
}

// 监听收到消息的事件
// 当服务器推送消息过来时触发
ws.onmessage = (event) => {
  // event.data 就是服务器发过来的数据
  // 注意：收到的数据可能是字符串，也可能是二进制数据
  console.log('收到服务器的消息：', event.data)
}

// 监听连接关闭事件
// 当连接被关闭时触发（不管是自己关的还是服务器关的）
ws.onclose = (event) => {
  // event.code 是关闭的状态码，1000 表示正常关闭
  console.log('连接已关闭，状态码：', event.code)
  // event.reason 是关闭的原因（如果有的话）
  console.log('关闭原因：', event.reason)
}

// 监听错误事件
// 当发生错误时触发，比如连接失败
ws.onerror = (error) => {
  // 注意：WebSocket 的 error 事件不会给出具体的错误信息
  // 具体的错误要看控制台的网络面板
  console.error('WebSocket 发生错误')
}
```

### 13.3.2 发送不同类型的数据

```javascript
const ws = new WebSocket('ws://localhost:8080')

ws.onopen = () => {
  // ✅ 发送普通文本
  ws.send('Hello')

  // ✅ 发送 JSON 对象（实际开发中最常用的方式）
  // 注意：WebSocket 只能发送字符串或二进制数据
  // 所以发 JSON 对象时必须先用 JSON.stringify 转成字符串
  const message = { type: 'chat', content: '你好', userId: 1 }
  ws.send(JSON.stringify(message))

  // ✅ 发送二进制数据（ArrayBuffer）
  // 适合发送图片、文件等二进制内容
  const buffer = new ArrayBuffer(16) // 创建一个 16 字节的缓冲区
  ws.send(buffer)

  // ✅ 发送 Blob 对象
  // Blob 通常来自文件选择器或者 fetch 获取的二进制数据
  const blob = new Blob(['Hello'], { type: 'text/plain' })
  ws.send(blob)
}
```

### 13.3.3 关闭连接

```javascript
const ws = new WebSocket('ws://localhost:8080')

// 正常关闭连接
// close 方法可以传两个参数：状态码和原因
ws.onopen = () => {
  // 参数 1：状态码，1000 表示正常关闭（最常用）
  // 参数 2：关闭原因，可选的字符串
  ws.close(1000, '用户主动关闭连接')
}
```

### 13.3.4 连接状态（readyState）

WebSocket 有 4 种状态，了解这些状态很重要，因为你在错误的状态下发送数据会报错：

| 常量值 | 状态名 | 含义 |
| --- | --- | --- |
| 0 | CONNECTING | 正在握手，还没连上 |
| 1 | OPEN | 连接成功，可以通信 |
| 2 | CLOSING | 正在关闭中 |
| 3 | CLOSED | 已经关闭 |

```javascript
const ws = new WebSocket('ws://localhost:8080')

// ✅ 正确做法：发送数据前检查连接状态
function sendMessage(data) {
  // 只有连接状态为 OPEN（1）时才能发送数据
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  } else {
    // ❌ 如果在非 OPEN 状态下调用 send，会抛出异常
    console.warn('连接未就绪，当前状态：', ws.readyState)
  }
}
```

---

## 4 实战：心跳保活和断线重连

在实际项目中，WebSocket 连接不能"建了就不管"。你需要考虑两个问题：

1. **心跳保活**：长时间不说话，中间的路由器或防火墙可能会断开这个连接。所以需要定时发"ping"来告诉对方"我还活着"
2. **断线重连**：网络不稳定时连接可能会断，断了之后要自动重连

打个比方：

> 心跳就像两个人打电话时偶尔说一句"喂，你还在吗？"，确保电话线没断。
> 重连就像电话断了之后自动重新拨号。

### 13.4.1 心跳机制

```javascript
// 创建 WebSocket 连接
const ws = new WebSocket('ws://localhost:8080')

// 定义心跳相关的变量
let heartbeatTimer = null    // 心跳定时器
const HEARTBEAT_INTERVAL = 30000 // 心跳间隔：30 秒发一次
const HEARTBEAT_TIMEOUT = 5000   // 心跳超时：5 秒没回应就认为断了

ws.onopen = () => {
  console.log('连接成功')
  // 连接成功后开始心跳
  startHeartbeat()
}

// 开始心跳的函数
function startHeartbeat() {
  // 先清除可能存在的旧定时器
  clearInterval(heartbeatTimer)

  // 每隔 30 秒发一次 ping
  heartbeatTimer = setInterval(() => {
    // 发送前检查连接状态
    if (ws.readyState === WebSocket.OPEN) {
      // 发送 ping 消息（服务器收到后应该回复 pong）
      ws.send('ping')
      console.log('发送心跳 ping')
    }
  }, HEARTBEAT_INTERVAL)
}

// 处理收到的消息
ws.onmessage = (event) => {
  // 如果是服务器回复的心跳 pong，就不用当普通消息处理
  if (event.data === 'pong') {
    console.log('收到心跳 pong，连接正常')
    return
  }

  // 其他消息正常处理
  console.log('收到消息：', event.data)
}

// 连接关闭时清除心跳定时器
ws.onclose = () => {
  clearInterval(heartbeatTimer)
  console.log('连接已关闭，心跳停止')
}
```

### 13.4.2 断线重连（指数退避）

```javascript
// 封装一个支持自动重连的 WebSocket 类
class ReconnectWebSocket {
  constructor(url) {
    this.url = url                   // WebSocket 地址
    this.ws = null                   // WebSocket 实例
    this.reconnectAttempts = 0       // 当前重连次数
    this.maxReconnectAttempts = 5    // 最大重连次数，防止无限重连
    this.baseDelay = 1000            // 基础延迟：1 秒
    this.maxDelay = 30000            // 最大延迟：30 秒
    this.messageHandlers = []        // 消息处理函数列表
  }

  // 建立连接
  connect() {
    // 创建新的 WebSocket 实例
    this.ws = new WebSocket(this.url)

    // 连接成功
    this.ws.onopen = () => {
      console.log('连接成功')
      // 连接成功后重置重连次数（下次断了还能再重连）
      this.reconnectAttempts = 0
    }

    // 收到消息
    this.ws.onmessage = (event) => {
      // 遍历所有消息处理函数
      this.messageHandlers.forEach(handler => handler(event.data))
    }

    // 连接关闭
    this.ws.onclose = () => {
      console.log('连接关闭，准备重连')
      // 调用重连方法
      this.reconnect()
    }

    // 连接出错
    this.ws.onerror = () => {
      console.error('连接出错')
    }
  }

  // 重连方法（使用指数退避策略）
  reconnect() {
    // 超过最大重连次数就不重试了
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('已达到最大重连次数（' + this.maxReconnectAttempts + '次），放弃重连')
      return
    }

    // 重连次数加 1
    this.reconnectAttempts++

    // 指数退避：第 1 次等 1 秒，第 2 次等 2 秒，第 3 次等 4 秒...
    // 公式：延迟 = 基础延迟 * 2 的 (重连次数-1) 次方
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxDelay
    )

    console.log('将在 ' + delay + 'ms 后进行第 ' + this.reconnectAttempts + ' 次重连')

    // 延迟后重新连接
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  // 发送消息（封装了状态检查）
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data))
    } else {
      console.warn('连接未就绪，消息发送失败')
    }
  }

  // 注册消息处理函数
  onMessage(handler) {
    this.messageHandlers.push(handler)
  }

  // 主动关闭连接
  close() {
    // 关闭前重置重连次数，防止关闭后还触发重连
    this.reconnectAttempts = this.maxReconnectAttempts
    if (this.ws) {
      this.ws.close()
    }
  }
}

// 使用示例
const client = new ReconnectWebSocket('ws://localhost:8080')

// 注册消息处理
client.onMessage((data) => {
  console.log('收到消息：', data)
})

// 建立连接
client.connect()

// 发送消息
client.send({ type: 'hello', content: '你好' })
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 协议标识 | ws:// 未加密，wss:// 加密（生产环境必须用 wss） |
| 握手过程 | 通过 HTTP 101 状态码完成协议升级 |
| 全双工通信 | 客户端和服务器可以同时互相发送数据 |
| 四个事件 | onopen / onmessage / onclose / onerror |
| 四种状态 | CONNECTING(0) / OPEN(1) / CLOSING(2) / CLOSED(3) |
| 发送数据 | 支持文本、JSON、ArrayBuffer、Blob |
| 心跳保活 | 定时发 ping，防止连接被中间设备断开 |
| 断线重连 | 使用指数退避策略，避免频繁重连压垮服务器 |

---

## 6 新手常见误区

### 误区 1："WebSocket 不需要 HTTP 了"

**错！** WebSocket 的连接建立（握手）必须通过 HTTP 来完成。它只是在握手成功后"升级"了协议，但一开始还是要靠 HTTP 来牵线搭桥。而且 WebSocket 的默认端口（80/443）也是和 HTTP 共用的。

### 误区 2："WebSocket 连接建立后就不用管了"

**错！** WebSocket 连接可能因为网络波动、防火墙超时、服务器重启等原因断开。你必须实现心跳保活和断线重连机制，否则用户会在不知情的情况下丢失连接。

### 误区 3："WebSocket 发送数据前不需要检查状态"

**错！** 如果在连接还没建立好（CONNECTING）或已经关闭（CLOSED）的时候调用 send()，会直接抛出异常。正确做法是每次发送前都检查 readyState 是否为 OPEN。

```javascript
// ❌ 错误写法：直接发送，不管连接状态
ws.send('hello')

// ✅ 正确写法：先检查状态
if (ws.readyState === WebSocket.OPEN) {
  ws.send('hello')
}
```

### 误区 4："ws:// 和 wss:// 随便用哪个都行"

**错！** ws:// 是明文传输，数据在传输过程中可以被窃听和篡改。如果你的网站用了 https://，那 WebSocket 也必须用 wss://，否则浏览器会拒绝连接（混合内容策略）。生产环境中一律使用 wss://。

### 误区 5："WebSocket 没有跨域问题"

**半对半错。** WebSocket 确实不受同源策略的严格限制（不需要 CORS 头），但服务器端仍然可以通过检查 Origin 头部来拒绝来自非授权域名的连接。所以跨域能不能通，取决于服务器的配置。

---

## 7 动手练习

### 练习 1（基础）：创建一个简单的 WebSocket 客户端

创建一个 WebSocket 连接，连接到 ws://localhost:8080，实现以下功能：
- 连接成功后打印"连接成功"
- 收到消息时打印消息内容
- 连接关闭时打印关闭原因
- 出错时打印错误信息

<details>
<summary>点击查看答案</summary>

```javascript
// 创建 WebSocket 连接，连接到本地 8080 端口
const ws = new WebSocket('ws://localhost:8080')

// 监听连接成功事件
ws.onopen = () => {
  // 连接建立成功后打印提示
  console.log('连接成功')
}

// 监听收到消息事件
ws.onmessage = (event) => {
  // 打印服务器推送的消息内容
  console.log('收到消息：', event.data)
}

// 监听连接关闭事件
ws.onclose = (event) => {
  // 打印关闭的状态码和原因
  console.log('连接关闭，状态码：', event.code)
  console.log('关闭原因：', event.reason)
}

// 监听错误事件
ws.onerror = () => {
  // 打印错误提示
  console.error('WebSocket 连接出错')
}
```

</details>

### 练习 2（进阶）：实现一个带心跳的 WebSocket 客户端

在练习 1 的基础上，添加心跳功能：
- 连接成功后每 15 秒发送一次 ping
- 收到 pong 时打印"心跳正常"
- 连接关闭时清除心跳定时器

<details>
<summary>点击查看答案</summary>

```javascript
// 创建 WebSocket 连接
const ws = new WebSocket('ws://localhost:8080')

// 定义心跳定时器变量
let heartbeatTimer = null

// 连接成功后启动心跳
ws.onopen = () => {
  console.log('连接成功')

  // 每 15 秒发送一次心跳 ping
  heartbeatTimer = setInterval(() => {
    // 发送前检查连接是否还活着
    if (ws.readyState === WebSocket.OPEN) {
      ws.send('ping')
      console.log('发送心跳 ping')
    }
  }, 15000) // 15000 毫秒 = 15 秒
}

// 收到消息时处理
ws.onmessage = (event) => {
  // 如果是心跳回复 pong
  if (event.data === 'pong') {
    console.log('心跳正常，收到 pong')
    return // 不当做普通消息处理
  }
  // 普通消息正常打印
  console.log('收到消息：', event.data)
}

// 连接关闭时清理心跳
ws.onclose = (event) => {
  // 清除心跳定时器，防止内存泄漏
  clearInterval(heartbeatTimer)
  console.log('连接关闭：', event.reason)
}

// 错误处理
ws.onerror = () => {
  console.error('WebSocket 出错')
}
```

</details>

### 练习 3（挑战）：封装一个完整的 WebSocket 工具类

封装一个 WebSocket 工具类，要求：
- 支持自动重连（最多 5 次，指数退避）
- 支持心跳保活（每 20 秒一次）
- 支持注册多个消息处理函数
- 发送消息时自动检查连接状态
- 支持主动关闭（关闭后不再重连）

<details>
<summary>点击查看答案</summary>

```javascript
// 封装一个功能完整的 WebSocket 工具类
class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url                                    // WebSocket 服务器地址
    this.ws = null                                    // WebSocket 实例
    this.reconnectAttempts = 0                        // 当前重连次数
    this.maxReconnect = options.maxReconnect || 5     // 最大重连次数，默认 5
    this.baseDelay = options.baseDelay || 1000        // 基础延迟，默认 1 秒
    this.heartbeatInterval = options.heartbeat || 20000 // 心跳间隔，默认 20 秒
    this.heartbeatTimer = null                        // 心跳定时器
    this.handlers = []                                // 消息处理函数数组
    this.manualClose = false                          // 是否手动关闭的标记
  }

  // 建立连接
  connect() {
    this.manualClose = false       // 重置手动关闭标记
    this.ws = new WebSocket(this.url) // 创建新连接

    this.ws.onopen = () => {
      console.log('连接成功')
      this.reconnectAttempts = 0   // 重置重连计数
      this.startHeartbeat()        // 启动心跳
    }

    this.ws.onmessage = (event) => {
      // 收到 pong 说明是心跳回复，不用处理
      if (event.data === 'pong') return
      // 遍历调用所有消息处理函数
      this.handlers.forEach(fn => fn(event.data))
    }

    this.ws.onclose = () => {
      this.stopHeartbeat()         // 停止心跳
      // 如果不是手动关闭的，就自动重连
      if (!this.manualClose) {
        this.reconnect()
      }
    }

    this.ws.onerror = () => {
      console.error('连接出错')
    }
  }

  // 启动心跳
  startHeartbeat() {
    this.stopHeartbeat()           // 先清除旧的定时器
    this.heartbeatTimer = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping')       // 发送心跳
      }
    }, this.heartbeatInterval)
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer) // 清除定时器
      this.heartbeatTimer = null         // 释放引用
    }
  }

  // 指数退避重连
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) {
      console.error('重连次数已达上限')
      return
    }
    this.reconnectAttempts++
    // 计算延迟时间：1s, 2s, 4s, 8s, 16s
    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log('第 ' + this.reconnectAttempts + ' 次重连，等待 ' + delay + 'ms')
    setTimeout(() => this.connect(), delay) // 延迟后重新连接
  }

  // 发送消息
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // 如果是对象就转成 JSON 字符串
      const msg = typeof data === 'string' ? data : JSON.stringify(data)
      this.ws.send(msg)
    } else {
      console.warn('连接未就绪，无法发送')
    }
  }

  // 注册消息处理函数
  onMessage(handler) {
    this.handlers.push(handler)    // 添加到处理函数列表
  }

  // 主动关闭连接
  close() {
    this.manualClose = true        // 标记为手动关闭，防止触发重连
    this.stopHeartbeat()           // 停止心跳
    if (this.ws) {
      this.ws.close(1000, '用户主动关闭') // 正常关闭连接
    }
  }
}

// 使用示例
const client = new WebSocketClient('ws://localhost:8080', {
  maxReconnect: 5,     // 最多重连 5 次
  heartbeat: 20000     // 每 20 秒心跳一次
})

// 注册消息处理
client.onMessage((data) => {
  console.log('处理 1：', data)
})

client.onMessage((data) => {
  console.log('处理 2：', data)
})

// 连接
client.connect()

// 发消息
client.send({ action: 'login', user: 'test' })
```

</details>

---

## 下一章预告

下一章我们会学习 **浏览器安全基础**——也就是 Web 开发中最常见的安全威胁和防御方法。你会学到 XSS 攻击是怎么偷走你的数据的、CSRF 是怎么让别人冒充你操作的、以及怎么用 CSP、HttpOnly Cookie 等手段来保护你的网站。这些知识不管你是做前端还是后端，都一定要懂。
