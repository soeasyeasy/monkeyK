---
title: "第13章：Kafka 消息队列入门"
description: "了解 Kafka 的核心概念、架构设计与 RabbitMQ 的对比"
---

# 第13章：Kafka 消息队列入门

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Kafka 和 RabbitMQ 有什么区别？
- Kafka 为什么吞吐量那么高？
- Kafka 适合什么场景？
- 怎么安装和启动 Kafka？

这一章会解答这些问题。Kafka 是大数据领域的消息队列标准，掌握它能让你应对高吞吐量的场景。

---

## 1 Kafka 简介

### 什么是 Kafka？

Kafka 是一个分布式流处理平台，最初由 LinkedIn 开发，现在是 Apache 顶级项目。

**核心特点**：
- **高吞吐量**：单机每秒百万级消息
- **可扩展**：集群模式，水平扩展
- **持久化**：消息写入磁盘，支持重试
- **多消费者**：支持消费者组，消息可被多个组消费

### Kafka 的应用场景

| 场景 | 说明 |
| --- | --- |
| **日志收集** | 收集各种服务的日志，统一存储 |
| **消息系统** | 解耦生产者和消费者 |
| **用户活动跟踪** | 记录用户的点击、浏览等行为 |
| **流处理** | 实时数据处理（如 Flink、Spark Streaming） |
| **指标收集** | 监控数据的收集和聚合 |

---

## 2 Kafka 核心概念

### 1. 消息和批次

**消息（Message）**：
- Kafka 的基本数据单元
- 由键（Key）、值（Value）、时间戳组成
- 消息是不可变的（写入后不能修改）

**批次（Batch）**：
- 多个消息打包成一个批次
- 提高吞吐量，减少网络开销
- 支持压缩（gzip、snappy、lz4）

### 2. 主题和分区

**主题（Topic）**：
- 消息的逻辑分类
- 类似 RabbitMQ 的队列
- 例如：`order-topic`、`user-topic`

**分区（Partition）**：
- 主题的物理分片
- 每个分区是一个有序的队列
- 分区可以分布在不同的 broker 上
- 实现水平扩展和并行处理

```
order-topic
├── partition-0 (broker-1)
├── partition-1 (broker-2)
└── partition-2 (broker-3)
```

### 3. 生产者和消费者

**生产者（Producer）**：
- 向主题发送消息
- 可以指定消息的键（用于分区）
- 支持同步和异步发送

**消费者（Consumer）**：
- 从主题读取消息
- 属于某个消费者组（Consumer Group）
- 同一组内的消费者共同消费主题的所有分区

### 4. Broker 和集群

**Broker**：
- Kafka 服务器节点
- 负责存储和转发消息
- 一个集群可以有多个 broker

**集群（Cluster）**：
- 多个 broker 组成集群
- 支持高可用和负载均衡
- 通过 ZooKeeper 或 KRaft 管理元数据

---

## 3 Kafka vs RabbitMQ

| 特性 | Kafka | RabbitMQ |
| --- | --- | --- |
| **吞吐量** | 百万级/秒 | 万级/秒 |
| **延迟** | 毫秒级 | 微秒级 |
| **消息模型** | 拉模式（Pull） | 推模式（Push） |
| **消息保留** | 长期保留（可配置） | 消费后删除 |
| **分区** | 原生支持 | 不支持 |
| **消费者组** | 原生支持 | 需要手动实现 |
| **协议** | 自定义协议 | AMQP |
| **适用场景** | 大数据、日志、流处理 | 业务消息、任务队列 |

### 选择建议

**选 Kafka**：
- 需要高吞吐量（日志收集、用户行为跟踪）
- 需要消息回溯（重新消费历史数据）
- 需要流处理（实时计算）
- 消息量大，需要长期存储

**选 RabbitMQ**：
- 需要低延迟（实时通知）
- 需要复杂的路由（Direct、Topic、Fanout）
- 需要消息优先级
- 需要延迟消息和死信队列
- 团队熟悉 AMQP 协议

---

## 4 Kafka 安装与启动

### 环境要求

- Java 8+ 或 Java 11
- ZooKeeper（或使用 KRaft 模式）

### 下载 Kafka

```bash
# 下载 Kafka
wget https://downloads.apache.org/kafka/3.6.0/kafka_2.13-3.6.0.tgz

# 解压
tar -xzf kafka_2.13-3.6.0.tgz
cd kafka_2.13-3.6.0
```

### 启动 ZooKeeper

```bash
# 使用默认配置启动 ZooKeeper
bin/zookeeper-server-start.sh config/zookeeper.properties
```

### 启动 Kafka Broker

```bash
# 新开一个终端，启动 Kafka
bin/kafka-server-start.sh config/server.properties
```

### 验证安装

```bash
# 创建测试主题
bin/kafka-topics.sh --create --topic test-topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

# 查看主题列表
bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

---

## 5 Kafka 快速入门

### 1. 创建主题

```bash
# 创建订单主题，3个分区
bin/kafka-topics.sh --create \
  --topic order-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

### 2. 启动生产者

```bash
# 启动命令行生产者
bin/kafka-console-producer.sh --topic order-topic --bootstrap-server localhost:9092

# 输入消息（每行一条）
order-001
order-002
order-003
```

### 3. 启动消费者

```bash
# 启动命令行消费者
bin/kafka-console-consumer.sh --topic order-topic --from-beginning --bootstrap-server localhost:9092

# 输出：
# order-001
# order-002
# order-003
```

---

## 6 Kafka 架构原理

### 消息存储

Kafka 将消息持久化到磁盘：

```
/var/kafka-logs/
├── order-topic-0/          # 主题0分区
│   ├── 00000000000000000000.log
│   ├── 00000000000000000000.index
│   └── 00000000000000000000.timeindex
├── order-topic-1/          # 主题1分区
└── order-topic-2/          # 主题2分区
```

**日志段（Log Segment）**：
- `.log`：存储消息数据
- `.index`：偏移量索引
- `.timeindex`：时间戳索引

### 消息消费

**偏移量（Offset）**：
- 每条消息在分区中的唯一标识
- 消费者维护自己的偏移量
- 支持重新消费（调整偏移量）

**消费者组**：
- 同一组内的消费者共同消费主题
- 每个分区只能被组内的一个消费者消费
- 不同组可以独立消费同一主题

```
order-topic (3 partitions)
├── partition-0 --> consumer-A (group-1)
├── partition-1 --> consumer-B (group-1)
└── partition-2 --> consumer-C (group-1)

同一主题可以被多个组消费：
├── partition-0 --> consumer-X (group-2)
├── partition-1 --> consumer-Y (group-2)
└── partition-2 --> consumer-Z (group-2)
```

---

## 7 Kafka 核心配置

### Broker 配置

```properties
# server.properties

# Broker ID（集群中唯一）
broker.id=0

# 监听端口
listeners=PLAINTEXT://:9092

# 日志存储目录
log.dirs=/var/kafka-logs

# 日志保留时间（7天）
log.retention.hours=168

# 日志保留大小（1GB）
log.retention.bytes=1073741824

# ZooKeeper 地址
zookeeper.connect=localhost:2181
```

### 主题配置

```bash
# 创建主题时指定配置
bin/kafka-topics.sh --create \
  --topic order-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=86400000 \
  --config segment.bytes=1073741824
```

---

## 8 新手常见误区

### 误区 1："Kafka 消息消费后会被删除"

**错！** Kafka 消息默认保留7天（可配置），消费后不会立即删除。消费者通过偏移量记录消费位置，可以重新消费历史消息。

### 误区 2："Kafka 比 RabbitMQ 快，所以什么都用 Kafka"

**错！** Kafka 适合高吞吐量的场景（日志、流处理），但延迟比 RabbitMQ 高。如果需要低延迟的实时通知，RabbitMQ 更合适。

### 误区 3："Kafka 不需要 ZooKeeper"

**部分错误**。Kafka 3.0+ 支持 KRaft 模式（不依赖 ZooKeeper），但生产环境大多还是用 ZooKeeper。KRaft 模式还在逐步成熟中。

### 误区 4："分区越多越好"

**错！** 分区过多会导致：
- 文件句柄增多
- 元数据变大
- 消费者重平衡频繁
- 性能下降

一般建议：分区数 = 消费者数量，或略大于消费者数量。

---

## 9 动手练习

### 练习 1：基础练习

安装 Kafka 并创建一个主题，使用命令行工具发送和接收消息。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 启动 ZooKeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# 2. 启动 Kafka（新终端）
bin/kafka-server-start.sh config/server.properties

# 3. 创建主题（新终端）
bin/kafka-topics.sh --create \
  --topic my-topic \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1

# 4. 启动生产者（新终端）
bin/kafka-console-producer.sh --topic my-topic --bootstrap-server localhost:9092
# 输入：Hello Kafka

# 5. 启动消费者（新终端）
bin/kafka-console-consumer.sh --topic my-topic --from-beginning --bootstrap-server localhost:9092
# 输出：Hello Kafka
```

</details>

### 练习 2：进阶练习

创建一个多分区的主题，观察消息的分区分布。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建3分区的主题
bin/kafka-topics.sh --create \
  --topic order-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# 2. 查看主题详情
bin/kafka-topics.sh --describe --topic order-topic --bootstrap-server localhost:9092

# 输出示例：
# Topic: order-topic  PartitionCount: 3
# Topic: order-topic  Partition: 0    Leader: 0   Replicas: 0   Isr: 0
# Topic: order-topic  Partition: 1    Leader: 0   Replicas: 0   Isr: 0
# Topic: order-topic  Partition: 2    Leader: 0   Replicas: 0   Isr: 0

# 3. 发送消息
bin/kafka-console-producer.sh --topic order-topic --bootstrap-server localhost:9092
# 输入多条消息

# 4. 查看每个分区的消息数
bin/kafka-run-class.sh kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic order-topic
```

</details>

### 练习 3（挑战）：综合练习

搭建一个包含3个 broker 的 Kafka 集群，测试高可用性。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 复制配置文件
cp config/server.properties config/server-1.properties
cp config/server.properties config/server-2.properties
cp config/server.properties config/server-3.properties

# 2. 修改配置
# server-1.properties
broker.id=1
listeners=PLAINTEXT://:9093
log.dirs=/tmp/kafka-logs-1

# server-2.properties
broker.id=2
listeners=PLAINTEXT://:9094
log.dirs=/tmp/kafka-logs-2

# server-3.properties
broker.id=3
listeners=PLAINTEXT://:9095
log.dirs=/tmp/kafka-logs-3

# 3. 启动3个 broker（各开一个终端）
bin/kafka-server-start.sh config/server-1.properties
bin/kafka-server-start.sh config/server-2.properties
bin/kafka-server-start.sh config/server-3.properties

# 4. 创建主题（副本因子为3）
bin/kafka-topics.sh --create \
  --topic ha-topic \
  --bootstrap-server localhost:9093,localhost:9094,localhost:9095 \
  --partitions 3 \
  --replication-factor 3

# 5. 查看主题详情
bin/kafka-topics.sh --describe --topic ha-topic --bootstrap-server localhost:9093

# 6. 停止一个 broker，验证高可用性
# 在另一个终端停止 server-2
# 继续生产和消费消息，验证集群仍然可用
```

</details>

---

## 下一章预告

下一章我们会深入学习 **Kafka 的核心原理**——分区、副本、消费者组、消息存储机制。理解这些原理能帮你更好地使用和优化 Kafka。
