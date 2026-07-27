---
title: "第5章：监督学习：回归算法"
description: "线性回归、岭回归、Lasso 回归、弹性网络、多项式回归"
---

# 第5章：监督学习：回归算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是回归？和分类有什么区别？
- 线性回归是怎么工作的？
- 什么是过拟合？怎么防止？
- 岭回归和 Lasso 有什么区别？

这一章会带你掌握回归算法的核心原理和实战应用，学会预测连续值（如房价、温度、销售额）。

---

## 1 为什么需要回归算法？

### 痛点分析

很多实际问题是**预测数值**：

- 预测房价：根据面积、地段预测价格
- 预测销量：根据广告投入预测销售额
- 预测温度：根据历史数据预测未来温度

这些问题不能用分类解决，因为答案是**连续的数值**，不是离散的类别。

### 解决方案

回归算法就是**学习特征和目标之间的映射关系**，然后预测新数据的数值。

打个比方：

> 回归就像**根据经验估算**——你看过很多房子，知道面积大的贵、地段好的贵，现在给你一个新房子，你能估算出价格。

---

## 2 线性回归

### 原理

线性回归假设特征和目标之间是**线性关系**：

$$y = w_0 + w_1x_1 + w_2x_2 + ... + w_nx_n$$

其中：
- $y$ 是目标值
- $x_1, x_2, ..., x_n$ 是特征
- $w_0$ 是截距
- $w_1, w_2, ..., w_n$ 是权重

### 代码示例

```python
from sklearn.linear_model import LinearRegression
import numpy as np

# 示例数据：面积（平方米）和房价（万元）
X = np.array([[50], [60], [70], [80], [90], [100]])
y = np.array([150, 180, 210, 240, 270, 300])

# 创建模型
model = LinearRegression()

# 训练
model.fit(X, y)

# 预测
X_new = np.array([[75], [85]])
y_pred = model.predict(X_new)

print(f"预测结果: {y_pred}")
print(f"权重: {model.coef_[0]:.2f}")  # 每增加 1 平方米，房价增加多少
print(f"截距: {model.intercept_:.2f}")
```

### 评估指标

```python
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

y_true = [210, 240]
y_pred = [215, 235]

# 均方误差（MSE）
mse = mean_squared_error(y_true, y_pred)
print(f"MSE: {mse:.2f}")

# 平均绝对误差（MAE）
mae = mean_absolute_error(y_true, y_pred)
print(f"MAE: {mae:.2f}")

# R² 分数（决定系数）
r2 = r2_score(y_true, y_pred)
print(f"R²: {r2:.2f}")  # 越接近 1 越好
```

---

## 3 正则化回归

### 问题：过拟合

线性回归在特征多、数据少时容易**过拟合**——在训练集上表现好，在新数据上表现差。

### 解决方案

#### 岭回归（Ridge Regression）

在损失函数中加入 L2 正则化：

$$Loss = MSE + \alpha \sum_{i=1}^{n} w_i^2$$

```python
from sklearn.linear_model import Ridge

# 创建岭回归模型
# alpha 是正则化强度，越大越保守
model = Ridge(alpha=1.0)
model.fit(X_train, y_train)

print(f"训练集得分: {model.score(X_train, y_train):.2f}")
print(f"测试集得分: {model.score(X_test, y_test):.2f}")
```

#### Lasso 回归

在损失函数中加入 L1 正则化：

$$Loss = MSE + \alpha \sum_{i=1}^{n} |w_i|$$

```python
from sklearn.linear_model import Lasso

# 创建 Lasso 模型
model = Lasso(alpha=0.1)
model.fit(X_train, y_train)

print(f"训练集得分: {model.score(X_train, y_train):.2f}")
print(f"测试集得分: {model.score(X_test, y_test):.2f}")
print(f"非零权重数量: {sum(model.coef_ != 0)}")  # Lasso 可以做特征选择
```

#### 弹性网络（Elastic Net）

结合 L1 和 L2 正则化：

```python
from sklearn.linear_model import ElasticNet

# 创建弹性网络模型
# l1_ratio: L1 正则化的比例，0-1 之间
model = ElasticNet(alpha=0.1, l1_ratio=0.5)
model.fit(X_train, y_train)

print(f"训练集得分: {model.score(X_train, y_train):.2f}")
print(f"测试集得分: {model.score(X_test, y_test):.2f}")
```

### 对比表格

| 模型 | 正则化 | 特点 | 适用场景 |
| --- | --- | --- | --- |
| LinearRegression | 无 | 简单，易过拟合 | 数据多、特征少 |
| Ridge | L2 | 权重趋近 0 但不为 0 | 特征多、有共线性 |
| Lasso | L1 | 权重可为 0（特征选择） | 特征多、需要选择 |
| ElasticNet | L1 + L2 | 结合两者优点 | 特征多、相关性强 |

---

## 4 多项式回归

### 问题

有些数据不是线性的，而是曲线关系。

### 解决方案

用多项式特征把线性模型变成非线性：

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
import numpy as np

# 示例数据：非线性关系
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([1, 4, 9, 16, 25])  # y = x^2

# 创建多项式回归管道
pipeline = Pipeline([
    ("poly", PolynomialFeatures(degree=2)),  # 生成 x, x^2
    ("linear", LinearRegression())
])

# 训练
pipeline.fit(X, y)

# 预测
X_new = np.array([[6], [7]])
y_pred = pipeline.predict(X_new)

print(f"预测结果: {y_pred}")  # 应该接近 36, 49
```

---

## 5 实战：波士顿房价预测

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score

# 加载数据（用糖尿病数据集代替）
diabetes = load_diabetes()
X, y = diabetes.data, diabetes.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 定义三个模型
models = {
    "线性回归": Pipeline([
        ("scaler", StandardScaler()),
        ("regressor", LinearRegression())
    ]),
    "岭回归": Pipeline([
        ("scaler", StandardScaler()),
        ("regressor", Ridge(alpha=1.0))
    ]),
    "Lasso 回归": Pipeline([
        ("scaler", StandardScaler()),
        ("regressor", Lasso(alpha=0.1))
    ])
}

# 训练并评估
for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="r2")
    
    print(f"\n{name}:")
    print(f"  MSE: {mse:.2f}")
    print(f"  R²: {r2:.2f}")
    print(f"  交叉验证 R²: {cv_scores.mean():.2f} (+/- {cv_scores.std() * 2:.2f})")
```

---

## 6 新手常见误区

### 误区 1："R² 越高越好"

**错！** R² 接近 1 可能是过拟合。应该用**交叉验证**评估模型泛化能力。

### 误区 2："不需要标准化"

**错！** 正则化回归（Ridge、Lasso）对特征尺度敏感，必须标准化。

### 误区 3："Lasso 和 Ridge 效果一样"

不是的。Lasso 可以做**特征选择**（权重变为 0），Ridge 不能。

### 误区 4："多项式阶数越高越好"

**错！** 阶数太高会过拟合。一般用 2-3 阶，配合交叉验证选择。

### 误区 5："回归只能用线性模型"

不是的。可以用：

- 决策树回归
- 随机森林回归
- SVM 回归
- 神经网络回归

---

## 7 动手练习

### 练习 1：基础练习

用线性回归拟合以下数据，预测 x=6 时的 y 值。

```python
X = [[1], [2], [3], [4], [5]]
y = [2, 4, 6, 8, 10]
```

<details>
<summary>点击查看答案</summary>

```python
from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])

# 创建并训练模型
model = LinearRegression()
model.fit(X, y)

# 预测
X_new = np.array([[6]])
y_pred = model.predict(X_new)

print(f"预测值: {y_pred[0]:.2f}")  # 应该接近 12
print(f"权重: {model.coef_[0]:.2f}")  # 斜率 = 2
print(f"截距: {model.intercept_:.2f}")  # 截距 = 0
```

</details>

### 练习 2：进阶练习

用 Ridge 和 Lasso 回归处理糖尿病数据集，对比两者的 R² 和非零权重数量。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.linear_model import Ridge, Lasso
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score

# 加载数据
diabetes = load_diabetes()
X_train, X_test, y_train, y_test = train_test_split(
    diabetes.data, diabetes.target, test_size=0.2, random_state=42
)

# Ridge 回归
ridge = Pipeline([
    ("scaler", StandardScaler()),
    ("regressor", Ridge(alpha=1.0))
])
ridge.fit(X_train, y_train)
y_pred_ridge = ridge.predict(X_test)

# Lasso 回归
lasso = Pipeline([
    ("scaler", StandardScaler()),
    ("regressor", Lasso(alpha=0.1))
])
lasso.fit(X_train, y_train)
y_pred_lasso = lasso.predict(X_test)

print(f"Ridge R²: {r2_score(y_test, y_pred_ridge):.2f}")
print(f"Lasso R²: {r2_score(y_test, y_pred_lasso):.2f}")
print(f"\nRidge 非零权重: {sum(ridge.named_steps['regressor'].coef_ != 0)}")
print(f"Lasso 非零权重: {sum(lasso.named_steps['regressor'].coef_ != 0)}")
```

</details>

### 练习 3（挑战）：综合练习

用多项式回归拟合非线性数据，对比不同阶数（1, 2, 3, 4）的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
import numpy as np

# 生成非线性数据
np.random.seed(42)
X = np.random.uniform(0, 10, 100).reshape(-1, 1)
y = 3 * X**2 - 2 * X + 5 + np.random.randn(100, 1) * 10

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 对比不同阶数
for degree in [1, 2, 3, 4]:
    pipeline = Pipeline([
        ("poly", PolynomialFeatures(degree=degree)),
        ("linear", LinearRegression())
    ])
    
    pipeline.fit(X_train, y_train)
    train_score = pipeline.score(X_train, y_train)
    test_score = pipeline.score(X_test, y_test)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="r2")
    
    print(f"\n阶数 {degree}:")
    print(f"  训练集 R²: {train_score:.2f}")
    print(f"  测试集 R²: {test_score:.2f}")
    print(f"  交叉验证 R²: {cv_scores.mean():.2f} (+/- {cv_scores.std() * 2:.2f})")
```

</details>

---

## 8 下一章预告

下一章我们会学习 **监督学习：分类算法**——逻辑回归、决策树、SVM、KNN、朴素贝叶斯。你会学到如何预测类别（如垃圾邮件检测、疾病诊断），以及不同分类器的特点和适用场景。
