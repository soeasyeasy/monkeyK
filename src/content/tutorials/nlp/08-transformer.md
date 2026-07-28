---
title: "第8章：Transformer 架构详解"
description: "自注意力机制、多头注意力、位置编码、Layer Norm"
---

# 第8章：Transformer 架构详解

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Transformer 是什么？为什么它能取代 RNN 成为主流？
- 自注意力机制和上一章的注意力机制有什么区别？
- 为什么要用多头注意力？一个头不够吗？
- Transformer 没有循环结构，怎么知道词的顺序？

这一章就是为了解答这些问题。我们会从 **Transformer 的核心创新** 开始，逐步学习自注意力、多头注意力、位置编码等关键概念。

---

## 1 为什么需要 Transformer？

### 痛点分析

上一章我们学了 Seq2Seq + 注意力机制，但它有个致命问题：**RNN 是顺序计算的，无法并行**。

**RNN 的问题**：
- 必须按顺序处理：先处理第 1 个词，再处理第 2 个词...
- 训练速度慢，无法充分利用 GPU 并行能力
- 长序列时，前面的信息会逐渐丢失

**例子**：
> 处理一个 100 词的句子，RNN 需要 100 步串行计算。而 Transformer 可以一次性处理所有词，速度快得多。

### 解决方案

**Transformer** 是 2017 年 Google 在论文《Attention Is All You Need》中提出的架构。

**核心创新**：
- ❌ 完全抛弃 RNN 和 CNN
- ✅ 只用注意力机制
- ✅ 完全并行化
- ✅ 能捕捉长距离依赖

打个比方：

> RNN 就像排队买票，必须一个一个来；Transformer 就像大家一起同时投票，一次性得出结果。Transformer 让 AI 能"同时看到"整个句子，而不是一个一个词地读。

> **一句话总结**：Transformer 用自注意力机制取代了 RNN，实现了完全并行化，成为现代 NLP 的基石。

---

## 2 核心原理

### 2.1 Transformer 整体架构

**Transformer** 由两部分组成：

| 组件 | 作用 | 层数 |
| --- | --- | --- |
| **编码器（Encoder）** | 理解输入序列 | 6 层（原论文） |
| **解码器（Decoder）** | 生成输出序列 | 6 层（原论文） |

**每一层包含**：

**编码器层**：
1. 多头自注意力（Multi-Head Self-Attention）
2. 前馈神经网络（Feed-Forward Network）
3. 残差连接 + Layer Norm

**解码器层**：
1. 掩码多头自注意力（Masked Multi-Head Self-Attention）
2. 多头编码器-解码器注意力（Multi-Head Encoder-Decoder Attention）
3. 前馈神经网络
4. 残差连接 + Layer Norm

### 2.2 自注意力机制（Self-Attention）

**自注意力** 是 Transformer 的核心：让序列中的每个位置都能"看到"所有其他位置。

**与上一章注意力的区别**：

| 特性 | 传统注意力 | 自注意力 |
| --- | --- | --- |
| Query/Key/Value | 来自不同序列 | 来自同一序列 |
| 作用 | 编码器→解码器 | 序列内部交互 |
| 目的 | 对齐两个序列 | 捕捉序列内部关系 |

**计算过程**：

```
输入：X（序列中所有词的向量）

1. 线性变换得到 Q、K、V
   Q = X * W_Q
   K = X * W_K
   V = X * W_V

2. 计算注意力分数
   Score = Q * K^T / sqrt(d_k)

3. Softmax 得到权重
   Attention_Weights = softmax(Score)

4. 加权求和
   Output = Attention_Weights * V
```

**公式**：

```
Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V
```

其中：
- `Q`（Query）：查询，代表"我要找什么"
- `K`（Key）：键，代表"我有什么"
- `V`（Value）：值，代表"我的内容"
- `d_k`：K 的维度，用于缩放

**直观理解**：
> 想象一个图书馆。Q 是你要找的书（查询），K 是每本书的标签（键），V 是书的内容（值）。自注意力就是计算你的查询和每本书标签的相似度，然后根据相似度加权获取书的内容。

### 2.3 缩放点积注意力

**为什么要除以 sqrt(d_k)？**

当 d_k 很大时，点积的结果会很大，导致 softmax 进入梯度很小的区域。

**例子**：
```
假设 d_k = 100
点积结果可能是 [-100, 100]
softmax 后可能是 [0.0001, 0.9999]
梯度几乎为 0，无法训练

除以 sqrt(100) = 10 后：
点积结果变成 [-10, 10]
softmax 后可能是 [0.1, 0.9]
梯度正常，可以训练
```

### 2.4 多头注意力（Multi-Head Attention）

**问题**：单头注意力只能捕捉一种关系。

**解决方案**：用多个"头"并行计算注意力，每个头学习不同的关系。

```
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) * W_O

其中：
head_i = Attention(Q * W_Q_i, K * W_K_i, V * W_V_i)
```

**多头的作用**：

| 头 | 可能学到的关系 |
| --- | --- |
| 头 1 | 语法关系（主谓宾） |
| 头 2 | 语义关系（同义词） |
| 头 3 | 位置关系（相邻词） |
| 头 4 | 指代关系（代词→名词） |

**例子**：
> "小明去了北京，他很喜欢那里"
> - 头 1：学到"他"→"小明"（指代）
> - 头 2：学到"那里"→"北京"（指代）
> - 头 3：学到"喜欢"→"北京"（动宾）

### 2.5 位置编码（Positional Encoding）

**问题**：Transformer 没有循环结构，无法感知词的顺序。

**解决方案**：给每个位置添加一个位置编码，加到词向量上。

**公式**：

```
PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

其中：
- `pos`：位置索引
- `i`：维度索引
- `d_model`：模型维度

**直观理解**：
> 位置编码就像给每个词贴一个"位置标签"。第 1 个词贴"位置 1"，第 2 个词贴"位置 2"。这样模型就知道词的顺序了。

### 2.6 前馈神经网络（Feed-Forward Network）

**结构**：两层全连接网络，中间用 ReLU 激活。

```
FFN(x) = max(0, x * W_1 + b_1) * W_2 + b_2
```

**作用**：对每个位置独立地进行非线性变换。

### 2.7 残差连接与 Layer Norm

**残差连接**：

```
output = x + SubLayer(x)
```

**作用**：缓解梯度消失，让梯度能直接流过。

**Layer Norm**：

```
LayerNorm(x) = (x - mean) / sqrt(var + eps) * gamma + beta
```

**作用**：标准化每一层的输出，稳定训练。

---

## 3 对比分析

| 架构 | 并行性 | 长距离依赖 | 训练速度 | 适用场景 |
| --- | --- | --- | --- | --- |
| **RNN** | 串行 | 差 | 慢 | 短序列 |
| **LSTM/GRU** | 串行 | 中 | 中 | 一般序列 |
| **CNN** | 并行 | 差（需要多层） | 快 | 局部特征 |
| **Transformer** | 完全并行 | 好 | 快 | 长序列、NLP |

---

## 4 基础用法

### 4.1 实现自注意力机制

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class SelfAttention(nn.Module):
    """自注意力机制"""
    
    def __init__(self, embed_size, heads):
        super(SelfAttention, self).__init__()
        self.embed_size = embed_size
        self.heads = heads
        self.head_dim = embed_size // heads
        
        assert (self.head_dim * heads == embed_size), "Embedding size needs to be divisible by heads"
        
        # Q、K、V 的线性变换
        self.values = nn.Linear(self.head_dim, self.head_dim, bias=False)
        self.keys = nn.Linear(self.head_dim, self.head_dim, bias=False)
        self.queries = nn.Linear(self.head_dim, self.head_dim, bias=False)
        
        # 输出层
        self.fc_out = nn.Linear(embed_size, embed_size)
    
    def forward(self, values, keys, query, mask):
        N = query.shape[0]
        value_len = values.shape[1]
        key_len = keys.shape[1]
        query_len = query.shape[1]
        
        # 分割成多个头
        values = values.reshape(N, value_len, self.heads, self.head_dim)
        keys = keys.reshape(N, key_len, self.heads, self.head_dim)
        query = query.reshape(N, query_len, self.heads, self.head_dim)
        
        # 计算注意力
        values = self.values(values)
        keys = self.keys(keys)
        queries = self.queries(query)
        
        # 点积注意力
        energy = torch.einsum("nqhd,nkhd->nqhk", [queries, keys])
        
        # 缩放
        energy = energy / (self.embed_size ** (1/2))
        
        # 掩码（用于解码器）
        if mask is not None:
            energy = energy.masked_fill(mask == 0, float("-1e20"))
        
        # Softmax
        attention = torch.softmax(energy, dim=3)
        
        # 加权求和
        out = torch.einsum("nqhk,nvhd->nqhd", [attention, values])
        
        # 拼接多头
        out = out.reshape(N, query_len, self.embed_size)
        
        # 输出层
        out = self.fc_out(out)
        
        return out

# 测试
attention = SelfAttention(embed_size=256, heads=8)
x = torch.randn(32, 10, 256)  # (batch, seq_len, embed_size)
out = attention(x, x, x, mask=None)
print(f"输出形状：{out.shape}")  # (32, 10, 256)
```

### 4.2 实现 Transformer 编码器层

```python
class TransformerEncoderLayer(nn.Module):
    """Transformer 编码器层"""
    
    def __init__(self, embed_size, heads, forward_expansion, dropout):
        super(TransformerEncoderLayer, self).__init__()
        
        # 自注意力
        self.attention = SelfAttention(embed_size, heads)
        
        # Layer Norm
        self.norm1 = nn.LayerNorm(embed_size)
        self.norm2 = nn.LayerNorm(embed_size)
        
        # 前馈神经网络
        self.feed_forward = nn.Sequential(
            nn.Linear(embed_size, forward_expansion * embed_size),
            nn.ReLU(),
            nn.Linear(forward_expansion * embed_size, embed_size)
        )
        
        # Dropout
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, value, key, query, mask):
        # 自注意力 + 残差连接
        attention = self.attention(value, key, query, mask)
        
        # Dropout + 残差 + Layer Norm
        x = self.dropout(self.norm1(attention + query))
        
        # 前馈网络 + 残差 + Layer Norm
        forward = self.feed_forward(x)
        out = self.dropout(self.norm2(forward + x))
        
        return out

# 测试
encoder_layer = TransformerEncoderLayer(
    embed_size=256,
    heads=8,
    forward_expansion=4,
    dropout=0.1
)

x = torch.randn(32, 10, 256)
out = encoder_layer(x, x, x, mask=None)
print(f"编码器层输出形状：{out.shape}")
```

### 4.3 实现位置编码

```python
class PositionalEncoding(nn.Module):
    """位置编码"""
    
    def __init__(self, d_model, max_len=5000):
        super(PositionalEncoding, self).__init__()
        
        # 创建位置编码矩阵
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        
        pe = pe.unsqueeze(0)
        
        # 注册为 buffer（不参与训练，但会随模型保存）
        self.register_buffer('pe', pe)
    
    def forward(self, x):
        # x: (batch, seq_len, d_model)
        return x + self.pe[:, :x.size(1), :]

# 测试
pos_enc = PositionalEncoding(d_model=256)
x = torch.randn(32, 10, 256)
out = pos_enc(x)
print(f"位置编码输出形状：{out.shape}")
```

### 4.4 完整 Transformer 编码器

```python
class TransformerEncoder(nn.Module):
    """完整的 Transformer 编码器"""
    
    def __init__(
        self,
        vocab_size,
        embed_size,
        num_layers,
        heads,
        forward_expansion,
        dropout,
        max_length=100
    ):
        super(TransformerEncoder, self).__init__()
        
        self.embed_size = embed_size
        
        # 词嵌入
        self.word_embedding = nn.Embedding(vocab_size, embed_size)
        
        # 位置编码
        self.position_embedding = PositionalEncoding(embed_size, max_length)
        
        # N 层编码器
        self.layers = nn.ModuleList([
            TransformerEncoderLayer(
                embed_size, heads, forward_expansion, dropout
            )
            for _ in range(num_layers)
        ])
        
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x, mask):
        # 词嵌入 + 位置编码
        out = self.word_embedding(x)
        out = self.position_embedding(out)
        out = self.dropout(out)
        
        # 通过 N 层编码器
        for layer in self.layers:
            out = layer(out, out, out, mask)
        
        return out

# 测试
encoder = TransformerEncoder(
    vocab_size=10000,
    embed_size=256,
    num_layers=6,
    heads=8,
    forward_expansion=4,
    dropout=0.1
)

x = torch.randint(0, 10000, (32, 10))  # (batch, seq_len)
mask = torch.ones(32, 1, 1, 10)  # 无掩码
out = encoder(x, mask)
print(f"编码器输出形状：{out.shape}")  # (32, 10, 256)
```

### 4.5 使用 Hugging Face Transformers

```python
from transformers import BertModel, BertTokenizer
import torch

# 加载预训练 BERT 模型（基于 Transformer）
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

# 准备输入
text = "Hello, how are you?"
inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)

# 前向传播
with torch.no_grad():
    outputs = model(**inputs)

# 获取输出
last_hidden_states = outputs.last_hidden_state
print(f"隐藏状态形状：{last_hidden_states.shape}")  # (1, seq_len, 768)

# 获取 [CLS] 标记的输出（用于分类任务）
cls_output = last_hidden_states[:, 0, :]
print(f"CLS 输出形状：{cls_output.shape}")  # (1, 768)
```

---

## 5 实战：文本分类

### 5.1 使用 Transformer 进行情感分析

```python
import torch
import torch.nn as nn
from transformers import BertModel, BertTokenizer

class TransformerClassifier(nn.Module):
    """基于 Transformer 的文本分类器"""
    
    def __init__(self, num_classes, dropout=0.3):
        super(TransformerClassifier, self).__init__()
        
        # 加载预训练 BERT
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        
        # 冻结 BERT 参数（可选）
        for param in self.bert.parameters():
            param.requires_grad = False
        
        # 分类头
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(768, num_classes)
    
    def forward(self, input_ids, attention_mask):
        # BERT 编码
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        
        # 获取 [CLS] 输出
        cls_output = outputs.last_hidden_state[:, 0, :]
        
        # Dropout + 分类
        out = self.dropout(cls_output)
        logits = self.fc(out)
        
        return logits

# 测试
model = TransformerClassifier(num_classes=2)

# 模拟输入
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
text = "This movie is great!"
inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)

# 前向传播
logits = model(inputs['input_ids'], inputs['attention_mask'])
print(f"Logits 形状：{logits.shape}")  # (1, 2)

# 预测
pred = torch.argmax(logits, dim=1)
print(f"预测类别：{pred.item()}")
```

### 5.2 训练 Transformer 分类器

```python
from torch.utils.data import Dataset, DataLoader
from transformers import AdamW

# 数据集
class SentimentDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'label': torch.tensor(label, dtype=torch.long)
        }

# 准备数据
texts = ["This is great", "This is bad", "I love it", "I hate it"]
labels = [1, 0, 1, 0]

tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
dataset = SentimentDataset(texts, labels, tokenizer)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 模型
model = TransformerClassifier(num_classes=2)

# 优化器
optimizer = AdamW(model.parameters(), lr=1e-4)
criterion = nn.CrossEntropyLoss()

# 训练
num_epochs = 3
for epoch in range(num_epochs):
    total_loss = 0
    
    for batch in dataloader:
        optimizer.zero_grad()
        
        input_ids = batch['input_ids']
        attention_mask = batch['attention_mask']
        labels = batch['label']
        
        outputs = model(input_ids, attention_mask)
        loss = criterion(outputs, labels)
        
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Transformer** | 完全基于注意力的架构，抛弃 RNN |
| **自注意力** | 序列内部交互，捕捉全局依赖 |
| **多头注意力** | 多个头学习不同关系 |
| **位置编码** | 给词添加位置信息 |
| **残差连接** | 缓解梯度消失 |
| **Layer Norm** | 标准化，稳定训练 |

---

## 7 新手常见误区

### 误区 1："Transformer 只能用于 NLP"

**错！** Transformer 最初用于 NLP，但现在已经广泛应用于计算机视觉（ViT）、语音识别、多模态等领域。

### 误区 2："多头注意力越多越好"

不一定。头数太多会导致每个头的维度太小，效果反而下降。一般 heads = 8 或 16 就够了。

### 误区 3："Transformer 不需要位置编码"

**错！** Transformer 没有循环结构，必须依赖位置编码来感知词的顺序。没有位置编码，模型无法区分"我喜欢你"和"你喜欢我"。

### 误区 4："Transformer 的层数越深越好"

不是的。层数太深会导致训练困难（梯度消失/爆炸）。一般 6-12 层就够了，更深的模型需要特殊技巧（如预训练）。

---

## 8 动手练习

### 练习 1：基础练习 - 实现自注意力

**题目**：实现一个简单的自注意力机制，计算 Q、K、V 的注意力输出。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleSelfAttention(nn.Module):
    def __init__(self, embed_size):
        super().__init__()
        self.W_q = nn.Linear(embed_size, embed_size)
        self.W_k = nn.Linear(embed_size, embed_size)
        self.W_v = nn.Linear(embed_size, embed_size)
    
    def forward(self, x):
        Q = self.W_q(x)
        K = self.W_k(x)
        V = self.W_v(x)
        
        # 点积注意力
        scores = torch.matmul(Q, K.transpose(-2, -1))
        scores = scores / (Q.size(-1) ** 0.5)
        
        attention = F.softmax(scores, dim=-1)
        out = torch.matmul(attention, V)
        
        return out

# 测试
attn = SimpleSelfAttention(64)
x = torch.randn(2, 10, 64)
out = attn(x)
print(f"输出形状：{out.shape}")
```

</details>

### 练习 2：进阶练习 - 实现多头注意力

**题目**：实现多头注意力机制，支持 8 个头。

<details>
<summary>点击查看答案</summary>

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, embed_size, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = embed_size // num_heads
        
        self.W_q = nn.Linear(embed_size, embed_size)
        self.W_k = nn.Linear(embed_size, embed_size)
        self.W_v = nn.Linear(embed_size, embed_size)
        self.fc_out = nn.Linear(embed_size, embed_size)
    
    def forward(self, x):
        N = x.shape[0]
        seq_len = x.shape[1]
        
        Q = self.W_q(x).reshape(N, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        K = self.W_k(x).reshape(N, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        V = self.W_v(x).reshape(N, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.head_dim ** 0.5)
        attention = F.softmax(scores, dim=-1)
        out = torch.matmul(attention, V)
        
        out = out.transpose(1, 2).reshape(N, seq_len, -1)
        out = self.fc_out(out)
        
        return out

# 测试
mha = MultiHeadAttention(256, 8)
x = torch.randn(2, 10, 256)
out = mha(x)
print(f"输出形状：{out.shape}")
```

</details>

### 练习 3（挑战）：综合练习 - 完整 Transformer 编码器

**题目**：实现一个完整的 Transformer 编码器，包括词嵌入、位置编码、多层编码器。

<details>
<summary>点击查看答案</summary>

```python
class TransformerEncoder(nn.Module):
    def __init__(self, vocab_size, embed_size, num_heads, num_layers):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_size)
        self.pos_encoding = PositionalEncoding(embed_size)
        
        self.encoder_layers = nn.ModuleList([
            TransformerEncoderLayer(embed_size, num_heads)
            for _ in range(num_layers)
        ])
    
    def forward(self, x):
        out = self.embedding(x)
        out = self.pos_encoding(out)
        
        for layer in self.encoder_layers:
            out = layer(out)
        
        return out

class TransformerEncoderLayer(nn.Module):
    def __init__(self, embed_size, num_heads):
        super().__init__()
        self.attention = MultiHeadAttention(embed_size, num_heads)
        self.norm1 = nn.LayerNorm(embed_size)
        self.norm2 = nn.LayerNorm(embed_size)
        self.ffn = nn.Sequential(
            nn.Linear(embed_size, embed_size * 4),
            nn.ReLU(),
            nn.Linear(embed_size * 4, embed_size)
        )
    
    def forward(self, x):
        attn_out = self.attention(x)
        x = self.norm1(x + attn_out)
        
        ffn_out = self.ffn(x)
        x = self.norm2(x + ffn_out)
        
        return x

class PositionalEncoding(nn.Module):
    def __init__(self, embed_size, max_len=5000):
        super().__init__()
        pe = torch.zeros(max_len, embed_size)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        div_term = torch.exp(torch.arange(0, embed_size, 2).float() * (-torch.log(torch.tensor(10000.0)) / embed_size))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))
    
    def forward(self, x):
        return x + self.pe[:, :x.size(1), :]

# 测试
encoder = TransformerEncoder(vocab_size=10000, embed_size=256, num_heads=8, num_layers=6)
x = torch.randint(0, 10000, (2, 10))
out = encoder(x)
print(f"输出形状：{out.shape}")
```

</details>

---

## 下一章预告

下一章我们会学习 **BERT 模型深度解析**——也就是基于 Transformer 的预训练语言模型。你会学到 BERT 的预训练任务（MLM、NSP）、微调策略、下游应用。BERT 是 NLP 的重要里程碑，开启了预训练时代。
