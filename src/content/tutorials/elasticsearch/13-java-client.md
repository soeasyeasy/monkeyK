---
title: "第 13 章：Java API 客户端"
description: "Java High Level REST Client、CRUD 操作、批量处理"
---

# 第 13 章：Java API 客户端

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Java 应用如何连接 Elasticsearch？
- 如何用 Java 代码实现文档的增删改查？
- 批量操作在 Java 中怎么做？
- 有哪些客户端可以选择？

这一章会帮你掌握 Elasticsearch 的 Java 客户端使用。这是 Java 开发者集成 Elasticsearch 的核心技能。

---

## 13.1 为什么需要 Java 客户端？

### 痛点分析

直接用 HTTP 请求操作 Elasticsearch 存在这些问题：

- **代码冗余**：需要手动构建 JSON、处理 HTTP 连接
- **类型不安全**：JSON 字符串容易出错，编译期无法检查
- **维护困难**：DSL 变更需要手动修改所有相关代码
- **性能问题**：缺乏连接池、重试等机制

### 解决方案

Elasticsearch 提供了官方 Java 客户端：

- **Java API Client**（新版，推荐）：Elasticsearch 8.x 推荐使用
- **Java High Level REST Client**（旧版）：Elasticsearch 7.x 使用
- **Java Low Level REST Client**：最底层，灵活但复杂

打个比方：

> 直接用 HTTP 像自己开车导航，Java 客户端像用高德地图，自动规划路线、避开拥堵。

---

## 13.2 客户端选择

### 版本对比

| 客户端 | 适用版本 | 特点 |
|--------|---------|------|
| Java API Client | 8.x+ | 新版，类型安全，流式 API |
| High Level REST Client | 7.x | 功能丰富，已废弃 |
| Low Level REST Client | 所有版本 | 最底层，灵活但复杂 |

### 推荐选择

- **Elasticsearch 8.x**：使用 Java API Client
- **Elasticsearch 7.x**：使用 High Level REST Client
- **需要最大灵活性**：使用 Low Level REST Client

---

## 13.3 Java API Client（8.x）

### 添加依赖

```xml
<!-- pom.xml -->
<dependency>
    <groupId>co.elastic.clients</groupId>
    <artifactId>elasticsearch-java</artifactId>
    <version>8.11.0</version>
</dependency>

<!-- JSON 处理 -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.0</version>
</dependency>
```

### 创建客户端

```java
// 创建客户端
import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;

// 创建 RestClient
RestClient restClient = RestClient.builder(
    new HttpHost("localhost", 9200, "http")
).build();

// 创建 Transport
ElasticsearchTransport transport = new RestClientTransport(
    restClient,
    new JacksonJsonpMapper()
);

// 创建 Client
ElasticsearchClient client = new ElasticsearchClient(transport);
```

### 带认证的客户端

```java
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.elasticsearch.client.RestClient;

// 配置认证
BasicCredentialsProvider credsProv = new BasicCredentialsProvider();
credsProv.setCredentials(
    AuthScope.ANY,
    new UsernamePasswordCredentials("elastic", "password")
);

RestClient restClient = RestClient.builder(
    new HttpHost("localhost", 9200, "https")
)
.setHttpClientConfigCallback(h -> h.setDefaultCredentialsProvider(credsProv))
.build();

ElasticsearchTransport transport = new RestClientTransport(
    restClient,
    new JacksonJsonpMapper()
);

ElasticsearchClient client = new ElasticsearchClient(transport);
```

---

## 13.4 索引操作

### 创建索引

```java
// 创建索引
client.indices().create(c -> c
    .index("products")
    .settings(s -> s
        .numberOfShards(3)
        .numberOfReplicas(1)
    )
    .mappings(m -> m
        .properties("name", p -> p.text(t -> t.analyzer("ik_max_word")))
        .properties("price", p -> p.float_(f -> f))
        .properties("category", p -> p.keyword(k -> k))
    )
);
```

### 删除索引

```java
// 删除索引
client.indices().delete(d -> d
    .index("products")
);
```

### 检查索引是否存在

```java
// 检查索引是否存在
boolean exists = client.indices().exists(e -> e
    .index("products")
).value();
```

---

## 13.5 文档 CRUD 操作

### 创建文档

```java
// 定义实体类
public class Product {
    private String name;
    private Double price;
    private String category;
    
    // getters and setters
}

// 创建文档（自动生成 ID）
Product product = new Product();
product.setName("iPhone 15 Pro");
product.setPrice(7999.0);
product.setCategory("手机");

IndexResponse response = client.index(i -> i
    .index("products")
    .document(product)
);

String docId = response.id();
System.out.println("Created document with ID: " + docId);

// 创建文档（指定 ID）
client.index(i -> i
    .index("products")
    .id("1001")
    .document(product)
);
```

### 查询文档

```java
// 根据 ID 查询
GetResponse<Product> response = client.get(g -> g
    .index("products")
    .id("1001"),
    Product.class
);

if (response.found()) {
    Product product = response.source();
    System.out.println("Product: " + product.getName());
} else {
    System.out.println("Document not found");
}
```

### 更新文档

```java
// 全量更新
Product updatedProduct = new Product();
updatedProduct.setName("iPhone 15 Pro Max");
updatedProduct.setPrice(9999.0);
updatedProduct.setCategory("手机");

client.index(i -> i
    .index("products")
    .id("1001")
    .document(updatedProduct)
);

// 局部更新
client.update(u -> u
    .index("products")
    .id("1001")
    .doc(Map.of("price", 8999.0)),
    Product.class
);
```

### 删除文档

```java
// 删除文档
client.delete(d -> d
    .index("products")
    .id("1001")
);
```

---

## 13.6 查询操作

### Match 查询

```java
import co.elastic.clients.elasticsearch._types.query_dsl.Query;

// Match 查询
SearchResponse<Product> response = client.search(s -> s
    .index("products")
    .query(q -> q
        .match(m -> m
            .field("name")
            .query("手机")
        )
    ),
    Product.class
);

// 处理结果
List<Hit<Product>> hits = response.hits().hits();
for (Hit<Product> hit : hits) {
    Product product = hit.source();
    System.out.println("Score: " + hit.score());
    System.out.println("Product: " + product.getName());
}
```

### Bool 查询

```java
// Bool 查询
SearchResponse<Product> response = client.search(s -> s
    .index("products")
    .query(q -> q
        .bool(b -> b
            .must(m -> m
                .match(mt -> mt
                    .field("name")
                    .query("手机")
                )
            )
            .filter(f -> f
                .term(t -> t
                    .field("category")
                    .value("电子产品")
                )
            )
            .filter(f -> f
                .range(r -> r
                    .number(n -> n
                        .field("price")
                        .gte(5000.0)
                        .lte(10000.0)
                    )
                )
            )
        )
    ),
    Product.class
);
```

### 分页查询

```java
// 分页查询
int page = 1;
int size = 10;

SearchResponse<Product> response = client.search(s -> s
    .index("products")
    .query(q -> q
        .matchAll(m -> m)
    )
    .from((page - 1) * size)
    .size(size),
    Product.class
);

long total = response.hits().total().value();
System.out.println("Total: " + total);
```

### 排序查询

```java
// 排序查询
SearchResponse<Product> response = client.search(s -> s
    .index("products")
    .query(q -> q
        .matchAll(m -> m)
    )
    .sort(so -> so
        .field(f -> f
            .field("price")
            .order(SortOrder.Desc)
        )
    ),
    Product.class
);
```

---

## 13.7 批量操作

### Bulk API

```java
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import co.elastic.clients.elasticsearch.core.bulk.BulkResponseItem;

// 创建批量请求
BulkRequest.Builder bulkBuilder = new BulkRequest.Builder();

// 添加多个操作
for (Product product : products) {
    bulkBuilder.operations(op -> op
        .index(idx -> idx
            .index("products")
            .document(product)
        )
    );
}

// 执行批量请求
BulkResponse result = client.bulk(bulkBuilder.build());

// 检查错误
if (result.errors()) {
    for (BulkResponseItem item : result.items()) {
        if (item.error() != null) {
            System.out.println("Error: " + item.error().reason());
        }
    }
}
```

### 批量处理大量数据

```java
// 分批处理大量数据
int batchSize = 1000;
List<Product> allProducts = getAllProducts();  // 假设有 10000 条

for (int i = 0; i < allProducts.size(); i += batchSize) {
    int end = Math.min(i + batchSize, allProducts.size());
    List<Product> batch = allProducts.subList(i, end);
    
    BulkRequest.Builder bulkBuilder = new BulkRequest.Builder();
    for (Product product : batch) {
        bulkBuilder.operations(op -> op
            .index(idx -> idx
                .index("products")
                .document(product)
            )
        );
    }
    
    BulkResponse result = client.bulk(bulkBuilder.build());
    
    if (result.errors()) {
        // 处理错误
        System.err.println("Batch " + i + " has errors");
    } else {
        System.out.println("Batch " + i + " success");
    }
}
```

---

## 13.8 聚合操作

### Metric 聚合

```java
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch._types.aggregations.DoubleAggregate;

// 平均价格聚合
SearchResponse<Void> response = client.search(s -> s
    .index("products")
    .size(0)  // 不返回文档
    .aggregations("avg_price", a -> a
        .avg(avg -> avg
            .field("price")
        )
    ),
    Void.class
);

// 获取聚合结果
DoubleAggregate avgAgg = response.aggregations()
    .get("avg_price")
    .avg();
double avgPrice = avgAgg.value();
System.out.println("Average price: " + avgPrice);
```

### Bucket 聚合

```java
// Terms 聚合
SearchResponse<Void> response = client.search(s -> s
    .index("products")
    .size(0)
    .aggregations("category_count", a -> a
        .terms(t -> t
            .field("category")
            .size(10)
        )
    ),
    Void.class
);

// 获取聚合结果
StringTermsAggregate categoryAgg = response.aggregations()
    .get("category_count")
    .sterms();

for (StringTermsBucket bucket : categoryAgg.buckets()) {
    System.out.println("Category: " + bucket.key() + ", Count: " + bucket.docCount());
}
```

### 嵌套聚合

```java
// 每个分类的平均价格
SearchResponse<Void> response = client.search(s -> s
    .index("products")
    .size(0)
    .aggregations("category_count", a -> a
        .terms(t -> t
            .field("category")
        )
        .aggregations("avg_price", sub -> sub
            .avg(avg -> avg
                .field("price")
            )
        )
    ),
    Void.class
);

// 获取结果
StringTermsAggregate categoryAgg = response.aggregations()
    .get("category_count")
    .sterms();

for (StringTermsBucket bucket : categoryAgg.buckets()) {
    double avgPrice = bucket.aggregations()
        .get("avg_price")
        .avg()
        .value();
    System.out.println("Category: " + bucket.key() + ", Avg Price: " + avgPrice);
}
```

---

## 13.9 资源管理

### 关闭客户端

```java
// 应用关闭时关闭客户端
@PreDestroy
public void close() {
    try {
        if (client != null) {
            client._transport().close();
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
}
```

### 连接池配置

```java
// 配置连接池
RestClient restClient = RestClient.builder(
    new HttpHost("localhost", 9200, "http")
)
.setRequestConfigCallback(config -> config
    .setConnectTimeout(5000)
    .setSocketTimeout(60000)
)
.setHttpClientConfigCallback(httpClientBuilder -> httpClientBuilder
    .setMaxConnTotal(100)
    .setMaxConnPerRoute(100)
)
.build();
```

---

## 13.10 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 客户端选择 | 8.x 用 Java API Client，7.x 用 High Level REST Client |
| 创建客户端 | 配置连接、认证、JSON 映射 |
| CRUD 操作 | index、get、update、delete |
| 查询操作 | match、bool、分页、排序 |
| 批量操作 | Bulk API，分批处理大量数据 |
| 聚合操作 | Metric、Bucket、嵌套聚合 |

---

## 13.11 新手常见误区

### 误区 1："在 Spring Boot 中手动创建客户端"

**错！** Spring Boot 项目应该使用 Spring Data Elasticsearch，自动配置客户端。

### 误区 2："批量操作没有大小限制"

不是的。批量请求过大（超过 10MB）会导致内存问题。建议每批 5-10MB 或 500-1000 条。

### 误区 3："不需要关闭客户端"

客户端包含连接池等资源，应用关闭时必须正确关闭，否则会导致资源泄漏。

---

## 13.12 动手练习

### 练习 1：基础 CRUD

使用 Java API Client 实现文档的创建、查询、更新、删除。

<details>
<summary>点击查看答案</summary>

```java
// 创建
Product product = new Product();
product.setName("iPhone 15");
product.setPrice(5999.0);

client.index(i -> i
    .index("products")
    .id("1")
    .document(product)
);

// 查询
GetResponse<Product> response = client.get(g -> g
    .index("products")
    .id("1"),
    Product.class
);

// 更新
client.update(u -> u
    .index("products")
    .id("1")
    .doc(Map.of("price", 6999.0)),
    Product.class
);

// 删除
client.delete(d -> d
    .index("products")
    .id("1")
);
```

</details>

### 练习 2：批量操作

使用 Bulk API 批量插入 1000 条商品数据。

<details>
<summary>点击查看答案</summary>

```java
BulkRequest.Builder bulkBuilder = new BulkRequest.Builder();

for (int i = 0; i < 1000; i++) {
    Product product = new Product();
    product.setName("商品" + i);
    product.setPrice(100.0 + i);
    product.setCategory("分类" + (i % 10));
    
    bulkBuilder.operations(op -> op
        .index(idx -> idx
            .index("products")
            .document(product)
        )
    );
}

BulkResponse result = client.bulk(bulkBuilder.build());

if (result.errors()) {
    System.err.println("Bulk insert has errors");
} else {
    System.out.println("Bulk insert success");
}
```

</details>

### 练习 3（挑战）：复杂查询

实现一个搜索方法，支持关键词搜索、分类过滤、价格范围、分页。

<details>
<summary>点击查看答案</summary>

```java
public SearchResponse<Product> searchProducts(
    String keyword,
    String category,
    Double minPrice,
    Double maxPrice,
    int page,
    int size
) {
    return client.search(s -> {
        s.index("products")
            .from((page - 1) * size)
            .size(size);
        
        s.query(q -> q
            .bool(b -> {
                // 关键词搜索
                if (keyword != null && !keyword.isEmpty()) {
                    b.must(m -> m
                        .multiMatch(mm -> mm
                            .fields("name", "description")
                            .query(keyword)
                        )
                    );
                }
                
                // 分类过滤
                if (category != null && !category.isEmpty()) {
                    b.filter(f -> f
                        .term(t -> t
                            .field("category")
                            .value(category)
                        )
                    );
                }
                
                // 价格范围
                if (minPrice != null || maxPrice != null) {
                    b.filter(f -> f
                        .range(r -> r
                            .number(n -> {
                                n.field("price");
                                if (minPrice != null) n.gte(minPrice);
                                if (maxPrice != null) n.lte(maxPrice);
                                return n;
                            })
                        )
                    );
                }
                
                return b;
            })
        );
        
        return s;
    }, Product.class);
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring Boot 集成**——也就是 Spring Data Elasticsearch、Repository、自动配置。你会学到如何在 Spring Boot 项目中更优雅地使用 Elasticsearch。
