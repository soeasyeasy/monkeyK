---
title: "第3章：Pandas 数据处理"
description: "掌握 DataFrame、数据清洗、合并与分组聚合"
---

# 第3章：Pandas 数据处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Pandas 是什么？和 NumPy 有什么区别？
- 什么是 DataFrame？
- 如何读取 CSV、Excel 文件？
- 怎么处理缺失数据和重复数据？

这一章就是为了解答这些问题。Pandas 是 AI 项目的"数据管家"，帮你高效处理结构化数据。

---

## 1 为什么需要 Pandas？

### 痛点分析

假设你有一份 CSV 文件，包含 10 万条用户数据，你想找出年龄大于 30 岁的用户：

```python
# ❌ 用纯 Python：复杂且慢
import csv
users = []
with open('users.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if int(row['age']) > 30:
            users.append(row)
```

```python
# ✅ 用 Pandas：简洁高效
import pandas as pd
df = pd.read_csv('users.csv')
users = df[df['age'] > 30]  # 一行搞定
```

> **一句话总结**：Pandas 让数据处理像 SQL 一样简单。

### 生活化类比

打个比方：

> NumPy 是"计算器"，擅长数值运算。
> Pandas 是"Excel"，擅长表格数据处理。
> AI 项目中，数据处理占 80% 的时间，Pandas 是你的得力助手。

---

## 2 核心原理：Series 和 DataFrame

### 概念解释

Pandas 有两个核心数据结构：

```
Series：一维数组，类似一列数据
DataFrame：二维表格，类似 Excel 工作表
```

| 概念 | 说明 | 类比 |
| --- | --- | --- |
| Series | 带索引的一维数组 | Excel 中的一列 |
| DataFrame | 带行列索引的二维表格 | Excel 工作表 |
| Index | 行标签 | Excel 的行号 |
| Column | 列标签 | Excel 的列名 |

---

## 3 基础用法

### 创建 DataFrame

```python
import pandas as pd

# 从字典创建
data = {
    '姓名': ['小明', '小红', '小刚', '小丽'],
    '年龄': [25, 30, 28, 35],
    '城市': ['北京', '上海', '广州', '深圳'],
    '薪资': [15000, 25000, 18000, 30000]
}
df = pd.DataFrame(data)
print(df)
#    姓名  年龄 城市   薪资
# 0  小明   25 北京  15000
# 1  小红   30 上海  25000
# 2  小刚   28 广州  18000
# 3  小丽   35 深圳  30000

# 查看基本信息
print(df.head(2))    # 前2行
print(df.tail(2))    # 后2行
print(df.info())     # 数据类型、非空计数
print(df.describe()) # 统计摘要
```

### 数据选择

```python
import pandas as pd

df = pd.DataFrame({
    '姓名': ['小明', '小红', '小刚', '小丽'],
    '年龄': [25, 30, 28, 35],
    '城市': ['北京', '上海', '广州', '深圳'],
    '薪资': [15000, 25000, 18000, 30000]
})

# 选择列
print(df['姓名'])           # 单列
print(df[['姓名', '年龄']])  # 多列

# 选择行
print(df.iloc[0])          # 第0行（按位置）
print(df.loc[df['年龄'] > 28])  # 条件筛选

# 条件筛选
print(df[df['薪资'] > 20000])
#    姓名  年龄 城市   薪资
# 1  小红   30 上海  25000
# 3  小丽   35 深圳  30000

# 多条件筛选
print(df[(df['年龄'] > 25) & (df['薪资'] > 20000)])
```

### 数据修改

```python
import pandas as pd

df = pd.DataFrame({
    '姓名': ['小明', '小红', '小刚'],
    '年龄': [25, 30, 28],
    '薪资': [15000, 25000, 18000]
})

# 添加新列
df['奖金'] = df['薪资'] * 0.1  # 奖金是薪资的10%
print(df)

# 修改值
df.loc[0, '年龄'] = 26  # 修改第0行的年龄

# 删除列
df = df.drop('奖金', axis=1)  # axis=1 表示按列删除

# 重置索引
df = df.reset_index(drop=True)
```

---

## 4 进阶用法

### 数据清洗

```python
import pandas as pd
import numpy as np

# 创建包含脏数据的 DataFrame
df = pd.DataFrame({
    '姓名': ['小明', '小红', None, '小丽', '小明'],  # 有缺失和重复
    '年龄': [25, np.nan, 28, 35, 25],               # np.nan 表示缺失
    '薪资': [15000, 25000, 18000, None, 15000]
})

# 查看缺失值
print(df.isnull().sum())
# 姓名    1
# 年龄    1
# 薪资    1

# 删除缺失值
df_clean = df.dropna()  # 删除任何有缺失的行

# 填充缺失值
df['年龄'] = df['年龄'].fillna(df['年龄'].mean())  # 用均值填充
df['薪资'] = df['薪资'].fillna(0)                   # 用0填充

# 删除重复值
df = df.drop_duplicates(subset=['姓名'])  # 按姓名列去重

# 替换值
df['姓名'] = df['姓名'].replace(None, '未知')
```

### 数据合并

```python
import pandas as pd

# 两个 DataFrame
df1 = pd.DataFrame({
    '姓名': ['小明', '小红', '小刚'],
    '年龄': [25, 30, 28]
})
df2 = pd.DataFrame({
    '姓名': ['小明', '小红', '小丽'],
    '薪资': [15000, 25000, 30000]
})

# 合并（类似 SQL JOIN）
merged = pd.merge(df1, df2, on='姓名', how='inner')  # 内连接
print(merged)
#    姓名  年龄   薪资
# 0  小明   25  15000
# 1  小红   30  25000

# 外连接
merged_outer = pd.merge(df1, df2, on='姓名', how='outer')  # 外连接
print(merged_outer)
#    姓名   年龄     薪资
# 0  小明   25  15000.0
# 1  小红   30  25000.0
# 2  小刚   28      NaN
# 3  小丽  NaN  30000.0

# 拼接
df_concat = pd.concat([df1, df2], axis=0)  # 纵向拼接
```

### 分组聚合

```python
import pandas as pd

df = pd.DataFrame({
    '部门': ['技术', '技术', '市场', '市场', '技术'],
    '姓名': ['小明', '小红', '小刚', '小丽', '小王'],
    '薪资': [15000, 25000, 18000, 30000, 20000]
})

# 分组统计
grouped = df.groupby('部门')['薪资'].mean()
print(grouped)
# 部门
# 技术    20000.0
# 市场    24000.0

# 多指标聚合
stats = df.groupby('部门')['薪资'].agg(['mean', 'max', 'min', 'count'])
print(stats)
#       mean  max   min  count
# 部门
# 技术   20000  25000  15000      3
# 市场   24000  30000  18000      2

# 自定义聚合
def salary_range(group):
    return group.max() - group.min()

result = df.groupby('部门')['薪资'].agg([salary_range, 'sum'])
print(result)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| DataFrame | 二维表格数据结构，类似 Excel |
| 数据选择 | loc（按标签）、iloc（按位置）、条件筛选 |
| 数据清洗 | dropna（删除缺失）、fillna（填充缺失）、drop_duplicates（去重） |
| 数据合并 | merge（JOIN）、concat（拼接） |
| 分组聚合 | groupby + agg，类似 SQL 的 GROUP BY |

---

## 6 新手常见误区

### 误区 1："修改原 DataFrame 不需要赋值"

**错！** 很多操作返回新 DataFrame，原数据不变：

```python
# ❌ 错误
df.dropna()  # 原 df 不变
print(df)    # 还是有缺失值

# ✅ 正确
df = df.dropna()  # 需要赋值回来
# 或
df.dropna(inplace=True)  # inplace=True 直接修改原数据
```

### 误区 2："loc 和 iloc 是一样的"

不是的。`loc` 按标签索引，`iloc` 按位置索引：

```python
df = pd.DataFrame({'A': [1, 2, 3]}, index=['a', 'b', 'c'])

print(df.loc['a'])    # 1 按标签
print(df.iloc[0])     # 1 按位置
```

### 误区 3："CSV 文件只能用 read_csv"

Pandas 支持多种格式：

```python
df = pd.read_csv('data.csv')       # CSV
df = pd.read_excel('data.xlsx')    # Excel
df = pd.read_json('data.json')     # JSON
df = pd.read_sql(query, conn)      # 数据库
df = pd.read_html('page.html')     # HTML 表格
```

---

## 7 动手练习

### 练习 1：基础练习

创建一个 DataFrame，包含 5 个学生的姓名、年龄、成绩，然后筛选出成绩大于 80 分的学生。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建数据
df = pd.DataFrame({
    '姓名': ['小明', '小红', '小刚', '小丽', '小王'],
    '年龄': [18, 19, 18, 20, 19],
    '成绩': [85, 92, 78, 88, 95]
})

# 筛选成绩大于80分
top_students = df[df['成绩'] > 80]
print(top_students)
#    姓名  年龄  成绩
# 0  小明   18   85
# 1  小红   19   92
# 3  小丽   20   88
# 4  小王   19   95
```

</details>

### 练习 2：进阶练习

读取一个 CSV 文件（假设存在缺失值），清洗数据并统计每个部门的平均薪资。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import numpy as np

# 模拟 CSV 数据（实际中用 pd.read_csv('file.csv')）
data = {
    '部门': ['技术', '技术', '市场', None, '技术', '市场'],
    '姓名': ['小明', '小红', '小刚', '小丽', '小王', '小张'],
    '薪资': [15000, np.nan, 18000, 30000, 20000, 22000]
}
df = pd.DataFrame(data)

# 1. 删除部门为空的行
df = df.dropna(subset=['部门'])

# 2. 填充薪资缺失值（用该部门均值）
df['薪资'] = df.groupby('部门')['薪资'].transform(lambda x: x.fillna(x.mean()))

# 3. 统计每个部门平均薪资
avg_salary = df.groupby('部门')['薪资'].mean()
print(avg_salary)
```

</details>

### 练习 3（挑战）：综合练习

创建一个销售数据 DataFrame，按月份和产品类别分组，计算总销售额和平均销售额。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 销售数据
df = pd.DataFrame({
    '月份': ['1月', '1月', '2月', '2月', '1月', '2月'],
    '产品': ['手机', '电脑', '手机', '电脑', '平板', '平板'],
    '销售额': [50000, 80000, 60000, 90000, 30000, 40000]
})

# 分组聚合
sales_stats = df.groupby(['月份', '产品'])['销售额'].agg(
    总销售额='sum',
    平均销售额='mean',
    订单数='count'
).reset_index()

print(sales_stats)
#    月份  产品  总销售额  平均销售额  订单数
# 0  1月  手机   50000  50000.0     1
# 1  1月  电脑   80000  80000.0     1
# 2  1月  平板   30000  30000.0     1
# 3  2月  手机   60000  60000.0     1
# 4  2月  电脑   90000  90000.0     1
# 5  2月  平板   40000  40000.0     1
```

</details>

---

## 下一章预告

下一章我们会学习 **Matplotlib**——Python 的数据可视化工具。你会学到如何创建折线图、柱状图、散点图，让数据"说话"。
