---
title: "第3章：特征预处理"
description: "缺失值处理、异常值检测、数据类型转换、特征编码"
---

# 第3章：特征预处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 数据有缺失值该怎么处理？不同填充策略有什么区别？
- 怎么检测和处理异常值？
- 类别特征为什么要编码？有哪些编码方式？
- 什么时候用 LabelEncoder，什么时候用 OneHotEncoder？

这一章就是为了解答这些问题。特征预处理是特征工程的 **地基**，地基打不好，上面的建筑再漂亮也会倒塌。

---

## 1 为什么需要特征预处理？

### 痛点分析

原始数据通常存在以下问题：

| 问题 | 影响 | 例子 |
| --- | --- | --- |
| 缺失值 | 模型无法处理 | 年龄字段有 NaN |
| 异常值 | 拉偏模型 | 收入字段出现 9999999 |
| 类别文本 | 模型只接受数值 | 城市字段是"北京""上海" |
| 量纲差异 | 大数值特征主导模型 | 年龄 0-100 vs 收入 0-1000000 |

> **一句话总结**：预处理把"脏数据"变成"干净数据"，让模型能正常工作。

---

## 2 缺失值处理

### 缺失值类型

| 类型 | 含义 | 例子 | 处理方式 |
| --- | --- | --- | --- |
| MCAR | 完全随机缺失 | 问卷随机跳过 | 直接删除或填充 |
| MAR | 随机缺失 | 年轻人更不填年龄 | 按组填充 |
| MNAR | 非随机缺失 | 收入高的人不填收入 | 需要特殊处理 |

### 处理方法对比

```python
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer

# 创建含缺失值的数据
df = pd.DataFrame({
    'age': [25, 30, np.nan, 35, 40, np.nan, 28, 33],
    'income': [30000, np.nan, 60000, 80000, np.nan, 45000, 55000, 70000],
    'city': ['北京', '上海', np.nan, '深圳', '北京', np.nan, '广州', '上海']
})

# 方法 1：删除含缺失值的行（简单但浪费数据）
df_dropped = df.dropna()
print(f"删除后剩余: {len(df_dropped)} 行")  # 可能只剩 3 行

# 方法 2：用均值填充（适合正态分布的数值）
df['age_mean'] = df['age'].fillna(df['age'].mean())

# 方法 3：用中位数填充（适合有异常值的数值）
df['age_median'] = df['age'].fillna(df['age'].median())

# 方法 4：用众数填充（适合类别特征）
df['city_mode'] = df['city'].fillna(df['city'].mode()[0])

# 方法 5：用前后值填充（适合时间序列）
df['age_ffill'] = df['age'].fillna(method='ffill')  # 用前一个值填充
df['age_bfill'] = df['age'].fillna(method='bfill')  # 用后一个值填充

# 方法 6：用模型预测填充（最智能）
from sklearn.impute import KNNImputer
imputer = KNNImputer(n_neighbors=3)
df_imputed = pd.DataFrame(
    imputer.fit_transform(df[['age', 'income']]),
    columns=['age_knn', 'income_knn']
)

# 方法 7：Scikit-learn 的 SimpleImputer
si = SimpleImputer(strategy='median')
df['age_si'] = si.fit_transform(df[['age']])
```

### 选择策略

| 缺失比例 | 建议策略 |
| --- | --- |
| < 5% | 均值/中位数填充，或直接删除 |
| 5%-30% | 分组填充或 KNN 填充 |
| > 30% | 考虑删除该特征，或用模型预测 |

---

## 3 异常值检测与处理

### 常见检测方法

```python
# 方法 1：3σ 原则（适合正态分布）
mean = df['age'].mean()
std = df['age'].std()
outliers_3sigma = df[(df['age'] < mean - 3*std) | (df['age'] > mean + 3*std)]

# 方法 2：IQR 方法（更稳健）
Q1 = df['age'].quantile(0.25)  # 第一四分位数
Q3 = df['age'].quantile(0.75)  # 第三四分位数
IQR = Q3 - Q1                   # 四分位距
lower = Q1 - 1.5 * IQR         # 下界
upper = Q3 + 1.5 * IQR         # 上界
outliers_iqr = df[(df['age'] < lower) | (df['age'] > upper)]

# 方法 3：箱线图可视化
import matplotlib.pyplot as plt
plt.boxplot(df['age'].dropna())
plt.title('年龄箱线图')
plt.show()
```

### 异常值处理策略

| 策略 | 适用场景 | 代码示例 |
| --- | --- | --- |
| 删除 | 异常值很少且明显错误 | `df = df[df['age'] < 150]` |
| 截断 | 异常值可能是极端正常值 | `df['age'] = df['age'].clip(0, 100)` |
| 替换 | 异常值需要修正 | `df.loc[df['age'] > 100, 'age'] = 100` |
| 变换 | 数据分布严重偏斜 | `df['income'] = np.log1p(df['income'])` |

---

## 4 特征编码

### 类别编码方法对比

| 方法 | 适用场景 | 优点 | 缺点 |
| --- | --- | --- | --- |
| LabelEncoder | 有序类别（如学历） | 简单 | 引入虚假大小关系 |
| OneHotEncoder | 无序类别（如城市） | 不引入大小关系 | 高维稀疏 |
| OrdinalEncoder | 有序类别 | 保留顺序 | 同 LabelEncoder |
| TargetEncoder | 高基数类别 | 效果好 | 容易过拟合 |
| FrequencyEncoder | 高基数类别 | 简单 | 丢失信息 |

### 代码示例

```python
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, OrdinalEncoder

# 原始数据
df = pd.DataFrame({
    'education': ['高中', '本科', '硕士', '博士', '本科', '硕士'],
    'city': ['北京', '上海', '广州', '深圳', '北京', '上海'],
    'size': ['S', 'M', 'L', 'XL', 'M', 'L']
})

# 1. LabelEncoder：适合二值类别
le = LabelEncoder()
df['gender_encoded'] = le.fit_transform(['男', '女', '男', '女', '男', '女'])
# 男=1, 女=0（或反过来）

# 2. OrdinalEncoder：适合有序类别
oe = OrdinalEncoder(categories=[['高中', '本科', '硕士', '博士']])
df['education_encoded'] = oe.fit_transform(df[['education']])
# 高中=0, 本科=1, 硕士=2, 博士=3（保留了顺序关系）

# 3. OneHotEncoder：适合无序类别
ohe = OneHotEncoder(sparse_output=False)
city_encoded = ohe.fit_transform(df[['city']])
city_df = pd.DataFrame(city_encoded, columns=ohe.get_feature_names_out())
df = pd.concat([df, city_df], axis=1)

# 4. pd.get_dummies：更简单的独热编码
city_dummies = pd.get_dummies(df['city'], prefix='city')
df = pd.concat([df, city_dummies], axis=1)

# 5. 手动映射：最灵活
size_map = {'S': 1, 'M': 2, 'L': 3, 'XL': 4}
df['size_encoded'] = df['size'].map(size_map)
```

> **原理**：模型只能处理数值，所以需要把文本类别转为数值。不同的编码方式适合不同类型的类别特征。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 缺失值处理 | 删除、均值/中位数/众数填充、KNN 填充 |
| 异常值检测 | 3σ 原则、IQR 方法、箱线图 |
| 异常值处理 | 删除、截断、替换、变换 |
| LabelEncoder | 适合二值或有序类别 |
| OneHotEncoder | 适合无序类别，避免引入大小关系 |

---

## 6 新手常见误区

### 误区 1："缺失值都用均值填充"

**错！** 均值填充只适合正态分布的数据。如果数据有异常值，应该用中位数；如果是类别特征，应该用众数；如果缺失有规律，应该分组填充。

正确做法：根据数据分布和缺失原因选择合适的填充策略。

### 误区 2："异常值一定要删除"

不对。异常值可能是 **有价值的信息**。比如欺诈检测中，异常值恰恰是我们要找的目标。只有在异常值明显是错误数据时才应该删除。

正确做法：先分析异常值的原因，再决定是删除、修正还是保留。

### 误区 3："类别特征都用 OneHotEncoder"

不是的。如果类别之间有顺序关系（如学历：高中 < 本科 < 硕士 < 博士），用 OneHotEncoder 会丢失顺序信息。这时应该用 OrdinalEncoder。

正确做法：先判断类别是否有序，有序用 OrdinalEncoder，无序用 OneHotEncoder。

---

## 7 动手练习

### 练习 1：基础练习

创建一个包含缺失值和异常值的 DataFrame，分别用均值、中位数、众数填充缺失值，并用 IQR 方法检测异常值。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import numpy as np

# 创建数据
df = pd.DataFrame({
    'age': [25, 30, np.nan, 35, 200, np.nan, 28, 33, 45, 50],
    'city': ['北京', '上海', np.nan, '深圳', '北京', np.nan, '广州', '上海', '北京', '深圳'],
    'score': [85, 90, 78, np.nan, 92, 88, 76, 95, 80, 87]
})

# 缺失值填充
df['age_median'] = df['age'].fillna(df['age'].median())
df['city_mode'] = df['city'].fillna(df['city'].mode()[0])
df['score_mean'] = df['score'].fillna(df['score'].mean())

# IQR 异常值检测
Q1 = df['age'].quantile(0.25)
Q3 = df['age'].quantile(0.75)
IQR = Q3 - Q1
lower = Q1 - 1.5 * IQR
upper = Q3 + 1.5 * IQR
outliers = df[(df['age'] < lower) | (df['age'] > upper)]
print(f"异常值:\n{outliers}")
```

</details>

### 练习 2：进阶练习

对包含有序类别和无序类别的数据集，分别使用合适的编码方式进行处理。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.preprocessing import OrdinalEncoder, OneHotEncoder

df = pd.DataFrame({
    'education': ['高中', '本科', '硕士', '博士', '本科'],
    'city': ['北京', '上海', '广州', '深圳', '北京'],
    'satisfaction': ['不满意', '一般', '满意', '非常满意', '一般']
})

# 有序类别用 OrdinalEncoder
oe_edu = OrdinalEncoder(categories=[['高中', '本科', '硕士', '博士']])
df['education_enc'] = oe_edu.fit_transform(df[['education']])

oe_sat = OrdinalEncoder(categories=[['不满意', '一般', '满意', '非常满意']])
df['satisfaction_enc'] = oe_sat.fit_transform(df[['satisfaction']])

# 无序类别用 OneHotEncoder
city_dummies = pd.get_dummies(df['city'], prefix='city')
df = pd.concat([df, city_dummies], axis=1)
print(df)
```

</details>

### 练习 3（挑战）：综合练习

使用 Pipeline 整合缺失值处理、异常值截断和类别编码。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# 定义数值处理流程
num_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

# 定义类别处理流程
cat_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

# 组合
preprocessor = ColumnTransformer([
    ('num', num_pipeline, ['age', 'score']),
    ('cat', cat_pipeline, ['city'])
])

# 使用
X_processed = preprocessor.fit_transform(df[['age', 'score', 'city']])
print(f"处理后形状: {X_processed.shape}")
```

</details>

---

## 下一章预告

下一章我们会学习 **特征构造**——从现有特征中创造出新的、更有表达力的特征。这是特征工程中最需要"创造力"的部分。
