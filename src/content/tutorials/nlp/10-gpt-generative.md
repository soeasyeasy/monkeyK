---
title: "第10章：GPT 系列与生成式模型"
description: "GPT 演进、自回归生成、提示学习、In-Context Learning"
---

# 第10章：GPT 系列与生成式模型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- GPT 是什么？和 BERT 有什么区别？
- 什么是自回归生成？GPT 是怎么生成文本的？
- 什么是提示学习（Prompt Learning）？为什么它这么火？
- In-Context Learning 是什么？GPT 为什么能做到"零样本学习"？

这一章就是为了解答这些问题。我们会从 **GPT 的核心原理** 开始，逐步学习自回归生成、提示学习、In-Context Learning 等内容。

---

## 1 为什么需要 GPT？

### 痛点分析

上一章我们学了 BERT，但它只能理解文本，不能生成文本。

**BERT 的局限**：
- 只能做理解任务（分类、标注）
- 不能生成新文本（翻译、摘要、对话）
- 需要为每个任务微调模型

**问题**：能不能有一个模型，既能理解又能生成，还能通过提示完成各种任务？

### 解决方案

**GPT（Generative Pre-trained Transformer）** 是 OpenAI 提出的生成式预训练模型。

**核心创新**：
- **自回归生成**：从左到右逐个生成词
- **提示学习**：通过提示（Prompt）引导模型完成任务
- **In-Context Learning**：不需要微调，通过示例就能学习

打个比方：

> BERT 像一个阅读理解专家，能回答问题但不能写文章。GPT 像一个作家，能写文章、回答问题、翻译、总结。你只需要告诉他"请翻译这段话"，他就能完成。

> **一句话总结**：GPT 开启了生成式 AI 时代，让模型能"写"能"说"。

---

## 2 核心原理

### 2.1 GPT 的架构

**GPT 基于 Transformer 解码器**，与 BERT 的关键区别：

| 特性 | BERT | GPT |
| --- | --- | --- |
| 架构 | Transformer 编码器 | Transformer 解码器 |
| 注意力 | 双向（看到所有词） | 单向（只看到前面的词） |
| 预训练 | MLM + NSP | 自回归语言模型 |
| 任务 | 理解任务 | 生成任务 |
| 使用方式 | 微调 | 提示学习 |

**GPT 的演进**：

| 模型 | 发布时间 | 参数量 | 关键改进 |
| --- | --- | --- | --- |
| **GPT-1** | 2018 | 117M | 首次提出 GPT 架构 |
| **GPT-2** | 2019 | 1.5B | 更大模型，零样本能力 |
| **GPT-3** | 2020 | 175B | In-Context Learning，少样本学习 |
| **GPT-3.5** | 2022 | - | 指令微调，ChatGPT 基础 |
| **GPT-4** | 2023 | - | 多模态，更强推理能力 |

### 2.2 自回归语言模型

**自回归（Autoregressive）** 是指从左到右逐个生成词。

**公式**：

```
P(x_1, x_2, ..., x_n) = P(x_1) × P(x_2|x_1) × P(x_3|x_1,x_2) × ... × P(x_n|x_1,...,x_{n-1})
```

**直观理解**：
> 写文章时，你一个字一个字地写。写完第一个字后，根据第一个字决定第二个字；写完前两个字后，根据前两个字决定第三个字...这就是自回归。

**训练目标**：最大化下一个词的预测概率。

```
Loss = -Σ log P(x_t | x_1, ..., x_{t-1})
```

### 2.3 掩码自注意力（Masked Self-Attention）

**问题**：GPT 是生成模型，在训练时不能"看到"未来的词。

**解决方案**：使用掩码，让每个位置只能看到前面的词。

**例子**：
```
位置：1  2  3  4
词：  我  喜  欢  猫

位置 1（我）：只能看到 [我]
位置 2（喜）：能看到 [我, 喜]
位置 3（欢）：能看到 [我, 喜, 欢]
位置 4（猫）：能看到 [我, 喜, 欢, 猫]
```

**实现**：在注意力矩阵的上三角部分填充 -∞，softmax 后变成 0。

```python
# 掩码矩阵（4x4）
mask = [
    [1, 0, 0, 0],  # 位置 1 只能看到位置 1
    [1, 1, 0, 0],  # 位置 2 能看到位置 1-2
    [1, 1, 1, 0],  # 位置 3 能看到位置 1-3
    [1, 1, 1, 1]   # 位置 4 能看到位置 1-4
]
```

### 2.4 文本生成策略

GPT 生成文本时，需要选择下一个词。常见策略：

| 策略 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **贪心搜索** | 每步选概率最大的词 | 快、确定 | 可能生成重复或无意义 |
| **Beam Search** | 保留 Top-K 候选 | 效果更好 | 慢、可能重复 |
| **Top-k 采样** | 从概率最高的 k 个词中随机采样 | 多样性 | 可能选到不合适的 |
| **Top-p 采样** | 从累积概率达到 p 的词中采样 | 自适应 | 需要调参 |
| **Temperature** | 控制概率分布的"锐度" | 调节创造性 | 需要调参 |

**Temperature 的作用**：

```
P'(x_i) = softmax(log P(x_i) / T)

T < 1: 分布更锐利，倾向选高概率词（更确定）
T = 1: 原始分布
T > 1: 分布更平缓，倾向均匀采样（更随机）
```

### 2.5 提示学习（Prompt Learning）

**提示学习** 是通过设计提示（Prompt）引导模型完成任务，不需要微调。

**例子**：

```
任务：情感分析

传统方法：
输入："这部电影太好看了"
输出：好评

提示学习：
输入："请判断以下评论的情感（好评/差评）：这部电影太好看了。情感："
输出：好评
```

**提示的类型**：

| 类型 | 示例 | 特点 |
| --- | --- | --- |
| **零样本** | "翻译：你好 → " | 无示例 |
| **单样本** | "翻译：你好 → Hello\n翻译：再见 → " | 1 个示例 |
| **少样本** | "翻译：你好 → Hello\n翻译：再见 → Goodbye\n翻译：谢谢 → " | 多个示例 |

### 2.6 In-Context Learning

**In-Context Learning（ICL）** 是 GPT-3 的核心能力：通过提示中的示例学习任务，不需要更新参数。

**原理**：
- 大模型在预训练时见过大量任务
- 提示中的示例激活了相关的知识
- 模型根据示例推断任务模式

**例子**：

```
提示：
将英文翻译成法文：
- Hello → Bonjour
- Goodbye → Au revoir
- Thank you → Merci
- How are you →

模型输出：Comment allez-vous
```

**关键点**：
- 不需要微调
- 示例质量比数量重要
- 模型越大，ICL 能力越强

---

## 3 对比分析

| 特性 | BERT | GPT | T5 |
| --- | --- | --- | --- |
| 架构 | 编码器 | 解码器 | 编码器-解码器 |
| 注意力 | 双向 | 单向 | 双向 |
| 预训练 | MLM | 自回归 | Seq2Seq |
| 使用方式 | 微调 | 提示学习 | 微调/提示 |
| 适用任务 | 理解 | 生成 | 所有 |
| 代表模型 | BERT, RoBERTa | GPT, LLaMA | T5, BART |

---

## 4 基础用法

### 4.1 使用 GPT-2 生成文本

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

# 加载模型和分词器
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

# 准备输入
prompt = "Once upon a time"
inputs = tokenizer(prompt, return_tensors='pt')

# 生成文本
with torch.no_grad():
    outputs = model.generate(
        inputs.input_ids,
        max_length=50,
        num_return_sequences=1,
        no_repeat_ngram_size=2,
        do_sample=True,
        top_k=50,
        top_p=0.95,
        temperature=0.7
    )

# 解码
generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(f"生成文本：{generated_text}")
```

### 4.2 使用 GPT-2 进行文本续写

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

# 中文需要特殊处理（GPT-2 主要支持英文）
# 这里用英文示例
prompt = "The future of AI is"
inputs = tokenizer(prompt, return_tensors='pt')

# 生成
outputs = model.generate(
    inputs.input_ids,
    max_length=100,
    num_return_sequences=3,
    do_sample=True,
    top_k=50,
    temperature=0.8
)

for i, output in enumerate(outputs):
    text = tokenizer.decode(output, skip_special_tokens=True)
    print(f"\n生成 {i+1}：{text}")
```

### 4.3 使用提示学习进行情感分析

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

# 设计提示
prompt = """Determine the sentiment of the following review (positive/negative):

Review: "This movie is amazing!"
Sentiment: positive

Review: "I hated this film."
Sentiment: negative

Review: "The plot was boring and predictable."
Sentiment:"""

inputs = tokenizer(prompt, return_tensors='pt')

# 生成
outputs = model.generate(
    inputs.input_ids,
    max_length=len(inputs.input_ids[0]) + 10,
    do_sample=False  # 贪心搜索
)

generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(f"提示：{prompt}")
print(f"模型输出：{generated}")
```

### 4.4 使用更大的模型（GPT-Neo）

```python
from transformers import GPTNeoForCausalLM, GPT2Tokenizer

# 加载 GPT-Neo（开源的 GPT-3 替代品）
model_name = "EleutherAI/gpt-neo-1.3B"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPTNeoForCausalLM.from_pretrained(model_name)

# 提示
prompt = "Translate English to French:\nHello → "
inputs = tokenizer(prompt, return_tensors='pt')

# 生成
outputs = model.generate(
    inputs.input_ids,
    max_length=50,
    do_sample=False
)

generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(f"生成：{generated}")
```

### 4.5 使用 OpenAI API（GPT-3.5/GPT-4）

```python
import openai

# 设置 API 密钥
openai.api_key = "your-api-key"

# 调用 GPT-3.5
response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Translate 'Hello' to French"}
    ]
)

print(response.choices[0].message.content)
```

---

## 5 实战：构建简单的聊天机器人

### 5.1 基于 GPT-2 的对话系统

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

class ChatBot:
    def __init__(self, model_name='gpt2'):
        self.tokenizer = GPT2Tokenizer.from_pretrained(model_name)
        self.model = GPT2LMHeadModel.from_pretrained(model_name)
        
        # 设置特殊 token
        self.tokenizer.pad_token = self.tokenizer.eos_token
    
    def chat(self, user_input, max_length=100):
        # 构建提示
        prompt = f"Human: {user_input}\nAI:"
        
        # 编码
        inputs = self.tokenizer(prompt, return_tensors='pt', padding=True)
        
        # 生成
        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_length=max_length,
                num_return_sequences=1,
                do_sample=True,
                top_k=50,
                top_p=0.95,
                temperature=0.7,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        # 解码
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 提取 AI 回复
        if "AI:" in response:
            ai_response = response.split("AI:")[-1].strip()
        else:
            ai_response = response
        
        return ai_response

# 测试
bot = ChatBot()

while True:
    user_input = input("You: ")
    if user_input.lower() in ['exit', 'quit', 'bye']:
        break
    
    response = bot.chat(user_input)
    print(f"AI: {response}\n")
```

### 5.2 使用提示工程改进对话

```python
class ImprovedChatBot:
    def __init__(self, model_name='gpt2'):
        self.tokenizer = GPT2Tokenizer.from_pretrained(model_name)
        self.model = GPT2LMHeadModel.from_pretrained(model_name)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # 系统提示
        self.system_prompt = """You are a friendly and helpful AI assistant. 
You answer questions clearly and concisely.

"""
    
    def chat(self, user_input, conversation_history=None):
        # 构建完整提示
        prompt = self.system_prompt
        
        if conversation_history:
            for turn in conversation_history:
                prompt += f"Human: {turn['user']}\nAI: {turn['ai']}\n"
        
        prompt += f"Human: {user_input}\nAI:"
        
        # 生成
        inputs = self.tokenizer(prompt, return_tensors='pt')
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_length=200,
                num_return_sequences=1,
                do_sample=True,
                top_k=50,
                top_p=0.95,
                temperature=0.7,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 提取 AI 回复
        if "AI:" in response:
            ai_response = response.split("AI:")[-1].split("Human:")[0].strip()
        else:
            ai_response = response
        
        return ai_response

# 测试
bot = ImprovedChatBot()
history = []

while True:
    user_input = input("You: ")
    if user_input.lower() in ['exit', 'quit']:
        break
    
    response = bot.chat(user_input, history)
    print(f"AI: {response}\n")
    
    history.append({'user': user_input, 'ai': response})
    
    # 限制历史长度
    if len(history) > 5:
        history = history[-5:]
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **GPT** | 基于 Transformer 解码器的生成式模型 |
| **自回归** | 从左到右逐个生成词 |
| **掩码注意力** | 只能看到前面的词，不能看到未来 |
| **生成策略** | 贪心、Beam Search、Top-k、Top-p、Temperature |
| **提示学习** | 通过提示引导模型完成任务 |
| **In-Context Learning** | 通过示例学习，不需要微调 |

---

## 7 新手常见误区

### 误区 1："GPT 和 BERT 是一样的"

**错！** GPT 是生成模型（解码器），BERT 是理解模型（编码器）。GPT 用于生成文本，BERT 用于理解文本。

### 误区 2："GPT 只能生成文本"

不是的。GPT 可以用于各种任务：翻译、摘要、问答、代码生成等。只需要设计合适的提示。

### 误区 3："提示学习不需要大模型"

**错！** In-Context Learning 需要大模型（如 GPT-3 175B）才能有效。小模型的 ICL 能力很弱。

### 误区 4："Temperature 越高越好"

不是的。Temperature 太高会导致生成随机、不连贯；太低会导致重复、无聊。一般 0.7-1.0 比较合适。

---

## 8 动手练习

### 练习 1：基础练习 - 使用 GPT-2 生成文本

**题目**：使用 GPT-2 生成一段以"The future of technology is"开头的文本。

<details>
<summary>点击查看答案</summary>

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

prompt = "The future of technology is"
inputs = tokenizer(prompt, return_tensors='pt')

outputs = model.generate(
    inputs.input_ids,
    max_length=50,
    do_sample=True,
    top_k=50,
    temperature=0.7
)

generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated)
```

</details>

### 练习 2：进阶练习 - 使用提示学习进行翻译

**题目**：设计一个提示，让 GPT-2 完成英法翻译任务。

<details>
<summary>点击查看答案</summary>

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

prompt = """Translate English to French:
- Hello → Bonjour
- Goodbye → Au revoir
- Thank you → Merci
- Good morning →"""

inputs = tokenizer(prompt, return_tensors='pt')

outputs = model.generate(
    inputs.input_ids,
    max_length=50,
    do_sample=False
)

generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated)
```

</details>

### 练习 3（挑战）：综合练习 - 构建多轮对话机器人

**题目**：实现一个支持多轮对话的聊天机器人，能记住之前的对话内容。

<details>
<summary>点击查看答案</summary>

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

class MultiTurnChatBot:
    def __init__(self):
        self.tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
        self.model = GPT2LMHeadModel.from_pretrained('gpt2')
        self.tokenizer.pad_token = self.tokenizer.eos_token
        self.history = []
    
    def chat(self, user_input):
        # 构建提示
        prompt = "You are a helpful AI assistant.\n\n"
        
        for turn in self.history:
            prompt += f"Human: {turn['user']}\nAI: {turn['ai']}\n"
        
        prompt += f"Human: {user_input}\nAI:"
        
        # 生成
        inputs = self.tokenizer(prompt, return_tensors='pt')
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_length=200,
                do_sample=True,
                top_k=50,
                temperature=0.7,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 提取回复
        if "AI:" in response:
            ai_response = response.split("AI:")[-1].split("Human:")[0].strip()
        else:
            ai_response = response
        
        # 更新历史
        self.history.append({'user': user_input, 'ai': ai_response})
        
        # 限制历史长度
        if len(self.history) > 10:
            self.history = self.history[-10:]
        
        return ai_response

# 测试
bot = MultiTurnChatBot()

while True:
    user_input = input("You: ")
    if user_input.lower() in ['exit', 'quit']:
        break
    
    response = bot.chat(user_input)
    print(f"AI: {response}\n")
```

</details>

---

## 下一章预告

下一章我们会学习 **文本分类实战**——也就是如何用深度学习做文本分类。你会学到情感分析、主题分类、垃圾邮件检测等任务。这是 NLP 最基础也最重要的应用之一。
