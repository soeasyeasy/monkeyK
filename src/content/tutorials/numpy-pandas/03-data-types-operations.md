---
title: "第3章：NumPy 数据类型与运算"
description: "掌握 NumPy 数据类型体系与各类运算"
---

# 第3章：NumPy 数据类型与运算

## 本章导读

在学这一章之前，你可能会有这些疑问：

- NumPy 有哪些数据类型？和 Python 的数据类型有什么区别？
- 数组之间的运算到底是怎么进行的？
- 统计函数（mean、sum、std）都是什么意思？
- 矩阵乘法和普通乘法有什么区别？

这一章就是为了解答这些问题。我们会从数据类型开始，逐步掌握各种运算方法。

---

## 1 为什么需要掌握数据类型与运算？

### 痛点分析

很多初学者在使用 NumPy 时，会遇到这些问题：

- 计算结果不对，原来是数据类型出了问题
- 整数除法得到整数，精度丢失
- 把 `*` 当矩阵乘法，结果完全错误
- 不知道怎么用统计函数分析数据

### 生活化类比

打个比方：

> 数据类型就像容器的规格。
> 小杯子装不下大水壶的水，int32 也装不下太大的数字。
> 选对数据类型，计算才能准确。

再形象一点：

> 运算就像做菜。
> 加减乘除是基本刀工，统计函数是调味料，矩阵运算是高级烹饪技巧。
> 掌握了这些，你才能做出各种美味的"数据大餐"。

### 代码对比

看看数据类型的重要性：

```python
import numpy as np

# 整数除法
a = np.array([1, 2, 3], dtype=int)
b = np.array([2, 2, 2], dtype=int)
print(a / b)                             # 输出：[0.5 1.  1.5]（自动转为浮点数）

# 如果强制用整数，会丢失精度
c = np.array([1, 2, 3], dtype=np.int32)
d = np.array([2, 2, 2], dtype=np.int32)
# print(c // d)                          # 整数除法：[0 1 1]（精度丢失）
```

> 选对数据类型，才能避免精度丢失的问题。

---

## 2 NumPy 数据类型

### 常用数据类型

```python
import numpy as np

# 整数类型
int32_arr = np.array([1, 2, 3], dtype=np.int32)    # 32位整数
int64_arr = np.array([1, 2, 3], dtype=np.int64)    # 64位整数
print("int32：", int32_arr.dtype)                   # 输出：int32
print("int64：", int64_arr.dtype)                   # 输出：int64

# 浮点数类型
float32_arr = np.array([1.0, 2.0, 3.0], dtype=np.float32)  # 32位浮点数
float64_arr = np.array([1.0, 2.0, 3.0], dtype=np.float64)  # 64位浮点数
print("float32：", float32_arr.dtype)                     # 输出：float32
print("float64：", float64_arr.dtype)                     # 输出：float64

# 布尔类型
bool_arr = np.array([True, False, True], dtype=bool)
print("bool：", bool_arr.dtype)                           # 输出：bool

# 复数类型
complex_arr = np.array([1+2j, 3+4j], dtype=complex)
print("complex：", complex_arr.dtype)                     # 输出：complex128

# 字符串类型
str_arr = np.array(['a', 'b', 'c'], dtype='U1')         # U1表示1个Unicode字符
print("string：", str_arr.dtype)                          # 输出：<U1
```

### 数据类型对比表

| 类型 | 说明 | 占用字节 | 示例 |
|------|------|----------|------|
| `int8` | 8位整数 | 1 | -128 到 127 |
| `int16` | 16位整数 | 2 | -32768 到 32767 |
| `int32` | 32位整数 | 4 | -2^31 到 2^31-1 |
| `int64` | 64位整数 | 8 | -2^63 到 2^63-1 |
| `float32` | 32位浮点数 | 4 | 约7位有效数字 |
| `float64` | 64位浮点数 | 8 | 约15位有效数字 |
| `bool` | 布尔类型 | 1 | True 或 False |
| `complex64` | 64位复数 | 8 | 实部+虚部各32位 |
| `complex128` | 128位复数 | 16 | 实部+虚部各64位 |

---

## 3 类型转换

### astype 方法

```python
import numpy as np

# 整数转浮点数
arr_int = np.array([1, 2, 3])
arr_float = arr_int.astype(float)          # 转换为浮点型
print("整数：", arr_int)                   # 输出：[1 2 3]
print("浮点数：", arr_float)               # 输出：[1. 2. 3.]

# 浮点数转整数（会截断小数）
arr_float = np.array([1.7, 2.9, 3.1])
arr_int = arr_float.astype(int)            # 转换为整数
print("浮点数：", arr_float)               # 输出：[1.7 2.9 3.1]
print("整数：", arr_int)                   # 输出：[1 2 3]（小数部分被截断）

# 数值转布尔
arr_num = np.array([0, 1, 2, -1])
arr_bool = arr_num.astype(bool)            # 转换为布尔型
print("数值：", arr_num)                   # 输出：[ 0  1  2 -1]
print("布尔：", arr_bool)                  # 输出：[False  True  True  True]（0为False，其他为True）

# 布尔转数值
arr_bool = np.array([True, False, True])
arr_num = arr_bool.astype(int)             # 转换为整数
print("布尔：", arr_bool)                  # 输出：[ True False  True]
print("数值：", arr_num)                   # 输出：[1 0 1]（True为1，False为0）
```

> 注意：astype 返回新数组，不会修改原数组。

---

## 4 算术运算

### 逐元素运算

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

# 加法
print("a + b =", a + b)                   # 输出：[5 7 9] 对应元素相加

# 减法
print("a - b =", a - b)                   # 输出：[-3 -3 -3] 对应元素相减

# 乘法
print("a * b =", a * b)                   # 输出：[4 10 18] 对应元素相乘

# 除法
print("a / b =", a / b)                   # 输出：[0.25 0.4 0.5] 对应元素相除

# 幂运算
print("a ** 2 =", a ** 2)                 # 输出：[1 4 9] 每个元素的平方

# 取模
print("b % a =", b % a)                   # 输出：[0 1 0] 对应元素取模
```

> 所有运算都是逐元素进行的，不需要写循环。

### 标量运算

```python
import numpy as np

arr = np.array([1, 2, 3])

# 标量加法
print("arr + 10 =", arr + 10)             # 输出：[11 12 13] 每个元素加10

# 标量乘法
print("arr * 2 =", arr * 2)               # 输出：[2 4 6] 每个元素乘2

# 标量除法
print("arr / 2 =", arr / 2)               # 输出：[0.5 1. 1.5] 每个元素除2
```

> 标量和数组运算时，标量会自动"广播"到每个元素。

---

## 5 统计函数

### 常用统计函数

```python
import numpy as np

data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# 求和
print("总和：", data.sum())               # 输出：55

# 平均值
print("平均值：", data.mean())            # 输出：5.5

# 标准差
print("标准差：", data.std())             # 输出：2.87

# 方差
print("方差：", data.var())               # 输出：8.25

# 最大值
print("最大值：", data.max())             # 输出：10

# 最小值
print("最小值：", data.min())             # 输出：1

# 最大值的索引
print("最大值索引：", data.argmax())       # 输出：9

# 最小值的索引
print("最小值索引：", data.argmin())       # 输出：0

# 中位数
print("中位数：", np.median(data))        # 输出：5.5

# 累积和
print("累积和：", np.cumsum(data))        # 输出：[1 3 6 10 15 21 28 36 45 55]
```

### 二维数组的统计

```python
import numpy as np

matrix = np.array([[1, 2, 3],
                   [4, 5, 6]])

# 全局统计
print("总和：", matrix.sum())             # 输出：21
print("平均值：", matrix.mean())          # 输出：3.5

# 按行统计（axis=1）
print("每行总和：", matrix.sum(axis=1))   # 输出：[6 15]
print("每行平均值：", matrix.mean(axis=1)) # 输出：[2. 5.]

# 按列统计（axis=0）
print("每列总和：", matrix.sum(axis=0))   # 输出：[5 7 9]
print("每列平均值：", matrix.mean(axis=0)) # 输出：[2.5 3.5 4.5]
```

> axis=0 表示按列计算，axis=1 表示按行计算。

### 统计函数对比表

| 函数 | 说明 | 示例 |
|------|------|------|
| `sum()` | 求和 | `arr.sum()` |
| `mean()` | 平均值 | `arr.mean()` |
| `std()` | 标准差 | `arr.std()` |
| `var()` | 方差 | `arr.var()` |
| `max()` | 最大值 | `arr.max()` |
| `min()` | 最小值 | `arr.min()` |
| `argmax()` | 最大值索引 | `arr.argmax()` |
| `argmin()` | 最小值索引 | `arr.argmin()` |
| `median()` | 中位数 | `np.median(arr)` |
| `cumsum()` | 累积和 | `np.cumsum(arr)` |

---

## 6 矩阵运算

### 矩阵乘法

```python
import numpy as np

A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

# 方法1：使用 @ 运算符（推荐）
C1 = A @ B
print("A @ B =")
print(C1)
# [[19 22]
#  [43 50]]

# 方法2：使用 dot 函数
C2 = np.dot(A, B)
print("np.dot(A, B) =")
print(C2)
# [[19 22]
#  [43 50]]

# 方法3：使用 dot 方法
C3 = A.dot(B)
print("A.dot(B) =")
print(C3)
# [[19 22]
#  [43 50]]
```

> 三种方法结果相同，推荐使用 `@` 运算符，最简洁。

### 逐元素乘法 vs 矩阵乘法

```python
import numpy as np

A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

# 逐元素乘法（对应元素相乘）
print("A * B =")
print(A * B)
# [[ 5 12]
#  [21 32]]

# 矩阵乘法（点积）
print("A @ B =")
print(A @ B)
# [[19 22]
#  [43 50]]
```

区别：

- `*`：逐元素相乘，对应位置相乘
- `@` 或 `dot()`：矩阵乘法，行乘列求和

### 转置

```python
import numpy as np

A = np.array([[1, 2, 3],
              [4, 5, 6]])

# 转置：行变列，列变行
print("A =")
print(A)
# [[1 2 3]
#  [4 5 6]]

print("A.T =")
print(A.T)
# [[1 4]
#  [2 5]
#  [3 6]]
```

### 其他矩阵运算

```python
import numpy as np

A = np.array([[1, 2],
              [3, 4]])

# 逆矩阵
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

# 行列式
det_A = np.linalg.det(A)
print("行列式：", det_A)                 # 输出：-2.0

# 特征值和特征向量
eigenvalues, eigenvectors = np.linalg.eig(A)
print("特征值：", eigenvalues)           # 输出：[-0.37228132  5.37228132]
print("特征向量：")
print(eigenvectors)
```

---

## 7 逐元素运算 vs 矩阵运算

### 对比说明

| 运算类型 | 符号 | 说明 | 示例 |
|----------|------|------|------|
| 逐元素加法 | `+` | 对应元素相加 | `A + B` |
| 逐元素乘法 | `*` | 对应元素相乘 | `A * B` |
| 矩阵乘法 | `@` 或 `dot()` | 行乘列求和 | `A @ B` |
| 标量乘法 | `*` | 每个元素乘标量 | `A * 2` |

### 代码对比

```python
import numpy as np

A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

# 逐元素运算
print("A + B =")
print(A + B)                             # [[6 8] [10 12]]

print("A * B =")
print(A * B)                             # [[5 12] [21 32]]

# 矩阵运算
print("A @ B =")
print(A @ B)                             # [[19 22] [43 50]]
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 数据类型 | int, float, bool, complex, str |
| 类型转换 | astype() 方法 |
| 算术运算 | +, -, *, /, **, %（逐元素） |
| 统计函数 | sum, mean, std, var, max, min |
| 矩阵乘法 | @ 或 dot() |
| 转置 | T 属性 |
| 逆矩阵 | np.linalg.inv() |

---

## 9 新手常见误区

### 误区1："把 * 当矩阵乘法"

错！`*` 是逐元素相乘，矩阵乘法要用 `@` 或 `dot()`：

```python
import numpy as np

A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

# 错误理解
print(A * B)                             # 逐元素相乘
# [[ 5 12]
#  [21 32]]

# 正确做法
print(A @ B)                             # 矩阵乘法
# [[19 22]
#  [43 50]]
```

### 误区2："忽略 dtype 导致精度丢失"

整数除法会自动转为浮点数，但强制转换会丢失精度：

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([2, 2, 2])

# 正常除法（自动转浮点数）
print(a / b)                             # [0.5 1.  1.5]

# 整数除法（截断小数）
print(a // b)                            # [0 1 1]（精度丢失）
```

### 误区3："axis 参数搞反了"

axis=0 和 axis=1 很容易搞混：

- `axis=0`：按列计算（纵向）
- `axis=1`：按行计算（横向）

```python
import numpy as np

matrix = np.array([[1, 2, 3],
                   [4, 5, 6]])

# axis=0：按列计算
print("每列总和：", matrix.sum(axis=0))   # [5 7 9]

# axis=1：按行计算
print("每行总和：", matrix.sum(axis=1))   # [6 15]
```

记忆技巧：axis=0 是"跨行"操作，axis=1 是"跨列"操作。

### 误区4："统计函数会修改原数组"

不会！统计函数只是计算，不会修改原数组：

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])
mean_val = arr.mean()                    # 计算平均值

print("原数组：", arr)                   # [1 2 3 4 5]（不变）
print("平均值：", mean_val)              # 3.0
```

### 误区5："所有运算都返回新数组"

不一定！有些运算返回视图，有些返回副本：

- 算术运算（+, -, *, /）：返回新数组
- 切片：返回视图
- 统计函数：返回标量值

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

# 算术运算返回新数组
c = a + b
print(c)                                 # [5 7 9]
c[0] = 100
print(a)                                 # [1 2 3]（a不变）
```

---

## 10 动手练习

### 练习1：基础练习

创建一个包含 1 到 100 的数组，计算：
- 总和
- 平均值
- 标准差
- 最大值和最小值

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建数组
arr = np.arange(1, 101)                  # 1到100

# 计算统计量
print("总和：", arr.sum())               # 5050
print("平均值：", arr.mean())            # 50.5
print("标准差：", arr.std())             # 28.87
print("最大值：", arr.max())             # 100
print("最小值：", arr.min())             # 1
```

</details>

### 练习2：进阶练习

给定两个矩阵 A 和 B，计算：
- A + B（逐元素加法）
- A * B（逐元素乘法）
- A @ B（矩阵乘法）
- A 的转置

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
```

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

# 逐元素加法
print("A + B =")
print(A + B)
# [[ 6  8]
#  [10 12]]

# 逐元素乘法
print("A * B =")
print(A * B)
# [[ 5 12]
#  [21 32]]

# 矩阵乘法
print("A @ B =")
print(A @ B)
# [[19 22]
#  [43 50]]

# 转置
print("A.T =")
print(A.T)
# [[1 3]
#  [2 4]]
```

</details>

### 练习3（挑战）：综合练习

创建一个 4x4 的随机矩阵（范围 0-100），然后：
1. 计算每行的平均值
2. 找出每行平均值最大的那一行
3. 计算整个矩阵的相关系数矩阵

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建随机矩阵
np.random.seed(42)
matrix = np.random.randint(0, 101, size=(4, 4))
print("随机矩阵：")
print(matrix)

# 1. 每行的平均值
row_means = matrix.mean(axis=1)
print("每行平均值：", row_means)

# 2. 找出平均值最大的行
max_row_idx = row_means.argmax()
print(f"平均值最大的行索引：{max_row_idx}")
print(f"该行数据：{matrix[max_row_idx]}")

# 3. 相关系数矩阵
corr_matrix = np.corrcoef(matrix)
print("相关系数矩阵：")
print(corr_matrix)
```

</details>

---

## 下一章预告

下一章我们会学习 **NumPy 索引与切片**——如何访问和修改数组中的元素，如何进行条件筛选。这些是数据处理的基础操作，掌握了才能灵活操作数据。
