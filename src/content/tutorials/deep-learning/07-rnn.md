---
title: "第7章：循环神经网络（RNN）"
description: "深入理解循环神经网络的原理与实现，掌握 RNN、LSTM、GRU 及其在序列建模中的应用"
---

# 第7章：循环神经网络（RNN）

## 本章导读

在学习 RNN 之前，你可能会有这些疑问：

- 为什么普通神经网络不能处理序列数据？
- RNN 是如何"记忆"历史信息的？
- RNN 有什么缺点？LSTM 和 GRU 如何解决这些问题？
- 如何用 RNN 处理文本和时间序列？

这一章会带你深入理解 RNN 家族的原理和实现，掌握序列数据建模的核心技术。

---

## 1 为什么需要 RNN？

### 普通神经网络的问题

普通神经网络（前馈神经网络）假设输入之间相互独立：

```
输入 x1 → 网络 → 输出 y1
输入 x2 → 网络 → 输出 y2
```

**问题**：无法处理序列数据中的时序依赖关系。

例如预测句子"我喜欢吃___"的下一个词：
- 需要知道前面的词"我"、"喜欢"、"吃"
- 普通网络每次只看到一个词，丢失了上下文

打个比方：

> 普通网络像金鱼，只有几秒记忆，看完就忘。RNN 像有记忆的人，能记住之前看到的内容。

### 序列数据的特点

序列数据中，当前时刻的输出依赖于之前的输入：

- 文本：当前词的含义依赖前面的词
- 语音：当前音素依赖前面的音素
- 时间序列：当前值依赖历史值
- 视频：当前帧依赖前面的帧

---

## 2 基础 RNN

### RNN 的结构

RNN 在隐藏层引入循环连接，让信息可以在时间步之间传递：

```
时间步 t-1          时间步 t           时间步 t+1
x_{t-1} → [h_{t-1}] → x_t → [h_t] → x_{t+1} → [h_{t+1}]
              ↓                ↓                ↓
             y_{t-1}          y_t             y_{t+1}
```

### RNN 的数学表达

```python
# RNN 的更新公式
# h_t = tanh(W_xh @ x_t + W_hh @ h_{t-1} + b_h)
# y_t = W_hy @ h_t + b_y

import torch
import torch.nn as nn

# 创建 RNN 层
# input_size: 输入特征维度
# hidden_size: 隐藏状态维度
# num_layers: RNN 层数
rnn = nn.RNN(input_size=10, hidden_size=20, num_layers=1, batch_first=True)

# 输入：(batch, seq_len, input_size)
x = torch.randn(4, 5, 10)  # 4 个样本，序列长度 5，特征维度 10

# 初始隐藏状态（可选）
h0 = torch.zeros(1, 4, 20)  # (num_layers, batch, hidden_size)

# 前向传播
output, hn = rnn(x, h0)
print(f"输入形状: {x.shape}")        # (4, 5, 10)
print(f"输出形状: {output.shape}")   # (4, 5, 20)
print(f"最终隐藏状态: {hn.shape}")    # (1, 4, 20)
```

### 手动实现 RNN

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleRNN(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(SimpleRNN, self).__init__()
        self.hidden_size = hidden_size
        
        # 输入到隐藏层
        self.W_xh = nn.Parameter(torch.randn(hidden_size, input_size))
        # 隐藏层到隐藏层（循环）
        self.W_hh = nn.Parameter(torch.randn(hidden_size, hidden_size))
        # 偏置
        self.b_h = nn.Parameter(torch.zeros(hidden_size))
        
        # 隐藏层到输出
        self.W_hy = nn.Parameter(torch.randn(output_size, hidden_size))
        self.b_y = nn.Parameter(torch.zeros(output_size))
    
    def forward(self, x, h=None):
        batch_size, seq_len, _ = x.shape
        
        # 初始化隐藏状态
        if h is None:
            h = torch.zeros(batch_size, self.hidden_size)
        
        outputs = []
        for t in range(seq_len):
            x_t = x[:, t, :]  # 当前时间步的输入
            
            # 更新隐藏状态
            h = torch.tanh(
                x_t @ self.W_xh.T + 
                h @ self.W_hh.T + 
                self.b_h
            )
            
            # 计算输出
            y_t = h @ self.W_hy.T + self.b_y
            outputs.append(y_t)
        
        # 堆叠所有时间步的输出
        outputs = torch.stack(outputs, dim=1)
        return outputs, h

# 测试
model = SimpleRNN(input_size=10, hidden_size=20, output_size=5)
x = torch.randn(4, 5, 10)
output, h = model(x)
print(f"输出形状: {output.shape}")  # (4, 5, 5)
```

---

## 3 RNN 的问题：梯度消失与梯度爆炸

### 梯度消失

RNN 在反向传播时，梯度需要沿着时间步回传。当序列很长时：

```
∂L/∂h_t = ∂L/∂h_T · ∂h_T/∂h_{T-1} · ... · ∂h_{t+1}/∂h_t
```

每个时间步的梯度都包含 W_hh 的连乘。如果 W_hh 的特征值小于 1，梯度会指数级衰减。

### 梯度爆炸

相反，如果 W_hh 的特征值大于 1，梯度会指数级增长。

### 解决方案

```python
# 梯度裁剪：防止梯度爆炸
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

# 使用 LSTM/GRU：解决梯度消失
# 使用残差连接
# 使用适当的权重初始化
```

---

## 4 长短期记忆网络（LSTM）

### LSTM 的核心思想

LSTM 通过"门控机制"控制信息的流动，解决梯度消失问题。

打个比方：

> LSTM 像一个有记忆管理的笔记本。它有三个"门"：
> - 遗忘门：决定哪些旧信息应该忘记
> - 输入门：决定哪些新信息应该记住
> - 输出门：决定哪些信息应该输出

### LSTM 的结构

```
                    遗忘门    输入门    输出门
                      ↓        ↓        ↓
细胞状态 C_{t-1} → [×] → [+] → [×] → tanh → [×] → h_t
                      ↑   ↑      ↑
                    h_{t-1}    h_{t-1}   h_{t-1}
                      ↑         ↑
                     x_t       x_t
```

### LSTM 的数学表达

```python
# 遗忘门：决定丢弃多少旧信息
f_t = σ(W_f @ [h_{t-1}, x_t] + b_f)

# 输入门：决定存储多少新信息
i_t = σ(W_i @ [h_{t-1}, x_t] + b_i)
C_t_tilde = tanh(W_C @ [h_{t-1}, x_t] + b_C)

# 更新细胞状态
C_t = f_t * C_{t-1} + i_t * C_t_tilde

# 输出门：决定输出多少信息
o_t = σ(W_o @ [h_{t-1}, x_t] + b_o)
h_t = o_t * tanh(C_t)
```

### PyTorch 中的 LSTM

```python
import torch
import torch.nn as nn

# 创建 LSTM 层
lstm = nn.LSTM(
    input_size=10,     # 输入特征维度
    hidden_size=20,    # 隐藏状态维度
    num_layers=2,      # LSTM 层数
    batch_first=True,  # 输入格式 (batch, seq, feature)
    dropout=0.1        # 层间 dropout
)

# 输入
x = torch.randn(4, 5, 10)  # (batch, seq_len, input_size)

# 初始状态（可选）
h0 = torch.zeros(2, 4, 20)  # (num_layers, batch, hidden_size)
c0 = torch.zeros(2, 4, 20)

# 前向传播
output, (hn, cn) = lstm(x, (h0, c0))
print(f"输出形状: {output.shape}")  # (4, 5, 20)
print(f"隐藏状态: {hn.shape}")      # (2, 4, 20)
print(f"细胞状态: {cn.shape}")      # (2, 4, 20)
```

### 使用 LSTM 构建分类模型

```python
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super(LSTMClassifier, self).__init__()
        # 词嵌入层
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        # LSTM 层
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim, 
            num_layers=2, 
            batch_first=True,
            dropout=0.3,
            bidirectional=True  # 双向 LSTM
        )
        # 分类层
        self.fc = nn.Linear(hidden_dim * 2, num_classes)  # *2 因为双向
        self.dropout = nn.Dropout(0.5)
    
    def forward(self, x):
        # x: (batch, seq_len)
        embedded = self.dropout(self.embedding(x))  # (batch, seq_len, embed_dim)
        
        lstm_out, (hidden, cell) = self.lstm(embedded)
        # lstm_out: (batch, seq_len, hidden_dim*2)
        # hidden: (num_layers*2, batch, hidden_dim)
        
        # 取最后一个时间步的输出
        # 或者取所有时间步的平均
        out = lstm_out[:, -1, :]  # (batch, hidden_dim*2)
        out = self.dropout(out)
        out = self.fc(out)  # (batch, num_classes)
        return out

# 创建模型
model = LSTMClassifier(
    vocab_size=10000,
    embed_dim=128,
    hidden_dim=256,
    num_classes=2
)

# 测试
x = torch.randint(0, 10000, (4, 50))  # 4 个样本，序列长度 50
output = model(x)
print(f"输出形状: {output.shape}")  # (4, 2)
```

---

## 5 门控循环单元（GRU）

### GRU 简介

GRU 是 LSTM 的简化版本，将遗忘门和输入门合并为"更新门"，参数更少。

### GRU vs LSTM

| 特性 | LSTM | GRU |
|-----|------|-----|
| 门数量 | 3 个（遗忘、输入、输出） | 2 个（更新、重置） |
| 参数数量 | 较多 | 较少 |
| 训练速度 | 较慢 | 较快 |
| 性能 | 通常更好 | 接近 LSTM |
| 适用场景 | 长序列 | 短序列，数据量大 |

### PyTorch 中的 GRU

```python
import torch
import torch.nn as nn

# 创建 GRU 层
gru = nn.GRU(
    input_size=10,
    hidden_size=20,
    num_layers=2,
    batch_first=True,
    dropout=0.1
)

# 输入
x = torch.randn(4, 5, 10)

# 前向传播
output, hn = gru(x)
print(f"输出形状: {output.shape}")  # (4, 5, 20)
print(f"隐藏状态: {hn.shape}")      # (2, 4, 20)
```

---

## 6 RNN 的应用场景

### 6.1 文本分类

```python
class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super(TextClassifier, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
    
    def forward(self, text):
        # text: (batch, seq_len)
        embedded = self.embedding(text)  # (batch, seq_len, embed_dim)
        output, (hidden, _) = self.lstm(embedded)
        # 拼接双向最后隐藏状态
        hidden = torch.cat((hidden[-2], hidden[-1]), dim=1)
        return self.fc(hidden)
```

### 6.2 序列标注（如命名实体识别）

```python
class SequenceTagger(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_tags):
        super(SequenceTagger, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, num_tags)
    
    def forward(self, text):
        # text: (batch, seq_len)
        embedded = self.embedding(text)
        output, _ = self.lstm(embedded)
        # 每个时间步都输出标签
        tags = self.fc(output)  # (batch, seq_len, num_tags)
        return tags
```

### 6.3 时间序列预测

```python
class TimeSeriesPredictor(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super(TimeSeriesPredictor, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)
    
    def forward(self, x):
        # x: (batch, seq_len, input_dim)
        output, (hidden, _) = self.lstm(x)
        # 使用最后一个时间步的隐藏状态进行预测
        prediction = self.fc(hidden[-1])  # (batch, output_dim)
        return prediction
```

### 6.4 序列到序列（Seq2Seq）

```python
class Seq2Seq(nn.Module):
    def __init__(self, src_vocab, tgt_vocab, embed_dim, hidden_dim):
        super(Seq2Seq, self).__init__()
        # 编码器
        self.encoder_embedding = nn.Embedding(src_vocab, embed_dim)
        self.encoder = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        
        # 解码器
        self.decoder_embedding = nn.Embedding(tgt_vocab, embed_dim)
        self.decoder = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, tgt_vocab)
    
    def encode(self, src):
        embedded = self.encoder_embedding(src)
        _, (hidden, cell) = self.encoder(embedded)
        return hidden, cell
    
    def decode(self, tgt, hidden, cell):
        embedded = self.decoder_embedding(tgt)
        output, (hidden, cell) = self.decoder(embedded, (hidden, cell))
        prediction = self.fc(output)
        return prediction, hidden, cell
    
    def forward(self, src, tgt):
        hidden, cell = self.encode(src)
        prediction, _, _ = self.decode(tgt, hidden, cell)
        return prediction
```

---

## 7 双向 RNN

### 为什么需要双向？

单向 RNN 只能看到过去的信息，但很多任务需要同时利用过去和未来的信息。

例如：完形填空 "我喜欢吃___和米饭"，需要同时看前后文。

### 双向 RNN 实现

```python
# 双向 LSTM
bilstm = nn.LSTM(
    input_size=10,
    hidden_size=20,
    bidirectional=True  # 开启双向
)

x = torch.randn(4, 5, 10)
output, (hn, cn) = bilstm(x)

print(f"输出形状: {output.shape}")  # (4, 5, 40) 前向 20 + 后向 20
print(f"隐藏状态: {hn.shape}")      # (4, 4, 20) 2 层 * 2 方向 = 4
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| RNN | 引入循环连接，处理序列数据 |
| 梯度消失 | 长序列训练的核心问题 |
| LSTM | 门控机制解决梯度消失，3 个门 |
| GRU | LSTM 的简化版，2 个门，参数更少 |
| 双向 RNN | 同时利用过去和未来信息 |
| Seq2Seq | 编码器-解码器架构，用于翻译等任务 |
| 应用场景 | 文本分类、序列标注、时间序列预测 |

---

## 9 新手常见误区

### 误区 1："RNN 可以处理任意长度的序列"

虽然 RNN 理论上可以处理任意长度，但实际中由于梯度消失，长序列效果很差。需要使用 LSTM/GRU 或截断序列。

### 误区 2："LSTM 一定比 GRU 好"

在数据量充足、序列较短时，GRU 和 LSTM 效果接近，GRU 训练更快。

### 误区 3："双向 RNN 一定比单向好"

双向 RNN 不能用于实时预测任务，因为需要未来的信息。在翻译等离线任务中效果更好。

### 误区 4："RNN 只能处理文本"

RNN 可以处理任何序列数据：时间序列、语音、视频帧序列、DNA 序列等。

---

## 10 动手练习

### 练习 1：基础练习

用 PyTorch 实现一个简单的 LSTM，对正弦波进行预测。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import numpy as np

# 生成正弦波数据
def create_sine_data(seq_len=50, num_samples=1000):
    X, y = [], []
    for _ in range(num_samples):
        start = np.random.uniform(0, 2*np.pi)
        t = np.linspace(start, start + 4*np.pi, seq_len + 1)
        data = np.sin(t)
        X.append(data[:-1])
        y.append(data[1:])
    return torch.tensor(X, dtype=torch.float32).unsqueeze(-1), \
           torch.tensor(y, dtype=torch.float32).unsqueeze(-1)

X, y = create_sine_data()

# 定义 LSTM 模型
class SineLSTM(nn.Module):
    def __init__(self, input_dim=1, hidden_dim=64, num_layers=2):
        super(SineLSTM, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 1)
    
    def forward(self, x):
        output, _ = self.lstm(x)
        prediction = self.fc(output)
        return prediction

model = SineLSTM()
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

# 训练
epochs = 50
for epoch in range(epochs):
    output = model(X)
    loss = criterion(output, y)
    
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    
    if (epoch + 1) % 10 == 0:
        print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.6f}')

# 预测测试
with torch.no_grad():
    test_input = X[:1]
    prediction = model(test_input)
    print(f"\n预测形状: {prediction.shape}")
```

</details>

### 练习 2：进阶练习

实现一个双向 LSTM 文本分类器，用于情感分析。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class BiLSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes, 
                 num_layers=2, dropout=0.5):
        super(BiLSTMClassifier, self).__init__()
        
        # 词嵌入
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        
        # 双向 LSTM
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # 分类层
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(dropout)
        self.bn = nn.BatchNorm1d(hidden_dim * 2)
    
    def forward(self, x):
        # x: (batch, seq_len)
        embedded = self.dropout(self.embedding(x))  # (batch, seq_len, embed_dim)
        
        # LSTM
        lstm_out, (hidden, _) = self.lstm(embedded)
        # hidden: (num_layers*2, batch, hidden_dim)
        
        # 拼接最后一层的前向和后向隐藏状态
        hidden_fwd = hidden[-2]  # (batch, hidden_dim)
        hidden_bwd = hidden[-1]  # (batch, hidden_dim)
        hidden_cat = torch.cat((hidden_fwd, hidden_bwd), dim=1)  # (batch, hidden_dim*2)
        
        # 分类
        out = self.bn(hidden_cat)
        out = self.dropout(out)
        out = self.fc(out)
        return out

# 测试
model = BiLSTMClassifier(
    vocab_size=10000,
    embed_dim=128,
    hidden_dim=256,
    num_classes=2,
    num_layers=2
)

x = torch.randint(0, 10000, (4, 100))
output = model(x)
print(f"输出形状: {output.shape}")  # (4, 2)
```

</details>

### 练习 3（挑战）：综合练习

实现一个简单的 Seq2Seq 模型，用于数字序列的反转（如输入 [1,2,3,4]，输出 [4,3,2,1]）。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim

# 生成反转数据
def create_reverse_data(seq_len=10, num_samples=1000, vocab_size=10):
    X = torch.randint(1, vocab_size, (num_samples, seq_len))
    y = torch.flip(X, [1])
    return X, y

# Seq2Seq 模型
class Seq2SeqReverse(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim):
        super(Seq2SeqReverse, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.encoder = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.decoder = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, vocab_size)
    
    def forward(self, src, tgt):
        # 编码
        src_emb = self.embedding(src)
        _, (hidden, cell) = self.encoder(src_emb)
        
        # 解码
        tgt_emb = self.embedding(tgt)
        output, _ = self.decoder(tgt_emb, (hidden, cell))
        logits = self.fc(output)
        return logits

# 训练
vocab_size = 10
seq_len = 10
model = Seq2SeqReverse(vocab_size, embed_dim=32, hidden_dim=64)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

X, y = create_reverse_data(seq_len=seq_len, num_samples=1000, vocab_size=vocab_size)

# 训练时，解码器输入是目标序列右移一位
decoder_input = torch.zeros_like(y)
decoder_input[:, 1:] = y[:, :-1]

epochs = 100
for epoch in range(epochs):
    logits = model(X, decoder_input)
    loss = criterion(logits.view(-1, vocab_size), y.view(-1))
    
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    
    if (epoch + 1) % 20 == 0:
        # 计算准确率
        preds = logits.argmax(dim=-1)
        acc = (preds == y).float().mean()
        print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}, Acc: {acc:.2%}')

# 测试
with torch.no_grad():
    test_X, test_y = create_reverse_data(seq_len=5, num_samples=5, vocab_size=vocab_size)
    test_decoder_input = torch.zeros_like(test_y)
    test_logits = model(test_X, test_decoder_input)
    test_preds = test_logits.argmax(dim=-1)
    
    print("\n测试结果:")
    for i in range(5):
        print(f"输入: {test_X[i].tolist()}")
        print(f"预测: {test_preds[i].tolist()}")
        print(f"真实: {test_y[i].tolist()}")
        print()
```

</details>

---

## 下一章预告

下一章我们会学习自然语言处理（NLP）的基础知识，包括词嵌入、Word2Vec、文本预处理等。你会了解到如何将文本转换为神经网络可以处理的数字表示。
