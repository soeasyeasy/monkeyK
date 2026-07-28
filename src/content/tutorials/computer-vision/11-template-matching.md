---
title: "第11章：模板匹配与图像金字塔"
description: "模板匹配原理、多尺度匹配、图像金字塔、滑动窗口检测"
---

# 第11章：模板匹配与图像金字塔

## 本章导读

学完特征点检测后，你可能会有这些疑问：

- 特征点匹配虽然强大，但代码太复杂了，有没有更简单的方法？
- 我有一张小图（比如 Logo），怎么在大图中找到它？
- 如果大图中的 Logo 被放大或缩小了怎么办？
- 图像金字塔是什么？有什么用？

这一章就是为了解答这些问题。我们会学习一种更直观的目标检测方法——**模板匹配**，它不需要检测特征点，而是直接在大图中"滑动"小图，逐像素比较相似度。然后我们会学习**图像金字塔**，解决模板匹配对尺度敏感的问题。

> **模板匹配就像在照片里找另一张小照片，一点一点地滑动对比**——把小图在大图上从左到右、从上到下滑动，每个位置都计算相似度，最相似的地方就是目标位置。

---

## 1 为什么需要模板匹配？

### 痛点分析

上一章的特征点检测（SIFT、ORB）虽然强大，但：

1. **代码复杂**：需要检测特征点、匹配、比率测试、RANSAC 验证……
2. **不适合简单场景**：如果目标纹理不丰富（如纯色 Logo），特征点可能很少
3. **学习曲线陡峭**：新手不容易理解特征描述子、匹配器等概念

**没有模板匹配时的问题：**

- 只想在大图中找一个小 Logo，却要用复杂的特征点算法
- 目标物体纹理简单，特征点检测效果不好

### 解决方案

模板匹配是一种**简单直接**的方法：

```python
import cv2
import numpy as np

# 读取大图和模板图
img = cv2.imread('mario.jpg')
template = cv2.imread('mario_template.jpg')

# 转灰度
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

# 模板匹配
result = cv2.matchTemplate(img_gray, template_gray, cv2.TM_CCOEFF_NORMED)

# 找到最匹配的位置
min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

# 画出匹配区域
h, w = template.shape[:2]
top_left = max_loc
bottom_right = (top_left[0] + w, top_left[1] + h)
cv2.rectangle(img, top_left, bottom_right, (0, 255, 0), 2)

print(f"匹配位置: {top_left}, 相似度: {max_val:.3f}")
cv2.imshow('Match', img)
cv2.waitKey(0)
```

> **一句话总结**：模板匹配简单直观，适合在图像中查找已知的小目标，代码量少，容易理解。

---

## 2 核心原理

### 模板匹配的工作流程

模板匹配的核心思想是**滑动窗口**：

1. **准备模板**：截取目标物体的小图（模板）
2. **滑动窗口**：在大图中从左到右、从上到下移动模板
3. **计算相似度**：在每个位置，计算模板和大图对应区域的相似度
4. **找最值**：相似度最高（或最低，取决于方法）的位置就是目标位置

打个比方：

> 模板匹配就像你在一张大合影中找你的朋友——你拿着朋友的小照片，在大照片上一点一点移动，每到一个位置就对比一下，最像的地方就是朋友的位置。

### 6 种匹配方法

OpenCV 提供了 6 种模板匹配方法，分为两类：

#### 归一化方法（推荐）

| 方法 | 含义 | 值范围 | 最值含义 |
| --- | --- | --- | --- |
| `TM_CCOEFF_NORMED` | 归一化相关系数 | [-1, 1] | 1 表示完全匹配 |
| `TM_CCORR_NORMED` | 归一化相关 | [0, 1] | 1 表示完全匹配 |
| `TM_SQDIFF_NORMED` | 归一化平方差 | [0, 1] | 0 表示完全匹配 |

#### 非归一化方法（不推荐）

| 方法 | 含义 | 值范围 | 最值含义 |
| --- | --- | --- | --- |
| `TM_CCOEFF` | 相关系数 | 无固定范围 | 越大越好 |
| `TM_CCORR` | 相关 | 无固定范围 | 越大越好 |
| `TM_SQDIFF` | 平方差 | 无固定范围 | 越小越好 |

> ✅ **推荐**：使用 `TM_CCOEFF_NORMED`，返回值在 [-1, 1] 之间，容易设置阈值。

### 基础用法

```python
import cv2
import numpy as np

# 读取大图和模板图
img = cv2.imread('scene.jpg')
template = cv2.imread('target.jpg')

# 转灰度
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

# 模板匹配（使用归一化相关系数）
result = cv2.matchTemplate(img_gray, template_gray, cv2.TM_CCOEFF_NORMED)

# result 是一个矩阵，每个元素表示该位置的相似度
print(f"结果矩阵大小: {result.shape}")
print(f"最大值: {result.max():.3f}, 最小值: {result.min():.3f}")

# 找到最匹配的位置
min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

# 根据方法选择最值
# TM_CCOEFF_NORMED, TM_CCORR_NORMED: 最大值是最佳匹配
# TM_SQDIFF_NORMED: 最小值是最佳匹配
if cv2.TM_CCOEFF_NORMED in [cv2.TM_CCOEFF_NORMED, cv2.TM_CCORR_NORMED]:
    top_left = max_loc
else:
    top_left = min_loc

# 画出匹配区域
h, w = template.shape[:2]
bottom_right = (top_left[0] + w, top_left[1] + h)
cv2.rectangle(img, top_left, bottom_right, (0, 255, 0), 2)

cv2.imshow('Match', img)
cv2.waitKey(0)
```

### 找多个匹配目标

如果大图中有多个相同的目标，需要找到所有相似度超过阈值的位置：

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('coins.jpg')
template = cv2.imread('coin.jpg')

# 转灰度
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

# 模板匹配
result = cv2.matchTemplate(img_gray, template_gray, cv2.TM_CCOEFF_NORMED)

# 找到所有相似度 > 0.8 的位置
threshold = 0.8
locations = np.where(result >= threshold)

# 获取模板尺寸
h, w = template.shape[:2]

# 画出所有匹配位置
for pt in zip(*locations[::-1]):  # 注意：locations 是 (y, x) 格式
    cv2.rectangle(img, pt, (pt[0] + w, pt[1] + h), (0, 255, 0), 2)

print(f"找到 {len(locations[0])} 个匹配")
cv2.imshow('Multiple Matches', img)
cv2.waitKey(0)
```

> ⚠️ **注意**：上面的代码可能会在同一个目标上画出多个重叠的矩形，因为模板滑动时会有多个位置都超过阈值。可以用**非极大值抑制**（NMS）去除重复。

### 模板匹配的局限性

模板匹配有两个主要问题：

1. **尺度敏感**：如果目标被放大或缩小，匹配会失败
2. **旋转敏感**：如果目标被旋转，匹配会失败

打个比方：

> 模板匹配就像用印章盖章——如果印章（模板）和盖章的位置（目标）大小、方向完全一致，就能完美匹配；但如果目标被放大或旋转了，就匹配不上了。

### 多尺度模板匹配

为了解决尺度问题，可以对大图进行**多尺度缩放**，在每个尺度上都做模板匹配：

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('scene.jpg')
template = cv2.imread('target.jpg')

# 转灰度
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

# 多尺度匹配
found = None
best_val = -1
best_scale = 1.0

# 在不同尺度下匹配
for scale in np.linspace(0.5, 1.5, 20)[::-1]:  # 从 1.5 倍缩小到 0.5 倍
    # 缩放大图
    resized = cv2.resize(img_gray, None, fx=scale, fy=scale)
    
    # 如果缩放后的图比模板还小，停止
    if resized.shape[0] < template_gray.shape[0] or resized.shape[1] < template_gray.shape[1]:
        break
    
    # 模板匹配
    result = cv2.matchTemplate(resized, template_gray, cv2.TM_CCOEFF_NORMED)
    
    # 找最值
    _, max_val, _, max_loc = cv2.minMaxLoc(result)
    
    # 更新最佳匹配
    if max_val > best_val:
        found = (max_val, max_loc, scale)
        best_val = max_val
        best_scale = scale

# 输出结果
if found:
    max_val, max_loc, scale = found
    print(f"最佳匹配: 相似度={max_val:.3f}, 尺度={scale:.2f}, 位置={max_loc}")
    
    # 将坐标映射回原图
    h, w = template.shape[:2]
    top_left = (int(max_loc[0] / scale), int(max_loc[1] / scale))
    bottom_right = (int((max_loc[0] + w) / scale), int((max_loc[1] + h) / scale))
    
    cv2.rectangle(img, top_left, bottom_right, (0, 255, 0), 2)
    cv2.imshow('Multi-scale Match', img)
    cv2.waitKey(0)
```

### 图像金字塔

**图像金字塔**是多尺度图像处理的经典方法，有两种类型：

#### 高斯金字塔

高斯金字塔通过**逐步降采样**（缩小）生成一系列图像：

```python
import cv2

# 读取图片
img = cv2.imread('image.jpg')

# 构建高斯金字塔
levels = []
current = img.copy()

for i in range(5):  # 5 层金字塔
    levels.append(current)
    # pyrDown: 降采样（缩小 2 倍）
    current = cv2.pyrDown(current)
    print(f"第 {i} 层: {current.shape}")

# 显示金字塔
for i, level in enumerate(levels):
    cv2.imshow(f'Level {i}', level)
cv2.waitKey(0)
```

打个比方：

> 高斯金字塔就像看地图——从世界地图（最小）到国家地图、城市地图、街道地图（最大），每一层都是上一层的 1/4 大小。

#### 拉普拉斯金字塔

拉普拉斯金字塔记录**相邻两层之间的差异**（边缘信息）：

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('image.jpg')

# 构建高斯金字塔
gaussian_levels = []
current = img.copy()
for i in range(5):
    gaussian_levels.append(current)
    current = cv2.pyrDown(current)

# 构建拉普拉斯金字塔
laplacian_levels = []
for i in range(len(gaussian_levels) - 1):
    # 上采样（放大 2 倍）
    upsampled = cv2.pyrUp(gaussian_levels[i + 1])
    # 计算差异
    laplacian = cv2.subtract(gaussian_levels[i], upsampled)
    laplacian_levels.append(laplacian)

# 显示拉普拉斯金字塔
for i, level in enumerate(laplacian_levels):
    cv2.imshow(f'Laplacian {i}', level)
cv2.waitKey(0)
```

> **拉普拉斯金字塔的作用**：图像压缩、图像融合、多尺度边缘检测。

### 滑动窗口检测

滑动窗口是目标检测的基础技术，模板匹配就是滑动窗口的一个应用。

```python
import cv2
import numpy as np

# 滑动窗口函数
def sliding_window(image, step_size, window_size):
    """
    在图像上滑动窗口
    :param image: 输入图像
    :param step_size: 滑动步长
    :param window_size: 窗口大小 (width, height)
    """
    for y in range(0, image.shape[0] - window_size[1], step_size):
        for x in range(0, image.shape[1] - window_size[0], step_size):
            # 返回窗口的坐标和窗口图像
            yield (x, y, image[y:y + window_size[1], x:x + window_size[0]])

# 使用示例
img = cv2.imread('scene.jpg')
window_size = (100, 100)  # 100x100 的窗口

for (x, y, window) in sliding_window(img, step_size=32, window_size=window_size):
    # 对每个窗口做处理（比如分类、检测）
    # 这里只是画个框示意
    cv2.rectangle(img, (x, y), (x + window_size[0], y + window_size[1]), (0, 255, 0), 1)

cv2.imshow('Sliding Window', img)
cv2.waitKey(0)
```

---

## 3 对比表格

### 6 种模板匹配方法对比

| 方法 | 公式含义 | 值范围 | 最佳匹配 | 归一化 | 推荐度 |
| --- | --- | --- | --- | --- | --- |
| `TM_CCOEFF` | 相关系数 | 无固定 | 最大值 | ❌ | ⭐⭐ |
| `TM_CCOEFF_NORMED` | 归一化相关系数 | [-1, 1] | 最大值 | ✅ | ⭐⭐⭐⭐⭐ |
| `TM_CCORR` | 相关 | 无固定 | 最大值 | ❌ | ⭐⭐ |
| `TM_CCORR_NORMED` | 归一化相关 | [0, 1] | 最大值 | ✅ | ⭐⭐⭐⭐ |
| `TM_SQDIFF` | 平方差 | 无固定 | 最小值 | ❌ | ⭐⭐ |
| `TM_SQDIFF_NORMED` | 归一化平方差 | [0, 1] | 最小值 | ✅ | ⭐⭐⭐⭐ |

> ✅ **推荐**：`TM_CCOEFF_NORMED`，返回值在 [-1, 1] 之间，1 表示完全匹配，0 表示不相关，-1 表示完全相反。

### 图像金字塔对比

| 金字塔类型 | 生成方式 | 用途 | 层数 |
| --- | --- | --- | --- |
| 高斯金字塔 | 逐步降采样（缩小） | 多尺度检测、图像压缩 | 通常 5-7 层 |
| 拉普拉斯金字塔 | 相邻层差异 | 图像融合、边缘检测 | 比高斯金字塔少 1 层 |

### 模板匹配 vs 特征点匹配

| 特性 | 模板匹配 | 特征点匹配（SIFT/ORB） |
| --- | --- | --- |
| 代码复杂度 | 简单（5-10 行） | 复杂（20-30 行） |
| 速度 | 慢（逐像素比较） | 快（只比较特征点） |
| 尺度不变性 | ❌ 无（需多尺度匹配） | ✅ 有（SIFT） |
| 旋转不变性 | ❌ 无 | ✅ 有 |
| 适用场景 | 纹理简单、固定尺度 | 纹理丰富、多尺度多旋转 |
| 匹配精度 | 高（像素级） | 较高（特征级） |

---

## 4 新手常见误区

### 误区 1："模板匹配对尺度不敏感"

**❌ 错误！** 模板匹配对尺度非常敏感，目标放大或缩小后匹配会失败。

```python
# ❌ 错误：目标被放大后直接匹配
result = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
# 如果目标在 img 中被放大了 2 倍，匹配会失败

# ✅ 正确：使用多尺度匹配
for scale in np.linspace(0.5, 1.5, 20):
    resized = cv2.resize(img, None, fx=scale, fy=scale)
    result = cv2.matchTemplate(resized, template, cv2.TM_CCOEFF_NORMED)
    # 找最佳匹配...
```

### 误区 2："用 TM_SQDIFF 时找最大值"

**❌ 错误！** `TM_SQDIFF` 和 `TM_SQDIFF_NORMED` 是**最小值**表示最佳匹配。

```python
# ❌ 错误：TM_SQDIFF 用 max_val
result = cv2.matchTemplate(img_gray, template_gray, cv2.TM_SQDIFF_NORMED)
min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
top_left = max_loc  # 错误！应该用 min_loc

# ✅ 正确：TM_SQDIFF 用 min_val
top_left = min_loc  # 正确！
```

### 误区 3："模板匹配结果不需要阈值过滤"

**❌ 错误！** 模板匹配会在每个位置都计算相似度，需要设置阈值过滤掉不匹配的位置。

```python
# ❌ 错误：直接用所有位置
locations = np.where(result >= -1)  # 所有位置都 >= -1

# ✅ 正确：设置合理的阈值
locations = np.where(result >= 0.8)  # 只保留相似度 > 0.8 的位置
```

### 误区 4："多尺度匹配的尺度范围随便设"

**❌ 错误！** 尺度范围应该根据实际场景设置，太大或太小都会影响效果。

```python
# ❌ 错误：尺度范围太大（0.1 到 10）
for scale in np.linspace(0.1, 10, 100):
    # 计算量巨大，而且很多尺度没意义

# ✅ 正确：根据实际场景设置（如 0.5 到 1.5）
for scale in np.linspace(0.5, 1.5, 20):
    # 合理的尺度范围
```

### 误区 5："模板匹配可以处理旋转"

**❌ 错误！** 模板匹配对旋转敏感，目标旋转后匹配会失败。

```python
# ❌ 错误：目标旋转后直接匹配
result = cv2.matchTemplate(img, rotated_template, cv2.TM_CCOEFF_NORMED)
# 如果目标在原图中旋转了，匹配会失败

# ✅ 正确：如果需要旋转不变性，用特征点匹配（SIFT/ORB）
# 或者对模板进行多角度旋转，分别匹配
```

---

## 5 动手练习

### 练习 1：基础练习——单目标模板匹配

读取一张大图和一张模板图，使用模板匹配在大图中找到模板的位置，并用矩形框标出。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('scene.jpg')
template = cv2.imread('target.jpg')

# 转灰度
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

# 模板匹配
result = cv2.matchTemplate(img_gray, template_gray, cv2.TM_CCOEFF_NORMED)

# 找最佳匹配位置
min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

# 画出匹配区域
h, w = template.shape[:2]
top_left = max_loc
bottom_right = (top_left[0] + w, top_left[1] + h)
cv2.rectangle(img, top_left, bottom_right, (0, 255, 0), 2)

print(f"匹配位置: {top_left}, 相似度: {max_val:.3f}")
cv2.imshow('Match', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 2：进阶练习——多目标模板匹配

读取一张包含多个相同硬币的图片，使用模板匹配找到所有硬币的位置，并标出。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('coins.jpg')
template = cv2.imread('coin.jpg')

# 转灰度
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

# 模板匹配
result = cv2.matchTemplate(img_gray, template_gray, cv2.TM_CCOEFF_NORMED)

# 找到所有相似度 > 0.8 的位置
threshold = 0.8
locations = np.where(result >= threshold)

# 获取模板尺寸
h, w = template.shape[:2]

# 非极大值抑制（去除重复的矩形）
boxes = []
for pt in zip(*locations[::-1]):
    boxes.append((pt[0], pt[1], pt[0] + w, pt[1] + h))

# 简单的 NMS：按相似度排序，去除重叠的
boxes = sorted(boxes, key=lambda b: result[b[1], b[0]], reverse=True)
final_boxes = []
for box in boxes:
    overlap = False
    for fb in final_boxes:
        # 计算 IoU
        x1 = max(box[0], fb[0])
        y1 = max(box[1], fb[1])
        x2 = min(box[2], fb[2])
        y2 = min(box[3], fb[3])
        if x1 < x2 and y1 < y2:
            inter = (x2 - x1) * (y2 - y1)
            area1 = (box[2] - box[0]) * (box[3] - box[1])
            area2 = (fb[2] - fb[0]) * (fb[3] - fb[1])
            iou = inter / (area1 + area2 - inter)
            if iou > 0.5:
                overlap = True
                break
    if not overlap:
        final_boxes.append(box)

# 画出最终结果
for box in final_boxes:
    cv2.rectangle(img, (box[0], box[1]), (box[2], box[3]), (0, 255, 0), 2)

print(f"找到 {len(final_boxes)} 个硬币")
cv2.imshow('Multiple Matches', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 3（挑战）：综合练习——多尺度模板匹配

读取一张大图和一张模板图，实现多尺度模板匹配，找到目标在不同尺度下的位置。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('scene.jpg')
template = cv2.imread('target.jpg')

# 转灰度
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

# 多尺度匹配
results = []
for scale in np.linspace(0.5, 1.5, 20)[::-1]:
    # 缩放大图
    resized = cv2.resize(img_gray, None, fx=scale, fy=scale)
    
    # 如果缩放后的图比模板还小，停止
    if resized.shape[0] < template_gray.shape[0] or resized.shape[1] < template_gray.shape[1]:
        break
    
    # 模板匹配
    result = cv2.matchTemplate(resized, template_gray, cv2.TM_CCOEFF_NORMED)
    
    # 找所有超过阈值的位置
    threshold = 0.8
    locations = np.where(result >= threshold)
    
    h, w = template.shape[:2]
    for pt in zip(*locations[::-1]):
        # 将坐标映射回原图
        top_left = (int(pt[0] / scale), int(pt[1] / scale))
        bottom_right = (int((pt[0] + w) / scale), int((pt[1] + h) / scale))
        results.append((top_left, bottom_right, scale, result[pt[1], pt[0]]))

# 非极大值抑制
final_results = []
results = sorted(results, key=lambda x: x[3], reverse=True)
for res in results:
    overlap = False
    for fr in final_results:
        x1 = max(res[0][0], fr[0][0])
        y1 = max(res[0][1], fr[0][1])
        x2 = min(res[1][0], fr[1][0])
        y2 = min(res[1][1], fr[1][1])
        if x1 < x2 and y1 < y2:
            inter = (x2 - x1) * (y2 - y1)
            area1 = (res[1][0] - res[0][0]) * (res[1][1] - res[0][1])
            area2 = (fr[1][0] - fr[0][0]) * (fr[1][1] - fr[0][1])
            iou = inter / (area1 + area2 - inter)
            if iou > 0.5:
                overlap = True
                break
    if not overlap:
        final_results.append(res)

# 画出结果
for res in final_results:
    cv2.rectangle(img, res[0], res[1], (0, 255, 0), 2)
    cv2.putText(img, f"Scale: {res[2]:.2f}", (res[0][0], res[0][1] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

print(f"找到 {len(final_results)} 个匹配")
cv2.imshow('Multi-scale Match', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **视频处理与目标跟踪**——把静态图像处理扩展到视频流。你会学到如何读取摄像头、处理视频帧、检测运动目标，以及使用 MeanShift、CAMShift、KCF 等算法实时跟踪目标。这是从"图像处理"到"计算机视觉应用"的重要一步。
