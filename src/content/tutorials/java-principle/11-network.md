---
title: "第十一章：网络编程原理"
description: "从 Socket 到 Netty，深入理解 Java 网络编程的演进与底层原理"
---

# 第十一章：网络编程原理

## 本章导读

本章将带你从最基础的 Socket 编程开始，逐步理解 Java 网络编程的演进历程。我们会先搞懂 TCP/UDP Socket 的工作原理，然后分析 BIO 网络模型"一连接一线程"的致命缺陷，接着学习 NIO 如何通过 Selector 解决这个问题，再深入 Reactor 模式的三种变体，最后剖析 Netty 的架构设计和粘包/拆包问题的解决方案。

学完本章，你将能够：
- 理解 Socket 编程的基本原理和 TCP/UDP 的区别
- 分析 BIO 网络模型的性能瓶颈
- 掌握 NIO 网络编程的核心模式
- 理解 Reactor 模式的三种实现方式
- 了解 Netty 的架构设计和核心组件
- 解决网络编程中的粘包/拆包问题

## 11.1 为什么需要网络编程？

### 生活中的类比

想象你要和朋友通信：

**写信（UDP）：** 你把信写好，贴上邮票，扔进邮筒。信可能被丢失、可能顺序错乱，但你不在乎——就像发微信语音，丢一两句话无所谓。

**打电话（TCP）：** 你拨通电话，对方接听，然后你们开始聊天。如果听不清，你会说"请再说一遍"——这就是 TCP 的确认重传机制。挂电话前双方都说"拜拜"——这就是 TCP 的四次挥手。

### 技术层面的需求

现代应用几乎都离不开网络：
- **Web 服务器**：处理 HTTP 请求（Tomcat、Nginx）
- **RPC 框架**：微服务之间的远程调用（Dubbo、gRPC）
- **消息队列**：异步消息传递（Kafka、RabbitMQ）
- **游戏服务器**：实时多人对战
- **数据库**：客户端连接数据库服务器

所有这些底层都依赖网络编程。理解网络编程原理，是成为高级 Java 工程师的必经之路。

## 11.2 核心原理

### 11.2.1 Socket 编程基础

Socket（套接字）是网络编程的抽象，它封装了 TCP/UDP 协议的细节，让开发者可以像操作文件一样进行网络通信。

**Socket 的本质：**

```
应用程序
    ↓
Socket API（send/recv）
    ↓
操作系统内核的网络协议栈
    ↓
网卡硬件 → 网络 → 网卡硬件
    ↓
操作系统内核的网络协议栈
    ↓
Socket API（recv/send）
    ↓
应用程序
```

#### TCP Socket（可靠传输）

TCP 提供面向连接的、可靠的、有序的字节流传输：

```java
// TCP 服务端
ServerSocket serverSocket = new ServerSocket(8080); // 创建服务端套接字，绑定端口
Socket clientSocket = serverSocket.accept();         // 阻塞等待客户端连接（三次握手）

// 获取输入流，读取客户端发来的数据
InputStream in = clientSocket.getInputStream();
// 获取输出流，向客户端发送数据
OutputStream out = clientSocket.getOutputStream();

// 读写数据...
clientSocket.close(); // 关闭连接（四次挥手）

// TCP 客户端
Socket socket = new Socket("127.0.0.1", 8080); // 连接服务端（发起三次握手）
OutputStream out = socket.getOutputStream();
out.write("Hello Server".getBytes());           // 发送数据
socket.close();                                  // 关闭连接
```

**TCP 的三次握手（建立连接）：**

```
客户端                    服务端
  │                         │
  │──── SYN ───────────────→│  第一次：客户端发送 SYN（同步序列号）
  │                         │
  │←──── SYN+ACK ──────────│  第二次：服务端回复 SYN+ACK（确认+自己的同步序列号）
  │                         │
  │──── ACK ───────────────→│  第三次：客户端回复 ACK（确认）
  │                         │
  │     连接建立成功！        │
```

**TCP 的四次挥手（断开连接）：**

```
客户端                    服务端
  │                         │
  │──── FIN ───────────────→│  第一次：客户端发送 FIN（结束）
  │                         │
  │←──── ACK ──────────────│  第二次：服务端确认收到 FIN
  │                         │
  │←──── FIN ──────────────│  第三次：服务端也发送 FIN（我也要结束了）
  │                         │
  │──── ACK ───────────────→│  第四次：客户端确认收到 FIN
  │                         │
  │     连接断开！           │
```

#### UDP Socket（不可靠传输）

UDP 提供无连接的、不可靠的数据报传输：

```java
// UDP 发送端
DatagramSocket socket = new DatagramSocket();          // 创建 UDP 套接字
byte[] data = "Hello".getBytes();                      // 准备数据
InetAddress address = InetAddress.getByName("127.0.0.1"); // 目标地址
DatagramPacket packet = new DatagramPacket(data, data.length, address, 9090); // 打包
socket.send(packet);                                    // 发送（不保证到达）
socket.close();

// UDP 接收端
DatagramSocket server = new DatagramSocket(9090);      // 绑定端口
byte[] buffer = new byte[1024];                         // 接收缓冲区
DatagramPacket packet = new DatagramPacket(buffer, buffer.length); // 准备接收包
server.receive(packet);                                 // 阻塞等待数据到达
String message = new String(packet.getData(), 0, packet.getLength()); // 解析数据
server.close();
```

**TCP vs UDP 对比：**

| 特性 | TCP | UDP |
|------|-----|-----|
| 连接方式 | 面向连接（三次握手） | 无连接 |
| 可靠性 | 可靠（确认、重传、排序） | 不可靠（可能丢失、乱序） |
| 传输单位 | 字节流 | 数据报 |
| 速度 | 较慢（有握手和确认开销） | 较快 |
| 适用场景 | Web、文件传输、数据库 | 视频直播、DNS、游戏 |

### 11.2.2 BIO 网络编程模型

BIO（Blocking IO）网络模型的核心问题是**一连接一线程**：

```java
// BIO 服务端：每个连接需要一个独立线程处理
public class BioServer {
    public static void main(String[] args) throws Exception {
        ServerSocket serverSocket = new ServerSocket(8080);

        while (true) {
            // accept() 阻塞等待客户端连接
            Socket socket = serverSocket.accept();

            // 为每个连接创建一个新线程
            new Thread(() -> {
                try {
                    InputStream in = socket.getInputStream();
                    byte[] buffer = new byte[1024];
                    int len;

                    // read() 也是阻塞的，没有数据就干等
                    while ((len = in.read(buffer)) != -1) {
                        // 处理数据
                        System.out.println(new String(buffer, 0, len));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

**BIO 模型的问题：**

```
场景：10000 个客户端连接，但每个连接每分钟只发一条消息

BIO 模型：
- 需要 10000 个线程
- 每个线程占用约 1MB 栈内存 → 总共 10GB 内存
- 大部分线程在阻塞等待数据，CPU 利用率极低
- 线程上下文切换开销巨大

结论：BIO 适合连接数少且每个连接数据量大的场景（如数据库连接）
      不适合连接数多但数据量小的场景（如聊天服务器）
```

### 11.2.3 NIO 网络编程模型

NIO 通过 Selector 实现了**一个线程管理多个连接**：

```java
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.util.Iterator;

public class NioServer {
    public static void main(String[] args) throws Exception {
        // 创建服务端通道
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.configureBlocking(false); // 必须非阻塞才能注册到 Selector
        serverChannel.bind(new InetSocketAddress(8080));

        // 创建选择器
        Selector selector = Selector.open();

        // 注册服务端通道，关注 ACCEPT 事件（新连接到来）
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        while (true) {
            // select()：阻塞等待，直到有事件发生
            // 返回值是有事件的 Channel 数量
            selector.select();

            // 获取有事件的 Key 集合
            Iterator<SelectionKey> keys = selector.selectedKeys().iterator();

            while (keys.hasNext()) {
                SelectionKey key = keys.next();

                if (key.isAcceptable()) {
                    // 新连接事件
                    SocketChannel client = serverChannel.accept();
                    client.configureBlocking(false);
                    // 注册到 Selector，关注 READ 事件
                    client.register(selector, SelectionKey.OP_READ);
                    System.out.println("新连接：" + client.getRemoteAddress());

                } else if (key.isReadable()) {
                    // 可读事件
                    SocketChannel client = (SocketChannel) key.channel();
                    ByteBuffer buffer = ByteBuffer.allocate(1024);
                    int len = client.read(buffer);

                    if (len > 0) {
                        buffer.flip();
                        byte[] data = new byte[buffer.remaining()];
                        buffer.get(data);
                        System.out.println("收到：" + new String(data));
                    } else if (len == -1) {
                        // 客户端关闭连接
                        client.close();
                        key.cancel();
                    }
                }

                keys.remove(); // 移除已处理的 Key
            }
        }
    }
}
```

**NIO 模型的优势：**

```
场景：10000 个客户端连接

NIO 模型：
- 只需要 1 个线程（或几个线程）
- 内存占用极低
- 没有数据时线程在 select() 处等待，不消耗 CPU
- 有数据时只处理有事件的 Channel，效率极高

结论：NIO 适合连接数多、数据量小的场景（如聊天、推送服务器）
```

### 11.2.4 Reactor 模式

Reactor 模式是 NIO 网络编程的核心设计模式，它把 IO 事件的分发和业务处理解耦：

#### 单线程 Reactor

```
┌─────────────────────────────────────────────┐
│              Reactor 线程                    │
│                                             │
│  ┌─────────┐    ┌──────────────────────┐   │
│  │ Selector │───→│ 事件分发              │   │
│  │  select()│    │                      │   │
│  └─────────┘    │ 可读事件 → 读数据     │   │
│                 │ 可写事件 → 写数据     │   │
│                 │ 连接事件 → 接受连接   │   │
│                 └──────────────────────┘   │
│                                             │
│  所有操作（accept、read、write、业务处理）    │
│  都在同一个线程完成                          │
└─────────────────────────────────────────────┘

优点：简单，无线程切换开销
缺点：一个连接的业务处理耗时长会阻塞其他连接
适用：业务处理非常快的场景（如纯转发）
```

#### 多线程 Reactor

```
┌─────────────────────────────────────────────┐
│           Reactor 线程（主线程）              │
│                                             │
│  ┌─────────┐    ┌──────────────────────┐   │
│  │ Selector │───→│ 事件分发              │   │
│  └─────────┘    │ 可读事件 → 提交到线程池│   │
│                 │ 连接事件 → 接受连接   │   │
│                 └──────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↓ 提交任务
┌─────────────────────────────────────────────┐
│           工作线程池                          │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 线程 1    │ │ 线程 2    │ │ 线程 3    │   │
│  │ 读数据    │ │ 读数据    │ │ 业务处理  │   │
│  │ 业务处理  │ │ 写数据    │ │ 写数据    │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────┘

优点：业务处理不阻塞 IO 事件分发
缺点：线程切换有开销
适用：业务处理较耗时的场景
```

#### 主从 Reactor

```
┌─────────────────────────────────────────────┐
│         Main Reactor（主线程）                │
│                                             │
│  ┌─────────┐    ┌──────────────────────┐   │
│  │ Selector │───→│ 只处理连接事件        │   │
│  └─────────┘    │ accept 新连接         │   │
│                 │ 把新连接注册到         │   │
│                 │ Sub Reactor           │   │
│                 └──────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↓ 分配连接
┌─────────────────────────────────────────────┐
│         Sub Reactor 1（线程）                 │
│  ┌─────────┐    处理已连接的 Channel         │
│  │ Selector │───→ 读/写/业务处理              │
│  └─────────┘                                 │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│         Sub Reactor 2（线程）                 │
│  ┌─────────┐    处理已连接的 Channel         │
│  │ Selector │───→ 读/写/业务处理              │
│  └─────────┘                                 │
└─────────────────────────────────────────────┘

优点：连接建立和 IO 读写分离，互不阻塞
缺点：实现复杂
适用：高并发场景（Netty 默认采用此模式）
```

### 11.2.5 Netty 架构原理

Netty 是一个基于 NIO 的高性能网络框架，它的核心架构如下：

```
┌─────────────────────────────────────────────────────────────┐
│                        Netty 服务端                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              EventLoopGroup（Boss 组）                │   │
│  │              负责接受新连接（Main Reactor）            │   │
│  │              ┌──────────────┐                        │   │
│  │              │  EventLoop   │                        │   │
│  │              │  (Selector)  │                        │   │
│  │              └──────────────┘                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓ 分配连接                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              EventLoopGroup（Worker 组）              │   │
│  │              负责 IO 读写（Sub Reactor）              │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │   │
│  │  │  EventLoop   │ │  EventLoop   │ │  EventLoop   │ │   │
│  │  │  (Selector)  │ │  (Selector)  │ │  (Selector)  │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  每个 Channel 绑定一个 EventLoop                            │
│  每个 EventLoop 包含一个 Selector、一个线程、一个任务队列     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ChannelPipeline（处理链）                │   │
│  │                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │ Handler1 │→ │ Handler2 │→ │ Handler3 │         │   │
│  │  │ (解码器)  │  │ (业务)   │  │ (编码器)  │         │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  │                                                     │   │
│  │  数据像流水线一样经过每个 Handler                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**核心组件说明：**

1. **EventLoopGroup**：EventLoop 的容器，相当于线程组
   - BossGroup：负责接受连接，通常只有 1 个 EventLoop
   - WorkerGroup：负责 IO 读写，可以有多个 EventLoop

2. **EventLoop**：核心循环，包含：
   - 一个 Selector：监控 Channel 事件
   - 一个线程：执行所有任务
   - 一个任务队列：存放待执行的任务

3. **Channel**：网络连接的抽象，封装了 Socket

4. **ChannelPipeline**：处理链，包含多个 Handler

5. **ChannelHandler**：具体的业务处理器
   - ChannelInboundHandler：处理入站事件（读数据、连接建立）
   - ChannelOutboundHandler：处理出站事件（写数据）

**Netty 的线程模型就是主从 Reactor：**
- BossGroup 的 EventLoop 负责 accept 新连接
- 把新连接注册到 WorkerGroup 的某个 EventLoop
- WorkerGroup 的 EventLoop 负责该连接的所有 IO 操作

### 11.2.6 粘包/拆包问题及解决方案

**什么是粘包/拆包？**

TCP 是面向字节流的协议，没有消息边界的概念：

```
发送方发送了两条消息：
消息1: "Hello"
消息2: "World"

接收方可能收到：
情况1（正常）：先收到 "Hello"，再收到 "World"
情况2（粘包）：收到 "HelloWorld"（两条消息粘在一起）
情况3（拆包）：先收到 "Hel"，再收到 "loWorld"（一条消息被拆开）
情况4（混合）：收到 "HelloWor"，再收到 "ld"
```

**为什么会粘包/拆包？**

1. **发送端粘包**：发送方连续发送多个小包，TCP 协议优化把它们合并成一个大包发送
2. **接收端粘包**：接收方读取缓冲区不及时，多个包的数据堆积在一起
3. **拆包**：消息太大，超过 MSS（最大报文段长度），被拆分成多个包

**解决方案：**

| 方案 | 原理 | 优缺点 |
|------|------|--------|
| 固定长度 | 每个消息固定 N 字节，不足补齐 | 简单但浪费带宽 |
| 分隔符 | 消息末尾加特殊分隔符（如换行符） | 简单但消息内容不能包含分隔符 |
| 长度字段 | 消息头部包含消息长度，先读长度再读内容 | 最常用，Netty 内置支持 |

**Netty 内置的解码器：**

```java
// 方案1：固定长度解码器
pipeline.addLast(new FixedLengthFrameDecoder(50)); // 每个消息固定 50 字节

// 方案2：分隔符解码器
pipeline.addLast(new DelimiterBasedFrameDecoder(1024,
        Unpooled.wrappedBuffer("\n".getBytes()))); // 以换行符分隔

// 方案3：长度字段解码器（最常用）
pipeline.addLast(new LengthFieldBasedFrameDecoder(
        65535,  // 最大帧长度
        0,      // 长度字段偏移量
        4,      // 长度字段占 4 字节
        0,      // 长度调整后（减去长度字段本身）
        4       // 跳过的字节数
));
```

## 11.3 基础用法

### 11.3.1 BIO 聊天室示例

```java
import java.io.*;
import java.net.*;
import java.util.*;

// BIO 版聊天室服务端
public class BioChatServer {
    // 存储所有客户端连接
    private static Set<Socket> clients = Collections.synchronizedSet(new HashSet<>());

    public static void main(String[] args) throws Exception {
        ServerSocket serverSocket = new ServerSocket(9090);
        System.out.println("聊天服务器启动，端口：9090");

        while (true) {
            Socket socket = serverSocket.accept(); // 阻塞等待连接
            clients.add(socket);                   // 保存连接
            System.out.println("新客户端连接：" + socket.getInetAddress());

            // 为每个连接创建处理线程
            new Thread(() -> handleClient(socket)).start();
        }
    }

    private static void handleClient(Socket socket) {
        try {
            BufferedReader in = new BufferedReader(
                    new InputStreamReader(socket.getInputStream()));
            String message;

            // 循环读取客户端消息
            while ((message = in.readLine()) != null) {
                System.out.println("收到：" + message);
                // 广播给所有其他客户端
                broadcast(socket, message);
            }
        } catch (Exception e) {
            System.out.println("客户端断开：" + socket.getInetAddress());
        } finally {
            clients.remove(socket);
            try { socket.close(); } catch (Exception e) {}
        }
    }

    // 广播消息给所有其他客户端
    private static void broadcast(Socket sender, String message) {
        for (Socket client : clients) {
            if (client != sender) {
                try {
                    PrintWriter out = new PrintWriter(client.getOutputStream(), true);
                    out.println(message);
                } catch (Exception e) {
                    // 发送失败，客户端可能已断开
                }
            }
        }
    }
}
```

### 11.3.2 Netty 服务端示例

```java
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;

public class NettyServer {
    public static void main(String[] args) throws Exception {
        // 创建 Boss 组：负责接受连接（Main Reactor）
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        // 创建 Worker 组：负责 IO 读写（Sub Reactor）
        EventLoopGroup workerGroup = new NioEventLoopGroup();

        try {
            // 创建服务端启动辅助类
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workerGroup)
                    // 指定使用 NIO 通道
                    .channel(NioServerSocketChannel.class)
                    // 设置连接队列大小
                    .option(ChannelOption.SO_BACKLOG, 128)
                    // 启用 TCP 保活机制
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    // 配置 ChannelPipeline
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) {
                            // 获取 Pipeline
                            ChannelPipeline pipeline = ch.pipeline();

                            // 添加字符串解码器（把字节流转成字符串）
                            pipeline.addLast(new StringDecoder());
                            // 添加字符串编码器（把字符串转成字节流）
                            pipeline.addLast(new StringEncoder());

                            // 添加业务处理器
                            pipeline.addLast(new SimpleChannelInboundHandler<String>() {
                                @Override
                                public void channelActive(ChannelHandlerContext ctx) {
                                    // 连接建立时触发
                                    System.out.println("客户端连接：" +
                                            ctx.channel().remoteAddress());
                                }

                                @Override
                                protected void channelRead0(ChannelHandlerContext ctx, String msg) {
                                    // 收到客户端消息时触发
                                    System.out.println("收到消息：" + msg);
                                    // 回复客户端
                                    ctx.writeAndFlush("服务器已收到：" + msg);
                                }

                                @Override
                                public void channelInactive(ChannelHandlerContext ctx) {
                                    // 连接断开时触发
                                    System.out.println("客户端断开：" +
                                            ctx.channel().remoteAddress());
                                }
                            });
                        }
                    });

            // 绑定端口并启动
            ChannelFuture future = bootstrap.bind(8080).sync();
            System.out.println("Netty 服务器启动，端口：8080");

            // 等待服务器通道关闭
            future.channel().closeFuture().sync();
        } finally {
            // 优雅关闭
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

### 11.3.3 Netty 客户端示例

```java
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;

public class NettyClient {
    public static void main(String[] args) throws Exception {
        EventLoopGroup group = new NioEventLoopGroup();

        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) {
                            ChannelPipeline pipeline = ch.pipeline();
                            pipeline.addLast(new StringDecoder());
                            pipeline.addLast(new StringEncoder());
                            pipeline.addLast(new SimpleChannelInboundHandler<String>() {
                                @Override
                                protected void channelRead0(ChannelHandlerContext ctx, String msg) {
                                    // 收到服务器回复
                                    System.out.println("服务器回复：" + msg);
                                }
                            });
                        }
                    });

            // 连接服务器
            ChannelFuture future = bootstrap.connect("127.0.0.1", 8080).sync();
            System.out.println("已连接到服务器");

            // 发送消息
            Channel channel = future.channel();
            channel.writeAndFlush("Hello Netty!");

            // 等待连接关闭
            channel.closeFuture().sync();
        } finally {
            group.shutdownGracefully();
        }
    }
}
```

## 11.4 进阶用法

### 11.4.1 BIO vs NIO vs Netty 对比

| 对比项 | BIO | NIO | Netty |
|--------|-----|-----|-------|
| 线程模型 | 一连接一线程 | 多路复用，一线程多连接 | 主从 Reactor |
| 编程复杂度 | 简单 | 复杂（Buffer 管理、事件处理） | 简单（API 友好） |
| 性能 | 低（高并发时） | 高 | 极高（零拷贝、对象池等优化） |
| 粘包处理 | 手动处理 | 手动处理 | 内置解码器 |
| 稳定性 | 一般 | 一般（需处理 JDK Bug） | 高（修复了 NIO 的已知 Bug） |
| 生态 | 无 | 无 | 丰富（协议支持、SSL、压缩等） |
| 适用场景 | 连接数少、学习 | 底层框架开发 | 生产环境网络应用 |

### 11.4.2 Netty 的零拷贝

Netty 在多个层面实现了零拷贝优化：

```java
// 1. CompositeByteBuf：逻辑合并多个 Buffer，避免内存拷贝
CompositeByteBuf composite = Unpooled.compositeBuffer();
composite.addHeader(headerBuf);  // 添加头部
composite.addBody(bodyBuf);      // 添加 body
// 两个 Buffer 逻辑上合并，但没有发生内存拷贝

// 2. slice()：共享底层内存，创建视图而非拷贝
ByteBuf buffer = Unpooled.buffer(100);
ByteBuf slice = buffer.slice(0, 50); // 共享内存，无拷贝

// 3. FileRegion：基于 sendfile 的文件传输
File file = new File("bigfile.dat");
FileInputStream fis = new FileInputStream(file);
FileChannel fc = fis.getChannel();
// 使用 DefaultFileRegion 实现零拷贝传输
DefaultFileRegion region = new DefaultFileRegion(fc, 0, file.length());
ctx.writeAndFlush(region);
```

### 11.4.3 Netty 的心跳机制

```java
// 使用 IdleStateHandler 实现心跳检测
pipeline.addLast(new IdleStateHandler(
        60,     // 读超时：60 秒没收到数据触发 READER_IDLE
        30,     // 写超时：30 秒没发送数据触发 WRITER_IDLE
        0,      // 读写超时：0 表示不检测
        TimeUnit.SECONDS
));

pipeline.addLast(new ChannelInboundHandlerAdapter() {
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) {
        if (evt instanceof IdleStateEvent) {
            IdleStateEvent event = (IdleStateEvent) evt;
            if (event.state() == IdleState.READER_IDLE) {
                // 读超时：客户端可能已断开，关闭连接
                ctx.close();
            } else if (event.state() == IdleState.WRITER_IDLE) {
                // 写超时：主动发送心跳包
                ctx.writeAndFlush("PING");
            }
        }
    }
});
```

## 11.5 核心知识点总结

| 知识点 | 核心要点 |
|--------|----------|
| Socket | 网络编程的抽象，封装 TCP/UDP 协议细节 |
| TCP 三次握手 | SYN → SYN+ACK → ACK，建立可靠连接 |
| TCP 四次挥手 | FIN → ACK → FIN → ACK，优雅断开连接 |
| BIO 模型 | 一连接一线程，适合连接数少的场景 |
| NIO 模型 | Selector 多路复用，一个线程管理多个连接 |
| Reactor 模式 | 单线程/多线程/主从 Reactor，解耦事件分发和业务处理 |
| Netty 架构 | EventLoopGroup + ChannelPipeline + Handler 链 |
| 粘包/拆包 | TCP 无消息边界，需通过定长、分隔符或长度字段解决 |
| Netty 优势 | API 友好、性能高、稳定性好、生态丰富 |

## 11.6 新手常见误区

### 误区 1：UDP 比 TCP 快，应该优先使用 UDP

**错误理解：** UDP 没有握手和确认机制，所以一定比 TCP 快。

**正确理解：** UDP 在"发送单个数据包"时确实比 TCP 快（没有握手和确认开销），但在传输大量数据或需要可靠性时，UDP 需要应用层自己实现重传、排序、流控，复杂度远高于 TCP。而且 TCP 有拥塞控制和流量控制，在网络拥堵时表现更好。选择 TCP 还是 UDP 要看场景：Web、文件传输用 TCP；视频直播、DNS、游戏用 UDP。

### 误区 2：NIO 的 Selector 可以跨线程使用

**错误理解：** 一个 Selector 可以被多个线程同时操作。

**正确理解：** Selector 不是线程安全的。一个 Selector 应该只被一个 EventLoop（线程）使用。如果多个线程同时调用 `select()` 或操作 `selectedKeys()`，会导致数据不一致。Netty 中每个 EventLoop 有自己的 Selector，保证了线程安全。

### 误区 3：Netty 的 Handler 是线程安全的

**错误理解：** 所有 Handler 都可以被多个 Channel 共享，不需要考虑线程安全。

**正确理解：** Handler 是否线程安全取决于它的实现。如果 Handler 有成员变量（状态），并且被多个 Channel 共享，就会有线程安全问题。解决方案：
1. 使用 `@Sharable` 注解并确保 Handler 无状态
2. 每个 Channel 创建独立的 Handler 实例（在 `initChannel` 中 new）
3. 使用 ThreadLocal 保存状态

### 误区 4：粘包是 TCP 的 Bug

**错误理解：** 粘包是 TCP 协议的缺陷，应该避免。

**正确理解：** 粘包不是 Bug，而是 TCP 的设计特性。TCP 是面向字节流的协议，它不关心应用层的消息边界。应用层必须自己定义消息边界（通过长度字段、分隔符等）。这是所有基于 TCP 的应用层协议（HTTP、FTP、自定义协议）都需要解决的问题。

### 误区 5：Netty 只能用于 TCP

**错误理解：** Netty 是一个 TCP 框架，不支持 UDP。

**正确理解：** Netty 同时支持 TCP 和 UDP。通过 `NioDatagramChannel` 可以使用 UDP 协议。Netty 的很多特性（如 Pipeline、Handler 链）对 UDP 同样适用。此外，Netty 还支持 Unix Domain Socket、SCTP 等协议。

## 11.7 动手练习

### 练习 1：实现一个简单的 RPC 框架

实现一个迷你 RPC 框架，要求：
1. 服务端暴露一个接口（如 UserService.getUser(id)）
2. 客户端通过 Socket 调用远程方法
3. 请求和响应使用 JSON 格式
4. 处理粘包问题（使用长度字段）

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

// RPC 请求对象
class RpcRequest implements Serializable {
    private String methodName;  // 方法名
    private Object[] args;      // 参数

    public RpcRequest(String methodName, Object... args) {
        this.methodName = methodName;
        this.args = args;
    }

    public String getMethodName() { return methodName; }
    public Object[] getArgs() { return args; }
}

// RPC 响应对象
class RpcResponse implements Serializable {
    private Object result;  // 返回结果
    private String error;   // 错误信息

    public static RpcResponse success(Object result) {
        RpcResponse resp = new RpcResponse();
        resp.result = result;
        return resp;
    }

    public static RpcResponse fail(String error) {
        RpcResponse resp = new RpcResponse();
        resp.error = error;
        return resp;
    }

    public Object getResult() { return result; }
    public String getError() { return error; }
}

// 服务端实现
class RpcServer {
    private int port;

    public RpcServer(int port) {
        this.port = port;
    }

    public void start() throws Exception {
        ServerSocket serverSocket = new ServerSocket(port);
        System.out.println("RPC 服务器启动，端口：" + port);

        while (true) {
            Socket socket = serverSocket.accept();
            new Thread(() -> handleRequest(socket)).start();
        }
    }

    private void handleRequest(Socket socket) {
        try {
            DataInputStream in = new DataInputStream(socket.getInputStream());
            DataOutputStream out = new DataOutputStream(socket.getOutputStream());

            // 读取请求长度（解决粘包）
            int requestLen = in.readInt();
            byte[] requestBytes = new byte[requestLen];
            in.readFully(requestBytes);

            // 反序列化请求（这里简化为字符串解析）
            String requestStr = new String(requestBytes, StandardCharsets.UTF_8);
            System.out.println("收到请求：" + requestStr);

            // 模拟业务处理
            String responseStr = "{\"result\": \"用户数据\"}";
            byte[] responseBytes = responseStr.getBytes(StandardCharsets.UTF_8);

            // 写入响应长度 + 响应内容
            out.writeInt(responseBytes.length);
            out.write(responseBytes);
            out.flush();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) throws Exception {
        new RpcServer(9090).start();
    }
}

// 客户端实现
class RpcClient {
    private String host;
    private int port;

    public RpcClient(String host, int port) {
        this.host = host;
        this.port = port;
    }

    public String invoke(String methodName, Object... args) throws Exception {
        Socket socket = new Socket(host, port);
        DataOutputStream out = new DataOutputStream(socket.getOutputStream());
        DataInputStream in = new DataInputStream(socket.getInputStream());

        // 构造请求
        String requestStr = "{\"method\":\"" + methodName + "\",\"args\":[]}";
        byte[] requestBytes = requestStr.getBytes(StandardCharsets.UTF_8);

        // 发送请求长度 + 请求内容
        out.writeInt(requestBytes.length);
        out.write(requestBytes);
        out.flush();

        // 读取响应长度 + 响应内容
        int responseLen = in.readInt();
        byte[] responseBytes = new byte[responseLen];
        in.readFully(responseBytes);

        socket.close();
        return new String(responseBytes, StandardCharsets.UTF_8);
    }

    public static void main(String[] args) throws Exception {
        RpcClient client = new RpcClient("127.0.0.1", 9090);
        String result = client.invoke("getUser", 1);
        System.out.println("调用结果：" + result);
    }
}
```
</details>

### 练习 2：使用 Netty 实现心跳检测

实现一个 Netty 服务端，要求：
1. 使用 IdleStateHandler 检测读超时
2. 如果 30 秒没收到客户端数据，发送 PING 消息
3. 如果 60 秒没收到客户端数据，关闭连接
4. 客户端定时发送 PONG 响应心跳

<details>
<summary>点击查看答案</summary>

```java
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;
import io.netty.handler.timeout.IdleStateEvent;
import io.netty.handler.timeout.IdleStateHandler;
import java.util.concurrent.TimeUnit;

public class HeartbeatServer {
    public static void main(String[] args) throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();

        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) {
                            ChannelPipeline pipeline = ch.pipeline();

                            // 添加心跳检测 Handler
                            // 参数：读超时 30 秒，写超时 0（不检测），读写超时 0
                            pipeline.addLast(new IdleStateHandler(30, 0, 0, TimeUnit.SECONDS));

                            pipeline.addLast(new StringDecoder());
                            pipeline.addLast(new StringEncoder());

                            // 添加业务 Handler
                            pipeline.addLast(new ChannelInboundHandlerAdapter() {
                                private int idleCount = 0; // 空闲次数计数

                                @Override
                                public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
                                    if (evt instanceof IdleStateEvent) {
                                        IdleStateEvent event = (IdleStateEvent) evt;
                                        if (event.state() == io.netty.handler.timeout.IdleState.READER_IDLE) {
                                            idleCount++;
                                            System.out.println("读超时 " + idleCount + " 次：" +
                                                    ctx.channel().remoteAddress());

                                            if (idleCount >= 2) {
                                                // 超过 2 次读超时（60 秒），关闭连接
                                                System.out.println("超过 60 秒无数据，关闭连接");
                                                ctx.close();
                                            } else {
                                                // 第一次读超时，发送 PING
                                                ctx.writeAndFlush("PING");
                                            }
                                        }
                                    } else {
                                        super.userEventTriggered(ctx, evt);
                                    }
                                }

                                @Override
                                public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                                    idleCount = 0; // 收到数据，重置计数
                                    String message = (String) msg;
                                    System.out.println("收到：" + message);

                                    if ("PONG".equalsIgnoreCase(message)) {
                                        System.out.println("收到心跳响应");
                                    } else {
                                        // 处理业务消息
                                        ctx.writeAndFlush("收到：" + message);
                                    }
                                }
                            });
                        }
                    });

            ChannelFuture future = bootstrap.bind(8080).sync();
            System.out.println("心跳服务器启动，端口：8080");
            future.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```
</details>

### 练习 3：实现一个简单的 Netty 协议解析器

实现一个自定义协议解析器，协议格式如下：
```
魔数（2 字节）| 版本（1 字节）| 消息长度（4 字节）| 消息内容
0xCAFE         0x01            4 字节整数          N 字节
```

要求：
1. 实现解码器：把字节流按协议格式解析成消息对象
2. 实现编码器：把消息对象按协议格式编码成字节流
3. 使用 Netty 的 ByteToMessageDecoder 和 MessageToByteEncoder

<details>
<summary>点击查看答案</summary>

```java
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ByteToMessageDecoder;
import io.netty.handler.codec.MessageToByteEncoder;
import java.util.List;

// 自定义消息对象
class CustomMessage {
    private short magic;    // 魔数：0xCAFE
    private byte version;   // 版本号
    private String content; // 消息内容

    public CustomMessage(short magic, byte version, String content) {
        this.magic = magic;
        this.version = version;
        this.content = content;
    }

    public short getMagic() { return magic; }
    public byte getVersion() { return version; }
    public String getContent() { return content; }

    @Override
    public String toString() {
        return String.format("CustomMessage{magic=0x%04X, version=%d, content='%s'}",
                magic, version, content);
    }
}

// 解码器：字节流 → CustomMessage
class CustomDecoder extends ByteToMessageDecoder {
    // 协议最小长度：魔数(2) + 版本(1) + 长度(4) = 7 字节
    private static final int HEADER_LENGTH = 7;
    // 魔数
    private static final short MAGIC = (short) 0xCAFE;

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        // 检查可读字节数是否至少包含头部
        if (in.readableBytes() < HEADER_LENGTH) {
            return; // 数据不够，等待更多数据
        }

        // 标记当前读位置，用于回退
        in.markReaderIndex();

        // 读取魔数
        short magic = in.readShort();
        if (magic != MAGIC) {
            throw new Exception("非法魔数：0x" + Integer.toHexString(magic));
        }

        // 读取版本号
        byte version = in.readByte();

        // 读取消息长度
        int contentLength = in.readInt();

        // 检查可读字节数是否包含完整消息体
        if (in.readableBytes() < contentLength) {
            // 数据不够，重置读指针，等待更多数据
            in.resetReaderIndex();
            return;
        }

        // 读取消息内容
        byte[] contentBytes = new byte[contentLength];
        in.readBytes(contentBytes);
        String content = new String(contentBytes, "UTF-8");

        // 创建消息对象并添加到输出列表
        out.add(new CustomMessage(magic, version, content));
    }
}

// 编码器：CustomMessage → 字节流
class CustomEncoder extends MessageToByteEncoder<CustomMessage> {
    @Override
    protected void encode(ChannelHandlerContext ctx, CustomMessage msg, ByteBuf out) throws Exception {
        // 写入魔数
        out.writeShort(msg.getMagic());
        // 写入版本号
        out.writeByte(msg.getVersion());

        // 获取消息内容的字节数组
        byte[] contentBytes = msg.getContent().getBytes("UTF-8");
        // 写入消息长度
        out.writeInt(contentBytes.length);
        // 写入消息内容
        out.writeBytes(contentBytes);
    }
}
```
</details>

## 下一章预告

下一章我们将学习 **动态代理原理**。什么是代理模式？JDK 动态代理是如何在运行时生成代理类的？CGLIB 又是如何通过继承实现代理的？Spring AOP 如何选择合适的代理方式？敬请期待！
