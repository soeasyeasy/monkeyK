---
title: "第14章：Kafka 核心原理"
description: "深入理解分区、副本、消费者组、消息存储机制"
---

# 第14章：Kafka 核心原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Kafka 的分区是怎么工作的？
- 副本机制怎么保证高可用？
- 消费者组的重平衡是什么？
- Kafka 为什么读写这么快？

这一章会深入 Kafka 的底层原理，搞懂这些能让你更好地使用和调优 Kafka。

---

## 1 分区机制

### 分区的作用

分区是 Kafka 实现水平扩展的核心机制：

- **并行处理**：多个消费者可以同时消费不同分区
- **负载均衡**：消息分散到多个 broker
- **突破单机限制**：一个主题的数据可以分布在多台机器上

### 分区策略

生产者发送消息时，Kafka 通过以下策略决定消息发到哪个分区：

```java
// 策略1：指定分区
producer.send(new ProducerRecord<>("topic", 0, "key", "value"));

// 策略2：指定 key（通过 key 的 hash 值决定分区）
producer.send(new ProducerRecord<>("topic", "order-001", "value"));

// 策略3：不指定 key 和分区（轮询分配）
producer.send(new ProducerRecord<>("topic", "value"));
```

| 策略 | 说明 | 适用场景 |
| --- | --- | --- |
| 指定分区 | 精确控制分区 | 特殊业务需求 |
| 指定 key | 相同 key 到同一分区 | 保证顺序（如同一订单的消息） |
| 轮询 | 均匀分配 | 不需要顺序的场景 |

### 分区顺序性

Kafka 只保证 **分区内有序**，不保证全局有序：

```
partition-0: msg1 -> msg3 -> msg5  （有序）
partition-1: msg2 -> msg4 -> msg6  （有序）
全局：msg1 -> msg2 -> msg3 -> ...  （不一定有序）
```

> 类比：就像高速公路有多条车道，每条车道内的车是有序的，但不同车道之间的车没有先后关系。

---

## 2 副本机制

### 什么是副本？

每个分区可以有多个副本，分布在不同 broker 上：

```
partition-0:
  - broker-1: leader（主副本，处理读写）
  - broker-2: follower（从副本，同步数据）
  - broker-3: follower（从副本，同步数据）
```

### Leader 和 Follower

| 角色 | 说明 |
| --- | --- |
| **Leader** | 处理所有读写请求 |
| **Follower** | 从 Leader 同步数据，不处理客户端请求 |

### ISR（In-Sync Replicas）

ISR 是与 Leader 保持同步的副本集合：

```
ISR = {leader, follower-1, follower-2}
```

如果某个 follower 同步太慢，会被移出 ISR：

```
ISR = {leader, follower-1}  // follower-2 被移出
```

### 副本同步流程

```
1. Producer 发送消息到 Leader
2. Leader 写入本地日志
3. Follower 从 Leader 拉取消息
4. Follower 写入本地日志后，向 Leader 发送 ACK
5. Leader 收到所有 ISR 的 ACK 后，返回成功给 Producer
```

### acks 配置

```java
Properties props = new Properties();

// acks=0：不等待确认，最快但可能丢消息
props.put("acks", "0");

// acks=1：Leader 写入成功就返回，Leader 宕机可能丢消息
props.put("acks", "1");

// acks=all：所有 ISR 副本写入成功才返回，最安全但有延迟
props.put("acks", "all");
```

| acks | 性能 | 安全性 | 适用场景 |
| --- | --- | --- | --- |
| 0 | 最高 | 最低 | 日志收集（允许少量丢失） |
| 1 | 高 | 中 | 一般业务消息 |
| all | 低 | 最高 | 金融交易（不能丢消息） |

---

## 3 消费者组

### 消费者组原理

消费者组（Consumer Group）是 Kafka 实现消息广播和负载均衡的核心机制：

```
主题有3个分区，消费者组有3个消费者：
partition-0 --> consumer-A
partition-1 --> consumer-B
partition-2 --> consumer-C

消费者组有2个消费者（分区不够分）：
partition-0 --> consumer-A
partition-1 --> consumer-B
partition-2 --> consumer-A  // A 消费两个分区
```

### 消费者组规则

1. 一个分区只能被组内的一个消费者消费
2. 一个消费者可以消费多个分区
3. 消费者数量不应超过分区数量

### 重平衡（Rebalance）

当以下情况发生时，消费者组会触发重平衡：

- 新的消费者加入组
- 消费者离开组（崩溃或主动关闭）
- 分区数量变化

```
重平衡前：
partition-0 --> consumer-A
partition-1 --> consumer-B
partition-2 --> consumer-C

consumer-C 离开后：
partition-0 --> consumer-A
partition-1 --> consumer-B
partition-2 --> consumer-A  // 重新分配
```

> 重平衡期间，消费者组会暂停消费，直到新的分配完成。频繁重平衡会影响性能。

### 消费者偏移量管理

消费者通过偏移量（offset）记录消费位置：

```java
// 自动提交偏移量（默认5秒提交一次）
props.put("enable.auto.commit", "true");
props.put("auto.commit.interval.ms", "5000");

// 手动提交偏移量
props.put("enable.auto.commit", "false");

ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
for (ConsumerRecord<String, String> record : records) {
    process(record);
}
// 处理完成后手动提交
consumer.commitSync();
```

| 提交方式 | 优点 | 缺点 |
| --- | --- | --- |
| 自动提交 | 简单 | 可能重复消费或丢失 |
| 手动同步提交 | 可靠 | 阻塞，影响性能 |
| 手动异步提交 | 不阻塞 | 需要处理回调 |

---

## 4 消息存储机制

### 日志段（Log Segment）

每个分区的消息存储在多个日志段中：

```
/var/kafka-logs/order-topic-0/
├── 00000000000000000000.log      # 第一个日志段
├── 00000000000000368769.log      # 第二个日志段（从offset 368769开始）
├── 00000000000000000000.index    # 偏移量索引
├── 00000000000000000000.timeindex # 时间戳索引
```

### 为什么 Kafka 这么快？

#### 1. 顺序写入

Kafka 将消息追加写入磁盘（顺序IO），比随机IO快得多：

```
磁盘写入方式：
随机写入：~100 KB/s
顺序写入：~600 MB/s（快6000倍）
```

#### 2. 零拷贝（Zero Copy）

传统方式：磁盘 -> 内核缓冲区 -> 用户缓冲区 -> Socket缓冲区 -> 网卡

零拷贝：磁盘 -> 内核缓冲区 -> 网卡（跳过用户空间）

```
传统读取：4次上下文切换，2次数据拷贝
零拷贝：2次上下文切换，1次数据拷贝
```

#### 3. 页缓存（Page Cache）

Kafka 依赖操作系统的页缓存，而不是自己管理内存：

- 消息写入时，先写入页缓存，由操作系统异步刷到磁盘
- 消息读取时，大部分数据在页缓存中，直接从内存读取

#### 4. 批量处理

Kafka 支持批量发送和压缩：

```java
// 批量发送配置
props.put("batch.size", "16384");      // 批次大小（16KB）
props.put("linger.ms", "5");           // 等待5ms凑批
props.put("compression.type", "lz4");  // 压缩算法
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 分区 | 水平扩展的核心，分区内有序 |
| 副本 | Leader 处理读写，Follower 同步数据 |
| ISR | 与 Leader 保持同步的副本集合 |
| acks | 生产者确认级别（0/1/all） |
| 消费者组 | 组内消费者共同消费所有分区 |
| 重平衡 | 消费者变化时重新分配分区 |
| 顺序写入 | Kafka 高性能的关键 |
| 零拷贝 | 减少数据拷贝次数 |

---

## 6 新手常见误区

### 误区 1："Kafka 保证全局有序"

**错！** Kafka 只保证分区内有序。如果需要全局有序，只能用一个分区（但失去了并行能力）。

### 误区 2："副本越多越好"

不是的。副本越多，存储开销越大，同步延迟也越高。一般副本因子设为2或3就够了。

### 误区 3："消费者越多，消费越快"

不一定。消费者数量不能超过分区数量，多出来的消费者会空闲。而且重平衡期间消费会暂停。

### 误区 4："acks=all 就一定不丢消息"

不完全是。acks=all 保证所有 ISR 副本都写入成功，但如果 ISR 中所有 broker 同时宕机，消息还是会丢。需要配合副本因子和 min.insync.replicas 配置。

---

## 7 动手练习

### 练习 1：基础练习

使用 Java 代码创建一个 Kafka 生产者，分别测试三种分区策略。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.clients.producer.*;
import java.util.Properties;

public class PartitionTest {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

        Producer<String, String> producer = new KafkaProducer<>(props);

        // 策略1：指定分区
        producer.send(new ProducerRecord<>("test-topic", 0, "key1", "msg-to-partition-0"));

        // 策略2：指定 key（相同 key 到同一分区）
        producer.send(new ProducerRecord<>("test-topic", "order-001", "msg-with-key-1"));
        producer.send(new ProducerRecord<>("test-topic", "order-001", "msg-with-key-2"));

        // 策略3：轮询（不指定 key 和分区）
        producer.send(new ProducerRecord<>("test-topic", "round-robin-1"));
        producer.send(new ProducerRecord<>("test-topic", "round-robin-2"));

        producer.close();
    }
}
```

</details>

### 练习 2：进阶练习

实现一个 Kafka 消费者组，手动提交偏移量，处理消息后确认。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.clients.consumer.*;
import java.time.Duration;
import java.util.Collections;
import java.util.Properties;

public class ManualCommitConsumer {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("group.id", "order-group");
        props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        // 关闭自动提交
        props.put("enable.auto.commit", "false");

        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
        consumer.subscribe(Collections.singletonList("order-topic"));

        try {
            while (true) {
                // 拉取消息
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

                for (ConsumerRecord<String, String> record : records) {
                    System.out.printf("分区=%d, 偏移量=%d, key=%s, value=%s%n",
                        record.partition(), record.offset(), record.key(), record.value());

                    // 处理业务逻辑
                    processOrder(record.value());
                }

                // 处理完成后手动提交
                consumer.commitSync();
                System.out.println("偏移量已提交");
            }
        } finally {
            consumer.close();
        }
    }

    private static void processOrder(String order) {
        // 模拟业务处理
        System.out.println("处理订单: " + order);
    }
}
```

</details>

### 练习 3（挑战）：综合练习

实现一个自定义分区器，根据订单ID的哈希值将消息路由到指定分区。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.clients.producer.Partitioner;
import org.apache.kafka.common.Cluster;
import java.util.Map;

public class OrderPartitioner implements Partitioner {

    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                        Object value, byte[] valueBytes, Cluster cluster) {
        // 获取分区数量
        int partitionCount = cluster.partitionCountForTopic(topic);

        if (keyBytes == null) {
            return 0;
        }

        // 根据 key 的哈希值计算分区
        int hash = key.hashCode();
        return Math.abs(hash) % partitionCount;
    }

    @Override
    public void close() {}

    @Override
    public void configure(Map<String, ?> configs) {}
}

// 使用自定义分区器
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
// 指定自定义分区器
props.put("partitioner.class", "com.example.OrderPartitioner");

Producer<String, String> producer = new KafkaProducer<>(props);

// 相同订单ID的消息会到同一分区
producer.send(new ProducerRecord<>("order-topic", "order-001", "创建订单"));
producer.send(new ProducerRecord<>("order-topic", "order-001", "支付订单"));
producer.send(new ProducerRecord<>("order-topic", "order-001", "发货订单"));

producer.close();
```

</details>

---

## 下一章预告

下一章我们会学习 **消息队列的实战应用**——异步解耦、削峰填谷、数据同步等常见场景。你会学到如何在真实项目中使用消息队列解决问题。
