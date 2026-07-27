---
title: "第3章：数据预处理"
description: "标准化、归一化、编码分类特征、缺失值处理、特征缩放对比"
---

# 第3章：数据预处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么需要数据预处理？
- 标准化和归一化有什么区别？
- 如何处理文本类型的特征？
- 数据中有缺失值怎么办？

这一章会带你掌握数据预处理的核心技术，让你的模型性能更上一层楼。

---

## 1 为什么需要数据预处理？

### 痛点分析

原始数据往往不能直接用于训练：

- **量纲不同**：年龄（0-100）和收入（0-100000）差距巨大
- **类型不同**：模型只能处理数值，不能处理"男/女"
- **缺失值**：有些数据不完整
- **异常值**：极端值会干扰模型

这就像**做菜前需要洗菜、切菜**——不处理直接下锅，味道肯定不对！

### 解决方案

数据预处理就是**把原始数据变成模型能理解的格式**：

- 标准化/归一化：统一数值范围
- 编码：把文本变成数字
- 填充/删除：处理缺失值
- 异常值检测：清理脏数据

> **一句话总结**：数据预处理决定了模型性能的上限，算法只是逼近这个上限。

---

## 2 标准化与归一化

### 概念解释

**标准化（Standardization）**：把数据变成均值为 0，标准差为 1 的分布

$$x' = \frac{x - \mu}{\sigma}$$

**归一化（Normalization）**：把数据缩放到 [0, 1] 或 [-1, 1] 区间

$$x' = \frac{x - x_{min}}{x_{max} - x_{min}}$$

打个比方：

> 标准化就像**调整温度**——把摄氏度变成华氏度，还是能比较冷热
> 归一化就像**打分**——把所有人的分数都压到 0-100 之间

### 代码示例

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import numpy as np

# 示例数据：年龄和收入
X = np.array([
    [25, 50000],
    [30, 60000],
    [35, 70000],
    [40, 80000]
])

# 1. 标准化
scaler = StandardScaler()
X_standardized = scaler.fit_transform(X)

print("标准化后:")
print(X_standardized)
# 每列均值为 0，标准差为 1

# 2. 归一化
scaler = MinMaxScaler()
X_normalized = scaler.fit_transform(X)

print("\n归一化后:")
print(X_normalized)
# 每列最小值为 0，最大值为 1
```

### 对比表格

| 方法 | 公式 | 范围 | 适用场景 |
| --- | --- | --- | --- |
| StandardScaler | (x - mean) / std | 无固定范围 | 大多数算法（线性回归、逻辑回归、SVM） |
| MinMaxScaler | (x - min) / (max - min) | [0, 1] | 神经网络、图像像素 |
| RobustScaler | (x - median) / IQR | 无固定范围 | 有异常值的数据 |
| MaxAbsScaler | x / max(abs(x)) | [-1, 1] | 稀疏数据 |

---

## 3 编码分类特征

### 问题

机器学习模型只能处理数值，不能处理"男/女"、"红色/蓝色"这样的文本。

### 解决方案

#### 1. 标签编码（Label Encoding）

把类别变成 0, 1, 2, 3...

```python
from sklearn.preprocessing import LabelEncoder

# 示例数据
colors = ["红", "蓝", "绿", "红", "蓝"]

# 创建编码器
le = LabelEncoder()
encoded = le.fit_transform(colors)

print(f"原始: {colors}")
print(f"编码后: {encoded}")
# [2 0 1 2 0]
```

**适用场景**：类别之间有大小关系（如"低/中/高"）

#### 2. 独热编码（One-Hot Encoding）

把每个类别变成一个二进制列

```python
from sklearn.preprocessing import OneHotEncoder
import numpy as np

# 示例数据
X = np.array([["红"], ["蓝"], ["绿"], ["红"], ["蓝"]])

# 创建编码器
ohe = OneHotEncoder(sparse_output=False)
encoded = ohe.fit_transform(X)

print(f"原始:\n{X}")
print(f"\n编码后:\n{encoded}")
# [[0. 0. 1.]   # 红
#  [1. 0. 0.]   # 蓝
#  [0. 1. 0.]   # 绿
#  [0. 0. 1.]   # 红
#  [1. 0. 0.]]  # 蓝

print(f"\n类别名称: {ohe.categories_}")
```

**适用场景**：类别之间没有大小关系（如颜色、城市）

### 对比表格

| 方法 | 原理 | 适用场景 | 缺点 |
| --- | --- | --- | --- |
| LabelEncoder | 0, 1, 2, 3... | 有序类别（低/中/高） | 模型可能误以为有大小关系 |
| OneHotEncoder | 二进制列 | 无序类别（颜色、城市） | 类别多时维度爆炸 |
| OrdinalEncoder | 指定顺序 | 有序类别 | 需要手动指定顺序 |

---

## 4 处理缺失值

### 策略

1. **删除**：缺失值太多就删掉
2. **填充**：用均值、中位数、众数填充
3. **插值**：用算法预测缺失值

### 代码示例

```python
from sklearn.impute import SimpleImputer
import numpy as np

# 示例数据：有缺失值
X = np.array([
    [1, 2, 3],
    [4, np.nan, 6],
    [7, 8, np.nan],
    [10, 11, 12]
])

# 1. 用均值填充
imputer = SimpleImputer(strategy="mean")
X_mean = imputer.fit_transform(X)

print("均值填充:")
print(X_mean)

# 2. 用中位数填充
imputer = SimpleImputer(strategy="median")
X_median = imputer.fit_transform(X)

print("\n中位数填充:")
print(X_median)

# 3. 用众数填充（适用于分类数据）
X_cat = np.array([
    ["男"],
    ["女"],
    [np.nan],
    ["男"]
])
imputer = SimpleImputer(strategy="most_frequent")
X_cat_imputed = imputer.fit_transform(X_cat)

print("\n众数填充:")
print(X_cat_imputed)
```

### 填充策略对比

| 策略 | 代码 | 适用场景 |
| --- | --- | --- |
| 均值 | `strategy="mean"` | 数值型，无异常值 |
| 中位数 | `strategy="median"` | 数值型，有异常值 |
| 众数 | `strategy="most_frequent"` | 分类型 |
| 常数 | `strategy="constant"` | 特殊标记（如 -999） |

---

## 5 Pipeline 管道机制

### 问题

数据预处理步骤多，代码容易混乱：

```python
# 混乱的写法
X_train_scaled = scaler.fit_transform(X_train)
X_train_imputed = imputer.fit_transform(X_train_scaled)
X_train_encoded = encoder.fit_transform(X_train_imputed)

# 测试集还要重复一遍...
```

### 解决方案

Pipeline 把多个步骤串起来：

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier

# 创建管道
pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="mean")),      # 第 1 步：填充缺失值
    ("scaler", StandardScaler()),                      # 第 2 步：标准化
    ("classifier", RandomForestClassifier())           # 第 3 步：分类
])

# 使用管道（和单个模型一样简单）
pipeline.fit(X_train, y_train)
predictions = pipeline.predict(X_test)
```

### 优势

- **代码简洁**：一行代码完成多步操作
- **防止数据泄露**：训练集和测试集分别处理
- **易于复用**：保存整个管道，下次直接用

---

## 6 新手常见误区

### 误区 1："不需要标准化，模型能自动处理"

**错！** 大多数算法（线性回归、逻辑回归、SVM、KNN）对特征尺度敏感。不标准化会导致：

- 收敛慢
- 某些特征权重过大
- 模型性能差

### 误区 2："归一化比标准化好"

不是的。两者适用场景不同：

- 标准化：适用于大多数算法
- 归一化：适用于神经网络、图像

### 误区 3："缺失值直接删除就行"

**错！** 删除会丢失信息。如果缺失值比例小（<5%），可以填充；如果比例大（>30%），考虑删除该特征。

### 误区 4："分类特征直接用 LabelEncoder"

**错！** 对于无序类别（如颜色、城市），应该用 OneHotEncoder。LabelEncoder 会让模型误以为类别之间有大小关系。

### 误区 5："训练集和测试集一起预处理"

**错！** 应该先在训练集上 `fit`，再在测试集上 `transform`。否则会导致**数据泄露**——测试集的信息泄露到训练过程中。

```python
# 错误写法
scaler.fit_transform(X)  # 在整个数据集上拟合
X_train, X_test = train_test_split(X)

# 正确写法
X_train, X_test = train_test_split(X)
scaler.fit(X_train)  # 只在训练集上拟合
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

---

## 7 动手练习

### 练习 1：基础练习

用 `StandardScaler` 和 `MinMaxScaler` 对以下数据进行标准化和归一化，对比结果。

```python
X = [[1, 2], [3, 4], [5, 6], [7, 8]]
```

<details>
<summary>点击查看答案</summary>

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import numpy as np

X = np.array([[1, 2], [3, 4], [5, 6], [7, 8]])

# 标准化
scaler = StandardScaler()
X_std = scaler.fit_transform(X)
print("标准化:")
print(X_std)
print(f"均值: {X_std.mean(axis=0)}")
print(f"标准差: {X_std.std(axis=0)}")

# 归一化
scaler = MinMaxScaler()
X_norm = scaler.fit_transform(X)
print("\n归一化:")
print(X_norm)
print(f"最小值: {X_norm.min(axis=0)}")
print(f"最大值: {X_norm.max(axis=0)}")
```

</details>

### 练习 2：进阶练习

创建一个包含缺失值和分类特征的数据集，用 Pipeline 完成预处理。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
import numpy as np

# 模拟数据
X = np.array([
    [25, "男", 50000],
    [30, "女", np.nan],
    [35, np.nan, 70000],
    [40, "女", 80000]
], dtype=object)

# 定义列
numeric_features = [0, 2]  # 年龄、收入
categorical_features = [1]  # 性别

# 创建预处理器
preprocessor = ColumnTransformer(
    transformers=[
        ("num", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ]), numeric_features),
        ("cat", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(sparse_output=False))
        ]), categorical_features)
    ]
)

# 应用预处理
X_processed = preprocessor.fit_transform(X)
print("预处理后:")
print(X_processed)
```

</details>

### 练习 3（挑战）：综合练习

加载鸢尾花数据集，用 Pipeline 完成标准化 + 逻辑回归，对比不做标准化的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 1. 不做标准化
model1 = LogisticRegression(max_iter=200)
model1.fit(X_train, y_train)
y_pred1 = model1.predict(X_test)
acc1 = accuracy_score(y_test, y_pred1)

# 2. 做标准化（用 Pipeline）
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression(max_iter=200))
])
pipeline.fit(X_train, y_train)
y_pred2 = pipeline.predict(X_test)
acc2 = accuracy_score(y_test, y_pred2)

print(f"不做标准化准确率: {acc1:.2%}")
print(f"做标准化准确率: {acc2:.2%}")
print("\n结论: 标准化后模型收敛更快，准确率可能更高")
```

</details>

---

## 8 下一章预告

下一章我们会学习 **特征工程**——如何提取、构造和选择有用的特征。你会学到 PCA 降维、特征重要性分析等技术，让模型性能再上一个台阶。
