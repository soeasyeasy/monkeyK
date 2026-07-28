---
title: "第5章：图像滤波与平滑"
description: "均值滤波、高斯滤波、中值滤波、双边滤波、噪声去除"
---

# 第5章：图像滤波与平滑

## 本章导读

在开始学习图像处理之前，你可能会有这些疑问：

- 为什么拍出来的照片总是有噪点？
- 如何让模糊的照片变清晰？
- 不同的滤波方法有什么区别？
- 怎样才能既去噪又保留边缘？

这一章就是为了解答这些问题。我们会先理解噪声的来源，再学习各种滤波方法，最后掌握如何选择合适的滤波器。

---

## 1 为什么需要图像滤波？

### 痛点分析

在实际应用中，图像往往会受到各种干扰：

**噪声的来源**

1. **传感器噪声**：相机传感器在弱光环境下产生的随机噪声
2. **传输噪声**：图像在传输过程中受到的干扰
3. **量化噪声**：数字化过程中产生的误差

打个比方：

> 图像滤波就像用模糊眼镜看世界，不同的镜片让你看到不同的效果。均值滤波像是蒙上了一层雾，高斯滤波像是戴上了柔光镜，中值滤波像是去掉了脸上的痘痘，而双边滤波则像是智能美颜——既磨皮又保留轮廓。

### 噪声的类型

在图像处理中，常见的噪声类型有：

| 噪声类型 | 特点 | 产生原因 |
|---------|------|---------|
| **椒盐噪声** | 黑白相间的随机像素点 | 传感器故障、传输错误 |
| **高斯噪声** | 符合正态分布的随机噪声 | 传感器热噪声、弱光环境 |
| **泊松噪声** | 与信号强度相关的噪声 | 光子计数的统计涨落 |

### 解决方案

图像滤波通过邻域操作来减少噪声：

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('noisy_image.jpg')

# 使用不同的滤波方法
blurred = cv2.blur(img, (5, 5))  # 均值滤波
gaussian = cv2.GaussianBlur(img, (5, 5), 0)  # 高斯滤波
median = cv2.medianBlur(img, 5)  # 中值滤波
bilateral = cv2.bilateralFilter(img, 9, 75, 75)  # 双边滤波
```

> **一句话总结**：图像滤波是去除噪声、平滑图像的基础操作，不同的滤波方法适用于不同的场景。

---

## 2 核心原理讲解

### 什么是卷积核？

卷积核（Kernel）是一个小矩阵，用于在图像上滑动并计算邻域像素的加权和。

打个比方：

> 卷积核就像一个放大镜，它在图像上移动，每次聚焦于一小块区域，然后根据特定的规则（核的权重）计算出中心像素的新值。

### 均值滤波（Mean Filtering）

**原理**：用邻域内所有像素的平均值替代中心像素的值。

```python
# 均值滤波
result = cv2.blur(src, ksize)
```

**参数说明**：
- `src`：输入图像
- `ksize`：卷积核大小，如 (5, 5) 表示 5×5 的核

**特点**：
- ✅ 计算简单，速度快
- ❌ 会模糊边缘，丢失细节

### 高斯滤波（Gaussian Filtering）

**原理**：使用高斯函数作为权重，距离中心越近的像素权重越大。

```python
# 高斯滤波
result = cv2.GaussianBlur(src, ksize, sigmaX)
```

**参数说明**：
- `src`：输入图像
- `ksize`：卷积核大小，必须是奇数
- `sigmaX`：高斯函数的标准差，0 表示自动计算

**特点**：
- ✅ 比均值滤波更好地保留边缘
- ✅ 符合自然图像的统计特性
- ❌ 计算量比均值滤波大

### 中值滤波（Median Filtering）

**原理**：用邻域内所有像素的中值替代中心像素的值。

```python
# 中值滤波
result = cv2.medianBlur(src, ksize)
```

**参数说明**：
- `src`：输入图像
- `ksize`：卷积核大小，必须是奇数

**特点**：
- ✅ 对椒盐噪声效果极好
- ✅ 能保留边缘
- ❌ 对高斯噪声效果一般

### 双边滤波（Bilateral Filtering）

**原理**：同时考虑空间距离和像素值差异，在平滑的同时保留边缘。

```python
# 双边滤波
result = cv2.bilateralFilter(src, d, sigmaColor, sigmaSpace)
```

**参数说明**：
- `src`：输入图像
- `d`：邻域直径
- `sigmaColor`：颜色空间的标准差，值越大颜色混合越多
- `sigmaSpace`：坐标空间的标准差，值越大空间混合越多

**特点**：
- ✅ 既能去噪又能保留边缘
- ✅ 效果自然，适合人像处理
- ❌ 计算速度慢

---

## 3 基础用法 + 逐行注释

### 示例 1：添加噪声并滤波

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像
img = cv2.imread('image.jpg')

# 添加椒盐噪声
def add_salt_pepper_noise(image, prob=0.05):
    """添加椒盐噪声"""
    output = image.copy()
    # 计算要添加噪声的像素数量
    amount = int(prob * image.shape[0] * image.shape[1])
    
    # 添加盐噪声（白色）
    coords = np.random.randint(0, image.shape[0], amount), \
             np.random.randint(0, image.shape[1], amount)
    output[coords] = 255
    
    # 添加椒噪声（黑色）
    coords = np.random.randint(0, image.shape[0], amount), \
             np.random.randint(0, image.shape[1], amount)
    output[coords] = 0
    
    return output

# 添加高斯噪声
def add_gaussian_noise(image, mean=0, std=25):
    """添加高斯噪声"""
    output = image.copy()
    # 生成高斯噪声
    noise = np.random.normal(mean, std, image.shape)
    # 添加噪声并裁剪到 [0, 255]
    output = np.clip(output + noise, 0, 255).astype(np.uint8)
    return output

# 添加噪声
noisy_salt = add_salt_pepper_noise(img, 0.05)  # 5% 的椒盐噪声
noisy_gauss = add_gaussian_noise(img, 0, 25)   # 高斯噪声

# 使用不同的滤波方法
mean_filtered = cv2.blur(noisy_salt, (5, 5))           # 均值滤波
gaussian_filtered = cv2.GaussianBlur(noisy_gauss, (5, 5), 0)  # 高斯滤波
median_filtered = cv2.medianBlur(noisy_salt, 5)        # 中值滤波
bilateral_filtered = cv2.bilateralFilter(img, 9, 75, 75)  # 双边滤波

# 显示结果
plt.figure(figsize=(12, 8))

plt.subplot(2, 3, 1)
plt.title('Original')
plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

plt.subplot(2, 3, 2)
plt.title('Salt & Pepper Noise')
plt.imshow(cv2.cvtColor(noisy_salt, cv2.COLOR_BGR2RGB))

plt.subplot(2, 3, 3)
plt.title('Gaussian Noise')
plt.imshow(cv2.cvtColor(noisy_gauss, cv2.COLOR_BGR2RGB))

plt.subplot(2, 3, 4)
plt.title('Median Filter (Salt & Pepper)')
plt.imshow(cv2.cvtColor(median_filtered, cv2.COLOR_BGR2RGB))

plt.subplot(2, 3, 5)
plt.title('Gaussian Filter (Gaussian Noise)')
plt.imshow(cv2.cvtColor(gaussian_filtered, cv2.COLOR_BGR2RGB))

plt.subplot(2, 3, 6)
plt.title('Bilateral Filter')
plt.imshow(cv2.cvtColor(bilateral_filtered, cv2.COLOR_BGR2RGB))

plt.tight_layout()
plt.show()
```

### 示例 2：自定义卷积核

```python
import cv2
import numpy as np

# 读取图像
img = cv2.imread('image.jpg')

# 创建自定义卷积核（锐化核）
kernel = np.array([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
], dtype=np.float32)

# 使用 filter2D 应用自定义核
sharpened = cv2.filter2D(img, -1, kernel)

# 创建边缘检测核
edge_kernel = np.array([
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1]
], dtype=np.float32)

edges = cv2.filter2D(img, -1, edge_kernel)

# 显示结果
cv2.imshow('Original', img)
cv2.imshow('Sharpened', sharpened)
cv2.imshow('Edges', edges)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

> **原理**：`cv2.filter2D()` 允许你使用自定义的卷积核，第一个参数是输入图像，第二个参数是输出图像的深度（-1 表示与输入相同），第三个参数是卷积核。

---

## 4 对比表格

### 四种滤波方法对比

| 滤波方法 | 原理 | 优点 | 缺点 | 适用场景 |
|---------|------|------|------|---------|
| **均值滤波** | 邻域像素平均值 | 计算快，简单 | 模糊边缘，丢失细节 | 快速去噪，对质量要求不高 |
| **高斯滤波** | 高斯加权平均 | 保留边缘较好，符合自然特性 | 计算量较大 | 一般性去噪，预处理 |
| **中值滤波** | 邻域像素中值 | 对椒盐噪声效果极好，保留边缘 | 对高斯噪声效果一般 | 椒盐噪声，医学图像 |
| **双边滤波** | 空间+颜色加权 | 去噪同时保留边缘，效果自然 | 计算速度慢 | 人像美化，需要保留边缘的场景 |

### 参数选择建议

| 场景 | 推荐方法 | 参数建议 |
|------|---------|---------|
| 快速去噪 | 均值滤波 | ksize=(3,3) 或 (5,5) |
| 一般预处理 | 高斯滤波 | ksize=(5,5), sigma=0 |
| 椒盐噪声 | 中值滤波 | ksize=5 或 7 |
| 保留边缘 | 双边滤波 | d=9, sigmaColor=75, sigmaSpace=75 |
| 实时处理 | 均值/高斯 | 较小的 ksize |

---

## 5 新手常见误区

### 误区 1："卷积核越大越好"

**错！** 卷积核越大虽然去噪效果越强，但也会导致：
- 图像过度模糊
- 细节丢失严重
- 计算时间增加

正确做法：根据噪声程度选择合适的核大小，一般 3×3 到 7×7 就足够了。

### 误区 2："中值滤波对所有噪声都有效"

不是的。中值滤波对椒盐噪声效果很好，但对高斯噪声效果一般。

正确做法：
- 椒盐噪声 → 中值滤波
- 高斯噪声 → 高斯滤波
- 混合噪声 → 双边滤波

### 误区 3："双边滤波可以替代所有滤波方法"

虽然双边滤波效果好，但它计算速度慢，不适合实时处理或大规模图像处理。

正确做法：
- 实时应用 → 均值/高斯滤波
- 质量要求高 → 双边滤波
- 椒盐噪声 → 中值滤波

### 误区 4："滤波后图像一定比原图好"

不一定。滤波会丢失高频信息（边缘、细节），过度滤波会导致图像模糊。

正确做法：
- 根据应用需求选择合适的滤波强度
- 可以尝试多次轻度滤波而不是一次重度滤波
- 保留原始图像作为对比

---

## 6 动手练习

### 练习 1：基础练习 - 去除椒盐噪声

给定一张添加了 5% 椒盐噪声的图像，使用中值滤波去除噪声，并比较不同核大小（3、5、7）的效果。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像
img = cv2.imread('image.jpg')

# 添加椒盐噪声
def add_salt_pepper_noise(image, prob=0.05):
    output = image.copy()
    amount = int(prob * image.shape[0] * image.shape[1])
    
    # 盐噪声
    coords = np.random.randint(0, image.shape[0], amount), \
             np.random.randint(0, image.shape[1], amount)
    output[coords] = 255
    
    # 椒噪声
    coords = np.random.randint(0, image.shape[0], amount), \
             np.random.randint(0, image.shape[1], amount)
    output[coords] = 0
    
    return output

noisy = add_salt_pepper_noise(img, 0.05)

# 使用不同核大小的中值滤波
median_3 = cv2.medianBlur(noisy, 3)
median_5 = cv2.medianBlur(noisy, 5)
median_7 = cv2.medianBlur(noisy, 7)

# 显示结果
plt.figure(figsize=(12, 8))

plt.subplot(2, 2, 1)
plt.title('Noisy Image')
plt.imshow(cv2.cvtColor(noisy, cv2.COLOR_BGR2RGB))

plt.subplot(2, 2, 2)
plt.title('Median Filter ksize=3')
plt.imshow(cv2.cvtColor(median_3, cv2.COLOR_BGR2RGB))

plt.subplot(2, 2, 3)
plt.title('Median Filter ksize=5')
plt.imshow(cv2.cvtColor(median_5, cv2.COLOR_BGR2RGB))

plt.subplot(2, 2, 4)
plt.title('Median Filter ksize=7')
plt.imshow(cv2.cvtColor(median_7, cv2.COLOR_BGR2RGB))

plt.tight_layout()
plt.show()

print("核大小 3：去噪效果较弱，保留更多细节")
print("核大小 5：平衡去噪和细节保留")
print("核大小 7：去噪效果强，但可能丢失细节")
```

</details>

### 练习 2：进阶练习 - 比较不同滤波方法

对同一张图像分别添加高斯噪声和椒盐噪声，然后使用均值滤波、高斯滤波、中值滤波、双边滤波进行处理，比较哪种方法最适合每种噪声。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像
img = cv2.imread('image.jpg')

# 添加高斯噪声
def add_gaussian_noise(image, mean=0, std=25):
    noise = np.random.normal(mean, std, image.shape)
    output = np.clip(image + noise, 0, 255).astype(np.uint8)
    return output

# 添加椒盐噪声
def add_salt_pepper_noise(image, prob=0.05):
    output = image.copy()
    amount = int(prob * image.shape[0] * image.shape[1])
    output[np.random.randint(0, image.shape[0], amount), 
           np.random.randint(0, image.shape[1], amount)] = 255
    output[np.random.randint(0, image.shape[0], amount), 
           np.random.randint(0, image.shape[1], amount)] = 0
    return output

# 添加噪声
gaussian_noisy = add_gaussian_noise(img, 0, 25)
salt_noisy = add_salt_pepper_noise(img, 0.05)

# 对高斯噪声图像滤波
gaussian_mean = cv2.blur(gaussian_noisy, (5, 5))
gaussian_gauss = cv2.GaussianBlur(gaussian_noisy, (5, 5), 0)
gaussian_median = cv2.medianBlur(gaussian_noisy, 5)
gaussian_bilateral = cv2.bilateralFilter(gaussian_noisy, 9, 75, 75)

# 对椒盐噪声图像滤波
salt_mean = cv2.blur(salt_noisy, (5, 5))
salt_gauss = cv2.GaussianBlur(salt_noisy, (5, 5), 0)
salt_median = cv2.medianBlur(salt_noisy, 5)
salt_bilateral = cv2.bilateralFilter(salt_noisy, 9, 75, 75)

# 显示结果
plt.figure(figsize=(15, 10))

# 高斯噪声结果
plt.subplot(2, 5, 1)
plt.title('Gaussian Noise')
plt.imshow(cv2.cvtColor(gaussian_noisy, cv2.COLOR_BGR2RGB))

plt.subplot(2, 5, 2)
plt.title('Mean Filter')
plt.imshow(cv2.cvtColor(gaussian_mean, cv2.COLOR_BGR2RGB))

plt.subplot(2, 5, 3)
plt.title('Gaussian Filter')
plt.imshow(cv2.cvtColor(gaussian_gauss, cv2.COLOR_BGR2RGB))

plt.subplot(2, 5, 4)
plt.title('Median Filter')
plt.imshow(cv2.cvtColor(gaussian_median, cv2.COLOR_BGR2RGB))

plt.subplot(2, 5, 5)
plt.title('Bilateral Filter')
plt.imshow(cv2.cvtColor(gaussian_bilateral, cv2.COLOR_BGR2RGB))

# 椒盐噪声结果
plt.subplot(2, 5, 6)
plt.title('Salt & Pepper Noise')
plt.imshow(cv2.cvtColor(salt_noisy, cv2.COLOR_BGR2RGB))

plt.subplot(2, 5, 7)
plt.title('Mean Filter')
plt.imshow(cv2.cvtColor(salt_mean, cv2.COLOR_BGR2RGB))

plt.subplot(2, 5, 8)
plt.title('Gaussian Filter')
plt.imshow(cv2.cvtColor(salt_gauss, cv2.COLOR_BGR2RGB))

plt.subplot(2, 5, 9)
plt.title('Median Filter')
plt.imshow(cv2.cvtColor(salt_median, cv2.COLOR_BGR2RGB))

plt.subplot(2, 5, 10)
plt.title('Bilateral Filter')
plt.imshow(cv2.cvtColor(salt_bilateral, cv2.COLOR_BGR2RGB))

plt.tight_layout()
plt.show()

print("\n结论：")
print("高斯噪声：高斯滤波效果最好，均值滤波次之")
print("椒盐噪声：中值滤波效果最好，能完全去除噪声")
```

</details>

### 练习 3（挑战）：综合练习 - 图像美化

实现一个图像美化程序：对一张人像照片进行双边滤波（磨皮），然后使用锐化核增强细节，最后与原图对比。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

# 读取图像
img = cv2.imread('portrait.jpg')

# 步骤 1：双边滤波磨皮
# d=9 表示邻域直径，sigmaColor=75 表示颜色差异容忍度
# sigmaSpace=75 表示空间距离影响
smoothed = cv2.bilateralFilter(img, 9, 75, 75)

# 步骤 2：锐化
# 创建锐化核：原图 + (原图 - 模糊图) = 原图 + 边缘
# 等价于：unsharp mask
kernel = np.array([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
], dtype=np.float32)

sharpened = cv2.filter2D(smoothed, -1, kernel)

# 或者使用 USM 锐化
gaussian = cv2.GaussianBlur(smoothed, (0, 0), 3)
usm_sharpened = cv2.addWeighted(smoothed, 1.5, gaussian, -0.5, 0)

# 显示结果
plt.figure(figsize=(15, 10))

plt.subplot(2, 2, 1)
plt.title('Original')
plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

plt.subplot(2, 2, 2)
plt.title('Bilateral Filter (Smoothed)')
plt.imshow(cv2.cvtColor(smoothed, cv2.COLOR_BGR2RGB))

plt.subplot(2, 2, 3)
plt.title('Sharpened (Convolution)')
plt.imshow(cv2.cvtColor(sharpened, cv2.COLOR_BGR2RGB))

plt.subplot(2, 2, 4)
plt.title('Sharpened (USM)')
plt.imshow(cv2.cvtColor(usm_sharpened, cv2.COLOR_BGR2RGB))

plt.tight_layout()
plt.show()

# 保存结果
cv2.imwrite('beautified.jpg', sharpened)
print("美化完成！结果已保存到 beautified.jpg")
```

</details>

---

## 下一章预告

下一章我们会学习 **边缘检测**——也就是如何找出图像中物体的轮廓。你会学到 Canny 边缘检测、Sobel 算子等方法，了解如何让计算机"看到"物体的边界。这些知识是后续学习图像分割、目标检测的基础。
