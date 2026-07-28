---
title: "第4章：位置编码与词嵌入"
description: "正弦位置编码、可学习位置编码、旋转位置编码（RoPE）、词嵌入技术、Tokenization"
---

# 第4章：位置编码与词嵌入

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Transformer 没有循环结构，怎么知道词的顺序？
- 位置编码有哪些不同的方法？它们有什么区别？
- 什么是词嵌入？Word2Vec 和 BPE 有什么不同？
- 为什么大模型都用 BPE 而不是 Word2Vec？
- Tokenization 是怎么工作的？

这一章就是为了解答这些问题。我们会从 **位置编码** 开始，学习不同的位置编码方法，然后深入 **词嵌入技术** 和 **Tokenization**。

---

## 1 为什么需要位置编码和词嵌入？

### 痛点分析

**问题 1：Transformer 无法感知词序**

上一章我们学了 Transformer 的自注意力机制，它让每个词都能关注所有其他词。但这也带来一个问题：**自注意力是置换不变的**，也就是说，打乱词序后，自注意力的输出只是相应地打乱，结果是一样的。

**例子**：
> "我 爱 学习" 和 "学习 爱 我" 在自注意力看来，每个词对其他词的关注度是一样的，模型无法区分这两个句子。

**问题 2：词是离散的符号**

计算机无法直接处理文字，我们需要将词转换为数值向量。

**传统方法的问题**：
- ❌ One-hot 编码：维度高、稀疏、无法捕捉语义关系
- ❌ 词袋模型：丢失词序信息
- ❌ 简单的整数编码：无法表达语义相似度

### 解决方案

**位置编码**：为序列中的每个位置添加位置信息
**词嵌入**：将词映射为密集的向量表示，捕捉语义关系

打个比方：

> 位置编码就像给每个座位编号，让模型知道词在句子中的位置；词嵌入就像给每个词分配一个"坐标"，语义相近的词坐标也相近。

> **一句话总结**：位置编码解决"词在哪里"的问题，词嵌入解决"词是什么"的问题。

---

## 2 核心原理

### 2.1 位置编码方法

#### 方法 1：正弦位置编码（Sinusoidal Positional Encoding）

**原始 Transformer 使用的方法**。

**公式**：

```
PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

其中：
- pos 是位置索引（0, 1, 2, ...）
- i 是维度索引（0, 1, 2, ..., d_model/2-1）
- d_model 是模型维度

**代码实现**：

```python
import torch
import math

def sinusoidal_positional_encoding(max_len, d_model):
    """
    正弦位置编码
    
    参数：
    - max_len: 最大序列长度
    - d_model: 模型维度
    
    返回：
    - pe: 位置编码矩阵，形状 (max_len, d_model)
    """
    # 创建位置编码矩阵
    pe = torch.zeros(max_len, d_model)
    
    # 位置索引 (max_len, 1)
    position = torch.arange(0, max_len).unsqueeze(1).float()
    
    # 计算分母：10000^(2i/d_model)
    div_term = torch.exp(
        torch.arange(0, d_model, 2).float() * -(math.log(10000.0) / d_model)
    )
    
    # 偶数维度用 sin
    pe[:, 0::2] = torch.sin(position * div_term)
    # 奇数维度用 cos
    pe[:, 1::2] = torch.cos(position * div_term)
    
    return pe

# 使用示例
max_len = 100
d_model = 512
pe = sinusoidal_positional_encoding(max_len, d_model)

print("位置编码形状:", pe.shape)  # (100, 512)
print("位置 0 的编码:", pe[0, :10])  # 前 10 个维度
print("位置 1 的编码:", pe[1, :10])
```

**为什么用正弦和余弦？**

1. **相对位置**：对于任意固定偏移量 k，PE(pos+k) 可以表示为 PE(pos) 的线性函数
   ```
   PE(pos+k, 2i) = sin((pos+k)/10000^(2i/d_model))
                  = sin(pos/10000^(2i/d_model)) * cos(k/10000^(2i/d_model))
                  + cos(pos/10000^(2i/d_model)) * sin(k/10000^(2i/d_model))
   ```
   这说明 PE(pos+k) 可以通过 PE(pos) 的线性变换得到

2. **泛化能力**：可以处理比训练时更长的序列

3. **确定性**：不需要学习，直接计算

#### 方法 2：可学习位置编码（Learned Positional Encoding）

**BERT 使用的方法**。

**思想**：将位置编码作为可学习的参数，通过训练学习。

**代码实现**：

```python
import torch
import torch.nn as nn

class LearnedPositionalEncoding(nn.Module):
    def __init__(self, max_len, d_model):
        """
        可学习位置编码
        
        参数：
        - max_len: 最大序列长度
        - d_model: 模型维度
        """
        super().__init__()
        
        # 创建可学习的位置编码
        self.position_embeddings = nn.Embedding(max_len, d_model)
    
    def forward(self, x):
        """
        前向传播
        
        参数：
        - x: 输入，形状 (batch, seq_len, d_model)
        """
        # 获取序列长度
        seq_len = x.size(1)
        
        # 创建位置索引 (0, 1, 2, ..., seq_len-1)
        positions = torch.arange(seq_len, device=x.device)
        
        # 获取位置编码
        position_embeds = self.position_embeddings(positions)
        
        # 加到输入上
        return x + position_embeds

# 使用示例
max_len = 512
d_model = 768
pos_enc = LearnedPositionalEncoding(max_len, d_model)

x = torch.randn(2, 10, d_model)
output = pos_enc(x)

print("输入形状:", x.shape)      # (2, 10, 768)
print("输出形状:", output.shape)  # (2, 10, 768)
```

**优点**：
- 可以学习适合任务的位置表示
- 简单直接

**缺点**：
- 无法泛化到更长的序列
- 需要额外的参数

#### 方法 3：旋转位置编码（RoPE - Rotary Position Embedding）

**LLaMA、GPT-NeoX 等现代模型使用的方法**。

**核心思想**：通过旋转矩阵将位置信息编码到向量中。

**公式**：

```
对于位置 pos 和维度对 (2i, 2i+1)：
[ x_2i'   ]   [ cos(pos*θ_i)  -sin(pos*θ_i) ] [ x_2i   ]
[ x_2i+1' ] = [ sin(pos*θ_i)   cos(pos*θ_i) ] [ x_2i+1 ]

其中 θ_i = 1 / 10000^(2i/d_model)
```

**代码实现**：

```python
import torch
import torch.nn as nn

class RotaryPositionEmbedding(nn.Module):
    def __init__(self, d_model, max_len=2048):
        """
        旋转位置编码（RoPE）
        
        参数：
        - d_model: 模型维度
        - max_len: 最大序列长度
        """
        super().__init__()
        
        # 计算旋转角度
        inv_freq = 1.0 / (10000 ** (torch.arange(0, d_model, 2).float() / d_model))
        self.register_buffer('inv_freq', inv_freq)
        
        # 预计算 cos 和 sin
        t = torch.arange(max_len).type_as(inv_freq)
        freqs = torch.einsum('i,j->ij', t, inv_freq)  # (max_len, d_model/2)
        emb = torch.cat((freqs, freqs), dim=-1)  # (max_len, d_model)
        self.register_buffer('cos_emb', emb.cos())
        self.register_buffer('sin_emb', emb.sin())
    
    def rotate_half(self, x):
        """
        将向量的后半部分旋转到前面
        """
        x1 = x[..., :x.shape[-1]//2]
        x2 = x[..., x.shape[-1]//2:]
        return torch.cat((-x2, x1), dim=-1)
    
    def forward(self, q, k, positions=None):
        """
        前向传播
        
        参数：
        - q: Query，形状 (batch, num_heads, seq_len, d_k)
        - k: Key，形状 (batch, num_heads, seq_len, d_k)
        - positions: 位置索引（可选）
        """
        seq_len = q.size(2)
        
        if positions is None:
            positions = torch.arange(seq_len, device=q.device)
        
        # 获取 cos 和 sin
        cos = self.cos_emb[positions].unsqueeze(0).unsqueeze(0)
        sin = self.sin_emb[positions].unsqueeze(0).unsqueeze(0)
        
        # 应用旋转
        q_rot = q * cos + self.rotate_half(q) * sin
        k_rot = k * cos + self.rotate_half(k) * sin
        
        return q_rot, k_rot

# 使用示例
d_model = 64
rope = RotaryPositionEmbedding(d_model)

batch_size = 2
num_heads = 8
seq_len = 10

q = torch.randn(batch_size, num_heads, seq_len, d_model)
k = torch.randn(batch_size, num_heads, seq_len, d_model)

q_rot, k_rot = rope(q, k)

print("Q 形状:", q.shape)      # (2, 8, 10, 64)
print("Q_rot 形状:", q_rot.shape)  # (2, 8, 10, 64)
```

**RoPE 的优点**：

1. **相对位置**：自然编码相对位置信息
2. **长序列泛化**：可以处理更长的序列
3. **高效**：计算简单，不需要额外参数

### 2.2 位置编码方法对比

| 方法 | 代表模型 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **正弦编码** | 原始 Transformer | 确定性强，可泛化 | 固定，无法学习 |
| **可学习编码** | BERT | 可学习，适应任务 | 无法泛化到更长序列 |
| **RoPE** | LLaMA, GPT-NeoX | 相对位置，高效 | 实现稍复杂 |
| **ALiBi** | BLOOM | 简单，无需学习 | 效果略逊于 RoPE |

### 2.3 词嵌入技术

#### 方法 1：One-hot 编码

**最简单的方法**，但问题很多。

```python
# 假设词表大小为 5
vocab = {"我": 0, "爱": 1, "学习": 2, "深度": 3, "学习": 4}

# One-hot 编码
one_hot = torch.zeros(5, 5)
one_hot[0, 0] = 1  # "我" -> [1, 0, 0, 0, 0]
one_hot[1, 1] = 1  # "爱" -> [0, 1, 0, 0, 0]
one_hot[2, 2] = 1  # "学习" -> [0, 0, 1, 0, 0]

print(one_hot)
```

**问题**：
- ❌ 维度高（等于词表大小）
- ❌ 稀疏（大部分是 0）
- ❌ 无法捕捉语义关系（"猫"和"狗"的距离 = "猫"和"经济"的距离）

#### 方法 2：Word2Vec

**2013 年 Google 提出的方法**，将词映射为密集的向量。

**两种训练方式**：

1. **CBOW（Continuous Bag of Words）**：用上下文预测中心词
   ```
   输入：["我", "学习", "深度"] → 预测："爱"
   ```

2. **Skip-gram**：用中心词预测上下文
   ```
   输入："爱" → 预测：["我", "学习", "深度"]
   ```

**代码实现（使用 gensim）**：

```python
from gensim.models import Word2Vec

# 训练数据
sentences = [
    ["我", "爱", "学习", "深度", "学习"],
    ["深度", "学习", "很", "有趣"],
    ["我", "喜欢", "机器", "学习"],
    # ... 更多数据
]

# 训练 Word2Vec 模型
model = Word2Vec(sentences, vector_size=100, window=5, min_count=1)

# 获取词向量
vector = model.wv["学习"]
print("词向量形状:", vector.shape)  # (100,)

# 计算相似度
similarity = model.wv.similarity("学习", "深度")
print("相似度:", similarity)

# 找最相似的词
similar_words = model.wv.most_similar("学习", topn=5)
print("最相似的词:", similar_words)
```

**优点**：
- ✅ 捕捉语义关系
- ✅ 低维度（通常 100-300 维）
- ✅ 稠密向量

**缺点**：
- ❌ 每个词只有一个向量（无法处理多义词）
- ❌ 静态表示（不考虑上下文）

#### 方法 3：BPE（Byte Pair Encoding）

**现代大模型（GPT、LLaMA）使用的方法**。

**核心思想**：
1. 从字符级别开始
2. 统计最频繁出现的字符对，合并为新符号
3. 重复步骤 2，直到达到目标词表大小

**例子**：

```
初始词表：['a', 'b', 'c', 'd']
训练数据："aabbcc" 出现 5 次，"abcd" 出现 3 次

第 1 轮：合并 "aa" -> 'A'
词表：['a', 'b', 'c', 'd', 'A']
数据："Abbcc" 5 次，"Abcd" 3 次

第 2 轮：合并 "bb" -> 'B'
词表：['a', 'b', 'c', 'd', 'A', 'B']
数据："ABcc" 5 次，"ABcd" 3 次

第 3 轮：合并 "cc" -> 'C'
词表：['a', 'b', 'c', 'd', 'A', 'B', 'C']
数据："ABC" 5 次，"ABcd" 3 次
```

**代码实现（使用 Hugging Face tokenizers）**：

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace

# 创建 BPE tokenizer
tokenizer = Tokenizer(BPE(unk_token="[UNK]"))
tokenizer.pre_tokenizer = Whitespace()

# 训练数据
files = ["data.txt"]  # 训练文件

# 创建训练器
trainer = BpeTrainer(
    vocab_size=10000,           # 词表大小
    min_frequency=2,            # 最小频率
    special_tokens=["[UNK]", "[CLS]", "[SEP]", "[PAD]", "[MASK]"]
)

# 训练
tokenizer.train(files, trainer)

# 使用
text = "我 爱 学习 深度 学习"
tokens = tokenizer.encode(text)

print("分词结果:", tokens.tokens)
print("token IDs:", tokens.ids)
```

**BPE 的优点**：

1. **子词级别**：平衡词级别和字符级别
2. **处理未登录词**：可以将未登录词拆分为已知的子词
3. **多语言支持**：适合处理多种语言

### 2.4 Tokenization 方法对比

| 方法 | 粒度 | 代表模型 | 优点 | 缺点 |
| --- | --- | --- | --- | --- |
| **词级别** | 词 | Word2Vec | 语义清晰 | 词表大，无法处理未登录词 |
| **字符级别** | 字符 | - | 词表小，无未登录词 | 序列长，语义弱 |
| **BPE** | 子词 | GPT, LLaMA | 平衡，处理未登录词 | 实现稍复杂 |
| **WordPiece** | 子词 | BERT | 类似 BPE | 类似 BPE |
| **SentencePiece** | 子词 | T5, ALBERT | 语言无关 | 需要额外训练 |

---

## 3 基础用法

### 3.1 使用 Hugging Face Tokenizer

**安装**：

```bash
pip install transformers tokenizers
```

**使用 GPT-2 的 BPE tokenizer**：

```python
from transformers import GPT2Tokenizer

# 加载 tokenizer
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

# 分词
text = "我 爱 学习 深度 学习"
tokens = tokenizer.encode(text)

print("原始文本:", text)
print("token IDs:", tokens)
print("解码:", tokenizer.decode(tokens))

# 获取分词结果
tokens_str = tokenizer.tokenize(text)
print("分词结果:", tokens_str)
```

**使用 BERT 的 WordPiece tokenizer**：

```python
from transformers import BertTokenizer

# 加载 tokenizer
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

# 分词
text = "I love deep learning"
tokens = tokenizer.encode(text)

print("原始文本:", text)
print("token IDs:", tokens)
print("解码:", tokenizer.decode(tokens))

# 获取分词结果
tokens_str = tokenizer.tokenize(text)
print("分词结果:", tokens_str)
```

### 3.2 训练自定义 Tokenizer

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace

# 创建 tokenizer
tokenizer = Tokenizer(BPE(unk_token="[UNK]"))
tokenizer.pre_tokenizer = Whitespace()

# 训练数据
files = ["data.txt"]

# 创建训练器
trainer = BpeTrainer(
    vocab_size=5000,
    min_frequency=2,
    special_tokens=["[UNK]", "[CLS]", "[SEP]", "[PAD]", "[MASK]"]
)

# 训练
tokenizer.train(files, trainer)

# 保存
tokenizer.save("tokenizer.json")

# 加载
tokenizer = Tokenizer.from_file("tokenizer.json")
```

---

## 4 进阶用法

### 4.1 对比不同位置编码

```python
import torch
import torch.nn as nn
import math

class SinusoidalPositionalEncoding(nn.Module):
    """正弦位置编码"""
    def __init__(self, d_model, max_len=5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * -(math.log(10000.0) / d_model)
        )
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)
    
    def forward(self, x):
        return x + self.pe[:, :x.size(1), :]

class LearnedPositionalEncoding(nn.Module):
    """可学习位置编码"""
    def __init__(self, max_len, d_model):
        super().__init__()
        self.position_embeddings = nn.Embedding(max_len, d_model)
    
    def forward(self, x):
        seq_len = x.size(1)
        positions = torch.arange(seq_len, device=x.device)
        position_embeds = self.position_embeddings(positions)
        return x + position_embeds

# 对比实验
d_model = 512
max_len = 100
x = torch.randn(2, 50, d_model)

# 正弦位置编码
sinusoidal_pe = SinusoidalPositionalEncoding(d_model, max_len)
output1 = sinusoidal_pe(x)

# 可学习位置编码
learned_pe = LearnedPositionalEncoding(max_len, d_model)
output2 = learned_pe(x)

print("正弦位置编码输出形状:", output1.shape)
print("可学习位置编码输出形状:", output2.shape)
```

### 4.2 可视化词向量

```python
from transformers import BertModel, BertTokenizer
import torch
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

# 加载模型和 tokenizer
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
model = BertModel.from_pretrained("bert-base-uncased")

# 获取词向量
words = ["cat", "dog", "bird", "car", "plane", "apple", "banana", "happy", "sad"]
vectors = []

for word in words:
    inputs = tokenizer(word, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    # 使用 [CLS] token 的表示
    vector = outputs.last_hidden_state[:, 0, :].squeeze().numpy()
    vectors.append(vector)

vectors = torch.stack([torch.tensor(v) for v in vectors])

# PCA 降维到 2D
pca = PCA(n_components=2)
vectors_2d = pca.fit_transform(vectors)

# 可视化
plt.figure(figsize=(10, 8))
for i, word in enumerate(words):
    plt.scatter(vectors_2d[i, 0], vectors_2d[i, 1])
    plt.annotate(word, (vectors_2d[i, 0], vectors_2d[i, 1]))

plt.xlabel("PC1")
plt.ylabel("PC2")
plt.title("Word Embeddings Visualization")
plt.show()
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **正弦位置编码** | 使用正弦和余弦函数，确定性强，可泛化 |
| **可学习位置编码** | 作为参数学习，适应任务，但无法泛化 |
| **RoPE** | 旋转位置编码，自然编码相对位置，现代模型常用 |
| **Word2Vec** | 静态词向量，捕捉语义，但无法处理多义词 |
| **BPE** | 子词分词，平衡词级别和字符级别，现代模型常用 |
| **Tokenization** | 将文本转换为 token 序列，是模型输入的第一步 |

---

## 6 新手常见误区

### 误区 1："位置编码必须训练"

**错！** 正弦位置编码是**固定的**，不需要训练。

**为什么错**：
- 正弦位置编码通过公式直接计算
- 不需要梯度更新
- 是确定性的

**正确做法**：
- 正弦位置编码不需要训练
- 可学习位置编码需要训练
- RoPE 也不需要训练

### 误区 2："BPE 和 Word2Vec 是一回事"

**错！** 它们是完全不同的概念：

| 特性 | BPE | Word2Vec |
| --- | --- | --- |
| 类型 | 分词方法 | 词向量方法 |
| 输出 | token 序列 | 词向量 |
| 用途 | Tokenization | 词表示 |
| 代表模型 | GPT, LLaMA | 传统 NLP |

**正确做法**：
- BPE 用于分词
- Word2Vec 用于获取词向量
- 现代模型通常用 BPE 分词 + 可学习词嵌入

### 误区 3："词表越大越好"

**不完全对。** 词表过大会导致：
- 模型参数增加
- 计算成本增加
- 可能过拟合

**正确做法**：
- 根据任务和数据量选择合适的词表大小
- 通常 30,000-50,000 足够
- 大模型可以用更大的词表（如 100,000+）

### 误区 4："所有模型用相同的 tokenizer"

**错！** 不同模型使用不同的 tokenizer：

| 模型 | Tokenizer | 类型 |
| --- | --- | --- |
| GPT-2 | GPT2Tokenizer | BPE |
| BERT | BertTokenizer | WordPiece |
| LLaMA | LlamaTokenizer | BPE (SentencePiece) |
| T5 | T5Tokenizer | SentencePiece |

**正确做法**：
- 使用模型对应的 tokenizer
- 不要混用不同模型的 tokenizer
- 可以通过 `AutoTokenizer` 自动选择

### 误区 5："词嵌入和位置编码是独立的"

**不完全对。** 它们是**相加**的关系：

```
输入 = 词嵌入 + 位置编码
```

**解释**：
- 词嵌入表示"词是什么"
- 位置编码表示"词在哪里"
- 两者相加，同时包含语义和位置信息

**正确做法**：
- 词嵌入和位置编码相加
- 不是拼接，是逐元素相加
- 两者维度必须相同

---

## 7 动手练习

### 练习 1：基础练习 - 实现正弦位置编码

**题目**：实现正弦位置编码，为序列添加位置信息。

**要求**：
- 实现正弦和余弦位置编码
- 将位置编码加到输入上

<details>
<summary>点击查看答案</summary>

```python
import torch
import math

def sinusoidal_positional_encoding(max_len, d_model):
    """
    正弦位置编码
    
    参数：
    - max_len: 最大序列长度
    - d_model: 模型维度
    
    返回：
    - pe: 位置编码矩阵，形状 (max_len, d_model)
    """
    pe = torch.zeros(max_len, d_model)
    position = torch.arange(0, max_len).unsqueeze(1).float()
    div_term = torch.exp(
        torch.arange(0, d_model, 2).float() * -(math.log(10000.0) / d_model)
    )
    pe[:, 0::2] = torch.sin(position * div_term)
    pe[:, 1::2] = torch.cos(position * div_term)
    return pe

# 测试
max_len = 100
d_model = 512
pe = sinusoidal_positional_encoding(max_len, d_model)

print("位置编码形状:", pe.shape)  # (100, 512)
print("位置 0 的编码:", pe[0, :10])
print("位置 1 的编码:", pe[1, :10])
```

</details>

### 练习 2：进阶练习 - 实现 RoPE

**题目**：实现旋转位置编码（RoPE），对 Query 和 Key 应用旋转。

**要求**：
- 实现旋转矩阵
- 对 Q 和 K 应用旋转

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class RotaryPositionEmbedding(nn.Module):
    def __init__(self, d_model, max_len=2048):
        super().__init__()
        inv_freq = 1.0 / (10000 ** (torch.arange(0, d_model, 2).float() / d_model))
        self.register_buffer('inv_freq', inv_freq)
        
        t = torch.arange(max_len).type_as(inv_freq)
        freqs = torch.einsum('i,j->ij', t, inv_freq)
        emb = torch.cat((freqs, freqs), dim=-1)
        self.register_buffer('cos_emb', emb.cos())
        self.register_buffer('sin_emb', emb.sin())
    
    def rotate_half(self, x):
        x1 = x[..., :x.shape[-1]//2]
        x2 = x[..., x.shape[-1]//2:]
        return torch.cat((-x2, x1), dim=-1)
    
    def forward(self, q, k, positions=None):
        seq_len = q.size(2)
        
        if positions is None:
            positions = torch.arange(seq_len, device=q.device)
        
        cos = self.cos_emb[positions].unsqueeze(0).unsqueeze(0)
        sin = self.sin_emb[positions].unsqueeze(0).unsqueeze(0)
        
        q_rot = q * cos + self.rotate_half(q) * sin
        k_rot = k * cos + self.rotate_half(k) * sin
        
        return q_rot, k_rot

# 测试
d_model = 64
rope = RotaryPositionEmbedding(d_model)

batch_size = 2
num_heads = 8
seq_len = 10

q = torch.randn(batch_size, num_heads, seq_len, d_model)
k = torch.randn(batch_size, num_heads, seq_len, d_model)

q_rot, k_rot = rope(q, k)

print("Q 形状:", q.shape)
print("Q_rot 形状:", q_rot.shape)
```

</details>

### 练习 3（挑战）：综合练习 - 训练自定义 BPE Tokenizer

**题目**：使用 tokenizers 库训练一个自定义的 BPE tokenizer。

**要求**：
- 创建 BPE tokenizer
- 训练 tokenizer
- 保存和加载

<details>
<summary>点击查看答案</summary>

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace

# 创建 tokenizer
tokenizer = Tokenizer(BPE(unk_token="[UNK]"))
tokenizer.pre_tokenizer = Whitespace()

# 训练数据（假设有一个文件 data.txt）
# files = ["data.txt"]

# 创建训练器
trainer = BpeTrainer(
    vocab_size=5000,
    min_frequency=2,
    special_tokens=["[UNK]", "[CLS]", "[SEP]", "[PAD]", "[MASK]"]
)

# 训练（如果有数据文件）
# tokenizer.train(files, trainer)

# 保存
# tokenizer.save("tokenizer.json")

# 加载
# tokenizer = Tokenizer.from_file("tokenizer.json")

# 使用
text = "我 爱 学习 深度 学习"
# tokens = tokenizer.encode(text)
# print("分词结果:", tokens.tokens)
# print("token IDs:", tokens.ids)

print("Tokenizer 创建成功！")
```

</details>

---

## 下一章预告

下一章我们会学习 **预训练与微调范式**——这是现代大语言模型的核心训练方法。你会学到预训练任务设计、自监督学习、迁移学习、微调策略等关键知识。这些是理解 BERT、GPT 等模型如何训练的基础。
