---
title: "第9章：提示学习（Prompt Learning）"
description: "Prompt 设计、In-Context Learning、Few-shot/Zero-shot、Chain-of-Thought、思维链推理"
---

# 第9章：提示学习（Prompt Learning）

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Prompt？为什么它这么重要？
- 什么是 In-Context Learning？和微调有什么区别？
- Few-shot 和 Zero-shot 有什么区别？
- 什么是 Chain-of-Thought？为什么它能提升推理能力？
- 怎么设计一个好的 Prompt？

这一章就是为了解答这些问题。我们会从 **Prompt 的基本概念** 开始，学习 In-Context Learning、Few-shot/Zero-shot，然后深入 Chain-of-Thought 等高级技巧。

---

## 1 为什么需要提示学习？

### 痛点分析

**传统微调的问题**：

1. **需要标注数据**：每个任务都需要大量标注数据
2. **训练成本高**：需要重新训练模型
3. **灾难性遗忘**：微调后可能忘记其他能力
4. **部署困难**：每个任务需要单独的模型

**例子**：
> 你想让 GPT-3 做情感分析：
> - 传统方法：收集几千条标注数据，微调模型
> - 提示学习：直接告诉模型"判断这句话的情感：..."

### 解决方案

**提示学习（Prompt Learning）**：
- ✅ 不需要标注数据（或只需要少量）
- ✅ 不需要训练模型
- ✅ 一个模型可以做多个任务
- ✅ 即插即用

打个比方：

> 传统微调就像让一个人专门学习一项技能；提示学习就像给一个全能助手写说明书，告诉它怎么做不同的任务。

> **一句话总结**：提示学习通过设计好的 Prompt，让大模型无需训练就能完成各种任务。

---

## 2 核心原理

### 2.1 In-Context Learning（上下文学习）

**核心思想**：通过在输入中提供示例，让模型学习任务。

**与传统学习的区别**：

| 方法 | 是否需要训练 | 是否需要标注数据 | 模型参数是否更新 |
| --- | --- | --- | --- |
| **传统学习** | ✅ 需要 | ✅ 需要 | ✅ 更新 |
| **微调** | ✅ 需要 | ✅ 需要 | ✅ 更新 |
| **In-Context Learning** | ❌ 不需要 | ❌ 不需要 | ❌ 不更新 |

**工作原理**：

```
输入：
问题：中国的首都是哪里？
答案：北京

问题：美国的首都是哪里？
答案：华盛顿

问题：法国的首都是哪里？
答案：

模型输出：巴黎
```

**代码实现**：

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

def in_context_learning(prompt, examples, query):
    """
    上下文学习
    
    参数：
    - prompt: 任务描述
    - examples: 示例列表 [(问题, 答案), ...]
    - query: 查询问题
    """
    # 构造完整的输入
    full_prompt = prompt + "\n\n"
    for q, a in examples:
        full_prompt += f"问题：{q}\n答案：{a}\n\n"
    full_prompt += f"问题：{query}\n答案："
    
    # 加载模型
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    
    # 生成
    inputs = tokenizer(full_prompt, return_tensors="pt")
    outputs = model.generate(
        inputs["input_ids"],
        max_length=100,
        do_sample=False  # 使用贪心解码
    )
    
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return result

# 使用示例
prompt = "请回答以下问题："
examples = [
    ("中国的首都是哪里？", "北京"),
    ("美国的首都是哪里？", "华盛顿"),
]
query = "法国的首都是哪里？"

result = in_context_learning(prompt, examples, query)
print(result)
```

### 2.2 Few-shot 与 Zero-shot

#### Zero-shot Learning（零样本学习）

**不提供任何示例**，直接让模型完成任务。

```
输入：
将以下句子分类为正面或负面：
"这部电影非常精彩"
情感：

输出：正面
```

**代码实现**：

```python
def zero_shot_classification(text, labels):
    """
    零样本分类
    
    参数：
    - text: 输入文本
    - labels: 标签列表
    """
    prompt = f"""将以下文本分类为以下类别之一：{', '.join(labels)}

文本：{text}
类别："""
    
    # 使用模型生成
    from transformers import GPT2LMHeadModel, GPT2Tokenizer
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(inputs["input_ids"], max_length=50)
    
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return result

# 使用示例
text = "这部电影非常精彩，演员表演出色"
labels = ["正面", "负面"]
result = zero_shot_classification(text, labels)
print(result)
```

#### Few-shot Learning（少样本学习）

**提供少量示例**（通常 1-10 个），让模型学习任务。

```
输入：
将以下句子分类为正面或负面：

文本："这部电影非常精彩"
类别：正面

文本："剧情太无聊了"
类别：负面

文本："演员表演出色"
类别：

输出：正面
```

**代码实现**：

```python
def few_shot_classification(text, examples, labels):
    """
    少样本分类
    
    参数：
    - text: 输入文本
    - examples: 示例列表 [(文本, 标签), ...]
    - labels: 标签列表
    """
    prompt = f"""将以下文本分类为以下类别之一：{', '.join(labels)}

"""
    for ex_text, ex_label in examples:
        prompt += f"文本："{ex_text}"\n类别：{ex_label}\n\n"
    
    prompt += f"文本："{text}"\n类别："
    
    # 使用模型生成
    from transformers import GPT2LMHeadModel, GPT2Tokenizer
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(inputs["input_ids"], max_length=50)
    
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return result

# 使用示例
text = "演员表演出色"
examples = [
    ("这部电影非常精彩", "正面"),
    ("剧情太无聊了", "负面"),
]
labels = ["正面", "负面"]
result = few_shot_classification(text, examples, labels)
print(result)
```

#### 对比分析

| 方法 | 示例数量 | 适用场景 | 效果 |
| --- | --- | --- | --- |
| **Zero-shot** | 0 | 简单任务，模型已知的任务 | 一般 |
| **One-shot** | 1 | 需要格式指导的任务 | 较好 |
| **Few-shot** | 2-10 | 复杂任务，需要学习任务格式 | 最好 |

### 2.3 Chain-of-Thought（思维链）

**核心思想**：让模型展示推理过程，而不是直接给出答案。

**为什么有效？**

1. **分解复杂问题**：将复杂问题分解为简单步骤
2. **提高推理能力**：显式的推理过程
3. **减少错误**：逐步验证中间结果

**例子**：

```
问题：一个商店有 23 个苹果，卖了 15 个，又进了 8 个，现在有多少个？

直接回答：
答案：16

思维链回答：
让我们一步一步思考：
1. 初始有 23 个苹果
2. 卖了 15 个，剩下 23 - 15 = 8 个
3. 又进了 8 个，现在有 8 + 8 = 16 个
答案：16
```

**代码实现**：

```python
def chain_of_thought(question, examples=None):
    """
    思维链推理
    
    参数：
    - question: 问题
    - examples: 示例列表 [(问题, 推理过程), ...]
    """
    prompt = "请一步一步思考并回答问题。\n\n"
    
    # 添加示例
    if examples:
        for q, reasoning in examples:
            prompt += f"问题：{q}\n{reasoning}\n\n"
    
    # 添加当前问题
    prompt += f"问题：{question}\n让我们一步一步思考："
    
    # 使用模型生成
    from transformers import GPT2LMHeadModel, GPT2Tokenizer
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        inputs["input_ids"],
        max_length=200,
        do_sample=True,
        temperature=0.7
    )
    
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return result

# 使用示例
question = "一个商店有 23 个苹果，卖了 15 个，又进了 8 个，现在有多少个？"
examples = [
    ("小明有 5 个苹果，小红给了他 3 个，他又买了 2 个，现在有多少个？",
     "让我们一步一步思考：\n1. 小明初始有 5 个苹果\n2. 小红给了他 3 个，现在有 5 + 3 = 8 个\n3. 他又买了 2 个，现在有 8 + 2 = 10 个\n答案：10 个"),
]

result = chain_of_thought(question, examples)
print(result)
```

### 2.4 Prompt 设计技巧

#### 技巧 1：明确任务描述

```
❌ 差的 Prompt：
"分析这句话"

✅ 好的 Prompt：
"请将以下句子分类为正面或负面情感。只输出类别，不要输出其他内容。"
```

#### 技巧 2：提供输出格式

```
✅ 好的 Prompt：
"请按照以下格式回答：
问题：[问题]
答案：[答案]
解释：[解释]"
```

#### 技巧 3：使用分隔符

```
✅ 好的 Prompt：
"请将以下文本翻译为英文。

文本：
---
今天天气很好
---

翻译："
```

#### 技巧 4：角色扮演

```
✅ 好的 Prompt：
"你是一位专业的 Python 程序员。请帮我写一个快速排序算法。"
```

---

## 3 基础用法

### 3.1 使用 OpenAI API

```python
import openai

def chat_completion(prompt, model="gpt-3.5-turbo"):
    """
    使用 OpenAI API
    
    参数：
    - prompt: 提示
    - model: 模型名称
    """
    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role": "system", "content": "你是一位有帮助的助手。"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=500
    )
    
    return response.choices[0].message.content

# 使用示例
prompt = "请用一句话解释什么是人工智能"
result = chat_completion(prompt)
print(result)
```

### 3.2 使用 Hugging Face 模型

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

def generate_with_prompt(prompt, model_name="gpt2"):
    """
    使用 Hugging Face 模型生成
    
    参数：
    - prompt: 提示
    - model_name: 模型名称
    """
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        inputs["input_ids"],
        max_length=200,
        do_sample=True,
        temperature=0.7,
        top_p=0.9
    )
    
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return result

# 使用示例
prompt = "人工智能的未来是"
result = generate_with_prompt(prompt)
print(result)
```

---

## 4 进阶用法

### 4.1 高级 Prompt 模板

```python
class PromptTemplate:
    def __init__(self, template, input_variables):
        """
        Prompt 模板
        
        参数：
        - template: 模板字符串
        - input_variables: 输入变量列表
        """
        self.template = template
        self.input_variables = input_variables
    
    def format(self, **kwargs):
        """
        格式化模板
        
        参数：
        - kwargs: 关键字参数
        """
        # 验证变量
        for var in self.input_variables:
            if var not in kwargs:
                raise ValueError(f"缺少变量: {var}")
        
        return self.template.format(**kwargs)

# 使用示例
template = PromptTemplate(
    template="请将以下{text}翻译为{target_language}：\n\n{text}\n\n翻译：",
    input_variables=["text", "target_language"]
)

prompt = template.format(text="今天天气很好", target_language="英文")
print(prompt)
```

### 4.2 多轮对话

```python
def multi_turn_conversation(messages, model="gpt-3.5-turbo"):
    """
    多轮对话
    
    参数：
    - messages: 消息列表
    - model: 模型名称
    """
    import openai
    
    response = openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=0.7
    )
    
    return response.choices[0].message.content

# 使用示例
messages = [
    {"role": "system", "content": "你是一位 Python 专家。"},
    {"role": "user", "content": "什么是列表推导式？"},
    {"role": "assistant", "content": "列表推导式是 Python 中创建列表的简洁方式..."},
    {"role": "user", "content": "能给个例子吗？"}
]

response = multi_turn_conversation(messages)
print(response)
```

### 4.3 思维链变体

#### Self-Consistency（自一致性）

**核心思想**：生成多个推理路径，选择最常见的答案。

```python
def self_consistency(question, num_paths=5):
    """
    自一致性
    
    参数：
    - question: 问题
    - num_paths: 推理路径数量
    """
    from transformers import GPT2LMHeadModel, GPT2Tokenizer
    
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    
    answers = []
    
    for _ in range(num_paths):
        prompt = f"问题：{question}\n让我们一步一步思考："
        
        inputs = tokenizer(prompt, return_tensors="pt")
        outputs = model.generate(
            inputs["input_ids"],
            max_length=200,
            do_sample=True,
            temperature=0.9  # 增加随机性
        )
        
        result = tokenizer.decode(outputs[0], skip_special_tokens=True)
        answers.append(result)
    
    # 选择最常见的答案（简化版）
    return max(set(answers), key=answers.count)

# 使用示例
question = "一个商店有 23 个苹果，卖了 15 个，又进了 8 个，现在有多少个？"
answer = self_consistency(question)
print(answer)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **In-Context Learning** | 通过输入中的示例学习任务 |
| **Zero-shot** | 不提供示例，直接完成任务 |
| **Few-shot** | 提供少量示例（1-10 个） |
| **Chain-of-Thought** | 展示推理过程，提高推理能力 |
| **Self-Consistency** | 生成多个推理路径，选择最常见答案 |
| **Prompt 设计** | 明确任务、提供格式、使用分隔符、角色扮演 |

---

## 6 新手常见误区

### 误区 1："Prompt 越复杂越好"

**错！** 好的 Prompt 应该：
- 清晰明确
- 简洁易懂
- 避免歧义

**正确做法**：
- 先写简单的 Prompt
- 逐步添加细节
- 测试并迭代

### 误区 2："Few-shot 示例越多越好"

**不完全对。** 示例过多会导致：
- 超出上下文长度
- 增加成本
- 可能引入噪声

**正确做法**：
- 通常 3-5 个示例足够
- 选择有代表性的示例
- 覆盖不同情况

### 误区 3："Chain-of-Thought 适用于所有任务"

**不完全对。** CoT 主要适用于：
- 数学推理
- 逻辑推理
- 多步骤问题

**不适用于**：
- 简单分类
- 事实查询
- 创意写作

**正确做法**：
- 根据任务选择合适的方法
- 简单任务不需要 CoT
- 复杂推理任务使用 CoT

---

## 7 动手练习

### 练习 1：基础练习 - Zero-shot 分类

**题目**：使用 Zero-shot 进行情感分类。

<details>
<summary>点击查看答案</summary>

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

def zero_shot_sentiment(text):
    prompt = f"""将以下句子分类为正面或负面：

句子："{text}"
情感："""
    
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(inputs["input_ids"], max_length=50)
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

text = "这部电影非常精彩"
result = zero_shot_sentiment(text)
print(result)
```

</details>

### 练习 2：进阶练习 - Few-shot 分类

**题目**：使用 Few-shot 进行主题分类。

<details>
<summary>点击查看答案</summary>

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

def few_shot_topic(text, examples):
    prompt = "将以下文本分类为主题类别：\n\n"
    for ex_text, ex_topic in examples:
        prompt += f"文本："{ex_text}"\n主题：{ex_topic}\n\n"
    prompt += f"文本："{text}"\n主题："
    
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(inputs["input_ids"], max_length=50)
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

examples = [
    ("Python 是一种编程语言", "编程"),
    ("今天天气很好", "天气"),
]
text = "机器学习是人工智能的一个分支"
result = few_shot_topic(text, examples)
print(result)
```

</details>

### 练习 3（挑战）：综合练习 - Chain-of-Thought 推理

**题目**：使用 Chain-of-Thought 解决数学问题。

<details>
<summary>点击查看答案</summary>

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer

def chain_of_thought_math(question):
    prompt = f"""请一步一步解决以下数学问题：

问题：{question}

让我们一步一步思考："""
    
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        inputs["input_ids"],
        max_length=200,
        do_sample=True,
        temperature=0.7
    )
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

question = "一个商店有 23 个苹果，卖了 15 个，又进了 8 个，现在有多少个？"
result = chain_of_thought_math(question)
print(result)
```

</details>

---

## 下一章预告

下一章我们会学习 **指令微调与对齐技术**——如何让大模型更好地遵循人类指令。你会学到指令微调、RLHF、DPO、PPO 等关键技术。这些是让大模型变得更有用、更安全的核心技术。
