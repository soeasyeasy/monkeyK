---
title: "第14章：模型微调实战"
description: "LoRA、QLoRA、PEFT 技术详解，数据集准备、微调流程、评估方法与实战案例"
---

# 第14章：模型微调实战

## 本章导读

在前面的章节中，我们学习了 Prompt Engineering 和 RAG，它们可以在不修改模型的情况下让大模型适应特定任务。但有时候，我们需要让模型更深入地学习某个领域的知识或行为模式。这时候就需要**模型微调（Fine-Tuning）**。

你可能会有这些疑问：

- 什么是模型微调？和预训练有什么区别？
- 全参数微调需要多少资源？普通开发者玩得起吗？
- LoRA 是什么？为什么它能用极少的参数达到接近全参数微调的效果？
- 如何准备微调数据集？数据格式有什么要求？
- 微调后的模型如何评估？怎么判断微调是否成功？

这一章将通过实战案例，手把手教你完成大模型微调的完整流程。

---

## 1 为什么需要模型微调？

### 痛点分析

**Prompt Engineering 的局限性**：

1. **上下文窗口限制**：Prompt 能提供的信息有限，无法让模型学习大量领域知识
2. **稳定性问题**：复杂的 Prompt 容易让模型"迷路"，输出不稳定
3. **性能瓶颈**：某些任务（如特定格式输出、专业领域问答）仅靠 Prompt 难以达到理想效果

**RAG 的局限性**：

1. **检索质量依赖**：RAG 的效果高度依赖检索质量，检索不到就学不到
2. **知识整合能力弱**：RAG 只是把检索到的内容拼接到 Prompt，模型并没有真正"学会"
3. **延迟问题**：每次推理都需要检索，增加延迟

**全参数微调的问题**：

1. **资源需求高**：7B 模型全参数微调需要 24GB+ 显存
2. **训练成本高**：每次微调都需要重新训练所有参数，耗时耗力
3. **灾难性遗忘**：全参数微调容易让模型忘记预训练阶段学到的通用知识

### 解决方案

**参数高效微调（PEFT - Parameter-Efficient Fine-Tuning）** 应运而生：

| 技术 | 核心思想 | 参数量 | 显存需求 | 效果 |
|------|----------|--------|----------|------|
| **全参数微调** | 训练所有参数 | 100% | 很高 | 最好（但容易过拟合） |
| **LoRA** | 冻结原模型，添加低秩矩阵 | 0.1%-1% | 低 | 接近全参数微调 |
| **QLoRA** | LoRA + 量化 | 0.1%-1% | 更低 | 接近 LoRA |
| **Adapter** | 在 Transformer 层中插入小模块 | 1%-5% | 中 | 较好 |

**LoRA 的优势**：

1. **显存占用低**：7B 模型用 LoRA 微调只需 8-12GB 显存
2. **训练速度快**：只训练少量参数，速度快 3-5 倍
3. **效果接近全参数微调**：在大多数任务上效果相当
4. **可插拔**：LoRA 权重可以动态加载，一个基础模型可以切换多个 LoRA

**直观理解**：

> 全参数微调就像把整个房子推倒重建；LoRA 就像在房子里添加几个功能模块（比如智能家居系统），房子主体不变，但功能增强了。

---

## 2 核心原理

### 2.1 LoRA（Low-Rank Adaptation）

**核心思想**：

预训练模型的权重矩阵是低秩的，微调时只需要学习一个低秩的增量矩阵。

**数学原理**：

```
原始权重：W（d × d）
增量权重：ΔW = B × A

其中：
- A 是 d × r 的矩阵（r << d）
- B 是 r × d 的矩阵
- r 是秩（rank），通常取 4、8、16

前向传播：
h = Wx + ΔWx = Wx + BAx
```

**为什么有效？**

1. **低秩假设**：预训练模型的权重矩阵本身是低秩的，微调只需要在低维空间学习
2. **参数高效**：r=8 时，参数量只有原来的 2r/d = 16/d，对于 d=4096，参数量只有 0.4%
3. **避免过拟合**：参数少，不容易过拟合小数据集

**直观理解**：

> 想象一个 1000×1000 的矩阵（100 万参数）。LoRA 不直接修改这个矩阵，而是学习两个小矩阵：1000×8 和 8×1000（共 1.6 万参数）。这 1.6 万参数的"增量"就能让模型适应新任务。

### 2.2 QLoRA（Quantized LoRA）

**核心思想**：

在 LoRA 的基础上，对预训练模型进行量化（4-bit），进一步降低显存占用。

**关键技术**：

1. **4-bit NormalFloat 量化**：将 16-bit 权重压缩到 4-bit
2. **双重量化**：对量化常数再次量化，进一步节省显存
3. **分页优化器**：利用 NVIDIA 统一内存特性，避免显存峰值

**效果对比**：

| 技术 | 7B 模型显存需求 | 13B 模型显存需求 |
|------|-----------------|------------------|
| 全参数微调 | 28GB+ | 52GB+ |
| LoRA | 12GB | 24GB |
| QLoRA | 6GB | 12GB |

### 2.3 PEFT 库

**Hugging Face PEFT** 是一个统一的参数高效微调库，支持多种方法：

```python
from peft import LoraConfig, get_peft_model, TaskType

# 配置 LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,  # 任务类型
    r=8,                           # 秩
    lora_alpha=32,                 # 缩放系数
    target_modules=["q_proj", "v_proj"],  # 目标模块
    lora_dropout=0.1               # Dropout
)

# 应用 LoRA 到模型
model = get_peft_model(base_model, lora_config)
```

---

## 3 对比分析

| 方法 | 参数量 | 显存需求 | 训练速度 | 效果 | 适用场景 |
|------|--------|----------|----------|------|----------|
| **全参数微调** | 100% | 很高 | 慢 | 最好 | 大数据集、高资源 |
| **LoRA** | 0.1%-1% | 低 | 快 | 接近全参数 | 大多数场景 |
| **QLoRA** | 0.1%-1% | 更低 | 快 | 接近 LoRA | 资源受限 |
| **Prompt Tuning** | 0.01% | 很低 | 很快 | 一般 | 简单任务 |
| **Adapter** | 1%-5% | 中 | 中 | 较好 | 多任务学习 |

---

## 4 基础用法

### 4.1 环境准备

```bash
# 安装必要的库
pip install transformers peft datasets accelerate bitsandbytes
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 4.2 数据集准备

**数据格式**：

微调大模型通常使用指令格式的数据：

```json
{
  "instruction": "将以下文本翻译成英文",
  "input": "今天天气很好",
  "output": "The weather is very nice today"
}
```

**准备数据集**：

```python
from datasets import load_dataset

# 方式1：从 Hugging Face Hub 加载
dataset = load_dataset("tatsu-lab/alpaca", split="train[:1000]")

# 方式2：从本地 JSON 文件加载
dataset = load_dataset("json", data_files="my_data.json", split="train")

# 查看数据示例
print(dataset[0])
# {'instruction': '...', 'input': '...', 'output': '...'}

# 数据预处理
def format_example(example):
    """将数据格式化为模型输入"""
    if example.get("input"):
        text = f"### Instruction:\n{example['instruction']}\n\n### Input:\n{example['input']}\n\n### Response:\n{example['output']}"
    else:
        text = f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}"
    return {"text": text}

dataset = dataset.map(format_example)
print(dataset[0]["text"])
```

### 4.3 LoRA 微调

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
import torch

# 1. 加载模型和分词器
model_name = "Qwen/Qwen2-1.5B"  # 使用小模型示例
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto",
    trust_remote_code=True
)

# 2. 配置 LoRA
lora_config = LoraConfig(
    task_type="CAUSAL_LM",           # 因果语言模型
    r=8,                              # 秩，通常 8-64
    lora_alpha=32,                    # 缩放系数，通常是 r 的 2 倍
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],  # 目标模块
    lora_dropout=0.05,                # Dropout
    bias="none"                       # 不训练 bias
)

# 3. 应用 LoRA
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# 输出：trainable params: 1,048,576 || all params: 1,500,000,000 || trainable%: 0.0699

# 4. 准备训练参数
training_args = TrainingArguments(
    output_dir="./output",            # 输出目录
    per_device_train_batch_size=4,    # 每个设备的 batch size
    gradient_accumulation_steps=4,    # 梯度累积步数
    learning_rate=2e-4,               # 学习率
    num_train_epochs=3,               # 训练轮数
    logging_steps=10,                 # 日志步数
    save_steps=100,                   # 保存步数
    save_total_limit=3,               # 最多保存 3 个 checkpoint
    warmup_steps=100,                 # 预热步数
    fp16=True,                        # 使用 FP16
    report_to="tensorboard",          # 报告到 TensorBoard
)

# 5. 创建 Trainer 并训练
trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    tokenizer=tokenizer,
    dataset_text_field="text",        # 数据集中的文本字段
    max_seq_length=512,               # 最大序列长度
)

# 开始训练
trainer.train()

# 6. 保存模型
trainer.save_model("./output/final")
tokenizer.save_pretrained("./output/final")
```

### 4.4 QLoRA 微调（更低显存）

```python
from transformers import BitsAndBytesConfig

# 1. 配置 4-bit 量化
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,                           # 使用 4-bit 量化
    bnb_4bit_quant_type="nf4",                   # NormalFloat 量化
    bnb_4bit_compute_dtype=torch.float16,        # 计算时使用 FP16
    bnb_4bit_use_double_quant=True,              # 使用双重量化
)

# 2. 加载量化后的模型
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True
)

# 3. 准备模型用于 k-bit 训练
model = prepare_model_for_kbit_training(model)

# 4. 配置 LoRA（和上面一样）
lora_config = LoraConfig(
    task_type="CAUSAL_LM",
    r=8,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none"
)

# 5. 应用 LoRA
model = get_peft_model(model, lora_config)

# 6. 训练（和上面一样）
trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    tokenizer=tokenizer,
    dataset_text_field="text",
    max_seq_length=512,
)

trainer.train()
```

### 4.5 使用微调后的模型

```python
from peft import PeftModel

# 方式1：加载 LoRA 权重
base_model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto",
    trust_remote_code=True
)

model = PeftModel.from_pretrained(base_model, "./output/final")
model.eval()

# 方式2：合并 LoRA 权重到基础模型（推理更快）
merged_model = model.merge_and_unload()
merged_model.save_pretrained("./output/merged")

# 推理
inputs = tokenizer("### Instruction:\n你好\n\n### Response:\n", return_tensors="pt")
inputs = {k: v.to(model.device) for k, v in inputs.items()}

with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=100,
        temperature=0.7,
        top_p=0.9,
        do_sample=True
    )

response = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(response)
```

---

## 5 进阶用法

### 5.1 多轮对话微调

```python
# 多轮对话数据格式
conversation_data = [
    {"role": "user", "content": "你好"},
    {"role": "assistant", "content": "你好！有什么可以帮助你的吗？"},
    {"role": "user", "content": "介绍一下你自己"},
    {"role": "assistant", "content": "我是一个 AI 助手..."},
]

# 转换为训练格式
def format_conversation(conversation):
    text = ""
    for turn in conversation:
        if turn["role"] == "user":
            text += f"### User:\n{turn['content']}\n\n"
        elif turn["role"] == "assistant":
            text += f"### Assistant:\n{turn['content']}\n\n"
    return text

# 使用 ChatML 格式（更标准）
def format_chatml(conversation):
    text = "<|im_start|>system\n你是一个有帮助的助手。<|im_end|>\n"
    for turn in conversation:
        text += f"<|im_start|>{turn['role']}\n{turn['content']}<|im_end|>\n"
    text += "<|im_start|>assistant\n"
    return text
```

### 5.2 自定义评估指标

```python
import evaluate

# 加载评估指标
bleu = evaluate.load("bleu")
rouge = evaluate.load("rouge")

def compute_metrics(eval_pred):
    """计算评估指标"""
    predictions, labels = eval_pred
    
    # 解码
    predictions = tokenizer.batch_decode(predictions, skip_special_tokens=True)
    labels = tokenizer.batch_decode(labels, skip_special_tokens=True)
    
    # 计算 BLEU
    bleu_results = bleu.compute(predictions=predictions, references=[[l] for l in labels])
    
    # 计算 ROUGE
    rouge_results = rouge.compute(predictions=predictions, references=labels)
    
    return {
        "bleu": bleu_results["bleu"],
        "rouge1": rouge_results["rouge1"],
        "rouge2": rouge_results["rouge2"],
        "rougeL": rouge_results["rougeL"],
    }

# 在 TrainingArguments 中启用评估
training_args = TrainingArguments(
    # ...其他参数
    eval_strategy="steps",        # 评估策略
    eval_steps=100,               # 评估步数
    metric_for_best_model="rougeL",  # 选择最佳模型的指标
    load_best_model_at_end=True,  # 训练结束后加载最佳模型
)
```

### 5.3 动态秩调整

```python
# 不同层使用不同的秩
lora_config = LoraConfig(
    task_type="CAUSAL_LM",
    r=8,
    lora_alpha=32,
    target_modules={
        "q_proj": {"r": 16},      # 注意力层使用更高的秩
        "v_proj": {"r": 16},
        "k_proj": {"r": 8},
        "o_proj": {"r": 8},
        "gate_proj": {"r": 4},    # FFN 层使用更低的秩
        "up_proj": {"r": 4},
        "down_proj": {"r": 4},
    },
    lora_dropout=0.05,
    bias="none"
)
```

### 5.4 合并多个 LoRA

```python
from peft import PeftModel

# 基础模型
base_model = AutoModelForCausalLM.from_pretrained(model_name)

# 加载第一个 LoRA
model = PeftModel.from_pretrained(base_model, "./output/lora1", adapter_name="adapter1")

# 加载第二个 LoRA
model.load_adapter("./output/lora2", adapter_name="adapter2")

# 切换适配器
model.set_adapter("adapter1")  # 使用第一个 LoRA
# 或
model.set_adapter("adapter2")  # 使用第二个 LoRA

# 加权合并多个 LoRA
model.add_weighted_adapter(
    adapters=["adapter1", "adapter2"],
    weights=[0.6, 0.4],          # 权重
    adapter_name="merged",
    combination_type="linear"    # 线性组合
)

model.set_adapter("merged")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **LoRA 原理** | 冻结原模型，学习低秩增量矩阵 ΔW = BA |
| **秩（rank）** | 控制 LoRA 参数量，通常 8-64，越大效果越好但参数越多 |
| **lora_alpha** | 缩放系数，通常是 r 的 2 倍，控制 LoRA 的影响程度 |
| **target_modules** | 目标模块，通常是注意力层的 q_proj、v_proj 等 |
| **QLoRA** | LoRA + 4-bit 量化，进一步降低显存需求 |
| **数据格式** | 指令格式：instruction + input + output |
| **评估指标** | BLEU、ROUGE、Perplexity 等 |
| **合并权重** | 可以将 LoRA 权重合并回基础模型，推理更快 |

---

## 7 新手常见误区

### 误区 1：秩（rank）越大越好

**错误做法**：

```python
lora_config = LoraConfig(r=256, ...)  # 秩太大
```

**为什么错**：

- 秩太大会导致参数过多，容易过拟合
- 训练时间变长，失去 PEFT 的优势

**正确做法**：

```python
lora_config = LoraConfig(r=8, ...)  # 从 8 开始，根据效果调整
```

### 误区 2：学习率和全参数微调一样

**错误做法**：

```python
training_args = TrainingArguments(learning_rate=5e-5, ...)  # 太小
```

**为什么错**：

- LoRA 的学习率通常比全参数微调大 10-100 倍
- 学习率太小会导致收敛慢或无法收敛

**正确做法**：

```python
training_args = TrainingArguments(learning_rate=2e-4, ...)  # 1e-4 到 1e-3
```

### 误区 3：数据集越大越好

**错误做法**：

```python
dataset = load_dataset("huge_dataset")  # 100 万条数据
```

**为什么错**：

- LoRA 参数量少，容易过拟合大数据集
- 训练时间长，资源浪费

**正确做法**：

```python
dataset = load_dataset("my_data", split="train[:10000]")  # 1-5 万条足够
```

### 误区 4：忽略数据质量

**错误做法**：

```python
# 使用未清洗的数据
dataset = load_dataset("noisy_data")
```

**为什么错**：

- 数据质量比数量更重要
- 低质量数据会导致模型学到错误的模式

**正确做法**：

```python
# 数据清洗
dataset = dataset.filter(lambda x: len(x["output"]) > 10)  # 过滤短回复
dataset = dataset.filter(lambda x: "###" not in x["output"])  # 过滤格式错误
```

### 误区 5：不保存 tokenizer

**错误做法**：

```python
trainer.save_model("./output")
# 忘记保存 tokenizer
```

**为什么错**：

- 推理时需要 tokenizer
- 重新下载可能版本不一致

**正确做法**：

```python
trainer.save_model("./output")
tokenizer.save_pretrained("./output")  # 一起保存
```

---

## 8 动手练习

### 练习 1：完成一个完整的 LoRA 微调

**任务**：

1. 准备一个小型数据集（100-1000 条）
2. 使用 LoRA 微调 Qwen2-1.5B
3. 评估微调效果

**提示**：

```python
# 数据集可以使用 alpaca 的小子集
dataset = load_dataset("tatsu-lab/alpaca", split="train[:100]")

# 训练参数
training_args = TrainingArguments(
    output_dir="./output",
    per_device_train_batch_size=2,
    num_train_epochs=3,
    learning_rate=2e-4,
)
```

### 练习 2：尝试 QLoRA 微调

**任务**：

使用 QLoRA 微调一个 7B 模型（如 LLaMA-2-7B），观察显存占用。

**提示**：

```python
# 使用 4-bit 量化
bnb_config = BitsAndBytesConfig(load_in_4bit=True)

# 加载模型
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    quantization_config=bnb_config
)
```

### 练习 3：自定义数据格式

**任务**：

将你自己的数据转换为微调格式，并完成微调。

**数据格式示例**：

```json
[
  {
    "instruction": "根据以下代码，解释其功能",
    "input": "def add(a, b):\n    return a + b",
    "output": "这个函数接收两个参数 a 和 b，并返回它们的和。"
  }
]
```

---

## 9 下一章预告

在下一章"大模型应用开发"中，我们将学习如何将微调后的模型部署为 API 服务，构建完整的大模型应用。我们会学习：

- 使用 FastAPI 构建模型推理服务
- 模型量化与加速（GPTQ、AWQ）
- vLLM 高性能推理引擎
- 应用层开发（对话管理、上下文维护）
- 生产环境部署最佳实践

敬请期待！
