---
title: "第 7 章：聚合分析基础"
description: "Metric 聚合、Bucket 聚合、Pipeline 聚合"
---

# 第 7 章：聚合分析基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是聚合分析？它和 SQL 的 GROUP BY 有什么区别？
- Metric 聚合和 Bucket 聚合有什么区别？
- 如何实现嵌套聚合？
- Pipeline 聚合是什么？

这一章会帮你掌握 Elasticsearch 的聚合分析功能。聚合是数据分析的核心能力。

---

## 1 为什么需要聚合分析？

### 痛点分析

在实际业务中，经常需要统计分析数据：

- 商品的平均价格是多少？
- 每个分类有多少商品？
- 每个月的销售额是多少？
- 价格最高的 10 个商品是什么？

用应用层代码统计效率低，且无法利用 Elasticsearch 的分布式计算能力。

### 解决方案

Elasticsearch 的聚合分析功能可以：

- **在服务器端计算**：减少网络传输
- **分布式计算**：利用集群的计算能力
- **实时分析**：秒级返回结果

打个比方：

> 聚合分析就像 Excel 的数据透视表，但更强大，可以处理海量数据。

---

## 2 聚合分析基础语法

### 基本结构

```bash
GET /products/_search
{
  "size": 0,  # 不返回文档，只返回聚合结果
  "aggs": {
    "聚合名称": {
      "聚合类型": {
        "field": "字段名"
      }
    }
  }
}
```

### 聚合类型分类

| 类型 | 说明 | 示例 |
|------|------|------|
| Metric | 指标聚合，计算数值 | avg、sum、min、max |
| Bucket | 分桶聚合，分组统计 | terms、date_histogram |
| Pipeline | 管道聚合，基于其他聚合结果 | bucket_sort、moving_avg |

---

## 3 Metric 聚合

### avg 聚合（平均值）

```bash
# 计算商品的平均价格
GET /products/_search
{
  "size": 0,
  "aggs": {
    "avg_price": {
      "avg": {
        "field": "price"
      }
    }
  }
}

# 返回结果
{
  "aggregations": {
    "avg_price": {
      "value": 5999.5
    }
  }
}
```

### sum 聚合（求和）

```bash
# 计算所有商品的总价格
GET /products/_search
{
  "size": 0,
  "aggs": {
    "total_price": {
      "sum": {
        "field": "price"
      }
    }
  }
}
```

### min/max 聚合

```bash
# 查询最低和最高价格
GET /products/_search
{
  "size": 0,
  "aggs": {
    "min_price": {
      "min": {
        "field": "price"
      }
    },
    "max_price": {
      "max": {
        "field": "price"
      }
    }
  }
}
```

### stats 聚合（统计汇总）

```bash
# 一次性获取 count、min、max、avg、sum
GET /products/_search
{
  "size": 0,
  "aggs": {
    "price_stats": {
      "stats": {
        "field": "price"
      }
    }
  }
}

# 返回结果
{
  "aggregations": {
    "price_stats": {
      "count": 100,
      "min": 999.0,
      "max": 14999.0,
      "avg": 5999.5,
      "sum": 599950.0
    }
  }
}
```

### percentiles 聚合（百分位数）

```bash
# 查询价格的百分位分布
GET /products/_search
{
  "size": 0,
  "aggs": {
    "price_percentiles": {
      "percentiles": {
        "field": "price",
        "percents": [25, 50, 75, 90, 95, 99]
      }
    }
  }
}
```

---

## 4 Bucket 聚合

### terms 聚合（分组统计）

```bash
# 统计每个分类的商品数量
GET /products/_search
{
  "size": 0,
  "aggs": {
    "category_count": {
      "terms": {
        "field": "category",
        "size": 10  # 返回前 10 个分类
      }
    }
  }
}

# 返回结果
{
  "aggregations": {
    "category_count": {
      "buckets": [
        { "key": "手机", "doc_count": 50 },
        { "key": "电脑", "doc_count": 30 },
        { "key": "平板", "doc_count": 20 }
      ]
    }
  }
}
```

### date_histogram 聚合（时间直方图）

```bash
# 统计每个月的订单数量
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "orders_per_month": {
      "date_histogram": {
        "field": "order_date",
        "calendar_interval": "month"
      }
    }
  }
}

# 返回结果
{
  "aggregations": {
    "orders_per_month": {
      "buckets": [
        { "key_as_string": "2024-01-01", "doc_count": 150 },
        { "key_as_string": "2024-02-01", "doc_count": 180 },
        { "key_as_string": "2024-03-01", "doc_count": 200 }
      ]
    }
  }
}
```

### histogram 聚合（数值直方图）

```bash
# 按价格区间统计商品数量
GET /products/_search
{
  "size": 0,
  "aggs": {
    "price_ranges": {
      "histogram": {
        "field": "price",
        "interval": 1000
      }
    }
  }
}

# 返回结果
{
  "aggregations": {
    "price_ranges": {
      "buckets": [
        { "key": 0.0, "doc_count": 20 },      # 0-1000
        { "key": 1000.0, "doc_count": 35 },   # 1000-2000
        { "key": 2000.0, "doc_count": 45 }    # 2000-3000
      ]
    }
  }
}
```

### range 聚合（自定义范围）

```bash
# 自定义价格区间统计
GET /products/_search
{
  "size": 0,
  "aggs": {
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "key": "低价", "to": 3000 },
          { "key": "中价", "from": 3000, "to": 8000 },
          { "key": "高价", "from": 8000 }
        ]
      }
    }
  }
}
```

---

## 5 嵌套聚合

### 概念解释

聚合可以嵌套，实现更复杂的统计分析。

### 示例：每个分类的平均价格

```bash
GET /products/_search
{
  "size": 0,
  "aggs": {
    "category_count": {
      "terms": {
        "field": "category"
      },
      "aggs": {
        "avg_price": {
          "avg": {
            "field": "price"
          }
        }
      }
    }
  }
}

# 返回结果
{
  "aggregations": {
    "category_count": {
      "buckets": [
        {
          "key": "手机",
          "doc_count": 50,
          "avg_price": { "value": 5999.5 }
        },
        {
          "key": "电脑",
          "doc_count": 30,
          "avg_price": { "value": 8999.0 }
        }
      ]
    }
  }
}
```

### 多层嵌套

```bash
# 统计每个分类下每个品牌的平均价格
GET /products/_search
{
  "size": 0,
  "aggs": {
    "category_count": {
      "terms": {
        "field": "category"
      },
      "aggs": {
        "brand_count": {
          "terms": {
            "field": "brand"
          },
          "aggs": {
            "avg_price": {
              "avg": {
                "field": "price"
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 6 Pipeline 聚合

### 概念解释

**Pipeline 聚合**基于其他聚合的结果进行二次计算。

### bucket_sort 聚合

```bash
# 对分类聚合结果按平均价格排序
GET /products/_search
{
  "size": 0,
  "aggs": {
    "category_count": {
      "terms": {
        "field": "category"
      },
      "aggs": {
        "avg_price": {
          "avg": {
            "field": "price"
          }
        },
        "sorted_by_price": {
          "bucket_sort": {
            "sort": [
              { "avg_price": { "order": "desc" } }
            ]
          }
        }
      }
    }
  }
}
```

### moving_avg 聚合

```bash
# 计算移动平均（时间序列分析）
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "orders_per_month": {
      "date_histogram": {
        "field": "order_date",
        "calendar_interval": "month"
      },
      "aggs": {
        "moving_avg": {
          "moving_avg": {
            "buckets_path": "_count",
            "window": 3
          }
        }
      }
    }
  }
}
```

---

## 7 过滤聚合

### 概念解释

在聚合前可以先过滤数据。

### filter 聚合

```bash
# 只统计"手机"分类的商品
GET /products/_search
{
  "size": 0,
  "aggs": {
    "mobile_products": {
      "filter": {
        "term": { "category": "手机" }
      },
      "aggs": {
        "avg_price": {
          "avg": {
            "field": "price"
          }
        }
      }
    }
  }
}
```

### filters 聚合（多过滤）

```bash
# 分别统计手机和电脑的数据
GET /products/_search
{
  "size": 0,
  "aggs": {
    "product_types": {
      "filters": {
        "filters": {
          "mobile": { "term": { "category": "手机" } },
          "computer": { "term": { "category": "电脑" } }
        }
      },
      "aggs": {
        "avg_price": {
          "avg": {
            "field": "price"
          }
        }
      }
    }
  }
}
```

---

## 8 核心知识点总结

| 聚合类型 | 说明 | 常用类型 |
|---------|------|---------|
| Metric | 指标计算 | avg、sum、min、max、stats |
| Bucket | 分组统计 | terms、date_histogram、range |
| Pipeline | 二次计算 | bucket_sort、moving_avg |
| 嵌套 | 多层聚合 | aggs 嵌套 |

---

## 9 新手常见误区

### 误区 1："聚合字段不需要是 keyword 类型"

**错！** terms 聚合的字段必须是 keyword 类型，text 类型需要先分词。

### 误区 2："size: 0 会返回所有文档"

不是的。`size: 0` 表示不返回文档，只返回聚合结果，性能更好。

### 误区 3："聚合可以处理任意大数据集"

聚合有内存限制，大数据集建议使用 `composite` 聚合分批处理。

---

## 10 动手练习

### 练习 1：基础聚合

计算所有商品的平均价格。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "size": 0,
  "aggs": {
    "avg_price": {
      "avg": {
        "field": "price"
      }
    }
  }
}
```

</details>

### 练习 2：分组统计

统计每个分类的商品数量和平均价格。

<details>
<summary>点击查看答案</summary>

```bash
GET /products/_search
{
  "size": 0,
  "aggs": {
    "category_stats": {
      "terms": {
        "field": "category"
      },
      "aggs": {
        "avg_price": {
          "avg": {
            "field": "price"
          }
        }
      }
    }
  }
}
```

</details>

### 练习 3（挑战）：时间序列分析

统计每个月的订单总金额，并按时间排序。

<details>
<summary>点击查看答案</summary>

```bash
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "orders_per_month": {
      "date_histogram": {
        "field": "order_date",
        "calendar_interval": "month"
      },
      "aggs": {
        "total_amount": {
          "sum": {
            "field": "amount"
          }
        }
      }
    }
  }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **索引设计与映射**——也就是 Mapping 定义、字段类型、动态映射、索引模板。你会学到如何设计高效的索引结构。
