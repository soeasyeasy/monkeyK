---
title: "第09章：Agent 智能体开发"
description: "掌握 Agent 智能体开发，学习 Agent 架构、ReAct 模式、任务规划、自主决策、多 Agent 协作"
---

# 第09章：Agent 智能体开发

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Agent？和普通 Chain 有什么区别？
- ReAct 模式是什么？
- 如何让 Agent 自主决策？
- 如何实现多 Agent 协作？

这一章就是为了解答这些问题。我们会深入学习 Agent 的核心概念和开发方法，让你能够构建具有自主决策能力的 AI 智能体。

---

## 1 为什么需要 Agent？

### 痛点分析

普通的 Chain 是线性的，无法处理复杂任务：

```python
# ❌ 普通 Chain 只能按固定流程执行
chain = prompt | llm | output_parser

# 问题：无法根据情况动态决策
# 比如：用户问"今天天气怎么样？如果下雨就提醒带伞"
# Chain 无法判断是否需要调用天气工具
```

### 解决方案

**Agent** 可以自主决策，动态选择工具：

打个比方：

> **Agent 就像智能助手**：
> - 普通 Chain = 流水线工人，只能按固定流程工作
> - Agent = 智能助手，能根据情况决定做什么

---

## 2 Agent 核心概念

### 2.1 什么是 Agent？

Agent 是一个能够：

1. **理解目标**：理解用户想要什么
2. **规划步骤**：决定需要做什么
3. **选择工具**：决定使用哪些工具
4. **执行动作**：调用工具完成任务
5. **反思结果**：评估结果是否满足目标

### 2.2 Agent 的组成

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain.tools import tool

# 1. 工具列表
@tool
def search_weather(city: str) -> str:
    """搜索天气信息"""
    return f"{city}今天晴，气温 25°C"

tools = [search_weather]

# 2. LLM
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 3. Agent
agent = create_react_agent(llm, tools)

# 4. AgentExecutor
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
```

**代码解释**：

1. **工具列表**：Agent 可以使用的工具
2. **LLM**：Agent 的大脑，负责决策
3. **Agent**：核心逻辑，决定如何使用工具
4. **AgentExecutor**：执行器，运行 Agent

> **原理**：Agent 会循环执行：思考 → 行动 → 观察 → 思考，直到完成任务。

---

## 3 ReAct 模式

### 3.1 什么是 ReAct？

ReAct = Reasoning + Acting

**工作流程**：

```
思考（Thought）→ 行动（Action）→ 观察（Observation）→ 思考 → ... → 最终答案
```

### 3.2 ReAct 示例

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.tools import tool

# 定义工具
@tool
def search_weather(city: str) -> str:
    """搜索天气信息"""
    if "北京" in city:
        return "北京今天晴，气温 25°C"
    return f"{city}天气信息未知"

@tool
def suggest_clothing(weather: str) -> str:
    """根据天气建议穿衣"""
    if "晴" in weather and "25" in weather:
        return "建议穿短袖、短裤"
    return "建议穿长袖、外套"

tools = [search_weather, suggest_clothing]

# 创建 Agent
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
agent = create_react_agent(llm, tools)

# 创建执行器
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,  # 打印详细过程
    handle_parsing_errors=True
)

# 调用
result = agent_executor.invoke({
    "input": "北京今天天气怎么样？应该穿什么衣服？"
})

print(result["output"])
```

**执行过程**：

```
> Entering new AgentExecutor chain...
Thought: 我需要先查询北京的天气
Action: search_weather
Action Input: "北京"
Observation: 北京今天晴，气温 25°C
Thought: 现在我知道天气了，需要根据天气建议穿衣
Action: suggest_clothing
Action Input: "晴，25°C"
Observation: 建议穿短袖、短裤
Thought: 我现在知道答案了
Final Answer: 北京今天晴，气温 25°C，建议穿短袖、短裤。
> Finished chain.
```

**代码解释**：

1. **Thought**：Agent 的思考过程
2. **Action**：决定调用的工具
3. **Action Input**：工具的输入参数
4. **Observation**：工具返回的结果
5. **Final Answer**：最终答案

> **原理**：ReAct 模式让 Agent 能够边思考边行动，逐步解决问题。

---

## 4 Agent 类型

### 4.1 ReAct Agent

最常用的 Agent 类型，使用 ReAct 模式。

```python
from langchain.agents import create_react_agent

agent = create_react_agent(llm, tools)
```

### 4.2 OpenAI Functions Agent

使用 OpenAI 的 Function Calling 能力。

```python
from langchain.agents import create_openai_functions_agent

agent = create_openai_functions_agent(llm, tools, prompt)
```

### 4.3 Self-Ask With Search Agent

专门用于搜索和回答的 Agent。

```python
from langchain.agents import create_self_ask_with_search_agent

agent = create_self_ask_with_search_agent(llm, tools, prompt)
```

### 4.4 对比表格

| Agent 类型 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **ReAct** | 灵活、通用 | token 消耗大 | 通用任务 |
| **OpenAI Functions** | 精确、高效 | 依赖 OpenAI | OpenAI 模型 |
| **Self-Ask** | 擅长搜索 | 功能单一 | 搜索问答 |

---

## 5 自定义 Agent

### 5.1 自定义 Prompt

```python
from langchain.prompts import PromptTemplate

# 自定义 ReAct Prompt
prompt = PromptTemplate.from_template("""
你是一个智能助手，可以使用工具完成任务。

可用工具：
{tools}

工具名称：{tool_names}

请按照以下格式回答：

Question: 用户的问题
Thought: 思考应该做什么
Action: 要使用的工具（必须是 [{tool_names}] 中的一个）
Action Input: 工具的输入
Observation: 工具的结果
... (可以重复 Thought/Action/Observation 多次)
Thought: 我现在知道最终答案了
Final Answer: 对用户问题的最终答案

开始！

Question: {input}
{agent_scratchpad}
""")

# 创建 Agent
agent = create_react_agent(llm, tools, prompt)
```

### 5.2 自定义工具选择逻辑

```python
from langchain.agents import BaseSingleActionAgent
from langchain.tools import BaseTool
from typing import List, Tuple

class CustomAgent(BaseSingleActionAgent):
    """自定义 Agent"""
    
    @property
    def input_keys(self):
        return ["input"]
    
    def plan(
        self,
        intermediate_steps: List[Tuple],
        **kwargs
    ):
        """规划下一步行动"""
        # 自定义逻辑
        # 可以根据 intermediate_steps 决定下一步
        pass
    
    async def aplan(self, intermediate_steps, **kwargs):
        """异步规划"""
        pass
```

---

## 6 多 Agent 协作

### 6.1 多 Agent 架构

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain.tools import tool

# 定义工具
@tool
def search_info(query: str) -> str:
    """搜索信息"""
    return f"搜索结果：{query} 的相关信息"

@tool
def write_article(topic: str) -> str:
    """写文章"""
    return f"关于 {topic} 的文章..."

@tool
def review_article(article: str) -> str:
    """审核文章"""
    return "审核通过"

# 创建多个 Agent
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 研究员 Agent
researcher = create_react_agent(
    llm,
    [search_info],
    verbose=True
)
researcher_executor = AgentExecutor(agent=researcher, tools=[search_info])

# 写手 Agent
writer = create_react_agent(
    llm,
    [write_article],
    verbose=True
)
writer_executor = AgentExecutor(agent=writer, tools=[write_article])

# 审核员 Agent
reviewer = create_react_agent(
    llm,
    [review_article],
    verbose=True
)
reviewer_executor = AgentExecutor(agent=reviewer, tools=[review_article])

# 协作流程
# 1. 研究员搜索信息
research_result = researcher_executor.invoke({
    "input": "搜索 AI 的最新发展"
})

# 2. 写手根据研究结果写文章
article = writer_executor.invoke({
    "input": f"根据以下信息写一篇文章：{research_result['output']}"
})

# 3. 审核员审核文章
review = reviewer_executor.invoke({
    "input": f"审核这篇文章：{article['output']}"
})

print(f"最终结果：{review['output']}")
```

**代码解释**：

1. **创建多个 Agent**：每个 Agent 负责不同的任务
2. **协作流程**：按顺序调用不同的 Agent
3. **传递结果**：把上一个 Agent 的结果传给下一个

> **原理**：多 Agent 协作可以分解复杂任务，每个 Agent 专注于特定领域。

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Agent** | 能够自主决策的智能体 |
| **ReAct 模式** | 思考 → 行动 → 观察的循环 |
| **Agent 类型** | ReAct、OpenAI Functions、Self-Ask 等 |
| **自定义 Agent** | 自定义 Prompt 和工具选择逻辑 |
| **多 Agent 协作** | 多个 Agent 分工合作完成复杂任务 |

---

## 8 新手常见误区

### 误区 1："Agent 可以解决所有问题"

**错！** Agent 有额外的 token 消耗，简单任务用 Chain 更高效。

正确做法：根据任务复杂度选择合适的方案。

### 误区 2："工具越多越好"

**错！** 工具太多会让 Agent 难以选择，降低准确性。

正确做法：只提供必要的工具，保持工具描述清晰。

### 误区 3："不设置最大迭代次数"

**错！** Agent 可能陷入无限循环。

正确做法：设置 `max_iterations` 限制迭代次数。

### 误区 4："不处理解析错误"

**错！** Agent 可能输出格式错误，导致解析失败。

正确做法：设置 `handle_parsing_errors=True`。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：创建一个简单的 ReAct Agent。

<details>
<summary>点击查看答案</summary>

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.tools import tool

@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))

tools = [calculate]
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

agent = create_react_agent(llm, tools)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = agent_executor.invoke({
    "input": "计算 123 * 456 + 789"
})
print(result["output"])
```

</details>

### 练习 2：进阶练习

**题目**：创建一个多工具 Agent。

<details>
<summary>点击查看答案</summary>

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.tools import tool

@tool
def search_weather(city: str) -> str:
    """搜索天气"""
    return f"{city}今天晴，25°C"

@tool
def suggest_activity(weather: str) -> str:
    """建议活动"""
    if "晴" in weather:
        return "建议户外活动"
    return "建议室内活动"

tools = [search_weather, suggest_activity]
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

agent = create_react_agent(llm, tools)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = agent_executor.invoke({
    "input": "北京天气怎么样？适合做什么活动？"
})
print(result["output"])
```

</details>

### 练习 3（挑战）：综合练习

**题目**：实现多 Agent 协作系统。

<details>
<summary>点击查看答案</summary>

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.tools import tool

@tool
def research(topic: str) -> str:
    """研究主题"""
    return f"{topic} 的研究结果..."

@tool
def write_summary(research: str) -> str:
    """写总结"""
    return f"基于 {research} 的总结..."

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 研究员 Agent
researcher = create_react_agent(llm, [research])
researcher_executor = AgentExecutor(agent=researcher, tools=[research])

# 总结员 Agent
summarizer = create_react_agent(llm, [write_summary])
summarizer_executor = AgentExecutor(agent=summarizer, tools=[write_summary])

# 协作
research_result = researcher_executor.invoke({"input": "AI 发展"})
final_result = summarizer_executor.invoke({
    "input": research_result["output"]
})

print(final_result["output"])
```

</details>

---

## 下一章预告

下一章我们会学习 **RAG 核心原理**——也就是检索增强生成的工作原理。你会学到为什么需要 RAG、RAG 的工作流程、以及 RAG 的优势。
