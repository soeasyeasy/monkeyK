---
title: "第12章：性能优化"
description: "查询优化、索引策略、内存管理、性能监控"
---

# 第12章：性能优化

## 本章导读

### 新手常见疑问

1. **为什么我的 MongoDB 查询这么慢？**
   - 数据量不大，但查询还是很慢
   - 是不是服务器配置不够？

2. **索引真的能提升性能吗？怎么知道索引有没有用？**
   - 是不是所有字段都应该建索引？
   - 索引多了会不会反而变慢？

3. **怎么监控数据库性能？怎么找到慢查询？**
   - 有没有工具可以分析查询性能？
   - 怎么知道哪些查询需要优化？

4. **MongoDB 的内存是怎么管理的？需要手动优化吗？**
   - WiredTiger 缓存是什么？
   - 内存不够用怎么办？

---

## 为什么需要性能优化

### 痛点分析

随着应用发展，性能问题会逐渐暴露：

**查询性能问题：**
- 数据量从1万增长到100万，查询从10ms变成500ms
- 用户反馈"页面加载太慢"
- 服务器 CPU 占用率飙升

**资源浪费问题：**
- 内存使用率很高，但查询还是很慢
- 磁盘 I/O 频繁，硬盘灯狂闪
- 连接数过多，服务器扛不住

**没有优化的后果：**
- 用户体验差 → 用户流失
- 服务器成本高 → 需要不断扩容
- 系统不稳定 → 频繁宕机

### 生活化类比

把 MongoDB 性能优化想象成**图书馆的运营优化**：

**没有索引的查询：**
- 想找一本关于"Python"的书 → 需要从第一本书开始，一本本翻看
- 100万本书 → 需要看100万次
- 耗时：几分钟到几小时

**有索引的查询：**
- 先查目录卡片 → 直接定位到第3排第5架
- 只需要走到指定位置
- 耗时：几秒钟

**内存优化：**
- 把常用的书放在前台（内存缓存）
- 不常用的书放在仓库（磁盘）
- 减少去仓库取书的次数

**连接池优化：**
- 不是每个读者都配一个专属图书管理员
- 多个读者共享一组管理员
- 提高资源利用率

### 代码对比

**❌ 没有优化的查询：**

```javascript
// 问题：没有索引，全表扫描
const users = await db.collection('users').find({
  age: { $gt: 18 },
  city: 'Beijing',
  status: 'active'
}).toArray();

// 数据量100万时：
// - 扫描100万条文档
// - 耗时：500ms-2s
// - CPU 占用：高
```

**✅ 优化后的查询：**

```javascript
// 创建复合索引
await db.collection('users').createIndex({
  city: 1,
  status: 1,
  age: 1
});

// 使用索引查询
const users = await db.collection('users').find({
  age: { $gt: 18 },
  city: 'Beijing',
  status: 'active'
}).toArray();

// 数据量100万时：
// - 只扫描匹配的文档（可能只有1000条）
// - 耗时：10ms-50ms
// - CPU 占用：低
// - 性能提升：10-50倍
```

---

## 核心原理讲解

### 查询优化原理

**查询计划（Query Plan）：**
MongoDB 在执行查询前，会制定一个执行计划：
1. 分析查询条件
2. 评估可用的索引
3. 选择最优的索引
4. 生成执行计划

**执行统计（Execution Stats）：**
```javascript
// 查看查询的执行计划
db.users.find({ age: 25 }).explain("executionStats");

// 关键指标：
// - executionTimeMillis: 执行时间
// - totalDocsExamined: 扫描的文档数
// - totalKeysExamined: 扫描的索引键数
// - nReturned: 返回的文档数
```

**对比表格：查询类型**

| 查询类型 | 扫描方式 | 性能 | 适用场景 |
|----------|----------|------|----------|
| **全表扫描（COLLSCAN）** | 扫描所有文档 | 差 | 小表、无索引 |
| **索引扫描（IXSCAN）** | 扫描索引 | 好 | 有索引的查询 |
| **覆盖查询（COVERED）** | 只扫描索引 | 最好 | 查询字段都在索引中 |

### 索引策略

**索引类型：**

```javascript
// 1. 单字段索引
db.users.createIndex({ email: 1 });

// 2. 复合索引
db.users.createIndex({ city: 1, age: -1 });

// 3. 多键索引（数组字段）
db.users.createIndex({ tags: 1 });

// 4. 文本索引
db.users.createIndex({ name: "text" });

// 5. 哈希索引
db.users.createIndex({ userId: "hashed" });

// 6. TTL 索引（自动过期）
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
```

**索引选择原则：**

```javascript
// ✅ 好的索引策略
// 1. 等值查询字段在前，范围查询字段在后
db.users.createIndex({ city: 1, age: 1 });  // city 等值，age 范围

// 2. 选择性高的字段在前
db.users.createIndex({ email: 1, status: 1 });  // email 选择性高

// 3. 覆盖查询（所有查询字段都在索引中）
db.users.createIndex({ city: 1, status: 1, age: 1 });
// 查询：{ city: 'Beijing', status: 'active', age: 25 }
// 只需要索引，不需要回表

// ❌ 差的索引策略
// 1. 范围查询字段在前
db.users.createIndex({ age: 1, city: 1 });  // age 范围，city 等值（低效）

// 2. 选择性低的字段
db.users.createIndex({ gender: 1, status: 1 });  // gender 只有男/女

// 3. 过多索引
// 每个索引都会增加写入开销和存储空间
```

**对比表格：索引策略**

| 策略 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| **单字段索引** | 一个字段一个索引 | 简单 | 复合查询效率低 |
| **复合索引** | 多个字段组合 | 复合查询高效 | 顺序很重要 |
| **覆盖查询** | 查询字段都在索引中 | 最快 | 索引较大 |
| **前缀原则** | 复合索引的前缀可用 | 索引复用 | 需要理解原理 |

### 内存管理

**WiredTiger 缓存：**
MongoDB 使用 WiredTiger 存储引擎，默认使用 50% 内存作为缓存。

```javascript
// 查看缓存统计
db.serverStatus().wiredTiger.cache

// 关键指标：
// - "bytes currently in the cache": 当前缓存大小
// - "pages read into cache": 读入缓存的页数
// - "pages written from cache": 从缓存写出的页数
```

**缓存工作原理：**
1. 读取数据时，先检查缓存
2. 缓存命中 → 直接返回（快）
3. 缓存未命中 → 从磁盘读取 → 放入缓存
4. 缓存满时，淘汰最久未使用的数据

**内存优化建议：**
```javascript
// ✅ 配置缓存大小（mongod.conf）
storageEngine:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 8  // 根据服务器内存调整

// ✅ 监控缓存命中率
// 命中率 = 1 - (pages read from disk / total loads)
// 命中率 > 95% 表示缓存充足
```

### 性能监控工具

**1. mongostat：实时监控**

```bash
# 启动 mongostat
mongostat --host localhost --port 27017

# 输出示例：
# insert  query update delete getmore command flushes mapped  vsize    res faults
#    *0     *0     *0     *0       0     1|0       0     0B   1.2G   512M      0
#    *0     *0     *0     *0       0     1|0       0     0B   1.2G   512M      0

# 关键指标：
# - insert/query/update/delete: 每秒操作数
# - faults: 缺页中断次数（高表示内存不足）
# - res: 物理内存使用
```

**2. mongotop：监控读写时间**

```bash
# 启动 mongotop
mongotop --host localhost --port 27017

# 输出示例：
#                    ns    total    read    write
#   testdb.users     50      30       20
#   testdb.orders    30      20       10

# 关键指标：
# - total: 总耗时（毫秒）
# - read/write: 读写耗时
# - 找出耗时最高的集合
```

**3. MongoDB Atlas：云监控**

```javascript
// MongoDB Atlas 提供：
// - 实时性能图表
// - 慢查询日志
// - 自动建议优化
// - 告警通知
```

**对比表格：监控工具**

| 工具 | 类型 | 优点 | 缺点 |
|------|------|------|------|
| **mongostat** | 命令行 | 实时、简单 | 信息有限 |
| **mongotop** | 命令行 | 找出热点集合 | 信息有限 |
| **MongoDB Atlas** | Web界面 | 功能全面、可视化 | 需要付费 |
| **explain()** | 内置 | 详细执行计划 | 单次查询 |

---

## 基础用法与实战

### 1. 使用 explain() 分析查询

**基本用法：**

```javascript
// 分析查询性能
db.users.find({ age: 25, city: 'Beijing' }).explain("executionStats");

// 输出结构：
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "IXSCAN",  // 使用索引扫描
      "indexName": "age_1_city_1"
    }
  },
  "executionStats": {
    "executionTimeMillis": 15,        // 执行时间
    "totalDocsExamined": 100,         // 扫描的文档数
    "totalKeysExamined": 100,         // 扫描的索引键数
    "nReturned": 100                  // 返回的文档数
  }
}
```

**分析指标：**

```javascript
// ✅ 好的查询
{
  "executionStats": {
    "executionTimeMillis": 10,
    "totalDocsExamined": 100,
    "totalKeysExamined": 100,
    "nReturned": 100
  }
}
// 分析：
// - 执行时间短（10ms）
// - 扫描的文档数 = 返回的文档数（100 = 100）
// - 没有浪费扫描

// ❌ 差的查询
{
  "executionStats": {
    "executionTimeMillis": 500,
    "totalDocsExamined": 1000000,
    "totalKeysExamined": 0,
    "nReturned": 100
  }
}
// 分析：
// - 执行时间长（500ms）
// - 扫描了100万文档，只返回100条
// - 没有使用索引（totalKeysExamined = 0）
// - 需要优化
```

**对比表格：explain 输出阶段**

| 阶段 | 说明 | 优化建议 |
|------|------|----------|
| **COLLSCAN** | 全表扫描 | 创建索引 |
| **IXSCAN** | 索引扫描 | 检查索引是否最优 |
| **FETCH** | 回表查询 | 考虑覆盖查询 |
| **SORT** | 排序 | 使用索引排序 |

### 2. 创建和优化索引

**创建索引：**

```javascript
// 1. 单字段索引
db.users.createIndex({ email: 1 });

// 2. 复合索引（遵循等值在前，范围在后）
db.users.createIndex({ city: 1, status: 1, age: 1 });

// 3. 唯一索引
db.users.createIndex({ email: 1 }, { unique: true });

// 4. 部分索引（只索引部分数据）
db.users.createIndex(
  { status: 1 },
  { partialFilterExpression: { status: { $eq: 'active' } } }
);

// 5. 稀疏索引（只索引存在的字段）
db.users.createIndex({ phone: 1 }, { sparse: true });
```

**索引管理：**

```javascript
// 查看所有索引
db.users.getIndexes();

// 删除索引
db.users.dropIndex("email_1");

// 删除所有索引（除了 _id）
db.users.dropIndexes();

// 重建索引
db.users.reIndex();
```

**索引优化示例：**

```javascript
// 查询
db.users.find({
  city: 'Beijing',
  status: 'active',
  age: { $gt: 18 }
}).sort({ createdAt: -1 });

// ❌ 差的索引
db.users.createIndex({ age: 1 });
// 问题：只优化了 age 字段，其他字段还是全表扫描

// ✅ 好的索引
db.users.createIndex({ city: 1, status: 1, age: 1, createdAt: -1 });
// 优点：
// - 覆盖所有查询字段
// - 支持排序（createdAt）
// - 可能实现覆盖查询
```

### 3. 慢查询分析

**启用性能分析器：**

```javascript
// 设置性能分析级别
// 0: 关闭
// 1: 只记录慢查询（默认100ms）
// 2: 记录所有操作

db.setProfilingLevel(1, { slowms: 100 });

// 查看慢查询日志
db.system.profile.find().sort({ ts: -1 }).limit(10);

// 输出示例：
{
  "op": "query",
  "ns": "testdb.users",
  "command": {
    "find": "users",
    "filter": { "age": 25 }
  },
  "millis": 150,  // 执行时间
  "ts": ISODate("2024-01-01T10:00:00Z")
}
```

**分析慢查询：**

```javascript
// 找出最慢的查询
db.system.profile.find()
  .sort({ millis: -1 })
  .limit(5)
  .forEach(doc => {
    print(`耗时: ${doc.millis}ms, 集合: ${doc.ns}`);
    printjson(doc.command);
  });

// 统计慢查询数量
db.system.profile.count({ millis: { $gt: 100 } });
```

### 4. 连接池优化

**配置连接池：**

```javascript
const { MongoClient } = require('mongodb');

// ✅ 正确的连接池配置
const client = new MongoClient('mongodb://localhost:27017', {
  maxPoolSize: 20,           // 最大连接数
  minPoolSize: 5,            // 最小连接数
  maxIdleTimeMS: 30000,      // 连接最大空闲时间
  waitQueueTimeoutMS: 5000   // 等待连接超时
});

// ❌ 错误的配置
const client = new MongoClient('mongodb://localhost:27017', {
  maxPoolSize: 1000  // 连接数过多，浪费资源
});
```

**连接池监控：**

```javascript
// 查看连接池状态
db.serverStatus().connections

// 输出：
{
  "current": 15,      // 当前连接数
  "available": 5,     // 可用连接数
  "totalCreated": 100 // 总共创建的连接数
}
```

### 5. 写入优化

**批量写入：**

```javascript
// ❌ 逐条写入（慢）
for (let i = 0; i < 10000; i++) {
  await db.users.insertOne({
    name: `User${i}`,
    age: Math.floor(Math.random() * 50)
  });
}
// 耗时：10-30秒

// ✅ 批量写入（快）
const users = [];
for (let i = 0; i < 10000; i++) {
  users.push({
    name: `User${i}`,
    age: Math.floor(Math.random() * 50)
  });
}

await db.users.insertMany(users, { ordered: false });
// 耗时：1-3秒
// 性能提升：5-10倍
```

**Write Concern 配置：**

```javascript
// Write Concern 控制写入确认级别

// 1. w: 1 - 只等待主节点确认（最快，可能丢失）
await db.users.insertOne(
  { name: 'Alice' },
  { writeConcern: { w: 1 } }
);

// 2. w: 'majority' - 等待多数节点确认（安全，较慢）
await db.users.insertOne(
  { name: 'Alice' },
  { writeConcern: { w: 'majority' } }
);

// 3. w: 0 - 不等待确认（最快，不保证成功）
await db.users.insertOne(
  { name: 'Alice' },
  { writeConcern: { w: 0 } }
);

// 4. j: true - 等待写入日志（最安全，最慢）
await db.users.insertOne(
  { name: 'Alice' },
  { writeConcern: { w: 1, j: true } }
);
```

**对比表格：Write Concern**

| 配置 | 性能 | 安全性 | 适用场景 |
|------|------|--------|----------|
| **w: 0** | 最快 | 最低 | 日志、临时数据 |
| **w: 1** | 快 | 中等 | 一般业务 |
| **w: majority** | 慢 | 高 | 关键业务 |
| **w: all** | 最慢 | 最高 | 金融、医疗 |

---

## 新手常见误区

### 误区1：认为索引越多越好

**错误理解：**
"给所有字段都建索引，查询肯定快"

**实际情况：**
- 每个索引都会增加写入开销
- 索引占用额外的存储空间
- 过多的索引会降低写入性能

**正确做法：**
```javascript
// ❌ 错误：过多索引
db.users.createIndex({ name: 1 });
db.users.createIndex({ age: 1 });
db.users.createIndex({ city: 1 });
db.users.createIndex({ status: 1 });
db.users.createIndex({ email: 1 });
// 问题：5个单字段索引，写入时需要维护5个索引

// ✅ 正确：根据查询模式创建索引
// 查询1：{ city: 'Beijing', status: 'active' }
db.users.createIndex({ city: 1, status: 1 });

// 查询2：{ email: 'test@example.com' }
db.users.createIndex({ email: 1 });

// 总共2个复合索引，覆盖所有查询
```

### 误区2：认为 explain() 只用于查询优化

**错误理解：**
"explain() 只用来分析 find 查询"

**实际情况：**
- explain() 可以用于所有操作（insert、update、delete）
- 可以分析索引使用情况
- 可以比较不同执行计划

**正确做法：**
```javascript
// ✅ 分析更新操作
db.users.updateOne(
  { email: 'test@example.com' },
  { $set: { age: 30 } }
).explain("executionStats");

// ✅ 分析删除操作
db.users.deleteOne({
  email: 'test@example.com'
}).explain("executionStats");

// ✅ 比较不同索引
db.users.find({ age: 25 }).hint({ age: 1 }).explain("executionStats");
db.users.find({ age: 25 }).hint({ city: 1, age: 1 }).explain("executionStats");
```

### 误区3：忽略内存配置

**错误理解：**
"MongoDB 会自动管理内存，不用管"

**实际情况：**
- 默认缓存大小可能不适合所有场景
- 内存不足会导致频繁磁盘 I/O
- 需要根据服务器配置调整

**正确做法：**
```yaml
# mongod.conf 配置
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 8  # 根据服务器内存调整

# 建议：
# - 专用数据库服务器：60-70% 物理内存
# - 混合部署服务器：30-40% 物理内存
# - 监控缓存命中率，保持在 95% 以上
```

### 误区4：认为批量写入不需要控制大小

**错误理解：**
"批量写入越快越好，一次性插入所有数据"

**实际情况：**
- 批量太大可能导致内存溢出
- 批量太大会增加失败风险
- 需要平衡性能和稳定性

**正确做法：**
```javascript
// ❌ 错误：批量太大
const allUsers = [];  // 100万条数据
for (let i = 0; i < 1000000; i++) {
  allUsers.push({ name: `User${i}` });
}
await db.users.insertMany(allUsers);
// 问题：内存溢出，操作失败

// ✅ 正确：分批写入
const batchSize = 10000;
for (let i = 0; i < 1000000; i += batchSize) {
  const batch = allUsers.slice(i, i + batchSize);
  await db.users.insertMany(batch);
}
// 优点：内存占用稳定，失败风险低
```

### 误区5：认为性能优化是一次性的工作

**错误理解：**
"优化完就不用管了"

**实际情况：**
- 数据量增长，性能会下降
- 查询模式变化，索引可能失效
- 需要持续监控和优化

**正确做法：**
```javascript
// ✅ 定期监控
// 1. 每天查看慢查询日志
// 2. 每周分析性能指标
// 3. 每月优化索引

// ✅ 设置告警
// - 查询时间 > 100ms
// - 缓存命中率 < 90%
// - 连接数 > 80%

// ✅ 自动化优化
// - 自动重建碎片化的索引
// - 自动清理过期数据
// - 自动扩展资源
```

---

## 动手练习

### 练习1：分析和优化慢查询

**任务：**
找出一个慢查询，分析原因，并通过创建索引优化性能。

**要求：**
1. 插入10万条测试数据
2. 执行一个没有索引的查询
3. 使用 explain() 分析查询
4. 创建合适的索引
5. 再次分析查询，对比性能提升

<details>
<summary>点击查看答案</summary>

```javascript
const { MongoClient } = require('mongodb');

async function optimizeQuery() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('test');
    const collection = db.collection('products');
    
    // 1. 清空并插入测试数据
    await collection.deleteMany({});
    
    const products = [];
    for (let i = 0; i < 100000; i++) {
      products.push({
        name: `Product${i}`,
        category: `Category${i % 10}`,
        price: Math.floor(Math.random() * 1000),
        stock: Math.floor(Math.random() * 100),
        createdAt: new Date()
      });
    }
    
    await collection.insertMany(products);
    console.log('插入10万条数据完成');
    
    // 2. 执行没有索引的查询
    console.log('\n=== 优化前 ===');
    const beforeExplain = await collection.find({
      category: 'Category5',
      price: { $gt: 500 },
      stock: { $lt: 50 }
    }).explain("executionStats");
    
    console.log('执行时间:', beforeExplain.executionStats.executionTimeMillis, 'ms');
    console.log('扫描文档数:', beforeExplain.executionStats.totalDocsExamined);
    console.log('返回文档数:', beforeExplain.executionStats.nReturned);
    console.log('执行阶段:', beforeExplain.queryPlanner.winningPlan.stage);
    
    // 3. 创建复合索引
    await collection.createIndex({
      category: 1,
      price: 1,
      stock: 1
    });
    console.log('\n创建索引完成');
    
    // 4. 再次分析查询
    console.log('\n=== 优化后 ===');
    const afterExplain = await collection.find({
      category: 'Category5',
      price: { $gt: 500 },
      stock: { $lt: 50 }
    }).explain("executionStats");
    
    console.log('执行时间:', afterExplain.executionStats.executionTimeMillis, 'ms');
    console.log('扫描文档数:', afterExplain.executionStats.totalDocsExamined);
    console.log('返回文档数:', afterExplain.executionStats.nReturned);
    console.log('执行阶段:', afterExplain.queryPlanner.winningPlan.stage);
    
    // 5. 对比性能
    const improvement = (
      (beforeExplain.executionStats.executionTimeMillis /
       afterExplain.executionStats.executionTimeMillis)
    ).toFixed(2);
    
    console.log('\n=== 性能对比 ===');
    console.log(`性能提升: ${improvement}倍`);
    
  } finally {
    await client.close();
  }
}

optimizeQuery().catch(console.error);
```

</details>

### 练习2：实现覆盖查询

**任务：**
创建一个覆盖查询，使得查询只需要索引，不需要回表。

**要求：**
1. 创建合适的复合索引
2. 编写查询，确保所有查询字段都在索引中
3. 使用 explain() 验证是否为覆盖查询

<details>
<summary>点击查看答案</summary>

```javascript
const { MongoClient } = require('mongodb');

async function coveredQuery() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('test');
    const collection = db.collection('users');
    
    // 清空并插入测试数据
    await collection.deleteMany({});
    
    const users = [];
    for (let i = 0; i < 10000; i++) {
      users.push({
        email: `user${i}@example.com`,
        city: `City${i % 5}`,
        status: i % 2 === 0 ? 'active' : 'inactive',
        age: 18 + (i % 50)
      });
    }
    
    await collection.insertMany(users);
    
    // 创建复合索引
    await collection.createIndex({
      city: 1,
      status: 1,
      age: 1
    });
    
    // ✅ 覆盖查询：所有查询字段都在索引中
    console.log('\n=== 覆盖查询 ===');
    const coveredExplain = await collection.find(
      { city: 'City1', status: 'active', age: 25 },
      { projection: { _id: 0, city: 1, status: 1, age: 1 } }  // 只返回索引字段
    ).explain("executionStats");
    
    console.log('执行阶段:', coveredExplain.queryPlanner.winningPlan.stage);
    console.log('扫描文档数:', coveredExplain.executionStats.totalDocsExamined);
    console.log('扫描索引数:', coveredExplain.executionStats.totalKeysExamined);
    
    // 如果是覆盖查询：
    // - totalDocsExamined = 0（不需要回表）
    // - totalKeysExamined = nReturned（只扫描索引）
    
    if (coveredExplain.executionStats.totalDocsExamined === 0) {
      console.log('✓ 这是覆盖查询！');
    } else {
      console.log('✗ 这不是覆盖查询');
    }
    
    // ❌ 非覆盖查询：需要返回索引外的字段
    console.log('\n=== 非覆盖查询 ===');
    const nonCoveredExplain = await collection.find(
      { city: 'City1', status: 'active', age: 25 },
      { projection: { _id: 0, email: 1 } }  // 返回索引外的字段
    ).explain("executionStats");
    
    console.log('执行阶段:', nonCoveredExplain.queryPlanner.winningPlan.stage);
    console.log('扫描文档数:', nonCoveredExplain.executionStats.totalDocsExamined);
    console.log('扫描索引数:', nonCoveredExplain.executionStats.totalKeysExamined);
    
    if (nonCoveredExplain.executionStats.totalDocsExamined > 0) {
      console.log('✓ 这是非覆盖查询（需要回表）');
    }
    
  } finally {
    await client.close();
  }
}

coveredQuery().catch(console.error);
```

</details>

### 练习3：批量写入性能测试

**任务：**
对比逐条写入和批量写入的性能差异，并测试不同批量大小的效果。

**要求：**
1. 逐条写入1万条数据，记录耗时
2. 批量写入1万条数据（批量1000），记录耗时
3. 批量写入1万条数据（批量5000），记录耗时
4. 对比性能差异

<details>
<summary>点击查看答案</summary>

```javascript
const { MongoClient } = require('mongodb');

async function benchmarkWrites() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('test');
    const collection = db.collection('logs');
    
    const totalRecords = 10000;
    
    // 测试1：逐条写入
    console.log('=== 测试1：逐条写入 ===');
    await collection.deleteMany({});
    
    const start1 = Date.now();
    for (let i = 0; i < totalRecords; i++) {
      await collection.insertOne({
        index: i,
        data: `Log data ${i}`,
        timestamp: new Date()
      });
    }
    const time1 = Date.now() - start1;
    console.log(`逐条写入 ${totalRecords} 条: ${time1}ms`);
    
    // 测试2：批量写入（批量1000）
    console.log('\n=== 测试2：批量写入（批量1000） ===');
    await collection.deleteMany({});
    
    const start2 = Date.now();
    const batchSize1 = 1000;
    
    for (let i = 0; i < totalRecords; i += batchSize1) {
      const batch = [];
      for (let j = 0; j < batchSize1 && i + j < totalRecords; j++) {
        batch.push({
          index: i + j,
          data: `Log data ${i + j}`,
          timestamp: new Date()
        });
      }
      await collection.insertMany(batch, { ordered: false });
    }
    
    const time2 = Date.now() - start2;
    console.log(`批量写入 ${totalRecords} 条（批量${batchSize1}）: ${time2}ms`);
    
    // 测试3：批量写入（批量5000）
    console.log('\n=== 测试3：批量写入（批量5000） ===');
    await collection.deleteMany({});
    
    const start3 = Date.now();
    const batchSize2 = 5000;
    
    for (let i = 0; i < totalRecords; i += batchSize2) {
      const batch = [];
      for (let j = 0; j < batchSize2 && i + j < totalRecords; j++) {
        batch.push({
          index: i + j,
          data: `Log data ${i + j}`,
          timestamp: new Date()
        });
      }
      await collection.insertMany(batch, { ordered: false });
    }
    
    const time3 = Date.now() - start3;
    console.log(`批量写入 ${totalRecords} 条（批量${batchSize2}）: ${time3}ms`);
    
    // 性能对比
    console.log('\n=== 性能对比 ===');
    console.log(`逐条写入: ${time1}ms`);
    console.log(`批量1000: ${time2}ms (提升${(time1/time2).toFixed(2)}倍)`);
    console.log(`批量5000: ${time3}ms (提升${(time1/time3).toFixed(2)}倍)`);
    
  } finally {
    await client.close();
  }
}

benchmarkWrites().catch(console.error);
```

**预期结果：**
- 逐条写入：10-30秒
- 批量1000：1-3秒（提升5-10倍）
- 批量5000：0.5-2秒（提升10-20倍）

</details>

---

## 总结与下一步

恭喜你完成了 MongoDB 性能优化的学习！现在你已经掌握了：

- **查询优化**：使用 explain() 分析查询计划，找出性能瓶颈
- **索引策略**：创建合适的索引，实现覆盖查询
- **内存管理**：理解 WiredTiger 缓存机制
- **性能监控**：使用 mongostat、mongotop 等工具
- **慢查询分析**：启用性能分析器，找出慢查询
- **写入优化**：批量写入、合理配置 Write Concern

**性能优化核心原则：**
1. 先监控，后优化
2. 索引是性能的关键
3. 批量操作优于逐条操作
4. 持续监控，持续优化

**下一步学习建议：**
- 实践本章的练习题
- 在生产环境中应用优化技巧
- 学习 MongoDB Atlas 的高级监控功能
- 研究分片集群的性能优化

现在你已经完成了整个 MongoDB 教程系列的学习，从基础到高级，从单机到分布式系统。希望你能将所学知识应用到实际项目中，构建高性能、高可用的数据库应用！
