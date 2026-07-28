---
title: "第12章：Embedding 与向量数据库"
description: "掌握文本向量化技术，学习 Embedding 模型、向量数据库选型、FAISS 与 Chroma 实战"
---

# 第12章：Embedding 与向量数据库

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Embedding？为什么要向量化文本？
- 有哪些 Embedding 模型可以选择？
- 向量数据库是什么？和传统数据库有什么区别？
- FAISS 和 Chroma 有什么区别？应该选哪个？

这一章就是为了解答这些问题。我们会深入学习 Embedding 和向量数据库的核心概念，这是 RAG 系统的关键组件。

---

## 1 为什么需要 Embedding 和向量数据库？

### 痛点分析

在 RAG 系统中，我们需要解决"如何找到相关文档"的问题：

**问题 1：文本无法直接比较相似度**

```python
# ❌ 文本无法直接计算相似度
text1 = "Python 是一种编程语言"
text2 = "Java 也是一种编程语言"
text3 = "今天天气很好"

# 无法直接判断 text1 和 text2 更相似
# 因为文本是离散的符号
```

**问题 2：关键词匹配不够智能**

```python
# ❌ 传统的关键词匹配
query = "如何学习 Python"
documents = [
    "Python 入门教程",
    "Java 编程指南",
    "Python 最佳实践"
]

# 关键词匹配可能返回所有包含"Python"的文档
# 但无法理解语义相似度
```

**问题 3：传统数据库无法高效检索相似内容**

```python
# ❌ 传统数据库（如 MySQL）
# 只能精确匹配或模糊匹配
# 无法高效检索语义相似的内容
```

### 解决方案

**Embedding** 把文本转成向量，**向量数据库** 高效存储和检索向量。

打个比方：

> **Embedding 就像翻译官**：把文本翻译成数学语言（向量）
>
> **向量数据库就像图书馆**：快速找到最相关的书（向量）

---

## 2 Embedding 核心原理

### 2.1 什么是 Embedding？

Embedding 是把文本（词、句子、文档）映射到高维向量空间的技术。

**核心思想**：

- 语义相似的文本，在向量空间中距离更近
- 语义不同的文本，在向量空间中距离更远

```python
# 文本 → 向量
"Python 是一种编程语言" → [0.12, -0.34, 0.56, ..., 0.78]  # 1536 维
"Java 也是编程语言" → [0.11, -0.33, 0.55, ..., 0.77]  # 很接近
"今天天气很好" → [-0.45, 0.67, -0.12, ..., 0.34]  # 距离较远
```

### 2.2 向量的维度

不同模型的向量维度不同：

| 模型 | 维度 | 特点 |
| --- | --- | --- |
| **OpenAI text-embedding-3-small** | 1536 | 快速、便宜 |
| **OpenAI text-embedding-3-large** | 3072 | 更准确 |
| **OpenAI text-embedding-ada-002** | 1536 | 经典模型 |
| **BGE-large-zh** | 1024 | 中文优化 |
| **M3E-base** | 768 | 轻量级 |

### 2.3 相似度计算

常用的相似度计算方法：

```python
import numpy as np

# 余弦相似度（最常用）
def cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    return dot_product / (norm1 * norm2)

# 欧氏距离
def euclidean_distance(vec1, vec2):
    return np.linalg.norm(vec1 - vec2)

# 内积
def dot_product(vec1, vec2):
    return np.dot(vec1, vec2)
```

**对比**：

| 方法 | 公式 | 适用场景 |
| --- | --- | --- |
| **余弦相似度** | cos(θ) = A·B / (|A||B|) | 文本相似度（推荐） |
| **欧氏距离** | √Σ(Ai-Bi)² | 几何距离 |
| **内积** | A·B = ΣAiBi | 归一化向量 |

> **原理**：余弦相似度衡量两个向量的夹角，值越接近 1 表示越相似。

---

## 3 Embedding 模型

### 3.1 OpenAI Embedding

```python
from langchain_openai import OpenAIEmbeddings

# 创建 Embedding 模型
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"  # 或 "text-embedding-3-large"
)

# 向量化单个文本
text = "Python 是一种编程语言"
vector = embeddings.embed_query(text)
print(f"向量维度：{len(vector)}")  # 1536

# 向量化多个文本
texts = ["Python 教程", "Java 指南", "今天天气"]
vectors = embeddings.embed_documents(texts)
print(f"向量数量：{len(vectors)}")  # 3
```

**代码解释**：

1. **embed_query**：向量化查询文本
2. **embed_documents**：向量化文档文本

> **原理**：OpenAI Embedding 使用神经网络把文本映射到 1536 维空间。

### 3.2 本地 Embedding 模型

```python
from langchain_community.embeddings import HuggingFaceEmbeddings

# 使用本地模型（无需 API）
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-zh-v1.5",  # 中文优化
    model_kwargs={'device': 'cpu'},  # 或 'cuda'
    encode_kwargs={'normalize_embeddings': True}  # 归一化
)

# 向量化
text = "Python 是一种编程语言"
vector = embeddings.embed_query(text)
print(f"向量维度：{len(vector)}")  # 1024
```

**优点**：

- 无需 API 调用，成本低
- 数据不上传，安全
- 可以离线使用

**缺点**：

- 需要 GPU 加速
- 模型质量可能不如 OpenAI

### 3.3 Embedding 模型对比

| 模型 | 维度 | 速度 | 质量 | 成本 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| **OpenAI small** | 1536 | 快 | 好 | 低 | 通用场景（推荐） |
| **OpenAI large** | 3072 | 中 | 最好 | 中 | 高精度需求 |
| **BGE-large-zh** | 1024 | 中 | 好 | 免费 | 中文场景 |
| **M3E-base** | 768 | 快 | 中 | 免费 | 轻量级场景 |

---

## 4 向量数据库

### 4.1 什么是向量数据库？

向量数据库是专门用于存储和检索向量的数据库。

**核心功能**：

1. **存储向量**：高效存储高维向量
2. **相似度检索**：快速找到最相似的向量
3. **索引优化**：使用特殊索引加速检索

**对比传统数据库**：

| 特性 | 传统数据库（MySQL） | 向量数据库 |
| --- | --- | --- |
| **数据类型** | 结构化数据（表） | 向量（高维数组） |
| **查询方式** | 精确匹配、条件过滤 | 相似度检索 |
| **索引结构** | B-tree、Hash | HNSW、IVF、PQ |
| **适用场景** | 业务数据 | 语义检索 |

### 4.2 常用向量数据库

#### FAISS（Facebook AI Similarity Search）

```python
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

# 创建 Embedding 模型
embeddings = OpenAIEmbeddings()

# 从文档创建向量数据库
texts = ["Python 教程", "Java 指南", "C++ 入门"]
metadatas = [{"source": "doc1"}, {"source": "doc2"}, {"source": "doc3"}]

vector_db = FAISS.from_texts(
    texts=texts,
    embedding=embeddings,
    metadatas=metadatas
)

# 检索相似文档
query = "如何学习 Python"
similar_docs = vector_db.similarity_search(query, k=2)

for doc in similar_docs:
    print(f"内容：{doc.page_content}")
    print(f"元数据：{doc.metadata}")
```

**代码解释**：

1. **from_texts**：从文本列表创建向量数据库
2. **similarity_search**：检索最相似的 K 个文档

**优点**：

- 速度快（基于内存）
- 支持多种索引类型
- Facebook 开源，质量有保障

**缺点**：

- 基于内存，不适合大规模数据
- 不支持持久化（需要手动保存）
- 不支持分布式

#### Chroma

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# 创建 Embedding 模型
embeddings = OpenAIEmbeddings()

# 创建向量数据库（自动持久化）
vector_db = Chroma.from_texts(
    texts=["Python 教程", "Java 指南", "C++ 入门"],
    embedding=embeddings,
    persist_directory="./chroma_db"  # 持久化目录
)

# 检索
query = "如何学习 Python"
similar_docs = vector_db.similarity_search(query, k=2)

# 持久化保存
vector_db.persist()
```

**优点**：

- 自动持久化
- 支持元数据过滤
- 易于使用

**缺点**：

- 速度比 FAISS 慢
- 功能相对简单

#### Milvus

```python
from langchain_community.vectorstores import Milvus
from langchain_openai import OpenAIEmbeddings

# 连接 Milvus（需要部署 Milvus 服务）
vector_db = Milvus.from_texts(
    texts=["Python 教程", "Java 指南"],
    embedding=embeddings,
    connection_args={
        "host": "localhost",
        "port": "19530"
    }
)
```

**优点**：

- 支持大规模数据（亿级）
- 支持分布式
- 功能丰富

**缺点**：

- 需要部署服务
- 学习曲线陡峭

### 4.3 向量数据库对比

| 数据库 | 速度 | 规模 | 持久化 | 分布式 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| **FAISS** | 最快 | 中小（百万级） | 手动 | 否 | 快速原型（推荐） |
| **Chroma** | 中 | 中小 | 自动 | 否 | 简单应用 |
| **Milvus** | 快 | 大（亿级） | 自动 | 是 | 生产环境 |
| **Pinecone** | 快 | 大 | 自动 | 是 | 云服务 |
| **Weaviate** | 中 | 大 | 自动 | 是 | 多模态 |

---

## 5 实战：构建向量数据库

### 5.1 完整流程

```python
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

# 1. 加载文档
loader = PyPDFLoader("python_tutorial.pdf")
docs = loader.load()
print(f"加载了 {len(docs)} 页")

# 2. 分割文档
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
texts = splitter.split_documents(docs)
print(f"分割成 {len(texts)} 个块")

# 3. 创建 Embedding 模型
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 4. 创建向量数据库
vector_db = FAISS.from_documents(
    documents=texts,
    embedding=embeddings
)
print(f"向量数据库创建成功")

# 5. 检索
query = "什么是 Python 装饰器"
similar_docs = vector_db.similarity_search(query, k=3)

print(f"\n最相关的 {len(similar_docs)} 个文档：")
for i, doc in enumerate(similar_docs, 1):
    print(f"\n{i}. {doc.page_content[:100]}...")
    print(f"   来源：{doc.metadata['source']}, 页码：{doc.metadata['page']}")
```

### 5.2 保存和加载向量数据库

```python
# 保存 FAISS
vector_db.save_local("./faiss_index")

# 加载 FAISS
vector_db = FAISS.load_local(
    "./faiss_index",
    embeddings,
    allow_dangerous_deserialization=True  # 注意安全风险
)
```

### 5.3 带元数据过滤的检索

```python
# 创建带元数据的向量数据库
texts = ["Python 教程", "Java 教程", "Python 进阶"]
metadatas = [
    {"level": "beginner", "language": "Python"},
    {"level": "beginner", "language": "Java"},
    {"level": "advanced", "language": "Python"}
]

vector_db = FAISS.from_texts(
    texts=texts,
    embedding=embeddings,
    metadatas=metadatas
)

# 检索时过滤元数据
retriever = vector_db.as_retriever(
    search_kwargs={
        "k": 2,
        "filter": {"language": "Python"}  # 只检索 Python 相关
    }
)

docs = retriever.invoke("教程")
for doc in docs:
    print(f"内容：{doc.page_content}")
    print(f"元数据：{doc.metadata}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Embedding** | 把文本映射到高维向量空间 |
| **向量相似度** | 余弦相似度、欧氏距离、内积 |
| **Embedding 模型** | OpenAI、BGE、M3E 等 |
| **向量数据库** | 专门存储和检索向量的数据库 |
| **FAISS** | 快速、基于内存的向量数据库 |
| **Chroma** | 自动持久化的向量数据库 |

---

## 7 新手常见误区

### 误区 1："向量维度越高越好"

**错！** 维度越高，计算成本越高，不一定更准确。

正确做法：根据场景选择合适的维度。

### 误区 2："总是使用 OpenAI Embedding"

**错！** OpenAI 需要 API 调用，有成本和数据安全问题。

正确做法：
- 快速原型 → OpenAI
- 生产环境 → 本地模型（BGE、M3E）

### 误区 3："FAISS 适合所有场景"

**错！** FAISS 基于内存，不适合大规模数据。

正确做法：
- 快速原型 → FAISS
- 生产环境 → Milvus、Pinecone

### 误区 4："不保存向量数据库"

**错！** 每次重建向量数据库很慢。

正确做法：保存向量数据库，下次直接加载。

---

## 8 动手练习

### 练习 1：基础练习

**题目**：使用 OpenAI Embedding 向量化文本。

<details>
<summary>点击查看答案</summary>

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

# 向量化单个文本
text = "Python 是一种编程语言"
vector = embeddings.embed_query(text)
print(f"向量维度：{len(vector)}")

# 向量化多个文本
texts = ["Python 教程", "Java 指南"]
vectors = embeddings.embed_documents(texts)
print(f"向量数量：{len(vectors)}")
```

</details>

### 练习 2：进阶练习

**题目**：创建 FAISS 向量数据库并检索。

<details>
<summary>点击查看答案</summary>

```python
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

# 创建向量数据库
texts = ["Python 教程", "Java 指南", "C++ 入门"]
vector_db = FAISS.from_texts(texts=texts, embedding=embeddings)

# 检索
query = "如何学习 Python"
similar_docs = vector_db.similarity_search(query, k=2)

for doc in similar_docs:
    print(f"内容：{doc.page_content}")
```

</details>

### 练习 3（挑战）：综合练习

**题目**：构建完整的 RAG 索引系统。

<details>
<summary>点击查看答案</summary>

```python
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

class RAGIndex:
    def __init__(self, persist_dir="./faiss_index"):
        self.persist_dir = persist_dir
        self.embeddings = OpenAIEmbeddings()
        self.vector_db = None
    
    def build_index(self, pdf_path):
        """构建索引"""
        # 1. 加载文档
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        
        # 2. 分割文档
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        texts = splitter.split_documents(docs)
        
        # 3. 创建向量数据库
        self.vector_db = FAISS.from_documents(
            documents=texts,
            embedding=self.embeddings
        )
        
        # 4. 保存
        self.vector_db.save_local(self.persist_dir)
        print(f"索引构建完成，共 {len(texts)} 个块")
    
    def load_index(self):
        """加载索引"""
        self.vector_db = FAISS.load_local(
            self.persist_dir,
            self.embeddings,
            allow_dangerous_deserialization=True
        )
        print("索引加载成功")
    
    def search(self, query, k=3):
        """检索"""
        if not self.vector_db:
            raise ValueError("请先构建或加载索引")
        
        return self.vector_db.similarity_search(query, k=k)

# 使用
rag = RAGIndex()

# 构建索引
rag.build_index("python_tutorial.pdf")

# 检索
docs = rag.search("什么是装饰器")
for doc in docs:
    print(f"内容：{doc.page_content[:100]}...")
```

</details>

---

## 下一章预告

下一章我们会学习 **检索增强生成实战**——也就是如何构建完整的 RAG 系统。你会学到检索链的构建、检索策略优化、上下文注入、答案生成等实战技巧。
