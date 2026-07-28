---
title: "第2章：OpenCV 环境搭建"
description: "Python 环境配置、OpenCV 安装、NumPy 基础、第一个视觉程序"
---

# 第2章：OpenCV 环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- OpenCV 是什么？为什么要用它？
- Python 环境怎么配置？Anaconda 和原生 Python 选哪个？
- NumPy 和计算机视觉有什么关系？
- 怎么验证环境安装成功了？

这一章就是为了解答这些问题。我们会一步步搭建好开发环境，写出第一个计算机视觉程序。

---

## 1 为什么需要 OpenCV？

### 痛点分析

假设你要对一张图片做高斯模糊，如果没有现成的库，你需要：
1. 自己实现二维卷积运算
2. 处理图像边界情况
3. 优化性能让处理速度够快
4. 适配不同格式的图像

这至少需要写几百行代码，而且性能还不一定好。

### 解决方案

OpenCV（Open Source Computer Vision Library）是一个开源的计算机视觉库，它帮你封装好了所有底层运算。

打个比方：

> OpenCV 就像一把瑞士军刀——你需要切东西、开瓶子、拧螺丝，不用自己造工具，直接掏出来用就行。OpenCV 提供了 2500+ 个优化过的函数，覆盖从基础图像处理到高级深度学习的所有功能。

### 代码对比

```python
# ❌ 没有 OpenCV：自己实现高斯模糊（需要几十行数学代码）
import numpy as np

def gaussian_blur_manual(image, kernel_size=5, sigma=1.0):
    # 创建高斯核
    kernel = np.zeros((kernel_size, kernel_size))
    center = kernel_size // 2
    for i in range(kernel_size):
        for j in range(kernel_size):
            x = i - center
            y = j - center
            kernel[i, j] = np.exp(-(x**2 + y**2) / (2 * sigma**2))
    kernel /= np.sum(kernel)

    # 手动做卷积运算（还要处理边界...）
    # ... 省略几十行代码 ...
    return result

# ✅ 有 OpenCV：一行搞定
import cv2
blurred = cv2.GaussianBlur(image, (5, 5), 1.0)
```

> **一句话总结**：OpenCV 让你专注于"做什么"，而不是"怎么做"。

---

## 2 核心原理

### OpenCV 的本质

OpenCV 底层是用 C/C++ 写的，但提供了 Python、Java 等语言的接口。在 Python 中使用 OpenCV，本质上就是调用底层的 C++ 函数。

| 特性 | 说明 |
| --- | --- |
| 开发语言 | C++（核心）+ Python/Java 接口 |
| 开源协议 | Apache 2.0（商用免费） |
| 支持平台 | Windows、Linux、macOS、Android、iOS |
| 函数数量 | 2500+ 个优化过的函数 |
| 主要模块 | core（核心）、imgproc（图像处理）、highgui（GUI）、dnn（深度学习）等 |

### OpenCV 的版本区别

安装 OpenCV 时会看到几个不同的包：

| 包名 | 说明 | 推荐 |
| --- | --- | --- |
| `opencv-python` | 主模块，包含大部分常用功能 | ✅ 入门首选 |
| `opencv-contrib-python` | 主模块 + 额外模块（含 SIFT、SURF 等） | ✅ 推荐安装 |
| `opencv-python-headless` | 无 GUI 功能，适合服务器环境 | 服务器部署用 |

---

## 3 环境搭建

### 3.1 安装 Python

推荐使用 **Anaconda**（集成了 Python 和常用科学计算包）：

```bash
# 下载 Anaconda：https://www.anaconda.com/download
# 安装完成后验证
python --version    # 应该显示 Python 3.8+
```

### 3.2 创建虚拟环境

```bash
# 创建名为 cv 的虚拟环境，指定 Python 版本为 3.10
conda create -n cv python=3.10

# 激活环境
conda activate cv
```

### 3.3 安装 OpenCV 和 NumPy

```bash
# 安装 OpenCV（推荐安装 contrib 版本，功能更全）
pip install opencv-contrib-python

# 安装 NumPy（通常随 OpenCV 自动安装）
pip install numpy

# 安装 Matplotlib（用于显示图像）
pip install matplotlib
```

### 3.4 验证安装

```python
# 验证脚本
import cv2          # 导入 OpenCV
import numpy as np  # 导入 NumPy

# 打印版本号
print(f"OpenCV 版本: {cv2.__version__}")     # 应该显示 4.x.x
print(f"NumPy 版本: {np.__version__}")       # 应该显示 1.x.x
```

---

## 4 基础用法

### 4.1 NumPy 基础（CV 必备）

在计算机视觉中，**图像就是 NumPy 数组**。理解 NumPy 是学习 CV 的基础。

```python
import numpy as np

# === 创建数组 ===

# 创建一个 3x3 的全零数组（可以理解为一个 3x3 的黑色图像）
zeros = np.zeros((3, 3))
print(zeros)
# [[0. 0. 0.]
#  [0. 0. 0.]
#  [0. 0. 0.]]

# 创建一个 3x3 的全一数组（可以理解为一个 3x3 的白色图像）
ones = np.ones((3, 3))
print(ones)
# [[1. 1. 1.]
#  [1. 1. 1.]
#  [1. 1. 1.]]

# 创建一个随机数组（模拟一个随机噪声图像）
random = np.random.randint(0, 256, (3, 3))  # 0-255 的随机整数
print(random)
# [[123  45  67]
#  [ 89  12 234]
#  [ 56  78  90]]

# === 数组索引和切片 ===

# 创建一个 4x4 的数组
arr = np.array([[1,  2,  3,  4],
                [5,  6,  7,  8],
                [9, 10, 11, 12],
                [13, 14, 15, 16]])

# 获取单个元素（注意：先行后列！）
print(arr[1, 2])  # 第2行第3列 → 7

# 获取一行
print(arr[1, :])  # 第2行 → [5, 6, 7, 8]

# 获取一列
print(arr[:, 2])  # 第3列 → [3, 7, 11, 15]

# 获取一个区域（类似 ROI 提取）
print(arr[1:3, 1:3])  # 中间 2x2 区域
# [[ 6,  7]
#  [10, 11]]

# === 数组运算 ===

# 数组加减（图像亮度调整）
brighter = arr + 10   # 每个像素值加 10（变亮）
darker = arr - 10     # 每个像素值减 10（变暗）

# 数组乘法（图像对比度调整）
contrast = arr * 2    # 每个像素值乘 2（对比度增强）
```

### 4.2 第一个 CV 程序

```python
import cv2          # 导入 OpenCV
import numpy as np  # 导入 NumPy

# 第一步：读取图像
# cv2.imread() 读取图片，返回一个 NumPy 数组
# 参数：图片路径
img = cv2.imread('cat.jpg')  # 确保当前目录下有 cat.jpg

# 检查图片是否读取成功
if img is None:
    print("错误：无法读取图片，请检查路径是否正确")
else:
    # 第二步：查看图像属性
    print(f"图像形状: {img.shape}")     # (高, 宽, 通道数)
    print(f"图像大小: {img.size}")       # 总像素数 = 高 × 宽 × 通道数
    print(f"数据类型: {img.dtype}")      # uint8（8位无符号整数，范围 0-255）

    # 第三步：显示图像
    # cv2.imshow() 在窗口中显示图像
    # 参数1：窗口名称（字符串）
    # 参数2：要显示的图像
    cv2.imshow('Original Image', img)

    # 第四步：转换为灰度图
    # cv2.cvtColor() 转换颜色空间
    # cv2.COLOR_BGR2GRAY 表示从 BGR 转为灰度
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cv2.imshow('Gray Image', gray)

    # 第五步：保存处理后的图像
    cv2.imwrite('cat_gray.jpg', gray)  # 保存灰度图
    print("灰度图已保存为 cat_gray.jpg")

    # 第六步：等待按键并关闭窗口
    # cv2.waitKey(0) 等待用户按键，0 表示无限等待
    # 按任意键继续
    cv2.waitKey(0)

    # cv2.destroyAllWindows() 关闭所有窗口
    cv2.destroyAllWindows()
```

> **原理**：这就是一个完整的 CV 程序流程：**读取 → 处理 → 显示 → 保存**。后面所有章节都是在这个基础上增加更复杂的处理。

---

## 5 对比表格

### OpenCV vs PIL vs scikit-image

| 特性 | OpenCV | PIL (Pillow) | scikit-image |
| --- | --- | --- | --- |
| 主要用途 | 计算机视觉 | 图像基本处理 | 科学图像处理 |
| 颜色通道顺序 | BGR（注意！） | RGB | RGB |
| 图像格式 | NumPy 数组 | Image 对象 | NumPy 数组 |
| 性能 | 最快（C++ 底层） | 中等 | 中等 |
| 功能丰富度 | 最丰富（2500+ 函数） | 基础 | 丰富 |
| 深度学习集成 | 好（DNN 模块） | 差 | 一般 |
| 学习难度 | 中等 | 简单 | 中等 |
| 推荐场景 | CV 全场景 | 简单图像处理 | 学术研究 |

---

## 6 新手常见误区

### 误区 1："OpenCV 读取的图片颜色是对的"

**错！** OpenCV 默认以 **BGR** 顺序读取彩色图像，而不是常见的 RGB。

```python
import cv2
import matplotlib.pyplot as plt

img = cv2.imread('cat.jpg')

# ❌ 直接用 matplotlib 显示 OpenCV 读取的图像（颜色会偏蓝）
plt.imshow(img)  # 颜色不对！因为 matplotlib 期望 RGB，但 img 是 BGR
plt.show()

# ✅ 正确做法：先转换颜色通道
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
plt.imshow(img_rgb)  # 颜色正确了
plt.show()
```

### 误区 2："pip install opencv-python 就够了"

不一定。`opencv-python` 不包含一些高级功能（如 SIFT、SURF 特征点检测）。

✅ 正确做法：安装 `opencv-contrib-python`，它包含所有功能。

```bash
# ✅ 推荐安装完整版
pip install opencv-contrib-python

# ❌ 如果两个都装了会冲突，先卸载
pip uninstall opencv-python
pip install opencv-contrib-python
```

### 误区 3："图像数据类型是 float"

**错！** OpenCV 读取的图像默认是 **uint8**（8位无符号整数），范围是 0-255。

```python
import cv2

img = cv2.imread('cat.jpg')
print(img.dtype)   # uint8（不是 float！）
print(img.min())   # 0
print(img.max())   # 255

# 如果要做数学运算，可能需要转换类型
img_float = img.astype(np.float32)  # 转为 float32
print(img_float.dtype)  # float32
```

### 误区 4："cv2.imread() 读取失败不会报错"

**注意！** `cv2.imread()` 读取失败时不会抛出异常，而是返回 `None`。

```python
import cv2

# ❌ 不检查就直接使用（如果路径错误会崩溃）
img = cv2.imread('not_exist.jpg')
cv2.imshow('test', img)  # 报错！img 是 None

# ✅ 正确做法：先检查是否读取成功
img = cv2.imread('not_exist.jpg')
if img is None:
    print("错误：图片读取失败，请检查路径")
else:
    cv2.imshow('test', img)
    cv2.waitKey(0)
```

---

## 7 动手练习

### 练习 1：基础练习

编写一个程序，读取一张彩色图片，分别显示原图、灰度图、翻转后的图像（水平翻转），并保存灰度图和翻转图。

<details>
<summary>点击查看答案</summary>

```python
import cv2

# 读取图片
img = cv2.imread('cat.jpg')

# 检查是否读取成功
if img is None:
    print("错误：图片读取失败")
else:
    # 转换为灰度图
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 水平翻转（flipCode: 0=垂直翻转, 1=水平翻转, -1= both）
    flipped = cv2.flip(img, 1)

    # 显示三张图
    cv2.imshow('Original', img)
    cv2.imshow('Gray', gray)
    cv2.imshow('Flipped', flipped)

    # 保存图片
    cv2.imwrite('cat_gray.jpg', gray)
    cv2.imwrite('cat_flipped.jpg', flipped)

    # 等待按键
    cv2.waitKey(0)
    cv2.destroyAllWindows()
```

</details>

### 练习 2：进阶练习

编写一个程序，创建一张 300x300 的黑色图像，然后在图像上画一个白色正方形（从 (50,50) 到 (250,250)），并在正方形中间画一个灰色圆形。

<details>
<summary>点击查看答案</summary>

```python
import cv2
import numpy as np

# 创建 300x300 的黑色图像（3通道，uint8）
img = np.zeros((300, 300, 3), dtype=np.uint8)

# 画白色正方形（线条）
# 参数：图像、起点、终点、颜色(BGR)、线宽
cv2.rectangle(img, (50, 50), (250, 250), (255, 255, 255), 2)

# 在正方形中心画灰色圆形（填充）
# 参数：图像、圆心、半径、颜色(BGR)、线宽（-1 表示填充）
cv2.circle(img, (150, 150), 50, (128, 128, 128), -1)

# 显示图像
cv2.imshow('Drawing', img)
cv2.waitKey(0)
cv2.destroyAllWindows()

# 保存结果
cv2.imwrite('drawing.jpg', img)
```

</details>

### 练习 3（挑战）：综合练习

编写一个程序，实现一个简单的"图像浏览器"：读取一张图片，支持通过按键 'g' 切换灰度图、按键 'r' 恢复原图、按键 's' 保存当前图像、按键 'q' 退出。

<details>
<summary>点击查看答案</summary>

```python
import cv2

# 读取原始图片
img = cv2.imread('cat.jpg')

if img is None:
    print("错误：图片读取失败")
else:
    # 初始显示原图
    current = img.copy()
    is_gray = False

    print("操作说明：")
    print("  g - 切换灰度/原图")
    print("  s - 保存当前图像")
    print("  q - 退出")

    while True:
        # 显示当前图像
        cv2.imshow('Image Viewer', current)

        # 等待按键（等待 0 毫秒表示无限等待）
        key = cv2.waitKey(0) & 0xFF  # 取低 8 位

        if key == ord('g'):
            # 切换灰度/原图
            if is_gray:
                current = img.copy()   # 恢复原图
                is_gray = False
                print("已切换到原图")
            else:
                current = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # 转灰度
                is_gray = True
                print("已切换到灰度图")

        elif key == ord('s'):
            # 保存当前图像
            cv2.imwrite('saved.jpg', current)
            print("已保存为 saved.jpg")

        elif key == ord('q'):
            # 退出程序
            break

    cv2.destroyAllWindows()
```

</details>

---

## 下一章预告

下一章我们会学习 **图像基础操作**——深入了解图像的读取、显示、颜色通道、像素操作和 ROI 提取。你会理解图像在计算机中到底是怎么存储的，以及如何对像素进行精确操作。这是后续所有图像处理的基础！
