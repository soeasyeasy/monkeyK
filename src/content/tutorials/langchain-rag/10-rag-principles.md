---
title: "第10章：RAG 核心原理"
description: "深入理解 RAG 核心原理，学习 RAG 工作流程、为什么需要 RAG、RAG 的优势"
---

# 第10章：RAG 核心原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 RAG？为什么现在这么火？
- RAG 的工作原理是什么？
- 为什么需要 RAG，直接用大模型不行吗？
- RAG 有哪些优势？

这一章就是为了解答这些问题。我们会深入理解 RAG 的核心概念和工作原理，让你能够真正理解这项技术。

---

## 1 为什么需要 RAG？

### 痛点分析

大语言模型虽然强大，但有以下局限：

**问题 1：知识截止**

```python
# ❌ 大模型不知道最新信息
response = chat.invoke([HumanMessage(content="2024 年最新的 Python 版本是什么？")])
print(response.content)
# 结果：模型可能不知道，因为训练数据有截止日期
```

**问题 2：不知道私有数据**

```python
# ❌ 大模型不知道你的公司内部信息
response = chat.invoke([HumanMessage(content="我们公司的退款政策是什么？")])
print(response.content)
# 结果：模型无法访问你的内部文档
```

**问题 3：容易产生幻觉**

```python
# ❌ 大模型会瞎编
response = chat.invoke([HumanMessage(content="请介绍一下《时间简史》的作者")])
print(response.content)
# 结果：可能编造不存在的书籍或作者
```

**问题 4：无法追溯来源**

```python
# ❌ 不知道答案从哪来
response = chat.invoke([HumanMessage(content="Python 的 GIL 是什么？")])
print(response.content)
# 结果：不知道这个答案是基于什么资料
```

### 解决方案

**RAG（Retrieval-Augmented Generation，检索增强生成）** 可以解决这些问题。

打个比方：

> **RAG 就像开卷考试**：
> - 普通大模型 = 闭卷考试，只能靠记忆回答
> - RAG = 开卷考试，可以翻书找答案
>
> 显然，开卷考试更准确，也不容易瞎编。

---

## 2 RAG 核心原理

### 2.1 什么是 RAG？

RAG = Retrieval（检索） + Augmented（增强） + Generation（生成）

**核心思想**：

1. **检索**：从知识库中检索相关信息
2. **增强**：把检索到的信息和用户问题组合
3. **生成**：让大模型基于这些信息生成答案

### 2.2 RAG 工作流程

```
用户提问
  ↓
问题向量化（Embedding）
  ↓
在向量数据库中检索相似文档
  ↓
获取最相关的 K 个文档
  ↓
把文档和问题组合成 Prompt
  ↓
发送给大模型
  ↓
生成最终答案
```

**详细流程**：

```python
# 1. 用户提问
question = "Python 的 GIL 是什么？"

# 2. 问题向量化
question_embedding = embedding_model.encode(question)
# 得到：[0.12, -0.34, 0.56, ...]（1536 维向量）

# 3. 在向量数据库中检索
similar_docs = vector_db.search(question_embedding, top_k=3)
# 返回最相似的 3 个文档

# 4. 组合 Prompt
context = "\n".join([doc.content for doc in similar_docs])
prompt = f"""
根据以下上下文回答问题：

上下文：
{context}

问题：{question}

答案：
"""

# 5. 发送给大模型
response = llm.invoke(prompt)
print(response.content)
```

### 2.3 RAG 的两个阶段

**阶段 1：索引阶段（离线）**

```
文档 → 分割 → 向量化 → 存储到向量数据库
```

```python
# 1. 加载文档
documents = load_documents("python_docs/")

# 2. 分割文档
chunks = split_documents(documents, chunk_size=500)

# 3. 向量化
embeddings = embedding_model.encode([chunk.text for chunk in chunks])

# 4. 存储
vector_db.add_documents(chunks, embeddings)
```

**阶段 2：查询阶段（在线）**

```
用户问题 → 向量化 → 检索 → 组合 Prompt → 生成答案
```

```python
# 1. 用户提问
question = "什么是 GIL？"

# 2. 向量化
question_embedding = embedding_model.encode(question)

# 3. 检索
relevant_docs = vector_db.search(question_embedding, top_k=3)

# 4. 组合 Prompt
context = "\n".join([doc.text for doc in relevant_docs])
prompt = f"根据以下上下文回答问题：\n{context}\n\n问题：{question}"

# 5. 生成答案
answer = llm.invoke(prompt)
```

> **原理**：RAG 把知识存储和答案生成分离，知识存在向量数据库中，生成时再检索相关信息。

---

## 3 RAG 的优势

### 3.1 知识更新方便

```python
# ✅ 只需更新文档，不需要重新训练模型
# 添加新文档
new_doc = "Python 3.12 新增了..."
vector_db.add_documents([new_doc])

# 立即可用，不需要重新训练
```

**对比 Fine-tuning**：

| 方式 | 更新知识 | 成本 | 时间 |
| --- | --- | --- | --- |
| **RAG** | 更新文档即可 | 低 | 分钟级 |
| **Fine-tuning** | 重新训练模型 | 高 | 小时/天级 |

### 3.2 减少幻觉

```python
# ✅ RAG 基于真实文档回答
context = "Python 的 GIL（全局解释器锁）是..."
prompt = f"根据以下上下文回答问题：\n{context}\n\n问题：什么是 GIL？"
response = llm.invoke(prompt)
# 结果：基于真实文档，更准确
```

**原理**：模型被要求"根据上下文回答"，而不是"凭记忆回答"，减少瞎编。

### 3.3 可追溯来源

```python
# ✅ 可以追溯答案来源
relevant_docs = vector_db.search(question_embedding, top_k=3)

for i, doc in enumerate(relevant_docs):
    print(f"来源 {i+1}: {doc.metadata['source']}")
    print(f"内容：{doc.text[:100]}...")

# 输出：
# 来源 1: python_gil.md
# 内容：Python 的 GIL（全局解释器锁）是...
```

**原理**：每个文档都有元数据（来源、页码等），可以追溯答案从哪来。

### 3.4 成本低

```python
# ✅ 不需要 GPU 训练
# 只需要：
# 1. Embedding API 调用（便宜）
# 2. 向量数据库（便宜）
# 3. LLM API 调用（按 token 计费）

# 对比 Fine-tuning：
# - 需要 GPU（贵）
# - 需要训练时间（贵）
# - 需要专业知识（贵）
```

### 3.5 数据安全

```python
# ✅ 私有数据不需要上传到模型训练
# 数据只存储在本地向量数据库
# 只有检索到的相关片段会发送给 LLM API

# 对比 Fine-tuning：
# - 需要把所有训练数据上传到模型提供商
# - 数据可能被用于训练
```

---

## 4 RAG vs Fine-tuning 对比

| 对比项 | RAG | Fine-tuning |
| --- | --- | --- |
| **知识更新** | 实时更新，只需更新文档 | 需要重新训练，成本高 |
| **成本** | 低，只需调用 API | 高，需要 GPU 训练 |
| **时间** | 分钟级 | 小时/天级 |
| **可解释性** | 好，可以追溯答案来源 | 差，黑盒模型 |
| **数据安全** | 好，数据不需要上传 | 差，数据需要上传训练 |
| **适用场景** | 知识问答、文档检索 | 特定任务优化（如分类、生成） |
| **模型控制** | 不改模型 | 改模型参数 |
| **幻觉问题** | 减少幻觉 | 可能过拟合 |

**选择建议**：

- **使用 RAG**：知识问答、客服系统、文档检索、需要实时更新
- **使用 Fine-tuning**：文本分类、情感分析、风格迁移、特定任务优化
- **结合使用**：先用 RAG 检索，再用 Fine-tuned 模型生成

---

## 5 RAG 的核心组件

### 5.1 文档加载器（Document Loader）

```python
from langchain.document_loaders import PyPDFLoader, TextLoader

# 加载 PDF
loader = PyPDFLoader("document.pdf")
docs = loader.load()

# 加载文本
loader = TextLoader("document.txt")
docs = loader.load()
```

### 5.2 文本分割器（Text Splitter）

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 创建分割器
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,      # 每个块最大 500 字符
    chunk_overlap=50     # 块之间重叠 50 字符
)

# 分割文档
chunks = splitter.split_documents(docs)
```

### 5.3 Embedding 模型

```python
from langchain.embeddings import OpenAIEmbeddings

# 创建 Embedding 模型
embeddings = OpenAIEmbeddings()

# 向量化文本
text = "Python 是一种编程语言"
vector = embeddings.embed_query(text)
# 得到：[0.12, -0.34, 0.56, ...]（1536 维向量）
```

### 5.4 向量数据库

```python
from langchain.vectorstores import FAISS

# 创建向量数据库
vector_db = FAISS.from_documents(chunks, embeddings)

# 检索相似文档
query = "什么是 GIL？"
similar_docs = vector_db.similarity_search(query, k=3)
```

### 5.5 检索链

```python
from langchain.chains import RetrievalQA

# 创建检索问答链
qa = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(),
    chain_type="stuff",
    retriever=vector_db.as_retriever()
)

# 提问
answer = qa.run("什么是 GIL？")
```

---

## 6 RAG 的应用场景

### 6.1 知识库问答系统

```python
# 场景：公司内部知识库
# 文档：产品手册、技术文档、FAQ

# 1. 索引阶段
documents = load_company_docs()
vector_db = create_vector_db(documents)

# 2. 查询阶段
qa = RetrievalQA.from_chain_type(llm, retriever=vector_db.as_retriever())
answer = qa.run("如何配置 VPN？")
```

### 6.2 智能客服

```python
# 场景：电商客服
# 文档：商品信息、退换货政策、常见问题

# 1. 索引阶段
product_docs = load_product_docs()
policy_docs = load_policy_docs()
vector_db = create_vector_db(product_docs + policy_docs)

# 2. 查询阶段
qa = RetrievalQA.from_chain_type(llm, retriever=vector_db.as_retriever())
answer = qa.run("这个商品支持七天无理由退货吗？")
```

### 6.3 文档摘要

```python
# 场景：长文档摘要
# 文档：论文、报告、书籍

# 1. 索引阶段
document = load_long_document("paper.pdf")
chunks = split_document(document)
vector_db = create_vector_db(chunks)

# 2. 查询阶段
summary = qa.run("请总结这篇论文的主要贡献")
```

### 6.4 代码助手

```python
# 场景：代码库问答
# 文档：源代码、API 文档、注释

# 1. 索引阶段
code_files = load_code_files("src/")
docs = load_api_docs()
vector_db = create_vector_db(code_files + docs)

# 2. 查询阶段
answer = qa.run("如何调用用户认证 API？")
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **RAG** | 检索增强生成，让大模型基于外部知识回答问题 |
| **工作流程** | 索引阶段（文档→分割→向量化→存储）+ 查询阶段（问题→检索→生成） |
| **核心组件** | 文档加载器、文本分割器、Embedding 模型、向量数据库、检索链 |
| **优势** | 知识更新方便、减少幻觉、可追溯、成本低、数据安全 |
| **应用场景** | 知识库问答、智能客服、文档摘要、代码助手 |

---

## 8 新手常见误区

### 误区 1："RAG 可以完全替代 Fine-tuning"

**错！** RAG 和 Fine-tuning 适用于不同场景。

正确做法：
- 知识问答 → RAG
- 特定任务优化 → Fine-tuning
- 复杂场景 → RAG + Fine-tuning

### 误区 2："RAG 不需要优化"

**错！** RAG 的效果取决于多个因素。

正确做法：
- 优化文档分割策略
- 优化检索算法
- 优化 Prompt 设计
- 选择合适的向量数据库

### 误区 3："Chunk 越大越好"

**错！** Chunk 太大会影响检索精度，太小会丢失上下文。

正确做法：根据文档类型调整 chunk_size，通常 200-1000 字符。

### 误区 4："检索越多文档越好"

**错！** 检索太多文档会增加 token 消耗，可能引入噪音。

正确做法：通常检索 3-5 个最相关的文档。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：描述 RAG 的工作流程。

<details>
<summary>点击查看答案</summary>

**答案**：

RAG 的工作流程分为两个阶段：

**索引阶段（离线）**：
1. 加载文档（PDF、Word、网页等）
2. 分割文档（切成小段 Chunk）
3. 向量化（使用 Embedding 模型转成向量）
4. 存储（存到向量数据库）

**查询阶段（在线）**：
1. 用户提问
2. 问题向量化
3. 在向量数据库中检索相似文档
4. 获取最相关的 K 个文档
5. 把文档和问题组合成 Prompt
6. 发送给大模型
7. 生成最终答案

</details>

### 练习 2：进阶练习

**题目**：对比 RAG 和 Fine-tuning 的优缺点。

<details>
<summary>点击查看答案</summary>

**答案**：

| 对比项 | RAG | Fine-tuning |
| --- | --- | --- |
| **知识更新** | 实时更新，只需更新文档 | 需要重新训练，成本高 |
| **成本** | 低，只需调用 API | 高，需要 GPU 训练 |
| **时间** | 分钟级 | 小时/天级 |
| **可解释性** | 好，可以追溯答案来源 | 差，黑盒模型 |
| **数据安全** | 好，数据不需要上传 | 差，数据需要上传训练 |
| **适用场景** | 知识问答、文档检索 | 特定任务优化 |

**选择建议**：
- 知识问答 → RAG
- 文本分类 → Fine-tuning
- 复杂场景 → RAG + Fine-tuning

</details>

### 练习 3（挑战）：综合练习

**题目**：设计一个企业知识库问答系统的架构。

<details>
<summary>点击查看答案</summary>

**答案**：

**系统架构**：

```
1. 数据层
   - 文档来源：产品手册、技术文档、FAQ、邮件
   - 文档格式：PDF、Word、Markdown、HTML

2. 索引层
   - 文档加载器：支持多种格式
   - 文本分割器：RecursiveCharacterTextSplitter
   - Embedding 模型：OpenAI Embeddings
   - 向量数据库：FAISS / Chroma

3. 查询层
   - 检索器：相似度检索
   - Prompt 模板：基于上下文回答
   - LLM：GPT-3.5 / GPT-4

4. 应用层
   - Web 界面：用户提问
   - API 接口：集成到其他系统
   - 日志记录：追溯答案来源
```

**关键设计**：
- 文档分割：chunk_size=500，chunk_overlap=50
- 检索策略：top_k=3
- Prompt 设计：明确要求"根据上下文回答"
- 元数据：记录文档来源、页码、时间

</details>

---

## 下一章预告

下一章我们会学习 **文档加载与分割**——也就是如何加载各种格式的文档，以及如何合理分割文档。你会学到 PDF、Word、网页等文档的加载方法，以及不同的文本分割策略。
