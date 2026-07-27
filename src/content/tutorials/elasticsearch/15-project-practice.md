---
title: "第 15 章：综合实战项目"
description: "电商搜索系统、日志分析平台、全文检索应用"
---

# 第 15 章：综合实战项目

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Elasticsearch 在实际项目中如何应用？
- 电商搜索系统如何设计？
- 日志分析平台怎么搭建？
- 全文检索应用有哪些最佳实践？

这一章会通过三个实战项目，帮你掌握 Elasticsearch 的综合应用。这些是真实项目中最常见的场景。

---

## 1 项目一：电商搜索系统

### 项目背景

某电商平台需要实现商品搜索功能，要求：

- 支持关键词搜索（商品名称、描述）
- 支持分类筛选、价格范围筛选
- 支持按销量、价格、上架时间排序
- 搜索结果高亮显示
- 搜索建议（自动补全）

### 数据模型设计

```java
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
    
    @Field(type = FieldType.Integer)
    private Integer sales;
    
    @Field(type = FieldType.Keyword)
    private String status;  // 上架状态
    
    @Field(type = FieldType.Date)
    private LocalDateTime createdAt;
    
    @Field(type = FieldType.Keyword)
    private List<String> tags;  // 商品标签
    
    // getters and setters
}
```

### 搜索服务实现

```java
@Service
public class ProductSearchService {
    
    @Autowired
    private ElasticsearchOperations elasticsearchOperations;
    
    /**
     * 综合搜索
     */
    public Page<Product> search(ProductSearchRequest request) {
        // 构建查询
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();
        
        // 1. 关键词搜索
        if (StringUtils.hasText(request.getKeyword())) {
            boolQuery.must(m -> m
                .multiMatch(mm -> mm
                    .fields("name^3", "description^1", "tags^2")
                    .query(request.getKeyword())
                    .type(TextQueryType.BestFields)
                    .minimumShouldMatch("70%")
                )
            );
        }
        
        // 2. 分类筛选
        if (StringUtils.hasText(request.getCategory())) {
            boolQuery.filter(f -> f
                .term(t -> t
                    .field("category")
                    .value(request.getCategory())
                )
            );
        }
        
        // 3. 品牌筛选
        if (request.getBrands() != null && !request.getBrands().isEmpty()) {
            boolQuery.filter(f -> f
                .terms(t -> t
                    .field("brand")
                    .terms(terms -> terms.value(
                        request.getBrands().stream()
                            .map(FieldValue::of)
                            .collect(Collectors.toList())
                    ))
                )
            );
        }
        
        // 4. 价格范围
        if (request.getMinPrice() != null || request.getMaxPrice() != null) {
            boolQuery.filter(f -> f
                .range(r -> r
                    .number(n -> {
                        n.field("price");
                        if (request.getMinPrice() != null) n.gte(request.getMinPrice());
                        if (request.getMaxPrice() != null) n.lte(request.getMaxPrice());
                        return n;
                    })
                )
            );
        }
        
        // 5. 状态筛选（只搜索上架商品）
        boolQuery.filter(f -> f
            .term(t -> t
                .field("status")
                .value("active")
            )
        );
        
        // 构建搜索查询
        NativeSearchQuery query = new NativeSearchQueryBuilder()
            .withQuery(boolQuery.build()._toQuery())
            .withPageable(PageRequest.of(request.getPage(), request.getSize()))
            .build();
        
        // 6. 排序
        if (request.getSortBy() != null) {
            switch (request.getSortBy()) {
                case "price_asc":
                    query.addSort(Sort.by(Sort.Direction.ASC, "price"));
                    break;
                case "price_desc":
                    query.addSort(Sort.by(Sort.Direction.DESC, "price"));
                    break;
                case "sales_desc":
                    query.addSort(Sort.by(Sort.Direction.DESC, "sales"));
                    break;
                case "created_desc":
                    query.addSort(Sort.by(Sort.Direction.DESC, "createdAt"));
                    break;
                default:
                    // 默认按相关度排序
                    break;
            }
        }
        
        // 执行搜索
        SearchHits<Product> searchHits = elasticsearchOperations.search(query, Product.class);
        
        // 提取结果
        List<Product> products = searchHits.getSearchHits().stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
        
        return new PageImpl<>(products, query.getPageable(), searchHits.getTotalHits());
    }
}
```

### 搜索建议（自动补全）

```java
// 使用 Completion Suggester
@Document(indexName = "products")
public class Product {
    
    @Field(type = FieldType.Completion, analyzer = "ik_max_word")
    private CompletionField suggest;
    
    // 在保存时构建 suggest 字段
    @PrePersist
    public void buildSuggest() {
        List<String> inputs = new ArrayList<>();
        inputs.add(name);
        if (brand != null) {
            inputs.add(brand + " " + name);
        }
        if (tags != null) {
            inputs.addAll(tags);
        }
        
        this.suggest = new CompletionField(inputs);
    }
}

// 搜索建议服务
public List<String> getSuggestions(String prefix) {
    Suggester suggester = Suggester.builder()
        .completion(c -> c
            .field("suggest")
            .prefix(prefix)
            .size(10)
        )
        .build();
    
    NativeSearchQuery query = new NativeSearchQueryBuilder()
        .withSuggester(suggester)
        .build();
    
    SearchHits<Product> searchHits = elasticsearchOperations.search(query, Product.class);
    
    return searchHits.getSuggest().getSuggestions("suggest").stream()
        .flatMap(s -> s.getOptions().stream())
        .map(CompletionSuggestionOption::getText)
        .collect(Collectors.toList());
}
```

---

## 2 项目二：日志分析平台

### 项目背景

某公司需要搭建日志分析平台，要求：

- 收集应用日志
- 支持日志搜索和过滤
- 按时间范围查询
- 统计错误日志数量
- 日志可视化

### 索引设计

```java
@Document(indexName = "logs-#{T(java.time.LocalDate).now().format(T(java.time.format.DateTimeFormatter).ofPattern('yyyy.MM'))}")
public class LogEntry {
    
    @Id
    private String id;
    
    @Field(type = FieldType.Keyword)
    private String appName;  // 应用名称
    
    @Field(type = FieldType.Keyword)
    private String level;  // 日志级别：DEBUG, INFO, WARN, ERROR
    
    @Field(type = FieldType.Text, analyzer = "standard")
    private String message;  // 日志内容
    
    @Field(type = FieldType.Text)
    private String stackTrace;  // 异常堆栈
    
    @Field(type = FieldType.Keyword)
    private String threadName;  // 线程名
    
    @Field(type = FieldType.Keyword)
    private String className;  // 类名
    
    @Field(type = FieldType.Date)
    private LocalDateTime timestamp;  // 日志时间
    
    @Field(type = FieldType.Object)
    private Map<String, Object> extra;  // 扩展字段
    
    // getters and setters
}
```

### 日志搜索服务

```java
@Service
public class LogSearchService {
    
    @Autowired
    private ElasticsearchOperations elasticsearchOperations;
    
    /**
     * 搜索日志
     */
    public Page<LogEntry> searchLogs(LogSearchRequest request) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();
        
        // 1. 应用筛选
        if (StringUtils.hasText(request.getAppName())) {
            boolQuery.filter(f -> f
                .term(t -> t
                    .field("appName")
                    .value(request.getAppName())
                )
            );
        }
        
        // 2. 日志级别筛选
        if (request.getLevels() != null && !request.getLevels().isEmpty()) {
            boolQuery.filter(f -> f
                .terms(t -> t
                    .field("level")
                    .terms(terms -> terms.value(
                        request.getLevels().stream()
                            .map(FieldValue::of)
                            .collect(Collectors.toList())
                    ))
                )
            );
        }
        
        // 3. 时间范围
        if (request.getStartTime() != null || request.getEndTime() != null) {
            boolQuery.filter(f -> f
                .range(r -> r
                    .date(d -> {
                        d.field("timestamp");
                        if (request.getStartTime() != null) {
                            d.gte(JsonData.of(request.getStartTime()));
                        }
                        if (request.getEndTime() != null) {
                            d.lte(JsonData.of(request.getEndTime()));
                        }
                        return d;
                    })
                )
            );
        }
        
        // 4. 关键词搜索
        if (StringUtils.hasText(request.getKeyword())) {
            boolQuery.must(m -> m
                .multiMatch(mm -> mm
                    .fields("message", "stackTrace")
                    .query(request.getKeyword())
                )
            );
        }
        
        // 构建查询
        NativeSearchQuery query = new NativeSearchQueryBuilder()
            .withQuery(boolQuery.build()._toQuery())
            .withPageable(PageRequest.of(request.getPage(), request.getSize()))
            .withSort(Sort.by(Sort.Direction.DESC, "timestamp"))
            .build();
        
        // 执行搜索
        SearchHits<LogEntry> searchHits = elasticsearchOperations.search(query, LogEntry.class);
        
        List<LogEntry> logs = searchHits.getSearchHits().stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
        
        return new PageImpl<>(logs, query.getPageable(), searchHits.getTotalHits());
    }
    
    /**
     * 统计错误日志
     */
    public Map<String, Long> countErrorsByApp(LocalDateTime startTime, LocalDateTime endTime) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();
        
        // 只统计 ERROR 级别
        boolQuery.filter(f -> f
            .term(t -> t
                .field("level")
                .value("ERROR")
            )
        );
        
        // 时间范围
        boolQuery.filter(f -> f
            .range(r -> r
                .date(d -> d
                    .field("timestamp")
                    .gte(JsonData.of(startTime))
                    .lte(JsonData.of(endTime))
                )
            )
        );
        
        // 按应用分组统计
        NativeSearchQuery query = new NativeSearchQueryBuilder()
            .withQuery(boolQuery.build()._toQuery())
            .withAggregations(AggregationBuilders.terms("app_count")
                .field("appName")
                .size(100))
            .build();
        
        SearchHits<LogEntry> searchHits = elasticsearchOperations.search(query, LogEntry.class);
        
        Terms terms = searchHits.getAggregations().get("app_count");
        Map<String, Long> result = new HashMap<>();
        
        for (Terms.Bucket bucket : terms.getBuckets()) {
            result.put(bucket.getKeyAsString(), bucket.getDocCount());
        }
        
        return result;
    }
}
```

### 日志收集（使用 Logback）

```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="ELASTIC" class="co.elastic.logstash.appender.logback.ElasticsearchAppender">
        <hosts>localhost:9200</hosts>
        <index>logs</index>
        <type>log</type>
        <async>true</async>
    </appender>
    
    <root level="INFO">
        <appender-ref ref="ELASTIC" />
    </root>
</configuration>
```

---

## 3 项目三：全文检索应用

### 项目背景

某知识库系统需要实现全文检索，要求：

- 搜索文档内容（标题、正文）
- 支持文档分类筛选
- 搜索结果高亮
- 相关文档推荐

### 数据模型

```java
@Document(indexName = "documents")
public class Document {
    
    @Id
    private String id;
    
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String title;
    
    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String content;
    
    @Field(type = FieldType.Keyword)
    private String category;
    
    @Field(type = FieldType.Keyword)
    private List<String> tags;
    
    @Field(type = FieldType.Keyword)
    private String author;
    
    @Field(type = FieldType.Integer)
    private Integer viewCount;
    
    @Field(type = FieldType.Date)
    private LocalDateTime createdAt;
    
    @Field(type = FieldType.Date)
    private LocalDateTime updatedAt;
    
    // getters and setters
}
```

### 搜索服务（带高亮）

```java
@Service
public class DocumentSearchService {
    
    @Autowired
    private ElasticsearchOperations elasticsearchOperations;
    
    /**
     * 搜索文档（带高亮）
     */
    public List<DocumentSearchResult> searchWithHighlight(String keyword, String category) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();
        
        // 关键词搜索
        boolQuery.must(m -> m
            .multiMatch(mm -> mm
                .fields("title^3", "content^1", "tags^2")
                .query(keyword)
                .type(TextQueryType.BestFields)
            )
        );
        
        // 分类筛选
        if (StringUtils.hasText(category)) {
            boolQuery.filter(f -> f
                .term(t -> t
                    .field("category")
                    .value(category)
                )
            );
        }
        
        // 构建查询
        NativeSearchQuery query = new NativeSearchQueryBuilder()
            .withQuery(boolQuery.build()._toQuery())
            .withHighlightBuilder(new HighlightBuilder()
                .field("title")
                .field("content")
                .preTags("<em>")
                .postTags("</em>")
                .fragmentSize(150)
                .numOfFragments(3)
            )
            .build();
        
        // 执行搜索
        SearchHits<Document> searchHits = elasticsearchOperations.search(query, Document.class);
        
        // 提取结果和高亮
        return searchHits.getSearchHits().stream()
            .map(hit -> {
                DocumentSearchResult result = new DocumentSearchResult();
                result.setDocument(hit.getContent());
                result.setScore(hit.getScore());
                
                // 提取高亮
                Map<String, List<String>> highlights = hit.getHighlightFields();
                if (highlights.containsKey("title")) {
                    result.setHighlightedTitle(String.join(" ", highlights.get("title")));
                }
                if (highlights.containsKey("content")) {
                    result.setHighlightedContent(String.join("...", highlights.get("content")));
                }
                
                return result;
            })
            .collect(Collectors.toList());
    }
}

// 搜索结果 DTO
public class DocumentSearchResult {
    private Document document;
    private Float score;
    private String highlightedTitle;
    private String highlightedContent;
    
    // getters and setters
}
```

### 相关文档推荐

```java
/**
 * 推荐相关文档
 */
public List<Document> getRelatedDocuments(String documentId, int size) {
    // 获取当前文档
    Document currentDoc = elasticsearchOperations.get(documentId, Document.class);
    
    if (currentDoc == null) {
        return Collections.emptyList();
    }
    
    // 使用 more_like_this 查询
    NativeSearchQuery query = new NativeSearchQueryBuilder()
        .withQuery(q -> q
            .moreLikeThis(mlt -> mlt
                .fields("title", "content", "tags")
                .like(currentDoc.getTitle() + " " + String.join(" ", currentDoc.getTags()))
                .minTermFreq(1)
                .maxQueryTerms(12)
            )
        )
        .withFilter(QueryBuilders.boolQuery()
            .mustNot(QueryBuilders.termQuery("_id", documentId))  // 排除当前文档
        )
        .withPageable(PageRequest.of(0, size))
        .build();
    
    SearchHits<Document> searchHits = elasticsearchOperations.search(query, Document.class);
    
    return searchHits.getSearchHits().stream()
        .map(SearchHit::getContent)
        .collect(Collectors.toList());
}
```

---

## 4 项目部署与优化

### 索引优化

```java
// 生产环境索引配置
@Document(indexName = "products")
@Setting(shards = 5, replicas = 1, refreshInterval = "30s")
public class Product {
    // ...
}
```

### 批量导入数据

```java
@Service
public class DataImportService {
    
    @Autowired
    private ProductRepository productRepository;
    
    /**
     * 批量导入商品数据
     */
    public void importProducts(List<Product> products) {
        int batchSize = 1000;
        int total = products.size();
        int imported = 0;
        
        for (int i = 0; i < total; i += batchSize) {
            int end = Math.min(i + batchSize, total);
            List<Product> batch = products.subList(i, end);
            
            productRepository.saveAll(batch);
            imported += batch.size();
            
            System.out.println("Imported: " + imported + "/" + total);
        }
    }
}
```

### 性能监控

```java
@Component
public class ElasticsearchMonitor {
    
    @Autowired
    private ElasticsearchOperations elasticsearchOperations;
    
    /**
     * 获取索引统计信息
     */
    public Map<String, Object> getIndexStats(String indexName) {
        // 使用 ElasticsearchOperations 获取统计信息
        // 实际项目中可以使用 Cat API 或 Stats API
        Map<String, Object> stats = new HashMap<>();
        stats.put("indexName", indexName);
        stats.put("timestamp", System.currentTimeMillis());
        return stats;
    }
}
```

---

## 5 核心知识点总结

| 项目 | 关键技术 | 应用场景 |
|------|---------|---------|
| 电商搜索 | 多字段搜索、筛选、排序、高亮 | 商品搜索 |
| 日志分析 | 时间序列、聚合统计、批量写入 | 日志收集与分析 |
| 全文检索 | 高亮显示、相关推荐 | 知识库、文档搜索 |

---

## 6 新手常见误区

### 误区 1："一个索引可以解决所有问题"

**错！** 不同场景需要不同的索引设计。电商搜索需要多字段、日志需要时间序列。

### 误区 2："不需要考虑性能优化"

不是的。生产环境必须考虑批量写入、分页深度、缓存等性能问题。

### 误区 3："搜索功能越复杂越好"

搜索功能应该根据业务需求设计，过度复杂的搜索会影响性能和用户体验。

---

## 7 动手练习

### 练习 1：电商搜索

实现一个商品搜索接口，支持关键词搜索、分类筛选、价格范围、分页。

<details>
<summary>点击查看答案</summary>

```java
public Page<Product> searchProducts(String keyword, String category, Double minPrice, Double maxPrice, int page, int size) {
    BoolQuery.Builder boolQuery = new BoolQuery.Builder();
    
    if (StringUtils.hasText(keyword)) {
        boolQuery.must(m -> m
            .multiMatch(mm -> mm
                .fields("name^3", "description")
                .query(keyword)
            )
        );
    }
    
    if (StringUtils.hasText(category)) {
        boolQuery.filter(f -> f
            .term(t -> t.field("category").value(category))
        );
    }
    
    if (minPrice != null || maxPrice != null) {
        boolQuery.filter(f -> f
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
    
    NativeSearchQuery query = new NativeSearchQueryBuilder()
        .withQuery(boolQuery.build()._toQuery())
        .withPageable(PageRequest.of(page, size))
        .build();
    
    SearchHits<Product> searchHits = elasticsearchOperations.search(query, Product.class);
    
    List<Product> products = searchHits.getSearchHits().stream()
        .map(SearchHit::getContent)
        .collect(Collectors.toList());
    
    return new PageImpl<>(products, PageRequest.of(page, size), searchHits.getTotalHits());
}
```

</details>

### 练习 2：日志搜索

实现日志搜索接口，支持应用筛选、日志级别筛选、时间范围、关键词搜索。

<details>
<summary>点击查看答案</summary>

```java
public Page<LogEntry> searchLogs(String appName, List<String> levels, LocalDateTime startTime, LocalDateTime endTime, String keyword, int page, int size) {
    BoolQuery.Builder boolQuery = new BoolQuery.Builder();
    
    if (StringUtils.hasText(appName)) {
        boolQuery.filter(f -> f
            .term(t -> t.field("appName").value(appName))
        );
    }
    
    if (levels != null && !levels.isEmpty()) {
        boolQuery.filter(f -> f
            .terms(t -> t
                .field("level")
                .terms(terms -> terms.value(
                    levels.stream().map(FieldValue::of).collect(Collectors.toList())
                ))
            )
        );
    }
    
    if (startTime != null || endTime != null) {
        boolQuery.filter(f -> f
            .range(r -> r
                .date(d -> {
                    d.field("timestamp");
                    if (startTime != null) d.gte(JsonData.of(startTime));
                    if (endTime != null) d.lte(JsonData.of(endTime));
                    return d;
                })
            )
        );
    }
    
    if (StringUtils.hasText(keyword)) {
        boolQuery.must(m -> m
            .multiMatch(mm -> mm
                .fields("message", "stackTrace")
                .query(keyword)
            )
        );
    }
    
    NativeSearchQuery query = new NativeSearchQueryBuilder()
        .withQuery(boolQuery.build()._toQuery())
        .withPageable(PageRequest.of(page, size))
        .withSort(Sort.by(Sort.Direction.DESC, "timestamp"))
        .build();
    
    SearchHits<LogEntry> searchHits = elasticsearchOperations.search(query, LogEntry.class);
    
    List<LogEntry> logs = searchHits.getSearchHits().stream()
        .map(SearchHit::getContent)
        .collect(Collectors.toList());
    
    return new PageImpl<>(logs, PageRequest.of(page, size), searchHits.getTotalHits());
}
```

</details>

### 练习 3（挑战）：全文检索 + 高亮

实现文档搜索接口，支持关键词搜索、分类筛选、结果高亮。

<details>
<summary>点击查看答案</summary>

```java
public List<DocumentSearchResult> searchDocuments(String keyword, String category) {
    BoolQuery.Builder boolQuery = new BoolQuery.Builder();
    
    boolQuery.must(m -> m
        .multiMatch(mm -> mm
            .fields("title^3", "content^1", "tags^2")
            .query(keyword)
        )
    );
    
    if (StringUtils.hasText(category)) {
        boolQuery.filter(f -> f
            .term(t -> t.field("category").value(category))
        );
    }
    
    NativeSearchQuery query = new NativeSearchQueryBuilder()
        .withQuery(boolQuery.build()._toQuery())
        .withHighlightBuilder(new HighlightBuilder()
            .field("title")
            .field("content")
            .preTags("<em>")
            .postTags("</em>")
            .fragmentSize(150)
            .numOfFragments(3)
        )
        .build();
    
    SearchHits<Document> searchHits = elasticsearchOperations.search(query, Document.class);
    
    return searchHits.getSearchHits().stream()
        .map(hit -> {
            DocumentSearchResult result = new DocumentSearchResult();
            result.setDocument(hit.getContent());
            result.setScore(hit.getScore());
            
            Map<String, List<String>> highlights = hit.getHighlightFields();
            if (highlights.containsKey("title")) {
                result.setHighlightedTitle(String.join(" ", highlights.get("title")));
            }
            if (highlights.containsKey("content")) {
                result.setHighlightedContent(String.join("...", highlights.get("content")));
            }
            
            return result;
        })
        .collect(Collectors.toList());
}
```

</details>

---

## 下一章预告

下一章我们会学习 **最佳实践与总结**——也就是生产环境部署、安全配置、备份恢复、常见问题。你会学到如何在生产环境中稳定运行 Elasticsearch。
