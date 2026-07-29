---
title: "第2章：消息存储机制详解"
description: "深入理解 Log Segment、索引文件、消息格式、清理策略"
---

# 第2章：消息存储机制详解

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Kafka 的消息是怎么存储在磁盘上的？
- 为什么 Kafka 写磁盘还这么快？
- 消息格式长什么样？有哪些版本？
- 消息太多了怎么办？会不会把磁盘撑爆？

这一章会深入 Kafka 的存储机制，搞懂这些能让你理解 Kafka 高性能的底层原因。

---

## 1 为什么需要深入了解存储机制？

### 痛点分析

很多人以为"写磁盘就是慢的"，但 Kafka 打破了这个认知：

- 单机每秒写入 **数百 MB 到数 GB** 的数据
- 顺序写磁盘的速度甚至超过**随机写内存**
- 磁盘存储的消息可以保留**数天甚至数月**

不理解存储机制，你就无法理解 Kafka 为什么这么快。

### 解决方案

理解存储机制后，你会明白：

- 顺序写 vs 随机写的巨大差异
- 索引文件如何加速消息查找
- 消息格式如何演进以减少存储开销
- 清理策略如何管理磁盘空间

> **一句话总结**：存储机制是 Kafka 高性能的核心秘密。

---

## 2 存储结构总览

### 目录结构

每个 Broker 上的消息按如下结构存储：

```
/var/kafka-logs/                      # 日志根目录
├── order-topic-0/                    # 主题 order-topic 的分区 0
│   ├── 00000000000000000000.log      # 日志段文件（存储消息）
│   ├── 00000000000000000000.index    # 偏移量索引文件
│   ├── 00000000000000000000.timeindex # 时间戳索引文件
│   ├── 00000000000000368769.log      # 第二个日志段
│   ├── 00000000000000368769.index
│   └── 00000000000000368769.timeindex
├── order-topic-1/                    # 主题 order-topic 的分区 1
│   └── ...
└── order-topic-2/                    # 主题 order-topic 的分区 2
    └── ...
```

打个比方：

> 就像一个图书馆：每个主题是一个书架（Partition），每个日志段是书架上的一层，索引文件就是目录卡片，帮你快速找到书在哪里。

---

## 3 Log Segment（日志段）

### 什么是日志段

每个 Partition 被分成多个 **Log Segment**（日志段），每个 Segment 包含：

| 文件 | 作用 |
| --- | --- |
| `.log` | 存储实际的消息数据 |
| `.index` | 偏移量索引，记录 offset → 物理位置的映射 |
| `.timeindex` | 时间戳索引，记录 timestamp → 物理位置的映射 |

### 文件命名规则

文件名是 **20 位数字**，表示该段的起始偏移量：

```
00000000000000000000.log    # 起始 offset = 0
00000000000000368769.log    # 起始 offset = 368769
00000000000000737538.log    # 起始 offset = 737538
```

### Segment 大小配置

```properties
# server.properties

# 每个日志段的最大大小（默认 1GB）
log.segment.bytes=1073741824

# 日志段滚动时间（默认 7 天，0 表示不按时间滚动）
log.roll.hours=168
```

当 `.log` 文件达到 `log.segment.bytes` 时，会创建新的 Segment：

```
Segment 0: offset 0 ~ 368768    (00000000000000000000.log)
Segment 1: offset 368769 ~ 737537 (00000000000000368769.log)
Segment 2: offset 737538 ~ ...    (00000000000000737538.log)
```

---

## 4 索引文件详解

### 偏移量索引（.index）

偏移量索引使用**稀疏索引**，记录 offset 到物理位置的映射：

```
稀疏索引（不是每条消息都有记录）：

offset:   0      100     200     300
          ↓       ↓       ↓       ↓
position: 0      32KB    64KB    96KB
```

**为什么用稀疏索引？**

- 稠密索引（每条消息一条记录）：查找快，但索引文件太大
- 稀疏索引（每隔一段记录一次）：查找稍慢，但索引文件小，可以缓存在内存

**查找消息的过程**：

```
1. 根据 offset 确定在哪个 Segment
   例如：查找 offset=368800
   → 在 Segment 1（368769 ~ 737537）

2. 在 .index 文件中二分查找，找到最近的稀疏索引
   例如：找到 offset=368800 对应的物理位置约在 12KB

3. 从 12KB 位置开始顺序扫描 .log 文件
   找到 offset=368800 的消息
```

### 时间戳索引（.timeindex）

时间戳索引记录 timestamp 到 offset 的映射：

```
timestamp:  1609459200000  1609459260000  1609459320000
            ↓               ↓               ↓
offset:     0               500             1000
```

**用途**：按时间查找消息（如"查找 1 小时前的消息"）

### 索引映射关系图

```
查找 offset = 368800 的消息：

Step 1: 确定 Segment
┌─────────────────────────────────────────┐
│ Segment 0: 0 ~ 368768                   │
│ Segment 1: 368769 ~ 737537  ← 在这里    │
│ Segment 2: 737538 ~ ...                 │
└─────────────────────────────────────────┘

Step 2: 在 .index 中查找
┌─────────────────────────────────────────┐
│ 368769 → 0                              │
│ 368800 → 12288  ← 找到最近的           │
│ 368900 → 45056                          │
└─────────────────────────────────────────┘

Step 3: 在 .log 中从 12288 位置顺序扫描
┌─────────────────────────────────────────┐
│ 12288: offset=368799, msg=...           │
│ 12320: offset=368800, msg=目标消息 ✓    │
│ 12352: offset=368801, msg=...           │
└─────────────────────────────────────────┘
```

---

## 5 消息格式

### 消息格式演进

Kafka 的消息格式经历了多个版本：

| 版本 | 引入时间 | 特点 |
| --- | --- | --- |
| **v0** | Kafka 0.x | 初始版本，每条消息独立存储 |
| **v1** | Kafka 0.10 | 增加了时间戳字段 |
| **v2** | Kafka 0.11 | 支持批量消息和压缩，大幅减少存储开销 |

### v2 消息格式结构

```
┌──────────────────────────────────────────────┐
│              RecordBatch Header               │
├──────────────────────────────────────────────┤
│ baseOffset (8 bytes)       基础偏移量         │
│ batchLength (4 bytes)      批次长度           │
│ partitionLeaderEpoch (4)   Leader 纪元        │
│ magic (1 byte)             版本号（v2=2）     │
│ crc (4 bytes)              CRC 校验           │
│ attributes (2 bytes)       属性（压缩方式等）  │
│ lastOffsetDelta (4 bytes)  最后偏移量增量      │
│ baseTimestamp (8 bytes)    基础时间戳          │
│ maxTimestamp (8 bytes)     最大时间戳          │
│ producerId (8 bytes)       生产者 ID（幂等）   │
│ producerEpoch (2 bytes)    生产者纪元          │
│ baseSequence (4 bytes)     基础序列号          │
│ recordsCount (4 bytes)     消息数量            │
├──────────────────────────────────────────────┤
│              Record 1                         │
│ length (varint)            记录长度            │
│ attributes (varint)        属性               │
│ timestampDelta (varint)    时间戳增量          │
│ offsetDelta (varint)       偏移量增量          │
│ key (varint + bytes)       键                 │
│ value (varint + bytes)     值                 │
│ headers (varint + ...)     消息头              │
├──────────────────────────────────────────────┤
│              Record 2                         │
│ ...                                          │
└──────────────────────────────────────────────┘
```

**v2 的核心改进**：

- **批量存储**：多条消息打包成一个 RecordBatch，减少网络往返
- **批量压缩**：整个批次一起压缩，压缩率更高
- **增量字段**：offset、timestamp 使用增量编码，减少存储空间

### 消息大小对比

| 场景 | v0/v1 格式 | v2 格式 |
| --- | --- | --- |
| 100 条消息，无压缩 | ~10 KB | ~8 KB |
| 100 条消息，gzip 压缩 | ~5 KB（每条独立压缩） | ~2 KB（批量压缩） |
| 10000 条消息，lz4 压缩 | ~200 KB | ~50 KB |

---

## 6 消息写入流程

### 写入过程

```
Producer 发送消息
    ↓
Broker 接收消息
    ↓
追加写入 .log 文件（顺序写）
    ↓
更新 .index 索引（稀疏索引）
    ↓
更新 .timeindex 索引
    ↓
返回 ACK 给 Producer
```

### 顺序写入

Kafka 采用**追加写入**（Append-Only），这是高性能的关键：

```
顺序写入（Kafka 的方式）：
磁盘头 ← msg1 ← msg2 ← msg3 ← msg4 ← ...
每次写入都在文件末尾，磁盘磁头不需要移动

随机写入（传统数据库的方式）：
磁盘 ← msg1 在位置 A
     ← msg2 在位置 Z
     ← msg3 在位置 M
     每次写入磁头都要移动，非常慢
```

**性能对比**：

| 写入方式 | 吞吐量 |
| --- | --- |
| 随机写入磁盘 | ~100 KB/s |
| 随机写入内存 | ~100,000 ops/s |
| 顺序写入磁盘 | ~600 MB/s |
| 顺序写入内存 | ~1,000,000 ops/s |

> 顺序写磁盘的速度是随机写磁盘的 **6000 倍**，甚至接近随机写内存的速度。

### 页缓存（Page Cache）

Kafka 不自己管理内存，而是依赖操作系统的页缓存：

```
应用层                    内核层
┌─────────┐            ┌──────────┐
│ Producer │ ──write──> │ Page     │ ──异步刷盘──> 磁盘
│          │            │ Cache    │
└─────────┘            └──────────┘

写入流程：
1. Producer 调用 write()，数据写入 Page Cache
2. 操作系统异步将 Page Cache 刷到磁盘（后台线程）
3. 即使不刷盘，读取时也能从 Page Cache 命中

好处：
- 写入不需要等待磁盘 IO
- 读取时大部分数据在内存中
- 进程崩溃后，Page Cache 由 OS 管理，不会丢失
```

---

## 7 消息读取流程

### 读取过程

```
Consumer 请求消息（指定 offset）
    ↓
在 .index 中查找 offset 对应的物理位置
    ↓
在 .log 文件中读取消息
    ↓
返回给 Consumer
```

### 零拷贝（Zero Copy）

传统方式读取文件需要 4 次上下文切换和 2 次数据拷贝：

```
传统 I/O（4 次拷贝，4 次上下文切换）：

磁盘 → 内核缓冲区 → 用户缓冲区 → Socket 缓冲区 → 网卡
 ①          ②            ③             ④

零拷贝（2 次拷贝，2 次上下文切换）：

磁盘 → 内核缓冲区 ──────────────→ 网卡
 ①          ②
          （跳过用户空间）
```

Kafka 使用 `sendfile()` 系统调用实现零拷贝：

```java
// 传统方式
FileInputStream fis = new FileInputStream(file);
byte[] buffer = new byte[1024];
fis.read(buffer);           // 磁盘 → 内核 → 用户
socket.write(buffer);       // 用户 → 内核 → 网卡

// 零拷贝方式
FileChannel channel = new FileInputStream(file).getChannel();
SocketChannel socket = SocketChannel.open();
channel.transferTo(0, size, socket);  // 磁盘 → 内核 → 网卡（直接）
```

---

## 8 日志清理策略

### 日志删除（Delete）

默认策略：按时间或大小删除旧消息。

```properties
# 按时间删除（默认 7 天）
log.retention.hours=168

# 按大小删除（默认无限制）
log.retention.bytes=-1

# 检查间隔（默认 5 分钟）
log.retention.check.interval.ms=300000
```

**删除过程**：

```
Segment 0: offset 0 ~ 368768    (已过期，删除)
Segment 1: offset 368769 ~ ...  (未过期，保留)
Segment 2: offset 737538 ~ ...  (未过期，保留)

删除时：
1. 将 Segment 0 的 .log 文件标记为删除
2. 等待一段时间（默认 60 秒），确保没有消费者还在读取
3. 物理删除文件
```

### 日志压缩（Compaction）

对于需要保留每个 key 最新值的场景（如配置变更）：

```
压缩前：
offset=0: key=user-001, value=张三
offset=1: key=user-002, value=李四
offset=2: key=user-001, value=张三丰  （更新了）
offset=3: key=user-003, value=王五
offset=4: key=user-001, value=张三风  （又更新了）

压缩后（保留每个 key 的最新值）：
offset=1: key=user-002, value=李四
offset=3: key=user-003, value=王五
offset=4: key=user-001, value=张三风  （最新值）
```

**配置**：

```bash
# 创建主题时指定压缩策略
bin/kafka-topics.sh --create \
  --topic config-topic \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1 \
  --config cleanup.policy=compact
```

### 清理策略对比

| 策略 | 说明 | 适用场景 |
| --- | --- | --- |
| **delete** | 按时间/大小删除旧消息 | 日志收集、事件流 |
| **compact** | 保留每个 key 的最新值 | 配置管理、状态存储 |
| **delete+compact** | 两者结合 | 既需要历史数据，又需要最新状态 |

---

## 9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Log Segment** | 分区由多个日志段组成，每个段包含 .log、.index、.timeindex |
| **稀疏索引** | 不是每条消息都有索引记录，平衡查找速度和存储空间 |
| **顺序写入** | 追加写入，性能是随机写的 6000 倍 |
| **页缓存** | 依赖 OS 的 Page Cache，写入不等待磁盘 IO |
| **零拷贝** | sendfile() 系统调用，跳过用户空间，减少数据拷贝 |
| **消息格式 v2** | 批量存储和压缩，大幅减少存储开销 |
| **日志删除** | 按时间或大小清理过期消息 |
| **日志压缩** | 保留每个 key 的最新值 |

---

## 10 新手常见误区

### 误区 1："Kafka 的消息存在内存里，所以快"

**错！** Kafka 的消息是持久化到磁盘的。快是因为**顺序写入**和**零拷贝**，不是因为存在内存里。

### 误区 2："Kafka 自己管理内存缓存"

**错！** Kafka 使用操作系统的**页缓存（Page Cache）**，而不是自己管理。这样做的好处是：进程重启后缓存不丢失，且不需要自己实现复杂的缓存淘汰算法。

### 误区 3："日志压缩会删除所有旧消息"

**不是的。** 日志压缩只保留每个 key 的**最新值**。如果某个 key 被删除（发送 tombstone 消息），压缩后该 key 的所有记录才会被删除。

### 误区 4："索引文件记录了每条消息的位置"

**错！** 索引文件是**稀疏索引**，只记录部分消息的位置。查找时需要先通过索引定位到大致位置，再顺序扫描找到精确位置。

---

## 11 动手练习

### 练习 1：基础练习

查看 Kafka 日志目录结构，理解 Log Segment 的组织方式。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 查看日志目录
ls -la /var/kafka-logs/

# 2. 查看某个主题的分区目录
ls -la /var/kafka-logs/order-topic-0/

# 输出示例：
# 00000000000000000000.log
# 00000000000000000000.index
# 00000000000000000000.timeindex
# 00000000000000368769.log
# 00000000000000368769.index
# 00000000000000368769.timeindex

# 3. 查看日志段大小
du -sh /var/kafka-logs/order-topic-0/*.log

# 4. 查看日志段的消息数量
bin/kafka-run-class.sh kafka.tools.DumpLogSegments \
  --files /var/kafka-logs/order-topic-0/00000000000000000000.log \
  --print-data-log | head -20
```

</details>

### 练习 2：进阶练习

创建一个使用日志压缩策略的主题，验证压缩效果。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建使用 compact 策略的主题
bin/kafka-topics.sh --create \
  --topic config-topic \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1 \
  --config cleanup.policy=compact

# 2. 发送多条相同 key 的消息
bin/kafka-console-producer.sh \
  --topic config-topic \
  --bootstrap-server localhost:9092 \
  --property parse.key=true \
  --property key.separator=:

# 输入：
# user-001:张三
# user-002:李四
# user-001:张三丰
# user-001:张三风

# 3. 消费所有消息（查看压缩前）
bin/kafka-console-consumer.sh \
  --topic config-topic \
  --from-beginning \
  --bootstrap-server localhost:9092 \
  --property print.key=true

# 输出：
# user-001  张三
# user-002  李四
# user-001  张三丰
# user-001  张三风

# 4. 等待日志压缩执行（可配置 min.cleanable.dirty.ratio 触发）
# 压缩后消费，只会看到每个 key 的最新值
```

</details>

### 练习 3（挑战）：综合练习

编写 Java 代码，通过时间戳索引查找指定时间之后的消息。

<details>
<summary>点击查看答案</summary>

```java
import org.apache.kafka.clients.consumer.*;
import org.apache.kafka.common.TopicPartition;
import java.time.Duration;
import java.util.*;

public class TimestampSearch {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("group.id", "timestamp-search-group");
        props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");

        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);

        // 订阅主题
        consumer.subscribe(Arrays.asList("order-topic"));

        // 先 poll 一次，获取分区分配
        consumer.poll(Duration.ofMillis(0));
        Set<TopicPartition> partitions = consumer.assignment();

        // 指定时间戳（例如：查找 1 小时后的消息）
        long targetTimestamp = System.currentTimeMillis() - 3600 * 1000;

        // 构建时间戳查询 Map
        Map<TopicPartition, Long> timestampMap = new HashMap<>();
        for (TopicPartition partition : partitions) {
            timestampMap.put(partition, targetTimestamp);
        }

        // 根据时间戳查找对应的 offset
        Map<TopicPartition, OffsetAndTimestamp> offsets = consumer.offsetsForTimes(timestampMap);

        // 跳转到对应位置
        for (Map.Entry<TopicPartition, OffsetAndTimestamp> entry : offsets.entrySet()) {
            if (entry.getValue() != null) {
                consumer.seek(entry.getKey(), entry.getValue().offset());
            }
        }

        // 消费消息
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
            for (ConsumerRecord<String, String> record : records) {
                System.out.printf("时间=%d, 分区=%d, 偏移量=%d, key=%s, value=%s%n",
                    record.timestamp(), record.partition(), record.offset(),
                    record.key(), record.value());
            }
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会深入学习 **Kafka 的生产者原理**——发送流程、拦截器、序列化、分区器、批处理机制。你会理解消息从 Producer 到 Broker 的完整链路。
