---
title: "第9章：交叉验证技术"
description: "K 折交叉验证、分层交叉验证、留一法、时间序列交叉验证"
---

# 第9章：交叉验证技术

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是交叉验证？为什么需要它？
- K 折交叉验证的 K 怎么选？
- 分层交叉验证和普通 K 折有什么区别？
- 时间序列数据怎么做交叉验证？

这一章就是为了解答这些问题。交叉验证是模型评估中 **最可靠** 的方法，能充分利用数据，减少评估的偶然性。

---

## 1 为什么需要交叉验证？

### 痛点分析

简单的一次 train_test_split 有以下问题：

| 问题 | 说明 |
| --- | --- |
| 数据浪费 | 测试集不参与训练 |
| 评估不稳定 | 不同划分结果可能差异很大 |
| 小数据集 | 测试集太小，评估不可靠 |

> **一句话总结**：交叉验证让每个数据点都有机会参与训练和测试，评估更可靠。

---

## 2 核心原理

### 交叉验证方法对比

| 方法 | 原理 | 适用场景 | 计算成本 |
| --- | --- | --- | --- |
| K 折交叉验证 | 数据分 K 份，轮流做测试集 | 大多数情况 | 中等 |
| 分层 K 折 | 保持类别比例 | 类别不平衡 | 中等 |
| 留一法 | 每次留一个样本做测试集 | 数据量很小 | 高 |
| 重复 K 折 | 多次 K 折取平均 | 需要更稳定评估 | 高 |
| 时间序列交叉验证 | 按时间顺序划分 | 时间序列数据 | 中等 |

---

## 3 基础用法

### K 折交叉验证

```python
from sklearn.model_selection import KFold, cross_val_score
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
import numpy as np

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target

# 方法 1：使用 cross_val_score（推荐）
model = LogisticRegression(max_iter=200, random_state=42)
scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(f"5 折交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
print(f"每折准确率: {scores}")

# 方法 2：手动实现 K 折
kf = KFold(n_splits=5, shuffle=True, random_state=42)
for fold, (train_idx, test_idx) in enumerate(kf.split(X)):
    print(f"\n第 {fold + 1} 折:")
    print(f"  训练集索引: {train_idx[:5]}... (共 {len(train_idx)} 个)")
    print(f"  测试集索引: {test_idx[:5]}... (共 {len(test_idx)} 个)")
```

> **原理**：K 折交叉验证将数据分成 K 份，每次用 K-1 份训练，1 份测试，轮流 K 次，最后取平均。

### 分层 K 折交叉验证

```python
from sklearn.model_selection import StratifiedKFold

# 分层 K 折：保持每折的类别比例
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=skf, scoring='accuracy')
print(f"\n分层 5 折交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")

# 对比普通 K 折
kf = KFold(n_splits=5, shuffle=True, random_state=42)
scores_kf = cross_val_score(model, X, y, cv=kf, scoring='accuracy')
print(f"普通 5 折交叉验证准确率: {scores_kf.mean():.4f} (+/- {scores_kf.std() * 2:.4f})")
```

> **原理**：分层 K 折确保每折中各类别的比例与原始数据一致，适合类别不平衡的数据。

### 留一法交叉验证

```python
from sklearn.model_selection import LeaveOneOut, cross_val_score

# 留一法：每次留一个样本做测试
loo = LeaveOneOut()
scores = cross_val_score(model, X, y, cv=loo, scoring='accuracy')
print(f"\n留一法交叉验证准确率: {scores.mean():.4f}")
print(f"评估次数: {loo.get_n_splits(X)}")  # 等于样本数
```

> **原理**：留一法每次留一个样本做测试集，训练集为其余所有样本。评估最稳定，但计算成本最高。

---

## 4 进阶用法

### 重复 K 折交叉验证

```python
from sklearn.model_selection import RepeatedStratifiedKFold

# 重复 5 折交叉验证 10 次
rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=10, random_state=42)
scores = cross_val_score(model, X, y, cv=rskf, scoring='accuracy')
print(f"重复 5 折 x 10 次 交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
print(f"总评估次数: {rskf.get_n_splits(X, y)}")  # 5 * 10 = 50
```

### 时间序列交叉验证

```python
from sklearn.model_selection import TimeSeriesSplit
import pandas as pd

# 创建时间序列数据
dates = pd.date_range('2020-01-01', periods=100, freq='D')
df_ts = pd.DataFrame({
    'date': dates,
    'feature1': np.random.randn(100),
    'feature2': np.random.randn(100),
    'target': np.random.randint(0, 2, 100)
})

X_ts = df_ts[['feature1', 'feature2']].values
y_ts = df_ts['target'].values

# 时间序列交叉验证：不能打乱顺序
tscv = TimeSeriesSplit(n_splits=5)
for fold, (train_idx, test_idx) in enumerate(tscv.split(X_ts)):
    print(f"\n第 {fold + 1} 折:")
    print(f"  训练集: 第 {train_idx[0]} 到 {train_idx[-1]} 天")
    print(f"  测试集: 第 {test_idx[0]} 到 {test_idx[-1]} 天")

# 评估
scores = cross_val_score(model, X_ts, y_ts, cv=tscv, scoring='accuracy')
print(f"\n时间序列交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

> **原理**：时间序列数据有先后顺序，不能随机划分。TimeSeriesSplit 确保训练集始终在测试集之前。

### 分组交叉验证

```python
from sklearn.model_selection import GroupKFold

# 场景：同一用户的多条数据不能同时出现在训练集和测试集
groups = np.array([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5])  # 用户 ID
X_group = np.random.randn(15, 4)
y_group = np.random.randint(0, 2, 15)

gkf = GroupKFold(n_splits=3)
for fold, (train_idx, test_idx) in enumerate(gkf.split(X_group, y_group, groups)):
    train_groups = np.unique(groups[train_idx])
    test_groups = np.unique(groups[test_idx])
    print(f"\n第 {fold + 1} 折:")
    print(f"  训练集用户: {train_groups}")
    print(f"  测试集用户: {test_groups}")
```

> **原理**：GroupKFold 确保同一组（如同一用户）的数据不会同时出现在训练集和测试集，避免数据泄漏。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| K 折交叉验证 | 数据分 K 份，轮流做测试集 |
| 分层 K 折 | 保持类别比例，适合不平衡数据 |
| 留一法 | 每次留一个样本，评估最稳定 |
| 时间序列交叉验证 | 按时间顺序，不能打乱 |
| 分组交叉验证 | 同组数据不能拆分 |
| K 的选择 | 通常 5 或 10，数据少用留一法 |

---

## 6 新手常见误区

### 误区 1："K 越大越好"

**错！** K 太大会增加计算成本，而且训练集之间重叠太多，评估方差大。K 太小则评估偏差大。

正确做法：通常用 K=5 或 K=10，数据量很小用留一法。

### 误区 2："时间序列数据用普通 K 折"

不对。时间序列有先后顺序，随机划分会导致"未来信息"泄露到训练集。

正确做法：用 TimeSeriesSplit，确保训练集在测试集之前。

### 误区 3："交叉验证不需要测试集"

不是的。交叉验证用于调参和模型选择，最终仍需要一个独立的测试集做最终评估。

正确做法：先用交叉验证调参，最后在测试集上评估最终模型。

---

## 7 动手练习

### 练习 1：基础练习

对鸢尾花数据集做 5 折和 10 折交叉验证，对比结果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.model_selection import cross_val_score

# 5 折
scores_5 = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(f"5 折: {scores_5.mean():.4f} (+/- {scores_5.std() * 2:.4f})")

# 10 折
scores_10 = cross_val_score(model, X, y, cv=10, scoring='accuracy')
print(f"10 折: {scores_10.mean():.4f} (+/- {scores_10.std() * 2:.4f})")
```

</details>

### 练习 2：进阶练习

使用分层 K 折和重复 K 折评估模型，对比稳定性。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.model_selection import StratifiedKFold, RepeatedStratifiedKFold

# 分层 5 折
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores_skf = cross_val_score(model, X, y, cv=skf, scoring='accuracy')
print(f"分层 5 折: {scores_skf.mean():.4f} (+/- {scores_skf.std() * 2:.4f})")

# 重复 5 折 x 10 次
rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=10, random_state=42)
scores_rskf = cross_val_score(model, X, y, cv=rskf, scoring='accuracy')
print(f"重复 5 折 x 10 次: {scores_rskf.mean():.4f} (+/- {scores_rskf.std() * 2:.4f})")
print(f"标准差对比: 分层 {scores_skf.std():.4f} vs 重复 {scores_rskf.std():.4f}")
```

</details>

### 练习 3（挑战）：综合练习

创建一个时间序列数据集，用 TimeSeriesSplit 做交叉验证，并可视化每折的训练/测试划分。

<details>
<summary>点击查看答案</summary>

```python
import matplotlib.pyplot as plt
from sklearn.model_selection import TimeSeriesSplit

# 创建数据
n_samples = 100
X_ts = np.random.randn(n_samples, 2)
y_ts = np.random.randint(0, 2, n_samples)

# TimeSeriesSplit
tscv = TimeSeriesSplit(n_splits=5)

# 可视化
plt.figure(figsize=(12, 6))
for fold, (train_idx, test_idx) in enumerate(tscv.split(X_ts)):
    plt.scatter(range(n_samples), [fold] * n_samples, c='white', marker='|', s=100)
    plt.scatter(train_idx, [fold] * len(train_idx), c='blue', marker='s', s=20, label='训练集' if fold == 0 else '')
    plt.scatter(test_idx, [fold] * len(test_idx), c='red', marker='s', s=20, label='测试集' if fold == 0 else '')
plt.xlabel('样本索引')
plt.ylabel('折数')
plt.title('时间序列交叉验证划分')
plt.legend()
plt.show()
```

</details>

---

## 下一章预告

下一章我们会学习 **分类模型评估指标**——准确率、精确率、召回率、F1 分数、ROC 曲线、AUC 等，全面了解如何评估分类模型。
