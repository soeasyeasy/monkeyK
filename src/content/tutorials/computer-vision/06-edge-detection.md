---
title: "第6章：边缘检测"
description: "Canny 边缘检测、Sobel 算子、Laplacian 算子、边缘提取实战"
---

# 第6章：边缘检测

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是边缘？计算机怎么知道哪里是物体的边界？
- Sobel 算子和 Canny 检测有什么区别？
- 边缘检测在实际中有什么用？
- 为什么 Canny 边缘检测效果这么好？

这一章就是为了解答这些问题。我们会从梯度的概念出发，逐步学习 Sobel、Laplacian、Canny 等经典边缘检测方法，并通过实战掌握如何提取物体轮廓。

---

## 1 为什么需要边缘检测？

### 痛点分析

在计算机视觉中，我们需要从图像中提取有用的信息：

**没有边缘检测时的困境**

1. **图像信息冗余**：一张 1080p 图片有 200 多万个像素，直接处理计算量巨大
2. **物体边界模糊**：像素值的变化是渐进的，很难直接确定物体在哪里结束
3. **特征提取困难**：没有边缘信息，后续的物体识别、分割都无从谈起

打个比方：

> 边缘检测就像用铅笔勾勒轮廓，只保留最重要的线条。想象你画一幅素描，不需要画出每个细节，只需要勾勒出物体的轮廓，别人就能认出画的是什么。边缘检测就是让计算机学会"画轮廓"。

### 边缘检测的应用

边缘检测是许多高级视觉任务的基础：

| 应用场景 | 说明 |
|---------|------|
| **物体识别** | 通过边缘提取物体形状特征 |
| **图像分割** | 利用边缘将图像分成不同区域 |
| **自动驾驶** | 检测车道线、道路边界 |
| **医学影像** | 识别器官边界、肿瘤边缘 |
| **工业检测** | 产品缺陷检测、尺寸测量 |

### 解决方案

边缘检测通过计算图像梯度来找出像素变化剧烈的位置：

```python
import cv2

# 读取图像并转为灰度图
img = cv2.imread('image.jpg', 0)

# Canny 边缘检测
edges = cv2.Canny(img, 100, 200)

# 显示结果
cv2.imshow('Edges', edges)
cv2.waitKey(0)
```

> **一句话总结**：边缘检测通过找出图像中像素变化剧烈的位置，提取物体的轮廓信息，是计算机视觉的基础操作。

---

## 2 核心原理讲解

### 什么是图像梯度？

梯度表示像素值变化的方向和速度。在图像中，梯度大的地方就是边缘。

打个比方：

> 想象你站在一片起伏的山丘上，梯度就是脚下地面的倾斜程度。平坦的地方梯度小（不是边缘），陡峭的地方梯度大（是边缘）。

数学上，图像梯度可以用偏导数表示：

```
梯度方向：θ = arctan(Gy / Gx)
梯度大小：|G| = √(Gx² + Gy²)
```

其中 Gx 和 Gy 分别是 x 方向和 y 方向的梯度。

### Sobel 算子

**原理**：使用 3×3 卷积核计算图像在 x 和 y 方向的梯度。

```python
# Sobel 算子
sobelx = cv2.Sobel(src, ddepth, dx, dy)
```

**参数说明**：
- `src`：输入图像（通常是灰度图）
- `ddepth`：输出图像深度，常用 `cv2.CV_64F`
- `dx`：x 方向的导数阶数（1 表示一阶导数）
- `dy`：y 方向的导数阶数

**Sobel 核**：

```
x 方向核：          y 方向核：
[-1  0  1]          [-1 -2 -1]
[-2  0  2]          [ 0  0  0]
[-1  0  1]          [ 1  2  1]
```

**特点**：
- ✅ 计算速度快
- ✅ 对噪声有一定抑制作用（核内加权平均）
- ❌ 边缘较粗，定位精度一般

### Laplacian 算子

**原理**：使用二阶导数检测边缘，对各个方向的边缘都敏感。

```python
# Laplacian 算子
laplacian = cv2.Laplacian(src, ddepth)
```

**Laplacian 核**：

```
[0  1  0]
[1 -4  1]
[0  1  0]
```

**特点**：
- ✅ 对各个方向的边缘都敏感
- ✅ 边缘定位精确
- ❌ 对噪声非常敏感
- ❌ 会产生双边缘响应

### Canny 边缘检测

**原理**：一个多阶段的边缘检测算法，包含 5 个步骤：

```
步骤 1：高斯滤波去噪
步骤 2：计算梯度（通常用 Sobel）
步骤 3：非极大值抑制（NMS）—— 细化边缘
步骤 4：双阈值检测 —— 区分强边缘、弱边缘、非边缘
步骤 5：边缘连接（滞后处理）—— 只保留与强边缘相连的弱边缘
```

```python
# Canny 边缘检测
edges = cv2.Canny(image, threshold1, threshold2)
```

**参数说明**：
- `image`：输入图像（灰度图）
- `threshold1`：高阈值（强边缘阈值）
- `threshold2`：低阈值（弱边缘阈值），通常设为高阈值的 1/2 或 1/3

打个比方：

> Canny 算法就像一个严谨的侦探：先用高斯滤波排除干扰（去噪），然后调查每个可疑地点（计算梯度），接着只保留最可疑的嫌疑人（非极大值抑制），再用两个标准判断——证据确凿的直接逮捕（强边缘），证据不足的先监视（弱边缘），最后如果弱边缘和强边缘有关联，也一起逮捕（边缘连接）。

**特点**：
- ✅ 边缘检测效果最好
- ✅ 边缘细且连续
- ✅ 抗噪声能力强
- ❌ 需要调节两个阈值参数

---

## 3 基础用法 + 逐行注释

### 示例 1：Sobel 边缘检测

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像并转为灰度图
img = cv2.imread('image.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 计算 x 方向的 Sobel 梯度
# ddepth=cv2.CV_64F 表示输出 64 位浮点数
# dx=1, dy=0 表示 x 方向一阶导数
sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0)

# 计算 y 方向的 Sobel 梯度
# dx=0, dy=1 表示 y 方向一阶导数
sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1)

# 取绝对值并转换为 uint8
# 因为梯度可能是负数，需要先取绝对值
sobelx_abs = np.uint8(np.abs(sobelx))
sobely_abs = np.uint8(np.abs(sobely))

# 计算梯度幅值（合并 x 和 y 方向）
# 方法 1：直接相加
sobel_combined = cv2.add(sobelx_abs, sobely_abs)

# 方法 2：使用公式 √(Gx² + Gy²)（更精确）
sobel_magnitude = np.uint8(np.sqrt(sobelx**2 + sobely**2))

# 显示结果
plt.figure(figsize=(12, 8))

plt.subplot(2, 2, 1)
plt.title('Original')
plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

plt.subplot(2, 2, 2)
plt.title('Sobel X (Vertical Edges)')
plt.imshow(sobelx_abs, cmap='gray')

plt.subplot(2, 2, 3)
plt.title('Sobel Y (Horizontal Edges)')
plt.imshow(sobely_abs, cmap='gray')

plt.subplot(2, 2, 4)
plt.title('Sobel Combined')
plt.imshow(sobel_combined, cmap='gray')

plt.tight_layout()
plt.show()
```

### 示例 2：Laplacian 边缘检测

```python
import cv2
import numpy as np

# 读取图像并转为灰度图
img = cv2.imread('image.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 先进行高斯模糊去噪（Laplacian 对噪声敏感）
blurred = cv2.GaussianBlur(gray, (3, 3), 0)

# Laplacian 边缘检测
# ddepth=cv2.CV_64F 防止负值被截断
laplacian = cv2.Laplacian(blurred, cv2.CV_64F)

# 取绝对值并转换为 uint8
laplacian_abs = np.uint8(np.abs(laplacian))

# 显示结果
cv2.imshow('Original', gray)
cv2.imshow('Laplacian Edges', laplacian_abs)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 示例 3：Canny 边缘检测

```python
import cv2
import matplotlib.pyplot as plt

# 读取图像并转为灰度图
img = cv2.imread('image.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 先进行高斯模糊去噪
blurred = cv2.GaussianBlur(gray, (5, 5), 0)

# Canny 边缘检测
# threshold1=100 为高阈值
# threshold2=200 为低阈值
# 注意：OpenCV 中 threshold1 是高阈值，threshold2 是低阈值
edges = cv2.Canny(blurred, 100, 200)

# 尝试不同的阈值组合
edges_weak = cv2.Canny(blurred, 50, 100)    # 低阈值，检测更多边缘
edges_strong = cv2.Canny(blurred, 200, 300)  # 高阈值，只检测强边缘

# 显示结果
plt.figure(figsize=(12, 8))

plt.subplot(2, 2, 1)
plt.title('Original')
plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

plt.subplot(2, 2, 2)
plt.title('Canny (100, 200)')
plt.imshow(edges, cmap='gray')

plt.subplot(2, 2, 3)
plt.title('Canny (50, 100) - More Edges')
plt.imshow(edges_weak, cmap='gray')

plt.subplot(2, 2, 4)
plt.title('Canny (200, 300) - Strong Edges Only')
plt.imshow(edges_strong, cmap='gray')

plt.tight_layout()
plt.show()
```

> **原理**：Canny 的阈值比例一般设为 3:1 或 2:1。高阈值用于检测明显的边缘，低阈值用于检测不太明显的边缘。与强边缘相连的弱边缘会被保留，孤立的弱边缘会被去除。

---

## 4 对比表格

### 三种边缘检测方法对比

| 特性 | Sobel | Laplacian | Canny |
|------|-------|-----------|-------|
| **导数阶数** | 一阶 | 二阶 | 一阶（多阶段） |
| **边缘方向** | 可区分 x/y 方向 | 不区分方向 | 不区分方向 |
| **边缘粗细** | 较粗 | 较细 | 最细（单像素） |
| **抗噪能力** | 一般 | 差（需先模糊） | 好（内置去噪） |
| **计算速度** | 快 | 快 | 较慢 |
| **边缘连续性** | 一般 | 较差 | 好 |
| **参数调节** | 简单 | 简单 | 需要调两个阈值 |
| **适用场景** | 快速检测、方向敏感 | 精确定位、各向同性 | 高质量边缘提取 |

### 参数选择建议

| 场景 | 推荐方法 | 参数建议 |
|------|---------|---------|
| 快速边缘检测 | Sobel | 默认核大小 |
| 需要方向信息 | Sobel | 分别计算 x 和 y |
| 精确边缘定位 | Laplacian | 先做高斯模糊 |
| 高质量边缘 | Canny | 阈值比 3:1 |
| 噪声较多的图像 | Canny | 先做双边滤波 |
| 实时处理 | Sobel | 小核大小 |

---

## 5 新手常见误区

### 误区 1："不做预处理直接边缘检测"

**错！** 边缘检测对噪声非常敏感，噪声也会被当成边缘检测出来。

正确做法：在做边缘检测之前，先进行去噪处理：
```python
# ✅ 正确做法
blurred = cv2.GaussianBlur(gray, (5, 5), 0)  # 先去噪
edges = cv2.Canny(blurred, 100, 200)          # 再检测

# ❌ 错误做法
edges = cv2.Canny(gray, 100, 200)  # 直接检测，噪声也会被检测为边缘
```

### 误区 2："Canny 阈值越大越好"

不是的。阈值太大会漏掉很多有用的边缘，阈值太小又会检测出太多噪声。

正确做法：
- 一般阈值比例设为 3:1（如 100:300）
- 根据图像内容调整，先从小值开始尝试
- 可以使用滑动条实时调节找到最佳阈值

### 误区 3："Sobel 只能检测一个方向的边缘"

虽然 Sobel 核有方向性，但通过分别计算 x 和 y 方向并合并，可以检测所有方向的边缘。

正确做法：
```python
# 分别计算两个方向
sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0)  # x 方向
sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1)  # y 方向

# 合并结果
magnitude = np.sqrt(sobelx**2 + sobely**2)   # 梯度幅值
```

### 误区 4："边缘检测的结果可以直接用于物体识别"

边缘只是物体的轮廓信息，还不足以直接用于识别。通常需要进一步处理：
- 轮廓提取（`cv2.findContours`）
- 特征描述（如 HOG、SIFT）
- 或者输入到深度学习模型

正确做法：将边缘检测作为特征提取的一个步骤，而不是最终结果。

### 误区 5："Laplacian 因为用二阶导数所以比 Sobel 好"

不一定。Laplacian 虽然定位精确，但对噪声非常敏感，而且不区分边缘方向。

正确做法：根据具体需求选择：
- 需要抗噪 → Canny
- 需要方向信息 → Sobel
- 需要精确定位且噪声少 → Laplacian

---

## 6 动手练习

### 练习 1：基础练习 - 比较三种边缘检测

对同一张图像分别使用 Sobel、Laplacian、Canny 进行边缘检测，比较结果的差异。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像并转为灰度图
img = cv2.imread('image.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 先进行高斯模糊去噪
blurred = cv2.GaussianBlur(gray, (5, 5), 0)

# 1. Sobel 边缘检测
sobelx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0)
sobely = cv2.Sobel(blurred, cv2.CV_64F, 0, 1)
sobel = np.uint8(np.sqrt(sobelx**2 + sobely**2))

# 2. Laplacian 边缘检测
laplacian = np.uint8(np.abs(cv2.Laplacian(blurred, cv2.CV_64F)))

# 3. Canny 边缘检测
canny = cv2.Canny(blurred, 100, 200)

# 显示结果
plt.figure(figsize=(12, 8))

plt.subplot(2, 2, 1)
plt.title('Original')
plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

plt.subplot(2, 2, 2)
plt.title('Sobel')
plt.imshow(sobel, cmap='gray')

plt.subplot(2, 2, 3)
plt.title('Laplacian')
plt.imshow(laplacian, cmap='gray')

plt.subplot(2, 2, 4)
plt.title('Canny')
plt.imshow(canny, cmap='gray')

plt.tight_layout()
plt.show()

print("观察结果：")
print("- Sobel：边缘较粗，但能区分方向")
print("- Laplacian：边缘较细，但可能有断裂")
print("- Canny：边缘最细最连续，效果最好")
```

</details>

### 练习 2：进阶练习 - Canny 参数调节

实现一个带有滑动条的程序，实时调节 Canny 边缘检测的两个阈值参数，观察不同参数下的边缘检测效果。

<details>
<summary>点击查看答案</summary>

```python
import cv2

# 全局变量
img_blurred = None

# 滑动条回调函数
def nothing(x):
    pass

# 创建滑动条窗口
cv2.namedWindow('Canny Edge Detection')

# 创建两个滑动条
# 参数：滑动条名称，窗口名称，初始值，最大值，回调函数
cv2.createTrackbar('Threshold1', 'Canny Edge Detection', 50, 500, nothing)
cv2.createTrackbar('Threshold2', 'Canny Edge Detection', 150, 500, nothing)

# 读取图像
img = cv2.imread('image.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 高斯模糊去噪
img_blurred = cv2.GaussianBlur(gray, (5, 5), 0)

while True:
    # 获取滑动条的当前值
    t1 = cv2.getTrackbarPos('Threshold1', 'Canny Edge Detection')
    t2 = cv2.getTrackbarPos('Threshold2', 'Canny Edge Detection')
    
    # 确保 threshold1 < threshold2
    if t1 >= t2:
        cv2.setTrackbarPos('Threshold2', 'Canny Edge Detection', t1 + 1)
        t2 = t1 + 1
    
    # Canny 边缘检测
    edges = cv2.Canny(img_blurred, t1, t2)
    
    # 显示结果
    cv2.imshow('Canny Edge Detection', edges)
    
    # 按 ESC 退出
    if cv2.waitKey(1) == 27:
        break

cv2.destroyAllWindows()
print(f"最终参数：threshold1={t1}, threshold2={t2}")
print(f"阈值比例：1:{t2/t1:.1f}")
```

</details>

### 练习 3（挑战）：综合练习 - 物体轮廓提取

读取一张包含简单几何形状（如圆形、方形）的图像，使用边缘检测 + 轮廓提取找出所有物体的轮廓，并在原图上绘制出来。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('shapes.jpg')
original = img.copy()

# 转为灰度图
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 高斯模糊去噪
blurred = cv2.GaussianBlur(gray, (5, 5), 0)

# Canny 边缘检测
edges = cv2.Canny(blurred, 50, 150)

# 查找轮廓
# cv2.RETR_EXTERNAL：只检测外轮廓
# cv2.CHAIN_APPROX_SIMPLE：压缩轮廓，只保留端点
contours, hierarchy = cv2.findContours(edges, cv2.RETR_EXTERNAL, 
                                        cv2.CHAIN_APPROX_SIMPLE)

print(f"检测到 {len(contours)} 个轮廓")

# 在原图上绘制轮廓
for i, contour in enumerate(contours):
    # 计算轮廓面积
    area = cv2.contourArea(contour)
    
    # 过滤掉太小的轮廓（可能是噪声）
    if area < 100:
        continue
    
    # 绘制轮廓（绿色，线宽 2）
    cv2.drawContours(original, [contour], -1, (0, 255, 0), 2)
    
    # 计算轮廓的边界框
    x, y, w, h = cv2.boundingRect(contour)
    
    # 计算轮廓的周长
    perimeter = cv2.arcLength(contour, True)
    
    # 计算圆形度：4π × 面积 / 周长²
    # 越接近 1 越像圆形
    circularity = 4 * 3.14159 * area / (perimeter * perimeter) if perimeter > 0 else 0
    
    # 标注信息
    label = f"Object {i+1}"
    cv2.putText(original, label, (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
    
    print(f"轮廓 {i+1}：面积={area:.0f}, 周长={perimeter:.0f}, "
          f"圆形度={circularity:.2f}")

# 显示结果
cv2.imshow('Original with Contours', original)
cv2.imshow('Edges', edges)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **颜色空间与阈值化**——了解不同的颜色表示方式（如 HSV、HSL），以及如何通过阈值处理将图像分成前景和背景。这些知识在目标检测、图像分割中非常重要。
