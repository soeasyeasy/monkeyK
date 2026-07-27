---
title: "第7章：Redis 主从复制"
description: "主从架构原理、配置方法、复制流程、故障转移"
---

# 第7章：Redis 主从复制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是主从复制？为什么需要它？
- 主从复制的原理是什么？
- 如何配置主从复制？
- 主从复制有哪些注意事项？
- 主节点挂了怎么办？

这一章会详细讲解 Redis 主从复制的原理和配置，帮你掌握如何构建高可用的 Redis 架构。

---

## 1 为什么需要主从复制？

### 痛点分析

单个 Redis 节点面临这些问题：

- **单点故障**：主节点宕机，整个服务不可用
- **读写压力**：所有读写请求都打到同一个节点，性能瓶颈
- **数据备份**：无法在不影响服务的情况下备份数据

### 解决方案

主从复制（Master-Slave Replication）将数据从一个主节点复制到一个或多个从节点。

| 优势 | 说明 |
| --- | --- |
| **读写分离** | 主节点负责写，从节点负责读 |
| **数据备份** | 从节点可以作为数据备份 |
| **高可用基础** | 为哨兵模式和集群提供基础 |

---

## 2 主从复制原理

### 核心概念

- **主节点（Master）**：负责处理写操作，将数据变更同步到从节点
- **从节点（Slave）**：负责处理读操作，保持与主节点数据一致

### 复制流程

```
1. 从节点连接主节点
2. 发送 PSYNC 命令请求同步
3. 主节点执行 BGSAVE 生成 RDB 快照
4. 主节点将 RDB 文件发送给从节点
5. 从节点加载 RDB 文件到内存
6. 主节点将期间的写命令发送给从节点
7. 从节点执行这些命令，完成同步
```

### 全量复制 vs 增量复制

| 类型 | 触发条件 | 说明 |
| --- | --- | --- |
| **全量复制** | 首次同步、断线时间过长 | 发送完整 RDB 快照 |
| **增量复制** | 短暂断线后重连 | 只同步断线期间的命令 |

---

## 3 配置主从复制

### 主节点配置

```conf
# redis-master.conf

# 绑定地址
bind 0.0.0.0

# 端口
port 6379

# 密码（推荐）
requirepass yourpassword

# 允许从节点连接
masterauth yourpassword
```

### 从节点配置

```conf
# redis-slave.conf

# 绑定地址
bind 0.0.0.0

# 端口
port 6380

# 密码
requirepass yourpassword

# 指定主节点
replicaof 192.168.1.100 6379

# 主节点密码
masterauth yourpassword

# 从节点只读
replica-read-only yes
```

### 动态配置

```bash
# 在从节点上执行
> REPLICAOF 192.168.1.100 6379
OK

# 取消主从关系
> REPLICAOF NO ONE
OK

# 查看复制状态
> INFO replication
# Replication
role:slave
master_host:192.168.1.100
master_port:6379
master_link_status:up
```

---

## 4 主从复制验证

### 测试数据同步

```bash
# 主节点写入数据
> SET user:1 "Alice"
OK
> SET user:2 "Bob"
OK

# 从节点读取数据
> GET user:1
"Alice"
> GET user:2
"Bob"

# 从节点尝试写入（失败）
> SET user:3 "Charlie"
(error) READONLY You can't write against a read only replica
```

### 查看复制状态

```bash
# 主节点查看
> INFO replication
# Replication
role:master
connected_slaves:2
slave0:ip=192.168.1.101,port=6380,state=online
slave1:ip=192.168.1.102,port=6380,state=online

# 从节点查看
> INFO replication
# Replication
role:slave
master_host:192.168.1.100
master_port:6379
master_link_status:up
```

---

## 5 主从复制注意事项

### 配置建议

| 配置项 | 建议值 | 说明 |
| --- | --- | --- |
| **replica-read-only** | yes | 从节点只读，避免数据不一致 |
| **repl-diskless-sync** | yes | 无盘复制，提升性能 |
| **repl-backlog-size** | 64mb | 复制积压缓冲区大小 |
| **min-replicas-to-write** | 1 | 至少 1 个从节点连接才允许写入 |

### 常见问题

| 问题 | 原因 | 解决方案 |
| --- | --- | --- |
| **复制延迟** | 网络延迟、从节点性能 | 优化网络、提升从节点配置 |
| **数据不一致** | 从节点被写入 | 设置 replica-read-only yes |
| **全量复制频繁** | 断线时间过长 | 增大 repl-backlog-size |

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **主从架构** | 一主多从，读写分离 |
| **复制方式** | 全量复制、增量复制 |
| **配置方法** | replicaof 命令或配置文件 |
| **注意事项** | 从节点只读、复制延迟监控 |

---

## 7 新手常见误区

### 误区 1："从节点可以写入数据"

**错！** 从节点应该设置为只读（replica-read-only yes），否则会导致数据不一致。

### 误区 2："主从复制是实时的"

**不对！** 主从复制是异步的，主节点写入数据后，从节点会有一定延迟。如果需要强一致性，应该用 Redis Cluster 或 Redlock。

### 误区 3："主节点挂了，从节点会自动接管"

**不是的！** 主从复制本身不支持自动故障转移。需要配合哨兵模式（Sentinel）才能实现自动故障转移。

### 误区 4："从节点越多越好"

**不一定！** 每个从节点都会增加主节点的复制压力。一般建议 1 主 2 从或 1 主 3 从，更多从节点可以用级联复制。

---

## 8 动手练习

### 练习 1：配置主从复制

完成以下操作：
1. 启动一个主节点（端口 6379）
2. 启动两个从节点（端口 6380、6381）
3. 配置从节点连接主节点
4. 验证数据同步

<details>
<summary>点击查看答案</summary>

```bash
# 1. 启动主节点
redis-server --port 6379 --requirepass mypassword

# 2. 启动从节点
redis-server --port 6380 --requirepass mypassword
redis-server --port 6381 --requirepass mypassword

# 3. 配置从节点
# 在 6380 端口执行
redis-cli -p 6380 -a mypassword
> REPLICAOF 127.0.0.1 6379
> CONFIG SET masterauth mypassword

# 在 6381 端口执行
redis-cli -p 6381 -a mypassword
> REPLICAOF 127.0.0.1 6379
> CONFIG SET masterauth mypassword

# 4. 验证数据同步
# 主节点写入
redis-cli -p 6379 -a mypassword
> SET test "hello"
OK

# 从节点读取
redis-cli -p 6380 -a mypassword
> GET test
"hello"

redis-cli -p 6381 -a mypassword
> GET test
"hello"
```

</details>

### 练习 2：查看复制状态

完成以下操作：
1. 在主节点查看复制状态
2. 在从节点查看复制状态
3. 模拟主从断线，观察状态变化

<details>
<summary>点击查看答案</summary>

```bash
# 1. 主节点查看
redis-cli -p 6379 -a mypassword
> INFO replication
# Replication
role:master
connected_slaves:2
slave0:ip=127.0.0.1,port=6380,state=online
slave1:ip=127.0.0.1,port=6381,state=online

# 2. 从节点查看
redis-cli -p 6380 -a mypassword
> INFO replication
# Replication
role:slave
master_host:127.0.0.1
master_port:6379
master_link_status:up

# 3. 模拟断线
# 停止从节点
redis-cli -p 6380 -a mypassword shutdown

# 主节点查看状态
redis-cli -p 6379 -a mypassword
> INFO replication
# Replication
role:master
connected_slaves:1
slave1:ip=127.0.0.1,port=6381,state=online
```

</details>

### 练习 3（挑战）：读写分离

实现读写分离：
1. 主节点负责写操作
2. 从节点负责读操作
3. 验证读写分离效果

<details>
<summary>点击查看答案</summary>

```bash
# 主节点写入
redis-cli -p 6379 -a mypassword
> SET user:1 "Alice"
OK
> SET user:2 "Bob"
OK

# 从节点读取
redis-cli -p 6380 -a mypassword
> GET user:1
"Alice"
> GET user:2
"Bob"

# 从节点尝试写入（失败）
redis-cli -p 6380 -a mypassword
> SET user:3 "Charlie"
(error) READONLY You can't write against a read only replica

# 应用代码示例（Java）
// 写操作走主节点
redisTemplate.opsForValue().set("user:3", "Charlie");

// 读操作走从节点（需要配置）
String user = redisTemplate.execute(
    (RedisCallback<String>) connection -> 
        connection.get("user:3".getBytes()),
    true  // 使用从节点
);
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 哨兵模式**——也就是如何实现自动故障转移。你会学到 Sentinel 的原理、配置方法、监控机制和生产部署方案。
