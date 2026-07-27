---
title: "第2章：TensorFlow 基础"
description: "学习 TensorFlow 张量操作，掌握深度学习的数据结构"
---

# 第2章：TensorFlow 基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- TensorFlow 的张量和 NumPy 数组有什么区别？
- 如何创建和操作张量？
- 张量的维度变换有什么用？
- 如何在 GPU 上运行张量运算？

这一章就是为了解答这些问题。我们会先搞清楚 **张量的本质**，再动手实践各种操作。

---

## 1 为什么需要张量？

### 痛点分析

在深度学习中，我们需要处理各种数据：
- 一张图片：宽度 × 高度 × 颜色通道
- 一段文本：词数 × 词向量维度
- 一批数据：样本数 × 特征数

如果用普通 Python 列表，运算会很慢，而且不支持 GPU 加速。

### 解决方案

TensorFlow 的张量（Tensor）就是专门为深度学习设计的数据结构：

```python
# ❌ 用 Python 列表做矩阵乘法
def matrix_multiply(a, b):
    result = []
    for i in range(len(a)):
        row = []
        for j in range(len(b[0])):
            s = 0
            for k in range(len(b)):
                s += a[i][k] * b[k][j]
            row.append(s)
        result.append(row)
    return result

# ✅ 用 TensorFlow 张量
result = tf.matmul(a, b)  # 一行搞定，GPU 加速
```

> **一句话总结**：张量就是深度学习版的 NumPy 数组，支持 GPU 加速和自动求导。

---

## 2 核心原理

### 什么是张量？

打个比方：

> 张量就像一个多维的"储物柜"：
> - 0 维张量：一个格子（标量）
> - 1 维张量：一排格子（向量）
> - 2 维张量：一个表格（矩阵）
> - 3 维张量：一个立方体（如 RGB 图片）
> - n 维张量：更高维度的数据结构

### 张量的属性

每个张量都有这些属性：
- `shape`：每个维度有多少个元素
- `dtype`：数据类型（float32、int32 等）
- `rank`：维度数量
- `device`：在 CPU 还是 GPU 上

---

## 3 创建张量

### 从 Python 列表创建

```python
import tensorflow as tf

# 创建标量（0维）
scalar = tf.constant(5)
print(scalar)  # tf.Tensor(5, shape=(), dtype=int32)

# 创建向量（1维）
vector = tf.constant([1, 2, 3])
print(vector)  # tf.Tensor([1 2 3], shape=(3,), dtype=int32)

# 创建矩阵（2维）
matrix = tf.constant([[1, 2], [3, 4]])
print(matrix)
# tf.Tensor(
# [[1 2]
#  [3 4]], shape=(2, 2), dtype=int32)

# 创建 3 维张量
tensor_3d = tf.constant([
    [[1, 2], [3, 4]],
    [[5, 6], [7, 8]]
])
print(tensor_3d.shape)  # (2, 2, 2)
```

### 创建特殊张量

```python
# 全 0 张量
zeros = tf.zeros((3, 4))
print(zeros)
# [[0. 0. 0. 0.]
#  [0. 0. 0. 0.]
#  [0. 0. 0. 0.]]

# 全 1 张量
ones = tf.ones((2, 3))
print(ones)
# [[1. 1. 1.]
#  [1. 1. 1.]]

# 填充特定值
filled = tf.fill((2, 2), 9)
print(filled)
# [[9 9]
#  [9 9]]

# 创建序列
range_tensor = tf.range(5)
print(range_tensor)  # [0 1 2 3 4]

# 创建等差序列
linspace = tf.linspace(0.0, 1.0, 5)
print(linspace)  # [0.   0.25 0.5  0.75 1.  ]

# 随机张量
random_uniform = tf.random.uniform((2, 3), minval=0, maxval=1)
print(random_uniform)

random_normal = tf.random.normal((2, 3), mean=0.0, stddev=1.0)
print(random_normal)
```

---

## 4 张量运算

### 基本数学运算

```python
a = tf.constant([1, 2, 3])
b = tf.constant([4, 5, 6])

# 加法
add = tf.add(a, b)  # 或 a + b
print(add)  # [5 7 9]

# 减法
sub = tf.subtract(a, b)  # 或 a - b
print(sub)  # [-3 -3 -3]

# 乘法（对应元素相乘）
mul = tf.multiply(a, b)  # 或 a * b
print(mul)  # [4 10 18]

# 除法
div = tf.divide(a, b)  # 或 a / b
print(div)  # [0.25 0.4  0.5 ]

# 幂运算
pow = tf.pow(a, 2)  # 或 a ** 2
print(pow)  # [1 4 9]

# 平方根
sqrt = tf.sqrt(tf.cast(a, tf.float32))
print(sqrt)  # [1. 1.4142135 1.7320508]
```

### 矩阵运算

```python
# 矩阵乘法
a = tf.constant([[1, 2], [3, 4]])
b = tf.constant([[5, 6], [7, 8]])

matmul = tf.matmul(a, b)
print(matmul)
# [[19 22]
#  [43 50]]

# 矩阵转置
transpose = tf.transpose(a)
print(transpose)
# [[1 3]
#  [2 4]]

# 矩阵的迹（对角线元素之和）
trace = tf.linalg.trace(tf.cast(a, tf.float32))
print(trace)  # 5.0 (1+4)

# 行列式
det = tf.linalg.det(tf.cast(a, tf.float32))
print(det)  # -2.0
```

### 归约运算

```python
x = tf.constant([[1, 2, 3], [4, 5, 6]])

# 求和
sum_all = tf.reduce_sum(x)
print(sum_all)  # 21

# 按行求和
sum_rows = tf.reduce_sum(x, axis=1)
print(sum_rows)  # [6 15]

# 按列求和
sum_cols = tf.reduce_sum(x, axis=0)
print(sum_cols)  # [5 7 9]

# 求均值
mean = tf.reduce_mean(x)
print(mean)  # 3

# 求最大值
max_val = tf.reduce_max(x)
print(max_val)  # 6

# 求最小值
min_val = tf.reduce_min(x)
print(min_val)  # 1

# 求最大值的位置
argmax = tf.argmax(x, axis=1)
print(argmax)  # [2 2] (每行最大值的位置)
```

---

## 5 维度变换

### reshape

```python
x = tf.range(12)
print(x)  # [0 1 2 3 4 5 6 7 8 9 10 11]

# 变成 3x4 矩阵
reshaped = tf.reshape(x, (3, 4))
print(reshaped)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]

# 变成 2x2x3 张量
reshaped_3d = tf.reshape(x, (2, 2, 3))
print(reshaped_3d.shape)  # (2, 2, 3)

# -1 表示自动推断
reshaped_auto = tf.reshape(x, (3, -1))
print(reshaped_auto.shape)  # (3, 4)
```

### squeeze 和 expand_dims

```python
# 添加维度
x = tf.constant([1, 2, 3])
print(x.shape)  # (3,)

expanded = tf.expand_dims(x, axis=0)
print(expanded.shape)  # (1, 3)

expanded_2 = tf.expand_dims(x, axis=1)
print(expanded_2.shape)  # (3, 1)

# 删除维度
y = tf.constant([[[1, 2, 3]]])
print(y.shape)  # (1, 1, 3)

squeezed = tf.squeeze(y)
print(squeezed.shape)  # (3,)
```

### 拼接与分割

```python
# 拼接
a = tf.constant([[1, 2], [3, 4]])
b = tf.constant([[5, 6], [7, 8]])

# 按行拼接
concat_rows = tf.concat([a, b], axis=0)
print(concat_rows)
# [[1 2]
#  [3 4]
#  [5 6]
#  [7 8]]

# 按列拼接
concat_cols = tf.concat([a, b], axis=1)
print(concat_cols)
# [[1 2 5 6]
#  [3 4 7 8]]

# 堆叠（增加新维度）
stacked = tf.stack([a, b], axis=0)
print(stacked.shape)  # (2, 2, 2)

# 分割
x = tf.constant([[1, 2], [3, 4], [5, 6], [7, 8]])
split = tf.split(x, num_or_size_splits=2, axis=0)
print(len(split))  # 2
print(split[0])
# [[1 2]
#  [3 4]]
```

---

## 6 数据类型与转换

### 常用数据类型

| 类型 | 说明 | 用途 |
|------|------|------|
| `tf.float32` | 32位浮点数 | 默认类型，用于模型参数 |
| `tf.float64` | 64位浮点数 | 高精度计算 |
| `tf.int32` | 32位整数 | 索引、标签 |
| `tf.int64` | 64位整数 | 大整数 |
| `tf.bool` | 布尔值 | 掩码 |
| `tf.string` | 字符串 | 文本数据 |

### 类型转换

```python
x = tf.constant([1, 2, 3])
print(x.dtype)  # <dtype: 'int32'>

# 转换为 float32
x_float = tf.cast(x, tf.float32)
print(x_float)  # [1. 2. 3.]

# 转换为 int64
x_int64 = tf.cast(x, tf.int64)
print(x_int64.dtype)  # <dtype: 'int64'>

# 布尔转换
x_bool = tf.cast([0, 1, 2], tf.bool)
print(x_bool)  # [False True True]
```

---

## 7 GPU 加速

### 检查 GPU 是否可用

```python
import tensorflow as tf

# 检查 GPU
print("GPU Available: ", tf.config.list_physical_devices('GPU'))

# 查看张量所在设备
x = tf.constant([1, 2, 3])
print(x.device)  # 会显示 CPU 或 GPU 信息
```

### 在 GPU 上运行

```python
# 指定在 GPU 上运行
if tf.config.list_physical_devices('GPU'):
    with tf.device('/GPU:0'):
        x = tf.constant([1, 2, 3])
        y = tf.constant([4, 5, 6])
        z = tf.add(x, y)
        print(z.device)  # 显示 GPU 信息

# 指定在 CPU 上运行
with tf.device('/CPU:0'):
    x = tf.constant([1, 2, 3])
    print(x.device)  # 显示 CPU 信息
```

---

## 8 与 NumPy 的互操作

### TensorFlow 转 NumPy

```python
x = tf.constant([1, 2, 3])
x_numpy = x.numpy()
print(type(x_numpy))  # <class 'numpy.ndarray'>
print(x_numpy)  # [1 2 3]
```

### NumPy 转 TensorFlow

```python
import numpy as np

x_numpy = np.array([1, 2, 3])
x_tensor = tf.constant(x_numpy)
print(x_tensor)  # tf.Tensor([1 2 3], shape=(3,), dtype=int64)
```

> **注意**：转换时会复制数据，大数据集要注意内存。

---

## 9 新手常见误区

### 误区 1：张量是不可变的

**错！** TensorFlow 张量是不可变的，不能像列表那样修改。

```python
# ❌ 错误：不能直接修改张量
x = tf.constant([1, 2, 3])
x[0] = 10  # 报错！

# ✅ 正确：创建新张量
x = tf.constant([1, 2, 3])
x_new = tf.tensor_scalar_nd_update(x, [[0]], [10])
print(x_new)  # [10 2 3]
```

### 误区 2：忽略数据类型

**错！** 不同数据类型的张量不能直接运算。

```python
# ❌ 错误
a = tf.constant([1, 2, 3], dtype=tf.int32)
b = tf.constant([1.0, 2.0, 3.0], dtype=tf.float32)
c = a + b  # 报错！类型不匹配

# ✅ 正确
a = tf.constant([1, 2, 3], dtype=tf.int32)
b = tf.constant([1.0, 2.0, 3.0], dtype=tf.float32)
c = tf.cast(a, tf.float32) + b
print(c)  # [2. 4. 6.]
```

### 误区 3：reshape 不改变元素总数

**错！** reshape 后的元素总数必须和原来一样。

```python
# ❌ 错误
x = tf.range(12)
reshaped = tf.reshape(x, (3, 5))  # 报错！12 != 15

# ✅ 正确
x = tf.range(12)
reshaped = tf.reshape(x, (3, 4))  # 12 == 12
```

---

## 10 动手练习

### 练习 1：基础练习

**题目**：创建一个 3x3 的矩阵，计算它的转置和迹。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf

# 创建 3x3 矩阵
matrix = tf.constant([[1, 2, 3],
                      [4, 5, 6],
                      [7, 8, 9]])

# 转置
transpose = tf.transpose(matrix)
print("转置：")
print(transpose)

# 迹（需要转换为 float）
trace = tf.linalg.trace(tf.cast(matrix, tf.float32))
print(f"迹: {trace}")  # 1+5+9 = 15
```

</details>

### 练习 2：进阶练习

**题目**：实现两个矩阵的乘法，并验证结果。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf

# 创建两个矩阵
a = tf.constant([[1, 2], [3, 4]])
b = tf.constant([[5, 6], [7, 8]])

# 矩阵乘法
result = tf.matmul(a, b)
print("矩阵乘法结果：")
print(result)

# 手动验证
# [1*5+2*7, 1*6+2*8] = [19, 22]
# [3*5+4*7, 3*6+4*8] = [43, 50]

# 用 numpy 验证
import numpy as np
expected = np.matmul(a.numpy(), b.numpy())
print("验证结果：")
print(expected)
```

</details>

### 练习 3（挑战）：综合练习

**题目**：实现一个简单的线性变换 y = wx + b，其中 w、x、b 都是张量。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf

# 定义参数
w = tf.constant([[2.0, 0.0], [0.0, 3.0]])  # 2x2 权重矩阵
x = tf.constant([[1.0], [2.0]])  # 2x1 输入向量
b = tf.constant([[1.0], [1.0]])  # 2x1 偏置

# 线性变换
y = tf.matmul(w, x) + b
print("线性变换结果：")
print(y)
# [[3.0]  # 2*1 + 0*2 + 1 = 3
#  [7.0]] # 0*1 + 3*2 + 1 = 7

# 批量处理
x_batch = tf.constant([[1.0, 2.0, 3.0],
                       [2.0, 3.0, 4.0]])  # 2x3 批量输入

# 调整维度
x_batch_reshaped = tf.transpose(x_batch)  # 3x2
y_batch = tf.matmul(w, x_batch_reshaped) + b
print("批量处理结果：")
print(y_batch)
```

</details>

---

## 下一章预告

下一章我们会学习 **自动求导机制**——也就是 TensorFlow 如何自动计算梯度。你会学到：

- `tf.GradientTape` 如何记录运算
- 如何计算函数的梯度
- 如何手动实现梯度下降

准备好了吗？让我们进入自动求导的世界！
