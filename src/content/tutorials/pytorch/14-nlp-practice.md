---
title: "第14章：自然语言处理实战"
description: "掌握词嵌入、文本分类、序列标注、注意力机制，实现 NLP 应用"
---

# 第14章：自然语言处理实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是自然语言处理（NLP）？PyTorch 如何处理文本？
- 词嵌入是什么？为什么要用词向量？
- 如何实现文本分类任务？
- 注意力机制是什么？为什么它这么重要？

这一章就是为了解答这些问题。NLP 是深度学习的重要应用领域，在机器翻译、情感分析、问答系统等领域有广泛应用。

---

## 1 为什么需要 NLP？

### 痛点分析

想象一下你要分析用户评论：

**传统方法**：用关键词匹配，无法理解上下文和语义。

**NLP 方法**：用深度学习模型，能够理解语义、情感、意图。

### NLP 应用场景

```
文本分类：情感分析、垃圾邮件检测
序列标注：命名实体识别、词性标注
机器翻译：中译英、英译中
问答系统：智能客服、知识问答
文本生成：文章摘要、对话生成
```

> **一句话总结**：NLP 让计算机能够理解和处理人类语言。

---

## 2 核心原理

### 文本表示

打个比方：

> 计算机不认识文字，需要把文本转换成数字。词嵌入就像给每个词分配一个坐标，语义相近的词坐标也相近。

### NLP 处理流程

```
原始文本
    ↓
分词/Tokenization
    ↓
词嵌入（Word Embedding）
    ↓
神经网络（RNN/CNN/Transformer）
    ↓
输出（分类/序列标注/生成）
```

---

## 3 词嵌入（Word Embedding）

### 使用 nn.Embedding

```python
import torch
import torch.nn as nn

# 创建词嵌入层
vocab_size = 10000  # 词汇表大小
embedding_dim = 100  # 词向量维度

embedding = nn.Embedding(vocab_size, embedding_dim)

# 输入：词索引
word_indices = torch.tensor([1, 5, 10, 100])  # 4 个词

# 输出：词向量
word_vectors = embedding(word_indices)
print(f"输入形状: {word_indices.shape}")  # [4]
print(f"输出形状: {word_vectors.shape}")  # [4, 100]

# 批量输入
batch_indices = torch.tensor([[1, 5, 10], [2, 6, 11]])  # [2, 3]
batch_vectors = embedding(batch_indices)
print(f"批量输出形状: {batch_vectors.shape}")  # [2, 3, 100]
```

### 预训练词向量

```python
import torch
import torch.nn as nn

# 加载预训练词向量（如 GloVe）
# 假设已经加载到 embedding_matrix 中
vocab_size = 10000
embedding_dim = 300

# 创建嵌入层并加载预训练权重
embedding = nn.Embedding(vocab_size, embedding_dim)

# 假设 embedding_matrix 是预训练的权重矩阵
# embedding.weight.data.copy_(embedding_matrix)

# 冻结词嵌入（不更新预训练权重）
embedding.weight.requires_grad = False
```

---

## 4 文本分类

### 基于 LSTM 的文本分类

```python
import torch
import torch.nn as nn

class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, num_classes):
        super().__init__()

        # 词嵌入层
        self.embedding = nn.Embedding(vocab_size, embedding_dim)

        # LSTM 层
        self.lstm = nn.LSTM(
            embedding_dim,
            hidden_dim,
            num_layers=2,
            batch_first=True,
            dropout=0.5,
            bidirectional=True  # 双向 LSTM
        )

        # 全连接层
        self.fc = nn.Linear(hidden_dim * 2, num_classes)  # *2 因为是双向
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        # x: [batch_size, seq_len]

        # 词嵌入
        embedded = self.embedding(x)  # [batch, seq_len, embedding_dim]

        # LSTM
        output, (hidden, cell) = self.lstm(embedded)
        # output: [batch, seq_len, hidden_dim*2]
        # hidden: [num_layers*2, batch, hidden_dim]

        # 取最后一个时间步的输出
        # 拼接前向和后向的最后一个隐藏状态
        hidden_forward = hidden[-2]  # [batch, hidden_dim]
        hidden_backward = hidden[-1]  # [batch, hidden_dim]
        hidden_cat = torch.cat([hidden_forward, hidden_backward], dim=1)  # [batch, hidden_dim*2]

        # 分类
        hidden_cat = self.dropout(hidden_cat)
        logits = self.fc(hidden_cat)  # [batch, num_classes]

        return logits

# 测试
vocab_size = 10000
embedding_dim = 100
hidden_dim = 128
num_classes = 2

model = TextClassifier(vocab_size, embedding_dim, hidden_dim, num_classes)

# 输入：批次 32，序列长度 50
x = torch.randint(0, vocab_size, (32, 50))
output = model(x)
print(f"输入形状: {x.shape}")  # [32, 50]
print(f"输出形状: {output.shape}")  # [32, 2]
```

---

## 5 序列标注

### 命名实体识别（NER）

```python
import torch
import torch.nn as nn

class NERModel(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, num_tags):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(
            embedding_dim,
            hidden_dim,
            num_layers=2,
            batch_first=True,
            bidirectional=True
        )
        self.fc = nn.Linear(hidden_dim * 2, num_tags)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        # x: [batch, seq_len]

        embedded = self.embedding(x)
        output, _ = self.lstm(embedded)
        output = self.dropout(output)
        logits = self.fc(output)  # [batch, seq_len, num_tags]

        return logits

# 测试
vocab_size = 10000
embedding_dim = 100
hidden_dim = 128
num_tags = 9  # B-PER, I-PER, B-LOC, I-LOC, B-ORG, I-ORG, O 等

model = NERModel(vocab_size, embedding_dim, hidden_dim, num_tags)

x = torch.randint(0, vocab_size, (32, 50))
output = model(x)
print(f"输入形状: {x.shape}")  # [32, 50]
print(f"输出形状: {output.shape}")  # [32, 50, 9]
```

---

## 6 注意力机制

### 自注意力（Self-Attention）

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SelfAttention(nn.Module):
    def __init__(self, embedding_dim, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = embedding_dim // num_heads

        self.query = nn.Linear(embedding_dim, embedding_dim)
        self.key = nn.Linear(embedding_dim, embedding_dim)
        self.value = nn.Linear(embedding_dim, embedding_dim)

        self.fc_out = nn.Linear(embedding_dim, embedding_dim)

    def forward(self, x):
        # x: [batch, seq_len, embedding_dim]
        batch_size = x.shape[0]

        # 计算 Q, K, V
        Q = self.query(x)  # [batch, seq_len, embedding_dim]
        K = self.key(x)
        V = self.value(x)

        # 分割成多个头
        Q = Q.view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        K = K.view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        V = V.view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        # Q, K, V: [batch, num_heads, seq_len, head_dim]

        # 计算注意力分数
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.head_dim ** 0.5)
        # scores: [batch, num_heads, seq_len, seq_len]

        # Softmax 归一化
        attention = F.softmax(scores, dim=-1)

        # 加权求和
        context = torch.matmul(attention, V)
        # context: [batch, num_heads, seq_len, head_dim]

        # 拼接多头
        context = context.transpose(1, 2).contiguous().view(batch_size, -1, self.num_heads * self.head_dim)
        # context: [batch, seq_len, embedding_dim]

        # 输出层
        output = self.fc_out(context)

        return output, attention

# 测试
embedding_dim = 256
num_heads = 8

attention = SelfAttention(embedding_dim, num_heads)
x = torch.randn(32, 50, embedding_dim)  # [batch, seq_len, embedding_dim]
output, attn_weights = attention(x)
print(f"输入形状: {x.shape}")  # [32, 50, 256]
print(f"输出形状: {output.shape}")  # [32, 50, 256]
print(f"注意力权重形状: {attn_weights.shape}")  # [32, 8, 50, 50]
```

---

## 7 Transformer 简介

### Transformer 架构

```python
import torch
import torch.nn as nn

class TransformerEncoder(nn.Module):
    def __init__(self, embedding_dim, num_heads, ff_dim, dropout=0.1):
        super().__init__()

        self.attention = nn.MultiheadAttention(embedding_dim, num_heads, dropout=dropout)
        self.norm1 = nn.LayerNorm(embedding_dim)
        self.norm2 = nn.LayerNorm(embedding_dim)

        self.ffn = nn.Sequential(
            nn.Linear(embedding_dim, ff_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embedding_dim)
        )

        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        # x: [seq_len, batch, embedding_dim]

        # 自注意力
        attn_output, _ = self.attention(x, x, x)
        x = self.norm1(x + self.dropout(attn_output))

        # 前馈网络
        ff_output = self.ffn(x)
        x = self.norm2(x + self.dropout(ff_output))

        return x

# 测试
embedding_dim = 256
num_heads = 8
ff_dim = 512

encoder = TransformerEncoder(embedding_dim, num_heads, ff_dim)
x = torch.randn(50, 32, embedding_dim)  # [seq_len, batch, embedding_dim]
output = encoder(x)
print(f"输入形状: {x.shape}")
print(f"输出形状: {output.shape}")
```

---

## 8 文本分类实战

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# 1. 数据集
class TextDataset(Dataset):
    def __init__(self, texts, labels, vocab, max_len=50):
        self.texts = texts
        self.labels = labels
        self.vocab = vocab
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        # 文本转索引
        indices = [self.vocab.get(word, 0) for word in text.split()]

        # 填充/截断
        if len(indices) < self.max_len:
            indices = indices + [0] * (self.max_len - len(indices))
        else:
            indices = indices[:self.max_len]

        return torch.tensor(indices), torch.tensor(label)

# 2. 模型
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embedding_dim, hidden_dim,
            num_layers=2, batch_first=True,
            bidirectional=True, dropout=0.5
        )
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        embedded = self.embedding(x)
        output, (hidden, _) = self.lstm(embedded)
        hidden = torch.cat([hidden[-2], hidden[-1]], dim=1)
        hidden = self.dropout(hidden)
        return self.fc(hidden)

# 3. 训练
texts = ["this movie is great", "terrible film", "love it", "bad movie"] * 100
labels = [1, 0, 1, 0] * 100

vocab = {"<pad>": 0, "<unk>": 1}
for text in texts:
    for word in text.split():
        if word not in vocab:
            vocab[word] = len(vocab)

dataset = TextDataset(texts, labels, vocab)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = LSTMClassifier(len(vocab), 100, 128, 2).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

num_epochs = 20
for epoch in range(num_epochs):
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for batch_x, batch_y in dataloader:
        batch_x, batch_y = batch_x.to(device), batch_y.to(device)

        optimizer.zero_grad()
        outputs = model(batch_x)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        _, predicted = outputs.max(1)
        total += batch_y.size(0)
        correct += predicted.eq(batch_y).sum().item()

    if (epoch + 1) % 5 == 0:
        print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {total_loss/len(dataloader):.4f}, Acc: {100.*correct/total:.2f}%")
```

---

## 9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 词嵌入 | 将词映射到向量空间 |
| 文本分类 | 整段文本的类别预测 |
| 序列标注 | 每个词的类别预测 |
| 注意力机制 | 动态关注重要部分 |
| Transformer | 基于注意力的架构 |

---

## 10 新手常见误区

### 误区 1："词嵌入是固定不变的"

**错！** 词嵌入可以在训练过程中更新，学习任务特定的语义。

正确做法：根据任务需求选择是否冻结词嵌入。

### 误区 2："RNN 是处理文本的唯一选择"

不是的。CNN、Transformer 也可以处理文本，且 Transformer 效果更好。

正确做法：根据任务选择合适的模型架构。

### 误区 3："注意力机制只在 Transformer 中使用"

实际上注意力机制可以用于各种模型，增强对重要信息的关注。

正确做法：理解注意力机制的原理，灵活应用。

---

## 11 动手练习

### 练习 1：基础练习

实现一个简单的词嵌入层，将词索引转换为词向量。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

# 创建词嵌入层
vocab_size = 5000
embedding_dim = 100

embedding = nn.Embedding(vocab_size, embedding_dim)

# 输入：批次 16，序列长度 20
word_indices = torch.randint(0, vocab_size, (16, 20))

# 输出词向量
word_vectors = embedding(word_indices)

print(f"输入形状: {word_indices.shape}")  # [16, 20]
print(f"输出形状: {word_vectors.shape}")  # [16, 20, 100]

# 查看单个词的向量
single_word = torch.tensor([100])
single_vector = embedding(single_word)
print(f"单个词向量形状: {single_vector.shape}")  # [1, 100]
```

</details>

### 练习 2：进阶练习

实现一个双向 LSTM 文本分类模型。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class BiLSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embedding_dim, hidden_dim,
            num_layers=2, batch_first=True,
            bidirectional=True, dropout=0.5
        )
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        embedded = self.dropout(self.embedding(x))
        output, (hidden, _) = self.lstm(embedded)
        # 拼接前向和后向的最后一个隐藏状态
        hidden_forward = hidden[-2]
        hidden_backward = hidden[-1]
        hidden_cat = torch.cat([hidden_forward, hidden_backward], dim=1)
        hidden_cat = self.dropout(hidden_cat)
        return self.fc(hidden_cat)

# 测试
model = BiLSTMClassifier(vocab_size=10000, embedding_dim=100, hidden_dim=128, num_classes=2)
x = torch.randint(0, 10000, (32, 50))
output = model(x)
print(f"输入形状: {x.shape}")  # [32, 50]
print(f"输出形状: {output.shape}")  # [32, 2]
```

</details>

### 练习 3（挑战）：综合练习

实现完整的文本分类训练流程，包括数据准备、模型训练和评估。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# 1. 数据集
class TextDataset(Dataset):
    def __init__(self, texts, labels, vocab, max_len=30):
        self.texts = texts
        self.labels = labels
        self.vocab = vocab
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        indices = [self.vocab.get(word, 1) for word in text.split()]

        if len(indices) < self.max_len:
            indices = indices + [0] * (self.max_len - len(indices))
        else:
            indices = indices[:self.max_len]

        return torch.tensor(indices), torch.tensor(label)

# 2. 模型
class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embedding_dim, hidden_dim,
            num_layers=2, batch_first=True,
            bidirectional=True, dropout=0.5
        )
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        embedded = self.dropout(self.embedding(x))
        _, (hidden, _) = self.lstm(embedded)
        hidden = torch.cat([hidden[-2], hidden[-1]], dim=1)
        hidden = self.dropout(hidden)
        return self.fc(hidden)

# 3. 训练
texts = ["good movie", "bad film", "love it", "hate it"] * 100
labels = [1, 0, 1, 0] * 100

vocab = {"<pad>": 0, "<unk>": 1}
for text in texts:
    for word in text.split():
        if word not in vocab:
            vocab[word] = len(vocab)

dataset = TextDataset(texts, labels, vocab)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = TextClassifier(len(vocab), 50, 64, 2).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

num_epochs = 20
for epoch in range(num_epochs):
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for batch_x, batch_y in dataloader:
        batch_x, batch_y = batch_x.to(device), batch_y.to(device)

        optimizer.zero_grad()
        outputs = model(batch_x)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        _, predicted = outputs.max(1)
        total += batch_y.size(0)
        correct += predicted.eq(batch_y).sum().item()

    if (epoch + 1) % 5 == 0:
        print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {total_loss/len(dataloader):.4f}, Acc: {100.*correct/total:.2f}%")
```

</details>

---

## 下一章预告

下一章我们会学习 **模型部署与优化**——如何将训练好的模型部署到生产环境。你会学到模型导出、ONNX 格式、TorchScript、GPU 优化和模型量化等技术。