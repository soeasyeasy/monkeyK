---
title: "第7章：特征提取技术"
description: "通过降维技术将高维特征映射到低维空间"
---

# 第7章：特征提取技术

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是特征提取？和特征选择有什么区别？
- PCA 是怎么工作的？为什么要做降维？
- LDA 和 PCA 有什么区别？
- t-SNE 适合什么场景？

这一章就是为了解答这些问题。特征提取是特征工程中 **创造新特征** 的部分——通过数学变换将高维数据映射到低维空间。

---

## 1 为什么需要特征提取？

### 痛点分析

高维数据面临的问题：

| 问题 | 说明 |
| --- | --- |
| 维度灾难 | 高维空间中数据稀疏，距离计算失效 |
| 计算成本高 | 训练和预测都变慢 |
| 多重共线性 | 特征之间高度相关，信息冗余 |
| 可视化困难 | 无法直观展示高维数据 |

> **一句话总结**：特征提取通过降维，保留重要信息，去除冗余。

---

## 2 核心原理

### 特征提取方法对比

| 方法 | 类型 | 原理 | 适用场景 |
| --- | --- | --- | --- |
| PCA | 无监督 | 最大化方差 | 数据压缩、去相关 |
| LDA | 有监督 | 最大化类间距离 | 分类任务降维 |
| t-SNE | 无监督 | 保持局部结构 | 高维数据可视化 |
| UMAP | 无监督 | 保持全局和局部结构 | 可视化、降维 |

---

## 3 基础用法

### PCA（主成分分析）

```python
from sklearn.decomposition import PCA
from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np

# 加载数据
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target

print(f"原始数据形状: {X.shape}")

# PCA 前需要标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 方法 1：指定降维后的维度
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)
print(f"\nPCA 降维后形状: {X_pca.shape}")
print(f"解释方差比: {pca.explained_variance_ratio_}")
print(f"累计解释方差: {sum(pca.explained_variance_ratio_):.4f}")

# 方法 2：指定保留的方差比例
pca_var = PCA(n_components=0.95)  # 保留 95% 的方差
X_pca_var = pca_var.fit_transform(X_scaled)
print(f"\n保留 95% 方差需要的特征数: {pca_var.n_components_}")

# 可视化：前两个主成分
import matplotlib.pyplot as plt
plt.figure(figsize=(10, 6))
scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='viridis', alpha=0.7)
plt.xlabel('第一主成分')
plt.ylabel('第二主成分')
plt.title('PCA 降维可视化')
plt.colorbar(scatter, label='类别')
plt.show()
```

> **原理**：PCA 找到数据方差最大的方向（主成分），将数据投影到这些方向上。第一主成分方差最大，第二主成分与第一正交且方差次大，以此类推。

### 查看主成分的含义

```python
# 查看每个主成分的载荷（loadings）
loadings = pca.components_
loading_df = pd.DataFrame(
    loadings,
    columns=X.columns,
    index=[f'PC{i+1}' for i in range(len(loadings))]
)
print("主成分载荷矩阵:")
print(loading_df)

# 可视化载荷
plt.figure(figsize=(12, 6))
plt.bar(range(len(loading_df.columns)), loading_df.loc['PC1'], alpha=0.7, label='PC1')
plt.xticks(range(len(loading_df.columns)), loading_df.columns, rotation=90)
plt.xlabel('原始特征')
plt.ylabel('载荷值')
plt.title('第一主成分的载荷')
plt.legend()
plt.tight_layout()
plt.show()
```

### LDA（线性判别分析）

```python
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis

# LDA 是有监督的，需要标签
lda = LinearDiscriminantAnalysis(n_components=1)  # 二分类最多 1 个成分
X_lda = lda.fit_transform(X_scaled, y)

print(f"\nLDA 降维后形状: {X_lda.shape}")
print(f"解释方差比: {lda.explained_variance_ratio_}")

# 可视化
plt.figure(figsize=(10, 6))
plt.scatter(X_lda[y == 0, 0], X_lda[y == 0, 0], label='良性', alpha=0.7)
plt.scatter(X_lda[y == 1, 0], X_lda[y == 1, 0], label='恶性', alpha=0.7)
plt.xlabel('LDA 成分')
plt.ylabel('密度')
plt.title('LDA 降维可视化')
plt.legend()
plt.show()
```

> **原理**：LDA 寻找最大化类间距离、最小化类内距离的方向。与 PCA 不同，LDA 利用标签信息。

---

## 4 进阶用法

### t-SNE（t-分布随机邻域嵌入）

```python
from sklearn.manifold import TSNE

# t-SNE 适合可视化，计算成本高
tsne = TSNE(n_components=2, random_state=42, perplexity=30)
X_tsne = tsne.fit_transform(X_scaled)

print(f"\nt-SNE 降维后形状: {X_tsne.shape}")

# 可视化
plt.figure(figsize=(10, 6))
scatter = plt.scatter(X_tsne[:, 0], X_tsne[:, 1], c=y, cmap='viridis', alpha=0.7)
plt.xlabel('t-SNE 维度 1')
plt.ylabel('t-SNE 维度 2')
plt.title('t-SNE 降维可视化')
plt.colorbar(scatter, label='类别')
plt.show()
```

> **原理**：t-SNE 将高维空间中的点对转换为低维空间中的概率分布，保持局部结构。适合可视化，但不适合用于模型训练（因为结果不稳定）。

### PCA 用于模型训练

```python
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

# 创建 Pipeline：标准化 -> PCA -> 分类
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('pca', PCA(n_components=10)),
    ('classifier', LogisticRegression(max_iter=10000, random_state=42))
])

# 交叉验证
scores = cross_val_score(pipeline, X, y, cv=5)
print(f"\nPCA + 逻辑回归 交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")

# 对比不使用 PCA
pipeline_no_pca = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(max_iter=10000, random_state=42))
])
scores_no_pca = cross_val_score(pipeline_no_pca, X, y, cv=5)
print(f"不使用 PCA 交叉验证准确率: {scores_no_pca.mean():.4f} (+/- {scores_no_pca.std() * 2:.4f})")
```

### 选择最优主成分数

```python
# 绘制累计解释方差曲线
pca_full = PCA().fit(X_scaled)
cumulative_variance = np.cumsum(pca_full.explained_variance_ratio_)

plt.figure(figsize=(10, 6))
plt.plot(range(1, len(cumulative_variance) + 1), cumulative_variance, marker='o')
plt.axhline(y=0.95, color='r', linestyle='--', label='95% 方差')
plt.xlabel('主成分数量')
plt.ylabel('累计解释方差')
plt.title('主成分数量 vs 累计解释方差')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

# 找到达到 95% 方差需要的主成分数
n_components = np.argmax(cumulative_variance >= 0.95) + 1
print(f"\n达到 95% 方差需要的主成分数: {n_components}")
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| PCA | 无监督降维，最大化方差，适合数据压缩 |
| LDA | 有监督降维，最大化类间距离，适合分类 |
| t-SNE | 保持局部结构，适合可视化 |
| PCA 前必须标准化 | 否则量纲大的特征会主导主成分 |
| 主成分数选择 | 通过累计解释方差曲线确定 |

---

## 6 新手常见误区

### 误区 1："PCA 前不需要标准化"

**错！** PCA 对方差敏感，如果特征量纲不同，方差大的特征会主导主成分。

正确做法：PCA 前一定要做标准化。

### 误区 2："t-SNE 适合用于模型训练"

不对。t-SNE 的结果不稳定，每次运行结果不同，而且计算成本高。它只适合可视化。

正确做法：用 PCA 或 LDA 做降维用于模型训练，用 t-SNE 做可视化。

### 误区 3："降维后模型一定更好"

不是的。降维会丢失信息，如果丢失的是重要信息，模型性能会下降。

正确做法：通过交叉验证比较降维前后的模型性能。

---

## 7 动手练习

### 练习 1：基础练习

对鸢尾花数据集进行 PCA 降维，可视化前两个主成分。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 标准化 + PCA
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

# 可视化
plt.figure(figsize=(10, 6))
scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='viridis', alpha=0.7)
plt.xlabel('第一主成分')
plt.ylabel('第二主成分')
plt.title('鸢尾花数据集 PCA 可视化')
plt.colorbar(scatter, label='类别')
plt.show()

print(f"解释方差比: {pca.explained_variance_ratio_}")
print(f"累计解释方差: {sum(pca.explained_variance_ratio_):.4f}")
```

</details>

### 练习 2：进阶练习

比较 PCA、LDA、t-SNE 在鸢尾花数据集上的降维效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.manifold import TSNE

# PCA
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

# LDA
lda = LinearDiscriminantAnalysis(n_components=2)
X_lda = lda.fit_transform(X_scaled, y)

# t-SNE
tsne = TSNE(n_components=2, random_state=42)
X_tsne = tsne.fit_transform(X_scaled)

# 可视化对比
fig, axes = plt.subplots(1, 3, figsize=(18, 5))
for ax, X_reduced, title in zip(axes, [X_pca, X_lda, X_tsne], ['PCA', 'LDA', 't-SNE']):
    scatter = ax.scatter(X_reduced[:, 0], X_reduced[:, 1], c=y, cmap='viridis', alpha=0.7)
    ax.set_title(title)
    ax.set_xlabel('维度 1')
    ax.set_ylabel('维度 2')
plt.colorbar(scatter, ax=axes, label='类别')
plt.tight_layout()
plt.show()
```

</details>

### 练习 3（挑战）：综合练习

使用 PCA 降维后训练模型，通过交叉验证比较不同主成分数对模型性能的影响。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
import numpy as np

# 不同主成分数
n_components_list = [2, 5, 10, 15, 20, 25, 30]
scores_list = []

for n in n_components_list:
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('pca', PCA(n_components=n)),
        ('classifier', LogisticRegression(max_iter=10000, random_state=42))
    ])
    scores = cross_val_score(pipeline, X, y, cv=5)
    scores_list.append(scores.mean())
    print(f"主成分数 {n}: 准确率 {scores.mean():.4f}")

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(n_components_list, scores_list, marker='o')
plt.xlabel('主成分数')
plt.ylabel('交叉验证准确率')
plt.title('主成分数 vs 模型性能')
plt.grid(True, alpha=0.3)
plt.show()
```

</details>

---

## 下一章预告

下一章我们会学习 **模型评估基础**——包括训练集测试集划分、评估流程和评估原则，为后续的评估指标学习打下基础。
