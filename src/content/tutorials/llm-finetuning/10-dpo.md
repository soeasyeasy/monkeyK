---
title: "第10章：DPO 直接偏好优化"
description: "掌握 DPO 的原理与实现，比 RLHF 更简单的对齐方法"
---

# 第10章：DPO 直接偏好优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- DPO 是什么？和 RLHF 有什么区别？
- 为什么 DPO 更简单？
- DPO 的效果如何？
- 如何实现 DPO？

这一章会讲解 **DPO（Direct Preference Optimization）** 的原理与实战。DPO 是比 RLHF 更简单的对齐方法，不需要训练奖励模型。

---

## 1 DPO 原理

### DPO vs RLHF

```python
# RLHF 流程（复杂）
# 1. SFT
# 2. 训练奖励模型
# 3. PPO 强化学习

# DPO 流程（简单）
# 1. SFT
# 2. 直接用偏好数据训练
```

### 核心思想

```python
# DPO 直接用偏好数据优化策略
# 不需要显式的奖励模型

# 损失函数
# L_DPO = -log σ(β * (log π(y_w|x)/π_ref(y_w|x) - log π(y_l|x)/π_ref(y_l|x)))

# y_w: chosen（人类喜欢的回答）
# y_l: rejected（人类不喜欢的回答）
# π: 当前策略
# π_ref: 参考策略（SFT 模型）
```

---

## 2 DPO 实战

### 完整代码

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import DPOTrainer, DPOConfig
from datasets import load_dataset
import torch

# 1. 加载模型
model_name = "meta-llama/Llama-2-7b-hf"
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float16)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 2. 准备偏好数据
dataset = load_dataset("json", data_files="preferences.json")

def format_data(examples):
    """格式化偏好数据"""
    return {
        "prompt": examples["prompt"],
        "chosen": examples["chosen"],
        "rejected": examples["rejected"],
    }

dataset = dataset.map(format_data)

# 3. DPO 配置
training_args = DPOConfig(
    output_dir="./output/dpo",
    num_train_epochs=1,
    per_device_train_batch_size=2,
    learning_rate=5e-6,
    beta=0.1,  # DPO 温度参数
    logging_steps=100,
    save_steps=500,
    fp16=True,
)

# 4. 创建 DPO Trainer
trainer = DPOTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    tokenizer=tokenizer,
)

# 5. 训练
trainer.train()

# 6. 保存模型
trainer.save_model("./output/dpo-final")
```

---

## 3 参数配置指南

```python
# beta 参数
# 控制与参考模型的偏离程度
# beta 小：更偏离参考模型
# beta 大：更接近参考模型

beta_guide = {
    "保守训练": "0.5-1.0",
    "标准设置": "0.1-0.5",
    "激进训练": "0.01-0.1",
}

# 学习率
# DPO 学习率通常比 SFT 小
lr_guide = {
    "全参数": "1e-6 ~ 5e-6",
    "LoRA": "1e-5 ~ 5e-5",
}
```

---

## 4 DPO 数据准备

```python
# 偏好数据格式
preference_data = [
    {
        "prompt": "如何减肥？",
        "chosen": "建议健康饮食和适量运动，每周运动 3-5 次，每次 30 分钟...",
        "rejected": "吃减肥药最快，不用运动..."
    },
    {
        "prompt": "写一首诗",
        "chosen": "春风拂面花满枝，燕子归来旧相识...",
        "rejected": "春天来了，花开了，很美..."
    }
]

# 数据质量要求
# 1. chosen 和 rejected 要有明显差异
# 2. 覆盖多种场景
# 3. 数据量：1000-10000 条
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **DPO 原理** | 直接用偏好数据优化，不需要奖励模型 |
| **优势** | 比 RLHF 简单、稳定、高效 |
| **参数** | beta 控制偏离程度，学习率要小 |
| **数据** | 需要 prompt + chosen + rejected |

---

## 6 动手练习

### 练习 1：DPO 训练

实现 DPO 训练。

<details>
<summary>点击查看答案</summary>

```python
from trl import DPOTrainer, DPOConfig

config = DPOConfig(output_dir="./dpo", beta=0.1)
trainer = DPOTrainer(model=model, args=config, train_dataset=dataset)
trainer.train()
```

</details>

---

## 下一章预告

下一章我们会学习 **Hugging Face Transformers 微调框架**——Trainer API 的高级用法。你会学到自定义训练循环、回调函数等技巧。让我们继续！
