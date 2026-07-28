---
title: "第13章：机器翻译系统"
description: "统计机器翻译、神经机器翻译、BLEU 评估、翻译系统实战"
---

# 第13章：机器翻译系统

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 机器翻译是怎么工作的？
- 统计机器翻译和神经机器翻译有什么区别？
- 怎么评估翻译质量？BLEU 是什么？
- 如何构建一个完整的翻译系统？

这一章就是为了解答这些问题。我们会从 **机器翻译的发展历程** 开始，逐步学习统计方法、神经方法、评估指标和实战项目。

---

## 1 机器翻译概述

### 1.1 什么是机器翻译？

**机器翻译（Machine Translation，MT）** 是使用计算机将一种自然语言自动翻译成另一种自然语言。

**数学表达**：
```
f: 源语言文本 → 目标语言文本
f("I love you") → "我爱你"
```

### 1.2 发展历程

| 阶段 | 时间 | 方法 | 特点 |
| --- | --- | --- | --- |
| **规则时代** | 1950s-1990s | 基于规则 | 人工编写语法规则，覆盖率低 |
| **统计时代** | 1990s-2010s | 统计机器翻译（SMT） | 基于概率模型，需要大量平行语料 |
| **神经时代** | 2010s-至今 | 神经机器翻译（NMT） | 端到端学习，效果大幅提升 |
| **大模型时代** | 2020s-至今 | 大语言模型 | GPT、LLM 等，零样本翻译 |

### 1.3 应用场景

| 应用 | 说明 |
| --- | --- |
| **在线翻译** | Google 翻译、百度翻译、DeepL |
| **文档翻译** | 论文、书籍、法律文件翻译 |
| **实时翻译** | 语音翻译、摄像头翻译 |
| **跨语言搜索** | 搜索外文信息 |
| **内容本地化** | 软件界面、游戏文本翻译 |

---

## 2 统计机器翻译（SMT）

### 2.1 基本思想

**统计机器翻译** 基于概率模型，核心公式：

```
e* = argmax_e P(e|f) = argmax_e P(f|e) × P(e)

其中：
- f: 源语言句子
- e: 目标语言句子
- P(f|e): 翻译模型（translation model）
- P(e): 语言模型（language model）
```

**直观理解**：
- 翻译模型：给定目标语言句子 e，生成源语言句子 f 的概率
- 语言模型：目标语言句子 e 的流畅度

### 2.2 IBM 模型

IBM 提出了一系列从简单到复杂的翻译模型：

| 模型 | 特点 | 对齐方式 |
| --- | --- | --- |
| **IBM Model 1** | 最简单，词对齐独立 | 均匀分布 |
| **IBM Model 2** | 考虑位置信息 | 基于位置的对齐 |
| **IBM Model 3** | 考虑空词和繁殖 | 更复杂的对齐 |
| **IBM Model 4** | 考虑对齐的依赖性 | 相邻词对齐相关 |
| **IBM Model 5** | 最复杂，考虑缺陷 | 完整模型 |

### 2.3 短语-based SMT

**短语-based SMT** 是目前最常用的统计方法：

**流程**：
1. **分词**：对源语言和目标语言进行分词
2. **短语抽取**：从平行语料中抽取短语对
3. **短语翻译表**：统计每个短语对的翻译概率
4. **解码**：使用搜索算法找到最佳翻译

**示例**：
```
源语言：我 喜欢 猫
目标语言：I like cats

短语对：
- 我 → I (P=0.9)
- 喜欢 → like (P=0.8)
- 猫 → cats (P=0.85)
```

### 2.4 优缺点

**优点**：
- ✅ 可解释性强
- ✅ 不需要大量计算资源
- ✅ 可以集成语言学知识

**缺点**：
- ❌ 需要大量特征工程
- ❌ 各模块独立优化，无法全局优化
- ❌ 长距离依赖处理困难
- ❌ 效果不如神经方法

---

## 3 神经机器翻译（NMT）

### 3.1 基本架构

**神经机器翻译** 使用深度学习端到端学习翻译：

**架构**：编码器-解码器（Encoder-Decoder）

```
源语言句子 → 编码器 → 上下文向量 → 解码器 → 目标语言句子
```

**组件**：
- **编码器**：读取源语言句子，生成上下文表示
- **解码器**：根据上下文生成目标语言句子
- **注意力机制**：让解码器关注编码器的不同部分

### 3.2 编码器

**编码器** 通常使用 RNN、LSTM、GRU 或 Transformer：

```python
import torch
import torch.nn as nn

class Encoder(nn.Module):
    def __init__(self, vocab_size, embed_size, hidden_size, num_layers=1):
        super(Encoder, self).__init__()
        
        # 词嵌入层
        self.embedding = nn.Embedding(vocab_size, embed_size)
        
        # LSTM 层
        self.lstm = nn.LSTM(
            input_size=embed_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0
        )
    
    def forward(self, x):
        # x: (batch, seq_len)
        embedded = self.embedding(x)  # (batch, seq_len, embed_size)
        outputs, (hidden, cell) = self.lstm(embedded)
        
        # 返回所有隐藏状态（用于注意力）和最终隐藏状态
        return outputs, hidden, cell
```

### 3.3 解码器

**解码器** 逐步生成目标语言句子：

```python
class Decoder(nn.Module):
    def __init__(self, vocab_size, embed_size, hidden_size, num_layers=1):
        super(Decoder, self).__init__()
        
        self.embedding = nn.Embedding(vocab_size, embed_size)
        self.lstm = nn.LSTM(
            input_size=embed_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0
        )
        self.fc_out = nn.Linear(hidden_size, vocab_size)
    
    def forward(self, input, hidden, cell):
        # input: (batch, 1)
        embedded = self.embedding(input)  # (batch, 1, embed_size)
        output, (hidden, cell) = self.lstm(embedded, (hidden, cell))
        prediction = self.fc_out(output.squeeze(1))  # (batch, vocab_size)
        
        return prediction, hidden, cell
```

### 3.4 注意力机制

**注意力机制** 让解码器在生成每个词时，关注编码器的不同部分：

```python
class Attention(nn.Module):
    def __init__(self, hidden_size):
        super(Attention, self).__init__()
        self.attention = nn.Linear(hidden_size * 2, hidden_size)
        self.v = nn.Linear(hidden_size, 1, bias=False)
    
    def forward(self, hidden, encoder_outputs):
        # hidden: (batch, hidden_size)
        # encoder_outputs: (batch, src_len, hidden_size)
        
        batch_size = encoder_outputs.shape[0]
        src_len = encoder_outputs.shape[1]
        
        # 复制 hidden 到 src_len 次
        hidden = hidden.unsqueeze(1).repeat(1, src_len, 1)
        
        # 计算能量
        energy = torch.tanh(self.attention(torch.cat((hidden, encoder_outputs), dim=2)))
        attention = self.v(energy).squeeze(2)
        
        # softmax 得到权重
        return torch.softmax(attention, dim=1)
```

### 3.5 完整 NMT 模型

```python
class Seq2SeqAttention(nn.Module):
    def __init__(self, encoder, decoder, device):
        super(Seq2SeqAttention, self).__init__()
        
        self.encoder = encoder
        self.decoder = decoder
        self.device = device
    
    def forward(self, src, trg, teacher_forcing_ratio=0.5):
        # src: (batch, src_len)
        # trg: (batch, trg_len)
        
        batch_size = src.shape[0]
        trg_len = trg.shape[1]
        trg_vocab_size = self.decoder.fc_out.out_features
        
        # 存储解码器输出
        outputs = torch.zeros(batch_size, trg_len, trg_vocab_size).to(self.device)
        
        # 编码
        encoder_outputs, hidden, cell = self.encoder(src)
        
        # 第一个输入是 <sos>
        input = trg[:, 0]
        
        for t in range(1, trg_len):
            # 解码
            output, hidden, cell = self.decoder(input, hidden, cell)
            outputs[:, t] = output
            
            # Teacher forcing
            teacher_force = torch.rand(1).item() < teacher_forcing_ratio
            top1 = output.argmax(1)
            input = trg[:, t] if teacher_force else top1
        
        return outputs
```

### 3.6 训练过程

```python
import torch.optim as optim

# 超参数
SRC_VOCAB_SIZE = 10000
TRG_VOCAB_SIZE = 10000
EMBED_SIZE = 256
HIDDEN_SIZE = 512
NUM_LAYERS = 2
LEARNING_RATE = 0.001

# 创建模型
encoder = Encoder(SRC_VOCAB_SIZE, EMBED_SIZE, HIDDEN_SIZE, NUM_LAYERS)
decoder = Decoder(TRG_VOCAB_SIZE, EMBED_SIZE, HIDDEN_SIZE, NUM_LAYERS)
model = Seq2SeqAttention(encoder, decoder, device).to(device)

# 优化器
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

# 损失函数
criterion = nn.CrossEntropyLoss(ignore_index=PAD_IDX)

# 训练循环
num_epochs = 10
for epoch in range(num_epochs):
    total_loss = 0
    
    for src, trg in train_dataloader:
        src = src.to(device)
        trg = trg.to(device)
        
        optimizer.zero_grad()
        
        # 前向传播
        output = model(src, trg)
        
        # 计算损失
        output_dim = output.shape[-1]
        output = output[:, 1:].reshape(-1, output_dim)
        trg = trg[:, 1:].reshape(-1)
        
        loss = criterion(output, trg)
        
        # 反向传播
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    print(f"Epoch {epoch+1}, Loss: {total_loss/len(train_dataloader):.4f}")
```

---

## 4 基于 Transformer 的翻译

### 4.1 Transformer 翻译模型

**Transformer** 是目前最先进的翻译架构：

```python
from transformers import MarianMTModel, MarianTokenizer

# 加载预训练翻译模型
model_name = "Helsinki-NLP/opus-mt-en-zh"
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

# 翻译
text = "I love natural language processing"
inputs = tokenizer(text, return_tensors="pt", padding=True)

outputs = model.generate(**inputs)
translation = tokenizer.decode(outputs[0], skip_special_tokens=True)

print(f"原文：{text}")
print(f"翻译：{translation}")
```

### 4.2 微调 Transformer 翻译模型

```python
from transformers import MarianMTModel, MarianTokenizer
from torch.utils.data import Dataset, DataLoader
import torch

# 数据集
class TranslationDataset(Dataset):
    def __init__(self, src_texts, trg_texts, tokenizer, max_len=128):
        self.src_texts = src_texts
        self.trg_texts = trg_texts
        self.tokenizer = tokenizer
        self.max_len = max_len
    
    def __len__(self):
        return len(self.src_texts)
    
    def __getitem__(self, idx):
        src = self.src_texts[idx]
        trg = self.trg_texts[idx]
        
        src_encoding = self.tokenizer(
            src,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        trg_encoding = self.tokenizer(
            trg,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': src_encoding['input_ids'].flatten(),
            'attention_mask': src_encoding['attention_mask'].flatten(),
            'labels': trg_encoding['input_ids'].flatten()
        }

# 准备数据
src_texts = ["I love cats", "He likes dogs", "She loves birds"]
trg_texts = ["我喜欢猫", "他喜欢狗", "她喜欢鸟"]

# 加载模型和分词器
model_name = "Helsinki-NLP/opus-mt-en-zh"
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

# 创建数据集
dataset = TranslationDataset(src_texts, trg_texts, tokenizer, max_len=64)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 训练
from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

num_epochs = 10
for epoch in range(num_epochs):
    total_loss = 0
    
    for batch in dataloader:
        optimizer.zero_grad()
        
        outputs = model(
            input_ids=batch['input_ids'],
            attention_mask=batch['attention_mask'],
            labels=batch['labels']
        )
        
        loss = outputs.loss
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    print(f"Epoch {epoch+1}, Loss: {total_loss/len(dataloader):.4f}")

# 测试
model.eval()
test_text = "I love natural language processing"
inputs = tokenizer(test_text, return_tensors="pt", padding=True)

with torch.no_grad():
    outputs = model.generate(**inputs)
    translation = tokenizer.decode(outputs[0], skip_special_tokens=True)

print(f"原文：{test_text}")
print(f"翻译：{translation}")
```

---

## 5 评估指标

### 5.1 BLEU 分数

**BLEU（Bilingual Evaluation Understudy）** 是最常用的翻译评估指标。

**核心思想**：比较机器翻译和参考翻译的 n-gram 重叠度。

**公式**：
```
BLEU = BP × exp(Σ w_n × log p_n)

其中：
- BP: 简短惩罚（Brevity Penalty）
- w_n: n-gram 权重（通常 w_1=w_2=w_3=w_4=0.25）
- p_n: n-gram 精确度
```

**计算步骤**：
1. 提取机器翻译的 n-gram
2. 与参考翻译的 n-gram 比较
3. 计算精确度
4. 应用简短惩罚
5. 得到最终分数

**示例**：
```python
from nltk.translate.bleu_score import sentence_bleu

# 参考翻译
reference = [['我', '喜欢', '猫']]

# 机器翻译
candidate = ['我', '喜欢', '猫']

# 计算 BLEU
score = sentence_bleu(reference, candidate)
print(f"BLEU 分数：{score:.4f}")
```

### 5.2 BLEU 的优缺点

**优点**：
- ✅ 自动评估，不需要人工
- ✅ 计算快速
- ✅ 与人工评估有一定相关性

**缺点**：
- ❌ 只考虑 n-gram 重叠，不考虑语义
- ❌ 无法评估流畅度
- ❌ 对词序变化敏感
- ❌ 需要多个参考翻译

### 5.3 其他评估指标

| 指标 | 特点 | 适用场景 |
| --- | --- | --- |
| **METEOR** | 考虑同义词和词形变化 | 更全面的评估 |
| **TER** | 基于编辑距离 | 评估后编辑工作量 |
| **ROUGE** | 基于召回率 | 摘要评估 |
| **BERTScore** | 基于 BERT 的语义相似度 | 语义评估 |
| **人工评估** | 最准确，但成本高 | 最终评估 |

---

## 6 实战：构建翻译系统

### 6.1 完整翻译系统

```python
import torch
from transformers import MarianMTModel, MarianTokenizer

class TranslationSystem:
    def __init__(self, model_name="Helsinki-NLP/opus-mt-en-zh"):
        self.tokenizer = MarianTokenizer.from_pretrained(model_name)
        self.model = MarianMTModel.from_pretrained(model_name)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
    
    def translate(self, text, max_length=128, num_beams=5):
        """翻译单条文本"""
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=max_length
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                num_beams=num_beams,
                early_stopping=True
            )
        
        translation = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return translation
    
    def translate_batch(self, texts, batch_size=16, max_length=128, num_beams=5):
        """批量翻译"""
        translations = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            
            inputs = self.tokenizer(
                batch,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=max_length
            ).to(self.device)
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=max_length,
                    num_beams=num_beams,
                    early_stopping=True
                )
            
            batch_translations = self.tokenizer.batch_decode(
                outputs,
                skip_special_tokens=True
            )
            translations.extend(batch_translations)
        
        return translations

# 使用示例
system = TranslationSystem()

# 单条翻译
text = "I love natural language processing"
translation = system.translate(text)
print(f"原文：{text}")
print(f"翻译：{translation}")

# 批量翻译
texts = [
    "I love cats",
    "He likes dogs",
    "She loves birds"
]
translations = system.translate_batch(texts)
for src, trg in zip(texts, translations):
    print(f"{src} -> {trg}")
```

### 6.2 翻译质量优化

```python
class OptimizedTranslationSystem(TranslationSystem):
    def __init__(self, model_name="Helsinki-NLP/opus-mt-en-zh"):
        super().__init__(model_name)
    
    def translate_with_post_processing(self, text, max_length=128, num_beams=5):
        """带后处理的翻译"""
        # 基础翻译
        translation = self.translate(text, max_length, num_beams)
        
        # 后处理规则
        translation = self._post_process(translation)
        
        return translation
    
    def _post_process(self, text):
        """后处理规则"""
        # 去除多余空格
        text = ' '.join(text.split())
        
        # 修正标点
        text = text.replace(' ,', ',').replace(' .', '.')
        
        # 首字母大写（英文）
        if text and text[0].isalpha():
            text = text[0].upper() + text[1:]
        
        return text
    
    def translate_with_confidence(self, text, max_length=128):
        """带置信度的翻译"""
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=max_length
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                num_beams=5,
                return_dict_in_generate=True,
                output_scores=True
            )
        
        translation = self.tokenizer.decode(outputs.sequences[0], skip_special_tokens=True)
        
        # 计算置信度（简化版本）
        confidence = self._calculate_confidence(outputs.scores)
        
        return translation, confidence
    
    def _calculate_confidence(self, scores):
        """计算翻译置信度"""
        # 简化版本：取平均 softmax 概率
        total_conf = 0
        count = 0
        
        for score in scores:
            probs = torch.softmax(score, dim=-1)
            max_prob = probs.max().item()
            total_conf += max_prob
            count += 1
        
        return total_conf / count if count > 0 else 0

# 使用示例
optimized_system = OptimizedTranslationSystem()

text = "I love natural language processing"
translation = optimized_system.translate_with_post_processing(text)
print(f"翻译：{translation}")

translation, confidence = optimized_system.translate_with_confidence(text)
print(f"翻译：{translation}, 置信度：{confidence:.4f}")
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **机器翻译** | 自动将一种语言翻译成另一种 |
| **统计机器翻译** | 基于概率模型，需要特征工程 |
| **神经机器翻译** | 端到端学习，使用编码器-解码器架构 |
| **注意力机制** | 让解码器关注编码器的不同部分 |
| **Transformer** | 目前最先进的翻译架构 |
| **BLEU** | 基于 n-gram 重叠的评估指标 |

---

## 8 新手常见误区

### 误区 1："神经机器翻译不需要平行语料"

**错！** NMT 仍然需要大量平行语料进行训练。只是它不需要像 SMT 那样进行复杂的特征工程。

### 误区 2："BLEU 分数高，翻译质量就一定好"

不一定。BLEU 只考虑 n-gram 重叠，无法评估语义和流畅度。高 BLEU 分数的翻译可能仍然有语法错误或语义问题。

### 误区 3："Transformer 翻译模型不需要注意力机制"

**错！** Transformer 的核心就是自注意力机制。没有注意力，Transformer 就无法捕捉长距离依赖。

### 误区 4："预训练翻译模型可以直接用于所有领域"

不是的。预训练模型在通用领域效果好，但在特定领域（如医学、法律）可能需要微调才能达到最佳效果。

---

## 9 动手练习

### 练习 1：基础练习 - 使用预训练模型翻译

**题目**：使用 Helsinki-NLP 的预训练模型，将以下英文句子翻译成中文：
1. "I love natural language processing"
2. "Machine translation is fascinating"
3. "Transformer is the best architecture"

<details>
<summary>点击查看答案</summary>

```python
from transformers import MarianMTModel, MarianTokenizer

model_name = "Helsinki-NLP/opus-mt-en-zh"
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

texts = [
    "I love natural language processing",
    "Machine translation is fascinating",
    "Transformer is the best architecture"
]

for text in texts:
    inputs = tokenizer(text, return_tensors="pt", padding=True)
    outputs = model.generate(**inputs)
    translation = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"{text} -> {translation}")
```

</details>

### 练习 2：进阶练习 - 计算 BLEU 分数

**题目**：实现一个函数，计算机器翻译和参考翻译之间的 BLEU 分数。

<details>
<summary>点击查看答案</summary>

```python
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

def calculate_bleu(reference, candidate):
    """计算 BLEU 分数"""
    # 分词
    ref_tokens = [ref.split() for ref in reference]
    cand_tokens = candidate.split()
    
    # 使用平滑函数避免零分
    smooth = SmoothingFunction().method1
    
    # 计算 BLEU
    score = sentence_bleu(ref_tokens, cand_tokens, smoothing_function=smooth)
    
    return score

# 测试
reference = ["我 喜欢 猫", "我 很 喜欢 猫"]
candidate = "我 喜欢 猫"
score = calculate_bleu(reference, candidate)
print(f"BLEU 分数：{score:.4f}")
```

</details>

### 练习 3（挑战）：综合练习 - 构建完整翻译系统

**题目**：构建一个完整的翻译系统，包括：
1. 加载预训练模型
2. 支持单条和批量翻译
3. 添加后处理规则
4. 计算翻译置信度

<details>
<summary>点击查看答案</summary>

```python
import torch
from transformers import MarianMTModel, MarianTokenizer

class CompleteTranslationSystem:
    def __init__(self, model_name="Helsinki-NLP/opus-mt-en-zh"):
        self.tokenizer = MarianTokenizer.from_pretrained(model_name)
        self.model = MarianMTModel.from_pretrained(model_name)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
    
    def translate(self, text, max_length=128, num_beams=5):
        """单条翻译"""
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=max_length
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                num_beams=num_beams,
                early_stopping=True
            )
        
        translation = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return self._post_process(translation)
    
    def translate_batch(self, texts, batch_size=16):
        """批量翻译"""
        translations = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            
            inputs = self.tokenizer(
                batch,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=128
            ).to(self.device)
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=128,
                    num_beams=5,
                    early_stopping=True
                )
            
            batch_translations = self.tokenizer.batch_decode(
                outputs,
                skip_special_tokens=True
            )
            translations.extend([self._post_process(t) for t in batch_translations])
        
        return translations
    
    def _post_process(self, text):
        """后处理"""
        # 去除多余空格
        text = ' '.join(text.split())
        
        # 修正标点
        text = text.replace(' ,', ',').replace(' .', '.')
        
        return text
    
    def translate_with_confidence(self, text):
        """带置信度的翻译"""
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=128
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=128,
                num_beams=5,
                return_dict_in_generate=True,
                output_scores=True
            )
        
        translation = self.tokenizer.decode(outputs.sequences[0], skip_special_tokens=True)
        confidence = self._calculate_confidence(outputs.scores)
        
        return self._post_process(translation), confidence
    
    def _calculate_confidence(self, scores):
        """计算置信度"""
        total_conf = 0
        count = 0
        
        for score in scores:
            probs = torch.softmax(score, dim=-1)
            max_prob = probs.max().item()
            total_conf += max_prob
            count += 1
        
        return total_conf / count if count > 0 else 0

# 测试
system = CompleteTranslationSystem()

# 单条翻译
text = "I love natural language processing"
translation = system.translate(text)
print(f"翻译：{translation}")

# 带置信度翻译
translation, confidence = system.translate_with_confidence(text)
print(f"翻译：{translation}, 置信度：{confidence:.4f}")

# 批量翻译
texts = ["I love cats", "He likes dogs", "She loves birds"]
translations = system.translate_batch(texts)
for src, trg in zip(texts, translations):
    print(f"{src} -> {trg}")
```

</details>

---

## 下一章预告

下一章我们会学习 **问答系统与对话系统**——也就是如何构建智能问答和对话机器人。你会学到检索式问答、生成式问答、任务型对话、意图识别、槽位填充等技术。这是 NLP 最热门的应用之一。
