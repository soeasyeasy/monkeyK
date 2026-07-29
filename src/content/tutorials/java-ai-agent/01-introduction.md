---
title: "第一章：AI Agent 概述与环境搭建"
description: "了解 AI Agent 的核心概念，搭建 Java AI 开发环境"
---

# 第一章：AI Agent 概述与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- AI Agent 到底是什么？它和 ChatGPT 有什么区别？
- 为什么需要用 Java 来开发 AI Agent？
- Java 做 AI 开发有什么优势？
- 我需要准备哪些工具和知识？

这一章就是为了解答这些问题。我们会先搞清楚 **AI Agent 是什么、能做什么**，再动手搭建 Java AI 开发环境，最后写出你的第一个 AI 对话程序。

---

## 1 为什么需要 AI Agent？

### 痛点分析

想象一下这个场景：

你有一个很聪明的助手（大语言模型），他能回答问题、写文章、翻译语言。但是，当你让他帮你查天气、订机票、发邮件时，他却说："抱歉，我做不到。"

这就是**传统大语言模型的局限**——它只能"说"，不能"做"。

### AI Agent 的解决方案

AI Agent 就像给大语言模型**装上了手脚**，让它不仅能思考，还能行动。

打个比方：

> **传统大模型**就像一个被关在房间里的天才，你问他问题他能回答，但他看不到外面，也出不去。
>
> **AI Agent**就像给这个天才配了手机、电脑、汽车，他不仅能思考，还能查资料、打电话、开车去办事。

### 传统 ChatBot vs AI Agent

| 对比项 | 传统 ChatBot | AI Agent |
| --- | --- | --- |
| **能力范围** | 只能对话 | 能对话 + 能行动 |
| **工具使用** | 不能调用外部工具 | 可以调用 API、数据库、文件等 |
| **决策能力** | 固定流程 | 自主决策，灵活应变 |
| **记忆能力** | 无记忆或简单记忆 | 长期记忆 + 短期记忆 |
| **任务执行** | 单轮问答 | 多步骤复杂任务 |
| **适应性** | 固定场景 | 通用场景 |

### 生活化类比

想象你要组织一场聚会：

- **传统 ChatBot**：你问它"聚会怎么组织？"，它会给你一份清单，但不会帮你执行。
- **AI Agent**：你告诉它"帮我组织一场 20 人的聚会"，它会：
  1. 查询每个人的日程（调用日历 API）
  2. 找一个大家都空闲的时间（自主决策）
  3. 预订餐厅（调用订餐 API）
  4. 发送邀请邮件（调用邮件 API）
  5. 最后告诉你："搞定了，周六晚上 7 点，XX 餐厅"

> **一句话总结**：AI Agent = 大语言模型 + 工具调用 + 自主决策 + 记忆系统

---

## 2 AI Agent 核心概念

### 什么是 AI Agent？

AI Agent（人工智能智能体）是一个能够**感知环境、自主决策、采取行动**的系统。

**AI Agent 的核心组件**：

```
AI Agent = LLM（大脑） + Tools（手脚） + Memory（记忆） + Planning（规划）
```

1. **LLM（大语言模型）**：负责理解用户意图、推理决策
2. **Tools（工具）**：提供外部能力，如搜索、计算、调用 API
3. **Memory（记忆）**：存储对话历史和知识
4. **Planning（规划）**：把复杂任务拆解成小步骤

### AI Agent 的工作流程

```
用户输入 → LLM 理解意图 → 规划任务 → 调用工具 → 观察结果 → 继续推理 → 输出最终结果
```

打个比方：

> AI Agent 就像一个**私人助理**：
> 1. 听你说需求（理解意图）
> 2. 想想怎么做（规划任务）
> 3. 打电话、查资料（调用工具）
> 4. 看看结果如何（观察结果）
> 5. 继续处理或汇报结果（继续推理或输出）

### AI Agent 的应用场景

| 场景 | 说明 | 示例 |
| --- | --- | --- |
| **智能客服** | 自动回答用户问题，处理工单 | 电商客服、银行客服 |
| **代码助手** | 理解代码、生成代码、调试代码 | GitHub Copilot、Cursor |
| **数据分析** | 分析数据、生成报告 | 财务报表分析、销售数据分析 |
| **自动化办公** | 处理邮件、安排日程、整理文档 | 邮件自动回复、会议安排 |
| **智能搜索** | 搜索信息、总结内容 | 知识库问答、文档检索 |
| **游戏 NPC** | 智能 NPC 行为决策 | 游戏角色对话、任务系统 |

---

## 3 Java AI 开发生态概览

### 为什么用 Java 开发 AI Agent？

Java 是企业级应用的主流语言，用 Java 开发 AI Agent 有以下优势：

| 优势 | 说明 |
| --- | --- |
| **企业级生态** | Spring、Spring Boot 等成熟框架，适合构建生产级应用 |
| **类型安全** | 编译时检查，减少运行时错误 |
| **性能稳定** | JVM 优化，适合高并发场景 |
| **工具链完善** | Maven/Gradle 依赖管理、IDE 支持、调试工具 |
| **团队技能** | 大量 Java 开发者可以快速上手 |
| **集成能力** | 与企业现有系统（数据库、消息队列、微服务）无缝集成 |

### Java AI 开发框架对比

目前 Java 生态中有三个主流的 AI 开发框架：

| 框架 | 特点 | 适用场景 | 学习曲线 |
| --- | --- | --- | --- |
| **Spring AI** | Spring 官方出品，与 Spring Boot 深度集成 | Spring 生态项目、企业级应用 | 低（熟悉 Spring 即可） |
| **LangChain4j** | LangChain 的 Java 移植版，功能全面 | 通用 AI 应用开发、Agent 开发 | 中 |
| **Semantic Kernel** | 微软出品，支持 Java/C#/Python | 微软生态项目、企业 AI 应用 | 中 |

### Spring AI 简介

Spring AI 是 Spring 官方推出的 AI 开发框架，它提供了：

- **统一的模型接口**：支持 OpenAI、Azure OpenAI、Ollama 等多种模型
- **Prompt 模板**：类似 Thymeleaf 的模板引擎
- **输出解析**：把 AI 输出转成 Java 对象
- **工具调用**：让 AI 调用 Java 方法
- **RAG 支持**：检索增强生成
- **向量数据库**：支持多种向量数据库

### LangChain4j 简介

LangChain4j 是 LangChain 的 Java 实现，它提供了：

- **完整的 Agent 框架**：支持 ReAct、Plan-and-Execute 等模式
- **丰富的工具集成**：搜索、计算、数据库、API 调用
- **记忆系统**：短期记忆、长期记忆
- **RAG 支持**：文档加载、分割、向量化、检索
- **多模型支持**：OpenAI、Claude、本地模型等

### 框架选择建议

| 场景 | 推荐框架 |
| --- | --- |
| 已有 Spring Boot 项目 | Spring AI |
| 需要完整的 Agent 功能 | LangChain4j |
| 微软生态项目 | Semantic Kernel |
| 快速原型开发 | Spring AI 或 LangChain4j |
| 企业级生产环境 | Spring AI（与 Spring 生态集成更好） |

::: tip 新手推荐

本教程以 **Spring AI** 为主，因为它与 Spring Boot 深度集成，学习曲线平缓，适合 Java 开发者快速上手。同时也会介绍 LangChain4j 的核心概念，让你全面了解 Java AI 开发生态。

:::

---

## 4 开发环境搭建

### 1. 安装 JDK

AI Agent 开发需要 **JDK 17 或更高版本**（推荐 JDK 21）。

**检查当前 Java 版本：**

```bash
# 查看 Java 版本
java -version
# 如果版本低于 17，需要升级
```

**安装 JDK 17/21：**

| 版本 | 说明 | 下载地址 |
| --- | --- | --- |
| Oracle JDK 21 | 官方版本 | https://www.oracle.com/java/technologies/downloads/ |
| Adoptium JDK 21 | 开源免费（推荐） | https://adoptium.net/ |
| Amazon Corretto 21 | AWS 维护 | https://aws.amazon.com/corretto/ |

::: tip 推荐选择

推荐使用 **Adoptium（Eclipse Temurin）JDK 21**，免费且长期支持。

:::

### 2. 安装 Maven 或 Gradle

**Maven 安装（推荐新手）：**

```bash
# 1. 下载 Maven
# 访问 https://maven.apache.org/download.cgi 下载最新版

# 2. 解压到指定目录
# 例如：C:\Program Files\Apache\maven

# 3. 配置环境变量
MAVEN_HOME = C:\Program Files\Apache\maven
Path 添加 = %MAVEN_HOME%\bin

# 4. 验证安装
mvn -version
```

**Gradle 安装：**

```bash
# 1. 下载 Gradle
# 访问 https://gradle.org/releases/ 下载最新版

# 2. 解压到指定目录
# 例如：C:\Program Files\Gradle

# 3. 配置环境变量
GRADLE_HOME = C:\Program Files\Gradle
Path 添加 = %GRADLE_HOME%\bin

# 4. 验证安装
gradle -version
```

| 构建工具 | 优点 | 缺点 | 推荐场景 |
| --- | --- | --- | --- |
| **Maven** | 配置简单、学习曲线低、文档丰富 | 构建速度较慢 | 新手、传统项目 |
| **Gradle** | 构建速度快、灵活性强 | 学习曲线较陡 | 大型项目、Android 开发 |

::: tip 新手推荐

**推荐使用 Maven**，配置简单，文档丰富，适合快速上手。

:::

### 3. 配置 API Key

要使用 OpenAI 等大模型 API，需要配置 API Key。

**获取 OpenAI API Key：**

1. 访问 https://platform.openai.com/
2. 注册账号并登录
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 保存 API Key（只显示一次）

**配置环境变量（Windows）：**

```powershell
# 1. 打开"系统属性" → "高级" → "环境变量"

# 2. 新建用户变量
变量名：OPENAI_API_KEY
变量值：sk-xxxxxxxxxxxxxxxxxxxxxxxx

# 3. 验证配置（重新打开命令行）
echo %OPENAI_API_KEY%
```

**配置环境变量（macOS/Linux）：**

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# 使配置生效
source ~/.bashrc  # 或 source ~/.zshrc
```

::: warning 安全提示

- **不要**把 API Key 提交到 Git 仓库
- **不要**在代码中硬编码 API Key
- 使用环境变量或配置文件管理 API Key
- 定期轮换 API Key

:::

### 4. 创建 Spring Boot 项目

**方式一：使用 Spring Initializr（推荐）**

1. 访问 https://start.spring.io/
2. 配置项目信息：
   - Project: Maven
   - Language: Java
   - Spring Boot: 3.2.x（或更高版本）
   - Group: com.example
   - Artifact: ai-agent-demo
   - Java: 21
3. 添加依赖：
   - Spring Web
   - Spring AI - OpenAI（在 Dependencies 中搜索）
4. 点击 "Generate" 下载项目
5. 解压并用 IDE 打开

**方式二：手动创建 Maven 项目**

```bash
# 创建项目目录
mkdir ai-agent-demo
cd ai-agent-demo

# 创建 Maven 目录结构
mkdir -p src/main/java/com/example/aiagent
mkdir -p src/main/resources
mkdir -p src/test/java/com/example/aiagent
```

创建 `pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Maven 项目配置文件 -->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 项目基本信息 -->
    <groupId>com.example</groupId>
    <artifactId>ai-agent-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <!-- 父项目：Spring Boot -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <!-- 属性配置 -->
    <properties>
        <java.version>21</java.version>
        <spring-ai.version>0.8.0</spring-ai.version>
    </properties>

    <!-- 依赖管理 -->
    <dependencies>
        <!-- Spring Boot Web 启动器 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring AI OpenAI 启动器 -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
            <version>${spring-ai.version}</version>
        </dependency>

        <!-- Lombok：简化代码 -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Spring Boot 测试启动器 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <!-- 构建配置 -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 5. 配置 application.yml

创建 `src/main/resources/application.yml`：

```yaml
# Spring AI 配置
spring:
  ai:
    openai:
      # OpenAI API Key，从环境变量读取
      api-key: ${OPENAI_API_KEY}
      # 使用的模型
      chat:
        options:
          model: gpt-3.5-turbo
          # 温度参数，控制输出的随机性（0-2）
          # 值越低，输出越确定；值越高，输出越随机
          temperature: 0.7

# 服务器配置
server:
  port: 8080
```

---

## 5 第一个 AI Agent 示例

### 简单对话示例

创建一个简单的 AI 对话服务：

```java
// AiAgentDemoApplication.java - Spring Boot 启动类
package com.example.aiagent;

// 导入 Spring Boot 启动注解
import org.springframework.boot.SpringApplication;
// 导入 Spring Boot 自动配置注解
import org.springframework.boot.autoconfigure.SpringBootApplication;

// 标记为 Spring Boot 应用
@SpringBootApplication
public class AiAgentDemoApplication {

    // 主方法，程序入口
    public static void main(String[] args) {
        // 启动 Spring Boot 应用
        SpringApplication.run(AiAgentDemoApplication.class, args);
        // 打印启动成功信息
        System.out.println("AI Agent 应用启动成功！");
    }
}
```

```java
// ChatController.java - 对话控制器
package com.example.aiagent.controller;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring Web 的 RestController 注解
import org.springframework.web.bind.annotation.RestController;
// 导入 Spring Web 的 GetMapping 注解
import org.springframework.web.bind.annotation.GetMapping;
// 导入 Spring Web 的 RequestParam 注解
import org.springframework.web.bind.annotation.RequestParam;

// 标记为 REST 控制器
@RestController
public class ChatController {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入 ChatClient
    public ChatController(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 定义 GET /chat 接口
    @GetMapping("/chat")
    // 返回字符串类型的响应
    public String chat(
            // 接收 message 参数，默认值为 "你好"
            @RequestParam(defaultValue = "你好") String message) {
        // 调用 ChatClient 发送消息并获取响应
        String response = chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 调用并获取结果
                .call()
                // 把响应转成字符串
                .content();
        // 返回 AI 的回复
        return response;
    }
}
```

### 运行与测试

```bash
# 1. 编译项目
mvn clean compile

# 2. 运行应用
mvn spring-boot:run

# 3. 测试接口（新开一个命令行窗口）
curl "http://localhost:8080/chat?message=你好，请介绍一下你自己"
```

**预期输出：**

```
你好！我是一个 AI 助手，基于 Spring AI 框架构建。我可以帮助你回答问题、提供信息、进行对话等。有什么我可以帮助你的吗？
```

### 代码逐行解析

```java
@RestController                    // ① 标记为 REST 控制器
public class ChatController {

    private final ChatClient chatClient;  // ② 声明 ChatClient 字段

    public ChatController(ChatClient chatClient) {  // ③ 构造器注入
        this.chatClient = chatClient;
    }

    @GetMapping("/chat")           // ④ 定义 GET /chat 接口
    public String chat(@RequestParam(defaultValue = "你好") String message) {
        String response = chatClient.prompt()  // ⑤ 创建 Prompt
                .user(message)                 // ⑥ 设置用户消息
                .call()                        // ⑦ 调用 API
                .content();                    // ⑧ 获取响应内容
        return response;                       // ⑨ 返回结果
    }
}
```

**逐行说明：**

| 行号 | 代码 | 说明 |
| --- | --- | --- |
| ① | `@RestController` | 标记为 REST 控制器，自动序列化返回值为 JSON |
| ② | `ChatClient chatClient` | Spring AI 的聊天客户端，用于调用大模型 |
| ③ | 构造器注入 | Spring 自动注入 ChatClient 实例 |
| ④ | `@GetMapping("/chat")` | 定义 GET 请求的 /chat 接口 |
| ⑤ | `chatClient.prompt()` | 创建一个新的 Prompt 构建器 |
| ⑥ | `.user(message)` | 设置用户消息内容 |
| ⑦ | `.call()` | 同步调用大模型 API |
| ⑧ | `.content()` | 提取响应内容（字符串） |
| ⑨ | `return response` | 返回 AI 的回复 |

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **AI Agent** | 能够感知环境、自主决策、采取行动的智能系统 |
| **AI Agent 组成** | LLM（大脑） + Tools（手脚） + Memory（记忆） + Planning（规划） |
| **AI Agent vs ChatBot** | Agent 能调用工具、自主决策、执行多步骤任务 |
| **Java AI 框架** | Spring AI、LangChain4j、Semantic Kernel |
| **环境要求** | JDK 17+、Maven/Gradle、API Key |
| **Spring AI** | Spring 官方 AI 框架，与 Spring Boot 深度集成 |

---

## 7 新手常见误区

### 误区 1："AI Agent 就是 ChatGPT"

**错！** ChatGPT 只是一个大语言模型，而 AI Agent 是一个完整的系统。

**正确理解：**

- **ChatGPT**：大语言模型，只能对话
- **AI Agent**：大语言模型 + 工具调用 + 记忆 + 规划，能执行复杂任务

打个比方：ChatGPT 是大脑，AI Agent 是大脑 + 手脚 + 记忆本 + 计划表。

### 误区 2："Java 不适合做 AI 开发"

**错！** 虽然 Python 是 AI 研究的主流语言，但 Java 在企业级 AI 应用开发中有独特优势。

**正确理解：**

- **Python**：适合 AI 研究、模型训练、快速原型
- **Java**：适合企业级应用、生产环境、系统集成

很多公司的 AI 应用是用 Java 开发的，因为它们需要与现有的 Java 系统集成。

### 误区 3："必须有 GPU 才能开发 AI Agent"

**错！** 开发 AI Agent 不需要 GPU，只需要调用云端 API。

**正确理解：**

- **调用 API**：不需要 GPU，普通电脑即可（OpenAI、Claude 等）
- **本地模型**：需要一定配置，但不是必须（Ollama 可以在 CPU 上运行）
- **模型训练**：需要 GPU（但这不是 Agent 开发的范畴）

### 误区 4："Spring AI 只能用于 OpenAI"

**错！** Spring AI 支持多种大模型提供商。

**正确理解：**

Spring AI 支持的模型包括：
- OpenAI（GPT-3.5、GPT-4）
- Azure OpenAI
- Ollama（本地模型）
- Hugging Face
- Anthropic Claude（通过第三方扩展）

### 误区 5："API Key 可以写在代码里"

**错！** 把 API Key 写在代码里是非常危险的安全隐患。

**正确做法：**

```java
// 错误示例：硬编码 API Key
String apiKey = "sk-xxxxxxxxxxxxxxxxxxxxxxxx";  // 绝对不要这样做！

// 正确示例：从环境变量读取
String apiKey = System.getenv("OPENAI_API_KEY");  // 从环境变量获取
```

---

## 8 动手练习

### 练习 1：基础练习

**题目**：列出 AI Agent 的 4 个核心组件，并说明它们的作用。

<details>
<summary>点击查看答案</summary>

**答案**：

1. **LLM（大语言模型）**：负责理解用户意图、推理决策，是 Agent 的"大脑"
2. **Tools（工具）**：提供外部能力，如搜索、计算、调用 API，是 Agent 的"手脚"
3. **Memory（记忆）**：存储对话历史和知识，让 Agent 能够记住上下文
4. **Planning（规划）**：把复杂任务拆解成小步骤，指导 Agent 如何完成任务

这 4 个组件协同工作，让 AI Agent 能够自主完成复杂任务。

</details>

### 练习 2：进阶练习

**题目**：对比传统 ChatBot 和 AI Agent 的区别，并举例说明什么场景适合使用 AI Agent。

<details>
<summary>点击查看答案</summary>

**答案**：

| 对比项 | 传统 ChatBot | AI Agent |
| --- | --- | --- |
| **能力范围** | 只能对话 | 能对话 + 能行动 |
| **工具使用** | 不能调用外部工具 | 可以调用 API、数据库、文件等 |
| **决策能力** | 固定流程 | 自主决策，灵活应变 |
| **记忆能力** | 无记忆或简单记忆 | 长期记忆 + 短期记忆 |
| **任务执行** | 单轮问答 | 多步骤复杂任务 |

**适合使用 AI Agent 的场景**：

1. **智能客服**：需要查询订单、处理退款、安排退货等多步骤任务
2. **代码助手**：需要理解代码、生成代码、运行测试、调试错误
3. **数据分析**：需要查询数据库、分析数据、生成报告
4. **自动化办公**：需要处理邮件、安排日程、整理文档

这些场景都需要 Agent 能够调用外部工具、自主决策、执行多步骤任务。

</details>

### 练习 3（挑战）：综合练习

**题目**：搭建一个简单的 AI 对话服务，实现以下功能：
1. 接收用户输入的问题
2. 调用 OpenAI API 获取回答
3. 返回 AI 的回复

<details>
<summary>点击查看答案</summary>

**答案**：

```java
// ChatController.java
package com.example.aiagent.controller;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring Web 的 RestController 注解
import org.springframework.web.bind.annotation.RestController;
// 导入 Spring Web 的 GetMapping 注解
import org.springframework.web.bind.annotation.GetMapping;
// 导入 Spring Web 的 RequestParam 注解
import org.springframework.web.bind.annotation.RequestParam;

// 标记为 REST 控制器
@RestController
public class ChatController {

    // 声明 ChatClient 字段
    private final ChatClient chatClient;

    // 构造器注入 ChatClient
    public ChatController(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 定义 GET /chat 接口
    @GetMapping("/chat")
    // 返回字符串类型的响应
    public String chat(
            // 接收 message 参数，默认值为 "你好"
            @RequestParam(defaultValue = "你好") String message) {
        // 调用 ChatClient 发送消息并获取响应
        String response = chatClient.prompt()
                // 设置用户消息
                .user(message)
                // 调用并获取结果
                .call()
                // 把响应转成字符串
                .content();
        // 返回 AI 的回复
        return response;
    }
}
```

**测试方法**：

```bash
# 启动应用
mvn spring-boot:run

# 测试接口
curl "http://localhost:8080/chat?message=什么是AI Agent"
```

</details>

---

## 下一章预告

下一章我们会学习 **大语言模型 API 集成**——如何接入 OpenAI、Claude、国产大模型（通义千问、文心一言）以及本地模型（Ollama）。你会学到如何封装统一的 LLM 客户端接口、处理流式响应、实现错误处理与重试机制。这些是与大模型交互的基础技能。
