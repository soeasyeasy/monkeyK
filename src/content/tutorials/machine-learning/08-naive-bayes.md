---
title: "第8章：朴素贝叶斯"
description: "贝叶斯定理、先验与后验、高斯朴素贝叶斯、文本分类"
---

# 第8章：朴素贝叶斯

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是贝叶斯定理？
- 什么是先验概率和后验概率？
- "朴素"是什么意思？
- 朴素贝叶斯适合什么场景？

这一章就是为了解答这些问题。朴素贝叶斯简单高效，是文本分类的经典算法。

---

## 1 为什么需要朴素贝叶斯？

### 痛点分析

假设你要判断一封邮件是否为垃圾邮件。邮件包含词语："免费"、"中奖"、"点击"。

问题：如何根据这些词语判断邮件类别？

### 解决方案

朴素贝叶斯用概率来推理：

```python
# 贝叶斯定理
P(垃圾|词语) = P(词语|垃圾) * P(垃圾) / P(词语)

# P(垃圾): 先验概率（垃圾邮件的比例）
# P(词语|垃圾): 垃圾邮件中出现该词语的概率
# P(垃圾|词语): 后验概率（看到该词语后，是垃圾邮件的概率）

# 朴素假设：特征之间相互独立
# P(免费,中奖,点击|垃圾) = P(免费|垃圾) * P(中奖|垃圾) * P(点击|垃圾)
```

打个比方：

> 朴素贝叶斯像"医生诊断"：根据症状（特征）推断疾病（类别）。每个症状独立贡献诊断概率。

> **一句话总结**：朴素贝叶斯基于贝叶斯定理，假设特征独立，计算类别概率。

---

## 2 核心原理

### 贝叶斯定理

```python
# 贝叶斯定理
P(A|B) = P(B|A) * P(A) / P(B)

# P(A|B): 后验概率（在B发生的条件下，A发生的概率）
# P(A): 先验概率（A发生的概率）
# P(B|A): 似然（在A发生的条件下，B发生的概率）
# P(B): 证据（B发生的概率）
```

打个比方：

> 贝叶斯定理像"更新信念"：
> - 先验：下雨的概率是30%
> - 证据：看到乌云
> - 后验：下雨的概率更新为80%

### 朴素假设

"朴素"指假设特征之间相互独立：

```python
# 朴素假设
P(x1, x2, ..., xn | y) = P(x1|y) * P(x2|y) * ... * P(xn|y)

# 这个假设在现实中通常不成立
# 但实践中效果很好，计算简单
```

### 朴素贝叶斯分类器

```python
# 分类规则：选择概率最大的类别
y_pred = argmax_y P(y) * Π P(xi|y)

# 为避免下溢，通常取对数
log P(y) + Σ log P(xi|y)
```

---

## 3 基础用法

### 使用 sklearn 实现朴素贝叶斯

```python
from sklearn.naive_bayes import GaussianNB, MultinomialNB, BernoulliNB
from sklearn.datasets import load_iris, make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import numpy as np

# ========== 高斯朴素贝叶斯 ==========
# 适用于连续特征，假设特征服从正态分布

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 3. 创建模型
model_gnb = GaussianNB()

# 4. 训练
model_gnb.fit(X_train, y_train)

# 5. 预测
y_pred_gnb = model_gnb.predict(X_test)

# 6. 评估
accuracy_gnb = accuracy_score(y_test, y_pred_gnb)
print(f"高斯朴素贝叶斯准确率: {accuracy_gnb:.2%}")

# 7. 预测概率
y_prob_gnb = model_gnb.predict_proba(X_test)
print(f"\n前3个样本的预测概率：")
print(y_prob_gnb[:3])

# ========== 多项式朴素贝叶斯 ==========
# 适用于离散特征（如词频）

# 1. 生成离散数据
X_discrete, y_discrete = make_classification(
    n_samples=1000,
    n_features=20,
    n_informative=10,
    random_state=42
)

# 2. 转换为非负整数（模拟词频）
X_discrete = np.abs(X_discrete).astype(int)

# 3. 划分数据集
X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(
    X_discrete, y_discrete, test_size=0.3, random_state=42
)

# 4. 创建模型
model_mnb = MultinomialNB()

# 5. 训练
model_mnb.fit(X_train_d, y_train_d)

# 6. 预测
y_pred_mnb = model_mnb.predict(X_test_d)

# 7. 评估
accuracy_mnb = accuracy_score(y_test_d, y_pred_mnb)
print(f"\n多项式朴素贝叶斯准确率: {accuracy_mnb:.2%}")

# ========== 伯努利朴素贝叶斯 ==========
# 适用于二值特征（如词是否出现）

# 1. 转换为二值特征
X_binary = (X_discrete > 0).astype(int)

# 2. 划分数据集
X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(
    X_binary, y_discrete, test_size=0.3, random_state=42
)

# 3. 创建模型
model_bnb = BernoulliNB()

# 4. 训练
model_bnb.fit(X_train_b, y_train_b)

# 5. 预测
y_pred_bnb = model_bnb.predict(X_test_b)

# 6. 评估
accuracy_bnb = accuracy_score(y_test_b, y_pred_bnb)
print(f"\n伯努利朴素贝叶斯准确率: {accuracy_bnb:.2%}")
```

### 文本分类实战

```python
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.pipeline import make_pipeline

# 文本分类是朴素贝叶斯的经典应用

# 1. 准备数据
texts = [
    "这个产品很好用，推荐购买",
    "质量太差了，退货",
    "非常满意，五星好评",
    "一般般，没有想象中好",
    "物流很快，包装完好",
    "客服态度很差，不推荐",
    "性价比很高，值得买",
    "用了一次就坏了，差评",
    "外观漂亮，功能强大",
    "价格太贵，不值这个价"
]
labels = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]  # 1:好评, 0:差评

# 2. 创建文本特征提取器
# CountVectorizer: 词频向量
# TfidfVectorizer: TF-IDF向量（更常用）
vectorizer = TfidfVectorizer()

# 3. 提取特征
X = vectorizer.fit_transform(texts)
y = labels

print("词汇表：", vectorizer.get_feature_names_out())
print(f"特征矩阵形状：{X.shape}")

# 4. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 5. 创建模型
model = MultinomialNB()

# 6. 训练
model.fit(X_train, y_train)

# 7. 预测
y_pred = model.predict(X_test)

# 8. 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"\n文本分类准确率: {accuracy:.2%}")

# 9. 预测新文本
new_texts = [
    "这个产品非常好，很喜欢",
    "太差了，完全不能用"
]
X_new = vectorizer.transform(new_texts)
predictions = model.predict(X_new)
probabilities = model.predict_proba(X_new)

print(f"\n新文本预测：")
for text, pred, prob in zip(new_texts, predictions, probabilities):
    label = "好评" if pred == 1 else "差评"
    print(f"'{text}' → {label}，概率：{prob}")
```

### 手动实现朴素贝叶斯

```python
import numpy as np
from collections import Counter

# 手动实现高斯朴素贝叶斯

class GaussianNaiveBayes:
    def fit(self, X, y):
        # 获取类别
        self.classes = np.unique(y)
        self.n_classes = len(self.classes)
        self.n_features = X.shape[1]
        
        # 计算每个类别的先验概率和条件概率
        self.priors = {}
        self.means = {}
        self.vars = {}
        
        for c in self.classes:
            X_c = X[y == c]
            
            # 先验概率 P(y=c)
            self.priors[c] = len(X_c) / len(X)
            
            # 条件概率的均值和方差
            self.means[c] = X_c.mean(axis=0)
            self.vars[c] = X_c.var(axis=0) + 1e-9  # 防止除零
    
    def predict(self, X):
        predictions = []
        for x in X:
            # 计算每个类别的后验概率
            posteriors = {}
            for c in self.classes:
                # 先验概率
                prior = np.log(self.priors[c])
                
                # 条件概率（高斯分布）
                mean = self.means[c]
                var = self.vars[c]
                likelihood = -0.5 * np.sum(np.log(2 * np.pi * var))
                likelihood -= 0.5 * np.sum(((x - mean) ** 2) / var)
                
                # 后验概率
                posteriors[c] = prior + likelihood
            
            # 选择概率最大的类别
            predictions.append(max(posteriors, key=posteriors.get))
        
        return np.array(predictions)

# 测试
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 创建并训练模型
model = GaussianNaiveBayes()
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"手动实现朴素贝叶斯准确率: {accuracy:.2%}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 适用场景 |
| --- | --- | --- |
| 贝叶斯定理 | P(A|B) = P(B|A)P(A)/P(B) | 概率推理 |
| 先验概率 | 事件发生的初始概率 | 领域知识 |
| 后验概率 | 考虑证据后的概率 | 分类决策 |
| 朴素假设 | 特征相互独立 | 简化计算 |
| 高斯NB | 连续特征，正态分布 | 通用连续数据 |
| 多项式NB | 离散特征，词频 | 文本分类 |
| 伯努利NB | 二值特征 | 文本存在性 |
| 拉普拉斯平滑 | 防止零概率 | 小样本 |

---

## 5 新手常见误区

### 误区 1："朴素假设必须成立"

**错！** 现实中特征通常不独立，但朴素贝叶斯仍然有效。这是因为分类只需要概率的相对大小，而不是绝对准确。

### 误区 2："朴素贝叶斯只能处理文本"

不是的。虽然文本分类是经典应用，但朴素贝叶斯可以处理任何特征数据。高斯NB处理连续特征，多项式NB处理离散特征。

### 误区 3："朴素贝叶斯很复杂"

**错！** 朴素贝叶斯是最简单的算法之一。训练只需统计概率，预测只需计算后验。实现简单，速度快。

### 误区 4："朴素贝叶斯不需要特征工程"

不是的。虽然朴素贝叶斯对特征缩放不敏感，但特征选择、特征构造仍然重要。无关特征会影响性能。

### 误区 5："零概率问题不重要"

**错！** 如果某个特征在训练集中没出现，概率为0，会导致整个后验概率为0。需要使用拉普拉斯平滑解决。

---

## 6 动手练习

### 练习 1：基础练习 - 分类

使用朴素贝叶斯对乳腺癌数据集进行分类。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 加载数据
data = load_breast_cancer()
X = data.data
y = data.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建并训练模型
model = GaussianNB()
model.fit(X_train, y_train)

# 预测和评估
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2%}")
```

</details>

### 练习 2：进阶练习 - 文本分类

使用多项式朴素贝叶斯进行新闻分类。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.pipeline import make_pipeline

# 新闻数据
news = [
    "股市今日大涨，科技股领涨",
    "足球队赢得比赛，球迷欢呼",
    "新产品发布，功能强大",
    "经济增速放缓，政策调整",
    "电影票房创新高",
    "科学家发现新物种",
    "篮球明星退役",
    "人工智能技术发展",
    "货币政策收紧",
    "奥运会即将开幕"
]
labels = [0, 1, 2, 0, 1, 3, 1, 2, 0, 1]  # 0:财经, 1:体育, 2:科技, 3:科学

# 创建管道
model = make_pipeline(TfidfVectorizer(), MultinomialNB())

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    news, labels, test_size=0.3, random_state=42
)

# 训练
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"新闻分类准确率: {accuracy:.2%}")

# 预测新文本
new_news = ["股票大跌", "足球比赛精彩"]
predictions = model.predict(new_news)
print(f"新文本预测: {predictions}")
```

</details>

### 练习 3（挑战）：综合练习 - 手动实现

手动实现多项式朴素贝叶斯进行文本分类。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
from collections import Counter

class MultinomialNaiveBayes:
    def __init__(self, alpha=1.0):
        self.alpha = alpha  # 拉普拉斯平滑参数
    
    def fit(self, X, y):
        # X: 词频矩阵 (n_samples, n_features)
        # y: 标签 (n_samples,)
        self.classes = np.unique(y)
        self.n_classes = len(self.classes)
        self.n_features = X.shape[1]
        
        # 计算先验概率
        self.class_log_prior = np.log(np.array([
            np.sum(y == c) / len(y) for c in self.classes
        ]))
        
        # 计算条件概率
        self.feature_log_prob = np.zeros((self.n_classes, self.n_features))
        for i, c in enumerate(self.classes):
            X_c = X[y == c]
            # 词频统计 + 拉普拉斯平滑
            word_count = X_c.sum(axis=0) + self.alpha
            total_count = word_count.sum() + self.alpha * self.n_features
            self.feature_log_prob[i] = np.log(word_count / total_count)
    
    def predict(self, X):
        # 计算后验概率
        scores = X @ self.feature_log_prob.T + self.class_log_prior
        return self.classes[np.argmax(scores, axis=1)]

# 测试
from sklearn.feature_extraction.text import CountVectorizer

texts = ["很好很好", "太差了", "非常满意", "一般般", "推荐购买"]
labels = [1, 0, 1, 0, 1]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts).toarray()

model = MultinomialNaiveBayes(alpha=1.0)
model.fit(X, np.array(labels))

X_new = vectorizer.transform(["非常好", "很差"]).toarray()
predictions = model.predict(X_new)
print(f"预测结果: {predictions}")
```

</details>

---

## 下一章预告

下一章我们会学习 **集成学习** —— 通过组合多个弱学习器构建强学习器。你会学到 Bagging、Boosting、随机森林、XGBoost 等强大算法。
