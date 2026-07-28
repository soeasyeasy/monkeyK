---
title: "第03章：LLM 与 Chat Model 核心概念"
description: "深入理解大语言模型与聊天模型的区别，掌握模型调用方式和参数设置"
---

# 第03章：LLM 与 Chat Model 核心概念

## 本章导读

在学这一章之前，你可能会有这些疑问：

- LLM 和 Chat Model 有什么区别？
- 为什么要区分这两种模型？
- 如何调用不同的模型（OpenAI、Claude、本地模型）？
- 模型参数（temperature、top_p 等）是什么意思？

这一章就是为了解答这些问题。我们会深入理解 LLM 和 Chat Model 的区别，掌握如何调用不同的大模型，以及如何设置模型参数。

---

## 1 为什么需要区分 LLM 和 Chat Model？

### 痛点分析

很多新手在使用 LangChain 时，会混淆 LLM 和 Chat Model：

```python
# ❌ 混淆 LLM 和 Chat Model
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI

# 不知道什么时候用哪个
llm = OpenAI()  # 这是什么？
chat = ChatOpenAI()  # 这又是什么？
```

**问题**：

1. **输入格式不同**：LLM 接收字符串，Chat Model 接收消息列表
2. **输出格式不同**：LLM 返回字符串，Chat Model 返回消息对象
3. **使用场景不同**：LLM 适合简单补全，Chat Model 适合对话场景

### 解决方案

理解两者的区别，选择合适的模型类型：

- **LLM**：文本补全模型，输入一段文本，输出补全内容
- **Chat Model**：对话模型，输入消息列表，输出回复消息

打个比方：

> **LLM 就像填空题**：给你一段话，让你补全后面的内容
>
> **Chat Model 就像聊天**：你说一句，它回一句，有来有往

---

## 2 LLM（文本补全模型）

### 2.1 什么是 LLM？

LLM（Large Language Model）是文本补全模型，它接收一段文本，然后补全后面的内容。

**工作原理**：

```
输入： "今天天气真"
输出： "好，适合出去散步。"
```

### 2.2 使用 LLM

```python
from langchain.llms import OpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 创建 LLM 实例
llm = OpenAI(
    model="text-davinci-003",  # 使用的模型
    temperature=0.7,  # 温度参数
    max_tokens=100  # 最大输出 token 数
)

# 调用模型
# 输入：字符串
# 输出：字符串
result = llm.invoke("请写一首关于春天的诗：")
print(result)
```

**代码解释**：

1. **创建实例**：使用 `OpenAI()` 创建 LLM 实例
2. **调用模型**：使用 `invoke()` 方法，传入字符串
3. **获取结果**：直接返回字符串

> **原理**：LLM 会把输入文本当作前缀，然后生成后续内容。

### 2.3 LLM 的局限性

```python
# ❌ LLM 不适合多轮对话
llm = OpenAI()

# 第一次对话
response1 = llm.invoke("我叫小明")
print(response1)  # "你好，小明！"

# 第二次对话
response2 = llm.invoke("我叫什么名字？")
print(response2)  # "我不知道你叫什么名字"
# 问题：LLM 不记得之前的对话
```

---

## 3 Chat Model（聊天模型）

### 3.1 什么是 Chat Model？

Chat Model 是对话模型，它接收消息列表，输出回复消息。

**工作原理**：

```
输入： [
  {"role": "system", "content": "你是一个友好的助手"},
  {"role": "user", "content": "你好"}
]
输出： {"role": "assistant", "content": "你好！有什么我可以帮助你的吗？"}
```

### 3.2 使用 Chat Model

```python
from langchain.chat_models import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 创建 Chat Model 实例
chat = ChatOpenAI(
    model="gpt-3.5-turbo",  # 使用的模型
    temperature=0.7,  # 温度参数
    max_tokens=100  # 最大输出 token 数
)

# 构建消息列表
messages = [
    SystemMessage(content="你是一个友好的 AI 助手"),
    HumanMessage(content="你好")
]

# 调用模型
# 输入：消息列表
# 输出：消息对象
response = chat.invoke(messages)
print(response.content)  # 获取回复内容
print(response.response_metadata)  # 获取元数据（token 使用等）
```

**代码解释**：

1. **创建实例**：使用 `ChatOpenAI()` 创建 Chat Model 实例
2. **构建消息**：使用 `SystemMessage`、`HumanMessage` 等构建消息列表
3. **调用模型**：使用 `invoke()` 方法，传入消息列表
4. **获取结果**：返回 `AIMessage` 对象，通过 `.content` 获取内容

> **原理**：Chat Model 会理解消息的角色（system/user/assistant），然后生成合适的回复。

### 3.3 消息类型

| 消息类型 | 作用 | 使用场景 |
| --- | --- | --- |
| **SystemMessage** | 系统消息 | 设置模型的行为和角色 |
| **HumanMessage** | 用户消息 | 用户的输入 |
| **AIMessage** | AI 消息 | AI 的回复（用于对话历史） |
| **FunctionMessage** | 函数消息 | 函数调用的结果 |
| **ToolMessage** | 工具消息 | 工具调用的结果 |

### 3.4 多轮对话

```python
from langchain.chat_models import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage

chat = ChatOpenAI(model="gpt-3.5-turbo")

# 对话历史
chat_history = []

# 第一轮对话
chat_history.append(HumanMessage(content="我叫小明"))
response1 = chat.invoke(chat_history)
chat_history.append(AIMessage(content=response1.content))
print(f"AI：{response1.content}")

# 第二轮对话
chat_history.append(HumanMessage(content="我叫什么名字？"))
response2 = chat.invoke(chat_history)
chat_history.append(AIMessage(content=response2.content))
print(f"AI：{response2.content}")  # "你叫小明"
```

**代码解释**：

1. **维护历史**：把每次的对话都添加到 `chat_history`
2. **传入历史**：每次调用时传入完整的对话历史
3. **记住上下文**：模型会根据历史记录理解上下文

> **原理**：Chat Model 会把所有历史消息都传给模型，让模型理解上下文。

---

## 4 LLM vs Chat Model 对比

| 对比项 | LLM | Chat Model |
| --- | --- | --- |
| **输入格式** | 字符串 | 消息列表 |
| **输出格式** | 字符串 | 消息对象 |
| **适用场景** | 文本补全、简单任务 | 对话、多轮交互 |
| **对话能力** | 无 | 有 |
| **角色理解** | 无 | 有（system/user/assistant） |
| **推荐度** | 不推荐（逐渐淘汰） | 推荐（主流） |

> **建议**：优先使用 Chat Model，因为它是主流，功能更强大。

---

## 5 模型参数详解

### 5.1 temperature（温度）

控制输出的随机性。

| 值 | 效果 | 适用场景 |
| --- | --- | --- |
| **0** | 最确定，输出最稳定 | 问答、分类、提取 |
| **0.3-0.5** | 较确定，略有变化 | 摘要、翻译 |
| **0.7-1.0** | 较随机，有创意 | 创意写作、头脑风暴 |
| **1.5-2.0** | 很随机，非常创意 | 艺术创作、诗歌 |

```python
# 低温度：输出稳定
llm_low = ChatOpenAI(temperature=0)
response1 = llm_low.invoke([HumanMessage(content="1+1=")])
response2 = llm_low.invoke([HumanMessage(content="1+1=")])
# 两次输出几乎一样："2"

# 高温度：输出随机
llm_high = ChatOpenAI(temperature=1.5)
response1 = llm_high.invoke([HumanMessage(content="写一首诗")])
response2 = llm_high.invoke([HumanMessage(content="写一首诗")])
# 两次输出完全不同
```

### 5.2 max_tokens（最大 token 数）

控制输出的最大长度。

```python
# 限制输出长度
chat = ChatOpenAI(max_tokens=50)
response = chat.invoke([HumanMessage(content="请详细介绍 Python 的历史")])
# 输出会被截断在 50 个 token
```

> **原理**：token 是模型处理文本的最小单位，一个 token 大约等于 0.75 个英文单词或 0.5 个中文字。

### 5.3 top_p（核采样）

控制输出的多样性。

| 值 | 效果 | 说明 |
| --- | --- | --- |
| **0.1** | 只考虑最可能的 10% | 输出最确定 |
| **0.5** | 考虑最可能的 50% | 较确定 |
| **0.9** | 考虑最可能的 90% | 较多样 |
| **1.0** | 考虑所有可能 | 最多样 |

```python
# 使用 top_p
chat = ChatOpenAI(top_p=0.9)
```

> **建议**：通常调节 temperature 就够了，top_p 可以保持默认。

### 5.4 model_name（模型名称）

指定使用的模型。

| 模型 | 特点 | 适用场景 |
| --- | --- | --- |
| **gpt-3.5-turbo** | 快速、便宜 | 一般任务 |
| **gpt-4** | 强大、昂贵 | 复杂任务 |
| **gpt-4-turbo** | 强大、快速 | 复杂任务（推荐） |
| **gpt-4o** | 最新、最强 | 所有场景 |

```python
# 使用不同模型
chat_gpt35 = ChatOpenAI(model="gpt-3.5-turbo")
chat_gpt4 = ChatOpenAI(model="gpt-4")
chat_gpt4o = ChatOpenAI(model="gpt-4o")
```

---

## 6 调用不同的大模型

### 6.1 OpenAI

```python
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0
)
```

### 6.2 Anthropic Claude

```python
from langchain_anthropic import ChatAnthropic

chat = ChatAnthropic(
    model="claude-3-opus-20240229",
    temperature=0
)
```

### 6.3 智谱 AI（国内）

```python
from langchain_community.chat_models import ChatZhipuAI

chat = ChatZhipuAI(
    model="glm-4",
    temperature=0
)
```

### 6.4 本地模型（Ollama）

```python
from langchain_community.chat_models import ChatOllama

chat = ChatOllama(
    model="llama2",
    temperature=0
)
```

> **原理**：LangChain 提供了统一的接口，让你可以方便地切换不同的大模型。

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **LLM** | 文本补全模型，输入字符串，输出字符串 |
| **Chat Model** | 对话模型，输入消息列表，输出消息对象 |
| **消息类型** | SystemMessage、HumanMessage、AIMessage、FunctionMessage、ToolMessage |
| **temperature** | 控制输出随机性，0 最确定，2 最随机 |
| **max_tokens** | 控制输出最大长度 |
| **model_name** | 指定使用的模型 |

---

## 8 新手常见误区

### 误区 1："temperature 越高越好"

**错！** temperature 越高，输出越随机，可能导致回答不准确。

正确做法：根据场景选择合适的 temperature。

### 误区 2："总是使用最新的模型"

**错！** 最新的模型（如 gpt-4）虽然强大，但成本高、速度慢。

正确做法：根据任务复杂度选择合适的模型。

### 误区 3："不设置 max_tokens"

**错！** 不设置 max_tokens，模型可能会生成过长的内容，浪费 token。

正确做法：根据任务设置合适的 max_tokens。

### 误区 4："混淆 LLM 和 Chat Model"

**错！** LLM 和 Chat Model 的输入输出格式不同，不能混用。

正确做法：对话场景使用 Chat Model，文本补全使用 LLM。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：使用 Chat Model 创建一个简单的问答程序。

<details>
<summary>点击查看答案</summary>

```python
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

chat = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

messages = [
    SystemMessage(content="你是一个友好的 AI 助手"),
    HumanMessage(content="什么是 Python？")
]

response = chat.invoke(messages)
print(f"AI：{response.content}")
```

</details>

### 练习 2：进阶练习

**题目**：创建一个多轮对话程序，能够记住对话历史。

<details>
<summary>点击查看答案</summary>

```python
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage

load_dotenv()

chat = ChatOpenAI(model="gpt-3.5-turbo")
chat_history = []

while True:
    user_input = input("你：")
    if user_input.lower() == "exit":
        break
    
    chat_history.append(HumanMessage(content=user_input))
    response = chat.invoke(chat_history)
    chat_history.append(AIMessage(content=response.content))
    print(f"AI：{response.content}")
```

</details>

### 练习 3（挑战）：综合练习

**题目**：创建一个程序，比较不同 temperature 下的输出差异。

<details>
<summary>点击查看答案</summary>

```python
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

load_dotenv()

temperatures = [0, 0.5, 1.0, 1.5]
question = "写一首关于春天的诗"

for temp in temperatures:
    chat = ChatOpenAI(model="gpt-3.5-turbo", temperature=temp)
    response = chat.invoke([HumanMessage(content=question)])
    print(f"\n=== temperature={temp} ===")
    print(response.content)
```

</details>

---

## 下一章预告

下一章我们会学习 **Prompt Engineering 进阶**——也就是如何设计更好的提示词，让模型输出更准确的结果。你会学到 Few-shot 学习、Prompt 组合与优化等高级技巧。
