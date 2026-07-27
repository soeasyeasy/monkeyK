---
title: "第1章：PyTorch 简介与环境搭建"
description: "了解 PyTorch 发展历程，掌握环境配置方法，完成第一个 PyTorch 程序"
---

# 第1章：PyTorch 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- PyTorch 是什么？和 TensorFlow 有什么区别？
- 为什么要学 PyTorch 而不是其他框架？
- 环境搭建会不会很复杂？需要什么硬件？
- 第一个 PyTorch 程序长什么样？

这一章就是为了解答这些问题。我们会先搞清楚 **PyTorch 的核心价值**，再动手搭建环境，最后写出你的第一个深度学习程序。

---

## 1 为什么需要 PyTorch？

### 痛点分析

想象一下你要盖房子：

**没有框架时**：你需要自己烧砖、和水泥、锯木头，每个环节都要从零开始。

**有框架时**：就像有了预制构件，直接拼装就行，专注设计房子本身。

在深度学习领域，PyTorch 就是那个"预制构件工厂"。

### 传统深度学习开发的痛点

```python
# 没有 PyTorch 时，你需要手动做这些
import numpy as np

# 手动实现前向传播
def forward(x, weights):
    return np.dot(x, weights)

# 手动实现反向传播
def backward(x, grad_output):
    return np.dot(x.T, grad_output)

# 手动计算梯度
def compute_gradient(loss, weights):
    # 复杂的数学公式...
    pass

# 手动更新参数
weights = weights - learning_rate * gradient
```

### PyTorch 的解决方案

```python
import torch
import torch.nn as nn

# 定义模型（就像搭积木）
model = nn.Linear(10, 1)  # 一个线性层

# 定义损失函数
criterion = nn.MSELoss()

# 定义优化器
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

# 前向传播（自动完成）
output = model(input_data)

# 计算损失
loss = criterion(output, target)

# 反向传播（自动完成）
loss.backward()

# 更新参数（自动完成）
optimizer.step()
```

> **一句话总结**：PyTorch 帮你处理了所有数学计算，你只需要专注模型设计。

---

## 2 核心原理

### 什么是 PyTorch？

PyTorch 是一个开源的深度学习框架，由 Facebook 开发。它的核心特点：

1. **动态计算图**：代码怎么写，图就怎么建（像写普通 Python 代码）
2. **直观易用**：Python 风格，调试方便
3. **GPU 加速**：一行代码切换到 GPU 训练
4. **生态丰富**：大量预训练模型和工具

打个比方：

> PyTorch 就像乐高积木，每个模块都是现成的，你只需要发挥创意拼装就行。

### PyTorch vs TensorFlow

| 特性 | PyTorch | TensorFlow |
| --- | --- | --- |
| 计算图 | 动态图（运行时构建） | 静态图（编译时构建） |
| 调试 | 容易（像调试普通 Python） | 较难（需要特殊工具） |
| 学习曲线 | 平缓（Python 风格） | 较陡（概念多） |
| 研究友好 | 非常适合 | 一般 |
| 生产部署 | 需要额外工具 | 原生支持好 |
| 社区 | 研究界主流 | 工业界主流 |

> **选择建议**：做研究、学习选 PyTorch；做移动端部署可以考虑 TensorFlow。

---

## 3 环境搭建

### 系统要求

- Python 3.8+
- 操作系统：Windows / Linux / macOS
- GPU（可选但推荐）：NVIDIA GPU + CUDA

### 安装步骤

#### 方式一：pip 安装（推荐）

```bash
# 1. 创建虚拟环境（推荐）
python -m venv pytorch-env

# 2. 激活虚拟环境
# Windows:
pytorch-env\Scripts\activate
# Linux/Mac:
source pytorch-env/bin/activate

# 3. 安装 PyTorch
# CPU 版本（没有 GPU 或不想用 GPU）
pip install torch torchvision torchaudio

# GPU 版本（有 NVIDIA GPU）
# 访问 https://pytorch.org/get-started/locally/ 获取对应 CUDA 版本的命令
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 方式二：conda 安装

```bash
# 1. 创建 conda 环境
conda create -n pytorch-env python=3.10

# 2. 激活环境
conda activate pytorch-env

# 3. 安装 PyTorch
# CPU 版本
conda install pytorch torchvision torchaudio cpuonly -c pytorch

# GPU 版本（CUDA 11.8）
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia
```

### 验证安装

```python
import torch

# 查看 PyTorch 版本
print(f"PyTorch 版本: {torch.__version__}")

# 检查 CUDA 是否可用
print(f"CUDA 可用: {torch.cuda.is_available()}")

# 如果有 GPU，查看 GPU 信息
if torch.cuda.is_available():
    print(f"GPU 设备: {torch.cuda.get_device_name(0)}")
    print(f"GPU 数量: {torch.cuda.device_count()}")
```

---

## 4 第一个 PyTorch 程序

### 示例：简单的张量运算

```python
import torch  # 导入 PyTorch 库

# 创建一个张量（类似 NumPy 的数组）
x = torch.tensor([1.0, 2.0, 3.0])  # 创建一个一维张量
y = torch.tensor([4.0, 5.0, 6.0])  # 创建另一个一维张量

# 基本运算
z = x + y  # 张量加法：[5.0, 7.0, 9.0]
print(f"x + y = {z}")

# 点积运算
dot_product = torch.dot(x, y)  # 1*4 + 2*5 + 3*6 = 32
print(f"点积: {dot_product}")

# 创建一个 2x3 的矩阵
matrix = torch.tensor([[1, 2, 3], [4, 5, 6]])
print(f"矩阵形状: {matrix.shape}")  # torch.Size([2, 3])
print(f"矩阵:\n{matrix}")
```

### 示例：自动求导

```python
import torch  # 导入 PyTorch

# 创建一个需要计算梯度的张量
x = torch.tensor(3.0, requires_grad=True)  # requires_grad=True 表示需要梯度

# 定义一个函数：y = x^2
y = x ** 2

# 反向传播，计算梯度
y.backward()

# 查看梯度（dy/dx = 2x，当 x=3 时，梯度为 6）
print(f"x 的梯度: {x.grad}")  # 输出: 6.0
```

> **原理**：PyTorch 自动记录了计算过程，调用 `backward()` 时自动计算所有梯度。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| PyTorch 核心优势 | 动态计算图、易用性强、研究友好 |
| 安装方式 | pip 或 conda，推荐虚拟环境 |
| GPU 加速 | 需要 NVIDIA GPU + CUDA |
| 张量（Tensor） | PyTorch 的基本数据结构 |
| 自动求导 | requires_grad=True + backward() |

---

## 6 新手常见误区

### 误区 1："必须买 GPU 才能学 PyTorch"

**错！** CPU 完全可以学习基础内容。GPU 只在训练大模型时才有明显优势。

正确做法：先用 CPU 学习，遇到性能瓶颈再考虑 GPU。

### 误区 2："安装越新的版本越好"

不是的。新版本可能有兼容性问题，建议选择稳定版本。

正确做法：使用官方推荐的版本组合，查看 [PyTorch 官网](https://pytorch.org/get-started/locally/)。

### 误区 3："PyTorch 和 NumPy 完全一样"

虽然张量操作类似，但 PyTorch 有 GPU 加速和自动求导功能。

正确做法：把 Tensor 当作"增强版 NumPy 数组"，重点关注深度学习相关功能。

---

## 7 动手练习

### 练习 1：基础练习

创建一个 3x3 的单位矩阵，并计算它的转置。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 创建 3x3 单位矩阵
identity = torch.eye(3)
print(f"单位矩阵:\n{identity}")

# 计算转置
transpose = identity.t()
print(f"转置矩阵:\n{transpose}")

# 验证：单位矩阵的转置还是它本身
print(f"是否相等: {torch.equal(identity, transpose)}")
```

</details>

### 练习 2：进阶练习

计算函数 f(x) = 3x^2 + 2x + 1 在 x=2 处的导数。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 创建需要梯度的张量
x = torch.tensor(2.0, requires_grad=True)

# 定义函数 f(x) = 3x^2 + 2x + 1
f = 3 * x**2 + 2 * x + 1

# 反向传播计算梯度
f.backward()

# 查看梯度（f'(x) = 6x + 2，当 x=2 时，f'(2) = 14）
print(f"x=2 处的导数: {x.grad}")  # 应该输出 14.0

# 验证：手动计算
manual_grad = 6 * 2 + 2
print(f"手动计算结果: {manual_grad}")  # 14
```

</details>

### 练习 3（挑战）：综合练习

创建一个简单的线性模型 y = wx + b，其中 w=2, b=1，计算当 x=5 时的输出值，并验证梯度计算。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 定义参数（需要梯度）
w = torch.tensor(2.0, requires_grad=True)  # 权重
b = torch.tensor(1.0, requires_grad=True)  # 偏置
x = torch.tensor(5.0)  # 输入（不需要梯度）

# 前向传播：y = wx + b
y = w * x + b
print(f"输出值: {y.item()}")  # 应该输出 11.0

# 反向传播
y.backward()

# 查看梯度
print(f"w 的梯度 (dy/dw = x): {w.grad}")  # 应该输出 5.0
print(f"b 的梯度 (dy/db = 1): {b.grad}")  # 应该输出 1.0

# 验证
print(f"验证 w 的梯度: x = {x.item()}")  # 5.0
print(f"验证 b 的梯度: 1")  # 1.0
```

</details>

---

## 下一章预告

下一章我们会学习 **张量基础与操作**——PyTorch 的核心数据结构。你会学到如何创建、操作、变换张量，这些是构建神经网络的基础。
