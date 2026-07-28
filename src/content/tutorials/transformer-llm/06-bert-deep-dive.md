---
title: "第6章：BERT 模型深度解析"
description: "BERT 架构、MLM/NSP 预训练任务、微调应用、BERT 变体（RoBERTa、ALBERT、DistilBERT）"
---

# 第6章：BERT 模型深度解析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- BERT 的架构和 GPT 有什么不同？
- 什么是 MLM 和 NSP？它们是怎么训练的？
- BERT 可以用于哪些任务？
- RoBERTa、ALBERT、DistilBERT 有什么区别？
- 怎么选择合适的 BERT 变体？

这一章就是为了解答这些问题。我们会深入学习 **BERT 的架构设计**、预训练任务、微调应用，以及各种变体模型。

---

## 1 为什么需要 BERT？

### 痛点分析

**GPT 的问题**：
- ❌ 单向理解（只能从左到右）
- ❌ 无法同时看到左右上下文

**例子**：
> 句子："苹果发布了新产品"
> - "苹果"可能是水果，也可能是公司
> - GPT 只能看到前面的词，无法利用后面的"发布"来判断
> - BERT 可以同时看到前后文，理解更准确

### 解决方案

**BERT（Bidirectional Encoder Representations from Transformers）**：
- ✅ 双向理解（同时看到左右上下文）
- ✅ Encoder-only 架构
- ✅ 适合理解类任务

打个比方：

> GPT 就像读书只能从左到右；BERT 就像可以同时看到整页书，理解更全面。

> **一句话总结**：BERT 通过双向理解和预训练-微调范式，成为 NLP 理解任务的基石。

---

## 2 核心原理

### 2.1 BERT 架构

**BERT 基于 Transformer 的编码器**：

| 模型 | 层数 | 隐藏层维度 | 头数 | 参数量 |
| --- | --- | --- | --- | --- |
| BERT-Base | 12 | 768 | 12 | 1.1 亿 |
| BERT-Large | 24 | 1024 | 16 | 3.4 亿 |

**输入表示**：

```
输入 = 词嵌入 + 位置编码 + 段嵌入

[CLS] 我 爱 学 习 [SEP] 这 个 课 程 很 好 [SEP]
  ↓     ↓  ↓  ↓  ↓   ↓     ↓  ↓  ↓  ↓  ↓  ↓   ↓
词嵌入 + 位置编码 + 段嵌入（A/B）
```

- **[CLS]**：分类 token，用于分类任务
- **[SEP]**：分隔 token，区分不同句子
- **段嵌入**：区分句子 A 和句子 B

### 2.2 预训练任务

#### MLM（Masked Language Model）

**核心思想**：随机遮盖 15% 的词，预测被遮盖的词。

```
原始句子：我 爱 深度 学习
遮盖后：  我 [MASK] 深度 [MASK]
目标：    我 爱 深度 学习
```

**遮盖策略**：
- 80% 替换为 [MASK]
- 10% 替换为随机词
- 10% 保持不变

**为什么这样设计？**
- 如果总是替换为 [MASK]，模型会过拟合 [MASK]
- 随机替换和保持不变增加难度

#### NSP（Next Sentence Prediction）

**核心思想**：判断两个句子是否连续。

```
正例：[CLS] 我 爱 学 习 [SEP] 深度 学习 很 有趣 [SEP]
标签：IsNext

负例：[CLS] 我 爱 学 习 [SEP] 今天 天气 很好 [SEP]
标签：NotNext
```

**作用**：帮助模型理解句子间的关系，对问答、NLI 等任务有帮助。

### 2.3 微调应用

BERT 可以用于多种任务：

| 任务 | 输入 | 输出 | 说明 |
| --- | --- | --- | --- |
| **文本分类** | [CLS] + 句子 | [CLS] 的表示 | 情感分析、主题分类 |
| **句子对分类** | [CLS] + 句子A + [SEP] + 句子B | [CLS] 的表示 | NLI、相似度 |
| **NER** | 每个 token | 每个 token 的标签 | 命名实体识别 |
| **问答** | 问题 + 上下文 | 答案的起始/结束位置 | 抽取式问答 |

---

## 3 基础用法

### 3.1 使用 BERT 进行文本分类

```python
from transformers import BertForSequenceClassification, BertTokenizer
import torch

# 加载模型和 tokenizer
model_name = "bert-base-uncased"
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(model_name, num_labels=2)

# 准备输入
text = "这部电影非常好看"
inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)

# 前向传播
with torch.no_grad():
    outputs = model(**inputs)

# 获取预测
logits = outputs.logits
predictions = torch.argmax(logits, dim=-1)
print(f"预测类别: {predictions.item()}")
```

### 3.2 使用 BERT 进行 NER

```python
from transformers import BertForTokenClassification, BertTokenizer
import torch

# 加载模型
model_name = "bert-base-uncased"
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForTokenClassification.from_pretrained(model_name, num_labels=9)

# 准备输入
text = "Barack Obama was born in Hawaii"
inputs = tokenizer(text, return_tensors="pt")

# 前向传播
with torch.no_grad():
    outputs = model(**inputs)

# 获取每个 token 的预测
logits = outputs.logits
predictions = torch.argmax(logits, dim=-1)

# 解码
tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
for token, pred in zip(tokens, predictions[0]):
    print(f"{token}: {pred.item()}")
```

---

## 4 进阶用法

### 4.1 BERT 变体对比

| 模型 | 参数量 | 速度 | 特点 |
| --- | --- | --- | --- |
| **BERT-Base** | 1.1 亿 | 基准 | 原始版本 |
| **RoBERTa** | 同 BERT | 同 BERT | 移除 NSP，更多数据，更好效果 |
| **ALBERT** | 减少 70% | 更快 | 参数共享，更高效 |
| **DistilBERT** | 6600 万 | 快 60% | 知识蒸馏，更轻量 |
| **Electra** | 同 BERT | 同 BERT | 替换 token 检测，更高效 |

### 4.2 使用 RoBERTa

```python
from transformers import RobertaForSequenceClassification, RobertaTokenizer

# 加载 RoBERTa
model_name = "roberta-base"
tokenizer = RobertaTokenizer.from_pretrained(model_name)
model = RobertaForSequenceClassification.from_pretrained(model_name, num_labels=2)

# 使用方式和 BERT 相同
text = "This movie is great"
inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
outputs = model(**inputs)
```

### 4.3 使用 DistilBERT

```python
from transformers import DistilBertForSequenceClassification, DistilBertTokenizer

# 加载 DistilBERT
model_name = "distilbert-base-uncased"
tokenizer = DistilBertTokenizer.from_pretrained(model_name)
model = DistilBertForSequenceClassification.from_pretrained(model_name, num_labels=2)

# 使用方式和 BERT 相同
text = "This movie is great"
inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
outputs = model(**inputs)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **BERT 架构** | Encoder-only，双向理解 |
| **MLM** | 掩码语言模型，预测被遮盖的词 |
| **NSP** | 下一句预测，判断句子是否连续 |
| **输入表示** | 词嵌入 + 位置编码 + 段嵌入 |
| **微调应用** | 文本分类、NER、问答等 |
| **RoBERTa** | 移除 NSP，更多数据，更好效果 |
| **DistilBERT** | 知识蒸馏，更轻量 |

---

## 6 新手常见误区

### 误区 1："BERT 可以用于生成任务"

**错！** BERT 是 Encoder-only 架构，不适合生成任务。

**为什么错**：
- BERT 设计用于理解任务
- 没有自回归生成能力

**正确做法**：
- 理解任务用 BERT
- 生成任务用 GPT

### 误区 2："BERT 越大效果越好"

**不完全对。** 大模型虽然效果好，但：
- 推理成本高
- 可能过拟合小数据集

**正确做法**：
- 根据任务和数据量选择合适的模型
- 小数据集用 DistilBERT
- 大数据集用 BERT-Large

### 误区 3："NSP 任务很重要"

**不完全对。** RoBERTa 的实验表明：
- 移除 NSP 效果反而更好
- NSP 任务可能不是最优设计

**正确做法**：
- 使用 RoBERTa 代替 BERT
- 关注 MLM 任务的质量

---

## 7 动手练习

### 练习 1：基础练习 - 使用 BERT 进行文本分类

**题目**：使用 BERT 进行情感分类。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertForSequenceClassification, BertTokenizer
import torch

model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=2)
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

text = "This movie is great"
inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)

with torch.no_grad():
    outputs = model(**inputs)

predictions = torch.argmax(outputs.logits, dim=-1)
print(f"预测: {predictions.item()}")
```

</details>

### 练习 2：进阶练习 - 对比 BERT 和 RoBERTa

**题目**：对比 BERT 和 RoBERTa 在相同输入上的输出。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertModel, RobertaModel, BertTokenizer, RobertaTokenizer
import torch

text = "This movie is great"

# BERT
bert_tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
bert_model = BertModel.from_pretrained("bert-base-uncased")
bert_inputs = bert_tokenizer(text, return_tensors="pt")
bert_outputs = bert_model(**bert_inputs)

# RoBERTa
roberta_tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
roberta_model = RobertaModel.from_pretrained("roberta-base")
roberta_inputs = roberta_tokenizer(text, return_tensors="pt")
roberta_outputs = roberta_model(**roberta_inputs)

print("BERT 输出形状:", bert_outputs.last_hidden_state.shape)
print("RoBERTa 输出形状:", roberta_outputs.last_hidden_state.shape)
```

</details>

### 练习 3（挑战）：综合练习 - 使用 DistilBERT 进行 NER

**题目**：使用 DistilBERT 进行命名实体识别。

<details>
<summary>点击查看答案</summary>

```python
from transformers import DistilBertForTokenClassification, DistilBertTokenizer
import torch

model = DistilBertForTokenClassification.from_pretrained("distilbert-base-uncased", num_labels=9)
tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")

text = "Barack Obama was born in Hawaii"
inputs = tokenizer(text, return_tensors="pt")

with torch.no_grad():
    outputs = model(**inputs)

predictions = torch.argmax(outputs.logits, dim=-1)
tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])

for token, pred in zip(tokens, predictions[0]):
    print(f"{token}: {pred.item()}")
```

</details>

---

## 下一章预告

下一章我们会学习 **GPT 系列模型演进**——从 GPT-1 到 GPT-4 的发展历程。你会学到自回归生成、Decoder-only 架构、Scaling Law、涌现能力等关键知识。这些是理解大语言模型发展的基础。
