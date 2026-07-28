---
title: "第10章：特征点检测与描述"
description: "Harris 角点检测、SIFT、SURF、ORB 特征点提取与匹配"
---

# 第10章：特征点检测与描述

## 本章导读

学完轮廓检测后，你可能会有这些疑问：

- 轮廓检测能识别规则形状，但怎么识别不规则的物体（如人脸、建筑）？
- 同一张照片从不同角度拍，怎么知道它们拍的是同一个东西？
- 怎么把两张图片"拼"成一张全景图？
- 特征点到底是什么？SIFT、ORB 这些算法有什么区别？

这一章就是为了解答这些问题。我们会从最基础的 Harris 角点检测开始，逐步学习 SIFT、ORB 等现代特征点算法，最终实现图像匹配和拼接。

> **特征点就像地图上的地标建筑，不管从哪个角度看都能认出来**——即使图片被旋转、缩放、甚至部分遮挡，特征点依然能被稳定地找到和匹配。

---

## 1 为什么需要特征点检测？

### 痛点分析

上一章的轮廓检测能识别规则形状（圆、三角形、矩形），但现实中的物体往往是不规则的：

- 你想用一张埃菲尔铁塔的照片，在另一张照片里找到它——轮廓检测做不到
- 你想把两张风景照片拼成全景图——需要找到两张图中"相同的位置"
- 你想识别一张脸——脸的形状每次都不同，没有固定轮廓

**没有特征点检测时的问题：**

1. 无法识别不规则物体
2. 无法匹配不同视角下的同一物体
3. 无法实现图像拼接、目标识别等高级应用

### 解决方案

特征点检测在图像中找到"独特"的位置（如角点、斑点），这些位置即使图片旋转、缩放也能被稳定找到。

```python
import cv2

# 读取图片
img = cv2.imread('building.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 使用 ORB 检测特征点
orb = cv2.ORB_create()
keypoints, descriptors = orb.detectAndCompute(gray, None)

# 在图上画出特征点
result = cv2.drawKeypoints(img, keypoints, None, color=(0, 255, 0))

print(f"检测到 {len(keypoints)} 个特征点")
cv2.imshow('Features', result)
cv2.waitKey(0)
```

> **一句话总结**：特征点检测让计算机能"认出"图像中的标志性位置，是图像匹配、拼接、识别的基础。

---

## 2 核心原理

### 什么是特征点？

特征点（Feature Point）是图像中**具有独特纹理或结构的位置**，比如：

- **角点**：两条边缘的交点（如墙角）
- **斑点**：纹理丰富的区域（如树叶上的斑点）
- **高对比度区域**：颜色或亮度突变的地方

打个比方：

> 特征点就像城市里的地标建筑——埃菲尔铁塔、东方明珠。不管你从哪个方向看，这些地标都能被认出来。而普通的街道、房屋就很难区分。

### 为什么角点是好的特征点？

想象你站在一个房间里：

- **平坦区域**（如白墙）：你移动一步，看到的还是白墙——无法判断自己是否移动了
- **边缘区域**（如墙的边缘）：沿着边缘移动，看到的还是一样的——无法确定位置
- **角点区域**（如墙角）：你稍微移动，看到的就完全不同——能精确定位

这就是 Harris 角点检测的核心思想：**在某个方向上移动一小段距离，如果亮度变化很大，那就是角点**。

### Harris 角点检测原理

Harris 角点检测通过计算图像中每个像素点的"角点响应值"来找到角点：

1. **计算梯度**：对图像中每个像素，计算 x 和 y 方向的亮度变化（梯度）
2. **构建矩阵**：在每个像素的邻域内，构建一个 2×2 的矩阵 M（结构张量）
3. **计算响应值**：根据矩阵 M 的特征值，计算角点响应值 R
4. **阈值筛选**：R 大于某个阈值的点就是角点

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('chessboard.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = np.float32(gray)  # Harris 需要 float32 类型

# Harris 角点检测
# 参数：图像, 邻域大小, Sobel 算子孔径大小, 角点检测阈值
dst = cv2.cornerHarris(gray, blockSize=2, ksize=3, k=0.04)

# 阈值化，找到响应值大的点
corners = dst > 0.01 * dst.max()

# 在原图上画出角点
img[corners] = [0, 0, 255]  # 红色标记角点

print(f"检测到 {corners.sum()} 个角点")
cv2.imshow('Harris Corners', img)
cv2.waitKey(0)
```

### Shi-Tomasi 角点检测

Shi-Tomasi 是 Harris 的改进版，更稳定，能直接返回"最好的 N 个角点"：

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('chessboard.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Shi-Tomasi 角点检测
# 参数：图像, 最大角点数, 质量等级, 最小欧氏距离
corners = cv2.goodFeaturesToTrack(gray, maxCorners=100, qualityLevel=0.01, minDistance=10)

# 转换为整数坐标
corners = np.int0(corners)

# 画出角点
for corner in corners:
    x, y = corner.ravel()  # ravel 把数组展平
    cv2.circle(img, (x, y), 5, (0, 255, 0), -1)  # 绿色圆点

print(f"检测到 {len(corners)} 个角点")
cv2.imshow('Shi-Tomasi Corners', img)
cv2.waitKey(0)
```

### SIFT：尺度不变的特征点

Harris 和 Shi-Tomasi 只能检测固定尺度下的角点。如果图片被放大或缩小，角点位置会变化。

**SIFT（Scale-Invariant Feature Transform）** 解决了这个问题：

- **尺度不变性**：图片放大或缩小，特征点位置不变
- **旋转不变性**：图片旋转，特征点位置不变
- **光照不变性**：亮度变化，特征点依然稳定

打个比方：

> SIFT 特征点就像指纹——不管你的手怎么旋转、怎么缩放，指纹的特征都不会变。

```python
import cv2

# 读取图片
img = cv2.imread('object.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 创建 SIFT 检测器
sift = cv2.SIFT_create()

# 检测特征点和计算描述子
keypoints, descriptors = sift.detectAndCompute(gray, None)

# 在图上画出特征点（带方向和大小）
result = cv2.drawKeypoints(img, keypoints, None, flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
# flags 参数让每个特征点显示大小和方向

print(f"检测到 {len(keypoints)} 个 SIFT 特征点")
cv2.imshow('SIFT Features', result)
cv2.waitKey(0)
```

### ORB：快速免费的替代方案

SIFT 效果好但速度慢，而且有专利限制（虽然现在已过期）。**ORB（Oriented FAST and Rotated BRIEF）** 是一个快速、免费的替代品：

- **FAST**：快速检测角点
- **BRIEF**：快速生成描述子（用二进制串表示特征）

```python
import cv2

# 读取图片
img = cv2.imread('object.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 创建 ORB 检测器
orb = cv2.ORB_create()

# 检测特征点和计算描述子
keypoints, descriptors = orb.detectAndCompute(gray, None)

# 画出特征点
result = cv2.drawKeypoints(img, keypoints, None, color=(0, 255, 0))

print(f"检测到 {len(keypoints)} 个 ORB 特征点")
cv2.imshow('ORB Features', result)
cv2.waitKey(0)
```

### 特征匹配

检测到特征点后，需要**匹配**两张图片中的特征点，才能知道哪些点对应。

#### 暴力匹配（Brute-Force Matcher）

```python
import cv2

# 读取两张图片
img1 = cv2.imread('box.png', 0)  # 查询图像
img2 = cv2.imread('box_in_scene.png', 0)  # 训练图像

# 使用 ORB 检测特征点
orb = cv2.ORB_create()
kp1, des1 = orb.detectAndCompute(img1, None)
kp2, des2 = orb.detectAndCompute(img2, None)

# 创建暴力匹配器
# NormType.HAMMING 用于 ORB（二进制描述子）
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

# 匹配特征点
matches = bf.match(des1, des2)

# 按距离排序（距离越小越相似）
matches = sorted(matches, key=lambda x: x.distance)

# 画出前 20 个匹配
result = cv2.drawMatches(img1, kp1, img2, kp2, matches[:20], None,
                         flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)

cv2.imshow('Matches', result)
cv2.waitKey(0)
```

#### FLANN 匹配器（快速近似最近邻）

```python
import cv2
import numpy as np

# 读取图片
img1 = cv2.imread('box.png', 0)
img2 = cv2.imread('box_in_scene.png', 0)

# 使用 SIFT 检测（SIFT 用浮点数描述子）
sift = cv2.SIFT_create()
kp1, des1 = sift.detectAndCompute(img1, None)
kp2, des2 = sift.detectAndCompute(img2, None)

# FLANN 参数
FLANN_INDEX_KDTREE = 1
index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
search_params = dict(checks=50)

# 创建 FLANN 匹配器
flann = cv2.FlannBasedMatcher(index_params, search_params)

# KNN 匹配（每个特征点找 2 个最近邻）
matches = flann.knnMatch(des1, des2, k=2)

# 比率测试：只保留"好"的匹配
good_matches = []
for m, n in matches:
    if m.distance < 0.7 * n.distance:  # 第一近的距离 < 0.7 × 第二近的距离
        good_matches.append(m)

# 画出匹配结果
result = cv2.drawMatches(img1, kp1, img2, kp2, good_matches, None,
                         flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)

print(f"找到 {len(good_matches)} 个好匹配")
cv2.imshow('Good Matches', result)
cv2.waitKey(0)
```

打个比方：

> **比率测试**就像相亲——如果第一喜欢的人和第二喜欢的人差距很大（距离比 < 0.7），说明第一喜欢的人确实是"真爱"；如果差距不大，说明你"犹豫不决"，这个匹配不可靠。

### 实战：图像拼接

```python
import cv2
import numpy as np

# 读取两张图片
img1 = cv2.imread('left.jpg')
img2 = cv2.imread('right.jpg')

# 转灰度
gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

# 使用 SIFT 检测特征点
sift = cv2.SIFT_create()
kp1, des1 = sift.detectAndCompute(gray1, None)
kp2, des2 = sift.detectAndCompute(gray2, None)

# FLANN 匹配
FLANN_INDEX_KDTREE = 1
index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
search_params = dict(checks=50)
flann = cv2.FlannBasedMatcher(index_params, search_params)
matches = flann.knnMatch(des1, des2, k=2)

# 比率测试
good_matches = []
for m, n in matches:
    if m.distance < 0.7 * n.distance:
        good_matches.append(m)

# 提取匹配点的坐标
src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

# 计算单应性矩阵（Homography）
# 单应性矩阵描述了两张图之间的透视变换关系
M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

# 对 img1 进行透视变换，使其与 img2 对齐
h, w = img2.shape[:2]
img1_warped = cv2.warpPerspective(img1, M, (w * 2, h))

# 简单拼接（实际应用中需要更复杂的融合算法）
result = img1_warped.copy()
result[0:h, 0:w] = img2

cv2.imshow('Panorama', result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

---

## 3 对比表格

### 特征点算法对比

| 算法 | 速度 | 旋转不变性 | 尺度不变性 | 专利 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| Harris | 快 | ❌ | ❌ | 无 | 固定视角的角点检测 |
| Shi-Tomasi | 快 | ❌ | ❌ | 无 | 需要指定数量的角点 |
| SIFT | 慢 | ✅ | ✅ | 已过期 | 高精度匹配、图像拼接 |
| SURF | 中 | ✅ | ✅ | 有专利 | 速度要求较高的场景 |
| ORB | 快 | ✅ | ❌ | 无 | 实时应用、移动端 |

### 匹配器对比

| 匹配器 | 速度 | 精度 | 适用描述子类型 | 推荐场景 |
| --- | --- | --- | --- | --- |
| BFMatcher（暴力匹配） | 慢 | 高 | 任意 | 特征点较少时 |
| FLANN（快速近似） | 快 | 较高 | 浮点数描述子 | 特征点较多时 |

### 特征点检测函数速查

| 函数 | 功能 | 返回值 |
| --- | --- | --- |
| `cv2.cornerHarris(img, blockSize, ksize, k)` | Harris 角点检测 | 角点响应图 |
| `cv2.goodFeaturesToTrack(img, maxCorners, qualityLevel, minDistance)` | Shi-Tomasi 角点检测 | 角点坐标数组 |
| `cv2.SIFT_create()` | 创建 SIFT 检测器 | SIFT 对象 |
| `cv2.ORB_create()` | 创建 ORB 检测器 | ORB 对象 |
| `sift.detectAndCompute(img, mask)` | 检测特征点并计算描述子 | (关键点列表, 描述子矩阵) |
| `cv2.BFMatcher(normType, crossCheck)` | 创建暴力匹配器 | BFMatcher 对象 |
| `cv2.FlannBasedMatcher(indexParams, searchParams)` | 创建 FLANN 匹配器 | FlannBasedMatcher 对象 |
| `bf.match(des1, des2)` | 匹配特征点 | 匹配列表 |
| `cv2.drawMatches(img1, kp1, img2, kp2, matches, ...)` | 绘制匹配结果 | 匹配图像 |

---

## 4 新手常见误区

### 误区 1："ORB 和 SIFT 效果一样"

**❌ 错误！** ORB 速度快但**没有尺度不变性**，图片放大缩小时匹配效果会下降。

```python
# ❌ 错误：图片缩放后还用 ORB 匹配
orb = cv2.ORB_create()
# 如果两张图片大小差异很大，ORB 匹配效果很差

# ✅ 正确：需要尺度不变性时用 SIFT
sift = cv2.SIFT_create()
# SIFT 对缩放不敏感，匹配更稳定
```

### 误区 2："不做比率测试，直接用所有匹配"

**❌ 错误！** 不做比率测试会包含大量错误匹配，导致后续计算（如单应性矩阵）失败。

```python
# ❌ 错误：直接用所有匹配
matches = bf.match(des1, des2)
# 可能包含很多错误匹配

# ✅ 正确：用 KNN + 比率测试
matches = bf.knnMatch(des1, des2, k=2)
good_matches = []
for m, n in matches:
    if m.distance < 0.7 * n.distance:
        good_matches.append(m)
```

### 误区 3："ORB 用 NORM_L2 距离"

**❌ 错误！** ORB 生成的是**二进制描述子**，应该用 Hamming 距离，不是 L2 距离。

```python
# ❌ 错误：ORB 用 L2 距离
bf = cv2.BFMatcher(cv2.NORM_L2)  # ORB 是二进制描述子，应该用 HAMMING

# ✅ 正确：ORB 用 HAMMING 距离
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
```

### 误区 4："特征点越多越好"

**❌ 错误！** 特征点太多会导致匹配速度变慢，而且可能包含很多噪声点。

```python
# ❌ 错误：不限制特征点数量
orb = cv2.ORB_create()  # 默认检测 500 个特征点

# ✅ 正确：根据需求调整数量
orb = cv2.ORB_create(nfeatures=100)  # 只检测 100 个最强的特征点
```

### 误区 5："匹配成功就一定是同一物体"

**❌ 错误！** 即使有很多匹配点，也可能是误匹配。需要用 RANSAC 等算法验证。

```python
# ❌ 错误：只看匹配点数量
if len(good_matches) > 10:
    print("是同一物体")  # 可能误判

# ✅ 正确：用 RANSAC 验证几何一致性
M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
inliers = mask.sum()
if inliers > 10:
    print("是同一物体")  # 更可靠
```

---

## 5 动手练习

### 练习 1：基础练习——Harris 角点检测

读取一张棋盘格图片，使用 Harris 角点检测找到所有角点，并在原图上用红色圆点标记。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图片
img = cv2.imread('chessboard.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 转 float32（Harris 需要）
gray_float = np.float32(gray)

# Harris 角点检测
# blockSize=2: 邻域大小
# ksize=3: Sobel 算子孔径
# k=0.04: 灵敏度参数
dst = cv2.cornerHarris(gray_float, blockSize=2, ksize=3, k=0.04)

# 阈值化：响应值 > 最大值的 1%
corners = dst > 0.01 * dst.max()

# 在原图上画出角点
result = img.copy()
result[corners] = [0, 0, 255]  # 红色标记

print(f"检测到 {corners.sum()} 个角点")
cv2.imshow('Harris Corners', result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 2：进阶练习——ORB 特征匹配

读取两张同一物体不同角度的照片，使用 ORB 检测特征点并进行匹配，画出匹配结果。

<details>
<summary>点击查看答案</summary>

```python
import cv2

# 读取两张图片
img1 = cv2.imread('object_view1.jpg', 0)
img2 = cv2.imread('object_view2.jpg', 0)

# 创建 ORB 检测器
orb = cv2.ORB_create(nfeatures=500)

# 检测特征点和计算描述子
kp1, des1 = orb.detectAndCompute(img1, None)
kp2, des2 = orb.detectAndCompute(img2, None)

# 创建暴力匹配器（HAMMING 距离）
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

# 匹配特征点
matches = bf.match(des1, des2)

# 按距离排序
matches = sorted(matches, key=lambda x: x.distance)

# 画出前 30 个匹配
result = cv2.drawMatches(img1, kp1, img2, kp2, matches[:30], None,
                         flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)

print(f"ORB 检测到: 图1={len(kp1)} 个, 图2={len(kp2)} 个")
print(f"匹配数: {len(matches)}")
cv2.imshow('ORB Matches', result)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

</details>

### 练习 3（挑战）：综合练习——SIFT 特征匹配 + 单应性验证

读取两张图片（一张是模板，一张是场景），使用 SIFT 检测特征点，FLANN 匹配，用 RANSAC 计算单应性矩阵，并在场景图中标出模板的位置。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 读取图片
template = cv2.imread('box.png', 0)  # 模板图
scene = cv2.imread('box_in_scene.png', 0)  # 场景图

# SIFT 检测
sift = cv2.SIFT_create()
kp1, des1 = sift.detectAndCompute(template, None)
kp2, des2 = sift.detectAndCompute(scene, None)

# FLANN 匹配
FLANN_INDEX_KDTREE = 1
index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
search_params = dict(checks=50)
flann = cv2.FlannBasedMatcher(index_params, search_params)
matches = flann.knnMatch(des1, des2, k=2)

# 比率测试
good_matches = []
for m, n in matches:
    if m.distance < 0.7 * n.distance:
        good_matches.append(m)

print(f"好匹配数: {len(good_matches)}")

# 需要至少 4 个匹配点才能计算单应性矩阵
if len(good_matches) >= 4:
    # 提取匹配点坐标
    src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    # RANSAC 计算单应性矩阵
    M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

    # 获取模板图的四个角点
    h, w = template.shape
    template_corners = np.float32([[0, 0], [0, h-1], [w-1, h-1], [w-1, 0]]).reshape(-1, 1, 2)

    # 将角点映射到场景图中
    scene_corners = cv2.perspectiveTransform(template_corners, M)

    # 在场景图上画出模板的位置
    scene_color = cv2.cvtColor(scene, cv2.COLOR_GRAY2BGR)
    cv2.polylines(scene_color, [np.int32(scene_corners)], True, (0, 255, 0), 3)

    # 画出匹配结果
    result = cv2.drawMatches(template, kp1, scene_color, None, good_matches, None,
                             flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)

    print(f"内点数: {mask.sum()}")
    cv2.imshow('Template in Scene', result)
    cv2.waitKey(0)
else:
    print("匹配点不足，无法计算单应性矩阵")

cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **模板匹配与图像金字塔**——一种更简单直接的目标检测方法。模板匹配不需要检测特征点，而是直接在图像中"滑动"模板图片，逐像素比较相似度。虽然速度慢，但在某些场景下非常实用，比如找 Logo、找特定图案。
