---
title: "第4章：图像几何变换"
description: "缩放、平移、旋转、仿射变换、透视变换"
---

# 第4章：图像几何变换

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么把图片放大或缩小？
- 怎么旋转图片？旋转后图片大小会变吗？
- 什么是仿射变换和透视变换？听起来很复杂怎么办？
- 怎么把拍歪的文档照片校正过来？

这一章就是为了解答这些问题。我们会学习图像的各种几何变换，从简单的缩放到高级的透视变换。

---

## 1 为什么需要几何变换？

### 痛点分析

在实际应用中，我们经常需要对图像进行几何调整：

- 拍的照片太大了，需要缩小
- 文档拍歪了，需要校正
- 要做数据增强，需要旋转、翻转图片
- 需要把两张不同角度的图片对齐

### 解决方案

OpenCV 提供了丰富的几何变换函数，让你轻松处理这些问题。

打个比方：

> 仿射变换就像推一个方框变成平行四边形——边还是平行的，但角度变了。透视变换就像看一个方框变成梯形——近大远小，模拟人眼的视觉效果。

---

## 2 核心原理

### 几何变换的本质

所有几何变换的本质都是 **坐标映射**：把原图的每个像素点映射到新图的位置。

| 变换类型 | 矩阵大小 | 保持什么 | 自由度 |
| --- | --- | --- | --- |
| 平移 | 2x3 | 形状、大小、方向 | 2（x、y 方向） |
| 旋转 | 2x3 | 形状、大小 | 1（旋转角度） |
| 缩放 | 2x3 | 形状、角度 | 2（x、y 方向） |
| 仿射变换 | 2x3 | 平行性 | 6 |
| 透视变换 | 3x3 | 直线性 | 8 |

---

## 3 基础用法

### 3.1 图像缩放

```python
import cv2

# 读取图像
img = cv2.imread('photo.jpg')

# === 方法一：指定缩放比例 ===
# fx 和 fy 分别是宽和高的缩放因子
small = cv2.resize(img, None, fx=0.5, fy=0.5)  # 缩小到 50%
large = cv2.resize(img, None, fx=2.0, fy=2.0)  # 放大到 200%

# === 方法二：指定目标大小 ===
# (宽, 高) 注意：是先宽后高！
resized = cv2.resize(img, (800, 600))  # 缩放到 800x600

# === 插值方法 ===
# 缩小时推荐 INTER_AREA（区域插值，效果好）
small = cv2.resize(img, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)

# 放大时推荐 INTER_CUBIC 或 INTER_LINEAR（平滑插值）
large = cv2.resize(img, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

cv2.imshow('Original', img)
cv2.imshow('Small', small)
cv2.imshow('Large', large)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 3.2 图像平移

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('photo.jpg')
h, w = img.shape[:2]

# 创建平移矩阵
# 参数：(x 方向平移量, y 方向平移量)
# 正值表示向右/下平移，负值表示向左/上平移
M = np.float32([[1, 0, 100],   # x 方向平移 100 像素
                [0, 1, 50]])   # y 方向平移 50 像素

# 应用平移变换
translated = cv2.warpAffine(img, M, (w, h))

cv2.imshow('Original', img)
cv2.imshow('Translated', translated)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 3.3 图像旋转

```python
import cv2

# 读取图像
img = cv2.imread('photo.jpg')
h, w = img.shape[:2]

# 获取旋转矩阵
# 参数：旋转中心、旋转角度（逆时针为正）、缩放比例
# 绕图像中心旋转 45 度，不缩放
center = (w // 2, h // 2)
M = cv2.getRotationMatrix2D(center, 45, 1.0)

# 应用旋转变换
rotated = cv2.warpAffine(img, M, (w, h))

# 旋转 90 度（顺时针）
rotated_90 = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)

# 旋转 90 度（逆时针）
rotated_90_ccw = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)

# 旋转 180 度
rotated_180 = cv2.rotate(img, cv2.ROTATE_180)

cv2.imshow('Original', img)
cv2.imshow('Rotated 45', rotated)
cv2.imshow('Rotated 90 CW', rotated_90)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 3.4 仿射变换

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('photo.jpg')
h, w = img.shape[:2]

# 定义原图中的 3 个点（左上、右上、左下）
pts1 = np.float32([[0, 0], [w, 0], [0, h]])

# 定义变换后的 3 个点（把方框推成平行四边形）
pts2 = np.float32([[100, 50], [w-100, 50], [0, h]])

# 计算仿射变换矩阵
M = cv2.getAffineTransform(pts1, pts2)

# 应用仿射变换
affine = cv2.warpAffine(img, M, (w, h))

cv2.imshow('Original', img)
cv2.imshow('Affine', affine)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 3.5 透视变换

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('document.jpg')
h, w = img.shape[:2]

# 定义原图中的 4 个点（文档的四个角，可能是歪的）
# 顺序：左上、右上、左下、右下
pts1 = np.float32([[100, 50], [500, 100], [50, 400], [450, 450]])

# 定义变换后的 4 个点（校正后的矩形）
pts2 = np.float32([[0, 0], [400, 0], [0, 500], [400, 500]])

# 计算透视变换矩阵（需要 3x3 矩阵）
M = cv2.getPerspectiveTransform(pts1, pts2)

# 应用透视变换
perspective = cv2.warpPerspective(img, M, (400, 500))

cv2.imshow('Original', img)
cv2.imshow('Perspective', perspective)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

> **原理**：透视变换可以把"近大远小"的歪斜图像校正成正面视图，就像把拍歪的文档"扶正"一样。

---

## 4 进阶用法

### 实战：校正拍歪的文档

```python
import cv2
import numpy as np

# 读取歪斜的文档图片
img = cv2.imread('skewed_document.jpg')

# 手动标记文档的四个角点（实际应用中可以用轮廓检测自动找到）
# 顺序：左上、右上、左下、右下
pts1 = np.float32([[150, 100], [500, 80], [100, 500], [550, 520]])

# 目标矩形的四个角点（校正后的正面视图）
# 计算目标宽高
width_top = np.linalg.norm(pts1[0] - pts1[1])
width_bottom = np.linalg.norm(pts1[2] - pts1[3])
max_width = max(int(width_top), int(width_bottom))

height_left = np.linalg.norm(pts1[0] - pts1[2])
height_right = np.linalg.norm(pts1[1] - pts1[3])
max_height = max(int(height_left), int(height_right))

pts2 = np.float32([[0, 0], [max_width, 0], [0, max_height], [max_width, max_height]])

# 计算透视变换矩阵
M = cv2.getPerspectiveTransform(pts1, pts2)

# 应用变换
corrected = cv2.warpPerspective(img, M, (max_width, max_height))

cv2.imshow('Original', img)
cv2.imshow('Corrected', corrected)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

---

## 5 对比表格

### 几何变换方法对比

| 变换类型 | 所需点数 | 矩阵大小 | 保持什么 | 典型应用 |
| --- | --- | --- | --- | --- |
| 平移 | 0（指定偏移量） | 2x3 | 形状、大小、方向 | 移动图像位置 |
| 旋转 | 0（指定中心和角度） | 2x3 | 形状、大小 | 旋转图像 |
| 缩放 | 0（指定比例） | 2x3 | 形状、角度 | 调整图像大小 |
| 仿射变换 | 3 对点 | 2x3 | 平行性 | 倾斜校正 |
| 透视变换 | 4 对点 | 3x3 | 直线性 | 文档校正、视角变换 |

---

## 6 新手常见误区

### 误区 1："cv2.resize 的参数是 (高, 宽)"

**错！** `cv2.resize` 的目标大小参数是 **(宽, 高)**，和图像 shape 的 (高, 宽) 相反。

```python
import cv2

img = cv2.imread('photo.jpg')
print(img.shape)  # (高, 宽, 通道) 例如 (480, 640, 3)

# ❌ 错误写法（把高宽搞反了）
resized = cv2.resize(img, (480, 640))  # 这实际上是宽 480、高 640

# ✅ 正确写法（先宽后高）
resized = cv2.resize(img, (640, 480))  # 宽 640、高 480
```

### 误区 2："旋转后图像大小不变"

**注意！** 旋转后图像大小不变，但角落可能被裁切。

```python
import cv2

img = cv2.imread('photo.jpg')
h, w = img.shape[:2]

# 绕中心旋转 45 度
M = cv2.getRotationMatrix2D((w//2, h//2), 45, 1.0)
rotated = cv2.warpAffine(img, M, (w, h))
# 旋转后四个角可能被裁掉了

# 如果想要完整保留旋转后的图像，需要调整输出大小
# （代码较复杂，需要了解旋转后的边界计算）
```

### 误区 3："仿射变换需要 4 个点"

**错！** 仿射变换只需要 **3 个点**，透视变换才需要 4 个点。

```python
import cv2
import numpy as np

# ✅ 仿射变换：3 对点
pts1_affine = np.float32([[0, 0], [300, 0], [0, 300]])
pts2_affine = np.float32([[50, 50], [250, 50], [50, 250]])
M_affine = cv2.getAffineTransform(pts1_affine, pts2_affine)

# ✅ 透视变换：4 对点
pts1_persp = np.float32([[0, 0], [300, 0], [0, 300], [300, 300]])
pts2_persp = np.float32([[50, 50], [250, 50], [50, 250], [250, 250]])
M_persp = cv2.getPerspectiveTransform(pts1_persp, pts2_persp)
```

---

## 7 动手练习

### 练习 1：基础练习

编写一个程序，读取一张图片，将其缩小到原来的一半，然后顺时针旋转 90 度。

<details>
<summary>点击查看答案</summary>

```python
import cv2

# 读取图像
img = cv2.imread('photo.jpg')

# 缩小到一半
small = cv2.resize(img, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)

# 顺时针旋转 90 度
rotated = cv2.rotate(small, cv2.ROTATE_90_CLOCKWISE)

# 显示结果
cv2.imshow('Original', img)
cv2.imshow('Result', rotated)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 2：进阶练习

编写一个程序，实现图像的"镜像翻转"效果（水平翻转和垂直翻转），不使用 `cv2.flip()`，而是用仿射变换实现。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('photo.jpg')
h, w = img.shape[:2]

# 水平翻转（镜像）
# 变换矩阵：x 坐标取反，然后平移 w
M_horizontal = np.float32([[-1, 0, w], [0, 1, 0]])
flipped_h = cv2.warpAffine(img, M_horizontal, (w, h))

# 垂直翻转（镜像）
# 变换矩阵：y 坐标取反，然后平移 h
M_vertical = np.float32([[1, 0, 0], [0, -1, h]])
flipped_v = cv2.warpAffine(img, M_vertical, (w, h))

cv2.imshow('Original', img)
cv2.imshow('Horizontal Flip', flipped_h)
cv2.imshow('Vertical Flip', flipped_v)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 3（挑战）：综合练习

编写一个程序，实现一个简单的"文档扫描器"：读取一张拍歪的文档照片，用透视变换把它校正成正面视图。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取歪斜的文档照片
img = cv2.imread('skewed_doc.jpg')

# 手动标记文档的四个角（实际应用中可以用轮廓检测自动找到）
# 顺序：左上、右上、左下、右下
pts1 = np.float32([[120, 80], [480, 100], [80, 450], [520, 480]])

# 目标矩形的四个角（校正后的正面）
# 假设文档实际大小约为 400x500
pts2 = np.float32([[0, 0], [400, 0], [0, 500], [400, 500]])

# 计算透视变换矩阵
M = cv2.getPerspectiveTransform(pts1, pts2)

# 应用透视变换
corrected = cv2.warpPerspective(img, M, (400, 500))

# 在原图上标记四个角点（方便查看）
for pt in pts1:
    cv2.circle(img, tuple(pt.astype(int)), 10, (0, 0, 255), -1)

cv2.imshow('Original (with corners marked)', img)
cv2.imshow('Corrected Document', corrected)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **图像滤波与平滑**——了解各种滤波方法（均值滤波、高斯滤波、中值滤波、双边滤波），学会去除图像中的噪声。这是图像预处理中非常重要的一步！
