---
title: "第11章：Hugging Face Transformers 微调框架"
description: "掌握 Transformers 库的 Trainer API、自定义训练循环和高级技巧"
---

# 第11章：Hugging Face Transformers 微调框架

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Trainer API 有哪些高级用法？
- 如何自定义训练循环？
- 如何使用回调函数？
- 如何保存和加载模型？

这一章会深入讲解 **Transformers 库的微调框架**。我们会从 **Trainer API** 开始，逐步学习 **自定义训练**、**回调函数**、**模型管理** 等高级技巧。

---

## 1 Trainer API 详解

### 基础用法

```python
from transformers import Trainer, TrainingArguments

# 1. 配置训练参数
training_args = TrainingArguments(
    output_dir="./output",
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    learning_rate=2e-5,
    weight_decay=0.01,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
)

# 2. 创建 Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
)

# 3. 训练
trainer.train()

# 4. 评估
metrics = trainer.evaluate()
print(metrics)

# 5. 保存
trainer.save_model("./output/best")
```

### 自定义评估指标

```python
import numpy as np
from datasets import load_metric

# 加载评估指标
metric = load_metric("accuracy")

def compute_metrics(eval_pred):
    """
    自定义评估指标
    
    Args:
        eval_pred: EvalPrediction 对象，包含 predictions 和 label_ids
    """
    logits, labels = eval_pred
    
    # 获取预测结果
    predictions = np.argmax(logits, axis=-1)
    
    # 计算准确率
    accuracy = metric.compute(predictions=predictions, references=labels)["accuracy"]
    
    return {"accuracy": accuracy}

# 使用自定义指标
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    compute_metrics=compute_metrics,
)
```

---

## 2 自定义训练循环

### 使用 Accelerate

```python
from accelerate import Accelerator
from transformers import get_scheduler
import torch

# 1. 初始化 Accelerator
accelerator = Accelerator()

# 2. 准备数据加载器
from torch.utils.data import DataLoader

train_dataloader = DataLoader(train_dataset, batch_size=8, shuffle=True)
eval_dataloader = DataLoader(eval_dataset, batch_size=8)

# 3. 准备优化器
optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)

# 4. 准备学习率调度器
num_training_steps = len(train_dataloader) * 3
lr_scheduler = get_scheduler(
    "linear",
    optimizer=optimizer,
    num_warmup_steps=0,
    num_training_steps=num_training_steps,
)

# 5. 使用 Accelerator 准备
model, optimizer, train_dataloader, eval_dataloader = accelerator.prepare(
    model, optimizer, train_dataloader, eval_dataloader
)

# 6. 训练循环
model.train()
for epoch in range(3):
    for batch in train_dataloader:
        outputs = model(**batch)
        loss = outputs.loss
        
        accelerator.backward(loss)
        
        optimizer.step()
        lr_scheduler.step()
        optimizer.zero_grad()
```

---

## 3 回调函数

### 内置回调

```python
from transformers import TrainerCallback, EarlyStoppingCallback

# 早停回调
early_stopping = EarlyStoppingCallback(
    early_stopping_patience=3,
    early_stopping_threshold=0.0,
)

trainer = Trainer(
    callbacks=[early_stopping],
)
```

### 自定义回调

```python
class CustomCallback(TrainerCallback):
    """自定义回调函数"""
    
    def on_log(self, args, state, control, logs=None, **kwargs):
        """日志记录时调用"""
        if logs:
            print(f"Step {state.global_step}: {logs}")
    
    def on_evaluate(self, args, state, control, **kwargs):
        """评估时调用"""
        print("评估完成")
    
    def on_save(self, args, state, control, **kwargs):
        """保存模型时调用"""
        print(f"保存 checkpoint: {state.global_step}")

# 使用自定义回调
trainer = Trainer(
    callbacks=[CustomCallback()],
)
```

---

## 4 模型保存和加载

### 保存模型

```python
# 1. 保存完整模型
trainer.save_model("./output/model")

# 2. 保存 checkpoint
trainer.save_model("./output/checkpoint-1000")

# 3. 保存训练状态
trainer.save_state()
```

### 加载模型

```python
from transformers import AutoModelForCausalLM

# 1. 加载完整模型
model = AutoModelForCausalLM.from_pretrained("./output/model")

# 2. 从 checkpoint 恢复训练
trainer = Trainer(
    model=model,
    args=training_args,
)
trainer.train(resume_from_checkpoint="./output/checkpoint-1000")
```

---

## 5 分布式训练

### 单节点多卡

```bash
# 使用 accelerate launch
accelerate launch --num_processes=4 train.py

# 使用 torchrun
torchrun --nproc_per_node=4 train.py
```

### 多节点训练

```bash
# 节点 1
torchrun \
  --nnodes=2 \
  --node_rank=0 \
  --nproc_per_node=4 \
  --master_addr=192.168.1.1 \
  --master_port=12345 \
  train.py

# 节点 2
torchrun \
  --nnodes=2 \
  --node_rank=1 \
  --nproc_per_node=4 \
  --master_addr=192.168.1.1 \
  --master_port=12345 \
  train.py
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **Trainer API** | 封装训练循环，简单易用 |
| **自定义训练** | 使用 Accelerate 灵活控制 |
| **回调函数** | 在训练不同阶段执行自定义逻辑 |
| **分布式训练** | 多卡、多节点训练 |

---

## 7 动手练习

### 练习 1：自定义评估指标

实现一个包含多个指标的评估函数。

<details>
<summary>点击查看答案</summary>

```python
from datasets import load_metric

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    
    accuracy = load_metric("accuracy").compute(predictions, labels)["accuracy"]
    f1 = load_metric("f1").compute(predictions, labels, average="macro")["f1"]
    
    return {"accuracy": accuracy, "f1": f1}
```

</details>

---

## 下一章预告

下一章我们会学习 **LLaMA-Factory 一站式微调**——一个开箱即用的微调框架。你会学到如何用配置文件快速微调各种模型。让我们继续！
