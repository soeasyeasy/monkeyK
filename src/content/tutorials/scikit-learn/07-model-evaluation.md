---
title: "第7章：模型评估与验证"
description: "交叉验证、混淆矩阵、ROC 曲线、AUC、精确率-召回率曲线"
---

# 第7章：模型评估与验证

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 准确率 95% 就是好模型吗？
- 什么是混淆矩阵？怎么看？
- ROC 曲线和 AUC 是什么？
- 为什么要用交叉验证？

这一章会带你掌握科学评估模型的方法，学会用多种指标全面衡量模型性能。

---

## 1 为什么需要科学的评估方法？

### 痛点分析

很多新手只看**准确率**，但：

- 数据不平衡时，准确率会误导（99% 正常，1% 癌症，全猜正常也有 99% 准确率）
- 无法知道模型是"真懂"还是"猜对"
- 无法比较不同模型的优劣

这就像**只看考试总分**——不知道哪科强哪科弱。

### 解决方案

科学的评估方法包括：

- **混淆矩阵**：看清分类细节
- **精确率、召回率、F1**：多角度评估
- **ROC 曲线和 AUC**：评估概率输出
- **交叉验证**：稳健评估泛化能力

> **一句话总结**：准确率只是表象，科学评估才能看清模型真实性能。

---

## 2 混淆矩阵

### 概念解释

混淆矩阵展示**预测结果 vs 真实结果**的详细情况：

|  | 预测为正 | 预测为负 |
| --- | --- | --- |
| **真实为正** | TP（真正例） | FN（假负例） |
| **真实为负** | FP（假正例） | TN（真负例） |

- **TP**：预测对，确实是正例
- **FN**：预测错，实际是正例（漏报）
- **FP**：预测错，实际是负例（误报）
- **TN**：预测对，确实是负例

### 代码示例

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import matplotlib.pyplot as plt

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 训练模型
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 混淆矩阵
cm = confusion_matrix(y_test, y_pred)
print("混淆矩阵:")
print(cm)

# 可视化
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=data.target_names)
disp.plot(cmap="Blues")
plt.title("混淆矩阵")
plt.show()
```

---

## 3 精确率、召回率、F1

### 概念解释

- **精确率（Precision）**：预测为正的样本中，真正为正的比例
  $$Precision = \frac{TP}{TP + FP}$$

- **召回率（Recall）**：真正为正的样本中，被正确预测的比例
  $$Recall = \frac{TP}{TP + FN}$$

- **F1 分数**：精确率和召回率的调和平均
  $$F1 = 2 \times \frac{Precision \times Recall}{Precision + Recall}$$

打个比方：

> 精确率：**抓到的坏人中有多少是真坏人**
> 召回率：**所有坏人中被抓到的比例**

### 代码示例

```python
from sklearn.metrics import precision_score, recall_score, f1_score, classification_report

# 计算指标
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"精确率: {precision:.2%}")
print(f"召回率: {recall:.2%}")
print(f"F1 分数: {f1:.2%}")

# 分类报告（包含所有指标）
print(f"\n分类报告:\n{classification_report(y_test, y_pred, target_names=data.target_names)}")
```

### 选择建议

| 场景 | 重视指标 | 原因 |
| --- | --- | --- |
| 垃圾邮件检测 | 精确率 | 误报成本高（正常邮件被误判为垃圾） |
| 疾病诊断 | 召回率 | 漏报成本高（病人没被检测出来） |
| 通用场景 | F1 分数 | 平衡精确率和召回率 |

---

## 4 ROC 曲线与 AUC

### 概念解释

**ROC 曲线**：展示不同阈值下，真正例率（TPR）和假正例率（FPR）的关系

- **TPR**（真正例率）= Recall = TP / (TP + FN)
- **FPR**（假正例率）= FP / (FP + TN)

**AUC**（Area Under Curve）：ROC 曲线下的面积

- AUC = 0.5：随机猜测
- AUC = 1.0：完美分类
- AUC > 0.8：较好

### 代码示例

```python
from sklearn.metrics import roc_curve, roc_auc_score

# 预测概率
y_prob = model.predict_proba(X_test)[:, 1]  # 取正类的概率

# 计算 ROC 曲线
fpr, tpr, thresholds = roc_curve(y_test, y_prob)

# 计算 AUC
auc = roc_auc_score(y_test, y_prob)

# 可视化
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, label=f"ROC 曲线 (AUC = {auc:.2f})")
plt.plot([0, 1], [0, 1], "k--", label="随机猜测")
plt.xlabel("假正例率 (FPR)")
plt.ylabel("真正例率 (TPR)")
plt.title("ROC 曲线")
plt.legend()
plt.grid(alpha=0.3)
plt.show()
```

---

## 5 精确率-召回率曲线

### 概念解释

**PR 曲线**：展示不同阈值下，精确率和召回率的关系

- 适用于**数据不平衡**的场景
- AUC-PR 越大越好

### 代码示例

```python
from sklearn.metrics import precision_recall_curve, average_precision_score

# 计算 PR 曲线
precision, recall, thresholds = precision_recall_curve(y_test, y_prob)

# 计算平均精确率
ap = average_precision_score(y_test, y_prob)

# 可视化
plt.figure(figsize=(8, 6))
plt.plot(recall, precision, label=f"PR 曲线 (AP = {ap:.2f})")
plt.xlabel("召回率 (Recall)")
plt.ylabel("精确率 (Precision)")
plt.title("精确率-召回率曲线")
plt.legend()
plt.grid(alpha=0.3)
plt.show()
```

---

## 6 交叉验证

### 概念解释

**交叉验证**：把数据分成 K 份，轮流用 K-1 份训练，1 份测试，重复 K 次。

打个比方：

> 交叉验证就像**模拟考试**——考多次取平均，比单次考试更可靠。

### 代码示例

```python
from sklearn.model_selection import cross_val_score, cross_validate

# 5 折交叉验证
scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")

print(f"交叉验证准确率: {scores}")
print(f"平均准确率: {scores.mean():.2%}")
print(f"标准差: {scores.std():.2%}")

# 多指标交叉验证
scoring = ["accuracy", "precision", "recall", "f1"]
cv_results = cross_validate(model, X, y, cv=5, scoring=scoring)

print(f"\n多指标交叉验证:")
for metric in scoring:
    print(f"{metric}: {cv_results[f'test_{metric}'].mean():.2%} (+/- {cv_results[f'test_{metric}'].std() * 2:.2%})")
```

---

## 7 新手常见误区

### 误区 1："准确率越高越好"

**错！** 数据不平衡时，准确率会误导。应该看 F1 分数、AUC 等指标。

### 误区 2："不需要交叉验证"

**错！** 单次划分可能偶然，交叉验证能更稳健地评估模型泛化能力。

### 误区 3："精确率和召回率一样重要"

不是的。根据场景选择：

- 垃圾邮件检测：重视精确率
- 疾病诊断：重视召回率

### 误区 4："AUC = 0.9 就是好模型"

**错！** 还要看实际业务需求。AUC 高不代表在特定阈值下表现好。

### 误区 5："测试集评估一次就够了"

**错！** 应该用交叉验证，多次评估取平均，结果更可靠。

---

## 8 动手练习

### 练习 1：基础练习

用乳腺癌数据集训练逻辑回归模型，绘制混淆矩阵并计算精确率、召回率、F1。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
from sklearn.metrics import precision_score, recall_score, f1_score
import matplotlib.pyplot as plt

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 训练模型
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# 混淆矩阵
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=data.target_names)
disp.plot(cmap="Blues")
plt.title("混淆矩阵")
plt.show()

# 评估指标
print(f"精确率: {precision_score(y_test, y_pred):.2%}")
print(f"召回率: {recall_score(y_test, y_pred):.2%}")
print(f"F1 分数: {f1_score(y_test, y_pred):.2%}")
```

</details>

### 练习 2：进阶练习

绘制 SVM 模型的 ROC 曲线，计算 AUC 值。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_curve, roc_auc_score
import matplotlib.pyplot as plt

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# 标准化
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 训练模型
model = SVC(kernel="linear", probability=True, random_state=42)
model.fit(X_train_scaled, y_train)

# 预测概率
y_prob = model.predict_proba(X_test_scaled)[:, 1]

# ROC 曲线
fpr, tpr, _ = roc_curve(y_test, y_prob)
auc = roc_auc_score(y_test, y_prob)

plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, label=f"ROC 曲线 (AUC = {auc:.2f})")
plt.plot([0, 1], [0, 1], "k--")
plt.xlabel("假正例率")
plt.ylabel("真正例率")
plt.title("ROC 曲线")
plt.legend()
plt.show()
```

</details>

### 练习 3（挑战）：综合练习

用 5 折交叉验证对比逻辑回归、决策树、随机森林的准确率、精确率、召回率、F1。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import cross_validate
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target

# 定义模型
models = {
    "逻辑回归": LogisticRegression(max_iter=1000),
    "决策树": DecisionTreeClassifier(random_state=42),
    "随机森林": RandomForestClassifier(n_estimators=100, random_state=42)
}

# 多指标交叉验证
scoring = ["accuracy", "precision", "recall", "f1"]

print("模型对比（5 折交叉验证）:")
print("-" * 60)
for name, model in models.items():
    cv_results = cross_validate(model, X, y, cv=5, scoring=scoring)
    
    print(f"\n{name}:")
    for metric in scoring:
        mean = cv_results[f"test_{metric}"].mean()
        std = cv_results[f"test_{metric}"].std()
        print(f"  {metric:10s}: {mean:.2%} (+/- {std * 2:.2%})")
```

</details>

---

## 9 下一章预告

下一章我们会学习 **无监督学习：聚类算法**——K-Means、DBSCAN、层次聚类。你会学到如何在没有标签的情况下，自动发现数据中的群体。
