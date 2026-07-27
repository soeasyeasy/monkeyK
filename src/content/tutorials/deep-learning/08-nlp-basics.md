---
title: "第8章：自然语言处理基础"
description: "掌握 NLP 核心技术，包括词嵌入、Word2Vec、文本预处理和语言模型"
---

# 第8章：自然语言处理基础

## 本章导读

在学习 NLP 之前，你可能会有这些疑问：

- 计算机如何理解人类语言？
- 什么是词嵌入？它和独热编码有什么区别？
- Word2Vec 是如何工作的？
- 如何对文本进行预处理？

这一章会带你入门自然语言处理，掌握文本表示和预处理的核心技术。

---

## 1 为什么需要 NLP？

### 文本数据的挑战

文本是非结构化数据，计算机无法直接理解：

```
"这部电影非常好看"  →  计算机看到的是什么？
```

**解决方案**：将文本转换为数值表示

### NLP 的应用场景

| 应用 | 说明 |
|-----|------|
| 机器翻译 | 中文 → 英文 |
| 情感分析 | 判断评论是正面还是负面 |
| 文本分类 | 新闻分类、垃圾邮件检测 |
| 问答系统 | 智能客服 |
| 文本生成 | ChatGPT、文章写作 |
| 命名实体识别 | 识别人名、地名、机构名 |

---

## 2 文本预处理

### 2.1 分词

中文需要分词，英文按空格分割：

```python
import jieba

# 中文分词
text = "我爱自然语言处理"
words = jieba.lcut(text)
print(f"分词结果: {words}")  # ['我', '爱', '自然语言', '处理']

# 英文分词
text_en = "I love natural language processing"
words_en = text_en.split()
print(f"英文分词: {words_en}")
```

### 2.2 去除停用词

停用词是对语义贡献较小的词（如"的"、"了"、"是"）：

```python
# 常见停用词
stop_words = set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个'])

def remove_stopwords(words, stop_words):
    return [w for w in words if w not in stop_words]

words = ['我', '爱', '自然语言', '处理', '技术']
filtered = remove_stopwords(words, stop_words)
print(f"过滤后: {filtered}")  # ['爱', '自然语言', '处理', '技术']
```

### 2.3 文本清洗

```python
import re

def clean_text(text):
    # 去除 HTML 标签
    text = re.sub(r'<[^>]+>', '', text)
    # 去除特殊字符
    text = re.sub(r'[^\w\s]', '', text)
    # 去除多余空格
    text = re.sub(r'\s+', ' ', text).strip()
    # 转小写（英文）
    text = text.lower()
    return text

raw_text = "  <p>Hello World!!!</p>  This is a test...  "
cleaned = clean_text(raw_text)
print(f"清洗后: '{cleaned}'")
```

---

## 3 文本表示方法

### 3.1 独热编码（One-Hot）

每个词用一个唯一的向量表示：

```python
# 词汇表
vocab = ['我', '爱', '自然语言', '处理', '技术']

# 独热编码
one_hot = {
    '我':       [1, 0, 0, 0, 0],
    '爱':       [0, 1, 0, 0, 0],
    '自然语言': [0, 0, 1, 0, 0],
    '处理':     [0, 0, 0, 1, 0],
    '技术':     [0, 0, 0, 0, 1],
}

print(f"'爱'的独热编码: {one_hot['爱']}")
```

**问题**：
- 向量维度 = 词汇表大小，高维稀疏
- 无法表达词与词之间的相似性

### 3.2 词袋模型（Bag of Words）

将文本表示为词频向量：

```python
from collections import Counter

# 词汇表
vocab = {'我': 0, '爱': 1, '自然语言': 2, '处理': 3, '技术': 4}

def bow(text, vocab):
    words = jieba.lcut(text)
    vector = [0] * len(vocab)
    for word in words:
        if word in vocab:
            vector[vocab[word]] += 1
    return vector

text1 = "我爱自然语言处理"
text2 = "我爱技术"

print(f"文本1: {bow(text1, vocab)}")  # [1, 1, 1, 1, 0]
print(f"文本2: {bow(text2, vocab)}")  # [1, 1, 0, 0, 1]
```

**问题**：忽略了词序信息

### 3.3 TF-IDF

考虑词频和逆文档频率：

```python
from sklearn.feature_extraction.text import TfidfVectorizer

# 语料库
corpus = [
    '我爱自然语言处理',
    '我爱技术',
    '自然语言处理很有趣'
]

# 中文需要先分词
corpus_tokenized = [' '.join(jieba.lcut(text)) for text in corpus]

# TF-IDF 向量化
vectorizer = TfidfVectorizer()
tfidf_matrix = vectorizer.fit_transform(corpus_tokenized)

print(f"词汇表: {vectorizer.get_feature_names_out()}")
print(f"TF-IDF 矩阵:\n{tfidf_matrix.toarray()}")
```

---

## 4 词嵌入（Word Embedding）

### 什么是词嵌入？

词嵌入将每个词映射为一个低维稠密向量，能够捕捉语义信息。

打个比方：

> 独热编码像给每个词一个身份证号，彼此之间没有关联。词嵌入像给每个词一个"性格档案"，语义相近的词在向量空间中距离更近。

### 词嵌入的特点

```
国王 - 男人 + 女人 ≈ 女王
北京 - 中国 + 日本 ≈ 东京
```

### PyTorch 中的词嵌入

```python
import torch
import torch.nn as nn

# 创建嵌入层
# num_embeddings: 词汇表大小
# embedding_dim: 嵌入向量维度
embedding = nn.Embedding(num_embeddings=10000, embedding_dim=128, padding_idx=0)

# 输入：词的索引
word_ids = torch.tensor([1, 5, 10, 20])  # 4 个词

# 获取嵌入向量
vectors = embedding(word_ids)
print(f"输入形状: {word_ids.shape}")      # (4,)
print(f"输出形状: {vectors.shape}")       # (4, 128)
print(f"向量示例: {vectors[0][:5]}")      # 前 5 个维度
```

### 批量输入

```python
# 批量输入：(batch_size, seq_len)
batch_word_ids = torch.tensor([
    [1, 5, 10, 20, 0],   # 样本 1
    [3, 8, 15, 7, 12],   # 样本 2
])

vectors = embedding(batch_word_ids)
print(f"批量输出形状: {vectors.shape}")  # (2, 5, 128)
```

---

## 5 Word2Vec

### Word2Vec 简介

Word2Vec 是 Google 在 2013 年提出的词嵌入方法，有两种训练方式：

1. **CBOW**（Continuous Bag of Words）：用上下文预测中心词
2. **Skip-gram**：用中心词预测上下文

### CBOW 原理

```
上下文: [我, 爱, 处理]  →  预测中心词: 自然语言

输入层（独热）→ 投影层（求平均）→ 输出层（Softmax）
```

### Skip-gram 原理

```
中心词: 自然语言  →  预测上下文: [我, 爱, 处理]

输入层（独热）→ 投影层 → 输出层（Softmax）
```

### 使用 Gensim 训练 Word2Vec

```python
from gensim.models import Word2Vec

# 准备语料
sentences = [
    ['我', '爱', '自然语言', '处理'],
    ['自然语言', '处理', '很', '有趣'],
    ['我', '爱', '深度', '学习'],
    ['深度', '学习', '是', '人工智能', '的', '分支'],
]

# 训练 Word2Vec 模型
model = Word2Vec(
    sentences,
    vector_size=100,     # 嵌入维度
    window=5,            # 上下文窗口大小
    min_count=1,         # 最小词频
    sg=0                 # 0=CBOW, 1=Skip-gram
)

# 查看词的向量
print(f"'自然语言'的向量: {model.wv['自然语言'][:10]}")

# 计算词相似度
similarity = model.wv.similarity('自然语言', '深度')
print(f"'自然语言'和'深度'的相似度: {similarity:.4f}")

# 找最相似的词
similar = model.wv.most_similar('自然语言', topn=5)
print(f"与'自然语言'最相似的词: {similar}")
```

---

## 6 语言模型

### 什么是语言模型？

语言模型计算一个句子出现的概率：

```
P("我爱自然语言处理") = P("我") × P("爱"|"我") × P("自然语言"|"我爱") × ...
```

### N-gram 语言模型

```python
from collections import Counter, defaultdict

# 构建 bigram 语言模型
text = "我爱自然语言处理自然语言处理很有趣"
words = list(jieba.lcut(text))

# 统计 bigram 频率
bigrams = Counter(zip(words[:-1], words[1:]))
unigrams = Counter(words)

# 计算条件概率
def bigram_prob(w1, w2):
    return bigrams[(w1, w2)] / unigrams[w1]

print(f"P('爱'|'我') = {bigram_prob('我', '爱'):.4f}")
print(f"P('自然语言'|'爱') = {bigram_prob('爱', '自然语言'):.4f}")
```

### 神经语言模型

使用神经网络预测下一个词：

```python
import torch
import torch.nn as nn

class NeuralLM(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim):
        super(NeuralLM, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, vocab_size)
    
    def forward(self, x):
        # x: (batch, seq_len)
        embedded = self.embedding(x)
        output, _ = self.lstm(embedded)
        logits = self.fc(output)
        return logits

# 训练数据：将文本转换为词索引
vocab = {'<pad>': 0, '我': 1, '爱': 2, '自然语言': 3, '处理': 4, '很': 5, '有趣': 6}
vocab_size = len(vocab)

# 构建训练样本
text_ids = [1, 2, 3, 4, 3, 4, 5, 6]  # 我爱自然语言处理自然语言处理很有趣

# 输入：前 n 个词，标签：下一个词
X = []
y = []
context_len = 3
for i in range(len(text_ids) - context_len):
    X.append(text_ids[i:i+context_len])
    y.append(text_ids[i+context_len])

X = torch.tensor(X)
y = torch.tensor(y)

# 创建模型
model = NeuralLM(vocab_size, embed_dim=32, hidden_dim=64)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

# 训练
for epoch in range(100):
    logits = model(X)
    loss = criterion(logits[:, -1, :], y)  # 只取最后一个时间步
    
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    
    if (epoch + 1) % 20 == 0:
        print(f'Epoch [{epoch+1}/100], Loss: {loss.item():.4f}')
```

---

## 7 文本分类实战

### 完整流程

```python
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import jieba

# 1. 数据准备
train_texts = [
    "这部电影非常好看",
    "剧情很精彩，推荐",
    "太差了，浪费时间",
    "一般般，没什么感觉",
    "真的很棒，喜欢",
    "无聊透顶",
]
train_labels = [1, 1, 0, 0, 1, 0]  # 1=正面, 0=负面

# 2. 构建词汇表
def build_vocab(texts, min_freq=1):
    word_freq = Counter()
    for text in texts:
        words = jieba.lcut(text)
        word_freq.update(words)
    
    vocab = {'<pad>': 0, '<unk>': 1}
    for word, freq in word_freq.items():
        if freq >= min_freq:
            vocab[word] = len(vocab)
    return vocab

vocab = build_vocab(train_texts)
print(f"词汇表大小: {len(vocab)}")

# 3. 文本转索引
def text_to_ids(text, vocab, max_len=10):
    words = jieba.lcut(text)
    ids = [vocab.get(w, vocab['<unk>']) for w in words]
    # 填充或截断
    if len(ids) < max_len:
        ids += [vocab['<pad>']] * (max_len - len(ids))
    else:
        ids = ids[:max_len]
    return ids

# 4. 数据集
class TextDataset(Dataset):
    def __init__(self, texts, labels, vocab, max_len=10):
        self.data = []
        for text, label in zip(texts, labels):
            ids = text_to_ids(text, vocab, max_len)
            self.data.append((torch.tensor(ids), torch.tensor(label)))
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        return self.data[idx]

dataset = TextDataset(train_texts, train_labels, vocab)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 5. 模型
class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_classes):
        super(TextCNN, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.conv1 = nn.Conv1d(embed_dim, 64, kernel_size=3, padding=1)
        self.conv2 = nn.Conv1d(embed_dim, 64, kernel_size=4, padding=1)
        self.conv3 = nn.Conv1d(embed_dim, 64, kernel_size=5, padding=1)
        self.fc = nn.Linear(64 * 3, num_classes)
        self.dropout = nn.Dropout(0.5)
    
    def forward(self, x):
        embedded = self.embedding(x)  # (batch, seq_len, embed_dim)
        embedded = embedded.permute(0, 2, 1)  # (batch, embed_dim, seq_len)
        
        c1 = torch.relu(self.conv1(embedded))
        c2 = torch.relu(self.conv2(embedded))
        c3 = torch.relu(self.conv3(embedded))
        
        c1 = torch.max_pool1d(c1, c1.size(2)).squeeze(2)
        c2 = torch.max_pool1d(c2, c2.size(2)).squeeze(2)
        c3 = torch.max_pool1d(c3, c3.size(2)).squeeze(2)
        
        out = torch.cat([c1, c2, c3], dim=1)
        out = self.dropout(out)
        out = self.fc(out)
        return out

model = TextCNN(len(vocab), embed_dim=64, num_classes=2)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

# 6. 训练
epochs = 50
for epoch in range(epochs):
    total_loss = 0
    correct = 0
    total = 0
    
    for X_batch, y_batch in dataloader:
        outputs = model(X_batch)
        loss = criterion(outputs, y_batch)
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        _, predicted = outputs.max(1)
        total += y_batch.size(0)
        correct += predicted.eq(y_batch).sum().item()
    
    if (epoch + 1) % 10 == 0:
        print(f'Epoch [{epoch+1}/{epochs}], Loss: {total_loss/len(dataloader):.4f}, Acc: {correct/total:.2%}')

# 7. 测试
def predict(text, model, vocab, max_len=10):
    model.eval()
    ids = text_to_ids(text, vocab, max_len)
    with torch.no_grad():
        output = model(torch.tensor([ids]))
        pred = output.argmax(1).item()
    return "正面" if pred == 1 else "负面"

test_texts = ["这部电影很好看", "太差了不推荐", "剧情精彩"]
for text in test_texts:
    print(f"'{text}' → {predict(text, model, vocab)}")
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 分词 | 中文 NLP 的第一步，将句子切分为词语 |
| 停用词 | 对语义贡献较小的词，通常去除 |
| 独热编码 | 高维稀疏，无法表达语义相似性 |
| 词袋模型 | 忽略词序，只考虑词频 |
| TF-IDF | 考虑词频和逆文档频率 |
| 词嵌入 | 低维稠密向量，捕捉语义信息 |
| Word2Vec | CBOW 和 Skip-gram 两种训练方式 |
| 语言模型 | 计算句子概率，预测下一个词 |

---

## 9 新手常见误区

### 误区 1："中文不需要分词"

中文没有空格分隔词语，必须先分词才能进行后续处理。

### 误区 2："词嵌入维度越大越好"

维度过大会导致过拟合和计算开销增加。通常 100-300 维即可。

### 误区 3："预训练词嵌入一定比从头训练好"

如果任务领域与预训练语料差异很大，从头训练可能更好。

### 误区 4："文本越长效果越好"

过长的文本会增加计算开销，且可能引入噪声。需要截断或提取关键信息。

---

## 10 动手练习

### 练习 1：基础练习

实现一个简单的词频统计功能，统计文本中每个词出现的次数。

<details>
<summary>点击查看答案</summary>

```python
import jieba
from collections import Counter

def word_frequency(text):
    words = jieba.lcut(text)
    return Counter(words)

text = "我爱自然语言处理，自然语言处理很有趣"
freq = word_frequency(text)
print(f"词频统计: {freq}")
print(f"最常见的 3 个词: {freq.most_common(3)}")
```

</details>

### 练习 2：进阶练习

用 PyTorch 的 Embedding 层实现一个简单的词嵌入查询系统。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

# 构建词汇表
vocab = {'<pad>': 0, '我': 1, '爱': 2, '自然语言': 3, '处理': 4, '技术': 5}
vocab_size = len(vocab)
embed_dim = 50

# 创建嵌入层
embedding = nn.Embedding(vocab_size, embed_dim)

# 查询词的向量
def get_word_vector(word, vocab, embedding):
    word_id = vocab.get(word, 0)
    with torch.no_grad():
        vector = embedding(torch.tensor([word_id]))
    return vector.squeeze().numpy()

# 计算词相似度
def cosine_similarity(v1, v2):
    import numpy as np
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

# 测试
v1 = get_word_vector('自然语言', vocab, embedding)
v2 = get_word_vector('处理', vocab, embedding)
print(f"'自然语言'和'处理'的余弦相似度: {cosine_similarity(v1, v2):.4f}")
```

</details>

### 练习 3（挑战）：综合练习

实现一个简单的文本情感分类器，使用 LSTM 模型。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import jieba
from collections import Counter

# 训练数据
train_data = [
    ("这部电影非常好看，推荐", 1),
    ("剧情精彩，演员演技在线", 1),
    ("太差了，浪费时间和金钱", 0),
    ("无聊透顶，不推荐", 0),
    ("真的很棒，喜欢这个导演", 1),
    ("一般般，没什么特别的", 0),
    ("超级好看，百看不厌", 1),
    ("剧情拖沓，看不下去", 0),
]

# 构建词汇表
def build_vocab(data, min_freq=1):
    word_freq = Counter()
    for text, _ in data:
        words = jieba.lcut(text)
        word_freq.update(words)
    vocab = {'<pad>': 0, '<unk>': 1}
    for word, freq in word_freq.items():
        if freq >= min_freq:
            vocab[word] = len(vocab)
    return vocab

vocab = build_vocab(train_data)

# 文本转索引
def encode(text, vocab, max_len=15):
    words = jieba.lcut(text)
    ids = [vocab.get(w, vocab['<unk>']) for w in words]
    if len(ids) < max_len:
        ids += [vocab['<pad>']] * (max_len - len(ids))
    else:
        ids = ids[:max_len]
    return ids

# LSTM 分类模型
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(0.5)
    
    def forward(self, x):
        emb = self.dropout(self.embedding(x))
        _, (hidden, _) = self.lstm(emb)
        hidden = torch.cat((hidden[-2], hidden[-1]), dim=1)
        return self.fc(self.dropout(hidden))

# 训练
model = LSTMClassifier(len(vocab), 64, 128, 2)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

X = torch.tensor([encode(text, vocab) for text, _ in train_data])
y = torch.tensor([label for _, label in train_data])

for epoch in range(100):
    outputs = model(X)
    loss = criterion(outputs, y)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    
    if (epoch + 1) % 20 == 0:
        preds = outputs.argmax(1)
        acc = (preds == y).float().mean()
        print(f'Epoch {epoch+1}/100, Loss: {loss.item():.4f}, Acc: {acc:.2%}')

# 测试
def predict_sentiment(text):
    model.eval()
    ids = encode(text, vocab)
    with torch.no_grad():
        output = model(torch.tensor([ids]))
        pred = output.argmax(1).item()
    return "正面" if pred == 1 else "负面"

test_texts = ["这部电影很好看", "太差了不推荐", "剧情很精彩"]
for text in test_texts:
    print(f"'{text}' → {predict_sentiment(text)}")
```

</details>

---

## 下一章预告

下一章我们会学习生成对抗网络（GAN），这是一种能够生成逼真图像的深度学习模型。你会了解到生成器和判别器是如何对抗训练的。
