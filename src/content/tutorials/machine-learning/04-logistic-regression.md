---
title: "第4章：逻辑回归"
description: "Sigmoid 函数、决策边界、交叉熵损失、二分类实战"
---

# 第4章：逻辑回归

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 逻辑回归名字里有"回归"，为什么是分类算法？
- Sigmoid 函数有什么作用？
- 逻辑回归如何做分类决策？
- 交叉熵损失和均方误差有什么区别？

这一章就是为了解答这些问题。逻辑回归是二分类问题的经典算法，理解它对学习神经网络也很重要。

---

## 1 为什么需要逻辑回归？

### 痛点分析

假设你要判断邮件是否为垃圾邮件。数据：

```
邮件特征（词频、发件人等）: [0.8, 0.2, 0.9, ...]
标签: [垃圾, 正常, 垃圾, ...]
```

问题：线性回归输出是连续值（如 -5 到 10），但分类需要离散标签（0 或 1）。

### 解决方案

逻辑回归用 Sigmoid 函数将线性输出映射到 [0, 1] 区间：

```python
# 逻辑回归：先线性组合，再 Sigmoid
z = w1*x1 + w2*x2 + ... + b  # 线性组合
p = 1 / (1 + e^(-z))          # Sigmoid 函数，输出概率

# 如果 p > 0.5，预测为类别 1（垃圾邮件）
# 如果 p <= 0.5，预测为类别 0（正常邮件）
```

打个比方：

> 逻辑回归像"考试打分"：先算总分（线性组合），再用曲线映射到 0-100 分（Sigmoid），最后根据分数线判断是否及格（分类）。

> **一句话总结**：逻辑回归用 Sigmoid 函数将线性输出转换为概率，用于二分类。

---

## 2 核心原理

### Sigmoid 函数

```python
# Sigmoid 函数
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

# 特性：
# - 输出范围：(0, 1)
# - z=0 时，输出 0.5
# - z很大时，输出接近 1
# - z很小时，输出接近 0
```

打个比方：

> Sigmoid 像"压力测试"：压力小（z小）时表现接近 0，压力大（z大）时表现接近 1，中间有个平滑过渡。

### 决策边界

逻辑回归的决策边界是线性的：

```
决策规则：如果 p >= 0.5，预测为 1；否则为 0
等价于：如果 z >= 0，预测为 1；否则为 0
即：w1*x1 + w2*x2 + ... + b >= 0
```

### 交叉熵损失

```python
# 交叉熵损失（对数损失）
Loss = -(1/n) * Σ[y*log(p) + (1-y)*log(1-p)]

# y: 真实标签（0或1）
# p: 预测概率
# 当 y=1 时，希望 p 接近 1，损失小
# 当 y=0 时，希望 p 接近 0，损失小
```

为什么不用 MSE？
- MSE 会导致非凸损失函数，梯度下降容易陷入局部最优
- 交叉熵是凸函数，保证找到全局最优

---

## 3 基础用法

### 使用 sklearn 实现逻辑回归

```python
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# 1. 生成二分类数据
# 2个特征，1000个样本
X, y = make_classification(
    n_samples=1000,      # 样本数
    n_features=2,        # 特征数
    n_redundant=0,       # 冗余特征数
    n_informative=2,     # 有效特征数
    random_state=42      # 随机种子
)

print("数据形状：")
print(f"X: {X.shape}")  # (1000, 2)
print(f"y: {y.shape}")  # (1000,)
print(f"类别分布：{np.bincount(y)}")  # [500, 500] 大致平衡

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. 创建模型
model = LogisticRegression()

# 4. 训练模型
model.fit(X_train, y_train)

# 5. 查看模型参数
print(f"\n模型参数：")
print(f"权重: {model.coef_[0]}")  # 每个特征的权重
print(f"偏置: {model.intercept_[0]:.4f}")

# 6. 预测
y_pred = model.predict(X_test)  # 预测类别
y_prob = model.predict_proba(X_test)  # 预测概率

print(f"\n预测结果（前5个）：")
print(f"预测类别: {y_pred[:5]}")
print(f"预测概率: {y_prob[:5]}")  # 每行两个值：类别0概率，类别1概率

# 7. 评估模型
accuracy = accuracy_score(y_test, y_pred)
print(f"\n准确率: {accuracy:.2%}")

print("\n分类报告：")
print(classification_report(y_test, y_pred, target_names=['类别0', '类别1']))

# 8. 预测新数据
X_new = np.array([[1.5, 2.0]])  # 新样本
pred = model.predict(X_new)
prob = model.predict_proba(X_new)
print(f"\n新样本预测：类别{pred[0]}，概率{prob[0]}")
```

### 手动实现逻辑回归

```python
import numpy as np

# 手动实现逻辑回归，理解原理

# 1. Sigmoid 函数
def sigmoid(z):
    # 防止溢出
    z = np.clip(z, -500, 500)
    return 1 / (1 + np.exp(-z))

# 2. 生成数据
np.random.seed(42)
X = np.random.randn(100, 2)  # 100个样本，2个特征
y = (X[:, 0] + X[:, 1] > 0).astype(int)  # 简单线性分类规则

print("数据形状：")
print(f"X: {X.shape}, y: {y.shape}")
print(f"类别分布: {np.bincount(y)}")

# 3. 初始化参数
w = np.zeros(2)  # 权重
b = 0            # 偏置
lr = 0.1         # 学习率
epochs = 1000    # 迭代次数

# 4. 训练
for epoch in range(epochs):
    # 线性组合
    z = np.dot(X, w) + b
    
    # Sigmoid
    p = sigmoid(z)
    
    # 计算损失（交叉熵）
    epsilon = 1e-15  # 防止log(0)
    p = np.clip(p, epsilon, 1 - epsilon)
    loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    
    # 计算梯度
    dw = np.dot(X.T, (p - y)) / len(y)
    db = np.mean(p - y)
    
    # 更新参数
    w -= lr * dw
    b -= lr * db
    
    # 每100次打印损失
    if (epoch + 1) % 100 == 0:
        accuracy = np.mean((p >= 0.5).astype(int) == y)
        print(f"第{epoch+1}次迭代，损失：{loss:.4f}，准确率：{accuracy:.2%}")

print(f"\n最终参数：w={w}, b={b:.4f}")

# 5. 预测
def predict(X, w, b):
    p = sigmoid(np.dot(X, w) + b)
    return (p >= 0.5).astype(int)

y_pred = predict(X, w, b)
accuracy = np.mean(y_pred == y)
print(f"训练集准确率：{accuracy:.2%}")
```

### 多分类逻辑回归

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 逻辑回归也可以处理多分类（使用 One-vs-Rest 或 Softmax）

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 3. 创建模型（默认使用 One-vs-Rest）
model = LogisticRegression(multi_class='ovr', max_iter=200)

# 4. 训练
model.fit(X_train, y_train)

# 5. 预测
y_pred = model.predict(X_test)

# 6. 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"多分类准确率: {accuracy:.2%}")

# 7. 查看每个类别的参数
print(f"\n类别数: {len(model.classes_)}")
print(f"权重形状: {model.coef_.shape}")  # (3, 4) 3个类别，4个特征
print(f"偏置: {model.intercept_}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 公式/方法 |
| --- | --- | --- |
| Sigmoid | 将线性输出映射到(0,1) | 1/(1+e^(-z)) |
| 决策边界 | 分类的界限 | w·x + b = 0 |
| 交叉熵损失 | 分类问题的损失函数 | -[y*log(p)+(1-y)*log(1-p)] |
| 预测概率 | 输出属于各类别的概率 | predict_proba() |
| 预测类别 | 根据概率阈值分类 | predict() |
| 正则化 | 防止过拟合 | L1/L2正则化 |
| 多分类 | 处理多个类别 | One-vs-Rest, Softmax |

---

## 5 新手常见误区

### 误区 1："逻辑回归是回归算法"

**错！** 虽然名字里有"回归"，但逻辑回归是分类算法。它用 Sigmoid 函数将线性输出转换为概率，用于分类。

### 误区 2："逻辑回归只能处理线性可分数据"

不是的。虽然决策边界是线性的，但可以通过特征变换（如多项式特征）处理非线性问题。另外，可以使用核技巧扩展到非线性分类。

### 误区 3："预测概率 0.5 就是分类阈值"

不完全是。默认阈值是 0.5，但可以根据业务需求调整。例如，在医疗诊断中，可能降低阈值以提高召回率。

### 误区 4："逻辑回归不需要特征缩放"

**错！** 逻辑回归使用梯度下降优化，特征缩放可以加快收敛速度。另外，正则化项对特征尺度敏感，需要缩放。

### 误区 5："准确率越高，模型越好"

不是的。在类别不平衡时，准确率会误导。例如，99%正常，1%异常，全预测正常也有99%准确率。需要看精确率、召回率、F1分数。

---

## 6 动手练习

### 练习 1：基础练习 - 二分类

使用逻辑回归对乳腺癌数据集进行分类。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# 加载数据
data = load_breast_cancer()
X = data.data
y = data.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建并训练模型
model = LogisticRegression(max_iter=10000)
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2%}")
print("\n分类报告：")
print(classification_report(y_test, y_pred, target_names=data.target_names))
```

</details>

### 练习 2：进阶练习 - 调整阈值

练习调整分类阈值，观察精确率和召回率的变化。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score
import numpy as np

# 生成数据
X, y = make_classification(n_samples=1000, n_features=20, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 训练模型
model = LogisticRegression()
model.fit(X_train, y_train)

# 获取预测概率
y_prob = model.predict_proba(X_test)[:, 1]

# 不同阈值下的表现
thresholds = [0.3, 0.5, 0.7]
for threshold in thresholds:
    y_pred = (y_prob >= threshold).astype(int)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    print(f"阈值 {threshold}: 精确率={precision:.2%}, 召回率={recall:.2%}")
```

</details>

### 练习 3（挑战）：综合练习 - 手动实现

手动实现逻辑回归，并在鸢尾花数据集上测试。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
from sklearn.datasets import load_iris

# Sigmoid 函数
def sigmoid(z):
    z = np.clip(z, -500, 500)
    return 1 / (1 + np.exp(-z))

# 加载数据（二分类）
iris = load_iris()
X = iris.data[:100]  # 只取前100个样本（2个类别）
y = iris.target[:100]

# 初始化参数
w = np.zeros(X.shape[1])
b = 0
lr = 0.01
epochs = 1000

# 训练
for epoch in range(epochs):
    z = np.dot(X, w) + b
    p = sigmoid(z)
    
    # 损失
    epsilon = 1e-15
    p = np.clip(p, epsilon, 1 - epsilon)
    loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    
    # 梯度
    dw = np.dot(X.T, (p - y)) / len(y)
    db = np.mean(p - y)
    
    # 更新
    w -= lr * dw
    b -= lr * db
    
    if (epoch + 1) % 200 == 0:
        accuracy = np.mean((p >= 0.5).astype(int) == y)
        print(f"第{epoch+1}次，损失：{loss:.4f}，准确率：{accuracy:.2%}")

# 预测
def predict(X, w, b):
    p = sigmoid(np.dot(X, w) + b)
    return (p >= 0.5).astype(int)

y_pred = predict(X, w, b)
print(f"\n最终准确率：{np.mean(y_pred == y):.2%}")
```

</details>

---

## 下一章预告

下一章我们会学习 **决策树** —— 一种基于树形结构的分类算法。你会学到信息增益、基尼系数等概念，以及决策树如何做出决策。
