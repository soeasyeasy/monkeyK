---
title: "第 2 章：核心概念详解"
description: "索引、文档、分片、副本、节点核心概念"
---

# 第 2 章：核心概念详解

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Elasticsearch 中的"索引"和 MySQL 的"索引"是一回事吗？
- 什么是文档？它和数据库的行有什么区别？
- 分片和副本是什么？为什么需要它们？
- 节点和集群是什么关系？

这一章会帮你搞清楚 Elasticsearch 的核心概念。理解这些概念是后面学习的基础。

---

## 2.1 为什么需要理解核心概念？

### 痛点分析

很多新手学 Elasticsearch 时，直接开始学 API 操作，结果遇到这些问题：

- **概念混淆**：把 ES 的索引当成 MySQL 的索引，理解偏差
- **架构不清**：不知道数据是怎么存储和分布的
- **性能问题**：不知道如何设计分片策略，导致性能差
- **故障难排查**：集群出问题时不知道从哪里入手

### 解决方案

先搞清楚核心概念，再学具体操作，事半功倍。

打个比方：

> 学开车前，你要先知道方向盘、油门、刹车是什么，而不是直接上车就开。

---

## 2.2 索引（Index）

### 概念解释

**索引**是 Elasticsearch 中存储数据的地方，类似于 MySQL 中的**表**。

关键词解析：

- **逻辑容器**：索引是一个逻辑命名空间，用于组织文档
- **独立配置**：每个索引可以有自己的设置（分片数、副本数等）
- **类型无关**：同一个索引中的文档可以有不同的字段（但建议保持一致）

### 与 MySQL 的对比

| Elasticsearch | MySQL | 说明 |
|---------------|-------|------|
| Index（索引） | Table（表） | 存储同类数据的容器 |
| Document（文档） | Row（行） | 一条具体的数据记录 |
| Field（字段） | Column（列） | 数据的一个属性 |
| Mapping（映射） | Schema（表结构） | 定义字段类型和属性 |

### 代码示例

```bash
# 创建一个名为 products 的索引
PUT /products
{
  "settings": {
    # 主分片数量
    "number_of_shards": 3,
    # 副本数量
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      # 定义字段类型
      "name": { "type": "text" },
      "price": { "type": "float" },
      "category": { "type": "keyword" }
    }
  }
}
```

> **注意**：ES 的索引和 MySQL 的索引完全不同。MySQL 的索引是加速查询的数据结构，ES 的索引是存储数据的容器。

---

## 2.3 文档（Document）

### 概念解释

**文档**是 Elasticsearch 中的基本数据单元，类似于 MySQL 中的**行**。

关键词解析：

- **JSON 格式**：文档以 JSON 格式存储
- **唯一 ID**：每个文档有一个唯一标识符 `_id`
- **版本控制**：文档有版本号，支持乐观锁

### 文档结构

```json
{
  "_index": "products",      // 所属索引
  "_id": "1",                // 文档 ID
  "_version": 1,             // 版本号
  "_source": {               // 实际数据
    "name": "iPhone 15 Pro",
    "price": 7999,
    "category": "手机"
  }
}
```

### 代码示例

```bash
# 添加文档（自动生成 ID）
POST /products/_doc
{
  "name": "iPhone 15 Pro",
  "price": 7999,
  "category": "手机"
}

# 添加文档（指定 ID）
PUT /products/_doc/1
{
  "name": "iPhone 15 Pro",
  "price": 7999,
  "category": "手机"
}

# 获取文档
GET /products/_doc/1

# 更新文档
POST /products/_update/1
{
  "doc": {
    "price": 8999
  }
}

# 删除文档
DELETE /products/_doc/1
```

---

## 2.4 节点（Node）

### 概念解释

**节点**是 Elasticsearch 集群中的一个服务器实例。

关键词解析：

- **独立进程**：每个节点是一个独立的 Java 进程
- **集群成员**：多个节点组成一个集群
- **角色分工**：节点可以有不同的角色（主节点、数据节点等）

### 节点角色

| 角色 | 说明 | 配置 |
|------|------|------|
| Master Node | 管理集群元数据，负责索引创建、分片分配 | `node.master: true` |
| Data Node | 存储数据，执行查询和聚合 | `node.data: true` |
| Ingest Node | 数据预处理，执行 pipeline | `node.ingest: true` |
| Coordinating Node | 协调请求，分发和汇总结果 | 默认所有节点 |

### 代码示例

```yaml
# elasticsearch.yml 配置节点角色
node.name: node-1
node.master: true
node.data: true
node.ingest: true
```

---

## 2.5 分片（Shard）

### 概念解释

**分片**是索引的物理分区，每个分片是一个独立的 Lucene 索引。

关键词解析：

- **水平拆分**：一个索引可以分成多个分片，分布在不同节点
- **主分片**：原始数据的分片，数量创建后不可更改
- **副本分片**：主分片的拷贝，提供高可用和读扩展

### 为什么需要分片？

打个比方：

> 一本 1000 页的书，分成 10 本 100 页的小册子，每个人看一册，速度更快。

分片的好处：

- **突破单机限制**：数据量超过单机容量时，可以分散到多台机器
- **并行处理**：查询可以并行在多个分片上执行，提升性能
- **水平扩展**：增加节点即可提升集群容量

### 分片数量选择

| 数据量 | 建议分片数 | 说明 |
|--------|-----------|------|
| < 10GB | 1-3 | 小型应用 |
| 10-100GB | 3-5 | 中型应用 |
| 100GB-1TB | 5-10 | 大型应用 |
| > 1TB | 10+ | 超大型应用 |

> **注意**：分片不是越多越好。每个分片有开销，过多分片会导致集群管理困难。

---

## 2.6 副本（Replica）

### 概念解释

**副本**是主分片的拷贝，用于提供高可用和读扩展。

关键词解析：

- **高可用**：主分片故障时，副本可以提升为主分片
- **读扩展**：查询可以同时在主分片和副本上执行
- **动态调整**：副本数量可以随时修改

### 副本工作原理

```
主分片 0 → 节点 A
副本 0   → 节点 B（主分片 0 的拷贝）

主分片 1 → 节点 B
副本 1   → 节点 A（主分片 1 的拷贝）
```

### 代码示例

```bash
# 创建索引时指定副本数
PUT /products
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}

# 动态修改副本数
PUT /products/_settings
{
  "number_of_replicas": 2
}
```

---

## 2.7 集群（Cluster）

### 概念解释

**集群**是多个节点组成的集合，共同存储数据并提供搜索能力。

关键词解析：

- **分布式系统**：数据分布在多个节点
- **单点故障**：某个节点故障，集群仍可正常工作
- **水平扩展**：增加节点即可提升集群容量

### 集群健康状态

| 状态 | 说明 |
|------|------|
| Green | 所有主分片和副本都正常 |
| Yellow | 所有主分片正常，但有副本未分配 |
| Red | 有主分片未分配 |

### 代码示例

```bash
# 查看集群健康状态
GET /_cluster/health

# 查看集群状态
GET /_cluster/state

# 查看节点信息
GET /_cat/nodes?v
```

---

## 2.8 核心知识点总结

| 概念 | 说明 | 类比 MySQL |
|------|------|-----------|
| Index | 存储数据的容器 | Table |
| Document | 一条数据记录 | Row |
| Field | 数据的一个属性 | Column |
| Node | 集群中的一个服务器 | - |
| Shard | 索引的物理分区 | - |
| Replica | 主分片的拷贝 | - |
| Cluster | 多个节点的集合 | - |

---

## 2.9 新手常见误区

### 误区 1："分片越多越好"

**错！** 分片过多会导致：

- 集群管理开销增大
- 查询需要协调更多分片
- 合并操作变慢

正确做法：根据数据量和节点数量合理规划分片数。

### 误区 2："副本可以放在同一个节点"

不是的。副本必须和主分片在不同节点，否则无法提供高可用。

### 误区 3："索引创建后可以修改分片数"

主分片数创建后不可修改，只能重建索引。副本数可以随时修改。

---

## 2.10 动手练习

### 练习 1：基础概念

创建一个名为 `users` 的索引，设置 2 个主分片，1 个副本。

<details>
<summary>点击查看答案</summary>

```bash
PUT /users
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1
  }
}
```

</details>

### 练习 2：文档操作

向 `users` 索引添加 3 个用户文档，然后查询所有用户。

<details>
<summary>点击查看答案</summary>

```bash
# 添加用户
POST /users/_doc
{
  "name": "张三",
  "age": 25,
  "email": "zhangsan@example.com"
}

POST /users/_doc
{
  "name": "李四",
  "age": 30,
  "email": "lisi@example.com"
}

POST /users/_doc
{
  "name": "王五",
  "age": 28,
  "email": "wangwu@example.com"
}

# 查询所有用户
GET /users/_search
{
  "query": {
    "match_all": {}
  }
}
```

</details>

### 练习 3（挑战）：集群状态

查看集群健康状态和节点信息，解释各个字段的含义。

<details>
<summary>点击查看答案</summary>

```bash
# 查看集群健康
GET /_cluster/health

# 查看节点列表
GET /_cat/nodes?v

# 查看索引列表
GET /_cat/indices?v
```

字段说明：

- `status`：集群状态（green/yellow/red）
- `number_of_nodes`：节点数量
- `number_of_data_nodes`：数据节点数量
- `active_primary_shards`：活跃主分片数
- `active_shards`：活跃分片总数（包括副本）

</details>

---

## 下一章预告

下一章我们会学习 **文档操作基础**——也就是文档的增删改查、批量操作、版本控制。你会学到如何高效地管理文档数据。
