---
title: "第7章：聚合管道"
description: "聚合管道阶段、常用操作符、性能优化"
---

# 第7章：聚合管道

## 本章导读

在开始学习之前，让我们思考几个问题：

1. **如何统计每个用户的订单总金额？** 需要把所有订单都取出来，然后在代码里循环计算吗？
2. **如何实现类似SQL中GROUP BY的功能？** MongoDB没有GROUP BY关键字，怎么做分组统计？
3. **如何关联查询两个集合的数据？** MongoDB不是不支持JOIN吗？那怎么实现？
4. **什么是聚合管道？** 听起来很复杂，它到底是怎么工作的？

如果你对这些疑问感到困惑，本章将为你一一解答。

## 为什么需要聚合管道

### 痛点分析

想象你是一家电商公司的数据分析师，老板让你做一份报告：

- **没有聚合管道**：你需要先把所有订单数据导出到Excel，然后用公式计算每个用户的消费总额，再排序，再筛选前10名...整个过程可能需要几个小时
- **有聚合管道**：一条命令搞定，数据库内部直接完成计算，几秒钟出结果

这就是聚合管道的价值——**在数据库内部完成复杂的数据处理和统计**。

### 生活化类比

把聚合管道想象成**工厂流水线**：

```
原材料（原始数据）
  |
  v
[第1道工序：筛选] --> 只保留合格的产品 ($match)
  |
  v
[第2道工序：分类] --> 按产品类型分类 ($group)
  |
  v
[第3道工序：加工] --> 计算每类的数量和总价 ($sum, $avg)
  |
  v
[第4道工序：排序] --> 按价格从高到低排列 ($sort)
  |
  v
[第5道工序：截取] --> 只取前10个 ($limit)
  |
  v
成品（最终结果）
```

每一道工序就是一个"阶段"（stage），数据经过每个阶段后被处理，最终得到你想要的结果。

### 代码对比

**不用聚合管道（在应用层计算）**：

```javascript
// 在JavaScript中统计每个用户的订单总金额
const orders = await db.orders.find().toArray()  // 取出所有订单

// 在代码中手动计算
const result = {}
for (const order of orders) {
  if (!result[order.userId]) {
    result[order.userId] = 0
  }
  result[order.userId] += order.amount
}
// 问题：数据量大时，内存爆炸，速度慢
```

**使用聚合管道**：

```javascript
// 一条命令搞定
db.orders.aggregate([
  {
    $group: {
      _id: "$userId",           // 按userId分组
      totalAmount: { $sum: "$amount" }  // 计算每组的总金额
    }
  }
])
// 优势：数据库内部计算，高效、省内存
```

## 核心原理讲解

### 通俗类比

聚合管道就像**传话筒游戏**：

1. 第一个阶段接收所有数据，处理后传给下一个阶段
2. 第二个阶段接收上一步的结果，再处理后传给下一个阶段
3. 以此类推，直到最后一个阶段输出最终结果

每个阶段只做一件事，组合起来就能完成复杂的任务。

### 对比表格

| 聚合阶段 | 作用 | SQL等价 | 使用场景 |
|---------|------|--------|---------|
| $match | 筛选数据 | WHERE | 过滤不需要的数据 |
| $group | 分组统计 | GROUP BY | 按字段分组并计算 |
| $project | 选择字段 | SELECT | 控制输出字段 |
| $sort | 排序 | ORDER BY | 升序或降序排列 |
| $limit | 限制数量 | LIMIT | 取前N条 |
| $skip | 跳过数量 | OFFSET | 分页 |
| $unwind | 展开数组 | - | 将数组拆成多行 |
| $lookup | 关联查询 | JOIN | 关联其他集合 |
| $addFields | 添加字段 | - | 计算新字段 |

## 基础用法与逐行注释

### 1. $match（筛选数据）

```javascript
// 筛选状态为"completed"的订单
db.orders.aggregate([
  {
    $match: {                    // $match阶段：筛选数据
      status: "completed"        // 条件：status等于completed
    }
  }
])

// 筛选金额大于100的订单
db.orders.aggregate([
  {
    $match: {                    // $match阶段
      amount: { $gt: 100 }       // 条件：amount > 100
    }
  }
])

// 错误写法
db.orders.aggregate([
  {
    $match: "status: completed"  // ❌ 错误：必须是对象，不是字符串
  }
])
```

### 2. $group（分组统计）

```javascript
// 按用户分组，统计每个用户的订单总金额
db.orders.aggregate([
  {
    $group: {
      _id: "$userId",                      // 按userId分组
      totalAmount: { $sum: "$amount" },    // 计算每组的amount总和
      orderCount: { $sum: 1 },             // 计算每组的订单数量
      avgAmount: { $avg: "$amount" }       // 计算每组的平均金额
    }
  }
])

// 按用户和年份分组
db.orders.aggregate([
  {
    $group: {
      _id: {                               // _id可以是对象，实现多字段分组
        userId: "$userId",
        year: { $year: "$createdAt" }      // 提取年份
      },
      totalAmount: { $sum: "$amount" }
    }
  }
])

// 错误写法
db.orders.aggregate([
  {
    $group: {
      _id: "userId",                       // ❌ 错误：缺少$符号
      totalAmount: { $sum: "amount" }      // ❌ 错误：缺少$符号
    }
  }
])
```

### 3. $project（选择字段）

```javascript
// 只返回username和email字段
db.users.aggregate([
  {
    $project: {
      username: 1,        // 包含username字段
      email: 1,           // 包含email字段
      _id: 0              // 排除_id字段
    }
  }
])

// 计算新字段
db.orders.aggregate([
  {
    $project: {
      productName: 1,
      price: 1,
      quantity: 1,
      totalPrice: { $multiply: ["$price", "$quantity"] }  // 计算总价
    }
  }
])
```

### 4. $sort（排序）

```javascript
// 按金额降序排序
db.orders.aggregate([
  {
    $sort: { amount: -1 }    // -1表示降序
  }
])

// 多字段排序
db.orders.aggregate([
  {
    $sort: {
      status: 1,             // 先按status升序
      amount: -1             // 再按amount降序
    }
  }
])
```

### 5. $limit 和 $skip（限制和跳过）

```javascript
// 取前5条数据
db.orders.aggregate([
  { $limit: 5 }              // 只返回5条
])

// 分页：第2页，每页10条
db.orders.aggregate([
  { $skip: 10 },             // 跳过前10条
  { $limit: 10 }             // 取10条
])
```

### 6. $unwind（展开数组）

```javascript
// 假设文档结构如下：
// { title: "MongoDB教程", tags: ["mongodb", "database", "nosql"] }

// 展开tags数组
db.articles.aggregate([
  {
    $unwind: "$tags"         // 将tags数组展开成多条文档
  }
])

// 结果：
// { title: "MongoDB教程", tags: "mongodb" }
// { title: "MongoDB教程", tags: "database" }
// { title: "MongoDB教程", tags: "nosql" }

// 保留空数组的文档
db.articles.aggregate([
  {
    $unwind: {
      path: "$tags",
      preserveNullAndEmptyArrays: true  // 保留空数组和null值
    }
  }
])
```

### 7. $lookup（关联查询）

```javascript
// 假设订单集合中有userId字段，关联用户集合
db.orders.aggregate([
  {
    $lookup: {
      from: "users",           // 要关联的集合名
      localField: "userId",    // 当前集合的关联字段
      foreignField: "_id",     // 目标集合的关联字段
      as: "userInfo"           // 输出到userInfo字段
    }
  }
])

// 结果：
// {
//   _id: 1,
//   userId: 123,
//   amount: 100,
//   userInfo: [                // 关联的用户信息（数组）
//     { _id: 123, username: "admin", email: "admin@example.com" }
//   ]
// }

// 配合$unwind展开
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "userInfo"
    }
  },
  {
    $unwind: "$userInfo"       // 展开关联结果
  }
])
```

### 8. $addFields（添加字段）

```javascript
// 添加计算字段
db.orders.aggregate([
  {
    $addFields: {
      totalPrice: { $multiply: ["$price", "$quantity"] },  // 添加总价字段
      discount: 0.9                                         // 添加固定折扣
    }
  }
])

// 与$project的区别
// $addFields：保留原有字段，添加新字段
// $project：只返回指定字段（会丢失未指定的字段）
```

### 9. 聚合操作符

```javascript
// $sum：求和
db.orders.aggregate([
  {
    $group: {
      _id: "$userId",
      totalAmount: { $sum: "$amount" }    // 求和
    }
  }
])

// $avg：平均值
db.orders.aggregate([
  {
    $group: {
      _id: "$userId",
      avgAmount: { $avg: "$amount" }      // 平均值
    }
  }
])

// $min 和 $max：最小值和最大值
db.orders.aggregate([
  {
    $group: {
      _id: "$userId",
      minAmount: { $min: "$amount" },     // 最小金额
      maxAmount: { $max: "$amount" }      // 最大金额
    }
  }
])

// $push：将值推入数组（保留重复值）
db.orders.aggregate([
  {
    $group: {
      _id: "$userId",
      orderIds: { $push: "$_id" }         // 将订单ID推入数组
    }
  }
])

// $addToSet：将值推入数组（去重）
db.orders.aggregate([
  {
    $group: {
      _id: "$userId",
      statuses: { $addToSet: "$status" }  // 去重后的状态列表
    }
  }
])
```

### 10. 完整示例：电商订单统计

```javascript
// 统计每个用户的消费情况，按总消费金额降序排列，取前10名
db.orders.aggregate([
  // 第1步：只统计已完成的订单
  {
    $match: {
      status: "completed"              // 筛选已完成的订单
    }
  },
  // 第2步：按用户分组统计
  {
    $group: {
      _id: "$userId",                  // 按userId分组
      totalAmount: { $sum: "$amount" },  // 总消费金额
      orderCount: { $sum: 1 },          // 订单数量
      avgAmount: { $avg: "$amount" }    // 平均订单金额
    }
  },
  // 第3步：关联用户信息
  {
    $lookup: {
      from: "users",                   // 关联users集合
      localField: "_id",               // 当前_id对应用户userId
      foreignField: "_id",             // users集合的_id
      as: "userInfo"                   // 输出到userInfo字段
    }
  },
  // 第4步：展开用户信息
  {
    $unwind: "$userInfo"               // 展开关联的用户信息
  },
  // 第5步：选择输出字段
  {
    $project: {
      _id: 1,
      username: "$userInfo.username",  // 用户名
      totalAmount: 1,                  // 总消费金额
      orderCount: 1,                   // 订单数量
      avgAmount: { $round: ["$avgAmount", 2] }  // 平均金额，保留2位小数
    }
  },
  // 第6步：按总消费金额降序排序
  {
    $sort: { totalAmount: -1 }         // 降序排列
  },
  // 第7步：只取前10名
  {
    $limit: 10                         // 取前10条
  }
])
```

### 11. 完整示例：用户行为分析

```javascript
// 统计每天的用户活跃数量
db.activities.aggregate([
  // 第1步：按日期分组
  {
    $group: {
      _id: {
        $dateToString: {                // 将日期转为字符串格式
          format: "%Y-%m-%d",           // 格式：年-月-日
          date: "$createdAt"            // 日期字段
        }
      },
      activeUsers: { $addToSet: "$userId" },  // 去重的活跃用户
      activityCount: { $sum: 1 }              // 活动总数
    }
  },
  // 第2步：计算活跃用户数
  {
    $project: {
      date: "$_id",                           // 日期
      activeUserCount: {
        $size: "$activeUsers"                 // 活跃用户数量
      },
      activityCount: 1                        // 活动总数
    }
  },
  // 第3步：按日期排序
  {
    $sort: { date: 1 }                        // 按日期升序
  }
])
```

## 对比表格

### 聚合操作符对比

| 操作符 | 作用 | 示例 | 返回类型 |
|-------|------|------|---------|
| $sum | 求和 | `{ $sum: "$amount" }` | 数字 |
| $avg | 平均值 | `{ $avg: "$amount" }` | 数字 |
| $min | 最小值 | `{ $min: "$amount" }` | 与字段类型相同 |
| $max | 最大值 | `{ $max: "$amount" }` | 与字段类型相同 |
| $push | 推入数组（保留重复） | `{ $push: "$item" }` | 数组 |
| $addToSet | 推入数组（去重） | `{ $addToSet: "$item" }` | 数组 |

### 聚合阶段对比

| 阶段 | 作用 | SQL等价 | 性能影响 |
|-----|------|--------|---------|
| $match | 筛选 | WHERE | 放在最前面可以减少后续数据量 |
| $group | 分组 | GROUP BY | 数据量大时消耗内存 |
| $project | 选择字段 | SELECT | 减少输出数据量 |
| $sort | 排序 | ORDER BY | 大数据量时可能用到磁盘排序 |
| $limit | 限制 | LIMIT | 减少输出数据量 |
| $skip | 跳过 | OFFSET | 跳过大量数据时性能差 |
| $unwind | 展开数组 | - | 可能大幅增加数据量 |
| $lookup | 关联 | JOIN | 性能开销较大 |

## 管道优化建议

### 建议1：$match 放在最前面

```javascript
// 推荐写法
db.orders.aggregate([
  { $match: { status: "completed" } },  // 先筛选，减少后续数据量
  { $group: { _id: "$userId", total: { $sum: "$amount" } } }
])

// 不推荐
db.orders.aggregate([
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },  // 先分组所有数据
  { $match: { status: "completed" } }  // 再筛选（已经晚了）
])
```

### 建议2：尽早使用 $project 减少字段

```javascript
// 推荐：先裁剪字段，再处理
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $project: { userId: 1, amount: 1 } },  // 只保留需要的字段
  { $group: { _id: "$userId", total: { $sum: "$amount" } } }
])
```

### 建议3：避免 $unwind 大数据量

```javascript
// 不推荐：数组很大时，$unwind会产生大量文档
db.articles.aggregate([
  { $unwind: "$comments" }  // 如果每篇文章有100条评论，数据量会膨胀100倍
])

// 推荐：使用$size获取数组长度
db.articles.aggregate([
  { $project: { title: 1, commentCount: { $size: "$comments" } } }
])
```

## 新手常见误区

### 误区1：$group 中忘记 $ 符号

```javascript
// 错误写法
db.orders.aggregate([
  {
    $group: {
      _id: "userId",                    // ❌ 错误：缺少$符号
      total: { $sum: "amount" }         // ❌ 错误：缺少$符号
    }
  }
])

// 正确写法
db.orders.aggregate([
  {
    $group: {
      _id: "$userId",                   // ✅ 正确：使用$引用字段
      total: { $sum: "$amount" }        // ✅ 正确：使用$引用字段
    }
  }
])
```

### 误区2：$lookup 的 localField 和 foreignField 搞反

```javascript
// 错误写法
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "_id",               // ❌ 错误：这是orders的_id
      foreignField: "userId",          // ❌ 错误：users集合没有userId字段
      as: "userInfo"
    }
  }
])

// 正确写法
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",            // ✅ 正确：orders集合的userId字段
      foreignField: "_id",             // ✅ 正确：users集合的_id字段
      as: "userInfo"
    }
  }
])
```

### 误区3：$sort 放在 $group 前面

```javascript
// 错误写法
db.orders.aggregate([
  { $sort: { amount: -1 } },           // ❌ 排序后分组，结果不对
  { $group: { _id: "$userId", maxAmount: { $max: "$amount" } } }
])

// 正确写法
db.orders.aggregate([
  { $group: { _id: "$userId", maxAmount: { $max: "$amount" } } },
  { $sort: { maxAmount: -1 } }         // ✅ 分组后再排序
])
```

### 误区4：忽略聚合管道的内存限制

```javascript
// 问题：聚合操作默认有100MB内存限制
// 如果数据量很大，可能会报错

// 解决方案1：使用allowDiskUse
db.orders.aggregate([
  { $group: { _id: "$userId", total: { $sum: "$amount" } } }
], {
  allowDiskUse: true                   // ✅ 允许使用磁盘，突破内存限制
})

// 解决方案2：在$match阶段尽量过滤数据
db.orders.aggregate([
  { $match: { createdAt: { $gte: ISODate("2024-01-01") } } },  // 先过滤
  { $group: { _id: "$userId", total: { $sum: "$amount" } } }
])
```

### 误区5：$unwind 后忘记处理空数组

```javascript
// 问题：如果tags为空数组，$unwind后文档会消失
db.articles.aggregate([
  { $unwind: "$tags" }                 // ❌ tags为空数组时，文档被丢弃
])

// 正确写法
db.articles.aggregate([
  {
    $unwind: {
      path: "$tags",
      preserveNullAndEmptyArrays: true // ✅ 保留空数组的文档
    }
  }
])
```

## 动手练习

### 练习1：基础分组统计

**题目**：统计orders集合中，每个状态（status）的订单数量和总金额。

<details>
<summary>点击查看答案</summary>

```javascript
db.orders.aggregate([
  {
    $group: {
      _id: "$status",                      // 按status字段分组
      count: { $sum: 1 },                  // 统计每组的订单数量
      totalAmount: { $sum: "$amount" }     // 计算每组的总金额
    }
  },
  {
    $sort: { count: -1 }                   // 按订单数量降序排列
  }
])
```

</details>

### 练习2：关联查询

**题目**：查询所有订单，并关联显示用户的用户名（orders集合有userId字段，users集合有_id和username字段）。

<details>
<summary>点击查看答案</summary>

```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: "users",                       // 关联users集合
      localField: "userId",                // orders集合的userId字段
      foreignField: "_id",                 // users集合的_id字段
      as: "user"                           // 输出到user字段
    }
  },
  {
    $unwind: "$user"                       // 展开user数组
  },
  {
    $project: {
      _id: 1,
      amount: 1,
      status: 1,
      username: "$user.username"           // 只取用户名
    }
  }
])
```

</details>

### 练习3：综合应用

**题目**：统计2024年每个月的销售额，要求：
1. 只统计已完成的订单
2. 按月份分组
3. 计算每月的总销售额、订单数和平均订单金额
4. 按月份升序排列

<details>
<summary>点击查看答案</summary>

```javascript
db.orders.aggregate([
  // 第1步：筛选已完成的订单和2024年的数据
  {
    $match: {
      status: "completed",
      createdAt: {
        $gte: ISODate("2024-01-01"),       // 2024年1月1日开始
        $lt: ISODate("2025-01-01")         // 2025年1月1日之前
      }
    }
  },
  // 第2步：按月份分组
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m",                 // 格式：年-月
          date: "$createdAt"
        }
      },
      totalSales: { $sum: "$amount" },     // 总销售额
      orderCount: { $sum: 1 },             // 订单数
      avgAmount: { $avg: "$amount" }       // 平均订单金额
    }
  },
  // 第3步：格式化输出
  {
    $project: {
      month: "$_id",                       // 月份
      totalSales: { $round: ["$totalSales", 2] },  // 保留2位小数
      orderCount: 1,
      avgAmount: { $round: ["$avgAmount", 2] }
    }
  },
  // 第4步：按月份升序排列
  {
    $sort: { month: 1 }
  }
])
```

</details>

## 下一章预告

恭喜你完成了本章的学习！现在你已经掌握了MongoDB的聚合管道技术。

在下一章中，我们将学习**数据模型设计**，了解如何：
- 理解文档设计的三大模式：嵌入模式、引用模式、混合模式
- 设计一对多和多对多关系
- 设计树形结构
- 大文档拆分策略
- 模式设计最佳实践

数据模型设计是MongoDB开发中最重要的一环，好的设计能让查询更高效、更简洁，让我们一起探索！
