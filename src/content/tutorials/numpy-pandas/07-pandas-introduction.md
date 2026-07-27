---
title: "第7章：Pandas 简介与安装"
description: "了解 Pandas 的核心价值与在数据科学中的地位"
---

# 第7章：Pandas 简介与安装

## 本章导读

在正式开始学习 Pandas 之前，你可能会有这些疑问：

1. Pandas 到底是什么？它和 NumPy 有什么区别？
2. 我已经会 NumPy 了，为什么还要学 Pandas？
3. Pandas 安装复杂吗？需要哪些前置依赖？
4. Pandas 在实际工作中到底能帮我解决什么问题？

如果你带着这些问题，那恭喜你，这章就是为你准备的。读完本章后，你会清楚地知道 Pandas 的定位、价值和安装方式，为后续章节打下坚实基础。

---

## 为什么需要 Pandas

### 痛点分析

假设你是一个电商运营，手头有一份 1000 行的订单数据（包含订单号、商品名、金额、日期等），你需要完成以下任务：

- 筛选出金额大于 500 的订单
- 按商品名分组，计算每个商品的总销售额
- 把结果导出为 Excel 文件

用纯 Python 怎么做？你需要写大量的 for 循环、字典操作、手动统计，代码可能超过 100 行，还容易出错。

用 NumPy 呢？NumPy 擅长数值计算，但它处理"混合类型"的表格数据（有字符串、有日期、有数字）非常别扭，因为 NumPy 数组要求所有元素类型一致。

### 生活化类比

把 Pandas 想象成 **Python 版的 Excel**，但比 Excel 强大得多：

- Excel 有行有列，Pandas 的 DataFrame 也是有行有列的表格
- Excel 可以用公式筛选、排序、汇总，Pandas 可以用代码做同样的事，而且速度快几个数量级
- Excel 处理几十万行数据会卡死，Pandas 轻松应对
- Excel 的操作是手动点击，Pandas 的操作是可复用的代码，写一次就能反复执行

### 代码对比

看看同一个任务，纯 Python 和 Pandas 的写法差异：

**纯 Python 方式 -- 筛选金额大于 500 的订单并求和**

```python
# 原始数据是一个列表，每个元素是字典
orders = [
    {"name": "手机", "amount": 2999},
    {"name": "耳机", "amount": 199},
    {"name": "电脑", "amount": 5999},
]

# 手动筛选
high_amount_orders = []  # 创建一个空列表来存放结果
for order in orders:     # 遍历每一条订单
    if order["amount"] > 500:  # 判断金额是否大于 500
        high_amount_orders.append(order)  # 满足条件就加入结果列表

# 手动求和
total = 0                      # 初始化总和为 0
for order in high_amount_orders:  # 遍历筛选后的结果
    total += order["amount"]      # 累加金额

print(f"总金额: {total}")  # 输出总金额
```

**Pandas 方式 -- 同样的任务**

```python
import pandas as pd  # 导入 pandas 库，简写为 pd

# 创建 DataFrame（表格数据）
df = pd.DataFrame(orders)  # 把列表直接转成表格

# 一行代码完成筛选
result = df[df["amount"] > 500]  # 筛选金额大于 500 的行

# 一行代码完成求和
total = result["amount"].sum()  # 对筛选后的金额列求和

print(f"总金额: {total}")  # 输出总金额
```

看到了吗？Pandas 把几十行代码压缩到了几行，而且读起来更像自然语言。

---

## 核心原理讲解

### Pandas 是什么

Pandas 是 Python 中最流行的数据分析和处理库，它提供了两个核心数据结构：

- **Series**：一维带标签的数组（类似一列 Excel 数据）
- **DataFrame**：二维表格数据（类似整个 Excel 工作表）

通俗类比：如果 NumPy 是一把精密的尺子（擅长数值计算），那 Pandas 就是一个完整的数据工具箱，它内部用 NumPy 做计算引擎，但在外面包了一层"表格操作"的接口，让你可以像操作 Excel 一样操作数据。

### Pandas 在数据科学工作流中的位置

一个典型的数据科学项目流程如下：

```
数据获取 --> 数据清洗 --> 数据分析 --> 数据可视化 --> 建模/报告
   |            |            |              |
 爬虫/DB     Pandas       Pandas      Matplotlib
 CSV/Excel   (核心工具)   (核心工具)    /Seaborn
```

Pandas 承担了"数据清洗"和"数据分析"两个最耗时的环节，是数据科学工作流中的核心枢纽。

### Pandas 与 NumPy 的关系

Pandas 是建立在 NumPy 之上的，它内部使用 NumPy 数组来存储数据，但提供了更高层次的抽象：

- NumPy 的数组叫 `ndarray`，Pandas 的叫 `Series` 和 `DataFrame`
- NumPy 用数字索引（0, 1, 2...），Pandas 可以用自定义标签索引（"name", "age"...）
- NumPy 要求所有元素同类型，Pandas 的每列可以有不同的数据类型

### 对比表格：NumPy vs Pandas

| 对比维度 | NumPy | Pandas |
|---------|-------|--------|
| 核心数据结构 | ndarray（多维数组） | Series（一维）、DataFrame（二维） |
| 数据类型 | 要求所有元素类型一致 | 每列可以有不同的数据类型 |
| 索引方式 | 只能用数字索引（0, 1, 2...） | 支持自定义标签索引 |
| 擅长场景 | 数值计算、矩阵运算 | 表格数据处理、数据清洗 |
| 处理缺失值 | 不擅长（需要手动处理） | 内置缺失值处理功能 |
| 数据合并 | 需要手动操作 | 提供 merge、concat 等便捷方法 |
| 学习曲线 | 需要了解数组和广播机制 | 类似 Excel，上手更简单 |
| 性能 | 数值计算极快 | 表格操作方便，底层依赖 NumPy |

---

## 基础用法与安装

### 安装 Pandas

安装非常简单，打开终端执行：

```bash
# 使用 pip 安装 pandas（推荐）
pip install pandas

# 如果需要特定版本，可以指定版本号
pip install pandas==2.0.0

# 验证是否安装成功
python -c "import pandas; print(pandas.__version__)"
```

### 基础代码示例

```python
# 导入 pandas 库，这是约定俗成的简写方式
import pandas as pd

# 导入 numpy 库，pandas 依赖 numpy
import numpy as np

# 创建一个简单的 DataFrame（表格）
df = pd.DataFrame({
    "name": ["小明", "小红", "小刚"],    # 姓名列
    "age": [25, 30, 28],                # 年龄列
    "city": ["北京", "上海", "广州"],     # 城市列
})

# 查看表格前几行（默认前 5 行）
print(df.head())

# 查看表格的基本信息（行数、列名、数据类型等）
print(df.info())

# 查看数值列的统计摘要（计数、均值、标准差、最小值、最大值等）
print(df.describe())

# 访问某一列（返回 Series）
print(df["name"])        # 获取姓名列

# 访问多列（返回 DataFrame）
print(df[["name", "age"]])  # 获取姓名和年龄两列

# 筛选数据：找出年龄大于 26 的人
print(df[df["age"] > 26])   # 条件筛选

# 新增一列
df["salary"] = [15000, 20000, 18000]  # 添加薪数列

# 删除一列
df = df.drop("salary", axis=1)  # 删除薪数列，axis=1 表示按列删除
```

### 常见操作速览

```python
# 创建 DataFrame 的几种方式

# 方式一：用字典创建（最常用）
df1 = pd.DataFrame({
    "A": [1, 2, 3],      # A 列数据
    "B": [4, 5, 6],      # B 列数据
})

# 方式二：从列表创建
df2 = pd.DataFrame([
    [1, 2, 3],            # 第一行数据
    [4, 5, 6],            # 第二行数据
], columns=["A", "B", "C"])  # 指定列名

# 方式三：从 NumPy 数组创建
arr = np.random.rand(4, 3)  # 生成 4 行 3 列的随机数组
df3 = pd.DataFrame(arr, columns=["X", "Y", "Z"])  # 用数组创建 DataFrame

# 方式四：从 CSV 文件读取（实际工作中最常用）
# df4 = pd.read_csv("data.csv")  # 读取 CSV 文件

# 方式五：从 Excel 文件读取
# df5 = pd.read_excel("data.xlsx")  # 读取 Excel 文件
```

---

## 对比表格：Pandas 核心概念速查

| 概念 | 说明 | 类比 |
|------|------|------|
| DataFrame | 二维表格，有行索引和列名 | Excel 工作表 |
| Series | 一维带标签的数组 | Excel 中的某一列 |
| Index | 行索引标签 | Excel 左侧的行号 |
| Column | 列名标签 | Excel 顶部的列名 |
| dtype | 每列的数据类型 | Excel 中单元格格式（文本/数字/日期） |
| NaN | 缺失值标记 | Excel 中的空白单元格 |

---

## 新手常见误区

### 误区一：觉得学了 NumPy 就不需要 Pandas

NumPy 和 Pandas 不是替代关系，而是互补关系。NumPy 是底层计算引擎，Pandas 是上层数据操作工具。实际工作中，两者通常配合使用。你不需要"二选一"，而是两个都要会。

### 误区二：Pandas 只能处理小数据

Pandas 处理几十万行甚至上百万行的数据完全没问题。对于更大的数据，可以使用 Dask（Pandas 的分布式版本）或者 PySpark。但对于日常数据分析，Pandas 的性能绰绰有余。

### 误区三：安装时忽略 NumPy 依赖

Pandas 依赖 NumPy，安装 Pandas 时 pip 会自动安装 NumPy。但如果你手动管理环境，要注意版本兼容性。建议直接用 `pip install pandas`，让 pip 自动处理依赖。

### 误区四：导入时写错名称

```python
# 错误写法
import Pandas  # 错误：Python 区分大小写，pandas 是小写

# 正确写法
import pandas as pd  # 正确：小写 pandas，约定简写为 pd
```

### 误区五：以为 Pandas 很慢

Pandas 的底层是 NumPy（C 语言实现），对于常规数据分析任务，速度非常快。如果你觉得慢，通常是因为写法不够优化（比如用了 for 循环而不是向量化操作），而不是 Pandas 本身慢。

---

## 动手练习

### 练习 1：基础（安装与创建）

安装 Pandas，并创建一个包含以下数据的 DataFrame：

| 学生 | 语文 | 数学 |
|------|------|------|
| 张三 | 85 | 92 |
| 李四 | 78 | 88 |
| 王五 | 90 | 95 |

然后打印出这个表格，并查看它的基本信息。

<details>
<summary>点击查看答案</summary>

```python
# 导入 pandas 库
import pandas as pd

# 用字典创建 DataFrame
df = pd.DataFrame({
    "学生": ["张三", "李四", "王五"],   # 学生姓名列
    "语文": [85, 78, 90],              # 语文成绩列
    "数学": [92, 88, 95],              # 数学成绩列
})

# 打印表格
print(df)

# 查看基本信息
print(df.info())

# 查看统计摘要（数值列）
print(df.describe())
```

</details>

### 练习 2：进阶（数据筛选）

在练习 1 的基础上，完成以下任务：

1. 筛选出数学成绩大于 90 分的学生
2. 计算所有学生的语文平均分和数学平均分
3. 新增一列"总分"，等于语文 + 数学

<details>
<summary>点击查看答案</summary>

```python
# 导入 pandas 库
import pandas as pd

# 创建数据
df = pd.DataFrame({
    "学生": ["张三", "李四", "王五"],
    "语文": [85, 78, 90],
    "数学": [92, 88, 95],
})

# 1. 筛选数学成绩大于 90 的学生
high_math = df[df["数学"] > 90]  # 条件筛选
print("数学大于 90 的学生：")
print(high_math)

# 2. 计算平均分
chinese_avg = df["语文"].mean()  # 语文平均分
math_avg = df["数学"].mean()     # 数学平均分
print(f"语文平均分: {chinese_avg}")
print(f"数学平均分: {math_avg}")

# 3. 新增总分列
df["总分"] = df["语文"] + df["数学"]  # 两列相加
print("添加总分后：")
print(df)
```

</details>

### 练习 3：挑战（文件读写）

1. 创建一个包含 5 个城市气温数据的 DataFrame（城市、最高温、最低温）
2. 将数据保存为 CSV 文件
3. 从 CSV 文件重新读取数据
4. 计算每个城市的温差（最高温 - 最低温），并新增为"温差"列

<details>
<summary>点击查看答案</summary>

```python
# 导入 pandas 库
import pandas as pd

# 1. 创建气温数据
df = pd.DataFrame({
    "城市": ["北京", "上海", "广州", "深圳", "杭州"],   # 城市名
    "最高温": [35, 33, 36, 34, 32],                     # 最高温度
    "最低温": [22, 25, 26, 25, 23],                     # 最低温度
})

# 2. 保存为 CSV 文件（index=False 表示不保存行索引）
df.to_csv("temperature.csv", index=False)  # 导出 CSV
print("CSV 文件已保存")

# 3. 从 CSV 文件读取
df_read = pd.read_csv("temperature.csv")  # 读取 CSV
print("从 CSV 读取的数据：")
print(df_read)

# 4. 计算温差并新增列
df_read["温差"] = df_read["最高温"] - df_read["最低温"]  # 计算温差
print("添加温差后：")
print(df_read)
```

</details>

---

## 下一章预告

恭喜你完成了 Pandas 的入门！你已经知道了 Pandas 是什么、为什么需要它、以及如何安装。

下一章，我们将深入学习 Pandas 的两大核心数据结构：**Series** 和 **DataFrame**。你将学会如何从零创建它们、如何访问数据、如何操作索引。这些是后续所有操作的基础，请务必认真掌握。
