---
title: "第7章：Seq2Seq 与注意力机制"
description: "编码器-解码器、注意力机制、Bahdanau、Luong、Beam Search"
---

# 第7章：Seq2Seq 与注意力机制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 机器翻译是怎么实现的？输入中文，输出英文
- 什么是 Seq2Seq？为什么叫"序列到序列"？
- 注意力机制是什么？为什么它能提升模型效果？
- Beam Search 和贪心搜索有什么区别？

这一章就是为了解答这些问题。我们会从 **Seq2Seq 的基本架构** 开始，逐步学习注意力机制和解码策略。

---

## 1 为什么需要 Seq2Seq？

### 痛点分析

上一章我们学了 RNN/LSTM，但它们只能处理"输入序列 → 单个输出"的任务（如文本分类）。

**但很多任务是"序列 → 序列"**：
- 机器翻译：输入中文序列，输出英文序列（长度可能不同）
- 文本摘要：输入长文章，输出短摘要
- 对话系统：输入问题，输出回答

**问题**：如何让模型处理变长的输入和输出？

### 解决方案

Seq2Seq（Sequence to Sequence）就是 **用一个编码器读取输入序列，用一个解码器生成输出序列**。

打个比方：

> Seq2Seq 就像一个翻译官。他先听完整段中文（编码器理解输入），然后在脑子里形成完整的理解（上下文向量），最后用英文表达出来（解码器生成输出）。注意力机制就是让翻译官在说每个英文词时，都能回头看看中文的哪些部分最重要。

> **一句话总结**：Seq2Seq 让 AI 能处理"序列到序列"的任务，注意力机制让它更聪明。

---

## 2 核心原理

### 2.1 Seq2Seq 基本架构

**Seq2Seq** 由两部分组成：

| 组件 | 作用 | 类比 |
| --- | --- | --- |
| **编码器（Encoder）** | 读取输入序列，生成上下文向量 | 翻译官听中文 |
| **解码器（Decoder）** | 根据上下文向量，生成输出序列 | 翻译官说英文 |

**工作流程**：

```
输入序列: [我, 喜欢, 猫]
    ↓
编码器 (RNN/LSTM): 逐步读取，生成隐藏状态
    ↓
上下文向量 C: 最后一个隐藏状态（包含整个输入的信息）
    ↓
解码器 (RNN/LSTM): 根据 C 逐步生成输出
    ↓
输出序列: [I, love, cats]
```

**公式**：

```
# 编码器
h_t^enc = f(x_t, h_{t-1}^enc)
C = h_T^enc  # 最后一个隐藏状态

# 解码器
h_t^dec = g(y_{t-1}, h_{t-1}^dec, C)
y_t = softmax(W * h_t^dec)
```

### 2.2 Seq2Seq 的问题

**问题**：上下文向量 C 是固定长度的，但输入序列长度可变。

**后果**：
- 短序列：信息可能足够
- 长序列：信息会被压缩丢失，导致效果差

**例子**：
> 输入："我今天早上去了北京的故宫，然后去了长城，晚上回到了酒店"
> 
> 编码器要把这么长的信息压缩成一个固定长度的向量 C，解码器要根据 C 生成翻译。信息太多，C 装不下，翻译质量就会下降。

### 2.3 注意力机制（Attention）

**注意力机制** 就是让解码器在生成每个词时，都能"看到"编码器的所有隐藏状态，而不是只看最后一个。

**核心思想**：
- 编码器：输出所有时间步的隐藏状态 [h_1, h_2, ..., h_T]
- 解码器：在每一步，计算与编码器各状态的"相关性"（注意力权重）
- 根据权重加权求和，得到上下文向量

**公式**：

```
# 计算注意力分数
e_ti = a(s_{t-1}, h_i)  # s 是解码器状态，h 是编码器状态

# 计算注意力权重（softmax）
α_ti = exp(e_ti) / Σ_j exp(e_tj)

# 计算上下文向量
c_t = Σ_i α_ti * h_i
```

**直观理解**：
- 解码器在生成"I"时，可能更关注"我"
- 解码器在生成"love"时，可能更关注"喜欢"
- 解码器在生成"cats"时，可能更关注"猫"

### 2.4 两种注意力机制

#### Bahdanau Attention（加性注意力）

```
e_ti = v^T * tanh(W_1 * s_{t-1} + W_2 * h_i)
```

**特点**：
- 使用一个前馈神经网络计算分数
- 参数多，计算慢
- 效果通常更好

#### Luong Attention（乘性注意力）

```
e_ti = s_{t-1}^T * W * h_i
```

**特点**：
- 使用点积计算分数
- 参数少，计算快
- 效果也不错

**对比**：

| 特性 | Bahdanau | Luong |
| --- | --- | --- |
| 计算方式 | 加性（前馈网络） | 乘性（点积） |
| 参数数量 | 多 | 少 |
| 计算速度 | 慢 | 快 |
| 效果 | 略好 | 略差 |
| 推荐 | 追求效果 | 追求速度 |

### 2.5 Beam Search

**问题**：解码时如何选择最优的输出序列？

**贪心搜索**：每一步选择概率最大的词。
- 优点：快
- 缺点：可能错过全局最优

**Beam Search**：每一步保留 Top-K 个候选，最后选择整体概率最高的。
- 优点：效果更好
- 缺点：慢，需要更多内存

**例子**：

```
贪心搜索（beam_size=1）：
P(I) = 0.5 → P(I love) = 0.3 → P(I love cats) = 0.1

Beam Search（beam_size=2）：
候选1: P(I) = 0.5
候选2: P(We) = 0.3

扩展候选1:
- P(I love) = 0.3
- P(I like) = 0.2

扩展候选2:
- P(We love) = 0.2
- P(We like) = 0.1

保留 Top-2:
- P(I love) = 0.3
- P(We love) = 0.2

继续扩展...最后选择概率最高的序列
```

---

## 3 对比分析

| 方法 | 原理 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| **Seq2Seq（无注意力）** | 固定上下文向量 | 简单、快 | 长序列效果差 | 短序列 |
| **Seq2Seq + Attention** | 动态上下文向量 | 长序列效果好 | 计算慢 | 长序列、翻译 |
| **贪心搜索** | 每步选最大 | 快 | 可能不是最优 | 实时应用 |
| **Beam Search** | 保留 Top-K | 效果更好 | 慢、占内存 | 离线应用 |

---

## 4 基础用法

### 4.1 实现 Seq2Seq 模型（无注意力）

```python
import torch
import torch.nn as nn

class Encoder(nn.Module):
    """编码器"""
    
    def __init__(self, input_size, hidden_size):
        super(Encoder, self).__init__()
        self.hidden_size = hidden_size
        
        # LSTM 编码器
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
    
    def forward(self, x):
        # x: (batch, seq_len, input_size)
        outputs, (hidden, cell) = self.lstm(x)
        
        # 返回最后一个隐藏状态作为上下文向量
        return hidden, cell

class Decoder(nn.Module):
    """解码器"""
    
    def __init__(self, hidden_size, output_size):
        super(Decoder, self).__init__()
        self.hidden_size = hidden_size
        
        # LSTM 解码器
        self.lstm = nn.LSTM(output_size, hidden_size, batch_first=True)
        
        # 输出层
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x, hidden, cell):
        # x: (batch, 1, output_size)
        output, (hidden, cell) = self.lstm(x, (hidden, cell))
        prediction = self.fc(output.squeeze(1))
        
        return prediction, hidden, cell

class Seq2Seq(nn.Module):
    """Seq2Seq 模型"""
    
    def __init__(self, input_size, hidden_size, output_size):
        super(Seq2Seq, self).__init__()
        self.encoder = Encoder(input_size, hidden_size)
        self.decoder = Decoder(hidden_size, output_size)
    
    def forward(self, src, trg, teacher_forcing_ratio=0.5):
        # src: (batch, src_len, input_size)
        # trg: (batch, trg_len)
        
        batch_size = src.shape[0]
        trg_len = trg.shape[1]
        trg_vocab_size = self.decoder.fc.out_features
        
        # 存储解码器输出
        outputs = torch.zeros(batch_size, trg_len, trg_vocab_size)
        
        # 编码
        hidden, cell = self.encoder(src)
        
        # 第一个输入是 <sos>
        input = trg[:, 0].unsqueeze(1)
        
        for t in range(1, trg_len):
            # 解码
            output, hidden, cell = self.decoder(input, hidden, cell)
            outputs[:, t] = output
            
            # 选择下一个输入
            teacher_force = torch.rand(1).item() < teacher_forcing_ratio
            top1 = output.argmax(1)
            input = trg[:, t].unsqueeze(1) if teacher_force else top1.unsqueeze(1)
        
        return outputs

# 测试
model = Seq2Seq(input_size=10, hidden_size=20, output_size=5)
src = torch.randn(2, 5, 10)  # (batch=2, src_len=5, input_size=10)
trg = torch.randint(0, 5, (2, 4))  # (batch=2, trg_len=4)
output = model(src, trg)
print(f"输出形状：{output.shape}")  # (2, 4, 5)
```

### 4.2 实现带注意力机制的 Seq2Seq

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class Attention(nn.Module):
    """注意力机制（Luong 风格）"""
    
    def __init__(self, hidden_size):
        super(Attention, self).__init__()
        self.attention = nn.Linear(hidden_size * 2, hidden_size)
        self.v = nn.Linear(hidden_size, 1, bias=False)
    
    def forward(self, hidden, encoder_outputs):
        # hidden: (batch, hidden_size)
        # encoder_outputs: (batch, src_len, hidden_size)
        
        batch_size = encoder_outputs.shape[0]
        src_len = encoder_outputs.shape[1]
        
        # 复制 hidden 到 src_len 次
        hidden = hidden.unsqueeze(1).repeat(1, src_len, 1)
        
        # 拼接
        energy = torch.tanh(self.attention(torch.cat((hidden, encoder_outputs), dim=2)))
        
        # 计算注意力分数
        attention = self.v(energy).squeeze(2)
        
        # softmax 得到权重
        return F.softmax(attention, dim=1)

class EncoderWithAttention(nn.Module):
    """带注意力的编码器"""
    
    def __init__(self, vocab_size, embedding_dim, hidden_size):
        super(EncoderWithAttention, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(embedding_dim, hidden_size, batch_first=True)
    
    def forward(self, x):
        embedded = self.embedding(x)
        outputs, (hidden, cell) = self.lstm(embedded)
        
        # 返回所有隐藏状态（用于注意力）
        return outputs, hidden, cell

class DecoderWithAttention(nn.Module):
    """带注意力的解码器"""
    
    def __init__(self, vocab_size, embedding_dim, hidden_size):
        super(DecoderWithAttention, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(embedding_dim + hidden_size, hidden_size, batch_first=True)
        self.attention = Attention(hidden_size)
        self.fc_out = nn.Linear(hidden_size * 2, vocab_size)
    
    def forward(self, input, hidden, cell, encoder_outputs):
        # input: (batch, 1)
        # encoder_outputs: (batch, src_len, hidden_size)
        
        embedded = self.embedding(input)  # (batch, 1, embedding_dim)
        
        # 计算注意力
        attn_weights = self.attention(hidden[-1], encoder_outputs)  # (batch, src_len)
        
        # 加权求和
        context = torch.bmm(attn_weights.unsqueeze(1), encoder_outputs)  # (batch, 1, hidden_size)
        
        # 拼接嵌入和上下文
        lstm_input = torch.cat((embedded, context), dim=2)
        
        # LSTM
        output, (hidden, cell) = self.lstm(lstm_input, (hidden, cell))
        
        # 预测
        prediction = self.fc_out(torch.cat((output.squeeze(1), context.squeeze(1)), dim=1))
        
        return prediction, hidden, cell, attn_weights

class Seq2SeqWithAttention(nn.Module):
    """带注意力的 Seq2Seq"""
    
    def __init__(self, vocab_size, embedding_dim, hidden_size):
        super(Seq2SeqWithAttention, self).__init__()
        self.encoder = EncoderWithAttention(vocab_size, embedding_dim, hidden_size)
        self.decoder = DecoderWithAttention(vocab_size, embedding_dim, hidden_size)
    
    def forward(self, src, trg, teacher_forcing_ratio=0.5):
        batch_size = src.shape[0]
        trg_len = trg.shape[1]
        vocab_size = self.decoder.fc_out.out_features
        
        outputs = torch.zeros(batch_size, trg_len, vocab_size)
        
        # 编码
        encoder_outputs, hidden, cell = self.encoder(src)
        
        # 第一个输入
        input = trg[:, 0].unsqueeze(1)
        
        for t in range(1, trg_len):
            # 解码
            output, hidden, cell, _ = self.decoder(input, hidden, cell, encoder_outputs)
            outputs[:, t] = output
            
            # Teacher forcing
            teacher_force = torch.rand(1).item() < teacher_forcing_ratio
            top1 = output.argmax(1)
            input = trg[:, t].unsqueeze(1) if teacher_force else top1.unsqueeze(1)
        
        return outputs

# 测试
model = Seq2SeqWithAttention(vocab_size=100, embedding_dim=50, hidden_size=64)
src = torch.randint(0, 100, (2, 5))  # (batch=2, src_len=5)
trg = torch.randint(0, 100, (2, 4))  # (batch=2, trg_len=4)
output = model(src, trg)
print(f"输出形状：{output.shape}")  # (2, 4, 100)
```

### 4.3 Beam Search 实现

```python
import torch

def beam_search_decode(model, src, beam_width=3, max_len=10):
    """
    Beam Search 解码
    
    参数：
        model: Seq2Seq 模型
        src: 输入序列
        beam_width: beam 宽度
        max_len: 最大生成长度
    
    返回：
        最优序列和概率
    """
    model.eval()
    
    with torch.no_grad():
        # 编码
        encoder_outputs, hidden, cell = model.encoder(src)
        
        # 初始化 beam
        beams = [(
            [0],  # 序列（从 <sos> 开始）
            0,    # 对数概率
            hidden,
            cell
        )]
        
        completed = []
        
        for _ in range(max_len):
            all_candidates = []
            
            for seq, score, hidden, cell in beams:
                if seq[-1] == 1:  # <eos>
                    completed.append((seq, score))
                    continue
                
                # 解码
                input = torch.tensor([[seq[-1]]])
                output, hidden, cell, _ = model.decoder(input, hidden, cell, encoder_outputs)
                
                # 获取 Top-K
                log_probs = torch.log_softmax(output, dim=1)
                top_k = log_probs.topk(beam_width)
                
                for i in range(beam_width):
                    next_token = top_k.indices[0, i].item()
                    next_score = score + top_k.values[0, i].item()
                    all_candidates.append((
                        seq + [next_token],
                        next_score,
                        hidden,
                        cell
                    ))
            
            # 选择 Top-K
            all_candidates.sort(key=lambda x: x[1], reverse=True)
            beams = all_candidates[:beam_width]
            
            if not beams:
                break
        
        # 选择最优
        completed.extend([(seq, score) for seq, score, _, _ in beams])
        best = max(completed, key=lambda x: x[1])
        
        return best[0], best[1]

# 使用示例
# src = torch.randint(0, 100, (1, 5))
# sequence, score = beam_search_decode(model, src, beam_width=3)
# print(f"最优序列：{sequence}，分数：{score:.4f}")
```

---

## 5 实战：简单机器翻译

### 5.1 中英文翻译

```python
import torch
import torch.nn as nn
import torch.optim as optim
import jieba

# 准备数据（简化示例）
en_zh_pairs = [
    ("I love cats", "我喜欢猫"),
    ("He likes dogs", "他喜欢狗"),
    ("She loves birds", "她喜欢鸟"),
    ("We love animals", "我们喜欢动物"),
]

# 分词
def tokenize_en(text):
    return text.lower().split()

def tokenize_zh(text):
    return jieba.lcut(text)

# 构建词汇表
en_vocab = {'<pad>': 0, '<sos>': 1, '<eos>': 2, '<unk>': 3}
zh_vocab = {'<pad>': 0, '<sos>': 1, '<eos>': 2, '<unk>': 3}

for en, zh in en_zh_pairs:
    for word in tokenize_en(en):
        if word not in en_vocab:
            en_vocab[word] = len(en_vocab)
    for word in tokenize_zh(zh):
        if word not in zh_vocab:
            zh_vocab[word] = len(zh_vocab)

# 文本转索引
def text_to_indices(text, vocab, tokenizer, max_len=10):
    tokens = tokenizer(text)
    indices = [vocab.get(w, vocab['<unk>']) for w in tokens]
    indices = [vocab['<sos>']] + indices + [vocab['<eos>']]
    
    if len(indices) < max_len:
        indices += [vocab['<pad>']] * (max_len - len(indices))
    else:
        indices = indices[:max_len]
    
    return indices

# 模型
class SimpleTranslator(nn.Module):
    def __init__(self, en_vocab_size, zh_vocab_size, hidden_size):
        super().__init__()
        self.encoder = nn.Embedding(en_vocab_size, 50)
        self.encoder_lstm = nn.LSTM(50, hidden_size, batch_first=True)
        
        self.decoder = nn.Embedding(zh_vocab_size, 50)
        self.decoder_lstm = nn.LSTM(50 + hidden_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, zh_vocab_size)
    
    def forward(self, en_input, zh_input):
        # 编码
        en_embedded = self.encoder(en_input)
        _, (hidden, cell) = self.encoder_lstm(en_embedded)
        
        # 解码
        zh_embedded = self.decoder(zh_input)
        hidden_expanded = hidden[-1].unsqueeze(1).expand(-1, zh_input.shape[1], -1)
        decoder_input = torch.cat([zh_embedded, hidden_expanded], dim=2)
        
        output, _ = self.decoder_lstm(decoder_input, (hidden, cell))
        prediction = self.fc(output)
        
        return prediction

# 训练
model = SimpleTranslator(len(en_vocab), len(zh_vocab), 64)
optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss(ignore_index=0)

# 准备训练数据
train_data = []
for en, zh in en_zh_pairs:
    en_indices = text_to_indices(en, en_vocab, tokenize_en, 10)
    zh_indices = text_to_indices(zh, zh_vocab, tokenize_zh, 10)
    train_data.append((en_indices, zh_indices))

# 训练循环
for epoch in range(50):
    total_loss = 0
    for en_indices, zh_indices in train_data:
        en_tensor = torch.tensor([en_indices])
        zh_tensor = torch.tensor([zh_indices])
        
        optimizer.zero_grad()
        output = model(en_tensor, zh_tensor[:, :-1])
        loss = criterion(output.view(-1, len(zh_vocab)), zh_tensor[:, 1:].reshape(-1))
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    
    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")

# 测试
model.eval()
test_en = "I love cats"
test_indices = text_to_indices(test_en, en_vocab, tokenize_en, 10)
with torch.no_grad():
    output = model(torch.tensor([test_indices]), torch.tensor([[1, 0, 0, 0, 0, 0, 0, 0, 0]]))
    pred = output.argmax(2)[0]
    print(f"英文：{test_en}")
    print(f"预测索引：{pred.tolist()}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Seq2Seq** | 编码器-解码器架构，处理序列到序列任务 |
| **编码器** | 读取输入序列，生成上下文向量 |
| **解码器** | 根据上下文向量，生成输出序列 |
| **注意力机制** | 让解码器关注编码器的不同部分 |
| **Bahdanau vs Luong** | 加性注意力 vs 乘性注意力 |
| **Beam Search** | 保留 Top-K 候选，选择最优序列 |

---

## 7 新手常见误区

### 误区 1："Seq2Seq 只能用于机器翻译"

**错！** Seq2Seq 可以用于任何序列到序列的任务：文本摘要、对话系统、语音识别等。

### 误区 2："注意力机制会让模型变慢很多"

不一定。虽然注意力增加了计算量，但现代硬件（GPU）可以并行计算，实际速度影响不大。而且注意力带来的效果提升远大于速度损失。

### 误区 3："Beam Search 的 beam 越大越好"

**错！** beam 太大会导致计算量爆炸，而且可能生成重复或无意义的序列。一般 beam_width=3-5 就够了。

### 误区 4："有了注意力，就不需要 LSTM 了"

不是的。注意力只是让模型更关注重要的部分，但 LSTM 仍然负责捕捉序列的时序信息。两者是互补的。

---

## 8 动手练习

### 练习 1：基础练习 - 实现简单 Seq2Seq

**题目**：实现一个简单的 Seq2Seq 模型（无注意力），用于数字序列转换。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class Encoder(nn.Module):
    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
    
    def forward(self, x):
        _, (hidden, cell) = self.lstm(x)
        return hidden, cell

class Decoder(nn.Module):
    def __init__(self, hidden_size, output_size):
        super().__init__()
        self.lstm = nn.LSTM(output_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x, hidden, cell):
        output, (hidden, cell) = self.lstm(x, (hidden, cell))
        return self.fc(output.squeeze(1)), hidden, cell

# 测试
encoder = Encoder(10, 20)
decoder = Decoder(20, 10)

x = torch.randn(2, 5, 10)
hidden, cell = encoder(x)
output, _, _ = decoder(torch.randn(2, 1, 10), hidden, cell)
print(f"输出形状：{output.shape}")
```

</details>

### 练习 2：进阶练习 - 实现注意力机制

**题目**：实现 Luong 注意力机制，并集成到 Seq2Seq 模型中。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class LuongAttention(nn.Module):
    def __init__(self, hidden_size):
        super().__init__()
        self.W = nn.Linear(hidden_size, hidden_size, bias=False)
    
    def forward(self, decoder_hidden, encoder_outputs):
        # decoder_hidden: (batch, hidden_size)
        # encoder_outputs: (batch, src_len, hidden_size)
        
        # 计算分数
        score = torch.bmm(
            self.W(decoder_hidden).unsqueeze(1),
            encoder_outputs.transpose(1, 2)
        ).squeeze(1)
        
        # softmax
        attn_weights = F.softmax(score, dim=1)
        
        # 上下文向量
        context = torch.bmm(attn_weights.unsqueeze(1), encoder_outputs).squeeze(1)
        
        return context, attn_weights

# 测试
attn = LuongAttention(64)
decoder_hidden = torch.randn(2, 64)
encoder_outputs = torch.randn(2, 10, 64)
context, weights = attn(decoder_hidden, encoder_outputs)
print(f"上下文形状：{context.shape}")
print(f"注意力权重形状：{weights.shape}")
```

</details>

### 练习 3（挑战）：综合练习 - 完整翻译系统

**题目**：实现一个完整的中英文翻译系统，包括数据准备、模型训练、推理。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import jieba

# 简化版翻译系统
class TranslationSystem:
    def __init__(self, en_vocab_size, zh_vocab_size, hidden_size=64):
        # 编码器
        self.en_embedding = nn.Embedding(en_vocab_size, 50)
        self.encoder = nn.LSTM(50, hidden_size, batch_first=True)
        
        # 解码器
        self.zh_embedding = nn.Embedding(zh_vocab_size, 50)
        self.decoder = nn.LSTM(50, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, zh_vocab_size)
    
    def encode(self, en_input):
        embedded = self.en_embedding(en_input)
        _, (hidden, cell) = self.encoder(embedded)
        return hidden, cell
    
    def decode(self, zh_input, hidden, cell):
        embedded = self.zh_embedding(zh_input)
        output, (hidden, cell) = self.decoder(embedded, (hidden, cell))
        return self.fc(output), hidden, cell
    
    def forward(self, en_input, zh_input):
        hidden, cell = self.encode(en_input)
        output, _, _ = self.decode(zh_input, hidden, cell)
        return output

# 使用示例
# system = TranslationSystem(en_vocab_size=1000, zh_vocab_size=1000)
# en_input = torch.randint(0, 1000, (2, 10))
# zh_input = torch.randint(0, 1000, (2, 8))
# output = system(en_input, zh_input)
# print(f"输出形状：{output.shape}")
```

</details>

---

## 下一章预告

下一章我们会学习 **Transformer 架构详解**——也就是现代 NLP 的核心架构。你会学到自注意力机制、多头注意力、位置编码等概念。Transformer 是 BERT、GPT 等模型的基础，是 NLP 的重要里程碑。
