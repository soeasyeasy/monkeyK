---
title: "第六章：记忆管理系统"
description: "为 AI Agent 构建记忆系统，实现上下文保持与长期知识积累"
---

# 第六章：记忆管理系统

## 本章导读

在上一章中，我们学习了如何让 AI Agent 调用外部工具。但在实际使用中，你会发现一个严重的问题：AI 的"记忆"非常短暂。

本章你将学习：
- 为什么 AI 需要记忆系统？
- 短期记忆、长期记忆、工作记忆分别是什么？
- 如何管理上下文窗口？
- 如何使用向量数据库存储长期记忆？
- 如何在 Java 中实现完整的记忆管理器？

通过本章学习，你将让你的 AI Agent 从"金鱼记忆"变成"过目不忘"。

---

## 1 为什么需要记忆？

### 1.1 AI 的"金鱼记忆"问题

大语言模型本质上是无状态的。每次对话都是独立的，模型不会自动记住之前的对话内容。

**问题表现**：

```
用户: 我叫小明
AI: 你好小明！很高兴认识你。

（新对话开始）

用户: 我叫什么名字？
AI: 抱歉，我不知道你的名字。
```

### 1.2 生活化类比：人类的记忆系统

人类有三种记忆：

| 记忆类型 | 特点 | 例子 |
|---------|------|------|
| **短期记忆** | 容量有限，保持时间短 | 记住刚才说的电话号码 |
| **长期记忆** | 容量大，可以长期保存 | 记住自己的生日 |
| **工作记忆** | 当前正在处理的信息 | 正在计算的那道数学题 |

AI Agent 也需要这三种记忆：

| AI 记忆类型 | 对应人类 | 存储内容 | 用途 |
|------------|---------|---------|------|
| **短期记忆** | 短期记忆 | 最近几轮对话 | 保持对话连贯 |
| **长期记忆** | 长期记忆 | 历史对话、知识库 | 长期知识积累 |
| **工作记忆** | 工作记忆 | 当前任务状态 | 执行复杂任务 |

### 1.3 没有记忆的后果

| 场景 | 没有记忆 | 有记忆 |
|-----|---------|--------|
| 多轮对话 | 每轮都要重新说明背景 | 自然连贯的对话 |
| 个性化服务 | 无法记住用户偏好 | 记住用户习惯和喜好 |
| 复杂任务 | 无法跟踪任务进度 | 记住任务状态和进展 |
| 知识积累 | 每次从零开始 | 不断学习和积累 |

---

## 2 短期记忆：对话上下文窗口

### 2.1 什么是短期记忆？

短期记忆就是当前对话的上下文。通过把历史对话一起发送给 AI，让它"记住"之前说过什么。

### 2.2 基本实现

```java
// 短期记忆管理器
public class ShortTermMemory {
    // 存储对话历史
    private final List<Message> messages = new ArrayList<>();
    // 最大消息数量
    private int maxMessages = 20;
    
    // 添加用户消息
    public void addUserMessage(String content) {
        messages.add(Message.user(content));
        // 检查是否超出限制
        trimMessages();
    }
    
    // 添加 AI 消息
    public void addAiMessage(String content) {
        messages.add(Message.assistant(content));
        trimMessages();
    }
    
    // 添加系统消息
    public void addSystemMessage(String content) {
        // 系统消息放在最前面
        messages.add(0, Message.system(content));
    }
    
    // 获取所有消息
    public List<Message> getMessages() {
        return new ArrayList<>(messages);
    }
    
    // 裁剪消息，保持不超过最大数量
    private void trimMessages() {
        while (messages.size() > maxMessages) {
            // 保留第一条系统消息
            if (messages.get(0).getRole().equals("system")) {
                messages.remove(1);
            } else {
                messages.remove(0);
            }
        }
    }
    
    // 清空记忆
    public void clear() {
        messages.clear();
    }
    
    // 设置最大消息数
    public void setMaxMessages(int max) {
        this.maxMessages = max;
        trimMessages();
    }
}
```

### 2.3 使用示例

```java
// 使用短期记忆
ShortTermMemory memory = new ShortTermMemory();

// 添加系统提示
memory.addSystemMessage("你是一个友好的助手。");

// 模拟对话
memory.addUserMessage("我叫小明");
// 发送给 AI 时包含历史
List<Message> messages = memory.getMessages();
// AI 回复后
memory.addAiMessage("你好小明！很高兴认识你。");

// 继续对话
memory.addUserMessage("我叫什么名字？");
// 这次 AI 能看到之前的对话，知道用户叫小明
```

---

## 3 上下文窗口管理策略

### 3.1 为什么需要管理？

大语言模型有上下文长度限制：

| 模型 | 上下文长度 | 说明 |
|-----|----------|------|
| GPT-3.5 | 4K tokens | 约 3000 字 |
| GPT-4 | 8K/32K/128K tokens | 不同版本不同 |
| Claude | 100K tokens | 较长 |
| LLaMA-2 | 4K tokens | 开源模型 |

当对话超过限制时，需要管理策略。

### 3.2 策略一：滑动窗口

只保留最近的 N 轮对话。

```java
// 滑动窗口策略
public class SlidingWindowStrategy {
    private final int windowSize;  // 窗口大小（对话轮数）
    
    public SlidingWindowStrategy(int windowSize) {
        this.windowSize = windowSize;
    }
    
    // 应用滑动窗口
    public List<Message> apply(List<Message> messages) {
        // 保留系统消息
        List<Message> result = new ArrayList<>();
        Message systemMessage = null;
        
        for (Message msg : messages) {
            if (msg.getRole().equals("system")) {
                systemMessage = msg;
                break;
            }
        }
        
        // 添加系统消息
        if (systemMessage != null) {
            result.add(systemMessage);
        }
        
        // 获取非系统消息
        List<Message> nonSystemMessages = messages.stream()
            .filter(m -> !m.getRole().equals("system"))
            .collect(Collectors.toList());
        
        // 只保留最近的 N 轮（每轮 2 条：用户 + AI）
        int startIndex = Math.max(0, nonSystemMessages.size() - windowSize * 2);
        result.addAll(nonSystemMessages.subList(startIndex, nonSystemMessages.size()));
        
        return result;
    }
}

// 使用示例
SlidingWindowStrategy strategy = new SlidingWindowStrategy(5);  // 保留最近 5 轮
List<Message> trimmed = strategy.apply(allMessages);
```

### 3.3 策略二：摘要压缩

将早期对话压缩成摘要。

```java
// 摘要压缩策略
public class SummaryCompressionStrategy {
    private final OpenAiClient client;
    private String summary = "";  // 对话摘要
    
    public SummaryCompressionStrategy(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
    }
    
    // 压缩历史对话
    public List<Message> compress(List<Message> messages, int maxTokens) {
        // 计算当前 token 数
        int currentTokens = estimateTokens(messages);
        
        // 如果超出限制，进行压缩
        if (currentTokens > maxTokens) {
            // 分离系统消息和普通消息
            List<Message> systemMessages = new ArrayList<>();
            List<Message> normalMessages = new ArrayList<>();
            
            for (Message msg : messages) {
                if (msg.getRole().equals("system")) {
                    systemMessages.add(msg);
                } else {
                    normalMessages.add(msg);
                }
            }
            
            // 将前半部分对话生成摘要
            int splitPoint = normalMessages.size() / 2;
            List<Message> toSummarize = normalMessages.subList(0, splitPoint);
            List<Message> toKeep = normalMessages.subList(splitPoint, normalMessages.size());
            
            // 生成摘要
            String newSummary = generateSummary(toSummarize);
            summary = summary.isEmpty() ? newSummary : summary + "\n" + newSummary;
            
            // 构建新的消息列表
            List<Message> result = new ArrayList<>(systemMessages);
            
            // 添加摘要作为系统消息
            if (!summary.isEmpty()) {
                result.add(Message.system("之前的对话摘要：" + summary));
            }
            
            // 添加保留的消息
            result.addAll(toKeep);
            
            return result;
        }
        
        return messages;
    }
    
    // 生成对话摘要
    private String generateSummary(List<Message> messages) {
        // 构建对话文本
        StringBuilder conversation = new StringBuilder();
        for (Message msg : messages) {
            conversation.append(msg.getRole())
                       .append(": ")
                       .append(msg.getContent())
                       .append("\n");
        }
        
        // 调用 AI 生成摘要
        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model("gpt-3.5-turbo")
            .messages(List.of(
                Message.system("请将以下对话压缩成简洁的摘要，保留关键信息："),
                Message.user(conversation.toString())
            ))
            .build();
        
        ChatCompletionResponse response = client.chatCompletion(request);
        return response.getChoices().get(0).getMessage().getContent();
    }
    
    // 估算 token 数量（简化版）
    private int estimateTokens(List<Message> messages) {
        int tokens = 0;
        for (Message msg : messages) {
            // 粗略估算：1 个中文字约 1.5 个 token
            tokens += msg.getContent().length() * 1.5;
        }
        return (int) tokens;
    }
}
```

### 3.4 策略对比

| 策略 | 优点 | 缺点 | 适用场景 |
|-----|------|------|---------|
| **滑动窗口** | 简单高效，无额外成本 | 丢失早期信息 | 短对话、实时性要求高 |
| **摘要压缩** | 保留关键信息 | 需要调用 AI，有成本 | 长对话、需要保持上下文 |
| **混合策略** | 兼顾效率和效果 | 实现复杂 | 生产环境 |

---

## 4 长期记忆：向量数据库存储

### 4.1 什么是长期记忆？

长期记忆用于存储需要长期保存的信息，比如：
- 用户偏好和习惯
- 历史对话的重要信息
- 学习到的知识

### 4.2 向量数据库原理

向量数据库将文本转换为向量（数字数组），通过计算向量相似度来检索相关内容。

**工作流程**：

```
文本 → Embedding 模型 → 向量 → 存储到向量数据库
查询文本 → Embedding 模型 → 查询向量 → 相似度搜索 → 返回相关文本
```

### 4.3 向量数据库选型

| 数据库 | 特点 | 适用场景 |
|-------|------|---------|
| **Milvus** | 开源、高性能、分布式 | 大规模生产环境 |
| **Chroma** | 轻量、易用、Python 生态 | 快速原型、小规模应用 |
| **Pinecone** | 云托管、免运维 | 不想自己维护基础设施 |
| **Weaviate** | 功能丰富、支持混合搜索 | 复杂搜索需求 |
| **Qdrant** | Rust 实现、高性能 | 高性能需求 |

### 4.4 Java 实现长期记忆

```java
// 长期记忆管理器
public class LongTermMemory {
    private final EmbeddingModel embeddingModel;
    private final VectorStore vectorStore;
    
    public LongTermMemory(EmbeddingModel embeddingModel, VectorStore vectorStore) {
        this.embeddingModel = embeddingModel;
        this.vectorStore = vectorStore;
    }
    
    // 存储记忆
    public void store(String content, Map<String, Object> metadata) {
        // 生成向量
        float[] vector = embeddingModel.embed(content);
        
        // 创建文档
        Document doc = new Document(content, vector, metadata);
        
        // 存储到向量数据库
        vectorStore.add(doc);
        
        System.out.println("记忆已存储: " + content);
    }
    
    // 检索相关记忆
    public List<String> recall(String query, int topK) {
        // 生成查询向量
        float[] queryVector = embeddingModel.embed(query);
        
        // 相似度搜索
        List<Document> results = vectorStore.search(queryVector, topK);
        
        // 提取内容
        return results.stream()
            .map(Document::getContent)
            .collect(Collectors.toList());
    }
    
    // 存储对话记忆
    public void storeConversation(String userMessage, String aiResponse) {
        String content = "用户: " + userMessage + "\nAI: " + aiResponse;
        Map<String, Object> metadata = Map.of(
            "type", "conversation",
            "timestamp", System.currentTimeMillis()
        );
        store(content, metadata);
    }
    
    // 存储用户偏好
    public void storeUserPreference(String preference) {
        Map<String, Object> metadata = Map.of(
            "type", "preference",
            "timestamp", System.currentTimeMillis()
        );
        store(preference, metadata);
    }
}
```

### 4.5 Embedding 模型

```java
// Embedding 模型接口
public interface EmbeddingModel {
    // 将文本转换为向量
    float[] embed(String text);
    
    // 批量转换
    List<float[]> embed(List<String> texts);
}

// OpenAI Embedding 实现
public class OpenAiEmbeddingModel implements EmbeddingModel {
    private final OpenAiClient client;
    private final String model;
    
    public OpenAiEmbeddingModel(String apiKey) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
        this.model = "text-embedding-ada-002";
    }
    
    @Override
    public float[] embed(String text) {
        EmbeddingRequest request = EmbeddingRequest.builder()
            .model(model)
            .input(List.of(text))
            .build();
        
        EmbeddingResponse response = client.embedding(request);
        List<Double> embedding = response.getData().get(0).getEmbedding();
        
        // 转换为 float 数组
        float[] result = new float[embedding.size()];
        for (int i = 0; i < embedding.size(); i++) {
            result[i] = embedding.get(i).floatValue();
        }
        return result;
    }
    
    @Override
    public List<float[]> embed(List<String> texts) {
        EmbeddingRequest request = EmbeddingRequest.builder()
            .model(model)
            .input(texts)
            .build();
        
        EmbeddingResponse response = client.embedding(request);
        
        return response.getData().stream()
            .map(data -> {
                List<Double> embedding = data.getEmbedding();
                float[] result = new float[embedding.size()];
                for (int i = 0; i < embedding.size(); i++) {
                    result[i] = embedding.get(i).floatValue();
                }
                return result;
            })
            .collect(Collectors.toList());
    }
}
```

### 4.6 向量存储

```java
// 向量存储接口
public interface VectorStore {
    // 添加文档
    void add(Document document);
    
    // 批量添加
    void add(List<Document> documents);
    
    // 相似度搜索
    List<Document> search(float[] queryVector, int topK);
    
    // 删除文档
    void delete(String id);
}

// 简单的内存向量存储实现
public class InMemoryVectorStore implements VectorStore {
    private final Map<String, Document> documents = new ConcurrentHashMap<>();
    
    @Override
    public void add(Document document) {
        documents.put(document.getId(), document);
    }
    
    @Override
    public void add(List<Document> docs) {
        docs.forEach(this::add);
    }
    
    @Override
    public List<Document> search(float[] queryVector, int topK) {
        return documents.values().stream()
            .sorted((a, b) -> {
                // 计算余弦相似度
                double simA = cosineSimilarity(queryVector, a.getVector());
                double simB = cosineSimilarity(queryVector, b.getVector());
                return Double.compare(simB, simA);  // 降序
            })
            .limit(topK)
            .collect(Collectors.toList());
    }
    
    @Override
    public void delete(String id) {
        documents.remove(id);
    }
    
    // 计算余弦相似度
    private double cosineSimilarity(float[] a, float[] b) {
        double dotProduct = 0;
        double normA = 0;
        double normB = 0;
        
        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

// 文档类
public class Document {
    private final String id;
    private final String content;
    private final float[] vector;
    private final Map<String, Object> metadata;
    
    public Document(String content, float[] vector, Map<String, Object> metadata) {
        this.id = UUID.randomUUID().toString();
        this.content = content;
        this.vector = vector;
        this.metadata = metadata != null ? metadata : new HashMap<>();
    }
    
    // getter 方法
    public String getId() { return id; }
    public String getContent() { return content; }
    public float[] getVector() { return vector; }
    public Map<String, Object> getMetadata() { return metadata; }
}
```

---

## 5 工作记忆：当前任务状态

### 5.1 什么是工作记忆？

工作记忆用于存储当前任务执行过程中的临时信息，比如：
- 任务进度
- 中间结果
- 待办事项

### 5.2 实现工作记忆

```java
// 工作记忆管理器
public class WorkingMemory {
    // 当前任务
    private String currentTask;
    // 任务状态
    private TaskStatus status = TaskStatus.PENDING;
    // 中间结果
    private final Map<String, Object> intermediateResults = new HashMap<>();
    // 待办事项
    private final List<String> todoList = new ArrayList<>();
    // 已完成事项
    private final List<String> completedItems = new ArrayList<>();
    
    // 开始新任务
    public void startTask(String task) {
        this.currentTask = task;
        this.status = TaskStatus.IN_PROGRESS;
        this.intermediateResults.clear();
        this.todoList.clear();
        this.completedItems.clear();
        System.out.println("开始任务: " + task);
    }
    
    // 保存中间结果
    public void saveResult(String key, Object value) {
        intermediateResults.put(key, value);
        System.out.println("保存结果: " + key + " = " + value);
    }
    
    // 获取中间结果
    public Object getResult(String key) {
        return intermediateResults.get(key);
    }
    
    // 添加待办事项
    public void addToDo(String item) {
        todoList.add(item);
        System.out.println("添加待办: " + item);
    }
    
    // 完成待办事项
    public void completeToDo(String item) {
        if (todoList.remove(item)) {
            completedItems.add(item);
            System.out.println("完成: " + item);
        }
    }
    
    // 获取任务状态摘要
    public String getSummary() {
        StringBuilder sb = new StringBuilder();
        sb.append("当前任务: ").append(currentTask).append("\n");
        sb.append("状态: ").append(status).append("\n");
        sb.append("中间结果: ").append(intermediateResults.size()).append(" 项\n");
        sb.append("待办: ").append(todoList.size()).append(" 项\n");
        sb.append("已完成: ").append(completedItems.size()).append(" 项\n");
        return sb.toString();
    }
    
    // 完成任务
    public void completeTask() {
        this.status = TaskStatus.COMPLETED;
        System.out.println("任务完成: " + currentTask);
    }
    
    // 任务状态枚举
    public enum TaskStatus {
        PENDING,      // 待处理
        IN_PROGRESS,  // 进行中
        COMPLETED,    // 已完成
        FAILED        // 失败
    }
}
```

---

## 6 完整的记忆管理器

将三种记忆整合在一起：

```java
// 综合记忆管理器
public class MemoryManager {
    private final ShortTermMemory shortTermMemory;
    private final LongTermMemory longTermMemory;
    private final WorkingMemory workingMemory;
    private final ContextStrategy contextStrategy;
    
    public MemoryManager(EmbeddingModel embeddingModel, VectorStore vectorStore) {
        this.shortTermMemory = new ShortTermMemory();
        this.longTermMemory = new LongTermMemory(embeddingModel, vectorStore);
        this.workingMemory = new WorkingMemory();
        this.contextStrategy = new SummaryCompressionStrategy();
    }
    
    // 处理用户输入
    public List<Message> processInput(String userInput) {
        // 1. 添加到短期记忆
        shortTermMemory.addUserMessage(userInput);
        
        // 2. 从长期记忆中检索相关信息
        List<String> relevantMemories = longTermMemory.recall(userInput, 3);
        
        // 3. 构建上下文
        List<Message> context = buildContext(relevantMemories);
        
        return context;
    }
    
    // 处理 AI 响应
    public void processResponse(String aiResponse) {
        // 1. 添加到短期记忆
        shortTermMemory.addAiMessage(aiResponse);
        
        // 2. 存储到长期记忆
        String lastUserMessage = getLastUserMessage();
        longTermMemory.storeConversation(lastUserMessage, aiResponse);
    }
    
    // 构建上下文
    private List<Message> buildContext(List<String> relevantMemories) {
        List<Message> context = new ArrayList<>();
        
        // 添加系统提示
        context.add(Message.system("你是一个友好的助手。"));
        
        // 添加相关记忆
        if (!relevantMemories.isEmpty()) {
            StringBuilder memoryContext = new StringBuilder();
            memoryContext.append("以下是相关的历史信息：\n");
            for (String memory : relevantMemories) {
                memoryContext.append("- ").append(memory).append("\n");
            }
            context.add(Message.system(memoryContext.toString()));
        }
        
        // 添加工作记忆状态
        String workingSummary = workingMemory.getSummary();
        if (!workingSummary.isEmpty()) {
            context.add(Message.system("当前任务状态：\n" + workingSummary));
        }
        
        // 添加短期记忆（应用上下文策略）
        List<Message> shortTermMessages = shortTermMemory.getMessages();
        context.addAll(contextStrategy.compress(shortTermMessages, 4000));
        
        return context;
    }
    
    // 获取最后一条用户消息
    private String getLastUserMessage() {
        List<Message> messages = shortTermMemory.getMessages();
        for (int i = messages.size() - 1; i >= 0; i--) {
            if (messages.get(i).getRole().equals("user")) {
                return messages.get(i).getContent();
            }
        }
        return "";
    }
    
    // 获取各个记忆管理器
    public ShortTermMemory getShortTermMemory() { return shortTermMemory; }
    public LongTermMemory getLongTermMemory() { return longTermMemory; }
    public WorkingMemory getWorkingMemory() { return workingMemory; }
}
```

---

## 7 对比表格

### 7.1 记忆类型对比

| 特性 | 短期记忆 | 长期记忆 | 工作记忆 |
|-----|---------|---------|---------|
| **存储内容** | 最近对话 | 历史知识 | 任务状态 |
| **存储位置** | 内存 | 向量数据库 | 内存 |
| **持久性** | 临时 | 永久 | 临时 |
| **容量** | 有限 | 大 | 有限 |
| **访问速度** | 快 | 较慢 | 快 |
| **用途** | 对话连贯 | 知识积累 | 任务跟踪 |

### 7.2 上下文策略对比

| 策略 | 实现复杂度 | 信息保留 | 成本 | 适用场景 |
|-----|----------|---------|------|---------|
| **滑动窗口** | 低 | 只保留近期 | 低 | 短对话 |
| **摘要压缩** | 中 | 保留关键信息 | 中 | 长对话 |
| **向量检索** | 高 | 按需检索 | 中 | 知识密集型 |
| **混合策略** | 高 | 综合效果最好 | 高 | 生产环境 |

---

## 8 新手常见误区

### 误区 1：把所有历史对话都发给 AI

**错误想法**：对话历史越多，AI 理解越好。

**正确做法**：超过上下文限制会导致截断或报错，需要合理管理。

```java
// ❌ 错误：无限制添加
while (true) {
    messages.add(userMessage);  // 可能导致超出限制
}

// ✅ 正确：使用滑动窗口
messages = slidingWindow.apply(messages, 20);  // 只保留最近 20 条
```

### 误区 2：忽略向量数据库的选择

**错误想法**：随便用个数据库存向量就行。

**正确做法**：根据数据规模、性能要求、运维成本选择合适的向量数据库。

```java
// ❌ 小规模用 Milvus（杀鸡用牛刀）
VectorStore store = new MilvusVectorStore(config);  // 只有 100 条数据

// ✅ 小规模用内存或 Chroma
VectorStore store = new InMemoryVectorStore();  // 简单高效
```

### 误区 3：不更新长期记忆

**错误想法**：存进去就不用管了。

**正确做法**：定期清理过期或无用的记忆，保持记忆质量。

```java
// ❌ 只存不删
longTermMemory.store(content, metadata);

// ✅ 定期清理
longTermMemory.cleanOlderThan(30, TimeUnit.DAYS);  // 清理 30 天前的记忆
```

### 误区 4：工作记忆设计过于复杂

**错误想法**：工作记忆要包含所有可能的信息。

**正确做法**：工作记忆应该简洁，只包含当前任务需要的信息。

```java
// ❌ 过于复杂
workingMemory.store("every_possible_detail", value);

// ✅ 简洁明了
workingMemory.saveResult("current_step", step);
workingMemory.saveResult("accumulated_data", data);
```

### 误区 5：Embedding 模型选择不当

**错误想法**：所有文本都用同一个 Embedding 模型。

**正确做法**：根据语言、领域选择合适的 Embedding 模型。

```java
// ❌ 中文文本用英文模型
EmbeddingModel model = new OpenAiEmbeddingModel("text-embedding-ada-002");  // 英文优化

// ✅ 中文文本用中文优化模型
EmbeddingModel model = new ChineseEmbeddingModel("text-embedding-v2");  // 中文优化
```

---

## 9 动手练习

### 练习 1：实现滑动窗口策略

实现一个滑动窗口策略，保留最近 N 轮对话，但要确保保留系统消息。

<details>
<summary>点击查看答案</summary>

```java
// 滑动窗口策略
public class SlidingWindowStrategy implements ContextStrategy {
    private final int maxRounds;  // 最大轮数
    
    public SlidingWindowStrategy(int maxRounds) {
        this.maxRounds = maxRounds;
    }
    
    @Override
    public List<Message> apply(List<Message> messages) {
        List<Message> result = new ArrayList<>();
        
        // 1. 保留所有系统消息
        List<Message> systemMessages = messages.stream()
            .filter(m -> m.getRole().equals("system"))
            .collect(Collectors.toList());
        result.addAll(systemMessages);
        
        // 2. 获取非系统消息
        List<Message> normalMessages = messages.stream()
            .filter(m -> !m.getRole().equals("system"))
            .collect(Collectors.toList());
        
        // 3. 计算要保留的消息数量（每轮 2 条）
        int maxMessages = maxRounds * 2;
        int startIndex = Math.max(0, normalMessages.size() - maxMessages);
        
        // 4. 添加保留的消息
        result.addAll(normalMessages.subList(startIndex, normalMessages.size()));
        
        return result;
    }
}

// 使用示例
ContextStrategy strategy = new SlidingWindowStrategy(5);  // 保留最近 5 轮
List<Message> trimmed = strategy.apply(allMessages);
```

</details>

### 练习 2：实现简单的向量存储

实现一个简单的向量存储，支持添加文档和相似度搜索。

<details>
<summary>点击查看答案</summary>

```java
// 简单的向量存储
public class SimpleVectorStore implements VectorStore {
    private final List<Document> documents = new CopyOnWriteArrayList<>();
    
    @Override
    public void add(Document document) {
        documents.add(document);
    }
    
    @Override
    public void add(List<Document> docs) {
        documents.addAll(docs);
    }
    
    @Override
    public List<Document> search(float[] queryVector, int topK) {
        return documents.parallelStream()
            .map(doc -> new ScoredDocument(doc, cosineSimilarity(queryVector, doc.getVector())))
            .sorted((a, b) -> Double.compare(b.score, a.score))  // 降序
            .limit(topK)
            .map(sd -> sd.document)
            .collect(Collectors.toList());
    }
    
    @Override
    public void delete(String id) {
        documents.removeIf(doc -> doc.getId().equals(id));
    }
    
    // 余弦相似度
    private double cosineSimilarity(float[] a, float[] b) {
        if (a.length != b.length) {
            throw new IllegalArgumentException("向量维度不匹配");
        }
        
        double dotProduct = 0;
        double normA = 0;
        double normB = 0;
        
        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        if (normA == 0 || normB == 0) {
            return 0;
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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

</details>

### 练习 3：实现带记忆的对话 Agent

创建一个 Agent，能够记住用户的名字和偏好，并在后续对话中使用。

<details>
<summary>点击查看答案</summary>

```java
// 带记忆的对话 Agent
public class MemoryAgent {
    private final OpenAiClient client;
    private final MemoryManager memoryManager;
    
    public MemoryAgent(String apiKey, EmbeddingModel embeddingModel) {
        this.client = OpenAiClient.builder().apiKey(apiKey).build();
        VectorStore vectorStore = new InMemoryVectorStore();
        this.memoryManager = new MemoryManager(embeddingModel, vectorStore);
    }
    
    // 对话
    public String chat(String userInput) {
        // 1. 处理输入，构建上下文
        List<Message> context = memoryManager.processInput(userInput);
        
        // 2. 调用 AI
        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model("gpt-4")
            .messages(context)
            .build();
        
        ChatCompletionResponse response = client.chatCompletion(request);
        String aiResponse = response.getChoices().get(0).getMessage().getContent();
        
        // 3. 处理响应，更新记忆
        memoryManager.processResponse(aiResponse);
        
        // 4. 提取并存储用户信息
        extractAndStoreUserInfo(userInput, aiResponse);
        
        return aiResponse;
    }
    
    // 提取用户信息
    private void extractAndStoreUserInfo(String userInput, String aiResponse) {
        // 简单规则：检测特定模式
        if (userInput.contains("我叫") || userInput.contains("名字是")) {
            memoryManager.getLongTermMemory().store(
                "用户信息: " + userInput,
                Map.of("type", "user_info")
            );
        }
        
        if (userInput.contains("喜欢") || userInput.contains("偏好")) {
            memoryManager.getLongTermMemory().storeUserPreference(userInput);
        }
    }
    
    // 清空短期记忆（新对话）
    public void newConversation() {
        memoryManager.getShortTermMemory().clear();
    }
}

// 使用示例
MemoryAgent agent = new MemoryAgent("api-key", new OpenAiEmbeddingModel("api-key"));

// 第一次对话
agent.chat("我叫小明");
// AI: 你好小明！很高兴认识你。

// 新对话（短期记忆清空）
agent.newConversation();

// 但 AI 仍然记得（通过长期记忆）
agent.chat("你还记得我吗？");
// AI: 当然记得，你叫小明！
```

</details>

---

## 10 下一章预告

太棒了！现在你的 AI Agent 已经有了完善的记忆系统，能够记住之前的对话和积累知识。

但是，如果用户问了一些 AI 训练数据中没有的问题怎么办？比如公司的内部文档、最新的产品信息等。

在下一章《RAG 检索增强生成》中，我们将学习：
- 什么是 RAG（检索增强生成）？
- 如何让 AI 利用外部知识库回答问题？
- 文档加载、分割、向量化、检索的完整流程
- 如何在 Java 中实现完整的 RAG 系统

让你的 AI Agent 成为"开卷考试"的高手！
