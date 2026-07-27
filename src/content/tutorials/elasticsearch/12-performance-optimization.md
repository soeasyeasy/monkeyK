---
title: "第 12 章：性能优化实战"
description: "查询优化、索引优化、内存管理、JVM 调优"
---

# 第 12 章：性能优化实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Elasticsearch 查询慢，如何优化？
- 索引性能差，如何提升写入速度？
- 内存不足，如何优化内存使用？
- JVM 参数如何配置？

这一章会帮你掌握 Elasticsearch 的性能优化技巧。这些是生产环境必备的技能。

---

## 1 为什么需要性能优化？

### 痛点分析

随着数据量增长，Elasticsearch 可能出现：

- **查询慢**：响应时间从毫秒级变成秒级
- **写入慢**：批量索引速度下降
- **内存不足**：频繁 GC，甚至 OOM
- **资源浪费**：CPU、磁盘、网络未充分利用

### 解决方案

系统性的性能优化：

- **查询优化**：优化查询语句、使用缓存
- **索引优化**：调整刷新间隔、批量写入
- **内存优化**：合理配置堆内存、使用字段缓存
- **JVM 调优**：优化 GC 参数

打个比方：

> 性能优化就像开车省油，需要优化驾驶习惯（查询）、保养发动机（JVM）、减轻车重（内存）。

---

## 2 查询优化

### 避免深度分页

```bash
# ❌ 深度分页（慢）
GET /products/_search
{
  "query": { "match_all": {} },
  "from": 10000,
  "size": 10
}

# ✅ 使用 search_after（快）
GET /products/_search
{
  "query": { "match_all": {} },
  "size": 10,
  "sort": [
    { "created_at": "desc" },
    { "_id": "asc" }
  ],
  "search_after": ["2024-01-01T00:00:00", "last_id"]
}
```

### 使用 Filter 代替 Query

```bash
# ❌ 所有条件都用 must（计算评分，慢）
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "手机" } },
        { "term": { "status": "上架" } },
        { "range": { "price": { "gte": 1000 } } }
      ]
    }
  }
}

# ✅ 不需要评分的条件用 filter（不计算评分，可缓存，快）
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "手机" } }
      ],
      "filter": [
        { "term": { "status": "上架" } },
        { "range": { "price": { "gte": 1000 } } }
      ]
    }
  }
}
```

### 避免通配符查询

```bash
# ❌ 前缀通配符（慢，无法利用索引）
GET /products/_search
{
  "query": {
    "wildcard": {
      "name": "*手机"
    }
  }
}

# ✅ 使用 match_phrase 或 edge_ngram（快）
GET /products/_search
{
  "query": {
    "match_phrase": {
      "name": "苹果手机"
    }
  }
}
```

### 使用路由减少分片扫描

```bash
# ❌ 扫描所有分片
GET /products/_search
{
  "query": {
    "term": { "user_id": "123" }
  }
}

# ✅ 指定路由，只扫描特定分片
GET /products/_search?routing=123
{
  "query": {
    "term": { "user_id": "123" }
  }
}
```

### 限制返回字段

```bash
# ❌ 返回所有字段
GET /products/_search
{
  "query": { "match_all": {} }
}

# ✅ 只返回需要的字段
GET /products/_search
{
  "query": { "match_all": {} },
  "_source": ["name", "price", "category"]
}
```

---

## 3 索引优化

### 调整刷新间隔

```bash
# ❌ 默认 1s 刷新（频繁，影响写入性能）
PUT /products
{
  "settings": {
    "refresh_interval": "1s"
  }
}

# ✅ 批量写入时延长刷新间隔（快）
PUT /products
{
  "settings": {
    "refresh_interval": "30s"
  }
}

# 写入完成后手动刷新
POST /products/_refresh
```

### 使用批量写入

```bash
# ❌ 逐条写入（慢）
POST /products/_doc
{ "name": "商品1", "price": 100 }

POST /products/_doc
{ "name": "商品2", "price": 200 }

# ✅ 批量写入（快，10-50 倍提升）
POST /_bulk
{ "index": { "_index": "products" } }
{ "name": "商品1", "price": 100 }
{ "index": { "_index": "products" } }
{ "name": "商品2", "price": 200 }
```

### 调整副本数

```bash
# ❌ 写入时保留副本（慢，需要同步）
PUT /products
{
  "settings": {
    "number_of_replicas": 1
  }
}

# ✅ 批量写入时临时关闭副本（快）
PUT /products/_settings
{
  "number_of_replicas": 0
}

# 写入完成后恢复副本
PUT /products/_settings
{
  "number_of_replicas": 1
}
```

### 使用 translog 优化

```bash
# 调整 translog 刷盘策略
PUT /products
{
  "settings": {
    "index.translog.durability": "async",  # 异步刷盘（快，可能丢失数据）
    "index.translog.sync_interval": "5s"
  }
}
```

---

## 4 内存优化

### 合理配置堆内存

```bash
# jvm.options 配置
-Xms4g  # 最小堆内存
-Xmx4g  # 最大堆内存

# 规则：
# 1. 不超过物理内存的 50%
# 2. 最大不超过 32GB
# 3. Xms 和 Xmx 设置为相同值
```

### 优化字段缓存

```bash
# 禁用不需要缓存的字段
PUT /products
{
  "mappings": {
    "properties": {
      "description": {
        "type": "text",
        "eager_global_ordinals": false  # 不预加载全局序数
      },
      "category": {
        "type": "keyword",
        "eager_global_ordinals": true  # 预加载，聚合更快
      }
    }
  }
}
```

### 监控内存使用

```bash
# 查看节点内存使用
GET /_nodes/stats/jvm

# 关键指标
{
  "jvm": {
    "mem": {
      "heap_used_percent": 65,  # < 75% 正常
      "heap_used_in_bytes": 2147483648,
      "heap_max_in_bytes": 4294967296
    }
  }
}
```

---

## 5 JVM 调优

### GC 优化

```bash
# jvm.options 配置
## GC 配置
-XX:+UseG1GC  # 使用 G1 垃圾收集器
-XX:MaxGCPauseMillis=200  # 最大 GC 停顿时间
-XX:G1HeapRegionSize=8m  # G1 区域大小
-XX:InitiatingHeapOccupancyPercent=45  # 触发并发标记的堆占用率

## GC 日志
-Xlog:gc*,gc+age=trace,safepoint:file=/var/log/elasticsearch/gc.log:utctime,pid,tags:filecount=32,filesize=64m
```

### 避免 Full GC

```bash
# 监控 GC 情况
GET /_nodes/stats/jvm

# 关注指标
{
  "jvm": {
    "gc": {
      "collectors": {
        "young": {
          "collection_count": 100,  # Young GC 次数
          "collection_time_in_millis": 5000  # Young GC 时间
        },
        "old": {
          "collection_count": 5,  # Old GC 次数（应该很少）
          "collection_time_in_millis": 2000  # Old GC 时间
        }
      }
    }
  }
}

# 如果 old GC 频繁，需要：
# 1. 增加堆内存
# 2. 检查内存泄漏
# 3. 优化查询和聚合
```

### 线程池优化

```bash
# 查看线程池配置
GET /_nodes?filter_path=**.thread_pool

# 调整线程池（谨慎）
# 通常在 elasticsearch.yml 中配置
# thread_pool.search.size: 13  # CPU 核心数 + 1
# thread_pool.write.size: 9
```

---

## 6 磁盘优化

### 使用 SSD

```bash
# 检测磁盘类型
GET /_cat/nodes?v&h=name,disk.type

# 如果显示 "-" 或 "hdd"，建议更换 SSD
```

### 优化分片大小

```bash
# 推荐分片大小：10-50GB
# 太小：管理开销大
# 太大：恢复慢，内存占用高

PUT /products
{
  "settings": {
    "number_of_shards": 5  # 根据数据量调整
  }
}
```

### 定期 Force Merge

```bash
# 合并段，减少磁盘占用，提升查询性能
POST /products/_forcemerge?max_num_segments=1

# 注意：
# 1. 消耗 CPU，建议在低峰期执行
# 2. 只对只读索引执行
```

---

## 7 性能监控清单

### 日常监控指标

| 指标 | 正常范围 | 告警阈值 |
|------|---------|---------|
| CPU 使用率 | < 70% | > 80% |
| JVM 堆内存 | < 70% | > 75% |
| 磁盘使用率 | < 75% | > 85% |
| 查询延迟 | < 100ms | > 1s |
| 索引延迟 | < 100ms | > 500ms |
| GC 停顿时间 | < 200ms | > 500ms |
| 拒绝请求数 | 0 | > 0 |

### 性能优化检查清单

- [ ] 避免深度分页，使用 search_after
- [ ] 不需要评分的条件用 filter
- [ ] 批量写入，调整刷新间隔
- [ ] 限制返回字段
- [ ] 合理配置堆内存
- [ ] 监控 GC 情况
- [ ] 使用 SSD 存储
- [ ] 定期 force merge 只读索引

---

## 8 核心知识点总结

| 优化方向 | 关键技巧 |
|---------|---------|
| 查询优化 | 避免深度分页、使用 filter、限制字段 |
| 索引优化 | 批量写入、调整刷新间隔、临时关闭副本 |
| 内存优化 | 合理配置堆内存、优化字段缓存 |
| JVM 调优 | 使用 G1GC、监控 GC 情况 |
| 磁盘优化 | 使用 SSD、优化分片大小、force merge |

---

## 9 新手常见误区

### 误区 1："堆内存越大越好"

**错！** 堆内存超过 32GB 会失去指针压缩的优势，且影响 GC 性能。建议不超过物理内存的 50%，且最大 32GB。

### 误区 2："分片越多性能越好"

不是的。分片过多会增加管理开销，查询需要协调更多分片。根据数据量合理规划。

### 误区 3："优化一次就够了"

性能优化是持续的过程，需要定期监控和调整。

---

## 10 动手练习

### 练习 1：查询优化

优化一个查询，使用 filter 代替不必要的 must。

<details>
<summary>点击查看答案</summary>

```bash
# 优化前
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "手机" } },
        { "term": { "status": "上架" } },
        { "range": { "price": { "gte": 1000 } } }
      ]
    }
  }
}

# 优化后
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "手机" } }
      ],
      "filter": [
        { "term": { "status": "上架" } },
        { "range": { "price": { "gte": 1000 } } }
      ]
    }
  }
}
```

</details>

### 练习 2：索引优化

配置一个索引，优化批量写入性能。

<details>
<summary>点击查看答案</summary>

```bash
PUT /products
{
  "settings": {
    "refresh_interval": "30s",  # 延长刷新间隔
    "number_of_replicas": 0,    # 写入时关闭副本
    "index.translog.durability": "async"  # 异步刷盘
  }
}

# 批量写入
POST /_bulk
{ "index": { "_index": "products" } }
{ "name": "商品1", "price": 100 }
{ "index": { "_index": "products" } }
{ "name": "商品2", "price": 200 }

# 写入完成后恢复
PUT /products/_settings
{
  "refresh_interval": "1s",
  "number_of_replicas": 1
}
```

</details>

### 练习 3（挑战）：性能监控

查看节点的 JVM 和线程池状态，判断是否存在性能瓶颈。

<details>
<summary>点击查看答案</summary>

```bash
# 查看 JVM 状态
GET /_nodes/stats/jvm

# 查看线程池状态
GET /_cat/thread_pool?v

# 分析要点
# 1. heap_used_percent < 75%：正常
# 2. old GC 次数少：正常
# 3. rejected 列有值：线程池满了，需要优化

# 优化建议
# - 如果 heap 高：增加堆内存或优化查询
# - 如果 old GC 频繁：检查内存泄漏
# - 如果 rejected > 0：增加线程池大小或优化写入
```

</details>

---

## 下一章预告

下一章我们会学习 **Java API 客户端**——也就是 Java High Level REST Client、CRUD 操作、批量处理。你会学到如何在 Java 应用中使用 Elasticsearch。
