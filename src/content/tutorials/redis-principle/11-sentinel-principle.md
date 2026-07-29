---
title: "第11章：Sentinel 哨兵原理"
description: "Sentinel 网络、主观下线与客观下线、Leader 选举、故障转移流程源码分析"
---

# 第11章：Sentinel 哨兵原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Sentinel 是怎么监控 Redis 节点的？
- 主观下线和客观下线有什么区别？
- Sentinel 是怎么选举 Leader 的？
- 故障转移的具体流程是什么？

这一章就是为了解答这些问题。我们会深入 **Sentinel 的底层原理**，搞清楚 **监控机制与下线判断**，弄明白 **Leader 选举与故障转移流程**。

---

## 1 为什么需要 Sentinel？

### 痛点分析

主从复制的问题：

```
// 主从复制的局限
1. 主节点故障，需要手动切换
2. 从节点不知道主节点是否真的挂了
3. 客户端需要自己处理故障转移
```

### 解决方案

Sentinel（哨兵）：

```
// Sentinel 架构
Sentinel1
Sentinel2
Sentinel3
   ↓ 监控
Master
├── Slave1
└── Slave2

// Sentinel 的功能
1. 监控：检查主从节点是否正常
2. 通知：故障时通知管理员
3. 自动故障转移：主节点故障时，自动切换
4. 配置中心：客户端连接 Sentinel 获取主节点信息
```

---

## 2 Sentinel 工作原理

### 2.1 特殊模式的 Redis

```c
// Sentinel 本质上是一个特殊模式的 Redis
// 使用 Redis 的代码，但只支持部分命令

struct redisServer {
    int sentinel_mode;  // 哨兵模式标志
    // ...
};

// Sentinel 支持的命令
// SENTINEL servers          - 列出监控的主节点
// SENTINEL master <name>    - 查看主节点信息
// SENTINEL slaves <name>    - 查看从节点信息
// SENTINEL failover <name>  - 手动故障转移
```

### 2.2 Sentinel 网络

```
// Sentinel 之间通过发布订阅通信
// 频道：__sentinel__:hello

// 每个 Sentinel 每秒发送一次心跳
// 消息格式：<ip>,<port>,<runid>,<config_epoch>,<master_name>,<master_ip>,<master_port>,<master_down>

// 示例
127.0.0.1,26379,abc123,1,mymaster,127.0.0.1,6379,0
```

---

## 3 监控机制

### 3.1 心跳检测

```c
// Sentinel 每秒执行一次定时任务
void sentinelTimer(void) {
    // 1. 检查主节点
    sentinelCheckMasterState();
    
    // 2. 检查从节点
    sentinelCheckSlaveState();
    
    // 3. 检查其他 Sentinel
    sentinelCheckSentinelState();
    
    // 4. 发送心跳
    sentinelSendPeriodicCommands();
}

// 检查主节点状态
void sentinelCheckMasterState(void) {
    // 遍历所有监控的主节点
    dictIterator *di = dictGetIterator(sentinel.masters);
    while ((de = dictNext(di)) != NULL) {
        sentinelRedisInstance *master = dictGetVal(de);
        
        // 发送 PING 命令
        sentinelSendPing(master);
        
        // 检查是否超时
        if (mstime() - master->last_pong_time > master->down_after_period) {
            // 标记为主观下线
            master->flags |= SRI_MASTER_DOWN;
        }
    }
}
```

### 3.2 主观下线（SDOWN）

```c
// 主观下线：单个 Sentinel 认为节点下线

// 判断条件
// 1. PING 超时（超过 down-after-milliseconds）
// 2. 命令回复错误
// 3. 连接断开

// 设置标志
instance->flags |= SRI_S_DOWN;

// 示例
// Sentinel1 发送 PING 给 Master
// Master 没有响应
// Sentinel1 标记 Master 为 SDOWN
```

### 3.3 客观下线（ODOWN）

```c
// 客观下线：多个 Sentinel 一致认为节点下线

// 判断条件
// 1. 主节点被标记为 SDOWN
// 2. 询问其他 Sentinel 是否同意
// 3. 同意数量 >= quorum（法定人数）

// 代码实现
void sentinelCheckObjectivelyDown(void) {
    // 检查主节点是否 SDOWN
    if (!(master->flags & SRI_S_DOWN)) return;
    
    // 询问其他 Sentinel
    int quorum = 0;
    dictIterator *di = dictGetIterator(sentinel.sentinels);
    while ((de = dictNext(di)) != NULL) {
        sentinelRedisInstance *sentinel = dictGetVal(de);
        
        // 发送 SENTINEL is-master-down-by-addr
        if (sentinel->flags & SRI_MASTER_DOWN) {
            quorum++;
        }
    }
    
    // 检查是否达到 quorum
    if (quorum >= master->quorum) {
        master->flags |= SRI_O_DOWN;  // 标记为客观下线
    }
}
```

打个比方：

> 主观下线就像"一个人觉得老板生病了"——可能是误判。
> 客观下线就像"多个医生会诊后确认老板生病了"——更可靠。

---

## 4 Leader 选举

### 4.1 为什么需要 Leader？

```
// 故障转移需要协调
// 如果没有 Leader，每个 Sentinel 都会尝试故障转移
// 可能导致冲突

// 需要选举一个 Leader，由它负责故障转移
```

### 4.2 Raft 算法

```c
// Sentinel 使用 Raft 算法选举 Leader

// 选举流程
1. Sentinel 检测到主节点 ODOWN
   ↓
2. Sentinel 进入 Candidate 状态
   ↓
3. 增加自己的 config_epoch
   ↓
4. 向其他 Sentinel 发送 SENTINEL is-master-down-by-addr
   ↓
5. 其他 Sentinel 投票（每个 epoch 只能投一次）
   ↓
6. 获得多数票的 Sentinel 成为 Leader
   ↓
7. Leader 执行故障转移
```

### 4.3 投票规则

```c
// 投票规则
// 1. 每个 Sentinel 在每个 epoch 只能投一票
// 2. 先收到的请求获得投票
// 3. 获得多数票（> N/2）的成为 Leader

// 代码实现
void sentinelHandleSentinelHello(sentinelRedisInstance *ri, ...) {
    // 检查是否请求投票
    if (ri->leader_epoch == current_epoch) {
        // 已经投过票
        return;
    }
    
    // 投票
    ri->leader = request_sentinel;
    ri->leader_epoch = current_epoch;
}
```

---

## 5 故障转移流程

### 5.1 选择新的主节点

```c
// Leader 选择新的主节点
// 优先级规则：
// 1. 排除断线的从节点
// 2. 排除优先级低的（slave-priority）
// 3. 排除复制偏移量小的（数据不完整）
// 4. 选择 runid 最小的

sentinelRedisInstance *selectSlavePromotion(void) {
    // 1. 过滤候选从节点
    listIter li;
    listNode *ln;
    list candidates;
    listInit(&candidates);
    
    listRewind(master->slaves, &li);
    while ((ln = listNext(&li)) != NULL) {
        sentinelRedisInstance *slave = ln->value;
        
        // 排除断线的
        if (slave->flags & SRI_S_DOWN) continue;
        
        // 排除优先级为 0 的（不参与选举）
        if (slave->slave_priority == 0) continue;
        
        listAddNodeTail(&candidates, slave);
    }
    
    // 2. 按优先级排序
    listSort(&candidates, compareSlavePriority);
    
    // 3. 选择第一个
    return listFirst(&candidates)->value;
}
```

### 5.2 故障转移步骤

```
// 故障转移的完整流程
1. Leader 选择新的主节点
   ↓
2. Leader 向选中的从节点发送 SLAVEOF NO ONE
   ↓
3. 等待从节点成为主节点
   ↓
4. Leader 向其他从节点发送 SLAVEOF <new_master>
   ↓
5. 更新主节点的配置
   ↓
6. 故障转移完成
```

### 5.3 代码实现

```c
// 故障转移的核心代码
void sentinelFailoverStateMachine(sentinelRedisInstance *ri) {
    // 状态机
    switch (ri->failover_state) {
        case SENTINEL_FAILOVER_STATE_WAIT_START:
            // 等待开始
            sentinelFailoverSelectSlave(ri);
            break;
            
        case SENTINEL_FAILOVER_STATE_SELECT_PROMOTED_SLAVE:
            // 选择新的主节点
            sentinelSendSlaveOfNoOne(ri->promoted_slave);
            ri->failover_state = SENTINEL_FAILOVER_STATE_WAIT_PROMOTION;
            break;
            
        case SENTINEL_FAILOVER_STATE_WAIT_PROMOTION:
            // 等待从节点成为主节点
            if (ri->promoted_slave->flags & SRI_PROMOTED) {
                ri->failover_state = SENTINEL_FAILOVER_STATE_RECONF_SLAVES;
            }
            break;
            
        case SENTINEL_FAILOVER_STATE_RECONF_SLAVES:
            // 重新配置其他从节点
            sentinelFailoverReconfSlaves(ri);
            ri->failover_state = SENTINEL_FAILOVER_STATE_UPDATE_CONFIG;
            break;
            
        case SENTINEL_FAILOVER_STATE_UPDATE_CONFIG:
            // 更新配置
            sentinelFailoverUpdateConfig(ri);
            ri->failover_state = SENTINEL_FAILOVER_STATE_END;
            break;
    }
}
```

---

## 6 配置中心

### 6.1 客户端连接

```
// 客户端连接 Sentinel 获取主节点信息
1. 客户端连接 Sentinel
   ↓
2. 发送 SENTINEL get-master-addr-by-name <name>
   ↓
3. Sentinel 返回主节点的 IP 和端口
   ↓
4. 客户端连接主节点
```

### 6.2 故障通知

```
// Sentinel 通过发布订阅通知客户端
// 频道：+switch-master

// 消息格式
+switch-master mymaster 127.0.0.1 6379 127.0.0.1 6380

// 客户端订阅该频道
SUBSCRIBE +switch-master

// 收到通知后，重新获取主节点信息
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Sentinel 本质 | 特殊模式的 Redis，只支持部分命令 |
| 监控机制 | 每秒发送 PING，检查节点状态 |
| 主观下线 | 单个 Sentinel 认为节点下线 |
| 客观下线 | 多个 Sentinel 一致认为节点下线 |
| Leader 选举 | Raft 算法，获得多数票成为 Leader |
| 故障转移 | 选择从节点，提升为主节点，重新配置 |

---

## 8 新手常见误区

### 误区 1："Sentinel 可以存储数据"

**错！** Sentinel 是特殊模式的 Redis，不支持数据存储。它只负责监控和故障转移。

### 误区 2："主观下线就会触发故障转移"

**错！** 主观下线只是单个 Sentinel 的判断，需要多个 Sentinel 确认（客观下线）才会触发故障转移。

### 误区 3："故障转移是即时的"

**不完全对。** 故障转移需要多个步骤：选择从节点、提升为主节点、重新配置其他从节点。整个过程可能需要几秒钟。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：解释主观下线和客观下线的区别。

<details>
<summary>点击查看答案</summary>

```
主观下线（SDOWN）：
- 单个 Sentinel 认为节点下线
- 判断条件：PING 超时、命令回复错误、连接断开
- 可能误判

客观下线（ODOWN）：
- 多个 Sentinel 一致认为节点下线
- 判断条件：主节点 SDOWN + 其他 Sentinel 同意数 >= quorum
- 更可靠，用于触发故障转移
```

</details>

### 练习 2：进阶练习

**题目**：解释 Sentinel 的 Leader 选举流程。

<details>
<summary>点击查看答案</summary>

```
Leader 选举流程：
1. Sentinel 检测到主节点 ODOWN
2. Sentinel 进入 Candidate 状态
3. 增加自己的 config_epoch
4. 向其他 Sentinel 发送投票请求
5. 其他 Sentinel 投票（每个 epoch 只能投一次）
6. 获得多数票（> N/2）的成为 Leader
7. Leader 执行故障转移

投票规则：
- 每个 Sentinel 在每个 epoch 只能投一票
- 先收到的请求获得投票
- 获得多数票的成为 Leader
```

</details>

### 练习 3（挑战）：综合练习

**题目**：分析故障转移期间，客户端如何处理请求。

<details>
<summary>点击查看答案</summary>

```
故障转移期间的客户端处理：

1. 故障转移开始
   - 主节点下线，无法连接
   - 客户端请求失败

2. Sentinel 选举 Leader
   - 需要几秒钟
   - 客户端继续重试

3. Leader 选择新的主节点
   - 从节点提升为主节点
   - 需要几秒钟

4. 重新配置从节点
   - 其他从节点连接新的主节点
   - 需要几秒钟

5. 故障转移完成
   - 客户端通过 Sentinel 获取新的主节点信息
   - 重新连接主节点
   - 恢复正常

客户端优化：
- 使用 Sentinel 客户端库，自动处理故障转移
- 设置合理的超时和重试策略
- 订阅 +switch-master 频道，及时获取通知
```

</details>

---

## 下一章预告

下一章我们会学习 **Cluster 集群原理**——搞清楚哈希槽分配、gossip 协议、节点状态检测、集群故障转移与脑裂问题。
