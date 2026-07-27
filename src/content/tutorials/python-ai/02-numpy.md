---
title: "第2章：NumPy 数值计算"
description: "掌握 NumPy 数组、矩阵运算和广播机制"
---

# 第2章：NumPy 数值计算

## 本章导读

在学这一章之前，你可能会有这些疑问：

- NumPy 是什么？为什么 AI 都要用它？
- NumPy 数组和 Python 列表有什么区别？
- 什么是广播机制？
- 如何进行矩阵运算？

这一章就是为了解答这些问题。NumPy 是 AI 的"计算器"，所有 AI 库都建立在它之上。

---

## 1 为什么需要 NumPy？

### 痛点分析

假设你要计算 100 万个数字的平均值：

```python
# ❌ 用 Python 列表：慢
numbers = list(range(1000000))
total = 0
for n in numbers:
    total += n
average = total / len(numbers)  # 需要循环，很慢
```

```python
# ✅ 用 NumPy：快 100 倍
import numpy as np
numbers = np.arange(1000000)
average = numbers.mean()  # 一行搞定，底层是 C 语言实现
```

> **一句话总结**：NumPy 让数值计算快如闪电。

### 生活化类比

打个比方：

> Python 列表就像你用手指数数，NumPy 就像用计算器。
> 数据量越大，NumPy 的优势越明显。

---

## 2 核心原理：ndarray

### 概念解释

NumPy 的核心是 **ndarray**（N-dimensional array，N 维数组）。

```
Python 列表：[1, 2, 3]         → 可以装不同类型的数据
NumPy 数组：np.array([1,2,3])  → 只能装相同类型，但运算更快
```

| 特性 | Python 列表 | NumPy 数组 |
| --- | --- | --- |
| 数据类型 | 可以混合 | 必须相同 |
| 运算速度 | 慢 | 快（C 语言实现） |
| 内存占用 | 大 | 小 |
| 支持向量化 | 否 | 是 |
| 适合场景 | 通用编程 | 数值计算 |

---

## 3 基础用法

### 创建数组

```python
import numpy as np

# 从列表创建
arr = np.array([1, 2, 3, 4, 5])  # 一维数组
print(arr)  # [1 2 3 4 5]

# 创建特殊数组
zeros = np.zeros(5)           # [0. 0. 0. 0. 0.] 5个0
ones = np.ones(3)             # [1. 1. 1.] 3个1
range_arr = np.arange(0, 10, 2)  # [0 2 4 6 8] 步长为2
linspace = np.linspace(0, 1, 5)  # [0. 0.25 0.5 0.75 1.] 均匀5个点

# 二维数组（矩阵）
matrix = np.array([[1, 2, 3],
                   [4, 5, 6]])
print(matrix.shape)  # (2, 3) 2行3列
```

### 数组运算

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

# ✅ 向量化运算（不需要循环）
print(a + b)      # [5 7 9] 对应元素相加
print(a * b)      # [4 10 18] 对应元素相乘
print(a * 2)      # [2 4 6] 标量乘法
print(np.dot(a, b))  # 32 点积（内积）

# ❌ 错误写法（用循环，慢）
result = []
for i in range(len(a)):
    result.append(a[i] + b[i])
```

> **原理**：向量化运算底层是 C 语言实现的，比 Python 循环快 100 倍以上。

---

## 4 进阶用法

### 广播机制

广播（Broadcasting）是 NumPy 最强大的特性之一：

```python
import numpy as np

# 标量 + 数组
a = np.array([1, 2, 3])
print(a + 10)  # [11 12 13] 10 被"广播"到每个元素

# 不同形状的数组运算
matrix = np.array([[1, 2, 3],
                   [4, 5, 6]])  # 形状 (2, 3)
vector = np.array([10, 20, 30])  # 形状 (3,)

# 广播规则：从右往左比较维度，相同或一方为1则可以广播
result = matrix + vector  # vector 被广播到每一行
print(result)
# [[11 22 33]
#  [14 25 36]]
```

### 矩阵运算

```python
import numpy as np

# 创建矩阵
A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

# 矩阵乘法（点积）
C = np.dot(A, B)  # 或 A @ B
print(C)
# [[19 22]
#  [43 50]]

# 转置
print(A.T)
# [[1 3]
#  [2 4]]

# 逆矩阵
A_inv = np.linalg.inv(A)
print(A_inv)
# [[-2.   1. ]
#  [ 1.5 -0.5]]

# 特征值分解
eigenvalues, eigenvectors = np.linalg.eig(A)
print("特征值:", eigenvalues)
print("特征向量:", eigenvectors)
```

### 统计运算

```python
import numpy as np

data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

print("均值:", data.mean())        # 5.5
print("中位数:", np.median(data))  # 5.5
print("标准差:", data.std())       # 2.87
print("最大值:", data.max())       # 10
print("最小值:", data.min())       # 1
print("求和:", data.sum())         # 55

# 二维数组的统计
matrix = np.array([[1, 2, 3],
                   [4, 5, 6]])
print("每列均值:", matrix.mean(axis=0))  # [2.5 3.5 4.5]
print("每行均值:", matrix.mean(axis=1))  # [2. 5.]
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| ndarray | NumPy 核心数据结构，同构多维数组 |
| 向量化运算 | 不需要循环，直接对整个数组运算 |
| 广播机制 | 不同形状数组自动扩展进行运算 |
| 矩阵运算 | dot、@、转置、逆矩阵、特征值 |
| 统计函数 | mean、median、std、max、min、sum |

---

## 6 新手常见误区

### 误区 1："NumPy 数组和列表可以混用"

**错！** NumPy 数组要求所有元素类型相同，否则会自动转换：

```python
# ❌ 错误理解
arr = np.array([1, '2', 3])  # 全部变成字符串 ['1' '2' '3']

# ✅ 正确做法
arr = np.array([1, 2, 3], dtype=float)  # 明确指定类型
```

### 误区 2："* 就是矩阵乘法"

不是的。`*` 是对应元素相乘，矩阵乘法要用 `@` 或 `np.dot()`：

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print(A * B)    # 对应元素相乘 [[5 12] [21 32]]
print(A @ B)    # 矩阵乘法 [[19 22] [43 50]]
```

### 误区 3："修改视图不影响原数组"

NumPy 的切片是视图，修改会影响原数组：

```python
a = np.array([1, 2, 3, 4, 5])
b = a[1:3]  # b 是 a 的视图
b[0] = 100
print(a)  # [1 100 3 4 5] a 也被修改了！

# ✅ 正确做法：用 copy()
b = a[1:3].copy()
b[0] = 100
print(a)  # [1 2 3 4 5] a 不受影响
```

---

## 7 动手练习

### 练习 1：基础练习

创建一个 3x3 的单位矩阵（对角线为 1，其余为 0）。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 方法1：使用 eye
I = np.eye(3)
print(I)
# [[1. 0. 0.]
#  [0. 1. 0.]
#  [0. 0. 1.]]

# 方法2：使用 identity
I2 = np.identity(3)
print(I2)
```

</details>

### 练习 2：进阶练习

给定两个矩阵 A 和 B，计算 A × B 和 A + B。

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
```

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

# 矩阵乘法
C = A @ B  # 或 np.dot(A, B)
print("A × B =")
print(C)
# [[19 22]
#  [43 50]]

# 矩阵加法
D = A + B
print("A + B =")
print(D)
# [[ 6  8]
#  [10 12]]
```

</details>

### 练习 3（挑战）：综合练习

用 NumPy 实现一个简单的线性回归：给定数据点 (1,2), (2,4), (3,6)，求 y = ax + b 中的 a 和 b。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 数据点
x = np.array([1, 2, 3])
y = np.array([2, 4, 6])

# 最小二乘法求解
# 构造设计矩阵 X = [[x1, 1], [x2, 1], [x3, 1]]
X = np.column_stack([x, np.ones(len(x))])
print("设计矩阵 X:")
print(X)

# 正规方程：θ = (X^T X)^(-1) X^T y
theta = np.linalg.inv(X.T @ X) @ X.T @ y
a, b = theta

print(f"线性方程：y = {a:.2f}x + {b:.2f}")
# 输出：y = 2.00x + 0.00

# 验证
predictions = X @ theta
print("预测值:", predictions)  # [2. 4. 6.]
```

</details>

---

## 下一章预告

下一章我们会学习 **Pandas**——Python 的数据处理神器。你会学到如何读取 CSV 文件、清洗数据、分组统计，这些是 AI 项目中必不可少的步骤。
