---
title: "第7章：颜色空间与阈值化"
description: "HSV/HSL 颜色空间、阈值处理、自适应阈值、颜色空间转换"
---

# 第7章：颜色空间与阈值化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么需要不同的颜色空间？RGB 不够用吗？
- HSV 和 HSL 有什么区别？什么时候用哪个？
- 如何根据颜色检测特定物体？
- 阈值化是什么？为什么有这么多类型？

这一章就是为了解答这些问题。我们会从 RGB 的局限性出发，学习 HSV、HSL 等更直观的颜色空间，再掌握阈值化技术，最后实现一个基于颜色的物体检测程序。

---

## 1 为什么需要不同的颜色空间？

### 痛点分析

在图像处理中，RGB 颜色空间虽然常见，但有很多局限：

**RGB 的局限性**

1. **不符合人类感知**：RGB 用三个数值表示颜色，但人类对颜色的感知更直观（如"红色"、"鲜艳"）
2. **颜色与亮度耦合**：改变亮度会同时影响 R、G、B 三个通道，难以单独调节
3. **颜色检测困难**：在 RGB 空间中，相似颜色可能数值差异很大

打个比方：

> HSV 就像选颜料：先选颜色(H)，再选鲜艳程度(S)，最后选明暗(V)。想象你去买油漆，你会说"我要红色（H），要鲜艳一点的（S），不要太暗（V）"。这比说"我要 RGB(255, 0, 0)"直观多了。

### 颜色空间的应用场景

| 颜色空间 | 适用场景 | 优势 |
|---------|---------|------|
| **RGB/BGR** | 图像显示、存储 | 硬件友好，通用标准 |
| **HSV** | 颜色检测、跟踪 | 符合人类颜色感知 |
| **HSL** | 图像调整、滤镜 | 亮度调节更自然 |
| **灰度** | 边缘检测、形态学 | 计算简单，去冗余 |

### 解决方案

OpenCV 提供了颜色空间转换函数：

```python
import cv2

# 读取图像（BGR 格式）
img = cv2.imread('image.jpg')

# 转换为 HSV
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# 转换为灰度
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 转换为 HSL
hsl = cv2.cvtColor(img, cv2.COLOR_BGR2HLS)
```

> **一句话总结**：不同的颜色空间适用于不同的任务，HSV 在颜色检测中比 RGB 更直观、更有效。

---

## 2 核心原理讲解

### RGB/BGR 颜色空间

**原理**：用红(R)、绿(G)、蓝(B)三个通道的组合表示颜色。

```
任意颜色 = R × 红色 + G × 绿色 + B × 蓝色
```

**特点**：
- 每个通道取值 0-255
- OpenCV 默认使用 BGR 顺序（不是 RGB！）
- 设备无关性差

> 注意：OpenCV 读取图像时默认是 BGR 格式，而 matplotlib 显示时期望 RGB 格式，需要转换。

### HSV 颜色空间

**原理**：用色相(H)、饱和度(S)、明度(V)三个维度表示颜色。

打个比方：

> HSV 就像调色板：
> - **H（色相）**：选择颜色种类（红、橙、黄、绿、青、蓝、紫）
> - **S（饱和度）**：选择颜色的鲜艳程度（从灰到鲜艳）
> - **V（明度）**：选择颜色的明暗程度（从黑到亮）

**取值范围**：
- H：0-180（OpenCV 中，实际是 0-360 的一半）
- S：0-255
- V：0-255

**颜色对应的 H 值**：

| 颜色 | H 值范围 |
|------|---------|
| 红色 | 0-10, 170-180 |
| 橙色 | 10-25 |
| 黄色 | 25-35 |
| 绿色 | 35-85 |
| 青色 | 85-100 |
| 蓝色 | 100-130 |
| 紫色 | 130-170 |

### HSL 颜色空间

**原理**：与 HSV 类似，但用亮度(L)代替明度(V)。

**HSV 与 HSL 的区别**：

| 特性 | HSV | HSL |
|------|-----|-----|
| 第三个维度 | V（明度） | L（亮度） |
| 纯色的 V/L | V=255 | L=127 |
| 白色的 V/L | V=255, S=0 | L=255 |
| 黑色的 V/L | V=0 | L=0 |

打个比方：

> HSV 的 V 像灯光亮度——关掉灯（V=0）就是黑色，开到最亮（V=255）能看到最鲜艳的颜色。
> HSL 的 L 像环境亮度——最暗（L=0）是黑色，最亮（L=255）是白色，中间（L=127）能看到最鲜艳的颜色。

### 阈值化（Thresholding）

**原理**：将灰度图像转换为二值图像（只有黑白两色）。

```python
# 简单阈值化
ret, thresh = cv2.threshold(src, thresh, maxval, type)
```

**参数说明**：
- `src`：输入灰度图
- `thresh`：阈值
- `maxval`：最大值（通常为 255）
- `type`：阈值类型

**5 种阈值类型**：

| 类型 | 公式 | 效果 |
|------|------|------|
| `THRESH_BINARY` | dst = maxval if src > thresh else 0 | 大于阈值为白，否则为黑 |
| `THRESH_BINARY_INV` | dst = 0 if src > thresh else maxval | 大于阈值为黑，否则为白 |
| `THRESH_TRUNC` | dst = thresh if src > thresh else src | 大于阈值截断为阈值 |
| `THRESH_TOZERO` | dst = src if src > thresh else 0 | 大于阈值不变，否则为 0 |
| `THRESH_TOZERO_INV` | dst = 0 if src > thresh else src | 大于阈值为 0，否则不变 |

### 自适应阈值化

**原理**：根据局部区域的亮度动态计算阈值，适合光照不均匀的图像。

```python
# 自适应阈值化
thresh = cv2.adaptiveThreshold(src, maxValue, adaptiveMethod, 
                                thresholdType, blockSize, C)
```

**参数说明**：
- `src`：输入灰度图
- `maxValue`：最大值
- `adaptiveMethod`：自适应方法
  - `ADAPTIVE_THRESH_MEAN_C`：邻域均值
  - `ADAPTIVE_THRESH_GAUSSIAN_C`：高斯加权均值
- `thresholdType`：阈值类型（通常用 BINARY）
- `blockSize`：邻域大小（必须是奇数）
- `C`：常数，从计算出的阈值中减去

### OTSU 二值化

**原理**：自动计算最佳阈值，使类间方差最大。

```python
# OTSU 二值化
ret, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
```

**特点**：
- 不需要手动设置阈值
- 适合双峰直方图（前景和背景分离明显）
- 返回自动计算的最佳阈值

---

## 3 基础用法 + 逐行注释

### 示例 1：颜色空间转换

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像（BGR 格式）
img_bgr = cv2.imread('image.jpg')

# 转换为 RGB（用于 matplotlib 显示）
img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

# 转换为 HSV
img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

# 转换为 HSL
img_hsl = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HLS)

# 转换为灰度
img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

# 显示结果
plt.figure(figsize=(12, 8))

plt.subplot(2, 3, 1)
plt.title('RGB')
plt.imshow(img_rgb)

plt.subplot(2, 3, 2)
plt.title('HSV - H Channel')
plt.imshow(img_hsv[:, :, 0], cmap='hsv')

plt.subplot(2, 3, 3)
plt.title('HSV - S Channel')
plt.imshow(img_hsv[:, :, 1], cmap='gray')

plt.subplot(2, 3, 4)
plt.title('HSV - V Channel')
plt.imshow(img_hsv[:, :, 2], cmap='gray')

plt.subplot(2, 3, 5)
plt.title('HSL - H Channel')
plt.imshow(img_hsl[:, :, 0], cmap='hsv')

plt.subplot(2, 3, 6)
plt.title('Grayscale')
plt.imshow(img_gray, cmap='gray')

plt.tight_layout()
plt.show()
```

### 示例 2：基于颜色的物体检测

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('balls.jpg')

# 转换为 HSV 颜色空间
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# 定义蓝色的 HSV 范围
# 蓝色在 HSV 中的 H 值约为 100-130
lower_blue = np.array([100, 50, 50])   # 下限
upper_blue = np.array([130, 255, 255]) # 上限

# 创建掩码（mask）
# 在范围内的像素为白色（255），范围外为黑色（0）
mask = cv2.inRange(hsv, lower_blue, upper_blue)

# 使用掩码提取蓝色区域
# 位运算：只保留掩码为白色的部分
blue_only = cv2.bitwise_and(img, img, mask=mask)

# 查找蓝色物体的轮廓
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, 
                                cv2.CHAIN_APPROX_SIMPLE)

# 在原图上绘制轮廓
result = img.copy()
for i, contour in enumerate(contours):
    # 过滤小区域
    if cv2.contourArea(contour) > 500:
        # 绘制轮廓
        cv2.drawContours(result, [contour], -1, (0, 255, 0), 2)
        
        # 计算质心
        M = cv2.moments(contour)
        if M['m00'] != 0:
            cx = int(M['m10'] / M['m00'])
            cy = int(M['m01'] / M['m00'])
            cv2.circle(result, (cx, cy), 5, (255, 0, 0), -1)
            cv2.putText(result, f"Blue {i+1}", (cx - 30, cy - 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

# 显示结果
cv2.imshow('Original', img)
cv2.imshow('Mask', mask)
cv2.imshow('Blue Only', blue_only)
cv2.imshow('Detection Result', result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 示例 3：阈值化方法对比

```python
import cv2
import matplotlib.pyplot as plt

# 读取图像并转为灰度
img = cv2.imread('image.jpg', 0)

# 1. 简单阈值化（5 种类型）
ret1, thresh1 = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
ret2, thresh2 = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)
ret3, thresh3 = cv2.threshold(img, 127, 255, cv2.THRESH_TRUNC)
ret4, thresh4 = cv2.threshold(img, 127, 255, cv2.THRESH_TOZERO)
ret5, thresh5 = cv2.threshold(img, 127, 255, cv2.THRESH_TOZERO_INV)

# 2. OTSU 自动阈值
ret6, thresh6 = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# 3. 自适应阈值化
adapt_mean = cv2.adaptiveThreshold(img, 255, 
                                    cv2.ADAPTIVE_THRESH_MEAN_C,
                                    cv2.THRESH_BINARY, 11, 2)
adapt_gauss = cv2.adaptiveThreshold(img, 255,
                                     cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                     cv2.THRESH_BINARY, 11, 2)

# 显示结果
plt.figure(figsize=(15, 10))

titles = ['Original', 'BINARY', 'BINARY_INV', 'TRUNC', 'TOZERO', 
          'TOZERO_INV', 'OTSU', 'Adaptive Mean', 'Adaptive Gaussian']
images = [img, thresh1, thresh2, thresh3, thresh4, thresh5, 
          thresh6, adapt_mean, adapt_gauss]

for i in range(9):
    plt.subplot(3, 3, i+1)
    plt.title(titles[i])
    plt.imshow(images[i], cmap='gray')
    plt.axis('off')

plt.tight_layout()
plt.show()

print(f"OTSU 自动计算的阈值：{ret6}")
```

> **原理**：`cv2.inRange()` 用于创建颜色掩码，它会检查每个像素是否在指定的范围内。对于 HSV 图像，范围是一个三维的盒子。

---

## 4 对比表格

### 颜色空间对比

| 特性 | RGB/BGR | HSV | HSL | 灰度 |
|------|---------|-----|-----|------|
| **通道数** | 3 | 3 | 3 | 1 |
| **颜色表示** | 红绿蓝混合 | 色相+饱和度+明度 | 色相+饱和度+亮度 | 亮度 |
| **符合人类感知** | 差 | 好 | 好 | 不适用 |
| **颜色检测** | 困难 | 简单 | 简单 | 不适用 |
| **计算复杂度** | 低 | 中 | 中 | 最低 |
| **适用场景** | 显示、存储 | 颜色检测、跟踪 | 图像调整 | 边缘检测、形态学 |

### 阈值化方法对比

| 方法 | 原理 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|---------|
| **简单阈值** | 固定阈值 | 简单快速 | 不适合光照不均 | 光照均匀的图像 |
| **OTSU** | 自动计算最佳阈值 | 无需手动调节 | 假设双峰直方图 | 前景背景分离明显 |
| **自适应均值** | 局部均值作为阈值 | 适应光照变化 | 计算较慢 | 光照不均匀 |
| **自适应高斯** | 高斯加权局部均值 | 效果更平滑 | 计算最慢 | 需要平滑过渡 |

### 颜色检测的 HSV 范围参考

| 颜色 | H 范围 | S 范围 | V 范围 |
|------|--------|--------|--------|
| 红色 | 0-10, 170-180 | 50-255 | 50-255 |
| 橙色 | 10-25 | 50-255 | 50-255 |
| 黄色 | 25-35 | 50-255 | 50-255 |
| 绿色 | 35-85 | 50-255 | 50-255 |
| 青色 | 85-100 | 50-255 | 50-255 |
| 蓝色 | 100-130 | 50-255 | 50-255 |
| 紫色 | 130-170 | 50-255 | 50-255 |

---

## 5 新手常见误区

### 误区 1："OpenCV 使用 RGB 颜色空间"

**错！** OpenCV 默认使用 BGR 格式（蓝绿红），而不是 RGB。

正确做法：
```python
# ✅ 正确做法
img = cv2.imread('image.jpg')  # 读取为 BGR
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # 转换为 RGB 用于 matplotlib

# ❌ 错误做法
plt.imshow(img)  # 直接显示 BGR 图像，颜色会错乱
```

### 误区 2："HSV 的 H 范围是 0-360"

在 OpenCV 中，H 的范围是 0-180（为了用 uint8 存储），而不是 0-360。

正确做法：
```python
# ✅ OpenCV 中的范围
hsv_value = cv2.cvtColor(np.uint8([[[r, g, b]]]), cv2.COLOR_BGR2HSV)
# H 范围：0-180

# ❌ 错误理解
# 以为 H 范围是 0-360，导致颜色检测失败
```

### 误区 3："阈值化只能用固定阈值"

不是的。对于光照不均匀的图像，应该使用自适应阈值化。

正确做法：
```python
# ✅ 光照不均匀时使用自适应阈值
adapt = cv2.adaptiveThreshold(gray, 255, 
                               cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY, 11, 2)

# ✅ 光照均匀时可以用固定阈值
ret, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
```

### 误区 4："颜色检测只需要 H 通道"

虽然 H 通道表示颜色，但 S 和 V 通道也很重要，用于过滤掉灰色和低亮度区域。

正确做法：
```python
# ✅ 同时设置三个通道的范围
lower_blue = np.array([100, 50, 50])   # H, S, V 下限
upper_blue = np.array([130, 255, 255]) # H, S, V 上限

# ❌ 错误做法
# 只设置 H 范围，会检测到灰色区域
```

### 误区 5："OTSU 对所有图像都有效"

OTSU 假设图像直方图是双峰的（前景和背景分离明显），对于多峰直方图效果不好。

正确做法：
- 先查看直方图分布
- 双峰直方图 → OTSU
- 光照不均 → 自适应阈值
- 复杂情况 → 手动调节阈值

---

## 6 动手练习

### 练习 1：基础练习 - 颜色空间转换

读取一张图像，分别转换为 HSV、HSL、灰度，并显示每个通道。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像
img_bgr = cv2.imread('image.jpg')
img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

# 转换为不同颜色空间
hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
hsl = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HLS)
gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

# 显示结果
plt.figure(figsize=(12, 10))

# 原图
plt.subplot(3, 3, 1)
plt.title('Original (RGB)')
plt.imshow(img_rgb)

# HSV 三个通道
plt.subplot(3, 3, 2)
plt.title('HSV - Hue')
plt.imshow(hsv[:, :, 0], cmap='hsv')

plt.subplot(3, 3, 3)
plt.title('HSV - Saturation')
plt.imshow(hsv[:, :, 1], cmap='gray')

plt.subplot(3, 3, 4)
plt.title('HSV - Value')
plt.imshow(hsv[:, :, 2], cmap='gray')

# HSL 三个通道
plt.subplot(3, 3, 5)
plt.title('HSL - Hue')
plt.imshow(hsl[:, :, 0], cmap='hsv')

plt.subplot(3, 3, 6)
plt.title('HSL - Saturation')
plt.imshow(hsl[:, :, 1], cmap='gray')

plt.subplot(3, 3, 7)
plt.title('HSL - Lightness')
plt.imshow(hsl[:, :, 2], cmap='gray')

# 灰度
plt.subplot(3, 3, 8)
plt.title('Grayscale')
plt.imshow(gray, cmap='gray')

plt.tight_layout()
plt.show()

print("HSV 通道说明：")
print("- H（色相）：显示颜色种类")
print("- S（饱和度）：显示颜色鲜艳程度")
print("- V（明度）：显示亮度")
```

</details>

### 练习 2：进阶练习 - 特定颜色检测

实现一个程序，检测图像中的所有红色物体，并在原图上用矩形框标出。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('objects.jpg')
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# 定义红色的 HSV 范围（红色在 H=0 和 H=180 附近）
# 红色范围 1
lower_red1 = np.array([0, 50, 50])
upper_red1 = np.array([10, 255, 255])
mask1 = cv2.inRange(hsv, lower_red1, upper_red1)

# 红色范围 2
lower_red2 = np.array([170, 50, 50])
upper_red2 = np.array([180, 255, 255])
mask2 = cv2.inRange(hsv, lower_red2, upper_red2)

# 合并两个掩码
mask = mask1 | mask2

# 形态学操作去噪
kernel = np.ones((5, 5), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

# 查找轮廓
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, 
                                cv2.CHAIN_APPROX_SIMPLE)

# 在原图上绘制
result = img.copy()
red_count = 0

for contour in contours:
    area = cv2.contourArea(contour)
    if area > 500:  # 过滤小区域
        red_count += 1
        
        # 绘制矩形框
        x, y, w, h = cv2.boundingRect(contour)
        cv2.rectangle(result, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # 标注
        cv2.putText(result, f"Red {red_count}", (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

# 显示结果
cv2.imshow('Original', img)
cv2.imshow('Red Mask', mask)
cv2.imshow('Detection Result', result)
cv2.waitKey(0)
cv2.destroyAllWindows()

print(f"检测到 {red_count} 个红色物体")
```

</details>

### 练习 3（挑战）：综合练习 - 颜色追踪

实现一个实时颜色追踪程序，通过摄像头捕捉画面，追踪画面中的蓝色物体，并在其位置画圆。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 打开摄像头
cap = cv2.VideoCapture(0)

# 定义蓝色的 HSV 范围
lower_blue = np.array([100, 50, 50])
upper_blue = np.array([130, 255, 255])

# 用于追踪的历史位置（用于平滑）
positions = []
max_positions = 5

while True:
    # 读取帧
    ret, frame = cap.read()
    if not ret:
        break
    
    # 翻转画面（镜像效果）
    frame = cv2.flip(frame, 1)
    
    # 转换为 HSV
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    # 创建蓝色掩码
    mask = cv2.inRange(hsv, lower_blue, upper_blue)
    
    # 形态学操作去噪
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # 查找轮廓
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, 
                                    cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # 找到最大的轮廓
        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        
        if area > 500:  # 过滤小区域
            # 计算质心
            M = cv2.moments(largest_contour)
            if M['m00'] != 0:
                cx = int(M['m10'] / M['m00'])
                cy = int(M['m01'] / M['m00'])
                
                # 添加历史位置
                positions.append((cx, cy))
                if len(positions) > max_positions:
                    positions.pop(0)
                
                # 绘制当前位置
                cv2.circle(frame, (cx, cy), 20, (0, 255, 0), 2)
                cv2.circle(frame, (cx, cy), 5, (0, 255, 0), -1)
                
                # 绘制运动轨迹
                for i in range(1, len(positions)):
                    thickness = int(np.sqrt(max_positions / float(i + 1)) * 2.5)
                    cv2.line(frame, positions[i - 1], positions[i], 
                             (0, 0, 255), thickness)
                
                # 计算外接圆
                (x, y), radius = cv2.minEnclosingCircle(largest_contour)
                center = (int(x), int(y))
                radius = int(radius)
                cv2.circle(frame, center, radius, (255, 0, 0), 2)
                
                # 显示信息
                cv2.putText(frame, f"Position: ({cx}, {cy})", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(frame, f"Area: {area}", (10, 60),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    # 显示结果
    cv2.imshow('Frame', frame)
    cv2.imshow('Mask', mask)
    
    # 按 ESC 退出
    if cv2.waitKey(1) == 27:
        break

# 释放资源
cap.release()
cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **形态学操作**——包括腐蚀、膨胀、开运算、闭运算等。这些操作可以进一步处理二值图像，去除噪声、填充空洞、分离或连接物体。形态学操作是图像预处理的重要工具。
