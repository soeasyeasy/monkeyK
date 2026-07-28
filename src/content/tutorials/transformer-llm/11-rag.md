---
title: "第11章：检索增强生成（RAG）"
description: "RAG 架构、向量数据库、文档检索、上下文增强、知识库构建"
---

# 第11章：检索增强生成（RAG）

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 RAG？为什么需要它？
- 向量数据库是什么？和普通数据库有什么区别？
- RAG 是怎么工作的？
- 怎么构建自己的知识库？
- RAG 有什么应用场景？

这一章就是为了解答这些问题。我们会从 **RAG 的基本概念** 开始，学习向量数据库、文档检索，然后深入 RAG 的实现和应用。

---

## 1 为什么需要 RAG？

### 痛点分析

**大语言模型的问题**：

1. **知识截止**：训练数据有时间截止点，不知道最新信息
2. **幻觉问题**：可能编造不存在的事实
3. **领域知识不足**：对特定领域的知识有限
4. **无法引用来源**：不能告诉用户答案来自哪里

**例子**：
> 你问："2024 年奥运会在哪里举办？"
> 
> 如果模型训练数据截止到 2023 年，它可能：
> - 不知道答案
> - 编造一个错误答案
> - 给出过时的信息

### 解决方案

**RAG（Retrieval-Augmented Generation，检索增强生成）**：
- ✅ 利用外部知识库
- ✅ 提供最新信息
- ✅ 减少幻觉
- ✅ 可以引用来源

打个比方：

> 大模型就像一个博学的专家，但记忆有限；RAG 就像给这个专家配了一个图书馆，需要时可以查阅资料。

> **一句话总结**：RAG 通过检索外部知识，让大模型拥有最新、更准确的知识。

---

## 2 核心原理

### 2.1 RAG 架构

**RAG 的工作流程**：

```
用户问题 → 检索相关文档 → 将文档和问题一起输入模型 → 生成回答
```

**详细流程**：

```
1. 文档预处理
   文档 → 分块 → 向量化 → 存储到向量数据库

2. 检索阶段
   用户问题 → 向量化 → 在向量数据库中检索 → 返回相关文档

3. 生成阶段
   用户问题 + 相关文档 → 输入大模型 → 生成回答
```

**代码实现**：

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer
import numpy as np

class RAGSystem:
    def __init__(self, model_name="gpt2", embedding_model="all-MiniLM-L6-v2"):
        """
        RAG 系统初始化
        
        参数：
        - model_name: 生成模型名称
        - embedding_model: 嵌入模型名称
        """
        # 生成模型
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)
        
        # 嵌入模型
        self.embedding_model = SentenceTransformer(embedding_model)
        
        # 文档存储
        self.documents = []
        self.embeddings = None
    
    def add_documents(self, documents):
        """
        添加文档到知识库
        
        参数：
        - documents: 文档列表
        """
        self.documents.extend(documents)
        
        # 计算文档嵌入
        self.embeddings = self.embedding_model.encode(
            self.documents,
            convert_to_tensor=True
        )
    
    def retrieve(self, query, top_k=3):
        """
        检索相关文档
        
        参数：
        - query: 查询问题
        - top_k: 返回的文档数量
        """
        # 计算查询嵌入
        query_embedding = self.embedding_model.encode(query, convert_to_tensor=True)
        
        # 计算相似度
        similarities = np.dot(self.embeddings, query_embedding) / (
            np.linalg.norm(self.embeddings, axis=1) * np.linalg.norm(query_embedding)
        )
        
        # 获取 top-k
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        return [self.documents[i] for i in top_indices]
    
    def generate(self, query, context):
        """
        生成回答
        
        参数：
        - query: 查询问题
        - context: 检索到的上下文
        """
        # 构造 prompt
        prompt = f"""基于以下信息回答问题：

{context}

问题：{query}

答案："""
        
        # 生成
        inputs = self.tokenizer(prompt, return_tensors="pt")
        outputs = self.model.generate(
            inputs["input_ids"],
            max_length=200,
            do_sample=True,
            temperature=0.7
        )
        
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    def ask(self, query, top_k=3):
        """
        完整的 RAG 流程
        
        参数：
        - query: 查询问题
        - top_k: 检索的文档数量
        """
        # 检索
        relevant_docs = self.retrieve(query, top_k)
        context = "\n".join(relevant_docs)
        
        # 生成
        answer = self.generate(query, context)
        
        return answer, relevant_docs

# 使用示例
rag = RAGSystem()

# 添加文档
documents = [
    "2024 年夏季奥运会在法国巴黎举办。",
    "巴黎是法国的首都，位于法国北部。",
    "奥运会每四年举办一次。"
]
rag.add_documents(documents)

# 提问
query = "2024 年奥运会在哪里举办？"
answer, sources = rag.ask(query)

print(f"问题：{query}")
print(f"答案：{answer}")
print(f"来源：{sources}")
```

### 2.2 向量数据库

**向量数据库**：专门存储和检索向量的数据库。

**与传统数据库的区别**：

| 特性 | 传统数据库 | 向量数据库 |
| --- | --- | --- |
| 数据类型 | 结构化数据 | 向量 |
| 查询方式 | 精确匹配 | 相似度搜索 |
| 索引方式 | B-tree | ANN（近似最近邻） |
| 适用场景 | 事务处理 | 语义搜索 |

**常见的向量数据库**：

| 数据库 | 特点 | 适用场景 |
| --- | --- | --- |
| **FAISS** | Facebook 开发，速度快 | 研究、小规模 |
| **Chroma** | 开源，易用 | 快速原型 |
| **Pinecone** | 云服务，托管 | 生产环境 |
| **Milvus** | 开源，可扩展 | 大规模应用 |
| **Weaviate** | 开源，功能丰富 | 多模态搜索 |

**使用 FAISS**：

```python
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# 创建嵌入模型
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# 文档
documents = [
    "机器学习是人工智能的一个分支",
    "深度学习使用神经网络",
    "Python 是一种编程语言",
    "TensorFlow 是深度学习框架"
]

# 计算嵌入
embeddings = embedding_model.encode(documents)

# 创建 FAISS 索引
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)  # L2 距离
index.add(embeddings)

# 查询
query = "什么是机器学习？"
query_embedding = embedding_model.encode(query).reshape(1, -1)

# 搜索
k = 2
distances, indices = index.search(query_embedding, k)

print(f"查询：{query}")
print(f"最相关的 {k} 个文档：")
for idx in indices[0]:
    print(f"- {documents[idx]}")
```

**使用 Chroma**：

```python
import chromadb
from chromadb.utils import embedding_functions

# 创建客户端
client = chromadb.Client()

# 创建集合（使用嵌入函数）
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

collection = client.create_collection(
    name="my_knowledge_base",
    embedding_function=sentence_transformer_ef
)

# 添加文档
documents = [
    "机器学习是人工智能的一个分支",
    "深度学习使用神经网络",
    "Python 是一种编程语言"
]

collection.add(
    documents=documents,
    ids=["doc1", "doc2", "doc3"]
)

# 查询
results = collection.query(
    query_texts=["什么是机器学习？"],
    n_results=2
)

print("查询结果：")
for doc in results["documents"][0]:
    print(f"- {doc}")
```

### 2.3 文档分块策略

**为什么要分块？**

1. **模型上下文限制**：模型有最大输入长度
2. **检索精度**：小块更容易精确匹配
3. **效率**：小块检索更快

**分块策略**：

| 策略 | 方法 | 适用场景 |
| --- | --- | --- |
| **固定大小** | 按字符数或 token 数 | 简单场景 |
| **句子级别** | 按句子分割 | 保持语义完整 |
| **段落级别** | 按段落分割 | 长文档 |
| **递归分割** | 先大后小，递归分割 | 复杂文档 |

**代码实现**：

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

def split_documents(documents, chunk_size=1000, chunk_overlap=200):
    """
    分割文档
    
    参数：
    - documents: 文档列表
    - chunk_size: 块大小
    - chunk_overlap: 重叠大小
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", "。", ".", " ", ""]
    )
    
    chunks = []
    for doc in documents:
        doc_chunks = text_splitter.split_text(doc)
        chunks.extend(doc_chunks)
    
    return chunks

# 使用示例
documents = [
    "机器学习是人工智能的一个分支。它使用算法和统计模型来执行任务。" * 50,
    "深度学习是机器学习的一个子领域。它使用多层神经网络。" * 50
]

chunks = split_documents(documents)
print(f"原始文档数：{len(documents)}")
print(f"分块后数量：{len(chunks)}")
```

### 2.4 高级 RAG 技术

#### 查询改写（Query Rewriting）

**核心思想**：改写用户查询，提高检索效果。

```python
def rewrite_query(query, model, tokenizer):
    """
    查询改写
    
    参数：
    - query: 原始查询
    - model: 改写模型
    - tokenizer: 分词器
    """
    prompt = f"""请将以下问题改写为更适合检索的形式：

原始问题：{query}

改写后的问题："""
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(inputs["input_ids"], max_length=100)
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# 使用示例
query = "2024 奥运会在哪？"
rewritten = rewrite_query(query, model, tokenizer)
print(f"原始查询：{query}")
print(f"改写后：{rewritten}")
```

#### 假设文档嵌入（HyDE）

**核心思想**：先生成假设答案，用假设答案检索。

```python
def hyde_retrieval(query, model, tokenizer, index, documents):
    """
    HyDE 检索
    
    参数：
    - query: 查询
    - model: 生成模型
    - tokenizer: 分词器
    - index: 向量索引
    - documents: 文档列表
    """
    # 第一步：生成假设答案
    prompt = f"请回答以下问题：{query}"
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(inputs["input_ids"], max_length=100)
    hypothetical_answer = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # 第二步：用假设答案检索
    query_embedding = embedding_model.encode(hypothetical_answer)
    distances, indices = index.search(query_embedding.reshape(1, -1), 3)
    
    return [documents[i] for i in indices[0]]
```

---

## 3 基础用法

### 3.1 使用 LangChain 构建 RAG

```python
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.llms import HuggingFacePipeline

# 创建嵌入模型
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 创建向量存储
documents = [
    "机器学习是人工智能的一个分支",
    "深度学习使用神经网络",
    "Python 是一种编程语言"
]
vectorstore = FAISS.from_texts(documents, embeddings)

# 创建检索器
retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

# 创建 LLM
llm = HuggingFacePipeline.from_model_id(
    model_id="gpt2",
    task="text-generation",
    pipeline_kwargs={"max_length": 200}
)

# 创建 RAG 链
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    chain_type="stuff"
)

# 提问
query = "什么是机器学习？"
answer = qa_chain.run(query)
print(f"问题：{query}")
print(f"答案：{answer}")
```

### 3.2 使用 LlamaIndex 构建 RAG

```python
from llama_index import VectorStoreIndex, SimpleDirectoryReader
from llama_index import ServiceContext, set_global_service_context
from llama_index.llms import HuggingFaceLLM

# 加载文档
documents = SimpleDirectoryReader("data").load_data()

# 创建 LLM
llm = HuggingFaceLLM(
    model_name="gpt2",
    tokenizer_name="gpt2",
    query_wrapper_prompt=PromptTemplate("<|SYSTEM|>\n{system_msg}\n<|USER|>\n{query_msg}\n<|ASSISTANT|>\n")
)

# 创建服务上下文
service_context = ServiceContext.from_defaults(llm=llm)
set_global_service_context(service_context)

# 创建索引
index = VectorStoreIndex.from_documents(documents)

# 查询引擎
query_engine = index.as_query_engine()

# 提问
response = query_engine.query("什么是机器学习？")
print(response)
```

---

## 4 进阶用法

### 4.1 多路召回（Multi-Query）

**核心思想**：生成多个查询，合并检索结果。

```python
def multi_query_retrieval(query, model, tokenizer, retriever, num_queries=3):
    """
    多路召回
    
    参数：
    - query: 原始查询
    - model: 生成模型
    - tokenizer: 分词器
    - retriever: 检索器
    - num_queries: 生成的查询数量
    """
    # 生成多个查询
    prompt = f"""请基于以下问题生成 {num_queries} 个不同角度的查询：

问题：{query}

查询："""
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(inputs["input_ids"], max_length=200)
    generated_queries = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # 解析查询（简化版）
    queries = [query] + generated_queries.split("\n")[:num_queries-1]
    
    # 检索并合并
    all_docs = []
    for q in queries:
        docs = retriever.retrieve(q)
        all_docs.extend(docs)
    
    # 去重
    unique_docs = list(set(all_docs))
    
    return unique_docs
```

### 4.2 重排序（Reranking）

**核心思想**：对检索结果进行重排序，提高精度。

```python
from sentence_transformers import CrossEncoder

def rerank_documents(query, documents, top_k=3):
    """
    重排序文档
    
    参数：
    - query: 查询
    - documents: 文档列表
    - top_k: 返回的文档数量
    """
    # 创建交叉编码器
    cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    
    # 计算相关性分数
    pairs = [(query, doc) for doc in documents]
    scores = cross_encoder.predict(pairs)
    
    # 排序
    sorted_indices = np.argsort(scores)[::-1]
    
    return [documents[i] for i in sorted_indices[:top_k]]

# 使用示例
query = "什么是机器学习？"
documents = ["机器学习是...", "深度学习是...", "Python 是..."]
reranked = rerank_documents(query, documents)
print(reranked)
```

### 4.3 完整的 RAG 系统

```python
class AdvancedRAGSystem:
    def __init__(self):
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        self.vectorstore = None
        self.llm = None
    
    def build_index(self, documents):
        """
        构建索引
        """
        # 分块
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        chunks = text_splitter.split_documents(documents)
        
        # 创建向量存储
        self.vectorstore = FAISS.from_documents(chunks, self.embedding_model)
    
    def retrieve_and_rerank(self, query, k=5, rerank_k=3):
        """
        检索并重排序
        """
        # 检索
        docs = self.vectorstore.similarity_search(query, k=k)
        
        # 重排序
        doc_texts = [doc.page_content for doc in docs]
        pairs = [(query, text) for text in doc_texts]
        scores = self.cross_encoder.predict(pairs)
        
        sorted_indices = np.argsort(scores)[::-1]
        reranked_docs = [docs[i] for i in sorted_indices[:rerank_k]]
        
        return reranked_docs
    
    def generate_answer(self, query, context):
        """
        生成答案
        """
        prompt = f"""基于以下信息回答问题：

{context}

问题：{query}

答案："""
        
        # 使用 LLM 生成
        # ...
        
        return answer
    
    def ask(self, query):
        """
        完整的问答流程
        """
        # 检索并重排序
        docs = self.retrieve_and_rerank(query)
        context = "\n".join([doc.page_content for doc in docs])
        
        # 生成答案
        answer = self.generate_answer(query, context)
        
        return answer, docs
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **RAG** | 检索增强生成，结合检索和生成 |
| **向量数据库** | 存储和检索向量的数据库 |
| **文档分块** | 将长文档分成小块 |
| **检索** | 根据相似度检索相关文档 |
| **重排序** | 对检索结果进行精排 |
| **查询改写** | 改写查询提高检索效果 |
| **HyDE** | 用假设答案检索 |

---

## 6 新手常见误区

### 误区 1："RAG 不需要好的嵌入模型"

**错！** 嵌入模型是 RAG 的核心：
- 嵌入质量直接影响检索效果
- 需要选择适合任务的嵌入模型
- 中文任务需要中文嵌入模型

**正确做法**：
- 选择高质量的嵌入模型
- 根据任务调整
- 考虑多语言支持

### 误区 2："分块越小越好"

**不完全对。** 分块太小会导致：
- 丢失上下文
- 检索碎片化
- 生成质量下降

**正确做法**：
- 平衡块大小和上下文
- 通常 500-1000 token
- 根据任务调整

### 误区 3："RAG 可以完全替代微调"

**不完全对。** RAG 和微调各有优势：
- RAG：适合动态知识、最新信息
- 微调：适合特定任务、风格适配

**正确做法**：
- 根据场景选择
- 可以结合使用
- RAG + 微调效果更好

---

## 7 动手练习

### 练习 1：基础练习 - 构建简单 RAG

**题目**：使用 FAISS 构建简单的 RAG 系统。

<details>
<summary>点击查看答案</summary>

```python
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import GPT2LMHeadModel, GPT2Tokenizer

# 嵌入模型
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# 文档
documents = [
    "机器学习是人工智能的一个分支",
    "深度学习使用神经网络",
    "Python 是一种编程语言"
]

# 计算嵌入
embeddings = embedding_model.encode(documents)

# 创建 FAISS 索引
index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

# 查询
query = "什么是机器学习？"
query_embedding = embedding_model.encode(query).reshape(1, -1)
distances, indices = index.search(query_embedding, 2)

print("检索结果：")
for idx in indices[0]:
    print(f"- {documents[idx]}")

# 生成
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")

context = "\n".join([documents[i] for i in indices[0]])
prompt = f"基于以下信息回答：{context}\n问题：{query}\n答案："

inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(inputs["input_ids"], max_length=100)
print(f"答案：{tokenizer.decode(outputs[0], skip_special_tokens=True)}")
```

</details>

### 练习 2：进阶练习 - 使用 LangChain RAG

**题目**：使用 LangChain 构建 RAG 系统。

<details>
<summary>点击查看答案</summary>

```python
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.llms import HuggingFacePipeline

# 创建嵌入
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 创建向量存储
documents = ["机器学习是...", "深度学习是...", "Python 是..."]
vectorstore = FAISS.from_texts(documents, embeddings)

# 创建检索器
retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

# 创建 LLM
llm = HuggingFacePipeline.from_model_id(
    model_id="gpt2",
    task="text-generation",
    pipeline_kwargs={"max_length": 200}
)

# 创建 RAG 链
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    chain_type="stuff"
)

# 提问
answer = qa_chain.run("什么是机器学习？")
print(answer)
```

</details>

### 练习 3（挑战）：综合练习 - 完整 RAG 系统

**题目**：实现包含分块、检索、重排序的完整 RAG 系统。

<details>
<summary>点击查看答案</summary>

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer, CrossEncoder
import faiss
import numpy as np

class CompleteRAG:
    def __init__(self):
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        self.index = None
        self.documents = []
    
    def add_documents(self, documents):
        # 分块
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = []
        for doc in documents:
            chunks.extend(splitter.split_text(doc))
        
        self.documents = chunks
        
        # 计算嵌入
        embeddings = self.embedding_model.encode(chunks)
        
        # 创建索引
        self.index = faiss.IndexFlatL2(embeddings.shape[1])
        self.index.add(embeddings)
    
    def retrieve_and_rerank(self, query, k=5, rerank_k=3):
        # 检索
        query_embedding = self.embedding_model.encode(query).reshape(1, -1)
        distances, indices = self.index.search(query_embedding, k)
        
        # 重排序
        docs = [self.documents[i] for i in indices[0]]
        pairs = [(query, doc) for doc in docs]
        scores = self.cross_encoder.predict(pairs)
        
        sorted_indices = np.argsort(scores)[::-1]
        return [docs[i] for i in sorted_indices[:rerank_k]]

# 使用
rag = CompleteRAG()
rag.add_documents(["机器学习是...", "深度学习是...", "Python 是..."])
results = rag.retrieve_and_rerank("什么是机器学习？")
print(results)
```

</details>

---

## 下一章预告

下一章我们会学习 **多模态大模型**——让大模型同时理解文本和图像。你会学到视觉-语言模型、CLIP、GPT-4V、多模态融合等关键技术。这些是让 AI 像人类一样同时理解文字和图片的核心技术。
