---
title: "第12章：卷积神经网络"
description: "CNN 原理、卷积层、池化层、图像分类实战"
---

# 第12章：卷积神经网络

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是卷积神经网络（CNN）？
- 为什么 CNN 适合处理图像？
- 卷积层和池化层是怎么工作的？
- 如何用 CNN 做图像分类？

这一章就是为了解答这些问题。CNN 是深度学习在计算机视觉领域的核心架构，掌握它是进入 AI 视觉应用的必经之路。

---

## 1 为什么需要 CNN？

### 痛点分析

用全连接网络处理图像的问题：

```python
# ❌ 全连接网络：参数太多
# 假设输入 224x224x3 的图像
input_size = 224 * 224 * 3  # 150,528 个输入
hidden_size = 1000

# 参数量
params = input_size * hidden_size  # 1.5 亿参数！
# 计算量大，容易过拟合
```

```python
# ✅ CNN：参数共享，局部连接
# 用 3x3 的卷积核
kernel_size = 3 * 3 * 3  # 27 个参数
# 无论图像多大，参数都是 27 个！
```

> **一句话总结**：CNN 通过参数共享和局部连接，大幅减少参数量。

### 生活化类比

打个比方：

> 全连接网络就像让一个人看完整个地图再找路。
> CNN 就像拿着放大镜，一小块一小块地看，效率更高。

---

## 2 核心原理：卷积操作

### 概念解释

卷积就是用一个小窗口（卷积核）在图像上滑动，提取局部特征：

```
输入图像 (5x5)          卷积核 (3x3)          输出特征图 (3x3)
┌─────────────┐        ┌───────┐            ┌───────┐
│ 1  2  3  0  1│        │ 1  0  1│            │ 12 12 │
│ 0  1  2  3  0│   *    │ 0  1  0│    =       │ 10 14 │
│ 3  0  1  2  1│        │ 1  0  1│            │ 12 12 │
│ 2  1  0  1  0│        └───────┘            └───────┘
│ 1  0  3  2  1│
└─────────────┘

计算过程：
12 = 1*1 + 2*0 + 3*1 + 0*0 + 1*1 + 2*0 + 3*1 + 0*0 + 1*1
```

### 卷积参数

```python
# 关键参数
input_size = 32    # 输入尺寸
kernel_size = 3    # 卷积核大小
stride = 1         # 步长
padding = 1        # 填充

# 输出尺寸计算公式
output_size = (input_size - kernel_size + 2 * padding) // stride + 1
# output_size = (32 - 3 + 2) // 1 + 1 = 32
```

---

## 3 CNN 架构

### 典型结构

```
输入图像
  ↓
卷积层 + ReLU    # 提取特征
  ↓
池化层          # 降维
  ↓
卷积层 + ReLU    # 提取更高级特征
  ↓
池化层          # 降维
  ↓
...（重复多次）
  ↓
全连接层        # 分类
  ↓
输出
```

### 各层作用

| 层类型 | 作用 | 参数量 |
| --- | --- | --- |
| 卷积层 | 提取局部特征 | 较少（参数共享） |
| 激活层 | 引入非线性 | 0 |
| 池化层 | 降维，增强鲁棒性 | 0 |
| 全连接层 | 分类 | 较多 |

---

## 4 PyTorch 实现 CNN

### 定义 CNN 模型

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        # 卷积层：输入3通道，输出16通道，3x3卷积核
        self.conv1 = nn.Conv2d(3, 16, kernel_size=3, padding=1)
        # 池化层：2x2最大池化
        self.pool = nn.MaxPool2d(2, 2)
        # 第二个卷积层
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)
        # 第三个卷积层
        self.conv3 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        # 全连接层
        self.fc1 = nn.Linear(64 * 4 * 4, 128)
        self.fc2 = nn.Linear(128, 10)
        # Dropout
        self.dropout = nn.Dropout(0.5)
    
    def forward(self, x):
        # 第一层卷积 + 池化
        x = self.pool(F.relu(self.conv1(x)))  # 32x32 -> 16x16
        # 第二层卷积 + 池化
        x = self.pool(F.relu(self.conv2(x)))  # 16x16 -> 8x8
        # 第三层卷积 + 池化
        x = self.pool(F.relu(self.conv3(x)))  # 8x8 -> 4x4
        # 展平
        x = x.view(-1, 64 * 4 * 4)
        # 全连接层
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

# 创建模型
model = SimpleCNN()
print(model)

# 测试输入
x = torch.randn(1, 3, 32, 32)  # batch=1, channels=3, height=32, width=32
output = model(x)
print("输出形状:", output.shape)  # [1, 10]
```

### 训练 CNN

```python
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 数据预处理
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

# 加载 CIFAR-10 数据集
trainset = datasets.CIFAR10(root='./data', train=True, download=True, transform=transform)
trainloader = DataLoader(trainset, batch_size=32, shuffle=True)

testset = datasets.CIFAR10(root='./data', train=False, download=True, transform=transform)
testloader = DataLoader(testset, batch_size=32, shuffle=False)

# 定义模型、损失函数、优化器
model = SimpleCNN()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 训练
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

for epoch in range(10):
    model.train()
    running_loss = 0.0
    
    for inputs, labels in trainloader:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
    
    print(f"Epoch {epoch+1}, Loss: {running_loss/len(trainloader):.4f}")

# 测试
model.eval()
correct = 0
total = 0

with torch.no_grad():
    for inputs, labels in testloader:
        inputs, labels = inputs.to(device), labels.to(device)
        outputs = model(inputs)
        _, predicted = torch.max(outputs, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

print(f"测试准确率: {100 * correct / total:.2f}%")
```

---

## 5 经典 CNN 架构

### LeNet-5（1998）

```
输入 (32x32)
  ↓
Conv (6@28x28) + Pool (6@14x14)
  ↓
Conv (16@10x10) + Pool (16@5x5)
  ↓
FC (120) → FC (84) → Output (10)
```

### AlexNet（2012）

```
输入 (224x224x3)
  ↓
Conv (96@55x55) + Pool (96@27x27)
  ↓
Conv (256@27x27) + Pool (256@13x13)
  ↓
Conv (384@13x13)
  ↓
Conv (384@13x13)
  ↓
Conv (256@13x13) + Pool (256@6x6)
  ↓
FC (4096) → FC (4096) → Output (1000)

创新点：ReLU、Dropout、数据增强
```

### VGGNet（2014）

```
使用多个 3x3 卷积核代替大卷积核
优势：参数更少，特征提取更好

VGG-16 结构：
13 个卷积层 + 3 个全连接层
总参数量：1.38 亿
```

### ResNet（2015）

```
引入残差连接（Skip Connection）

普通网络：
x → Conv → ReLU → Conv → ReLU → output

ResNet：
x → Conv → ReLU → Conv → (+x) → ReLU → output
 ↑__________________________|

解决深层网络的梯度消失问题
可以训练 152 层的网络
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 卷积层 | 提取局部特征，参数共享 |
| 池化层 | 降维，增强鲁棒性 |
| 全连接层 | 分类 |
| 参数计算 | 卷积核大小 × 输入通道 × 输出通道 |
| 经典架构 | LeNet、AlexNet、VGG、ResNet |

---

## 7 新手常见误区

### 误区 1："卷积核越大越好"

**错！** 大卷积核参数多，容易过拟合：

```python
# ❌ 错误：用 7x7 卷积核
conv = nn.Conv2d(3, 64, kernel_size=7)

# ✅ 正确：用多个 3x3 卷积核
conv1 = nn.Conv2d(3, 64, kernel_size=3, padding=1)
conv2 = nn.Conv2d(64, 64, kernel_size=3, padding=1)
# 两个 3x3 的感受野等于一个 5x5
```

### 误区 2："池化层必须用最大池化"

不是的。根据任务选择：

```python
# 最大池化：保留最显著特征（常用）
max_pool = nn.MaxPool2d(2, 2)

# 平均池化：保留整体信息
avg_pool = nn.AvgPool2d(2, 2)

# 全局平均池化：替代全连接层
global_avg_pool = nn.AdaptiveAvgPool2d(1)
```

### 误区 3："CNN 只能处理图像"

CNN 也可以处理其他网格数据：

```python
# 1D CNN：处理文本、时间序列
conv1d = nn.Conv1d(in_channels, out_channels, kernel_size)

# 2D CNN：处理图像
conv2d = nn.Conv2d(in_channels, out_channels, kernel_size)

# 3D CNN：处理视频、医学图像
conv3d = nn.Conv3d(in_channels, out_channels, kernel_size)
```

---

## 8 动手练习

### 练习 1：基础练习

计算卷积层的输出尺寸：输入 64x64，卷积核 5x5，步长 2，填充 1。

<details>
<summary>点击查看答案</summary>

```python
# 输出尺寸公式
input_size = 64
kernel_size = 5
stride = 2
padding = 1

output_size = (input_size - kernel_size + 2 * padding) // stride + 1
print(f"输出尺寸: {output_size}x{output_size}")
# 输出: 31x31
```

</details>

### 练习 2：进阶练习

用 PyTorch 实现一个简单的 CNN，对 MNIST 手写数字分类。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 定义 CNN
class MNIST_CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, 3)  # 28x28 -> 26x26
        self.conv2 = nn.Conv2d(32, 64, 3) # 26x26 -> 24x24
        self.pool = nn.MaxPool2d(2, 2)    # 24x24 -> 12x12
        self.fc1 = nn.Linear(64 * 12 * 12, 128)
        self.fc2 = nn.Linear(128, 10)
    
    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = x.view(-1, 64 * 12 * 12)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# 数据加载
transform = transforms.Compose([transforms.ToTensor()])
trainset = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
trainloader = DataLoader(trainset, batch_size=64, shuffle=True)

# 训练
model = MNIST_CNN()
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

for epoch in range(3):
    for inputs, labels in trainloader:
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
    print(f"Epoch {epoch+1} 完成")

print("训练完成！")
```

</details>

### 练习 3（挑战）：综合练习

实现一个 VGG 风格的 CNN，用于 CIFAR-10 分类。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class VGGStyleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        # 特征提取部分
        self.features = nn.Sequential(
            # Block 1
            nn.Conv2d(3, 64, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            
            # Block 2
            nn.Conv2d(64, 128, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            
            # Block 3
            nn.Conv2d(128, 256, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
        )
        
        # 分类部分
        self.classifier = nn.Sequential(
            nn.Linear(256 * 4 * 4, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes),
        )
    
    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x

# 测试
model = VGGStyleCNN(num_classes=10)
x = torch.randn(1, 3, 32, 32)
output = model(x)
print(f"输入形状: {x.shape}")
print(f"输出形状: {output.shape}")
print(f"参数量: {sum(p.numel() for p in model.parameters()):,}")
```

</details>

---

## 下一章预告

下一章我们会学习 **循环神经网络（RNN）**——处理序列数据的利器，了解 LSTM、GRU 的工作原理，掌握时间序列预测和文本处理。
