---
title: "第3章：图像基础操作"
description: "图像读取与显示、颜色通道、像素操作、图像属性、ROI 提取"
---

# 第3章：图像基础操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 计算机是怎么存储图像的？图像在内存中到底是什么样子？
- 什么是颜色通道？BGR 和 RGB 有什么区别？
- 怎么修改图像中某个像素的颜色？
- 怎么从大图中截取一小块区域（ROI）？

这一章就是为了解答这些问题。我们会深入理解图像的本质，学会对像素进行精确操作。

---

## 1 为什么需要理解图像基础？

### 痛点分析

很多新手学 OpenCV 时，只会调用函数，不理解图像的本质。结果就是：

- 颜色通道搞混，处理出来的图片颜色怪异
- 不知道图像的数据结构，无法做精细操作
- ROI 提取错误，导致后续处理全部出错

### 解决方案

理解图像在计算机中的存储方式，是所有图像处理的基础。

打个比方：

> 图像就像一个巨大的棋盘，每个格子是一个像素。彩色图像有 3 层棋盘叠在一起（B、G、R 三个通道），每个格子里有一个 0-255 的数字，表示这个颜色的强度。理解了这一点，你就能随心所欲地操控图像了。

---

## 2 核心原理

### 图像的本质：NumPy 数组

在 OpenCV 中，图像就是一个 **NumPy 多维数组**：

| 图像类型 | 数组形状 | 说明 |
| --- | --- | --- |
| 灰度图 | `(高, 宽)` | 每个像素一个值（0-255） |
| 彩色图（BGR） | `(高, 宽, 3)` | 每个像素 3 个值（B、G、R 各一个） |
| 带透明通道（BGRA） | `(高, 宽, 4)` | 每个像素 4 个值（B、G、R、A） |

### 颜色通道：BGR vs RGB

OpenCV 使用 **BGR** 顺序（而不是常见的 RGB），这是历史原因（早期 OpenCV 用 BGR 格式）。

| 格式 | 通道顺序 | 使用场景 |
| --- | --- | --- |
| BGR | 蓝-绿-红 | OpenCV 默认格式 |
| RGB | 红-绿-蓝 | matplotlib、PIL、深度学习 |
| 灰度 | 单通道 | 边缘检测、阈值处理等 |
| HSV | 色调-饱和度-明度 | 颜色检测、物体追踪 |

---

## 3 基础用法

### 3.1 图像读取与显示

```python
import cv2
import numpy as np

# === 读取图像 ===

# 读取彩色图像（默认）
img_color = cv2.imread('photo.jpg')

# 读取灰度图像（直接转为灰度）
img_gray = cv2.imread('photo.jpg', cv2.IMREAD_GRAYSCALE)

# 读取带透明通道的图像（PNG 等）
img_alpha = cv2.imread('logo.png', cv2.IMREAD_UNCHANGED)

# === 显示图像 ===

# 创建窗口并显示图像
cv2.imshow('Color Image', img_color)   # 显示彩色图
cv2.imshow('Gray Image', img_gray)     # 显示灰度图

# 等待按键（0 表示无限等待）
cv2.waitKey(0)

# 关闭所有窗口
cv2.destroyAllWindows()
```

### 3.2 图像属性

```python
import cv2

img = cv2.imread('photo.jpg')

# === 图像形状 ===
# shape 返回 (高, 宽, 通道数)
print(f"图像形状: {img.shape}")
# 例如: (480, 640, 3) 表示高480像素、宽640像素、3个通道

# === 图像大小 ===
# size 返回总像素数 = 高 × 宽 × 通道数
print(f"像素总数: {img.size}")
# 例如: 480 × 640 × 3 = 921600

# === 数据类型 ===
# dtype 返回数据类型，通常是 uint8
print(f"数据类型: {img.dtype}")
# uint8 表示 8位无符号整数，范围 0-255

# === 获取高和宽 ===
height, width, channels = img.shape
print(f"高度: {height}, 宽度: {width}, 通道数: {channels}")
```

### 3.3 颜色通道操作

```python
import cv2
import numpy as np

img = cv2.imread('photo.jpg')

# === 方法一：索引分离通道 ===
b = img[:, :, 0]  # 提取蓝色通道（第0个通道）
g = img[:, :, 1]  # 提取绿色通道（第1个通道）
r = img[:, :, 2]  # 提取红色通道（第2个通道）

# === 方法二：cv2.split() 分离通道 ===
b, g, r = cv2.split(img)

# 显示单个通道（显示为灰度图）
cv2.imshow('Blue Channel', b)
cv2.imshow('Green Channel', g)
cv2.imshow('Red Channel', r)

# === 合并通道 ===
# 方法一：cv2.merge()
merged = cv2.merge([b, g, r])

# 方法二：NumPy 的 dstack
merged2 = np.dstack([b, g, r])

# === 修改单个通道 ===
# 把蓝色通道全部设为 0（去掉蓝色）
img_no_blue = img.copy()
img_no_blue[:, :, 0] = 0
cv2.imshow('No Blue', img_no_blue)  # 图像会偏黄（因为没有蓝色）

cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 3.4 像素操作

```python
import cv2
import numpy as np

img = cv2.imread('photo.jpg')

# === 访问单个像素 ===
# 注意：索引顺序是 [y, x]（先行后列），不是 [x, y]！
pixel = img[100, 200]  # 获取第100行、第200列的像素值
print(f"像素值 (BGR): {pixel}")  # 例如: [123 45 67]

# 获取单个通道的值
blue_value = img[100, 200, 0]    # 蓝色通道值
green_value = img[100, 200, 1]   # 绿色通道值
red_value = img[100, 200, 2]     # 红色通道值

# === 修改单个像素 ===
img[100, 200] = [0, 0, 255]  # 把该像素设为红色

# === 批量修改像素 ===
# 把图像上半部分全部设为黑色
img[:240, :] = [0, 0, 0]

# 把图像整体变亮（每个像素值加 50）
img_brighter = cv2.add(img, 50)  # 推荐用 cv2.add，会自动截断到 0-255

# ❌ 不推荐直接加（可能溢出）
img_overflow = img + 50  # 如果 200+50=250，但 uint8 最大 255，会变成 250-256=... 出错

# === 获取图像区域（ROI） ===
# 截取图像中间 200x200 的区域
roi = img[100:300, 200:400]  # [y1:y2, x1:x2]
cv2.imshow('ROI', roi)

# 把 ROI 复制到另一个位置
img[0:200, 0:200] = roi

cv2.waitKey(0)
cv2.destroyAllWindows()
```

> **原理**：图像就是一个 NumPy 数组，所有操作都是数组操作。理解了这一点，你就能灵活运用 NumPy 的知识来处理图像。

---

## 4 进阶用法

### 4.1 图像通道合并与拆分实战

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('photo.jpg')
b, g, r = cv2.split(img)

# 创建只有单通道的彩色图像
# 比如：只显示蓝色通道，其他通道为 0
zeros = np.zeros(b.shape, dtype=np.uint8)

blue_only = cv2.merge([b, zeros, zeros])   # 只有蓝色通道
green_only = cv2.merge([zeros, g, zeros])  # 只有绿色通道
red_only = cv2.merge([zeros, zeros, r])    # 只有红色通道

cv2.imshow('Blue Only', blue_only)
cv2.imshow('Green Only', green_only)
cv2.imshow('Red Only', red_only)

cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 4.2 图像加法与混合

```python
import cv2
import numpy as np

# 读取两张图像（确保大小相同）
img1 = cv2.imread('photo1.jpg')
img2 = cv2.imread('photo2.jpg')

# === 图像加法 ===
# cv2.add(): 饱和运算，超过 255 就截断为 255
result_add = cv2.add(img1, img2)

# 直接相加: 会溢出（255 + 10 = 9，而不是 255）
result_overflow = img1 + img2  # ❌ 不推荐

# === 图像加权混合 ===
# dst = src1 * alpha + src2 * beta + gamma
alpha = 0.7   # 第一张图的权重
beta = 0.3    # 第二张图的权重
gamma = 0     # 额外偏移量
blended = cv2.addWeighted(img1, alpha, img2, beta, gamma)

cv2.imshow('Blended', blended)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

---

## 5 对比表格

### 颜色空间对比

| 颜色空间 | 通道 | 值范围 | 主要用途 | 特点 |
| --- | --- | --- | --- | --- |
| BGR | 蓝、绿、红 | 0-255 | OpenCV 默认 | 硬件友好，但不直观 |
| RGB | 红、绿、蓝 | 0-255 | matplotlib、深度学习 | 最常用，但 OpenCV 不用 |
| 灰度 | 单通道 | 0-255 | 边缘检测、阈值化 | 计算快，丢失颜色信息 |
| HSV | 色调、饱和度、明度 | H:0-179, S:0-255, V:0-255 | 颜色检测 | 符合人类直觉 |
| HLS | 色调、亮度、饱和度 | H:0-179, L:0-255, S:0-255 | 颜色调整 | 和 HSV 类似 |

---

## 6 新手常见误区

### 误区 1："像素索引是 [x, y]"

**错！** OpenCV 中像素索引是 **[y, x]**（先行后列），和数学中的坐标 (x, y) 相反。

```python
import cv2

img = cv2.imread('photo.jpg')

# ❌ 错误写法（x, y 顺序）
pixel = img[200, 100]  # 这不是 x=200, y=100！

# ✅ 正确写法（y, x 顺序，即 [行, 列]）
pixel = img[100, 200]  # 第 100 行（y=100），第 200 列（x=200）
```

### 误区 2："OpenCV 的通道顺序是 RGB"

**错！** OpenCV 默认是 **BGR** 顺序。

```python
import cv2
import matplotlib.pyplot as plt

img = cv2.imread('photo.jpg')

# ❌ 直接用 matplotlib 显示（颜色会偏蓝）
plt.imshow(img)  # matplotlib 期望 RGB，但 img 是 BGR
plt.show()

# ✅ 先转换通道顺序
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
plt.imshow(img_rgb)  # 颜色正确
plt.show()
```

### 误区 3："直接加减来调整亮度"

**不推荐！** 直接加减可能导致溢出。

```python
import cv2
import numpy as np

img = cv2.imread('photo.jpg')

# ❌ 直接加（255 + 50 = 249，溢出后变成 249 而不是 255）
bright1 = img + 50  # 可能产生奇怪的结果

# ✅ 使用 cv2.add()（饱和运算，255 + 50 = 255）
bright2 = cv2.add(img, 50)  # 正确截断到 255

# ✅ 或者用 np.clip() 手动截断
bright3 = np.clip(img.astype(np.int16) + 50, 0, 255).astype(np.uint8)
```

### 误区 4："修改 ROI 不影响原图"

**错！** ROI 是原图的 **视图**（引用），修改 ROI 会修改原图。

```python
import cv2

img = cv2.imread('photo.jpg')

# 提取 ROI
roi = img[100:200, 100:200]

# ❌ 修改 ROI 会影响原图！
roi[:] = 0  # 原图对应区域也变成黑色了

# ✅ 如果想要独立的副本，用 .copy()
roi_copy = img[100:200, 100:200].copy()
roi_copy[:] = 0  # 不影响原图
```

---

## 7 动手练习

### 练习 1：基础练习

编写一个程序，读取一张彩色图片，分别提取并显示 B、G、R 三个通道（每个通道单独显示为彩色图像，不是灰度图）。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('photo.jpg')

# 分离通道
b, g, r = cv2.split(img)

# 创建零矩阵
zeros = np.zeros(b.shape, dtype=np.uint8)

# 只显示蓝色通道（其他通道为 0）
blue_only = cv2.merge([b, zeros, zeros])

# 只显示绿色通道
green_only = cv2.merge([zeros, g, zeros])

# 只显示红色通道
red_only = cv2.merge([zeros, zeros, r])

# 显示结果
cv2.imshow('Blue Channel', blue_only)
cv2.imshow('Green Channel', green_only)
cv2.imshow('Red Channel', red_only)

cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 2：进阶练习

编写一个程序，读取一张图片，将图片分成 4 个象限，然后把左上和右下互换，右上和左下互换。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('photo.jpg')
h, w = img.shape[:2]
mid_h, mid_w = h // 2, w // 2

# 提取四个象限（使用 .copy() 避免引用问题）
top_left = img[:mid_h, :mid_w].copy()
top_right = img[:mid_h, mid_w:].copy()
bottom_left = img[mid_h:, :mid_w].copy()
bottom_right = img[mid_h:, mid_w:].copy()

# 互换象限
img[:mid_h, :mid_w] = bottom_right   # 左上 ← 右下
img[:mid_h, mid_w:] = bottom_left    # 右上 ← 左下
img[mid_h:, :mid_w] = top_right      # 左下 ← 右上
img[mid_h:, mid_w:] = top_left       # 右下 ← 左上

# 显示结果
cv2.imshow('Swapped', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 3（挑战）：综合练习

编写一个程序，实现"绿幕抠图"：读取一张绿幕背景的人像照片，将绿色背景替换为另一张风景图。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取前景图（绿幕人像）和背景图（风景）
foreground = cv2.imread('green_screen_person.jpg')
background = cv2.imread('landscape.jpg')

# 确保两张图大小一致
background = cv2.resize(background, (foreground.shape[1], foreground.shape[0]))

# 转换到 HSV 颜色空间（更容易检测绿色）
hsv = cv2.cvtColor(foreground, cv2.COLOR_BGR2HSV)

# 定义绿色的范围（HSV）
lower_green = np.array([35, 50, 50])    # 绿色下界
upper_green = np.array([85, 255, 255])  # 绿色上界

# 创建掩码（绿色区域为白色，其他为黑色）
mask = cv2.inRange(hsv, lower_green, upper_green)

# 反转掩码（人像区域为白色，背景为黑色）
mask_inv = cv2.bitwise_not(mask)

# 提取人像区域（掩码为白色的部分）
person = cv2.bitwise_and(foreground, foreground, mask=mask_inv)

# 提取背景区域（掩码为黑色的部分）
bg = cv2.bitwise_and(background, background, mask=mask)

# 合并人像和背景
result = cv2.add(person, bg)

# 显示结果
cv2.imshow('Result', result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **图像几何变换**——包括图像的缩放、平移、旋转、仿射变换和透视变换。你会学到如何对图像进行各种几何操作，比如把歪了的文档照片校正过来。
