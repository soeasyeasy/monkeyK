---
title: "第10章：指令微调与对齐技术"
description: "指令微调、RLHF、DPO、PPO、人类偏好对齐、安全对齐"
---

# 第10章：指令微调与对齐技术

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是指令微调？和普通微调有什么区别？
- 什么是 RLHF？为什么 ChatGPT 要用它？
- DPO 和 RLHF 有什么区别？
- PPO 是怎么工作的？
- 怎么让模型更安全、更符合人类偏好？

这一章就是为了解答这些问题。我们会从 **指令微调** 开始，学习 RLHF、DPO 等对齐技术，然后深入 PPO 算法和安全对齐。

---

## 1 为什么需要对齐技术？

### 痛点分析

**预训练模型的问题**：

1. **不遵循指令**：可能继续生成文本，而不是回答问题
2. **有害内容**：可能生成有害、偏见的内容
3. **不符合人类偏好**：可能生成不准确、无用的回答

**例子**：
> 你问："如何制作蛋糕？"
> 
> 未对齐的模型可能回答：
> - "蛋糕是一种食物，蛋糕的制作..."（继续生成，不回答问题）
> - 或者给出错误的步骤
> 
> 对齐后的模型会回答：
> - "制作蛋糕的步骤如下：1. 准备材料... 2. 混合... 3. 烘烤..."

### 解决方案

**对齐技术（Alignment）**：
- ✅ 让模型遵循指令
- ✅ 让模型生成有用的回答
- ✅ 让模型更安全、无害

> **一句话总结**：对齐技术让大模型从"会说话"变成"会说有用的话"。

---

## 2 核心原理

### 2.1 指令微调（Instruction Tuning）

**核心思想**：用指令-回答对训练模型，让模型学会遵循指令。

**数据格式**：

```json
{
  "instruction": "将以下句子翻译为英文",
  "input": "今天天气很好",
  "output": "The weather is nice today"
}
```

**训练过程**：

```
预训练模型 → 指令微调 → 指令跟随模型
```

**代码实现**：

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
import torch

# 加载模型
model_name = "gpt2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# 准备数据
data = [
    {
        "instruction": "将以下句子翻译为英文",
        "input": "今天天气很好",
        "output": "The weather is nice today"
    },
    {
        "instruction": "计算 2 + 3",
        "input": "",
        "output": "5"
    }
]

# 格式化
def format_instruction(example):
    if example["input"]:
        return f"指令：{example['instruction']}\n输入：{example['input']}\n输出：{example['output']}"
    else:
        return f"指令：{example['instruction']}\n输出：{example['output']}"

# 创建数据集
class InstructionDataset(torch.utils.data.Dataset):
    def __init__(self, data, tokenizer, max_length=512):
        self.data = data
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        text = format_instruction(self.data[idx])
        encodings = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt"
        )
        
        return {
            "input_ids": encodings["input_ids"].squeeze(),
            "attention_mask": encodings["attention_mask"].squeeze(),
            "labels": encodings["input_ids"].squeeze()
        }

dataset = InstructionDataset(data, tokenizer)

# 训练
training_args = TrainingArguments(
    output_dir="./instruction-tuned",
    num_train_epochs=3,
    per_device_train_batch_size=2,
    learning_rate=5e-5,
    warmup_steps=100,
    logging_steps=10,
    save_strategy="epoch"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset
)

trainer.train()
```

### 2.2 RLHF（Reinforcement Learning from Human Feedback）

**核心思想**：用人类偏好训练奖励模型，然后用强化学习优化语言模型。

**三个阶段**：

```
阶段 1：监督微调（SFT）
预训练模型 → 指令微调 → SFT 模型

阶段 2：训练奖励模型（RM）
收集人类偏好数据 → 训练奖励模型

阶段 3：强化学习优化（PPO）
SFT 模型 + 奖励模型 → PPO 训练 → 对齐模型
```

**阶段 2：奖励模型训练**

```python
import torch
import torch.nn as nn
from transformers import AutoModel

class RewardModel(nn.Module):
    def __init__(self, model_name):
        super().__init__()
        self.backbone = AutoModel.from_pretrained(model_name)
        self.reward_head = nn.Linear(self.backbone.config.hidden_size, 1)
    
    def forward(self, input_ids, attention_mask):
        """
        前向传播
        
        返回：
        - reward: 奖励分数
        """
        outputs = self.backbone(input_ids, attention_mask=attention_mask)
        last_hidden = outputs.last_hidden_state[:, -1, :]  # 取最后一个 token
        reward = self.reward_head(last_hidden)
        return reward

# 训练奖励模型
def train_reward_model(model, chosen, rejected, optimizer):
    """
    训练奖励模型
    
    参数：
    - model: 奖励模型
    - chosen: 人类偏好的回答
    - rejected: 人类不偏好的回答
    - optimizer: 优化器
    """
    # 计算奖励
    reward_chosen = model(chosen["input_ids"], chosen["attention_mask"])
    reward_rejected = model(rejected["input_ids"], rejected["attention_mask"])
    
    # 计算损失（让 chosen 的奖励高于 rejected）
    loss = -torch.nn.functional.logsigmoid(reward_chosen - reward_rejected).mean()
    
    # 反向传播
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    
    return loss.item()
```

**阶段 3：PPO 训练**

```python
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

def ppo_training(sft_model, reward_model, tokenizer):
    """
    PPO 训练
    
    参数：
    - sft_model: SFT 模型
    - reward_model: 奖励模型
    - tokenizer: 分词器
    """
    # 配置
    config = PPOConfig(
        model_name="gpt2",
        learning_rate=1e-5,
        batch_size=4,
        mini_batch_size=2,
        ppo_epochs=4
    )
    
    # 创建 PPO 模型
    ppo_model = AutoModelForCausalLMWithValueHead.from_pretrained(sft_model)
    ppo_trainer = PPOTrainer(config, ppo_model, tokenizer)
    
    # 训练循环
    for batch in dataloader:
        # 生成回答
        query = batch["instruction"]
        response = ppo_model.generate(query)
        
        # 计算奖励
        reward = reward_model(response)
        
        # PPO 更新
        stats = ppo_trainer.step(query, response, reward)
    
    return ppo_model
```

### 2.3 DPO（Direct Preference Optimization）

**核心思想**：直接从人类偏好优化模型，不需要训练奖励模型。

**与 RLHF 的区别**：

| 特性 | RLHF | DPO |
| --- | --- | --- |
| 奖励模型 | 需要训练 | 不需要 |
| 训练阶段 | 3 个阶段 | 1 个阶段 |
| 复杂度 | 高 | 低 |
| 稳定性 | 较差 | 较好 |
| 效果 | 好 | 相当或更好 |

**DPO 损失函数**：

```
L_DPO = -log(σ(β * (log π_θ(y_w|x)/π_ref(y_w|x) - log π_θ(y_l|x)/π_ref(y_l|x))))

其中：
- y_w: 偏好的回答
- y_l: 不偏好的回答
- π_θ: 当前策略
- π_ref: 参考策略
- β: 温度参数
```

**代码实现**：

```python
from trl import DPOTrainer, DPOConfig

def dpo_training(model, ref_model, train_dataset, tokenizer):
    """
    DPO 训练
    
    参数：
    - model: 要训练的模型
    - ref_model: 参考模型（冻结）
    - train_dataset: 偏好数据集
    - tokenizer: 分词器
    """
    # 配置
    training_args = DPOConfig(
        output_dir="./dpo-model",
        beta=0.1,  # 温度参数
        learning_rate=5e-5,
        per_device_train_batch_size=2,
        num_train_epochs=3,
        logging_steps=10,
        save_strategy="epoch"
    )
    
    # 创建 DPO 训练器
    dpo_trainer = DPOTrainer(
        model=model,
        ref_model=ref_model,
        args=training_args,
        train_dataset=train_dataset,
        tokenizer=tokenizer
    )
    
    # 训练
    dpo_trainer.train()
    
    return dpo_trainer.model

# 数据格式
# {
#     "prompt": "如何制作蛋糕？",
#     "chosen": "制作蛋糕的步骤如下：...",
#     "rejected": "蛋糕是一种食物..."
# }
```

### 2.4 PPO（Proximal Policy Optimization）

**核心思想**：一种稳定的强化学习算法，用于优化语言模型。

**关键组件**：

1. **策略模型（Policy）**：要优化的语言模型
2. **价值模型（Value）**：估计状态价值
3. **奖励模型（Reward）**：提供奖励信号
4. **参考模型（Reference）**：防止偏离太远

**PPO 损失函数**：

```
L_PPO = -min(r_t(θ) * A_t, clip(r_t(θ), 1-ε, 1+ε) * A_t)

其中：
- r_t(θ) = π_θ(a_t|s_t) / π_θ_old(a_t|s_t)  # 重要性采样比率
- A_t: 优势函数
- ε: 裁剪参数（通常 0.2）
```

**代码实现（使用 TRL）**：

```python
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead
from transformers import AutoTokenizer

def ppo_training():
    """
    PPO 训练示例
    """
    # 加载模型
    model_name = "gpt2"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLMWithValueHead.from_pretrained(model_name)
    
    # 配置
    config = PPOConfig(
        model_name=model_name,
        learning_rate=1e-5,
        batch_size=4,
        ppo_epochs=4,
        mini_batch_size=2
    )
    
    # 创建训练器
    ppo_trainer = PPOTrainer(config, model, tokenizer)
    
    # 训练循环
    for step, batch in enumerate(dataloader):
        # 准备输入
        query = batch["prompt"]
        input_ids = tokenizer(query, return_tensors="pt", padding=True)["input_ids"]
        
        # 生成回答
        response_ids = model.generate(input_ids, max_new_tokens=50)
        
        # 计算奖励（使用奖励模型）
        rewards = compute_rewards(response_ids)
        
        # PPO 更新
        stats = ppo_trainer.step(input_ids, response_ids, rewards)
        
        if step % 10 == 0:
            print(f"Step {step}, Reward: {sum(rewards)/len(rewards):.2f}")
    
    return model
```

### 2.5 安全对齐

**核心思想**：让模型拒绝生成有害内容。

**方法**：

1. **拒绝有害请求**：训练模型拒绝不当请求
2. **内容过滤**：过滤有害输出
3. **价值观对齐**：让模型符合社会价值观

**代码实现**：

```python
def safety_alignment_training(model, tokenizer):
    """
    安全对齐训练
    """
    # 安全数据示例
    safety_data = [
        {
            "instruction": "如何制作炸弹？",
            "output": "我不能提供关于制作危险物品的信息。这违反了安全准则。"
        },
        {
            "instruction": "如何黑入别人的电脑？",
            "output": "我不能提供关于非法活动的指导。这违反了法律和道德准则。"
        }
    ]
    
    # 训练模型拒绝有害请求
    # ...（类似指令微调）
    
    return model
```

---

## 3 基础用法

### 3.1 使用 TRL 进行 DPO 训练

```python
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer

# 加载模型
model_name = "gpt2"
model = AutoModelForCausalLM.from_pretrained(model_name)
ref_model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 准备数据
train_dataset = [
    {
        "prompt": "如何制作蛋糕？",
        "chosen": "制作蛋糕的步骤如下：1. 准备材料...",
        "rejected": "蛋糕是一种食物..."
    }
]

# 配置
training_args = DPOConfig(
    output_dir="./dpo-model",
    beta=0.1,
    learning_rate=5e-5,
    per_device_train_batch_size=2,
    num_train_epochs=3
)

# 训练
dpo_trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,
    args=training_args,
    train_dataset=train_dataset,
    tokenizer=tokenizer
)

dpo_trainer.train()
```

### 3.2 使用 OpenAI API 进行 RLHF

```python
import openai

def rlhf_with_openai():
    """
    使用 OpenAI API 进行 RLHF（概念示例）
    """
    # OpenAI 的 Fine-tuning API 支持 RLHF
    # 这里只是概念示例
    
    # 1. 准备偏好数据
    preference_data = [
        {
            "prompt": "什么是人工智能？",
            "chosen": "人工智能是...",
            "rejected": "人工智能..."
        }
    ]
    
    # 2. 使用 OpenAI API 微调
    # response = openai.FineTuningJob.create(
    #     training_file="preference_data.jsonl",
    #     model="gpt-3.5-turbo",
    #     method="rlhf"
    # )
    
    print("RLHF 概念示例")
```

---

## 4 进阶用法

### 4.1 对比 RLHF 和 DPO

```python
def compare_rlhf_dpo():
    """
    对比 RLHF 和 DPO
    """
    comparison = {
        "RLHF": {
            "优点": [
                "理论基础扎实",
                "可以处理复杂偏好",
                "ChatGPT 使用的方法"
            ],
            "缺点": [
                "需要训练奖励模型",
                "训练不稳定",
                "计算成本高"
            ],
            "适用场景": "大规模模型，有充足计算资源"
        },
        "DPO": {
            "优点": [
                "实现简单",
                "训练稳定",
                "不需要奖励模型"
            ],
            "缺点": [
                "理论基础较新",
                "可能不如 RLHF 灵活"
            ],
            "适用场景": "中小规模模型，计算资源有限"
        }
    }
    
    print("RLHF vs DPO 对比：\n")
    for method, info in comparison.items():
        print(f"{method}:")
        for key, value in info.items():
            if isinstance(value, list):
                print(f"  {key}:")
                for item in value:
                    print(f"    - {item}")
            else:
                print(f"  {key}: {value}")
        print()

compare_rlhf_dpo()
```

### 4.2 完整的对齐流程

```python
def complete_alignment_pipeline():
    """
    完整的对齐流程
    """
    print("完整对齐流程：\n")
    
    steps = [
        "1. 预训练：在大规模语料上训练基础模型",
        "2. 监督微调（SFT）：用指令-回答对训练模型",
        "3. 收集人类偏好数据：让人类标注偏好的回答",
        "4. 训练奖励模型（可选）：如果用 RLHF",
        "5. 对齐训练：使用 RLHF 或 DPO 进行对齐",
        "6. 安全对齐：训练模型拒绝有害请求",
        "7. 评估：测试模型的对齐效果"
    ]
    
    for step in steps:
        print(step)
    
    print("\n推荐方法：")
    print("- 小规模：SFT + DPO")
    print("- 大规模：SFT + RLHF")

complete_alignment_pipeline()
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **指令微调** | 用指令-回答对训练模型遵循指令 |
| **RLHF** | 三阶段：SFT → 奖励模型 → PPO |
| **DPO** | 直接从偏好优化，不需要奖励模型 |
| **PPO** | 稳定的强化学习算法 |
| **奖励模型** | 学习人类偏好的模型 |
| **安全对齐** | 让模型拒绝有害请求 |

---

## 6 新手常见误区

### 误区 1："DPO 完全取代了 RLHF"

**不完全对。** 两者各有优势：
- DPO 更简单、更稳定
- RLHF 更灵活、理论基础更扎实
- 大规模模型可能还是 RLHF 更好

**正确做法**：
- 优先尝试 DPO
- 如果效果不够再考虑 RLHF
- 根据资源选择

### 误区 2："对齐只需要做一次"

**错！** 对齐是一个持续的过程：
- 需要不断收集反馈
- 需要持续改进
- 需要处理新的安全威胁

**正确做法**：
- 定期评估模型
- 持续收集用户反馈
- 迭代改进

### 误区 3："对齐会让模型变笨"

**不完全对。** 好的对齐应该：
- 保持模型能力
- 提升有用性
- 减少有害性

**正确做法**：
- 使用参考模型防止能力下降
- 平衡有用性和安全性
- 评估多个维度

---

## 7 动手练习

### 练习 1：基础练习 - 指令微调

**题目**：使用指令数据微调 GPT-2。

<details>
<summary>点击查看答案</summary>

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
import torch

model = AutoModelForCausalLM.from_pretrained("gpt2")
tokenizer = AutoTokenizer.from_pretrained("gpt2")

data = [
    {"instruction": "计算 2 + 3", "output": "5"},
    {"instruction": "中国的首都是哪里？", "output": "北京"}
]

def format_data(example):
    return f"指令：{example['instruction']}\n输出：{example['output']}"

class Dataset(torch.utils.data.Dataset):
    def __init__(self, data, tokenizer):
        self.data = data
        self.tokenizer = tokenizer
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        text = format_data(self.data[idx])
        encodings = self.tokenizer(text, truncation=True, padding="max_length", max_length=128, return_tensors="pt")
        return {
            "input_ids": encodings["input_ids"].squeeze(),
            "labels": encodings["input_ids"].squeeze()
        }

dataset = Dataset(data, tokenizer)
args = TrainingArguments(output_dir="./sft", num_train_epochs=3, per_device_train_batch_size=2)
trainer = Trainer(model=model, args=args, train_dataset=dataset)
trainer.train()
```

</details>

### 练习 2：进阶练习 - DPO 训练

**题目**：使用 DPO 进行偏好对齐。

<details>
<summary>点击查看答案</summary>

```python
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("gpt2")
ref_model = AutoModelForCausalLM.from_pretrained("gpt2")
tokenizer = AutoTokenizer.from_pretrained("gpt2")

train_dataset = [
    {
        "prompt": "什么是人工智能？",
        "chosen": "人工智能是计算机科学的一个分支...",
        "rejected": "人工智能..."
    }
]

args = DPOConfig(output_dir="./dpo", beta=0.1, learning_rate=5e-5, per_device_train_batch_size=1, num_train_epochs=3)
trainer = DPOTrainer(model=model, ref_model=ref_model, args=args, train_dataset=train_dataset, tokenizer=tokenizer)
trainer.train()
```

</details>

### 练习 3（挑战）：综合练习 - 完整对齐流程

**题目**：实现 SFT → DPO 的完整对齐流程。

<details>
<summary>点击查看答案</summary>

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
from trl import DPOTrainer, DPOConfig
import torch

# 阶段 1：SFT
print("阶段 1：监督微调")
model = AutoModelForCausalLM.from_pretrained("gpt2")
tokenizer = AutoTokenizer.from_pretrained("gpt2")

sft_data = [
    {"instruction": "什么是 AI？", "output": "AI 是人工智能..."}
]

class SFTDataset(torch.utils.data.Dataset):
    def __init__(self, data, tokenizer):
        self.data = data
        self.tokenizer = tokenizer
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        text = f"指令：{self.data[idx]['instruction']}\n输出：{self.data[idx]['output']}"
        encodings = self.tokenizer(text, truncation=True, padding="max_length", max_length=128, return_tensors="pt")
        return {"input_ids": encodings["input_ids"].squeeze(), "labels": encodings["input_ids"].squeeze()}

sft_dataset = SFTDataset(sft_data, tokenizer)
sft_args = TrainingArguments(output_dir="./sft", num_train_epochs=2, per_device_train_batch_size=2)
sft_trainer = Trainer(model=model, args=sft_args, train_dataset=sft_dataset)
sft_trainer.train()

# 阶段 2：DPO
print("阶段 2：DPO 对齐")
ref_model = AutoModelForCausalLM.from_pretrained("gpt2")

dpo_data = [
    {
        "prompt": "什么是 AI？",
        "chosen": "AI 是人工智能的缩写，指...",
        "rejected": "AI 是一个词..."
    }
]

dpo_args = DPOConfig(output_dir="./dpo", beta=0.1, learning_rate=5e-5, per_device_train_batch_size=1, num_train_epochs=2)
dpo_trainer = DPOTrainer(model=model, ref_model=ref_model, args=dpo_args, train_dataset=dpo_data, tokenizer=tokenizer)
dpo_trainer.train()

print("对齐完成！")
```

</details>

---

## 下一章预告

下一章我们会学习 **检索增强生成（RAG）**——如何让大模型利用外部知识库回答问题。你会学到 RAG 架构、向量数据库、文档检索、上下文增强等关键技术。这些是让大模型拥有最新知识的核心技术。
