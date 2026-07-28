---
title: "第04章：数据准备与处理"
description: "掌握微调数据格式、数据清洗、数据增强技术，准备高质量训练数据"
---

# 第04章：数据准备与处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 微调需要什么格式的数据？
- 数据量需要多少？
- 如何清洗和处理数据？
- 数据质量不好怎么办？

这一章会教你 **如何准备高质量的微调数据**。我们会从 **数据格式** 开始，逐步学习 **数据清洗**、**数据增强** 等技术，确保你的数据能训练出好模型。

---

## 1 为什么数据质量很重要？

### 痛点分析

**问题 1：垃圾数据训练垃圾模型**

```python
# ❌ 使用低质量数据
data = [
    {"instruction": "你好", "output": "你好"},  # 太简单
    {"instruction": "1+1", "output": "2"},  # 没意义
    {"instruction": "????", "output": "?????"},  # 噪声数据
]
# 训练出的模型：回答质量差，无法处理复杂问题
```

**问题 2：数据格式不统一**

```python
# ❌ 混用不同格式
data1 = [{"text": "你好"}, {"text": "谢谢"}]
data2 = [{"input": "你好", "output": "你好"}]
data3 = [{"instruction": "打招呼", "output": "你好"}]
# 训练时出错，无法统一处理
```

**问题 3：数据分布不均衡**

```python
# ❌ 某类数据过多
data = [
    {"category": "问候", "count": 10000},  # 太多
    {"category": "专业", "count": 100},  # 太少
]
# 模型偏向问候类，专业问题回答差
```

### 解决方案

高质量数据的特点：

- ✅ 格式统一
- ✅ 质量高
- ✅ 分布均衡
- ✅ 覆盖全面

---

## 2 数据格式详解

### 常用数据格式

**格式 1：Alpaca 格式（推荐）**

```json
{
  "instruction": "翻译这句话成英文",
  "input": "你好世界",
  "output": "Hello World"
}
```

**格式 2：ShareGPT 格式**

```json
{
  "conversations": [
    {"from": "human", "value": "你好"},
    {"from": "gpt", "value": "你好！有什么我可以帮助的吗？"}
  ]
}
```

**格式 3：文本格式**

```json
{
  "text": "### 指令：\n翻译这句话成英文\n\n### 输入：\n你好世界\n\n### 回答：\nHello World"
}
```

### 格式转换代码

```python
import json

# Alpaca 格式转文本格式
def alpaca_to_text(example):
    """
    将 Alpaca 格式转换为纯文本格式
    
    Args:
        example: {"instruction": "...", "input": "...", "output": "..."}
    
    Returns:
        纯文本字符串
    """
    # 构建提示模板
    text = f"### 指令：\n{example['instruction']}\n\n"
    
    # 添加输入（如果有）
    if example.get("input"):
        text += f"### 输入：\n{example['input']}\n\n"
    
    # 添加输出
    text += f"### 回答：\n{example['output']}"
    
    return text

# 使用示例
example = {
    "instruction": "翻译这句话成英文",
    "input": "你好世界",
    "output": "Hello World"
}

text = alpaca_to_text(example)
print(text)
# 输出：
# ### 指令：
# 翻译这句话成英文
# 
# ### 输入：
# 你好世界
# 
# ### 回答：
# Hello World
```

---

## 3 数据收集方法

### 方法 1：使用公开数据集

```python
from datasets import load_dataset

# 加载公开数据集
dataset = load_dataset("tatsu-lab/alpaca")
print(f"数据量: {len(dataset['train'])}")  # 52,004

# 查看示例
print(dataset["train"][0])
# {'instruction': 'Give three tips for staying healthy.', 
#  'input': '', 
#  'output': '1. Eat a balanced diet...'}
```

**常用公开数据集**

| 数据集 | 数据量 | 用途 |
|--------|--------|------|
| Alpaca | 52K | 指令跟随 |
| Dolly | 15K | 指令跟随 |
| OpenAssistant | 161K | 对话 |
| FLAN | 1.8M | 多任务 |
| Belle | 1M+ | 中文指令 |

### 方法 2：使用 GPT 生成数据

```python
from openai import OpenAI

client = OpenAI()

def generate_data(instruction, num_samples=10):
    """
    使用 GPT 生成训练数据
    
    Args:
        instruction: 任务指令
        num_samples: 生成数量
    """
    prompt = f"""
请根据以下指令生成 {num_samples} 个训练样本。

指令：{instruction}

格式：
{{"instruction": "指令", "input": "输入", "output": "输出"}}

请生成多样化的样本：
"""
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    
    return response.choices[0].message.content

# 使用示例
data = generate_data("翻译中英文句子", num_samples=5)
print(data)
```

### 方法 3：人工标注

```python
# 人工标注模板
annotation_template = {
    "instruction": "问题或指令",
    "input": "可选的输入",
    "output": "期望的回答",
    "metadata": {
        "annotator": "标注员 ID",
        "quality": "high/medium/low",
        "category": "分类标签"
    }
}

# 标注指南
guidelines = """
1. 指令要清晰明确
2. 回答要准确、有帮助
3. 避免有害内容
4. 保持多样性
5. 每个样本检查 3 遍
"""
```

---

## 4 数据清洗技术

### 技术 1：去除重复数据

```python
def remove_duplicates(data):
    """
    去除重复数据
    
    Args:
        data: 数据列表
    
    Returns:
        去重后的数据
    """
    seen = set()
    unique_data = []
    
    for item in data:
        # 使用 instruction + input + output 作为唯一标识
        key = (item["instruction"], item.get("input", ""), item["output"])
        
        if key not in seen:
            seen.add(key)
            unique_data.append(item)
    
    return unique_data

# 使用示例
data = [
    {"instruction": "你好", "input": "", "output": "你好！"},
    {"instruction": "你好", "input": "", "output": "你好！"},  # 重复
    {"instruction": "谢谢", "input": "", "output": "不客气！"},
]

cleaned = remove_duplicates(data)
print(f"原始: {len(data)}, 清洗后: {len(cleaned)}")  # 3 -> 2
```

### 技术 2：过滤低质量数据

```python
def filter_by_quality(data, min_length=10, max_length=2000):
    """
    过滤低质量数据
    
    Args:
        data: 数据列表
        min_length: 最小长度
        max_length: 最大长度
    """
    filtered = []
    
    for item in data:
        text = item["instruction"] + item.get("input", "") + item["output"]
        
        # 长度过滤
        if len(text) < min_length or len(text) > max_length:
            continue
        
        # 质量检查
        if "???" in text or "TODO" in text:
            continue
        
        # 语言检查（简单示例）
        if not any('\u4e00' <= c <= '\u9fff' for c in text):
            continue  # 跳过非中文
        
        filtered.append(item)
    
    return filtered

# 使用示例
data = [
    {"instruction": "你好", "input": "", "output": "你好！"},  # 太短
    {"instruction": "请解释量子力学", "input": "", "output": "量子力学是..."},  # OK
    {"instruction": "????", "input": "", "output": "?????"},  # 噪声
]

cleaned = filter_by_quality(data, min_length=20)
print(f"过滤后: {len(cleaned)} 条")  # 1
```

### 技术 3：数据去噪

```python
import re

def clean_text(text):
    """
    清洗文本
    
    Args:
        text: 原始文本
    
    Returns:
        清洗后的文本
    """
    # 去除多余空格
    text = re.sub(r'\s+', ' ', text)
    
    # 去除特殊字符（保留中文、英文、数字、标点）
    text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9，。！？、；：""''（）]', '', text)
    
    # 统一标点
    text = text.replace(',', '，').replace('.', '。')
    
    return text.strip()

# 使用示例
dirty_text = "你好  ！！！  世界  \n\n 测试。。。"
clean_text = clean_text(dirty_text)
print(clean_text)  # "你好！！！ 世界 测试。。。"
```

---

## 5 数据增强技术

### 技术 1：回译增强

```python
from transformers import pipeline

# 加载中英文翻译模型
en2zh = pipeline("translation", model="Helsinki-NLP/opus-mt-en-zh")
zh2en = pipeline("translation", model="Helsinki-NLP/opus-mt-zh-en")

def back_translation(text, num_augments=3):
    """
    回译增强：中文 -> 英文 -> 中文
    
    Args:
        text: 原始中文文本
        num_augments: 增强数量
    """
    augmented = []
    
    for _ in range(num_augments):
        # 中文 -> 英文
        en = zh2en(text)[0]["translation_text"]
        
        # 英文 -> 中文
        zh = en2zh(en)[0]["translation_text"]
        
        if zh != text:
            augmented.append(zh)
    
    return augmented

# 使用示例
original = "今天天气很好"
augmented = back_translation(original, num_augments=3)
print(augmented)
# ['今天天气不错', '今日天气晴朗', '今天气候很好']
```

### 技术 2：同义词替换

```python
import random

# 同义词词典
synonyms = {
    "好": ["优秀", "出色", "棒", "佳"],
    "大": ["巨大", "庞大", "宏大"],
    "小": ["微小", "细小", "渺小"],
    "高兴": ["开心", "快乐", "愉快"],
}

def synonym_replacement(text, n=2):
    """
    同义词替换
    
    Args:
        text: 原始文本
        n: 替换次数
    """
    words = list(text)
    replacements = 0
    
    for i, word in enumerate(words):
        if replacements >= n:
            break
        
        if word in synonyms:
            words[i] = random.choice(synonyms[word])
            replacements += 1
    
    return "".join(words)

# 使用示例
original = "今天心情很好"
augmented = synonym_replacement(original, n=1)
print(augmented)  # "今天心情很快乐"
```

### 技术 3：随机插入/删除

```python
def random_deletion(text, p=0.1):
    """
    随机删除词
    
    Args:
        text: 原始文本
        p: 删除概率
    """
    words = list(text)
    kept = [w for w in words if random.random() > p]
    return "".join(kept) if kept else text

def random_insertion(text, n=1):
    """
    随机插入词
    """
    # 简单示例：插入标点
    punctuations = ["，", "。", "！", "？"]
    words = list(text)
    
    for _ in range(n):
        pos = random.randint(0, len(words))
        words.insert(pos, random.choice(punctuations))
    
    return "".join(words)
```

---

## 6 数据集划分

### 划分策略

```python
from sklearn.model_selection import train_test_split

def split_dataset(data, train_ratio=0.9, val_ratio=0.05, test_ratio=0.05):
    """
    划分数据集
    
    Args:
        data: 数据列表
        train_ratio: 训练集比例
        val_ratio: 验证集比例
        test_ratio: 测试集比例
    """
    # 第一次划分：训练集 + 临时集
    train, temp = train_test_split(data, train_size=train_ratio, random_state=42)
    
    # 第二次划分：验证集 + 测试集
    val_ratio_adjusted = val_ratio / (val_ratio + test_ratio)
    val, test = train_test_split(temp, train_size=val_ratio_adjusted, random_state=42)
    
    return {"train": train, "validation": val, "test": test}

# 使用示例
data = [{"instruction": f"问题{i}", "output": f"回答{i}"} for i in range(1000)]
splits = split_dataset(data)

print(f"训练集: {len(splits['train'])}")  # 900
print(f"验证集: {len(splits['validation'])}")  # 50
print(f"测试集: {len(splits['test'])}")  # 50
```

---

## 7 数据质量评估

### 评估指标

```python
def evaluate_data_quality(data):
    """
    评估数据质量
    
    Args:
        data: 数据列表
    
    Returns:
        质量报告
    """
    report = {
        "total_samples": len(data),
        "avg_length": 0,
        "unique_instructions": 0,
        "categories": {},
    }
    
    lengths = []
    instructions = set()
    
    for item in data:
        # 长度统计
        text = item["instruction"] + item.get("input", "") + item["output"]
        lengths.append(len(text))
        
        # 指令多样性
        instructions.add(item["instruction"])
        
        # 分类统计（如果有）
        if "category" in item:
            cat = item["category"]
            report["categories"][cat] = report["categories"].get(cat, 0) + 1
    
    report["avg_length"] = sum(lengths) / len(lengths)
    report["unique_instructions"] = len(instructions)
    report["diversity_score"] = len(instructions) / len(data)
    
    return report

# 使用示例
data = [
    {"instruction": "翻译", "input": "你好", "output": "Hello"},
    {"instruction": "翻译", "input": "谢谢", "output": "Thank you"},
    {"instruction": "计算", "input": "1+1", "output": "2"},
]

report = evaluate_data_quality(data)
print(report)
# {'total_samples': 3, 'avg_length': 20.0, 'unique_instructions': 2, ...}
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **数据格式** | Alpaca、ShareGPT、文本格式 |
| **数据收集** | 公开数据集、GPT 生成、人工标注 |
| **数据清洗** | 去重、过滤、去噪 |
| **数据增强** | 回译、同义词替换、随机操作 |
| **数据划分** | 训练集、验证集、测试集 |
| **质量评估** | 长度、多样性、分布均衡 |

---

## 9 新手常见误区

### 误区 1："数据越多越好"

**错！** 数据质量比数量更重要。

```python
# ❌ 10 万条低质量数据
# ✅ 1 万条高质量数据
```

### 误区 2："不需要验证集和测试集"

**大错特错！** 没有验证集和测试集无法评估模型。

- 验证集：调参时使用
- 测试集：最终评估时使用

### 误区 3："数据增强越多越好"

**不一定。** 过度增强会引入噪声。

建议：
- 原始数据：增强数据 = 1:3
- 检查增强数据质量
- 不要增强关键数据

---

## 10 动手练习

### 练习 1：数据格式转换

将 Alpaca 格式数据转换为 ShareGPT 格式。

<details>
<summary>点击查看答案</summary>

```python
def alpaca_to_sharegpt(example):
    """
    Alpaca 格式转 ShareGPT 格式
    """
    conversations = []
    
    # 构建人类输入
    human_input = example["instruction"]
    if example.get("input"):
        human_input += f"\n\n{example['input']}"
    
    conversations.append({"from": "human", "value": human_input})
    conversations.append({"from": "gpt", "value": example["output"]})
    
    return {"conversations": conversations}

# 使用示例
alpaca_example = {
    "instruction": "翻译这句话",
    "input": "你好",
    "output": "Hello"
}

sharegpt_example = alpaca_to_sharegpt(alpaca_example)
print(sharegpt_example)
```

</details>

### 练习 2：数据清洗管道

实现一个完整的数据清洗管道。

<details>
<summary>点击查看答案</summary>

```python
def data_cleaning_pipeline(data):
    """
    数据清洗管道
    """
    # 1. 去重
    data = remove_duplicates(data)
    
    # 2. 过滤低质量
    data = filter_by_quality(data)
    
    # 3. 文本清洗
    for item in data:
        item["instruction"] = clean_text(item["instruction"])
        item["output"] = clean_text(item["output"])
    
    # 4. 质量评估
    report = evaluate_data_quality(data)
    
    return data, report

# 使用示例
dirty_data = [...]
clean_data, report = data_cleaning_pipeline(dirty_data)
print(f"清洗完成，质量报告: {report}")
```

</details>

### 练习 3（挑战）：数据增强策略

设计一个针对中文对话数据的增强策略。

<details>
<summary>点击查看答案</summary>

```python
def chinese_dialog_augmentation(data):
    """
    中文对话数据增强
    """
    augmented = []
    
    for item in data:
        # 1. 回译增强
        back_translated = back_translation(item["output"], num_augments=2)
        for bt in back_translated:
            augmented.append({
                "instruction": item["instruction"],
                "input": item.get("input", ""),
                "output": bt
            })
        
        # 2. 同义词替换
        for _ in range(2):
            replaced = synonym_replacement(item["output"], n=2)
            augmented.append({
                "instruction": item["instruction"],
                "input": item.get("input", ""),
                "output": replaced
            })
        
        # 3. 保持原始数据
        augmented.append(item)
    
    return augmented
```

</details>

---

## 下一章预告

下一章我们会学习 **全参数微调实战**——也就是如何完整地微调一个大模型。你会学到训练流程、显存优化、训练技巧等实战经验。让我们开始动手训练吧！
