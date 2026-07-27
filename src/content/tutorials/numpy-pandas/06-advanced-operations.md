---
title: "第6章：NumPy 高级操作"
description: "掌握数组拼接、分割、排序与文件读写"
---

# 第6章：NumPy 高级操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么把多个数组合并成一个？
- 怎么把一个大数组拆分成多个小数组？
- 怎么对数组排序？排序会改变原数组吗？
- 怎么把数组保存到文件？怎么从文件读取？

这一章就是为了解答这些问题。我们会学习数组拼接、分割、排序、文件读写等高级操作，这些都是实际项目中常用的功能。

---

## 1 为什么需要掌握高级操作？

### 痛点分析

在实际项目中，你经常会遇到这些需求：

- 有多个小数据集，需要合并成一个大数组
- 一个大数组需要拆分成训练集和测试集
- 需要对数据排序，找出最大最小值
- 需要把处理好的数据保存到文件，或者从文件加载数据

### 生活化类比

打个比方：

> 数组拼接就像拼图，把几块小拼图拼成一幅大图。
> 数组分割就像切蛋糕，把一个大蛋糕切成几块分给大家。
> 排序就像整理书架，把书按顺序排好，找起来更快。
> 文件读写就像保存和读取笔记，把重要的东西记下来，下次还能用。

### 代码对比

看看这些操作的简单用法：

```python
import numpy as np

# 拼接
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
c = np.concatenate([a, b])               # [1 2 3 4 5 6]

# 分割
arr = np.array([1, 2, 3, 4, 5, 6])
parts = np.split(arr, 3)                 # 分成3份

# 排序
arr = np.array([3, 1, 4, 1, 5])
sorted_arr = np.sort(arr)                # [1 1 3 4 5]

# 保存和加载
np.save('data.npy', arr)                 # 保存
loaded = np.load('data.npy')             # 加载
```

> 掌握这些操作，你就能灵活处理各种数据任务。

---

## 2 数组拼接

### concatenate

```python
import numpy as np

# 一维数组拼接
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
c = np.concatenate([a, b])               # 拼接两个数组
print(c)                                 # [1 2 3 4 5 6]

# 二维数组拼接（按行）
m1 = np.array([[1, 2],
               [3, 4]])
m2 = np.array([[5, 6],
               [7, 8]])
m3 = np.concatenate([m1, m2], axis=0)    # 按行拼接（axis=0）
print(m3)
# [[1 2]
#  [3 4]
#  [5 6]
#  [7 8]]

# 二维数组拼接（按列）
m4 = np.concatenate([m1, m2], axis=1)    # 按列拼接（axis=1）
print(m4)
# [[1 2 5 6]
#  [3 4 7 8]]
```

### vstack 和 hstack

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

# vstack：垂直堆叠（按行）
v = np.vstack([a, b])
print(v)
# [[1 2 3]
#  [4 5 6]]

# hstack：水平堆叠（按列）
h = np.hstack([a, b])
print(h)                                 # [1 2 3 4 5 6]

# 二维数组
m1 = np.array([[1, 2],
               [3, 4]])
m2 = np.array([[5, 6],
               [7, 8]])

# vstack：垂直堆叠
v2 = np.vstack([m1, m2])
print(v2)
# [[1 2]
#  [3 4]
#  [5 6]
#  [7 8]]

# hstack：水平堆叠
h2 = np.hstack([m1, m2])
print(h2)
# [[1 2 5 6]
#  [3 4 7 8]]
```

### column_stack

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

# column_stack：按列堆叠
cs = np.column_stack([a, b])
print(cs)
# [[1 4]
#  [2 5]
#  [3 6]]
```

### 拼接函数对比表

| 函数 | 用途 | 示例 |
|------|------|------|
| `concatenate` | 通用拼接 | `np.concatenate([a, b])` |
| `vstack` | 垂直堆叠 | `np.vstack([a, b])` |
| `hstack` | 水平堆叠 | `np.hstack([a, b])` |
| `column_stack` | 按列堆叠 | `np.column_stack([a, b])` |

---

## 3 数组分割

### split

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5, 6])

# 平均分成3份
parts = np.split(arr, 3)
print(parts)                             # [array([1, 2]), array([3, 4]), array([5, 6])]

# 按指定位置分割
parts2 = np.split(arr, [2, 4])           # 在索引2和4处分割
print(parts2)                            # [array([1, 2]), array([3, 4]), array([5, 6])]
```

### array_split

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])

# split 要求能整除
# np.split(arr, 3)                       # 报错！5不能被3整除

# array_split 不要求能整除
parts = np.array_split(arr, 3)
print(parts)                             # [array([1, 2]), array([3, 4]), array([5])]
```

### hsplit 和 vsplit

```python
import numpy as np

matrix = np.array([[1, 2, 3, 4],
                   [5, 6, 7, 8],
                   [9, 10, 11, 12]])

# hsplit：水平分割（按列）
h_parts = np.hsplit(matrix, 2)           # 分成2份
print(h_parts[0])
# [[ 1  2]
#  [ 5  6]
#  [ 9 10]]
print(h_parts[1])
# [[ 3  4]
#  [ 7  8]
#  [11 12]]

# vsplit：垂直分割（按行）
v_parts = np.vsplit(matrix, 3)           # 分成3份
print(v_parts[0])                        # [[1 2 3 4]]
print(v_parts[1])                        # [[5 6 7 8]]
print(v_parts[2])                        # [[ 9 10 11 12]]
```

### 分割函数对比表

| 函数 | 用途 | 要求 |
|------|------|------|
| `split` | 平均分割 | 必须能整除 |
| `array_split` | 不平均分割 | 不要求整除 |
| `hsplit` | 水平分割（按列） | 必须能整除 |
| `vsplit` | 垂直分割（按行） | 必须能整除 |

---

## 4 排序

### sort

```python
import numpy as np

arr = np.array([3, 1, 4, 1, 5, 9, 2, 6])

# 升序排序（返回新数组）
sorted_arr = np.sort(arr)
print("排序后：", sorted_arr)            # [1 1 2 3 4 5 6 9]
print("原数组：", arr)                   # [3 1 4 1 5 9 2 6] 不变

# 降序排序
desc_arr = np.sort(arr)[::-1]
print("降序：", desc_arr)                # [9 6 5 4 3 2 1 1]

# 原地排序（修改原数组）
arr.sort()
print("原地排序后：", arr)               # [1 1 2 3 4 5 6 9]

# 二维数组排序
matrix = np.array([[3, 1, 2],
                   [6, 4, 5]])

# 按行排序
print("按行排序：")
print(np.sort(matrix, axis=1))
# [[1 2 3]
#  [4 5 6]]

# 按列排序
print("按列排序：")
print(np.sort(matrix, axis=0))
# [[3 1 2]
#  [6 4 5]]
```

### argsort

```python
import numpy as np

arr = np.array([3, 1, 4, 1, 5])

# argsort：返回排序后的索引
indices = np.argsort(arr)
print("排序索引：", indices)             # [1 3 0 2 4]

# 根据索引重新排列
sorted_arr = arr[indices]
print("排序后：", sorted_arr)            # [1 1 3 4 5]

# 降序排列
desc_indices = np.argsort(arr)[::-1]
desc_arr = arr[desc_indices]
print("降序：", desc_arr)                # [5 4 3 1 1]
```

> argsort 在需要知道排序前的位置时非常有用。

---

## 5 文件读写

### 保存和加载 .npy 文件

```python
import numpy as np

# 创建数组
arr = np.array([[1, 2, 3],
                [4, 5, 6]])

# 保存为 .npy 文件
np.save('my_array.npy', arr)

# 从 .npy 文件加载
loaded = np.load('my_array.npy')
print(loaded)
# [[1 2 3]
#  [4 5 6]]
```

### 保存和加载文本文件

```python
import numpy as np

# 创建数组
arr = np.array([[1, 2, 3],
                [4, 5, 6]])

# 保存为文本文件
np.savetxt('data.txt', arr, delimiter=',')  # 用逗号分隔

# 从文本文件加载
loaded = np.loadtxt('data.txt', delimiter=',')
print(loaded)
# [[1. 2. 3.]
#  [4. 5. 6.]]
```

### 文件读写函数对比表

| 函数 | 用途 | 文件格式 |
|------|------|----------|
| `np.save` | 保存数组 | .npy（二进制） |
| `np.load` | 加载数组 | .npy（二进制） |
| `np.savetxt` | 保存为文本 | .txt（文本） |
| `np.loadtxt` | 从文本加载 | .txt（文本） |

---

## 6 线性代数

### 逆矩阵

```python
import numpy as np

A = np.array([[1, 2],
              [3, 4]])

# 求逆矩阵
A_inv = np.linalg.inv(A)
print("逆矩阵：")
print(A_inv)
# [[-2.   1. ]
#  [ 1.5 -0.5]]

# 验证：A @ A_inv 应该等于单位矩阵
print("A @ A_inv =")
print(A @ A_inv)
# [[1. 0.]
#  [0. 1.]]
```

### 行列式

```python
import numpy as np

A = np.array([[1, 2],
              [3, 4]])

# 求行列式
det_A = np.linalg.det(A)
print("行列式：", det_A)                 # -2.0
```

### 特征值和特征向量

```python
import numpy as np

A = np.array([[1, 2],
              [2, 1]])

# 求特征值和特征向量
eigenvalues, eigenvectors = np.linalg.eig(A)

print("特征值：", eigenvalues)           # [ 3. -1.]
print("特征向量：")
print(eigenvectors)
# [[ 0.70710678 -0.70710678]
#  [ 0.70710678  0.70710678]]
```

### 线性代数函数对比表

| 函数 | 用途 | 示例 |
|------|------|------|
| `np.linalg.inv` | 逆矩阵 | `np.linalg.inv(A)` |
| `np.linalg.det` | 行列式 | `np.linalg.det(A)` |
| `np.linalg.eig` | 特征值分解 | `np.linalg.eig(A)` |
| `np.linalg.solve` | 解线性方程组 | `np.linalg.solve(A, b)` |

---

## 7 where 函数

### 条件选择

```python
import numpy as np

arr = np.array([1, -2, 3, -4, 5])

# where：条件选择
result = np.where(arr > 0, arr, 0)       # 大于0的保留，否则置0
print(result)                            # [1 0 3 0 5]

# 替换负数
result2 = np.where(arr < 0, -arr, arr)   # 负数取绝对值
print(result2)                           # [1 2 3 4 5]

# 二维数组
matrix = np.array([[1, -2, 3],
                   [-4, 5, -6]])
result3 = np.where(matrix > 0, matrix, 0)
print(result3)
# [[1 0 3]
#  [0 5 0]]
```

### 获取条件索引

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5, 6])

# where：返回满足条件的索引
indices = np.where(arr > 3)
print(indices)                           # (array([3, 4, 5]),)

# 根据索引获取元素
print(arr[indices])                      # [4 5 6]

# 二维数组
matrix = np.array([[1, 2, 3],
                   [4, 5, 6],
                   [7, 8, 9]])
rows, cols = np.where(matrix > 5)
print("行索引：", rows)                  # [1 2 2 2]
print("列索引：", cols)                  # [2 0 1 2]
print("满足条件的值：", matrix[rows, cols])  # [6 7 8 9]
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 拼接 | concatenate, vstack, hstack |
| 分割 | split, array_split, hsplit, vsplit |
| 排序 | sort, argsort |
| 文件读写 | save, load, savetxt, loadtxt |
| 线性代数 | inv, det, eig |
| 条件选择 | where |

---

## 9 新手常见误区

### 误区1："concatenate 的 axis 参数搞反了"

axis=0 和 axis=1 很容易搞混：

- `axis=0`：沿行方向拼接（垂直）
- `axis=1`：沿列方向拼接（水平）

```python
import numpy as np

m1 = np.array([[1, 2],
               [3, 4]])
m2 = np.array([[5, 6],
               [7, 8]])

# axis=0：垂直拼接
v = np.concatenate([m1, m2], axis=0)
print(v)
# [[1 2]
#  [3 4]
#  [5 6]
#  [7 8]]

# axis=1：水平拼接
h = np.concatenate([m1, m2], axis=1)
print(h)
# [[1 2 5 6]
#  [3 4 7 8]]
```

记忆技巧：axis=0 是"跨行"，axis=1 是"跨列"。

### 误区2："sort 会改变原数组"

不一定！取决于你怎么调用：

```python
import numpy as np

arr = np.array([3, 1, 4, 1, 5])

# np.sort()：返回新数组，原数组不变
sorted1 = np.sort(arr)
print("np.sort：", sorted1)              # [1 1 3 4 5]
print("原数组：", arr)                   # [3 1 4 1 5]

# arr.sort()：原地排序，修改原数组
arr.sort()
print("arr.sort：", arr)                 # [1 1 3 4 5]
```

### 误区3："split 和 array_split 是一样的"

不一样！关键区别在于是否要求整除：

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])

# split：要求能整除
# np.split(arr, 3)                       # 报错！5不能被3整除

# array_split：不要求整除
parts = np.array_split(arr, 3)
print(parts)                             # [array([1, 2]), array([3, 4]), array([5])]
```

### 误区4："save 和 savetxt 是一样的"

不一样！它们保存的格式不同：

- `np.save`：保存为二进制 .npy 文件，速度快，但不能直接用文本编辑器打开
- `np.savetxt`：保存为文本 .txt 文件，可以用文本编辑器打开

```python
import numpy as np

arr = np.array([1, 2, 3])

# 二进制格式
np.save('data.npy', arr)                 # 保存为二进制
loaded1 = np.load('data.npy')            # 加载二进制

# 文本格式
np.savetxt('data.txt', arr, delimiter=',')  # 保存为文本
loaded2 = np.loadtxt('data.txt', delimiter=',')  # 加载文本
```

### 误区5："where 只能用于条件选择"

不是！where 还可以用于获取索引：

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5, 6])

# 条件选择
result = np.where(arr > 3, arr, 0)
print(result)                            # [0 0 0 4 5 6]

# 获取索引
indices = np.where(arr > 3)
print(indices)                           # (array([3, 4, 5]),)
```

---

## 10 动手练习

### 练习1：基础练习

创建两个 2x2 的矩阵，然后：
- 垂直拼接它们
- 水平拼接它们
- 将拼接后的矩阵分割成原来的两个矩阵

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建矩阵
m1 = np.array([[1, 2],
               [3, 4]])
m2 = np.array([[5, 6],
               [7, 8]])

# 垂直拼接
v_stack = np.vstack([m1, m2])
print("垂直拼接：")
print(v_stack)
# [[1 2]
#  [3 4]
#  [5 6]
#  [7 8]]

# 水平拼接
h_stack = np.hstack([m1, m2])
print("水平拼接：")
print(h_stack)
# [[1 2 5 6]
#  [3 4 7 8]]

# 垂直分割
v_split = np.vsplit(v_stack, 2)
print("垂直分割：")
print(v_split[0])
print(v_split[1])

# 水平分割
h_split = np.hsplit(h_stack, 2)
print("水平分割：")
print(h_split[0])
print(h_split[1])
```

</details>

### 练习2：进阶练习

给定一个包含负数的数组，然后：
- 将所有负数替换为0
- 对数组排序
- 找出前5个最大的数

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建数组
arr = np.array([3, -1, 4, -2, 5, -3, 6, -4, 7])
print("原数组：", arr)

# 替换负数为0
arr[arr < 0] = 0
print("替换后：", arr)                   # [3 0 4 0 5 0 6 0 7]

# 排序
sorted_arr = np.sort(arr)
print("排序后：", sorted_arr)            # [0 0 0 0 3 4 5 6 7]

# 前5个最大的数
top5 = sorted_arr[-5:]
print("前5大：", top5)                   # [3 4 5 6 7]
```

</details>

### 练习3（挑战）：综合练习

实现一个简单的数据处理流程：
1. 生成一个 10x5 的随机矩阵（范围 0-100）
2. 将矩阵保存到文件
3. 从文件加载数据
4. 对每列进行归一化
5. 找出每列最大值所在的行
6. 将结果保存到新文件

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 1. 生成随机矩阵
np.random.seed(42)
data = np.random.randint(0, 101, size=(10, 5))
print("原始数据：")
print(data)

# 2. 保存到文件
np.save('raw_data.npy', data)

# 3. 从文件加载
loaded_data = np.load('raw_data.npy')

# 4. 归一化
data_min = loaded_data.min(axis=0)
data_max = loaded_data.max(axis=0)
normalized = (loaded_data - data_min) / (data_max - data_min)
print("归一化后：")
print(normalized)

# 5. 找出每列最大值所在的行
max_rows = normalized.argmax(axis=0)
print("每列最大值所在行：", max_rows)

# 6. 保存结果
np.save('processed_data.npy', normalized)
np.savetxt('max_rows.txt', max_rows, fmt='%d')

print("处理完成！")
```

</details>

---

## 下一章预告

恭喜你完成了 NumPy 基础部分的学习！下一章我们会开始学习 **Pandas**——Python 最强大的数据处理库。你会学到如何读取 CSV 文件、清洗数据、分组统计，这些是 AI 项目中必不可少的步骤。
