---
title: "第九章：IO/NIO 原理"
description: "深入理解 Java IO 与 NIO 的底层机制，掌握阻塞/非阻塞、多路复用、零拷贝等核心概念"
---

# 第九章：IO/NIO 原理

## 本章导读

本章将带你深入理解 Java IO 与 NIO 的底层工作原理。我们会从"数据是怎么从硬盘跑到程序里的"这个最基础的问题出发，逐步搞懂 BIO（阻塞IO）为什么效率低、NIO 的三大组件（Channel、Buffer、Selector）是如何协作的、零拷贝技术为什么能大幅提升性能、以及 DirectBuffer 和 HeapBuffer 到底有什么区别。

学完本章，你将能够：
- 理解 IO 的本质是数据在缓冲区之间的搬运
- 区分阻塞、非阻塞、多路复用三种 IO 模型
- 掌握 NIO 的 Channel、Buffer、Selector 三大核心组件
- 理解零拷贝的两种实现方式（mmap 和 sendfile）
- 了解 PageCache 机制和 DirectBuffer 的底层原理

## 9.1 为什么需要 IO/NIO？

### 生活中的类比

想象你是一个餐厅老板（CPU），顾客（数据）从仓库（硬盘）点菜。

**传统方式（程序直接读硬盘）：** 你亲自跑到仓库去搬食材，搬一趟回来做一道菜，再跑一趟搬下一批——你大部分时间都在路上跑，根本没空做菜。

**引入缓冲区（Buffer）：** 你在仓库门口放了一个推车（缓冲区），一次性把很多食材搬到推车上，再推回厨房慢慢做。这样你跑的次数大大减少，效率提升。

**NIO 的方式：** 你雇了一个服务员（Selector），让他盯着所有餐桌，哪桌客人举手了（有数据可读），你才去服务哪桌。这样你一个人就能服务很多桌客人。

### 技术层面的需求

在 Java 早期，只有 BIO（Blocking IO），它的问题很明显：

```java
// BIO 模型：每个连接需要一个独立线程
ServerSocket server = new ServerSocket(8080);
while (true) {
    Socket socket = server.accept(); // 阻塞等待，没有连接就干等着
    new Thread(() -> {
        // 处理这个连接的业务逻辑
        handle(socket);
    }).start();
}
// 问题：10000 个连接就需要 10000 个线程，内存和 CPU 都扛不住
```

当并发连接数增多时，BIO 的"一连接一线程"模型会导致：
1. **线程资源耗尽**：每个线程默认占用约 1MB 栈内存
2. **上下文切换开销大**：CPU 大量时间花在线程切换上
3. **扩展性差**：连接数超过一定量后系统崩溃

这就是为什么 Java 1.4 引入了 NIO（New IO / Non-blocking IO）。

## 9.2 核心原理

### 9.2.1 IO 的本质：数据在缓冲区之间传输

所有 IO 操作的本质都可以抽象为：

```
数据源 → [缓冲区A] → 处理 → [缓冲区B] → 数据目的地
```

比如从文件读取数据到程序：
```
硬盘文件 → [内核空间缓冲区] → [用户空间缓冲区] → 应用程序变量
```

这里涉及两个重要概念：
- **内核空间缓冲区**：操作系统管理的内存区域，硬件设备（硬盘、网卡）直接和它交互
- **用户空间缓冲区**：你的 Java 程序能访问的内存区域

数据必须先从硬盘到内核缓冲区，再从内核缓冲区拷贝到用户缓冲区，程序才能使用。这两步拷贝是 IO 的核心开销。

### 9.2.2 BIO（阻塞 IO）原理

BIO 的全称是 Blocking IO，核心特点是**调用 read/write 时，线程会被阻塞，直到数据准备好或写完**。

```
线程执行到 read()
    ↓
线程挂起（让出 CPU）
    ↓
操作系统等待硬盘/网卡把数据准备好
    ↓
数据从内核空间拷贝到用户空间
    ↓
线程被唤醒，继续执行
```

**BIO 的线程模型：**

```
┌─────────────────────────────────────┐
│           主线程（accept 阻塞）       │
│               ↓                     │
│         拿到一个连接                  │
│               ↓                     │
│    创建一个新线程去处理这个连接         │
│    （新线程里 read/write 也会阻塞）    │
│               ↓                     │
│    主线程继续回去 accept 下一个连接    │
└─────────────────────────────────────┘
```

问题很明显：连接多、但每个连接数据量小时（比如聊天服务器），大量线程在空等数据，浪费资源。

### 9.2.3 NIO 核心组件

NIO 有三大核心组件，它们的关系就像一条流水线：

```
Channel（通道）── 数据的来源/去向，相当于水管
    ↓
Buffer（缓冲区）── 临时存储数据，相当于水桶
    ↓
Selector（选择器）── 监控多个 Channel，相当于保安
```

#### Channel（通道）

Channel 和 Stream（流）的区别：
- Stream 是单向的（要么只读，要么只写）
- Channel 是双向的（既可以读，也可以写）
- Channel 总是和 Buffer 配合使用

常见实现：
- `FileChannel`：文件读写
- `SocketChannel`：TCP 网络读写
- `ServerSocketChannel`：TCP 服务端监听

#### Buffer（缓冲区）

Buffer 本质上是一块可以读写的内存，底层是一个数组。它有 4 个核心属性：

```
┌──────────────────────────────────────────────────┐
│  0    position    limit        capacity          │
│  ├───────┼───────────┼──────────┤               │
│  │ 已读  │  可读写区   │  不可用   │               │
│  └───────┴───────────┴──────────┘               │
└──────────────────────────────────────────────────┘

- capacity：缓冲区总容量（数组长度），创建后不可变
- limit：在写模式下等于 capacity；在读模式下等于之前写入的 position
- position：当前读写位置的下标
- mark：标记位置，用于 reset() 回退
```

**写数据 → flip() 切换读模式 → 读数据 → clear() 清空重置**，这是 Buffer 的标准使用流程。

#### Selector（选择器）

Selector 是 NIO 的灵魂，它让一个线程可以监控多个 Channel 的事件：

```
                    ┌── Channel1（有数据可读）
                    │
Selector ───────────┼── Channel2（连接已就绪）
（一个线程）         │
                    ├── Channel3（可写入数据）
                    │
                    └── Channel4（没有事件，不用管）
```

工作流程：
1. 把多个 Channel 注册到 Selector 上，并指定关注的事件（读、写、连接、接受）
2. 调用 `select()` 方法，线程会阻塞直到有事件发生
3. `select()` 返回后，通过 `selectedKeys()` 获取有事件的 Channel 集合
4. 逐个处理这些 Channel，处理完后再调用 `select()` 继续等待

这样，一个线程就能管理成千上万个连接！

### 9.2.4 阻塞 vs 非阻塞 vs 多路复用

| 模型 | 等待数据时线程状态 | 能同时监控多个连接 | 典型场景 |
|------|-------------------|-------------------|----------|
| 阻塞 IO（BIO） | 线程挂起等待 | 不能，一个线程一个连接 | 连接数少的场景 |
| 非阻塞 IO（NIO 的 Channel） | 线程不挂起，轮询检查 | 不能，需要自己轮询 | 很少单独使用 |
| IO 多路复用（Selector） | 线程在 select() 处等待 | 能，一个线程监控多个 | 高并发网络服务器 |

**生活类比：**

- **阻塞 IO**：你在餐厅点餐后一直站在窗口等，菜做好了才端走（期间不能做别的事）
- **非阻塞 IO**：你每隔 10 秒去窗口问"好了没"，没好就回去干点别的，再来问（反复跑很烦）
- **多路复用**：你坐在座位上，服务员（Selector）帮你盯着所有菜，哪个好了叫你端哪个（最高效）

### 9.2.5 零拷贝原理

传统 IO 读取文件并通过网络发送，需要 4 次数据拷贝和 2 次上下文切换：

```
传统 IO 流程：
1. 硬盘 → 内核缓冲区（DMA 拷贝）
2. 内核缓冲区 → 用户缓冲区（CPU 拷贝）  ← 多余的拷贝！
3. 用户缓冲区 → Socket 缓冲区（CPU 拷贝）  ← 多余的拷贝！
4. Socket 缓冲区 → 网卡（DMA 拷贝）

总共：4 次拷贝，4 次上下文切换
```

**零拷贝技术就是减少不必要的拷贝**，主要有两种方式：

#### mmap（内存映射文件）

```
mmap 流程：
1. 硬盘 → 内核缓冲区（DMA 拷贝）
2. 内核缓冲区与用户缓冲区共享同一块物理内存（无拷贝！）
3. 用户直接读取这块内存，相当于直接读内核缓冲区
4. 再从这块内存写到 Socket（CPU 拷贝）

总共：3 次拷贝，4 次上下文切换
减少了 1 次 CPU 拷贝
```

Java 中的 `MappedByteBuffer` 就是基于 mmap 实现的。

#### sendfile

```
sendfile 流程：
1. 硬盘 → 内核缓冲区（DMA 拷贝）
2. 内核缓冲区直接写到 Socket（DMA 拷贝，不经过用户空间！）

总共：2 次拷贝，2 次上下文切换
数据完全不经过用户空间，效率最高
```

Java 中的 `FileChannel.transferTo()` 就是基于 sendfile 实现的。

### 9.2.6 DirectBuffer vs HeapBuffer

| 特性 | HeapBuffer（堆内缓冲区） | DirectBuffer（直接内存缓冲区） |
|------|--------------------------|-------------------------------|
| 内存位置 | JVM 堆内存 | 操作系统直接内存（堆外） |
| 创建方式 | `ByteBuffer.allocate()` | `ByteBuffer.allocateDirect()` |
| GC 影响 | 受 GC 管理 | 不受 GC 直接管理 |
| 数据拷贝 | 读写时需要拷贝到内核空间 | 可以直接被操作系统访问，减少拷贝 |
| 创建销毁成本 | 低（只是分配数组） | 高（需要系统调用） |
| 适用场景 | 短生命周期、小数据量 | 长生命周期、大数据量、频繁 IO |

```java
// 堆内缓冲区：数据在 JVM 堆里
ByteBuffer heapBuf = ByteBuffer.allocate(1024);
// 写入文件时：堆内存 → 内核缓冲区 → 硬盘（多一次拷贝）

// 直接内存缓冲区：数据在操作系统管理的直接内存里
ByteBuffer directBuf = ByteBuffer.allocateDirect(1024);
// 写入文件时：直接内存 → 硬盘（少一次拷贝，因为 OS 可以直接访问这块内存）
```

### 9.2.7 文件 IO 底层原理：PageCache

Linux 系统中，文件 IO 并不是直接和硬盘交互的，而是通过 **PageCache（页缓存）** 中转：

```
写文件流程：
程序 write() → 数据写入 PageCache（内存） → 立即返回（快！）
                ↓
          操作系统后台异步把 PageCache 的数据刷到硬盘（延迟写）

读文件流程：
程序 read() → 先查 PageCache 有没有
           → 有：直接返回（命中缓存，快！）
           → 没有：从硬盘读到 PageCache，再返回给程序
```

**PageCache 的好处：**
1. 把随机写变成顺序写（合并多次小写入为一次大写入）
2. 读热数据不用访问硬盘（缓存命中）
3. 写操作可以立即返回（异步刷盘）

**PageCache 的风险：**
如果系统突然断电，PageCache 中还没刷到硬盘的数据就丢了。所以重要数据需要调用 `fsync()` 强制刷盘。

## 9.3 基础用法

### 9.3.1 NIO 读取文件示例

```java
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

public class NioFileReadDemo {
    public static void main(String[] args) throws Exception {
        // 创建随机访问文件对象，以只读模式打开文件
        RandomAccessFile file = new RandomAccessFile("data.txt", "r");

        // 获取文件通道（Channel），通道是双向的，这里用来读数据
        FileChannel channel = file.getChannel();

        // 创建一个容量为 1024 字节的堆内缓冲区
        ByteBuffer buffer = ByteBuffer.allocate(1024);

        // 从通道读取数据到缓冲区，返回值是实际读到的字节数
        // 如果返回 -1，表示已经读到文件末尾
        int bytesRead = channel.read(buffer);

        // 循环读取，直到文件末尾
        while (bytesRead != -1) {
            // flip()：切换读写模式，把 limit 设为当前 position，position 重置为 0
            // 这样接下来就能从缓冲区头部开始读取刚写入的数据
            buffer.flip();

            // 检查缓冲区中是否还有可读数据
            while (buffer.hasRemaining()) {
                // 读取一个字节并打印（强转为 char 显示字符）
                System.out.print((char) buffer.get());
            }

            // clear()：清空缓冲区，position 重置为 0，limit 恢复为 capacity
            // 注意：数据并没有被真正清除，只是重置了指针，准备重新写入
            buffer.clear();

            // 继续从通道读取下一批数据
            bytesRead = channel.read(buffer);
        }

        // 关闭通道和文件，释放资源
        channel.close();
        file.close();
    }
}
```

### 9.3.2 NIO Selector 服务端示例

```java
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.util.Iterator;
import java.util.Set;

public class NioServerDemo {
    public static void main(String[] args) throws Exception {
        // 创建服务端 Socket 通道，相当于开了一家餐厅
        ServerSocketChannel serverChannel = ServerSocketChannel.open();

        // 设置为非阻塞模式，accept() 不会阻塞等待
        serverChannel.configureBlocking(false);

        // 绑定端口号 8080，相当于餐厅开门营业
        serverChannel.bind(new InetSocketAddress(8080));

        // 创建选择器，相当于雇了一个服务员来监控所有餐桌
        Selector selector = Selector.open();

        // 把服务端通道注册到选择器上，关注"接受连接"事件
        // 注意：注册到 Selector 的 Channel 必须是非阻塞的
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("服务器启动，监听端口 8080...");

        // 无限循环，持续监控事件
        while (true) {
            // select()：阻塞等待，直到有注册的事件发生
            // 返回值是有多少个 Channel 准备好了事件
            selector.select();

            // 获取所有有事件的 SelectionKey 集合
            Set<SelectionKey> selectedKeys = selector.selectedKeys();

            // 遍历每个有事件的 Key
            Iterator<SelectionKey> iterator = selectedKeys.iterator();
            while (iterator.hasNext()) {
                SelectionKey key = iterator.next();

                // 判断是什么类型的事件
                if (key.isAcceptable()) {
                    // 有客户端连接过来了
                    ServerSocketChannel server = (ServerSocketChannel) key.channel();
                    SocketChannel client = server.accept(); // 接受连接

                    // 把客户端通道设置为非阻塞
                    client.configureBlocking(false);

                    // 把客户端通道注册到选择器，关注"可读"事件
                    // 同时附加一个 ByteBuffer，用于后续读写数据
                    client.register(selector, SelectionKey.OP_READ,
                            ByteBuffer.allocate(1024));
                    System.out.println("新客户端连接：" + client.getRemoteAddress());

                } else if (key.isReadable()) {
                    // 客户端发送数据过来了
                    SocketChannel client = (SocketChannel) key.channel();
                    // 从附加对象中取出之前绑定的缓冲区
                    ByteBuffer buffer = (ByteBuffer) key.attachment();

                    int bytesRead = client.read(buffer);
                    if (bytesRead == -1) {
                        // 客户端关闭了连接
                        client.close();
                        key.cancel();
                    } else {
                        // 切换读模式，处理数据
                        buffer.flip();
                        byte[] data = new byte[buffer.remaining()];
                        buffer.get(data);
                        System.out.println("收到消息：" + new String(data));

                        // 清空缓冲区，准备下次读取
                        buffer.clear();
                    }
                }

                // 处理完后，从集合中移除这个 Key，避免重复处理
                iterator.remove();
            }
        }
    }
}
```

### 9.3.3 零拷贝示例：FileChannel.transferTo

```java
import java.io.RandomAccessFile;
import java.nio.channels.FileChannel;
import java.nio.channels.SocketChannel;
import java.net.InetSocketAddress;

public class ZeroCopyDemo {
    public static void main(String[] args) throws Exception {
        // 打开要传输的文件
        RandomAccessFile file = new RandomAccessFile("bigfile.dat", "r");
        FileChannel fileChannel = file.getChannel();

        // 创建 TCP 连接
        SocketChannel socketChannel = SocketChannel.open(
                new InetSocketAddress("127.0.0.1", 9090));

        // 零拷贝：数据直接从文件通道传输到 Socket 通道
        // 底层使用 sendfile 系统调用，数据不经过用户空间
        // 参数：起始位置（0），传输长度（文件大小）
        fileChannel.transferTo(0, fileChannel.size(), socketChannel);

        // 对比传统方式（需要 4 次拷贝）：
        // ByteBuffer buffer = ByteBuffer.allocate(4096);
        // while (fileChannel.read(buffer) != -1) {
        //     buffer.flip();
        //     socketChannel.write(buffer);
        //     buffer.clear();
        // }

        // 关闭资源
        fileChannel.close();
        socketChannel.close();
    }
}
```

## 9.4 进阶用法

### 9.4.1 BIO vs NIO vs AIO 对比

| 对比项 | BIO（Blocking IO） | NIO（Non-blocking IO） | AIO（Asynchronous IO） |
|--------|-------------------|------------------------|------------------------|
| 数据读写方式 | 阻塞，线程挂起等待 | 非阻塞，轮询检查 | 异步，回调通知 |
| 线程模型 | 一连接一线程 | 多路复用，一线程多连接 | 回调机制，无需轮询 |
| 编程复杂度 | 简单直观 | 较复杂（需要管理 Buffer） | 最复杂（回调嵌套） |
| 适用场景 | 连接数少且固定 | 连接数多、短连接 | 连接数多且操作重 |
| Java 版本 | JDK 1.0 | JDK 1.4 | JDK 7 |
| 典型框架 | 传统 Servlet | Netty、Mina | 较少使用 |
| 底层实现 | 系统调用 read/write | epoll/kqueue（Linux/Mac） | 依赖操作系统异步 IO |

### 9.4.2 PageCache 对 Java 程序的影响

```java
// 示例：理解 write 和 fsync 的区别

import java.io.FileOutputStream;
import java.io.FileDescriptor;

public class PageCacheDemo {
    public static void main(String[] args) throws Exception {
        FileOutputStream fos = new FileOutputStream("test.txt");

        // write()：数据写入 PageCache（内存），立即返回
        // 此时数据还没有真正写到硬盘！
        fos.write("Hello World".getBytes());

        // 如果此时程序崩溃或断电，数据可能丢失

        // 获取底层文件描述符
        FileDescriptor fd = fos.getFD();

        // fsync()：强制把 PageCache 中的数据刷到硬盘
        // 这是一个阻塞操作，要等数据真正写入硬盘才返回
        // 保证数据持久化，但性能较低
        sync(fd);

        fos.close();
    }

    // 通过反射调用 native 方法实现 fsync
    private static void sync(FileDescriptor fd) throws Exception {
        // 实际项目中可以使用 RandomAccessFile 的 getFD().sync()
    }
}
```

### 9.4.3 DirectBuffer 的正确使用方式

```java
import java.nio.ByteBuffer;

public class DirectBufferDemo {
    public static void main(String[] args) {
        // 错误示范：频繁创建和销毁 DirectBuffer
        // 每次创建都要调用系统调用分配直接内存，开销很大
        for (int i = 0; i < 10000; i++) {
            ByteBuffer buf = ByteBuffer.allocateDirect(1024);
            // 用完就丢弃，等待 GC 回收直接内存很慢
        }

        // 正确做法：复用 DirectBuffer
        ByteBuffer reusableBuffer = ByteBuffer.allocateDirect(4096);
        for (int i = 0; i < 10000; i++) {
            reusableBuffer.clear(); // 重置指针，复用同一块内存
            // 使用 buffer...
        }

        // 注意：DirectBuffer 的释放
        // DirectBuffer 的内存不受 GC 直接管理
        // 它通过 Cleaner 机制在 GC 时间接释放，但时机不确定
        // 重要场景建议手动释放（JDK 9+ 可以用 Unsafe 或 Cleaner）
    }
}
```

## 9.5 核心知识点总结

| 知识点 | 核心要点 |
|--------|----------|
| IO 本质 | 数据在内核缓冲区和用户缓冲区之间传输，拷贝次数和上下文切换是性能瓶颈 |
| BIO 模型 | 阻塞式，一连接一线程，适合连接数少的场景 |
| NIO 三大组件 | Channel（双向通道）、Buffer（缓冲区）、Selector（多路复用器） |
| Buffer 核心操作 | put() 写入 → flip() 切换 → get() 读取 → clear() 重置 |
| Selector 原理 | 基于操作系统的 epoll/kqueue，一个线程监控多个 Channel 的 IO 事件 |
| 零拷贝 | mmap 减少 1 次 CPU 拷贝，sendfile 减少 2 次拷贝，数据不经过用户空间 |
| DirectBuffer | 分配在直接内存，减少一次拷贝，但创建销毁成本高，适合复用 |
| PageCache | 操作系统缓存文件数据的内存区域，写操作先写 PageCache 再异步刷盘 |
| BIO vs NIO vs AIO | 阻塞/多路复用/异步回调，适用场景不同 |

## 9.6 新手常见误区

### 误区 1：NIO 就是非阻塞 IO

**错误理解：** NIO 的 Channel 一定是非阻塞的。

**正确理解：** NIO 的 Channel 默认是阻塞的，需要手动调用 `configureBlocking(false)` 设置为非阻塞。而且只有非阻塞的 Channel 才能注册到 Selector 上。Selector 本身是阻塞等待事件的（`select()` 会阻塞），但好处是一个线程能监控多个连接。

### 误区 2：零拷贝就是完全不需要 CPU 参与

**错误理解：** 零拷贝意味着数据传输不需要 CPU。

**正确理解：** 零拷贝减少的是 CPU 参与的数据拷贝次数，不是完全不用 CPU。DMA（直接内存访问）控制器负责硬件和内存之间的数据传输，但某些环节（如 sendfile 的 header/trailer）仍需要 CPU 参与。"零拷贝"的"零"指的是用户空间不需要参与拷贝。

### 误区 3：DirectBuffer 一定比 HeapBuffer 快

**错误理解：** 所有场景都应该使用 DirectBuffer。

**正确理解：** DirectBuffer 的创建和销毁成本远高于 HeapBuffer（需要系统调用）。只有在数据量大、生命周期长、频繁进行 IO 操作的场景下，DirectBuffer 减少拷贝的优势才能抵消其创建成本。对于小数据量或短生命周期的场景，HeapBuffer 反而更快。

### 误区 4：Buffer 的 clear() 会清除数据

**错误理解：** `buffer.clear()` 会把缓冲区里的数据清空。

**正确理解：** `clear()` 只是重置了 position 和 limit 指针（position=0, limit=capacity），底层数组的数据还在。下次写入新数据时会覆盖旧数据。如果想真正清除数据，需要手动 `Arrays.fill(buffer.array(), (byte) 0)` 或者用 `buffer.clear()` 后写入新数据覆盖。

### 误区 5：AIO 是 NIO 的升级版，应该优先使用

**错误理解：** AIO 比 NIO 先进，新项目都应该用 AIO。

**正确理解：** AIO（异步 IO）在 Linux 上的实现并不成熟，底层仍然是基于 epoll 模拟的，性能不一定比 NIO 好。业界主流的高性能网络框架（如 Netty）都基于 NIO 而非 AIO。AIO 更适合 Windows 平台（Windows 原生支持异步 IO）。选择 NIO 还是 AIO 要看具体平台和场景。

## 9.7 动手练习

### 练习 1：实现一个简单的文件复制程序

使用 FileChannel 和 ByteBuffer 实现文件复制，要求：
1. 使用 NIO 的方式（Channel + Buffer）
2. 支持大文件（使用循环读取）
3. 打印复制所花费的时间

<details>
<summary>点击查看答案</summary>

```java
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

public class FileCopyDemo {
    public static void main(String[] args) throws Exception {
        // 记录开始时间
        long startTime = System.currentTimeMillis();

        // 打开源文件（只读模式）
        RandomAccessFile srcFile = new RandomAccessFile("source.dat", "r");
        FileChannel srcChannel = srcFile.getChannel();

        // 打开目标文件（读写模式，不存在则创建）
        RandomAccessFile destFile = new RandomAccessFile("dest.dat", "rw");
        FileChannel destChannel = destFile.getChannel();

        // 创建 8KB 的缓冲区（8192 字节是比较常用的缓冲区大小）
        ByteBuffer buffer = ByteBuffer.allocate(8192);

        // 循环读取源文件，直到文件末尾
        while (srcChannel.read(buffer) != -1) {
            // 切换为读模式
            buffer.flip();

            // 把缓冲区的数据写入目标文件
            destChannel.write(buffer);

            // 清空缓冲区，准备下次读取
            buffer.clear();
        }

        // 关闭所有资源
        srcChannel.close();
        destChannel.close();
        srcFile.close();
        destFile.close();

        // 计算并打印耗时
        long endTime = System.currentTimeMillis();
        System.out.println("文件复制完成，耗时：" + (endTime - startTime) + " 毫秒");

        // 更优方案：使用零拷贝（一行代码搞定）
        // srcChannel.transferTo(0, srcChannel.size(), destChannel);
    }
}
```
</details>

### 练习 2：使用 Selector 实现多客户端聊天室

实现一个简单的群聊服务器：
1. 多个客户端可以连接到服务器
2. 任一客户端发送消息，服务器将消息转发给所有其他客户端
3. 使用 Selector 管理所有连接

<details>
<summary>点击查看答案</summary>

```java
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.util.Set;

public class ChatServer {
    private Selector selector;
    private ServerSocketChannel serverChannel;

    public void start(int port) throws Exception {
        // 创建并配置服务端通道
        serverChannel = ServerSocketChannel.open();
        serverChannel.configureBlocking(false);
        serverChannel.bind(new InetSocketAddress(port));

        // 创建选择器
        selector = Selector.open();

        // 注册服务端通道，关注连接事件
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("聊天服务器启动，端口：" + port);

        while (true) {
            selector.select(); // 等待事件
            Set<SelectionKey> keys = selector.selectedKeys();

            for (SelectionKey key : keys) {
                if (key.isAcceptable()) {
                    // 处理新连接
                    SocketChannel client = serverChannel.accept();
                    client.configureBlocking(false);
                    client.register(selector, SelectionKey.OP_READ);
                    System.out.println("新用户加入聊天室");

                } else if (key.isReadable()) {
                    // 处理客户端消息
                    SocketChannel client = (SocketChannel) key.channel();
                    ByteBuffer buffer = ByteBuffer.allocate(1024);
                    int bytesRead = client.read(buffer);

                    if (bytesRead > 0) {
                        buffer.flip();
                        byte[] data = new byte[buffer.remaining()];
                        buffer.get(data);
                        String message = new String(data, StandardCharsets.UTF_8);

                        // 转发消息给所有其他客户端
                        broadcast(client, message);
                    } else {
                        // 客户端断开连接
                        client.close();
                        key.cancel();
                        System.out.println("用户离开聊天室");
                    }
                }
            }
            keys.clear(); // 清空已处理的 Key
        }
    }

    // 广播消息给所有其他客户端
    private void broadcast(SocketChannel sender, String message) throws Exception {
        for (SelectionKey key : selector.keys()) {
            if (key.isValid() && key.channel() instanceof SocketChannel) {
                SocketChannel client = (SocketChannel) key.channel();
                if (client != sender) { // 不发给发送者自己
                    ByteBuffer buffer = ByteBuffer.wrap(message.getBytes(StandardCharsets.UTF_8));
                    client.write(buffer);
                }
            }
        }
    }

    public static void main(String[] args) throws Exception {
        new ChatServer().start(9090);
    }
}
```
</details>

### 练习 3：对比传统 IO 和零拷贝的文件传输性能

编写一个性能测试程序：
1. 创建一个 100MB 的测试文件
2. 分别用传统 IO（循环 read/write）和零拷贝（transferTo）传输到另一个文件
3. 对比两种方式的耗时差异

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

public class ZeroCopyBenchmark {
    public static void main(String[] args) throws Exception {
        // 准备测试文件
        createTestFile("test_100mb.dat", 100 * 1024 * 1024);

        // 测试传统 IO 方式
        long start1 = System.currentTimeMillis();
        traditionalCopy("test_100mb.dat", "dest_traditional.dat");
        long end1 = System.currentTimeMillis();
        System.out.println("传统 IO 耗时：" + (end1 - start1) + " ms");

        // 测试零拷贝方式
        long start2 = System.currentTimeMillis();
        zeroCopyTransfer("test_100mb.dat", "dest_zerocopy.dat");
        long end2 = System.currentTimeMillis();
        System.out.println("零拷贝耗时：" + (end2 - start2) + " ms");

        // 清理测试文件
        new File("test_100mb.dat").delete();
        new File("dest_traditional.dat").delete();
        new File("dest_zerocopy.dat").delete();
    }

    // 创建指定大小的测试文件
    static void createTestFile(String path, int size) throws Exception {
        FileOutputStream fos = new FileOutputStream(path);
        byte[] data = new byte[1024]; // 1KB 的数据块
        for (int i = 0; i < size / 1024; i++) {
            fos.write(data);
        }
        fos.close();
    }

    // 传统 IO 复制：4 次拷贝
    static void traditionalCopy(String src, String dest) throws Exception {
        FileInputStream fis = new FileInputStream(src);
        FileOutputStream fos = new FileOutputStream(dest);
        byte[] buffer = new byte[8192]; // 8KB 缓冲区
        int bytesRead;
        while ((bytesRead = fis.read(buffer)) != -1) {
            fos.write(buffer, 0, bytesRead);
        }
        fis.close();
        fos.close();
    }

    // 零拷贝：使用 transferTo（sendfile）
    static void zeroCopyTransfer(String src, String dest) throws Exception {
        FileInputStream fis = new FileInputStream(src);
        FileOutputStream fos = new FileOutputStream(dest);
        FileChannel srcChannel = fis.getChannel();
        FileChannel destChannel = fos.getChannel();

        // 零拷贝：数据直接从文件到文件，不经过用户空间
        srcChannel.transferTo(0, srcChannel.size(), destChannel);

        srcChannel.close();
        destChannel.close();
        fis.close();
        fos.close();
    }
}
```
</details>

## 下一章预告

下一章我们将学习 **序列化原理**。对象在内存中是以引用的形式存在的，如何把对象转换成字节流以便存储或传输？Java 原生序列化有什么坑？为什么阿里巴巴开发规范不推荐使用 Java 原生序列化？JSON 序列化的底层又是如何工作的？敬请期待！
