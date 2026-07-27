---
title: "第2章：NumPy 数组基础"
description: "掌握 ndarray 对象的创建、属性与形状操作"
---

# 第2章：NumPy 数组基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- ndarray 是什么？听起来很高大上，难不难理解？
- NumPy 有那么多创建数组的方法，我该用哪个？
- 数组的属性（shape、ndim、dtype）都是什么意思？
- reshape 到底怎么用？为什么总是报错？

这一章就是为了解答这些问题。我们会从最基础的数组创建开始，逐步掌握数组的各种属性和形状操作。

---

## 1 为什么需要掌握数组基础？

### 痛点分析

很多初学者学 NumPy 时，会遇到这些问题：

- 不知道用什么方法创建数组，每次都只会用 `np.array()`
- 搞不清楚数组的维度，一维、二维、三维数组分不清
- reshape 的时候总是报错，不知道哪里出了问题
- 混淆 shape 和 size，不知道它们的区别

### 生活化类比

打个比方：

> 学习数组基础，就像学开车前先认识方向盘、油门、刹车。
> 如果你连这些基本操作都不会，怎么可能上路？

再形象一点：

> Python 列表就像一个大口袋，什么都能装。
> NumPy 数组就像一个整理好的收纳盒，每样东西都有固定位置，找起来更快。

### 代码对比

看看不同创建方式的对比：

```python
import numpy as np

# 方法1：从列表创建
arr1 = np.array([1, 2, 3])              # 手动指定每个元素

# 方法2：创建全0数组
arr2 = np.zeros(5)                       # [0. 0. 0. 0. 0.]

# 方法3：创建等差数列
arr3 = np.arange(0, 10, 2)               # [0 2 4 6 8]

# 方法4：创建均匀分布的数组
arr4 = np.linspace(0, 1, 5)              # [0. 0.25 0.5 0.75 1.]
```

> 掌握这些方法，你就能根据不同场景选择最合适的方式。

---

## 2 核心原理：ndarray

### 概念解释

ndarray 是 NumPy 的核心数据结构，全称是 N-dimensional array（N维数组）。

通俗地说：

> ndarray 就是一个容器，用来装一堆相同类型的数据。
> 它可以是一维的（像一条线），也可以是二维的（像一张表），甚至三维的（像一个立方体）。

### 对比分析

| 特性 | Python 列表 | NumPy 数组 |
|------|-------------|------------|
| 数据类型 | 可以混合 | 必须相同 |
| 维度 | 一维（嵌套列表可以多维） | 支持多维 |
| 运算速度 | 慢 | 快 |
| 内存占用 | 大 | 小 |
| 支持向量化 | 否 | 是 |

---

## 3 数组创建方法

### 方法1：从 Python 列表创建

```python
import numpy as np

# 一维数组
arr1d = np.array([1, 2, 3, 4, 5])       # 从列表创建一维数组
print(arr1d)                             # 输出：[1 2 3 4 5]

# 二维数组（矩阵）
arr2d = np.array([[1, 2, 3],             # 第一行
                  [4, 5, 6]])            # 第二行
print(arr2d)
# 输出：
# [[1 2 3]
#  [4 5 6]]

# 指定数据类型
arr_float = np.array([1, 2, 3], dtype=float)  # 强制转为浮点型
print(arr_float)                               # 输出：[1. 2. 3.]
```

### 方法2：创建特殊数组

```python
import numpy as np

# 全0数组
zeros = np.zeros(5)                      # 创建5个0组成的一维数组
print(zeros)                             # 输出：[0. 0. 0. 0. 0.]

zeros_2d = np.zeros((2, 3))              # 创建2行3列的全0二维数组
print(zeros_2d)
# 输出：
# [[0. 0. 0.]
#  [0. 0. 0.]]

# 全1数组
ones = np.ones(5)                        # 创建5个1组成的一维数组
print(ones)                              # 输出：[1. 1. 1. 1. 1.]

ones_2d = np.ones((2, 3))                # 创建2行3列的全1二维数组
print(ones_2d)
# 输出：
# [[1. 1. 1.]
#  [1. 1. 1.]]

# 单位矩阵
eye = np.eye(3)                          # 创建3x3单位矩阵（对角线为1）
print(eye)
# 输出：
# [[1. 0. 0.]
#  [0. 1. 0.]
#  [0. 0. 1.]]
```

### 方法3：创建等差数列

```python
import numpy as np

# arange：类似 range，但返回数组
arr1 = np.arange(0, 10, 2)               # 从0到10，步长为2
print(arr1)                              # 输出：[0 2 4 6 8]

arr2 = np.arange(5)                      # 从0到4（不包含5）
print(arr2)                              # 输出：[0 1 2 3 4]

# linspace：均匀分布
arr3 = np.linspace(0, 1, 5)              # 从0到1，均匀取5个点
print(arr3)                              # 输出：[0. 0.25 0.5 0.75 1.]

arr4 = np.linspace(0, 10, 11)            # 从0到10，均匀取11个点
print(arr4)                              # 输出：[0. 1. 2. 3. 4. 5. 6. 7. 8. 9. 10.]
```

### 方法4：创建随机数组

```python
import numpy as np

# 随机整数
rand_int = np.random.randint(0, 10, size=5)  # 生成5个0-9的随机整数
print(rand_int)                               # 例如：[3 7 2 9 1]

# 随机浮点数（0-1之间）
rand_float = np.random.random(5)             # 生成5个0-1的随机浮点数
print(rand_float)                             # 例如：[0.37 0.95 0.73 0.59 0.16]

# 正态分布
rand_norm = np.random.randn(5)               # 生成5个标准正态分布的随机数
print(rand_norm)                              # 例如：[-0.42 1.23 -0.18 0.67 -0.91]
```

### 创建方法对比表

| 方法 | 用途 | 示例 |
|------|------|------|
| `np.array()` | 从列表创建 | `np.array([1, 2, 3])` |
| `np.zeros()` | 创建全0数组 | `np.zeros((2, 3))` |
| `np.ones()` | 创建全1数组 | `np.ones((2, 3))` |
| `np.eye()` | 创建单位矩阵 | `np.eye(3)` |
| `np.arange()` | 创建等差数列 | `np.arange(0, 10, 2)` |
| `np.linspace()` | 创建均匀分布 | `np.linspace(0, 1, 5)` |
| `np.random.random()` | 创建随机数组 | `np.random.random(5)` |

---

## 4 数组属性

### 核心属性

```python
import numpy as np

# 创建一个二维数组
arr = np.array([[1, 2, 3],
                [4, 5, 6]])

# ndim：维度数
print("维度数：", arr.ndim)               # 输出：2（二维数组）

# shape：形状（几行几列）
print("形状：", arr.shape)                # 输出：(2, 3) 表示2行3列

# size：元素总数
print("元素总数：", arr.size)             # 输出：6（2x3=6）

# dtype：数据类型
print("数据类型：", arr.dtype)            # 输出：int64（64位整数）

# itemsize：每个元素占用的字节数
print("每个元素大小：", arr.itemsize)     # 输出：8（8字节=64位）
```

逐行解释：

- `ndim`：数组的维度，一维数组是1，二维数组是2
- `shape`：数组的形状，返回一个元组，例如 (2, 3) 表示2行3列
- `size`：数组中元素的总个数
- `dtype`：数组中元素的数据类型
- `itemsize`：每个元素占用的内存大小（字节）

### 属性对比表

| 属性 | 含义 | 示例值 |
|------|------|--------|
| `ndim` | 维度数 | 2 |
| `shape` | 形状（行,列） | (2, 3) |
| `size` | 元素总数 | 6 |
| `dtype` | 数据类型 | int64 |
| `itemsize` | 每元素字节数 | 8 |

---

## 5 形状操作

### reshape：改变数组形状

```python
import numpy as np

# 创建一维数组
arr = np.arange(12)                      # [0 1 2 3 4 5 6 7 8 9 10 11]
print("原数组形状：", arr.shape)          # 输出：(12,)

# 变成二维数组（3行4列）
arr_2d = arr.reshape(3, 4)               # 重构成3行4列
print(arr_2d)
# 输出：
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]

# 变成三维数组（2x2x3）
arr_3d = arr.reshape(2, 2, 3)            # 重构成2x2x3
print(arr_3d)
# 输出：
# [[[ 0  1  2]
#   [ 3  4  5]]
#
#  [[ 6  7  8]
#   [ 9 10 11]]]

# 使用 -1 自动推断维度
arr_auto = arr.reshape(3, -1)            # 3行，列数自动计算
print(arr_auto.shape)                     # 输出：(3, 4)
```

> 重要提示：reshape 不会改变原数组，而是返回一个新数组。

### flatten 和 ravel：展平数组

```python
import numpy as np

arr = np.array([[1, 2, 3],
                [4, 5, 6]])

# flatten：返回副本（深拷贝）
flat1 = arr.flatten()                    # 展平为一维数组
print(flat1)                             # 输出：[1 2 3 4 5 6]
flat1[0] = 100                           # 修改展平后的数组
print(arr[0, 0])                         # 输出：1（原数组不受影响）

# ravel：返回视图（浅拷贝）
flat2 = arr.ravel()                      # 展平为一维数组
print(flat2)                             # 输出：[1 2 3 4 5 6]
flat2[0] = 100                           # 修改展平后的数组
print(arr[0, 0])                         # 输出：100（原数组也被修改）
```

区别：

- `flatten()`：返回副本，修改不影响原数组
- `ravel()`：返回视图，修改会影响原数组

### 转置：T 属性

```python
import numpy as np

arr = np.array([[1, 2, 3],
                [4, 5, 6]])

print("原数组：")
print(arr)
# [[1 2 3]
#  [4 5 6]]

# 转置：行变列，列变行
print("转置后：")
print(arr.T)
# [[1 4]
#  [2 5]
#  [3 6]]
```

> 转置在矩阵运算中非常常用，后面会详细讲。

---

## 6 数据类型指定

### dtype 参数

```python
import numpy as np

# 默认整数类型
arr1 = np.array([1, 2, 3])
print(arr1.dtype)                         # 输出：int64（或 int32，取决于系统）

# 指定浮点类型
arr2 = np.array([1, 2, 3], dtype=float)
print(arr2.dtype)                         # 输出：float64
print(arr2)                               # 输出：[1. 2. 3.]

# 指定32位整数
arr3 = np.array([1, 2, 3], dtype=np.int32)
print(arr3.dtype)                         # 输出：int32

# 指定布尔类型
arr4 = np.array([1, 0, 1], dtype=bool)
print(arr4.dtype)                         # 输出：bool
print(arr4)                               # 输出：[ True False  True]
```

### 常用数据类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `int32` | 32位整数 | `np.int32` |
| `int64` | 64位整数 | `np.int64` |
| `float32` | 32位浮点数 | `np.float32` |
| `float64` | 64位浮点数 | `np.float64` |
| `bool` | 布尔类型 | `np.bool_` |
| `str` | 字符串类型 | `np.str_` |

---

## 7 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| ndarray | NumPy 的核心数据结构，N维数组 |
| 创建方法 | array, zeros, ones, eye, arange, linspace |
| 数组属性 | ndim, shape, size, dtype, itemsize |
| 形状操作 | reshape, flatten, ravel, T |
| 数据类型 | int, float, bool, str 等 |

---

## 8 新手常见误区

### 误区1："reshape 会改变原数组"

错！reshape 返回的是新数组，原数组不变：

```python
import numpy as np

arr = np.arange(6)                       # [0 1 2 3 4 5]
new_arr = arr.reshape(2, 3)              # 重构成2行3列

print(arr)                               # 输出：[0 1 2 3 4 5]（原数组不变）
print(new_arr)                           # 输出：[[0 1 2] [3 4 5]]
```

### 误区2："shape 和 size 是一回事"

不是！它们完全不同：

- `shape`：数组的形状（几行几列），返回元组
- `size`：数组中元素的总个数，返回整数

```python
import numpy as np

arr = np.array([[1, 2, 3],
                [4, 5, 6]])

print(arr.shape)                         # 输出：(2, 3)
print(arr.size)                          # 输出：6
```

### 误区3："flatten 和 ravel 是一样的"

不一样！关键区别在于是否返回副本：

- `flatten()`：返回副本，修改不影响原数组
- `ravel()`：返回视图，修改会影响原数组

```python
import numpy as np

arr = np.array([[1, 2], [3, 4]])

# flatten
flat1 = arr.flatten()
flat1[0] = 100
print(arr[0, 0])                         # 输出：1（原数组不变）

# ravel
flat2 = arr.ravel()
flat2[0] = 100
print(arr[0, 0])                         # 输出：100（原数组被修改）
```

### 误区4："reshape 可以随便改"

不行！reshape 后的元素总数必须和原数组相同：

```python
import numpy as np

arr = np.arange(12)                      # 12个元素

# 正确：12 = 3 x 4
arr.reshape(3, 4)                        # 成功

# 错误：12 != 3 x 5
arr.reshape(3, 5)                        # 报错！
```

### 误区5："ndim 就是数组的长度"

不是！ndim 是维度数，不是长度：

```python
import numpy as np

arr1d = np.array([1, 2, 3])              # 一维数组
print(arr1d.ndim)                         # 输出：1（维度数是1）
print(len(arr1d))                         # 输出：3（长度是3）

arr2d = np.array([[1, 2, 3],
                  [4, 5, 6]])            # 二维数组
print(arr2d.ndim)                         # 输出：2（维度数是2）
```

---

## 9 动手练习

### 练习1：基础练习

创建一个 3x3 的单位矩阵（对角线为1，其余为0），并打印它的 shape、size、ndim。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建3x3单位矩阵
I = np.eye(3)
print("单位矩阵：")
print(I)
# [[1. 0. 0.]
#  [0. 1. 0.]
#  [0. 0. 1.]]

# 打印属性
print("形状：", I.shape)                  # 输出：(3, 3)
print("元素总数：", I.size)               # 输出：9
print("维度数：", I.ndim)                 # 输出：2
```

</details>

### 练习2：进阶练习

创建一个包含 0 到 20 的数组，将其重构成 4x5 的二维数组，然后打印：
- 第一行的所有元素
- 最后一列的所有元素
- 转置后的数组

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建数组
arr = np.arange(21)                      # [0 1 2 ... 20]
print("原数组：", arr)

# 重构成4x5（注意：21个元素不能重构成4x5，应该是20个元素）
arr = np.arange(20)                      # [0 1 2 ... 19]
arr_2d = arr.reshape(4, 5)               # 重构成4行5列
print("重构后：")
print(arr_2d)
# [[ 0  1  2  3  4]
#  [ 5  6  7  8  9]
#  [10 11 12 13 14]
#  [15 16 17 18 19]]

# 第一行
print("第一行：", arr_2d[0])              # 输出：[0 1 2 3 4]

# 最后一列
print("最后一列：", arr_2d[:, -1])        # 输出：[ 4  9 14 19]

# 转置
print("转置后：")
print(arr_2d.T)
# [[ 0  5 10 15]
#  [ 1  6 11 16]
#  [ 2  7 12 17]
#  [ 3  8 13 18]
#  [ 4  9 14 19]]
```

</details>

### 练习3（挑战）：综合练习

创建一个 5x5 的随机整数矩阵（范围 0-100），然后：
1. 找出最大值和最小值
2. 计算每行的平均值
3. 将矩阵展平为一维数组
4. 找出大于 50 的元素个数

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建5x5随机整数矩阵
np.random.seed(42)                       # 设置随机种子，保证结果可复现
matrix = np.random.randint(0, 101, size=(5, 5))
print("随机矩阵：")
print(matrix)

# 1. 最大值和最小值
max_val = matrix.max()
min_val = matrix.min()
print(f"最大值：{max_val}")
print(f"最小值：{min_val}")

# 2. 每行的平均值
row_means = matrix.mean(axis=1)          # axis=1表示按行计算
print("每行平均值：", row_means)

# 3. 展平为一维数组
flat = matrix.flatten()
print("展平后：", flat)

# 4. 大于50的元素个数
count = (matrix > 50).sum()              # 先判断，再求和
print(f"大于50的元素个数：{count}")
```

</details>

---

## 下一章预告

下一章我们会学习 **NumPy 数据类型与运算**——包括各种数据类型、类型转换、算术运算、统计函数和矩阵运算。这些是 NumPy 的核心功能，掌握了就能做各种数值计算。
