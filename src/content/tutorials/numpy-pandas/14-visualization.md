---
title: "第14章：Pandas 数据可视化"
description: "掌握 Pandas 内置绑图与 Matplotlib 集成"
---

# 第14章：Pandas 数据可视化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么需要数据可视化？看表格不行吗？
- Pandas 不是处理数据的吗？还能画图？
- Matplotlib 是什么？和 Pandas 有什么关系？
- 图表中文乱码怎么解决？

这一章就是为了解答这些问题。数据可视化是数据分析的重要环节，一图胜千言，好的图表能让数据"说话"。

---

## 1 为什么需要数据可视化？

### 痛点分析

假设你有一份月度销售数据，老板问你："销售趋势怎么样？"

```python
# ❌ 只看数字表格：很难发现规律
月份  销售额
1月   10000
2月   12000
3月   15000
4月   18000
5月   22000
6月   25000
```

看表格时，你需要在脑子里想象趋势，很难直观感受到"销售额在稳步上升"。

```python
# ✅ 画成折线图：一目了然
import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame({
    '月份': ['1月', '2月', '3月', '4月', '5月', '6月'],
    '销售额': [10000, 12000, 15000, 18000, 22000, 25000]
})

df.plot(x='月份', y='销售额', kind='line', marker='o')
plt.title('月度销售趋势')
plt.ylabel('销售额（元）')
plt.show()
# 一张折线图，清晰展示销售额逐月上升的趋势
```

> 一句话总结：可视化让数据"说话"，一眼看出趋势、异常和规律。

### 生活化类比

打个比方：

> 看数据表格就像看一篇长文章，需要逐字阅读才能理解。
> 看图表就像看一张照片，瞬间就能抓住重点。
> 人类的大脑天生对图像更敏感，可视化就是利用这个特点。

### 代码对比

| 方式 | 理解难度 | 发现规律 | 展示效果 |
| --- | --- | --- | --- |
| 纯数字表格 | 难 | 慢 | 差 |
| 可视化图表 | 易 | 快 | 好 |

---

## 2 核心原理：Pandas 与 Matplotlib

### 通俗类比

Pandas 和 Matplotlib 的关系就像：

```
Pandas 是"数据管家" —— 负责整理和处理数据
Matplotlib 是"画家" —— 负责把数据画成图表
Pandas 内置了 Matplotlib 的接口 —— 可以直接用 df.plot() 画图
```

### 对比表格：绑图工具

| 工具 | 说明 | 类比 |
| --- | --- | --- |
| df.plot() | Pandas 内置绑图方法 | 快速绑图，一行代码 |
| plt.plot() | Matplotlib 底层方法 | 精细控制，灵活但复杂 |
| plt.show() | 显示图表 | 把画好的图展示给你看 |
| plt.savefig() | 保存图表 | 把画好的图存成文件 |

### 对比表格：常用图表类型

| 图表类型 | Pandas 代码 | 适用场景 | 示例 |
| --- | --- | --- | --- |
| 折线图 | kind='line' | 趋势分析 | 销售趋势、股价走势 |
| 柱状图 | kind='bar' | 对比分析 | 各部门业绩对比 |
| 饼图 | kind='pie' | 占比分析 | 市场份额分布 |
| 散点图 | kind='scatter' | 关系分析 | 身高体重关系 |
| 直方图 | kind='hist' | 分布分析 | 成绩分布 |
| 箱线图 | kind='box' | 异常检测 | 数据分布和异常值 |
| 面积图 | kind='area' | 累积趋势 | 累积销售额 |

---

## 3 基础用法

### 折线图

```python
import pandas as pd
import matplotlib.pyplot as plt

# 设置中文字体（解决中文乱码问题）
plt.rcParams['font.sans-serif'] = ['SimHei']  # Windows 用黑体
plt.rcParams['axes.unicode_minus'] = False     # 解决负号显示问题

# 创建数据
df = pd.DataFrame({
    '月份': ['1月', '2月', '3月', '4月', '5月', '6月'],
    '销售额': [10000, 12000, 15000, 18000, 22000, 25000]
})

# 画折线图
df.plot(x='月份', y='销售额', kind='line', marker='o', color='blue')
# x='月份'        横坐标用月份列
# y='销售额'      纵坐标用销售额列
# kind='line'     图表类型：折线图
# marker='o'      数据点标记：圆圈
# color='blue'    线条颜色：蓝色

plt.title('月度销售趋势')   # 设置标题
plt.xlabel('月份')          # 设置横坐标标签
plt.ylabel('销售额（元）')  # 设置纵坐标标签
plt.grid(True)              # 显示网格线
plt.show()                  # 显示图表
```

### 柱状图

```python
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建数据
df = pd.DataFrame({
    '部门': ['技术', '市场', '人事', '财务'],
    '人数': [30, 20, 10, 15]
})

# 画柱状图
df.plot(x='部门', y='人数', kind='bar', color='green')
# kind='bar'      图表类型：柱状图

plt.title('各部门人数对比')
plt.xlabel('部门')
plt.ylabel('人数')
plt.xticks(rotation=0)  # 横坐标标签不旋转
plt.show()

# 水平柱状图
df.plot(x='部门', y='人数', kind='barh', color='orange')
# kind='barh'     水平柱状图（horizontal bar）
plt.title('各部门人数对比（水平）')
plt.show()
```

### 饼图

```python
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建数据
df = pd.DataFrame({
    '产品': ['手机', '电脑', '平板', '配件'],
    '销售额': [50000, 30000, 15000, 5000]
})

# 画饼图
df.plot(x='产品', y='销售额', kind='pie', autopct='%1.1f%%', figsize=(8, 8))
# kind='pie'          图表类型：饼图
# autopct='%1.1f%%'   显示百分比，保留1位小数
# figsize=(8, 8)      图表大小：8x8 英寸

plt.title('各产品销售额占比')
plt.ylabel('')  # 饼图不需要纵坐标标签
plt.show()
```

### 散点图

```python
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建数据
df = pd.DataFrame({
    '身高': [160, 165, 170, 175, 180, 185],
    '体重': [50, 55, 60, 65, 70, 75]
})

# 画散点图
df.plot(x='身高', y='体重', kind='scatter', color='red', s=100)
# kind='scatter'    图表类型：散点图
# s=100             点的大小

plt.title('身高体重关系图')
plt.xlabel('身高（cm）')
plt.ylabel('体重（kg）')
plt.grid(True)
plt.show()
```

### 直方图

```python
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建数据（100个学生的成绩，正态分布）
np.random.seed(42)  # 设置随机种子，保证结果可复现
scores = np.random.normal(75, 10, 100)  # 均值75，标准差10，100个数据
df = pd.DataFrame({'成绩': scores})

# 画直方图
df['成绩'].plot(kind='hist', bins=10, color='skyblue', edgecolor='black')
# kind='hist'       图表类型：直方图
# bins=10           分成10个区间
# edgecolor='black' 每个柱子的边框颜色

plt.title('学生成绩分布')
plt.xlabel('成绩')
plt.ylabel('人数')
plt.show()
```

### 箱线图

```python
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建数据
df = pd.DataFrame({
    'A班': [85, 90, 78, 92, 88, 95, 70, 100, 82, 87],
    'B班': [75, 80, 85, 90, 78, 82, 88, 76, 79, 81],
    'C班': [90, 95, 88, 92, 85, 98, 93, 89, 91, 94]
})

# 画箱线图
df.plot(kind='box', figsize=(8, 6))
# kind='box'        图表类型：箱线图

plt.title('各班成绩分布对比')
plt.ylabel('成绩')
plt.grid(True, axis='y')
plt.show()

# 箱线图解读：
# - 箱体中间线：中位数
# - 箱体上下边：第75百分位和第25百分位
# - 须线：最大值和最小值（排除异常值）
# - 点：异常值
```

---

## 4 进阶用法

### 样式定制

```python
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

df = pd.DataFrame({
    '月份': ['1月', '2月', '3月', '4月', '5月'],
    '销售额': [10000, 12000, 15000, 18000, 22000],
    '利润': [2000, 2500, 3000, 3500, 4500]
})

# 自定义样式
ax = df.plot(x='月份', y=['销售额', '利润'], kind='bar', 
             color=['#FF6B6B', '#4ECDC4'],  # 自定义颜色
             figsize=(10, 6),                # 图表大小
             width=0.6)                      # 柱子宽度

plt.title('月度销售额和利润对比', fontsize=16, fontweight='bold')  # 标题样式
plt.xlabel('月份', fontsize=12)     # 横坐标标签
plt.ylabel('金额（元）', fontsize=12)  # 纵坐标标签
plt.xticks(fontsize=10)             # 横坐标刻度字体
plt.yticks(fontsize=10)             # 纵坐标刻度字体
plt.legend(fontsize=10)             # 图例
plt.grid(True, axis='y', alpha=0.3) # 网格线，透明度0.3
plt.tight_layout()                  # 自动调整布局
plt.show()
```

### 子图布局

```python
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建数据
df = pd.DataFrame({
    '月份': ['1月', '2月', '3月', '4月', '5月', '6月'],
    '销售额': [10000, 12000, 15000, 18000, 22000, 25000],
    '利润': [2000, 2500, 3000, 3500, 4500, 5000]
})

# 创建 2x2 的子图布局
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
# 2, 2             2行2列，共4个子图
# figsize=(12, 10)  整个图表大小

# 子图1：折线图
axes[0, 0].plot(df['月份'], df['销售额'], marker='o', color='blue')
axes[0, 0].set_title('销售趋势')
axes[0, 0].set_ylabel('销售额')

# 子图2：柱状图
axes[0, 1].bar(df['月份'], df['利润'], color='green')
axes[0, 1].set_title('月度利润')
axes[0, 1].set_ylabel('利润')

# 子图3：饼图
axes[1, 0].pie(df['销售额'], labels=df['月份'], autopct='%1.1f%%')
axes[1, 0].set_title('销售额占比')

# 子图4：散点图
axes[1, 1].scatter(df['销售额'], df['利润'], color='red', s=100)
axes[1, 1].set_title('销售额与利润关系')
axes[1, 1].set_xlabel('销售额')
axes[1, 1].set_ylabel('利润')

plt.tight_layout()  # 自动调整子图间距
plt.show()
```

### 保存图表

```python
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

df = pd.DataFrame({
    '月份': ['1月', '2月', '3月', '4月', '5月'],
    '销售额': [10000, 12000, 15000, 18000, 22000]
})

# 画图
df.plot(x='月份', y='销售额', kind='bar')
plt.title('月度销售趋势')

# 保存图表
plt.savefig('sales_chart.png', dpi=300, bbox_inches='tight')
# 'sales_chart.png'   文件名
# dpi=300              分辨率（越高越清晰）
# bbox_inches='tight'  去除多余空白

plt.show()
print("图表已保存为 sales_chart.png")
```

---

## 5 对比表格

### Pandas 绑图 vs Matplotlib 绑图

| 特性 | df.plot() | plt.plot() |
| --- | --- | --- |
| 代码量 | 少（一行） | 多（需要多行） |
| 灵活度 | 低 | 高 |
| 适用场景 | 快速探索数据 | 精细定制图表 |
| 学习难度 | 低 | 高 |
| 底层实现 | 调用 Matplotlib | 直接使用 Matplotlib |

### 常用 Matplotlib 方法

| 方法 | 作用 | 示例 |
| --- | --- | --- |
| plt.title() | 设置标题 | plt.title('销售趋势') |
| plt.xlabel() | 设置横坐标标签 | plt.xlabel('月份') |
| plt.ylabel() | 设置纵坐标标签 | plt.ylabel('销售额') |
| plt.xticks() | 设置横坐标刻度 | plt.xticks(rotation=45) |
| plt.yticks() | 设置纵坐标刻度 | plt.yticks([0, 5000, 10000]) |
| plt.legend() | 显示图例 | plt.legend() |
| plt.grid() | 显示网格 | plt.grid(True) |
| plt.show() | 显示图表 | plt.show() |
| plt.savefig() | 保存图表 | plt.savefig('chart.png') |
| plt.subplots() | 创建子图 | fig, axes = plt.subplots(2, 2) |

---

## 6 新手常见误区

### 误区 1："忘记调用 plt.show()"

画完图必须调用 plt.show() 才能显示：

```python
# ❌ 错误：画了图但不显示
df.plot(x='月份', y='销售额', kind='line')
# 图表不会显示！

# ✅ 正确：画完后调用 show()
df.plot(x='月份', y='销售额', kind='line')
plt.show()  # 这行不能少！
```

### 误区 2："中文显示为方框"

Matplotlib 默认不支持中文，需要设置中文字体：

```python
# ❌ 错误：直接写中文
plt.title('销售趋势')  # 显示为方框

# ✅ 正确：先设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']  # Windows 用黑体
plt.rcParams['axes.unicode_minus'] = False     # 解决负号问题
plt.title('销售趋势')  # 现在可以正常显示中文了
```

### 误区 3："图表重叠或显示不全"

多个子图或标签太多时，容易出现重叠：

```python
# ❌ 错误：标签重叠
plt.xticks(rotation=0)  # 横坐标标签不旋转，可能重叠

# ✅ 正确：旋转标签或使用 tight_layout
plt.xticks(rotation=45)  # 旋转45度
plt.tight_layout()       # 自动调整布局，避免重叠
```

### 误区 4："不知道选什么图表类型"

不同数据适合不同图表：

```python
# 趋势分析 → 折线图
df.plot(kind='line')

# 对比分析 → 柱状图
df.plot(kind='bar')

# 占比分析 → 饼图
df.plot(kind='pie')

# 关系分析 → 散点图
df.plot(kind='scatter')

# 分布分析 → 直方图
df.plot(kind='hist')
```

---

## 7 动手练习

### 练习 1（基础）：折线图

创建一个包含 7 天温度的 DataFrame，画一条折线图，要求：
- 标题："一周温度变化"
- 横坐标：星期
- 纵坐标：温度（摄氏度）
- 显示数据点标记

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import matplotlib.pyplot as plt

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建数据
df = pd.DataFrame({
    '星期': ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    '温度': [22, 24, 23, 25, 27, 26, 24]
})

# 画折线图
df.plot(x='星期', y='温度', kind='line', marker='o', color='orange')
plt.title('一周温度变化')
plt.xlabel('星期')
plt.ylabel('温度（°C）')
plt.grid(True)
plt.show()
```

</details>

### 练习 2（进阶）：多图表对比

创建一个包含两个产品月度销售的 DataFrame，画两个子图：
- 子图1：两个产品的销售趋势折线图
- 子图2：两个产品的销售对比柱状图

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建数据
df = pd.DataFrame({
    '月份': ['1月', '2月', '3月', '4月', '5月'],
    '产品A': [100, 120, 150, 180, 200],
    '产品B': [80, 100, 130, 160, 190]
})

# 创建 1x2 的子图
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# 子图1：折线图
axes[0].plot(df['月份'], df['产品A'], marker='o', label='产品A')
axes[0].plot(df['月份'], df['产品B'], marker='s', label='产品B')
axes[0].set_title('销售趋势对比')
axes[0].set_xlabel('月份')
axes[0].set_ylabel('销售额')
axes[0].legend()
axes[0].grid(True)

# 子图2：柱状图
x = range(len(df['月份']))
width = 0.35
axes[1].bar([i - width/2 for i in x], df['产品A'], width, label='产品A')
axes[1].bar([i + width/2 for i in x], df['产品B'], width, label='产品B')
axes[1].set_title('销售额对比')
axes[1].set_xlabel('月份')
axes[1].set_ylabel('销售额')
axes[1].set_xticks(x)
axes[1].set_xticklabels(df['月份'])
axes[1].legend()

plt.tight_layout()
plt.show()
```

</details>

### 练习 3（挑战）：综合可视化

有一份销售数据，要求：
1. 画一个 2x2 的子图
2. 包含折线图、柱状图、饼图、散点图
3. 每个子图都有标题和坐标标签
4. 保存为 PNG 文件

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建数据
df = pd.DataFrame({
    '月份': ['1月', '2月', '3月', '4月', '5月', '6月'],
    '销售额': [10000, 12000, 15000, 18000, 22000, 25000],
    '利润': [2000, 2500, 3000, 3500, 4500, 5000],
    '成本': [8000, 9500, 12000, 14500, 17500, 20000]
})

# 创建 2x2 子图
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 子图1：销售趋势折线图
axes[0, 0].plot(df['月份'], df['销售额'], marker='o', color='blue')
axes[0, 0].set_title('月度销售趋势')
axes[0, 0].set_xlabel('月份')
axes[0, 0].set_ylabel('销售额')
axes[0, 0].grid(True)

# 子图2：利润柱状图
axes[0, 1].bar(df['月份'], df['利润'], color='green')
axes[0, 1].set_title('月度利润')
axes[0, 1].set_xlabel('月份')
axes[0, 1].set_ylabel('利润')

# 子图3：销售额饼图
axes[1, 0].pie(df['销售额'], labels=df['月份'], autopct='%1.1f%%', 
               colors=['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'])
axes[1, 0].set_title('销售额占比')

# 子图4：销售额与利润散点图
axes[1, 1].scatter(df['销售额'], df['利润'], color='red', s=100)
axes[1, 1].set_title('销售额与利润关系')
axes[1, 1].set_xlabel('销售额')
axes[1, 1].set_ylabel('利润')
axes[1, 1].grid(True)

plt.tight_layout()

# 保存图表
plt.savefig('sales_analysis.png', dpi=300, bbox_inches='tight')
print("图表已保存为 sales_analysis.png")

plt.show()
```

</details>

---

## 8 下一章预告

下一章我们会学习 **Pandas 文件读写**。你会学到如何读取 CSV、Excel、JSON 文件，以及如何把数据保存到这些格式中。掌握文件读写，你就能处理真实世界的数据了。
