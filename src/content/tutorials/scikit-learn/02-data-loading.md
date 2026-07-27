---
title: "第2章：数据加载与探索"
description: "内置数据集、数据加载方式、数据探索与可视化分析"
---

# 第2章：数据加载与探索

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Scikit-learn 有哪些内置数据集？
- 如何加载自己的数据（CSV、Excel）？
- 怎么快速了解数据的分布和特征？
- 可视化对数据分析有什么帮助？

这一章会带你掌握数据加载的多种方式，并学会用可视化手段探索数据规律。

---

## 1 为什么需要数据探索？

### 痛点分析

很多新手拿到数据就直接训练模型，结果：

- 模型效果差，不知道为什么
- 数据有问题（缺失值、异常值）没发现
- 特征选择不当，浪费计算资源

这就像**不看菜谱直接炒菜**——容易翻车！

### 解决方案

数据探索就像**做菜前的准备工作**：

- 看看食材新不新鲜（数据质量）
- 了解食材特性（数据分布）
- 决定怎么搭配（特征工程）

> **一句话总结**：数据探索是机器学习的第一步，决定了模型的上限。

---

## 2 Scikit-learn 内置数据集

### 常用数据集

Scikit-learn 提供了多个经典数据集，方便学习和测试：

| 数据集 | 用途 | 样本数 | 特征数 |
| --- | --- | --- | --- |
| `load_iris` | 分类（鸢尾花） | 150 | 4 |
| `load_breast_cancer` | 分类（乳腺癌） | 569 | 30 |
| `load_diabetes` | 回归（糖尿病） | 442 | 10 |
| `load_boston` | 回归（房价） | 506 | 13 |
| `load_digits` | 分类（手写数字） | 1797 | 64 |
| `load_wine` | 分类（葡萄酒） | 178 | 13 |

### 加载示例

```python
from sklearn.datasets import load_iris

# 加载鸢尾花数据集
iris = load_iris()

# 查看数据结构
print(f"数据类型: {type(iris)}")  # Bunch 对象，类似字典
print(f"特征矩阵形状: {iris.data.shape}")  # (150, 4)
print(f"标签向量形状: {iris.target.shape}")  # (150,)

# 查看特征名称
print(f"特征名称: {iris.feature_names}")
# ['sepal length (cm)', 'sepal width (cm)', 'petal length (cm)', 'petal width (cm)']

# 查看目标类别
print(f"目标类别: {iris.target_names}")
# ['setosa' 'versicolor' 'virginica']

# 查看前 5 个样本
print(f"前 5 个样本:\n{iris.data[:5]}")
print(f"前 5 个标签: {iris.target[:5]}")
```

### 数据集描述

```python
# 查看数据集的详细描述
print(iris.DESCR)
```

---

## 3 加载自己的数据

### 从 CSV 加载

```python
import pandas as pd

# 方法 1：用 Pandas 加载
df = pd.read_csv("data.csv")

# 分离特征和标签
X = df.drop("target", axis=1)  # 特征矩阵
y = df["target"]  # 标签向量

# 方法 2：用 Scikit-learn 加载
from sklearn.datasets import load_files

# 适用于文本分类任务
data = load_files("text_data/")
```

### 从 Excel 加载

```python
# 加载 Excel 文件
df = pd.read_excel("data.xlsx", sheet_name="Sheet1")

# 查看前几行
print(df.head())
```

### 从 NumPy 数组加载

```python
import numpy as np

# 假设你已经有 NumPy 数组
X = np.array([[1, 2], [3, 4], [5, 6]])
y = np.array([0, 1, 0])

# 直接用于训练
from sklearn.linear_model import LinearRegression
model = LinearRegression()
model.fit(X, y)
```

---

## 4 数据探索与可视化

### 基础统计

```python
import pandas as pd

# 加载数据
df = pd.read_csv("data.csv")

# 查看数据基本信息
print(df.info())  # 数据类型、缺失值
print(df.describe())  # 统计描述（均值、标准差、最值等）

# 查看缺失值
print(df.isnull().sum())
```

### 可视化分析

```python
import matplotlib.pyplot as plt
import seaborn as sns

# 设置中文显示
plt.rcParams["font.sans-serif"] = ["SimHei"]
plt.rcParams["axes.unicode_minus"] = False

# 1. 直方图：查看数值分布
plt.figure(figsize=(12, 4))
for i, feature in enumerate(iris.feature_names):
    plt.subplot(1, 4, i + 1)
    plt.hist(iris.data[:, i], bins=20, edgecolor="black")
    plt.title(feature)
plt.tight_layout()
plt.show()

# 2. 散点图：查看特征关系
plt.figure(figsize=(8, 6))
scatter = plt.scatter(
    iris.data[:, 2],  # 花瓣长度
    iris.data[:, 3],  # 花瓣宽度
    c=iris.target,  # 颜色按类别区分
    cmap="viridis"
)
plt.xlabel("Petal Length (cm)")
plt.ylabel("Petal Width (cm)")
plt.title("鸢尾花花瓣长度 vs 宽度")
plt.colorbar(scatter, label="类别")
plt.show()

# 3. 箱线图：查看异常值
plt.figure(figsize=(10, 6))
sns.boxplot(data=pd.DataFrame(iris.data, columns=iris.feature_names))
plt.title("各特征箱线图")
plt.xticks(rotation=45)
plt.show()

# 4. 相关性热力图
plt.figure(figsize=(8, 6))
correlation = pd.DataFrame(iris.data, columns=iris.feature_names).corr()
sns.heatmap(correlation, annot=True, cmap="coolwarm", fmt=".2f")
plt.title("特征相关性矩阵")
plt.show()
```

---

## 5 核心知识点总结

| 操作 | 代码 | 作用 |
| --- | --- | --- |
| 加载内置数据集 | `load_iris()` | 获取经典数据集 |
| 加载 CSV | `pd.read_csv()` | 读取自己的数据 |
| 查看数据信息 | `df.info()` | 数据类型、缺失值 |
| 统计描述 | `df.describe()` | 均值、标准差等 |
| 直方图 | `plt.hist()` | 查看数值分布 |
| 散点图 | `plt.scatter()` | 查看特征关系 |
| 箱线图 | `sns.boxplot()` | 发现异常值 |
| 热力图 | `sns.heatmap()` | 查看特征相关性 |

---

## 6 新手常见误区

### 误区 1："不需要数据探索，直接训练"

**错！** 数据探索能帮你发现问题：

- 缺失值需要处理
- 异常值需要清理
- 特征可能需要标准化
- 类别不平衡需要调整

### 误区 2："只看平均值就够了"

不是的。平均值会掩盖数据分布信息。比如：

- 两组数据平均值相同，但分布可能完全不同
- 标准差、中位数、分位数也很重要

### 误区 3："可视化只是画图，不重要"

**错！** 可视化能帮你：

- 发现数据规律
- 识别异常值
- 理解特征关系
- 选择合适模型

### 误区 4："特征之间都是独立的"

不是的。特征之间可能有相关性：

- 高相关特征可能导致多重共线性
- 可以用热力图检查相关性
- 必要时做降维或特征选择

---

## 7 动手练习

### 练习 1：基础练习

加载乳腺癌数据集（`load_breast_cancer`），查看数据集的形状、特征名称、目标类别。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer

# 加载数据集
data = load_breast_cancer()

# 查看形状
print(f"特征矩阵形状: {data.data.shape}")
print(f"标签向量形状: {data.target.shape}")

# 查看特征名称（前 5 个）
print(f"特征名称: {data.feature_names[:5]}")

# 查看目标类别
print(f"目标类别: {data.target_names}")

# 查看前 5 个样本
print(f"前 5 个样本:\n{data.data[:5]}")
print(f"前 5 个标签: {data.target[:5]}")
```

</details>

### 练习 2：进阶练习

用 Pandas 加载一个 CSV 文件（可以自己创建或网上下载），查看数据基本信息、缺失值、统计描述。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd

# 假设你有一个 data.csv 文件
# 如果没有，可以先创建一个示例
df = pd.DataFrame({
    "age": [25, 30, 35, 40, None],
    "salary": [50000, 60000, 70000, 80000, 90000],
    "department": ["IT", "HR", "IT", "HR", "IT"]
})

# 保存为 CSV
df.to_csv("sample_data.csv", index=False)

# 重新加载
df = pd.read_csv("sample_data.csv")

# 查看基本信息
print("数据基本信息:")
print(df.info())

# 查看统计描述
print("\n统计描述:")
print(df.describe())

# 查看缺失值
print("\n缺失值统计:")
print(df.isnull().sum())
```

</details>

### 练习 3（挑战）：综合练习

用鸢尾花数据集，绘制 4 个特征的直方图和相关性热力图，分析哪些特征对分类最有帮助。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

# 加载数据
iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)

# 1. 绘制 4 个特征的直方图
fig, axes = plt.subplots(2, 2, figsize=(12, 8))
axes = axes.flatten()

for i, feature in enumerate(iris.feature_names):
    axes[i].hist(df[feature], bins=20, edgecolor="black", alpha=0.7)
    axes[i].set_title(feature)
    axes[i].set_xlabel("Value (cm)")
    axes[i].set_ylabel("Frequency")

plt.tight_layout()
plt.suptitle("鸢尾花特征分布", fontsize=16)
plt.show()

# 2. 绘制相关性热力图
plt.figure(figsize=(8, 6))
correlation = df.corr()
sns.heatmap(correlation, annot=True, cmap="coolwarm", fmt=".2f", center=0)
plt.title("特征相关性矩阵")
plt.tight_layout()
plt.show()

# 3. 分析结论
print("相关性分析:")
print(correlation)
print("\n结论:")
print("- 花瓣长度和花瓣宽度高度相关 (0.96)")
print("- 花瓣特征比花萼特征更具区分度")
print("- 可以考虑用花瓣特征进行分类")
```

</details>

---

## 8 下一章预告

下一章我们会学习 **数据预处理**——如何处理缺失值、编码分类特征、标准化数值特征。这些步骤对模型性能至关重要，你会学到为什么需要预处理、什么时候用、怎么用。
