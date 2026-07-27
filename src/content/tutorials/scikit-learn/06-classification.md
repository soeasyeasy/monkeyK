---
title: "第6章：监督学习：分类算法"
description: "逻辑回归、决策树、SVM、KNN、朴素贝叶斯分类实战"
---

# 第6章：监督学习：分类算法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 分类和回归有什么区别？
- 逻辑回归为什么叫"回归"但用于分类？
- 决策树是怎么做决策的？
- 这么多分类算法，该怎么选？

这一章会带你掌握常用分类算法的原理和实战，学会预测离散类别（如垃圾邮件、疾病诊断、图像识别）。

---

## 1 为什么需要分类算法？

### 痛点分析

很多实际问题是**判断类别**：

- 垃圾邮件检测：是垃圾邮件还是正常邮件？
- 疾病诊断：是良性还是恶性？
- 图像识别：是猫还是狗？
- 客户分类：是高价值客户还是普通客户？

这些问题不能用回归解决，因为答案是**离散的类别**，不是连续的数值。

### 解决方案

分类算法就是**学习特征和类别之间的映射关系**，然后预测新数据的类别。

打个比方：

> 分类就像**医生诊断**——根据症状（特征）判断疾病（类别），你看过很多病例，知道什么症状对应什么病。

---

## 2 逻辑回归

### 原理

逻辑回归虽然叫"回归"，但用于**二分类**。它用 Sigmoid 函数把线性输出变成概率：

$$P(y=1|x) = \frac{1}{1 + e^{-(w_0 + w_1x_1 + ... + w_nx_n)}}$$

- 输出范围：0 到 1
- 阈值：通常 0.5，大于 0.5 预测为 1，否则为 0

### 代码示例

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# 加载数据（二分类：只使用前两个类别）
iris = load_iris()
X = iris.data[iris.target != 2]  # 只取类别 0 和 1
y = iris.target[iris.target != 2]

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建模型
model = LogisticRegression(max_iter=200)

# 训练
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2%}")
print(f"\n分类报告:\n{classification_report(y_test, y_pred)}")

# 预测概率
proba = model.predict_proba(X_test)
print(f"\n预测概率（前 3 个样本）:\n{proba[:3]}")
```

### 多分类

```python
# 多分类（鸢尾花三分类）
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

model = LogisticRegression(max_iter=200, multi_class="multinomial")
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"多分类准确率: {accuracy_score(y_test, y_pred):.2%}")
```

---

## 3 决策树

### 原理

决策树通过**一系列问题**做决策：

```
花萼长度 > 5.5?
├── 是 → 花瓣长度 > 4.5?
│   ├── 是 → 类别 2 (virginica)
│   └── 否 → 类别 1 (versicolor)
└── 否 → 类别 0 (setosa)
```

### 代码示例

```python
from sklearn.tree import DecisionTreeClassifier, plot_tree
import matplotlib.pyplot as plt

# 创建模型
# max_depth 限制树深度，防止过拟合
model = DecisionTreeClassifier(max_depth=3, random_state=42)

# 训练
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)
print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")

# 可视化决策树
plt.figure(figsize=(12, 8))
plot_tree(model, feature_names=iris.feature_names, 
          class_names=iris.target_names, filled=True)
plt.title("决策树结构")
plt.show()

# 特征重要性
importances = model.feature_importances_
for name, importance in zip(iris.feature_names, importances):
    print(f"{name}: {importance:.2f}")
```

### 参数调优

```python
# 不同参数对模型的影响
models = {
    "无限制": DecisionTreeClassifier(random_state=42),
    "max_depth=3": DecisionTreeClassifier(max_depth=3, random_state=42),
    "min_samples_split=10": DecisionTreeClassifier(min_samples_split=10, random_state=42)
}

for name, model in models.items():
    model.fit(X_train, y_train)
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"{name}: 训练集 {train_score:.2%}, 测试集 {test_score:.2%}")
```

---

## 4 支持向量机（SVM）

### 原理

SVM 寻找**最大间隔超平面**，把不同类别分开。

打个比方：

> SVM 就像**在两类点之间画一条最宽的马路**，马路越宽，分类越稳健。

### 代码示例

```python
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# SVM 对特征尺度敏感，必须标准化
model = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", SVC(kernel="linear", C=1.0, random_state=42))
])

# 训练
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)
print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")

# 不同核函数
kernels = ["linear", "poly", "rbf", "sigmoid"]
for kernel in kernels:
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("svm", SVC(kernel=kernel, random_state=42))
    ])
    model.fit(X_train, y_train)
    score = model.score(X_test, y_test)
    print(f"核函数 {kernel}: 准确率 {score:.2%}")
```

### 参数说明

| 参数 | 说明 | 典型值 |
| --- | --- | --- |
| `kernel` | 核函数 | "linear", "rbf", "poly" |
| `C` | 正则化参数，越大越严格 | 0.1, 1, 10 |
| `gamma` | RBF 核的宽度 | "scale", "auto" |

---

## 5 K 近邻（KNN）

### 原理

KNN 根据**最近的 K 个样本**的多数类别做预测。

打个比方：

> KNN 就像**问邻居**——你的邻居大多是好人，你大概率也是好人。

### 代码示例

```python
from sklearn.neighbors import KNeighborsClassifier

# 创建模型
# n_neighbors: K 值
model = KNeighborsClassifier(n_neighbors=5)

# 训练（KNN 不需要训练，只是存储数据）
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)
print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")

# 不同 K 值的效果
for k in [1, 3, 5, 7, 9]:
    model = KNeighborsClassifier(n_neighbors=k)
    model.fit(X_train, y_train)
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"K={k}: 训练集 {train_score:.2%}, 测试集 {test_score:.2%}")
```

---

## 6 朴素贝叶斯

### 原理

基于**贝叶斯定理**，假设特征之间相互独立：

$$P(Y|X) = \frac{P(X|Y) \cdot P(Y)}{P(X)}$$

### 代码示例

```python
from sklearn.naive_bayes import GaussianNB

# 创建模型
model = GaussianNB()

# 训练
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)
print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")

# 预测概率
proba = model.predict_proba(X_test)
print(f"预测概率（前 3 个样本）:\n{proba[:3]}")
```

---

## 7 算法对比

```python
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

# 定义模型
models = {
    "逻辑回归": LogisticRegression(max_iter=200),
    "决策树": DecisionTreeClassifier(random_state=42),
    "SVM": SVC(kernel="linear", random_state=42),
    "KNN": KNeighborsClassifier(n_neighbors=5),
    "朴素贝叶斯": GaussianNB(),
    "随机森林": RandomForestClassifier(n_estimators=100, random_state=42)
}

# 标准化数据（SVM、KNN 需要）
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(iris.data)

# 对比
print("模型对比（交叉验证准确率）:")
for name, model in models.items():
    if name in ["SVM", "KNN"]:
        X_use = X_scaled
    else:
        X_use = iris.data
    
    scores = cross_val_score(model, X_use, iris.target, cv=5, scoring="accuracy")
    print(f"{name}: {scores.mean():.2%} (+/- {scores.std() * 2:.2%})")
```

### 对比表格

| 算法 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| 逻辑回归 | 简单、可解释 | 只能处理线性问题 | 二分类、基线模型 |
| 决策树 | 可解释、不需要标准化 | 容易过拟合 | 特征工程、规则提取 |
| SVM | 高维效果好 | 训练慢、参数敏感 | 文本分类、小样本 |
| KNN | 简单、不需要训练 | 预测慢、对尺度敏感 | 小数据、推荐系统 |
| 朴素贝叶斯 | 快、小数据效果好 | 假设特征独立 | 文本分类、垃圾邮件 |
| 随机森林 | 准确、抗过拟合 | 不可解释 | 通用分类任务 |

---

## 8 新手常见误区

### 误区 1："逻辑回归是回归算法"

**错！** 逻辑回归虽然名字里有"回归"，但用于**分类**。它用 Sigmoid 函数把回归输出变成概率。

### 误区 2："决策树不需要剪枝"

**错！** 决策树容易过拟合，需要：

- 限制深度（`max_depth`）
- 限制最小样本数（`min_samples_split`）
- 剪枝（后剪枝）

### 误区 3："SVM 不需要标准化"

**错！** SVM 基于距离计算，对特征尺度敏感，必须标准化。

### 误区 4："KNN 的 K 值越小越好"

**错！** K 值太小容易过拟合，太大容易欠拟合。通常用交叉验证选择 K 值。

### 误区 5："朴素贝叶斯假设太强，效果差"

不是的。虽然假设特征独立，但在实际中（尤其是文本分类）效果很好。

---

## 9 动手练习

### 练习 1：基础练习

用逻辑回归对鸢尾花数据集进行三分类，查看准确率和分类报告。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 创建并训练模型
model = LogisticRegression(max_iter=200)
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")
print(f"\n分类报告:\n{classification_report(y_test, y_pred, target_names=iris.target_names)}")
```

</details>

### 练习 2：进阶练习

对比决策树在不同 `max_depth`（2, 3, 5, 10, None）下的训练集和测试集准确率，分析过拟合现象。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 对比不同深度
print("max_depth | 训练集 | 测试集 | 差距")
print("-" * 40)
for depth in [2, 3, 5, 10, None]:
    model = DecisionTreeClassifier(max_depth=depth, random_state=42)
    model.fit(X_train, y_train)
    
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    gap = train_score - test_score
    
    print(f"{str(depth):9s} | {train_score:.2%} | {test_score:.2%} | {gap:.2%}")

print("\n结论: max_depth 越大，训练集准确率越高，但可能过拟合")
```

</details>

### 练习 3（挑战）：综合练习

用乳腺癌数据集，对比逻辑回归、决策树、SVM、KNN、随机森林的准确率，并用交叉验证评估。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target

# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 定义模型
models = {
    "逻辑回归": LogisticRegression(max_iter=1000),
    "决策树": DecisionTreeClassifier(random_state=42),
    "SVM": SVC(kernel="linear"),
    "KNN": KNeighborsClassifier(n_neighbors=5),
    "随机森林": RandomForestClassifier(n_estimators=100, random_state=42)
}

# 对比
print("模型对比（交叉验证准确率）:")
print("-" * 50)
for name, model in models.items():
    if name in ["SVM", "KNN"]:
        X_use = X_scaled
    else:
        X_use = X
    
    scores = cross_val_score(model, X_use, y, cv=5, scoring="accuracy")
    print(f"{name:10s}: {scores.mean():.2%} (+/- {scores.std() * 2:.2%})")
```

</details>

---

## 10 下一章预告

下一章我们会学习 **模型评估与验证**——交叉验证、混淆矩阵、ROC 曲线、AUC 等评估方法。你会学到如何科学地评估模型性能，而不仅仅看准确率。
