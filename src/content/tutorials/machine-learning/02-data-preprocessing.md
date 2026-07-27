---
title: "第2章：数据预处理与特征工程"
description: "数据清洗、缺失值处理、特征编码、标准化与归一化"
---

# 第2章：数据预处理与特征工程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么数据预处理这么重要？
- 如何处理缺失值和异常值？
- 什么是特征编码？为什么要做特征编码？
- 标准化和归一化有什么区别？

这一章就是为了解答这些问题。我们会学习数据清洗、特征工程的核心技术，这些是机器学习项目中最重要的步骤。

---

## 1 为什么需要数据预处理？

### 痛点分析

现实世界的数据往往是"脏"的：

```python
# 真实数据示例：充满问题
data = {
    'age': [25, 30, None, 35, 28],      # 缺失值
    'income': [50000, 60000, 55000, -1, 70000],  # 异常值（-1）
    'city': ['北京', '上海', '广州', '深圳', '杭州'],  # 类别数据
    'score': [85, 92, 78, 95, 88],      # 数值范围大
}
```

问题：
- 机器学习模型无法处理缺失值
- 异常值会严重影响模型训练
- 类别数据需要转换为数值
- 特征尺度不同会导致模型偏向大数值特征

### 解决方案

数据预处理流程：

```
原始数据 → 数据清洗 → 特征工程 → 特征缩放 → 可用数据
```

打个比方：

> 数据预处理像"做菜前的准备工作"：
> - 数据清洗 = 洗菜、去烂叶
> - 特征工程 = 切菜、配料
> - 特征缩放 = 统一火候
> 准备工作做不好，菜肯定不好吃。

> **一句话总结**：数据和特征决定了机器学习的上限，模型只是逼近这个上限。

---

## 2 核心原理

### 数据预处理流程

| 步骤 | 说明 | 常用方法 |
| --- | --- | --- |
| 数据清洗 | 处理缺失值、异常值、重复值 | 填充、删除、插值 |
| 特征编码 | 将类别数据转换为数值 | 标签编码、独热编码 |
| 特征缩放 | 统一特征尺度 | 标准化、归一化 |
| 特征选择 | 选择重要特征 | 过滤法、包装法、嵌入法 |
| 特征构造 | 从现有特征构造新特征 | 多项式特征、交叉特征 |

---

## 3 基础用法

### 处理缺失值

```python
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer

# 创建包含缺失值的数据
data = {
    'age': [25, 30, np.nan, 35, 28, np.nan, 40],
    'salary': [50000, 60000, 55000, np.nan, 70000, 65000, 80000],
    'city': ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉']
}
df = pd.DataFrame(data)

print("原始数据：")
print(df)
print("\n缺失值统计：")
print(df.isnull().sum())

# 方法1：删除含有缺失值的行
# 适用于缺失值很少的情况
df_dropped = df.dropna()
print("\n删除缺失值后：")
print(df_dropped)

# 方法2：使用均值填充
# 适用于数值型特征
imputer_mean = SimpleImputer(strategy='mean')  # 创建均值填充器
df['age_mean'] = imputer_mean.fit_transform(df[['age']])  # 用均值填充age列
print("\n均值填充age后：")
print(df[['age', 'age_mean']])

# 方法3：使用中位数填充
# 适用于有异常值的情况
imputer_median = SimpleImputer(strategy='median')
df['salary_median'] = imputer_median.fit_transform(df[['salary']])
print("\n中位数填充salary后：")
print(df[['salary', 'salary_median']])

# 方法4：使用众数填充
# 适用于类别特征
imputer_mode = SimpleImputer(strategy='most_frequent')
df['city_mode'] = imputer_mode.fit_transform(df[['city']])

# 方法5：使用特定值填充
# 适用于有业务含义的情况
imputer_constant = SimpleImputer(strategy='constant', fill_value=-1)
df['age_constant'] = imputer_constant.fit_transform(df[['age']])
print("\n特定值填充age后（-1表示缺失）：")
print(df[['age', 'age_constant']])
```

### 处理异常值

```python
import numpy as np
import pandas as pd

# 创建包含异常值的数据
data = {
    'income': [50000, 55000, 60000, 52000, 58000, 1000000, 48000, 53000]
}
df = pd.DataFrame(data)

print("原始数据：")
print(df['income'].values)

# 方法1：Z-score 方法（3σ原则）
# 假设数据服从正态分布，超过3倍标准差的视为异常值
mean = df['income'].mean()  # 计算均值
std = df['income'].std()    # 计算标准差
z_scores = np.abs((df['income'] - mean) / std)  # 计算Z-score
df['is_outlier_z'] = z_scores > 3  # 标记异常值
print("\nZ-score方法检测异常值：")
print(df[df['is_outlier_z']])

# 方法2：IQR 方法（四分位距）
# 不受极端值影响，更稳健
Q1 = df['income'].quantile(0.25)  # 第一四分位数
Q3 = df['income'].quantile(0.75)  # 第三四分位数
IQR = Q3 - Q1  # 四分位距
lower_bound = Q1 - 1.5 * IQR  # 下界
upper_bound = Q3 + 1.5 * IQR  # 上界
df['is_outlier_iqr'] = (df['income'] < lower_bound) | (df['income'] > upper_bound)
print("\nIQR方法检测异常值：")
print(f"下界：{lower_bound}, 上界：{upper_bound}")
print(df[df['is_outlier_iqr']])

# 方法3：删除异常值
df_clean = df[~df['is_outlier_iqr']]
print("\n删除异常值后：")
print(df_clean['income'].values)

# 方法4：截断异常值（Winsorization）
# 将异常值替换为边界值，而不是删除
df['income_clipped'] = df['income'].clip(lower_bound, upper_bound)
print("\n截断异常值后：")
print(df['income_clipped'].values)
```

### 特征编码

```python
import pandas as pd
from sklearn.preprocessing import LabelEncoder, OneHotEncoder

# 创建包含类别特征的数据
data = {
    'city': ['北京', '上海', '广州', '深圳', '北京', '上海'],
    'size': ['小', '中', '大', '中', '小', '大'],
    'price': [500, 800, 600, 700, 550, 900]
}
df = pd.DataFrame(data)

print("原始数据：")
print(df)

# 方法1：标签编码（Label Encoding）
# 将类别转换为整数（0, 1, 2, ...）
# 适用于有序类别（如：小 < 中 < 大）
le = LabelEncoder()
df['city_encoded'] = le.fit_transform(df['city'])
print("\n标签编码后：")
print(df[['city', 'city_encoded']])
# 注意：这种方法会引入大小关系，北京=0 < 上海=1，但实际没有这种关系

# 方法2：独热编码（One-Hot Encoding）
# 将每个类别转换为一个二进制列
# 适用于无序类别（如：城市之间没有大小关系）
df_encoded = pd.get_dummies(df, columns=['city'], prefix='city')
print("\n独热编码后：")
print(df_encoded)
# 每个城市变成一个独立的列，取值为0或1

# 方法3：自定义映射
# 适用于有序类别
size_mapping = {'小': 1, '中': 2, '大': 3}  # 定义大小关系
df['size_encoded'] = df['size'].map(size_mapping)
print("\n自定义映射编码后：")
print(df[['size', 'size_encoded']])

# 方法4：使用 sklearn 的 OneHotEncoder
from sklearn.preprocessing import OneHotEncoder
ohe = OneHotEncoder(sparse=False)  # sparse=False返回数组而不是稀疏矩阵
city_encoded = ohe.fit_transform(df[['city']])
print("\nsklearn OneHotEncoder：")
print(city_encoded)
print(f"类别名称：{ohe.categories_}")
```

### 特征缩放

```python
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler

# 创建数据
data = {
    'age': [25, 30, 35, 40, 45],           # 范围：25-45
    'salary': [50000, 60000, 70000, 80000, 90000],  # 范围：50000-90000
    'score': [85, 92, 78, 95, 88]          # 范围：78-95
}

print("原始数据：")
for key, values in data.items():
    print(f"{key}: {values}")

# 方法1：标准化（Standardization / Z-score）
# 公式：(x - mean) / std
# 将数据转换为均值为0，标准差为1的分布
scaler_std = StandardScaler()
data_standardized = scaler_std.fit_transform(list(data.values()))
print("\n标准化后：")
print(f"age: {data_standardized[0].round(2)}")
print(f"salary: {data_standardized[1].round(2)}")
print(f"score: {data_standardized[2].round(2)}")
# 所有特征都在同一尺度上，均值为0，标准差为1

# 方法2：归一化（Min-Max Scaling）
# 公式：(x - min) / (max - min)
# 将数据缩放到[0, 1]区间
scaler_minmax = MinMaxScaler()
data_normalized = scaler_minmax.fit_transform(list(data.values()))
print("\n归一化后：")
print(f"age: {data_normalized[0].round(2)}")
print(f"salary: {data_normalized[1].round(2)}")
print(f"score: {data_normalized[2].round(2)}")
# 所有特征都在[0, 1]区间内

# 对比两种方法
print("\n标准化 vs 归一化：")
print("标准化：均值为0，标准差为1，适合大多数算法")
print("归一化：范围[0,1]，适合神经网络、图像处理")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 使用场景 |
| --- | --- | --- |
| 缺失值处理 | 填充或删除缺失数据 | 所有数据集 |
| 异常值处理 | 检测和处理极端值 | 数据清洗阶段 |
| 标签编码 | 类别转整数 | 有序类别特征 |
| 独热编码 | 类别转二进制向量 | 无序类别特征 |
| 标准化 | 均值0，标准差1 | 大多数算法 |
| 归一化 | 缩放到[0,1] | 神经网络、图像处理 |
| 特征选择 | 选择重要特征 | 降维、提高性能 |
| 特征构造 | 创建新特征 | 提升模型性能 |

---

## 5 新手常见误区

### 误区 1："缺失值直接删除就行"

**错！** 删除缺失值会丢失大量信息，特别是当缺失比例较大时。应该根据缺失比例和数据量选择合适的填充策略。

### 误区 2："所有类别特征都用标签编码"

**错！** 标签编码会引入大小关系。对于无序类别（如城市），应该使用独热编码。只有有序类别（如学历：高中 < 本科 < 硕士）才用标签编码。

### 误区 3："特征缩放不重要"

**错！** 很多算法（如KNN、SVM、神经网络）对特征尺度敏感。如果不做特征缩放，数值大的特征会主导距离计算，导致模型性能下降。

### 误区 4："特征越多越好"

**错！** 无关特征会增加噪声，导致过拟合。应该通过特征选择去除冗余特征，保留重要特征。

### 误区 5："数据预处理只做一次"

**错！** 数据预处理是一个迭代过程。需要根据模型反馈不断调整预处理策略，尝试不同的方法，找到最优方案。

---

## 6 动手练习

### 练习 1：基础练习 - 处理缺失值

创建一个包含缺失值的数据集，使用不同方法填充缺失值。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer

# 创建数据
data = {
    'age': [25, 30, np.nan, 35, np.nan, 40],
    'salary': [50000, np.nan, 55000, 60000, 65000, np.nan],
    'department': ['技术', '市场', '技术', np.nan, '销售', '市场']
}
df = pd.DataFrame(data)

print("原始数据：")
print(df)
print("\n缺失值统计：")
print(df.isnull().sum())

# 填充数值型特征
imputer_mean = SimpleImputer(strategy='mean')
df['age_filled'] = imputer_mean.fit_transform(df[['age']])

imputer_median = SimpleImputer(strategy='median')
df['salary_filled'] = imputer_median.fit_transform(df[['salary']])

# 填充类别特征
imputer_mode = SimpleImputer(strategy='most_frequent')
df['department_filled'] = imputer_mode.fit_transform(df[['department']])

print("\n填充后：")
print(df[['age', 'age_filled', 'salary', 'salary_filled', 'department', 'department_filled']])
```

</details>

### 练习 2：进阶练习 - 特征编码

对鸢尾花数据集的类别标签进行编码，并比较不同编码方法。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
from sklearn.datasets import load_iris
from sklearn.preprocessing import LabelEncoder, OneHotEncoder

# 加载数据
iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df['species'] = iris.target

print("原始数据：")
print(df.head())

# 方法1：标签编码
le = LabelEncoder()
df['species_label'] = le.fit_transform(df['species'])
print("\n标签编码后：")
print(df[['species', 'species_label']].head(10))

# 方法2：独热编码
df_encoded = pd.get_dummies(df, columns=['species'], prefix='species')
print("\n独热编码后：")
print(df_encoded.head(10))

# 验证编码结果
print("\n标签编码类别：", le.classes_)
print("独热编码列名：", [col for col in df_encoded.columns if 'species' in col])
```

</details>

### 练习 3（挑战）：综合练习 - 完整预处理流程

对波士顿房价数据集进行完整的预处理流程。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import numpy as np
from sklearn.datasets import load_boston
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

# 加载数据
boston = load_boston()
X = pd.DataFrame(boston.data, columns=boston.feature_names)
y = boston.target

print("原始数据形状：", X.shape)
print("\n缺失值统计：")
print(X.isnull().sum())

# 1. 划分数据集（先划分再做预处理，避免数据泄露）
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 2. 处理缺失值（如果有的话）
imputer = SimpleImputer(strategy='median')
X_train_imputed = imputer.fit_transform(X_train)
X_test_imputed = imputer.transform(X_test)

# 3. 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_imputed)
X_test_scaled = scaler.transform(X_test_imputed)

print("\n预处理后：")
print(f"训练集形状：{X_train_scaled.shape}")
print(f"测试集形状：{X_test_scaled.shape}")
print(f"训练集均值：{X_train_scaled.mean(axis=0).round(2)}")
print(f"训练集标准差：{X_train_scaled.std(axis=0).round(2)}")
```

</details>

---

## 下一章预告

下一章我们会学习 **线性回归** —— 机器学习中最基础、最重要的算法之一。你会学到如何用一条直线拟合数据，如何评估模型性能，以及梯度下降的工作原理。
