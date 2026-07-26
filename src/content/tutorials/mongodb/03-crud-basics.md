---
title: "第3章：CRUD 操作基础"
description: "插入、查询、更新、删除文档的基本操作"
---

# 第3章：CRUD 操作基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何向 MongoDB 中插入数据？
- 如何查询符合条件的文档？
- 如何更新文档中的特定字段？
- 如何删除不需要的文档？

这一章会带你掌握 MongoDB 的 CRUD（创建、读取、更新、删除）操作，这是日常开发中最常用的技能。

---

## 3.1 插入操作

### insertOne：插入单个文档

```javascript
// ✅ 插入单个文档
db.users.insertOne({
    name: "张三",              // 字符串字段
    age: 25,                  // 整数类型
    email: "zhangsan@example.com",
    isStudent: false,         // 布尔类型
    hobbies: ["读书", "游泳"], // 数组类型
    address: {                // 嵌套文档
        city: "北京",
        district: "海淀区"
    },
    created_at: new Date()    // 日期类型
})
// 输出：{ acknowledged: true, insertedId: ObjectId("64a7e8d5f3c2b1a0e4d8c9b7") }

// ✅ 指定 _id 字段
db.users.insertOne({
    _id: 1,                   // 自定义 _id（整数类型）
    name: "李四",
    age: 30
})

// ❌ 错误：_id 必须唯一
db.users.insertOne({
    _id: 1,                   // 已经存在 _id 为 1 的文档
    name: "王五"
})
// 报错：E11000 duplicate key error collection: mydb.users index: _id_ dup key: { _id: 1 }
```

### insertMany：插入多个文档

```javascript
// ✅ 插入多个文档
db.users.insertMany([
    {
        name: "张三",
        age: 25,
        email: "zhangsan@example.com"
    },
    {
        name: "李四",
        age: 30,
        email: "lisi@example.com"
    },
    {
        name: "王五",
        age: 28,
        email: "wangwu@example.com"
    }
])
// 输出：
// {
//   acknowledged: true,
//   insertedIds: {
//     '0': ObjectId("64a7e8d5f3c2b1a0e4d8c9b7"),
//     '1': ObjectId("64a7e8d5f3c2b1a0e4d8c9b8"),
//     '2': ObjectId("64a7e8d5f3c2b1a0e4d8c9b9")
//   }
// }

// ✅ 使用 ordered: false 继续插入（即使某个文档失败）
db.users.insertMany(
    [
        { _id: 10, name: "赵六", age: 35 },
        { _id: 10, name: "孙七", age: 40 },  // _id 重复，会失败
        { _id: 11, name: "周八", age: 45 }
    ],
    { ordered: false }  // 即使某个文档失败，也会继续插入其他文档
)
// 输出：会插入 _id 为 10 和 11 的文档，_id 为 10 的第二个文档会报错

// ❌ 错误：ordered: true（默认）时，遇到错误会停止
db.users.insertMany(
    [
        { _id: 20, name: "吴九", age: 50 },
        { _id: 20, name: "郑十", age: 55 },  // _id 重复
        { _id: 21, name: "冯十一", age: 60 }  // 不会插入
    ]
)
// 报错后停止，_id 为 21 的文档不会插入
```

---

## 3.2 查询操作

### find：查询多个文档

```javascript
// ✅ 查询所有文档
db.users.find()
// 输出：所有用户文档

// ✅ 格式化输出（更易读）
db.users.find().pretty()

// ✅ 条件查询：查询年龄为 25 的用户
db.users.find({ age: 25 })
// 相当于 SQL：SELECT * FROM users WHERE age = 25

// ✅ 条件查询：查询年龄大于 25 的用户
db.users.find({ age: { $gt: 25 } })
// 相当于 SQL：SELECT * FROM users WHERE age > 25
// $gt 表示 "greater than"（大于）

// ✅ 条件查询：查询年龄在 20 到 30 之间的用户
db.users.find({ age: { $gte: 20, $lte: 30 } })
// 相当于 SQL：SELECT * FROM users WHERE age >= 20 AND age <= 30
// $gte 表示 "greater than or equal"（大于等于）
// $lte 表示 "less than or equal"（小于等于）

// ✅ 条件查询：查询年龄不等于 25 的用户
db.users.find({ age: { $ne: 25 } })
// 相当于 SQL：SELECT * FROM users WHERE age != 25
// $ne 表示 "not equal"（不等于）

// ✅ 条件查询：查询年龄在指定范围内的用户
db.users.find({ age: { $in: [25, 28, 30] } })
// 相当于 SQL：SELECT * FROM users WHERE age IN (25, 28, 30)
// $in 表示 "in"（在...中）

// ✅ 条件查询：查询年龄不在指定范围内的用户
db.users.find({ age: { $nin: [25, 28, 30] } })
// 相当于 SQL：SELECT * FROM users WHERE age NOT IN (25, 28, 30)
// $nin 表示 "not in"（不在...中）
```

### findOne：查询单个文档

```javascript
// ✅ 查询第一个匹配的文档
db.users.findOne({ name: "张三" })
// 输出：{ _id: ObjectId("..."), name: "张三", age: 25, ... }

// ✅ 查询 _id 指定的文档
db.users.findOne({ _id: ObjectId("64a7e8d5f3c2b1a0e4d8c9b7") })

// ✅ 查询年龄最大的用户
db.users.findOne({}, { sort: { age: -1 } })
// sort: -1 表示降序（从大到小）
// sort: 1 表示升序（从小到大）
```

### 逻辑操作符

```javascript
// ✅ AND 查询：同时满足多个条件
db.users.find({
    age: { $gt: 25 },      // 年龄大于 25
    isStudent: false        // 且不是学生
})
// 相当于 SQL：SELECT * FROM users WHERE age > 25 AND isStudent = false

// ✅ OR 查询：满足任一条件
db.users.find({
    $or: [
        { age: { $lt: 20 } },  // 年龄小于 20
        { age: { $gt: 30 } }   // 或年龄大于 30
    ]
})
// 相当于 SQL：SELECT * FROM users WHERE age < 20 OR age > 30

// ✅ NOT 查询：不满足条件
db.users.find({
    age: { $not: { $gt: 30 } }  // 年龄不大于 30
})
// 相当于 SQL：SELECT * FROM users WHERE NOT (age > 30)

// ✅ NOR 查询：都不满足
db.users.find({
    $nor: [
        { age: { $lt: 20 } },  // 年龄不小于 20
        { age: { $gt: 30 } }   // 且年龄不大于 30
    ]
})
// 相当于 SQL：SELECT * FROM users WHERE NOT (age < 20 OR age > 30)
```

### 字段操作符

```javascript
// ✅ 查询指定字段（投影）
db.users.find({}, { name: 1, email: 1 })
// 只返回 name 和 email 字段，_id 默认会返回
// 输出：[ { _id: ..., name: "张三", email: "zhangsan@example.com" }, ... ]

// ✅ 排除指定字段
db.users.find({}, { password: 0, secret: 0 })
// 返回所有字段，除了 password 和 secret

// ✅ 查询指定字段，排除 _id
db.users.find({}, { name: 1, email: 1, _id: 0 })
// 输出：[ { name: "张三", email: "zhangsan@example.com" }, ... ]

// ✅ 查询嵌套文档
db.users.find({ "address.city": "北京" })
// 注意：嵌套字段要用引号包裹，用点号分隔
// 相当于 SQL：SELECT * FROM users WHERE address.city = '北京'

// ✅ 查询数组中包含某个值
db.users.find({ hobbies: "读书" })
// 查询 hobbies 数组中包含 "读书" 的用户

// ✅ 查询数组中所有值都匹配
db.users.find({ hobbies: { $all: ["读书", "游泳"] } })
// 查询 hobbies 数组同时包含 "读书" 和 "游泳" 的用户

// ✅ 查询数组大小
db.users.find({ hobbies: { $size: 2 } })
// 查询 hobbies 数组长度为 2 的用户

// ✅ 查询数组中指定位置的元素
db.users.find({ "hobbies.0": "读书" })
// 查询 hobbies 数组第一个元素是 "读书" 的用户
```

### 正则表达式查询

```javascript
// ✅ 查询 name 以 "张" 开头的用户
db.users.find({ name: /^张/ })
// 相当于 SQL：SELECT * FROM users WHERE name LIKE '张%'

// ✅ 查询 name 包含 "三" 的用户
db.users.find({ name: /三/ })
// 相当于 SQL：SELECT * FROM users WHERE name LIKE '%三%'

// ✅ 查询 name 以 "三" 结尾的用户
db.users.find({ name: /三$/ })
// 相当于 SQL：SELECT * FROM users WHERE name LIKE '%三'

// ✅ 忽略大小写的正则查询
db.users.find({ name: { $regex: /^zhang/i } })
// $regex: 正则表达式
// i: 忽略大小写
```

### 分页和排序

```javascript
// ✅ 排序：按年龄升序
db.users.find().sort({ age: 1 })
// sort: 1 表示升序

// ✅ 排序：按年龄降序
db.users.find().sort({ age: -1 })
// sort: -1 表示降序

// ✅ 多字段排序：先按年龄降序，再按姓名升序
db.users.find().sort({ age: -1, name: 1 })

// ✅ 限制返回数量
db.users.find().limit(10)
// 只返回前 10 个文档

// ✅ 跳过指定数量
db.users.find().skip(20)
// 跳过前 20 个文档

// ✅ 分页查询：第 3 页，每页 10 条
db.users.find().skip(20).limit(10)
// skip: 跳过前 20 条（第 1 页 10 条 + 第 2 页 10 条）
// limit: 返回 10 条

// ✅ 统计文档数量
db.users.countDocuments({ age: { $gt: 25 } })
// 返回年龄大于 25 的用户数量

// ✅ 估算文档数量（更快，但不精确）
db.users.estimatedDocumentCount()
// 返回集合中的总文档数量（使用元数据，更快）
```

---

## 3.3 更新操作

### updateOne：更新单个文档

```javascript
// ✅ 更新单个文档
db.users.updateOne(
    { name: "张三" },           // 查询条件
    { $set: { age: 26 } }       // 更新操作
)
// 输出：{ acknowledged: true, matchedCount: 1, modifiedCount: 1 }
// matchedCount: 匹配的文档数量
// modifiedCount: 修改的文档数量

// ✅ 使用 $set 更新多个字段
db.users.updateOne(
    { name: "张三" },
    { $set: { age: 26, email: "zhangsan_new@example.com" } }
)

// ✅ 使用 $inc 增加数值
db.users.updateOne(
    { name: "张三" },
    { $inc: { age: 1 } }        // 年龄加 1
)
// $inc: increment（增加）

// ✅ 使用 $inc 减少数值
db.users.updateOne(
    { name: "张三" },
    { $inc: { age: -1 } }       // 年龄减 1
)

// ✅ 使用 $unset 删除字段
db.users.updateOne(
    { name: "张三" },
    { $unset: { email: "" } }   // 删除 email 字段
)
// $unset: 删除字段，值可以是任意值

// ✅ 使用 $rename 重命名字段
db.users.updateOne(
    { name: "张三" },
    { $rename: { email: "contactEmail" } }
)
// 将 email 字段重命名为 contactEmail
```

### updateMany：更新多个文档

```javascript
// ✅ 更新所有匹配的文档
db.users.updateMany(
    { age: { $lt: 20 } },       // 查询年龄小于 20 的用户
    { $set: { isStudent: true } }  // 设置 isStudent 为 true
)
// 输出：{ acknowledged: true, matchedCount: 5, modifiedCount: 5 }

// ✅ 给所有用户添加字段
db.users.updateMany(
    {},                          // 空条件，匹配所有文档
    { $set: { status: "active" } }
)
```

### replaceOne：替换整个文档

```javascript
// ✅ 替换整个文档（除了 _id）
db.users.replaceOne(
    { name: "张三" },
    {
        name: "张三",
        age: 27,
        email: "zhangsan@example.com",
        phone: "13800138000"
    }
)
// 注意：替换会删除原文档中其他字段，只保留新文档中的字段

// ❌ 错误：替换时不能修改 _id
db.users.replaceOne(
    { name: "张三" },
    {
        _id: ObjectId("..."),   // 不能修改 _id
        name: "张三",
        age: 27
    }
)
```

### 更新操作符

#### 字段操作符

```javascript
// ✅ $set：设置字段值
db.users.updateOne(
    { name: "张三" },
    { $set: { age: 26 } }
)

// ✅ $unset：删除字段
db.users.updateOne(
    { name: "张三" },
    { $unset: { email: "" } }
)

// ✅ $inc：增加数值
db.users.updateOne(
    { name: "张三" },
    { $inc: { age: 1, score: 5 } }  // age 加 1，score 加 5
)

// ✅ $mul：乘以数值
db.users.updateOne(
    { name: "张三" },
    { $mul: { score: 1.1 } }  // score 乘以 1.1（增加 10%）
)

// ✅ $min：如果当前值大于指定值，则更新
db.users.updateOne(
    { name: "张三" },
    { $min: { age: 25 } }  // 如果 age > 25，则更新为 25
)

// ✅ $max：如果当前值小于指定值，则更新
db.users.updateOne(
    { name: "张三" },
    { $max: { age: 30 } }  // 如果 age < 30，则更新为 30
)

// ✅ $rename：重命名字段
db.users.updateOne(
    { name: "张三" },
    { $rename: { email: "contactEmail" } }
)

// ✅ $currentDate：设置为当前日期
db.users.updateOne(
    { name: "张三" },
    { $currentDate: { lastModified: true } }
)
```

#### 数组操作符

```javascript
// ✅ $push：向数组添加元素
db.users.updateOne(
    { name: "张三" },
    { $push: { hobbies: "编程" } }  // 向 hobbies 数组添加 "编程"
)

// ✅ $push + $each：添加多个元素
db.users.updateOne(
    { name: "张三" },
    {
        $push: {
            hobbies: {
                $each: ["读书", "游泳", "编程"]  // 添加多个元素
            }
        }
    }
)

// ✅ $push + $slice：限制数组大小
db.users.updateOne(
    { name: "张三" },
    {
        $push: {
            scores: {
                $each: [95, 98],  // 添加元素
                $slice: -5        // 只保留最后 5 个元素
            }
        }
    }
)

// ✅ $push + $sort：排序数组
db.users.updateOne(
    { name: "张三" },
    {
        $push: {
            scores: {
                $each: [{ subject: "数学", score: 95 }],
                $sort: { score: -1 }  // 按 score 降序排序
            }
        }
    }
)

// ✅ $addToSet：添加元素（如果不存在）
db.users.updateOne(
    { name: "张三" },
    { $addToSet: { hobbies: "编程" } }
)
// 如果 hobbies 数组中已经有 "编程"，则不会添加
// 避免重复

// ✅ $addToSet + $each：添加多个不重复的元素
db.users.updateOne(
    { name: "张三" },
    {
        $addToSet: {
            hobbies: { $each: ["读书", "游泳", "编程"] }
        }
    }
)

// ✅ $pop：从数组末尾删除元素
db.users.updateOne(
    { name: "张三" },
    { $pop: { hobbies: 1 } }  // 1 表示从末尾删除
)

// ✅ $pop：从数组开头删除元素
db.users.updateOne(
    { name: "张三" },
    { $pop: { hobbies: -1 } }  // -1 表示从开头删除
)

// ✅ $pull：删除数组中所有匹配的元素
db.users.updateOne(
    { name: "张三" },
    { $pull: { hobbies: "游泳" } }  // 删除所有 "游泳"
)

// ✅ $pullAll：删除数组中多个指定的元素
db.users.updateOne(
    { name: "张三" },
    { $pullAll: { hobbies: ["游泳", "编程"] } }
)

// ✅ 数组位置操作符 $[]
db.users.updateOne(
    { name: "张三", "scores.subject": "数学" },
    { $set: { "scores.$.score": 100 } }
)
// 更新 scores 数组中第一个 subject 为 "数学" 的元素的 score

// ✅ 数组位置操作符 $[<identifier>]（更新所有匹配的元素）
db.users.updateOne(
    { name: "张三" },
    { $set: { "scores.$[elem].score": 100 } },
    {
        arrayFilters: [
            { "elem.score": { $lt: 60 } }  // 只更新 score < 60 的元素
        ]
    }
)
```

### upsert：插入或更新

```javascript
// ✅ upsert：如果存在则更新，不存在则插入
db.users.updateOne(
    { name: "张三" },
    { $set: { age: 26, email: "zhangsan@example.com" } },
    { upsert: true }  // upsert: true 表示如果不存在则插入
)
// 如果 name 为 "张三" 的文档存在，则更新
// 如果不存在，则插入一个新文档

// ✅ 使用 $setOnInsert：只在插入时设置字段
db.users.updateOne(
    { name: "李四" },
    {
        $set: { age: 30 },           // 更新或插入时都设置
        $setOnInsert: {              // 只在插入时设置
            created_at: new Date(),
            status: "new"
        }
    },
    { upsert: true }
)
```

---

## 3.4 删除操作

### deleteOne：删除单个文档

```javascript
// ✅ 删除第一个匹配的文档
db.users.deleteOne({ name: "张三" })
// 输出：{ acknowledged: true, deletedCount: 1 }
// deletedCount: 删除的文档数量

// ✅ 删除 _id 指定的文档
db.users.deleteOne({ _id: ObjectId("64a7e8d5f3c2b1a0e4d8c9b7") })
```

### deleteMany：删除多个文档

```javascript
// ✅ 删除所有匹配的文档
db.users.deleteMany({ age: { $lt: 20 } })
// 删除所有年龄小于 20 的用户

// ✅ 删除所有文档
db.users.deleteMany({})
// 空条件，删除所有文档

// ✅ 删除集合（更快）
db.users.drop()
// 删除整个集合，包括索引和元数据
```

### 删除字段

```javascript
// ✅ 使用 $unset 删除字段
db.users.updateMany(
    {},
    { $unset: { temp_field: "" } }
)
// 删除所有文档中的 temp_field 字段

// ✅ 使用 $pull 删除数组中的元素
db.users.updateMany(
    {},
    { $pull: { hobbies: "已删除的爱好" } }
)
```

---

## 3.5 批量操作

### ordered 批量操作

```javascript
// ✅ 有序批量操作（按顺序执行，遇到错误停止）
db.users.bulkWrite([
    { insertOne: { document: { name: "张三", age: 25 } } },
    { updateOne: {
        filter: { name: "李四" },
        update: { $set: { age: 31 } }
    }},
    { deleteOne: { filter: { name: "王五" } } }
])
// 按顺序执行：先插入，再更新，最后删除

// ❌ 错误：如果某个操作失败，后续操作不会执行
```

### unordered 批量操作

```javascript
// ✅ 无序批量操作（并行执行，忽略错误继续）
db.users.bulkWrite(
    [
        { insertOne: { document: { _id: 1, name: "张三" } } },
        { insertOne: { document: { _id: 1, name: "李四" } } },  // _id 重复，会失败
        { insertOne: { document: { _id: 2, name: "王五" } } }
    ],
    { ordered: false }  // 无序执行，即使某个失败也会继续
)
```

---

## 3.6 对比表格

### CRUD 操作对比

| 操作 | MongoDB | MySQL | 说明 |
|------|---------|-------|------|
| **插入单个** | `insertOne()` | `INSERT INTO ... VALUES ...` | 插入单个文档/行 |
| **插入多个** | `insertMany()` | `INSERT INTO ... VALUES ...` | 插入多个文档/行 |
| **查询所有** | `find()` | `SELECT * FROM ...` | 查询所有文档/行 |
| **条件查询** | `find({ age: { $gt: 25 } })` | `SELECT * FROM ... WHERE age > 25` | 条件查询 |
| **更新单个** | `updateOne()` | `UPDATE ... LIMIT 1` | 更新单个文档/行 |
| **更新多个** | `updateMany()` | `UPDATE ... WHERE ...` | 更新多个文档/行 |
| **删除单个** | `deleteOne()` | `DELETE FROM ... LIMIT 1` | 删除单个文档/行 |
| **删除多个** | `deleteMany()` | `DELETE FROM ... WHERE ...` | 删除多个文档/行 |

### 更新操作符对比

| 操作符 | 说明 | MySQL 对应 |
|--------|------|-----------|
| `$set` | 设置字段值 | `UPDATE ... SET field = value` |
| `$unset` | 删除字段 | 无直接对应 |
| `$inc` | 增加数值 | `UPDATE ... SET field = field + value` |
| `$mul` | 乘以数值 | `UPDATE ... SET field = field * value` |
| `$push` | 向数组添加元素 | 无直接对应（需要 JSON 函数） |
| `$addToSet` | 添加不重复的元素 | 无直接对应 |
| `$pull` | 删除数组中的元素 | 无直接对应 |
| `$pop` | 删除数组首尾元素 | 无直接对应 |

---

## 3.7 新手常见误区

### 误区一：updateOne 会更新所有匹配的文档

**错误认识**：`updateOne()` 会更新所有匹配的文档。

**正确理解**：`updateOne()` 只更新第一个匹配的文档。如果要更新所有匹配的文档，使用 `updateMany()`。

```javascript
// ❌ 错误：以为会更新所有 age > 25 的用户
db.users.updateOne(
    { age: { $gt: 25 } },
    { $set: { status: "senior" } }
)
// 实际只更新第一个匹配的文档

// ✅ 正确：使用 updateMany 更新所有匹配的文档
db.users.updateMany(
    { age: { $gt: 25 } },
    { $set: { status: "senior" } }
)
```

### 误区二：更新操作会替换整个文档

**错误认识**：使用 `updateOne()` 会替换整个文档。

**正确理解**：使用更新操作符（如 `$set`）只会更新指定的字段，其他字段保持不变。如果要替换整个文档，使用 `replaceOne()`。

```javascript
// ✅ 使用 $set 只更新指定字段
db.users.updateOne(
    { name: "张三" },
    { $set: { age: 26 } }  // 只更新 age 字段，其他字段不变
)

// ✅ 使用 replaceOne 替换整个文档
db.users.replaceOne(
    { name: "张三" },
    { name: "张三", age: 26 }  // 替换整个文档（除了 _id）
)
```

### 误区三：$push 和 $addToSet 没有区别

**错误认识**：`$push` 和 `$addToSet` 都是向数组添加元素，没有区别。

**正确理解**：`$push` 总是添加元素，即使元素已经存在；`$addToSet` 只在元素不存在时添加，避免重复。

```javascript
// $push：总是添加
db.users.updateOne(
    { name: "张三" },
    { $push: { hobbies: "读书" } }
)
// 如果 hobbies 已经有 "读书"，会再添加一个 "读书"
// 结果：["读书", "读书"]

// $addToSet：避免重复
db.users.updateOne(
    { name: "张三" },
    { $addToSet: { hobbies: "读书" } }
)
// 如果 hobbies 已经有 "读书"，不会添加
// 结果：["读书"]
```

### 误区四：deleteMany({}) 和 drop() 没有区别

**错误认识**：`deleteMany({})` 和 `drop()` 都是删除所有文档，没有区别。

**正确理解**：`deleteMany({})` 删除所有文档，但保留集合和索引；`drop()` 删除整个集合，包括索引和元数据。

```javascript
// deleteMany({})：删除所有文档，保留集合
db.users.deleteMany({})
// 集合 users 仍然存在，只是没有文档了

// drop()：删除整个集合
db.users.drop()
// 集合 users 被删除，包括索引和元数据
```

### 误区五：更新嵌套文档不需要引号

**错误认识**：更新嵌套文档时，可以直接用点号分隔字段名。

**正确理解**：嵌套字段名必须用引号包裹，否则会被解析为变量。

```javascript
// ❌ 错误：嵌套字段名没有用引号包裹
db.users.updateOne(
    { name: "张三" },
    { $set: { address.city: "上海" } }
)
// 报错：SyntaxError

// ✅ 正确：嵌套字段名用引号包裹
db.users.updateOne(
    { name: "张三" },
    { $set: { "address.city": "上海" } }
)
```

---

## 3.8 动手练习

### 练习 1：实现用户管理 CRUD

**要求**：
1. 创建一个 `users` 集合
2. 插入 5 个用户文档（包含姓名、年龄、邮箱、城市）
3. 查询所有年龄大于 25 的用户
4. 更新指定用户的年龄
5. 删除指定城市的用户

<details>
<summary>点击查看答案</summary>

```javascript
// 1. 插入 5 个用户
db.users.insertMany([
    { name: "张三", age: 25, email: "zhangsan@example.com", city: "北京" },
    { name: "李四", age: 30, email: "lisi@example.com", city: "上海" },
    { name: "王五", age: 28, email: "wangwu@example.com", city: "北京" },
    { name: "赵六", age: 35, email: "zhaoliu@example.com", city: "广州" },
    { name: "孙七", age: 22, email: "sunqi@example.com", city: "上海" }
])

// 2. 查询年龄大于 25 的用户
db.users.find({ age: { $gt: 25 } })

// 3. 更新指定用户的年龄
db.users.updateOne(
    { name: "张三" },
    { $set: { age: 26 } }
)

// 4. 删除北京的用户
db.users.deleteMany({ city: "北京" })

// 5. 验证结果
db.users.find()
```

</details>

### 练习 2：实现商品库存管理

**要求**：
1. 创建一个 `products` 集合
2. 插入商品文档（包含名称、价格、库存、标签）
3. 使用 `$inc` 更新库存（增加或减少）
4. 使用 `$push` 添加标签
5. 使用 `$pull` 删除标签

<details>
<summary>点击查看答案</summary>

```javascript
// 1. 插入商品
db.products.insertMany([
    { name: "iPhone 15", price: 5999, stock: 100, tags: ["手机", "苹果"] },
    { name: "MacBook Pro", price: 14999, stock: 50, tags: ["电脑", "苹果"] },
    { name: "AirPods Pro", price: 1999, stock: 200, tags: ["耳机", "苹果"] }
])

// 2. 增加库存（进货）
db.products.updateOne(
    { name: "iPhone 15" },
    { $inc: { stock: 50 } }  // 库存增加 50
)

// 3. 减少库存（销售）
db.products.updateOne(
    { name: "iPhone 15" },
    { $inc: { stock: -10 } }  // 库存减少 10
)

// 4. 添加标签
db.products.updateOne(
    { name: "iPhone 15" },
    { $push: { tags: "5G" } }  // 添加 "5G" 标签
)

// 5. 删除标签
db.products.updateOne(
    { name: "iPhone 15" },
    { $pull: { tags: "5G" } }  // 删除 "5G" 标签
)

// 6. 验证结果
db.products.find()
```

</details>

### 练习 3：实现博客文章管理

**要求**：
1. 创建一个 `articles` 集合
2. 插入文章文档（包含标题、内容、作者、标签、评论）
3. 使用 `$push` 添加评论
4. 使用 `$set` 更新文章标题
5. 使用 `$inc` 增加浏览次数

<details>
<summary>点击查看答案</summary>

```javascript
// 1. 插入文章
db.articles.insertOne({
    title: "MongoDB 入门教程",
    content: "MongoDB 是一个文档型数据库...",
    author: "张三",
    tags: ["数据库", "NoSQL"],
    comments: [],
    views: 0,
    created_at: new Date()
})

// 2. 添加评论
db.articles.updateOne(
    { title: "MongoDB 入门教程" },
    {
        $push: {
            comments: {
                user: "李四",
                content: "写得很好，学到了很多",
                created_at: new Date()
            }
        }
    }
)

// 3. 更新标题
db.articles.updateOne(
    { title: "MongoDB 入门教程" },
    { $set: { title: "MongoDB 入门教程（完整版）" } }
)

// 4. 增加浏览次数
db.articles.updateOne(
    { title: "MongoDB 入门教程（完整版）" },
    { $inc: { views: 1 } }
)

// 5. 验证结果
db.articles.find().pretty()
```

</details>

---

## 3.9 下一章预告

恭喜你完成了第三章！现在你已经掌握了 MongoDB 的 CRUD 操作，可以进行基本的数据管理了。

在下一章中，我们将学习 **数据类型与文档设计**，包括：

- MongoDB 支持的各种数据类型
- 文档设计原则：嵌入 vs 引用
- 一对一、一对多、多对多关系的设计
- 如何选择合适的文档结构

这些知识将帮助你设计出高效、合理的文档结构，继续加油！
