---
title: "第5章：语言模型基础"
description: "N-gram 语言模型、困惑度、平滑技术、概率语言建模"
---

# 第5章：语言模型基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 语言模型是什么？和上一章的词嵌入有什么区别？
- N-gram 语言模型是怎么工作的？
- 什么是困惑度？怎么评估语言模型的好坏？
- 为什么需要平滑技术？不平滑会怎样？

这一章就是为了解答这些问题。我们会从 **语言模型的基本概念** 开始，逐步学习 N-gram 模型、评估方法和平滑技术。

---

## 1 为什么需要语言模型？

### 痛点分析

想象一下：你正在用输入法打字，输入"我今天去"，输入法应该推荐"学校"还是"吃饭"？

**没有语言模型的世界**：
- 输入法无法预测下一个词
- 语音识别无法选择最合理的句子
- 机器翻译无法生成流畅的译文
- 文本生成无法产出连贯的内容

### 解决方案

语言模型（Language Model）就是 **给一段文本打分，分数越高表示这段文本越"像人话"**。

打个比方：

> 语言模型就像一个经验丰富的语文老师。你给他一句话"我今天去学校"，他觉得这很合理，打高分；你给他"学校今天去我"，他觉得这不通顺，打低分。语言模型就是学会判断什么样的句子是"好句子"。

> **一句话总结**：语言模型是 NLP 的"语感老师"，能判断句子是否通顺。

---

## 2 核心原理

### 2.1 语言模型的定义

**语言模型** 是计算一个句子出现的概率：

```
P(今天 我 去 学校) = P(今天) × P(我|今天) × P(去|今天 我) × P(学校|今天 我 去)
```

**核心任务**：给定前面的词，预测下一个词的概率。

```
P(w_n | w_1, w_2, ..., w_{n-1})
```

### 2.2 N-gram 语言模型

**问题**：直接计算条件概率很困难，因为需要统计所有可能的上下文组合。

**解决方案**：假设下一个词只和前 N-1 个词有关（马尔可夫假设）。

```
P(w_n | w_1, ..., w_{n-1}) ≈ P(w_n | w_{n-N+1}, ..., w_{n-1})
```

**常见的 N-gram**：

| N | 名称 | 假设 | 示例 |
| --- | --- | --- | --- |
| 1 | Unigram | 每个词独立 | P(我) × P(去) × P(学校) |
| 2 | Bigram | 只看前 1 个词 | P(我|今天) × P(去|我) |
| 3 | Trigram | 只看前 2 个词 | P(去|今天 我) × P(学校|我 去) |

### 2.3 训练 N-gram 模型

**训练过程**：统计语料中 N-gram 的频率。

```python
from collections import defaultdict, Counter

class NgramLM:
    """N-gram 语言模型"""
    
    def __init__(self, n=2):
        self.n = n
        self.ngram_counts = defaultdict(Counter)
        self.context_counts = Counter()
    
    def train(self, sentences):
        """
        训练模型
        
        参数：
            sentences: 分词后的句子列表
        """
        for sent in sentences:
            # 添加句子开始和结束标记
            sent = ['<s>'] + sent + ['</s>']
            
            # 统计 N-gram
            for i in range(len(sent) - self.n + 1):
                ngram = tuple(sent[i:i+self.n])
                context = ngram[:-1]
                word = ngram[-1]
                
                self.ngram_counts[context][word] += 1
                self.context_counts[context] += 1
    
    def probability(self, word, context):
        """
        计算 P(word | context)
        
        参数：
            word: 目标词
            context: 上下文（元组）
        
        返回：
            条件概率
        """
        context = tuple(context)
        count = self.ngram_counts[context][word]
        total = self.context_counts[context]
        
        if total == 0:
            return 0
        return count / total
    
    def sentence_probability(self, sentence):
        """
        计算句子的概率
        
        参数：
            sentence: 分词后的句子
        
        返回：
            句子概率
        """
        sentence = ['<s>'] + sentence + ['</s>']
        prob = 1.0
        
        for i in range(len(sentence) - self.n + 1):
            context = tuple(sentence[i:i+self.n-1])
            word = sentence[i+self.n-1]
            prob *= self.probability(word, context)
        
        return prob

# 测试
sentences = [
    ['我', '喜欢', '猫'],
    ['他', '喜欢', '狗'],
    ['我', '喜欢', '狗']
]

# 训练 Bigram 模型
lm = NgramLM(n=2)
lm.train(sentences)

# 计算概率
print(f"P(猫|喜欢) = {lm.probability('猫', ('喜欢',)):.4f}")
print(f"P(狗|喜欢) = {lm.probability('狗', ('喜欢',)):.4f}")

# 计算句子概率
sent1 = ['我', '喜欢', '猫']
sent2 = ['猫', '喜欢', '我']
print(f"P('我喜欢猫') = {lm.sentence_probability(sent1):.6f}")
print(f"P('猫喜欢我') = {lm.sentence_probability(sent2):.6f}")
```

### 2.4 困惑度（Perplexity）

**困惑度** 是评估语言模型的标准指标：

```
Perplexity = P(测试集)^{-1/N}
```

**含义**：模型对下一个词的平均"困惑程度"。困惑度越低，模型越好。

**直观理解**：
- 困惑度 = 100，表示模型在预测下一个词时，平均在 100 个候选词中犹豫
- 困惑度 = 10，表示模型很确定，只在 10 个候选词中选择

```python
import math

def perplexity(lm, test_sentences):
    """
    计算困惑度
    
    参数：
        lm: 训练好的语言模型
        test_sentences: 测试句子列表
    
    返回：
        困惑度
    """
    log_prob = 0
    word_count = 0
    
    for sent in test_sentences:
        sent = ['<s>'] + sent + ['</s>']
        
        for i in range(1, len(sent)):
            context = tuple(sent[max(0, i-lm.n+1):i])
            word = sent[i]
            prob = lm.probability(word, context)
            
            # 避免 log(0)
            if prob > 0:
                log_prob += math.log(prob)
            word_count += 1
    
    # 计算困惑度
    avg_log_prob = log_prob / word_count
    ppl = math.exp(-avg_log_prob)
    
    return ppl

# 测试
test_sentences = [
    ['我', '喜欢', '猫'],
    ['他', '喜欢', '狗']
]

ppl = perplexity(lm, test_sentences)
print(f"困惑度：{ppl:.2f}")
```

### 2.5 平滑技术

**问题**：如果测试集中出现了训练集没见过的 N-gram，概率为 0，导致整个句子概率为 0。

**解决方案**：平滑技术（Smoothing）。

#### 拉普拉斯平滑（Add-1 Smoothing）

```
P(w|context) = (count(context, w) + 1) / (count(context) + V)
```

其中 V 是词汇表大小。

```python
class SmoothedNgramLM(NgramLM):
    """带拉普拉斯平滑的 N-gram 模型"""
    
    def __init__(self, n=2, vocab_size=1000):
        super().__init__(n)
        self.vocab_size = vocab_size
    
    def probability(self, word, context):
        """带平滑的概率计算"""
        context = tuple(context)
        count = self.ngram_counts[context][word]
        total = self.context_counts[context]
        
        # 拉普拉斯平滑
        return (count + 1) / (total + self.vocab_size)
```

#### Kneser-Ney 平滑

更高级的平滑方法，考虑了词的"多样性"：

```python
# Kneser-Ney 平滑比较复杂，这里只给出概念
# 实际使用中推荐用 nltk 或 kenlm 库

import nltk
from nltk.lm import KneserNeyInterpolated
from nltk.lm.preprocessing import padded_everygram_pipeline

# 准备数据
sentences = [['我', '喜欢', '猫'], ['他', '喜欢', '狗']]
train, vocab = padded_everygram_pipeline(2, sentences)

# 训练模型
lm = KneserNeyInterpolated(2, vocab)
lm.fit(train)

# 计算概率
prob = lm.score('猫', ['喜欢'])
print(f"P(猫|喜欢) = {prob:.4f}")
```

---

## 3 对比分析

| 方法 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **Unigram** | 词独立 | 简单 | 无法捕捉上下文 |
| **Bigram** | 看前 1 个词 | 简单、快速 | 上下文太短 |
| **Trigram** | 看前 2 个词 | 上下文更长 | 数据稀疏 |
| **平滑技术** | 处理零概率 | 解决 OOV | 可能过平滑 |

---

## 4 基础用法

### 4.1 使用 NLTK 训练语言模型

```python
import nltk
from nltk.lm import MLE, Laplace
from nltk.lm.preprocessing import padded_everygram_pipeline
from nltk.tokenize import word_tokenize
from nltk.util import ngrams

# 下载数据包
nltk.download('punkt')

# 准备训练数据
sentences = [
    "I love natural language processing",
    "Machine learning is a subset of AI",
    "Deep learning is a type of machine learning"
]

# 分词
tokenized = [word_tokenize(sent.lower()) for sent in sentences]

# 准备训练数据（添加填充符）
n = 2
train, vocab = padded_everygram_pipeline(n, tokenized)

# 训练 MLE 模型
mle_lm = MLE(n)
mle_lm.fit(train, vocab)

# 训练拉普拉斯平滑模型
train, vocab = padded_everygram_pipeline(n, tokenized)
laplace_lm = Laplace(n)
laplace_lm.fit(train, vocab)

# 预测下一个词
context = ['machine', 'learning']
next_word = mle_lm.generate(1, text_seed=context)
print(f"上下文 {context}，下一个词：{next_word}")

# 计算句子概率
sentence = ['machine', 'learning', 'is', 'great']
score = mle_lm.perplexity(sentence)
print(f"困惑度：{score:.2f}")
```

### 4.2 文本生成

```python
def generate_text(lm, seed, max_length=10):
    """
    使用语言模型生成文本
    
    参数：
        lm: 训练好的模型
        seed: 起始词
        max_length: 最大生成长度
    
    返回：
        生成的文本
    """
    text = list(seed)
    
    for _ in range(max_length):
        context = tuple(text[-(lm.order-1):])
        next_word = lm.generate(1, text_seed=context)
        
        if next_word == '</s>':
            break
        
        text.append(next_word)
    
    return ' '.join(text)

# 测试
seed = ['machine']
generated = generate_text(mle_lm, seed, max_length=5)
print(f"生成文本：{generated}")
```

---

## 5 进阶用法

### 5.1 中文语言模型

```python
import jieba
from collections import defaultdict, Counter

class ChineseBigramLM:
    """中文 Bigram 语言模型"""
    
    def __init__(self):
        self.bigram_counts = defaultdict(Counter)
        self.context_counts = Counter()
        self.vocab = set()
    
    def train(self, texts):
        """训练模型"""
        for text in texts:
            words = jieba.lcut(text)
            self.vocab.update(words)
            
            # 添加开始和结束标记
            words = ['<s>'] + words + ['</s>']
            
            # 统计 bigram
            for i in range(len(words) - 1):
                context = words[i]
                word = words[i+1]
                self.bigram_counts[context][word] += 1
                self.context_counts[context] += 1
    
    def generate(self, start_word, max_length=10):
        """生成文本"""
        text = [start_word]
        
        for _ in range(max_length):
            context = text[-1]
            candidates = self.bigram_counts[context]
            
            if not candidates:
                break
            
            # 按概率选择下一个词
            total = sum(candidates.values())
            probs = {w: c/total for w, c in candidates.items()}
            
            # 采样
            next_word = self._sample(probs)
            
            if next_word == '</s>':
                break
            
            text.append(next_word)
        
        return ''.join(text)
    
    def _sample(self, probs):
        """按概率采样"""
        import random
        r = random.random()
        cumsum = 0
        for word, prob in probs.items():
            cumsum += prob
            if r < cumsum:
                return word
        return list(probs.keys())[-1]

# 测试
texts = [
    "自然语言处理是人工智能的重要方向",
    "机器学习是人工智能的核心技术",
    "深度学习是机器学习的一个分支"
]

lm = ChineseBigramLM()
lm.train(texts)

# 生成文本
generated = lm.generate('自然', max_length=10)
print(f"生成文本：{generated}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **语言模型** | 计算句子概率的模型 |
| **N-gram** | 假设下一个词只与前 N-1 个词有关 |
| **困惑度** | 评估语言模型的指标，越低越好 |
| **平滑技术** | 处理零概率问题（拉普拉斯、Kneser-Ney） |
| **文本生成** | 基于语言模型生成新文本 |

---

## 7 新手常见误区

### 误区 1："N 越大，模型越好"

**错！** N 越大，数据稀疏问题越严重。实际中 Bigram 或 Trigram 就够了。要捕捉更长距离的依赖，要用 RNN 或 Transformer。

### 误区 2："困惑度低，模型就一定好"

不一定。困惑度只衡量模型对测试集的拟合程度，不能反映生成文本的质量。还要结合人工评估和其他指标。

### 误区 3："语言模型只能生成文本"

**错！** 语言模型是很多 NLP 任务的基础：语音识别、机器翻译、拼写纠错、输入法等都需要语言模型。

---

## 8 动手练习

### 练习 1：基础练习 - 训练 Bigram 模型

**题目**：实现一个 Bigram 语言模型，训练以下语料，并计算"我喜欢猫"的概率：
- "我喜欢猫"
- "他喜欢狗"
- "我喜欢狗"

<details>
<summary>点击查看答案</summary>

```python
from collections import defaultdict, Counter
import math

class BigramLM:
    def __init__(self):
        self.bigram_counts = defaultdict(Counter)
        self.context_counts = Counter()
    
    def train(self, sentences):
        for sent in sentences:
            sent = ['<s>'] + sent + ['</s>']
            for i in range(len(sent) - 1):
                context = sent[i]
                word = sent[i+1]
                self.bigram_counts[context][word] += 1
                self.context_counts[context] += 1
    
    def probability(self, word, context):
        return self.bigram_counts[context][word] / self.context_counts[context]
    
    def sentence_probability(self, sentence):
        sentence = ['<s>'] + sentence + ['</s>']
        prob = 1.0
        for i in range(len(sentence) - 1):
            prob *= self.probability(sentence[i+1], sentence[i])
        return prob

# 训练
sentences = [
    ['我', '喜欢', '猫'],
    ['他', '喜欢', '狗'],
    ['我', '喜欢', '狗']
]

lm = BigramLM()
lm.train(sentences)

# 计算概率
prob = lm.sentence_probability(['我', '喜欢', '猫'])
print(f"P('我喜欢猫') = {prob:.6f}")
```

</details>

### 练习 2：进阶练习 - 困惑度计算

**题目**：实现困惑度计算函数，评估上面训练的 Bigram 模型。

<details>
<summary>点击查看答案</summary>

```python
def perplexity(lm, test_sentences):
    log_prob = 0
    word_count = 0
    
    for sent in test_sentences:
        sent = ['<s>'] + sent + ['</s>']
        for i in range(1, len(sent)):
            prob = lm.probability(sent[i], sent[i-1])
            if prob > 0:
                log_prob += math.log(prob)
            word_count += 1
    
    avg_log_prob = log_prob / word_count
    return math.exp(-avg_log_prob)

# 测试
test_sentences = [
    ['我', '喜欢', '猫'],
    ['他', '喜欢', '狗']
]

ppl = perplexity(lm, test_sentences)
print(f"困惑度：{ppl:.2f}")
```

</details>

### 练习 3（挑战）：综合练习 - 文本生成器

**题目**：实现一个基于 Bigram 的文本生成器，从给定起始词开始生成文本。

<details>
<summary>点击查看答案</summary>

```python
import random

def generate_text(lm, start_word, max_length=10):
    text = [start_word]
    
    for _ in range(max_length):
        context = text[-1]
        candidates = lm.bigram_counts[context]
        
        if not candidates:
            break
        
        # 按概率采样
        total = sum(candidates.values())
        probs = {w: c/total for w, c in candidates.items()}
        
        r = random.random()
        cumsum = 0
        for word, prob in probs.items():
            cumsum += prob
            if r < cumsum:
                next_word = word
                break
        
        if next_word == '</s>':
            break
        
        text.append(next_word)
    
    return ''.join(text)

# 测试
generated = generate_text(lm, '我', max_length=5)
print(f"生成文本：{generated}")
```

</details>

---

## 下一章预告

下一章我们会学习 **序列模型 RNN 与 LSTM**——也就是如何处理序列数据。你会学到 RNN 的结构、梯度消失问题、LSTM 和 GRU 的改进。这些是理解现代 NLP 模型的基础。
