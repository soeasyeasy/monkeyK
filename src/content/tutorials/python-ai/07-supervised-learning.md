---
title: "第7章：监督学习算法"
description: "掌握线性回归、逻辑回归、决策树、SVM 和 KNN"
---

# 第7章：监督学习算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 线性回归和逻辑回归有什么区别？
- 决策树是怎么做决策的？
- 什么是支持向量机？
- KNN 是如何分类的？

这一章就是为了解答这些问题。监督学习是机器学习中最常用的方法，掌握这些算法是 AI 工程师的基本功。

---

## 1 线性回归

### 概念解释

线性回归用于预测连续数值，找到一条最佳拟合直线：

```
y = w*x + b

其中：
- w 是权重（斜率）
- b 是偏置（截距）
- x 是输入特征
- y 是预测值
```

### 生活化类比

> 线性回归就像根据房屋面积预测房价。
> 面积越大，房价越高，它们之间是线性关系。

### 代码实现

```python
from sklearn.linear_model import LinearRegression
import numpy as np

# 训练数据
X = np.array([[50], [60], [70], [80], [90]])  # 房屋面积
y = np.array([100, 120, 140, 160, 180])       # 房价

# 创建模型
model = LinearRegression()

# 训练模型
model.fit(X, y)

# 预测
X_new = np.array([[100]])  # 100平米的房子
prediction = model.predict(X_new)

print(f"预测房价: {prediction[0]:.2f}")
print(f"权重: {model.coef_[0]:.2f}")
print(f"偏置: {model.intercept_:.2f}")
```

---

## 2 逻辑回归

### 概念解释

逻辑回归用于二分类问题，输出概率值：

```
P(y=1|x) = 1 / (1 + e^(-(w*x + b)))

其中：
- sigmoid 函数将输出映射到 [0, 1]
- 大于 0.5 预测为 1，否则为 0
```

### 生活化类比

> 逻辑回归就像根据症状判断是否生病。
> 输出一个概率，大于 50% 判断为生病。

### 代码实现

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 生成二分类数据
X, y = make_classification(n_samples=1000, n_features=4, random_state=42)

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建模型
model = LogisticRegression(random_state=42)

# 训练
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2f}")

# 预测概率
probabilities = model.predict_proba(X_test[:5])
print("预测概率:")
print(probabilities)
```

---

## 3 决策树

### 概念解释

决策树通过一系列 if-else 规则做决策：

```
              [年龄 > 30?]
             /            \
           是              否
          /                \
   [收入 > 5万?]      [学历 = 硕士?]
    /        \          /          \
  是          否      是            否
 /              \    /                \
买奢侈品    买普通   买奢侈品        买普通
```

### 生活化类比

> 决策树就像医生诊断病情。
> 先问"发烧吗？"，再问"咳嗽吗？"，一步步确定病因。

### 代码实现

```python
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建模型
model = DecisionTreeClassifier(random_state=42, max_depth=3)

# 训练
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2f}")

# 特征重要性
print("特征重要性:", model.feature_importances_)
```

---

## 4 支持向量机（SVM）

### 概念解释

SVM 找到一个最优超平面，将不同类别分开：

```
        |
   ○    |    ●
     ○  |  ●
       \|/
   -----+-----  ← 最优超平面（分隔线）
       /|\
     ●  |  ○
   ●    |    ○
        |
```

### 生活化类比

> SVM 就像在两类数据之间画一条最宽的马路。
> 马路越宽，分类越准确。

### 代码实现

```python
from sklearn.svm import SVC
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 生成数据
X, y = make_classification(n_samples=1000, n_features=4, random_state=42)

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建模型
model = SVC(kernel='rbf', random_state=42)  # rbf 核函数

# 训练
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2f}")
```

---

## 5 KNN（K 近邻）

### 概念解释

KNN 根据最近的 K 个邻居的类别来决定：

```
        ●
      ●   ○
    ●   ?   ○
      ○   ●
        ○

? 的 3 个最近邻居：2 个 ●，1 个 ○
所以 ? 被分类为 ●
```

### 生活化类比

> KNN 就像"近朱者赤，近墨者黑"。
> 看你周围的朋友是什么人，就知道你是什么人。

### 代码实现

```python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建模型（K=5）
model = KNeighborsClassifier(n_neighbors=5)

# 训练
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2f}")
```

---

## 6 算法对比

| 算法 | 适用问题 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 线性回归 | 回归 | 简单、可解释 | 只能处理线性关系 |
| 逻辑回归 | 分类 | 简单、快速 | 只能处理线性可分 |
| 决策树 | 分类/回归 | 可解释、不需要预处理 | 容易过拟合 |
| SVM | 分类 | 高维效果好 | 训练慢、参数敏感 |
| KNN | 分类/回归 | 简单、不需要训练 | 预测慢、内存占用大 |

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 线性回归 | y = wx + b，预测连续值 |
| 逻辑回归 | sigmoid 函数，二分类 |
| 决策树 | if-else 规则树 |
| SVM | 最优超平面 |
| KNN | K 个最近邻居投票 |

---

## 8 新手常见误区

### 误区 1："逻辑回归是回归算法"

**错！** 逻辑回归虽然名字有"回归"，但它是分类算法：

```python
# ❌ 错误理解：逻辑回归预测连续值
# ✅ 正确理解：逻辑回归预测类别概率
```

### 误区 2："决策树不需要剪枝"

不是的。决策树容易过拟合，需要剪枝：

```python
# ❌ 错误：不限制深度
model = DecisionTreeClassifier()  # 可能过拟合

# ✅ 正确：限制深度
model = DecisionTreeClassifier(max_depth=5)  # 防止过拟合
```

### 误区 3："KNN 的 K 越小越好"

K 太小会受噪声影响，太大会受远处点影响：

```python
# ❌ 错误：K=1
model = KNeighborsClassifier(n_neighbors=1)  # 对噪声敏感

# ✅ 正确：通过交叉验证选择 K
from sklearn.model_selection import cross_val_score
scores = []
for k in range(1, 20):
    model = KNeighborsClassifier(n_neighbors=k)
    score = cross_val_score(model, X, y, cv=5).mean()
    scores.append(score)
best_k = scores.index(max(scores)) + 1
```

---

## 9 动手练习

### 练习 1：基础练习

用线性回归预测：当面积为 120 时，房价是多少？

```python
X = [[50], [60], [70], [80], [90]]
y = [100, 120, 140, 160, 180]
```

<details>
<summary>点击查看答案</summary>

```python
from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[50], [60], [70], [80], [90]])
y = np.array([100, 120, 140, 160, 180])

model = LinearRegression()
model.fit(X, y)

X_new = np.array([[120]])
prediction = model.predict(X_new)
print(f"预测房价: {prediction[0]:.2f}")  # 240.00
```

</details>

### 练习 2：进阶练习

用决策树和随机森林分别对 Iris 数据集分类，比较准确率。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 决策树
dt = DecisionTreeClassifier(random_state=42)
dt.fit(X_train, y_train)
dt_score = accuracy_score(y_test, dt.predict(X_test))

# 随机森林
rf = RandomForestClassifier(random_state=42)
rf.fit(X_train, y_train)
rf_score = accuracy_score(y_test, rf.predict(X_test))

print(f"决策树准确率: {dt_score:.2f}")
print(f"随机森林准确率: {rf_score:.2f}")
```

</details>

### 练习 3（挑战）：综合练习

用 5 种算法对同一个数据集分类，比较性能。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 定义模型
models = {
    '逻辑回归': LogisticRegression(random_state=42, max_iter=200),
    '决策树': DecisionTreeClassifier(random_state=42),
    'SVM': SVC(random_state=42),
    'KNN': KNeighborsClassifier(),
    '随机森林': RandomForestClassifier(random_state=42)
}

# 训练和评估
for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"{name}: {accuracy:.2f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **无监督学习算法**——K-Means 聚类、PCA 降维等，让模型自己发现数据中的规律。
