---
title: "第2章：语言学基础与文本预处理"
description: "分词、词性标注、停用词、词干提取、词形还原"
---

# 第2章：语言学基础与文本预处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 计算机是怎么理解一句话的？为什么要先"切词"？
- 中文分词和英文分词有什么区别？
- 什么是停用词？为什么要去掉它们？
- 词干提取和词形还原有什么不同？

这一章就是为了解答这些问题。我们会从最基础的 **分词** 开始，逐步学习文本预处理的完整流程。

---

## 1 为什么需要文本预处理？

### 痛点分析

想象一下：你给计算机一句话"我喜欢自然语言处理"，计算机能直接理解吗？

**不能！** 因为计算机看到的只是一串字符序列：`['我', '喜', '欢', '自', '然', '语', '言', '处', '理']`

这就像你收到一封没有空格的电报："我喜欢自然语言处理"——你得自己猜哪里是词语的边界。

### 解决方案

文本预处理就是 **把原始文本转换成计算机能理解的结构化数据**。

打个比方：

> 文本预处理就像做菜前的准备工作：洗菜、切菜、配料准备。没有这些准备，直接下锅炒，做出来的菜肯定不好吃。同样，没有预处理，直接把原始文本扔给模型，效果也会很差。

> **一句话总结**：文本预处理是 NLP 的"洗菜切菜"环节，决定了后续模型的效果。

---

## 2 核心原理

### 2.1 分词（Tokenization）

**分词** 是把连续的文本切分成有意义的词语单元。

#### 英文分词

英文天然有空格分隔，分词相对简单：

```python
# 英文分词示例
text = "I love natural language processing"

# 最简单的方法：按空格分割
words = text.split()
print(words)
# 输出：['I', 'love', 'natural', 'language', 'processing']
```

#### 中文分词

中文没有空格，分词要复杂得多：

```python
# 中文分词示例
text = "我喜欢自然语言处理"

# 使用 jieba 分词
import jieba
words = jieba.lcut(text)
print(words)
# 输出：['我', '喜欢', '自然语言处理']
```

#### 分词算法对比

| 算法 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **基于词典** | 匹配词典中的词语 | 速度快、实现简单 | 无法处理新词 |
| **基于统计** | 用 HMM、CRF 等模型 | 能处理新词 | 需要训练数据 |
| **混合方法** | 词典 + 统计 | 综合优点 | 实现复杂 |

### 2.2 词性标注（POS Tagging）

**词性标注** 是给每个词标注词性（名词、动词、形容词等）。

```python
# 词性标注示例
import jieba.posseg as pseg

text = "我喜欢自然语言处理"
words = pseg.cut(text)

for word, flag in words:
    print(f"{word}: {flag}")
# 输出：
# 我: r (代词)
# 喜欢: v (动词)
# 自然语言处理: n (名词)
```

### 2.3 停用词（Stop Words）

**停用词** 是在文本中频繁出现但信息量很小的词，如"的"、"是"、"在"等。

```python
# 停用词过滤示例
text = "自然语言处理是人工智能的重要方向"
words = jieba.lcut(text)

# 定义停用词表
stop_words = {'是', '的', '了', '在', '和', '与', '或'}

# 过滤停用词
filtered = [w for w in words if w not in stop_words]
print(filtered)
# 输出：['自然语言处理', '人工智能', '重要', '方向']
```

### 2.4 词干提取与词形还原

**词干提取（Stemming）** 和 **词形还原（Lemmatization）** 都是把词变回原形，但方法不同。

| 方法 | 原理 | 示例 | 特点 |
| --- | --- | --- | --- |
| **词干提取** | 去掉词缀（粗暴裁剪） | running → runn | 简单快速，但可能不是真词 |
| **词形还原** | 查词典还原原形 | running → run | 准确，但需要词典 |

```python
# 词干提取示例
from nltk.stem import PorterStemmer
stemmer = PorterStemmer()

words = ['running', 'jumps', 'easily']
stems = [stemmer.stem(w) for w in words]
print(stems)
# 输出：['run', 'jump', 'easili']  # 注意：easily 变成了 easili

# 词形还原示例
from nltk.stem import WordNetLemmatizer
lemmatizer = WordNetLemmatizer()

words = ['running', 'jumps', 'easily']
lemmas = [lemmatizer.lemmatize(w) for w in words]
print(lemmas)
# 输出：['running', 'jump', 'easily']  # 更准确
```

---

## 3 完整文本预处理流程

### 3.1 英文文本预处理

```python
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import re

# 下载必要的数据包（首次运行需要）
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

def preprocess_english(text):
    """
    英文文本预处理完整流程
    
    参数：
        text: 原始英文文本
    
    返回：
        预处理后的词列表
    """
    # 步骤 1：转小写
    # 为什么？避免 "The" 和 "the" 被当成不同的词
    text = text.lower()
    
    # 步骤 2：去除特殊字符和数字
    # 只保留字母和空格
    text = re.sub(r'[^a-z\s]', '', text)
    
    # 步骤 3：分词
    # 使用 nltk 的 word_tokenize
    tokens = nltk.word_tokenize(text)
    
    # 步骤 4：去除停用词
    # 加载英文停用词表
    stop_words = set(stopwords.words('english'))
    tokens = [w for w in tokens if w not in stop_words]
    
    # 步骤 5：词形还原
    # 把词还原为原形
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(w) for w in tokens]
    
    return tokens

# 测试
text = "Natural Language Processing is an important field of Artificial Intelligence!"
result = preprocess_english(text)
print(f"原始文本：{text}")
print(f"预处理结果：{result}")
# 输出：['natural', 'language', 'processing', 'important', 'field', 'artificial', 'intelligence']
```

### 3.2 中文文本预处理

```python
import jieba
import re

def preprocess_chinese(text, custom_stop_words=None):
    """
    中文文本预处理完整流程
    
    参数：
        text: 原始中文文本
        custom_stop_words: 自定义停用词表（可选）
    
    返回：
        预处理后的词列表
    """
    # 步骤 1：去除特殊字符
    # 只保留中文、英文、数字
    text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9]', '', text)
    
    # 步骤 2：分词
    # 使用 jieba 精确模式
    words = jieba.lcut(text)
    
    # 步骤 3：定义停用词表
    # 基础停用词
    stop_words = {
        '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
        '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
        '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些',
        '什么', '怎么', '为什么', '如何', '怎样', '可以', '能', '吗', '呢', '吧'
    }
    
    # 合并自定义停用词
    if custom_stop_words:
        stop_words.update(custom_stop_words)
    
    # 步骤 4：过滤停用词和单字词
    # 单字词通常信息量太小
    filtered_words = [
        w for w in words 
        if w not in stop_words and len(w) > 1
    ]
    
    return filtered_words

# 测试
text = "自然语言处理（NLP）是人工智能的重要方向，它研究如何让计算机理解人类语言。"
result = preprocess_chinese(text)
print(f"原始文本：{text}")
print(f"预处理结果：{result}")
# 输出：['自然语言处理', 'nlp', '人工智能', '重要', '方向', '研究', '计算机', '理解', '人类', '语言']
```

---

## 4 进阶技巧

### 4.1 自定义词典

jieba 支持添加自定义词典，解决专业术语分词不准的问题：

```python
import jieba

# 添加自定义词
jieba.add_word('自然语言处理')
jieba.add_word('机器学习')
jieba.add_word('深度学习')

# 测试
text = "我在学习自然语言处理和机器学习"
words = jieba.lcut(text)
print(words)
# 输出：['我', '在', '学习', '自然语言处理', '和', '机器学习']
```

### 4.2 并行分词

对于大量文本，可以使用并行分词加速：

```python
import jieba

# 启用并行分词（使用多进程）
jieba.enable_parallel()

# 分词大量文本
texts = ["文本1", "文本2", "文本3", ...]
results = [jieba.lcut(t) for t in texts]

# 关闭并行
jieba.disable_parallel()
```

### 4.3 词性标注进阶

```python
import jieba.posseg as pseg

text = "张三在北京大学学习自然语言处理"
words = pseg.cut(text)

# 提取人名和地名
names = []
locations = []

for word, flag in words:
    if flag == 'nr':  # 人名
        names.append(word)
    elif flag == 'ns':  # 地名
        locations.append(word)

print(f"人名：{names}")
print(f"地名：{locations}")
# 输出：人名：['张三']，地名：['北京大学']
```

---

## 5 核心知识点总结

| 知识点 | 说明 | 常用工具 |
| --- | --- | --- |
| **分词** | 把文本切分成词语 | jieba、NLTK、spaCy |
| **词性标注** | 给词标注词性（名词、动词等） | jieba.posseg、NLTK |
| **停用词** | 去除高频但低信息量的词 | 自定义停用词表 |
| **词干提取** | 去掉词缀（粗暴裁剪） | NLTK PorterStemmer |
| **词形还原** | 查词典还原原形 | NLTK WordNetLemmatizer |
| **文本清洗** | 去除特殊字符、数字等 | 正则表达式 |

---

## 6 新手常见误区

### 误区 1："分词越细越好"

**错！** 分词粒度要根据任务需求决定。太细会丢失语义，太粗会引入噪声。例如："自然语言处理"可以分成"自然/语言/处理"，也可以保持为一个整体。

### 误区 2："停用词一定要去掉"

不是的。某些任务（如情感分析）中，停用词可能包含重要信息。例如："不"是停用词，但在"不好"中很关键。要根据具体任务决定是否去除停用词。

### 误区 3："中文分词不需要预处理"

**错！** 中文文本同样需要预处理：去除特殊字符、过滤停用词、统一繁简体等。没有预处理的中文文本，模型效果会很差。

### 误区 4："词干提取比词形还原好"

不是的。词干提取简单快速，但可能产生非词（如 easily → easili）。词形还原更准确，但需要词典支持。一般推荐用词形还原。

---

## 7 动手练习

### 练习 1：基础练习 - 中英文分词

**题目**：分别对以下中英文文本进行分词，并打印结果：
1. 中文："2024 年人工智能技术发展迅速"
2. 英文："Artificial Intelligence is transforming the world!"

<details>
<summary>点击查看答案</summary>

```python
import jieba
import nltk
from nltk.tokenize import word_tokenize

# 下载 nltk 数据包（首次运行需要）
nltk.download('punkt')

# 中文分词
chinese_text = "2024 年人工智能技术发展迅速"
chinese_words = jieba.lcut(chinese_text)
print(f"中文分词：{chinese_words}")

# 英文分词
english_text = "Artificial Intelligence is transforming the world!"
english_words = word_tokenize(english_text)
print(f"英文分词：{english_words}")
```

</details>

### 练习 2：进阶练习 - 完整预处理流程

**题目**：实现一个完整的中文文本预处理函数，要求：
1. 去除特殊字符和数字
2. 分词
3. 去除停用词
4. 过滤单字词
5. 测试文本："自然语言处理（NLP）是 2024 年最热门的技术之一！"

<details>
<summary>点击查看答案</summary>

```python
import jieba
import re

def chinese_preprocess(text):
    """中文文本预处理"""
    # 1. 去除特殊字符和数字
    text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z]', '', text)
    
    # 2. 分词
    words = jieba.lcut(text)
    
    # 3. 定义停用词
    stop_words = {'是', '的', '了', '在', '和', '与', '或', '就', '不', '都', '也', '很'}
    
    # 4. 过滤停用词和单字词
    filtered = [w for w in words if w not in stop_words and len(w) > 1]
    
    return filtered

# 测试
text = "自然语言处理（NLP）是 2024 年最热门的技术之一！"
result = chinese_preprocess(text)
print(f"预处理结果：{result}")
# 输出：['自然语言处理', 'nlp', '热门', '技术', '之一']
```

</details>

### 练习 3（挑战）：综合练习 - 词性标注与信息提取

**题目**：实现一个信息提取器，从文本中提取人名、地名、机构名：
1. 使用 jieba 进行词性标注
2. 根据词性标签提取实体
3. 测试文本："张三在北京大学学习，李四在清华大学工作"

<details>
<summary>点击查看答案</summary>

```python
import jieba.posseg as pseg

def extract_entities(text):
    """
    从文本中提取实体信息
    
    返回：
        包含人名、地名、机构名的字典
    """
    words = pseg.cut(text)
    
    entities = {
        '人名': [],
        '地名': [],
        '机构名': []
    }
    
    for word, flag in words:
        if flag == 'nr':  # 人名
            entities['人名'].append(word)
        elif flag == 'ns':  # 地名
            entities['地名'].append(word)
        elif flag == 'nt':  # 机构名
            entities['机构名'].append(word)
    
    return entities

# 测试
text = "张三在北京大学学习，李四在清华大学工作"
entities = extract_entities(text)
print(f"提取结果：{entities}")
# 输出：{'人名': ['张三', '李四'], '地名': [], '机构名': ['北京大学', '清华大学']}
```

</details>

---

## 下一章预告

下一章我们会学习 **文本表示方法**——也就是如何把文本转换成计算机能理解的数字向量。你会学到词袋模型、TF-IDF、N-gram 等经典方法。这些是理解现代 NLP 模型的基础。
