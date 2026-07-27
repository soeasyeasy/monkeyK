---
title: "第11章：降维算法"
description: "PCA 主成分分析、LDA、t-SNE、特征选择策略"
---

# 第11章：降维算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是降维？为什么要降维？
- PCA 是怎么工作的？
- 如何确定降维后的维度数？
- 降维会丢失信息吗？

这一章就是为了解答这些问题。降维可以简化模型，加速训练，可视化高维数据。

---

## 1 为什么需要降维？

### 痛点分析

高维数据的问题：

```
问题1：维度灾难
- 高维空间中，所有样本之间的距离都很大
- 需要指数级增长的样本才能覆盖空间

问题2：计算成本高
- 特征太多，训练时间长
- 内存消耗大

问题3：过拟合
- 特征多，模型复杂
- 容易记住噪声

问题4：难以可视化
- 人类只能理解2D/3D
- 高维数据无法直接观察
```

### 解决方案

降维减少特征数量：

```python
# 降维：从100维降到10维
# 保留重要信息，去除冗余和噪声

# 方法：
# 1. 特征选择：选择重要特征
# 2. 特征提取：构造新特征（PCA、LDA）

# 打个比方：
# 降维像"拍照"：3D场景变成2D照片，保留主要信息
```

打个比方：

> 降维像"压缩文件"：去掉冗余信息，保留核心内容，文件更小，传输更快。

> **一句话总结**：降维减少特征数量，保留重要信息，简化模型。

---

## 2 核心原理

### PCA（主成分分析）

```python
# PCA 思路：
# 1. 找到数据方差最大的方向（第一主成分）
# 2. 找到与第一主成分正交且方差次大的方向（第二主成分）
# 3. 依次类推，得到多个主成分
# 4. 选择前K个主成分，投影数据

# 优点：无监督，保留最多方差
# 缺点：线性变换，可能丢失非线性信息
```

### LDA（线性判别分析）

```python
# LDA 思路：
# 1. 最大化类间距离
# 2. 最小化类内距离
# 3. 找到最佳投影方向

# 与PCA区别：
# PCA：无监督，保留方差
# LDA：有监督，保留分类信息

# 优点：考虑类别信息
# 缺点：需要标签，最多降到C-1维（C为类别数）
```

### t-SNE

```python
# t-SNE（t-分布随机邻域嵌入）
# 用于可视化高维数据

# 思路：
# 1. 高维空间中，计算样本间的相似度
# 2. 低维空间中，保持相似的样本仍然相近
# 3. 优化低维表示

# 优点：可视化效果好
# 缺点：计算慢，结果不稳定，不能用于新数据
```

---

## 3 基础用法

### PCA 降维

```python
from sklearn.decomposition import PCA
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import numpy as np

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

print(f"原始数据形状：{X.shape}")  # (150, 4)

# 2. 特征缩放（PCA对尺度敏感）
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. 创建PCA模型
# n_components: 降维后的维度数
# 可以是整数（指定维度）或浮点数（保留方差比例）
pca = PCA(n_components=2)  # 降到2维

# 4. 拟合并转换
X_pca = pca.fit_transform(X_scaled)

print(f"降维后数据形状：{X_pca.shape}")  # (150, 2)

# 5. 查看解释方差比例
print(f"\n各主成分的方差解释比例：")
for i, ratio in enumerate(pca.explained_variance_ratio_):
    print(f"主成分{i+1}: {ratio:.2%}")
print(f"累计方差解释比例：{sum(pca.explained_variance_ratio_):.2%}")

# 6. 可视化
plt.figure(figsize=(10, 5))

# 2D可视化
plt.subplot(1, 2, 1)
scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='viridis', alpha=0.6)
plt.xlabel('First Principal Component')
plt.ylabel('Second Principal Component')
plt.title('PCA 2D Visualization')
plt.colorbar(scatter, label='Target')

# 选择最佳维度数
plt.subplot(1, 2, 2)
pca_full = PCA().fit(X_scaled)
plt.plot(range(1, 5), pca_full.explained_variance_ratio_, 'bo-')
plt.plot(range(1, 5), np.cumsum(pca_full.explained_variance_ratio_), 'ro-')
plt.xlabel('Number of Components')
plt.ylabel('Explained Variance Ratio')
plt.title('Variance Explained by Each Component')
plt.legend(['Individual', 'Cumulative'])
plt.grid(True)

plt.tight_layout()
plt.show()

# 7. 保留95%方差
pca_95 = PCA(n_components=0.95)
X_pca_95 = pca_95.fit_transform(X_scaled)
print(f"\n保留95%方差需要的维度数：{X_pca_95.shape[1]}")
```

### LDA 降维

```python
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# LDA 是有监督的降维方法

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. 创建LDA模型
# n_components: 降维后的维度数（最多C-1，C为类别数）
lda = LinearDiscriminantAnalysis(n_components=2)

# 4. 拟合并转换
X_lda = lda.fit_transform(X_scaled, y)  # 需要标签

print(f"原始数据形状：{X.shape}")
print(f"降维后数据形状：{X_lda.shape}")

# 5. 可视化
plt.figure(figsize=(8, 6))
scatter = plt.scatter(X_lda[:, 0], X_lda[:, 1], c=y, cmap='viridis', alpha=0.6)
plt.xlabel('First Linear Discriminant')
plt.ylabel('Second Linear Discriminant')
plt.title('LDA 2D Visualization')
plt.colorbar(scatter, label='Target')
plt.grid(True)
plt.show()

# 6. 查看分类效果
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression

# 使用LDA降维后的数据训练分类器
model = LogisticRegression(max_iter=200)
scores = cross_val_score(model, X_lda, y, cv=5)
print(f"\nLDA降维后分类准确率：{scores.mean():.2%}")
```

### t-SNE 可视化

```python
from sklearn.manifold import TSNE
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import numpy as np

# t-SNE 用于高维数据可视化

# 1. 加载数据（手写数字，64维）
digits = load_digits()
X = digits.data
y = digits.target

print(f"原始数据形状：{X.shape}")  # (1797, 64)

# 2. 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. 创建t-SNE模型
# n_components: 降维后的维度数（通常2或3）
# perplexity: 邻域大小
# learning_rate: 学习率
# n_iter: 迭代次数
tsne = TSNE(
    n_components=2,
    perplexity=30,
    learning_rate=200,
    n_iter=1000,
    random_state=42
)

# 4. 转换
X_tsne = tsne.fit_transform(X_scaled)

print(f"降维后数据形状：{X_tsne.shape}")  # (1797, 2)

# 5. 可视化
plt.figure(figsize=(10, 8))
scatter = plt.scatter(X_tsne[:, 0], X_tsne[:, 1], c=y, cmap='tab10', alpha=0.6)
plt.xlabel('t-SNE Dimension 1')
plt.ylabel('t-SNE Dimension 2')
plt.title('t-SNE Visualization of Digits Dataset')
plt.colorbar(scatter, label='Digit')
plt.grid(True)
plt.show()

# 6. 对比PCA
from sklearn.decomposition import PCA

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

plt.figure(figsize=(15, 5))

plt.subplot(1, 2, 1)
plt.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='tab10', alpha=0.6)
plt.title('PCA Visualization')
plt.xlabel('PC1')
plt.ylabel('PC2')

plt.subplot(1, 2, 2)
plt.scatter(X_tsne[:, 0], X_tsne[:, 1], c=y, cmap='tab10', alpha=0.6)
plt.title('t-SNE Visualization')
plt.xlabel('t-SNE1')
plt.ylabel('t-SNE2')

plt.tight_layout()
plt.show()
```

### 特征选择

```python
from sklearn.feature_selection import SelectKBest, f_classif, RFE
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import numpy as np

# 特征选择：选择重要特征，而不是构造新特征

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 方法1：单变量特征选择
# 选择与目标变量最相关的K个特征
selector = SelectKBest(score_func=f_classif, k=2)
X_selected = selector.fit_transform(X_scaled, y)

print("单变量特征选择：")
print(f"选择的特征索引：{selector.get_support(indices=True)}")
print(f"选择的特征名称：{[iris.feature_names[i] for i in selector.get_support(indices=True)]}")
print(f"F统计量：{selector.scores_}")
print(f"P值：{selector.pvalues_}")

# 方法2：递归特征消除（RFE）
# 逐步删除最不重要的特征
estimator = LogisticRegression(max_iter=200)
rfe = RFE(estimator, n_features_to_select=2)
rfe.fit(X_scaled, y)

print("\n递归特征消除：")
print(f"选择的特征索引：{rfe.get_support(indices=True)}")
print(f"选择的特征名称：{[iris.feature_names[i] for i in rfe.get_support(indices=True)]}")
print(f"特征排名：{rfe.ranking_}")

# 方法3：基于模型的特征重要性
from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_scaled, y)

print("\n随机森林特征重要性：")
for name, importance in zip(iris.feature_names, rf.feature_importances_):
    print(f"{name}: {importance:.4f}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 适用场景 |
| --- | --- | --- |
| PCA | 无监督，保留方差 | 通用降维 |
| LDA | 有监督，保留分类信息 | 分类任务 |
| t-SNE | 非线性降维 | 可视化 |
| 特征选择 | 选择重要特征 | 简化模型 |
| 解释方差 | 主成分保留的信息量 | 选择维度数 |
| 维度灾难 | 高维空间的问题 | 需要降维 |
| 累积方差 | 前K个主成分的总方差 | 确定K值 |

---

## 5 新手常见误区

### 误区 1："降维后性能一定下降"

**错！** 降维可以去掉噪声和冗余特征，有时性能反而提升。关键是保留重要信息。

### 误区 2："PCA 总是最好的降维方法"

不是的。PCA 是线性的，对非线性数据效果差。t-SNE 适合可视化，但不能用于新数据。需要根据场景选择。

### 误区 3："降维后特征没有意义"

不是的。PCA 的主成分是原始特征的线性组合，可以解释。但确实不如原始特征直观。

### 误区 4："不需要特征缩放"

**错！** PCA、LDA 对特征尺度敏感，必须做特征缩放。

### 误区 5："维度越少越好"

**错！** 维度太少会丢失重要信息。需要通过解释方差比例选择合适的维度数。

---

## 6 动手练习

### 练习 1：基础练习 - PCA

使用 PCA 对鸢尾花数据集进行降维和可视化。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.decomposition import PCA
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# PCA降维
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

# 可视化
plt.figure(figsize=(8, 6))
scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='viridis', alpha=0.6)
plt.xlabel('PC1')
plt.ylabel('PC2')
plt.title('PCA of Iris Dataset')
plt.colorbar(scatter)
plt.show()

print(f"解释方差比例：{pca.explained_variance_ratio_}")
print(f"累计解释方差：{sum(pca.explained_variance_ratio_):.2%}")
```

</details>

### 练习 2：进阶练习 - 选择维度数

使用累积方差曲线选择最佳维度数。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.decomposition import PCA
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import numpy as np

# 加载数据
digits = load_digits()
X = digits.data

# 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 计算不同维度数的解释方差
pca_full = PCA().fit(X_scaled)
cumulative_variance = np.cumsum(pca_full.explained_variance_ratio_)

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(range(1, len(cumulative_variance) + 1), cumulative_variance, 'bo-')
plt.axhline(y=0.95, color='r', linestyle='--', label='95% variance')
plt.xlabel('Number of Components')
plt.ylabel('Cumulative Explained Variance')
plt.title('Cumulative Explained Variance vs Number of Components')
plt.legend()
plt.grid(True)
plt.show()

# 找到保留95%方差需要的维度数
n_components_95 = np.argmax(cumulative_variance >= 0.95) + 1
print(f"保留95%方差需要的维度数：{n_components_95}")
```

</details>

### 练习 3（挑战）：综合练习 - 对比降维方法

对比 PCA、LDA、t-SNE 的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.manifold import TSNE
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 加载数据
digits = load_digits()
X = digits.data
y = digits.target

# 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 三种降维方法
methods = {
    'PCA': PCA(n_components=2),
    'LDA': LinearDiscriminantAnalysis(n_components=2),
    't-SNE': TSNE(n_components=2, random_state=42)
}

# 可视化
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

for i, (name, method) in enumerate(methods.items()):
    if name == 'LDA':
        X_reduced = method.fit_transform(X_scaled, y)
    else:
        X_reduced = method.fit_transform(X_scaled)
    
    axes[i].scatter(X_reduced[:, 0], X_reduced[:, 1], c=y, cmap='tab10', alpha=0.6)
    axes[i].set_title(f'{name}')
    axes[i].set_xlabel('Dimension 1')
    axes[i].set_ylabel('Dimension 2')

plt.tight_layout()
plt.show()
```

</details>

---

## 下一章预告

下一章我们会学习 **模型评估与调优** —— 如何评估模型性能，如何选择最佳参数。你会学到交叉验证、网格搜索、学习曲线等重要技术。
