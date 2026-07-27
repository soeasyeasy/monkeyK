---
title: "第12章：目标检测实战"
description: "掌握 TensorFlow/Keras 中目标检测原理，实现物体定位与识别"
---

# 第12章：目标检测实战

## 1. 本章导读

在开始学习目标检测之前，你可能会有这些疑问：

- 什么是目标检测？和图像分类有什么不同？
- 目标检测的输出是什么？如何表示检测到的物体？
- YOLO 是什么？为什么它这么流行？
- 如何训练自己的目标检测模型？
- 目标检测有哪些评价指标？

这一章就是为了解答这些问题。目标检测是计算机视觉中最实用的技术之一，它不仅能识别图像中有什么，还能告诉你物体在哪里。

---

## 2. 为什么需要目标检测？

### 痛点分析

**图像分类的局限**：

想象一下你有一张街景照片：

- **图像分类**：只能告诉你"这是一张街景"
- **目标检测**：能告诉你"照片里有3个人、2辆车、1个红绿灯，以及它们的位置"

**实际应用场景**：
- 自动驾驶：检测行人、车辆、交通标志
- 安防监控：检测异常行为、入侵者
- 人脸识别：定位人脸位置
- 工业质检：检测产品缺陷
- 医学影像：定位病灶区域

### 生活化类比

> 目标检测就像玩"找不同"游戏：
> - **图像分类**：告诉你这张图里有猫
> - **目标检测**：不仅告诉你有猫，还用框标出猫在哪里
> - 就像用荧光笔在书上标记重点，既知道内容，又知道位置

### 目标检测 vs 图像分类

```
图像分类：
输入：一张图片
输出：类别标签（猫、狗、车...）

目标检测：
输入：一张图片
输出：
  - 类别标签（猫、狗、车...）
  - 边界框位置（x, y, width, height）
  - 置信度分数（0-1之间）
```

> **一句话总结**：目标检测 = 图像分类 + 物体定位，既知道"是什么"，又知道"在哪里"。

---

## 3. 核心原理讲解

### 目标检测的基本任务

打个比方：

> 目标检测像考试阅卷：
> - **定位**：找到答案在哪里（画框）
> - **分类**：判断答案是什么（识别）
> - **评分**：给出置信度（有多确定）

### 边界框表示

**边界框（Bounding Box）**：
```
两种表示方式：

1. (x_min, y_min, x_max, y_max)
   - 左上角和右下角坐标
   
2. (x_center, y_center, width, height)
   - 中心点坐标和宽高

示例：
图片大小：640x480
边界框：(100, 150, 300, 400)
表示：左上角(100,150)，右下角(300,400)
```

### 目标检测算法分类

**两阶段检测器**：
- **R-CNN**：先生成候选区域，再分类
- **Fast R-CNN**：改进版，速度更快
- **Faster R-CNN**：使用 RPN 生成候选区域

**单阶段检测器**：
- **YOLO**：一次性预测所有物体
- **SSD**：多尺度特征检测
- **RetinaNet**：解决类别不平衡

### YOLO 的核心思想

> YOLO（You Only Look Once）像一眼扫过图片：
> - 把图片分成 S×S 的网格
> - 每个网格预测 B 个边界框
> - 每个边界框包含：位置、置信度、类别概率
> - 一次性完成，速度非常快

### YOLO 的工作流程

```
YOLO 检测流程：
1. 输入图像（416×416）
   ↓
2. 特征提取（CNN）
   ↓
3. 分成 13×13 网格
   ↓
4. 每个网格预测 5 个边界框
   ↓
5. 每个边界框包含：
   - (x, y, w, h)：位置
   - 置信度：是否有物体
   - 类别概率：是什么物体
   ↓
6. 非极大值抑制（NMS）
   - 去除重复的检测框
   - 保留置信度最高的框
   ↓
7. 输出最终结果
```

### 评价指标

**IoU（Intersection over Union）**：
```
IoU = 交集面积 / 并集面积

预测框：A
真实框：B
IoU = (A ∩ B) / (A ∪ B)

IoU > 0.5：通常认为是好的检测
```

**mAP（mean Average Precision）**：
- AP：单个类别的平均精度
- mAP：所有类别 AP 的平均值
- mAP > 0.5：好的模型
- mAP > 0.7：优秀的模型

> **一句话总结**：目标检测通过边界框定位和分类，实现物体的识别和定位。

---

## 4. 基础用法 + 逐行注释

### 4.1 使用预训练 YOLOv3 进行检测

```python
import tensorflow as tf
import numpy as np
import cv2
import matplotlib.pyplot as plt

# 加载预训练的 YOLOv3 模型
# TensorFlow Hub 提供了 YOLOv3 的实现
import tensorflow_hub as hub

# 加载模型
detector = hub.load("https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2")

# 读取图像
image_path = 'test_image.jpg'
image = cv2.imread(image_path)
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# 转换为张量
image_tensor = tf.convert_to_tensor(image_rgb, dtype=tf.uint8)

# 添加批次维度
image_tensor = tf.expand_dims(image_tensor, axis=0)

# 执行检测
results = detector(image_tensor)

# 解析结果
boxes = results['detection_boxes'][0].numpy()      # 边界框
classes = results['detection_classes'][0].numpy()  # 类别
scores = results['detection_scores'][0].numpy()    # 置信度

# 设置置信度阈值
confidence_threshold = 0.5

# 绘制检测结果
fig, ax = plt.subplots(1, figsize=(12, 8))
ax.imshow(image_rgb)

# COCO 数据集的类别名称
COCO_LABELS = {
    1: 'person', 2: 'bicycle', 3: 'car', 4: 'motorcycle',
    5: 'airplane', 6: 'bus', 7: 'train', 8: 'truck',
    # ... 更多类别
}

# 遍历检测结果
for i in range(len(scores)):
    score = scores[i]
    
    # 只绘制置信度高于阈值的检测
    if score > confidence_threshold:
        # 获取边界框坐标（归一化到 0-1）
        ymin, xmin, ymax, xmax = boxes[i]
        
        # 转换为像素坐标
        h, w = image_rgb.shape[:2]
        xmin = int(xmin * w)
        xmax = int(xmax * w)
        ymin = int(ymin * h)
        ymax = int(ymax * h)
        
        # 获取类别名称
        class_id = int(classes[i])
        class_name = COCO_LABELS.get(class_id, f'class_{class_id}')
        
        # 绘制边界框
        rect = plt.Rectangle(
            (xmin, ymin), 
            xmax - xmin, 
            ymax - ymin,
            fill=False, 
            edgecolor='red', 
            linewidth=2
        )
        ax.add_patch(rect)
        
        # 添加标签
        ax.text(
            xmin, ymin - 5,
            f'{class_name}: {score:.2f}',
            color='white',
            backgroundcolor='red',
            fontsize=10
        )

plt.axis('off')
plt.title('Object Detection Results')
plt.tight_layout()
plt.show()
```

### 4.2 使用 TensorFlow Object Detection API

```python
import tensorflow as tf
from object_detection.utils import label_map_util
from object_detection.utils import visualization_utils as viz_utils
from object_detection.builders import model_builder
import cv2
import numpy as np

# 配置路径
pipeline_config_path = 'path/to/pipeline.config'
checkpoint_path = 'path/to/checkpoint'

# 加载配置文件
from object_detection.utils import config_util
configs = config_util.get_configs_from_pipeline_file(pipeline_config_path)
model_config = configs['model']

# 构建模型
detection_model = model_builder.build(
    model_config=model_config, 
    is_training=False
)

# 恢复检查点
ckpt = tf.train.Checkpoint(model=detection_model)
ckpt.restore(checkpoint_path).expect_partial()

# 加载标签映射
label_map_path = 'path/to/label_map.pbtxt'
category_index = label_map_util.create_category_index_from_labelmap(
    label_map_path, 
    use_display_name=True
)

# 定义检测函数
@tf.function
def detect_fn(image):
    """检测单张图像"""
    image, shapes = detection_model.preprocess(image)
    prediction_dict = detection_model.predict(image, shapes)
    detections = detection_model.postprocess(prediction_dict, shapes)
    return detections

# 读取图像
image_path = 'test_image.jpg'
image = cv2.imread(image_path)
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# 转换为张量
image_tensor = tf.convert_to_tensor(image_rgb, dtype=tf.uint8)
image_tensor = tf.expand_dims(image_tensor, axis=0)

# 执行检测
detections = detect_fn(image_tensor)

# 解析结果
boxes = detections['detection_boxes'][0].numpy()
classes = detections['detection_classes'][0].numpy().astype(int)
scores = detections['detection_scores'][0].numpy()

# 可视化结果
image_with_detections = image_rgb.copy()
viz_utils.visualize_boxes_and_labels_on_image_array(
    image_with_detections,
    boxes,
    classes,
    scores,
    category_index,
    min_score_thresh=0.5,
    use_normalized_coordinates=True
)

# 显示结果
import matplotlib.pyplot as plt
plt.figure(figsize=(12, 8))
plt.imshow(image_with_detections)
plt.axis('off')
plt.show()
```

### 4.3 自定义目标检测模型（简化版）

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np

# 简化的目标检测模型
# 实际应用中建议使用 YOLO 或 SSD 等成熟架构

class SimpleObjectDetector(models.Model):
    def __init__(self, num_classes=10, num_anchors=5):
        super().__init__()
        
        # 特征提取器（使用预训练的 ResNet）
        self.backbone = tf.keras.applications.ResNet50(
            include_top=False,
            weights='imagenet',
            input_shape=(416, 416, 3)
        )
        
        # 冻结预训练层
        self.backbone.trainable = False
        
        # 检测头
        self.conv1 = layers.Conv2D(256, 3, padding='same', activation='relu')
        self.conv2 = layers.Conv2D(256, 3, padding='same', activation='relu')
        
        # 输出层
        # 每个位置预测 num_anchors 个边界框
        # 每个边界框包含：(x, y, w, h, confidence, class_probs)
        self.output_layer = layers.Conv2D(
            num_anchors * (5 + num_classes),  # 5 = x, y, w, h, confidence
            1, 
            padding='same'
        )
    
    def call(self, inputs):
        # 特征提取
        x = self.backbone(inputs)
        
        # 检测头
        x = self.conv1(x)
        x = self.conv2(x)
        
        # 输出预测
        outputs = self.output_layer(x)
        
        return outputs

# 创建模型
model = SimpleObjectDetector(num_classes=10, num_anchors=5)

# 查看模型结构
model.build(input_shape=(None, 416, 416, 3))
model.summary()

# 定义损失函数
def detection_loss(y_true, y_pred, num_classes=10):
    """
    目标检测损失函数
    y_true: 真实标签 (batch, grid_size, grid_size, num_anchors, 5+num_classes)
    y_pred: 预测结果 (batch, grid_size, grid_size, num_anchors*(5+num_classes))
    """
    # 重塑预测结果
    batch_size = tf.shape(y_pred)[0]
    grid_size = tf.shape(y_pred)[1]
    
    y_pred = tf.reshape(
        y_pred, 
        (batch_size, grid_size, grid_size, 5, 5 + num_classes)
    )
    
    # 分离各个部分
    pred_xy = y_pred[..., 0:2]      # 中心点坐标
    pred_wh = y_pred[..., 2:4]      # 宽高
    pred_conf = y_pred[..., 4:5]    # 置信度
    pred_class = y_pred[..., 5:]    # 类别概率
    
    # 分离真实标签
    true_xy = y_true[..., 0:2]
    true_wh = y_true[..., 2:4]
    true_conf = y_true[..., 4:5]
    true_class = y_true[..., 5:]
    
    # 坐标损失
    coord_loss = tf.reduce_sum(
        true_conf * (tf.square(pred_xy - true_xy) + tf.square(pred_wh - true_wh))
    )
    
    # 置信度损失
    conf_loss = tf.reduce_sum(
        tf.square(pred_conf - true_conf)
    )
    
    # 分类损失
    class_loss = tf.reduce_sum(
        true_conf * tf.nn.softmax_cross_entropy_with_logits(
            labels=true_class, 
            logits=pred_class
        )
    )
    
    # 总损失
    total_loss = coord_loss + conf_loss + class_loss
    
    return total_loss

# 编译模型
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss=detection_loss
)
```

### 4.4 数据准备和标注

```python
import tensorflow as tf
import numpy as np
import xml.etree.ElementTree as ET
import os
from pathlib import Path

# VOC 格式标注解析
def parse_voc_annotation(xml_path, image_dir):
    """
    解析 VOC 格式的 XML 标注文件
    返回图像路径和标注信息
    """
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    # 获取图像文件名
    filename = root.find('filename').text
    image_path = os.path.join(image_dir, filename)
    
    # 获取图像尺寸
    size = root.find('size')
    width = int(size.find('width').text)
    height = int(size.find('height').text)
    
    # 解析标注
    annotations = []
    for obj in root.findall('object'):
        # 类别名称
        class_name = obj.find('name').text
        
        # 边界框坐标
        bbox = obj.find('bndbox')
        xmin = int(bbox.find('xmin').text)
        ymin = int(bbox.find('ymin').text)
        xmax = int(bbox.find('xmax').text)
        ymax = int(bbox.find('ymax').text)
        
        # 归一化到 0-1
        xmin_norm = xmin / width
        ymin_norm = ymin / height
        xmax_norm = xmax / width
        ymax_norm = ymax / height
        
        annotations.append({
            'class': class_name,
            'bbox': [xmin_norm, ymin_norm, xmax_norm, ymax_norm]
        })
    
    return image_path, annotations

# 批量解析标注
def load_dataset(annotation_dir, image_dir, class_mapping):
    """
    加载数据集
    class_mapping: 类别名称到索引的映射
    """
    images = []
    labels = []
    
    xml_files = Path(annotation_dir).glob('*.xml')
    
    for xml_file in xml_files:
        image_path, annotations = parse_voc_annotation(str(xml_file), image_dir)
        
        # 转换标注格式
        bboxes = []
        classes = []
        
        for ann in annotations:
            bboxes.append(ann['bbox'])
            classes.append(class_mapping[ann['class']])
        
        images.append(image_path)
        labels.append({
            'bboxes': np.array(bboxes),
            'classes': np.array(classes)
        })
    
    return images, labels

# 创建类别映射
class_mapping = {
    'person': 0,
    'car': 1,
    'dog': 2,
    # ... 更多类别
}

# 加载数据集
images, labels = load_dataset(
    annotation_dir='annotations/',
    image_dir='images/',
    class_mapping=class_mapping
)

print(f'加载了 {len(images)} 张图像')
```

### 4.5 数据增强

```python
import tensorflow as tf
import albumentations as A
from albumentations import tensorflow as A_tf

# 使用 Albumentations 进行数据增强
def get_transforms():
    """定义数据增强策略"""
    return A.Compose([
        # 水平翻转
        A.HorizontalFlip(p=0.5),
        
        # 随机亮度对比度
        A.RandomBrightnessContrast(p=0.2),
        
        # 随机色调饱和度
        A.HueSaturationValue(p=0.2),
        
        # 随机缩放
        A.ShiftScaleRotate(
            shift_limit=0.1,
            scale_limit=0.2,
            rotate_limit=10,
            p=0.5
        ),
        
        # 随机裁剪
        A.RandomResizedCrop(
            height=416,
            width=416,
            scale=(0.8, 1.0),
            p=0.5
        ),
    ], bbox_params=A.BboxParams(
        format='pascal_voc',  # [x_min, y_min, x_max, y_max]
        label_fields=['class_labels']
    ))

# 应用增强
def augment_image(image, bboxes, class_labels):
    """对图像和标注同时进行增强"""
    transform = get_transforms()
    
    augmented = transform(
        image=image,
        bboxes=bboxes,
        class_labels=class_labels
    )
    
    return (
        augmented['image'],
        augmented['bboxes'],
        augmented['class_labels']
    )

# TensorFlow 数据管道
def create_dataset(images, labels, batch_size=16):
    """创建 TensorFlow 数据集"""
    
    def load_and_preprocess(image_path, label):
        # 读取图像
        image = tf.io.read_file(image_path)
        image = tf.image.decode_jpeg(image, channels=3)
        image = tf.image.resize(image, (416, 416))
        image = image / 255.0  # 归一化
        
        return image, label
    
    # 创建数据集
    dataset = tf.data.Dataset.from_tensor_slices((images, labels))
    
    # 加载和预处理
    dataset = dataset.map(
        load_and_preprocess,
        num_parallel_calls=tf.data.AUTOTUNE
    )
    
    # 批次和缓存
    dataset = dataset.batch(batch_size)
    dataset = dataset.prefetch(tf.data.AUTOTUNE)
    
    return dataset

# 使用示例
dataset = create_dataset(images, labels, batch_size=16)
```

---

## 5. 对比表格

### 目标检测算法对比

| 算法 | 类型 | 速度 | 精度 | 适用场景 |
|------|------|------|------|----------|
| Faster R-CNN | 两阶段 | 慢 | 高 | 精度要求高 |
| YOLOv3 | 单阶段 | 快 | 中 | 实时检测 |
| YOLOv5 | 单阶段 | 很快 | 高 | 实时+高精度 |
| SSD | 单阶段 | 快 | 中 | 移动端 |
| RetinaNet | 单阶段 | 中 | 高 | 小物体检测 |

### 边界框格式对比

| 格式 | 表示 | 优点 | 使用场景 |
|------|------|------|----------|
| (xmin, ymin, xmax, ymax) | 左上角+右下角 | 直观 | VOC 格式 |
| (x_center, y_center, w, h) | 中心点+宽高 | 对称 | YOLO 格式 |
| 归一化坐标 | 0-1 范围 | 尺度不变 | 通用 |

### 评价指标对比

| 指标 | 说明 | 计算方式 | 优秀标准 |
|------|------|----------|----------|
| IoU | 交并比 | 交集/并集 | > 0.5 |
| Precision | 精确率 | TP/(TP+FP) | > 0.8 |
| Recall | 召回率 | TP/(TP+FN) | > 0.8 |
| AP | 平均精度 | PR 曲线下面积 | > 0.7 |
| mAP | 平均 mAP | 所有类别 AP 平均 | > 0.5 |

---

## 6. 新手常见误区

### 误区1：目标检测和图像分类是一样的

❌ **错误想法**：目标检测就是分类，只是多了个框

✅ **实际情况**：
- 目标检测需要同时解决定位和分类两个问题
- 需要处理多个物体
- 需要处理不同大小的物体
- 损失函数更复杂

### 误区2：YOLO 只能检测小目标

❌ **错误想法**：YOLO 检测小目标效果差

✅ **实际情况**：
- YOLOv3 使用多尺度检测
- YOLOv5 改进了小目标检测
- 关键是选择合适的模型版本
- 数据增强也很重要

### 误区3：标注数据越多越好

❌ **错误想法**：标注 10 万张图片效果一定好

✅ **实际情况**：
- 数据质量比数量更重要
- 标注要准确，边界框要紧贴物体
- 类别要平衡，避免类别不平衡
- 数据增强可以替代部分标注工作

### 误区4：不需要非极大值抑制

❌ **错误写法**：
```python
# 直接使用所有预测框
for box in predictions:
    draw_box(box)  # 会有很多重复框
```

✅ **正确写法**：
```python
# 使用 NMS 去除重复框
boxes, scores, classes = nms(
    predictions,
    iou_threshold=0.5,
    max_boxes=100
)
for box, score, cls in zip(boxes, scores, classes):
    draw_box(box, score, cls)
```

### 误区5：忽略数据预处理

❌ **错误写法**：
```python
# 直接使用原始图像
image = cv2.imread('image.jpg')
model.predict(image)  # 效果差
```

✅ **正确写法**：
```python
# 正确的预处理
image = cv2.imread('image.jpg')
image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)  # 转 RGB
image = cv2.resize(image, (416, 416))  # 调整大小
image = image / 255.0  # 归一化
image = np.expand_dims(image, axis=0)  # 添加批次维度
model.predict(image)
```

---

## 7. 动手练习

### 练习1：基础 - 使用预训练模型检测

**任务**：使用 TensorFlow Hub 的 SSD 模型检测图像中的物体

**要求**：
- 加载预训练的 SSD 模型
- 检测一张图片中的物体
- 绘制边界框和标签

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
import tensorflow_hub as hub
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 加载模型
detector = hub.load("https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2")

# 读取图像
image = cv2.imread('test.jpg')
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# 检测
image_tensor = tf.convert_to_tensor(image_rgb, dtype=tf.uint8)
image_tensor = tf.expand_dims(image_tensor, axis=0)
results = detector(image_tensor)

# 解析结果
boxes = results['detection_boxes'][0].numpy()
classes = results['detection_classes'][0].numpy()
scores = results['detection_scores'][0].numpy()

# 绘制结果
fig, ax = plt.subplots(1, figsize=(12, 8))
ax.imshow(image_rgb)

for i in range(len(scores)):
    if scores[i] > 0.5:
        ymin, xmin, ymax, xmax = boxes[i]
        h, w = image_rgb.shape[:2]
        xmin, xmax = int(xmin * w), int(xmax * w)
        ymin, ymax = int(ymin * h), int(ymax * h)
        
        rect = plt.Rectangle((xmin, ymin), xmax-xmin, ymax-ymin, 
                             fill=False, edgecolor='red', linewidth=2)
        ax.add_patch(rect)
        ax.text(xmin, ymin-5, f'{scores[i]:.2f}', 
                color='white', backgroundcolor='red')

plt.axis('off')
plt.show()
```

</details>

### 练习2：进阶 - 自定义数据集训练

**任务**：准备自定义数据集并训练简单的检测模型

**要求**：
- 解析 VOC 格式标注
- 创建数据管道
- 训练 10 个 epoch

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import xml.etree.ElementTree as ET
import numpy as np

# 解析标注
def parse_annotation(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    bboxes = []
    classes = []
    
    for obj in root.findall('object'):
        class_name = obj.find('name').text
        bbox = obj.find('bndbox')
        
        xmin = int(bbox.find('xmin').text)
        ymin = int(bbox.find('ymin').text)
        xmax = int(bbox.find('xmax').text)
        ymax = int(bbox.find('ymax').text)
        
        bboxes.append([xmin, ymin, xmax, ymax])
        classes.append(class_name)
    
    return bboxes, classes

# 创建简单检测模型
model = models.Sequential([
    layers.Conv2D(64, 3, activation='relu', input_shape=(416, 416, 3)),
    layers.MaxPooling2D(),
    layers.Conv2D(128, 3, activation='relu'),
    layers.MaxPooling2D(),
    layers.Conv2D(256, 3, activation='relu'),
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dense(10)  # 输出层
])

model.compile(optimizer='adam', loss='mse')
model.summary()
```

</details>

### 练习3：挑战 - 实时视频检测

**任务**：实现摄像头实时目标检测

**要求**：
- 使用 OpenCV 读取摄像头
- 对每一帧进行检测
- 显示检测结果

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
import tensorflow_hub as hub
import cv2
import numpy as np

# 加载模型
detector = hub.load("https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2")

# 打开摄像头
cap = cv2.VideoCapture(0)

while True:
    # 读取帧
    ret, frame = cap.read()
    if not ret:
        break
    
    # 转换为 RGB
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # 检测
    image_tensor = tf.convert_to_tensor(frame_rgb, dtype=tf.uint8)
    image_tensor = tf.expand_dims(image_tensor, axis=0)
    results = detector(image_tensor)
    
    # 解析结果
    boxes = results['detection_boxes'][0].numpy()
    scores = results['detection_scores'][0].numpy()
    
    # 绘制结果
    h, w = frame.shape[:2]
    for i in range(len(scores)):
        if scores[i] > 0.5:
            ymin, xmin, ymax, xmax = boxes[i]
            xmin, xmax = int(xmin * w), int(xmax * w)
            ymin, ymax = int(ymin * h), int(ymax * h)
            
            cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
            cv2.putText(frame, f'{scores[i]:.2f}', (xmin, ymin-5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # 显示
    cv2.imshow('Object Detection', frame)
    
    # 按 'q' 退出
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 释放资源
cap.release()
cv2.destroyAllWindows()
```

</details>

---

## 8. 下一章预告

恭喜你完成了目标检测的学习！现在你已经掌握了：

- 目标检测的基本原理和应用场景
- YOLO 等主流算法的工作原理
- 如何使用预训练模型进行检测
- 数据准备和标注的方法
- 评价指标和常见误区

**下一章我们将学习语义分割实战**，这是计算机视觉的另一个重要任务：

- 什么是语义分割？和目标检测有什么不同？
- 如何实现像素级的分类
- U-Net 等经典架构
- 医学图像分割等实际应用

语义分割能够对图像中的每个像素进行分类，实现更精细的图像理解。准备好进入像素级的世界了吗？
