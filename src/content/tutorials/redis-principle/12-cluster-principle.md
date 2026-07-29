---
title: "第12章：Cluster 集群原理"
description: "哈希槽分配、gossip 协议、节点状态检测、集群故障转移与脑裂问题"
---

# 第12章：Cluster 集群原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis Cluster 是怎么实现分布式的？
- 哈希槽是什么？数据是怎么分配到不同节点的？
- 节点之间是怎么通信的？gossip 协议是什么？
- 集群故障转移和 Sentinel 有什么区别？什么是脑裂问题？

这一章就是为了解答这些问题。我们会深入 **Cluster 的底层原理**，搞清楚 **哈希槽与数据分片**，弄明白 **gossip 协议与故障转移机制**。

---

## 1 为什么需要 Cluster？

### 痛点分析

Sentinel 的局限：

```
// Sentinel 的问题
1. 单点写入瓶颈：所有写操作都在主节点
2. 存储容量限制：单节点内存有限
3. 扩展性差：只能垂直扩展（升级硬件）

// 需要水平扩展（增加节点）
```

### 解决方案

Redis Cluster：

```
// Cluster 架构
Node1 (Master) ── Node2 (Master) ── Node3 (Master)
   ↓                ↓                ↓
Node4 (Slave)    Node5 (Slave)    Node6 (Slave)

// 优势
1. 数据分片：数据分散到多个节点
2. 水平扩展：可以增加节点提升性能
3. 高可用：主节点故障，从节点自动切换
```

---

## 2 哈希槽（Hash Slot）

### 2.1 概念

```
// Redis Cluster 使用哈希槽来分片数据
// 总共 16384 个哈希槽
// 每个节点负责一部分槽

// 示例
Node1: 0-5460
Node2: 5461-10922
Node3: 10923-16383
```

### 2.2 数据分配

```c
// 数据分配到槽的算法
// slot = CRC16(key) % 16384

uint16_t keyHashSlot(char *key, int keylen) {
    // 处理 {hashtag}
    int s, e;
    for (s = 0; s < keylen; s++)
        if (key[s] == '{') break;
    
    if (s == keylen) {
        // 没有 {，整个 key 计算哈希
        return crc16(key, keylen) % 16384;
    }
    
    // 有 {，找到 }
    for (e = s + 1; e < keylen; e++)
        if (key[e] == '}') break;
    
    // 计算 {} 之间的内容
    if (e == keylen || e == s + 1) {
        return crc16(key, keylen) % 16384;
    }
    
    return crc16(key + s + 1, e - s - 1) % 16384;
}
```

### 2.3 槽分配

```c
// 集群初始化时分配槽
// 默认平均分配给所有主节点

// 示例（3 个主节点）
Node1: 0-5460      (5461 个槽)
Node2: 5461-10922  (5462 个槽)
Node3: 10923-16383 (5461 个槽)

// 槽分配信息存储在每个节点的 clusterState 中
struct clusterState {
    clusterNode *slots_map[16384];  // 槽到节点的映射
    // ...
};
```

打个比方：

> 哈希槽就像"快递分拣"：
> - 每个包裹（key）通过 CRC16 算法计算出一个编号（0-16383）
> - 编号对应不同的分拣口（节点）
> - 包裹自动分到对应的节点

---

## 3 节点通信

### 3.1 Gossip 协议

```
// Cluster 使用 Gossip 协议进行节点通信
// Gossip 是一种去中心化的通信方式

// 节点之间定期交换信息
// 每个节点维护集群的状态信息

// 消息类型
1. MEET：加入集群
2. PING：心跳检测
3. PONG：响应 PING
4. FAIL：标记节点失败
5. PUBLISH：发布消息
```

### 3.2 消息格式

```c
// Gossip 消息的格式
typedef struct clusterMsg {
    char sig[4];              // 签名 "RCmb"
    uint32_t totlen;          // 消息总长度
    uint16_t ver;             // 协议版本
    uint16_t port;            // 客户端端口
    uint16_t type;            // 消息类型
    uint16_t count;           // 数据项数量
    uint64_t currentEpoch;    // 当前纪元
    uint64_t configEpoch;     // 配置纪元
    uint64_t offset;          // 复制偏移量
    char sender[40];          // 发送者 ID
    unsigned char myslots[2048];  // 槽位图
    // ...
} clusterMsg;

// 槽位图
// 2048 字节 = 16384 位
// 每一位代表一个槽
// 1 表示负责，0 表示不负责
```

### 3.3 通信流程

```
// 节点通信流程
1. 节点 A 发送 PING 给节点 B
   ↓
2. 节点 B 收到 PING，更新节点 A 的信息
   ↓
3. 节点 B 发送 PONG 给节点 A
   ↓
4. 节点 A 收到 PONG，更新节点 B 的信息
   ↓
5. 定期重复
```

---

## 4 节点状态检测

### 4.1 PFAIL（Possible Fail）

```c
// PFAIL：可能失败
// 单个节点认为另一个节点可能下线

// 判断条件
// 1. PING 超时（超过 cluster-node-timeout）
// 2. 没有收到 PONG 响应

// 设置标志
node->flags |= CLUSTER_NODE_PFAIL;
```

### 4.2 FAIL

```c
// FAIL：确认失败
// 多个节点一致认为某个节点下线

// 判断条件
// 1. 节点被标记为 PFAIL
// 2. 收到多数主节点的 FAIL 消息

// 代码实现
void clusterProcessFailPacket(clusterMsg *hdr) {
    // 检查是否多数主节点同意
    int majority = clusterGetMajorityCount();
    
    if (fail_count >= majority) {
        // 标记为 FAIL
        node->flags |= CLUSTER_NODE_FAIL;
        
        // 广播 FAIL 消息
        clusterBroadcastFail();
    }
}
```

打个比方：

> PFAIL 就像"一个人觉得同事生病了"——可能是误判。
> FAIL 就像"多数同事确认他生病了"——更可靠。

---

## 5 集群故障转移

### 5.1 从节点选举

```c
// 从节点检测到主节点 FAIL
// 触发选举流程

void clusterCron(void) {
    // 检查主节点是否 FAIL
    if (nodeIsSlave(myself) && myself->slaveof->flags & CLUSTER_NODE_FAIL) {
        // 开始选举
        clusterFailoverStart(myself);
    }
}

// 选举流程
void clusterFailoverStart(clusterNode *node) {
    // 1. 增加 configEpoch
    node->configEpoch++;
    
    // 2. 向所有主节点请求投票
    clusterBroadcastFailoverAuthRequest(node);
    
    // 3. 等待投票
    // 4. 获得多数票后，提升为主节点
}
```

### 5.2 投票规则

```c
// 投票规则
// 1. 每个主节点在每个 epoch 只能投一票
// 2. 先收到的请求获得投票
// 3. 获得多数主节点票的从节点成为主节点

// 代码实现
void clusterProcessAuthRequestPacket(clusterMsg *hdr) {
    // 检查是否已经投过票
    if (lastVoteEpoch == hdr->currentEpoch) {
        return;  // 已经投过
    }
    
    // 投票
    lastVoteEpoch = hdr->currentEpoch;
    
    // 发送授权消息
    clusterSendAuth(hdr->sender);
}
```

### 5.3 故障转移流程

```
// 集群故障转移流程
1. 从节点检测到主节点 FAIL
   ↓
2. 从节点开始选举
   ↓
3. 从节点向所有主节点请求投票
   ↓
4. 主节点投票（每个 epoch 只能投一次）
   ↓
5. 获得多数票的从节点提升为主节点
   ↓
6. 新主节点接管槽位
   ↓
7. 其他从节点连接新主节点
   ↓
8. 故障转移完成
```

---

## 6 脑裂问题

### 6.1 什么是脑裂？

```
// 脑裂：集群分裂成多个独立的部分
// 每个部分都认为自己是正确的

// 示例
网络分区：
Node1 ── Node2    Node3 ── Node4
  ↓        ↓        ↓        ↓
Node5    Node6    Node7    Node8

// 左边部分和右边部分各自选举主节点
// 导致数据不一致
```

### 6.2 解决方案

```c
// Redis Cluster 的解决方案
// 1. 多数派原则
// 只有获得多数票的节点才能成为主节点

// 2. 配置纪元
// 每次故障转移增加 configEpoch
// 节点只接受更高纪元的配置

// 3. 写入安全
// 主节点写入时，检查是否有多数主节点在线
clusterNodeIsMaster(myself) && clusterGetMajorityStatus()
```

### 6.3 配置示例

```bash
# redis.conf 配置
cluster-enabled yes              # 开启集群模式
cluster-config-file nodes.conf   # 集群配置文件
cluster-node-timeout 15000       # 节点超时时间（毫秒）
cluster-require-full-coverage no # 是否要求所有槽都覆盖
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 哈希槽 | 16384 个槽，数据通过 CRC16 分配到槽 |
| 数据分片 | 每个节点负责一部分槽 |
| Gossip 协议 | 节点之间定期交换信息，去中心化通信 |
| 节点状态 | PFAIL（可能失败）、FAIL（确认失败） |
| 故障转移 | 从节点选举，获得多数票成为主节点 |
| 脑裂问题 | 网络分区导致集群分裂，通过多数派原则解决 |

---

## 8 新手常见误区

### 误区 1："Cluster 可以存储任意大小的数据"

**错！** Cluster 的每个键必须能映射到一个槽。大 Key 会导致数据倾斜，影响性能。

### 误区 2："Cluster 支持跨槽操作"

**不完全对。** Cluster 默认不支持跨槽操作（如 MGET 多个键在不同槽）。可以使用 `{hashtag}` 强制相关键在同一个槽。

### 误区 3："脑裂问题无法解决"

**错！** Redis Cluster 通过多数派原则和配置纪元来解决脑裂问题。只有获得多数票的节点才能成为主节点。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：解释哈希槽的概念，说明数据是如何分配到不同节点的。

<details>
<summary>点击查看答案</summary>

```
哈希槽概念：
- Redis Cluster 使用 16384 个哈希槽
- 每个节点负责一部分槽
- 数据通过 CRC16(key) % 16384 计算槽位

数据分配流程：
1. 客户端发送命令（如 SET key value）
2. 计算 key 的哈希槽：slot = CRC16(key) % 16384
3. 查找槽对应的节点
4. 如果节点是本节点，执行命令
5. 如果不是，返回 MOVED 重定向
6. 客户端连接到正确的节点

示例：
SET user:1001 "Alice"
slot = CRC16("user:1001") % 16384 = 5000
Node1 负责 0-5460，所以路由到 Node1
```

</details>

### 练习 2：进阶练习

**题目**：解释 Gossip 协议的工作原理，说明节点之间如何交换信息。

<details>
<summary>点击查看答案</summary>

```
Gossip 协议原理：
- 去中心化的通信方式
- 节点之间定期交换信息
- 每个节点维护集群的状态

消息类型：
1. MEET：加入集群
2. PING：心跳检测
3. PONG：响应 PING
4. FAIL：标记节点失败
5. PUBLISH：发布消息

交换流程：
1. 节点 A 发送 PING 给节点 B
2. 消息中包含 A 的状态信息（槽位图、配置纪元等）
3. 节点 B 收到后，更新 A 的信息
4. 节点 B 发送 PONG 给节点 A
5. 消息中包含 B 的状态信息
6. 节点 A 收到后，更新 B 的信息

优势：
- 去中心化，没有单点故障
- 信息最终一致
- 扩展性好
```

</details>

### 练习 3（挑战）：综合练习

**题目**：分析集群故障转移期间，客户端如何处理请求。

<details>
<summary>点击查看答案</summary>

```
集群故障转移期间的客户端处理：

1. 故障转移开始
   - 主节点下线，无法连接
   - 客户端请求失败，返回 CLUSTERDOWN

2. 从节点选举
   - 从节点请求投票
   - 需要几秒钟

3. 新主节点产生
   - 获得多数票的从节点提升为主节点
   - 接管槽位

4. 客户端重试
   - 客户端收到 MOVED 或 ASK 重定向
   - 重新连接到新主节点
   - 恢复正常

客户端优化：
- 使用 Cluster 客户端库，自动处理重定向
- 缓存槽位映射，减少重定向
- 设置合理的超时和重试策略

注意事项：
- 故障转移期间可能有短暂不可用
- 写入可能丢失（异步复制）
- 需要处理重定向逻辑
```

</details>

---

## 下一章预告

下一章我们会学习 **事务与 Lua 脚本原理**——搞清楚 MULTI/EXEC 的实现原理、WATCH 乐观锁机制、Lua 脚本原子执行与 redis.call。
