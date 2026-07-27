---
title: "第9章：Pandas 数据索引与筛选"
description: "掌握 loc、iloc 与条件筛选技术"
---

# 第9章：Pandas 数据索引与筛选

## 本章导读

在上一章我们学会了创建和操作 DataFrame，现在我们要学习如何从中找到想要的数据。在开始之前，你可能会有这些疑问：

1. loc 和 iloc 都是用来访问数据的，它们到底有什么区别？
2. 如何筛选出满足条件的数据？比如"年龄大于 30 的人"
3. 多个条件怎么组合？比如"北京且年龄大于 30 的人"
4. set_index 和 reset_index 是干什么用的？什么时候用？

这些问题非常实际，因为数据分析的核心就是"找到想要的数据"。掌握本章内容后，你就能像用 Excel 筛选功能一样，用代码快速定位数据。

---

## 为什么需要数据索引与筛选

### 痛点分析

假设你有一份 1000 行的员工数据，老板让你：

- 找出所有销售部的员工
- 筛选出工资大于 20000 的人
- 找出北京地区且年龄小于 30 的员工

如果用纯 Python，你需要写大量的 for 循环和 if 判断，代码冗长且容易出错。

用 Pandas 的索引和筛选功能，这些任务只需要一行代码就能搞定。

### 生活化类比

把数据筛选想象成**在图书馆找书**：

- **loc** 就像根据书名找书（基于标签）
- **iloc** 就像根据书架位置找书（基于位置）
- **条件筛选** 就像告诉图书管理员"我要找所有关于 Python 的书"
- **多条件筛选** 就像"我要找所有关于 Python 且出版年份大于 2020 的书"

### 代码对比

看看同一个筛选任务，纯 Python 和 Pandas 的差异：

**纯 Python 方式 -- 筛选年龄大于 30 的员工**

```python
# 原始数据
employees = [
    {"name": "小明", "age": 25, "dept": "技术部"},
    {"name": "小红", "age": 35, "dept": "销售部"},
    {"name": "小刚", "age": 28, "dept": "技术部"},
]

# 手动筛选
result = []  # 创建空列表
for emp in employees:  # 遍历每个员工
    if emp["age"] > 30:  # 判断年龄是否大于 30
        result.append(emp)  # 满足条件就加入结果

print(result)
```

**Pandas 方式 -- 同样的任务**

```python
import pandas as pd  # 导入 pandas

# 创建 DataFrame
df = pd.DataFrame(employees)  # 把列表转成表格

# 一行代码完成筛选
result = df[df["age"] > 30]  # 筛选年龄大于 30 的行

print(result)
```

看到了吗？Pandas 把筛选操作简化成了一行代码，而且读起来就像自然语言。

---

## 核心原理讲解

### loc：基于标签的索引

loc 使用**行标签**（Index）来访问数据，就像根据书名找书。

通俗类比：loc 就像 Excel 中的 VLOOKUP，你告诉它"我要找标签为 X 的行"，它就会帮你找到。

```python
import pandas as pd

# 创建带自定义索引的 DataFrame
df = pd.DataFrame(
    {
        "name": ["小明", "小红", "小刚"],
        "age": [25, 30, 28],
        "city": ["北京", "上海", "广州"]
    },
    index=["row1", "row2", "row3"]  # 自定义索引标签
)

print(df)
# 输出：
#       name  age city
# row1   小明   25   北京
# row2   小红   30   上海
# row3   小刚   28   广州

# 使用 loc 访问

# 访问单行（返回 Series）
row = df.loc["row1"]  # 访问标签为 "row1" 的行
print(row)
# 输出：
# name      小明
# age       25
# city      北京
# Name: row1, dtype: object

# 访问多行（返回 DataFrame）
rows = df.loc[["row1", "row3"]]  # 访问标签为 "row1" 和 "row3" 的行
print(rows)
# 输出：
#       name  age city
# row1   小明   25   北京
# row3   小刚   28   广州

# 访问行和列的交叉点
value = df.loc["row1", "name"]  # 访问 "row1" 行 "name" 列的值
print(value)  # 输出：小明

# 访问多行多列
subset = df.loc[["row1", "row2"], ["name", "age"]]  # 访问指定行和列
print(subset)
# 输出：
#       name  age
# row1   小明   25
# row2   小红   30

# 使用切片访问（注意：loc 的切片包含右边界）
slice_rows = df.loc["row1":"row2"]  # 访问 "row1" 到 "row2"（包含 "row2"）
print(slice_rows)
# 输出：
#       name  age city
# row1   小明   25   北京
# row2   小红   30   上海
```

### iloc：基于位置的索引

iloc 使用**行位置**（从 0 开始的数字）来访问数据，就像根据书架位置找书。

通俗类比：iloc 就像数组的下标访问，第 0 个、第 1 个、第 2 个...

```python
import pandas as pd

# 创建 DataFrame
df = pd.DataFrame(
    {
        "name": ["小明", "小红", "小刚"],
        "age": [25, 30, 28],
        "city": ["北京", "上海", "广州"]
    }
)

# 使用 iloc 访问

# 访问单行（返回 Series）
row = df.iloc[0]  # 访问第 0 行（第一行）
print(row)
# 输出：
# name      小明
# age       25
# city      北京
# Name: 0, dtype: object

# 访问多行（返回 DataFrame）
rows = df.iloc[[0, 2]]  # 访问第 0 行和第 2 行
print(rows)
# 输出：
#   name  age city
# 0   小明   25   北京
# 2   小刚   28   广州

# 访问行和列的交叉点
value = df.iloc[0, 0]  # 访问第 0 行第 0 列的值
print(value)  # 输出：小明

# 访问多行多列
subset = df.iloc[[0, 1], [0, 1]]  # 访问第 0、1 行和第 0、1 列
print(subset)
# 输出：
#   name  age
# 0   小明   25
# 1   小红   30

# 使用切片访问（注意：iloc 的切片不包含右边界）
slice_rows = df.iloc[0:2]  # 访问第 0 到第 1 行（不包含第 2 行）
print(slice_rows)
# 输出：
#   name  age city
# 0   小明   25   北京
# 1   小红   30   上海
```

### 条件筛选

条件筛选是数据分析中最常用的操作，就像 Excel 中的筛选功能。

```python
import pandas as pd

# 创建示例数据
df = pd.DataFrame({
    "name": ["小明", "小红", "小刚", "小丽", "小强"],
    "age": [25, 30, 28, 35, 22],
    "city": ["北京", "上海", "北京", "广州", "北京"],
    "salary": [15000, 20000, 18000, 25000, 12000]
})

print("原始数据：")
print(df)

# 单条件筛选

# 筛选年龄大于 26 的人
result1 = df[df["age"] > 26]  # 条件：age > 26
print("\n年龄大于 26：")
print(result1)
# 输出：
#   name  age city  salary
# 1   小红   30   上海   20000
# 2   小刚   28   北京   18000
# 3   小丽   35   广州   25000

# 筛选城市为"北京"的人
result2 = df[df["city"] == "北京"]  # 条件：city == "北京"
print("\n城市为北京：")
print(result2)
# 输出：
#   name  age city  salary
# 0   小明   25   北京   15000
# 2   小刚   28   北京   18000
# 4   小强   22   北京   12000

# 多条件筛选

# 筛选北京且年龄大于 24 的人（使用 & 表示"且"）
result3 = df[(df["city"] == "北京") & (df["age"] > 24)]
print("\n北京且年龄大于 24：")
print(result3)
# 输出：
#   name  age city  salary
# 0   小明   25   北京   15000
# 2   小刚   28   北京   18000

# 筛选北京或上海的人（使用 | 表示"或"）
result4 = df[(df["city"] == "北京") | (df["city"] == "上海")]
print("\n北京或上海：")
print(result4)
# 输出：
#   name  age city  salary
# 0   小明   25   北京   15000
# 1   小红   30   上海   20000
# 2   小刚   28   北京   18000
# 4   小强   22   北京   12000

# 筛选不是北京的人（使用 ~ 表示"非"）
result5 = df[~(df["city"] == "北京")]
print("\n不是北京：")
print(result5)
# 输出：
#   name  age city  salary
# 1   小红   30   上海   20000
# 3   小丽   35   广州   25000
```

### isin() 方法

isin() 用于筛选值在指定列表中的数据，相当于 SQL 中的 IN 操作。

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["小明", "小红", "小刚", "小丽", "小强"],
    "city": ["北京", "上海", "北京", "广州", "深圳"]
})

# 筛选城市在北京、上海、广州的人
cities = ["北京", "上海", "广州"]  # 目标城市列表
result = df[df["city"].isin(cities)]  # 使用 isin 筛选
print(result)
# 输出：
#   name city
# 0   小明   北京
# 1   小红   上海
# 3   小丽   广州
```

### query() 方法

query() 提供了一种更简洁的筛选方式，特别适合复杂条件。

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["小明", "小红", "小刚", "小丽"],
    "age": [25, 30, 28, 35],
    "salary": [15000, 20000, 18000, 25000]
})

# 使用 query 筛选（字符串表达式）
result1 = df.query("age > 26")  # 等价于 df[df["age"] > 26]
print("年龄大于 26：")
print(result1)

# 多条件查询
result2 = df.query("age > 26 and salary > 18000")  # 多条件
print("\n年龄大于 26 且工资大于 18000：")
print(result2)
# 输出：
#   name  age  salary
# 1   小红   30   20000
# 3   小丽   35   25000

# 使用变量
min_age = 28  # 定义变量
result3 = df.query("age > @min_age")  # 使用 @ 引用外部变量
print(f"\n年龄大于 {min_age}：")
print(result3)
```

### set_index 和 reset_index

set_index 把某一列变成索引，reset_index 把索引恢复成普通列。

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["小明", "小红", "小刚"],
    "age": [25, 30, 28],
    "city": ["北京", "上海", "广州"]
})

print("原始数据：")
print(df)
# 输出：
#   name  age city
# 0   小明   25   北京
# 1   小红   30   上海
# 2   小刚   28   广州

# 设置 name 列为索引
df_indexed = df.set_index("name")  # 把 name 列变成索引
print("\n设置 name 为索引后：")
print(df_indexed)
# 输出：
#       age city
# name
# 小明   25   北京
# 小红   30   上海
# 小刚   28   广州

# 现在可以用 loc 直接通过名字访问
xiaoming = df_indexed.loc["小明"]  # 通过名字访问
print("\n小明的数据：")
print(xiaoming)

# 重置索引，恢复默认的数字索引
df_reset = df_indexed.reset_index()  # 把索引变回普通列
print("\n重置索引后：")
print(df_reset)
# 输出：
#   name  age city
# 0   小明   25   北京
# 1   小红   30   上海
# 2   小刚   28   广州

# 重置索引时删除原索引列
df_reset_drop = df_indexed.reset_index(drop=True)  # drop=True 表示删除原索引
print("\n重置索引并删除原索引列：")
print(df_reset_drop)
# 输出：
#    age city
# 0   25   北京
# 1   30   上海
# 2   28   广州
```

---

## 对比表格

### loc vs iloc

| 对比维度 | loc | iloc |
|---------|-----|------|
| 访问方式 | 基于标签（Index） | 基于位置（0, 1, 2...） |
| 切片行为 | 包含右边界 | 不包含右边界 |
| 适用场景 | 索引有明确含义时 | 需要按位置访问时 |
| 示例 | `df.loc["row1"]` | `df.iloc[0]` |
| 切片示例 | `df.loc["a":"c"]`（包含 "c"） | `df.iloc[0:3]`（不包含 3） |
| 性能 | 稍慢（需要查找标签） | 稍快（直接按位置访问） |

### 筛选方法对比

| 方法 | 用途 | 示例 | 适用场景 |
|------|------|------|---------|
| 条件筛选 | 单条件/多条件 | `df[df["age"] > 30]` | 最常用，灵活 |
| isin() | 值在列表中 | `df[df["city"].isin(["北京", "上海"])]` | 多值匹配 |
| query() | 字符串表达式 | `df.query("age > 30 and city == '北京'")` | 复杂条件，代码更简洁 |
| loc/iloc | 按标签/位置访问 | `df.loc["row1"]` / `df.iloc[0]` | 精确访问特定行 |

---

## 新手常见误区

### 误区一：loc 和 iloc 的切片边界混淆

```python
import pandas as pd

df = pd.DataFrame(
    {"A": [1, 2, 3, 4]},
    index=["a", "b", "c", "d"]
)

# 错误：以为 loc 和 iloc 的切片行为一样
# loc_result = df.loc["a":"c"]  # 包含 "c"，结果是 a, b, c 三行
# iloc_result = df.iloc[0:3]    # 不包含 3，结果是 0, 1, 2 三行

# 正确：明确知道边界行为
loc_result = df.loc["a":"c"]  # 包含右边界 "c"
print("loc 切片：")
print(loc_result)
# 输出：
#    A
# a  1
# b  2
# c  3

iloc_result = df.iloc[0:3]  # 不包含右边界 3
print("\niloc 切片：")
print(iloc_result)
# 输出：
#    A
# a  1
# b  2
# c  3
```

### 误区二：多条件筛选忘记加括号

```python
import pandas as pd

df = pd.DataFrame({
    "age": [25, 30, 28],
    "city": ["北京", "上海", "北京"]
})

# 错误：多条件没有加括号
# result = df[df["age"] > 26 & df["city"] == "北京"]  # 报错：运算符优先级问题

# 正确：每个条件都要加括号
result = df[(df["age"] > 26) & (df["city"] == "北京")]
print(result)
# 输出：
#    age city
# 2   28   北京
```

### 误区三：链式赋值导致 SettingWithCopyWarning

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["小明", "小红", "小刚"],
    "age": [25, 30, 28]
})

# 错误：链式赋值，可能触发警告
# df[df["age"] > 26]["age"] = 100  # 警告：可能在副本上操作

# 正确方式一：使用 loc
df.loc[df["age"] > 26, "age"] = 100  # 明确指定行和列
print("使用 loc 修改：")
print(df)

# 正确方式二：先筛选再赋值
df = pd.DataFrame({
    "name": ["小明", "小红", "小刚"],
    "age": [25, 30, 28]
})
mask = df["age"] > 26  # 创建条件掩码
df.loc[mask, "age"] = 100  # 使用 loc 赋值
print("\n使用掩码修改：")
print(df)
```

### 误区四：query() 中字符串没有加引号

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["小明", "小红"],
    "city": ["北京", "上海"]
})

# 错误：字符串没有加引号
# result = df.query("city == 北京")  # 报错：北京未定义

# 正确：字符串要加引号（外层用双引号，内层用单引号）
result = df.query("city == '北京'")
print(result)
# 输出：
#   name city
# 0   小明   北京

# 或者使用双引号转义
result2 = df.query('city == "北京"')
print(result2)
```

### 误区五：忽略索引对齐问题

```python
import pandas as pd

df1 = pd.DataFrame({"A": [1, 2]}, index=[0, 1])
df2 = pd.DataFrame({"A": [3, 4]}, index=[1, 2])

# 错误：直接相加，索引不对齐会导致 NaN
result = df1 + df2
print("直接相加：")
print(result)
# 输出：
#      A
# 0  NaN  # df2 没有索引 0
# 1  5.0  # 索引 1 对齐，2 + 3 = 5
# 2  NaN  # df1 没有索引 2

# 正确：先重置索引再操作
df1_reset = df1.reset_index(drop=True)
df2_reset = df2.reset_index(drop=True)
result = df1_reset + df2_reset
print("\n重置索引后相加：")
print(result)
# 输出：
#    A
# 0  4  # 1 + 3
# 1  6  # 2 + 4
```

---

## 动手练习

### 练习 1：基础（loc 和 iloc）

创建一个 DataFrame，完成以下任务：

1. 使用 loc 访问第 1 行（标签为 "b"）的数据
2. 使用 iloc 访问第 0 行的数据
3. 使用 loc 访问第 0 到第 1 行（包含右边界）
4. 使用 iloc 访问第 0 到第 1 行（不包含右边界）

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建 DataFrame
df = pd.DataFrame(
    {
        "name": ["小明", "小红", "小刚"],
        "age": [25, 30, 28]
    },
    index=["a", "b", "c"]
)

print("原始数据：")
print(df)

# 1. 使用 loc 访问第 1 行（标签为 "b"）
row_loc = df.loc["b"]
print("\nloc 访问标签 'b'：")
print(row_loc)

# 2. 使用 iloc 访问第 0 行
row_iloc = df.iloc[0]
print("\niloc 访问位置 0：")
print(row_iloc)

# 3. 使用 loc 访问第 0 到第 1 行（包含右边界）
slice_loc = df.loc["a":"b"]
print("\nloc 切片 'a' 到 'b'：")
print(slice_loc)

# 4. 使用 iloc 访问第 0 到第 1 行（不包含右边界）
slice_iloc = df.iloc[0:2]
print("\niloc 切片 0 到 2：")
print(slice_iloc)
```

</details>

### 练习 2：进阶（条件筛选）

创建一个包含员工信息的 DataFrame，完成以下任务：

1. 筛选出年龄大于 28 的员工
2. 筛选出部门为"技术部"且工资大于 15000 的员工
3. 筛选出城市在北京或上海的员工
4. 使用 query() 方法完成第 2 个任务

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建 DataFrame
df = pd.DataFrame({
    "name": ["小明", "小红", "小刚", "小丽", "小强"],
    "age": [25, 30, 28, 35, 22],
    "dept": ["技术部", "销售部", "技术部", "技术部", "销售部"],
    "salary": [15000, 20000, 18000, 25000, 12000],
    "city": ["北京", "上海", "北京", "广州", "北京"]
})

print("原始数据：")
print(df)

# 1. 筛选年龄大于 28 的员工
result1 = df[df["age"] > 28]
print("\n年龄大于 28：")
print(result1)

# 2. 筛选技术部且工资大于 15000 的员工
result2 = df[(df["dept"] == "技术部") & (df["salary"] > 15000)]
print("\n技术部且工资大于 15000：")
print(result2)

# 3. 筛选北京或上海的员工
result3 = df[df["city"].isin(["北京", "上海"])]
print("\n北京或上海：")
print(result3)

# 4. 使用 query() 完成第 2 个任务
result4 = df.query("dept == '技术部' and salary > 15000")
print("\n使用 query()：")
print(result4)
```

</details>

### 练习 3：挑战（综合应用）

创建一个销售数据 DataFrame，完成以下任务：

1. 设置"订单号"为索引
2. 使用 loc 访问订单号为 "A002" 的数据
3. 筛选出金额大于 500 且城市为"北京"的订单
4. 重置索引，恢复默认的数字索引
5. 新增一列"折扣价"，等于原价格的 90%

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建销售数据
df = pd.DataFrame({
    "订单号": ["A001", "A002", "A003", "A004", "A005"],
    "商品": ["手机", "电脑", "耳机", "平板", "充电器"],
    "金额": [2999, 5999, 199, 2999, 49],
    "城市": ["北京", "上海", "北京", "广州", "北京"]
})

print("原始数据：")
print(df)

# 1. 设置订单号为索引
df_indexed = df.set_index("订单号")
print("\n设置订单号为索引后：")
print(df_indexed)

# 2. 使用 loc 访问订单号为 "A002" 的数据
order_a002 = df_indexed.loc["A002"]
print("\n订单 A002 的数据：")
print(order_a002)

# 3. 筛选金额大于 500 且城市为北京的订单
result = df_indexed[(df_indexed["金额"] > 500) & (df_indexed["城市"] == "北京")]
print("\n金额大于 500 且城市为北京：")
print(result)

# 4. 重置索引
df_reset = df_indexed.reset_index()
print("\n重置索引后：")
print(df_reset)

# 5. 新增折扣价列
df_reset["折扣价"] = df_reset["金额"] * 0.9  # 计算 90% 的价格
print("\n添加折扣价后：")
print(df_reset)
```

</details>

---

## 下一章预告

太棒了！你已经掌握了 Pandas 的数据索引和筛选技术。现在你可以轻松地从数据中找到你想要的任何信息，这是数据分析的核心技能。

下一章，我们将学习**数据清洗**。真实世界的数据往往不完美：有缺失值、重复值、异常值，数据类型也可能不对。你将学会如何处理这些问题，让数据变得干净、可靠，为后续分析打好基础。
