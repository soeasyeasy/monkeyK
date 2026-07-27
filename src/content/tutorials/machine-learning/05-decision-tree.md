---
title: "第5章：决策树"
description: "信息增益、基尼系数、剪枝策略、CART 算法"
---

# 第5章：决策树

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 决策树是怎么做决策的？
- 什么是信息增益？为什么要最大化信息增益？
- 基尼系数和信息增益有什么区别？
- 如何防止决策树过拟合？

这一章就是为了解答这些问题。决策树直观易懂，可以可视化，是理解机器学习的好起点。

---

## 1 为什么需要决策树？

### 痛点分析

假设你要判断是否去打网球。考虑因素：

```
天气：晴、阴、雨
温度：高、中、低
湿度：高、正常
风力：强、弱
```

问题：如何根据这些因素做出决策？

传统方法：
- 写一堆 if-else 规则？规则太多，难以维护
- 凭经验判断？主观，不一致

### 解决方案

决策树自动学习决策规则：

```
天气=晴？
├── 是 → 湿度=高？
│       ├── 是 → 不去
│       └── 否 → 去
└── 否 → 天气=雨？
        ├── 是 → 风力=强？
        │       ├── 是 → 不去
        │       └── 否 → 去
        └── 否 → 去
```

打个比方：

> 决策树像"二十个问题"游戏：通过一系列是/否问题，逐步缩小范围，最终得出结论。

> **一句话总结**：决策树通过一系列判断规则进行分类，直观易懂。

---

## 2 核心原理

### 决策树结构

```
根节点（第一个判断）
├── 分支1 → 内部节点（第二个判断）
│           ├── 分支1 → 叶节点（结论）
│           └── 分支2 → 叶节点（结论）
└── 分支2 → 内部节点
            ├── ...
            └── ...
```

### 信息增益（ID3算法）

信息增益衡量某个特征对分类的贡献：

```python
# 信息熵：衡量数据的混乱程度
Entropy(S) = -Σ(p_i * log2(p_i))

# p_i: 第i类样本的比例
# 熵越大，数据越混乱

# 信息增益：划分前后熵的减少
Gain(S, A) = Entropy(S) - Σ(|S_v|/|S| * Entropy(S_v))

# S: 原始数据集
# A: 特征
# S_v: 特征A取值为v的子集
# 信息增益越大，特征A越重要
```

打个比方：

> 信息增益像"整理房间"：整理前很乱（熵大），整理后有序（熵小）。整理带来的秩序提升就是信息增益。

### 基尼系数（CART算法）

```python
# 基尼系数：衡量数据的不纯度
Gini(S) = 1 - Σ(p_i^2)

# p_i: 第i类样本的比例
# 基尼系数越小，纯度越高

# 基尼增益：划分前后基尼的减少
GiniGain(S, A) = Gini(S) - Σ(|S_v|/|S| * Gini(S_v))
```

### 剪枝策略

防止过拟合的方法：

- **预剪枝**：训练过程中提前停止
  - 限制最大深度
  - 限制最小样本数
  - 限制信息增益阈值

- **后剪枝**：训练完成后剪枝
  - 自底向上剪枝
  - 用验证集评估是否剪枝

---

## 3 基础用法

### 使用 sklearn 实现决策树

```python
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import numpy as np

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

print("数据形状：")
print(f"X: {X.shape}")  # (150, 4)
print(f"y: {y.shape}")  # (150,)
print(f"类别: {iris.target_names}")

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 3. 创建模型
# criterion: 划分标准，'gini'（默认）或'entropy'
# max_depth: 最大深度，防止过拟合
# min_samples_split: 内部节点再划分所需最小样本数
# min_samples_leaf: 叶节点最小样本数
model = DecisionTreeClassifier(
    criterion='gini',        # 使用基尼系数
    max_depth=3,             # 最大深度3
    min_samples_split=5,     # 至少5个样本才继续划分
    min_samples_leaf=2,      # 叶节点至少2个样本
    random_state=42
)

# 4. 训练模型
model.fit(X_train, y_train)

# 5. 预测
y_pred = model.predict(X_test)

# 6. 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"\n准确率: {accuracy:.2%}")
print("\n分类报告：")
print(classification_report(y_test, y_pred, target_names=iris.target_names))

# 7. 查看特征重要性
print(f"\n特征重要性：")
for i, importance in enumerate(model.feature_importances_):
    print(f"{iris.feature_names[i]}: {importance:.4f}")

# 8. 可视化决策树（需要graphviz）
from sklearn.tree import export_text
tree_rules = export_text(model, feature_names=iris.feature_names)
print(f"\n决策树规则：\n{tree_rules}")
```

### 手动实现简单决策树

```python
import numpy as np
from collections import Counter

# 简单决策树实现（ID3算法）

# 1. 计算信息熵
def entropy(labels):
    # 统计各类别数量
    label_counts = Counter(labels)
    total = len(labels)
    
    # 计算熵
    ent = 0
    for count in label_counts.values():
        p = count / total
        if p > 0:
            ent -= p * np.log2(p)
    return ent

# 2. 计算信息增益
def info_gain(dataset, feature_index, labels):
    # 原始熵
    total_entropy = entropy(labels)
    
    # 按特征值划分
    feature_values = [sample[feature_index] for sample in dataset]
    unique_values = set(feature_values)
    
    # 加权熵
    weighted_entropy = 0
    total_samples = len(dataset)
    
    for value in unique_values:
        # 找出特征值为value的样本
        sub_dataset = [dataset[i] for i in range(total_samples) 
                       if feature_values[i] == value]
        sub_labels = [labels[i] for i in range(total_samples) 
                      if feature_values[i] == value]
        
        # 计算权重和熵
        weight = len(sub_dataset) / total_samples
        weighted_entropy += weight * entropy(sub_labels)
    
    # 信息增益
    gain = total_entropy - weighted_entropy
    return gain

# 3. 示例数据
# 天气：0=晴，1=阴，2=雨
# 温度：0=高，1=中，2=低
# 湿度：0=高，1=正常
# 风力：0=强，1=弱
# 标签：0=不去，1=去
dataset = [
    [0, 0, 0, 0, 0],  # 晴，高，高，强 → 不去
    [0, 0, 0, 1, 0],  # 晴，高，高，弱 → 不去
    [1, 0, 0, 0, 1],  # 阴，高，高，强 → 去
    [2, 1, 0, 0, 1],  # 雨，中，高，强 → 去
    [2, 2, 1, 0, 1],  # 雨，低，正常，强 → 去
    [2, 2, 1, 1, 0],  # 雨，低，正常，弱 → 不去
    [1, 2, 1, 1, 1],  # 阴，低，正常，弱 → 去
    [0, 1, 0, 0, 0],  # 晴，中，高，强 → 不去
    [0, 2, 1, 0, 1],  # 晴，低，正常，强 → 去
    [2, 1, 1, 0, 1],  # 雨，中，正常，强 → 去
    [0, 1, 1, 1, 1],  # 晴，中，正常，弱 → 去
    [1, 1, 0, 1, 1],  # 阴，中，高，弱 → 去
    [1, 0, 1, 0, 1],  # 阴，高，正常，强 → 去
    [2, 1, 0, 1, 0],  # 雨，中，高，弱 → 不去
]

# 分离特征和标签
X = [sample[:-1] for sample in dataset]
y = [sample[-1] for sample in dataset]

# 4. 计算每个特征的信息增益
feature_names = ['天气', '温度', '湿度', '风力']
print("各特征的信息增益：")
for i, name in enumerate(feature_names):
    gain = info_gain(X, i, y)
    print(f"{name}: {gain:.4f}")

# 5. 选择最佳特征（信息增益最大）
best_feature = 0
best_gain = 0
for i in range(len(feature_names)):
    gain = info_gain(X, i, y)
    if gain > best_gain:
        best_gain = gain
        best_feature = i

print(f"\n最佳划分特征：{feature_names[best_feature]}，信息增益：{best_gain:.4f}")
```

### 决策树回归

```python
from sklearn.tree import DecisionTreeRegressor
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# 决策树也可以用于回归任务

# 1. 生成回归数据
X, y = make_regression(
    n_samples=1000,
    n_features=10,
    noise=0.1,
    random_state=42
)

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. 创建模型
model = DecisionTreeRegressor(
    max_depth=5,
    min_samples_split=10,
    random_state=42
)

# 4. 训练
model.fit(X_train, y_train)

# 5. 预测
y_pred = model.predict(X_test)

# 6. 评估
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print(f"均方误差 MSE: {mse:.2f}")
print(f"均方根误差 RMSE: {rmse:.2f}")
print(f"R²分数: {r2:.4f}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 算法 |
| --- | --- | --- |
| 信息熵 | 衡量数据混乱程度 | ID3 |
| 信息增益 | 划分前后熵的减少 | ID3 |
| 基尼系数 | 衡量数据不纯度 | CART |
| 增益率 | 修正信息增益 | C4.5 |
| 预剪枝 | 训练时提前停止 | 所有 |
| 后剪枝 | 训练后剪枝 | 所有 |
| 特征重要性 | 特征对分类的贡献 | 所有 |

---

## 5 新手常见误区

### 误区 1："决策树不需要特征缩放"

**对！** 决策树基于特征值划分，不受尺度影响。这是决策树的优势之一。

### 误区 2："决策树越深越好"

**错！** 树太深会过拟合，记住训练数据的噪声。应该通过剪枝控制复杂度。

### 误区 3："决策树只能处理数值特征"

不是的。决策树可以处理类别特征，但 sklearn 的实现要求输入数值。需要先将类别特征编码。

### 误区 4："决策树很稳定"

**错！** 决策树对数据变化敏感，稍微改变训练数据可能导致完全不同的树。这也是为什么需要集成学习（如随机森林）。

### 误区 5："信息增益大的特征一定好"

不是的。信息增益偏向取值多的特征。增益率可以修正这个问题，CART使用基尼系数也有类似效果。

---

## 6 动手练习

### 练习 1：基础练习 - 分类

使用决策树对乳腺癌数据集进行分类。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 加载数据
data = load_breast_cancer()
X = data.data
y = data.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建并训练模型
model = DecisionTreeClassifier(max_depth=5, random_state=42)
model.fit(X_train, y_train)

# 预测和评估
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2%}")

# 特征重要性
print("\n前5个重要特征：")
indices = model.feature_importances_.argsort()[::-1][:5]
for i in indices:
    print(f"{data.feature_names[i]}: {model.feature_importances_[i]:.4f}")
```

</details>

### 练习 2：进阶练习 - 剪枝对比

比较不同深度决策树的性能。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import make_classification
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import matplotlib.pyplot as plt

# 生成数据
X, y = make_classification(n_samples=1000, n_features=20, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 不同深度的表现
depths = range(1, 21)
train_scores = []
test_scores = []

for depth in depths:
    model = DecisionTreeClassifier(max_depth=depth, random_state=42)
    model.fit(X_train, y_train)
    
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    train_scores.append(accuracy_score(y_train, train_pred))
    test_scores.append(accuracy_score(y_test, test_pred))

# 打印结果
print("深度\t训练集\t测试集")
for i, depth in enumerate(depths):
    if depth % 5 == 0 or depth == 1:
        print(f"{depth}\t{train_scores[i]:.3f}\t{test_scores[i]:.3f}")

print("\n观察：训练集准确率随深度增加，测试集可能过拟合")
```

</details>

### 练习 3（挑战）：综合练习 - 手动实现

手动实现一个简单的决策树分类器。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
from collections import Counter

class SimpleDecisionTree:
    def __init__(self, max_depth=3):
        self.max_depth = max_depth
        self.tree = None
    
    def fit(self, X, y):
        self.tree = self._build_tree(X, y, depth=0)
    
    def _build_tree(self, X, y, depth):
        # 停止条件
        n_samples = len(y)
        n_labels = len(np.unique(y))
        
        if depth >= self.max_depth or n_labels == 1 or n_samples < 2:
            leaf_value = Counter(y).most_common(1)[0][0]
            return {'value': leaf_value}
        
        # 选择最佳特征
        best_feature = self._best_split(X, y)
        
        # 划分数据
        left_indices = X[:, best_feature] <= np.median(X[:, best_feature])
        right_indices = ~left_indices
        
        # 递归构建
        left_tree = self._build_tree(X[left_indices], y[left_indices], depth + 1)
        right_tree = self._build_tree(X[right_indices], y[right_indices], depth + 1)
        
        return {
            'feature': best_feature,
            'threshold': np.median(X[:, best_feature]),
            'left': left_tree,
            'right': right_tree
        }
    
    def _best_split(self, X, y):
        # 简单实现：选择信息增益最大的特征
        best_gain = -1
        best_feature = 0
        
        for feature in range(X.shape[1]):
            # 计算信息增益（简化版）
            threshold = np.median(X[:, feature])
            left_y = y[X[:, feature] <= threshold]
            right_y = y[X[:, feature] > threshold]
            
            if len(left_y) == 0 or len(right_y) == 0:
                continue
            
            gain = self._information_gain(y, left_y, right_y)
            
            if gain > best_gain:
                best_gain = gain
                best_feature = feature
        
        return best_feature
    
    def _information_gain(self, y, left_y, right_y):
        parent_entropy = self._entropy(y)
        left_weight = len(left_y) / len(y)
        right_weight = len(right_y) / len(y)
        child_entropy = left_weight * self._entropy(left_y) + right_weight * self._entropy(right_y)
        return parent_entropy - child_entropy
    
    def _entropy(self, y):
        counts = np.bincount(y)
        probs = counts / len(y)
        return -sum(p * np.log2(p) for p in probs if p > 0)
    
    def predict(self, X):
        return np.array([self._predict_sample(x, self.tree) for x in X])
    
    def _predict_sample(self, x, tree):
        if 'value' in tree:
            return tree['value']
        
        if x[tree['feature']] <= tree['threshold']:
            return self._predict_sample(x, tree['left'])
        else:
            return self._predict_sample(x, tree['right'])

# 测试
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

iris = load_iris()
X = iris.data
y = iris.target

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

model = SimpleDecisionTree(max_depth=3)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")
```

</details>

---

## 下一章预告

下一章我们会学习 **K近邻算法（KNN）** —— 一种基于实例的学习算法。你会学到如何计算距离，K值如何选择，以及KNN的优缺点。
