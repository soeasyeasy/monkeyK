---
title: "第14章：微积分初步——变化与累积"
description: "极限与连续、导数概念、求导法则、不定积分、定积分，理解AI优化的数学基础"
---

# 第14章：微积分初步——变化与累积

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 微积分听起来很高深，AI 真的需要学吗？
- 导数和积分到底是什么意思？跟 AI 有什么关系？
- 极限是什么？为什么要求"无限接近"的值？
- 梯度下降为什么要用导数？

别担心，这一章会用最通俗的方式带你理解微积分。微积分是 AI 优化的核心数学工具——没有它，神经网络就没法"学习"。

---

## 1 为什么需要微积分？

### 痛点分析

假设你要训练一个 AI 识别猫狗：

- 模型有一堆参数（权重），需要调整到最优值
- 怎么知道参数该往哪个方向调？→ 需要**导数**（告诉你变化趋势）
- 怎么知道调整多少？→ 需要**学习率**（控制步长）
- 怎么衡量整体效果？→ 需要**积分**（累积所有误差）

打个比方：

> 导数就像"下山时的坡度"——告诉你哪边更陡，该往哪走。
> 积分就像"走过的总路程"——把所有小步加起来，得到总效果。

### 微积分在 AI 中的角色

| 微积分知识 | AI 中的应用场景 |
| --- | --- |
| 极限 | 理解收敛性（训练是否稳定）|
| 导数 | 梯度下降（参数更新方向）|
| 求导法则 | 反向传播（计算梯度）|
| 积分 | 概率密度、损失累积 |
| 链式法则 | 多层网络梯度计算 |

---

## 2 核心原理

### 2.1 极限——无限接近的思想

```
极限：当 x 无限接近某个值时，f(x) 接近什么？

记号：lim f(x) = L
      x→a

例 1：f(x) = (x² - 1) / (x - 1)，求 x→1 时的极限
  直接代入：(1-1)/(1-1) = 0/0（没意义）
  但因式分解：(x²-1)/(x-1) = (x+1)(x-1)/(x-1) = x+1
  所以 x→1 时，f(x) → 1+1 = 2

例 2：f(x) = 1/x，当 x→∞ 时
  x 越大，1/x 越小
  x=10 → 0.1
  x=100 → 0.01
  x=1000 → 0.001
  ...
  x→∞ 时，1/x → 0
```

> 打个比方：极限就像"你一直走向一堵墙，虽然永远碰不到，但你知道自己会无限接近它"。

### 2.2 连续——没有断裂

```
连续：函数图像没有"断开"

数学定义：lim f(x) = f(a)
          x→a

例：f(x) = x² 是连续的
  x=2 时，f(2) = 4
  x→2 时，f(x) → 4
  极限值 = 函数值，所以连续

例：f(x) = 1/x 在 x=0 处不连续
  因为 f(0) 没定义（分母不能为 0）
```

### 2.3 导数——变化的速率

```
导数：函数在某一点的"瞬时变化率"

几何意义：函数图像在该点的切线斜率

公式：f'(x) = lim [f(x+Δx) - f(x)] / Δx
            Δx→0

例 1：f(x) = x²，求导数
  f'(x) = lim [(x+Δx)² - x²] / Δx
        = lim [x² + 2x·Δx + Δx² - x²] / Δx
        = lim [2x + Δx]
        = 2x
  
  所以 f'(x) = 2x
  x=3 时，f'(3) = 6（斜率是 6）

例 2：f(x) = 3x + 2
  f'(x) = 3（常数，斜率不变）
```

> 打个比方：导数就像"汽车的速度表"——告诉你此刻的速度（变化有多快）。

### 2.4 求导法则

```
常用求导公式：

1. 常数：f(x) = c → f'(x) = 0
   例：f(x) = 5 → f'(x) = 0

2. 幂函数：f(x) = xⁿ → f'(x) = n·xⁿ⁻¹
   例：f(x) = x³ → f'(x) = 3x²

3. 指数函数：f(x) = eˣ → f'(x) = eˣ
   例：f(x) = eˣ → f'(x) = eˣ（导数是自己！）

4. 对数函数：f(x) = ln(x) → f'(x) = 1/x
   例：f(x) = ln(x) → f'(x) = 1/x

求导运算法则：

1. 加减法：[f(x) ± g(x)]' = f'(x) ± g'(x)
   例：f(x) = x² + x → f'(x) = 2x + 1

2. 乘法：[f(x)·g(x)]' = f'(x)·g(x) + f(x)·g'(x)
   例：f(x) = x²·sin(x)
        f'(x) = 2x·sin(x) + x²·cos(x)

3. 链式法则：[f(g(x))]' = f'(g(x))·g'(x)
   例：f(x) = sin(x²)
        f'(x) = cos(x²)·2x
```

### 2.5 不定积分——导数的逆运算

```
不定积分：求原函数

记号：∫f(x)dx = F(x) + C
  其中 F'(x) = f(x)，C 是常数

例 1：∫2x dx = x² + C
  因为 (x²)' = 2x

例 2：∫x² dx = x³/3 + C
  因为 (x³/3)' = x²

基本积分公式：
  ∫xⁿ dx = xⁿ⁺¹/(n+1) + C  (n≠-1)
  ∫1/x dx = ln|x| + C
  ∫eˣ dx = eˣ + C
```

### 2.6 定积分——累积的总量

```
定积分：函数在区间 [a,b] 上的"面积"

记号：∫[a,b] f(x)dx

几何意义：曲线 y=f(x) 与 x 轴之间的面积

例：∫[0,2] x dx
  = [x²/2] 从 0 到 2
  = (2²/2) - (0²/2)
  = 2 - 0
  = 2

牛顿-莱布尼茨公式：
  ∫[a,b] f(x)dx = F(b) - F(a)
  其中 F(x) 是 f(x) 的原函数
```

> 打个比方：定积分就像"把很多小矩形加起来"——每个矩形很窄，高是 f(x)，宽是 Δx，加起来就是总面积。

---

## 3 基础用法

### 用 Python 验证微积分

```python
import sympy as sp  # 导入符号计算库

# === 定义符号变量 ===
x = sp.Symbol('x')  # 定义 x 为符号变量

# === 求极限 ===
# 例 1：lim (x²-1)/(x-1) 当 x→1
f1 = (x**2 - 1) / (x - 1)
limit1 = sp.limit(f1, x, 1)  # 求极限
print(f"lim (x²-1)/(x-1) = {limit1}")  # → 2

# 例 2：lim 1/x 当 x→∞
f2 = 1 / x
limit2 = sp.limit(f2, x, sp.oo)  # oo 表示无穷大
print(f"lim 1/x = {limit2}")  # → 0

# === 求导数 ===
# 例 1：f(x) = x²
f3 = x**2
derivative1 = sp.diff(f3, x)  # 求导
print(f"(x²)' = {derivative1}")  # → 2*x

# 例 2：f(x) = sin(x²)
f4 = sp.sin(x**2)
derivative2 = sp.diff(f4, x)  # 链式法则
print(f"(sin(x²))' = {derivative2}")  # → 2*x*cos(x²)

# === 不定积分 ===
# 例：∫2x dx
f5 = 2*x
integral1 = sp.integrate(f5, x)  # 不定积分
print(f"∫2x dx = {integral1}")  # → x**2

# === 定积分 ===
# 例：∫[0,2] x dx
f6 = x
integral2 = sp.integrate(f6, (x, 0, 2))  # 定积分，区间 [0,2]
print(f"∫[0,2] x dx = {integral2}")  # → 2

# === 数值计算（用 numpy）===
import numpy as np

# 数值求导（近似）
def numerical_derivative(f, x, h=1e-5):
    """用差分近似导数"""
    return (f(x + h) - f(x - h)) / (2 * h)  # 中心差分

# 测试：f(x) = x² 在 x=3 处的导数
f = lambda x: x**2
x_val = 3
deriv_approx = numerical_derivative(f, x_val)
print(f"x² 在 x=3 处的数值导数 ≈ {deriv_approx:.4f}")  # → 6.0000
print(f"理论值 = {2 * x_val}")  # → 6
```

> ⚠️ 注意：符号计算（sympy）给出精确结果，数值计算（numpy）是近似值。AI 中常用数值方法。

---

## 4 对比表格

| 概念 | 数学符号 | 几何意义 | AI 中的应用 |
| --- | --- | --- | --- |
| 极限 | lim f(x) | 无限接近的值 | 收敛性分析 |
| 连续 | f(a) = lim f(x) | 图像不断开 | 函数性质保证 |
| 导数 | f'(x) | 切线斜率 | 梯度下降方向 |
| 偏导数 | ∂f/∂x | 多元函数对 x 的变化率 | 多维参数更新 |
| 不定积分 | ∫f(x)dx | 原函数 | 概率累积 |
| 定积分 | ∫[a,b]f(x)dx | 曲线下面积 | 总损失计算 |

---

## 5 新手常见误区

### 误区 1："导数就是斜率，所以一定是正数"

**错！** 导数可以是负数、零、甚至不存在：

```python
# 导数的符号表示变化方向
# f'(x) > 0 → 函数递增（上坡）
# f'(x) < 0 → 函数递减（下坡）
# f'(x) = 0 → 极值点（山顶或谷底）

import sympy as sp
x = sp.Symbol('x')

# 例：f(x) = -x²（开口向下的抛物线）
f = -x**2
df = sp.diff(f, x)  # f'(x) = -2x

print(f"f'(1) = {df.subs(x, 1)}")   # → -2（负数，递减）
print(f"f'(0) = {df.subs(x, 0)}")   # → 0（极值点）
print(f"f'(-1) = {df.subs(x, -1)}") # → 2（正数，递增）
```

### 误区 2："积分就是求面积，所以结果一定是正数"

**错！** 定积分可以是负数（曲线在 x 轴下方时）：

```python
import sympy as sp
x = sp.Symbol('x')

# 例：∫[-1,1] x dx
# x 在 [-1,0] 是负的，在 [0,1] 是正的
# 正负抵消，结果是 0
integral = sp.integrate(x, (x, -1, 1))
print(f"∫[-1,1] x dx = {integral}")  # → 0

# 例：∫[0,1] -x dx（曲线在 x 轴下方）
integral2 = sp.integrate(-x, (x, 0, 1))
print(f"∫[0,1] -x dx = {integral2}")  # → -1/2（负数）
```

### 误区 3："AI 训练只需要导数，不需要积分"

**错！** 积分在概率和损失计算中也很重要：

```python
# 概率密度函数的积分 = 1
# 例：正态分布的概率密度
import numpy as np
from scipy import integrate

# 正态分布 N(0,1) 的概率密度函数
def normal_pdf(x):
    return (1/np.sqrt(2*np.pi)) * np.exp(-x**2/2)

# 积分从 -∞ 到 +∞ 应该等于 1
result, error = integrate.quad(normal_pdf, -np.inf, np.inf)
print(f"正态分布的积分 = {result:.4f}")  # → 1.0000

# 损失函数的积分 = 总损失（连续情况）
```

### 误区 4："链式法则很复杂，AI 里用不到"

**错！** 链式法则是反向传播的核心：

```python
# 链式法则：如果 y = f(g(x))，则 dy/dx = dy/du · du/dx
# 其中 u = g(x)

# 例：y = sin(x²)
# 令 u = x²，则 y = sin(u)
# dy/du = cos(u) = cos(x²)
# du/dx = 2x
# dy/dx = cos(x²) · 2x

# 在神经网络中：
# 损失 L 关于权重 w 的梯度
# ∂L/∂w = ∂L/∂y · ∂y/∂z · ∂z/∂w
# 这就是链式法则的层层传递！
```

---

## 6 动手练习

### 练习 1：求极限

用 sympy 求以下极限：
1. lim (x²-4)/(x-2) 当 x→2
2. lim sin(x)/x 当 x→0
3. lim (1+1/x)^x 当 x→∞

<details>
<summary>点击查看答案</summary>

```python
import sympy as sp

x = sp.Symbol('x')

# 1. lim (x²-4)/(x-2) 当 x→2
f1 = (x**2 - 4) / (x - 2)
limit1 = sp.limit(f1, x, 2)
print(f"lim (x²-4)/(x-2) = {limit1}")  # → 4
# 解析：(x²-4)/(x-2) = (x+2)(x-2)/(x-2) = x+2 → 4

# 2. lim sin(x)/x 当 x→0
f2 = sp.sin(x) / x
limit2 = sp.limit(f2, x, 0)
print(f"lim sin(x)/x = {limit2}")  # → 1
# 这是重要极限！

# 3. lim (1+1/x)^x 当 x→∞
f3 = (1 + 1/x)**x
limit3 = sp.limit(f3, x, sp.oo)
print(f"lim (1+1/x)^x = {limit3}")  # → e
# 这是自然对数的底 e ≈ 2.71828
```

</details>

### 练习 2：求导数

用 sympy 求以下函数的导数：
1. f(x) = x³ + 2x² - 5x + 1
2. f(x) = e^x · cos(x)
3. f(x) = ln(x² + 1)

<details>
<summary>点击查看答案</summary>

```python
import sympy as sp

x = sp.Symbol('x')

# 1. f(x) = x³ + 2x² - 5x + 1
f1 = x**3 + 2*x**2 - 5*x + 1
df1 = sp.diff(f1, x)
print(f"f'(x) = {df1}")  # → 3*x**2 + 4*x - 5

# 2. f(x) = e^x · cos(x)（乘法法则）
f2 = sp.exp(x) * sp.cos(x)
df2 = sp.diff(f2, x)
print(f"f'(x) = {df2}")  # → exp(x)*cos(x) - exp(x)*sin(x)
# 化简：e^x(cos(x) - sin(x))

# 3. f(x) = ln(x² + 1)（链式法则）
f3 = sp.log(x**2 + 1)
df3 = sp.diff(f3, x)
print(f"f'(x) = {df3}")  # → 2*x/(x**2 + 1)
```

</details>

### 练习 3（挑战）：导数在梯度下降中的应用

用 Python 实现简单的梯度下降，求 f(x) = x² 的最小值点。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

# 目标函数：f(x) = x²
def f(x):
    return x**2

# 导数：f'(x) = 2x
def df(x):
    return 2 * x

# 梯度下降参数
learning_rate = 0.1  # 学习率（步长）
num_iterations = 20  # 迭代次数
x = 5.0  # 初始值

print("梯度下降过程：")
print(f"初始值：x = {x}, f(x) = {f(x):.4f}")

for i in range(num_iterations):
    gradient = df(x)  # 计算梯度（导数）
    x = x - learning_rate * gradient  # 更新 x（往反方向走）
    print(f"第 {i+1} 步：x = {x:.4f}, f(x) = {f(x):.4f}")

print(f"\n最终结果：x ≈ {x:.4f}, f(x) ≈ {f(x):.6f}")
# 应该接近 x=0, f(x)=0（最小值点）

# 原理解释：
# 1. 导数 f'(x) = 2x 告诉我们函数上升的方向
# 2. 我们要最小化 f(x)，所以往反方向走：x = x - lr * f'(x)
# 3. 每次迭代，x 都会更接近 0（最小值点）
```

</details>

---

## 7 核心知识点总结

| 知识点 | 要点 |
| --- | --- |
| 极限 | 无限接近的思想，是微积分的基础 |
| 连续 | 函数图像不断开，极限值 = 函数值 |
| 导数 | 瞬时变化率，几何意义是切线斜率 |
| 求导法则 | 幂函数、指数、对数、链式法则 |
| 不定积分 | 求原函数，导数的逆运算 |
| 定积分 | 曲线下面积，牛顿-莱布尼茨公式 |
| AI 应用 | 导数用于梯度下降，积分用于概率和损失 |

---

## 下一章预告

下一章我们会学习 **多元微积分与梯度**——AI 优化的引擎。你会学到偏导数、梯度、链式法则在反向传播中的核心作用，这些是理解神经网络训练的关键。
