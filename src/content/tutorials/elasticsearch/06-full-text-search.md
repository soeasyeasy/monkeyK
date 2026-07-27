---
title: "第 6 章：全文搜索与匹配"
description: "全文搜索原理、相关性评分、高亮显示"
---

# 第 6 章：全文搜索与匹配

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 全文搜索是怎么工作的？
- 什么是相关性评分？如何控制评分？
- 如何实现搜索结果的高亮显示？
- match_phrase 和 match 有什么区别？

这一章会帮你理解全文搜索的核心原理。这是 Elasticsearch 最强大的功能。

---

## 1 为什么需要全文搜索？

### 痛点分析

结构化查询（如 term、range）只能做精确匹配，但用户的需求往往是模糊的：

- 搜"苹果手机"，希望找到"iPhone"
- 搜"高性能笔记本"，希望找到"游戏本"
- 搜"便宜的手机"，希望按价格排序

### 解决方案

全文搜索通过**分词**和**相关性评分**，实现智能匹配。

打个比方：

> 精确匹配像查字典：必须一字不差。全文搜索像问智能助手：理解你的意思，找到最相关的结果。

---

## 2 倒排索引原理

### 概念解释

Elasticsearch 使用**倒排索引**实现快速全文搜索。

### 正排 vs 倒排

**正排索引**（Forward Index）：

```
文档 1 → ["苹果", "手机", "高性能"]
文档 2 → ["华为", "手机", "便宜"]
文档 3 → ["苹果", "笔记本", "游戏本"]
```

**倒排索引**（Inverted Index）：

```
"苹果" → [文档 1, 文档 3]
"手机" → [文档 1, 文档 2]
"笔记本" → [文档 3]
"游戏本" → [文档 3]
```

### 工作原理

```
用户搜索："苹果手机"
↓
分词：["苹果", "手机"]
↓
查倒排索引：
  "苹果" → [文档 1, 文档 3]
  "手机" → [文档 1, 文档 2]
↓
合并结果：[文档 1, 文档 2, 文档 3]
↓
计算相关性评分并排序
```

---

## 3 相关性评分

### 概念解释

Elasticsearch 使用 **BM25 算法**计算相关性评分。

### 影响因素

| 因素 | 说明 |
|------|------|
| 词频（TF） | 词在文档中出现的次数 |
| 逆文档频率（IDF） | 词在所有文档中的稀有程度 |
| 字段长度 | 字段越短，匹配权重越高 |
| 词位置 | 词在字段中的位置 |

### 查看评分

```bash
# 查看查询评分
GET /products/_search
{
  "query": {
    "match": {
      "name": "手机"
    }
  },
  "explain": true
}
```

### 控制评分

```bash
# 提升特定字段的权重
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "手机",
      "fields": ["name^3", "description^1"]
    }
  }
}

# name 字段的权重是 description 的 3 倍
```

---

## 4 match 查询详解

### 基础 match

```bash
# 基础全文搜索
GET /products/_search
{
  "query": {
    "match": {
      "name": "苹果手机"
    }
  }
}
```

### match 参数

```bash
GET /products/_search
{
  "query": {
    "match": {
      "name": {
        "query": "苹果手机",
        "operator": "and",           # 所有词都必须匹配
        "minimum_should_match": 2,   # 至少匹配 2 个词
        "analyzer": "ik_max_word"    # 使用指定分词器
      }
    }
  }
}
```

### operator 对比

| operator | 说明 | 示例 |
|----------|------|------|
| or | 任意一个词匹配即可 | "苹果手机" → 匹配"苹果"或"手机" |
| and | 所有词都必须匹配 | "苹果手机" → 必须同时包含"苹果"和"手机" |

---

## 5 match_phrase 查询

### 概念解释

**match_phrase 查询**要求词组按顺序出现，类似于精确短语匹配。

### 基础用法

```bash
# 搜索包含"苹果手机"短语的文档
GET /products/_search
{
  "query": {
    "match_phrase": {
      "name": "苹果手机"
    }
  }
}
```

### match vs match_phrase

| 特性 | match | match_phrase |
|------|-------|--------------|
| 分词 | 会分词 | 会分词 |
| 顺序要求 | 不要求顺序 | 要求顺序 |
| 位置间隔 | 允许间隔 | 不允许间隔（默认） |
| 适用场景 | 模糊搜索 | 精确短语搜索 |

### 代码对比

```bash
# match：分词后任意匹配
GET /products/_search
{
  "query": {
    "match": {
      "description": "高性能手机"
    }
  }
}
# 匹配："手机性能高"、"高性能的手机"、"手机高性能"

# match_phrase：要求顺序和位置
GET /products/_search
{
  "query": {
    "match_phrase": {
      "description": "高性能手机"
    }
  }
}
# 只匹配："高性能手机"（连续出现）
```

### slop 参数

```bash
# 允许词之间有间隔
GET /products/_search
{
  "query": {
    "match_phrase": {
      "description": {
        "query": "高性能手机",
        "slop": 2  # 允许最多 2 个词的间隔
      }
    }
  }
}
```

---

## 6 multi_match 查询

### 概念解释

**multi_match 查询**允许在多个字段中搜索同一个关键词。

### 基础用法

```bash
# 在 name 和 description 中搜索
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "手机",
      "fields": ["name", "description"]
    }
  }
}
```

### 查询类型

| 类型 | 说明 |
|------|------|
| best_fields | 任意字段匹配即可，取最高分 |
| most_fields | 所有字段匹配，分数相加 |
| cross_fields | 跨字段匹配， treating fields as one |
| phrase | 短语匹配 |
| phrase_prefix | 前缀短语匹配 |

### 代码示例

```bash
# best_fields（默认）：取最高分
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "手机",
      "fields": ["name^3", "description"],
      "type": "best_fields"
    }
  }
}

# most_fields：分数相加
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "手机",
      "fields": ["name", "description"],
      "type": "most_fields"
    }
  }
}
```

---

## 7 高亮显示

### 概念解释

**高亮显示**将匹配的关键词在结果中标记出来。

### 基础用法

```bash
GET /products/_search
{
  "query": {
    "match": {
      "name": "手机"
    }
  },
  "highlight": {
    "fields": {
      "name": {}
    }
  }
}
```

### 返回结果

```json
{
  "hits": {
    "hits": [
      {
        "_source": {
          "name": "苹果手机"
        },
        "highlight": {
          "name": [
            "<em>苹果</em><em>手机</em>"
          ]
        }
      }
    ]
  }
}
```

### 高亮配置

```bash
GET /products/_search
{
  "query": {
    "match": {
      "name": "手机"
    }
  },
  "highlight": {
    "pre_tags": ["<strong>"],
    "post_tags": ["</strong>"],
    "fields": {
      "name": {
        "fragment_size": 150,
        "number_of_fragments": 3
      }
    }
  }
}
```

---

## 8 核心知识点总结

| 查询类型 | 说明 | 适用场景 |
|---------|------|---------|
| match | 全文搜索，分词匹配 | 模糊搜索 |
| match_phrase | 短语匹配，要求顺序 | 精确短语搜索 |
| multi_match | 多字段搜索 | 同时搜索多个字段 |
| 高亮 | 标记匹配关键词 | 搜索结果展示 |

---

## 9 新手常见误区

### 误区 1："text 字段不需要指定分词器"

**错！** 默认分词器对中文支持不好，建议使用 IK 分词器。

### 误区 2："match_phrase 比 match 更准确"

不一定。match_phrase 要求严格顺序，可能漏掉相关结果。根据业务需求选择。

### 误区 3："高亮会影响性能"

高亮确实会增加开销，但对于搜索结果展示是必要的。可以限制高亮字段数量。

---

## 10 动手练习

### 练习 1：基础全文搜索

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

### 练习 2：短语搜索

搜索描述中包含"高性能笔记本"短语的商品。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "query": {
    "match_phrase": {
      "description": "高性能笔记本"
    }
  }
}
```

</details>

### 练习 3（挑战）：多字段搜索 + 高亮

在 name 和 description 中搜索"手机"，name 字段权重更高，并高亮显示。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "手机",
      "fields": ["name^3", "description"]
    }
  },
  "highlight": {
    "fields": {
      "name": {},
      "description": {}
    }
  }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **聚合分析基础**——也就是 Metric 聚合、Bucket 聚合、Pipeline 聚合。你会学到如何对数据进行统计和分析。
