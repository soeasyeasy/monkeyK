---
title: "第1章：Transformer 与大语言模型简介"
description: "大语言模型发展历程、Transformer 革命、GPT/BERT/LLaMA 等主流模型、应用场景与学习路线"
---

# 第1章：Transformer 与大语言模型简介

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是大语言模型？它和传统的 NLP 模型有什么区别？
- Transformer 是什么？为什么它能改变整个 AI 领域？
- GPT、BERT、LLaMA 这些模型之间有什么关系？
- 学习这个课程需要哪些前置知识？

这一章就是为了解答这些问题。我们会从 **大语言模型的发展历程** 开始，了解 Transformer 的革命性意义，然后介绍主流模型和应用场景，最后规划学习路线。

---

## 1 为什么需要大语言模型？

### 痛点分析

传统的 NLP 模型存在很多问题：

**传统 NLP 的问题**：
- ❌ 每个任务都需要专门的模型（翻译、问答、摘要各一个）
- ❌ 需要大量标注数据
- ❌ 模型之间无法共享知识
- ❌ 泛化能力差，遇到新任务就要重新训练

**例子**：
> 假设你要做一个客服系统，需要：
> - 意图识别模型
> - 情感分析模型
> - 问答生成模型
> - 摘要生成模型
> 
> 每个模型都需要单独训练、单独维护，成本很高。

### 解决方案

**大语言模型（LLM）** 的核心思想：**一个模型做所有任务**。

打个比方：

> 传统 NLP 就像请了很多专家，每人只负责一件事；大语言模型就像一个全能助手，什么都能做，而且越用越聪明。

> **一句话总结**：大语言模型通过预训练学习通用语言能力，然后通过提示或微调适应各种任务。

---

## 2 核心原理

### 2.1 大语言模型的发展历程

| 阶段 | 时间 | 代表模型 | 特点 |
| --- | --- | --- | --- |
| **统计语言模型** | 1990s | N-gram | 基于概率统计，简单但效果有限 |
| **神经网络语言模型** | 2000s | RNN、LSTM | 引入神经网络，能捕捉序列信息 |
| **词向量时代** | 2013 | Word2Vec、GloVe | 词可以表示为向量，捕捉语义关系 |
| **预训练时代** | 2018 | GPT-1、BERT | 预训练 + 微调范式，一个模型多任务 |
| **大模型时代** | 2020+ | GPT-3/4、LLaMA | 大规模参数，涌现能力，提示学习 |

### 2.2 Transformer 的革命

**Transformer** 是 2017 年 Google 在论文《Attention Is All You Need》中提出的架构。

**核心创新**：
- ❌ 完全抛弃 RNN 和 CNN
- ✅ 只用注意力机制
- ✅ 完全并行化
- ✅ 能捕捉长距离依赖

**为什么 Transformer 这么重要？**

1. **并行计算**：RNN 必须顺序处理，Transformer 可以并行处理所有词
2. **长距离依赖**：注意力机制让任意两个词都能直接交互
3. **可扩展性**：模型越大、数据越多，效果越好（Scaling Law）

打个比方：

> RNN 就像排队买票，必须一个一个来；Transformer 就像大家一起同时投票，一次性得出结果。

### 2.3 主流大语言模型

#### GPT 系列（OpenAI）

| 模型 | 发布时间 | 参数量 | 特点 |
| --- | --- | --- | --- |
| GPT-1 | 2018 | 1.17 亿 | 首次提出预训练 + 微调 |
| GPT-2 | 2019 | 15 亿 | 零样本学习能力 |
| GPT-3 | 2020 | 1750 亿 | 少样本学习，涌现能力 |
| GPT-4 | 2023 | 未公开 | 多模态，推理能力大幅提升 |

**特点**：
- Decoder-only 架构
- 自回归生成（从左到右）
- 强大的生成能力

#### BERT 系列（Google）

| 模型 | 发布时间 | 参数量 | 特点 |
| --- | --- | --- | --- |
| BERT | 2018 | 1.1 亿/3.4 亿 | 双向理解，掩码语言模型 |
| RoBERTa | 2019 | 同 BERT | 移除 NSP，更多数据 |
| ALBERT | 2019 | 减少参数 | 参数共享，更高效 |
| DistilBERT | 2019 | 6600 万 | 知识蒸馏，更轻量 |

**特点**：
- Encoder-only 架构
- 双向理解（同时看左右文）
- 适合理解类任务（分类、NER）

#### LLaMA 系列（Meta）

| 模型 | 发布时间 | 参数量 | 特点 |
| --- | --- | --- | --- |
| LLaMA-1 | 2023 | 7B/13B/33B/65B | 开源，性能接近 GPT-3 |
| LLaMA-2 | 2023 | 7B/13B/70B | 更长上下文，更好性能 |
| LLaMA-3 | 2024 | 8B/70B | 更高效的训练 |

**特点**：
- 完全开源
- 性能优异
- 社区生态活跃

### 2.4 三种架构对比

| 架构 | 代表模型 | 适用任务 | 特点 |
| --- | --- | --- | --- |
| **Encoder-only** | BERT | 理解任务（分类、NER） | 双向理解，不适合生成 |
| **Decoder-only** | GPT | 生成任务（对话、写作） | 自回归生成，强大的生成能力 |
| **Encoder-Decoder** | T5、BART | 序列到序列任务（翻译、摘要） | 既能理解又能生成 |

---

## 3 基础用法

### 3.1 使用 Hugging Face Transformers

**安装**：

```bash
pip install transformers torch
```

**使用 GPT-2 生成文本**：

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

# 第一步：加载模型和分词器
model_name = "gpt2"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2LMHeadModel.from_pretrained(model_name)

# 第二步：准备输入
prompt = "人工智能的未来是"
inputs = tokenizer(prompt, return_tensors="pt")

# 第三步：生成文本
outputs = model.generate(
    inputs["input_ids"],
    max_length=50,           # 最大生成长度
    num_return_sequences=1,  # 生成 1 个序列
    no_repeat_ngram_size=2,  # 避免重复
    do_sample=True,          # 使用采样
    top_k=50,                # Top-K 采样
    top_p=0.95,              # Top-P 采样
    temperature=0.7          # 温度参数
)

# 第四步：解码输出
generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated_text)
```

**使用 BERT 进行文本分类**：

```python
from transformers import BertForSequenceClassification, BertTokenizer
import torch

# 第一步：加载模型和分词器
model_name = "bert-base-uncased"
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(model_name, num_labels=2)

# 第二步：准备输入
text = "这部电影非常好看"
inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)

# 第三步：前向传播
with torch.no_grad():
    outputs = model(**inputs)

# 第四步：获取预测结果
logits = outputs.logits
predictions = torch.argmax(logits, dim=-1)
print(f"预测类别: {predictions.item()}")
```

### 3.2 使用 LLaMA 模型

**安装依赖**：

```bash
pip install transformers accelerate
```

**加载 LLaMA 模型**：

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# 第一步：指定模型路径
model_name = "meta-llama/Llama-2-7b-hf"  # 需要申请许可

# 第二步：加载分词器
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 第三步：加载模型（使用 GPU）
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,      # 使用半精度
    device_map="auto"               # 自动分配到设备
)

# 第四步：准备输入
prompt = "请介绍一下人工智能的发展历程"
inputs = tokenizer(prompt, return_tensors="pt")
inputs = {k: v.to(model.device) for k, v in inputs.items()}

# 第五步：生成文本
with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=200,
        temperature=0.7,
        top_p=0.9
    )

# 第六步：解码输出
generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated_text)
```

---

## 4 进阶用法

### 4.1 使用 Pipeline 快速推理

```python
from transformers import pipeline

# 文本生成
generator = pipeline("text-generation", model="gpt2")
result = generator("人工智能的未来是", max_length=50)
print(result[0]["generated_text"])

# 文本分类
classifier = pipeline("text-classification", model="bert-base-uncased")
result = classifier("这部电影非常好看")
print(result)

# 问答
qa = pipeline("question-answering", model="bert-base-uncased")
result = qa(
    question="什么是人工智能？",
    context="人工智能是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。"
)
print(result)
```

### 4.2 模型对比实验

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

def compare_models(prompts, model_names):
    """
    对比不同模型的生成效果
    
    参数：
    - prompts: 提示列表
    - model_names: 模型名称列表
    """
    results = {}
    
    for model_name in model_names:
        print(f"\n{'='*50}")
        print(f"模型: {model_name}")
        print(f"{'='*50}")
        
        # 加载模型
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        
        model_results = []
        
        for prompt in prompts:
            # 生成
            inputs = tokenizer(prompt, return_tensors="pt")
            inputs = {k: v.to(model.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=100,
                    temperature=0.7
                )
            
            generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            model_results.append(generated_text)
            
            print(f"\n提示: {prompt}")
            print(f"生成: {generated_text}")
        
        results[model_name] = model_results
    
    return results

# 使用示例
prompts = [
    "人工智能的未来是",
    "量子计算的优势包括",
    "深度学习的应用领域有"
]

model_names = ["gpt2", "gpt2-medium"]  # 可以添加更多模型
results = compare_models(prompts, model_names)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **大语言模型** | 通过大规模预训练学习通用语言能力的模型 |
| **Transformer** | 基于注意力机制的架构，是现代 LLM 的基础 |
| **预训练 + 微调** | 先在大规模数据上预训练，再在特定任务上微调 |
| **GPT 系列** | Decoder-only 架构，擅长生成任务 |
| **BERT 系列** | Encoder-only 架构，擅长理解任务 |
| **LLaMA 系列** | 开源模型，性能优异，社区活跃 |
| **涌现能力** | 模型规模达到一定程度后出现的新能力 |

---

## 6 新手常见误区

### 误区 1："模型越大越好"

**不完全对。** 大模型虽然强大，但也有问题：
- 推理成本高
- 需要更多计算资源
- 可能过拟合

**正确做法**：
- 根据任务选择合适的模型
- 小任务可以用小模型
- 考虑成本和效果的平衡

### 误区 2："GPT 和 BERT 可以互换使用"

**错！** 它们有不同的架构和适用场景：

| 特性 | GPT | BERT |
| --- | --- | --- |
| 架构 | Decoder-only | Encoder-only |
| 方向 | 单向（从左到右） | 双向 |
| 适用任务 | 生成任务 | 理解任务 |
| 训练目标 | 预测下一个词 | 掩码语言模型 |

**正确做法**：
- 生成任务（对话、写作）用 GPT
- 理解任务（分类、NER）用 BERT

### 误区 3："预训练模型不需要微调"

**不完全对。** 预训练模型虽然强大，但：
- 通用预训练 ≠ 特定任务最优
- 微调可以显著提升特定任务性能
- 某些任务需要领域适配

**正确做法**：
- 简单任务可以直接用预训练模型
- 复杂任务建议微调
- 考虑使用提示学习（Prompt Learning）

### 误区 4："Transformer 只能用于 NLP"

**错！** Transformer 已经扩展到很多领域：
- 计算机视觉（ViT）
- 语音识别（Whisper）
- 多模态（CLIP、GPT-4V）
- 蛋白质结构预测（AlphaFold）

**正确做法**：
- Transformer 是一种通用架构
- 可以根据任务调整
- 关注跨领域应用

### 误区 5："学习大模型需要很强的数学基础"

**不完全对。** 虽然底层需要数学，但：
- 使用现成库不需要太多数学
- 重点是理解概念和原理
- 可以边用边学

**正确做法**：
- 先掌握基本概念
- 动手实践
- 遇到不懂的再补数学

---

## 7 动手练习

### 练习 1：基础练习 - 使用 GPT-2 生成文本

**题目**：使用 GPT-2 模型生成一段关于"人工智能"的文本。

**要求**：
- 使用 transformers 库
- 设置合适的生成参数
- 生成至少 50 个词

<details>
<summary>点击查看答案</summary>

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

# 加载模型和分词器
model_name = "gpt2"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2LMHeadModel.from_pretrained(model_name)

# 准备输入
prompt = "人工智能是"
inputs = tokenizer(prompt, return_tensors="pt")

# 生成文本
outputs = model.generate(
    inputs["input_ids"],
    max_length=100,
    num_return_sequences=1,
    no_repeat_ngram_size=2,
    do_sample=True,
    top_k=50,
    top_p=0.95,
    temperature=0.7
)

# 解码输出
generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated_text)
```

</details>

### 练习 2：进阶练习 - 对比不同模型

**题目**：对比 GPT-2 和 GPT-2-medium 在相同提示下的生成效果。

**要求**：
- 使用相同的提示
- 对比生成结果的质量
- 分析模型大小的影响

<details>
<summary>点击查看答案</summary>

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

def compare_models(prompt, model_names):
    """
    对比不同模型的生成效果
    """
    for model_name in model_names:
        print(f"\n{'='*50}")
        print(f"模型: {model_name}")
        print(f"{'='*50}")
        
        # 加载模型
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(model_name)
        
        # 生成
        inputs = tokenizer(prompt, return_tensors="pt")
        outputs = model.generate(
            inputs["input_ids"],
            max_length=100,
            do_sample=True,
            temperature=0.7
        )
        
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"提示: {prompt}")
        print(f"生成: {generated_text}")

# 使用示例
prompt = "人工智能的未来是"
model_names = ["gpt2", "gpt2-medium"]
compare_models(prompt, model_names)
```

</details>

### 练习 3（挑战）：综合练习 - 构建简单的问答系统

**题目**：使用预训练模型构建一个简单的问答系统。

**要求**：
- 使用 pipeline
- 支持上下文问答
- 处理用户输入

<details>
<summary>点击查看答案</summary>

```python
from transformers import pipeline

# 加载问答 pipeline
qa_pipeline = pipeline("question-answering", model="bert-base-uncased")

def simple_qa_system(context):
    """
    简单的问答系统
    
    参数：
    - context: 上下文文本
    """
    print("上下文:", context)
    print("\n输入 'quit' 退出")
    
    while True:
        question = input("\n请输入问题: ")
        
        if question.lower() == 'quit':
            break
        
        # 问答
        result = qa_pipeline(
            question=question,
            context=context
        )
        
        print(f"答案: {result['answer']}")
        print(f"置信度: {result['score']:.2f}")

# 使用示例
context = """
人工智能是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。
人工智能的应用包括语音识别、图像识别、自然语言处理等。
深度学习是人工智能的一个子领域，使用神经网络来学习数据的表示。
"""

simple_qa_system(context)
```

</details>

---

## 下一章预告

下一章我们会学习 **注意力机制深度解析**——这是 Transformer 的核心。你会学到 Query/Key/Value 的概念、自注意力机制、多头注意力等关键知识。这些是理解 Transformer 工作原理的基础。
