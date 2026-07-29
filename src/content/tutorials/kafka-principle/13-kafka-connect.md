---
title: "第13章：Kafka Connect 原理"
description: "深入理解 Connector 架构、Source/Sink、分布式模式"
---

# 第13章：Kafka Connect 原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Kafka Connect 是什么？和 Kafka 有什么关系？
- Source Connector 和 Sink Connector 有什么区别？
- 怎么把数据库的数据同步到 Kafka？
- 怎么把 Kafka 的数据导出到 Elasticsearch？

这一章会深入 Kafka Connect 的架构和原理，搞懂这些能让你轻松集成外部系统。

---

## 1 为什么需要 Kafka Connect？

### 痛点分析

没有 Kafka Connect 时，集成外部系统需要：

- **手写代码**：每个系统都要写生产者/消费者代码
- **重复造轮子**：相似的功能反复实现
- **维护成本高**：代码质量参差不齐，难以维护
- **扩展困难**：新增系统需要重新开发

### 解决方案

Kafka Connect 提供：

- **标准化框架**：统一的 Connector 接口
- **开箱即用**：官方和社区提供大量 Connector
- **无需编码**：通过配置文件即可使用
- **高可用**：支持分布式部署，自动故障转移

> **一句话总结**：Kafka Connect 是数据集成的瑞士军刀。

---

## 2 Kafka Connect 架构

### 核心组件

```
┌─────────────────────────────────────────────────────┐
│                  Kafka Connect Cluster                │
│                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │ Worker 1 │    │ Worker 2 │    │ Worker 3 │       │
│  │          │    │          │    │          │       │
│  │ Connector│    │ Connector│    │ Connector│       │
│  │   Task   │    │   Task   │    │   Task   │       │
│  └──────────┘    └──────────┘    └──────────┘       │
│                                                       │
└─────────────────────────────────────────────────────┘
                         ↓
              ┌──────────────────┐
              │   Kafka Broker   │
              └──────────────────┘
```

| 组件 | 作用 | 类比 |
| --- | --- | --- |
| **Worker** | 运行 Connector 和 Task 的进程 | 工人 |
| **Connector** | 定义数据集成逻辑 | 工作说明书 |
| **Task** | 实际执行数据读写的单元 | 具体干活的人 |
| **Converter** | 数据格式转换（JSON、Avro 等） | 翻译官 |
| **Transformer** | 数据转换和过滤 | 质检员 |

### 工作流程

```
Source 场景：
外部系统 → Source Connector → Source Task → Kafka Topic

Sink 场景：
Kafka Topic → Sink Task → Sink Connector → 外部系统
```

打个比方：

> 就像物流公司：Connector 是物流方案（从哪里到哪里），Task 是快递员（实际搬运货物），Worker 是物流站点（管理快递员），Converter 是包装员（转换货物格式）。

---

## 3 Source Connector

### 什么是 Source Connector

Source Connector 从外部系统读取数据，写入 Kafka：

```
数据库 → JDBC Source Connector → Kafka Topic
文件 → File Source Connector → Kafka Topic
消息队列 → MQ Source Connector → Kafka Topic
```

### 常用 Source Connector

| Connector | 数据源 | 说明 |
| --- | --- | --- |
| **JDBC Source** | 数据库 | 从数据库表读取数据 |
| **File Source** | 文件 | 从文件读取数据 |
| **MongoDB Source** | MongoDB | 从 MongoDB 读取数据 |
| **Elasticsearch Source** | Elasticsearch | 从 ES 读取数据 |
| **S3 Source** | AWS S3 | 从 S3 读取数据 |

### JDBC Source Connector 配置

```json
{
  "name": "jdbc-source-mysql",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
    "tasks.max": "1",
    "connection.url": "jdbc:mysql://localhost:3306/mydb?user=root&password=123456",
    "table.whitelist": "users,orders",
    "mode": "incrementing",
    "incrementing.column.name": "id",
    "topic.prefix": "mysql-",
    "poll.interval.ms": "5000"
  }
}
```

**配置说明**：

| 配置 | 说明 |
| --- | --- |
| **connector.class** | Connector 类名 |
| **tasks.max** | 最大 Task 数量 |
| **connection.url** | 数据库连接 URL |
| **table.whitelist** | 要同步的表 |
| **mode** | 同步模式（incrementing、timestamp、bulk） |
| **topic.prefix** | 主题前缀 |
| **poll.interval.ms** | 轮询间隔 |

### File Source Connector 配置

```json
{
  "name": "file-source",
  "config": {
    "connector.class": "org.apache.kafka.connect.file.FileStreamSourceConnector",
    "tasks.max": "1",
    "file": "/tmp/test.txt",
    "topic": "file-topic"
  }
}
```

---

## 4 Sink Connector

### 什么是 Sink Connector

Sink Connector 从 Kafka 读取数据，写入外部系统：

```
Kafka Topic → JDBC Sink Connector → 数据库
Kafka Topic → File Sink Connector → 文件
Kafka Topic → Elasticsearch Sink Connector → Elasticsearch
Kafka Topic → HDFS Sink Connector → HDFS
```

### 常用 Sink Connector

| Connector | 目标系统 | 说明 |
| --- | --- | --- |
| **JDBC Sink** | 数据库 | 写入数据库表 |
| **File Sink** | 文件 | 写入文件 |
| **Elasticsearch Sink** | Elasticsearch | 写入 ES 索引 |
| **HDFS Sink** | HDFS | 写入 HDFS |
| **S3 Sink** | AWS S3 | 写入 S3 |

### JDBC Sink Connector 配置

```json
{
  "name": "jdbc-sink-mysql",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
    "tasks.max": "1",
    "topics": "mysql-users",
    "connection.url": "jdbc:mysql://localhost:3306/targetdb?user=root&password=123456",
    "auto.create": "true",
    "auto.evolve": "true",
    "insert.mode": "upsert",
    "pk.fields": "id",
    "pk.mode": "record_key"
  }
}
```

**配置说明**：

| 配置 | 说明 |
| --- | --- |
| **topics** | 要消费的主题 |
| **auto.create** | 自动创建表 |
| **auto.evolve** | 自动更新表结构 |
| **insert.mode** | 插入模式（insert、upsert） |
| **pk.fields** | 主键字段 |
| **pk.mode** | 主键模式 |

### Elasticsearch Sink Connector 配置

```json
{
  "name": "elasticsearch-sink",
  "config": {
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "tasks.max": "1",
    "topics": "user-topic",
    "connection.url": "http://localhost:9200",
    "type.name": "user",
    "key.ignore": "false",
    "schema.ignore": "true",
    "behavior.on.null.values": "delete"
  }
}
```

---

## 5 部署模式

### 独立模式（Standalone）

```
┌─────────────────┐
│  Connect Worker │
│                 │
│  Connector 1    │
│  Connector 2    │
└─────────────────┘
```

**特点**：

- 单进程运行
- 配置存储在本地文件
- 适合开发和测试
- 不支持高可用

**启动命令**：

```bash
bin/connect-standalone.sh config/connect-standalone.properties connector1.properties connector2.properties
```

### 分布式模式（Distributed）

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Worker 1 │  │ Worker 2 │  │ Worker 3 │
└──────────┘  └──────────┘  └──────────┘
     ↓             ↓             ↓
┌─────────────────────────────────────────┐
│         Kafka Connect Cluster           │
│   (配置存储在 Kafka 内部主题)            │
└─────────────────────────────────────────┘
```

**特点**：

- 多进程运行，组成集群
- 配置存储在 Kafka 内部主题
- 支持高可用和负载均衡
- 适合生产环境

**启动命令**：

```bash
bin/connect-distributed.sh config/connect-distributed.properties
```

### 模式对比

| 特性 | 独立模式 | 分布式模式 |
| --- | --- | --- |
| **部署复杂度** | 简单 | 复杂 |
| **高可用** | 不支持 | 支持 |
| **负载均衡** | 不支持 | 支持 |
| **配置存储** | 本地文件 | Kafka 内部主题 |
| **REST API** | 基础 | 完整 |
| **适用场景** | 开发测试 | 生产环境 |

---

## 6 REST API

### 常用 API

```bash
# 查看 Connect Worker 信息
curl http://localhost:8083/

# 列出所有 Connector
curl http://localhost:8083/connectors

# 创建 Connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "file-source",
    "config": {
      "connector.class": "org.apache.kafka.connect.file.FileStreamSourceConnector",
      "tasks.max": "1",
      "file": "/tmp/test.txt",
      "topic": "file-topic"
    }
  }'

# 查看 Connector 状态
curl http://localhost:8083/connectors/file-source/status

# 暂停 Connector
curl -X PUT http://localhost:8083/connectors/file-source/pause

# 恢复 Connector
curl -X PUT http://localhost:8083/connectors/file-source/resume

# 删除 Connector
curl -X DELETE http://localhost:8083/connectors/file-source
```

### Connector 状态

| 状态 | 说明 |
| --- | --- |
| **UNASSIGNED** | 未分配 |
| **RUNNING** | 运行中 |
| **PAUSED** | 已暂停 |
| **FAILED** | 失败 |
| **DESTROYED** | 已销毁 |

---

## 7 数据转换

### Converter

Converter 负责数据格式转换：

| Converter | 格式 | 说明 |
| --- | --- | --- |
| **JsonConverter** | JSON | 可读性好，但体积大 |
| **AvroConverter** | Avro | 二进制格式，体积小，需要 Schema Registry |
| **ProtobufConverter** | Protobuf | 二进制格式，性能好 |
| **StringConverter** | String | 字符串格式 |

**配置示例**：

```properties
# connect-distributed.properties

# Key Converter
key.converter=org.apache.kafka.connect.json.JsonConverter
key.converter.schemas.enable=false

# Value Converter
value.converter=org.apache.kafka.connect.json.JsonConverter
value.converter.schemas.enable=false
```

### Single Message Transform (SMT)

SMT 可以对每条消息进行转换：

```json
{
  "name": "file-source",
  "config": {
    "connector.class": "org.apache.kafka.connect.file.FileStreamSourceConnector",
    "tasks.max": "1",
    "file": "/tmp/test.txt",
    "topic": "file-topic",
    
    "transforms": "AddPrefix,InsertField",
    "transforms.AddPrefix.type": "org.apache.kafka.connect.transforms.RegexRouter",
    "transforms.AddPrefix.regex": "(.*)",
    "transforms.AddPrefix.replacement": "prefix_$1",
    
    "transforms.InsertField.type": "org.apache.kafka.connect.transforms.InsertField$Value",
    "transforms.InsertField.static.field": "source",
    "transforms.InsertField.static.value": "file-source"
  }
}
```

**常用 SMT**：

| SMT | 作用 |
| --- | --- |
| **InsertField** | 插入字段 |
| **ReplaceField** | 替换字段 |
| **MaskField** | 掩码字段 |
| **RegexRouter** | 正则路由 |
| **TimestampRouter** | 时间戳路由 |
| **HoistField** | 提升字段 |
| **Flatten** | 扁平化 |

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Worker** | 运行 Connector 和 Task 的进程 |
| **Connector** | 定义数据集成逻辑 |
| **Task** | 实际执行数据读写 |
| **Source Connector** | 从外部系统读取数据到 Kafka |
| **Sink Connector** | 从 Kafka 写入数据到外部系统 |
| **独立模式** | 单进程，适合开发测试 |
| **分布式模式** | 多进程集群，适合生产环境 |
| **REST API** | 管理 Connector 的接口 |
| **Converter** | 数据格式转换 |
| **SMT** | 单条消息转换 |

---

## 9 新手常见误区

### 误区 1："Kafka Connect 和 Kafka Streams 是一样的"

**错！** Kafka Connect 用于数据集成（连接外部系统），Kafka Streams 用于流处理（实时计算）。两者用途不同。

### 误区 2："独立模式可以用于生产环境"

**不推荐。** 独立模式不支持高可用和负载均衡，生产环境应该使用分布式模式。

### 误区 3："tasks.max 越大越好"

**错！** tasks.max 应该根据数据源/目标的并发能力设置。过多的 Task 会增加系统负担。

### 误区 4："不需要 Converter，直接用字节数组"

**不推荐。** 使用 Converter 可以保证数据格式统一，便于不同系统间的数据交换。推荐使用 JSON 或 Avro。

---

## 10 动手练习

### 练习 1：基础练习

使用 File Source Connector 从文件读取数据到 Kafka。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建测试文件
echo "Hello Kafka Connect" > /tmp/test.txt
echo "Line 2" >> /tmp/test.txt
echo "Line 3" >> /tmp/test.txt

# 2. 创建 Connector 配置（file-source.properties）
cat > file-source.properties << EOF
name=file-source
connector.class=org.apache.kafka.connect.file.FileStreamSourceConnector
tasks.max=1
file=/tmp/test.txt
topic=file-topic
EOF

# 3. 启动 Connect（独立模式）
bin/connect-standalone.sh config/connect-standalone.properties file-source.properties

# 4. 消费消息
bin/kafka-console-consumer.sh --topic file-topic --from-beginning --bootstrap-server localhost:9092
```

</details>

### 练习 2：进阶练习

使用分布式模式部署 Kafka Connect，通过 REST API 管理 Connector。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 启动分布式 Connect
bin/connect-distributed.sh config/connect-distributed.properties

# 2. 创建 Connector（使用 REST API）
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "file-source",
    "config": {
      "connector.class": "org.apache.kafka.connect.file.FileStreamSourceConnector",
      "tasks.max": "1",
      "file": "/tmp/test.txt",
      "topic": "file-topic"
    }
  }'

# 3. 查看 Connector 状态
curl http://localhost:8083/connectors/file-source/status

# 4. 暂停 Connector
curl -X PUT http://localhost:8083/connectors/file-source/pause

# 5. 恢复 Connector
curl -X PUT http://localhost:8083/connectors/file-source/resume

# 6. 删除 Connector
curl -X DELETE http://localhost:8083/connectors/file-source
```

</details>

### 练习 3（挑战）：综合练习

配置 JDBC Source Connector，将 MySQL 数据库的表同步到 Kafka。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 下载 JDBC Connector 插件
# https://www.confluent.io/hub/confluentinc/kafka-connect-jdbc

# 2. 解压到 Connect 的 plugin.path 目录

# 3. 创建 Connector 配置（jdbc-source.json）
cat > jdbc-source.json << EOF
{
  "name": "jdbc-source-mysql",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
    "tasks.max": "1",
    "connection.url": "jdbc:mysql://localhost:3306/mydb?user=root&password=123456",
    "table.whitelist": "users",
    "mode": "incrementing",
    "incrementing.column.name": "id",
    "topic.prefix": "mysql-",
    "poll.interval.ms": "5000"
  }
}
EOF

# 4. 创建 Connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @jdbc-source.json

# 5. 查看状态
curl http://localhost:8083/connectors/jdbc-source-mysql/status

# 6. 消费消息
bin/kafka-console-consumer.sh --topic mysql-users --from-beginning --bootstrap-server localhost:9092
```

</details>

---

## 下一章预告

下一章我们会深入学习 **Kafka Streams 流处理**——流处理概念、DSL API、状态存储、窗口操作。你会理解如何使用 Kafka Streams 进行实时数据处理。
