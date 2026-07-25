---
title: "第9章：Redis Cluster 集群"
description: "集群架构、数据分片、节点通信、扩容缩容"
---

# 第9章：Redis Cluster 集群

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 哨兵模式能解决数据量大的问题吗？
- 什么是 Redis Cluster？
- 数据是怎么分片的？
- 集群如何扩容和缩容？
- 集群有哪些限制？

这一章会详细讲解 Redis Cluster 的原理和使用，帮你掌握如何构建大规模分布式 Redis 集群。

---

## 9.1 为什么需要集群？

### 痛点分析

哨兵模式解决了高可用问题，但无法解决：

- **数据量过大**：单个节点内存有限，无法存储海量数据
- **写入瓶颈**：所有写操作都打到主节点，性能受限
- **水平扩展**：无法通过增加节点提升容量和性能

### 解决方案

Redis Cluster 是 Redis 的分布式解决方案，通过数据分片将数据分散存储到多个节点。

| 特性 | 说明 |
| --- | --- |
| **数据分片** | 数据自动分散到多个节点 |
| **水平扩展** | 通过增加节点提升容量 |
| **高可用** | 每个分片有主从节点 |
| **自动故障转移** | 节点故障自动切换 |

---

## 9.2 集群架构原理

### 核心概念

- **分片（Shard）**：数据被分成 16384 个槽（slot），分散到各个节点
- **节点（Node）**：集群中的每个 Redis 实例
- **主从复制**：每个主节点都有对应的从节点

### 数据分片机制

```
键 -> CRC16 哈希 -> 对 16384 取模 -> 确定槽号 -> 确定节点

示例：
key = "user:1001"
CRC16("user:1001") = 12345
12345 % 16384 = 12345
槽 12345 属于节点 A
```

### 集群架构图

```
┌─────────────────────────────────────────┐
│           Redis Cluster                  │
├─────────────────────────────────────────┤
│  节点A (主)    节点B (主)    节点C (主)   │
│  槽 0-5460     槽 5461-10922 槽 10923-16383│
│  ├─ 从节点A1   ├─ 从节点B1   ├─ 从节点C1  │
└─────────────────────────────────────────┘
```

---

## 9.3 配置集群

### 节点配置

```conf
# redis-cluster-node1.conf

# 开启集群模式
cluster-enabled yes

# 集群配置文件
cluster-config-file nodes-6379.conf

# 集群超时时间
cluster-node-timeout 5000

# 其他配置
port 6379
bind 0.0.0.0
requirepass yourpassword
masterauth yourpassword
```

### 创建集群

```bash
# 启动 6 个节点（3 主 3 从）
redis-server redis-cluster-node1.conf --daemonize yes
redis-server redis-cluster-node2.conf --daemonize yes
redis-server redis-cluster-node3.conf --daemonize yes
redis-server redis-cluster-node4.conf --daemonize yes
redis-server redis-cluster-node5.conf --daemonize yes
redis-server redis-cluster-node6.conf --daemonize yes

# 创建集群
redis-cli --cluster create \
  127.0.0.1:6379 127.0.0.1:6380 127.0.0.1:6381 \
  127.0.0.1:6382 127.0.0.1:6383 127.0.0.1:6384 \
  --cluster-replicas 1 \
  -a yourpassword

# 交互式确认
>>> Please write 'yes' if you want to accept the configuration: yes
```

### 查看集群信息

```bash
# 连接集群
redis-cli -c -p 6379 -a yourpassword

# 查看集群信息
> CLUSTER INFO
cluster_state:ok
cluster_slots_assigned:16384
cluster_slots_ok:16384
cluster_known_nodes:6
cluster_size:3

# 查看节点
> CLUSTER NODES
a1b2c3d4... 127.0.0.1:6379@16379 master - 0-5460 [connected]
e5f6g7h8... 127.0.0.1:6380@16380 master - 5461-10922 [connected]
...

# 查看键属于哪个槽
> CLUSTER KEYSLOT user:1001
(integer) 12345
```

---

## 9.4 集群操作

### 读写操作

```bash
# 写入数据（自动路由到正确节点）
> SET user:1001 "Alice"
-> Redirected to slot [12345] located at 127.0.0.1:6380
OK

# 读取数据
> GET user:1001
-> Redirected to slot [12345] located at 127.0.0.1:6380
"Alice"

# 批量操作（必须使用 hash tag）
> MSET user:{1001}:name "Alice" user:{1001}:age 25
OK
```

### Hash Tag

```bash
# 使用 hash tag 确保相关键在同一个槽
SET user:{1001}:name "Alice"
SET user:{1001}:age 25
SET user:{1001}:email "alice@example.com"

# 这些键都会根据 {1001} 计算槽位，保证在同一个节点
```

### 多键操作限制

```bash
# ❌ 错误：不同槽的键不能一起操作
> MSET key1 value1 key2 value2
(error) CROSSSLOT Keys in request don't hash to the same slot

# ✅ 正确：使用 hash tag
> MSET {tag}key1 value1 {tag}key2 value2
OK
```

---

## 9.5 扩容与缩容

### 添加节点

```bash
# 启动新节点
redis-server redis-cluster-node7.conf --daemonize yes

# 添加为主节点
redis-cli --cluster add-node 127.0.0.1:6385 127.0.0.1:6379 -a yourpassword

# 重新分配槽
redis-cli --cluster reshard 127.0.0.1:6379 -a yourpassword
# 交互式输入要移动的槽数量和目标节点 ID
```

### 删除节点

```bash
# 先迁移槽
redis-cli --cluster reshard 127.0.0.1:6379 -a yourpassword

# 删除节点
redis-cli --cluster del-node 127.0.0.1:6379 <node-id> -a yourpassword
```

### 添加从节点

```bash
# 添加为从节点
redis-cli --cluster add-node 127.0.0.1:6386 127.0.0.1:6379 \
  --cluster-slave --cluster-master-id <master-node-id> \
  -a yourpassword
```

---

## 9.6 集群限制

### 不支持的操作

| 限制 | 说明 |
| --- | --- |
| **多数据库** | 只支持数据库 0 |
| **批量操作** | 多键操作必须使用 hash tag |
| **事务** | 不支持跨槽事务 |
| **Lua 脚本** | 不支持跨槽操作 |
| **复制命令** | 不支持 SELECT、DBSIZE 等 |

### 性能考虑

| 因素 | 建议 |
| --- | --- |
| **节点数量** | 建议不超过 1000 个节点 |
| **槽分配** | 尽量均匀分配槽 |
| **网络延迟** | 节点间网络延迟要低 |
| **内存使用** | 单个节点内存不超过 20GB |

---

## 9.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **数据分片** | 16384 个槽，CRC16 哈希 |
| **节点角色** | 主节点处理读写，从节点故障转移 |
| **Hash Tag** | 确保相关键在同一个槽 |
| **扩容缩容** | 动态添加/删除节点，重新分配槽 |
| **限制** | 不支持多数据库、跨槽操作 |

---

## 9.8 新手常见误区

### 误区 1："集群可以像单机一样使用"

**错！** 集群有很多限制，比如不支持多数据库、跨槽操作需要 hash tag、不支持跨槽事务等。需要调整应用代码适应集群模式。

### 误区 2："节点越多性能越好"

**不一定！** 节点太多会增加通信开销和运维复杂度。一般 6-10 个节点就能满足大部分需求，超过 100 个节点需要谨慎评估。

### 误区 3："集群自动处理所有数据分布"

**不对！** 集群只负责数据路由，不会自动平衡数据。需要手动或使用工具重新分配槽，确保数据均匀分布。

### 误区 4："集群不需要哨兵"

**不是的！** 集群本身支持自动故障转移，不需要哨兵。集群的每个主节点都有从节点，节点间通过 Gossip 协议通信，自动检测和故障转移。

---

## 9.9 动手练习

### 练习 1：搭建集群环境

搭建一个 3 主 3 从的 Redis 集群：
1. 配置 6 个节点
2. 创建集群
3. 验证数据分片

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建配置文件
for port in 6379 6380 6381 6382 6383 6384; do
  cat > redis-${port}.conf << EOF
port ${port}
cluster-enabled yes
cluster-config-file nodes-${port}.conf
cluster-node-timeout 5000
appendonly yes
EOF
done

# 2. 启动节点
for port in 6379 6380 6381 6382 6383 6384; do
  redis-server redis-${port}.conf --daemonize yes
done

# 3. 创建集群
redis-cli --cluster create \
  127.0.0.1:6379 127.0.0.1:6380 127.0.0.1:6381 \
  127.0.0.1:6382 127.0.0.1:6383 127.0.0.1:6384 \
  --cluster-replicas 1 -a yourpassword

# 4. 验证
redis-cli -c -p 6379 -a yourpassword
> CLUSTER INFO
> SET test "hello"
> GET test
```

</details>

### 练习 2：Hash Tag 使用

使用 hash tag 确保相关键在同一个槽：
1. 存储用户信息（姓名、年龄、邮箱）
2. 批量操作这些键
3. 验证它们在同一个节点

<details>
<summary>点击查看答案</summary>

```bash
# 1. 使用 hash tag 存储
redis-cli -c -p 6379 -a yourpassword
> SET user:{1001}:name "Alice"
OK
> SET user:{1001}:age 25
OK
> SET user:{1001}:email "alice@example.com"
OK

# 2. 批量操作
> MGET user:{1001}:name user:{1001}:age user:{1001}:email
1) "Alice"
2) "25"
3) "alice@example.com"

# 3. 验证槽位
> CLUSTER KEYSLOT user:{1001}:name
(integer) 12345
> CLUSTER KEYSLOT user:{1001}:age
(integer) 12345
# 槽位相同，在同一个节点
```

</details>

### 练习 3（挑战）：集群扩容

给现有集群添加一个新节点：
1. 启动新节点
2. 添加到集群
3. 重新分配槽

<details>
<summary>点击查看答案</summary>

```bash
# 1. 启动新节点
cat > redis-6385.conf << EOF
port 6385
cluster-enabled yes
cluster-config-file nodes-6385.conf
cluster-node-timeout 5000
EOF
redis-server redis-6385.conf --daemonize yes

# 2. 添加到集群
redis-cli --cluster add-node 127.0.0.1:6385 127.0.0.1:6379 -a yourpassword

# 3. 重新分配槽（交互式）
redis-cli --cluster reshard 127.0.0.1:6379 -a yourpassword
# 输入要移动的槽数量：4096
# 输入目标节点 ID：<新节点ID>
# 输入源节点 ID：all（从所有节点均匀分配）
# 确认：yes

# 4. 验证
> CLUSTER NODES
# 查看新节点的槽分配
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 内存管理**——也就是 Redis 如何分配和回收内存。你会学到内存分配策略、内存淘汰策略、内存优化技巧，掌握如何高效使用 Redis 内存。
