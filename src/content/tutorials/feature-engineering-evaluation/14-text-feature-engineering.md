---
title: "第14章：特征工程实战：文本数据"
description: "文本预处理、词袋模型、TF-IDF、词嵌入、文本分类"
---

# 第14章：特征工程实战：文本数据

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 文本数据怎么转换为数值特征？
- 词袋模型和 TF-IDF 有什么区别？
- 什么是词嵌入？Word2Vec 是怎么工作的？
- 怎么做文本分类？

这一章就是为了解答这些问题。文本特征工程是 NLP 的基础，掌握它能让你处理各种文本任务。

---

## 1 为什么需要文本特征工程？

### 痛点分析

机器学习模型只能处理数值，但现实中有大量文本数据（评论、邮件、文章等）。我们需要把文本转换为模型能理解的数值向量。

> **一句话总结**：文本特征工程就是把"文字"翻译成"数字"的过程。

---

## 2 核心原理

### 文本特征化方法对比

| 方法 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 词袋模型 | 统计词频 | 简单 | 忽略词序，高维稀疏 |
| TF-IDF | 词频-逆文档频率 | 考虑词的重要性 | 仍忽略词序 |
| N-gram | 考虑词的组合 | 捕捉局部词序 | 维度爆炸 |
| 词嵌入 | 稠密向量表示 | 捕捉语义 | 需要训练或预训练 |

---

## 3 基础用法

### 文本预处理

```python
import re
import jieba

# 示例文本
texts = [
    "机器学习是人工智能的一个分支！",
    "深度学习在图像识别中表现优秀。",
    "自然语言处理让计算机能理解人类语言。"
]

def preprocess_text(text):
    """文本预处理函数"""
    # 1. 转小写（英文）
    text = text.lower()
    
    # 2. 去除特殊字符和标点
    text = re.sub(r'[^\w\s]', '', text)
    
    # 3. 中文分词
    words = jieba.lcut(text)
    
    # 4. 去除停用词（简化版）
    stopwords = {'是', '的', '在', '中', '让', '能', '一个', '分支'}
    words = [w for w in words if w not in stopwords and len(w) > 1]
    
    return ' '.join(words)

# 预处理
processed_texts = [preprocess_text(text) for text in texts]
for i, (original, processed) in enumerate(zip(texts, processed_texts)):
    print(f"原文 {i+1}: {original}")
    print(f"处理后: {processed}\n")
```

### 词袋模型（CountVectorizer）

```python
from sklearn.feature_extraction.text import CountVectorizer

# 英文示例
corpus = [
    'This is the first document.',
    'This document is the second document.',
    'And this is the third one.',
    'Is this the first document?'
]

# 创建词袋模型
vectorizer = CountVectorizer()
X_count = vectorizer.fit_transform(corpus)

# 查看结果
print("词汇表:", vectorizer.get_feature_names_out())
print("\n词频矩阵:")
print(X_count.toarray())

# 中文示例
corpus_zh = ['机器学习 是 人工智能 分支',
             '深度学习 在 图像识别 表现 优秀',
             '自然语言 处理 让 计算机 理解 语言']

vectorizer_zh = CountVectorizer()
X_count_zh = vectorizer_zh.fit_transform(corpus_zh)
print("\n中文词汇表:", vectorizer_zh.get_feature_names_out())
print("中文词频矩阵:\n", X_count_zh.toarray())
```

> **原理**：词袋模型统计每个词在文档中出现的次数，忽略词序和语法。

### TF-IDF

```python
from sklearn.feature_extraction.text import TfidfVectorizer

# TF-IDF：考虑词频和逆文档频率
tfidf = TfidfVectorizer()
X_tfidf = tfidf.fit_transform(corpus)

print("TF-IDF 矩阵:")
print(X_tfidf.toarray().round(3))

# TF = 词频（Term Frequency）
# IDF = log(总文档数 / 包含该词的文档数)
# TF-IDF = TF × IDF
```

> **原理**：TF-IDF 降低常见词（如"的""是"）的权重，提升稀有词（如"机器学习"）的权重。

---

## 4 进阶用法

### N-gram 模型

```python
# 使用 bigram 捕捉词的组合
vectorizer_bigram = CountVectorizer(ngram_range=(1, 2))
X_bigram = vectorizer_bigram.fit_transform(corpus)

print("N-gram 词汇表:", vectorizer_bigram.get_feature_names_out()[:10])
print(f"特征维度: {X_bigram.shape[1]}")
```

### 文本分类实战

```python
from sklearn.datasets import fetch_20newsgroups
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report

# 加载数据
categories = ['alt.atheism', 'soc.religion.christian', 'comp.graphics', 'sci.med']
data = fetch_20newsgroups(subset='all', categories=categories, random_state=42)
X_text = data.data
y = data.target

print(f"数据量: {len(X_text)}")

# 创建 Pipeline
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000)),
    ('classifier', LogisticRegression(max_iter=1000, random_state=42))
])

# 交叉验证
scores = cross_val_score(pipeline, X_text, y, cv=5, scoring='accuracy')
print(f"\n交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")

# 训练并评估
X_train, X_test, y_train, y_test = train_test_split(X_text, y, test_size=0.2, random_state=42)
pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)
print("\n分类报告:")
print(classification_report(y_test, y_pred, target_names=[data.target_names[i] for i in range(len(categories))]))
```

### 词嵌入（Word2Vec）

```python
# pip install gensim
from gensim.models import Word2Vec
import numpy as np

# 准备语料
sentences = [text.split() for text in processed_texts]

# 训练 Word2Vec
model = Word2Vec(sentences, vector_size=50, window=3, min_count=1, workers=4)

# 查看词向量
print("词向量维度:", model.wv['机器学习'].shape)
print("\n相似的词:", model.wv.most_similar('机器学习', topn=3))

# 文档向量：词向量平均
def get_doc_vector(text, model):
    words = text.split()
    vectors = [model.wv[w] for w in words if w in model.wv]
    if vectors:
        return np.mean(vectors, axis=0)
    else:
        return np.zeros(model.vector_size)

doc_vectors = np.array([get_doc_vector(text, model) for text in processed_texts])
print(f"\n文档向量形状: {doc_vectors.shape}")
```

> **原理**：Word2Vec 将词映射到稠密向量空间，语义相似的词在向量空间中距离近。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 文本预处理 | 分词、去停用词、去标点 |
| 词袋模型 | 统计词频，简单但高维稀疏 |
| TF-IDF | 考虑词的重要性，效果优于词袋 |
| N-gram | 捕捉词的组合，增加维度 |
| 词嵌入 | 稠密向量，捕捉语义 |

---

## 6 新手常见误区

### 误区 1："不做预处理直接特征化"

**错！** 标点、停用词会引入噪声，影响模型效果。

正确做法：先做预处理（分词、去停用词、去标点），再特征化。

### 误区 2："词袋模型就够了"

不对。词袋模型忽略词序，无法捕捉"不"等否定词的作用。TF-IDF 或词嵌入效果更好。

正确做法：简单任务用 TF-IDF，复杂任务用词嵌入。

### 误区 3："中文不需要分词"

不是的。中文没有空格分隔，必须分词才能提取词级特征。

正确做法：使用 jieba 等工具做中文分词。

---

## 7 动手练习

### 练习 1：基础练习

对给定的中文文本做预处理，并用 CountVectorizer 提取特征。

<details>
<summary>点击查看答案</summary>

```python
import jieba
from sklearn.feature_extraction.text import CountVectorizer

texts = [
    "我喜欢机器学习和深度学习",
    "自然语言处理很有趣",
    "机器学习在图像识别中应用广泛"
]

# 分词
texts_segmented = [' '.join(jieba.lcut(text)) for text in texts]

# 特征化
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts_segmented)

print("词汇表:", vectorizer.get_feature_names_out())
print("词频矩阵:\n", X.toarray())
```

</details>

### 练习 2：进阶练习

使用 TF-IDF 和逻辑回归做 20 个新闻组的文本分类。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score

# 加载数据
data = fetch_20newsgroups(subset='all', random_state=42)
X, y = data.data, data.target

# Pipeline
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english', max_features=10000)),
    ('clf', LogisticRegression(max_iter=1000))
])

# 交叉验证
scores = cross_val_score(pipeline, X, y, cv=3, scoring='accuracy')
print(f"准确率: {scores.mean():.4f}")
```

</details>

### 练习 3（挑战）：综合练习

比较词袋模型、TF-IDF、N-gram 在文本分类任务上的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score

# 加载数据
data = fetch_20newsgroups(subset='all', categories=['alt.atheism', 'comp.graphics'], random_state=42)
X, y = data.data, data.target

# 不同特征化方法
methods = {
    '词袋模型': CountVectorizer(stop_words='english'),
    'TF-IDF': TfidfVectorizer(stop_words='english'),
    'N-gram': CountVectorizer(stop_words='english', ngram_range=(1, 2))
}

for name, vectorizer in methods.items():
    pipeline = Pipeline([
        ('vec', vectorizer),
        ('clf', LogisticRegression(max_iter=1000))
    ])
    scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')
    print(f"{name}: {scores.mean():.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **特征工程实战：时间序列**——如何从时间数据中提取有用的特征。
