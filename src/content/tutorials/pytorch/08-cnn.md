---
title: "第8章：卷积神经网络（CNN）"
description: "掌握卷积层、池化层、CNN 架构，实现图像分类实战"
---

# 第8章：卷积神经网络（CNN）

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是卷积神经网络？为什么图像处理要用 CNN？
- 卷积层是如何工作的？卷积核是什么？
- 池化层有什么作用？为什么要做池化？
- 如何构建一个完整的 CNN 进行图像分类？

这一章就是为了解答这些问题。CNN 是计算机视觉的核心技术，掌握它是做图像相关任务的基础。

---

## 1 为什么需要 CNN？

### 痛点分析

想象一下你要识别图片中的猫：

**用全连接网络**：把图片展平成一维向量，丢失空间信息，参数太多，容易过拟合。

**用 CNN**：保留空间结构，参数共享，自动提取特征。

### 全连接 vs CNN

```python
# 全连接网络处理 224x224x3 的图片
# 输入维度：224 * 224 * 3 = 150,528
# 第一层 256 个神经元：150,528 * 256 = 38,535,168 个参数

# CNN 处理同样大小的图片
# 卷积层 3x3 卷积核，3 输入通道，64 输出通道
# 参数数量：3 * 3 * 3 * 64 = 1,728 个参数
```

> **一句话总结**：CNN 用更少的参数，更好地处理图像数据。

---

## 2 核心原理

### 卷积操作

打个比方：

> 卷积就像用手电筒照图片，手电筒（卷积核）在图片上滑动，每次照亮一小块区域，提取局部特征。

### CNN 架构

```
输入图像
    ↓
卷积层 → 激活函数 → 池化层（特征提取）
    ↓
卷积层 → 激活函数 → 池化层（特征提取）
    ↓
展平
    ↓
全连接层 → 分类输出
```

---

## 3 卷积层详解

### 基本卷积

```python
import torch
import torch.nn as nn

# 2D 卷积层
conv = nn.Conv2d(
    in_channels=3,  # 输入通道数（RGB）
    out_channels=64,  # 输出通道数（卷积核数量）
    kernel_size=3,  # 卷积核大小
    stride=1,  # 步长
    padding=1  # 填充
)

# 输入：批次 32，通道 3，高 224，宽 224
x = torch.randn(32, 3, 224, 224)

# 前向传播
output = conv(x)
print(f"输出形状: {output.shape}")  # [32, 64, 224, 224]

# 查看卷积核参数
print(f"卷积核形状: {conv.weight.shape}")  # [64, 3, 3, 3]
print(f"偏置形状: {conv.bias.shape}")  # [64]
```

### 卷积计算公式

```
输出尺寸 = (输入尺寸 - 卷积核大小 + 2 * 填充) / 步长 + 1

示例：
输入：224x224
卷积核：3x3
填充：1
步长：1
输出：(224 - 3 + 2*1) / 1 + 1 = 224
```

### 不同卷积配置

```python
import torch.nn as nn

# 配置1：保持尺寸
conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1)
# 输出：224x224 -> 224x224

# 配置2：减半尺寸
conv2 = nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1)
# 输出：224x224 -> 112x112

# 配置3：使用 1x1 卷积（降维）
conv3 = nn.Conv2d(128, 64, kernel_size=1)
# 输出：通道数 128 -> 64，尺寸不变
```

---

## 4 池化层详解

### 最大池化

```python
import torch
import torch.nn as nn

# 最大池化层
pool = nn.MaxPool2d(
    kernel_size=2,  # 池化窗口大小
    stride=2,  # 步长（默认等于 kernel_size）
    padding=0  # 填充
)

# 输入
x = torch.randn(32, 64, 224, 224)

# 前向传播
output = pool(x)
print(f"输出形状: {output.shape}")  # [32, 64, 112, 112]
```

### 平均池化

```python
import torch.nn as nn

# 平均池化层
avg_pool = nn.AvgPool2d(kernel_size=2, stride=2)

# 输入
x = torch.randn(32, 64, 224, 224)

# 前向传播
output = avg_pool(x)
print(f"输出形状: {output.shape}")  # [32, 64, 112, 112]
```

### 自适应池化

```python
import torch.nn as nn

# 自适应平均池化（输出固定大小）
adaptive_pool = nn.AdaptiveAvgPool2d((1, 1))

# 输入
x = torch.randn(32, 512, 7, 7)

# 前向传播
output = adaptive_pool(x)
print(f"输出形状: {output.shape}")  # [32, 512, 1, 1]
```

---

## 5 完整 CNN 架构

### LeNet-5

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class LeNet5(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()

        # 卷积层部分
        self.conv1 = nn.Conv2d(1, 6, kernel_size=5)  # 28x28 -> 24x24
        self.conv2 = nn.Conv2d(6, 16, kernel_size=5)  # 12x12 -> 8x8

        # 池化层
        self.pool = nn.MaxPool2d(2, 2)

        # 全连接层部分
        self.fc1 = nn.Linear(16 * 4 * 4, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, num_classes)

    def forward(self, x):
        # 卷积块 1
        x = self.pool(F.relu(self.conv1(x)))  # 28x28 -> 14x14

        # 卷积块 2
        x = self.pool(F.relu(self.conv2(x)))  # 14x14 -> 5x5 -> 4x4（取整）

        # 展平
        x = x.view(-1, 16 * 4 * 4)

        # 全连接层
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)

        return x

# 创建模型
model = LeNet5(num_classes=10)

# 测试输入
x = torch.randn(32, 1, 28, 28)
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 10]
```

### VGG 风格 CNN

```python
import torch
import torch.nn as nn

class VGGStyleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()

        # 卷积块 1
        self.block1 = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)  # 32x32 -> 16x16
        )

        # 卷积块 2
        self.block2 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)  # 16x16 -> 8x8
        )

        # 卷积块 3
        self.block3 = nn.Sequential(
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)  # 8x8 -> 4x4
        )

        # 全连接层
        self.classifier = nn.Sequential(
            nn.Linear(256 * 4 * 4, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        x = self.block1(x)
        x = self.block2(x)
        x = self.block3(x)
        x = x.view(-1, 256 * 4 * 4)
        x = self.classifier(x)
        return x

# 创建模型
model = VGGStyleCNN(num_classes=10)

# 测试输入
x = torch.randn(32, 3, 32, 32)
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 10]
```

---

## 6 CNN 实战：MNIST 分类

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 1. 数据准备
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

train_dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
test_dataset = datasets.MNIST('./data', train=False, download=True, transform=transform)

train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

# 2. 定义 CNN 模型
class MNIST_CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.dropout = nn.Dropout(0.5)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.pool(torch.relu(self.bn1(self.conv1(x))))  # 28x28 -> 14x14
        x = self.pool(torch.relu(self.bn2(self.conv2(x))))  # 14x14 -> 7x7
        x = x.view(-1, 64 * 7 * 7)
        x = torch.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

# 3. 训练配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = MNIST_CNN().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 4. 训练循环
num_epochs = 10
for epoch in range(num_epochs):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    train_acc = 100. * correct / total
    print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {running_loss/len(train_loader):.4f}, Acc: {train_acc:.2f}%")

# 5. 测试
model.eval()
correct = 0
total = 0
with torch.no_grad():
    for images, labels in test_loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

print(f"测试准确率: {100. * correct / total:.2f}%")
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 卷积层 | 提取局部特征，参数共享 |
| 池化层 | 降维，增加平移不变性 |
| 步长 | 控制卷积核滑动间隔 |
| 填充 | 控制输出尺寸 |
| CNN 架构 | 卷积块 + 全连接分类器 |

---

## 8 新手常见误区

### 误区 1："卷积核越大越好"

**错！** 大卷积核参数多，容易过拟合。

正确做法：使用多个小卷积核（如 3x3）代替大卷积核。

### 误区 2："池化层会丢失重要信息"

不是的。池化层保留主要特征，丢弃细节，有助于防止过拟合。

正确做法：合理使用池化层控制网络复杂度。

### 误区 3："忘记展平操作"

实际上全连接层需要一维输入，必须展平。

正确做法：卷积层输出后使用 `view()` 或 `flatten()` 展平。

---

## 9 动手练习

### 练习 1：基础练习

创建一个简单的 CNN，包含 2 个卷积层和 1 个全连接层，用于处理 28x28 的灰度图像。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 16, kernel_size=3, padding=1)  # 28x28 -> 28x28
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)  # 28x28 -> 14x14
        self.pool = nn.MaxPool2d(2, 2)
        self.fc = nn.Linear(32 * 7 * 7, 10)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))  # 28x28 -> 14x14
        x = self.pool(F.relu(self.conv2(x)))  # 14x14 -> 7x7
        x = x.view(-1, 32 * 7 * 7)
        x = self.fc(x)
        return x

model = SimpleCNN()
x = torch.randn(32, 1, 28, 28)
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 10]
```

</details>

### 练习 2：进阶练习

创建一个带有 BatchNorm 和 Dropout 的 CNN，用于 CIFAR-10 分类。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class CIFAR10_CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.5)
        self.fc1 = nn.Linear(128 * 4 * 4, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = self.pool(F.relu(self.bn1(self.conv1(x))))  # 32x32 -> 16x16
        x = self.pool(F.relu(self.bn2(self.conv2(x))))  # 16x16 -> 8x8
        x = self.pool(F.relu(self.bn3(self.conv3(x))))  # 8x8 -> 4x4
        x = x.view(-1, 128 * 4 * 4)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

model = CIFAR10_CNN()
x = torch.randn(32, 3, 32, 32)
output = model(x)
print(f"输出形状: {output.shape}")  # [32, 10]
```

</details>

### 练习 3（挑战）：综合练习

实现一个完整的 CNN 训练流程，在 CIFAR-10 数据集上训练并达到 70% 以上的准确率。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 1. 数据准备
transform_train = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.RandomCrop(32, padding=4),
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
])

transform_test = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
])

train_dataset = datasets.CIFAR10('./data', train=True, download=True, transform=transform_train)
test_dataset = datasets.CIFAR10('./data', train=False, download=True, transform=transform_test)

train_loader = DataLoader(train_dataset, batch_size=128, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=128, shuffle=False)

# 2. 定义模型
class AdvancedCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),

            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Conv2d(128, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),

            nn.Conv2d(128, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.Conv2d(256, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )

        self.classifier = nn.Sequential(
            nn.Linear(256 * 4 * 4, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 10)
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(-1, 256 * 4 * 4)
        x = self.classifier(x)
        return x

# 3. 训练配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = AdvancedCNN().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=20, gamma=0.1)

# 4. 训练
num_epochs = 50
for epoch in range(num_epochs):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    scheduler.step()

    if (epoch + 1) % 10 == 0:
        train_acc = 100. * correct / total
        print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {running_loss/len(train_loader):.4f}, Acc: {train_acc:.2f}%")

# 5. 测试
model.eval()
correct = 0
total = 0
with torch.no_grad():
    for images, labels in test_loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

print(f"测试准确率: {100. * correct / total:.2f}%")
```

</details>

---

## 下一章预告

下一章我们会学习 **循环神经网络（RNN）**——处理序列数据的核心架构。你会学到 RNN、LSTM、GRU 的原理，以及如何处理文本、时间序列等序列数据。