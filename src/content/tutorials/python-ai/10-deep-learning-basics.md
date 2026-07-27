---
title: "第10章：深度学习基础"
description: "神经网络原理、激活函数、反向传播"
---

# 第10章：深度学习基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 深度学习是什么？和机器学习有什么区别？
- 神经网络是怎么工作的？
- 什么是激活函数？为什么需要它？
- 反向传播是什么？

这一章就是为了解答这些问题。深度学习是机器学习的一个分支，它使用多层神经网络来学习数据的复杂特征。

---

## 1 为什么需要深度学习？

### 痛点分析

传统机器学习在处理复杂数据时表现不佳：

```python
# ❌ 传统机器学习：需要手动提取特征
# 图像识别：需要人工设计特征（边缘、纹理、形状...）
features = extract_features(image)  # 手动设计
model.predict(features)
```

```python
# ✅ 深度学习：自动学习特征
# 神经网络自动从原始数据中学习特征
model = NeuralNetwork()
model.predict(raw_image)  # 直接输入原始数据
```

> **一句话总结**：深度学习能自动学习特征，不需要人工设计。

### 生活化类比

打个比方：

> 传统机器学习就像教小孩认猫，你要告诉他"有尖耳朵、有胡须的是猫"。
> 深度学习就像给小孩看1000张猫的照片，让他自己学会什么是猫。

---

## 2 核心原理：神经网络

### 概念解释

神经网络由多层神经元组成：

```
输入层        隐藏层        输出层
  ○            ○              ○
  ○    →      ○    →         ○
  ○            ○              ○
               ○
```

每个神经元接收输入，加权求和，通过激活函数输出：

```
输出 = 激活函数(权重1 × 输入1 + 权重2 × 输入2 + ... + 偏置)
```

### 生活化类比

> 神经网络就像公司的决策流程。
> 员工（输入层）收集信息，经理（隐藏层）分析信息，老板（输出层）做决策。

---

## 3 激活函数

### 概念解释

激活函数引入非线性，让网络能学习复杂模式：

```python
# 没有激活函数：只能学习线性关系
# 有激活函数：可以学习非线性关系
```

### 常用激活函数

```python
import numpy as np
import matplotlib.pyplot as plt

# ReLU（最常用）
def relu(x):
    return np.maximum(0, x)

# Sigmoid（二分类输出层）
def sigmoid(x):
    return 1 / (1 + np.exp(-x))

# Tanh（隐藏层）
def tanh(x):
    return np.tanh(x)

# 可视化
x = np.linspace(-5, 5, 100)
plt.figure(figsize=(12, 4))

plt.subplot(1, 3, 1)
plt.plot(x, relu(x), 'b-', linewidth=2)
plt.title('ReLU')
plt.grid(True)

plt.subplot(1, 3, 2)
plt.plot(x, sigmoid(x), 'r-', linewidth=2)
plt.title('Sigmoid')
plt.grid(True)

plt.subplot(1, 3, 3)
plt.plot(x, tanh(x), 'g-', linewidth=2)
plt.title('Tanh')
plt.grid(True)

plt.tight_layout()
plt.show()
```

### 激活函数对比

| 激活函数 | 公式 | 优点 | 缺点 | 使用场景 |
| --- | --- | --- | --- | --- |
| ReLU | max(0, x) | 计算快，收敛快 | 神经元死亡 | 隐藏层（默认） |
| Sigmoid | 1/(1+e^-x) | 输出[0,1] | 梯度消失 | 二分类输出层 |
| Tanh | tanh(x) | 输出[-1,1] | 梯度消失 | RNN隐藏层 |
| Leaky ReLU | max(0.01x, x) | 解决死亡问题 | 效果不稳定 | 特殊场景 |

---

## 4 前向传播与反向传播

### 前向传播

数据从输入到输出的流动过程：

```python
# 前向传播：输入 → 隐藏层 → 输出层
def forward(x, weights, biases):
    # 第1层
    z1 = np.dot(x, weights[0]) + biases[0]
    a1 = relu(z1)  # 激活
    
    # 第2层
    z2 = np.dot(a1, weights[1]) + biases[1]
    a2 = sigmoid(z2)  # 输出层
    
    return a2
```

### 反向传播

计算梯度，更新权重：

```python
# 反向传播：计算误差，更新权重
def backward(x, y, weights, biases, learning_rate=0.01):
    # 前向传播
    a1, a2 = forward(x, weights, biases)
    
    # 计算误差
    error = y - a2
    
    # 计算梯度（简化版）
    delta2 = error * sigmoid_derivative(a2)
    delta1 = delta2.dot(weights[1].T) * relu_derivative(a1)
    
    # 更新权重
    weights[1] += learning_rate * a1.T.dot(delta2)
    weights[0] += learning_rate * x.T.dot(delta1)
    
    return weights, biases
```

### 生活化类比

> 前向传播就像考试答题，从题目到答案。
> 反向传播就像对答案，发现错误后调整解题方法。

---

## 5 损失函数

### 概念解释

损失函数衡量预测值与真实值的差距：

```python
# 均方误差（回归任务）
def mse(y_true, y_pred):
    return np.mean((y_true - y_pred) ** 2)

# 交叉熵损失（分类任务）
def cross_entropy(y_true, y_pred):
    return -np.mean(y_true * np.log(y_pred + 1e-8))
```

### 损失函数对比

| 任务类型 | 损失函数 | 公式 |
| --- | --- | --- |
| 回归 | MSE（均方误差） | (y-ŷ)² |
| 二分类 | Binary Cross Entropy | -[y·log(ŷ)+(1-y)·log(1-ŷ)] |
| 多分类 | Categorical Cross Entropy | -Σy·log(ŷ) |

---

## 6 优化器

### 概念解释

优化器决定如何更新权重：

```python
# 梯度下降（最简单）
weights = weights - learning_rate * gradient

# 动量法（加速收敛）
velocity = momentum * velocity + gradient
weights = weights - learning_rate * velocity

# Adam（自适应学习率，最常用）
# 结合了动量和RMSprop的优点
```

### 优化器对比

| 优化器 | 特点 | 使用场景 |
| --- | --- | --- |
| SGD | 简单，但收敛慢 | 小数据集 |
| Momentum | 加速收敛 | 一般场景 |
| RMSprop | 自适应学习率 | RNN |
| Adam | 最常用，效果好 | 默认选择 |

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 神经网络 | 多层神经元组成，自动学习特征 |
| 激活函数 | 引入非线性，常用ReLU、Sigmoid |
| 前向传播 | 数据从输入到输出 |
| 反向传播 | 计算梯度，更新权重 |
| 损失函数 | 衡量预测误差 |
| 优化器 | 决定如何更新权重 |

---

## 8 新手常见误区

### 误区 1："网络越深越好"

**错！** 网络太深会梯度消失，训练困难：

```python
# ❌ 错误：100层网络
model = Sequential([Dense(100) for _ in range(100)])

# ✅ 正确：通常2-5层就够
model = Sequential([
    Dense(64, activation='relu'),
    Dense(32, activation='relu'),
    Dense(1, activation='sigmoid')
])
```

### 误区 2："ReLU会导致神经元死亡"

不是的。Leaky ReLU可以解决这个问题：

```python
# ReLU：x<0时梯度为0，可能导致神经元死亡
def relu(x):
    return max(0, x)

# Leaky ReLU：x<0时有小梯度
def leaky_relu(x, alpha=0.01):
    return max(alpha * x, x)
```

### 误区 3："学习率越大越好"

学习率太大会震荡，太小会收敛慢：

```python
# ❌ 错误：学习率太大
optimizer = SGD(learning_rate=10)  # 会震荡

# ✅ 正确：合适的学习率
optimizer = Adam(learning_rate=0.001)  # 通常0.001是好起点
```

---

## 9 动手练习

### 练习 1：基础练习

实现ReLU和Sigmoid激活函数，并绘制它们的图像。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
import matplotlib.pyplot as plt

# ReLU
def relu(x):
    return np.maximum(0, x)

# Sigmoid
def sigmoid(x):
    return 1 / (1 + np.exp(-x))

# 绘制图像
x = np.linspace(-5, 5, 100)
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(x, relu(x), 'b-', linewidth=2)
plt.title('ReLU函数')
plt.xlabel('x')
plt.ylabel('ReLU(x)')
plt.grid(True)

plt.subplot(1, 2, 2)
plt.plot(x, sigmoid(x), 'r-', linewidth=2)
plt.title('Sigmoid函数')
plt.xlabel('x')
plt.ylabel('Sigmoid(x)')
plt.grid(True)

plt.tight_layout()
plt.show()
```

</details>

### 练习 2：进阶练习

实现一个简单的两层神经网络（不用框架），完成XOR问题。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# XOR数据
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([[0], [1], [1], [0]])

# 激活函数
def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def sigmoid_derivative(x):
    return x * (1 - x)

# 初始化权重
np.random.seed(42)
weights1 = np.random.randn(2, 4)
weights2 = np.random.randn(4, 1)
bias1 = np.random.randn(1, 4)
bias2 = np.random.randn(1, 1)

# 训练
learning_rate = 0.1
for epoch in range(10000):
    # 前向传播
    z1 = X.dot(weights1) + bias1
    a1 = sigmoid(z1)
    z2 = a1.dot(weights2) + bias2
    a2 = sigmoid(z2)
    
    # 计算误差
    error = y - a2
    
    # 反向传播
    delta2 = error * sigmoid_derivative(a2)
    delta1 = delta2.dot(weights2.T) * sigmoid_derivative(a1)
    
    # 更新权重
    weights2 += a1.T.dot(delta2) * learning_rate
    weights1 += X.T.dot(delta1) * learning_rate
    bias2 += np.sum(delta2, axis=0, keepdims=True) * learning_rate
    bias1 += np.sum(delta1, axis=0, keepdims=True) * learning_rate
    
    if epoch % 1000 == 0:
        print(f"Epoch {epoch}, Loss: {np.mean(np.abs(error)):.4f}")

# 测试
print("\n预测结果:")
print(a2)
```

</details>

### 练习 3（挑战）：综合练习

用NumPy实现一个完整的神经网络（前向传播+反向传播），训练它识别手写数字（简化版）。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

# 加载数据
digits = load_digits()
X = digits.data / 16.0  # 归一化
y = digits.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# One-hot编码
encoder = OneHotEncoder(sparse=False)
y_train_onehot = encoder.fit_transform(y_train.reshape(-1, 1))

# 激活函数
def relu(x):
    return np.maximum(0, x)

def relu_derivative(x):
    return (x > 0).astype(float)

def softmax(x):
    exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
    return exp_x / np.sum(exp_x, axis=1, keepdims=True)

# 初始化网络
input_size = 64
hidden_size = 128
output_size = 10

np.random.seed(42)
W1 = np.random.randn(input_size, hidden_size) * 0.01
b1 = np.zeros((1, hidden_size))
W2 = np.random.randn(hidden_size, output_size) * 0.01
b2 = np.zeros((1, output_size))

# 训练参数
learning_rate = 0.01
epochs = 1000
batch_size = 32

# 训练
for epoch in range(epochs):
    # 随机选择batch
    indices = np.random.choice(len(X_train), batch_size, replace=False)
    X_batch = X_train[indices]
    y_batch = y_train_onehot[indices]
    
    # 前向传播
    z1 = X_batch.dot(W1) + b1
    a1 = relu(z1)
    z2 = a1.dot(W2) + b2
    a2 = softmax(z2)
    
    # 计算损失
    loss = -np.mean(y_batch * np.log(a2 + 1e-8))
    
    # 反向传播
    dz2 = a2 - y_batch
    dW2 = a1.T.dot(dz2) / batch_size
    db2 = np.mean(dz2, axis=0, keepdims=True)
    
    da1 = dz2.dot(W2.T)
    dz1 = da1 * relu_derivative(z1)
    dW1 = X_batch.T.dot(dz1) / batch_size
    db1 = np.mean(dz1, axis=0, keepdims=True)
    
    # 更新权重
    W1 -= learning_rate * dW1
    b1 -= learning_rate * db1
    W2 -= learning_rate * dW2
    b2 -= learning_rate * db2
    
    if epoch % 100 == 0:
        print(f"Epoch {epoch}, Loss: {loss:.4f}")

# 测试
z1 = X_test.dot(W1) + b1
a1 = relu(z1)
z2 = a1.dot(W2) + b2
predictions = np.argmax(z2, axis=1)
accuracy = np.mean(predictions == y_test)
print(f"\n测试准确率: {accuracy:.2%}")
```

</details>

---

## 下一章预告

下一章我们会学习 **PyTorch 框架入门**——张量操作、自动求导、模型构建，用现代框架实现深度学习。
