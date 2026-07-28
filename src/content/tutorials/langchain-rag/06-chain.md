---
title: "第06章：Chain 链式调用详解"
description: "掌握 Chain 链式调用，学习 SimpleChain、SequentialChain、自定义 Chain 等高级用法"
---

# 第06章：Chain 链式调用详解

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Chain？为什么要用 Chain？
- 如何把多个组件串联起来？
- 如何实现复杂的工作流？
- 如何自定义 Chain？

这一章就是为了解答这些问题。我们会深入学习 Chain 的核心概念和使用方法，让你能够构建复杂的工作流。

---

## 1 为什么需要 Chain？

### 痛点分析

在实际应用中，我们经常需要把多个步骤串联起来：

```python
# ❌ 手动串联多个步骤
# 步骤 1：生成摘要
summary = llm.invoke([HumanMessage(content=f"请总结：{text}")])

# 步骤 2：翻译摘要
translation = llm.invoke([HumanMessage(content=f"请翻译成英文：{summary.content}")])

# 步骤 3：生成关键词
keywords = llm.invoke([HumanMessage(content=f"请提取关键词：{translation.content}")])

# 问题：代码很乱，难以维护和复用
```

### 解决方案

**Chain** 可以把多个组件串联起来，形成完整的工作流。

打个比方：

> **Chain 就像工厂流水线**：
> - 原材料（输入）→ 加工步骤 1 → 加工步骤 2 → 加工步骤 3 → 成品（输出）
> - 每个步骤都是一个组件
> - 上一个步骤的输出是下一个步骤的输入

---

## 2 基础 Chain

### 2.1 使用管道符创建 Chain

LangChain 使用 `|` 管道符串联组件。

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

# 创建组件
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的翻译助手"),
    ("human", "请将以下内容翻译成 {language}：{text}")
])
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
output_parser = StrOutputParser()

# 创建 Chain
# 使用 | 操作符串联组件
chain = prompt | llm | output_parser

# 调用 Chain
result = chain.invoke({
    "language": "英文",
    "text": "你好，世界"
})
print(result)  # "Hello, world"
```

**代码解释**：

1. **创建组件**：分别创建 Prompt、LLM、Output Parser
2. **串联组件**：使用 `|` 操作符把组件串联起来
3. **调用 Chain**：使用 `invoke()` 方法调用，传入变量
4. **数据流**：输入 → Prompt 格式化 → LLM 生成 → Output Parser 解析 → 输出

> **原理**：Chain 的工作流程是：Prompt 格式化 → LLM 生成 → Output Parser 解析。每个组件的输出是下一个组件的输入。

### 2.2 Chain 的数据流

```python
# 数据流示意
输入: {"language": "英文", "text": "你好"}
  ↓
Prompt: 格式化成消息列表
  ↓
LLM: 生成翻译结果
  ↓
Output Parser: 解析成字符串
  ↓
输出: "Hello"
```

---

## 3 多步骤 Chain

### 3.1 串联多个 LLM

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 步骤 1：生成摘要
summary_prompt = ChatPromptTemplate.from_messages([
    ("human", "请用一句话总结：{text}")
])
summary_chain = summary_prompt | llm | StrOutputParser()

# 步骤 2：翻译摘要
translation_prompt = ChatPromptTemplate.from_messages([
    ("human", "请翻译成英文：{summary}")
])
translation_chain = translation_prompt | llm | StrOutputParser()

# 步骤 3：生成关键词
keyword_prompt = ChatPromptTemplate.from_messages([
    ("human", "请提取 3 个关键词：{translation}")
])
keyword_chain = keyword_prompt | llm | StrOutputParser()

# 组合成完整的 Chain
# 使用 RunnablePassthrough 传递中间结果
from langchain_core.runnables import RunnablePassthrough

full_chain = (
    {"summary": summary_chain, "original": RunnablePassthrough()}
    | {"translation": translation_chain, "original": RunnablePassthrough()}
    | {"keywords": keyword_chain, "translation": RunnablePassthrough()}
)

# 调用
result = full_chain.invoke({
    "text": "Python 是一种解释型、高级、通用的编程语言。它以简洁的语法和强大的功能而闻名。"
})
print(result)
```

**代码解释**：

1. **创建子 Chain**：分别创建摘要、翻译、关键词的 Chain
2. **使用 RunnablePassthrough**：传递中间结果
3. **组合 Chain**：把多个子 Chain 串联起来
4. **调用**：一次性完成所有步骤

> **原理**：每个子 Chain 处理一个步骤，通过字典传递中间结果。

### 3.2 使用 RunnableLambda 自定义步骤

```python
from langchain_core.runnables import RunnableLambda

# 自定义处理函数
def format_output(result):
    """格式化输出"""
    return f"""
    原文：{result['original']}
    摘要：{result['summary']}
    翻译：{result['translation']}
    关键词：{result['keywords']}
    """

# 创建自定义 Chain
format_chain = RunnableLambda(format_output)

# 组合
full_chain = (
    {"summary": summary_chain, "original": RunnablePassthrough()}
    | {"translation": translation_chain, "original": RunnablePassthrough()}
    | {"keywords": keyword_chain, "translation": RunnablePassthrough()}
    | format_chain
)

# 调用
result = full_chain.invoke({"text": "Python 是一种编程语言..."})
print(result)
```

---

## 4 并行执行

### 4.1 使用 RunnableParallel 并行执行

```python
from langchain_core.runnables import RunnableParallel

# 创建多个 Chain
summary_chain = summary_prompt | llm | StrOutputParser()
keyword_chain = keyword_prompt | llm | StrOutputParser()
question_chain = ChatPromptTemplate.from_messages([
    ("human", "请根据内容生成 3 个问题：{text}")
]) | llm | StrOutputParser()

# 并行执行
parallel_chain = RunnableParallel(
    summary=summary_chain,
    keywords=keyword_chain,
    questions=question_chain
)

# 调用
result = parallel_chain.invoke({"text": "Python 是一种编程语言..."})
print(result)
# {
#   "summary": "Python 是一种简洁强大的编程语言",
#   "keywords": "Python, 编程语言, 简洁",
#   "questions": "1. Python 有什么特点？..."
# }
```

**代码解释**：

1. **创建多个 Chain**：分别创建摘要、关键词、问题的 Chain
2. **并行执行**：使用 `RunnableParallel` 同时执行多个 Chain
3. **获取结果**：返回字典，包含所有 Chain 的结果

> **原理**：RunnableParallel 会同时执行多个 Chain，提高性能。

---

## 5 条件分支

### 5.1 使用 RunnableBranch 实现条件分支

```python
from langchain_core.runnables import RunnableBranch

# 定义条件
def should_translate(result):
    """判断是否需要翻译"""
    return "翻译" in result.get("action", "")

# 创建分支 Chain
branch_chain = RunnableBranch(
    (should_translate, translation_chain),
    summary_chain  # 默认分支
)

# 调用
result1 = branch_chain.invoke({
    "text": "Python 是一种编程语言...",
    "action": "总结"
})
print(result1)  # 执行 summary_chain

result2 = branch_chain.invoke({
    "text": "Python 是一种编程语言...",
    "action": "翻译成英文"
})
print(result2)  # 执行 translation_chain
```

**代码解释**：

1. **定义条件函数**：根据输入判断执行哪个分支
2. **创建分支 Chain**：使用 `RunnableBranch` 定义条件分支
3. **执行**：根据条件自动选择执行路径

> **原理**：RunnableBranch 会根据条件函数的返回值选择不同的执行路径。

---

## 6 错误处理

### 6.1 使用 RunnableWithFallback 处理错误

```python
from langchain_core.runnables import RunnableWithFallback

# 创建主 Chain
main_chain = prompt | llm | StrOutputParser()

# 创建备用 Chain（使用更简单的 Prompt）
fallback_chain = ChatPromptTemplate.from_messages([
    ("human", "请简单回答：{text}")
]) | llm | StrOutputParser()

# 创建带备用的 Chain
chain_with_fallback = RunnableWithFallback(
    runnable=main_chain,
    fallback=fallback_chain
)

# 调用
result = chain_with_fallback.invoke({"text": "什么是 Python？"})
print(result)
```

**代码解释**：

1. **创建主 Chain**：主要的处理逻辑
2. **创建备用 Chain**：当主 Chain 失败时执行
3. **组合**：使用 `RunnableWithFallback` 组合
4. **执行**：如果主 Chain 失败，自动执行备用 Chain

> **原理**：RunnableWithFallback 会在主 Chain 抛出异常时，自动执行备用 Chain。

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Chain** | 链式调用，把多个组件串联起来 |
| **管道符** | 使用 `|` 操作符串联组件 |
| **RunnablePassthrough** | 传递中间结果 |
| **RunnableLambda** | 自定义处理函数 |
| **RunnableParallel** | 并行执行多个 Chain |
| **RunnableBranch** | 条件分支 |
| **RunnableWithFallback** | 错误处理，备用 Chain |

---

## 8 新手常见误区

### 误区 1："不使用 Chain，手动串联"

**错！** 手动串联代码很乱，难以维护和复用。

正确做法：使用 Chain 把多个组件串联起来。

### 误区 2："所有步骤都串行执行"

**错！** 有些步骤可以并行执行，提高性能。

正确做法：使用 RunnableParallel 并行执行独立的步骤。

### 误区 3："不处理错误"

**错！** 模型调用可能失败，导致整个 Chain 崩溃。

正确做法：使用 RunnableWithFallback 处理错误。

### 误区 4："Chain 太长，难以调试"

**错！** 太长的 Chain 难以调试和维护。

正确做法：把长 Chain 拆分成多个子 Chain，分别测试。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：创建一个 Chain，实现文本摘要功能。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

prompt = ChatPromptTemplate.from_messages([
    ("human", "请用一句话总结以下内容：{text}")
])

chain = prompt | llm | StrOutputParser()

result = chain.invoke({
    "text": "Python 是一种解释型、高级、通用的编程语言。它以简洁的语法和强大的功能而闻名。"
})
print(result)
```

</details>

### 练习 2：进阶练习

**题目**：创建一个多步骤 Chain，实现摘要、翻译、关键词提取。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 步骤 1：摘要
summary_chain = ChatPromptTemplate.from_messages([
    ("human", "请用一句话总结：{text}")
]) | llm | StrOutputParser()

# 步骤 2：翻译
translation_chain = ChatPromptTemplate.from_messages([
    ("human", "请翻译成英文：{summary}")
]) | llm | StrOutputParser()

# 步骤 3：关键词
keyword_chain = ChatPromptTemplate.from_messages([
    ("human", "请提取 3 个关键词：{translation}")
]) | llm | StrOutputParser()

# 组合
full_chain = (
    {"summary": summary_chain, "original": RunnablePassthrough()}
    | {"translation": translation_chain, "original": RunnablePassthrough()}
    | {"keywords": keyword_chain, "translation": RunnablePassthrough()}
)

result = full_chain.invoke({
    "text": "Python 是一种编程语言..."
})
print(result)
```

</details>

### 练习 3（挑战）：综合练习

**题目**：创建一个并行 Chain，同时生成摘要、关键词、问题。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 摘要 Chain
summary_chain = ChatPromptTemplate.from_messages([
    ("human", "请用一句话总结：{text}")
]) | llm | StrOutputParser()

# 关键词 Chain
keyword_chain = ChatPromptTemplate.from_messages([
    ("human", "请提取 3 个关键词：{text}")
]) | llm | StrOutputParser()

# 问题 Chain
question_chain = ChatPromptTemplate.from_messages([
    ("human", "请根据内容生成 3 个问题：{text}")
]) | llm | StrOutputParser()

# 并行执行
parallel_chain = RunnableParallel(
    summary=summary_chain,
    keywords=keyword_chain,
    questions=question_chain
)

result = parallel_chain.invoke({
    "text": "Python 是一种编程语言..."
})
print(result)
```

</details>

---

## 下一章预告

下一章我们会学习 **Memory 记忆系统**——也就是如何让大模型记住对话历史。你会学到 BufferMemory、SummaryMemory、持久化存储等高级用法。
