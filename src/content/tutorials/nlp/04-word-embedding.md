---
title: "第4章：词嵌入技术"
description: "Word2Vec、GloVe、FastText、词向量训练与可视化"
---

# 第4章：词嵌入技术

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 词嵌入是什么？和上一章的词袋模型有什么区别？
- 为什么词能用向量表示？向量里到底包含了什么信息？
- Word2Vec 是怎么训练出来的？CBOW 和 Skip-gram 有什么不同？
- 词向量能用来做什么？怎么可视化？

这一章就是为了解答这些问题。我们会从 **词嵌入的基本概念** 开始，逐步学习 Word2Vec、GloVe、FastText 等经典方法。

---

## 1 为什么需要词嵌入？

### 痛点分析

上一章我们学了词袋模型和 TF-IDF，它们有个共同问题：**向量太稀疏，无法捕捉词的语义**。

**词袋模型的问题**：
- "猫"和"狗"的向量完全独立，但它们在语义上很相似
- "高兴"和"开心"意思相近，但向量距离很远
- 向量维度等于词汇表大小，维度太高

### 解决方案

词嵌入（Word Embedding）就是 **把每个词映射成一个低维稠密向量**，让语义相近的词在向量空间中距离更近。

打个比方：

> 词嵌入就像给每个词分配一个"坐标"。在"动物世界"这个坐标系里，"猫"和"狗"的坐标很近，因为它们都是宠物；"猫"和"汽车"的坐标很远，因为它们毫无关系。词嵌入就是自动学习出这些坐标。

> **一句话总结**：词嵌入让词有了"语义坐标"，相近的词坐标相近。

---

## 2 核心原理

### 2.1 词嵌入的基本思想

**核心假设**：上下文相似的词，语义也相似。

这就是著名的 **分布式假设（Distributional Hypothesis）**：
> "You shall know a word by the company it keeps." —— J.R. Firth

意思是：看一个词周围出现的词，就能知道它的意思。

**例子**：
- "猫"和"狗"经常出现在相似的上下文中（"养___"、"___很可爱"）
- 所以它们的词向量应该很接近

### 2.2 Word2Vec

**Word2Vec** 是 2013 年 Google 提出的词嵌入方法，有两种训练方式：

#### CBOW（Continuous Bag of Words）

**任务**：根据上下文预测中心词。

```
上下文：[我, 喜欢, 吃] → 预测中心词：苹果
```

**原理**：
- 把上下文的词向量加起来
- 用神经网络预测中心词
- 训练完成后，隐藏层的权重就是词向量

#### Skip-gram

**任务**：根据中心词预测上下文。

```
中心词：苹果 → 预测上下文：[我, 喜欢, 吃]
```

**原理**：
- 用中心词的向量预测周围的词
- 训练完成后，输入层的权重就是词向量

**对比**：

| 方法 | 任务 | 适用场景 | 训练速度 |
| --- | --- | --- | --- |
| **CBOW** | 上下文 → 中心词 | 小数据集，平滑 | 快 |
| **Skip-gram** | 中心词 → 上下文 | 大数据集，稀有词 | 慢 |

### 2.3 GloVe

**GloVe**（Global Vectors）是 2014 年 Stanford 提出的方法，结合了全局统计和局部上下文。

**核心思想**：
- 先统计词共现矩阵（两个词一起出现的次数）
- 用矩阵分解得到词向量

**优点**：
- ✅ 利用了全局统计信息
- ✅ 训练速度快
- ✅ 对稀有词效果好

### 2.4 FastText

**FastText** 是 2016 年 Facebook 提出的方法，考虑了词的子词信息。

**核心思想**：
- 把词拆分成字符 n-gram（如"apple" → ["app", "ppl", "ple", ...]）
- 词向量是子词向量的和

**优点**：
- ✅ 能处理未登录词（OOV）
- ✅ 对形态丰富的语言（如法语、德语）效果好
- ✅ 中文也能用（按字符拆分）

---

## 3 对比分析

| 方法 | 原理 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| **Word2Vec** | 神经网络预测 | 简单快速，效果好 | 忽略子词信息 | 通用场景 |
| **GloVe** | 矩阵分解 | 利用全局统计 | 需要大内存 | 大数据集 |
| **FastText** | 子词信息 | 处理 OOV，多语言 | 向量维度高 | 多语言、形态丰富语言 |

---

## 4 基础用法

### 4.1 使用 Gensim 训练 Word2Vec

```python
from gensim.models import Word2Vec
import jieba

# 准备训练语料
sentences = [
    "自然语言处理是人工智能的重要方向",
    "机器学习是人工智能的子领域",
    "深度学习是机器学习的分支",
    "自然语言处理包括文本分类和情感分析",
    "机器学习算法可以从数据中学习"
]

# 中文分词
tokenized_sentences = [jieba.lcut(sent) for sent in sentences]

# 训练 Word2Vec 模型
# sg=0 表示 CBOW，sg=1 表示 Skip-gram
# vector_size 是向量维度
# window 是上下文窗口大小
# min_count 是最小词频
model = Word2Vec(
    sentences=tokenized_sentences,
    vector_size=100,  # 向量维度
    window=5,         # 上下文窗口
    min_count=1,      # 最小词频
    sg=0              # 0=CBOW, 1=Skip-gram
)

# 查看"自然语言处理"的词向量
word = "自然语言处理"
if word in model.wv:
    vector = model.wv[word]
    print(f"'{word}' 的词向量（前 10 维）：{vector[:10]}")

# 找出最相似的词
similar_words = model.wv.most_similar("机器学习", topn=5)
print(f"与'机器学习'最相似的词：{similar_words}")
```

### 4.2 词向量可视化

```python
from gensim.models import Word2Vec
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import jieba

# 训练模型（接上面的代码）
# ...

# 获取所有词向量
words = list(model.wv.key_to_index.keys())
vectors = [model.wv[w] for w in words]

# 用 PCA 降维到 2D
pca = PCA(n_components=2)
reduced_vectors = pca.fit_transform(vectors)

# 绘制散点图
plt.figure(figsize=(10, 8))
for i, word in enumerate(words):
    x, y = reduced_vectors[i]
    plt.scatter(x, y)
    plt.annotate(word, (x, y), fontsize=12)

plt.title("词向量可视化（PCA 降维）")
plt.xlabel("第一主成分")
plt.ylabel("第二主成分")
plt.show()
```

### 4.3 词向量运算

词向量有个神奇的性质：可以做加减法。

```python
from gensim.models import Word2Vec

# 假设已经训练好了模型
# model = Word2Vec(...)

# 经典的词向量类比：国王 - 男人 + 女人 = 女王
# 中文示例：男人 - 他 + 她 = ？
result = model.wv.most_similar(positive=["女人", "国王"], negative=["男人"], topn=1)
print(f"国王 - 男人 + 女人 = {result[0][0]}")

# 计算两个词的相似度
similarity = model.wv.similarity("猫", "狗")
print(f"'猫'和'狗'的相似度：{similarity:.4f}")
```

---

## 5 进阶用法

### 5.1 使用预训练词向量

训练词向量需要大量数据和时间，可以直接使用预训练的词向量：

```python
from gensim.models import KeyedVectors

# 加载预训练的中文词向量（腾讯 AI Lab）
# 下载地址：https://ai.tencent.com/ailab/nlp/en/embedding.html
# model = KeyedVectors.load_word2vec_format('Tencent_AILab_ChineseEmbedding.txt')

# 或者使用 smaller 版本
# model = KeyedVectors.load_word2vec_format('Tencent_AILab_ChineseEmbedding_small.txt')

# 使用示例
# vector = model["中国"]
# similar = model.most_similar("北京", topn=10)
```

### 5.2 FastText 使用

```python
from gensim.models import FastText
import jieba

# 准备数据
sentences = [jieba.lcut("自然语言处理是人工智能的重要方向")]

# 训练 FastText 模型
model = FastText(
    sentences=sentences,
    vector_size=100,
    window=5,
    min_count=1,
    sg=0,
    min_n=2,  # 子词最小长度
    max_n=4   # 子词最大长度
)

# FastText 可以处理未登录词
# 即使"量子计算"没在训练数据中出现过，也能得到向量
if "量子计算" in model.wv:
    vector = model.wv["量子计算"]
    print(f"'量子计算'的词向量：{vector[:10]}")
```

### 5.3 词向量在深度学习中的应用

```python
import torch
import torch.nn as nn
from gensim.models import Word2Vec

# 训练 Word2Vec
# model = Word2Vec(...)

# 提取词向量矩阵
vocab_size = len(model.wv.key_to_index)
embedding_dim = model.vector_size
embedding_matrix = torch.zeros(vocab_size, embedding_dim)

for word, idx in model.wv.key_to_index.items():
    embedding_matrix[idx] = torch.tensor(model.wv[word])

# 创建 Embedding 层
embedding_layer = nn.Embedding.from_pretrained(embedding_matrix)

# 使用示例
word_indices = torch.tensor([0, 1, 2])  # 词的索引
word_vectors = embedding_layer(word_indices)
print(f"词向量形状：{word_vectors.shape}")  # [3, embedding_dim]
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **词嵌入** | 把词映射成低维稠密向量 |
| **分布式假设** | 上下文相似的词，语义也相似 |
| **Word2Vec** | CBOW（上下文→中心词）和 Skip-gram（中心词→上下文） |
| **GloVe** | 基于全局词共现矩阵的分解 |
| **FastText** | 考虑子词信息，能处理 OOV |
| **词向量运算** | 支持类比、相似度计算等 |

---

## 7 新手常见误区

### 误区 1："词向量维度越高越好"

**错！** 维度太高会导致过拟合，训练时间也长。一般 100-300 维就够了。要根据任务和数据量选择合适的维度。

### 误区 2："Word2Vec 能处理所有词"

不是的。Word2Vec 无法处理未登录词（训练时没见过的词）。如果需要处理 OOV，要用 FastText 或字符级模型。

### 误区 3："词向量完全捕捉了语义"

**错！** 词向量只能捕捉词的语义，无法处理多义词（如"苹果"可以是水果，也可以是公司）。要处理多义词，要用上下文相关的词向量（如 BERT）。

### 误区 4："预训练词向量一定比自己训练的好"

不一定。预训练词向量是在通用语料上训练的，如果你的任务是特定领域（如医学、法律），自己训练的词向量可能更合适。

---

## 8 动手练习

### 练习 1：基础练习 - 训练 Word2Vec

**题目**：使用 Gensim 训练一个 Word2Vec 模型，要求：
1. 准备至少 10 句中文文本
2. 使用 CBOW 方法训练
3. 查看"人工智能"的词向量
4. 找出与"机器学习"最相似的 5 个词

<details>
<summary>点击查看答案</summary>

```python
from gensim.models import Word2Vec
import jieba

# 准备语料
sentences = [
    "人工智能是计算机科学的重要分支",
    "机器学习是人工智能的核心技术",
    "深度学习是机器学习的一个方向",
    "自然语言处理属于人工智能领域",
    "计算机视觉也是人工智能的应用",
    "人工智能技术正在改变世界",
    "机器学习算法可以从数据中学习",
    "深度学习模型需要大量数据",
    "神经网络是深度学习的基础",
    "人工智能应用非常广泛"
]

# 分词
tokenized = [jieba.lcut(sent) for sent in sentences]

# 训练 Word2Vec
model = Word2Vec(
    sentences=tokenized,
    vector_size=100,
    window=5,
    min_count=1,
    sg=0  # CBOW
)

# 查看词向量
word = "人工智能"
if word in model.wv:
    print(f"'{word}' 的词向量（前 10 维）：{model.wv[word][:10]}")

# 找出最相似的词
similar = model.wv.most_similar("机器学习", topn=5)
print(f"与'机器学习'最相似的词：{similar}")
```

</details>

### 练习 2：进阶练习 - 词向量可视化

**题目**：训练一个词向量模型，并用 PCA 降维到 2D，绘制词向量散点图。

<details>
<summary>点击查看答案</summary>

```python
from gensim.models import Word2Vec
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import jieba

# 准备语料和训练（接练习 1）
# ...

# 获取词和向量
words = list(model.wv.key_to_index.keys())
vectors = [model.wv[w] for w in words]

# PCA 降维
pca = PCA(n_components=2)
reduced = pca.fit_transform(vectors)

# 绘图
plt.figure(figsize=(12, 8))
for i, word in enumerate(words):
    x, y = reduced[i]
    plt.scatter(x, y, c='blue', alpha=0.6)
    plt.annotate(word, (x, y), fontsize=10)

plt.title("词向量可视化")
plt.xlabel("PC1")
plt.ylabel("PC2")
plt.grid(True, alpha=0.3)
plt.show()
```

</details>

### 练习 3（挑战）：综合练习 - 词向量类比

**题目**：实现一个词向量类比测试器，验证以下类比关系：
1. 男人 - 他 + 她 = 女人
2. 北京 - 中国 + 日本 = 东京
3. 猫 - 宠物 + 野生 = ？

<details>
<summary>点击查看答案</summary>

```python
from gensim.models import Word2Vec
import jieba

# 准备语料（需要包含相关词汇）
sentences = [
    "男人和女人是人类",
    "他是指男性，她是指女性",
    "北京是中国的首都",
    "东京是日本的首都",
    "中国位于亚洲",
    "日本也位于亚洲",
    "猫是常见的宠物",
    "狗也是宠物",
    "老虎是野生动物",
    "狮子也是野生动物"
]

# 训练模型
tokenized = [jieba.lcut(sent) for sent in sentences]
model = Word2Vec(sentences=tokenized, vector_size=100, window=5, min_count=1, sg=0)

# 类比测试
def analogy(word1, word2, word3):
    """
    类比：word1 - word2 + word3 = ?
    例如：男人 - 他 + 她 = ?
    """
    try:
        result = model.wv.most_similar(positive=[word3, word1], negative=[word2], topn=1)
        return result[0][0]
    except KeyError as e:
        return f"词 '{e}' 不在词汇表中"

# 测试
print(f"男人 - 他 + 她 = {analogy('男人', '他', '她')}")
print(f"北京 - 中国 + 日本 = {analogy('北京', '中国', '日本')}")
print(f"猫 - 宠物 + 野生 = {analogy('猫', '宠物', '野生')}")
```

</details>

---

## 下一章预告

下一章我们会学习 **语言模型基础**——也就是如何预测下一个词。你会学到 N-gram 语言模型、困惑度、平滑技术等概念。这些是理解现代大语言模型（如 GPT）的基础。
