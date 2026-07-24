---
title: "第十三章：WebSocket 实时通信"
description: "WebSocket 协议、双向通信、应用场景"
---

# 第十三章：WebSocket 实时通信

## WebSocket 概述

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。

### WebSocket 特点

| 特性 | 说明 |
| --- | --- |
| 全双工 | 客户端和服务器可以同时发送数据 |
| 持久连接 | 一次握手，持续通信 |
| 低开销 | 数据帧轻量，开销小 |
| 跨域 | 不受同源策略限制 |

### HTTP vs WebSocket

| 对比项 | HTTP | WebSocket |
| --- | --- | --- |
| 连接方式 | 短连接 | 持久连接 |
| 通信方式 | 请求-响应 | 全双工 |
| 数据格式 | 文本 | 文本/二进制 |
| 头部开销 | 大 | 小 |
| 实时性 | 差（轮询） | 好 |

## WebSocket 握手

WebSocket 通过 HTTP 升级协议建立连接：

**客户端请求**：
```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: http://example.com
```

**服务器响应**：
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

## WebSocket API

### 创建连接

```javascript
const ws = new WebSocket('ws://localhost:8080');

// 连接成功
ws.onopen = () => {
  console.log('连接已建立');
  ws.send('Hello Server!');
};

// 接收消息
ws.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

// 连接关闭
ws.onclose = (event) => {
  console.log('连接关闭:', event.code, event.reason);
};

// 连接错误
ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};
```

### 发送数据

```javascript
// 发送文本
ws.send('Hello');

// 发送 JSON
ws.send(JSON.stringify({ type: 'message', content: 'Hello' }));

// 发送二进制数据
const buffer = new ArrayBuffer(16);
ws.send(buffer);

// 发送 Blob
const blob = new Blob(['Hello']);
ws.send(blob);
```

### 关闭连接

```javascript
// 正常关闭
ws.close();

// 带状态码和原因关闭
ws.close(1000, 'Normal closure');
```

## 数据帧格式

WebSocket 数据帧结构：

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
```

### 操作码

| 操作码 | 说明 |
| --- | --- |
| 0x0 | 延续帧 |
| 0x1 | 文本帧 |
| 0x2 | 二进制帧 |
| 0x8 | 连接关闭 |
| 0x9 | Ping |
| 0xA | Pong |

## 心跳机制

保持连接活跃，检测连接状态：

```javascript
// 客户端
let pingInterval;

ws.onopen = () => {
  pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send('ping');
    }
  }, 30000); // 30秒发送一次
};

ws.onmessage = (event) => {
  if (event.data === 'pong') {
    console.log('收到 pong');
  }
};

ws.onclose = () => {
  clearInterval(pingInterval);
};
```

## 重连机制

```javascript
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('连接成功');
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      console.log('连接关闭');
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('连接错误:', error);
    };
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`尝试重连 (${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  }
}
```

## 应用场景

| 场景 | 说明 |
| --- | --- |
| 实时聊天 | 即时通讯应用 |
| 在线游戏 | 多人游戏状态同步 |
| 实时通知 | 系统通知推送 |
| 协同编辑 | 文档实时协作 |
| 股票行情 | 实时价格更新 |
| 直播弹幕 | 实时消息展示 |

## 安全建议

| 建议 | 说明 |
| --- | --- |
| 使用 WSS | 加密传输，防止窃听 |
| 验证来源 | 检查 Origin 头部 |
| 认证授权 | 连接时验证用户身份 |
| 限流 | 防止恶意攻击 |
| 心跳检测 | 及时清理无效连接 |

## 本章小结

WebSocket 提供全双工实时通信，适用于需要服务器主动推送的场景。理解 WebSocket 的握手过程、API 使用和数据帧格式，可以构建高效的实时应用。
