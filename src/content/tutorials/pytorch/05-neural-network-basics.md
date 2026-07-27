---
title: "第5章：神经网络基础"
description: "掌握 nn.Module、层结构、前向传播、模型构建流程"
---

# 第5章：神经网络基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- PyTorch 如何定义神经网络？
- nn.Module 是什么？为什么要继承它？
- 如何定义前向传播？
- 模型构建的完整流程是什么？

这一章就是为了解答这些问题。掌握神经网络构建是深度学习的核心技能。

---

## 1 为什么需要 nn.Module？

### 痛点分析

想象一下你要盖房子：

**没有框架时**：你需要自己设计每个房间的功能，手动连接水电管道。

**有框架后**：就像有了标准化的房间模块，直接拼装就行。

### 传统方式的痛点

```python
import torch
import torch.nn.functional as F

# 手动定义权重和偏置
W1 = torch.randn(784, 256)  # 第一层权重
b1 = torch.zeros(256)  # 第一层偏置
W2 = torch.randn(256, 10)  # 第二层权重
b2 = torch.zeros(10)  # 第二层偏置

# 手动实现前向传播
def forward(x):
    x = x.view(-1, 784)  # 展平
    x = torch.matmul(x, W1) + b1  # 线性变换
    x = F.relu(x)  # 激活函数
    x = torch.matmul(x, W2) + b2  # 线性变换
    return x

# 问题：参数管理混乱，难以复用
```

### PyTorch 的解决方案

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()  # 调用父类初始化
        # 定义层（自动管理参数）
        self.fc1 = nn.Linear(784, 256)  # 第一层
        self.fc2 = nn.Linear(256, 10)  # 第二层

    def forward(self, x):
        # 前向传播
        x = x.view(-1, 784)  # 展平
        x = self.fc1(x)  # 第一层
        x = torch.relu(x)  # 激活
        x = self.fc2(x)  # 第二层
        return x

# 创建模型
model = SimpleNet()
print(model)
```

> **一句话总结**：nn.Module 让你像搭积木一样构建神经网络。

---

## 2 核心原理

### nn.Module 的作用

打个比方：

> nn.Module 就像一个容器，帮你管理所有参数（权重和偏置），并提供统一的接口。

### 神经网络构建流程

```
定义类（继承 nn.Module）
    ↓
__init__：定义层
    ↓
forward：定义前向传播
    ↓
实例化模型
    ↓
训练/推理
```

---

## 3 第一个神经网络

### 简单全连接网络

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleNN(nn.Module):
    def __init__(self):
        super().__init__()  # 必须调用
        # 定义层
        self.fc1 = nn.Linear(784, 256)  # 输入层到隐藏层
        self.fc2 = nn.Linear(256, 128)  # 隐藏层到隐藏层
        self.fc3 = nn.Linear(128, 10)  # 隐藏层到输出层

    def forward(self, x):
        # 前向传播
        x = x.view(-1, 784)  # 展平输入
        x = F.relu(self.fc1(x))  # 第一层 + ReLU
        x = F.relu(self.fc2(x))  # 第二层 + ReLU
        x = self.fc3(x)  # 输出层（不加激活）
        return x

# 创建模型
model = SimpleNN()

# 查看模型结构
print(model)

# 查看参数数量
total_params = sum(p.numel() for p in model.parameters())
print(f"总参数数量: {total_params}")
```

### 模型参数查看

```python
import torch
import torch.nn as nn

class SimpleNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNN()

# 查看所有参数
for name, param in model.named_parameters():
    print(f"{name}: {param.shape}")

# 输出：
# fc1.weight: torch.Size([256, 784])
# fc1.bias: torch.Size([256])
# fc2.weight: torch.Size([10, 256])
# fc2.bias: torch.Size([10])
```

---

## 4 常用神经网络层

### 全连接层（Linear）

```python
import torch
import torch.nn as nn

# 全连接层：y = xW^T + b
fc = nn.Linear(in_features=10, out_features=5)

# 输入
x = torch.randn(32, 10)  # 批次大小 32，特征数 10

# 前向传播
output = fc(x)
print(f"输出形状: {output.shape}")  # [32, 5]
```

### 卷积层（Conv2d）

```python
import torch
import torch.nn as nn

# 2D 卷积层
conv = nn.Conv2d(
    in_channels=3,  # 输入通道数（RGB）
    out_channels=16,  # 输出通道数
    kernel_size=3,  # 卷积核大小
    stride=1,  # 步长
    padding=1  # 填充
)

# 输入：批次 32，通道 3，高 32，宽 32
x = torch.randn(32, 3, 32, 32)

# 前向传播
output = conv(x)
print(f"输出形状: {output.shape}")  # [32, 16, 32, 32]
```

### 池化层（MaxPool2d）

```python
import torch
import torch.nn as nn

# 最大池化层
pool = nn.MaxPool2d(kernel_size=2, stride=2)

# 输入
x = torch.randn(32, 16, 32, 32)

# 前向传播
output = pool(x)
print(f"输出形状: {output.shape}")  # [32, 16, 16, 16]
```

### 批归一化层（BatchNorm2d）

```python
import torch
import torch.nn as nn

# 批归一化层
bn = nn.BatchNorm2d(num_features=16)

# 输入
x = torch.randn(32, 16, 32, 32)

# 前向传播
output = bn(x)
print(f"输出形状: {output.shape}")  # [32, 16, 32, 32]
```

### Dropout 层

```python
import torch
import torch.nn as nn

# Dropout 层
dropout = nn.Dropout(p=0.5)  # 丢弃概率 50%

# 输入
x = torch.randn(32, 128)

# 训练模式
model.train()
output_train = dropout(x)
print(f"训练模式输出: {output_train.shape}")

# 推理模式
model.eval()
output_eval = dropout(x)
print(f"推理模式输出: {output_eval.shape}")
```

---

## 5 激活函数

### 常用激活函数

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

x = torch.tensor([-2.0, -1.0, 0.0, 1.0, 2.0])

# ReLU
relu_out = F.relu(x)
print(f"ReLU: {relu_out}")  # [0, 0, 0, 1, 2]

# Sigmoid
sigmoid_out = torch.sigmoid(x)
print(f"Sigmoid: {sigmoid_out}")  # [0.12, 0.27, 0.5, 0.73, 0.88]

# Tanh
tanh_out = torch.tanh(x)
print(f"Tanh: {tanh_out}")  # [-0.96, -0.76, 0, 0.76, 0.96]

# Leaky ReLU
leaky_relu_out = F.leaky_relu(x, negative_slope=0.01)
print(f"Leaky ReLU: {leaky_relu_out}")  # [-0.02, -0.01, 0, 1, 2]
```

---

## 6 完整模型示例

### CNN 模型

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class CNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()

        # 卷积层部分
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)  # 28x28 -> 28x28
        self.bn1 = nn.BatchNorm2d(32)  # 批归一化
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)  # 28x28 -> 14x14
        self.bn2 = nn.BatchNorm2d(64)

        # 池化层
        self.pool = nn.MaxPool2d(2, 2)  # 2x2 池化

        # 全连接层部分
        self.fc1 = nn.Linear(64 * 7 * 7, 512)  # 展平后连接
        self.dropout = nn.Dropout(0.5)  # Dropout
        self.fc2 = nn.Linear(512, num_classes)  # 输出层

    def forward(self, x):
        # 卷积块 1
        x = self.conv1(x)  # 卷积
        x = self.bn1(x)  # 批归一化
        x = F.relu(x)  # 激活
        x = self.pool(x)  # 池化

        # 卷积块 2
        x = self.conv2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.pool(x)

        # 展平
        x = x.view(-1, 64 * 7 * 7)

        # 全连接层
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)

        return x

# 创建模型
model = CNN(num_classes=10)

# 测试输入
x = torch.randn(32, 1, 28, 28)  # 批次 32，单通道，28x28

# 前向传播
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 10]
```

---

## 7 模型保存与加载

### 保存模型

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNet()

# 方式1：保存整个模型（不推荐）
torch.save(model, 'model.pth')

# 方式2：只保存参数（推荐）
torch.save(model.state_dict(), 'model_params.pth')
```

### 加载模型

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# 方式1：加载整个模型
model = torch.load('model.pth')

# 方式2：加载参数（推荐）
model = SimpleNet()
model.load_state_dict(torch.load('model_params.pth'))
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| nn.Module | 神经网络基类，管理参数和层 |
| __init__ | 定义网络层 |
| forward | 定义前向传播 |
| 常用层 | Linear/Conv2d/MaxPool2d/BatchNorm/Dropout |
| 激活函数 | ReLU/Sigmoid/Tanh/LeakyReLU |
| 模型保存 | state_dict() 保存参数 |

---

## 9 新手常见误区

### 误区 1："忘记调用 super().__init__()"

**错！** 不调用父类初始化会导致参数无法注册。

正确做法：在 `__init__` 第一行调用 `super().__init__()`。

### 误区 2："在 forward 中定义层"

不是的。层应该在 `__init__` 中定义，forward 只负责前向传播。

正确做法：`__init__` 定义层，`forward` 使用层。

### 误区 3："混淆训练模式和推理模式"

Dropout 和 BatchNorm 在训练和推理时行为不同。

正确做法：训练时调用 `model.train()`，推理时调用 `model.eval()`。

---

## 10 动手练习

### 练习 1：基础练习

创建一个简单的全连接网络，输入维度为 100，输出维度为 10，包含一个隐藏层（维度 50）。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleFC(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(100, 50)  # 输入层到隐藏层
        self.fc2 = nn.Linear(50, 10)  # 隐藏层到输出层

    def forward(self, x):
        x = F.relu(self.fc1(x))  # 隐藏层 + ReLU
        x = self.fc2(x)  # 输出层
        return x

# 创建模型
model = SimpleFC()

# 测试输入
x = torch.randn(32, 100)  # 批次 32，特征 100

# 前向传播
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 10]

# 查看参数
total_params = sum(p.numel() for p in model.parameters())
print(f"总参数数量: {total_params}")
```

</details>

### 练习 2：进阶练习

创建一个简单的 CNN，用于处理 32x32 的 RGB 图像，输出 10 个类别。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        # 卷积层
        self.conv1 = nn.Conv2d(3, 16, kernel_size=3, padding=1)  # 32x32 -> 32x32
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)  # 32x32 -> 16x16
        self.pool = nn.MaxPool2d(2, 2)  # 池化

        # 全连接层
        self.fc1 = nn.Linear(32 * 8 * 8, 128)  # 展平后连接
        self.fc2 = nn.Linear(128, 10)  # 输出层

    def forward(self, x):
        # 卷积块
        x = self.pool(F.relu(self.conv1(x)))  # 32x32 -> 16x16
        x = self.pool(F.relu(self.conv2(x)))  # 16x16 -> 8x8

        # 展平
        x = x.view(-1, 32 * 8 * 8)

        # 全连接层
        x = F.relu(self.fc1(x))
        x = self.fc2(x)

        return x

# 创建模型
model = SimpleCNN()

# 测试输入
x = torch.randn(32, 3, 32, 32)  # 批次 32，RGB，32x32

# 前向传播
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 10]
```

</details>

### 练习 3（挑战）：综合练习

创建一个带有 BatchNorm 和 Dropout 的 CNN，并实现模型保存和加载功能。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class AdvancedCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()

        # 卷积层 + BatchNorm
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)

        # 池化层
        self.pool = nn.MaxPool2d(2, 2)

        # 全连接层 + Dropout
        self.fc1 = nn.Linear(64 * 8 * 8, 256)
        self.dropout = nn.Dropout(0.5)
        self.fc2 = nn.Linear(256, num_classes)

    def forward(self, x):
        # 卷积块 1
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        # 卷积块 2
        x = self.pool(F.relu(self.bn2(self.conv2(x))))

        # 展平
        x = x.view(-1, 64 * 8 * 8)

        # 全连接层
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)

        return x

# 创建模型
model = AdvancedCNN(num_classes=10)

# 训练模式
model.train()
x = torch.randn(32, 3, 32, 32)
output = model(x)
print(f"训练模式输出: {output.shape}")

# 保存模型
torch.save(model.state_dict(), 'advanced_cnn.pth')

# 加载模型
model2 = AdvancedCNN(num_classes=10)
model2.load_state_dict(torch.load('advanced_cnn.pth'))

# 推理模式
model2.eval()
with torch.no_grad():
    output2 = model2(x)
    print(f"推理模式输出: {output2.shape}")
```

</details>

---

## 下一章预告

下一章我们会学习 **损失函数与优化器**——训练神经网络的核心组件。你会学到各种损失函数的使用方法，以及 SGD、Adam 等优化器的原理和应用。