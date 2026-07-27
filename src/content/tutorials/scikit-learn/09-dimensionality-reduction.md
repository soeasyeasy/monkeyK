---
title: "第9章：无监督学习：降维算法"
description: "PCA 主成分分析、t-SNE、LDA、降维可视化"
---

# 第9章：无监督学习：降维算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是降维？为什么要降维？
- PCA 是怎么工作的？
- t-SNE 和 PCA 有什么区别？
- 降维会丢失信息吗？

这一章会带你掌握降维算法的核心原理和实战应用，学会把高维数据压缩到低维，方便可视化和减少计算量。

---

## 1 为什么需要降维？

### 痛点分析

高维数据带来很多问题：

- **维度灾难**：维度越高，数据越稀疏，模型越难训练
- **计算成本高**：特征多，训练时间长
- **可视化困难**：超过 3 维就无法直接画图
- **过拟合风险**：特征多、样本少时容易过拟合

这就像**看地图**——3D 地球仪很真实，但 2D 地图更方便携带和使用。

### 解决方案

降维就是**保留重要信息，去掉冗余信息**：

- PCA：找到方差最大的方向
- t-SNE：保留局部结构
- LDA：最大化类别可分性（有监督）

> **一句话总结**：降维让高维数据变得可处理、可可视化。

---

## 2 PCA 主成分分析

### 原理

PCA 通过**正交变换**把数据投影到方差最大的方向上：

1. 标准化数据
2. 计算协方差矩阵
3. 计算特征值和特征向量
4. 选择前 K 个特征向量（主成分）
5. 投影到新的子空间

打个比方：

> PCA 就像**拍照**——把 3D 物体拍成 2D 照片，选择最能展现物体特征的角度。

### 代码示例

```python
from sklearn.decomposition import PCA
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import numpy as np

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 标准化（PCA 对尺度敏感）
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 创建 PCA 模型
# n_components: 保留的维度数
pca = PCA(n_components=2)

# 拟合并转换
X_pca = pca.fit_transform(X_scaled)

# 查看解释方差比例
print(f"原始维度: {X.shape[1]}")
print(f"降维后维度: {X_pca.shape[1]}")
print(f"各主成分解释方差比例: {pca.explained_variance_ratio_}")
print(f"累计解释方差比例: {sum(pca.explained_variance_ratio_):.2%}")

# 可视化
plt.figure(figsize=(8, 6))
for target, color, name in zip([0, 1, 2], ["red", "green", "blue"], iris.target_names):
    plt.scatter(X_pca[y == target, 0], X_pca[y == target, 1], 
                c=color, label=name, alpha=0.7)

plt.xlabel(f"第一主成分 ({pca.explained_variance_ratio_[0]:.2%})")
plt.ylabel(f"第二主成分 ({pca.explained_variance_ratio_[1]:.2%})")
plt.title("PCA 降维可视化")
plt.legend()
plt.grid(alpha=0.3)
plt.show()
```

### 选择主成分数量

```python
# 累计解释方差曲线
pca_full = PCA().fit(X_scaled)
cumulative_variance = np.cumsum(pca_full.explained_variance_ratio_)

plt.figure(figsize=(8, 5))
plt.plot(range(1, len(cumulative_variance) + 1), cumulative_variance, "bo-")
plt.axhline(y=0.95, color="r", linestyle="--", label="95% 方差")
plt.xlabel("主成分数量")
plt.ylabel("累计解释方差比例")
plt.title("选择主成分数量")
plt.legend()
plt.grid(alpha=0.3)
plt.show()

# 选择解释 95% 方差的主成分数
pca_95 = PCA(n_components=0.95)
X_95 = pca_95.fit_transform(X_scaled)
print(f"解释 95% 方差需要的主成分数: {pca_95.n_components_}")
```

---

## 3 t-SNE

### 原理

t-SNE（t-Distributed Stochastic Neighbor Embedding）专注于**保留局部结构**：

- 高维空间中相似的点，低维空间也相似
- 特别适合可视化高维数据
- 计算成本高，不适合大数据集

### 代码示例

```python
from sklearn.manifold import TSNE

# 创建 t-SNE 模型
# n_components: 降维后的维度（通常 2 或 3）
# perplexity: 邻域大小，影响局部 vs 全局结构
# random_state: 随机种子
tsne = TSNE(n_components=2, perplexity=30, random_state=42)

# 转换（t-SNE 没有 fit_transform，只能 transform）
X_tsne = tsne.fit_transform(X_scaled)

# 可视化
plt.figure(figsize=(8, 6))
for target, color, name in zip([0, 1, 2], ["red", "green", "blue"], iris.target_names):
    plt.scatter(X_tsne[y == target, 0], X_tsne[y == target, 1], 
                c=color, label=name, alpha=0.7)

plt.xlabel("t-SNE 维度 1")
plt.ylabel("t-SNE 维度 2")
plt.title("t-SNE 降维可视化")
plt.legend()
plt.grid(alpha=0.3)
plt.show()
```

### PCA vs t-SNE

| 特性 | PCA | t-SNE |
| --- | --- | --- |
| 目的 | 保留全局方差 | 保留局部结构 |
| 速度 | 快 | 慢 |
| 可解释性 | 高（主成分有明确含义） | 低（黑盒） |
| 适用场景 | 预处理、特征压缩 | 可视化 |
| 随机性 | 无 | 有（每次结果不同） |

---

## 4 LDA（线性判别分析）

### 原理

LDA 是**有监督**的降维方法，目标是最大化类别间的可分性：

- 找到能最好地区分类别的投影方向
- 最多降到 C-1 维（C 是类别数）

### 代码示例

```python
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis

# 创建 LDA 模型
# n_components: 降维后的维度（最多 C-1）
lda = LinearDiscriminantAnalysis(n_components=2)

# 拟合并转换（需要标签）
X_lda = lda.fit_transform(X_scaled, y)

# 可视化
plt.figure(figsize=(8, 6))
for target, color, name in zip([0, 1, 2], ["red", "green", "blue"], iris.target_names):
    plt.scatter(X_lda[y == target, 0], X_lda[y == target, 1], 
                c=color, label=name, alpha=0.7)

plt.xlabel("LDA 维度 1")
plt.ylabel("LDA 维度 2")
plt.title("LDA 降维可视化")
plt.legend()
plt.grid(alpha=0.3)
plt.show()

# 查看解释方差比例
print(f"各判别向量解释方差比例: {lda.explained_variance_ratio_}")
```

---

## 5 降维实战

### 完整流程

```python
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# 1. 加载数据
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

# 2. 不降维
model1 = RandomForestClassifier(n_estimators=100, random_state=42)
model1.fit(X_train, y_train)
y_pred1 = model1.predict(X_test)
acc1 = accuracy_score(y_test, y_pred1)

# 3. PCA 降维
pca = PCA(n_components=2)
X_train_pca = pca.fit_transform(X_train)
X_test_pca = pca.transform(X_test)

model2 = RandomForestClassifier(n_estimators=100, random_state=42)
model2.fit(X_train_pca, y_train)
y_pred2 = model2.predict(X_test_pca)
acc2 = accuracy_score(y_test, y_pred2)

# 4. LDA 降维
lda = LinearDiscriminantAnalysis(n_components=2)
X_train_lda = lda.fit_transform(X_train, y_train)
X_test_lda = lda.transform(X_test)

model3 = RandomForestClassifier(n_estimators=100, random_state=42)
model3.fit(X_train_lda, y_train)
y_pred3 = model3.predict(X_test_lda)
acc3 = accuracy_score(y_test, y_pred3)

# 5. 对比
print(f"不降维准确率: {acc1:.2%}")
print(f"PCA 降维准确率: {acc2:.2%}")
print(f"LDA 降维准确率: {acc3:.2%}")
```

---

## 6 新手常见误区

### 误区 1："降维后模型一定更差"

**错！** 降维可以去掉噪声和冗余特征，有时反而提高模型性能。

### 误区 2："PCA 适用于所有场景"

不是的。PCA 保留全局方差，但不一定保留类别信息。对于分类任务，LDA 可能更好。

### 误区 3："t-SNE 可以用于预处理"

**错！** t-SNE 计算慢、结果不稳定，只适合可视化，不适合用于模型训练。

### 误区 4："降维不需要标准化"

**错！** PCA 和 LDA 基于协方差矩阵，对尺度敏感，必须标准化。

### 误区 5："保留 95% 方差就够了"

不是的。具体保留多少方差取决于任务。可视化通常 2-3 维，预处理可以保留更多。

---

## 7 动手练习

### 练习 1：基础练习

用 PCA 对乳腺癌数据集降维到 2 维，查看解释方差比例并可视化。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 加载数据
data = load_breast_cancer()
X = data.data
y = data.target

# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# PCA 降维
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

# 查看解释方差
print(f"各主成分解释方差比例: {pca.explained_variance_ratio_}")
print(f"累计解释方差比例: {sum(pca.explained_variance_ratio_):.2%}")

# 可视化
plt.figure(figsize=(8, 6))
for target, color, name in zip([0, 1], ["red", "blue"], data.target_names):
    plt.scatter(X_pca[y == target, 0], X_pca[y == target, 1], 
                c=color, label=name, alpha=0.7)

plt.xlabel(f"第一主成分 ({pca.explained_variance_ratio_[0]:.2%})")
plt.ylabel(f"第二主成分 ({pca.explained_variance_ratio_[1]:.2%})")
plt.title("PCA 降维可视化（乳腺癌数据集）")
plt.legend()
plt.grid(alpha=0.3)
plt.show()
```

</details>

### 练习 2：进阶练习

用累计解释方差曲线选择 PCA 的主成分数量，使得保留 90% 的方差。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import numpy as np

# 加载数据
data = load_breast_cancer()
X_scaled = StandardScaler().fit_transform(data.data)

# 完整 PCA
pca_full = PCA().fit(X_scaled)
cumulative_variance = np.cumsum(pca_full.explained_variance_ratio_)

# 找到保留 90% 方差的主成分数
n_components_90 = np.argmax(cumulative_variance >= 0.90) + 1

# 可视化
plt.figure(figsize=(8, 5))
plt.plot(range(1, len(cumulative_variance) + 1), cumulative_variance, "bo-")
plt.axhline(y=0.90, color="r", linestyle="--", label="90% 方差")
plt.axvline(x=n_components_90, color="g", linestyle="--", label=f"{n_components_90} 个主成分")
plt.xlabel("主成分数量")
plt.ylabel("累计解释方差比例")
plt.title("选择主成分数量")
plt.legend()
plt.grid(alpha=0.3)
plt.show()

print(f"保留 90% 方差需要的主成分数: {n_components_90}")
print(f"原始维度: {X_scaled.shape[1]}")
print(f"降维比例: {n_components_90 / X_scaled.shape[1]:.2%}")
```

</details>

### 练习 3（挑战）：综合练习

对比 PCA、t-SNE、LDA 在鸢尾花数据集上的可视化效果，并分析各自的特点。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 标准化
X_scaled = StandardScaler().fit_transform(X)

# 三种降维方法
methods = {
    "PCA": PCA(n_components=2),
    "t-SNE": TSNE(n_components=2, perplexity=30, random_state=42),
    "LDA": LinearDiscriminantAnalysis(n_components=2)
}

# 可视化
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

for ax, (name, method) in zip(axes, methods.items()):
    if name == "LDA":
        X_reduced = method.fit_transform(X_scaled, y)
    else:
        X_reduced = method.fit_transform(X_scaled)
    
    for target, color, label in zip([0, 1, 2], ["red", "green", "blue"], iris.target_names):
        ax.scatter(X_reduced[y == target, 0], X_reduced[y == target, 1], 
                   c=color, label=label, alpha=0.7)
    
    ax.set_title(f"{name} 降维可视化")
    ax.set_xlabel("维度 1")
    ax.set_ylabel("维度 2")
    ax.legend()
    ax.grid(alpha=0.3)

plt.tight_layout()
plt.show()

print("分析:")
print("- PCA: 保留全局方差，计算快，可解释")
print("- t-SNE: 保留局部结构，可视化效果好，但计算慢")
print("- LDA: 最大化类别可分性，分类效果最好，但需要标签")
```

</details>

---

## 8 下一章预告

下一章我们会学习 **集成学习方法**——随机森林、Gradient Boosting、AdaBoost、Voting、Stacking。你会学到如何组合多个弱模型，构建一个强模型。
