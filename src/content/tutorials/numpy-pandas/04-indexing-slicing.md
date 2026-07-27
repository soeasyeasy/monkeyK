---
title: "第4章：NumPy 索引与切片"
description: "掌握数组数据的访问与筛选技术"
---

# 第4章：NumPy 索引与切片

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么访问数组中的某个元素？
- 怎么提取数组的一部分？
- 怎么根据条件筛选数据？
- 修改切片会影响原数组吗？

这一章就是为了解答这些问题。我们会从最基础的索引开始，逐步掌握各种数据访问和筛选技术。

---

## 1 为什么需要掌握索引与切片？

### 痛点分析

很多初学者在处理数据时，会遇到这些问题：

- 想提取某一列数据，不知道怎么操作
- 想筛选出符合条件的数据，只能写循环
- 修改了切片，结果原数组也被改了
- 搞不清视图和副本的区别

### 生活化类比

打个比方：

> 数组就像一本书。
> 索引就是页码，你想看第几页就翻到第几页。
> 切片就是书签，标记你要看的范围。
> 布尔索引就是目录，根据条件快速找到你要的内容。

再形象一点：

> Python 列表的索引像手动翻书，一页一页找。
> NumPy 的索引像电子书搜索，直接定位。
> 布尔索引像智能筛选，输入条件自动过滤。

### 代码对比

看看不同索引方式的对比：

```python
import numpy as np

arr = np.array([10, 20, 30, 40, 50])

# 基础索引：访问单个元素
print(arr[0])                            # 10 第一个元素
print(arr[-1])                           # 50 最后一个元素

# 切片：访问一段元素
print(arr[1:4])                          # [20 30 40] 第2到第4个

# 布尔索引：按条件筛选
print(arr[arr > 25])                     # [30 40 50] 大于25的元素

# 花式索引：按指定位置访问
print(arr[[0, 2, 4]])                    # [10 30 50] 第1、3、5个元素
```

> 掌握这些方法，你就能灵活地访问和操作数据。

---

## 2 核心原理：索引机制

### 概念解释

NumPy 的索引机制和 Python 列表类似，但更强大：

- 基础索引：访问单个元素
- 切片：访问一段元素
- 多维索引：访问多维数组的元素
- 布尔索引：按条件筛选
- 花式索引：按指定位置访问

### 对比分析

| 索引方式 | 用途 | 返回类型 |
|----------|------|----------|
| 基础索引 | 访问单个元素 | 标量 |
| 切片 | 访问一段元素 | 视图 |
| 布尔索引 | 按条件筛选 | 副本 |
| 花式索引 | 按指定位置访问 | 副本 |

---

## 3 基础索引

### 一维数组索引

```python
import numpy as np

arr = np.array([10, 20, 30, 40, 50])

# 正向索引（从0开始）
print(arr[0])                            # 10 第一个元素
print(arr[1])                            # 20 第二个元素
print(arr[4])                            # 50 第五个元素

# 反向索引（从-1开始）
print(arr[-1])                           # 50 最后一个元素
print(arr[-2])                           # 40 倒数第二个元素
print(arr[-5])                           # 10 倒数第五个元素

# 修改元素
arr[0] = 100
print(arr)                               # [100 20 30 40 50]
```

### 多维数组索引

```python
import numpy as np

matrix = np.array([[1, 2, 3],
                   [4, 5, 6],
                   [7, 8, 9]])

# 访问单个元素
print(matrix[0, 0])                      # 1 第一行第一列
print(matrix[1, 2])                      # 6 第二行第三列
print(matrix[-1, -1])                    # 9 最后一行最后一列

# 访问某一行
print(matrix[0])                         # [1 2 3] 第一行
print(matrix[1])                         # [4 5 6] 第二行

# 访问某一列
print(matrix[:, 0])                      # [1 4 7] 第一列
print(matrix[:, 1])                      # [2 5 8] 第二列

# 修改元素
matrix[0, 0] = 100
print(matrix[0, 0])                      # 100
```

> 多维数组索引格式：`arr[行索引, 列索引]`

---

## 4 切片

### 一维数组切片

```python
import numpy as np

arr = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

# 基本切片：[start:stop:step]
print(arr[2:7])                          # [2 3 4 5 6] 从索引2到6
print(arr[:5])                           # [0 1 2 3 4] 从开头到索引4
print(arr[5:])                           # [5 6 7 8 9] 从索引5到结尾
print(arr[::2])                          # [0 2 4 6 8] 步长为2
print(arr[::-1])                         # [9 8 7 6 5 4 3 2 1 0] 反转

# 带步长的切片
print(arr[1:8:2])                        # [1 3 5 7] 从1到7，步长2
```

### 二维数组切片

```python
import numpy as np

matrix = np.array([[1, 2, 3, 4],
                   [5, 6, 7, 8],
                   [9, 10, 11, 12]])

# 行切片
print(matrix[0:2])                       # 前两行
# [[1 2 3 4]
#  [5 6 7 8]]

# 列切片
print(matrix[:, 1:3])                    # 第2到第3列
# [[ 2  3]
#  [ 6  7]
#  [10 11]]

# 行列同时切片
print(matrix[0:2, 1:3])                  # 前两行，第2到第3列
# [[2 3]
#  [6 7]]

# 间隔切片
print(matrix[::2, ::2])                  # 每隔一行，每隔一列
# [[ 1  3]
#  [ 9 11]]
```

### 切片语法对比表

| 语法 | 含义 | 示例 |
|------|------|------|
| `arr[start:stop]` | 从 start 到 stop-1 | `arr[2:5]` |
| `arr[:stop]` | 从开头到 stop-1 | `arr[:5]` |
| `arr[start:]` | 从 start 到结尾 | `arr[5:]` |
| `arr[::step]` | 每隔 step 个元素 | `arr[::2]` |
| `arr[::-1]` | 反转数组 | `arr[::-1]` |

---

## 5 布尔索引

### 条件筛选

```python
import numpy as np

arr = np.array([10, 20, 30, 40, 50])

# 大于30的元素
mask = arr > 30                          # [False False False True True]
print(arr[mask])                         # [40 50]

# 直接写条件
print(arr[arr > 30])                     # [40 50]

# 等于某个值
print(arr[arr == 30])                    # [30]

# 不等于某个值
print(arr[arr != 30])                    # [10 20 40 50]

# 组合条件（与）
print(arr[(arr > 20) & (arr < 50)])      # [30 40]

# 组合条件（或）
print(arr[(arr < 20) | (arr > 40)])      # [10 50]

# 组合条件（非）
print(arr[~(arr > 30)])                  # [10 20 30]
```

> 注意：组合条件时，每个条件要用括号括起来。

### 二维数组的布尔索引

```python
import numpy as np

matrix = np.array([[1, 2, 3],
                   [4, 5, 6],
                   [7, 8, 9]])

# 大于5的元素
print(matrix[matrix > 5])                # [6 7 8 9]

# 偶数元素
print(matrix[matrix % 2 == 0])           # [2 4 6 8]

# 修改符合条件的元素
matrix[matrix > 5] = 0                   # 大于5的元素改为0
print(matrix)
# [[1 2 3]
#  [4 5 0]
#  [0 0 0]]
```

---

## 6 花式索引

### 按指定位置访问

```python
import numpy as np

arr = np.array([10, 20, 30, 40, 50])

# 按索引列表访问
indices = [0, 2, 4]
print(arr[indices])                      # [10 30 50]

# 直接写索引列表
print(arr[[0, 2, 4]])                    # [10 30 50]

# 重复索引
print(arr[[0, 0, 1, 1]])                 # [10 10 20 20]
```

### 二维数组的花式索引

```python
import numpy as np

matrix = np.array([[1, 2, 3],
                   [4, 5, 6],
                   [7, 8, 9]])

# 按行索引
print(matrix[[0, 2]])                    # 第1行和第3行
# [[1 2 3]
#  [7 8 9]]

# 按行列索引（访问特定位置）
rows = [0, 1, 2]
cols = [0, 1, 2]
print(matrix[rows, cols])                # [1 5 9] 对角线元素

# 使用 ix_ 生成网格索引
rows = [0, 2]
cols = [0, 2]
print(matrix[np.ix_(rows, cols)])        # 行0和2，列0和2的交叉点
# [[1 3]
#  [7 9]]
```

---

## 7 视图 vs 副本

### 关键区别

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])

# 切片返回视图
slice_view = arr[1:4]
print("切片：", slice_view)              # [2 3 4]

slice_view[0] = 100                      # 修改视图
print("原数组：", arr)                   # [1 100 3 4 5] 原数组也被修改！

# 花式索引返回副本
fancy_copy = arr[[0, 2, 4]]
print("花式索引：", fancy_copy)          # [1 3 5]

fancy_copy[0] = 100                      # 修改副本
print("原数组：", arr)                   # [1 100 3 4 5] 原数组不变
```

### 如何创建副本

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])

# 方法1：使用 copy()
copy1 = arr[1:4].copy()
copy1[0] = 100
print("原数组：", arr)                   # [1 2 3 4 5] 不变

# 方法2：使用 np.copy()
copy2 = np.copy(arr[1:4])
copy2[0] = 100
print("原数组：", arr)                   # [1 2 3 4 5] 不变
```

### 视图 vs 副本对比表

| 操作 | 返回类型 | 修改是否影响原数组 |
|------|----------|---------------------|
| 切片 `arr[1:4]` | 视图 | 是 |
| 花式索引 `arr[[0,2,4]]` | 副本 | 否 |
| 布尔索引 `arr[arr>3]` | 副本 | 否 |
| `arr.copy()` | 副本 | 否 |
| 转置 `arr.T` | 视图 | 是 |

---

## 8 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 基础索引 | `arr[i]` 访问单个元素 |
| 切片 | `arr[start:stop:step]` 访问一段元素 |
| 多维索引 | `arr[i, j]` 访问多维数组元素 |
| 布尔索引 | `arr[arr > 5]` 按条件筛选 |
| 花式索引 | `arr[[0, 2, 4]]` 按指定位置访问 |
| 视图 | 切片返回视图，修改会影响原数组 |
| 副本 | 花式索引返回副本，修改不影响原数组 |

---

## 9 新手常见误区

### 误区1："修改切片不会影响原数组"

错！切片返回的是视图，修改会影响原数组：

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])
slice_arr = arr[1:4]                     # 切片返回视图

slice_arr[0] = 100                       # 修改切片
print(arr)                               # [1 100 3 4 5] 原数组也被修改！

# 正确做法：使用 copy()
slice_copy = arr[1:4].copy()             # 创建副本
slice_copy[0] = 100
print(arr)                               # [1 2 3 4 5] 原数组不变
```

### 误区2："布尔索引的维度可以随便写"

不行！布尔数组的形状必须和原数组匹配：

```python
import numpy as np

arr = np.array([10, 20, 30, 40, 50])
mask = np.array([True, False, True, False, True])

# 正确：形状匹配
print(arr[mask])                         # [10 30 50]

# 错误：形状不匹配
mask_wrong = np.array([True, False])
# print(arr[mask_wrong])                 # 报错！
```

### 误区3："花式索引和切片是一样的"

不一样！关键区别在于返回类型：

- 切片：返回视图，修改会影响原数组
- 花式索引：返回副本，修改不影响原数组

```python
import numpy as np

arr = np.array([10, 20, 30, 40, 50])

# 切片
slice_arr = arr[[0, 2, 4]]               # 这其实是花式索引
slice_arr[0] = 100
print(arr)                               # [10 20 30 40 50] 不变

# 真正的切片
slice_view = arr[0:5:2]                  # 步长为2的切片
slice_view[0] = 100
print(arr)                               # [100 20 30 40 50] 被修改
```

### 误区4："多维索引可以用多个方括号"

不推荐！应该用逗号分隔：

```python
import numpy as np

matrix = np.array([[1, 2, 3],
                   [4, 5, 6],
                   [7, 8, 9]])

# 错误写法（虽然能运行，但不推荐）
print(matrix[0][1])                      # 2

# 正确写法
print(matrix[0, 1])                      # 2
```

### 误区5："布尔索引不能修改数据"

可以修改！布尔索引可以用来修改符合条件的元素：

```python
import numpy as np

arr = np.array([10, 20, 30, 40, 50])

# 修改大于30的元素
arr[arr > 30] = 0
print(arr)                               # [10 20 30 0 0]

# 修改偶数元素
arr = np.array([1, 2, 3, 4, 5])
arr[arr % 2 == 0] = -1
print(arr)                               # [1 -1 3 -1 5]
```

---

## 10 动手练习

### 练习1：基础练习

创建一个 5x5 的矩阵（值为 1-25），然后：
- 打印第一行
- 打印最后一列
- 打印对角线元素

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建5x5矩阵
matrix = np.arange(1, 26).reshape(5, 5)
print("矩阵：")
print(matrix)

# 第一行
print("第一行：", matrix[0])             # [1 2 3 4 5]

# 最后一列
print("最后一列：", matrix[:, -1])       # [5 10 15 20 25]

# 对角线元素
print("对角线：", np.diag(matrix))       # [1 7 13 19 25]
```

</details>

### 练习2：进阶练习

给定一个数组 `[10, 25, 30, 45, 50, 65, 70]`，筛选出：
- 大于 30 且小于 60 的元素
- 所有偶数
- 所有 3 的倍数

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

arr = np.array([10, 25, 30, 45, 50, 65, 70])

# 大于30且小于60
result1 = arr[(arr > 30) & (arr < 60)]
print("大于30且小于60：", result1)       # [45 50]

# 所有偶数
result2 = arr[arr % 2 == 0]
print("偶数：", result2)                 # [10 30 50 70]

# 所有3的倍数
result3 = arr[arr % 3 == 0]
print("3的倍数：", result3)              # [30 45]
```

</details>

### 练习3（挑战）：综合练习

创建一个 10x10 的随机矩阵（范围 0-100），然后：
1. 找出所有大于 80 的元素的位置（行号和列号）
2. 将这些元素替换为 100
3. 计算替换后矩阵每行的平均值

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建随机矩阵
np.random.seed(42)
matrix = np.random.randint(0, 101, size=(10, 10))
print("原矩阵：")
print(matrix)

# 1. 找出大于80的元素位置
positions = np.where(matrix > 80)
print("大于80的元素位置：")
for i in range(len(positions[0])):
    row = positions[0][i]
    col = positions[1][i]
    print(f"  ({row}, {col}): {matrix[row, col]}")

# 2. 替换为100
matrix[matrix > 80] = 100
print("\n替换后矩阵：")
print(matrix)

# 3. 计算每行平均值
row_means = matrix.mean(axis=1)
print("\n每行平均值：", row_means)
```

</details>

---

## 下一章预告

下一章我们会学习 **NumPy 广播机制**——如何让不同形状的数组进行运算。这是 NumPy 最强大的特性之一，掌握了就能写出更简洁高效的代码。
