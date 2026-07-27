---
title: "第 4 章：查询 DSL 基础"
description: "Query DSL 语法、match、term、bool 查询"
---

# 第 4 章：查询 DSL 基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Query DSL？它和 SQL 有什么区别？
- match 查询和 term 查询有什么区别？
- bool 查询怎么组合多个条件？
- 如何控制查询的返回结果？

这一章会帮你掌握 Elasticsearch 的查询语言。Query DSL 是 Elasticsearch 的核心，学会它就能灵活地查询数据。

---

## 1 为什么需要 Query DSL？

### 痛点分析

传统数据库使用 SQL 查询，但 SQL 在全文搜索场景下有这些痛点：

- **模糊查询慢**：`LIKE '%关键词%'` 无法利用索引，全表扫描
- **无法分词**：无法智能地拆分和匹配关键词
- **相关性排序难**：无法根据匹配度自动排序
- **复杂查询难写**：多条件组合查询 SQL 很复杂

### 解决方案

Query DSL（Domain Specific Language）是 Elasticsearch 的查询语言，它：

- **基于 JSON**：结构清晰，易于理解
- **功能强大**：支持全文搜索、结构化查询、聚合分析
- **灵活组合**：可以轻松组合多个查询条件

打个比方：

> SQL 像普通话，标准但不够灵活。Query DSL 像方言，针对搜索场景优化，表达力更强。

---

## 2 Query DSL 基础语法

### 基本结构

```bash
GET /products/_search
{
  "query": {
    # 查询条件写在这里
  }
}
```

### 查询 vs 过滤

Elasticsearch 中有两种查询上下文：

| 上下文 | 说明 | 是否计算评分 |
|--------|------|-------------|
| Query Context | 查询匹配度，计算相关性评分 | 是 |
| Filter Context | 过滤数据，不计算评分 | 否 |

```bash
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        # Query Context：计算评分
        { "match": { "name": "手机" } }
      ],
      "filter": [
        # Filter Context：不计算评分，性能更好
        { "term": { "category": "电子产品" } }
      ]
    }
  }
}
```

---

## 3 match 查询

### 概念解释

**match 查询**用于全文搜索，会对查询字符串进行分词处理。

### 基础用法

```bash
# 搜索包含"手机"的商品
GET /products/_search
{
  "query": {
    "match": {
      "name": "手机"
    }
  }
}
```

### 分词原理

```
查询："苹果手机"
分词后：["苹果", "手机"]
匹配：包含"苹果"或"手机"的文档都会被匹配
```

### 控制分词行为

```bash
# 要求所有词都必须匹配
GET /products/_search
{
  "query": {
    "match": {
      "name": {
        "query": "苹果手机",
        "operator": "and"  # 默认是 "or"
      }
    }
  }
}
```

---

## 4 term 查询

### 概念解释

**term 查询**用于精确匹配，不会对查询字符串进行分词。

### 基础用法

```bash
# 精确匹配分类为"手机"的商品
GET /products/_search
{
  "query": {
    "term": {
      "category": "手机"
    }
  }
}
```

### match vs term 对比

| 特性 | match 查询 | term 查询 |
|------|-----------|----------|
| 分词 | 会分词 | 不分词 |
| 适用场景 | 全文搜索 | 精确匹配 |
| 字段类型 | text | keyword、数值、日期 |
| 示例 | 搜索"苹果手机" | 匹配状态"已发布" |

### 代码对比

```bash
# ✅ text 字段用 match
GET /products/_search
{
  "query": {
    "match": {
      "description": "高性能笔记本"
    }
  }
}

# ✅ keyword 字段用 term
GET /products/_search
{
  "query": {
    "term": {
      "status": "published"
    }
  }
}

# ❌ text 字段用 term（错误示例）
GET /products/_search
{
  "query": {
    "term": {
      "description": "高性能笔记本"  # 不会分词，可能匹配不到
    }
  }
}
```

---

## 5 bool 查询

### 概念解释

**bool 查询**用于组合多个查询条件，类似于 SQL 的 AND/OR。

### 子句类型

| 子句 | 说明 | SQL 等价 |
|------|------|---------|
| must | 必须匹配，计算评分 | AND |
| should | 应该匹配，计算评分 | OR |
| must_not | 必须不匹配 | NOT |
| filter | 必须匹配，不计算评分 | AND（过滤） |

### 基础用法

```bash
# 搜索名称包含"手机"且价格在 5000-10000 之间的商品
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "手机" } }
      ],
      "filter": [
        { "range": { "price": { "gte": 5000, "lte": 10000 } } }
      ]
    }
  }
}
```

### 复杂组合

```bash
# 搜索：
# - 名称必须包含"手机"
# - 分类必须是"电子产品"
# - 价格最好在 5000-10000（非必须）
# - 品牌不能是"山寨"
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "手机" } }
      ],
      "filter": [
        { "term": { "category": "电子产品" } }
      ],
      "should": [
        { "range": { "price": { "gte": 5000, "lte": 10000 } } }
      ],
      "must_not": [
        { "term": { "brand": "山寨" } }
      ]
    }
  }
}
```

---

## 6 控制返回结果

### 限制返回数量

```bash
# 只返回前 10 条
GET /products/_search
{
  "query": {
    "match_all": {}
  },
  "size": 10
}
```

### 分页查询

```bash
# 第 2 页，每页 10 条
GET /products/_search
{
  "query": {
    "match_all": {}
  },
  "from": 10,
  "size": 10
}
```

### 指定返回字段

```bash
# 只返回 name 和 price 字段
GET /products/_search
{
  "query": {
    "match_all": {}
  },
  "_source": ["name", "price"]
}
```

### 排序

```bash
# 按价格降序排列
GET /products/_search
{
  "query": {
    "match_all": {}
  },
  "sort": [
    { "price": { "order": "desc" } }
  ]
}
```

---

## 7 核心知识点总结

| 查询类型 | 说明 | 适用场景 |
|---------|------|---------|
| match | 全文搜索，会分词 | text 字段搜索 |
| term | 精确匹配，不分词 | keyword、数值、日期 |
| bool | 组合多个查询 | 复杂条件查询 |
| match_all | 匹配所有文档 | 查询全部数据 |

---

## 8 新手常见误区

### 误区 1："text 字段用 term 查询"

**错！** text 字段在索引时会分词，用 term 查询可能匹配不到。

正确做法：text 字段用 match 查询，keyword 字段用 term 查询。

### 误区 2："bool 查询中 must 越多越好"

不是的。对于不需要计算评分的条件，应该用 filter，性能更好。

### 误区 3："分页深度可以无限大"

Elasticsearch 默认限制 `from + size <= 10000`。深度分页需要使用 `search_after` 或 `scroll`。

---

## 9 动手练习

### 练习 1：基础查询

搜索名称包含"手机"的商品。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "query": {
    "match": {
      "name": "手机"
    }
  }
}
```

</details>

### 练习 2：精确匹配

查询分类为"电子产品"且状态为"已上架"的商品。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "category": "电子产品" } },
        { "term": { "status": "已上架" } }
      ]
    }
  }
}
```

</details>

### 练习 3（挑战）：复杂查询

搜索名称包含"手机"或"平板"，价格在 3000-10000 之间，按价格降序排列，返回前 20 条。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "query": {
    "bool": {
      "should": [
        { "match": { "name": "手机" } },
        { "match": { "name": "平板" } }
      ],
      "filter": [
        { "range": { "price": { "gte": 3000, "lte": 10000 } } }
      ]
    }
  },
  "sort": [
    { "price": { "order": "desc" } }
  ],
  "size": 20
}
```

</details>

---

## 下一章预告

下一章我们会学习 **条件查询与过滤**——也就是 range、terms、exists、bool 复合查询。你会学到更灵活的条件组合方式。
