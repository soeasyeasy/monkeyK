---
title: "第11章：迁移学习与模型微调"
description: "掌握预训练模型、特征提取、微调策略、实战应用"
---

# 第11章：迁移学习与模型微调

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是迁移学习？为什么要用预训练模型？
- 特征提取和微调有什么区别？
- 如何加载和使用预训练模型？
- 如何针对自己的任务微调模型？

这一章就是为了解答这些问题。迁移学习能让你用很少的数据和时间，快速构建强大的深度学习应用。

---

## 1 为什么需要迁移学习？

### 痛点分析

想象一下你要训练一个图像分类模型：

**从头训练**：需要大量标注数据（几十万张），训练时间长（几天），计算资源多。

**迁移学习**：使用在 ImageNet 上预训练的模型，只需少量数据（几千张），训练时间短（几小时）。

### 迁移学习的优势

```
从头训练：
- 数据需求：100,000+ 张
- 训练时间：几天
- GPU 需求：多张高端 GPU

迁移学习：
- 数据需求：1,000-10,000 张
- 训练时间：几小时
- GPU 需求：单张普通 GPU
```

> **一句话总结**：迁移学习站在巨人的肩膀上，事半功倍。

---

## 2 核心原理

### 迁移学习的思路

打个比方：

> 迁移学习像学开车：你已经会骑自行车（预训练模型），学开车时只需要学习方向盘和油门（微调），不用从零学平衡。

### 两种迁移学习方式

| 方式 | 说明 | 适用场景 |
| --- | --- | --- |
| 特征提取 | 冻结预训练模型，只训练分类器 | 数据少，任务相似 |
| 微调 | 解冻部分或全部层，继续训练 | 数据多，任务差异大 |

---

## 3 使用预训练模型

### 加载 torchvision 预训练模型

```python
import torch
import torch.nn as nn
from torchvision import models

# 方式1：加载预训练的 ResNet18
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 方式2：加载预训练的 VGG16
model = models.vgg16(weights=models.VGG16_Weights.DEFAULT)

# 方式3：加载预训练的 EfficientNet
model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)

print(model)
```

### 查看模型结构

```python
import torch
from torchvision import models

model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 查看模型结构
print(model)

# 查看参数数量
total_params = sum(p.numel() for p in model.parameters())
print(f"总参数数量: {total_params:,}")

# 查看可训练参数
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"可训练参数: {trainable_params:,}")
```

---

## 4 特征提取

### 冻结所有层，只训练分类器

```python
import torch
import torch.nn as nn
from torchvision import models

# 加载预训练模型
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结所有参数
for param in model.parameters():
    param.requires_grad = False

# 替换最后的分类层（1000 类 -> 10 类）
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 10)

# 现在只有 fc 层的参数需要训练
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"可训练参数: {trainable_params:,}")  # 只有 fc 层的参数

# 查看可训练的层
for name, param in model.named_parameters():
    if param.requires_grad:
        print(f"可训练层: {name}, 形状: {param.shape}")
```

### 训练特征提取器

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, datasets, transforms
from torch.utils.data import DataLoader

# 1. 数据准备
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

train_dataset = datasets.CIFAR10('./data', train=True, download=True, transform=transform)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# 2. 加载预训练模型
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结所有层
for param in model.parameters():
    param.requires_grad = False

# 替换分类层
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 10)

# 3. 配置训练
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.fc.parameters(), lr=0.001)  # 只优化 fc 层

# 4. 训练
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

    print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {running_loss/len(train_loader):.4f}, Acc: {100.*correct/total:.2f}%")
```

---

## 5 模型微调

### 微调所有层

```python
import torch
import torch.nn as nn
from torchvision import models

# 加载预训练模型
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 替换分类层
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 10)

# 所有层都可以训练（包括预训练层）
# 使用较小的学习率微调预训练层
optimizer = optim.Adam([
    {'params': model.conv1.parameters(), 'lr': 1e-5},
    {'params': model.layer1.parameters(), 'lr': 1e-5},
    {'params': model.layer2.parameters(), 'lr': 1e-5},
    {'params': model.layer3.parameters(), 'lr': 1e-5},
    {'params': model.layer4.parameters(), 'lr': 1e-5},
    {'params': model.fc.parameters(), 'lr': 1e-3}  # 新层用较大学习率
], lr=1e-3)
```

### 微调部分层

```python
import torch
import torch.nn as nn
from torchvision import models

# 加载预训练模型
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结前面的层
for name, param in model.named_parameters():
    if not name.startswith('fc'):
        param.requires_grad = False

# 替换分类层
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 10)

# 只训练 fc 层和 layer4
optimizer = optim.Adam([
    {'params': model.layer4.parameters(), 'lr': 1e-5},
    {'params': model.fc.parameters(), 'lr': 1e-3}
])
```

### 完整微调训练

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, datasets, transforms
from torch.utils.data import DataLoader

# 1. 数据准备
transform_train = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

transform_val = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

train_dataset = datasets.CIFAR10('./data', train=True, download=True, transform=transform_train)
val_dataset = datasets.CIFAR10('./data', train=False, download=True, transform=transform_val)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# 2. 加载预训练模型
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结前面的层
for name, param in model.named_parameters():
    if not name.startswith('fc') and not name.startswith('layer4'):
        param.requires_grad = False

# 替换分类层
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 10)

# 3. 配置训练
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam([
    {'params': model.layer4.parameters(), 'lr': 1e-5},
    {'params': model.fc.parameters(), 'lr': 1e-3}
])
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

# 4. 训练
num_epochs = 20
best_val_acc = 0.0

for epoch in range(num_epochs):
    # 训练
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

    # 验证
    model.eval()
    val_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            val_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

    val_acc = 100. * correct / total

    scheduler.step()

    print(f"Epoch [{epoch+1}/{num_epochs}]")
    print(f"  训练 - Loss: {running_loss/len(train_loader):.4f}, Acc: {train_acc:.2f}%")
    print(f"  验证 - Loss: {val_loss/len(val_loader):.4f}, Acc: {val_acc:.2f}%")

    # 保存最佳模型
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), 'best_model.pth')
        print(f"  ✓ 保存最佳模型")

print(f"最佳验证准确率: {best_val_acc:.2f}%")
```

---

## 6 自定义数据集微调

### 准备自定义数据集

```python
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import os

class CustomDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.images = []
        self.labels = []

        # 假设每个子文件夹是一个类别
        for label_idx, class_name in enumerate(sorted(os.listdir(root_dir))):
            class_dir = os.path.join(root_dir, class_name)
            if not os.path.isdir(class_dir):
                continue

            for img_name in os.listdir(class_dir):
                if img_name.endswith(('.jpg', '.png', '.jpeg')):
                    self.images.append(os.path.join(class_dir, img_name))
                    self.labels.append(label_idx)

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_path = self.images[idx]
        label = self.labels[idx]

        image = Image.open(img_path).convert('RGB')

        if self.transform:
            image = self.transform(image)

        return image, label

# 使用
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

dataset = CustomDataset('./my_dataset/', transform=transform)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 迁移学习 | 利用预训练模型解决新任务 |
| 特征提取 | 冻结预训练模型，只训练分类器 |
| 微调 | 解冻部分或全部层，继续训练 |
| 预训练模型 | ResNet/VGG/EfficientNet 等 |
| 学习率策略 | 预训练层用小学习率，新层用大学习率 |

---

## 8 新手常见误区

### 误区 1："迁移学习不需要调整数据预处理"

**错！** 预训练模型有特定的输入要求（如 ImageNet 的均值和标准差）。

正确做法：使用与预训练模型相同的预处理方式。

### 误区 2："微调时所有层用相同学习率"

不是的。预训练层应该用较小的学习率，新层用较大的学习率。

正确做法：分层设置不同的学习率。

### 误区 3："数据越多，微调效果越好"

实际上数据量适中时，特征提取可能就足够了。

正确做法：根据数据量选择特征提取或微调。

---

## 9 动手练习

### 练习 1：基础练习

加载预训练的 ResNet18，替换分类层为 5 类分类器，并冻结所有预训练层。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
from torchvision import models

# 加载预训练模型
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结所有层
for param in model.parameters():
    param.requires_grad = False

# 替换分类层
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 5)

# 验证
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"可训练参数: {trainable_params:,}")

for name, param in model.named_parameters():
    if param.requires_grad:
        print(f"可训练层: {name}, 形状: {param.shape}")
```

</details>

### 练习 2：进阶练习

实现特征提取方式的迁移学习，在 CIFAR-10 上训练。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, datasets, transforms
from torch.utils.data import DataLoader

# 1. 数据准备
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

train_dataset = datasets.CIFAR10('./data', train=True, download=True, transform=transform)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# 2. 加载预训练模型
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结所有层
for param in model.parameters():
    param.requires_grad = False

# 替换分类层
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 10)

# 3. 配置训练
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.fc.parameters(), lr=0.001)

# 4. 训练
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

    print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {running_loss/len(train_loader):.4f}, Acc: {100.*correct/total:.2f}%")
```

</details>

### 练习 3（挑战）：综合练习

实现完整的微调流程，包括数据准备、模型加载、分层学习率设置和训练。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, datasets, transforms
from torch.utils.data import DataLoader

# 1. 数据准备
transform_train = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

transform_val = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

train_dataset = datasets.CIFAR10('./data', train=True, download=True, transform=transform_train)
val_dataset = datasets.CIFAR10('./data', train=False, download=True, transform=transform_val)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# 2. 加载预训练模型
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结前面的层
for name, param in model.named_parameters():
    if not name.startswith('fc') and not name.startswith('layer4'):
        param.requires_grad = False

# 替换分类层
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 10)

# 3. 配置训练
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam([
    {'params': model.layer4.parameters(), 'lr': 1e-5},
    {'params': model.fc.parameters(), 'lr': 1e-3}
])
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

# 4. 训练
num_epochs = 20
best_val_acc = 0.0

for epoch in range(num_epochs):
    # 训练
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

    # 验证
    model.eval()
    val_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            val_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

    val_acc = 100. * correct / total

    scheduler.step()

    print(f"Epoch [{epoch+1}/{num_epochs}]")
    print(f"  训练 - Loss: {running_loss/len(train_loader):.4f}, Acc: {train_acc:.2f}%")
    print(f"  验证 - Loss: {val_loss/len(val_loader):.4f}, Acc: {val_acc:.2f}%")

    # 保存最佳模型
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), 'best_model.pth')
        print(f"  ✓ 保存最佳模型")

print(f"最佳验证准确率: {best_val_acc:.2f}%")
```

</details>

---

## 下一章预告

下一章我们会学习 **目标检测实战**——如何在图像中定位和识别多个物体。你会学到目标检测的原理，以及如何使用预训练模型进行目标检测。