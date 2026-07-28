---
title: "第8章：RAG 检索增强生成"
description: "RAG 架构、向量数据库、文档切分、检索策略、上下文增强"
---

# 第8章：RAG 检索增强生成

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 RAG？为什么需要它？
- 向量数据库是什么？怎么用？
- 文档应该怎么切分？
- 如何提高检索质量？
- RAG 和微调有什么区别？

这一章就是为了解答这些问题。我们会学习 **RAG 技术**，让模型能够访问外部知识库。

---

## 1 为什么需要 RAG？

### 痛点分析

**大模型的局限**：

1. **知识截止**：训练数据有时间截止点
2. **幻觉问题**：可能编造不存在的信息
3. **缺乏专业性**：对特定领域知识不足
4. **无法访问私有数据**：企业内部文档

**举个例子**：

```
❌ 直接问模型：
用户：我们公司的退货政策是什么？
AI：抱歉，我没有关于您公司具体政策的信息...

✅ 使用 RAG：
用户：我们公司的退货政策是什么？
AI：根据公司员工手册第5章，退货政策如下...
   （从公司知识库检索到准确信息）
```

### 解决方案

> **一句话总结**：RAG 让模型在回答前先检索相关知识，结合检索结果生成准确回答。

打个比方：

> 想象你在考试：
> - **没有 RAG** = 闭卷考试（只能靠记忆）
> - **有 RAG** = 开卷考试（可以查资料）

---

## 2 核心原理

### RAG 架构

```
用户提问
   ↓
文档检索（从知识库）
   ↓
获取相关文档片段
   ↓
构建 Prompt（问题 + 检索结果）
   ↓
模型生成回答
```

### RAG vs 微调

| 特性 | RAG | 微调 |
|------|-----|------|
| 知识更新 | 实时更新 | 需要重新训练 |
| 成本 | 低 | 高 |
| 可解释性 | 高（可追溯来源） | 低 |
| 适用场景 | 知识问答 | 风格调整 |

---

## 3 基础用法

### 简单的 RAG 实现

```python
from openai import OpenAI
import numpy as np

client = OpenAI()

# 知识库
knowledge_base = [
    {"text": "公司退货政策：30天内可无理由退货", "topic": "退货"},
    {"text": "公司地址：北京市朝阳区XX路XX号", "topic": "地址"},
    {"text": "客服电话：400-123-4567", "topic": "客服"},
]

def get_embedding(text):
    """获取文本嵌入向量"""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def search(query, top_k=2):
    """检索相关文档"""
    # 获取查询向量
    query_embedding = get_embedding(query)
    
    # 计算相似度
    scores = []
    for doc in knowledge_base:
        doc_embedding = get_embedding(doc["text"])
        similarity = np.dot(query_embedding, doc_embedding)
        scores.append((similarity, doc))
    
    # 排序并返回 top_k
    scores.sort(reverse=True)
    return [doc for _, doc in scores[:top_k]]

def rag_query(question):
    """RAG 问答"""
    # 检索相关文档
    relevant_docs = search(question)
    
    # 构建上下文
    context = "\n".join([doc["text"] for doc in relevant_docs])
    
    # 构建 Prompt
    prompt = f"""基于以下信息回答问题：

参考信息：
{context}

问题：{question}

如果参考信息中没有答案，请说明不知道。"""
    
    # 调用模型
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content

# 测试
print(rag_query("公司的退货政策是什么？"))
# 输出：根据公司政策，30天内可无理由退货
```

### 使用向量数据库

```python
from chromadb import Client

# 创建 Chroma 客户端
chroma_client = Client()

# 创建集合
collection = chroma_client.create_collection(name="knowledge_base")

# 添加文档
documents = [
    "公司退货政策：30天内可无理由退货",
    "公司地址：北京市朝阳区XX路XX号",
    "客服电话：400-123-4567"
]

collection.add(
    documents=documents,
    ids=[f"doc_{i}" for i in range(len(documents))]
)

# 检索
results = collection.query(
    query_texts=["退货政策"],
    n_results=2
)

print(results["documents"])
```

### 文档切分

```python
def split_document(text, chunk_size=500, overlap=50):
    """
    切分文档
    
    Args:
        text: 文档文本
        chunk_size: 每个块的大小
        overlap: 重叠大小
    """
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    
    return chunks

# 使用
long_document = "这是一篇很长的文档..." * 100
chunks = split_document(long_document)
print(f"切分成 {len(chunks)} 个块")
```

---

## 4 进阶用法

### 完整的 RAG 系统

```python
class RAGSystem:
    """完整的 RAG 系统"""
    
    def __init__(self, collection_name="knowledge"):
        self.client = OpenAI()
        self.chroma_client = Client()
        
        # 创建或获取集合
        try:
            self.collection = self.chroma_client.get_collection(collection_name)
        except:
            self.collection = self.chroma_client.create_collection(collection_name)
    
    def add_documents(self, documents, metadatas=None):
        """添加文档"""
        ids = [f"doc_{i}" for i in range(len(documents))]
        self.collection.add(
            documents=documents,
            ids=ids,
            metadatas=metadatas
        )
    
    def search(self, query, top_k=3):
        """检索相关文档"""
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )
        return results["documents"][0]
    
    def query(self, question):
        """RAG 问答"""
        # 检索
        relevant_docs = self.search(question)
        context = "\n".join(relevant_docs)
        
        # 构建 Prompt
        prompt = f"""基于以下信息回答问题：

参考信息：
{context}

问题：{question}

要求：
1. 只基于参考信息回答
2. 如果参考信息中没有答案，明确说明
3. 引用信息来源"""
        
        # 调用模型
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.choices[0].message.content

# 使用
rag = RAGSystem()

# 添加文档
rag.add_documents([
    "Python 是一种解释型编程语言",
    "JavaScript 主要用于网页开发",
    "Java 是一种面向对象的语言"
])

# 查询
answer = rag.query("Python 是什么？")
print(answer)
```

### 检索优化

```python
class AdvancedRAG(RAGSystem):
    """高级 RAG 系统"""
    
    def hybrid_search(self, query, top_k=3):
        """混合检索：向量检索 + 关键词检索"""
        # 向量检索
        vector_results = self.search(query, top_k=top_k*2)
        
        # 关键词检索（简化版）
        keywords = query.split()
        keyword_scores = {}
        for doc in vector_results:
            score = sum(1 for kw in keywords if kw in doc)
            keyword_scores[doc] = score
        
        # 综合排序
        sorted_docs = sorted(
            vector_results,
            key=lambda x: keyword_scores.get(x, 0),
            reverse=True
        )
        
        return sorted_docs[:top_k]
    
    def rerank(self, query, documents):
        """重排序"""
        # 使用模型对文档相关性评分
        prompt = f"""对以下文档与查询的相关性评分（1-10分）：

查询：{query}

文档：
{chr(10).join([f'{i+1}. {doc}' for i, doc in enumerate(documents)])}

输出每篇文档的评分，格式：[8, 6, 9, ...]"""
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        import json
        scores = json.loads(response.choices[0].message.content)
        
        # 按评分排序
        ranked = sorted(
            zip(documents, scores),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [doc for doc, _ in ranked]
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| RAG 原理 | 检索 + 生成，结合外部知识 |
| 向量数据库 | 存储和检索文本嵌入 |
| 文档切分 | 将长文档切成小块 |
| 检索策略 | 向量检索、关键词检索、混合检索 |
| 重排序 | 使用模型对检索结果重排 |

---

## 6 新手常见误区

### 误区 1："RAG 可以完全替代微调"

**错！** RAG 和微调适用场景不同：
- RAG：知识问答、实时更新
- 微调：风格调整、特定任务

### 误区 2："文档切分越细越好"

不对。应该：
- 保持语义完整性
- 考虑上下文重叠
- 根据任务调整块大小

### 误区 3："检索越多越好"

实际上：
- 太多检索结果会干扰模型
- 通常 3-5 个就够
- 质量比数量重要

---

## 7 动手练习

### 练习 1：基础练习 - 简单 RAG

**任务**：实现一个简单的 RAG 系统，能够基于知识库回答问题。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI

client = OpenAI()

knowledge = [
    "Python 由 Guido van Rossum 于 1991 年创建",
    "Python 支持多种编程范式",
    "Python 有丰富的标准库"
]

def simple_rag(question):
    # 简单匹配（实际应该用向量检索）
    context = "\n".join(knowledge)
    
    prompt = f"""基于以下信息回答：

{context}

问题：{question}"""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content

print(simple_rag("Python 是谁创建的？"))
```

</details>

### 练习 2：进阶练习 - 文档切分

**任务**：实现一个智能文档切分函数，支持按段落切分。

<details>
<summary>点击查看答案</summary>

```python
def split_by_paragraph(text, max_chunks=10):
    """按段落切分文档"""
    paragraphs = text.split("\n\n")
    
    chunks = []
    current_chunk = ""
    
    for para in paragraphs:
        if len(current_chunk) + len(para) < 500:
            current_chunk += para + "\n\n"
        else:
            chunks.append(current_chunk.strip())
            current_chunk = para + "\n\n"
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks[:max_chunks]

# 测试
doc = "段落1...\n\n段落2...\n\n段落3..."
chunks = split_by_paragraph(doc)
print(f"切分成 {len(chunks)} 块")
```

</details>

### 练习 3（挑战）：综合练习 - 完整 RAG 系统

**任务**：实现一个完整的 RAG 系统，包含文档加载、切分、检索、问答。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
from chromadb import Client

class CompleteRAG:
    def __init__(self):
        self.client = OpenAI()
        self.chroma = Client()
        self.collection = self.chroma.create_collection("docs")
    
    def load_documents(self, texts):
        """加载文档"""
        # 切分
        chunks = []
        for text in texts:
            chunks.extend(self._split(text))
        
        # 添加到向量库
        ids = [f"chunk_{i}" for i in range(len(chunks))]
        self.collection.add(documents=chunks, ids=ids)
        
        print(f"加载了 {len(chunks)} 个文档块")
    
    def _split(self, text, chunk_size=200):
        """切分文档"""
        return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    def query(self, question):
        """问答"""
        # 检索
        results = self.collection.query(
            query_texts=[question],
            n_results=3
        )
        
        context = "\n".join(results["documents"][0])
        
        # 生成
        prompt = f"""基于以下信息回答：

{context}

问题：{question}

如果信息中没有答案，请说明不知道。"""
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.choices[0].message.content

# 使用
rag = CompleteRAG()
rag.load_documents([
    "Python 是一种解释型语言",
    "JavaScript 用于网页开发",
    "Java 是企业级开发首选"
])

print(rag.query("Python 是什么？"))
```

</details>

---

## 下一章预告

下一章我们会学习 **Function Calling 与工具调用**——如何让模型调用外部工具和 API。你会学到：

- Function Calling 机制
- 工具定义和注册
- 参数提取
- 外部系统集成
