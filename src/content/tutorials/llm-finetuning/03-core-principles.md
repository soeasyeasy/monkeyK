---
title: "第03章：微调核心原理"
description: "理解迁移学习、参数高效微调的原理，掌握微调的底层逻辑"
---

# 第03章：微调核心原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么微调有效？预训练模型学到了什么？
- 什么是迁移学习？和微调有什么关系？
- 为什么只调整少量参数也能有效？
- 各种微调方法（LoRA、P-Tuning）的底层原理是什么？

这一章会深入讲解 **微调的核心原理**。我们会从 **迁移学习** 开始，逐步理解 **参数高效微调** 的底层逻辑，让你不仅会用，更懂原理。

---

## 1 为什么需要理解原理？

### 痛点分析

**问题 1：只会调用 API，不懂原理**

```python
# ❌ 机械地复制代码
from peft import LoraConfig
config = LoraConfig(r=8, lora_alpha=16)  # 为什么是 8？为什么是 16？
```

**问题 2：遇到问题不知道如何解决**

```python
# ❌ 训练不收敛，不知道调什么参数
# 盲目尝试，浪费时间
```

**问题 3：无法选择合适的方法**

```python
# ❌ 不知道什么时候用 LoRA，什么时候用全参数微调
# 凭感觉选择，效果不稳定
```

### 解决方案

理解原理可以帮你：

- ✅ 合理选择超参数
- ✅ 快速定位和解决问题
- ✅ 选择最适合的微调方法

---

## 2 迁移学习：微调的理论基础

### 什么是迁移学习？

**迁移学习（Transfer Learning）** 是将在一个任务上学到的知识应用到另一个任务的技术。

打个比方：

> 你学会了骑自行车，再学骑摩托车就很快。
> 
> 因为平衡感、转向技巧可以迁移。

在深度学习中：

```
任务 A（源域）：在大规模文本上预训练
    ↓
学到的知识：语言理解能力、语法结构、世界知识
    ↓
任务 B（目标域）：在特定任务上微调
    ↓
应用知识：用预训练的知识解决特定任务
```

### 预训练模型学到了什么？

**1. 语言知识**

```python
# 模型学会了：
# - 词法：单词的拼写规则
# - 句法：语法结构
# - 语义：词义和关系

# 示例
from transformers import pipeline

fill_mask = pipeline("fill-mask")
result = fill_mask("The cat sat on the [MASK]")
# 模型知道 [MASK] 应该是 "mat" 或 "floor"
```

**2. 世界知识**

```python
# 模型从训练数据中学到了事实知识
# 例如：北京是中国的首都
# 例如：水的化学式是 H2O
```

**3. 推理能力**

```python
# 模型学会了简单的推理
# 例如：如果 A > B，B > C，那么 A > C
```

### 迁移学习的类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **归纳迁移** | 源域和目标域任务不同 | 文本分类 → 文本生成 |
| **演绎迁移** | 源域和目标域任务相同，数据分布不同 | 英文新闻 → 中文新闻 |
| **无监督迁移** | 目标域没有标注数据 | 预训练 → 微调 |

---

## 3 微调的底层逻辑

### 为什么微调有效？

**核心思想：预训练模型已经学到了很好的特征表示**

打个比方：

> 预训练模型就像一个见过世面的博学者。
> 
> 微调就像教这个博学者做特定的工作。
> 
> 因为他基础好，所以学得很快。

**数学解释**

```python
# 预训练模型的参数 θ_pretrained 已经在一个很好的位置
# 微调只需要在这个位置附近做小调整

θ_finetuned = θ_pretrained + Δθ

# Δθ 很小，所以：
# 1. 训练快
# 2. 需要的数据少
# 3. 不容易过拟合
```

### 微调的两个阶段

**阶段 1：特征提取（Feature Extraction）**

```python
# 冻结预训练模型的参数
for param in model.parameters():
    param.requires_grad = False

# 只训练新添加的分类头
classifier = nn.Linear(hidden_size, num_classes)

# 优点：训练快，不容易过拟合
# 缺点：效果有限
```

**阶段 2： fine-tuning（微调）**

```python
# 解冻所有参数
for param in model.parameters():
    param.requires_grad = True

# 所有参数都参与训练
# 优点：效果最好
# 缺点：需要更多数据和算力
```

---

## 4 参数高效微调（PEFT）原理

### 为什么只调少量参数也有效？

**核心假设：模型在预训练时已经学到了好的表示，只需要少量调整**

打个比方：

> 预训练模型就像一个训练有素的运动员。
> 
> 参数高效微调就像教他一个新的运动项目。
> 
> 不需要重新训练体能，只需要学习新技巧。

**数学解释**

```python
# 假设预训练模型的参数 θ 在一个最优解附近
# 只需要学习一个小的增量 Δθ

θ_new = θ + Δθ

# 关键发现：Δθ 的秩（rank）很低
# 也就是说，Δθ 可以用低秩矩阵近似

Δθ ≈ A × B

# 其中 A 和 B 是小矩阵
# 例如：Δθ 是 4096×4096，但 A 是 4096×8，B 是 8×4096
# 参数量从 16M 减少到 64K（250 倍）
```

### LoRA 原理详解

**LoRA（Low-Rank Adaptation）** 是最流行的参数高效微调方法。

**核心思想**

```python
# 假设权重更新矩阵 ΔW 是低秩的

ΔW = A × B

# 其中：
# A: d × r（r 远小于 d）
# B: r × d
# r 是秩（rank），通常取 4-64

# 原始权重：W0（d × d）
# 更新后权重：W = W0 + ΔW = W0 + A × B
```

**代码实现**

```python
import torch
import torch.nn as nn

class LoRALayer(nn.Module):
    def __init__(self, original_layer, r=8):
        super().__init__()
        self.original_layer = original_layer
        
        # 冻结原始层
        for param in self.original_layer.parameters():
            param.requires_grad = False
        
        # 获取维度
        d = original_layer.in_features
        
        # 创建低秩矩阵
        self.lora_A = nn.Parameter(torch.randn(d, r))
        self.lora_B = nn.Parameter(torch.randn(r, d))
        
        # 初始化
        nn.init.kaiming_uniform_(self.lora_A)
        nn.init.zeros_(self.lora_B)  # 初始时 ΔW = 0
    
    def forward(self, x):
        # 原始输出
        out = self.original_layer(x)
        
        # LoRA 增量
        delta = x @ self.lora_A @ self.lora_B
        
        return out + delta
```

**参数量对比**

```python
# 原始模型：7B 参数
original_params = 7_000_000_000

# LoRA（r=8）：
# 假设对 128 个线性层应用 LoRA
# 每个层：d × r + r × d = 2 × d × r
# 总参数：128 × 2 × 4096 × 8 ≈ 8M

lora_params = 8_000_000

# 减少比例
reduction = original_params / lora_params
print(f"参数减少 {reduction:.0f} 倍")  # 约 875 倍
```

### QLoRA 原理

**QLoRA = 量化 + LoRA**

```python
# 1. 将预训练模型量化为 4-bit
from transformers import BitsAndBytesConfig

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

# 2. 在量化模型上应用 LoRA
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
)

# 3. 只训练 LoRA 参数
# 显存占用大幅降低
```

**显存对比**

| 方法 | 7B 模型显存需求 |
|------|----------------|
| 全参数微调 | 56 GB |
| LoRA | 16 GB |
| QLoRA | 6 GB |

---

## 5 P-Tuning 原理

### P-Tuning v1

**核心思想：学习连续的提示向量**

```python
# 传统 Prompt
prompt = "翻译这句话：[MASK]"

# P-Tuning
# 在输入前添加可学习的虚拟 token
[prompt_embed_1] [prompt_embed_2] ... [prompt_embed_n] [原始输入]

# 只训练这些虚拟 token 的 embedding
```

**代码示例**

```python
class PTuningV1(nn.Module):
    def __init__(self, model, num_virtual_tokens=20):
        super().__init__()
        self.model = model
        self.num_virtual_tokens = num_virtual_tokens
        
        # 可学习的虚拟 token embedding
        self.prompt_embeddings = nn.Parameter(
            torch.randn(num_virtual_tokens, model.config.hidden_size)
        )
    
    def forward(self, input_ids):
        batch_size = input_ids.size(0)
        
        # 扩展 prompt embeddings
        prompt_embeds = self.prompt_embeddings.unsqueeze(0).expand(batch_size, -1, -1)
        
        # 获取输入 embeddings
        input_embeds = self.model.get_input_embeddings()(input_ids)
        
        # 拼接
        combined_embeds = torch.cat([prompt_embeds, input_embeds], dim=1)
        
        # 前向传播
        outputs = self.model(inputs_embeds=combined_embeds)
        
        return outputs
```

### P-Tuning v2

**改进：在每一层都添加 prompt**

```python
# P-Tuning v1：只在输入层添加 prompt
# P-Tuning v2：在每一层的输入都添加 prompt

# 优点：
# 1. 更强的表达能力
# 2. 适合小模型
# 3. 效果更好
```

---

## 6 Prefix Tuning 原理

### 核心思想

**在每一层的 key 和 value 前添加可学习的前缀**

```python
# Transformer 的自注意力机制
Attention(Q, K, V) = softmax(QK^T / √d) V

# Prefix Tuning
# 添加可学习的前缀 P_K 和 P_V
K' = [P_K; K]
V' = [P_V; V]

Attention(Q, K', V') = softmax(QK'^T / √d) V'
```

**代码示例**

```python
class PrefixTuning(nn.Module):
    def __init__(self, model, prefix_length=20):
        super().__init__()
        self.model = model
        self.prefix_length = prefix_length
        self.num_layers = model.config.num_hidden_layers
        self.hidden_size = model.config.hidden_size
        
        # 为每一层创建可学习的前缀
        self.prefix_keys = nn.ParameterList([
            nn.Parameter(torch.randn(prefix_length, self.hidden_size))
            for _ in range(self.num_layers)
        ])
        
        self.prefix_values = nn.ParameterList([
            nn.Parameter(torch.randn(prefix_length, self.hidden_size))
            for _ in range(self.num_layers)
        ])
```

---

## 7 各种方法对比

| 方法 | 原理 | 参数量 | 显存需求 | 适用场景 |
|------|------|--------|---------|---------|
| **全参数微调** | 更新所有参数 | 100% | 高 | 数据充足，追求最优效果 |
| **LoRA** | 低秩分解 | 1-5% | 低 | 通用场景，性价比高 |
| **QLoRA** | 量化 + LoRA | 1-5% | 极低 | 显存受限 |
| **P-Tuning v1** | 学习 prompt | <1% | 低 | 简单任务 |
| **P-Tuning v2** | 每层 prompt | 1-3% | 中 | 小模型，复杂任务 |
| **Prefix Tuning** | 每层前缀 | 1-3% | 中 | 生成任务 |

---

## 8 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **迁移学习** | 将预训练知识迁移到下游任务 |
| **参数高效微调** | 只调整少量参数，节省资源 |
| **LoRA 原理** | 低秩分解，ΔW = A × B |
| **QLoRA** | 量化 + LoRA，显存需求极低 |
| **P-Tuning** | 学习连续的提示向量 |
| **Prefix Tuning** | 在每层添加可学习前缀 |

---

## 9 新手常见误区

### 误区 1："LoRA 的 r 越大越好"

**错！** r 太大会过拟合。

正确做法：
- 简单任务：r = 4-8
- 中等任务：r = 8-16
- 复杂任务：r = 16-32

### 误区 2："参数高效微调效果一定差"

**不一定。** 很多情况下，PEFT 效果接近甚至超过全参数微调。

原因：
- 全参数微调容易过拟合
- PEFT 有正则化效果
- 数据量少时 PEFT 更稳定

### 误区 3："LoRA 只能用于线性层"

**错！** LoRA 可以用于任何矩阵乘法。

```python
# 常见应用位置
# 1. 自注意力的 Q、K、V 投影
# 2. 前馈网络的线性层
# 3. 输出层
```

---

## 10 动手练习

### 练习 1：理解 LoRA 原理

手动实现一个简单的 LoRA 层，验证参数量减少。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

# 原始线性层
original = nn.Linear(4096, 4096)
original_params = sum(p.numel() for p in original.parameters())
print(f"原始参数量: {original_params:,}")  # 16,781,312

# LoRA 层
r = 8
lora_A = nn.Parameter(torch.randn(4096, r))
lora_B = nn.Parameter(torch.randn(r, 4096))
lora_params = lora_A.numel() + lora_B.numel()
print(f"LoRA 参数量: {lora_params:,}")  # 65,536

print(f"参数减少: {original_params / lora_params:.0f} 倍")  # 256 倍
```

</details>

### 练习 2：计算显存需求

计算微调 7B 模型需要的显存（全参数、LoRA、QLoRA）。

<details>
<summary>点击查看答案</summary>

```python
# 模型参数：7B
params = 7_000_000_000

# 全参数微调
# 模型参数：7B × 4 字节 = 28 GB
# 优化器状态：7B × 8 字节 = 56 GB
# 梯度：7B × 4 字节 = 28 GB
# 总计：约 112 GB（实际用混合精度约 56 GB）

full_ft = params * 4 / 1e9
print(f"全参数微调: {full_ft * 2:.0f} GB（混合精度）")

# LoRA
# 模型参数：28 GB（冻结）
# LoRA 参数：约 10M × 4 字节 = 40 MB
# 优化器状态：10M × 8 字节 = 80 MB
# 总计：约 28 GB（实际约 16 GB）

lora = full_ft + 0.1
print(f"LoRA: {lora:.0f} GB")

# QLoRA
# 量化模型：7B × 0.5 字节 = 3.5 GB
# LoRA 参数：40 MB
# 总计：约 6 GB

qlora = params * 0.5 / 1e9 + 0.1
print(f"QLoRA: {qlora:.0f} GB")
```

</details>

### 练习 3（挑战）：比较不同方法

设计实验比较全参数微调、LoRA、P-Tuning 的效果。

<details>
<summary>点击查看答案</summary>

```python
# 实验设计
experiments = {
    "full_finetuning": {
        "trainable_params": "100%",
        "memory": "56 GB",
        "time": "10 小时",
    },
    "lora": {
        "trainable_params": "1%",
        "memory": "16 GB",
        "time": "2 小时",
    },
    "p_tuning_v2": {
        "trainable_params": "0.1%",
        "memory": "12 GB",
        "time": "1.5 小时",
    },
}

# 评估指标
metrics = ["loss", "accuracy", "bleu", "rouge"]

# 训练并记录结果
# ...
```

</details>

---

## 下一章预告

下一章我们会学习 **数据准备与处理**——也就是如何准备高质量的微调数据。你会学到数据格式、数据清洗、数据增强等实用技术。数据质量决定模型上限，让我们开始吧！
