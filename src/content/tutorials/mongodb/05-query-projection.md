---
title: "第5章：条件查询与投影"
description: "查询操作符、投影、排序、分页、聚合基础"
---

# 第5章：条件查询与投影

## 本章导读

在开始学习之前，让我们思考几个问题：

1. **如何在MongoDB中查找年龄大于25岁的用户？** 是不是只能用 `find({age: 25})` 这样的精确匹配？
2. **查询结果包含很多字段，但我只需要用户名和邮箱，怎么办？** 难道要把整个文档都取出来再手动筛选吗？
3. **如何实现分页功能？** 比如每页显示10条数据，如何获取第2页的数据？
4. **如何查找包含特定标签的文章？** 比如查找同时包含"MongoDB"和"数据库"标签的文档。

如果你对这些疑问感到困惑，本章将为你一一解答。

## 为什么需要条件查询与投影

### 痛点分析

想象你是一家图书馆的管理员，读者来找书：

- **没有条件查询**：读者说"我要找编程相关的书"，你只能把所有书都搬出来让他自己挑
- **没有投影**：读者只需要书名和作者，你却把整本书的详细信息（出版社、ISBN、页数、价格）都抄给他
- **没有排序和分页**：1000本书一次性全给他，让他自己翻找

这就是为什么我们需要条件查询与投影——**精确、高效、按需获取数据**。

### 生活化类比

把MongoDB查询想象成在餐厅点餐：

```
传统查询（无条件查询）：
顾客："我想吃辣的"
服务员：把所有菜都端上来，您自己挑

条件查询：
顾客："我想吃辣的川菜，价格在50-100元之间"
服务员：精准推荐水煮鱼、麻婆豆腐

投影：
顾客："我只需要菜名和价格，不需要做法"
服务员：只给您菜单摘要，不给您完整食谱
```

### 代码对比

**没有条件查询的写法**：

```javascript
// 查询所有用户
db.users.find()
// 返回1000条数据，包含所有字段
// 问题：数据量太大，包含很多不需要的信息
```

**使用条件查询和投影**：

```javascript
// 查询年龄大于25岁的用户，只返回用户名和邮箱
db.users.find(
  { age: { $gt: 25 } },  // 条件：年龄大于25
  { username: 1, email: 1, _id: 0 }  // 投影：只返回这些字段
)
// 返回精确的结果，只包含需要的字段
```

## 核心原理讲解

### 通俗类比

MongoDB的查询系统就像一套**智能筛选器**：

1. **比较操作符**：相当于"大于"、"小于"、"等于"这样的比较规则
2. **逻辑操作符**：相当于"并且"、"或者"、"非"这样的逻辑组合
3. **元素操作符**：检查字段是否存在、字段类型是什么
4. **数组操作符**：专门处理数组字段的查询
5. **投影**：控制返回哪些字段，相当于"只看摘要"还是"看全文"

### 对比表格

| 操作符类型 | 用途 | 常见操作符 | 使用场景 |
|-----------|------|-----------|---------|
| 比较操作符 | 数值、日期比较 | $eq, $gt, $lt, $in | 年龄范围、价格区间 |
| 逻辑操作符 | 组合多个条件 | $and, $or, $not | 复杂条件组合 |
| 元素操作符 | 检查字段存在性 | $exists, $type | 可选字段查询 |
| 数组操作符 | 数组元素匹配 | $all, $elemMatch, $size | 标签、分类查询 |

## 基础用法与逐行注释

### 1. 比较操作符

#### $eq（等于）

```javascript
// 查询年龄等于25岁的用户
db.users.find({
  age: { $eq: 25 }  // ✅ 正确：age字段等于25
})

// 错误写法
db.users.find({
  age: { $eq: "25" }  // ❌ 错误：类型不匹配，25是数字，"25"是字符串
})
```

#### $gt 和 $gte（大于/大于等于）

```javascript
// 查询年龄大于25岁的用户
db.users.find({
  age: { $gt: 25 }  // ✅ 正确：age > 25
})

// 查询年龄大于等于25岁的用户
db.users.find({
  age: { $gte: 25 }  // ✅ 正确：age >= 25
})
```

#### $lt 和 $lte（小于/小于等于）

```javascript
// 查询年龄小于30岁的用户
db.users.find({
  age: { $lt: 30 }  // ✅ 正确：age < 30
})

// 查询年龄在25到30之间（包含25和30）
db.users.find({
  age: { $gte: 25, $lte: 30 }  // ✅ 正确：25 <= age <= 30
})
```

#### $ne（不等于）

```javascript
// 查询状态不是"inactive"的用户
db.users.find({
  status: { $ne: "inactive" }  // ✅ 正确：status != "inactive"
})
```

#### $in 和 $nin（在/不在数组中）

```javascript
// 查询年龄是25、30或35岁的用户
db.users.find({
  age: { $in: [25, 30, 35] }  // ✅ 正确：age是25、30或35之一
})

// 查询状态不是"active"或"pending"的用户
db.users.find({
  status: { $nin: ["active", "pending"] }  // ✅ 正确：status不在这些值中
})

// 错误写法
db.users.find({
  age: { $in: 25 }  // ❌ 错误：$in后面必须是数组
})
```

### 2. 逻辑操作符

#### $and（并且）

```javascript
// 查询年龄大于25岁且状态为active的用户
db.users.find({
  $and: [
    { age: { $gt: 25 } },      // 条件1：age > 25
    { status: "active" }       // 条件2：status = "active"
  ]
})

// 简化写法（多个条件默认是AND关系）
db.users.find({
  age: { $gt: 25 },            // ✅ 推荐：隐式AND
  status: "active"
})
```

#### $or（或者）

```javascript
// 查询年龄小于20岁或大于60岁的用户
db.users.find({
  $or: [
    { age: { $lt: 20 } },      // 条件1：age < 20
    { age: { $gt: 60 } }       // 条件2：age > 60
  ]
})

// 错误写法
db.users.find({
  age: { $or: [{$lt: 20}, {$gt: 60}] }  // ❌ 错误：$or不能这样嵌套
})
```

#### $not（非）

```javascript
// 查询年龄不大于30岁的用户（即年龄<=30）
db.users.find({
  age: { $not: { $gt: 30 } }  // ✅ 正确：NOT(age > 30)
})
```

#### $nor（都不满足）

```javascript
// 查询既不满足age<20也不满足age>60的用户
db.users.find({
  $nor: [
    { age: { $lt: 20 } },      // 不满足条件1
    { age: { $gt: 60 } }       // 不满足条件2
  ]
})
// 相当于：20 <= age <= 60
```

### 3. 元素操作符

#### $exists（字段存在）

```javascript
// 查询有email字段的用户
db.users.find({
  email: { $exists: true }  // ✅ 正确：email字段存在
})

// 查询没有phone字段的用户
db.users.find({
  phone: { $exists: false }  // ✅ 正确：phone字段不存在
})
```

#### $type（字段类型）

```javascript
// 查询age字段是数字类型的用户
db.users.find({
  age: { $type: "number" }  // ✅ 正确：age是数字类型
})

// 查询age字段是双精度浮点数
db.users.find({
  age: { $type: "double" }  // ✅ 正确：age是double类型
})

// 也可以用数字表示类型
db.users.find({
  age: { $type: 1 }  // ✅ 正确：1表示double类型
})
```

### 4. 数组操作符

#### $all（包含所有元素）

```javascript
// 查询同时包含"MongoDB"和"数据库"标签的文章
db.articles.find({
  tags: { $all: ["MongoDB", "数据库"] }  // ✅ 正确：tags必须同时包含这两个值
})

// 错误写法
db.articles.find({
  tags: { $all: "MongoDB" }  // ❌ 错误：$all后面必须是数组
})
```

#### $elemMatch（数组元素匹配）

```javascript
// 查询成绩数组中至少有一个元素大于90且小于100的学生
db.students.find({
  scores: {
    $elemMatch: {
      $gt: 90,    // 数组元素 > 90
      $lt: 100    // 且数组元素 < 100
    }
  }
})

// 查询对象数组中满足条件的文档
db.orders.find({
  items: {
    $elemMatch: {
      product: " laptop ",  // 数组中某个对象的product字段
      price: { $gt: 5000 }  // 且price字段 > 5000
    }
  }
})
```

#### $size（数组长度）

```javascript
// 查询恰好有3个标签的文章
db.articles.find({
  tags: { $size: 3 }  // ✅ 正确：tags数组长度为3
})

// 错误写法：$size不能与其他操作符组合
db.articles.find({
  tags: { $size: { $gt: 3 } }  // ❌ 错误：$size不支持范围查询
})
```

### 5. 投影（Projection）

```javascript
// 查询用户，只返回username和email字段
db.users.find(
  { age: { $gt: 25 } },           // 查询条件
  { username: 1, email: 1 }       // ✅ 正确：1表示包含该字段
)

// 排除某些字段
db.users.find(
  { age: { $gt: 25 } },
  { password: 0, createdAt: 0 }   // ✅ 正确：0表示排除该字段
)

// 错误写法：混合包含和排除
db.users.find(
  {},
  { username: 1, password: 0 }    // ❌ 错误：不能同时使用1和0（_id除外）
)

// 排除_id字段
db.users.find(
  {},
  { _id: 0, username: 1 }         // ✅ 正确：_id可以和其他1一起使用
)
```

### 6. 排序、限制和跳过

#### sort（排序）

```javascript
// 按年龄升序排序
db.users.find().sort({ age: 1 })  // ✅ 正确：1表示升序

// 按年龄降序排序
db.users.find().sort({ age: -1 }) // ✅ 正确：-1表示降序

// 多字段排序：先按年龄降序，再按用户名升序
db.users.find().sort({
  age: -1,      // 第一排序字段：年龄降序
  username: 1   // 第二排序字段：用户名升序
})
```

#### limit（限制数量）

```javascript
// 只返回前5条数据
db.users.find().limit(5)  // ✅ 正确：限制返回5条

// 错误写法
db.users.find().limit("5")  // ❌ 错误：必须是数字
```

#### skip（跳过数量）

```javascript
// 跳过前10条，返回后面的数据
db.users.find().skip(10)  // ✅ 正确：跳过前10条

// 实现分页：第2页，每页10条
db.users.find()
  .skip(10)   // 跳过前10条（第1页）
  .limit(10)  // 取10条（第2页）
```

### 7. 正则表达式查询

```javascript
// 查询用户名以"admin"开头的用户
db.users.find({
  username: /^admin/  // ✅ 正确：正则表达式，以admin开头
})

// 查询邮箱包含"gmail"的用户
db.users.find({
  email: /gmail/  // ✅ 正确：包含gmail
})

// 不区分大小写
db.users.find({
  username: {
    $regex: /^admin/,
    $options: "i"  // ✅ 正确：i表示不区分大小写
  }
})

// 错误写法
db.users.find({
  username: { $regex: "admin" }  // ⚠️ 不推荐：性能较差，建议用/^admin/
})
```

## 对比表格

### 查询操作符对比

| 操作符 | 说明 | 示例 | 适用场景 |
|-------|------|------|---------|
| $eq | 等于 | `{age: {$eq: 25}}` | 精确匹配 |
| $gt | 大于 | `{age: {$gt: 25}}` | 范围查询 |
| $gte | 大于等于 | `{age: {$gte: 25}}` | 范围查询 |
| $lt | 小于 | `{age: {$lt: 30}}` | 范围查询 |
| $lte | 小于等于 | `{age: {$lte: 30}}` | 范围查询 |
| $ne | 不等于 | `{status: {$ne: "inactive"}}` | 排除特定值 |
| $in | 在数组中 | `{age: {$in: [25, 30]}}` | 多值匹配 |
| $nin | 不在数组中 | `{status: {$nin: ["a", "b"]}}` | 排除多个值 |

### 逻辑操作符对比

| 操作符 | 说明 | 示例 | 使用场景 |
|-------|------|------|---------|
| $and | 并且 | `{$and: [{a: 1}, {b: 2}]}` | 多条件同时满足 |
| $or | 或者 | `{$or: [{a: 1}, {b: 2}]}` | 满足任一条件 |
| $not | 非 | `{age: {$not: {$gt: 30}}}` | 条件取反 |
| $nor | 都不满足 | `{$nor: [{a: 1}, {b: 2}]}` | 都不满足 |

### 投影对比

| 写法 | 说明 | 结果 |
|-----|------|------|
| `{username: 1}` | 只返回username和_id | 包含字段少 |
| `{password: 0}` | 返回所有字段除了password | 排除特定字段 |
| `{_id: 0, username: 1}` | 返回username，不包含_id | 完全控制字段 |

## 新手常见误区

### 误区1：$in 后面使用单个值

```javascript
// 错误写法
db.users.find({ age: { $in: 25 } })  // ❌ 错误

// 正确写法
db.users.find({ age: { $in: [25] } })  // ✅ 正确：必须是数组
```

### 误区2：混合使用包含和排除投影

```javascript
// 错误写法
db.users.find({}, { username: 1, password: 0 })  // ❌ 错误

// 正确写法
db.users.find({}, { username: 1, email: 1 })  // ✅ 正确：都用1
// 或者
db.users.find({}, { password: 0 })  // ✅ 正确：都用0
```

### 误区3：$size 用于范围查询

```javascript
// 错误写法
db.articles.find({ tags: { $size: { $gt: 3 } } })  // ❌ 错误

// 正确写法：使用 $expr 和 $size
db.articles.find({
  $expr: { $gt: [{ $size: "$tags" }, 3] }
})  // ✅ 正确
```

### 误区4：忽略 _id 字段的投影规则

```javascript
// 错误写法
db.users.find({}, { _id: 1, username: 0 })  // ❌ 错误：_id:1时其他字段不能是0

// 正确写法
db.users.find({}, { _id: 0, username: 1 })  // ✅ 正确
```

### 误区5：正则表达式性能问题

```javascript
// 不推荐：全表扫描
db.users.find({ username: /admin/ })  // ⚠️ 性能差

// 推荐：使用索引友好的前缀匹配
db.users.find({ username: /^admin/ })  // ✅ 性能好，可以使用索引
```

## 动手练习

### 练习1：基础条件查询

**题目**：查询年龄在25到35岁之间（包含25和35），状态为"active"的用户，只返回用户名、邮箱和年龄字段。

<details>
<summary>点击查看答案</summary>

```javascript
db.users.find(
  {
    age: { $gte: 25, $lte: 35 },  // 年龄在25到35之间
    status: "active"               // 状态为active
  },
  {
    username: 1,   // 包含username字段
    email: 1,      // 包含email字段
    age: 1,        // 包含age字段
    _id: 0         // 排除_id字段
  }
)
```

</details>

### 练习2：逻辑操作符组合

**题目**：查询满足以下条件的用户：
- 年龄小于20岁或大于60岁
- 并且有email字段
- 状态不是"banned"

<details>
<summary>点击查看答案</summary>

```javascript
db.users.find({
  $and: [
    {
      $or: [
        { age: { $lt: 20 } },  // 年龄小于20
        { age: { $gt: 60 } }   // 或年龄大于60
      ]
    },
    { email: { $exists: true } },      // email字段存在
    { status: { $ne: "banned" } }      // 状态不是banned
  ]
})
```

</details>

### 练习3：数组查询与分页

**题目**：查询同时包含"JavaScript"和"MongoDB"标签的文章，按创建时间降序排序，实现分页功能（每页10条，获取第3页）。

<details>
<summary>点击查看答案</summary>

```javascript
db.articles.find({
  tags: { $all: ["JavaScript", "MongoDB"] }  // 同时包含这两个标签
})
.sort({ createdAt: -1 })  // 按创建时间降序
.skip(20)                 // 跳过前20条（第1页10条，第2页10条）
.limit(10)                // 取10条（第3页）
```

</details>

## 下一章预告

恭喜你完成了本章的学习！现在你已经掌握了MongoDB的条件查询与投影技术。

在下一章中，我们将学习**索引基础**，了解如何：
- 创建和使用单字段索引
- 理解复合索引与最左前缀原则
- 使用多键索引处理数组字段
- 创建TTL索引实现数据自动过期
- 使用explain()分析查询性能

索引是提升查询性能的关键，让我们一起探索如何让MongoDB查询更快！
