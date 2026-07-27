---
title: "第11章：回归模型评估指标"
description: "MSE、RMSE、MAE、R² 分数、残差分析"
---

# 第11章：回归模型评估指标

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MSE 和 RMSE 有什么区别？
- MAE 和 MSE 哪个更好？
- R² 分数是什么意思？
- 怎么判断回归模型好不好？

这一章就是为了解答这些问题。回归模型的评估指标和分类不同，我们需要关注预测值与真实值之间的差距。

---

## 1 为什么需要回归评估指标？

### 痛点分析

回归任务预测的是连续值（如房价、温度、收入），不能像分类那样看"对不对"，而要看"差多少"。

> **一句话总结**：回归评估指标衡量预测值与真实值之间的"距离"。

---

## 2 核心原理

### 评估指标对比

| 指标 | 公式 | 含义 | 优点 | 缺点 |
| --- | --- | --- | --- | --- |
| MSE | mean((y-y_hat)²) | 均方误差 | 可导，优化方便 | 对异常值敏感 |
| RMSE | sqrt(MSE) | 均方根误差 | 与 y 同单位 | 对异常值敏感 |
| MAE | mean(\|y-y_hat\|) | 平均绝对误差 | 对异常值稳健 | 不可导 |
| R² | 1 - MSE/Var(y) | 决定系数 | 无量纲，可比较 | 可能为负 |
| MAPE | mean(\|y-y_hat\|/y) | 平均绝对百分比误差 | 可解释性强 | y=0 时失效 |

---

## 3 基础用法

### 计算各种指标

```python
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import numpy as np

# 真实值和预测值
y_true = np.array([3.0, -0.5, 2.0, 7.0, 4.0])
y_pred = np.array([2.5, 0.0, 2.0, 8.0, 3.5])

# MSE
mse = mean_squared_error(y_true, y_pred)
print(f"MSE: {mse:.4f}")

# RMSE
rmse = np.sqrt(mse)
print(f"RMSE: {rmse:.4f}")

# MAE
mae = mean_absolute_error(y_true, y_pred)
print(f"MAE: {mae:.4f}")

# R²
r2 = r2_score(y_true, y_pred)
print(f"R²: {r2:.4f}")

# MAPE
mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
print(f"MAPE: {mape:.4f}%")
```

> **原理**：MSE 对大误差惩罚更重（平方），MAE 对所有误差一视同仁。R² 表示模型解释的方差比例，1 为完美，0 为和均值一样。

### 使用 Scikit-learn 的回归指标

```python
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Scikit-learn 也提供了这些指标
mse = mean_squared_error(y_true, y_pred)
rmse = mean_squared_error(y_true, y_pred, squared=False)  # 直接返回 RMSE
mae = mean_absolute_error(y_true, y_pred)
r2 = r2_score(y_true, y_pred)

print(f"MSE: {mse:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"R²: {r2:.4f}")
```

---

## 4 进阶用法

### 残差分析

```python
import matplotlib.pyplot as plt
from sklearn.datasets import make_regression
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

# 创建数据
X, y = make_regression(n_samples=200, noise=20, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 训练模型
model = LinearRegression()
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# 残差
residuals = y_test - y_pred

# 可视化
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# 1. 残差直方图
axes[0].hist(residuals, bins=20, edgecolor='black', alpha=0.7)
axes[0].axvline(x=0, color='r', linestyle='--')
axes[0].set_xlabel('残差')
axes[0].set_ylabel('频数')
axes[0].set_title('残差分布')

# 2. 预测值 vs 真实值
axes[1].scatter(y_test, y_pred, alpha=0.5)
axes[1].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
axes[1].set_xlabel('真实值')
axes[1].set_ylabel('预测值')
axes[1].set_title('预测值 vs 真实值')

# 3. 残差 vs 预测值
axes[2].scatter(y_pred, residuals, alpha=0.5)
axes[2].axhline(y=0, color='r', linestyle='--')
axes[2].set_xlabel('预测值')
axes[2].set_ylabel('残差')
axes[2].set_title('残差 vs 预测值')

plt.tight_layout()
plt.show()
```

> **原理**：好的模型残差应该近似正态分布，均值为 0，且与预测值无关。如果残差有模式，说明模型还有改进空间。

### 不同指标的适用场景

| 场景 | 推荐指标 | 原因 |
| --- | --- | --- |
| 需要优化 | MSE | 可导，适合梯度下降 |
| 需要可解释 | MAE | 与 y 同单位，直观 |
| 有异常值 | MAE 或 Huber | 对异常值稳健 |
| 模型比较 | R² | 无量纲，可跨数据集比较 |
| 百分比误差 | MAPE | 可解释为百分比 |

### 自定义评估函数

```python
from sklearn.metrics import make_scorer

# 自定义 RMSE
def rmse(y_true, y_pred):
    return np.sqrt(mean_squared_error(y_true, y_pred))

rmse_scorer = make_scorer(rmse, greater_is_better=False)

# 使用自定义 scorer
from sklearn.model_selection import cross_val_score
scores = cross_val_score(model, X, y, cv=5, scoring=rmse_scorer)
print(f"\n交叉验证 RMSE: {-scores.mean():.4f}")
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| MSE | 均方误差，对大误差敏感 |
| RMSE | 均方根误差，与 y 同单位 |
| MAE | 平均绝对误差，对异常值稳健 |
| R² | 决定系数，模型解释的方差比例 |
| 残差分析 | 检查模型假设是否满足 |

---

## 6 新手常见误区

### 误区 1："MSE 越小越好，所以只看 MSE"

**错！** MSE 的单位是 y 的平方，不直观。应该结合 RMSE 或 MAE 一起看。

正确做法：同时报告 MSE 和 MAE，MSE 用于优化，MAE 用于解释。

### 误区 2："R² 越高模型越好"

不对。R² 高只说明模型解释了大部分方差，但不代表预测准确。而且 R² 可能为负（模型比均值还差）。

正确做法：R² 用于模型比较，具体预测精度还要看 RMSE 或 MAE。

### 误区 3："忽略残差分析"

不是的。残差分析能发现模型的问题，如非线性、异方差等。

正确做法：训练后做残差分析，检查模型假设。

---

## 7 动手练习

### 练习 1：基础练习

计算给定真实值和预测值的 MSE、RMSE、MAE、R²。

<details>
<summary>点击查看答案</summary>

```python
y_true = np.array([1.5, 2.3, 3.7, 4.1, 5.0])
y_pred = np.array([1.4, 2.5, 3.5, 4.0, 5.2])

mse = mean_squared_error(y_true, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_true, y_pred)
r2 = r2_score(y_true, y_pred)

print(f"MSE: {mse:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"R²: {r2:.4f}")
```

</details>

### 练习 2：进阶练习

对波士顿房价数据集（或加州房价数据集）训练线性回归模型，做残差分析。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import fetch_california_housing
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

data = fetch_california_housing()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.3, random_state=42
)

model = LinearRegression()
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print(f"R²: {r2_score(y_test, y_pred):.4f}")
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}")

# 残差分析
residuals = y_test - y_pred
plt.hist(residuals, bins=50, edgecolor='black', alpha=0.7)
plt.xlabel('残差')
plt.ylabel('频数')
plt.title('残差分布')
plt.show()
```

</details>

### 练习 3（挑战）：综合练习

对比线性回归、决策树回归、随机森林回归在房价数据集上的 MSE、MAE、R²。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

models = {
    '线性回归': LinearRegression(),
    '决策树回归': DecisionTreeRegressor(random_state=42),
    '随机森林回归': RandomForestRegressor(n_estimators=100, random_state=42)
}

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"{name}: MSE={mse:.4f}, MAE={mae:.4f}, R²={r2:.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **超参数调优**——网格搜索、随机搜索、贝叶斯优化等方法，找到模型的最优参数。
