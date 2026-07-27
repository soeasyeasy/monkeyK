---
title: "第13章：语义分割实战"
description: "掌握图像分割、U-Net、像素级分类、实例分割"
---

# 第13章：语义分割实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是语义分割？和目标检测有什么区别？
- 语义分割的核心技术有哪些？
- U-Net 是什么？为什么它效果好？
- 如何实现一个语义分割应用？

这一章就是为了解答这些问题。语义分割是计算机视觉的重要任务，在医疗影像、自动驾驶、遥感分析等领域有广泛应用。

---

## 1 为什么需要语义分割？

### 痛点分析

想象一下自动驾驶场景：

**图像分类**：只能告诉你"这是一张道路图片"。

**目标检测**：能告诉你"车在哪里、人在哪里"，但不知道每个像素属于什么类别。

**语义分割**：对每个像素进行分类，精确知道"这个像素是车、那个像素是路、那个像素是人"。

### 语义分割 vs 目标检测

```
目标检测：
输出：边界框 + 类别
特点：矩形框，不够精确

语义分割：
输出：每个像素的类别
特点：像素级精度，可以勾勒任意形状
```

> **一句话总结**：语义分割 = 像素级分类，精确到每个像素。

---

## 2 核心原理

### 语义分割任务

打个比方：

> 语义分割像涂色游戏：给图像中的每个像素涂上对应的颜色，同一类别的像素颜色相同。

### 分割类型对比

| 类型 | 说明 | 特点 |
| --- | --- | --- |
| 语义分割 | 每个像素分类 | 不区分同类个体 |
| 实例分割 | 区分同类个体 | 每个实例单独标记 |
| 全景分割 | 语义 + 实例 | 最全面的分割 |

---

## 3 语义分割架构

### 编码器-解码器结构

```
输入图像（H×W×3）
    ↓
编码器（下采样）
    ↓
特征图（H/16×W/16×512）
    ↓
解码器（上采样）
    ↓
输出分割图（H×W×num_classes）
```

### 全卷积网络（FCN）

FCN 是第一个端到端的语义分割网络：

- 用卷积层代替全连接层
- 支持任意输入尺寸
- 使用上采样恢复空间分辨率

---

## 4 U-Net 实现

### U-Net 架构

U-Net 是医学图像分割的经典模型：

- 对称的 U 形结构
- 编码器提取特征
- 解码器恢复分辨率
- 跳跃连接保留细节

```python
import torch
import torch.nn as nn

class DoubleConv(nn.Module):
    """双卷积块"""
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.conv(x)

class UNet(nn.Module):
    def __init__(self, in_channels=3, num_classes=1):
        super().__init__()

        # 编码器
        self.enc1 = DoubleConv(in_channels, 64)
        self.enc2 = DoubleConv(64, 128)
        self.enc3 = DoubleConv(128, 256)
        self.enc4 = DoubleConv(256, 512)

        # 池化层
        self.pool = nn.MaxPool2d(2)

        # 瓶颈层
        self.bottleneck = DoubleConv(512, 1024)

        # 解码器
        self.up4 = nn.ConvTranspose2d(1024, 512, 2, stride=2)
        self.dec4 = DoubleConv(1024, 512)

        self.up3 = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.dec3 = DoubleConv(512, 256)

        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = DoubleConv(256, 128)

        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = DoubleConv(128, 64)

        # 输出层
        self.final = nn.Conv2d(64, num_classes, 1)

    def forward(self, x):
        # 编码器
        enc1 = self.enc1(x)      # [B, 64, H, W]
        enc2 = self.enc2(self.pool(enc1))  # [B, 128, H/2, W/2]
        enc3 = self.enc3(self.pool(enc2))  # [B, 256, H/4, W/4]
        enc4 = self.enc4(self.pool(enc3))  # [B, 512, H/8, W/8]

        # 瓶颈
        bottleneck = self.bottleneck(self.pool(enc4))  # [B, 1024, H/16, W/16]

        # 解码器
        dec4 = self.up4(bottleneck)  # [B, 512, H/8, W/8]
        dec4 = torch.cat([dec4, enc4], dim=1)  # 跳跃连接
        dec4 = self.dec4(dec4)

        dec3 = self.up3(dec4)  # [B, 256, H/4, W/4]
        dec3 = torch.cat([dec3, enc3], dim=1)
        dec3 = self.dec3(dec3)

        dec2 = self.up2(dec3)  # [B, 128, H/2, W/2]
        dec2 = torch.cat([dec2, enc2], dim=1)
        dec2 = self.dec2(dec2)

        dec1 = self.up1(dec2)  # [B, 64, H, W]
        dec1 = torch.cat([dec1, enc1], dim=1)
        dec1 = self.dec1(dec1)

        # 输出
        return self.final(dec1)

# 测试
model = UNet(in_channels=3, num_classes=21)
x = torch.randn(1, 3, 256, 256)
output = model(x)
print(f"输入形状: {x.shape}")
print(f"输出形状: {output.shape}")  # [1, 21, 256, 256]
```

---

## 5 分割损失函数

### 交叉熵损失

```python
import torch
import torch.nn as nn

# 多分类交叉熵损失
criterion = nn.CrossEntropyLoss()

# 预测：[B, num_classes, H, W]
predictions = torch.randn(2, 21, 256, 256)

# 真实标签：[B, H, W]，值为类别索引
targets = torch.randint(0, 21, (2, 256, 256))

# 计算损失
loss = criterion(predictions, targets)
print(f"损失: {loss.item():.4f}")
```

### Dice 损失

```python
import torch
import torch.nn as nn

class DiceLoss(nn.Module):
    def __init__(self, smooth=1.0):
        super().__init__()
        self.smooth = smooth

    def forward(self, predictions, targets):
        # predictions: [B, num_classes, H, W]
        # targets: [B, H, W]

        # 转换为 one-hot
        num_classes = predictions.shape[1]
        targets_one_hot = torch.zeros_like(predictions)
        targets_one_hot.scatter_(1, targets.unsqueeze(1), 1)

        # 计算 Dice 系数
        predictions = torch.softmax(predictions, dim=1)
        intersection = (predictions * targets_one_hot).sum(dim=(2, 3))
        union = predictions.sum(dim=(2, 3)) + targets_one_hot.sum(dim=(2, 3))

        dice = (2 * intersection + self.smooth) / (union + self.smooth)
        loss = 1 - dice.mean()

        return loss

# 测试
criterion = DiceLoss()
predictions = torch.randn(2, 21, 256, 256)
targets = torch.randint(0, 21, (2, 256, 256))
loss = criterion(predictions, targets)
print(f"Dice 损失: {loss.item():.4f}")
```

---

## 6 语义分割训练

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import os

# 1. 自定义数据集
class SegmentationDataset(Dataset):
    def __init__(self, image_dir, mask_dir, transform=None):
        self.image_dir = image_dir
        self.mask_dir = mask_dir
        self.transform = transform
        self.images = os.listdir(image_dir)

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_name = self.images[idx]
        img_path = os.path.join(self.image_dir, img_name)
        mask_path = os.path.join(self.mask_dir, img_name)

        image = Image.open(img_path).convert('RGB')
        mask = Image.open(mask_path).convert('L')  # 灰度图

        if self.transform:
            image = self.transform(image)
            mask = self.transform(mask)

        # 掩码转为类别索引
        mask = (mask > 0.5).long()

        return image, mask

# 2. 数据增强
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor()
])

# 3. 模型
model = UNet(in_channels=3, num_classes=2)

# 4. 训练配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-4)

# 5. 训练循环
num_epochs = 50
for epoch in range(num_epochs):
    model.train()
    running_loss = 0.0

    for images, masks in train_loader:
        images, masks = images.to(device), masks.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, masks)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()

    print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {running_loss/len(train_loader):.4f}")
```

---

## 7 评估指标

### 像素准确率

```python
import torch

def pixel_accuracy(predictions, targets):
    """
    计算像素准确率
    predictions: [B, num_classes, H, W]
    targets: [B, H, W]
    """
    _, predicted = torch.max(predictions, 1)
    correct = (predicted == targets).sum().item()
    total = targets.numel()
    return correct / total

# 测试
predictions = torch.randn(2, 21, 256, 256)
targets = torch.randint(0, 21, (2, 256, 256))
acc = pixel_accuracy(predictions, targets)
print(f"像素准确率: {acc:.4f}")
```

### IoU（交并比）

```python
import torch

def mean_iou(predictions, targets, num_classes):
    """
    计算平均 IoU
    predictions: [B, num_classes, H, W]
    targets: [B, H, W]
    """
    _, predicted = torch.max(predictions, 1)

    ious = []
    for cls in range(num_classes):
        pred_mask = (predicted == cls)
        target_mask = (targets == cls)

        intersection = (pred_mask & target_mask).sum().item()
        union = (pred_mask | target_mask).sum().item()

        if union == 0:
            continue

        iou = intersection / union
        ious.append(iou)

    return sum(ious) / len(ious) if ious else 0

# 测试
predictions = torch.randn(2, 21, 256, 256)
targets = torch.randint(0, 21, (2, 256, 256))
miou = mean_iou(predictions, targets, num_classes=21)
print(f"平均 IoU: {miou:.4f}")
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 语义分割 | 像素级分类 |
| U-Net | 编码器-解码器 + 跳跃连接 |
| FCN | 全卷积网络 |
| 损失函数 | CrossEntropyLoss、DiceLoss |
| 评估指标 | 像素准确率、IoU、mIoU |

---

## 9 新手常见误区

### 误区 1："语义分割和目标检测一样"

**错！** 语义分割是像素级分类，目标检测是边界框定位。

正确做法：根据任务需求选择合适的技术。

### 误区 2："U-Net 只能用于医学图像"

不是的。U-Net 的架构适用于各种分割任务。

正确做法：根据任务调整 U-Net 的深度和宽度。

### 误区 3："分割掩码必须是 RGB 图像"

实际上分割掩码通常是单通道图像，每个像素值是类别索引。

正确做法：使用灰度图作为掩码，像素值表示类别。

---

## 10 动手练习

### 练习 1：基础练习

实现一个简单的 U-Net 模型，用于二分类分割任务。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class SimpleUNet(nn.Module):
    def __init__(self):
        super().__init__()
        # 编码器
        self.enc1 = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.ReLU()
        )
        self.pool = nn.MaxPool2d(2)

        # 瓶颈
        self.bottleneck = nn.Sequential(
            nn.Conv2d(64, 128, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(128, 128, 3, padding=1),
            nn.ReLU()
        )

        # 解码器
        self.up = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec = nn.Sequential(
            nn.Conv2d(128, 64, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.ReLU()
        )

        # 输出
        self.final = nn.Conv2d(64, 2, 1)

    def forward(self, x):
        enc1 = self.enc1(x)
        pool = self.pool(enc1)
        bottleneck = self.bottleneck(pool)
        up = self.up(bottleneck)
        cat = torch.cat([up, enc1], dim=1)
        dec = self.dec(cat)
        return self.final(dec)

# 测试
model = SimpleUNet()
x = torch.randn(1, 3, 256, 256)
output = model(x)
print(f"输入形状: {x.shape}")
print(f"输出形状: {output.shape}")
```

</details>

### 练习 2：进阶练习

实现 Dice 损失函数，并测试其效果。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class DiceLoss(nn.Module):
    def __init__(self, smooth=1.0):
        super().__init__()
        self.smooth = smooth

    def forward(self, predictions, targets):
        # predictions: [B, num_classes, H, W]
        # targets: [B, H, W]

        num_classes = predictions.shape[1]
        targets_one_hot = torch.zeros_like(predictions)
        targets_one_hot.scatter_(1, targets.unsqueeze(1), 1)

        predictions = torch.softmax(predictions, dim=1)
        intersection = (predictions * targets_one_hot).sum(dim=(2, 3))
        union = predictions.sum(dim=(2, 3)) + targets_one_hot.sum(dim=(2, 3))

        dice = (2 * intersection + self.smooth) / (union + self.smooth)
        loss = 1 - dice.mean()

        return loss

# 测试
criterion = DiceLoss()
predictions = torch.randn(2, 2, 256, 256)
targets = torch.randint(0, 2, (2, 256, 256))
loss = criterion(predictions, targets)
print(f"Dice 损失: {loss.item():.4f}")

# 完美预测
predictions_perfect = torch.zeros(2, 2, 256, 256)
predictions_perfect[:, 0] = (targets == 0).float()
predictions_perfect[:, 1] = (targets == 1).float()
loss_perfect = criterion(predictions_perfect, targets)
print(f"完美预测的 Dice 损失: {loss_perfect.item():.4f}")
```

</details>

### 练习 3（挑战）：综合练习

实现完整的 U-Net 分割训练流程，包括数据加载、训练和评估。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import os

# 1. U-Net 模型
class UNet(nn.Module):
    def __init__(self, in_channels=3, num_classes=2):
        super().__init__()
        self.enc1 = self._conv_block(in_channels, 64)
        self.enc2 = self._conv_block(64, 128)
        self.pool = nn.MaxPool2d(2)
        self.bottleneck = self._conv_block(128, 256)
        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = self._conv_block(256, 128)
        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = self._conv_block(128, 64)
        self.final = nn.Conv2d(64, num_classes, 1)

    def _conv_block(self, in_ch, out_ch):
        return nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU()
        )

    def forward(self, x):
        enc1 = self.enc1(x)
        enc2 = self.enc2(self.pool(enc1))
        bottleneck = self.bottleneck(self.pool(enc2))
        dec2 = self.up2(bottleneck)
        dec2 = torch.cat([dec2, enc2], dim=1)
        dec2 = self.dec2(dec2)
        dec1 = self.up1(dec2)
        dec1 = torch.cat([dec1, enc1], dim=1)
        dec1 = self.dec1(dec1)
        return self.final(dec1)

# 2. 数据集
class SegDataset(Dataset):
    def __init__(self, img_dir, mask_dir, transform=None):
        self.img_dir = img_dir
        self.mask_dir = mask_dir
        self.transform = transform
        self.imgs = os.listdir(img_dir)

    def __len__(self):
        return len(self.imgs)

    def __getitem__(self, idx):
        img = Image.open(os.path.join(self.img_dir, self.imgs[idx])).convert('RGB')
        mask = Image.open(os.path.join(self.mask_dir, self.imgs[idx])).convert('L')

        if self.transform:
            img = self.transform(img)
            mask = self.transform(mask)

        mask = (mask > 0.5).long()
        return img, mask

# 3. 训练
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor()
])

dataset = SegDataset('./images/', './masks/', transform)
dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = UNet(in_channels=3, num_classes=2).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-4)

num_epochs = 20
for epoch in range(num_epochs):
    model.train()
    running_loss = 0.0

    for images, masks in dataloader:
        images, masks = images.to(device), masks.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, masks)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()

    print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {running_loss/len(dataloader):.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **自然语言处理实战**——如何使用 PyTorch 处理文本数据