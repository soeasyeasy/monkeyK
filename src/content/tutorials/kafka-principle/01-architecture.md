---
title: "第1章：Kafka 架构深度剖析"
description: "理解 Kafka 整体架构、核心组件和数据流转过程"
---

# 第1章：Kafka 架构深度剖析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Kafka 的整体架构是什么样的？
- 生产者、消费者、Broker 之间是怎么协作的？
- 消息从生产到消费经历了哪些步骤？
- ZooKeeper 在 Kafka 中起什么作用？

这一章会带你深入理解 Kafka 的架构设计，搞懂这些能让你更好地使用和调优 Kafka。

---

## 1 为什么需要理解 Kafka 架构？

### 痛点分析

很多开发者在使用 Kafka 时只会调用 API，却不了解底层架构，导致：

- **性能问题**：不知道消息是怎么流转的，无法定位瓶颈
- **故障排查困难**：出问题时不知道从哪个组件开始排查
- **配置不当**：不理解架构原理，参数配置靠猜

### 解决方案

理解 Kafka 架构后，你能：

- 清楚消息从生产到消费的完整链路
- 快速定位性能瓶颈和故障点
- 合理配置参数，发挥 Kafka 最大性能

> **一句话总结**：架构是基础，理解架构才能用好 Kafka。

---

## 2 Kafka 整体架构

### 核心组件

Kafka 架构包含以下核心组件：

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Producer   │ ───> │   Broker    │ <─── │  Consumer   │
│  (生产者)    │      │   (服务器)   │      │  (消费者)    │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ↓
                     ┌─────────────┐
                     │ ZooKeeper   │
                     │ (元数据管理) │
                     └─────────────┘
```

| 组件 | 作用 | 类比 |
| --- | --- | --- |
| **Producer** | 向 Kafka 发送消息 | 快递员 |
| **Broker** | Kafka 服务器节点，存储和转发消息 | 快递中转站 |
| **Consumer** | 从 Kafka 读取消息 | 收件人 |
| **Consumer Group** | 消费者组，多个消费者共同消费 | 收件人团队 |
| **Topic** | 消息的逻辑分类 | 快递类型（文件/包裹/信件） |
| **Partition** | 主题的物理分片 | 快递分拣口 |
| **ZooKeeper** | 管理集群元数据和协调 | 快递公司的调度中心 |

### 数据流转过程

一条消息从生产到消费的完整流程：

```
1. Producer 发送消息到 Broker
   ↓
2. Broker 接收消息，写入对应的 Partition
   ↓
3. 消息持久化到磁盘（Log 文件）
   ↓
4. Consumer 从 Broker 拉取消息
   ↓
5. Consumer 处理消息，提交偏移量（Offset）
```

打个比方：

> 就像快递系统：你寄快递（Producer），快递员送到中转站（Broker），中转站分类存储（Partition），收件人（Consumer）去中转站取件，取走后记录取件信息（Offset）。

---

## 3 Broker 详解

### Broker 的角色

Broker 是 Kafka 的服务器节点，负责：

- **接收消息**：从 Producer 接收消息并存储
- **存储消息**：将消息持久化到磁盘
- **转发消息**：将消息发送给 Consumer
- **管理分区**：每个分区属于一个 Broker

### Broker 集群

多个 Broker 组成集群，实现高可用和负载均衡：

```
Kafka Cluster
├── Broker-0 (broker.id=0)
│   ├── topic-A-partition-0 (Leader)
│   ├── topic-B-partition-1 (Follower)
│   └── ...
├── Broker-1 (broker.id=1)
│   ├── topic-A-partition-1 (Leader)
│   ├── topic-B-partition-0 (Follower)
│   └── ...
└── Broker-2 (broker.id=2)
    ├── topic-A-partition-2 (Leader)
    ├── topic-B-partition-2 (Follower)
    └── ...
```

**关键点**：

- 每个 Broker 有唯一的 `broker.id`
- 一个分区可以有多个副本，分布在不同 Broker 上
- Leader 分区处理读写，Follower 只同步数据

### Broker 配置示例

```properties
# server.properties

# Broker 唯一标识
broker.id=0

# 监听地址和端口
listeners=PLAINTEXT://:9092

# 日志存储目录（消息存储位置）
log.dirs=/var/kafka-logs

# 默认分区数量
num.partitions=1

# 默认副本因子
default.replication.factor=1

# 日志保留时间（7天）
log.retention.hours=168

# ZooKeeper 连接地址
zookeeper.connect=localhost:2181
```

---

## 4 Topic 与 Partition

### Topic（主题）

Topic 是消息的逻辑分类，类似于数据库的表：

```java
// 创建主题
// 主题名称：order-topic
// 分区数：3
// 副本因子：1
bin/kafka-topics.sh --create \
  --topic order-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

### Partition（分区）

Partition 是 Topic 的物理分片，每个 Topic 可以有多个 Partition：

```
order-topic (3 partitions)
├── partition-0 (Broker-0)
│   ├── offset=0: msg1
│   ├── offset=1: msg2
│   └── offset=2: msg3
├── partition-1 (Broker-1)
│   ├── offset=0: msg4
│   ├── offset=1: msg5
│   └── offset=2: msg6
└── partition-2 (Broker-2)
    ├── offset=0: msg7
    ├── offset=1: msg8
    └── offset=2: msg9
```

**分区的作用**：

| 作用 | 说明 |
| --- | --- |
| **水平扩展** | 突破单机存储和吞吐限制 |
| **并行处理** | 多个消费者可以同时消费不同分区 |
| **负载均衡** | 消息分散到多个 Broker |

> **类比**：就像高速公路有多条车道，每条车道可以并行通行，提高整体通行能力。

### 分区分配策略

Producer 发送消息时，通过以下策略决定消息发到哪个分区：

```java
// 策略1：指定分区（精确控制）
producer.send(new ProducerRecord<>("topic", 0, "key", "value"));

// 策略2：指定 key（相同 key 到同一分区）
producer.send(new ProducerRecord<>("topic", "order-001", "value"));

// 策略3：不指定（轮询分配）
producer.send(new ProducerRecord<>("topic", "value"));
```

---

## 5 Producer 与 Consumer

### Producer（生产者）

Producer 负责向 Kafka 发送消息：

```java
// 创建生产者配置
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

// 创建生产者
Producer<String, String> producer = new KafkaProducer<>(props);

// 发送消息
ProducerRecord<String, String> record = new ProducerRecord<>("order-topic", "order-001", "创建订单");
producer.send(record);

// 关闭生产者
producer.close();
```

**Producer 发送流程**：

```
1. Producer 拦截器（Interceptor）
   ↓
2. 序列化器（Serializer）
   ↓
3. 分区器（Partitioner）
   ↓
4. 记录累加器（RecordAccumulator）
   ↓
5. 发送到 Broker
```

### Consumer（消费者）

Consumer 负责从 Kafka 读取消息：

```java
// 创建消费者配置
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "order-group");
props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");

// 创建消费者
Consumer<String, String> consumer = new KafkaConsumer<>(props);

// 订阅主题
consumer.subscribe(Arrays.asList("order-topic"));

// 消费消息
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        System.out.printf("分区=%d, 偏移量=%d, key=%s, value=%s%n",
            record.partition(), record.offset(), record.key(), record.value());
    }
}
```

**Consumer 消费流程**：

```
1. Consumer 向 Broker 发送拉取请求
   ↓
2. Broker 返回消息
   ↓
3. Consumer 反序列化消息
   ↓
4. Consumer 处理消息
   ↓
5. Consumer 提交偏移量（Offset）
```

---

## 6 Consumer Group（消费者组）

### 消费者组原理

Consumer Group 是 Kafka 实现消息广播和负载均衡的核心机制：

```
场景1：3个分区，3个消费者（每个消费者消费1个分区）
order-topic (3 partitions)
├── partition-0 --> consumer-A (group-1)
├── partition-1 --> consumer-B (group-1)
└── partition-2 --> consumer-C (group-1)

场景2：3个分区，2个消费者（有消费者消费多个分区）
order-topic (3 partitions)
├── partition-0 --> consumer-A (group-1)
├── partition-1 --> consumer-B (group-1)
└── partition-2 --> consumer-A (group-1)  // A 消费两个分区

场景3：3个分区，4个消费者（有消费者空闲）
order-topic (3 partitions)
├── partition-0 --> consumer-A (group-1)
├── partition-1 --> consumer-B (group-1)
└── partition-2 --> consumer-C (group-1)
    consumer-D (group-1)  // 空闲
```

**消费者组规则**：

| 规则 | 说明 |
| --- | --- |
| 一个分区只能被组内一个消费者消费 | 保证消息不被重复消费 |
| 一个消费者可以消费多个分区 | 当分区数大于消费者数时 |
| 消费者数不应超过分区数 | 多余的消费者会空闲 |

### 不同消费者组独立消费

同一个 Topic 可以被多个消费者组独立消费：

```
order-topic (3 partitions)
├── partition-0 --> consumer-A (group-1)  # 订单处理组
├── partition-1 --> consumer-B (group-1)
└── partition-2 --> consumer-C (group-1)

├── partition-0 --> consumer-X (group-2)  # 数据分析组
├── partition-1 --> consumer-Y (group-2)
└── partition-2 --> consumer-Z (group-2)
```

> **类比**：就像一份报纸可以被多个读者阅读，每个读者独立阅读，互不影响。

---

## 7 ZooKeeper 的作用

### ZooKeeper 在 Kafka 中的角色

ZooKeeper 是 Kafka 的元数据管理中心（Kafka 3.0+ 支持 KRaft 模式，不依赖 ZooKeeper）：

| 功能 | 说明 |
| --- | --- |
| **Broker 注册** | Broker 启动时注册到 ZooKeeper |
| **Topic 管理** | 存储 Topic 配置、分区信息 |
| **Leader 选举** | 当 Leader 分区宕机时，选举新的 Leader |
| **配置管理** | 存储集群配置信息 |
| **配额管理** | 管理生产者和消费者的配额 |

### ZooKeeper 存储的数据

```
/kafka/
├── brokers/
│   ├── ids/          # Broker 注册信息
│   │   ├── 0
│   │   ├── 1
│   │   └── 2
│   └── topics/       # Topic 分区信息
│       ├── order-topic/
│       │   └── partitions/
│       │       ├── 0/state  # 分区状态（Leader、ISR）
│       │       ├── 1/state
│       │       └── 2/state
├── config/
│   ├── brokers/      # Broker 配置
│   └── topics/       # Topic 配置
└── controller        # 控制器信息
```

### KRaft 模式

Kafka 3.0+ 引入 KRaft 模式，移除对 ZooKeeper 的依赖：

| 特性 | ZooKeeper 模式 | KRaft 模式 |
| --- | --- | --- |
| **元数据管理** | ZooKeeper | 内置 Raft 共识 |
| **部署复杂度** | 需要额外部署 ZooKeeper | 独立部署 |
| **性能** | 受 ZooKeeper 限制 | 更高性能 |
| **适用场景** | 生产环境（成熟） | 新版本（逐步推广） |

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Broker** | Kafka 服务器节点，存储和转发消息 |
| **Topic** | 消息的逻辑分类 |
| **Partition** | Topic 的物理分片，实现水平扩展 |
| **Producer** | 向 Kafka 发送消息 |
| **Consumer** | 从 Kafka 读取消息 |
| **Consumer Group** | 多个消费者共同消费，实现负载均衡 |
| **ZooKeeper** | 管理集群元数据（KRaft 模式可替代） |
| **Offset** | 消息在分区中的唯一标识 |

---

## 9 新手常见误区

### 误区 1："Kafka 的消息是存在内存中的"

**错！** Kafka 的消息是持久化到磁盘的，而不是内存。Kafka 依赖操作系统的页缓存（Page Cache）来提高性能，但数据最终会写入磁盘。

### 误区 2："一个 Topic 只能有一个消费者"

**错！** 一个 Topic 可以有多个消费者，但同一个消费者组内，一个分区只能被一个消费者消费。不同消费者组可以独立消费同一个 Topic。

### 误区 3："分区越多性能越好"

**不是的。** 分区过多会导致：
- 文件句柄增多
- 元数据变大
- 消费者重平衡频繁
- 性能反而下降

一般建议：分区数 = 消费者数量，或略大于消费者数量。

### 误区 4："Kafka 必须依赖 ZooKeeper"

**不完全对。** Kafka 3.0+ 支持 KRaft 模式，可以不依赖 ZooKeeper。但生产环境中，ZooKeeper 模式仍然是主流。

---

## 10 动手练习

### 练习 1：基础练习

安装 Kafka 并启动一个单节点集群，创建一个 Topic，使用命令行工具发送和接收消息。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 启动 ZooKeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# 2. 启动 Kafka Broker（新终端）
bin/kafka-server-start.sh config/server.properties

# 3. 创建 Topic（新终端）
bin/kafka-topics.sh --create \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1

# 4. 启动生产者（新终端）
bin/kafka-console-producer.sh --topic test-topic --bootstrap-server localhost:9092
# 输入：Hello Kafka

# 5. 启动消费者（新终端）
bin/kafka-console-consumer.sh --topic test-topic --from-beginning --bootstrap-server localhost:9092
# 输出：Hello Kafka
```

</details>

### 练习 2：进阶练习

创建一个包含 3 个分区的 Topic，观察消息的分区分布，并理解分区的作用。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建 3 分区的 Topic
bin/kafka-topics.sh --create \
  --topic order-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# 2. 查看 Topic 详情
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

搭建一个包含 3 个 Broker 的 Kafka 集群，测试高可用性。

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

# 3. 启动 3 个 Broker（各开一个终端）
bin/kafka-server-start.sh config/server-1.properties
bin/kafka-server-start.sh config/server-2.properties
bin/kafka-server-start.sh config/server-3.properties

# 4. 创建 Topic（副本因子为 3）
bin/kafka-topics.sh --create \
  --topic ha-topic \
  --bootstrap-server localhost:9093,localhost:9094,localhost:9095 \
  --partitions 3 \
  --replication-factor 3

# 5. 查看 Topic 详情
bin/kafka-topics.sh --describe --topic ha-topic --bootstrap-server localhost:9093

# 6. 停止一个 Broker，验证高可用性
# 在另一个终端停止 server-2
# 继续生产和消费消息，验证集群仍然可用
```

</details>

---

## 下一章预告

下一章我们会深入学习 **Kafka 的消息存储机制**——Log Segment、索引文件、消息格式、清理策略。你会理解 Kafka 是如何高效存储和管理消息的。
