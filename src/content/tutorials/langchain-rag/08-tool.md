---
title: "第08章：Tool 工具集成"
description: "掌握 Tool 工具集成，学习如何定义工具、使用内置工具、自定义工具以及工具调用流程"
---

# 第08章：Tool 工具集成

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何让大模型调用外部工具（如搜索引擎、计算器）？
- LangChain 提供了哪些内置工具？
- 如何自定义工具？
- 工具调用的流程是怎样的？

这一章就是为了解答这些问题。我们会深入学习 Tool 的核心概念和使用方法，让你能够构建具有工具调用能力的 AI 应用。

---

## 1 为什么需要 Tool？

### 痛点分析

大模型虽然强大，但有以下局限：

**问题 1：无法获取实时信息**

```python
# ❌ 直接问 GPT 实时信息
response = chat.invoke([HumanMessage(content="今天北京天气怎么样？")])
print(response.content)
# 结果：GPT 不知道今天的天气，只能瞎编
```

**问题 2：无法执行计算**

```python
# ❌ 让 GPT 计算复杂数学
response = chat.invoke([HumanMessage(content="计算 12345 * 67890")])
print(response.content)
# 结果：可能计算错误，因为 GPT 不擅长精确计算
```

**问题 3：无法访问私有数据**

```python
# ❌ 让 GPT 查询数据库
response = chat.invoke([HumanMessage(content="查询用户 ID 为 123 的订单")])
print(response.content)
# 结果：GPT 无法访问你的数据库
```

### 解决方案

**Tool** 可以让大模型调用外部工具，弥补这些不足。

打个比方：

> **Tool 就像给大模型配了一个工具箱**：
> - 没有 Tool = 只有大脑，无法动手
> - 有 Tool = 大脑 + 双手，可以查天气、算数学、查数据库

---

## 2 Tool 核心概念

### 2.1 什么是 Tool？

Tool 是一个可被大模型调用的函数，它包含：

1. **名称**：工具的唯一标识
2. **描述**：告诉模型这个工具能做什么
3. **参数**：工具需要的输入参数
4. **执行逻辑**：工具的具体实现

### 2.2 Tool 的组成

```python
from langchain.tools import Tool

# 创建一个简单的工具
def search_weather(city: str) -> str:
    """搜索天气信息"""
    # 这里应该调用真实的天气 API
    return f"{city}今天晴，气温 25°C"

weather_tool = Tool(
    name="WeatherSearch",  # 工具名称
    description="搜索指定城市的天气信息",  # 工具描述
    func=search_weather  # 工具函数
)
```

**代码解释**：

1. **定义函数**：创建工具的执行逻辑
2. **创建 Tool**：使用 `Tool` 类封装工具
3. **设置属性**：名称、描述、函数

> **原理**：Tool 把函数封装成模型可以理解和调用的格式。

---

## 3 内置工具

### 3.1 常用内置工具

LangChain 提供了丰富的内置工具：

```python
from langchain_community.tools import (
    DuckDuckGoSearchRun,  # DuckDuckGo 搜索
    WikipediaQueryRun,    # Wikipedia 查询
    ArxivQueryRun,        # Arxiv 论文查询
    YouTubeSearchTool,    # YouTube 搜索
)

# DuckDuckGo 搜索
search = DuckDuckGoSearchRun()
result = search.run("Python 是什么")
print(result)

# Wikipedia 查询
from langchain_community.utilities import WikipediaAPIWrapper
wikipedia = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())
result = wikipedia.run("Python")
print(result)
```

### 3.2 使用工具集

```python
from langchain_community.agent_toolkits.load_tools import load_tools

# 加载多个工具
tools = load_tools([
    "ddg-search",      # DuckDuckGo 搜索
    "wikipedia",       # Wikipedia
    "arxiv",           # Arxiv
])

print(f"加载了 {len(tools)} 个工具")
for tool in tools:
    print(f"- {tool.name}: {tool.description}")
```

**代码解释**：

1. **使用 load_tools**：批量加载工具
2. **传入工具名**：使用字符串指定工具
3. **返回工具列表**：可以直接传给 Agent

> **原理**：LangChain 封装了各种第三方 API，让你可以方便地使用。

---

## 4 自定义工具

### 4.1 使用 @tool 装饰器

```python
from langchain.tools import tool

@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    try:
        result = eval(expression)
        return f"计算结果：{result}"
    except Exception as e:
        return f"计算错误：{e}"

# 查看工具信息
print(f"名称：{calculate.name}")
print(f"描述：{calculate.description}")
print(f"参数：{calculate.args}")

# 调用工具
result = calculate.run("12345 * 67890")
print(result)  # "计算结果：838102050"
```

**代码解释**：

1. **使用 @tool**：装饰器自动创建 Tool
2. **文档字符串**：作为工具描述
3. **参数类型**：自动推断参数类型

> **原理**：@tool 装饰器会把普通函数转换成 Tool 对象。

### 4.2 使用 StructuredTool

更复杂的工具，支持参数验证。

```python
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

# 定义参数模型
class CalculatorInput(BaseModel):
    expression: str = Field(description="数学表达式")
    precision: int = Field(default=2, description="小数精度")

def calculate_advanced(expression: str, precision: int = 2) -> str:
    """高级计算器"""
    try:
        result = eval(expression)
        return f"计算结果：{result:.{precision}f}"
    except Exception as e:
        return f"计算错误：{e}"

calculator = StructuredTool.from_function(
    func=calculate_advanced,
    name="AdvancedCalculator",
    description="高级计算器，支持精度设置",
    args_schema=CalculatorInput
)

# 调用
result = calculator.run({
    "expression": "3.14159 * 2",
    "precision": 4
})
print(result)  # "计算结果：6.2832"
```

**代码解释**：

1. **定义参数模型**：使用 Pydantic 定义参数结构
2. **创建 StructuredTool**：使用 `from_function` 创建
3. **设置 args_schema**：指定参数验证规则

> **原理**：StructuredTool 会使用 Pydantic 验证参数，确保输入正确。

### 4.3 数据库查询工具

```python
from langchain.tools import tool
import sqlite3

@tool
def query_database(sql: str) -> str:
    """查询数据库"""
    try:
        conn = sqlite3.connect("example.db")
        cursor = conn.cursor()
        cursor.execute(sql)
        results = cursor.fetchall()
        conn.close()
        return str(results)
    except Exception as e:
        return f"查询错误：{e}"

# 使用
result = query_database.run("SELECT * FROM users WHERE id = 123")
print(result)
```

---

## 5 工具调用流程

### 5.1 工具调用流程

```
用户提问 → 模型分析 → 决定使用工具 → 调用工具 → 获取结果 → 生成回答
```

### 5.2 使用 Agent 调用工具

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.tools import tool

# 定义工具
@tool
def search_weather(city: str) -> str:
    """搜索天气信息"""
    return f"{city}今天晴，气温 25°C"

@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))

# 创建工具列表
tools = [search_weather, calculate]

# 创建 LLM
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 创建 Agent
agent = create_react_agent(llm, tools)

# 创建 AgentExecutor
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 调用
result = agent_executor.invoke({
    "input": "北京今天天气怎么样？另外，计算 123 * 456"
})
print(result["output"])
```

**代码解释**：

1. **定义工具**：创建多个工具
2. **创建 Agent**：使用 `create_react_agent` 创建
3. **创建 Executor**：使用 `AgentExecutor` 执行
4. **调用**：Agent 会自动决定使用哪些工具

> **原理**：Agent 会根据用户问题，自动决定使用哪些工具，并整合结果。

### 5.3 手动调用工具

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.tools import tool

@tool
def search_weather(city: str) -> str:
    """搜索天气信息"""
    return f"{city}今天晴，气温 25°C"

# 创建 Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个助手，可以使用工具获取信息。"),
    ("human", "{input}")
])

# 绑定工具
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
llm_with_tools = llm.bind_tools([search_weather])

# 调用
messages = prompt.format_messages(input="北京天气怎么样？")
response = llm_with_tools.invoke(messages)

# 检查是否有工具调用
if response.tool_calls:
    for tool_call in response.tool_calls:
        print(f"调用工具：{tool_call['name']}")
        print(f"参数：{tool_call['args']}")
        
        # 执行工具
        result = search_weather.invoke(tool_call['args'])
        print(f"结果：{result}")
```

**代码解释**：

1. **绑定工具**：使用 `bind_tools` 把工具绑定到 LLM
2. **调用模型**：模型会返回工具调用信息
3. **检查 tool_calls**：判断是否需要调用工具
4. **执行工具**：手动调用工具并获取结果

> **原理**：模型会分析用户问题，决定是否需要调用工具，并返回工具调用信息。

---

## 6 工具对比

| 工具类型 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **@tool 装饰器** | 简单、快速 | 功能有限 | 简单工具 |
| **StructuredTool** | 参数验证、类型安全 | 代码较多 | 复杂工具 |
| **Tool 类** | 灵活、可控 | 需要手动封装 | 特殊需求 |

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Tool** | 可被大模型调用的外部工具 |
| **内置工具** | LangChain 提供的现成工具 |
| **自定义工具** | 使用 @tool 或 StructuredTool 创建 |
| **工具调用流程** | 用户提问 → 模型分析 → 调用工具 → 生成回答 |
| **Agent** | 自动决策使用哪些工具 |

---

## 8 新手常见误区

### 误区 1："工具描述不重要"

**错！** 工具描述是模型理解工具用途的关键。

正确做法：写清晰、准确的工具描述。

### 误区 2："参数类型不重要"

**错！** 参数类型错误会导致工具调用失败。

正确做法：使用 Pydantic 定义参数类型，确保类型安全。

### 误区 3："所有工具都用 Agent"

**错！** Agent 有额外的 token 消耗，简单场景可以手动调用。

正确做法：根据场景选择使用 Agent 或手动调用。

### 误区 4："不处理工具错误"

**错！** 工具调用可能失败，需要处理异常。

正确做法：在工具函数中添加异常处理，返回友好的错误信息。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：创建一个计算器工具。

<details>
<summary>点击查看答案</summary>

```python
from langchain.tools import tool

@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    try:
        result = eval(expression)
        return f"计算结果：{result}"
    except Exception as e:
        return f"计算错误：{e}"

# 测试
result = calculate.run("123 * 456")
print(result)  # "计算结果：56088"
```

</details>

### 练习 2：进阶练习

**题目**：创建一个数据库查询工具。

<details>
<summary>点击查看答案</summary>

```python
from langchain.tools import tool
import sqlite3

@tool
def query_users(user_id: int) -> str:
    """根据 ID 查询用户信息"""
    try:
        conn = sqlite3.connect("example.db")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return f"用户信息：{result}"
        else:
            return "未找到用户"
    except Exception as e:
        return f"查询错误：{e}"

# 测试
result = query_users.run(123)
print(result)
```

</details>

### 练习 3（挑战）：综合练习

**题目**：创建一个带工具调用的 Agent。

<details>
<summary>点击查看答案</summary>

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.tools import tool

@tool
def search_weather(city: str) -> str:
    """搜索天气信息"""
    return f"{city}今天晴，气温 25°C"

@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))

tools = [search_weather, calculate]
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

agent = create_react_agent(llm, tools)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = agent_executor.invoke({
    "input": "北京天气怎么样？计算 123 * 456"
})
print(result["output"])
```

</details>

---

## 下一章预告

下一章我们会学习 **Agent 智能体开发**——也就是如何构建能够自主决策、调用工具的 AI 智能体。你会学到 Agent 架构、ReAct 模式、任务规划、多 Agent 协作等高级用法。
