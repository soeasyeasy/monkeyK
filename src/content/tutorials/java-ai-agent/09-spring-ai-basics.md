---
title: "第九章：Spring AI 框架入门"
description: "使用 Spring AI 快速构建 AI 应用，简化 LLM 集成"
---

# 第九章：Spring AI 框架入门

## 本章导读

在前面几章中，我们已经掌握了 AI Agent 的核心概念，学会了如何调用大模型、使用工具、管理记忆。但你可能发现了一个问题：每次都要手动写大量模板代码来调用 LLM、管理会话、解析输出，这太繁琐了。

在学这一章之前，你可能会有这些疑问：

- Spring AI 是什么？和直接用 HTTP 调用大模型有什么区别？
- Spring AI 和 LangChain4j 有什么不同？该选哪个？
- Spring Boot 项目怎么快速接入大模型能力？
- 怎么用 Spring AI 快速搭建一个 AI 应用？

这一章就是为了解答这些问题。我们会从 **Spring AI 的核心概念** 入手，学习 **ChatClient、Prompt 模板、OutputParser、工具集成** 等核心功能，最后用 Spring AI 构建一个简单的 Agent。

---

## 1 为什么需要 Spring AI？

### 痛点分析

假设你要在 Spring Boot 项目中接入大模型，直接调用 HTTP API 会怎样？

```java
// 直接调用 HTTP API，代码冗长且难以维护
@RestController
public class ChatController {

    @PostMapping("/chat")
    public String chat(@RequestBody String userMessage) {
        // 手动构建 HTTP 请求
        HttpClient client = HttpClient.newHttpClient(); // 创建 HTTP 客户端
        String json = """
            {"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"%s"}]}
            """.formatted(userMessage); // 手动拼接 JSON 请求体
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions")) // 设置请求地址
                .header("Content-Type", "application/json") // 设置请求头
                .header("Authorization", "Bearer " + apiKey) // 设置认证信息
                .POST(HttpRequest.BodyPublishers.ofString(json)) // 设置请求体
                .build(); // 构建请求
        HttpResponse<String> response = client.send(request,
                HttpResponse.BodyHandlers.ofString()); // 发送请求并获取响应
        // 手动解析 JSON 响应
        JsonNode node = new ObjectMapper().readTree(response.body()); // 解析 JSON
        return node.path("choices").path(0).path("message").path("content").asText(); // 提取回复内容
    }
}
```

这段代码存在很多问题：

1. **重复代码多**：每次调用大模型都要写一遍 HTTP 请求构建逻辑
2. **没有统一管理**：API Key、模型名称等配置散落在代码中
3. **不支持多模型切换**：换一个大模型就要改大量代码
4. **没有 Prompt 模板**：每次都要手动拼接字符串
5. **没有输出解析**：大模型返回的文本需要手动解析成结构化数据

### 解决方案

**Spring AI** 就是为了解决这些问题而生的。

打个比方：

> **直接调用 HTTP API** 就像每次出门都自己铺路、搭桥。
>
> **Spring AI** 就像一条修好的高速公路，你只需要上车、踩油门，剩下的路它帮你跑。

Spring AI 提供了：

- **统一的模型接口**：换模型只需改配置，不用改代码
- **自动配置**：API Key、模型名称等通过配置文件管理
- **Prompt 模板**：像写 HTML 模板一样写提示词
- **输出解析**：自动把大模型的文本输出转成 Java 对象
- **工具集成**：让大模型调用你的 Java 方法

---

## 2 Spring AI 核心概念

### 2.1 什么是 Spring AI？

Spring AI 是 Spring 生态下的 AI 应用开发框架，由 Spring 官方维护。它的目标是让 Java 开发者用熟悉的 Spring 风格来构建 AI 应用。

### 2.2 核心组件一览

| 组件 | 作用 | 生活化类比 |
| --- | --- | --- |
| **ChatClient** | 与大模型对话的客户端 | 电话，用来和 AI 通话 |
| **ChatModel** | 大模型的抽象接口 | 通讯录里的联系人（GPT、Claude 等） |
| **Prompt** | 发送给大模型的消息 | 你要说的话 |
| **PromptTemplate** | 提示词模板 | 话术模板，填空后就能用 |
| **OutputParser** | 输出解析器 | 翻译官，把 AI 的话转成结构化数据 |
| **FunctionCallback** | 工具函数回调 | 工具箱，让 AI 能调用你的方法 |
| **Advisor** | 拦截器/增强器 | 秘书，在消息发送前后做额外处理 |
| **AutoConfiguration** | 自动配置 | 自动装配线，帮你初始化所有组件 |

### 2.3 Spring AI 与直接调用 HTTP API 的对比

| 对比项 | 直接调用 HTTP API | Spring AI |
| --- | --- | --- |
| **代码量** | 多，每次都要写 HTTP 请求逻辑 | 少，几行代码搞定 |
| **模型切换** | 需要改代码 | 只需改配置文件 |
| **Prompt 管理** | 手动拼接字符串 | 使用模板，支持变量替换 |
| **输出解析** | 手动解析 JSON | 自动转成 Java 对象 |
| **工具集成** | 需要自己实现 | 框架内置支持 |
| **社区生态** | 无 | Spring 生态，文档丰富 |

---

## 3 环境搭建与自动配置

### 3.1 引入依赖

在 `pom.xml` 中添加 Spring AI 相关依赖：

```xml
<!-- Spring AI 核心依赖 -->
<dependency>
    <groupId>org.springframework.ai</groupId> <!-- Spring AI 的 groupId -->
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId> <!-- OpenAI 的 Starter -->
</dependency>

<!-- 如果你想用其他模型，可以替换为对应的 Starter -->
<!-- 例如：spring-ai-ollama-spring-boot-starter（本地模型） -->
<!-- 例如：spring-ai-azure-openai-spring-boot-starter（Azure OpenAI） -->
```

### 3.2 配置文件

在 `application.yml` 中配置模型信息：

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}  # 从环境变量读取 API Key，避免硬编码
      base-url: https://api.openai.com  # API 地址，可以替换为兼容的接口
      chat:
        options:
          model: gpt-3.5-turbo  # 默认使用的模型
          temperature: 0.7  # 温度参数，控制输出的随机性
```

### 3.3 自动配置原理

Spring AI 的 Starter 会自动完成以下工作：

```
1. 读取 application.yml 中的配置（API Key、模型名称等）
2. 创建 ChatModel Bean（如 OpenAiChatModel）
3. 创建 ChatClient Bean（用于与大模型交互）
4. 注册默认的 PromptTemplate、OutputParser 等组件
```

打个比方：

> **自动配置** 就像你去酒店入住，前台已经帮你把房间空调、WiFi、电视都调好了，你直接用就行，不需要自己一个个设置。

你只需要注入 Bean 就能使用：

```java
@RestController
public class ChatController {

    private final ChatClient chatClient; // 注入 Spring AI 自动创建的 ChatClient

    // 通过构造器注入 ChatClient
    public ChatController(ChatClient chatClient) {
        this.chatClient = chatClient; // 保存 ChatClient 引用
    }

    @GetMapping("/chat")
    public String chat(@RequestParam String message) {
        // 一行代码就能和大模型对话
        return chatClient.prompt()
                .user(message) // 设置用户消息
                .call() // 发起调用
                .content(); // 获取回复内容
    }
}
```

---

## 4 ChatClient 详解

### 4.1 ChatClient 是什么？

ChatClient 是 Spring AI 中最常用的组件，它封装了与大模型交互的所有逻辑。

打个比方：

> **ChatClient** 就像一部电话。你拿起电话（创建请求）、拨号（设置参数）、说话（发送消息）、听对方回复（获取响应），整个过程非常简单。

### 4.2 基础用法

```java
@Service
public class ChatService {

    private final ChatClient chatClient; // 注入 ChatClient

    public ChatService(ChatClient.Builder builder) {
        // 使用 Builder 创建 ChatClient，可以设置默认参数
        this.chatClient = builder
                .defaultSystem("你是一个友好的 Java 编程助手") // 设置默认的系统提示词
                .build(); // 构建 ChatClient
    }

    // 简单对话
    public String simpleChat(String userMessage) {
        return chatClient.prompt()
                .user(userMessage) // 设置用户消息
                .call() // 发起调用
                .content(); // 获取文本回复
    }

    // 带系统提示词的对话
    public String chatWithSystem(String systemPrompt, String userMessage) {
        return chatClient.prompt()
                .system(systemPrompt) // 覆盖默认的系统提示词
                .user(userMessage) // 设置用户消息
                .call() // 发起调用
                .content(); // 获取文本回复
    }

    // 流式对话（打字机效果）
    public Flux<String> streamChat(String userMessage) {
        return chatClient.prompt()
                .user(userMessage) // 设置用户消息
                .stream() // 使用流式调用
                .content(); // 获取流式文本回复
    }
}
```

### 4.3 ChatClient 的调用方式对比

| 调用方式 | 方法 | 返回值 | 适用场景 |
| --- | --- | --- | --- |
| **同步调用** | `.call().content()` | `String` | 简单的问答场景 |
| **流式调用** | `.stream().content()` | `Flux<String>` | 打字机效果，提升用户体验 |
| **完整响应** | `.call().chatResponse()` | `ChatResponse` | 需要获取 Token 用量等元数据 |

---

## 5 Prompt 模板

### 5.1 为什么需要 Prompt 模板？

直接拼接字符串写 Prompt 很容易出错，也不好维护：

```java
// 不好的做法：手动拼接 Prompt
String prompt = "你是一个翻译专家，请把以下中文翻译成" + language + "：" + text;
// 问题：拼接麻烦，不好维护，容易出错
```

### 5.2 PromptTemplate 基础用法

Spring AI 提供了 `PromptTemplate`，支持变量替换：

```java
@Service
public class TranslateService {

    private final ChatClient chatClient; // 注入 ChatClient

    public TranslateService(ChatClient chatClient) {
        this.chatClient = chatClient; // 保存引用
    }

    // 使用 PromptTemplate 实现翻译功能
    public String translate(String text, String targetLanguage) {
        // 创建 Prompt 模板，{text} 和 {language} 是占位符
        PromptTemplate template = new PromptTemplate(
                "你是一个专业翻译。请把以下中文翻译成{language}，只返回翻译结果，不要解释。\n\n中文：{text}"
        );
        // 用实际值替换模板中的占位符
        Prompt prompt = template.create(Map.of(
                "text", text, // 替换 {text}
                "language", targetLanguage // 替换 {language}
        ));
        // 发送 Prompt 并获取回复
        return chatClient.prompt(prompt)
                .call() // 发起调用
                .content(); // 获取回复
    }
}
```

### 5.3 从文件加载模板

当 Prompt 很长时，可以把模板放在文件中：

```
// 文件路径：src/main/resources/prompts/code-review.txt
你是一个资深的 Java 代码审查专家。请审查以下代码，指出潜在的问题和改进建议。

代码语言：{language}
代码内容：
{code}

请按以下格式输出：
1. 代码问题（列出发现的问题）
2. 改进建议（给出具体的修改方案）
3. 代码评分（1-10 分）
```

```java
@Service
public class CodeReviewService {

    private final ChatClient chatClient; // 注入 ChatClient

    public CodeReviewService(ChatClient chatClient) {
        this.chatClient = chatClient; // 保存引用
    }

    // 从文件加载 Prompt 模板
    public String reviewCode(String code, String language) {
        // 从 classpath 加载模板文件
        PromptTemplate template = new PromptTemplate(
                new ClassPathResource("prompts/code-review.txt")
        );
        // 创建 Prompt，传入变量值
        Prompt prompt = template.create(Map.of(
                "code", code, // 替换 {code}
                "language", language // 替换 {language}
        ));
        // 发送 Prompt 并获取回复
        return chatClient.prompt(prompt)
                .call() // 发起调用
                .content(); // 获取回复
    }
}
```

---

## 6 OutputParser 输出解析

### 6.1 为什么需要 OutputParser？

大模型返回的是纯文本，但我们的程序通常需要结构化的 Java 对象：

```java
// 大模型返回的文本
String response = "北京今天晴，气温 25 度，湿度 60%";
// 但你的程序需要的是 WeatherInfo 对象
// 怎么把文本转成对象？手动正则匹配？太不靠谱了
```

### 6.2 BeanOutputParser

Spring AI 提供了 `BeanOutputParser`，可以自动把大模型的文本输出转成 Java 对象：

```java
// 定义返回结果的 Java 类
public class WeatherInfo {
    private String city; // 城市名称
    private String weather; // 天气状况
    private int temperature; // 温度
    private int humidity; // 湿度

    // 省略 getter 和 setter
}

@Service
public class WeatherService {

    private final ChatClient chatClient; // 注入 ChatClient

    public WeatherService(ChatClient chatClient) {
        this.chatClient = chatClient; // 保存引用
    }

    // 查询天气并自动解析为 Java 对象
    public WeatherInfo getWeather(String city) {
        // 创建 OutputParser，告诉它我们要 WeatherInfo 类型的结果
        BeanOutputParser<WeatherInfo> parser = new BeanOutputParser<>(WeatherInfo.class);

        // 构建 Prompt，在末尾加上格式要求
        String promptText = """
                请查询%s的天气信息，返回 JSON 格式的结果。
                %s
                """;
        Prompt prompt = new Prompt(promptText.formatted(
                city, // 城市名称
                parser.getFormat() // 自动生成的格式说明，告诉大模型返回什么格式
        ));

        // 调用大模型
        String response = chatClient.prompt(prompt)
                .call() // 发起调用
                .content(); // 获取文本回复

        // 自动解析为 WeatherInfo 对象
        return parser.parse(response);
    }
}
```

### 6.3 常用 OutputParser 对比

| OutputParser 类型 | 作用 | 适用场景 |
| --- | --- | --- |
| **BeanOutputParser** | 把输出转成 Java Bean | 返回结构化对象（如天气信息、用户信息） |
| **ListOutputParser** | 把输出转成 List | 返回列表数据（如推荐列表） |
| **MapOutputParser** | 把输出转成 Map | 返回键值对数据 |

---

## 7 工具集成（Function Calling）

### 7.1 什么是工具集成？

工具集成就是让大模型能够调用你定义的 Java 方法。

打个比方：

> 大模型就像一个很聪明的顾问，什么都能聊，但它不能帮你查数据库、发快递。
>
> 工具集成就是给这个顾问配了一个工具箱，里面装着各种工具（查数据库、发快递、查天气等），顾问需要什么工具就自己拿。

### 7.2 定义工具函数

```java
// 定义一个查询订单的工具函数
@Component
public class OrderTools {

    // 使用 @Description 注解描述工具的功能，大模型会根据这个描述决定何时调用
    @Description("根据订单号查询订单信息，返回订单状态、金额等信息")
    // 定义工具方法，接收订单号参数
    public OrderInfo queryOrder(@JsonProperty("orderId") String orderId) {
        // 模拟查询数据库
        OrderInfo order = new OrderInfo(); // 创建订单对象
        order.setOrderId(orderId); // 设置订单号
        order.setStatus("已发货"); // 设置订单状态
        order.setAmount(299.99); // 设置订单金额
        return order; // 返回订单信息
    }
}
```

### 7.3 注册和使用工具

```java
@Service
public class AgentService {

    private final ChatClient chatClient; // 注入 ChatClient

    public AgentService(ChatClient.Builder builder, OrderTools orderTools) {
        // 构建 ChatClient 并注册工具函数
        this.chatClient = builder
                .defaultFunctions(orderTools) // 注册工具，让大模型可以调用
                .build(); // 构建 ChatClient
    }

    // 带工具调用的对话
    public String chatWithTools(String userMessage) {
        return chatClient.prompt()
                .user(userMessage) // 设置用户消息
                .call() // 发起调用（如果大模型决定调用工具，会自动执行）
                .content(); // 获取最终回复
    }
}

// 使用示例
// 用户问："帮我查一下订单 ORD-001 的状态"
// 大模型会自动识别需要调用 queryOrder 方法，获取结果后生成自然语言回复
// 最终返回："您的订单 ORD-001 已发货，金额为 299.99 元。"
```

---

## 8 Advisor 拦截器

### 8.1 什么是 Advisor？

Advisor 是 Spring AI 的拦截机制，可以在消息发送给大模型之前和之后进行处理。

打个比方：

> **Advisor** 就像公司前台的秘书。你打电话（发送消息）时，秘书会先帮你整理资料、补充背景信息；对方回复后，秘书还会帮你翻译、总结。

### 8.2 常用 Advisor

```java
@Service
public class ChatService {

    private final ChatClient chatClient; // 注入 ChatClient

    public ChatService(ChatClient.Builder builder) {
        this.chatClient = builder
                // 添加日志 Advisor，自动记录每次对话的请求和响应
                .defaultAdvisors(new SimpleLoggerAdvisor())
                .build(); // 构建 ChatClient
    }

    // 带记忆的对话（使用 MessageChatMemoryAdvisor）
    public String chatWithMemory(String conversationId, String userMessage) {
        // 创建内存中的聊天记录存储
        ChatMemory memory = new InMemoryChatMemory();
        return chatClient.prompt()
                .user(userMessage) // 设置用户消息
                // 添加记忆 Advisor，自动管理对话历史
                .advisors(new MessageChatMemoryAdvisor(memory, conversationId))
                .call() // 发起调用
                .content(); // 获取回复
    }
}
```

---

## 9 实战：使用 Spring AI 构建简单 Agent

下面我们把前面学到的知识综合起来，用 Spring AI 构建一个能够查询天气和订单的简单 Agent。

### 9.1 完整代码

```java
// 天气查询工具
@Component
public class WeatherTools {

    // 描述工具功能，大模型据此判断何时调用
    @Description("根据城市名称查询当前天气信息")
    // 查询天气的方法
    public WeatherInfo queryWeather(
            @JsonProperty("city") String city // 城市名称参数
    ) {
        // 模拟天气查询（实际项目中调用天气 API）
        WeatherInfo info = new WeatherInfo(); // 创建天气信息对象
        info.setCity(city); // 设置城市
        info.setWeather("晴"); // 设置天气
        info.setTemperature(25); // 设置温度
        info.setHumidity(60); // 设置湿度
        return info; // 返回天气信息
    }
}

// 订单查询工具
@Component
public class OrderTools {

    // 描述工具功能
    @Description("根据订单号查询订单详情")
    // 查询订单的方法
    public OrderInfo queryOrder(
            @JsonProperty("orderId") String orderId // 订单号参数
    ) {
        // 模拟订单查询（实际项目中查数据库）
        OrderInfo order = new OrderInfo(); // 创建订单对象
        order.setOrderId(orderId); // 设置订单号
        order.setStatus("已发货"); // 设置状态
        order.setAmount(299.99); // 设置金额
        return order; // 返回订单信息
    }
}

// Agent 服务
@Service
public class SimpleAgentService {

    private final ChatClient chatClient; // 注入 ChatClient

    // 构造器注入，同时注册所有工具
    public SimpleAgentService(
            ChatClient.Builder builder, // 注入 ChatClient 构建器
            WeatherTools weatherTools, // 注入天气工具
            OrderTools orderTools // 注入订单工具
    ) {
        this.chatClient = builder
                // 设置系统提示词，定义 Agent 的角色
                .defaultSystem("你是一个智能助手，可以帮用户查询天气和订单信息。请根据用户的问题，调用合适的工具获取信息，然后用自然语言回复用户。")
                // 注册工具函数
                .defaultFunctions(weatherTools, orderTools)
                .build(); // 构建 ChatClient
    }

    // Agent 对话入口
    public String chat(String userMessage) {
        return chatClient.prompt()
                .user(userMessage) // 设置用户消息
                .call() // 发起调用
                .content(); // 获取回复
    }
}

// REST 控制器，暴露 HTTP 接口
@RestController
@RequestMapping("/agent")
public class AgentController {

    private final SimpleAgentService agentService; // 注入 Agent 服务

    public AgentController(SimpleAgentService agentService) {
        this.agentService = agentService; // 保存引用
    }

    // 对话接口
    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message"); // 获取用户消息
        String reply = agentService.chat(message); // 调用 Agent
        return Map.of("reply", reply); // 返回回复
    }
}
```

### 9.2 运行效果

```
用户：北京今天天气怎么样？
Agent：北京今天天气晴朗，气温 25 度，湿度 60%。

用户：帮我查一下订单 ORD-001 的状态
Agent：您的订单 ORD-001 已发货，金额为 299.99 元。

用户：今天适合出门吗？
Agent：根据北京的天气情况，今天晴朗，气温适宜，非常适合出门活动。
```

---

## 10 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Spring AI** | Spring 生态的 AI 应用开发框架，简化大模型集成 |
| **ChatClient** | 与大模型对话的核心组件，支持同步和流式调用 |
| **PromptTemplate** | 提示词模板，支持变量替换和文件加载 |
| **OutputParser** | 输出解析器，自动把文本转成 Java 对象 |
| **FunctionCallback** | 工具集成，让大模型调用 Java 方法 |
| **Advisor** | 拦截器机制，可在消息前后做额外处理 |
| **AutoConfiguration** | 自动配置，通过 Starter 快速接入 |

---

## 11 新手常见误区

### 误区 1："Spring AI 和 LangChain4j 是一样的，随便选一个就行"

不完全对。虽然两者都是 Java AI 框架，但侧重点不同：

- **Spring AI**：Spring 官方出品，和 Spring Boot 集成度最高，适合已经在用 Spring 的项目
- **LangChain4j**：LangChain 的 Java 移植版，功能更丰富（Chain、Agent、RAG 等），社区更活跃

如果你已经在使用 Spring Boot，Spring AI 接入最方便；如果你需要更丰富的 AI 功能（如复杂的 Chain 编排、RAG），LangChain4j 可能更合适。

### 误区 2："用了 Spring AI 就不需要关心 Prompt 了"

错。Spring AI 只是帮你管理 Prompt 模板，但 Prompt 的质量仍然决定了大模型的输出质量。框架再好，垃圾 Prompt 进去，垃圾结果出来。

### 误区 3："OutputParser 总是能正确解析"

不一定。大模型有时候返回的格式不符合预期，OutputParser 解析就会失败。实际项目中需要加上异常处理：

```java
try {
    WeatherInfo info = parser.parse(response); // 尝试解析
} catch (Exception e) {
    // 解析失败时的降级处理
    log.error("解析大模型输出失败: {}", e.getMessage()); // 记录错误日志
    // 返回默认值或重新请求
}
```

### 误区 4："工具函数越多越好"

不是。工具太多会让大模型的选择变多，反而可能选错工具或频繁调用不必要的工具。建议：

- 只注册当前场景需要的工具
- 工具描述要清晰准确
- 工具功能不要重叠

---

## 12 动手练习

### 练习 1：实现一个翻译服务

使用 Spring AI 的 `PromptTemplate` 和 `ChatClient`，实现一个支持多语言翻译的服务。要求：

- 输入：待翻译文本 + 目标语言
- 输出：翻译结果
- 使用 `PromptTemplate` 管理提示词

<details>
<summary>参考答案</summary>

```java
@Service
public class TranslateService {

    private final ChatClient chatClient; // 注入 ChatClient

    public TranslateService(ChatClient chatClient) {
        this.chatClient = chatClient; // 保存引用
    }

    // 翻译方法
    public String translate(String text, String targetLanguage) {
        // 创建翻译模板
        PromptTemplate template = new PromptTemplate(
                "你是一个专业翻译。请将以下文本翻译成{language}，只返回翻译结果。\n\n原文：{text}"
        );
        // 填充模板变量
        Prompt prompt = template.create(Map.of(
                "text", text, // 待翻译文本
                "language", targetLanguage // 目标语言
        ));
        // 调用大模型并返回结果
        return chatClient.prompt(prompt).call().content();
    }
}
```

</details>

### 练习 2：实现一个带记忆的多轮对话服务

使用 Spring AI 的 `Advisor` 机制，实现一个能记住上下文的多轮对话服务。要求：

- 每个用户有独立的对话历史
- 大模型能记住之前说过的内容

<details>
<summary>参考答案</summary>

```java
@Service
public class MemoryChatService {

    private final ChatClient chatClient; // 注入 ChatClient
    private final ChatMemory chatMemory; // 注入聊天记忆

    public MemoryChatService(ChatClient.Builder builder) {
        // 使用内存存储聊天记录
        this.chatMemory = new InMemoryChatMemory();
        this.chatClient = builder.build(); // 构建 ChatClient
    }

    // 带记忆的对话方法
    public String chat(String userId, String userMessage) {
        return chatClient.prompt()
                .user(userMessage) // 设置用户消息
                // 添加记忆 Advisor，用 userId 区分不同用户的对话历史
                .advisors(new MessageChatMemoryAdvisor(chatMemory, userId))
                .call() // 发起调用
                .content(); // 获取回复
    }
}
```

</details>

### 练习 3：实现一个能查询数据库的 Agent

使用 Spring AI 的工具集成，实现一个能查询用户信息的 Agent。要求：

- 定义一个 `queryUser` 工具函数
- 大模型能根据用户问题自动调用该工具

<details>
<summary>参考答案</summary>

```java
// 用户查询工具
@Component
public class UserTools {

    // 描述工具功能
    @Description("根据用户名或 ID 查询用户信息")
    // 查询用户方法
    public UserInfo queryUser(@JsonProperty("nameOrId") String nameOrId) {
        // 模拟数据库查询
        UserInfo user = new UserInfo(); // 创建用户对象
        user.setId("U001"); // 设置用户 ID
        user.setName("张三"); // 设置用户名
        user.setEmail("zhangsan@example.com"); // 设置邮箱
        return user; // 返回用户信息
    }
}

// Agent 服务
@Service
public class UserAgentService {

    private final ChatClient chatClient; // 注入 ChatClient

    public UserAgentService(ChatClient.Builder builder, UserTools userTools) {
        this.chatClient = builder
                .defaultSystem("你是一个用户信息查询助手，可以帮用户查询人员信息。") // 系统提示词
                .defaultFunctions(userTools) // 注册工具
                .build(); // 构建 ChatClient
    }

    // 对话方法
    public String chat(String message) {
        return chatClient.prompt()
                .user(message) // 用户消息
                .call() // 调用
                .content(); // 获取回复
    }
}
```

</details>

---

## 下一章预告

下一章我们将学习 **LangChain4j 实战**。LangChain4j 是 Java 生态中功能最丰富的 AI 框架，我们会深入学习它的 **AiService 声明式接口、Chain 构建、工具集成、记忆管理、RAG 支持** 等核心功能，并构建一个完整的 AI 助手。
