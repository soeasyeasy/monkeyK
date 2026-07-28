---
title: "第04章：Prompt Engineering 进阶"
description: "掌握 Prompt 模板高级用法，学习 Few-shot 学习、Prompt 组合与优化技巧"
---

# 第04章：Prompt Engineering 进阶

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何设计更好的 Prompt，让模型输出更准确？
- 什么是 Few-shot 学习？如何使用？
- 如何组合多个 Prompt，形成复杂的工作流？
- 有哪些 Prompt 优化技巧？

这一章就是为了解答这些问题。我们会深入学习 Prompt Engineering 的高级技巧，让你能够设计出更强大的 Prompt。

---

## 1 为什么需要 Prompt Engineering？

### 痛点分析

很多新手在使用大模型时，会遇到这些问题：

**问题 1：输出格式不稳定**

```python
# ❌ 直接问，输出格式不固定
response = chat.invoke([HumanMessage(content="列出 3 个 Python 的优点")])
# 有时用 1. 2. 3.，有时用 - ，有时用 *
```

**问题 2：输出内容不准确**

```python
# ❌ 模糊的问题，得到模糊的答案
response = chat.invoke([HumanMessage(content="Python 怎么用？")])
# 回答太宽泛，不知道从何说起
```

**问题 3：无法控制输出风格**

```python
# ❌ 无法控制输出的语气和风格
response = chat.invoke([HumanMessage(content="解释什么是 AI")])
# 有时太专业，有时太简单
```

### 解决方案

**Prompt Engineering** 就是通过精心设计提示词，让模型输出更准确、更符合需求的结果。

打个比方：

> **Prompt Engineering 就像点菜**：
> - 模糊的 Prompt = "来个好吃的" → 不知道上什么菜
> - 精确的 Prompt = "来个宫保鸡丁，微辣，不要花生" → 精确得到想要的菜

---

## 2 Prompt Template 高级用法

### 2.1 基础 Prompt Template

```python
from langchain_core.prompts import ChatPromptTemplate

# 创建模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的 {role}"),
    ("human", "请解释 {concept}")
])

# 格式化
messages = prompt.format_messages(
    role="Python 讲师",
    concept="列表推导式"
)
print(messages)
```

**代码解释**：

1. **定义变量**：使用 `{role}` 和 `{concept}` 定义变量
2. **格式化**：使用 `format_messages()` 替换变量
3. **生成消息**：返回消息列表，可以直接传给模型

### 2.2 带默认值的 Prompt

```python
from langchain_core.prompts import ChatPromptTemplate

# 创建带默认值的模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的 {role:讲师}"),  # 默认值是"讲师"
    ("human", "请用 {level:通俗} 的语言解释 {concept}")
])

# 使用默认值
messages1 = prompt.format_messages(concept="AI")
print(messages1)

# 覆盖默认值
messages2 = prompt.format_messages(
    role="Python 专家",
    level="专业",
    concept="装饰器"
)
print(messages2)
```

### 2.3 多行 Prompt

```python
from langchain_core.prompts import ChatPromptTemplate

# 多行 system prompt
system_template = """你是一个专业的技术讲师。

请遵循以下规则：
1. 用通俗易懂的语言解释
2. 提供代码示例
3. 指出常见误区
4. 给出学习建议

请解释 {concept}。"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_template),
    ("human", "{question}")
])

messages = prompt.format_messages(
    concept="Python 装饰器",
    question="什么是装饰器？"
)
```

---

## 3 Few-shot 学习

### 3.1 什么是 Few-shot 学习？

Few-shot 学习就是在 Prompt 中提供几个示例，让模型学习示例的模式，然后应用到新的输入。

打个比方：

> **Few-shot 学习就像教小孩认字**：
> - 你给他看几个例子："苹果→水果，白菜→蔬菜"
> - 然后问他："猪肉→？"
> - 他会根据示例模式回答："肉类"

### 3.2 Few-shot Prompt Template

```python
from langchain_core.prompts import FewShotChatMessagePromptTemplate

# 定义示例
examples = [
    {"input": "苹果", "output": "水果"},
    {"input": "白菜", "output": "蔬菜"},
    {"input": "猪肉", "output": "肉类"},
    {"input": "牛奶", "output": "乳制品"}
]

# 创建示例模板
example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}")
])

# 创建 Few-shot 模板
few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples
)

# 组合成完整的 Prompt
final_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个分类助手，请将物品分类。"),
    few_shot_prompt,
    ("human", "{input}")
])

# 使用
messages = final_prompt.format_messages(input="鸡蛋")
response = chat.invoke(messages)
print(response.content)  # "乳制品"
```

**代码解释**：

1. **定义示例**：创建输入-输出对
2. **创建示例模板**：定义示例的格式
3. **创建 Few-shot 模板**：把示例组合起来
4. **组合 Prompt**：把 Few-shot 模板和系统提示组合起来

> **原理**：模型会根据示例学习模式，然后应用到新的输入。

### 3.3 动态选择示例

```python
from langchain_core.prompts import load_prompt
from langchain_core.example_selectors import SemanticSimilarityExampleSelector
from langchain_community.vectorstores import FAISS

# 定义大量示例
examples = [
    {"input": "苹果", "output": "水果"},
    {"input": "白菜", "output": "蔬菜"},
    {"input": "猪肉", "output": "肉类"},
    {"input": "牛奶", "output": "乳制品"},
    {"input": "鸡蛋", "output": "乳制品"},
    {"input": "鱼", "output": "肉类"},
    # ... 更多示例
]

# 创建示例选择器（基于语义相似度）
example_selector = SemanticSimilarityExampleSelector.from_examples(
    examples,  # 示例列表
    OpenAIEmbeddings(),  # 嵌入模型
    FAISS,  # 向量数据库
    k=2  # 选择最相似的 2 个示例
)

# 创建 Few-shot 模板
few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    example_selector=example_selector,
    input_variables=["input"]
)

# 使用
messages = few_shot_prompt.format_messages(input="香蕉")
# 会自动选择最相似的示例（如"苹果→水果"）
```

> **原理**：根据输入的语义相似度，动态选择最相关的示例，提高准确性。

---

## 4 Prompt 组合与优化

### 4.1 使用管道符组合 Prompt

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

# 创建多个 Prompt
context_prompt = ChatPromptTemplate.from_messages([
    ("system", "请总结以下文本：\n{text}")
])

qa_prompt = ChatPromptTemplate.from_messages([
    ("system", "基于以下上下文回答问题：\n{context}"),
    ("human", "{question}")
])

# 组合 Prompt
# 先总结文本，再把总结作为上下文回答问题
chain = (
    {"context": context_prompt | llm, "question": RunnablePassthrough()}
    | qa_prompt
    | llm
)

# 使用
result = chain.invoke({
    "text": "Python 是一种解释型、高级、通用的编程语言...",
    "question": "Python 有什么特点？"
})
```

### 4.2 使用 Prompt 模板库

```python
from langchain_core.prompts import PromptTemplate

# 从字符串加载
template = PromptTemplate.from_template("请解释 {concept}")

# 从文件加载
template = PromptTemplate.from_file("prompt_template.txt")

# 保存模板
template.save("prompt_template.json")
```

---

## 5 Prompt 优化技巧

### 5.1 明确角色

```python
# ❌ 模糊的角色
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个助手"),
    ("human", "{question}")
])

# ✅ 明确的角色
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个有 10 年经验的 Python 高级工程师，擅长代码优化和最佳实践"),
    ("human", "{question}")
])
```

### 5.2 明确任务

```python
# ❌ 模糊的任务
prompt = ChatPromptTemplate.from_messages([
    ("human", "关于 Python，你知道什么？")
])

# ✅ 明确的任务
prompt = ChatPromptTemplate.from_messages([
    ("human", "请列出 Python 的 5 个主要优点，每个优点用一句话说明")
])
```

### 5.3 提供上下文

```python
# ❌ 没有上下文
prompt = ChatPromptTemplate.from_messages([
    ("human", "如何优化这段代码？")
])

# ✅ 提供上下文
prompt = ChatPromptTemplate.from_messages([
    ("human", """
    以下是一段 Python 代码，用于处理大量数据：
    
    ```python
    def process_data(data):
        result = []
        for item in data:
            result.append(item * 2)
        return result
    ```
    
    请优化这段代码，提高性能。
    """)
])
```

### 5.4 指定输出格式

```python
# ❌ 不指定格式
prompt = ChatPromptTemplate.from_messages([
    ("human", "比较 Python 和 Java")
])

# ✅ 指定格式
prompt = ChatPromptTemplate.from_messages([
    ("human", """
    请比较 Python 和 Java，按以下格式输出：
    
    ## 语法
    ...
    
    ## 性能
    ...
    
    ## 应用场景
    ...
    
    ## 总结
    ...
    """)
])
```

### 5.5 使用分隔符

```python
# ❌ 不清晰的分隔
prompt = ChatPromptTemplate.from_messages([
    ("human", "文本：Python 是一种编程语言 问题：它有什么特点？")
])

# ✅ 使用分隔符
prompt = ChatPromptTemplate.from_messages([
    ("human", """
    文本：
    <text>
    Python 是一种解释型、高级、通用的编程语言。
    </text>
    
    问题：
    <question>
    它有什么特点？
    </question>
    """)
])
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Prompt Template** | 提示词模板，可以复用 Prompt 结构 |
| **Few-shot 学习** | 提供示例，让模型学习模式 |
| **动态示例选择** | 根据语义相似度选择最相关的示例 |
| **Prompt 组合** | 使用管道符组合多个 Prompt |
| **优化技巧** | 明确角色、任务、上下文、输出格式 |

---

## 7 新手常见误区

### 误区 1："Prompt 越短越好"

**错！** 模糊的 Prompt 会导致模型输出不准确。

正确做法：提供足够的上下文和明确的任务。

### 误区 2："不需要提供示例"

**错！** 没有示例，模型可能无法理解你想要的格式和风格。

正确做法：使用 Few-shot 学习，提供几个示例。

### 误区 3："不指定输出格式"

**错！** 不指定格式，输出会不稳定。

正确做法：明确指定输出格式（如 JSON、Markdown 等）。

### 误区 4："一个 Prompt 解决所有问题"

**错！** 复杂的任务需要拆分成多个步骤。

正确做法：使用 Chain 把复杂任务拆分成多个简单的 Prompt。

---

## 8 动手练习

### 练习 1：基础练习

**题目**：创建一个 Prompt Template，用于解释技术概念。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的技术讲师，请用通俗易懂的语言解释技术概念。"),
    ("human", "请解释 {concept}，包括：\n1. 定义\n2. 用途\n3. 示例")
])

messages = prompt.format_messages(concept="Python 装饰器")
response = chat.invoke(messages)
print(response.content)
```

</details>

### 练习 2：进阶练习

**题目**：使用 Few-shot 学习创建一个分类器。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.prompts import FewShotChatMessagePromptTemplate, ChatPromptTemplate

examples = [
    {"input": "iPhone 15", "output": "电子产品"},
    {"input": "Nike 运动鞋", "output": "服装鞋包"},
    {"input": "《三体》", "output": "图书"},
]

example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}")
])

few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples
)

final_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个商品分类助手"),
    few_shot_prompt,
    ("human", "{input}")
])

messages = final_prompt.format_messages(input="MacBook Pro")
response = chat.invoke(messages)
print(response.content)  # "电子产品"
```

</details>

### 练习 3（挑战）：综合练习

**题目**：创建一个 Prompt 优化器，自动优化用户的 Prompt。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.prompts import ChatPromptTemplate

optimizer_prompt = ChatPromptTemplate.from_messages([
    ("system", """你是一个 Prompt 优化专家。请优化用户提供的 Prompt，使其更清晰、更具体。
    
    优化原则：
    1. 明确角色和任务
    2. 提供足够的上下文
    3. 指定输出格式
    4. 使用分隔符清晰划分
    
    请输出优化后的 Prompt。"""),
    ("human", "原始 Prompt：{original_prompt}\n\n优化后的 Prompt：")
])

# 使用
original = "帮我写个代码"
messages = optimizer_prompt.format_messages(original_prompt=original)
response = chat.invoke(messages)
print(f"原始：{original}")
print(f"优化后：{response.content}")
```

</details>

---

## 下一章预告

下一章我们会学习 **Output Parser 输出解析**——也就是如何把模型的输出解析成结构化数据（如 JSON、Python 对象）。你会学到如何定义输出格式、如何解析复杂数据结构。
