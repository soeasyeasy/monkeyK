---
title: "第05章：全参数微调实战"
description: "掌握全参数微调的完整流程，包括训练配置、显存优化和实战案例"
---

# 第05章：全参数微调实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 全参数微调的完整流程是什么？
- 显存不够怎么办？
- 训练参数怎么设置？
- 如何避免训练崩溃？

这一章会带你 **完整实现一次全参数微调**。我们会从 **训练流程** 开始，逐步学习 **显存优化**、**参数调优** 等实战技巧，让你能独立完成模型微调。

---

## 1 为什么需要全参数微调？

### 痛点分析

**问题 1：参数高效微调效果有限**

```python
# ❌ LoRA 在某些任务上效果不够好
# 复杂任务需要更强的适配能力
```

**问题 2：不知道全参数微调怎么做**

```python
# ❌ 直接训练，显存溢出
RuntimeError: CUDA out of memory
```

### 解决方案

全参数微调虽然资源需求大，但效果最好。掌握它可以：

- ✅ 获得最优效果
- ✅ 理解微调本质
- ✅ 为其他方法打基础

---

## 2 全参数微调流程

### 完整流程

```
1. 准备数据
   ↓
2. 加载模型和分词器
   ↓
3. 数据预处理
   ↓
4. 配置训练参数
   ↓
5. 开始训练
   ↓
6. 评估和保存
```

### 代码实现

```python
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    DataCollatorForLanguageModeling,
)
from datasets import load_dataset
import torch

# 1. 配置参数
model_name = "gpt2"  # 用小模型示例
output_dir = "./output/full-finetuning"

# 2. 加载模型和分词器
print("加载模型...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# 添加 padding token
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
    model.config.pad_token_id = model.config.eos_token_id

# 3. 加载数据
print("加载数据...")
dataset = load_dataset("text", data_files="train.txt")

# 4. 数据预处理
def tokenize_function(examples):
    """
    分词和截断
    """
    # 分词
    tokenized = tokenizer(
        examples["text"],
        truncation=True,
        max_length=512,
        padding="max_length",
    )
    return tokenized

# 应用分词
tokenized_datasets = dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=["text"],
)

# 5. 数据整理器
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False,  # 因果语言模型
)

# 6. 配置训练参数
training_args = TrainingArguments(
    output_dir=output_dir,
    num_train_epochs=3,              # 训练轮数
    per_device_train_batch_size=4,   # 批次大小
    per_device_eval_batch_size=4,
    learning_rate=2e-5,              # 学习率
    weight_decay=0.01,               # 权重衰减
    warmup_ratio=0.1,                # 预热比例
    lr_scheduler_type="cosine",      # 学习率调度
    logging_steps=100,               # 日志间隔
    save_steps=500,                  # 保存间隔
    eval_strategy="steps",           # 评估策略
    eval_steps=500,                  # 评估间隔
    save_total_limit=3,              # 最多保存 3 个 checkpoint
    fp16=torch.cuda.is_available(),  # 混合精度
    gradient_accumulation_steps=4,   # 梯度累积
    max_grad_norm=1.0,               # 梯度裁剪
)

# 7. 创建 Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets.get("validation"),
    data_collator=data_collator,
)

# 8. 开始训练
print("开始训练...")
trainer.train()

# 9. 保存模型
trainer.save_model(f"{output_dir}/final")
tokenizer.save_pretrained(f"{output_dir}/final")
print("训练完成！")
```

---

## 3 显存优化技术

### 技术 1：梯度累积

```python
# 问题：显存不够用大 batch size
# 解决：用小 batch size + 梯度累积

training_args = TrainingArguments(
    per_device_train_batch_size=2,      # 实际 batch size
    gradient_accumulation_steps=8,      # 累积 8 步
    # 等效 batch size = 2 × 8 = 16
)
```

**原理**

```python
# 不累积：一次性计算大 batch
# 显存需求：batch_size × seq_len × hidden_size

# 累积：分多次计算，最后更新
# 显存需求：(batch_size / accumulation_steps) × seq_len × hidden_size
```

### 技术 2：混合精度训练

```python
# FP16 混合精度
training_args = TrainingArguments(
    fp16=True,  # 使用 FP16
)

# BF16 混合精度（推荐，如果 GPU 支持）
training_args = TrainingArguments(
    bf16=True,  # 使用 BF16
)
```

**显存对比**

| 精度 | 显存占用 | 速度 |
|------|---------|------|
| FP32 | 100% | 基准 |
| FP16 | 50% | 2x |
| BF16 | 50% | 2x |

### 技术 3：梯度检查点

```python
# 用计算换显存
training_args = TrainingArguments(
    gradient_checkpointing=True,  # 启用梯度检查点
)

# 或者在模型上设置
model.gradient_checkpointing_enable()
```

**原理**

```python
# 正常训练：保存所有中间激活值
# 显存需求：O(n)

# 梯度检查点：只保存部分，需要时重新计算
# 显存需求：O(√n)
# 计算时间增加约 20%
```

### 技术 4：DeepSpeed 集成

```python
# 安装 DeepSpeed
# pip install deepspeed

# 配置文件 ds_config.json
{
  "train_batch_size": 16,
  "gradient_accumulation_steps": 4,
  "fp16": {
    "enabled": true
  },
  "zero_optimization": {
    "stage": 3,  # ZeRO-3：分片所有状态
    "offload_optimizer": {
      "device": "cpu"  # 优化器状态卸载到 CPU
    },
    "offload_param": {
      "device": "cpu"  # 模型参数卸载到 CPU
    }
  }
}

# 使用 DeepSpeed
training_args = TrainingArguments(
    deepspeed="ds_config.json",
)
```

---

## 4 训练参数调优

### 学习率设置

```python
# 不同模型推荐的学习率
learning_rates = {
    "gpt2": 2e-5,
    "llama-2-7b": 2e-5,
    "bert-base": 5e-5,
    "t5-base": 3e-4,
}

# 经验法则：
# - 全参数微调：1e-5 ~ 5e-5
# - 学习率太大：训练不稳定
# - 学习率太小：收敛慢
```

### 批次大小设置

```python
# 根据显存调整
def calculate_batch_size(gpu_memory_gb, model_size_gb):
    """
    计算合适的批次大小
    """
    # 预留 20% 显存
    available = gpu_memory_gb * 0.8
    
    # 每个样本需要的显存（粗略估计）
    per_sample = model_size_gb / 10
    
    batch_size = int(available / per_sample)
    
    # 取 2 的幂次
    batch_size = 2 ** int(np.log2(batch_size))
    
    return max(1, batch_size)

# 示例
print(calculate_batch_size(24, 14))  # RTX 3090, GPT-2
```

### 训练轮数设置

```python
# 经验法则
epochs_guide = {
    "小数据集（<1k）": "10-20 epochs",
    "中等数据集（1k-10k）": "3-10 epochs",
    "大数据集（>10k）": "1-3 epochs",
}

# 使用早停防止过拟合
from transformers import EarlyStoppingCallback

training_args = TrainingArguments(
    num_train_epochs=10,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
)

trainer = Trainer(
    callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
)
```

---

## 5 完整实战案例

### 案例：微调 GPT-2 生成中文诗歌

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
from datasets import load_dataset
import torch

# 1. 准备数据
# 假设我们有诗歌数据
poems = [
    "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
    "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。",
    # ... 更多诗歌
]

# 保存为文件
with open("poems.txt", "w", encoding="utf-8") as f:
    for poem in poems:
        f.write(poem + "\n")

# 2. 加载模型
model_name = "uer/gpt2-chinese-cluecorpussmall"  # 中文 GPT-2
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# 3. 数据预处理
dataset = load_dataset("text", data_files="poems.txt")

def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=128,
        padding="max_length",
    )

tokenized = dataset.map(tokenize_function, batched=True, remove_columns=["text"])

# 4. 训练配置
training_args = TrainingArguments(
    output_dir="./poem-model",
    num_train_epochs=10,
    per_device_train_batch_size=8,
    learning_rate=5e-5,
    logging_steps=50,
    save_steps=200,
    fp16=True,
)

# 5. 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized["train"],
)

trainer.train()

# 6. 生成诗歌
def generate_poem(prompt, max_length=100):
    inputs = tokenizer(prompt, return_tensors="pt")
    if torch.cuda.is_available():
        inputs = {k: v.cuda() for k, v in inputs.items()}
        model.cuda()
    
    outputs = model.generate(
        **inputs,
        max_new_tokens=max_length,
        temperature=0.8,
        top_p=0.9,
        do_sample=True,
    )
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# 测试
poem = generate_poem("春")
print(poem)
```

---

## 6 训练监控和调试

### 监控训练过程

```python
# 使用 TensorBoard
training_args = TrainingArguments(
    logging_dir="./logs",
    logging_steps=100,
)

# 启动 TensorBoard
# tensorboard --logdir ./logs

# 监控指标
metrics_to_watch = {
    "train_loss": "应该下降",
    "eval_loss": "应该下降，不反弹",
    "learning_rate": "按调度变化",
    "grad_norm": "不应该爆炸",
}
```

### 常见问题处理

```python
# 问题 1：loss 不下降
solutions = [
    "检查学习率是否太小",
    "检查数据是否正确预处理",
    "检查模型是否正确加载",
]

# 问题 2：loss 突然爆炸
solutions = [
    "降低学习率",
    "增加梯度裁剪 max_grad_norm",
    "使用 warmup",
]

# 问题 3：显存溢出
solutions = [
    "减小 batch size",
    "增加梯度累积",
    "启用混合精度",
    "启用梯度检查点",
]
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **训练流程** | 数据准备 → 模型加载 → 训练 → 保存 |
| **显存优化** | 梯度累积、混合精度、梯度检查点、DeepSpeed |
| **参数调优** | 学习率、批次大小、训练轮数 |
| **训练监控** | loss 曲线、学习率、梯度范数 |

---

## 8 新手常见误区

### 误区 1："学习率越大训练越快"

**错！** 学习率太大会导致训练不稳定。

正确做法：从 2e-5 开始，根据效果调整。

### 误区 2："batch size 越大越好"

**不一定。** 大 batch size 可能需要更大学习率。

经验法则：batch size 翻倍，学习率也翻倍。

### 误区 3："训练越久越好"

**错！** 训练太久会过拟合。

正确做法：使用早停，监控验证集 loss。

---

## 9 动手练习

### 练习 1：基础微调

微调 GPT-2 在自定义数据上。

<details>
<summary>点击查看答案</summary>

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
from datasets import load_dataset

# 加载模型
model = AutoModelForCausalLM.from_pretrained("gpt2")
tokenizer = AutoTokenizer.from_pretrained("gpt2")

# 加载数据
dataset = load_dataset("text", data_files="my_data.txt")

# 预处理
def tokenize(examples):
    return tokenizer(examples["text"], truncation=True, max_length=512)

dataset = dataset.map(tokenize, batched=True)

# 训练
args = TrainingArguments(
    output_dir="./output",
    num_train_epochs=3,
    per_device_train_batch_size=4,
)

trainer = Trainer(model=model, args=args, train_dataset=dataset["train"])
trainer.train()
```

</details>

### 练习 2：显存优化

实现一个显存优化的训练配置。

<details>
<summary>点击查看答案</summary>

```python
training_args = TrainingArguments(
    output_dir="./output",
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    fp16=True,
    gradient_checkpointing=True,
)
```

</details>

---

## 下一章预告

下一章我们会学习 **LoRA 与 QLoRA 高效微调**——参数更少、显存更省的高效微调方法。你会学到 LoRA 的完整实现和参数配置。让我们继续！
