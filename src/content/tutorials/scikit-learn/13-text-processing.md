---
title: "第13章：文本数据处理"
description: "CountVectorizer、TF-IDF、文本分类、情感分析实战"
---

# 第13章：文本数据处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 机器学习模型能直接处理文本吗？
- 怎么把文字变成数字？
- CountVectorizer 和 TF-IDF 有什么区别？
- 怎么做文本分类和情感分析？

这一章会带你掌握文本数据处理的核心方法，学会让模型理解和分析文字内容。

---

## 1 为什么需要文本处理？

### 痛点分析

机器学习模型只能处理**数值**，不能直接理解文字：

- 模型无法理解"这部电影很好看"是正面评价
- 无法自动分类新闻是体育还是科技
- 无法检测邮件是否是垃圾邮件

这就像**让外国人看中文**——不认识字，就无法理解意思。

### 解决方案

文本处理就是**把文字变成数值向量**：

- **词袋模型（Bag of Words）**：统计词频
- **TF-IDF**：考虑词的重要性
- **词嵌入（Word Embedding）**：捕捉语义关系

> **一句话总结**：文本处理让模型能够"读懂"文字。

---

## 2 CountVectorizer（词袋模型）

### 原理

CountVectorizer 把文本变成**词频向量**：

1. 构建词汇表（所有出现过的词）
2. 统计每个词在文档中出现的次数

打个比方：

> 词袋模型就像**数单词**——把文章拆成单词，数每个词出现了几次，不管顺序。

### 代码示例

```python
from sklearn.feature_extraction.text import CountVectorizer

# 示例文本
corpus = [
    "我喜欢机器学习",
    "机器学习很有趣",
    "深度学习是机器学习的子集",
    "Python 是编程语言"
]

# 创建向量化器
vectorizer = CountVectorizer()

# 拟合并转换
X = vectorizer.fit_transform(corpus)

# 查看词汇表
print("词汇表:")
for word, idx in sorted(vectorizer.vocabulary_.items(), key=lambda x: x[1]):
    print(f"  {idx}: {word}")

# 查看词频矩阵
print(f"\n词频矩阵:\n{X.toarray()}")

# 查看特征名称
print(f"\n特征名称: {vectorizer.get_feature_names_out()}")
```

### 参数说明

```python
# 常用参数
vectorizer = CountVectorizer(
    max_df=0.95,        # 忽略在 95% 以上文档出现的词
    min_df=2,           # 忽略在少于 2 个文档出现的词
    max_features=1000,  # 最多保留 1000 个特征
    stop_words="english",  # 去除停用词
    ngram_range=(1, 2)  # 使用 unigram 和 bigram
)
```

---

## 3 TF-IDF

### 原理

TF-IDF（Term Frequency-Inverse Document Frequency）考虑**词的重要性**：

- **TF（词频）**：词在文档中出现的频率
- **IDF（逆文档频率）**：词的稀有程度，越稀有权重越高

$$TF-IDF = TF \times IDF$$

打个比方：

> TF-IDF 就像**划重点**——"的"、"是"这种词到处都有，不重要；"机器学习"只在特定文章出现，很重要。

### 代码示例

```python
from sklearn.feature_extraction.text import TfidfVectorizer

# 示例文本
corpus = [
    "机器学习是人工智能的子集",
    "深度学习是机器学习的子集",
    "Python 是编程语言",
    "机器学习很有趣"
]

# 创建 TF-IDF 向量化器
vectorizer = TfidfVectorizer()

# 拟合并转换
X = vectorizer.fit_transform(corpus)

# 查看结果
print("TF-IDF 矩阵:")
print(X.toarray())

print(f"\n特征名称: {vectorizer.get_feature_names_out()}")

# 查看每个词的 IDF 值
idf_values = vectorizer.idf_
feature_names = vectorizer.get_feature_names_out()

print("\n词的 IDF 值:")
for word, idf in zip(feature_names, idf_values):
    print(f"  {word}: {idf:.4f}")
```

### CountVectorizer vs TF-IDF

| 特性 | CountVectorizer | TF-IDF |
| --- | --- | --- |
| 原理 | 词频 | 词频 × 逆文档频率 |
| 考虑词的重要性 | 否 | 是 |
| 适用场景 | 简单文本分类 | 信息检索、文本挖掘 |
| 效果 | 基线 | 通常更好 |

---

## 4 文本分类实战

### 完整流程

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
import numpy as np

# 模拟新闻分类数据
texts = [
    "机器学习是人工智能的重要分支",
    "深度学习在图像识别中取得突破",
    "Python 是最流行的编程语言之一",
    "神经网络模拟人脑的工作方式",
    "自然语言处理让计算机理解人类语言",
    "足球比赛吸引了数百万观众",
    "篮球明星签约新球队",
    "奥运会即将在北京举行",
    "股市今天大幅上涨",
    "房价持续攀升引发关注",
    "央行调整利率政策",
    "科技公司发布新产品",
    "智能手机市场竞争激烈",
    "人工智能改变各行各业",
    "大数据时代已经到来"
]

labels = ["科技", "科技", "科技", "科技", "科技",
          "体育", "体育", "体育",
          "财经", "财经", "财经",
          "科技", "科技", "科技", "科技"]

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.3, random_state=42
)

# 创建管道
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB())
])

# 训练
pipeline.fit(X_train, y_train)

# 预测
y_pred = pipeline.predict(X_test)

# 评估
print("分类报告:")
print(classification_report(y_test, y_pred, zero_division=0))

# 交叉验证
cv_scores = cross_val_score(pipeline, texts, labels, cv=3)
print(f"\n交叉验证准确率: {cv_scores.mean():.2%}")

# 预测新文本
new_texts = [
    "人工智能正在改变世界",
    "今天的比赛非常精彩",
    "股票价格持续下跌"
]

predictions = pipeline.predict(new_texts)
for text, label in zip(new_texts, predictions):
    print(f"'{text}' -> {label}")
```

---

## 5 情感分析实战

### 完整流程

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# 模拟情感分析数据
reviews = [
    "这部电影太好看了，强烈推荐",
    "剧情很精彩，演员演技在线",
    "一般般，没什么特别的",
    "太糟糕了，浪费时间和金钱",
    "非常无聊，看不下去",
    "还不错，值得一看",
    "超级好看，感动哭了",
    "烂片，差评",
    "还可以，中规中矩",
    "太精彩了，百看不厌"
]

sentiments = ["正面", "正面", "中性", "负面", "负面",
              "正面", "正面", "负面", "中性", "正面"]

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    reviews, sentiments, test_size=0.3, random_state=42
)

# 创建管道
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", LogisticRegression(max_iter=1000))
])

# 训练
pipeline.fit(X_train, y_train)

# 预测
y_pred = pipeline.predict(X_test)

# 评估
print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")
print(f"\n分类报告:\n{classification_report(y_test, y_pred, zero_division=0)}")

# 预测新评论
new_reviews = [
    "这部电影真的很棒",
    "太差了，完全不推荐",
    "一般般，没什么感觉"
]

predictions = pipeline.predict(new_reviews)
for review, sentiment in zip(new_reviews, predictions):
    print(f"'{review}' -> {sentiment}")

# 查看特征重要性（哪些词影响情感判断）
tfidf = pipeline.named_steps["tfidf"]
classifier = pipeline.named_steps["classifier"]

feature_names = tfidf.get_feature_names_out()
coefficients = classifier.coef_[0]

# 最正面的词
top_positive = sorted(zip(feature_names, coefficients), key=lambda x: x[1], reverse=True)[:5]
print("\n最正面的词:")
for word, coef in top_positive:
    print(f"  {word}: {coef:.4f}")

# 最负面的词
top_negative = sorted(zip(feature_names, coefficients), key=lambda x: x[1])[:5]
print("\n最负面的词:")
for word, coef in top_negative:
    print(f"  {word}: {coef:.4f}")
```

---

## 6 中文文本处理

### 使用 jieba 分词

```python
# pip install jieba
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer

# 中文文本
texts = [
    "机器学习是人工智能的重要分支",
    "深度学习在图像识别中取得突破",
    "自然语言处理让计算机理解人类语言"
]

# 中文分词
def chinese_tokenizer(text):
    return list(jieba.cut(text))

# 使用自定义分词器
vectorizer = TfidfVectorizer(tokenizer=chinese_tokenizer)
X = vectorizer.fit_transform(texts)

print("分词结果:")
for text in texts:
    print(f"  {list(jieba.cut(text))}")

print(f"\nTF-IDF 矩阵:\n{X.toarray()}")
print(f"\n特征名称: {vectorizer.get_feature_names_out()}")
```

---

## 7 新手常见误区

### 误区 1："文本可以直接输入模型"

**错！** 模型只能处理数值，必须先把文本转成向量。

### 误区 2："CountVectorizer 比 TF-IDF 好"

不是的。TF-IDF 考虑了词的重要性，通常效果更好。

### 误区 3："不需要预处理文本"

**错！** 文本预处理（去停用词、分词、标准化）对结果影响很大。

### 误区 4："词袋模型能捕捉语义"

**错！** 词袋模型不考虑词序和语义。"我喜欢你"和"你喜欢我"在词袋模型中是一样的。

### 误区 5："中文和英文处理方式一样"

不是的。中文需要分词（如 jieba），英文按空格分割即可。

---

## 8 动手练习

### 练习 1：基础练习

用 CountVectorizer 对以下文本进行向量化，查看词汇表和词频矩阵。

```python
corpus = ["机器学习很有趣", "深度学习更有趣", "人工智能改变世界"]
```

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import CountVectorizer

corpus = ["机器学习很有趣", "深度学习更有趣", "人工智能改变世界"]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(corpus)

print("词汇表:")
for word, idx in sorted(vectorizer.vocabulary_.items(), key=lambda x: x[1]):
    print(f"  {idx}: {word}")

print(f"\n词频矩阵:\n{X.toarray()}")
print(f"\n特征名称: {vectorizer.get_feature_names_out()}")
```

</details>

### 练习 2：进阶练习

用 TF-IDF 和朴素贝叶斯构建一个简单的新闻分类器。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

# 训练数据
texts = [
    "机器学习是人工智能的分支",
    "深度学习在图像识别中应用广泛",
    "Python 是流行的编程语言",
    "足球比赛吸引了很多观众",
    "篮球明星表现精彩",
    "股市今天大涨"
]
labels = ["科技", "科技", "科技", "体育", "体育", "财经"]

# 创建管道
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB())
])

# 训练
pipeline.fit(texts, labels)

# 预测新文本
new_texts = ["人工智能发展迅速", "网球比赛精彩绝伦", "房价持续上涨"]
predictions = pipeline.predict(new_texts)

for text, label in zip(new_texts, predictions):
    print(f"'{text}' -> {label}")
```

</details>

### 练习 3（挑战）：综合练习

构建一个情感分析器，能够判断评论是正面、负面还是中性。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score

# 训练数据
reviews = [
    "太好看了，强烈推荐", "剧情精彩，演技在线", "一般般，没什么特别",
    "太糟糕了，浪费时间", "非常无聊", "还不错，值得一看",
    "超级好看", "烂片，差评", "还可以", "太精彩了"
]
sentiments = ["正面", "正面", "中性", "负面", "负面", "正面", "正面", "负面", "中性", "正面"]

# 创建管道
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", LogisticRegression(max_iter=1000))
])

# 训练
pipeline.fit(reviews, sentiments)

# 交叉验证
cv_scores = cross_val_score(pipeline, reviews, sentiments, cv=3)
print(f"交叉验证准确率: {cv_scores.mean():.2%}")

# 测试
test_reviews = ["这部电影真的很棒", "太差了", "一般般"]
predictions = pipeline.predict(test_reviews)

for review, sentiment in zip(test_reviews, predictions):
    print(f"'{review}' -> {sentiment}")
```

</details>

---

## 9 下一章预告

下一章我们会学习 **实战项目：房价预测系统**——一个完整的回归项目，从数据探索到模型部署。你会学到如何把所学知识应用到真实项目中。
