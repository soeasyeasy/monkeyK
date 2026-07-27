---
title: "第4章：数据加载与处理"
description: "掌握 Dataset、DataLoader、数据增强、自定义数据集的使用方法"
---

# 第4章：数据加载与处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- PyTorch 如何加载数据？和 NumPy 有什么不同？
- Dataset 和 DataLoader 是什么？为什么要分开用？
- 如何处理自己的数据集？
- 数据增强是什么？为什么要做数据增强？

这一章就是为了解答这些问题。数据是深度学习的燃料，掌握数据加载是训练模型的第一步。

---

## 1 为什么需要数据加载机制？

### 痛点分析

想象一下你要开餐厅：

**没有数据加载机制时**：你需要一次性把所有食材搬进厨房，内存不够，效率低下。

**有数据加载机制后**：像有了传送带，按需取用，批量处理，还能自动加工。

### 传统数据处理的痛点

```python
import numpy as np

# 假设你有 100 万张图片
# 一次性加载所有数据
all_images = np.load('huge_dataset.npy')  # 内存爆炸！

# 手动分批
batch_size = 32
for i in range(0, len(all_images), batch_size):
    batch = all_images[i:i+batch_size]
    # 训练...
```

### PyTorch 的解决方案

```python
from torch.utils.data import Dataset, DataLoader

# 定义数据集
class MyDataset(Dataset):
    def __init__(self, data_path):
        # 只记录文件路径，不加载数据
        self.data_path = data_path
        self.file_list = [...]  # 文件列表

    def __len__(self):
        return len(self.file_list)

    def __getitem__(self, idx):
        # 按需加载单个样本
        image = load_image(self.file_list[idx])
        label = load_label(self.file_list[idx])
        return image, label

# 使用 DataLoader 批量加载
dataset = MyDataset('data/')
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

for images, labels in dataloader:
    # 每次只加载一个批次
    # 训练...
```

> **一句话总结**：PyTorch 的数据加载机制让你高效、按需地处理数据。

---

## 2 核心原理

### Dataset 和 DataLoader 的关系

打个比方：

> Dataset 像菜单，记录了所有菜品（数据）的信息；DataLoader 像服务员，根据你的需求（batch_size、shuffle）把菜品端上来。

### 数据加载流程

```
原始数据 → Dataset（索引访问）→ DataLoader（批量加载）→ 模型训练
```

---

## 3 Dataset 基础

### 内置数据集

```python
import torch
from torchvision import datasets, transforms

# MNIST 手写数字数据集
# 下载训练集
train_dataset = datasets.MNIST(
    root='./data',  # 数据存储路径
    train=True,  # 训练集
    download=True,  # 自动下载
    transform=transforms.ToTensor()  # 转换为张量
)

# 下载测试集
test_dataset = datasets.MNIST(
    root='./data',
    train=False,  # 测试集
    download=True,
    transform=transforms.ToTensor()
)

# 查看数据集信息
print(f"训练集大小: {len(train_dataset)}")  # 60000
print(f"测试集大小: {len(test_dataset)}")  # 10000

# 访问单个样本
image, label = train_dataset[0]
print(f"图像形状: {image.shape}")  # [1, 28, 28]
print(f"标签: {label}")  # 5（数字5）
```

### 自定义 Dataset

```python
import torch
from torch.utils.data import Dataset
import os
from PIL import Image

class CustomImageDataset(Dataset):
    def __init__(self, img_dir, transform=None):
        """
        初始化数据集
        :param img_dir: 图片目录路径
        :param transform: 数据增强操作
        """
        self.img_dir = img_dir
        self.transform = transform

        # 获取所有图片文件名
        self.img_names = os.listdir(img_dir)

        # 假设文件名格式：label_xxx.jpg
        self.labels = [int(name.split('_')[0]) for name in self.img_names]

    def __len__(self):
        """返回数据集大小"""
        return len(self.img_names)

    def __getitem__(self, idx):
        """获取单个样本"""
        # 构建图片路径
        img_path = os.path.join(self.img_dir, self.img_names[idx])

        # 加载图片
        image = Image.open(img_path).convert('RGB')

        # 获取标签
        label = self.labels[idx]

        # 应用数据增强
        if self.transform:
            image = self.transform(image)

        return image, label

# 使用自定义数据集
dataset = CustomImageDataset('./images/', transform=transforms.ToTensor())
print(f"数据集大小: {len(dataset)}")
```

---

## 4 DataLoader 详解

### 基础用法

```python
from torch.utils.data import DataLoader

# 创建 DataLoader
dataloader = DataLoader(
    dataset=train_dataset,  # 数据集对象
    batch_size=32,  # 每个批次大小
    shuffle=True,  # 每个 epoch 打乱数据
    num_workers=4,  # 使用 4 个子进程加载数据
    pin_memory=True,  # 数据复制到 GPU 显存
    drop_last=False  # 是否丢弃最后一个不完整的批次
)

# 遍历数据
for epoch in range(10):
    for batch_idx, (images, labels) in enumerate(dataloader):
        print(f"Epoch {epoch}, Batch {batch_idx}")
        print(f"批次图像形状: {images.shape}")  # [32, 1, 28, 28]
        print(f"批次标签形状: {labels.shape}")  # [32]

        # 训练代码...
```

### 关键参数说明

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| batch_size | 每个批次的样本数 | 1 |
| shuffle | 是否打乱数据 | False |
| num_workers | 数据加载的子进程数 | 0 |
| pin_memory | 是否锁页内存（GPU 加速） | False |
| drop_last | 是否丢弃最后不完整批次 | False |
| collate_fn | 如何合并样本成批次 | 默认 |

---

## 5 数据增强

### torchvision.transforms

```python
import torch
from torchvision import transforms
from PIL import Image

# 打开图片
image = Image.open('cat.jpg')

# 定义数据增强操作
transform = transforms.Compose([
    transforms.Resize((224, 224)),  # 调整大小
    transforms.RandomHorizontalFlip(p=0.5),  # 随机水平翻转
    transforms.RandomRotation(15),  # 随机旋转 ±15 度
    transforms.ColorJitter(brightness=0.2, contrast=0.2),  # 颜色抖动
    transforms.ToTensor(),  # 转换为张量 [0, 1]
    transforms.Normalize(mean=[0.485, 0.456, 0.406],  # 标准化
                         std=[0.229, 0.224, 0.225])
])

# 应用数据增强
augmented_image = transform(image)
print(f"增强后形状: {augmented_image.shape}")  # [3, 224, 224]
```

### 常用数据增强操作

```python
from torchvision import transforms

# 1. 几何变换
geometric_transforms = transforms.Compose([
    transforms.RandomHorizontalFlip(p=0.5),  # 水平翻转
    transforms.RandomVerticalFlip(p=0.5),  # 垂直翻转
    transforms.RandomRotation(30),  # 随机旋转
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),  # 随机平移
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),  # 随机裁剪并调整大小
])

# 2. 颜色变换
color_transforms = transforms.Compose([
    transforms.ColorJitter(
        brightness=0.2,  # 亮度
        contrast=0.2,  # 对比度
        saturation=0.2,  # 饱和度
        hue=0.1  # 色调
    ),
    transforms.RandomGrayscale(p=0.1),  # 随机灰度
])

# 3. 高级增强
advanced_transforms = transforms.Compose([
    transforms.RandomErasing(p=0.5, scale=(0.02, 0.33)),  # 随机擦除
    transforms.GaussianBlur(kernel_size=3),  # 高斯模糊
])
```

---

## 6 数据预处理

### 标准化

```python
import torch
from torchvision import transforms

# ImageNet 标准化参数
normalize = transforms.Normalize(
    mean=[0.485, 0.456, 0.406],  # RGB 均值
    std=[0.229, 0.224, 0.225]  # RGB 标准差
)

# 完整的预处理流程
preprocess = transforms.Compose([
    transforms.Resize(256),  # 调整短边到 256
    transforms.CenterCrop(224),  # 中心裁剪 224x224
    transforms.ToTensor(),  # 转换为张量
    normalize  # 标准化
])

# 应用预处理
image = preprocess(image)
```

### 自定义预处理

```python
import torch
from torchvision import transforms

class CustomTransform:
    def __call__(self, x):
        # 自定义预处理逻辑
        x = x + torch.randn_like(x) * 0.01  # 添加噪声
        x = torch.clamp(x, 0, 1)  # 裁剪到 [0, 1]
        return x

# 组合使用
transform = transforms.Compose([
    transforms.ToTensor(),
    CustomTransform()
])
```

---

## 7 数据加载优化

### 多进程加载

```python
from torch.utils.data import DataLoader

# 使用多进程加速数据加载
dataloader = DataLoader(
    dataset=train_dataset,
    batch_size=32,
    shuffle=True,
    num_workers=4,  # 使用 4 个子进程
    pin_memory=True,  # GPU 训练时启用
    persistent_workers=True  # 保持 worker 存活
)
```

### 预加载到内存

```python
import torch
from torch.utils.data import Dataset

class InMemoryDataset(Dataset):
    def __init__(self, data, labels):
        # 数据已经加载到内存
        self.data = data
        self.labels = labels

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx], self.labels[idx]

# 小数据集可以直接加载到内存
data = torch.randn(10000, 3, 32, 32)
labels = torch.randint(0, 10, (10000,))
dataset = InMemoryDataset(data, labels)
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Dataset | 数据集合，实现 __len__ 和 __getitem__ |
| DataLoader | 数据加载器，支持批量、打乱、多进程 |
| transforms | 数据增强和预处理工具 |
| 数据标准化 | 均值为 0，标准差为 1 |
| 多进程加载 | num_workers > 0 加速数据加载 |

---

## 9 新手常见误区

### 误区 1："num_workers 越大越好"

**错！** 过多的 worker 会占用 CPU 和内存，反而降低性能。

正确做法：一般设置为 CPU 核心数的一半，如 4 或 8。

### 误区 2："数据增强越多越好"

不是的。过度增强会破坏数据特征，导致模型难以学习。

正确做法：根据任务选择合适的增强操作，适度使用。

### 误区 3："忘记标准化数据"

不标准化会导致训练不稳定，收敛慢。

正确做法：使用 ImageNet 均值和标准差进行标准化。

---

## 10 动手练习

### 练习 1：基础练习

使用 torchvision 加载 CIFAR-10 数据集，并查看训练集和测试集的大小。

<details>
<summary>点击查看答案</summary>

```python
import torch
from torchvision import datasets, transforms

# 定义数据转换
transform = transforms.Compose([
    transforms.ToTensor()
])

# 加载 CIFAR-10 训练集
train_dataset = datasets.CIFAR10(
    root='./data',
    train=True,
    download=True,
    transform=transform
)

# 加载 CIFAR-10 测试集
test_dataset = datasets.CIFAR10(
    root='./data',
    train=False,
    download=True,
    transform=transform
)

# 查看数据集信息
print(f"训练集大小: {len(train_dataset)}")  # 50000
print(f"测试集大小: {len(test_dataset)}")  # 10000

# 查看单个样本
image, label = train_dataset[0]
print(f"图像形状: {image.shape}")  # [3, 32, 32]
print(f"标签: {label}")  # 0-9 之间的整数
```

</details>

### 练习 2：进阶练习

创建一个自定义 Dataset，从文件夹加载图片，并应用数据增强。

<details>
<summary>点击查看答案</summary>

```python
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import os
from PIL import Image

class ImageFolderDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.image_paths = []
        self.labels = []

        # 遍历文件夹，假设每个子文件夹是一个类别
        for label_idx, class_name in enumerate(sorted(os.listdir(root_dir))):
            class_dir = os.path.join(root_dir, class_name)
            if not os.path.isdir(class_dir):
                continue

            for img_name in os.listdir(class_dir):
                if img_name.endswith(('.jpg', '.png')):
                    self.image_paths.append(os.path.join(class_dir, img_name))
                    self.labels.append(label_idx)

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        # 加载图片
        image = Image.open(img_path).convert('RGB')

        # 应用数据增强
        if self.transform:
            image = self.transform(image)

        return image, label

# 定义数据增强
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# 创建数据集和数据加载器
dataset = ImageFolderDataset('./images/', transform=transform)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True, num_workers=4)

# 测试
print(f"数据集大小: {len(dataset)}")
for images, labels in dataloader:
    print(f"批次形状: {images.shape}")  # [32, 3, 224, 224]
    print(f"标签形状: {labels.shape}")  # [32]
    break
```

</details>

### 练习 3（挑战）：综合练习

实现一个数据加载器，支持训练集和验证集的划分，并对训练集应用数据增强，验证集只做预处理。

<details>
<summary>点击查看答案</summary>

```python
import torch
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import datasets, transforms

# 定义训练集数据增强
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# 定义验证集预处理
val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# 加载完整数据集（先用训练集转换）
full_dataset = datasets.CIFAR10(
    root='./data',
    train=True,
    download=True,
    transform=train_transform
)

# 划分训练集和验证集（80% 训练，20% 验证）
train_size = int(0.8 * len(full_dataset))
val_size = len(full_dataset) - train_size

train_dataset, val_dataset = random_split(
    full_dataset,
    [train_size, val_size]
)

# 为验证集设置不同的转换
val_dataset.dataset.transform = val_transform

# 创建数据加载器
train_loader = DataLoader(
    train_dataset,
    batch_size=32,
    shuffle=True,
    num_workers=4
)

val_loader = DataLoader(
    val_dataset,
    batch_size=32,
    shuffle=False,
    num_workers=4
)

# 测试
print(f"训练集大小: {len(train_dataset)}")  # 40000
print(f"验证集大小: {len(val_dataset)}")  # 10000

for images, labels in train_loader:
    print(f"训练批次形状: {images.shape}")
    break

for images, labels in val_loader:
    print(f"验证批次形状: {images.shape}")
    break
```

</details>

---

## 下一章预告

下一章我们会学习 **神经网络基础**——如何使用 PyTorch 构建神经网络。你会学到 nn.Module 的使用方法，以及如何定义前向传播和模型结构。