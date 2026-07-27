---
title: "第8章：无监督学习算法"
description: "掌握 K-Means 聚类、PCA 降维和异常检测"
---

# 第8章：无监督学习算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 无监督学习和监督学习有什么区别？
- K-Means 是怎么聚类的？
- 什么是 PCA 降维？
- 如何检测异常数据？

这一章就是为了解答这些问题。无监督学习让模型自己发现数据中的规律，不需要人工标注。

---

## 1 为什么需要无监督学习？

### 痛点分析

假设你有一堆用户数据，但不知道用户分为几类：

```python
# ❌ 监督学习：需要人工标注
# 先手动标记"高消费用户"、"低消费用户"...
# 太费时间，而且主观
```

```python
# ✅ 无监督学习：自动发现规律
# 让算法自己把相似的用户分到一组
# 客观、高效
```

> **一句话总结**：无监督学习让数据"自己说话"。

---

## 2 K-Means 聚类

### 概念解释

K-Means 把数据分成 K 个簇，每个簇有一个中心点：

```
初始状态：
    ●   ○   ■
  ●   ○   ■
    ●   ○   ■

聚类后：
  ●●●   ○○○   ■■■
  ●●●   ○○○   ■■■
```

### 算法步骤

1. 随机选择 K 个中心点
2. 把每个点分配到最近的中心点
3. 重新计算每个簇的中心点
4. 重复 2-3 直到中心点不再变化

### 代码实现

```python
from sklearn.cluster import KMeans
import numpy as np
import matplotlib.pyplot as plt

# 生成示例数据
np.random.seed(42)
X = np.vstack([
    np.random.randn(50, 2) + [2, 2],   # 簇1
    np.random.randn(50, 2) + [-2, -2], # 簇2
    np.random.randn(50, 2) + [2, -2]   # 簇3
])

# 创建 K-Means 模型（K=3）
kmeans = KMeans(n_clusters=3, random_state=42)

# 训练
kmeans.fit(X)

# 获取聚类标签
labels = kmeans.labels_

# 获取中心点
centers = kmeans.cluster_centers_

print("聚类标签:", labels[:10])
print("中心点:\n", centers)

# 可视化
plt.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', alpha=0.6)
plt.scatter(centers[:, 0], centers[:, 1], c='red', marker='x', s=200, label='中心点')
plt.title('K-Means 聚类结果')
plt.legend()
plt.show()
```

### 选择 K 值

```python
# 手肘法选择 K
inertias = []
K_range = range(1, 11)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42)
    kmeans.fit(X)
    inertias.append(kmeans.inertia_)

plt.plot(K_range, inertias, 'bo-')
plt.xlabel('K 值')
plt.ylabel('Inertia')
plt.title('手肘法选择 K')
plt.show()
# 选择"手肘"处的 K 值
```

---

## 3 PCA 降维

### 概念解释

PCA（主成分分析）把高维数据投影到低维，保留最多信息：

```
3D 数据 → PCA → 2D 数据

  z                    y
  |   ●              ●
  | ●              ●
  |   ●    →      ●
  | ●              ●
  +--y             x
 /
x
```

### 生活化类比

> PCA 就像给 3D 物体拍 2D 照片。
> 选择最好的角度，保留最多信息。

### 代码实现

```python
from sklearn.decomposition import PCA
from sklearn.datasets import load_iris
import matplotlib.pyplot as plt

# 加载数据（4维）
iris = load_iris()
X = iris.data
y = iris.target

# 创建 PCA（降到2维）
pca = PCA(n_components=2)

# 转换
X_pca = pca.fit_transform(X)

print("原始维度:", X.shape)
print("降维后:", X_pca.shape)
print("保留信息比例:", pca.explained_variance_ratio_.sum())

# 可视化
plt.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='viridis')
plt.xlabel('第一主成分')
plt.ylabel('第二主成分')
plt.title('PCA 降维可视化')
plt.colorbar(label='类别')
plt.show()
```

---

## 4 异常检测

### 概念解释

异常检测找出数据中的异常点：

```
    ●
   ● ●
  ●  ●  ●
   ● ●
    ●
       ✖  ← 异常点
```

### 生活化类比

> 异常检测就像在一群正常人中找到行为异常的人。
> 比如银行检测欺诈交易。

### Isolation Forest

```python
from sklearn.ensemble import IsolationForest
import numpy as np

# 生成数据（包含异常点）
np.random.seed(42)
X_normal = np.random.randn(200, 2)
X_outliers = np.random.uniform(low=-4, high=4, size=(20, 2))
X = np.vstack([X_normal, X_outliers])

# 创建异常检测模型
model = IsolationForest(contamination=0.1, random_state=42)

# 训练和预测
predictions = model.fit_predict(X)

# -1 表示异常，1 表示正常
print("异常点数量:", (predictions == -1).sum())
print("正常点数量:", (predictions == 1).sum())

# 可视化
plt.scatter(X[:, 0], X[:, 1], c=predictions, cmap='viridis')
plt.title('异常检测结果')
plt.show()
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| K-Means | 把数据分成 K 个簇 |
| PCA | 降维，保留最多信息 |
| 异常检测 | 找出数据中的异常点 |
| 手肘法 | 选择 K-Means 的 K 值 |
| 解释方差比 | PCA 保留的信息比例 |

---

## 6 新手常见误区

### 误区 1："K-Means 的 K 可以随便选"

**错！** K 的选择影响结果，需要用肘法或轮廓系数：

```python
# ❌ 错误：随便选 K=5
kmeans = KMeans(n_clusters=5)

# ✅ 正确：用肘法选择
inertias = []
for k in range(1, 11):
    kmeans = KMeans(n_clusters=k)
    kmeans.fit(X)
    inertias.append(kmeans.inertia_)
# 选择"肘"处的 K
```

### 误区 2："PCA 降维后信息不会丢失"

不是的。降维必然会丢失一些信息：

```python
# ❌ 错误理解：PCA 完美保留所有信息
# ✅ 正确理解：PCA 保留最重要的信息

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X)
print("保留信息:", pca.explained_variance_ratio_.sum())
# 通常 80-95%，不是 100%
```

### 误区 3："异常检测能找出所有异常"

异常检测是基于统计的，不能保证 100% 准确：

```python
# ❌ 错误：完全依赖异常检测
# ✅ 正确：结合业务逻辑判断
```

---

## 7 动手练习

### 练习 1：基础练习

用 K-Means 将以下数据分成 2 类：

```python
X = [[1, 2], [1, 4], [1, 0], [10, 2], [10, 4], [10, 0]]
```

<details>
<summary>点击查看答案</summary>

```python
from sklearn.cluster import KMeans
import numpy as np

X = np.array([[1, 2], [1, 4], [1, 0], [10, 2], [10, 4], [10, 0]])

kmeans = KMeans(n_clusters=2, random_state=42)
kmeans.fit(X)

labels = kmeans.labels_
print("聚类标签:", labels)
# [1 1 1 0 0 0] 前3个一类，后3个一类
```

</details>

### 练习 2：进阶练习

用 PCA 将 Iris 数据集降到 2 维并可视化。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.decomposition import PCA
from sklearn.datasets import load_iris
import matplotlib.pyplot as plt

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# PCA 降维
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X)

# 可视化
plt.figure(figsize=(8, 6))
scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='viridis')
plt.xlabel('第一主成分')
plt.ylabel('第二主成分')
plt.title('Iris PCA 可视化')
plt.colorbar(scatter, label='类别')
plt.show()
```

</details>

### 练习 3（挑战）：综合练习

用 K-Means 对客户数据进行分群，并用 PCA 可视化结果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import numpy as np
import matplotlib.pyplot as plt

# 模拟客户数据（年龄、收入、消费分数）
np.random.seed(42)
X = np.vstack([
    np.random.randn(50, 3) * [5, 10000, 10] + [25, 30000, 50],   # 年轻低消费
    np.random.randn(50, 3) * [5, 10000, 10] + [45, 80000, 80],   # 中年高消费
    np.random.randn(50, 3) * [5, 10000, 10] + [35, 50000, 65]    # 中年中消费
])

# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# K-Means 聚类
kmeans = KMeans(n_clusters=3, random_state=42)
labels = kmeans.fit_predict(X_scaled)

# PCA 降维可视化
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

plt.figure(figsize=(10, 8))
plt.scatter(X_pca[:, 0], X_pca[:, 1], c=labels, cmap='viridis', alpha=0.6)
plt.title('客户分群（K-Means + PCA）')
plt.xlabel('第一主成分')
plt.ylabel('第二主成分')
plt.colorbar(label='客户群')
plt.show()
```

</details>

---

## 下一章预告

下一章我们会学习 **模型评估与优化**——交叉验证、网格搜索、正则化，让模型更准确