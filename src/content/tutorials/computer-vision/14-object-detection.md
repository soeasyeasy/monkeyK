---
title: "第14章：目标检测实战"
description: "目标检测原理、YOLO 系列、SSD、Anchor 机制、实时检测系统"
---

# 第14章：目标检测实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 目标检测和图像分类有什么区别？
- YOLO 为什么能实现实时检测？
- Anchor 机制到底是什么？
- 如何从零开始搭建一个实时目标检测系统？

这一章就是为了解答这些问题。我们会先搞清楚 **目标检测的核心概念**，再动手实践。

---

## 1 为什么需要这个技术？

### 痛点分析

想象一下，你要开发一个自动驾驶系统。只有图像分类技术时，你只能：
- 知道"这张图里有一辆车"（但不知道车在哪里）
- 知道"这张图里有行人"（但不知道行人在哪个位置）

这就像你看到一张照片，有人告诉你"里面有猫和狗"，但不告诉你它们在哪里——你还是无法做出正确的决策。

### 解决方案

目标检测技术让计算机能够：
1. **分类**：知道"这是什么物体"
2. **定位**：知道"物体在哪里"（用边界框标出）

打个比方：

> **目标检测**就像在照片中既找到"有什么"又找到"在哪里"——就像你在人群中既能认出"这是张三"，又能指出"张三在左边第三个位置"。

> **一句话总结**：目标检测 = 图像分类 + 目标定位。

---

## 2 核心原理

### 概念解释

#### 目标检测 vs 图像分类

| 任务 | 输入 | 输出 | 比喻 |
|------|------|------|------|
| **图像分类** | 一张图 | 一个类别标签 | "这张图里有猫" |
| **目标定位** | 一张图 | 类别 + 位置框 | "猫在这里" |
| **目标检测** | 一张图 | 多个类别 + 多个位置框 | "图里有3只猫、2条狗，分别在..." |

#### Anchor 机制

Anchor（锚框）是目标检测的核心概念。

打个比方：

> 想象你要在地图上标记各种建筑物。Anchor 就像你预先准备的几种"模板框"：
> - 小方框：标记小房子
> - 长条框：标记高楼
> - 宽扁框：标记商场
>
> 检测时，你把每种模板框放在图像的不同位置，然后调整框的大小和位置，让它刚好框住目标。

Anchor 机制的工作流程：
1. **预设 Anchor**：在图像上均匀分布多种尺寸和比例的框
2. **分类**：判断每个 Anchor 里是否有目标，以及是什么目标
3. **回归**：调整 Anchor 的位置和大小，让它更精确地框住目标

#### 两阶段 vs 单阶段检测器

| 类型 | 代表算法 | 原理 | 速度 | 精度 |
|------|----------|------|------|------|
| **两阶段** | Faster R-CNN | 先生成候选区域，再分类和回归 | 慢 | 高 |
| **单阶段** | YOLO、SSD | 直接预测类别和位置 | 快 | 中等 |

打个比方：

> **两阶段检测器**就像找宝藏：先用地图缩小范围（生成候选区域），再精确挖掘（分类和回归）。
>
> **单阶段检测器**就像直接挖宝：看一眼就知道哪里可能有宝藏，直接挖（直接预测）。

#### YOLO 系列演进

YOLO（You Only Look Once）是目标检测领域最重要的算法之一：

| 版本 | 核心改进 | 特点 |
|------|----------|------|
| **YOLOv1** | 将图像分成网格，每个网格预测一个目标 | 开创性，速度快但精度低 |
| **YOLOv2** | 引入 Anchor、批归一化 | 精度提升 |
| **YOLOv3** | 多尺度检测、Darknet-53 | 精度大幅提升 |
| **YOLOv4** | 大量数据增强、Mosaic | 精度和速度平衡 |
| **YOLOv5-v8** | 架构优化、工程化改进 | 更易用、性能更好 |

#### NMS（非极大值抑制）

NMS 用于去除重复的检测框。

打个比方：

> 想象你拍了一张猫的照片，目标检测算法可能在猫的位置生成了 5 个重叠的框。NMS 就像评委打分：
> 1. 选置信度最高的框
> 2. 计算它与其他框的重叠度（IoU）
> 3. 删除重叠度太高的框
> 4. 重复直到没有更多框

#### mAP（平均精度均值）

mAP 是评估目标检测模型的标准指标：

- **IoU（交并比）**：预测框和真实框的重叠程度
- **Precision（精确率）**：检测到的目标中有多少是正确的
- **Recall（召回率）**：所有真实目标中有多少被检测到了
- **AP（平均精度）**：单个类别的 Precision-Recall 曲线下面积
- **mAP**：所有类别 AP 的平均值

---

## 3 基础用法

### 示例 1：使用 OpenCV DNN 模块加载 YOLO

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('street.jpg')

# 获取图像尺寸
height, width = img.shape[:2]

# 加载 YOLO 模型
# 需要下载预训练模型文件
net = cv2.dnn.readNet('yolov3.weights', 'yolov3.cfg')

# 加载 COCO 数据集的类别名称
with open('coco.names', 'r') as f:
    classes = [line.strip() for line in f.readlines()]

# 获取输出层的名称
layer_names = net.getLayerNames()
output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]

# 将图像转换为 blob
blob = cv2.dnn.blobFromImage(
    img,
    1/255.0,           # 归一化到 [0, 1]
    (416, 416),        # YOLO 输入尺寸
    swapRB=True,       # RGB 转 BGR
    crop=False         # 不裁剪
)

# 输入 blob 到网络
net.setInput(blob)

# 前向传播，获取检测结果
outputs = net.forward(output_layers)

# 存储检测结果
boxes = []          # 边界框
confidences = []    # 置信度
class_ids = []      # 类别 ID

# 遍历每个输出层
for output in outputs:
    # 遍历每个检测结果
    for detection in output:
        # 提取类别概率
        scores = detection[5:]
        class_id = np.argmax(scores)
        confidence = scores[class_id]
        
        # 只保留置信度大于 0.5 的结果
        if confidence > 0.5:
            # 计算边界框坐标
            center_x = int(detection[0] * width)
            center_y = int(detection[1] * height)
            w = int(detection[2] * width)
            h = int(detection[3] * height)
            
            # 转换为左上角坐标
            x = int(center_x - w / 2)
            y = int(center_y - h / 2)
            
            boxes.append([x, y, w, h])
            confidences.append(float(confidence))
            class_ids.append(class_id)

# 应用非极大值抑制（NMS）
indices = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)

# 绘制检测结果
if len(indices) > 0:
    for i in indices.flatten():
        x, y, w, h = boxes[i]
        confidence = confidences[i]
        class_id = class_ids[i]
        
        # 绘制边界框
        cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # 显示类别和置信度
        label = f'{classes[class_id]}: {confidence:.2f}'
        cv2.putText(img, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

# 显示结果
cv2.imshow('Object Detection', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 示例 2：实时目标检测系统

```python
import cv2
import numpy as np
import time

# 加载 YOLO 模型
net = cv2.dnn.readNet('yolov3.weights', 'yolov3.cfg')

# 启用 GPU 加速（如果有 CUDA）
# net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
# net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)

# 加载类别名称
with open('coco.names', 'r') as f:
    classes = [line.strip() for line in f.readlines()]

# 获取输出层
layer_names = net.getLayerNames()
output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]

# 打开摄像头
cap = cv2.VideoCapture(0)

# 用于计算 FPS
prev_time = time.time()
fps = 0

while True:
    ret, frame = cap.read()
    
    if not ret:
        break
    
    height, width = frame.shape[:2]
    
    # 转换为 blob
    blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416, 416), swapRB=True, crop=False)
    
    # 前向传播
    net.setInput(blob)
    outputs = net.forward(output_layers)
    
    # 存储检测结果
    boxes = []
    confidences = []
    class_ids = []
    
    # 处理检测结果
    for output in outputs:
        for detection in output:
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]
            
            if confidence > 0.5:
                center_x = int(detection[0] * width)
                center_y = int(detection[1] * height)
                w = int(detection[2] * width)
                h = int(detection[3] * height)
                
                x = int(center_x - w / 2)
                y = int(center_y - h / 2)
                
                boxes.append([x, y, w, h])
                confidences.append(float(confidence))
                class_ids.append(class_id)
    
    # 应用 NMS
    indices = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)
    
    # 绘制结果
    if len(indices) > 0:
        for i in indices.flatten():
            x, y, w, h = boxes[i]
            confidence = confidences[i]
            class_id = class_ids[i]
            
            # 根据类别选择不同颜色
            color = (0, 255, 0) if classes[class_id] == 'person' else (255, 0, 0)
            
            # 绘制边界框
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            
            # 显示标签
            label = f'{classes[class_id]}: {confidence:.2f}'
            cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    # 计算 FPS
    curr_time = time.time()
    fps = 1.0 / (curr_time - prev_time)
    prev_time = curr_time
    
    # 显示 FPS
    cv2.putText(frame, f'FPS: {fps:.2f}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    
    # 显示检测到的目标数量
    cv2.putText(frame, f'Objects: {len(indices)}', (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    
    # 显示帧
    cv2.imshow('Real-time Detection', frame)
    
    # 按 'q' 退出
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 释放资源
cap.release()
cv2.destroyAllWindows()
```

### 示例 3：使用 YOLOv8（ultralytics 库）

```python
from ultralytics import YOLO
import cv2

# 加载预训练的 YOLOv8 模型
# 可选：yolov8n.pt (nano), yolov8s.pt (small), yolov8m.pt (medium) 等
model = YOLO('yolov8n.pt')

# 读取图像
img = cv2.imread('street.jpg')

# 执行检测
results = model(img)

# 遍历检测结果
for result in results:
    # 获取边界框
    boxes = result.boxes
    
    # 遍历每个框
    for box in boxes:
        # 获取坐标
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        
        # 获取置信度
        confidence = box.conf[0].item()
        
        # 获取类别
        class_id = int(box.cls[0].item())
        class_name = model.names[class_id]
        
        # 绘制边界框
        cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
        
        # 显示标签
        label = f'{class_name}: {confidence:.2f}'
        cv2.putText(img, label, (int(x1), int(y1) - 10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

# 显示结果
cv2.imshow('YOLOv8 Detection', img)
cv2.waitKey(0)
cv2.destroyAllWindows()

# 保存结果
cv2.imwrite('result.jpg', img)
```

### 示例 4：自定义目标检测（训练自己的模型）

```python
from ultralytics import YOLO

# 加载预训练模型（作为起点）
model = YOLO('yolov8n.pt')

# 准备数据集
# 数据集格式：YOLO 格式（每张图像对应一个 txt 文件）
# 格式：class_id center_x center_y width height（归一化坐标）

# 训练模型
results = model.train(
    data='dataset.yaml',      # 数据集配置文件
    epochs=100,               # 训练轮数
    imgsz=640,                # 输入图像尺寸
    batch=16,                 # 批次大小
    name='custom_detector'    # 实验名称
)

# 验证模型
metrics = model.val()
print(f'mAP50: {metrics.box.map50}')
print(f'mAP50-95: {metrics.box.map}')

# 使用训练好的模型进行推理
best_model = YOLO(f'runs/detect/custom_detector/weights/best.pt')
results = best_model('test_image.jpg')
```

---

## 4 对比表格

### 目标检测算法对比

| 特性 | YOLO | SSD | Faster R-CNN |
|------|------|-----|--------------|
| **类型** | 单阶段 | 单阶段 | 两阶段 |
| **速度** | 快（30-150 FPS） | 快（20-80 FPS） | 慢（5-20 FPS） |
| **精度** | 中等-高 | 中等 | 高 |
| **小目标检测** | 较好 | 较差 | 好 |
| **适用场景** | 实时应用、移动端 | 移动端、嵌入式 | 高精度要求 |
| **模型大小** | 中等 | 小 | 大 |
| **训练难度** | 中等 | 中等 | 较难 |

### YOLO 版本对比

| 版本 | 参数量 | 速度 | mAP | 特点 |
|------|--------|------|-----|------|
| YOLOv3 | 62M | 中等 | 33.0 | 经典版本，稳定 |
| YOLOv5 | 7M-100M | 快 | 36-50 | 工程化好，易部署 |
| YOLOv8 | 3M-68M | 快 | 37-53 | 最新架构，性能优 |
| YOLOv8n | 3.2M | 最快 | 37.3 | 轻量级，适合移动端 |
| YOLOv8x | 68.2M | 较慢 | 53.0 | 最高精度 |

---

## 5 新手常见误区

### 误区 1："YOLO 可以检测任意大小的目标"

**错！** YOLO 对小目标检测效果较差，因为：
- 输入图像被缩放到固定尺寸（如 416x416）
- 小目标在缩放后可能只剩下几个像素
- YOLO 每个网格只预测一个目标

改进方法：
- 使用多尺度检测（YOLOv3+）
- 使用更高分辨率输入
- 使用专门的改进版本（如 YOLOv5 的 P2 层）

### 误区 2："检测置信度越高，结果越准确"

不是的。置信度只表示模型对"这个框里有目标"的信心，不代表：
- 边界框定位准确
- 类别判断正确
- 没有漏检

实际应用中需要结合 IoU、Precision、Recall 综合评估。

### 误区 3："NMS 阈值越小越好"

错！NMS 阈值设置需要平衡：
- **阈值太小**：会删除正确的检测框（漏检增加）
- **阈值太大**：会保留太多重复框（冗余增加）

建议：根据具体场景调整，通常 0.4-0.6 之间。

### 误区 4："预训练模型可以直接用于所有场景"

不是的。预训练模型（如 COCO 预训练）在以下场景表现差：
- 特殊领域（医学图像、卫星图像）
- 特殊目标（工业缺陷、特定产品）
- 特殊视角（俯视、仰视）

建议：在特定场景下微调模型。

### 误区 5："实时检测不需要优化"

错！实时检测需要多种优化：
- 使用轻量级模型（YOLOv8n 而不是 YOLOv8x）
- 启用 GPU 加速
- 降低输入分辨率
- 隔帧检测（不是每帧都检测）
- 使用 TensorRT 等推理加速

否则帧率会很低（可能只有 1-5 FPS）。

---

## 6 动手练习

### 练习 1：基础练习 - 图像目标检测

编写程序，使用 YOLO 对图像进行目标检测，并统计检测到的各类别目标数量。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
from collections import Counter

# 加载 YOLO 模型
net = cv2.dnn.readNet('yolov3.weights', 'yolov3.cfg')

# 加载类别名称
with open('coco.names', 'r') as f:
    classes = [line.strip() for line in f.readlines()]

# 获取输出层
layer_names = net.getLayerNames()
output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]

# 读取图像
img = cv2.imread('street.jpg')
height, width = img.shape[:2]

# 转换为 blob
blob = cv2.dnn.blobFromImage(img, 1/255.0, (416, 416), swapRB=True, crop=False)

# 前向传播
net.setInput(blob)
outputs = net.forward(output_layers)

# 存储检测结果
boxes = []
confidences = []
class_ids = []

# 处理检测结果
for output in outputs:
    for detection in output:
        scores = detection[5:]
        class_id = np.argmax(scores)
        confidence = scores[class_id]
        
        if confidence > 0.5:
            center_x = int(detection[0] * width)
            center_y = int(detection[1] * height)
            w = int(detection[2] * width)
            h = int(detection[3] * height)
            
            x = int(center_x - w / 2)
            y = int(center_y - h / 2)
            
            boxes.append([x, y, w, h])
            confidences.append(float(confidence))
            class_ids.append(class_id)

# 应用 NMS
indices = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)

# 统计各类别数量
class_counts = Counter()
if len(indices) > 0:
    for i in indices.flatten():
        class_id = class_ids[i]
        class_counts[classes[class_id]] += 1
        
        # 绘制结果
        x, y, w, h = boxes[i]
        cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
        label = f'{classes[class_id]}: {confidences[i]:.2f}'
        cv2.putText(img, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

# 打印统计结果
print('检测到的目标数量统计：')
for class_name, count in class_counts.most_common():
    print(f'  {class_name}: {count}')

# 显示结果
cv2.imshow('Detection Result', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 2：进阶练习 - 实时目标追踪

编写程序，在实时视频中检测目标，并对检测到的目标进行简单追踪（使用中心点距离关联）。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
from scipy.spatial import distance as dist

class SimpleTracker:
    def __init__(self, max_disappeared=5):
        # 存储追踪目标
        self.next_object_id = 0
        self.objects = {}          # {object_id: 中心点坐标}
        self.disappeared = {}      # {object_id: 消失帧数}
        self.max_disappeared = max_disappeared
    
    def register(self, centroid):
        # 注册新目标
        self.objects[self.next_object_id] = centroid
        self.disappeared[self.next_object_id] = 0
        self.next_object_id += 1
    
    def deregister(self, object_id):
        # 删除消失的目标
        del self.objects[object_id]
        del self.disappeared[object_id]
    
    def update(self, rects):
        # 如果没有检测到目标
        if len(rects) == 0:
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            return self.objects
        
        # 计算当前检测到的中心点
        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for (i, (startX, startY, endX, endY)) in enumerate(rects):
            cX = int((startX + endX) / 2.0)
            cY = int((startY + endY) / 2.0)
            input_centroids[i] = (cX, cY)
        
        # 如果是第一次检测，直接注册
        if len(self.objects) == 0:
            for i in range(0, len(input_centroids)):
                self.register(input_centroids[i])
        else:
            # 获取现有目标 ID 和中心点
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())
            
            # 计算距离矩阵
            D = dist.cdist(np.array(object_centroids), input_centroids)
            
            # 贪心匹配
            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]
            
            used_rows = set()
            used_cols = set()
            
            for (row, col) in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue
                
                object_id = object_ids[row]
                self.objects[object_id] = input_centroids[col]
                self.disappeared[object_id] = 0
                used_rows.add(row)
                used_cols.add(col)
            
            # 处理未匹配的目标
            unused_rows = set(range(D.shape[0])).difference(used_rows)
            unused_cols = set(range(D.shape[1])).difference(used_cols)
            
            # 标记消失的目标
            for row in unused_rows:
                object_id = object_ids[row]
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            
            # 注册新目标
            for col in unused_cols:
                self.register(input_centroids[col])
        
        return self.objects

# 加载 YOLO 模型
net = cv2.dnn.readNet('yolov3.weights', 'yolov3.cfg')
with open('coco.names', 'r') as f:
    classes = [line.strip() for line in f.readlines()]
layer_names = net.getLayerNames()
output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]

# 创建追踪器
tracker = SimpleTracker(max_disappeared=5)

# 打开摄像头
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    height, width = frame.shape[:2]
    
    # 检测目标
    blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416, 416), swapRB=True, crop=False)
    net.setInput(blob)
    outputs = net.forward(output_layers)
    
    boxes = []
    confidences = []
    class_ids = []
    
    for output in outputs:
        for detection in output:
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]
            
            if confidence > 0.5 and classes[class_id] == 'person':
                center_x = int(detection[0] * width)
                center_y = int(detection[1] * height)
                w = int(detection[2] * width)
                h = int(detection[3] * height)
                
                x = int(center_x - w / 2)
                y = int(center_y - h / 2)
                
                boxes.append([x, y, x + w, y + h])
                confidences.append(float(confidence))
                class_ids.append(class_id)
    
    indices = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)
    
    # 更新追踪器
    rects = []
    if len(indices) > 0:
        for i in indices.flatten():
            rects.append(boxes[i])
    
    objects = tracker.update(rects)
    
    # 绘制追踪结果
    for (object_id, centroid) in objects.items():
        # 绘制中心点
        cv2.circle(frame, (centroid[0], centroid[1]), 5, (0, 255, 0), -1)
        
        # 显示 ID
        cv2.putText(frame, f'ID {object_id}', (centroid[0] - 10, centroid[1] - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # 绘制检测框
    if len(indices) > 0:
        for i in indices.flatten():
            x1, y1, x2, y2 = boxes[i]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
    
    cv2.imshow('Tracking', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

</details>

### 练习 3（挑战）：综合练习 - 智能监控系统

编写一个完整的智能监控系统，要求：
1. 实时检测人和车辆
2. 统计进入和离开区域的目标数量
3. 对异常行为（如区域入侵）发出警报
4. 记录事件日志

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
from datetime import datetime
from collections import deque

class SmartMonitor:
    def __init__(self, region_points):
        # 定义监控区域（多边形）
        self.region = np.array(region_points, dtype=np.int32)
        
        # 存储追踪信息
        self.tracked_objects = {}  # {id: {'centroid': (x,y), 'class': str, 'counted': bool}}
        self.next_id = 0
        
        # 统计信息
        self.entry_count = 0
        self.exit_count = 0
        self.current_in_region = 0
        
        # 事件日志
        self.event_log = []
        
        # 历史轨迹
        self.trajectories = {}  # {id: deque of centroids}
    
    def point_in_polygon(self, point, polygon):
        """判断点是否在多边形内"""
        return cv2.pointPolygonTest(polygon, point, False) >= 0
    
    def update(self, detections, frame):
        """更新追踪和统计"""
        current_ids = set()
        
        for det in detections:
            x1, y1, x2, y2, conf, cls = det
            
            # 计算中心点
            centroid = ((x1 + x2) // 2, (y1 + y2) // 2)
            
            # 简单的 ID 分配（实际应用中应使用更复杂的匹配算法）
            matched_id = None
            min_dist = float('inf')
            
            for obj_id, obj_info in self.tracked_objects.items():
                dist = np.sqrt((centroid[0] - obj_info['centroid'][0])**2 + 
                              (centroid[1] - obj_info['centroid'][1])**2)
                if dist < min_dist and dist < 50:  # 阈值 50 像素
                    min_dist = dist
                    matched_id = obj_id
            
            if matched_id is None:
                # 新目标
                matched_id = self.next_id
                self.next_id += 1
                self.tracked_objects[matched_id] = {
                    'centroid': centroid,
                    'class': cls,
                    'counted': False
                }
                self.trajectories[matched_id] = deque(maxlen=30)
            else:
                # 更新现有目标
                old_centroid = self.tracked_objects[matched_id]['centroid']
                self.tracked_objects[matched_id]['centroid'] = centroid
            
            # 更新轨迹
            self.trajectories[matched_id].append(centroid)
            current_ids.add(matched_id)
            
            # 检查是否在区域内
            in_region = self.point_in_polygon(centroid, self.region)
            
            if in_region and not self.tracked_objects[matched_id]['counted']:
                # 进入区域
                self.entry_count += 1
                self.current_in_region += 1
                self.tracked_objects[matched_id]['counted'] = True
                
                # 记录事件
                event = {
                    'time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'type': 'ENTRY',
                    'class': cls,
                    'id': matched_id
                }
                self.event_log.append(event)
                print(f"[{event['time']}] 警报：{cls} (ID: {matched_id}) 进入监控区域！")
        
        # 检查离开的目标
        for obj_id in list(self.tracked_objects.keys()):
            if obj_id not in current_ids:
                if self.tracked_objects[obj_id]['counted']:
                    self.exit_count += 1
                    self.current_in_region -= 1
                del self.tracked_objects[obj_id]
                if obj_id in self.trajectories:
                    del self.trajectories[obj_id]
    
    def draw_overlay(self, frame):
        """绘制监控信息"""
        # 绘制监控区域
        cv2.polylines(frame, [self.region], True, (0, 255, 255), 2)
        
        # 绘制追踪信息
        for obj_id, obj_info in self.tracked_objects.items():
            centroid = obj_info['centroid']
            cls = obj_info['class']
            
            # 绘制中心点
            cv2.circle(frame, centroid, 5, (0, 255, 0), -1)
            
            # 绘制 ID 和类别
            label = f'ID:{obj_id} {cls}'
            cv2.putText(frame, label, (centroid[0] - 30, centroid[1] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # 绘制轨迹
            if obj_id in self.trajectories:
                trajectory = list(self.trajectories[obj_id])
                for i in range(1, len(trajectory)):
                    cv2.line(frame, trajectory[i-1], trajectory[i], (255, 255, 0), 1)
        
        # 绘制统计信息
        info = [
            f'Entry: {self.entry_count}',
            f'Exit: {self.exit_count}',
            f'In Region: {self.current_in_region}'
        ]
        
        for i, text in enumerate(info):
            cv2.putText(frame, text, (10, 30 + i * 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        
        return frame

# 加载 YOLO 模型
net = cv2.dnn.readNet('yolov3.weights', 'yolov3.cfg')
with open('coco.names', 'r') as f:
    classes = [line.strip() for line in f.readlines()]
layer_names = net.getLayerNames()
output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]

# 定义监控区域（四边形）
# 假设视频分辨率 640x480
region_points = [(200, 100), (500, 100), (500, 400), (200, 400)]

# 创建监控器
monitor = SmartMonitor(region_points)

# 打开摄像头
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    height, width = frame.shape[:2]
    
    # 检测目标
    blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416, 416), swapRB=True, crop=False)
    net.setInput(blob)
    outputs = net.forward(output_layers)
    
    detections = []
    for output in outputs:
        for detection in output:
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]
            
            # 只检测人和车辆
            if confidence > 0.5 and classes[class_id] in ['person', 'car', 'truck', 'bus']:
                center_x = int(detection[0] * width)
                center_y = int(detection[1] * height)
                w = int(detection[2] * width)
                h = int(detection[3] * height)
                
                x1 = int(center_x - w / 2)
                y1 = int(center_y - h / 2)
                x2 = int(center_x + w / 2)
                y2 = int(center_y + h / 2)
                
                detections.append((x1, y1, x2, y2, confidence, classes[class_id]))
    
    # 应用 NMS
    if len(detections) > 0:
        boxes = [(d[0], d[1], d[2], d[3]) for d in detections]
        confs = [d[4] for d in detections]
        indices = cv2.dnn.NMSBoxes(boxes, confs, 0.5, 0.4)
        
        filtered_detections = []
        if len(indices) > 0:
            for i in indices.flatten():
                filtered_detections.append(detections[i])
        
        # 更新监控器
        monitor.update(filtered_detections, frame)
        
        # 绘制检测框
        for det in filtered_detections:
            x1, y1, x2, y2, conf, cls = det
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label = f'{cls}: {conf:.2f}'
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # 绘制监控信息
    frame = monitor.draw_overlay(frame)
    
    # 显示帧
    cv2.imshow('Smart Monitor', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 打印事件日志
print('\n=== 事件日志 ===')
for event in monitor.event_log:
    print(f"[{event['time']}] {event['type']}: {event['class']} (ID: {event['id']})")

cap.release()
cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **图像分割实战**——不仅要找到"物体在哪里"，还要精确到"物体的每个像素"。你会学到语义分割、实例分割、U-Net 等先进算法，以及如何构建医学图像分割系统。
