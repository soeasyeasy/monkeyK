---
title: "第9章：复制与高可用"
description: "副本集原理、主从切换、选举机制、读写分离"
---

# 第9章：复制与高可用

## 本章导读

### 新手常见疑问

1. **为什么需要复制？单机 MongoDB 不够用吗？**
   - 如果服务器宕机，数据不就丢失了吗？
   - 如何保证服务 24 小时不间断？

2. **副本集是什么？和备份有什么区别？**
   - 副本集能自动切换主节点吗？
   - 数据是怎么同步的？

3. **什么是选举机制？主节点挂了怎么办？**
   - 从节点怎么知道主节点挂了？
   - 选举过程会不会很慢？

4. **读写分离怎么配置？能提高性能吗？**
   - 所有读请求都能分散到从节点吗？
   - 读写分离会不会导致数据不一致？

---

## 为什么需要复制技术

### 痛点分析

想象你经营一个重要的数据库服务：

**单点故障问题：**
- 服务器突然宕机 → 服务完全中断
- 硬盘损坏 → 数据可能丢失
- 网络故障 → 用户无法访问

**性能瓶颈问题：**
- 所有读写请求都压在一台机器上
- 读多写少的场景，单机扛不住
- 备份时影响正常服务

### 生活化类比

把 MongoDB 副本集想象成一个**银行团队**：

- **主节点（Primary）**：柜台经理，负责处理所有业务（写操作）
- **从节点（Secondary）**：后台职员，实时复制经理的操作记录
- **仲裁节点（Arbiter）**：监督员，不处理业务，只在经理出问题时投票选出新经理

**好处：**
- 经理请假了？监督员立即组织投票，选出新经理（自动故障转移）
- 客户查询余额？可以找后台职员处理，不用排队等经理（读写分离）
- 所有职员都有完整的业务记录，数据不会丢失（数据冗余）

### 代码对比

**❌ 没有复制的单机模式：**
```javascript
// 所有操作都在一台机器上
const client = new MongoClient('mongodb://localhost:27017');

// 问题：如果这台机器挂了，整个服务就停了
// 问题：所有读写压力都在这台机器上
await client.db('bank').collection('accounts').insertOne({
  userId: 1,
  balance: 1000
});
```

**✅ 使用副本集的高可用模式：**
```javascript
// 连接到副本集（多个节点）
const client = new MongoClient(
  'mongodb://host1:27017,host2:27017,host3:27017/?replicaSet=myReplicaSet'
);

// 优势：自动故障转移，数据冗余，支持读写分离
const session = client.startSession();
try {
  session.startTransaction();
  await client.db('bank').collection('accounts').insertOne(
    { userId: 1, balance: 1000 },
    { session }
  );
  await session.commitTransaction();
} finally {
  session.endSession();
}
```

---

## 核心原理讲解

### 副本集架构

MongoDB 副本集由三种角色组成：

| 角色 | 职责 | 数量 | 是否存储数据 |
|------|------|------|--------------|
| **Primary（主节点）** | 处理所有写操作，读取操作 | 1个 | 是 |
| **Secondary（从节点）** | 复制主节点数据，可处理读请求 | 0个或多个 | 是 |
| **Arbiter（仲裁节点）** | 参与选举投票，不存储数据 | 0个或1个 | 否 |

### 通俗类比

把副本集想象成一个**微信群**：

- **主节点**：群主，发消息（写操作）给所有人
- **从节点**：群成员，接收并保存群主的消息
- **仲裁节点**：只参与投票的观察者，不保存聊天记录

**工作流程：**
1. 群主发消息 → 所有成员同步接收
2. 群主突然退群 → 成员们投票选出新群主
3. 新群主上任 → 继续发消息，服务不中断

### 选举机制原理

**什么时候触发选举？**
- 主节点宕机
- 主节点与从节点失去联系
- 手动降级主节点

**选举过程：**
```
1. 从节点检测到主节点心跳超时（默认10秒）
2. 从节点发起选举，请求其他节点投票
3. 每个节点投一票给"最新数据"的候选者
4. 获得多数票的节点成为新主节点
5. 新主节点开始处理写请求
```

**选举规则：**
- 必须有**多数节点**参与选举（Quorum）
- 候选者必须有**最新的数据**（oplog 最新）
- 优先级（priority）高的节点更容易当选

### 数据同步机制

**初始同步（Initial Sync）：**
- 新节点加入时，从现有节点完整复制所有数据
- 过程：全量复制 → 应用增量更新 → 完成同步

**增量同步（Replication）：**
- 主节点将写操作记录到 **oplog**（操作日志）
- 从节点定期拉取 oplog 并应用
- 类似 Git 的提交记录同步

**对比表格：**

| 同步方式 | 触发时机 | 数据量 | 耗时 |
|----------|----------|--------|------|
| 初始同步 | 新节点加入 | 全量数据 | 长（小时级） |
| 增量同步 | 持续进行 | 仅变更 | 短（毫秒级） |
| 回滚同步 | 节点恢复 | 差异数据 | 中等 |

---

## 基础用法与实战

### 1. 搭建副本集

**步骤1：启动三个 MongoDB 实例**

```bash
# 启动主节点（端口 27017）
mongod --replSet myReplicaSet --port 27017 --dbpath /data/db1

# 启动从节点1（端口 27018）
mongod --replSet myReplicaSet --port 27018 --dbpath /data/db2

# 启动从节点2（端口 27019）
mongod --replSet myReplicaSet --port 27019 --dbpath /data/db3
```

**步骤2：初始化副本集配置**

```javascript
// 连接到主节点
mongo --port 27017

// 初始化副本集配置
rs.initiate({
  _id: "myReplicaSet",                    // 副本集名称
  members: [
    { _id: 0, host: "localhost:27017" },  // 主节点
    { _id: 1, host: "localhost:27018" },  // 从节点1
    { _id: 2, host: "localhost:27019" }   // 从节点2
  ]
})
```

**步骤3：查看副本集状态**

```javascript
// 查看副本集状态
rs.status()

// 查看副本集配置
rs.conf()

// 查看当前节点角色
db.isMaster()
```

### 2. 读写分离配置

**✅ 正确写法：指定读偏好**

```javascript
const { MongoClient, ReadPreference } = require('mongodb');

const client = new MongoClient(
  'mongodb://host1:27017,host2:27017,host3:27017/?replicaSet=myReplicaSet'
);

// 读偏好设置
const readPrefs = {
  // primary: 只从主节点读（默认，强一致性）
  primary: ReadPreference.PRIMARY,
  
  // primaryPreferred: 优先主节点，主节点不可用时从从节点读
  primaryPreferred: ReadPreference.PRIMARY_PREFERRED,
  
  // secondary: 只从从节点读（读写分离）
  secondary: ReadPreference.SECONDARY,
  
  // secondaryPreferred: 优先从节点，从节点不可用时从主节点读
  secondaryPreferred: ReadPreference.SECONDARY_PREFERRED,
  
  // nearest: 从网络延迟最低的节点读（不考虑角色）
  nearest: ReadPreference.NEAREST
};

// 使用 secondary 读偏好
const collection = client.db('mydb').collection('users')
  .withReadPreference(ReadPreference.SECONDARY);

// 这个查询会从从节点读取
const users = await collection.find({ age: { $gt: 18 } }).toArray();
```

**❌ 错误写法：忽略读偏好**

```javascript
// 问题：默认只从主节点读，无法实现读写分离
const collection = client.db('mydb').collection('users');

// 所有读请求都压在主节点上
const users = await collection.find({}).toArray();
```

### 3. 故障转移测试

**手动切换主节点：**

```javascript
// 连接到当前主节点
mongo --port 27017

// 手动降级主节点（触发选举）
rs.stepDown()

// 主节点会降级为从节点，触发新的选举
```

**模拟主节点故障：**

```bash
# 直接关闭主节点进程
# 从节点会在10秒内检测到故障并发起选举
# 新的主节点会自动选出
```

**验证故障转移：**

```javascript
// 连接到新主节点
mongo --port 27018  // 假设新主节点是27018

// 查看当前角色
db.isMaster()
// 输出会显示 "ismaster: true"
```

### 4. 监控副本集

**常用监控命令：**

```javascript
// 查看副本集状态
rs.status()
// 返回：成员列表、健康状态、同步延迟等

// 查看同步延迟
rs.printReplicationInfo()
// 返回：oplog 大小、时间窗口等

// 查看从节点同步状态
rs.printSecondaryReplicationInfo()
// 返回：各从节点的同步延迟
```

**对比表格：副本集配置方案**

| 配置方案 | 节点数量 | 优点 | 缺点 | 适用场景 |
|----------|----------|------|------|----------|
| 1主1从 | 2 | 成本低，有备份 | 无法自动故障转移（需要多数票） | 开发测试环境 |
| 1主2从 | 3 | 可自动故障转移，读扩展 | 成本中等 | 生产环境（推荐） |
| 1主1从1仲裁 | 3 | 可自动故障转移，成本低 | 仲裁节点不提供数据备份 | 预算有限的生产环境 |
| 1主3从 | 4 | 高读扩展，高可用 | 成本高，同步开销大 | 读密集型应用 |
| 1主2从1仲裁 | 4 | 高可用，成本适中 | 配置复杂 | 大型生产环境 |

---

## 新手常见误区

### 误区1：认为从节点数据总是最新的

**错误理解：**
"从节点和主节点数据完全一致，读从节点没问题"

**实际情况：**
- 从节点同步有延迟（通常毫秒级，但可能秒级）
- 如果刚写入就读取从节点，可能读不到最新数据
- 需要强一致性的读请求，必须读主节点

**正确做法：**
```javascript
// ✅ 需要强一致性：读主节点
const session = client.startSession();
session.startTransaction();
await collection.insertOne({ data: 'test' }, { session });
// 在同一会话中读取，保证一致性
const result = await collection.findOne({ data: 'test' }, { session });
await session.commitTransaction();

// ✅ 可以接受延迟：读从节点
const result = await collection
  .withReadPreference(ReadPreference.SECONDARY)
  .findOne({ data: 'test' });
```

### 误区2：认为仲裁节点可以存储数据

**错误理解：**
"仲裁节点也是节点，应该也能存储数据"

**实际情况：**
- 仲裁节点**不存储数据**，只参与选举投票
- 作用是节省成本（不需要高性能服务器）
- 不能提供读扩展

**正确理解：**
```
仲裁节点的作用：
✅ 参与选举投票，帮助达成多数票
✅ 节省硬件成本
❌ 不存储数据
❌ 不处理读请求
❌ 不能作为数据备份
```

### 误区3：认为副本集节点越多越好

**错误理解：**
"节点越多，性能越好，越安全"

**实际情况：**
- 节点越多，同步开销越大
- 写操作需要等待多数节点确认（节点多，延迟高）
- 管理复杂度增加

**正确做法：**
- 生产环境推荐 3-5 个节点
- 读压力大时，增加从节点或使用读写分离
- 写压力大时，考虑分片集群而不是增加副本集节点

### 误区4：忽略同步延迟问题

**错误理解：**
"读写分离后，读写性能都提升了"

**实际情况：**
- 写操作仍然只在主节点
- 从节点同步有延迟
- 如果业务依赖"写后立即读"，读写分离会导致问题

**正确做法：**
```javascript
// ✅ 场景1：写后立即读（如用户注册后登录）
// 使用主节点读取，或在同一会话中读取

// ✅ 场景2：可以接受延迟（如文章列表、评论展示）
// 使用从节点读取，减轻主节点压力

// ✅ 场景3：混合场景
// 关键业务读主节点，非关键业务读从节点
```

### 误区5：认为故障转移是瞬间完成的

**错误理解：**
"主节点挂了，从节点立即接管"

**实际情况：**
- 检测故障需要时间（默认10秒心跳超时）
- 选举过程需要时间（通常几秒）
- 总故障转移时间：10-30秒

**正确做法：**
- 应用层需要处理连接重试
- 使用连接池，自动重连
- 监控告警，及时发现故障

```javascript
// ✅ 配置重试机制
const client = new MongoClient(uri, {
  retryWrites: true,        // 写操作重试
  retryReads: true,         // 读操作重试
  maxPoolSize: 10,          // 连接池大小
  serverSelectionTimeoutMS: 5000  // 服务器选择超时
});
```

---

## 动手练习

### 练习1：搭建本地副本集

**任务：**
在本地搭建一个包含 1 主 2 从的副本集，并验证数据同步。

**要求：**
1. 启动三个 MongoDB 实例（端口 27017、27018、27019）
2. 初始化副本集配置
3. 在主节点插入数据
4. 在从节点验证数据是否同步

<details>
<summary>点击查看答案</summary>

**步骤1：启动三个实例**

```bash
# 创建数据目录
mkdir -p /data/db1 /data/db2 /data/db3

# 启动实例
mongod --replSet myReplicaSet --port 27017 --dbpath /data/db1
mongod --replSet myReplicaSet --port 27018 --dbpath /data/db2
mongod --replSet myReplicaSet --port 27019 --dbpath /data/db3
```

**步骤2：初始化副本集**

```javascript
// 连接到主节点
mongo --port 27017

// 初始化配置
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})

// 等待选举完成（约10-20秒）
rs.status()
```

**步骤3：插入数据并验证同步**

```javascript
// 在主节点插入数据
mongo --port 27017
use testdb
db.users.insertOne({ name: "Alice", age: 25 })

// 在从节点验证数据
mongo --port 27018
db.getMongo().setSecondaryOk()  // 允许从节点读取
use testdb
db.users.find()
// 应该能看到刚才插入的数据
```

</details>

### 练习2：实现读写分离

**任务：**
使用 Node.js 连接副本集，实现读写分离：写操作在主节点，读操作在从节点。

**要求：**
1. 连接副本集
2. 写操作使用默认主节点
3. 读操作使用从节点
4. 验证读写分离是否生效

<details>
<summary>点击查看答案</summary>

```javascript
const { MongoClient, ReadPreference } = require('mongodb');

async function main() {
  // 连接副本集
  const client = new MongoClient(
    'mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=myReplicaSet'
  );
  
  await client.connect();
  console.log('连接到副本集');
  
  const db = client.db('testdb');
  const collection = db.collection('users');
  
  // 写操作：默认使用主节点
  const result = await collection.insertOne({
    name: 'Bob',
    age: 30,
    createdAt: new Date()
  });
  console.log('写入主节点:', result.insertedId);
  
  // 等待同步（实际应用中不需要）
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 读操作：使用从节点
  const users = await collection
    .withReadPreference(ReadPreference.SECONDARY)
    .find({})
    .toArray();
  console.log('从从节点读取:', users);
  
  // 验证：查看当前连接的节点
  const adminDb = db.admin();
  const primaryInfo = await adminDb.command({ isMaster: 1 });
  console.log('当前连接节点:', primaryInfo.me);
  
  await client.close();
}

main().catch(console.error);
```

**验证方法：**
1. 运行代码，观察写入和读取的节点
2. 使用 `rs.status()` 查看各节点状态
3. 检查从节点是否有数据同步

</details>

### 练习3：模拟故障转移

**任务：**
模拟主节点故障，观察自动故障转移过程。

**要求：**
1. 确认当前主节点
2. 关闭主节点进程
3. 观察从节点选举过程
4. 验证新主节点是否正常工作

<details>
<summary>点击查看答案</summary>

**步骤1：确认当前主节点**

```javascript
// 连接到副本集
mongo --port 27017

// 查看当前主节点
rs.status()
// 查看 "primary" 字段，例如 "localhost:27017"
```

**步骤2：关闭主节点**

```bash
# 假设主节点是 27017
# 在另一个终端关闭主节点进程
# Windows:
taskkill /F /IM mongod.exe /FI "WINDOWTITLE eq *27017*"

# Linux/Mac:
pkill -f "mongod.*27017"
```

**步骤3：观察选举过程**

```javascript
// 连接到从节点
mongo --port 27018

// 持续查看状态
watch -n 1 'mongo --port 27018 --eval "rs.status()"'

// 观察：
// 1. 主节点状态变为 DOWN
// 2. 从节点发起选举
// 3. 新主节点选出（状态变为 PRIMARY）
```

**步骤4：验证新主节点**

```javascript
// 连接到新主节点（假设是 27018）
mongo --port 27018

// 确认角色
db.isMaster()
// 应该显示 "ismaster: true"

// 测试写入
use testdb
db.users.insertOne({ name: "Charlie", age: 35 })
// 应该成功写入
```

**恢复原主节点：**

```bash
# 重新启动原主节点
mongod --replSet myReplicaSet --port 27017 --dbpath /data/db1

# 它会自动作为从节点加入副本集
# 并同步缺失的数据
```

</details>

---

## 下一章预告

恭喜你完成了第9章的学习！现在你已经掌握了 MongoDB 副本集的核心概念，包括：

- 副本集架构和角色
- 选举机制原理
- 数据同步方式
- 读写分离配置
- 故障转移流程

**下一章我们将学习：分片集群**

当数据量太大，单机存储不下时，该怎么办？分片集群可以将数据分散到多台机器上，实现水平扩展。我们将学习：

- 分片架构的组成
- 片键的选择策略
- 配置服务器的作用
- 扩容缩容的操作
- Chunk 迁移与均衡

敬请期待第10章：分片集群！
