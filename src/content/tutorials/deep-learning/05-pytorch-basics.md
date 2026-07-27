---
title: "第5章：PyTorch 框架入门"
description: "系统学习 PyTorch 框架，掌握张量操作、自动求导、模型构建和数据加载"
---

# 第5章：PyTorch 框架入门

## 本章导读

在学习 PyTorch 时，你可能会有这些疑问：

- PyTorch 是什么？为什么选择 PyTorch？
- 张量（Tensor）是什么？和 NumPy 数组有什么区别？
- 自动求导（Autograd）是如何工作的？
- 如何用 PyTorch 构建神经网络？

这一章会带你入门 PyTorch 框架，掌握张量操作、自动求导机制和模型构建方法。

---

## 1 为什么选择 PyTorch？

### PyTorch 简介

PyTorch 是由 Facebook AI Research 开发的开源深度学习框架，于 2017 年发布。

### PyTorch 的优势

| 特性 | PyTorch | TensorFlow |
|-----|---------|------------|
| 动态图 | 支持（Pythonic） | 支持（Eager Execution） |
| 调试 | 容易（可直接打印） | 较难 |
| 学习曲线 | 平缓 | 较陡 |
| 研究友好 | 非常友好 | 一般 |
| 生产部署 | 需要额外工具 | 原生支持 |
| 社区活跃度 | 高 | 高 |

打个比方：

> PyTorch 就像用 Python 写普通程序，你可以随时打印变量、调试代码。TensorFlow 更像编译型语言，需要先定义图再执行。

### PyTorch 的核心组件

1. **torch**：张量库，类似 NumPy
2. **torch.autograd**：自动求导引擎
3. **torch.nn**：神经网络模块
4. **torch.optim**：优化器
5. **torch.utils.data**：数据加载工具

---

## 2 张量（Tensor）基础

### 什么是张量？

张量是 PyTorch 中的基本数据结构，类似于 NumPy 的多维数组，但可以在 GPU 上运行。

```python
import torch
import numpy as np

# 创建张量
# 1. 从 Python 列表创建
t1 = torch.tensor([1, 2, 3, 4])
print(f"1D 张量: {t1}")

# 2. 从 NumPy 数组创建
arr = np.array([[1, 2], [3, 4]])
t2 = torch.tensor(arr)
print(f"2D 张量:\n{t2}")

# 3. 创建特殊张量
t_zeros = torch.zeros(2, 3)  # 全 0 张量
t_ones = torch.ones(2, 3)   # 全 1 张量
t_rand = torch.rand(2, 3)   # 随机张量
t_randn = torch.randn(2, 3) # 标准正态分布

print(f"全 0 张量:\n{t_zeros}")
print(f"随机张量:\n{t_rand}")
```

### 张量的属性

```python
# 创建张量
t = torch.randn(3, 4, 5)

# 查看属性
print(f"形状: {t.shape}")        # torch.Size([3, 4, 5])
print(f"数据类型: {t.dtype}")    # torch.float32
print(f"设备: {t.device}")       # cpu
print(f"维度数: {t.ndim}")       # 3
print(f"元素总数: {t.numel()}")  # 60
```

### 张量运算

```python
# 基本运算
a = torch.tensor([1.0, 2.0, 3.0])
b = torch.tensor([4.0, 5.0, 6.0])

# 加法
c = a + b
print(f"加法: {c}")

# 乘法（元素级）
d = a * b
print(f"乘法: {d}")

# 矩阵乘法
A = torch.randn(2, 3)
B = torch.randn(3, 4)
C = torch.matmul(A, B)  # 或 A @ B
print(f"矩阵乘法形状: {C.shape}")  # (2, 4)

# 广播机制
x = torch.randn(3, 1)
y = torch.randn(1, 4)
z = x + y  # 广播为 (3, 4)
print(f"广播后形状: {z.shape}")
```

### 张量与 NumPy 的转换

```python
# 张量转 NumPy
t = torch.tensor([1.0, 2.0, 3.0])
arr = t.numpy()
print(f"NumPy 数组: {arr}")

# NumPy 转张量
arr = np.array([1.0, 2.0, 3.0])
t = torch.from_numpy(arr)
print(f"张量: {t}")

# 注意：CPU 上的张量和 NumPy 数组共享内存
t[0] = 100
print(f"修改张量后 NumPy: {arr}")  # arr[0] 也变成 100
```

### GPU 支持

```python
# 检查 CUDA 是否可用
print(f"CUDA 可用: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    # CPU 张量转 GPU
    t_cpu = torch.tensor([1.0, 2.0, 3.0])
    t_gpu = t_cpu.to('cuda')
    print(f"GPU 张量: {t_gpu}")
    
    # GPU 张量转 CPU
    t_back = t_gpu.cpu()
    print(f"回到 CPU: {t_back}")
    
    # 直接在 GPU 上创建张量
    t_gpu2 = torch.randn(3, 3, device='cuda')
    print(f"GPU 上创建: {t_gpu2}")
```

---

## 3 自动求导（Autograd）

### 什么是自动求导？

自动求导是 PyTorch 的核心功能，可以自动计算张量操作的梯度。

打个比方：

> 自动求导就像一个智能计算器，你告诉它如何计算结果，它就能自动算出每个输入对结果的影响程度。

### 创建需要梯度的张量

```python
import torch

# 创建需要梯度的张量
x = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)
print(f"x: {x}")
print(f"需要梯度: {x.requires_grad}")

# 计算
y = x ** 2 + 2 * x + 1
print(f"y: {y}")

# 计算梯度（y 对 x 求导）
y_sum = y.sum()
y_sum.backward()

# 查看梯度
print(f"x 的梯度: {x.grad}")  # dy/dx = 2x + 2 = [4, 6, 8]
```

### 计算图

```python
# 计算图示例
x = torch.tensor(2.0, requires_grad=True)
w = torch.tensor(3.0, requires_grad=True)
b = torch.tensor(1.0, requires_grad=True)

# y = w * x + b
y = w * x + b
# z = y^2
z = y ** 2

# 反向传播
z.backward()

# 查看梯度
print(f"x 的梯度: {x.grad}")  # dz/dx = 2y * w = 2*7*3 = 42
print(f"w 的梯度: {w.grad}")  # dz/dw = 2y * x = 2*7*2 = 28
print(f"b 的梯度: {b.grad}")  # dz/db = 2y * 1 = 2*7*1 = 14
```

### 禁止梯度计算

```python
# 方法 1：torch.no_grad() 上下文管理器
x = torch.tensor(1.0, requires_grad=True)

with torch.no_grad():
    y = x * 2
    print(f"y 需要梯度: {y.requires_grad}")  # False

# 方法 2：detach() 方法
x = torch.tensor(1.0, requires_grad=True)
y = x * 2
z = y.detach()
print(f"z 需要梯度: {z.requires_grad}")  # False

# 方法 3：@torch.no_grad() 装饰器
@torch.no_grad()
def inference(x):
    return x * 2

x = torch.tensor(1.0, requires_grad=True)
y = inference(x)
print(f"y 需要梯度: {y.requires_grad}")  # False
```

---

## 4 构建神经网络

### 使用 nn.Module

```python
import torch
import torch.nn as nn

# 定义神经网络
class SimpleNet(nn.Module):
    def __init__(self):
        super(SimpleNet, self).__init__()
        # 定义层
        self.fc1 = nn.Linear(10, 64)   # 全连接层
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 1)
        
        # 定义激活函数
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        # 前向传播
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.sigmoid(self.fc3(x))
        return x

# 创建模型
model = SimpleNet()
print(model)

# 查看参数
total_params = sum(p.numel() for p in model.parameters())
print(f"总参数数: {total_params}")
```

### 使用 Sequential

```python
# 使用 Sequential 快速构建
model = nn.Sequential(
    nn.Linear(10, 64),
    nn.ReLU(),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Linear(32, 1),
    nn.Sigmoid()
)

print(model)

# 访问特定层
print(model[0])  # 第一层
print(model[1])  # 第二层

# 修改层
model[0] = nn.Linear(10, 128)  # 替换第一层
```

### 常用神经网络层

```python
# 全连接层
fc = nn.Linear(in_features=10, out_features=5)

# 卷积层
conv = nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3, padding=1)

# 池化层
pool = nn.MaxPool2d(kernel_size=2, stride=2)

# Batch Normalization
bn = nn.BatchNorm2d(num_features=16)

# Dropout
dropout = nn.Dropout(p=0.5)

# RNN
rnn = nn.LSTM(input_size=10, hidden_size=20, num_layers=2, batch_first=True)
```

---

## 5 数据加载与处理

### Dataset 和 DataLoader

```python
import torch
from torch.utils.data import Dataset, DataLoader

# 自定义数据集
class MyDataset(Dataset):
    def __init__(self, num_samples=1000):
        self.X = torch.randn(num_samples, 10)
        self.y = torch.randint(0, 2, (num_samples, 1)).float()
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

# 创建数据集
dataset = MyDataset(num_samples=1000)

# 创建 DataLoader
dataloader = DataLoader(
    dataset,
    batch_size=32,      # 批次大小
    shuffle=True,       # 是否打乱
    num_workers=0       # 加载数据的子进程数
)

# 遍历数据
for batch_idx, (X, y) in enumerate(dataloader):
    print(f"批次 {batch_idx}: X 形状 {X.shape}, y 形状 {y.shape}")
    if batch_idx >= 2:
        break
```

### 使用内置数据集

```python
from torchvision import datasets, transforms

# 定义数据增强
transform = transforms.Compose([
    transforms.ToTensor(),           # 转为张量
    transforms.Normalize((0.5,), (0.5,))  # 归一化
])

# 下载 MNIST 数据集
train_dataset = datasets.MNIST(
    root='./data',
    train=True,
    download=True,
    transform=transform
)

test_dataset = datasets.MNIST(
    root='./data',
    train=False,
    download=True,
    transform=transform
)

# 创建 DataLoader
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

# 查看数据
images, labels = next(iter(train_loader))
print(f"图像形状: {images.shape}")  # (64, 1, 28, 28)
print(f"标签形状: {labels.shape}")  # (64,)
```

---

## 6 完整的训练流程

### 训练循环

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# 1. 准备数据
class SimpleDataset(Dataset):
    def __init__(self, num_samples=1000):
        self.X = torch.randn(num_samples, 10)
        self.y = (self.X.sum(dim=1) > 0).float().unsqueeze(1)
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

train_dataset = SimpleDataset(1000)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# 2. 定义模型
model = nn.Sequential(
    nn.Linear(10, 32),
    nn.ReLU(),
    nn.Linear(32, 16),
    nn.ReLU(),
    nn.Linear(16, 1),
    nn.Sigmoid()
)

# 3. 定义损失函数和优化器
criterion = nn.BCELoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 4. 训练循环
epochs = 50
for epoch in range(epochs):
    model.train()  # 设置为训练模式
    running_loss = 0.0
    correct = 0
    total = 0
    
    for batch_idx, (X, y) in enumerate(train_loader):
        # 前向传播
        outputs = model(X)
        loss = criterion(outputs, y)
        
        # 反向传播
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        # 统计
        running_loss += loss.item()
        predicted = (outputs > 0.5).float()
        total += y.size(0)
        correct += (predicted == y).sum().item()
    
    # 打印训练信息
    avg_loss = running_loss / len(train_loader)
    accuracy = correct / total
    print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.4f}, Accuracy: {accuracy:.2%}')
```

### 验证和测试

```python
# 验证函数
def validate(model, val_loader, criterion):
    model.eval()  # 设置为评估模式
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():  # 不计算梯度
        for X, y in val_loader:
            outputs = model(X)
            loss = criterion(outputs, y)
            
            running_loss += loss.item()
            predicted = (outputs > 0.5).float()
            total += y.size(0)
            correct += (predicted == y).sum().item()
    
    avg_loss = running_loss / len(val_loader)
    accuracy = correct / total
    return avg_loss, accuracy

# 测试
val_loss, val_acc = validate(model, train_loader, criterion)
print(f'验证损失: {val_loss:.4f}, 验证准确率: {val_acc:.2%}')
```

### 保存和加载模型

```python
# 保存模型
# 方法 1：保存整个模型
torch.save(model, 'model.pth')

# 方法 2：保存状态字典（推荐）
torch.save(model.state_dict(), 'model_state.pth')

# 加载模型
# 方法 1：加载整个模型
model = torch.load('model.pth')

# 方法 2：加载状态字典
model = SimpleNet()  # 先创建模型结构
model.load_state_dict(torch.load('model_state.pth'))
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 张量 | PyTorch 的基本数据结构，类似 NumPy 数组 |
| 自动求导 | 通过 requires_grad 和 backward() 自动计算梯度 |
| nn.Module | 构建神经网络的基础类 |
| Dataset | 自定义数据集的基类 |
| DataLoader | 批量加载数据的工具 |
| 训练循环 | 前向传播 → 计算损失 → 反向传播 → 更新参数 |
| 模型保存 | state_dict() 保存参数，load_state_dict() 加载 |

---

## 8 新手常见误区

### 误区 1："忘记 model.train() 和 model.eval()"

训练时必须调用 `model.train()`，验证/测试时必须调用 `model.eval()`，否则 Dropout 和 BatchNorm 会表现异常。

### 误区 2："忘记 optimizer.zero_grad()"

PyTorch 梯度会累积，每次反向传播前必须清空梯度。

### 误区 3："在验证时计算梯度"

验证时应该使用 `with torch.no_grad()`，避免计算梯度，节省内存。

### 误区 4："保存整个模型"

推荐保存 state_dict，因为保存整个模型会绑定特定的目录结构，不够灵活。

---

## 9 动手练习

### 练习 1：基础练习

创建一个自定义 Dataset，生成正弦波数据，用于训练一个回归模型。

<details>
<summary>点击查看答案</summary>

```python
import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np

class SineWaveDataset(Dataset):
    def __init__(self, num_samples=1000):
        # 生成 0 到 2π 的 x
        self.X = torch.linspace(0, 2*np.pi, num_samples).unsqueeze(1)
        # 生成 sin(x) 作为 y，添加一些噪声
        self.y = torch.sin(self.X) + torch.randn_like(self.X) * 0.1
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

# 创建数据集和数据加载器
dataset = SineWaveDataset(1000)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

# 查看数据
X, y = next(iter(dataloader))
print(f"X 形状: {X.shape}")
print(f"y 形状: {y.shape}")
print(f"X 范围: [{X.min():.4f}, {X.max():.4f}]")
print(f"y 范围: [{y.min():.4f}, {y.max():.4f}]")
```

</details>

### 练习 2：进阶练习

用 PyTorch 实现一个完整的训练流程，包括数据加载、模型定义、训练、验证和模型保存。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np

# 1. 数据集
class SineWaveDataset(Dataset):
    def __init__(self, num_samples=1000):
        self.X = torch.linspace(0, 2*np.pi, num_samples).unsqueeze(1)
        self.y = torch.sin(self.X) + torch.randn_like(self.X) * 0.1
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

# 2. 模型
class SineRegressor(nn.Module):
    def __init__(self):
        super(SineRegressor, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(1, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1)
        )
    
    def forward(self, x):
        return self.net(x)

# 3. 训练
def train_model():
    # 数据
    train_dataset = SineWaveDataset(800)
    val_dataset = SineWaveDataset(200)
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32)
    
    # 模型
    model = SineRegressor()
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    
    # 训练循环
    epochs = 100
    best_val_loss = float('inf')
    
    for epoch in range(epochs):
        # 训练
        model.train()
        train_loss = 0.0
        for X, y in train_loader:
            outputs = model(X)
            loss = criterion(outputs, y)
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
        train_loss /= len(train_loader)
        
        # 验证
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for X, y in val_loader:
                outputs = model(X)
                loss = criterion(outputs, y)
                val_loss += loss.item()
        val_loss /= len(val_loader)
        
        # 保存最佳模型
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), 'best_sine_model.pth')
        
        if (epoch + 1) % 20 == 0:
            print(f'Epoch [{epoch+1}/{epochs}], Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}')
    
    print(f'最佳验证损失: {best_val_loss:.4f}')

# 运行训练
train_model()
```

</details>

### 练习 3（挑战）：综合练习

使用 PyTorch 的内置 CIFAR-10 数据集，构建一个 CNN 模型进行图像分类。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 1. 数据准备
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

train_dataset = datasets.CIFAR10(
    root='./data', train=True, download=True, transform=transform
)
test_dataset = datasets.CIFAR10(
    root='./data', train=False, download=True, transform=transform
)

train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

# 2. 定义 CNN 模型
class CIFAR10CNN(nn.Module):
    def __init__(self):
        super(CIFAR10CNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 8 * 8, 256)
        self.fc2 = nn.Linear(256, 10)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.5)
    
    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))  # (64, 32, 16, 16)
        x = self.pool(self.relu(self.conv2(x)))  # (64, 64, 8, 8)
        x = x.view(-1, 64 * 8 * 8)              # (64, 4096)
        x = self.dropout(self.relu(self.fc1(x))) # (64, 256)
        x = self.fc2(x)                          # (64, 10)
        return x

# 3. 训练
model = CIFAR10CNN()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 训练 10 轮（实际训练可以更多）
epochs = 10
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

# 4. 测试
model.eval()
correct = 0
total = 0
with torch.no_grad():
    for images, labels in test_loader:
        outputs = model(images)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

test_acc = correct / total
print(f'测试准确率: {test_acc:.2%}')

# 保存模型
torch.save(model.state_dict(), 'cifar10_cnn.pth')
```

</details>

---

## 下一章预告

下一章我们会学习卷积神经网络（CNN），这是深度学习在计算机视觉领域最重要的架构。你会了解到卷积层、池化层的工作原理，以及如何用 CNN 进行图像分类。
