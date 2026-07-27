---
title: "第11章：Pandas 数据合并与连接"
description: "掌握 concat、merge、join 的使用方法"
---

# 第11章：Pandas 数据合并与连接

## 本章导读

在前面的章节中，我们学会了如何创建、操作和清洗单个 DataFrame。但在实际工作中，数据往往分散在多个文件或表格中。在开始之前，你可能会有这些疑问：

1. 我有两个表格，怎么把它们合并成一个？
2. concat、merge、join 都是合并数据的方法，它们有什么区别？
3. 如何像 SQL 的 JOIN 一样连接两个表格？
4. 连接后数据量突然暴增是怎么回事？
5. 两个表格的列名不一样，还能连接吗？

这些问题非常实际，因为数据分析的核心工作之一就是整合多个数据源。掌握本章内容后，你就能灵活地合并和连接各种数据，就像拼拼图一样把分散的信息组合起来。

---

## 为什么需要数据合并与连接

### 痛点分析

假设你是一个电商数据分析师，手头有以下数据：

- **订单表**：订单号、用户ID、商品ID、金额
- **用户表**：用户ID、用户名、城市
- **商品表**：商品ID、商品名、价格

老板让你分析"北京用户的购买偏好"，你需要：

1. 把订单表和用户表连接起来（通过用户ID）
2. 筛选出北京的用户
3. 再和商品表连接（通过商品ID）
4. 分析他们买了什么商品

如果手动处理，你需要写大量的 for 循环和字典查找，代码复杂且容易出错。

用 Pandas 的合并功能，这些任务只需要几行代码就能搞定。

### 生活化类比

把数据合并想象成**整理档案柜**：

- **concat** 就像把两摞文件上下叠在一起（纵向拼接），或者左右并排放在一起（横向拼接）
- **merge** 就像根据某个共同信息（比如身份证号）把两份档案对应起来
- **join** 就像根据文件编号把档案按顺序对应起来

通俗类比：merge 就像 SQL 中的 JOIN 操作，你告诉它"根据哪个字段连接"，它就会帮你把匹配的 rows 对应起来。

### 代码对比

看看同一个任务，手动处理和 Pandas 的差异：

**手动处理 -- 连接两个表格**

```python
# 订单数据
orders = [
    {"order_id": "A001", "user_id": 1, "amount": 100},
    {"order_id": "A002", "user_id": 2, "amount": 200},
]

# 用户数据
users = [
    {"user_id": 1, "name": "小明", "city": "北京"},
    {"user_id": 2, "name": "小红", "city": "上海"},
]

# 手动连接（嵌套循环）
result = []  # 创建空列表
for order in orders:  # 遍历每个订单
    for user in users:  # 遍历每个用户
        if order["user_id"] == user["user_id"]:  # 匹配用户ID
            # 合并数据
            merged = {**order, **user}  # 合并两个字典
            result.append(merged)  # 加入结果

print(result)
# 输出：
# [
#   {'order_id': 'A001', 'user_id': 1, 'amount': 100, 'name': '小明', 'city': '北京'},
#   {'order_id': 'A002', 'user_id': 2, 'amount': 200, 'name': '小红', 'city': '上海'}
# ]
```

**Pandas 方式 -- 同样的任务**

```python
import pandas as pd

# 创建 DataFrame
orders = pd.DataFrame({
    "order_id": ["A001", "A002"],
    "user_id": [1, 2],
    "amount": [100, 200]
})

users = pd.DataFrame({
    "user_id": [1, 2],
    "name": ["小明", "小红"],
    "city": ["北京", "上海"]
})

# 一行代码完成连接
result = pd.merge(orders, users, on="user_id")  # 根据 user_id 连接

print(result)
# 输出：
#   order_id  user_id  amount name city
# 0     A001        1     100   小明   北京
# 1     A002        2     200   小红   上海
```

看到了吗？Pandas 把复杂的嵌套循环简化成了一行代码，而且读起来就像自然语言。

---

## 核心原理讲解

### concat：纵向/横向拼接

concat 是最简单的合并方法，它直接把多个 DataFrame 拼接在一起，就像拼积木。

通俗类比：concat 就像把两摞纸叠在一起（纵向），或者把两列纸并排放在一起（横向）。

```python
import pandas as pd

# 创建两个 DataFrame
df1 = pd.DataFrame({
    "name": ["小明", "小红"],
    "age": [25, 30]
})

df2 = pd.DataFrame({
    "name": ["小刚", "小丽"],
    "age": [28, 35]
})

print("df1:")
print(df1)
# 输出：
#   name  age
# 0   小明   25
# 1   小红   30

print("\ndf2:")
print(df2)
# 输出：
#   name  age
# 0   小刚   28
# 1   小丽   35

# 纵向拼接（上下堆叠，默认 axis=0）
result_vertical = pd.concat([df1, df2])  # 把 df1 和 df2 上下拼接
print("\n纵向拼接：")
print(result_vertical)
# 输出：
#   name  age
# 0   小明   25
# 1   小红   30
# 0   小刚   28  # 注意：索引重复了
# 1   小丽   35

# 重置索引
result_vertical_reset = pd.concat([df1, df2], ignore_index=True)  # ignore_index=True 重置索引
print("\n纵向拼接（重置索引）：")
print(result_vertical_reset)
# 输出：
#   name  age
# 0   小明   25
# 1   小红   30
# 2   小刚   28
# 3   小丽   35

# 横向拼接（左右并排，axis=1）
result_horizontal = pd.concat([df1, df2], axis=1)  # axis=1 表示按列拼接
print("\n横向拼接：")
print(result_horizontal)
# 输出：
#   name  age  name  age
# 0   小明   25   小刚   28
# 1   小红   30   小丽   35

# 横向拼接不同行数的 DataFrame
df3 = pd.DataFrame({
    "city": ["北京", "上海", "广州"]
})

result_diff = pd.concat([df1, df3], axis=1)  # df1 有 2 行，df3 有 3 行
print("\n横向拼接不同行数：")
print(result_diff)
# 输出：
#   name   age city
# 0   小明  25.0   北京
# 1   小红  30.0   上海
# 2  NaN   NaN   广州  # df1 没有第 3 行，填充 NaN
```

### merge：类似 SQL JOIN

merge 是最强大的合并方法，它根据某个共同字段把两个 DataFrame 连接起来，就像 SQL 的 JOIN。

通俗类比：merge 就像根据身份证号把两份档案对应起来，只有身份证号匹配的才会被连接。

```python
import pandas as pd

# 创建订单表
orders = pd.DataFrame({
    "order_id": ["A001", "A002", "A003"],
    "user_id": [1, 2, 3],
    "amount": [100, 200, 300]
})

# 创建用户表
users = pd.DataFrame({
    "user_id": [1, 2, 4],
    "name": ["小明", "小红", "小刚"],
    "city": ["北京", "上海", "广州"]
})

print("订单表：")
print(orders)
# 输出：
#   order_id  user_id  amount
# 0     A001        1     100
# 1     A002        2     200
# 2     A003        3     300

print("\n用户表：")
print(users)
# 输出：
#    user_id name city
# 0        1   小明   北京
# 1        2   小红   上海
# 2        4   小刚   广州

# 内连接（inner join）：只保留两个表都有的 user_id
result_inner = pd.merge(orders, users, on="user_id", how="inner")  # how="inner" 是默认值
print("\n内连接（inner）：")
print(result_inner)
# 输出：
#   order_id  user_id  amount name city
# 0     A001        1     100   小明   北京
# 1     A002        2     200   小红   上海
# 注意：user_id=3 和 user_id=4 都没有被保留，因为它们不在两个表中同时存在

# 左连接（left join）：保留左表的所有行，右表没有的填充 NaN
result_left = pd.merge(orders, users, on="user_id", how="left")  # how="left" 保留左表所有行
print("\n左连接（left）：")
print(result_left)
# 输出：
#   order_id  user_id  amount name city
# 0     A001        1     100   小明   北京
# 1     A002        2     200   小红   上海
# 2     A003        3     300  NaN  NaN  # user_id=3 在右表没有，填充 NaN

# 右连接（right join）：保留右表的所有行，左表没有的填充 NaN
result_right = pd.merge(orders, users, on="user_id", how="right")  # how="right" 保留右表所有行
print("\n右连接（right）：")
print(result_right)
# 输出：
#   order_id  user_id  amount name city
# 0     A001        1     100   小明   北京
# 1     A002        2     200   小红   上海
# 2      NaN        4     NaN   小刚   广州  # user_id=4 在左表没有，填充 NaN

# 外连接（outer join）：保留两个表的所有行，没有的填充 NaN
result_outer = pd.merge(orders, users, on="user_id", how="outer")  # how="outer" 保留两个表所有行
print("\n外连接（outer）：")
print(result_outer)
# 输出：
#   order_id  user_id  amount name city
# 0     A001        1     100   小明   北京
# 1     A002        2     200   小红   上海
# 2     A003        3     300  NaN  NaN
# 3      NaN        4     NaN   小刚   广州
```

### on, left_on, right_on 参数

当两个表的连接字段名不同时，需要指定 left_on 和 right_on。

```python
import pandas as pd

# 创建订单表（用户ID字段叫 user_id）
orders = pd.DataFrame({
    "order_id": ["A001", "A002"],
    "user_id": [1, 2],
    "amount": [100, 200]
})

# 创建用户表（用户ID字段叫 uid）
users = pd.DataFrame({
    "uid": [1, 2],
    "name": ["小明", "小红"],
    "city": ["北京", "上海"]
})

# 错误：字段名不同，不能用 on
# result = pd.merge(orders, users, on="user_id")  # 报错：users 没有 user_id 列

# 正确：使用 left_on 和 right_on
result = pd.merge(orders, users, left_on="user_id", right_on="uid")  # 指定左表和右表的连接字段
print("使用 left_on 和 right_on：")
print(result)
# 输出：
#   order_id  user_id  amount  uid name city
# 0     A001        1     100    1   小明   北京
# 1     A002        2     200    2   小红   上海
# 注意：结果中有两个用户ID列（user_id 和 uid），可以删除一个

# 删除重复列
result_clean = result.drop("uid", axis=1)  # 删除 uid 列
print("\n删除重复列后：")
print(result_clean)
# 输出：
#   order_id  user_id  amount name city
# 0     A001        1     100   小明   北京
# 1     A002        2     200   小红   上海
```

### join：基于索引的连接

join 是 merge 的简化版，它默认基于索引连接，适合索引有明确含义的场景。

通俗类比：join 就像根据文件编号把档案按顺序对应起来，不需要指定连接字段。

```python
import pandas as pd

# 创建带自定义索引的 DataFrame
df1 = pd.DataFrame({
    "name": ["小明", "小红"],
    "age": [25, 30]
}, index=["id1", "id2"])

df2 = pd.DataFrame({
    "city": ["北京", "上海"],
    "salary": [15000, 20000]
}, index=["id1", "id2"])

print("df1:")
print(df1)
# 输出：
#      name  age
# id1   小明   25
# id2   小红   30

print("\ndf2:")
print(df2)
# 输出：
#      city  salary
# id1   北京   15000
# id2   上海   20000

# 使用 join 基于索引连接
result = df1.join(df2)  # 默认基于索引连接
print("\n使用 join 连接：")
print(result)
# 输出：
#      name  age  city  salary
# id1   小明   25   北京   15000
# id2   小红   30   上海   20000

# join 也可以指定 how 参数
result_left = df1.join(df2, how="left")  # 左连接
print("\n左连接：")
print(result_left)

result_outer = df1.join(df2, how="outer")  # 外连接
print("\n外连接：")
print(result_outer)
```

### 连接类型对比

```python
import pandas as pd

# 创建示例数据
left = pd.DataFrame({
    "key": ["A", "B", "C"],
    "left_value": [1, 2, 3]
})

right = pd.DataFrame({
    "key": ["A", "B", "D"],
    "right_value": [4, 5, 6]
})

print("左表：")
print(left)
# 输出：
#   key  left_value
# 0   A           1
# 1   B           2
# 2   C           3

print("\n右表：")
print(right)
# 输出：
#   key  right_value
# 0   A            4
# 1   B            5
# 2   D            6

# 内连接：只保留交集
inner = pd.merge(left, right, on="key", how="inner")
print("\n内连接（inner）：")
print(inner)
# 输出：
#   key  left_value  right_value
# 0   A           1            4
# 1   B           2            5

# 左连接：保留左表所有
left_join = pd.merge(left, right, on="key", how="left")
print("\n左连接（left）：")
print(left_join)
# 输出：
#   key  left_value  right_value
# 0   A           1            4
# 1   B           2            5
# 2   C           3          NaN  # 右表没有 C，填充 NaN

# 右连接：保留右表所有
right_join = pd.merge(left, right, on="key", how="right")
print("\n右连接（right）：")
print(right_join)
# 输出：
#   key  left_value  right_value
# 0   A           1            4
# 1   B           2            5
# 2   D         NaN            6  # 左表没有 D，填充 NaN

# 外连接：保留两个表所有
outer = pd.merge(left, right, on="key", how="outer")
print("\n外连接（outer）：")
print(outer)
# 输出：
#   key  left_value  right_value
# 0   A           1            4
# 1   B           2            5
# 2   C           3          NaN
# 3   D         NaN            6
```

---

## 对比表格

### concat vs merge vs join

| 对比维度 | concat | merge | join |
|---------|--------|-------|------|
| 用途 | 简单拼接（上下/左右） | 基于字段连接（类似 SQL JOIN） | 基于索引连接 |
| 连接方式 | 直接拼接 | 根据共同字段匹配 | 根据索引匹配 |
| 参数复杂度 | 简单（axis, ignore_index） | 复杂（on, how, left_on, right_on） | 简单（how） |
| 适用场景 | 多个表结构相同，直接堆叠 | 需要根据字段关联的表 | 索引有明确含义的表 |
| 是否要求字段名相同 | 不要求（可以指定） | 要求（或用 left_on/right_on） | 不要求（基于索引） |
| 性能 | 快（简单拼接） | 中等（需要匹配） | 快（基于索引） |
| 类比 | 把纸叠在一起 | SQL 的 JOIN | 根据编号对应档案 |

### merge 连接类型对比

| 连接类型 | how 参数 | 结果 | 适用场景 |
|---------|---------|------|---------|
| 内连接 | "inner" | 只保留两个表都有的行 | 只要匹配的数据 |
| 左连接 | "left" | 保留左表所有行，右表没有的填充 NaN | 以左表为主 |
| 右连接 | "right" | 保留右表所有行，左表没有的填充 NaN | 以右表为主 |
| 外连接 | "outer" | 保留两个表所有行，没有的填充 NaN | 需要所有数据 |

---

## 新手常见误区

### 误区一：忽略索引对齐问题

```python
import pandas as pd

# 创建两个索引不同的 DataFrame
df1 = pd.DataFrame({"A": [1, 2, 3]}, index=[0, 1, 2])
df2 = pd.DataFrame({"B": [4, 5, 6]}, index=[1, 2, 3])

# 错误：直接 concat，索引不对齐会导致 NaN
result = pd.concat([df1, df2], axis=1)
print("直接横向拼接：")
print(result)
# 输出：
#      A    B
# 0  1.0  NaN  # df2 没有索引 0
# 1  2.0  4.0
# 2  3.0  5.0
# 3  NaN  6.0  # df1 没有索引 3

# 正确：先重置索引再拼接
df1_reset = df1.reset_index(drop=True)
df2_reset = df2.reset_index(drop=True)
result = pd.concat([df1_reset, df2_reset], axis=1)
print("\n重置索引后拼接：")
print(result)
# 输出：
#    A  B
# 0  1  4
# 1  2  5
# 2  3  6
```

### 误区二：连接后数据量爆炸（笛卡尔积）

```python
import pandas as pd

# 创建有重复键的数据
left = pd.DataFrame({
    "key": ["A", "A", "B"],
    "left_value": [1, 2, 3]
})

right = pd.DataFrame({
    "key": ["A", "A", "B"],
    "right_value": [4, 5, 6]
})

# 错误：连接后数据量暴增（笛卡尔积）
result = pd.merge(left, right, on="key")
print("连接后数据量暴增：")
print(result)
# 输出：
#   key  left_value  right_value
# 0   A           1            4  # A-1 和 A-4
# 1   A           1            5  # A-1 和 A-5
# 2   A           2            4  # A-2 和 A-4
# 3   A           2            5  # A-2 和 A-5
# 4   B           3            6
# 注意：原本左表 3 行，右表 3 行，结果变成 5 行

# 正确：先检查键的唯一性
print("\n左表键的唯一性：")
print(left["key"].value_counts())  # A 出现 2 次，B 出现 1 次

print("\n右表键的唯一性：")
print(right["key"].value_counts())  # A 出现 2 次，B 出现 1 次

# 如果需要避免笛卡尔积，可以先去重
left_unique = left.drop_duplicates(subset=["key"])
right_unique = right.drop_duplicates(subset=["key"])
result_unique = pd.merge(left_unique, right_unique, on="key")
print("\n去重后连接：")
print(result_unique)
# 输出：
#   key  left_value  right_value
# 0   A           1            4
# 1   B           3            6
```

### 误区三：merge 后忘记处理重复列

```python
import pandas as pd

# 创建两个有相同列名的 DataFrame
df1 = pd.DataFrame({
    "key": ["A", "B"],
    "value": [1, 2],
    "extra": ["x", "y"]
})

df2 = pd.DataFrame({
    "key": ["A", "B"],
    "value": [3, 4],
    "other": ["m", "n"]
})

# 错误：连接后有两个 value 列
result = pd.merge(df1, df2, on="key")
print("连接后有两个 value 列：")
print(result)
# 输出：
#   key  value_x  extra  value_y  other
# 0   A        1      x        3      m
# 1   B        2      y        4      n
# 注意：Pandas 自动加了 _x 和 _y 后缀

# 正确：使用 suffixes 参数自定义后缀
result_suffix = pd.merge(df1, df2, on="key", suffixes=("_left", "_right"))
print("\n自定义后缀：")
print(result_suffix)
# 输出：
#   key  value_left  extra  value_right  other
# 0   A           1      x            3      m
# 1   B           2      y            4      n

# 或者在连接前重命名列
df2_renamed = df2.rename(columns={"value": "value2"})
result_rename = pd.merge(df1, df2_renamed, on="key")
print("\n连接前重命名列：")
print(result_rename)
# 输出：
#   key  value  extra  value2  other
# 0   A      1      x       3      m
# 1   B      2      y       4      n
```

### 误区四：concat 时忽略索引重复

```python
import pandas as pd

df1 = pd.DataFrame({"A": [1, 2]}, index=[0, 1])
df2 = pd.DataFrame({"A": [3, 4]}, index=[0, 1])

# 错误：concat 后索引重复
result = pd.concat([df1, df2])
print("concat 后索引重复：")
print(result)
# 输出：
#    A
# 0  1
# 1  2
# 0  3  # 索引 0 重复了
# 1  4  # 索引 1 重复了

# 访问时会出问题
# result.loc[0]  # 返回两行，可能不是你想要的

# 正确：使用 ignore_index=True 重置索引
result_reset = pd.concat([df1, df2], ignore_index=True)
print("\n重置索引后：")
print(result_reset)
# 输出：
#    A
# 0  1
# 1  2
# 2  3
# 3  4
```

### 误区五：join 时索引不匹配

```python
import pandas as pd

df1 = pd.DataFrame({"A": [1, 2]}, index=["a", "b"])
df2 = pd.DataFrame({"B": [3, 4]}, index=["c", "d"])

# 错误：索引完全不匹配，结果是空或全是 NaN
result = df1.join(df2)
print("索引不匹配的 join：")
print(result)
# 输出：
#     A   B
# a   1 NaN
# b   2 NaN
# 注意：df2 的索引是 c, d，和 df1 的 a, b 不匹配

# 正确：确保索引有交集，或使用 outer 连接
result_outer = df1.join(df2, how="outer")
print("\n使用 outer 连接：")
print(result_outer)
# 输出：
#      A    B
# a  1.0  NaN
# b  2.0  NaN
# c  NaN  3.0
# d  NaN  4.0
```

---

## 动手练习

### 练习 1：基础（concat 拼接）

创建两个 DataFrame，完成以下任务：

1. 纵向拼接两个 DataFrame（上下堆叠）
2. 重置拼接后的索引
3. 横向拼接两个 DataFrame（左右并排）

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建两个 DataFrame
df1 = pd.DataFrame({
    "name": ["小明", "小红"],
    "age": [25, 30]
})

df2 = pd.DataFrame({
    "name": ["小刚", "小丽"],
    "age": [28, 35]
})

print("df1:")
print(df1)
print("\ndf2:")
print(df2)

# 1. 纵向拼接
result_vertical = pd.concat([df1, df2])
print("\n纵向拼接：")
print(result_vertical)

# 2. 重置索引
result_reset = pd.concat([df1, df2], ignore_index=True)
print("\n纵向拼接（重置索引）：")
print(result_reset)

# 3. 横向拼接
result_horizontal = pd.concat([df1, df2], axis=1)
print("\n横向拼接：")
print(result_horizontal)
```

</details>

### 练习 2：进阶（merge 连接）

创建订单表和用户表，完成以下任务：

1. 使用内连接合并两个表
2. 使用左连接合并两个表
3. 使用外连接合并两个表
4. 解释每种连接的结果差异

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建订单表
orders = pd.DataFrame({
    "order_id": ["A001", "A002", "A003"],
    "user_id": [1, 2, 3],
    "amount": [100, 200, 300]
})

# 创建用户表
users = pd.DataFrame({
    "user_id": [1, 2, 4],
    "name": ["小明", "小红", "小刚"],
    "city": ["北京", "上海", "广州"]
})

print("订单表：")
print(orders)
print("\n用户表：")
print(users)

# 1. 内连接
result_inner = pd.merge(orders, users, on="user_id", how="inner")
print("\n内连接（inner）：")
print(result_inner)
# 只保留 user_id 在两个表中都存在的行（1 和 2）

# 2. 左连接
result_left = pd.merge(orders, users, on="user_id", how="left")
print("\n左连接（left）：")
print(result_left)
# 保留订单表所有行，user_id=3 在用户表没有，填充 NaN

# 3. 外连接
result_outer = pd.merge(orders, users, on="user_id", how="outer")
print("\n外连接（outer）：")
print(result_outer)
# 保留两个表所有行，没有匹配的填充 NaN

# 4. 解释差异
print("\n=== 连接类型对比 ===")
print(f"内连接行数: {len(result_inner)}")  # 2 行
print(f"左连接行数: {len(result_left)}")  # 3 行
print(f"外连接行数: {len(result_outer)}")  # 4 行
```

</details>

### 练习 3：挑战（综合应用）

创建三个表（学生表、课程表、成绩表），完成以下任务：

1. 使用 merge 把三个表连接起来
2. 筛选出成绩大于 80 分的记录
3. 统计每个学生的平均分
4. 找出没有成绩的学生

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建学生表
students = pd.DataFrame({
    "student_id": [1, 2, 3, 4],
    "name": ["小明", "小红", "小刚", "小丽"],
    "age": [20, 21, 22, 20]
})

# 创建课程表
courses = pd.DataFrame({
    "course_id": [101, 102, 103],
    "course_name": ["数学", "英语", "物理"]
})

# 创建成绩表
scores = pd.DataFrame({
    "student_id": [1, 1, 2, 2, 3],
    "course_id": [101, 102, 101, 103, 102],
    "score": [85, 78, 92, 88, 75]
})

print("学生表：")
print(students)
print("\n课程表：")
print(courses)
print("\n成绩表：")
print(scores)

# 1. 连接三个表
# 先连接成绩表和学生表
result1 = pd.merge(scores, students, on="student_id", how="left")
print("\n成绩表 + 学生表：")
print(result1)

# 再连接课程表
result2 = pd.merge(result1, courses, on="course_id", how="left")
print("\n完整连接结果：")
print(result2)
# 输出：
#    student_id  course_id  score name  age course_name
# 0           1        101     85   小明   20          数学
# 1           1        102     78   小明   20          英语
# 2           2        101     92   小红   21          数学
# 3           2        103     88   小红   21          物理
# 4           3        102     75   小刚   22          英语

# 2. 筛选成绩大于 80 分的记录
high_scores = result2[result2["score"] > 80]
print("\n成绩大于 80 分的记录：")
print(high_scores)

# 3. 统计每个学生的平均分
avg_scores = result2.groupby("name")["score"].mean().reset_index()
avg_scores.columns = ["name", "avg_score"]  # 重命名列
print("\n每个学生的平均分：")
print(avg_scores)

# 4. 找出没有成绩的学生
# 使用外连接找出没有成绩的学生
all_students = pd.merge(students, scores, on="student_id", how="left")
no_score = all_students[all_students["score"].isna()]
print("\n没有成绩的学生：")
print(no_score[["name"]])
# 输出：小丽没有成绩
```

</details>

---

## 下一章预告

太棒了！你已经掌握了 Pandas 数据合并与连接的核心技能。现在你可以灵活地使用 concat、merge、join 来整合多个数据源，就像拼拼图一样把分散的数据组合起来。

到这里，Pandas 的基础教程就结束了。你已经学会了：
- 第7章：Pandas 简介与安装
- 第8章：数据结构（Series 和 DataFrame）
- 第9章：数据索引与筛选
- 第10章：数据清洗
- 第11章：数据合并与连接

这些技能涵盖了 Pandas 最核心的功能，足以应对大部分数据分析任务。接下来，你可以学习数据可视化（Matplotlib、Seaborn）、数据分析实战项目，或者深入学习 Pandas 的高级功能（分组聚合、时间序列等）。

祝你在数据分析的道路上越走越远！
