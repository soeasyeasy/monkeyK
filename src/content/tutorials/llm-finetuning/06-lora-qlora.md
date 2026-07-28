---
title: "第06章：LoRA 与 QLoRA 高效微调"
description: "掌握 LoRA 和 QLoRA 的原理与实战，实现低资源高效微调"
---

# 第06章：LoRA 与 QLoRA 高效微调

## 本章导读

在学这一章之前，你可能会有这些疑问：

- LoRA 到底怎么用？参数怎么设置？
- QLoRA 和 LoRA 有什么区别？
- 显存不够怎么办？
- 效果不如全参数微调怎么办？

这一章会带你 **完整实现 LoRA 和 QLoRA 微调**。我们会从 **实际代码** 开始，逐步学习 **参数配置**、**显存优化** 等技巧。

---

## 1 LoRA 实战

### 基础实现

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
from peft import LoraConfig, get_peft_model, TaskType
from datasets import load_dataset
import torch

# 1. 加载基础模型
model_name = "meta-llama/Llama-2-7b-hf"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 2. 配置 LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,  # 任务类型
    r=8,                           # 秩，通常 8-32
    lora_alpha=16,                 # 缩放系数，通常 2×r
    lora_dropout=0.05,             # dropout 率
    target_modules=[               # 应用 LoRA 的模块
        "q_proj",                  # 查询投影
        "v_proj",                  # 值投影
    ],
    bias="none",                   # 不训练 bias
)

# 3. 应用 LoRA
model = get_peft_model(model, lora_config)

# 打印可训练参数
model.print_trainable_parameters()
# 输出：trainable params: 4,194,304 || all params: 6,742,609,920 || trainable%: 0.0622

# 4. 准备数据
dataset = load_dataset("json", data_files="train.json")

def preprocess(examples):
    texts = [f"指令：{e['instruction']}\n回答：{e['output']}" for e in examples["data"]]
    return tokenizer(texts, truncation=True, max_length=512)

dataset = dataset.map(preprocess, batched=True)

# 5. 训练配置
training_args = TrainingArguments(
    output_dir="./output/lora",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    learning_rate=3e-4,  # LoRA 学习率可以大一些
    logging_steps=100,
    save_steps=500,
    fp16=True,
)

# 6. 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
)

trainer.train()

# 7. 保存 LoRA 权重
model.save_pretrained("./output/lora-adapter")
```

### 参数配置指南

```python
# r（秩）的选择
r_guide = {
    "简单任务": "4-8",
    "中等任务": "8-16",
    "复杂任务": "16-32",
    "追求效果": "32-64",
}

# lora_alpha 的选择
# 通常设置为 r 的 2 倍
# lora_alpha = 2 × r

# target_modules 的选择
target_modules_guide = {
    "最小配置": ["q_proj", "v_proj"],
    "标准配置": ["q_proj", "k_proj", "v_proj", "o_proj"],
    "完整配置": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
}
```

---

## 2 QLoRA 实战

### 完整实现

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, Trainer, TrainingArguments
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import torch

# 1. 配置 4-bit 量化
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,                    # 4-bit 量化
    bnb_4bit_quant_type="nf4",            # 量化类型
    bnb_4bit_compute_dtype=torch.bfloat16, # 计算精度
    bnb_4bit_use_double_quant=True,       # 双重量化
)

# 2. 加载量化模型
model_name = "meta-llama/Llama-2-7b-hf"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 3. 准备模型用于 k-bit 训练
model = prepare_model_for_kbit_training(model)

# 4. 配置 LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
    target_modules=["q_proj", "v_proj"],
)

# 5. 应用 LoRA
model = get_peft_model(model, lora_config)

# 6. 训练（和 LoRA 一样）
training_args = TrainingArguments(
    output_dir="./output/qlora",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    learning_rate=2e-4,
    fp16=True,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
)

trainer.train()
```

### 显存对比

```python
# 测试显存占用
def test_memory_usage():
    import torch
    
    methods = {
        "全参数微调": 56,  # GB
        "LoRA": 16,
        "QLoRA": 6,
    }
    
    for method, memory in methods.items():
        print(f"{method}: {memory} GB")

test_memory_usage()
```

---

## 3 模型合并和推理

### 合并 LoRA 权重

```python
from peft import PeftModel

# 1. 加载基础模型
base_model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    torch_dtype=torch.float16,
    device_map="auto",
)

# 2. 加载 LoRA 权重
model = PeftModel.from_pretrained(
    base_model,
    "./output/lora-adapter",
)

# 3. 合并权重
model = model.merge_and_unload()

# 4. 保存合并后的模型
model.save_pretrained("./output/merged-model")
tokenizer.save_pretrained("./output/merged-model")
```

### 使用合并后的模型

```python
from transformers import pipeline

# 加载合并后的模型
pipe = pipeline(
    "text-generation",
    model="./output/merged-model",
    tokenizer="./output/merged-model",
    device_map="auto",
)

# 生成文本
result = pipe("你好，我是", max_new_tokens=100)
print(result[0]["generated_text"])
```

---

## 4 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **LoRA 配置** | r=8-32, alpha=2×r, target_modules |
| **QLoRA** | 4-bit 量化 + LoRA，显存省 3 倍 |
| **模型合并** | merge_and_unload() 合并权重 |
| **适用场景** | 显存受限、快速实验 |

---

## 5 新手常见误区

### 误区 1："r 越大越好"

**错！** r 太大会过拟合，且显存增加。

正确做法：从 r=8 开始，根据效果调整。

### 误区 2："QLoRA 效果一定差"

**不一定。** 很多场景下 QLoRA 接近 LoRA 效果。

关键：量化质量 + 数据质量。

---

## 6 动手练习

### 练习 1：LoRA 微调

实现一个 LoRA 微调。

<details>
<summary>点击查看答案</summary>

```python
from peft import LoraConfig, get_peft_model

config = LoraConfig(r=8, lora_alpha=16, target_modules=["q_proj", "v_proj"])
model = get_peft_model(base_model, config)
# 训练...
```

</details>

### 练习 2：QLoRA 微调

实现 QLoRA 微调。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BitsAndBytesConfig

bnb_config = BitsAndBytesConfig(load_in_4bit=True)
model = AutoModelForCausalLM.from_pretrained(model_name, quantization_config=bnb_config)
# 应用 LoRA 并训练...
```

</details>

---

## 下一章预告

下一章我们会学习 **P-Tuning 与 Prefix Tuning**——另一种参数高效微调方法。你会学到如何通过学习提示向量来适配模型。让我们继续！
