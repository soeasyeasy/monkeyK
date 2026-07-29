---
title: "第十四章：性能优化与成本控制"
description: "优化 AI Agent 性能，降低 LLM 调用成本"
---

# 第十四章：性能优化与成本控制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么我的 AI Agent 响应这么慢？
- LLM API 调用成本太高，怎么降低？
- 如何在不牺牲质量的前提下优化性能？

这一章会教你**性能优化**和**成本控制**的实战技巧，让你的 AI Agent 既快又省钱。

---

## 1 为什么需要性能优化？

### 痛点分析

想象一下这些场景：

- 用户问一个问题，Agent 要等 10 秒才回复 → 用户体验极差
- 每天 API 调用费用高达数千元 → 成本无法承受
- 高并发时系统崩溃 → 业务中断

这些问题都会直接影响**用户满意度**和**商业可行性**。

### 解决方案

通过系统性的优化策略：

- **缓存机制**：避免重复调用 LLM
- **异步处理**：提升响应速度
- **模型选择**：大小模型配合使用
- **Token 优化**：减少不必要的消耗

打个比方：

> 性能优化就像**开车省油**——你可以选择更高效的路线（缓存）、拼车出行（并发）、或者换一辆省油的车（小模型）。

---

## 2 核心原理

### Token 消耗分析

LLM API 按 Token 计费，Token 包括：

- **输入 Token**：Prompt + 上下文
- **输出 Token**：模型生成的回复

| 优化方向 | 策略 | 效果 |
|---------|------|------|
| 减少输入 | 精简 Prompt、压缩上下文 | 降低 30-50% 成本 |
| 控制输出 | 限制最大长度、结构化输出 | 避免冗余生成 |
| 缓存复用 | 语义缓存、结果缓存 | 减少 50-80% 调用 |

### 缓存策略

#### 结果缓存

```java
// ResultCache.java - 结果缓存
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ResultCache {
    // 使用 ConcurrentHashMap 保证线程安全
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    
    // 缓存条目
    private static class CacheEntry {
        String result;      // 缓存的结果
        long expireTime;    // 过期时间
        
        CacheEntry(String result, long ttlMillis) {
            this.result = result;
            this.expireTime = System.currentTimeMillis() + ttlMillis;
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() > expireTime;
        }
    }
    
    // 获取缓存
    public String get(String key) {
        CacheEntry entry = cache.get(key);
        if (entry == null) {
            return null; // 缓存未命中
        }
        
        if (entry.isExpired()) {
            cache.remove(key); // 清理过期缓存
            return null;
        }
        
        return entry.result; // 返回缓存结果
    }
    
    // 设置缓存
    public void put(String key, String result, long ttlMillis) {
        cache.put(key, new CacheEntry(result, ttlMillis));
    }
    
    // 清理过期缓存
    public void cleanup() {
        cache.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
}
```

#### 语义缓存

```java
// SemanticCache.java - 语义缓存
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;

public class SemanticCache {
    private final EmbeddingModel embeddingModel;  // Embedding 模型
    private final EmbeddingStore<String> store;   // 向量存储
    private final double threshold;               // 相似度阈值
    
    public SemanticCache(EmbeddingModel embeddingModel, double threshold) {
        this.embeddingModel = embeddingModel;
        this.store = new InMemoryEmbeddingStore<>();
        this.threshold = threshold;
    }
    
    // 查询缓存
    public String get(String question) {
        // 将问题转换为向量
        Embedding queryEmbedding = embeddingModel.embed(question).content();
        
        // 查找最相似的结果
        var results = store.findRelevant(queryEmbedding, 1, threshold);
        
        if (results.isEmpty()) {
            return null; // 没有相似结果
        }
        
        // 返回缓存的答案
        return results.get(0).embedded();
    }
    
    // 存储结果
    public void put(String question, String answer) {
        // 将问题转换为向量
        Embedding embedding = embeddingModel.embed(question).content();
        
        // 存储到向量数据库
        store.add(embedding, answer);
    }
}
```

### 异步处理

```java
// AsyncAgent.java - 异步 Agent
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AsyncAgent {
    private final LLMClient llmClient;
    private final ExecutorService executor;
    
    public AsyncAgent(LLMClient llmClient) {
        this.llmClient = llmClient;
        // 使用虚拟线程（JDK 21+）
        this.executor = Executors.newVirtualThreadPerTaskExecutor();
    }
    
    // 异步调用
    public CompletableFuture<String> chatAsync(String message) {
        return CompletableFuture.supplyAsync(() -> {
            // 在异步线程中调用 LLM
            return llmClient.chat(message);
        }, executor);
    }
    
    // 批量异步调用
    public CompletableFuture<List<String>> batchChatAsync(List<String> messages) {
        // 将所有调用转换为异步任务
        List<CompletableFuture<String>> futures = messages.stream()
            .map(this::chatAsync)
            .toList();
        
        // 等待所有任务完成
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)
                .toList());
    }
}
```

---

## 3 基础用法

### 使用 Caffeine 缓存

```java
// CaffeineCacheExample.java
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;

public class CaffeineCacheExample {
    // 创建缓存
    private final Cache<String, String> cache = Caffeine.newBuilder()
        .maximumSize(1000)              // 最大缓存条目数
        .expireAfterWrite(10, TimeUnit.MINUTES)  // 写入后 10 分钟过期
        .recordStats()                  // 记录统计信息
        .build();
    
    public String chatWithCache(String message) {
        // 尝试从缓存获取
        String cached = cache.getIfPresent(message);
        if (cached != null) {
            System.out.println("缓存命中");
            return cached;
        }
        
        // 缓存未命中，调用 LLM
        System.out.println("缓存未命中，调用 LLM");
        String response = llmClient.chat(message);
        
        // 存入缓存
        cache.put(message, response);
        
        return response;
    }
    
    // 打印缓存统计
    public void printStats() {
        var stats = cache.stats();
        System.out.println("命中率: " + stats.hitRate());
        System.out.println("请求数: " + stats.requestCount());
        System.out.println("加载次数: " + stats.loadCount());
    }
}
```

### 流式响应优化

```java
// StreamingAgent.java - 流式响应
import reactor.core.publisher.Flux;

public class StreamingAgent {
    private final LLMClient llmClient;
    
    public StreamingAgent(LLMClient llmClient) {
        this.llmClient = llmClient;
    }
    
    // 流式聊天
    public Flux<String> chatStream(String message) {
        return Flux.create(sink -> {
            // 调用 LLM 的流式接口
            llmClient.chatStream(message, new StreamCallback() {
                @Override
                public void onToken(String token) {
                    // 每收到一个 Token，立即发送给客户端
                    sink.next(token);
                }
                
                @Override
                public void onComplete() {
                    // 完成时关闭流
                    sink.complete();
                }
                
                @Override
                public void onError(Throwable error) {
                    // 错误处理
                    sink.error(error);
                }
            });
        });
    }
}

// 使用示例
// StreamingAgent agent = new StreamingAgent(llmClient);
// agent.chatStream("讲一个故事")
//     .doOnNext(token -> System.out.print(token))  // 实时打印
//     .blockLast();  // 等待完成
```

### 模型路由策略

```java
// ModelRouter.java - 模型路由
public class ModelRouter {
    private final LLMClient smallModel;   // 小模型（快速、便宜）
    private final LLMClient largeModel;   // 大模型（高质量、昂贵）
    private final Classifier classifier;  // 分类器
    
    public ModelRouter(LLMClient smallModel, LLMClient largeModel) {
        this.smallModel = smallModel;
        this.largeModel = largeModel;
        this.classifier = new Classifier();
    }
    
    public String chat(String message) {
        // 判断问题复杂度
        Complexity complexity = classifier.classify(message);
        
        if (complexity == Complexity.SIMPLE) {
            // 简单问题用小模型
            System.out.println("使用小模型");
            return smallModel.chat(message);
        } else {
            // 复杂问题用大模型
            System.out.println("使用大模型");
            return largeModel.chat(message);
        }
    }
}

// 分类器
class Classifier {
    public Complexity classify(String message) {
        // 简单规则：根据长度和关键词判断
        if (message.length() < 50 && !message.contains("分析")) {
            return Complexity.SIMPLE;
        }
        return Complexity.COMPLEX;
    }
}

enum Complexity {
    SIMPLE,   // 简单
    COMPLEX   // 复杂
}
```

---

## 4 进阶用法

### Token 预算控制

```java
// TokenBudgetManager.java - Token 预算管理
public class TokenBudgetManager {
    private final int dailyBudget;      // 每日预算
    private int usedTokens = 0;         // 已使用 Token
    private final LocalDate resetDate;  // 重置日期
    
    public TokenBudgetManager(int dailyBudget) {
        this.dailyBudget = dailyBudget;
        this.resetDate = LocalDate.now();
    }
    
    // 检查是否可以使用
    public boolean canUse(int estimatedTokens) {
        // 检查是否超过预算
        if (usedTokens + estimatedTokens > dailyBudget) {
            System.out.println("Token 预算不足");
            return false;
        }
        return true;
    }
    
    // 记录使用
    public void recordUsage(int tokens) {
        usedTokens += tokens;
        System.out.println("已使用 Token: " + usedTokens + "/" + dailyBudget);
    }
    
    // 获取剩余预算
    public int getRemainingBudget() {
        return dailyBudget - usedTokens;
    }
}
```

### 批量处理优化

```java
// BatchProcessor.java - 批量处理
import java.util.List;
import java.util.ArrayList;

public class BatchProcessor {
    private final LLMClient llmClient;
    private final int batchSize;
    
    public BatchProcessor(LLMClient llmClient, int batchSize) {
        this.llmClient = llmClient;
        this.batchSize = batchSize;
    }
    
    // 批量处理
    public List<String> processBatch(List<String> messages) {
        List<String> results = new ArrayList<>();
        
        // 分批处理
        for (int i = 0; i < messages.size(); i += batchSize) {
            int end = Math.min(i + batchSize, messages.size());
            List<String> batch = messages.subList(i, end);
            
            // 合并为一个 Prompt
            String combinedPrompt = String.join("\n---\n", batch);
            
            // 一次调用
            String combinedResponse = llmClient.chat(combinedPrompt);
            
            // 分割结果
            String[] responses = combinedResponse.split("\n---\n");
            
            // 添加到结果列表
            for (String response : responses) {
                results.add(response.trim());
            }
        }
        
        return results;
    }
}
```

---

## 5 核心知识点总结

| 优化策略 | 方法 | 效果 |
|---------|------|------|
| 结果缓存 | 精确匹配缓存 | 减少 50-80% 调用 |
| 语义缓存 | 向量相似度匹配 | 减少 30-50% 调用 |
| 异步处理 | CompletableFuture | 提升响应速度 |
| 流式响应 | SSE 实时传输 | 改善用户体验 |
| 模型路由 | 大小模型配合 | 降低 40-60% 成本 |
| Token 预算 | 限制每日用量 | 控制成本上限 |
| 批量处理 | 合并请求 | 减少 API 调用次数 |

---

## 6 新手常见误区

### 误区 1："缓存所有请求"

**错！** 不是所有请求都适合缓存。

- 实时性问题：缓存可能导致信息过时
- 个性化问题：不同用户的相同问题可能需要不同答案

正确做法：
- 对事实性问题使用缓存
- 对主观性问题不使用缓存
- 设置合理的缓存过期时间

### 误区 2："总是用最大的模型"

**错！** 大模型成本高、速度慢。

正确做法：
- 简单问题用小模型
- 复杂问题用大模型
- 建立模型路由策略

### 误区 3："忽略 Token 消耗"

**错！** Token 消耗直接影响成本。

正确做法：
- 精简 Prompt
- 压缩上下文
- 监控 Token 使用情况

---

## 7 动手练习

### 练习 1：实现结果缓存

为 AI Agent 添加简单的结果缓存功能。

<details>
<summary>点击查看答案</summary>

```java
// CachedAgent.java
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CachedAgent {
    private final LLMClient llmClient;
    private final Map<String, String> cache = new ConcurrentHashMap<>();
    
    public CachedAgent(LLMClient llmClient) {
        this.llmClient = llmClient;
    }
    
    public String chat(String message) {
        // 检查缓存
        if (cache.containsKey(message)) {
            System.out.println("缓存命中");
            return cache.get(message);
        }
        
        // 调用 LLM
        String response = llmClient.chat(message);
        
        // 存入缓存
        cache.put(message, response);
        
        return response;
    }
}
```

</details>

### 练习 2：实现流式响应

使用 SSE 实现流式响应。

<details>
<summary>点击查看答案</summary>

```java
// StreamingController.java
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api")
public class StreamingController {
    private final StreamingAgent agent;
    
    public StreamingController(StreamingAgent agent) {
        this.agent = agent;
    }
    
    @GetMapping(value = "/chat/stream", produces = "text/event-stream")
    public Flux<String> chatStream(@RequestParam String message) {
        return agent.chatStream(message);
    }
}
```

</details>

### 练习 3（挑战）：实现模型路由

根据问题复杂度自动选择模型。

<details>
<summary>点击查看答案</summary>

```java
// SmartRouter.java
public class SmartRouter {
    private final LLMClient smallModel;
    private final LLMClient largeModel;
    
    public SmartRouter(LLMClient smallModel, LLMClient largeModel) {
        this.smallModel = smallModel;
        this.largeModel = largeModel;
    }
    
    public String chat(String message) {
        // 简单规则：根据长度判断
        if (message.length() < 100) {
            return smallModel.chat(message);
        } else {
            return largeModel.chat(message);
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习**生产环境部署**——如何将 AI Agent 系统部署到生产环境，包括容器化部署、监控告警、日志管理、故障排查等关键知识。
