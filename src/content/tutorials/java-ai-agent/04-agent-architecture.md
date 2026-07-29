---
title: "第四章：Agent 核心架构设计"
description: "理解 Agent 的决策循环机制，掌握 ReAct 与 Plan-and-Execute 模式"
---

# 第四章：Agent 核心架构设计

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Agent 的核心组件有哪些？它们如何协同工作？
- 什么是 ReAct 模式？它和普通的对话有什么区别？
- 什么是 Plan-and-Execute 模式？什么时候使用它？
- 如何设计一个完整的 Agent 框架？
- 如何实现 Agent 的决策循环（观察-思考-行动）？

这一章就是为了解答这些问题。我们会深入理解 Agent 的核心架构，学习两种主流的 Agent 模式，并用 Java 实现一个简单的 Agent 框架。

---

## 1 为什么需要 Agent 架构设计？

### 痛点分析

想象一下这个场景：

你想让 AI 帮你完成一个复杂任务："帮我分析一下最近的销售数据，找出问题，并生成一份报告。"

如果只是一个普通的聊天机器人，它只能给你一些建议，但不能真正执行任务。

**问题**：

- 不能调用外部工具（数据库、文件系统等）
- 不能自主决策下一步该做什么
- 不能记住中间结果
- 不能处理多步骤的复杂任务

### Agent 架构的解决方案

打个比方：

> **普通 AI** 就像一个只会说话的顾问，只能给你建议。
>
> **Agent** 就像一个能干的助理，不仅能思考，还能：
> - 查数据库（调用工具）
> - 分析问题（推理决策）
> - 记住中间结果（记忆系统）
> - 一步步完成任务（规划执行）

**Agent 架构的优势**：

| 优势 | 说明 |
| --- | --- |
| **自主决策** | 能够根据情况决定下一步行动 |
| **工具调用** | 可以调用外部 API、数据库、文件系统等 |
| **记忆能力** | 能够记住对话历史和中间结果 |
| **任务规划** | 能够把复杂任务拆解成小步骤 |
| **灵活应变** | 能够根据执行结果调整策略 |

---

## 2 Agent 的核心组件

### Agent 的四大组件

一个完整的 Agent 通常包含以下四个核心组件：

```
Agent = LLM（大脑） + Tools（手脚） + Memory（记忆） + Planning（规划）
```

### 1. LLM（大语言模型）

**作用**：Agent 的"大脑"，负责理解用户意图、推理决策、生成回复。

**类比**：就像人的大脑，负责思考和决策。

**在 Agent 中的角色**：

- 理解用户输入
- 决定下一步行动
- 选择要使用的工具
- 生成最终回复

### 2. Tools（工具）

**作用**：Agent 的"手脚"，提供外部能力，让 Agent 能够执行实际操作。

**类比**：就像人的手和脚，能够触碰和操作外部世界。

**常见的工具类型**：

| 工具类型 | 说明 | 示例 |
| --- | --- | --- |
| **搜索工具** | 搜索互联网信息 | Google Search、Bing Search |
| **计算工具** | 执行数学计算 | Calculator、Wolfram Alpha |
| **数据库工具** | 查询数据库 | SQL Query、MongoDB Query |
| **文件工具** | 读写文件 | File Reader、File Writer |
| **API 工具** | 调用外部 API | Weather API、Email API |
| **代码执行** | 运行代码 | Python Executor、Java Executor |

### 3. Memory（记忆）

**作用**：Agent 的"记忆本"，存储对话历史和中间结果。

**类比**：就像人的记忆，能够记住过去发生的事情。

**记忆类型**：

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| **短期记忆** | 当前对话的上下文 | 最近几轮对话内容 |
| **长期记忆** | 持久化的知识 | 用户偏好、历史任务 |
| **工作记忆** | 当前任务的中间结果 | 正在处理的数据 |

### 4. Planning（规划）

**作用**：Agent 的"计划表"，把复杂任务拆解成小步骤。

**类比**：就像人做事之前会先想好步骤，按部就班地完成。

**规划方式**：

- **任务分解**：把大任务拆成小任务
- **优先级排序**：决定先做什么、后做什么
- **依赖分析**：确定任务之间的依赖关系

### 组件协同工作

```
用户输入 → LLM 理解意图 → Planning 制定计划 → Memory 提供上下文
    ↓
LLM 决定行动 → Tools 执行操作 → Memory 记录结果
    ↓
LLM 观察结果 → 继续推理或输出最终结果
```

---

## 3 ReAct 模式

### 什么是 ReAct？

**ReAct = Reasoning + Acting**

这是一种让 LLM 交替进行推理和行动的 Agent 模式。

**核心思想**：

1. **Reasoning（推理）**：LLM 思考当前情况，决定下一步行动
2. **Acting（行动）**：调用工具执行操作
3. **Observation（观察）**：观察执行结果
4. **循环**：重复上述过程，直到完成任务

### 生活化类比

> ReAct 就像一个**侦探破案**：
> 1. **推理**："受害者是在晚上 10 点遇害的，我需要查一下监控"
> 2. **行动**：调用监控 API，获取晚上 10 点的监控录像
> 3. **观察**："监控显示一个穿黑色衣服的人在 9:50 进入现场"
> 4. **推理**："这个人很可疑，我需要查一下他的身份"
> 5. **行动**：调用身份识别 API
> 6. **观察**："这个人是受害者的前同事，有作案动机"
> 7. **推理**："证据充分，可以结案了"
> 8. **输出**：生成案件报告

### ReAct 的工作流程

```
用户输入 → [Thought] → [Action] → [Observation] → [Thought] → ... → [Final Answer]
```

**详细流程**：

1. **Thought（思考）**：LLM 分析当前情况，决定下一步
2. **Action（行动）**：调用工具执行操作
3. **Observation（观察）**：获取工具执行结果
4. **循环**：重复 1-3，直到得出最终答案
5. **Final Answer（最终答案）**：输出结果

### ReAct 示例

**场景**：用户问"北京今天天气怎么样？如果下雨，提醒我带伞。"

```
[用户输入] 北京今天天气怎么样？如果下雨，提醒我带伞。

[Thought 1] 我需要查询北京今天的天气
[Action 1] 调用天气查询工具，查询北京天气
[Observation 1] 北京今天：小雨，15-20°C

[Thought 2] 天气是小雨，需要提醒用户带伞
[Action 2] 生成提醒消息
[Observation 2] 提醒消息已生成

[Thought 3] 任务完成，可以输出结果
[Final Answer] 北京今天是小雨，15-20°C。记得带伞哦！
```

### 在 Java 中实现 ReAct

```java
// ReActAgent.java - ReAct Agent 实现
package com.example.aiagent.agent;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入工具注册表
import com.example.aiagent.tool.ToolRegistry;
// 导入 Spring 的 Component 注解
import org.springframework.stereotype.Component;
// 导入日志记录器
import org.slf4j.Logger;
// 导入日志工厂
import org.slf4j.LoggerFactory;
// 导入 ArrayList
import java.util.ArrayList;
// 导入 List
import java.util.List;

// 标记为 Spring 组件
@Component
public class ReActAgent {

    // 创建日志记录器
    private static final Logger log = LoggerFactory.getLogger(ReActAgent.class);

    // 声明 ChatClient 字段
    private final ChatClient chatClient;
    
    // 声明工具注册表
    private final ToolRegistry toolRegistry;
    
    // 最大迭代次数（防止无限循环）
    private static final int MAX_ITERATIONS = 10;

    // 构造器注入
    public ReActAgent(ChatClient chatClient, ToolRegistry toolRegistry) {
        // 赋值给字段
        this.chatClient = chatClient;
        // 赋值工具注册表
        this.toolRegistry = toolRegistry;
    }

    // 执行任务
    public String execute(String userInput) {
        // 存储对话历史
        List<String> history = new ArrayList<>();
        // 添加用户输入
        history.add("用户输入: " + userInput);
        
        // 迭代循环
        for (int i = 0; i < MAX_ITERATIONS; i++) {
            // 构建 Prompt
            String prompt = buildPrompt(history);
            
            // 调用 LLM
            String response = chatClient.prompt()
                    // 设置系统提示
                    .system(buildSystemPrompt())
                    // 设置用户消息
                    .user(prompt)
                    // 同步调用
                    .call()
                    // 获取响应内容
                    .content();
            
            // 记录日志
            log.info("迭代 {}: {}", i, response);
            
            // 添加到历史
            history.add("AI: " + response);
            
            // 检查是否是最终答案
            if (response.startsWith("Final Answer:")) {
                // 返回最终答案
                return response.substring("Final Answer:".length()).trim();
            }
            
            // 检查是否需要调用工具
            if (response.startsWith("Action:")) {
                // 解析工具名称
                String toolName = parseToolName(response);
                // 解析工具输入
                String toolInput = parseToolInput(response);
                
                // 执行工具
                String toolResult = toolRegistry.execute(toolName, toolInput);
                
                // 添加观察结果
                history.add("Observation: " + toolResult);
            }
        }
        
        // 超过最大迭代次数
        return "抱歉，我无法完成这个任务。";
    }

    // 构建系统提示
    private String buildSystemPrompt() {
        // 返回系统提示
        return """
                你是一个智能助手，可以使用工具来完成任务。
                
                请按照以下格式回答：
                
                Thought: 思考下一步该做什么
                Action: 工具名称
                Action Input: 工具输入
                
                或者：
                
                Thought: 我已经知道答案了
                Final Answer: 最终答案
                
                可用的工具：
                - weather_query: 查询天气，输入城市名
                - calculator: 计算数学表达式，输入表达式
                
                示例：
                用户：北京今天天气怎么样？
                
                Thought: 我需要查询北京的天气
                Action: weather_query
                Action Input: 北京
                
                Observation: 北京今天：小雨，15-20°C
                
                Thought: 我知道答案了
                Final Answer: 北京今天是小雨，15-20°C。
                """;
    }

    // 构建 Prompt
    private String buildPrompt(List<String> history) {
        // 使用 StringBuilder 拼接
        StringBuilder sb = new StringBuilder();
        // 遍历历史
        for (String entry : history) {
            // 添加历史条目
            sb.append(entry).append("\n");
        }
        // 返回拼接结果
        return sb.toString();
    }

    // 解析工具名称
    private String parseToolName(String response) {
        // 查找 Action: 后的内容
        int start = response.indexOf("Action:") + "Action:".length();
        // 查找换行符
        int end = response.indexOf("\n", start);
        // 如果没找到换行符，取到末尾
        if (end == -1) end = response.length();
        // 返回工具名称
        return response.substring(start, end).trim();
    }

    // 解析工具输入
    private String parseToolInput(String response) {
        // 查找 Action Input: 后的内容
        int start = response.indexOf("Action Input:") + "Action Input:".length();
        // 查找换行符
        int end = response.indexOf("\n", start);
        // 如果没找到换行符，取到末尾
        if (end == -1) end = response.length();
        // 返回工具输入
        return response.substring(start, end).trim();
    }
}
```

---

## 4 Plan-and-Execute 模式

### 什么是 Plan-and-Execute？

**Plan-and-Execute = 先规划，再执行**

这是一种让 Agent 先制定完整计划，再逐步执行的 Agent 模式。

**核心思想**：

1. **Planning（规划）**：LLM 分析任务，制定完整的执行计划
2. **Execution（执行）**：按计划逐步执行每个步骤
3. **Re-planning（重新规划）**：根据执行结果调整计划（可选）

### ReAct vs Plan-and-Execute

| 对比项 | ReAct | Plan-and-Execute |
| --- | --- | --- |
| **规划方式** | 边想边做 | 先规划再执行 |
| **适用场景** | 简单任务、探索性任务 | 复杂任务、多步骤任务 |
| **优点** | 灵活，能根据情况调整 | 有条理，不易遗漏步骤 |
| **缺点** | 可能走弯路 | 计划可能不准确 |
| **类比** | 像侦探破案，一步步推理 | 像项目经理，先制定计划再执行 |

### 生活化类比

> Plan-and-Execute 就像**组织一场旅行**：
> 1. **规划阶段**：
>    - 确定目的地
>    - 查询交通方式
>    - 预订酒店
>    - 安排行程
> 2. **执行阶段**：
>    - 买机票
>    - 订酒店
>    - 打包行李
>    - 出发旅行
> 3. **调整阶段**（可选）：
>    - 如果航班取消，重新规划路线

### Plan-and-Execute 的工作流程

```
用户输入 → Planner 制定计划 → Executor 逐步执行 → 输出结果
                ↑                      ↓
                └── Re-planner（可选） ──┘
```

**详细流程**：

1. **Planner（规划器）**：分析任务，生成执行计划
2. **Executor（执行器）**：按计划逐步执行
3. **Re-planner（重新规划器）**：根据执行结果调整计划（可选）
4. **输出结果**：生成最终结果

### Plan-and-Execute 示例

**场景**：用户问"帮我分析一下最近的销售数据，找出问题，并生成一份报告。"

```
[用户输入] 帮我分析一下最近的销售数据，找出问题，并生成一份报告。

[Planner] 制定计划：
1. 从数据库查询最近一个月的销售数据
2. 计算总销售额、平均销售额、增长率
3. 找出销售额下降的产品
4. 分析下降原因
5. 生成报告

[Executor - 步骤 1] 查询销售数据
Action: sql_query
Input: SELECT * FROM sales WHERE date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
Observation: 查询到 1000 条销售记录

[Executor - 步骤 2] 计算统计数据
Action: calculator
Input: 计算总销售额、平均销售额、增长率
Observation: 总销售额 100 万，平均销售额 1000 元，增长率 -5%

[Executor - 步骤 3] 找出问题产品
Action: sql_query
Input: 找出销售额下降的产品
Observation: 产品 A 下降 20%，产品 B 下降 15%

[Executor - 步骤 4] 分析原因
Action: none（LLM 分析）
Observation: 产品 A 下降可能是因为竞争对手推出新产品

[Executor - 步骤 5] 生成报告
Action: file_writer
Input: 生成销售分析报告
Observation: 报告已生成

[Final Answer] 报告已生成，主要发现：
1. 总销售额 100 万，环比下降 5%
2. 产品 A 和产品 B 销售下降明显
3. 建议关注竞争对手动态，调整营销策略
```

### 在 Java 中实现 Plan-and-Execute

```java
// PlanAndExecuteAgent.java - Plan-and-Execute Agent 实现
package com.example.aiagent.agent;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入工具注册表
import com.example.aiagent.tool.ToolRegistry;
// 导入 Spring 的 Component 注解
import org.springframework.stereotype.Component;
// 导入日志记录器
import org.slf4j.Logger;
// 导入日志工厂
import org.slf4j.LoggerFactory;
// 导入 ArrayList
import java.util.ArrayList;
// 导入 List
import java.util.List;

// 标记为 Spring 组件
@Component
public class PlanAndExecuteAgent {

    // 创建日志记录器
    private static final Logger log = LoggerFactory.getLogger(PlanAndExecuteAgent.class);

    // 声明 ChatClient 字段
    private final ChatClient chatClient;
    
    // 声明工具注册表
    private final ToolRegistry toolRegistry;

    // 构造器注入
    public PlanAndExecuteAgent(ChatClient chatClient, ToolRegistry toolRegistry) {
        // 赋值给字段
        this.chatClient = chatClient;
        // 赋值工具注册表
        this.toolRegistry = toolRegistry;
    }

    // 执行任务
    public String execute(String userInput) {
        // 第一步：制定计划
        List<String> plan = generatePlan(userInput);
        // 记录日志
        log.info("执行计划: {}", plan);
        
        // 第二步：逐步执行
        List<String> results = new ArrayList<>();
        // 遍历计划
        for (int i = 0; i < plan.size(); i++) {
            // 获取当前步骤
            String step = plan.get(i);
            // 记录日志
            log.info("执行步骤 {}/{}: {}", i + 1, plan.size(), step);
            
            // 执行步骤
            String result = executeStep(step, results);
            // 添加结果
            results.add("步骤 " + (i + 1) + ": " + result);
        }
        
        // 第三步：生成最终结果
        String finalResult = generateFinalResult(userInput, results);
        // 返回最终结果
        return finalResult;
    }

    // 生成执行计划
    private List<String> generatePlan(String userInput) {
        // 构建 Prompt
        String prompt = """
                请将以下任务分解为具体的执行步骤：
                
                任务：%s
                
                请用数字列表的形式输出步骤，每个步骤一行，例如：
                1. 第一步
                2. 第二步
                3. 第三步
                """.formatted(userInput);
        
        // 调用 LLM
        String response = chatClient.prompt()
                // 设置用户消息
                .user(prompt)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
        
        // 解析步骤
        List<String> steps = new ArrayList<>();
        // 按行分割
        String[] lines = response.split("\n");
        // 遍历行
        for (String line : lines) {
            // 去除空白
            String trimmed = line.trim();
            // 检查是否是步骤
            if (trimmed.matches("^\\d+\\..*")) {
                // 去除数字前缀
                String step = trimmed.replaceFirst("^\\d+\\.\\s*", "");
                // 添加到步骤列表
                steps.add(step);
            }
        }
        // 返回步骤
        return steps;
    }

    // 执行单个步骤
    private String executeStep(String step, List<String> previousResults) {
        // 构建 Prompt
        String prompt = """
                请执行以下步骤：
                
                步骤：%s
                
                之前的结果：
                %s
                
                如果需要调用工具，请使用以下格式：
                Action: 工具名称
                Input: 工具输入
                
                如果不需要调用工具，直接输出结果。
                """.formatted(step, String.join("\n", previousResults));
        
        // 调用 LLM
        String response = chatClient.prompt()
                // 设置用户消息
                .user(prompt)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
        
        // 检查是否需要调用工具
        if (response.contains("Action:")) {
            // 解析工具名称
            String toolName = parseToolName(response);
            // 解析工具输入
            String toolInput = parseToolInput(response);
            // 执行工具
            String toolResult = toolRegistry.execute(toolName, toolInput);
            // 返回工具结果
            return toolResult;
        }
        
        // 返回 LLM 响应
        return response;
    }

    // 生成最终结果
    private String generateFinalResult(String userInput, List<String> results) {
        // 构建 Prompt
        String prompt = """
                请根据以下执行结果，生成最终答案：
                
                用户任务：%s
                
                执行结果：
                %s
                
                请总结执行结果，给出最终答案。
                """.formatted(userInput, String.join("\n", results));
        
        // 调用 LLM
        String response = chatClient.prompt()
                // 设置用户消息
                .user(prompt)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
        // 返回结果
        return response;
    }

    // 解析工具名称
    private String parseToolName(String response) {
        // 查找 Action: 后的内容
        int start = response.indexOf("Action:") + "Action:".length();
        // 查找换行符
        int end = response.indexOf("\n", start);
        // 如果没找到换行符，取到末尾
        if (end == -1) end = response.length();
        // 返回工具名称
        return response.substring(start, end).trim();
    }

    // 解析工具输入
    private String parseToolInput(String response) {
        // 查找 Input: 后的内容
        int start = response.indexOf("Input:") + "Input:".length();
        // 查找换行符
        int end = response.indexOf("\n", start);
        // 如果没找到换行符，取到末尾
        if (end == -1) end = response.length();
        // 返回工具输入
        return response.substring(start, end).trim();
    }
}
```

---

## 5 Agent 生命周期管理

### Agent 的生命周期

一个 Agent 从创建到销毁，经历以下阶段：

```
初始化 → 接收输入 → 规划 → 执行 → 观察 → 决策 → 输出 → 结束/继续
```

### 生命周期阶段

| 阶段 | 说明 | 关键操作 |
| --- | --- | --- |
| **初始化** | 创建 Agent，加载配置 | 初始化 LLM、工具、记忆 |
| **接收输入** | 获取用户输入 | 解析用户意图 |
| **规划** | 制定执行计划 | 任务分解、优先级排序 |
| **执行** | 执行计划中的步骤 | 调用工具、处理数据 |
| **观察** | 观察执行结果 | 记录结果、评估效果 |
| **决策** | 决定下一步行动 | 继续执行/调整计划/结束 |
| **输出** | 生成最终结果 | 格式化输出、返回结果 |
| **结束/继续** | 结束任务或继续循环 | 清理资源、保存状态 |

### 生命周期管理示例

```java
// AgentLifecycle.java - Agent 生命周期管理
package com.example.aiagent.agent;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入工具注册表
import com.example.aiagent.tool.ToolRegistry;
// 导入记忆管理器
import com.example.aiagent.memory.MemoryManager;
// 导入 Spring 的 Component 注解
import org.springframework.stereotype.Component;
// 导入日志记录器
import org.slf4j.Logger;
// 导入日志工厂
import org.slf4j.LoggerFactory;

// 标记为 Spring 组件
@Component
public class AgentLifecycle {

    // 创建日志记录器
    private static final Logger log = LoggerFactory.getLogger(AgentLifecycle.class);

    // 声明 ChatClient 字段
    private final ChatClient chatClient;
    
    // 声明工具注册表
    private final ToolRegistry toolRegistry;
    
    // 声明记忆管理器
    private final MemoryManager memoryManager;
    
    // Agent 状态
    private AgentState state;

    // 构造器注入
    public AgentLifecycle(ChatClient chatClient, ToolRegistry toolRegistry, MemoryManager memoryManager) {
        // 赋值给字段
        this.chatClient = chatClient;
        // 赋值工具注册表
        this.toolRegistry = toolRegistry;
        // 赋值记忆管理器
        this.memoryManager = memoryManager;
        // 初始化状态
        this.state = AgentState.INITIALIZED;
    }

    // 执行任务
    public String execute(String userInput) {
        try {
            // 阶段 1：接收输入
            receiveInput(userInput);
            
            // 阶段 2：规划
            plan(userInput);
            
            // 阶段 3：执行
            String result = executePlan();
            
            // 阶段 4：输出
            output(result);
            
            // 返回结果
            return result;
        } catch (Exception e) {
            // 记录错误日志
            log.error("Agent 执行失败", e);
            // 返回错误信息
            return "执行失败: " + e.getMessage();
        } finally {
            // 阶段 5：清理
            cleanup();
        }
    }

    // 阶段 1：接收输入
    private void receiveInput(String userInput) {
        // 更新状态
        state = AgentState.RECEIVING_INPUT;
        // 记录日志
        log.info("接收输入: {}", userInput);
        // 保存到记忆
        memoryManager.addToMemory("user", userInput);
    }

    // 阶段 2：规划
    private void plan(String userInput) {
        // 更新状态
        state = AgentState.PLANNING;
        // 记录日志
        log.info("开始规划...");
        // 这里可以添加规划逻辑
    }

    // 阶段 3：执行
    private String executePlan() {
        // 更新状态
        state = AgentState.EXECUTING;
        // 记录日志
        log.info("开始执行...");
        // 这里可以添加执行逻辑
        // 返回执行结果
        return "执行完成";
    }

    // 阶段 4：输出
    private void output(String result) {
        // 更新状态
        state = AgentState.OUTPUTTING;
        // 记录日志
        log.info("输出结果: {}", result);
        // 保存到记忆
        memoryManager.addToMemory("agent", result);
    }

    // 阶段 5：清理
    private void cleanup() {
        // 更新状态
        state = AgentState.FINISHED;
        // 记录日志
        log.info("清理资源...");
        // 这里可以添加清理逻辑
    }

    // 获取当前状态
    public AgentState getState() {
        // 返回状态
        return state;
    }

    // Agent 状态枚举
    public enum AgentState {
        // 已初始化
        INITIALIZED,
        // 接收输入中
        RECEIVING_INPUT,
        // 规划中
        PLANNING,
        // 执行中
        EXECUTING,
        // 输出中
        OUTPUTTING,
        // 已完成
        FINISHED
    }
}
```

---

## 6 决策循环实现

### 什么是决策循环？

**决策循环 = 观察 → 思考 → 行动**

这是 Agent 的核心机制，让 Agent 能够根据环境变化不断调整行动。

### 决策循环的三个步骤

1. **观察（Observe）**：获取当前环境和执行结果
2. **思考（Think）**：分析情况，决定下一步行动
3. **行动（Act）**：执行选定的行动

### 生活化类比

> 决策循环就像**开车**：
> 1. **观察**：看到前方红灯
> 2. **思考**：需要停车等待
> 3. **行动**：踩刹车停车
> 4. **观察**：红灯变绿灯
> 5. **思考**：可以通行了
> 6. **行动**：踩油门前进

### 决策循环实现

```java
// DecisionLoop.java - 决策循环实现
package com.example.aiagent.agent;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入工具注册表
import com.example.aiagent.tool.ToolRegistry;
// 导入 Spring 的 Component 注解
import org.springframework.stereotype.Component;
// 导入日志记录器
import org.slf4j.Logger;
// 导入日志工厂
import org.slf4j.LoggerFactory;
// 导入 ArrayList
import java.util.ArrayList;
// 导入 List
import java.util.List;

// 标记为 Spring 组件
@Component
public class DecisionLoop {

    // 创建日志记录器
    private static final Logger log = LoggerFactory.getLogger(DecisionLoop.class);

    // 声明 ChatClient 字段
    private final ChatClient chatClient;
    
    // 声明工具注册表
    private final ToolRegistry toolRegistry;
    
    // 最大循环次数
    private static final int MAX_LOOPS = 10;

    // 构造器注入
    public DecisionLoop(ChatClient chatClient, ToolRegistry toolRegistry) {
        // 赋值给字段
        this.chatClient = chatClient;
        // 赋值工具注册表
        this.toolRegistry = toolRegistry;
    }

    // 执行决策循环
    public String execute(String userInput) {
        // 存储历史记录
        List<String> history = new ArrayList<>();
        // 添加用户输入
        history.add("用户输入: " + userInput);
        
        // 循环执行
        for (int i = 0; i < MAX_LOOPS; i++) {
            // 阶段 1：观察
            String observation = observe(history);
            // 记录日志
            log.info("循环 {} - 观察: {}", i, observation);
            
            // 阶段 2：思考
            String thought = think(observation);
            // 记录日志
            log.info("循环 {} - 思考: {}", i, thought);
            
            // 添加到历史
            history.add("思考: " + thought);
            
            // 检查是否完成
            if (isFinished(thought)) {
                // 返回最终答案
                return extractFinalAnswer(thought);
            }
            
            // 阶段 3：行动
            String action = act(thought);
            // 记录日志
            log.info("循环 {} - 行动: {}", i, action);
            
            // 添加到历史
            history.add("行动: " + action);
        }
        
        // 超过最大循环次数
        return "抱歉，我无法完成这个任务。";
    }

    // 阶段 1：观察
    private String observe(List<String> history) {
        // 返回历史记录
        return String.join("\n", history);
    }

    // 阶段 2：思考
    private String think(String observation) {
        // 构建 Prompt
        String prompt = """
                根据以下观察，思考下一步该做什么：
                
                %s
                
                请输出你的思考过程，如果需要调用工具，请使用以下格式：
                Thought: 你的思考
                Action: 工具名称
                Action Input: 工具输入
                
                如果已经知道答案，请使用以下格式：
                Thought: 我已经知道答案
                Final Answer: 最终答案
                """.formatted(observation);
        
        // 调用 LLM
        String response = chatClient.prompt()
                // 设置用户消息
                .user(prompt)
                // 同步调用
                .call()
                // 获取响应内容
                .content();
        // 返回响应
        return response;
    }

    // 阶段 3：行动
    private String act(String thought) {
        // 检查是否需要调用工具
        if (thought.contains("Action:")) {
            // 解析工具名称
            String toolName = parseToolName(thought);
            // 解析工具输入
            String toolInput = parseToolInput(thought);
            // 执行工具
            String toolResult = toolRegistry.execute(toolName, toolInput);
            // 返回观察结果
            return "Observation: " + toolResult;
        }
        // 返回思考结果
        return thought;
    }

    // 检查是否完成
    private boolean isFinished(String thought) {
        // 检查是否包含 Final Answer
        return thought.contains("Final Answer:");
    }

    // 提取最终答案
    private String extractFinalAnswer(String thought) {
        // 查找 Final Answer: 后的内容
        int start = thought.indexOf("Final Answer:") + "Final Answer:".length();
        // 返回最终答案
        return thought.substring(start).trim();
    }

    // 解析工具名称
    private String parseToolName(String response) {
        // 查找 Action: 后的内容
        int start = response.indexOf("Action:") + "Action:".length();
        // 查找换行符
        int end = response.indexOf("\n", start);
        // 如果没找到换行符，取到末尾
        if (end == -1) end = response.length();
        // 返回工具名称
        return response.substring(start, end).trim();
    }

    // 解析工具输入
    private String parseToolInput(String response) {
        // 查找 Action Input: 后的内容
        int start = response.indexOf("Action Input:") + "Action Input:".length();
        // 查找换行符
        int end = response.indexOf("\n", start);
        // 如果没找到换行符，取到末尾
        if (end == -1) end = response.length();
        // 返回工具输入
        return response.substring(start, end).trim();
    }
}
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Agent 核心组件** | LLM（大脑） + Tools（手脚） + Memory（记忆） + Planning（规划） |
| **ReAct 模式** | 边想边做，交替进行推理和行动 |
| **Plan-and-Execute** | 先规划再执行，适合复杂任务 |
| **Agent 生命周期** | 初始化 → 接收输入 → 规划 → 执行 → 观察 → 决策 → 输出 → 结束 |
| **决策循环** | 观察 → 思考 → 行动，不断循环直到完成任务 |
| **ReAct vs Plan-and-Execute** | ReAct 灵活但可能走弯路，Plan-and-Execute 有条理但计划可能不准确 |

---

## 8 新手常见误区

### 误区 1："Agent 就是 ChatBot"

**错！** ChatBot 只能对话，Agent 能够执行任务。

**正确理解：**

- **ChatBot**：只能回答问题，不能执行操作
- **Agent**：能够调用工具、执行任务、完成复杂操作

### 误区 2："ReAct 比 Plan-and-Execute 更好"

**错！** 两种模式各有优劣，需要根据场景选择。

**正确理解：**

| 场景 | 推荐模式 |
| --- | --- |
| 简单任务、探索性任务 | ReAct |
| 复杂任务、多步骤任务 | Plan-and-Execute |
| 需要灵活应变 | ReAct |
| 需要有条理执行 | Plan-and-Execute |

### 误区 3："Agent 不需要限制循环次数"

**错！** 不限制循环次数可能导致无限循环。

**正确做法：**

```java
// 设置最大循环次数
private static final int MAX_LOOPS = 10;

// 在循环中检查
for (int i = 0; i < MAX_LOOPS; i++) {
    // 执行逻辑
}
```

### 误区 4："Agent 可以处理任何任务"

**错！** Agent 的能力受限于可用的工具。

**正确理解：**

- Agent 只能调用已注册的工具
- 如果任务需要未注册的工具，Agent 无法完成
- 需要根据任务需求准备合适的工具

### 误区 5："Agent 不需要记忆"

**错！** 记忆是 Agent 的重要组成部分。

**正确理解：**

- **短期记忆**：记住当前对话的上下文
- **长期记忆**：记住用户偏好、历史任务
- **工作记忆**：记住任务的中间结果

没有记忆，Agent 无法完成需要上下文的任务。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：列出 Agent 的 4 个核心组件，并说明它们的作用。

<details>
<summary>点击查看答案</summary>

**答案**：

1. **LLM（大语言模型）**：Agent 的"大脑"，负责理解用户意图、推理决策、生成回复
2. **Tools（工具）**：Agent 的"手脚"，提供外部能力，让 Agent 能够执行实际操作
3. **Memory（记忆）**：Agent 的"记忆本"，存储对话历史和中间结果
4. **Planning（规划）**：Agent 的"计划表"，把复杂任务拆解成小步骤

这 4 个组件协同工作，让 Agent 能够自主完成复杂任务。

</details>

### 练习 2：进阶练习

**题目**：对比 ReAct 和 Plan-and-Execute 两种模式的区别，并说明各自适用的场景。

<details>
<summary>点击查看答案</summary>

**答案**：

| 对比项 | ReAct | Plan-and-Execute |
| --- | --- | --- |
| **规划方式** | 边想边做 | 先规划再执行 |
| **适用场景** | 简单任务、探索性任务 | 复杂任务、多步骤任务 |
| **优点** | 灵活，能根据情况调整 | 有条理，不易遗漏步骤 |
| **缺点** | 可能走弯路 | 计划可能不准确 |
| **类比** | 像侦探破案，一步步推理 | 像项目经理，先制定计划再执行 |

**适用场景**：

- **ReAct**：简单查询、实时交互、探索性任务
- **Plan-and-Execute**：数据分析、报告生成、复杂工作流

</details>

### 练习 3（挑战）：综合练习

**题目**：实现一个简单的 ReAct Agent，能够调用工具完成任务。

<details>
<summary>点击查看答案</summary>

**答案**：

```java
// SimpleReActAgent.java
package com.example.aiagent.agent;

// 导入 Spring AI 的 ChatClient
import org.springframework.ai.chat.client.ChatClient;
// 导入 Spring 的 Component 注解
import org.springframework.stereotype.Component;
// 导入日志记录器
import org.slf4j.Logger;
// 导入日志工厂
import org.slf4j.LoggerFactory;
// 导入 ArrayList
import java.util.ArrayList;
// 导入 List
import java.util.List;

// 标记为 Spring 组件
@Component
public class SimpleReActAgent {

    // 创建日志记录器
    private static final Logger log = LoggerFactory.getLogger(SimpleReActAgent.class);

    // 声明 ChatClient 字段
    private final ChatClient chatClient;
    
    // 最大迭代次数
    private static final int MAX_ITERATIONS = 5;

    // 构造器注入
    public SimpleReActAgent(ChatClient chatClient) {
        // 赋值给字段
        this.chatClient = chatClient;
    }

    // 执行任务
    public String execute(String userInput) {
        // 存储对话历史
        List<String> history = new ArrayList<>();
        // 添加用户输入
        history.add("用户输入: " + userInput);
        
        // 迭代循环
        for (int i = 0; i < MAX_ITERATIONS; i++) {
            // 构建 Prompt
            String prompt = buildPrompt(history);
            
            // 调用 LLM
            String response = chatClient.prompt()
                    // 设置系统提示
                    .system(buildSystemPrompt())
                    // 设置用户消息
                    .user(prompt)
                    // 同步调用
                    .call()
                    // 获取响应内容
                    .content();
            
            // 记录日志
            log.info("迭代 {}: {}", i, response);
            
            // 添加到历史
            history.add("AI: " + response);
            
            // 检查是否是最终答案
            if (response.startsWith("Final Answer:")) {
                // 返回最终答案
                return response.substring("Final Answer:".length()).trim();
            }
        }
        
        // 超过最大迭代次数
        return "抱歉，我无法完成这个任务。";
    }

    // 构建系统提示
    private String buildSystemPrompt() {
        // 返回系统提示
        return """
                你是一个智能助手。
                
                请按照以下格式回答：
                
                Thought: 思考下一步该做什么
                Final Answer: 最终答案
                """;
    }

    // 构建 Prompt
    private String buildPrompt(List<String> history) {
        // 使用 StringBuilder 拼接
        StringBuilder sb = new StringBuilder();
        // 遍历历史
        for (String entry : history) {
            // 添加历史条目
            sb.append(entry).append("\n");
        }
        // 返回拼接结果
        return sb.toString();
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **工具集成与调用**——如何为 Agent 添加各种工具，让它能够执行实际操作。你会学到如何定义工具、注册工具、调用工具，以及如何实现工具链。这是让 Agent 真正"动"起来的关键。
