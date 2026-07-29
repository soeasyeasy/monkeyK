---
title: "第5章：分区机制深度解析"
description: "深入理解分区分配策略、顺序性保证、自定义分区器"
---

# 第5章：分区机制深度解析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 分区是怎么分配给消费者的？
- Kafka 怎么保证消息顺序？
- 自定义分区器有哪些最佳实践？
- 分区数量该怎么设置？

这一章会深入分区机制的底层原理，搞懂这些能让你更好地设计和使用 Kafka。

---

## 1 为什么需要深入理解分区？

### 痛点分析

分区是 Kafka 实现水平扩展的核心机制，但不理解分区原理会导致：

- **数据倾斜**：某些分区数据量远大于其他分区
- **顺序混乱**：不了解分区与顺序的关系，业务出错
- **扩展困难**：增加分区后，原有消息的分区归属变化
- **性能瓶颈**：分区数设置不当，影响消费性能

### 解决方案

理解分区原理后，你能：

- 合理设计分区策略，避免数据倾斜
- 正确保证消息顺序性
- 灵活扩展分区，不影响业务
- 优化消费性能

> **一句话总结**：分区是 Kafka 的灵魂，理解分区才能用好 Kafka。

---

## 2 分区分配策略

### 消费者组分区分配

当消费者加入组时，Kafka 需要将分区分配给消费者。Kafka 提供了三种分配策略：

| 策略 | 类名 | 说明 |
| --- | --- | --- |
| **Range** | RangeAssignor | 按范围分配，可能导致倾斜 |
| **RoundRobin** | RoundRobinAssignor | 轮询分配，均匀分布 |
| **Sticky** | StickyAssignor | 粘性分配，减少重平衡（默认） |

### Range 分配策略

按分区编号范围分配，每个消费者分配连续的一段分区：

```
主题 A 有 4 个分区，主题 B 有 4 个分区，2 个消费者：

Consumer-0:
  A: partition-0, partition-1
  B: partition-0, partition-1

Consumer-1:
  A: partition-2, partition-3
  B: partition-2, partition-3
```

**问题**：当主题分区数不能被消费者数整除时，会出现倾斜：

```
主题 A 有 3 个分区，2 个消费者：

Consumer-0: partition-0, partition-1  (2 个)
Consumer-1: partition-2              (1 个)
```

### RoundRobin 分配策略

将所有主题的分区轮询分配给消费者：

```
主题 A 有 3 个分区，主题 B 有 3 个分区，2 个消费者：

Consumer-0: A-0, A-2, B-1  (3 个)
Consumer-1: A-1, B-0, B-2  (3 个)
```

**优点**：分配均匀
**缺点**：同一消费者可能消费多个主题的分区，不利于局部性

### Sticky 分配策略

在保持均匀分配的同时，尽量保持原有的分配不变：

```
初始分配（3 个分区，2 个消费者）：

Consumer-0: partition-0, partition-1
Consumer-1: partition-2

Consumer-1 宕机后：

Consumer-0: partition-0, partition-1, partition-2
（尽量保持原有分配，只变动必要的部分）

Consumer-1 恢复后：

Consumer-0: partition-0, partition-1
Consumer-1: partition-2
（恢复到初始分配）
```

**优点**：减少重平衡时的分区迁移，降低开销

### 配置分配策略

```java
Properties props = new Properties();

// 使用 Range 策略
props.put("partition.assignment.strategy", 
    "org.apache.kafka.clients.consumer.RangeAssignor");

// 使用 RoundRobin 策略
props.put("partition.assignment.strategy", 
    "org.apache.kafka.clients.consumer.RoundRobinAssignor");

// 使用 Sticky 策略（默认）
props.put("partition.assignment.strategy", 
    "org.apache.kafka.clients.consumer.StickyAssignor");
```

---

## 3 消息顺序性保证

### Kafka 的顺序保证

Kafka 只保证 **分区内有序**，不保证全局有序：

```
partition-0: msg1 -> msg3 -> msg5  （有序）
partition-1: msg2 -> msg4 -> msg6  （有序）
全局：msg1 -> msg2 -> msg3 -> ...  （不一定有序）
```

打个比方：

> 就像高速公路有多条车道，每条车道内的车是有序的，但不同车道之间的车没有先后关系。

### 保证全局有序

如果业务需要全局有序，只能使用**单分区**：

```java
// 创建单分区主题
bin/kafka-topics.sh --create \
  --topic ordered-topic \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1
```

**缺点**：失去了并行处理能力，性能受限。

### 保证局部有序

大多数业务只需要**局部有序**（如同一订单的消息有序）：

```java
// 使用相同的 key，保证到同一分区
producer.send(new ProducerRecord<>("order-topic", "order-001", "创建订单"));
producer.send(new ProducerRecord<>("order-topic", "order-001", "支付订单"));
producer.send(new ProducerRecord<>("order-topic", "order-001", "发货订单"));
```

**原理**：相同 key 的消息会被路由到同一分区，分区内有序。

### 顺序性保证的完整方案

```
1. 生产者端：
   - 使用相同的 key 保证到同一分区
   - 设置 max.in.flight.requests.per.connection=1 保证发送顺序

2. Broker 端：
   - 分区内消息有序写入

3. 消费者端：
   - 单线程消费同一分区
   - 或使用有序处理逻辑
```

---

## 4 自定义分区器

### 默认分区器

Kafka 默认使用 `DefaultPartitioner`：

```java
// 有 key 时：使用 key 的 hash 值
int partition = Math.abs(key.hashCode()) % numPartitions;

// 无 key 时：使用 Sticky Partitioner（Kafka 2.4+）
// 批量发送到同一分区，减少请求次数
```

### 自定义分区器示例

```java
import org.apache.kafka.clients.producer.Partitioner;
import org.apache.kafka.common.Cluster;
import org.apache.kafka.common.PartitionInfo;
import java.util.List;
import java.util.Map;

public class CustomPartitioner implements Partitioner {

    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                        Object value, byte[] valueBytes, Cluster cluster) {
        // 获取主题的所有分区
        List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
        int numPartitions = partitions.size();

        // 如果没有 key，使用轮询
        if (keyBytes == null || keyBytes.length == 0) {
            return StickyPartitionCache.getInstance().partition(topic, numPartitions);
        }

        // 根据 key 的 hash 值计算分区
        int hash = Math.abs(key.hashCode());
        return hash % numPartitions;
    }

    @Override
    public void close() {
        // 清理资源
    }

    @Override
    public void configure(Map<String, ?> configs) {
        // 初始化配置
    }
}
```

### 使用自定义分区器

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

// 指定自定义分区器
props.put("partitioner.class", "com.example.CustomPartitioner");

Producer<String, String> producer = new KafkaProducer<>(props);
```

### 分区器最佳实践

| 实践 | 说明 |
| --- | --- |
| **相同 key 到同一分区** | 保证局部有序 |
| **均匀分布** | 避免数据倾斜 |
| **考虑分区数变化** | 分区数增加后，key 的分区可能变化 |
| **测试验证** | 充分测试分区器的行为 |

---

## 5 分区数量设计

### 分区数的影响

| 影响 | 说明 |
| --- | --- |
| **吞吐量** | 分区越多，并行度越高，吞吐量越大 |
| **文件句柄** | 每个分区需要打开文件，分区过多消耗资源 |
| **元数据大小** | 分区信息存储在 ZooKeeper，分区过多导致元数据变大 |
| **重平衡开销** | 分区越多，重平衡时间越长 |

### 分区数计算建议

```
分区数 = max(生产者吞吐量 / 单分区吞吐量, 消费者吞吐量 / 单消费者吞吐量)

示例：
- 生产者吞吐量：100MB/s
- 单分区吞吐量：20MB/s
- 消费者吞吐量：50MB/s
- 单消费者吞吐量：25MB/s

分区数 = max(100/20, 50/25) = max(5, 2) = 5
```

### 分区数设置建议

| 场景 | 建议 |
| --- | --- |
| **小规模** | 10-50 个分区 |
| **中规模** | 50-200 个分区 |
| **大规模** | 200-1000 个分区 |
| **超大规模** | 1000+ 个分区（需要专门优化） |

### 增加分区

```bash
# 增加分区数（注意：只能增加，不能减少）
bin/kafka-topics.sh --alter \
  --topic order-topic \
  --bootstrap-server localhost:9092 \
  --partitions 6
```

**注意**：增加分区后，原有消息的分区归属不会变化，新消息会按新的分区数分配。

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Range 分配** | 按范围分配，可能导致倾斜 |
| **RoundRobin 分配** | 轮询分配，均匀分布 |
| **Sticky 分配** | 粘性分配，减少重平衡（默认） |
| **分区内有序** | Kafka 只保证分区内有序 |
| **全局有序** | 需要单分区，失去并行能力 |
| **局部有序** | 相同 key 到同一分区 |
| **自定义分区器** | 实现 Partitioner 接口 |
| **分区数设计** | 根据吞吐量和资源情况决定 |

---

## 7 新手常见误区

### 误区 1："分区越多越好"

**错！** 分区过多会导致文件句柄增多、元数据变大、重平衡频繁。应该根据实际需求设置。

### 误区 2："Kafka 保证全局有序"

**错！** Kafka 只保证分区内有序。如果需要全局有序，只能使用单分区。

### 误区 3："增加分区后，原有消息会重新分配"

**错！** 增加分区后，原有消息的分区归属不会变化，只有新消息会按新的分区数分配。

### 误区 4："分区数可以随意减少"

**错！** Kafka 只能增加分区，不能减少分区。如果需要减少分区，只能删除主题重建。

---

## 8 动手练习

### 练习 1：基础练习

创建一个多分区主题，观察消息的分区分布。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建 3 分区的主题
bin/kafka-topics.sh --create \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# 2. 查看主题详情
bin/kafka-topics.sh --describe --topic test-topic --bootstrap-server localhost:9092

# 3. 发送消息
bin/kafka-console-producer.sh --topic test-topic --bootstrap-server localhost:9092
# 输入多条消息

# 4. 查看每个分区的消息数
bin/kafka-run-class.sh kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic test-topic
```

</details>

### 练习 2：进阶练习

实现一个自定义分区器，将订单消息根据订单ID的哈希值路由到指定分区。

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
        int partitionCount = cluster.partitionCountForTopic(topic);

        if (keyBytes == null) {
            return 0;
        }

        // 根据 key 的 hash 值计算分区
        int hash = Math.abs(key.hashCode());
        return hash % partitionCount;
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
props.put("partitioner.class", "com.example.OrderPartitioner");

Producer<String, String> producer = new KafkaProducer<>(props);

// 相同订单ID的消息会到同一分区
producer.send(new ProducerRecord<>("order-topic", "order-001", "创建订单"));
producer.send(new ProducerRecord<>("order-topic", "order-001", "支付订单"));
producer.send(new ProducerRecord<>("order-topic", "order-001", "发货订单"));

producer.close();
```

</details>

### 练习 3（挑战）：综合练习

设计一个分区方案，要求：订单消息按订单ID分区，同一订单的消息有序，不同订单的消息可以并行处理。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.clients.producer.*;
import java.util.Properties;

public class OrderPartitionDesign {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        
        // 使用默认分区器（按 key hash 分配）
        Producer<String, String> producer = new KafkaProducer<>(props);

        // 创建主题时设置合适的分区数
        // bin/kafka-topics.sh --create --topic order-topic --partitions 6 --replication-factor 1

        // 发送同一订单的多条消息（相同 key，保证有序）
        String orderId1 = "order-001";
        producer.send(new ProducerRecord<>("order-topic", orderId1, "创建订单"));
        producer.send(new ProducerRecord<>("order-topic", orderId1, "支付订单"));
        producer.send(new ProducerRecord<>("order-topic", orderId1, "发货订单"));

        // 发送另一订单的消息
        String orderId2 = "order-002";
        producer.send(new ProducerRecord<>("order-topic", orderId2, "创建订单"));
        producer.send(new ProducerRecord<>("order-topic", orderId2, "支付订单"));

        // 不同订单的消息可以并行处理
        // 相同订单的消息保证有序

        producer.close();
    }
}
```

**设计要点**：
1. 使用订单ID作为 key，保证同一订单到同一分区
2. 分区数设置为 6（或更多），支持并行处理
3. 消费者组中每个消费者消费一个分区，保证并行度

</details>

---

## 下一章预告

下一章我们会深入学习 **Kafka 的副本机制与高可用**——Leader 选举、ISR 机制、故障转移、数据一致性。你会理解 Kafka 是如何保证高可用和数据安全的。
