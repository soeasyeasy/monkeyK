---
title: "第3章：自动求导机制"
description: "深入理解 Autograd 原理、计算图、梯度计算与反向传播"
---

# 第3章：自动求导机制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是自动求导？为什么深度学习需要它？
- 计算图是什么？动态图有什么好处？
- 梯度是怎么计算的？反向传播的原理是什么？
- 如何控制梯度的计算？什么时候需要禁用梯度？

这一章就是为了解答这些问题。自动求导是 PyTorch 的核心功能，理解它才能真正掌握神经网络训练。

---

## 1 为什么需要自动求导？

### 痛点分析

想象一下你要训练一个有 100 万个参数的神经网络：

**手动求导时**：你需要对每个参数计算偏导数，写出复杂的数学公式，容易出错且耗时。

**自动求导后**：只需要定义前向计算，PyTorch 自动帮你算出所有梯度。

### 传统方式的痛点

```python
import numpy as np

# 假设有一个简单函数：y = w * x + b
# 损失函数：L = (y - target)^2

# 手动计算梯度
# dL/dw = 2 * (y - target) * x
# dL/db = 2 * (y - target)

# 如果网络有 100 层，你需要手动推导 100 个梯度公式
# 这不仅繁琐，还容易出错
```

### PyTorch 的解决方案

```python
import torch

# 定义参数（需要梯度）
w = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(1.0, requires_grad=True)
x = torch.tensor(3.0)
target = torch.tensor(10.0)

# 前向传播（定义计算过程）
y = w * x + b
loss = (y - target) ** 2

# 反向传播（自动计算所有梯度）
loss.backward()

# 查看梯度
print(f"w 的梯度: {w.grad}")  # 自动计算
print(f"b 的梯度: {b.grad}")  # 自动计算
```

> **一句话总结**：自动求导让你专注于模型设计，不用操心数学推导。

---

## 2 核心原理

### 什么是计算图？

计算图是有向无环图，记录所有计算操作：

- **节点**：操作（如加法、乘法）或变量
- **边**：数据流向（张量）

打个比方：

> 计算图就像菜谱，记录了从食材到成品的每一步操作。反向传播就是按照菜谱的逆过程，计算每步对最终结果的贡献。

### 动态图 vs 静态图

| 特性 | PyTorch（动态图） | TensorFlow 1.x（静态图） |
| --- | --- | --- |
| 构建时机 | 运行时构建 | 编译时构建 |
| 调试 | 容易（像普通 Python） | 困难（需要特殊工具） |
| 灵活性 | 高（可以有条件分支） | 低（图结构固定） |
| 性能 | 略低 | 略高（可优化） |

> **PyTorch 的优势**：代码怎么写，图就怎么建，调试方便。

---

## 3 自动求导基础

### requires_grad 参数

```python
import torch

# 创建需要梯度的张量
x = torch.tensor(3.0, requires_grad=True)
print(f"需要梯度: {x.requires_grad}")  # True

# 或者使用 requires_grad_() 方法
y = torch.tensor(3.0)
y.requires_grad_()
print(f"需要梯度: {y.requires_grad}")  # True

# 不需要梯度的张量
z = torch.tensor(3.0)
print(f"需要梯度: {z.requires_grad}")  # False
```

### 基本梯度计算

```python
import torch

# 创建输入
x = torch.tensor(2.0, requires_grad=True)

# 定义函数：y = x^2 + 3x + 1
y = x ** 2 + 3 * x + 1

# 反向传播
y.backward()

# 查看梯度（dy/dx = 2x + 3，当 x=2 时，dy/dx = 7）
print(f"x 的梯度: {x.grad}")  # 7.0
```

### 标量 vs 向量

```python
import torch

# 情况1：输出是标量
x = torch.tensor(2.0, requires_grad=True)
y = x ** 2
y.backward()  # 可以直接调用
print(f"标量梯度: {x.grad}")  # 4.0

# 情况2：输出是向量
x = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)
y = x ** 2  # y = [1, 4, 9]

# 不能直接 backward，需要传入梯度权重
y.backward(torch.tensor([1.0, 1.0, 1.0]))
print(f"向量梯度: {x.grad}")  # [2, 4, 6]
```

> **原理**：backward() 需要标量输入。如果输出是向量，需要传入权重（通常是全1向量）。

---

## 4 计算图可视化

```python
import torch

# 创建输入
x = torch.tensor(2.0, requires_grad=True)
w = torch.tensor(3.0, requires_grad=True)
b = torch.tensor(1.0, requires_grad=True)

# 前向传播
y = w * x + b
z = y ** 2

# 查看计算图
print(f"z 的梯度函数: {z.grad_fn}")  # PowBackward0
print(f"y 的梯度函数: {y.grad_fn}")  # AddBackward0

# 反向传播
z.backward()

# 查看梯度
print(f"x 的梯度: {x.grad}")  # dz/dx = 2y * w = 2 * 7 * 3 = 42
print(f"w 的梯度: {w.grad}")  # dz/dw = 2y * x = 2 * 7 * 2 = 28
print(f"b 的梯度: {b.grad}")  # dz/db = 2y * 1 = 2 * 7 = 14
```

---

## 5 梯度控制

### 禁用梯度计算

```python
import torch

x = torch.tensor(2.0, requires_grad=True)

# 方式1：torch.no_grad() 上下文管理器
with torch.no_grad():
    y = x * 2
    print(f"y 需要梯度: {y.requires_grad}")  # False

# 方式2：detach() 方法
z = x.detach()
print(f"z 需要梯度: {z.requires_grad}")  # False

# 方式3：设置 requires_grad=False
x.requires_grad = False
w = x * 2
print(f"w 需要梯度: {w.requires_grad}")  # False
```

> **使用场景**：
> - 推理阶段（不需要梯度，节省内存）
> - 冻结某些参数（如迁移学习）

### 梯度清零

```python
import torch

x = torch.tensor(2.0, requires_grad=True)

# 第一次计算
y = x ** 2
y.backward()
print(f"第一次梯度: {x.grad}")  # 4.0

# 第二次计算（梯度会累加）
y = x ** 3
y.backward()
print(f"第二次梯度: {x.grad}")  # 4 + 12 = 16（累加了）

# 正确做法：每次计算前清零
x.grad.zero_()  # 清零梯度
y = x ** 3
y.backward()
print(f"清零后梯度: {x.grad}")  # 12.0
```

> **重要**：训练神经网络时，每次迭代前都要清零梯度，否则会累加。

---

## 6 高阶导数

```python
import torch

x = torch.tensor(2.0, requires_grad=True)

# 定义函数：y = x^3
y = x ** 3

# 计算一阶导数（保留计算图）
dy_dx = torch.autograd.grad(y, x, create_graph=True)
print(f"一阶导数: {dy_dx[0]}")  # 12.0 (3x^2 = 3*4 = 12)

# 计算二阶导数
d2y_dx2 = torch.autograd.grad(dy_dx[0], x)
print(f"二阶导数: {d2y_dx2[0]}")  # 12.0 (6x = 6*2 = 12)
```

---

## 7 自定义自动求导

```python
import torch

# 继承 Function 类
class MyReLU(torch.autograd.Function):
    @staticmethod
    def forward(ctx, input):
        # 保存输入用于反向传播
        ctx.save_for_backward(input)
        # 前向传播：max(0, x)
        return input.clamp(min=0)

    @staticmethod
    def backward(ctx, grad_output):
        # 获取保存的输入
        input, = ctx.saved_tensors
        # 反向传播：x > 0 时梯度为1，否则为0
        grad_input = grad_output.clone()
        grad_input[input < 0] = 0
        return grad_input

# 使用自定义函数
relu = MyReLU.apply
x = torch.tensor([-1.0, 0.0, 1.0, 2.0], requires_grad=True)
y = relu(x)
print(f"前向输出: {y}")  # [0, 0, 1, 2]

# 反向传播
y.sum().backward()
print(f"梯度: {x.grad}")  # [0, 0, 1, 1]
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| requires_grad | 标记需要计算梯度的张量 |
| backward() | 触发反向传播，计算梯度 |
| grad | 存储计算出的梯度 |
| no_grad() | 禁用梯度计算，节省内存 |
| detach() | 创建不跟踪梯度的新张量 |
| zero_() | 清零梯度，避免累加 |

---

## 9 新手常见误区

### 误区 1："忘记清零梯度"

**错！** 梯度会累加，导致训练错误。

正确做法：每次迭代前调用 `optimizer.zero_grad()` 或 `param.grad.zero_()`。

### 误区 2："在推理时保留梯度"

不是的。推理时不需要梯度，保留会浪费内存。

正确做法：推理时使用 `with torch.no_grad():` 包裹代码。

### 误区 3："对非叶子节点调用 backward"

实际上只有叶子节点（requires_grad=True 且由用户创建）才有梯度。

正确做法：对损失（标量）调用 backward，梯度会累积到叶子节点。

### 误区 4："认为梯度计算会修改数据"

梯度计算只是记录操作，不会改变原始数据。

正确做法：理解计算图是记录操作历史，数据本身不变。

---

## 10 动手练习

### 练习 1：基础练习

计算函数 f(x) = x^3 + 2x^2 - 5x + 3 在 x=1 处的导数。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 创建需要梯度的张量
x = torch.tensor(1.0, requires_grad=True)

# 定义函数
f = x**3 + 2*x**2 - 5*x + 3

# 反向传播
f.backward()

# 查看梯度（f'(x) = 3x^2 + 4x - 5，当 x=1 时，f'(1) = 3 + 4 - 5 = 2）
print(f"x=1 处的导数: {x.grad}")  # 应该输出 2.0

# 验证
manual_grad = 3*1**2 + 4*1 - 5
print(f"手动计算: {manual_grad}")  # 2
```

</details>

### 练习 2：进阶练习

有两个参数 w 和 b，计算函数 y = w*x + b 在 x=3, w=2, b=1 时，对 w 和 b 的偏导数。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 创建参数
x = torch.tensor(3.0)  # 输入（不需要梯度）
w = torch.tensor(2.0, requires_grad=True)  # 权重（需要梯度）
b = torch.tensor(1.0, requires_grad=True)  # 偏置（需要梯度）

# 前向传播
y = w * x + b

# 反向传播
y.backward()

# 查看梯度
print(f"dy/dw = x = {w.grad}")  # 应该输出 3.0
print(f"dy/db = 1 = {b.grad}")  # 应该输出 1.0

# 验证
print(f"验证: dy/dw = {x.item()}, dy/db = 1")
```

</details>

### 练习 3（挑战）：综合练习

实现一个多元函数 f(x, y) = x^2 * y + y^3，计算在点 (2, 3) 处的梯度，并验证结果。

<details>
<summary>点击查看答案</summary>

```python
import torch

# 创建需要梯度的张量
x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(3.0, requires_grad=True)

# 定义函数
f = x**2 * y + y**3

# 反向传播
f.backward()

# 查看梯度
print(f"df/dx = 2xy = {x.grad}")  # 2*2*3 = 12
print(f"df/dy = x^2 + 3y^2 = {y.grad}")  # 4 + 27 = 31

# 验证
manual_dx = 2 * 2 * 3  # 12
manual_dy = 2**2 + 3 * 3**2  # 4 + 27 = 31
print(f"手动验证 df/dx: {manual_dx}")
print(f"手动验证 df/dy: {manual_dy}")

# 测试梯度清零
x.grad.zero_()
y.grad.zero_()
print(f"清零后 x 梯度: {x.grad}")  # None 或 0
print(f"清零后 y 梯度: {y.grad}")  # None 或 0
```

</details>

---

## 下一章预告

下一章我们会学习 **数据加载与处理**——如何高效地加载和预处理数据。你会学到 Dataset、DataLoader 的使用方法，以及数据增强技术，这是训练模型前的必要准备。