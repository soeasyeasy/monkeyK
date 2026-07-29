---
title: "第5章：事件驱动模型"
description: "ae 事件循环、文件事件、时间事件、aeApiSelect 多路复用底层实现"
---

# 第5章：事件驱动模型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 的事件循环是怎么工作的？
- 文件事件和时间事件有什么区别？
- Redis 是如何处理网络请求的？
- 多路复用的底层实现是什么？

这一章就是为了解答这些问题。我们会深入 **ae 事件循环**，搞清楚 **文件事件与时间事件**，弄明白 **多路复用的底层实现**。

---

## 1 为什么需要事件驱动模型？

### 痛点分析

传统的多线程模型有很多问题：

```c
// 传统模型：每个连接一个线程
pthread_create(&thread1, handle_client1);
pthread_create(&thread2, handle_client2);
// ...

// 问题：
// 1. 线程创建销毁开销大
// 2. 线程切换开销大
// 3. 内存占用高（每个线程需要栈空间）
// 4. 并发控制复杂（需要锁）
```

### 解决方案

Redis 使用 **事件驱动模型**：

```c
// 事件驱动模型：单线程处理所有连接
while (!stop) {
    // 1. 处理时间事件
    processTimeEvents();
    
    // 2. 处理文件事件
    processFileEvents();
}
```

打个比方：

> 事件驱动模型就像"一个高效的服务员"——他不需要为每桌客人单独安排一个服务员，而是自己一个人就能服务所有桌子。客人有需要时举手（事件），服务员看到后过去处理。

---

## 2 ae 事件循环

### 2.1 核心结构

```c
// ae 事件循环的核心结构
typedef struct aeEventLoop {
    int maxfd;              // 最大文件描述符
    int nevents;            // 当前事件数量
    aeFileEvent *events;    // 文件事件数组
    aeTimeEvent *timeEvents;// 时间事件链表
    void *apidata;          // 多路复用库的私有数据
    aeEventLoopStopProc *stop;  // 停止标志
} aeEventLoop;
```

### 2.2 初始化流程

```c
// 创建事件循环
aeEventLoop *aeCreateEventLoop(int setsize) {
    aeEventLoop *eventLoop = zmalloc(sizeof(*eventLoop));
    
    // 初始化文件事件数组
    eventLoop->events = zmalloc(sizeof(aeFileEvent) * setsize);
    
    // 初始化多路复用器
    eventLoop->apidata = aeApiCreate();
    
    // 初始化时间事件链表
    eventLoop->timeEvents = NULL;
    
    return eventLoop;
}
```

---

## 3 文件事件

### 3.1 文件事件结构

```c
// 文件事件
typedef struct aeFileEvent {
    int mask;               // 事件类型（读/写/异常）
    aeFileProc *rfileProc;  // 读事件处理函数
    aeFileProc *wfileProc;  // 写事件处理函数
    void *clientData;       // 客户端数据
} aeFileEvent;

// 事件类型
#define AE_READABLE 1   // 读事件
#define AE_WRITABLE 2   // 写事件
#define AE_BARRIER 4    // 屏障事件
```

### 3.2 文件事件处理流程

```
// 文件事件处理流程
1. 客户端发送请求
   ↓
2. 多路复用器检测到可读事件
   ↓
3. 触发读事件处理函数
   ↓
4. 读取请求数据
   ↓
5. 解析并执行命令
   ↓
6. 准备响应数据
   ↓
7. 注册写事件
   ↓
8. 多路复用器检测到可写事件
   ↓
9. 触发写事件处理函数
   ↓
10. 发送响应给客户端
```

### 3.3 读事件处理

```c
// 读事件处理函数
void readQueryFromClient(aeEventLoop *el, int fd, void *privdata, int mask) {
    client *c = getClient(fd);
    
    // 读取请求数据
    nread = read(fd, c->buf + c->querybuf_len, remaining);
    
    // 解析请求
    processInputBuffer(c);
}
```

### 3.4 写事件处理

```c
// 写事件处理函数
void sendReplyToClient(aeEventLoop *el, int fd, void *privdata, int mask) {
    client *c = getClient(fd);
    
    // 发送响应数据
    nwritten = write(fd, c->buf + c->sentlen, c->buflen - c->sentlen);
    
    // 更新发送进度
    c->sentlen += nwritten;
    
    // 如果发送完成，删除写事件
    if (c->sentlen == c->buflen) {
        c->sentlen = 0;
        aeDeleteFileEvent(el, fd, AE_WRITABLE);
    }
}
```

---

## 4 时间事件

### 4.1 时间事件结构

```c
// 时间事件
typedef struct aeTimeEvent {
    long long id;             // 事件 ID
    long when_sec;            // 到达时间的秒部分
    long when_ms;             // 到达时间的毫秒部分
    aeTimeProc *timeProc;     // 事件处理函数
    aeEventFinalizerProc *finalizerProc;  // 清理函数
    void *clientData;         // 客户端数据
    struct aeTimeEvent *next; // 下一个时间事件
    struct aeTimeEvent *prev; // 上一个时间事件
} aeTimeEvent;
```

### 4.2 时间事件类型

| 类型 | 说明 | 例子 |
|------|------|------|
| 定时事件 | 执行一次后删除 | 定时任务 |
| 周期性事件 | 执行后重新注册 | 服务器定时操作 |

### 4.3 常见时间事件

```c
// 服务器定时操作
int serverCron(struct aeEventLoop *eventLoop, long long id, void *clientData) {
    // 1. 更新服务器统计信息
    server.stat_numcommands++;
    
    // 2. 清理过期键
    activeExpireCycle();
    
    // 3. 检查客户端超时
    closeTimedoutClients();
    
    // 4. 执行持久化操作
    rdbSaveBackground();
    
    // 5. 增加 rehash 进度
    if (server.rehashing) {
        dictRehashMilliseconds(1);
    }
    
    // 返回下次执行的时间间隔（毫秒）
    return 1000 / server.hz;  // 默认 100ms
}
```

打个比方：

> 时间事件就像"闹钟"——设定好时间后，到点就响。Redis 用时间事件来处理定时任务，比如清理过期键、执行持久化等。

---

## 5 事件循环主流程

### 5.1 主循环代码

```c
// 事件循环主流程
void aeMain(aeEventLoop *eventLoop) {
    while (!eventLoop->stop) {
        // 1. 处理到期的时间事件
        if (eventLoop->timeEvents != NULL) {
            aeProcessTimeEvents(eventLoop);
        }
        
        // 2. 处理文件事件（阻塞等待）
        aeProcessFileEvents(eventLoop);
    }
}
```

### 5.2 文件事件处理

```c
// 处理文件事件
int aeProcessFileEvents(aeEventLoop *eventLoop) {
    int processed = 0;
    
    // 1. 调用多路复用 API，等待事件
    numevents = aeApiPoll(eventLoop, timeout);
    
    // 2. 遍历所有就绪事件
    for (int j = 0; j < numevents; j++) {
        int fd = eventLoop->fired[j].fd;
        int mask = eventLoop->fired[j].mask;
        aeFileEvent *fe = &eventLoop->events[fd];
        
        // 3. 处理读事件
        if (mask & AE_READABLE) {
            fe->rfileProc(eventLoop, fd, fe->clientData, mask);
        }
        
        // 4. 处理写事件
        if (mask & AE_WRITABLE) {
            fe->wfileProc(eventLoop, fd, fe->clientData, mask);
        }
        
        processed++;
    }
    
    return processed;
}
```

### 5.3 时间事件处理

```c
// 处理时间事件
int aeProcessTimeEvents(aeEventLoop *eventLoop) {
    int processed = 0;
    aeTimeEvent *te = eventLoop->timeEvents;
    
    // 遍历所有时间事件
    while (te != NULL) {
        // 检查是否到期
        if (te->when_sec < now_sec || 
            (te->when_sec == now_sec && te->when_ms <= now_ms)) {
            
            // 执行处理函数
            int retval = te->timeProc(eventLoop, te->id, te->clientData);
            
            // 如果是周期性事件，重新设置时间
            if (retval != AE_NOMORE) {
                te->when_sec = now_sec + retval / 1000;
                te->when_ms = now_ms + retval % 1000;
            } else {
                // 否则删除事件
                aeDeleteTimeEvent(eventLoop, te->id);
            }
            
            processed++;
        }
        
        te = te->next;
    }
    
    return processed;
}
```

---

## 6 多路复用底层实现

### 6.1 ae API 抽象

```c
// ae 库对多路复用的抽象
typedef struct aeApiState {
    int epfd;                   // epoll 文件描述符
    struct epoll_event *events; // 事件数组
} aeApiState;

// 创建多路复用器
int aeApiCreate(aeEventLoop *eventLoop) {
    aeApiState *state = zmalloc(sizeof(aeApiState));
    state->epfd = epoll_create(1);
    state->events = zmalloc(sizeof(struct epoll_event) * setsize);
    eventLoop->apidata = state;
    return 0;
}

// 添加事件
int aeApiAddEvent(aeEventLoop *eventLoop, int fd, int mask) {
    aeApiState *state = eventLoop->apidata;
    struct epoll_event ee;
    
    // 设置事件类型
    ee.events = 0;
    if (mask & AE_READABLE) ee.events |= EPOLLIN;
    if (mask & AE_WRITABLE) ee.events |= EPOLLOUT;
    
    ee.data.fd = fd;
    
    // 调用 epoll_ctl 添加事件
    epoll_ctl(state->epfd, EPOLL_CTL_ADD, fd, &ee);
    return 0;
}

// 等待事件
int aeApiPoll(aeEventLoop *eventLoop, int timeout) {
    aeApiState *state = eventLoop->apidata;
    
    // 调用 epoll_wait 等待事件
    int retval = epoll_wait(state->epfd, state->events, setsize, timeout);
    
    // 将就绪事件复制到 fired 数组
    for (int i = 0; i < retval; i++) {
        int mask = state->events[i].events;
        int fd = state->events[i].data.fd;
        
        eventLoop->fired[i].fd = fd;
        eventLoop->fired[i].mask = 0;
        
        if (mask & EPOLLIN) eventLoop->fired[i].mask |= AE_READABLE;
        if (mask & EPOLLOUT) eventLoop->fired[i].mask |= AE_WRITABLE;
    }
    
    return retval;
}
```

### 6.2 不同平台的实现

| 平台 | 多路复用 API | 说明 |
|------|--------------|------|
| Linux | epoll | 性能最好，Redis 首选 |
| macOS/BSD | kqueue | 性能接近 epoll |
| Windows | select | 性能较差，不推荐 |
| Solaris | evport | 高性能，但使用较少 |

---

## 7 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| ae 事件循环 | Redis 的事件驱动核心，处理文件事件和时间事件 |
| 文件事件 | 处理网络 IO，包括读事件和写事件 |
| 时间事件 | 定时任务，如清理过期键、执行持久化 |
| 多路复用 | epoll/kqueue/select，一个线程监控多个连接 |
| 事件处理流程 | 先处理时间事件，再处理文件事件 |

---

## 8 新手常见误区

### 误区 1："事件循环会阻塞"

**不完全对。** 事件循环在等待文件事件时会阻塞（epoll_wait），但一旦有事件就会立即处理。时间事件是定时触发，不会阻塞主流程。

### 误区 2："文件事件和时间事件是同时处理的"

**不是的。** Redis 先处理时间事件，再处理文件事件。这样可以保证定时任务优先执行。

### 误区 3："多路复用只能在 Linux 下使用"

**错！** 多路复用在不同平台有不同实现：Linux 用 epoll，macOS/BSD 用 kqueue，Windows 用 select。Redis 的 ae 库封装了这些差异。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：画出 ae 事件循环的结构，说明文件事件和时间事件的区别。

<details>
<summary>点击查看答案</summary>

```
ae 事件循环结构：

┌─────────────────────────────────────┐
│         aeEventLoop                 │
├─────────────────────────────────────┤
│ maxfd: 最大文件描述符               │
│ nevents: 当前事件数量               │
│ events[]: 文件事件数组              │
│ timeEvents: 时间事件链表            │
│ apidata: 多路复用器私有数据         │
└─────────────────────────────────────┘

文件事件 vs 时间事件：

| 特性 | 文件事件 | 时间事件 |
|------|----------|----------|
| 触发条件 | 网络 IO 就绪 | 时间到达 |
| 处理方式 | 多路复用检测 | 定时检查 |
| 典型应用 | 客户端读写 | 定时任务 |
| 阻塞等待 | 是 | 否 |
```

</details>

### 练习 2：进阶练习

**题目**：解释 epoll 的底层原理，为什么它比 select 快？

<details>
<summary>点击查看答案</summary>

```
epoll 底层原理：

1. 数据结构
   - 红黑树：存储所有监控的 fd
   - 就绪链表：存储有事件的 fd

2. 工作流程
   - epoll_create：创建 epoll 实例
   - epoll_ctl：添加/修改/删除监控的 fd
   - epoll_wait：等待事件，只返回有事件的 fd

3. 为什么比 select 快
   - select 每次都要遍历所有 fd（O(n)）
   - epoll 只返回有事件的 fd（O(1)）
   - fd 数量越多，epoll 优势越明显
```

</details>

### 练习 3（挑战）：综合练习

**题目**：手写一个简单的 ae 事件循环伪代码，实现处理文件事件和时间事件。

<details>
<summary>点击查看答案</summary>

```c
// 简单的 ae 事件循环伪代码

typedef struct aeEventLoop {
    int maxfd;
    aeFileEvent *events;
    aeTimeEvent *timeEvents;
    void *apidata;
} aeEventLoop;

void aeMain(aeEventLoop *eventLoop) {
    while (!eventLoop->stop) {
        // 1. 处理时间事件
        aeTimeEvent *te = eventLoop->timeEvents;
        while (te != NULL) {
            if (isTimeExpired(te)) {
                te->timeProc(eventLoop, te->id, te->clientData);
            }
            te = te->next;
        }
        
        // 2. 处理文件事件
        int numevents = aeApiPoll(eventLoop, 100);
        for (int i = 0; i < numevents; i++) {
            int fd = eventLoop->fired[i].fd;
            int mask = eventLoop->fired[i].mask;
            
            if (mask & AE_READABLE) {
                eventLoop->events[fd].rfileProc(eventLoop, fd, ...);
            }
            if (mask & AE_WRITABLE) {
                eventLoop->events[fd].wfileProc(eventLoop, fd, ...);
            }
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **RDB 持久化原理**——搞清楚 bgsave 的写时复制机制、fork 的底层原理、RDB 文件格式、以及恢复流程。
