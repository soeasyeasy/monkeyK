---
title: "第 5 章：条件查询与过滤"
description: "range、terms、exists、bool 复合查询"
---

# 第 5 章：条件查询与过滤

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何查询价格范围内的商品？
- 如何匹配多个值中的任意一个？
- 如何判断字段是否存在？
- 如何组合复杂的查询条件？

这一章会帮你掌握 Elasticsearch 的条件查询和过滤技术。这些是构建复杂查询的基础。

---

## 5.1 为什么需要条件查询？

### 痛点分析

在实际业务中，查询需求往往很复杂：

- **范围查询**：价格区间、时间范围、年龄范围
- **多值匹配**：多个分类、多个标签、多个状态
- **存在性判断**：某些字段是否有值
- **复杂组合**：多个条件的 AND/OR/NOT 组合

简单的 match 和 term 无法满足这些需求。

### 解决方案

Elasticsearch 提供了丰富的条件查询类型：

- **range**：范围查询
- **terms**：多值匹配
- **exists**：存在性判断
- **bool**：复杂组合

打个比方：

> 如果查询是搭积木，这些条件查询就是不同形状的积木，可以组合出各种复杂的查询。

---

## 5.2 range 查询

### 概念解释

**range 查询**用于匹配某个范围内的值，适用于数值、日期、字符串。

### 数值范围查询

```bash
# 查询价格在 5000-10000 之间的商品
GET /products/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 5000,  # 大于等于
        "lte": 10000  # 小于等于
      }
    }
  }
}
```

### 范围操作符

| 操作符 | 说明 | SQL 等价 |
|--------|------|---------|
| gte | 大于等于 | >= |
| gt | 大于 | > |
| lte | 小于等于 | <= |
| lt | 小于 | < |

### 日期范围查询

```bash
# 查询最近 7 天创建的商品
GET /products/_search
{
  "query": {
    "range": {
      "created_at": {
        "gte": "now-7d",
        "lte": "now"
      }
    }
  }
}

# 查询 2024 年 1 月的订单
GET /orders/_search
{
  "query": {
    "range": {
      "order_date": {
        "gte": "2024-01-01",
        "lte": "2024-01-31"
      }
    }
  }
}
```

### 字符串范围查询

```bash
# 查询名称以 A-M 开头的商品
GET /products/_search
{
  "query": {
    "range": {
      "name": {
        "gte": "A",
        "lte": "M"
      }
    }
  }
}
```

---

## 5.3 terms 查询

### 概念解释

**terms 查询**用于匹配多个值中的任意一个，类似于 SQL 的 IN。

### 基础用法

```bash
# 查询分类为"手机"或"平板"的商品
GET /products/_search
{
  "query": {
    "terms": {
      "category": ["手机", "平板"]
    }
  }
}
```

### 与 term 的区别

| 特性 | term 查询 | terms 查询 |
|------|----------|-----------|
| 匹配数量 | 单个值 | 多个值 |
| SQL 等价 | = | IN |
| 示例 | `{"term": {"status": "active"}}` | `{"terms": {"status": ["active", "pending"]}}` |

### 代码对比

```bash
# ❌ 使用多个 term（错误示例）
GET /products/_search
{
  "query": {
    "bool": {
      "should": [
        { "term": { "category": "手机" } },
        { "term": { "category": "平板" } }
      ]
    }
  }
}

# ✅ 使用 terms（正确示例）
GET /products/_search
{
  "query": {
    "terms": {
      "category": ["手机", "平板"]
    }
  }
}
```

---

## 5.4 exists 查询

### 概念解释

**exists 查询**用于判断字段是否存在（有值）。

### 基础用法

```bash
# 查询有图片的商品
GET /products/_search
{
  "query": {
    "exists": {
      "field": "image_url"
    }
  }
}
```

### 结合 must_not 查询不存在

```bash
# 查询没有图片的商品
GET /products/_search
{
  "query": {
    "bool": {
      "must_not": [
        { "exists": { "field": "image_url" } }
      ]
    }
  }
}
```

### 应用场景

- 数据完整性检查：哪些数据缺少必填字段
- 数据清洗：找出需要补充的数据
- 业务逻辑：某些功能依赖特定字段

---

## 5.5 bool 复合查询

### 概念解释

**bool 查询**用于组合多个查询条件，支持 AND/OR/NOT 逻辑。

### 完整示例

```bash
# 复杂查询示例
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        # 必须匹配：名称包含"手机"
        { "match": { "name": "手机" } }
      ],
      "filter": [
        # 必须匹配：分类为"电子产品"（不计算评分）
        { "term": { "category": "电子产品" } },
        # 必须匹配：价格在 5000-10000（不计算评分）
        { "range": { "price": { "gte": 5000, "lte": 10000 } } }
      ],
      "should": [
        # 应该匹配：品牌为"华为"或"小米"（计算评分）
        { "term": { "brand": "华为" } },
        { "term": { "brand": "小米" } }
      ],
      "must_not": [
        # 必须不匹配：状态为"下架"
        { "term": { "status": "下架" } }
      ],
      "minimum_should_match": 1  # should 至少匹配 1 个
    }
  }
}
```

### 嵌套 bool 查询

```bash
# 嵌套查询示例
GET /products/_search
{
  "query": {
    "bool": {
      "should": [
        # 条件 1：名称包含"手机"且价格 < 5000
        {
          "bool": {
            "must": [
              { "match": { "name": "手机" } }
            ],
            "filter": [
              { "range": { "price": { "lt": 5000 } } }
            ]
          }
        },
        # 条件 2：名称包含"平板"且价格 < 3000
        {
          "bool": {
            "must": [
              { "match": { "name": "平板" } }
            ],
            "filter": [
              { "range": { "price": { "lt": 3000 } } }
            ]
          }
        }
      ]
    }
  }
}
```

---

## 5.6 查询 vs 过滤

### 性能对比

| 特性 | Query Context | Filter Context |
|------|---------------|----------------|
| 计算评分 | 是 | 否 |
| 性能 | 较慢 | 较快 |
| 缓存 | 不缓存 | 可缓存 |
| 适用场景 | 需要相关性排序 | 只需过滤 |

### 最佳实践

```bash
# ✅ 推荐：不需要评分的条件用 filter
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "手机" } }  # 需要评分
      ],
      "filter": [
        { "term": { "status": "上架" } },  # 不需要评分
        { "range": { "price": { "gte": 1000 } } }  # 不需要评分
      ]
    }
  }
}

# ❌ 不推荐：所有条件都用 must
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "手机" } },
        { "term": { "status": "上架" } },  # 不需要评分但用了 must
        { "range": { "price": { "gte": 1000 } } }  # 不需要评分但用了 must
      ]
    }
  }
}
```

---

## 5.7 核心知识点总结

| 查询类型 | 说明 | 适用场景 |
|---------|------|---------|
| range | 范围查询 | 数值、日期、字符串范围 |
| terms | 多值匹配 | IN 查询 |
| exists | 存在性判断 | 字段是否有值 |
| bool | 复杂组合 | AND/OR/NOT 组合 |

---

## 5.8 新手常见误区

### 误区 1："所有条件都用 must"

**错！** 不需要计算评分的条件应该用 filter，性能更好且可以缓存。

### 误区 2："range 查询不需要考虑字段类型"

不是的。数值字段用数值范围，日期字段用日期范围，字符串字段按字典序比较。

### 误区 3："terms 查询可以替代多个 term 的 should"

虽然结果相同，但 terms 更简洁高效。多个 term 的 should 会计算评分，terms 不会。

---

## 5.9 动手练习

### 练习 1：范围查询

查询价格在 3000-8000 之间的商品。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 3000,
        "lte": 8000
      }
    }
  }
}
```

</details>

### 练习 2：多值匹配

查询分类为"手机"、"平板"或"电脑"的商品。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "query": {
    "terms": {
      "category": ["手机", "平板", "电脑"]
    }
  }
}
```

</details>

### 练习 3（挑战）：复杂组合

搜索名称包含"手机"，价格在 5000-10000 之间，品牌为"华为"或"小米"，必须有图片，按相关度排序。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "手机" } }
      ],
      "filter": [
        { "range": { "price": { "gte": 5000, "lte": 10000 } } },
        { "exists": { "field": "image_url" } }
      ],
      "should": [
        { "term": { "brand": "华为" } },
        { "term": { "brand": "小米" } }
      ],
      "minimum_should_match": 1
    }
  }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **全文搜索与匹配**——也就是全文搜索原理、相关性评分、高亮显示。你会学到 Elasticsearch 最核心的搜索能力。
