---
title: "第十章：LangChain4j 实战"
description: "掌握 Java 生态最流行的 AI 框架 LangChain4j"
---

# 第十章：LangChain4j 实战

## 本章导读

在上一章中，我们学习了 Spring AI 框架，体验了它和 Spring Boot 的无缝集成。但你可能发现，Spring AI 的功能相对基础，对于复杂的 AI 应用（如多步推理、RAG、复杂的 Chain 编排）支持不够丰富。

在学这一章之前，你可能会有这些疑问：

- LangChain4j 是什么？和 Python 的 LangChain 有什么关系？
- LangChain4j 比 Spring AI 强在哪里？
- 什么是 AiService？为什么说是"声明式"的？
- 怎么用 LangChain4j 构建一个完整的 AI 助手？

这一章就是为了解答这些问题。我们会从 **LangChain4j 的架构** 入手，深入学习 **AiService、Chain、工具集成、记忆管理、RAG** 等核心功能，最后构建一个完整的 AI 助手。

---

## 1 为什么需要 LangChain4j？

### 痛点分析

上一章我们用了 Spring AI，但它有一些局限：

1. **功能相对基础**：主要提供 ChatClient、Prompt 模板等基础功能
2. **缺少高级特性**：不支持复杂的 Chain 编排、Agent 推理
3. **RAG 支持有限**：向量存储、文档加载等功能不够完善
4. **社区生态**：相比 Python LangChain，生态还不够丰富

### 解决方案

**LangChain4j** 是 Python LangChain 的 Java 移植版，由社区维护，功能更加丰富。

打个比方：

> **Spring AI** 像一辆家用轿车，日常代步够用。
>
> **LangChain4j** 像一辆越野车，能跑山路、能越野，功能更全面，适合复杂场景。

### LangChain4j vs Spring AI 对比

| 对比项 | Spring AI | LangChain4j |
| --- | --- | --- |
| **维护方** | Spring 官方 | 社区维护 |
| **Spring 集成** | 原生支持 | 需要额外配置 |
| **功能丰富度** | 基础功能 | 功能全面（Chain、Agent、RAG） |
| **模型支持** | OpenAI、Ollama 等 | 支持 20+ 模型提供商 |
| **工具集成** | 基础支持 | 丰富的工具生态 |
| **RAG 支持** | 有限 | 完整的 RAG 流程 |
| **学习曲线** | 平缓 | 稍陡 |
| **适用场景** | 简单 AI 应用 | 复杂 AI 应用 |

---

## 2 LangChain4j 架构概览

### 2.1 核心组件

LangChain4j 的架构分为三层：

```
┌─────────────────────────────────────┐
│         应用层（Application）        │
│  AiService / Chain / Agent          │
├─────────────────────────────────────┤
│         组件层（Components）         │
│  ChatModel / Memory / Tools / RAG   │
├─────────────────────────────────────┤
│         基础设施层（Infrastructure） │
│  模型提供商 / 向量数据库 / 存储      │
└─────────────────────────────────────┘
```

### 2.2 核心组件详解

| 组件 | 作用 | 生活化类比 |
| --- | --- | --- |
| **ChatLanguageModel** | 大语言模型抽象 | 大脑，负责思考 |
| **AiService** | 声明式 AI 服务接口 | 秘书，帮你安排工作 |
| **ChatMemory** | 对话记忆 | 笔记本，记录对话历史 |
| **Tool** | 工具函数 | 工具箱，提供外部能力 |
| **RAG** | 检索增强生成 | 图书管理员，帮你查资料 |
| **EmbeddingModel** | 向量化模型 | 翻译官，把文本转成向量 |
| **EmbeddingStore** | 向量存储 | 图书馆，存储和检索向量 |
| **DocumentLoader** | 文档加载器 | 搬运工，加载各种文档 |
| **DocumentSplitter** | 文档分割器 | 剪刀，把长文档剪成小段 |

---

## 3 环境搭建

### 3.1 引入依赖

在 `pom.xml` 中添加 LangChain4j 依赖：

```xml
<!-- LangChain4j 核心依赖 -->
<dependency>
    <groupId>dev.langchain4j</groupId> <!-- LangChain4j 的 groupId -->
    <artifactId>langchain4j</artifactId> <!-- 核心模块 -->
    <version>0.35.0</version> <!-- 版本号 -->
</dependency>

<!-- OpenAI 模型支持 -->
<dependency>
    <groupId>dev.langchain4j</groupId> <!-- LangChain4j 的 groupId -->
    <artifactId>langchain4j-open-ai</artifactId> <!-- OpenAI 模型模块 -->
    <version>0.35.0</version> <!-- 版本号 -->
</dependency>

<!-- 如果使用 Spring Boot，还需要 Spring Boot Starter -->
<dependency>
    <groupId>dev.langchain4j</groupId> <!-- LangChain4j 的 groupId -->
    <artifactId>langchain4j-spring-boot-starter</artifactId> <!-- Spring Boot 集成 -->
    <version>0.35.0</version> <!-- 版本号 -->
</dependency>
```

### 3.2 配置文件

在 `application.yml` 中配置模型信息：

```yaml
langchain4j:
  open-ai:
    chat-model:
      api-key: ${OPENAI_API_KEY} # 从环境变量读取 API Key
      base-url: https://api.openai.com/v1 # API 地址
      model-name: gpt-3.5-turbo # 模型名称
      temperature: 0.7 # 温度参数
```

---

## 4 AiService 声明式接口

### 4.1 什么是 AiService？

AiService 是 LangChain4j 最核心的功能，它让你用接口的方式定义 AI 服务，就像 MyBatis 的 Mapper 接口一样。

打个比方：

> **传统方式** 调用大模型，就像每次都要手动打电话、记笔记、查资料。
>
> **AiService** 就像配了一个全能秘书，你只需要告诉秘书"我要做什么"，秘书帮你搞定一切。

### 4.2 基础用法

```java
// 定义 AI 服务接口
public interface Assistant {

    // 定义一个对话方法，@SystemMessage 设置系统提示词
    @SystemMessage("你是一个友好的 Java 编程助手，擅长解答 Java 相关问题。")
    String chat(String message); // 接收用户消息，返回 AI 回复

    // 带角色设定的对话方法
    @SystemMessage("你是一个{role}，请用{style}的方式回答问题。")
    String chatWithRole(
            @V("role") String role, // 角色参数
            @V("style") String style, // 风格参数
            String message // 用户消息
    );
}

// 创建 AiService 实例
public class AssistantFactory {

    // 创建 Assistant 实例
    public static Assistant createAssistant() {
        // 创建 OpenAI 聊天模型
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY")) // 设置 API Key
                .modelName("gpt-3.5-turbo") // 设置模型名称
                .temperature(0.7) // 设置温度
                .build(); // 构建模型

        // 使用 AiServices 构建 Assistant
        return AiServices.builder(Assistant.class)
                .chatLanguageModel(model) // 设置聊天模型
                .build(); // 构建 Assistant
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        // 创建 Assistant 实例
        Assistant assistant = AssistantFactory.createAssistant();

        // 调用对话方法
        String response = assistant.chat("什么是 Spring Boot？");
        System.out.println(response); // 输出 AI 回复

        // 调用带角色的对话方法
        String response2 = assistant.chatWithRole(
                "海盗", // 角色
                "夸张", // 风格
                "什么是 Java？" // 问题
        );
        System.out.println(response2); // 输出："啊哈！Java 可是个老古董..."
    }
}
```

### 4.3 AiService 的优势

| 优势 | 说明 |
| --- | --- |
| **声明式** | 用接口定义，不用写实现代码 |
| **类型安全** | 编译时检查，避免运行时错误 |
| **易于测试** | 可以 Mock 接口，方便单元测试 |
| **灵活扩展** | 可以轻松添加记忆、工具、RAG 等功能 |

---

## 5 Chain 构建与组合

### 5.1 什么是 Chain？

Chain 是 LangChain 的核心概念，它把多个组件串联起来，形成完整的工作流。

打个比方：

> **Chain** 就像工厂的流水线。原材料（用户输入）进来，经过多个工序（组件处理），最后产出成品（结果）。

### 5.2 简单 Chain 示例

```java
// 定义一个翻译 Chain
public class TranslationChain {

    private final ChatLanguageModel model; // 聊天模型

    public TranslationChain(ChatLanguageModel model) {
        this.model = model; // 保存模型引用
    }

    // 翻译方法
    public String translate(String text, String targetLanguage) {
        // 构建 Prompt
        String prompt = String.format(
                "请将以下文本翻译成%s，只返回翻译结果：\n\n%s",
                targetLanguage, // 目标语言
                text // 待翻译文本
        );

        // 调用模型并返回结果
        return model.generate(prompt);
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        // 创建模型
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        // 创建翻译 Chain
        TranslationChain chain = new TranslationChain(model);

        // 调用翻译
        String result = chain.translate("Hello, world!", "中文");
        System.out.println(result); // 输出："你好，世界！"
    }
}
```

### 5.3 复杂 Chain 组合

```java
// 定义一个代码审查 Chain，包含多个步骤
public class CodeReviewChain {

    private final ChatLanguageModel model; // 聊天模型

    public CodeReviewChain(ChatLanguageModel model) {
        this.model = model; // 保存模型引用
    }

    // 代码审查方法
    public String review(String code) {
        // 第一步：分析代码问题
        String analysisPrompt = String.format(
                "请分析以下 Java 代码，指出潜在的问题：\n\n%s",
                code // 代码内容
        );
        String analysis = model.generate(analysisPrompt); // 获取分析结果

        // 第二步：生成改进建议
        String suggestionPrompt = String.format(
                "基于以下代码分析结果，给出具体的改进建议：\n\n分析结果：%s\n\n原始代码：%s",
                analysis, // 分析结果
                code // 原始代码
        );
        String suggestions = model.generate(suggestionPrompt); // 获取改进建议

        // 第三步：生成最终报告
        String reportPrompt = String.format(
                "请生成一份代码审查报告，包含以下两部分：\n\n1. 问题分析：\n%s\n\n2. 改进建议：\n%s",
                analysis, // 问题分析
                suggestions // 改进建议
        );
        String report = model.generate(reportPrompt); // 获取最终报告

        return report; // 返回完整报告
    }
}
```

---

## 6 工具集成（@Tool 注解）

### 6.1 什么是工具集成？

工具集成让大模型能够调用你定义的 Java 方法，扩展 AI 的能力边界。

打个比方：

> 大模型就像一个很聪明的顾问，什么都能聊，但不能帮你查数据库、发邮件。
>
> 工具集成就是给这个顾问配了一个工具箱，里面装着各种工具，顾问需要什么就自己拿。

### 6.2 定义工具

```java
// 定义工具类
public class WeatherTools {

    // 使用 @Tool 注解标记工具方法
    @Tool(name = "query_weather", description = "根据城市名称查询当前天气信息")
    // 查询天气方法
    public String queryWeather(
            @P("城市名称，如：北京、上海") String city // 使用 @P 描述参数
    ) {
        // 模拟天气查询（实际项目中调用天气 API）
        return String.format("%s今天晴，气温 25°C，湿度 60%%", city);
    }
}

// 定义订单查询工具
public class OrderTools {

    // 订单查询工具
    @Tool(name = "query_order", description = "根据订单号查询订单详情")
    // 查询订单方法
    public String queryOrder(
            @P("订单号，如：ORD-001") String orderId // 订单号参数
    ) {
        // 模拟订单查询（实际项目中查数据库）
        return String.format("订单 %s 已发货，金额 299.99 元", orderId);
    }
}
```

### 6.3 在 AiService 中使用工具

```java
// 定义带工具的 AI 服务接口
public interface AssistantWithTools {

    // 系统提示词
    @SystemMessage("你是一个智能助手，可以帮用户查询天气和订单信息。")
    // 对话方法
    String chat(String message);
}

// 创建带工具的 AiService
public class AssistantFactory {

    // 创建带工具的 Assistant
    public static AssistantWithTools createAssistantWithTools() {
        // 创建聊天模型
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        // 创建工具实例
        WeatherTools weatherTools = new WeatherTools(); // 天气工具
        OrderTools orderTools = new OrderTools(); // 订单工具

        // 构建带工具的 AiService
        return AiServices.builder(AssistantWithTools.class)
                .chatLanguageModel(model) // 设置聊天模型
                .tools(weatherTools, orderTools) // 注册工具
                .build(); // 构建 Assistant
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        // 创建带工具的 Assistant
        AssistantWithTools assistant = AssistantFactory.createAssistantWithTools();

        // 查询天气
        String response1 = assistant.chat("北京今天天气怎么样？");
        System.out.println(response1); // 输出："北京今天晴，气温 25°C，湿度 60%。"

        // 查询订单
        String response2 = assistant.chat("帮我查一下订单 ORD-001 的状态");
        System.out.println(response2); // 输出："订单 ORD-001 已发货，金额 299.99 元。"
    }
}
```

---

## 7 记忆管理（ChatMemory）

### 7.1 为什么需要记忆？

大模型本身是无状态的，每次对话都是独立的。如果想让 AI 记住之前的对话内容，就需要记忆管理。

打个比方：

> **没有记忆的大模型** 就像金鱼，只有 7 秒记忆，说完就忘。
>
> **有记忆的大模型** 就像有笔记本的人，每次对话都会记下来，下次可以翻看。

### 7.2 ChatMemory 类型

| 类型 | 说明 | 适用场景 |
| --- | --- | --- |
| **MessageWindowChatMemory** | 滑动窗口，只保留最近 N 条消息 | 简单对话，不需要长期记忆 |
| **TokenWindowChatMemory** | 按 Token 数量限制，保留最近 N 个 Token | 控制 Token 消耗 |
| **PersistentChatMemory** | 持久化存储，重启后记忆不丢失 | 需要长期保存对话历史 |

### 7.3 使用 MessageWindowChatMemory

```java
// 定义带记忆的 AI 服务接口
public interface AssistantWithMemory {

    @SystemMessage("你是一个友好的助手，能记住之前的对话内容。")
    String chat(@MemoryId String userId, @UserMessage String message); // 带用户 ID 的对话
}

// 创建带记忆的 AiService
public class AssistantFactory {

    // 创建带记忆的 Assistant
    public static AssistantWithMemory createAssistantWithMemory() {
        // 创建聊天模型
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        // 创建滑动窗口记忆，保留最近 10 条消息
        ChatMemory chatMemory = MessageWindowChatMemory.withMaxMessages(10);

        // 构建带记忆的 AiService
        return AiServices.builder(AssistantWithMemory.class)
                .chatLanguageModel(model) // 设置聊天模型
                .chatMemory(chatMemory) // 设置记忆
                .build(); // 构建 Assistant
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        // 创建带记忆的 Assistant
        AssistantWithMemory assistant = AssistantFactory.createAssistantWithMemory();

        // 第一轮对话
        String response1 = assistant.chat("user1", "我叫小明");
        System.out.println(response1); // 输出："你好，小明！"

        // 第二轮对话（AI 记住了你叫小明）
        String response2 = assistant.chat("user1", "我叫什么名字？");
        System.out.println(response2); // 输出："你叫小明。"
    }
}
```

---

## 8 RAG 支持

### 8.1 什么是 RAG？

RAG（Retrieval-Augmented Generation，检索增强生成）让大模型能够基于外部知识库回答问题，减少幻觉。

打个比方：

> **普通大模型** 像闭卷考试，只能靠记忆回答。
>
> **RAG** 像开卷考试，可以翻书找答案，更准确。

### 8.2 RAG 工作流程

```
1. 文档加载 → 加载 PDF、Word、网页等文档
2. 文档分割 → 把长文档切成小段（Chunk）
3. 向量化 → 把文本转成向量（Embedding）
4. 存储 → 把向量存到向量数据库
5. 检索 → 根据问题检索相关文档
6. 生成 → 把检索到的文档和问题一起发给大模型，生成答案
```

### 8.3 RAG 实战示例

```java
// 定义带 RAG 的 AI 服务接口
public interface AssistantWithRAG {

    @SystemMessage("你是一个知识库问答助手，请根据提供的上下文信息回答用户问题。")
    String chat(String message); // 对话方法
}

// 创建带 RAG 的 AiService
public class AssistantFactory {

    // 创建带 RAG 的 Assistant
    public static AssistantWithRAG createAssistantWithRAG() {
        // 创建聊天模型
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        // 创建嵌入模型（用于把文本转成向量）
        EmbeddingModel embeddingModel = OpenAiEmbeddingModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .modelName("text-embedding-ada-002") // 嵌入模型名称
                .build(); // 构建嵌入模型

        // 创建向量存储（使用内存存储，实际项目中用 Milvus、Pinecone 等）
        EmbeddingStore<TextSegment> embeddingStore = InMemoryEmbeddingStore.builder()
                .build(); // 构建向量存储

        // 加载文档（这里用文本列表模拟，实际项目中加载 PDF、Word 等）
        List<String> documents = List.of(
                "公司退款政策：7天内可无理由退款，超过7天需联系客服处理。",
                "公司发货时间：工作日下单后24小时内发货，周末顺延。",
                "公司客服电话：400-123-4567，工作时间：周一至周五 9:00-18:00。"
        );

        // 文档分割（简单按行分割）
        List<TextSegment> segments = documents.stream()
                .map(TextSegment::from) // 转成 TextSegment
                .toList(); // 收集为列表

        // 向量化并存储
        List<Embedding> embeddings = embeddingModel.embedAll(segments).content(); // 向量化
        embeddingStore.addAll(embeddings, segments); // 存储向量和文本

        // 创建检索器
        EmbeddingStoreContentRetriever retriever = EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore) // 向量存储
                .embeddingModel(embeddingModel) // 嵌入模型
                .maxResults(2) // 最多返回 2 个相关文档
                .minScore(0.7) // 最低相似度阈值
                .build(); // 构建检索器

        // 构建带 RAG 的 AiService
        return AiServices.builder(AssistantWithRAG.class)
                .chatLanguageModel(model) // 设置聊天模型
                .contentRetriever(retriever) // 设置检索器
                .build(); // 构建 Assistant
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        // 创建带 RAG 的 Assistant
        AssistantWithRAG assistant = AssistantFactory.createAssistantWithRAG();

        // 提问
        String response = assistant.chat("公司的退款政策是什么？");
        System.out.println(response); // 输出："根据知识库，公司退款政策是7天内可无理由退款..."
    }
}
```

---

## 9 实战：构建完整的 AI 助手

下面我们把前面学到的知识综合起来，用 LangChain4j 构建一个功能完整的 AI 助手。

### 9.1 需求分析

这个 AI 助手需要具备以下能力：

1. **多轮对话**：能记住之前的对话内容
2. **工具调用**：能查询天气、订单信息
3. **知识库问答**：能基于公司政策文档回答问题
4. **角色设定**：能根据不同场景切换角色

### 9.2 完整代码

```java
// 工具类：天气查询
public class WeatherTools {

    @Tool(name = "query_weather", description = "根据城市名称查询当前天气信息")
    public String queryWeather(@P("城市名称") String city) {
        // 模拟天气查询
        return String.format("%s今天晴，气温 25°C，湿度 60%%", city);
    }
}

// 工具类：订单查询
public class OrderTools {

    @Tool(name = "query_order", description = "根据订单号查询订单详情")
    public String queryOrder(@P("订单号") String orderId) {
        // 模拟订单查询
        return String.format("订单 %s 已发货，金额 299.99 元", orderId);
    }
}

// AI 服务接口
public interface SmartAssistant {

    @SystemMessage("你是一个智能助手，可以帮用户查询天气、订单信息，以及回答公司政策相关问题。")
    String chat(@MemoryId String userId, @UserMessage String message); // 带记忆的对话
}

// AI 助手工厂
public class SmartAssistantFactory {

    // 创建智能助手
    public static SmartAssistant create() {
        // 1. 创建聊天模型
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .modelName("gpt-3.5-turbo")
                .temperature(0.7)
                .build();

        // 2. 创建嵌入模型
        EmbeddingModel embeddingModel = OpenAiEmbeddingModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .modelName("text-embedding-ada-002")
                .build();

        // 3. 创建向量存储
        EmbeddingStore<TextSegment> embeddingStore = InMemoryEmbeddingStore.builder()
                .build();

        // 4. 加载知识库文档
        List<String> documents = List.of(
                "公司退款政策：7天内可无理由退款，超过7天需联系客服处理。",
                "公司发货时间：工作日下单后24小时内发货，周末顺延。",
                "公司客服电话：400-123-4567，工作时间：周一至周五 9:00-18:00。",
                "会员等级：普通会员、银卡会员、金卡会员、钻石会员。",
                "积分规则：消费1元积1分，积分可用于抵扣现金，100积分=1元。"
        );

        // 5. 文档分割
        List<TextSegment> segments = documents.stream()
                .map(TextSegment::from)
                .toList();

        // 6. 向量化并存储
        List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
        embeddingStore.addAll(embeddings, segments);

        // 7. 创建检索器
        EmbeddingStoreContentRetriever retriever = EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(2)
                .minScore(0.7)
                .build();

        // 8. 创建记忆（滑动窗口，保留最近 10 条消息）
        ChatMemory chatMemory = MessageWindowChatMemory.withMaxMessages(10);

        // 9. 创建工具实例
        WeatherTools weatherTools = new WeatherTools();
        OrderTools orderTools = new OrderTools();

        // 10. 构建 AiService
        return AiServices.builder(SmartAssistant.class)
                .chatLanguageModel(model) // 设置聊天模型
                .chatMemory(chatMemory) // 设置记忆
                .tools(weatherTools, orderTools) // 设置工具
                .contentRetriever(retriever) // 设置 RAG 检索器
                .build(); // 构建 Assistant
    }
}

// REST 控制器
@RestController
@RequestMapping("/assistant")
public class SmartAssistantController {

    private final SmartAssistant assistant; // 智能助手实例

    public SmartAssistantController() {
        this.assistant = SmartAssistantFactory.create(); // 创建助手
    }

    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String userId = request.get("userId"); // 获取用户 ID
        String message = request.get("message"); // 获取用户消息
        String reply = assistant.chat(userId, message); // 调用助手
        return Map.of("reply", reply); // 返回回复
    }
}
```

### 9.3 运行效果

```
用户：我叫小明
助手：你好，小明！很高兴认识你。

用户：北京今天天气怎么样？
助手：北京今天晴，气温 25°C，湿度 60%。

用户：公司的退款政策是什么？
助手：根据知识库，公司退款政策是7天内可无理由退款，超过7天需联系客服处理。

用户：帮我查一下订单 ORD-001
助手：订单 ORD-001 已发货，金额 299.99 元。

用户：我叫什么名字？
助手：你叫小明。
```

---

## 10 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **LangChain4j** | Java 生态的 AI 框架，功能比 Spring AI 更丰富 |
| **AiService** | 声明式 AI 服务接口，用接口定义 AI 能力 |
| **Chain** | 链式调用，把多个组件串联成工作流 |
| **@Tool** | 工具注解，让大模型调用 Java 方法 |
| **ChatMemory** | 记忆管理，让大模型记住对话历史 |
| **RAG** | 检索增强生成，基于知识库回答问题 |
| **EmbeddingModel** | 向量化模型，把文本转成向量 |
| **EmbeddingStore** | 向量存储，存储和检索向量 |

---

## 11 新手常见误区

### 误区 1："LangChain4j 和 Spring AI 只能二选一"

不是的。两者可以共存，你可以根据场景选择：

- 简单的 AI 对话功能，用 Spring AI 更方便
- 复杂的 AI 应用（RAG、Agent、Chain），用 LangChain4j 更合适

### 误区 2："AiService 接口可以随便定义方法"

不是的。AiService 接口的方法签名有约束：

- 必须有一个返回类型（String 或自定义对象）
- 参数需要用 `@UserMessage`、`@SystemMessage`、`@MemoryId` 等注解标记
- 不能定义默认方法或静态方法

### 误区 3："工具越多越好"

不是。工具太多会让大模型选择困难，反而降低准确率。建议：

- 只注册当前场景需要的工具
- 工具描述要清晰准确
- 工具功能不要重叠

### 误区 4："RAG 不需要优化"

错。RAG 的效果取决于多个因素：

- **文档分割策略**：切得太大会影响检索精度，切得太小会丢失上下文
- **向量模型选择**：不同模型的效果差异很大
- **检索参数**：`maxResults` 和 `minScore` 需要调优

### 误区 5："记忆越多越好"

不是。记忆太多会消耗大量 Token，增加成本。建议：

- 使用滑动窗口，只保留最近 N 条消息
- 或者使用 Token 限制，控制总 Token 数量
- 对于长期记忆，考虑持久化存储 + 摘要

---

## 12 动手练习

### 练习 1：实现一个带角色切换的 AI 助手

使用 LangChain4j 的 AiService，实现一个能根据用户指令切换角色的 AI 助手。要求：

- 支持"程序员"、"产品经理"、"设计师"三种角色
- 不同角色有不同的回答风格

<details>
<summary>参考答案</summary>

```java
// 定义 AI 服务接口
public interface RoleAssistant {

    @SystemMessage("你是一个{role}，请用{style}的方式回答问题。")
    String chat(
            @V("role") String role, // 角色参数
            @V("style") String style, // 风格参数
            String message // 用户消息
    );
}

// 创建 AiService
public class RoleAssistantFactory {

    public static RoleAssistant create() {
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        return AiServices.builder(RoleAssistant.class)
                .chatLanguageModel(model)
                .build();
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        RoleAssistant assistant = RoleAssistantFactory.create();

        // 程序员角色
        String response1 = assistant.chat("程序员", "严谨", "什么是 Java？");
        System.out.println(response1);

        // 产品经理角色
        String response2 = assistant.chat("产品经理", "通俗易懂", "什么是 Java？");
        System.out.println(response2);
    }
}
```

</details>

### 练习 2：实现一个带持久化记忆的 AI 助手

使用 LangChain4j 的记忆管理，实现一个重启后记忆不丢失的 AI 助手。要求：

- 使用文件存储对话历史
- 重启后能继续之前的对话

<details>
<summary>参考答案</summary>

```java
// 定义 AI 服务接口
public interface PersistentMemoryAssistant {

    @SystemMessage("你是一个友好的助手，能记住之前的对话内容。")
    String chat(@MemoryId String userId, @UserMessage String message);
}

// 创建带持久化记忆的 AiService
public class PersistentMemoryAssistantFactory {

    public static PersistentMemoryAssistant create() {
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        // 创建持久化记忆（使用文件存储）
        ChatMemory chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(10)
                .chatMemoryStore(new FileSystemChatMemoryStore("chat_memory.json")) // 文件存储
                .build();

        return AiServices.builder(PersistentMemoryAssistant.class)
                .chatLanguageModel(model)
                .chatMemory(chatMemory)
                .build();
    }
}

// 文件系统存储实现（简化版）
public class FileSystemChatMemoryStore implements ChatMemoryStore {

    private final String filePath; // 文件路径

    public FileSystemChatMemoryStore(String filePath) {
        this.filePath = filePath; // 保存文件路径
    }

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        // 从文件加载记忆（实际项目中需要实现序列化/反序列化）
        // 这里简化处理，返回空列表
        return new ArrayList<>();
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        // 保存记忆到文件（实际项目中需要实现序列化/反序列化）
        // 这里简化处理，不做任何操作
    }
}
```

</details>

### 练习 3：实现一个能查询数据库的 RAG 助手

使用 LangChain4j 的 RAG 功能，实现一个能基于数据库文档回答问题的助手。要求：

- 加载数据库表结构文档
- 能根据用户问题检索相关表结构
- 生成 SQL 查询语句

<details>
<summary>参考答案</summary>

```java
// 定义 AI 服务接口
public interface DatabaseAssistant {

    @SystemMessage("你是一个数据库专家，请根据提供的表结构信息，帮用户生成 SQL 查询语句。")
    String chat(String message);
}

// 创建带 RAG 的数据库助手
public class DatabaseAssistantFactory {

    public static DatabaseAssistant create() {
        ChatLanguageModel model = OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        EmbeddingModel embeddingModel = OpenAiEmbeddingModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();

        EmbeddingStore<TextSegment> embeddingStore = InMemoryEmbeddingStore.builder()
                .build();

        // 加载数据库表结构文档
        List<String> documents = List.of(
                "用户表（users）：id（主键）、username（用户名）、email（邮箱）、created_at（创建时间）",
                "订单表（orders）：id（主键）、user_id（用户ID）、amount（金额）、status（状态）、created_at（创建时间）",
                "商品表（products）：id（主键）、name（商品名）、price（价格）、stock（库存）"
        );

        List<TextSegment> segments = documents.stream()
                .map(TextSegment::from)
                .toList();

        List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
        embeddingStore.addAll(embeddings, segments);

        EmbeddingStoreContentRetriever retriever = EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(2)
                .minScore(0.7)
                .build();

        return AiServices.builder(DatabaseAssistant.class)
                .chatLanguageModel(model)
                .contentRetriever(retriever)
                .build();
    }
}

// 使用示例
public class Main {
    public static void main(String[] args) {
        DatabaseAssistant assistant = DatabaseAssistantFactory.create();

        String response = assistant.chat("查询所有用户的订单金额总和");
        System.out.println(response); // 输出 SQL 查询语句
    }
}
```

</details>

---

## 下一章预告

下一章我们将学习 **自定义工具开发**。我们会深入学习如何设计高质量的工具、工具注解与元数据、参数校验与类型安全、异常处理策略、工具注册与发现机制，并用 Java 实现常用的工具（数据库查询、API 调用、文件操作、搜索引擎等）。
