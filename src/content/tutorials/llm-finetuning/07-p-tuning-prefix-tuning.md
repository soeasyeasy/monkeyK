---
title: "第07章：P-Tuning 与 Prefix Tuning"
description: "掌握 P-Tuning v1/v2 和 Prefix Tuning 的原理与实战"
---

# 第07章：P-Tuning 与 Prefix Tuning

## 本章导读

在学这一章之前，你可能会有这些疑问：

- P-Tuning 和 LoRA 有什么区别？
- Prefix Tuning 是怎么工作的？
- 什么场景下用 P-Tuning 更好？
- 如何选择合适的提示长度？

这一章会讲解 **P-Tuning 和 Prefix Tuning** 的原理与实战。这两种方法通过学习提示向量来适配模型，是另一种参数高效的微调思路。

---

## 1 P-Tuning v1 原理与实战

### 核心思想

```python
# 传统方法：手动设计 prompt
prompt = "请翻译：[MASK]"

# P-Tuning：学习连续的 prompt
# [虚拟token1] [虚拟token2] ... [虚拟tokenN] [原始输入]
# 只训练这些虚拟 token 的 embedding
```

### 代码实现

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PromptEncoderConfig, get_peft_model, TaskType
import torch

# 1. 加载模型
model_name = "gpt2"
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 2. 配置 P-Tuning v1
prompt_config = PromptEncoderConfig(
    task_type=TaskType.CAUSAL_LM,
    num_virtual_tokens=20,        # 虚拟 token 数量
    encoder_hidden_size=256,       # 编码器隐藏层
    token_dim=768,                 # token 维度
)

# 3. 应用 P-Tuning
model = get_peft_model(model, prompt_config)
model.print_trainable_parameters()

# 4. 训练（和 LoRA 类似）
# ...
```

---

## 2 P-Tuning v2 原理与实战

### 改进点

```python
# P-Tuning v1：只在输入层添加 prompt
# P-Tuning v2：在每一层都添加 prompt

# 优点：
# 1. 更强的表达能力
# 2. 适合小模型
# 3. 效果更好
```

### 代码实现

```python
from peft import PromptEncoderConfig, get_peft_model

# P-Tuning v2 配置
config = PromptEncoderConfig(
    task_type=TaskType.CAUSAL_LM,
    num_virtual_tokens=20,
    encoder_hidden_size=256,
    token_dim=768,
    num_transformer_submodules=1,  # v2 的关键参数
)

model = get_peft_model(model, config)
```

---

## 3 Prefix Tuning 原理与实战

### 核心思想

```python
# 在每一层的 key 和 value 前添加可学习的前缀

# 自注意力：Attention(Q, K, V)
# Prefix Tuning：Attention(Q, [P_K; K], [P_V; V])

# P_K 和 P_V 是可学习的前缀
```

### 代码实现

```python
from peft import PrefixTuningConfig, get_peft_model

# Prefix Tuning 配置
config = PrefixTuningConfig(
    task_type=TaskType.CAUSAL_LM,
    num_virtual_tokens=20,        # 前缀长度
    encoder_hidden_size=256,
)

model = get_peft_model(model, config)
```

---

## 4 方法对比

| 方法 | 原理 | 参数量 | 适用场景 |
|------|------|--------|---------|
| **LoRA** | 低秩分解 | 1-5% | 通用场景 |
| **P-Tuning v1** | 输入层 prompt | <1% | 简单任务 |
| **P-Tuning v2** | 每层 prompt | 1-3% | 小模型 |
| **Prefix Tuning** | 每层前缀 | 1-3% | 生成任务 |

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **P-Tuning** | 学习连续的提示向量 |
| **Prefix Tuning** | 在每层添加可学习前缀 |
| **选择建议** | 通用选 LoRA，小模型选 P-Tuning v2 |

---

## 6 动手练习

### 练习 1：P-Tuning 实现

实现 P-Tuning v2 微调。

<details>
<summary>点击查看答案</summary>

```python
from peft import PromptEncoderConfig, get_peft_model

config = PromptEncoderConfig(
    task_type=TaskType.CAUSAL_LM,
    num_virtual_tokens=20,
)
model = get_peft_model(model, config)
```

</details>

---

## 下一章预告

下一章我们会学习 **指令微调与对齐训练**——如何让模型遵循指令、对齐人类偏好。这是训练 Chat 模型的关键技术。让我们继续！
