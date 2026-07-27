---
title: "第6章：卷积神经网络（CNN）"
description: "深入理解卷积神经网络的原理与实现，掌握卷积层、池化层和经典 CNN 架构"
---

# 第6章：卷积神经网络（CNN）

## 本章导读

在学习 CNN 之前，你可能会有这些疑问：

- 为什么普通神经网络处理图像效果不好？
- 卷积层是如何工作的？它提取了什么特征？
- 池化层有什么作用？
- 有哪些经典的 CNN 架构？

这一章会带你深入理解 CNN 的核心原理，并通过代码实现一个完整的图像分类模型。

---

## 1 为什么需要 CNN？

### 普通神经网络的问题

用全连接网络处理图像：

```python
# 假设输入一张 224x224 的 RGB 图像
input_size = 224 * 224 * 3  # = 150,528

# 第一层有 1000 个神经元
params = 150528 * 1000  # = 150,528,000 参数
```

**问题**：
- 参数过多，容易过拟合
- 忽略了图像的空间结构
- 无法识别平移不变的图案

打个比方：

> 全连接网络看图像就像把拼图打散后再拼，丢失了位置信息。CNN 则像拿着放大镜在图像上滑动，保留空间关系。

### CNN 的核心思想

CNN 通过两个关键机制解决问题：

1. **局部连接**：每个神经元只连接输入的一小块区域
2. **权值共享**：同一个滤波器在整张图像上共享参数

---

## 2 卷积层

### 什么是卷积？

卷积操作使用一个小的"滤波器"（卷积核）在图像上滑动，计算局部区域的加权和。

```
输入图像 (5x5)         卷积核 (3x3)         输出特征图 (3x3)
┌─────────────────┐    ┌────────┐          ┌─────────┐
│ 1  2  3  0  1   │    │ 1 0 1  │          │ 12  12  │
│ 0  1  2  3  0   │    │ 0 1 0  │    →     │  9  16  │
│ 3  0  1  2  1   │    │ 1 0 1  │          │ 14  16  │
│ 2  1  0  1  2   │    └────────┘          └─────────┘
│ 1  0  3  2  1   │
└─────────────────┘
```

### 卷积的计算过程

```python
import torch
import torch.nn as nn

# 创建卷积层
# in_channels: 输入通道数（RGB 图像为 3）
# out_channels: 输出通道数（滤波器个数）
# kernel_size: 卷积核大小
conv = nn.Conv2d(in_channels=1, out_channels=1, kernel_size=3, bias=False)

# 手动设置卷积核权重
conv.weight.data = torch.tensor([[[[1, 0, 1],
                                    [0, 1, 0],
                                    [1, 0, 1]]]], dtype=torch.float32)

# 输入图像 (batch=1, channels=1, height=5, width=5)
input_img = torch.tensor([[[[1, 2, 3, 0, 1],
                             [0, 1, 2, 3, 0],
                             [3, 0, 1, 2, 1],
                             [2, 1, 0, 1, 2],
                             [1, 0, 3, 2, 1]]]], dtype=torch.float32)

# 卷积操作
output = conv(input_img)
print(f"输入形状: {input_img.shape}")   # (1, 1, 5, 5)
print(f"输出形状: {output.shape}")      # (1, 1, 3, 3)
print(f"输出:\n{output}")
```

### 卷积的关键参数

```python
# 完整卷积层参数
conv = nn.Conv2d(
    in_channels=3,      # 输入通道数
    out_channels=16,    # 输出通道数（滤波器个数）
    kernel_size=3,      # 卷积核大小
    stride=1,           # 步幅（滑动间隔）
    padding=1,          # 填充（边缘补零）
    bias=True           # 是否使用偏置
)

# 输出尺寸计算公式
# output_size = (input_size - kernel_size + 2 * padding) / stride + 1

# 示例：输入 32x32，卷积核 3x3，padding=1，stride=1
# output = (32 - 3 + 2*1) / 1 + 1 = 32
```

### 步幅（Stride）

```python
# stride=1：每次移动 1 个像素
conv_s1 = nn.Conv2d(1, 1, 3, stride=1, padding=0)

# stride=2：每次移动 2 个像素，输出尺寸减半
conv_s2 = nn.Conv2d(1, 1, 3, stride=2, padding=0)

x = torch.randn(1, 1, 8, 8)
out_s1 = conv_s1(x)
out_s2 = conv_s2(x)
print(f"stride=1 输出: {out_s1.shape}")  # (1, 1, 6, 6)
print(f"stride=2 输出: {out_s2.shape}")  # (1, 1, 3, 3)
```

### 填充（Padding）

```python
# padding=0：不填充，输出尺寸缩小
conv_p0 = nn.Conv2d(1, 1, 3, stride=1, padding=0)

# padding=1：边缘补 1 圈 0，保持尺寸
conv_p1 = nn.Conv2d(1, 1, 3, stride=1, padding=1)

# "same" 填充：保持输入输出尺寸相同
# padding = (kernel_size - 1) / 2

x = torch.randn(1, 1, 8, 8)
out_p0 = conv_p0(x)
out_p1 = conv_p1(x)
print(f"padding=0 输出: {out_p0.shape}")  # (1, 1, 6, 6)
print(f"padding=1 输出: {out_p1.shape}")  # (1, 1, 8, 8)
```

---

## 3 池化层

### 什么是池化？

池化层对局部区域进行聚合操作，降低特征图尺寸，减少参数量。

### 最大池化（Max Pooling）

取局部区域的最大值：

```python
import torch.nn as nn

# 最大池化层
pool = nn.MaxPool2d(kernel_size=2, stride=2)

# 输入 (1, 1, 4, 4)
x = torch.tensor([[[[1, 3, 2, 4],
                     [5, 6, 1, 2],
                     [3, 2, 4, 7],
                     [8, 1, 2, 3]]]], dtype=torch.float32)

output = pool(x)
print(f"输入:\n{x[0, 0]}")
print(f"最大池化输出:\n{output[0, 0]}")
# 输出:
# [[6, 4],
#  [8, 7]]
```

### 平均池化（Average Pooling）

取局部区域的平均值：

```python
# 平均池化层
avg_pool = nn.AvgPool2d(kernel_size=2, stride=2)

output = avg_pool(x)
print(f"平均池化输出:\n{output[0, 0]}")
# 输出:
# [[4, 2],
#  [3, 4]]
```

### 全局平均池化

将整个特征图压缩为单个值：

```python
# 全局平均池化
global_avg_pool = nn.AdaptiveAvgPool2d(1)

x = torch.randn(1, 64, 8, 8)
output = global_avg_pool(x)
print(f"输入形状: {x.shape}")        # (1, 64, 8, 8)
print(f"输出形状: {output.shape}")   # (1, 64, 1, 1)
```

---

## 4 CNN 的完整结构

### 典型 CNN 架构

```
输入图像 (3, 32, 32)
    ↓
卷积层 (16, 32, 32) + ReLU
    ↓
池化层 (16, 16, 16)
    ↓
卷积层 (32, 16, 16) + ReLU
    ↓
池化层 (32, 8, 8)
    ↓
展平 (32 * 8 * 8 = 2048)
    ↓
全连接层 (256) + ReLU + Dropout
    ↓
全连接层 (10)
    ↓
输出 (10 类)
```

### PyTorch 实现

```python
import torch
import torch.nn as nn

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super(SimpleCNN, self).__init__()
        # 卷积层部分
        self.features = nn.Sequential(
            # 第一组卷积
            nn.Conv2d(3, 16, kernel_size=3, padding=1),  # (16, 32, 32)
            nn.BatchNorm2d(16),                           # 批归一化
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                           # (16, 16, 16)
            
            # 第二组卷积
            nn.Conv2d(16, 32, kernel_size=3, padding=1),  # (32, 16, 16)
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                           # (32, 8, 8)
            
            # 第三组卷积
            nn.Conv2d(32, 64, kernel_size=3, padding=1),  # (64, 8, 8)
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                           # (64, 4, 4)
        )
        
        # 分类部分
        self.classifier = nn.Sequential(
            nn.Flatten(),                    # 展平 (64*4*4 = 1024)
            nn.Linear(64 * 4 * 4, 256),     # 全连接层
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),                 # Dropout 防止过拟合
            nn.Linear(256, num_classes),     # 输出层
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

# 创建模型
model = SimpleCNN(num_classes=10)
print(model)

# 测试前向传播
x = torch.randn(4, 3, 32, 32)  # 4 张 32x32 的 RGB 图像
output = model(x)
print(f"输入形状: {x.shape}")      # (4, 3, 32, 32)
print(f"输出形状: {output.shape}")  # (4, 10)
```

---

## 5 经典 CNN 架构

### LeNet-5（1998）

最早成功的 CNN，用于手写数字识别：

```
输入 (1, 32, 32)
→ Conv(6, 5x5) → AvgPool → Conv(16, 5x5) → AvgPool
→ FC(120) → FC(84) → FC(10)
```

### AlexNet（2012）

ImageNet 竞赛冠军，深度学习爆发的起点：

```
输入 (3, 224, 224)
→ Conv(96, 11x11, stride=4) → MaxPool
→ Conv(256, 5x5) → MaxPool
→ Conv(384, 3x3) → Conv(384, 3x3) → Conv(256, 3x3) → MaxPool
→ FC(4096) → FC(4096) → FC(1000)
```

**创新点**：ReLU 激活、Dropout、数据增强、GPU 训练

### VGGNet（2014）

使用小卷积核（3x3）堆叠，网络更深：

```
VGG-16 结构：
13 个卷积层（3x3） + 5 个池化层 + 3 个全连接层
总参数约 1.38 亿
```

**核心思想**：2 个 3x3 卷积核的感受野 = 1 个 5x5，但参数更少

### ResNet（2015）

引入残差连接，解决深层网络梯度消失问题：

```python
# 残差块
class ResidualBlock(nn.Module):
    def __init__(self, channels):
        super(ResidualBlock, self).__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(channels)
        self.relu = nn.ReLU()
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(channels)
    
    def forward(self, x):
        residual = x  # 跳跃连接
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += residual  # 残差相加
        out = self.relu(out)
        return out
```

**核心思想**：让网络学习残差 F(x) = H(x) - x，而不是直接学习 H(x)

---

## 6 感受野

### 什么是感受野？

感受野是输出特征图上一个像素点对应输入图像的区域大小。

```python
# 感受野计算
# 第 1 层：kernel=3, stride=1 → 感受野 = 3
# 第 2 层：kernel=3, stride=1 → 感受野 = 3 + (3-1)*1 = 5
# 第 3 层：kernel=3, stride=1 → 感受野 = 5 + (3-1)*1 = 7

# 公式：RF_n = RF_{n-1} + (kernel_size - 1) * stride
```

打个比方：

> 感受野就像你通过窗户看外面。窗户越大（感受野越大），你看到的范围越广。多层卷积就像叠加多个窗户，让你看到更大的范围。

---

## 7 特征可视化

### 不同层提取不同特征

```
浅层 → 边缘、角点、纹理
中层 → 局部图案、形状部件
深层 → 完整物体、语义特征
```

### 特征图可视化代码

```python
import torch
import torch.nn as nn
import matplotlib.pyplot as plt

# 创建模型
model = SimpleCNN(num_classes=10)
model.eval()

# 获取中间层输出
def get_features(model, x, layer_name):
    features = {}
    def hook(module, input, output):
        features[layer_name] = output
    # 注册钩子
    for name, module in model.named_modules():
        if name == layer_name:
            module.register_forward_hook(hook)
    model(x)
    return features[layer_name]

# 测试图像
x = torch.randn(1, 3, 32, 32)

# 获取第一层卷积的输出
features = get_features(model, x, 'features.0')
print(f"第一层卷积输出形状: {features.shape}")  # (1, 16, 32, 32)

# 可视化前 8 个特征图
fig, axes = plt.subplots(2, 4, figsize=(12, 6))
for i, ax in enumerate(axes.flat):
    if i < features.shape[1]:
        ax.imshow(features[0, i].detach().numpy(), cmap='viridis')
        ax.set_title(f'Filter {i}')
        ax.axis('off')
plt.tight_layout()
plt.savefig('feature_maps.png')
print("特征图已保存到 feature_maps.png")
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 卷积层 | 使用滤波器提取局部特征，参数共享减少计算量 |
| 池化层 | 降低特征图尺寸，提供平移不变性 |
| 步幅 | 控制卷积核滑动间隔，影响输出尺寸 |
| 填充 | 边缘补零，控制输出尺寸 |
| 感受野 | 输出像素对应的输入区域大小 |
| 经典架构 | LeNet → AlexNet → VGG → ResNet |
| 残差连接 | 解决深层网络梯度消失问题 |

---

## 9 新手常见误区

### 误区 1："卷积核越大越好"

大卷积核参数多，容易过拟合。实践中多用 3x3 小卷积核堆叠，效果更好。

### 误区 2："网络越深越好"

网络过深会导致梯度消失/爆炸。使用残差连接、BatchNorm 等技术才能训练深层网络。

### 误区 3："池化层只能用 MaxPool"

MaxPool 适合提取纹理特征，AvgPool 适合保留背景信息。全局平均池化可以替代全连接层。

### 误区 4："CNN 只能处理图像"

CNN 可以处理任何具有空间/局部结构的数据，如音频（1D CNN）、视频（3D CNN）、图数据。

---

## 10 动手练习

### 练习 1：基础练习

计算以下卷积操作的输出尺寸：输入 (3, 64, 64)，卷积核 5x5，stride=2，padding=2。

<details>
<summary>点击查看答案</summary>

```python
# 输出尺寸公式：(input_size - kernel_size + 2*padding) / stride + 1
# = (64 - 5 + 2*2) / 2 + 1
# = (64 - 5 + 4) / 2 + 1
# = 63 / 2 + 1
# = 31.5 + 1 = 32.5 → 向下取整 = 32

import torch
import torch.nn as nn

conv = nn.Conv2d(3, 16, kernel_size=5, stride=2, padding=2)
x = torch.randn(1, 3, 64, 64)
output = conv(x)
print(f"输出形状: {output.shape}")  # (1, 16, 32, 32)
```

</details>

### 练习 2：进阶练习

实现一个 VGG 风格的 CNN，使用 3x3 卷积核堆叠，用于 CIFAR-10 分类。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class VGGStyleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super(VGGStyleCNN, self).__init__()
        self.features = nn.Sequential(
            # Block 1: 2 个 3x3 卷积 + 池化
            nn.Conv2d(3, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.MaxPool2d(2, 2),  # (64, 16, 16)
            
            # Block 2: 2 个 3x3 卷积 + 池化
            nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(),
            nn.Conv2d(128, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(),
            nn.MaxPool2d(2, 2),  # (128, 8, 8)
            
            # Block 3: 3 个 3x3 卷积 + 池化
            nn.Conv2d(128, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(),
            nn.Conv2d(256, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(),
            nn.Conv2d(256, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(),
            nn.MaxPool2d(2, 2),  # (256, 4, 4)
        )
        
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 4 * 4, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

model = VGGStyleCNN()
x = torch.randn(2, 3, 32, 32)
output = model(x)
print(f"输出形状: {output.shape}")  # (2, 10)

# 统计参数量
total_params = sum(p.numel() for p in model.parameters())
print(f"总参数数: {total_params:,}")
```

</details>

### 练习 3（挑战）：综合练习

实现一个带有残差连接的 CNN，在 CIFAR-10 上训练并对比普通 CNN 的效果。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 残差块
class ResBlock(nn.Module):
    def __init__(self, channels):
        super(ResBlock, self).__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(channels)
        self.relu = nn.ReLU()
    
    def forward(self, x):
        residual = x
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += residual
        out = self.relu(out)
        return out

# 残差 CNN
class ResCNN(nn.Module):
    def __init__(self, num_classes=10):
        super(ResCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.res1 = ResBlock(32)
        self.res2 = ResBlock(32)
        self.pool1 = nn.MaxPool2d(2, 2)
        
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.res3 = ResBlock(64)
        self.res4 = ResBlock(64)
        self.pool2 = nn.MaxPool2d(2, 2)
        
        self.fc = nn.Linear(64 * 8 * 8, num_classes)
        self.relu = nn.ReLU()
        self.gap = nn.AdaptiveAvgPool2d(1)
    
    def forward(self, x):
        x = self.relu(self.bn1(self.conv1(x)))
        x = self.res1(x)
        x = self.res2(x)
        x = self.pool1(x)
        
        x = self.relu(self.bn2(self.conv2(x)))
        x = self.res3(x)
        x = self.res4(x)
        x = self.pool2(x)
        
        x = self.gap(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x

# 数据准备
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

train_set = datasets.CIFAR10('./data', train=True, download=True, transform=transform)
test_set = datasets.CIFAR10('./data', train=False, download=True, transform=transform)
train_loader = DataLoader(train_set, batch_size=64, shuffle=True)
test_loader = DataLoader(test_set, batch_size=64)

# 训练
model = ResCNN()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

epochs = 20
for epoch in range(epochs):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for images, labels in train_loader:
        outputs = model(images)
        loss = criterion(outputs, labels)
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    
    train_acc = correct / total
    print(f'Epoch {epoch+1}/{epochs}, Loss: {running_loss/len(train_loader):.4f}, Acc: {train_acc:.2%}')

# 测试
model.eval()
correct = 0
total = 0
with torch.no_grad():
    for images, labels in test_loader:
        outputs = model(images)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

print(f'测试准确率: {correct/total:.2%}')
```

</details>

---

## 下一章预告

下一章我们会学习循环神经网络（RNN），这是处理序列数据（如文本、时间序列）的重要架构。你会了解到 RNN 如何记忆历史信息，以及 LSTM 和 GRU 如何解决梯度消失问题。
