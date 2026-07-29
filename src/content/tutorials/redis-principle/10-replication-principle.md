---
title: "第10章：主从复制原理"
description: "全量同步与增量同步、replconf、复制偏移量、复制积压缓冲区、心跳机制"
---

# 第10章：主从复制原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 主从复制是怎么工作的？从节点如何同步主节点的数据？
- 全量同步和增量同步有什么区别？什么时候触发？
- 复制偏移量是什么？复制积压缓冲区有什么作用？
- 主从之间的心跳机制是怎么实现的？

这一章就是为了解答这些问题。我们会深入 **主从复制的底层原理**，搞清楚 **全量同步与增量同步机制**，弄明白 **复制偏移量与心跳机制**。

---

## 1 为什么需要主从复制？

### 痛点分析

单节点 Redis 有很多问题：

```
// 单节点的问题
1. 单点故障：服务器宕机，服务中断
2. 读写压力：所有请求都打到一台机器
3. 数据备份：没有冗余，数据丢失风险高
```

### 解决方案

主从复制：

```
// 主从架构
Master（主节点）
├── Slave1（从节点 1）
├── Slave2（从节点 2）
└── Slave3（从节点 3）

// 优势
1. 读写分离：主节点写，从节点读
2. 高可用：主节点故障，从节点可以顶上
3. 数据冗余：多个副本，降低丢失风险
```

---

## 2 主从复制流程

### 2.1 连接阶段

```
// 从节点连接主节点
1. 从节点创建 Socket 连接
   ↓
2. 发送 PING 命令，确认主节点可用
   ↓
3. 发送 AUTH 命令（如果需要密码）
   ↓
4. 发送 REPLCONF listening-port <port>
   ↓
5. 发送 REPLCONF capa eof capa psync2
   ↓
6. 发送 PSYNC <runid> <offset>
```

### 2.2 同步阶段

```
// 主节点响应 PSYNC
// 情况 1：全量同步
PSYNC ? -1
→ 主节点返回 +FULLRESYNC <runid> <offset>
→ 主节点生成 RDB 文件，发送给从节点
→ 从节点加载 RDB 文件
→ 主节点继续发送积压的命令

// 情况 2：增量同步
PSYNC <runid> <offset>
→ 主节点返回 +CONTINUE
→ 主节点发送 offset 之后的命令
```

### 2.3 命令传播阶段

```
// 正常状态
// 主节点执行写命令后，将命令发送给从节点
// 从节点接收并执行命令

// 流程
主节点执行 SET key value
   ↓
主节点发送 *3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n
   ↓
从节点接收并执行
   ↓
从节点更新复制偏移量
```

---

## 3 全量同步

### 3.1 触发条件

```
// 全量同步的触发条件
1. 从节点第一次连接主节点
2. 从节点的 runid 与主节点不匹配
3. 从节点的 offset 不在主节点的复制积压缓冲区中

// 示例
PSYNC ? -1
// ? 表示 runid 未知
// -1 表示 offset 为 -1
// 触发全量同步
```

### 3.2 执行流程

```
// 全量同步的执行流程
1. 主节点执行 BGSAVE，生成 RDB 文件
   ↓
2. 主节点将 RDB 文件发送给从节点
   ↓
3. 从节点加载 RDB 文件到内存
   ↓
4. 主节点继续发送积压缓冲区中的命令
   ↓
5. 从节点执行这些命令
   ↓
6. 同步完成，进入命令传播阶段
```

### 3.3 代码实现

```c
// 全量同步的核心代码
void syncCommand(client *c) {
    // 1. 检查是否已经同步
    if (c->flags & CLIENT_SLAVE && c->replstate == SLAVE_STATE_ONLINE) {
        addReplyError(c, "Already a slave");
        return;
    }
    
    // 2. 设置从节点状态
    c->flags |= CLIENT_SLAVE;
    c->replstate = SLAVE_STATE_WAIT_BGSAVE_START;
    
    // 3. 执行 BGSAVE
    if (server.rdb_child_pid != -1) {
        // 等待现有的 BGSAVE 完成
        c->replstate = SLAVE_STATE_WAIT_BGSAVE_END;
    } else {
        // 立即执行 BGSAVE
        startBgsaveForReplication(c);
    }
}

// BGSAVE 完成后，发送 RDB 文件
void sendBulkToSlave(aeEventLoop *el, int fd, void *privdata, int mask) {
    // 1. 读取 RDB 文件
    // 2. 发送给从节点
    // 3. 发送完成后，切换到命令传播阶段
}
```

打个比方：

> 全量同步就像"复制整个文件夹"：
> - 主节点打包所有数据（生成 RDB）
> - 发送给从节点（传输 RDB）
> - 从节点解压并加载（恢复数据）
> - 然后开始同步增量变化

---

## 4 增量同步

### 4.1 触发条件

```
// 增量同步的触发条件
1. 从节点的 runid 与主节点匹配
2. 从节点的 offset 在主节点的复制积压缓冲区中

// 示例
PSYNC <runid> <offset>
// runid 匹配，offset 在缓冲区中
// 触发增量同步
```

### 4.2 复制积压缓冲区

```c
// 复制积压缓冲区
// 一个固定大小的 FIFO 队列
// 默认大小 1MB

struct redisServer {
    char *repl_backlog;         // 缓冲区
    long long repl_backlog_size;// 缓冲区大小
    long long repl_backlog_histlen;  // 已使用长度
    long long repl_backlog_idx;      // 当前写入位置
    long long repl_backlog_off;      // 缓冲区对应的偏移量
};

// 缓冲区结构
// | 旧命令 | 新命令 | ... | 空闲空间 |
//          ↑ repl_backlog_idx
```

### 4.3 复制偏移量

```c
// 复制偏移量
// 主节点和从节点各自维护一个偏移量

// 主节点
struct redisServer {
    long long master_repl_offset;  // 主节点的复制偏移量
};

// 从节点
struct client {
    long long repl_ack_off;  // 从节点的复制偏移量
};

// 偏移量对比
// 主节点 offset = 1000
// 从节点 offset = 900
// 差距 = 100，需要发送 100 字节的命令
```

### 4.4 增量同步流程

```
// 增量同步的流程
1. 从节点发送 PSYNC <runid> <offset>
   ↓
2. 主节点检查 offset 是否在缓冲区中
   ↓
3. 如果在，返回 +CONTINUE
   ↓
4. 主节点从缓冲区中读取 offset 之后的命令
   ↓
5. 发送给从节点
   ↓
6. 从节点执行命令，更新 offset
```

### 4.5 代码实现

```c
// 增量同步的核心代码
void replicationCron(void) {
    // 检查从节点的偏移量
    listIter li;
    listNode *ln;
    listRewind(server.slaves, &li);
    
    while ((ln = listNext(&li)) != NULL) {
        client *slave = ln->value;
        
        // 检查从节点的偏移量
        if (slave->replstate == SLAVE_STATE_ONLINE) {
            // 计算差距
            long long offset_diff = server.master_repl_offset - slave->repl_ack_off;
            
            // 如果差距在缓冲区范围内，可以增量同步
            if (offset_diff <= server.repl_backlog_histlen) {
                // 增量同步
                sendBacklogToSlave(slave);
            } else {
                // 需要全量同步
                slave->replstate = SLAVE_STATE_WAIT_BGSAVE_START;
            }
        }
    }
}
```

打个比方：

> 增量同步就像"同步聊天记录"：
> - 主节点记录所有的聊天内容（复制积压缓冲区）
> - 从节点记录自己看到的最后一条消息（复制偏移量）
> - 重新连接时，从节点告诉主节点"我看到第 900 条"
> - 主节点从第 901 条开始发送

---

## 5 心跳机制

### 5.1 心跳流程

```
// 主从之间的心跳
// 从节点定期发送 REPLCONF ACK 命令

// 从节点发送
REPLCONF ACK <offset>

// 主节点响应
// 无响应（单向心跳）

// 主节点发送 PING
// 从节点响应 PONG
```

### 5.2 心跳间隔

```c
// 心跳间隔
// 从节点每秒发送一次 REPLCONF ACK

void replicationCron(void) {
    // 每秒执行一次
    
    // 从节点发送 ACK
    if (server.masterhost && server.master) {
        replicationSendAck();
    }
    
    // 主节点发送 PING
    if (server.masterhost == NULL) {
        replicationSendPing();
    }
}

// 发送 ACK
void replicationSendAck(void) {
    // 发送 REPLCONF ACK <offset>
    robj *argv[3];
    argv[0] = createStringObject("REPLCONF", 8);
    argv[1] = createStringObject("ACK", 3);
    argv[2] = createStringObjectFromLongLong(server.master->reploff);
    
    // 发送给主节点
    sendCommand(server.master, argv, 3);
}
```

### 5.3 心跳的作用

| 作用 | 说明 |
|------|------|
| 检测连接 | 确认主从之间的连接是否正常 |
| 同步状态 | 从节点报告自己的偏移量 |
| 延迟检测 | 主节点可以检测从节点的延迟 |
| 故障转移 | Sentinel 根据心跳判断节点状态 |

---

## 6 主从切换

### 6.1 手动切换

```bash
# 手动将从节点提升为主节点
SLAVEOF NO ONE

# 或者
REPLICAOF NO ONE

# 让其他从节点连接新的主节点
SLAVEOF <new_master_ip> <new_master_port>
```

### 6.2 自动切换（Sentinel）

```
// Sentinel 自动故障转移
1. Sentinel 检测到主节点下线
   ↓
2. Sentinel 选举 Leader
   ↓
3. Leader 选择一个从节点
   ↓
4. 将从节点提升为主节点
   ↓
5. 让其他从节点连接新的主节点
   ↓
6. 通知客户端新的主节点
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 主从复制 | 主节点写，从节点读，数据同步 |
| 全量同步 | 第一次连接或 offset 不匹配时触发，发送 RDB |
| 增量同步 | offset 匹配时触发，发送积压命令 |
| 复制偏移量 | 主从各自维护，用于判断同步进度 |
| 复制积压缓冲区 | FIFO 队列，存储最近的写命令 |
| 心跳机制 | 从节点每秒发送 ACK，主节点发送 PING |

---

## 8 新手常见误区

### 误区 1："主从同步是实时的"

**不完全对。** 主从同步是异步的，主节点执行命令后立即返回，然后异步发送给从节点。可能会有短暂的延迟。

### 误区 2："全量同步很慢，应该避免"

**不一定。** 全量同步在第一次连接时是必须的。可以通过配置合理的复制积压缓冲区大小，减少不必要的全量同步。

### 误区 3："从节点可以写入数据"

**错！** 从节点默认是只读的，写入数据会导致与主节点不一致。可以通过 `replica-read-only no` 配置允许写入，但不推荐。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：画出主从复制的流程，说明全量同步和增量同步的区别。

<details>
<summary>点击查看答案</summary>

```
主从复制流程：
1. 连接阶段：从节点连接主节点，发送 PING、AUTH、REPLCONF
2. 同步阶段：全量同步或增量同步
3. 命令传播阶段：主节点发送写命令给从节点

全量同步 vs 增量同步：

| 特性 | 全量同步 | 增量同步 |
|------|----------|----------|
| 触发条件 | 第一次连接、offset 不匹配 | offset 匹配 |
| 数据传输 | 发送 RDB 文件 | 发送积压命令 |
| 性能开销 | 大 | 小 |
| 适用场景 | 初始同步、断线时间长 | 断线时间短 |
```

</details>

### 练习 2：进阶练习

**题目**：解释复制偏移量和复制积压缓冲区的作用。

<details>
<summary>点击查看答案</summary>

```
复制偏移量：
- 主节点和从节点各自维护一个偏移量
- 表示已经同步到的位置
- 用于判断需要同步多少数据

复制积压缓冲区：
- 一个固定大小的 FIFO 队列（默认 1MB）
- 存储主节点最近的写命令
- 用于增量同步时，快速找到需要同步的命令

工作流程：
1. 从节点发送 PSYNC <runid> <offset>
2. 主节点检查 offset 是否在缓冲区中
3. 如果在，从缓冲区读取命令，增量同步
4. 如果不在，触发全量同步
```

</details>

### 练习 3（挑战）：综合练习

**题目**：分析主从复制期间网络断开，重新连接后的同步流程。

<details>
<summary>点击查看答案</summary>

```
网络断开后的同步流程：

1. 从节点检测到连接断开
   - 定期重试连接主节点

2. 重新连接主节点
   - 发送 PSYNC <runid> <offset>
   - runid 是之前记录的主节点 ID
   - offset 是断开前的复制偏移量

3. 主节点判断同步方式
   - 检查 runid 是否匹配
   - 检查 offset 是否在复制积压缓冲区中

4. 情况 1：增量同步
   - 如果 offset 在缓冲区中
   - 主节点返回 +CONTINUE
   - 发送 offset 之后的命令

5. 情况 2：全量同步
   - 如果 runid 不匹配或 offset 不在缓冲区
   - 主节点返回 +FULLRESYNC <runid> <offset>
   - 执行 BGSAVE，发送 RDB 文件
   - 然后发送积压命令

6. 恢复命令传播阶段
   - 主节点继续发送写命令
   - 从节点接收并执行
```

</details>

---

## 下一章预告

下一章我们会学习 **Sentinel 哨兵原理**——搞清楚 Sentinel 网络、主观下线与客观下线、Leader 选举、故障转移流程。
