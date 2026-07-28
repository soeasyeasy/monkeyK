---
title: "第01章：LangChain 与 RAG 概述"
description: "了解 LangChain 框架和 RAG 技术的核心概念、应用场景与价值"
---

# 第01章：LangChain 与 RAG 概述

## 本章导读

在学这一章之前，你可能会有这些疑问：

- LangChain 到底是什么？它能帮我解决什么问题？
- RAG 是什么？为什么现在这么火？
- 我已经有 GPT 了，为什么还需要 LangChain 和 RAG？
- 学完这个教程，我能做出什么样的应用？

这一章就是为了解答这些问题。我们会先搞清楚 **LangChain 和 RAG 的核心概念**，了解它们能做什么，再动手实践。

---

## 1 为什么需要 LangChain 和 RAG？

### 痛点分析

想象一下，你想用大语言模型（如 GPT）开发一个智能问答系统，会遇到什么问题：

**问题 1：大模型不知道你的私有数据**

```python
# ❌ 直接问 GPT 关于你公司的问题
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "我们公司的退款政策是什么？"}]
)
# 结果：GPT 不知道你们公司的政策，只能瞎编
```

**问题 2：手动拼接 Prompt 很麻烦**

```python
# ❌ 手动拼接上下文和提示词
context = "退款政策：7天内可无理由退款..."
question = "退款政策是什么？"
prompt = f"根据以下信息回答问题：\n上下文：{context}\n问题：{question}\n答案："
# 每次都要手动拼接，代码很乱
```

**问题 3：无法记住对话历史**

```python
# ❌ 每次对话都是独立的
response1 = client.chat.completions.create(
    messages=[{"role": "user", "content": "我叫小明"}]
)
response2 = client.chat.completions.create(
    messages=[{"role": "user", "content": "我叫什么名字？"}]
)
# 结果：GPT 不记得你叫小明
```

**问题 4：无法调用外部工具**

```python
# ❌ 想让 GPT 查天气、查数据库，做不到
response = client.chat.completions.create(
    messages=[{"role": "user", "content": "今天北京天气怎么样？"}]
)
# 结果：GPT 无法实时获取天气信息
```

### 解决方案

**LangChain** 和 **RAG** 就是为了解决这些问题而生的：

- **LangChain**：一个大模型应用开发框架，帮你快速搭建 AI 应用
- **RAG**：检索增强生成，让大模型能够基于你的私有数据回答问题

打个比方：

> **LangChain 就像一个 AI 应用的"瑞士军刀"**，把大模型、数据、工具、记忆等功能都整合在一起，让你不用重复造轮子。
>
> **RAG 就像给大模型配了一个"私人图书馆"**，让它能够查阅你的资料，而不是只靠训练时学到的知识。

### 使用 LangChain + RAG 后

```python
# ✅ 使用 LangChain + RAG，几行代码搞定
from langchain.chains import RetrievalQA
from langchain.vectorstores import FAISS

# 1. 加载你的文档
docs = load_documents("company_policy.pdf")

# 2. 创建向量数据库
vectorstore = FAISS.from_documents(docs, embeddings)

# 3. 创建问答链
qa = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(),
    retriever=vectorstore.as_retriever()
)

# 4. 提问，自动检索相关文档并回答
answer = qa.run("我们公司的退款政策是什么？")
# 结果：基于你的文档准确回答
```

> **一句话总结**：LangChain 让你快速搭建 AI 应用，RAG 让大模型能够基于你的私有数据回答问题。

---

## 2 LangChain 核心概念

### 什么是 LangChain？

LangChain 是一个用于开发大语言模型应用的框架，它提供了：

1. **标准化的大模型接口**：统一调用 OpenAI、Anthropic、本地模型等
2. **组件化工具**：Prompt 模板、输出解析器、向量数据库等
3. **链式调用**：把多个组件串联起来，形成完整的工作流
4. **记忆系统**：让大模型记住对话历史
5. **Agent 智能体**：让大模型自主决策、调用工具

### LangChain 的核心组件

| 组件 | 作用 | 生活化类比 |
| --- | --- | --- |
| **LLM/ChatModel** | 大语言模型 | 大脑，负责思考和生成 |
| **Prompt Template** | 提示词模板 | 问题模板，标准化提问方式 |
| **Output Parser** | 输出解析器 | 翻译官，把模型输出转成结构化数据 |
| **Chain** | 链式调用 | 流水线，把多个步骤串起来 |
| **Memory** | 记忆系统 | 笔记本，记录对话历史 |
| **Tool** | 工具 | 工具箱，提供外部能力（搜索、计算等） |
| **Agent** | 智能体 | 助手，自主决策使用哪些工具 |
| **Retriever** | 检索器 | 图书管理员，从文档中找相关信息 |
| **VectorStore** | 向量数据库 | 知识库，存储和检索文档 |

### LangChain 的应用场景

1. **知识库问答系统**：基于公司文档、产品手册等回答问题
2. **智能客服**：自动回答用户问题，提升客服效率
3. **文档摘要**：自动总结长文档的核心内容
4. **代码助手**：理解代码库，回答技术问题
5. **数据分析**：基于数据回答问题，生成报表
6. **聊天机器人**：具有记忆和工具调用能力的对话系统

---

## 3 RAG 核心概念

### 什么是 RAG？

RAG（Retrieval-Augmented Generation，检索增强生成）是一种技术，让大模型能够基于外部知识库回答问题。

**RAG 的工作流程**：

```
用户提问 → 检索相关文档 → 将文档和问题一起发给大模型 → 生成答案
```

打个比方：

> **RAG 就像开卷考试**：
> - 普通大模型 = 闭卷考试，只能靠记忆回答
> - RAG = 开卷考试，可以翻书找答案
>
> 显然，开卷考试更准确，也不容易瞎编。

### RAG 的核心步骤

1. **文档加载**：加载 PDF、Word、网页等文档
2. **文档分割**：把长文档切成小段（Chunk）
3. **向量化**：把文本转成向量（Embedding）
4. **存储**：把向量存到向量数据库
5. **检索**：根据问题检索相关文档
6. **生成**：把检索到的文档和问题一起发给大模型，生成答案

### RAG 的优势

| 优势 | 说明 |
| --- | --- |
| **知识更新方便** | 只需更新文档，不需要重新训练模型 |
| **减少幻觉** | 基于真实文档回答，减少瞎编 |
| **可追溯** | 可以追溯答案来源，知道答案从哪来 |
| **成本低** | 不需要微调模型，只需要调用 API |
| **数据安全** | 私有数据不需要上传到模型训练 |

### RAG vs Fine-tuning（微调）

| 对比项 | RAG | Fine-tuning |
| --- | --- | --- |
| **知识更新** | 实时更新，只需更新文档 | 需要重新训练，成本高 |
| **成本** | 低，只需调用 API | 高，需要 GPU 训练 |
| **可解释性** | 好，可以追溯答案来源 | 差，黑盒模型 |
| **数据安全** | 好，数据不需要上传 | 差，数据需要上传训练 |
| **适用场景** | 知识问答、文档检索 | 特定任务优化（如分类、生成） |

---

## 4 LangChain + RAG 实战示例

### 示例：构建一个简单的知识库问答系统

```python
# 导入必要的库
from langchain.document_loaders import PyPDFLoader  # PDF 加载器
from langchain.text_splitter import RecursiveCharacterTextSplitter  # 文本分割器
from langchain.embeddings import OpenAIEmbeddings  # OpenAI 嵌入模型
from langchain.vectorstores import FAISS  # FAISS 向量数据库
from langchain.chat_models import ChatOpenAI  # ChatGPT 模型
from langchain.chains import RetrievalQA  # 检索问答链

# 1. 加载 PDF 文档
loader = PyPDFLoader("company_policy.pdf")  # 加载公司政策文档
documents = loader.load()  # 返回文档列表

# 2. 分割文档
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,  # 每个块最大 1000 字符
    chunk_overlap=200  # 块之间重叠 200 字符，保持上下文
)
texts = text_splitter.split_documents(documents)  # 分割文档

# 3. 创建向量数据库
embeddings = OpenAIEmbeddings()  # 使用 OpenAI 的嵌入模型
vectorstore = FAISS.from_documents(texts, embeddings)  # 创建向量数据库

# 4. 创建问答链
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)  # 初始化 ChatGPT
qa = RetrievalQA.from_chain_type(
    llm=llm,  # 使用的大模型
    chain_type="stuff",  # 链类型：stuff 表示直接把文档塞进 prompt
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})  # 检索器，返回最相关的 3 个文档
)

# 5. 提问
question = "我们公司的退款政策是什么？"
answer = qa.run(question)  # 自动检索相关文档并回答
print(f"问题：{question}")
print(f"答案：{answer}")
```

**代码解释**：

1. **加载文档**：使用 `PyPDFLoader` 加载 PDF 文档
2. **分割文档**：使用 `RecursiveCharacterTextSplitter` 把长文档切成小段
3. **创建向量数据库**：使用 `OpenAIEmbeddings` 把文本转成向量，存到 `FAISS` 向量数据库
4. **创建问答链**：使用 `RetrievalQA` 创建检索问答链
5. **提问**：调用 `qa.run()` 提问，自动检索相关文档并生成答案

> **原理**：当你提问时，RAG 会先把问题转成向量，然后在向量数据库中检索最相似的文档，最后把检索到的文档和问题一起发给大模型，生成答案。

---

## 5 本教程学习路线

本教程分为三个部分：

### 基础篇（第 1-5 章）

- **第 1 章**：LangChain 与 RAG 概述（本章）
- **第 2 章**：环境搭建与第一个 LangChain 程序
- **第 3 章**：LLM 与 Chat Model 核心概念
- **第 4 章**：Prompt Engineering 进阶
- **第 5 章**：Output Parser 输出解析

**学习目标**：掌握 LangChain 基础组件，能够独立调用大模型、设计 Prompt、解析输出。

### 进阶篇（第 6-12 章）

- **第 6 章**：Chain 链式调用详解
- **第 7 章**：Memory 记忆系统
- **第 8 章**：Tool 工具集成
- **第 9 章**：Agent 智能体开发
- **第 10 章**：RAG 核心原理
- **第 11 章**：文档加载与分割
- **第 12 章**：Embedding 与向量数据库

**学习目标**：掌握 LangChain 高级功能，能够构建具有记忆、工具调用、智能决策的 AI 应用，深入理解 RAG 原理。

### 实战篇（第 13-16 章）

- **第 13 章**：检索增强生成实战
- **第 14 章**：RAG 高级优化
- **第 15 章**：企业级知识库问答系统
- **第 16 章**：LangChain 生产环境部署

**学习目标**：构建完整的企业级知识库问答系统，掌握 RAG 优化技巧和生产环境部署方案。

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **LangChain** | 大模型应用开发框架，提供标准化接口和组件化工具 |
| **RAG** | 检索增强生成，让大模型基于外部知识库回答问题 |
| **LangChain 核心组件** | LLM、Prompt、Output Parser、Chain、Memory、Tool、Agent、Retriever、VectorStore |
| **RAG 工作流程** | 文档加载 → 分割 → 向量化 → 存储 → 检索 → 生成 |
| **RAG 优势** | 知识更新方便、减少幻觉、可追溯、成本低、数据安全 |
| **RAG vs Fine-tuning** | RAG 适合知识问答，Fine-tuning 适合特定任务优化 |

---

## 7 新手常见误区

### 误区 1："有了 GPT，不需要 LangChain 和 RAG"

**错！** GPT 虽然强大，但有以下局限：

- **不知道你的私有数据**：GPT 只知道训练时学到的知识
- **会产生幻觉**：不知道答案时会瞎编
- **无法调用工具**：不能查天气、查数据库、调用 API
- **没有记忆**：每次对话都是独立的

LangChain 和 RAG 可以弥补这些不足，让你构建更强大的 AI 应用。

### 误区 2："RAG 就是 Fine-tuning"

不是的。RAG 和 Fine-tuning 是两种不同的技术：

- **RAG**：不改模型，通过检索外部知识增强模型
- **Fine-tuning**：改模型，通过训练数据微调模型参数

RAG 适合知识问答，Fine-tuning 适合特定任务优化。

### 误区 3："LangChain 只能用于 RAG"

不是的。LangChain 是一个通用框架，除了 RAG，还可以用于：

- 构建聊天机器人
- 开发 Agent 智能体
- 创建文档摘要系统
- 构建代码助手
- 等等

### 误区 4："RAG 不需要优化"

**错！** RAG 虽然好用，但也需要优化：

- **文档分割策略**：切得太大会影响检索精度，切得太小会丢失上下文
- **检索策略**：需要优化检索算法，提高检索准确率
- **Prompt 设计**：需要精心设计 Prompt，让模型更好地理解上下文
- **向量数据库选型**：需要根据数据量和性能需求选择合适的向量数据库

---

## 8 动手练习

### 练习 1：基础练习

**题目**：列出 3 个 LangChain 的核心组件，并说明它们的作用。

<details>
<summary>点击查看答案</summary>

**答案**：

1. **LLM/ChatModel**：大语言模型，负责思考和生成文本
2. **Prompt Template**：提示词模板，标准化提问方式，让模型更好地理解问题
3. **Chain**：链式调用，把多个组件串联起来，形成完整的工作流

其他组件还包括：Output Parser（输出解析器）、Memory（记忆系统）、Tool（工具）、Agent（智能体）、Retriever（检索器）、VectorStore（向量数据库）等。

</details>

### 练习 2：进阶练习

**题目**：描述 RAG 的工作流程，并解释每个步骤的作用。

<details>
<summary>点击查看答案</summary>

**答案**：

RAG 的工作流程分为 6 个步骤：

1. **文档加载**：加载 PDF、Word、网页等文档，获取原始数据
2. **文档分割**：把长文档切成小段（Chunk），便于检索和处理
3. **向量化**：使用 Embedding 模型把文本转成向量，捕捉语义信息
4. **存储**：把向量存到向量数据库（如 FAISS、Chroma），便于快速检索
5. **检索**：根据用户问题，在向量数据库中检索最相关的文档
6. **生成**：把检索到的文档和问题一起发给大模型，生成最终答案

每个步骤都很重要，缺一不可。

</details>

### 练习 3（挑战）：综合练习

**题目**：对比 RAG 和 Fine-tuning 的优缺点，并说明在什么场景下应该使用 RAG。

<details>
<summary>点击查看答案</summary>

**答案**：

| 对比项 | RAG | Fine-tuning |
| --- | --- | --- |
| **知识更新** | 实时更新，只需更新文档 | 需要重新训练，成本高 |
| **成本** | 低，只需调用 API | 高，需要 GPU 训练 |
| **可解释性** | 好，可以追溯答案来源 | 差，黑盒模型 |
| **数据安全** | 好，数据不需要上传 | 差，数据需要上传训练 |
| **适用场景** | 知识问答、文档检索 | 特定任务优化（如分类、生成） |

**应该使用 RAG 的场景**：

1. **知识库问答**：需要基于公司文档、产品手册等回答问题
2. **智能客服**：需要快速更新知识库，回答用户问题
3. **文档摘要**：需要基于长文档生成摘要
4. **代码助手**：需要理解代码库，回答技术问题
5. **数据分析**：需要基于数据回答问题，生成报表

**应该使用 Fine-tuning 的场景**：

1. **特定任务优化**：如文本分类、情感分析、命名实体识别等
2. **风格迁移**：如让模型生成特定风格的文本
3. **领域适应**：如让模型更好地理解医学、法律等专业领域

</details>

---

## 下一章预告

下一章我们会学习 **环境搭建与第一个 LangChain 程序**——也就是如何安装 LangChain、配置 API Key，并写出你的第一个 LangChain 应用。你会学到如何调用大模型、设计 Prompt、解析输出等基础技能。
