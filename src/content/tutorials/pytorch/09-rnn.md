---
title: "第9章：循环神经网络（RNN）"
description: "掌握 RNN、LSTM、GRU 原理，实现序列数据处理"
---

# 第9章：循环神经网络（RNN）

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是循环神经网络？为什么需要它？
- RNN 和 CNN 有什么区别？
- LSTM 和 GRU 是什么？为什么要用它们？
- 如何处理序列数据？

这一章就是为了解答这些问题。RNN 是处理序列数据（文本、时间序列、语音）的核心技术。

---

## 1 为什么需要 RNN？

### 痛点分析

想象一下你要理解一句话：

**用全连接网络**：每个词独立处理，无法理解上下文关系。

**用 RNN**：像人一样，记住前面的信息，结合上下文理解。

### 序列数据的特点

```
"我 喜欢 深度 学习"
 ↓    ↓     ↓     ↓
词1  词2   词3   词4

问题：理解"学习"需要知道前面是"深度"
```

> **一句话总结**：RNN 有记忆能力，能处理序列数据。

---

## 2 核心原理

### RNN 结构

打个比方：

> RNN 像读书，每读一个词，都会结合之前的理解，更新对整句话的理解。

### RNN vs 全连接

| 特性 | 全连接 | RNN |
| --- | --- | --- |
| 输入 | 固定长度 | 可变长度序列 |
| 记忆 | 无 | 有隐藏状态 |
| 参数共享 | 层间独立 | 时间步共享 |
| 适用场景 | 图像分类 | 文本、时间序列 |

---

## 3 基础 RNN

### 基本实现

```python
import torch
import torch.nn as nn

# 定义 RNN
rnn = nn.RNN(
    input_size=10,  # 输入特征维度
    hidden_size=20,  # 隐藏层维度
    num_layers=1,  # RNN 层数
    batch_first=True  # 输入格式 [batch, seq, feature]
)

# 输入：批次 32，序列长度 5，特征 10
x = torch.randn(32, 5, 10)

# 前向传播
output, hidden = rnn(x)

print(f"输出形状: {output.shape}")  # [32, 5, 20]
print(f"隐藏状态形状: {hidden.shape}")  # [1, 32, 20]
```

### RNN 单元

```python
import torch
import torch.nn as nn

class SimpleRNN(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.hidden_size = hidden_size
        self.rnn = nn.RNN(input_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        # x: [batch, seq, input_size]
        output, hidden = self.rnn(x)
        # 取最后一个时间步的输出
        last_output = output[:, -1, :]
        # 分类
        prediction = self.fc(last_output)
        return prediction

# 创建模型
model = SimpleRNN(input_size=10, hidden_size=20, output_size=5)

# 测试
x = torch.randn(32, 5, 10)
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 5]
```

---

## 4 LSTM（长短期记忆网络）

### LSTM 原理

LSTM 解决了 RNN 的梯度消失问题，通过门控机制控制信息的保留和遗忘：

- **遗忘门**：决定丢弃哪些信息
- **输入门**：决定存储哪些新信息
- **输出门**：决定输出哪些信息

### LSTM 实现

```python
import torch
import torch.nn as nn

class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, output_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(
            embedding_dim,
            hidden_dim,
            num_layers=2,
            batch_first=True,
            dropout=0.5
        )
        self.fc = nn.Linear(hidden_dim, output_dim)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        # x: [batch, seq_len]
        embedded = self.dropout(self.embedding(x))
        # embedded: [batch, seq_len, embedding_dim]

        output, (hidden, cell) = self.lstm(embedded)
        # output: [batch, seq_len, hidden_dim]
        # hidden: [num_layers, batch, hidden_dim]

        # 取最后一个隐藏状态
        last_hidden = hidden[-1]
        last_hidden = self.dropout(last_hidden)

        # 分类
        prediction = self.fc(last_hidden)
        return prediction

# 创建模型
vocab_size = 10000  # 词汇表大小
embedding_dim = 100  # 词向量维度
hidden_dim = 256  # 隐藏层维度
output_dim = 2  # 二分类

model = LSTMClassifier(vocab_size, embedding_dim, hidden_dim, output_dim)

# 测试
x = torch.randint(0, vocab_size, (32, 50))  # 批次 32，序列长度 50
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 2]
```

---

## 5 GRU（门控循环单元）

### GRU vs LSTM

| 特性 | LSTM | GRU |
| --- | --- | --- |
| 门数量 | 3 个（遗忘、输入、输出） | 2 个（更新、重置） |
| 参数数量 | 多 | 少 |
| 训练速度 | 慢 | 快 |
| 性能 | 略好 | 相当 |

### GRU 实现

```python
import torch
import torch.nn as nn

class GRUClassifier(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.gru = nn.GRU(
            input_size,
            hidden_size,
            num_layers=2,
            batch_first=True,
            dropout=0.5
        )
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        output, hidden = self.gru(x)
        last_hidden = hidden[-1]
        prediction = self.fc(last_hidden)
        return prediction

# 创建模型
model = GRUClassifier(input_size=100, hidden_size=128, output_size=10)

# 测试
x = torch.randn(32, 20, 100)  # 批次 32，序列 20，特征 100
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 10]
```

---

## 6 RNN 实战：文本分类

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# 1. 准备数据
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

# 模拟数据
texts = ["this is great", "terrible movie", "love it", "bad film"] * 100
labels = [1, 0, 1, 0] * 100

# 构建词汇表
vocab = {"<pad>": 0, "<unk>": 1}
for text in texts:
    for word in text.split():
        if word not in vocab:
            vocab[word] = len(vocab)

# 创建数据集
dataset = TextDataset(texts, labels, vocab)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

# 2. 定义模型
class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, output_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        embedded = self.embedding(x)
        output, (hidden, cell) = self.lstm(embedded)
        last_hidden = hidden[-1]
        return self.fc(last_hidden)

# 3. 训练配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = TextClassifier(len(vocab), 50, 64, 2).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 4. 训练
num_epochs = 10
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

    print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {total_loss/len(dataloader):.4f}, Acc: {100.*correct/total:.2f}%")
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| RNN | 基础循环网络，有梯度消失问题 |
| LSTM | 长短期记忆，解决梯度消失 |
| GRU | 门控循环单元，LSTM 的简化版 |
| 序列处理 | 处理变长序列数据 |
| 文本分类 | RNN 的典型应用 |

---

## 8 新手常见误区

### 误区 1："RNN 可以处理长序列"

**错！** 基础 RNN 有梯度消失问题，难以处理长序列。

正确做法：使用 LSTM 或 GRU。

### 误区 2："LSTM 比 GRU 一定更好"

不是的。两者性能相当，GRU 参数更少，训练更快。

正确做法：根据任务尝试两种模型。

### 误区 3："忘记处理变长序列"

实际上序列长度不一，需要填充或截断。

正确做法：使用 padding 和 mask 处理变长序列。

---

## 9 动手练习

### 练习 1：基础练习

创建一个简单的 RNN，用于处理长度为 10 的序列，输入特征维度为 5，隐藏层维度为 20。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class SimpleRNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.rnn = nn.RNN(
            input_size=5,
            hidden_size=20,
            num_layers=1,
            batch_first=True
        )
        self.fc = nn.Linear(20, 3)  # 输出 3 个类别

    def forward(self, x):
        output, hidden = self.rnn(x)
        last_output = output[:, -1, :]
        return self.fc(last_output)

model = SimpleRNN()
x = torch.randn(32, 10, 5)  # 批次 32，序列 10，特征 5
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 3]
```

</details>

### 练习 2：进阶练习

创建一个 LSTM 模型，用于二分类任务，包含 Embedding 层和 Dropout。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embedding_dim,
            hidden_dim,
            num_layers=2,
            batch_first=True,
            dropout=0.5
        )
        self.dropout = nn.Dropout(0.5)
        self.fc = nn.Linear(hidden_dim, 2)

    def forward(self, x):
        embedded = self.dropout(self.embedding(x))
        output, (hidden, cell) = self.lstm(embedded)
        last_hidden = self.dropout(hidden[-1])
        return self.fc(last_hidden)

model = LSTMClassifier(vocab_size=5000, embedding_dim=100, hidden_dim=128)
x = torch.randint(0, 5000, (32, 50))
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 2]
```

</details>

### 练习 3（挑战）：综合练习

实现一个完整的 LSTM 文本分类训练流程。

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
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, output_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        embedded = self.dropout(self.embedding(x))
        output, (hidden, cell) = self.lstm(embedded)
        last_hidden = self.dropout(hidden[-1])
        return self.fc(last_hidden)

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
model = LSTMClassifier(len(vocab), 50, 64, 2).to(device)
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

下一章我们会学习 **生成对抗网络（GAN）**——生成模型的核心技术。你会学到 GAN 的原理，以及如何生成逼真的图像。