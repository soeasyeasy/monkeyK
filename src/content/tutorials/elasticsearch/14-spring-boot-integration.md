---
title: "第 14 章：Spring Boot 集成"
description: "Spring Data Elasticsearch、Repository、自动配置"
---

# 第 14 章：Spring Boot 集成

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring Boot 如何集成 Elasticsearch？
- 什么是 Spring Data Elasticsearch？
- 如何使用 Repository 模式简化操作？
- 如何进行自动配置和自定义配置？

这一章会帮你掌握 Spring Boot 与 Elasticsearch 的集成。这是 Java 企业级开发的标准方式。

---

## 1 为什么需要 Spring Boot 集成？

### 痛点分析

直接使用 Java API Client 存在这些问题：

- **代码繁琐**：需要手动管理客户端生命周期
- **缺乏抽象**：每次都要写重复的查询代码
- **配置复杂**：需要手动配置连接池、序列化等
- **不符合 Spring 风格**：无法利用 Spring 的依赖注入和 AOP

### 解决方案

Spring Data Elasticsearch 提供了：

- **自动配置**：自动创建和管理客户端
- **Repository 模式**：类似 JPA 的简洁 API
- **声明式查询**：通过方法名自动生成查询
- **事务支持**：与 Spring 事务管理集成

打个比方：

> 直接用 Java API 像手动挡开车，Spring Boot 集成像自动挡，更简单、更安全。

---

## 2 添加依赖

### Maven 依赖

```xml
<!-- pom.xml -->
<dependencies>
    <!-- Spring Data Elasticsearch -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
</dependencies>
```

### Gradle 依赖

```gradle
// build.gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-elasticsearch'
    implementation 'org.springframework.boot:spring-boot-starter'
}
```

---

## 3 配置文件

### application.yml

```yaml
# application.yml
spring:
  elasticsearch:
    uris: http://localhost:9200
    username: elastic
    password: your_password
    connection-timeout: 5s
    socket-timeout: 30s
```

### application.properties

```properties
# application.properties
spring.elasticsearch.uris=http://localhost:9200
spring.elasticsearch.username=elastic
spring.elasticsearch.password=your_password
spring.elasticsearch.connection-timeout=5s
spring.elasticsearch.socket-timeout=30s
```

---

## 4 实体类定义

### 使用注解映射

```java
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(indexName = "products")
public class Product {
    
    @Id
    private String id;
    
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String name;
    
    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String description;
    
    @Field(type = FieldType.Double)
    private Double price;
    
    @Field(type = FieldType.Keyword)
    private String category;
    
    @Field(type = FieldType.Keyword)
    private String brand;
    
    @Field(type = FieldType.Date, format = {}, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    // getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

### 常用注解说明

| 注解 | 说明 |
|------|------|
| @Document | 指定索引名称 |
| @Id | 文档 ID 字段 |
| @Field | 字段映射配置 |
| type | 字段类型（Text、Keyword、Double 等） |
| analyzer | 索引时使用的分词器 |
| searchAnalyzer | 搜索时使用的分词器 |
| format/pattern | 日期格式 |

---

## 5 Repository 接口

### 基础 Repository

```java
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends ElasticsearchRepository<Product, String> {
    
    // 基础 CRUD 方法自动继承
    // save(), findById(), findAll(), delete() 等
}
```

### 使用 Repository

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    // 创建文档
    public Product create(Product product) {
        return productRepository.save(product);
    }
    
    // 查询文档
    public Optional<Product> findById(String id) {
        return productRepository.findById(id);
    }
    
    // 查询所有
    public Iterable<Product> findAll() {
        return productRepository.findAll();
    }
    
    // 删除文档
    public void deleteById(String id) {
        productRepository.deleteById(id);
    }
}
```

---

## 6 声明式查询

### 方法名查询

```java
@Repository
public interface ProductRepository extends ElasticsearchRepository<Product, String> {
    
    // 根据名称查询
    List<Product> findByName(String name);
    
    // 根据分类查询
    List<Product> findByCategory(String category);
    
    // 根据价格范围查询
    List<Product> findByPriceBetween(Double minPrice, Double maxPrice);
    
    // 根据名称和分类查询
    List<Product> findByNameAndCategory(String name, String category);
    
    // 根据名称或分类查询
    List<Product> findByNameOrCategory(String name, String category);
    
    // 根据名称模糊查询（包含）
    List<Product> findByNameContaining(String keyword);
    
    // 根据名称开头查询
    List<Product> findByNameStartingWith(String prefix);
    
    // 根据价格大于查询
    List<Product> findByPriceGreaterThan(Double price);
    
    // 根据价格小于查询
    List<Product> findByPriceLessThan(Double price);
    
    // 排序查询
    List<Product> findByCategoryOrderByPriceDesc(String category);
    
    // 分页查询
    Page<Product> findByCategory(String category, Pageable pageable);
}
```

### 使用示例

```java
@Service
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    public List<Product> searchByName(String name) {
        return productRepository.findByName(name);
    }
    
    public List<Product> searchByPriceRange(Double min, Double max) {
        return productRepository.findByPriceBetween(min, max);
    }
    
    public Page<Product> searchByCategory(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByCategory(category, pageable);
    }
}
```

---

## 7 自定义查询

### 使用 @Query 注解

```java
@Repository
public interface ProductRepository extends ElasticsearchRepository<Product, String> {
    
    // 使用 JSON DSL 查询
    @Query("{\"bool\": {\"must\": [{\"match\": {\"name\": \"?0\"}}]}}")
    List<Product> searchByName(String name);
    
    // 多条件查询
    @Query("{\"bool\": {\"must\": [" +
           "{\"match\": {\"name\": \"?0\"}}, " +
           "{\"term\": {\"category\": \"?1\"}}" +
           "]}}")
    List<Product> searchByNameAndCategory(String name, String category);
    
    // 范围查询
    @Query("{\"range\": {\"price\": {\"gte\": ?0, \"lte\": ?1}}}")
    List<Product> searchByPriceRange(Double minPrice, Double maxPrice);
}
```

### 使用 ElasticsearchOperations

```java
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.NativeSearchQuery;
import org.springframework.data.elasticsearch.core.query.NativeSearchQueryBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProductSearchService {
    
    @Autowired
    private ElasticsearchOperations elasticsearchOperations;
    
    public List<Product> search(String keyword, String category, Double minPrice, Double maxPrice) {
        // 构建查询
        NativeSearchQuery query = new NativeSearchQueryBuilder()
            .withQuery(QueryBuilders.boolQuery()
                .must(QueryBuilders.matchQuery("name", keyword))
                .filter(QueryBuilders.termQuery("category", category))
                .filter(QueryBuilders.rangeQuery("price").gte(minPrice).lte(maxPrice))
            )
            .withPageable(PageRequest.of(0, 10))
            .build();
        
        // 执行查询
        SearchHits<Product> searchHits = elasticsearchOperations.search(query, Product.class);
        
        // 提取结果
        return searchHits.getSearchHits().stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
}
```

---

## 8 聚合操作

### 使用 ElasticsearchOperations

```java
import org.springframework.data.elasticsearch.core.aggregation.Aggregation;
import org.springframework.data.elasticsearch.core.query.NativeSearchQuery;
import org.springframework.data.elasticsearch.core.query.NativeSearchQueryBuilder;

@Service
public class ProductAggregationService {
    
    @Autowired
    private ElasticsearchOperations elasticsearchOperations;
    
    // 平均价格聚合
    public Double getAveragePrice() {
        NativeSearchQuery query = new NativeSearchQueryBuilder()
            .withAggregations(AggregationBuilders.avg("avg_price").field("price"))
            .build();
        
        SearchHits<Product> searchHits = elasticsearchOperations.search(query, Product.class);
        
        return searchHits.getAggregations()
            .get("avg_price")
            .getValue();
    }
    
    // 分类统计
    public Map<String, Long> getCategoryStats() {
        NativeSearchQuery query = new NativeSearchQueryBuilder()
            .withAggregations(AggregationBuilders.terms("category_count").field("category"))
            .build();
        
        SearchHits<Product> searchHits = elasticsearchOperations.search(query, Product.class);
        
        Terms terms = searchHits.getAggregations().get("category_count");
        Map<String, Long> result = new HashMap<>();
        
        for (Terms.Bucket bucket : terms.getBuckets()) {
            result.put(bucket.getKeyAsString(), bucket.getDocCount());
        }
        
        return result;
    }
}
```

---

## 9 批量操作

### 批量保存

```java
@Service
public class ProductBatchService {
    
    @Autowired
    private ProductRepository productRepository;
    
    public void batchSave(List<Product> products) {
        // 方式 1：使用 saveAll
        productRepository.saveAll(products);
        
        // 方式 2：分批处理（推荐大数据量）
        int batchSize = 1000;
        for (int i = 0; i < products.size(); i += batchSize) {
            int end = Math.min(i + batchSize, products.size());
            List<Product> batch = products.subList(i, end);
            productRepository.saveAll(batch);
        }
    }
}
```

### 批量删除

```java
public void batchDelete(List<String> ids) {
    productRepository.deleteAllById(ids);
}

public void deleteByCategory(String category) {
    productRepository.deleteByCategory(category);
}
```

---

## 10 高级配置

### 自定义配置类

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.convert.ElasticsearchConverter;
import org.springframework.data.elasticsearch.core.mapping.SimpleElasticsearchMappingContext;

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.example.repository")
public class ElasticsearchConfig {
    
    // 自定义配置可以在这里添加
    // 通常使用 Spring Boot 自动配置即可
}
```

### 多索引配置

```java
@Document(indexName = "#{@indexNameProvider.indexName()}")
public class Product {
    // ...
}

@Component
public class IndexNameProvider {
    
    @Value("${elasticsearch.index.prefix:products}")
    private String prefix;
    
    public String indexName() {
        return prefix + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy.MM"));
    }
}
```

---

## 11 事务管理

### 使用 @Transactional

```java
@Service
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Transactional
    public void updateProduct(String id, Double newPrice) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setPrice(newPrice);
        productRepository.save(product);
        
        // 如果这里抛出异常，上面的保存会回滚
    }
}
```

---

## 12 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 依赖配置 | spring-boot-starter-data-elasticsearch |
| 实体映射 | @Document、@Id、@Field 注解 |
| Repository | 继承 ElasticsearchRepository |
| 声明式查询 | 方法名自动生成查询 |
| 自定义查询 | @Query 注解、ElasticsearchOperations |
| 聚合操作 | 使用 ElasticsearchOperations |
| 批量操作 | saveAll、deleteAllById |

---

## 13 新手常见误区

### 误区 1："Repository 方法名可以随意写"

**错！** 方法名必须遵循命名规则，Spring Data 才能正确解析。参考官方文档。

### 误区 2："所有查询都用 Repository 方法"

不是的。复杂查询建议使用 ElasticsearchOperations 或 @Query 注解，更灵活。

### 误区 3："不需要考虑事务"

虽然 Elasticsearch 本身不支持事务，但 Spring Data Elasticsearch 提供了事务支持，可以保证业务一致性。

---

## 14 动手练习

### 练习 1：基础 Repository

创建一个 ProductRepository，实现基础的 CRUD 操作。

<details>
<summary>点击查看答案</summary>

```java
@Repository
public interface ProductRepository extends ElasticsearchRepository<Product, String> {
    // 基础 CRUD 自动继承
}

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;
    
    public Product create(Product product) {
        return productRepository.save(product);
    }
    
    public Optional<Product> findById(String id) {
        return productRepository.findById(id);
    }
    
    public void delete(String id) {
        productRepository.deleteById(id);
    }
}
```

</details>

### 练习 2：声明式查询

实现根据名称、分类、价格范围的查询方法。

<details>
<summary>点击查看答案</summary>

```java
@Repository
public interface ProductRepository extends ElasticsearchRepository<Product, String> {
    List<Product> findByName(String name);
    List<Product> findByCategory(String category);
    List<Product> findByPriceBetween(Double minPrice, Double maxPrice);
    List<Product> findByNameAndCategory(String name, String category);
}
```

</details>

### 练习 3（挑战）：复杂搜索

使用 ElasticsearchOperations 实现一个复杂的搜索方法，支持关键词、分类、价格范围、分页。

<details>
<summary>点击查看答案</summary>

```java
@Service
public class ProductSearchService {
    
    @Autowired
    private ElasticsearchOperations elasticsearchOperations;
    
    public Page<Product> search(String keyword, String category, Double minPrice, Double maxPrice, Pageable pageable) {
        NativeSearchQuery query = new NativeSearchQueryBuilder()
            .withQuery(QueryBuilders.boolQuery()
                .must(QueryBuilders.multiMatchQuery(keyword, "name", "description"))
                .filter(QueryBuilders.termQuery("category", category))
                .filter(QueryBuilders.rangeQuery("price").gte(minPrice).lte(maxPrice))
            )
            .withPageable(pageable)
            .build();
        
        SearchHits<Product> searchHits = elasticsearchOperations.search(query, Product.class);
        
        List<Product> products = searchHits.getSearchHits().stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
        
        return new PageImpl<>(products, pageable, searchHits.getTotalHits());
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **综合实战项目**——也就是电商搜索系统、日志分析平台、全文检索应用。你会学到如何将 Elasticsearch 应用到真实项目中。
