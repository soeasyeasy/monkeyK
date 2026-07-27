---
title: "第10章：分类模型评估指标"
description: "准确率、精确率、召回率、F1 分数、ROC 曲线、AUC"
---

# 第10章：分类模型评估指标

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 准确率为什么有时候不可靠？
- 精确率和召回率有什么区别？
- 什么时候该用 F1 分数？
- ROC 曲线和 AUC 是什么意思？

这一章就是为了解答这些问题。不同的评估指标适合不同的场景，选对指标才能正确评估模型。

---

## 1 为什么需要多种评估指标？

### 痛点分析

假设有一个疾病检测模型，1000 人中只有 10 人患病。模型预测所有人都健康，准确率是 99%。但这个模型有用吗？

显然没有。它漏掉了所有真正患病的人。

> **一句话总结**：准确率在类别不平衡时会失效，需要更细致的指标。

---

## 2 核心原理

### 混淆矩阵

|  | 预测正例 | 预测负例 |
| --- | --- | --- |
| 实际正例 | TP（真正例） | FN（假负例） |
| 实际负例 | FP（假正例） | TN（真负例） |

### 评估指标对比

| 指标 | 公式 | 含义 | 适用场景 |
| --- | --- | --- | --- |
| 准确率 | (TP+TN)/(TP+TN+FP+FN) | 预测正确的比例 | 类别平衡 |
| 精确率 | TP/(TP+FP) | 预测为正例中真正为正例的比例 | 误报代价高 |
| 召回率 | TP/(TP+FN) | 真正为正例中被预测出来的比例 | 漏报代价高 |
| F1 分数 | 2×精确率×召回率/(精确率+召回率) | 精确率和召回率的调和平均 | 需要平衡两者 |
| AUC | ROC 曲线下面积 | 模型区分正负例的能力 | 类别不平衡 |

---

## 3 基础用法

### 计算各种指标

```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
import numpy as np

# 真实标签和预测
y_true = np.array([1, 1, 1, 1, 1, 0, 0, 0, 0, 0])
y_pred = np.array([1, 1, 1, 0, 0, 0, 0, 0, 1, 0])

# 混淆矩阵
cm = confusion_matrix(y_true, y_pred)
print("混淆矩阵:")
print(cm)
print(f"  TP={cm[1,1]}, FN={cm[1,0]}")
print(f"  FP={cm[0,1]}, TN={cm[0,0]}")

# 各种指标
print(f"\n准确率: {accuracy_score(y_true, y_pred):.4f}")
print(f"精确率: {precision_score(y_true, y_pred):.4f}")
print(f"召回率: {recall_score(y_true, y_pred):.4f}")
print(f"F1 分数: {f1_score(y_true, y_pred):.4f}")

# 分类报告（包含所有指标）
print("\n分类报告:")
print(classification_report(y_true, y_pred))
```

> **原理**：精确率关注"预测为正例的有多少是对的"，召回率关注"真正为正例的有多少被找出来了"。

### 多分类评估

```python
from sklearn.metrics import classification_report

# 多分类
y_true_multi = [0, 0, 0, 1, 1, 1, 2, 2, 2]
y_pred_multi = [0, 0, 1, 1, 1, 2, 2, 2, 0]

print("多分类报告:")
print(classification_report(y_true_multi, y_pred_multi))

# 平均方式
print("\n不同平均方式:")
print(f"macro avg: 各类别指标的算术平均")
print(f"weighted avg: 按各类别样本数加权平均")
```

---

## 4 进阶用法

### ROC 曲线与 AUC

```python
from sklearn.metrics import roc_curve, roc_auc_score
import matplotlib.pyplot as plt
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# 加载数据
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.3, random_state=42
)

# 训练模型
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 预测概率
y_prob = model.predict_proba(X_test)[:, 1]

# 计算 ROC 曲线
fpr, tpr, thresholds = roc_curve(y_test, y_prob)
auc = roc_auc_score(y_test, y_prob)

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(fpr, tpr, label=f'ROC 曲线 (AUC = {auc:.4f})')
plt.plot([0, 1], [0, 1], 'k--', label='随机猜测')
plt.xlabel('假正例率 (FPR)')
plt.ylabel('真正例率 (TPR)')
plt.title('ROC 曲线')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

> **原理**：ROC 曲线展示不同阈值下 TPR 和 FPR 的关系。AUC 越大，模型区分正负例的能力越强。AUC=0.5 相当于随机猜测。

### Precision-Recall 曲线

```python
from sklearn.metrics import precision_recall_curve, average_precision_score

# 计算 PR 曲线
precision, recall, thresholds = precision_recall_curve(y_test, y_prob)
ap = average_precision_score(y_test, y_prob)

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(recall, precision, label=f'PR 曲线 (AP = {ap:.4f})')
plt.xlabel('召回率')
plt.ylabel('精确率')
plt.title('Precision-Recall 曲线')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

> **原理**：PR 曲线适合类别不平衡的场景。AP（Average Precision）是 PR 曲线下的面积。

### 选择最优阈值

```python
# 找到 Youden's J 统计量最大的阈值
j_scores = tpr - fpr
best_idx = np.argmax(j_scores)
best_threshold = thresholds[best_idx]
print(f"最优阈值: {best_threshold:.4f}")
print(f"对应 TPR: {tpr[best_idx]:.4f}, FPR: {fpr[best_idx]:.4f}")

# 用最优阈值预测
y_pred_best = (y_prob >= best_threshold).astype(int)
print(f"\n最优阈值下的分类报告:")
print(classification_report(y_test, y_pred_best))
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 混淆矩阵 | TP、TN、FP、FN |
| 准确率 | 类别平衡时可用 |
| 精确率 | 误报代价高时用 |
| 召回率 | 漏报代价高时用 |
| F1 分数 | 精确率和召回率的调和平均 |
| ROC/AUC | 模型区分能力，适合不平衡数据 |
| PR 曲线 | 类别不平衡时比 ROC 更敏感 |

---

## 6 新手常见误区

### 误区 1："准确率越高模型越好"

**错！** 类别不平衡时准确率会失效。比如 99% 的健康人，模型全预测健康就有 99% 准确率，但没用。

正确做法：根据场景选择合适的指标，如精确率、召回率、F1 或 AUC。

### 误区 2："精确率和召回率越高越好"

不对。精确率和召回率是此消彼长的关系。提高阈值，精确率升高但召回率下降；降低阈值则相反。

正确做法：根据业务需求权衡，用 F1 分数或 PR 曲线找到平衡点。

### 误区 3："AUC 高就万事大吉"

不是的。AUC 高只说明模型区分能力强，但不代表在特定阈值下表现好。还需要看具体业务场景下的精确率和召回率。

正确做法：AUC 用于模型选择，具体阈值需要根据业务需求确定。

---

## 7 动手练习

### 练习 1：基础练习

计算给定真实标签和预测标签的准确率、精确率、召回率、F1 分数。

<details>
<summary>点击查看答案</summary>

```python
y_true = [1, 1, 0, 0, 1, 0, 1, 1, 0, 0]
y_pred = [1, 0, 0, 0, 1, 1, 1, 1, 0, 0]

print(f"准确率: {accuracy_score(y_true, y_pred):.4f}")
print(f"精确率: {precision_score(y_true, y_pred):.4f}")
print(f"召回率: {recall_score(y_true, y_pred):.4f}")
print(f"F1 分数: {f1_score(y_true, y_pred):.4f}")
```

</details>

### 练习 2：进阶练习

绘制乳腺癌数据集的 ROC 曲线和 PR 曲线，计算 AUC 和 AP。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_curve, roc_auc_score, precision_recall_curve, average_precision_score

data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.3, random_state=42
)

model = GradientBoostingClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_prob = model.predict_proba(X_test)[:, 1]

# ROC
fpr, tpr, _ = roc_curve(y_test, y_prob)
auc = roc_auc_score(y_test, y_prob)

# PR
precision, recall, _ = precision_recall_curve(y_test, y_prob)
ap = average_precision_score(y_test, y_prob)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))
axes[0].plot(fpr, tpr, label=f'AUC = {auc:.4f}')
axes[0].plot([0, 1], [0, 1], 'k--')
axes[0].set_xlabel('FPR')
axes[0].set_ylabel('TPR')
axes[0].set_title('ROC 曲线')
axes[0].legend()

axes[1].plot(recall, precision, label=f'AP = {ap:.4f}')
axes[1].set_xlabel('Recall')
axes[1].set_ylabel('Precision')
axes[1].set_title('PR 曲线')
axes[1].legend()
plt.tight_layout()
plt.show()
```

</details>

### 练习 3（挑战）：综合练习

对比逻辑回归、随机森林、梯度提升三个模型在乳腺癌数据集上的 AUC 和 F1 分数。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import cross_val_predict
from sklearn.metrics import roc_auc_score, f1_score

models = {
    '逻辑回归': LogisticRegression(max_iter=10000),
    '随机森林': RandomForestClassifier(n_estimators=100, random_state=42),
    '梯度提升': GradientBoostingClassifier(n_estimators=100, random_state=42)
}

data = load_breast_cancer()
X, y = data.data, data.target

for name, model in models.items():
    y_prob = cross_val_predict(model, X, y, cv=5, method='predict_proba')[:, 1]
    y_pred = cross_val_predict(model, X, y, cv=5)
    auc = roc_auc_score(y, y_prob)
    f1 = f1_score(y, y_pred)
    print(f"{name}: AUC = {auc:.4f}, F1 = {f1:.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **回归模型评估指标**——MSE、RMSE、MAE、R² 分数等，全面评估回归模型的性能。
