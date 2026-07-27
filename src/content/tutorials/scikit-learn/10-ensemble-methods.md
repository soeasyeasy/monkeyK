---
title: "第10章：集成学习方法"
description: "随机森林、Gradient Boosting、AdaBoost、Voting、Stacking"
---

# 第10章：集成学习方法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是集成学习？为什么要组合多个模型？
- 随机森林是怎么工作的？
- Bagging 和 Boosting 有什么区别？
- Stacking 和 Voting 怎么用？

这一章会带你掌握集成学习的核心原理和实战应用，学会组合多个弱模型构建强模型。

---

## 1 为什么需要集成学习？

### 痛点分析

单个模型往往有局限性：

- 决策树容易过拟合
- 线性模型只能处理线性关系
- 不同模型在不同数据上表现不同

这就像**一个人做决策**——容易有偏见和盲区。

### 解决方案

集成学习通过**组合多个模型**做出更稳健的预测：

- **Bagging**：并行训练多个模型，投票/平均
- **Boosting**：串行训练，后续模型纠正前面的错误
- **Stacking**：用元模型组合多个基模型的预测

打个比方：

> 集成学习就像**专家会诊**——多个医生一起讨论，比单个医生诊断更准确。

---

## 2 Bagging：随机森林

### 原理

随机森林 = 多棵决策树 + 投票

1. 从原始数据中有放回地抽样（Bootstrap）
2. 每棵树用不同的子集训练
3. 预测时，所有树投票，多数胜

### 代码示例

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 创建随机森林
# n_estimators: 树的数量
# max_depth: 树的最大深度
# random_state: 随机种子
rf = RandomForestClassifier(
    n_estimators=100,
    max_depth=None,
    random_state=42,
    n_jobs=-1  # 使用所有 CPU 核心
)

# 训练
rf.fit(X_train, y_train)

# 预测
y_pred = rf.predict(X_test)
print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")

# 交叉验证
scores = cross_val_score(rf, data.data, data.target, cv=5)
print(f"交叉验证准确率: {scores.mean():.2%} (+/- {scores.std() * 2:.2%})")

# 特征重要性
importances = rf.feature_importances_
feature_names = data.feature_names

# 显示前 10 个重要特征
indices = importances.argsort()[::-1][:10]
print("\n前 10 个重要特征:")
for i in indices:
    print(f"  {feature_names[i]}: {importances[i]:.4f}")
```

### 参数调优

```python
from sklearn.model_selection import GridSearchCV

# 参数网格
param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [None, 5, 10],
    "min_samples_split": [2, 5, 10]
}

# 网格搜索
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)

grid_search.fit(X_train, y_train)
print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳准确率: {grid_search.best_score_:.2%}")
```

---

## 3 Boosting：AdaBoost 和 Gradient Boosting

### AdaBoost 原理

1. 训练第一个弱模型
2. 对分错的样本增加权重
3. 训练下一个模型，更关注分错的样本
4. 组合所有模型，加权投票

### 代码示例

```python
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier

# 创建 AdaBoost
# base_estimator: 基学习器（通常是浅层决策树）
# n_estimators: 模型数量
# learning_rate: 学习率，控制每个模型的贡献
ada = AdaBoostClassifier(
    base_estimator=DecisionTreeClassifier(max_depth=1),
    n_estimators=50,
    learning_rate=1.0,
    random_state=42
)

# 训练
ada.fit(X_train, y_train)

# 预测
y_pred = ada.predict(X_test)
print(f"AdaBoost 准确率: {accuracy_score(y_test, y_pred):.2%}")
```

### Gradient Boosting 原理

1. 计算当前模型的残差（预测值 - 真实值）
2. 训练新模型预测残差
3. 更新模型：原模型 + 学习率 × 新模型
4. 重复 2-3

### 代码示例

```python
from sklearn.ensemble import GradientBoostingClassifier

# 创建 Gradient Boosting
gb = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    random_state=42
)

# 训练
gb.fit(X_train, y_train)

# 预测
y_pred = gb.predict(X_test)
print(f"Gradient Boosting 准确率: {accuracy_score(y_test, y_pred):.2%}")

# 特征重要性
importances = gb.feature_importances_
print("\n前 5 个重要特征:")
for i in importances.argsort()[::-1][:5]:
    print(f"  {feature_names[i]}: {importances[i]:.4f}")
```

---

## 4 Voting：投票法

### 原理

多个模型各自预测，然后投票（分类）或平均（回归）。

### 代码示例

```python
from sklearn.ensemble import VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC

# 定义基模型
models = [
    ("lr", LogisticRegression(max_iter=1000)),
    ("dt", DecisionTreeClassifier(random_state=42)),
    ("svm", SVC(kernel="linear", probability=True, random_state=42))
]

# 硬投票：直接投票
voting_hard = VotingClassifier(estimators=models, voting="hard")
voting_hard.fit(X_train, y_train)
y_pred_hard = voting_hard.predict(X_test)
print(f"硬投票准确率: {accuracy_score(y_test, y_pred_hard):.2%}")

# 软投票：基于概率投票
voting_soft = VotingClassifier(estimators=models, voting="soft")
voting_soft.fit(X_train, y_train)
y_pred_soft = voting_soft.predict(X_test)
print(f"软投票准确率: {accuracy_score(y_test, y_pred_soft):.2%}")
```

---

## 5 Stacking：堆叠法

### 原理

1. 训练多个基模型
2. 用基模型的预测作为新特征
3. 训练一个元模型（meta-model）组合这些预测

### 代码示例

```python
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier

# 定义基模型
base_models = [
    ("lr", LogisticRegression(max_iter=1000)),
    ("dt", DecisionTreeClassifier(random_state=42)),
    ("rf", RandomForestClassifier(n_estimators=100, random_state=42))
]

# 创建 Stacking
# final_estimator: 元模型
stacking = StackingClassifier(
    estimators=base_models,
    final_estimator=LogisticRegression(max_iter=1000),
    cv=5
)

# 训练
stacking.fit(X_train, y_train)

# 预测
y_pred = stacking.predict(X_test)
print(f"Stacking 准确率: {accuracy_score(y_test, y_pred):.2%}")
```

---

## 6 算法对比

```python
from sklearn.ensemble import (
    RandomForestClassifier,
    AdaBoostClassifier,
    GradientBoostingClassifier,
    VotingClassifier,
    StackingClassifier
)
from sklearn.model_selection import cross_val_score

# 定义模型
models = {
    "随机森林": RandomForestClassifier(n_estimators=100, random_state=42),
    "AdaBoost": AdaBoostClassifier(n_estimators=50, random_state=42),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
    "Voting": VotingClassifier(
        estimators=[
            ("lr", LogisticRegression(max_iter=1000)),
            ("dt", DecisionTreeClassifier(random_state=42)),
            ("rf", RandomForestClassifier(n_estimators=100, random_state=42))
        ],
        voting="soft"
    ),
    "Stacking": StackingClassifier(
        estimators=[
            ("lr", LogisticRegression(max_iter=1000)),
            ("dt", DecisionTreeClassifier(random_state=42)),
            ("rf", RandomForestClassifier(n_estimators=100, random_state=42))
        ],
        final_estimator=LogisticRegression(max_iter=1000),
        cv=5
    )
}

# 对比
print("集成学习方法对比（交叉验证准确率）:")
print("-" * 60)
for name, model in models.items():
    scores = cross_val_score(model, data.data, data.target, cv=5, scoring="accuracy")
    print(f"{name:20s}: {scores.mean():.2%} (+/- {scores.std() * 2:.2%})")
```

### 对比表格

| 方法 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 随机森林 | Bagging + 决策树 | 抗过拟合、并行训练 | 不可解释 |
| AdaBoost | 加权样本 | 关注难样本 | 对噪声敏感 |
| Gradient Boosting | 拟合残差 | 准确率高 | 训练慢、易过拟合 |
| Voting | 投票/平均 | 简单、稳健 | 模型多样性要求高 |
| Stacking | 元模型组合 | 灵活、效果好 | 复杂、计算成本高 |

---

## 7 新手常见误区

### 误区 1："模型越多越好"

**错！** 模型数量增加会提高计算成本，但收益递减。通常 100-500 棵树就够了。

### 误区 2："Boosting 不需要调参"

**错！** Boosting 对学习率和树深度敏感，需要仔细调参。

### 误区 3："Stacking 一定比 Voting 好"

不是的。Stacking 更灵活，但需要更多数据和计算资源。

### 误区 4："集成学习不需要交叉验证"

**错！** 集成学习也可能过拟合，需要用交叉验证评估泛化能力。

### 误区 5："随机森林的特征重要性一定准确"

不是的。特征重要性可能受特征尺度、相关性影响，需要结合业务理解。

---

## 8 动手练习

### 练习 1：基础练习

用随机森林对乳腺癌数据集分类，查看特征重要性前 5 名。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 训练随机森林
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

# 预测
y_pred = rf.predict(X_test)
print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")

# 特征重要性
importances = rf.feature_importances_
feature_names = data.feature_names

# 排序并显示前 5 名
indices = importances.argsort()[::-1][:5]
print("\n前 5 个重要特征:")
for i, idx in enumerate(indices, 1):
    print(f"{i}. {feature_names[idx]}: {importances[idx]:.4f}")
```

</details>

### 练习 2：进阶练习

用 VotingClassifier 组合逻辑回归、决策树、SVM，对比硬投票和软投票的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 定义基模型
models = [
    ("lr", LogisticRegression(max_iter=1000)),
    ("dt", DecisionTreeClassifier(random_state=42)),
    ("svm", SVC(kernel="linear", probability=True, random_state=42))
]

# 硬投票
voting_hard = VotingClassifier(estimators=models, voting="hard")
scores_hard = cross_val_score(voting_hard, data.data, data.target, cv=5)
print(f"硬投票准确率: {scores_hard.mean():.2%} (+/- {scores_hard.std() * 2:.2%})")

# 软投票
voting_soft = VotingClassifier(estimators=models, voting="soft")
scores_soft = cross_val_score(voting_soft, data.data, data.target, cv=5)
print(f"软投票准确率: {scores_soft.mean():.2%} (+/- {scores_soft.std() * 2:.2%})")

print("\n结论: 软投票通常比硬投票效果好，因为它考虑了概率信息")
```

</details>

### 练习 3（挑战）：综合练习

用 StackingClassifier 组合多个基模型，对比与单个模型和 Voting 的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import StackingClassifier, VotingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target

# 定义模型
models = {
    "逻辑回归": LogisticRegression(max_iter=1000),
    "决策树": DecisionTreeClassifier(random_state=42),
    "SVM": SVC(kernel="linear", probability=True, random_state=42),
    "随机森林": RandomForestClassifier(n_estimators=100, random_state=42),
    "Voting": VotingClassifier(
        estimators=[
            ("lr", LogisticRegression(max_iter=1000)),
            ("dt", DecisionTreeClassifier(random_state=42)),
            ("rf", RandomForestClassifier(n_estimators=100, random_state=42))
        ],
        voting="soft"
    ),
    "Stacking": StackingClassifier(
        estimators=[
            ("lr", LogisticRegression(max_iter=1000)),
            ("dt", DecisionTreeClassifier(random_state=42)),
            ("rf", RandomForestClassifier(n_estimators=100, random_state=42))
        ],
        final_estimator=LogisticRegression(max_iter=1000),
        cv=5
    )
}

# 对比
print("模型对比（5 折交叉验证）:")
print("-" * 60)
for name, model in models.items():
    scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    print(f"{name:15s}: {scores.mean():.2%} (+/- {scores.std() * 2:.2%})")
```

</details>

---

## 9 下一章预告

下一章我们会学习 **模型优化与调参**——网格搜索、随机搜索、贝叶斯优化、学习曲线。你会学到如何系统地寻找最佳参数，让模型性能达到最优。
