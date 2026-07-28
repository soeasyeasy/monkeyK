---
title: "第13章：检索增强生成实战"
description: "构建完整的 RAG 系统，学习检索链、检索策略优化、上下文注入、答案生成"
---

# 第13章：检索增强生成实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何构建一个完整的 RAG 问答系统？
- 检索链（RetrievalQA）是怎么工作的？
- 如何优化检索策略，提高准确率？
- 如何把检索到的文档注入到 Prompt 中？

这一章就是为了解答这些问题。我们会动手构建一个完整的 RAG 系统，从文档加载到答案生成，完整走一遍流程。

---

## 1 为什么需要检索增强生成？

### 痛点分析

前面的章节我们学习了：
- 文档加载与分割
- Embedding 与向量数据库

但如何把这些组件串联起来，构建一个完整的问答系统？

**问题 1：如何把检索和生成结合起来？**

```python
# ❌ 手动拼接
docs = vector_db.similarity_search(query, k=3)
context = "\n".join([doc.page_content for doc in docs])
prompt = f"根据以下上下文回答问题：\n{context}\n\n问题：{query}"
answer = llm.invoke(prompt)

# 问题：代码很乱，难以维护
```

**问题 2：如何优化检索策略？**

```python
# ❌ 简单的相似度检索
docs = vector_db.similarity_search(query, k=3)

# 问题：
# 1. 可能检索到不相关的文档
# 2. 无法处理复杂查询
# 3. 没有考虑文档的重要性
```

**问题 3：如何设计更好的 Prompt？**

```python
# ❌ 简单的 Prompt
prompt = f"根据以下上下文回答问题：\n{context}\n\n问题：{query}"

# 问题：
# 1. 没有明确指示模型只基于上下文回答
# 2. 没有处理"不知道"的情况
# 3. 没有要求引用来源
```

### 解决方案

**检索链（RetrievalQA）** 把检索和生成串联起来，提供完整的 RAG 流程。

打个比方：

> **检索链就像图书馆的咨询服务**：
> 1. 你提出问题
> 2. 图书管理员（检索器）找到相关的书
> 3. 你把书和问题一起交给专家（大模型）
> 4. 专家基于书中的内容回答问题

---

## 2 基础检索链

### 2.1 RetrievalQA 基础用法

```python
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 1. 加载文档
loader = PyPDFLoader("python_tutorial.pdf")
docs = loader.load()

# 2. 分割文档
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
texts = splitter.split_documents(docs)

# 3. 创建向量数据库
embeddings = OpenAIEmbeddings()
vector_db = FAISS.from_documents(texts, embeddings)

# 4. 创建检索链
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
qa = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # 链类型
    retriever=vector_db.as_retriever(search_kwargs={"k": 3}),  # 检索器
    return_source_documents=True  # 返回源文档
)

# 5. 提问
query = "什么是 Python 装饰器？"
result = qa.invoke(query)

print(f"问题：{query}")
print(f"答案：{result['result']}")
print(f"\n参考文档：")
for i, doc in enumerate(result['source_documents'], 1):
    print(f"{i}. {doc.page_content[:100]}...")
```

**代码解释**：

1. **from_chain_type**：创建检索链
2. **chain_type="stuff"**：把所有文档直接塞进 Prompt
3. **retriever**：检索器，负责检索相关文档
4. **return_source_documents=True**：返回源文档，便于追溯

> **原理**：RetrievalQA 会自动检索相关文档，把文档和问题组合成 Prompt，然后调用 LLM 生成答案。

### 2.2 不同的 Chain 类型

```python
# stuff：把所有文档直接塞进 Prompt
qa_stuff = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vector_db.as_retriever()
)

# map_reduce：先对每个文档生成答案，再合并
qa_map_reduce = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="map_reduce",
    retriever=vector_db.as_retriever()
)

# refine：逐个文档处理，逐步优化答案
qa_refine = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="refine",
    retriever=vector_db.as_retriever()
)

# map_rerank：对每个文档生成答案并打分，选最好的
qa_map_rerank = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="map_rerank",
    retriever=vector_db.as_retriever()
)
```

**对比表格**：

| Chain 类型 | 工作原理 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| **stuff** | 把所有文档塞进一个 Prompt | 简单、快速 | 文档多时超过 token 限制 | 文档少（推荐） |
| **map_reduce** | 分别处理每个文档，再合并 | 可以处理大量文档 | 需要多次调用 LLM | 长文档摘要 |
| **refine** | 逐个文档处理，逐步优化 | 答案更完整 | 速度慢，成本高 | 需要详细答案 |
| **map_rerank** | 分别处理并打分，选最好的 | 答案质量高 | 需要多次调用 LLM | 需要高质量答案 |

---

## 3 自定义 Prompt

### 3.1 使用自定义 Prompt 模板

```python
from langchain_core.prompts import PromptTemplate

# 自定义 Prompt 模板
prompt_template = """
你是一个专业的 Python 技术助手。请根据以下上下文回答用户的问题。

如果上下文中没有答案，请说"我不知道"，不要编造答案。

上下文：
{context}

问题：{question}

答案：
"""

# 创建 Prompt
PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

# 创建检索链
qa = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vector_db.as_retriever(search_kwargs={"k": 3}),
    chain_type_kwargs={"prompt": PROMPT},  # 使用自定义 Prompt
    return_source_documents=True
)

# 提问
result = qa.invoke("什么是装饰器？")
print(result['result'])
```

**代码解释**：

1. **PromptTemplate**：定义 Prompt 模板
2. **input_variables**：指定变量名
3. **chain_type_kwargs**：传递自定义 Prompt

> **原理**：自定义 Prompt 可以控制模型的行为，比如要求只基于上下文回答、要求引用来源等。

### 3.2 要求引用来源

```python
prompt_template = """
你是一个专业的技术助手。请根据以下上下文回答用户的问题。

要求：
1. 只基于上下文中的信息回答
2. 如果上下文中没有答案，说"根据提供的资料，我无法回答这个问题"
3. 在答案中引用相关的文档来源

上下文：
{context}

问题：{question}

答案：
"""

PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

qa = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vector_db.as_retriever(search_kwargs={"k": 3}),
    chain_type_kwargs={"prompt": PROMPT}
)
```

---

## 4 检索策略优化

### 4.1 调整检索数量（k 值）

```python
# 检索 3 个文档
retriever_k3 = vector_db.as_retriever(search_kwargs={"k": 3})

# 检索 5 个文档
retriever_k5 = vector_db.as_retriever(search_kwargs={"k": 5})

# 检索 10 个文档
retriever_k10 = vector_db.as_retriever(search_kwargs={"k": 10})

# 对比效果
query = "Python 有哪些优点？"

for k in [3, 5, 10]:
    retriever = vector_db.as_retriever(search_kwargs={"k": k})
    qa = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever
    )
    result = qa.invoke(query)
    print(f"k={k}: {result['result'][:100]}...")
```

**k 值选择建议**：

| k 值 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **1-2** | 快速、成本低 | 可能遗漏重要信息 | 简单问题 |
| **3-5** | 平衡（推荐） | - | 通用场景 |
| **5-10** | 信息更全面 | 成本高、可能引入噪音 | 复杂问题 |

### 4.2 使用相似度阈值

```python
# 只返回相似度 > 0.7 的文档
retriever = vector_db.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.7}
)

# 使用
docs = retriever.invoke("什么是装饰器？")
print(f"检索到 {len(docs)} 个文档")
```

**代码解释**：

1. **search_type="similarity_score_threshold"**：使用相似度阈值
2. **score_threshold=0.7**：只返回相似度 > 0.7 的文档

> **原理**：过滤掉相似度低的文档，减少噪音。

### 4.3 使用 MMR（最大边际相关性）

```python
# MMR：平衡相关性和多样性
retriever = vector_db.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 3,
        "fetch_k": 10,  # 先检索 10 个
        "lambda_mult": 0.5  # 平衡相关性和多样性
    }
)

# 使用
docs = retriever.invoke("Python 的优点")
for doc in docs:
    print(f"内容：{doc.page_content[:100]}...")
```

**代码解释**：

1. **search_type="mmr"**：使用 MMR 算法
2. **fetch_k=10**：先检索 10 个候选文档
3. **lambda_mult=0.5**：平衡相关性和多样性（0-1，越大越注重相关性）

> **原理**：MMR 会选择既相关又多样的文档，避免检索到重复的内容。

---

## 5 上下文注入

### 5.1 自定义上下文格式

```python
from langchain_core.prompts import PromptTemplate

# 自定义上下文格式
context_template = """
以下是从知识库中检索到的相关信息：

{context}

---

基于以上信息，请回答用户的问题。如果信息不足以回答问题，请明确说明。

用户问题：{question}
"""

PROMPT = PromptTemplate(
    template=context_template,
    input_variables=["context", "question"]
)

qa = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vector_db.as_retriever(search_kwargs={"k": 3}),
    chain_type_kwargs={"prompt": PROMPT}
)
```

### 5.2 添加文档元数据

```python
# 在上下文中包含文档来源
def format_docs_with_metadata(docs):
    formatted = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get('source', '未知')
        page = doc.metadata.get('page', '未知')
        formatted.append(f"[文档 {i}] 来源：{source}, 页码：{page}\n{doc.page_content}")
    return "\n\n".join(formatted)

# 自定义 Chain
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

retriever = vector_db.as_retriever(search_kwargs={"k": 3})

qa_chain = (
    {"context": retriever | format_docs_with_metadata, "question": RunnablePassthrough()}
    | PROMPT
    | llm
    | StrOutputParser()
)

# 使用
result = qa_chain.invoke("什么是装饰器？")
print(result)
```

**代码解释**：

1. **format_docs_with_metadata**：格式化文档，包含元数据
2. **RunnablePassthrough**：传递问题
3. **自定义 Chain**：手动构建检索链

> **原理**：手动构建 Chain 可以更灵活地控制上下文格式。

---

## 6 完整 RAG 系统

### 6.1 封装成类

```python
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate

class RAGSystem:
    def __init__(self, persist_dir="./faiss_index"):
        self.persist_dir = persist_dir
        self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        self.embeddings = OpenAIEmbeddings()
        self.vector_db = None
        self.qa = None
        
        # 自定义 Prompt
        self.prompt_template = """
你是一个专业的技术助手。请根据以下上下文回答用户的问题。

要求：
1. 只基于上下文中的信息回答
2. 如果上下文中没有答案，说"根据提供的资料，我无法回答这个问题"
3. 答案要简洁、准确

上下文：
{context}

问题：{question}

答案：
"""
    
    def build_index(self, pdf_path, chunk_size=500, chunk_overlap=50):
        """构建索引"""
        # 1. 加载文档
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        print(f"加载了 {len(docs)} 页")
        
        # 2. 分割文档
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        texts = splitter.split_documents(docs)
        print(f"分割成 {len(texts)} 个块")
        
        # 3. 创建向量数据库
        self.vector_db = FAISS.from_documents(texts, self.embeddings)
        self.vector_db.save_local(self.persist_dir)
        print("索引构建完成")
        
        # 4. 创建检索链
        self._create_qa_chain()
    
    def load_index(self):
        """加载索引"""
        self.vector_db = FAISS.load_local(
            self.persist_dir,
            self.embeddings,
            allow_dangerous_deserialization=True
        )
        print("索引加载成功")
        self._create_qa_chain()
    
    def _create_qa_chain(self):
        """创建检索链"""
        PROMPT = PromptTemplate(
            template=self.prompt_template,
            input_variables=["context", "question"]
        )
        
        self.qa = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_db.as_retriever(
                search_type="mmr",
                search_kwargs={"k": 3, "fetch_k": 10}
            ),
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=True
        )
    
    def ask(self, question):
        """提问"""
        if not self.qa:
            raise ValueError("请先构建或加载索引")
        
        result = self.qa.invoke(question)
        
        return {
            "question": question,
            "answer": result['result'],
            "sources": [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata
                }
                for doc in result['source_documents']
            ]
        }

# 使用
rag = RAGSystem()

# 构建索引
rag.build_index("python_tutorial.pdf")

# 提问
result = rag.ask("什么是 Python 装饰器？")
print(f"问题：{result['question']}")
print(f"答案：{result['answer']}")
print(f"\n参考文档：")
for i, source in enumerate(result['sources'], 1):
    print(f"{i}. {source['content'][:100]}...")
    print(f"   来源：{source['metadata']}")
```

### 6.2 交互式问答

```python
def interactive_qa(rag_system):
    """交互式问答"""
    print("欢迎使用 RAG 问答系统！输入 'quit' 退出。")
    
    while True:
        question = input("\n请输入你的问题：")
        
        if question.lower() in ['quit', 'exit', '退出']:
            print("再见！")
            break
        
        if not question.strip():
            continue
        
        try:
            result = rag_system.ask(question)
            print(f"\n答案：{result['answer']}")
            
            # 显示参考文档
            print(f"\n参考了 {len(result['sources'])} 个文档：")
            for i, source in enumerate(result['sources'], 1):
                print(f"  {i}. {source['content'][:50]}...")
        
        except Exception as e:
            print(f"错误：{e}")

# 使用
rag = RAGSystem()
rag.load_index()
interactive_qa(rag)
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **RetrievalQA** | 检索链，把检索和生成串联起来 |
| **Chain 类型** | stuff、map_reduce、refine、map_rerank |
| **自定义 Prompt** | 控制模型行为，要求引用来源 |
| **检索策略** | 调整 k 值、相似度阈值、MMR |
| **上下文注入** | 格式化文档，包含元数据 |

---

## 8 新手常见误区

### 误区 1："总是使用 stuff 类型"

**错！** stuff 类型在文档多时会超过 token 限制。

正确做法：
- 文档少（< 10）→ stuff
- 文档多 → map_reduce 或 refine

### 误区 2："k 值越大越好"

**错！** k 值太大会增加成本，可能引入噪音。

正确做法：通常 k=3-5，根据效果调整。

### 误区 3："不自定义 Prompt"

**错！** 默认 Prompt 可能不符合需求。

正确做法：自定义 Prompt，明确要求（如只基于上下文回答、引用来源）。

### 误区 4："不使用 MMR"

**错！** 普通相似度检索可能返回重复的内容。

正确做法：使用 MMR 平衡相关性和多样性。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：创建一个基础的检索链。

<details>
<summary>点击查看答案</summary>

```python
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

# 创建向量数据库
embeddings = OpenAIEmbeddings()
vector_db = FAISS.from_texts(
    texts=["Python 是一种编程语言", "Java 也是一种编程语言"],
    embedding=embeddings
)

# 创建检索链
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
qa = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vector_db.as_retriever(search_kwargs={"k": 2})
)

# 提问
result = qa.invoke("什么是 Python？")
print(result['result'])
```

</details>

### 练习 2：进阶练习

**题目**：使用自定义 Prompt 创建检索链。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.prompts import PromptTemplate

prompt_template = """
根据以下上下文回答问题。如果上下文中没有答案，说"我不知道"。

上下文：{context}
问题：{question}
答案：
"""

PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

qa = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vector_db.as_retriever(search_kwargs={"k": 3}),
    chain_type_kwargs={"prompt": PROMPT}
)

result = qa.invoke("什么是 Python？")
print(result['result'])
```

</details>

### 练习 3（挑战）：综合练习

**题目**：创建一个完整的 RAG 系统类。

<details>
<summary>点击查看答案</summary>

```python
class RAGSystem:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        self.embeddings = OpenAIEmbeddings()
        self.vector_db = None
    
    def build_index(self, texts):
        self.vector_db = FAISS.from_texts(texts, self.embeddings)
    
    def ask(self, question):
        if not self.vector_db:
            raise ValueError("请先构建索引")
        
        qa = RetrievalQA.from_chain_type(
            llm=self.llm,
            retriever=self.vector_db.as_retriever(
                search_type="mmr",
                search_kwargs={"k": 3}
            ),
            return_source_documents=True
        )
        
        return qa.invoke(question)

# 使用
rag = RAGSystem()
rag.build_index(["Python 教程", "Java 指南", "C++ 入门"])
result = rag.ask("什么是 Python？")
print(result['result'])
```

</details>

---

## 下一章预告

下一章我们会学习 **RAG 高级优化**——也就是如何进一步提升 RAG 系统的性能。你会学到多路召回、重排序、HyDE、Self-Query 等高级技巧。
