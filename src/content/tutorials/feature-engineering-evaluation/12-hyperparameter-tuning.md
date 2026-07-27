---
title: "第12章：超参数调优"
description: "网格搜索、随机搜索、贝叶斯优化、学习曲线分析"
---

# 第12章：超参数调优

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是超参数？和模型参数有什么区别？
- 怎么找到最优的超参数组合？
- 网格搜索和随机搜索有什么区别？
- 学习曲线能告诉我们什么？

这一章就是为了解答这些问题。超参数调优是提升模型性能的 **关键步骤**，好的参数能让模型表现大幅提升。

---

## 1 为什么需要超参数调优？

### 痛点分析

模型有两类参数：

| 类型 | 说明 | 例子 | 学习方式 |
| --- | --- | --- | --- |
| 模型参数 | 模型从数据中学到的 | 线性回归的系数 | 自动学习 |
| 超参数 | 人为设定的配置 | 学习率、树的深度 | 需要手动调 |

默认参数通常不是最优的，需要调优才能发挥模型的最大潜力。

> **一句话总结**：超参数调优就是找到模型的"最佳配置"，让它表现最好。

---

## 2 核心原理

### 调优方法对比

| 方法 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 网格搜索 | 穷举所有参数组合 | 全面，能找到全局最优 | 计算成本高 |
| 随机搜索 | 随机采样参数组合 | 效率高，适合高维 | 可能错过最优 |
| 贝叶斯优化 | 用概率模型指导搜索 | 效率高，智能 | 实现复杂 |
| 梯度优化 | 对超参数求梯度 | 理论上最优 | 计算成本极高 |

---

## 3 基础用法

### 网格搜索（GridSearchCV）

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
import numpy as np

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.3, random_state=42
)

# 定义参数网格
param_grid = {
    'n_estimators': [50, 100, 200],      # 树的数量
    'max_depth': [None, 5, 10, 15],       # 最大深度
    'min_samples_split': [2, 5, 10],      # 内部节点再划分所需最小样本数
    'min_samples_leaf': [1, 2, 4]         # 叶子节点最少样本数
}

print(f"参数组合总数: {3 * 4 * 3 * 4} = {3*4*3*4}")

# 网格搜索
model = RandomForestClassifier(random_state=42)
grid_search = GridSearchCV(
    estimator=model,
    param_grid=param_grid,
    cv=5,                    # 5 折交叉验证
    scoring='accuracy',      # 评估指标
    n_jobs=-1,               # 使用所有 CPU 核心
    verbose=1                # 显示进度
)

grid_search.fit(X_train, y_train)

print(f"\n最优参数: {grid_search.best_params_}")
print(f"最优交叉验证准确率: {grid_search.best_score_:.4f}")

# 用最优模型预测
best_model = grid_search.best_estimator_
test_score = best_model.score(X_test, y_test)
print(f"测试集准确率: {test_score:.4f}")
```

> **原理**：网格搜索穷举所有参数组合，用交叉验证评估每组参数，选择表现最好的。

### 随机搜索（RandomizedSearchCV）

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint

# 定义参数分布
param_dist = {
    'n_estimators': randint(50, 300),
    'max_depth': [None, 5, 10, 15, 20],
    'min_samples_split': randint(2, 20),
    'min_samples_leaf': randint(1, 10)
}

# 随机搜索
random_search = RandomizedSearchCV(
    estimator=model,
    param_distributions=param_dist,
    n_iter=50,               # 随机采样 50 次
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42,
    verbose=1
)

random_search.fit(X_train, y_train)

print(f"\n最优参数: {random_search.best_params_}")
print(f"最优交叉验证准确率: {random_search.best_score_:.4f}")
```

> **原理**：随机搜索从参数分布中随机采样，适合参数空间大、维度高的情况。

---

## 4 进阶用法

### 贝叶斯优化（使用 Optuna）

```python
# pip install optuna
import optuna

def objective(trial):
    # 定义参数空间
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 300),
        'max_depth': trial.suggest_int('max_depth', 3, 20),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10)
    }
    
    # 训练模型
    model = RandomForestClassifier(**params, random_state=42)
    
    # 交叉验证
    from sklearn.model_selection import cross_val_score
    scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
    return scores.mean()

# 创建研究
study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100, show_progress_bar=True)

print(f"\n最优参数: {study.best_params}")
print(f"最优准确率: {study.best_value:.4f}")
```

> **原理**：贝叶斯优化用概率模型（如高斯过程）来预测哪些参数组合可能表现好，智能地选择下一个尝试的点。

### 学习曲线分析

```python
from sklearn.model_selection import learning_curve
import matplotlib.pyplot as plt

# 生成学习曲线数据
train_sizes, train_scores, val_scores = learning_curve(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    X=X_train,
    y=y_train,
    cv=5,
    scoring='accuracy',
    train_sizes=np.linspace(0.1, 1.0, 10),
    n_jobs=-1
)

# 计算均值和标准差
train_mean = train_scores.mean(axis=1)
train_std = train_scores.std(axis=1)
val_mean = val_scores.mean(axis=1)
val_std = val_scores.std(axis=1)

# 可视化
plt.figure(figsize=(10, 6))
plt.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.1, color='blue')
plt.fill_between(train_sizes, val_mean - val_std, val_mean + val_std, alpha=0.1, color='orange')
plt.plot(train_sizes, train_mean, 'o-', color='blue', label='训练集')
plt.plot(train_sizes, val_mean, 'o-', color='orange', label='验证集')
plt.xlabel('训练集大小')
plt.ylabel('准确率')
plt.title('学习曲线')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

> **原理**：学习曲线展示模型在不同训练集大小下的表现。如果训练集和验证集曲线差距大，说明过拟合；如果都低，说明欠拟合。

### 验证曲线

```python
from sklearn.model_selection import validation_curve

# 验证单个超参数的影响
param_range = [1, 5, 10, 15, 20, 30, 50]
train_scores, val_scores = validation_curve(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    X=X_train,
    y=y_train,
    param_name='max_depth',
    param_range=param_range,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)

# 可视化
train_mean = train_scores.mean(axis=1)
val_mean = val_scores.mean(axis=1)

plt.figure(figsize=(10, 6))
plt.plot(param_range, train_mean, 'o-', label='训练集')
plt.plot(param_range, val_mean, 'o-', label='验证集')
plt.xlabel('max_depth')
plt.ylabel('准确率')
plt.title('验证曲线')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

> **原理**：验证曲线展示单个超参数对模型性能的影响，帮助理解参数的作用。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 网格搜索 | 穷举所有组合，全面但慢 |
| 随机搜索 | 随机采样，效率高 |
| 贝叶斯优化 | 智能搜索，效率最高 |
| 学习曲线 | 判断过拟合/欠拟合 |
| 验证曲线 | 分析单个参数的影响 |

---

## 6 新手常见误区

### 误区 1："参数越多越好"

**错！** 参数空间太大会导致搜索时间过长，而且可能过拟合验证集。

正确做法：先用大范围搜索找到大致范围，再在小范围内精细搜索。

### 误区 2："网格搜索一定比随机搜索好"

不对。参数空间大时，网格搜索计算成本太高。随机搜索在相同时间内能探索更多区域。

正确做法：参数少（<3 个）用网格搜索，参数多用随机搜索或贝叶斯优化。

### 误区 3："忽略学习曲线分析"

不是的。学习曲线能告诉你模型是过拟合还是欠拟合，指导后续优化方向。

正确做法：调参前先画学习曲线，判断问题所在。

---

## 7 动手练习

### 练习 1：基础练习

对逻辑回归模型做网格搜索，调优 C 和 penalty 参数。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV

param_grid = {
    'C': [0.01, 0.1, 1, 10, 100],
    'penalty': ['l1', 'l2'],
    'solver': ['liblinear']
}

model = LogisticRegression(max_iter=10000, random_state=42)
grid = GridSearchCV(model, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid.fit(X_train, y_train)

print(f"最优参数: {grid.best_params_}")
print(f"最优准确率: {grid.best_score_:.4f}")
```

</details>

### 练习 2：进阶练习

使用随机搜索调优梯度提升模型，并绘制学习曲线。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import RandomizedSearchCV, learning_curve

# 随机搜索
param_dist = {
    'n_estimators': randint(50, 300),
    'learning_rate': [0.01, 0.05, 0.1, 0.2],
    'max_depth': randint(3, 10),
    'subsample': [0.8, 0.9, 1.0]
}

model = GradientBoostingClassifier(random_state=42)
random_search = RandomizedSearchCV(model, param_dist, n_iter=30, cv=5, random_state=42)
random_search.fit(X_train, y_train)

print(f"最优参数: {random_search.best_params_}")

# 学习曲线
train_sizes, train_scores, val_scores = learning_curve(
    random_search.best_estimator_, X_train, y_train, cv=5,
    train_sizes=np.linspace(0.1, 1.0, 10)
)

plt.plot(train_sizes, train_scores.mean(axis=1), label='训练集')
plt.plot(train_sizes, val_scores.mean(axis=1), label='验证集')
plt.legend()
plt.show()
```

</details>

### 练习 3（挑战）：综合练习

比较网格搜索、随机搜索、贝叶斯优化在相同时间内的调优效果。

<details>
<summary>点击查看答案</summary>

```python
import time
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV

# 定义参数空间
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, 15],
    'min_samples_split': [2, 5, 10]
}

model = RandomForestClassifier(random_state=42)

# 网格搜索
start = time.time()
grid = GridSearchCV(model, param_grid, cv=5, n_jobs=-1)
grid.fit(X_train, y_train)
grid_time = time.time() - start
print(f"网格搜索: 准确率={grid.best_score_:.4f}, 时间={grid_time:.2f}s")

# 随机搜索（相同时间）
n_iter = int(grid_time / 0.5)  # 假设每次评估 0.5 秒
random = RandomizedSearchCV(model, param_grid, n_iter=n_iter, cv=5, random_state=42, n_jobs=-1)
random.fit(X_train, y_train)
print(f"随机搜索: 准确率={random.best_score_:.4f}, 迭代次数={n_iter}")
```

</details>

---

## 下一章预告

下一章我们会学习 **模型对比与选择**——如何比较多个模型，选择最适合的，以及模型融合技术。
