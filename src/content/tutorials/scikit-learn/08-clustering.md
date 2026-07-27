---
title: "第8章：无监督学习：聚类算法"
description: "K-Means、DBSCAN、层次聚类、轮廓系数、聚类评估"
---

# 第8章：无监督学习：聚类算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是无监督学习？和 supervised 有什么区别？
- 聚类是怎么工作的？
- K-Means 和 DBSCAN 有什么区别？
- 怎么评估聚类效果？

这一章会带你掌握聚类算法的核心原理和实战应用，学会在没有标签的情况下自动发现数据中的群体。

---

## 1 为什么需要聚类算法？

### 痛点分析

很多场景下**没有标签**：

- 客户分群：不知道哪些是高价值客户
- 异常检测：不知道哪些是异常行为
- 图像分割：不知道图片中有哪些物体

这些问题不能用监督学习解决，因为没有"正确答案"可以学习。

### 解决方案

聚类算法就是**自动发现数据中的群体**：

- 把相似的样本分到一组
- 把不相似的样本分到不同组
- 不需要预先知道标签

打个比方：

> 聚类就像**整理衣柜**——把相似的衣服放在一起（T恤一堆、裤子一堆），不需要事先知道有哪些类别。

---

## 2 K-Means 聚类

### 原理

K-Means 把数据分成 K 个簇，每个样本属于**距离最近的中心点**。

算法步骤：

1. 随机初始化 K 个中心点
2. 每个样本分配到最近的中心点
3. 重新计算每个簇的中心点
4. 重复 2-3 直到收敛

### 代码示例

```python
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
import matplotlib.pyplot as plt

# 生成示例数据
X, y_true = make_blobs(n_samples=300, centers=4, cluster_std=0.6, random_state=42)

# 创建 K-Means 模型
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)

# 训练（拟合）
kmeans.fit(X)

# 预测簇标签
y_pred = kmeans.predict(X)

# 查看中心点
print(f"簇中心点:\n{kmeans.cluster_centers_}")

# 可视化
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# 真实标签
axes[0].scatter(X[:, 0], X[:, 1], c=y_true, cmap="viridis", s=50, alpha=0.7)
axes[0].set_title("真实标签")

# 预测标签
axes[1].scatter(X[:, 0], X[:, 1], c=y_pred, cmap="viridis", s=50, alpha=0.7)
axes[1].scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1], 
                c="red", marker="X", s=200, label="中心点")
axes[1].set_title("K-Means 聚类结果")
axes[1].legend()

plt.tight_layout()
plt.show()
```

### 选择 K 值

```python
# 肘部法则：选择 inertia 下降最快的 K
inertia = []
K_range = range(1, 11)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X)
    inertia.append(kmeans.inertia_)

plt.figure(figsize=(8, 5))
plt.plot(K_range, inertia, "bo-")
plt.xlabel("K 值")
plt.ylabel("Inertia（簇内平方和）")
plt.title("肘部法则选择 K")
plt.grid(alpha=0.3)
plt.show()
```

---

## 3 DBSCAN 聚类

### 原理

DBSCAN 基于**密度**聚类，不需要指定 K 值。

核心概念：

- **核心点**：半径 ε 内至少有 min_samples 个点
- **边界点**：在核心点的 ε 内，但自己周围点不够
- **噪声点**：既不是核心点也不是边界点

### 代码示例

```python
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

# 标准化（DBSCAN 对尺度敏感）
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 创建 DBSCAN 模型
# eps: 半径
# min_samples: 最小样本数
dbscan = DBSCAN(eps=0.5, min_samples=5)

# 训练并预测
y_pred = dbscan.fit_predict(X_scaled)

# 查看结果
n_clusters = len(set(y_pred)) - (1 if -1 in y_pred else 0)
n_noise = list(y_pred).count(-1)

print(f"簇数量: {n_clusters}")
print(f"噪声点数量: {n_noise}")

# 可视化
plt.figure(figsize=(8, 5))
plt.scatter(X_scaled[:, 0], X_scaled[:, 1], c=y_pred, cmap="viridis", s=50, alpha=0.7)
plt.title(f"DBSCAN 聚类结果（{n_clusters} 个簇，{n_noise} 个噪声点）")
plt.show()
```

### 对比 K-Means

| 特性 | K-Means | DBSCAN |
| --- | --- | --- |
| 需要指定 K | 是 | 否 |
| 簇形状 | 球形 | 任意形状 |
| 噪声处理 | 不能 | 能（标记为 -1） |
| 速度 | 快 | 较慢 |
| 适用场景 | 球形簇、大数据 | 复杂形状、有噪声 |

---

## 4 层次聚类

### 原理

层次聚类通过**合并或分裂**构建簇的层次结构。

两种方法：

- **凝聚（自底向上）**：每个样本初始为一个簇，逐步合并最相似的簇
- **分裂（自顶向下）**：所有样本初始为一个簇，逐步分裂

### 代码示例

```python
from sklearn.cluster import AgglomerativeClustering

# 创建层次聚类模型
# n_clusters: 簇数量
# linkage: 连接准则（"ward", "complete", "average", "single"）
hierarchical = AgglomerativeClustering(n_clusters=4, linkage="ward")

# 训练并预测
y_pred = hierarchical.fit_predict(X)

# 可视化
plt.figure(figsize=(8, 5))
plt.scatter(X[:, 0], X[:, 1], c=y_pred, cmap="viridis", s=50, alpha=0.7)
plt.title("层次聚类结果")
plt.show()

# 绘制树状图
from scipy.cluster.hierarchy import dendrogram, linkage

Z = linkage(X, method="ward")
plt.figure(figsize=(12, 6))
dendrogram(Z, truncate_mode="lastp", p=30)
plt.title("层次聚类树状图")
plt.xlabel("样本索引")
plt.ylabel("距离")
plt.show()
```

---

## 5 聚类评估

### 轮廓系数（Silhouette Score）

衡量**样本与自己的簇的相似度** vs **与其他簇的相似度**：

- 范围：-1 到 1
- 越接近 1 越好（样本与自己的簇相似，与其他簇不相似）

```python
from sklearn.metrics import silhouette_score

# 计算轮廓系数
score = silhouette_score(X, y_pred)
print(f"轮廓系数: {score:.2f}")

# 不同 K 值的轮廓系数
silhouette_scores = []
K_range = range(2, 11)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    y_pred = kmeans.fit_predict(X)
    score = silhouette_score(X, y_pred)
    silhouette_scores.append(score)
    print(f"K={k}: 轮廓系数 = {score:.2f}")

# 可视化
plt.figure(figsize=(8, 5))
plt.plot(K_range, silhouette_scores, "bo-")
plt.xlabel("K 值")
plt.ylabel("轮廓系数")
plt.title("轮廓系数选择 K")
plt.grid(alpha=0.3)
plt.show()
```

### 其他评估指标

```python
from sklearn.metrics import calinski_harabasz_score, davies_bouldin_score

# Calinski-Harabasz 指数（越大越好）
ch_score = calinski_harabasz_score(X, y_pred)
print(f"Calinski-Harabasz 指数: {ch_score:.2f}")

# Davies-Bouldin 指数（越小越好）
db_score = davies_bouldin_score(X, y_pred)
print(f"Davies-Bouldin 指数: {db_score:.2f}")
```

---

## 6 新手常见误区

### 误区 1："K-Means 不需要指定 K"

**错！** K-Means 必须指定 K 值。可以用肘部法则或轮廓系数选择。

### 误区 2："聚类结果一定有意义"

不是的。聚类只是数学上的分组，不一定有实际意义。需要结合业务解释。

### 误区 3："DBSCAN 不需要调参"

**错！** DBSCAN 需要调整 `eps` 和 `min_samples`，对参数敏感。

### 误区 4："不需要标准化"

**错！** 大多数聚类算法基于距离计算，对特征尺度敏感，必须标准化。

### 误区 5："轮廓系数越高越好"

不是的。轮廓系数高只说明簇内紧密、簇间分离好，但不一定符合业务需求。

---

## 7 动手练习

### 练习 1：基础练习

用 K-Means 对鸢尾花数据集聚类（不使用标签），查看聚类结果与真实标签的对比。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score
import matplotlib.pyplot as plt

# 加载数据
iris = load_iris()
X = iris.data

# K-Means 聚类
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
y_pred = kmeans.fit_predict(X)

# 评估（调整兰德系数）
ari = adjusted_rand_score(iris.target, y_pred)
print(f"调整兰德系数: {ari:.2f}")

# 可视化（取前两个特征）
plt.figure(figsize=(8, 5))
plt.scatter(X[:, 0], X[:, 1], c=y_pred, cmap="viridis", s=50, alpha=0.7)
plt.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1], 
            c="red", marker="X", s=200, label="中心点")
plt.xlabel(iris.feature_names[0])
plt.ylabel(iris.feature_names[1])
plt.title("K-Means 聚类结果")
plt.legend()
plt.show()
```

</details>

### 练习 2：进阶练习

用肘部法则和轮廓系数选择 K-Means 的最佳 K 值。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.datasets import make_blobs
import matplotlib.pyplot as plt

# 生成数据
X, _ = make_blobs(n_samples=300, centers=4, cluster_std=0.6, random_state=42)

# 肘部法则
inertia = []
silhouette_scores = []
K_range = range(2, 11)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X)
    inertia.append(kmeans.inertia_)
    silhouette_scores.append(silhouette_score(X, kmeans.labels_))

# 可视化
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

axes[0].plot(K_range, inertia, "bo-")
axes[0].set_xlabel("K 值")
axes[0].set_ylabel("Inertia")
axes[0].set_title("肘部法则")

axes[1].plot(K_range, silhouette_scores, "bo-")
axes[1].set_xlabel("K 值")
axes[1].set_ylabel("轮廓系数")
axes[1].set_title("轮廓系数")

plt.tight_layout()
plt.show()

print(f"最佳 K 值（轮廓系数最大）: {K_range[silhouette_scores.index(max(silhouette_scores))]}")
```

</details>

### 练习 3（挑战）：综合练习

对比 K-Means、DBSCAN、层次聚类在不同数据集上的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.datasets import make_blobs, make_moons
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt

# 生成两种数据集
X_blobs, _ = make_blobs(n_samples=300, centers=3, cluster_std=0.6, random_state=42)
X_moons, _ = make_moons(n_samples=300, noise=0.05, random_state=42)

# 标准化
X_blobs_scaled = StandardScaler().fit_transform(X_blobs)
X_moons_scaled = StandardScaler().fit_transform(X_moons)

# 定义模型
models = {
    "K-Means": KMeans(n_clusters=3, random_state=42, n_init=10),
    "DBSCAN": DBSCAN(eps=0.3, min_samples=5),
    "层次聚类": AgglomerativeClustering(n_clusters=3)
}

# 对比
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

for i, (data_name, X) in enumerate([("球形数据", X_blobs_scaled), ("月牙数据", X_moons_scaled)]):
    for j, (model_name, model) in enumerate(models.items()):
        if hasattr(model, "predict"):
            y_pred = model.fit_predict(X)
        else:
            y_pred = model.fit_predict(X)
        
        axes[i, j].scatter(X[:, 0], X[:, 1], c=y_pred, cmap="viridis", s=50, alpha=0.7)
        axes[i, j].set_title(f"{data_name} - {model_name}")

plt.tight_layout()
plt.show()

print("结论:")
print("- K-Means 适合球形簇")
print("- DBSCAN 适合任意形状，能发现噪声")
print("- 层次聚类不需要指定 K，但计算慢")
```

</details>

---

## 8 下一章预告

下一章我们会学习 **无监督学习：降维算法**——PCA 主成分分析、t-SNE、LDA。你会学到如何把高维数据压缩到低维，方便可视化和减少计算量。
