---
title: "第11章：PyTorch 框架入门"
description: "张量操作、自动求导、模型构建"
---

# 第11章：PyTorch 框架入门

## 本章导读

在学这一章之前，你可能会有这些疑问：

- PyTorch 是什么？为什么选择它？
- 什么是张量？和 NumPy 数组有什么区别？
- 自动求导是怎么工作的？
- 如何用 PyTorch 构建神经网络？

这一章就是为了解答这些问题。PyTorch 是目前最流行的深度学习框架之一，它的动态计算图让模型构建变得简单直观。

---

## 1 为什么需要 PyTorch？

### 痛点分析

用 NumPy 手写神经网络很复杂：

```python
# ❌ NumPy 手写：需要手动实现前向传播、反向传播
# 代码复杂，容易出错，难以调试
weights = np.random.randn(100, 50)
output = np.dot(input, weights)
# ... 几百行代码
```

```python
# ✅ PyTorch：自动求导，简洁高效
import torch
import torch.nn as nn

model = nn.Linear(100, 50)  # 一行定义层
output = model(input)       # 自动前向传播
loss.backward()             # 自动反向传播
```

> **一句话总结**：PyTorch 让深度学习变得简单。

### 生活化类比

打个比方：

> NumPy 手写就像自己造车，PyTorch 就像直接买辆车。
> 你不需要知道发动机怎么工作，只需要会开车就行。

---

## 2 核心原理：张量

### 概念解释

张量（Tensor）是 PyTorch 的基本数据结构，类似 NumPy 的多维数组：

```python
# 0维张量（标量）
scalar = torch.tensor(3.14)

# 1维张量（向量）
vector = torch.tensor([1, 2, 3])

# 2维张量（矩阵）
matrix = torch.tensor([[1, 2], [3, 4]])

# 3维张量（立方体）
cube = torch.randn(2, 3, 4)
```

### 张量 vs NumPy 数组

| 特性 | PyTorch 张量 | NumPy 数组 |
| --- | --- | --- |
| GPU 加速 | 支持 | 不支持 |
| 自动求导 | 支持 | 不支持 |
| 动态计算图 | 支持 | 不支持 |
| 互转 | 可以 | 可以 |

---

## 3 张量操作

### 创建张量

```python
import torch

# 从列表创建
t1 = torch.tensor([1, 2, 3])

# 创建特殊张量
zeros = torch.zeros(2, 3)          # 全0
ones = torch.ones(2, 3)            # 全1
rand = torch.rand(2, 3)            # 均匀分布 [0, 1)
randn = torch.randn(2, 3)          # 标准正态分布
arange = torch.arange(0, 10, 2)    # [0, 2, 4, 6, 8]
linspace = torch.linspace(0, 1, 5) # [0, 0.25, 0.5, 0.75, 1]

# 与 NumPy 互转
import numpy as np
np_array = np.array([1, 2, 3])
tensor = torch.from_numpy(np_array)
back_to_numpy = tensor.numpy()
```

### 张量运算

```python
import torch

a = torch.tensor([1, 2, 3])
b = torch.tensor([4, 5, 6])

# 基本运算
print(a + b)        # [5, 7, 9]
print(a * b)        # [4, 10, 18]
print(a ** 2)       # [1, 4, 9]

# 矩阵运算
A = torch.tensor([[1, 2], [3, 4]])
B = torch.tensor([[5, 6], [7, 8]])

print(torch.mm(A, B))      # 矩阵乘法
print(A @ B)               # 矩阵乘法（简写）
print(A.T)                 # 转置

# 统计运算
x = torch.randn(100)
print(x.mean())            # 均值
print(x.std())             # 标准差
print(x.max())             # 最大值
print(x.min())             # 最小值
```

### GPU 加速

```python
import torch

# 检查 CUDA 是否可用
print(torch.cuda.is_available())

# 创建 GPU 张量
if torch.cuda.is_available():
    device = torch.device("cuda")
    x_gpu = torch.tensor([1, 2, 3], device=device)
    
    # CPU 和 GPU 互转
    x_cpu = torch.tensor([1, 2, 3])
    x_to_gpu = x_cpu.to(device)
    x_back_cpu = x_to_gpu.cpu()
```

---

## 4 自动求导

### 概念解释

PyTorch 的自动求导机制（autograd）自动计算梯度：

```python
import torch

# 创建需要梯度的张量
x = torch.tensor(2.0, requires_grad=True)

# 定义函数 y = x^2 + 2x + 1
y = x ** 2 + 2 * x + 1

# 反向传播，计算梯度
y.backward()

# dy/dx = 2x + 2 = 2*2 + 2 = 6
print(x.grad)  # tensor(6.)
```

### 计算图

```python
import torch

# 创建计算图
x = torch.tensor(1.0, requires_grad=True)
y = torch.tensor(2.0, requires_grad=True)

z = x ** 2 + y  # z = x^2 + y
w = z * 3       # w = 3z

# 反向传播
w.backward()

print(x.grad)  # dz/dx = 2x = 2
print(y.grad)  # dz/dy = 1
```

### 生活化类比

> 自动求导就像自动记账。
> 你只需要定义运算，PyTorch 自动记录计算过程，需要时自动计算梯度。

---

## 5 构建神经网络

### nn.Module

PyTorch 用类的方式定义神经网络：

```python
import torch
import torch.nn as nn

class SimpleNN(nn.Module):
    def __init__(self):
        super(SimpleNN, self).__init__()
        # 定义层
        self.fc1 = nn.Linear(784, 128)  # 输入层到隐藏层
        self.fc2 = nn.Linear(128, 64)   # 隐藏层到隐藏层
        self.fc3 = nn.Linear(64, 10)    # 隐藏层到输出层
        self.relu = nn.ReLU()           # 激活函数
    
    def forward(self, x):
        # 前向传播
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return x

# 创建模型
model = SimpleNN()
print(model)
```

### Sequential 方式

更简洁的定义方式：

```python
import torch.nn as nn

# 使用 Sequential
model = nn.Sequential(
    nn.Linear(784, 128),
    nn.ReLU(),
    nn.Linear(128, 64),
    nn.ReLU(),
    nn.Linear(64, 10)
)

print(model)
```

### 常用层

```python
import torch.nn as nn

# 全连接层
fc = nn.Linear(in_features=100, out_features=50)

# 卷积层
conv = nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3)

# 池化层
pool = nn.MaxPool2d(kernel_size=2, stride=2)

# Dropout
dropout = nn.Dropout(p=0.5)

# BatchNorm
bn = nn.BatchNorm1d(num_features=100)
```

---

## 6 训练流程

### 完整训练循环

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# 1. 准备数据
X = torch.randn(1000, 20)
y = torch.randint(0, 2, (1000,))
dataset = TensorDataset(X, y)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

# 2. 定义模型
model = nn.Sequential(
    nn.Linear(20, 64),
    nn.ReLU(),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Linear(32, 1)
)

# 3. 定义损失函数和优化器
criterion = nn.BCEWithLogitsLoss()  # 二分类损失
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 4. 训练循环
epochs = 100
for epoch in range(epochs):
    model.train()  # 训练模式
    
    for batch_X, batch_y in dataloader:
        # 前向传播
        outputs = model(batch_X).squeeze()
        loss = criterion(outputs, batch_y.float())
        
        # 反向传播
        optimizer.zero_grad()  # 清空梯度
        loss.backward()        # 计算梯度
        optimizer.step()       # 更新参数
    
    if (epoch + 1) % 10 == 0:
        print(f"Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}")
```

### 评估模型

```python
# 评估模式
model.eval()

# 不计算梯度
with torch.no_grad():
    outputs = model(X_test)
    predictions = (outputs.squeeze() > 0).float()
    accuracy = (predictions == y_test).float().mean()
    print(f"测试准确率: {accuracy:.2%}")
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 张量 | PyTorch 基本数据结构，支持 GPU |
| 自动求导 | autograd 自动计算梯度 |
| nn.Module | 定义神经网络的基类 |
| Sequential | 简洁的模型定义方式 |
| 训练循环 | 前向传播 → 计算损失 → 反向传播 → 更新参数 |

---

## 8 新手常见误区

### 误区 1："忘记 zero_grad()"

**错！** 每次反向传播前必须清空梯度：

```python
# ❌ 错误：不清空梯度
loss.backward()
optimizer.step()
loss.backward()  # 梯度会累加！

# ✅ 正确：每次清空
optimizer.zero_grad()
loss.backward()
optimizer.step()
```

### 误区 2："训练时忘记 model.train()"

不是的。训练和评估模式不同：

```python
# ❌ 错误：训练时没设置模式
outputs = model(X)

# ✅ 正确：训练时设置 train 模式
model.train()
outputs = model(X)

# 评估时设置 eval 模式
model.eval()
```

### 误区 3："评估时还计算梯度"

评估时不需要梯度，浪费内存：

```python
# ❌ 错误：评估时计算梯度
outputs = model(X_test)

# ✅ 正确：用 no_grad 上下文
with torch.no_grad():
    outputs = model(X_test)
```

---

## 9 动手练习

### 练习 1：基础练习

创建一个 3x3 的张量，计算它的转置和逆矩阵。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 创建 3x3 张量
A = torch.tensor([[1, 2, 3],
                  [0, 1, 4],
                  [5, 6, 0]], dtype=torch.float32)

# 转置
A_T = A.T
print("转置:\n", A_T)

# 逆矩阵
A_inv = torch.inverse(A)
print("逆矩阵:\n", A_inv)

# 验证：A @ A_inv 应该接近单位矩阵
print("验证:\n", A @ A_inv)
```

</details>

### 练习 2：进阶练习

用 PyTorch 实现一个简单的两层神经网络，训练它解决 XOR 问题。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim

# XOR 数据
X = torch.tensor([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=torch.float32)
y = torch.tensor([[0], [1], [1], [0]], dtype=torch.float32)

# 定义模型
model = nn.Sequential(
    nn.Linear(2, 8),
    nn.ReLU(),
    nn.Linear(8, 1),
    nn.Sigmoid()
)

# 损失函数和优化器
criterion = nn.BCELoss()
optimizer = optim.Adam(model.parameters(), lr=0.01)

# 训练
for epoch in range(1000):
    # 前向传播
    outputs = model(X)
    loss = criterion(outputs, y)
    
    # 反向传播
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    
    if (epoch + 1) % 100 == 0:
        print(f"Epoch [{epoch+1}/1000], Loss: {loss.item():.4f}")

# 测试
with torch.no_grad():
    predictions = model(X)
    print("\n预测结果:")
    print(predictions)
    print("\n四舍五入:")
    print(predictions.round())
```

</details>

### 练习 3（挑战）：综合练习

用 PyTorch 实现一个完整的分类任务（使用 Iris 数据集），包括数据加载、模型训练、评估。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 标准化
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# 转换为张量
X_train = torch.tensor(X_train, dtype=torch.float32)
y_train = torch.tensor(y_train, dtype=torch.long)
X_test = torch.tensor(X_test, dtype=torch.float32)
y_test = torch.tensor(y_test, dtype=torch.long)

# 定义模型
model = nn.Sequential(
    nn.Linear(4, 16),
    nn.ReLU(),
    nn.Linear(16, 8),
    nn.ReLU(),
    nn.Linear(8, 3)
)

# 损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.01)

# 训练
for epoch in range(100):
    # 前向传播
    outputs = model(X_train)
    loss = criterion(outputs, y_train)
    
    # 反向传播
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    
    if (epoch + 1) % 20 == 0:
        print(f"Epoch [{epoch+1}/100], Loss: {loss.item():.4f}")

# 评估
model.eval()
with torch.no_grad():
    outputs = model(X_test)
    _, predicted = torch.max(outputs, 1)
    accuracy = (predicted == y_test).float().mean()
    print(f"\n测试准确率: {accuracy:.2%}")
```

</details>

---

## 下一章预告

下一章我们会学习 **卷积神经网络（CNN）**——图像识别的利器，了解卷积层、池化层的工作原理。
