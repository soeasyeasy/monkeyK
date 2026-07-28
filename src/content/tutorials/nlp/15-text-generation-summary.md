---
title: "第15章：文本生成与摘要"
description: "文本摘要、关键词提取、文本生成、控制生成、GPT 应用"
---

# 第15章：文本生成与摘要

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 文本摘要有哪些方法？抽取式和生成式有什么区别？
- 如何自动提取关键词？
- 文本生成是怎么工作的？
- 如何控制生成的文本风格和内容？

这一章就是为了解答这些问题。我们会从 **文本摘要的基本方法** 开始，逐步学习关键词提取、文本生成、控制生成等技术。

---

## 1 文本摘要

### 1.1 什么是文本摘要？

**文本摘要（Text Summarization）** 是将长文本压缩成短文本，保留核心信息。

**数学表达**：
```
f: 长文本 → 短文本
f("一篇 1000 字的文章") → "100 字的摘要"
```

### 1.2 摘要类型

| 类型 | 特点 | 方法 |
| --- | --- | --- |
| **抽取式摘要** | 从原文中抽取重要句子 | 句子排序、图算法 |
| **生成式摘要** | 生成新的摘要文本 | Seq2Seq、Transformer |
| **混合式摘要** | 结合抽取和生成 | 先抽取后生成 |

### 1.3 抽取式摘要

#### 基于 TF-IDF 的方法

```python
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def extractive_summary_tfidf(text, num_sentences=3):
    """基于 TF-IDF 的抽取式摘要"""
    # 分句
    sentences = text.split('。')
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # 分词
    tokenized_sentences = [' '.join(jieba.lcut(s)) for s in sentences]
    
    # 计算 TF-IDF
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(tokenized_sentences)
    
    # 计算句子重要性（平均 TF-IDF 值）
    sentence_scores = tfidf_matrix.mean(axis=1).A1
    
    # 选择 Top-K 句子
    top_indices = sentence_scores.argsort()[-num_sentences:][::-1]
    top_indices = sorted(top_indices)  # 保持原文顺序
    
    # 生成摘要
    summary = '。'.join([sentences[i] for i in top_indices])
    
    return summary

# 测试
text = """
自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。
文本分类是 NLP 的基础任务之一。情感分析是文本分类的应用。
机器翻译是 NLP 的经典应用。近年来神经机器翻译效果大幅提升。
深度学习为 NLP 带来了革命性变化。BERT 和 GPT 是代表性模型。
"""

summary = extractive_summary_tfidf(text, num_sentences=3)
print(f"原文：{text}")
print(f"\n摘要：{summary}")
```

#### 基于 TextRank 的方法

```python
import jieba
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

def text_rank_summary(text, num_sentences=3, damping=0.85, iterations=100):
    """基于 TextRank 的抽取式摘要"""
    # 分句
    sentences = text.split('。')
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) <= num_sentences:
        return text
    
    # 分词
    tokenized_sentences = [' '.join(jieba.lcut(s)) for s in sentences]
    
    # 计算 TF-IDF
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(tokenized_sentences)
    
    # 计算相似度矩阵
    similarity_matrix = cosine_similarity(tfidf_matrix)
    
    # TextRank 迭代
    num_sentences_total = len(sentences)
    scores = np.ones(num_sentences_total) / num_sentences_total
    
    for _ in range(iterations):
        new_scores = np.zeros(num_sentences_total)
        for i in range(num_sentences_total):
            for j in range(num_sentences_total):
                if i != j:
                    new_scores[i] += similarity_matrix[i][j] * scores[j]
            new_scores[i] = (1 - damping) + damping * new_scores[i]
        
        # 归一化
        new_scores = new_scores / new_scores.sum()
        scores = new_scores
    
    # 选择 Top-K 句子
    top_indices = scores.argsort()[-num_sentences:][::-1]
    top_indices = sorted(top_indices)
    
    # 生成摘要
    summary = '。'.join([sentences[i] for i in top_indices])
    
    return summary

# 测试
text = """
自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。
文本分类是 NLP 的基础任务之一。情感分析是文本分类的应用。
机器翻译是 NLP 的经典应用。近年来神经机器翻译效果大幅提升。
深度学习为 NLP 带来了革命性变化。BERT 和 GPT 是代表性模型。
"""

summary = text_rank_summary(text, num_sentences=3)
print(f"摘要：{summary}")
```

### 1.4 生成式摘要

#### 使用 BART 模型

```python
from transformers import BertTokenizer, EncoderDecoderModel
import torch

# 使用中文摘要模型（这里用 BERT2BERT 作为示例）
# 实际应用中可以使用专门的中文摘要模型
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = EncoderDecoderModel.from_encoder_decoder_pretrained(
    'bert-base-chinese', 
    'bert-base-chinese'
)

def generate_summary(text, max_length=100):
    """生成式摘要"""
    inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=512)
    
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=max_length,
            num_beams=4,
            early_stopping=True
        )
    
    summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return summary

# 测试
text = """
自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。
文本分类是 NLP 的基础任务之一。情感分析是文本分类的应用。
机器翻译是 NLP 的经典应用。近年来神经机器翻译效果大幅提升。
深度学习为 NLP 带来了革命性变化。BERT 和 GPT 是代表性模型。
"""

summary = generate_summary(text)
print(f"摘要：{summary}")
```

#### 使用 GPT 生成摘要

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

def gpt_summarize(text, max_length=100):
    """使用 GPT 生成摘要"""
    prompt = f"请总结以下文本：\n\n{text}\n\n摘要："
    
    inputs = tokenizer(prompt, return_tensors='pt', padding=True, truncation=True, max_length=512)
    
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=max_length,
            num_beams=4,
            early_stopping=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # 提取摘要部分
    if "摘要：" in summary:
        summary = summary.split("摘要：")[-1].strip()
    
    return summary

# 测试
text = """
自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。
文本分类是 NLP 的基础任务之一。情感分析是文本分类的应用。
机器翻译是 NLP 的经典应用。近年来神经机器翻译效果大幅提升。
"""

summary = gpt_summarize(text)
print(f"摘要：{summary}")
```

---

## 2 关键词提取

### 2.1 基于 TF-IDF 的关键词提取

```python
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer
from collections import Counter

def extract_keywords_tfidf(text, top_k=10):
    """基于 TF-IDF 的关键词提取"""
    # 分词
    words = jieba.lcut(text)
    
    # 过滤停用词和单字词
    stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}
    filtered_words = [w for w in words if w not in stop_words and len(w) > 1]
    
    # 计算词频
    word_freq = Counter(filtered_words)
    
    # 获取 Top-K
    top_keywords = word_freq.most_common(top_k)
    
    return top_keywords

# 测试
text = """
自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。
文本分类是 NLP 的基础任务之一。情感分析是文本分类的应用。
机器翻译是 NLP 的经典应用。近年来神经机器翻译效果大幅提升。
"""

keywords = extract_keywords_tfidf(text, top_k=5)
print(f"关键词：{keywords}")
```

### 2.2 基于 TextRank 的关键词提取

```python
import jieba
import numpy as np
from collections import defaultdict

def text_rank_keywords(text, top_k=10, damping=0.85, iterations=100):
    """基于 TextRank 的关键词提取"""
    # 分词
    words = jieba.lcut(text)
    
    # 过滤停用词和单字词
    stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}
    filtered_words = [w for w in words if w not in stop_words and len(w) > 1]
    
    # 构建共现矩阵
    word_set = set(filtered_words)
    word_list = list(word_set)
    word_idx = {w: i for i, w in enumerate(word_list)}
    
    co_occurrence = np.zeros((len(word_list), len(word_list)))
    
    # 滑动窗口统计共现
    window_size = 5
    for i in range(len(filtered_words) - window_size + 1):
        window = filtered_words[i:i+window_size]
        for j in range(len(window)):
            for k in range(j+1, len(window)):
                idx1 = word_idx[window[j]]
                idx2 = word_idx[window[k]]
                co_occurrence[idx1][idx2] += 1
                co_occurrence[idx2][idx1] += 1
    
    # 归一化
    row_sums = co_occurrence.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    co_occurrence_norm = co_occurrence / row_sums
    
    # TextRank 迭代
    num_words = len(word_list)
    scores = np.ones(num_words) / num_words
    
    for _ in range(iterations):
        new_scores = (1 - damping) + damping * np.dot(co_occurrence_norm.T, scores)
        new_scores = new_scores / new_scores.sum()
        scores = new_scores
    
    # 获取 Top-K
    top_indices = scores.argsort()[-top_k:][::-1]
    top_keywords = [(word_list[i], scores[i]) for i in top_indices]
    
    return top_keywords

# 测试
text = """
自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。
文本分类是 NLP 的基础任务之一。情感分析是文本分类的应用。
机器翻译是 NLP 的经典应用。近年来神经机器翻译效果大幅提升。
"""

keywords = text_rank_keywords(text, top_k=5)
print(f"关键词：{keywords}")
```

### 2.3 使用 KeyBERT 提取关键词

```python
from keybert import KeyBERT
import jieba

# 加载 KeyBERT 模型
kw_model = KeyBERT('bert-base-chinese')

def extract_keywords_keybert(text, top_k=10):
    """使用 KeyBERT 提取关键词"""
    # 分词（KeyBERT 需要空格分隔）
    text_tokenized = ' '.join(jieba.lcut(text))
    
    # 提取关键词
    keywords = kw_model.extract_keywords(
        text_tokenized,
        keyphrase_ngram_range=(1, 1),
        stop_words='chinese',
        top_n=top_k
    )
    
    return keywords

# 测试
text = """
自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。
文本分类是 NLP 的基础任务之一。情感分析是文本分类的应用。
机器翻译是 NLP 的经典应用。近年来神经机器翻译效果大幅提升。
"""

keywords = extract_keywords_keybert(text, top_k=5)
print(f"关键词：{keywords}")
```

---

## 3 文本生成

### 3.1 基于语言模型的文本生成

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

def generate_text(prompt, max_length=100, temperature=0.7, top_k=50, top_p=0.95):
    """使用 GPT 生成文本"""
    inputs = tokenizer(prompt, return_tensors='pt')
    
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=max_length,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated

# 测试
prompt = "从前有一个"
generated = generate_text(prompt, max_length=50)
print(f"生成文本：{generated}")
```

### 3.2 控制生成

#### 条件生成

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

def conditional_generate(style, topic, max_length=100):
    """条件生成：控制风格和主题"""
    prompt = f"风格：{style}\n主题：{topic}\n\n内容："
    
    inputs = tokenizer(prompt, return_tensors='pt')
    
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=max_length,
            temperature=0.8,
            top_k=50,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # 提取内容部分
    if "内容：" in generated:
        generated = generated.split("内容：")[-1].strip()
    
    return generated

# 测试
style = "正式"
topic = "人工智能"
generated = conditional_generate(style, topic, max_length=50)
print(f"生成文本：{generated}")
```

#### 使用提示工程控制生成

```python
def controlled_generation_with_prompt(task, content, max_length=100):
    """使用提示工程控制生成"""
    prompts = {
        "翻译": f"将以下文本翻译成英文：\n{content}\n\n翻译：",
        "摘要": f"请总结以下文本：\n{content}\n\n摘要：",
        "续写": f"请续写以下故事：\n{content}\n\n续写：",
        "改写": f"请用更正式的语言改写以下文本：\n{content}\n\n改写："
    }
    
    prompt = prompts.get(task, content)
    
    inputs = tokenizer(prompt, return_tensors='pt')
    
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=max_length,
            temperature=0.7,
            top_k=50,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated

# 测试
task = "摘要"
content = "自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。"
generated = controlled_generation_with_prompt(task, content, max_length=50)
print(f"生成文本：{generated}")
```

---

## 4 评估指标

### 4.1 摘要评估指标

#### ROUGE 指标

```python
from rouge import Rouge

def evaluate_summary_rouge(reference, candidate):
    """使用 ROUGE 评估摘要质量"""
    rouge = Rouge()
    
    # 计算 ROUGE 分数
    scores = rouge.get_scores(candidate, reference)
    
    return scores[0]

# 测试
reference = "自然语言处理是人工智能的重要方向，研究如何让计算机理解人类语言。"
candidate = "自然语言处理是人工智能的重要方向。"

scores = evaluate_summary_rouge(reference, candidate)
print(f"ROUGE-1: {scores['rouge-1']['f']:.4f}")
print(f"ROUGE-2: {scores['rouge-2']['f']:.4f}")
print(f"ROUGE-L: {scores['rouge-l']['f']:.4f}")
```

### 4.2 生成文本评估

#### BLEU 指标

```python
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction

def evaluate_generation_bleu(reference, candidate):
    """使用 BLEU 评估生成文本质量"""
    # 分词
    ref_tokens = [ref.split() for ref in reference]
    cand_tokens = candidate.split()
    
    # 使用平滑函数
    smooth = SmoothingFunction().method1
    
    # 计算 BLEU
    score = sentence_bleu(ref_tokens, cand_tokens, smoothing_function=smooth)
    
    return score

# 测试
reference = ["自然语言处理 是 人工智能 的 重要 方向"]
candidate = "自然语言处理 是 人工智能 的 重要 方向"

score = evaluate_generation_bleu(reference, candidate)
print(f"BLEU 分数：{score:.4f}")
```

---

## 5 实战：构建文本摘要系统

### 5.1 完整摘要系统

```python
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

class TextSummarizationSystem:
    def __init__(self):
        self.tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
        self.model = GPT2LMHeadModel.from_pretrained('gpt2')
    
    def extractive_summary(self, text, num_sentences=3):
        """抽取式摘要"""
        # 分句
        sentences = text.split('。')
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) <= num_sentences:
            return text
        
        # 分词
        tokenized_sentences = [' '.join(jieba.lcut(s)) for s in sentences]
        
        # 计算 TF-IDF
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(tokenized_sentences)
        
        # 计算句子重要性
        sentence_scores = tfidf_matrix.mean(axis=1).A1
        
        # 选择 Top-K 句子
        top_indices = sentence_scores.argsort()[-num_sentences:][::-1]
        top_indices = sorted(top_indices)
        
        # 生成摘要
        summary = '。'.join([sentences[i] for i in top_indices])
        
        return summary
    
    def generative_summary(self, text, max_length=100):
        """生成式摘要"""
        prompt = f"请总结以下文本：\n\n{text}\n\n摘要："
        
        inputs = self.tokenizer(prompt, return_tensors='pt', padding=True, truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_length=max_length,
                num_beams=4,
                early_stopping=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        summary = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        if "摘要：" in summary:
            summary = summary.split("摘要：")[-1].strip()
        
        return summary
    
    def keyword_extraction(self, text, top_k=10):
        """关键词提取"""
        # 分词
        words = jieba.lcut(text)
        
        # 过滤停用词
        stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}
        filtered_words = [w for w in words if w not in stop_words and len(w) > 1]
        
        # 计算词频
        from collections import Counter
        word_freq = Counter(filtered_words)
        
        # 获取 Top-K
        top_keywords = word_freq.most_common(top_k)
        
        return top_keywords
    
    def summarize(self, text, method='extractive', num_sentences=3):
        """统一摘要接口"""
        if method == 'extractive':
            return self.extractive_summary(text, num_sentences)
        elif method == 'generative':
            return self.generative_summary(text)
        else:
            raise ValueError(f"Unknown method: {method}")

# 使用示例
system = TextSummarizationSystem()

text = """
自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。
文本分类是 NLP 的基础任务之一。情感分析是文本分类的应用。
机器翻译是 NLP 的经典应用。近年来神经机器翻译效果大幅提升。
深度学习为 NLP 带来了革命性变化。BERT 和 GPT 是代表性模型。
"""

# 抽取式摘要
extractive_summary = system.summarize(text, method='extractive', num_sentences=3)
print(f"抽取式摘要：{extractive_summary}\n")

# 生成式摘要
generative_summary = system.summarize(text, method='generative')
print(f"生成式摘要：{generative_summary}\n")

# 关键词提取
keywords = system.keyword_extraction(text, top_k=5)
print(f"关键词：{keywords}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **文本摘要** | 将长文本压缩成短文本 |
| **抽取式摘要** | 从原文中抽取重要句子 |
| **生成式摘要** | 生成新的摘要文本 |
| **关键词提取** | 自动提取文本中的关键词 |
| **TextRank** | 基于图的排序算法 |
| **ROUGE** | 摘要评估指标 |

---

## 7 新手常见误区

### 误区 1："生成式摘要一定比抽取式摘要好"

不一定。抽取式摘要保留原文信息，准确但可能不流畅；生成式摘要流畅但可能生成错误信息。要根据场景选择。

### 误区 2："关键词提取就是词频统计"

**错！** 简单的词频统计会忽略词的重要性。TF-IDF、TextRank、KeyBERT 等方法考虑了词的区分度，效果更好。

### 误区 3："ROUGE 分数高，摘要质量就一定好"

不一定。ROUGE 只考虑 n-gram 重叠，无法评估摘要的流畅性和信息完整性。还要结合人工评估。

---

## 8 动手练习

### 练习 1：基础练习 - 抽取式摘要

**题目**：实现一个基于 TF-IDF 的抽取式摘要系统。

<details>
<summary>点击查看答案</summary>

```python
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer

def extractive_summary(text, num_sentences=3):
    sentences = text.split('。')
    sentences = [s.strip() for s in sentences if s.strip()]
    
    tokenized = [' '.join(jieba.lcut(s)) for s in sentences]
    
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(tokenized)
    
    scores = tfidf_matrix.mean(axis=1).A1
    top_indices = scores.argsort()[-num_sentences:][::-1]
    top_indices = sorted(top_indices)
    
    return '。'.join([sentences[i] for i in top_indices])

text = "自然语言处理很重要。它研究计算机理解语言。文本分类是基础任务。"
print(extractive_summary(text, num_sentences=2))
```

</details>

### 练习 2：进阶练习 - 关键词提取

**题目**：实现一个基于 TextRank 的关键词提取系统。

<details>
<summary>点击查看答案</summary>

```python
import jieba
import numpy as np
from collections import Counter

def text_rank_keywords(text, top_k=5):
    words = jieba.lcut(text)
    stop_words = {'的', '了', '在', '是', '我', '有', '和'}
    filtered = [w for w in words if w not in stop_words and len(w) > 1]
    
    word_freq = Counter(filtered)
    return word_freq.most_common(top_k)

text = "自然语言处理是人工智能的重要方向。它研究如何让计算机理解人类语言。"
print(text_rank_keywords(text, top_k=3))
```

</details>

### 练习 3（挑战）：综合练习 - 完整摘要系统

**题目**：构建一个完整的文本摘要系统，支持抽取式和生成式摘要。

<details>
<summary>点击查看答案</summary>

```python
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

class SummarizationSystem:
    def __init__(self):
        self.tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
        self.model = GPT2LMHeadModel.from_pretrained('gpt2')
    
    def extractive(self, text, num_sentences=3):
        sentences = text.split('。')
        sentences = [s.strip() for s in sentences if s.strip()]
        
        tokenized = [' '.join(jieba.lcut(s)) for s in sentences]
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(tokenized)
        
        scores = tfidf_matrix.mean(axis=1).A1
        top_indices = scores.argsort()[-num_sentences:][::-1]
        top_indices = sorted(top_indices)
        
        return '。'.join([sentences[i] for i in top_indices])
    
    def generative(self, text, max_length=100):
        prompt = f"总结：{text}\n\n摘要："
        inputs = self.tokenizer(prompt, return_tensors='pt', padding=True, truncation=True)
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_length=max_length,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)

system = SummarizationSystem()
text = "自然语言处理很重要。它研究计算机理解语言。文本分类是基础任务。"
print(system.extractive(text, num_sentences=2))
```

</details>

---

## 下一章预告

下一章我们会学习 **大语言模型与前沿技术**——也就是当前最热门的 NLP 技术。你会学到 LLM 原理、Prompt Engineering、RAG、微调技术、AI Agent 等概念。这是 NLP 的最新发展方向。
