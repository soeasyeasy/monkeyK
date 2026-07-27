---
title: "第13章：Pandas 时间序列处理"
description: "掌握时间戳、时间序列、重采样与移动窗口"
---

# 第13章：Pandas 时间序列处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 时间序列是什么？和普通数据有什么不同？
- 日期字符串怎么转换成真正的时间类型？
- resample 重采样到底怎么用？上采样和下采样有什么区别？
- 移动窗口 rolling 是什么意思？实际有什么用？

这一章就是为了解答这些问题。时间序列处理在金融、销售分析、日志监控等场景中非常常见，掌握它能让你轻松应对"按时间统计"的需求。

---

## 1 为什么需要时间序列处理？

### 痛点分析

假设你有一份销售记录，日期是字符串格式，老板问你："每月的总销售额是多少？"

```python
# ❌ 不用时间序列：手动拆分字符串，又慢又容易出错
sales = [
    ('2024-01-05', 1000),
    ('2024-01-15', 2000),
    ('2024-02-03', 1500),
    ('2024-02-20', 3000),
]

monthly = {}
for date_str, amount in sales:
    month = date_str[:7]  # 手动截取年月字符串
    if month not in monthly:
        monthly[month] = 0
    monthly[month] += amount
print(monthly)  # {'2024-01': 3000, '2024-02': 4500}
```

```python
# ✅ 用 Pandas 时间序列：优雅高效
import pandas as pd

df = pd.DataFrame({
    '日期': pd.to_datetime(['2024-01-05', '2024-01-15', '2024-02-03', '2024-02-20']),
    '销售额': [1000, 2000, 1500, 3000]
})
df = df.set_index('日期')  # 把日期设为索引

# 按月重采样求和
result = df.resample('M')['销售额'].sum()  # 一行搞定
print(result)
# 日期
# 2024-01-31    3000
# 2024-02-29    4500
```

> 一句话总结：Pandas 时间序列让时间相关的操作变得简单直观。

### 生活化类比

打个比方：

> 普通数据就像一本没有目录的书，找东西要一页页翻。
> 时间序列数据就像一本有目录的书——日期就是目录，你可以直接翻到某个月、某一年，快速找到想要的内容。
> resample 就像把每天的日记按月装订成册，方便查看月度总结。

### 代码对比

| 操作方式 | 代码量 | 可读性 | 功能 |
| --- | --- | --- | --- |
| 手动处理日期字符串 | 多行 | 差 | 只能做简单操作 |
| Pandas 时间序列 | 一行 | 好 | 支持重采样、移动窗口、时区等 |

---

## 2 核心原理：时间戳与时间索引

### 通俗类比

Pandas 处理时间有四个核心概念，就像时间的四种"形态"：

```
Timestamp（时间戳）  —— 一个具体的时间点，比如"2024年1月1日中午12点"
DatetimeIndex        —— 一排时间戳组成的索引，就像日历上的一排日期
Timedelta            —— 两个时间点之间的间隔，比如"3天5小时"
Period               —— 一段时间，比如"2024年1月"这整整一个月
```

### 对比表格：四种时间类型

| 类型 | 说明 | 类比 | 示例 |
| --- | --- | --- | --- |
| Timestamp | 一个时间点 | 日历上的某一天 | 2024-01-15 12:00:00 |
| DatetimeIndex | 多个时间点的索引 | 一整页日历 | [2024-01-01, 2024-01-02, ...] |
| Timedelta | 时间间隔 | 两个日期之间隔了几天 | 3 days |
| Period | 一段时间 | 某个月、某一年 | 2024-01（整月） |

---

## 3 基础用法

### 时间戳 Timestamp

```python
import pandas as pd

# 创建时间戳
ts = pd.Timestamp('2024-01-15')        # 用字符串创建
print(ts)                               # 2024-01-15 00:00:00

ts2 = pd.Timestamp(2024, 1, 15, 12, 30) # 用年月日时分创建
print(ts2)                               # 2024-01-15 12:30:00

# 字符串转时间戳
ts3 = pd.to_datetime('2024-01-15')      # 把字符串转成时间戳
print(ts3)                               # 2024-01-15 00:00:00

# 批量转换
dates = pd.to_datetime(['2024-01-01', '2024-02-15', '2024-03-20'])
print(dates)  # DatetimeIndex(['2024-01-01', '2024-02-15', '2024-03-20'], ...)
```

### 日期范围：date_range

```python
import pandas as pd

# 生成一段连续的日期
dates = pd.date_range(start='2024-01-01', end='2024-01-10')
print(dates)
# DatetimeIndex(['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04',
#                '2024-01-05', '2024-01-06', '2024-01-07', '2024-01-08',
#                '2024-01-09', '2024-01-10'], ...)

# 指定周期（每隔7天）
dates_weekly = pd.date_range(start='2024-01-01', periods=5, freq='W')
print(dates_weekly)  # 每周一的日期，共5个

# 指定频率（每月第一天）
dates_monthly = pd.date_range(start='2024-01-01', periods=6, freq='MS')
print(dates_monthly)  # 每月1号，共6个月
```

### 时间索引操作

```python
import pandas as pd

# 创建带时间索引的 DataFrame
df = pd.DataFrame({
    '销售额': [100, 200, 150, 300, 250, 400]
}, index=pd.date_range('2024-01-01', periods=6, freq='MS'))

print(df)
#             销售额
# 2024-01-01    100
# 2024-02-01    200
# 2024-03-01    150
# 2024-04-01    300
# 2024-05-01    250
# 2024-06-01    400

# 按年份筛选
print(df['2024'])  # 取出 2024 年所有数据

# 按月筛选
print(df['2024-03'])  # 取出 2024 年 3 月的数据

# 用 loc 按时间范围筛选
print(df.loc['2024-02':'2024-04'])  # 取出 2 月到 4 月的数据

# 访问时间的属性
print(df.index.year)    # [2024 2024 2024 2024 2024 2024]
print(df.index.month)   # [1 2 3 4 5 6]
print(df.index.day)     # [1 1 1 1 1 1]
```

### 重采样：resample

```python
import pandas as pd

# 创建每日销售数据
df = pd.DataFrame({
    '销售额': [100, 200, 150, 300, 250, 400, 350, 500]
}, index=pd.date_range('2024-01-01', periods=8, freq='D'))

print(df)
#             销售额
# 2024-01-01    100
# 2024-01-02    200
# ...（共8天）

# 下采样：把高频数据转成低频（日 -> 周）
weekly = df.resample('W').sum()  # 按周汇总求和
print(weekly)
#             销售额
# 2024-01-07    950   <-- 第一周（1-7日）总和
# 2024-01-14    850   <-- 第二周（8日）总和

# 下采样：日 -> 月
monthly = df.resample('M').mean()  # 按月求平均
print(monthly)

# 上采样：把低频数据转成高频（会产生 NaN）
df2 = pd.DataFrame({'销售额': [100, 200]}, index=pd.date_range('2024-01-01', periods=2, freq='MS'))
daily = df2.resample('D').asfreq()  # 月 -> 日，中间日期填 NaN
print(daily)

# 上采样 + 填充
daily_filled = df2.resample('D').ffill()  # 用前值填充
print(daily_filled)
```

### 重采样常用频率代码

| 代码 | 含义 | 说明 |
| --- | --- | --- |
| D | 天 | 每日 |
| W | 周 | 每周（默认周日） |
| M | 月末 | 每月最后一天 |
| MS | 月初 | 每月第一天 |
| Q | 季末 | 每季度最后一天 |
| A / Y | 年末 | 每年最后一天 |
| H | 小时 | 每小时 |
| T / min | 分钟 | 每分钟 |

### 移动窗口：rolling 和 expanding

```python
import pandas as pd

# 创建每日销售数据
df = pd.DataFrame({
    '销售额': [100, 200, 150, 300, 250, 400, 350, 500]
}, index=pd.date_range('2024-01-01', periods=8, freq='D'))

# 移动平均：3天滚动窗口
# 意思是：每个位置取"自己 + 前2天"共3天的平均值
rolling_mean = df['销售额'].rolling(window=3).mean()
print(rolling_mean)
# 2024-01-01      NaN   <-- 第一天不够3天，所以是 NaN
# 2024-01-02      NaN   <-- 第二天也不够3天
# 2024-01-03    150.0   <-- (100+200+150)/3 = 150
# 2024-01-04    216.7   <-- (200+150+300)/3 ≈ 216.7
# 2024-01-05    233.3   <-- (150+300+250)/3 ≈ 233.3
# ...

# 移动求和：3天滚动窗口
rolling_sum = df['销售额'].rolling(window=3).sum()
print(rolling_sum)

# 扩展窗口：从开始到当前位置的所有数据
expanding_mean = df['销售额'].expanding().mean()
print(expanding_mean)
# 2024-01-01    100.0   <-- 只有第1天，均值 100
# 2024-01-02    150.0   <-- 前2天均值 (100+200)/2
# 2024-01-03    150.0   <-- 前3天均值 (100+200+150)/3
# 2024-01-04    187.5   <-- 前4天均值 (100+200+150+300)/4
# ...
```

### 时区处理基础

```python
import pandas as pd

# 创建时间戳
ts = pd.Timestamp('2024-01-15 12:00:00')
print(ts)  # 2024-01-15 12:00:00（无时区）

# 添加时区
ts_beijing = ts.tz_localize('Asia/Shanghai')  # 设置为北京时间
print(ts_beijing)  # 2024-01-15 12:00:00+08:00

ts_utc = ts_beijing.tz_convert('UTC')  # 转换成 UTC 时间
print(ts_utc)  # 2024-01-15 04:00:00+00:00（北京时间减8小时）

# 批量设置时区
dates = pd.date_range('2024-01-01', periods=3, freq='D', tz='Asia/Shanghai')
print(dates)
```

---

## 4 对比表格

### 时间序列常用方法速查

| 方法 | 作用 | 示例 |
| --- | --- | --- |
| pd.to_datetime() | 字符串转时间 | pd.to_datetime('2024-01-01') |
| pd.Timestamp() | 创建时间戳 | pd.Timestamp('2024-01-01') |
| pd.date_range() | 生成日期范围 | pd.date_range('2024-01-01', periods=5) |
| df.resample() | 重采样 | df.resample('M').sum() |
| df.rolling() | 移动窗口 | df.rolling(3).mean() |
| df.expanding() | 扩展窗口 | df.expanding().sum() |
| ts.tz_localize() | 设置时区 | ts.tz_localize('Asia/Shanghai') |
| ts.tz_convert() | 转换时区 | ts.tz_convert('UTC') |

### resample vs rolling

| 特性 | resample | rolling |
| --- | --- | --- |
| 用途 | 改变数据频率 | 计算滑动统计量 |
| 结果长度 | 变短（下采样）或变长（上采样） | 和原数据一样长 |
| 典型场景 | 把日数据转成月数据 | 计算3天移动平均 |
| 需要时间索引 | 是 | 是 |

---

## 5 新手常见误区

### 误区 1："字符串和时间类型是一样的"

不一样！字符串不能直接做时间操作，必须先转换：

```python
# ❌ 错误：把日期当字符串处理
df = pd.DataFrame({'日期': ['2024-01-01', '2024-02-01']})
print(df['日期'].dt.month)  # 报错！字符串没有 dt 属性

# ✅ 正确：先转成时间类型
df['日期'] = pd.to_datetime(df['日期'])  # 先转换
print(df['日期'].dt.month)  # [1, 2] 现在可以访问月份了
```

### 误区 2："resample 不需要设置索引"

resample 必须基于时间索引才能工作：

```python
# ❌ 错误：日期在普通列里
df = pd.DataFrame({
    '日期': pd.date_range('2024-01-01', periods=5),
    '销售额': [100, 200, 150, 300, 250]
})
df.resample('W').sum()  # 报错！没有 DatetimeIndex

# ✅ 正确：先把日期设为索引
df = df.set_index('日期')  # 设置时间索引
df.resample('W').sum()     # 现在可以重采样了
```

### 误区 3："rolling 窗口包含当天"

rolling 的窗口默认包含当天和之前的数据：

```python
# window=3 表示"当天 + 前2天"共3天
df['销售额'].rolling(window=3).mean()
# 位置0：NaN（不够3天）
# 位置1：NaN（不够3天）
# 位置2：(第0天+第1天+第2天)/3
# 位置3：(第1天+第2天+第3天)/3
```

### 误区 4："dt 属性只能在索引上用"

dt 属性既可以在时间索引上用，也可以在时间类型的列上用：

```python
df = pd.DataFrame({
    '日期': pd.to_datetime(['2024-01-15', '2024-03-20']),
    '销售额': [100, 200]
})

# ✅ 在列上使用 dt
print(df['日期'].dt.year)   # [2024, 2024]
print(df['日期'].dt.month)  # [1, 3]
print(df['日期'].dt.day)    # [15, 20]
```

---

## 6 动手练习

### 练习 1（基础）：创建时间序列

创建一个 DataFrame，包含从 2024-01-01 开始连续 7 天的日期和对应的销售额（自己编数据），然后筛选出周末（周六周日）的数据。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建 7 天的日期和销售额
df = pd.DataFrame({
    '销售额': [100, 200, 150, 300, 250, 400, 350]
}, index=pd.date_range('2024-01-01', periods=7, freq='D'))

print(df)
#             销售额
# 2024-01-01    100   <-- 周一
# 2024-01-02    200   <-- 周二
# 2024-01-03    150   <-- 周三
# 2024-01-04    300   <-- 周四
# 2024-01-05    250   <-- 周五
# 2024-01-06    400   <-- 周六
# 2024-01-07    350   <-- 周日

# 筛选周末数据（weekday 5=周六，6=周日）
weekend = df[df.index.weekday >= 5]
print(weekend)
#             销售额
# 2024-01-06    400
# 2024-01-07    350
```

</details>

### 练习 2（进阶）：重采样 + 移动平均

有一份每日销售数据，要求：
1. 按周重采样，计算每周的总销售额
2. 计算 3 天移动平均销售额

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建 14 天的每日销售数据
df = pd.DataFrame({
    '销售额': [100, 200, 150, 300, 250, 400, 350,
               120, 220, 180, 310, 260, 420, 380]
}, index=pd.date_range('2024-01-01', periods=14, freq='D'))

# 1. 按周重采样，求每周总销售额
weekly_sum = df.resample('W').sum()
print("每周总销售额：")
print(weekly_sum)

# 2. 计算 3 天移动平均
df['3天移动平均'] = df['销售额'].rolling(window=3).mean()
print("\n带移动平均的数据：")
print(df)
```

</details>

### 练习 3（挑战）：综合时间分析

有一份带时间戳的订单数据，要求：
1. 把字符串日期转成时间类型并设为索引
2. 按月重采样，计算每月总销售额和订单数
3. 计算每月销售额的 3 个月移动平均

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 模拟订单数据
df = pd.DataFrame({
    '日期': ['2024-01-05', '2024-01-15', '2024-02-03', '2024-02-20',
             '2024-03-10', '2024-03-25', '2024-04-05', '2024-04-18'],
    '销售额': [1000, 2000, 1500, 3000, 2500, 4000, 3500, 5000],
    '订单数': [5, 10, 8, 15, 12, 20, 18, 25]
})

# 1. 转换日期类型并设为索引
df['日期'] = pd.to_datetime(df['日期'])   # 字符串转时间
df = df.set_index('日期')                 # 设为索引

# 2. 按月重采样
monthly = df.resample('M').agg({
    '销售额': 'sum',    # 每月总销售额
    '订单数': 'sum'     # 每月总订单数
})
print("月度汇总：")
print(monthly)

# 3. 计算 3 个月移动平均
monthly['销售额_3月移动平均'] = monthly['销售额'].rolling(window=3).mean()
print("\n带移动平均的月度数据：")
print(monthly)
```

</details>

---

## 7 下一章预告

下一章我们会学习 **Pandas 数据可视化**。你会学到如何用 Pandas 内置的绑图方法快速创建折线图、柱状图、饼图等，让数据"说话"。毕竟一图胜千言，可视化是数据分析中不可或缺的技能。
