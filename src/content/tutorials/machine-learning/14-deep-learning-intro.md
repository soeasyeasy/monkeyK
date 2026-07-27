---
title: "第14章：深度学习入门"
description: "神经网络结构、反向传播、激活函数、PyTorch 实战"
---

# 第14章：深度学习入门

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是神经网络？和机器学习有什么关系？
- 神经网络是怎么学习的？
- 什么是反向传播？
- 如何开始深度学习实战？

这一章就是为了解答这些问题。深度学习是机器学习的一个分支，在图像、语音、文本等领域取得了巨大成功。

---

## 1 为什么需要深度学习？

### 痛点分析

传统机器学习的局限：

```
问题1：特征工程困难
- 需要手动设计特征
- 依赖领域知识
- 复杂任务（如图像识别）难以手工提取特征

问题2：表达能力有限
- 简单模型难以学习复杂模式
- 非线性问题处理困难

问题3：扩展性差
- 数据增加，性能提升有限
- 难以处理高维数据
```

### 解决方案

深度学习自动学习特征：

```python
# 深度学习思路：
# 1. 使用多层神经网络
# 2. 自动从原始数据中学习特征
# 3. 端到端学习，不需要手工特征工程

# 打个比方：
# 传统机器学习像"教小孩认字"：先教笔画，再教偏旁，最后教整字
# 深度学习像"给小孩看成千上万的字"：他自己就学会了认字
```

打个比方：

> 深度学习像"大脑学习"：通过大量神经元连接，自动从经验中学习规律。

> **一句话总结**：深度学习使用多层神经网络，自动学习数据中的复杂模式。

---

## 2 核心原理

### 神经网络结构

```python
# 神经网络由多层组成：
# 输入层 → 隐藏层 → 输出层

# 每个神经元：
# 1. 接收输入
# 2. 加权求和
# 3. 加上偏置
# 4. 通过激活函数

# 公式：output = activation(weights * input + bias)
```

### 激活函数

```python
# 常用激活函数：

# 1. Sigmoid
# f(x) = 1 / (1 + e^(-x))
# 输出范围：(0, 1)
# 问题：梯度消失

# 2. ReLU（最常用）
# f(x) = max(0, x)
# 优点：计算快，缓解梯度消失
# 问题：神经元死亡

# 3. Tanh
# f(x) = (e^x - e^(-x)) / (e^x + e^(-x))
# 输出范围：(-1, 1)

# 4. Leaky ReLU
# f(x) = x if x > 0 else 0.01 * x
# 解决ReLU神经元死亡问题
```

### 反向传播

```python
# 反向传播算法：
# 1. 前向传播：计算预测值
# 2. 计算损失
# 3. 反向传播：计算每个参数的梯度
# 4. 更新参数：梯度下降

# 链式法则：
# ∂Loss/∂w = ∂Loss/∂output * ∂output/∂net * ∂net/∂w
```

---

## 3 基础用法

### PyTorch 基础

```python
# PyTorch 需要安装：pip install torch

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    import numpy as np
    
    print(f"PyTorch版本：{torch.__version__}")
    print(f"CUDA是否可用：{torch.cuda.is_available()}")
    
    # ========== 张量操作 ==========
    
    # 1. 创建张量
    x = torch.tensor([1, 2, 3, 4, 5])
    print(f"\n张量：{x}")
    
    # 2. 随机张量
    random_tensor = torch.randn(3, 4)  # 3x4正态分布
    print(f"随机张量形状：{random_tensor.shape}")
    
    # 3. 张量运算
    a = torch.tensor([1, 2, 3])
    b = torch.tensor([4, 5, 6])
    c = a + b  # 逐元素相加
    print(f"张量相加：{c}")
    
    # 4. 矩阵乘法
    A = torch.randn(2, 3)
    B = torch.randn(3, 4)
    C = torch.matmul(A, B)  # 矩阵乘法
    print(f"矩阵乘法形状：{C.shape}")
    
    # 5. 自动求导
    x = torch.tensor(2.0, requires_grad=True)  # 需要梯度
    y = x ** 2 + 3 * x + 2  # y = x^2 + 3x + 2
    y.backward()  # 反向传播
    print(f"\nx={x.item()}, y={y.item()}")
    print(f"dy/dx = {x.grad.item()}")  # dy/dx = 2x + 3 = 7
    
    # ========== 构建神经网络 ==========
    
    # 1. 定义网络结构
    class SimpleNN(nn.Module):
        def __init__(self):
            super(SimpleNN, self).__init__()
            # 定义层
            self.fc1 = nn.Linear(4, 16)    # 输入4维，输出16维
            self.fc2 = nn.Linear(16, 32)   # 输入16维，输出32维
            self.fc3 = nn.Linear(32, 3)    # 输入32维，输出3维（3个类别）
            self.relu = nn.ReLU()          # 激活函数
        
        def forward(self, x):
            # 前向传播
            x = self.relu(self.fc1(x))     # 第一层 + ReLU
            x = self.relu(self.fc2(x))     # 第二层 + ReLU
            x = self.fc3(x)                # 输出层
            return x
    
    # 2. 创建模型
    model = SimpleNN()
    print(f"\n模型结构：\n{model}")
    
    # 3. 查看参数
    total_params = sum(p.numel() for p in model.parameters())
    print(f"\n总参数数量：{total_params}")
    
    # ========== 训练流程 ==========
    
    # 1. 准备数据
    from sklearn.datasets import load_iris
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    
    iris = load_iris()
    X = iris.data
    y = iris.target
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 转换为张量
    X_train_tensor = torch.FloatTensor(X_train_scaled)
    y_train_tensor = torch.LongTensor(y_train)
    X_test_tensor = torch.FloatTensor(X_test_scaled)
    y_test_tensor = torch.LongTensor(y_test)
    
    # 创建数据加载器
    train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    
    # 2. 定义损失函数和优化器
    criterion = nn.CrossEntropyLoss()  # 交叉熵损失
    optimizer = optim.Adam(model.parameters(), lr=0.01)  # Adam优化器
    
    # 3. 训练循环
    epochs = 100
    print("\n开始训练...")
    
    for epoch in range(epochs):
        model.train()  # 训练模式
        
        for batch_X, batch_y in train_loader:
            # 前向传播
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            
            # 反向传播
            optimizer.zero_grad()  # 清空梯度
            loss.backward()        # 计算梯度
            optimizer.step()       # 更新参数
        
        # 每10轮打印一次
        if (epoch + 1) % 10 == 0:
            model.eval()  # 评估模式
            with torch.no_grad():
                test_outputs = model(X_test_tensor)
                test_loss = criterion(test_outputs, y_test_tensor)
                _, predicted = torch.max(test_outputs, 1)
                accuracy = (predicted == y_test_tensor).sum().item() / len(y_test_tensor)
            
            print(f"Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}, "
                  f"Test Loss: {test_loss.item():.4f}, Accuracy: {accuracy:.2%}")
    
    # 4. 最终评估
    model.eval()
    with torch.no_grad():
        test_outputs = model(X_test_tensor)
        _, predicted = torch.max(test_outputs, 1)
        accuracy = (predicted == y_test_tensor).sum().item() / len(y_test_tensor)
        print(f"\n最终测试准确率: {accuracy:.2%}")

except ImportError:
    print("请先安装 PyTorch: pip install torch")
```

### 使用 PyTorch 进行图像分类

```python
# PyTorch 图像分类示例

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torchvision import datasets, transforms
    from torch.utils.data import DataLoader
    import matplotlib.pyplot as plt
    
    # 1. 数据预处理
    transform = transforms.Compose([
        transforms.ToTensor(),              # 转换为张量
        transforms.Normalize((0.5,), (0.5,))  # 归一化到[-1, 1]
    ])
    
    # 2. 加载MNIST数据集
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
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)
    
    print(f"训练集大小: {len(train_dataset)}")
    print(f"测试集大小: {len(test_dataset)}")
    
    # 3. 定义CNN模型
    class CNN(nn.Module):
        def __init__(self):
            super(CNN, self).__init__()
            # 卷积层
            self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
            self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
            # 池化层
            self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
            # 全连接层
            self.fc1 = nn.Linear(64 * 7 * 7, 128)
            self.fc2 = nn.Linear(128, 10)
            self.relu = nn.ReLU()
        
        def forward(self, x):
            # 卷积 -> ReLU -> 池化
            x = self.pool(self.relu(self.conv1(x)))  # 28x28 -> 14x14
            x = self.pool(self.relu(self.conv2(x)))  # 14x14 -> 7x7
            # 展平
            x = x.view(-1, 64 * 7 * 7)
            # 全连接层
            x = self.relu(self.fc1(x))
            x = self.fc2(x)
            return x
    
    model = CNN()
    print(f"\nCNN模型结构：\n{model}")
    
    # 4. 定义损失函数和优化器
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # 5. 训练
    epochs = 5
    print("\n开始训练CNN...")
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        
        for images, labels in train_loader:
            # 前向传播
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            # 反向传播
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
        
        print(f"Epoch [{epoch+1}/{epochs}], Loss: {running_loss/len(train_loader):.4f}")
    
    # 6. 测试
    model.eval()
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, labels in test_loader:
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
    
    print(f"\n测试准确率: {100 * correct / total:.2f}%")
    
    # 7. 可视化预测结果
    fig, axes = plt.subplots(2, 5, figsize=(12, 5))
    axes = axes.flatten()
    
    with torch.no_grad():
        for i in range(10):
            image, label = test_dataset[i]
            output = model(image.unsqueeze(0))
            _, predicted = torch.max(output, 1)
            
            axes[i].imshow(image.squeeze(), cmap='gray')
            axes[i].set_title(f'Pred: {predicted.item()}, True: {label}')
            axes[i].axis('off')
    
    plt.tight_layout()
    plt.show()

except ImportError as e:
    print(f"需要安装依赖: pip install torch torchvision matplotlib")
    print(f"错误: {e}")
```

### 使用预训练模型

```python
# 使用预训练模型进行图像分类

try:
    import torch
    import torchvision.models as models
    import torchvision.transforms as transforms
    from PIL import Image
    import requests
    from io import BytesIO
    
    # 1. 加载预训练的ResNet18
    model = models.resnet18(pretrained=True)
    model.eval()  # 评估模式
    
    print("ResNet18模型加载成功")
    
    # 2. 定义图像预处理
    preprocess = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    # 3. 加载ImageNet类别标签
    # 这里简化处理，实际应该加载完整的标签文件
    print("\n预训练模型可以使用ImageNet的1000个类别进行分类")
    print("适用于通用图像分类任务")
    
    # 4. 微调预训练模型
    # 修改最后一层以适应自己的任务
    num_classes = 10  # 假设你有10个类别
    model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
    
    print(f"\n修改后的模型输出维度: {num_classes}")
    print("可以针对特定任务进行微调")

except ImportError:
    print("需要安装依赖: pip install torch torchvision pillow requests")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 用途 |
| --- | --- | --- |
| 神经网络 | 多层神经元组成 | 学习复杂模式 |
| 激活函数 | 引入非线性 | ReLU, Sigmoid, Tanh |
| 反向传播 | 计算梯度 | 训练神经网络 |
| 损失函数 | 衡量预测误差 | 交叉熵, MSE |
| 优化器 | 更新参数 | SGD, Adam |
| 批次训练 | 小批量更新 | 提高效率 |
| 过拟合 | 训练好，测试差 | Dropout, 正则化 |
| GPU加速 | 并行计算 | 加速训练 |

---

## 5 新手常见误区

### 误区 1："网络越深越好"

**错！** 网络太深会导致梯度消失、训练困难。需要根据任务复杂度选择合适的网络深度。

### 误区 2："ReLU 总是最好的激活函数"

不是的。ReLU 在隐藏层效果好，但输出层需要根据任务选择。分类用 Softmax，回归用线性。

### 误区 3："学习率越大训练越快"

**错！** 学习率太大会导致震荡，太小收敛慢。需要使用学习率调度器动态调整。

### 误区 4："深度学习不需要特征工程"

不是的。虽然深度学习可以自动学习特征，但合理的数据预处理、数据增强仍然重要。

### 误区 5："GPU 总是比 CPU 快"

不是的。小数据集、简单模型，CPU 可能更快。GPU 的优势在大数据集、复杂模型。

---

## 6 动手练习

### 练习 1：基础练习 - 简单神经网络

使用 PyTorch 构建简单的全连接网络。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# 转换为张量
X_train = torch.FloatTensor(X_train)
y_train = torch.LongTensor(y_train)
X_test = torch.FloatTensor(X_test)
y_test = torch.LongTensor(y_test)

# 定义模型
class SimpleNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(4, 16)
        self.fc2 = nn.Linear(16, 3)
        self.relu = nn.ReLU()
    
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNN()
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

# 训练
for epoch in range(100):
    outputs = model(X_train)
    loss = criterion(outputs, y_train)
    
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

# 评估
model.eval()
with torch.no_grad():
    outputs = model(X_test)
    _, predicted = torch.max(outputs, 1)
    accuracy = (predicted == y_test).sum().item() / len(y_test)
    print(f"准确率: {accuracy:.2%}")
```

</details>

### 练习 2：进阶练习 - 不同激活函数对比

对比 ReLU、Sigmoid、Tanh 的效果。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 生成数据
X, y = make_classification(n_samples=1000, n_features=20, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

scaler = StandardScaler()
X_train = torch.FloatTensor(scaler.fit_transform(X_train))
y_train = torch.LongTensor(y_train)
X_test = torch.FloatTensor(scaler.transform(X_test))
y_test = torch.LongTensor(y_test)

# 不同激活函数
activations = {
    'ReLU': nn.ReLU(),
    'Sigmoid': nn.Sigmoid(),
    'Tanh': nn.Tanh()
}

for name, activation in activations.items():
    class Net(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc1 = nn.Linear(20, 32)
            self.fc2 = nn.Linear(32, 2)
            self.activation = activation
        
        def forward(self, x):
            x = self.activation(self.fc1(x))
            x = self.fc2(x)
            return x
    
    model = Net()
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    
    for epoch in range(100):
        outputs = model(X_train)
        loss = criterion(outputs, y_train)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    
    model.eval()
    with torch.no_grad():
        outputs = model(X_test)
        _, predicted = torch.max(outputs, 1)
        accuracy = (predicted == y_test).sum().item() / len(y_test)
        print(f"{name}: {accuracy:.2%}")
```

</details>

### 练习 3（挑战）：综合练习 - 完整训练流程

实现完整的训练、验证、测试流程。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 加载数据
digits = load_digits()
X = digits.data
y = digits.target

# 划分训练集、验证集、测试集
X_train_val, X_test, y_train_val, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
X_train, X_val, y_train, y_val = train_test_split(
    X_train_val, y_train_val, test_size=0.25, random_state=42
)

# 特征缩放
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_val = scaler.transform(X_val)
X_test = scaler.transform(X_test)

# 转换为张量
train_dataset = TensorDataset(
    torch.FloatTensor(X_train),
    torch.LongTensor(y_train)
)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# 定义模型
class DigitsNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(64, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 10)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
    
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        return x

model = DigitsNN()
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# 训练
best_val_acc = 0
for epoch in range(100):
    model.train()
    for batch_X, batch_y in train_loader:
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    
    # 验证
    model.eval()
    with torch.no_grad():
        val_outputs = model(torch.FloatTensor(X_val))
        _, predicted = torch.max(val_outputs, 1)
        val_acc = (predicted == torch.LongTensor(y_val)).sum().item() / len(y_val)
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'best_model.pth')
    
    if (epoch + 1) % 20 == 0:
        print(f"Epoch [{epoch+1}/100], Val Acc: {val_acc:.2%}")

# 测试
model.load_state_dict(torch.load('best_model.pth'))
model.eval()
with torch.no_grad():
    test_outputs = model(torch.FloatTensor(X_test))
    _, predicted = torch.max(test_outputs, 1)
    test_acc = (predicted == torch.LongTensor(y_test)).sum().item() / len(y_test)
    print(f"\n测试准确率: {test_acc:.2%}")
```

</details>

---

## 下一章预告

下一章我们会学习 **机器学习实战项目** —— 将所学知识应用到真实项目中。你会学到房价预测、图像分类、文本情感分析等完整项目流程。
