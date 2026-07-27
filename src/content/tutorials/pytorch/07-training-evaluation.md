---
title: "第7章：模型训练与评估"
description: "掌握训练循环、验证集、测试集、模型保存加载、训练可视化"
---

# 第7章：模型训练与评估

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 完整的训练流程是什么样的？
- 为什么要划分训练集、验证集、测试集？
- 如何监控训练过程，防止过拟合？
- 如何保存和加载训练好的模型？

这一章就是为了解答这些问题。掌握完整的训练流程是深度学习实战的关键。

---

## 1 为什么需要完整的训练流程？

### 痛点分析

想象一下你要准备考试：

**没有完整流程**：你只是盲目做题，不知道自己掌握得怎么样，也不知道哪里需要改进。

**有完整流程后**：你先用练习题学习（训练集），用模拟题检验（验证集），最后用真题考试（测试集）。

### 训练流程

```
训练集 → 训练模型 → 验证集 → 调整超参数
    ↑                              ↓
    └──────── 迭代优化 ────────────┘
                ↓
            测试集 → 最终评估
```

> **一句话总结**：训练集学知识，验证集调参数，测试集考真章。

---

## 2 核心原理

### 数据集划分

打个比方：

> 训练集像课堂练习，验证集像模拟考试，测试集像高考。

### 过拟合与欠拟合

| 状态 | 训练集表现 | 验证集表现 | 原因 |
| --- | --- | --- | --- |
| 欠拟合 | 差 | 差 | 模型太简单 |
| 正常 | 好 | 好 | 模型合适 |
| 过拟合 | 很好 | 差 | 模型太复杂 |

---

## 3 完整训练流程

### 数据准备

```python
import torch
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms

# 定义数据转换
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

# 加载完整训练集
full_train_dataset = datasets.MNIST(
    './data',
    train=True,
    download=True,
    transform=transform
)

# 划分训练集和验证集（80% 训练，20% 验证）
train_size = int(0.8 * len(full_train_dataset))
val_size = len(full_train_dataset) - train_size

train_dataset, val_dataset = random_split(
    full_train_dataset,
    [train_size, val_size]
)

# 加载测试集
test_dataset = datasets.MNIST(
    './data',
    train=False,
    download=True,
    transform=transform
)

# 创建数据加载器
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

print(f"训练集大小: {len(train_dataset)}")  # 48000
print(f"验证集大小: {len(val_dataset)}")  # 12000
print(f"测试集大小: {len(test_dataset)}")  # 10000
```

### 模型定义

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(28*28, 256)
        self.dropout1 = nn.Dropout(0.2)
        self.fc2 = nn.Linear(256, 128)
        self.dropout2 = nn.Dropout(0.2)
        self.fc3 = nn.Linear(128, 10)

    def forward(self, x):
        x = x.view(-1, 28*28)
        x = F.relu(self.fc1(x))
        x = self.dropout1(x)
        x = F.relu(self.fc2(x))
        x = self.dropout2(x)
        x = self.fc3(x)
        return x

model = SimpleNet()
```

### 训练函数

```python
def train_epoch(model, device, train_loader, optimizer, criterion):
    """训练一个 epoch"""
    model.train()  # 设置为训练模式
    running_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)

        # 清零梯度
        optimizer.zero_grad()

        # 前向传播
        output = model(data)
        loss = criterion(output, target)

        # 反向传播
        loss.backward()

        # 更新参数
        optimizer.step()

        # 统计
        running_loss += loss.item()
        _, predicted = output.max(1)
        total += target.size(0)
        correct += predicted.eq(target).sum().item()

    # 计算平均损失和准确率
    avg_loss = running_loss / len(train_loader)
    accuracy = 100. * correct / total

    return avg_loss, accuracy
```

### 验证函数

```python
def validate(model, device, val_loader, criterion):
    """验证模型"""
    model.eval()  # 设置为评估模式
    val_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():  # 不计算梯度
        for data, target in val_loader:
            data, target = data.to(device), target.to(device)

            # 前向传播
            output = model(data)
            loss = criterion(output, target)

            # 统计
            val_loss += loss.item()
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()

    # 计算平均损失和准确率
    avg_loss = val_loss / len(val_loader)
    accuracy = 100. * correct / total

    return avg_loss, accuracy
```

### 完整训练循环

```python
import torch
import torch.nn as nn
import torch.optim as optim

# 设备配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"使用设备: {device}")

# 模型、损失函数、优化器
model = SimpleNet().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', patience=3, factor=0.5
)

# 训练参数
num_epochs = 20
best_val_acc = 0.0
train_losses = []
val_losses = []
train_accs = []
val_accs = []

# 训练循环
for epoch in range(num_epochs):
    # 训练
    train_loss, train_acc = train_epoch(
        model, device, train_loader, optimizer, criterion
    )

    # 验证
    val_loss, val_acc = validate(model, device, val_loader, criterion)

    # 记录历史
    train_losses.append(train_loss)
    val_losses.append(val_loss)
    train_accs.append(train_acc)
    val_accs.append(val_acc)

    # 学习率调度
    scheduler.step(val_loss)

    # 打印进度
    print(f"Epoch [{epoch+1}/{num_epochs}]")
    print(f"  训练 - Loss: {train_loss:.4f}, Acc: {train_acc:.2f}%")
    print(f"  验证 - Loss: {val_loss:.4f}, Acc: {val_acc:.2f}%")
    print(f"  学习率: {optimizer.param_groups[0]['lr']:.6f}")

    # 保存最佳模型
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), 'best_model.pth')
        print(f"  ✓ 保存最佳模型 (验证准确率: {val_acc:.2f}%)")

print(f"\n训练完成！最佳验证准确率: {best_val_acc:.2f}%")
```

---

## 4 模型测试

```python
def test(model, device, test_loader):
    """测试模型"""
    model.eval()
    correct = 0
    total = 0

    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()

    accuracy = 100. * correct / total
    print(f"测试集准确率: {accuracy:.2f}%")

    return accuracy

# 加载最佳模型
model.load_state_dict(torch.load('best_model.pth'))

# 测试
test_acc = test(model, device, test_loader)
```

---

## 5 训练可视化

### 使用 Matplotlib

```python
import matplotlib.pyplot as plt

# 绘制损失曲线
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(train_losses, label='训练损失')
plt.plot(val_losses, label='验证损失')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('损失曲线')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(train_accs, label='训练准确率')
plt.plot(val_accs, label='验证准确率')
plt.xlabel('Epoch')
plt.ylabel('Accuracy (%)')
plt.title('准确率曲线')
plt.legend()

plt.tight_layout()
plt.savefig('training_curves.png')
plt.show()
```

### 使用 TensorBoard

```python
from torch.utils.tensorboard import SummaryWriter

# 创建 SummaryWriter
writer = SummaryWriter('runs/experiment_1')

# 训练循环中记录
for epoch in range(num_epochs):
    train_loss, train_acc = train_epoch(...)
    val_loss, val_acc = validate(...)

    # 记录标量
    writer.add_scalar('Loss/train', train_loss, epoch)
    writer.add_scalar('Loss/val', val_loss, epoch)
    writer.add_scalar('Accuracy/train', train_acc, epoch)
    writer.add_scalar('Accuracy/val', val_acc, epoch)

# 关闭 writer
writer.close()

# 启动 TensorBoard：tensorboard --logdir=runs
```

---

## 6 模型保存与加载

### 保存检查点

```python
# 保存完整检查点（包含更多信息）
checkpoint = {
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'scheduler_state_dict': scheduler.state_dict(),
    'best_val_acc': best_val_acc,
    'train_losses': train_losses,
    'val_losses': val_losses,
}

torch.save(checkpoint, 'checkpoint.pth')
```

### 加载检查点

```python
# 加载检查点
checkpoint = torch.load('checkpoint.pth')

# 恢复模型
model.load_state_dict(checkpoint['model_state_dict'])

# 恢复优化器
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])

# 恢复调度器
scheduler.load_state_dict(checkpoint['scheduler_state_dict'])

# 恢复其他信息
start_epoch = checkpoint['epoch'] + 1
best_val_acc = checkpoint['best_val_acc']
train_losses = checkpoint['train_losses']
val_losses = checkpoint['val_losses']

print(f"从 epoch {start_epoch} 继续训练")
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 数据集划分 | 训练集、验证集、测试集 |
| 训练模式 | model.train() 启用 Dropout/BatchNorm |
| 评估模式 | model.eval() 关闭 Dropout/BatchNorm |
| 梯度清零 | optimizer.zero_grad() |
| 模型保存 | state_dict() 保存参数 |
| 训练可视化 | Matplotlib 或 TensorBoard |

---

## 8 新手常见误区

### 误区 1："验证时使用 model.train()"

**错！** 验证时应该用 model.eval()，否则 Dropout 和 BatchNorm 行为不一致。

正确做法：训练用 train()，验证和测试用 eval()。

### 误区 2："验证时计算梯度"

不是的。验证时不需要梯度，计算会浪费内存和时间。

正确做法：验证时使用 `with torch.no_grad():` 包裹代码。

### 误区 3："只保存最终模型"

实际上应该保存验证集上表现最好的模型。

正确做法：监控验证集性能，保存最佳模型。

---

## 9 动手练习

### 练习 1：基础练习

实现一个完整的训练循环，包含训练和验证步骤。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# 1. 准备数据
X_train = torch.randn(800, 20)
y_train = torch.randint(0, 5, (800,))
X_val = torch.randn(200, 20)
y_val = torch.randint(0, 5, (200,))

train_dataset = TensorDataset(X_train, y_train)
val_dataset = TensorDataset(X_val, y_val)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# 2. 定义模型
model = nn.Sequential(
    nn.Linear(20, 64),
    nn.ReLU(),
    nn.Linear(64, 5)
)

# 3. 定义损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 4. 训练循环
num_epochs = 20
for epoch in range(num_epochs):
    # 训练
    model.train()
    train_loss = 0.0
    for batch_X, batch_y in train_loader:
        optimizer.zero_grad()
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()

    # 验证
    model.eval()
    val_loss = 0.0
    correct = 0
    total = 0
    with torch.no_grad():
        for batch_X, batch_y in val_loader:
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            val_loss += loss.item()
            _, predicted = outputs.max(1)
            total += batch_y.size(0)
            correct += predicted.eq(batch_y).sum().item()

    print(f"Epoch [{epoch+1}/{num_epochs}]")
    print(f"  训练损失: {train_loss/len(train_loader):.4f}")
    print(f"  验证损失: {val_loss/len(val_loader):.4f}, 准确率: {100.*correct/total:.2f}%")
```

</details>

### 练习 2：进阶练习

实现模型保存和加载功能，保存最佳模型并在测试集上评估。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# 准备数据
X_train = torch.randn(800, 20)
y_train = torch.randint(0, 5, (800,))
X_test = torch.randn(200, 20)
y_test = torch.randint(0, 5, (200,))

train_dataset = TensorDataset(X_train, y_train)
test_dataset = TensorDataset(X_test, y_test)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

# 定义模型
model = nn.Sequential(
    nn.Linear(20, 64),
    nn.ReLU(),
    nn.Dropout(0.2),
    nn.Linear(64, 5)
)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 训练
num_epochs = 30
best_acc = 0.0

for epoch in range(num_epochs):
    model.train()
    for batch_X, batch_y in train_loader:
        optimizer.zero_grad()
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()

    # 测试
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for batch_X, batch_y in test_loader:
            outputs = model(batch_X)
            _, predicted = outputs.max(1)
            total += batch_y.size(0)
            correct += predicted.eq(batch_y).sum().item()

    acc = 100. * correct / total

    # 保存最佳模型
    if acc > best_acc:
        best_acc = acc
        torch.save(model.state_dict(), 'best_model.pth')
        print(f"Epoch {epoch+1}: 保存最佳模型，准确率 {acc:.2f}%")

# 加载最佳模型并测试
model.load_state_dict(torch.load('best_model.pth'))
model.eval()
correct = 0
total = 0
with torch.no_grad():
    for batch_X, batch_y in test_loader:
        outputs = model(batch_X)
        _, predicted = outputs.max(1)
        total += batch_y.size(0)
        correct += predicted.eq(batch_y).sum().item()

print(f"最佳模型测试准确率: {100.*correct/total:.2f}%")
```

</details>

### 练习 3（挑战）：综合练习

实现完整的训练流程，包含训练、验证、测试、模型保存、学习率调度和训练可视化。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import matplotlib.pyplot as plt

# 1. 准备数据
X_train = torch.randn(800, 20)
y_train = torch.randint(0, 5, (800,))
X_val = torch.randn(200, 20)
y_val = torch.randint(0, 5, (200,))

train_dataset = TensorDataset(X_train, y_train)
val_dataset = TensorDataset(X_val, y_val)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# 2. 定义模型
class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(20, 64)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
        self.fc2 = nn.Linear(64, 5)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

model = Net()

# 3. 定义损失函数、优化器、调度器
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=5, factor=0.5)

# 4. 训练
num_epochs = 50
best_val_acc = 0.0
train_losses = []
val_losses = []
val_accs = []

for epoch in range(num_epochs):
    # 训练
    model.train()
    train_loss = 0.0
    for batch_X, batch_y in train_loader:
        optimizer.zero_grad()
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()

    train_loss /= len(train_loader)
    train_losses.append(train_loss)

    # 验证
    model.eval()
    val_loss = 0.0
    correct = 0
    total = 0
    with torch.no_grad():
        for batch_X, batch_y in val_loader:
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            val_loss += loss.item()
            _, predicted = outputs.max(1)
            total += batch_y.size(0)
            correct += predicted.eq(batch_y).sum().item()

    val_loss /= len(val_loader)
    val_acc = 100. * correct / total
    val_losses.append(val_loss)
    val_accs.append(val_acc)

    # 学习率调度
    scheduler.step(val_loss)

    # 保存最佳模型
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), 'best_model.pth')

    if (epoch + 1) % 10 == 0:
        print(f"Epoch [{epoch+1}/{num_epochs}], Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")

# 5. 可视化
plt.figure(figsize=(10, 5))
plt.subplot(1, 2, 1)
plt.plot(train_losses, label='训练损失')
plt.plot(val_losses, label='验证损失')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('损失曲线')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(val_accs, label='验证准确率')
plt.xlabel('Epoch')
plt.ylabel('Accuracy (%)')
plt.title('准确率曲线')
plt.legend()

plt.tight_layout()
plt.savefig('training_curves.png')
plt.show()

print(f"最佳验证准确率: {best_val_acc:.2f}%")
```

</details>

---

## 下一章预告

下一章我们会学习 **卷积神经网络（CNN）**——计算机视觉的核心架构。你会学到卷积层、池化层的原理，以及如何构建 CNN 进行图像分类。