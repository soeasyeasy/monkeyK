---
title: "第6章：副本机制与高可用"
description: "深入理解 Leader 选举、ISR 机制、故障转移、数据一致性"
---

# 第6章：副本机制与高可用

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 副本是怎么工作的？
- Leader 和 Follower 有什么区别？
- ISR 是什么？怎么保证数据一致性？
- Leader 宕机了怎么办？

这一章会深入副本机制的底层原理，搞懂这些能让你理解 Kafka 的高可用设计。

---

## 1 为什么需要副本机制？

### 痛点分析

没有副本机制时：

- **单点故障**：Broker 宕机，分区不可用
- **数据丢失**：磁盘损坏，消息永久丢失
- **无法扩展**：单机存储和吞吐受限

### 解决方案

副本机制通过多副本冗余实现：

- **高可用**：Leader 宕机，Follower 接管
- **数据安全**：多副本冗余，防止数据丢失
- **读扩展**：Follower 可以处理读请求（Kafka 2.4+）

> **一句话总结**：副本是高可用的基石。

---

## 2 副本基本概念

### Leader 和 Follower

每个分区可以有多个副本，分布在不同 Broker 上：

```
partition-0:
  - broker-1: leader（主副本，处理读写）
  - broker-2: follower（从副本，同步数据）
  - broker-3: follower（从副本，同步数据）
```

| 角色 | 职责 |
| --- | --- |
| **Leader** | 处理所有读写请求 |
| **Follower** | 从 Leader 同步数据，不处理客户端请求 |

### 副本分配

```
创建主题时指定副本因子：

bin/kafka-topics.sh --create \
  --topic order-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3

副本分布：
partition-0: broker-1(leader), broker-2(follower), broker-3(follower)
partition-1: broker-2(leader), broker-3(follower), broker-1(follower)
partition-2: broker-3(leader), broker-1(follower), broker-2(follower)
```

---

## 3 ISR 机制

### 什么是 ISR

ISR（In-Sync Replicas）是与 Leader 保持同步的副本集合：

```
ISR = {leader, follower-1, follower-2}
```

**同步标准**：Follower 的延迟不超过 `replica.lag.time.max.ms`（默认 10 秒）。

### ISR 变化

如果某个 Follower 同步太慢，会被移出 ISR：

```
正常状态：
ISR = {leader, follower-1, follower-2}

follower-2 同步延迟：
ISR = {leader, follower-1}  // follower-2 被移出

follower-2 恢复同步：
ISR = {leader, follower-1, follower-2}  // 重新加入
```

### 配置参数

```properties
# server.properties

# 副本同步最大延迟（默认 10 秒）
replica.lag.time.max.ms=10000

# 最小同步副本数（默认 1）
# 生产者 acks=all 时，至少需要这么多副本写入成功
min.insync.replicas=2
```

---

## 4 副本同步流程

### 写入流程

```
1. Producer 发送消息到 Leader
   ↓
2. Leader 写入本地日志
   ↓
3. Follower 从 Leader 拉取消息
   ↓
4. Follower 写入本地日志后，向 Leader 发送 ACK
   ↓
5. Leader 收到所有 ISR 的 ACK 后，返回成功给 Producer
```

### acks 配置

```java
Properties props = new Properties();

// acks=0：不等待确认，最快但可能丢消息
props.put("acks", "0");

// acks=1：Leader 写入成功就返回，Leader 宕机可能丢消息
props.put("acks", "1");

// acks=all：所有 ISR 副本写入成功才返回，最安全
props.put("acks", "all");
```

| acks | 性能 | 安全性 | 适用场景 |
| --- | --- | --- | --- |
| 0 | 最高 | 最低 | 日志收集（允许少量丢失） |
| 1 | 高 | 中 | 一般业务消息 |
| all | 低 | 最高 | 金融交易（不能丢消息） |

---

## 5 Leader 选举

### 选举触发条件

当 Leader 宕机时，会从 ISR 中选举新的 Leader：

```
初始状态：
partition-0:
  - broker-1: leader (ISR: {broker-1, broker-2, broker-3})

broker-1 宕机：
partition-0:
  - broker-2: new leader (ISR: {broker-2, broker-3})
```

### 选举规则

| 规则 | 说明 |
| --- | --- |
| **从 ISR 中选择** | 只有 ISR 中的副本有资格 |
| **优先选择第一个** | 通常选择 ISR 列表中的第一个 |
| **无 ISR 时** | 如果 ISR 为空，根据 `unclean.leader.election.enable` 决定 |

### Unclean Leader 选举

```properties
# 允许非 ISR 副本成为 Leader（可能丢数据）
unclean.leader.election.enable=true

# 不允许（默认，更安全）
unclean.leader.election.enable=false
```

| 配置 | 说明 |
| --- | --- |
| **true** | 允许非 ISR 副本成为 Leader，可能丢数据，但可用性高 |
| **false** | 不允许，分区不可用，直到 ISR 恢复，数据安全 |

---

## 6 故障转移

### 故障转移流程

```
1. Leader 宕机
   ↓
2. Follower 检测不到 Leader 心跳
   ↓
3. Controller 检测到 Leader 宕机
   ↓
4. Controller 从 ISR 中选择新 Leader
   ↓
5. Controller 通知所有 Broker 更新元数据
   ↓
6. Producer 和 Consumer 连接到新 Leader
```

### 故障恢复

当宕机的 Broker 恢复后：

```
1. Broker 启动，向 Controller 注册
   ↓
2. Controller 检查副本同步状态
   ↓
3. 如果同步跟上，加入 ISR
   ↓
4. 否则作为 Follower 继续同步
```

---

## 7 数据一致性保证

### 一致性级别

| 级别 | 说明 |
| --- | --- |
| **最终一致性** | Kafka 默认保证最终一致性 |
| **强一致性** | 需要 acks=all + min.insync.replicas >= 2 |

### 数据不丢失方案

```
生产者端：
- acks=all
- retries=Integer.MAX_VALUE
- max.in.flight.requests.per.connection=1

Broker 端：
- replication.factor >= 3
- min.insync.replicas >= 2
- unclean.leader.election.enable=false

消费者端：
- enable.auto.commit=false
- 处理完成后手动提交偏移量
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Leader** | 处理读写请求 |
| **Follower** | 同步数据，不处理请求 |
| **ISR** | 与 Leader 保持同步的副本集合 |
| **acks** | 生产者确认级别（0/1/all） |
| **min.insync.replicas** | 最小同步副本数 |
| **Leader 选举** | 从 ISR 中选择新 Leader |
| **Unclean 选举** | 允许非 ISR 副本成为 Leader |
| **故障转移** | Leader 宕机后自动切换 |

---

## 9 新手常见误区

### 误区 1："副本越多越好"

**错！** 副本越多，存储开销越大，同步延迟也越高。一般副本因子设为 2 或 3 就够了。

### 误区 2："acks=all 就一定不丢消息"

**不完全是。** acks=all 保证所有 ISR 副本都写入成功，但如果 ISR 中所有 Broker 同时宕机，消息还是会丢。需要配合 `min.insync.replicas` 配置。

### 误区 3："Follower 也可以处理读请求"

**默认不行。** Kafka 默认只有 Leader 处理读写请求。Kafka 2.4+ 支持 Follower 读取，但需要特殊配置。

### 误区 4："Leader 宕机后，分区会立即恢复"

**不一定。** Leader 选举需要时间，期间分区不可用。选举时间取决于 Controller 检测速度和 ZooKeeper 响应时间。

---

## 10 动手练习

### 练习 1：基础练习

创建一个副本因子为 3 的主题，查看副本分布。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建主题（副本因子为 3）
bin/kafka-topics.sh --create \
  --topic ha-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3

# 2. 查看主题详情
bin/kafka-topics.sh --describe --topic ha-topic --bootstrap-server localhost:9092

# 输出示例：
# Topic: ha-topic  Partition: 0  Leader: 1  Replicas: 1,2,3  Isr: 1,2,3
# Topic: ha-topic  Partition: 1  Leader: 2  Replicas: 2,3,1  Isr: 2,3,1
# Topic: ha-topic  Partition: 2  Leader: 3  Replicas: 3,1,2  Isr: 3,1,2
```

</details>

### 练习 2：进阶练习

模拟 Leader 宕机，观察故障转移过程。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建主题（副本因子为 3）
bin/kafka-topics.sh --create \
  --topic failover-topic \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 3

# 2. 查看初始状态
bin/kafka-topics.sh --describe --topic failover-topic --bootstrap-server localhost:9092

# 3. 停止 Leader Broker
# 假设 Leader 是 broker-1
bin/kafka-server-stop.sh config/server-1.properties

# 4. 等待几秒，查看新状态
bin/kafka-topics.sh --describe --topic failover-topic --bootstrap-server localhost:9092

# 输出示例（Leader 已切换）：
# Topic: failover-topic  Partition: 0  Leader: 2  Replicas: 1,2,3  Isr: 2,3

# 5. 重启 broker-1
bin/kafka-server-start.sh config/server-1.properties

# 6. 等待恢复，查看状态
bin/kafka-topics.sh --describe --topic failover-topic --bootstrap-server localhost:9092
```

</details>

### 练习 3（挑战）：综合练习

配置 min.insync.replicas，测试数据一致性保证。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建主题，配置 min.insync.replicas
bin/kafka-topics.sh --create \
  --topic consistent-topic \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 3 \
  --config min.insync.replicas=2

# 2. 查看主题配置
bin/kafka-topics.sh --describe --topic consistent-topic --bootstrap-server localhost:9092

# 3. 使用 acks=all 发送消息
# Java 代码：
# props.put("acks", "all");

# 4. 停止一个 Follower，观察 ISR 变化
# 5. 继续发送消息，验证是否成功
# 6. 再停止一个 Follower（ISR 只剩 Leader），观察发送是否失败
```

</details>

---

## 下一章预告

下一章我们会深入学习 **Kafka 的控制器原理**——Controller 角色、元数据管理、Leader