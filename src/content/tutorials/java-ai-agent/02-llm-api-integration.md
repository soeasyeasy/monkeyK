---
title: "第二章：大语言模型 API 集成"
description: "掌握主流 LLM API 的接入方式，封装统一的调用接口"
---

# 第二章：大语言模型 API 集成

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何接入 OpenAI、Claude 等大模型 API？
- 国产大模型（通义千问、文心一言）怎么调用？
- 本地模型（Ollama）如何使用？
- 如何封装统一的接口，方便切换不同模型？
- 流式响应（SSE）怎么处理？
- 如何处理 API 调用的错误和重试？

这一章就是为了解答这些问题。我们会学习如何接入主流大模型 API，封装统一的调用接口，处理流式响应，以及实现错误处理与重试机制。

---

## 1 为什么需要统一 API 接口？

### 痛点分析

想象一下这个场景：

你想开发一个 AI 应用，但不同的模型提供商有不同的 API 格式：

- **OpenAI**：用 `messages` 数组，返回 `choices[0].message.content`
- **Claude**：用 `messages` 数组，返回 `content[0].text`
- **通义千问**：用 `input.messages`，返回 `output.text`
- **本地模型**：格式各不相同

每次切换模型都要重写代码，非常麻烦。

### 统一接口的解决方案

打个比方：

> **统一接口**就像一个**万能充电器**：
> - 不管你是 iPhone、Android 还是华为，都能用同一个充电器充电
> - 你不需要为每个手机准备不同的充电器

**统一接口的优势**：

| 优势 | 说明 |
| --- | --- |
| **代码复用** | 写一次代码，支持多个模型 |
| **方便切换** | 只需修改配置，不用改代码 |
| **易于测试** | 可以用 Mock 对象测试 |
| **降低耦合** | 业务逻辑与具体模型解耦 |

---

## 2 OpenAI API 接入

### 1. 添加依赖

```xml
<!-- pom.xml -->
<dependencies>
    <!-- Spring AI OpenAI 启动器 -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
        <version>0.8.0</version>
    </dependency>
</dependencies>
```

### 2. 配置 API Key

```yaml
# application.yml
spring:
  ai:
    openai:
      # OpenAI API Key
      api-key: ${OPENAI_API_KEY}
      # API 地址（可选，用于自定义端点）
      base-url: https://api.openai.com
      chat:
        options:
          # 使用的模型
          model: gpt-3.5-turbo
          # 温度参数（0-2）
          temperature: 0.7
          # 最大 token 数
          max-tokens: 1000
```

### 3. 基础调用示例

```java
// OpenAiChatService.java - OpenAI 聊天服务
package com.example.aiagent.service;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring AI 的 ChatResponse
import org.springframework.ai.chat.model.ChatResponse;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;

// 标记为 Spring 服务
@Service
public class OpenAiChatService {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入 ChatClient
    public OpenAiChatService(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 发送消息并获取回复
    public String chat(String message) {
        // 调用 ChatClient 发送消息
        String response = chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
        // 返回回复
        return response;
    }

    // 发送消息并获取完整响应
    public ChatResponse chatWithResponse(String message) {
        // 调用 ChatClient 发送消息
        ChatResponse response = chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取完整响应对象
                .chatResponse();
        // 返回完整响应
        return response;
    }
}
```

### 4. 参数配置详解

```java
// ChatOptionsExample.java - 聊天参数配置示例
package com.example.aiagent.example;

// 导入 Spring AI 的 OpenAiChatOptions
import org.springframework.ai.openai.OpenAiChatOptions;
// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;

// 标记为 Spring 服务
@Service
public class ChatOptionsExample {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public ChatOptionsExample(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 使用自定义参数调用
    public String chatWithOptions(String message) {
        // 创建聊天选项
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                // 设置模型
                .withModel("gpt-4")
                // 设置温度（0-2，越高越随机）
                .withTemperature(0.8)
                // 设置最大 token 数
                .withMaxTokens(2000)
                // 设置 top-p（核采样）
                .withTopP(0.9)
                // 设置频率惩罚（减少重复）
                .withFrequencyPenalty(0.5)
                // 设置存在惩罚（增加多样性）
                .withPresencePenalty(0.5)
                // 构建选项
                .build();

        // 调用并传入选项
        String response = chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 设置聊天选项
                .options(options)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
        // 返回回复
        return response;
    }
}
```

**参数说明：**

| 参数 | 说明 | 取值范围 | 默认值 |
| --- | --- | --- | --- |
| **model** | 使用的模型 | gpt-3.5-turbo, gpt-4 等 | gpt-3.5-turbo |
| **temperature** | 温度，控制随机性 | 0-2 | 0.7 |
| **max_tokens** | 最大 token 数 | 正整数 | 模型相关 |
| **top_p** | 核采样，控制多样性 | 0-1 | 1 |
| **frequency_penalty** | 频率惩罚，减少重复 | -2 到 2 | 0 |
| **presence_penalty** | 存在惩罚，增加多样性 | -2 到 2 | 0 |

### 5. 流式响应（SSE）

```java
// StreamingChatService.java - 流式聊天服务
package com.example.aiagent.service;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Reactor 的 Flux
import reactor.core.publisher.Flux;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;

// 标记为 Spring 服务
@Service
public class StreamingChatService {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public StreamingChatService(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 流式响应
    public Flux<String> streamChat(String message) {
        // 调用 ChatClient 发送消息
        Flux<String> response = chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 流式调用
                .stream()
                // 获取响应内容流
                .content();
        // 返回响应流
        return response;
    }
}
```

```java
// StreamingController.java - 流式聊天控制器
package com.example.aiagent.controller;

// 导入 Spring Web 的 RestController
import org.springframework.web.bind.annotation.RestController;
// 导入 Spring Web 的 GetMapping
import org.springframework.web.bind.annotation.GetMapping;
// 导入 Spring Web 的 RequestParam
import org.springframework.web.bind.annotation.RequestParam;
// 导入 Reactor 的 Flux
import reactor.core.publisher.Flux;
// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;

// 标记为 REST 控制器
@RestController
public class StreamingController {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public StreamingController(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 定义 GET /stream 接口
    @GetMapping("/stream")
    // 返回 Flux<String> 流式响应
    public Flux<String> streamChat(
            // 接收 message 参数
            @RequestParam String message) {
        // 调用 ChatClient 流式接口
        return chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 流式调用
                .stream()
                // 获取内容流
                .content();
    }
}
```

**流式响应说明：**

- **同步调用**：等待完整响应后返回，适合短文本
- **流式调用**：实时返回响应，适合长文本或需要实时显示的场景

---

## 3 Claude API 接入

### 1. 添加依赖

```xml
<!-- pom.xml -->
<dependencies>
    <!-- Spring AI Anthropic Claude 启动器 -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-anthropic-spring-boot-starter</artifactId>
        <version>0.8.0</version>
    </dependency>
</dependencies>
```

### 2. 配置 API Key

```yaml
# application.yml
spring:
  ai:
    anthropic:
      # Anthropic API Key
      api-key: ${ANTHROPIC_API_KEY}
      chat:
        options:
          # 使用的模型
          model: claude-3-sonnet-20240229
          # 最大 token 数
          max-tokens: 1000
```

### 3. 调用示例

```java
// ClaudeChatService.java - Claude 聊天服务
package com.example.aiagent.service;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;

// 标记为 Spring 服务
@Service
public class ClaudeChatService {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public ClaudeChatService(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 发送消息并获取回复
    public String chat(String message) {
        // 调用 ChatClient 发送消息
        String response = chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
        // 返回回复
        return response;
    }
}
```

---

## 4 国产大模型接入

### 1. 通义千问（阿里云）

**添加依赖：**

```xml
<!-- pom.xml -->
<dependencies>
    <!-- Spring AI 通义千问启动器 -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-tongyi-spring-boot-starter</artifactId>
        <version>0.8.0</version>
    </dependency>
</dependencies>
```

**配置 API Key：**

```yaml
# application.yml
spring:
  ai:
    tongyi:
      # 通义千问 API Key
      api-key: ${TONGYI_API_KEY}
      chat:
        options:
          # 使用的模型
          model: qwen-turbo
```

**调用示例：**

```java
// TongyiChatService.java - 通义千问聊天服务
package com.example.aiagent.service;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;

// 标记为 Spring 服务
@Service
public class TongyiChatService {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public TongyiChatService(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 发送消息并获取回复
    public String chat(String message) {
        // 调用 ChatClient 发送消息
        String response = chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
        // 返回回复
        return response;
    }
}
```

### 2. 文心一言（百度）

**添加依赖：**

```xml
<!-- pom.xml -->
<dependencies>
    <!-- Spring AI 文心一言启动器 -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-ernie-spring-boot-starter</artifactId>
        <version>0.8.0</version>
    </dependency>
</dependencies>
```

**配置 API Key：**

```yaml
# application.yml
spring:
  ai:
    ernie:
      # 文心一言 API Key
      api-key: ${ERNIE_API_KEY}
      # 文心一言 Secret Key
      secret-key: ${ERNIE_SECRET_KEY}
      chat:
        options:
          # 使用的模型
          model: ernie-bot-4
```

---

## 5 本地模型接入（Ollama）

### 1. 安装 Ollama

**Windows 安装：**

1. 访问 https://ollama.com/
2. 下载 Windows 安装包
3. 双击运行安装

**验证安装：**

```bash
# 查看 Ollama 版本
ollama --version
```

### 2. 下载模型

```bash
# 下载 Llama 2 模型
ollama pull llama2

# 下载 Mistral 模型
ollama pull mistral

# 下载 Code Llama 模型
ollama pull codellama

# 查看已下载的模型
ollama list
```

### 3. 运行模型

```bash
# 运行 Llama 2 模型
ollama run llama2

# 在交互界面中输入问题
>>> 你好，请介绍一下你自己
```

### 4. Spring AI 集成

**添加依赖：**

```xml
<!-- pom.xml -->
<dependencies>
    <!-- Spring AI Ollama 启动器 -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-ollama-spring-boot-starter</artifactId>
        <version>0.8.0</version>
    </dependency>
</dependencies>
```

**配置 Ollama：**

```yaml
# application.yml
spring:
  ai:
    ollama:
      # Ollama 服务地址
      base-url: http://localhost:11434
      chat:
        options:
          # 使用的模型
          model: llama2
          # 温度参数
          temperature: 0.7
```

**调用示例：**

```java
// OllamaChatService.java - Ollama 聊天服务
package com.example.aiagent.service;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;

// 标记为 Spring 服务
@Service
public class OllamaChatService {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public OllamaChatService(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 发送消息并获取回复
    public String chat(String message) {
        // 调用 ChatClient 发送消息
        String response = chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
        // 返回回复
        return response;
    }
}
```

---

## 6 封装统一 LLM 客户端接口

### 1. 定义统一接口

```java
// LlmClient.java - 统一 LLM 客户端接口
package com.example.aiagent.client;

// 定义 LLM 客户端接口
public interface LlmClient {

    // 发送消息并获取回复
    String chat(String message);

    // 发送消息并获取回复（带系统提示）
    String chat(String systemPrompt, String userMessage);

    // 流式响应
    reactor.core.publisher.Flux<String> streamChat(String message);
}
```

### 2. 实现 OpenAI 客户端

```java
// OpenAiClientImpl.java - OpenAI 客户端实现
package com.example.aiagent.client;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Reactor 的 Flux
import reactor.core.publisher.Flux;
// 导入 Spring 的 Component 注解
import org.springframework.stereotype.Component;
// 导入 Spring 的 Primary 注解
import org.springframework.context.annotation.Primary;

// 标记为 Spring 组件
@Component
// 标记为主要实现（当有多个实现时优先使用）
@Primary
public class OpenAiClientImpl implements LlmClient {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public OpenAiClientImpl(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 实现 chat 方法
    @Override
    public String chat(String message) {
        // 调用 ChatClient 发送消息
        return chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
    }

    // 实现带系统提示的 chat 方法
    @Override
    public String chat(String systemPrompt, String userMessage) {
        // 调用 ChatClient 发送消息
        return chatClient.prompt()
                // 设置系统消息
                .system(systemPrompt)
                // 设置用户消息
                .user(userMessage)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
    }

    // 实现流式响应方法
    @Override
    public Flux<String> streamChat(String message) {
        // 调用 ChatClient 流式接口
        return chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 流式调用
                .stream()
                // 获取内容流
                .content();
    }
}
```

### 3. 实现 Ollama 客户端

```java
// OllamaClientImpl.java - Ollama 客户端实现
package com.example.aiagent.client;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Reactor 的 Flux
import reactor.core.publisher.Flux;
// 导入 Spring 的 Component 注解
import org.springframework.stereotype.Component;

// 标记为 Spring 组件
@Component
public class OllamaClientImpl implements LlmClient {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public OllamaClientImpl(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 实现 chat 方法
    @Override
    public String chat(String message) {
        // 调用 ChatClient 发送消息
        return chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
    }

    // 实现带系统提示的 chat 方法
    @Override
    public String chat(String systemPrompt, String userMessage) {
        // 调用 ChatClient 发送消息
        return chatClient.prompt()
                // 设置系统消息
                .system(systemPrompt)
                // 设置用户消息
                .user(userMessage)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
    }

    // 实现流式响应方法
    @Override
    public Flux<String> streamChat(String message) {
        // 调用 ChatClient 流式接口
        return chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 流式调用
                .stream()
                // 获取内容流
                .content();
    }
}
```

### 4. 使用统一接口

```java
// ChatService.java - 聊天服务
package com.example.aiagent.service;

// 导入自定义的 LlmClient 接口
import com.example.aiagent.client.LlmClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;

// 标记为 Spring 服务
@Service
public class ChatService {

    // 声明 LlmClient 字段
    private final LlmClient llmClient;

    // 构造器注入
    public ChatService(LlmClient llmClient) {
        // 赋值给字段
        this.llmClient = llmClient;
    }

    // 发送消息并获取回复
    public String chat(String message) {
        // 调用统一接口
        return llmClient.chat(message);
    }

    // 发送消息并获取回复（带系统提示）
    public String chat(String systemPrompt, String userMessage) {
        // 调用统一接口
        return llmClient.chat(systemPrompt, userMessage);
    }
}
```

**切换模型只需修改配置：**

```yaml
# 切换到 OpenAI
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}

# 切换到 Ollama
spring:
  ai:
    ollama:
      base-url: http://localhost:11434
```

---

## 7 错误处理与重试机制

### 1. 基础错误处理

```java
// ChatServiceWithErrorHandling.java - 带错误处理的聊天服务
package com.example.aiagent.service;

// 导入自定义的 LlmClient 接口
import com.example.aiagent.client.LlmClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;
// 导入日志记录器
import org.slf4j.Logger;
// 导入日志工厂
import org.slf4j.LoggerFactory;

// 标记为 Spring 服务
@Service
public class ChatServiceWithErrorHandling {

    // 创建日志记录器
    private static final Logger log = LoggerFactory.getLogger(ChatServiceWithErrorHandling.class);

    // 声明 LlmClient 字段
    private final LlmClient llmClient;

    // 构造器注入
    public ChatServiceWithErrorHandling(LlmClient llmClient) {
        // 赋值给字段
        this.llmClient = llmClient;
    }

    // 发送消息并获取回复（带错误处理）
    public String chat(String message) {
        try {
            // 调用 LLM 客户端
            return llmClient.chat(message);
        } catch (Exception e) {
            // 记录错误日志
            log.error("调用 LLM API 失败: {}", e.getMessage(), e);
            // 返回友好错误信息
            return "抱歉，AI 服务暂时不可用，请稍后再试。";
        }
    }
}
```

### 2. 重试机制

```java
// ChatServiceWithRetry.java - 带重试机制的聊天服务
package com.example.aiagent.service;

// 导入自定义的 LlmClient 接口
import com.example.aiagent.client.LlmClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;
// 导入日志记录器
import org.slf4j.Logger;
// 导入日志工厂
import org.slf4j.LoggerFactory;

// 标记为 Spring 服务
@Service
public class ChatServiceWithRetry {

    // 创建日志记录器
    private static final Logger log = LoggerFactory.getLogger(ChatServiceWithRetry.class);

    // 声明 LlmClient 字段
    private final LlmClient llmClient;

    // 构造器注入
    public ChatServiceWithRetry(LlmClient llmClient) {
        // 赋值给字段
        this.llmClient = llmClient;
    }

    // 发送消息并获取回复（带重试）
    public String chat(String message) {
        // 最大重试次数
        int maxRetries = 3;
        // 当前重试次数
        int retryCount = 0;
        // 最后一次异常
        Exception lastException = null;

        // 重试循环
        while (retryCount < maxRetries) {
            try {
                // 调用 LLM 客户端
                return llmClient.chat(message);
            } catch (Exception e) {
                // 记录异常
                lastException = e;
                // 增加重试次数
                retryCount++;
                // 记录警告日志
                log.warn("调用 LLM API 失败，第 {} 次重试: {}", retryCount, e.getMessage());

                // 如果还有重试机会
                if (retryCount < maxRetries) {
                    try {
                        // 等待一段时间再重试（指数退避）
                        Thread.sleep(1000L * retryCount);
                    } catch (InterruptedException ie) {
                        // 恢复中断状态
                        Thread.currentThread().interrupt();
                        // 抛出运行时异常
                        throw new RuntimeException("重试被中断", ie);
                    }
                }
            }
        }

        // 所有重试都失败，记录错误日志
        log.error("调用 LLM API 失败，已重试 {} 次", maxRetries, lastException);
        // 返回友好错误信息
        return "抱歉，AI 服务暂时不可用，请稍后再试。";
    }
}
```

### 3. 使用 Spring Retry

```xml
<!-- pom.xml -->
<dependencies>
    <!-- Spring Retry -->
    <dependency>
        <groupId>org.springframework.retry</groupId>
        <artifactId>spring-retry</artifactId>
    </dependency>

    <!-- Spring AOP -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-aop</artifactId>
    </dependency>
</dependencies>
```

```java
// ChatServiceWithSpringRetry.java - 使用 Spring Retry 的聊天服务
package com.example.aiagent.service;

// 导入自定义的 LlmClient 接口
import com.example.aiagent.client.LlmClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;
// 导入 Spring Retry 的 Retryable 注解
import org.springframework.retry.annotation.Retryable;
// 导入 Spring Retry 的 Recovery 注解
import org.springframework.retry.annotation.Recover;
// 导入 Spring 的 EnableRetry 注解
import org.springframework.retry.annotation.EnableRetry;
// 导入 Spring 的 Configuration 注解
import org.springframework.context.annotation.Configuration;

// 启用重试功能
@Configuration
@EnableRetry
public class RetryConfig {
}

// 标记为 Spring 服务
@Service
public class ChatServiceWithSpringRetry {

    // 声明 LlmClient 字段
    private final LlmClient llmClient;

    // 构造器注入
    public ChatServiceWithSpringRetry(LlmClient llmClient) {
        // 赋值给字段
        this.llmClient = llmClient;
    }

    // 发送消息并获取回复（带重试）
    @Retryable(
            // 指定要重试的异常类型
            value = {Exception.class},
            // 最大重试次数（包括第一次调用）
            maxAttempts = 3,
            // 重试间隔（毫秒）
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public String chat(String message) {
        // 调用 LLM 客户端
        return llmClient.chat(message);
    }

    // 重试失败后的恢复方法
    @Recover
    public String recover(Exception e, String message) {
        // 返回友好错误信息
        return "抱歉，AI 服务暂时不可用，请稍后再试。";
    }
}
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **统一接口** | 封装不同模型的调用方式，方便切换 |
| **OpenAI API** | 使用 `spring-ai-openai-spring-boot-starter` |
| **Claude API** | 使用 `spring-ai-anthropic-spring-boot-starter` |
| **国产模型** | 通义千问、文心一言等都有对应的 Starter |
| **本地模型** | Ollama 可以在本地运行开源模型 |
| **流式响应** | 使用 `stream()` 方法实现实时响应 |
| **错误处理** | 使用 try-catch 或 Spring Retry 处理异常 |
| **重试机制** | 指数退避策略，避免频繁重试 |

---

## 9 新手常见误区

### 误区 1："API Key 可以写在代码里"

**错！** 把 API Key 写在代码里是严重的安全隐患。

**正确做法：**

```java
// 错误示例
String apiKey = "sk-xxxxxxxxxxxxxxxxxxxxxxxx";  // 绝对不要这样做！

// 正确示例
String apiKey = System.getenv("OPENAI_API_KEY");  // 从环境变量读取
```

### 误区 2："流式响应比同步响应更快"

**错！** 流式响应和同步响应的总时间是一样的，但流式响应可以让用户更早看到部分内容。

**正确理解：**

- **同步响应**：等待完整响应后返回，适合短文本
- **流式响应**：实时返回响应，适合长文本或需要实时显示的场景

### 误区 3："本地模型不需要 API Key"

**对！** 本地模型（如 Ollama）运行在本地，不需要 API Key。

**正确理解：**

- **云端模型**：需要 API Key（OpenAI、Claude、通义千问等）
- **本地模型**：不需要 API Key（Ollama、LM Studio 等）

### 误区 4："温度越高越好"

**错！** 温度参数需要根据场景调整。

**正确理解：**

- **温度低（0-0.5）**：输出更确定、更保守，适合事实性问答
- **温度中（0.5-1.0）**：平衡创造性和准确性，适合一般对话
- **温度高（1.0-2.0）**：输出更随机、更有创意，适合创意写作

### 误区 5："max_tokens 越大越好"

**错！** max_tokens 需要根据实际需求设置。

**正确理解：**

- **max_tokens 过大**：浪费资源，可能生成无关内容
- **max_tokens 过小**：响应被截断，内容不完整
- **合理设置**：根据任务需求设置合适的值

---

## 10 动手练习

### 练习 1：基础练习

**题目**：创建一个简单的聊天服务，实现以下功能：
1. 接收用户输入的问题
2. 调用 OpenAI API 获取回答
3. 返回 AI 的回复

<details>
<summary>点击查看答案</summary>

**答案**：

```java
// SimpleChatService.java
package com.example.aiagent.service;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;

// 标记为 Spring 服务
@Service
public class SimpleChatService {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public SimpleChatService(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 发送消息并获取回复
    public String chat(String message) {
        // 调用 ChatClient 发送消息
        return chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
    }
}
```

</details>

### 练习 2：进阶练习

**题目**：实现一个带重试机制的聊天服务，当 API 调用失败时自动重试 3 次。

<details>
<summary>点击查看答案</summary>

**答案**：

```java
// ChatServiceWithRetry.java
package com.example.aiagent.service;

// 导入自定义的 LlmClient 接口
import com.example.aiagent.client.LlmClient;
// 导入 Spring 的 Service 注解
import org.springframework.stereotype.Service;
// 导入日志记录器
import org.slf4j.Logger;
// 导入日志工厂
import org.slf4j.LoggerFactory;

// 标记为 Spring 服务
@Service
public class ChatServiceWithRetry {

    // 创建日志记录器
    private static final Logger log = LoggerFactory.getLogger(ChatServiceWithRetry.class);

    // 声明 LlmClient 字段
    private final LlmClient llmClient;

    // 构造器注入
    public ChatServiceWithRetry(LlmClient llmClient) {
        // 赋值给字段
        this.llmClient = llmClient;
    }

    // 发送消息并获取回复（带重试）
    public String chat(String message) {
        // 最大重试次数
        int maxRetries = 3;
        // 当前重试次数
        int retryCount = 0;
        // 最后一次异常
        Exception lastException = null;

        // 重试循环
        while (retryCount < maxRetries) {
            try {
                // 调用 LLM 客户端
                return llmClient.chat(message);
            } catch (Exception e) {
                // 记录异常
                lastException = e;
                // 增加重试次数
                retryCount++;
                // 记录警告日志
                log.warn("调用 LLM API 失败，第 {} 次重试: {}", retryCount, e.getMessage());

                // 如果还有重试机会
                if (retryCount < maxRetries) {
                    try {
                        // 等待一段时间再重试
                        Thread.sleep(1000L * retryCount);
                    } catch (InterruptedException ie) {
                        // 恢复中断状态
                        Thread.currentThread().interrupt();
                        // 抛出运行时异常
                        throw new RuntimeException("重试被中断", ie);
                    }
                }
            }
        }

        // 所有重试都失败
        log.error("调用 LLM API 失败，已重试 {} 次", maxRetries, lastException);
        // 返回友好错误信息
        return "抱歉，AI 服务暂时不可用，请稍后再试。";
    }
}
```

</details>

### 练习 3（挑战）：综合练习

**题目**：实现一个统一的 LLM 客户端接口，支持 OpenAI 和 Ollama 两种模型，通过配置切换。

<details>
<summary>点击查看答案</summary>

**答案**：

```java
// LlmClient.java - 统一接口
package com.example.aiagent.client;

// 定义 LLM 客户端接口
public interface LlmClient {
    // 发送消息并获取回复
    String chat(String message);
}

// OpenAiClientImpl.java - OpenAI 实现
package com.example.aiagent.client;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring 的 Component 注解
import org.springframework.stereotype.Component;
// 导入 Spring 的 Primary 注解
import org.springframework.context.annotation.Primary;

// 标记为 Spring 组件
@Component
// 标记为主要实现
@Primary
public class OpenAiClientImpl implements LlmClient {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public OpenAiClientImpl(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 实现 chat 方法
    @Override
    public String chat(String message) {
        // 调用 ChatClient 发送消息
        return chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
    }
}

// OllamaClientImpl.java - Ollama 实现
package com.example.aiagent.client;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring 的 Component 注解
import org.springframework.stereotype.Component;

// 标记为 Spring 组件
@Component
public class OllamaClientImpl implements LlmClient {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入
    public OllamaClientImpl(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 实现 chat 方法
    @Override
    public String chat(String message) {
        // 调用 ChatClient 发送消息
        return chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
    }
}
```

**配置切换：**

```yaml
# 使用 OpenAI
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}

# 使用 Ollama（注释掉 OpenAI 配置）
# spring:
#   ai:
#     ollama:
#       base-url: http://localhost:11434
```

</details>

---

## 下一章预告

下一章我们会学习 **Prompt Engineering 基础**——如何设计有效的 Prompt，让 AI 输出更可控。你会学到 Zero-shot、Few-shot、Chain-of-Thought 等提示技术，以及如何使用模板引擎管理 Prompt。这些是与 AI 有效沟通的关键技能。
