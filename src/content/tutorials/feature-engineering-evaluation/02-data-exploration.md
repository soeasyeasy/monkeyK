---
title: "第2章：数据探索与可视化"
description: "学会用描述性统计和可视化图表了解数据"
---

# 第2章：数据探索与可视化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 拿到数据后第一步应该做什么？
- 怎么快速了解数据的基本情况？
- 可视化图表能帮我发现什么？
- 怎么判断特征之间有没有关系？

这一章就是为了解答这些问题。数据探索是特征工程的 **第一步**，就像医生看病要先"望闻问切"一样，我们需要先了解数据的全貌，才能做出正确的特征工程决策。

---

## 1 为什么需要数据探索？

### 痛点分析

想象你是一个侦探，接手了一个案件。你会不经过任何调查就直接指认凶手吗？当然不会。你需要先 **收集线索、分析证据、了解案情**，才能做出正确的判断。

数据探索就是你作为"数据侦探"的调查过程。不做数据探索就直接建模，就像不看证据就断案——结果往往不可靠。

### 不做数据探索的后果

```python
# ❌ 不做数据探索，直接建模
from sklearn.linear_model import LinearRegression

# 你不知道数据有缺失值、异常值、分布严重偏斜
model = LinearRegression()
model.fit(X, y)  # 可能得到很差的结果，甚至报错
# 而且你完全不知道为什么效果不好
```

```python
# ✅ 先做数据探索，再建模
import pandas as pd

# 了解数据全貌
print(df.shape)              # 数据有多少行多少列
print(df.describe())         # 数值统计信息
print(df.isnull().sum())     # 缺失值情况
print(df.dtypes)             # 数据类型
# 现在你对数据有了基本了解，可以做出正确的处理决策
```

> **一句话总结**：数据探索让你"知己知彼"，是做出正确特征工程决策的前提。

---

## 2 核心原理

### 数据探索的四个维度

```
数据探索
  │
  ├── 1. 数据概览 ──── 形状、类型、缺失值
  │
  ├── 2. 单变量分析 ── 每个特征的分布情况
  │
  ├── 3. 双变量分析 ── 两个特征之间的关系
  │
  └── 4. 多变量分析 ── 多个特征的综合关系
```

### 常用探索方法对比

| 方法 | 目的 | 工具 | 适用场景 |
| --- | --- | --- | --- |
| describe() | 数值统计概览 | Pandas | 快速了解数值分布 |
| value_counts() | 类别分布 | Pandas | 了解类别特征 |
| 直方图 | 数值分布形状 | Matplotlib | 判断是否需要变换 |
| 箱线图 | 异常值检测 | Matplotlib | 发现极端值 |
| 散点图 | 两变量关系 | Matplotlib | 判断线性/非线性关系 |
| 热力图 | 相关性矩阵 | Seaborn | 发现多重共线性 |

---

## 3 基础用法

### 数据概览：快速了解数据

```python
import pandas as pd
import numpy as np

# 创建示例数据
np.random.seed(42)
df = pd.DataFrame({
    'age': np.random.normal(35, 10, 100).astype(int),
    'income': np.random.exponential(50000, 100).astype(int),
    'score': np.random.uniform(0, 100, 100).round(1),
    'city': np.random.choice(['北京', '上海', '广州', '深圳'], 100),
    'gender': np.random.choice(['M', 'F'], 100),
})

# 随机引入缺失值
df.loc[np.random.random(100) < 0.05, 'age'] = np.nan
df.loc[np.random.random(100) < 0.03, 'income'] = np.nan

# 1. 查看数据形状
print(f"数据形状: {df.shape}")  # (100, 5)

# 2. 查看前 5 行
print("\n前5行:\n", df.head())

# 3. 查看数据类型
print("\n数据类型:\n", df.dtypes)

# 4. 查看缺失值
print("\n缺失值:\n", df.isnull().sum())

# 5. 数值统计信息
print("\n数值统计:\n", df.describe())

# 6. 类别特征统计
print("\n城市分布:\n", df['city'].value_counts())
print("\n性别分布:\n", df['gender'].value_counts())
```

> **原理**：`describe()` 会计算 count（计数）、mean（均值）、std（标准差）、min（最小值）、25%/50%/75%（分位数）、max（最大值），帮你快速了解数值特征的分布范围。

---

## 4 进阶用法

### 可视化探索

```python
import matplotlib.pyplot as plt
import seaborn as sns

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建画布
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

# 1. 直方图：查看年龄分布
axes[0, 0].hist(df['age'].dropna(), bins=20, edgecolor='black', alpha=0.7)
axes[0, 0].set_title('年龄分布')
axes[0, 0].set_xlabel('年龄')
axes[0, 0].set_ylabel('频数')

# 2. 箱线图：检测收入异常值
axes[0, 1].boxplot(df['income'].dropna(), vert=True)
axes[0, 1].set_title('收入箱线图')
axes[0, 1].set_ylabel('收入')

# 3. 柱状图：查看城市分布
city_counts = df['city'].value_counts()
axes[0, 2].bar(city_counts.index, city_counts.values, color='steelblue')
axes[0, 2].set_title('城市分布')
axes[0, 2].set_xlabel('城市')
axes[0, 2].set_ylabel('人数')

# 4. 散点图：年龄与收入的关系
axes[1, 0].scatter(df['age'], df['income'], alpha=0.5, s=20)
axes[1, 0].set_title('年龄 vs 收入')
axes[1, 0].set_xlabel('年龄')
axes[1, 0].set_ylabel('收入')

# 5. 相关性热力图
numeric_df = df.select_dtypes(include=[np.number])
sns.heatmap(numeric_df.corr(), annot=True, cmap='RdBu_r', center=0,
            ax=axes[1, 1], fmt='.2f')
axes[1, 1].set_title('相关性热力图')

# 6. 小提琴图：不同性别的分数分布
sns.violinplot(data=df, x='gender', y='score', ax=axes[1, 2])
axes[1, 2].set_title('性别 vs 分数')

plt.tight_layout()
plt.savefig('data_exploration.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 使用 Seaborn 快速探索

```python
# Seaborn 的 pairplot 可以一次性查看所有变量两两关系
# sns.pairplot(df, hue='gender', diag_kind='kde')
# plt.show()

# Seaborn 的 countplot 快速查看类别分布
# sns.countplot(data=df, x='city', hue='gender')
# plt.show()
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 数据概览 | shape、dtypes、isnull().sum()、describe() |
| 单变量分析 | 直方图看分布、箱线图看异常值 |
| 双变量分析 | 散点图看关系、相关系数看线性关系 |
| 多变量分析 | 热力图看相关性矩阵 |
| 探索顺序 | 先概览 → 再单变量 → 再双变量 → 再多变量 |

---

## 6 新手常见误区

### 误区 1："数据探索就是看看 describe() 的输出"

**错！** 数据探索远不止看统计数字。你需要结合可视化来"看"数据的分布形状、异常值、缺失模式等。很多信息是数字看不出来的，但图表能一目了然。

正确做法：统计数字 + 可视化图表结合使用。

### 误区 2："数据探索只需要做一次"

不对。数据探索是一个 **持续的过程**。在处理完缺失值后，你需要再次探索，看看数据分布有没有变化。在选择完特征后，你也需要再次探索，看看特征之间的关系。

正确做法：在特征工程的每个阶段都进行数据探索。

### 误区 3："忽略缺失值的模式"

很多人只看缺失值的数量，不看缺失值的 **模式**。比如，如果某个年龄段的人全部缺失了年龄信息，这可能意味着缺失不是随机的，需要特殊处理。

正确做法：分析缺失值的模式，判断是随机缺失还是有规律的缺失。

---

## 7 动手练习

### 练习 1：基础练习

加载 sklearn 的鸢尾花数据集，完成以下探索：
1. 查看数据形状和数据类型
2. 用 describe() 查看统计信息
3. 绘制每个特征的直方图

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
import matplotlib.pyplot as plt

# 加载数据
iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df['species'] = iris.target

# 1. 查看基本信息
print(f"形状: {df.shape}")
print(f"类型:\n{df.dtypes}")

# 2. 统计信息
print(f"\n统计:\n{df.describe()}")

# 3. 绘制直方图
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
for i, col in enumerate(iris.feature_names):
    ax = axes[i // 2, i % 2]
    ax.hist(df[col], bins=15, edgecolor='black', alpha=0.7)
    ax.set_title(col)
plt.tight_layout()
plt.show()
```

</details>

### 练习 2：进阶练习

创建一个包含异常值的数据集，用箱线图检测异常值，并分析异常值对均值和中位数的影响。

<details>
<summary>点击查看答案</summary>

```python
# 创建含异常值的数据
data = np.concatenate([
    np.random.normal(50, 10, 95),  # 正常数据
    [200, 250, 300, 350, 400]       # 异常值
])

# 箱线图
plt.figure(figsize=(8, 5))
plt.boxplot(data, vert=True)
plt.title('含异常值的数据箱线图')
plt.ylabel('数值')
plt.show()

# 对比均值和中位数
print(f"均值: {np.mean(data):.2f}")      # 被异常值拉高
print(f"中位数: {np.median(data):.2f}")  # 不受异常值影响
print(f"差异: {abs(np.mean(data) - np.median(data)):.2f}")
```

</details>

### 练习 3（挑战）：综合练习

对泰坦尼克号数据集（或模拟数据）进行完整的数据探索，包括：
1. 数据概览（形状、缺失值、类型）
2. 数值特征分布分析
3. 类别特征分布分析
4. 特征相关性分析
5. 基于探索结果提出特征工程建议

<details>
<summary>点击查看答案</summary>

```python
# 模拟泰坦尼克号数据
np.random.seed(42)
n = 500
titanic = pd.DataFrame({
    'pclass': np.random.choice([1, 2, 3], n, p=[0.24, 0.21, 0.55]),
    'age': np.where(np.random.random(n) < 0.2, np.nan,
                    np.random.normal(30, 14, n).clip(0.5, 80)),
    'sibsp': np.random.choice([0, 1, 2, 3], n),
    'parch': np.random.choice([0, 1, 2], n, p=[0.76, 0.13, 0.11]),
    'fare': np.random.exponential(32, n).round(2),
    'sex': np.random.choice(['male', 'female'], n, p=[0.65, 0.35]),
    'survived': np.random.choice([0, 1], n),
})

# 1. 数据概览
print(f"形状: {titanic.shape}")
print(f"缺失值:\n{titanic.isnull().sum()}")
print(f"数据类型:\n{titanic.dtypes}")

# 2. 数值特征分布
print(f"\n数值统计:\n{titanic.describe()}")

# 3. 类别特征分布
print(f"\n舱位分布:\n{titanic['pclass'].value_counts()}")
print(f"\n性别分布:\n{titanic['sex'].value_counts()}")

# 4. 相关性分析
numeric_cols = ['pclass', 'age', 'sibsp', 'parch', 'fare']
print(f"\n相关性矩阵:\n{titanic[numeric_cols].corr()}")

# 5. 特征工程建议
print("\n特征工程建议:")
print("- age 有 20% 缺失，建议用中位数或分组中位数填充")
print("- fare 分布右偏，建议做 log 变换")
print("- sibsp + parch 可以组合为 family_size")
print("- pclass 可以视为有序类别或做独热编码")
```

</details>

---

## 下一章预告

下一章我们会学习 **特征预处理**——包括缺失值处理、异常值检测、数据类型转换和特征编码。这些是特征工程中最基础也最重要的操作。
