---
title: "第5章：预训练与微调范式"
description: "预训练任务设计、自监督学习、迁移学习、微调策略、参数高效微调"
---

# 第5章：预训练与微调范式

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是预训练？为什么要先预训练再微调？
- 自监督学习是怎么工作的？不需要标注数据吗？
- 微调和从头训练有什么区别？
- 什么是 LoRA？为什么它这么火？
- 全参数微调和参数高效微调该怎么选？

这一章就是为了解答这些问题。我们会从 **预训练-微调范式** 开始，学习自监督学习、迁移学习，然后深入参数高效微调技术。

---

## 1 为什么需要预训练与微调？

### 痛点分析

**传统 NLP 的问题**：

每个任务都需要从头训练一个模型：
- 情感分析 → 训练一个模型
- 命名实体识别 → 训练另一个模型
- 文本分类 → 再训练一个模型

**问题**：
- ❌ 每个任务都需要大量标注数据
- ❌ 模型之间无法共享知识
- ❌ 训练成本高
- ❌ 小数据集上效果差

打个比方：

> 传统方法就像让每个人从零开始学习每项技能；预训练-微调就像先让一个人学习通用知识，再针对具体工作进行培训。

### 解决方案

**预训练-微调范式**：

1. **预训练（Pre-training）**：在大规模无标注数据上学习通用语言能力
2. **微调（Fine-tuning）**：在特定任务的少量标注数据上适配

> **一句话总结**：预训练学习通用知识，微调学习特定技能，就像先上大学再参加工作培训。

---

## 2 核心原理

### 2.1 自监督学习

**核心思想**：从数据本身构造监督信号，不需要人工标注。

**常见的自监督任务**：

| 任务 | 方法 | 代表模型 |
| --- | --- | --- |
| **掩码语言模型（MLM）** | 随机遮盖词，预测被遮盖的词 | BERT |
| **因果语言模型（CLM）** | 根据前面的词预测下一个词 | GPT |
| **下一句预测（NSP）** | 判断两个句子是否连续 | BERT |

**MLM 示例**：

```
原始句子：我 爱 深度 学习
遮盖后：  我 [MASK] 深度 [MASK]
目标：    我 爱 深度 学习
```

**CLM 示例**：

```
输入：我 爱 深度
目标：爱 深度 学习
```

### 2.2 迁移学习

**核心思想**：将在源任务上学到的知识迁移到目标任务。

```
大规模无标注数据 → 预训练（学习通用语言能力）
         ↓
   预训练模型（通用知识）
         ↓
少量标注数据 → 微调（学习特定任务）
         ↓
   任务特定模型
```

**为什么有效？**

1. 预训练模型已经学会了：
   - 语法结构
   - 语义关系
   - 世界知识

2. 微调只需要学习：
   - 任务特定的输出格式
   - 领域特定的知识

### 2.3 微调策略

#### 全参数微调

**方法**：更新模型的所有参数。

```python
from transformers import BertForSequenceClassification, BertTokenizer
import torch

# 加载预训练模型
model = BertForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=2  # 二分类
)
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

# 准备数据
text = "这部电影非常好看"
inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
labels = torch.tensor([1])  # 正面评价

# 前向传播
outputs = model(**inputs, labels=labels)
loss = outputs.loss

# 反向传播（更新所有参数）
loss.backward()
```

**问题**：
- ❌ 需要大量显存（存储所有参数的梯度）
- ❌ 容易过拟合（参数太多，数据太少）
- ❌ 训练成本高

#### 参数高效微调（PEFT）

**核心思想**：只更新少量参数，冻结大部分预训练参数。

**主要方法**：

| 方法 | 原理 | 可训练参数 |
| --- | --- | --- |
| **LoRA** | 低秩分解 | < 1% |
| **Adapter** | 插入小模块 | 1-5% |
| **Prefix Tuning** | 添加前缀向量 | < 1% |
| **Prompt Tuning** | 学习软提示 | < 0.1% |

---

## 3 基础用法

### 3.1 使用 Hugging Face 微调 BERT

```python
from transformers import (
    BertForSequenceClassification,
    BertTokenizer,
    TrainingArguments,
    Trainer
)
import torch
import numpy as np

# 第一步：加载模型和 tokenizer
model_name = "bert-base-uncased"
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(model_name, num_labels=2)

# 第二步：准备数据
train_texts = ["这部电影很好看", "剧情太无聊了", "演员演技很棒", "浪费时间"]
train_labels = [1, 0, 1, 0]

# 分词
train_encodings = tokenizer(
    train_texts,
    truncation=True,
    padding=True,
    max_length=128
)

# 创建数据集
class SentimentDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels
    
    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item
    
    def __len__(self):
        return len(self.labels)

train_dataset = SentimentDataset(train_encodings, train_labels)

# 第三步：配置训练参数
training_args = TrainingArguments(
    output_dir="./results",          # 输出目录
    num_train_epochs=3,              # 训练轮数
    per_device_train_batch_size=8,   # 每个设备的 batch size
    learning_rate=2e-5,              # 学习率
    weight_decay=0.01,               # 权重衰减
    eval_strategy="epoch",           # 每个 epoch 评估
    save_strategy="epoch",           # 每个 epoch 保存
    load_best_model_at_end=True,     # 结束时加载最佳模型
)

# 第四步：创建 Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
)

# 第五步：开始训练
trainer.train()

# 第六步：保存模型
trainer.save_model("./sentiment-model")
```

### 3.2 使用 LoRA 进行参数高效微调

**安装**：

```bash
pip install peft
```

**代码实现**：

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, TaskType
import torch

# 第一步：加载预训练模型
model_name = "gpt2"
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 第二步：配置 LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,    # 任务类型
    r=8,                              # 低秩维度
    lora_alpha=32,                    # 缩放因子
    lora_dropout=0.1,                 # dropout 率
    target_modules=["c_attn"],        # 目标模块
)

# 第三步：应用 LoRA
model = get_peft_model(model, lora_config)

# 查看可训练参数
model.print_trainable_parameters()
# 输出：trainable params: 440,320 || all params: 124,885,760 || trainable%: 0.3526

# 第四步：正常训练（只更新 LoRA 参数）
optimizer = torch.optim.AdamW(model.parameters(), lr=2e-4)

# 训练循环...
```

---

## 4 进阶用法

### 4.1 LoRA 原理详解

**核心思想**：用低秩矩阵近似权重更新。

```
原始权重：W（d × d）
权重更新：ΔW = A × B
其中：A（d × r），B（r × d），r << d

前向传播：h = Wx + ΔWx = Wx + ABx
```

**代码实现**：

```python
import torch
import torch.nn as nn

class LoRALayer(nn.Module):
    def __init__(self, original_layer, r=8, lora_alpha=32):
        """
        LoRA 层
        
        参数：
        - original_layer: 原始线性层
        - r: 低秩维度
        - lora_alpha: 缩放因子
        """
        super().__init__()
        self.original_layer = original_layer
        self.r = r
        self.lora_alpha = lora_alpha
        
        # 获取原始层的维度
        in_features = original_layer.in_features
        out_features = original_layer.out_features
        
        # 低秩矩阵
        self.lora_A = nn.Parameter(torch.zeros(in_features, r))
        self.lora_B = nn.Parameter(torch.zeros(r, out_features))
        
        # 缩放因子
        self.scaling = lora_alpha / r
        
        # 初始化
        nn.init.kaiming_uniform_(self.lora_A, a=5**0.5)
        nn.init.zeros_(self.lora_B)
    
    def forward(self, x):
        # 原始输出
        original_output = self.original_layer(x)
        
        # LoRA 输出
        lora_output = (x @ self.lora_A @ self.lora_B) * self.scaling
        
        # 合并
        return original_output + lora_output

# 使用示例
original_layer = nn.Linear(512, 512)
lora_layer = LoRALayer(original_layer, r=8)

x = torch.randn(2, 10, 512)
output = lora_layer(x)

print("输出形状:", output.shape)  # (2, 10, 512)
print("可训练参数:", sum(p.numel() for p in lora_layer.parameters() if p.requires_grad))
```

### 4.2 对比不同微调方法

```python
from transformers import AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType
import torch

def compare_methods(model_name="gpt2"):
    """
    对比不同微调方法的参数量
    """
    # 全参数微调
    model_full = AutoModelForCausalLM.from_pretrained(model_name)
    total_params = sum(p.numel() for p in model_full.parameters())
    
    # LoRA
    model_lora = AutoModelForCausalLM.from_pretrained(model_name)
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=8,
        lora_alpha=32,
        target_modules=["c_attn"],
    )
    model_lora = get_peft_model(model_lora, lora_config)
    lora_params = sum(p.numel() for p in model_lora.parameters() if p.requires_grad)
    
    print(f"总参数量: {total_params:,}")
    print(f"LoRA 可训练参数: {lora_params:,}")
    print(f"LoRA 参数比例: {lora_params/total_params*100:.2f}%")

compare_methods()
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **预训练** | 在大规模无标注数据上学习通用语言能力 |
| **微调** | 在特定任务的标注数据上适配模型 |
| **自监督学习** | 从数据本身构造监督信号 |
| **MLM** | 掩码语言模型，BERT 使用 |
| **CLM** | 因果语言模型，GPT 使用 |
| **全参数微调** | 更新所有参数，效果最好但成本高 |
| **LoRA** | 低秩分解，只更新少量参数 |
| **PEFT** | 参数高效微调，包括 LoRA、Adapter 等 |

---

## 6 新手常见误区

### 误区 1："微调必须用大量数据"

**错！** 微调可以用少量数据：
- 全参数微调：通常需要几千到几万条数据
- LoRA 等 PEFT 方法：几百条数据就可以

**正确做法**：
- 数据量少时用 PEFT 方法
- 数据量大时可以用全参数微调
- 数据质量比数量更重要

### 误区 2："LoRA 效果不如全参数微调"

**不完全对。** 在大多数情况下：
- LoRA 效果接近全参数微调
- 在某些任务上甚至更好（因为正则化效果）
- 参数效率高得多

**正确做法**：
- 优先尝试 LoRA
- 如果效果不够再考虑全参数微调
- 根据任务和数据量选择

### 误区 3："预训练模型可以直接用于任何任务"

**不完全对。** 预训练模型需要适配：
- 直接推理（Zero-shot）：效果有限
- 提示学习（Prompt）：中等效果
- 微调（Fine-tuning）：最好效果

**正确做法**：
- 简单任务可以先尝试直接推理
- 复杂任务建议微调
- 根据任务难度选择方法

### 误区 4："学习率越大训练越快"

**错！** 学习率过大会导致：
- 训练不稳定
- 损失震荡
- 模型发散

**正确做法**：
- 微调时学习率要小（通常 1e-5 到 5e-5）
- 使用学习率调度器
- 从小学习率开始，逐步调整

---

## 7 动手练习

### 练习 1：基础练习 - 使用 Hugging Face 微调 BERT

**题目**：使用 BERT 进行情感分类微调。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertForSequenceClassification, BertTokenizer, Trainer, TrainingArguments
import torch

# 加载模型和 tokenizer
model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=2)
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

# 准备数据
texts = ["这部电影很好看", "剧情太无聊了", "演员演技很棒", "浪费时间"]
labels = [1, 0, 1, 0]

# 分词
encodings = tokenizer(texts, truncation=True, padding=True, max_length=128)

# 创建数据集
class Dataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels
    
    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item
    
    def __len__(self):
        return len(self.labels)

dataset = Dataset(encodings, labels)

# 训练
args = TrainingArguments(output_dir="./results", num_train_epochs=3, per_device_train_batch_size=2)
trainer = Trainer(model=model, args=args, train_dataset=dataset)
trainer.train()
```

</details>

### 练习 2：进阶练习 - 使用 LoRA 微调 GPT-2

**题目**：使用 LoRA 对 GPT-2 进行参数高效微调。

<details>
<summary>点击查看答案</summary>

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, TaskType
import torch

# 加载模型
model = AutoModelForCausalLM.from_pretrained("gpt2")
tokenizer = AutoTokenizer.from_pretrained("gpt2")

# 配置 LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,
    lora_alpha=32,
    lora_dropout=0.1,
    target_modules=["c_attn"],
)

# 应用 LoRA
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# 准备数据并训练...
```

</details>

### 练习 3（挑战）：综合练习 - 对比不同微调方法

**题目**：对比全参数微调、LoRA、Adapter 三种方法的参数量和效果。

<details>
<summary>点击查看答案</summary>

```python
from transformers import AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType
import torch

def compare_methods():
    model_name = "gpt2"
    
    # 全参数微调
    model_full = AutoModelForCausalLM.from_pretrained(model_name)
    total = sum(p.numel() for p in model_full.parameters())
    
    # LoRA
    model_lora = AutoModelForCausalLM.from_pretrained(model_name)
    lora_config = LoraConfig(task_type=TaskType.CAUSAL_LM, r=8, lora_alpha=32, target_modules=["c_attn"])
    model_lora = get_peft_model(model_lora, lora_config)
    lora_params = sum(p.numel() for p in model_lora.parameters() if p.requires_grad)
    
    print(f"总参数: {total:,}")
    print(f"LoRA 可训练: {lora_params:,} ({lora_params/total*100:.2f}%)")

compare_methods()
```

</details>

---

## 下一章预告

下一章我们会学习 **BERT 模型深度解析**——这是 NLP 领域最重要的模型之一。你会学到 BERT 的架构设计、预训练任务、微调应用以及各种变体模型。
