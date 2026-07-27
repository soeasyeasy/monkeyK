---
title: "第16章：综合实战项目"
description: "通过图像分类、风格迁移、推荐系统三个完整项目，将 PyTorch 知识应用到实际场景"
---

# 第16章：综合实战项目

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何从零开始构建一个完整的图像分类系统？
- 风格迁移是怎么实现的？能让我的照片变成梵高风格吗？
- 推荐系统的原理是什么？电商是如何推荐商品的？
- 这些项目需要多少代码？复杂吗？

这一章将通过三个完整的实战项目，带你将前面学到的 PyTorch 知识应用到真实场景中。每个项目都是端到端的完整系统，从数据处理到模型训练，再到部署应用。

---

## 1 为什么需要综合实战？

### 痛点分析

想象一下你学了很多理论知识：

**只学不练**：知道 CNN、RNN、GAN 的原理，但不知道如何组合使用。

**综合实战**：通过完整项目，学会如何将各个模块组合成实际可用的系统。

### 实战项目的价值

```
学习阶段：
- 理论：知道 CNN 可以分类图像
- 实践：用 CNN 训练 MNIST

实战阶段：
- 完整系统：构建一个能识别 1000 类物体的图像分类服务
- 端到端：从数据收集 → 模型训练 → API 部署 → 前端展示
```

> **一句话总结**：综合实战让你从"会写代码"升级到"会做项目"。

---

## 2 项目一：图像分类系统

### 项目目标

构建一个能够识别 1000 类物体的图像分类系统，类似 ImageNet 竞赛。

### 技术选型

| 组件 | 选择 | 原因 |
| --- | --- | --- |
| 模型架构 | ResNet-50 | 预训练模型，效果好 |
| 迁移学习 | 微调 | 数据量中等 |
| 数据增强 | 随机裁剪、翻转 | 防止过拟合 |
| 部署方式 | Flask API | 简单易用 |

### 完整实现

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader
import os
from PIL import Image
import json

# ============================================
# 1. 数据准备
# ============================================

# 数据增强策略
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),  # 随机裁剪并调整大小
    transforms.RandomHorizontalFlip(),  # 随机水平翻转
    transforms.ColorJitter(  # 颜色抖动
        brightness=0.2,
        contrast=0.2,
        saturation=0.2
    ),
    transforms.ToTensor(),  # 转换为张量
    transforms.Normalize(  # ImageNet 标准化
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# 验证集只做基本预处理
val_transform = transforms.Compose([
    transforms.Resize(256),  # 调整大小
    transforms.CenterCrop(224),  # 中心裁剪
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# 加载数据集（假设数据按类别文件夹组织）
# 目录结构：
# data/
#   train/
#     cat/
#     dog/
#     bird/
#   val/
#     cat/
#     dog/
#     bird/

train_dataset = datasets.ImageFolder('data/train', transform=train_transform)
val_dataset = datasets.ImageFolder('data/val', transform=val_transform)

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

# 获取类别名称
class_names = train_dataset.classes
num_classes = len(class_names)
print(f"类别数量: {num_classes}")
print(f"类别名称: {class_names}")

# ============================================
# 2. 模型构建
# ============================================

# 加载预训练的 ResNet-50
model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)

# 冻结所有层（特征提取模式）
for param in model.parameters():
    param.requires_grad = False

# 替换最后的分类层
num_features = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(0.3),  # Dropout 防止过拟合
    nn.Linear(num_features, 256),  # 第一个全连接层
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(256, num_classes)  # 输出层
)

# 将模型移到 GPU
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

print(f"使用设备: {device}")
print(f"模型参数量: {sum(p.numel() for p in model.parameters()):,}")

# ============================================
# 3. 训练配置
# ============================================

# 损失函数
criterion = nn.CrossEntropyLoss()

# 优化器（只优化 fc 层）
optimizer = optim.Adam(model.fc.parameters(), lr=0.001, weight_decay=1e-4)

# 学习率调度器
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode='min',
    factor=0.5,
    patience=3,
    verbose=True
)

# ============================================
# 4. 训练循环
# ============================================

num_epochs = 20
best_val_acc = 0.0
train_losses = []
val_losses = []
train_accs = []
val_accs = []

for epoch in range(num_epochs):
    # ---------- 训练阶段 ----------
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        # 清零梯度
        optimizer.zero_grad()

        # 前向传播
        outputs = model(images)
        loss = criterion(outputs, labels)

        # 反向传播
        loss.backward()
        optimizer.step()

        # 统计
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    train_loss = running_loss / len(train_loader)
    train_acc = 100. * correct / total
    train_losses.append(train_loss)
    train_accs.append(train_acc)

    # ---------- 验证阶段 ----------
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

    val_loss = val_loss / len(val_loader)
    val_acc = 100. * correct / total
    val_losses.append(val_loss)
    val_accs.append(val_acc)

    # 更新学习率
    scheduler.step(val_loss)

    # 打印进度
    print(f"Epoch [{epoch+1}/{num_epochs}]")
    print(f"  训练 - Loss: {train_loss:.4f}, Acc: {train_acc:.2f}%")
    print(f"  验证 - Loss: {val_loss:.4f}, Acc: {val_acc:.2f}%")

    # 保存最佳模型
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save({
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_acc': val_acc,
            'class_names': class_names
        }, 'best_model.pth')
        print(f"  ✓ 保存最佳模型 (验证准确率: {val_acc:.2f}%)")

print(f"\n训练完成！最佳验证准确率: {best_val_acc:.2f}%")

# ============================================
# 5. 模型推理
# ============================================

def predict_image(image_path, model_path='best_model.pth'):
    """
    预测单张图片的类别

    参数:
        image_path: 图片路径
        model_path: 模型路径
    """
    # 加载模型
    checkpoint = torch.load(model_path)
    class_names = checkpoint['class_names']

    model = models.resnet50()
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_features, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, len(class_names))
    )

    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    model.to(device)

    # 加载并预处理图片
    image = Image.open(image_path).convert('RGB')
    image = val_transform(image)
    image = image.unsqueeze(0)  # 添加批次维度
    image = image.to(device)

    # 推理
    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)

    # 获取 Top-5 预测
    top5_prob, top5_idx = torch.topk(probabilities, 5)

    print(f"\n预测结果:")
    for i in range(5):
        class_name = class_names[top5_idx[i].item()]
        prob = top5_prob[i].item()
        print(f"  {i+1}. {class_name}: {prob:.4f}")

    return class_names[top5_idx[0].item()], top5_prob[0].item()

# 测试
predicted_class, confidence = predict_image('test_image.jpg')
print(f"\n最终预测: {predicted_class} (置信度: {confidence:.4f})")

# ============================================
# 6. Flask API 部署
# ============================================

from flask import Flask, request, jsonify
import base64
from io import BytesIO

app = Flask(__name__)

# 加载模型
checkpoint = torch.load('best_model.pth')
class_names = checkpoint['class_names']

model = models.resnet50()
num_features = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(0.3),
    nn.Linear(num_features, 256),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(256, len(class_names))
)

model.load_state_dict(checkpoint['model_state_dict'])
model.eval()
model.to(device)

@app.route('/predict', methods=['POST'])
def predict():
    """
    API 接口：预测图片类别

    请求格式:
        POST /predict
        Content-Type: multipart/form-data
        Body: image (文件)

    返回格式:
        {
            "class": "cat",
            "confidence": 0.95,
            "top5": [
                {"class": "cat", "confidence": 0.95},
                {"class": "dog", "confidence": 0.03},
                ...
            ]
        }
    """
    # 检查是否有图片
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    image = Image.open(file.stream).convert('RGB')

    # 预处理
    image = val_transform(image)
    image = image.unsqueeze(0)
    image = image.to(device)

    # 推理
    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)

    # Top-5 预测
    top5_prob, top5_idx = torch.topk(probabilities, 5)

    result = {
        'class': class_names[top5_idx[0].item()],
        'confidence': top5_prob[0].item(),
        'top5': [
            {
                'class': class_names[top5_idx[i].item()],
                'confidence': top5_prob[i].item()
            }
            for i in range(5)
        ]
    }

    return jsonify(result)

@app.route('/health', methods=['GET'])
def health():
    """健康检查接口"""
    return jsonify({'status': 'healthy', 'device': str(device)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

# 启动服务后，可以通过以下方式调用:
# curl -X POST -F "image=@test_image.jpg" http://localhost:5000/predict
```

---

## 3 项目二：风格迁移

### 项目目标

实现神经风格迁移，将一张图片转换成另一张图片的艺术风格（如梵高的星空）。

### 技术原理

风格迁移的核心思想：

1. **内容损失**：保持生成图片的内容与原图相似
2. **风格损失**：让生成图片的风格与风格图片相似
3. **总损失**：内容损失 + 风格损失

打个比方：

> 风格迁移像学画画：你要画一幅画（内容），但要用梵高的笔触（风格）。

### 完整实现

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms
from PIL import Image
import matplotlib.pyplot as plt

# ============================================
# 1. 数据预处理
# ============================================

# 定义图像转换
imsize = 512 if torch.cuda.is_available() else 256

loader = transforms.Compose([
    transforms.Resize(imsize),
    transforms.ToTensor()
])

def image_loader(image_name):
    """加载图像并转换为张量"""
    image = Image.open(image_name)
    # 添加批次维度
    image = loader(image).unsqueeze(0)
    return image.to(device, torch.float)

# ============================================
# 2. 定义内容和风格损失
# ============================================

class ContentLoss(nn.Module):
    """内容损失：计算生成图像和目标图像的特征差异"""

    def __init__(self, target):
        super(ContentLoss, self).__init__()
        # 分离目标特征（不计算梯度）
        self.target = target.detach()

    def forward(self, input):
        # 计算均方误差
        self.loss = nn.functional.mse_loss(input, self.target)
        return input

class StyleLoss(nn.Module):
    """风格损失：计算生成图像和风格图像的 Gram 矩阵差异"""

    def __init__(self, target_feature):
        super(StyleLoss, self).__init__()
        self.target = gram_matrix(target_feature).detach()

    def forward(self, input):
        G = gram_matrix(input)
        self.loss = nn.functional.mse_loss(G, self.target)
        return input

def gram_matrix(input):
    """
    计算 Gram 矩阵

    Gram 矩阵捕捉特征之间的相关性，用于表示风格
    """
    a, b, c, d = input.size()  # batch, channels, height, width

    # 展平特征图
    features = input.view(a * b, c * d)

    # 计算 Gram 矩阵
    G = torch.mm(features, features.t())

    # 归一化
    return G.div(a * b * c * d)

# ============================================
# 3. 构建特征提取器
# ============================================

# 使用预训练的 VGG19
cnn = models.vgg19(weights=models.VGG19_Weights.DEFAULT).features
cnn = cnn.to(device)

# VGG19 的层结构
# 选择特定层用于计算内容和风格损失
cnn_normalization_mean = torch.tensor([0.485, 0.456, 0.406]).to(device)
cnn_normalization_std = torch.tensor([0.229, 0.224, 0.225]).to(device)

class Normalization(nn.Module):
    """图像标准化层"""

    def __init__(self):
        super(Normalization, self).__init__()
        self.mean = torch.tensor(cnn_normalization_mean).view(-1, 1, 1)
        self.std = torch.tensor(cnn_normalization_std).view(-1, 1, 1)

    def forward(self, img):
        return (img - self.mean) / self.std

# 内容损失层
content_layers_default = ['conv_4']
# 风格损失层
style_layers_default = ['conv_1', 'conv_2', 'conv_3', 'conv_4', 'conv_5']

def get_style_model_and_losses(cnn, normalization_mean, normalization_std,
                               style_img, content_img,
                               content_layers=content_layers_default,
                               style_layers=style_layers_default):
    """
    构建模型并创建内容和风格损失模块
    """
    cnn = cnn.clone()
    normalization = Normalization().to(device)

    content_losses = []
    style_losses = []

    model = nn.Sequential(normalization)

    i = 0  # 卷积层计数器
    for layer in cnn.children():
        if isinstance(layer, nn.Conv2d):
            i += 1
            name = f'conv_{i}'
        elif isinstance(layer, nn.ReLU):
            name = f'relu_{i}'
            layer = nn.ReLU(inplace=False)
        elif isinstance(layer, nn.MaxPool2d):
            name = f'pool_{i}'
        elif isinstance(layer, nn.BatchNorm2d):
            name = f'bn_{i}'

        model.add_module(name, layer)

        # 添加内容损失
        if name in content_layers:
            target = model(content_img).clone()
            content_loss = ContentLoss(target)
            model.add_module(f'content_loss_{i}', content_loss)
            content_losses.append(content_loss)

        # 添加风格损失
        if name in style_layers:
            target_features = model(style_img).clone()
            style_loss = StyleLoss(target_features)
            model.add_module(f'style_loss_{i}', style_loss)
            style_losses.append(style_loss)

    # 移除最后的池化层和卷积层
    for i in range(len(model) - 1, -1, -1):
        if isinstance(model[i], (nn.Conv2d, nn.MaxPool2d, nn.ReLU)):
            break
        model.pop()

    return model, style_losses, content_losses

# ============================================
# 4. 风格迁移训练
# ============================================

def run_style_transfer(cnn, normalization_mean, normalization_std,
                       content_img, style_img, input_img,
                       num_steps=300, style_weight=1000000, content_weight=1):
    """
    运行风格迁移

    参数:
        cnn: 预训练的 CNN
        content_img: 内容图像
        style_img: 风格图像
        input_img: 输入图像（初始化为内容图像或噪声）
        num_steps: 优化步数
        style_weight: 风格损失权重
        content_weight: 内容损失权重
    """
    print('构建模型...')
    model, style_losses, content_losses = get_style_model_and_losses(
        cnn, normalization_mean, normalization_std, style_img, content_img)

    # 优化输入图像
    input_img.requires_grad_(True)
    model.eval()
    model.requires_grad_(False)

    optimizer = optim.LBFGS([input_img.requires_grad_()])

    print('开始优化...')
    run = [0]
    while run[0] <= num_steps:
        def closure():
            # 限制像素值在 [0, 1]
            with torch.no_grad():
                input_img.clamp_(0, 1)

            optimizer.zero_grad()

            # 前向传播
            model(input_img)

            # 计算损失
            style_score = 0
            content_score = 0

            for sl in style_losses:
                style_score += sl.loss

            for cl in content_losses:
                content_score += cl.loss

            # 加权损失
            style_score *= style_weight
            content_score *= content_weight

            loss = style_score + content_score
            loss.backward()

            run[0] += 1
            if run[0] % 50 == 0:
                print(f"迭代 {run[0]}:")
                print(f"  风格损失: {style_score.item():.4f}")
                print(f"  内容损失: {content_score.item():.4f}")
                print(f"  总损失: {loss.item():.4f}")

            return loss

        optimizer.step(closure)

    # 最终限制
    with torch.no_grad():
        input_img.clamp_(0, 1)

    return input_img

# ============================================
# 5. 执行风格迁移
# ============================================

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 加载图像
style_img = image_loader('style.jpg')
content_img = image_loader('content.jpg')

# 确保尺寸一致
assert style_img.size() == content_img.size(), \
    "风格图像和内容图像必须有相同的尺寸"

# 初始化输入图像（使用内容图像）
input_img = content_img.clone()

# 运行风格迁移
output = run_style_transfer(
    cnn, cnn_normalization_mean, cnn_normalization_std,
    content_img, style_img, input_img
)

# 保存结果
def save_image(tensor, filename):
    """保存张量为图像"""
    image = tensor.cpu().clone().squeeze(0)
    image = transforms.ToPILImage()(image)
    image.save(filename)
    print(f"图像已保存到: {filename}")

save_image(output, 'output.jpg')

# 可视化
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.title('内容图像')
plt.imshow(content_img.cpu().squeeze(0).permute(1, 2, 0))

plt.subplot(1, 3, 2)
plt.title('风格图像')
plt.imshow(style_img.cpu().squeeze(0).permute(1, 2, 0))

plt.subplot(1, 3, 3)
plt.title('生成图像')
plt.imshow(output.cpu().squeeze(0).permute(1, 2, 0))

plt.tight_layout()
plt.savefig('style_transfer_result.png')
plt.show()
```

---

## 4 项目三：推荐系统

### 项目目标

构建一个基于协同过滤的推荐系统，能够根据用户的历史行为推荐商品。

### 技术原理

协同过滤的核心思想：

1. **用户-物品矩阵**：记录每个用户对每个物品的评分
2. **相似度计算**：计算用户之间或物品之间的相似度
3. **预测评分**：根据相似用户的评分预测目标用户的评分

打个比方：

> 协同过滤像朋友推荐：你的口味和某个朋友很像，他喜欢的电影你也可能喜欢。

### 完整实现

```python
import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# ============================================
# 1. 数据准备
# ============================================

# 假设我们有 MovieLens 数据集
# 格式：user_id, item_id, rating, timestamp

# 加载数据
data = pd.read_csv('ratings.csv')

# 查看数据
print(f"数据量: {len(data)}")
print(f"用户数: {data['user_id'].nunique()}")
print(f"物品数: {data['item_id'].nunique()}")

# 创建用户-物品映射
user_ids = data['user_id'].unique().tolist()
item_ids = data['item_id'].unique().tolist()

user2idx = {user: idx for idx, user in enumerate(user_ids)}
idx2user = {idx: user for user, idx in user2idx.items()}

item2idx = {item: idx for idx, item in enumerate(item_ids)}
idx2item = {idx: item for item, idx in item2idx.items()}

# 转换 ID
data['user'] = data['user_id'].map(user2idx)
data['item'] = data['item_id'].map(item2idx)

# 划分训练集和测试集
train_data, test_data = train_test_split(data, test_size=0.2, random_state=42)

# ============================================
# 2. 神经网络协同过滤模型
# ============================================

class NCFModel(nn.Module):
    """
    Neural Collaborative Filtering 模型

    结合矩阵分解和神经网络
    """

    def __init__(self, num_users, num_items, embedding_dim=64):
        super(NCFModel, self).__init__()

        # 用户嵌入
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        # 物品嵌入
        self.item_embedding = nn.Embedding(num_items, embedding_dim)

        # 全连接层
        self.fc1 = nn.Linear(embedding_dim * 2, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 32)
        self.output = nn.Linear(32, 1)

        self.dropout = nn.Dropout(0.2)
        self.relu = nn.ReLU()

    def forward(self, user_ids, item_ids):
        """
        前向传播

        参数:
            user_ids: 用户 ID 张量 [batch_size]
            item_ids: 物品 ID 张量 [batch_size]

        返回:
            预测评分 [batch_size]
        """
        # 获取嵌入
        user_embedded = self.user_embedding(user_ids)  # [batch, embedding_dim]
        item_embedded = self.item_embedding(item_ids)  # [batch, embedding_dim]

        # 拼接
        concat = torch.cat([user_embedded, item_embedded], dim=1)

        # 全连接层
        x = self.relu(self.fc1(concat))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.relu(self.fc3(x))
        x = self.dropout(x)

        # 输出评分（1-5）
        rating = self.output(x)

        return rating.squeeze()

# ============================================
# 3. 训练模型
# ============================================

# 创建数据集
class RatingDataset(torch.utils.data.Dataset):
    def __init__(self, users, items, ratings):
        self.users = torch.LongTensor(users)
        self.items = torch.LongTensor(items)
        self.ratings = torch.FloatTensor(ratings)

    def __len__(self):
        return len(self.ratings)

    def __getitem__(self, idx):
        return self.users[idx], self.items[idx], self.ratings[idx]

# 创建数据加载器
train_dataset = RatingDataset(
    train_data['user'].values,
    train_data['item'].values,
    train_data['rating'].values
)

train_loader = torch.utils.data.DataLoader(
    train_dataset,
    batch_size=256,
    shuffle=True,
    num_workers=4
)

test_dataset = RatingDataset(
    test_data['user'].values,
    test_data['item'].values,
    test_data['rating'].values
)

test_loader = torch.utils.data.DataLoader(
    test_dataset,
    batch_size=256,
    shuffle=False
)

# 初始化模型
num_users = len(user_ids)
num_items = len(item_ids)
embedding_dim = 64

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = NCFModel(num_users, num_items, embedding_dim).to(device)

# 损失函数和优化器
criterion = nn.MSELoss()
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', factor=0.5, patience=3
)

# 训练循环
num_epochs = 50
best_rmse = float('inf')

for epoch in range(num_epochs):
    # ---------- 训练阶段 ----------
    model.train()
    train_loss = 0.0

    for users, items, ratings in train_loader:
        users, items, ratings = users.to(device), items.to(device), ratings.to(device)

        optimizer.zero_grad()
        predictions = model(users, items)
        loss = criterion(predictions, ratings)
        loss.backward()
        optimizer.step()

        train_loss += loss.item()

    train_loss /= len(train_loader)

    # ---------- 验证阶段 ----------
    model.eval()
    test_loss = 0.0

    with torch.no_grad():
        for users, items, ratings in test_loader:
            users, items, ratings = users.to(device), items.to(device), ratings.to(device)
            predictions = model(users, items)
            loss = criterion(predictions, ratings)
            test_loss += loss.item()

    test_loss /= len(test_loader)
    test_rmse = np.sqrt(test_loss)

    # 更新学习率
    scheduler.step(test_rmse)

    # 打印进度
    print(f"Epoch [{epoch+1}/{num_epochs}]")
    print(f"  训练损失: {train_loss:.4f}")
    print(f"  测试 RMSE: {test_rmse:.4f}")

    # 保存最佳模型
    if test_rmse < best_rmse:
        best_rmse = test_rmse
        torch.save({
            'model_state_dict': model.state_dict(),
            'user2idx': user2idx,
            'idx2user': idx2user,
            'item2idx': item2idx,
            'idx2item': idx2item,
            'rmse': test_rmse
        }, 'best_recommendation_model.pth')
        print(f"  ✓ 保存最佳模型 (RMSE: {test_rmse:.4f})")

print(f"\n训练完成！最佳 RMSE: {best_rmse:.4f}")

# ============================================
# 4. 推荐函数
# ============================================

def recommend_items(user_id, model, item2idx, idx2item, top_k=10, device='cpu'):
    """
    为用户推荐物品

    参数:
        user_id: 用户 ID
        model: 训练好的模型
        item2idx: 物品到索引的映射
        idx2item: 索引到物品的映射
        top_k: 推荐数量
        device: 设备
    """
    model.eval()

    # 获取所有物品索引
    all_items = list(item2idx.values())

    # 创建用户-物品对
    user_tensor = torch.LongTensor([user_id] * len(all_items)).to(device)
    item_tensor = torch.LongTensor(all_items).to(device)

    # 预测评分
    with torch.no_grad():
        predictions = model(user_tensor, item_tensor)

    # 获取 Top-K
    top_k_scores, top_k_indices = torch.topk(predictions, top_k)

    # 转换为物品 ID
    recommendations = []
    for idx, score in zip(top_k_indices, top_k_scores):
        item_idx = idx.item()
        item_id = idx2item[item_idx]
        recommendations.append({
            'item_id': item_id,
            'predicted_rating': score.item()
        })

    return recommendations

# 测试推荐
user_id = user2idx[1]  # 用户 1
recommendations = recommend_items(user_id, model, item2idx, idx2item, top_k=10)

print(f"\n为用户 {1} 推荐的前 10 个物品:")
for i, rec in enumerate(recommendations, 1):
    print(f"  {i}. 物品 {rec['item_id']}: 预测评分 {rec['predicted_rating']:.2f}")

# ============================================
# 5. 评估指标
# ============================================

def evaluate_model(model, test_data, user2idx, item2idx, device='cpu'):
    """
    评估模型性能

    指标:
        - RMSE: 均方根误差
        - MAE: 平均绝对误差
        - Precision@K: 精确率
        - Recall@K: 召回率
    """
    model.eval()

    all_predictions = []
    all_ratings = []

    with torch.no_grad():
        for _, row in test_data.iterrows():
            user_idx = user2idx[row['user_id']]
            item_idx = item2idx[row['item_id']]

            user_tensor = torch.LongTensor([user_idx]).to(device)
            item_tensor = torch.LongTensor([item_idx]).to(device)

            prediction = model(user_tensor, item_tensor).item()
            all_predictions.append(prediction)
            all_ratings.append(row['rating'])

    # 计算 RMSE 和 MAE
    predictions = np.array(all_predictions)
    ratings = np.array(all_ratings)

    rmse = np.sqrt(np.mean((predictions - ratings) ** 2))
    mae = np.mean(np.abs(predictions - ratings))

    print(f"评估指标:")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  MAE: {mae:.4f}")

    return rmse, mae

# 评估
rmse, mae = evaluate_model(model, test_data, user2idx, item2idx, device)
```

---

## 5 核心知识点总结

| 项目 | 核心技术 | 关键模块 | 应用场景 |
| --- | --- | --- | --- |
| 图像分类 | CNN + 迁移学习 | ResNet, DataLoader | 图像识别、质量检测 |
| 风格迁移 | 特征提取 + 优化 | VGG, Gram 矩阵 | 艺术创作、滤镜 |
| 推荐系统 | 协同过滤 + 神经网络 | Embedding, NCF | 电商、视频推荐 |

---

## 6 新手常见误区

### 误区 1："项目代码太复杂，学不会"

**错！** 项目都是由基础模块组合而成，理解每个模块就能理解整个项目。

正确做法：先理解每个模块，再组合成完整项目。

### 误区 2："必须从头训练模型"

不是的。迁移学习可以大幅减少训练时间和数据需求。

正确做法：优先使用预训练模型，根据任务微调。

### 误区 3："项目只需要模型代码"

实际上完整项目需要数据处理、模型训练、评估、部署等多个环节。

正确做法：关注整个流程，不只是模型本身。

---

## 7 动手练习

### 练习 1：基础练习

修改图像分类项目，增加数据可视化功能，显示训练过程中的损失和准确率曲线。

<details>
<summary>点击查看答案</summary>

```python
import matplotlib.pyplot as plt

def plot_training_curves(train_losses, val_losses, train_accs, val_accs):
    """
    绘制训练曲线

    参数:
        train_losses: 训练损失列表
        val_losses: 验证损失列表
        train_accs: 训练准确率列表
        val_accs: 验证准确率列表
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))

    # 绘制损失曲线
    ax1.plot(train_losses, label='训练损失', marker='o')
    ax1.plot(val_losses, label='验证损失', marker='s')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('损失曲线')
    ax1.legend()
    ax1.grid(True)

    # 绘制准确率曲线
    ax2.plot(train_accs, label='训练准确率', marker='o')
    ax2.plot(val_accs, label='验证准确率', marker='s')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Accuracy (%)')
    ax2.set_title('准确率曲线')
    ax2.legend()
    ax2.grid(True)

    plt.tight_layout()
    plt.savefig('training_curves.png')
    plt.show()

# 使用示例
plot_training_curves(train_losses, val_losses, train_accs, val_accs)
```

</details>

### 练习 2：进阶练习

在风格迁移项目中，添加多个风格权重参数，让用户可以调整不同风格层的权重。

<details>
<summary>点击查看答案</summary>

```python
def run_style_transfer_advanced(cnn, normalization_mean, normalization_std,
                                content_img, style_img, input_img,
                                num_steps=300, style_weight=1000000, content_weight=1,
                                style_layer_weights=None):
    """
    高级风格迁移，支持不同风格层权重

    参数:
        style_layer_weights: 字典，每个风格层的权重
            例如: {'conv_1': 1.0, 'conv_2': 0.5, 'conv_3': 0.3}
    """
    if style_layer_weights is None:
        style_layer_weights = {
            'conv_1': 1.0,
            'conv_2': 1.0,
            'conv_3': 1.0,
            'conv_4': 1.0,
            'conv_5': 1.0
        }

    print('构建模型...')
    model, style_losses, content_losses = get_style_model_and_losses(
        cnn, normalization_mean, normalization_std, style_img, content_img)

    input_img.requires_grad_(True)
    model.eval()
    model.requires_grad_(False)

    optimizer = optim.LBFGS([input_img.requires_grad_()])

    print('开始优化...')
    run = [0]
    while run[0] <= num_steps:
        def closure():
            with torch.no_grad():
                input_img.clamp_(0, 1)

            optimizer.zero_grad()
            model(input_img)

            style_score = 0
            content_score = 0

            # 应用不同风格层权重
            for i, sl in enumerate(style_losses):
                layer_name = f'conv_{i+1}'
                layer_weight = style_layer_weights.get(layer_name, 1.0)
                style_score += sl.loss * layer_weight

            for cl in content_losses:
                content_score += cl.loss

            style_score *= style_weight
            content_score *= content_weight

            loss = style_score + content_score
            loss.backward()

            run[0] += 1
            if run[0] % 50 == 0:
                print(f"迭代 {run[0]}:")
                print(f"  风格损失: {style_score.item():.4f}")
                print(f"  内容损失: {content_score.item():.4f}")
                print(f"  总损失: {loss.item():.4f}")

            return loss

        optimizer.step(closure)

    with torch.no_grad():
        input_img.clamp_(0, 1)

    return input_img

# 使用示例
style_layer_weights = {
    'conv_1': 1.0,  # 底层特征（纹理）
    'conv_2': 0.8,
    'conv_3': 0.6,  # 中层特征
    'conv_4': 0.4,
    'conv_5': 0.2   # 高层特征（语义）
}

output = run_style_transfer_advanced(
    cnn, cnn_normalization_mean, cnn_normalization_std,
    content_img, style_img, input_img,
    style_layer_weights=style_layer_weights
)
```

</details>

### 练习 3（挑战）：综合练习

在推荐系统项目中，添加冷启动处理功能，对于新用户或新物品给出默认推荐。

<details>
<summary>点击查看答案</summary>

```python
class ColdStartHandler:
    """冷启动处理器"""

    def __init__(self, model, user2idx, item2idx, idx2item, train_data):
        self.model = model
        self.user2idx = user2idx
        self.item2idx = item2idx
        self.idx2item = idx2item
        self.train_data = train_data

        # 计算全局平均评分
        self.global_mean_rating = train_data['rating'].mean()

        # 计算每个物品的平均评分
        self.item_mean_ratings = train_data.groupby('item')['rating'].mean()

        # 计算热门物品（按评分次数）
        self.popular_items = train_data.groupby('item').size().sort_values(ascending=False)

    def recommend_for_new_user(self, top_k=10):
        """
        为新用户推荐（基于热门物品）

        参数:
            top_k: 推荐数量
        """
        recommendations = []

        for item_idx in self.popular_items.head(top_k).index:
            item_id = self.idx2item[item_idx]
            avg_rating = self.item_mean_ratings.get(item_idx, self.global_mean_rating)

            recommendations.append({
                'item_id': item_id,
                'predicted_rating': avg_rating,
                'reason': '热门物品'
            })

        return recommendations

    def recommend_for_existing_user(self, user_id, top_k=10):
        """
        为现有用户推荐

        参数:
            user_id: 用户 ID
            top_k: 推荐数量
        """
        if user_id not in self.user2idx:
            return self.recommend_for_new_user(top_k)

        user_idx = self.user2idx[user_id]
        all_items = list(self.item2idx.values())

        user_tensor = torch.LongTensor([user_idx] * len(all_items)).to(device)
        item_tensor = torch.LongTensor(all_items).to(device)

        with torch.no_grad():
            predictions = self.model(user_tensor, item_tensor)

        top_k_scores, top_k_indices = torch.topk(predictions, top_k)

        recommendations = []
        for idx, score in zip(top_k_indices, top_k_scores):
            item_idx = idx.item()
            item_id = self.idx2item[item_idx]
            recommendations.append({
                'item_id': item_id,
                'predicted_rating': score.item(),
                'reason': '个性化推荐'
            })

        return recommendations

    def recommend(self, user_id=None, top_k=10):
        """
        通用推荐接口

        参数:
            user_id: 用户 ID（None 表示新用户）
            top_k: 推荐数量
        """
        if user_id is None or user_id not in self.user2idx:
            print(f"用户 {user_id} 是新用户，使用热门物品推荐")
            return self.recommend_for_new_user(top_k)
        else:
            print(f"为用户 {user_id} 生成个性化推荐")
            return self.recommend_for_existing_user(user_id, top_k)

# 使用示例
handler = ColdStartHandler(model, user2idx, item2idx, idx2item, train_data)

# 为新用户推荐
new_user_recs = handler.recommend(user_id=None, top_k=10)
print("\n新用户推荐:")
for i, rec in enumerate(new_user_recs, 1):
    print(f"  {i}. 物品 {rec['item_id']}: {rec['predicted_rating']:.2f} ({rec['reason']})")

# 为现有用户推荐
existing_user_recs = handler.recommend(user_id=1, top_k=10)
print("\n现有用户推荐:")
for i, rec in enumerate(existing_user_recs, 1):
    print(f"  {i}. 物品 {rec['item_id']}: {rec['predicted_rating']:.2f} ({rec['reason']})")
```

</details>

---

## 教程总结

恭喜你完成了 PyTorch 从零到精通的全部 16 章教程！

### 学习路径回顾

```
基础篇（1-5 章）:
  第1章: PyTorch 简介与环境搭建
  第2章: 张量基础与操作
  第3章: 自动求导机制
  第4章: 数据加载与处理
  第5章: 神经网络基础

进阶篇（6-10 章）:
  第6章: 损失函数与优化器
  第7章: 模型训练与评估
  第8章: 卷积神经网络（CNN）
  第9章: 循环神经网络（RNN）
  第10章: 生成对抗网络（GAN）

实战篇（11-16 章）:
  第11章: 迁移学习与模型微调
  第12章: 目标检测实战
  第13章: 语义分割实战
  第14章: 自然语言处理实战
  第15章: 模型部署与优化
  第16章: 综合实战项目
```

### 下一步学习建议

1. **深入理论**：阅读经典论文（如 ResNet、Transformer、GAN 原始论文）
2. **实践项目**：参加 Kaggle 竞赛，解决实际问题
3. **扩展领域**：学习强化学习、图神经网络等前沿技术
4. **开源贡献**：参与 PyTorch 生态项目，提升工程能力

### 推荐资源

- **官方文档**：https://pytorch.org/docs/
- **教程视频**：PyTorch 官方教程系列
- **经典书籍**：《深度学习》（Ian Goodfellow）
- **社区论坛**：PyTorch Forums、Stack Overflow

祝你在深度学习的道路上越走越远！
