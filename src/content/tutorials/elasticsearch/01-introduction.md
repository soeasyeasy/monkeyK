---
title: "第 1 章：Elasticsearch 简介与环境搭建"
description: "什么是 Elasticsearch，核心优势，安装配置，第一个集群"
---

# 第 1 章：Elasticsearch 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Elasticsearch？它和 MySQL 有什么区别？
- 为什么 Elasticsearch 搜索速度那么快？
- Elasticsearch 只能做搜索吗？还有哪些用途？
- 安装 Elasticsearch 复杂吗？怎么开始使用？

这一章就是为了解答这些问题。我们会先搞清楚 **Elasticsearch 是什么、为什么需要它**，再动手把环境搭好，为后面的学习打下基础。

---

## 1.1 为什么需要 Elasticsearch？

### 痛点分析

想象一下这个场景：你开发了一个电商网站，用户可以搜索商品。起初商品不多，用 MySQL 的 `LIKE '%关键词%'` 就能搞定。但随着商品数量达到百万级，问题出现了：

- **搜索慢**：模糊查询需要扫描全表，响应时间从 50ms 变成 5 秒
- **结果不准**：用户搜"苹果手机"，出来的是"手机壳"和"苹果"
- **无法高亮**：用户看不到为什么这个商品被搜出来
- **同义词问题**：搜"土豆"找不到"马铃薯"

这就是经典的 **"全文检索难题"**。

没有 Elasticsearch 之前，我们面临这些痛点：

- **数据库不擅长搜索**：MySQL 的索引是为精确匹配优化的，不是为模糊搜索
- **响应速度慢**：百万级数据的模糊查询需要秒级响应
- **相关性排序难**：无法根据匹配度自动排序
- **扩展性差**：单机性能有上限，难以水平扩展

### 解决方案

Elasticsearch 的出现就是为了解决这些问题。它是一个 **分布式搜索引擎**，基于 Lucene 构建，专为全文搜索设计。

打个比方：

> 传统数据库就像图书馆的藏书登记系统：你知道书名就能找到，但想找"关于人工智能的书"就很麻烦。
>
> Elasticsearch 就像图书馆的智能检索系统：你输入关键词，它瞬间告诉你哪些书相关，按相关度排序，还把关键词高亮显示。

### 代码对比

没有 Elasticsearch 时搜索商品：

```java
// ❌ 使用 MySQL 模糊查询，性能差
public List<Product> searchProducts(String keyword) {
    // LIKE '%手机%' 需要扫描全表，百万数据耗时 5 秒+
    return productMapper.selectByNameLike("%" + keyword + "%");
}

// 问题：
// 1. 无法分词，"苹果手机"匹配不到"Apple 手机"
// 2. 无法按相关度排序
// 3. 无法高亮显示
```

使用 Elasticsearch 后：

```java
// ✅ 使用 Elasticsearch 全文搜索，速度快且智能
public List<Product> searchProducts(String keyword) {
    // 1. 自动分词："苹果手机" → ["苹果", "手机"]
    // 2. 倒排索引：毫秒级查询
    // 3. 相关性评分：自动按匹配度排序
    // 4. 高亮显示：关键词标红
    
    SearchRequest request = new SearchRequest("products")
        .query(QueryBuilders.multiMatchQuery(keyword, "name", "description"))
        .highlighter(new HighlightBuilder().field("name"));
    
    return elasticsearchClient.search(request, Product.class);
}

// 结果：百万数据毫秒级响应，智能分词，高亮显示
```

> **一句话总结**：Elasticsearch 让你的应用从"图书馆登记系统"变成"智能检索系统"，搜索速度提升 100 倍以上。

---

## 1.2 Elasticsearch 是什么？

### 概念解释

Elasticsearch 是一个开源的 **分布式搜索和分析引擎**，它可以用来搜索各种数据，包括文本、数字、地理空间数据等。

关键词解析：

- **分布式**：数据分布在多台机器上，可以水平扩展
- **搜索**：支持全文搜索、结构化搜索、聚合分析
- **引擎**：基于 Lucene 构建，但屏蔽了 Lucene 的复杂性

核心特点：

- **快速**：基于倒排索引，毫秒级响应
- **灵活**：支持 JSON 格式，无需预定义 schema
- **可扩展**：分布式架构，轻松扩展到数百台节点
- **高可用**：自动副本，故障自动转移

### 与其他技术的对比

| 特性 | MySQL | Elasticsearch | Redis |
|------|-------|---------------|-------|
| 数据类型 | 结构化数据 | 半结构化数据 | 键值对 |
| 搜索能力 | 精确匹配、模糊匹配 | 全文搜索、相关性排序 | 精确匹配 |
| 查询速度 | 毫秒级（精确） | 毫秒级（模糊） | 微秒级（精确） |
| 存储位置 | 磁盘 | 磁盘 + 内存 | 内存 |
| 适用场景 | 事务处理、CRUD | 搜索、日志分析 | 缓存、会话 |
| 扩展性 | 垂直扩展为主 | 水平扩展 | 水平扩展 |

### 应用场景

Elasticsearch 适用于这些场景：

- **电商搜索**：商品搜索、筛选、排序
- **日志分析**：收集、搜索、可视化日志数据
- **全文检索**：文档搜索、知识库搜索
- **实时监控**：指标收集、告警、可视化

---

## 1.3 安装 Elasticsearch

### 环境要求

安装 Elasticsearch 前需要：

- **Java 环境**：JDK 11 或更高版本
- **操作系统**：Windows/Linux/macOS
- **内存**：至少 4GB（推荐 8GB+）
- **磁盘**：SSD 推荐，至少 10GB 可用空间

### Windows 安装

**步骤 1：下载 Elasticsearch**

访问官网下载页面：https://www.elastic.co/downloads/elasticsearch

选择 Windows 版本，下载 zip 包。

**步骤 2：解压并配置**

```powershell
# 解压到指定目录
Expand-Archive elasticsearch-8.x.x-windows-x86_64.zip -DestinationPath C:\elasticsearch

# 进入配置目录
cd C:\elasticsearch\elasticsearch-8.x.x\config
```

**步骤 3：修改配置文件**

编辑 `elasticsearch.yml`：

```yaml
# 集群名称
cluster.name: my-es-cluster

# 节点名称
node.name: node-1

# 数据和日志路径（建议修改到非系统盘）
path.data: D:\elasticsearch\data
path.logs: D:\elasticsearch\logs

# 网络配置
network.host: 127.0.0.1
http.port: 9200

# 发现配置（单节点模式）
discovery.type: single-node

# 安全配置（开发环境可关闭）
xpack.security.enabled: false
```

**步骤 4：启动 Elasticsearch**

```powershell
# 进入 bin 目录
cd C:\elasticsearch\elasticsearch-8.x.x\bin

# 启动 Elasticsearch
.\elasticsearch.bat
```

**步骤 5：验证安装**

打开浏览器访问：http://localhost:9200

看到如下 JSON 表示成功：

```json
{
  "name" : "node-1",
  "cluster_name" : "my-es-cluster",
  "version" : {
    "number" : "8.x.x",
    ...
  },
  "tagline" : "You Know, for Search"
}
```

### Docker 安装（推荐）

使用 Docker 安装更简单：

```bash
# 拉取镜像
docker pull elasticsearch:8.x.x

# 启动容器
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.x.x
```

---

## 1.4 第一个 Elasticsearch 操作

### 使用 curl 测试

**创建索引**：

```bash
# 创建一个名为 products 的索引
curl -X PUT "localhost:9200/products" -H 'Content-Type: application/json' -d '
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'
```

**添加文档**：

```bash
# 添加一个商品文档
curl -X POST "localhost:9200/products/_doc" -H 'Content-Type: application/json' -d '
{
  "name": "iPhone 15 Pro",
  "description": "苹果公司最新旗舰手机",
  "price": 7999,
  "category": "手机"
}'
```

**搜索文档**：

```bash
# 搜索包含"手机"的商品
curl -X GET "localhost:9200/products/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "multi_match": {
      "query": "手机",
      "fields": ["name", "description"]
    }
  }
}'
```

### 使用 Kibana Dev Tools

安装 Kibana 后，可以在 Dev Tools 中更方便地操作：

```
# 创建索引
PUT /products
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}

# 添加文档
POST /products/_doc
{
  "name": "iPhone 15 Pro",
  "description": "苹果公司最新旗舰手机",
  "price": 7999,
  "category": "手机"
}

# 搜索
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

---

## 1.5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Elasticsearch 是什么 | 分布式搜索引擎，用于全文搜索和数据分析 |
| 为什么需要 ES | 解决传统数据库搜索慢、不智能的问题 |
| 核心优势 | 快速、灵活、可扩展、高可用 |
| 安装方式 | 下载安装、Docker 安装 |
| 基本操作 | 创建索引、添加文档、搜索文档 |

---

## 1.6 新手常见误区

### 误区 1："Elasticsearch 可以完全替代 MySQL"

**错！** Elasticsearch 和 MySQL 是互补关系，不是替代关系。

- MySQL 适合：事务处理、精确查询、关联查询
- Elasticsearch 适合：全文搜索、模糊匹配、聚合分析

正确做法：MySQL 存储核心数据，Elasticsearch 提供搜索能力，通过数据同步保持一致。

### 误区 2："安装后直接就能用"

不是的。Elasticsearch 默认开启了安全认证，需要配置用户名密码或关闭安全功能。

开发环境可以关闭：`xpack.security.enabled: false`

生产环境必须开启安全认证。

### 误区 3："单个节点就够了"

生产环境至少需要 3 个节点，以保证高可用。单节点只适合开发和测试。

### 误区 4："内存越大越好"

虽然 Elasticsearch 依赖内存，但 JVM 堆内存不要超过物理内存的 50%，且最大不超过 32GB。剩余内存留给 Lucene 做文件缓存。

---

## 1.7 动手练习

### 练习 1：基础安装

安装 Elasticsearch 并验证安装成功，访问 http://localhost:9200 查看集群信息。

<details>
<summary>点击查看答案</summary>

使用 Docker 安装：

```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.x.x
```

验证：访问 http://localhost:9200，看到集群信息即成功。

</details>

### 练习 2：创建索引

创建一个名为 `books` 的索引，设置 1 个主分片，0 个副本。

<details>
<summary>点击查看答案</summary>

```bash
curl -X PUT "localhost:9200/books" -H 'Content-Type: application/json' -d '
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'
```

</details>

### 练习 3（挑战）：添加并搜索文档

向 `books` 索引添加 3 本书，然后搜索包含"Java"的书籍。

<details>
<summary>点击查看答案</summary>

添加文档：

```bash
# 添加第 1 本书
curl -X POST "localhost:9200/books/_doc" -H 'Content-Type: application/json' -d '
{
  "title": "Java 编程思想",
  "author": "Bruce Eckel",
  "price": 108
}'

# 添加第 2 本书
curl -X POST "localhost:9200/books/_doc" -H 'Content-Type: application/json' -d '
{
  "title": "Java 核心技术",
  "author": "Cay Horstmann",
  "price": 119
}'

# 添加第 3 本书
curl -X POST "localhost:9200/books/_doc" -H 'Content-Type: application/json' -d '
{
  "title": "Python 编程",
  "author": "Eric Matthes",
  "price": 89
}'
```

搜索：

```bash
curl -X GET "localhost:9200/books/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "multi_match": {
      "query": "Java",
      "fields": ["title", "author"]
    }
  }
}'
```

应该返回 2 本 Java 相关的书。

</details>

---

## 下一章预告

下一章我们会学习 **Elasticsearch 的核心概念**——也就是索引、文档、分片、副本、节点