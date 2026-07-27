---
title: "第10章：Pandas 数据清洗"
description: "掌握缺失值、重复值、异常值的处理方法"
---

# 第10章：Pandas 数据清洗

## 本章导读

在上一章我们学会了如何索引和筛选数据，现在我们要面对一个更现实的问题：真实世界的数据往往不完美。在开始之前，你可能会有这些疑问：

1. 数据中有缺失值怎么办？直接删除还是填充？
2. 如何检测和处理重复数据？
3. 数据类型不对怎么办？比如把字符串类型的数字转成真正的数字
4. 什么是异常值？如何检测和处理的？
5. 字符串数据怎么批量处理？比如统一转成大写

这些问题非常实际，因为数据清洗是数据分析中最耗时的环节（通常占 60-80% 的时间）。掌握本章内容后，你就能把"脏数据"变成"干净数据"，为后续分析打好基础。

---

## 为什么需要数据清洗

### 痛点分析

假设你从网上下载了一份用户数据，准备分析用户行为，结果发现：

- 有些用户的年龄字段是空的（缺失值）
- 有些用户被记录了两次（重复值）
- 有些年龄写的是 "二十五" 而不是 25（数据类型问题）
- 有些年龄写的是 200（明显不合理，异常值）
- 城市名有的写"北京"，有的写"北京市"（不一致）

如果直接用这些数据做分析，结果肯定不准确。这就是为什么需要数据清洗。

### 生活化类比

把数据清洗想象成**做饭前的食材处理**：

- **缺失值处理** 就像发现蔬菜有烂叶子，要么扔掉（dropna），要么切掉坏的部分（fillna）
- **重复值处理** 就像发现买了两棵一样的白菜，退掉一棵（drop_duplicates）
- **数据类型转换** 就像把带泥的土豆洗干净（to_numeric, to_datetime）
- **异常值处理** 就像发现一个特别大的土豆，可能是假的，需要检查（Z-score, IQR）
- **字符串处理** 就像把大小不一的土豆切成统一大小（str 访问器）

### 代码对比

看看没有数据清洗会怎样：

**不清洗直接分析 -- 结果不准确**

```python
import pandas as pd

# 有问题的数据
df = pd.DataFrame({
    "name": ["小明", "小红", "小刚", "小明", "小丽"],
    "age": [25, None, "三十", 200, 28],  # 有缺失、字符串、异常值
    "city": ["北京", "上海市", "北京", "北京", "广州"]  # 不一致
})

# 直接计算平均年龄
# avg_age = df["age"].mean()  # 报错：无法计算，因为混有字符串

# 直接统计城市人数
# city_count = df["city"].value_counts()  # "北京"和"北京市"被当成两个城市
```

**清洗后再分析 -- 结果准确**

```python
import pandas as pd

# 有问题的数据
df = pd.DataFrame({
    "name": ["小明", "小红", "小刚", "小明", "小丽"],
    "age": [25, None, "三十", 200, 28],
    "city": ["北京", "上海市", "北京", "北京", "广州"]
})

# 1. 删除重复行
df = df.drop_duplicates()  # 删除重复的用户

# 2. 处理缺失值
df = df.dropna(subset=["age"])  # 删除年龄为空的行

# 3. 转换数据类型（只保留数字）
df["age"] = pd.to_numeric(df["age"], errors="coerce")  # 无法转换的变成 NaN
df = df.dropna(subset=["age"])  # 删除转换后为 NaN 的行

# 4. 处理异常值
df = df[(df["age"] > 0) & (df["age"] < 150)]  # 只保留合理的年龄

# 5. 统一城市名
df["city"] = df["city"].str.replace("市", "")  # 去掉"市"字

# 现在可以准确分析了
avg_age = df["age"].mean()  # 计算平均年龄
city_count = df["city"].value_counts()  # 统计城市人数

print(f"平均年龄: {avg_age}")
print(f"城市分布:\n{city_count}")
```

---

## 核心原理讲解

### 缺失值检测与处理

缺失值在 Pandas 中用 NaN（Not a Number）表示，检测和处理的常用方法：

- `isnull()`：检测缺失值，返回布尔值
- `notnull()`：检测非缺失值，返回布尔值
- `dropna()`：删除包含缺失值的行或列
- `fillna()`：填充缺失值

通俗类比：缺失值就像表格中的空白单元格，你可以选择删除这一行（dropna），或者填上一个默认值（fillna）。

```python
import pandas as pd
import numpy as np

# 创建包含缺失值的数据
df = pd.DataFrame({
    "name": ["小明", "小红", "小刚", "小丽", "小强"],
    "age": [25, np.nan, 28, 35, np.nan],  # np.nan 表示缺失值
    "city": ["北京", "上海", np.nan, "广州", "深圳"]
})

print("原始数据：")
print(df)
# 输出：
#   name   age city
# 0   小明  25.0   北京
# 1   小红   NaN   上海
# 2   小刚  28.0  NaN
# 3   小丽  35.0   广州
# 4   小强   NaN   深圳

# 检测缺失值

# 检查每个值是否为缺失值
null_check = df.isnull()  # 返回布尔值 DataFrame
print("\n缺失值检测：")
print(null_check)
# 输出：
#     name    age   city
# 0  False  False  False
# 1  False   True  False
# 2  False  False   True
# 3  False  False  False
# 4  False   True  False

# 统计每列的缺失值数量
null_count = df.isnull().sum()  # 对布尔值求和
print("\n每列缺失值数量：")
print(null_count)
# 输出：
# name    0
# age     2
# city    1
# dtype: int64

# 处理缺失值

# 方式一：删除包含缺失值的行
df_drop = df.dropna()  # 删除任何包含 NaN 的行
print("\n删除缺失值后：")
print(df_drop)
# 输出：
#   name   age city
# 0   小明  25.0   北京
# 3   小丽  35.0   广州

# 方式二：只删除特定列有缺失值的行
df_drop_age = df.dropna(subset=["age"])  # 只删除 age 列为 NaN 的行
print("\n只删除 age 缺失的行：")
print(df_drop_age)
# 输出：
#   name   age city
# 0   小明  25.0   北京
# 2   小刚  28.0  NaN
# 3   小丽  35.0   广州

# 方式三：填充缺失值
df_fill = df.fillna({"age": df["age"].mean(), "city": "未知"})  # 用均值填充 age，用"未知"填充 city
print("\n填充缺失值后：")
print(df_fill)
# 输出：
#   name   age city
# 0   小明  25.0   北京
# 1   小红  29.5   上海  # 29.5 是 (25+28+35)/3 的均值
# 2   小刚  28.0   未知
# 3   小丽  35.0   广州
# 4   小强  29.5   深圳

# 方式四：向前/向后填充
df_ffill = df.fillna(method="ffill")  # 用前一个值填充
print("\n向前填充后：")
print(df_ffill)

df_bfill = df.fillna(method="bfill")  # 用后一个值填充
print("\n向后填充后：")
print(df_bfill)
```

### 重复值处理

重复值就像数据中的"复制粘贴"，需要检测并删除。

```python
import pandas as pd

# 创建包含重复值的数据
df = pd.DataFrame({
    "name": ["小明", "小红", "小明", "小刚", "小红"],
    "age": [25, 30, 25, 28, 30],
    "city": ["北京", "上海", "北京", "广州", "上海"]
})

print("原始数据：")
print(df)
# 输出：
#   name  age city
# 0   小明   25   北京
# 1   小红   30   上海
# 2   小明   25   北京  # 重复
# 3   小刚   28   广州
# 4   小红   30   上海  # 重复

# 检测重复值

# 检查每行是否重复
dup_check = df.duplicated()  # 返回布尔值 Series
print("\n重复值检测：")
print(dup_check)
# 输出：
# 0    False
# 1    False
# 2     True  # 第 2 行是重复的
# 3    False
# 4     True  # 第 4 行是重复的
# dtype: bool

# 统计重复值数量
dup_count = df.duplicated().sum()
print(f"\n重复值数量: {dup_count}")  # 输出：2

# 处理重复值

# 删除重复行（保留第一次出现的）
df_dedup = df.drop_duplicates()  # 删除完全重复的行
print("\n删除重复行后：")
print(df_dedup)
# 输出：
#   name  age city
# 0   小明   25   北京
# 1   小红   30   上海
# 3   小刚   28   广州

# 基于特定列删除重复
df_dedup_name = df.drop_duplicates(subset=["name"])  # 只根据 name 列去重
print("\n基于 name 列去重后：")
print(df_dedup_name)
# 输出：
#   name  age city
# 0   小明   25   北京
# 1   小红   30   上海
# 3   小刚   28   广州

# 保留最后一次出现的
df_dedup_last = df.drop_duplicates(subset=["name"], keep="last")
print("\n保留最后一次出现的：")
print(df_dedup_last)
# 输出：
#   name  age city
# 1   小红   30   上海
# 2   小明   25   北京
# 3   小刚   28   广州
```

### 数据类型转换

数据类型不对是常见问题，需要转换。

```python
import pandas as pd

# 创建数据类型有问题的数据
df = pd.DataFrame({
    "name": ["小明", "小红", "小刚"],
    "age": ["25", "30", "28"],  # 字符串类型的数字
    "salary": ["15000", "20000", "18000"],  # 字符串类型的数字
    "join_date": ["2020-01-01", "2021-03-15", "2019-07-20"]  # 字符串类型的日期
})

print("原始数据类型：")
print(df.dtypes)
# 输出：
# name         object
# age          object  # 应该是 int64
# salary       object  # 应该是 int64
# join_date    object  # 应该是 datetime64
# dtype: object

# 转换数据类型

# 方式一：使用 astype()
df["age"] = df["age"].astype(int)  # 转换为整数
print("\n转换 age 后：")
print(df.dtypes)

# 方式二：使用 to_numeric()（更安全，可以处理错误）
df["salary"] = pd.to_numeric(df["salary"])  # 转换为数字
print("\n转换 salary 后：")
print(df.dtypes)

# 方式三：使用 to_datetime()
df["join_date"] = pd.to_datetime(df["join_date"])  # 转换为日期
print("\n转换 join_date 后：")
print(df.dtypes)
# 输出：
# name                object
# age                  int32
# salary               int64
# join_date    datetime64[ns]
# dtype: object

# 处理转换错误
df_error = pd.DataFrame({
    "value": ["10", "20", "三十", "40"]  # 混有字符串
})

# 错误方式：直接转换会报错
# df_error["value"] = df_error["value"].astype(int)  # 报错

# 正确方式：使用 errors="coerce"，无法转换的变成 NaN
df_error["value"] = pd.to_numeric(df_error["value"], errors="coerce")
print("\n处理转换错误后：")
print(df_error)
# 输出：
#    value
# 0   10.0
# 1   20.0
# 2    NaN  # "三十"无法转换，变成 NaN
# 3   40.0
```

### 异常值检测

异常值是明显偏离正常范围的数据，需要检测和处理。

```python
import pandas as pd
import numpy as np

# 创建包含异常值的数据
df = pd.DataFrame({
    "age": [25, 28, 30, 32, 200, 27, 29, 31, 26, 28]  # 200 是异常值
})

print("原始数据：")
print(df)

# 方法一：Z-score 方法（基于标准差）
# Z-score = (值 - 均值) / 标准差
# 通常 |Z-score| > 3 被认为是异常值

mean = df["age"].mean()  # 计算均值
std = df["age"].std()    # 计算标准差
df["z_score"] = (df["age"] - mean) / std  # 计算 Z-score

print("\nZ-score 检测：")
print(df)

# 筛选正常值（|Z-score| < 3）
normal = df[df["z_score"].abs() < 3]
print("\n正常值：")
print(normal)

# 方法二：IQR 方法（基于四分位数）
# IQR = Q3 - Q1
# 异常值范围：< Q1 - 1.5*IQR 或 > Q3 + 1.5*IQR

Q1 = df["age"].quantile(0.25)  # 第一四分位数
Q3 = df["age"].quantile(0.75)  # 第三四分位数
IQR = Q3 - Q1                  # 四分位距

lower_bound = Q1 - 1.5 * IQR   # 下界
upper_bound = Q3 + 1.5 * IQR   # 上界

print(f"\nIQR 方法：")
print(f"Q1: {Q1}, Q3: {Q3}, IQR: {IQR}")
print(f"正常范围: {lower_bound} - {upper_bound}")

# 筛选正常值
normal_iqr = df[(df["age"] >= lower_bound) & (df["age"] <= upper_bound)]
print("\nIQR 方法筛选的正常值：")
print(normal_iqr)
```

### 字符串处理

Pandas 提供了 str 访问器，可以批量处理字符串数据。

```python
import pandas as pd

# 创建字符串数据
df = pd.DataFrame({
    "name": [" 小明 ", "小红", " 小刚 "],
    "city": ["北京", "上海市", "广州市"],
    "email": ["xiaoming@test.com", "xiaohong@test.com", "xiaogang@test.com"]
})

print("原始数据：")
print(df)

# 字符串处理方法

# 去除首尾空格
df["name"] = df["name"].str.strip()  # 去除首尾空格
print("\n去除空格后：")
print(df["name"])

# 替换字符串
df["city"] = df["city"].str.replace("市", "")  # 去掉"市"字
print("\n替换后：")
print(df["city"])

# 转大写/小写
df["name_upper"] = df["name"].str.upper()  # 转大写
df["name_lower"] = df["name"].str.lower()  # 转小写
print("\n大小写转换：")
print(df[["name", "name_upper", "name_lower"]])

# 提取字符串
df["email_domain"] = df["email"].str.split("@").str[1]  # 提取邮箱域名
print("\n提取邮箱域名：")
print(df[["email", "email_domain"]])

# 判断是否包含
df["has_test"] = df["email"].str.contains("test")  # 是否包含 "test"
print("\n是否包含 'test'：")
print(df[["email", "has_test"]])

# 字符串长度
df["name_len"] = df["name"].str.len()  # 计算名字长度
print("\n名字长度：")
print(df[["name", "name_len"]])
```

---

## 对比表格

### 数据清洗方法对比

| 问题类型 | 检测方法 | 处理方法 | 适用场景 |
|---------|---------|---------|---------|
| 缺失值 | `isnull()`, `notnull()` | `dropna()`, `fillna()` | 数据有空值 |
| 重复值 | `duplicated()` | `drop_duplicates()` | 数据有重复行 |
| 数据类型 | `df.dtypes` | `astype()`, `to_numeric()`, `to_datetime()` | 类型不对 |
| 异常值 | Z-score, IQR | 筛选、删除、替换 | 有极端值 |
| 字符串 | - | `str` 访问器的各种方法 | 文本数据不一致 |

### 缺失值处理方法对比

| 方法 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| `dropna()` | 删除包含缺失值的行/列 | 简单直接 | 可能丢失大量数据 |
| `fillna(均值)` | 用均值填充 | 保留数据量 | 可能引入偏差 |
| `fillna(中位数)` | 用中位数填充 | 对异常值鲁棒 | 可能引入偏差 |
| `fillna(众数)` | 用众数填充 | 适合分类数据 | 可能引入偏差 |
| `fillna(前向/后向)` | 用前后值填充 | 适合时间序列 | 不适合独立数据 |
| `fillna(固定值)` | 用固定值填充（如 0、"未知"） | 简单明确 | 可能不符合实际 |

---

## 新手常见误区

### 误区一：fillna 的 inplace 参数

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "A": [1, np.nan, 3],
    "B": [4, 5, np.nan]
})

# 错误：以为修改了原数据
df.fillna(0)  # 返回新 DataFrame，原 df 不变
print(df)  # 还是原来的数据，有 NaN

# 正确方式一：使用 inplace=True
df.fillna(0, inplace=True)  # 直接修改原数据
print(df)

# 正确方式二：重新赋值
df = pd.DataFrame({
    "A": [1, np.nan, 3],
    "B": [4, 5, np.nan]
})
df = df.fillna(0)  # 重新赋值给 df
print(df)
```

### 误区二：忽略数据类型

```python
import pandas as pd

# 错误：直接对字符串类型的数字进行计算
df = pd.DataFrame({
    "price": ["100", "200", "300"]  # 字符串类型
})

# total = df["price"].sum()  # 结果："100200300"（字符串拼接）

# 正确：先转换类型再计算
df["price"] = pd.to_numeric(df["price"])  # 转换为数字
total = df["price"].sum()  # 结果：600（正确的数值求和）
print(f"总价: {total}")
```

### 误区三：dropna 删除太多数据

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "A": [1, 2, np.nan, 4],
    "B": [np.nan, 5, 6, np.nan],
    "C": [7, 8, 9, 10]
})

# 错误：默认删除任何包含 NaN 的行
# df_clean = df.dropna()  # 结果可能只剩 1 行

# 正确方式一：只删除特定列有缺失值的行
df_clean1 = df.dropna(subset=["A"])  # 只删除 A 列为 NaN 的行
print("只删除 A 列缺失的行：")
print(df_clean1)

# 正确方式二：使用 thresh 参数，至少需要 N 个非 NaN 值
df_clean2 = df.dropna(thresh=2)  # 至少有 2 个非 NaN 值
print("\n至少 2 个非 NaN 值：")
print(df_clean2)

# 正确方式三：按列删除（axis=1）
df_clean3 = df.dropna(axis=1)  # 删除包含 NaN 的列
print("\n删除包含 NaN 的列：")
print(df_clean3)
```

### 误区四：astype 转换失败

```python
import pandas as pd

df = pd.DataFrame({
    "value": ["10", "20", "三十", "40"]
})

# 错误：直接转换会报错
# df["value"] = df["value"].astype(int)  # 报错：无法转换 "三十"

# 正确：使用 to_numeric 并设置 errors="coerce"
df["value"] = pd.to_numeric(df["value"], errors="coerce")
print("转换后：")
print(df)
# 输出：
#    value
# 0   10.0
# 1   20.0
# 2    NaN  # "三十"无法转换，变成 NaN
# 3   40.0

# 然后处理 NaN
df = df.dropna()  # 删除 NaN 行
print("\n删除 NaN 后：")
print(df)
```

### 误区五：异常值直接删除

```python
import pandas as pd

df = pd.DataFrame({
    "age": [25, 28, 30, 200, 27, 29]  # 200 是异常值
})

# 错误：直接删除异常值
# df_clean = df[df["age"] < 100]  # 可能丢失有用信息

# 正确方式一：先分析原因
print("异常值：")
print(df[df["age"] > 100])  # 查看异常值是什么

# 正确方式二：替换为合理值（如均值、中位数）
median_age = df["age"].median()  # 计算中位数
df["age"] = df["age"].clip(upper=100)  # 把超过 100 的截断为 100
print("\n截断后：")
print(df)

# 正确方式三：标记异常值而不是删除
df["is_outlier"] = df["age"] > 100  # 新增标记列
print("\n标记异常值：")
print(df)
```

---

## 动手练习

### 练习 1：基础（缺失值处理）

创建一个包含缺失值的 DataFrame，完成以下任务：

1. 检测每列的缺失值数量
2. 删除包含缺失值的行
3. 用均值填充 age 列的缺失值
4. 用"未知"填充 city 列的缺失值

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import numpy as np

# 创建包含缺失值的数据
df = pd.DataFrame({
    "name": ["小明", "小红", "小刚", "小丽", "小强"],
    "age": [25, np.nan, 28, 35, np.nan],
    "city": ["北京", "上海", np.nan, "广州", "深圳"]
})

print("原始数据：")
print(df)

# 1. 检测每列的缺失值数量
null_count = df.isnull().sum()
print("\n每列缺失值数量：")
print(null_count)

# 2. 删除包含缺失值的行
df_drop = df.dropna()
print("\n删除缺失值后：")
print(df_drop)

# 3. 用均值填充 age 列的缺失值
df_fill_age = df.copy()  # 复制原数据
df_fill_age["age"] = df_fill_age["age"].fillna(df_fill_age["age"].mean())
print("\n用均值填充 age 后：")
print(df_fill_age)

# 4. 用"未知"填充 city 列的缺失值
df_fill_city = df.copy()  # 复制原数据
df_fill_city["city"] = df_fill_city["city"].fillna("未知")
print("\n用'未知'填充 city 后：")
print(df_fill_city)
```

</details>

### 练习 2：进阶（重复值与类型转换）

创建一个包含重复值和数据类型问题的 DataFrame，完成以下任务：

1. 检测并删除重复行
2. 将字符串类型的 age 转换为整数
3. 将字符串类型的日期转换为 datetime 类型
4. 处理无法转换的数据（使用 errors="coerce"）

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建有问题的数据
df = pd.DataFrame({
    "name": ["小明", "小红", "小明", "小刚"],
    "age": ["25", "30", "25", "二十八"],  # 有重复，混有字符串
    "join_date": ["2020-01-01", "2021-03-15", "2020-01-01", "2019-07-20"]
})

print("原始数据：")
print(df)

# 1. 检测并删除重复行
dup_count = df.duplicated().sum()
print(f"\n重复行数量: {dup_count}")

df_dedup = df.drop_duplicates()
print("\n删除重复行后：")
print(df_dedup)

# 2. 将字符串类型的 age 转换为整数（处理错误）
df_dedup["age"] = pd.to_numeric(df_dedup["age"], errors="coerce")
print("\n转换 age 后：")
print(df_dedup)

# 3. 将字符串类型的日期转换为 datetime 类型
df_dedup["join_date"] = pd.to_datetime(df_dedup["join_date"])
print("\n转换日期后：")
print(df_dedup)
print("\n数据类型：")
print(df_dedup.dtypes)

# 4. 处理无法转换的数据（age 为 NaN 的行）
df_clean = df_dedup.dropna(subset=["age"])  # 删除 age 为 NaN 的行
df_clean["age"] = df_clean["age"].astype(int)  # 转换为整数
print("\n清理后：")
print(df_clean)
```

</details>

### 练习 3：挑战（综合数据清洗）

创建一个包含多种问题的 DataFrame，完成完整的数据清洗流程：

1. 检测并处理缺失值（删除或填充）
2. 检测并删除重复值
3. 转换数据类型（字符串转数字、字符串转日期）
4. 检测并处理异常值（使用 IQR 方法）
5. 统一字符串格式（去除空格、替换字符）
6. 最终输出干净的数据

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import numpy as np

# 创建有各种问题的数据
df = pd.DataFrame({
    "name": [" 小明 ", "小红", " 小明 ", "小刚", "小丽", "小强"],
    "age": ["25", "30", "25", "200", "28", np.nan],  # 有重复、异常值、缺失值
    "salary": ["15000", "20000", "15000", "18000", "25000", "12000"],
    "city": ["北京", "上海市", "北京", "广州", "深圳市", "北京"],
    "join_date": ["2020-01-01", "2021-03-15", "2020-01-01", "2019-07-20", "2022-05-10", "2020-11-30"]
})

print("原始数据：")
print(df)

# 1. 统一字符串格式
df["name"] = df["name"].str.strip()  # 去除名字首尾空格
df["city"] = df["city"].str.replace("市", "")  # 去掉城市名中的"市"
print("\n统一字符串格式后：")
print(df)

# 2. 删除重复行
df = df.drop_duplicates()
print("\n删除重复行后：")
print(df)

# 3. 转换数据类型
df["age"] = pd.to_numeric(df["age"], errors="coerce")  # 转换 age，无法转换的变成 NaN
df["salary"] = pd.to_numeric(df["salary"])  # 转换 salary
df["join_date"] = pd.to_datetime(df["join_date"])  # 转换日期
print("\n转换数据类型后：")
print(df)

# 4. 处理缺失值
df = df.dropna(subset=["age"])  # 删除 age 为 NaN 的行
print("\n删除 age 缺失值后：")
print(df)

# 5. 检测并处理异常值（使用 IQR 方法）
Q1 = df["age"].quantile(0.25)  # 第一四分位数
Q3 = df["age"].quantile(0.75)  # 第三四分位数
IQR = Q3 - Q1  # 四分位距

lower_bound = Q1 - 1.5 * IQR  # 下界
upper_bound = Q3 + 1.5 * IQR  # 上界

print(f"\nIQR 方法：正常范围 {lower_bound} - {upper_bound}")

# 筛选正常值
df_clean = df[(df["age"] >= lower_bound) & (df["age"] <= upper_bound)]
print("\n处理异常值后：")
print(df_clean)

# 6. 最终输出干净的数据
print("\n最终干净的数据：")
print(df_clean)
print("\n数据类型：")
print(df_clean.dtypes)
```

</details>

---

## 下一章预告

太棒了！你已经掌握了数据清洗的核心技能。现在你可以处理缺失值、重复值、异常值，转换数据类型，统一字符串格式。这些技能会让你在处理真实数据时游刃有余。

下一章，我们将学习**数据合并与连接**。实际工作中，数据往往分散在多个文件或表格中，你需要把它们合并在一起。你将学会如何使用 concat、merge、join 等方法，像 SQL 的 JOIN 一样把多个表格连接起来。这是数据分析中非常实用的技能。
