---
title: "第13章：循环神经网络"
description: "RNN 原理、LSTM、GRU、序列建模"
---

# 第13章：循环神经网络

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是循环神经网络（RNN）？
- RNN 和 CNN 有什么区别？
- 什么是 LSTM 和 GRU？
- RNN 适合处理什么任务？

这一章就是为了解答这些问题。RNN 是处理序列数据的核心架构，广泛应用于自然语言处理、时间序列预测等领域。

---

## 1 为什么需要 RNN？

### 痛点分析

用全连接网络处理序列数据的问题：

```python
# ❌ 全连接网络：无法处理变长序列
# 假设要预测句子"我今天去"的下一个词
# 输入长度不固定，全连接网络无法处理

# 句子1："我今天去" (4个词)
# 句子2："明天" (2个词)
# 全连接网络需要固定输入长度
```

```python
# ✅ RNN：可以处理任意长度的序列
# RNN 有记忆能力，可以记住之前的信息
# 适合处理文本、语音、时间序列等序列数据
```

> **一句话总结**：RNN 有记忆能力，适合处理序列数据。

### 生活化类比

打个比方：

> CNN 像看照片，一次看完整个图像。
> RNN 像读书，一个字一个字地读，记住前面的内容。

---

## 2 核心原理：循环结构

### 概念解释

RNN 的核心是循环结构，每个时间步共享同一组参数：

```
时间步 t-1        时间步 t        时间步 t+1
   ┌─────┐         ┌─────┐         ┌─────┐
x_{t-1} → h_{t-1} → x_t → h_t → x_{t+1} → h_{t+1}
   ↑_______|         ↑_______|         ↑_______|
      隐藏状态传递        隐藏状态传递
```

### 数学公式

```python
# RNN 的更新公式
h_t = tanh(W_hh @ h_{t-1} + W_xh @ x_t + b_h)
y_t = W_hy @ h_t + b_y

其中：
- h_t: 当前时间步的隐藏状态
- x_t: 当前时间步的输入
- W_hh: 隐藏状态到隐藏状态的权重
- W_xh: 输入到隐藏状态的权重
- W_hy: 隐藏状态到输出的权重
```

### PyTorch 实现

```python
import torch
import torch.nn as nn

# 创建简单 RNN
rnn = nn.RNN(input_size=10, hidden_size=20, num_layers=1)

# 输入：序列长度=5，批次=3，特征=10
x = torch.randn(5, 3, 10)

# 初始隐藏状态
h0 = torch.zeros(1, 3, 20)

# 前向传播
output, hn = rnn(x, h0)

print("输出形状:", output.shape)  # [5, 3, 20]
print("最终隐藏状态形状:", hn.shape)  # [1, 3, 20]
```

---

## 3 RNN 的问题：梯度消失

### 概念解释

RNN 在长序列上训练困难：

```python
# 问题：梯度消失或爆炸
# 长序列中，梯度在反向传播时会指数级衰减或增长

# 句子："我昨天在公园里看到了一只非常可爱的..."
# 预测下一个词时，RNN 可能忘记了开头的"我"
```

### 生活化类比

> 普通 RNN 像金鱼，记忆只有几秒。
> 长句子中，它会忘记开头的内容。

---

## 4 LSTM：长短期记忆网络

### 概念解释

LSTM 通过门控机制解决梯度消失问题：

```
                    ┌─────────────┐
x_t ───────────────→│  遗忘门 f_t  │──→ 决定忘记什么
                    └─────────────┘
                    
                    ┌─────────────┐
x_t ───────────────→│  输入门 i_t  │──→ 决定记住什么
                    └─────────────┘
                    
                    ┌─────────────┐
x_t ───────────────→│  输出门 o_t  │──→ 决定输出什么
                    └─────────────┘

细胞状态 C_t 像传送带，信息可以长期保留
```

### 三个门

```python
# 遗忘门：决定丢弃什么信息
f_t = sigmoid(W_f @ [h_{t-1}, x_t] + b_f)

# 输入门：决定存储什么新信息
i_t = sigmoid(W_i @ [h_{t-1}, x_t] + b_i)
C_t_tilde = tanh(W_C @ [h_{t-1}, x_t] + b_C)

# 更新细胞状态
C_t = f_t * C_{t-1} + i_t * C_t_tilde

# 输出门：决定输出什么
o_t = sigmoid(W_o @ [h_{t-1}, x_t] + b_o)
h_t = o_t * tanh(C_t)
```

### PyTorch 实现

```python
import torch
import torch.nn as nn

class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes):
        super(LSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM 层
        self.lstm = nn.LSTM(
            input_size, 
            hidden_size, 
            num_layers, 
            batch_first=True
        )
        
        # 全连接层
        self.fc = nn.Linear(hidden_size, num_classes)
    
    def forward(self, x):
        # 初始化隐藏状态和细胞状态
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        # LSTM 前向传播
        out, _ = self.lstm(x, (h0, c0))
        
        # 取最后一个时间步的输出
        out = self.fc(out[:, -1, :])
        return out

# 创建模型
model = LSTMModel(
    input_size=10,    # 输入特征维度
    hidden_size=20,   # 隐藏层维度
    num_layers=2,     # LSTM 层数
    num_classes=5     # 分类数
)

# 测试
x = torch.randn(32, 5, 10)  # 批次=32，序列长度=5，特征=10
output = model(x)
print("输出形状:", output.shape)  # [32, 5]
```

---

## 5 GRU：门控循环单元

### 概念解释

GRU 是 LSTM 的简化版本，只有两个门：

```
LSTM：3个门（遗忘门、输入门、输出门）
GRU：2个门（更新门、重置门）

GRU 参数更少，训练更快，效果相当
```

### 两个门

```python
# 更新门：决定保留多少旧信息
z_t = sigmoid(W_z @ [h_{t-1}, x_t])

# 重置门：决定忘记多少旧信息
r_t = sigmoid(W_r @ [h_{t-1}, x_t])

# 候选隐藏状态
h_t_tilde = tanh(W @ [r_t * h_{t-1}, x_t])

# 最终隐藏状态
h_t = (1 - z_t) * h_{t-1} + z_t * h_t_tilde
```

### PyTorch 实现

```python
import torch
import torch.nn as nn

class GRUModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes):
        super(GRUModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # GRU 层
        self.gru = nn.GRU(
            input_size, 
            hidden_size, 
            num_layers, 
            batch_first=True
        )
        
        # 全连接层
        self.fc = nn.Linear(hidden_size, num_classes)
    
    def forward(self, x):
        # 初始化隐藏状态
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        # GRU 前向传播
        out, _ = self.gru(x, h0)
        
        # 取最后一个时间步的输出
        out = self.fc(out[:, -1, :])
        return out

# 创建模型
model = GRUModel(
    input_size=10,
    hidden_size=20,
    num_layers=2,
    num_classes=5
)
```

---

## 6 RNN vs LSTM vs GRU

| 特性 | RNN | LSTM | GRU |
| --- | --- | --- | --- |
| 门控机制 | 无 | 3个门 | 2个门 |
| 参数量 | 最少 | 最多 | 中等 |
| 训练速度 | 最快 | 最慢 | 中等 |
| 长序列处理 | 差 | 好 | 好 |
| 适用场景 | 短序列 | 长序列 | 长序列 |
| 推荐度 | 不推荐 | 推荐 | 推荐 |

---

## 7 RNN 应用场景

### 文本分类

```python
# 情感分析：判断评论是正面还是负面
# 输入：文本序列
# 输出：正面/负面

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
```

### 时间序列预测

```python
# 股票价格预测
# 输入：过去 N 天的价格
# 输出：明天的价格

class StockPredictor(nn.Module):
    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)
    
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return out
```

### 序列到序列（Seq2Seq）

```python
# 机器翻译
# 输入：英文句子
# 输出：中文句子

class Seq2Seq(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.encoder = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.decoder = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, vocab_size)
    
    def forward(self, src, trg):
        # 编码
        _, (hidden, cell) = self.encoder(src)
        # 解码
        output, _ = self.decoder(trg, (hidden, cell))
        output = self.fc(output)
        return output
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| RNN | 循环神经网络，处理序列数据 |
| 梯度消失 | RNN 在长序列上的问题 |
| LSTM | 长短期记忆网络，3个门控 |
| GRU | 门控循环单元，2个门控，更简单 |
| 应用场景 | 文本分类、时间序列、机器翻译 |

---

## 9 新手常见误区

### 误区 1："RNN 可以处理任何序列"

**错！** 普通 RNN 只能处理短序列：

```python
# ❌ 错误：用普通 RNN 处理长文本
rnn = nn.RNN(input_size=100, hidden_size=200)

# ✅ 正确：用 LSTM 或 GRU
lstm = nn.LSTM(input_size=100, hidden_size=200)
```

### 误区 2："LSTM 层数越多越好"

不是的。层数太深会过拟合：

```python
# ❌ 错误：10层 LSTM
lstm = nn.LSTM(input_size, hidden_size, num_layers=10)

# ✅ 正确：通常1-3层
lstm = nn.LSTM(input_size, hidden_size, num_layers=2)
```

### 误区 3："RNN 只能处理文本"

RNN 可以处理任何序列数据：

```python
# 文本序列
text_lstm = nn.LSTM(embed_dim, hidden_size)

# 时间序列
time_lstm = nn.LSTM(1, hidden_size)  # 单变量

# 音频序列
audio_lstm = nn.LSTM(mfcc_dim, hidden_size)
```

---

## 10 动手练习

### 练习 1：基础练习

用 PyTorch 创建一个 LSTM 模型，处理长度为 10 的序列。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class SimpleLSTM(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=10,
            hidden_size=20,
            num_layers=1,
            batch_first=True
        )
        self.fc = nn.Linear(20, 5)
    
    def forward(self, x):
        out, (h_n, c_n) = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return out

# 测试
model = SimpleLSTM()
x = torch.randn(32, 10, 10)  # 批次=32，序列长度=10，特征=10
output = model(x)
print("输出形状:", output.shape)  # [32, 5]
```

</details>

### 练习 2：进阶练习

用 LSTM 实现一个文本情感分类器。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class SentimentClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(
            embed_dim, 
            hidden_dim, 
            num_layers=2,
            batch_first=True,
            dropout=0.5
        )
        self.fc = nn.Linear(hidden_dim, 2)  # 二分类
        self.dropout = nn.Dropout(0.5)
    
    def forward(self, x):
        x = self.embedding(x)
        _, (h_n, _) = self.lstm(x)
        x = self.dropout(h_n[-1])
        x = self.fc(x)
        return x

# 测试
model = SentimentClassifier(vocab_size=10000, embed_dim=100, hidden_dim=128)
x = torch.randint(0, 10000, (32, 50))  # 批次=32，序列长度=50
output = model(x)
print("输出形状:", output.shape)  # [32, 2]
```

</details>

### 练习 3（挑战）：综合练习

实现一个双向 LSTM 模型。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class BiLSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size,
            hidden_size,
            num_layers,
            batch_first=True,
            bidirectional=True,  # 双向 LSTM
            dropout=0.3
        )
        # 双向 LSTM 输出维度是 2 * hidden_size
        self.fc = nn.Linear(hidden_size * 2, num_classes)
    
    def forward(self, x):
        out, _ = self.lstm(x)
        # 拼接最后一个时间步的前向和后向输出
        out = self.fc(out[:, -1, :])
        return out

# 测试
model = BiLSTMModel(
    input_size=10,
    hidden_size=20,
    num_layers=2,
    num_classes=5
)
x = torch.randn(32, 15, 10)
output = model(x)
print("输出形状:", output.shape)  # [32, 5]
print("模型参数量:", sum(p.numel() for p in model.parameters()))
```

</details>

---

## 下一章预告

下一章我们会学习 **自然语言处理基础**——文本预处理、词向量、文本分类，掌握处理文本数据的核心技术。
