---
title: "第6章：K近邻算法（KNN）"
description: "距离度量、K值选择、分类与回归、KD树"
---

# 第6章：K近邻算法（KNN）

## 本章导读

在学这一章之前，你可能会有这些疑问：

- KNN 是怎么做预测的？
- 如何计算样本之间的距离？
- K 值应该选多少？
- KNN 有什么优缺点？

这一章就是为了解答这些问题。KNN 简单直观，是理解基于实例学习的好起点。

---

## 1 为什么需要 KNN？

### 痛点分析

假设你要判断一个新样本的类别。你有一些已标注的样本：

```
样本1: [1.0, 2.0] → 类别A
样本2: [1.5, 1.8] → 类别A
样本3: [5.0, 8.0] → 类别B
样本4: [6.0, 9.0] → 类别B
新样本: [1.2, 2.1] → ?
```

问题：如何判断新样本的类别？

### 解决方案

KNN 的思路：看看新样本周围的 K 个最近邻是什么类别。

```python
# KNN 算法
# 1. 计算新样本与所有训练样本的距离
# 2. 选择距离最近的 K 个样本
# 3. 统计这 K 个样本的类别
# 4. 多数表决，得票最多的类别就是预测结果

# 例如 K=3，最近的3个样本是：样本1(A)、样本2(A)、样本3(B)
# 类别A有2票，类别B有1票
# 预测结果：类别A
```

打个比方：

> KNN 像"物以类聚，人以群分"：看看你周围的朋友都是什么人，你就大概知道你自己是什么人了。

> **一句话总结**：KNN 根据最近邻的类别进行投票，预测新样本的类别。

---

## 2 核心原理

### 距离度量

常用距离公式：

```python
# 欧氏距离（最常用）
d = sqrt((x1-y1)² + (x2-y2)² + ... + (xn-yn)²)

# 曼哈顿距离
d = |x1-y1| + |x2-y2| + ... + |xn-yn|

# 闵可夫斯基距离（通用形式）
d = (|x1-y1|^p + |x2-y2|^p + ... + |xn-yn|^p)^(1/p)
# p=1: 曼哈顿距离
# p=2: 欧氏距离
```

### K 值选择

K 值的影响：

- **K 太小**：模型复杂，容易过拟合，对噪声敏感
- **K 太大**：模型简单，容易欠拟合，包含太多远处样本
- **经验法则**：K = sqrt(n)，n 为样本数；或通过交叉验证选择

### 分类 vs 回归

- **分类**：多数表决，得票最多的类别
- **回归**：K 个邻居的平均值（或加权平均）

### KD 树

KD 树加速 KNN 搜索：

```
# 朴素 KNN：计算与所有样本的距离，O(n)
# KD 树：空间划分，快速查找，O(log n)

# KD 树构建：
# 1. 选择方差最大的维度
# 2. 按中位数划分
# 3. 递归构建左右子树
# 4. 搜索时剪枝，避免计算所有距离
```

---

## 3 基础用法

### 使用 sklearn 实现 KNN

```python
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.datasets import load_iris, make_regression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
from sklearn.preprocessing import StandardScaler
import numpy as np

# ========== 分类任务 ==========

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 3. 特征缩放（KNN对距离敏感，必须做特征缩放）
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # 在训练集上fit
X_test_scaled = scaler.transform(X_test)        # 在测试集上transform

# 4. 创建模型
# n_neighbors: K值
# weights: 'uniform'（等权）或'distance'（距离加权）
# metric: 距离度量，'minkowski'（默认，p=2为欧氏距离）
# p: 闵可夫斯基距离的参数
model = KNeighborsClassifier(
    n_neighbors=5,           # K=5
    weights='uniform',       # 等权投票
    metric='minkowski',      # 闵可夫斯基距离
    p=2                      # p=2，欧氏距离
)

# 5. 训练（KNN没有显式训练过程，只是存储数据）
model.fit(X_train_scaled, y_train)

# 6. 预测
y_pred = model.predict(X_test_scaled)

# 7. 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"KNN分类准确率: {accuracy:.2%}")

# 8. 预测概率
y_prob = model.predict_proba(X_test_scaled)
print(f"\n前3个样本的预测概率：")
print(y_prob[:3])

# 9. 不同K值的对比
print("\n不同K值的准确率：")
for k in [1, 3, 5, 7, 9, 11]:
    model = KNeighborsClassifier(n_neighbors=k)
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"K={k}: {acc:.2%}")

# ========== 回归任务 ==========

# 1. 生成回归数据
X_reg, y_reg = make_regression(n_samples=1000, n_features=10, noise=0.1, random_state=42)

# 2. 划分数据集
X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

# 3. 特征缩放
scaler_reg = StandardScaler()
X_train_reg_scaled = scaler_reg.fit_transform(X_train_reg)
X_test_reg_scaled = scaler_reg.transform(X_test_reg)

# 4. 创建回归模型
model_reg = KNeighborsRegressor(n_neighbors=5, weights='distance')

# 5. 训练
model_reg.fit(X_train_reg_scaled, y_train_reg)

# 6. 预测
y_pred_reg = model_reg.predict(X_test_reg_scaled)

# 7. 评估
mse = mean_squared_error(y_test_reg, y_pred_reg)
rmse = np.sqrt(mse)
print(f"\nKNN回归 RMSE: {rmse:.2f}")
```

### 手动实现 KNN

```python
import numpy as np
from collections import Counter

# 手动实现KNN，理解原理

class KNNClassifier:
    def __init__(self, k=3):
        self.k = k
        self.X_train = None
        self.y_train = None
    
    def fit(self, X, y):
        # KNN没有显式训练，只是存储数据
        self.X_train = X
        self.y_train = y
    
    def predict(self, X):
        predictions = []
        for x in X:
            # 计算距离
            distances = self._euclidean_distance(x, self.X_train)
            
            # 选择最近的K个邻居
            k_indices = np.argsort(distances)[:self.k]
            k_nearest_labels = self.y_train[k_indices]
            
            # 多数表决
            most_common = Counter(k_nearest_labels).most_common(1)
            predictions.append(most_common[0][0])
        
        return np.array(predictions)
    
    def _euclidean_distance(self, x1, X2):
        # 计算x1与X2中所有样本的欧氏距离
        return np.sqrt(np.sum((X2 - x1) ** 2, axis=1))

# 测试
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 创建并训练模型
model = KNNClassifier(k=5)
model.fit(X_train_scaled, y_train)

# 预测
y_pred = model.predict(X_test_scaled)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"手动实现KNN准确率: {accuracy:.2%}")

# 预测单个样本
x_new = X_test_scaled[0].reshape(1, -1)
pred = model.predict(x_new)
print(f"\n新样本预测: 类别{pred[0]}")
print(f"真实类别: 类别{y_test[0]}")
```

### 距离加权 KNN

```python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

# 距离加权：距离越近，权重越大

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 等权投票
model_uniform = KNeighborsClassifier(n_neighbors=5, weights='uniform')
model_uniform.fit(X_train_scaled, y_train)
y_pred_uniform = model_uniform.predict(X_test_scaled)
acc_uniform = accuracy_score(y_test, y_pred_uniform)

# 距离加权
model_distance = KNeighborsClassifier(n_neighbors=5, weights='distance')
model_distance.fit(X_train_scaled, y_train)
y_pred_distance = model_distance.predict(X_test_scaled)
acc_distance = accuracy_score(y_test, y_pred_distance)

print(f"等权投票准确率: {acc_uniform:.2%}")
print(f"距离加权准确率: {acc_distance:.2%}")

# 距离加权原理：
# 权重 = 1 / distance
# 距离近的样本权重大，距离远的样本权重小
# 投票时，权重大的样本影响更大
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 选择建议 |
| --- | --- | --- |
| 欧氏距离 | 直线距离 | 最常用 |
| 曼哈顿距离 | 街区距离 | 高维数据 |
| K值 | 邻居数量 | sqrt(n)或交叉验证 |
| 等权投票 | 每个邻居权重相同 | 默认选择 |
| 距离加权 | 距离近权重大 | 样本分布不均时 |
| 特征缩放 | 标准化/归一化 | 必须做 |
| KD树 | 加速搜索 | 低维数据 |
| 球树 | 加速搜索 | 高维数据 |

---

## 5 新手常见误区

### 误区 1："KNN不需要训练"

**对！** KNN是懒惰学习（lazy learning），训练阶段只是存储数据，预测时才计算距离。所以训练快，预测慢。

### 误区 2："KNN不需要特征缩放"

**错！** KNN基于距离，如果特征尺度不同，尺度大的特征会主导距离计算。必须做特征缩放。

### 误区 3："K值越小越好"

**错！** K太小容易过拟合，对噪声敏感。K太大容易欠拟合。需要通过交叉验证选择合适的K值。

### 误区 4："KNN适合高维数据"

**错！** 高维数据中，所有样本之间的距离都很大，KNN效果变差。这叫做"维度灾难"。高维数据需要先降维。

### 误区 5："KNN可以处理类别特征"

不是的。KNN需要计算距离，类别特征无法直接计算距离。需要先将类别特征编码为数值。

---

## 6 动手练习

### 练习 1：基础练习 - 分类

使用KNN对乳腺癌数据集进行分类。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

# 加载数据
data = load_breast_cancer()
X = data.data
y = data.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 创建并训练模型
model = KNeighborsClassifier(n_neighbors=5)
model.fit(X_train_scaled, y_train)

# 预测和评估
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2%}")
```

</details>

### 练习 2：进阶练习 - K值选择

通过交叉验证选择最佳K值。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 不同K值的交叉验证
k_values = range(1, 31)
cv_scores = []

for k in k_values:
    model = KNeighborsClassifier(n_neighbors=k)
    scores = cross_val_score(model, X_scaled, y, cv=5, scoring='accuracy')
    cv_scores.append(scores.mean())

# 打印结果
print("K值\t准确率")
for k, score in zip(k_values, cv_scores):
    if k % 5 == 0 or k == 1:
        print(f"{k}\t{score:.3f}")

# 最佳K值
best_k = k_values[cv_scores.index(max(cv_scores))]
print(f"\n最佳K值: {best_k}，准确率: {max(cv_scores):.3f}")
```

</details>

### 练习 3（挑战）：综合练习 - 手动实现

手动实现KNN回归，并在波士顿房价数据集上测试。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
from sklearn.datasets import load_boston
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler

class KNNRegressor:
    def __init__(self, k=5):
        self.k = k
        self.X_train = None
        self.y_train = None
    
    def fit(self, X, y):
        self.X_train = X
        self.y_train = y
    
    def predict(self, X):
        predictions = []
        for x in X:
            # 计算距离
            distances = np.sqrt(np.sum((self.X_train - x) ** 2, axis=1))
            
            # 选择最近的K个邻居
            k_indices = np.argsort(distances)[:self.k]
            k_nearest_values = self.y_train[k_indices]
            
            # 取平均值
            predictions.append(np.mean(k_nearest_values))
        
        return np.array(predictions)

# 加载数据
boston = load_boston()
X = boston.data
y = boston.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 创建并训练模型
model = KNNRegressor(k=5)
model.fit(X_train_scaled, y_train)

# 预测
y_pred = model.predict(X_test_scaled)

# 评估
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print(f"RMSE: {rmse:.2f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **支持向量机（SVM）** —— 一种强大的分类算法。你会学到最大间隔、核函数、软间隔等概念，以及SVM如何处理非线性问题。
