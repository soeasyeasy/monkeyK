---
title: "第7章：函数初步——变量之间的关系"
description: "函数概念、一次函数、二次函数、反比例函数、函数图像，理解 AI 的输入输出映射"
---

# 第7章：函数初步——变量之间的关系

## 本章导读

前面我们学了代数式和方程，这一章要进入一个更强大的工具——**函数**。在学这一章之前，你可能会有这些疑问：

- 函数不就是 f(x) 吗？编程里 function 早就用过了，有什么好学的？
- 一次函数、二次函数、反比例函数，名字这么多，怎么记得住？
- 函数图像画出来有什么用？AI 需要画图吗？
- 函数跟 AI 到底有什么关系？

其实，**AI 模型本质上就是一个超级复杂的函数**。你输入一张图片，输出"这是猫"的概率；你输入一段文字，输出下一句话——这些都是函数关系。这一章，我们要把"函数"这个概念彻底搞明白。

---

## 1 为什么需要函数？

### 痛点分析

假设你要做一个 AI 温度转换器（摄氏度 → 华氏度）：

- 用算术：0°C = 32°F，10°C = 50°F，20°C = 68°F……
- 每个温度都要写一个算式——累不累？
- 如果用户输入 37.5°C 呢？你要现算？

再比如 AI 场景：

- 你有一个模型，输入特征 x，输出预测值 y
- 不同的 x 对应不同的 y，这个对应关系怎么表达？→ 用**函数**！
- 你想可视化模型的行为，怎么画？→ 用**函数图像**！

打个比方：

> 函数就像"自动售货机"——你投币（输入 x），它出货（输出 y）。
> 每个输入 x 都有唯一确定的输出 y，这就是函数的核心。

### 代码对比：没有函数 vs 用函数

```python
# ❌ 没有函数思维：每次都要重写算式
celsius = 0
fahrenheit = celsius * 9/5 + 32
print(f"{celsius}°C = {fahrenheit}°F")

celsius = 10
fahrenheit = celsius * 9/5 + 32  # 重复代码！
print(f"{celsius}°C = {fahrenheit}°F")

celsius = 37.5
fahrenheit = celsius * 9/5 + 32  # 又重复！
print(f"{celsius}°C = {fahrenheit}°F")

# ✅ 用函数思维：定义一次，反复使用
def celsius_to_fahrenheit(c):    # 定义函数
    return c * 9/5 + 32          # 输入 c，输出 f

print(f"{0}°C = {celsius_to_fahrenheit(0)}°F")      # → 32.0
print(f"{10}°C = {celsius_to_fahrenheit(10)}°F")    # → 50.0
print(f"{37.5}°C = {celsius_to_fahrenheit(37.5)}°F") # → 99.5
```

### 函数在 AI 中的角色

| 函数类型 | AI 中的应用场景 |
| --- | --- |
| 函数概念 | 模型 = 输入→输出的映射 |
| 一次函数 | 线性回归、全连接层 |
| 二次函数 | 损失函数（MSE）、二次规划 |
| 反比例函数 | 学习率衰减、注意力机制 |
| 函数图像 | 可视化损失曲线、决策边界 |

---

## 2 核心原理

### 2.1 函数的概念

函数描述的是"两个变量之间的对应关系"。

```
定义：
  如果对于 x 的每一个值，y 都有唯一确定的值与之对应，
  那么 y 就是 x 的函数，记作 y = f(x)

三个要素：
  1. 自变量 x（输入）
  2. 因变量 y（输出）
  3. 对应法则 f（规则）

例 1：y = 2x + 1
  x = 0 → y = 1
  x = 1 → y = 3
  x = 2 → y = 5
  每个 x 都有唯一的 y 对应 ✅

例 2：y² = x（不是函数！）
  x = 4 → y = 2 或 y = -2
  一个 x 对应两个 y ❌ 不是函数
```

> 打个比方：函数就像"一对一服务"——每个顾客（x）都有一个专属服务员（y），不能一个顾客对应多个服务员。

### 2.2 一次函数

形如 `y = kx + b`（k ≠ 0）的函数。

```
标准形式：y = kx + b
  k：斜率（倾斜程度）
  b：截距（与 y 轴的交点）

图像特点：
  - 一条直线
  - k > 0 → 直线向上倾斜（y 随 x 增大而增大）
  - k < 0 → 直线向下倾斜（y 随 x 增大而减小）
  - b > 0 → 直线与 y 轴交于正半轴
  - b < 0 → 直线与 y 轴交于负半轴

例 1：y = 2x + 1
  k = 2（斜率，向上倾斜）
  b = 1（截距，与 y 轴交于 (0, 1)）

例 2：y = -x + 3
  k = -1（向下倾斜）
  b = 3（与 y 轴交于 (0, 3)）
```

| 斜率 k | 截距 b | 图像特征 |
| --- | --- | --- |
| k > 0 | b > 0 | 向上倾斜，交 y 轴正半轴 |
| k > 0 | b < 0 | 向上倾斜，交 y 轴负半轴 |
| k < 0 | b > 0 | 向下倾斜，交 y 轴正半轴 |
| k < 0 | b < 0 | 向下倾斜，交 y 轴负半轴 |

### 2.3 二次函数

形如 `y = ax² + bx + c`（a ≠ 0）的函数。

```
标准形式：y = ax² + bx + c
  a：开口方向和宽窄
  b：对称轴位置
  c：与 y 轴的交点

图像特点：
  - 一条抛物线
  - a > 0 → 开口向上（U 形）
  - a < 0 → 开口向下（倒 U 形）
  - 对称轴：x = -b/(2a)
  - 顶点：(-b/(2a), (4ac-b²)/(4a))

例 1：y = x² - 4x + 3
  a = 1（开口向上）
  对称轴：x = -(-4)/(2×1) = 2
  顶点：(2, -1)

例 2：y = -x² + 2x + 1
  a = -1（开口向下）
  对称轴：x = -2/(2×(-1)) = 1
  顶点：(1, 2)
```

> 打个比方：二次函数就像"抛球轨迹"——球抛出去，上升到最高点，再落下来。顶点就是最高点（或最低点）。

### 2.4 反比例函数

形如 `y = k/x`（k ≠ 0）的函数。

```
标准形式：y = k/x 或 y = k·x⁻¹
  k：比例常数

图像特点：
  - 双曲线（两支）
  - k > 0 → 图像在第一、三象限
  - k < 0 → 图像在第二、四象限
  - 关于原点对称
  - 无限接近坐标轴但永远不相交（渐近线）

例 1：y = 6/x
  k = 6 > 0 → 第一、三象限
  x = 1 → y = 6
  x = 2 → y = 3
  x = 3 → y = 2

例 2：y = -4/x
  k = -4 < 0 → 第二、四象限
  x = -1 → y = 4
  x = -2 → y = 2
```

| 函数类型 | 标准形式 | 图像 | AI 中的应用 |
| --- | --- | --- | --- |
| 一次函数 | y = kx + b | 直线 | 线性回归 |
| 二次函数 | y = ax² + bx + c | 抛物线 | 损失函数 |
| 反比例函数 | y = k/x | 双曲线 | 学习率衰减 |

---

## 3 基础用法

```python
import numpy as np
import matplotlib.pyplot as plt

# === 一次函数：y = 2x + 1 ===
def linear_func(x):          # 定义一次函数
    return 2 * x + 1         # y = 2x + 1

# 计算几个点
x_vals = np.array([-2, -1, 0, 1, 2])  # 5 个 x 值
y_vals = linear_func(x_vals)          # 对应的 y 值
print("一次函数 y = 2x + 1:")
for x, y in zip(x_vals, y_vals):
    print(f"  x={x:2d} → y={y:2d}")

# === 二次函数：y = x² - 4x + 3 ===
def quadratic_func(x):       # 定义二次函数
    return x**2 - 4 * x + 3  # y = x² - 4x + 3

x_vals = np.array([0, 1, 2, 3, 4])
y_vals = quadratic_func(x_vals)
print("\n二次函数 y = x² - 4x + 3:")
for x, y in zip(x_vals, y_vals):
    print(f"  x={x} → y={y}")

# ✅ 正确做法：用 numpy 数组一次性计算所有点
# ❌ 错误做法：用 for 循环逐个计算（慢！）

# === 反比例函数：y = 6/x ===
def inverse_func(x):         # 定义反比例函数
    return 6 / x             # y = 6/x

x_vals = np.array([1, 2, 3, 6])
y_vals = inverse_func(x_vals)
print("\n反比例函数 y = 6/x:")
for x, y in zip(x_vals, y_vals):
    print(f"  x={x} → y={y:.1f}")

# === 函数图像可视化 ===
# 生成 100 个连续的 x 值
x_plot = np.linspace(-5, 5, 100)  # 从 -5 到 5，100 个点

# 计算对应的 y 值
y_linear = linear_func(x_plot)      # 一次函数
y_quadratic = quadratic_func(x_plot) # 二次函数

# 画图
plt.figure(figsize=(10, 4))

plt.subplot(1, 2, 1)              # 第一个子图
plt.plot(x_plot, y_linear, 'b-', label='y = 2x + 1')
plt.title('一次函数')
plt.xlabel('x')
plt.ylabel('y')
plt.grid(True)
plt.legend()

plt.subplot(1, 2, 2)              # 第二个子图
plt.plot(x_plot, y_quadratic, 'r-', label='y = x² - 4x + 3')
plt.title('二次函数')
plt.xlabel('x')
plt.ylabel('y')
plt.grid(True)
plt.legend()

plt.tight_layout()
plt.show()
```

---

## 4 对比表格

| 函数类型 | 标准形式 | 图像形状 | 关键参数 | AI 中的应用 |
| --- | --- | --- | --- | --- |
| 一次函数 | y = kx + b | 直线 | 斜率 k、截距 b | 线性回归、全连接层 |
| 二次函数 | y = ax² + bx + c | 抛物线 | 开口 a、对称轴 -b/2a | MSE 损失函数 |
| 反比例函数 | y = k/x | 双曲线 | 比例常数 k | 学习率衰减、注意力 |

---

## 5 新手常见误区

### 误区 1："函数一定要有公式"

**错！** 函数只需要"输入→输出"的对应关系，不一定要有公式。

```python
# ✅ 这也是函数
def ai_model(image):         # 输入一张图片
    # 内部可能是几百万个参数
    # 但你不需要知道公式
    return "猫"              # 输出类别

# AI 模型就是函数：输入图片，输出预测
# 即使你不知道内部怎么算，只要输入确定，输出就确定
```

### 误区 2："一次函数的斜率 k 可以是 0"

**错！** k = 0 就不是函数了，变成常数函数。

```python
# ❌ 错误认知
# y = 0x + 3 = 3
# 这不是函数，是常数 y = 3（每个 x 都对应同一个 y）

# ✅ 正确理解
# 一次函数要求 k ≠ 0
# k = 0 时，退化为常数函数，不是一次函数
```

### 误区 3："二次函数的顶点一定是最低点"

**错！** 要看开口方向。

```python
# a > 0：开口向上，顶点是最低点
# y = x² - 4x + 3，a = 1 > 0
# 顶点 (2, -1) 是最低点

# a < 0：开口向下，顶点是最高点
# y = -x² + 2x + 1，a = -1 < 0
# 顶点 (1, 2) 是最高点

def check_vertex(a, b, c):
    x_vertex = -b / (2 * a)
    y_vertex = a * x_vertex**2 + b * x_vertex + c
    position = "最低点" if a > 0 else "最高点"
    print(f"y = {a}x² + {b}x + {c}, 顶点 ({x_vertex}, {y_vertex}) 是{position}")

check_vertex(1, -4, 3)   # → 最低点
check_vertex(-1, 2, 1)   # → 最高点
```

### 误区 4："反比例函数可以过原点"

**错！** 反比例函数在 x = 0 处没有定义。

```python
# y = 6/x
# x = 0 时，分母为 0，无意义！

# ✅ 正确理解
# 反比例函数的图像无限接近坐标轴，但永远不相交
# x = 0 和 y = 0 是渐近线

# Python 验证
try:
    y = 6 / 0              # 除以 0
except ZeroDivisionError as e:
    print(f"错误：{e}")    # → division by zero
```

### 误区 5："函数图像一定要画出来才有用"

**不是！** 函数图像只是可视化工具，很多场景不需要画图。

```python
# AI 训练中，我们更关心函数的数值性质：
# - 单调性（损失是否下降）
# - 极值点（最优参数在哪）
# - 连续性（梯度是否稳定）

# 这些性质可以通过数学分析得到，不一定要画图
def check_monotonic(func, x_range):
    """检查函数在区间内是否单调递增"""
    x_vals = np.linspace(x_range[0], x_range[1], 100)
    y_vals = func(x_vals)
    diffs = np.diff(y_vals)          # 相邻 y 值的差
    return np.all(diffs > 0)         # 所有差都 > 0 则单调递增

# 检查 y = 2x + 1 在 [-5, 5] 是否单调递增
print(f"一次函数单调递增？{check_monotonic(linear_func, [-5, 5])}")  # → True
```

---

## 6 动手练习

### 练习 1：一次函数求值

已知一次函数 `y = 3x - 2`，求 x = -1, 0, 2, 5 时的 y 值。

<details>
<summary>点击查看答案</summary>

```python
def linear_func(x):          # 定义一次函数
    return 3 * x - 2         # y = 3x - 2

# 代入不同的 x 值
x_vals = [-1, 0, 2, 5]
for x in x_vals:
    y = linear_func(x)
    print(f"x={x:2d} → y={y:2d}")

# 输出：
# x=-1 → y=-5
# x= 0 → y=-2
# x= 2 → y= 4
# x= 5 → y=13
```

</details>

### 练习 2：二次函数顶点

求二次函数 `y = 2x² - 8x + 6` 的顶点坐标，并判断是最高点还是最低点。

<details>
<summary>点击查看答案</summary>

```python
a, b, c = 2, -8, 6           # 二次函数系数

# 顶点公式：x = -b/(2a)
x_vertex = -b / (2 * a)      # x = 8/4 = 2
y_vertex = a * x_vertex**2 + b * x_vertex + c  # 代入求 y

print(f"顶点坐标：({x_vertex}, {y_vertex})")  # → (2.0, -2.0)

# 判断最高点还是最低点
if a > 0:
    print("开口向上，顶点是最低点")
else:
    print("开口向下，顶点是最高点")
# → 开口向上，顶点是最低点 ✅
```

</details>

### 练习 3（挑战）：函数图像分析

画出反比例函数 `y = 12/x` 的图像，并验证它经过点 (3, 4) 和 (-2, -6)。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
import matplotlib.pyplot as plt

def inverse_func(x):         # 定义反比例函数
    return 12 / x            # y = 12/x

# 验证点 (3, 4)
x1, y1 = 3, 4
print(f"点 ({x1}, {y1}): y = 12/{x1} = {inverse_func(x1)}, 相等？{inverse_func(x1) == y1}")
# → y = 4.0, 相等？True ✅

# 验证点 (-2, -6)
x2, y2 = -2, -6
print(f"点 ({x2}, {y2}): y = 12/{x2} = {inverse_func(x2)}, 相等？{inverse_func(x2) == y2}")
# → y = -6.0, 相等？True ✅

# 画图像
x_plot = np.linspace(-10, 10, 400)  # 400 个点
# 避开 x = 0
x_plot = x_plot[x_plot != 0]
y_plot = inverse_func(x_plot)

plt.figure(figsize=(6, 6))
plt.plot(x_plot, y_plot, 'g-', label='y = 12/x')
plt.scatter([3, -2], [4, -6], color='red', zorder=5)  # 标记验证的点
plt.axhline(y=0, color='k', linestyle='-', linewidth=0.5)  # x 轴
plt.axvline(x=0, color='k', linestyle='-', linewidth=0.5)  # y 轴
plt.title('反比例函数 y = 12/x')
plt.xlabel('x')
plt.ylabel('y')
plt.grid(True)
plt.legend()
plt.show()
```

</details>

---

## 7 核心知识点总结

| 知识点 | 要点 |
| --- | --- |
| 函数概念 | 输入 x → 唯一输出 y 的对应关系 |
| 一次函数 | y = kx + b，图像是直线，k 是斜率 |
| 二次函数 | y = ax² + bx + c，图像是抛物线，a 决定开口 |
| 反比例函数 | y = k/x，图像是双曲线，x=0 无定义 |
| 函数图像 | 可视化工具，帮助理解函数性质 |
| AI 意义 | 模型 = 函数，输入→输出的映射 |

---

## 8 下一章预告

下一章我们要进入 **概率与统计进阶**——条件概率、古典概型、频率与概率。你会学到 AI 分类任务背后的概率原理，比如"给定一张图片，它是猫的概率是多少"。这是理解贝叶斯分类、朴素贝叶斯等 AI 算法的基础！
