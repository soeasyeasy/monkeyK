---
title: "第3章：自动求导机制"
description: "tf.GradientTape、计算图、梯度计算、反向传播"
---

# 第3章：自动求导机制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是自动求导？为什么深度学习需要它？
- TensorFlow 是怎么自动计算梯度的？
- `tf.GradientTape` 是什么？怎么用？
- 梯度消失和梯度爆炸是怎么回事？

这一章就是为了解答这些问题。自动求导是深度学习的**核心引擎**——没有它，模型就无法学习。我们会先理解梯度的概念，再动手实践 `tf.GradientTape` 的使用，最后了解计算图和反向传播的原理。

---

## 1 为什么需要自动求导？

### 痛点分析

想象你要训练一个模型预测房价。传统做法是：

1. 手动推导损失函数对每个参数的偏导数
2. 手写梯度计算代码
3. 模型一复杂，公式就推导不出来
4. 改个模型结构，所有梯度公式都要重新推

这就像**每次改菜谱都要重新计算营养成分**——太麻烦了！

### 解决方案

TensorFlow 的自动求导机制就像一个**智能计算器**：

- 你只需要定义前向计算（模型怎么从输入得到输出）
- TensorFlow 自动帮你算出梯度（损失对参数的导数）
- 不管模型多复杂，梯度都能自动算出来
- 改模型结构？梯度自动更新，不用手动推导

> **一句话总结**：自动求导让 TensorFlow 自动计算梯度，你只需要关心模型结构，不用操心数学公式。

### 代码对比

**手动计算梯度**：

```python
import numpy as np

# 简单的线性模型: y = wx + b
# 损失函数: L = (y_pred - y_true)^2

# 手动推导梯度
# dL/dw = 2 * (y_pred - y_true) * x
# dL/db = 2 * (y_pred - y_true)

def manual_gradient(x, y_true, w, b):
    y_pred = w * x + b
    error = y_pred - y_true
    grad_w = 2 * error * x              # 手动推导的公式
    grad_b = 2 * error                  # 手动推导的公式
    return grad_w, grad_b
```

**使用 TensorFlow 自动求导**：

```python
import tensorflow as tf

# 定义变量
w = tf.Variable(1.0)                    # 权重
b = tf.Variable(0.0)                    # 偏置

# 使用 GradientTape 自动记录操作
with tf.GradientTape() as tape:         # 开始记录
    x = tf.constant(2.0)                # 输入
    y_true = tf.constant(5.0)           # 真实值
    y_pred = w * x + b                  # 预测值
    loss = (y_pred - y_true) ** 2       # 损失

# 自动计算梯度
grad_w, grad_b = tape.gradient(loss, [w, b])  # 一行代码搞定
print(f"dL/dw = {grad_w}")              # 自动算出的梯度
print(f"dL/db = {grad_b}")
```

---

## 2 核心原理

### 概念解释

**自动求导（Automatic Differentiation）** 是一种计算函数导数的技术。它既不是符号推导，也不是数值近似，而是**通过记录计算过程，自动应用链式法则计算梯度**。

打个比方：

> 自动求导就像一个**智能录像机**——它记录下你做的每一步计算（前向传播），然后倒带回放，自动应用链式法则算出每一步的梯度（反向传播）。

### 计算图

TensorFlow 使用**计算图**来表示计算过程：

- **节点（Node）**：表示运算操作（加法、乘法、激活函数等）
- **边（Edge）**：表示数据流（张量）

打个比方：

> 计算图就像**工厂的流水线图**——原材料（输入）从一端进入，经过一道道工序（运算），最终变成产品（输出）。自动求导就是沿着这条流水线反向追溯，算出每个工序对最终产品的贡献（梯度）。

### 链式法则

自动求导的核心是**链式法则**：

如果 `y = f(g(h(x)))`，那么：

```
dy/dx = dy/df * df/dg * dg/dh * dh/dx
```

打个比方：

> 链式法则就像**多米诺骨牌**——每个变量对最终结果的影响，可以通过中间变量一层层传递。自动求导就是自动追踪这些传递关系。

---

## 3 基础用法

### tf.GradientTape 基本使用

```python
import tensorflow as tf

# 1. 简单示例：计算 y = x^2 在 x=3 处的梯度
x = tf.Variable(3.0)                    # 创建变量

with tf.GradientTape() as tape:         # 开始记录计算
    y = x ** 2                          # 定义计算: y = x^2

# 计算梯度: dy/dx = 2x, 在 x=3 时应该是 6
grad = tape.gradient(y, x)              # 计算 y 对 x 的梯度
print(f"梯度: {grad}")                  # 输出: 6.0

# 2. 多个变量的梯度
w = tf.Variable(2.0)                    # 权重
b = tf.Variable(1.0)                    # 偏置
x = tf.constant(3.0)                    # 输入（常量，不需要梯度）

with tf.GradientTape() as tape:
    y = w * x + b                       # 线性模型
    loss = (y - 10) ** 2                # 损失函数

# 计算损失对 w 和 b 的梯度
grad_w, grad_b = tape.gradient(loss, [w, b])
print(f"dL/dw = {grad_w}")              # 损失对 w 的梯度
print(f"dL/db = {grad_b}")              # 损失对 b 的梯度

# 3. 对常量的梯度（需要显式 watch）
x = tf.constant(3.0)                    # 常量默认不记录梯度

with tf.GradientTape() as tape:
    tape.watch(x)                       # 显式告诉 TensorFlow 要计算 x 的梯度
    y = x ** 2

grad = tape.gradient(y, x)
print(f"常量的梯度: {grad}")            # 输出: 6.0
```

### 高阶导数

```python
# 计算二阶导数
x = tf.Variable(2.0)

with tf.GradientTape() as tape1:        # 第一层记录
    with tf.GradientTape() as tape2:    # 第二层记录
        y = x ** 3                      # y = x^3
    dy_dx = tape2.gradient(y, x)        # 一阶导数: 3x^2
d2y_dx2 = tape1.gradient(dy_dx, x)      # 二阶导数: 6x

print(f"一阶导数: {dy_dx}")             # 3 * 2^2 = 12
print(f"二阶导数: {d2y_dx2}")           # 6 * 2 = 12
```

### 持久化磁带

```python
# 默认情况下，tape.gradient() 只能调用一次
# 如果需要多次调用，使用 persistent=True

x = tf.Variable(3.0)

with tf.GradientTape(persistent=True) as tape:  # 持久化磁带
    y = x ** 2
    z = x ** 3

grad_y = tape.gradient(y, x)            # 第一次调用
grad_z = tape.gradient(z, x)            # 第二次调用（默认不允许）

print(f"dy/dx = {grad_y}")              # 6.0
print(f"dz/dx = {grad_z}")              # 27.0

# 注意：使用完后要手动删除磁带
del tape
```

---

## 4 实战：手动实现梯度下降

```python
import tensorflow as tf
import numpy as np

# 生成一些模拟数据
np.random.seed(42)
X = np.random.rand(100, 1).astype(np.float32)  # 100 个样本
y = 3 * X + 2 + np.random.randn(100, 1).astype(np.float32) * 0.1  # y = 3x + 2 + 噪声

# 初始化参数
w = tf.Variable(0.0)                    # 权重，初始为 0
b = tf.Variable(0.0)                    # 偏置，初始为 0

# 超参数
learning_rate = 0.1                     # 学习率
epochs = 100                            # 训练轮数

# 训练循环
for epoch in range(epochs):
    with tf.GradientTape() as tape:     # 记录计算
        y_pred = w * X + b              # 前向传播：预测值
        loss = tf.reduce_mean((y_pred - y) ** 2)  # 均方误差损失
    
    # 计算梯度
    grad_w, grad_b = tape.gradient(loss, [w, b])
    
    # 更新参数（梯度下降）
    w.assign_sub(learning_rate * grad_w)  # w = w - lr * grad_w
    b.assign_sub(learning_rate * grad_b)  # b = b - lr * grad_b
    
    # 每 10 轮打印一次损失
    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}: loss = {loss.numpy():.4f}, w = {w.numpy():.4f}, b = {b.numpy():.4f}")

print(f"\n最终结果: w = {w.numpy():.4f}, b = {b.numpy():.4f}")
print(f"理论值: w = 3.0, b = 2.0")
```

---

## 5 对比表格

### 自动求导 vs 其他求导方式

| 方式 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| 符号求导 | 精确 | 表达式膨胀、慢 | 简单函数 |
| 数值求导 | 简单 | 精度低、慢 | 验证 |
| 手动求导 | 可控 | 易错、耗时 | 特殊需求 |
| **自动求导** | **精确、快、易用** | **需要记录计算** | **深度学习** |

### tf.GradientTape 参数对比

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `persistent` | 是否持久化（可多次调用 gradient） | `False` |
| `watch_accessed_variables` | 是否自动 watch 访问的变量 | `True` |

---

## 6 新手常见误区

### 误区 1："常量也可以自动计算梯度"

**错！** 默认情况下，`tf.GradientTape` 只记录 `tf.Variable` 的梯度，常量需要显式 `watch`：

```python
# ❌ 错误：常量不会自动计算梯度
x = tf.constant(3.0)
with tf.GradientTape() as tape:
    y = x ** 2
grad = tape.gradient(y, x)              # 返回 None

# ✅ 正确：显式 watch
x = tf.constant(3.0)
with tf.GradientTape() as tape:
    tape.watch(x)                       # 显式告诉 TensorFlow 要计算梯度
    y = x ** 2
grad = tape.gradient(y, x)              # 返回 6.0
```

### 误区 2："tape.gradient() 可以调用多次"

**错！** 默认情况下，`tape.gradient()` 只能调用一次，之后磁带就被"消耗"了：

```python
# ❌ 错误：第二次调用会返回 None
x = tf.Variable(3.0)
with tf.GradientTape() as tape:
    y = x ** 2
    z = x ** 3

grad_y = tape.gradient(y, x)            # 第一次调用，正常
grad_z = tape.gradient(z, x)            # 第二次调用，返回 None

# ✅ 正确：使用 persistent=True
x = tf.Variable(3.0)
with tf.GradientTape(persistent=True) as tape:
    y = x ** 2
    z = x ** 3

grad_y = tape.gradient(y, x)            # 正常
grad_z = tape.gradient(z, x)            # 也正常
del tape                                # 记得手动删除
```

### 误区 3："梯度一定是越小越好"

**不是的。** 梯度只是告诉参数更新的方向和幅度，不是越小越好：
- 梯度太小 → 参数更新慢，训练慢
- 梯度太大 → 参数更新过猛，可能发散
- 合适的梯度 → 稳定收敛

✅ 关键是通过学习率控制更新幅度，而不是梯度本身。

### 误区 4："自动求导可以计算任何函数的梯度"

**不完全对。** 自动求导要求函数是**可微的**：

```python
# ❌ 错误：不可微的函数
x = tf.Variable(3.0)
with tf.GradientTape() as tape:
    y = tf.abs(x)                       # 绝对值函数在 0 处不可微
grad = tape.gradient(y, x)              # 在 x=0 时会返回 NaN 或不准确
```

### 误区 5："梯度消失和梯度爆炸是代码写错了"

**不是的。** 这是深度学习中的常见问题，和模型结构、初始化、激活函数等有关：
- **梯度消失**：梯度越来越小，参数几乎不更新（深层网络常见）
- **梯度爆炸**：梯度越来越大，参数更新过猛（RNN 常见）

✅ 解决方法：使用 ReLU 激活函数、Batch Normalization、梯度裁剪等。

---

## 7 动手练习

### 练习 1：基础练习

计算函数 `y = 3x^2 + 2x + 1` 在 `x = 2` 处的梯度（理论值应该是 `dy/dx = 6x + 2 = 14`）。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf

# 创建变量
x = tf.Variable(2.0)

# 使用 GradientTape 记录计算
with tf.GradientTape() as tape:
    y = 3 * x**2 + 2 * x + 1            # 定义函数

# 计算梯度
grad = tape.gradient(y, x)
print(f"x = 2 时的梯度: {grad.numpy()}")  # 应该输出 14.0
```

</details>

### 练习 2：进阶练习

用自动求导实现多元函数的梯度计算：`f(w1, w2) = w1^2 + w2^2 + 2*w1*w2`，在 `w1=1, w2=2` 处计算梯度。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf

# 创建变量
w1 = tf.Variable(1.0)
w2 = tf.Variable(2.0)

# 记录计算
with tf.GradientTape() as tape:
    f = w1**2 + w2**2 + 2 * w1 * w2

# 计算梯度
grad_w1, grad_w2 = tape.gradient(f, [w1, w2])

print(f"df/dw1 = {grad_w1.numpy()}")    # 理论值: 2*w1 + 2*w2 = 2 + 4 = 6
print(f"df/dw2 = {grad_w2.numpy()}")    # 理论值: 2*w2 + 2*w1 = 4 + 2 = 6
```

</details>

### 练习 3（挑战）：综合练习

用自动求导实现一个简单的线性回归模型，训练数据为 `y = 5x + 3 + 噪声`，训练 50 轮，观察参数收敛情况。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
import numpy as np

# 生成模拟数据
np.random.seed(42)
X = np.random.rand(50, 1).astype(np.float32)
y = 5 * X + 3 + np.random.randn(50, 1).astype(np.float32) * 0.1

# 初始化参数
w = tf.Variable(0.0)
b = tf.Variable(0.0)

# 超参数
learning_rate = 0.1
epochs = 50

# 训练循环
for epoch in range(epochs):
    with tf.GradientTape() as tape:
        y_pred = w * X + b
        loss = tf.reduce_mean((y_pred - y) ** 2)
    
    # 计算梯度
    grad_w, grad_b = tape.gradient(loss, [w, b])
    
    # 更新参数
    w.assign_sub(learning_rate * grad_w)
    b.assign_sub(learning_rate * grad_b)
    
    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}: loss = {loss.numpy():.4f}, w = {w.numpy():.4f}, b = {b.numpy():.4f}")

print(f"\n最终结果: w = {w.numpy():.4f}, b = {b.numpy():.4f}")
print(f"理论值: w = 5.0, b = 3.0")
```

</details>

---

## 下一章预告

下一章我们会学习 **数据加载与处理**——也就是如何使用 `tf.data.Dataset` 高效地加载和处理数据。你会学到如何从文件读取数据、数据预处理、数据增强、批处理等。这些是训练模型前的必要准备工作，数据质量直接影响模型效果。
