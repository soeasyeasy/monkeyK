---
title: "第2章：神经网络基础"
description: "深入理解神经网络的基本结构，从感知机到多层神经网络，掌握前向传播原理"
---

# 第2章：神经网络基础

## 本章导读

在开始学习神经网络之前，你可能会有这些疑问：

- 什么是感知机？它和神经网络有什么关系？
- 神经网络是如何工作的？为什么需要多层？
- 什么是前向传播？数据在神经网络中是如何流动的？
- 如何用代码实现一个简单的神经网络？

这一章会带你从零开始理解神经网络的基本结构，并通过代码实现一个完整的神经网络。

---

## 1 为什么需要神经网络？

### 传统方法的局限

对于简单问题，我们可以用数学公式直接解决。但对于复杂问题，比如识别手写数字，很难写出明确的规则：

```
如果像素值 > 阈值 且 形状像圆 → 是数字 0？
如果像素值 > 阈值 且 形状像竖线 → 是数字 1？
```

这种方式的问题：
- 规则难以穷举
- 无法处理复杂模式
- 需要大量人工设计

### 神经网络的思路

神经网络模仿人脑的工作方式：通过大量简单的处理单元（神经元）组合，自动学习复杂的模式。

打个比方：

> 神经网络就像一个投票系统。每个神经元都有自己的"意见"，通过加权投票得出最终结论。训练过程就是调整每个神经元的"话语权"。

---

## 2 感知机：神经网络的起点

### 什么是感知机？

感知机是最简单的神经网络，由 Frank Rosenblatt 在 1958 年提出。

感知机的结构：

```
输入 x1 → 权重 w1 → 
输入 x2 → 权重 w2 → 加权求和 → 激活函数 → 输出
输入 x3 → 权重 w3 →
```

### 感知机的数学表达

```python
# 感知机的计算过程
import numpy as np

# 输入
x = np.array([1, 2, 3])  # 3 个输入特征

# 权重和偏置
w = np.array([0.5, -0.3, 0.8])  # 每个输入的权重
b = 0.1  # 偏置

# 加权求和
z = np.dot(x, w) + b  # z = 1*0.5 + 2*(-0.3) + 3*0.8 + 0.1 = 2.0

# 激活函数（阶跃函数）
def step_function(z):
    return 1 if z > 0 else 0

output = step_function(z)  # 输出 1
print(f"感知机输出: {output}")
```

### 感知机的局限

感知机只能解决**线性可分**的问题。对于 XOR 问题（异或），感知机无法解决：

| x1 | x2 | XOR 输出 |
|----|----|----------|
| 0  | 0  | 0        |
| 0  | 1  | 1        |
| 1  | 0  | 1        |
| 1  | 1  | 0        |

XOR 问题不是线性可分的，需要多层神经网络。

---

## 3 多层神经网络

### 为什么需要多层？

单层神经网络只能学习线性关系。多层神经网络通过组合多个线性变换，可以学习任意复杂的非线性关系。

打个比方：

> 单层神经网络就像用一条直线分割数据。多层神经网络就像用多条直线组合，可以画出任意复杂的边界。

### 多层神经网络的结构

```
输入层        隐藏层1       隐藏层2       输出层
  ○  →  ○  ○  →  ○  ○  →  ○
  ○  →  ○  ○  →  ○  ○  →  ○
  ○  →  ○  ○  →  ○  ○
```

- **输入层**：接收原始数据
- **隐藏层**：进行特征提取和变换（可以有多层）
- **输出层**：产生最终结果

### 神经网络的参数

每个连接都有一个权重 w，每个神经元都有一个偏置 b：

```python
# 一个简单多层神经网络的参数
import numpy as np

# 输入层到隐藏层1的权重和偏置
W1 = np.random.randn(3, 4)  # 3 个输入，4 个隐藏神经元
b1 = np.random.randn(4)

# 隐藏层1到隐藏层2的权重和偏置
W2 = np.random.randn(4, 4)  # 4 个输入，4 个隐藏神经元
b2 = np.random.randn(4)

# 隐藏层2到输出层的权重和偏置
W3 = np.random.randn(4, 1)  # 4 个输入，1 个输出
b3 = np.random.randn(1)

print(f"W1 形状: {W1.shape}")  # (3, 4)
print(f"W2 形状: {W2.shape}")  # (4, 4)
print(f"W3 形状: {W3.shape}")  # (4, 1)
```

---

## 4 前向传播

### 什么是前向传播？

前向传播是数据从输入层流向输出层的过程。每一层进行以下计算：

```
z = W·x + b    # 线性变换
a = f(z)       # 激活函数
```

### 前向传播的代码实现

```python
import numpy as np

# 定义激活函数
def sigmoid(z):
    """Sigmoid 激活函数"""
    return 1 / (1 + np.exp(-z))

def relu(z):
    """ReLU 激活函数"""
    return np.maximum(0, z)

# 前向传播函数
def forward_propagation(X, W1, b1, W2, b2, W3, b3):
    """
    X: 输入数据，形状为 (样本数, 特征数)
    W1, b1: 第一层权重和偏置
    W2, b2: 第二层权重和偏置
    W3, b3: 第三层权重和偏置
    """
    # 第一层
    Z1 = np.dot(X, W1) + b1  # 线性变换
    A1 = relu(Z1)             # 激活函数
    
    # 第二层
    Z2 = np.dot(A1, W2) + b2  # 线性变换
    A2 = relu(Z2)             # 激活函数
    
    # 第三层（输出层）
    Z3 = np.dot(A2, W3) + b3  # 线性变换
    A3 = sigmoid(Z3)          # 输出层使用 sigmoid
    
    return A3, (Z1, A1, Z2, A2, Z3, A3)

# 测试前向传播
X = np.array([[1, 2, 3]])  # 1 个样本，3 个特征
output, cache = forward_propagation(X, W1, b1, W2, b2, W3, b3)
print(f"输入: {X}")
print(f"输出: {output}")
```

### 前向传播的缓存

在前向传播过程中，我们需要保存中间结果，以便后续的反向传播使用：

```python
# 缓存中间结果
cache = {
    'Z1': Z1, 'A1': A1,  # 第一层的线性输出和激活输出
    'Z2': Z2, 'A2': A2,  # 第二层的线性输出和激活输出
    'Z3': Z3, 'A3': A3,  # 第三层的线性输出和激活输出
}
```

---

## 5 用 PyTorch 实现神经网络

### PyTorch 的 nn.Module

PyTorch 提供了 `nn.Module` 类，让我们可以方便地定义神经网络。

```python
import torch
import torch.nn as nn

# 定义神经网络
class SimpleNeuralNetwork(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(SimpleNeuralNetwork, self).__init__()
        # 第一层：输入层到隐藏层
        self.fc1 = nn.Linear(input_size, hidden_size)
        # 第二层：隐藏层到隐藏层
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        # 第三层：隐藏层到输出层
        self.fc3 = nn.Linear(hidden_size, output_size)
        
        # 激活函数
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        # 前向传播
        x = self.fc1(x)      # 第一层线性变换
        x = self.relu(x)     # ReLU 激活
        x = self.fc2(x)      # 第二层线性变换
        x = self.relu(x)     # ReLU 激活
        x = self.fc3(x)      # 第三层线性变换
        x = self.sigmoid(x)  # Sigmoid 激活（输出层）
        return x

# 创建模型
model = SimpleNeuralNetwork(input_size=3, hidden_size=4, output_size=1)

# 查看模型结构
print(model)

# 查看模型参数
for name, param in model.named_parameters():
    print(f"{name}: {param.shape}")
```

### 前向传播测试

```python
# 测试前向传播
X = torch.tensor([[1.0, 2.0, 3.0]])  # 1 个样本，3 个特征
output = model(X)
print(f"输入: {X}")
print(f"输出: {output}")
print(f"输出形状: {output.shape}")
```

---

## 6 神经网络的表达能力

### 万能近似定理

神经网络具有强大的表达能力。**万能近似定理**指出：

> 只要神经网络有足够多的隐藏神经元，它就可以以任意精度逼近任意连续函数。

打个比方：

> 神经网络就像用乐高积木搭建任意形状。只要积木足够多，你可以搭建出任何形状。

### 深度 vs 宽度

- **深度**（更多层）：每层学习更抽象的特征
- **宽度**（更多神经元）：每层可以学习更多特征

实践中，增加深度通常比增加宽度更有效。

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 感知机 | 最简单的神经网络，只能解决线性可分问题 |
| 多层神经网络 | 通过多层非线性变换，可以学习任意复杂模式 |
| 前向传播 | 数据从输入层流向输出层的过程 |
| 参数 | 权重 w 和偏置 b，通过训练学习得到 |
| PyTorch 实现 | 继承 nn.Module，实现 forward 方法 |

---

## 8 新手常见误区

### 误区 1："神经网络层数越多越好"

不是的。层数过多会导致：
- 梯度消失/爆炸问题
- 过拟合
- 训练时间增加

通常 2-5 层隐藏层就足够处理大多数问题。

### 误区 2："神经元越多越好"

神经元过多会导致：
- 参数过多，容易过拟合
- 计算资源消耗大
- 训练时间增加

应该根据问题复杂度选择合适的网络结构。

### 误区 3："神经网络可以解决所有问题"

神经网络需要：
- 大量数据
- 足够的计算资源
- 合适的问题定义

对于小数据问题，传统机器学习方法可能更合适。

---

## 9 动手练习

### 练习 1：基础练习

修改上面的 SimpleNeuralNetwork，增加一个隐藏层，变成 4 层神经网络。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class DeepNeuralNetwork(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(DeepNeuralNetwork, self).__init__()
        # 第一层
        self.fc1 = nn.Linear(input_size, hidden_size)
        # 第二层
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        # 第三层（新增）
        self.fc3 = nn.Linear(hidden_size, hidden_size)
        # 第四层
        self.fc4 = nn.Linear(hidden_size, output_size)
        
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.relu(self.fc3(x))  # 新增层
        x = self.sigmoid(self.fc4(x))
        return x

# 创建模型
model = DeepNeuralNetwork(input_size=3, hidden_size=4, output_size=1)
print(model)

# 测试
X = torch.tensor([[1.0, 2.0, 3.0]])
output = model(X)
print(f"输出: {output}")
```

</details>

### 练习 2：进阶练习

用 NumPy 手动实现一个两层神经网络的前向传播，不使用 PyTorch。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 两层神经网络的前向传播
class TwoLayerNet:
    def __init__(self, input_size, hidden_size, output_size):
        # 初始化权重和偏置
        self.W1 = np.random.randn(input_size, hidden_size) * 0.01
        self.b1 = np.zeros(hidden_size)
        self.W2 = np.random.randn(hidden_size, output_size) * 0.01
        self.b2 = np.zeros(output_size)
    
    def relu(self, z):
        return np.maximum(0, z)
    
    def sigmoid(self, z):
        return 1 / (1 + np.exp(-z))
    
    def forward(self, X):
        # 第一层
        self.Z1 = np.dot(X, self.W1) + self.b1
        self.A1 = self.relu(self.Z1)
        
        # 第二层
        self.Z2 = np.dot(self.A1, self.W2) + self.b2
        self.A2 = self.sigmoid(self.Z2)
        
        return self.A2

# 测试
net = TwoLayerNet(input_size=3, hidden_size=4, output_size=1)
X = np.array([[1.0, 2.0, 3.0]])
output = net.forward(X)
print(f"输入: {X}")
print(f"输出: {output}")
```

</details>

### 练习 3（挑战）：综合练习

创建一个神经网络，用于 MNIST 手写数字识别（输入 28x28=784 维，输出 10 类）。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class MNISTClassifier(nn.Module):
    def __init__(self):
        super(MNISTClassifier, self).__init__()
        # 输入层：784 维（28x28 图像展平）
        # 隐藏层1：256 个神经元
        self.fc1 = nn.Linear(784, 256)
        # 隐藏层2：128 个神经元
        self.fc2 = nn.Linear(256, 128)
        # 隐藏层3：64 个神经元
        self.fc3 = nn.Linear(128, 64)
        # 输出层：10 类
        self.fc4 = nn.Linear(64, 10)
        
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)  # 防止过拟合
    
    def forward(self, x):
        # 将图像展平为一维
        x = x.view(-1, 784)
        # 第一层
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        # 第二层
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        # 第三层
        x = self.relu(self.fc3(x))
        x = self.dropout(x)
        # 输出层（不加 softmax，因为 CrossEntropyLoss 会自动处理）
        x = self.fc4(x)
        return x

# 创建模型
model = MNISTClassifier()
print(model)

# 测试
X = torch.randn(32, 1, 28, 28)  # 批量大小 32，1 通道，28x28
output = model(X)
print(f"输入形状: {X.shape}")
print(f"输出形状: {output.shape}")  # 应该是 (32, 10)
```

</details>

---

## 下一章预告

下一章我们会学习神经网络中至关重要的组件——激活函数和损失函数。你会了解到为什么需要激活函数，以及不同的损失函数适用于什么场景。
