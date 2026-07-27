---
title: "第4章：Matplotlib 数据可视化"
description: "掌握图表创建、图形定制和统计可视化"
---

# 第4章：Matplotlib 数据可视化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么需要数据可视化？
- Matplotlib 是什么？和 Seaborn 有什么区别？
- 如何创建折线图、柱状图、散点图？
- 如何定制图表样式？

这一章就是为了解答这些问题。数据可视化是 AI 项目的"眼睛"，帮你发现数据中的规律。

---

## 1 为什么需要数据可视化？

### 痛点分析

假设你有一组数据，光看数字很难发现规律：

```python
data = [10, 15, 13, 18, 25, 30, 28, 35, 40, 38]
# 光看这串数字，你能发现趋势吗？
```

**可视化之后**：

```python
import matplotlib.pyplot as plt
plt.plot(data)
plt.show()
# 一眼就能看出：数据在上升！
```

> **一句话总结**：可视化让数据"说话"。

### 生活化类比

打个比方：

> 看数据就像看体检报告的數字，可视化就像看医生画的图表。
> 图表让你一眼看出健康问题，数据可视化让你一眼看出数据规律。

---

## 2 核心原理：Figure 和 Axes

### 概念解释

Matplotlib 的图表由两个核心概念组成：

```
Figure（画布）
└── Axes（子图）
    ├── XAxis（X轴）
    ├── YAxis（Y轴）
    ├── Title（标题）
    └── Plot（图表内容）
```

| 概念 | 说明 | 类比 |
| --- | --- | --- |
| Figure | 整个图表窗口 | 画布 |
| Axes | 子图（可以多个） | 画布上的画 |
| Axis | 坐标轴 | 画的边框 |

---

## 3 基础用法

### 折线图

```python
import matplotlib.pyplot as plt
import numpy as np

# 设置中文字体（Windows）
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 数据
x = np.arange(0, 10, 0.1)  # 0到10，步长0.1
y = np.sin(x)               # 正弦函数

# 创建图表
plt.figure(figsize=(10, 6))  # 设置画布大小
plt.plot(x, y, label='sin(x)', color='blue', linewidth=2)  # 画折线图

# 添加标题和标签
plt.title('正弦函数曲线')
plt.xlabel('x')
plt.ylabel('y')
plt.legend()  # 显示图例
plt.grid(True)  # 显示网格

# 显示图表
plt.show()
```

### 柱状图

```python
import matplotlib.pyplot as plt

# 数据
categories = ['技术', '市场', '销售', '人事']
salaries = [20000, 18000, 15000, 16000]

# 创建柱状图
plt.figure(figsize=(8, 5))
plt.bar(categories, salaries, color='skyblue', edgecolor='black')

# 添加标题和标签
plt.title('各部门平均薪资')
plt.xlabel('部门')
plt.ylabel('薪资（元）')

# 在柱子上添加数值标签
for i, (cat, sal) in enumerate(zip(categories, salaries)):
    plt.text(i, sal + 500, f'{sal}', ha='center', va='bottom')

plt.show()
```

### 散点图

```python
import matplotlib.pyplot as plt
import numpy as np

# 生成随机数据
np.random.seed(42)
x = np.random.rand(100) * 10
y = 2 * x + np.random.randn(100) * 2  # y = 2x + 噪声

# 创建散点图
plt.figure(figsize=(8, 6))
plt.scatter(x, y, c='red', alpha=0.6, s=50)  # alpha 透明度，s 点大小

# 添加标题和标签
plt.title('身高与体重关系')
plt.xlabel('身高（标准化）')
plt.ylabel('体重（标准化）')

# 添加趋势线
z = np.polyfit(x, y, 1)  # 一次多项式拟合
p = np.poly1d(z)
plt.plot(x, p(x), 'b--', linewidth=2, label='趋势线')
plt.legend()

plt.show()
```

---

## 4 进阶用法

### 多子图

```python
import matplotlib.pyplot as plt
import numpy as np

# 创建 2x2 的子图
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 数据
x = np.linspace(0, 10, 100)

# 子图1：折线图
axes[0, 0].plot(x, np.sin(x), 'r-')
axes[0, 0].set_title('正弦函数')
axes[0, 0].set_xlabel('x')
axes[0, 0].set_ylabel('sin(x)')

# 子图2：柱状图
categories = ['A', 'B', 'C', 'D']
values = [3, 7, 2, 5]
axes[0, 1].bar(categories, values, color='green')
axes[0, 1].set_title('柱状图')

# 子图3：散点图
x_rand = np.random.rand(50)
y_rand = np.random.rand(50)
axes[1, 0].scatter(x_rand, y_rand, c='purple', alpha=0.5)
axes[1, 0].set_title('散点图')

# 子图4：直方图
data = np.random.randn(1000)
axes[1, 1].hist(data, bins=30, color='orange', edgecolor='black')
axes[1, 1].set_title('直方图')

# 调整布局
plt.tight_layout()
plt.show()
```

### 饼图

```python
import matplotlib.pyplot as plt

# 数据
labels = ['技术', '市场', '销售', '人事']
sizes = [40, 25, 20, 15]
colors = ['gold', 'lightgreen', 'lightcoral', 'lightskyblue']
explode = (0.1, 0, 0, 0)  # 突出显示第一块

# 创建饼图
plt.figure(figsize=(8, 8))
plt.pie(sizes, explode=explode, labels=labels, colors=colors,
        autopct='%1.1f%%', shadow=True, startangle=90)

plt.title('公司人员分布')
plt.axis('equal')  # 保证饼图是圆的
plt.show()
```

### 保存图表

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.arange(0, 10, 0.1)
y = np.sin(x)

plt.figure(figsize=(8, 5))
plt.plot(x, y)
plt.title('正弦函数')

# 保存为不同格式
plt.savefig('sine_curve.png', dpi=300, bbox_inches='tight')  # PNG，高分辨率
plt.savefig('sine_curve.pdf', bbox_inches='tight')           # PDF
plt.savefig('sine_curve.svg', bbox_inches='tight')           # SVG

plt.show()
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Figure | 整个图表窗口 |
| Axes | 子图，可以多个排列 |
| plot | 折线图 |
| bar/barh | 柱状图/水平柱状图 |
| scatter | 散点图 |
| hist | 直方图 |
| pie | 饼图 |
| subplots | 创建多子图 |
| savefig | 保存图表为文件 |

---

## 6 新手常见误区

### 误区 1："不设置中文字体会乱码"

**对！** Matplotlib 默认不支持中文，需要手动设置：

```python
# ❌ 错误：中文显示为方块
plt.title('中文标题')  # 显示为 □□□□

# ✅ 正确：设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']  # Windows
plt.rcParams['axes.unicode_minus'] = False     # 解决负号显示问题
plt.title('中文标题')  # 正常显示
```

### 误区 2："plt.show() 后可以继续添加元素"

不是的。`plt.show()` 会显示并清空当前图表：

```python
# ❌ 错误
plt.plot([1, 2, 3])
plt.show()
plt.title('标题')  # 不会显示，图表已经清空

# ✅ 正确
plt.plot([1, 2, 3])
plt.title('标题')
plt.show()
```

### 误区 3："图表样式不能定制"

Matplotlib 提供丰富的样式定制：

```python
# 使用内置样式
plt.style.use('ggplot')  # ggplot 风格
plt.style.use('seaborn')  # seaborn 风格
plt.style.use('dark_background')  # 深色背景

# 查看所有可用样式
print(plt.style.available)
```

---

## 7 动手练习

### 练习 1：基础练习

创建一个折线图，展示某城市一周的温度变化。

<details>
<summary>点击查看答案</summary>

```python
import matplotlib.pyplot as plt
import numpy as np

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']

# 数据
days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
temperatures = [22, 24, 23, 26, 28, 27, 25]

# 创建折线图
plt.figure(figsize=(10, 5))
plt.plot(days, temperatures, marker='o', linewidth=2, markersize=8)

# 添加标题和标签
plt.title('一周温度变化')
plt.xlabel('星期')
plt.ylabel('温度（°C）')
plt.grid(True, alpha=0.3)

# 在每个点上标注温度
for i, temp in enumerate(temperatures):
    plt.text(i, temp + 0.5, f'{temp}°', ha='center')

plt.show()
```

</details>

### 练习 2：进阶练习

创建一个包含 4 个子图的图表，分别展示折线图、柱状图、散点图和饼图。

<details>
<summary>点击查看答案</summary>

```python
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams['font.sans-serif'] = ['SimHei']

# 创建 2x2 子图
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 子图1：折线图
x = np.linspace(0, 10, 100)
axes[0, 0].plot(x, np.sin(x), 'r-')
axes[0, 0].set_title('折线图：正弦函数')

# 子图2：柱状图
categories = ['A', 'B', 'C', 'D']
values = [25, 40, 30, 55]
axes[0, 1].bar(categories, values, color='skyblue')
axes[0, 1].set_title('柱状图')

# 子图3：散点图
x_rand = np.random.rand(50) * 10
y_rand = 2 * x_rand + np.random.randn(50) * 2
axes[1, 0].scatter(x_rand, y_rand, c='green', alpha=0.6)
axes[1, 0].set_title('散点图')

# 子图4：饼图
labels = ['优', '良', '差']
sizes = [60, 30, 10]
axes[1, 1].pie(sizes, labels=labels, autopct='%1.1f%%')
axes[1, 1].set_title('饼图')

plt.tight_layout()
plt.show()
```

</details>

### 练习 3（挑战）：综合练习

用 Matplotlib 可视化一个完整的机器学习结果：原始数据散点图 + 拟合直线 + 残差图。

<details>
<summary>点击查看答案</summary>

```python
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams['font.sans-serif'] = ['SimHei']

# 生成数据
np.random.seed(42)
x = np.linspace(0, 10, 50)
y_true = 2 * x + 5
y = y_true + np.random.randn(50) * 3  # 添加噪声

# 线性拟合
coeffs = np.polyfit(x, y, 1)
y_pred = np.polyval(coeffs, x)

# 计算残差
residuals = y - y_pred

# 创建 1x2 子图
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 左图：原始数据 + 拟合直线
axes[0].scatter(x, y, c='blue', alpha=0.6, label='原始数据')
axes[0].plot(x, y_pred, 'r-', linewidth=2, label=f'拟合直线: y={coeffs[0]:.2f}x+{coeffs[1]:.2f}')
axes[0].set_title('数据拟合')
axes[0].set_xlabel('x')
axes[0].set_ylabel('y')
axes[0].legend()
axes[0].grid(True, alpha=0.3)

# 右图：残差图
axes[1].scatter(x, residuals, c='green', alpha=0.6)
axes[1].axhline(y=0, color='r', linestyle='--', linewidth=2)
axes[1].set_title('残差分析')
axes[1].set_xlabel('x')
axes[1].set_ylabel('残差')
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('regression_analysis.png', dpi=300)
plt.show()
```

</details>

---

## 下一章预告

下一章我们会学习 **机器学习基础概念**——什么是监督学习、无监督学习，如何评估模型。这些是进入机器学习世界的敲门砖。
