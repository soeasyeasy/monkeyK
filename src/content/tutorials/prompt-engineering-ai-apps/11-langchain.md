---
title: "第11章：LangChain 框架实战"
description: "LangChain 核心概念、Chain、Memory、Tool、Agent 开发"
---

# 第11章：LangChain 框架实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 LangChain？为什么需要它？
- LangChain 的核心概念有哪些？
- 如何使用 Chain 组合多个组件？
- 如何使用 Memory 实现对话记忆？
- 如何快速构建 Agent？

这一章就是为了解答这些问题。我们会学习 **LangChain 框架**，快速构建强大的 AI 应用。

---

## 1 为什么需要 LangChain？

### 痛点分析

**从零开发的挑战**：

1. **重复造轮子**：每个项目都要重新实现 Prompt 管理、对话记忆等
2. **组件集成复杂**：集成向量数据库、LLM、工具等需要大量工作
3. **缺乏最佳实践**：不知道如何组织代码结构

**举个例子**：

```
❌ 从零开发 RAG 系统：
- 手动实现文档切分
- 手动集成向量数据库
- 手动管理 Prompt 模板
- 手动实现对话记忆
- 代码量：1000+ 行

✅ 使用 LangChain：
- 内置文档加载器
- 内置向量数据库集成
- 内置 Prompt 模板
- 内置 Memory 组件
- 代码量：100 行
```

### 解决方案

> **一句话总结**：LangChain 提供了一套标准化的框架，让 AI 应用开发更高效。

---

## 2 核心原理

### LangChain 核心组件

```
┌─────────────────────────────────────┐
│  Models: LLM/ChatModel 封装         │
│  Prompts: 模板管理                   │
│  Chains: 组件串联                    │
│  Memory: 对话记忆                    │
│  Tools: 工具集成                     │
│  Agents: 智能体                      │
│  Indexes: 文档索引                   │
└─────────────────────────────────────┘
```

---

## 3 基础用法

### 安装与基础调用

```bash
pip install langchain
pip install langchain-openai
pip install langchain-community
```

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# 初始化模型
llm = ChatOpenAI(model="gpt-4", temperature=0.7)

# 基础调用
messages = [
    SystemMessage(content="你是一个友好的助手"),
    HumanMessage(content="你好，介绍一下自己")
]

response = llm.invoke(messages)
print(response.content)
```

### Prompt 模板

```python
from langchain_core.prompts import ChatPromptTemplate

# 创建模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}专家"),
    ("user", "{question}")
])

# 格式化
formatted = prompt.format_messages(
    role="Python",
    question="什么是装饰器？"
)

# 调用
response = llm.invoke(formatted)
print(response.content)
```

### Chain 组合

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

# 创建组件
prompt = ChatPromptTemplate.from_template("用一句话解释什么是{topic}")
llm = ChatOpenAI(model="gpt-4")
output_parser = StrOutputParser()

# 组合成 Chain
chain = prompt | llm | output_parser

# 调用
result = chain.invoke({"topic": "人工智能"})
print(result)
```

### Memory 对话记忆

```python
from langchain_openai import ChatOpenAI
from langchain_core.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

# 创建带记忆的 Chain
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

chain = prompt | ChatOpenAI(model="gpt-4") | StrOutputParser()

# 使用
chat_history = []

# 第一轮
response1 = chain.invoke({
    "input": "我叫张三",
    "chat_history": chat_history
})
print(f"AI: {response1}")

# 更新历史
chat_history.extend([
    ("human", "我叫张三"),
    ("ai", response1)
])

# 第二轮
response2 = chain.invoke({
    "input": "我叫什么名字？",
    "chat_history": chat_history
})
print(f"AI: {response2}")  # 会记得你叫张三
```

### Tool 工具集成

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# 定义工具
@tool
def get_weather(city: str) -> str:
    """获取指定城市的天气"""
    weather_data = {
        "北京": "晴，25°C",
        "上海": "多云，28°C",
        "广州": "雨，30°C"
    }
    return weather_data.get(city, f"未找到{city}的天气信息")

@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    try:
        return str(eval(expression))
    except:
        return "计算错误"

# 绑定工具到模型
llm = ChatOpenAI(model="gpt-4")
llm_with_tools = llm.bind_tools([get_weather, calculate])

# 调用
response = llm_with_tools.invoke("北京天气怎么样？")
print(response.tool_calls)
```

### Agent 智能体

```python
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

# 定义工具
@tool
def search(query: str) -> str:
    """搜索信息"""
    return f"搜索结果：{query}的相关信息"

@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))

# 创建 Agent
llm = ChatOpenAI(model="gpt-4")
agent = create_react_agent(llm, [search, calculate])

# 运行
result = agent.invoke({
    "messages": [("user", "搜索 Python 并计算 123 * 456")]
})

for message in result["messages"]:
    print(f"{message.type}: {message.content}")
```

---

## 4 进阶用法

### RAG Chain

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.vectorstores import Chroma

# 创建向量库
vectorstore = Chroma.from_texts(
    texts=[
        "Python 是一种解释型编程语言",
        "JavaScript 主要用于网页开发",
        "Java 是一种面向对象的语言"
    ],
    embedding=OpenAIEmbeddings()
)

retriever = vectorstore.as_retriever()

# 创建 RAG Chain
prompt = ChatPromptTemplate.from_template("""基于以下信息回答问题：

{context}

问题：{question}""")

rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | ChatOpenAI(model="gpt-4")
    | StrOutputParser()
)

# 使用
result = rag_chain.invoke("Python 是什么？")
print(result)
```

### 自定义 Chain

```python
from langchain_core.runnables import RunnableLambda, RunnableSequence

# 自定义处理函数
def preprocess(input_dict):
    """预处理"""
    return {"text": input_dict["text"].lower()}

def postprocess(output):
    """后处理"""
    return output.strip()

# 创建 Chain
llm = ChatOpenAI(model="gpt-4")

chain = (
    RunnableLambda(preprocess)
    | ChatPromptTemplate.from_template("总结：{text}")
    | llm
    | StrOutputParser()
    | RunnableLambda(postprocess)
)

# 使用
result = chain.invoke({"text": "这是一段需要总结的长文本..."})
print(result)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Models | LLM/ChatModel 封装 |
| Prompts | 模板管理和格式化 |
| Chains | 组件串联（LCEL 语法） |
| Memory | 对话记忆管理 |
| Tools | 工具定义和绑定 |
| Agents | ReAct Agent 构建 |
| RAG | 检索增强生成 |

---

## 6 新手常见误区

### 误区 1："LangChain 太复杂，不想学"

**错！** LangChain 的核心很简单：
- 组件化设计
- LCEL 链式调用
- 丰富的内置组件

### 误区 2："所有项目都要用 LangChain"

不对。LangChain 适用场景：
- ✅ 复杂 AI 应用
- ✅ 需要集成多个组件
- ❌ 简单 API 调用
- ❌ 性能要求极高

### 误区 3："LangChain 会限制灵活性"

实际上：
- LangChain 提供的是抽象，不是限制
- 可以随时切换到原生 API
- 组件可以独立使用

---

## 7 动手练习

### 练习 1：基础练习 - 简单 Chain

**任务**：使用 LangChain 创建一个简单的问答 Chain。

<details>
<summary>点击查看答案</summary>

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("用一句话解释什么是{topic}")
llm = ChatOpenAI(model="gpt-4")
output_parser = StrOutputParser()

chain = prompt | llm | output_parser

result = chain.invoke({"topic": "机器学习"})
print(result)
```

</details>

### 练习 2：进阶练习 - 带记忆的对话

**任务**：实现一个带对话记忆的 Chain。

<details>
<summary>点击查看答案</summary>

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

chain = prompt | ChatOpenAI(model="gpt-4") | StrOutputParser()

chat_history = []

# 第一轮
response1 = chain.invoke({"input": "我叫张三", "chat_history": chat_history})
print(f"AI: {response1}")
chat_history.extend([("human", "我叫张三"), ("ai", response1)])

# 第二轮
response2 = chain.invoke({"input": "我叫什么？", "chat_history": chat_history})
print(f"AI: {response2}")
```

</details>

### 练习 3（挑战）：综合练习 - RAG 系统

**任务**：使用 LangChain 实现一个完整的 RAG 系统。

<details>
<summary>点击查看答案</summary>

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.vectorstores import Chroma

# 创建知识库
texts = [
    "Python 由 Guido van Rossum 于 1991 年创建",
    "Python 支持多种编程范式",
    "Python 有丰富的标准库"
]

vectorstore = Chroma.from_texts(texts=texts, embedding=OpenAIEmbeddings())
retriever = vectorstore.as_retriever()

# 创建 RAG Chain
prompt = ChatPromptTemplate.from_template("""基于以下信息回答：

{context}

问题：{question}""")

rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | ChatOpenAI(model="gpt-4")
    | StrOutputParser()
)

result = rag_chain.invoke("Python 是谁创建的？")
print(result)
```

</details>

---

## 下一章预告

下一章我们会学习 **LlamaIndex 数据框架**——另一个强大的 AI 应用开发框架。
