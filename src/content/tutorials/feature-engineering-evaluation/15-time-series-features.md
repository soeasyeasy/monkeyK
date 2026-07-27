---
title: "第15章：特征工程实战：时间序列"
description: "时间特征提取、滞后特征、滚动统计、季节性分解"
---

# 第15章：特征工程实战：时间序列

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 时间序列数据有什么特殊性？
- 怎么从时间戳中提取有用的特征？
- 什么是滞后特征和滚动统计？
- 怎么处理时间序列的季节性？

这一章就是为了解答这些问题。时间序列数据无处不在（股票、天气、销量），掌握时间特征工程能帮你预测未来。

---

## 1 为什么需要时间序列特征工程？

### 痛点分析

时间序列数据有以下特点：

| 特点 | 说明 | 挑战 |
| --- | --- | --- |
| 时间依赖性 | 当前值依赖历史值 | 不能用随机划分 |
| 趋势性 | 长期上升或下降 | 需要去趋势 |
| 季节性 | 周期性波动 | 需要捕捉周期 |
| 噪声 | 随机波动 | 需要平滑 |

> **一句话总结**：时间序列特征工程就是挖掘时间中的规律，用于预测未来。

---

## 2 核心原理

### 时间序列特征类型

| 类型 | 说明 | 例子 |
| --- | --- | --- |
| 时间特征 | 从时间戳提取 | 小时、星期几、月份 |
| 滞后特征 | 历史值作为特征 | 昨天的销量、上周同期的价格 |
| 滚动统计 | 滑动窗口的统计量 | 7 天移动平均、30 天标准差 |
| 季节性特征 | 周期性模式 | 是否节假日、是否周末 |

---

## 3 基础用法

### 时间特征提取

```python
import pandas as pd
import numpy as np

# 创建时间序列数据
dates = pd.date_range('2023-01-01', periods=100, freq='D')
df = pd.DataFrame({
    'date': dates,
    'sales': np.random.randint(100, 500, 100) + np.arange(100) * 2  # 带趋势
})

# 设置时间索引
df.set_index('date', inplace=True)

# 提取时间特征
df['day'] = df.index.day                    # 日
df['month'] = df.index.month                # 月
df['year'] = df.index.year                  # 年
df['dayofweek'] = df.index.dayofweek        # 星期几（0=周一）
df['dayofyear'] = df.index.dayofyear        # 一年中的第几天
df['weekofyear'] = df.index.isocalendar().week  # 一年中的第几周
df['quarter'] = df.index.quarter            # 季度
df['is_weekend'] = (df.index.dayofweek >= 5).astype(int)  # 是否周末
df['is_month_start'] = df.index.is_month_start.astype(int)  # 是否月初
df['is_month_end'] = df.index.is_month_end.astype(int)      # 是否月末

print(df.head(10))
```

### 滞后特征

```python
# 滞后特征：用历史值预测未来
df['sales_lag_1'] = df['sales'].shift(1)    # 昨天的销量
df['sales_lag_7'] = df['sales'].shift(7)    # 7 天前的销量
df['sales_lag_30'] = df['sales'].shift(30)  # 30 天前的销量

# 差分特征
df['sales_diff_1'] = df['sales'].diff(1)    # 与昨天的差
df['sales_diff_7'] = df['sales'].diff(7)    # 与 7 天前的差

print(df[['sales', 'sales_lag_1', 'sales_lag_7', 'sales_diff_1']].head(10))
```

> **原理**：滞后特征捕捉时间依赖性，让模型知道"昨天的情况"如何影响"今天"。

### 滚动统计

```python
# 滚动窗口统计
df['sales_rolling_mean_7'] = df['sales'].rolling(window=7).mean()   # 7 天移动平均
df['sales_rolling_std_7'] = df['sales'].rolling(window=7).std()     # 7 天标准差
df['sales_rolling_max_7'] = df['sales'].rolling(window=7).max()     # 7 天最大值
df['sales_rolling_min_7'] = df['sales'].rolling(window=7).min()     # 7 天最小值

# 指数加权移动平均（更重视近期数据）
df['sales_ewm_7'] = df['sales'].ewm(span=7).mean()

print(df[['sales', 'sales_rolling_mean_7', 'sales_ewm_7']].head(10))
```

> **原理**：滚动统计平滑噪声，捕捉短期趋势。移动平均是最常用的方法。

---

## 4 进阶用法

### 季节性分解

```python
from statsmodels.tsa.seasonal import seasonal_decompose
import matplotlib.pyplot as plt

# 创建带季节性的时间序列
np.random.seed(42)
n = 365
dates = pd.date_range('2023-01-01', periods=n, freq='D')
trend = np.linspace(100, 200, n)
seasonal = 20 * np.sin(2 * np.pi * dates.dayofyear / 365)
noise = np.random.randn(n) * 10
sales = trend + seasonal + noise

df_seasonal = pd.DataFrame({'date': dates, 'sales': sales})
df_seasonal.set_index('date', inplace=True)

# 季节性分解
decomposition = seasonal_decompose(df_seasonal['sales'], model='additive', period=365)

# 可视化
fig, axes = plt.subplots(4, 1, figsize=(12, 10))
decomposition.observed.plot(ax=axes[0], title='观测值')
decomposition.trend.plot(ax=axes[1], title='趋势')
decomposition.seasonal.plot(ax=axes[2], title='季节性')
decomposition.resid.plot(ax=axes[3], title='残差')
plt.tight_layout()
plt.show()
```

> **原理**：季节性分解将时间序列拆分为趋势、季节性和残差三部分，帮助理解数据的结构。

### 时间序列交叉验证

```python
from sklearn.model_selection import TimeSeriesSplit
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error

# 准备特征和标签
feature_cols = ['day', 'month', 'dayofweek', 'is_weekend', 
                'sales_lag_1', 'sales_lag_7', 'sales_rolling_mean_7']
df_model = df.dropna()

X = df_model[feature_cols]
y = df_model['sales']

# 时间序列交叉验证
tscv = TimeSeriesSplit(n_splits=5)
model = RandomForestRegressor(n_estimators=100, random_state=42)

scores = []
for train_idx, test_idx in tscv.split(X):
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    scores.append(np.sqrt(mean_squared_error(y_test, y_pred)))

print(f"时间序列交叉验证 RMSE: {np.mean(scores):.2f}")
```

### 周期性编码

```python
# 对于周期性特征（如小时、星期），用正弦余弦编码
df['hour_sin'] = np.sin(2 * np.pi * df.index.hour / 24)
df['hour_cos'] = np.cos(2 * np.pi * df.index.hour / 24)

df['dayofweek_sin'] = np.sin(2 * np.pi * df.index.dayofweek / 7)
df['dayofweek_cos'] = np.cos(2 * np.pi * df.index.dayofweek / 7)

print(df[['hour_sin', 'hour_cos', 'dayofweek_sin', 'dayofweek_cos']].head())
```

> **原理**：正弦余弦编码保持周期性的连续性，避免"23 点和 0 点距离很远"的问题。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 时间特征 | 从时间戳提取日、月、星期等 |
| 滞后特征 | 历史值作为特征 |
| 滚动统计 | 移动平均、标准差等 |
| 季节性分解 | 趋势、季节性、残差 |
| 周期性编码 | 正弦余弦变换 |

---

## 6 新手常见误区

### 误区 1："时间序列可以随机划分训练测试集"

**错！** 时间序列有先后顺序，必须按时间划分，训练集在测试集之前。

正确做法：用 TimeSeriesSplit 或手动按时间划分。

### 误区 2："不做差分直接用原始数据"

不对。很多时间序列有趋势，不差分的话模型难以学习。

正确做法：对非平稳序列做差分，使其平稳。

### 误区 3："忽略滞后特征的缺失值"

不是的。滞后特征会产生前几个时间步的缺失值，需要处理。

正确做法：删除含缺失值的行，或用前向填充。

---

## 7 动手练习

### 练习 1：基础练习

对给定的时间序列数据，提取时间特征和滞后特征。

<details>
<summary>点击查看答案</summary>

```python
dates = pd.date_range('2023-01-01', periods=50, freq='D')
df = pd.DataFrame({'date': dates, 'value': np.random.randn(50).cumsum()})
df.set_index('date', inplace=True)

# 时间特征
df['day'] = df.index.day
df['month'] = df.index.month
df['dayofweek'] = df.index.dayofweek

# 滞后特征
df['value_lag_1'] = df['value'].shift(1)
df['value_lag_7'] = df['value'].shift(7)

# 滚动统计
df['value_rolling_mean_7'] = df['value'].rolling(7).mean()

print(df.head(10))
```

</details>

### 练习 2：进阶练习

对带季节性的时间序列做季节性分解，并可视化。

<details>
<summary>点击查看答案</summary>

```python
from statsmodels.tsa.seasonal import seasonal_decompose

# 创建数据
np.random.seed(42)
n = 365
dates = pd.date_range('2023-01-01', periods=n, freq='D')
trend = np.linspace(100, 150, n)
seasonal = 15 * np.sin(2 * np.pi * dates.dayofyear / 365)
noise = np.random.randn(n) * 5
data = trend + seasonal + noise

df = pd.DataFrame({'date': dates, 'value': data})
df.set_index('date', inplace=True)

# 分解
result = seasonal_decompose(df['value'], model='additive', period=365)
result.plot()
plt.show()
```

</details>

### 练习 3（挑战）：综合练习

使用时间特征、滞后特征、滚动统计构建一个时间序列预测模型。

<details>
<summary>点击查看答案</summary>

```python
# 创建数据
np.random.seed(42)
n = 200
dates = pd.date_range('2023-01-01', periods=n, freq='D')
df = pd.DataFrame({
    'date': dates,
    'sales': 100 + np.arange(n) * 0.5 + 20 * np.sin(2 * np.pi * dates.dayofyear / 7) + np.random.randn(n) * 10
})
df.set_index('date', inplace=True)

# 特征工程
df['dayofweek'] = df.index.dayofweek
df['is_weekend'] = (df.index.dayofweek >= 5).astype(int)
df['sales_lag_1'] = df['sales'].shift(1)
df['sales_lag_7'] = df['sales'].shift(7)
df['sales_rolling_mean_7'] = df['sales'].rolling(7).mean()

# 删除缺失值
df = df.dropna()

# 特征和标签
features = ['dayofweek', 'is_weekend', 'sales_lag_1', 'sales_lag_7', 'sales_rolling_mean_7']
X = df[features]
y = df['sales']

# 时间序列划分
split_idx = int(len(X) * 0.8)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

# 训练模型
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 评估
y_pred = model.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print(f"RMSE: {rmse:.2f}")

# 可视化
plt.figure(figsize=(12, 6))
plt.plot(y_test.index, y_test.values, label='真实值')
plt.plot(y_test.index, y_pred, label='预测值')
plt.legend()
plt.title('时间序列预测')
plt.show()
```

</details>

---

## 下一章预告

下一章是综合项目实战，我们会把前面学到的所有知识串联起来，完成一个完整的机器学习项目。
