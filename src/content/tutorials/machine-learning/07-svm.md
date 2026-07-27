---
title: "第7章：支持向量机（SVM）"
description: "最大间隔、核函数、软间隔、非线性分类"
---

# 第7章：支持向量机（SVM）

## 本章导读

在学这一章之前，你可能会有这些疑问：

- SVM 是怎么找到分类边界的？
- 什么是"支持向量"？
- 核函数有什么用？
- SVM 如何处理非线性问题？

这一章就是为了解答这些问题。SVM 是机器学习中最优雅、最强大的算法之一。

---

## 1 为什么需要 SVM？

### 痛点分析

假设你要分类两类点。可以画出无数条分界线：

```
    ●           ●
        ●   ●
    ───────────────  分界线1
    ───────────────  分界线2
    ───────────────  分界线3
        ○   ○
    ○           ○
```

问题：哪条分界线最好？

### 解决方案

SVM 选择"最宽"的分界线——让两类样本离分界线最远：

```
    ●           ●
        ●   ●
  ─ ─ ─ ─ ─ ─ ─ ─ ─  上边界
  ==================  分界线（最大间隔）
  ─ ─ ─ ─ ─ ─ ─ ─ ─  下边界
        ○   ○
    ○           ○
```

打个比方：

> SVM 像"在两类之间放一条最宽的马路"：马路越宽，两边的房子（样本）离马路越远，分类越可靠。

> **一句话总结**：SVM 寻找最大间隔的分类超平面，使分类更稳健。

---

## 2 核心原理

### 最大间隔

```python
# SVM 目标：找到最大间隔的超平面
# 超平面：w·x + b = 0
# 支持向量：离超平面最近的样本点
# 间隔：支持向量到超平面的距离 = 2/||w||
# 目标：最小化 ||w||，等价于最大化间隔
```

### 核函数

核函数将数据映射到高维空间，使其线性可分：

| 核函数 | 公式 | 适用场景 |
| --- | --- | --- |
| 线性核 | K(x,y) = x·y | 线性可分，高维数据 |
| 多项式核 | K(x,y) = (γx·y + r)^d | 图像识别 |
| RBF核 | K(x,y) = exp(-γ||x-y||²) | 最常用，通用 |
| Sigmoid核 | K(x,y) = tanh(γx·y + r) | 神经网络 |

打个比方：

> 核函数像"戴3D眼镜"：原本2D看不清的东西，映射到3D就一目了然。

### 软间隔

允许一些样本分类错误，避免过拟合：

```python
# 硬间隔：所有样本必须正确分类
# 问题：有噪声时不可行

# 软间隔：允许少量样本违反间隔
# C参数控制：
# C大 → 严格分类，可能过拟合
# C小 → 允许更多错误，更稳健
```

---

## 3 基础用法

### 使用 sklearn 实现 SVM

```python
from sklearn.svm import SVC
from sklearn.datasets import load_iris, make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
import numpy as np

# ========== 线性SVM ==========

# 1. 加载数据
iris = load_iris()
X = iris.data[:100]  # 只取前2类（二分类）
y = iris.target[:100]

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 3. 特征缩放（SVM对特征尺度敏感）
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 4. 创建模型
# kernel: 核函数类型
# C: 正则化参数（软间隔）
# gamma: RBF核的系数
model = SVC(
    kernel='linear',  # 线性核
    C=1.0,            # 正则化参数
    random_state=42
)

# 5. 训练
model.fit(X_train_scaled, y_train)

# 6. 预测
y_pred = model.predict(X_test_scaled)

# 7. 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"线性SVM准确率: {accuracy:.2%}")

# 8. 查看支持向量
print(f"\n支持向量数量: {model.n_support_}")
print(f"支持向量索引: {model.support_}")

# ========== 非线性SVM（RBF核） ==========

# 1. 生成非线性数据
X_xor, y_xor = make_classification(
    n_samples=1000,
    n_features=2,
    n_informative=2,
    n_redundant=0,
    n_clusters_per_class=1,
    class_sep=0.5,
    random_state=42
)

# 2. 划分数据集
X_train_xor, X_test_xor, y_train_xor, y_test_xor = train_test_split(
    X_xor, y_xor, test_size=0.3, random_state=42
)

# 3. 特征缩放
scaler_xor = StandardScaler()
X_train_xor_scaled = scaler_xor.fit_transform(X_train_xor)
X_test_xor_scaled = scaler_xor.transform(X_test_xor)

# 4. 创建RBF核SVM
model_rbf = SVC(
    kernel='rbf',     # RBF核（高斯核）
    C=1.0,            # 正则化参数
    gamma='scale',    # 核系数
    random_state=42
)

# 5. 训练
model_rbf.fit(X_train_xor_scaled, y_train_xor)

# 6. 预测
y_pred_rbf = model_rbf.predict(X_test_xor_scaled)

# 7. 评估
accuracy_rbf = accuracy_score(y_test_xor, y_pred_rbf)
print(f"\nRBF核SVM准确率: {accuracy_rbf:.2%}")

# ========== 不同核函数对比 ==========

print("\n不同核函数对比：")
kernels = ['linear', 'poly', 'rbf', 'sigmoid']
for kernel in kernels:
    model = SVC(kernel=kernel, random_state=42)
    model.fit(X_train_xor_scaled, y_train_xor)
    y_pred = model.predict(X_test_xor_scaled)
    acc = accuracy_score(y_test_xor, y_pred)
    print(f"{kernel}核: {acc:.2%}")
```

### 参数调优

```python
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler

# SVM参数调优

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. 定义参数网格
param_grid = {
    'C': [0.1, 1, 10, 100],           # 正则化参数
    'gamma': ['scale', 'auto', 0.001, 0.01, 0.1],  # 核系数
    'kernel': ['rbf', 'linear', 'poly']  # 核函数
}

# 4. 创建网格搜索
grid = GridSearchCV(
    SVC(random_state=42),
    param_grid,
    cv=5,              # 5折交叉验证
    scoring='accuracy',
    n_jobs=-1          # 使用所有CPU核心
)

# 5. 执行搜索
grid.fit(X_scaled, y)

# 6. 查看结果
print(f"最佳参数: {grid.best_params_}")
print(f"最佳准确率: {grid.best_score_:.2%}")

# 7. 使用最佳模型
best_model = grid.best_estimator_
print(f"\n最佳模型: {best_model}")
```

### SVM 回归

```python
from sklearn.svm import SVR
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import numpy as np

# SVM也可以用于回归（支持向量回归，SVR）

# 1. 生成数据
X, y = make_regression(n_samples=1000, n_features=10, noise=0.1, random_state=42)

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 4. 创建SVR模型
# epsilon: 不敏感区域的宽度
model = SVR(
    kernel='rbf',
    C=1.0,
    epsilon=0.1,
    gamma='scale'
)

# 5. 训练
model.fit(X_train_scaled, y_train)

# 6. 预测
y_pred = model.predict(X_test_scaled)

# 7. 评估
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print(f"SVR均方误差: {mse:.2f}")
print(f"SVR均方根误差: {rmse:.2f}")
print(f"SVR R²分数: {r2:.4f}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 选择建议 |
| --- | --- | --- |
| 支持向量 | 离超平面最近的样本 | 决定分类边界 |
| 最大间隔 | 两类之间的距离 | 最大化间隔 |
| 线性核 | 线性分类 | 高维数据 |
| RBF核 | 非线性分类 | 最常用 |
| C参数 | 正则化强度 | C大严格，C小宽松 |
| gamma | RBF核宽度 | gamma大过拟合 |
| 软间隔 | 允许分类错误 | 避免过拟合 |
| 特征缩放 | 标准化 | 必须做 |

---

## 5 新手常见误区

### 误区 1："SVM不需要特征缩放"

**错！** SVM基于距离计算，特征尺度不同会导致偏差。必须做特征缩放。

### 误区 2："C越大越好"

**错！** C太大容易过拟合，太小容易欠拟合。需要通过交叉验证选择合适的C值。

### 误区 3："SVM只能做二分类"

不是的。SVM可以通过One-vs-One或One-vs-Rest策略处理多分类问题。sklearn的SVC默认支持多分类。

### 误区 4："SVM适合大数据集"

**错！** SVM训练时间复杂度O(n²)到O(n³)，不适合大数据集。大数据可以用线性SVM（LinearSVC）或其他算法。

### 误区 5："RBF核总是最好的"

不是的。RBF核适合大多数情况，但高维稀疏数据（如文本）用线性核更好。需要根据数据特点选择。

---

## 6 动手练习

### 练习 1：基础练习 - 二分类

使用SVM对乳腺癌数据集进行分类。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.svm import SVC
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
model = SVC(kernel='rbf', C=1.0, random_state=42)
model.fit(X_train_scaled, y_train)

# 预测和评估
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2%}")
```

</details>

### 练习 2：进阶练习 - 参数调优

使用网格搜索为SVM选择最佳参数。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV
from sklearn.preprocessing import StandardScaler

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 参数网格
param_grid = {
    'C': [0.1, 1, 10, 100],
    'gamma': ['scale', 'auto', 0.001, 0.01, 0.1],
    'kernel': ['rbf', 'linear']
}

# 网格搜索
grid = GridSearchCV(SVC(random_state=42), param_grid, cv=5, scoring='accuracy')
grid.fit(X_scaled, y)

print(f"最佳参数: {grid.best_params_}")
print(f"最佳准确率: {grid.best_score_:.2%}")
```

</details>

### 练习 3（挑战）：综合练习 - 非线性分类

使用SVM处理非线性分类问题，并可视化决策边界。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.svm import SVC
from sklearn.datasets import make_circles
from sklearn.preprocessing import StandardScaler

# 生成环形数据（非线性可分）
X, y = make_circles(n_samples=500, factor=0.5, noise=0.05, random_state=42)

# 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 训练SVM
model = SVC(kernel='rbf', C=1.0, gamma=1.0)
model.fit(X_scaled, y)

# 创建网格
x_min, x_max = X_scaled[:, 0].min() - 1, X_scaled[:, 0].max() + 1
y_min, y_max = X_scaled[:, 1].min() - 1, X_scaled[:, 1].max() + 1
xx, yy = np.meshgrid(
    np.arange(x_min, x_max, 0.02),
    np.arange(y_min, y_max, 0.02)
)

# 预测网格点
Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
Z = Z.reshape(xx.shape)

# 可视化
plt.figure(figsize=(10, 8))
plt.contourf(xx, yy, Z, alpha=0.3, cmap=plt.cm.coolwarm)
plt.scatter(X_scaled[:, 0], X_scaled[:, 1], c=y, cmap=plt.cm.coolwarm, edgecolors='k')
plt.title('SVM Decision Boundary (RBF Kernel)')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.show()

print(f"训练集准确率: {model.score(X_scaled, y):.2%}")
```

</details>

---

## 下一章预告

下一章我们会学习 **朴素贝叶斯** —— 一种基于概率论的分类算法。你会学到贝叶斯定理、先验概率、后验概率等概念，以及朴素贝叶斯在文本分类中的应用。
