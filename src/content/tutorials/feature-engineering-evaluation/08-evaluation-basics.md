---
title: "第8章：模型评估基础"
description: "训练集测试集划分、评估流程、评估原则"
---

# 第8章：模型评估基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么要把数据分成训练集和测试集？
- 训练集、验证集、测试集有什么区别？
- 怎么划分数据才合理？
- 评估模型时有哪些常见陷阱？

这一章就是为了解答这些问题。模型评估是机器学习中 **最关键** 的环节——不会评估，就无法判断模型好不好。

---

## 1 为什么需要模型评估？

### 痛点分析

想象你是一个老师，出了一些题目给学生练习。如果考试时出的题目和练习题一模一样，学生考 100 分能说明他学会了吗？

显然不能。他可能只是 **记住了答案**，而不是真正理解了知识。

在机器学习中，模型在训练数据上表现好，不代表在新数据上也好。这就是 **过拟合**。我们需要用模型没见过的数据来评估它的真实能力。

> **一句话总结**：模型评估就是看模型在"没见过的题目"上表现如何，判断它是否真正学到了规律。

---

## 2 核心原理

### 数据集划分

```
全部数据
  │
  ├── 训练集（Training Set）── 用来训练模型
  │
  ├── 验证集（Validation Set）── 用来调参和选择模型
  │
  └── 测试集（Test Set）── 用来最终评估模型
```

| 数据集 | 用途 | 使用次数 | 比例建议 |
| --- | --- | --- | --- |
| 训练集 | 训练模型参数 | 多次 | 60%-80% |
| 验证集 | 调参、选择模型 | 多次 | 10%-20% |
| 测试集 | 最终评估 | 只用一次 | 10%-20% |

### 评估流程

```
1. 划分数据集（训练集 + 测试集）
      │
2. 在训练集上训练模型
      │
3. 用验证集调参（可选，或用交叉验证）
      │
4. 用测试集评估最终模型
      │
5. 报告评估指标
```

---

## 3 基础用法

### 训练集测试集划分

```python
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

print(f"总数据量: {X.shape[0]}")

# 方法 1：简单划分（70% 训练，30% 测试）
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)
print(f"训练集: {X_train.shape[0]}, 测试集: {X_test.shape[0]}")

# 方法 2：分层划分（保持类别比例）
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)
print(f"训练集类别分布: {np.bincount(y_train)}")
print(f"测试集类别分布: {np.bincount(y_test)}")

# 训练模型
model = LogisticRegression(max_iter=200, random_state=42)
model.fit(X_train, y_train)

# 评估
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\n测试集准确率: {accuracy:.4f}")
```

> **原理**：`stratify=y` 确保训练集和测试集中的类别比例与原始数据一致，避免类别不平衡导致的评估偏差。

### 训练集、验证集、测试集划分

```python
# 方法 1：两次 train_test_split
X_train_temp, X_test, y_train_temp, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_train_temp, y_train_temp, test_size=0.2, random_state=42, stratify=y_train_temp
)
print(f"训练集: {X_train.shape[0]}, 验证集: {X_val.shape[0]}, 测试集: {X_test.shape[0]}")

# 方法 2：使用 cross_val_score 代替验证集（更推荐）
from sklearn.model_selection import cross_val_score

model = LogisticRegression(max_iter=200, random_state=42)
scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(f"\n5 折交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

---

## 4 进阶用法

### 评估原则

| 原则 | 说明 |
| --- | --- |
| 数据泄漏 | 测试集信息不能泄露到训练过程 |
| 评估指标选择 | 根据业务需求选择合适的指标 |
| 多次评估 | 用交叉验证减少偶然性 |
| 基线模型 | 和简单模型对比，证明复杂模型的价值 |

### 数据泄漏的常见场景

```python
# ❌ 错误：在划分前做标准化（数据泄漏）
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)  # 用了测试集的信息
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)

# ✅ 正确：先划分，再标准化
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # 只用训练集 fit
X_test_scaled = scaler.transform(X_test)        # 测试集只 transform
```

```python
# ❌ 错误：特征选择用了全部数据
from sklearn.feature_selection import SelectKBest
selector = SelectKBest(k=10)
X_selected = selector.fit_transform(X, y)  # 用了测试集的标签
X_train, X_test = train_test_split(X_selected, test_size=0.2)

# ✅ 正确：特征选择在训练集上做
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
selector = SelectKBest(k=10)
X_train_selected = selector.fit_transform(X_train, y_train)
X_test_selected = selector.transform(X_test)
```

> **原理**：数据泄漏会让模型在测试集上表现虚高，但实际部署后效果很差。

### 使用 Pipeline 避免数据泄漏

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

# Pipeline 自动处理数据泄漏问题
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('feature_selection', SelectKBest(k=10)),
    ('classifier', LogisticRegression(max_iter=10000))
])

# 交叉验证时，每个 fold 都独立做标准化和特征选择
scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')
print(f"Pipeline 交叉验证准确率: {scores.mean():.4f}")
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 数据集划分 | 训练集、验证集、测试集 |
| 分层划分 | stratify=y 保持类别比例 |
| 数据泄漏 | 测试集信息不能泄露到训练过程 |
| Pipeline | 自动避免数据泄漏 |
| 交叉验证 | 比简单划分更可靠的评估方式 |

---

## 6 新手常见误区

### 误区 1："测试集准确率 100% 就是好模型"

**错！** 可能是数据泄漏，或者测试集太小、太简单。需要用交叉验证确认。

正确做法：用交叉验证评估，检查是否有数据泄漏。

### 误区 2："先做预处理再划分数据"

不对。预处理（如标准化、特征选择）如果用了全部数据，就会泄漏测试集信息。

正确做法：先划分数据，再在训练集上做预处理，测试集用训练集的参数 transform。

### 误区 3："只用一次 train_test_split 就够了"

不是的。一次划分可能有偶然性。用交叉验证可以更可靠地评估模型。

正确做法：用 `cross_val_score` 做 K 折交叉验证。

---

## 7 动手练习

### 练习 1：基础练习

对乳腺癌数据集做 80/20 划分，训练逻辑回归模型并评估。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

data = load_breast_cancer()
X, y = data.data, data.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = LogisticRegression(max_iter=10000)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print(f"准确率: {accuracy_score(y_test, y_pred):.4f}")
```

</details>

### 练习 2：进阶练习

使用 5 折交叉验证评估模型，并和简单划分的结果对比。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.model_selection import cross_val_score

# 5 折交叉验证
scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(f"交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
print(f"每折准确率: {scores}")
```

</details>

### 练习 3（挑战）：综合练习

使用 Pipeline 整合标准化、特征选择和分类，用交叉验证评估。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('feature_selection', SelectKBest(score_func=f_classif, k=15)),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')
print(f"Pipeline 交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

</details>

---

## 下一章预告

下一章我们会学习 **交叉验证技术**——包括 K 折交叉验证、分层交叉验证、留一法等更详细的评估方法。
