---
title: "第12章：LlamaIndex 数据框架"
description: "LlamaIndex 核心概念、数据连接器、索引构建、查询引擎"
---

# 第12章：LlamaIndex 数据框架

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 LlamaIndex？和 LangChain 有什么区别？
- LlamaIndex 的核心概念有哪些？
- 如何连接各种数据源？
- 如何构建索引和查询？
- LlamaIndex 适合什么场景？

这一章就是为了解答这些问题。我们会学习 **LlamaIndex 框架**，专注于数据索引和检索。

---

## 1 为什么需要 LlamaIndex？

### 痛点分析

**数据接入的挑战**：

1. **数据源多样**：PDF、网页、数据库、API 等
2. **索引构建复杂**：需要处理分块、嵌入、存储
3. **查询优化困难**：如何提高检索质量

**举个例子**：

```
❌ 手动处理：
- 写代码解析 PDF
- 手动切分文档
- 手动调用嵌入 API
- 手动存储到向量库
- 代码量：500+ 行

✅ 使用 LlamaIndex：
- 内置 PDF 加载器
- 自动文档切分
- 自动嵌入和存储
- 一行代码查询
- 代码量：50 行
```

### 解决方案

> **一句话总结**：LlamaIndex 专注于数据连接和索引，是构建知识库的最佳选择。

### LangChain vs LlamaIndex

| 特性 | LangChain | LlamaIndex |
|------|-----------|------------|
| 定位 | 通用 AI 应用框架 | 数据索引和检索框架 |
| 强项 | Chain、Agent、工具集成 | 数据加载、索引、查询 |
| 适用场景 | 复杂 AI 应用 | 知识库、RAG |
| 学习曲线 | 较陡 | 较平缓 |

---

## 2 核心原理

### LlamaIndex 架构

```
┌─────────────────────────────────────┐
│  Data Connectors: 数据连接器         │
│  Data Indexes: 数据索引              │
│  Query Engines: 查询引擎             │
│  Response Synthesizers: 响应生成     │
└─────────────────────────────────────┘
```

---

## 3 基础用法

### 安装与基础使用

```bash
pip install llama-index
pip install llama-index-readers-file
```

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# 加载文档
documents = SimpleDirectoryReader("./data").load_data()

# 创建索引
index = VectorStoreIndex.from_documents(documents)

# 查询
query_engine = index.as_query_engine()
response = query_engine.query("文档中提到了什么？")
print(response)
```

### 从文本创建索引

```python
from llama_index.core import VectorStoreIndex, Document

# 创建文档
documents = [
    Document(text="Python 是一种解释型编程语言"),
    Document(text="JavaScript 主要用于网页开发"),
    Document(text="Java 是一种面向对象的语言")
]

# 创建索引
index = VectorStoreIndex.from_documents(documents)

# 查询
query_engine = index.as_query_engine()
response = query_engine.query("Python 是什么？")
print(response)
```

### 自定义索引

```python
from llama_index.core import VectorStoreIndex, Document, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

# 创建 Chroma 客户端
chroma_client = chromadb.EphemeralClient()
chroma_collection = chroma_client.create_collection("my_collection")

# 创建向量存储
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)

# 创建存储上下文
storage_context = StorageContext.from_defaults(vector_store=vector_store)

# 创建文档
documents = [Document(text="LlamaIndex 是一个数据框架")]

# 创建索引
index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context
)

# 查询
query_engine = index.as_query_engine()
response = query_engine.query("LlamaIndex 是什么？")
print(response)
```

### 数据加载器

```python
from llama_index.readers.file import PDFReader
from llama_index.readers.web import SimpleWebPageReader

# 加载 PDF
pdf_docs = PDFReader().load_data(file="./document.pdf")

# 加载网页
web_docs = SimpleWebPageReader().load_data([
    "https://example.com/page1",
    "https://example.com/page2"
])

print(f"PDF 文档数：{len(pdf_docs)}")
print(f"网页文档数：{len(web_docs)}")
```

### 查询引擎

```python
from llama_index.core import VectorStoreIndex, Document

# 创建索引
documents = [Document(text="...")]
index = VectorStoreIndex.from_documents(documents)

# 基础查询引擎
query_engine = index.as_query_engine()
response = query_engine.query("问题")

# 聊天引擎
chat_engine = index.as_chat_engine()
response = chat_engine.chat("问题")

# 流式查询
streaming_engine = index.as_query_engine(streaming=True)
streaming_response = streaming_engine.query("问题")
for text in streaming_response.response_gen:
    print(text, end="", flush=True)
```

---

## 4 进阶用法

### 多索引查询

```python
from llama_index.core import VectorStoreIndex, Document, SummaryIndex

# 创建不同类型的索引
documents = [Document(text="...")]

# 向量索引（适合语义搜索）
vector_index = VectorStoreIndex.from_documents(documents)

# 摘要索引（适合总结）
summary_index = SummaryIndex.from_documents(documents)

# 创建路由查询引擎
from llama_index.core import RouterQueryEngine
from llama_index.core.selectors import LLMSingleSelector

query_engine = RouterQueryEngine(
    selector=LLMSingleSelector.from_defaults(),
    query_engine_tools=[
        {
            "query_engine": vector_index.as_query_engine(),
            "description": "适合搜索具体事实"
        },
        {
            "query_engine": summary_index.as_query_engine(),
            "description": "适合总结整体内容"
        }
    ]
)

response = query_engine.query("总结一下文档的主要内容")
```

### 子问题查询

```python
from llama_index.core import VectorStoreIndex, Document
from llama_index.core.query_engine import SubQuestionQueryEngine
from llama_index.core.tools import QueryEngineTool

# 创建多个索引
index1 = VectorStoreIndex.from_documents([Document(text="Python 教程...")])
index2 = VectorStoreIndex.from_documents([Document(text="Java 教程...")])

# 创建查询引擎工具
tools = [
    QueryEngineTool.from_defaults(
        query_engine=index1.as_query_engine(),
        name="python_index",
        description="Python 相关知识"
    ),
    QueryEngineTool.from_defaults(
        query_engine=index2.as_query_engine(),
        name="java_index",
        description="Java 相关知识"
    )
]

# 创建子问题查询引擎
query_engine = SubQuestionQueryEngine.from_defaults(query_engine_tools=tools)

response = query_engine.query("Python 和 Java 有什么区别？")
```

### 自定义节点处理器

```python
from llama_index.core import Document, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.ingestion import IngestionPipeline

# 创建管道
pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(chunk_size=512, chunk_overlap=50),
        # 可以添加更多处理步骤
    ]
)

# 处理文档
documents = [Document(text="长文档...")]
nodes = pipeline.run(documents=documents)

# 创建索引
index = VectorStoreIndex(nodes=nodes)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Data Connectors | 连接各种数据源 |
| Data Indexes | 构建向量索引 |
| Query Engines | 查询和检索 |
| Node Parsers | 文档切分 |
| Routing | 路由到不同索引 |

---

## 6 新手常见误区

### 误区 1："LlamaIndex 和 LangChain 必须二选一"

**错！** 它们可以互补：
- LlamaIndex：专注于数据索引
- LangChain：专注于应用逻辑
- 可以一起使用

### 误区 2："索引越大越好"

不对。应该：
- 根据数据量选择索引类型
- 优化切分策略
- 考虑查询性能

### 误区 3："不需要优化查询"

实际上：
- 查询质量直接影响效果
- 可以使用路由、重排序等技术
- 需要持续优化

---

## 7 动手练习

### 练习 1：基础练习 - 简单索引

**任务**：使用 LlamaIndex 创建一个简单的文本索引并查询。

<details>
<summary>点击查看答案</summary>

```python
from llama_index.core import VectorStoreIndex, Document

documents = [
    Document(text="Python 是一种编程语言"),
    Document(text="JavaScript 用于网页开发")
]

index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()

response = query_engine.query("Python 是什么？")
print(response)
```

</details>

### 练习 2：进阶练习 - 文件加载

**任务**：使用 LlamaIndex 加载目录下的所有文档并创建索引。

<details>
<summary>点击查看答案</summary>

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# 加载文档
documents = SimpleDirectoryReader("./data").load_data()

# 创建索引
index = VectorStoreIndex.from_documents(documents)

# 查询
query_engine = index.as_query_engine()
response = query_engine.query("文档的主要内容是什么？")
print(response)
```

</details>

### 练习 3（挑战）：综合练习 - 聊天引擎

**任务**：使用 LlamaIndex 创建一个带记忆的聊天引擎。

<details>
<summary>点击查看答案</summary>

```python
from llama_index.core import VectorStoreIndex, Document

documents = [Document(text="...")]
index = VectorStoreIndex.from_documents(documents)

# 创建聊天引擎
chat_engine = index.as_chat_engine()

# 多轮对话
response1 = chat_engine.chat("你好")
print(f"AI: {response1}")

response2 = chat_engine.chat("你还记得我刚才说什么吗？")
print(f"AI: {response2}")
```

</details>

---

## 下一章预告

下一章我们会学习 **AI 应用前端集成**——如何在前端集成 AI 功能，实现流式响应和良好的用户体验。
