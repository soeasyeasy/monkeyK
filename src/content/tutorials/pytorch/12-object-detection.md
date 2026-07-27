---
title: "第12章：目标检测实战"
description: "掌握目标检测原理、YOLO、Anchor、边界框回归，实现目标检测应用"
---

# 第12章：目标检测实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是目标检测？和图像分类有什么区别？
- 目标检测的核心技术有哪些？
- YOLO 是什么？为什么它这么快？
- 如何实现一个简单的目标检测应用？

这一章就是为了解答这些问题。目标检测是计算机视觉的核心任务，在自动驾驶、安防监控、医疗影像等领域有广泛应用。

---

## 1 为什么需要目标检测？

### 痛点分析

想象一下自动驾驶场景：

**图像分类**：只能告诉你"这是一张有车的图片"，但不知道车在哪里、有多少辆车。

**目标检测**：能告诉你"图片中有 3 辆车、2 个行人"，并给出它们的具体位置。

### 目标检测 vs 图像分类

```
图像分类：
输入：一张图片
输出：类别标签（如"猫"）

目标检测：
输入：一张图片
输出：多个边界框 + 类别标签
     - 框1：[x1, y1, x2, y2]，类别"猫"，置信度 0.95
     - 框2：[x1, y1, x2, y2]，类别"狗"，置信度 0.87
```

> **一句话总结**：目标检测 = 图像分类 + 定位，既要知道"是什么"，也要知道"在哪里"。

---

## 2 核心原理

### 目标检测任务

打个比方：

> 目标检测像找茬游戏：不仅要识别出图中的物体，还要用框把它们标出来。

### 目标检测的核心问题

1. **分类**：这个物体是什么类别？
2. **定位**：物体的边界框在哪里？
3. **数量**：图中有多少个物体？

### 两阶段 vs 单阶段

| 方法 | 代表算法 | 速度 | 精度 | 特点 |
| --- | --- | --- | --- | --- |
| 两阶段 | R-CNN, Faster R-CNN | 慢 | 高 | 先生成候选框，再分类 |
| 单阶段 | YOLO, SSD | 快 | 中 | 直接预测边界框和类别 |

---

## 3 边界框表示

### 边界框格式

```python
import torch

# 格式1：[x_min, y_min, x_max, y_max]
# 左上角和右下角坐标
bbox1 = torch.tensor([100, 50, 300, 200])

# 格式2：[x_center, y_center, width, height]
# 中心点坐标和宽高
bbox2 = torch.tensor([200, 125, 200, 150])

# 格式转换函数
def xyxy_to_xywh(bbox):
    """[x_min, y_min, x_max, y_max] -> [x_center, y_center, width, height]"""
    x_min, y_min, x_max, y_max = bbox
    x_center = (x_min + x_max) / 2
    y_center = (y_min + y_max) / 2
    width = x_max - x_min
    height = y_max - y_min
    return torch.tensor([x_center, y_center, width, height])

def xywh_to_xyxy(bbox):
    """[x_center, y_center, width, height] -> [x_min, y_min, x_max, y_max]"""
    x_center, y_center, width, height = bbox
    x_min = x_center - width / 2
    y_min = y_center - height / 2
    x_max = x_center + width / 2
    y_max = y_center + height / 2
    return torch.tensor([x_min, y_min, x_max, y_max])

# 测试
bbox_xyxy = torch.tensor([100, 50, 300, 200])
bbox_xywh = xyxy_to_xywh(bbox_xyxy)
print(f"xyxy: {bbox_xyxy}")
print(f"xywh: {bbox_xywh}")
```

---

## 4 IoU（交并比）

### IoU 计算

IoU 用于衡量预测框和真实框的重合程度：

```
IoU = 交集面积 / 并集面积
```

```python
import torch

def compute_iou(box1, box2):
    """
    计算两个边界框的 IoU
    box1, box2: [x_min, y_min, x_max, y_max]
    """
    # 计算交集区域
    x_min = max(box1[0], box2[0])
    y_min = max(box1[1], box2[1])
    x_max = min(box1[2], box2[2])
    y_max = min(box1[3], box2[3])

    # 交集面积
    intersection = max(0, x_max - x_min) * max(0, y_max - y_min)

    # 计算各自面积
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])

    # 并集面积
    union = area1 + area2 - intersection

    # IoU
    iou = intersection / union
    return iou

# 测试
box1 = torch.tensor([100, 100, 200, 200])
box2 = torch.tensor([150, 150, 250, 250])
iou = compute_iou(box1, box2)
print(f"IoU: {iou:.4f}")
```

---

## 5 非极大值抑制（NMS）

### NMS 原理

NMS 用于去除重叠的冗余检测框：

1. 按置信度排序
2. 选择最高置信度的框
3. 计算与其他框的 IoU，去除 IoU 大于阈值的框
4. 重复直到处理完所有框

```python
import torch

def nms(boxes, scores, iou_threshold=0.5):
    """
    非极大值抑制
    boxes: [N, 4]，格式 [x_min, y_min, x_max, y_max]
    scores: [N]，置信度分数
    iou_threshold: IoU 阈值
    """
    # 按置信度排序
    order = scores.argsort(descending=True)
    keep = []

    while order.numel() > 0:
        if order.numel() == 1:
            keep.append(order.item())
            break

        # 选择最高置信度的框
        i = order[0].item()
        keep.append(i)

        # 计算与剩余框的 IoU
        ious = torch.tensor([compute_iou(boxes[i], boxes[j]) for j in order[1:]])

        # 保留 IoU 小于阈值的框
        mask = ious <= iou_threshold
        order = order[1:][mask]

    return torch.tensor(keep)

# 测试
boxes = torch.tensor([
    [100, 100, 200, 200],
    [110, 110, 210, 210],
    [300, 300, 400, 400],
    [310, 310, 410, 410]
])
scores = torch.tensor([0.9, 0.8, 0.7, 0.6])

keep = nms(boxes, scores, iou_threshold=0.5)
print(f"保留的索引: {keep}")
```

---

## 6 YOLO 原理

### YOLO 核心思想

YOLO（You Only Look Once）将目标检测转化为回归问题：

1. 将图像分成 S×S 的网格
2. 每个网格预测 B 个边界框和置信度
3. 每个网格预测 C 个类别的概率
4. 使用 NMS 后处理

### YOLO 输出

```
输入：448×448 图像
网格：7×7
每个网格：2 个边界框，20 个类别

输出张量：7×7×(2×5 + 20) = 7×7×30
- 每个边界框：[x, y, w, h, confidence]
- 每个网格：20 个类别概率
```

---

## 7 使用预训练目标检测模型

### torchvision 预训练模型

```python
import torch
from torchvision import models, transforms
from PIL import Image
import matplotlib.pyplot as plt

# 加载预训练的 Faster R-CNN
model = models.detection.fasterrcnn_resnet50_fpn(weights=models.FasterRCNN_ResNet50_FPN_Weights.DEFAULT)
model.eval()

# 数据预处理
transform = transforms.Compose([
    transforms.ToTensor()
])

# 加载图像
image = Image.open('image.jpg')
image_tensor = transform(image)

# 推理
with torch.no_grad():
    predictions = model([image_tensor])

# 解析结果
prediction = predictions[0]
boxes = prediction['boxes']
labels = prediction['labels']
scores = prediction['scores']

print(f"检测到 {len(boxes)} 个物体")
for i, (box, label, score) in enumerate(zip(boxes, labels, scores)):
    if score > 0.5:
        print(f"物体 {i+1}: 类别 {label.item()}, 置信度 {score:.4f}, 位置 {box.tolist()}")
```

### COCO 数据集类别

```python
# COCO 数据集有 91 个类别
COCO_CLASSES = [
    '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane',
    'bus', 'train', 'truck', 'boat', 'traffic light', 'fire hydrant',
    'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse',
    'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
    # ... 更多类别
]

# 可视化检测结果
def visualize_detections(image, boxes, labels, scores, threshold=0.5):
    fig, ax = plt.subplots(1, figsize=(12, 8))
    ax.imshow(image)

    for box, label, score in zip(boxes, labels, scores):
        if score > threshold:
            x_min, y_min, x_max, y_max = box
            ax.add_patch(plt.Rectangle(
                (x_min, y_min), x_max - x_min, y_max - y_min,
                fill=False, color='red', linewidth=2
            ))
            ax.text(x_min, y_min - 5, f'{COCO_CLASSES[label.item()]}: {score:.2f}',
                   bbox=dict(facecolor='yellow', alpha=0.5))

    plt.axis('off')
    plt.show()
```

---

## 8 自定义目标检测数据集

### 数据集格式

```python
import torch
from torch.utils.data import Dataset
import os
import json
from PIL import Image

class DetectionDataset(Dataset):
    def __init__(self, root_dir, annotation_file, transform=None):
        self.root_dir = root_dir
        self.transform = transform

        # 加载标注
        with open(annotation_file, 'r') as f:
            self.annotations = json.load(f)

    def __len__(self):
        return len(self.annotations)

    def __getitem__(self, idx):
        ann = self.annotations[idx]
        img_path = os.path.join(self.root_dir, ann['image'])
        image = Image.open(img_path).convert('RGB')

        # 解析标注
        boxes = []
        labels = []
        for obj in ann['objects']:
            boxes.append(obj['bbox'])  # [x_min, y_min, x_max, y_max]
            labels.append(obj['label'])

        # 转换为张量
        boxes = torch.tensor(boxes, dtype=torch.float32)
        labels = torch.tensor(labels, dtype=torch.int64)

        # 数据增强
        if self.transform:
            image = self.transform(image)

        # 目标检测需要的目标格式
        target = {
            'boxes': boxes,
            'labels': labels,
            'image_id': torch.tensor([idx])
        }

        return image, target

# 标注文件格式（JSON）
# [
#   {
#     "image": "image1.jpg",
#     "objects": [
#       {"bbox": [100, 100, 200, 200], "label": 1},
#       {"bbox": [300, 300, 400, 400], "label": 2}
#     ]
#   }
# ]
```

---

## 9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 目标检测 | 分类 + 定位 |
| 边界框 | [x_min, y_min, x_max, y_max] 或 [x_center, y_center, w, h] |
| IoU | 交并比，衡量框的重合程度 |
| NMS | 非极大值抑制，去除冗余框 |
| YOLO | 单阶段检测，速度快 |
| 两阶段 | Faster R-CNN，精度高 |

---

## 10 新手常见误区

### 误区 1："目标检测和图像分类一样"

**错！** 目标检测需要定位物体，输出边界框。

正确做法：理解目标检测是分类 + 定位的组合任务。

### 误区 2："IoU 阈值越高越好"

不是的。阈值太高会漏检，太低会有冗余。

正确做法：根据任务调整 IoU 阈值，通常 0.5 是常用值。

### 误区 3："NMS 会去除所有重叠框"

实际上 NMS 只去除 IoU 大于阈值的框，保留最高置信度的框。

正确做法：理解 NMS 的原理，合理设置阈值。

---

## 11 动手练习

### 练习 1：基础练习

实现 IoU 计算函数，计算两个边界框的交并比。

<details>
<summary>点击查看答案</summary>

```python
import torch

def compute_iou(box1, box2):
    """
    计算两个边界框的 IoU
    box1, box2: [x_min, y_min, x_max, y_max]
    """
    # 计算交集区域
    x_min = max(box1[0], box2[0])
    y_min = max(box1[1], box2[1])
    x_max = min(box1[2], box2[2])
    y_max = min(box1[3], box2[3])

    # 交集面积
    intersection = max(0, x_max - x_min) * max(0, y_max - y_min)

    # 计算各自面积
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])

    # 并集面积
    union = area1 + area2 - intersection

    # IoU
    iou = intersection / union
    return iou

# 测试
box1 = torch.tensor([100, 100, 200, 200])
box2 = torch.tensor([150, 150, 250, 250])
iou = compute_iou(box1, box2)
print(f"IoU: {iou:.4f}")

# 完全重合
box3 = torch.tensor([100, 100, 200, 200])
print(f"完全重合 IoU: {compute_iou(box1, box3):.4f}")

# 不重合
box4 = torch.tensor([300, 300, 400, 400])
print(f"不重合 IoU: {compute_iou(box1, box4):.4f}")
```

</details>

### 练习 2：进阶练习

实现 NMS 算法，去除重叠的检测框。

<details>
<summary>点击查看答案</summary>

```python
import torch

def compute_iou(box1, box2):
    x_min = max(box1[0], box2[0])
    y_min = max(box1[1], box2[1])
    x_max = min(box1[2], box2[2])
    y_max = min(box1[3], box2[3])
    intersection = max(0, x_max - x_min) * max(0, y_max - y_min)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - intersection
    return intersection / union

def nms(boxes, scores, iou_threshold=0.5):
    """
    非极大值抑制
    boxes: [N, 4]
    scores: [N]
    """
    order = scores.argsort(descending=True)
    keep = []

    while order.numel() > 0:
        if order.numel() == 1:
            keep.append(order.item())
            break

        i = order[0].item()
        keep.append(i)

        ious = torch.tensor([compute_iou(boxes[i], boxes[j]) for j in order[1:]])
        mask = ious <= iou_threshold
        order = order[1:][mask]

    return torch.tensor(keep)

# 测试
boxes = torch.tensor([
    [100, 100, 200, 200],
    [110, 110, 210, 210],
    [300, 300, 400, 400],
    [310, 310, 410, 410]
])
scores = torch.tensor([0.9, 0.8, 0.7, 0.6])

keep = nms(boxes, scores, iou_threshold=0.5)
print(f"保留的索引: {keep}")
print(f"保留的框:\n{boxes[keep]}")
print(f"保留的分数: {scores[keep]}")
```

</details>

### 练习 3（挑战）：综合练习

使用预训练的 Faster R-CNN 进行目标检测，并可视化结果。

<details>
<summary>点击查看答案</summary>

```python
import torch
from torchvision import models, transforms, utils
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# 加载预训练模型
model = models.detection.fasterrcnn_resnet50_fpn(weights=models.FasterRCNN_ResNet50_FPN_Weights.DEFAULT)
model.eval()

# 数据预处理
transform = transforms.Compose([
    transforms.ToTensor()
])

# 加载图像
image = Image.open('test_image.jpg').convert('RGB')
image_tensor = transform(image)

# 推理
with torch.no_grad():
    predictions = model([image_tensor])

# 解析结果
prediction = predictions[0]
boxes = prediction['boxes']
labels = prediction['labels']
scores = prediction['scores']

# COCO 类别（简化版）
COCO_CLASSES = [
    '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane',
    'bus', 'train', 'truck', 'boat', 'traffic light'
]

# 可视化
fig, ax = plt.subplots(1, figsize=(12, 8))
ax.imshow(image)

colors = ['red', 'blue', 'green', 'yellow', 'purple']
for i, (box, label, score) in enumerate(zip(boxes, labels, scores)):
    if score > 0.5:
        x_min, y_min, x_max, y_max = box
        rect = patches.Rectangle(
            (x_min, y_min), x_max - x_min, y_max - y_min,
            linewidth=2, edgecolor=colors[i % len(colors)], facecolor='none'
        )
        ax.add_patch(rect)

        label_name = COCO_CLASSES[label.item()] if label.item() < len(COCO_CLASSES) else f'class_{label.item()}'
        ax.text(x_min, y_min - 5, f'{label_name}: {score:.2f}',
               bbox=dict(facecolor=colors[i % len(colors)], alpha=0.5, edgecolor='none'))

plt.axis('off')
plt.tight_layout()
plt.savefig('detection_result.png', dpi=150, bbox_inches='tight')
plt.show()

print(f"检测到 {len(boxes)} 个物体")
for i, (box, label, score) in enumerate(zip(boxes, labels, scores)):
    if score > 0.5:
        print(f"物体 {i+1}: 类别 {label.item()}, 置信度 {score:.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **语义分割实战**——如何对图像中的每个像素进行分类。你会学到图像分割的原理，以及如何使用 U-Net 等模型进行像素级分类。