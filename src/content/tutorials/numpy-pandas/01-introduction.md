---
title: "第1章：NumPy 简介与环境搭建"
description: "了解 NumPy 的核心价值，搭建开发环境"
---

# 第1章：NumPy 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- NumPy 是什么？听起来很高大上，难不难学？
- 我已经在用 Python 列表了，为什么还要学 NumPy？
- 安装 NumPy 会不会很麻烦？需要配置很多东西吗？
- 学完 NumPy 能做什么？对找工作有帮助吗？

这一章就是为了解答这些问题。我们会先搞清楚 NumPy 到底是什么，然后动手搭建环境，写出第一个 NumPy 程序。

---

## 1 为什么需要 NumPy？

### 痛点分析

假设你要计算 100 万个数字的平均值，用 Python 列表怎么做？

```python
# 用 Python 列表计算平均值
numbers = list(range(1000000))  # 创建100万个数字的列表
total = 0                        # 初始化总和为0
for n in numbers:                # 遍历每一个数字
    total += n                   # 累加到总和
average = total / len(numbers)   # 计算平均值
print(f"平均值：{average}")       # 输出结果
```

这段代码有什么问题？

- 需要写循环，代码啰嗦
- 运行速度慢，100万个数字要循环100万次
- 内存占用大，Python 列表里每个元素都是对象

### 生活化类比

打个比方：

> Python 列表就像手工记账本，你要一笔一笔地算，算到眼花。
> NumPy 就像电子表格软件，输入数据后，它自动帮你算好，又快又准。

再形象一点：

> 你要数1000颗豆子。
> Python 列表：一颗一颗数，数到手酸。
> NumPy：直接把豆子倒进机器里，几秒钟数完。

### 代码对比

看看同样的计算，用 NumPy 怎么写：

```python
import numpy as np                    # 导入 NumPy 库，习惯简写为 np

numbers = np.arange(1000000)          # 创建100万个数字的数组，一行搞定
average = numbers.mean()              # 直接调用 mean() 方法计算平均值
print(f"平均值：{average}")            # 输出结果
```

对比一下：

| 对比项 | Python 列表 | NumPy 数组 |
|--------|-------------|------------|
| 代码行数 | 5行 | 2行 |
| 运算速度 | 慢（需要循环） | 快（底层 C 语言实现） |
| 内存占用 | 大 | 小 |
| 可读性 | 一般 | 好 |

> 性能测试：计算100万个数字的平均值，NumPy 比 Python 列表快 100 倍以上。数据量越大，差距越明显。

---

## 2 NumPy 是什么？

### 概念解释

NumPy 是 Python 的一个第三方库，专门用于科学计算。它的核心是一个叫 ndarray（N-dimensional array，N维数组）的数据结构。

通俗地说：

> NumPy 就是 Python 的"数学加速器"，让数值计算变得又快又简单。

NumPy 的全称是 "Numerical Python"，意思是"数字化的 Python"。

### NumPy 在 AI 领域的地位

如果你想在 AI、数据科学、机器学习领域发展，NumPy 是必须掌握的基础。因为：

- Pandas（数据处理库）基于 NumPy 构建
- Scikit-learn（机器学习库）基于 NumPy 构建
- TensorFlow、PyTorch（深度学习库）都受 NumPy 影响
- Matplotlib（绘图库）需要 NumPy 配合使用

可以说：**不学 NumPy，就没法学 AI。**

---

## 3 环境搭建

### 安装 NumPy

安装 NumPy 非常简单，只需要一条命令：

```bash
pip install numpy
```

这条命令做了什么？

- pip 是 Python 的包管理工具
- install 是安装命令
- numpy 是要安装的库名

安装完成后，你会看到类似这样的提示：

```
Successfully installed numpy-1.24.3
```

### 验证安装

安装完成后，需要验证是否安装成功：

```python
import numpy as np              # 导入 NumPy，习惯简写为 np
print(np.__version__)           # 打印 NumPy 版本号
```

如果输出版本号（如 `1.24.3`），说明安装成功。

### 常见问题

**问题1：提示 "pip 不是内部或外部命令"**

原因：Python 没有添加到系统环境变量。

解决：重新安装 Python，勾选 "Add Python to PATH" 选项。

**问题2：安装速度慢**

解决：使用国内镜像源加速：

```bash
pip install numpy -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

## 4 第一个 NumPy 程序

让我们写一个完整的程序，感受 NumPy 的魅力：

```python
import numpy as np                          # 导入 NumPy 库

# 创建数组
arr = np.array([1, 2, 3, 4, 5])             # 从列表创建 NumPy 数组
print("数组：", arr)                         # 输出：[1 2 3 4 5]

# 基本运算
print("数组 + 10：", arr + 10)               # 输出：[11 12 13 14 15] 每个元素都加10
print("数组 * 2：", arr * 2)                 # 输出：[2 4 6 8 10] 每个元素都乘2

# 统计运算
print("总和：", arr.sum())                   # 输出：15 所有元素相加
print("平均值：", arr.mean())                # 输出：3.0 算术平均值
print("最大值：", arr.max())                 # 输出：5 最大的元素
print("最小值：", arr.min())                 # 输出：1 最小的元素
```

逐行解释：

- 第1行：导入 NumPy，`np` 是约定俗成的简写
- 第4行：用 `np.array()` 从 Python 列表创建数组
- 第7-8行：数组可以和标量（单个数字）直接运算，不需要循环
- 第11-14行：调用数组的方法计算统计量

> 注意：NumPy 数组的运算叫"向量化运算"，不需要写循环，直接对整个数组操作。

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| NumPy 是什么 | Python 科学计算的基础库 |
| 核心数据结构 | ndarray（N维数组） |
| 安装方式 | `pip install numpy` |
| 导入方式 | `import numpy as np` |
| 主要优势 | 运算速度快、代码简洁、内存占用小 |
| 应用领域 | AI、数据科学、机器学习、科学计算 |

---

## 6 新手常见误区

### 误区1："NumPy 只能做数学计算"

错！NumPy 不仅能做数学计算，还能：

- 处理图像（图像本质上是多维数组）
- 处理音频（音频也是数组）
- 做线性代数运算
- 做统计分析
- 作为其他库的基础

NumPy 是科学计算的"瑞士军刀"，应用范围非常广。

### 误区2："学 NumPy 需要很深的数学基础"

不需要！NumPy 的入门门槛很低。你只需要：

- 会基本的 Python 语法
- 理解数组的概念
- 知道加减乘除

高级功能确实需要数学知识，但入门阶段完全不需要。

### 误区3："NumPy 数组和 Python 列表差不多"

大错特错！虽然看起来都是"一堆数据"，但本质不同：

- Python 列表可以装不同类型的数据（整数、字符串、对象混着来）
- NumPy 数组只能装相同类型的数据（要么全是整数，要么全是浮点数）
- NumPy 数组的运算速度快得多（底层是 C 语言实现）
- NumPy 数组支持向量化运算，Python 列表不支持

### 误区4："安装 NumPy 很麻烦"

不难！一条 `pip install numpy` 就搞定。如果遇到问题，99% 是 Python 环境配置的问题，不是 NumPy 本身的问题。

---

## 7 动手练习

### 练习1：基础练习

安装 NumPy 并验证安装成功，打印出版本号。

<details>
<summary>点击查看答案</summary>

```python
# 导入 NumPy 库
import numpy as np

# 打印版本号
print("NumPy 版本：", np.__version__)

# 如果输出版本号（如 1.24.3），说明安装成功
```

</details>

### 练习2：进阶练习

创建一个包含 1 到 10 的 NumPy 数组，计算并打印：
- 数组的总和
- 数组的平均值
- 数组的最大值和最小值

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 创建数组
arr = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# 或者用 arange 创建
# arr = np.arange(1, 11)

# 计算总和
total = arr.sum()
print("总和：", total)  # 输出：55

# 计算平均值
average = arr.mean()
print("平均值：", average)  # 输出：5.5

# 最大值和最小值
max_val = arr.max()
min_val = arr.min()
print("最大值：", max_val)  # 输出：10
print("最小值：", min_val)  # 输出：1
```

</details>

### 练习3（挑战）：综合练习

用 NumPy 和 Python 列表分别计算 100 万个随机数的平均值，对比两者的运行时间。

提示：使用 `time` 模块计时，使用 `random` 模块生成随机数。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
import time
import random

# 生成100万个随机数
n = 1000000

# 方法1：用 Python 列表
start_time = time.time()                    # 记录开始时间
numbers_list = [random.random() for _ in range(n)]  # 生成随机数列表
total = 0                                   # 初始化总和
for num in numbers_list:                    # 遍历列表
    total += num                            # 累加
average = total / n                         # 计算平均值
list_time = time.time() - start_time        # 计算耗时
print(f"Python 列表耗时：{list_time:.4f} 秒")

# 方法2：用 NumPy
start_time = time.time()                    # 记录开始时间
numbers_array = np.random.random(n)         # 生成随机数数组
average = numbers_array.mean()              # 计算平均值
numpy_time = time.time() - start_time       # 计算耗时
print(f"NumPy 耗时：{numpy_time:.4f} 秒")

# 对比
print(f"NumPy 快了 {list_time / numpy_time:.1f} 倍")
```

</details>

---

## 下一章预告

下一章我们会学习 **NumPy 数组基础**——如何创建各种形状的数组，了解数组的属性，以及如何改变数组的形状。这些是 NumPy 的基本功，掌握了才能继续往下学。
