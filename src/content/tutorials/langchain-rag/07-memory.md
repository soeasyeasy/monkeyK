---
title: "第07章：Memory 记忆系统"
description: "掌握 Memory 记忆系统，学习 BufferMemory、SummaryMemory、持久化存储等高级用法"
---

# 第07章：Memory 记忆系统

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何让大模型记住对话历史？
- 对话历史太长怎么办？
- 如何保存对话记录到文件？
- 不同类型的 Memory 有什么区别？

这一章就是为了解答这些问题。我们会深入学习 Memory 的核心概念和使用方法，让你能够构建具有记忆能力的 AI 应用。

---

## 1 为什么需要 Memory？

### 痛点分析

大模型本身是无状态的，每次调用都是独立的：

```python
# ❌ 每次调用都是独立的
chat = ChatOpenAI(model="gpt-3.5-turbo")

# 第一次对话
response1 = chat.invoke([HumanMessage(content="我叫小明")])
print(response1.content)  # "你好，小明！"

# 第二次对话
response2 = chat.invoke([HumanMessage(content="我叫什么名字？")])
print(response2.content)  # "我不知道你叫什么名字"
# 问题：模型不记得之前的对话
```

### 解决方案

**Memory** 可以让大模型记住对话历史。

打个比方：

> **Memory 就像人的记忆**：
> - 没有 Memory = 失忆症患者，每次见面都不认识你
> - 有 Memory = 正常人，能记住之前说过什么

---

## 2 基础 Memory

### 2.1 ConversationBufferMemory（对话缓冲区记忆）

最简单的 Memory，保存所有对话历史。

```python
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

# 创建 Memory
memory = ConversationBufferMemory(
    memory_key="chat_history",  # Memory 的键名
    return_messages=True  # 返回消息列表
)

# 创建 Prompt，使用 MessagesPlaceholder
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的 AI 助手"),
    MessagesPlaceholder(variable_name="chat_history"),  # 占位符，会被 Memory 填充
    ("human", "{input}")
])

# 创建 Chain
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
chain = prompt | llm | StrOutputParser()

# 使用 Memory
# 第一次对话
memory.save_context(
    {"input": "我叫小明"},
    {"output": "你好，小明！很高兴认识你。"}
)

# 第二次对话
memory.save_context(
    {"input": "我叫什么名字？"},
    {"output": "你叫小明。"}
)

# 获取 Memory
chat_history = memory.load_memory_variables({})["chat_history"]

# 调用 Chain
result = chain.invoke({
    "chat_history": chat_history,
    "input": "我还叫什么名字？"
})
print(result)  # "你叫小明。"
```

**代码解释**：

1. **创建 Memory**：使用 `ConversationBufferMemory` 创建缓冲区记忆
2. **设置 memory_key**：指定 Memory 在 Prompt 中的键名
3. **使用 MessagesPlaceholder**：在 Prompt 中预留位置
4. **保存上下文**：使用 `save_context()` 保存对话
5. **加载 Memory**：使用 `load_memory_variables()` 获取历史

> **原理**：ConversationBufferMemory 会把所有对话历史都保存下来，每次调用时传给模型。

### 2.2 使用 ConversationChain 简化

LangChain 提供了 `ConversationChain`，自动处理 Memory。

```python
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI

# 创建组件
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
memory = ConversationBufferMemory()

# 创建 ConversationChain
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True  # 打印详细信息
)

# 使用
response1 = conversation.predict(input="我叫小明")
print(response1)  # "你好，小明！"

response2 = conversation.predict(input="我叫什么名字？")
print(response2)  # "你叫小明。"
```

**代码解释**：

1. **创建 ConversationChain**：自动处理 Memory
2. **使用 predict**：自动保存和加载 Memory
3. **verbose=True**：打印详细的调用过程

> **原理**：ConversationChain 会自动把对话历史保存到 Memory，并在下次调用时加载。

---

## 3 高级 Memory 类型

### 3.1 ConversationBufferWindowMemory（窗口记忆）

只保存最近的 K 轮对话，避免历史太长。

```python
from langchain.memory import ConversationBufferWindowMemory

# 创建窗口记忆，只保存最近 2 轮对话
memory = ConversationBufferWindowMemory(
    k=2,  # 保存最近 2 轮
    memory_key="chat_history",
    return_messages=True
)

# 保存 5 轮对话
for i in range(5):
    memory.save_context(
        {"input": f"问题 {i}"},
        {"output": f"回答 {i}"}
    )

# 查看保存的对话
chat_history = memory.load_memory_variables({})["chat_history"]
print(f"保存了 {len(chat_history)} 条消息")  # 4 条（2 轮）
```

**代码解释**：

1. **设置 k=2**：只保存最近 2 轮对话
2. **自动裁剪**：超过 K 轮的对话会被自动删除

> **原理**：窗口记忆只保留最近的 K 轮对话，适合长对话场景。

### 3.2 ConversationSummaryMemory（摘要记忆）

把对话历史总结成摘要，节省 token。

```python
from langchain.memory import ConversationSummaryMemory
from langchain_openai import ChatOpenAI

# 创建摘要记忆
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="chat_history",
    return_messages=True
)

# 保存多轮对话
memory.save_context(
    {"input": "我叫小明，今年 25 岁"},
    {"output": "你好，小明！很高兴认识你。"}
)
memory.save_context(
    {"input": "我是 Python 开发工程师"},
    {"output": "Python 是个很好的编程语言。"}
)
memory.save_context(
    {"input": "我喜欢编程和阅读"},
    {"output": "这些都是很好的爱好。"}
)

# 查看摘要
summary = memory.load_memory_variables({})["chat_history"]
print(summary)
# 输出：用户叫小明，25 岁，是 Python 开发工程师，喜欢编程和阅读。
```

**代码解释**：

1. **创建摘要记忆**：使用 `ConversationSummaryMemory`
2. **自动总结**：每次保存时，会自动总结之前的对话
3. **节省 token**：只传递摘要，不传递完整历史

> **原理**：摘要记忆会使用 LLM 把对话历史总结成简短的摘要，大幅减少 token 消耗。

### 3.3 ConversationSummaryBufferMemory（摘要缓冲区记忆）

结合窗口和摘要的优点，保存最近的 K 轮对话 + 更早对话的摘要。

```python
from langchain.memory import ConversationSummaryBufferMemory

# 创建摘要缓冲区记忆
memory = ConversationSummaryBufferMemory(
    llm=llm,
    memory_key="chat_history",
    return_messages=True,
    max_token_limit=100  # 最大 token 限制
)

# 保存多轮对话
for i in range(10):
    memory.save_context(
        {"input": f"这是第 {i} 轮对话"},
        {"output": f"这是第 {i} 轮的回答"}
    )

# 查看结果
result = memory.load_memory_variables({})
print(result)
# 包含：最近几轮的完整对话 + 更早对话的摘要
```

**代码解释**：

1. **设置 max_token_limit**：超过这个限制时，会自动总结
2. **混合模式**：最近的对话保持完整，更早的对话被总结

> **原理**：摘要缓冲区记忆会在 token 超过限制时，自动把旧的对话总结成摘要。

---

## 4 持久化存储

### 4.1 保存到文件

```python
import json
from langchain.memory import ConversationBufferMemory

# 创建 Memory
memory = ConversationBufferMemory()

# 保存对话
memory.save_context({"input": "你好"}, {"output": "你好！"})
memory.save_context({"input": "我叫小明"}, {"output": "你好，小明！"})

# 导出到文件
with open("chat_history.json", "w", encoding="utf-8") as f:
    json.dump(memory.buffer, f, ensure_ascii=False, indent=2)

# 从文件加载
with open("chat_history.json", "r", encoding="utf-8") as f:
    loaded_buffer = json.load(f)

# 恢复 Memory
memory2 = ConversationBufferMemory()
memory2.buffer = loaded_buffer
print(memory2.load_memory_variables({}))
```

### 4.2 使用 Redis 持久化

```python
from langchain.memory import ConversationBufferMemory
from langchain.storage import RedisStore

# 创建 Redis 存储
store = RedisStore(redis_url="redis://localhost:6379")

# 创建 Memory
memory = ConversationBufferMemory()

# 保存对话
memory.save_context({"input": "你好"}, {"output": "你好！"})

# 保存到 Redis
store.mset([("chat_session_1", str(memory.buffer))])

# 从 Redis 加载
loaded = store.mget(["chat_session_1"])
print(loaded)
```

> **原理**：持久化存储可以把对话历史保存到外部存储，实现跨会话的记忆。

---

## 5 Memory 对比

| Memory 类型 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **BufferMemory** | 完整保留历史 | token 消耗大 | 短对话 |
| **WindowMemory** | 控制历史长度 | 丢失早期信息 | 中等长度对话 |
| **SummaryMemory** | 节省 token | 总结可能丢失细节 | 长对话 |
| **SummaryBufferMemory** | 平衡完整性和效率 | 实现复杂 | 长对话（推荐） |

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Memory** | 让大模型记住对话历史 |
| **BufferMemory** | 保存所有对话历史 |
| **WindowMemory** | 只保存最近 K 轮对话 |
| **SummaryMemory** | 把对话总结成摘要 |
| **SummaryBufferMemory** | 结合窗口和摘要的优点 |
| **持久化** | 把对话历史保存到外部存储 |

---

## 7 新手常见误区

### 误区 1："不使用 Memory，手动维护历史"

**错！** 手动维护历史代码很乱，容易出错。

正确做法：使用 LangChain 提供的 Memory 组件。

### 误区 2："总是使用 BufferMemory"

**错！** BufferMemory 会保存所有历史，token 消耗很大。

正确做法：根据对话长度选择合适的 Memory 类型。

### 误区 3："不设置 token 限制"

**错！** 不设置限制，对话历史会越来越长，导致成本飙升。

正确做法：使用 WindowMemory 或 SummaryBufferMemory，控制历史长度。

### 误区 4："不持久化 Memory"

**错！** 不持久化，重启程序后对话历史就丢失了。

正确做法：使用外部存储（如 Redis、数据库）持久化 Memory。

---

## 8 动手练习

### 练习 1：基础练习

**题目**：创建一个带 Memory 的对话程序。

<details>
<summary>点击查看答案</summary>

```python
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
memory = ConversationBufferMemory()

conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=False
)

# 多轮对话
while True:
    user_input = input("你：")
    if user_input.lower() == "exit":
        break
    
    response = conversation.predict(input=user_input)
    print(f"AI：{response}\n")
```

</details>

### 练习 2：进阶练习

**题目**：使用 SummaryBufferMemory 实现长对话记忆。

<details>
<summary>点击查看答案</summary>

```python
from langchain.memory import ConversationSummaryBufferMemory
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

memory = ConversationSummaryBufferMemory(
    llm=llm,
    memory_key="chat_history",
    return_messages=True,
    max_token_limit=100
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的 AI 助手"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

chain = prompt | llm | StrOutputParser()

# 模拟长对话
for i in range(10):
    user_input = f"这是第 {i} 轮对话"
    
    # 加载历史
    chat_history = memory.load_memory_variables({})["chat_history"]
    
    # 调用模型
    response = chain.invoke({
        "chat_history": chat_history,
        "input": user_input
    })
    
    # 保存上下文
    memory.save_context({"input": user_input}, {"output": response})
    
    print(f"用户：{user_input}")
    print(f"AI：{response}\n")
```

</details>

### 练习 3（挑战）：综合练习

**题目**：实现一个带持久化存储的对话系统。

<details>
<summary>点击查看答案</summary>

```python
import json
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI

class PersistentConversation:
    def __init__(self, session_id):
        self.session_id = session_id
        self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        self.memory = ConversationBufferMemory()
        self.file_path = f"chat_{session_id}.json"
        
        # 加载历史
        self._load_memory()
        
        # 创建 Chain
        self.conversation = ConversationChain(
            llm=self.llm,
            memory=self.memory
        )
    
    def _load_memory(self):
        """从文件加载 Memory"""
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self.memory.buffer = json.load(f)
        except FileNotFoundError:
            pass
    
    def _save_memory(self):
        """保存 Memory 到文件"""
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(self.memory.buffer, f, ensure_ascii=False, indent=2)
    
    def chat(self, user_input):
        """对话"""
        response = self.conversation.predict(input=user_input)
        self._save_memory()  # 每次对话后保存
        return response

# 使用
session = PersistentConversation("user_123")

while True:
    user_input = input("你：")
    if user_input.lower() == "exit":
        break
    
    response = session.chat(user_input)
    print(f"AI：{response}\n")
```

</details>

---

## 下一章预告

下一章我们会学习 **Tool 工具集成**——也就是如何让大模型调用外部工具（如搜索引擎、计算器、数据库等）。你会学到如何定义工具、如何集成工具、如何让模型自主决策使用哪些工具。
