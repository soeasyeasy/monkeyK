---
title: "第4章：特征构造"
description: "从现有特征中创造新特征，提升模型表现"
---

# 第4章：特征构造

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是特征构造？和特征选择有什么区别？
- 怎么知道哪些新特征对模型有帮助？
- 有哪些常用的特征构造方法？
- 如何避免构造出无用的特征？

这一章就是为了解答这些问题。特征构造是特征工程中 **最需要创造力** 的部分，好的特征能让简单模型也能表现优异。

---

## 1 为什么需要特征构造？

### 痛点分析

有时候原始特征无法很好地表达问题的本质。比如：

- 预测房价时，"面积"和"单价"都比"总价"更直观
- 预测用户是否会购买时，"浏览次数"和"加购次数"的组合比单独的特征更有意义
- 预测时间序列时，"星期几""是否节假日"比具体日期更有用

> **一句话总结**：特征构造是把"原始数据"翻译成"模型能理解的语言"。

---

## 2 核心原理

### 特征构造的类型

| 类型 | 说明 | 例子 |
| --- | --- | --- |
| 特征组合 | 多个特征做运算 | 面积 × 单价 = 总价 |
| 特征变换 | 对单个特征做数学变换 | log(收入)、√面积 |
| 多项式特征 | 特征的幂次和交叉项 | x², x₁×x₂ |
| 时间特征 | 从时间戳提取信息 | 小时、星期几、是否周末 |
| 文本特征 | 从文本中提取信息 | 词频、文本长度 |

---

## 3 基础用法

### 特征组合

```python
import pandas as pd
import numpy as np

# 示例：房价预测
df = pd.DataFrame({
    'area': [80, 100, 120, 150, 90],           # 面积（平方米）
    'price_per_meter': [50000, 60000, 55000, 70000, 52000],  # 单价
    'rooms': [2, 3, 3, 4, 2],                  # 房间数
    'floor': [5, 10, 15, 20, 8]                # 楼层
})

# 1. 乘法组合：总价
df['total_price'] = df['area'] * df['price_per_meter']

# 2. 除法组合：房间面积占比
df['room_area_ratio'] = df['area'] / df['rooms']

# 3. 加减组合：家庭规模
# 假设有 sibsp（兄弟姐妹数）和 parch（父母子女数）
# df['family_size'] = df['sibsp'] + df['parch'] + 1

# 4. 交叉特征：楼层×面积
df['floor_area_interaction'] = df['floor'] * df['area']

print(df.head())
```

### 特征变换

```python
# 对数变换：处理右偏分布
df['log_price'] = np.log1p(df['total_price'])  # log(1+x) 避免 log(0)

# 平方根变换：比 log 温和
df['sqrt_area'] = np.sqrt(df['area'])

# 幂次变换：增强特征的非线性
df['area_squared'] = df['area'] ** 2

# 分箱：将连续变量离散化
df['area_bin'] = pd.cut(df['area'], bins=[0, 90, 120, 150, 200],
                        labels=['small', 'medium', 'large', 'xlarge'])

print(df.head())
```

### 多项式特征

```python
from sklearn.preprocessing import PolynomialFeatures

# 创建多项式特征
poly = PolynomialFeatures(degree=2, interaction_only=False, include_bias=False)

# 原始特征
X = df[['area', 'price_per_meter']]

# 生成多项式特征：area, price, area², area×price, price²
X_poly = poly.fit_transform(X)

# 查看特征名称
feature_names = poly.get_feature_names_out(['area', 'price_per_meter'])
print(f"多项式特征: {feature_names}")
print(f"原始形状: {X.shape} -> 多项式形状: {X_poly.shape}")
```

### 时间特征提取

```python
# 创建时间序列数据
df_time = pd.DataFrame({
    'timestamp': pd.date_range('2024-01-01', periods=10, freq='H'),
    'value': np.random.randn(10)
})

# 提取时间特征
df_time['hour'] = df_time['timestamp'].dt.hour           # 小时
df_time['dayofweek'] = df_time['timestamp'].dt.dayofweek # 星期几（0=周一）
df_time['is_weekend'] = df_time['dayofweek'].isin([5, 6]).astype(int)  # 是否周末
df_time['month'] = df_time['timestamp'].dt.month         # 月份
df_time['is_month_start'] = df_time['timestamp'].dt.is_month_start.astype(int)  # 是否月初

print(df_time.head())
```

---

## 4 进阶用法

### 基于业务的特征构造

```python
# 电商场景：用户购买预测
df_ecom = pd.DataFrame({
    'user_id': [1, 2, 3, 4, 5],
    'total_orders': [10, 5, 20, 3, 15],
    'total_spent': [5000, 2000, 10000, 800, 7000],
    'days_since_last_order': [5, 30, 2, 60, 10],
    'avg_order_value': [500, 400, 500, 267, 467]
})

# 业务特征
df_ecom['avg_order_value'] = df_ecom['total_spent'] / df_ecom['total_orders']
df_ecom['order_frequency'] = df_ecom['total_orders'] / 365  # 假设观察期 365 天
df_ecom['customer_value_score'] = (
    df_ecom['total_spent'] * df_ecom['order_frequency'] / df_ecom['days_since_last_order']
)

print(df_ecom)
```

### 聚合特征

```python
# 用户行为聚合
df_user = pd.DataFrame({
    'user_id': [1, 1, 1, 2, 2, 3],
    'product_id': [101, 102, 101, 103, 104, 101],
    'action': ['view', 'buy', 'view', 'view', 'buy', 'view'],
    'timestamp': pd.date_range('2024-01-01', periods=6, freq='D')
})

# 按用户聚合
user_features = df_user.groupby('user_id').agg({
    'product_id': 'nunique',     # 浏览商品数
    'action': lambda x: (x == 'buy').sum(),  # 购买次数
    'timestamp': lambda x: (x.max() - x.min()).days  # 活跃天数
}).rename(columns={
    'product_id': 'unique_products',
    'action': 'buy_count',
    'timestamp': 'active_days'
})

print(user_features)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 特征组合 | 加减乘除组合多个特征 |
| 特征变换 | log、sqrt、幂次等数学变换 |
| 多项式特征 | 自动生成幂次和交叉项 |
| 时间特征 | 从时间戳提取小时、星期、月份等 |
| 聚合特征 | 按组聚合生成统计特征 |

---

## 6 新手常见误区

### 误区 1："特征越多越好"

**错！** 过多特征会导致维度灾难，模型过拟合。关键是特征的质量，不是数量。

正确做法：先构造多个候选特征，然后用特征选择筛选出最有用的。

### 误区 2："随便组合特征就行"

不对。特征组合应该有 **业务意义**。比如"面积×房间数"没有意义，但"面积/房间数=平均房间面积"就有意义。

正确做法：基于对问题的理解来构造特征。

### 误区 3："忽略特征变换"

很多算法（如线性回归）假设特征服从正态分布。如果特征严重偏斜，模型效果会很差。

正确做法：对偏斜特征做 log、sqrt 等变换。

---

## 7 动手练习

### 练习 1：基础练习

对房价数据集，构造至少 3 个新特征（如总价、房间面积比、楼层×面积）。

<details>
<summary>点击查看答案</summary>

```python
df = pd.DataFrame({
    'area': [80, 100, 120, 150, 90],
    'rooms': [2, 3, 3, 4, 2],
    'floor': [5, 10, 15, 20, 8],
    'price': [400, 600, 660, 1050, 468]
})

# 构造新特征
df['price_per_area'] = df['price'] / df['area']           # 单价
df['room_area_ratio'] = df['area'] / df['rooms']          # 平均房间面积
df['floor_area'] = df['floor'] * df['area']               # 楼层×面积
df['is_high_floor'] = (df['floor'] > 10).astype(int)      # 是否高楼层

print(df)
```

</details>

### 练习 2：进阶练习

对时间序列数据，提取小时、星期几、是否周末、是否节假日等时间特征。

<details>
<summary>点击查看答案</summary>

```python
df = pd.DataFrame({
    'timestamp': pd.date_range('2024-01-01', periods=24, freq='H'),
    'value': np.random.randn(24)
})

# 提取时间特征
df['hour'] = df['timestamp'].dt.hour
df['dayofweek'] = df['timestamp'].dt.dayofweek
df['is_weekend'] = df['dayofweek'].isin([5, 6]).astype(int)
df['is_holiday'] = 0  # 假设没有节假日

# 周期性编码（避免小时 23 和 0 的距离问题）
df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)

print(df.head())
```

</details>

### 练习 3（挑战）：综合练习

构造用户行为聚合特征，包括浏览次数、购买次数、活跃天数等。

<details>
<summary>点击查看答案</summary>

```python
df = pd.DataFrame({
    'user_id': [1, 1, 1, 2, 2, 3, 3, 3, 3],
    'action': ['view', 'buy', 'view', 'view', 'buy', 'view', 'view', 'buy', 'view'],
    'timestamp': pd.date_range('2024-01-01', periods=9, freq='D')
})

# 聚合特征
user_features = df.groupby('user_id').agg(
    view_count=('action', lambda x: (x == 'view').sum()),
    buy_count=('action', lambda x: (x == 'buy').sum()),
    total_actions=('action', 'count'),
    active_days=('timestamp', lambda x: (x.max() - x.min()).days + 1),
    buy_rate=('action', lambda x: (x == 'buy').mean())
).reset_index()

print(user_features)
```

</details>

---

## 下一章预告

下一章我们会学习 **特征缩放与标准化**——不同特征的量纲差异会影响模型性能，我们需要把它们缩放到同一尺度。
