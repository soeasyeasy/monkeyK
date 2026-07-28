---
title: "第9章：轮廓检测与分析"
description: "轮廓查找、轮廓面积、轮廓近似、凸包检测、形状匹配"
---

# 第9章：轮廓检测与分析

## 本章导读

在学完边缘检测和形态学操作之后，你可能会有这些疑问：

- 边缘检测得到的是散乱的线条，怎么把它们变成完整的"形状"？
- 如何统计图片中有多少个物体？怎么测量每个物体的大小？
- 怎么判断一个轮廓是圆形、三角形还是矩形？
- 轮廓检测在实际项目中到底能干什么？

这一章就是为了解答这些问题。我们会从轮廓的基本概念出发，学会查找、绘制、分析轮廓，最终实现一个形状分类器。

> **轮廓检测就像描边游戏，沿着物体的边缘画一圈**——把边缘检测得到的零散像素连成封闭的曲线，就能把"物体"从图像中抠出来。

---

## 1 为什么需要轮廓检测？

### 痛点分析

上一章我们学了 Canny 边缘检测，它能找到图像中灰度变化剧烈的地方。但边缘检测的输出只是一堆零散的边缘像素，**不能告诉你"这是一个完整的物体"**。

想象一下：

- 你有一张硬币的照片，边缘检测画出了硬币的圆形边线——但这条线是"断断续续"的
- 你想知道"图里有几枚硬币？每枚多大？"——边缘检测回答不了这个问题

**没有轮廓检测时的问题：**

1. 边缘是零散的，无法区分不同物体
2. 无法计算物体的面积、周长等几何属性
3. 无法对物体进行形状分类

### 解决方案

轮廓检测把边缘"连起来"，形成封闭的曲线，每个封闭曲线就是一个物体的轮廓。

```python
import cv2
import numpy as np

# 读取图片并转灰度
img = cv2.imread('coins.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 阈值化（轮廓检测通常需要二值图像）
_, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

# 查找轮廓
contours, hierarchy = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# 在原图上画出所有轮廓
result = img.copy()
cv2.drawContours(result, contours, -1, (0, 255, 0), 2)

print(f"检测到 {len(contours)} 个物体")
cv2.imshow('contours', result)
cv2.waitKey(0)
```

> **一句话总结**：轮廓检测把零散的边缘变成封闭的"物体边界"，让我们可以逐个分析每个物体。

---

## 2 核心原理

### 什么是轮廓？

轮廓（Contour）是图像中**具有相同颜色或强度的所有连续点的曲线**。在二值图像中，轮廓就是白色区域的边界线。

打个比方：

> 轮廓就像你在地图上沿着国境线描一圈——描出来的那条线就是轮廓，线里面的区域就是一个"国家"（物体）。

### 轮廓查找原理

`cv2.findContours()` 的工作流程：

1. **输入二值图像**：白色（255）是前景，黑色（0）是背景
2. **从左上角开始扫描**：遇到白色像素时，沿着边界追踪，记录所有边界点
3. **形成封闭曲线**：追踪回到起点后，一条轮廓就完成了
4. **继续扫描**：寻找下一个未被标记的白色区域

### 检索模式（Retrieval Modes）

轮廓检索模式决定了如何组织轮廓的**层级关系**：

| 模式 | 含义 | 适用场景 |
| --- | --- | --- |
| `cv2.RETR_EXTERNAL` | 只检测最外层轮廓 | 只关心物体外边界，忽略内部孔洞 |
| `cv2.RETR_LIST` | 检测所有轮廓，不建立层级 | 只需要所有轮廓的列表 |
| `cv2.RETR_CCOMP` | 检测所有轮廓，建立两层层级 | 区分外边界和孔洞 |
| `cv2.RETR_TREE` | 检测所有轮廓，建立完整层级树 | 需要完整的嵌套关系（如"回"字形） |

打个比方：

> - `RETR_EXTERNAL`：只数"大圈"，不管里面有没有"小圈"
> - `RETR_LIST`：把所有圈都列出来，但不告诉你谁在谁里面
> - `RETR_TREE`：完整记录"大圈里有中圈，中圈里有小圈"的嵌套关系

### 近似方法（Approximation Methods）

| 方法 | 含义 | 效果 |
| --- | --- | --- |
| `cv2.CHAIN_APPROX_NONE` | 存储轮廓上所有点 | 数据量大，精确但冗余 |
| `cv2.CHAIN_APPROX_SIMPLE` | 只保留端点和拐点 | 一条直线只存两个端点，大幅压缩 |

打个比方：

> - `CHAIN_APPROX_NONE`：沿着海岸线每隔 1 米插一根旗子
> - `CHAIN_APPROX_SIMPLE`：只在海岸线拐弯的地方插旗子，直线的部分只保留两端

> ✅ **推荐**：绝大多数情况下使用 `CHAIN_APPROX_SIMPLE`，既节省内存又不丢失形状信息。

---

## 3 基础用法

### 3.1 查找和绘制轮廓

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('shapes.png')
# 转灰度图
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# 高斯模糊去噪（让轮廓更干净）
blurred = cv2.GaussianBlur(gray, (5, 5), 0)
# 阈值化，得到二值图像
_, binary = cv2.threshold(blurred, 100, 255, cv2.THRESH_BINARY)

# 查找轮廓
# 注意：OpenCV 4.x 返回两个值，OpenCV 3.x 返回三个值
contours, hierarchy = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

# 创建一张黑色画布用于展示
result = np.zeros_like(img)

# 绘制所有轮廓（绿色，线宽2）
# 参数：图像, 轮廓列表, 轮廓索引(-1表示全部), 颜色, 线宽
cv2.drawContours(result, contours, -1, (0, 255, 0), 2)

# 也可以只绘制第 0 个轮廓
# cv2.drawContours(result, contours, 0, (255, 0, 0), 2)

print(f"总共检测到 {len(contours)} 条轮廓")

cv2.imshow('Original', img)
cv2.imshow('Contours', result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

### 3.2 轮廓特征：面积、周长、边界矩形

```python
import cv2

# 假设已经得到了轮廓 contours
# 遍历每一条轮廓
for i, contour in enumerate(contours):
    # 计算轮廓面积（物体占多少像素）
    area = cv2.contourArea(contour)

    # 计算轮廓周长（物体边界有多长）
    perimeter = cv2.arcLength(contour, closed=True)  # closed=True 表示封闭轮廓

    # 外接矩形（能包围轮廓的最小正矩形）
    x, y, w, h = cv2.boundingRect(contour)
    # x, y 是矩形左上角坐标；w, h 是宽和高

    # 最小外接矩形（可以旋转的矩形，更贴合物体）
    rect = cv2.minAreaRect(contour)
    # rect 返回 (中心点, (宽,高), 旋转角度)
    box = cv2.boxPoints(rect)  # 获取矩形的4个顶点
    box = np.int0(box)  # 转成整数坐标

    # 最小外接圆（能包围轮廓的最小圆）
    (cx, cy), radius = cv2.minEnclosingCircle(contour)
    # cx, cy 是圆心坐标；radius 是半径

    print(f"轮廓 {i}: 面积={area:.1f}, 周长={perimeter:.1f}")
    print(f"  外接矩形: ({x},{y}) {w}x{h}")
    print(f"  最小外接圆: 圆心=({cx:.1f},{cy:.1f}), 半径={radius:.1f}")
```

### 3.3 轮廓近似与凸包

```python
import cv2
import numpy as np

# 假设已经得到某条轮廓 contour

# ---- 轮廓近似 ----
# 用更少的点来近似表示轮廓
# epsilon 是近似精度（越小越精确，点越多）
perimeter = cv2.arcLength(contour, closed=True)
epsilon = 0.02 * perimeter  # 通常取周长的 2% 作为精度
approx = cv2.approxPolyDP(contour, epsilon, closed=True)
# approx 是近似后的顶点集合

print(f"近似后顶点数: {len(approx)}")
# 三角形 → 3个顶点，矩形 → 4个顶点，圆形 → 很多个顶点

# ---- 凸包 ----
# 凸包是包围所有轮廓点的最小凸多边形
hull = cv2.convexHull(contour)
# hull 是凸包的顶点集合

# 判断轮廓是否是凸的
is_convex = cv2.isContourConvex(contour)
print(f"是否是凸形状: {is_convex}")
```

打个比方：

> - **轮廓近似**：用折线来"描"曲线——如果精度够高，三角形就还是三角形，圆形会变成很多边形
> - **凸包**：用一根橡皮筋包住所有点——橡皮筋弹紧后的形状就是凸包

### 3.4 形状匹配

```python
import cv2

# 比较两个轮廓的形状相似度
# 返回值越小，形状越相似（0 表示完全相同）
# method=1 使用 Hu 矩，对平移、旋转、缩放不变
similarity = cv2.matchShapes(contour1, contour2, cv2.CONTOURS_MATCH_I1, 0)

print(f"形状相似度: {similarity:.4f}")
# 通常 < 0.1 表示非常相似
# 0.1 ~ 0.5 表示比较相似
# > 1.0 表示差异很大
```

### 3.5 实战：形状分类器

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('shapes.png')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(gray, (5, 5), 0)
_, binary = cv2.threshold(blurred, 100, 255, cv2.THRESH_BINARY)

# 查找轮廓
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

for contour in contours:
    # 过滤掉太小的噪声轮廓
    area = cv2.contourArea(contour)
    if area < 100:
        continue

    # 轮廓近似
    perimeter = cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, 0.04 * perimeter, True)

    # 获取外接矩形的位置，用于标注文字
    x, y, w, h = cv2.boundingRect(contour)
    cx, cy = x + w // 2, y + h // 2  # 中心点

    # 根据顶点数判断形状
    if len(approx) == 3:
        shape_name = "Triangle"  # 三角形
        color = (0, 0, 255)      # 红色
    elif len(approx) == 4:
        # 判断是正方形还是矩形
        aspect_ratio = w / float(h)
        if 0.85 <= aspect_ratio <= 1.15:
            shape_name = "Square"  # 正方形
        else:
            shape_name = "Rectangle"  # 矩形
        color = (0, 255, 0)  # 绿色
    elif len(approx) == 5:
        shape_name = "Pentagon"  # 五边形
        color = (255, 0, 0)     # 蓝色
    elif len(approx) == 6:
        shape_name = "Hexagon"  # 六边形
        color = (255, 255, 0)  # 青色
    else:
        # 顶点很多 → 圆形
        shape_name = "Circle"  # 圆形
        color = (0, 255, 255)  # 黄色

    # 在原图上绘制轮廓和标注
    cv2.drawContours(img, [approx], -1, color, 2)
    cv2.putText(img, shape_name, (cx - 30, cy), cv2.FONT_HERSHEY_SIMPLEX,
                0.5, color, 2)

cv2.imshow('Shape Detection', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

---

## 4 对比表格

### 轮廓检索模式对比

| 模式 | 外轮廓 | 内轮廓（孔洞） | 层级关系 | 推荐场景 |
| --- | --- | --- | --- | --- |
| `RETR_EXTERNAL` | ✅ 检测 | ❌ 忽略 | ❌ 无 | 只关心物体个数和外边界 |
| `RETR_LIST` | ✅ 检测 | ✅ 检测 | ❌ 无 | 需要所有轮廓，不关心嵌套 |
| `RETR_CCOMP` | ✅ 检测 | ✅ 检测 | ✅ 两层 | 区分物体外边界和内部孔洞 |
| `RETR_TREE` | ✅ 检测 | ✅ 检测 | ✅ 完整树 | 复杂嵌套结构（如文字笔画） |

### 轮廓近似方法对比

| 方法 | 存储点数 | 内存占用 | 精度 | 推荐场景 |
| --- | --- | --- | --- | --- |
| `CHAIN_APPROX_NONE` | 所有边界点 | 高 | 完全精确 | 需要精确轮廓（极少使用） |
| `CHAIN_APPROX_SIMPLE` | 仅端点和拐点 | 低 | 形状不变 | **几乎所有场景（默认推荐）** |

### 轮廓特征函数速查

| 函数 | 功能 | 返回值 |
| --- | --- | --- |
| `cv2.contourArea(contour)` | 计算面积 | 浮点数 |
| `cv2.arcLength(contour, closed)` | 计算周长 | 浮点数 |
| `cv2.boundingRect(contour)` | 外接正矩形 | (x, y, w, h) |
| `cv2.minAreaRect(contour)` | 最小外接矩形（可旋转） | (中心, (w,h), 角度) |
| `cv2.minEnclosingCircle(contour)` | 最小外接圆 | (圆心, 半径) |
| `cv2.approxPolyDP(contour, eps, closed)` | 轮廓近似 | 近似顶点集合 |
| `cv2.convexHull(contour)` | 凸包 | 凸包顶点集合 |
| `cv2.matchShapes(c1, c2, method, p)` | 形状匹配 | 相似度（越小越像） |

---

## 5 新手常见误区

### 误区 1："轮廓检测可以直接用在彩色图上"

**❌ 错误！** `cv2.findContours()` 只能处理**二值图像**（只有 0 和 255）。

```python
# ❌ 错误：直接传入彩色图
contours, _ = cv2.findContours(color_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# ✅ 正确：先转灰度，再阈值化
gray = cv2.cvtColor(color_img, cv2.COLOR_BGR2GRAY)
_, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
```

### 误区 2："findContours 会修改原图"

**❌ 容易忽略！** `cv2.findContours()` 在某些 OpenCV 版本中**会修改传入的图像**。

```python
# ❌ 危险：binary 可能被修改
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
# 之后再用 binary 做其他操作，可能得到意外结果

# ✅ 安全：传入副本
contours, _ = cv2.findContours(binary.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
```

### 误区 3："不过滤小轮廓，结果一堆噪声"

**❌ 错误！** 图像中的噪点也会被检测为轮廓，导致结果中混入大量无用的小轮廓。

```python
# ❌ 错误：不过滤，把所有轮廓都画出来
cv2.drawContours(img, contours, -1, (0, 255, 0), 2)

# ✅ 正确：按面积过滤掉噪声
for contour in contours:
    if cv2.contourArea(contour) < 100:  # 过滤面积小于100的轮廓
        continue
    cv2.drawContours(img, [contour], -1, (0, 255, 0), 2)
```

### 误区 4："approxPolyDP 的 epsilon 随便设"

**❌ 错误！** epsilon 太大会丢失形状细节（圆形变三角形），太小则近似没有意义（点和原来一样多）。

```python
# ❌ 错误：epsilon 设太大，所有形状都变成三角形
approx = cv2.approxPolyDP(contour, 0.5 * perimeter, True)

# ✅ 正确：通常取周长的 1%~5%
approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)  # 2% 是常用起点
```

### 误区 5："OpenCV 3.x 和 4.x 的返回值不一样"

**❌ 容易踩坑！** OpenCV 版本不同，`findContours` 的返回值个数不同。

```python
# OpenCV 3.x：返回3个值
# image, contours, hierarchy = cv2.findContours(...)

# OpenCV 4.x：返回2个值
# contours, hierarchy = cv2.findContours(...)

# ✅ 兼容写法
contours, hierarchy = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[-2:]
```

---

## 6 动手练习

### 练习 1：基础练习——统计图中的物体数量

读取一张包含多个白色物体（如硬币）的二值图像，使用轮廓检测统计物体数量，并在每个物体旁边标注序号。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取二值图像（假设白色是物体，黑色是背景）
img = cv2.imread('coins.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 阈值化
_, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

# 查找轮廓（只找外轮廓）
contours, _ = cv2.findContours(binary.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# 过滤噪声并标注
count = 0
for contour in contours:
    area = cv2.contourArea(contour)
    if area < 50:  # 过滤小噪声
        continue
    count += 1

    # 获取轮廓中心位置
    x, y, w, h = cv2.boundingRect(contour)
    cx, cy = x + w // 2, y + h // 2

    # 画轮廓和序号
    cv2.drawContours(img, [contour], -1, (0, 255, 0), 2)
    cv2.putText(img, str(count), (cx - 10, cy + 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

print(f"共检测到 {count} 个物体")
cv2.imshow('Count', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 2：进阶练习——计算每个物体的圆度

圆度（Circularity）= 4π × 面积 / 周长²。越接近 1 说明越圆。读取一张图片，检测所有轮廓，计算每个轮廓的圆度，并标注"圆"或"非圆"。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
import math

# 读取图片
img = cv2.imread('shapes.png')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(gray, (5, 5), 0)
_, binary = cv2.threshold(blurred, 100, 255, cv2.THRESH_BINARY)

# 查找轮廓
contours, _ = cv2.findContours(binary.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

for contour in contours:
    area = cv2.contourArea(contour)
    if area < 100:
        continue

    perimeter = cv2.arcLength(contour, True)
    if perimeter == 0:
        continue

    # 计算圆度：4π × 面积 / 周长²
    circularity = 4 * math.pi * area / (perimeter * perimeter)

    # 获取中心位置
    x, y, w, h = cv2.boundingRect(contour)
    cx, cy = x + w // 2, y + h // 2

    # 判断是否是圆形（圆度 > 0.8 认为是圆形）
    if circularity > 0.8:
        label = f"Circle ({circularity:.2f})"
        color = (0, 255, 0)
    else:
        label = f"Not Circle ({circularity:.2f})"
        color = (0, 0, 255)

    cv2.drawContours(img, [contour], -1, color, 2)
    cv2.putText(img, label, (cx - 40, cy), cv2.FONT_HERSHEY_SIMPLEX,
                0.4, color, 1)

cv2.imshow('Circularity', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 3（挑战）：综合练习——凸包缺陷检测

读取一张手掌的图片，检测手掌轮廓，计算凸包，并找出凸包缺陷（手指之间的凹陷部分）。提示：使用 `cv2.convexityDefects()`。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('hand.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(gray, (5, 5), 0)
_, binary = cv2.threshold(blurred, 100, 255, cv2.THRESH_BINARY)

# 查找轮廓
contours, _ = cv2.findContours(binary.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# 取面积最大的轮廓（假设是手掌）
largest_contour = max(contours, key=cv2.contourArea)

# 计算凸包
hull = cv2.convexHull(largest_contour, returnPoints=False)
# returnPoints=False 返回索引，convexityDefects 需要索引

# 计算凸包缺陷
defects = cv2.convexityDefects(largest_contour, hull)

# 在原图上绘制
result = img.copy()

# 画轮廓（绿色）
cv2.drawContours(result, [largest_contour], -1, (0, 255, 0), 2)

# 画凸包（蓝色虚线效果）
hull_points = cv2.convexHull(largest_contour)
cv2.drawContours(result, [hull_points], -1, (255, 0, 0), 2)

# 画缺陷点（红色圆点）
if defects is not None:
    for i in range(defects.shape[0]):
        # 每个缺陷包含：起点索引、终点索引、最远点索引、距离
        start_idx, end_idx, far_idx, depth = defects[i, 0]

        # 获取最远点的坐标
        far_point = tuple(largest_contour[far_idx][0])

        # 只画深度较大的缺陷（过滤小噪声）
        if depth > 1000:  # 距离单位是 256 倍像素
            cv2.circle(result, far_point, 5, (0, 0, 255), -1)

print(f"检测到 {len(defects) if defects is not None else 0} 个凸包缺陷")
cv2.imshow('Convexity Defects', result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **特征点检测与描述**——也就是如何在图像中找到"标志性"的关键点（如角点、斑点），并用 SIFT、ORB 等算法提取特征描述子。你会发现，不管图片怎么旋转、缩放，特征点都能被稳定地找到和匹配，这是图像拼接、目标识别的基础。
