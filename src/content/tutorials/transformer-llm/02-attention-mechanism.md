---
title: "第2章：注意力机制深度解析"
description: "自注意力机制原理、Query/Key/Value、缩放点积注意力、多头注意力、交叉注意力"
---

# 第2章：注意力机制深度解析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 注意力机制到底是什么？为什么要用 Q、K、V 三个向量？
- 自注意力和上一章讲的注意力有什么区别？
- 为什么要用"多头"注意力？一个头不够吗？
- 注意力机制是怎么计算"关注度"的？

这一章就是为了解答这些问题。我们会从 **注意力机制的核心思想** 开始，逐步学习自注意力、多头注意力的原理和实现。

---

## 1 为什么需要注意力机制？

### 痛点分析

上一章我们提到，RNN 处理序列时，必须按顺序一个一个词处理，而且长距离的信息容易丢失。

**RNN 的问题**：
- ❌ 必须顺序计算，无法并行
- ❌ 长距离依赖难以捕捉
- ❌ 信息在传递过程中逐渐丢失

**例子**：
> 句子："**苹果**公司发布了一款新手机，它的性能非常强大，很多用户都喜欢**苹果**的产品。"
> 
> RNN 需要处理 20 多个词，才能理解两个"苹果"指的是同一个东西。在这个过程中，前面的信息可能已经丢失了。

### 解决方案

**注意力机制** 的核心思想：**让每个词都能直接"看到"句子中的所有其他词**，不需要通过 RNN 逐步传递。

打个比方：

> RNN 就像传话游戏，信息从第一个人传到最后一个，容易失真。注意力机制就像大家一起开会，每个人都能直接听到所有人的发言，信息不会丢失。

> **一句话总结**：注意力机制让模型能够直接关注序列中任意位置的信息，解决了长距离依赖问题。

---

## 2 核心原理

### 2.1 Query、Key、Value

注意力机制的核心是三个向量：**Query（查询）**、**Key（键）**、**Value（值）**。

**生活化类比**：

> 想象你在图书馆找书：
> - **Query**：你脑中的需求（"我想找关于深度学习的书"）
> - **Key**：每本书的标签（"机器学习"、"深度学习"、"Python 编程"...）
> - **Value**：每本书的内容
> 
> 你用 Query 去匹配每本书的 Key，找到最相关的书，然后读取它的 Value。

**数学表达**：

```
输入：序列中的每个词都有一个向量表示 x

1. 通过线性变换得到 Q、K、V
   Q = x * W_Q  （Query 向量）
   K = x * W_K  （Key 向量）
   V = x * W_V  （Value 向量）

2. 计算注意力分数
   Score = Q * K^T  （Query 和 Key 的点积）
   # 点积越大，表示越相似

3. 缩放（防止数值过大）
   Score = Score / sqrt(d_k)
   # d_k 是 Key 的维度

4. 计算注意力权重
   Attention_weights = softmax(Score)
   # softmax 将分数转换为概率分布（和为 1）

5. 加权求和得到输出
   Output = Attention_weights * V
   # 用注意力权重对 Value 加权求和
```

### 2.2 自注意力机制（Self-Attention）

**自注意力** 是 Transformer 的核心：让序列中的每个位置都能"看到"所有其他位置。

**与上一章注意力的区别**：

| 特性 | 传统注意力（Seq2Seq） | 自注意力（Transformer） |
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
   # Q * K^T：计算所有词之间的相关性
   # / sqrt(d_k)：缩放，防止数值过大导致 softmax 梯度消失

3. 计算注意力权重
   Attention_weights = softmax(Score)
   # softmax：将分数转换为概率分布（和为 1）

4. 计算输出
   Output = Attention_weights * V
   # 用注意力权重对 Value 加权求和
```

**代码实现**：

```python
import torch
import torch.nn.functional as F
import math

def self_attention(X, W_Q, W_K, W_V):
    """
    自注意力机制实现
    
    参数：
    - X: 输入序列，形状 (batch_size, seq_len, d_model)
    - W_Q, W_K, W_V: 线性变换矩阵
    """
    # 第一步：计算 Q、K、V
    # 使用矩阵乘法进行线性变换
    Q = torch.matmul(X, W_Q)  # (batch, seq_len, d_k)
    K = torch.matmul(X, W_K)  # (batch, seq_len, d_k)
    V = torch.matmul(X, W_V)  # (batch, seq_len, d_v)
    
    # 第二步：计算注意力分数
    # Q * K^T：计算所有词对之间的相关性
    d_k = Q.size(-1)  # 获取维度 d_k
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    # scores 形状：(batch, seq_len, seq_len)
    # scores[i][j] 表示第 i 个词对第 j 个词的注意力分数
    
    # 第三步：计算注意力权重
    # 使用 softmax 将分数转换为概率分布
    attention_weights = F.softmax(scores, dim=-1)
    # dim=-1 表示对最后一维（每个词对所有词的分数）做 softmax
    
    # 第四步：计算输出
    # 用注意力权重对 Value 加权求和
    output = torch.matmul(attention_weights, V)
    # output 形状：(batch, seq_len, d_v)
    
    return output, attention_weights
```

**示例演示**：

```python
# 假设我们有一个 3 词的句子："我 爱 学习"
batch_size = 1
seq_len = 3      # 3 个词
d_model = 4      # 词向量维度
d_k = 4          # Key 的维度
d_v = 4          # Value 的维度

# 输入序列（3 个词的向量）
X = torch.randn(batch_size, seq_len, d_model)

# 线性变换矩阵
W_Q = torch.randn(d_model, d_k)
W_K = torch.randn(d_model, d_k)
W_V = torch.randn(d_model, d_v)

# 计算自注意力
output, weights = self_attention(X, W_Q, W_K, W_V)

print("输入形状:", X.shape)              # (1, 3, 4)
print("输出形状:", output.shape)          # (1, 3, 4)
print("注意力权重形状:", weights.shape)    # (1, 3, 3)
print("注意力权重:\n", weights[0])
# 每行和为 1，表示一个词对所有词的关注度
```

> **原理**：自注意力让每个词都能"看到"句子中的所有其他词，从而捕捉上下文关系。比如"爱"这个词会关注"我"和"学习"，理解"谁爱什么"。

### 2.3 多头注意力（Multi-Head Attention）

**为什么需要多头？**

单头注意力只能捕捉一种关系模式。但语言中的关系是多样的：
- 语法关系：主谓宾
- 语义关系：同义、反义
- 指代关系：代词指代谁

**多头注意力** 就是运行多个自注意力，每个"头"学习不同的关系模式。

打个比方：

> 单头注意力就像一个侦探只关注一种线索；多头注意力就像多个侦探，每个关注不同类型的线索（动机、证据、时间线...），最后汇总所有发现。

**计算过程**：

```
1. 将 Q、K、V 分成 h 个头
   每个头的维度 = d_model / h
   
   例如：d_model = 512, h = 8
   每个头的维度 = 512 / 8 = 64

2. 每个头独立计算注意力
   head_1 = Attention(Q_1, K_1, V_1)
   head_2 = Attention(Q_2, K_2, V_2)
   ...
   head_8 = Attention(Q_8, K_8, V_8)

3. 拼接所有头的输出
   MultiHead = Concat(head_1, head_2, ..., head_8)
   
4. 线性变换
   Output = MultiHead * W_O
```

**代码实现**：

```python
class MultiHeadAttention:
    def __init__(self, d_model, num_heads):
        """
        多头注意力初始化
        
        参数：
        - d_model: 模型维度（如 512）
        - num_heads: 头数（如 8）
        """
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads  # 每个头的维度
        
        # 线性变换矩阵
        self.W_Q = torch.randn(d_model, d_model)
        self.W_K = torch.randn(d_model, d_model)
        self.W_V = torch.randn(d_model, d_model)
        self.W_O = torch.randn(d_model, d_model)
    
    def split_heads(self, x, batch_size):
        """
        将最后一个维度分成 (num_heads, d_k)
        例如：(batch, seq_len, 512) -> (batch, num_heads, seq_len, d_k)
        """
        x = x.view(batch_size, -1, self.num_heads, self.d_k)
        return x.transpose(1, 2)  # 转置使 head 在第 2 维
    
    def forward(self, X):
        batch_size = X.size(0)
        
        # 第一步：线性变换
        Q = torch.matmul(X, self.W_Q)
        K = torch.matmul(X, self.W_K)
        V = torch.matmul(X, self.W_V)
        
        # 第二步：分成多个头
        Q = self.split_heads(Q, batch_size)  # (batch, heads, seq, d_k)
        K = self.split_heads(K, batch_size)
        V = self.split_heads(V, batch_size)
        
        # 第三步：每个头计算注意力
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        attention_weights = F.softmax(scores, dim=-1)
        heads = torch.matmul(attention_weights, V)
        
        # 第四步：拼接所有头
        # heads 形状：(batch, heads, seq, d_k)
        # 需要变回：(batch, seq, d_model)
        heads = heads.transpose(1, 2).contiguous()
        concat = heads.view(batch_size, -1, self.d_model)
        
        # 第五步：线性变换
        output = torch.matmul(concat, self.W_O)
        
        return output
```

**示例**：

```python
# 8 头注意力
d_model = 512
num_heads = 8
mha = MultiHeadAttention(d_model, num_heads)

# 输入：(batch=2, seq_len=10, d_model=512)
X = torch.randn(2, 10, 512)

# 输出：(batch=2, seq_len=10, d_model=512)
output = mha.forward(X)

print("输入形状:", X.shape)      # (2, 10, 512)
print("输出形状:", output.shape)  # (2, 10, 512)
```

> **原理**：多头注意力让模型能从多个角度理解文本，就像多个专家从不同视角分析问题，最后综合意见。

---

## 3 基础用法

### 3.1 使用 PyTorch 实现注意力机制

**完整代码**：

```python
import torch
import torch.nn as nn
import math

class ScaledDotProductAttention:
    """
    缩放点积注意力
    这是最基础的注意力机制
    """
    def __init__(self, d_k):
        """
        参数：
        - d_k: Key 的维度，用于缩放
        """
        self.d_k = d_k
    
    def forward(self, Q, K, V, mask=None):
        """
        前向传播
        
        参数：
        - Q: Query，形状 (batch, seq_len, d_k)
        - K: Key，形状 (batch, seq_len, d_k)
        - V: Value，形状 (batch, seq_len, d_v)
        - mask: 掩码，用于遮蔽某些位置（可选）
        """
        # 第一步：计算注意力分数
        # Q * K^T：(batch, seq_len, d_k) * (batch, d_k, seq_len)
        # 结果：(batch, seq_len, seq_len)
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        
        # 第二步：应用掩码（如果有）
        # 掩码位置设为 -inf，softmax 后会变成 0
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))
        
        # 第三步：softmax 归一化
        attention_weights = torch.softmax(scores, dim=-1)
        
        # 第四步：加权求和
        output = torch.matmul(attention_weights, V)
        
        return output, attention_weights

# 使用示例
batch_size = 2
seq_len = 5
d_k = 64
d_v = 64

Q = torch.randn(batch_size, seq_len, d_k)
K = torch.randn(batch_size, seq_len, d_k)
V = torch.randn(batch_size, seq_len, d_v)

attention = ScaledDotProductAttention(d_k)
output, weights = attention.forward(Q, K, V)

print("输出形状:", output.shape)          # (2, 5, 64)
print("注意力权重形状:", weights.shape)    # (2, 5, 5)
```

### 3.2 PyTorch 内置多头注意力

**使用 nn.MultiheadAttention**：

```python
import torch
import torch.nn as nn

# 创建多头注意力层
d_model = 512      # 模型维度
num_heads = 8      # 头数
dropout = 0.1      # dropout 率

mha = nn.MultiheadAttention(
    embed_dim=d_model,      # 输入维度
    num_heads=num_heads,    # 头数
    dropout=dropout,        # dropout 率
    batch_first=True        # 输入形状 (batch, seq, feature)
)

# 输入
batch_size = 2
seq_len = 10
X = torch.randn(batch_size, seq_len, d_model)

# 自注意力（Q=K=Value=X）
output, attention_weights = mha(
    query=X,
    key=X,
    value=X
)

print("输出形状:", output.shape)              # (2, 10, 512)
print("注意力权重形状:", attention_weights.shape)  # (2, 10, 10)
```

> **原理**：PyTorch 的 `nn.MultiheadAttention` 已经实现了多头注意力的所有细节，包括线性变换、分割头、计算注意力、拼接等。

---

## 4 进阶用法

### 4.1 掩码注意力（Masked Attention）

**应用场景**：在解码器中，防止模型看到未来的词。

**代码实现**：

```python
def create_decoder_mask(seq_len):
    """
    创建解码器掩码
    返回一个上三角矩阵，未来位置为 -inf
    """
    # 创建上三角矩阵（diagonal=1 表示对角线以上为 1）
    mask = torch.triu(torch.ones(seq_len, seq_len), diagonal=1)
    # 将 1 替换为 -inf
    mask = mask.masked_fill(mask == 1, float('-inf'))
    return mask

# 示例
seq_len = 5
mask = create_decoder_mask(seq_len)
print("掩码矩阵:\n", mask)
# tensor([[  0., -inf, -inf, -inf, -inf],
#         [  0.,   0., -inf, -inf, -inf],
#         [  0.,   0.,   0., -inf, -inf],
#         [  0.,   0.,   0.,   0., -inf],
#         [  0.,   0.,   0.,   0.,   0.]])

# 使用掩码
Q = torch.randn(1, seq_len, 64)
K = torch.randn(1, seq_len, 64)
V = torch.randn(1, seq_len, 64)

attention = ScaledDotProductAttention(64)
output, weights = attention.forward(Q, K, V, mask=mask)

print("注意力权重:\n", weights[0])
# 未来位置的权重为 0
```

> **原理**：掩码让模型在生成第 i 个词时，只能看到前 i-1 个词，保证自回归生成的正确性。

### 4.2 交叉注意力（Cross-Attention）

**应用场景**：在解码器中，让解码器关注编码器的输出。

**代码实现**：

```python
# 交叉注意力：Query 来自解码器，Key/Value 来自编码器
d_model = 512
num_heads = 8

cross_attention = nn.MultiheadAttention(
    embed_dim=d_model,
    num_heads=num_heads,
    batch_first=True
)

# 解码器的输出作为 Query
decoder_output = torch.randn(2, 10, d_model)  # (batch, tgt_len, d_model)

# 编码器的输出作为 Key 和 Value
encoder_output = torch.randn(2, 15, d_model)  # (batch, src_len, d_model)

# 交叉注意力
output, attention_weights = cross_attention(
    query=decoder_output,      # Query 来自解码器
    key=encoder_output,        # Key 来自编码器
    value=encoder_output       # Value 来自编码器
)

print("输出形状:", output.shape)              # (2, 10, 512)
print("注意力权重形状:", attention_weights.shape)  # (2, 10, 15)
# 10 是目标序列长度，15 是源序列长度
```

> **原理**：交叉注意力让解码器能够"看到"编码器的输出，从而生成与输入相关的输出。比如在机器翻译中，解码器生成每个词时，会关注源句子的相关部分。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Query/Key/Value** | 注意力的三个核心向量，Query 用于查询，Key 用于匹配，Value 是实际内容 |
| **缩放点积注意力** | 使用点积计算相似度，除以 sqrt(d_k) 防止数值过大 |
| **自注意力** | 序列内部的注意力，Q/K/V 来自同一序列 |
| **多头注意力** | 运行多个注意力头，每个头学习不同的关系模式 |
| **掩码注意力** | 使用掩码遮蔽某些位置，防止看到未来信息 |
| **交叉注意力** | Query 和 Key/Value 来自不同序列，用于编码器-解码器交互 |

---

## 6 新手常见误区

### 误区 1："注意力权重必须是对称的"

**错！** 注意力权重矩阵**不一定是对称的**。

**为什么错**：
- "我 爱 学习" 中，"爱"对"我"的注意力权重 ≠ "我"对"爱"的注意力权重
- 注意力是有方向的：Query → Key

**正确做法**：
- 注意力权重矩阵可以是非对称的
- 每个位置对其他位置的关注度可以不同

### 误区 2："多头注意力越多越好"

**不是的。** 头数过多会导致：
- 每个头的维度太小，表达能力下降
- 计算量增加
- 容易过拟合

**正确做法**：
- 通常设置 8-16 个头
- 确保 d_model 能被 num_heads 整除
- 根据任务调整，不是越多越好

### 误区 3："自注意力和交叉注意力是一样的"

**错！** 它们有本质区别：

| 特性 | 自注意力 | 交叉注意力 |
| --- | --- | --- |
| Q/K/V 来源 | 同一序列 | 不同序列 |
| 用途 | 序列内部交互 | 两个序列交互 |
| 位置 | 编码器、解码器 | 解码器 |

**正确做法**：
- 编码器使用自注意力
- 解码器使用自注意力 + 交叉注意力

### 误区 4："注意力机制不需要训练"

**错！** 注意力机制中的 W_Q、W_K、W_V 都是**可学习的参数**。

**为什么错**：
- 模型需要学习如何计算 Q、K、V
- 需要学习什么样的关系是重要的

**正确做法**：
- 注意力机制的参数通过反向传播训练
- 训练数据决定了模型学习什么样的注意力模式

### 误区 5："注意力权重越大，对应位置越重要"

**不完全对。** 注意力权重大只表示**在当前任务中**更相关。

**为什么错**：
- 注意力权重是相对的，不是绝对的
- 某些位置可能权重小但仍然重要

**正确做法**：
- 注意力权重可以帮助理解模型关注什么
- 但不能完全解释模型的决策过程

---

## 7 动手练习

### 练习 1：基础练习 - 实现缩放点积注意力

**题目**：实现一个缩放点积注意力机制，计算 Q、K、V 的注意力输出。

**要求**：
- 输入：Q、K、V 三个张量
- 输出：注意力输出和注意力权重

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn.functional as F
import math

def scaled_dot_product_attention(Q, K, V):
    """
    缩放点积注意力
    
    参数：
    - Q: Query，形状 (batch, seq_len, d_k)
    - K: Key，形状 (batch, seq_len, d_k)
    - V: Value，形状 (batch, seq_len, d_v)
    
    返回：
    - output: 注意力输出，形状 (batch, seq_len, d_v)
    - attention_weights: 注意力权重，形状 (batch, seq_len, seq_len)
    """
    # 第一步：获取维度
    d_k = Q.size(-1)
    
    # 第二步：计算注意力分数
    # Q * K^T：(batch, seq_len, d_k) * (batch, d_k, seq_len)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    
    # 第三步：softmax 归一化
    attention_weights = F.softmax(scores, dim=-1)
    
    # 第四步：加权求和
    output = torch.matmul(attention_weights, V)
    
    return output, attention_weights

# 测试
batch_size = 2
seq_len = 5
d_k = 64
d_v = 64

Q = torch.randn(batch_size, seq_len, d_k)
K = torch.randn(batch_size, seq_len, d_k)
V = torch.randn(batch_size, seq_len, d_v)

output, weights = scaled_dot_product_attention(Q, K, V)

print("输出形状:", output.shape)              # (2, 5, 64)
print("注意力权重形状:", weights.shape)        # (2, 5, 5)
print("注意力权重每行和:", weights.sum(dim=-1))  # 应该接近 1
```

</details>

### 练习 2：进阶练习 - 实现多头注意力

**题目**：实现一个多头注意力机制，将输入分成多个头，每个头独立计算注意力，最后拼接结果。

**要求**：
- 支持指定头数 num_heads
- 正确分割和拼接张量

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class MultiHeadAttention:
    def __init__(self, d_model, num_heads):
        """
        多头注意力初始化
        
        参数：
        - d_model: 模型维度
        - num_heads: 头数
        """
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        # 线性变换矩阵
        self.W_Q = nn.Parameter(torch.randn(d_model, d_model))
        self.W_K = nn.Parameter(torch.randn(d_model, d_model))
        self.W_V = nn.Parameter(torch.randn(d_model, d_model))
        self.W_O = nn.Parameter(torch.randn(d_model, d_model))
    
    def split_heads(self, x, batch_size):
        """
        将最后一个维度分成 (num_heads, d_k)
        """
        x = x.view(batch_size, -1, self.num_heads, self.d_k)
        return x.transpose(1, 2)
    
    def forward(self, X):
        """
        前向传播
        
        参数：
        - X: 输入，形状 (batch_size, seq_len, d_model)
        
        返回：
        - output: 输出，形状 (batch_size, seq_len, d_model)
        """
        batch_size = X.size(0)
        
        # 第一步：线性变换
        Q = torch.matmul(X, self.W_Q)
        K = torch.matmul(X, self.W_K)
        V = torch.matmul(X, self.W_V)
        
        # 第二步：分成多个头
        Q = self.split_heads(Q, batch_size)
        K = self.split_heads(K, batch_size)
        V = self.split_heads(V, batch_size)
        
        # 第三步：计算注意力
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        attention_weights = F.softmax(scores, dim=-1)
        heads = torch.matmul(attention_weights, V)
        
        # 第四步：拼接所有头
        heads = heads.transpose(1, 2).contiguous()
        concat = heads.view(batch_size, -1, self.d_model)
        
        # 第五步：线性变换
        output = torch.matmul(concat, self.W_O)
        
        return output

# 测试
d_model = 512
num_heads = 8
mha = MultiHeadAttention(d_model, num_heads)

X = torch.randn(2, 10, d_model)
output = mha.forward(X)

print("输入形状:", X.shape)      # (2, 10, 512)
print("输出形状:", output.shape)  # (2, 10, 512)
```

</details>

### 练习 3（挑战）：综合练习 - 实现带掩码的注意力

**题目**：实现一个带掩码的注意力机制，用于解码器，防止看到未来的词。

**要求**：
- 创建掩码矩阵（上三角为 -inf）
- 在计算注意力时应用掩码

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn.functional as F
import math

def masked_attention(Q, K, V, seq_len):
    """
    带掩码的注意力机制
    
    参数：
    - Q: Query，形状 (batch, seq_len, d_k)
    - K: Key，形状 (batch, seq_len, d_k)
    - V: Value，形状 (batch, seq_len, d_v)
    - seq_len: 序列长度
    
    返回：
    - output: 注意力输出
    - attention_weights: 注意力权重
    """
    d_k = Q.size(-1)
    
    # 第一步：创建掩码
    # 上三角矩阵（未来位置为 1）
    mask = torch.triu(torch.ones(seq_len, seq_len), diagonal=1)
    # 将 1 替换为 -inf
    mask = mask.masked_fill(mask == 1, float('-inf'))
    # 扩展到 (batch, 1, seq_len, seq_len)
    mask = mask.unsqueeze(0).unsqueeze(0)
    
    # 第二步：计算注意力分数
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    
    # 第三步：应用掩码
    scores = scores + mask  # -inf + 任何数 = -inf
    
    # 第四步：softmax 归一化
    # -inf 经过 softmax 会变成 0
    attention_weights = F.softmax(scores, dim=-1)
    
    # 第五步：加权求和
    output = torch.matmul(attention_weights, V)
    
    return output, attention_weights

# 测试
batch_size = 2
seq_len = 5
d_k = 64
d_v = 64

Q = torch.randn(batch_size, seq_len, d_k)
K = torch.randn(batch_size, seq_len, d_k)
V = torch.randn(batch_size, seq_len, d_v)

output, weights = masked_attention(Q, K, V, seq_len)

print("输出形状:", output.shape)              # (2, 5, 64)
print("注意力权重形状:", weights.shape)        # (2, 1, 5, 5)
print("注意力权重（第一个样本）:\n", weights[0, 0])
# 上三角部分应该为 0
```

</details>

---

## 下一章预告

下一章我们会学习 **Transformer 架构详解**——这是 Transformer 的完整结构。你会学到编码器-解码器的设计、前馈网络、残差连接、Layer Normalization 等关键组件。这些知识对于理解 Transformer 的工作原理至关重要。
