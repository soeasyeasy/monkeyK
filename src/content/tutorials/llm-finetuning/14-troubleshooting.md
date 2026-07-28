---
title: "第14章：微调常见问题与调试"
description: "掌握微调中的常见问题及解决方案，包括过拟合、灾难性遗忘、显存溢出等"
---

# 第14章：微调常见问题与调试

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 训练 loss 不下降怎么办？
- 模型过拟合怎么解决？
- 什么是灾难性遗忘？如何避免？
- 显存溢出怎么办？

这一章会总结 **微调中的常见问题和解决方案**。我们会从 **训练问题** 开始，逐步学习 **效果问题**、**资源问题** 的调试技巧。

---

## 1 训练问题

### 问题 1：Loss 不下降

```python
# 症状：训练 loss 一直很高，不下降
# 可能原因：

# 1. 学习率太小
# ❌ 学习率 1e-6，收敛太慢
training_args = TrainingArguments(learning_rate=1e-6)

# ✅ 增大学习率
training_args = TrainingArguments(learning_rate=2e-4)

# 2. 数据预处理错误
# ❌ 没有正确 tokenize
def wrong_preprocess(examples):
    return {"text": examples["text"]}  # 没有 tokenize

# ✅ 正确 tokenize
def correct_preprocess(examples):
    return tokenizer(examples["text"], truncation=True, max_length=512)

# 3. 模型没有正确加载
# ❌ 模型权重损坏
model = AutoModelForCausalLM.from_pretrained("wrong_path")

# ✅ 检查模型加载
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-hf")
```

### 问题 2：Loss 突然爆炸

```python
# 症状：loss 突然变成 NaN 或很大

# 解决方案：

# 1. 降低学习率
training_args = TrainingArguments(learning_rate=1e-5)

# 2. 增加梯度裁剪
training_args = TrainingArguments(max_grad_norm=1.0)

# 3. 使用 warmup
training_args = TrainingArguments(warmup_ratio=0.1)

# 4. 检查数据
# 确保没有异常值
for batch in dataloader:
    assert not torch.isnan(batch["input_ids"]).any(), "数据包含 NaN"
```

### 问题 3：训练不稳定

```python
# 症状：loss 波动很大

# 解决方案：

# 1. 增加 batch size
training_args = TrainingArguments(per_device_train_batch_size=8)

# 2. 使用梯度累积
training_args = TrainingArguments(gradient_accumulation_steps=4)

# 3. 调整学习率调度
training_args = TrainingArguments(lr_scheduler_type="cosine")
```

---

## 2 效果问题

### 问题 1：过拟合

```python
# 症状：训练 loss 下降，验证 loss 上升

# 解决方案：

# 1. 增加数据量
# 收集更多训练数据

# 2. 数据增强
from data_augmentation import augment_data
augmented_data = augment_data(train_data)

# 3. 减少训练轮数
training_args = TrainingArguments(num_train_epochs=3)

# 4. 增加正则化
training_args = TrainingArguments(weight_decay=0.01)

# 5. 使用早停
from transformers import EarlyStoppingCallback
trainer = Trainer(
    callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
)
```

### 问题 2：灾难性遗忘

```python
# 症状：微调后模型忘记原来的知识

# 解决方案：

# 1. 使用参数高效微调（LoRA）
from peft import LoraConfig
config = LoraConfig(r=8)  # 只更新少量参数

# 2. 混合数据训练
# 同时使用新数据和部分旧数据
mixed_data = new_data + old_data[:1000]

# 3. 降低学习率
training_args = TrainingArguments(learning_rate=1e-5)

# 4. 使用 EWC（弹性权重巩固）
# 保留重要参数的值
```

### 问题 3：效果不如预期

```python
# 症状：微调后效果提升不明显

# 检查清单：

# 1. 数据质量
print(f"数据量: {len(dataset)}")
print(f"数据示例: {dataset[0]}")

# 2. 数据分布
categories = [item["category"] for item in dataset]
print(f"类别分布: {Counter(categories)}")

# 3. 训练参数
print(f"学习率: {training_args.learning_rate}")
print(f"训练轮数: {training_args.num_train_epochs}")

# 4. 模型选择
# 尝试不同的基座模型
```

---

## 3 资源问题

### 问题 1：显存溢出（OOM）

```python
# 症状：CUDA out of memory

# 解决方案（按优先级）：

# 1. 减小 batch size
training_args = TrainingArguments(per_device_train_batch_size=1)

# 2. 增加梯度累积
training_args = TrainingArguments(gradient_accumulation_steps=16)

# 3. 启用混合精度
training_args = TrainingArguments(fp16=True)

# 4. 启用梯度检查点
training_args = TrainingArguments(gradient_checkpointing=True)

# 5. 使用量化
from transformers import BitsAndBytesConfig
bnb_config = BitsAndBytesConfig(load_in_4bit=True)
model = AutoModelForCausalLM.from_pretrained(model_name, quantization_config=bnb_config)

# 6. 使用 DeepSpeed
training_args = TrainingArguments(deepspeed="ds_config.json")
```

### 问题 2：训练太慢

```python
# 症状：训练速度很慢

# 解决方案：

# 1. 使用多卡训练
# accelerate launch --num_processes=4 train.py

# 2. 优化数据加载
dataloader = DataLoader(dataset, batch_size=8, num_workers=4, pin_memory=True)

# 3. 使用编译优化
model = torch.compile(model)

# 4. 减少评估频率
training_args = TrainingArguments(eval_steps=1000)
```

---

## 4 调试技巧

### 监控训练

```python
# 使用 TensorBoard
training_args = TrainingArguments(
    logging_dir="./logs",
    logging_steps=100,
)

# 启动 TensorBoard
# tensorboard --logdir ./logs

# 监控关键指标
metrics_to_watch = {
    "train_loss": "应该下降",
    "eval_loss": "应该下降，不反弹",
    "learning_rate": "按调度变化",
    "grad_norm": "不应该爆炸（<10）",
}
```

### 调试代码

```python
# 1. 检查数据
for batch in dataloader:
    print(f"Batch shape: {batch['input_ids'].shape}")
    print(f"Sample: {tokenizer.decode(batch['input_ids'][0])}")
    break

# 2. 检查模型
print(f"Model device: {next(model.parameters()).device}")
print(f"Trainable params: {sum(p.numel() for p in model.parameters() if p.requires_grad)}")

# 3. 检查梯度
for name, param in model.named_parameters():
    if param.grad is not None:
        print(f"{name}: grad norm = {param.grad.norm().item():.4f}")
```

---

## 5 核心知识点总结

| 问题 | 症状 | 解决方案 |
|------|------|---------|
| **Loss 不下降** | 训练 loss 很高 | 增大学习率、检查数据 |
| **Loss 爆炸** | loss 变成 NaN | 降低学习率、梯度裁剪 |
| **过拟合** | 验证 loss 上升 | 增加数据、早停、正则化 |
| **灾难性遗忘** | 忘记原知识 | LoRA、混合数据 |
| **显存溢出** | OOM 错误 | 减小 batch、量化、DeepSpeed |

---

## 6 动手练习

### 练习 1：解决过拟合

设计一个解决过拟合的方案。

<details>
<summary>点击查看答案</summary>

```python
# 解决方案组合
training_args = TrainingArguments(
    num_train_epochs=5,
    per_device_train_batch_size=8,
    learning_rate=2e-5,
    weight_decay=0.01,
    load_best_model_at_end=True,
)

# 使用早停
from transformers import EarlyStoppingCallback
trainer = Trainer(
    callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
)
```

</details>

---

## 下一章预告

下一章我们会学习 **企业级微调项目实战**——完整的项目流程。你会学到从需求分析到部署上线的全过程。让我们继续！
