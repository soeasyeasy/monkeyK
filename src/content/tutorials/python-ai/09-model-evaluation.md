---
title: "第9章：模型评估与优化"
description: "掌握交叉验证、网格搜索、正则化，让模型更准确"
---

# 第9章：模型评估与优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何准确评估模型的性能？
- 什么是过拟合？如何防止？
- 如何选择最优的超参数？
- 交叉验证和网格搜索是什么？

这一章就是为了解答这些问题。模型评估和优化是机器学习的核心技能，决定了模型在实际应用中的表现。

---

## 1 为什么需要模型评估？

### 痛点分析

假设你训练了一个模型，在训练集上准确率 99%：

```python
# ❌ 只看训练集准确率
print("训练集准确率:", 0.99)  # 看起来很好！

# 但在测试集上只有 60%
print("测试集准确率:", 0.60)  # 实际效果很差
```

**问题**：模型在训练集上表现好，在新数据上表现差（过拟合）。

> **一句话总结**：评估模型要用"未见过"的数据。

### 生活化类比

打个比方：

> 评估模型就像考试。
> 训练集是平时作业，测试集是期末考试。
> 平时作业做得好，不代表期末考试也能考好。

---

## 2 交叉验证

### 概念解释

交叉验证把数据分成 K 份，轮流用其中 K-1 份训练，1 份测试：

```
5折交叉验证：

第1次：[训练 训练 训练 训练 | 测试]
第2次：[训练 训练 训练 测试 | 训练]
第3次：[训练 训练 测试 训练 | 训练]
第4次：[训练 测试 训练 训练 | 训练]
第5次：[测试 训练 训练 训练 | 训练]

最终结果 = 5次的平均
```

### 代码实现

```python
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 创建模型
model = LogisticRegression(random_state=42, max_iter=200)

# 5折交叉验证
scores = cross_val_score(model, X, y, cv=5)

print("每次验证的准确率:", scores)
print("平均准确率:", scores.mean())
print("标准差:", scores.std())
```

### 分层交叉验证

保持每折中各类别的比例：

```python
from sklearn.model_selection import StratifiedKFold

# 分层5折交叉验证
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=skf)

print("分层交叉验证准确率:", scores.mean())
```

---

## 3 网格搜索

### 概念解释

网格搜索遍历所有超参数组合，找到最优参数：

```python
# 参数网格
param_grid = {
    'C': [0.1, 1, 10],        # 3个值
    'max_iter': [100, 200]    # 2个值
}

# 总共 3 × 2 = 6 种组合
# 每种组合都做交叉验证
# 返回最好的参数
```

### 代码实现

```python
from sklearn.model_selection import GridSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 创建模型
model = LogisticRegression(random_state=42)

# 定义参数网格
param_grid = {
    'C': [0.1, 1, 10, 100],
    'max_iter': [100, 200, 300],
    'solver': ['lbfgs', 'liblinear']
}

# 创建网格搜索（5折交叉验证）
grid_search = GridSearchCV(
    model, 
    param_grid, 
    cv=5, 
    scoring='accuracy',
    n_jobs=-1  # 使用所有CPU核心
)

# 执行搜索
grid_search.fit(X, y)

# 输出结果
print("最优参数:", grid_search.best_params_)
print("最高准确率:", grid_search.best_score_)

# 使用最优模型
best_model = grid_search.best_estimator_
```

### 随机搜索

参数多时，随机搜索更快：

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import uniform

# 定义参数分布
param_dist = {
    'C': uniform(0.1, 100),  # 均匀分布
    'max_iter': [100, 200, 300]
}

# 随机搜索（迭代10次）
random_search = RandomizedSearchCV(
    model,
    param_dist,
    n_iter=10,
    cv=5,
    random_state=42
)

random_search.fit(X, y)
print("随机搜索最优参数:", random_search.best_params_)
```

---

## 4 正则化

### 概念解释

正则化防止过拟合，限制模型复杂度：

```
损失函数 = 原始损失 + 正则化项

L1正则化（Lasso）：加 |w| 的和
L2正则化（Ridge）：加 w² 的和
```

### 生活化类比

> 正则化就像给模型"减肥"。
> 防止模型太"胖"（太复杂），记住噪声而不是规律。

### L1 和 L2 正则化

```python
from sklearn.linear_model import LogisticRegression

# L2正则化（默认）
model_l2 = LogisticRegression(penalty='l2', C=1.0)

# L1正则化（可以做特征选择）
model_l1 = LogisticRegression(penalty='l1', solver='liblinear', C=1.0)

# C 是正则化强度的倒数
# C 越小，正则化越强
# C 越大，正则化越弱
```

### 弹性网络

结合 L1 和 L2：

```python
from sklearn.linear_model import ElasticNet

# 弹性网络（L1 + L2）
model = ElasticNet(alpha=0.1, l1_ratio=0.5)
# alpha：正则化强度
# l1_ratio：L1 的比例（0.5 表示 L1 和 L2 各占一半）
```

---

## 5 学习曲线

### 概念解释

学习曲线展示训练集和验证集的性能随数据量的变化：

```
准确率
  ↑
  |        验证集曲线
  |       /
  |      /
  |     /‾‾‾‾‾‾‾‾
  |    / 训练集曲线
  |   / /
  |  / /
  | / /
  |/ /
  +----------------→ 数据量
```

### 代码实现

```python
from sklearn.model_selection import learning_curve
import matplotlib.pyplot as plt
import numpy as np

# 生成学习曲线数据
train_sizes, train_scores, val_scores = learning_curve(
    model, X, y,
    train_sizes=np.linspace(0.1, 1.0, 10),
    cv=5,
    scoring='accuracy'
)

# 计算平均值和标准差
train_mean = train_scores.mean(axis=1)
train_std = train_scores.std(axis=1)
val_mean = val_scores.mean(axis=1)
val_std = val_scores.std(axis=1)

# 绘制学习曲线
plt.plot(train_sizes, train_mean, 'o-', label='训练集')
plt.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.1)
plt.plot(train_sizes, val_mean, 'o-', label='验证集')
plt.fill_between(train_sizes, val_mean - val_std, val_mean + val_std, alpha=0.1)
plt.xlabel('训练数据量')
plt.ylabel('准确率')
plt.title('学习曲线')
plt.legend()
plt.show()
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 交叉验证 | K 折交叉验证，更准确的评估 |
| 网格搜索 | 遍历所有参数组合 |
| 随机搜索 | 随机采样参数组合，更快 |
| L1 正则化 | Lasso，可以做特征选择 |
| L2 正则化 | Ridge，防止过拟合 |
| 学习曲线 | 诊断过拟合/欠拟合 |

---

## 7 新手常见误区

### 误区 1："只看训练集准确率"

**错！** 必须用交叉验证或独立的测试集：

```python
# ❌ 错误：只看训练集
model.fit(X_train, y_train)
print("训练集准确率:", model.score(X_train, y_train))

# ✅ 正确：用交叉验证
scores = cross_val_score(model, X, y, cv=5)
print("交叉验证准确率:", scores.mean())
```

### 误区 2："参数越多越好"

不是的。参数太多会过拟合：

```python
# ❌ 错误：搜索太多参数
param_grid = {
    'C': [0.001, 0.01, 0.1, 1, 10, 100, 1000],
    'max_iter': [100, 200, 300, 400, 500]
}

# ✅ 正确：合理范围
param_grid = {
    'C': [0.1, 1, 10],
    'max_iter': [100, 200]
}
```

### 误区 3："正则化越强越好"

正则化太强会导致欠拟合：

```python
# ❌ 错误：C 太小（正则化太强）
model = LogisticRegression(C=0.001)  # 可能欠拟合

# ✅ 正确：通过交叉验证选择 C
param_grid = {'C': [0.1, 1, 10]}
grid_search = GridSearchCV(model, param_grid, cv=5)
```

---

## 8 动手练习

### 练习 1：基础练习

对 Iris 数据集进行 5 折交叉验证，计算平均准确率。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 创建模型
model = LogisticRegression(random_state=42, max_iter=200)

# 5折交叉验证
scores = cross_val_score(model, X, y, cv=5)

print("每次验证的准确率:", scores)
print("平均准确率:", scores.mean())
print("标准差:", scores.std())
```

</details>

### 练习 2：进阶练习

用网格搜索找到逻辑回归的最优参数（C 和 max_iter）。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.model_selection import GridSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 创建模型
model = LogisticRegression(random_state=42)

# 定义参数网格
param_grid = {
    'C': [0.1, 1, 10, 100],
    'max_iter': [100, 200, 300]
}

# 网格搜索
grid_search = GridSearchCV(model, param_grid, cv=5, scoring='accuracy')
grid_search.fit(X, y)

print("最优参数:", grid_search.best_params_)
print("最高准确率:", grid_search.best_score_)
```

</details>

### 练习 3（挑战）：综合练习

绘制学习曲线，判断模型是否过拟合。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.model_selection import learning_curve
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
import matplotlib.pyplot as plt
import numpy as np

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 创建模型
model = LogisticRegression(random_state=42, max_iter=200)

# 生成学习曲线数据
train_sizes, train_scores, val_scores = learning_curve(
    model, X, y,
    train_sizes=np.linspace(0.1, 1.0, 10),
    cv=5,
    scoring='accuracy'
)

# 计算平均值
train_mean = train_scores.mean(axis=1)
val_mean = val_scores.mean(axis=1)

# 绘制
plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_mean, 'o-', label='训练集', color='blue')
plt.plot(train_sizes, val_mean, 'o-', label='验证集', color='orange')
plt.xlabel('训练数据量')
plt.ylabel('准确率')
plt.title('学习曲线')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

# 分析
if train_mean[-1] > val_mean[-1] + 0.05:
    print("模型可能过拟合")
elif train_mean[-1] < 0.8 and val_mean[-1] < 0.8:
    print("模型可能欠拟合")
else:
    print("模型表现良好")
```

</details>

---

## 下一章预告

下一章我们会学习 **深度学习基础**——神经网络、激活函数、反向传播，进入深度学习的世界。
