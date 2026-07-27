---
title: "第5章：特征缩放与标准化"
description: "将特征缩放到同一尺度，避免量纲差异影响模型"
---

# 第5章：特征缩放与标准化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么需要特征缩放？不缩放会怎样？
- 标准化和归一化有什么区别？
- 什么时候用 StandardScaler，什么时候用 MinMaxScaler？
- 哪些模型需要特征缩放，哪些不需要？

这一章就是为了解答这些问题。特征缩放是特征工程中 **最容易被忽视但非常重要** 的步骤。

---

## 1 为什么需要特征缩放？

### 痛点分析

想象你要比较两个学生的成绩：A 同学数学 90 分（满分 100），B 同学英语 900 分（满分 1000）。如果不做处理，你会觉得 B 同学更优秀。但如果都换算成百分制，A 同学 90%，B 同学也是 90%，两人一样优秀。

在机器学习中，不同特征的量纲差异会导致：

- 距离计算被大数值特征主导
- 梯度下降收敛变慢
- 正则化对大数值特征惩罚过重

> **一句话总结**：特征缩放让所有特征"站在同一起跑线上"。

---

## 2 核心原理

### 缩放方法对比

| 方法 | 公式 | 范围 | 适用场景 |
| --- | --- | --- | --- |
| StandardScaler | (x - mean) / std | 无固定范围 | 大多数情况，假设正态分布 |
| MinMaxScaler | (x - min) / (max - min) | [0, 1] | 需要固定范围，如图像像素 |
| MaxAbsScaler | x / max(\|x\|) | [-1, 1] | 稀疏数据，保留零值 |
| RobustScaler | (x - median) / IQR | 无固定范围 | 有异常值的数据 |

---

## 3 基础用法

### StandardScaler（标准化）

```python
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

# 创建数据
df = pd.DataFrame({
    'age': [25, 30, 35, 40, 45],           # 范围 25-45
    'income': [30000, 50000, 60000, 80000, 100000]  # 范围 30000-100000
})

print("原始数据:")
print(df)
print(f"\nage 均值: {df['age'].mean():.2f}, 标准差: {df['age'].std():.2f}")
print(f"income 均值: {df['income'].mean():.2f}, 标准差: {df['income'].std():.2f}")

# 标准化
scaler = StandardScaler()
df_scaled = pd.DataFrame(
    scaler.fit_transform(df),
    columns=df.columns
)

print("\n标准化后:")
print(df_scaled)
print(f"\nage 均值: {df_scaled['age'].mean():.2f}, 标准差: {df_scaled['age'].std():.2f}")
print(f"income 均值: {df_scaled['income'].mean():.2f}, 标准差: {df_scaled['income'].std():.2f}")
```

> **原理**：标准化将数据转换为均值为 0、标准差为 1 的分布。公式：`z = (x - μ) / σ`

### MinMaxScaler（归一化）

```python
from sklearn.preprocessing import MinMaxScaler

# 归一化到 [0, 1]
scaler = MinMaxScaler()
df_normalized = pd.DataFrame(
    scaler.fit_transform(df),
    columns=df.columns
)

print("归一化后 [0, 1]:")
print(df_normalized)

# 归一化到自定义范围，如 [-1, 1]
scaler_custom = MinMaxScaler(feature_range=(-1, 1))
df_custom = pd.DataFrame(
    scaler_custom.fit_transform(df),
    columns=df.columns
)

print("\n归一化后 [-1, 1]:")
print(df_custom)
```

> **原理**：归一化将数据缩放到固定范围。公式：`x' = (x - min) / (max - min)`

---

## 4 进阶用法

### RobustScaler（对异常值稳健）

```python
from sklearn.preprocessing import RobustScaler

# 创建含异常值的数据
df_outlier = pd.DataFrame({
    'value': [10, 12, 11, 13, 12, 100, 11, 13]  # 100 是异常值
})

# StandardScaler 受异常值影响
scaler_std = StandardScaler()
df_std = scaler_std.fit_transform(df_outlier)
print("StandardScaler（受异常值影响）:")
print(df_std.flatten())

# RobustScaler 不受异常值影响
scaler_rob = RobustScaler()
df_rob = scaler_rob.fit_transform(df_outlier)
print("\nRobustScaler（不受异常值影响）:")
print(df_rob.flatten())
```

> **原理**：RobustScaler 使用中位数和四分位距（IQR），对异常值不敏感。

### 不同模型的缩放需求

| 模型类型 | 是否需要缩放 | 原因 |
| --- | --- | --- |
| 线性回归/逻辑回归 | ✅ 需要 | 梯度下降收敛更快 |
| SVM | ✅ 需要 | 距离计算被大数值主导 |
| KNN | ✅ 需要 | 距离计算被大数值主导 |
| PCA | ✅ 需要 | 方差大的特征主导主成分 |
| 神经网络 | ✅ 需要 | 激活函数饱和问题 |
| 决策树/随机森林 | ❌ 不需要 | 基于特征分裂，不受量纲影响 |
| XGBoost/LightGBM | ❌ 不需要 | 基于特征分裂，不受量纲影响 |

### 保存和加载 Scaler

```python
import joblib

# 训练时保存 scaler
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
joblib.dump(scaler, 'scaler.pkl')

# 预测时加载 scaler
loaded_scaler = joblib.load('scaler.pkl')
X_test_scaled = loaded_scaler.transform(X_test)  # 注意：只用 transform
```

> **原理**：测试集必须用训练集的 scaler 来 transform，不能重新 fit，否则会数据泄漏。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| StandardScaler | 均值为 0，标准差为 1，适合大多数情况 |
| MinMaxScaler | 缩放到 [0, 1]，适合需要固定范围的数据 |
| RobustScaler | 使用中位数和 IQR，对异常值稳健 |
| 缩放需求 | 距离类算法需要，树模型不需要 |
| 数据泄漏 | 测试集只能用训练集的 scaler transform |

---

## 6 新手常见误区

### 误区 1："所有模型都需要特征缩放"

**错！** 决策树、随机森林、XGBoost 等基于特征分裂的模型不需要缩放。它们只看特征的排序，不看具体数值。

正确做法：根据模型类型决定是否需要缩放。

### 误区 2："对测试集重新 fit scaler"

不对。这会导致数据泄漏。测试集必须用训练集的 scaler 来 transform。

正确做法：`scaler.fit(X_train)` 然后 `scaler.transform(X_test)`。

### 误区 3："标准化后数据就在 [0, 1] 范围内"

不是的。StandardScaler 输出均值为 0、标准差为 1 的分布，范围不固定。如果需要 [0, 1]，应该用 MinMaxScaler。

正确做法：根据需求选择合适的 scaler。

---

## 7 动手练习

### 练习 1：基础练习

对鸢尾花数据集进行标准化和归一化，对比结果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler, MinMaxScaler

# 加载数据
iris = load_iris()
X = iris.data

# 标准化
scaler_std = StandardScaler()
X_std = scaler_std.fit_transform(X)
print("标准化后均值:", X_std.mean(axis=0).round(2))
print("标准化后标准差:", X_std.std(axis=0).round(2))

# 归一化
scaler_mm = MinMaxScaler()
X_mm = scaler_mm.fit_transform(X)
print("\n归一化后最小值:", X_mm.min(axis=0))
print("归一化后最大值:", X_mm.max(axis=0))
```

</details>

### 练习 2：进阶练习

对含异常值的数据，分别用 StandardScaler 和 RobustScaler 处理，对比结果。

<details>
<summary>点击查看答案</summary>

```python
# 创建含异常值的数据
X = np.array([[10], [12], [11], [13], [12], [100], [11], [13]])

# StandardScaler
scaler_std = StandardScaler()
X_std = scaler_std.fit_transform(X)
print("StandardScaler:")
print(X_std.flatten())

# RobustScaler
scaler_rob = RobustScaler()
X_rob = scaler_rob.fit_transform(X)
print("\nRobustScaler:")
print(X_rob.flatten())

# 对比：RobustScaler 对异常值更稳健
```

</details>

### 练习 3（挑战）：综合练习

使用 Pipeline 整合特征缩放和模型训练，确保测试集不会数据泄漏。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_breast_cancer

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 创建 Pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(max_iter=10000))
])

# 训练（自动对训练集 fit_transform）
pipeline.fit(X_train, y_train)

# 预测（自动对测试集 transform）
score = pipeline.score(X_test, y_test)
print(f"模型准确率: {score:.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **特征选择方法**——从所有特征中筛选出最有用的特征，减少维度，提升模型性能。
