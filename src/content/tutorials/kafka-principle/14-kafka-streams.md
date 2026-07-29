---
title: "第14章：Kafka Streams 流处理"
description: "深入理解流处理概念、DSL API、状态存储、窗口操作"
---

# 第14章：Kafka Streams 流处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Kafka Streams 是什么？和 Spark/Flink 有什么区别？
- 流处理和批处理有什么不同？
- 怎么做实时聚合和窗口计算？
- 状态存储是怎么工作的？

这一章会深入 Kafka Streams 的流处理原理，搞懂这些能让你进行实时数据处理。

---

## 1 为什么需要 Kafka Streams？

### 痛点分析

没有流处理时：

- **批处理延迟高**：需要等数据积累到一定量再处理
- **无法实时响应**：业务需要实时决策，批处理做不到
- **架构复杂**：需要额外的流处理框架和集群

### 解决方案

Kafka Streams 提供：

- **实时处理**：数据到达即处理，毫秒级延迟
- **轻量级**：作为库嵌入应用，不需要独立集群
- **Exactly Once**：保证数据精确处理一次
- **状态管理**：支持有状态计算（聚合、窗口等）

> **一句话总结**：Kafka Streams 让实时处理变得简单。

---

## 2 流处理基本概念

### 流 vs 表

```
流（Stream）：
- 无界的数据集
- 每条记录是独立的
- 记录一旦写入不可变
- 示例：订单流、日志流

表（Table）：
- 有界的数据集
- 每条记录有唯一键
- 记录可以被更新
- 示例：用户表、配置表
```

打个比方：

> 流就像河流，水一直在流动；表像湖泊，水可以进出但总量相对稳定。

### 流处理 vs 批处理

| 特性 | 流处理 | 批处理 |
| --- | --- | --- |
| **数据范围** | 无界 | 有界 |
| **处理方式** | 实时处理 | 批量处理 |
| **延迟** | 毫秒级 | 分钟/小时级 |
| **状态** | 有状态 | 无状态 |
| **适用场景** | 实时监控、实时推荐 | 数据分析、报表生成 |

### Kafka Streams vs 其他框架

| 特性 | Kafka Streams | Spark Streaming | Flink |
| --- | --- | --- | --- |
| **部署方式** | 库（嵌入应用） | 独立集群 | 独立集群 |
| **延迟** | 毫秒级 | 秒级 | 毫秒级 |
| **Exactly Once** | 支持 | 支持 | 支持 |
| **状态管理** | 内置 | 需要外部存储 | 内置 |
| **学习曲线** | 低 | 中 | 高 |
| **适用场景** | 轻量级流处理 | 复杂批处理 | 复杂流处理 |

---

## 3 Kafka Streams 架构

### 核心概念

```
┌─────────────────────────────────────────┐
│           Kafka Streams Application      │
│                                          │
│  ┌──────────┐    ┌──────────┐           │
│  │ Stream   │───>│ Stream   │───> ...   │
│  │ Topology │    │ Topology │           │
│  └──────────┘    └──────────┘           │
│                                          │
│  ┌──────────┐    ┌──────────┐           │
│  │ Processor│    │ Processor│           │
│  │  Node 1  │    │  Node 2  │           │
│  └──────────┘    └──────────┘           │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │      State Store (RocksDB)       │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ↓                    ↑
    ┌─────────┐          ┌─────────┐
    │  Input  │          │  Output │
    │  Topic  │          │  Topic  │
    └─────────┘          └─────────┘
```

| 概念 | 说明 |
| --- | --- |
| **Stream** | 无界的数据流 |
| **Topology** | 处理逻辑的拓扑图 |
| **Processor Node** | 处理节点，执行具体逻辑 |
| **State Store** | 状态存储，保存中间结果 |
| **Source Node** | 从 Kafka 读取数据 |
| **Sink Node** | 向 Kafka 写入数据 |

### 处理流程

```
1. Source Node 从 Kafka Topic 读取数据
   ↓
2. 数据流经 Processor Nodes
   ↓
3. Processor Nodes 执行转换、过滤、聚合等操作
   ↓
4. 中间结果保存到 State Store
   ↓
5. 最终结果通过 Sink Node 写入 Kafka Topic
```

---

## 4 DSL API

### KStream

KStream 表示记录流，每条记录是独立的：

```java
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.KStream;
import java.util.Properties;

public class KStreamExample {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("application.id", "kstream-example");
        props.put("bootstrap.servers", "localhost:9092");
        props.put("default.key.serde", "org.apache.kafka.common.serialization.Serdes$StringSerde");
        props.put("default.value.serde", "org.apache.kafka.common.serialization.Serdes$StringSerde");

        StreamsBuilder builder = new StreamsBuilder();
        
        // 创建 KStream
        KStream<String, String> stream = builder.stream("input-topic");
        
        // 过滤
        KStream<String, String> filtered = stream.filter((key, value) -> value != null && value.length() > 0);
        
        // 转换
        KStream<String, Integer> mapped = filtered.mapValues(value -> value.length());
        
        // 写入输出主题
        mapped.to("output-topic");

        KafkaStreams streams = new KafkaStreams(builder.build(), props);
        streams.start();
    }
}
```

### KTable

KTable 表示 changelog 流，每条记录是键值对的更新：

```java
import org.apache.kafka.streams.kstream.KTable;

public class KTableExample {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();
        
        // 创建 KTable
        KTable<String, String> table = builder.table("user-topic");
        
        // 过滤
        KTable<String, String> filtered = table.filter((key, value) -> value != null);
        
        // 转换
        KTable<String, Integer> mapped = filtered.mapValues(value -> value.length());
        
        // 写入输出主题
        mapped.toStream().to("output-topic");
    }
}
```

### KStream vs KTable

| 特性 | KStream | KTable |
| --- | --- | --- |
| **语义** | 记录流 | changelog 流 |
| **记录关系** | 每条记录独立 | 相同 key 的记录会更新 |
| **适用场景** | 事件流处理 | 状态聚合 |
| **示例** | 订单流、日志流 | 用户表、配置表 |

### GlobalKTable

GlobalKTable 是每个实例都有完整副本的 KTable：

```java
import org.apache.kafka.streams.kstream.GlobalKTable;

public class GlobalKTableExample {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();
        
        // 创建 GlobalKTable
        GlobalKTable<String, String> globalTable = builder.globalTable("config-topic");
        
        // 用于 join 操作
        KStream<String, String> stream = builder.stream("input-topic");
        KStream<String, String> joined = stream.join(
            globalTable,
            (key, value) -> key,  // 从 stream 中提取 key
            (streamValue, tableValue) -> streamValue + "-" + tableValue  // 合并逻辑
        );
        
        joined.to("output-topic");
    }
}
```

---

## 5 状态存储

### State Store 类型

| 类型 | 说明 |
| --- | --- |
| **KeyValue Store** | 键值存储，类似 Map |
| **Window Store** | 窗口存储，用于窗口聚合 |
| **Session Store** | 会话存储，用于会话窗口 |

### 使用 State Store

```java
import org.apache.kafka.streams.state.Stores;
import org.apache.kafka.streams.state.KeyValueStore;
import org.apache.kafka.streams.processor.Processor;
import org.apache.kafka.streams.processor.ProcessorContext;

public class StateStoreExample {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();
        
        // 创建 State Store
        builder.addStateStore(
            Stores.keyValueStoreBuilder(
                Stores.persistentKeyValueStore("my-store"),
                Serdes.String(),
                Serdes.String()
            )
        );
        
        // 创建 Processor
        builder.stream("input-topic")
            .process(() -> new Processor<String, String>() {
                private KeyValueStore<String, String> store;
                
                @Override
                public void init(ProcessorContext context) {
                    store = (KeyValueStore<String, String>) context.getStateStore("my-store");
                }
                
                @Override
                public void process(String key, String value) {
                    // 读取状态
                    String oldValue = store.get(key);
                    
                    // 更新状态
                    store.put(key, value);
                    
                    // 发送结果
                    context.forward(key, oldValue + "->" + value);
                }
                
                @Override
                public void close() {}
            }, "my-store");
    }
}
```

### State Store 底层实现

```
State Store 底层使用 RocksDB：

┌─────────────────────────────────────┐
│         State Store API             │
│  (KeyValueStore, WindowStore, ...)  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         RocksDB Store               │
│  (持久化到本地磁盘)                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         Changelog Topic             │
│  (备份到 Kafka，用于故障恢复)        │
└─────────────────────────────────────┘
```

---

## 6 窗口操作

### 窗口类型

| 窗口类型 | 说明 | 适用场景 |
| --- | --- | --- |
| **Tumbling Window** | 滚动窗口，固定大小，无重叠 | 每分钟统计 |
| **Hopping Window** | 跳跃窗口，固定大小，可重叠 | 滑动平均 |
| **Session Window** | 会话窗口，基于活动间隔 | 用户会话分析 |
| **Sliding Window** | 滑动窗口（Join 专用） | 流 Join |

### Tumbling Window

```java
import org.apache.kafka.streams.kstream.TimeWindows;
import org.apache.kafka.streams.kstream.Windowed;

public class TumblingWindowExample {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();
        
        KStream<String, String> stream = builder.stream("input-topic");
        
        // 按 key 分组，5 分钟滚动窗口
        KTable<Windowed<String>, Long> windowedCount = stream
            .groupByKey()
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
            .count();
        
        // 输出结果
        windowedCount.toStream().foreach((windowedKey, count) -> {
            System.out.println("Window: " + windowedKey.window().start() + 
                             ", Key: " + windowedKey.key() + 
                             ", Count: " + count);
        });
    }
}
```

### Hopping Window

```java
import org.apache.kafka.streams.kstream.TimeWindows;

public class HoppingWindowExample {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();
        
        KStream<String, String> stream = builder.stream("input-topic");
        
        // 10 分钟窗口，5 分钟跳跃
        KTable<Windowed<String>, Long> windowedCount = stream
            .groupByKey()
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(10))
                                   .advanceBy(Duration.ofMinutes(5)))
            .count();
        
        windowedCount.toStream().to("output-topic");
    }
}
```

### Session Window

```java
import org.apache.kafka.streams.kstream.SessionWindows;

public class SessionWindowExample {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();
        
        KStream<String, String> stream = builder.stream("input-topic");
        
        // 30 分钟不活动则结束会话
        KTable<Windowed<String>, Long> sessionCount = stream
            .groupByKey()
            .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(30)))
            .count();
        
        sessionCount.toStream().to("output-topic");
    }
}
```

---

## 7 Join 操作

### Stream-Stream Join

```java
public class StreamStreamJoinExample {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();
        
        KStream<String, String> orders = builder.stream("orders-topic");
        KStream<String, String> payments = builder.stream("payments-topic");
        
        // 5 分钟内订单和支付 Join
        KStream<String, String> joined = orders.join(
            payments,
            (order, payment) -> order + "-" + payment,
            JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(5))
        );
        
        joined.to("joined-topic");
    }
}
```

### Stream-Table Join

```java
public class StreamTableJoinExample {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();
        
        KStream<String, String> orders = builder.stream("orders-topic");
        KTable<String, String> users = builder.table("users-topic");
        
        // 订单流 Join 用户表
        KStream<String, String> joined = orders.join(
            users,
            (order, user) -> "Order: " + order + ", User: " + user
        );
        
        joined.to("joined-topic");
    }
}
```

### Table-Table Join

```java
public class TableTableJoinExample {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();
        
        KTable<String, String> users = builder.table("users-topic");
        KTable<String, String> profiles = builder.table("profiles-topic");
        
        // 用户表 Join 档案表
        KTable<String, String> joined = users.join(
            profiles,
            (user, profile) -> user + "-" + profile
        );
        
        joined.toStream().to("joined-topic");
    }
}
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **流处理** | 实时处理无界数据流 |
| **KStream** | 记录流，每条记录独立 |
| **KTable** | changelog 流，相同 key 会更新 |
| **GlobalKTable** | 每个实例都有完整副本 |
| **State Store** | 保存中间状态，底层使用 RocksDB |
| **窗口** | Tumbling、Hopping、Session、Sliding |
| **Join** | Stream-Stream、Stream-Table、Table-Table |

---

## 9 新手常见误区

### 误区 1："Kafka Streams 需要独立集群"

**错！** Kafka Streams 是一个库，嵌入到应用中，不需要独立集群。每个应用实例都是一个流处理节点。

### 误区 2："KStream 和 KTable 是一样的"

**错！** KStream 是记录流，每条记录独立；KTable 是 changelog 流，相同 key 的记录会更新。

### 误区 3："窗口越大越好"

**不是的。** 窗口越大，状态存储占用越多，处理延迟也越高。应该根据业务需求选择合适的窗口大小。

### 误区 4："State Store 不需要备份"

**错！** State Store 通过 changelog topic 备份到 Kafka。如果本地存储丢失，可以从 changelog 恢复。

---

## 10 动手练习

### 练习 1：基础练习

实现一个简单的 WordCount 应用。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.KTable;
import java.util.Arrays;
import java.util.Properties;

public class WordCount {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("application.id", "wordcount");
        props.put("bootstrap.servers", "localhost:9092");
        props.put("default.key.serde", "org.apache.kafka.common.serialization.Serdes$StringSerde");
        props.put("default.value.serde", "org.apache.kafka.common.serialization.Serdes$StringSerde");

        StreamsBuilder builder = new StreamsBuilder();
        
        KStream<String, String> textLines = builder.stream("input-topic");
        
        KTable<String, Long> wordCounts = textLines
            .flatMapValues(value -> Arrays.asList(value.toLowerCase().split("\\W+")))
            .groupBy((key, word) -> word)
            .count();
        
        wordCounts.toStream().to("output-topic");

        KafkaStreams streams = new KafkaStreams(builder.build(), props);
        streams.start();
    }
}
```

</details>

### 练习 2：进阶练习

实现一个滚动窗口聚合，统计每分钟的订单数量。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.KTable;
import org.apache.kafka.streams.kstream.TimeWindows;
import java.time.Duration;
import java.util.Properties;

public class WindowedOrderCount {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("application.id", "windowed-order-count");
        props.put("bootstrap.servers", "localhost:9092");

        StreamsBuilder builder = new StreamsBuilder();
        
        KStream<String, String> orders = builder.stream("orders-topic");
        
        KTable<Windowed<String>, Long> windowedCount = orders
            .groupByKey()
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
            .count();
        
        windowedCount.toStream().foreach((windowedKey, count) -> {
            System.out.println("Window: " + windowedKey.window().start() + 
                             ", Key: " + windowedKey.key() + 
                             ", Count: " + count);
        });

        KafkaStreams streams = new KafkaStreams(builder.build(), props);
        streams.start();
    }
}
```

</details>

### 练习 3（挑战）：综合练习

实现一个 Stream-Table Join，将订单流和用户表关联。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.KTable;
import java.util.Properties;

public class OrderUserJoin {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("application.id", "order-user-join");
        props.put("bootstrap.servers", "localhost:9092");

        StreamsBuilder builder = new StreamsBuilder();
        
        KStream<String, String> orders = builder.stream("orders-topic");
        KTable<String, String> users = builder.table("users-topic");
        
        KStream<String, String> joined = orders.join(
            users,
            (order, user) -> "Order: " + order + ", User: " + user
        );
        
        joined.to("joined-topic");

        KafkaStreams streams = new KafkaStreams(builder.build(), props);
        streams.start();
    }
}
```

</details>

---

## 下一章预告

下一章我们会深入学习 **KRaft 模式原理**——去 ZooKeeper 架构、Raft 共识算法、元数据管理。你会理解 Kafka 的未来架构演进方向。
