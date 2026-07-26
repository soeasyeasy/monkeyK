---
title: "第10章：分片集群"
description: "分片架构、片键选择、配置服务器、扩容缩容"
---

# 第10章：分片集群

## 本章导读

### 新手常见疑问

1. **什么是分片？和副本集有什么区别？**
   - 副本集不是已经能解决高可用问题了吗？
   - 数据量太大，副本集也存不下怎么办？

2. **分片集群是怎么工作的？数据怎么分散？**
   - 数据是按什么规则分散到不同机器的？
   - 查询时怎么知道数据在哪个分片上？

3. **片键是什么？怎么选才合适？**
   - 片键选错了会怎样？
   - 什么样的字段适合作为片键？

4. **分片集群怎么扩容？会不会影响业务？**
   - 加新机器需要停机吗？
   - 数据重新分配要多久？

---

## 为什么需要分片技术

### 痛点分析

当你的应用越来越成功，数据量暴涨：

**存储瓶颈：**
- 单机硬盘满了，数据存不下
- SSD 太贵，无法无限扩容
- 备份恢复时间越来越长

**性能瓶颈：**
- 查询速度越来越慢
- 写入吞吐量达到上限
- CPU 和内存资源耗尽

**副本集的局限：**
- 副本集的每个节点都存储**完整数据**
- 数据量超过单机容量，副本集也无能为力
- 需要一种能**水平扩展**的方案

### 生活化类比

把分片集群想象成一个**大型图书馆系统**：

- **单台服务器**：一个小书架，只能放100本书
- **副本集**：多个相同的书架，每个书架都有完整的100本书（数据冗余）
- **分片集群**：把1000本书分成10组，每组100本，放在不同的书架上（数据分散）

**分片集群的角色：**
- **Mongos（路由）**：图书馆前台，知道每本书在哪个书架
- **Config Server（配置服务器）**：图书管理员的目录本，记录每本书的位置
- **Shard（分片）**：实际的书架，存储部分数据

**好处：**
- 书太多了？加个新书架（水平扩展）
- 某个书架满了？把部分书移到新书架（数据均衡）
- 找书时，前台直接告诉你书在哪个书架（路由查询）

### 代码对比

**❌ 单机存储海量数据：**

```javascript
// 问题：数据量太大，单机存储不下
const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('bigdata');

// 假设要存储10亿条用户数据
// 单机硬盘只有500GB，根本存不下
for (let i = 0; i < 1000000000; i++) {
  await db.collection('users').insertOne({
    userId: i,
    name: `User${i}`,
    data: '...'  // 大量数据
  });
}
// 错误：硬盘满了，插入失败
```

**✅ 使用分片集群：**

```javascript
// 连接到分片集群（通过 Mongos 路由）
const client = new MongoClient('mongodb://mongos1:27017,mongos2:27017');
const db = client.db('bigdata');

// 数据自动分散到多个分片
// 每个分片只存储部分数据
for (let i = 0; i < 1000000000; i++) {
  await db.collection('users').insertOne({
    userId: i,
    name: `User${i}`,
    data: '...'
  });
}
// 成功：数据自动分散到多个分片，理论上可以无限扩展
```

---

## 核心原理讲解

### 分片架构组成

分片集群由四个核心组件组成：

| 组件 | 职责 | 数量 | 类比 |
|------|------|------|------|
| **Mongos（路由）** | 接收客户端请求，路由到正确的分片 | 1个或多个 | 图书馆前台 |
| **Config Server（配置服务器）** | 存储集群元数据、片键范围映射 | 3个（副本集） | 图书目录 |
| **Shard（分片）** | 存储实际数据，每个分片是副本集 | 2个或更多 | 书架 |
| **Chunk（数据块）** | 数据的最小分配单元（默认64MB） | - | 一组书 |

### 通俗类比

把分片集群想象成一个**快递分拣系统**：

- **Mongos**：分拣中心，根据地址决定包裹发往哪个仓库
- **Config Server**：地址映射表，记录每个区域对应哪个仓库
- **Shard**：各地仓库，存储特定区域的包裹
- **Chunk**：包裹批次，按区域分组

**工作流程：**
1. 客户下单（写入请求）→ Mongos 接收
2. Mongos 查询 Config Server → 确定数据在哪个 Shard
3. 路由请求到正确的 Shard → 执行操作
4. 返回结果给客户

### 片键类型

片键是决定数据如何分散的字段，有两种类型：

**1. Hashed 片键（哈希片键）**

```javascript
// 使用 userId 的哈希值作为片键
sh.shardCollection("mydb.users", { userId: "hashed" });

// 原理：
// userId: 1 → hash: 0.8 → Chunk A
// userId: 2 → hash: 0.3 → Chunk B
// userId: 3 → hash: 0.9 → Chunk A
// userId: 4 → hash: 0.1 → Chunk C

// 优点：数据均匀分布
// 缺点：范围查询需要查询所有分片
```

**2. Ranged 片键（范围片键）**

```javascript
// 使用 createdAt 作为片键
sh.shardCollection("mydb.logs", { createdAt: 1 });

// 原理：
// createdAt: 2024-01-01 ~ 2024-03-31 → Chunk A
// createdAt: 2024-04-01 ~ 2024-06-30 → Chunk B
// createdAt: 2024-07-01 ~ 2024-09-30 → Chunk C
// createdAt: 2024-10-01 ~ 2024-12-31 → Chunk D

// 优点：范围查询高效
// 缺点：可能导致数据倾斜（热点）
```

**对比表格：**

| 片键类型 | 数据分布 | 范围查询 | 适用场景 |
|----------|----------|----------|----------|
| **Hashed** | 均匀 | 需查询所有分片 | ID、用户名等离散字段 |
| **Ranged** | 可能倾斜 | 高效 | 时间戳、地区等连续字段 |
| **Composite（复合）** | 取决于组合 | 取决于组合 | 多字段组合 |

### 片键选择原则

**✅ 好的片键特征：**
1. **基数高**：字段值种类多（如 userId、email）
2. **分布均匀**：不会集中在少数值上
3. **查询常用**：大部分查询都包含该字段
4. **不会频繁更新**：片键值一旦确定，最好不要改

**❌ 差的片键特征：**
1. **基数低**：字段值种类少（如性别、状态）
2. **单调递增**：如自增 ID、时间戳（会导致热点）
3. **数组字段**：多键片键会导致数据重复
4. **超过512字节**：片键值不能太大

**示例对比：**

```javascript
// ✅ 好的片键选择
{ userId: "hashed" }        // 基数高，分布均匀
{ email: 1 }                // 基数高，查询常用

// ❌ 差的片键选择
{ gender: 1 }               // 基数太低（只有男/女）
{ status: 1 }               // 基数低（几个状态值）
{ createdAt: 1 }            // 单调递增，会导致热点
{ tags: 1 }                 // 数组字段，不适合
```

---

## 基础用法与实战

### 1. 搭建分片集群

**步骤1：启动配置服务器副本集**

```bash
# 创建配置服务器数据目录
mkdir -p /data/config1 /data/config2 /data/config3

# 启动三个配置服务器实例
mongod --configsvr --replSet configReplSet --port 26017 --dbpath /data/config1
mongod --configsvr --replSet configReplSet --port 26018 --dbpath /data/config2
mongod --configsvr --replSet configReplSet --port 26019 --dbpath /data/config3
```

**步骤2：初始化配置服务器副本集**

```javascript
// 连接到配置服务器
mongo --port 26017

// 初始化副本集
rs.initiate({
  _id: "configReplSet",
  configsvr: true,  // 标记为配置服务器
  members: [
    { _id: 0, host: "localhost:26017" },
    { _id: 1, host: "localhost:26018" },
    { _id: 2, host: "localhost:26019" }
  ]
})
```

**步骤3：启动分片（副本集）**

```bash
# 启动第一个分片（副本集）
mkdir -p /data/shard1_1 /data/shard1_2
mongod --shardsvr --replSet shard1ReplSet --port 27017 --dbpath /data/shard1_1
mongod --shardsvr --replSet shard1ReplSet --port 27018 --dbpath /data/shard1_2

# 启动第二个分片（副本集）
mkdir -p /data/shard2_1 /data/shard2_2
mongod --shardsvr --replSet shard2ReplSet --port 27027 --dbpath /data/shard2_1
mongod --shardsvr --replSet shard2ReplSet --port 27028 --dbpath /data/shard2_2
```

**步骤4：初始化分片副本集**

```javascript
// 初始化第一个分片副本集
mongo --port 27017
rs.initiate({
  _id: "shard1ReplSet",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" }
  ]
})

// 初始化第二个分片副本集
mongo --port 27027
rs.initiate({
  _id: "shard2ReplSet",
  members: [
    { _id: 0, host: "localhost:27027" },
    { _id: 1, host: "localhost:27028" }
  ]
})
```

**步骤5：启动 Mongos 路由**

```bash
# 启动 Mongos，连接配置服务器
mongos --port 27037 --configdb configReplSet/localhost:26017,localhost:26018,localhost:26019
```

**步骤6：添加分片到集群**

```javascript
// 连接到 Mongos
mongo --port 27037

// 添加第一个分片
sh.addShard("shard1ReplSet/localhost:27017,localhost:27018")

// 添加第二个分片
sh.addShard("shard2ReplSet/localhost:27027,localhost:27028")

// 查看分片状态
sh.status()
```

### 2. 启用分片

**步骤1：创建数据库并启用分片**

```javascript
// 连接到 Mongos
mongo --port 27037

// 切换到目标数据库
use mydb

// 启用数据库分片
sh.enableSharding("mydb")
```

**步骤2：对集合启用分片**

```javascript
// 使用 Hashed 片键
sh.shardCollection("mydb.users", { userId: "hashed" });

// 或使用 Ranged 片键
sh.shardCollection("mydb.logs", { createdAt: 1 });

// 或使用复合片键
sh.shardCollection("mydb.orders", { region: 1, orderId: 1 });
```

### 3. 查看分片信息

**常用命令：**

```javascript
// 查看集群状态
sh.status()
// 返回：分片列表、数据库、集合、Chunk 分布

// 查看集合的分片信息
db.collection.getShardDistribution()
// 返回：每个分片的 Chunk 数量、数据量

// 查看 Chunk 分布
sh.status()
// 查看 chunks 部分，了解数据分布
```

### 4. 扩容操作

**添加新分片：**

```javascript
// 1. 启动新的分片副本集（参考步骤3-4）

// 2. 连接到 Mongos
mongo --port 27037

// 3. 添加新分片
sh.addShard("shard3ReplSet/localhost:27037,localhost:27038")

// 4. 查看状态
sh.status()
// 新分片会显示，Chunk 会自动均衡
```

**触发 Chunk 均衡：**

```javascript
// 手动触发均衡器
sh.startBalancer()

// 查看均衡器状态
sh.getBalancerState()
// 返回：true 表示运行中

// 停止均衡器（维护时使用）
sh.stopBalancer()
```

### 5. 缩容操作

**移除分片：**

```javascript
// 1. 停止均衡器
sh.stopBalancer()

// 2. 移除分片（数据会自动迁移到其他分片）
sh.removeShard("shard3ReplSet")

// 3. 查看迁移进度
db.adminCommand({ removeShard: "shard3ReplSet" })
// 返回：迁移进度百分比

// 4. 等待迁移完成后，分片会被移除
```

**对比表格：扩容 vs 缩容**

| 操作 | 步骤 | 影响 | 耗时 |
|------|------|------|------|
| **扩容** | 添加新分片 → 自动均衡 | 业务不中断，性能提升 | 取决于数据量 |
| **缩容** | 停止均衡 → 迁移数据 → 移除分片 | 业务不中断，性能下降 | 取决于数据量 |

---

## 新手常见误区

### 误区1：认为分片集群可以解决所有性能问题

**错误理解：**
"查询慢就加分片，分片越多性能越好"

**实际情况：**
- 分片主要解决**存储容量**和**写入吞吐**问题
- 对于查询性能，索引优化更重要
- 分片过多会增加路由开销和均衡成本

**正确做法：**
```javascript
// ✅ 先优化索引
db.users.createIndex({ email: 1 });

// ✅ 分析查询模式
db.users.find({ email: "test@example.com" }).explain("executionStats");

// ✅ 只有当数据量超过单机容量时，才考虑分片
// 一般建议：单分片数据量 > 1TB 时再考虑扩容
```

### 误区2：认为片键可以随意更改

**错误理解：**
"片键选错了，改一下就行"

**实际情况：**
- 片键一旦确定，**无法更改**
- 要改片键，必须重新创建集合并迁移数据
- 成本非常高，需要谨慎选择

**正确做法：**
```javascript
// ❌ 错误：试图修改片键
db.users.updateOne({ _id: 1 }, { $set: { userId: 999 } });
// 如果 userId 是片键，这个操作会失败

// ✅ 正确：如果必须改片键，需要重建集合
// 1. 创建新集合，使用新片键
// 2. 迁移数据
// 3. 删除旧集合，重命名新集合
```

### 误区3：忽略 Chunk 大小和均衡

**错误理解：**
"分片后数据会自动均匀分布"

**实际情况：**
- 数据按 Chunk 分配，默认 64MB 一个 Chunk
- 如果片键选择不当，可能导致数据倾斜
- Chunk 均衡需要时间，可能影响性能

**正确做法：**
```javascript
// ✅ 监控 Chunk 分布
sh.status()
// 查看 chunks 是否均匀

// ✅ 调整 Chunk 大小（谨慎使用）
use config
db.settings.updateOne(
  { _id: "chunksize" },
  { $set: { value: 128 } },  // 改为 128MB
  { upsert: true }
);

// ✅ 在业务低峰期进行均衡
sh.startBalancer()
```

### 误区4：认为分片集群不需要索引

**错误理解：**
"数据分散到多个分片，查询自然变快"

**实际情况：**
- 每个分片仍然需要索引来加速查询
- 如果查询不包含片键，需要广播到所有分片（散射-聚集）
- 索引设计在分片集群中同样重要

**正确做法：**
```javascript
// ✅ 在片键字段上创建索引
db.users.createIndex({ userId: 1 });

// ✅ 在常用查询字段上创建索引
db.users.createIndex({ email: 1, createdAt: -1 });

// ✅ 避免散射-聚集查询
// 包含片键的查询：只查询相关分片
db.users.find({ userId: 123 });  // 高效

// 不包含片键的查询：广播到所有分片
db.users.find({ email: "test@example.com" });  // 低效（如果没有索引）
```

### 误区5：认为分片集群的运维很简单

**错误理解：**
"搭建好分片集群就不用管了"

**实际情况：**
- 需要监控 Chunk 均衡状态
- 需要监控各分片的负载
- 需要定期维护配置服务器
- 故障排查更复杂

**正确做法：**
```javascript
// ✅ 定期监控
sh.status();  // 查看集群状态
db.collection.getShardDistribution();  // 查看数据分布

// ✅ 监控均衡器
sh.isBalancerRunning();  // 检查均衡器是否运行

// ✅ 设置告警
// 监控：Chunk 分布不均、均衡器长时间运行、分片负载差异大
```

---

## 动手练习

### 练习1：搭建本地分片集群

**任务：**
在本地搭建一个包含 1 个 Mongos、1 个配置服务器副本集、2 个分片的最小分片集群。

**要求：**
1. 启动配置服务器副本集（3个实例）
2. 启动两个分片（每个分片1个实例即可）
3. 启动 Mongos 路由
4. 添加分片到集群
5. 验证集群状态

<details>
<summary>点击查看答案</summary>

**步骤1：启动配置服务器**

```bash
# 创建数据目录
mkdir -p /data/config1 /data/config2 /data/config3
mkdir -p /data/shard1 /data/shard2

# 启动配置服务器
mongod --configsvr --replSet configRS --port 26017 --dbpath /data/config1
mongod --configsvr --replSet configRS --port 26018 --dbpath /data/config2
mongod --configsvr --replSet configRS --port 26019 --dbpath /data/config3
```

**步骤2：初始化配置服务器副本集**

```javascript
mongo --port 26017

rs.initiate({
  _id: "configRS",
  configsvr: true,
  members: [
    { _id: 0, host: "localhost:26017" },
    { _id: 1, host: "localhost:26018" },
    { _id: 2, host: "localhost:26019" }
  ]
})
```

**步骤3：启动分片**

```bash
# 启动两个分片（简化版，每个分片1个实例）
mongod --shardsvr --replSet shard1RS --port 27017 --dbpath /data/shard1
mongod --shardsvr --replSet shard2RS --port 27027 --dbpath /data/shard2
```

**步骤4：初始化分片副本集**

```javascript
// 初始化第一个分片
mongo --port 27017
rs.initiate({
  _id: "shard1RS",
  members: [
    { _id: 0, host: "localhost:27017" }
  ]
})

// 初始化第二个分片
mongo --port 27027
rs.initiate({
  _id: "shard2RS",
  members: [
    { _id: 0, host: "localhost:27027" }
  ]
})
```

**步骤5：启动 Mongos**

```bash
mongos --port 27037 --configdb configRS/localhost:26017,localhost:26018,localhost:26019
```

**步骤6：添加分片并验证**

```javascript
// 连接到 Mongos
mongo --port 27037

// 添加分片
sh.addShard("shard1RS/localhost:27017")
sh.addShard("shard2RS/localhost:27027")

// 查看状态
sh.status()
// 应该看到两个分片
```

</details>

### 练习2：对集合启用分片

**任务：**
对 `users` 集合启用分片，使用 `userId` 作为 Hashed 片键，并插入测试数据验证分片效果。

**要求：**
1. 创建数据库并启用分片
2. 对 `users` 集合启用分片
3. 插入10000条测试数据
4. 查看数据分布情况

<details>
<summary>点击查看答案</summary>

```javascript
// 连接到 Mongos
mongo --port 27037

// 1. 创建数据库并启用分片
use testdb
sh.enableSharding("testdb")

// 2. 对 users 集合启用分片（Hashed 片键）
sh.shardCollection("testdb.users", { userId: "hashed" })

// 3. 插入测试数据
for (let i = 1; i <= 10000; i++) {
  db.users.insertOne({
    userId: i,
    name: `User${i}`,
    age: Math.floor(Math.random() * 50) + 18,
    createdAt: new Date()
  });
}

// 4. 查看数据分布
sh.status()
// 查看 chunks 部分，应该看到数据分散到两个分片

// 查看详细的分片分布
db.users.getShardDistribution()
// 返回：每个分片的 Chunk 数量、数据大小、文档数量
```

**预期结果：**
- 数据应该均匀分布在两个分片上
- 每个分片大约有 5000 条文档
- Chunk 数量应该比较均衡

</details>

### 练习3：分析查询路由

**任务：**
测试不同查询在分片集群中的路由行为，理解片键对查询性能的影响。

**要求：**
1. 执行包含片键的查询
2. 执行不包含片键的查询
3. 使用 `explain()` 分析查询路由
4. 对比两种查询的性能差异

<details>
<summary>点击查看答案</summary>

```javascript
// 连接到 Mongos
mongo --port 27037
use testdb

// 1. 包含片键的查询（高效）
db.users.find({ userId: 100 }).explain("executionStats");

// 查看输出：
// - shardName: 只显示一个分片
// - totalDocsExamined: 100（只扫描相关文档）
// - 这是"目标查询"，只路由到相关分片

// 2. 不包含片键的查询（低效）
db.users.find({ age: 25 }).explain("executionStats");

// 查看输出：
// - 可能显示多个分片
// - totalDocsExamined: 所有文档
// - 这是"散射-聚集查询"，需要广播到所有分片

// 3. 创建索引优化查询
db.users.createIndex({ age: 1 });

// 再次执行查询
db.users.find({ age: 25 }).explain("executionStats");

// 查看输出：
// - 仍然可能广播到所有分片
// - 但每个分片内部使用索引，速度更快

// 4. 复合查询优化
db.users.createIndex({ userId: 1, age: 1 });

// 包含片键的复合查询
db.users.find({ userId: 100, age: 25 }).explain("executionStats");

// 查看输出：
// - 只路由到一个分片
// - 使用索引，速度最快
```

**分析要点：**
- 包含片键的查询：只查询相关分片（高效）
- 不包含片键的查询：广播到所有分片（低效）
- 索引在每个分片内部仍然重要
- 尽量让查询包含片键字段

</details>

---

## 下一章预告

恭喜你完成了第10章的学习！现在你已经掌握了 MongoDB 分片集群的核心概念，包括：

- 分片架构的组成（Mongos、Config Server、Shard）
- 片键类型和选择原则
- 分片集群的搭建和配置
- 扩容缩容操作
- Chunk 均衡机制

**下一章我们将学习：事务与一致性**

在分布式系统中，如何保证数据的一致性？MongoDB 支持多文档事务吗？我们将学习：

- MongoDB 事务的发展历程
- ACID 在 MongoDB 中的实现
- 会话（Session）和隔离级别
- 事务代码示例
- 何时使用事务

敬请期待第11章：事务与一致性！
