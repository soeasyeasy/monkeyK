---
title: "第3章：Transformer 架构详解"
description: "编码器-解码器结构、前馈网络、残差连接、Layer Normalization、位置编码"
---

# 第3章：Transformer 架构详解

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Transformer 的整体架构是什么样的？
- 编码器和解码器有什么区别？
- 前馈网络在 Transformer 中起什么作用？
- 为什么要用残差连接和 Layer Normalization？
- 位置编码是怎么工作的？

这一章就是为了解答这些问题。我们会从 **Transformer 的整体架构** 开始，逐步学习每个组件的作用和实现。

---

## 1 为什么需要 Transformer 架构？

### 痛点分析

上一章我们学了注意力机制，但单个注意力层是不够的。我们需要：
- 多层堆叠来学习复杂的特征
- 保持训练的稳定性
- 捕捉位置信息

**RNN 的问题**：
- ❌ 必须顺序计算，无法并行
- ❌ 长距离依赖难以捕捉
- ❌ 梯度消失/爆炸问题

### 解决方案

**Transformer 架构** 通过以下组件解决了这些问题：

1. **编码器-解码器结构**：分离输入理解和输出生成
2. **多层堆叠**：学习层次化的特征表示
3. **残差连接**：解决梯度消失问题
4. **Layer Normalization**：稳定训练过程
5. **位置编码**：注入位置信息

打个比方：

> Transformer 就像一个工厂流水线：原材料（输入）进入后，经过多个加工站（多层 Transformer 层），每个站都有质检（Layer Norm）和快速通道（残差连接），最后产出成品（输出）。

> **一句话总结**：Transformer 架构通过精心设计的组件，实现了高效、稳定的序列到序列学习。

---

## 2 核心原理

### 2.1 Transformer 整体架构

**Transformer 由两部分组成**：

| 组件 | 作用 | 层数 |
| --- | --- | --- |
| **编码器（Encoder）** | 理解输入序列 | 6 层（原论文） |
| **解码器（Decoder）** | 生成输出序列 | 6 层（原论文） |

**架构图**：

```
输入 → [编码器] × N → 编码器输出
                          ↓
目标 → [解码器] × N → 输出
```

**每一层包含**：

**编码器层**：
1. 多头自注意力（Multi-Head Self-Attention）
2. 前馈神经网络（Feed-Forward Network）
3. 残差连接 + Layer Norm（每个子层后）

**解码器层**：
1. 掩码多头自注意力（Masked Multi-Head Self-Attention）
2. 多头编码器-解码器注意力（Multi-Head Encoder-Decoder Attention）
3. 前馈神经网络
4. 残差连接 + Layer Norm（每个子层后）

### 2.2 编码器（Encoder）

**编码器的任务**：将输入序列转换为一组上下文表示。

**编码器层结构**：

```python
class EncoderLayer:
    def __init__(self, d_model, num_heads, d_ff, dropout):
        """
        编码器层初始化
        
        参数：
        - d_model: 模型维度（如 512）
        - num_heads: 注意力头数（如 8）
        - d_ff: 前馈网络隐藏层维度（如 2048）
        - dropout: dropout 率
        """
        self.self_attention = MultiHeadAttention(d_model, num_heads)
        self.feed_forward = FeedForward(d_model, d_ff)
        self.norm1 = LayerNorm(d_model)
        self.norm2 = LayerNorm(d_model)
        self.dropout1 = nn.Dropout(dropout)
        self.dropout2 = nn.Dropout(dropout)
    
    def forward(self, x, mask=None):
        """
        前向传播
        
        参数：
        - x: 输入，形状 (batch, seq_len, d_model)
        - mask: 掩码（可选）
        """
        # 第一步：多头自注意力 + 残差连接 + Layer Norm
        attention_out = self.self_attention(x, x, x, mask)
        attention_out = self.dropout1(attention_out)
        x = self.norm1(x + attention_out)  # 残差连接
        
        # 第二步：前馈网络 + 残差连接 + Layer Norm
        ff_out = self.feed_forward(x)
        ff_out = self.dropout2(ff_out)
        x = self.norm2(x + ff_out)  # 残差连接
        
        return x
```

**工作原理**：

1. **自注意力层**：让每个位置都能关注所有其他位置
2. **前馈网络**：对每个位置独立进行非线性变换
3. **残差连接**：缓解梯度消失，帮助训练深层网络
4. **Layer Normalization**：稳定训练，加速收敛

### 2.3 解码器（Decoder）

**解码器的任务**：基于编码器输出，自回归地生成目标序列。

**解码器层结构**：

```python
class DecoderLayer:
    def __init__(self, d_model, num_heads, d_ff, dropout):
        """
        解码器层初始化
        """
        self.masked_self_attention = MultiHeadAttention(d_model, num_heads)
        self.cross_attention = MultiHeadAttention(d_model, num_heads)
        self.feed_forward = FeedForward(d_model, d_ff)
        self.norm1 = LayerNorm(d_model)
        self.norm2 = LayerNorm(d_model)
        self.norm3 = LayerNorm(d_model)
        self.dropout1 = nn.Dropout(dropout)
        self.dropout2 = nn.Dropout(dropout)
        self.dropout3 = nn.Dropout(dropout)
    
    def forward(self, x, encoder_out, src_mask=None, tgt_mask=None):
        """
        前向传播
        
        参数：
        - x: 解码器输入（目标序列）
        - encoder_out: 编码器输出
        - src_mask: 源序列掩码
        - tgt_mask: 目标序列掩码（防止看到未来）
        """
        # 第一步：掩码自注意力 + 残差 + Layer Norm
        # 使用掩码防止看到未来的词
        masked_attention_out = self.masked_self_attention(x, x, x, tgt_mask)
        masked_attention_out = self.dropout1(masked_attention_out)
        x = self.norm1(x + masked_attention_out)
        
        # 第二步：交叉注意力 + 残差 + Layer Norm
        # Query 来自解码器，Key/Value 来自编码器
        cross_attention_out = self.cross_attention(x, encoder_out, encoder_out, src_mask)
        cross_attention_out = self.dropout2(cross_attention_out)
        x = self.norm2(x + cross_attention_out)
        
        # 第三步：前馈网络 + 残差 + Layer Norm
        ff_out = self.feed_forward(x)
        ff_out = self.dropout3(ff_out)
        x = self.norm3(x + ff_out)
        
        return x
```

**工作原理**：

1. **掩码自注意力**：防止解码器看到未来的词（自回归）
2. **交叉注意力**：让解码器关注编码器的输出
3. **前馈网络**：非线性变换
4. **残差连接 + Layer Norm**：稳定训练

### 2.4 前馈神经网络（Feed-Forward Network）

**前馈网络** 对每个位置独立进行非线性变换。

**结构**：

```python
class FeedForward(nn.Module):
    def __init__(self, d_model, d_ff):
        """
        前馈网络初始化
        
        参数：
        - d_model: 输入/输出维度（如 512）
        - d_ff: 隐藏层维度（如 2048）
        """
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)
        self.relu = nn.ReLU()
    
    def forward(self, x):
        """
        前向传播
        
        参数：
        - x: 输入，形状 (batch, seq_len, d_model)
        
        返回：
        - 输出，形状 (batch, seq_len, d_model)
        """
        # 第一步：线性变换 + ReLU
        x = self.linear1(x)  # (batch, seq_len, d_ff)
        x = self.relu(x)
        
        # 第二步：线性变换
        x = self.linear2(x)  # (batch, seq_len, d_model)
        
        return x
```

**作用**：
- 对每个位置独立进行非线性变换
- 增加模型的表达能力
- 通常 d_ff = 4 * d_model

### 2.5 残差连接（Residual Connection）

**残差连接** 是深度学习的核心技术之一。

**公式**：

```
output = LayerNorm(x + Sublayer(x))
```

**代码实现**：

```python
class ResidualConnection(nn.Module):
    def __init__(self, d_model, dropout):
        super().__init__()
        self.norm = LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x, sublayer):
        """
        残差连接
        
        参数：
        - x: 输入
        - sublayer: 子层函数（如注意力或前馈网络）
        """
        # 残差连接：x + Sublayer(x)
        return x + self.dropout(sublayer(self.norm(x)))
```

**为什么需要残差连接？**

1. **缓解梯度消失**：梯度可以直接通过跳跃连接回传
2. **帮助训练深层网络**：让网络更容易学习恒等映射
3. **保留原始信息**：子层只需要学习残差

打个比方：

> 残差连接就像高速公路的应急车道，即使主路堵车（梯度消失），车辆（梯度）还是可以通过应急车道快速到达目的地。

### 2.6 Layer Normalization

**Layer Normalization** 用于稳定训练过程。

**公式**：

```
LayerNorm(x) = γ * (x - μ) / (σ + ε) + β
```

其中：
- μ 是均值
- σ 是标准差
- γ 和 β 是可学习的参数
- ε 是小常数，防止除以 0

**代码实现**：

```python
class LayerNorm(nn.Module):
    def __init__(self, d_model, eps=1e-6):
        """
        Layer Normalization
        
        参数：
        - d_model: 特征维度
        - eps: 小常数，防止除以 0
        """
        super().__init__()
        self.eps = eps
        # 可学习的参数
        self.gamma = nn.Parameter(torch.ones(d_model))
        self.beta = nn.Parameter(torch.zeros(d_model))
    
    def forward(self, x):
        """
        前向传播
        
        参数：
        - x: 输入，形状 (batch, seq_len, d_model)
        """
        # 计算均值和标准差（在最后一个维度上）
        mean = x.mean(dim=-1, keepdim=True)
        std = x.std(dim=-1, keepdim=True)
        
        # 归一化
        x_norm = (x - mean) / (std + self.eps)
        
        # 缩放和平移
        output = self.gamma * x_norm + self.beta
        
        return output
```

**Layer Norm vs Batch Norm**：

| 特性 | Layer Norm | Batch Norm |
| --- | --- | --- |
| 归一化维度 | 特征维度 | batch 维度 |
| 依赖 batch size | 否 | 是 |
| 适用场景 | RNN、Transformer | CNN |
| 推理时 | 不需要统计量 | 需要移动平均 |

### 2.7 位置编码（Positional Encoding）

**问题**：Transformer 没有循环结构，无法感知词序。

**解决方案**：添加位置编码，注入位置信息。

**正弦位置编码公式**：

```
PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

其中：
- pos 是位置索引
- i 是维度索引
- d_model 是模型维度

**代码实现**：

```python
class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        """
        位置编码初始化
        
        参数：
        - d_model: 模型维度
        - max_len: 最大序列长度
        """
        super().__init__()
        
        # 创建位置编码矩阵
        pe = torch.zeros(max_len, d_model)
        
        # 位置索引 (max_len, 1)
        position = torch.arange(0, max_len).unsqueeze(1)
        
        # 计算分母
        div_term = torch.exp(
            torch.arange(0, d_model, 2) * -(math.log(10000.0) / d_model)
        )
        
        # 偶数维度用 sin
        pe[:, 0::2] = torch.sin(position * div_term)
        # 奇数维度用 cos
        pe[:, 1::2] = torch.cos(position * div_term)
        
        # 增加 batch 维度 (1, max_len, d_model)
        pe = pe.unsqueeze(0)
        
        # 注册为 buffer（不参与训练，但会随模型保存）
        self.register_buffer('pe', pe)
    
    def forward(self, x):
        """
        前向传播
        
        参数：
        - x: 词嵌入，形状 (batch, seq_len, d_model)
        """
        # 将位置编码加到词嵌入上
        x = x + self.pe[:, :x.size(1), :]
        return x
```

**为什么用正弦和余弦？**

1. **相对位置**：对于任意固定偏移量 k，PE(pos+k) 可以表示为 PE(pos) 的线性函数
2. **泛化能力**：可以处理比训练时更长的序列
3. **确定性**：不需要学习，直接计算

---

## 3 基础用法

### 3.1 完整的 Transformer 实现

```python
import torch
import torch.nn as nn
import math

class Transformer(nn.Module):
    def __init__(
        self,
        src_vocab_size,
        tgt_vocab_size,
        d_model=512,
        num_heads=8,
        num_layers=6,
        d_ff=2048,
        max_len=5000,
        dropout=0.1
    ):
        """
        Transformer 模型
        
        参数：
        - src_vocab_size: 源词表大小
        - tgt_vocab_size: 目标词表大小
        - d_model: 模型维度
        - num_heads: 注意力头数
        - num_layers: 编码器/解码器层数
        - d_ff: 前馈网络隐藏层维度
        - max_len: 最大序列长度
        - dropout: dropout 率
        """
        super().__init__()
        
        # 词嵌入
        self.src_embedding = nn.Embedding(src_vocab_size, d_model)
        self.tgt_embedding = nn.Embedding(tgt_vocab_size, d_model)
        
        # 位置编码
        self.positional_encoding = PositionalEncoding(d_model, max_len)
        
        # 编码器
        self.encoder_layers = nn.ModuleList([
            EncoderLayer(d_model, num_heads, d_ff, dropout)
            for _ in range(num_layers)
        ])
        
        # 解码器
        self.decoder_layers = nn.ModuleList([
            DecoderLayer(d_model, num_heads, d_ff, dropout)
            for _ in range(num_layers)
        ])
        
        # 输出层
        self.output_layer = nn.Linear(d_model, tgt_vocab_size)
        
        self.d_model = d_model
    
    def encode(self, src, src_mask=None):
        """
        编码
        
        参数：
        - src: 源序列，形状 (batch, src_len)
        - src_mask: 源序列掩码
        """
        # 词嵌入 + 位置编码
        x = self.src_embedding(src) * math.sqrt(self.d_model)
        x = self.positional_encoding(x)
        
        # 通过编码器层
        for layer in self.encoder_layers:
            x = layer(x, src_mask)
        
        return x
    
    def decode(self, tgt, encoder_out, src_mask=None, tgt_mask=None):
        """
        解码
        
        参数：
        - tgt: 目标序列，形状 (batch, tgt_len)
        - encoder_out: 编码器输出
        - src_mask: 源序列掩码
        - tgt_mask: 目标序列掩码
        """
        # 词嵌入 + 位置编码
        x = self.tgt_embedding(tgt) * math.sqrt(self.d_model)
        x = self.positional_encoding(x)
        
        # 通过解码器层
        for layer in self.decoder_layers:
            x = layer(x, encoder_out, src_mask, tgt_mask)
        
        return x
    
    def forward(self, src, tgt, src_mask=None, tgt_mask=None):
        """
        前向传播
        
        参数：
        - src: 源序列
        - tgt: 目标序列
        - src_mask: 源序列掩码
        - tgt_mask: 目标序列掩码
        """
        # 编码
        encoder_out = self.encode(src, src_mask)
        
        # 解码
        decoder_out = self.decode(tgt, encoder_out, src_mask, tgt_mask)
        
        # 输出
        output = self.output_layer(decoder_out)
        
        return output

# 使用示例
src_vocab_size = 10000
tgt_vocab_size = 10000
model = Transformer(src_vocab_size, tgt_vocab_size)

# 输入
batch_size = 2
src_len = 10
tgt_len = 8

src = torch.randint(0, src_vocab_size, (batch_size, src_len))
tgt = torch.randint(0, tgt_vocab_size, (batch_size, tgt_len))

# 前向传播
output = model(src, tgt)

print("输出形状:", output.shape)  # (2, 8, 10000)
```

### 3.2 使用 PyTorch 内置 Transformer

```python
import torch
import torch.nn as nn

# 创建 Transformer 模型
d_model = 512
num_heads = 8
num_layers = 6
d_ff = 2048
dropout = 0.1

transformer = nn.Transformer(
    d_model=d_model,
    nhead=num_heads,
    num_encoder_layers=num_layers,
    num_decoder_layers=num_layers,
    dim_feedforward=d_ff,
    dropout=dropout,
    batch_first=True
)

# 输入
batch_size = 2
src_len = 10
tgt_len = 8

src = torch.randn(batch_size, src_len, d_model)
tgt = torch.randn(batch_size, tgt_len, d_model)

# 前向传播
output = transformer(src, tgt)

print("输出形状:", output.shape)  # (2, 8, 512)
```

---

## 4 进阶用法

### 4.1 掩码生成

```python
def create_masks(src, tgt, pad_idx=0):
    """
    创建源序列和目标序列的掩码
    
    参数：
    - src: 源序列，形状 (batch, src_len)
    - tgt: 目标序列，形状 (batch, tgt_len)
    - pad_idx: padding 的索引
    """
    # 源序列掩码：padding 位置为 False
    src_mask = (src != pad_idx).unsqueeze(1).unsqueeze(2)
    
    # 目标序列掩码：padding 位置为 False + 防止看到未来
    tgt_len = tgt.size(1)
    tgt_subsequent_mask = torch.tril(torch.ones(tgt_len, tgt_len))
    tgt_pad_mask = (tgt != pad_idx).unsqueeze(1).unsqueeze(2)
    
    # 组合掩码
    tgt_mask = tgt_subsequent_mask & tgt_pad_mask
    
    return src_mask, tgt_mask

# 使用示例
src = torch.tensor([[1, 2, 3, 0, 0], [4, 5, 6, 7, 8]])
tgt = torch.tensor([[1, 2, 0, 0], [3, 4, 5, 6]])

src_mask, tgt_mask = create_masks(src, tgt, pad_idx=0)

print("源序列掩码形状:", src_mask.shape)  # (2, 1, 1, 5)
print("目标序列掩码形状:", tgt_mask.shape)  # (2, 1, 4, 4)
```

### 4.2 自定义 Transformer 层

```python
class CustomTransformerLayer(nn.Module):
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        super().__init__()
        
        # 自注意力
        self.self_attn = nn.MultiheadAttention(d_model, num_heads, dropout=dropout)
        
        # 前馈网络
        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model)
        )
        
        # Layer Norm
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        
        # Dropout
        self.dropout1 = nn.Dropout(dropout)
        self.dropout2 = nn.Dropout(dropout)
    
    def forward(self, x, mask=None):
        # 自注意力 + 残差 + Layer Norm
        attn_out = self.self_attn(x, x, x, attn_mask=mask)[0]
        x = self.norm1(x + self.dropout1(attn_out))
        
        # 前馈网络 + 残差 + Layer Norm
        ff_out = self.feed_forward(x)
        x = self.norm2(x + self.dropout2(ff_out))
        
        return x
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **编码器-解码器结构** | 编码器理解输入，解码器生成输出 |
| **多头自注意力** | 让每个位置关注所有其他位置 |
| **交叉注意力** | 解码器关注编码器输出 |
| **前馈网络** | 对每个位置独立进行非线性变换 |
| **残差连接** | 缓解梯度消失，帮助训练深层网络 |
| **Layer Normalization** | 稳定训练，加速收敛 |
| **位置编码** | 注入位置信息，使用正弦/余弦函数 |

---

## 6 新手常见误区

### 误区 1："编码器和解码器结构完全一样"

**错！** 它们有重要区别：

| 特性 | 编码器 | 解码器 |
| --- | --- | --- |
| 自注意力 | 无掩码 | 有掩码（防止看到未来） |
| 交叉注意力 | 无 | 有 |
| 用途 | 理解输入 | 生成输出 |

**正确做法**：
- 编码器使用双向自注意力
- 解码器使用掩码自注意力 + 交叉注意力

### 误区 2："Layer Norm 和 Batch Norm 可以互换"

**错！** 它们有不同的适用场景：

| 特性 | Layer Norm | Batch Norm |
| --- | --- | --- |
| 归一化维度 | 特征维度 | batch 维度 |
| 依赖 batch size | 否 | 是 |
| 适用场景 | RNN、Transformer | CNN |

**正确做法**：
- Transformer 使用 Layer Norm
- CNN 使用 Batch Norm

### 误区 3："位置编码需要训练"

**错！** 标准的正弦位置编码是**固定的**，不需要训练。

**为什么错**：
- 正弦位置编码是确定性的
- 直接通过公式计算
- 不需要梯度更新

**正确做法**：
- 使用固定的正弦位置编码
- 或者使用可学习的位置编码（但效果不一定更好）

### 误区 4："前馈网络在每个位置共享参数"

**不完全对。** 前馈网络**参数是共享的**，但**对每个位置独立应用**。

**解释**：
- 所有位置使用同一个前馈网络
- 但每个位置独立计算
- 类似于 1x1 卷积

**正确做法**：
- 前馈网络参数共享
- 对每个位置独立应用

### 误区 5："Transformer 层数越多越好"

**不完全对。** 层数过多会导致：
- 训练困难（梯度消失/爆炸）
- 过拟合
- 计算成本高

**正确做法**：
- 通常使用 6-12 层
- 根据任务和数据量调整
- 使用残差连接帮助训练

---

## 7 动手练习

### 练习 1：基础练习 - 实现前馈网络

**题目**：实现一个前馈网络，包含两个线性层和 ReLU 激活。

**要求**：
- 输入维度 d_model = 512
- 隐藏层维度 d_ff = 2048
- 使用 ReLU 激活

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class FeedForward(nn.Module):
    def __init__(self, d_model, d_ff, dropout=0.1):
        """
        前馈网络
        
        参数：
        - d_model: 输入/输出维度
        - d_ff: 隐藏层维度
        - dropout: dropout 率
        """
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x):
        """
        前向传播
        
        参数：
        - x: 输入，形状 (batch, seq_len, d_model)
        """
        x = self.linear1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.linear2(x)
        return x

# 测试
d_model = 512
d_ff = 2048
ff = FeedForward(d_model, d_ff)

x = torch.randn(2, 10, d_model)
output = ff(x)

print("输入形状:", x.shape)      # (2, 10, 512)
print("输出形状:", output.shape)  # (2, 10, 512)
```

</details>

### 练习 2：进阶练习 - 实现 Layer Normalization

**题目**：实现 Layer Normalization，对最后一个维度进行归一化。

**要求**：
- 计算均值和标准差
- 归一化后应用可学习的缩放和平移

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class LayerNorm(nn.Module):
    def __init__(self, d_model, eps=1e-6):
        """
        Layer Normalization
        
        参数：
        - d_model: 特征维度
        - eps: 小常数，防止除以 0
        """
        super().__init__()
        self.eps = eps
        self.gamma = nn.Parameter(torch.ones(d_model))
        self.beta = nn.Parameter(torch.zeros(d_model))
    
    def forward(self, x):
        """
        前向传播
        
        参数：
        - x: 输入，形状 (batch, seq_len, d_model)
        """
        # 计算均值和标准差
        mean = x.mean(dim=-1, keepdim=True)
        std = x.std(dim=-1, keepdim=True)
        
        # 归一化
        x_norm = (x - mean) / (std + self.eps)
        
        # 缩放和平移
        output = self.gamma * x_norm + self.beta
        
        return output

# 测试
d_model = 512
ln = LayerNorm(d_model)

x = torch.randn(2, 10, d_model)
output = ln(x)

print("输入形状:", x.shape)      # (2, 10, 512)
print("输出形状:", output.shape)  # (2, 10, 512)
print("输出均值:", output.mean(dim=-1))  # 应该接近 0
print("输出标准差:", output.std(dim=-1))  # 应该接近 1
```

</details>

### 练习 3（挑战）：综合练习 - 实现完整的 Transformer 编码器层

**题目**：实现一个完整的 Transformer 编码器层，包含自注意力、前馈网络、残差连接和 Layer Norm。

**要求**：
- 使用多头自注意力
- 添加残差连接
- 应用 Layer Normalization

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class EncoderLayer(nn.Module):
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        """
        编码器层
        
        参数：
        - d_model: 模型维度
        - num_heads: 注意力头数
        - d_ff: 前馈网络隐藏层维度
        - dropout: dropout 率
        """
        super().__init__()
        
        # 多头自注意力
        self.self_attn = nn.MultiheadAttention(d_model, num_heads, dropout=dropout)
        
        # 前馈网络
        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model)
        )
        
        # Layer Norm
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        
        # Dropout
        self.dropout1 = nn.Dropout(dropout)
        self.dropout2 = nn.Dropout(dropout)
    
    def forward(self, x, mask=None):
        """
        前向传播
        
        参数：
        - x: 输入，形状 (batch, seq_len, d_model)
        - mask: 掩码（可选）
        """
        # 第一步：自注意力 + 残差 + Layer Norm
        attn_out = self.self_attn(x, x, x, attn_mask=mask)[0]
        x = self.norm1(x + self.dropout1(attn_out))
        
        # 第二步：前馈网络 + 残差 + Layer Norm
        ff_out = self.feed_forward(x)
        x = self.norm2(x + self.dropout2(ff_out))
        
        return x

# 测试
d_model = 512
num_heads = 8
d_ff = 2048

encoder_layer = EncoderLayer(d_model, num_heads, d_ff)

x = torch.randn(2, 10, d_model)
output = encoder_layer(x)

print("输入形状:", x.shape)      # (2, 10, 512)
print("输出形状:", output.shape)  # (2, 10, 512)
```

</details>

---

## 下一章预告

下一章我们会学习 **位置编码与词嵌入**——这是 Transformer 的重要组件。你会学到不同的位置编码方法（正弦编码、可学习编码、RoPE）、词嵌入技术、Tokenization 等关键知识。这些对于理解模型如何处理输入至关重要。
