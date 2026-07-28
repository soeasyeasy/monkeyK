---
title: "第8章：形态学操作"
description: "腐蚀、膨胀、开运算、闭运算、形态学梯度、顶帽与黑帽"
---

# 第8章：形态学操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是形态学操作？和滤波有什么区别？
- 腐蚀和膨胀是怎么工作的？
- 开运算和闭运算有什么用？
- 如何清理二值图像中的噪声？

这一章就是为了解答这些问题。我们会从数学形态学的基本概念出发，学习腐蚀、膨胀等基本操作，再掌握开运算、闭运算等组合操作，最后通过实战学会如何清理二值图像。

---

## 1 为什么需要形态学操作？

### 痛点分析

在图像处理中，经过阈值化或其他操作后，我们得到的二值图像往往不完美：

**二值图像的问题**

1. **噪声残留**：阈值化后仍有小的白点或黑点
2. **物体断裂**：物体边缘不连续，有缺口
3. **物体粘连**：多个物体连在一起
4. **边缘粗糙**：物体边缘不平滑

打个比方：

> 形态学操作就像雕塑家：腐蚀是凿去多余部分，膨胀是填补空缺。想象你有一块大理石（二值图像），雕塑家会根据需要凿掉多余的部分（腐蚀），或者填补空缺（膨胀），最终得到完美的作品。

### 形态学操作的应用

形态学操作在图像预处理中非常重要：

| 应用场景 | 说明 |
|---------|------|
| **噪声去除** | 去除小的噪声点 |
| **物体分离** | 分离粘连的物体 |
| **边缘平滑** | 让物体边缘更平滑 |
| **特征提取** | 提取骨架、凸包等特征 |
| **车牌识别** | 预处理车牌图像 |

### 解决方案

OpenCV 提供了丰富的形态学操作函数：

```python
import cv2
import numpy as np

# 创建结构元素（核）
kernel = np.ones((5, 5), np.uint8)

# 腐蚀
eroded = cv2.erode(img, kernel)

# 膨胀
dilated = cv2.dilate(img, kernel)

# 开运算
opening = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)

# 闭运算
closing = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
```

> **一句话总结**：形态学操作是处理二值图像的重要工具，可以去除噪声、分离物体、平滑边缘。

---

## 2 核心原理讲解

### 什么是数学形态学？

数学形态学是一门基于集合论的图像处理方法，主要操作对象是二值图像。

打个比方：

> 形态学操作就像用模板在图像上"盖章"。模板（结构元素）在图像上滑动，根据模板和图像的交集来决定中心像素的值。

### 结构元素（核）

结构元素是形态学操作的核心，它决定了操作的形状和大小。

```python
# 创建结构元素
kernel = np.ones((5, 5), np.uint8)  # 5x5 的正方形核

# 使用 getStructuringElement 创建
kernel_rect = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))      # 矩形
kernel_ellipse = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)) # 椭圆形
kernel_cross = cv2.getStructuringElement(cv2.MORPH_CROSS, (5, 5))     # 十字形
```

**结构元素的类型**：

| 类型 | 形状 | 特点 |
|------|------|------|
| `MORPH_RECT` | 矩形 | 各向同性 |
| `MORPH_ELLIPSE` | 椭圆形 | 更平滑 |
| `MORPH_CROSS` | 十字形 | 只影响上下左右 |

### 腐蚀（Erosion）

**原理**：结构元素在图像上滑动，只有当结构元素完全覆盖白色区域时，中心像素才为白色。

打个比方：

> 腐蚀就像用橡皮擦擦掉边缘。结构元素在图像上移动，只有完全在白色区域内的地方才会保留，边缘的像素会被"擦掉"。

```python
# 腐蚀
eroded = cv2.erode(src, kernel, iterations=1)
```

**参数说明**：
- `src`：输入二值图像
- `kernel`：结构元素
- `iterations`：迭代次数，次数越多腐蚀越厉害

**效果**：
- ✅ 去除小的白噪声
- ✅ 分离粘连的物体
- ✅ 缩小物体
- ❌ 物体会变小

### 膨胀（Dilation）

**原理**：结构元素在图像上滑动，只要结构元素与白色区域有交集，中心像素就为白色。

打个比方：

> 膨胀就像给物体"增肥"。结构元素在图像上移动，只要接触到白色区域，就会向外扩展。

```python
# 膨胀
dilated = cv2.dilate(src, kernel, iterations=1)
```

**参数说明**：
- `src`：输入二值图像
- `kernel`：结构元素
- `iterations`：迭代次数

**效果**：
- ✅ 填充小的黑洞
- ✅ 连接断裂的部分
- ✅ 扩大物体
- ❌ 物体会变大

### 开运算（Opening）

**原理**：先腐蚀后膨胀。

```python
# 开运算
opening = cv2.morphologyEx(src, cv2.MORPH_OPEN, kernel)
```

**效果**：
- ✅ 去除小的噪声点
- ✅ 平滑物体边缘
- ✅ 不改变物体大小

打个比方：

> 开运算就像先削掉多余的边角（腐蚀），再填补小的凹陷（膨胀），最终让物体更圆润。

### 闭运算（Closing）

**原理**：先膨胀后腐蚀。

```python
# 闭运算
closing = cv2.morphologyEx(src, cv2.MORPH_CLOSE, kernel)
```

**效果**：
- ✅ 填充小的空洞
- ✅ 连接断裂的部分
- ✅ 平滑物体边缘
- ✅ 不改变物体大小

打个比方：

> 闭运算就像先填补裂缝（膨胀），再削掉多余的凸起（腐蚀），最终让物体更完整。

### 形态学梯度（Morphological Gradient）

**原理**：膨胀减去腐蚀的结果。

```python
# 形态学梯度
gradient = cv2.morphologyEx(src, cv2.MORPH_GRADIENT, kernel)
```

**效果**：
- ✅ 提取物体边缘
- ✅ 边缘宽度均匀

### 顶帽（Top Hat）

**原理**：输入图像减去开运算的结果。

```python
# 顶帽
tophat = cv2.morphologyEx(src, cv2.MORPH_TOPHAT, kernel)
```

**效果**：
- ✅ 提取小的亮特征
- ✅ 背景校正

### 黑帽（Black Hat）

**原理**：闭运算的结果减去输入图像。

```python
# 黑帽
blackhat = cv2.morphologyEx(src, cv2.MORPH_BLACKHAT, kernel)
```

**效果**：
- ✅ 提取小的暗特征
- ✅ 检测暗斑

---

## 3 基础用法 + 逐行注释

### 示例 1：腐蚀与膨胀

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像并转为灰度
img = cv2.imread('image.jpg', 0)

# 二值化
ret, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)

# 创建结构元素
# 方法 1：使用 numpy
kernel_np = np.ones((5, 5), np.uint8)

# 方法 2：使用 OpenCV 函数
kernel_cv = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))

# 腐蚀
# iterations=1 表示腐蚀 1 次
eroded = cv2.erode(binary, kernel_cv, iterations=1)

# 膨胀
dilated = cv2.dilate(binary, kernel_cv, iterations=1)

# 多次腐蚀和膨胀
eroded_3 = cv2.erode(binary, kernel_cv, iterations=3)  # 腐蚀 3 次
dilated_3 = cv2.dilate(binary, kernel_cv, iterations=3)  # 膨胀 3 次

# 显示结果
plt.figure(figsize=(12, 8))

plt.subplot(2, 3, 1)
plt.title('Original Binary')
plt.imshow(binary, cmap='gray')

plt.subplot(2, 3, 2)
plt.title('Eroded (1 iteration)')
plt.imshow(eroded, cmap='gray')

plt.subplot(2, 3, 3)
plt.title('Dilated (1 iteration)')
plt.imshow(dilated, cmap='gray')

plt.subplot(2, 3, 4)
plt.title('Eroded (3 iterations)')
plt.imshow(eroded_3, cmap='gray')

plt.subplot(2, 3, 5)
plt.title('Dilated (3 iterations)')
plt.imshow(dilated_3, cmap='gray')

plt.axis('off')
plt.tight_layout()
plt.show()
```

### 示例 2：开运算与闭运算

```python
import cv2
import numpy as np

# 读取图像并转为灰度
img = cv2.imread('noisy_binary.jpg', 0)

# 二值化
ret, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)

# 创建结构元素
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))

# 开运算：去除小的白噪声
opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

# 闭运算：填充小的黑洞
closing = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

# 形态学梯度
gradient = cv2.morphologyEx(binary, cv2.MORPH_GRADIENT, kernel)

# 顶帽：提取小的亮特征
tophat = cv2.morphologyEx(binary, cv2.MORPH_TOPHAT, kernel)

# 黑帽：提取小的暗特征
blackhat = cv2.morphologyEx(binary, cv2.MORPH_BLACKHAT, kernel)

# 显示结果
cv2.imshow('Original Binary', binary)
cv2.imshow('Opening', opening)
cv2.imshow('Closing', closing)
cv2.imshow('Gradient', gradient)
cv2.imshow('Top Hat', tophat)
cv2.imshow('Black Hat', blackhat)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 示例 3：车牌预处理

```python
import cv2
import numpy as np

# 读取车牌图像
img = cv2.imread('license_plate.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 高斯模糊去噪
blurred = cv2.GaussianBlur(gray, (5, 5), 0)

# 边缘检测
edges = cv2.Canny(blurred, 50, 150)

# 创建结构元素
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))

# 闭运算：连接字符区域
closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

# 膨胀：扩大区域
dilated = cv2.dilate(closed, kernel, iterations=2)

# 查找轮廓
contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, 
                                cv2.CHAIN_APPROX_SIMPLE)

# 在原图上绘制
result = img.copy()
for contour in contours:
    area = cv2.contourArea(contour)
    if area > 1000:  # 过滤小区域
        x, y, w, h = cv2.boundingRect(contour)
        cv2.rectangle(result, (x, y), (x + w, y + h), (0, 255, 0), 2)

# 显示结果
cv2.imshow('Original', img)
cv2.imshow('Edges', edges)
cv2.imshow('Closed', closed)
cv2.imshow('Dilated', dilated)
cv2.imshow('Result', result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

> **原理**：`cv2.morphologyEx()` 是形态学操作的通用函数，第一个参数是输入图像，第二个参数是操作类型，第三个参数是结构元素。

---

## 4 对比表格

### 形态学操作对比

| 操作 | 原理 | 效果 | 适用场景 |
|------|------|------|---------|
| **腐蚀** | 结构元素完全覆盖 | 物体缩小，去除小白点 | 分离粘连物体，去除噪声 |
| **膨胀** | 结构元素有交集 | 物体扩大，填充小黑洞 | 连接断裂部分，填充空洞 |
| **开运算** | 先腐蚀后膨胀 | 去除噪声，平滑边缘，不改变大小 | 去除小的白噪声 |
| **闭运算** | 先膨胀后腐蚀 | 填充空洞，平滑边缘，不改变大小 | 填充小的黑洞 |
| **形态学梯度** | 膨胀 - 腐蚀 | 提取边缘 | 边缘检测 |
| **顶帽** | 输入 - 开运算 | 提取小的亮特征 | 背景校正，提取亮斑 |
| **黑帽** | 闭运算 - 输入 | 提取小的暗特征 | 检测暗斑 |

### 操作选择指南

| 问题 | 推荐操作 | 参数建议 |
|------|---------|---------|
| 图像有小白噪声 | 开运算 | kernel=5x5 |
| 图像有小黑洞 | 闭运算 | kernel=5x5 |
| 物体粘连 | 腐蚀 | kernel=3x3, iterations=1-2 |
| 物体断裂 | 膨胀 | kernel=3x3, iterations=1-2 |
| 需要提取边缘 | 形态学梯度 | kernel=3x3 |
| 背景不均匀 | 顶帽 | kernel=15x15 |
| 需要检测暗斑 | 黑帽 | kernel=15x15 |

### 结构元素选择

| 结构元素 | 形状 | 特点 | 适用场景 |
|---------|------|------|---------|
| `MORPH_RECT` | 矩形 | 各向同性 | 通用 |
| `MORPH_ELLIPSE` | 椭圆 | 更平滑 | 需要平滑效果 |
| `MORPH_CROSS` | 十字 | 只影响上下左右 | 保留更多细节 |

---

## 5 新手常见误区

### 误区 1："腐蚀和膨胀可以完全抵消"

**错！** 腐蚀和膨胀不是互逆操作。腐蚀会丢失小的物体，膨胀无法恢复。

正确做法：
```python
# ✅ 使用开运算或闭运算
opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)  # 去噪且不改变大小

# ❌ 错误做法
eroded = cv2.erode(binary, kernel)
dilated = cv2.dilate(eroded, kernel)  # 无法完全恢复原状
```

### 误区 2："结构元素越大越好"

不是的。结构元素太大会导致：
- 过度腐蚀或膨胀
- 丢失重要特征
- 计算时间增加

正确做法：
```python
# ✅ 根据噪声大小选择
kernel_small = np.ones((3, 3), np.uint8)  # 小噪声
kernel_medium = np.ones((5, 5), np.uint8)  # 中等噪声
kernel_large = np.ones((7, 7), np.uint8)   # 大噪声

# ❌ 错误做法
kernel = np.ones((21, 21), np.uint8)  # 太大，会破坏图像
```

### 误区 3："形态学操作只能用于二值图像"

虽然形态学操作主要用于二值图像，但也可以用于灰度图像。

正确做法：
```python
# ✅ 二值图像
binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)[1]
eroded = cv2.erode(binary, kernel)

# ✅ 灰度图像也可以
gray_eroded = cv2.erode(gray, kernel)  # 也可以工作
```

### 误区 4："开运算和闭运算效果一样"

不是的。开运算去除白噪声，闭运算填充黑洞，效果相反。

正确做法：
```python
# ✅ 根据问题选择
# 有白噪声 → 开运算
opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

# 有黑洞洞 → 闭运算
closing = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

# ✅ 组合使用
cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
```

### 误区 5："迭代次数越多越好"

迭代次数太多会导致：
- 过度处理
- 丢失重要特征
- 物体变形

正确做法：
```python
# ✅ 适度迭代
eroded = cv2.erode(binary, kernel, iterations=1)  # 通常 1-2 次就够

# ❌ 错误做法
eroded = cv2.erode(binary, kernel, iterations=10)  # 太多，物体会消失
```

---

## 6 动手练习

### 练习 1：基础练习 - 腐蚀与膨胀

读取一张二值图像，分别进行腐蚀和膨胀操作，比较不同迭代次数（1、2、3）的效果。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像并转为灰度
img = cv2.imread('binary_image.jpg', 0)

# 二值化
ret, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)

# 创建结构元素
kernel = np.ones((5, 5), np.uint8)

# 不同迭代次数的腐蚀
eroded_1 = cv2.erode(binary, kernel, iterations=1)
eroded_2 = cv2.erode(binary, kernel, iterations=2)
eroded_3 = cv2.erode(binary, kernel, iterations=3)

# 不同迭代次数的膨胀
dilated_1 = cv2.dilate(binary, kernel, iterations=1)
dilated_2 = cv2.dilate(binary, kernel, iterations=2)
dilated_3 = cv2.dilate(binary, kernel, iterations=3)

# 显示结果
plt.figure(figsize=(12, 10))

plt.subplot(3, 3, 1)
plt.title('Original')
plt.imshow(binary, cmap='gray')
plt.axis('off')

plt.subplot(3, 3, 2)
plt.title('Eroded (1)')
plt.imshow(eroded_1, cmap='gray')
plt.axis('off')

plt.subplot(3, 3, 3)
plt.title('Eroded (2)')
plt.imshow(eroded_2, cmap='gray')
plt.axis('off')

plt.subplot(3, 3, 4)
plt.title('Eroded (3)')
plt.imshow(eroded_3, cmap='gray')
plt.axis('off')

plt.subplot(3, 3, 5)
plt.title('Dilated (1)')
plt.imshow(dilated_1, cmap='gray')
plt.axis('off')

plt.subplot(3, 3, 6)
plt.title('Dilated (2)')
plt.imshow(dilated_2, cmap='gray')
plt.axis('off')

plt.subplot(3, 3, 7)
plt.title('Dilated (3)')
plt.imshow(dilated_3, cmap='gray')
plt.axis('off')

plt.tight_layout()
plt.show()

print("观察结果：")
print("- 腐蚀次数越多，物体越小，小噪声消失")
print("- 膨胀次数越多，物体越大，小空洞消失")
print("- 迭代次数过多会导致物体变形或消失")
```

</details>

### 练习 2：进阶练习 - 噪声清理

给定一张有噪声的二值图像（包含白噪声和黑噪声），使用开运算和闭运算的组合来清理图像。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像
img = cv2.imread('noisy_image.jpg', 0)

# 二值化
ret, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)

# 添加模拟噪声
noisy = binary.copy()
# 添加白噪声
noisy[100:105, 100:105] = 255
noisy[200:205, 200:205] = 255
# 添加黑噪声
noisy[150:155, 150:155] = 0
noisy[250:255, 250:255] = 0

# 创建结构元素
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))

# 方法 1：先开运算去白噪声，再闭运算填黑洞
cleaned_1 = cv2.morphologyEx(noisy, cv2.MORPH_OPEN, kernel)
cleaned_1 = cv2.morphologyEx(cleaned_1, cv2.MORPH_CLOSE, kernel)

# 方法 2：使用形态学梯度提取边缘
gradient = cv2.morphologyEx(noisy, cv2.MORPH_GRADIENT, kernel)

# 方法 3：顶帽和黑帽
tophat = cv2.morphologyEx(noisy, cv2.MORPH_TOPHAT, kernel)
blackhat = cv2.morphologyEx(noisy, cv2.MORPH_BLACKHAT, kernel)

# 显示结果
plt.figure(figsize=(12, 10))

plt.subplot(2, 3, 1)
plt.title('Noisy Binary')
plt.imshow(noisy, cmap='gray')
plt.axis('off')

plt.subplot(2, 3, 2)
plt.title('Cleaned (Open + Close)')
plt.imshow(cleaned_1, cmap='gray')
plt.axis('off')

plt.subplot(2, 3, 3)
plt.title('Gradient')
plt.imshow(gradient, cmap='gray')
plt.axis('off')

plt.subplot(2, 3, 4)
plt.title('Top Hat')
plt.imshow(tophat, cmap='gray')
plt.axis('off')

plt.subplot(2, 3, 5)
plt.title('Black Hat')
plt.imshow(blackhat, cmap='gray')
plt.axis('off')

plt.tight_layout()
plt.show()

print("清理结果：")
print("- 开运算去除了白噪声")
print("- 闭运算填充了黑洞")
print("- 组合操作让图像更干净")
```

</details>

### 练习 3（挑战）：综合练习 - 物体分离

读取一张有多个粘连物体的二值图像，使用形态学操作分离这些物体，并统计物体数量。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像
img = cv2.imread('connected_objects.jpg', 0)

# 二值化
ret, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)

# 步骤 1：距离变换
# 计算每个像素到最近背景像素的距离
dist_transform = cv2.distanceTransform(binary, cv2.DIST_L2, 5)

# 步骤 2：阈值化距离图
# 只保留距离大于阈值的区域（物体中心）
ret, sure_fg = cv2.threshold(dist_transform, 0.7 * dist_transform.max(), 255, 0)
sure_fg = np.uint8(sure_fg)

# 步骤 3：确定背景区域
# 膨胀原图得到背景区域
kernel = np.ones((3, 3), np.uint8)
sure_bg = cv2.dilate(binary, kernel, iterations=3)

# 步骤 4：确定未知区域
# 背景减去前景得到未知区域
unknown = cv2.subtract(sure_bg, sure_fg)

# 步骤 5：标记
ret, markers = cv2.connectedComponents(sure_fg)
markers = markers + 1
markers[unknown == 255] = 0

# 步骤 6：分水岭算法
markers = cv2.watershed(cv2.cvtColor(img, cv2.COLOR_GRAY2BGR), markers)

# 标记边界
binary[markers == -1] = 0

# 步骤 7：形态学操作分离
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
separated = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

# 查找轮廓并计数
contours, _ = cv2.findContours(separated, cv2.RETR_EXTERNAL, 
                                cv2.CHAIN_APPROX_SIMPLE)

# 在原图上绘制
result = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
object_count = 0

for i, contour in enumerate(contours):
    area = cv2.contourArea(contour)
    if area > 100:  # 过滤小区域
        object_count += 1
        
        # 绘制轮廓
        cv2.drawContours(result, [contour], -1, (0, 255, 0), 2)
        
        # 计算质心
        M = cv2.moments(contour)
        if M['m00'] != 0:
            cx = int(M['m10'] / M['m00'])
            cy = int(M['m01'] / M['m00'])
            
            # 标注编号
            cv2.putText(result, str(object_count), (cx - 10, cy + 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

# 显示结果
plt.figure(figsize=(15, 10))

plt.subplot(2, 3, 1)
plt.title('Original Binary')
plt.imshow(binary, cmap='gray')
plt.axis('off')

plt.subplot(2, 3, 2)
plt.title('Distance Transform')
plt.imshow(dist_transform, cmap='jet')
plt.axis('off')

plt.subplot(2, 3, 3)
plt.title('Sure Foreground')
plt.imshow(sure_fg, cmap='gray')
plt.axis('off')

plt.subplot(2, 3, 4)
plt.title('Unknown Region')
plt.imshow(unknown, cmap='gray')
plt.axis('off')

plt.subplot(2, 3, 5)
plt.title('Separated')
plt.imshow(separated, cmap='gray')
plt.axis('off')

plt.subplot(2, 3, 6)
plt.title(f'Result ({object_count} objects)')
plt.imshow(cv2.cvtColor(result, cv2.COLOR_BGR2RGB))
plt.axis('off')

plt.tight_layout()
plt.show()

print(f"检测到 {object_count} 个物体")
print("\n处理步骤：")
print("1. 距离变换：计算每个像素到背景的距离")
print("2. 阈值化：确定物体中心（确定前景）")
print("3. 膨胀：确定背景区域")
print("4. 相减：确定未知区域")
print("5. 分水岭：分离粘连物体")
print("6. 形态学：清理和分离")
```

</details>

---

## 下一章预告

下一章我们会学习 **图像轮廓与特征**——包括轮廓的查找、绘制、面积计算、周长计算、矩、凸包等。这些知识在物体识别、形状分析中非常重要。
