---
title: "第4章：数据类型与文档设计"
description: "MongoDB 数据类型、文档设计原则、嵌入与引用"
---

# 第4章：数据类型与文档设计

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MongoDB 支持哪些数据类型？存钱的时候用 Double 可以吗？
- 什么是嵌入（Embedding）和引用（Referencing）？它们有什么区别？
- 一对多、多对多的关系在 MongoDB 中应该怎么设计？
- 为什么我设计的文档越来越大，查询越来越慢？

这一章将带你深入了解 MongoDB 的数据类型，并掌握文档设计的核心原则。好的文档设计是 MongoDB 高性能的基础。

---

## 4.1 为什么需要深入了解数据类型和设计？

### 痛点分析

很多新手在使用 MongoDB 时，会把它当成一个“随便塞什么都行”的 JSON 仓库。结果导致了一系列问题：

- **精度丢失**：用 Double 类型存储金额，导致计算结果出现 `0.1 + 0.2 = 0.30000000000000004` 的问题。
- **文档过大**：把所有相关数据都嵌套在一个文档中，导致文档超过 16MB 限制，或者查询时加载大量无用数据。
- **查询缓慢**：过度使用引用（Reference），导致每次查询都需要多次关联操作，失去了 MongoDB 的性能优势。
- **类型混乱**：同一个字段有时存字符串，有时存数字，导致查询结果不符合预期。

### 生活化类比

> **数据类型**就像现实生活中的容器：
> - 存钱必须用“保险箱”（Decimal128），不能用“普通纸盒”（Double），否则钱会莫名变少。
> - 存日期必须用“日历”（Date），不能用“写着日期的纸条”（String），否则你没法直接比较哪天在前哪天在后。
>
> **文档设计**就像搬家时的打包方式：
> - **嵌入（Embedding）**：把相关物品都装进同一个大箱子。优点是搬家时一次搬走，拿取方便；缺点是箱子太大太重，找里面的东西麻烦。
> - **引用（Referencing）**：把物品分装在不同的箱子里，只在主箱子里放一张“物品清单”。优点是箱子轻便，分类清晰；缺点是拿东西时需要根据清单去其他箱子找。

### 代码对比

**❌ 糟糕的设计（过度嵌入）：**

```javascript
// ❌ 把所有订单都嵌入到用户文档中
{
    "_id": ObjectId("..."),
    "name": "张三",
    "orders": [
        // 假设用户有 1000 个订单，每个订单包含几十个商品
        // 这个文档会轻松超过 16MB 限制
        // 而且每次只查询用户信息时，也会加载这 1000 个订单，浪费内存
    ]
}
```

**✅ 优秀的设计（合理引用）：**

```javascript
// ✅ 用户文档只保留基本信息
{
    "_id": ObjectId("..."),
    "name": "张三",
    "email": "zhangsan@example.com"
}

// ✅ 订单文档单独存储，通过 user_id 引用用户
{
    "_id": ObjectId("..."),
    "user_id": ObjectId("..."),  // 引用用户的 _id
    "product_name": "iPhone 15",
    "amount": 5999.00,
    "created_at": ISODate("2024-01-01T00:00:00Z")
}
```

---

## 4.2 MongoDB 核心数据类型

MongoDB 使用 BSON 格式，支持比 JSON 更丰富的数据类型。

### 常用数据类型一览

| 数据类型 | 说明 | 示例 | 注意事项 |
|----------|------|------|----------|
| **String** | 字符串 | `"Hello"` | UTF-8 编码 |
| **Int32** | 32位整数 | `NumberInt(100)` | 范围：-2^31 到 2^31-1 |
| **Int64** | 64位整数 | `NumberLong(10000000000)` | 范围：-2^63 到 2^63-1 |
| **Double** | 64位浮点数 | `3.14` | 不适合存储金额 |
| **Decimal128** | 128位高精度小数 | `NumberDecimal("99.99")` | **存储金额的首选** |
| **Boolean** | 布尔值 | `true` / `false` | |
| **Date** | 日期时间 | `new Date()` | 存储 UTC 时间 |
| **ObjectId** | 12字节对象ID | `new ObjectId()` | 默认 _id 类型 |
| **Array** | 数组 | `["a", "b"]` | 可包含不同类型 |
| **Object** | 嵌套文档 | `{ key: "value" }` | |
| **Null** | 空值 | `null` | |
| **Binary** | 二进制数据 | `BinData(0, "...")` | 存储图片、文件等 |

### 代码示例与对比

```javascript
// ✅ 字符串类型
db.test.insertOne({ name: "张三" })

// ✅ 整数类型
db.test.insertOne({ 
    age: NumberInt(25),        // 32位整数
    population: NumberLong(1400000000)  // 64位整数
})
// 注意：在 mongosh 中，普通的数字默认可能是 Double，明确指定整数类型更好

// ❌ 错误：用 Double 存储金额
db.products.insertOne({ 
    price: 99.99  // 默认是 Double，可能会有精度问题
})
// 计算时可能出现 99.99 - 10 = 89.98999999999999

// ✅ 正确：用 Decimal128 存储金额
db.products.insertOne({ 
    price: NumberDecimal("99.99")  // 高精度，适合金融计算
})

// ✅ 日期类型
db.logs.insertOne({ 
    created_at: new Date()  // 当前时间
})
// ❌ 错误：用字符串存日期
db.logs.insertOne({ 
    created_at: "2024-01-01"  // 无法直接进行日期范围查询和计算
})

// ✅ 布尔类型
db.users.insertOne({ is_active: true })

// ✅ 数组类型
db.users.insertOne({ hobbies: ["读书", "游泳", "编程"] })

// ✅ 嵌套文档
db.users.insertOne({ 
    address: { 
        city: "北京", 
        street: "中关村" 
    } 
})

// ✅ Null 类型
db.users.insertOne({ deleted_at: null })  // 表示字段存在，但值为空
```

### 类型查询

```javascript
// ✅ 查询指定类型的文档
// 查询 price 是 Decimal128 类型的文档
db.products.find({ 
    price: { $type: "decimal" } 
})

// 查询 created_at 是 Date 类型的文档
db.logs.find({ 
    created_at: { $type: "date" } 
})

// ✅ 类型转换（在聚合管道中）
// 将字符串类型的年龄转换为整数
db.users.aggregate([
    {
        $addFields: {
            ageInt: { $convert: { input: "$age", to: "int" } }
        }
    }
])
```

---

## 4.3 文档设计原则：嵌入 vs 引用

在 MongoDB 中，设计文档结构时最核心的决策就是：**数据应该嵌入（Embed）还是引用（Reference）？**

### 概念解释

- **嵌入（Embedding）**：将相关数据直接嵌套在同一个文档中。
- **引用（Referencing）**：将数据分开存储，通过 `_id` 进行关联（类似关系型数据库的外键）。

### 生活化类比

> **嵌入**就像**户口本**：
> 一家人的信息都记录在一个本子上。查家庭信息时，翻开本子一目了然。但如果家庭成员太多，本子就会很厚，翻阅起来很慢。
>
> **引用**就像**身份证和户口本**：
> 每个人有自己的身份证（独立文档），户口本上只记录每个人的身份证号（引用）。户口本很薄，但需要查详细信息时，必须拿出身份证来看。

### 对比表格

| 对比维度 | 嵌入（Embedding） | 引用（Referencing） |
|----------|-------------------|---------------------|
| **读取性能** | 高（一次查询获取所有数据） | 较低（需要多次查询或 $lookup） |
| **写入性能** | 较低（更新整个文档） | 高（只更新独立文档） |
| **数据一致性** | 高（原子操作，同时更新） | 较低（需要分布式事务保证） |
| **文档大小** | 容易变大（受 16MB 限制） | 保持较小 |
| **数据冗余** | 高（数据可能重复存储） | 低（数据只存一份） |
| **适用场景** | 数据量小、读多写少、经常一起查询 | 数据量大、写多读少、独立更新 |

### 设计决策树

```text
1. 数据是否会超过 16MB？
   - 是 -> 必须引用
   - 否 -> 继续判断

2. 数据是否经常和主文档一起查询？
   - 是 -> 继续判断
   - 否 -> 推荐引用

3. 数据是“一对多”中的“多”端，且“多”的数量是否有限（如少于100）？
   - 是 -> 推荐嵌入
   - 否 -> 推荐引用

4. 数据是否需要独立更新？
   - 是 -> 推荐引用
   - 否 -> 推荐嵌入
```

---

## 4.4 关系型数据的设计

### 一对一（1:1）关系

**场景**：用户（User）和用户详细信息（UserProfile）。

**方案一：嵌入（推荐，如果 Profile 较小且经常一起查询）**

```javascript
// ✅ 将 Profile 嵌入到 User 文档中
db.users.insertOne({
    _id: ObjectId("..."),
    username: "zhangsan",
    email: "zhangsan@example.com",
    profile: {                  // 嵌入的 Profile
        firstName: "张",
        lastName: "三",
        phone: "13800138000",
        avatar: "avatar.jpg"
    }
})

// 查询时一次性获取
db.users.findOne({ username: "zhangsan" })
```

**方案二：引用（推荐，如果 Profile 很大或很少查询）**

```javascript
// ✅ User 文档
db.users.insertOne({
    _id: ObjectId("user_1"),
    username: "zhangsan",
    email: "zhangsan@example.com"
})

// ✅ Profile 文档单独存储
db.profiles.insertOne({
    _id: ObjectId("profile_1"),
    user_id: ObjectId("user_1"),  // 引用 User
    bio: "这是一段很长的个人简介...",
    preferences: { /* 大量配置数据 */ }
})

// 查询时需要两次查询（或使用 $lookup）
const user = db.users.findOne({ username: "zhangsan" })
const profile = db.profiles.findOne({ user_id: user._id })
```

### 一对多（1:N）关系

**场景**：用户（User）和订单（Order）。

**方案一：嵌入（推荐，如果“多”端数量少，如用户的收货地址）**

```javascript
// ✅ 收货地址数量通常不多（少于 10 个），适合嵌入
db.users.insertOne({
    _id: ObjectId("..."),
    name: "张三",
    addresses: [              // 嵌入地址数组
        {
            label: "家",
            detail: "北京市海淀区中关村大街1号",
            phone: "13800138000"
        },
        {
            label: "公司",
            detail: "北京市朝阳区望京SOHO",
            phone: "13800138000"
        }
    ]
})
```

**方案二：引用（推荐，如果“多”端数量多，如用户的订单）**

```javascript
// ❌ 错误：订单数量可能成百上千，嵌入会导致文档过大
db.users.insertOne({
    name: "张三",
    orders: [ /* 1000 个订单，文档爆炸 */ ]
})

// ✅ 正确：订单单独存储，引用用户
db.orders.insertOne({
    _id: ObjectId("..."),
    user_id: ObjectId("..."),  // 引用用户
    product: "iPhone 15",
    amount: NumberDecimal("5999.00"),
    status: "paid",
    created_at: new Date()
})

// 查询用户的所有订单
db.orders.find({ user_id: ObjectId("...") })
```

### 多对多（M:N）关系

**场景**：学生（Student）和课程（Course）。

**方案一：数组引用（推荐，如果关联数组不大）**

```javascript
// ✅ 学生文档，包含课程 ID 数组
db.students.insertOne({
    _id: ObjectId("student_1"),
    name: "张三",
    course_ids: [             // 存储课程 ID 数组
        ObjectId("course_1"),
        ObjectId("course_2")
    ]
})

// ✅ 课程文档，包含学生 ID 数组（双向引用）
db.courses.insertOne({
    _id: ObjectId("course_1"),
    name: "MongoDB 入门",
    student_ids: [            // 存储学生 ID 数组
        ObjectId("student_1"),
        ObjectId("student_2")
    ]
})
```

**方案二：中间集合（推荐，如果关联关系包含额外信息，如成绩）**

```javascript
// ✅ 学生文档
db.students.insertOne({
    _id: ObjectId("student_1"),
    name: "张三"
})

// ✅ 课程文档
db.courses.insertOne({
    _id: ObjectId("course_1"),
    name: "MongoDB 入门"
})

// ✅ 中间集合：选课记录（包含额外信息）
db.enrollments.insertOne({
    student_id: ObjectId("student_1"),
    course_id: ObjectId("course_1"),
    score: 95,                // 成绩
    enroll_date: new Date()   // 选课日期
})

// 查询张三选的所有课程及成绩
db.enrollments.find({ student_id: ObjectId("student_1") })
```

---

## 4.5 新手常见误区

### 误区一：MongoDB 是 NoSQL，所以不需要设计关系

**错误认识**：MongoDB 不需要像 MySQL 那样设计表关系，随便存就行了。

**正确理解**：虽然 MongoDB 不需要定义外键约束，但数据之间的关系依然存在。如果不合理设计嵌入和引用，会导致严重的性能问题和数据一致性问题。好的文档设计比关系型数据库的表设计更需要经验。

### 误区二：嵌入总是比引用好

**错误认识**：MongoDB 官方推荐嵌入，所以所有关系都应该用嵌入。

**正确理解**：MongoDB 官方确实推荐“数据应该一起查询的就嵌入”，但这有前提：文档不能超过 16MB，且数组不能无限增长。对于一对多中“多”端数量庞大的情况（如用户和订单），必须使用引用。

### 误区三：用 Double 存储金额没问题

**错误认识**：JavaScript 中数字都是浮点数，MongoDB 中用 Double 存金额也可以。

**正确理解**：Double 是 64 位浮点数，存在精度丢失问题。在金融、电商等涉及金额计算的场景中，必须使用 `Decimal128` 类型，或者将金额转换为整数（如以“分”为单位存储为 Int64）。

```javascript
// ❌ 错误：Double 精度丢失
db.products.insertOne({ price: 0.1 + 0.2 })  // 结果是 0.30000000000000004

// ✅ 正确：使用 Decimal128
db.products.insertOne({ price: NumberDecimal("0.1") })
// 或者转换为分，用整数存储
db.products.insertOne({ price_cents: NumberLong(10) })  // 10 分 = 0.1 元
```

### 误区四：用字符串存储日期

**错误认识**：存日期时，直接存 `"2024-01-01"` 这样的字符串更方便。

**正确理解**：字符串无法直接进行日期范围查询（如查询最近 7 天的数据），也无法进行时区转换。必须使用 `Date` 类型。

```javascript
// ❌ 错误：字符串无法直接比较大小
db.logs.insertOne({ created_at: "2024-01-01" })
db.logs.find({ created_at: { $gte: "2024-01-01" } })  // 虽然能查，但不规范，且无法处理时间

// ✅ 正确：使用 Date 类型
db.logs.insertOne({ created_at: new Date("2024-01-01") })
db.logs.find({ 
    created_at: { 
        $gte: new Date("2024-01-01"), 
        $lt: new Date("2024-02-01") 
    } 
})
```

### 误区五：_id 只能用 ObjectId

**错误认识**：_id 字段必须是 ObjectId 类型，不能用其他类型。

**正确理解**：_id 可以是任何 BSON 类型（整数、字符串、UUID 等），只要保证唯一性即可。但推荐使用 ObjectId，因为它自带时间戳、全局唯一、体积小。

---

## 4.6 动手练习

### 练习 1：选择正确的数据类型

**要求**：
为以下字段选择最合适的数据类型，并写出插入语句：
1. 商品名称（字符串）
2. 商品价格（需要精确到分）
3. 商品库存（整数，可能超过 20 亿）
4. 上架时间（日期）
5. 是否上架（布尔值）
6. 商品标签（数组）

<details>
<summary>点击查看答案</summary>

```javascript
db.products.insertOne({
    name: "iPhone 15 Pro",                      // String：商品名称
    price: NumberDecimal("8999.00"),            // Decimal128：金额，避免精度丢失
    stock: NumberLong(5000000000),              // Int64：库存，超过 Int32 范围
    listed_at: new Date(),                      // Date：上架时间，方便范围查询
    is_active: true,                            // Boolean：是否上架
    tags: ["手机", "苹果", "5G"]                 // Array：商品标签
})
```

</details>

### 练习 2：设计博客系统的文档结构

**要求**：
设计一个博客系统，包含用户（User）、文章（Post）、评论（Comment）。
1. 分析它们之间的关系（1:1, 1:N, M:N）。
2. 决定哪些数据应该嵌入，哪些应该引用。
3. 写出文档结构示例。

<details>
<summary>点击查看答案</summary>

**关系分析：**
- 用户和文章：1:N（一个用户可以有多篇文章）。文章数量可能很多，推荐**引用**。
- 文章和评论：1:N（一篇文章可以有多条评论）。评论数量可能很多，推荐**引用**（或嵌入前几条）。
- 用户和评论：1:N（一个用户可以有多条评论）。

**文档设计：**

```javascript
// ✅ 用户文档（只存基本信息）
db.users.insertOne({
    _id: ObjectId("user_1"),
    username: "zhangsan",
    email: "zhangsan@example.com",
    created_at: new Date()
})

// ✅ 文章文档（引用用户，嵌入少量标签）
db.posts.insertOne({
    _id: ObjectId("post_1"),
    author_id: ObjectId("user_1"),  // 引用用户
    title: "MongoDB 文档设计指南",
    content: "文档设计是 MongoDB 的核心...",
    tags: ["MongoDB", "数据库"],     // 标签数量少，适合嵌入
    views: 1024,
    created_at: new Date()
})

// ✅ 评论文档（引用文章和用户）
db.comments.insertOne({
    _id: ObjectId("comment_1"),
    post_id: ObjectId("post_1"),    // 引用文章
    user_id: ObjectId("user_2"),    // 引用评论者
    content: "写得很好，学到了很多！",
    created_at: new Date()
})
```

**为什么这样设计？**
1. 文章数量可能很多，如果嵌入用户文档会导致文档过大。
2. 评论数量可能非常多，嵌入文章文档容易超过 16MB 限制。
3. 标签数量通常很少（少于 10 个），且和文章一起查询，适合嵌入。

</details>

### 练习 3：设计多对多关系

**要求**：
设计一个“用户-角色-权限”系统：
- 一个用户可以有多个角色（如管理员、编辑）。
- 一个角色可以有多个权限（如读、写、删除）。
- 写出文档结构，并说明为什么这样设计。

<details>
<summary>点击查看答案</summary>

**文档设计：**

```javascript
// ✅ 用户文档
db.users.insertOne({
    _id: ObjectId("user_1"),
    username: "admin",
    role_ids: [                 // 引用角色 ID 数组
        ObjectId("role_admin"),
        ObjectId("role_editor")
    ]
})

// ✅ 角色文档
db.roles.insertOne({
    _id: ObjectId("role_admin"),
    name: "管理员",
    description: "拥有所有权限",
    permission_ids: [           // 引用权限 ID 数组
        ObjectId("perm_read"),
        ObjectId("perm_write"),
        ObjectId("perm_delete")
    ]
})

// ✅ 权限文档
db.permissions.insertOne({
    _id: ObjectId("perm_read"),
    name: "读取",
    resource: "article",
    action: "read"
})
```

**为什么这样设计？**
1. 用户和角色、角色和权限都是多对多关系。
2. 角色和权限的数量通常有限（少于 100 个），使用数组引用是合适的。
3. 如果需要查询“某个用户的所有权限”，可以通过 `role_ids` 找到角色，再从角色中提取 `permission_ids`。
4. 如果权限需要包含额外信息（如生效时间），可以引入中间集合 `user_permissions`。

</details>

---

## 4.7 下一章预告

恭喜你完成了第四章！现在你已经掌握了 MongoDB 的核心数据类型，并学会了如何设计合理的文档结构。记住，好的文档设计是 MongoDB 高性能的基石。

在下一章中，我们将学习 **索引（Index）**，包括：

- 什么是索引？为什么需要索引？
- 单字段索引、复合索引、多键索引
- 索引的创建、查看和删除
- 索引的选择性和性能优化

索引是提升查询性能的关键，继续加油！
