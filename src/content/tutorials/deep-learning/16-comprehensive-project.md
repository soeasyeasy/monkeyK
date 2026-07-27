# 第 16 章：综合实战项目

## 本章导读

学完了前面所有章节的内容，是时候将知识融会贯通了。本章将通过一个完整的实战项目，帮你解决以下问题：

1. 如何从零开始规划一个深度学习项目？
2. 如何选择合适的模型架构和训练策略？
3. 如何处理真实世界的数据和工程问题？
4. 如何评估模型性能并优化？
5. 如何将模型部署为可用的应用？

## 技术必要性分析

前面的章节分别讲解了 CNN、RNN、Transformer、模型训练技巧、部署方法等。但在实际工作中，你需要：

- **综合运用多种技术**：一个项目可能同时用到计算机视觉和自然语言处理
- **处理工程问题**：数据加载、训练监控、模型保存、API 服务
- **做出技术决策**：选择什么模型？需要多少数据？训练多久？

本章的实战项目将带你完整经历一个深度学习项目的全流程，从需求分析到最终部署。

## 核心原理讲解

### 项目选择：智能图像分类系统

我们将构建一个完整的图像分类系统，包含以下功能：

1. **数据准备**：从原始图像到训练数据
2. **模型训练**：使用迁移学习快速构建高性能模型
3. **模型评估**：全面的性能分析和可视化
4. **模型部署**：构建 RESTful API 服务
5. **前端展示**：简单的 Web 界面供用户使用

这个项目涵盖了：
- 计算机视觉（CNN、迁移学习）
- 数据处理（数据增强、数据加载器）
- 训练技巧（学习率调度、早停、模型检查点）
- 模型部署（FastAPI、Docker）
- 工程实践（日志、监控、错误处理）

## 基础用法

### 项目结构规划

首先，让我们规划项目结构：

```
image_classifier/
├── data/                    # 数据目录
│   ├── raw/                 # 原始图像
│   ├── processed/           # 处理后的数据
│   └── splits/              # 训练/验证/测试集划分
├── models/                  # 模型定义
│   ├── __init__.py
│   ├── resnet.py            # ResNet 模型
│   └── efficientnet.py      # EfficientNet 模型
├── training/                # 训练相关
│   ├── __init__.py
│   ├── trainer.py           # 训练器
│   ├── dataset.py           # 数据集定义
│   └── transforms.py        # 数据增强
├── evaluation/              # 评估相关
│   ├── __init__.py
│   ├── metrics.py           # 评估指标
│   └── visualizer.py        # 可视化
├── deployment/              # 部署相关
│   ├── __init__.py
│   ├── api.py               # FastAPI 服务
│   └── Dockerfile           # Docker 配置
├── configs/                 # 配置文件
│   └── default.yaml         # 默认配置
├── notebooks/               # Jupyter  notebooks
│   └── exploration.ipynb    # 数据探索
├── scripts/                 # 脚本
│   ├── train.py             # 训练脚本
│   ├── evaluate.py          # 评估脚本
│   └── predict.py           # 预测脚本
├── logs/                    # 日志目录
├── checkpoints/             # 模型检查点
├── requirements.txt         # 依赖
└── README.md                # 项目说明
```

### 第一步：数据准备

```python
# scripts/prepare_data.py
import os
import shutil
from pathlib import Path
from sklearn.model_selection import train_test_split
from torchvision import datasets
import argparse

def prepare_dataset(data_dir, output_dir, train_ratio=0.7, val_ratio=0.15):
    """
    准备数据集，划分为训练集、验证集、测试集
    
    Args:
        data_dir: 原始数据目录
        output_dir: 输出目录
        train_ratio: 训练集比例
        val_ratio: 验证集比例
    """
    data_path = Path(data_dir)
    output_path = Path(output_dir)
    
    # 创建输出目录
    for split in ['train', 'val', 'test']:
        (output_path / split).mkdir(parents=True, exist_ok=True)
    
    # 遍历所有类别
    classes = sorted([d.name for d in data_path.iterdir() if d.is_dir()])
    print(f"发现 {len(classes)} 个类别: {classes}")
    
    for class_name in classes:
        class_dir = data_path / class_name
        
        # 获取所有图像文件
        image_files = list(class_dir.glob('*.jpg')) + list(class_dir.glob('*.png'))
        print(f"类别 {class_name}: {len(image_files)} 张图像")
        
        # 划分数据集
        train_files, temp_files = train_test_split(
            image_files, 
            train_size=train_ratio, 
            random_state=42
        )
        val_files, test_files = train_test_split(
            temp_files, 
            train_size=val_ratio / (1 - train_ratio), 
            random_state=42
        )
        
        # 复制文件到对应目录
        for split, files in [('train', train_files), ('val', val_files), ('test', test_files)]:
            split_class_dir = output_path / split / class_name
            split_class_dir.mkdir(exist_ok=True)
            
            for img_file in files:
                shutil.copy(img_file, split_class_dir / img_file.name)
    
    print(f"\n数据集准备完成，保存在: {output_dir}")
    
    # 打印统计信息
    for split in ['train', 'val', 'test']:
        split_dir = output_path / split
        total = sum(len(list(d.glob('*'))) for d in split_dir.iterdir() if d.is_dir())
        print(f"{split}: {total} 张图像")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_dir', type=str, required=True)
    parser.add_argument('--output_dir', type=str, required=True)
    args = parser.parse_args()
    
    prepare_dataset(args.data_dir, args.output_dir)
```

### 第二步：定义数据集和数据增强

```python
# training/dataset.py
import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image
import os

class ImageClassificationDataset(Dataset):
    """图像分类数据集"""
    
    def __init__(self, root_dir, split='train', transform=None):
        """
        Args:
            root_dir: 数据根目录
            split: 'train', 'val', 或 'test'
            transform: 图像变换
        """
        self.root_dir = os.path.join(root_dir, split)
        self.split = split
        self.transform = transform
        
        # 获取类别列表
        self.classes = sorted([d.name for d in os.listdir(self.root_dir) 
                              if os.path.isdir(os.path.join(self.root_dir, d))])
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}
        
        # 加载所有样本
        self.samples = []
        for class_name in self.classes:
            class_dir = os.path.join(self.root_dir, class_name)
            class_idx = self.class_to_idx[class_name]
            
            for img_name in os.listdir(class_dir):
                if img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                    img_path = os.path.join(class_dir, img_name)
                    self.samples.append((img_path, class_idx))
        
        print(f"加载 {split} 集: {len(self.samples)} 张图像, {len(self.classes)} 个类别")
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        
        # 加载图像
        image = Image.open(img_path).convert('RGB')
        
        # 应用变换
        if self.transform:
            image = self.transform(image)
        
        return image, label

# training/transforms.py
from torchvision import transforms

def get_transforms(image_size=224, augmentation=True):
    """
    获取数据变换
    
    Args:
        image_size: 图像大小
        augmentation: 是否使用数据增强
    
    Returns:
        train_transform, val_transform
    """
    # ImageNet 标准化参数
    normalize = transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
    
    if augmentation:
        # 训练集：使用数据增强
        train_transform = transforms.Compose([
            transforms.RandomResizedCrop(image_size, scale=(0.8, 1.0)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
            transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
            transforms.ToTensor(),
            normalize,
            transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),  # 随机擦除
        ])
    else:
        train_transform = transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            normalize,
        ])
    
    # 验证集/测试集：不做增强
    val_transform = transforms.Compose([
        transforms.Resize(int(image_size * 1.14)),  # 稍大一些
        transforms.CenterCrop(image_size),
        transforms.ToTensor(),
        normalize,
    ])
    
    return train_transform, val_transform
```

### 第三步：定义模型

```python
# models/resnet.py
import torch
import torch.nn as nn
from torchvision import models

def create_resnet_model(num_classes, pretrained=True, freeze_backbone=False):
    """
    创建 ResNet 模型
    
    Args:
        num_classes: 类别数
        pretrained: 是否使用预训练权重
        freeze_backbone: 是否冻结骨干网络
    
    Returns:
        model
    """
    # 加载预训练 ResNet-50
    if pretrained:
        weights = models.ResNet50_Weights.DEFAULT
        model = models.resnet50(weights=weights)
    else:
        model = models.resnet50(weights=None)
    
    # 冻结骨干网络（可选）
    if freeze_backbone:
        for param in model.parameters():
            param.requires_grad = False
    
    # 替换分类头
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(p=0.3),
        nn.Linear(512, num_classes)
    )
    
    return model

def create_efficientnet_model(num_classes, pretrained=True):
    """
    创建 EfficientNet 模型
    
    Args:
        num_classes: 类别数
        pretrained: 是否使用预训练权重
    
    Returns:
        model
    """
    if pretrained:
        weights = models.EfficientNet_B0_Weights.DEFAULT
        model = models.efficientnet_b0(weights=weights)
    else:
        model = models.efficientnet_b0(weights=None)
    
    # 替换分类头
    num_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(num_features, num_classes)
    )
    
    return model
```

### 第四步：训练器

```python
# training/trainer.py
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
import os
from tqdm import tqdm
import json
from datetime import datetime

class Trainer:
    """模型训练器"""
    
    def __init__(self, model, train_loader, val_loader, config):
        """
        Args:
            model: 模型
            train_loader: 训练数据加载器
            val_loader: 验证数据加载器
            config: 配置字典
        """
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.config = config
        
        # 设备
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self.model.to(self.device)
        
        # 损失函数
        self.criterion = nn.CrossEntropyLoss()
        
        # 优化器（分层学习率）
        backbone_params = [p for n, p in model.named_parameters() 
                          if 'fc' not in n and p.requires_grad]
        head_params = [p for n, p in model.named_parameters() 
                      if 'fc' in n and p.requires_grad]
        
        self.optimizer = AdamW([
            {'params': backbone_params, 'lr': config.get('backbone_lr', 1e-5)},
            {'params': head_params, 'lr': config.get('head_lr', 1e-3)},
        ], weight_decay=config.get('weight_decay', 1e-4))
        
        # 学习率调度器
        self.scheduler = CosineAnnealingLR(
            self.optimizer, 
            T_max=config.get('epochs', 50),
            eta_min=config.get('min_lr', 1e-6)
        )
        
        # 训练历史
        self.history = {
            'train_loss': [],
            'train_acc': [],
            'val_loss': [],
            'val_acc': [],
            'lr': []
        }
        
        # 最佳模型
        self.best_val_acc = 0.0
        
        # 日志目录
        self.log_dir = config.get('log_dir', 'logs')
        os.makedirs(self.log_dir, exist_ok=True)
        
        # 检查点目录
        self.checkpoint_dir = config.get('checkpoint_dir', 'checkpoints')
        os.makedirs(self.checkpoint_dir, exist_ok=True)
    
    def train_epoch(self):
        """训练一个 epoch"""
        self.model.train()
        
        running_loss = 0.0
        correct = 0
        total = 0
        
        pbar = tqdm(self.train_loader, desc='Training')
        for images, labels in pbar:
            images = images.to(self.device)
            labels = labels.to(self.device)
            
            # 前向传播
            outputs = self.model(images)
            loss = self.criterion(outputs, labels)
            
            # 反向传播
            self.optimizer.zero_grad()
            loss.backward()
            
            # 梯度裁剪
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            
            self.optimizer.step()
            
            # 统计
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            # 更新进度条
            pbar.set_postfix({
                'loss': running_loss / (pbar.n + 1),
                'acc': 100. * correct / total
            })
        
        epoch_loss = running_loss / len(self.train_loader)
        epoch_acc = 100. * correct / total
        
        return epoch_loss, epoch_acc
    
    def validate(self):
        """验证模型"""
        self.model.eval()
        
        running_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for images, labels in tqdm(self.val_loader, desc='Validating'):
                images = images.to(self.device)
                labels = labels.to(self.device)
                
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                
                running_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()
        
        epoch_loss = running_loss / len(self.val_loader)
        epoch_acc = 100. * correct / total
        
        return epoch_loss, epoch_acc
    
    def train(self, num_epochs):
        """完整训练流程"""
        print(f"开始训练，共 {num_epochs} 个 epoch")
        print(f"设备: {self.device}")
        print(f"训练集: {len(self.train_loader.dataset)} 张图像")
        print(f"验证集: {len(self.val_loader.dataset)} 张图像")
        print("-" * 50)
        
        for epoch in range(num_epochs):
            print(f"\nEpoch {epoch + 1}/{num_epochs}")
            
            # 训练
            train_loss, train_acc = self.train_epoch()
            
            # 验证
            val_loss, val_acc = self.validate()
            
            # 更新学习率
            self.scheduler.step()
            
            # 记录历史
            self.history['train_loss'].append(train_loss)
            self.history['train_acc'].append(train_acc)
            self.history['val_loss'].append(val_loss)
            self.history['val_acc'].append(val_acc)
            self.history['lr'].append(self.optimizer.param_groups[1]['lr'])  # 分类头学习率
            
            # 打印结果
            print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
            print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
            print(f"Learning Rate: {self.optimizer.param_groups[1]['lr']:.6f}")
            
            # 保存最佳模型
            if val_acc > self.best_val_acc:
                self.best_val_acc = val_acc
                self.save_checkpoint(epoch + 1, is_best=True)
                print(f"✓ 保存最佳模型 (Val Acc: {val_acc:.2f}%)")
            
            # 定期保存检查点
            if (epoch + 1) % 10 == 0:
                self.save_checkpoint(epoch + 1)
        
        # 保存训练历史
        self.save_history()
        
        print("\n" + "=" * 50)
        print(f"训练完成！最佳验证准确率: {self.best_val_acc:.2f}%")
        print("=" * 50)
    
    def save_checkpoint(self, epoch, is_best=False):
        """保存检查点"""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'best_val_acc': self.best_val_acc,
            'history': self.history,
        }
        
        if is_best:
            path = os.path.join(self.checkpoint_dir, 'best_model.pth')
        else:
            path = os.path.join(self.checkpoint_dir, f'checkpoint_epoch_{epoch}.pth')
        
        torch.save(checkpoint, path)
    
    def save_history(self):
        """保存训练历史"""
        path = os.path.join(self.log_dir, 'training_history.json')
        with open(path, 'w') as f:
            json.dump(self.history, f, indent=2)
        print(f"训练历史已保存到: {path}")
```

### 第五步：训练脚本

```python
# scripts/train.py
import argparse
import yaml
from torch.utils.data import DataLoader
from training.dataset import ImageClassificationDataset
from training.transforms import get_transforms
from training.trainer import Trainer
from models.resnet import create_resnet_model

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default='configs/default.yaml')
    args = parser.parse_args()
    
    # 加载配置
    with open(args.config, 'r') as f:
        config = yaml.safe_load(f)
    
    print("配置信息:")
    for k, v in config.items():
        print(f"  {k}: {v}")
    print("-" * 50)
    
    # 数据变换
    train_transform, val_transform = get_transforms(
        image_size=config['image_size'],
        augmentation=True
    )
    
    # 数据集
    train_dataset = ImageClassificationDataset(
        root_dir=config['data_dir'],
        split='train',
        transform=train_transform
    )
    
    val_dataset = ImageClassificationDataset(
        root_dir=config['data_dir'],
        split='val',
        transform=val_transform
    )
    
    # 数据加载器
    train_loader = DataLoader(
        train_dataset,
        batch_size=config['batch_size'],
        shuffle=True,
        num_workers=config['num_workers'],
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=config['batch_size'],
        shuffle=False,
        num_workers=config['num_workers'],
        pin_memory=True
    )
    
    # 创建模型
    model = create_resnet_model(
        num_classes=len(train_dataset.classes),
        pretrained=config['pretrained'],
        freeze_backbone=config.get('freeze_backbone', False)
    )
    
    print(f"\n模型参数量: {sum(p.numel() for p in model.parameters()):,}")
    print(f"可训练参数: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")
    
    # 创建训练器
    trainer = Trainer(model, train_loader, val_loader, config)
    
    # 开始训练
    trainer.train(config['epochs'])

if __name__ == '__main__':
    main()
```

### 第六步：配置文件

```yaml
# configs/default.yaml
# 数据配置
data_dir: "data/processed"
image_size: 224
num_workers: 4

# 模型配置
pretrained: true
freeze_backbone: false

# 训练配置
batch_size: 32
epochs: 50
backbone_lr: 1.0e-5
head_lr: 1.0e-3
weight_decay: 1.0e-4
min_lr: 1.0e-6

# 输出配置
log_dir: "logs"
checkpoint_dir: "checkpoints"
```

### 第七步：评估脚本

```python
# scripts/evaluate.py
import argparse
import torch
from torch.utils.data import DataLoader
from training.dataset import ImageClassificationDataset
from training.transforms import get_transforms
from models.resnet import create_resnet_model
from evaluation.metrics import calculate_metrics
from evaluation.visualizer import plot_confusion_matrix, plot_training_history
import json

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkpoint', type=str, required=True)
    parser.add_argument('--data_dir', type=str, required=True)
    parser.add_argument('--output_dir', type=str, default='evaluation_results')
    args = parser.parse_args()
    
    # 加载检查点
    checkpoint = torch.load(args.checkpoint, map_location='cpu')
    config = checkpoint.get('config', {})
    
    # 数据变换
    _, val_transform = get_transforms(image_size=224, augmentation=False)
    
    # 测试集
    test_dataset = ImageClassificationDataset(
        root_dir=args.data_dir,
        split='test',
        transform=val_transform
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=32,
        shuffle=False,
        num_workers=4
    )
    
    # 创建模型
    model = create_resnet_model(
        num_classes=len(test_dataset.classes),
        pretrained=False
    )
    model.load_state_dict(checkpoint['model_state_dict'])
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    model.eval()
    
    # 收集预测结果
    all_preds = []
    all_labels = []
    all_probs = []
    
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, preds = outputs.max(1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy())
    
    # 计算指标
    metrics = calculate_metrics(all_labels, all_preds, all_probs, test_dataset.classes)
    
    # 打印结果
    print("\n测试集评估结果:")
    print("=" * 50)
    print(f"准确率: {metrics['accuracy']:.4f}")
    print(f"精确率: {metrics['precision']:.4f}")
    print(f"召回率: {metrics['recall']:.4f}")
    print(f"F1 分数: {metrics['f1']:.4f}")
    
    print("\n分类报告:")
    print(metrics['classification_report'])
    
    # 可视化
    import os
    os.makedirs(args.output_dir, exist_ok=True)
    
    # 混淆矩阵
    plot_confusion_matrix(
        all_labels, 
        all_preds, 
        test_dataset.classes,
        save_path=os.path.join(args.output_dir, 'confusion_matrix.png')
    )
    
    # 训练历史
    if 'history' in checkpoint:
        plot_training_history(
            checkpoint['history'],
            save_path=os.path.join(args.output_dir, 'training_history.png')
        )
    
    # 保存指标
    with open(os.path.join(args.output_dir, 'metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"\n评估结果已保存到: {args.output_dir}")

if __name__ == '__main__':
    main()
```

### 第八步：评估指标

```python
# evaluation/metrics.py
import numpy as np
from sklearn.metrics import (
    accuracy_score, 
    precision_score, 
    recall_score, 
    f1_score,
    classification_report,
    confusion_matrix
)

def calculate_metrics(y_true, y_pred, y_prob, class_names):
    """
    计算评估指标
    
    Args:
        y_true: 真实标签
        y_pred: 预测标签
        y_prob: 预测概率
        class_names: 类别名称
    
    Returns:
        指标字典
    """
    metrics = {
        'accuracy': accuracy_score(y_true, y_pred),
        'precision': precision_score(y_true, y_pred, average='macro'),
        'recall': recall_score(y_true, y_pred, average='macro'),
        'f1': f1_score(y_true, y_pred, average='macro'),
        'classification_report': classification_report(
            y_true, y_pred, target_names=class_names
        ),
        'confusion_matrix': confusion_matrix(y_true, y_pred).tolist()
    }
    
    return metrics
```

### 第九步：可视化

```python
# evaluation/visualizer.py
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import confusion_matrix

def plot_confusion_matrix(y_true, y_pred, class_names, save_path=None):
    """绘制混淆矩阵"""
    cm = confusion_matrix(y_true, y_pred)
    
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names)
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150)
        print(f"混淆矩阵已保存到: {save_path}")
    else:
        plt.show()
    
    plt.close()

def plot_training_history(history, save_path=None):
    """绘制训练历史"""
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    
    # 损失曲线
    axes[0].plot(history['train_loss'], label='Train')
    axes[0].plot(history['val_loss'], label='Validation')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].set_title('Training and Validation Loss')
    axes[0].legend()
    axes[0].grid(True)
    
    # 准确率曲线
    axes[1].plot(history['train_acc'], label='Train')
    axes[1].plot(history['val_acc'], label='Validation')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Accuracy (%)')
    axes[1].set_title('Training and Validation Accuracy')
    axes[1].legend()
    axes[1].grid(True)
    
    # 学习率曲线
    axes[2].plot(history['lr'])
    axes[2].set_xlabel('Epoch')
    axes[2].set_ylabel('Learning Rate')
    axes[2].set_title('Learning Rate Schedule')
    axes[2].grid(True)
    axes[2].set_yscale('log')
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150)
        print(f"训练历史已保存到: {save_path}")
    else:
        plt.show()
    
    plt.close()
```

### 第十步：FastAPI 部署

```python
# deployment/api.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
from torchvision import transforms
from PIL import Image
import io
import os

app = FastAPI(
    title="图像分类 API",
    description="基于 ResNet-50 的图像分类服务",
    version="1.0.0"
)

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载模型
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 从配置文件加载类别名称
CLASS_NAMES = ['cat', 'dog', 'bird']  # 根据实际情况修改

def load_model(checkpoint_path):
    """加载模型"""
    from models.resnet import create_resnet_model
    
    model = create_resnet_model(num_classes=len(CLASS_NAMES), pretrained=False)
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model = model.to(device)
    model.eval()
    
    return model

# 加载模型（启动时）
MODEL_PATH = os.getenv('MODEL_PATH', 'checkpoints/best_model.pth')
model = load_model(MODEL_PATH)

# 图像预处理
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "图像分类 API",
        "version": "1.0.0",
        "endpoints": {
            "/predict": "POST - 上传图像并预测",
            "/health": "GET - 健康检查"
        }
    }

@app.get("/health")
async def health():
    """健康检查"""
    return {
        "status": "healthy",
        "device": str(device),
        "model_loaded": True
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    预测图像类别
    
    Args:
        file: 上传的图像文件
    
    Returns:
        预测结果
    """
    # 检查文件类型
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="文件必须是图像")
    
    try:
        # 读取图像
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # 预处理
        input_tensor = transform(image).unsqueeze(0).to(device)
        
        # 推理
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
        
        # 构建响应
        result = {
            "predicted_class": CLASS_NAMES[predicted.item()],
            "confidence": confidence.item(),
            "probabilities": {
                class_name: prob.item()
                for class_name, prob in zip(CLASS_NAMES, probabilities[0])
            }
        }
        
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 第十一步：Docker 部署

```dockerfile
# deployment/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 下载模型（如果需要）
# RUN python -c "from models.resnet import create_resnet_model; ..."

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "deployment.api:app", "--host", "0.0.0.0", "--port", "8000"]
```

```txt
# requirements.txt
torch>=2.0.0
torchvision>=0.15.0
fastapi>=0.100.0
uvicorn>=0.23.0
python-multipart>=0.0.6
Pillow>=9.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
matplotlib>=3.7.0
seaborn>=0.12.0
tqdm>=4.65.0
PyYAML>=6.0
```

```bash
# 构建和运行 Docker 容器
docker build -f deployment/Dockerfile -t image-classifier .
docker run -p 8000:8000 -v $(pwd)/checkpoints:/app/checkpoints image-classifier
```

## 进阶用法

### 使用 TensorBoard 监控训练

```python
# training/trainer.py (增强版)
from torch.utils.tensorboard import SummaryWriter

class Trainer:
    def __init__(self, model, train_loader, val_loader, config):
        # ... 之前的初始化代码 ...
        
        # TensorBoard 日志
        self.writer = SummaryWriter(log_dir=os.path.join(self.log_dir, 'tensorboard'))
    
    def train_epoch(self, epoch):
        # ... 训练代码 ...
        
        # 记录到 TensorBoard
        self.writer.add_scalar('Loss/train', train_loss, epoch)
        self.writer.add_scalar('Accuracy/train', train_acc, epoch)
        self.writer.add_scalar('Learning_rate', self.optimizer.param_groups[1]['lr'], epoch)
        
        # 记录图像（每个 epoch 记录一批）
        images, labels = next(iter(self.train_loader))
        images = images.to(self.device)
        outputs = self.model(images)
        
        # 反标准化以便可视化
        inv_normalize = transforms.Normalize(
            mean=[-0.485/0.229, -0.456/0.224, -0.406/0.225],
            std=[1/0.229, 1/0.224, 1/0.225]
        )
        images = torch.stack([inv_normalize(img) for img in images.cpu()])
        images = torch.clamp(images, 0, 1)
        
        self.writer.add_images('Images', images, epoch)
    
    def validate(self, epoch):
        # ... 验证代码 ...
        
        self.writer.add_scalar('Loss/validation', val_loss, epoch)
        self.writer.add_scalar('Accuracy/validation', val_acc, epoch)
    
    def close(self):
        """关闭 TensorBoard"""
        self.writer.close()
```

```bash
# 启动 TensorBoard
tensorboard --logdir=logs/tensorboard
```

### 模型集成（Ensemble）

```python
# scripts/ensemble_predict.py
import torch
from models.resnet import create_resnet_model
from models.efficientnet import create_efficientnet_model

class EnsembleModel:
    """模型集成"""
    
    def __init__(self, model_paths, device='cuda'):
        self.device = device
        self.models = []
        
        for path in model_paths:
            checkpoint = torch.load(path, map_location=device)
            
            # 根据配置创建模型
            if 'resnet' in path:
                model = create_resnet_model(num_classes=3, pretrained=False)
            else:
                model = create_efficientnet_model(num_classes=3, pretrained=False)
            
            model.load_state_dict(checkpoint['model_state_dict'])
            model = model.to(device)
            model.eval()
            
            self.models.append(model)
    
    def predict(self, images):
        """集成预测"""
        all_probs = []
        
        with torch.no_grad():
            for model in self.models:
                outputs = model(images)
                probs = torch.softmax(outputs, dim=1)
                all_probs.append(probs)
        
        # 平均概率
        avg_probs = torch.stack(all_probs).mean(dim=0)
        _, predicted = avg_probs.max(1)
        
        return predicted, avg_probs
```

### 超参数搜索

```python
# scripts/hyperparameter_search.py
import optuna
from torch.utils.data import DataLoader
from training.dataset import ImageClassificationDataset
from training.transforms import get_transforms
from training.trainer import Trainer
from models.resnet import create_resnet_model

def objective(trial):
    """Optuna 目标函数"""
    # 定义超参数空间
    config = {
        'batch_size': trial.suggest_categorical('batch_size', [16, 32, 64]),
        'backbone_lr': trial.suggest_float('backbone_lr', 1e-6, 1e-4, log=True),
        'head_lr': trial.suggest_float('head_lr', 1e-4, 1e-2, log=True),
        'weight_decay': trial.suggest_float('weight_decay', 1e-5, 1e-3, log=True),
        'epochs': 30,  # 固定训练轮数
        'data_dir': 'data/processed',
        'image_size': 224,
        'num_workers': 4,
        'pretrained': True,
        'log_dir': f'logs/trial_{trial.number}',
        'checkpoint_dir': f'checkpoints/trial_{trial.number}'
    }
    
    # 数据
    train_transform, val_transform = get_transforms(image_size=224)
    train_dataset = ImageClassificationDataset(config['data_dir'], 'train', train_transform)
    val_dataset = ImageClassificationDataset(config['data_dir'], 'val', val_transform)
    
    train_loader = DataLoader(train_dataset, config['batch_size'], True, num_workers=4)
    val_loader = DataLoader(val_dataset, config['batch_size'], False, num_workers=4)
    
    # 模型
    model = create_resnet_model(len(train_dataset.classes), pretrained=True)
    
    # 训练
    trainer = Trainer(model, train_loader, val_loader, config)
    trainer.train(config['epochs'])
    
    # 返回最佳验证准确率
    return trainer.best_val_acc

if __name__ == '__main__':
    # 创建研究
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=20)
    
    # 打印最佳结果
    print("\n最佳超参数:")
    for key, value in study.best_params.items():
        print(f"  {key}: {value}")
    print(f"最佳验证准确率: {study.best_value:.2f}%")
```

## 核心知识点总结

| 阶段 | 关键技术 | 注意事项 |
|------|---------|---------|
| 数据准备 | 数据划分、数据增强 | 确保训练/验证/测试集不重叠 |
| 模型选择 | 迁移学习、预训练模型 | 根据数据量和任务复杂度选择 |
| 训练优化 | 分层学习率、学习率调度 | 骨干网络用小学习率，分类头用大学习率 |
| 评估分析 | 混淆矩阵、分类报告 | 关注每个类别的性能，不只是总体准确率 |
| 部署上线 | FastAPI、Docker | 考虑并发、延迟、错误处理 |

## 新手常见误区

### 误区 1：数据泄露

```python
# 错误：在数据增强时使用了测试集的信息
all_images = load_all_images()  # 包含测试集
mean = all_images.mean()  # 用全部数据计算均值

# 正确：只用训练集计算统计量
train_images = load_train_images()
mean = train_images.mean()
```

### 误区 2：过拟合验证集

```python
# 错误：频繁在验证集上评估并调整超参数
for epoch in range(100):
    train()
    val_acc = validate()
    if val_acc < threshold:
        adjust_hyperparameters()  # 根据验证集调整

# 正确：使用独立的测试集，只在最终评估时使用
# 验证集用于训练过程中的模型选择
# 测试集只在最后评估一次
```

### 误区 3：忽略类别不平衡

```python
# 错误：直接使用 CrossEntropyLoss
criterion = nn.CrossEntropyLoss()

# 正确：使用类别权重
class_counts = get_class_counts(train_dataset)
class_weights = 1.0 / torch.tensor(class_counts, dtype=torch.float)
class_weights = class_weights / class_weights.sum()
criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
```

### 误区 4：没有保存训练日志

```python
# 错误：不记录训练过程
for epoch in range(epochs):
    train_epoch()
    validate()
    # 什么都不记录

# 正确：记录所有关键信息
logger.info(f"Epoch {epoch}: train_loss={train_loss:.4f}, val_acc={val_acc:.2f}%")
writer.add_scalar('Loss/train', train_loss, epoch)
save_checkpoint(epoch, model, optimizer)
```

### 误区 5：部署时忘记模型预处理

```python
# 错误：直接输入原始图像
image = load_image(path)
output = model(image)  # 没有预处理

# 正确：应用与训练时相同的预处理
transform = get_inference_transform()
image = transform(image).unsqueeze(0).to(device)
with torch.no_grad():
    output = model(image)
```

## 项目总结

本章通过一个完整的图像分类项目，展示了深度学习从开发到部署的全流程：

1. **数据准备**：合理划分数据集，使用数据增强
2. **模型构建**：利用迁移学习快速构建高性能模型
3. **训练优化**：分层学习率、学习率调度、梯度裁剪
4. **评估分析**：全面的指标计算和可视化
5. **部署上线**：FastAPI 服务、Docker 容器化

这个项目可以很容易地扩展到其他任务：
- 目标检测：替换模型为 YOLO 或 Faster R-CNN
- 文本分类：替换数据加载器和模型为 BERT
- 图像分割：替换模型为 U-Net 或 DeepLab

关键是要理解每个环节的原理和最佳实践，这样才能在实际项目中灵活运用。

## 下一步学习建议

完成本教程后，你可以：

1. **深入学习特定领域**：计算机视觉、自然语言处理、语音识别
2. **阅读论文**：关注顶会论文（CVPR、ICCV、NeurIPS、ICML）
3. **参与开源项目**：Hugging Face、PyTorch、TensorFlow
4. **实践更多项目**：Kaggle 竞赛、实际业务问题
5. **学习 MLOps**：模型版本管理、自动化部署、监控

深度学习是一个快速发展的领域，保持学习的热情和实践的习惯，你就能在这个领域取得成功！
