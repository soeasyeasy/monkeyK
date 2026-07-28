---
title: "第12章：视频处理与目标跟踪"
description: "视频读取与写入、帧差法、MeanShift、CAMShift、KCF 跟踪"
---

# 第12章：视频处理与目标跟踪

## 本章导读

学完模板匹配后，你可能会有这些疑问：

- 前面的算法都是处理单张图片，怎么处理视频？
- 视频和图像有什么区别？
- 怎么在视频中实时检测运动的目标？
- 怎么跟踪一个目标，即使它被遮挡了也能继续追踪？

这一章就是为了解答这些问题。我们会从视频的基本概念开始，学习如何读取和写入视频，然后学习运动检测和目标跟踪算法，最终实现一个实时跟踪系统。

> **目标跟踪就像盯着人群中穿红衣服的人，即使被遮挡也能继续追踪**——通过连续分析每一帧，找到目标的位置变化，预测它的运动轨迹。

---

## 1 为什么需要视频处理？

### 痛点分析

前面学的算法（边缘检测、轮廓检测、特征点匹配、模板匹配）都是处理**单张静态图像**。但现实应用中，很多场景需要处理**视频流**：

- 监控摄像头需要实时检测异常行为
- 自动驾驶需要实时跟踪行人和车辆
- 手机相机需要实时对焦和人脸跟踪

**没有视频处理时的问题：**

1. 无法处理连续的帧
2. 无法利用时间信息（目标的运动轨迹）
3. 无法实现实时应用

### 解决方案

视频处理的本质是**逐帧处理**——把视频拆成一帧一帧的图像，对每一帧应用图像处理算法。

```python
import cv2

# 打开摄像头（0 表示默认摄像头）
cap = cv2.VideoCapture(0)

while True:
    # 逐帧读取
    ret, frame = cap.read()
    if not ret:
        break
    
    # 对每一帧进行处理（比如转灰度）
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # 显示结果
    cv2.imshow('Frame', gray)
    
    # 按 'q' 退出
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 释放资源
cap.release()
cv2.destroyAllWindows()
```

> **一句话总结**：视频处理就是把图像处理算法应用到每一帧，利用时间信息实现更强大的功能（如运动检测、目标跟踪）。

---

## 2 核心原理

### 视频的本质

视频是由一系列连续的图像帧组成的，每帧之间有时间间隔。

- **帧率（FPS）**：每秒显示的帧数，通常为 24、30、60
- **分辨率**：每帧图像的宽高，如 1920×1080

打个比方：

> 视频就像翻页动画——快速翻动一页页的图画，看起来就像在动。每一页就是一帧。

### 读取视频

```python
import cv2

# 方式 1：从摄像头读取
cap = cv2.VideoCapture(0)  # 0 表示默认摄像头

# 方式 2：从视频文件读取
cap = cv2.VideoCapture('video.mp4')

# 获取视频信息
fps = int(cap.get(cv2.CAP_PROP_FPS))  # 帧率
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))  # 宽度
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))  # 高度
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))  # 总帧数

print(f"帧率: {fps}, 分辨率: {width}x{height}, 总帧数: {frame_count}")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # 处理帧
    cv2.imshow('Video', frame)
    
    # 按 'q' 退出
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

### 写入视频

```python
import cv2

# 打开摄像头
cap = cv2.VideoCapture(0)

# 定义视频编码器（使用 XVID 编码）
fourcc = cv2.VideoWriter_fourcc(*'XVID')

# 创建 VideoWriter 对象
# 参数：输出文件名, 编码器, 帧率, 分辨率
out = cv2.VideoWriter('output.avi', fourcc, 20.0, (640, 480))

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # 处理帧（比如转灰度再转回 BGR）
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    frame_processed = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    
    # 写入帧
    out.write(frame_processed)
    
    # 显示
    cv2.imshow('Frame', frame_processed)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 释放资源
cap.release()
out.release()
cv2.destroyAllWindows()
```

### 帧差法：运动检测

帧差法是最简单的运动检测方法：**比较相邻两帧的差异**，差异大的地方就是运动区域。

```python
import cv2

# 打开摄像头
cap = cv2.VideoCapture(0)

# 读取第一帧
ret, prev_frame = cap.read()
prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
prev_gray = cv2.GaussianBlur(prev_gray, (21, 21), 0)  # 高斯模糊去噪

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # 转灰度并模糊
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (21, 21), 0)
    
    # 计算帧差（绝对值）
    frame_diff = cv2.absdiff(prev_gray, gray)
    
    # 阈值化（差异 > 25 的像素认为是运动）
    _, thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)
    
    # 膨胀（填充空洞）
    thresh = cv2.dilate(thresh, None, iterations=2)
    
    # 查找轮廓
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        if cv2.contourArea(contour) < 500:  # 过滤小区域
            continue
        x, y, w, h = cv2.boundingRect(contour)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    cv2.imshow('Motion Detection', frame)
    
    # 更新前一帧
    prev_gray = gray
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

打个比方：

> 帧差法就像你盯着一个房间，如果有人移动了，你会看到"变化"的地方。帧差法就是比较前后两帧，找到"变化"的区域。

### 背景减除：更高级的运动检测

帧差法只能检测相邻帧的变化，**背景减除**通过建立背景模型，可以检测所有前景（运动）目标。

```python
import cv2

# 打开摄像头
cap = cv2.VideoCapture(0)

# 创建背景减除器
# history: 用于建模的历史帧数
# varThreshold: 像素与背景的方差阈值
# detectShadows: 是否检测阴影
bg_subtractor = cv2.createBackgroundSubtractorMOG2(
    history=500, varThreshold=16, detectShadows=True
)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # 应用背景减除
    # 返回前景掩码（白色是前景，黑色是背景）
    # 阴影区域显示为灰色（值 127）
    mask = bg_subtractor.apply(frame)
    
    # 去除阴影（把灰色变成黑色）
    _, mask = cv2.threshold(mask, 200, 255, cv2.THRESH_BINARY)
    
    # 形态学操作（去噪）
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # 查找轮廓
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        if cv2.contourArea(contour) < 1000:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    cv2.imshow('Background Subtraction', frame)
    cv2.imshow('Mask', mask)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

### MeanShift 跟踪

MeanShift 是一种**基于颜色直方图**的跟踪算法：

1. **初始化**：在第一帧中选择目标区域，计算颜色直方图
2. **跟踪**：在后续帧中，用 MeanShift 算法找到与目标颜色直方图最相似的区域

```python
import cv2
import numpy as np

# 打开摄像头
cap = cv2.VideoCapture(0)

# 读取第一帧
ret, frame = cap.read()

# 手动选择目标区域（用鼠标框选）
x, y, w, h = cv2.selectROI('Select Target', frame)
cv2.destroyWindow('Select Target')

# 提取目标区域
target = frame[y:y+h, x:x+w]

# 转换到 HSV 颜色空间
hsv_target = cv2.cvtColor(target, cv2.COLOR_BGR2HSV)

# 计算颜色直方图
# 参数：图像, 通道数, 掩码, 直方图大小, 范围
target_hist = cv2.calcHist([hsv_target], [0, 1], None, [180, 256], [0, 180, 0, 256])
# 归一化
cv2.normalize(target_hist, target_hist, 0, 255, cv2.NORM_MINMAX)

# 初始搜索窗口
track_window = (x, y, w, h)

# MeanShift 终止条件
# 参数：类型, 最大迭代次数, 精度
term_crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 1)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # 转换到 HSV
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    # 计算反向投影（每个像素属于目标的概率）
    dst = cv2.calcBackProject([hsv], [0, 1], target_hist, [0, 180, 0, 256], 1)
    
    # 应用 MeanShift
    ret, track_window = cv2.meanShift(dst, track_window, term_crit)
    
    # 画出跟踪结果
    x, y, w, h = track_window
    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    cv2.imshow('MeanShift Tracking', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

### CAMShift 跟踪

CAMShift（Continuously Adaptive MeanShift）是 MeanShift 的改进版，**能处理目标大小变化**：

```python
import cv2
import numpy as np

# 打开摄像头
cap = cv2.VideoCapture(0)

# 读取第一帧
ret, frame = cap.read()

# 选择目标区域
x, y, w, h = cv2.selectROI('Select Target', frame)
cv2.destroyWindow('Select Target')

# 提取目标
target = frame[y:y+h, x:x+w]
hsv_target = cv2.cvtColor(target, cv2.COLOR_BGR2HSV)

# 计算颜色直方图
target_hist = cv2.calcHist([hsv_target], [0, 1], None, [180, 256], [0, 180, 0, 256])
cv2.normalize(target_hist, target_hist, 0, 255, cv2.NORM_MINMAX)

track_window = (x, y, w, h)
term_crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 1)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    dst = cv2.calcBackProject([hsv], [0, 1], target_hist, [0, 180, 0, 256], 1)
    
    # 应用 CAMShift（返回旋转矩形）
    ret, track_window = cv2.CamShift(dst, track_window, term_crit)
    
    # 画出旋转矩形
    box = cv2.boxPoints(ret)
    box = np.int0(box)
    cv2.drawContours(frame, [box], 0, (0, 255, 0), 2)
    
    cv2.imshow('CAMShift Tracking', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

### KCF 跟踪

KCF（Kernelized Correlation Filters）是一种**基于相关滤波**的快速跟踪算法：

```python
import cv2

# 打开摄像头
cap = cv2.VideoCapture(0)

# 读取第一帧
ret, frame = cap.read()

# 选择目标区域
bbox = cv2.selectROI('Select Target', frame)
cv2.destroyWindow('Select Target')

# 创建 KCF 跟踪器
tracker = cv2.TrackerKCF_create()

# 初始化跟踪器
tracker.init(frame, bbox)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # 更新跟踪
    success, bbox = tracker.update(frame)
    
    if success:
        x, y, w, h = [int(v) for v in bbox]
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(frame, 'Tracking', (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, (0, 255, 0), 2)
    else:
        cv2.putText(frame, 'Lost', (100, 80), cv2.FONT_HERSHEY_SIMPLEX,
                    0.8, (0, 0, 255), 2)
    
    cv2.imshow('KCF Tracking', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

---

## 3 对比表格

### 视频读写函数速查

| 函数 | 功能 | 参数 |
| --- | --- | --- |
| `cv2.VideoCapture(source)` | 打开视频源 | 摄像头索引或文件名 |
| `cap.read()` | 读取一帧 | 返回 (ret, frame) |
| `cap.get(propId)` | 获取视频属性 | 属性 ID（如 FPS、分辨率） |
| `cv2.VideoWriter(filename, fourcc, fps, frameSize)` | 创建视频写入器 | 文件名, 编码器, 帧率, 分辨率 |
| `out.write(frame)` | 写入一帧 | 帧图像 |

### 运动检测方法对比

| 方法 | 原理 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| 帧差法 | 比较相邻帧差异 | 简单快速 | 只能检测运动，不能区分前景背景 | 快速运动检测 |
| 背景减除 | 建立背景模型 | 能区分前景背景 | 需要时间建立模型 | 固定摄像头监控 |

### 目标跟踪算法对比

| 算法 | 原理 | 速度 | 精度 | 尺度变化 | 旋转 | 遮挡 |
| --- | --- | --- | --- | --- | --- | --- |
| MeanShift | 颜色直方图 + 均值漂移 | 快 | 中 | ❌ | ❌ | ❌ |
| CAMShift | MeanShift + 自适应窗口 | 快 | 中 | ✅ | ✅ | ❌ |
| KCF | 相关滤波 | 很快 | 高 | ❌ | ❌ | 部分 |

### 跟踪算法选择建议

| 场景 | 推荐算法 | 原因 |
| --- | --- | --- |
| 实时跟踪（如无人机） | KCF | 速度快，精度高 |
| 目标大小变化 | CAMShift | 能自适应窗口大小 |
| 颜色特征明显 | MeanShift/CAMShift | 基于颜色直方图 |
| 需要高精度 | KCF | 相关滤波效果好 |

---

## 4 新手常见误区

### 误区 1："VideoCapture 打开失败不检查"

**❌ 错误！** 摄像头可能被占用，视频文件可能不存在，必须检查返回值。

```python
# ❌ 错误：不检查是否成功打开
cap = cv2.VideoCapture(0)
while True:
    ret, frame = cap.read()  # 如果打开失败，ret 会是 False

# ✅ 正确：检查是否成功打开
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("无法打开摄像头")
    exit()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("无法读取帧")
        break
```

### 误区 2："不释放资源"

**❌ 错误！** 使用完 VideoCapture 和 VideoWriter 后必须释放资源，否则可能导致摄像头被占用。

```python
# ❌ 错误：不释放资源
cap = cv2.VideoCapture(0)
# ... 处理视频 ...
# 程序结束，摄像头可能被占用

# ✅ 正确：释放资源
cap = cv2.VideoCapture(0)
# ... 处理视频 ...
cap.release()  # 释放摄像头
cv2.destroyAllWindows()  # 关闭窗口
```

### 误区 3："MeanShift 跟踪失败不重新初始化"

**❌ 错误！** MeanShift 和 CAMShift 在目标被遮挡或快速移动时容易丢失，需要检测并重新初始化。

```python
# ❌ 错误：不检查跟踪是否成功
while cap.isOpened():
    ret, frame = cap.read()
    ret, track_window = cv2.meanShift(dst, track_window, term_crit)
    # 即使跟踪失败也继续

# ✅ 正确：检查跟踪质量
while cap.isOpened():
    ret, frame = cap.read()
    ret, track_window = cv2.meanShift(dst, track_window, term_crit)
    
    # 检查跟踪窗口是否还在图像内
    x, y, w, h = track_window
    if x < 0 or y < 0 or x + w > frame.shape[1] or y + h > frame.shape[0]:
        print("目标丢失，需要重新初始化")
        # 重新选择目标...
```

### 误区 4："KCF 跟踪器可以跟踪多个目标"

**❌ 错误！** OpenCV 的 KCF 跟踪器一次只能跟踪一个目标。要跟踪多个目标，需要创建多个跟踪器。

```python
# ❌ 错误：用一个跟踪器跟踪多个目标
tracker = cv2.TrackerKCF_create()
tracker.init(frame, bbox1)
tracker.init(frame, bbox2)  # 会覆盖之前的初始化

# ✅ 正确：为每个目标创建独立的跟踪器
trackers = []
for bbox in [bbox1, bbox2, bbox3]:
    tracker = cv2.TrackerKCF_create()
    tracker.init(frame, bbox)
    trackers.append(tracker)

# 在循环中更新所有跟踪器
while cap.isOpened():
    ret, frame = cap.read()
    for tracker in trackers:
        success, bbox = tracker.update(frame)
        # 画出结果...
```

### 误区 5："背景减除器不需要预热"

**❌ 错误！** 背景减除器需要处理前几帧来建立背景模型，刚开始时效果不好。

```python
# ❌ 错误：第一帧就期望准确的结果
bg_subtractor = cv2.createBackgroundSubtractorMOG2()
ret, frame = cap.read()
mask = bg_subtractor.apply(frame)  # 第一帧效果很差

# ✅ 正确：先处理几帧预热
bg_subtractor = cv2.createBackgroundSubtractorMOG2()
for _ in range(30):  # 先处理 30 帧建立背景模型
    ret, frame = cap.read()
    if not ret:
        break
    bg_subtractor.apply(frame)

# 然后开始正式处理
while cap.isOpened():
    ret, frame = cap.read()
    mask = bg_subtractor.apply(frame)  # 现在效果稳定了
```

---

## 5 动手练习

### 练习 1：基础练习——视频录制

编写程序，打开摄像头，录制 10 秒视频并保存为 AVI 文件。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import time

# 打开摄像头
cap = cv2.VideoCapture(0)

# 检查是否成功打开
if not cap.isOpened():
    print("无法打开摄像头")
    exit()

# 获取视频参数
fps = int(cap.get(cv2.CAP_PROP_FPS))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# 创建视频写入器
fourcc = cv2.VideoWriter_fourcc(*'XVID')
out = cv2.VideoWriter('output.avi', fourcc, fps, (width, height))

print("开始录制，按 'q' 停止...")
start_time = time.time()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # 写入帧
    out.write(frame)
    
    # 显示
    cv2.imshow('Recording', frame)
    
    # 检查是否超时或按 q
    if time.time() - start_time > 10 or cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 释放资源
cap.release()
out.release()
cv2.destroyAllWindows()
print("录制完成，保存为 output.avi")
```

</details>

### 练习 2：进阶练习——运动检测报警系统

编写程序，检测视频中的运动目标，当检测到运动时，在画面上显示"Motion Detected!"并记录时间。

<details>
<summary>点击查看答案</summary>

```python
import cv2
from datetime import datetime

# 打开摄像头
cap = cv2.VideoCapture(0)

# 读取第一帧
ret, prev_frame = cap.read()
prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
prev_gray = cv2.GaussianBlur(prev_gray, (21, 21), 0)

motion_detected = False
last_motion_time = None

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # 转灰度并模糊
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (21, 21), 0)
    
    # 帧差
    frame_diff = cv2.absdiff(prev_gray, gray)
    _, thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)
    thresh = cv2.dilate(thresh, None, iterations=2)
    
    # 查找轮廓
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    motion_detected = False
    for contour in contours:
        if cv2.contourArea(contour) < 1000:
            continue
        motion_detected = True
        x, y, w, h = cv2.boundingRect(contour)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    # 如果检测到运动
    if motion_detected:
        last_motion_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cv2.putText(frame, 'Motion Detected!', (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                    1, (0, 0, 255), 2)
        cv2.putText(frame, last_motion_time, (10, 60), cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, (0, 0, 255), 2)
    
    cv2.imshow('Motion Alarm', frame)
    
    # 更新前一帧
    prev_gray = gray
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

</details>

### 练习 3（挑战）：综合练习——多目标跟踪系统

编写程序，使用背景减除检测运动目标，然后为每个检测到的目标创建 KCF 跟踪器，实现多目标跟踪。

<details>
<summary>点击查看答案</summary>

```python
import cv2

# 打开摄像头
cap = cv2.VideoCapture(0)

# 创建背景减除器
bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=16)

# 预热
for _ in range(30):
    ret, frame = cap.read()
    if not ret:
        break
    bg_subtractor.apply(frame)

trackers = []
frame_count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    frame_count += 1
    
    # 每 30 帧重新检测一次
    if frame_count % 30 == 0:
        # 背景减除
        mask = bg_subtractor.apply(frame)
        _, mask = cv2.threshold(mask, 200, 255, cv2.THRESH_BINARY)
        
        # 形态学操作
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        # 查找轮廓
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 为每个大轮廓创建跟踪器
        trackers = []
        for contour in contours:
            if cv2.contourArea(contour) < 2000:
                continue
            x, y, w, h = cv2.boundingRect(contour)
            tracker = cv2.TrackerKCF_create()
            tracker.init(frame, (x, y, w, h))
            trackers.append(tracker)
    
    # 更新所有跟踪器
    for tracker in trackers:
        success, bbox = tracker.update(frame)
        if success:
            x, y, w, h = [int(v) for v in bbox]
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    # 显示信息
    cv2.putText(frame, f'Tracking: {len(trackers)} targets', (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    cv2.imshow('Multi-Target Tracking', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **人脸检测与识别**——这是计算机视觉最经典的应用之一。你会学到如何使用 Haar 级联分类器和深度学习模型检测人脸，以及构建一个人脸识别系统。这是从"目标检测"到"特定目标识别"的重要一步。
