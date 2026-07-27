---
title: "第6章：特征选择方法"
description: "从所有特征中筛选出最有用的特征"
---

# 第6章：特征选择方法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么需要特征选择？特征不是越多越好吗？
- 有哪些特征选择方法？它们有什么区别？
- 怎么判断一个特征是否有用？
- 特征选择和特征提取有什么区别？

这一章就是为了解答这些问题。特征选择是特征工程中 **做减法** 的部分——去掉无用特征，保留精华。

---

## 1 为什么需要特征选择？

### 痛点分析

特征太多会导致：

| 问题 | 说明 |
| --- | --- |
| 维度灾难 | 高维空间中数据稀疏，模型难以学习 |
| 过拟合 | 模型记住了噪声，泛化能力差 |
| 计算成本高 | 训练和预测都变慢 |
| 可解释性差 | 无法理解哪些特征真正重要 |

> **一句话总结**：特征选择是"少即是多"——用更少的特征获得更好的模型。

---

## 2 核心原理

### 特征选择方法分类

| 方法 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 过滤法 | 根据统计指标筛选 | 速度快，不依赖模型 | 忽略特征组合 |
| 包装法 | 用模型性能评估特征子集 | 考虑特征组合 | 计算成本高 |
| 嵌入法 | 模型训练过程中自动选择 | 平衡速度和效果 | 依赖特定模型 |

---

## 3 基础用法

### 过滤法（Filter Methods）

```python
import pandas as pd
import numpy as np
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X = pd.DataFrame(iris.data, columns=iris.feature_names)
y = iris.target

print("原始特征:", X.columns.tolist())

# 方法 1：方差选择法（适合回归）
from sklearn.feature_selection import VarianceThreshold

# 删除方差低于阈值的特征
selector = VarianceThreshold(threshold=0.5)
X_var = selector.fit_transform(X)
selected_features = X.columns[selector.get_support()]
print(f"\n方差选择法保留特征: {selected_features.tolist()}")

# 方法 2：相关系数法（适合分类）
selector_kbest = SelectKBest(score_func=f_classif, k=2)
X_kbest = selector_kbest.fit_transform(X, y)
selected_features = X.columns[selector_kbest.get_support()]
print(f"\nANOVA F-value 选择法保留特征: {selected_features.tolist()}")

# 方法 3：互信息法
selector_mi = SelectKBest(score_func=mutual_info_classif, k=2)
X_mi = selector_mi.fit_transform(X, y)
selected_features = X.columns[selector_mi.get_support()]
print(f"\n互信息选择法保留特征: {selected_features.tolist()}")
```

### 包装法（Wrapper Methods）

```python
from sklearn.feature_selection import RFE, RFECV
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold

# 方法 1：递归特征消除（RFE）
model = RandomForestClassifier(n_estimators=100, random_state=42)
rfe = RFE(estimator=model, n_features_to_select=2, step=1)
rfe.fit(X, y)
selected_features = X.columns[rfe.get_support()]
print(f"\nRFE 选择法保留特征: {selected_features.tolist()}")

# 方法 2：递归特征消除 + 交叉验证（RFECV）
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
rfecv = RFECV(estimator=model, step=1, cv=cv, scoring='accuracy')
rfecv.fit(X, y)
selected_features = X.columns[rfecv.get_support()]
print(f"\nRFECV 选择法保留特征: {selected_features.tolist()}")
print(f"RFECV 最优特征数: {rfecv.n_features_}")
```

### 嵌入法（Embedded Methods）

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import Lasso, LogisticRegression

# 方法 1：基于树模型的特征重要性
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)
importances = model.feature_importances_

# 可视化特征重要性
feature_importance_df = pd.DataFrame({
    'feature': X.columns,
    'importance': importances
}).sort_values('importance', ascending=False)
print("\n特征重要性:")
print(feature_importance_df)

# 选择重要性高于阈值的特征
threshold = 0.1
selected_features = feature_importance_df[
    feature_importance_df['importance'] > threshold
]['feature'].tolist()
print(f"\n重要性 > {threshold} 的特征: {selected_features}")

# 方法 2：L1 正则化（Lasso）
from sklearn.datasets import load_breast_cancer
data = load_breast_cancer()
X_cancer = pd.DataFrame(data.data, columns=data.feature_names)
y_cancer = data.target

lasso = LogisticRegression(penalty='l1', solver='liblinear', C=0.1, random_state=42)
lasso.fit(X_cancer, y_cancer)

# L1 正则化会产生稀疏权重，很多特征系数为 0
selected_features = X_cancer.columns[lasso.coef_[0] != 0]
print(f"\nL1 正则化选择的特征数: {len(selected_features)}")
```

---

## 4 进阶用法

### 特征选择 Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectFromModel
from sklearn.ensemble import RandomForestClassifier

# 创建特征选择 Pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('feature_selection', SelectFromModel(
        estimator=RandomForestClassifier(n_estimators=100, random_state=42),
        threshold='median'  # 选择重要性高于中位数的特征
    )),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# 训练和评估
from sklearn.model_selection import cross_val_score
scores = cross_val_score(pipeline, X, y, cv=5)
print(f"\nPipeline 交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

### 处理多重共线性

```python
# 计算相关性矩阵
corr_matrix = X.corr().abs()

# 找出高度相关的特征对
high_corr = []
for i in range(len(corr_matrix.columns)):
    for j in range(i):
        if corr_matrix.iloc[i, j] > 0.9:
            colname = corr_matrix.columns[i]
            high_corr.append(colname)

print(f"\n高度相关的特征: {high_corr}")

# 删除其中一个
X_reduced = X.drop(columns=high_corr)
print(f"降维后特征数: {X_reduced.shape[1]}")
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 过滤法 | 方差选择、相关系数、互信息 |
| 包装法 | RFE、RFECV |
| 嵌入法 | 树模型特征重要性、L1 正则化 |
| 多重共线性 | 删除高度相关的特征之一 |
| 特征选择 vs 特征提取 | 选择是筛选原有特征，提取是创造新特征 |

---

## 6 新手常见误区

### 误区 1："特征选择只需要做一次"

**错！** 特征选择应该在交叉验证的每个 fold 中独立进行，否则会数据泄漏。

正确做法：使用 Pipeline 或 RFECV 确保特征选择在交叉验证内部进行。

### 误区 2："所有方法选出的特征都一样"

不对。不同方法有不同的偏好。过滤法快但忽略特征组合，包装法准但慢，嵌入法平衡。

正确做法：尝试多种方法，综合比较。

### 误区 3："特征重要性高就一定有用"

不是的。特征重要性可能受到特征相关性、尺度等因素影响。而且有些特征单独看不重要，但组合起来很有用。

正确做法：结合业务理解和多种方法综合判断。

---

## 7 动手练习

### 练习 1：基础练习

使用 VarianceThreshold 和 SelectKBest 对鸢尾花数据集进行特征选择。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_selection import VarianceThreshold, SelectKBest, f_classif

# 方差选择
selector_var = VarianceThreshold(threshold=0.5)
X_var = selector_var.fit_transform(X)
print(f"方差选择保留特征: {X.columns[selector_var.get_support()].tolist()}")

# KBest 选择
selector_kbest = SelectKBest(score_func=f_classif, k=2)
X_kbest = selector_kbest.fit_transform(X, y)
print(f"KBest 保留特征: {X.columns[selector_kbest.get_support()].tolist()}")
```

</details>

### 练习 2：进阶练习

使用 RFECV 自动选择最优特征数，并可视化特征数与性能的关系。

<details>
<summary>点击查看答案</summary>

```python
import matplotlib.pyplot as plt

# RFECV
model = RandomForestClassifier(n_estimators=100, random_state=42)
rfecv = RFECV(estimator=model, step=1, cv=5, scoring='accuracy')
rfecv.fit(X, y)

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(range(1, len(rfecv.cv_results_['mean_test_score']) + 1),
         rfecv.cv_results_['mean_test_score'], marker='o')
plt.xlabel('特征数量')
plt.ylabel('交叉验证准确率')
plt.title('特征数 vs 模型性能')
plt.show()

print(f"最优特征数: {rfecv.n_features_}")
print(f"选择的特征: {X.columns[rfecv.get_support()].tolist()}")
```

</details>

### 练习 3（挑战）：综合练习

对乳腺癌数据集，比较过滤法、包装法、嵌入法的特征选择结果和模型性能。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import cross_val_score
from sklearn.feature_selection import SelectKBest, f_classif, RFE, SelectFromModel

# 加载数据
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target

# 过滤法
selector_filter = SelectKBest(score_func=f_classif, k=10)
X_filter = selector_filter.fit_transform(X, y)

# 包装法
model = RandomForestClassifier(n_estimators=100, random_state=42)
selector_wrapper = RFE(estimator=model, n_features_to_select=10)
X_wrapper = selector_wrapper.fit_transform(X, y)

# 嵌入法
selector_embed = SelectFromModel(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    threshold='median'
)
X_embed = selector_embed.fit_transform(X, y)

# 比较性能
for name, X_selected in [('过滤法', X_filter), ('包装法', X_wrapper), ('嵌入法', X_embed)]:
    scores = cross_val_score(RandomForestClassifier(random_state=42), X_selected, y, cv=5)
    print(f"{name}: 准确率 {scores.mean():.4f}, 特征数 {X_selected.shape[1]}")
```

</details>

---

## 下一章预告

下一章我们会学习 **特征提取技术**——通过 PCA、LDA 等方法将高维特征映射到低维空间，创造新的特征。
