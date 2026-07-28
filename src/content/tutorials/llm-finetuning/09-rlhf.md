---
title: "第09章：RLHF 人类反馈强化学习"
description: "掌握 RLHF 的原理与实现，理解 ChatGPT 的核心训练技术"
---

# 第09章：RLHF 人类反馈强化学习

## 本章导读

在学这一章之前，你可能会有这些疑问：

- RLHF 是什么？为什么 ChatGPT 用它？
- 奖励模型怎么训练？
- PPO 算法是什么？
- RLHF 的完整流程是怎样的？

这一章会深入讲解 **RLHF（Reinforcement Learning from Human Feedback）** 的原理与实战。这是训练 ChatGPT 的核心技术。

---

## 1 RLHF 原理

### 什么是 RLHF？

**RLHF** 是用人类反馈来训练模型，让模型学习人类的偏好。

### 三个步骤

```
步骤 1：SFT（监督微调）
    ↓
步骤 2：训练奖励模型（Reward Model）
    ↓
步骤 3：PPO 强化学习训练
```

### 奖励模型训练

```python
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from trl import RewardTrainer, RewardConfig
from datasets import load_dataset

# 1. 加载基础模型
model_name = "gpt2"
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=1)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 2. 准备偏好数据
# 格式：prompt + chosen + rejected
dataset = load_dataset("json", data_files="preferences.json")

def preprocess(examples):
    # 格式化 chosen 和 rejected
    chosen = [f"{p}\n{c}" for p, c in zip(examples["prompt"], examples["chosen"])]
    rejected = [f"{p}\n{r}" for p, r in zip(examples["prompt"], examples["rejected"])]
    
    return {
        "input_ids_chosen": tokenizer(chosen, truncation=True, max_length=512)["input_ids"],
        "input_ids_rejected": tokenizer(rejected, truncation=True, max_length=512)["input_ids"],
    }

dataset = dataset.map(preprocess, batched=True)

# 3. 训练奖励模型
training_args = RewardConfig(
    output_dir="./output/reward_model",
    num_train_epochs=1,
    per_device_train_batch_size=4,
    learning_rate=5e-5,
)

trainer = RewardTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    tokenizer=tokenizer,
)

trainer.train()
```

### PPO 训练

```python
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

# 1. 加载 SFT 模型
model = AutoModelForCausalLMWithValueHead.from_pretrained("./output/sft")
tokenizer = AutoTokenizer.from_pretrained("./output/sft")

# 2. 加载奖励模型
reward_model = AutoModelForSequenceClassification.from_pretrained("./output/reward_model")

# 3. PPO 配置
ppo_config = PPOConfig(
    model_name="./output/sft",
    learning_rate=1e-5,
    batch_size=4,
    mini_batch_size=2,
)

# 4. 创建 PPO Trainer
ppo_trainer = PPOTrainer(
    config=ppo_config,
    model=model,
    ref_model=None,
    tokenizer=tokenizer,
    dataset=dataset,
)

# 5. PPO 训练循环
for epoch, batch in enumerate(ppo_trainer.dataloader):
    query_tensors = batch["input_ids"]
    
    # 生成回答
    response_tensors = ppo_trainer.generate(query_tensors, max_new_tokens=50)
    
    # 计算奖励
    rewards = reward_model(response_tensors)
    
    # PPO 更新
    stats = ppo_trainer.step(query_tensors, response_tensors, rewards)
```

---

## 2 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **RLHF 流程** | SFT → 奖励模型 → PPO |
| **奖励模型** | 学习人类偏好，给回答打分 |
| **PPO** | 强化学习算法，优化策略 |

---

## 3 动手练习

### 练习 1：奖励模型训练

实现奖励模型训练。

<details>
<summary>点击查看答案</summary>

```python
from trl import RewardTrainer, RewardConfig

config = RewardConfig(output_dir="./reward", num_train_epochs=1)
trainer = RewardTrainer(model=model, args=config, train_dataset=dataset)
trainer.train()
```

</details>

---

## 下一章预告

下一章我们会学习 **DPO 直接偏好优化**——比 RLHF 更简单的对齐方法。你会学到 DPO 的原理和实现。让我们继续！
