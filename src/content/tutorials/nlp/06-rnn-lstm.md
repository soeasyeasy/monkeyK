---
title: "第6章：序列模型 RNN 与 LSTM"
description: "RNN 原理、梯度消失、LSTM 结构、GRU、序列建模"
---

# 第6章：序列模型 RNN 与 LSTM

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 前面的 N-gram 模型只能看几个词，怎么处理长句子？
- RNN 是什么？为什么它能处理序列数据？
- 什么是梯度消失？为什么 RNN 会遇到这个问题？
- LSTM 和 GRU 是怎么解决 RNN 的问题的？

这一章就是为了解答这些问题。我们会从 **序列数据的挑战** 开始，逐步学习 RNN、LSTM、GRU 等序列模型。

---

## 1 为什么需要序列模型？

### 痛点分析

前面的 N-gram 模型有个致命问题：**只能看很短的上下文**。

**N-gram 的局限**：
- Bigram 只能看前 1 个词
- Trigram 只能看前 2 个词
- 但语言中经常需要长距离依赖

**例子**：
> "我出生在**法国**，在那里度过了童年，后来去了美国读书，现在我能说流利的**法语**。"

要理解最后的"法语"，需要记住最开始的"法国"。N-gram 模型做不到这一点。

### 解决方案

序列模型（如 RNN、LSTM）就是 **让模型拥有记忆，能记住之前的信息**。

打个比方：

> 序列模型就像一个读书的人。他一边读一边记笔记，读到后面的内容时，可以翻看前面的笔记。RNN 就是让模型有了"短期记忆"，能记住之前读过的内容。

> **一句话总结**：序列模型让 AI 有了"记忆"，能处理长距离依赖。

---

## 2 核心原理

### 2.1 循环神经网络（RNN）

**RNN（Recurrent Neural Network）** 是最基础的序列模型。

**核心思想**：在每个时间步，模型接收当前输入和上一步的隐藏状态，输出当前结果和新的隐藏状态。

```
h_t = f(W_hh * h_{t-1} + W_xh * x_t + b_h)
y_t = W_hy * h_t + b_y
```

其中：
- `x_t` 是当前输入
- `h_{t-1}` 是上一步的隐藏状态
- `h_t` 是当前隐藏状态
- `y_t` 是当前输出

**直观理解**：
- 隐藏状态 `h` 就像"记忆"
- 每一步都在更新记忆
- 最终的记忆包含了整个序列的信息

### 2.2 RNN 的问题：梯度消失

**问题**：当序列很长时，RNN 很难学到长距离依赖。

**原因**：反向传播时，梯度会不断相乘。如果梯度小于 1，连乘后会趋近于 0（梯度消失）；如果大于 1，会爆炸（梯度爆炸）。

**例子**：
> "这本书**非常**好，我**推荐**给大家，特别是**喜欢**人工智能的**朋友**。"

RNN 很难把"朋友"和开头的"书"关联起来，因为中间隔了太多词。

### 2.3 长短期记忆网络（LSTM）

**LSTM（Long Short-Term Memory）** 是 1997 年提出的，专门解决 RNN 的梯度消失问题。

**核心创新**：引入"门控机制"，控制信息的流动。

LSTM 有三个门：

| 门 | 作用 | 类比 |
| --- | --- | --- |
| **遗忘门** | 决定丢弃哪些旧信息 | 清理过期的笔记 |
| **输入门** | 决定记录哪些新信息 | 写下重要的新笔记 |
| **输出门** | 决定输出哪些信息 | 选择要分享的内容 |

**公式**：

```
# 遗忘门：决定丢弃什么
f_t = σ(W_f * [h_{t-1}, x_t] + b_f)

# 输入门：决定记录什么
i_t = σ(W_i * [h_{t-1}, x_t] + b_i)
C_tilde_t = tanh(W_C * [h_{t-1}, x_t] + b_C)

# 更新细胞状态
C_t = f_t * C_{t-1} + i_t * C_tilde_t

# 输出门：决定输出什么
o_t = σ(W_o * [h_{t-1}, x_t] + b_o)
h_t = o_t * tanh(C_t)
```

其中：
- `σ` 是 sigmoid 函数，输出 0-1 之间
- `*` 是逐元素相乘
- `C_t` 是细胞状态（长期记忆）
- `h_t` 是隐藏状态（短期记忆）

### 2.4 门控循环单元（GRU）

**GRU（Gated Recurrent Unit）** 是 2014 年提出的 LSTM 简化版。

**简化**：把 LSTM 的三个门简化为两个门。

| 门 | 作用 |
| --- | --- |
| **更新门** | 决定保留多少旧信息，添加多少新信息 |
| **重置门** | 决定忽略多少旧信息 |

**公式**：

```
# 更新门
z_t = σ(W_z * [h_{t-1}, x_t])

# 重置门
r_t = σ(W_r * [h_{t-1}, x_t])

# 候选隐藏状态
h_tilde_t = tanh(W_h * [r_t * h_{t-1}, x_t])

# 最终隐藏状态
h_t = (1 - z_t) * h_{t-1} + z_t * h_tilde_t
```

**对比 LSTM 和 GRU**：

| 特性 | LSTM | GRU |
| --- | --- | --- |
| 门的数量 | 3 个 | 2 个 |
| 参数数量 | 多 | 少 |
| 训练速度 | 慢 | 快 |
| 效果 | 长序列更好 | 短序列足够 |
| 推荐场景 | 长文本、复杂任务 | 一般任务 |

---

## 3 对比分析

| 模型 | 结构 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| **RNN** | 简单循环 | 简单、参数少 | 梯度消失、无法处理长序列 | 短序列 |
| **LSTM** | 三门控 | 能处理长序列、效果好 | 参数多、训练慢 | 长文本、复杂任务 |
| **GRU** | 两门控 | 参数少、训练快 | 效果略逊于 LSTM | 一般任务、短序列 |

---

## 4 基础用法

### 4.1 使用 PyTorch 实现 RNN

```python
import torch
import torch.nn as nn

class SimpleRNN(nn.Module):
    """简单的 RNN 模型"""
    
    def __init__(self, input_size, hidden_size, output_size):
        super(SimpleRNN, self).__init__()
        
        # 隐藏层大小
        self.hidden_size = hidden_size
        
        # 输入到隐藏层的权重
        self.i2h = nn.Linear(input_size + hidden_size, hidden_size)
        
        # 隐藏层到输出层的权重
        self.i2o = nn.Linear(input_size + hidden_size, output_size)
        
        # 激活函数
        self.softmax = nn.LogSoftmax(dim=1)
    
    def forward(self, input, hidden):
        # 拼接输入和隐藏状态
        combined = torch.cat((input, hidden), 1)
        
        # 更新隐藏状态
        hidden = torch.tanh(self.i2h(combined))
        
        # 计算输出
        output = self.i2o(combined)
        output = self.softmax(output)
        
        return output, hidden
    
    def init_hidden(self):
        # 初始化隐藏状态
        return torch.zeros(1, 1, self.hidden_size)

# 测试
rnn = SimpleRNN(input_size=10, hidden_size=20, output_size=5)
print(f"RNN 模型：{rnn}")

# 模拟输入序列
seq_length = 5
hidden = rnn.init_hidden()

for i in range(seq_length):
    input = torch.randn(1, 10)  # 随机输入
    output, hidden = rnn(input, hidden)
    print(f"时间步 {i+1}，输出形状：{output.shape}")
```

### 4.2 使用 PyTorch 的 RNN 层

```python
import torch
import torch.nn as nn

class RNNModel(nn.Module):
    """使用 PyTorch 内置 RNN 层"""
    
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super(RNNModel, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # RNN 层
        self.rnn = nn.RNN(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True  # 输入形状：(batch, seq, feature)
        )
        
        # 全连接层
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        # x 形状：(batch, seq_len, input_size)
        
        # 初始化隐藏状态
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        # 前向传播
        out, _ = self.rnn(x, h0)
        
        # 取最后一个时间步的输出
        out = self.fc(out[:, -1, :])
        
        return out

# 测试
model = RNNModel(input_size=10, hidden_size=20, num_layers=2, output_size=5)
x = torch.randn(32, 5, 10)  # (batch=32, seq_len=5, input_size=10)
output = model(x)
print(f"输出形状：{output.shape}")  # (32, 5)
```

### 4.3 使用 LSTM

```python
import torch
import torch.nn as nn

class LSTMModel(nn.Module):
    """LSTM 模型"""
    
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super(LSTMModel, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM 层
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2  # 防止过拟合
        )
        
        # 全连接层
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        # x 形状：(batch, seq_len, input_size)
        
        # 初始化隐藏状态和细胞状态
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        # 前向传播
        out, _ = self.lstm(x, (h0, c0))
        
        # 取最后一个时间步
        out = self.fc(out[:, -1, :])
        
        return out

# 测试
model = LSTMModel(input_size=10, hidden_size=20, num_layers=2, output_size=5)
x = torch.randn(32, 5, 10)
output = model(x)
print(f"LSTM 输出形状：{output.shape}")
```

### 4.4 使用 GRU

```python
import torch
import torch.nn as nn

class GRUModel(nn.Module):
    """GRU 模型"""
    
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super(GRUModel, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # GRU 层
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )
        
        # 全连接层
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        # x 形状：(batch, seq_len, input_size)
        
        # 初始化隐藏状态
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        # 前向传播
        out, _ = self.gru(x, h0)
        
        # 取最后一个时间步
        out = self.fc(out[:, -1, :])
        
        return out

# 测试
model = GRUModel(input_size=10, hidden_size=20, num_layers=2, output_size=5)
x = torch.randn(32, 5, 10)
output = model(x)
print(f"GRU 输出形状：{output.shape}")
```

---

## 5 实战：文本分类

### 5.1 情感分析

```python
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import jieba

# 准备数据
texts = [
    "这部电影太好看了",
    "剧情很精彩",
    "演员演技在线",
    "这部电影太烂了",
    "剧情拖沓",
    "演员演技尴尬"
]
labels = [1, 1, 1, 0, 0, 0]  # 1=好评，0=差评

# 构建词汇表
word2idx = {'<pad>': 0, '<unk>': 1}
for text in texts:
    words = jieba.lcut(text)
    for word in words:
        if word not in word2idx:
            word2idx[word] = len(word2idx)

# 文本转索引
def text_to_indices(text, word2idx, max_len=10):
    words = jieba.lcut(text)
    indices = [word2idx.get(w, word2idx['<unk>']) for w in words]
    # 填充或截断
    if len(indices) < max_len:
        indices += [word2idx['<pad>']] * (max_len - len(indices))
    else:
        indices = indices[:max_len]
    return indices

# 数据集
class TextDataset(Dataset):
    def __init__(self, texts, labels, word2idx, max_len=10):
        self.texts = texts
        self.labels = labels
        self.word2idx = word2idx
        self.max_len = max_len
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        indices = text_to_indices(text, self.word2idx, self.max_len)
        return torch.tensor(indices), torch.tensor(label)

# 创建数据加载器
dataset = TextDataset(texts, labels, word2idx)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 模型
class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_size, output_size):
        super(TextClassifier, self).__init__()
        
        # 词嵌入层
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        
        # LSTM 层
        self.lstm = nn.LSTM(
            input_size=embedding_dim,
            hidden_size=hidden_size,
            num_layers=2,
            batch_first=True,
            dropout=0.2
        )
        
        # 全连接层
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        # x: (batch, seq_len)
        embedded = self.embedding(x)  # (batch, seq_len, embedding_dim)
        lstm_out, _ = self.lstm(embedded)  # (batch, seq_len, hidden_size)
        last_out = lstm_out[:, -1, :]  # (batch, hidden_size)
        output = self.fc(last_out)  # (batch, output_size)
        return output

# 训练
model = TextClassifier(
    vocab_size=len(word2idx),
    embedding_dim=50,
    hidden_size=64,
    output_size=2
)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# 训练循环
num_epochs = 10
for epoch in range(num_epochs):
    total_loss = 0
    for texts_batch, labels_batch in dataloader:
        optimizer.zero_grad()
        outputs = model(texts_batch)
        loss = criterion(outputs, labels_batch)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    
    if (epoch + 1) % 2 == 0:
        print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {total_loss:.4f}")

# 测试
test_texts = ["这部电影真的很不错", "剧情太无聊了"]
model.eval()
with torch.no_grad():
    for text in test_texts:
        indices = text_to_indices(text, word2idx)
        input_tensor = torch.tensor([indices])
        output = model(input_tensor)
        pred = torch.argmax(output, dim=1).item()
        label = "好评" if pred == 1 else "差评"
        print(f"'{text}' -> {label}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **RNN** | 循环神经网络，处理序列数据 |
| **梯度消失** | 长序列训练时梯度趋近于 0 |
| **LSTM** | 长短期记忆网络，三门控解决梯度消失 |
| **GRU** | 门控循环单元，LSTM 的简化版 |
| **序列建模** | 用 RNN/LSTM/GRU 处理文本、时间序列等 |

---

## 7 新手常见误区

### 误区 1："RNN 能处理所有序列任务"

**错！** 简单 RNN 有梯度消失问题，无法处理长序列。实际中一般用 LSTM 或 GRU。

### 误区 2："LSTM 一定比 GRU 好"

不一定。LSTM 参数多，训练慢，但在长序列上效果更好。GRU 参数少，训练快，在短序列上效果差不多。要根据任务选择。

### 误区 3："RNN/LSTM 已经过时了"

**错！** 虽然 Transformer 在很多任务上效果更好，但 RNN/LSTM 在资源受限的场景（如移动端）仍然有用。而且它们是理解序列模型的基础。

### 误区 4："LSTM 能记住任意长的序列"

不是的。LSTM 虽然能处理长序列，但记忆也是有限的。一般能记住几十个时间步，再长就会遗忘。要处理超长序列，要用 Transformer。

---

## 8 动手练习

### 练习 1：基础练习 - 实现简单 RNN

**题目**：用 PyTorch 实现一个简单的 RNN，处理长度为 5 的序列。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class SimpleRNN(nn.Module):
    def __init__(self, input_size, hidden_size):
        super(SimpleRNN, self).__init__()
        self.hidden_size = hidden_size
        self.i2h = nn.Linear(input_size + hidden_size, hidden_size)
        self.i2o = nn.Linear(input_size + hidden_size, 1)
    
    def forward(self, input, hidden):
        combined = torch.cat((input, hidden), 1)
        hidden = torch.tanh(self.i2h(combined))
        output = self.i2o(combined)
        return output, hidden
    
    def init_hidden(self):
        return torch.zeros(1, 1, self.hidden_size)

# 测试
rnn = SimpleRNN(input_size=10, hidden_size=20)
hidden = rnn.init_hidden()

for i in range(5):
    input = torch.randn(1, 10)
    output, hidden = rnn(input, hidden)
    print(f"时间步 {i+1}，输出：{output.item():.4f}")
```

</details>

### 练习 2：进阶练习 - LSTM 文本分类

**题目**：用 LSTM 实现一个简单的文本分类器，区分正面和负面评论。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import jieba

# 数据
texts = ["这部电影太好看了", "剧情很精彩", "这部电影太烂了", "剧情拖沓"]
labels = [1, 1, 0, 0]

# 词汇表
word2idx = {'<pad>': 0, '<unk>': 1}
for text in texts:
    for word in jieba.lcut(text):
        if word not in word2idx:
            word2idx[word] = len(word2idx)

# 模型
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_size):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(embedding_dim, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, 2)
    
    def forward(self, x):
        embedded = self.embedding(x)
        lstm_out, _ = self.lstm(embedded)
        return self.fc(lstm_out[:, -1, :])

# 训练
model = LSTMClassifier(len(word2idx), 50, 64)
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

for epoch in range(10):
    for text, label in zip(texts, labels):
        indices = [word2idx.get(w, 1) for w in jieba.lcut(text)]
        indices += [0] * (10 - len(indices))
        x = torch.tensor([indices])
        y = torch.tensor([label])
        
        optimizer.zero_grad()
        output = model(x)
        loss = criterion(output, y)
        loss.backward()
        optimizer.step()

print("训练完成")
```

</details>

### 练习 3（挑战）：综合练习 - 双向 LSTM

**题目**：实现一个双向 LSTM 模型，用于序列标注任务（如词性标注）。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class BiLSTM(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_size, tagset_size):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(
            embedding_dim, 
            hidden_size, 
            num_layers=1,
            bidirectional=True,  # 双向 LSTM
            batch_first=True
        )
        self.fc = nn.Linear(hidden_size * 2, tagset_size)
    
    def forward(self, x):
        embedded = self.embedding(x)
        lstm_out, _ = self.lstm(embedded)
        # lstm_out: (batch, seq_len, hidden_size * 2)
        output = self.fc(lstm_out)
        return output

# 测试
model = BiLSTM(vocab_size=1000, embedding_dim=50, hidden_size=64, tagset_size=10)
x = torch.randint(0, 1000, (2, 10))  # (batch=2, seq_len=10)
output = model(x)
print(f"输出形状：{output.shape}")  # (2, 10, 10)
```

</details>

---

## 下一章预告

下一章我们会学习 **Seq2Seq 与注意力机制**——也就是如何实现机器翻译等序列到序列的任务。你会学到编码器-解码器结构、注意力机制的原理。这些是现代 NLP 模型的基础。
