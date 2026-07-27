---
title: "第15章：多元微积分与梯度——AI优化的引擎"
description: "偏导数、多重积分、梯度、方向导数、链式法则，理解神经网络反向传播的数学原理"
---

# 第15章：多元微积分与梯度——AI优化的引擎

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么 AI 需要多元微积分？一元不够吗？
- 偏导数和普通导数有什么区别？
- 梯度到底是什么？为什么神经网络训练离不开它？
- 反向传播的数学原理是什么？

神经网络有成千上万个参数，损失函数是关于所有参数的多元函数。要优化这些参数，必须用多元微积分。这一章会带你理解梯度下降的数学本质。

---

## 1 为什么需要多元微积分？

### 痛点分析

假设你要训练一个神经网络识别手写数字：

- 模型有 10000 个权重参数 w₁, w₂, ..., w₁₀₀₀₀
- 损失函数 L 是所有参数的函数：L(w₁, w₂, ..., w₁₀₀₀₀)
- 怎么知道每个参数该往哪个方向调？→ 需要**偏导数**
- 怎么综合考虑所有参数的影响？→ 需要**梯度**
- 怎么从输出层反向计算到输入层？→ 需要**链式法则**

打个比方：

> 偏导数就像"在山坡上，分别测量东西方向和南北方向的坡度"。
> 梯度就像"把所有方向的坡度合成一个向量，指向最陡的方向"。
> 反向传播就像"从山顶一层层往下走，每层都计算最陡的方向"。

### 多元微积分在 AI 中的角色

| 多元微积分知识 | AI 中的应用场景 |
| --- | --- |
| 偏导数 | 计算单个参数的梯度 |
| 梯度 | 参数更新的方向 |
| 方向导数 | 任意方向的变化率 |
| 链式法则 | 反向传播的核心 |
| 多重积分 | 多维概率计算 |

---

## 2 核心原理

### 2.1 偏导数——多元函数的"单变量导数"

```
偏导数：多元函数对其中一个变量求导，其他变量视为常数

记号：∂f/∂x 或 f_x

例 1：f(x, y) = x² + xy + y²
  对 x 求偏导（y 视为常数）：
  ∂f/∂x = 2x + y
  
  对 y 求偏导（x 视为常数）：
  ∂f/∂y = x + 2y

例 2：f(x, y) = sin(xy)
  ∂f/∂x = y·cos(xy)  （链式法则）
  ∂f/∂y = x·cos(xy)
```

> 打个比方：偏导数就像"在山上，只沿着东西方向走，测量这个方向的坡度"。

### 2.2 梯度——最陡的方向

```
梯度：所有偏导数组成的向量

记号：∇f = (∂f/∂x, ∂f/∂y, ...)

例：f(x, y) = x² + 2y²
  ∂f/∂x = 2x
  ∂f/∂y = 4y
  
  梯度：∇f = (2x, 4y)
  
  在点 (1, 2) 处：
  ∇f(1, 2) = (2, 8)
  
  梯度的方向：指向函数增长最快的方向
  梯度的反方向：指向函数下降最快的方向（梯度下降用这个！）
```

> 打个比方：梯度就像"指南针"——告诉你哪边最陡。梯度下降就是"沿着最陡的反方向下山"。

### 2.3 方向导数——任意方向的变化率

```
方向导数：函数在某个方向上的变化率

公式：D_u f = ∇f · u
  其中 u 是单位向量（方向）

例：f(x, y) = x² + y²，求在 (1, 1) 处沿方向 (1, 1)/√2 的方向导数
  
  1. 计算梯度：∇f = (2x, 2y) = (2, 2)
  2. 单位化方向：u = (1/√2, 1/√2)
  3. 点积：D_u f = (2, 2)·(1/√2, 1/√2) = 2/√2 + 2/√2 = 2√2
```

### 2.4 链式法则——反向传播的数学基础

```
多元函数的链式法则：

如果 z = f(x, y)，x = g(t)，y = h(t)
则 dz/dt = (∂f/∂x)(dx/dt) + (∂f/∂y)(dy/dt)

例：z = x² + y²，x = sin(t)，y = cos(t)
  ∂z/∂x = 2x
  ∂z/∂y = 2y
  dx/dt = cos(t)
  dy/dt = -sin(t)
  
  dz/dt = 2x·cos(t) + 2y·(-sin(t))
        = 2sin(t)cos(t) - 2cos(t)sin(t)
        = 0（常数！因为 x²+y² = sin²(t)+cos²(t) = 1）

神经网络中的链式法则：

  损失 L 关于权重 w 的梯度：
  ∂L/∂w = (∂L/∂y)(∂y/∂z)(∂z/∂w)
  
  这就是反向传播！从输出层一层层往回传。
```

> 打个比方：链式法则就像"多米诺骨牌"——第一块倒了推第二块，第二块推第三块...最后算出总效果。

### 2.5 多重积分——多维空间的"体积"

```
二重积分：二元函数在区域上的积分

记号：∬ f(x,y) dA

例：∬[0,1]×[0,1] (x+y) dA
  = ∫[0,1] [∫[0,1] (x+y) dy] dx
  = ∫[0,1] [xy + y²/2] 从 y=0 到 y=1 dx
  = ∫[0,1] (x + 1/2) dx
  = [x²/2 + x/2] 从 0 到 1
  = 1/2 + 1/2
  = 1

在 AI 中：
  多维概率分布的积分
  例：P(X∈A) = ∬_A f(x,y) dA
```

---

## 3 基础用法

### 用 Python 计算多元微积分

```python
import sympy as sp
import numpy as np

# === 定义符号变量 ===
x, y = sp.symbols('x y')  # 定义 x, y 为符号变量

# === 偏导数 ===
# 例 1：f(x, y) = x² + xy + y²
f1 = x**2 + x*y + y**2

# 对 x 求偏导
df_dx = sp.diff(f1, x)
print(f"∂f/∂x = {df_dx}")  # → 2*x + y

# 对 y 求偏导
df_dy = sp.diff(f1, y)
print(f"∂f/∂y = {df_dy}")  # → x + 2*y

# 在点 (1, 2) 处计算
val_dx = df_dx.subs({x: 1, y: 2})
val_dy = df_dy.subs({x: 1, y: 2})
print(f"在 (1,2) 处：∂f/∂x = {val_dx}, ∂f/∂y = {val_dy}")  # → 4, 5

# === 梯度 ===
# 计算梯度向量
gradient = sp.Matrix([df_dx, df_dy])
print(f"梯度 ∇f = {gradient.T}")  # → Matrix([[2*x + y, x + 2*y]])

# 在点 (1, 2) 处的梯度
grad_at_point = gradient.subs({x: 1, y: 2})
print(f"在 (1,2) 处的梯度 = {grad_at_point.T}")  # → Matrix([[4, 5]])

# === 链式法则示例 ===
# z = x² + y², x = sin(t), y = cos(t)
t = sp.Symbol('t')
x_t = sp.sin(t)
y_t = sp.cos(t)
z = x**2 + y**2

# 直接代入
z_t = z.subs({x: x_t, y: y_t})
print(f"z(t) = {sp.simplify(z_t)}")  # → 1（常数）

# 用链式法则验证
dz_dt = sp.diff(z_t, t)
print(f"dz/dt = {sp.simplify(dz_dt)}")  # → 0

# === 数值梯度（AI 中常用）===
def f(x, y):
    """目标函数"""
    return x**2 + 2*y**2

def numerical_gradient(f, x, y, h=1e-5):
    """数值计算梯度"""
    df_dx = (f(x + h, y) - f(x - h, y)) / (2 * h)  # 对 x 的偏导
    df_dy = (f(x, y + h) - f(x, y - h)) / (2 * h)  # 对 y 的偏导
    return np.array([df_dx, df_dy])

# 测试
grad = numerical_gradient(f, 1.0, 2.0)
print(f"数值梯度 = {grad}")  # → [2. 8.]（理论值：[2*1, 4*2] = [2, 8]）

# === 梯度下降示例 ===
def gradient_descent(f, grad_f, start, lr=0.1, iterations=20):
    """梯度下降优化"""
    x, y = start
    print(f"初始点：({x:.4f}, {y:.4f}), f = {f(x, y):.4f}")
    
    for i in range(iterations):
        g = grad_f(f, x, y)  # 计算梯度
        x = x - lr * g[0]  # 更新 x
        y = y - lr * g[1]  # 更新 y
        print(f"第 {i+1} 步：({x:.4f}, {y:.4f}), f = {f(x, y):.4f}")
    
    return x, y

# 优化 f(x,y) = x² + 2y²
final_x, final_y = gradient_descent(f, numerical_gradient, (3.0, 4.0))
print(f"\n最终结果：({final_x:.6f}, {final_y:.6f})")
# 应该接近 (0, 0)，最小值点
```

> ⚠️ 注意：数值梯度用差分近似，有误差但计算快。符号梯度精确但慢。AI 中用自动微分（如 PyTorch 的 autograd）。

---

## 4 对比表格

| 概念 | 数学表达 | 几何意义 | AI 中的应用 |
| --- | --- | --- | --- |
| 偏导数 | ∂f/∂x | 沿 x 轴方向的变化率 | 单个参数的梯度 |
| 梯度 | ∇f = (∂f/∂x, ∂f/∂y) | 最陡上升方向 | 参数更新方向 |
| 方向导数 | D_u f = ∇f·u | 任意方向的变化率 | 约束优化 |
| 链式法则 | dz/dt = Σ(∂z/∂x_i)(dx_i/dt) | 复合函数的导数 | 反向传播 |
| 二重积分 | ∬f(x,y)dA | 曲面下的体积 | 多维概率 |

---

## 5 新手常见误区

### 误区 1："梯度方向是下山最快的方向"

**错！** 梯度方向是**上山**最快的方向，梯度下降要取**反方向**：

```python
import numpy as np

def f(x, y):
    return x**2 + y**2

def gradient(x, y):
    return np.array([2*x, 2*y])

# 在点 (1, 1) 处
x, y = 1.0, 1.0
grad = gradient(x, y)
print(f"梯度 = {grad}")  # → [2, 2]（指向函数增长最快的方向）

# 梯度下降：往反方向走
lr = 0.1
new_x = x - lr * grad[0]  # 1 - 0.1*2 = 0.8
new_y = y - lr * grad[1]  # 1 - 0.1*2 = 0.8
print(f"新点 = ({new_x}, {new_y})")  # → (0.8, 0.8)
print(f"f(新点) = {f(new_x, new_y):.4f}")  # → 1.28（比 f(1,1)=2 小了）
```

### 误区 2："偏导数存在，函数就连续"

**错！** 偏导数存在不能保证函数连续：

```python
# 反例：f(x,y) = xy/(x²+y²) 当 (x,y)≠(0,0)
#              f(0,0) = 0

# 在 (0,0) 处：
# ∂f/∂x = lim [f(h,0) - f(0,0)]/h = lim [0 - 0]/h = 0
# ∂f/∂y = lim [f(0,h) - f(0,0)]/h = lim [0 - 0]/h = 0

# 但函数在 (0,0) 不连续！
# 沿 y=x 方向：f(x,x) = x²/(2x²) = 1/2 ≠ f(0,0) = 0
```

### 误区 3："梯度下降一定能找到最小值"

**错！** 梯度下降可能陷入局部最小值或鞍点：

```python
import numpy as np

# 例：非凸函数 f(x) = x⁴ - 4x²
def f(x):
    return x**4 - 4*x**2

def df(x):
    return 4*x**3 - 8*x

# 从 x=0.5 开始梯度下降
x = 0.5
lr = 0.05

for i in range(50):
    x = x - lr * df(x)

print(f"最终 x = {x:.4f}, f(x) = {f(x):.4f}")
# 可能停在局部最小值 x≈1.414，而不是全局最小值

# 鞍点：梯度为 0，但不是极值点
# 例：f(x,y) = x² - y² 在 (0,0)
# ∂f/∂x = 2x = 0, ∂f/∂y = -2y = 0
# 但 (0,0) 不是极值点（是鞍点）
```

### 误区 4："链式法则只是数学游戏，AI 里用不到"

**错！** 链式法则是反向传播的核心，没有它神经网络就没法训练：

```python
# 简单的神经网络前向传播
import numpy as np

# 输入
x = 2.0
# 权重
w1 = 0.5
w2 = 0.8
# 目标输出
target = 1.0

# 前向传播
z1 = w1 * x      # 第一层
a1 = z1**2       # 激活函数（简化）
z2 = w2 * a1     # 第二层
y = z2           # 输出

# 损失
L = (y - target)**2

print(f"输出 y = {y:.4f}, 损失 L = {L:.4f}")

# 反向传播（链式法则）
# ∂L/∂y = 2(y - target)
dL_dy = 2 * (y - target)

# ∂y/∂z2 = 1
dy_dz2 = 1

# ∂z2/∂w2 = a1
dz2_dw2 = a1

# ∂z2/∂a1 = w2
dz2_da1 = w2

# ∂a1/∂z1 = 2*z1
da1_dz1 = 2 * z1

# ∂z1/∂w1 = x
dz1_dw1 = x

# 链式法则：∂L/∂w2 = ∂L/∂y · ∂y/∂z2 · ∂z2/∂w2
dL_dw2 = dL_dy * dy_dz2 * dz2_dw2

# 链式法则：∂L/∂w1 = ∂L/∂y · ∂y/∂z2 · ∂z2/∂a1 · ∂a1/∂z1 · ∂z1/∂w1
dL_dw1 = dL_dy * dy_dz2 * dz2_da1 * da1_dz1 * dz1_dw1

print(f"∂L/∂w2 = {dL_dw2:.4f}")
print(f"∂L/∂w1 = {dL_dw1:.4f}")

# 参数更新
lr = 0.01
w2 = w2 - lr * dL_dw2
w1 = w1 - lr * dL_dw1

print(f"更新后：w1 = {w1:.4f}, w2 = {w2:.4f}")
```

---

## 6 动手练习

### 练习 1：计算偏导数

用 sympy 求以下函数的偏导数：
1. f(x, y) = x³y + 2xy²，求 ∂f/∂x 和 ∂f/∂y
2. f(x, y) = e^(xy)，求 ∂f/∂x 和 ∂f/∂y
3. f(x, y, z) = x² + y² + z² + xyz，求梯度

<details>
<summary>点击查看答案</summary>

```python
import sympy as sp

x, y, z = sp.symbols('x y z')

# 1. f(x, y) = x³y + 2xy²
f1 = x**3 * y + 2 * x * y**2
df1_dx = sp.diff(f1, x)
df1_dy = sp.diff(f1, y)
print(f"∂f/∂x = {df1_dx}")  # → 3*x**2*y + 2*y**2
print(f"∂f/∂y = {df1_dy}")  # → x**3 + 4*x*y

# 2. f(x, y) = e^(xy)
f2 = sp.exp(x * y)
df2_dx = sp.diff(f2, x)
df2_dy = sp.diff(f2, y)
print(f"∂f/∂x = {df2_dx}")  # → y*exp(x*y)
print(f"∂f/∂y = {df2_dy}")  # → x*exp(x*y)

# 3. f(x, y, z) = x² + y² + z² + xyz
f3 = x**2 + y**2 + z**2 + x * y * z
grad = sp.Matrix([sp.diff(f3, x), sp.diff(f3, y), sp.diff(f3, z)])
print(f"梯度 = {grad.T}")  # → [[2*x + y*z, 2*y + x*z, 2*z + x*y]]
```

</details>

### 练习 2：数值梯度计算

用数值方法计算 f(x, y) = x² + 2y² 在点 (2, 3) 处的梯度。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

def f(x, y):
    return x**2 + 2*y**2

def numerical_gradient(f, x, y, h=1e-5):
    """数值计算梯度"""
    df_dx = (f(x + h, y) - f(x - h, y)) / (2 * h)
    df_dy = (f(x, y + h) - f(x, y - h)) / (2 * h)
    return np.array([df_dx, df_dy])

# 计算梯度
grad = numerical_gradient(f, 2.0, 3.0)
print(f"数值梯度 = {grad}")  # → [4. 12.]

# 理论值：∂f/∂x = 2x = 4, ∂f/∂y = 4y = 12
print(f"理论梯度 = [4.0, 12.0]")
```

</details>

### 练习 3（挑战）：梯度下降优化

用梯度下降求 f(x, y) = (x-1)² + (y-2)² 的最小值点。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

def f(x, y):
    return (x - 1)**2 + (y - 2)**2

def gradient(x, y):
    """解析梯度"""
    return np.array([2*(x - 1), 2*(y - 2)])

# 梯度下降参数
lr = 0.1
iterations = 50
x, y = 0.0, 0.0  # 初始点

print("梯度下降过程：")
print(f"初始点：({x:.4f}, {y:.4f}), f = {f(x, y):.4f}")

for i in range(iterations):
    grad = gradient(x, y)
    x = x - lr * grad[0]
    y = y - lr * grad[1]
    if (i + 1) % 10 == 0:
        print(f"第 {i+1} 步：({x:.4f}, {y:.4f}), f = {f(x, y):.4f}")

print(f"\n最终结果：({x:.6f}, {y:.6f})")
print(f"理论最小值点：(1.0, 2.0)")
# 应该接近 (1, 2)，最小值 f = 0
```

</details>

---

## 7 核心知识点总结

| 知识点 | 要点 |
| --- | --- |
| 偏导数 | 多元函数对单个变量求导，其他变量视为常数 |
| 梯度 | 所有偏导数组成的向量，指向最陡上升方向 |
| 方向导数 | 函数在任意方向的变化率 |
| 链式法则 | 复合函数求导，反向传播的数学基础 |
| 多重积分 | 多维空间的"体积"，用于概率计算 |
| AI 应用 | 梯度下降、反向传播、参数优化 |

---

## 下一章预告

下一章我们会学习 **线性代数深入**——AI 的数学内核。你会学到特征值、SVD 分解、PCA 降维，这些是理解 AI 特征提取和数据压缩的关键。
