---
title: "第2章：文档与集合基础"
description: "BSON 格式、文档结构、集合概念、命名空间"
---

# 第2章：文档与集合基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MongoDB 存储数据的 BSON 格式是什么？它和 JSON 有什么区别？
- 文档和集合到底是什么？它们和关系型数据库的表有什么关系？
- 每个文档的 `_id` 字段是怎么来的？
- 文档设计有什么讲究？嵌套文档和数组怎么用？

这一章会带你深入理解 MongoDB 的数据存储基础，掌握文档和集合的核心概念。

---

## 1 BSON 格式详解

### 什么是 BSON？

BSON（Binary JSON）是 MongoDB 用来存储数据和进行网络传输的二进制编码格式。它是 JSON 的二进制形式，但支持更多的数据类型。

### 生活化类比

> JSON 就像一张手写的便条，人能看懂，但计算机处理起来不够高效。
>
> BSON 就像把这张便条扫描成电子版：计算机可以快速读取和处理，还能记录更多细节（比如日期、二进制数据等）。

### BSON vs JSON 对比

| 对比项 | JSON | BSON |
|--------|------|------|
| **可读性** | 人类可读，文本格式 | 二进制格式，人类不可直接读取 |
| **数据类型** | 有限的类型（字符串、数字、布尔、数组、对象、null） | 丰富的类型（String、Int32、Int64、Double、Date、ObjectId、Binary 等） |
| **性能** | 解析较慢 | 解析速度快，支持随机访问 |
| **空间占用** | 相对较大 | 相对较小（但某些情况下可能更大） |
| **用途** | 数据交换格式 | 数据存储和网络传输 |

### 代码示例

```javascript
// JSON 格式
{
    "name": "张三",
    "age": 25,
    "isStudent": false,
    "courses": ["数学", "物理"],
    "address": {
        "city": "北京",
        "district": "海淀区"
    }
}

// BSON 格式（在 MongoDB 中实际存储的形式）
// 虽然你看到的是 JSON，但 MongoDB 内部会转换为 BSON
// BSON 支持更多类型：
{
    "_id": ObjectId("507f1f77bcf86cd799439011"),  // ObjectId 类型
    "name": "张三",                                // String 类型
    "age": 25,                                     // Int32 类型
    "score": 98.5,                                 // Double 类型
    "isStudent": false,                            // Boolean 类型
    "birthday": ISODate("1998-05-15T00:00:00Z"),  // Date 类型
    "courses": ["数学", "物理"],                    // Array 类型
    "address": {                                   // Object 类型
        "city": "北京",
        "district": "海淀区"
    },
    "profile": BinData(0, "..."),                  // Binary 类型
    "balance": NumberDecimal("1000.50")            // Decimal128 类型
}
```

### 为什么 MongoDB 使用 BSON 而不是 JSON？

1. **更多的数据类型**：JSON 只有有限的几种类型，BSON 支持 Date、ObjectId、Binary 等
2. **更好的性能**：BSON 是二进制格式，解析速度更快
3. **支持随机访问**：BSON 可以在文档中快速跳转到任意字段，不需要解析整个文档
4. **类型信息保留**：BSON 会记录每个字段的类型，避免类型歧义

---

## 2 文档结构设计

### 什么是文档？

文档（Document）是 MongoDB 中的基本数据单元，类似于关系型数据库中的"行"。一个文档就是一个 BSON 对象。

### 文档的基本结构

```javascript
// 简单文档
{
    "_id": ObjectId("507f1f77bcf86cd799439011"),
    "name": "张三",
    "age": 25
}

// 嵌套文档（嵌入式文档）
{
    "_id": ObjectId("507f1f77bcf86cd799439011"),
    "name": "张三",
    "address": {                    // 嵌套文档
        "city": "北京",
        "street": "中关村大街"
    }
}

// 包含数组的文档
{
    "_id": ObjectId("507f1f77bcf86cd799439011"),
    "name": "张三",
    "hobbies": ["读书", "游泳", "编程"]  // 数组
}

// 复杂文档（嵌套 + 数组）
{
    "_id": ObjectId("507f1f77bcf86cd799439011"),
    "name": "张三",
    "age": 25,
    "address": {
        "city": "北京",
        "coordinates": {              // 多层嵌套
            "lat": 39.9042,
            "lng": 116.4074
        }
    },
    "hobbies": ["读书", "游泳"],
    "scores": [                       // 数组中包含对象
        { "subject": "数学", "score": 95 },
        { "subject": "英语", "score": 88 }
    ],
    "created_at": ISODate("2024-01-01T00:00:00Z")
}
```

### 设计原则

**✅ 好的设计：**

```javascript
// ✅ 相关数据嵌套在一起，查询时一次性获取
{
    "_id": ObjectId("..."),
    "title": "MongoDB 入门教程",
    "author": {
        "name": "张三",
        "email": "zhangsan@example.com"
    },
    "tags": ["数据库", "NoSQL", "MongoDB"],
    "comments": [
        {
            "user": "李四",
            "content": "写得很好",
            "created_at": ISODate("2024-01-02T00:00:00Z")
        }
    ]
}
```

**❌ 不好的设计：**

```javascript
// ❌ 嵌套层级过深（建议不超过 3 层）
{
    "level1": {
        "level2": {
            "level3": {
                "level4": {
                    "data": "太深了，不好维护"
                }
            }
        }
    }
}

// ❌ 数组过大（建议数组元素不超过几百个）
{
    "comments": [
        // 如果有上万条评论，不应该全部嵌套在这里
        // 应该单独存储，用引用关联
    ]
}
```

---

## 3 集合的概念

### 什么是集合？

集合（Collection）是 MongoDB 中存储文档的容器，类似于关系型数据库中的"表"。

### 集合 vs 表 对比

| 对比项 | MongoDB 集合 | MySQL 表 |
|--------|-------------|----------|
| **结构** | 灵活，文档可以有不同的字段 | 固定，所有行必须有相同的列 |
| **创建方式** | 插入文档时自动创建 | 需要提前 CREATE TABLE |
| **数据类型** | 同一字段可以存储不同类型 | 每列有固定的数据类型 |
| **索引** | 支持多种索引类型 | 支持 B-Tree、Hash 等索引 |
| **命名** | 使用命名空间（数据库.集合） | 数据库.表名 |

### 代码示例

```javascript
// 切换到 mydb 数据库
use mydb

// 创建集合（方式一：显式创建）
db.createCollection("users")
// 输出：{ ok: 1 }

// 创建集合（方式二：插入文档时自动创建）
db.products.insertOne({
    name: "iPhone 15",
    price: 5999
})
// 集合 products 会自动创建

// 查看所有集合
show collections
// 输出：
// users
// products

// 查看集合详情
db.users.stats()
// 输出集合的详细信息（文档数量、大小、索引等）

// 删除集合
db.users.drop()
// 输出：true

// 重命名集合
db.products.renameCollection("goods")
```

### 集合命名规则

- 集合名不能包含 `\0`（空字符）
- 集合名不能以 `system.` 开头（系统保留）
- 集合名不能包含 `$` 符号
- 集合名最大长度 128 字节
- 建议使用驼峰命名法：`userProfiles`、`orderItems`

---

## 4 _id 字段与 ObjectId

### _id 字段的作用

每个 MongoDB 文档都必须有一个 `_id` 字段，它是文档的唯一标识符。如果插入文档时没有指定 `_id`，MongoDB 会自动生成一个 ObjectId。

### ObjectId 的组成

ObjectId 是一个 12 字节的二进制数据，由以下部分组成：

```
|----4 字节----|---3 字节---|--2 字节--|-3 字节-|
   时间戳        机器标识符    进程ID    计数器
   (秒级)       (随机值)     (随机值)   (自增)
   
示例：507f1f77bcf86cd799439011
      |______||______||____||______|
      时间戳  机器ID  进程ID  计数器
```

**各部分说明：**

| 部分 | 大小 | 说明 |
|------|------|------|
| **时间戳** | 4 字节 | Unix 时间戳（秒），精确到秒 |
| **机器标识符** | 3 字节 | 机器的唯一标识（随机生成） |
| **进程 ID** | 2 字节 | 生成 ObjectId 的进程 ID |
| **计数器** | 3 字节 | 自增计数器，确保同一秒内生成的 ObjectId 不同 |

### 代码示例

```javascript
// 插入文档时不指定 _id，MongoDB 自动生成
db.users.insertOne({
    name: "张三",
    age: 25
})
// 输出：{ acknowledged: true, insertedId: ObjectId("64a7e8d5f3c2b1a0e4d8c9b7") }

// 插入文档时指定 _id
db.users.insertOne({
    _id: 1,  // 自定义 _id（可以是任何类型）
    name: "李四",
    age: 30
})

// ❌ 错误：_id 必须唯一，重复插入会报错
db.users.insertOne({
    _id: 1,  // 已经存在 _id 为 1 的文档
    name: "王五"
})
// 报错：E11000 duplicate key error collection: mydb.users

// 查询指定 _id 的文档
db.users.findOne({ _id: 1 })
// 输出：{ _id: 1, name: "李四", age: 30 }

// 使用 ObjectId 查询
db.users.find({
    _id: ObjectId("64a7e8d5f3c2b1a0e4d8c9b7")
})

// 生成新的 ObjectId
const newId = new ObjectId()
// 输出：ObjectId("64a7e8d5f3c2b1a0e4d8c9b8")

// 从 ObjectId 获取时间戳
const id = ObjectId("64a7e8d5f3c2b1a0e4d8c9b7")
id.getTimestamp()
// 输出：ISODate("2024-07-06T10:30:45Z")
```

### ObjectId 的优势

1. **全局唯一**：不同机器、不同进程生成的 ObjectId 不会冲突
2. **包含时间信息**：可以从 ObjectId 中提取生成时间
3. **有序性**：ObjectId 按时间戳排序，便于索引
4. **体积小**：12 字节，比 UUID（16 字节）更小

---

## 5 命名空间

### 什么是命名空间？

命名空间（Namespace）是 MongoDB 中用于唯一标识集合的完整路径，格式为：`数据库名.集合名`

### 示例

```javascript
// 当前数据库是 mydb
db  // 输出：mydb

// users 集合的完整命名空间是：mydb.users
// products 集合的完整命名空间是：mydb.products

// 查看当前数据库的所有命名空间
db.getCollectionNames()
// 输出：[ "users", "products" ]

// 跨数据库访问（不推荐，但可行）
use mydb
db.users.find()  // 访问 mydb.users

use otherdb
db.orders.find()  // 访问 otherdb.orders

// 在 mydb 中访问 otherdb 的集合
use mydb
db.getSiblingDB("otherdb").orders.find()
```

### 命名空间规则

- 命名空间最大长度 120 字节
- 命名空间不能包含空字符
- 系统集合的命名空间以 `system.` 开头（如 `system.indexes`）
- 建议使用有意义的命名空间，便于管理

---

## 6 文档大小限制

### 16MB 限制

MongoDB 对单个文档的大小有严格限制：**最大 16MB**。

这个限制是为了：

1. **保证性能**：大文档会占用大量内存，影响查询性能
2. **防止滥用**：避免用户将 MongoDB 当作文件存储
3. **内存管理**：MongoDB 会将文档加载到内存，大文档会消耗过多内存

### 代码示例

```javascript
// ✅ 正常文档（远小于 16MB）
db.files.insertOne({
    name: "document.txt",
    content: "这是一段文本内容...",
    size: 1024
})

// ❌ 超大文档（超过 16MB 会报错）
const largeContent = "x".repeat(20 * 1024 * 1024)  // 20MB
db.files.insertOne({
    name: "large_file.txt",
    content: largeContent
})
// 报错：object to insert too large

// ✅ 解决方案一：使用 GridFS（存储大文件）
// GridFS 会将大文件分割成多个小块（默认 255KB）
// 适合存储图片、视频、大文件等

// ✅ 解决方案二：将大数组单独存储
// ❌ 不好的设计
{
    "article_id": 1,
    "comments": [
        // 如果有几十万条评论，会超过 16MB
    ]
}

// ✅ 好的设计
// 文章文档
{
    "_id": 1,
    "title": "MongoDB 入门",
    "content": "..."
}

// 评论单独存储
{
    "article_id": 1,
    "user": "张三",
    "content": "好文章",
    "created_at": ISODate("2024-01-02T00:00:00Z")
}
```

### 如何查看文档大小？

```javascript
// 使用 Object.bsonsize() 查看文档的 BSON 大小
const doc = db.users.findOne()
Object.bsonsize(doc)
// 输出：123（字节）

// 查看集合中最大的文档
db.users.find().sort({ $natural: -1 }).limit(1).forEach(function(doc) {
    print("Document size: " + Object.bsonsize(doc) + " bytes")
})
```

---

## 7 新手常见误区

### 误区一：文档必须有相同的结构

**错误认识**：同一个集合中的所有文档必须有相同的字段。

**正确理解**：MongoDB 是模式灵活的（Schema-less），同一个集合中的文档可以有不同的字段。但建议保持大致相同的结构，便于查询和维护。

```javascript
// ✅ 允许：同一集合中不同文档有不同字段
db.users.insertOne({ name: "张三", age: 25 })
db.users.insertOne({ name: "李四", email: "lisi@example.com" })
// 两个文档都在 users 集合中，但字段不同

// ✅ 推荐：保持大致相同的结构
db.users.insertOne({ name: "张三", age: 25, email: "zhangsan@example.com" })
db.users.insertOne({ name: "李四", age: 30, email: "lisi@example.com" })
```

### 误区二：嵌套越深越好

**错误认识**：把所有相关数据都嵌套在一个文档中，查询时一次性获取。

**正确理解**：嵌套层级建议不超过 3 层，数组元素建议不超过几百个。过深的嵌套和过大的数组会影响性能和可维护性。

### 误区三：_id 必须是 ObjectId

**错误认识**：_id 字段只能是 ObjectId 类型。

**正确理解**：_id 可以是任何 BSON 类型（整数、字符串、ObjectId 等），只要保证唯一性即可。但推荐使用 ObjectId，因为它有诸多优势。

```javascript
// ✅ 使用整数作为 _id
db.users.insertOne({ _id: 1, name: "张三" })

// ✅ 使用字符串作为 _id
db.users.insertOne({ _id: "user_001", name: "李四" })

// ✅ 使用 ObjectId（推荐）
db.users.insertOne({ _id: new ObjectId(), name: "王五" })
```

### 误区四：集合需要先创建再使用

**错误认识**：必须先使用 `db.createCollection()` 创建集合，然后才能插入文档。

**正确理解**：MongoDB 会在第一次插入文档时自动创建集合，无需显式创建。但如果需要设置集合的选项（如最大大小、验证规则等），可以显式创建。

```javascript
// ✅ 方式一：隐式创建（推荐）
db.users.insertOne({ name: "张三" })  // users 集合会自动创建

// ✅ 方式二：显式创建（需要设置选项时）
db.createCollection("users", {
    validator: {  // 设置文档验证规则
        $jsonSchema: {
            required: ["name", "age"],
            properties: {
                name: { bsonType: "string" },
                age: { bsonType: "int", minimum: 0 }
            }
        }
    }
})
```

### 误区五：BSON 和 JSON 完全一样

**错误认识**：BSON 就是 JSON，只是名字不同。

**正确理解**：BSON 是 JSON 的二进制扩展，支持更多的数据类型（Date、ObjectId、Binary 等），并且解析速度更快。MongoDB 在内部使用 BSON 存储数据，但在 API 层面提供 JSON 接口。

---

## 8 动手练习

### 练习 1：创建包含嵌套文档和数组的文档

**要求**：
1. 创建一个 `books` 集合
2. 插入一本书的文档，包含：
   - 书名（字符串）
   - 作者（嵌套文档，包含姓名和邮箱）
   - 标签（数组）
   - 章节（数组，每个章节包含标题和页数）

<details>
<summary>点击查看答案</summary>

```javascript
// 切换到练习数据库
use practice

// 插入书籍文档
db.books.insertOne({
    title: "MongoDB 实战",
    author: {
        name: "张三",
        email: "zhangsan@example.com"
    },
    tags: ["数据库", "NoSQL", "MongoDB"],
    chapters: [
        { title: "第1章：简介", pages: 20 },
        { title: "第2章：CRUD 操作", pages: 35 },
        { title: "第3章：索引", pages: 40 }
    ],
    publish_date: ISODate("2024-01-01T00:00:00Z"),
    price: 79.00
})

// 查询验证
db.books.find().pretty()
```

</details>

### 练习 2：理解 ObjectId

**要求**：
1. 插入 3 个文档，不指定 `_id`
2. 查看自动生成的 `_id`
3. 从 `_id` 中提取时间戳
4. 使用 `_id` 查询文档

<details>
<summary>点击查看答案</summary>

```javascript
// 1. 插入 3 个文档
db.students.insertOne({ name: "张三", age: 20 })
db.students.insertOne({ name: "李四", age: 22 })
db.students.insertOne({ name: "王五", age: 21 })

// 2. 查看生成的 _id
db.students.find()
// 输出类似：
// { _id: ObjectId("64a7e8d5f3c2b1a0e4d8c9b7"), name: "张三", age: 20 }
// { _id: ObjectId("64a7e8d6f3c2b1a0e4d8c9b8"), name: "李四", age: 22 }
// { _id: ObjectId("64a7e8d7f3c2b1a0e4d8c9b9"), name: "王五", age: 21 }

// 3. 从 _id 提取时间戳
const id = ObjectId("64a7e8d5f3c2b1a0e4d8c9b7")
id.getTimestamp()
// 输出：ISODate("2024-07-06T10:30:45Z")

// 4. 使用 _id 查询
db.students.findOne({
    _id: ObjectId("64a7e8d5f3c2b1a0e4d8c9b7")
})
// 输出：{ _id: ObjectId("64a7e8d5f3c2b1a0e4d8c9b7"), name: "张三", age: 20 }
```

</details>

### 练习 3：文档大小限制

**要求**：
1. 创建一个文档，使其接近 16MB 限制
2. 查看文档的 BSON 大小
3. 思考：如果需要存储更大的数据，应该怎么办？

<details>
<summary>点击查看答案</summary>

```javascript
// 1. 创建接近 16MB 的文档
const largeArray = []
for (let i = 0; i < 100000; i++) {
    largeArray.push({ index: i, data: "x".repeat(100) })
}

db.large_docs.insertOne({
    name: "大文档测试",
    items: largeArray
})

// 2. 查看文档大小
const doc = db.large_docs.findOne()
Object.bsonsize(doc)
// 输出：约 15000000（字节），即约 15MB

// 3. 解决方案
// 如果需要存储超过 16MB 的数据，可以使用：
// - GridFS：将大文件分割成多个小块存储
// - 分片存储：将大数组拆分到多个文档中
// - 外部存储：将大文件存储到对象存储（如 AWS S3），数据库中只存储引用

// 示例：使用 GridFS（命令行）
// mongofiles put large_file.txt
```

</details>

---

## 9 下一章预告

恭喜你完成了第二章！现在你已经深入理解了 MongoDB 的文档和集合概念，掌握了 BSON 格式、文档结构设计、ObjectId 生成规则等核心知识。

在下一章中，我们将学习 **CRUD 操作基础**，包括：

- 插入文档（insertOne、insertMany）
- 查询文档（find、findOne、条件查询）
- 更新文档（updateOne、updateMany、更新操作符）
- 删除文档（deleteOne、deleteMany）

这些是日常开发中最常用的操作，继续加油！
