---
title: "第七章：RAG 检索增强生成"
description: "使用 RAG 技术让 AI Agent 能够利用外部知识库回答问题"
---

# 第七章：RAG 检索增强生成

## 本章导读

在上一章中，我们学习了如何为 AI Agent 构建记忆系统。但有时候，我们需要 AI 回答一些特定领域的问题，比如公司的内部文档、产品手册、技术文档等。这些信息可能不在 AI 的训练数据中。

本章你将学习：
- 什么是 RAG（检索增强生成）？
- RAG 的工作原理是什么？
- 如何加载和解析各种格式的文档？
- 如何对文本进行分割和向量化？
- 如何实现完整的 RAG 流程？
- 如何在 Java 中实现 RAG 系统？

通过本章学习，你将让你的 AI Agent 能够利用外部知识库回答问题，就像"开卷考试"一样。

---

## 1 RAG 原理

### 1.1 什么是 RAG？

**RAG（Retrieval-Augmented Generation，检索增强生成）** 是一种结合检索和生成的技术，让 AI 在回答问题前先检索相关知识。

### 1.2 生活化类比：开卷考试 vs 闭卷考试

想象一下两种考试场景：

| 考试类型 | 特点 | 对应 AI |
|---------|------|--------|
| **闭卷考试** | 只能靠记忆回答 | 普通 LLM（只用训练数据） |
| **开卷考试** | 可以查阅资料回答 | RAG（可以检索知识库） |

**开卷考试的优势**：
- 可以回答训练数据中没有的问题
- 答案更准确，有依据
- 可以引用具体来源
- 知识可以实时更新

### 1.3 RAG 工作流程

```
用户提问 → 问题向量化 → 从知识库检索相关文档 → 构建 Prompt（问题+检索结果）→ LLM 生成答案
```

**详细步骤**：

1. **文档准备阶段**（离线）：
   - 加载文档（PDF、Word、网页等）
   - 文本分割（将长文档分成小块）
   - 向量化（将文本块转换为向量）
   - 存储到向量数据库

2. **问答阶段**（在线）：
   - 用户提问
   - 将问题向量化
   - 从向量数据库检索相关文本块
   - 将问题和检索结果一起发给 LLM
   - LLM 基于检索结果生成答案

### 1.4 RAG 的应用场景

| 场景 | 说明 | 例子 |
|-----|------|------|
| **企业知识库** | 回答公司内部问题 | HR 政策、IT 支持 |
| **客服系统** | 回答产品相关问题 | 产品使用、故障排查 |
| **法律助手** | 查询法律条文和案例 | 法律咨询、合同审查 |
| **医疗问答** | 查询医学文献和指南 | 症状分析、治疗建议 |
| **教育辅导** | 基于教材回答问题 | 作业辅导、知识查询 |

---

## 2 文档加载与解析

### 2.1 支持的文档格式

RAG 系统需要能够处理多种文档格式：

| 格式 | 说明 | 常用库 |
|-----|------|--------|
| **PDF** | 便携式文档 | Apache PDFBox |
| **Word** | Word 文档 | Apache POI |
| **HTML** | 网页内容 | Jsoup |
| **Markdown** | Markdown 文件 | 直接读取 |
| **TXT** | 纯文本 | 直接读取 |
| **DOCX** | Word 2007+ | Apache POI |

### 2.2 文档加载器接口

```java
// 文档加载器接口
public interface DocumentLoader {
    // 加载文档
    List<Document> load(String path) throws Exception;
    
    // 检查是否支持该格式
    boolean supports(String path);
}

// 文档类
public class Document {
    private final String content;      // 文档内容
    private final Map<String, Object> metadata;  // 元数据
    
    public Document(String content, Map<String, Object> metadata) {
        this.content = content;
        this.metadata = metadata != null ? metadata : new HashMap<>();
    }
    
    public String getContent() { return content; }
    public Map<String, Object> getMetadata() { return metadata; }
    
    // 添加元数据
    public Document withMetadata(String key, Object value) {
        metadata.put(key, value);
        return this;
    }
}
```

### 2.3 PDF 文档加载器

```java
// PDF 文档加载器
public class PdfDocumentLoader implements DocumentLoader {
    
    @Override
    public List<Document> load(String path) throws Exception {
        List<Document> documents = new ArrayList<>();
        
        // 使用 Apache PDFBox 读取 PDF
        try (PDDocument pdf = PDDocument.load(new File(path))) {
            // 创建文本提取器
            PDFTextStripper stripper = new PDFTextStripper();
            
            // 提取文本
            String content = stripper.getText(pdf);
            
            // 创建元数据
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("source", path);
            metadata.put("format", "pdf");
            metadata.put("pageCount", pdf.getNumberOfPages());
            metadata.put("title", pdf.getDocumentInformation().getTitle());
            metadata.put("author", pdf.getDocumentInformation().getAuthor());
            
            // 创建文档对象
            documents.add(new Document(content, metadata));
        }
        
        return documents;
    }
    
    @Override
    public boolean supports(String path) {
        return path.toLowerCase().endsWith(".pdf");
    }
}
```

### 2.4 Word 文档加载器

```java
// Word 文档加载器
public class WordDocumentLoader implements DocumentLoader {
    
    @Override
    public List<Document> load(String path) throws Exception {
        List<Document> documents = new ArrayList<>();
        
        // 使用 Apache POI 读取 Word 文档
        try (FileInputStream fis = new FileInputStream(path);
             XWPFDocument doc = new XWPFDocument(fis)) {
            
            // 提取段落文本
            StringBuilder content = new StringBuilder();
            for (XWPFParagraph paragraph : doc.getParagraphs()) {
                content.append(paragraph.getText()).append("\n");
            }
            
            // 提取表格文本
            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        content.append(cell.getText()).append("\t");
                    }
                    content.append("\n");
                }
            }
            
            // 创建元数据
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("source", path);
            metadata.put("format", "docx");
            metadata.put("paragraphCount", doc.getParagraphs().size());
            
            // 创建文档对象
            documents.add(new Document(content.toString(), metadata));
        }
        
        return documents;
    }
    
    @Override
    public boolean supports(String path) {
        return path.toLowerCase().endsWith(".docx") || 
               path.toLowerCase().endsWith(".doc");
    }
}
```

### 2.5 HTML 文档加载器

```java
// HTML 文档加载器
public class HtmlDocumentLoader implements DocumentLoader {
    
    @Override
    public List<Document> load(String path) throws Exception {
        List<Document> documents = new ArrayList<>();
        
        // 使用 Jsoup 解析 HTML
        File input = new File(path);
        Document doc = Jsoup.parse(input, "UTF-8");
        
        // 提取标题
        String title = doc.title();
        
        // 提取正文内容（移除脚本和样式）
        doc.select("script, style").remove();
        String content = doc.body() != null ? doc.body().text() : doc.text();
        
        // 清理空白
        content = content.replaceAll("\\s+", " ").trim();
        
        // 创建元数据
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("source", path);
        metadata.put("format", "html");
        metadata.put("title", title);
        
        // 创建文档对象
        documents.add(new Document(content, metadata));
        
        return documents;
    }
    
    @Override
    public boolean supports(String path) {
        return path.toLowerCase().endsWith(".html") || 
               path.toLowerCase().endsWith(".htm");
    }
}
```

### 2.6 文档加载器工厂

```java
// 文档加载器工厂
public class DocumentLoaderFactory {
    private static final List<DocumentLoader> loaders = new ArrayList<>();
    
    static {
        // 注册所有加载器
        loaders.add(new PdfDocumentLoader());
        loaders.add(new WordDocumentLoader());
        loaders.add(new HtmlDocumentLoader());
        loaders.add(new TextDocumentLoader());
    }
    
    // 获取合适的加载器
    public static DocumentLoader getLoader(String path) {
        return loaders.stream()
            .filter(loader -> loader.supports(path))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("不支持的文件格式: " + path));
    }
    
    // 加载文档
    public static List<Document> loadDocuments(String path) throws Exception {
        DocumentLoader loader = getLoader(path);
        return loader.load(path);
    }
    
    // 批量加载目录
    public static List<Document> loadDirectory(String dirPath) throws Exception {
        List<Document> documents = new ArrayList<>();
        File dir = new File(dirPath);
        
        // 遍历目录
        for (File file : dir.listFiles()) {
            if (file.isFile()) {
                try {
                    documents.addAll(loadDocuments(file.getPath()));
                } catch (Exception e) {
                    System.err.println("加载失败: " + file.getPath() + " - " + e.getMessage());
                }
            }
        }
        
        return documents;
    }
}

// 纯文本加载器
public class TextDocumentLoader implements DocumentLoader {
    @Override
    public List<Document> load(String path) throws Exception {
        String content = new String(Files.readAllBytes(Paths.get(path)), StandardCharsets.UTF_8);
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("source", path);
        metadata.put("format", "txt");
        return List.of(new Document(content, metadata));
    }
    
    @Override
    public boolean supports(String path) {
        return path.toLowerCase().endsWith(".txt") || 
               path.toLowerCase().endsWith(".md");
    }
}
```

---

## 3 文本分割策略

### 3.1 为什么需要文本分割？

- LLM 有上下文长度限制
- 小块文本更容易检索到精确内容
- 提高检索效率和准确性

### 3.2 分割策略对比

| 策略 | 说明 | 优点 | 缺点 |
|-----|------|------|------|
| **固定大小** | 按字符数分割 | 简单 | 可能切断句子 |
| **按句子** | 按句子边界分割 | 保持语义完整 | 句子长度不一 |
| **按段落** | 按段落分割 | 语义完整 | 段落大小差异大 |
| **递归分割** | 多级分割 | 灵活 | 实现复杂 |
| **语义分割** | 按语义边界 | 效果最好 | 需要额外模型 |

### 3.3 固定大小分割器

```java
// 固定大小文本分割器
public class FixedSizeTextSplitter implements TextSplitter {
    private final int chunkSize;      // 块大小（字符数）
    private final int chunkOverlap;   // 重叠大小
    
    public FixedSizeTextSplitter(int chunkSize, int chunkOverlap) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
    }
    
    @Override
    public List<String> split(String text) {
        List<String> chunks = new ArrayList<>();
        int start = 0;
        
        while (start < text.length()) {
            // 计算结束位置
            int end = Math.min(start + chunkSize, text.length());
            
            // 添加块
            chunks.add(text.substring(start, end));
            
            // 移动起始位置（考虑重叠）
            start = end - chunkOverlap;
            
            // 防止死循环
            if (start >= end) {
                break;
            }
        }
        
        return chunks;
    }
}

// 使用示例
TextSplitter splitter = new FixedSizeTextSplitter(1000, 200);
List<String> chunks = splitter.split(longText);
```

### 3.4 按句子分割器

```java
// 按句子分割器
public class SentenceTextSplitter implements TextSplitter {
    private final int maxChunkSize;  // 最大块大小
    
    public SentenceTextSplitter(int maxChunkSize) {
        this.maxChunkSize = maxChunkSize;
    }
    
    @Override
    public List<String> split(String text) {
        List<String> chunks = new ArrayList<>();
        
        // 按句子分割（支持中英文）
        List<String> sentences = splitIntoSentences(text);
        
        StringBuilder currentChunk = new StringBuilder();
        
        for (String sentence : sentences) {
            // 如果当前块加上新句子会超出限制
            if (currentChunk.length() + sentence.length() > maxChunkSize) {
                // 保存当前块
                if (currentChunk.length() > 0) {
                    chunks.add(currentChunk.toString().trim());
                    currentChunk = new StringBuilder();
                }
                
                // 如果单个句子就超出限制，直接添加
                if (sentence.length() > maxChunkSize) {
                    chunks.add(sentence.trim());
                    continue;
                }
            }
            
            // 添加句子到当前块
            currentChunk.append(sentence).append(" ");
        }
        
        // 添加最后一块
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }
        
        return chunks;
    }
    
    // 分割成句子
    private List<String> splitIntoSentences(String text) {
        List<String> sentences = new ArrayList<>();
        
        // 使用正则表达式分割句子
        // 支持中文句号、问号、感叹号，以及英文句号、问号、感叹号
        Pattern pattern = Pattern.compile("[^.!。！？\\n]+[.!。！？\\n]?");
        Matcher matcher = pattern.matcher(text);
        
        while (matcher.find()) {
            String sentence = matcher.group().trim();
            if (!sentence.isEmpty()) {
                sentences.add(sentence);
            }
        }
        
        return sentences;
    }
}
```

### 3.5 递归分割器

```java
// 递归文本分割器
public class RecursiveTextSplitter implements TextSplitter {
    private final int chunkSize;
    private final int chunkOverlap;
    private final List<String> separators;  // 分隔符列表
    
    public RecursiveTextSplitter(int chunkSize, int chunkOverlap) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
        // 分隔符优先级：段落 > 句子 > 单词
        this.separators = Arrays.asList("\n\n", "\n", "。", ".", "！", "!", "？", "?", "；", ";", " ", "");
    }
    
    @Override
    public List<String> split(String text) {
        return splitText(text, separators);
    }    
    private List<String> splitText(String text, List<String> separators) {
        List<String> chunks = new ArrayList<>();
        
        // 如果文本足够小，直接返回
        if (text.length() <= chunkSize) {
            chunks.add(text);
            return chunks;
        }
        
        // 找到合适的分隔符
        String separator = separators.get(separators.size() - 1);  // 默认最后一个
        for (String sep : separators) {
            if (text.contains(sep)) {
                separator = sep;
                break;
            }
        }
        
        // 按分隔符分割
        String[] parts = text.split(Pattern.quote(separator));
        
        StringBuilder currentChunk = new StringBuilder();
        
        for (String part : parts) {
            // 如果当前块加上新部分会超出限制
            if (currentChunk.length() + part.length() > chunkSize) {
                // 保存当前块
                if (currentChunk.length() > 0) {
                    String chunk = currentChunk.toString().trim();
                    if (!chunk.isEmpty()) {
                        chunks.add(chunk);
                    }
                    currentChunk = new StringBuilder();
                }
                
                // 如果单个部分还超出限制，递归分割
                if (part.length() > chunkSize) {
                    int sepIndex = separators.indexOf(separator);
                    if (sepIndex < separators.size() - 1) {
                        List<String> subChunks = splitText(part, separators.subList(sepIndex + 1, separators.size()));
                        chunks.addAll(subChunks);
                    } else {
                        // 已经是最后一个分隔符，直接截断
                        chunks.add(part.substring(0, chunkSize));
                    }
                }
            }
            
            // 添加部分到当前块
            if (currentChunk.length() > 0) {
                currentChunk.append(separator);
            }
            currentChunk.append(part);
        }
        
        // 添加最后一块
        if (currentChunk.length() > 0) {
            String chunk = currentChunk.toString().trim();
            if (!chunk.isEmpty()) {
                chunks.add(chunk);
            }
        }
        
        return chunks;
    }
}
```

### 3.6 文本分割器接口

```java
// 文本分割器接口
public interface TextSplitter {
    // 分割文本
    List<String> split(String text);
    
    // 分割文档
    default List<Document> splitDocuments(List<Document> documents) {
        List<Document> chunks = new ArrayList<>();
        
        for (Document doc : documents) {
            List<String> texts = split(doc.getContent());
            
            for (int i = 0; i < texts.size(); i++) {
                Map<String, Object> metadata = new HashMap<>(doc.getMetadata());
                metadata.put("chunkIndex", i);
                metadata.put("totalChunks", texts.size());
                chunks.add(new Document(texts.get(i), metadata));
            }
        }
        
        return chunks;
    }
}
```

---

## 4 Embedding 模型选择

### 4.1 常用 Embedding 模型

| 模型 | 提供商 | 维度 | 特点 |
|-----|-------|------|------|
| **text-embedding-ada-002** | OpenAI | 1536 | 通用，效果好 |
| **text-embedding-3-small** | OpenAI | 1536 | 快速，低成本 |
| **text-embedding-3-large** | OpenAI | 3072 | 高精度 |
| **bge-large-zh** | BAAI | 1024 | 中文优化 |
| **m3e-base** | Moka AI | 768 | 中文开源 |
| **text2vec-large-chinese** | shibing624 | 1024 | 中文优化 |

### 4.2 模型选择建议

| 场景 | 推荐模型 | 原因 |
|-----|---------|------|
| **中文为主** | bge-large-zh | 中文效果最好 |
| **多语言** | text-embedding-3-large | 支持多语言 |
| **成本敏感** | text-embedding-3-small | 成本低 |
| **开源部署** | m3e-base | 可以本地部署 |
| **高精度** | text-embedding-3-large | 精度最高 |

### 4.3 Java 实现 Embedding 服务

```java
// Embedding 服务
public class EmbeddingService {
    private final OpenAiClient client;
    private final String model;
    
    public EmbeddingService(String apiKey, String model) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
        this.model = model;
    }
    
    // 单个文本向量化
    public float[] embed(String text) {
        EmbeddingRequest request = EmbeddingRequest.builder()
            .model(model)
            .input(List.of(text))
            .build();
        
        EmbeddingResponse response = client.embedding(request);
        List<Double> embedding = response.getData().get(0).getEmbedding();
        
        return toFloatArray(embedding);
    }
    
    // 批量向量化
    public List<float[]> embedBatch(List<String> texts, int batchSize) {
        List<float[]> results = new ArrayList<>();
        
        // 分批处理
        for (int i = 0; i < texts.size(); i += batchSize) {
            int end = Math.min(i + batchSize, texts.size());
            List<String> batch = texts.subList(i, end);
            
            EmbeddingRequest request = EmbeddingRequest.builder()
                .model(model)
                .input(batch)
                .build();
            
            EmbeddingResponse response = client.embedding(request);
            
            for (EmbeddingData data : response.getData()) {
                results.add(toFloatArray(data.getEmbedding()));
            }
        }
        
        return results;
    }
    
    // 转换为 float 数组
    private float[] toFloatArray(List<Double> doubles) {
        float[] floats = new float[doubles.size()];
        for (int i = 0; i < doubles.size(); i++) {
            floats[i] = doubles.get(i).floatValue();
        }
        return floats;
    }
}
```

---

## 5 向量存储与检索

### 5.1 向量数据库对比

| 数据库 | 部署方式 | 特点 | 适用场景 |
|-------|---------|------|---------|
| **Milvus** | 自托管/云 | 高性能、分布式 | 大规模生产 |
| **Chroma** | 本地/服务器 | 轻量、易用 | 快速开发 |
| **Pinecone** | 云托管 | 免运维 | 不想维护基础设施 |
| **Weaviate** | 自托管/云 | 功能丰富 | 复杂搜索需求 |
| **Qdrant** | 自托管 | Rust 实现、高性能 | 高性能需求 |
| **FAISS** | 本地 | Facebook 开源、快速 | 研究和原型 |

### 5.2 向量存储接口

```java
// 向量存储接口
public interface VectorStore {
    // 添加单个文档
    void add(Document document);
    
    // 批量添加
    void add(List<Document> documents);
    
    // 相似度搜索
    List<Document> search(float[] queryVector, int topK);
    
    // 带过滤的搜索
    List<Document> search(float[] queryVector, int topK, Map<String, Object> filters);
    
    // 删除
    void delete(String id);
    
    // 清空
    void clear();
}
```

### 5.3 Milvus 实现

```java
// Milvus 向量存储
public class MilvusVectorStore implements VectorStore {
    private final MilvusServiceClient client;
    private final String collectionName;
    private final EmbeddingService embeddingService;
    
    public MilvusVectorStore(String host, int port, String collectionName, 
                             EmbeddingService embeddingService) {
        ConnectParam connectParam = ConnectParam.newBuilder()
            .withHost(host)
            .withPort(port)
            .build();
        this.client = new MilvusServiceClient(connectParam);
        this.collectionName = collectionName;
        this.embeddingService = embeddingService;
    }
    
    @Override
    public void add(Document document) {
        // 生成向量
        float[] vector = embeddingService.embed(document.getContent());
        
        // 构建插入数据
        List<JsonObject> rows = new ArrayList<>();
        JsonObject row = new JsonObject();
        row.addProperty("id", UUID.randomUUID().toString());
        row.addProperty("content", document.getContent());
        row.addProperty("metadata", new Gson().toJson(document.getMetadata()));
        
        // 添加向量
        JsonArray vectorArray = new JsonArray();
        for (float v : vector) {
            vectorArray.add(v);
        }
        row.add("vector", vectorArray);
        
        rows.add(row);
        
        // 插入
        client.insert(InsertParam.newBuilder()
            .withCollectionName(collectionName)
            .withRows(rows)
            .build());
    }
    
    @Override
    public List<Document> search(float[] queryVector, int topK) {
        // 构建搜索参数
        List<String> outputFields = Arrays.asList("id", "content", "metadata");
        
        JsonObject searchParams = new JsonObject();
        searchParams.addProperty("nprobe", 10);
        
        // 执行搜索
        SearchResult result = client.search(SearchParam.newBuilder()
            .withCollectionName(collectionName)
            .withMetricType(MetricType.COSINE)
            .withOutFields(outputFields)
            .withTopK(topK)
            .withVectors(Collections.singletonList(queryVector))
            .withVectorFieldName("vector")
            .withParams(searchParams.toString())
            .build());
        
        // 解析结果
        List<Document> documents = new ArrayList<>();
        SearchResultWrapper wrapper = result.getResult();
        
        for (int i = 0; i < wrapper.getRowCount(); i++) {
            String content = (String) wrapper.get("content").get(i);
            String metadataJson = (String) wrapper.get("metadata").get(i);
            
            Map<String, Object> metadata = new Gson().fromJson(metadataJson, Map.class);
            documents.add(new Document(content, metadata));
        }
        
        return documents;
    }
    
    // 其他方法实现...
}
```

### 5.4 简单的内存向量存储

```java
// 内存向量存储（适合开发和测试）
public class InMemoryVectorStore implements VectorStore {
    private final List<StoredDocument> documents = new CopyOnWriteArrayList<>();
    private final EmbeddingService embeddingService;
    
    public InMemoryVectorStore(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }
    
    @Override
    public void add(Document document) {
        // 生成向量
        float[] vector = embeddingService.embed(document.getContent());
        documents.add(new StoredDocument(document, vector));
    }
    
    @Override
    public void add(List<Document> docs) {
        // 批量生成向量
        List<String> texts = docs.stream()
            .map(Document::getContent)
            .collect(Collectors.toList());
        List<float[]> vectors = embeddingService.embedBatch(texts, 100);
        
        // 存储
        for (int i = 0; i < docs.size(); i++) {
            documents.add(new StoredDocument(docs.get(i), vectors.get(i)));
        }
    }
    
    @Override
    public List<Document> search(float[] queryVector, int topK) {
        return documents.parallelStream()
            .map(doc -> new ScoredDocument(doc.document, 
                cosineSimilarity(queryVector, doc.vector)))
            .sorted((a, b) -> Double.compare(b.score, a.score))
            .limit(topK)
            .map(sd -> sd.document)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Document> search(float[] queryVector, int topK, Map<String, Object> filters) {
        return documents.parallelStream()
            .filter(doc -> matchFilters(doc.document.getMetadata(), filters))
            .map(doc -> new ScoredDocument(doc.document, 
                cosineSimilarity(queryVector, doc.vector)))
            .sorted((a, b) -> Double.compare(b.score, a.score))
            .limit(topK)
            .map(sd -> sd.document)
            .collect(Collectors.toList());
    }
    
    @Override
    public void delete(String id) {
        documents.removeIf(doc -> doc.document.getMetadata().get("id").equals(id));
    }
    
    @Override
    public void clear() {
        documents.clear();
    }
    
    // 余弦相似度
    private double cosineSimilarity(float[] a, float[] b) {
        double dotProduct = 0;
        double normA = 0;
        double normB = 0;
        
        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        if (normA == 0 || normB == 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    // 过滤匹配
    private boolean matchFilters(Map<String, Object> metadata, Map<String, Object> filters) {
        for (Map.Entry<String, Object> entry : filters.entrySet()) {
            Object value = metadata.get(entry.getKey());
            if (value == null || !value.equals(entry.getValue())) {
                return false;
            }
        }
        return true;
    }
    
    // 存储的文档
    private static class StoredDocument {
        final Document document;
        final float[] vector;
        
        StoredDocument(Document document, float[] vector) {
            this.document = document;
            this.vector = vector;
        }
    }
    
    // 带分数的文档
    private static class ScoredDocument {
        final Document document;
        final double score;
        
        ScoredDocument(Document document, double score) {
            this.document = document;
            this.score = score;
        }
    }
}
```

---

## 6 上下文注入与 Prompt 构建

### 6.1 RAG Prompt 模板

```java
// RAG Prompt 构建器
public class RagPromptBuilder {
    
    // 构建 RAG Prompt
    public String buildPrompt(String question, List<Document> context) {
        StringBuilder prompt = new StringBuilder();
        
        // 系统指令
        prompt.append("你是一个知识渊博的助手。请根据以下参考资料回答用户的问题。\n");
        prompt.append("如果参考资料中没有相关信息，请说明你不知道，不要编造答案。\n\n");
        
        // 添加参考资料
        prompt.append("参考资料：\n");
        prompt.append("==================\n");
        
        for (int i = 0; i < context.size(); i++) {
            Document doc = context.get(i);
            prompt.append("【资料 ").append(i + 1).append("】\n");
            prompt.append(doc.getContent()).append("\n");
            
            // 添加来源信息
            Map<String, Object> metadata = doc.getMetadata();
            if (metadata.containsKey("source")) {
                prompt.append("来源: ").append(metadata.get("source")).append("\n");
            }
            prompt.append("------------------\n");
        }
        
        // 用户问题
        prompt.append("==================\n\n");
        prompt.append("问题: ").append(question).append("\n\n");
        prompt.append("请基于以上参考资料回答:");
        
        return prompt.toString();
    }
    
    // 构建带引用的 Prompt
    public String buildPromptWithCitation(String question, List<Document> context) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("你是一个知识渊博的助手。请根据以下参考资料回答用户的问题。\n");
        prompt.append("要求：\n");
        prompt.append("1. 如果参考资料中没有相关信息，请说明你不知道\n");
        prompt.append("2. 回答时请标注信息来源，例如 [资料1]\n");
        prompt.append("3. 尽量简洁明了\n\n");
        
        // 添加参考资料（同上）
        // ...
        
        return prompt.toString();
    }
}
```

### 6.2 上下文压缩

当检索结果太多时，需要压缩上下文：

```java
// 上下文压缩器
public class ContextCompressor {
    private final OpenAiClient client;
    
    public ContextCompressor(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    // 压缩上下文
    public String compress(List<Document> documents, String question) {
        // 构建待压缩文本
        StringBuilder text = new StringBuilder();
        for (Document doc : documents) {
            text.append(doc.getContent()).append("\n\n");
        }
        
        // 调用 AI 压缩
        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model("gpt-3.5-turbo")
            .messages(List.of(
                Message.system("请提取以下文本中与问题相关的关键信息，去除冗余内容："),
                Message.user("问题: " + question + "\n\n文本:\n" + text.toString())
            ))
            .build();
        
        ChatCompletionResponse response = client.chatCompletion(request);
        return response.getChoices().get(0).getMessage().getContent();
    }
}
```

---

## 7 Java 实现完整 RAG 流程

### 7.1 RAG 系统主类

```java
// RAG 系统
public class RagSystem {
    private final DocumentLoaderFactory loaderFactory;
    private final TextSplitter textSplitter;
    private final EmbeddingService embeddingService;
    private final VectorStore vectorStore;
    private final OpenAiClient llmClient;
    private final RagPromptBuilder promptBuilder;
    
    public RagSystem(String apiKey, VectorStore vectorStore) {
        this.loaderFactory = new DocumentLoaderFactory();
        this.textSplitter = new RecursiveTextSplitter(1000, 200);
        this.embeddingService = new EmbeddingService(apiKey, "text-embedding-ada-002");
        this.vectorStore = vectorStore;
        this.llmClient = OpenAiClient.builder().apiKey(apiKey).build();
        this.promptBuilder = new RagPromptBuilder();
    }
    
    // 索引文档（离线处理）
    public void indexDocuments(String path) throws Exception {
        System.out.println("开始索引文档: " + path);
        
        // 1. 加载文档
        List<Document> documents = DocumentLoaderFactory.loadDocuments(path);
        System.out.println("加载了 " + documents.size() + " 个文档");
        
        // 2. 分割文本
        List<Document> chunks = textSplitter.splitDocuments(documents);
        System.out.println("分割成 " + chunks.size() + " 个文本块");
        
        // 3. 存储到向量数据库
        vectorStore.add(chunks);
        System.out.println("索引完成");
    }
    
    // 索引目录
    public void indexDirectory(String dirPath) throws Exception {
        File dir = new File(dirPath);
        for (File file : dir.listFiles()) {
            if (file.isFile()) {
                try {
                    indexDocuments(file.getPath());
                } catch (Exception e) {
                    System.err.println("索引失败: " + file.getPath() + " - " + e.getMessage());
                }
            }
        }
    }
    
    // 问答（在线处理）
    public String ask(String question) {
        System.out.println("问题: " + question);
        
        // 1. 将问题向量化
        float[] queryVector = embeddingService.embed(question);
        
        // 2. 检索相关文档
        List<Document> relevantDocs = vectorStore.search(queryVector, 5);
        System.out.println("检索到 " + relevantDocs.size() + " 个相关文档");
        
        // 3. 构建 Prompt
        String prompt = promptBuilder.buildPrompt(question, relevantDocs);
        
        // 4. 调用 LLM 生成答案
        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model("gpt-4")
            .messages(List.of(Message.user(prompt)))
            .temperature(0.7)
            .build();
        
        ChatCompletionResponse response = llmClient.chatCompletion(request);
        String answer = response.getChoices().get(0).getMessage().getContent();
        
        System.out.println("答案: " + answer);
        return answer;
    }
    
    // 带来源的问答
    public RagResult askWithSources(String question) {
        // 1. 向量化问题
        float[] queryVector = embeddingService.embed(question);
        
        // 2. 检索
        List<Document> relevantDocs = vectorStore.search(queryVector, 5);
        
        // 3. 构建 Prompt
        String prompt = promptBuilder.buildPromptWithCitation(question, relevantDocs);
        
        // 4. 生成答案
        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model("gpt-4")
            .messages(List.of(Message.user(prompt)))
            .build();
        
        ChatCompletionResponse response = llmClient.chatCompletion(request);
        String answer = response.getChoices().get(0).getMessage().getContent();
        
        // 5. 构建结果
        List<Source> sources = relevantDocs.stream()
            .map(doc -> new Source(
                doc.getContent().substring(0, Math.min(200, doc.getContent().length())),
                (String) doc.getMetadata().get("source")
            ))
            .collect(Collectors.toList());
        
        return new RagResult(answer, sources);
    }
    
    // RAG 结果
    public static class RagResult {
        private final String answer;
        private final List<Source> sources;
        
        public RagResult(String answer, List<Source> sources) {
            this.answer = answer;
            this.sources = sources;
        }
        
        public String getAnswer() { return answer; }
        public List<Source> getSources() { return sources; }
    }
    
    // 来源
    public static class Source {
        private final String content;
        private final String source;
        
        public Source(String content, String source) {
            this.content = content;
            this.source = source;
        }
        
        public String getContent() { return content; }
        public String getSource() { return source; }
    }
}
```

### 7.2 使用示例

```java
// 主程序
public class Main {
    public static void main(String[] args) throws Exception {
        // 创建 RAG 系统
        EmbeddingService embeddingService = new EmbeddingService("api-key", "text-embedding-ada-002");
        VectorStore vectorStore = new InMemoryVectorStore(embeddingService);
        RagSystem ragSystem = new RagSystem("api-key", vectorStore);
        
        // 索引文档
        ragSystem.indexDirectory("./documents");
        
        // 问答
        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.print("\n请输入问题（输入 exit 退出）: ");
            String question = scanner.nextLine();
            
            if ("exit".equals(question)) {
                break;
            }
            
            RagSystem.RagResult result = ragSystem.askWithSources(question);
            System.out.println("\n答案: " + result.getAnswer());
            System.out.println("\n参考来源:");
            for (int i = 0; i < result.getSources().size(); i++) {
                RagSystem.Source source = result.getSources().get(i);
                System.out.println((i + 1) + ". " + source.getSource());
                System.out.println("   " + source.getContent() + "...");
            }
        }
    }
}
```

### 7.3 高级功能：多轮对话 RAG

```java
// 多轮对话 RAG
public class ConversationalRag {
    private final RagSystem ragSystem;
    private final List<Message> conversationHistory = new ArrayList<>();
    
    public ConversationalRag(RagSystem ragSystem) {
        this.ragSystem = ragSystem;
    }
    
    // 对话
    public String chat(String userInput) {
        // 1. 改写问题（考虑上下文）
        String rewrittenQuestion = rewriteQuestion(userInput);
        
        // 2. 使用 RAG 回答
        String answer = ragSystem.ask(rewrittenQuestion);
        
        // 3. 更新对话历史
        conversationHistory.add(Message.user(userInput));
        conversationHistory.add(Message.assistant(answer));
        
        return answer;
    }
    
    // 改写问题
    private String rewriteQuestion(String question) {
        if (conversationHistory.isEmpty()) {
            return question;
        }
        
        // 构建对话上下文
        StringBuilder context = new StringBuilder();
        for (Message msg : conversationHistory) {
            context.append(msg.getRole()).append(": ").append(msg.getContent()).append("\n");
        }
        
        // 调用 LLM 改写问题
        // ... 实现略
        
        return question;  // 简化版，实际应该改写
    }
    
    // 清空对话历史
    public void clearHistory() {
        conversationHistory.clear();
    }
}
```

---

## 8 对比表格

### 8.1 RAG vs 微调

| 特性 | RAG | 微调 |
|-----|-----|------|
| **知识更新** | 实时更新 | 需要重新训练 |
| **成本** | 检索成本 | 训练成本 |
| **可解释性** | 可追溯来源 | 黑盒 |
| **适用场景** | 知识问答 | 风格调整 |
| **数据需求** | 文档即可 | 需要标注数据 |
| **幻觉问题** | 可缓解 | 可能加剧 |

### 8.2 文本分割策略对比

| 策略 | 效果 | 速度 | 适用场景 |
|-----|------|------|---------|
| **固定大小** | 一般 | 快 | 简单场景 |
| **按句子** | 较好 | 快 | 对话文本 |
| **按段落** | 好 | 快 | 结构化文档 |
| **递归分割** | 很好 | 中 | 通用场景 |
| **语义分割** | 最好 | 慢 | 高精度需求 |

---

## 9 新手常见误区

### 误区 1：文本块越大越好

**错误想法**：块越大，上下文越完整。

**正确做法**：块太大会降低检索精度，需要平衡。

```java
// ❌ 块太大
TextSplitter splitter = new FixedSizeTextSplitter(10000, 0);  // 10000 字符

// ✅ 合理大小
TextSplitter splitter = new RecursiveTextSplitter(1000, 200);  // 1000 字符
```

### 误区 2：检索越多越好

**错误想法**：检索 20 个文档给 AI 参考。

**正确做法**：太多会超出上下文限制，一般 3-5 个即可。

```java
// ❌ 检索太多
List<Document> docs = vectorStore.search(query, 20);

// ✅ 适量检索
List<Document> docs = vectorStore.search(query, 5);
```

### 误区 3：忽略文档质量

**错误想法**：把所有文档都扔进去。

**正确做法**：垃圾进垃圾出，需要清洗和筛选文档。

```java
// ❌ 不清洗
documents.addAll(rawDocuments);

// ✅ 清洗和筛选
documents = rawDocuments.stream()
    .filter(doc -> doc.getContent().length() > 100)  // 过滤太短的
    .map(doc -> cleanText(doc))  // 清洗文本
    .collect(Collectors.toList());
```

### 误区 4：Embedding 模型不重要

**错误想法**：随便用一个 Embedding 模型。

**正确做法**：Embedding 模型直接影响检索效果，需要选择适合的。

```java
// ❌ 中文用英文模型
EmbeddingService service = new EmbeddingService(apiKey, "text-embedding-ada-002");

// ✅ 中文用中文优化模型
EmbeddingService service = new EmbeddingService(apiKey, "bge-large-zh");
```

### 误区 5：RAG 可以完全替代微调

**错误想法**：有了 RAG 就不需要微调了。

**正确做法**：RAG 和微调各有用途，可以结合使用。

```java
// RAG 适合：知识问答、实时更新
// 微调适合：风格调整、特定任务
// 结合使用：微调模型 + RAG 知识
```

---

## 10 动手练习

### 练习 1：实现 PDF 文档加载器

实现一个 PDF 文档加载器，能够提取文本和元数据。

<details>
<summary>点击查看答案</summary>

```java
// PDF 文档加载器
public class PdfDocumentLoader implements DocumentLoader {
    
    @Override
    public List<Document> load(String path) throws Exception {
        List<Document> documents = new ArrayList<>();
        
        try (PDDocument pdf = PDDocument.load(new File(path))) {
            PDFTextStripper stripper = new PDFTextStripper();
            String content = stripper.getText(pdf);
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("source", path);
            metadata.put("format", "pdf");
            metadata.put("pageCount", pdf.getNumberOfPages());
            
            // 提取更多元数据
            PDDocumentInformation info = pdf.getDocumentInformation();
            if (info.getTitle() != null) metadata.put("title", info.getTitle());
            if (info.getAuthor() != null) metadata.put("author", info.getAuthor());
            if (info.getSubject() != null) metadata.put("subject", info.getSubject());
            
            documents.add(new Document(content, metadata));
        }
        
        return documents;
    }
    
    @Override
    public boolean supports(String path) {
        return path.toLowerCase().endsWith(".pdf");
    }
}
```

</details>

### 练习 2：实现递归文本分割器

实现一个递归文本分割器，能够按多级分隔符分割文本。

<details>
<summary>点击查看答案</summary>

```java
// 递归文本分割器
public class RecursiveTextSplitter implements TextSplitter {
    private final int chunkSize;
    private final int chunkOverlap;
    private final List<String> separators;
    
    public RecursiveTextSplitter(int chunkSize, int chunkOverlap) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
        this.separators = Arrays.asList("\n\n", "\n", "。", ".", "！", "!", "？", "?", " ");
    }
    
    @Override
    public List<String> split(String text) {
        return splitText(text, separators);
    }
    
    private List<String> splitText(String text, List<String> separators) {
        if (text.length() <= chunkSize) {
            return List.of(text);
        }
        
        // 找到合适的分隔符
        String separator = separators.get(separators.size() - 1);
        for (String sep : separators) {
            if (text.contains(sep)) {
                separator = sep;
                break;
            }
        }
        
        // 分割
        String[] parts = text.split(Pattern.quote(separator));
        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        
        for (String part : parts) {
            if (current.length() + part.length() > chunkSize) {
                if (current.length() > 0) {
                    chunks.add(current.toString().trim());
                    current = new StringBuilder();
                }
                if (part.length() > chunkSize) {
                    int idx = separators.indexOf(separator);
                    if (idx < separators.size() - 1) {
                        chunks.addAll(splitText(part, separators.subList(idx + 1, separators.size())));
                    } else {
                        chunks.add(part.substring(0, chunkSize));
                    }
                }
            }
            if (current.length() > 0) current.append(separator);
            current.append(part);
        }
        
        if (current.length() > 0) {
            chunks.add(current.toString().trim());
        }
        
        return chunks;
    }
}
```

</details>

### 练习 3：实现完整的 RAG 问答系统

实现一个简单的 RAG 问答系统，能够索引文档并回答问题。

<details>
<summary>点击查看答案</summary>

```java
// 简单 RAG 系统
public class SimpleRag {
    private final EmbeddingService embeddingService;
    private final VectorStore vectorStore;
    private final OpenAiClient llm;
    
    public SimpleRag(String apiKey) {
        this.embeddingService = new EmbeddingService(apiKey, "text-embedding-ada-002");
        this.vectorStore = new InMemoryVectorStore(embeddingService);
        this.llm = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    // 添加文档
    public void addDocument(String content, String source) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("source", source);
        Document doc = new Document(content, metadata);
        vectorStore.add(doc);
    }
    
    // 问答
    public String ask(String question) {
        // 检索
        float[] queryVector = embeddingService.embed(question);
        List<Document> docs = vectorStore.search(queryVector, 3);
        
        // 构建 Prompt
        StringBuilder prompt = new StringBuilder();
        prompt.append("根据以下资料回答问题：\n\n");
        for (int i = 0; i < docs.size(); i++) {
            prompt.append("【资料 ").append(i + 1).append("】\n");
            prompt.append(docs.get(i).getContent()).append("\n\n");
        }
        prompt.append("问题: ").append(question);
        
        // 调用 LLM
        ChatCompletionResponse response = llm.chatCompletion(
            ChatCompletionRequest.builder()
                .model("gpt-3.5-turbo")
                .messages(List.of(Message.user(prompt.toString())))
                .build()
        );
        
        return response.getChoices().get(0).getMessage().getContent();
    }
}

// 使用示例
SimpleRag rag = new SimpleRag("api-key");
rag.addDocument("Java 是一种面向对象的编程语言", "java.txt");
rag.addDocument("Python 是一种解释型语言", "python.txt");
String answer = rag.ask("Java 是什么？");
```

</details>

---

## 11 下一章预告

恭喜你完成了 RAG 系统的学习！现在你的 AI Agent 可以利用外部知识库回答问题了。

但是，一个 Agent 的能力终究是有限的。面对复杂的任务，我们需要多个 Agent 协作，就像团队一样分工合作。

在下一章《多 Agent 协作》中，我们将学习：
- 为什么需要多个 Agent 协作？
- 如何定义 Agent 的角色和职责？
- Agent 之间如何通信？
- 如何实现任务分发和结果汇总？
- 如何在 Java 中实现多 Agent 系统？

让你的 AI 从"单兵作战"升级为"团队协作"！
