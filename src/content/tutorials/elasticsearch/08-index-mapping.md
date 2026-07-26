---
title: "第 8 章：索引设计与映射"
description: "Mapping 定义、字段类型、动态映射、索引模板"
---

# 第 8 章：索引设计与映射

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Mapping？它和数据库的 Schema 有什么区别？
- 字段类型有哪些？如何选择合适的类型？
- 动态映射是什么？为什么有时候要关闭它？
- 索引模板是什么？如何批量创建相似索引？

这一章会帮你掌握索引设计的核心知识。好的索引设计是高性能的基础。

---

## 8.1 为什么需要 Mapping？

### 痛点分析

很多新手创建索引时不定义 Mapping，导致：

- **类型错误**：数字被当成字符串，无法做范围查询
- **分词不当**：中文没有正确分词，搜索不到
- **性能问题**：不必要的字段被索引，浪费空间
- **难以维护**：索引结构混乱，后期难以优化

### 解决方案

在创建索引时明确定义 Mapping，指定：

- 字段类型
- 是否索引
- 使用什么分词器
- 是否需要存储

打个比方：

> Mapping 就像建筑的蓝图，决定了数据如何存储和检索。

---

## 8.2 查看和创建 Mapping

### 查看 Mapping

```bash
# 查看索引的 Mapping
GET /products/_mapping

# 返回结果
{
  "products": {
    "mappings": {
      "properties": {
        "name": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          }
        },
        "price": {
          "type": "float"
        },
        "category": {
          "type": "keyword"
        }
      }
    }
  }
}
```

### 创建索引时定义 Mapping

```bash
PUT /products
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart"
      },
      "description": {
        "type": "text",
        "analyzer": "ik_max_word"
      },
      "price": {
        "type": "float"
      },
      "category": {
        "type": "keyword"
      },
      "status": {
        "type": "keyword"
      },
      "created_at": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss||epoch_millis"
      }
    }
  }
}
```

---

## 8.3 字段类型详解

### 核心类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| text | 文本类型，会分词 | 全文搜索字段 |
| keyword | 关键词类型，不分词 | 精确匹配、排序、聚合 |
| long | 长整型 | 大整数 |
| integer | 整型 | 普通整数 |
| short | 短整型 | 小整数 |
| byte | 字节型 | 极小整数 |
| float | 浮点型 | 单精度浮点数 |
| double | 双精度浮点型 | 双精度浮点数 |
| boolean | 布尔型 | true/false |
| date | 日期类型 | 时间戳、日期字符串 |

### text vs keyword

```bash
# text 类型：会分词，适合全文搜索
"name": {
  "type": "text"
}
# "苹果手机" → ["苹果", "手机"]

# keyword 类型：不分词，适合精确匹配
"category": {
  "type": "keyword"
}
# "手机" → "手机"（整体）
```

### 多字段映射

```bash
# 同时支持全文搜索和精确匹配
"name": {
  "type": "text",
  "fields": {
    "keyword": {
      "type": "keyword",
      "ignore_above": 256
    }
  }
}

# 使用
# 全文搜索：match name
# 精确匹配：term name.keyword
# 排序：sort name.keyword
```

---

## 8.4 动态映射

### 概念解释

Elasticsearch 默认开启动态映射，自动推断字段类型。

### 推断规则

| JSON 类型 | 推断的 ES 类型 |
|-----------|---------------|
| string | text + keyword |
| long | long |
| double | double |
| boolean | boolean |
| date | date |
| object | object |

### 动态映射示例

```bash
# 不定义 Mapping，直接添加文档
POST /test/_doc
{
  "name": "测试",
  "age": 25,
  "is_active": true,
  "created_at": "2024-01-01"
}

# Elasticsearch 自动推断类型
# name → text + keyword
# age → long
# is_active → boolean
# created_at → date
```

### 关闭动态映射

```bash
PUT /products
{
  "mappings": {
    "dynamic": "strict",  # 严格模式，未定义字段会报错
    "properties": {
      "name": { "type": "text" },
      "price": { "type": "float" }
    }
  }
}

# 添加未定义字段会失败
POST /products/_doc
{
  "name": "测试",
  "price": 100,
  "unknown_field": "value"  # 报错！
}
```

### 动态映射选项

| 选项 | 说明 |
|------|------|
| true | 默认，自动添加新字段 |
| false | 忽略新字段，不索引也不添加 |
| strict | 严格模式，新字段会报错 |

---

## 8.5 常用 Mapping 参数

### index 参数

```bash
# 控制字段是否被索引
"description": {
  "type": "text",
  "index": false  # 不索引，无法搜索，但可以在 _source 中获取
}
```

### store 参数

```bash
# 控制字段是否单独存储
"large_field": {
  "type": "text",
  "store": true  # 单独存储，可以直接获取，不需要解析 _source
}
```

### null_value 参数

```bash
# 为 null 值设置默认值
"status": {
  "type": "keyword",
  "null_value": "unknown"  # null 会被替换为 "unknown"
}
```

### copy_to 参数

```bash
# 将多个字段复制到一个字段
PUT /users
{
  "mappings": {
    "properties": {
      "first_name": {
        "type": "text",
        "copy_to": "full_name"
      },
      "last_name": {
        "type": "text",
        "copy_to": "full_name"
      },
      "full_name": {
        "type": "text"
      }
    }
  }
}

# 搜索 full_name 可以同时匹配 first_name 和 last_name
```

---

## 8.6 索引模板

### 概念解释

**索引模板**用于批量创建相似索引，避免重复定义 Mapping。

### 创建模板

```bash
PUT /_index_template/product_template
{
  "index_patterns": ["products-*"],  # 匹配 products- 开头的索引
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "name": {
          "type": "text",
          "analyzer": "ik_max_word"
        },
        "price": {
          "type": "float"
        },
        "created_at": {
          "type": "date"
        }
      }
    }
  },
  "priority": 100
}
```

### 使用模板

```bash
# 创建索引时自动应用模板
PUT /products-2024

# 查看应用的模板
GET /products-2024
```

### 模板优先级

```bash
# 多个模板匹配时，priority 高的优先
PUT /_index_template/template1
{
  "index_patterns": ["products-*"],
  "priority": 100,
  "template": { ... }
}

PUT /_index_template/template2
{
  "index_patterns": ["products-2024-*"],
  "priority": 200,  # 优先级更高
  "template": { ... }
}
```

---

## 8.7 重新索引

### 概念解释

当需要修改 Mapping 时，需要重新索引数据。

### 步骤

```bash
# 1. 创建新索引，定义正确的 Mapping
PUT /products_v2
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "ik_max_word"
      },
      "price": {
        "type": "float"
      }
    }
  }
}

# 2. 使用 reindex API 迁移数据
POST /_reindex
{
  "source": {
    "index": "products"
  },
  "dest": {
    "index": "products_v2"
  }
}

# 3. 验证数据
GET /products_v2/_count

# 4. 切换别名（可选）
POST /_aliases
{
  "actions": [
    { "add": { "index": "products_v2", "alias": "products_alias" } }
  ]
}
```

---

## 8.8 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Mapping | 定义索引结构，类似数据库 Schema |
| 字段类型 | text、keyword、数值、日期等 |
| 动态映射 | 自动推断字段类型 |
| 索引模板 | 批量创建相似索引 |
| 重新索引 | 修改 Mapping 后迁移数据 |

---

## 8.9 新手常见误区

### 误区 1："所有字符串字段都用 text 类型"

**错！** 需要精确匹配、排序、聚合的字段应该用 keyword 类型。

### 误区 2："动态映射足够用了"

不是的。生产环境建议明确定义 Mapping，避免类型推断错误。

### 误区 3："Mapping 创建后可以随意修改"

已存在的字段类型不能修改，只能添加新字段。修改类型需要重新索引。

---

## 8.10 动手练习

### 练习 1：创建 Mapping

为 `users` 索引创建 Mapping，包含 name（text）、age（integer）、email（keyword）、created_at（date）字段。

<details>
<summary>点击查看答案</summary>

```bash
PUT /users
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "ik_max_word"
      },
      "age": {
        "type": "integer"
      },
      "email": {
        "type": "keyword"
      },
      "created_at": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss||epoch_millis"
      }
    }
  }
}
```

</details>

### 练习 2：多字段映射

为 `products` 索引的 `name` 字段设置多字段映射，支持全文搜索和精确匹配。

<details>
<summary>点击查看答案</summary>

```bash
PUT /products
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "ik_max_word",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      }
    }
  }
}
```

</details>

### 练习 3（挑战）：索引模板

创建一个索引模板，匹配 `logs-*` 开头的索引，包含 message（text）、level（keyword）、timestamp（date）字段。

<details>
<summary>点击查看答案</summary>

```bash
PUT /_index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "message": {
          "type": "text",
          "analyzer": "standard"
        },
        "level": {
          "type": "keyword"
        },
        "timestamp": {
          "type": "date"
        }
      }
    }
  },
  "priority": 100
}
```

</details>

---

## 下一章预告

下一章我们会学习 **分词器与 Analyzer**——也就是内置分词器、自定义分词器、分词器原理。你会学到如何处理中文分词。
