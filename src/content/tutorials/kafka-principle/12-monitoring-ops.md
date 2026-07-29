---
title: "第12章：监控与运维"
description: "深入理解 JMX 指标、监控体系、常见运维操作、故障排查"
---

# 第12章：监控与运维

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Kafka 有哪些关键指标需要监控？
- 怎么配置 JMX 监控？
- 常见的运维操作有哪些？
- 出故障了怎么排查？

这一章会深入 Kafka 的监控与运维，搞懂这些能让你在生产环境中稳定运行 Kafka。

---

## 1 为什么需要监控与运维？

### 痛点分析

没有监控时：

- **故障发现晚**：问题发生了才知道
- **排查困难**：不知道从哪个方向入手
- **性能瓶颈**：不知道哪里出了问题
- **容量不足**：磁盘满了才发现

### 解决方案

完善的监控与运维体系：

- **实时监控**：及时发现问题
- **告警机制**：自动通知运维人员
- **故障排查**：快速定位和解决问题
- **容量规划**：提前规划资源

> **一句话总结**：监控是生产环境的眼睛。

---

## 2 JMX 监控

### 什么是 JMX

JMX（Java Management Extensions）是 Java 应用的标准监控和管理框架：

```
Kafka Broker ──→ JMX ──→ JConsole / VisualVM / Prometheus
```

### 启用 JMX

```bash
# 启动 Kafka 时设置 JMX 端口
export JMX_PORT=9999
bin/kafka-server-start.sh config/server.properties

# 或使用环境变量
KAFKA_JMX_OPTS="-Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.port=9999 -Dcom.sun.management.jmxremote.rmi.port=9999 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false"
```

### 使用 JConsole 连接

```bash
# 本地连接
jconsole localhost:9999

# 远程连接
jconsole remote-host:9999
```

### 关键 JMX 指标

| 指标 | 说明 |
| --- | --- |
| **kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec** | 每秒消息数 |
| **kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec** | 每秒写入字节数 |
| **kafka.server:type=BrokerTopicMetrics,name=BytesOutPerSec** | 每秒读取字节数 |
| **kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions** | 未同步副本数 |
| **kafka.server:type=ReplicaManager,name=IsrShrinksPerSec** | ISR 收缩速率 |
| **kafka.controller:type=KafkaController,name=ActiveControllerCount** | Controller 数量 |

---

## 3 监控体系

### 监控工具

| 工具 | 说明 |
| --- | --- |
| **JConsole** | Java 自带，简单实用 |
| **VisualVM** | Java 自带，功能丰富 |
| **Prometheus + Grafana** | 开源监控方案，推荐 |
| **Kafka Manager** | Kafka 官方管理工具 |
| **CMAK** | Kafka 集群管理工具 |

### Prometheus + Grafana 方案

```
Kafka Broker ──→ JMX Exporter ──→ Prometheus ──→ Grafana
```

**配置 JMX Exporter**：

```yaml
# jmx_prometheus_config.yml
hostPort: localhost:9999
rules:
  - pattern: kafka.server<type=BrokerTopicMetrics><name=MessagesInPerSec
    name: kafka_messages_in_per_sec
  - pattern: kafka.server<type=BrokerTopicMetrics><name=BytesInPerSec
    name: kafka_bytes_in_per_sec
  - pattern: kafka.server<type=ReplicaManager><name=UnderReplicatedPartitions
    name: kafka_under_replicated_partitions
```

**启动 Kafka 时加载 Exporter**：

```bash
export KAFKA_OPTS="-javaagent:/path/to/jmx_prometheus_javaagent.jar=7071:/path/to/jmx_prometheus_config.yml"
bin/kafka-server-start.sh config/server.properties
```

### 关键监控指标

| 类别 | 指标 | 告警阈值 |
| --- | --- | --- |
| **性能** | MessagesInPerSec | 根据业务设定 |
| **性能** | BytesInPerSec | 根据带宽设定 |
| **性能** | BytesOutPerSec | 根据带宽设定 |
| **可靠性** | UnderReplicatedPartitions | > 0 |
| **可靠性** | IsrShrinksPerSec | > 0 |
| **可用性** | ActiveControllerCount | != 1 |
| **资源** | 磁盘使用率 | > 80% |
| **资源** | CPU 使用率 | > 80% |
| **资源** | 内存使用率 | > 80% |

---

## 4 常见运维操作

### 创建主题

```bash
bin/kafka-topics.sh --create \
  --topic order-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3 \
  --config retention.ms=604800000
```

### 修改主题配置

```bash
# 修改保留时间
bin/kafka-configs.sh --alter \
  --entity-type topics \
  --entity-name order-topic \
  --bootstrap-server localhost:9092 \
  --add-config retention.ms=86400000

# 查看主题配置
bin/kafka-configs.sh --describe \
  --entity-type topics \
  --entity-name order-topic \
  --bootstrap-server localhost:9092
```

### 增加分区

```bash
bin/kafka-topics.sh --alter \
  --topic order-topic \
  --bootstrap-server localhost:9092 \
  --partitions 6
```

### 删除主题

```bash
bin/kafka-topics.sh --delete \
  --topic old-topic \
  --bootstrap-server localhost:9092
```

### 查看消费者组

```bash
# 列出所有消费者组
bin/kafka-consumer-groups.sh --list --bootstrap-server localhost:9092

# 查看消费者组详情
bin/kafka-consumer-groups.sh --describe --group order-group --bootstrap-server localhost:9092

# 重置偏移量
bin/kafka-consumer-groups.sh --group order-group --topic order-topic --reset-offsets --to-earliest --execute --bootstrap-server localhost:9092
```

### 分区重分配

```bash
# 1. 创建重分配计划
cat > reassign.json << EOF
{
  "version": 1,
  "partitions": [
    {"topic": "order-topic", "partition": 0, "replicas": [1, 2, 3]}
  ]
}
EOF

# 2. 执行重分配
bin/kafka-reassign-partitions.sh \
  --bootstrap-server localhost:9092 \
  --reassignment-json-file reassign.json \
  --execute

# 3. 验证进度
bin/kafka-reassign-partitions.sh \
  --bootstrap-server localhost:9092 \
  --reassignment-json-file reassign.json \
  --verify
```

---

## 5 故障排查

### 常见问题

| 问题 | 可能原因 | 解决方案 |
| --- | --- | --- |
| **消息丢失** | acks=0 或副本因子=1 | 设置 acks=all，副本因子>=3 |
| **消费延迟** | 消费者处理能力不足 | 增加消费者数量或优化处理逻辑 |
| **分区不可用** | Leader 宕机且 ISR 为空 | 检查 Broker 状态，启用 unclean leader election |
| **性能下降** | 磁盘 IO 瓶颈或网络瓶颈 | 检查磁盘和网络，优化配置 |
| **频繁重平衡** | 消费者处理时间过长 | 增加 max.poll.interval.ms |

### 排查步骤

```
1. 检查 Broker 状态
   bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092

2. 检查主题状态
   bin/kafka-topics.sh --describe --topic order-topic --bootstrap-server localhost:9092

3. 检查消费者组状态
   bin/kafka-consumer-groups.sh --describe --group order-group --bootstrap-server localhost:9092

4. 检查日志
   tail -f /var/kafka-logs/server.log

5. 检查 JMX 指标
   jconsole localhost:9999
```

### 日志分析

```bash
# 查看 Broker 日志
tail -f /var/kafka-logs/server.log

# 查看 Controller 日志
tail -f /var/kafka-logs/controller.log

# 查看状态变更日志
tail -f /var/kafka-logs/state-change.log
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **JMX** | Java 标准监控框架 |
| **关键指标** | MessagesInPerSec、UnderReplicatedPartitions 等 |
| **监控工具** | Prometheus + Grafana 推荐 |
| **运维操作** | 创建主题、修改配置、分区重分配等 |
| **故障排查** | 检查 Broker、主题、消费者组状态 |

---

## 7 新手常见误区

### 误区 1："不需要监控，出了问题再看日志"

**错！** 没有监控会导致故障发现晚、排查困难。应该建立完善的监控体系。

### 误区 2："JMX 监控就够了"

**不完全是。** JMX 监控是基础，但生产环境建议使用 Prometheus + Grafana，支持告警和历史数据。

### 误区 3："分区越多越好"

**错！** 分区过多会导致文件句柄增多、元数据变大、重平衡频繁。应该根据实际需求设置。

### 误区 4："消费者延迟高就增加消费者"

**不一定。** 消费者数量不能超过分区数量。如果分区数不够，应该先增加分区。

---

## 8 动手练习

### 练习 1：基础练习

启用 JMX 监控，使用 JConsole 查看 Kafka 指标。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 启用 JMX
export JMX_PORT=9999
bin/kafka-server-start.sh config/server.properties

# 2. 使用 JConsole 连接
jconsole localhost:9999

# 3. 查看 MBeans
# - kafka.server -> BrokerTopicMetrics -> MessagesInPerSec
# - kafka.server -> ReplicaManager -> UnderReplicatedPartitions
```

</details>

### 练习 2：进阶练习

使用命令行工具查看消费者组状态，分析消费延迟。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 列出所有消费者组
bin/kafka-consumer-groups.sh --list --bootstrap-server localhost:9092

# 2. 查看消费者组详情
bin/kafka-consumer-groups.sh --describe --group order-group --bootstrap-server localhost:9092

# 输出示例：
# GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# order-group     order-topic     0          100             150             50
# order-group     order-topic     1          200             250             50
# order-group     order-topic     2          300             350             50

# 3. 分析延迟
# LAG 列表示消费延迟，如果延迟持续增长，需要增加消费者或优化处理逻辑
```

</details>

### 练习 3（挑战）：综合练习

配置 Prometheus + Grafana 监控 Kafka。

<details>
<summary>点击查看答案</summary>

```yaml
# 1. 配置 JMX Exporter（jmx_prometheus_config.yml）
hostPort: localhost:9999
rules:
  - pattern: kafka.server<type=BrokerTopicMetrics><name=MessagesInPerSec
    name: kafka_messages_in_per_sec
  - pattern: kafka.server<type=BrokerTopicMetrics><name=BytesInPerSec
    name: kafka_bytes_in_per_sec
  - pattern: kafka.server<type=ReplicaManager><name=UnderReplicatedPartitions
    name: kafka_under_replicated_partitions

# 2. 启动 Kafka 时加载 Exporter
export KAFKA_OPTS="-javaagent:/path/to/jmx_prometheus_javaagent.jar=7071:/path/to/jmx_prometheus_config.yml"
bin/kafka-server-start.sh config/server.properties

# 3. 配置 Prometheus（prometheus.yml）
scrape_configs:
  - job_name: 'kafka'
    static_configs:
      - targets: ['localhost:7071']

# 4. 启动 Prometheus
prometheus --config.file=prometheus.yml

# 5. 配置 Grafana
# - 添加 Prometheus 数据源
# - 导入 Kafka Dashboard（Dashboard ID: 7218）
```

</details>

---

## 下一章预告

下一章我们会深入学习 **Kafka Connect 原理**——Connector 架构、Source/Sink、分布式模式。你会理解如何使用 Kafka Connect 集成外部系统。
