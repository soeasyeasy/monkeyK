---
title: "第13章：模型对比与选择"
description: "多模型对比、模型融合、Stacking、模型选择策略"
---

# 第13章：模型对比与选择

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么公平地比较多个模型？
- 什么是模型融合？为什么它有效？
- Bagging、Boosting、Stacking 有什么区别？
- 怎么选择最适合的模型？

这一章就是为了解答这些问题。模型对比和融合是提升性能的 **最后一步**，往往能带来显著的效果提升。

---

## 1 为什么需要模型对比与融合？

### 痛点分析

单个模型总有局限性：

| 模型 | 优点 | 缺点 |
| --- | --- | --- |
| 线性模型 | 简单、快 | 无法捕捉非线性关系 |
| 决策树 | 可解释 | 容易过拟合 |
| SVM | 高维效果好 | 计算成本高 |
| 神经网络 | 强大 | 需要大量数据和调参 |

> **一句话总结**：没有万能模型，但多个模型的组合往往能互补不足。

---

## 2 核心原理

### 模型融合方法对比

| 方法 | 原理 | 代表算法 | 适用场景 |
| --- | --- | --- | --- |
| Bagging | 并行训练多个模型，投票/平均 | 随机森林 | 降低方差 |
| Boosting | 串行训练，后一个纠正前一个 | XGBoost, LightGBM | 降低偏差 |
| Stacking | 用多个模型的预测作为新特征 | 自定义 | 综合多个模型 |
| Voting | 多个模型投票 | VotingClassifier | 简单融合 |

---

## 3 基础用法

### 多模型对比

```python
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import cross_val_score
from sklearn.datasets import load_breast_cancer
import pandas as pd

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target

# 定义模型
models = {
    '逻辑回归': LogisticRegression(max_iter=10000, random_state=42),
    '决策树': DecisionTreeClassifier(random_state=42),
    '随机森林': RandomForestClassifier(n_estimators=100, random_state=42),
    '梯度提升': GradientBoostingClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(probability=True, random_state=42)
}

# 交叉验证评估
results = []
for name, model in models.items():
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    results.append({
        '模型': name,
        '平均准确率': scores.mean(),
        '标准差': scores.std()
    })

# 结果展示
results_df = pd.DataFrame(results).sort_values('平均准确率', ascending=False)
print(results_df.to_string(index=False))
```

### 投票融合（Voting）

```python
from sklearn.ensemble import VotingClassifier

# 定义基模型
estimators = [
    ('lr', LogisticRegression(max_iter=10000, random_state=42)),
    ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
    ('gb', GradientBoostingClassifier(n_estimators=100, random_state=42))
]

# 硬投票：直接投票
voting_hard = VotingClassifier(estimators=estimators, voting='hard')
scores_hard = cross_val_score(voting_hard, X, y, cv=5, scoring='accuracy')
print(f"\n硬投票准确率: {scores_hard.mean():.4f}")

# 软投票：概率平均
voting_soft = VotingClassifier(estimators=estimators, voting='soft')
scores_soft = cross_val_score(voting_soft, X, y, cv=5, scoring='accuracy')
print(f"软投票准确率: {scores_soft.mean():.4f}")
```

> **原理**：硬投票直接看预测类别，软投票看预测概率。软投票通常效果更好，但要求所有模型都能输出概率。

---

## 4 进阶用法

### Stacking 融合

```python
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression

# 定义基模型
base_models = [
    ('lr', LogisticRegression(max_iter=10000, random_state=42)),
    ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
    ('gb', GradientBoostingClassifier(n_estimators=100, random_state=42))
]

# Stacking：用逻辑回归作为元模型
stacking = StackingClassifier(
    estimators=base_models,
    final_estimator=LogisticRegression(max_iter=10000, random_state=42),
    cv=5
)

scores = cross_val_score(stacking, X, y, cv=5, scoring='accuracy')
print(f"\nStacking 准确率: {scores.mean():.4f}")
```

> **原理**：Stacking 先用多个基模型预测，然后用这些预测作为新特征训练一个元模型。元模型学习如何最好地组合基模型的预测。

### Bagging 与 Boosting 对比

```python
from sklearn.ensemble import BaggingClassifier, AdaBoostClassifier

# Bagging：并行训练
bagging = BaggingClassifier(
    estimator=DecisionTreeClassifier(),
    n_estimators=50,
    random_state=42
)

# Boosting：串行训练
boosting = AdaBoostClassifier(
    estimator=DecisionTreeClassifier(max_depth=3),
    n_estimators=50,
    random_state=42
)

# 对比
for name, model in [('Bagging', bagging), ('Boosting', boosting)]:
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"{name}: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

### 模型选择策略

| 场景 | 推荐策略 |
| --- | --- |
| 数据量小 | 简单模型（线性模型、朴素贝叶斯） |
| 数据量大 | 复杂模型（神经网络、XGBoost） |
| 需要可解释 | 线性模型、决策树 |
| 追求性能 | 集成方法（Stacking、XGBoost） |
| 时间紧迫 | 快速模型（线性模型、LightGBM） |

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 模型对比 | 用交叉验证公平比较 |
| 投票融合 | 硬投票、软投票 |
| Stacking | 用基模型预测训练元模型 |
| Bagging | 并行训练，降低方差 |
| Boosting | 串行训练，降低偏差 |

---

## 6 新手常见误区

### 误区 1："复杂模型一定比简单模型好"

**错！** 数据量小时，复杂模型容易过拟合。简单模型反而更稳健。

正确做法：先用简单模型建立基线，再尝试复杂模型。

### 误区 2："模型融合一定有效"

不对。如果基模型都很相似（如多个树模型），融合效果有限。融合需要模型有多样性。

正确做法：选择不同类型的模型融合，如线性模型 + 树模型。

### 误区 3："只关注准确率，忽略其他因素"

不是的。模型选择还要考虑训练时间、预测时间、可解释性、内存占用等。

正确做法：根据业务需求综合权衡。

---

## 7 动手练习

### 练习 1：基础练习

对比 5 个分类模型在乳腺癌数据集上的性能。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB

models = {
    '逻辑回归': LogisticRegression(max_iter=10000),
    'KNN': KNeighborsClassifier(),
    '朴素贝叶斯': GaussianNB(),
    '随机森林': RandomForestClassifier(n_estimators=100),
    '梯度提升': GradientBoostingClassifier(n_estimators=100)
}

for name, model in models.items():
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"{name}: {scores.mean():.4f}")
```

</details>

### 练习 2：进阶练习

使用 VotingClassifier 融合三个模型，对比硬投票和软投票的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.ensemble import VotingClassifier

estimators = [
    ('lr', LogisticRegression(max_iter=10000)),
    ('rf', RandomForestClassifier(n_estimators=100)),
    ('knn', KNeighborsClassifier())
]

for voting_type in ['hard', 'soft']:
    voting = VotingClassifier(estimators=estimators, voting=voting_type)
    scores = cross_val_score(voting, X, y, cv=5, scoring='accuracy')
    print(f"{voting_type}投票: {scores.mean():.4f}")
```

</details>

### 练习 3（挑战）：综合练习

实现 Stacking 融合，对比 Stacking 和单个模型的性能。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.ensemble import StackingClassifier

# 基模型
base_models = [
    ('lr', LogisticRegression(max_iter=10000)),
    ('rf', RandomForestClassifier(n_estimators=100)),
    ('gb', GradientBoostingClassifier(n_estimators=100))
]

# Stacking
stacking = StackingClassifier(
    estimators=base_models,
    final_estimator=LogisticRegression(max_iter=10000),
    cv=5
)

# 对比
for name, model in [('逻辑回归', base_models[0][1]), 
                     ('随机森林', base_models[1][1]),
                     ('梯度提升', base_models[2][1]),
                     ('Stacking', stacking)]:
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"{name}: {scores.mean():.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **特征工程实战：文本数据**——如何处理文本数据，提取有用的特征。
