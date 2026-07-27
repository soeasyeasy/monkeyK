---
title: "第15章：Pandas 文件读写"
description: "掌握 CSV、Excel、JSON 与数据库的读写操作"
---

# 第15章：Pandas 文件读写

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Pandas 能读写哪些文件格式？
- CSV 文件读取时中文乱码怎么解决？
- Excel 文件怎么读取指定工作表？
- 大文件读不完、内存爆了怎么办？

这一章就是为了解答这些问题。文件读写是数据分析的第一步——数据从哪来、结果存到哪去，都离不开文件操作。

---

## 1 为什么需要文件读写？

### 痛点分析

假设你有一份 CSV 数据，想用 Python 处理：

```python
# ❌ 用纯 Python 读 CSV：麻烦且容易出错
import csv

data = []
with open('sales.csv', encoding='utf-8') as f:
    reader = csv.DictReader(f)        # 创建读取器
    for row in reader:
        data.append(row)              # 逐行添加到列表

# 想按条件筛选？还要自己写循环
result = [r for r in data if float(r['销售额']) > 10000]
```

```python
# ✅ 用 Pandas 读 CSV：一行搞定
import pandas as pd

df = pd.read_csv('sales.csv')            # 读取 CSV
result = df[df['销售额'] > 10000]        # 直接筛选
```

> 一句话总结：Pandas 让文件读写变得简单高效，支持多种格式。

### 生活化类比

打个比方：

> 文件读写就像去快递站取包裹和寄包裹。
> read_xxx() 是"取包裹" —— 把文件里的数据取出来变成 DataFrame
> to_xxx() 是"寄包裹" —— 把 DataFrame 保存到文件里
> 不同的文件格式就像不同的快递包装，Pandas 都能处理。

### 代码对比

| 操作方式 | 代码量 | 可读性 | 支持格式 |
| --- | --- | --- | --- |
| 纯 Python | 多行 | 差 | 需要自己处理 |
| Pandas | 一行 | 好 | CSV/Excel/JSON/数据库等 |

---

## 2 核心原理：读写方法对照

### 通俗类比

Pandas 的文件读写方法成对出现，就像"打开"和"保存"：

```
读操作（取包裹）          写操作（寄包裹）
read_csv()        <--->   to_csv()
read_excel()      <--->   to_excel()
read_json()       <--->   to_json()
read_clipboard()  <--->   to_clipboard()
read_sql()        <--->   to_sql()
```

### 对比表格：各种文件格式的读写方法

| 文件格式 | 读取方法 | 写入方法 | 典型用途 |
| --- | --- | --- | --- |
| CSV | read_csv() | to_csv() | 最常见的数据交换格式 |
| Excel | read_excel() | to_excel() | 办公场景常用 |
| JSON | read_json() | to_json() | Web API 数据格式 |
| 剪贴板 | read_clipboard() | to_clipboard() | 从网页复制数据 |
| 数据库 | read_sql() | to_sql() | 数据库交互 |
| HTML | read_html() | to_html() | 网页表格数据 |

---

## 3 基础用法

### CSV 读写

```python
import pandas as pd

# ===== 读取 CSV =====

# 基础读取
df = pd.read_csv('data.csv')                  # 读取 CSV 文件
print(df.head())                               # 查看前5行

# 指定编码（解决中文乱码）
df = pd.read_csv('data.csv', encoding='utf-8')     # UTF-8 编码
df = pd.read_csv('data.csv', encoding='gbk')       # GBK 编码（中文 Windows 常见）
df = pd.read_csv('data.csv', encoding='utf-8-sig') # 带 BOM 的 UTF-8

# 指定分隔符
df = pd.read_csv('data.csv', sep=',')          # 逗号分隔（默认）
df = pd.read_csv('data.txt', sep='\t')         # Tab 分隔
df = pd.read_csv('data.csv', sep=';')          # 分号分隔

# 指定列
df = pd.read_csv('data.csv', usecols=['姓名', '年龄'])  # 只读取指定列
df = pd.read_csv('data.csv', usecols=[0, 2])            # 按列索引读取

# 设置索引列
df = pd.read_csv('data.csv', index_col='ID')   # 把 ID 列作为行索引

# 跳过行
df = pd.read_csv('data.csv', skiprows=3)       # 跳过前3行
df = pd.read_csv('data.csv', header=1)         # 第2行作为表头（0开始计数）

# 指定列类型
df = pd.read_csv('data.csv', dtype={'年龄': int, '薪资': float})

# ===== 写入 CSV =====

df.to_csv('output.csv')                        # 保存到 CSV
df.to_csv('output.csv', index=False)           # 不保存行索引（推荐）
df.to_csv('output.csv', encoding='utf-8-sig')  # 指定编码（Excel 友好）
df.to_csv('output.csv', columns=['姓名', '年龄'])  # 只保存指定列
```

### Excel 读写

```python
import pandas as pd

# ===== 读取 Excel =====

# 基础读取
df = pd.read_excel('data.xlsx')                # 读取默认工作表
print(df.head())

# 指定工作表
df = pd.read_excel('data.xlsx', sheet_name='Sheet2')   # 按名称指定
df = pd.read_excel('data.xlsx', sheet_name=0)          # 按索引指定（第1个）
df = pd.read_excel('data.xlsx', sheet_name=None)       # 读取所有工作表，返回字典

# 跳过行和指定列
df = pd.read_excel('data.xlsx', skiprows=2)            # 跳过前2行
df = pd.read_excel('data.xlsx', usecols='A:C')         # 只读 A 到 C 列
df = pd.read_excel('data.xlsx', usecols=[0, 2, 4])     # 按列索引

# 设置索引
df = pd.read_excel('data.xlsx', index_col=0)           # 第1列作为索引

# ===== 写入 Excel =====

df.to_excel('output.xlsx')                     # 保存到 Excel
df.to_excel('output.xlsx', index=False)        # 不保存索引
df.to_excel('output.xlsx', sheet_name='销售数据')  # 指定工作表名
df.to_excel('output.xlsx', startrow=2)         # 从第3行开始写入

# 写入多个工作表
with pd.ExcelWriter('multi_sheet.xlsx') as writer:
    df1.to_excel(writer, sheet_name='销售数据', index=False)   # 第1个工作表
    df2.to_excel(writer, sheet_name='利润数据', index=False)   # 第2个工作表
```

### JSON 读写

```python
import pandas as pd

# ===== 读取 JSON =====

# 基础读取
df = pd.read_json('data.json')                 # 读取 JSON 文件
print(df.head())

# 从字符串读取
json_str = '[{"姓名":"小明","年龄":25},{"姓名":"小红","年龄":30}]'
df = pd.read_json(json_str)                    # 直接解析 JSON 字符串
print(df)

# 指定方向（orient 参数）
# records 格式（最常用）：[{"col1":val1, "col2":val2}, ...]
df = pd.read_json('data.json', orient='records')

# columns 格式：{"col1":{"0":val,"1":val}, "col2":{...}}
df = pd.read_json('data.json', orient='columns')

# index 格式：{"idx1":{"col1":val,"col2":val}, "idx2":{...}}
df = pd.read_json('data.json', orient='index')

# ===== 写入 JSON =====

df.to_json('output.json')                      # 保存为 JSON
df.to_json('output.json', orient='records', force_ascii=False)
# orient='records'     输出格式：[{"col1":val1}, ...]
# force_ascii=False    不转义中文（保留中文字符）

df.to_json('output.json', orient='records', indent=2, force_ascii=False)
# indent=2             格式化缩进（方便阅读）
```

### 剪贴板读写

```python
import pandas as pd

# 从剪贴板读取（从网页/Excel复制的表格数据）
df = pd.read_clipboard()                       # 读取剪贴板内容
print(df)

# 复制到剪贴板
df.to_clipboard()                              # 把 DataFrame 复制到剪贴板
df.to_clipboard(sep=',')                       # 用逗号分隔
df.to_clipboard(excel=True)                    # Excel 友好格式
```

### 数据库读写

```python
import pandas as pd
import sqlite3  # Python 内置的 SQLite 数据库

# ===== 读取数据库 =====

# 创建数据库连接
conn = sqlite3.connect('my_database.db')       # 连接到 SQLite 数据库

# 读取整张表
df = pd.read_sql('SELECT * FROM users', conn)  # 执行 SQL 查询
print(df.head())

# 带条件查询
df = pd.read_sql('SELECT * FROM users WHERE age > 25', conn)

# 使用表名直接读取（需要 SQLAlchemy 连接）
# df = pd.read_sql_table('users', conn)

# ===== 写入数据库 =====

df.to_sql('new_table', conn)                   # 写入新表
df.to_sql('users', conn, if_exists='append')   # 追加数据到已有表
df.to_sql('users', conn, if_exists='replace')  # 替换已有表
df.to_sql('users', conn, if_exists='fail')     # 表存在则报错
df.to_sql('users', conn, index=False)          # 不写入索引

# 关闭连接
conn.close()
```

---

## 4 进阶用法

### 常用参数详解

```python
import pandas as pd

# read_csv 常用参数一览
df = pd.read_csv(
    'data.csv',
    encoding='utf-8',          # 编码格式
    sep=',',                   # 分隔符
    header=0,                  # 表头行号（0表示第1行）
    index_col=None,            # 索引列
    usecols=None,              # 只读取指定列
    dtype=None,                # 列数据类型
    skiprows=None,             # 跳过前N行
    nrows=None,                # 只读取前N行
    na_values=['', 'NA', 'N/A'],  # 自定义缺失值标记
    parse_dates=False,         # 解析日期列
    chunksize=None,            # 分块读取大小
)
```

### 常用参数对比表格

| 参数 | 作用 | 常用值 |
| --- | --- | --- |
| encoding | 编码格式 | 'utf-8', 'gbk', 'utf-8-sig' |
| sep | 分隔符 | ',', '\t', ';' |
| header | 表头行号 | 0（第1行）, 1（第2行）, None |
| index_col | 索引列 | 列名或列索引 |
| usecols | 只读指定列 | ['列1','列2'] 或 [0,2] |
| dtype | 列类型 | {'列名': int} |
| skiprows | 跳过行 | 3（跳过前3行） |
| nrows | 只读前N行 | 1000 |
| na_values | 缺失值标记 | ['', 'NA', 'N/A'] |
| parse_dates | 解析日期 | True 或 ['日期列'] |
| chunksize | 分块大小 | 10000 |
| if_exists | 写入模式 | 'fail', 'replace', 'append' |

### 大文件处理：分块读取

```python
import pandas as pd

# 方法1：chunksize 分块读取
chunk_size = 10000  # 每次读取10000行
chunks = pd.read_csv('big_data.csv', chunksize=chunk_size)

result = []
for chunk in chunks:                   # 逐块处理
    # 对每个块做筛选
    filtered = chunk[chunk['销售额'] > 10000]
    result.append(filtered)

df = pd.concat(result)  # 合并所有块的结果
print(f"共处理 {len(df)} 条数据")

# 方法2：iterator 迭代读取
reader = pd.read_csv('big_data.csv', iterator=True)
chunk = reader.get_chunk(5000)  # 读取5000行
print(chunk)

# 方法3：nrows 限制读取行数（先看数据长什么样）
df_preview = pd.read_csv('big_data.csv', nrows=100)  # 只读前100行
print(df_preview.head())
```

### 日期解析

```python
import pandas as pd

# 自动解析日期列
df = pd.read_csv('sales.csv', parse_dates=['日期'])
print(df.dtypes)  # 日期列会变成 datetime64 类型

# 自定义日期格式
df = pd.read_csv(
    'sales.csv',
    parse_dates=['日期'],
    date_format='%Y/%m/%d'  # 日期格式：年/月/日
)

# 读取后手动转换
df = pd.read_csv('sales.csv')
df['日期'] = pd.to_datetime(df['日期'])  # 手动转成日期类型
```

---

## 5 对比表格

### 各格式读写方法速查

| 格式 | 读取 | 写入 | 常用参数 |
| --- | --- | --- | --- |
| CSV | read_csv() | to_csv() | encoding, sep, index_col |
| Excel | read_excel() | to_excel() | sheet_name, index |
| JSON | read_json() | to_json() | orient, force_ascii |
| 剪贴板 | read_clipboard() | to_clipboard() | sep |
| 数据库 | read_sql() | to_sql() | if_exists, index |

### CSV 编码选择指南

| 编码 | 适用场景 | 说明 |
| --- | --- | --- |
| utf-8 | 通用 | 最常用，跨平台兼容 |
| utf-8-sig | Excel 打开 | 带 BOM，Excel 能正确识别中文 |
| gbk | 中文 Windows | 中文 Windows 系统默认编码 |
| latin1 | 西欧语言 | 处理欧洲数据时可能用到 |

---

## 6 新手常见误区

### 误区 1："忽略编码问题"

中文文件经常因为编码不对导致乱码：

```python
# ❌ 错误：不指定编码，遇到中文可能乱码
df = pd.read_csv('data.csv')  # 如果文件是 GBK 编码，会乱码

# ✅ 正确：根据文件来源选择编码
df = pd.read_csv('data.csv', encoding='utf-8')       # 通用
df = pd.read_csv('data.csv', encoding='gbk')          # 中文 Windows
df = pd.read_csv('data.csv', encoding='utf-8-sig')    # Excel 导出的 CSV
```

### 误区 2："大文件一次性读入内存"

大文件可能导致内存溢出：

```python
# ❌ 错误：10GB 的文件直接读
df = pd.read_csv('huge_data.csv')  # 内存可能不够

# ✅ 正确：分块读取处理
chunks = pd.read_csv('huge_data.csv', chunksize=50000)  # 每次读5万行
for chunk in chunks:
    # 逐块处理，不会占满内存
    process(chunk)
```

### 误区 3："to_csv 不设置 index=False"

默认会把索引也写入文件，导致多出一列：

```python
# ❌ 错误：索引被写入文件
df.to_csv('output.csv')
# 输出：,姓名,年龄
#       0,小明,25
#       1,小红,30   <-- 多了一列索引

# ✅ 正确：不写入索引
df.to_csv('output.csv', index=False)
# 输出：姓名,年龄
#       小明,25
#       小红,30
```

### 误区 4："Excel 文件只能读第一个工作表"

read_excel 默认只读第一个工作表，但可以指定：

```python
# ❌ 以为只能读第一个表
df = pd.read_excel('data.xlsx')  # 默认 sheet_name=0

# ✅ 可以指定工作表
df = pd.read_excel('data.xlsx', sheet_name='Sheet2')    # 按名称
df = pd.read_excel('data.xlsx', sheet_name=1)           # 按索引
all_sheets = pd.read_excel('data.xlsx', sheet_name=None) # 全部读取
```

---

## 7 动手练习

### 练习 1（基础）：CSV 读写

创建一个包含学生信息的 DataFrame，保存为 CSV 文件，然后再读取回来验证。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建学生数据
df = pd.DataFrame({
    '姓名': ['小明', '小红', '小刚', '小丽'],
    '年龄': [18, 19, 18, 20],
    '成绩': [85, 92, 78, 88]
})

# 保存为 CSV（不写入索引）
df.to_csv('students.csv', index=False, encoding='utf-8-sig')
print("已保存到 students.csv")

# 读取回来
df_read = pd.read_csv('students.csv', encoding='utf-8-sig')
print(df_read)
#    姓名  年龄  成绩
# 0  小明   18   85
# 1  小红   19   92
# 2  小刚   18   78
# 3  小丽   20   88
```

</details>

### 练习 2（进阶）：Excel 多工作表

创建一个 Excel 文件，包含两个工作表：
- 工作表1："销售数据"
- 工作表2："利润数据"
然后分别读取两个工作表并打印。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 创建销售数据
sales_df = pd.DataFrame({
    '月份': ['1月', '2月', '3月'],
    '销售额': [10000, 12000, 15000]
})

# 创建利润数据
profit_df = pd.DataFrame({
    '月份': ['1月', '2月', '3月'],
    '利润': [2000, 2500, 3000]
})

# 写入 Excel 的两个工作表
with pd.ExcelWriter('report.xlsx') as writer:
    sales_df.to_excel(writer, sheet_name='销售数据', index=False)
    profit_df.to_excel(writer, sheet_name='利润数据', index=False)
print("已保存到 report.xlsx")

# 分别读取
sales_read = pd.read_excel('report.xlsx', sheet_name='销售数据')
profit_read = pd.read_excel('report.xlsx', sheet_name='利润数据')

print("销售数据：")
print(sales_read)
print("\n利润数据：")
print(profit_read)
```

</details>

### 练习 3（挑战）：大文件分块处理

模拟一个大文件（100行数据），用分块方式读取，筛选出销售额大于 5000 的记录，并统计总共有多少条符合条件的数据。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import numpy as np

# 模拟生成大文件（100行数据）
np.random.seed(42)
big_df = pd.DataFrame({
    '订单ID': range(1, 101),
    '产品': np.random.choice(['手机', '电脑', '平板'], 100),
    '销售额': np.random.randint(1000, 10000, 100)
})
big_df.to_csv('big_orders.csv', index=False, encoding='utf-8-sig')
print("已生成模拟大文件 big_orders.csv")

# 分块读取并筛选
chunk_size = 20  # 每次读20行
chunks = pd.read_csv('big_orders.csv', chunksize=chunk_size, encoding='utf-8-sig')

result = []
total_count = 0
for chunk in chunks:
    # 筛选销售额大于 5000 的记录
    filtered = chunk[chunk['销售额'] > 5000]
    result.append(filtered)
    total_count += len(filtered)

# 合并结果
final_df = pd.concat(result)
print(f"\n销售额大于 5000 的记录共 {total_count} 条")
print(final_df.head(10))
```

</details>

---

## 8 下一章预告

下一章是 **综合实战项目**。我们会用真实数据完成一个完整的数据分析流程：从获取数据、清洗、探索、分析到可视化展示。这是对你所学知识的全面检验，准备好了吗？
