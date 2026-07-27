# 第 12 章：计算机视觉实战

## 本章导读

学完了 CNN 基础和训练技巧，本章将实战计算机视觉的核心任务：

1. 图像分类怎么做？从数据加载到完整训练流程是怎样的？
2. 目标检测和图像分割有什么区别？各适用于什么场景？
3. 迁移学习是什么？为什么要用它？怎么用预训练模型？
4. 数据增强在计算机视觉中有哪些实用技巧？
5. 如何评估一个视觉模型的好坏？

## 技术必要性分析

计算机视觉是深度学习最成功的应用领域之一。从手机的人脸解锁、自动驾驶的障碍物识别，到医学影像的病灶检测，背后都是计算机视觉技术。

但直接从头训练一个 CNN 往往效果不好：

- **数据不够**：训练一个 ResNet 需要上百万张图片，自己的数据集可能只有几千张
- **训练太慢**：从头训练需要几天甚至几周
- **效果不稳定**：容易过拟合或欠拟合

迁移学习就是解决这些问题的"利器"——站在巨人的肩膀上，用别人训练好的模型，稍加调整就能用在自己的任务上。

## 核心原理讲解

### 1. 图像分类（Image Classification）

**任务**：给一张图片，判断它属于哪个类别。

**流程**：

```
输入图像 -> CNN 特征提取 -> 全连接分类头 -> 类别概率
```

**经典数据集**：

| 数据集 | 类别数 | 图像数 | 用途 |
|--------|--------|--------|------|
| MNIST | 10 | 70k | 手写数字，入门级 |
| CIFAR-10 | 10 | 60k | 彩色小图，基础练习 |
| ImageNet | 1000 | 1400 万 | 大规模视觉识别，基准测试 |

### 2. 目标检测（Object Detection）

**任务**：找出图片中所有目标的位置和类别。

**输出**：边界框（Bounding Box）+ 类别标签 + 置信度

**经典算法**：

| 算法 | 类型 | 速度 | 精度 | 特点 |
|------|------|------|------|------|
| YOLO | 单阶段 | 快 | 中 | 实时检测，适合视频流 |
| SSD | 单阶段 | 快 | 中 | 多尺度特征图检测 |
| Faster R-CNN | 两阶段 | 慢 | 高 | 精度高，适合离线分析 |

### 3. 图像分割（Image Segmentation）

**任务**：对图像中每个像素进行分类。

**类型**：

| 类型 | 说明 | 应用 |
|------|------|------|
| 语义分割 | 每个像素分到某个类别 | 自动驾驶（道路、车辆、行人） |
| 实例分割 | 区分同类别的不同个体 | 机器人抓取（区分多个物体） |
| 全景分割 | 语义 + 实例 | 场景理解 |

**经典模型**：U-Net（医学图像）、DeepLab（语义分割）、Mask R-CNN（实例分割）

### 4. 迁移学习（Transfer Learning）

**核心思想**：把在大数据集（如 ImageNet）上训练好的模型，迁移到小数据集的任务上。

**为什么有效**：

- CNN 的浅层学到的特征（边缘、纹理、颜色）是通用的
- 深层学到的特征（形状、结构）更具任务特异性
- 迁移学习复用浅层特征，只需微调深层

**两种常用方式**：

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| 特征提取 | 冻结预训练模型，只训练分类头 | 数据少、任务相似 |
| 微调 | 解冻部分或全部层，一起训练 | 数据多、任务差异大 |

## 基础用法

### 图像分类完整流程

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

# ===== 第一步：数据预处理与增强 =====

# 训练集变换：包含数据增强
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),           # 随机裁剪并缩放到 224x224
    transforms.RandomHorizontalFlip(),           # 50% 概率水平翻转
    transforms.ColorJitter(brightness=0.2, contrast=0.2),  # 随机调整亮度和对比度
    transforms.ToTensor(),                       # 转为张量 [0, 1]
    transforms.Normalize(                        # 标准化
        mean=[0.485, 0.456, 0.406],              # ImageNet 均值
        std=[0.229, 0.224, 0.225]                # ImageNet 标准差
    ),
])

# 测试集变换：不做增强
test_transform = transforms.Compose([
    transforms.Resize(256),                      # 先缩放到 256
    transforms.CenterCrop(224),                  # 中心裁剪到 224
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

# 加载 CIFAR-10 数据集（示例）
# 实际项目中替换为自己的数据集路径
train_dataset = datasets.CIFAR10(
    root='./data',
    train=True,
    transform=train_transform,
    download=True
)

test_dataset = datasets.CIFAR10(
    root='./data',
    train=False,
    transform=test_transform,
    download=True
)

# 数据加载器
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=2)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=2)

print(f"训练集大小: {len(train_dataset)}")
print(f"测试集大小: {len(test_dataset)}")

# ===== 第二步：构建模型 =====

# 自定义 CNN（适合 CIFAR-10 这样的小图）
class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),      # 3 -> 32 通道
            nn.BatchNorm2d(32),                  # 批归一化
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                  # 32x32 -> 16x16

            nn.Conv2d(32, 64, 3, padding=1),     # 32 -> 64 通道
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                  # 16x16 -> 8x8

            nn.Conv2d(64, 128, 3, padding=1),    # 64 -> 128 通道
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                  # 8x8 -> 4x4
        )

        self.classifier = nn.Sequential(
            nn.Flatten(),                        # 展平：128*4*4 = 2048
            nn.Linear(2048, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

model = SimpleCNN(num_classes=10)
print(model)

# ===== 第三步：配置训练参数 =====

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

criterion = nn.CrossEntropyLoss()                # 交叉熵损失
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)  # Adam 优化器
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=50)  # 余弦退火

# ===== 第四步：训练循环 =====

num_epochs = 50
best_acc = 0.0

for epoch in range(num_epochs):
    # 训练阶段
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()                    # 清空梯度
        outputs = model(images)                  # 前向传播
        loss = criterion(outputs, labels)        # 计算损失
        loss.backward()                          # 反向传播
        optimizer.step()                         # 更新参数

        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    train_acc = 100. * correct / total

    # 验证阶段
    model.eval()
    val_correct = 0
    val_total = 0

    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = outputs.max(1)
            val_total += labels.size(0)
            val_correct += predicted.eq(labels).sum().item()

    val_acc = 100. * val_correct / val_total

    scheduler.step()

    print(f"Epoch [{epoch+1}/{num_epochs}] "
          f"Loss: {running_loss/len(train_loader):.4f} "
          f"Train Acc: {train_acc:.2f}% "
          f"Val Acc: {val_acc:.2f}%")

    # 保存最佳模型
    if val_acc > best_acc:
        best_acc = val_acc
        torch.save(model.state_dict(), 'best_model.pth')
        print(f"保存最佳模型，验证准确率: {val_acc:.2f}%")

print(f"训练完成，最佳验证准确率: {best_acc:.2f}%")
```

### 迁移学习：使用预训练模型

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms
from torch.utils.data import DataLoader

# ===== 方式一：特征提取（冻结预训练模型） =====

# 加载预训练的 ResNet-18
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结所有参数
for param in model.parameters():
    param.requires_grad = False                  # 不计算梯度，不更新参数

# 替换分类头（原模型是 1000 类，改为自己的类别数）
num_features = model.fc.in_features              # 获取原全连接层输入特征数
model.fc = nn.Linear(num_features, 10)           # 替换为 10 类分类头

print(f"模型参数量: {sum(p.numel() for p in model.parameters()):,}")
print(f"可训练参数量: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

# 只优化分类头的参数
optimizer = optim.Adam(model.fc.parameters(), lr=0.001)

# ===== 方式二：微调（解冻部分层） =====

model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# 冻结前面的层（特征提取部分）
for name, param in model.named_parameters():
    if 'layer4' not in name and 'fc' not in name:  # 只解冻 layer4 和 fc
        param.requires_grad = False

# 替换分类头
model.fc = nn.Linear(model.fc.in_features, 10)

# 优化解冻的参数
optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.0001)

print(f"可训练参数量: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

# ===== 方式三：完全微调（解冻所有层） =====

model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
model.fc = nn.Linear(model.fc.in_features, 10)

# 所有参数都参与训练，但用较小的学习率
optimizer = optim.Adam(model.parameters(), lr=0.0001, weight_decay=1e-4)

# 训练循环（与之前相同）
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)
criterion = nn.CrossEntropyLoss()

# 假设已有 train_loader 和 val_loader
for epoch in range(20):
    model.train()
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

    # 验证...
    print(f"Epoch {epoch+1} 完成")
```

### 使用 torchvision 的预训练模型

```python
from torchvision import models

# 查看所有可用的预训练模型
# print(models.list_models())  # PyTorch 1.12+

# 常用模型对比
model_configs = {
    'ResNet-18': models.resnet18(weights=models.ResNet18_Weights.DEFAULT),
    'ResNet-50': models.resnet50(weights=models.ResNet50_Weights.DEFAULT),
    'VGG-16': models.vgg16(weights=models.VGG16_Weights.DEFAULT),
    'MobileNet V2': models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT),
    'EfficientNet B0': models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT),
}

for name, model in model_configs.items():
    total_params = sum(p.numel() for p in model.parameters())
    print(f"{name:20s} 参数量: {total_params / 1e6:.2f}M")

# 模型选择建议：
# | 模型              | 参数量 | 速度 | 精度 | 适用场景          |
# |------------------|--------|------|------|------------------|
# | ResNet-18        | 11.7M  | 快   | 中   | 移动端、嵌入式     |
# | ResNet-50        | 25.6M  | 中   | 高   | 通用场景           |
# | VGG-16           | 138M   | 慢   | 中   | 不推荐（太大）      |
# | MobileNet V2     | 3.4M   | 极快 | 中   | 手机端、实时应用    |
# | EfficientNet B0  | 5.3M   | 快   | 高   | 精度和速度平衡     |
```

### 目标检测基础（使用预训练模型）

```python
import torch
from torchvision import transforms
from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2, FasterRCNN_ResNet50_FPN_V2_Weights
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# 加载预训练的 Faster R-CNN
weights = FasterRCNN_ResNet50_FPN_V2_Weights.DEFAULT
model = fasterrcnn_resnet50_fpn_v2(weights=weights, box_score_thresh=0.5)
model.eval()

# 图像预处理
transform = weights.transforms()

# 假设有一张图片
# image = Image.open('example.jpg').convert('RGB')
# image_tensor = transform(image)

# 模拟输入（实际使用时用真实图片）
image_tensor = torch.rand(3, 800, 800)

# 推理
with torch.no_grad():
    prediction = model([image_tensor])

# 解析结果
pred = prediction[0]
boxes = pred['boxes'].cpu().numpy()              # 边界框坐标 [x1, y1, x2, y2]
labels = pred['labels'].cpu().numpy()            # 类别标签
scores = pred['scores'].cpu().numpy()            # 置信度分数

print(f"检测到 {len(boxes)} 个目标")

# 显示检测结果（假设有图片）
# fig, ax = plt.subplots(1)
# ax.imshow(image)
#
# for box, label, score in zip(boxes, labels, scores):
#     if score > 0.5:
#         x1, y1, x2, y2 = box
#         rect = patches.Rectangle((x1, y1), x2-x1, y2-y1, linewidth=2, edgecolor='r', facecolor='none')
#         ax.add_patch(rect)
#         ax.text(x1, y1-5, f'{label}: {score:.2f}', bbox=dict(facecolor='yellow', alpha=0.5))
#
# plt.show()

# COCO 数据集类别（90 类）
COCO_CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
    'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
    'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
    'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
    # ... 更多类别
]

# 显示前 5 个检测结果
for i in range(min(5, len(boxes))):
    label_name = COCO_CLASSES[labels[i] - 1] if labels[i] <= len(COCO_CLASSES) else f'class_{labels[i]}'
    print(f"目标 {i+1}: {label_name}, 置信度: {scores[i]:.3f}, 位置: {boxes[i]}")
```

### 图像分割基础（语义分割）

```python
import torch
from torchvision.models.segmentation import fcn_resnet50, FCN_ResNet50_Weights
from torchvision import transforms
from PIL import Image
import numpy as np

# 加载预训练的 FCN（Fully Convolutional Network）
weights = FCN_ResNet50_Weights.DEFAULT
model = fcn_resnet50(weights=weights)
model.eval()

# 预处理
preprocess = weights.transforms()

# 模拟输入图像
# image = Image.open('street.jpg').convert('RGB')
# input_tensor = preprocess(image)
input_tensor = torch.rand(3, 520, 520)

# 推理
with torch.no_grad():
    output = model(input_tensor.unsqueeze(0))['out']

# output shape: [1, 21, H, W]，21 是 PASCAL VOC 的类别数
print(f"输出形状: {output.shape}")

# 获取每个像素的类别预测
predictions = output.argmax(dim=1).squeeze().cpu().numpy()
print(f"预测图形状: {predictions.shape}")
print(f"唯一类别数: {len(np.unique(predictions))}")

# PASCAL VOC 类别（21 类）
VOC_CLASSES = [
    'background', 'aeroplane', 'bicycle', 'bird', 'boat', 'bottle',
    'bus', 'car', 'cat', 'chair', 'cow', 'diningtable', 'dog',
    'horse', 'motorbike', 'person', 'pottedplant', 'sheep', 'sofa',
    'train', 'tvmonitor'
]

# 统计每个类别的像素数
unique, counts = np.unique(predictions, return_counts=True)
for u, c in zip(unique, counts):
    print(f"{VOC_CLASSES[u]:15s}: {c:8d} 像素 ({100*c/predictions.size:.2f}%)")

# 可视化分割结果（需要原图）
# 创建颜色映射
# color_map = np.random.randint(0, 256, size=(21, 3), dtype=np.uint8)
# color_map[0] = [0, 0, 0]  # 背景为黑色
#
# # 给每个类别分配颜色
# seg_image = color_map[predictions]
#
# fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
# ax1.imshow(image)
# ax1.set_title('原图')
# ax1.axis('off')
#
# ax2.imshow(seg_image)
# ax2.set_title('分割结果')
# ax2.axis('off')
#
# plt.show()
```

## 进阶用法

### 自定义数据集加载

```python
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import os

class CustomImageDataset(Dataset):
    """自定义图像数据集"""

    def __init__(self, root_dir, transform=None):
        """
        Args:
            root_dir: 数据集根目录，结构如下：
                root_dir/
                    class_a/
                        img1.jpg
                        img2.jpg
                    class_b/
                        img3.jpg
                        img4.jpg
            transform: 图像变换
        """
        self.root_dir = root_dir
        self.transform = transform
        self.classes = sorted(os.listdir(root_dir))          # 获取所有类别名
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}  # 类别到索引的映射

        # 构建样本列表
        self.samples = []
        for class_name in self.classes:
            class_dir = os.path.join(root_dir, class_name)
            for img_name in os.listdir(class_dir):
                if img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                    img_path = os.path.join(class_dir, img_name)
                    self.samples.append((img_path, self.class_to_idx[class_name]))

        print(f"加载 {len(self.samples)} 张图像，{len(self.classes)} 个类别")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]

        # 读取图像
        image = Image.open(img_path).convert('RGB')

        # 应用变换
        if self.transform:
            image = self.transform(image)

        return image, label

# 使用示例
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

train_dataset = CustomImageDataset(root_dir='./data/train', transform=train_transform)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=2)

# 查看一个批次
images, labels = next(iter(train_loader))
print(f"图像批次形状: {images.shape}")     # [32, 3, 224, 224]
print(f"标签批次形状: {labels.shape}")     # [32]
print(f"类别: {train_dataset.classes}")
```

### 学习率分层设置（迁移学习常用）

```python
import torch
import torch.optim as optim
from torchvision import models

# 加载预训练模型
model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
model.fc = torch.nn.Linear(model.fc.in_features, 10)

# 为不同层设置不同的学习率
# 预训练层用较小的学习率（保留已学知识）
# 新初始化的层用较大的学习率（快速收敛）

# 方法一：手动分组
backbone_params = []
head_params = []

for name, param in model.named_parameters():
    if 'fc' in name:                           # 分类头
        head_params.append(param)
    else:                                      # 骨干网络
        backbone_params.append(param)

optimizer = optim.Adam([
    {'params': backbone_params, 'lr': 1e-5},   # 骨干网络：小学习率
    {'params': head_params, 'lr': 1e-3},       # 分类头：大学习率
], weight_decay=1e-4)

print(f"骨干网络参数量: {sum(p.numel() for p in backbone_params):,}")
print(f"分类头参数量: {sum(p.numel() for p in head_params):,}")

# 方法二：使用 lambda 函数
def get_layer_lr(layer_name):
    """根据层名返回学习率"""
    if 'fc' in layer_name:
        return 1e-3                            # 分类头
    elif 'layer4' in layer_name:
        return 5e-5                            # 最后一层
    elif 'layer3' in layer_name:
        return 1e-5                            # 倒数第二层
    else:
        return 1e-6                            # 更早的层

param_groups = []
for name, param in model.named_parameters():
    if param.requires_grad:
        param_groups.append({
            'params': param,
            'lr': get_layer_lr(name),
            'name': name
        })

optimizer = optim.Adam(param_groups, weight_decay=1e-4)

# 查看每个参数的学习率
for group in optimizer.param_groups:
    if 'name' in group:
        print(f"{group['name']:30s} LR: {group['lr']:.6f}")
```

### 模型融合（Ensemble）

```python
import torch
import torch.nn as nn
from torchvision import models

class EnsembleModel(nn.Module):
    """模型融合：多个模型的预测取平均"""

    def __init__(self, models):
        super().__init__()
        self.models = nn.ModuleList(models)    # 注册为子模块

    def forward(self, x):
        outputs = []
        for model in self.models:
            model.eval()                       # 确保是推理模式
            with torch.no_grad():
                out = model(x)
                outputs.append(out)

        # 取平均（也可以加权平均）
        ensemble_output = torch.stack(outputs).mean(dim=0)
        return ensemble_output

# 创建多个不同的模型
model1 = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
model1.fc = nn.Linear(model1.fc.in_features, 10)

model2 = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
model2.fc = nn.Linear(model2.fc.in_features, 10)

model3 = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
model3.classifier[1] = nn.Linear(model3.classifier[1].in_features, 10)

# 加载各自训练好的权重
# model1.load_state_dict(torch.load('resnet18_best.pth'))
# model2.load_state_dict(torch.load('resnet50_best.pth'))
# model3.load_state_dict(torch.load('efficientnet_best.pth'))

# 创建融合模型
ensemble = EnsembleModel([model1, model2, model3])
ensemble.eval()

# 推理
x = torch.randn(4, 3, 224, 224)
with torch.no_grad():
    output = ensemble(x)
    _, predicted = output.max(1)

print(f"融合模型预测形状: {output.shape}")
print(f"预测类别: {predicted}")

# 模型融合的原理：
# 不同模型学到的特征互补，融合后减少方差，提高泛化能力
# 类似"三个臭皮匠，顶个诸葛亮"
```

## 核心知识点总结

| 任务 | 输入 | 输出 | 典型应用 |
|------|------|------|----------|
| 图像分类 | 整张图 | 类别标签 | 图片分类、人脸识别 |
| 目标检测 | 整张图 | 边界框 + 类别 | 自动驾驶、安防监控 |
| 语义分割 | 整张图 | 每个像素的类别 | 医学图像、自动驾驶 |
| 迁移学习 | 预训练模型 | 适配新任务 | 小数据集场景 |

| 迁移学习策略 | 冻结层 | 训练层 | 适用场景 |
|-------------|--------|--------|----------|
| 特征提取 | 全部 | 分类头 | 数据少、任务相似 |
| 部分微调 | 浅层 | 深层 + 分类头 | 数据中等、任务有差异 |
| 完全微调 | 无 | 全部 | 数据多、任务差异大 |

## 新手常见误区

### 误区 1：忘记标准化

```python
# 错误：不做标准化，直接用原始像素值
transform = transforms.Compose([
    transforms.Resize(224),
    transforms.ToTensor(),
    # 缺少 Normalize
])

# 正确：使用 ImageNet 的均值和标准差标准化
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# 使用预训练模型时必须标准化，因为预训练权重是基于标准化后的数据训练的
```

### 误区 2：迁移学习时学习率设太大

```python
# 错误：用默认学习率 0.001 微调预训练模型
optimizer = optim.Adam(model.parameters(), lr=0.001)  # 太大会破坏预训练权重

# 正确：迁移学习用较小的学习率
optimizer = optim.Adam(model.parameters(), lr=1e-4)   # 比从头训练小 10 倍
```

### 误区 3：测试集也做数据增强

```python
# 错误：测试集做了随机变换
test_transform = transforms.Compose([
    transforms.RandomHorizontalFlip(),    # 测试集不该做随机增强
    transforms.ToTensor(),
])

# 正确：测试集只做确定性变换
test_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
```

### 误区 4：推理时忘记 model.eval()

```python
# 错误：推理时忘记切换模式
output = model(test_images)    # BN 和 Dropout 还在用训练模式

# 正确：推理时必须调用 eval()
model.eval()
with torch.no_grad():
    output = model(test_images)
```

### 误区 5：batch size 设太小

```python
# 错误：batch_size=1，BN 的统计量不准确
train_loader = DataLoader(dataset, batch_size=1)

# 正确：batch_size 至少为 8，推荐 16、32、64
train_loader = DataLoader(dataset, batch_size=32, shuffle=True)

# 如果显存不够，可以用梯度累积模拟大 batch
accumulation_steps = 4
for i, (images, labels) in enumerate(train_loader):
    outputs = model(images)
    loss = criterion(outputs, labels) / accumulation_steps
    loss.backward()

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

## 下一章预告

掌握了计算机视觉实战后，下一章将进入自然语言处理实战，讲解文本分类、情感分析、命名实体识别、机器翻译等 NLP 核心任务的实现方法。
