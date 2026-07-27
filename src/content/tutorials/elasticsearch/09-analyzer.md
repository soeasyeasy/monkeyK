---
title: "第 9 章：分词器与 Analyzer"
description: "内置分词器、自定义分词器、分词器原理"
---

# 第 9 章：分词器与 Analyzer

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是分词器？为什么需要分词？
- Elasticsearch 有哪些内置分词器？
- 如何处理中文分词？
- 如何自定义分词器？

这一章会帮你掌握分词器的原理和使用。分词是全文搜索的基础，直接影响搜索效果。

---

## 1 为什么需要分词器？

### 痛点分析

搜索引擎需要理解用户输入的文本，但计算机无法直接理解自然语言：

- 用户搜索"苹果手机"，系统需要知道这是"苹果"和"手机"两个词
- 用户搜索"高性能笔记本"，系统需要拆分成多个关键词
- 不同语言有不同的分词规则

### 解决方案

**分词器（Analyzer）** 负责将文本拆分成独立的词元（Token），并做标准化处理。

打个比方：

> 分词器就像翻译官，把人类的语言翻译成计算机能理解的关键词。

---

## 2 分词器工作原理

### 分词过程

```
原始文本："苹果手机很贵"
↓
字符过滤（Character Filter）
  → 去除 HTML 标签、特殊字符
↓
分词（Tokenizer）
  → ["苹果", "手机", "很", "贵"]
↓
词元过滤（Token Filter）
  → 转小写、去停用词、同义词替换
↓
最终词元：["苹果", "手机", "贵"]
```

### 三个组件

| 组件 | 作用 | 示例 |
|------|------|------|
| Character Filter | 字符过滤 | 去除 HTML 标签 |
| Tokenizer | 分词 | 将文本拆分成词 |
| Token Filter | 词元过滤 | 转小写、去停用词 |

---

## 3 内置分词器

### Standard Analyzer

```bash
# 测试分词效果
GET /_analyze
{
  "analyzer": "standard",
  "text": "The iPhone 15 Pro is expensive!"
}

# 结果：["the", "iphone", "15", "pro", "is", "expensive"]
```

特点：
- 按词分割
- 转小写
- 适合英文

### Simple Analyzer

```bash
GET /_analyze
{
  "analyzer": "simple",
  "text": "The iPhone 15 Pro is expensive!"
}

# 结果：["the", "iphone", "", "pro", "is", "expensive"]
```

特点：
- 按非字母字符分割
- 转小写
- 会丢失数字

### Whitespace Analyzer

```bash
GET /_analyze
{
  "analyzer": "whitespace",
  "text": "The iPhone 15 Pro is expensive!"
}

# 结果：["The", "iPhone", "15", "Pro", "is", "expensive!"]
```

特点：
- 按空格分割
- 不做其他处理
- 保留大小写和标点

### Keyword Analyzer

```bash
GET /_analyze
{
  "analyzer": "keyword",
  "text": "The iPhone 15 Pro"
}

# 结果：["The iPhone 15 Pro"]
```

特点：
- 不分词，整个字段作为一个词元
- 适合不需要分词的字段

### Stop Analyzer

```bash
GET /_analyze
{
  "analyzer": "stop",
  "text": "The iPhone 15 Pro is expensive!"
}

# 结果：["iphone", "15", "pro", "expensive"]
```

特点：
- 去除停用词（the、is 等）
- 转小写

---

## 4 中文分词器

### 问题

英文天然以空格分词，但中文没有空格：

```
"苹果手机很贵"
```

需要专门的中文分词器。

### IK 分词器

IK 分词器是最流行的中文分词插件。

**安装 IK 分词器**：

```bash
# 进入 Elasticsearch 插件目录
cd /path/to/elasticsearch/plugins

# 下载并安装 IK 分词器
./elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v8.x.x/elasticsearch-analysis-ik-8.x.x.zip

# 重启 Elasticsearch
```

**两种模式**：

| 模式 | 说明 | 示例 |
|------|------|------|
| ik_smart | 智能分词，粗粒度 | "苹果手机" → ["苹果手机"] |
| ik_max_word | 最细粒度分词 | "苹果手机" → ["苹果", "手机"] |

**测试 IK 分词器**：

```bash
# ik_smart 模式
GET /_analyze
{
  "analyzer": "ik_smart",
  "text": "苹果手机很贵"
}

# 结果：["苹果", "手机", "很", "贵"]

# ik_max_word 模式
GET /_analyze
{
  "analyzer": "ik_max_word",
  "text": "苹果手机很贵"
}

# 结果：["苹果", "手机", "很", "贵"]
```

### 使用 IK 分词器

```bash
PUT /products
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "ik_max_word",      # 索引时使用
        "search_analyzer": "ik_smart"   # 搜索时使用
      }
    }
  }
}
```

**为什么索引和搜索用不同分词器？**

- 索引时用 `ik_max_word`：尽可能多地拆分词，提高召回率
- 搜索时用 `ik_smart`：智能分词，提高准确率

---

## 5 自定义分词器

### 概念解释

当内置分词器无法满足需求时，可以自定义分词器。

### 自定义分词器示例

```bash
PUT /my_index
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_custom_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "char_filter": ["html_strip"],
          "filter": ["lowercase", "stop"]
        }
      }
    }
  }
}
```

### 自定义 Character Filter

```bash
PUT /my_index
{
  "settings": {
    "analysis": {
      "char_filter": {
        "my_char_filter": {
          "type": "mapping",
          "mappings": [
            "😊 => happy",
            "😢 => sad"
          ]
        }
      },
      "analyzer": {
        "my_analyzer": {
          "type": "custom",
          "char_filter": ["my_char_filter"],
          "tokenizer": "standard",
          "filter": ["lowercase"]
        }
      }
    }
  }
}
```

### 自定义 Token Filter

```bash
PUT /my_index
{
  "settings": {
    "analysis": {
      "filter": {
        "my_stop_filter": {
          "type": "stop",
          "stopwords": ["的", "了", "在", "是"]
        }
      },
      "analyzer": {
        "my_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["my_stop_filter", "lowercase"]
        }
      }
    }
  }
}
```

### 同义词分词器

```bash
PUT /my_index
{
  "settings": {
    "analysis": {
      "filter": {
        "my_synonym_filter": {
          "type": "synonym",
          "synonyms": [
            "土豆,马铃薯",
            "西红柿,番茄"
          ]
        }
      },
      "analyzer": {
        "my_synonym_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["my_synonym_filter"]
        }
      }
    }
  }
}
```

---

## 6 分词器选择建议

| 场景 | 推荐分词器 |
|------|-----------|
| 英文文本 | standard |
| 中文文本 | ik_max_word（索引）+ ik_smart（搜索） |
| 不需要分词 | keyword |
| 需要去除停用词 | stop |
| 需要同义词 | 自定义 synonym 分词器 |

---

## 7 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 分词器组成 | Character Filter + Tokenizer + Token Filter |
| 内置分词器 | standard、simple、whitespace 等 |
| 中文分词 | IK 分词器（ik_smart、ik_max_word） |
| 自定义分词器 | 可以自定义三个组件 |
| 索引 vs 搜索 | 可以指定不同的分词器 |

---

## 8 新手常见误区

### 误区 1："中文用 standard 分词器就够了"

**错！** standard 分词器对中文支持很差，会把每个汉字当成一个词。必须使用 IK 等中文分词器。

### 误区 2："索引和搜索用同一个分词器"

不一定。通常索引时用细粒度分词（ik_max_word），搜索时用智能分词（ik_smart）。

### 误区 3："分词器越复杂越好"

不是的。分词器太复杂会影响性能，且可能引入噪声。根据业务需求选择合适的分词器。

---

## 9 动手练习

### 练习 1：测试分词器

使用 `standard` 分词器分析文本 "Elasticsearch is awesome!"。

<details>
<summary>点击查看答案</summary>

```bash
GET /_analyze
{
  "analyzer": "standard",
  "text": "Elasticsearch is awesome!"
}
```

</details>

### 练习 2：中文分词

使用 `ik_max_word` 分词器分析文本 "我喜欢学习 Elasticsearch"。

<details>
<summary>点击查看答案</summary>

```bash
GET /_analyze
{
  "analyzer": "ik_max_word",
  "text": "我喜欢学习 Elasticsearch"
}
```

</details>

### 练习 3（挑战）：自定义分词器

创建一个自定义分词器，使用 IK 分词器，并去除停用词"的"、"了"、"在"。

<details>
<summary>点击查看答案</summary>

```bash
PUT /my_index
{
  "settings": {
    "analysis": {
      "filter": {
        "my_stop_filter": {
          "type": "stop",
          "stopwords": ["的", "了", "在"]
        }
      },
      "analyzer": {
        "my_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["my_stop_filter"]
        }
      }
    }
  }
}

# 测试
GET /my_index/_analyze
{
  "analyzer": "my_analyzer",
  "text": "这是我最喜欢的手机"
}
```

</details>

---

## 下一章预告

下一章我们会学习 **分布式架构原理**——也就是分布式存储、主从复制、分片分配、脑裂问题。你会学到 Elasticsearch 的分布式本质。
