---
title: "第3章：线性回归"
description: "一元线性回归、多元线性回归、损失函数、梯度下降"
---

# 第3章：线性回归

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是线性回归？它能解决什么问题？
- 如何找到最佳的拟合直线？
- 什么是损失函数？为什么要最小化损失？
- 梯度下降是怎么工作的？

这一章就是为了解答这些问题。线性回归是机器学习的入门算法，理解它对学习其他算法非常重要。

---

## 1 为什么需要线性回归？

### 痛点分析

假设你要预测房价。你收集了一些数据：

```
房屋面积（平方米）: [50, 60, 70, 80, 90, 100]
房价（万元）: [150, 180, 210, 240, 270, 300]
```

问题：给你一个 85 平方米的房子，价格应该是多少？

传统方法：
- 手动计算比例？不够准确
- 画个图估算？太粗糙
- 用平均值？误差太大

### 解决方案

线性回归自动找到一条最佳拟合直线：

```python
# 线性回归：y = wx + b
# w: 权重（斜率），b: 偏置（截距）
# 自动学习 w 和 b，使得预测值尽可能接近真实值

房价 = w * 面积 + b
# 假设学到 w=3, b=0
# 那么 85平方米的房子：房价 = 3 * 85 + 0 = 255万元
```

打个比方：

> 线性回归像"找规律"游戏：给你一些点，你画一条直线穿过这些点，然后用这条直线预测新的点。

> **一句话总结**：线性回归用一条直线拟合数据，用于预测连续值。

---

## 2 核心原理

### 一元线性回归

模型：`y = wx + b`

- `y`: 预测值（如房价）
- `x`: 输入特征（如面积）
- `w`: 权重（斜率，表示x每增加1，y增加多少）
- `b`: 偏置（截距，x=0时y的值）

目标：找到最佳的 w 和 b，使得预测值尽可能接近真实值。

### 损失函数

损失函数衡量预测值与真实值的差距：

```python
# 均方误差（MSE）
MSE = (1/n) * Σ(y_pred - y_true)^2

# y_pred: 预测值
# y_true: 真实值
# n: 样本数量
# Σ: 求和
```

打个比方：

> 损失函数像"考试扣分"：预测值和真实值差得越多，扣分越多。我们的目标是让扣分最少。

### 梯度下降

梯度下降是优化损失函数的算法：

```
1. 随机初始化 w 和 b
2. 计算损失函数
3. 计算梯度（损失函数的导数）
4. 沿着梯度的反方向更新 w 和 b
5. 重复步骤2-4，直到损失最小
```

打个比方：

> 梯度下降像"下山"：你蒙着眼睛在山上下山，每次用脚探一探哪个方向最陡，就往那个方向走一步，直到走到最低点。

---

## 3 基础用法

### 使用 sklearn 实现线性回归

```python
import numpy as np
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt

# 1. 准备数据
# 房屋面积（平方米）
X = np.array([50, 60, 70, 80, 90, 100]).reshape(-1, 1)  # reshape(-1, 1) 转换为列向量
# 房价（万元）
y = np.array([150, 180, 210, 240, 270, 300])

print("特征数据 X：")
print(X.flatten())  # flatten() 展平为一维数组
print("\n目标数据 y：")
print(y)

# 2. 创建模型
model = LinearRegression()  # 创建线性回归模型

# 3. 训练模型
# fit() 方法会自动计算最佳的 w 和 b
model.fit(X, y)

# 4. 查看模型参数
print(f"\n模型参数：")
print(f"权重 w（斜率）: {model.coef_[0]:.2f}")  # 输出：3.00
print(f"偏置 b（截距）: {model.intercept_:.2f}")  # 输出：0.00

# 5. 预测新数据
X_new = np.array([[85]])  # 85平方米的房子
y_pred = model.predict(X_new)
print(f"\n85平方米的房子预测价格：{y_pred[0]:.2f}万元")

# 6. 对所有训练数据进行预测
y_train_pred = model.predict(X)
print(f"\n训练数据预测结果：")
for i in range(len(X)):
    print(f"面积：{X[i][0]}平方米，真实价格：{y[i]}万元，预测价格：{y_train_pred[i]:.2f}万元")

# 7. 评估模型
from sklearn.metrics import mean_squared_error, r2_score

mse = mean_squared_error(y, y_train_pred)  # 均方误差
rmse = np.sqrt(mse)  # 均方根误差
r2 = r2_score(y, y_train_pred)  # R²分数

print(f"\n模型评估：")
print(f"均方误差 MSE: {mse:.2f}")
print(f"均方根误差 RMSE: {rmse:.2f}")
print(f"R²分数: {r2:.4f}")  # R²越接近1，模型越好
```

### 多元线性回归

```python
import numpy as np
from sklearn.linear_model import LinearRegression

# 多元线性回归：y = w1*x1 + w2*x2 + w3*x3 + b
# 多个特征预测目标值

# 1. 准备数据
# 特征：面积、房间数、房龄
X = np.array([
    [100, 3, 5],   # 100平方米，3个房间，5年房龄
    [120, 4, 3],
    [80, 2, 10],
    [150, 5, 2],
    [90, 3, 8],
    [110, 4, 4]
])

# 目标：房价（万元）
y = np.array([300, 400, 220, 500, 260, 350])

print("特征数据 X（面积、房间数、房龄）：")
print(X)
print("\n目标数据 y（房价）：")
print(y)

# 2. 创建并训练模型
model = LinearRegression()
model.fit(X, y)

# 3. 查看模型参数
print(f"\n模型参数：")
print(f"权重: {model.coef_}")  # 每个特征的权重
print(f"偏置: {model.intercept_:.2f}")

# 解释权重
print(f"\n权重解释：")
print(f"面积每增加1平方米，房价增加 {model.coef_[0]:.2f}万元")
print(f"房间数每增加1个，房价增加 {model.coef_[1]:.2f}万元")
print(f"房龄每增加1年，房价减少 {abs(model.coef_[2]):.2f}万元")

# 4. 预测新数据
X_new = np.array([[95, 3, 6]])  # 95平方米，3个房间，6年房龄
y_pred = model.predict(X_new)
print(f"\n预测房价：{y_pred[0]:.2f}万元")

# 5. 评估模型
from sklearn.metrics import r2_score
y_train_pred = model.predict(X)
r2 = r2_score(y, y_train_pred)
print(f"\nR²分数: {r2:.4f}")
```

### 手动实现梯度下降

```python
import numpy as np

# 手动实现梯度下降，理解原理

# 1. 准备数据
X = np.array([50, 60, 70, 80, 90, 100])
y = np.array([150, 180, 210, 240, 270, 300])
n = len(X)  # 样本数量

# 2. 初始化参数
w = 0  # 权重
b = 0  # 偏置
learning_rate = 0.01  # 学习率（步长）
epochs = 1000  # 迭代次数

print("开始训练...")

# 3. 梯度下降
for epoch in range(epochs):
    # 计算预测值
    y_pred = w * X + b
    
    # 计算损失（MSE）
    loss = (1/n) * np.sum((y_pred - y) ** 2)
    
    # 计算梯度
    # dw = (2/n) * Σ(y_pred - y) * x
    # db = (2/n) * Σ(y_pred - y)
    dw = (2/n) * np.sum((y_pred - y) * X)
    db = (2/n) * np.sum(y_pred - y)
    
    # 更新参数
    w = w - learning_rate * dw
    b = b - learning_rate * db
    
    # 每100次打印一次损失
    if (epoch + 1) % 100 == 0:
        print(f"第{epoch+1}次迭代，损失：{loss:.2f}，w={w:.2f}，b={b:.2f}")

print(f"\n最终参数：w={w:.2f}，b={b:.2f}")

# 4. 预测
X_new = 85
y_pred = w * X_new + b
print(f"85平方米的房子预测价格：{y_pred:.2f}万元")

# 5. 验证
print("\n训练数据预测结果：")
for i in range(len(X)):
    pred = w * X[i] + b
    print(f"面积：{X[i]}，真实：{y[i]}，预测：{pred:.2f}，误差：{abs(y[i]-pred):.2f}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 公式/方法 |
| --- | --- | --- |
| 一元线性回归 | 一个特征预测目标值 | y = wx + b |
| 多元线性回归 | 多个特征预测目标值 | y = w1x1 + w2x2 + ... + b |
| 损失函数 | 衡量预测误差 | MSE = (1/n)Σ(y_pred - y)² |
| 梯度下降 | 优化参数的算法 | w = w - lr * dw |
| 学习率 | 控制更新步长 | 太大震荡，太小收敛慢 |
| MSE | 均方误差 | 对异常值敏感 |
| RMSE | 均方根误差 | MSE的平方根，单位一致 |
| R² | 决定系数 | 越接近1越好 |

---

## 5 新手常见误区

### 误区 1："学习率越大越好"

**错！** 学习率太大会导致参数在最优解附近震荡，甚至发散。学习率太小则收敛太慢。需要通过实验选择合适的学习率。

### 误区 2："线性回归只能处理线性关系"

不是的。虽然模型是线性的，但可以通过特征变换处理非线性关系。例如，添加多项式特征（x², x³）可以拟合曲线。

### 误区 3："特征越多，模型越好"

**错！** 特征太多会导致过拟合，模型在训练集上表现好，在测试集上表现差。应该通过特征选择保留重要特征。

### 误区 4："线性回归不需要特征缩放"

**错！** 虽然线性回归有解析解，不需要梯度下降，但如果使用梯度下降优化，特征缩放可以加快收敛速度。另外，特征缩放可以让权重具有可比性。

### 误区 5："R²=1就是完美模型"

不是的。R²=1可能意味着过拟合，模型记住了训练数据而不是学习规律。要看测试集的R²，并且结合实际问题判断。

---

## 6 动手练习

### 练习 1：基础练习 - 简单线性回归

使用 sklearn 对给定的数据进行线性回归。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
from sklearn.linear_model import LinearRegression

# 数据：学习时间和考试成绩
X = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).reshape(-1, 1)  # 学习时间（小时）
y = np.array([20, 30, 35, 45, 50, 60, 65, 75, 80, 90])  # 考试成绩（分）

# 创建并训练模型
model = LinearRegression()
model.fit(X, y)

# 查看参数
print(f"权重（每小时提分）: {model.coef_[0]:.2f}")
print(f"偏置（基础分）: {model.intercept_:.2f}")

# 预测
study_time = 6.5
score_pred = model.predict([[study_time]])
print(f"\n学习{study_time}小时，预测成绩：{score_pred[0]:.2f}分")
```

</details>

### 练习 2：进阶练习 - 多元线性回归

使用波士顿房价数据集进行多元线性回归。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_boston
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# 加载数据
boston = load_boston()
X = boston.data
y = boston.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建并训练模型
model = LinearRegression()
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print(f"均方误差 MSE: {mse:.2f}")
print(f"均方根误差 RMSE: {rmse:.2f}")
print(f"R²分数: {r2:.4f}")

# 查看特征重要性
print(f"\n特征权重（前5个）: {model.coef_[:5]}")
```

</details>

### 练习 3（挑战）：综合练习 - 手动实现梯度下降

手动实现梯度下降算法，并可视化训练过程。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 数据
X = np.array([1, 2, 3, 4, 5])
y = np.array([2, 4, 5, 4, 5])
n = len(X)

# 参数
w = 0
b = 0
lr = 0.01
epochs = 100

# 记录训练过程
loss_history = []

# 梯度下降
for epoch in range(epochs):
    y_pred = w * X + b
    loss = (1/n) * np.sum((y_pred - y) ** 2)
    loss_history.append(loss)
    
    dw = (2/n) * np.sum((y_pred - y) * X)
    db = (2/n) * np.sum(y_pred - y)
    
    w -= lr * dw
    b -= lr * db

print(f"最终参数：w={w:.2f}，b={b:.2f}")
print(f"初始损失：{loss_history[0]:.2f}，最终损失：{loss_history[-1]:.2f}")

# 预测
X_new = 6
y_pred = w * X_new + b
print(f"X={X_new}时，预测值：{y_pred:.2f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **逻辑回归** —— 虽然名字里有"回归"，但它是一个分类算法。你会学到如何用逻辑回归进行二分类，以及 Sigmoid 函数的作用。
