---
title: "第9章：BERT 模型深度解析"
description: "预训练任务 MLM/NSP、微调策略、BERT 变体、下游应用"
---

# 第9章：BERT 模型深度解析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- BERT 是什么？为什么它被称为 NLP 的里程碑？
- BERT 的预训练任务 MLM 和 NSP 是什么？
- 什么是微调？为什么 BERT 能用于各种下游任务？
- BERT 有哪些变体？RoBERTa、ALBERT、DistilBERT 有什么区别？

这一章就是为了解答这些问题。我们会从 **BERT 的核心创新** 开始，逐步学习预训练、微调、变体等内容。

---

## 1 为什么需要 BERT？

### 痛点分析

上一章我们学了 Transformer，但它需要从头训练，而且需要大量标注数据。

**问题**：
- 标注数据昂贵：每个任务都需要人工标注
- 模型无法复用：每个任务都要重新训练
- 小数据集效果差：数据少时容易过拟合

**例子**：
> 你想做一个情感分析系统，需要标注几万条评论。换个任务（如文本分类），又要重新标注。每个任务都要从头训练，太浪费了。

### 解决方案

**BERT（Bidirectional Encoder Representations from Transformers）** 是 2018 年 Google 提出的预训练语言模型。

**核心创新**：
- **预训练 + 微调**：先在大规模无标注数据上预训练，再在具体任务上微调
- **双向上下文**：同时利用左右上下文信息
- **迁移学习**：一个模型可以用于多个下游任务

打个比方：

> BERT 就像一个博览群书的学者。他先读了海量的书籍（预训练），学会了语言的基本规律。然后你让他做具体任务（如情感分析），他只需要少量示例就能快速上手（微调）。不需要从零开始学习语言。

> **一句话总结**：BERT 开启了 NLP 的预训练时代，让模型能"举一反三"。

---

## 2 核心原理

### 2.1 BERT 的架构

**BERT 基于 Transformer 编码器**，有两种规模：

| 模型 | 层数 | 隐藏层维度 | 注意力头数 | 参数量 |
| --- | --- | --- | --- | --- |
| **BERT-Base** | 12 | 768 | 12 | 110M |
| **BERT-Large** | 24 | 1024 | 16 | 340M |

**输入表示**：

BERT 的输入由三部分组成：

```
[CLS] 我 喜欢 自然 语言 处理 [SEP] 它 很 有趣 [SEP]
  ↓     ↓   ↓    ↓    ↓    ↓     ↓    ↓  ↓   ↓    ↓
Token  Token Embedding  Position  Segment
Embed  +    +    Embedding  Embedding
```

| 嵌入 | 作用 | 示例 |
| --- | --- | --- |
| **Token Embedding** | 词的向量表示 | "我" → [0.1, 0.2, ...] |
| **Segment Embedding** | 区分句子 A 和 B | 句子 A → 0，句子 B → 1 |
| **Position Embedding** | 词的位置信息 | 第 1 个词 → 位置 0 |

**特殊标记**：

| 标记 | 作用 |
| --- | --- |
| `[CLS]` | 分类标记，用于分类任务 |
| `[SEP]` | 分隔标记，区分不同句子 |
| `[MASK]` | 掩码标记，用于 MLM 预训练 |
| `[PAD]` | 填充标记，对齐长度 |

### 2.2 预训练任务

BERT 使用两个预训练任务：

#### 任务 1：掩码语言模型（MLM）

**目标**：预测被掩码的词。

**过程**：
1. 随机选择 15% 的词
2. 其中 80% 替换为 `[MASK]`，10% 替换为随机词，10% 保持不变
3. 模型预测被替换的词

**例子**：
```
原始：我 喜欢 自然 语言 处理
掩码：我 [MASK] 自然 语言 处理
预测：我 喜欢 自然 语言 处理
```

**为什么用 15%？**
- 太少：训练信号不足
- 太多：模型难以理解上下文
- 15% 是经验值，效果最好

#### 任务 2：下一句预测（NSP）

**目标**：判断两个句子是否是连续的。

**过程**：
1. 50% 的概率选择连续句子（正样本）
2. 50% 的概率选择随机句子（负样本）
3. 模型预测是否是连续的

**例子**：
```
正样本：
句子 A：我去了图书馆
句子 B：我借了一本书
标签：IsNext（连续）

负样本：
句子 A：我去了图书馆
句子 B：今天天气很好
标签：NotNext（不连续）
```

**作用**：让模型理解句子间的关系，对问答、NLI 等任务有帮助。

### 2.3 微调（Fine-tuning）

**微调** 是把预训练模型适配到具体任务的过程。

**过程**：
1. 加载预训练的 BERT 模型
2. 在顶部添加任务特定的层（如分类头）
3. 用标注数据训练整个模型（或只训练顶部层）
4. 训练几个 epoch 即可

**下游任务示例**：

| 任务 | 输入 | 输出 | 应用 |
| --- | --- | --- | --- |
| **文本分类** | 单句 | [CLS] 输出 → 分类 | 情感分析、主题分类 |
| **句子对分类** | 两句 | [CLS] 输出 → 分类 | NLI、相似度 |
| **序列标注** | 单句 | 每个 token → 标签 | NER、词性标注 |
| **问答** | 问题+上下文 | 开始/结束位置 | 抽取式问答 |

### 2.4 BERT 的变体

BERT 发布后，涌现了很多改进版本：

| 模型 | 改进点 | 特点 |
| --- | --- | --- |
| **RoBERTa** | 移除 NSP，更多数据，更长训练 | 效果更好 |
| **ALBERT** | 参数共享，分解嵌入 | 参数更少 |
| **DistilBERT** | 知识蒸馏 | 速度快 60%，效果保留 97% |
| **Electra** | 替换 token 检测 | 训练更高效 |
| **Chinese-BERT** | 中文预训练 | 中文任务首选 |

---

## 3 对比分析

| 模型 | 预训练方式 | 双向性 | 适用任务 | 训练效率 |
| --- | --- | --- | --- | --- |
| **GPT** | 自回归（从左到右） | 单向（左） | 生成任务 | 高 |
| **BERT** | MLM + NSP | 双向 | 理解任务 | 中 |
| **T5** | Seq2Seq | 双向 | 所有任务 | 低 |
| **ELECTRA** | 替换检测 | 双向 | 理解任务 | 高 |

---

## 4 基础用法

### 4.1 使用 Hugging Face 加载 BERT

```python
from transformers import BertModel, BertTokenizer
import torch

# 加载分词器和模型
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

# 准备输入
text = "I love natural language processing"
inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)

print(f"输入 IDs：{inputs['input_ids']}")
print(f"注意力掩码：{inputs['attention_mask']}")

# 前向传播
with torch.no_grad():
    outputs = model(**inputs)

# 获取输出
last_hidden_states = outputs.last_hidden_state
pooler_output = outputs.pooler_output

print(f"隐藏状态形状：{last_hidden_states.shape}")  # (1, seq_len, 768)
print(f"Pooler 输出形状：{pooler_output.shape}")    # (1, 768)
```

### 4.2 使用 BERT 进行文本分类

```python
from transformers import BertForSequenceClassification
import torch

# 加载分类模型（2 分类）
model = BertForSequenceClassification.from_pretrained(
    'bert-base-uncased',
    num_labels=2
)

# 准备输入
text = "This movie is great!"
inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)

# 前向传播
outputs = model(**inputs)
logits = outputs.logits

print(f"Logits：{logits}")
print(f"预测类别：{torch.argmax(logits, dim=1).item()}")
```

### 4.3 微调 BERT

```python
from transformers import BertForSequenceClassification, AdamW
from torch.utils.data import Dataset, DataLoader
import torch

# 数据集
class SentimentDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'label': torch.tensor(label, dtype=torch.long)
        }

# 准备数据
texts = ["I love it", "I hate it", "This is great", "This is terrible"]
labels = [1, 0, 1, 0]

tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
dataset = SentimentDataset(texts, labels, tokenizer)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 加载模型
model = BertForSequenceClassification.from_pretrained(
    'bert-base-uncased',
    num_labels=2
)

# 优化器
optimizer = AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)

# 训练
num_epochs = 3
for epoch in range(num_epochs):
    total_loss = 0
    
    for batch in dataloader:
        optimizer.zero_grad()
        
        input_ids = batch['input_ids']
        attention_mask = batch['attention_mask']
        labels = batch['label']
        
        outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
        loss = outputs.loss
        
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")

# 保存模型
model.save_pretrained('./sentiment-bert')
tokenizer.save_pretrained('./sentiment-bert')
```

### 4.4 使用 BERT 进行序列标注（NER）

```python
from transformers import BertForTokenClassification
import torch

# 加载 NER 模型（9 个标签）
model = BertForTokenClassification.from_pretrained(
    'bert-base-uncased',
    num_labels=9
)

# 准备输入
text = "Barack Obama was born in Hawaii"
inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)

# 前向传播
outputs = model(**inputs)
logits = outputs.logits

# 预测标签
predictions = torch.argmax(logits, dim=2)
print(f"预测标签：{predictions[0].tolist()}")
```

### 4.5 使用 BERT 进行问答

```python
from transformers import BertForQuestionAnswering
import torch

# 加载问答模型
model = BertForQuestionAnswering.from_pretrained('bert-base-uncased')

# 准备输入
question = "Where was Barack Obama born?"
context = "Barack Obama was born in Hawaii on August 4, 1961."

inputs = tokenizer(question, context, return_tensors='pt', padding=True, truncation=True)

# 前向传播
outputs = model(**inputs)

# 获取答案位置
start_logits = outputs.start_logits
end_logits = outputs.end_logits

start_index = torch.argmax(start_logits, dim=1).item()
end_index = torch.argmax(end_logits, dim=1).item()

# 提取答案
input_ids = inputs['input_ids'][0]
answer = tokenizer.decode(input_ids[start_index:end_index+1])
print(f"答案：{answer}")
```

---

## 5 实战：中文情感分析

### 5.1 使用中文 BERT

```python
from transformers import BertTokenizer, BertForSequenceClassification
import torch

# 加载中文 BERT
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForSequenceClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=2
)

# 测试
texts = [
    "这部电影太好看了",
    "剧情很精彩",
    "这部电影太烂了",
    "剧情拖沓"
]
labels = [1, 1, 0, 0]  # 1=好评，0=差评

# 训练（简化示例）
from torch.optim import AdamW

optimizer = AdamW(model.parameters(), lr=2e-5)

for epoch in range(3):
    for text, label in zip(texts, labels):
        inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)
        labels_tensor = torch.tensor([label])
        
        outputs = model(**inputs, labels=labels_tensor)
        loss = outputs.loss
        
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()
    
    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")

# 测试
model.eval()
test_texts = ["这部电影真的很不错", "剧情太无聊了"]

with torch.no_grad():
    for text in test_texts:
        inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)
        outputs = model(**inputs)
        pred = torch.argmax(outputs.logits, dim=1).item()
        label = "好评" if pred == 1 else "差评"
        print(f"'{text}' -> {label}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **BERT** | 基于 Transformer 编码器的预训练模型 |
| **MLM** | 掩码语言模型，预测被掩码的词 |
| **NSP** | 下一句预测，判断句子是否连续 |
| **微调** | 在预训练基础上适配具体任务 |
| **变体** | RoBERTa、ALBERT、DistilBERT 等改进版本 |

---

## 7 新手常见误区

### 误区 1："BERT 只能用于英文"

**错！** BERT 有中文版本（bert-base-chinese），可以用于中文任务。还有多语言版本（bert-base-multilingual）。

### 误区 2："BERT 越大越好"

不一定。BERT-Large 效果好但慢，BERT-Base 效果稍差但快。实际应用中，DistilBERT 或 ALBERT 往往是更好的选择。

### 误区 3："微调 BERT 需要很多数据"

不是的。BERT 的强大之处在于少样本学习。即使只有几百个标注样本，微调后也能取得不错的效果。

### 误区 4："BERT 可以用于生成任务"

**错！** BERT 是编码器模型，只能理解文本，不能生成文本。生成任务要用 GPT 或 T5。

---

## 8 动手练习

### 练习 1：基础练习 - 加载 BERT 模型

**题目**：加载 BERT 模型和分词器，对"我喜欢自然语言处理"进行编码，打印隐藏状态形状。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertModel, BertTokenizer
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertModel.from_pretrained('bert-base-chinese')

text = "我喜欢自然语言处理"
inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)

with torch.no_grad():
    outputs = model(**inputs)

print(f"隐藏状态形状：{outputs.last_hidden_state.shape}")
# 输出：(1, 9, 768)
```

</details>

### 练习 2：进阶练习 - 微调 BERT 进行文本分类

**题目**：使用中文 BERT 微调一个情感分析模型，区分好评和差评。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertTokenizer, BertForSequenceClassification
from torch.optim import AdamW
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForSequenceClassification.from_pretrained('bert-base-chinese', num_labels=2)

texts = ["这部电影太好看了", "剧情很精彩", "这部电影太烂了", "剧情拖沓"]
labels = [1, 1, 0, 0]

optimizer = AdamW(model.parameters(), lr=2e-5)

for epoch in range(3):
    for text, label in zip(texts, labels):
        inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)
        labels_tensor = torch.tensor([label])
        
        outputs = model(**inputs, labels=labels_tensor)
        loss = outputs.loss
        
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

print("训练完成")
```

</details>

### 练习 3（挑战）：综合练习 - 使用 BERT 进行 NER

**题目**：使用 BERT 进行命名实体识别，识别人名、地名、机构名。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertTokenizer, BertForTokenClassification
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForTokenClassification.from_pretrained('bert-base-chinese', num_labels=9)

text = "张三在北京大学学习"
inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)

outputs = model(**inputs)
predictions = torch.argmax(outputs.logits, dim=2)

# 标签映射（示例）
label_map = {0: 'O', 1: 'B-PER', 2: 'I-PER', 3: 'B-LOC', 4: 'I-LOC', 
             5: 'B-ORG', 6: 'I-ORG', 7: '[CLS]', 8: '[SEP]'}

tokens = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
preds = predictions[0].tolist()

for token, pred in zip(tokens, preds):
    print(f"{token}: {label_map.get(pred, 'O')}")
```

</details>

---

## 下一章预告

下一章我们会学习 **GPT 系列与生成式模型**——也就是如何生成文本。你会学到 GPT 的演进、自回归生成、提示学习等概念。GPT 是 ChatGPT 的基础，是当前最热门的 NLP 技术。
