---
title: "第11章：文档加载与分割"
description: "掌握文档加载与分割技术，学习如何加载各种格式的文档，以及如何合理分割文档"
---

# 第11章：文档加载与分割

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何加载 PDF、Word、网页等不同格式的文档？
- 文档分割有什么策略？为什么要分割？
- Chunk 大小应该设置多少？
- 如何保留文档的元数据？

这一章就是为了解答这些问题。我们会深入学习文档加载和分割的技术，这是构建 RAG 系统的第一步。

---

## 1 为什么需要文档加载与分割？

### 痛点分析

在构建 RAG 系统时，我们会遇到这些问题：

**问题 1：文档格式多样**

```python
# ❌ 不同格式的文档需要不同的处理方式
pdf_file = "document.pdf"
word_file = "document.docx"
web_page = "https://example.com"

# 每个格式都需要单独的解析逻辑
# 代码会很复杂
```

**问题 2：文档太长**

```python
# ❌ 直接把整个文档发给大模型
with open("long_document.txt", "r") as f:
    content = f.read()

response = llm.invoke(f"总结以下内容：{content}")
# 问题：
# 1. 超过模型的 token 限制
# 2. 成本很高
# 3. 效果不好
```

**问题 3：检索精度低**

```python
# ❌ 不分割文档，直接检索
# 整个文档作为一个 Chunk
# 检索时可能返回不相关的部分
# 因为文档中有很多不同的主题
```

### 解决方案

**文档加载器** 统一处理不同格式的文档。
**文本分割器** 把长文档切成合适的小段。

打个比方：

> **文档加载器就像翻译官**：把不同格式（PDF、Word、网页）都翻译成统一的文本格式
>
> **文本分割器就像剪刀**：把长文档剪成合适的小段，方便检索和处理

---

## 2 文档加载器

### 2.1 什么是文档加载器？

文档加载器（Document Loader）负责把各种格式的文档转换成 LangChain 的 Document 对象。

**Document 对象结构**：

```python
from langchain.schema import Document

doc = Document(
    page_content="这是文档内容",  # 文档文本
    metadata={"source": "document.pdf", "page": 1}  # 元数据
)
```

### 2.2 常用文档加载器

#### PDF 加载器

```python
from langchain.document_loaders import PyPDFLoader

# 创建加载器
loader = PyPDFLoader("document.pdf")

# 加载文档
docs = loader.load()

# 查看结果
print(f"加载了 {len(docs)} 个页面")
for i, doc in enumerate(docs[:3]):
    print(f"\n第 {i+1} 页：")
    print(f"内容：{doc.page_content[:100]}...")
    print(f"元数据：{doc.metadata}")
```

**代码解释**：

1. **创建加载器**：指定 PDF 文件路径
2. **加载文档**：返回 Document 对象列表，每个页面对一个 Document
3. **查看结果**：每个 Document 包含内容和元数据

> **原理**：PyPDFLoader 使用 PyPDF2 库解析 PDF，提取文本和元数据。

#### Word 加载器

```python
from langchain.document_loaders import Docx2txtLoader

# 创建加载器
loader = Docx2txtLoader("document.docx")

# 加载文档
docs = loader.load()

print(f"加载了 {len(docs)} 个文档")
print(f"内容：{docs[0].page_content[:100]}...")
```

#### 文本文件加载器

```python
from langchain.document_loaders import TextLoader

# 创建加载器
loader = TextLoader("document.txt", encoding="utf-8")

# 加载文档
docs = loader.load()

print(f"内容：{docs[0].page_content[:100]}...")
```

#### CSV 加载器

```python
from langchain.document_loaders import CSVLoader

# 创建加载器
loader = CSVLoader("data.csv")

# 加载文档
docs = loader.load()

# 每行变成一个 Document
print(f"加载了 {len(docs)} 行")
print(f"第一行：{docs[0].page_content}")
```

#### 网页加载器

```python
from langchain.document_loaders import WebBaseLoader

# 创建加载器
loader = WebBaseLoader("https://example.com")

# 加载文档
docs = loader.load()

print(f"内容：{docs[0].page_content[:100]}...")
```

#### 多文件加载器

```python
from langchain.document_loaders import DirectoryLoader, PyPDFLoader

# 加载目录下所有 PDF
loader = DirectoryLoader(
    "./documents",
    glob="**/*.pdf",
    loader_cls=PyPDFLoader
)

docs = loader.load()
print(f"加载了 {len(docs)} 个 PDF 页面")
```

**代码解释**：

1. **DirectoryLoader**：加载目录下所有文件
2. **glob**：指定文件匹配模式
3. **loader_cls**：指定使用哪个加载器

> **原理**：DirectoryLoader 会遍历目录，对每个文件使用指定的加载器加载。

### 2.3 加载器对比

| 加载器 | 支持格式 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **PyPDFLoader** | PDF | 支持分页 | 需要安装 PyPDF2 |
| **Docx2txtLoader** | Word | 简单易用 | 需要安装 docx2txt |
| **TextLoader** | 文本 | 最基础 | 只支持纯文本 |
| **CSVLoader** | CSV | 每行一个 Document | 不适合长文本 |
| **WebBaseLoader** | 网页 | 自动解析 HTML | 需要安装 beautifulsoup4 |
| **DirectoryLoader** | 多文件 | 批量加载 | 需要指定加载器 |

---

## 3 文本分割器

### 3.1 为什么需要分割？

```python
# ❌ 不分割的问题
long_doc = "..." * 10000  # 很长的文档

# 1. 超过 token 限制
# GPT-3.5 最多 4096 tokens
# 长文档可能超过限制

# 2. 检索不精确
# 整个文档作为一个 Chunk
# 可能包含多个不相关的主题

# 3. 成本高
# 每次检索都要处理整个文档
```

### 3.2 分割策略

#### RecursiveCharacterTextSplitter（递归字符分割器）

最常用的分割器，按字符递归分割。

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 创建分割器
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,       # 每个块最大 500 字符
    chunk_overlap=50,     # 块之间重叠 50 字符
    length_function=len,  # 长度计算函数
    separators=["\n\n", "\n", " ", ""]  # 分隔符优先级
)

# 分割文档
texts = text_splitter.split_documents(docs)

print(f"分割成 {len(texts)} 个块")
for i, text in enumerate(texts[:3]):
    print(f"\n第 {i+1} 块：")
    print(f"长度：{len(text.page_content)} 字符")
    print(f"内容：{text.page_content[:100]}...")
```

**代码解释**：

1. **chunk_size**：每个块的最大字符数
2. **chunk_overlap**：块之间的重叠字符数，保持上下文
3. **separators**：分隔符优先级，先尝试用 `\n\n` 分割，不行再用 `\n`，以此类推

> **原理**：递归分割器会优先使用更自然的分隔符（如段落），保持文本的语义完整性。

#### CharacterTextSplitter（字符分割器）

简单的字符分割器。

```python
from langchain.text_splitter import CharacterTextSplitter

# 创建分割器
text_splitter = CharacterTextSplitter(
    separator="\n\n",  # 分隔符
    chunk_size=500,
    chunk_overlap=50
)

# 分割文档
texts = text_splitter.split_documents(docs)
```

#### TokenTextSplitter（Token 分割器）

按 token 分割，更精确。

```python
from langchain.text_splitter import TokenTextSplitter

# 创建分割器
text_splitter = TokenTextSplitter(
    chunk_size=500,  # 500 个 token
    chunk_overlap=50
)

# 分割文档
texts = text_splitter.split_documents(docs)
```

> **原理**：Token 分割器使用 tokenizer 计算 token 数，更精确但更慢。

#### MarkdownHeaderTextSplitter（Markdown 分割器）

专门用于 Markdown 文档。

```python
from langchain.text_splitter import MarkdownHeaderTextSplitter

# 定义标题层级
headers_to_split_on = [
    ("#", "Header 1"),
    ("##", "Header 2"),
    ("###", "Header 3"),
]

# 创建分割器
text_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)

# 分割 Markdown
markdown_document = """# 标题 1
这是第一部分内容

## 标题 2
这是第二部分内容

### 标题 3
这是第三部分内容
"""

texts = text_splitter.split_text(markdown_document)

for text in texts:
    print(f"内容：{text.page_content}")
    print(f"元数据：{text.metadata}")
```

**代码解释**：

1. **headers_to_split_on**：定义标题层级
2. **分割**：按标题分割，保留标题作为元数据

> **原理**：Markdown 分割器会识别标题结构，按标题层级分割，保留结构信息。

### 3.3 分割器对比

| 分割器 | 分割方式 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| **RecursiveCharacterTextSplitter** | 递归字符 | 保持语义完整 | 可能不均匀 | 通用文本（推荐） |
| **CharacterTextSplitter** | 固定字符 | 简单快速 | 可能切断句子 | 简单文本 |
| **TokenTextSplitter** | Token | 精确控制 token | 速度慢 | 需要精确控制 token |
| **MarkdownHeaderTextSplitter** | 标题 | 保持结构 | 只适用于 Markdown | Markdown 文档 |

---

## 4 Chunk 大小优化

### 4.1 Chunk 大小的影响

```python
# 测试不同 chunk_size
chunk_sizes = [100, 300, 500, 1000]

for size in chunk_sizes:
    splitter = RecursiveCharacterTextSplitter(chunk_size=size, chunk_overlap=50)
    texts = splitter.split_documents(docs)
    
    print(f"chunk_size={size}: {len(texts)} 个块")
    print(f"平均长度：{sum(len(t.page_content) for t in texts) / len(texts):.0f} 字符")
```

### 4.2 选择合适的 Chunk 大小

| Chunk 大小 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **100-200** | 检索精确 | 丢失上下文 | 问答系统 |
| **300-500** | 平衡精度和上下文 | - | 通用场景（推荐） |
| **500-1000** | 保持完整上下文 | 检索可能不精确 | 长文档摘要 |
| **1000+** | 完整段落 | 检索精度低 | 不推荐 |

### 4.3 Chunk Overlap 的作用

```python
# chunk_overlap 保持上下文连贯
text = "这是第一段。这是第二段。这是第三段。"

# 没有 overlap
splitter1 = RecursiveCharacterTextSplitter(chunk_size=10, chunk_overlap=0)
chunks1 = splitter1.split_text(text)
# 可能切断句子

# 有 overlap
splitter2 = RecursiveCharacterTextSplitter(chunk_size=10, chunk_overlap=3)
chunks2 = splitter2.split_text(text)
# 保持上下文连贯
```

> **原理**：overlap 让相邻的块有重叠部分，避免重要信息被切断。

---

## 5 元数据处理

### 5.1 保留元数据

```python
# 加载文档时保留元数据
loader = PyPDFLoader("document.pdf")
docs = loader.load()

# 每个 Document 都有 metadata
for doc in docs:
    print(f"来源：{doc.metadata['source']}")
    print(f"页码：{doc.metadata['page']}")
```

### 5.2 添加自定义元数据

```python
# 分割后添加元数据
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
texts = text_splitter.split_documents(docs)

# 添加自定义元数据
for text in texts:
    text.metadata["custom_field"] = "custom_value"
    text.metadata["chunk_id"] = hash(text.page_content)
```

### 5.3 使用元数据过滤

```python
# 在检索时使用元数据过滤
retriever = vector_db.as_retriever(
    search_kwargs={
        "k": 3,
        "filter": {"source": "document.pdf"}  # 只检索特定文档
    }
)
```

---

## 6 完整示例

### 6.1 加载和分割 PDF 文档

```python
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 1. 加载 PDF
loader = PyPDFLoader("python_tutorial.pdf")
docs = loader.load()
print(f"加载了 {len(docs)} 页")

# 2. 分割文档
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", " ", ""]
)
texts = text_splitter.split_documents(docs)
print(f"分割成 {len(texts)} 个块")

# 3. 查看结果
for i, text in enumerate(texts[:3]):
    print(f"\n第 {i+1} 块：")
    print(f"长度：{len(text.page_content)} 字符")
    print(f"来源：{text.metadata['source']}")
    print(f"页码：{text.metadata['page']}")
    print(f"内容：{text.page_content[:100]}...")
```

### 6.2 批量加载多种格式

```python
from langchain.document_loaders import DirectoryLoader, PyPDFLoader, TextLoader

# 加载 PDF
pdf_loader = DirectoryLoader(
    "./documents",
    glob="**/*.pdf",
    loader_cls=PyPDFLoader
)
pdf_docs = pdf_loader.load()

# 加载文本
text_loader = DirectoryLoader(
    "./documents",
    glob="**/*.txt",
    loader_cls=TextLoader
)
text_docs = text_loader.load()

# 合并
all_docs = pdf_docs + text_docs
print(f"总共加载了 {len(all_docs)} 个文档")

# 分割
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
texts = text_splitter.split_documents(all_docs)
print(f"分割成 {len(texts)} 个块")
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **文档加载器** | 把不同格式的文档转换成 Document 对象 |
| **文本分割器** | 把长文档切成合适的小段 |
| **chunk_size** | 每个块的最大字符数，影响检索精度 |
| **chunk_overlap** | 块之间的重叠字符数，保持上下文 |
| **元数据** | 记录文档来源、页码等信息 |

---

## 8 新手常见误区

### 误区 1："chunk_size 越大越好"

**错！** chunk_size 太大会降低检索精度。

正确做法：根据场景选择，通常 300-500 字符。

### 误区 2："不需要 chunk_overlap"

**错！** 没有 overlap 会切断句子和上下文。

正确做法：设置 chunk_overlap 为 chunk_size 的 10-20%。

### 误区 3："不保留元数据"

**错！** 元数据可以追溯来源，支持过滤。

正确做法：保留并添加有用的元数据。

### 误区 4："所有文档用同一种分割器"

**错！** 不同文档类型适合不同的分割器。

正确做法：
- 普通文本 → RecursiveCharacterTextSplitter
- Markdown → MarkdownHeaderTextSplitter
- 需要精确控制 token → TokenTextSplitter

---

## 9 动手练习

### 练习 1：基础练习

**题目**：加载一个 PDF 文档并分割。

<details>
<summary>点击查看答案</summary>

```python
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 加载 PDF
loader = PyPDFLoader("document.pdf")
docs = loader.load()

# 分割
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
texts = splitter.split_documents(docs)

print(f"加载了 {len(docs)} 页")
print(f"分割成 {len(texts)} 个块")
```

</details>

### 练习 2：进阶练习

**题目**：批量加载多种格式的文档。

<details>
<summary>点击查看答案</summary>

```python
from langchain.document_loaders import DirectoryLoader, PyPDFLoader, TextLoader

# 加载 PDF
pdf_loader = DirectoryLoader(
    "./documents",
    glob="**/*.pdf",
    loader_cls=PyPDFLoader
)
pdf_docs = pdf_loader.load()

# 加载文本
text_loader = DirectoryLoader(
    "./documents",
    glob="**/*.txt",
    loader_cls=TextLoader
)
text_docs = text_loader.load()

# 合并
all_docs = pdf_docs + text_docs
print(f"总共加载了 {len(all_docs)} 个文档")
```

</details>

### 练习 3（挑战）：综合练习

**题目**：实现一个文档加载和分割的工具类。

<details>
<summary>点击查看答案</summary>

```python
from langchain.document_loaders import PyPDFLoader, TextLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List
from langchain.schema import Document

class DocumentProcessor:
    def __init__(self, chunk_size=500, chunk_overlap=50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
    
    def load_pdf(self, file_path: str) -> List[Document]:
        """加载 PDF"""
        loader = PyPDFLoader(file_path)
        return loader.load()
    
    def load_text(self, file_path: str) -> List[Document]:
        """加载文本"""
        loader = TextLoader(file_path, encoding="utf-8")
        return loader.load()
    
    def load_directory(self, dir_path: str, glob_pattern: str = "**/*.pdf") -> List[Document]:
        """加载目录"""
        loader = DirectoryLoader(
            dir_path,
            glob=glob_pattern,
            loader_cls=PyPDFLoader
        )
        return loader.load()
    
    def split(self, docs: List[Document]) -> List[Document]:
        """分割文档"""
        return self.splitter.split_documents(docs)
    
    def process(self, docs: List[Document]) -> List[Document]:
        """处理文档：加载 + 分割"""
        return self.split(docs)

# 使用
processor = DocumentProcessor(chunk_size=500, chunk_overlap=50)

# 加载 PDF
pdf_docs = processor.load_pdf("document.pdf")
texts = processor.process(pdf_docs)
print(f"处理了 {len(texts)} 个块")
```

</details>

---

## 下一章预告

下一章我们会学习 **Embedding 与向量数据库**——也就是如何把文本转成向量，以及如何存储和检索向量。你会学到 Embedding 模型的选择、向量数据库的对比、以及如何使用 FAISS 和 Chroma。
