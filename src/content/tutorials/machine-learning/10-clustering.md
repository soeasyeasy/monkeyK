---
title: "第10章：聚类算法"
description: "K-Means、DBSCAN、层次聚类、轮廓系数"
---

# 第10章：聚类算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是聚类？和分类有什么区别？
- K-Means 是怎么工作的？
- 如何确定聚类数量 K？
- 如何评估聚类效果？

这一章就是为了解答这些问题。聚类是无监督学习的核心，用于发现数据的内在结构。

---

## 1 为什么需要聚类？

### 痛点分析

假设你有一堆 unlabeled 数据：

```
客户数据：年龄、收入、消费习惯
问题：如何自动将客户分成不同群体？
```

没有标签，无法用监督学习。

### 解决方案

聚类自动发现数据的自然分组：

```python
# 聚类：将相似样本分到同一组
# 组内相似度高，组间相似度低

# 应用：
# - 客户分群：高价值客户、普通客户、潜在客户
# - 图像分割：前景、背景
# - 异常检测：离群点
```

打个比方：

> 聚类像"整理衣柜"：把相似的衣服放在一起，不同的分开。你不需要知道每件衣服的名字，只需要根据相似度分组。

> **一句话总结**：聚类将相似样本分到同一组，发现数据的内在结构。

---

## 2 核心原理

### K-Means 算法

```python
# K-Means 流程：
# 1. 随机选择 K 个中心点
# 2. 将每个样本分配到最近的中心
# 3. 重新计算每个簇的中心
# 4. 重复步骤2-3，直到收敛

# 优点：简单、快速
# 缺点：需要指定K，对初始值敏感，只能处理球形簇
```

### DBSCAN

```python
# DBSCAN（基于密度的聚类）
# 核心思想：高密度区域被低密度区域分隔

# 参数：
# eps: 邻域半径
# min_samples: 核心点的最小邻居数

# 优点：不需要指定K，可以发现任意形状的簇
# 缺点：对参数敏感，高维数据效果差
```

### 层次聚类

```python
# 层次聚类：构建嵌套的簇树
# 凝聚式：自底向上，合并最相似的簇
# 分裂式：自顶向下，分裂最不相似的簇

# 优点：不需要指定K，可以得到层次结构
# 缺点：计算复杂度高
```

---

## 3 基础用法

### K-Means 聚类

```python
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import numpy as np

# 1. 生成数据
X, y_true = make_blobs(
    n_samples=300,
    centers=4,
    cluster_std=0.60,
    random_state=42
)

print("数据形状：", X.shape)

# 2. 创建模型
# n_clusters: K值（簇数量）
# init: 初始化方法（'k-means++'推荐）
# n_init: 运行次数（取最好的）
# max_iter: 最大迭代次数
kmeans = KMeans(
    n_clusters=4,
    init='k-means++',  # 智能初始化
    n_init=10,         # 运行10次
    max_iter=300,
    random_state=42
)

# 3. 训练（拟合）
kmeans.fit(X)

# 4. 获取结果
labels = kmeans.labels_          # 每个样本的簇标签
centers = kmeans.cluster_centers_  # 簇中心
inertia = kmeans.inertia_        # 簇内平方和（越小越好）

print(f"\n簇标签：{np.unique(labels)}")
print(f"簇中心：\n{centers}")
print(f"簇内平方和：{inertia:.2f}")

# 5. 预测新样本
X_new = np.array([[0, 0], [5, 5]])
predictions = kmeans.predict(X_new)
print(f"\n新样本预测：{predictions}")

# 6. 评估（轮廓系数）
silhouette = silhouette_score(X, labels)
print(f"轮廓系数：{silhouette:.3f}")  # 范围[-1, 1]，越大越好

# 7. 选择最佳K值（肘部法则）
inertias = []
K_range = range(1, 11)
for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42)
    kmeans.fit(X)
    inertias.append(kmeans.inertia_)

print("\n肘部法则：")
for k, inertia in zip(K_range, inertias):
    print(f"K={k}: {inertia:.2f}")

# 8. 可视化
plt.figure(figsize=(12, 5))

# 原始数据
plt.subplot(1, 2, 1)
plt.scatter(X[:, 0], X[:, 1], c=y_true, cmap='viridis', alpha=0.6)
plt.title('Original Data')

# 聚类结果
plt.subplot(1, 2, 2)
plt.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', alpha=0.6)
plt.scatter(centers[:, 0], centers[:, 1], c='red', marker='X', s=200, label='Centroids')
plt.title('K-Means Clustering')
plt.legend()

plt.tight_layout()
plt.show()
```

### DBSCAN

```python
from sklearn.cluster import DBSCAN
from sklearn.datasets import make_moons
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# DBSCAN 可以发现任意形状的簇

# 1. 生成月牙形数据
X, y_true = make_moons(n_samples=300, noise=0.05, random_state=42)

# 2. 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. 创建模型
# eps: 邻域半径
# min_samples: 核心点的最小邻居数
# metric: 距离度量
dbscan = DBSCAN(eps=0.2, min_samples=5, metric='euclidean')

# 4. 训练
labels = dbscan.fit_predict(X_scaled)

# 5. 分析结果
n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
n_noise = list(labels).count(-1)

print(f"发现簇数量：{n_clusters}")
print(f"噪声点数量：{n_noise}")
print(f"簇标签：{set(labels)}")

# 6. 可视化
plt.figure(figsize=(12, 5))

# 原始数据
plt.subplot(1, 2, 1)
plt.scatter(X[:, 0], X[:, 1], c=y_true, cmap='viridis', alpha=0.6)
plt.title('Original Data (Moons)')

# 聚类结果
plt.subplot(1, 2, 2)
unique_labels = set(labels)
colors = ['blue', 'green', 'red', 'orange', 'purple']
for label in unique_labels:
    if label == -1:
        # 噪声点
        plt.scatter(X_scaled[labels == label, 0], 
                   X_scaled[labels == label, 1], 
                   c='black', marker='x', label='Noise')
    else:
        plt.scatter(X_scaled[labels == label, 0], 
                   X_scaled[labels == label, 1], 
                   c=colors[label % len(colors)], label=f'Cluster {label}')

plt.title('DBSCAN Clustering')
plt.legend()
plt.tight_layout()
plt.show()
```

### 层次聚类

```python
from sklearn.cluster import AgglomerativeClustering
from sklearn.datasets import make_blobs
from scipy.cluster.hierarchy import dendrogram, linkage
import matplotlib.pyplot as plt
import numpy as np

# 层次聚类可以构建层次结构

# 1. 生成数据
X, y_true = make_blobs(n_samples=100, centers=3, random_state=42)

# 2. 创建模型
# n_clusters: 簇数量
# linkage: 链接准则
#   - 'ward': 最小方差（默认）
#   - 'complete': 最大距离
#   - 'average': 平均距离
#   - 'single': 最小距离
hierarchical = AgglomerativeClustering(n_clusters=3, linkage='ward')

# 3. 训练
labels = hierarchical.fit_predict(X)

print(f"簇标签：{np.unique(labels)}")

# 4. 可视化树状图
plt.figure(figsize=(10, 5))

# 原始数据
plt.subplot(1, 2, 1)
plt.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', alpha=0.6)
plt.title('Hierarchical Clustering')

# 树状图
plt.subplot(1, 2, 2)
linked = linkage(X, 'ward')
dendrogram(linked, orientation='top', distance_sort='descending', show_leaf_counts=True)
plt.title('Dendrogram')
plt.xlabel('Sample Index')
plt.ylabel('Distance')

plt.tight_layout()
plt.show()
```

### 聚类评估指标

```python
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score
import numpy as np

# 聚类评估指标

# 1. 生成数据
X, y_true = make_blobs(n_samples=300, centers=4, random_state=42)

# 2. 聚类
kmeans = KMeans(n_clusters=4, random_state=42)
labels = kmeans.fit_predict(X)

# 3. 评估指标

# 轮廓系数（Silhouette Score）
# 范围[-1, 1]，越大越好
# 衡量：样本与自己的簇相似度 vs 与其他簇相似度
silhouette = silhouette_score(X, labels)
print(f"轮廓系数: {silhouette:.3f}")

# Calinski-Harabasz 指数
# 越大越好
# 衡量：簇间方差 vs 簇内方差
calinski = calinski_harabasz_score(X, labels)
print(f"Calinski-Harabasz指数: {calinski:.2f}")

# Davies-Bouldin 指数
# 越小越好
# 衡量：簇间相似度
davies_bouldin = davies_bouldin_score(X, labels)
print(f"Davies-Bouldin指数: {davies_bouldin:.3f}")

# 4. 如果有真实标签，可以计算调整兰德指数
from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score

ari = adjusted_rand_score(y_true, labels)
nmi = normalized_mutual_info_score(y_true, labels)
print(f"\n调整兰德指数: {ari:.3f}")
print(f"归一化互信息: {nmi:.3f}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 适用场景 |
| --- | --- | --- |
| K-Means | 基于距离的聚类 | 球形簇，大数据 |
| DBSCAN | 基于密度的聚类 | 任意形状，噪声 |
| 层次聚类 | 构建层次结构 | 小数据，需要树状图 |
| 轮廓系数 | 聚类质量评估 | 有标签或无标签 |
| 肘部法则 | 选择K值 | K-Means |
| 簇中心 | 簇的代表点 | K-Means |
| 噪声点 | 不属于任何簇 | DBSCAN |

---

## 5 新手常见误区

### 误区 1："聚类需要标签"

**错！** 聚类是无监督学习，不需要标签。聚类发现数据的内在结构，分类需要标签。

### 误区 2："K-Means 总是最好的"

不是的。K-Means 只能处理球形簇，对非球形数据效果差。需要根据数据特点选择算法。

### 误区 3："聚类数量越多越好"

**错！** K太大会过拟合，K太小会欠拟合。需要通过肘部法则、轮廓系数等选择合适K值。

### 误区 4："聚类结果一定有意义"

不是的。聚类只是数学上的分组，不一定有业务意义。需要结合领域知识解释结果。

### 误区 5："不需要特征缩放"

**错！** 聚类基于距离，特征尺度不同会导致偏差。必须做特征缩放。

---

## 6 动手练习

### 练习 1：基础练习 - K-Means

使用 K-Means 对鸢尾花数据集进行聚类。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.cluster import KMeans
from sklearn.datasets import load_iris
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

# 加载数据
iris = load_iris()
X = iris.data

# 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# K-Means 聚类
kmeans = KMeans(n_clusters=3, random_state=42)
labels = kmeans.fit_predict(X_scaled)

# 评估
silhouette = silhouette_score(X_scaled, labels)
print(f"轮廓系数: {silhouette:.3f}")

# 对比真实标签
print(f"\n聚类标签: {labels[:10]}")
print(f"真实标签: {iris.target[:10]}")
```

</details>

### 练习 2：进阶练习 - 选择最佳K

使用肘部法则和轮廓系数选择最佳K值。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt

# 生成数据
X, _ = make_blobs(n_samples=300, centers=4, random_state=42)

# 肘部法则
inertias = []
silhouettes = []
K_range = range(2, 11)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42)
    labels = kmeans.fit_predict(X)
    inertias.append(kmeans.inertia_)
    silhouettes.append(silhouette_score(X, labels))

# 可视化
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

ax1.plot(K_range, inertias, 'bo-')
ax1.set_xlabel('K')
ax1.set_ylabel('Inertia')
ax1.set_title('Elbow Method')

ax2.plot(K_range, silhouettes, 'ro-')
ax2.set_xlabel('K')
ax2.set_ylabel('Silhouette Score')
ax2.set_title('Silhouette Analysis')

plt.tight_layout()
plt.show()

# 最佳K
best_k = K_range[silhouettes.index(max(silhouettes))]
print(f"最佳K值: {best_k}")
```

</details>

### 练习 3（挑战）：综合练习 - 对比不同算法

对比 K-Means、DBSCAN、层次聚类的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.datasets import make_moons
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt

# 生成月牙形数据
X, y_true = make_moons(n_samples=300, noise=0.05, random_state=42)

# 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 三种算法
algorithms = {
    'K-Means': KMeans(n_clusters=2, random_state=42),
    'DBSCAN': DBSCAN(eps=0.2, min_samples=5),
    'Hierarchical': AgglomerativeClustering(n_clusters=2)
}

# 可视化
fig, axes = plt.subplots(2, 2, figsize=(12, 12))
axes = axes.flatten()

# 原始数据
axes[0].scatter(X[:, 0], X[:, 1], c=y_true, cmap='viridis', alpha=0.6)
axes[0].set_title('Original Data')

# 三种聚类
for i, (name, algo) in enumerate(algorithms.items(), 1):
    labels = algo.fit_predict(X_scaled)
    axes[i].scatter(X_scaled[:, 0], X_scaled[:, 1], c=labels, cmap='viridis', alpha=0.6)
    axes[i].set_title(f'{name}')
    
    if len(set(labels)) > 1:
        score = silhouette_score(X_scaled, labels)
        print(f"{name} 轮廓系数: {score:.3f}")

plt.tight_layout()
plt.show()
```

</details>

---

## 下一章预告

下一章我们会学习 **降维算法** —— 减少特征数量，保留重要信息。你会学到 PCA、LDA、t-SNE 等算法，以及如何可视化高维数据。
