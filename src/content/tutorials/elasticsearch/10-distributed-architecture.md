---
title: "第 10 章：分布式架构原理"
description: "分布式存储、主从复制、分片分配、脑裂问题"
---

# 第 10 章：分布式架构原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Elasticsearch 是如何实现分布式的？
- 数据是如何分布到不同节点的？
- 什么是脑裂问题？如何避免？
- 集群如何保证高可用？

这一章会帮你理解 Elasticsearch 的分布式架构原理。这是理解 Elasticsearch 性能和可靠性的关键。

---

## 1 为什么需要分布式架构？

### 痛点分析

单机存储和计算有上限：

- **存储限制**：单机磁盘容量有限
- **计算限制**：单机 CPU 和内存有限
- **可用性**：单机故障整个系统不可用
- **扩展性**：垂直扩展成本高

### 解决方案

Elasticsearch 采用分布式架构：

- **水平扩展**：增加节点即可提升容量和性能
- **高可用**：部分节点故障不影响整体服务
- **负载均衡**：请求分散到多个节点

打个比方：

> 单机像一个人搬砖，分布式像一群人搬砖，效率更高且更可靠。

---

## 2 集群节点角色

### 节点角色类型

| 角色 | 职责 | 配置 |
|------|------|------|
| Master Node | 管理集群元数据、索引创建、分片分配 | `node.master: true` |
| Data Node | 存储数据、执行查询和聚合 | `node.data: true` |
| Ingest Node | 数据预处理、执行 pipeline | `node.ingest: true` |
| Coordinating Node | 协调请求、分发和汇总结果 | 默认所有节点 |

### 推荐架构

**小型集群（3-5 节点）**：
- 3 个节点同时担任 Master 和 Data 角色

**中型集群（5-10 节点）**：
- 3 个专用 Master 节点
- 其余为 Data 节点

**大型集群（10+ 节点）**：
- 3 个专用 Master 节点
- 多个专用 Data 节点
- 1-2 个专用 Coordinating 节点

---

## 3 主节点选举

### 选举机制

Elasticsearch 使用 **类 Raft 协议**进行主节点选举。

### 选举条件

- 节点必须是 Master 候选
- 获得集群中超过半数节点的投票
- 节点健康且有能力管理集群

### 配置 Master 候选

```yaml
# elasticsearch.yml
node.name: node-1
node.master: true
node.data: false

# 最小主节点数（防止脑裂）
cluster.initial_master_nodes: ["node-1", "node-2", "node-3"]
```

### 选举过程

```
1. 集群启动或主节点故障
2. 所有 Master 候选节点发起选举
3. 每个节点投票给自己
4. 广播投票信息
5. 获得超半数投票的节点成为主节点
6. 新主节点通知所有节点
```

---

## 4 分片分配原理

### 分片分配策略

Elasticsearch 自动将分片分配到不同节点：

```
集群：3 个节点
索引：3 个主分片，1 个副本

分配结果：
节点 A: 主分片 0, 副本 1
节点 B: 主分片 1, 副本 2
节点 C: 主分片 2, 副本 0
```

### 分配原则

- **主分片和副本不在同一节点**：保证高可用
- **均匀分布**：尽量让每个节点的分片数相近
- **负载均衡**：考虑节点的磁盘、CPU 使用率

### 手动控制分配

```bash
# 指定分片分配到特定节点
PUT /products/_settings
{
  "index.routing.allocation.require.box_type": "hot"
}

# 排除特定节点
PUT /products/_settings
{
  "index.routing.allocation.exclude._name": "node-3"
}
```

---

## 5 读写流程

### 写入流程

```
1. 客户端发送写入请求到协调节点
2. 协调节点根据路由计算目标分片
3. 请求转发到主分片所在节点
4. 主分片写入本地
5. 主分片同步到副本分片
6. 所有副本确认后返回成功
```

### 路由计算

```
shard = hash(routing) % number_of_primary_shards

# routing 默认是文档 _id
# 也可以自定义 routing
POST /products/_doc?routing=user_123
{
  "name": "测试商品"
}
```

### 读取流程

```
1. 客户端发送读取请求到协调节点
2. 协调节点确定目标分片
3. 请求转发到主分片或副本（负载均衡）
4. 节点返回结果
5. 协调节点汇总并返回客户端
```

---

## 6 脑裂问题

### 什么是脑裂？

当集群中出现多个主节点时，称为脑裂（Split Brain）。

### 产生原因

- 网络分区：节点间通信中断
- 主节点被误判为故障
- 多个节点同时发起选举

### 解决方案

**设置最小主节点数**：

```yaml
# 防止脑裂的关键配置
cluster.initial_master_nodes: ["node-1", "node-2", "node-3"]

# 主节点最少数量 = (主候选节点数 / 2) + 1
# 例如：3 个主候选，最少需要 2 个节点同意
```

**推荐配置**：

- 主候选节点数使用奇数（3、5、7）
- 避免网络分区时出现平局

---

## 7 集群健康状态

### 健康状态说明

| 状态 | 说明 | 原因 |
|------|------|------|
| Green | 所有分片正常 | 集群完全健康 |
| Yellow | 主分片正常，副本未完全分配 | 节点故障、副本分配中 |
| Red | 有主分片未分配 | 数据丢失风险 |

### 查看集群健康

```bash
# 查看集群健康状态
GET /_cluster/health

# 返回示例
{
  "cluster_name": "my-cluster",
  "status": "green",
  "number_of_nodes": 3,
  "number_of_data_nodes": 3,
  "active_primary_shards": 15,
  "active_shards": 30,
  "relocating_shards": 0
}
```

### 查看未分配分片

```bash
# 查看未分配的分片原因
GET /_cluster/allocation/explain
{
  "index": "products",
  "shard": 0,
  "primary": false
}
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 节点角色 | Master、Data、Ingest、Coordinating |
| 主节点选举 | 类 Raft 协议，超半数投票 |
| 分片分配 | 自动分配，支持手动控制 |
| 读写流程 | 写入同步副本，读取负载均衡 |
| 脑裂问题 | 设置最小主节点数防止 |
| 集群健康 | Green、Yellow、Red 三种状态 |

---

## 9 新手常见误区

### 误区 1："主节点越多越好"

**错！** 主节点过多会增加选举开销。通常 3 个主节点足够。

### 误区 2："副本可以放在主分片同一节点"

不是的。副本必须和主分片在不同节点，否则无法提供高可用。

### 误区 3："集群状态 Yellow 不影响使用"

Yellow 表示副本未完全分配，虽然可以读写，但存在数据丢失风险，需要尽快排查。

---

## 10 动手练习

### 练习 1：查看集群状态

查看集群健康状态和节点列表。

<details>
<summary>点击查看答案</summary>

```bash
# 查看集群健康
GET /_cluster/health

# 查看节点列表
GET /_cat/nodes?v

# 查看分片分配
GET /_cat/shards?v
```

</details>

### 练习 2：配置节点角色

配置一个节点为专用主节点。

<details>
<summary>点击查看答案</summary>

```yaml
# elasticsearch.yml
node.name: master-node-1
node.master: true
node.data: false
node.ingest: false

cluster.initial_master_nodes: ["master-node-1", "master-node-2", "master-node-3"]
```

</details>

### 练习 3（挑战）：分析分片分配

创建一个索引，设置 3 个主分片和 1 个副本，查看分片分配情况。

<details>
<summary>点击查看答案</summary>

```bash
# 创建索引
PUT /test_index
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}

# 查看分片分配
GET /_cat/shards/test_index?v

# 输出示例：
# index       shard prirep state   docs store node
# test_index  0     p      STARTED    0  208b node-1
# test_index  0     r      STARTED    0  208b node-2
# test_index  1     p      STARTED    0  208b node-2
# test_index  1     r      STARTED    0  208b node-3
# test_index  2     p      STARTED    0  208b node-3
# test_index  2     r      STARTED    0  208b node-1
```

</details>

---

## 下一章预告

下一章我们会学习 **集群管理与监控**——也就是集群健康、节点管理、索引生命周期、监控工具。你会学到如何维护生产环境的 Elasticsearch 集群。
