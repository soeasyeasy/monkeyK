---
title: "第2章：张量基础与操作"
description: "掌握 Tensor 创建、索引切片、维度变换、数学运算等核心操作"
---

# 第2章：张量基础与操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 张量到底是什么？和 NumPy 数组有什么区别？
- 如何创建不同形状的张量？
- 怎么对张量进行索引和切片？
- 维度变换是什么意思？什么时候用？

这一章就是为了解答这些问题。张量是 PyTorch 的基础，掌握张量操作是学习深度学习的第一步。

---

## 1 为什么需要张量？

### 痛点分析

想象一下你要处理数据：

**没有张量时**：用 Python 列表，计算慢，功能少。

**有张量后**：像有了瑞士军刀，各种操作一应俱全，还能用 GPU 加速。

### 张量 vs NumPy 数组

```python
import torch
import numpy as np

# NumPy 数组
np_array = np.array([1, 2, 3])

# PyTorch 张量
torch_tensor = torch.tensor([1, 2, 3])

# 看起来很像，但张量有这些额外功能：
# 1. GPU 加速
if torch.cuda.is_available():
    gpu_tensor = torch_tensor.cuda()  # 转移到 GPU

# 2. 自动求导
grad_tensor = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)

# 3. 与 NumPy 无缝转换
back_to_numpy = torch_tensor.numpy()
from_numpy = torch.from_numpy(np_array)
```

> **一句话总结**：张量 = NumPy 数组 + GPU 加速 + 自动求导。

---

## 2 核心原理

### 什么是张量？

张量是多维数组的通用表示：

- **标量**（0维张量）：单个数字，如 `5`
- **向量**（1维张量）：一列数字，如 `[1, 2, 3]`
- **矩阵**（2维张量）：二维表格，如 `[[1, 2], [3, 4]]`
- **高阶张量**（3维+）：如 RGB 图像是 3 维张量（高×宽×通道）

打个比方：

> 张量就像俄罗斯套娃，一层套一层，维度越高越复杂。

---

## 3 张量创建

### 基础创建方法

```python
import torch

# 1. 从 Python 列表创建
tensor_from_list = torch.tensor([1, 2, 3, 4])
print(f"从列表创建: {tensor_from_list}")

# 2. 创建全零张量
zeros = torch.zeros(2, 3)  # 2行3列
print(f"全零张量:\n{zeros}")

# 3. 创建全一张量
ones = torch.ones(3, 2)  # 3行2列
print(f"全一张量:\n{ones}")

# 4. 创建随机张量
rand_tensor = torch.rand(2, 2)  # 2x2，值在 [0, 1) 之间
print(f"随机张量:\n{rand_tensor}")

# 5. 创建正态分布张量
randn_tensor = torch.randn(3, 3)  # 3x3，标准正态分布
print(f"正态分布张量:\n{randn_tensor}")

# 6. 创建等差数列
arange_tensor = torch.arange(0, 10, 2)  # 从0到10，步长为2
print(f"等差数列: {arange_tensor}")

# 7. 创建线性等分
linspace_tensor = torch.linspace(0, 1, 5)  # 0到1之间5个数
print(f"线性等分: {linspace_tensor}")

# 8. 创建单位矩阵
eye_tensor = torch.eye(3)  # 3x3 单位矩阵
print(f"单位矩阵:\n{eye_tensor}")
```

### 指定数据类型

```python
import torch

# 默认是 float32
float_tensor = torch.tensor([1.0, 2.0, 3.0])
print(f"默认类型: {float_tensor.dtype}")  # torch.float32

# 指定为 int64
int_tensor = torch.tensor([1, 2, 3], dtype=torch.int64)
print(f"整数类型: {int_tensor.dtype}")  # torch.int64

# 指定为 float64（双精度）
double_tensor = torch.tensor([1.0, 2.0, 3.0], dtype=torch.float64)
print(f"双精度类型: {double_tensor.dtype}")  # torch.float64

# 类型转换
converted = float_tensor.to(torch.int32)
print(f"转换后类型: {converted.dtype}")  # torch.int32
```

---

## 4 张量属性

```python
import torch

# 创建一个 2x3x4 的张量
tensor = torch.randn(2, 3, 4)

# 基本属性
print(f"形状: {tensor.shape}")  # torch.Size([2, 3, 4])
print(f"维度数: {tensor.ndim}")  # 3
print(f"元素总数: {tensor.numel()}")  # 24
print(f"数据类型: {tensor.dtype}")  # torch.float32
print(f"设备: {tensor.device}")  # cpu
```

---

## 5 索引与切片

```python
import torch

# 创建一个 3x4 的张量
tensor = torch.arange(12).reshape(3, 4)
print(f"原始张量:\n{tensor}")
# tensor([[ 0,  1,  2,  3],
#         [ 4,  5,  6,  7],
#         [ 8,  9, 10, 11]])

# 1. 获取单个元素
element = tensor[1, 2]  # 第2行第3列（索引从0开始）
print(f"tensor[1, 2] = {element}")  # 6

# 2. 获取一行
row = tensor[1]  # 第2行
print(f"第2行: {row}")  # [4, 5, 6, 7]

# 3. 获取一列
col = tensor[:, 2]  # 所有行，第3列
print(f"第3列: {col}")  # [2, 6, 10]

# 4. 切片操作
sub_tensor = tensor[0:2, 1:3]  # 前2行，第2-3列
print(f"子张量:\n{sub_tensor}")
# [[1, 2],
#  [5, 6]]

# 5. 负索引
last_row = tensor[-1]  # 最后一行
print(f"最后一行: {last_row}")  # [8, 9, 10, 11]

# 6. 条件索引
mask = tensor > 5  # 创建布尔掩码
filtered = tensor[mask]  # 筛选大于5的元素
print(f"大于5的元素: {filtered}")  # [6, 7, 8, 9, 10, 11]
```

---

## 6 维度变换

```python
import torch

# 创建一个 2x3x4 的张量
tensor = torch.randn(2, 3, 4)
print(f"原始形状: {tensor.shape}")  # [2, 3, 4]

# 1. view() - 改变形状（不改变数据）
reshaped = tensor.view(2, 12)  # 变成 2x12
print(f"view 后形状: {reshaped.shape}")  # [2, 12]

# 2. reshape() - 更灵活的重塑
reshaped2 = tensor.reshape(6, 4)  # 变成 6x4
print(f"reshape 后形状: {reshaped2.shape}")  # [6, 4]

# 3. unsqueeze() - 增加维度
expanded = tensor.unsqueeze(0)  # 在第0维增加一个维度
print(f"unsqueeze 后形状: {expanded.shape}")  # [1, 2, 3, 4]

# 4. squeeze() - 删除值为1的维度
squeezed = expanded.squeeze(0)  # 删除第0维
print(f"squeeze 后形状: {squeezed.shape}")  # [2, 3, 4]

# 5. permute() - 交换维度
permuted = tensor.permute(2, 0, 1)  # 维度顺序变为 [4, 2, 3]
print(f"permute 后形状: {permuted.shape}")  # [4, 2, 3]

# 6. transpose() - 交换两个维度
transposed = tensor.transpose(0, 1)  # 交换第0维和第1维
print(f"transpose 后形状: {transposed.shape}")  # [3, 2, 4]
```

---

## 7 数学运算

### 基本运算

```python
import torch

a = torch.tensor([1.0, 2.0, 3.0])
b = torch.tensor([4.0, 5.0, 6.0])

# 逐元素运算
add = a + b  # 加法
sub = a - b  # 减法
mul = a * b  # 乘法
div = a / b  # 除法
pow_op = a ** 2  # 幂运算

print(f"加法: {add}")  # [5, 7, 9]
print(f"减法: {sub}")  # [-3, -3, -3]
print(f"乘法: {mul}")  # [4, 10, 18]
print(f"除法: {div}")  # [0.25, 0.4, 0.5]
print(f"幂运算: {pow_op}")  # [1, 4, 9]
```

### 矩阵运算

```python
import torch

# 创建矩阵
A = torch.tensor([[1, 2], [3, 4]])
B = torch.tensor([[5, 6], [7, 8]])

# 矩阵乘法
matmul = torch.matmul(A, B)  # 或 A @ B
print(f"矩阵乘法:\n{matmul}")
# [[19, 22],
#  [43, 50]]

# 矩阵转置
transpose = A.t()
print(f"转置:\n{transpose}")

# 矩阵求逆
inverse = torch.inverse(A.float())
print(f"逆矩阵:\n{inverse}")

# 行列式
det = torch.det(A.float())
print(f"行列式: {det}")  # -2
```

### 归约运算

```python
import torch

tensor = torch.tensor([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])

# 求和
total_sum = tensor.sum()  # 所有元素求和
print(f"总和: {total_sum}")  # 21.0

row_sum = tensor.sum(dim=0)  # 按行求和（每列的和）
print(f"按行求和: {row_sum}")  # [5, 7, 9]

col_sum = tensor.sum(dim=1)  # 按列求和（每行的和）
print(f"按列求和: {col_sum}")  # [6, 15]

# 平均值
mean = tensor.mean()
print(f"平均值: {mean}")  # 3.5

# 最大值/最小值
max_val = tensor.max()
min_val = tensor.min()
print(f"最大值: {max_val}, 最小值: {min_val}")

# 最大值的位置
max_idx = tensor.argmax()
print(f"最大值索引: {max_idx}")  # 5（展平后的索引）
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 张量创建 | tensor/zeros/ones/rand/randn/arange/linspace/eye |
| 张量属性 | shape/ndim/numel/dtype/device |
| 索引切片 | 支持类似 NumPy 的索引方式 |
| 维度变换 | view/reshape/unsqueeze/squeeze/permute/transpose |
| 数学运算 | 逐元素运算、矩阵运算、归约运算 |

---

## 9 新手常见误区

### 误区 1："view 和 reshape 完全一样"

**错！** view 要求内存连续，reshape 会自动处理。

正确做法：优先用 reshape，更灵活。

### 误区 2："张量操作会修改原张量"

不是的。大多数操作返回新张量，原张量不变。

正确做法：注意区分 in-place 操作（如 `add_()`）和普通操作。

### 误区 3："维度变换会改变数据"

实际上只是改变了数据的"视角"，数据本身没变。

正确做法：理解维度变换是重新解释数据布局。

---

## 10 动手练习

### 练习 1：基础练习

创建一个 4x4 的随机张量，提取其对角线元素。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 创建 4x4 随机张量
tensor = torch.randn(4, 4)
print(f"原始张量:\n{tensor}")

# 提取对角线
diagonal = torch.diag(tensor)
print(f"对角线元素: {diagonal}")

# 或者使用 diag 创建对角矩阵
diag_matrix = torch.diag(diagonal)
print(f"对角矩阵:\n{diag_matrix}")
```

</details>

### 练习 2：进阶练习

有两个张量 A (2x3) 和 B (3x2)，计算它们的矩阵乘法，并验证结果形状。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 创建张量
A = torch.randn(2, 3)
B = torch.randn(3, 2)

print(f"A 的形状: {A.shape}")
print(f"B 的形状: {B.shape}")

# 矩阵乘法
C = torch.matmul(A, B)
print(f"C 的形状: {C.shape}")  # 应该是 [2, 2]
print(f"结果:\n{C}")

# 验证：使用 @ 运算符
C_alt = A @ B
print(f"结果一致: {torch.allclose(C, C_alt)}")
```

</details>

### 练习 3（挑战）：综合练习

创建一个形状为 (2, 3, 4) 的张量，将其变换为 (6, 4)，再变换为 (2, 12)，最后恢复原始形状。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 创建原始张量
tensor = torch.randn(2, 3, 4)
print(f"原始形状: {tensor.shape}")  # [2, 3, 4]

# 变换为 (6, 4)
reshaped1 = tensor.reshape(6, 4)
print(f"第一次变换: {reshaped1.shape}")  # [6, 4]

# 变换为 (2, 12)
reshaped2 = reshaped1.reshape(2, 12)
print(f"第二次变换: {reshaped2.shape}")  # [2, 12]

# 恢复原始形状
restored = reshaped2.reshape(2, 3, 4)
print(f"恢复后形状: {restored.shape}")  # [2, 3, 4]

# 验证数据一致性
print(f"数据一致: {torch.equal(tensor, restored)}")
```

</details>

---

## 下一章预告

下一章我们会学习 **自动求导机制**——PyTorch 的核心功能。你会理解计算图、梯度计算、反向传播的原理，这是训练神经网络的基础。