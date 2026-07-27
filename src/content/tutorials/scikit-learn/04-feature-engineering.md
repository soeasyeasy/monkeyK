---
title: "第4章：特征工程"
description: "特征提取、特征构造、特征变换、Pipeline 管道机制"
---

# 第4章：特征工程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是特征工程？为什么它这么重要？
- 如何从原始数据中提取有用的特征？
- 怎么构造新的特征来提升模型性能？
- Pipeline 如何简化特征工程流程？

这一章会带你掌握特征工程的核心技术，这是机器学习中最能体现"手艺"的环节。

---

## 1 为什么需要特征工程？

### 痛点分析

业界有句话：**"数据和特征决定了机器学习的上限，而模型和算法只是逼近这个上限。"**

原始数据往往包含很多"噪声"：

- 无关特征：身份证号对预测房价没用
- 冗余特征：长宽高三个特征可能只需要两个
- 缺失特征：需要组合现有特征创造新信息

这就像**淘金**——沙子很多，但金子很少，你需要把金子筛出来。

### 解决方案

特征工程就是**把原始数据变成对模型有用的特征**：

- 特征提取：从原始数据提取关键信息
- 特征构造：组合现有特征创造新特征
- 特征选择：挑选最有用的特征
- 特征变换：标准化、归一化、降维

> **一句话总结**：好的特征比好的模型更重要。

---

## 2 特征提取

### 文本特征提取

把文本变成数值向量：

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

# 示例文本
corpus = [
    "我喜欢机器学习",
    "机器学习很有趣",
    "我喜欢 Python"
]

# 1. 词频向量（CountVectorizer）
cv = CountVectorizer()
X_count = cv.fit_transform(corpus)

print("词频向量:")
print(X_count.toarray())
print(f"词汇表: {cv.vocabulary_}")

# 2. TF-IDF 向量（更常用）
tfidf = TfidfVectorizer()
X_tfidf = tfidf.fit_transform(corpus)

print("\nTF-IDF 向量:")
print(X_tfidf.toarray())
```

**原理**：

- **CountVectorizer**：统计每个词出现的次数
- **TF-IDF**：词频 × 逆文档频率，降低常见词的权重

### 图像特征提取

```python
from sklearn.feature_extraction.image import img_to_graph, grid_to_graph

# 示例：将图像转成图结构
# 实际应用中，深度学习会自己提取特征
```

### 字典特征提取

```python
from sklearn.feature_extraction import DictVectorizer

# 示例数据
data = [
    {"城市": "北京", "温度": 25},
    {"城市": "上海", "温度": 28},
    {"城市": "广州", "温度": 30}
]

vec = DictVectorizer(sparse=False)
X = vec.fit_transform(data)

print(f"特征矩阵:\n{X}")
print(f"特征名称: {vec.get_feature_names_out()}")
```

---

## 3 特征构造

### 多项式特征

把特征组合成高次项：

```python
from sklearn.preprocessing import PolynomialFeatures
import numpy as np

# 原始特征
X = np.array([[2], [3], [4]])

# 创建 2 次多项式特征
poly = PolynomialFeatures(degree=2)
X_poly = poly.fit_transform(X)

print(f"原始特征:\n{X}")
print(f"\n多项式特征:\n{X_poly}")
# 包含：1, x, x^2
```

### 自定义特征

```python
import pandas as pd
import numpy as np

# 示例数据
df = pd.DataFrame({
    "长度": [10, 20, 30],
    "宽度": [5, 10, 15],
    "高度": [2, 4, 6]
})

# 构造新特征
df["面积"] = df["长度"] * df["宽度"]  # 面积 = 长 × 宽
df["体积"] = df["面积"] * df["高度"]  # 体积 = 面积 × 高
df["长宽比"] = df["长度"] / df["宽度"]  # 长宽比

print(df)
```

### 时间特征

```python
# 从日期提取特征
df["年份"] = df["日期"].dt.year
df["月份"] = df["日期"].dt.month
df["星期几"] = df["日期"].dt.dayofweek
df["是否周末"] = df["星期几"].isin([5, 6]).astype(int)
```

---

## 4 特征变换

### 对数变换

处理右偏分布的数据：

```python
import numpy as np
import matplotlib.pyplot as plt

# 右偏数据
data = np.random.exponential(scale=2, size=1000)

# 对数变换
data_log = np.log1p(data)  # log(1 + x)

# 可视化
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
axes[0].hist(data, bins=50)
axes[0].set_title("原始数据（右偏）")
axes[1].hist(data_log, bins=50)
axes[1].set_title("对数变换后（接近正态）")
plt.show()
```

### Box-Cox 变换

让数据更接近正态分布：

```python
from sklearn.preprocessing import PowerTransformer

# 右偏数据
X = np.array([[1], [2], [3], [4], [5], [10], [20]])

# Box-Cox 变换
pt = PowerTransformer(method="box-cox")
X_transformed = pt.fit_transform(X)

print(f"原始数据:\n{X.flatten()}")
print(f"\n变换后:\n{X_transformed.flatten()}")
```

---

## 5 特征选择

### 过滤法（Filter）

根据统计指标选择特征：

```python
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target

# 选择最好的 2 个特征
selector = SelectKBest(score_func=f_classif, k=2)
X_selected = selector.fit_transform(X, y)

print(f"原始特征数: {X.shape[1]}")
print(f"选择后特征数: {X_selected.shape[1]}")
print(f"特征得分: {selector.scores_}")
print(f"选择的特征: {selector.get_support()}")
```

### 包装法（Wrapper）

用模型性能评估特征组合：

```python
from sklearn.feature_selection import RFE
from sklearn.ensemble import RandomForestClassifier

# 创建模型
model = RandomForestClassifier(random_state=42)

# 递归特征消除（选择最重要的 2 个特征）
rfe = RFE(estimator=model, n_features_to_select=2)
rfe.fit(X, y)

print(f"选择的特征: {rfe.support_}")
print(f"特征排名: {rfe.ranking_}")
```

### 嵌入法（Embedded）

模型训练过程中自动选择：

```python
from sklearn.ensemble import RandomForestClassifier

# 随机森林自带特征重要性
model = RandomForestClassifier(random_state=42)
model.fit(X, y)

# 查看特征重要性
importances = model.feature_importances_
print(f"特征重要性: {importances}")

# 选择重要性 > 0.1 的特征
selected = importances > 0.1
print(f"选择的特征: {selected}")
```

---

## 6 Pipeline 实战

### 完整流程

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 创建管道
pipeline = Pipeline([
    ("scaler", StandardScaler()),              # 1. 标准化
    ("poly", PolynomialFeatures(degree=2)),    # 2. 多项式特征
    ("selector", SelectKBest(k=5)),            # 3. 特征选择
    ("classifier", RandomForestClassifier())   # 4. 分类
])

# 训练
pipeline.fit(X_train, y_train)

# 预测
accuracy = pipeline.score(X_test, y_test)
print(f"准确率: {accuracy:.2%}")
```

---

## 7 新手常见误区

### 误区 1："特征越多越好"

**错！** 无关特征会干扰模型学习，导致：

- 训练时间增加
- 模型过拟合
- 性能下降

应该做**特征选择**，只保留有用的特征。

### 误区 2："不需要特征工程，深度学习会自动提取"

不是的。深度学习确实能自动提取特征，但：

- 需要大量数据
- 计算成本高
- 传统机器学习在小数据上仍然有效

### 误区 3："特征选择只在训练集上做"

**错！** 应该在整个流程中使用 Pipeline，确保训练集和测试集的处理一致，避免数据泄露。

### 误区 4："所有特征都要标准化"

不是的。树模型（决策树、随机森林）不需要标准化，因为它们基于特征分裂，不受尺度影响。

### 误区 5："特征构造就是简单加减乘除"

不是的。好的特征构造需要**领域知识**：

- 房价预测：面积 × 单价 = 总价
- 用户画像：消费金额 / 消费次数 = 客单价
- 时间序列：节假日标记、季节性特征

---

## 8 动手练习

### 练习 1：基础练习

用 `TfidfVectorizer` 对以下文本进行特征提取，查看词汇表和向量。

```python
corpus = ["机器学习很有趣", "深度学习是机器学习的子集", "Python 是编程语言"]
```

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import TfidfVectorizer

corpus = ["机器学习很有趣", "深度学习是机器学习的子集", "Python 是编程语言"]

# 创建 TF-IDF 向量器
tfidf = TfidfVectorizer()
X = tfidf.fit_transform(corpus)

# 查看词汇表
print("词汇表:")
for word, idx in tfidf.vocabulary_.items():
    print(f"  {word}: {idx}")

# 查看向量
print(f"\nTF-IDF 矩阵:\n{X.toarray()}")

# 查看特征名称
print(f"\n特征名称: {tfidf.get_feature_names_out()}")
```

</details>

### 练习 2：进阶练习

用 `SelectKBest` 从鸢尾花数据集中选择最重要的 2 个特征，查看特征得分。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target

# 选择最好的 2 个特征
selector = SelectKBest(score_func=f_classif, k=2)
X_selected = selector.fit_transform(X, y)

# 查看结果
print(f"原始特征数: {X.shape[1]}")
print(f"选择后特征数: {X_selected.shape[1]}")
print(f"\n特征得分: {selector.scores_}")
print(f"p 值: {selector.pvalues_}")
print(f"\n选择的特征掩码: {selector.get_support()}")
print(f"选择的特征名称: {[iris.feature_names[i] for i in range(4) if selector.get_support()[i]]}")
```

</details>

### 练习 3（挑战）：综合练习

创建一个完整的 Pipeline，包含标准化、多项式特征、特征选择和分类器，在鸢尾花数据集上训练并评估。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 创建管道
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("poly", PolynomialFeatures(degree=2, include_bias=False)),
    ("selector", SelectKBest(k=6)),
    ("classifier", RandomForestClassifier(n_estimators=100, random_state=42))
])

# 训练
pipeline.fit(X_train, y_train)

# 评估
accuracy = pipeline.score(X_test, y_test)
print(f"测试集准确率: {accuracy:.2%}")

# 交叉验证
cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5)
print(f"交叉验证准确率: {cv_scores.mean():.2%} (+/- {cv_scores.std() * 2:.2%})")

# 查看选择的特征
print(f"\n多项式特征数: {pipeline.named_steps['poly'].n_output_features_}")
print(f"选择的特征数: {pipeline.named_steps['selector'].get_support().sum()}")
```

</details>

---

## 9 下一章预告

下一章我们会学习 **监督学习：回归算法**——线性回归、岭回归、Lasso 回归等。你会学到如何预测连续值（如房价、温度），以及如何处理过拟合问题。
