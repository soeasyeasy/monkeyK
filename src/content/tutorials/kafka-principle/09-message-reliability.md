---
title: "第9章：消息可靠性保证"
description: "深入理解生产者确认、消费者确认、数据不丢失方案"
---

# 第9章：消息可靠性保证

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 消息在什么情况下会丢失？
- 怎么保证消息不丢失？
- 怎么保证消息不重复消费？
- 生产环境中怎么配置才能保证可靠性？

这一章会深入消息可靠性的各个环节，搞懂这些能让你在生产环境中保证数据安全。

---

## 1 消息可能丢失的环节

### 三个环节

```
Producer ──→ Broker ──→ Consumer
   ①            ②           ③

① 生产者发送消息时丢失
② Broker 存储消息时丢失
③ 消费者处理消息时丢失
```

### 环节1：生产者丢失

```java
// ❌ 错误：异步发送，没有回调
producer.send(record);

// ✅ 正确：同步发送或异步发送带回调
RecordMetadata metadata = producer.send(record).get();
```

**丢失场景**：

| 场景 | 原因 |
| --- | --- |
| **acks=0** | 不等待确认，Broker 可能没收到 |
| **缓冲区满** | buffer.memory 不足，消息被丢弃 |
| **回调未处理** | 发送失败但没有重试 |

### 环节2：Broker 丢失

**丢失场景**：

| 场景 | 原因 |
| --- | --- |
| **acks=1** | Leader 写入成功但 Follower 没同步，Leader 宕机 |
| **副本因子=1** | 只有一个副本，Broker 宕机数据丢失 |
| **unclean leader election** | 非 ISR 副本成为 Leader，可能丢数据 |

### 环节3：消费者丢失

**丢失场景**：

| 场景 | 原因 |
| --- | --- |
| **自动提交偏移量** | 处理失败但偏移量已提交 |
| **先提交后处理** | 偏移量提交成功，但处理失败 |

---

## 2 生产者可靠性配置

### 完整配置

```java
Properties props = new Properties();

// 基础配置
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

// ✅ 可靠性配置
props.put("acks", "all");                    // 所有 ISR 副本确认
props.put("retries", Integer.MAX_VALUE);     // 无限重试
props.put("retry.backoff.ms", "100");        // 重试间隔 100ms
props.put("enable.idempotence", "true");     // 幂等性
props.put("max.in.flight.requests.per.connection", "5"); // 最大未确认请求

// 缓冲区配置
props.put("buffer.memory", "67108864");      // 64MB 缓冲区
props.put("block.on.buffer.full", "true");   // 缓冲区满时阻塞
```

### acks 配置详解

| acks | 说明 | 可靠性 | 性能 |
| --- | --- | --- | --- |
| **0** | 不等待确认 | 最低 | 最高 |
| **1** | Leader 确认 | 中 | 高 |
| **all** | 所有 ISR 确认 | 最高 | 低 |

### 重试机制

```java
// 可重试的错误
// - LeaderNotAvailableException
// - NotLeaderForPartitionException
// - RequestTimedOutException
// - NetworkException

// 不可重试的错误
// - InvalidMessageException
// - UnknownTopicException
// - RecordTooLargeException
```

---

## 3 Broker 可靠性配置

### 完整配置

```properties
# server.properties

# 副本配置
replication.factor=3              # 副本因子至少为 3
min.insync.replicas=2             # 最小同步副本数为 2

# Leader 选举
unclean.leader.election.enable=false  # 禁止非 ISR 副本成为 Leader

# 刷盘配置（可选，默认依赖 OS）
# log.flush.interval.messages=1    # 每条消息刷盘（性能低）
# log.flush.interval.ms=1000       # 每秒刷盘

# 日志保留
log.retention.hours=168           # 保留 7 天
log.retention.bytes=1073741824    # 保留 1GB
```

### 副本因子与 min.insync.replicas

```
replication.factor=3, min.insync.replicas=2

场景1：3 个副本都正常
  ISR = {broker-1, broker-2, broker-3}
  acks=all 需要 3 个确认

场景2：1 个副本宕机
  ISR = {broker-1, broker-2}
  acks=all 需要 2 个确认，仍然可用

场景3：2 个副本宕机
  ISR = {broker-1}
  ISR 数量 < min.insync.replicas，拒绝写入
```

---

## 4 消费者可靠性配置

### 完整配置

```java
Properties props = new Properties();

// 基础配置
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "order-group");
props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");

// ✅ 可靠性配置
props.put("enable.auto.commit", "false");     // 关闭自动提交
props.put("auto.offset.reset", "earliest");   // 从最早开始消费

// 会话管理
props.put("session.timeout.ms", "30000");     // 会话超时 30 秒
props.put("heartbeat.interval.ms", "10000");  // 心跳间隔 10 秒
props.put("max.poll.interval.ms", "600000");  // 最大拉取间隔 10 分钟
```

### 手动提交偏移量

```java
// ✅ 正确：先处理，后提交
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    
    for (ConsumerRecord<String, String> record : records) {
        try {
            processOrder(record.value());  // 处理消息
        } catch (Exception e) {
            // 处理失败，不提交偏移量，下次重新消费
            log.error("处理失败: " + record.value(), e);
            continue;
        }
    }
    
    // 处理成功后提交偏移量
    consumer.commitSync();
}
```

### 偏移量提交策略对比

| 策略 | 可靠性 | 性能 | 适用场景 |
| --- | --- | --- | --- |
| **自动提交** | 低 | 高 | 允许重复或丢失 |
| **手动同步提交** | 高 | 低 | 不允许丢失 |
| **手动异步提交** | 中 | 高 | 允许少量重复 |

---

## 5 数据不丢失完整方案

### 生产者端

```java
// 1. 配置
props.put("acks", "all");
props.put("retries", Integer.MAX_VALUE);
props.put("enable.idempotence", "true");

// 2. 发送
try {
    RecordMetadata metadata = producer.send(record).get();
    log.info("发送成功: offset={}", metadata.offset());
} catch (Exception e) {
    log.error("发送失败", e);
    // 保存到本地文件，后续重试
    saveToLocalFile(record);
}
```

### Broker 端

```properties
# 1. 副本配置
replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false

# 2. 刷盘配置（可选）
log.flush.interval.messages=10000
log.flush.interval.ms=1000
```

### 消费者端

```java
// 1. 配置
props.put("enable.auto.commit", "false");
props.put("auto.offset.reset", "earliest");

// 2. 消费
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    
    for (ConsumerRecord<String, String> record : records) {
        processOrder(record.value());  // 处理消息
    }
    
    consumer.commitSync();  // 处理成功后提交
}
```

---

## 6 数据不重复方案

### 生产者端：幂等性

```java
props.put("enable.idempotence", "true");
props.put("transactional.id", "my-producer-id");
```

### Broker 端：事务

```java
producer.initTransactions();
producer.beginTransaction();
producer.send(...);
producer.commitTransaction();
```

### 消费者端：业务去重

```java
// 方案1：使用唯一 ID 去重
String messageId = record.headers().lastHeader("message-id").value();
if (isProcessed(messageId)) {
    return;  // 已处理，跳过
}
processOrder(record.value());
markAsProcessed(messageId);

// 方案2：使用数据库唯一约束
INSERT INTO orders (order_id, ...) VALUES (?, ...) ON DUPLICATE KEY UPDATE ...

// 方案3：使用 Redis 去重
if (redis.setnx("processed:" + messageId, "1")) {
    processOrder(record.value());
}
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **生产者丢失** | acks、retries、幂等性 |
| **Broker 丢失** | 副本因子、min.insync.replicas |
| **消费者丢失** | 手动提交偏移量 |
| **数据不丢** | acks=all + 副本因子=3 + 手动提交 |
| **数据不重** | 幂等性 + 事务 + 业务去重 |
| **Exactly Once** | 端到端事务保证 |

---

## 8 新手常见误区

### 误区 1："acks=all 就不会丢消息"

**不完全是。** acks=all 保证所有 ISR 副本写入成功，但如果 ISR 中所有 Broker 同时宕机，消息还是会丢。需要配合 `min.insync.replicas` 和 `replication.factor`。

### 误区 2："自动提交偏移量最安全"

**错！** 自动提交可能导致重复消费或丢失消息。对于重要业务，应该使用手动提交。

### 误区 3："消费者处理失败后，偏移量不会提交"

**不一定。** 如果使用自动提交，偏移量会定期提交，不管处理是否成功。应该使用手动提交，处理成功后再提交。

### 误区 4："Kafka 可以保证 Exactly Once"

**不完全是。** Kafka 提供幂等性和事务机制，但端到端 Exactly Once 需要生产者、Broker、消费者三方配合。消费者端需要业务去重。

---

## 9 动手练习

### 练习 1：基础练习

配置一个高可靠性的生产者，发送消息并处理失败情况。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.clients.producer.*;
import java.util.Properties;

public class ReliableProducer {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        
        // 可靠性配置
        props.put("acks", "all");
        props.put("retries", "3");
        props.put("enable.idempotence", "true");

        Producer<String, String> producer = new KafkaProducer<>(props);

        ProducerRecord<String, String> record = new ProducerRecord<>(
            "order-topic", "order-001", "创建订单"
        );

        producer.send(record, (metadata, exception) -> {
            if (exception != null) {
                System.err.println("发送失败: " + exception.getMessage());
                // 保存到本地文件，后续重试
            } else {
                System.out.println("发送成功: offset=" + metadata.offset());
            }
        });

        producer.close();
    }
}
```

</details>

### 练习 2：进阶练习

实现一个消费者，手动提交偏移量，处理失败时不提交。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.clients.consumer.*;
import java.time.Duration;
import java.util.*;

public class ReliableConsumer {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("group.id", "order-group");
        props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.put("enable.auto.commit", "false");
        props.put("auto.offset.reset", "earliest");

        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
        consumer.subscribe(Collections.singletonList("order-topic"));

        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
            
            boolean allSuccess = true;
            for (ConsumerRecord<String, String> record : records) {
                try {
                    processOrder(record.value());
                } catch (Exception e) {
                    System.err.println("处理失败: " + record.value());
                    allSuccess = false;
                    break;  // 停止处理，等待重试
                }
            }
            
            if (allSuccess) {
                consumer.commitSync();
            }
        }
    }

    private static void processOrder(String order) throws Exception {
        System.out.println("处理订单: " + order);
        // 模拟处理逻辑
    }
}
```

</details>

### 练习 3（挑战）：综合练习

实现完整的数据不丢失方案：生产者 acks=all，Broker 副本因子=3，消费者手动提交。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建主题（副本因子=3）
bin/kafka-topics.sh --create \
  --topic reliable-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3 \
  --config min.insync.replicas=2
```

```java
// 2. 生产者配置
Properties producerProps = new Properties();
producerProps.put("bootstrap.servers", "localhost:9092");
producerProps.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
producerProps.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
producerProps.put("acks", "all");
producerProps.put("retries", Integer.MAX_VALUE);
producerProps.put("enable.idempotence", "true");

// 3. 消费者配置
Properties consumerProps = new Properties();
consumerProps.put("bootstrap.servers", "localhost:9092");
consumerProps.put("group.id", "reliable-group");
consumerProps.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
consumerProps.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
consumerProps.put("enable.auto.commit", "false");
consumerProps.put("auto.offset.reset", "earliest");
```

</details>

---

## 下一章预告

下一章我们会深入学习 **Kafka 的 Exactly Once 语义实现**——幂等生产者、事务性消息、端到端 Exactly Once。你会理解 Kafka 如何保证数据精确处理一次。
