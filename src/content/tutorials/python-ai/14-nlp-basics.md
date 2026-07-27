---
title: "第14章：自然语言处理基础"
description: "文本预处理、词向量、文本分类、情感分析"
---

# 第14章：自然语言处理基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是自然语言处理（NLP）？
- 计算机如何理解人类语言？
- 什么是词向量（Word Embedding）？
- 如何实现文本分类和情感分析？

这一章就是为了解答这些问题。NLP 是让计算机理解和处理人类语言的技术，广泛应用于搜索引擎、智能客服、机器翻译等领域。

---

## 1 为什么需要 NLP？

### 痛点分析

计算机只能处理数字，但人类使用文本：

```python
# ❌ 问题：计算机不懂文本
text = "这部电影太好看了"
# 计算机看到的是字符编码，不理解含义

# 需要把文本转换为数字
# "这部电影太好看了" → [0.2, 0.8, 0.5, ...]
```

```python
# ✅ NLP：让计算机理解文本
# 文本预处理 → 特征提取 → 模型训练
# 实现文本分类、情感分析、机器翻译等
```

> **一句话总结**：NLP 是计算机理解人类语言的桥梁。

### 生活化类比

打个比方：

> NLP 就像给计算机请了一个翻译。
> 把人类的语言翻译成计算机能懂的数字。

---

## 2 文本预处理

### 分词

中文需要分词，英文按空格分词：

```python
import jieba

# 中文分词
text = "我今天去北京旅游"
words = jieba.lcut(text)
print(words)  # ['我', '今天', '去', '北京', '旅游']

# 英文分词
text_en = "I love machine learning"
words_en = text_en.split()
print(words_en)  # ['I', 'love', 'machine', 'learning']
```

### 去除停用词

停用词是没有实际意义的词（的、了、是、在...）：

```python
# 停用词表
stopwords = {'的', '了', '是', '在', '我', '有', '和', '就'}

# 过滤停用词
filtered_words = [w for w in words if w not in stopwords]
print(filtered_words)  # ['今天', '去', '北京', '旅游']
```

### 词干提取和词形还原

```python
from nltk.stem import PorterStemmer
from nltk.stem import WordNetLemmatizer

# 词干提取（粗暴）
stemmer = PorterStemmer()
print(stemmer.stem('running'))  # run
print(stemmer.stem('better'))   # better（不准确）

# 词形还原（智能）
lemmatizer = WordNetLemmatizer()
print(lemmatizer.lemmatize('running', pos='v'))  # run
print(lemmatizer.lemmatize('better', pos='a'))   # good
```

---

## 3 文本表示方法

### 词袋模型（Bag of Words）

把文本表示为词频向量：

```python
from sklearn.feature_extraction.text import CountVectorizer

# 语料库
corpus = [
    '我喜欢机器学习',
    '机器学习很有趣',
    '我喜欢深度学习'
]

# 创建词袋模型
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(corpus)

# 查看词汇表
print(vectorizer.get_feature_names_out())
# ['深度学习' '机器学习' '喜欢' '有趣' '我']

# 查看向量
print(X.toarray())
# [[0 1 1 0 1]   # 我 喜欢 机器学习
#  [0 1 0 1 0]   # 机器学习 有趣
#  [1 0 1 0 1]]  # 我 喜欢 深度学习
```

### TF-IDF

考虑词的重要性：

```python
from sklearn.feature_extraction.text import TfidfVectorizer

# 创建 TF-IDF 模型
vectorizer = TfidfVectorizer()
X_tfidf = vectorizer.fit_transform(corpus)

print(X_tfidf.toarray())
# TF-IDF 会降低常见词的权重，提高稀有词的权重
```

### Word2Vec 词向量

把词表示为稠密向量，捕捉语义关系：

```python
from gensim.models import Word2Vec

# 训练语料
sentences = [
    ['我', '喜欢', '机器学习'],
    ['机器学习', '很', '有趣'],
    ['深度', '学习', '是', '机器学习', '的', '分支']
]

# 训练 Word2Vec 模型
model = Word2Vec(sentences, vector_size=100, window=5, min_count=1)

# 查看词向量
print(model.wv['机器学习'])  # 100维向量

# 计算词相似度
print(model.wv.similarity('机器学习', '深度学习'))  # 相似度高
print(model.wv.similarity('机器学习', '苹果'))      # 相似度低
```

---

## 4 文本分类

### 传统方法：朴素贝叶斯

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# 训练数据
texts = [
    '这部电影太好看了',
    '剧情很精彩',
    '演员演技在线',
    '太糟糕了',
    '浪费时间',
    '不好看'
]
labels = ['正面', '正面', '正面', '负面', '负面', '负面']

# 创建管道
model = make_pipeline(TfidfVectorizer(), MultinomialNB())

# 训练
model.fit(texts, labels)

# 预测
test_texts = ['这部电影很不错', '剧情太烂了']
predictions = model.predict(test_texts)
print(predictions)  # ['正面' '负面']
```

### 深度学习方法：LSTM

```python
import torch
import torch.nn as nn

class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, num_classes)
    
    def forward(self, x):
        x = self.embedding(x)
        _, (h_n, _) = self.lstm(x)
        out = self.fc(h_n[-1])
        return out

# 使用
model = TextClassifier(vocab_size=10000, embed_dim=100, hidden_dim=128, num_classes=2)
```

---

## 5 情感分析实战

### 完整流程

```python
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import jieba

# 1. 数据准备
train_data = [
    ('这部电影太好看了', 1),
    ('剧情很精彩，推荐', 1),
    ('演员演技在线', 1),
    ('太糟糕了，失望', 0),
    ('浪费时间，不好看', 0),
    ('剧情太烂了', 0)
]

# 2. 文本预处理
def tokenize(text):
    return list(jieba.cut(text))

# 3. 构建词汇表
vocab = {'<pad>': 0, '<unk>': 1}
for text, _ in train_data:
    for word in tokenize(text):
        if word not in vocab:
            vocab[word] = len(vocab)

# 4. 文本转数字
def text_to_indices(text, vocab):
    return [vocab.get(w, vocab['<unk>']) for w in tokenize(text)]

# 5. 创建数据集
class SentimentDataset(Dataset):
    def __init__(self, data, vocab):
        self.data = data
        self.vocab = vocab
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        text, label = self.data[idx]
        indices = text_to_indices(text, self.vocab)
        return torch.tensor(indices), torch.tensor(label)

dataset = SentimentDataset(train_data, vocab)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 6. 定义模型
class SentimentLSTM(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 1)
    
    def forward(self, x):
        x = self.embedding(x)
        _, (h_n, _) = self.lstm(x)
        out = torch.sigmoid(self.fc(h_n[-1]))
        return out

model = SentimentLSTM(len(vocab), 50, 64)

# 7. 训练
criterion = nn.BCELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

for epoch in range(10):
    for texts, labels in dataloader:
        optimizer.zero_grad()
        outputs = model(texts.float()).squeeze()
        loss = criterion(outputs, labels.float())
        loss.backward()
        optimizer.step()
    
    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")

# 8. 预测
def predict_sentiment(text, model, vocab):
    model.eval()
    with torch.no_grad():
        indices = torch.tensor([text_to_indices(text, vocab)])
        output = model(indices.float())
        return '正面' if output.item() > 0.5 else '负面'

print(predict_sentiment('这部电影很好看', model, vocab))
```

---

## 6 预训练模型：BERT

### 概念解释

BERT 是 Google 提出的预训练语言模型：

```
BERT 特点：
- 双向 Transformer 编码器
- 在大规模语料上预训练
- 可以微调用于各种 NLP 任务
```

### 使用 BERT

```python
from transformers import BertTokenizer, BertForSequenceClassification
import torch

# 加载预训练模型和分词器
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForSequenceClassification.from_pretrained('bert-base-chinese', num_labels=2)

# 文本编码
text = "这部电影太好看了"
inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)

# 预测
outputs = model(**inputs)
logits = outputs.logits
prediction = torch.argmax(logits, dim=1)
print("预测结果:", prediction.item())
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 分词 | 中文需要分词，英文按空格 |
| 停用词 | 去除无意义的词 |
| 词袋模型 | 文本表示为词频向量 |
| TF-IDF | 考虑词的重要性 |
| Word2Vec | 词向量，捕捉语义 |
| BERT | 预训练语言模型 |

---

## 8 新手常见误区

### 误区 1："中文不需要分词"

**错！** 中文必须分词：

```python
# ❌ 错误：直接用字符
text = "我喜欢机器学习"
chars = list(text)  # ['我', '喜', '欢', '机', '器', '学', '习']

# ✅ 正确：用分词工具
words = jieba.lcut(text)  # ['我', '喜欢', '机器学习']
```

### 误区 2："词袋模型足够好"

不是的。词袋模型丢失了词序信息：

```python
# 词袋模型无法区分
"狗咬人" 和 "人咬狗"
# 词袋表示相同，但含义完全不同
```

### 误区 3："预训练模型不需要微调"

预训练模型需要针对任务微调：

```python
# ❌ 错误：直接用预训练模型
model = BertModel.from_pretrained('bert-base-chinese')

# ✅ 正确：微调用于特定任务
model = BertForSequenceClassification.from_pretrained('bert-base-chinese')
model.train()  # 微调
```

---

## 9 动手练习

### 练习 1：基础练习

用 jieba 对以下句子进行分词，并去除停用词。

```python
text = "我今天在北京学习机器学习"
stopwords = {'我', '今天', '在', '学习'}
```

<details>
<summary>点击查看答案</summary>

```python
import jieba

text = "我今天在北京学习机器学习"
stopwords = {'我', '今天', '在', '学习'}

# 分词
words = jieba.lcut(text)
print("分词结果:", words)

# 去除停用词
filtered = [w for w in words if w not in stopwords]
print("过滤后:", filtered)
# ['北京', '机器学习']
```

</details>

### 练习 2：进阶练习

用 TF-IDF 和朴素贝叶斯实现一个简单的文本分类器。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# 训练数据
texts = [
    '这个产品很好用',
    '质量非常不错',
    '推荐购买',
    '太差了，退货',
    '质量很差',
    '不推荐'
]
labels = ['正面', '正面', '正面', '负面', '负面', '负面']

# 创建管道
model = make_pipeline(TfidfVectorizer(), MultinomialNB())

# 训练
model.fit(texts, labels)

# 预测
test = ['这个产品不错', '质量太差了']
print(model.predict(test))  # ['正面' '负面']
```

</details>

### 练习 3（挑战）：综合练习

用 Word2Vec 训练词向量，并计算词语相似度。

<details>
<summary>点击查看答案</summary>

```python
from gensim.models import Word2Vec

# 训练语料
sentences = [
    ['我', '喜欢', '机器学习'],
    ['机器学习', '很', '有趣'],
    ['深度', '学习', '是', '机器学习', '的', '分支'],
    ['自然语言处理', '也', '很', '有趣']
]

# 训练 Word2Vec
model = Word2Vec(sentences, vector_size=50, window=3, min_count=1)

# 计算相似度
print("机器学习 vs 深度学习:", model.wv.similarity('机器学习', '深度'))
print("机器学习 vs 苹果:", model.wv.similarity('机器学习', '苹果'))

# 找最相似的词
print("与'机器学习'最相似的词:", model.wv.most_similar('机器学习'))
```

</details>

---

## 下一章预告

下一章我们会学习 **模型部署与应用**——如何保存模型、用 Flask 构建 API、ONNX 格式转换，让模型真正上线服务。
