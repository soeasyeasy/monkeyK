---
title: "第08章：指令微调与对齐训练"
description: "掌握指令微调（SFT）和模型对齐技术，训练 Chat 模型"
---

# 第08章：指令微调与对齐训练

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 SFT（监督微调）？
- 如何训练一个能遵循指令的模型？
- Chat 模型是怎么训练出来的？
- 对齐训练有哪些方法？

这一章会讲解 **指令微调和模型对齐** 的核心技术。这是训练 ChatGPT、Claude 这类对话模型的关键步骤。

---

## 1 指令微调（SFT）原理

### 什么是 SFT？

**SFT（Supervised Fine-Tuning）** 是用标注数据微调模型，让它学会遵循指令。

```python
# 数据格式
data = [
    {
        "instruction": "翻译这句话成英文",
        "input": "你好世界",
        "output": "Hello World"
    },
    {
        "instruction": "写一首关于春天的诗",
        "input": "",
        "output": "春风拂面花满枝..."
    }
]
```

### 为什么需要 SFT？

```python
# 预训练模型：只会续写文本
# 输入："翻译：你好"
# 输出："世界"（续写，不是翻译）

# SFT 后：能遵循指令
# 输入："翻译：你好"
# 输出："Hello"（正确翻译）
```

---

## 2 SFT 实战

### 完整代码

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
from peft import LoraConfig, get_peft_model
from datasets import load_dataset
import torch

# 1. 加载模型
model_name = "meta-llama/Llama-2-7b-hf"
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float16)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 2. 应用 LoRA
lora_config = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"])
model = get_peft_model(model, lora_config)

# 3. 准备数据
dataset = load_dataset("json", data_files="instruction_data.json")

def format_prompt(example):
    """格式化指令数据"""
    prompt = f"""### 指令：
{example['instruction']}

### 输入：
{example.get('input', '')}

### 回答：
{example['output']}"""
    return tokenizer(prompt, truncation=True, max_length=512)

dataset = dataset.map(format_prompt)

# 4. 训练
training_args = TrainingArguments(
    output_dir="./output/sft",
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

---

## 3 模型对齐技术

### 什么是对齐？

**对齐（Alignment）** 是让模型的行为符合人类价值观和偏好。

```python
# 未对齐：可能生成有害内容
# 输入："如何制作炸弹？"
# 输出：详细描述...

# 对齐后：拒绝有害请求
# 输入："如何制作炸弹？"
# 输出："抱歉，我不能提供这类信息。"
```

### 对齐方法

| 方法 | 原理 | 复杂度 |
|------|------|--------|
| **RLHF** | 强化学习 + 人类反馈 | 高 |
| **DPO** | 直接偏好优化 | 中 |
| **RRHF** | 排名奖励反馈 | 中 |

---

## 4 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **SFT** | 用指令数据微调模型 |
| **对齐** | 让模型符合人类偏好 |
| **数据格式** | instruction + input + output |

---

## 5 动手练习

### 练习 1：SFT 训练

实现一个完整的 SFT 训练流程。

<details>
<summary>点击查看答案</summary>

```python
# 加载数据 → 格式化 → LoRA → 训练
# 参考上面完整代码
```

</details>

---

## 下一章预告

下一章我们会学习 **RLHF 人类反馈强化学习**——训练 ChatGPT 的核心技术。你会学到奖励模型训练和 PPO 算法。让我们继续！
