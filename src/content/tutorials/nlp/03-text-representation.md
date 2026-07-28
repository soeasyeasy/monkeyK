---
title: "第3章：文本表示方法"
description: "词袋模型、TF-IDF、N-gram、文本向量化"
---

# 第3章：文本表示方法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 计算机只能处理数字，文本怎么变成数字？
- 词袋模型是什么？为什么叫"袋"？
- TF-IDF 有什么用？和词频有什么区别？
- N-gram 是怎么捕捉上下文信息的？

这一章就是为了解答这些问题。我们会从最基础的 **文本向量化** 开始，逐步学习各种文本表示方法。

---

## 1 为什么需要文本表示？

### 痛点分析

计算机只能处理数字，不能直接理解文字。你给它一句话"我喜欢猫"，它完全不知道这是什么意思。

**没有文本表示的世界**：
- 机器学习模型无法处理文本数据
- 无法计算两段文本的相似度
- 无法对文本进行分类、聚类等操作

### 解决方案

文本表示就是 **把文本转换成数值向量**，让计算机能"看懂"文字。

打个比方：

> 文本表示就像给每个词发一个"身份证号"。有了这个号码，计算机就能识别、比较、处理这些词了。不同的表示方法，就像是不同的编码规则——有的简单但信息少，有的复杂但信息丰富。

> **一句话总结**：文本表示是 NLP 的"翻译官"，把人类语言翻译成计算机能懂的数字。

---

## 2 核心原理

### 2.1 词袋模型（Bag of Words）

**词袋模型** 是最简单的文本表示方法：统计每个词在文本中出现的次数。

```python
from sklearn.feature_extraction.text import CountVectorizer

# 定义两段文本
texts = [
    "我喜欢猫",
    "他喜欢狗",
    "我不喜欢猫"
]

# 创建词袋模型
vectorizer = CountVectorizer()

# 拟合并转换文本
X = vectorizer.fit_transform(texts)

# 查看词汇表
print(f"词汇表：{vectorizer.get_feature_names_out()}")
# 输出：['不喜欢' '喜欢' '我' '他' '猫' '狗']

# 查看向量表示
print(f"向量矩阵：\n{X.toarray()}")
# 输出：
# [[0 1 1 0 1 0]  # "我喜欢猫"
#  [0 1 0 1 0 1]  # "他喜欢狗"
#  [1 0 1 0 1 0]] # "我不喜欢猫"
```

**原理**：
- 先构建词汇表（所有出现过的词）
- 每段文本用一个向量表示，向量的每个维度对应一个词
- 向量的值是该词在文本中出现的次数

**缺点**：
- ❌ 丢失了词序信息（"我喜欢猫"和"猫喜欢我"的向量一样）
- ❌ 词汇表很大时，向量会非常稀疏
- ❌ 无法捕捉语义信息（"猫"和"狗"完全独立）

### 2.2 TF-IDF

**TF-IDF**（Term Frequency-Inverse Document Frequency）是对词袋模型的改进，考虑了词的重要性。

**核心思想**：
- **TF（词频）**：一个词在当前文本中出现的频率
- **IDF（逆文档频率）**：一个词在所有文本中出现的频率，越常见越不重要

```python
from sklearn.feature_extraction.text import TfidfVectorizer

# 定义多段文本
texts = [
    "自然语言处理是人工智能的重要方向",
    "机器学习是人工智能的子领域",
    "深度学习是机器学习的分支"
]

# 创建 TF-IDF 模型
vectorizer = TfidfVectorizer()

# 拟合并转换
X = vectorizer.fit_transform(texts)

# 查看词汇表和 TF-IDF 值
print(f"词汇表：{vectorizer.get_feature_names_out()}")
print(f"TF-IDF 矩阵：\n{X.toarray()}")
```

**公式**：
```
TF-IDF = TF × IDF

其中：
- TF = 词在文本中出现的次数 / 文本总词数
- IDF = log(总文本数 / 包含该词的文本数)
```

**优点**：
- ✅ 降低了常见词（如"的"、"是"）的权重
- ✅ 提高了稀有词（如"自然语言处理"）的权重
- ✅ 更适合文本分类、信息检索等任务

### 2.3 N-gram 模型

**N-gram** 是考虑词序信息的文本表示方法：把连续的 N 个词作为一个单元。

```python
from sklearn.feature_extraction.text import CountVectorizer

texts = ["我喜欢猫", "猫喜欢我"]

# 使用 2-gram（二元语法）
vectorizer = CountVectorizer(ngram_range=(2, 2))
X = vectorizer.fit_transform(texts)

print(f"词汇表：{vectorizer.get_feature_names_out()}")
# 输出：['喜欢猫' '我喜欢' '猫喜欢']

print(f"向量矩阵：\n{X.toarray()}")
# 输出：
# [[1 1 0]  # "我喜欢猫"：包含"喜欢猫"和"我喜欢"
#  [1 0 1]] # "猫喜欢我"：包含"喜欢猫"和"猫喜欢"
```

**原理**：
- **Unigram（一元）**：单个词，如"我"、"喜欢"、"猫"
- **Bigram（二元）**：连续两个词，如"我喜欢"、"喜欢猫"
- **Trigram（三元）**：连续三个词，如"我喜欢猫"

**优点**：
- ✅ 保留了部分词序信息
- ✅ 能捕捉局部上下文
- ✅ 适合短文本分类

**缺点**：
- ❌ 词汇表会急剧膨胀（N 越大，词汇表越大）
- ❌ 仍然无法捕捉长距离依赖

---

## 3 对比分析

| 方法 | 原理 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| **词袋模型** | 统计词频 | 简单、快速 | 丢失词序、稀疏 | 简单分类任务 |
| **TF-IDF** | 词频 × 逆文档频率 | 降低常见词权重 | 仍丢失词序 | 文本分类、信息检索 |
| **N-gram** | 连续 N 个词 | 保留部分词序 | 词汇表膨胀 | 短文本分类、语言模型 |

---

## 4 基础用法

### 4.1 使用 sklearn 进行文本向量化

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 定义文本
texts = [
    "自然语言处理是人工智能的重要方向",
    "机器学习是人工智能的子领域",
    "深度学习是机器学习的分支",
    "今天天气真好"
]

# 创建 TF-IDF 模型
vectorizer = TfidfVectorizer()

# 拟合并转换
X = vectorizer.fit_transform(texts)

# 计算文本相似度（余弦相似度）
similarity_matrix = cosine_similarity(X)

print("文本相似度矩阵：")
for i in range(len(texts)):
    for j in range(i+1, len(texts)):
        print(f"文本{i+1} vs 文本{j+1}: {similarity_matrix[i][j]:.4f}")
```

### 4.2 自定义预处理

```python
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer

def chinese_tokenizer(text):
    """中文分词器"""
    return jieba.lcut(text)

# 定义文本
texts = [
    "自然语言处理是人工智能的重要方向",
    "机器学习是人工智能的子领域"
]

# 创建 TF-IDF 模型，使用自定义分词器
vectorizer = TfidfVectorizer(tokenizer=chinese_tokenizer)

# 拟合并转换
X = vectorizer.fit_transform(texts)

print(f"词汇表：{vectorizer.get_feature_names_out()}")
print(f"TF-IDF 矩阵：\n{X.toarray()}")
```

### 4.3 文本分类实战

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# 训练数据
texts = [
    "这部电影太好看了",
    "剧情很精彩",
    "演员演技在线",
    "这部电影太烂了",
    "剧情拖沓",
    "演员演技尴尬"
]
labels = ["好评", "好评", "好评", "差评", "差评", "差评"]

# 创建管道：TF-IDF + 朴素贝叶斯
model = make_pipeline(TfidfVectorizer(), MultinomialNB())

# 训练模型
model.fit(texts, labels)

# 预测新文本
test_texts = ["这部电影真的很不错", "剧情太无聊了"]
predictions = model.predict(test_texts)

for text, label in zip(test_texts, predictions):
    print(f"'{text}' -> {label}")
```

---

## 5 进阶用法

### 5.1 处理稀疏矩阵

当词汇表很大时，矩阵会非常稀疏。可以使用稀疏矩阵存储：

```python
from sklearn.feature_extraction.text import TfidfVectorizer
import scipy.sparse

texts = ["文本1", "文本2", ...]  # 大量文本

vectorizer = TfidfVectorizer(max_features=10000)  # 限制词汇表大小
X = vectorizer.fit_transform(texts)

# X 是稀疏矩阵，占用内存小
print(f"矩阵形状：{X.shape}")
print(f"非零元素数量：{X.nnz}")
```

### 5.2 特征选择

选择最重要的特征，减少维度：

```python
from sklearn.feature_selection import SelectKBest, chi2

# 选择 Top 1000 个特征
selector = SelectKBest(chi2, k=1000)
X_selected = selector.fit_transform(X, y)
```

### 5.3 降维

使用 PCA 或 SVD 降维：

```python
from sklearn.decomposition import TruncatedSVD

# 降维到 100 维
svd = TruncatedSVD(n_components=100)
X_reduced = svd.fit_transform(X)
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **文本向量化** | 把文本转换成数值向量 |
| **词袋模型** | 统计词频，丢失词序 |
| **TF-IDF** | 考虑词的重要性，降低常见词权重 |
| **N-gram** | 保留部分词序信息 |
| **余弦相似度** | 计算文本相似度的常用方法 |

---

## 7 新手常见误区

### 误区 1："词袋模型能保留词序"

**错！** 词袋模型完全丢失了词序信息。"我喜欢猫"和"猫喜欢我"的向量是一样的。如果需要保留词序，要用 N-gram 或更高级的方法。

### 误区 2："TF-IDF 值越大，词越重要"

不一定。TF-IDF 值大，说明这个词在当前文本中重要，但在其他文本中不常见。但如果一个词在所有文本中都重要，TF-IDF 反而会降低它的权重。

### 误区 3："N-gram 的 N 越大越好"

**错！** N 越大，词汇表会急剧膨胀，导致稀疏性问题。一般用 2-gram 或 3-gram 就够了。

---

## 8 动手练习

### 练习 1：基础练习 - 词袋模型

**题目**：使用 CountVectorizer 对以下文本进行向量化，并打印词汇表和向量矩阵：
1. "我喜欢自然语言处理"
2. "他喜欢机器学习"
3. "自然语言处理很有趣"

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import CountVectorizer

texts = [
    "我喜欢自然语言处理",
    "他喜欢机器学习",
    "自然语言处理很有趣"
]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

print(f"词汇表：{vectorizer.get_feature_names_out()}")
print(f"向量矩阵：\n{X.toarray()}")
```

</details>

### 练习 2：进阶练习 - TF-IDF 文本相似度

**题目**：使用 TF-IDF 和余弦相似度，计算以下文本中哪两段最相似：
1. "自然语言处理是人工智能的重要方向"
2. "机器学习是人工智能的子领域"
3. "今天天气真好"

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

texts = [
    "自然语言处理是人工智能的重要方向",
    "机器学习是人工智能的子领域",
    "今天天气真好"
]

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)

similarity = cosine_similarity(X)
print("相似度矩阵：")
print(similarity)

# 找出最相似的两段
import numpy as np
np.fill_diagonal(similarity, 0)  # 对角线设为 0
max_idx = np.unravel_index(np.argmax(similarity), similarity.shape)
print(f"最相似的是文本{max_idx[0]+1}和文本{max_idx[1]+1}，相似度：{similarity[max_idx]:.4f}")
```

</details>

### 练习 3（挑战）：综合练习 - 文本分类器

**题目**：实现一个垃圾邮件分类器：
1. 准备训练数据（正常邮件和垃圾邮件）
2. 使用 TF-IDF + 朴素贝叶斯
3. 测试新邮件

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# 训练数据
texts = [
    "恭喜你中奖了，请点击链接领取",
    "免费赠送礼品，立即领取",
    "今晚一起吃饭吧",
    "明天开会的时间改了",
    "项目进度如何了",
    "您的账户异常，请立即验证"
]
labels = ["垃圾", "垃圾", "正常", "正常", "正常", "垃圾"]

# 创建模型
model = make_pipeline(TfidfVectorizer(), MultinomialNB())

# 训练
model.fit(texts, labels)

# 测试
test_texts = ["恭喜你获得大奖", "周末去爬山吗"]
predictions = model.predict(test_texts)

for text, label in zip(test_texts, predictions):
    print(f"'{text}' -> {label}")
```

</details>

---

## 下一章预告

下一章我们会学习 **词嵌入技术**——也就是如何把词转换成稠密的向量。你会学到 Word2Vec、GloVe、FastText 等经典方法。这些方法能捕捉词的语义信息，是现代 NLP 的基础。
