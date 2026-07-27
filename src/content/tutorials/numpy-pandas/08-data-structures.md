---
title: "第8章：Pandas 数据结构"
description: "掌握 Series、DataFrame 的创建与基本操作"
---

# 第8章：Pandas 数据结构

## 本章导读

在上一章我们了解了 Pandas 是什么，这一章我们将深入学习它的两个核心数据结构。在开始之前，你可能会有这些疑问：

1. Series 和 DataFrame 到底有什么区别？我应该用哪个？
2. 创建 DataFrame 有那么多方法，哪种最常用？
3. 索引（Index）到底是什么？为什么它这么重要？
4. head()、tail()、info()、describe() 这些方法都是干什么用的？

带着这些问题，让我们开始探索 Pandas 的数据世界。

---

## 为什么需要理解数据结构

### 痛点分析

很多新手学 Pandas 时，上来就开始写代码，结果遇到各种报错：

- 想访问某一列，结果报错说"列名不存在"
- 想修改某个值，结果整个表格的数据都乱了
- 想合并两个表格，结果索引对不上，数据全错

这些问题的根源，都是没有真正理解 Pandas 的数据结构。就像你要开车，得先知道方向盘、油门、刹车在哪里，否则上路就会出问题。

### 生活化类比

把 Pandas 的数据结构想象成**Excel 工作簿**：

- **Series** 就像 Excel 中的**某一列数据**，它有行号（索引）和值
- **DataFrame** 就像整个 **Excel 工作表**，它有多列数据，每列都有自己的列名
- **Index** 就像 Excel 左侧的**行号**，用来标识每一行

### 代码对比

看看不理解数据结构会怎样：

```python
# 错误示例：不理解 Series 和 DataFrame 的区别
import pandas as pd

df = pd.DataFrame({
    "name": ["小明", "小红"],
    "age": [25, 30]
})

# 错误：以为 df["name"] 返回的是 DataFrame
result = df["name"]  # 实际上返回的是 Series

# 错误：对 Series 使用 DataFrame 的方法
# result.columns  # 报错：Series 没有 columns 属性
```

```python
# 正确示例：清楚知道返回的是什么类型
import pandas as pd

df = pd.DataFrame({
    "name": ["小明", "小红"],
    "age": [25, 30]
})

# 正确：访问单列返回 Series
series_result = df["name"]  # 返回 Series
print(type(series_result))  # 输出：<class 'pandas.core.series.Series'>

# 正确：访问多列返回 DataFrame
df_result = df[["name"]]  # 注意是双层方括号，返回 DataFrame
print(type(df_result))    # 输出：<class 'pandas.core.frame.DataFrame'>
```

---

## 核心原理讲解

### Series：一维标签数组

Series 是 Pandas 中最简单的数据结构，它由两部分组成：

- **索引（Index）**：每一行的标签，类似于数组的下标，但可以是任意值
- **值（Values）**：实际存储的数据

通俗类比：Series 就像一张**购物清单**，左边是序号（索引），右边是商品名（值）。

```python
# 创建 Series 的几种方式

# 方式一：从列表创建（最常用）
import pandas as pd

s1 = pd.Series([10, 20, 30])  # 创建 Series，默认索引是 0, 1, 2
print(s1)
# 输出：
# 0    10
# 1    20
# 2    30
# dtype: int64

# 方式二：指定自定义索引
s2 = pd.Series([10, 20, 30], index=["a", "b", "c"])  # 自定义索引
print(s2)
# 输出：
# a    10
# b    20
# c    30
# dtype: int64

# 方式三：从字典创建（推荐，索引自动从键生成）
s3 = pd.Series({"北京": 100, "上海": 200, "广州": 300})  # 字典的键变成索引
print(s3)
# 输出：
# 北京    100
# 上海    200
# 广州    300
# dtype: int64

# 访问 Series 的值
print(s3.values)  # 获取所有值：[100 200 300]
print(s3.index)   # 获取所有索引：Index(['北京', '上海', '广州'], dtype='object')

# 通过索引访问
print(s3["北京"])      # 100，通过标签访问
print(s3[0])           # 100，通过位置访问
print(s3[["北京", "上海"]])  # 访问多个值，返回新的 Series
```

### DataFrame：二维表格数据

DataFrame 是 Pandas 中最常用的数据结构，它由多个 Series 组成，每个 Series 代表一列。

通俗类比：DataFrame 就像一张**Excel 表格**，有行有列，每列可以有不同的数据类型。

```python
# 创建 DataFrame 的几种方式

# 方式一：从字典创建（最常用）
import pandas as pd

df1 = pd.DataFrame({
    "name": ["小明", "小红", "小刚"],    # 姓名列
    "age": [25, 30, 28],                # 年龄列
    "city": ["北京", "上海", "广州"]     # 城市列
})
print(df1)
# 输出：
#   name  age city
# 0   小明   25   北京
# 1   小红   30   上海
# 2   小刚   28   广州

# 方式二：从列表嵌套创建
df2 = pd.DataFrame(
    [
        ["小明", 25, "北京"],  # 第一行数据
        ["小红", 30, "上海"],  # 第二行数据
        ["小刚", 28, "广州"],  # 第三行数据
    ],
    columns=["name", "age", "city"]  # 指定列名
)
print(df2)

# 方式三：从 NumPy 数组创建
import numpy as np

arr = np.random.rand(3, 3)  # 生成 3x3 的随机数组
df3 = pd.DataFrame(
    arr,
    columns=["A", "B", "C"]  # 指定列名
)
print(df3)

# 方式四：指定自定义索引
df4 = pd.DataFrame(
    {
        "name": ["小明", "小红"],
        "age": [25, 30]
    },
    index=["row1", "row2"]  # 自定义行索引
)
print(df4)
# 输出：
#      name  age
# row1   小明   25
# row2   小红   30
```

### 列访问与行访问

```python
# 创建示例数据
import pandas as pd

df = pd.DataFrame({
    "name": ["小明", "小红", "小刚"],
    "age": [25, 30, 28],
    "city": ["北京", "上海", "广州"]
})

# 访问列

# 访问单列（返回 Series）
name_col = df["name"]  # 获取姓名列
print(name_col)
# 输出：
# 0    小明
# 1    小红
# 2    小刚
# Name: name, dtype: object

# 访问多列（返回 DataFrame）
multi_cols = df[["name", "age"]]  # 注意是双层方括号
print(multi_cols)
# 输出：
#   name  age
# 0   小明   25
# 1   小红   30
# 2   小刚   28

# 访问行

# 访问单行（返回 Series）
first_row = df.loc[0]  # 使用 loc 访问第 0 行
print(first_row)
# 输出：
# name      小明
# age       25
# city      北京
# Name: 0, dtype: object

# 访问多行（返回 DataFrame）
multi_rows = df.loc[0:1]  # 访问第 0 到第 1 行（包含右边界）
print(multi_rows)
# 输出：
#   name  age city
# 0   小明   25   北京
# 1   小红   30   上海

# 使用 iloc 按位置访问
first_row_iloc = df.iloc[0]  # 访问第 0 行
print(first_row_iloc)

multi_rows_iloc = df.iloc[0:2]  # 访问第 0 到第 1 行（不包含右边界）
print(multi_rows_iloc)
```

### 索引对象 Index

Index 是 Pandas 中非常重要的概念，它不仅是行号，还可以是任意标签。

```python
# 创建带自定义索引的 DataFrame
import pandas as pd

df = pd.DataFrame(
    {
        "name": ["小明", "小红", "小刚"],
        "age": [25, 30, 28]
    },
    index=["id1", "id2", "id3"]  # 自定义索引
)

print(df)
# 输出：
#      name  age
# id1   小明   25
# id2   小红   30
# id3   小刚   28

# 查看索引
print(df.index)  # Index(['id1', 'id2', 'id3'], dtype='object')

# 修改索引
df.index = ["A", "B", "C"]  # 直接修改索引
print(df)
# 输出：
#    name  age
# A   小明   25
# B   小红   30
# C   小刚   28

# 重置索引（恢复默认的数字索引）
df_reset = df.reset_index()  # 原来的索引变成一列
print(df_reset)
# 输出：
#   index name  age
# 0     A   小明   25
# 1     B   小红   30
# 2     C   小刚   28

# 设置新的索引
df_set = df_reset.set_index("name")  # 把 name 列设为索引
print(df_set)
# 输出：
#      index  age
# name
# 小明     A   25
# 小红     B   30
# 小刚     C   28
```

### 基本操作方法

```python
# 创建示例数据
import pandas as pd

df = pd.DataFrame({
    "name": ["小明", "小红", "小刚", "小丽", "小强"],
    "age": [25, 30, 28, 35, 22],
    "salary": [15000, 20000, 18000, 25000, 12000]
})

# head()：查看前几行（默认前 5 行）
print(df.head())      # 查看前 5 行
print(df.head(3))     # 查看前 3 行

# tail()：查看后几行（默认后 5 行）
print(df.tail())      # 查看后 5 行
print(df.tail(2))     # 查看后 2 行

# info()：查看表格的基本信息
print(df.info())
# 输出：
# <class 'pandas.core.frame.DataFrame'>
# RangeIndex: 5 entries, 0 to 4
# Data columns (total 3 columns):
#  #   Column  Non-Null Count  Dtype
# ---  ------  --------------  -----
#  0   name    5 non-null      object
#  1   age     5 non-null      int64
#  2   salary  5 non-null      int64
# dtypes: int64(2), object(1)
# memory usage: 248.0+ bytes

# describe()：查看数值列的统计摘要
print(df.describe())
# 输出：
#              age        salary
# count   5.000000      5.000000
# mean   28.000000  18000.000000
# std     4.898979   5099.019514
# min    22.000000  12000.000000
# 25%    25.000000  15000.000000
# 50%    28.000000  18000.000000
# 75%    30.000000  20000.000000
# max    35.000000  25000.000000

# 其他常用方法
print(df.shape)       # (5, 3)，返回 (行数, 列数)
print(df.columns)     # Index(['name', 'age', 'salary'], dtype='object')
print(df.dtypes)      # 查看每列的数据类型
print(df.isnull())    # 检查是否有缺失值
```

---

## 对比表格

### Series vs DataFrame

| 对比维度 | Series | DataFrame |
|---------|--------|-----------|
| 维度 | 一维 | 二维 |
| 结构 | 索引 + 值 | 行索引 + 列名 + 多列值 |
| 类比 | Excel 中的某一列 | 整个 Excel 工作表 |
| 创建方式 | 列表、字典、标量 | 字典、列表、NumPy 数组 |
| 访问方式 | `s[index]` | `df["列名"]` 或 `df.loc[行]` |
| 常用场景 | 单列数据、时间序列 | 表格数据、多列数据 |
| 关系 | DataFrame 的一列就是 Series | 由多个 Series 组成 |

### DataFrame 创建方式对比

| 创建方式 | 适用场景 | 优点 | 缺点 |
|---------|---------|------|------|
| 字典创建 | 列数据明确 | 直观易懂，最常用 | 列数多时代码冗长 |
| 列表嵌套 | 行数据明确 | 适合从数据库读取 | 需要手动指定列名 |
| NumPy 数组 | 数值计算场景 | 与 NumPy 无缝衔接 | 不适合混合类型数据 |
| 读取文件 | 实际工作 | 最实用 | 需要文件存在 |

---

## 新手常见误区

### 误区一：混淆 Series 和 DataFrame

```python
# 错误：以为 df["name"] 返回 DataFrame
df = pd.DataFrame({"name": ["小明", "小红"]})
result = df["name"]  # 实际返回 Series

# 正确：明确知道返回类型
series_result = df["name"]      # 单列，返回 Series
df_result = df[["name"]]        # 双层方括号，返回 DataFrame

# 验证类型
print(type(series_result))  # <class 'pandas.core.series.Series'>
print(type(df_result))      # <class 'pandas.core.frame.DataFrame'>
```

### 误区二：忽略索引的重要性

很多新手只关注数据本身，忽略了索引的作用。索引不仅是行号，它还是数据对齐、合并、筛选的关键。

```python
# 错误：忽略索引，直接操作数据
df1 = pd.DataFrame({"A": [1, 2]}, index=[0, 1])
df2 = pd.DataFrame({"A": [3, 4]}, index=[1, 2])

# 直接相加会按索引对齐，导致数据错乱
result = df1 + df2
print(result)
# 输出：
#      A
# 0  NaN  # df2 没有索引 0，所以是 NaN
# 1  5.0  # 索引 1 对齐，2 + 3 = 5
# 2  NaN  # df1 没有索引 2，所以是 NaN

# 正确：先重置索引再操作
df1_reset = df1.reset_index(drop=True)
df2_reset = df2.reset_index(drop=True)
result = df1_reset + df2_reset
print(result)
# 输出：
#    A
# 0  4  # 1 + 3
# 1  6  # 2 + 4
```

### 误区三：用 loc 和 iloc 混用

```python
# 错误：loc 用位置，iloc 用标签
df = pd.DataFrame({"A": [1, 2, 3]}, index=["a", "b", "c"])

# result = df.loc[0]    # 错误：loc 是基于标签的，没有标签 0
# result = df.iloc["a"] # 错误：iloc 是基于位置的，不能用字符串

# 正确：loc 用标签，iloc 用位置
result_loc = df.loc["a"]    # 正确：访问标签为 "a" 的行
result_iloc = df.iloc[0]    # 正确：访问位置为 0 的行

print(result_loc)   # 输出相同
print(result_iloc)  # 输出相同
```

### 误区四：修改原数据时忘记 inplace 参数

```python
# 错误：以为修改了原数据
df = pd.DataFrame({"A": [1, 2, 3]})
df.drop(0)  # 返回新 DataFrame，原 df 不变
print(df)   # 还是原来的数据

# 正确方式一：使用 inplace=True
df.drop(0, inplace=True)  # 直接修改原数据
print(df)

# 正确方式二：重新赋值
df = pd.DataFrame({"A": [1, 2, 3]})
df = df.drop(0)  # 重新赋值给 df
print(df)
```

### 误区五：不理解 head() 和 tail() 的作用

```python
# 错误：不用 head()，直接 print 整个 DataFrame
df = pd.read_csv("large_data.csv")  # 假设有 10000 行
print(df)  # 会输出所有内容，终端卡死

# 正确：先用 head() 查看前几行
print(df.head())  # 只查看前 5 行，快速了解数据结构
print(df.head(10))  # 查看前 10 行

# 用 tail() 查看最后几行
print(df.tail())  # 查看最后 5 行，检查数据是否完整
```

---

## 动手练习

### 练习 1：基础（创建 Series）

创建一个 Series，包含 5 个城市的气温数据，并完成以下任务：

1. 使用自定义索引（城市名）
2. 访问北京的气温
3. 访问前 3 个城市的气温
4. 计算平均气温

<details>
<summary>点击查看答案</summary>

```python
# 导入 pandas
import pandas as pd

# 1. 创建 Series，使用自定义索引
temps = pd.Series(
    [25, 28, 30, 22, 26],
    index=["北京", "上海", "广州", "深圳", "杭州"]
)

print("气温数据：")
print(temps)

# 2. 访问北京的气温
beijing_temp = temps["北京"]
print(f"北京气温: {beijing_temp}")

# 3. 访问前 3 个城市的气温
first_three = temps.iloc[0:3]  # 使用 iloc 按位置访问
print("前 3 个城市气温：")
print(first_three)

# 4. 计算平均气温
avg_temp = temps.mean()
print(f"平均气温: {avg_temp}")
```

</details>

### 练习 2：进阶（DataFrame 操作）

创建一个包含学生成绩的 DataFrame，并完成以下任务：

1. 访问数学成绩列（返回 Series）
2. 访问语文和英语两列（返回 DataFrame）
3. 访问前 2 行数据
4. 查看表格的基本信息和统计摘要

<details>
<summary>点击查看答案</summary>

```python
# 导入 pandas
import pandas as pd

# 创建 DataFrame
df = pd.DataFrame({
    "学生": ["张三", "李四", "王五", "赵六"],
    "语文": [85, 78, 90, 88],
    "数学": [92, 88, 95, 90],
    "英语": [80, 85, 88, 92]
})

print("原始数据：")
print(df)

# 1. 访问数学成绩列（返回 Series）
math_series = df["数学"]
print("\n数学成绩（Series）：")
print(math_series)
print(f"类型: {type(math_series)}")

# 2. 访问语文和英语两列（返回 DataFrame）
chinese_english = df[["语文", "英语"]]
print("\n语文和英语（DataFrame）：")
print(chinese_english)
print(f"类型: {type(chinese_english)}")

# 3. 访问前 2 行数据
first_two_rows = df.head(2)
print("\n前 2 行数据：")
print(first_two_rows)

# 4. 查看基本信息和统计摘要
print("\n基本信息：")
print(df.info())

print("\n统计摘要：")
print(df.describe())
```

</details>

### 练习 3：挑战（索引操作）

创建一个 DataFrame，并完成以下索引操作：

1. 设置"学生"列为索引
2. 使用 loc 访问"张三"的数据
3. 重置索引，恢复默认的数字索引
4. 修改索引为 ["S1", "S2", "S3", "S4"]

<details>
<summary>点击查看答案</summary>

```python
# 导入 pandas
import pandas as pd

# 创建 DataFrame
df = pd.DataFrame({
    "学生": ["张三", "李四", "王五", "赵六"],
    "语文": [85, 78, 90, 88],
    "数学": [92, 88, 95, 90]
})

print("原始数据：")
print(df)

# 1. 设置"学生"列为索引
df_indexed = df.set_index("学生")
print("\n设置学生为索引后：")
print(df_indexed)

# 2. 使用 loc 访问"张三"的数据
zhangsan = df_indexed.loc["张三"]
print("\n张三的数据：")
print(zhangsan)

# 3. 重置索引，恢复默认的数字索引
df_reset = df_indexed.reset_index()
print("\n重置索引后：")
print(df_reset)

# 4. 修改索引为 ["S1", "S2", "S3", "S4"]
df_reset.index = ["S1", "S2", "S3", "S4"]
print("\n修改索引后：")
print(df_reset)
```

</details>

---

## 下一章预告

太好了！你已经掌握了 Pandas 的两大核心数据结构：Series 和 DataFrame。现在你知道如何创建它们、访问数据、操作索引。

下一章，我们将学习如何**索引和筛选数据**。这是数据分析中最常用的操作，你将学会如何快速找到你想要的数据，比如"找出所有年龄大于 30 的人"、"筛选出北京的用户"等等。这些技能会让你在处理真实数据时事半功倍。
