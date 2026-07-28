---
title: "第7章：GPT 系列模型演进"
description: "GPT-1 到 GPT-4 演进、自回归生成、Decoder-only 架构、Scaling Law、涌现能力"
---

# 第7章：GPT 系列模型演进

## 本章导读

在学这一章之前，你可能会有这些疑问：

- GPT-1 到 GPT-4 有什么本质区别？
- 为什么 GPT 用 Decoder-only 架构？
- 什么是 Scaling Law？为什么模型越大效果越好？
- 什么是涌现能力？为什么突然就会了？
- GPT-4 到底有多大？

这一章就是为了解答这些问题。我们会从 **GPT 的发展历程** 开始，学习自回归生成、Decoder-only 架构，然后深入 Scaling Law 和涌现能力。

---

## 1 为什么需要 GPT？

### 痛点分析

**BERT 的问题**：
- ❌ 只能理解，不能生成
- ❌ Encoder-only 架构不适合生成任务
- ❌ 需要针对每个任务微调

**例子**：
> 你想做一个聊天机器人：
> - BERT 只能理解用户说了什么
> - 但无法生成回复
> - 需要额外的生成模型

### 解决方案

**GPT（Generative Pre-trained Transformer）**：
- ✅ Decoder-only 架构
- ✅ 自回归生成（从左到右）
- ✅ 强大的生成能力
- ✅ 少样本学习

打个比方：

> BERT 就像一个阅读理解专家，擅长理解但不擅长写作；GPT 就像一个作家，擅长创作和生成。

> **一句话总结**：GPT 通过 Decoder-only 架构和自回归生成，成为生成式 AI 的基石。

---

## 2 核心原理

### 2.1 GPT 发展历程

| 模型 | 发布时间 | 参数量 | 关键创新 |
| --- | --- | --- | --- |
| **GPT-1** | 2018 | 1.17 亿 | 首次提出预训练 + 微调 |
| **GPT-2** | 2019 | 15 亿 | 零样本学习能力 |
| **GPT-3** | 2020 | 1750 亿 | 少样本学习，涌现能力 |
| **GPT-4** | 2023 | 未公开 | 多模态，推理能力大幅提升 |

### 2.2 Decoder-only 架构

**GPT 只使用 Transformer 的解码器**：

```
输入 → [Decoder 层] × N → 输出
```

**每一层包含**：
1. 掩码多头自注意力（Masked Multi-Head Self-Attention）
2. 前馈神经网络（Feed-Forward Network）
3. 残差连接 + Layer Norm

**关键特点**：
- 使用掩码防止看到未来的词
- 自回归生成（逐个生成）
- 没有编码器-解码器注意力

**代码实现**：

```python
import torch
import torch.nn as nn

class GPTBlock(nn.Module):
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        """
        GPT 解码器层
        
        参数：
        - d_model: 模型维度
        - num_heads: 注意力头数
        - d_ff: 前馈网络隐藏层维度
        - dropout: dropout 率
        """
        super().__init__()
        
        # 掩码自注意力
        self.self_attn = nn.MultiheadAttention(
            d_model, num_heads, dropout=dropout
        )
        
        # 前馈网络
        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),  # GPT 使用 GELU 激活
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
        - mask: 掩码（防止看到未来）
        """
        # 第一步：掩码自注意力 + 残差 + Layer Norm
        attn_out = self.self_attn(x, x, x, attn_mask=mask)[0]
        x = self.norm1(x + self.dropout1(attn_out))
        
        # 第二步：前馈网络 + 残差 + Layer Norm
        ff_out = self.feed_forward(x)
        x = self.norm2(x + self.dropout2(ff_out))
        
        return x

class GPT(nn.Module):
    def __init__(
        self,
        vocab_size,
        d_model=768,
        num_heads=12,
        num_layers=12,
        d_ff=3072,
        max_len=1024,
        dropout=0.1
    ):
        """
        GPT 模型
        
        参数：
        - vocab_size: 词表大小
        - d_model: 模型维度
        - num_heads: 注意力头数
        - num_layers: 层数
        - d_ff: 前馈网络隐藏层维度
        - max_len: 最大序列长度
        - dropout: dropout 率
        """
        super().__init__()
        
        # 词嵌入
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        
        # 位置嵌入
        self.position_embedding = nn.Embedding(max_len, d_model)
        
        # 解码器层
        self.blocks = nn.ModuleList([
            GPTBlock(d_model, num_heads, d_ff, dropout)
            for _ in range(num_layers)
        ])
        
        # Layer Norm
        self.norm = nn.LayerNorm(d_model)
        
        # 输出层（与词嵌入共享权重）
        self.lm_head = nn.Linear(d_model, vocab_size, bias=False)
        
        self.d_model = d_model
        self.max_len = max_len
    
    def forward(self, idx, targets=None):
        """
        前向传播
        
        参数：
        - idx: 输入 token IDs，形状 (batch, seq_len)
        - targets: 目标 token IDs（可选）
        """
        batch_size, seq_len = idx.shape
        
        # 词嵌入 + 位置嵌入
        token_emb = self.token_embedding(idx)
        pos_emb = self.position_embedding(
            torch.arange(seq_len, device=idx.device)
        )
        x = token_emb + pos_emb
        
        # 创建掩码（防止看到未来）
        mask = torch.triu(torch.ones(seq_len, seq_len), diagonal=1)
        mask = mask.masked_fill(mask == 1, float('-inf'))
        
        # 通过解码器层
        for block in self.blocks:
            x = block(x, mask)
        
        x = self.norm(x)
        
        # 输出 logits
        logits = self.lm_head(x)
        
        # 计算损失
        loss = None
        if targets is not None:
            loss = nn.functional.cross_entropy(
                logits.view(-1, logits.size(-1)),
                targets.view(-1)
            )
        
        return logits, loss

# 使用示例
vocab_size = 50257  # GPT-2 词表大小
model = GPT(vocab_size, d_model=768, num_heads=12, num_layers=12)

# 输入
batch_size = 2
seq_len = 10
idx = torch.randint(0, vocab_size, (batch_size, seq_len))
targets = torch.randint(0, vocab_size, (batch_size, seq_len))

# 前向传播
logits, loss = model(idx, targets)

print("logits 形状:", logits.shape)  # (2, 10, 50257)
print("损失:", loss.item() if loss else None)
```

### 2.3 自回归生成

**核心思想**：逐个生成 token，每次基于前面生成的 token。

```
输入：我 爱
第 1 步：预测下一个词 → 深度
第 2 步：我 爱 深度 → 学习
第 3 步：我 爱 深度 学习 → 很
...
```

**代码实现**：

```python
def generate(model, idx, max_new_tokens, temperature=1.0, top_k=None):
    """
    自回归生成
    
    参数：
    - model: GPT 模型
    - idx: 输入 token IDs，形状 (batch, seq_len)
    - max_new_tokens: 最大生成 token 数
    - temperature: 温度参数（控制随机性）
    - top_k: Top-K 采样
    """
    for _ in range(max_new_tokens):
        # 截断到最大长度
        idx_cond = idx[:, -model.max_len:]
        
        # 前向传播
        logits, _ = model(idx_cond)
        
        # 取最后一个位置的 logits
        logits = logits[:, -1, :]  # (batch, vocab_size)
        
        # 应用温度
        logits = logits / temperature
        
        # Top-K 采样
        if top_k is not None:
            v, _ = torch.topk(logits, top_k)
            logits[logits < v[:, [-1]]] = float('-inf')
        
        # 转换为概率
        probs = nn.functional.softmax(logits, dim=-1)
        
        # 采样
        idx_next = torch.multinomial(probs, num_samples=1)
        
        # 拼接到序列
        idx = torch.cat([idx, idx_next], dim=1)
    
    return idx

# 使用示例
from transformers import GPT2Tokenizer

tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT(vocab_size=50257)

# 输入
prompt = "I love"
inputs = tokenizer(prompt, return_tensors="pt")
idx = inputs["input_ids"]

# 生成
output = generate(model, idx, max_new_tokens=20, temperature=0.8, top_k=50)

# 解码
generated_text = tokenizer.decode(output[0])
print(generated_text)
```

### 2.4 Scaling Law

**核心发现**：模型性能与模型大小、数据量、计算量呈幂律关系。

**公式**：

```
L(N) = (N_c / N)^α_N
L(D) = (D_c / D)^α_D
L(C) = (C_c / C)^α_C
```

其中：
- L 是损失
- N 是参数量
- D 是数据量
- C 是计算量
- α 是幂律指数

**关键结论**：
1. 模型越大，效果越好（可预测）
2. 数据越多，效果越好（可预测）
3. 模型大小比数据量更重要

**代码验证**：

```python
import torch
import matplotlib.pyplot as plt

# 模拟 Scaling Law
def scaling_law(N, N_c=8.8e13, alpha=0.076):
    """
    预测损失
    
    参数：
    - N: 参数量
    - N_c: 临界参数量
    - alpha: 幂律指数
    """
    return (N_c / N) ** alpha

# 不同参数量的预测损失
param_counts = [1e8, 1e9, 1e10, 1e11, 1e12]
losses = [scaling_law(N) for N in param_counts]

# 可视化
plt.figure(figsize=(10, 6))
plt.loglog(param_counts, losses, 'o-')
plt.xlabel('Number of Parameters')
plt.ylabel('Loss')
plt.title('Scaling Law: Loss vs Model Size')
plt.grid(True)
plt.show()
```

### 2.5 涌现能力

**核心概念**：当模型规模达到一定程度后，突然出现的新能力。

**例子**：
- 小模型：无法做算术
- 大模型（>100B）：突然能做算术了

**常见的涌现能力**：
- 少样本学习（Few-shot Learning）
- 思维链推理（Chain-of-Thought）
- 代码生成
- 多语言翻译

**为什么会出现？**

1. **容量假设**：小模型容量不足，无法学习复杂模式
2. **数据假设**：大模型看到更多数据，学习到更多模式
3. **优化假设**：大模型更容易优化

---

## 3 基础用法

### 3.1 使用 GPT-2 生成文本

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

# 加载模型和 tokenizer
model_name = "gpt2"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2LMHeadModel.from_pretrained(model_name)

# 准备输入
prompt = "人工智能的未来是"
inputs = tokenizer(prompt, return_tensors="pt")

# 生成文本
outputs = model.generate(
    inputs["input_ids"],
    max_length=50,
    num_return_sequences=1,
    no_repeat_ngram_size=2,
    do_sample=True,
    top_k=50,
    top_p=0.95,
    temperature=0.7
)

# 解码输出
generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated_text)
```

### 3.2 使用 GPT-Neo

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

# 加载 GPT-Neo（开源的 GPT-3 替代品）
model_name = "EleutherAI/gpt-neo-1.3B"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# 生成文本
prompt = "Once upon a time"
inputs = tokenizer(prompt, return_tensors="pt")

outputs = model.generate(
    inputs["input_ids"],
    max_length=100,
    do_sample=True,
    temperature=0.9
)

generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated_text)
```

---

## 4 进阶用法

### 4.1 对比不同 GPT 模型

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

def compare_gpt_models(prompt, model_names):
    """
    对比不同 GPT 模型的生成效果
    """
    for model_name in model_names:
        print(f"\n{'='*50}")
        print(f"模型: {model_name}")
        print(f"{'='*50}")
        
        # 加载模型
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        
        # 生成
        inputs = tokenizer(prompt, return_tensors="pt")
        inputs = {k: v.to(model.device) for k, v in inputs.items()}
        
        outputs = model.generate(
            **inputs,
            max_length=100,
            do_sample=True,
            temperature=0.7
        )
        
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"提示: {prompt}")
        print(f"生成: {generated_text}")

# 使用示例
prompt = "人工智能的未来是"
model_names = ["gpt2", "gpt2-medium", "gpt2-large"]
compare_gpt_models(prompt, model_names)
```

### 4.2 实现思维链推理

```python
def chain_of_thought(model, tokenizer, question, max_length=200):
    """
    思维链推理
    
    参数：
    - model: GPT 模型
    - tokenizer: 分词器
    - question: 问题
    - max_length: 最大生成长度
    """
    # 构造提示
    prompt = f"""问题：{question}
让我们一步一步思考：
"""
    
    # 生成
    inputs = tokenizer(prompt, return_tensors="pt")
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    outputs = model.generate(
        **inputs,
        max_length=max_length,
        do_sample=True,
        temperature=0.7
    )
    
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated_text

# 使用示例
from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "gpt2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

question = "一个商店有 23 个苹果，卖了 15 个，又进了 8 个，现在有多少个？"
answer = chain_of_thought(model, tokenizer, question)
print(answer)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **GPT 演进** | GPT-1 → GPT-2 → GPT-3 → GPT-4，规模和能力不断提升 |
| **Decoder-only** | 只使用解码器，适合生成任务 |
| **自回归生成** | 逐个生成 token，基于前面的 token |
| **Scaling Law** | 模型性能与规模呈幂律关系 |
| **涌现能力** | 大规模模型突然出现的新能力 |
| **少样本学习** | 通过少量示例学习任务 |

---

## 6 新手常见误区

### 误区 1："GPT 和 BERT 可以互换使用"

**错！** 它们有不同的架构和适用场景：

| 特性 | GPT | BERT |
| --- | --- | --- |
| 架构 | Decoder-only | Encoder-only |
| 方向 | 单向（从左到右） | 双向 |
| 适用任务 | 生成任务 | 理解任务 |

**正确做法**：
- 生成任务用 GPT
- 理解任务用 BERT

### 误区 2："模型越大一定越好"

**不完全对。** 大模型虽然强大，但也有问题：
- 推理成本高
- 可能过拟合小数据集
- 部署困难

**正确做法**：
- 根据任务选择合适的模型
- 考虑成本和效果的平衡
- 小任务可以用小模型

### 误区 3："涌现能力是突然出现的"

**不完全对。** 涌现能力可能是：
- 渐进式的，只是我们选择的指标不敏感
- 评估方法的问题
- 模型内部已经在学，只是没有表现出来

**正确做法**：
- 不要过度神化涌现能力
- 关注模型的实际表现
- 选择合适的评估指标

---

## 7 动手练习

### 练习 1：基础练习 - 使用 GPT-2 生成文本

**题目**：使用 GPT-2 生成一段关于"人工智能"的文本。

<details>
<summary>点击查看答案</summary>

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")

prompt = "人工智能是"
inputs = tokenizer(prompt, return_tensors="pt")

outputs = model.generate(
    inputs["input_ids"],
    max_length=100,
    do_sample=True,
    temperature=0.7
)

generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated_text)
```

</details>

### 练习 2：进阶练习 - 对比不同 GPT 模型

**题目**：对比 GPT-2、GPT-2-medium、GPT-2-large 的生成效果。

<details>
<summary>点击查看答案</summary>

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

def compare_models(prompt, model_names):
    for model_name in model_names:
        print(f"\n{'='*50}")
        print(f"模型: {model_name}")
        print(f"{'='*50}")
        
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(model_name)
        
        inputs = tokenizer(prompt, return_tensors="pt")
        outputs = model.generate(
            inputs["input_ids"],
            max_length=100,
            do_sample=True,
            temperature=0.7
        )
        
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(generated_text)

prompt = "人工智能的未来是"
model_names = ["gpt2", "gpt2-medium", "gpt2-large"]
compare_models(prompt, model_names)
```

</details>

### 练习 3（挑战）：综合练习 - 实现自回归生成

**题目**：实现一个自回归生成函数，支持温度采样和 Top-K 采样。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

def generate(model, idx, max_new_tokens, temperature=1.0, top_k=None):
    """
    自回归生成
    
    参数：
    - model: GPT 模型
    - idx: 输入 token IDs
    - max_new_tokens: 最大生成 token 数
    - temperature: 温度参数
    - top_k: Top-K 采样
    """
    for _ in range(max_new_tokens):
        idx_cond = idx[:, -model.max_len:]
        logits, _ = model(idx_cond)
        logits = logits[:, -1, :] / temperature
        
        if top_k is not None:
            v, _ = torch.topk(logits, top_k)
            logits[logits < v[:, [-1]]] = float('-inf')
        
        probs = nn.functional.softmax(logits, dim=-1)
        idx_next = torch.multinomial(probs, num_samples=1)
        idx = torch.cat([idx, idx_next], dim=1)
    
    return idx

# 使用示例
from transformers import GPT2Tokenizer

tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT(vocab_size=50257)

prompt = "I love"
inputs = tokenizer(prompt, return_tensors="pt")
idx = inputs["input_ids"]

output = generate(model, idx, max_new_tokens=20, temperature=0.8, top_k=50)
generated_text = tokenizer.decode(output[0])
print(generated_text)
```

</details>

---

## 下一章预告

下一章我们会学习 **大语言模型训练技术**——如何训练大规模的语言模型。你会学到分布式训练、数据并行、模型并行、混合精度训练、DeepSpeed、Megatron-LM 等关键技术。这些是训练 GPT、LLaMA 等大模型的基础。
