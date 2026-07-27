---
title: "第11章：模型优化与调参"
description: "网格搜索、随机搜索、贝叶斯优化、学习曲线、验证曲线"
---

# 第11章：模型优化与调参

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是超参数？和模型参数有什么区别？
- 怎么找到最佳的超参数组合？
- 网格搜索和随机搜索有什么区别？
- 学习曲线能告诉我们什么？

这一章会带你掌握模型调优的核心方法，学会系统地寻找最佳参数，让模型性能达到最优。

---

## 1 为什么需要调参？

### 痛点分析

模型性能很大程度上取决于**超参数选择**：

- 决策树的深度：太浅欠拟合，太深过拟合
- SVM 的 C 参数：太小欠拟合，太大过拟合
- 随机森林的树数量：太少效果差，太多浪费计算

这就像**做菜放盐**——放少了没味道，放多了太咸。

### 解决方案

超参数调优就是**系统地搜索最佳参数组合**：

- **网格搜索**：穷举所有组合
- **随机搜索**：随机采样
- **贝叶斯优化**：智能搜索

> **一句话总结**：调参是让模型从"能用"变成"好用"的关键步骤。

---

## 2 网格搜索（Grid Search）

### 原理

网格搜索**穷举所有参数组合**，找到最好的那个。

### 代码示例

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 定义参数网格
param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [None, 5, 10, 20],
    "min_samples_split": [2, 5, 10],
    "min_samples_leaf": [1, 2, 4]
}

# 创建网格搜索
# estimator: 模型
# param_grid: 参数网格
# cv: 交叉验证折数
# scoring: 评估指标
# n_jobs: 并行作业数
grid_search = GridSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_grid=param_grid,
    cv=5,
    scoring="accuracy",
    n_jobs=-1,
    verbose=1
)

# 训练（会自动搜索所有组合）
grid_search.fit(X_train, y_train)

# 查看结果
print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳准确率: {grid_search.best_score_:.2%}")

# 使用最佳模型
best_model = grid_search.best_estimator_
test_accuracy = best_model.score(X_test, y_test)
print(f"测试集准确率: {test_accuracy:.2%}")

# 查看所有结果
cv_results = pd.DataFrame(grid_search.cv_results_)
print(f"\n总共测试了 {len(cv_results)} 种参数组合")
print(f"前 5 种组合:")
print(cv_results.nlargest(5, "mean_test_score")[["params", "mean_test_score"]])
```

---

## 3 随机搜索（Random Search）

### 原理

随机搜索**随机采样参数组合**，比网格搜索更高效。

### 代码示例

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint

# 定义参数分布
param_dist = {
    "n_estimators": randint(50, 300),
    "max_depth": [None, 5, 10, 20, 30],
    "min_samples_split": randint(2, 20),
    "min_samples_leaf": randint(1, 10)
}

# 创建随机搜索
# n_iter: 采样次数
random_search = RandomizedSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_distributions=param_dist,
    n_iter=50,  # 随机采样 50 次
    cv=5,
    scoring="accuracy",
    n_jobs=-1,
    random_state=42,
    verbose=1
)

# 训练
random_search.fit(X_train, y_train)

# 查看结果
print(f"最佳参数: {random_search.best_params_}")
print(f"最佳准确率: {random_search.best_score_:.2%}")
```

### 网格搜索 vs 随机搜索

| 特性 | 网格搜索 | 随机搜索 |
| --- | --- | --- |
| 搜索方式 | 穷举 | 随机采样 |
| 计算成本 | 高（指数级） | 低（可控） |
| 适用场景 | 参数少、范围小 | 参数多、范围大 |
| 找到最优 | 一定能 | 概率高 |

---

## 4 学习曲线

### 概念解释

学习曲线展示**训练集和验证集性能随训练样本数的变化**：

- **高偏差（欠拟合）**：训练集和验证集性能都低
- **高方差（过拟合）**：训练集性能高，验证集性能低
- **理想情况**：两者接近且都高

### 代码示例

```python
from sklearn.model_selection import learning_curve
import matplotlib.pyplot as plt
import numpy as np

# 生成学习曲线数据
train_sizes, train_scores, test_scores = learning_curve(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    X=data.data,
    y=data.target,
    cv=5,
    train_sizes=np.linspace(0.1, 1.0, 10),
    n_jobs=-1
)

# 计算均值和标准差
train_mean = train_scores.mean(axis=1)
train_std = train_scores.std(axis=1)
test_mean = test_scores.mean(axis=1)
test_std = test_scores.std(axis=1)

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_mean, "o-", label="训练集")
plt.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.2)
plt.plot(train_sizes, test_mean, "o-", label="验证集")
plt.fill_between(train_sizes, test_mean - test_std, test_mean + test_std, alpha=0.2)

plt.xlabel("训练样本数")
plt.ylabel("准确率")
plt.title("学习曲线")
plt.legend()
plt.grid(alpha=0.3)
plt.show()

# 分析
if test_mean[-1] < 0.9:
    print("诊断: 欠拟合，需要更复杂的模型或更多特征")
elif train_mean[-1] - test_mean[-1] > 0.1:
    print("诊断: 过拟合，需要正则化或更多数据")
else:
    print("诊断: 模型表现良好")
```

---

## 5 验证曲线

### 概念解释

验证曲线展示**性能随单个超参数的变化**：

- 帮助理解参数对模型的影响
- 找到参数的最佳范围

### 代码示例

```python
from sklearn.model_selection import validation_curve

# 生成验证曲线数据
param_range = [1, 2, 5, 10, 20, 30, None]
train_scores, test_scores = validation_curve(
    estimator=DecisionTreeClassifier(random_state=42),
    X=data.data,
    y=data.target,
    param_name="max_depth",
    param_range=param_range,
    cv=5,
    n_jobs=-1
)

# 计算均值
train_mean = train_scores.mean(axis=1)
test_mean = test_scores.mean(axis=1)

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(param_range, train_mean, "o-", label="训练集")
plt.plot(param_range, test_mean, "o-", label="验证集")

plt.xlabel("max_depth")
plt.ylabel("准确率")
plt.title("验证曲线（决策树深度）")
plt.legend()
plt.grid(alpha=0.3)
plt.show()

# 找到最佳参数
best_idx = test_mean.argmax()
print(f"最佳 max_depth: {param_range[best_idx]}")
print(f"最佳验证准确率: {test_mean[best_idx]:.2%}")
```

---

## 6 贝叶斯优化（进阶）

### 原理

贝叶斯优化**智能地搜索参数空间**：

- 构建参数的概率模型
- 选择最有希望的参数组合测试
- 比随机搜索更高效

### 代码示例（使用 scikit-optimize）

```python
# pip install scikit-optimize
from skopt import BayesSearchCV
from skopt.space import Integer, Real, Categorical

# 定义参数空间
param_space = [
    Integer(50, 300, name="n_estimators"),
    Integer(1, 30, name="max_depth"),
    Integer(2, 20, name="min_samples_split"),
    Integer(1, 10, name="min_samples_leaf"),
    Categorical(["gini", "entropy"], name="criterion")
]

# 创建贝叶斯搜索
bayes_search = BayesSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    search_spaces=param_space,
    n_iter=50,
    cv=5,
    scoring="accuracy",
    n_jobs=-1,
    random_state=42
)

# 训练
bayes_search.fit(X_train, y_train)

print(f"最佳参数: {bayes_search.best_params_}")
print(f"最佳准确率: {bayes_search.best_score_:.2%}")
```

---

## 7 新手常见误区

### 误区 1："参数越多越好"

**错！** 参数太多会导致搜索空间爆炸，计算成本过高。应该先搜索重要参数。

### 误区 2："网格搜索一定能找到最优"

不是的。网格搜索只能找到**网格内的最优**，如果网格范围不对，可能错过真正最优。

### 误区 3："不需要交叉验证"

**错！** 调参时应该用交叉验证，避免在固定验证集上过拟合。

### 误区 4："学习曲线不重要"

**错！** 学习曲线能帮你诊断模型是欠拟合还是过拟合，指导后续优化方向。

### 误区 5："调参只在训练集上做"

**错！** 调参后应该在**独立的测试集**上评估，否则会高估模型性能。

---

## 8 动手练习

### 练习 1：基础练习

用网格搜索为决策树找到最佳的 `max_depth` 和 `min_samples_split`。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.tree import DecisionTreeClassifier

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 定义参数网格
param_grid = {
    "max_depth": [2, 3, 5, 7, 10, None],
    "min_samples_split": [2, 5, 10, 20]
}

# 网格搜索
grid_search = GridSearchCV(
    DecisionTreeClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring="accuracy"
)

grid_search.fit(X_train, y_train)

print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳交叉验证准确率: {grid_search.best_score_:.2%}")
print(f"测试集准确率: {grid_search.score(X_test, y_test):.2%}")
```

</details>

### 练习 2：进阶练习

绘制随机森林的学习曲线，分析模型是欠拟合还是过拟合。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import learning_curve
import matplotlib.pyplot as plt
import numpy as np

# 加载数据
data = load_breast_cancer()

# 生成学习曲线
train_sizes, train_scores, test_scores = learning_curve(
    RandomForestClassifier(n_estimators=100, random_state=42),
    data.data,
    data.target,
    cv=5,
    train_sizes=np.linspace(0.1, 1.0, 10),
    n_jobs=-1
)

# 计算均值
train_mean = train_scores.mean(axis=1)
test_mean = test_scores.mean(axis=1)

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_mean, "o-", label="训练集")
plt.plot(train_sizes, test_mean, "o-", label="验证集")
plt.xlabel("训练样本数")
plt.ylabel("准确率")
plt.title("随机森林学习曲线")
plt.legend()
plt.grid(alpha=0.3)
plt.show()

# 分析
gap = train_mean[-1] - test_mean[-1]
print(f"训练集最终准确率: {train_mean[-1]:.2%}")
print(f"验证集最终准确率: {test_mean[-1]:.2%}")
print(f"差距: {gap:.2%}")

if gap > 0.1:
    print("诊断: 过拟合，考虑增加数据或正则化")
elif test_mean[-1] < 0.9:
    print("诊断: 欠拟合，考虑更复杂的模型")
else:
    print("诊断: 模型表现良好")
```

</details>

### 练习 3（挑战）：综合练习

用随机搜索为 SVM 找到最佳参数（C、gamma、kernel），并对比网格搜索的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, GridSearchCV, RandomizedSearchCV
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from scipy.stats import loguniform
import time

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 标准化
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 参数网格
param_grid = {
    "C": [0.1, 1, 10, 100],
    "gamma": [0.001, 0.01, 0.1, 1],
    "kernel": ["linear", "rbf"]
}

# 1. 网格搜索
start = time.time()
grid_search = GridSearchCV(SVC(), param_grid, cv=5, n_jobs=-1)
grid_search.fit(X_train_scaled, y_train)
grid_time = time.time() - start

print("网格搜索:")
print(f"  最佳参数: {grid_search.best_params_}")
print(f"  最佳准确率: {grid_search.best_score_:.2%}")
print(f"  耗时: {grid_time:.2f}秒")

# 2. 随机搜索
param_dist = {
    "C": loguniform(0.1, 100),
    "gamma": loguniform(0.001, 1),
    "kernel": ["linear", "rbf"]
}

start = time.time()
random_search = RandomizedSearchCV(SVC(), param_dist, n_iter=20, cv=5, n_jobs=-1, random_state=42)
random_search.fit(X_train_scaled, y_train)
random_time = time.time() - start

print("\n随机搜索:")
print(f"  最佳参数: {random_search.best_params_}")
print(f"  最佳准确率: {random_search.best_score_:.2%}")
print(f"  耗时: {random_time:.2f}秒")

print(f"\n结论: 随机搜索更快，但网格搜索更彻底")
```

</details>

---

## 9 下一章预告

下一章我们会学习 **特征选择**——过滤法、包装法、嵌入法。你会学到如何挑选最有用的特征，去掉冗余和噪声，让模型更快更准。
