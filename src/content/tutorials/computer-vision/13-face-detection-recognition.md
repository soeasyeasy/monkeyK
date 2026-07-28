---
title: "第13章：人脸检测与识别"
description: "Haar 级联分类器、DNN 人脸检测、FaceNet、人脸识别系统"
---

# 第13章：人脸检测与识别

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 人脸检测和人脸识别有什么区别？
- 为什么有时候人脸识别会失败？
- Haar 级联分类器和 DNN 检测哪个更好？
- 如何从零开始搭建一个人脸识别考勤系统？

这一章就是为了解答这些问题。我们会先搞清楚 **人脸检测与识别的核心概念**，再动手实践。

---

## 1 为什么需要这个技术？

### 痛点分析

想象一下，你要开发一个门禁系统。没有人脸识别技术时，你只能：
- 用门禁卡（容易丢失、忘记带）
- 用密码（容易忘记、被偷窥）
- 用指纹（手湿了就识别不了）

有了人脸识别，你可以：
- 刷脸开门（方便、安全）
- 自动考勤（无需打卡）
- 照片自动分类（按人物整理相册）

### 解决方案

人脸识别技术让计算机能够：
1. **检测人脸**：在图像中找到"这里有一张脸"
2. **识别身份**：回答"这是谁的脸"

> **一句话总结**：人脸检测是定位，人脸识别是身份确认。

---

## 2 核心原理

### 概念解释

#### 人脸检测 vs 人脸识别

打个比方：

> **人脸检测**就像在人群中找"哪里有人脸"——你只需要知道"这里有一张脸"，不需要知道是谁。
>
> **人脸识别**就像在人群中找"这是谁"——你需要知道这张脸属于哪个具体的人。

#### Haar 级联分类器（Viola-Jones 算法）

Haar 级联分类器是经典的人脸检测方法，它的原理是：

1. **Haar 特征**：用黑白矩形块检测图像的边缘、线条等特征
2. **积分图**：快速计算特征值
3. **级联分类器**：多个弱分类器组合成强分类器，逐层筛选

打个比方：

> 就像安检流程：第一关检查"有没有人脸的基本特征"，第二关检查"像不像人脸"，第三关检查"是不是真实的人脸"。每一关都会淘汰一些非人脸区域。

#### DNN 人脸检测

深度学习方法使用卷积神经网络检测人脸，优势是：
- 更准确（尤其是侧脸、遮挡情况）
- 更鲁棒（适应不同光照、角度）
- 但计算量更大

#### 人脸识别方法

**传统方法**：
- **LBPH**（局部二值模式直方图）：将人脸分成小区域，统计纹理特征
- **Eigenfaces**（特征脸）：用 PCA 降维，找到最能区分不同人脸的特征
- **Fisherfaces**：在 PCA 基础上进一步优化类间差异

**深度学习方法**：
- **FaceNet**：将人脸映射到 128 维向量空间，同一个人的脸距离近，不同人的脸距离远
- **ArcFace**：在 FaceNet 基础上增加角度约束，进一步提升识别精度

打个比方：

> FaceNet 就像给每个人脸生成一个"身份证号"（128维向量），识别时只需要比对"身份证号"是否匹配。

---

## 3 基础用法

### 示例 1：Haar 级联人脸检测

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('people.jpg')

# 转换为灰度图（Haar 分类器需要灰度图）
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 加载 Haar 级联分类器
# OpenCV 提供了预训练的 XML 文件
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# 检测人脸
# scaleFactor：每次缩放比例，越小检测越精细但越慢
# minNeighbors：每个候选矩形框至少保留的邻居数，越大越严格
# minSize：人脸最小尺寸
faces = face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.1,        # 每次缩放 10%
    minNeighbors=5,         # 至少 5 个邻居
    minSize=(30, 30)        # 最小人脸 30x30 像素
)

# 在图像上绘制检测到的人脸框
for (x, y, w, h) in faces:
    # 绘制矩形框，颜色为绿色，线宽为 2
    cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
    # 在框上方显示文字
    cv2.putText(img, 'Face', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

# 显示结果
cv2.imshow('Face Detection', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 示例 2：DNN 人脸检测（更准确）

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('people.jpg')

# 加载 DNN 人脸检测模型
# 需要下载预训练模型文件
net = cv2.dnn.readNetFromCaffe(
    'deploy.prototxt',      # 网络结构文件
    'res10_300x300_ssd_iter_140000.caffemodel'  # 模型权重文件
)

# 获取图像尺寸
(h, w) = img.shape[:2]

# 将图像转换为 blob（Binary Large Object）
# 归一化、缩放、通道交换
blob = cv2.dnn.blobFromImage(
    cv2.resize(img, (300, 300)),  # 缩放到 300x300
    1.0,                           # 缩放因子
    (300, 300),                    # 输出尺寸
    (104.0, 177.0, 123.0)          # 均值减法
)

# 输入 blob 到网络
net.setInput(blob)

# 前向传播，获取检测结果
detections = net.forward()

# 遍历检测结果
for i in range(0, detections.shape[2]):
    # 获取置信度
    confidence = detections[0, 0, i, 2]
    
    # 只保留置信度大于 50% 的结果
    if confidence > 0.5:
        # 计算边界框坐标
        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
        (startX, startY, endX, endY) = box.astype("int")
        
        # 绘制边界框
        cv2.rectangle(img, (startX, startY), (endX, endY), (0, 255, 0), 2)
        
        # 显示置信度
        text = f"{confidence:.2f}%"
        y = startY - 10 if startY - 10 > 10 else startY + 10
        cv2.putText(img, text, (startX, y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 2)

# 显示结果
cv2.imshow('DNN Face Detection', img)
cv2.waitKey(0)
```

### 示例 3：使用 face_recognition 库进行人脸识别

```python
import face_recognition
import cv2
import os

# 第一步：收集已知人脸数据
known_face_encodings = []  # 存储人脸编码
known_face_names = []      # 存储对应的人名

# 加载已知人脸图像
for filename in os.listdir('known_faces'):
    # 读取图像
    image = face_recognition.load_image_file(f'known_faces/{filename}')
    
    # 检测人脸位置
    face_locations = face_recognition.face_locations(image)
    
    # 提取人脸编码（128维向量）
    face_encodings = face_recognition.face_encodings(image, face_locations)
    
    # 假设每张图像只有一个人脸
    if len(face_encodings) > 0:
        known_face_encodings.append(face_encodings[0])
        # 从文件名提取人名（去掉扩展名）
        known_face_names.append(os.path.splitext(filename)[0])

# 第二步：识别未知图像中的人脸
unknown_image = face_recognition.load_image_file('test.jpg')

# 检测未知图像中的人脸位置
face_locations = face_recognition.face_locations(unknown_image)

# 提取人脸编码
face_encodings = face_recognition.face_encodings(unknown_image, face_locations)

# 转换为 OpenCV 格式（RGB → BGR）
unknown_image_cv = cv2.cvtColor(unknown_image, cv2.COLOR_RGB2BGR)

# 遍历检测到的每个人脸
for face_encoding, face_location in zip(face_encodings, face_locations):
    # 与已知人脸进行比对
    matches = face_recognition.compare_faces(
        known_face_encodings, 
        face_encoding,
        tolerance=0.6  # 容差值，越小越严格
    )
    
    # 计算与所有已知人脸的距离
    face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
    
    # 找到距离最小的（最匹配的）
    best_match_index = np.argmin(face_distances)
    
    if matches[best_match_index]:
        name = known_face_names[best_match_index]
        confidence = 1 - face_distances[best_match_index]
    else:
        name = "Unknown"
        confidence = 0
    
    # 绘制结果
    top, right, bottom, left = face_location
    cv2.rectangle(unknown_image_cv, (left, top), (right, bottom), (0, 255, 0), 2)
    cv2.putText(
        unknown_image_cv, 
        f'{name} ({confidence:.2f})', 
        (left, top - 10), 
        cv2.FONT_HERSHEY_SIMPLEX, 
        0.6, 
        (0, 255, 0), 
        2
    )

# 显示结果
cv2.imshow('Face Recognition', unknown_image_cv)
cv2.waitKey(0)
```

### 示例 4：实时摄像头人脸识别考勤系统

```python
import cv2
import face_recognition
import numpy as np
from datetime import datetime
import os

# 创建考勤记录文件夹
if not os.path.exists('attendance_records'):
    os.makedirs('attendance_records')

# 加载已知人脸
known_face_encodings = []
known_face_names = []

# 假设已知人脸存储在 'known_faces' 文件夹中
for filename in os.listdir('known_faces'):
    image = face_recognition.load_image_file(f'known_faces/{filename}')
    face_locations = face_recognition.face_locations(image)
    face_encodings = face_recognition.face_encodings(image, face_locations)
    
    if len(face_encodings) > 0:
        known_face_encodings.append(face_encodings[0])
        known_face_names.append(os.path.splitext(filename)[0])

# 记录已签到的人脸（避免重复签到）
checked_in = set()

# 打开摄像头
video_capture = cv2.VideoCapture(0)

# 降低处理速度以加快性能
process_this_frame = True

while True:
    # 读取摄像头帧
    ret, frame = video_capture.read()
    
    if not ret:
        break
    
    # 每隔一帧处理一次（提高性能）
    if process_this_frame:
        # 缩小帧尺寸以加快处理速度
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        
        # 转换颜色空间（BGR → RGB）
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        # 检测人脸位置
        face_locations = face_recognition.face_locations(rgb_small_frame)
        
        # 提取人脸编码
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        
        face_names = []
        for face_encoding in face_encodings:
            # 比对已知人脸
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.6)
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            best_match_index = np.argmin(face_distances)
            
            if matches[best_match_index]:
                name = known_face_names[best_match_index]
                
                # 记录考勤
                if name not in checked_in:
                    checked_in.add(name)
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    
                    # 写入考勤记录
                    with open('attendance_records/attendance.txt', 'a', encoding='utf-8') as f:
                        f.write(f'{name},{timestamp}\n')
                    
                    print(f'{name} 签到成功！时间：{timestamp}')
            else:
                name = "Unknown"
            
            face_names.append(name)
    
    process_this_frame = not process_this_frame
    
    # 绘制结果
    for (top, right, bottom, left), name in zip(face_locations, face_names):
        # 放大坐标（因为之前缩小了图像）
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4
        
        # 绘制矩形框
        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        
        # 显示姓名
        cv2.rectangle(frame, (left, bottom - 25), (right, bottom), color, cv2.FILLED)
        cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
    
    # 显示已签到人数
    cv2.putText(frame, f'Checked in: {len(checked_in)}', (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    
    # 显示帧
    cv2.imshow('Attendance System', frame)
    
    # 按 'q' 退出
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 释放资源
video_capture.release()
cv2.destroyAllWindows()

print(f'\n考勤结束，共 {len(checked_in)} 人签到')
print('签到记录已保存到 attendance_records/attendance.txt')
```

---

## 4 对比表格

### 人脸检测方法对比

| 特性 | Haar 级联分类器 | DNN 人脸检测 |
| --- | --- | --- |
| **速度** | 快（适合实时应用） | 较慢（需要 GPU 加速） |
| **准确率** | 中等（侧脸、遮挡效果差） | 高（各种角度都准确） |
| **鲁棒性** | 差（对光照、角度敏感） | 好（适应性强） |
| **模型大小** | 小（几 MB） | 大（几十 MB） |
| **适用场景** | 资源受限设备、简单场景 | 高精度要求、复杂场景 |
| **是否需要训练** | 否（使用预训练模型） | 否（使用预训练模型） |

### 人脸识别方法对比

| 特性 | LBPH/Eigenfaces | FaceNet/ArcFace |
| --- | --- | --- |
| **特征维度** | 低维（几百维） | 128 维 |
| **准确率** | 中等（70-85%） | 高（95%+） |
| **对小样本的适应性** | 好（几张图片即可） | 需要较多训练数据 |
| **计算速度** | 快 | 较慢（需要 GPU） |
| **对光照变化的鲁棒性** | 差 | 好 |
| **对角度变化的鲁棒性** | 差 | 好 |
| **适用场景** | 简单应用、资源受限 | 高精度要求、生产环境 |

---

## 5 新手常见误区

### 误区 1："人脸检测和人脸识别是一回事"

**错！** 人脸检测只是定位人脸位置（"这里有一张脸"），人脸识别是确认身份（"这是张三的脸"）。

正确理解：
- 人脸检测是第一步，输出是人脸的边界框坐标
- 人脸识别是第二步，输入是检测到的人脸图像，输出是身份标签

### 误区 2："Haar 级联分类器在所有场景都够用"

不是的。Haar 级联分类器在以下场景表现很差：
- 侧脸（只能检测正脸）
- 遮挡（戴口罩、墨镜）
- 极端光照（太亮或太暗）
- 小人脸（远处的人脸）

建议：对精度要求高的场景使用 DNN 方法。

### 误区 3："人脸识别只需要一张照片就能准确识别"

错！单张照片训练的人脸识别模型：
- 对角度变化敏感（侧脸识别失败）
- 对光照变化敏感（不同光线下识别失败）
- 对表情变化敏感（笑和不笑可能识别为不同人）

正确做法：每个人收集 5-10 张不同角度、不同光照的照片。

### 误区 4："人脸识别 100% 准确"

不是的。人脸识别存在：
- **误识率（FAR）**：把 A 识别成 B
- **拒识率（FRR）**：把 A 识别成"未知"
- 双胞胎、相似长相的人容易混淆
- 化妆、整容可能影响识别

实际应用需要设置合适的阈值，平衡误识率和拒识率。

### 误区 5："实时人脸识别不需要优化"

错！实时人脸识别需要优化：
- 缩小图像尺寸（降低分辨率）
- 隔帧处理（不是每帧都检测）
- 使用 GPU 加速
- 只检测关键区域（而不是全图）

否则帧率会很低（可能只有 1-2 FPS）。

---

## 6 动手练习

### 练习 1：基础练习 - 摄像头实时人脸检测

编写程序，使用摄像头实时检测人脸，并在检测到的人脸上绘制矩形框。

<details>
<summary>点击查看答案</summary>

```python
import cv2

# 加载 Haar 级联分类器
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# 打开摄像头
cap = cv2.VideoCapture(0)

while True:
    # 读取帧
    ret, frame = cap.read()
    
    if not ret:
        break
    
    # 转换为灰度图
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # 检测人脸
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )
    
    # 绘制人脸框
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(frame, 'Face', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    # 显示帧
    cv2.imshow('Face Detection', frame)
    
    # 按 'q' 退出
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 释放资源
cap.release()
cv2.destroyAllWindows()
```

</details>

### 练习 2：进阶练习 - 人脸计数与统计

编写程序，统计图像中的人脸数量，并按人脸大小排序，标记出最大和最小的人脸。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('group_photo.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 加载分类器
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# 检测人脸
faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

# 计算人脸数量
face_count = len(faces)
print(f'检测到 {face_count} 个人脸')

# 计算人脸面积并排序
face_areas = [(w * h, x, y, w, h, i) for i, (x, y, w, h) in enumerate(faces)]
face_areas.sort(reverse=True)  # 从大到小排序

# 绘制所有人脸框
for i, (x, y, w, h) in enumerate(faces):
    cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)
    cv2.putText(img, f'Face {i+1}', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

# 标记最大人脸（绿色）
if len(face_areas) > 0:
    area, x, y, w, h, idx = face_areas[0]
    cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 3)
    cv2.putText(img, 'Largest', (x, y-30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

# 标记最小人脸（红色）
if len(face_areas) > 1:
    area, x, y, w, h, idx = face_areas[-1]
    cv2.rectangle(img, (x, y), (x+w, y+h), (0, 0, 255), 3)
    cv2.putText(img, 'Smallest', (x, y-30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

# 显示统计信息
cv2.putText(img, f'Total: {face_count}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

cv2.imshow('Face Statistics', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 3（挑战）：综合练习 - 简单人脸识别考勤系统

编写一个完整的人脸识别考勤系统，要求：
1. 能够注册新人脸（拍照并保存）
2. 能够识别人脸并记录考勤时间
3. 避免重复签到
4. 将考勤记录保存到文件

<details>
<summary>点击查看答案</summary>

```python
import cv2
import face_recognition
import os
from datetime import datetime
import numpy as np

# 创建必要的文件夹
if not os.path.exists('known_faces'):
    os.makedirs('known_faces')
if not os.path.exists('attendance_records'):
    os.makedirs('attendance_records')

class AttendanceSystem:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_names = []
        self.checked_in = set()
        self.load_known_faces()
    
    def load_known_faces(self):
        """加载已知人脸数据"""
        for filename in os.listdir('known_faces'):
            image = face_recognition.load_image_file(f'known_faces/{filename}')
            face_locations = face_recognition.face_locations(image)
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if len(face_encodings) > 0:
                self.known_face_encodings.append(face_encodings[0])
                # 从文件名提取人名
                name = os.path.splitext(filename)[0]
                self.known_face_names.append(name)
        
        print(f'已加载 {len(self.known_face_names)} 个已知人脸')
    
    def register_face(self, name):
        """注册新人脸"""
        cap = cv2.VideoCapture(0)
        print(f'请 {name} 面对摄像头，按空格键拍照...')
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # 显示预览
            cv2.imshow('Register Face - Press SPACE to capture', frame)
            
            key = cv2.waitKey(1)
            if key == ord(' '):  # 空格键拍照
                # 保存图像
                filename = f'known_faces/{name}.jpg'
                cv2.imwrite(filename, frame)
                print(f'人脸已保存到 {filename}')
                
                # 重新加载人脸数据
                self.load_known_faces()
                break
            elif key == ord('q'):  # q 键退出
                break
        
        cap.release()
        cv2.destroyAllWindows()
    
    def recognize_and_attend(self):
        """识别并记录考勤"""
        cap = cv2.VideoCapture(0)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # 缩小帧以提高性能
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            
            # 检测人脸
            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            
            face_names = []
            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=0.6)
                face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                best_match_index = np.argmin(face_distances)
                
                if matches[best_match_index]:
                    name = self.known_face_names[best_match_index]
                    
                    # 记录考勤
                    if name not in self.checked_in:
                        self.checked_in.add(name)
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        
                        with open('attendance_records/attendance.txt', 'a', encoding='utf-8') as f:
                            f.write(f'{name},{timestamp}\n')
                        
                        print(f'✓ {name} 签到成功！时间：{timestamp}')
                else:
                    name = "Unknown"
                
                face_names.append(name)
            
            # 绘制结果
            for (top, right, bottom, left), name in zip(face_locations, face_names):
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4
                
                color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                cv2.rectangle(frame, (left, bottom - 25), (right, bottom), color, cv2.FILLED)
                cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
            
            cv2.putText(frame, f'Checked in: {len(self.checked_in)}', (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            cv2.imshow('Attendance System', frame)
            
            key = cv2.waitKey(1)
            if key == ord('q'):
                break
            elif key == ord('r'):  # r 键注册新人脸
                cap.release()
                cv2.destroyAllWindows()
                name = input('请输入姓名：')
                self.register_face(name)
                return  # 重新开始识别
        
        cap.release()
        cv2.destroyAllWindows()

# 主程序
if __name__ == '__main__':
    system = AttendanceSystem()
    
    while True:
        print('\n=== 人脸识别考勤系统 ===')
        print('1. 识别并签到')
        print('2. 注册新人脸')
        print('3. 退出')
        
        choice = input('请选择操作 (1/2/3): ')
        
        if choice == '1':
            system.recognize_and_attend()
        elif choice == '2':
            name = input('请输入姓名：')
            system.register_face(name)
        elif choice == '3':
            print('再见！')
            break
        else:
            print('无效选择，请重新输入')
```

</details>

---

## 下一章预告

下一章我们会学习 **目标检测实战**——不仅要找到"这里有一个物体"，还要知道"这是什么物体"。你会学到 YOLO、SSD 等先进算法，以及如何构建实时目标检测系统。
