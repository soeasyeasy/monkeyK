---
title: "第15章：KRaft 模式原理"
description: "深入理解去 ZooKeeper 架构、Raft 共识算法、元数据管理"
---

# 第15章：KRaft 模式原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 KRaft 模式？为什么要去掉 ZooKeeper？
- Raft 共识算法是怎么工作的？
- KRaft 模式下的元数据是怎么管理的？
- KRaft 模式和 ZooKeeper 模式有什么区别？

这一章会深入 KRaft 模式的底层原理，搞懂这些能让你理解 Kafka 的未来架构演进方向。

---

## 1 为什么需要 KRaft 模式？

### ZooKeeper 模式的痛点

```
传统 Kafka 架构：

┌──────────────┐
│ Kafka Broker │
│              │
│  数据存储     │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  ZooKeeper   │
│              │
│  元数据管理   │
└──────────────┘
```

**痛点**：

| 问题 | 说明 |
| --- | --- |
| **架构复杂** | 需要维护两套系统（Kafka + ZooKeeper） |
| **性能瓶颈** | ZooKeeper 成为扩展性瓶颈 |
| **元数据延迟** | 元数据变更需要通过 ZooKeeper 广播 |
| **分区限制** | ZooKeeper 限制了 Kafka 的分区数量上限 |
| **运维成本** | 需要同时监控和维护两个系统 |

### KRaft 模式的解决方案

```
KRaft 架构：

┌──────────────────────────┐
│      Kafka Broker        │
│                          │
│  数据存储 + 元数据管理    │
│                          │
│  (内置 Raft 共识)         │
└──────────────────────────┘
```

**优势**：

| 优势 | 说明 |
| --- | --- |
| **架构简化** | 去掉 ZooKeeper，单一系统 |
| **性能提升** | 元数据管理更高效 |
| **扩展性增强** | 支持更多分区（数百万级） |
| **启动更快** | 不需要等待 ZooKeeper |
| **运维简化** | 只需维护一个系统 |

> **一句话总结**：KRaft 让 Kafka 更简单、更快、更强。

---

## 2 KRaft 架构

### 节点角色

KRaft 模式下，Kafka 节点有两种角色：

```
KRaft Cluster

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Controller 1  │  │   Controller 2  │  │   Controller 3  │
│                 │  │                 │  │                 │
│  Controller     │  │  Controller     │  │  Controller     │
│  +              │  │  +              │  │  +              │
│  Broker         │  │  Broker         │  │  Broker         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

| 角色 | 职责 |
| --- | --- |
| **Controller** | 管理集群元数据、Leader 选举 |
| **Broker** | 存储消息、处理读写请求 |
| **Controller + Broker** | 同时承担两种角色（混合模式） |

### Controller 选举

```
KRaft 使用 Raft 算法选举 Controller：

初始状态：3 个节点都是 Follower

选举过程：
1. 超时未收到 Leader 心跳，Follower 变为 Candidate
2. Candidate 向其他节点发送投票请求
3. 获得多数票的 Candidate 成为 Leader
4. Leader 定期发送心跳，维持权威

示例：
Node-1: Follower → Candidate → Leader (获得 2 票)
Node-2: Follower → Follower (投票给 Node-1)
Node-3: Follower → Follower (投票给 Node-1)
```

---

## 3 Raft 共识算法

### Raft 核心概念

Raft 是一种易于理解的分布式共识算法：

```
Raft 保证：

1. 选举安全性（Election Safety）
   - 一个任期（Term）内只有一个 Leader

2. Leader 附加性（Leader Append-Only）
   - Leader 只能追加日志，不能删除或修改

3. 日志匹配（Log Matching）
   - 如果两个日志包含相同的索引和任期，则它们的内容相同

4. Leader 完整性（Leader Completeness）
   - 如果一条日志被提交，它会出现在所有后续 Leader 的日志中

5. 状态机安全性（State Machine Safety）
   - 如果节点应用了某个索引的日志，其他节点不会应用不同日志
```

### 任期（Term）

```
任期是 Raft 中的时间单位：

Term 1: Leader-1
  ├─ Log Entry 1
  ├─ Log Entry 2
  └─ Log Entry 3

Term 2: Leader-2 (Leader-1 宕机)
  ├─ Log Entry 4
  └─ Log Entry 5

Term 3: Leader-3 (Leader-2 宕机)
  └─ Log Entry 6
```

### 日志复制

```
日志复制过程：

1. Client 发送请求到 Leader
   ↓
2. Leader 将日志条目追加到本地日志
   ↓
3. Leader 并行发送日志条目到所有 Follower
   ↓
4. Follower 写入本地日志，返回 ACK
   ↓
5. Leader 收到多数 ACK 后，提交日志条目
   ↓
6. Leader 通知 Follower 提交，Follower 应用日志

示例：
Leader:   [1, 2, 3, 4, 5]  (已提交: 1-3)
Follower: [1, 2, 3]        (已提交: 1-3)
Follower: [1, 2, 3]        (已提交: 1-3)

Leader 收到 2 个 ACK（多数），提交 Entry 4
```

### 日志一致性

```
Raft 保证日志一致性：

场景1：Leader 崩溃
  Leader:   [1, 2, 3, 4, 5]  (4, 5 未提交)
  Follower: [1, 2, 3]
  Follower: [1, 2, 3]
  
  新 Leader 选举后：
  Leader:   [1, 2, 3]
  Follower: [1, 2, 3]
  Follower: [1, 2, 3]
  
  未提交的 4, 5 被丢弃

场景2：日志冲突
  Leader:   [1, 2, 3, 4]
  Follower: [1, 2, 5]  (冲突)
  
  Leader 发现冲突，强制 Follower 覆盖：
  Follower: [1, 2, 3, 4]
```

---

## 4 元数据管理

### 元数据存储

KRaft 模式下，元数据存储在内部主题 `__cluster_metadata`：

```
__cluster_metadata 主题：

Partition 0 (单分区，保证顺序)
├─ Log Entry 1: Broker 注册
├─ Log Entry 2: Topic 创建
├─ Log Entry 3: 分区分配
├─ Log Entry 4: Leader 选举
└─ Log Entry 5: ACL 更新
```

### 元数据变更流程

```
元数据变更过程：

1. Client 发送元数据变更请求（如创建 Topic）
   ↓
2. 请求路由到 Controller Leader
   ↓
3. Controller Leader 将变更写入 __cluster_metadata
   ↓
4. Controller Leader 复制变更到 Controller Follower
   ↓
5. 多数 Controller 确认后，提交变更
   ↓
6. Controller Leader 通知所有 Broker 更新元数据
   ↓
7. Broker 应用元数据变更
```

### 元数据快照

```
元数据快照机制：

定期生成快照，避免日志无限增长：

__cluster_metadata:
├─ Snapshot 1 (offset 0-1000)
├─ Log Entry 1001
├─ Log Entry 1002
└─ ...

当需要恢复时：
1. 加载最新快照
2. 应用快照后的日志条目
```

---

## 5 KRaft vs ZooKeeper 对比

### 架构对比

| 特性 | ZooKeeper 模式 | KRaft 模式 |
| --- | --- | --- |
| **组件数量** | Kafka + ZooKeeper | 仅 Kafka |
| **元数据存储** | ZooKeeper | __cluster_metadata 主题 |
| **共识算法** | ZooKeeper Atomic Broadcast | Raft |
| **Controller 选举** | ZooKeeper 临时节点 | Raft 选举 |
| **分区上限** | ~200,000 | 数百万 |

### 性能对比

| 指标 | ZooKeeper 模式 | KRaft 模式 |
| --- | --- | --- |
| **启动时间** | 分钟级 | 秒级 |
| **Leader 选举** | 秒级 | 毫秒级 |
| **元数据变更** | 秒级 | 毫秒级 |
| **分区创建** | 秒级 | 毫秒级 |

### 运维对比

| 操作 | ZooKeeper 模式 | KRaft 模式 |
| --- | --- | --- |
| **部署** | 部署 Kafka + ZooKeeper | 仅部署 Kafka |
| **监控** | 监控 Kafka + ZooKeeper | 仅监控 Kafka |
| **升级** | 需要协调两个系统 | 仅升级 Kafka |
| **故障排查** | 需要排查两个系统 | 仅排查 Kafka |

---

## 6 KRaft 模式配置

### 启用 KRaft 模式

```bash
# 1. 生成集群 UUID
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"

# 2. 格式化存储
bin/kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c config/kraft/server.properties

# 3. 启动 Kafka
bin/kafka-server-start.sh config/kraft/server.properties
```

### KRaft 配置参数

```properties
# server.properties (KRaft 模式)

# 节点 ID
node.id=1

# 进程角色（controller、broker 或两者）
process.roles=broker,controller

# Controller 节点列表
controller.quorum.voters=1@localhost:9093,2@localhost:9094,3@localhost:9095

# 监听地址
listeners=PLAINTEXT://localhost:9092,CONTROLLER://localhost:9093

# 监听器安全协议映射
listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT

# Controller 监听器名称
inter.broker.listener.name=PLAINTEXT
controller.listener.names=CONTROLLER
```

### 混合模式 vs 分离模式

```
混合模式（Combined Mode）：
┌─────────────────┐
│ Controller      │
│ +               │
│ Broker          │
└─────────────────┘
优点：部署简单
缺点：Controller 和 Broker 竞争资源

分离模式（Separated Mode）：
┌─────────────────┐  ┌─────────────────┐
│   Controller    │  │     Broker      │
│   (专用节点)     │  │   (专用节点)     │
└─────────────────┘  └─────────────────┘
优点：资源隔离，性能更好
缺点：需要更多节点
```

---

## 7 迁移到 KRaft 模式

### 迁移步骤

```
从 ZooKeeper 模式迁移到 KRaft：

1. 升级到 Kafka 3.x（支持 KRaft）
   ↓
2. 启用 KRaft 迁移模式
   ↓
3. 将元数据从 ZooKeeper 复制到 KRaft
   ↓
4. 验证 KRaft 元数据
   ↓
5. 切换到 KRaft 模式
   ↓
6. 移除 ZooKeeper
```

### 迁移配置

```properties
# 迁移模式配置

# 启用迁移
zookeeper.metadata.migration.enable=true

# ZooKeeper 连接
zookeeper.connect=localhost:2181

# KRaft 配置
node.id=1
process.roles=broker,controller
controller.quorum.voters=1@localhost:9093
```

### 迁移注意事项

| 注意事项 | 说明 |
| --- | --- |
| **备份数据** | 迁移前备份所有数据 |
| **测试验证** | 在测试环境充分验证 |
| **滚动升级** | 逐个节点升级，避免停机 |
| **监控指标** | 密切关注迁移过程中的指标 |
| **回滚计划** | 准备好回滚方案 |

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **KRaft** | Kafka Raft，去掉 ZooKeeper 的新架构 |
| **Raft 算法** | 易于理解的分布式共识算法 |
| **Controller 选举** | 使用 Raft 算法选举 Leader |
| **元数据管理** | 存储在 __cluster_metadata 主题 |
| **日志复制** | 多数确认后提交 |
| **混合模式** | Controller + Broker 同节点 |
| **分离模式** | Controller 和 Broker 分离 |
| **迁移** | 从 ZooKeeper 模式平滑迁移 |

---

## 9 新手常见误区

### 误区 1："KRaft 模式还不成熟，不能用于生产"

**过时了。** Kafka 3.3+ 的 KRaft 模式已经生产可用。Kafka 4.0 将完全移除 ZooKeeper 支持。

### 误区 2："KRaft 模式和 ZooKeeper 模式性能差不多"

**错！** KRaft 模式在启动时间、Leader 选举、元数据变更等方面都有显著提升。

### 误区 3："迁移到 KRaft 需要停机"

**错！** Kafka 支持滚动迁移，可以在不停机的情况下从 ZooKeeper 模式迁移到 KRaft 模式。

### 误区 4："KRaft 模式只能用于新集群"

**错！** 现有 ZooKeeper 集群可以平滑迁移到 KRaft 模式，不需要重建集群。

---

## 10 动手练习

### 练习 1：基础练习

使用 KRaft 模式启动单节点 Kafka。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 生成集群 UUID
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"

# 2. 格式化存储
bin/kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c config/kraft/server.properties

# 3. 启动 Kafka
bin/kafka-server-start.sh config/kraft/server.properties

# 4. 创建 Topic（新终端）
bin/kafka-topics.sh --create \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1

# 5. 发送消息（新终端）
bin/kafka-console-producer.sh --topic test-topic --bootstrap-server localhost:9092

# 6. 消费消息（新终端）
bin/kafka-console-consumer.sh --topic test-topic --from-beginning --bootstrap-server localhost:9092
```

</details>

### 练习 2：进阶练习

搭建 3 节点 KRaft 集群。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 生成集群 UUID
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"

# 2. 创建 3 个配置文件
cp config/kraft/server.properties config/kraft/server-1.properties
cp config/kraft/server.properties config/kraft/server-2.properties
cp config/kraft/server.properties config/kraft/server-3.properties

# 3. 修改配置
# server-1.properties
node.id=1
process.roles=broker,controller
listeners=PLAINTEXT://localhost:9092,CONTROLLER://localhost:9093
controller.quorum.voters=1@localhost:9093,2@localhost:9094,3@localhost:9095
log.dirs=/tmp/kraft-logs-1

# server-2.properties
node.id=2
process.roles=broker,controller
listeners=PLAINTEXT://localhost:9094,CONTROLLER://localhost:9095
controller.quorum.voters=1@localhost:9093,2@localhost:9094,3@localhost:9095
log.dirs=/tmp/kraft-logs-2

# server-3.properties
node.id=3
process.roles=broker,controller
listeners=PLAINTEXT://localhost:9096,CONTROLLER://localhost:9097
controller.quorum.voters=1@localhost:9093,2@localhost:9094,3@localhost:9095
log.dirs=/tmp/kraft-logs-3

# 4. 格式化存储
bin/kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c config/kraft/server-1.properties
bin/kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c config/kraft/server-2.properties
bin/kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c config/kraft/server-3.properties

# 5. 启动 3 个节点（各开一个终端）
bin/kafka-server-start.sh config/kraft/server-1.properties
bin/kafka-server-start.sh config/kraft/server-2.properties
bin/kafka-server-start.sh config/kraft/server-3.properties

# 6. 创建 Topic（新终端）
bin/kafka-topics.sh --create \
  --topic test-topic \
  --bootstrap-server localhost:9092,localhost:9094,localhost:9096 \
  --partitions 3 \
  --replication-factor 3
```

</details>

### 练习 3（挑战）：综合练习

查看 KRaft 模式的元数据。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 查看集群元数据
bin/kafka-metadata.sh --snapshot /tmp/kraft-logs-1/__cluster_metadata-0/00000000000000000000.log --cluster-id $KAFKA_CLUSTER_ID

# 2. 查看 Broker 信息
bin/kafka-metadata.sh --snapshot /tmp/kraft-logs-1/__cluster_metadata-0/00000000000000000000.log --cluster-id $KAFKA_CLUSTER_ID --brokers

# 3. 查看 Topic 信息
bin/kafka-metadata.sh --snapshot /tmp/kraft-logs-1/__cluster_metadata-0/00000000000000000000.log --cluster-id $KAFKA_CLUSTER_ID --topics

# 4. 查看分区分配
bin/kafka-metadata.sh --snapshot /tmp/kraft-logs-1/__cluster_metadata-0/00000000000000000000.log --cluster-id $KAFKA_CLUSTER_ID --partitions
```

</details>

---

## 下一章预告

下一章我们会学习 **Kafka 生产环境最佳实践**——集群规划、参数调优、安全配置、容量评估、故障演练。你会理解如何在生产环境中稳定运行 Kafka。
