---
title: "第6章：损失函数与优化器"
description: "掌握常用损失函数、SGD、Adam、学习率调度的使用方法"
---

# 第6章：损失函数与优化器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 损失函数是什么？为什么要计算损失？
- 有哪些常用的损失函数？分别适用于什么场景？
- 优化器是如何更新参数的？SGD 和 Adam 有什么区别？
- 学习率调度是什么？为什么要调整学习率？

这一章就是为了解答这些问题。损失函数和优化器是训练神经网络的核心组件。

---

## 1 为什么需要损失函数和优化器？

### 痛点分析

想象一下你在下山：

**没有损失函数**：你不知道山顶在哪里，也不知道自己离山顶有多远。

**没有优化器**：你知道方向，但不知道怎么迈步，迈多大步。

### 训练流程

```
前向传播 → 计算损失 → 反向传播 → 更新参数
    ↑                                    ↓
    └──────────── 循环迭代 ──────────────┘
```

> **一句话总结**：损失函数告诉你"错得有多离谱"，优化器告诉你"如何改正"。

---

## 2 核心原理

### 损失函数的作用

打个比方：

> 损失函数就像考试评分标准，告诉你答案和标准答案差多少。

### 优化器的作用

打个比方：

> 优化器就像下山的策略，决定你每一步怎么走，走多大步。

---

## 3 常用损失函数

### 均方误差（MSE）

```python
import torch
import torch.nn as nn

# 均方误差损失：用于回归任务
criterion = nn.MSELoss()

# 预测值和真实值
predictions = torch.tensor([2.5, 3.0, 4.5])
targets = torch.tensor([3.0, 3.5, 4.0])

# 计算损失
loss = criterion(predictions, targets)
print(f"MSE 损失: {loss.item()}")  # 0.1667

# 手动计算验证
# ((2.5-3)^2 + (3-3.5)^2 + (4.5-4)^2) / 3 = (0.25 + 0.25 + 0.25) / 3 = 0.25
```

### 交叉熵损失（CrossEntropy）

```python
import torch
import torch.nn as nn

# 交叉熵损失：用于分类任务
criterion = nn.CrossEntropyLoss()

# 模型输出（未归一化的 logits）
logits = torch.tensor([[2.0, 1.0, 0.1],  # 样本1
                       [0.5, 2.5, 0.3]])  # 样本2

# 真实标签（类别索引）
labels = torch.tensor([0, 1])  # 样本1是类别0，样本2是类别1

# 计算损失
loss = criterion(logits, labels)
print(f"交叉熵损失: {loss.item()}")
```

### 二元交叉熵（BCE）

```python
import torch
import torch.nn as nn

# 二元交叉熵：用于二分类任务
criterion = nn.BCEWithLogitsLoss()  # 包含 Sigmoid

# 模型输出（logits）
logits = torch.tensor([2.0, -1.0, 0.5])

# 真实标签（0或1）
labels = torch.tensor([1.0, 0.0, 1.0])

# 计算损失
loss = criterion(logits, labels)
print(f"BCE 损失: {loss.item()}")
```

### L1 损失（MAE）

```python
import torch
import torch.nn as nn

# L1 损失（平均绝对误差）
criterion = nn.L1Loss()

predictions = torch.tensor([2.5, 3.0, 4.5])
targets = torch.tensor([3.0, 3.5, 4.0])

loss = criterion(predictions, targets)
print(f"L1 损失: {loss.item()}")  # 0.3333
```

### 损失函数对比

| 损失函数 | 适用场景 | 特点 |
| --- | --- | --- |
| MSELoss | 回归 | 对异常值敏感 |
| L1Loss | 回归 | 对异常值鲁棒 |
| CrossEntropyLoss | 多分类 | 包含 Softmax |
| BCEWithLogitsLoss | 二分类 | 包含 Sigmoid |
| SmoothL1Loss | 回归 | 结合 L1 和 L2 |

---

## 4 优化器

### SGD（随机梯度下降）

```python
import torch
import torch.nn as nn

# 简单模型
model = nn.Linear(10, 1)

# SGD 优化器
optimizer = torch.optim.SGD(
    model.parameters(),  # 要优化的参数
    lr=0.01,  # 学习率
    momentum=0.9,  # 动量（加速收敛）
    weight_decay=1e-4  # L2 正则化
)

# 训练循环
for epoch in range(100):
    # 前向传播
    outputs = model(inputs)
    loss = criterion(outputs, targets)

    # 反向传播
    optimizer.zero_grad()  # 清零梯度
    loss.backward()  # 计算梯度

    # 更新参数
    optimizer.step()  # 更新参数
```

### Adam 优化器

```python
import torch
import torch.nn as nn

# 简单模型
model = nn.Linear(10, 1)

# Adam 优化器（推荐）
optimizer = torch.optim.Adam(
    model.parameters(),
    lr=0.001,  # 学习率（通常比 SGD 小）
    betas=(0.9, 0.999),  # 动量系数
    eps=1e-8,  # 防止除零
    weight_decay=1e-4  # L2 正则化
)
```

### 优化器对比

| 优化器 | 学习率 | 收敛速度 | 适用场景 |
| --- | --- | --- | --- |
| SGD | 较大（0.01-0.1） | 慢 | 简单任务，需要精细调参 |
| SGD + Momentum | 较大 | 中等 | 有局部最优的问题 |
| Adam | 较小（0.001） | 快 | 大多数任务（默认选择） |
| RMSprop | 中等 | 快 | 非平稳目标 |
| Adagrad | 自适应 | 中等 | 稀疏数据 |

> **选择建议**：不知道用什么时，选 Adam。

---

## 5 学习率调度

### StepLR

```python
import torch
import torch.nn as nn
import torch.optim as optim

model = nn.Linear(10, 1)
optimizer = optim.SGD(model.parameters(), lr=0.1)

# 每 30 个 epoch，学习率乘以 0.1
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=30, gamma=0.1)

# 训练循环
for epoch in range(100):
    train(...)
    validate(...)

    # 更新学习率
    scheduler.step()

    print(f"Epoch {epoch}, LR: {scheduler.get_last_lr()}")
```

### MultiStepLR

```python
import torch
import torch.optim as optim

model = nn.Linear(10, 1)
optimizer = optim.SGD(model.parameters(), lr=0.1)

# 在第 30、60、90 个 epoch，学习率乘以 0.1
scheduler = optim.lr_scheduler.MultiStepLR(
    optimizer,
    milestones=[30, 60, 90],
    gamma=0.1
)
```

### ExponentialLR

```python
import torch
import torch.optim as optim

model = nn.Linear(10, 1)
optimizer = optim.SGD(model.parameters(), lr=0.1)

# 每个 epoch，学习率乘以 0.95
scheduler = optim.lr_scheduler.ExponentialLR(optimizer, gamma=0.95)
```

### CosineAnnealingLR

```python
import torch
import torch.optim as optim

model = nn.Linear(10, 1)
optimizer = optim.SGD(model.parameters(), lr=0.1)

# 余弦退火：学习率先慢后快再慢
scheduler = optim.lr_scheduler.CosineAnnealingLR(
    optimizer,
    T_max=100,  # 最大 epoch 数
    eta_min=0  # 最小学习率
)
```

### ReduceLROnPlateau

```python
import torch
import torch.optim as optim

model = nn.Linear(10, 1)
optimizer = optim.SGD(model.parameters(), lr=0.1)

# 当验证集损失不再下降时，降低学习率
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode='min',  # 监控损失最小化
    factor=0.1,  # 学习率降低因子
    patience=10,  # 容忍 epoch 数
    verbose=True  # 打印学习率变化
)

# 训练循环
for epoch in range(100):
    train(...)
    val_loss = validate(...)

    # 根据验证损失调整学习率
    scheduler.step(val_loss)
```

---

## 6 完整训练示例

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 1. 准备数据
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

train_dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)

# 2. 定义模型
class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(28*28, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 28*28)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNet()

# 3. 定义损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.1)

# 4. 训练循环
num_epochs = 20
for epoch in range(num_epochs):
    model.train()  # 训练模式
    running_loss = 0.0

    for images, labels in train_loader:
        # 前向传播
        outputs = model(images)
        loss = criterion(outputs, labels)

        # 反向传播
        optimizer.zero_grad()  # 清零梯度
        loss.backward()  # 计算梯度
        optimizer.step()  # 更新参数

        running_loss += loss.item()

    # 更新学习率
    scheduler.step()

    print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {running_loss/len(train_loader):.4f}, LR: {scheduler.get_last_lr()[0]:.6f}")
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| MSELoss | 回归任务，对异常值敏感 |
| CrossEntropyLoss | 多分类任务，包含 Softmax |
| BCEWithLogitsLoss | 二分类任务，包含 Sigmoid |
| SGD | 基础优化器，需要精细调参 |
| Adam | 自适应优化器，默认选择 |
| 学习率调度 | 动态调整学习率，提升性能 |

---

## 8 新手常见误区

### 误区 1："学习率越大越好"

**错！** 学习率太大会导致震荡不收敛，太小会收敛很慢。

正确做法：从 0.001 开始尝试，根据训练情况调整。

### 误区 2："忘记清零梯度"

**错！** 梯度会累加，导致训练错误。

正确做法：每次迭代前调用 `optimizer.zero_grad()`。

### 误区 3："分类任务用 MSE 损失"

不是的。分类任务应该用交叉熵损失。

正确做法：分类用 CrossEntropyLoss，回归用 MSELoss。

---

## 9 动手练习

### 练习 1：基础练习

使用 CrossEntropyLoss 计算一个 3 分类问题的损失。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

# 定义损失函数
criterion = nn.CrossEntropyLoss()

# 模型输出（3个样本，3个类别）
logits = torch.tensor([
    [2.0, 1.0, 0.5],  # 样本1
    [0.5, 2.0, 1.5],  # 样本2
    [1.0, 0.5, 2.0]   # 样本3
])

# 真实标签
labels = torch.tensor([0, 1, 2])  # 分别是类别0、1、2

# 计算损失
loss = criterion(logits, labels)
print(f"交叉熵损失: {loss.item():.4f}")
```

</details>

### 练习 2：进阶练习

创建一个模型，使用 Adam 优化器和 StepLR 学习率调度器进行训练。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim

# 定义模型
model = nn.Sequential(
    nn.Linear(100, 64),
    nn.ReLU(),
    nn.Linear(64, 10)
)

# 定义优化器
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 定义学习率调度器
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.1)

# 定义损失函数
criterion = nn.CrossEntropyLoss()

# 模拟训练
for epoch in range(30):
    # 模拟训练数据
    inputs = torch.randn(32, 100)
    labels = torch.randint(0, 10, (32,))

    # 前向传播
    outputs = model(inputs)
    loss = criterion(outputs, labels)

    # 反向传播
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    # 更新学习率
    scheduler.step()

    if (epoch + 1) % 10 == 0:
        print(f"Epoch [{epoch+1}/30], Loss: {loss.item():.4f}, LR: {scheduler.get_last_lr()[0]:.6f}")
```

</details>

### 练习 3（挑战）：综合练习

实现一个完整的训练循环，包含损失计算、梯度清零、反向传播、参数更新和学习率调度。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# 1. 准备数据
X = torch.randn(1000, 20)
y = torch.randint(0, 5, (1000,))
dataset = TensorDataset(X, y)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

# 2. 定义模型
class Classifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(20, 64)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 5)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return x

model = Classifier()

# 3. 定义损失函数、优化器、调度器
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=5, factor=0.5)

# 4. 训练循环
num_epochs = 50
for epoch in range(num_epochs):
    model.train()
    epoch_loss = 0.0
    correct = 0
    total = 0

    for batch_X, batch_y in dataloader:
        # 前向传播
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)

        # 反向传播
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        # 统计
        epoch_loss += loss.item()
        _, predicted = outputs.max(1)
        total += batch_y.size(0)
        correct += predicted.eq(batch_y).sum().item()

    # 计算平均损失和准确率
    avg_loss = epoch_loss / len(dataloader)
    accuracy = 100. * correct / total

    # 更新学习率
    scheduler.step(avg_loss)

    if (epoch + 1) % 10 == 0:
        print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {avg_loss:.4f}, Acc: {accuracy:.2f}%, LR: {optimizer.param_groups[0]['lr']:.6f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **模型训练与评估**——完整的训练流程，包括训练集、验证集、测试集的划分，模型保存与加载，以及训练过程的可视化。