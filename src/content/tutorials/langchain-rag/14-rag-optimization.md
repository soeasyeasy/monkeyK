---
title: "第14章：RAG 高级优化"
description: "掌握 RAG 高级优化技巧，学习多路召回、重排序、HyDE、Self-Query、检索质量评估"
---

# 第14章：RAG 高级优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何进一步提高 RAG 系统的检索准确率？
- 什么是多路召回？如何实现？
- 什么是重排序？为什么需要重排序？
- 什么是 HyDE 和 Self-Query？
- 如何评估 RAG 系统的检索质量？

这一章就是为了解答这些问题。我们会学习 RAG 系统的高级优化技巧，让检索更准确、答案更可靠。

---

## 1 为什么需要优化 RAG？

### 痛点分析

基础的 RAG 系统虽然能用，但有以下问题：

**问题 1：单一检索策略不够准确**

```python
# ❌ 只使用相似度检索
retriever = vector_db.as_retriever(search_kwargs={"k": 3})

# 问题：
# 1. 可能遗漏重要信息
# 2. 检索结果不够多样
# 3. 对复杂查询效果差
```

**问题 2：检索到的文档质量参差不齐**

```python
# ❌ 检索到的文档可能不相关
docs = retriever.invoke("Python 装饰器怎么用")
# 可能检索到：
# - 相关文档：装饰器的用法
# - 不相关文档：Python 基础语法
# - 不相关文档：其他编程概念
```

**问题 3：无法评估检索质量**

```python
# ❌ 不知道检索效果好不好
# 没有评估指标
# 不知道如何改进
```

### 解决方案

**高级优化技巧**：多路召回、重排序、HyDE、Self-Query 等。

打个比方：

> **基础 RAG 就像只问一个朋友**：
> - 可能得到片面的信息
>
> **优化后的 RAG 就像问多个专家**：
> - 综合多个来源的信息
> - 筛选出最靠谱的答案

---

## 2 多路召回

### 2.1 什么是多路召回？

多路召回就是使用多种检索策略，获取更全面的文档。

**传统检索**：

```
用户问题 → 相似度检索 → 返回结果
```

**多路召回**：

```
用户问题 → 相似度检索 ┐
        → BM25 检索   ├→ 合并结果 → 去重 → 返回
        → 关键词检索 ┘
```

### 2.2 使用 EnsembleRetriever 实现多路召回

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

# 创建 FAISS 检索器（相似度检索）
embeddings = OpenAIEmbeddings()
faiss_retriever = FAISS.from_texts(
    texts=["Python 装饰器教程", "Python 基础语法", "Java 装饰器模式"],
    embedding=embeddings
).as_retriever(search_kwargs={"k": 3})

# 创建 BM25 检索器（关键词检索）
bm25_retriever = BM25Retriever.from_texts(
    ["Python 装饰器教程", "Python 基础语法", "Java 装饰器模式"]
)
bm25_retriever.k = 3

# 创建组合检索器
ensemble_retriever = EnsembleRetriever(
    retrievers=[faiss_retriever, bm25_retriever],
    weights=[0.5, 0.5]  # 权重，决定每个检索器的重要性
)

# 使用
docs = ensemble_retriever.invoke("Python 装饰器怎么用")
print(f"检索到 {len(docs)} 个文档")
for doc in docs:
    print(f"- {doc.page_content}")
```

**代码解释**：

1. **FAISS 检索器**：基于语义相似度检索
2. **BM25 检索器**：基于关键词匹配检索
3. **EnsembleRetriever**：组合多个检索器
4. **weights**：每个检索器的权重

> **原理**：FAISS 擅长语义理解，BM25 擅长关键词匹配，两者互补。

### 2.3 多路召回的优势

```python
# 测试多路召回
query = "Python 装饰器的语法"

# 单一检索
faiss_docs = faiss_retriever.invoke(query)
bm25_docs = bm25_retriever.invoke(query)

# 多路召回
ensemble_docs = ensemble_retriever.invoke(query)

print(f"FAISS 检索到 {len(faiss_docs)} 个文档")
print(f"BM25 检索到 {len(bm25_docs)} 个文档")
print(f"组合检索到 {len(ensemble_docs)} 个文档")
```

**对比**：

| 检索策略 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **相似度检索（FAISS）** | 理解语义 | 可能遗漏关键词匹配的文档 | 语义查询 |
| **关键词检索（BM25）** | 精确匹配关键词 | 不理解语义 | 精确查询 |
| **多路召回** | 互补优势 | 需要去重 | 通用场景（推荐） |

---

## 3 重排序（Reranking）

### 3.1 什么是重排序？

重排序就是先检索一批文档，再用更精确的模型重新排序。

**流程**：

```
用户问题 → 初步检索（10 个）→ 重排序模型 → 精选结果（3 个）
```

### 3.2 使用 CrossEncoder 重排序

```python
from sentence_transformers import CrossEncoder

# 创建重排序模型
cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# 初步检索
query = "Python 装饰器怎么用"
initial_docs = faiss_retriever.invoke(query)

# 提取文本
texts = [doc.page_content for doc in initial_docs]

# 计算相关性分数
pairs = [[query, text] for text in texts]
scores = cross_encoder.predict(pairs)

# 排序
ranked_docs = sorted(
    zip(initial_docs, scores),
    key=lambda x: x[1],
    reverse=True
)

# 输出结果
print("重排序结果：")
for i, (doc, score) in enumerate(ranked_docs[:3], 1):
    print(f"{i}. [分数: {score:.4f}] {doc.page_content[:100]}...")
```

**代码解释**：

1. **CrossEncoder**：交叉编码器，精确计算查询和文档的相关性
2. **predict**：计算每对查询-文档的相关性分数
3. **排序**：按分数降序排列

> **原理**：CrossEncoder 会同时看到查询和文档，精确计算它们的相关性，比相似度检索更准确。

### 3.3 集成到 RAG 系统

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CrossEncoderReranker

# 创建重排序压缩器
compressor = CrossEncoderReranker(model=cross_encoder, top_n=3)

# 创建重排序检索器
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=faiss_retriever
)

# 使用
docs = compression_retriever.invoke("Python 装饰器怎么用")
print(f"重排序后检索到 {len(docs)} 个文档")
```

**代码解释**：

1. **CrossEncoderReranker**：重排序压缩器
2. **ContextualCompressionRetriever**：包装检索器，自动重排序
3. **top_n=3**：返回前 3 个最相关的文档

> **原理**：先检索一批文档，再用 CrossEncoder 精确排序，返回最相关的文档。

---

## 4 HyDE（假设文档嵌入）

### 4.1 什么是 HyDE？

HyDE（Hypothetical Document Embeddings）是一种检索策略：

1. **生成假设文档**：让 LLM 根据问题生成一个假设的答案
2. **向量化假设文档**：把假设答案转成向量
3. **检索真实文档**：用假设答案的向量检索真实文档

**流程**：

```
用户问题 → LLM 生成假设答案 → 向量化 → 检索真实文档 → 生成最终答案
```

### 4.2 实现 HyDE

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

# 创建 LLM
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 生成假设文档的 Prompt
hyde_prompt = PromptTemplate.from_template(
    "请根据以下问题生成一个详细的回答：\n\n问题：{question}\n\n回答："
)

# 创建 HyDE 链
hyde_chain = hyde_prompt | llm

# 使用 HyDE
query = "Python 装饰器怎么用"

# 1. 生成假设答案
hypothetical_answer = hyde_chain.invoke({"question": query})
print(f"假设答案：{hypothetical_answer.content[:100]}...")

# 2. 用假设答案检索真实文档
# 把假设答案转成向量
hypothetical_embedding = embeddings.embed_query(hypothetical_answer.content)

# 检索真实文档
real_docs = vector_db.similarity_search_by_vector(
    hypothetical_embedding,
    k=3
)

print(f"\n检索到的真实文档：")
for doc in real_docs:
    print(f"- {doc.page_content[:100]}...")
```

**代码解释**：

1. **生成假设答案**：让 LLM 根据问题生成一个假设的回答
2. **向量化**：把假设答案转成向量
3. **检索**：用假设答案的向量检索真实文档

> **原理**：假设答案和真实文档在向量空间中更接近，检索效果更好。

### 4.3 HyDE 的优势

```python
# 对比普通检索和 HyDE
query = "Python 装饰器的最佳实践"

# 普通检索
normal_docs = faiss_retriever.invoke(query)

# HyDE 检索
hypothetical_answer = hyde_chain.invoke({"question": query})
hypothetical_embedding = embeddings.embed_query(hypothetical_answer.content)
hyde_docs = vector_db.similarity_search_by_vector(hypothetical_embedding, k=3)

print("普通检索结果：")
for doc in normal_docs:
    print(f"- {doc.page_content[:50]}...")

print("\nHyDE 检索结果：")
for doc in hyde_docs:
    print(f"- {doc.page_content[:50]}...")
```

**优势**：

| 特性 | 普通检索 | HyDE |
| --- | --- | --- |
| **查询理解** | 直接使用问题 | 通过假设答案理解查询意图 |
| **语义匹配** | 问题-文档匹配 | 答案-文档匹配（更准确） |
| **适用场景** | 简单查询 | 复杂查询 |

---

## 5 Self-Query（自查询）

### 5.1 什么是 Self-Query？

Self-Query 让 LLM 自动从用户问题中提取查询条件，然后执行结构化查询。

**流程**：

```
用户问题 → LLM 提取条件 → 生成查询 → 执行检索 → 返回结果
```

### 5.2 实现 Self-Query

```python
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.chains.query_constructor.base import AttributeInfo

# 定义元数据字段
metadata_field_info = [
    AttributeInfo(
        name="source",
        description="文档来源",
        type="string",
    ),
    AttributeInfo(
        name="page",
        description="页码",
        type="integer",
    ),
    AttributeInfo(
        name="topic",
        description="主题",
        type="string",
    ),
]

# 创建 Self-Query 检索器
self_query_retriever = SelfQueryRetriever.from_llm(
    llm=llm,
    vectorstore=vector_db,
    document_contents="Python 教程文档",
    metadata_field_info=metadata_field_info,
    verbose=True
)

# 使用
docs = self_query_retriever.invoke(
    "查找关于装饰器的文档，来源是 python_tutorial.pdf"
)

print(f"检索到 {len(docs)} 个文档")
for doc in docs:
    print(f"- {doc.page_content[:100]}...")
    print(f"  元数据：{doc.metadata}")
```

**代码解释**：

1. **AttributeInfo**：定义元数据字段
2. **SelfQueryRetriever**：自查询检索器
3. **自动提取条件**：LLM 会从问题中提取"来源=python_tutorial.pdf"等条件

> **原理**：LLM 理解用户问题，自动提取查询条件，生成结构化的检索查询。

---

## 6 检索质量评估

### 6.1 评估指标

| 指标 | 说明 | 计算方式 |
| --- | --- | --- |
| **命中率（Hit Rate）** | 检索到相关文档的比例 | 相关文档数 / 检索文档数 |
| **MRR（平均倒数排名）** | 第一个相关文档的排名 | 1 / 排名 |
| **NDCG** | 归一化折扣累计增益 | 考虑排名和相关性 |

### 6.2 评估检索效果

```python
def evaluate_retrieval(retriever, queries, ground_truth):
    """评估检索效果"""
    hit_rate = 0
    mrr = 0
    
    for query, relevant_docs in zip(queries, ground_truth):
        # 检索
        retrieved_docs = retriever.invoke(query)
        retrieved_texts = [doc.page_content for doc in retrieved_docs]
        
        # 计算命中率
        hits = sum(1 for doc in relevant_docs if doc in retrieved_texts)
        hit_rate += hits / len(relevant_docs) if relevant_docs else 0
        
        # 计算 MRR
        for i, doc in enumerate(retrieved_docs):
            if doc.page_content in relevant_docs:
                mrr += 1 / (i + 1)
                break
    
    hit_rate /= len(queries)
    mrr /= len(queries)
    
    return {
        "hit_rate": hit_rate,
        "mrr": mrr
    }

# 使用
queries = [
    "Python 装饰器怎么用",
    "Python 的优点",
    "Python 和 Java 的区别"
]

ground_truth = [
    ["Python 装饰器教程", "装饰器最佳实践"],
    ["Python 优点总结", "Python 特性介绍"],
    ["Python vs Java", "语言对比"]
]

# 评估不同检索器
for retriever_name, retriever in [
    ("FAISS", faiss_retriever),
    ("BM25", bm25_retriever),
    ("Ensemble", ensemble_retriever)
]:
    metrics = evaluate_retrieval(retriever, queries, ground_truth)
    print(f"{retriever_name}:")
    print(f"  命中率：{metrics['hit_rate']:.2%}")
    print(f"  MRR：{metrics['mrr']:.2%}")
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **多路召回** | 使用多种检索策略，获取更全面的文档 |
| **重排序** | 用 CrossEncoder 精确排序检索结果 |
| **HyDE** | 生成假设答案，用假设答案检索真实文档 |
| **Self-Query** | LLM 自动提取查询条件，执行结构化查询 |
| **评估指标** | 命中率、MRR、NDCG |

---

## 8 新手常见误区

### 误区 1："总是使用单一检索策略"

**错！** 单一检索策略可能遗漏重要信息。

正确做法：使用多路召回，结合多种检索策略。

### 误区 2："不使用重排序"

**错！** 初步检索可能包含不相关的文档。

正确做法：使用 CrossEncoder 重排序，提高准确率。

### 误区 3："HyDE 总是更好"

**错！** HyDE 需要额外的 LLM 调用，成本高。

正确做法：根据场景选择，简单查询用普通检索，复杂查询用 HyDE。

### 误区 4："不评估检索质量"

**错！** 不知道检索效果好不好，无法改进。

正确做法：使用评估指标，定期评估检索效果。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：实现多路召回。

<details>
<summary>点击查看答案</summary>

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

# 创建 FAISS 检索器
faiss_retriever = FAISS.from_texts(
    ["Python 装饰器教程", "Python 基础语法"],
    embedding=embeddings
).as_retriever(search_kwargs={"k": 2})

# 创建 BM25 检索器
bm25_retriever = BM25Retriever.from_texts(
    ["Python 装饰器教程", "Python 基础语法"]
)
bm25_retriever.k = 2

# 创建组合检索器
ensemble_retriever = EnsembleRetriever(
    retrievers=[faiss_retriever, bm25_retriever],
    weights=[0.5, 0.5]
)

# 使用
docs = ensemble_retriever.invoke("Python 装饰器")
print(f"检索到 {len(docs)} 个文档")
```

</details>

### 练习 2：进阶练习

**题目**：实现重排序。

<details>
<summary>点击查看答案</summary>

```python
from sentence_transformers import CrossEncoder
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CrossEncoderReranker

# 创建重排序模型
cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# 创建重排序压缩器
compressor = CrossEncoderReranker(model=cross_encoder, top_n=3)

# 创建重排序检索器
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=faiss_retriever
)

# 使用
docs = compression_retriever.invoke("Python 装饰器")
print(f"重排序后检索到 {len(docs)} 个文档")
```

</details>

### 练习 3（挑战）：综合练习

**题目**：实现 HyDE 检索。

<details>
<summary>点击查看答案</summary>

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 生成假设答案
hyde_prompt = PromptTemplate.from_template(
    "请根据以下问题生成一个详细的回答：\n\n问题：{question}\n\n回答："
)
hyde_chain = hyde_prompt | llm

# 使用 HyDE
query = "Python 装饰器怎么用"
hypothetical_answer = hyde_chain.invoke({"question": query})

# 用假设答案检索真实文档
hypothetical_embedding = embeddings.embed_query(hypothetical_answer.content)
real_docs = vector_db.similarity_search_by_vector(hypothetical_embedding, k=3)

print(f"检索到 {len(real_docs)} 个文档")
for doc in real_docs:
    print(f"- {doc.page_content[:100]}...")
```

</details>

---

## 下一章预告

下一章我们会学习 **企业级知识库问答系统**——也就是如何构建一个完整的、可部署的 RAG 系统。你会学到需求分析、架构设计、功能实现、部署上线等实战技巧。
