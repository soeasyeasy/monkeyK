---
title: "第11章：三角函数——周期与波动"
description: "三角函数定义、三角恒等式、正弦定理、余弦定理，以及三角函数在信号处理、傅里叶变换中的应用"
---

# 第11章：三角函数——周期与波动

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 正弦、余弦、正切是什么？跟 AI 有什么关系？
- 三角函数除了算三角形，还能干嘛？
- 傅里叶变换听起来很高大上，三角函数怎么跟它扯上关系？
- 为什么 AI 的位置编码要用三角函数？

这一章带你理解"周期与波动"的数学语言。三角函数不只是算三角形——它是描述周期性现象的核心工具，从音频信号到 AI 的位置编码，处处都有它的身影。

---

## 1 为什么需要三角函数？

### 痛点分析

假设你要用 AI 处理音频信号：

- 一段声音信号是随时间波动的，怎么描述这种波动？→ 需要**三角函数**
- 怎么把复杂的声音分解成简单的波形？→ 需要**傅里叶变换**（核心是三角函数）
- 怎么让 AI 理解"第 1 个词"和"第 2 个词"的位置不同？→ 需要**位置编码**（用正弦余弦）

打个比方：

> 三角函数就像"心跳图"——描述周期性波动的最佳工具。
> 傅里叶变换就像"拆礼物"——把复杂的信号拆成一个个简单的正弦波。

### 三角函数在 AI 中的角色

| 三角函数知识 | AI 中的应用场景 |
| --- | --- |
| 正弦/余弦 | 位置编码（Transformer）|
| 周期性 | 时间序列分析、音频处理 |
| 傅里叶变换 | 信号处理、图像压缩 |
| 三角恒等式 | 简化公式推导 |

---

## 2 核心原理

### 2.1 三角函数的定义

```
直角三角形中的三角函数：

  对于一个直角三角形，设某个角为 θ（不是直角）：
  
  sin(θ) = 对边 / 斜边     // 正弦
  cos(θ) = 邻边 / 斜边     // 余弦
  tan(θ) = 对边 / 邻边     // 正切

  生活化理解：
    假设你站在山坡上，坡角是 θ：
    - sin(θ) = 你爬升的高度 / 你走过的斜坡距离
    - cos(θ) = 你水平前进的距离 / 你走过的斜坡距离
    - tan(θ) = 你爬升的高度 / 你水平前进的距离（坡度）

特殊角的三角函数值：
  θ = 0°:   sin=0,    cos=1,    tan=0
  θ = 30°:  sin=1/2,  cos=√3/2, tan=√3/3
  θ = 45°:  sin=√2/2, cos=√2/2, tan=1
  θ = 60°:  sin=√3/2, cos=1/2,  tan=√3
  θ = 90°:  sin=1,    cos=0,    tan=无定义

单位圆定义（更通用）：
  在单位圆（半径=1）上，角度 θ 对应的点坐标是 (cos θ, sin θ)
  
  这样三角函数就不局限于直角三角形了，可以描述任意角度
```

> 打个比方：三角函数就像"方向盘"——sin 和 cos 告诉你转了多少度，tan 告诉你转的陡峭程度。

### 2.2 三角函数的图像与性质

```
正弦函数 y = sin(x)：
  - 周期：2π（每 2π 重复一次）
  - 值域：[-1, 1]
  - 图像：波浪形，从 0 开始，先升后降
  - 应用：描述简谐振动、交流电

余弦函数 y = cos(x)：
  - 周期：2π
  - 值域：[-1, 1]
  - 图像：和 sin 一样，只是向左平移了 π/2
  - 关系：cos(x) = sin(x + π/2)

正切函数 y = tan(x)：
  - 周期：π
  - 值域：(-∞, +∞)
  - 图像：有垂直渐近线（x = π/2 + kπ 处断开）
  - 应用：描述斜率、增长率

周期性的重要性：
  很多自然现象都是周期的：
  - 昼夜交替（周期 24 小时）
  - 四季轮回（周期 1 年）
  - 心跳（周期约 0.8 秒）
  - 交流电（周期 0.02 秒，频率 50Hz）
  
  三角函数是描述周期现象的"标准语言"
```

### 2.3 三角恒等式

```
基本恒等式（必须记住）：

  sin²(θ) + cos²(θ) = 1          // 勾股定理的三角形式
  tan(θ) = sin(θ) / cos(θ)       // 正切的定义

和角公式：
  sin(α + β) = sin α cos β + cos α sin β
  cos(α + β) = cos α cos β - sin α sin β

二倍角公式：
  sin(2θ) = 2 sin θ cos θ
  cos(2θ) = cos²θ - sin²θ = 2cos²θ - 1 = 1 - 2sin²θ

生活化理解：
  这些公式就像"拼图规则"——告诉你怎么把复杂的角拆成简单的角
```

### 2.4 正弦定理与余弦定理

```
正弦定理（适用于任意三角形）：
  a/sin A = b/sin B = c/sin C = 2R
  
  其中 a, b, c 是三角形的三条边，A, B, C 是对应的对角，R 是外接圆半径
  
  用途：已知两角一边，求其他边

余弦定理（勾股定理的推广）：
  c² = a² + b² - 2ab·cos C
  
  当 C = 90° 时，cos C = 0，退化为勾股定理：c² = a² + b²
  
  用途：已知三边求角，或已知两边及夹角求第三边

生活化理解：
  余弦定理就像"GPS 定位"——知道两个距离和夹角，算出第三个距离
```

---

## 3 基础用法

```python
import numpy as np
import math

# === 三角函数计算 ===
# ✅ 正确：用 math.sin, math.cos, math.tan（弧度制）
angle_deg = 30                          # 角度 30°
angle_rad = math.radians(angle_deg)     # 转换为弧度

sin_val = math.sin(angle_rad)           # sin(30°)
cos_val = math.cos(angle_rad)           # cos(30°)
tan_val = math.tan(angle_rad)           # tan(30°)

print(f"sin(30°) = {sin_val:.4f}")      # → 0.5000
print(f"cos(30°) = {cos_val:.4f}")      # → 0.8660
print(f"tan(30°) = {tan_val:.4f}")      # → 0.5774

# ❌ 错误：直接传角度给三角函数
# math.sin(30)   # 错！math.sin 接受的是弧度，不是角度
# 正确做法：先转弧度 math.radians(30) 或 30 * math.pi / 180

# === 验证基本恒等式 ===
theta = math.pi / 4                     # 45° = π/4 弧度
lhs = math.sin(theta)**2 + math.cos(theta)**2  # sin²θ + cos²θ
rhs = 1.0
print(f"sin²(45°) + cos²(45°) = {lhs:.4f}")   # → 1.0000
print(f"验证恒等式：{abs(lhs - rhs) < 1e-10}") # → True

# === 生成正弦波 ===
# AI 中常用：生成位置编码、信号处理
t = np.linspace(0, 2*np.pi, 100)        # 0 到 2π，100 个点
y = np.sin(t)                           # sin(t) 的值

print(f"正弦波前 5 个点: {y[:5]}")
# → [0., 0.0634, 0.1266, 0.1893, 0.2506]

# === AI 中的位置编码（Transformer 用）===
# ✅ 正确：用正弦余弦生成位置编码
def positional_encoding(position, d_model):
    """生成位置编码（简化版）"""
    pe = np.zeros(d_model)              # 初始化位置编码向量
    for i in range(d_model):
        if i % 2 == 0:                  # 偶数维度用 sin
            pe[i] = np.sin(position / (10000 ** (i / d_model)))
        else:                           # 奇数维度用 cos
            pe[i] = np.cos(position / (10000 ** (i / d_model)))
    return pe

pos_0 = positional_encoding(0, 8)       # 第 0 个位置的编码
pos_1 = positional_encoding(1, 8)       # 第 1 个位置的编码

print(f"位置 0 的编码: {pos_0}")
print(f"位置 1 的编码: {pos_1}")
# 不同位置有不同的编码，AI 能区分"第几个词"

# === 余弦定理应用 ===
# 已知三角形两边 a=5, b=7，夹角 C=60°，求第三边 c
a = 5
b = 7
C_deg = 60
C_rad = math.radians(C_deg)

c_squared = a**2 + b**2 - 2*a*b*math.cos(C_rad)  # 余弦定理
c = math.sqrt(c_squared)

print(f"第三边 c = {c:.2f}")            # → 6.24
```

---

## 4 对比表格

| 函数 | 公式 | 周期 | 值域 | AI 中的应用 |
| --- | --- | --- | --- | --- |
| sin(x) | 对边/斜边 | 2π | [-1, 1] | 位置编码、信号处理 |
| cos(x) | 邻边/斜边 | 2π | [-1, 1] | 位置编码、傅里叶变换 |
| tan(x) | sin/cos | π | (-∞, +∞) | 斜率计算 |
| sin²+cos² | = 1 | - | - | 归一化、验证 |
| 正弦定理 | a/sinA = 2R | - | - | 几何计算 |
| 余弦定理 | c²=a²+b²-2ab·cosC | - | - | 距离计算 |

---

## 5 新手常见误区

### 误区 1："三角函数的参数是角度"

Python 的三角函数用弧度，不是角度：

```python
import math

# ✅ 正确：先转弧度
angle_deg = 90
angle_rad = math.radians(angle_deg)     # 90° → π/2
result = math.sin(angle_rad)            # → 1.0

# ❌ 错误：直接传角度
# math.sin(90)   # → 0.894（错！）
# 因为 90 弧度 ≈ 5156°，不是 90°
```

### 误区 2："sin 和 cos 只在直角三角形中有用"

不是的，三角函数可以描述任意周期现象：

```python
import numpy as np
import matplotlib.pyplot as plt

# 生成时间序列（如一天的温度变化）
hours = np.linspace(0, 24, 100)         # 0 到 24 小时
# 假设温度呈周期性变化：白天高，晚上低
temperature = 20 + 5 * np.sin(2 * np.pi * hours / 24 - np.pi/2)
# 20 是平均温度，5 是波动幅度，24 是周期

print(f"中午 12 点的温度: {temperature[50]:.1f}°C")
# → 约 25°C（一天中最热的时候）
```

### 误区 3："傅里叶变换很复杂，学不会"

傅里叶变换的核心就是三角函数：

```
傅里叶变换的思想：
  任何复杂的周期信号 = 多个简单正弦波的叠加
  
  就像"调色盘"：
  - 红色 + 绿色 + 蓝色 = 各种颜色
  - 低频正弦 + 中频正弦 + 高频正弦 = 复杂信号
  
  公式：F(ω) = Σ f(t) · e^(-iωt)
  其中 e^(-iωt) = cos(ωt) - i·sin(ωt)（欧拉公式）
  
  本质：用 sin 和 cos 去"匹配"信号中的频率成分
```

### 误区 4："位置编码必须用三角函数"

三角函数是常用方法，但不是唯一方法：

```python
# 方法 1：三角函数位置编码（Transformer 原版）
# 优点：能外推到未见过的序列长度
pe_sin = np.sin(position / (10000 ** (i / d_model)))

# 方法 2：学习式位置编码（BERT 等）
# 把位置编码当成可学习的参数
# embedding_table = np.random.randn(max_len, d_model)

# 方法 3：旋转位置编码（RoPE，LLaMA 用）
# 也是基于三角函数，但更巧妙
```

---

## 6 动手练习

### 练习 1：计算三角函数值

计算下列值（用 Python）：

1. sin(45°)
2. cos(60°)
3. tan(30°)

<details>
<summary>点击查看答案</summary>

```python
import math

# 1. sin(45°)
sin_45 = math.sin(math.radians(45))
print(f"sin(45°) = {sin_45:.4f}")  # → 0.7071（即 √2/2）

# 2. cos(60°)
cos_60 = math.cos(math.radians(60))
print(f"cos(60°) = {cos_60:.4f}")  # → 0.5000（即 1/2）

# 3. tan(30°)
tan_30 = math.tan(math.radians(30))
print(f"tan(30°) = {tan_30:.4f}")  # → 0.5774（即 √3/3）
```

</details>

### 练习 2：验证三角恒等式

验证 sin²(θ) + cos²(θ) = 1 对于 θ = 30°, 45°, 60° 都成立。

<details>
<summary>点击查看答案</summary>

```python
import math

angles = [30, 45, 60]  # 三个角度

for deg in angles:
    rad = math.radians(deg)              # 转弧度
    sin_val = math.sin(rad)
    cos_val = math.cos(rad)
    
    lhs = sin_val**2 + cos_val**2        # sin²θ + cos²θ
    print(f"θ={deg}°: sin²+cos² = {lhs:.10f}")
    # 三个都接近 1.0000000000（浮点误差范围内）
```

</details>

### 练习 3（挑战）：实现简单的位置编码

实现一个函数，输入位置 position 和维度 d_model，输出位置编码向量。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np

def positional_encoding(position, d_model):
    """
    生成位置编码（Transformer 风格）
    position: 位置索引（第几个词）
    d_model: 编码维度（模型维度）
    """
    pe = np.zeros(d_model)               # 初始化编码向量
    
    for i in range(d_model):
        # 计算分母：10000^(i/d_model)
        div_term = 10000 ** (i / d_model)
        
        if i % 2 == 0:                   # 偶数维度用 sin
            pe[i] = np.sin(position / div_term)
        else:                            # 奇数维度用 cos
            pe[i] = np.cos(position / div_term)
    
    return pe

# 测试
pe_0 = positional_encoding(0, 16)        # 第 0 个位置
pe_1 = positional_encoding(1, 16)        # 第 1 个位置
pe_5 = positional_encoding(5, 16)        # 第 5 个位置

print(f"位置 0 的编码（前 4 维）: {pe_0[:4]}")
print(f"位置 1 的编码（前 4 维）: {pe_1[:4]}")
print(f"位置 5 的编码（前 4 维）: {pe_5[:4]}")
# 不同位置有不同的编码，AI 能区分词的顺序
```

</details>

---

## 7 核心知识点总结

| 知识点 | 要点 |
| --- | --- |
| 三角函数定义 | sin=对边/斜边，cos=邻边/斜边，tan=对边/邻边 |
| 弧度制 | Python 三角函数用弧度，不是角度 |
| 周期性 | sin 和 cos 周期 2π，tan 周期 π |
| 基本恒等式 | sin²θ + cos²θ = 1 |
| 和角公式 | 把复杂角拆成简单角 |
| 正弦定理 | 已知两角一边求其他边 |
| 余弦定理 | 已知三边求角，或已知两边夹角求第三边 |
| 傅里叶变换 | 用正弦波分解复杂信号 |
| 位置编码 | Transformer 用 sin/cos 表示位置 |

---

## 8 下一章预告

下一章是**数列、排列组合与极限**。你会学到等差数列、等比数列、排列组合和极限思想。这些知识在 AI 的迭代算法、概率计算和理论分析中非常重要。准备好了吗？