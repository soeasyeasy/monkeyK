---
title: "第6章：Scikit-learn 入门"
description: "掌握 Scikit-learn 数据预处理、特征工程和模型训练"
---

# 第6章：Scikit-learn 入门

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Scikit-learn 是什么？
- 如何进行数据预处理？
- 什么是特征工程？
- 如何训练一个机器学习模型？

这一章就是为了解答这些问题。Scikit-learn 是 Python 最流行的机器学习库，提供了丰富的算法和工具。

---

## 1 为什么需要 Scikit-learn？

### 痛点分析

假设你要训练一个分类模型：

```python
# ❌ 手写算法：复杂且容易出错
def train_classifier(X, y):
    # 手写梯度下降、损失函数...
    # 几百行代码，还容易有 bug
    pass
```

```python
# ✅ 用 Scikit-learn：3 行搞定
from sklearn.linear_model import LogisticRegression
model = LogisticRegression()
model.fit(X, y)  # 训练完成
```

> **一句话总结**：Scikit-learn 让机器学习变得简单。

### 生活化类比

打个比方：

> 手写算法就像自己造车，Scikit-learn 就像直接买辆车。
> 你不需要知道发动机怎么工作，只需要会开车就行。

---

## 2 核心原理：Scikit-learn API

### 统一的 API 设计

Scikit-learn 所有算法都遵循相同的 API：

```python
# 1. 创建模型
model = AlgorithmName(parameters)

# 2. 训练模型（拟合数据）
model.fit(X_train, y_train)

# 3. 预测新数据
predictions = model.predict(X_test)

# 4. 评估模型
score = model.score(X_test, y_test)
```

| 方法 | 说明 |
| --- | --- |
| `fit()` | 训练模型 |
| `predict()` | 预测新数据 |
| `score()` | 评估模型 |
| `transform()` | 转换数据（预处理） |
| `fit_transform()` | 先训练再转换 |

---

## 3 数据预处理

### 标准化

将数据缩放到均值为 0，标准差为 1：

```python
from sklearn.preprocessing import StandardScaler
import numpy as np

# 原始数据
X = np.array([[1, 2], [3, 4], [5, 6], [7, 8]])

# 创建标准化器
scaler = StandardScaler()

# 拟合并转换数据
X_scaled = scaler.fit_transform(X)

print("原始数据:")
print(X)
print("\n标准化后:")
print(X_scaled)
# 每列均值为 0，标准差为 1
```

### 归一化

将数据缩放到 [0, 1] 区间：

```python
from sklearn.preprocessing import MinMaxScaler

# 创建归一化器
scaler = MinMaxScaler()

# 拟合并转换
X_normalized = scaler.fit_transform(X)

print("归一化后:")
print(X_normalized)
# 所有值在 0 到 1 之间
```

### 类别编码

将文本类别转为数值：

```python
from sklearn.preprocessing import LabelEncoder

# 类别数据
colors = ['red', 'green', 'blue', 'red', 'blue']

# 创建编码器
encoder = LabelEncoder()

# 转换
encoded = encoder.fit_transform(colors)

print("原始:", colors)
print("编码后:", encoded)
# [2 1 0 2 0]
```

### 独热编码

```python
from sklearn.preprocessing import OneHotEncoder
import numpy as np

# 类别数据
X = np.array([['red'], ['green'], ['blue'], ['red']])

# 创建编码器
encoder = OneHotEncoder(sparse=False)

# 转换
X_onehot = encoder.fit_transform(X)

print("独热编码后:")
print(X_onehot)
# [[0. 0. 1.]   # red
#  [0. 1. 0.]   # green
#  [1. 0. 0.]   # blue
#  [0. 0. 1.]]  # red
```

---

## 4 特征工程

### 特征选择

选择最重要的特征：

```python
from sklearn.feature_selection import SelectKBest, f_classif
import numpy as np

# 示例数据（4个特征）
X = np.array([[1, 2, 3, 4],
              [5, 6, 7, 8],
              [9, 10, 11, 12],
              [13, 14, 15, 16]])
y = np.array([0, 1, 0, 1])

# 选择最好的 2 个特征
selector = SelectKBest(score_func=f_classif, k=2)
X_selected = selector.fit_transform(X, y)

print("选择的特征索引:", selector.get_support(indices=True))
print("选择后的数据:")
print(X_selected)
```

### 特征构造

创建新特征：

```python
import pandas as pd
import numpy as np

# 原始数据
df = pd.DataFrame({
    '面积': [50, 60, 70, 80],
    '房间数': [2, 3, 3, 4],
    '价格': [100, 150, 180, 220]
})

# 构造新特征
df['每房间面积'] = df['面积'] / df['房间数']
df['价格_per_面积'] = df['价格'] / df['面积']

print(df)
```

---

## 5 模型训练

### 完整流程

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. 数据预处理
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)  # 注意：只用 transform

# 4. 创建并训练模型
model = LogisticRegression(random_state=42)
model.fit(X_train_scaled, y_train)

# 5. 预测
y_pred = model.predict(X_test_scaled)

# 6. 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2f}")
```

### 模型保存与加载

```python
import joblib

# 保存模型
joblib.dump(model, 'model.pkl')

# 加载模型
loaded_model = joblib.load('model.pkl')

# 使用加载的模型预测
predictions = loaded_model.predict(X_test_scaled)
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 统一 API | fit、predict、score、transform |
| 标准化 | StandardScaler，均值为 0，标准差为 1 |
| 归一化 | MinMaxScaler，缩放到 [0, 1] |
| 类别编码 | LabelEncoder、OneHotEncoder |
| 特征选择 | SelectKBest |
| 模型保存 | joblib.dump/load |

---

## 7 新手常见误区

### 误区 1："测试集也需要 fit"

**错！** 预处理只能用训练集 fit，测试集只能 transform：

```python
# ❌ 错误
scaler.fit_transform(X_test)  # 测试集信息泄露

# ✅ 正确
scaler.fit_transform(X_train)  # 训练集 fit
scaler.transform(X_test)       # 测试集只 transform
```

### 误区 2："所有特征都要保留"

不是的。无关特征会降低模型性能：

```python
# ❌ 错误：保留所有特征，包括无关的
# 模型会被噪声干扰

# ✅ 正确：特征选择，只保留重要特征
# 模型更简单、更准确
```

### 误区 3："模型训练完就结束"

模型需要保存和部署：

```python
# ❌ 错误：训练完就关闭程序
# 下次还要重新训练

# ✅ 正确：保存模型，随时加载使用
joblib.dump(model, 'model.pkl')
```

---

## 8 动手练习

### 练习 1：基础练习

用 StandardScaler 标准化以下数据：

```python
X = [[1, 2], [3, 4], [5, 6]]
```

<details>
<summary>点击查看答案</summary>

```python
from sklearn.preprocessing import StandardScaler
import numpy as np

X = np.array([[1, 2], [3, 4], [5, 6]])

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print("标准化后:")
print(X_scaled)
# [[-1.22474487 -1.22474487]
#  [ 0.          0.        ]
#  [ 1.22474487  1.22474487]]
```

</details>

### 练习 2：进阶练习

用 Scikit-learn 完成一个完整的分类任务（使用 Iris 数据集）。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. 标准化
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 4. 训练模型
model = LogisticRegression(random_state=42, max_iter=200)
model.fit(X_train_scaled, y_train)

# 5. 预测和评估
y_pred = model.predict(X_test_scaled)
print(classification_report(y_test, y_pred))
```

</details>

### 练习 3（挑战）：综合练习

使用 Pipeline 将预处理和模型训练组合在一起。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 创建 Pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),           # 第1步：标准化
    ('classifier', LogisticRegression())    # 第2步：逻辑回归
])

# 训练 Pipeline
pipeline.fit(X_train, y_train)

# 预测
y_pred = pipeline.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **监督学习算法**——线性回归、逻辑回归、决策树、支持向量机等经典算法。
