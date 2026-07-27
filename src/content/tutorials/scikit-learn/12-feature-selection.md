---
title: "第12章：特征选择"
description: "过滤法、包装法、嵌入法、特征重要性分析"
---

# 第12章：特征选择

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么要做特征选择？特征不是越多越好吗？
- 过滤法、包装法、嵌入法有什么区别？
- 怎么评估特征的重要性？
- 特征选择和 PCA 降维有什么不同？

这一章会带你掌握特征选择的核心方法，学会挑选最有用的特征，让模型更快更准。

---

## 1 为什么需要特征选择？

### 痛点分析

特征太多会带来很多问题：

- **维度灾难**：特征越多，数据越稀疏，模型越难训练
- **过拟合风险**：无关特征会干扰模型学习
- **计算成本高**：特征多，训练时间长
- **可解释性差**：特征太多，难以理解模型决策

这就像**整理书桌**——东西太多反而找不到需要的，清理掉没用的，效率更高。

### 解决方案

特征选择就是**从所有特征中挑选最有用的**：

- **过滤法（Filter）**：根据统计指标筛选
- **包装法（Wrapper）**：用模型性能评估特征子集
- **嵌入法（Embedded）**：模型训练过程中自动选择

> **一句话总结**：特征选择让模型更简单、更快、更准。

---

## 2 过滤法（Filter Methods）

### 原理

过滤法**独立于模型**，根据特征的统计指标筛选：

- 方差选择法：去掉方差小的特征（变化小，信息少）
- 相关系数法：去掉与目标相关性低的特征
- 卡方检验：分类任务的特征选择
- 互信息：衡量特征与目标的依赖关系

### 代码示例

```python
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from sklearn.datasets import load_iris
import pandas as pd

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target
feature_names = iris.feature_names

# 1. 方差选择法
from sklearn.feature_selection import VarianceThreshold

# 去掉方差小于 0.5 的特征
selector = VarianceThreshold(threshold=0.5)
X_var = selector.fit_transform(X)

print(f"原始特征数: {X.shape[1]}")
print(f"方差选择后: {X_var.shape[1]}")
print(f"保留的特征: {[feature_names[i] for i in range(len(feature_names)) if selector.get_support()[i]]}")

# 2. 单变量特征选择（F 检验）
# 选择最好的 2 个特征
selector_f = SelectKBest(score_func=f_classif, k=2)
X_f = selector_f.fit_transform(X, y)

print(f"\nF 检验选择后: {X_f.shape[1]}")
print(f"F 统计量: {selector_f.scores_}")
print(f"p 值: {selector_f.pvalues_}")
print(f"保留的特征: {[feature_names[i] for i in range(len(feature_names)) if selector_f.get_support()[i]]}")

# 3. 互信息
mi_scores = mutual_info_classif(X, y, random_state=42)
print(f"\n互信息得分: {mi_scores}")

# 可视化
df_scores = pd.DataFrame({
    "特征": feature_names,
    "F 统计量": selector_f.scores_,
    "互信息": mi_scores
})
print("\n特征得分对比:")
print(df_scores)
```

---

## 3 包装法（Wrapper Methods）

### 原理

包装法**把特征选择看作搜索问题**：

- 递归特征消除（RFE）：反复训练模型，去掉最不重要的特征
- 前向选择：从空集开始，逐步添加最有用的特征
- 后向消除：从全集开始，逐步去掉最没用的特征

### 代码示例

```python
from sklearn.feature_selection import RFE, RFECV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
import matplotlib.pyplot as plt

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target
feature_names = data.feature_names

# 1. RFE（递归特征消除）
# 选择最重要的 10 个特征
model = RandomForestClassifier(n_estimators=100, random_state=42)
rfe = RFE(estimator=model, n_features_to_select=10, step=1)
rfe.fit(X, y)

print(f"原始特征数: {X.shape[1]}")
print(f"RFE 选择后: {rfe.n_features_}")
print(f"保留的特征:")
for i, (name, support) in enumerate(zip(feature_names, rfe.support_)):
    if support:
        print(f"  - {name}")

# 2. RFECV（带交叉验证的 RFE）
# 自动选择最佳特征数
rfecv = RFECV(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    step=1,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)
rfecv.fit(X, y)

print(f"\nRFECV 选择的最佳特征数: {rfecv.n_features_}")

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(range(1, len(rfecv.cv_results_["mean_test_score"]) + 1), 
         rfecv.cv_results_["mean_test_score"], "o-")
plt.xlabel("特征数量")
plt.ylabel("交叉验证准确率")
plt.title("RFECV：特征数量 vs 模型性能")
plt.grid(alpha=0.3)
plt.show()
```

---

## 4 嵌入法（Embedded Methods）

### 原理

嵌入法**在模型训练过程中自动选择特征**：

- L1 正则化（Lasso）：权重变为 0
- 树模型：基于特征重要性
- ElasticNet：结合 L1 和 L2

### 代码示例

```python
from sklearn.linear_model import LassoCV, LogisticRegressionCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectFromModel
from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target
feature_names = data.feature_names

# 1. L1 正则化（Lasso）
# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Lasso 回归（自动选择特征）
lasso = LassoCV(cv=5, random_state=42)
lasso.fit(X_scaled, y)

# 查看非零系数的特征
selected_lasso = [feature_names[i] for i in range(len(feature_names)) if lasso.coef_[i] != 0]
print(f"Lasso 选择的特征数: {len(selected_lasso)}")
print(f"保留的特征: {selected_lasso[:5]}...")

# 2. 基于树模型的特征选择
# 使用 SelectFromModel
selector = SelectFromModel(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    threshold="mean"  # 选择重要性高于平均值的特征
)
selector.fit(X, y)

selected_rf = [feature_names[i] for i in range(len(feature_names)) if selector.get_support()[i]]
print(f"\n随机森林选择的特征数: {len(selected_rf)}")
print(f"保留的特征: {selected_rf[:5]}...")

# 3. 特征重要性可视化
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

importances = model.feature_importances_
indices = importances.argsort()[::-1]

plt.figure(figsize=(10, 8))
plt.barh(range(10), importances[indices[:10]][::-1])
plt.yticks(range(10), [feature_names[i] for i in indices[:10]][::-1])
plt.xlabel("特征重要性")
plt.title("随机森林特征重要性（前 10）")
plt.tight_layout()
plt.show()
```

---

## 5 特征选择实战

### 完整流程

```python
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.datasets import load_breast_cancer

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 1. 不做特征选择
model1 = RandomForestClassifier(n_estimators=100, random_state=42)
model1.fit(X_train, y_train)
score1 = model1.score(X_test, y_test)

# 2. 过滤法特征选择
selector = SelectKBest(score_func=f_classif, k=10)
X_train_filtered = selector.fit_transform(X_train, y_train)
X_test_filtered = selector.transform(X_test)

model2 = RandomForestClassifier(n_estimators=100, random_state=42)
model2.fit(X_train_filtered, y_train)
score2 = model2.score(X_test, y_test)

# 3. Pipeline 方式（推荐）
pipeline = Pipeline([
    ("feature_selection", SelectKBest(score_func=f_classif, k=10)),
    ("classifier", RandomForestClassifier(n_estimators=100, random_state=42))
])

pipeline.fit(X_train, y_train)
score3 = pipeline.score(X_test, y_test)

# 对比
print(f"不做特征选择: {score1:.2%}")
print(f"过滤法特征选择: {score2:.2%}")
print(f"Pipeline 方式: {score3:.2%}")

# 交叉验证
cv_scores = cross_val_score(pipeline, data.data, data.target, cv=5)
print(f"\n交叉验证准确率: {cv_scores.mean():.2%} (+/- {cv_scores.std() * 2:.2%})")
```

---

## 6 特征选择 vs 降维

| 特性 | 特征选择 | 降维（PCA） |
| --- | --- | --- |
| 原理 | 选择原始特征 | 创建新特征 |
| 可解释性 | 高（保留原始特征） | 低（主成分是组合） |
| 适用场景 | 特征多、有冗余 | 特征相关性强 |
| 信息保留 | 可能丢失 | 保留方差 |
| 计算成本 | 中等 | 低 |

---

## 7 新手常见误区

### 误区 1："特征越多越好"

**错！** 无关特征会干扰模型，导致过拟合和性能下降。

### 误区 2："特征选择只在训练集上做"

**错！** 应该用 Pipeline 确保训练集和测试集的处理一致，避免数据泄露。

### 误区 3："过滤法一定比包装法差"

不是的。过滤法快但可能忽略特征组合，包装法慢但更准确。根据数据量选择。

### 误区 4："特征重要性高就一定有用"

不是的。特征重要性可能受特征尺度、相关性影响，需要结合业务理解。

### 误区 5："特征选择后不需要调参"

**错！** 特征选择和模型调参应该一起进行，用交叉验证评估整体效果。

---

## 8 动手练习

### 练习 1：基础练习

用 `SelectKBest` 和 F 检验从鸢尾花数据集中选择最好的 2 个特征。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.feature_selection import SelectKBest, f_classif

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target

# 选择最好的 2 个特征
selector = SelectKBest(score_func=f_classif, k=2)
X_selected = selector.fit_transform(X, y)

print(f"原始特征数: {X.shape[1]}")
print(f"选择后特征数: {X_selected.shape[1]}")
print(f"F 统计量: {selector.scores_}")
print(f"p 值: {selector.pvalues_}")
print(f"保留的特征: {[iris.feature_names[i] for i in range(4) if selector.get_support()[i]]}")
```

</details>

### 练习 2：进阶练习

用 RFECV 自动选择乳腺癌数据集的最佳特征数量，并可视化结果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.feature_selection import RFECV
from sklearn.ensemble import RandomForestClassifier
import matplotlib.pyplot as plt

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target

# RFECV
rfecv = RFECV(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    step=1,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)
rfecv.fit(X, y)

print(f"最佳特征数: {rfecv.n_features_}")

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(range(1, len(rfecv.cv_results_["mean_test_score"]) + 1), 
         rfecv.cv_results_["mean_test_score"], "o-")
plt.xlabel("特征数量")
plt.ylabel("交叉验证准确率")
plt.title("RFECV：特征数量 vs 模型性能")
plt.grid(alpha=0.3)
plt.show()
```

</details>

### 练习 3（挑战）：综合练习

对比过滤法、包装法、嵌入法在乳腺癌数据集上的效果，并分析哪种方法最好。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_selection import SelectKBest, f_classif, RFE, SelectFromModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target

# 1. 过滤法
pipeline_filter = Pipeline([
    ("scaler", StandardScaler()),
    ("feature_selection", SelectKBest(score_func=f_classif, k=10)),
    ("classifier", LogisticRegression(max_iter=1000))
])

# 2. 包装法（RFE）
pipeline_wrapper = Pipeline([
    ("scaler", StandardScaler()),
    ("feature_selection", RFE(estimator=LogisticRegression(max_iter=1000), n_features_to_select=10)),
    ("classifier", LogisticRegression(max_iter=1000))
])

# 3. 嵌入法（基于树模型）
pipeline_embedded = Pipeline([
    ("feature_selection", SelectFromModel(
        estimator=RandomForestClassifier(n_estimators=100, random_state=42),
        threshold="median"
    )),
    ("classifier", LogisticRegression(max_iter=1000))
])

# 对比
pipelines = {
    "过滤法": pipeline_filter,
    "包装法": pipeline_wrapper,
    "嵌入法": pipeline_embedded
}

print("特征选择方法对比（5 折交叉验证）:")
print("-" * 60)
for name, pipeline in pipelines.items():
    scores = cross_val_score(pipeline, X, y, cv=5, scoring="accuracy")
    print(f"{name:10s}: {scores.mean():.2%} (+/- {scores.std() * 2:.2%})")
```

</details>

---

## 9 下一章预告

下一章我们会学习 **文本数据处理**——CountVectorizer、TF-IDF、文本分类、情感分析实战。你会学到如何处理文本数据，让模型能够理解和分析文字内容。
