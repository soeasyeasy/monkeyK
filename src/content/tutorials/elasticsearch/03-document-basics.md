---
title: "第 3 章：文档操作基础"
description: "文档的增删改查、批量操作、版本控制"
---

# 第 3 章：文档操作基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何向 Elasticsearch 中添加文档？
- 如何查询、更新和删除文档？
- 批量操作怎么做？为什么需要批量操作？
- 什么是版本控制？如何避免并发冲突？

这一章会帮你掌握文档的基本操作。这些是日常开发中最常用的功能。

---

## 1 为什么需要掌握文档操作？

### 痛点分析

很多新手学完概念后，直接跳到复杂查询，结果遇到这些问题：

- **操作不熟练**：基本的增删改查都要查文档
- **性能意识差**：逐条插入数据，不知道批量操作
- **并发问题**：多人同时更新同一文档，数据混乱
- **版本混乱**：不知道文档被修改了多少次

### 解决方案

先掌握基础操作，再学高级功能，循序渐进。

打个比方：

> 学开车前，你要先学会启动、停车、转弯，而不是直接学漂移。

---

## 2 添加文档

### 基础语法

添加文档有两种方式：

**方式 1：自动生成 ID**

```bash
# POST 请求，自动生成文档 ID
POST /products/_doc
{
  "name": "iPhone 15 Pro",
  "price": 7999,
  "category": "手机"
}
```

**方式 2：指定 ID**

```bash
# PUT 请求，手动指定文档 ID
PUT /products/_doc/1
{
  "name": "iPhone 15 Pro",
  "price": 7999,
  "category": "手机"
}
```

### 区别对比

| 特性 | POST（自动生成） | PUT（指定 ID） |
|------|----------------|---------------|
| ID 生成 | 自动生成 UUID | 手动指定 |
| 幂等性 | 非幂等（每次新增） | 幂等（相同 ID 会覆盖） |
| 适用场景 | 日志、事件等不关心 ID | 用户、商品等有业务 ID |

### 代码示例

```bash
# 自动生成 ID
POST /products/_doc
{
  "name": "iPhone 15 Pro",
  "price": 7999,
  "category": "手机"
}

# 返回结果
{
  "_index": "products",
  "_id": "abc123xyz",  // 自动生成的 ID
  "_version": 1,
  "result": "created"
}

# 指定 ID
PUT /products/_doc/1001
{
  "name": "MacBook Pro",
  "price": 14999,
  "category": "电脑"
}

# 返回结果
{
  "_index": "products",
  "_id": "1001",  // 指定的 ID
  "_version": 1,
  "result": "created"
}
```

---

## 3 查询文档

### 根据 ID 查询

```bash
# 查询指定 ID 的文档
GET /products/_doc/1001

# 返回结果
{
  "_index": "products",
  "_id": "1001",
  "_version": 1,
  "_source": {
    "name": "MacBook Pro",
    "price": 14999,
    "category": "电脑"
  }
}
```

### 查询所有文档

```bash
# 查询索引中的所有文档
GET /products/_search
{
  "query": {
    "match_all": {}
  }
}
```

### 条件查询

```bash
# 查询价格为 7999 的商品
GET /products/_search
{
  "query": {
    "term": {
      "price": 7999
    }
  }
}

# 查询分类为"手机"的商品
GET /products/_search
{
  "query": {
    "match": {
      "category": "手机"
    }
  }
}
```

---

## 4 更新文档

### 全量更新

```bash
# 覆盖整个文档
PUT /products/_doc/1001
{
  "name": "MacBook Pro 2024",
  "price": 15999,
  "category": "电脑",
  "brand": "Apple"
}
```

### 局部更新

```bash
# 只更新指定字段
POST /products/_update/1001
{
  "doc": {
    "price": 16999
  }
}
```

### 使用脚本更新

```bash
# 使用脚本进行复杂更新
POST /products/_update/1001
{
  "script": {
    "source": "ctx._source.price += 1000",
    "lang": "painless"
  }
}
```

---

## 5 删除文档

### 删除单个文档

```bash
# 删除指定 ID 的文档
DELETE /products/_doc/1001

# 返回结果
{
  "_index": "products",
  "_id": "1001",
  "_version": 2,
  "result": "deleted"
}
```

### 删除多个文档

```bash
# 删除符合条件的文档
POST /products/_delete_by_query
{
  "query": {
    "term": {
      "category": "电脑"
    }
  }
}
```

---

## 6 批量操作

### 批量添加（Bulk API）

```bash
# 批量添加多个文档
POST /_bulk
{"index": {"_index": "products", "_id": "1"}}
{"name": "iPhone 15 Pro", "price": 7999, "category": "手机"}
{"index": {"_index": "products", "_id": "2"}}
{"name": "MacBook Pro", "price": 14999, "category": "电脑"}
{"index": {"_index": "products", "_id": "3"}}
{"name": "iPad Pro", "price": 6999, "category": "平板"}
```

### 批量操作类型

| 操作 | 说明 | 示例 |
|------|------|------|
| index | 添加或覆盖文档 | `{"index": {"_index": "test", "_id": "1"}}` |
| create | 仅添加（ID 存在则失败） | `{"create": {"_index": "test", "_id": "1"}}` |
| update | 更新文档 | `{"update": {"_index": "test", "_id": "1"}}` |
| delete | 删除文档 | `{"delete": {"_index": "test", "_id": "1"}}` |

### 混合批量操作

```bash
# 同时执行多种操作
POST /_bulk
{"index": {"_index": "products", "_id": "1"}}
{"name": "iPhone 15 Pro", "price": 7999}
{"update": {"_index": "products", "_id": "2"}}
{"doc": {"price": 15999}}
{"delete": {"_index": "products", "_id": "3"}}
{"create": {"_index": "products", "_id": "4"}}
{"name": "AirPods Pro", "price": 1999}
```

### 为什么需要批量操作？

**性能对比**：

```java
// ❌ 逐条插入（慢）
for (Product product : products) {
    elasticsearchClient.index(product);
}

// ✅ 批量插入（快）
BulkRequest request = new BulkRequest();
for (Product product : products) {
    request.add(new IndexRequest("products").source(product));
}
elasticsearchClient.bulk(request);
```

> **性能提升**：批量操作比逐条操作快 10-50 倍，因为减少了网络往返次数。

---

## 7 版本控制

### 乐观锁机制

Elasticsearch 使用**乐观锁**来避免并发冲突。

```bash
# 第一次更新
POST /products/_update/1001?version=1
{
  "doc": {
    "price": 15999
  }
}

# 第二次更新（版本号不匹配会失败）
POST /products/_update/1001?version=1
{
  "doc": {
    "price": 16999
  }
}

# 返回错误
{
  "error": {
    "type": "version_conflict_engine_exception",
    "reason": "[1001]: version conflict, current version [2] is different than the one provided [1]"
  }
}
```

### 使用 seq_no 和 primary_term

```bash
# 查询文档时获取序列号
GET /products/_doc/1001

# 返回
{
  "_seq_no": 5,
  "_primary_term": 1
}

# 更新时指定序列号
POST /products/_update/1001?if_seq_no=5&if_primary_term=1
{
  "doc": {
    "price": 16999
  }
}
```

---

## 8 核心知识点总结

| 操作 | 方法 | 说明 |
|------|------|------|
| 添加文档 | POST/PUT | 支持自动生成 ID 或指定 ID |
| 查询文档 | GET | 根据 ID 查询或条件查询 |
| 更新文档 | PUT/POST | 全量更新或局部更新 |
| 删除文档 | DELETE | 删除单个或批量删除 |
| 批量操作 | Bulk API | 一次性执行多个操作 |
| 版本控制 | version/seq_no | 避免并发冲突 |

---

## 9 新手常见误区

### 误区 1："更新文档就是修改原数据"

**错！** Elasticsearch 的文档是**不可变的**。更新操作实际上是删除旧文档，添加新文档。

### 误区 2："批量操作没有大小限制"

不是的。批量请求过大（超过 10MB）会导致内存问题。建议每批 5-10MB 或 500-1000 条文档。

### 误区 3："版本控制可以解决所有并发问题"

版本控制只能检测冲突，不能自动解决冲突。冲突时需要业务层决定如何处理（重试、合并等）。

---

## 10 动手练习

### 练习 1：基础操作

创建一个 `books` 索引，添加 3 本书，然后查询所有书籍。

<details>
<summary>点击查看答案</summary>

```bash
# 创建索引
PUT /books
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}

# 添加书籍
POST /books/_doc
{
  "title": "Java 编程思想",
  "author": "Bruce Eckel",
  "price": 108
}

POST /books/_doc
{
  "title": "Java 核心技术",
  "author": "Cay Horstmann",
  "price": 119
}

POST /books/_doc
{
  "title": "Python 编程",
  "author": "Eric Matthes",
  "price": 89
}

# 查询所有
GET /books/_search
{
  "query": {
    "match_all": {}
  }
}
```

</details>

### 练习 2：批量操作

使用 Bulk API 批量添加 5 个商品。

<details>
<summary>点击查看答案</summary>

```bash
POST /_bulk
{"index": {"_index": "products", "_id": "1"}}
{"name": "iPhone 15", "price": 5999, "category": "手机"}
{"index": {"_index": "products", "_id": "2"}}
{"name": "MacBook Air", "price": 8999, "category": "电脑"}
{"index": {"_index": "products", "_id": "3"}}
{"name": "iPad Air", "price": 4799, "category": "平板"}
{"index": {"_index": "products", "_id": "4"}}
{"name": "Apple Watch", "price": 2999, "category": "手表"}
{"index": {"_index": "products", "_id": "5"}}
{"name": "AirPods Pro", "price": 1999, "category": "耳机"}
```

</details>

### 练习 3（挑战）：版本控制

查询一个文档的版本号，然后尝试用错误的版本号更新，观察结果。

<details>
<summary>点击查看答案</summary>

```bash
# 查询文档
GET /products/_doc/1

# 假设返回 _version: 1

# 使用错误版本号更新（会失败）
POST /products/_update/1?version=999
{
  "doc": {
    "price": 9999
  }
}

# 返回 version_conflict_engine_exception 错误
```

</details>

---

## 下一章预告

下一章我们会学习 **查询 DSL 基础**——也就是 Query DSL 语法、match、term、bool 查询。你会学到如何灵活地查询数据。
