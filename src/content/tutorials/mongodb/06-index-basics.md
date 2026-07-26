---
title: "第6章：索引基础"
description: "单字段索引、复合索引、多键索引、TTL 索引"
---

# 第6章：索引基础

## 本章导读

在开始学习之前，让我们思考几个问题：

1. **为什么查询越来越慢？** 数据量大了之后，每次查询都要扫描所有文档吗？
2. **什么是索引？** 听说索引能加速查询，它到底是怎么工作的？
3. **如何创建索引？** 哪些字段需要建索引？建错了会有问题吗？
4. **如何判断索引是否生效？** 怎么知道查询有没有用到索引？

如果你对这些疑问感到困惑，本章将为你一一解答。

## 为什么需要索引

### 痛点分析

想象你是一家图书馆的管理员，读者来找一本关于"MongoDB"的书：

- **没有索引**：你需要从第一本书开始，一本一本地检查，直到找到为止。如果有10万本书，可能要检查很久
- **有索引**：你先查目录，找到"MongoDB"在哪个书架、哪一层，直接去拿

这就是索引的作用——**快速定位数据，避免全表扫描**。

### 生活化类比

把MongoDB索引想象成**书的目录**：

```
没有索引的查询：
读者："我要找MongoDB的书"
管理员：从第1本书开始，一本本翻看...（全表扫描）

有索引的查询：
读者："我要找MongoDB的书"
管理员：查目录，MongoDB在第3排第5层，直接去拿！（索引查找）
```

### 代码对比

**没有索引的查询**：

```javascript
// 查询年龄为25岁的用户
db.users.find({ age: 25 })
// 问题：扫描100万条文档，逐条检查age字段
// 耗时：可能需要几秒钟
```

**创建索引后的查询**：

```javascript
// 先创建索引
db.users.createIndex({ age: 1 })

// 再查询
db.users.find({ age: 25 })
// 优势：通过索引直接定位，只扫描匹配的文档
// 耗时：几毫秒
```

## 核心原理讲解

### 通俗类比

MongoDB的索引就像**字典的拼音目录**：

1. **单字段索引**：按一个字段排序的目录（如按拼音排序）
2. **复合索引**：按多个字段排序的目录（如先按拼音，再按笔画）
3. **多键索引**：数组字段的索引（如一个字有多个读音，每个读音都记录）
4. **唯一索引**：不允许重复的索引（如身份证号，必须唯一）
5. **TTL索引**：自动过期的索引（如临时通行证，到期自动失效）

### 对比表格

| 索引类型 | 用途 | 创建方式 | 使用场景 |
|---------|------|---------|---------|
| 单字段索引 | 加速单字段查询 | `createIndex({field: 1})` | 常用查询字段 |
| 复合索引 | 加速多字段组合查询 | `createIndex({f1: 1, f2: -1})` | 多条件查询 |
| 多键索引 | 数组字段索引 | 自动创建 | 标签、分类数组 |
| 唯一索引 | 保证字段唯一性 | `createIndex({field: 1}, {unique: true})` | 用户名、邮箱 |
| TTL索引 | 自动删除过期数据 | `createIndex({field: 1}, {expireAfterSeconds: 3600})` | 会话、临时数据 |
| 稀疏索引 | 只为有该字段的文档建索引 | `createIndex({field: 1}, {sparse: true})` | 可选字段 |

## 基础用法与逐行注释

### 1. 单字段索引

```javascript
// 在age字段上创建升序索引
db.users.createIndex({ age: 1 })  // ✅ 正确：1表示升序

// 在age字段上创建降序索引
db.users.createIndex({ age: -1 })  // ✅ 正确：-1表示降序

// 在username字段上创建索引
db.users.createIndex({ username: 1 })  // ✅ 正确

// 错误写法
db.users.createIndex("age")  // ❌ 错误：必须是对象
db.users.createIndex({ age: "asc" })  // ❌ 错误：必须是1或-1
```

### 2. 复合索引

```javascript
// 创建复合索引：先按age升序，再按username降序
db.users.createIndex({
  age: 1,        // 第一字段：age升序
  username: -1   // 第二字段：username降序
})  // ✅ 正确

// 查询时使用复合索引
db.users.find({ age: 25 }).sort({ username: 1 })
// ✅ 可以使用索引

// 最左前缀原则
db.users.find({ username: "admin" })  // ⚠️ 不能使用上面的复合索引
// 原因：复合索引必须从最左字段开始使用
```

### 3. 多键索引（数组字段）

```javascript
// 插入包含数组的文档
db.articles.insertOne({
  title: "MongoDB教程",
  tags: ["mongodb", "database", "nosql"]  // 数组字段
})

// 在tags字段上创建索引
db.articles.createIndex({ tags: 1 })  // ✅ 正确：自动为数组每个元素创建索引

// 查询时使用多键索引
db.articles.find({ tags: "mongodb" })  // ✅ 可以使用索引
```

### 4. 唯一索引

```javascript
// 在email字段上创建唯一索引
db.users.createIndex(
  { email: 1 },
  { unique: true }  // ✅ 正确：保证email唯一
)

// 插入重复数据会报错
db.users.insertOne({ email: "test@example.com" })  // ✅ 成功
db.users.insertOne({ email: "test@example.com" })  // ❌ 报错：重复键

// 错误写法
db.users.createIndex({ email: 1 }, { unique: "true" })  // ❌ 错误：必须是布尔值
```

### 5. TTL索引（自动过期）

```javascript
// 创建TTL索引，3600秒（1小时）后自动删除
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }  // ✅ 正确：1小时后过期
)

// 插入数据
db.sessions.insertOne({
  userId: 123,
  createdAt: new Date()  // ✅ 必须是Date类型
})

// 1小时后，这条数据会被自动删除

// 错误写法
db.sessions.insertOne({
  userId: 123,
  createdAt: "2024-01-01"  // ❌ 错误：必须是Date类型，不能是字符串
})
```

### 6. 稀疏索引

```javascript
// 创建稀疏索引，只为有email字段的文档建索引
db.users.createIndex(
  { email: 1 },
  { sparse: true }  // ✅ 正确：稀疏索引
)

// 插入数据
db.users.insertOne({ username: "user1" })  // 没有email字段
db.users.insertOne({ username: "user2", email: "test@example.com" })

// 稀疏索引只为第二条数据建索引
```

### 7. 索引管理命令

```javascript
// 查看集合的所有索引
db.users.getIndexes()
// ✅ 返回索引数组，包含索引名称、字段等信息

// 删除指定索引
db.users.dropIndex("age_1")  // ✅ 正确：使用索引名称

// 或者使用索引规格删除
db.users.dropIndex({ age: 1 })  // ✅ 正确：使用索引字段

// 删除所有索引（除了_id索引）
db.users.dropIndexes()  // ✅ 正确

// 查看索引大小
db.users.totalIndexSize()  // ✅ 返回索引占用的字节数
```

### 8. explain() 分析查询性能

```javascript
// 使用explain()分析查询
db.users.find({ age: 25 }).explain()

// 关键信息：
// - winningPlan: 查询计划
// - executionStats: 执行统计
//   - totalDocsExamined: 扫描的文档数
//   - totalKeysExamined: 扫描的索引数
//   - executionTimeMillis: 执行时间

// 如果使用了索引
{
  "winningPlan": {
    "stage": "IXSCAN",  // ✅ 使用了索引扫描
    "indexName": "age_1"
  },
  "executionStats": {
    "totalDocsExamined": 10,     // 只扫描了10个文档
    "totalKeysExamined": 10,
    "executionTimeMillis": 1     // 执行时间1毫秒
  }
}

// 如果没有使用索引
{
  "winningPlan": {
    "stage": "COLLSCAN"  // ❌ 全表扫描
  },
  "executionStats": {
    "totalDocsExamined": 1000000,  // 扫描了100万文档
    "totalKeysExamined": 0,        // 没有使用索引
    "executionTimeMillis": 5000    // 执行时间5秒
  }
}
```

## 对比表格

### 索引类型对比

| 索引类型 | 创建方式 | 优点 | 缺点 | 使用场景 |
|---------|---------|------|------|---------|
| 单字段索引 | `createIndex({field: 1})` | 简单，加速单字段查询 | 只能加速一个字段 | 常用查询字段 |
| 复合索引 | `createIndex({f1: 1, f2: -1})` | 加速多字段查询 | 需要遵循最左前缀原则 | 多条件查询 |
| 多键索引 | 自动创建 | 加速数组查询 | 占用空间较大 | 标签、分类数组 |
| 唯一索引 | `createIndex({field: 1}, {unique: true})` | 保证数据唯一性 | 插入性能略降 | 用户名、邮箱 |
| TTL索引 | `createIndex({field: 1}, {expireAfterSeconds: N})` | 自动删除过期数据 | 只能用于Date字段 | 会话、临时数据 |
| 稀疏索引 | `createIndex({field: 1}, {sparse: true})` | 节省空间 | 查询可能不完整 | 可选字段 |

### explain() 输出对比

| 指标 | 有索引 | 无索引 | 说明 |
|-----|-------|-------|------|
| stage | IXSCAN | COLLSCAN | 索引扫描 vs 全表扫描 |
| totalDocsExamined | 少 | 多 | 扫描的文档数 |
| totalKeysExamined | 有值 | 0 | 扫描的索引数 |
| executionTimeMillis | 低 | 高 | 执行时间 |

## 新手常见误区

### 误区1：为每个字段都创建索引

```javascript
// 错误做法
db.users.createIndex({ field1: 1 })
db.users.createIndex({ field2: 1 })
db.users.createIndex({ field3: 1 })
// ❌ 问题：索引占用空间，降低写入性能

// 正确做法
// 只为经常查询的字段创建索引
db.users.createIndex({ email: 1 })  // ✅ 经常用于登录查询
```

### 误区2：忽略最左前缀原则

```javascript
// 创建复合索引
db.users.createIndex({ age: 1, username: 1 })

// 错误查询
db.users.find({ username: "admin" })  // ❌ 不能使用索引

// 正确查询
db.users.find({ age: 25 })  // ✅ 可以使用索引（使用了最左字段）
db.users.find({ age: 25, username: "admin" })  // ✅ 可以使用索引
```

### 误区3：TTL索引用于非Date字段

```javascript
// 错误写法
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }
)
db.sessions.insertOne({
  createdAt: "2024-01-01"  // ❌ 错误：必须是Date类型
})

// 正确写法
db.sessions.insertOne({
  createdAt: new Date()  // ✅ 正确：使用Date对象
})
```

### 误区4：认为索引越多越好

```javascript
// 错误做法：为所有字段创建索引
// 问题：
// 1. 索引占用磁盘空间
// 2. 插入、更新、删除操作变慢（需要更新所有索引）
// 3. 维护成本高

// 正确做法：
// 1. 只为经常查询的字段创建索引
// 2. 使用复合索引代替多个单字段索引
// 3. 定期审查和删除不用的索引
```

### 误区5：忽略索引的排序方向

```javascript
// 创建索引
db.users.createIndex({ age: 1, username: -1 })

// 错误查询：排序方向不匹配
db.users.find().sort({ age: 1, username: 1 })  // ⚠️ 可能无法使用索引

// 正确查询：排序方向与索引一致
db.users.find().sort({ age: 1, username: -1 })  // ✅ 可以使用索引
```

## 动手练习

### 练习1：创建单字段索引

**题目**：为users集合的email字段创建唯一索引，并验证索引是否生效。

<details>
<summary>点击查看答案</summary>

```javascript
// 1. 创建唯一索引
db.users.createIndex(
  { email: 1 },
  { unique: true }
)

// 2. 查看索引是否创建成功
db.users.getIndexes()
// 应该能看到email_1索引

// 3. 验证索引是否生效
db.users.find({ email: "test@example.com" }).explain()
// 查看winningPlan.stage是否为IXSCAN
```

</details>

### 练习2：复合索引与最左前缀

**题目**：创建一个复合索引（age升序，createdAt降序），然后判断以下查询能否使用该索引：
1. `find({ age: 25 })`
2. `find({ createdAt: new Date() })`
3. `find({ age: 25, createdAt: new Date() })`

<details>
<summary>点击查看答案</summary>

```javascript
// 1. 创建复合索引
db.users.createIndex({
  age: 1,
  createdAt: -1
})

// 2. 判断查询是否能使用索引
db.users.find({ age: 25 }).explain()
// ✅ 可以使用索引（使用了最左字段age）

db.users.find({ createdAt: new Date() }).explain()
// ❌ 不能使用索引（没有使用最左字段age）

db.users.find({ age: 25, createdAt: new Date() }).explain()
// ✅ 可以使用索引（使用了age和createdAt）
```

</details>

### 练习3：TTL索引

**题目**：为sessions集合创建一个TTL索引，使数据在2小时后自动过期。

<details>
<summary>点击查看答案</summary>

```javascript
// 1. 创建TTL索引
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 7200 }  // 7200秒 = 2小时
)

// 2. 插入测试数据
db.sessions.insertOne({
  userId: 123,
  createdAt: new Date()  // 必须是Date类型
})

// 3. 2小时后，这条数据会被自动删除
// 注意：MongoDB每60秒检查一次过期数据，所以可能不会立即删除
```

</details>

## 下一章预告

恭喜你完成了本章的学习！现在你已经掌握了MongoDB的索引技术。

在下一章中，我们将学习**聚合管道**，了解如何：
- 理解聚合管道的概念（类比工厂流水线）
- 使用常用阶段：$match, $group, $project, $sort等
- 使用聚合操作符：$sum, $avg, $min, $max等
- 使用$lookup实现关联查询（类似SQL的JOIN）
- 优化聚合管道性能

聚合管道是MongoDB强大的数据处理工具，让我们一起探索！
