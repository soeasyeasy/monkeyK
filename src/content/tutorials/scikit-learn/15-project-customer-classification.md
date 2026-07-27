---
title: "第15章：实战项目：客户分类与推荐"
description: "完整分类项目：数据预处理、多模型对比、集成学习、模型部署"
---

# 第15章：实战项目：客户分类与推荐

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 分类项目的完整流程是什么？
- 如何处理类别不平衡问题？
- 怎么选择最佳分类算法？
- 如何把模型应用到实际业务中？

这一章会带你完成一个完整的客户分类项目，学会处理真实业务场景中的分类任务。

---

## 1 项目概述

### 项目目标

构建客户分类系统，根据客户特征（年龄、收入、消费习惯等）将客户分为不同群体，为精准营销提供依据。

### 项目流程

1. **数据加载与探索**：了解客户数据
2. **数据预处理**：处理缺失值、类别不平衡
3. **特征工程**：特征选择与构造
4. **模型训练**：多算法对比
5. **模型评估**：混淆矩阵、ROC 曲线
6. **模型优化**：集成学习、超参数调优
7. **业务应用**：客户分群、推荐策略

---

## 2 数据加载与探索

### 生成模拟数据

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# 模拟客户数据
np.random.seed(42)
n_samples = 2000

# 生成特征
data = {
    "年龄": np.random.randint(18, 70, n_samples),
    "年收入（万元）": np.random.uniform(5, 100, n_samples),
    "消费频次（次/月）": np.random.randint(0, 20, n_samples),
    "平均消费金额（元）": np.random.uniform(50, 5000, n_samples),
    "会员年限": np.random.randint(0, 10, n_samples),
    "投诉次数": np.random.randint(0, 5, n_samples),
    "客户类别": None  # 目标变量
}

df = pd.DataFrame(data)

# 生成客户类别（基于规则 + 噪声）
# 0: 普通客户, 1: 高价值客户, 2: 流失风险客户
def assign_category(row):
    score = 0
    score += row["年收入（万元）"] * 0.3
    score += row["消费频次（次/月）"] * 2
    score += row["平均消费金额（元）"] * 0.01
    score += row["会员年限"] * 1
    score -= row["投诉次数"] * 3
    
    if score > 40:
        return 1  # 高价值客户
    elif score < 15 or row["投诉次数"] >= 3:
        return 2  # 流失风险客户
    else:
        return 0  # 普通客户

df["客户类别"] = df.apply(assign_category, axis=1)

# 添加一些噪声
noise_idx = np.random.choice(n_samples, 100, replace=False)
df.loc[noise_idx, "客户类别"] = np.random.choice([0, 1, 2], 100)

print("数据形状:", df.shape)
print("\n前 5 行:")
print(df.head())

print("\n客户类别分布:")
print(df["客户类别"].value_counts())
print("\n类别比例:")
print(df["客户类别"].value_counts(normalize=True))
```

### 数据探索

```python
# 1. 类别分布可视化
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
df["客户类别"].value_counts().plot(kind="bar")
plt.xlabel("客户类别")
plt.ylabel("数量")
plt.title("客户类别分布")
plt.xticks([0, 1, 2], ["普通客户", "高价值客户", "流失风险"])

plt.subplot(1, 2, 2)
df["客户类别"].value_counts(normalize=True).plot(kind="pie", autopct="%1.1f%%")
plt.ylabel("")
plt.title("客户类别比例")

plt.tight_layout()
plt.show()

# 2. 特征分布
plt.figure(figsize=(15, 10))
for i, col in enumerate(["年龄", "年收入（万元）", "消费频次（次/月）", "平均消费金额（元）"], 1):
    plt.subplot(2, 2, i)
    for cat in [0, 1, 2]:
        plt.hist(df[df["客户类别"] == cat][col], bins=30, alpha=0.5, label=f"类别{cat}")
    plt.xlabel(col)
    plt.ylabel("频数")
    plt.title(f"{col} 按类别分布")
    plt.legend()

plt.tight_layout()
plt.show()

# 3. 相关性分析
plt.figure(figsize=(10, 8))
correlation = df.corr()
sns.heatmap(correlation, annot=True, cmap="coolwarm", fmt=".2f", center=0)
plt.title("特征相关性矩阵")
plt.tight_layout()
plt.show()
```

---

## 3 数据预处理

### 处理类别不平衡

```python
from sklearn.utils import resample

# 查看类别分布
print("原始类别分布:")
print(df["客户类别"].value_counts())

# 方法 1：过采样少数类
df_majority = df[df["客户类别"] == 0]
df_minority1 = df[df["客户类别"] == 1]
df_minority2 = df[df["客户类别"] == 2]

# 过采样
df_minority1_upsampled = resample(df_minority1,
                                   replace=True,
                                   n_samples=len(df_majority),
                                   random_state=42)

df_minority2_upsampled = resample(df_minority2,
                                   replace=True,
                                   n_samples=len(df_majority),
                                   random_state=42)

# 合并
df_balanced = pd.concat([df_majority, df_minority1_upsampled, df_minority2_upsampled])

print("\n平衡后类别分布:")
print(df_balanced["客户类别"].value_counts())

# 方法 2：使用类别权重（在模型中设置 class_weight="balanced"）
```

### 特征缩放

```python
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# 分离特征和目标
X = df_balanced.drop("客户类别", axis=1)
y = df_balanced["客户类别"]

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 标准化
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"训练集大小: {X_train.shape[0]}")
print(f"测试集大小: {X_test.shape[0]}")
```

---

## 4 模型训练与对比

### 多算法对比

```python
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# 定义模型
models = {
    "逻辑回归": LogisticRegression(max_iter=1000, class_weight="balanced"),
    "决策树": DecisionTreeClassifier(class_weight="balanced", random_state=42),
    "随机森林": RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42),
    "梯度提升": GradientBoostingClassifier(n_estimators=100, random_state=42),
    "SVM": SVC(class_weight="balanced", random_state=42),
    "KNN": KNeighborsClassifier(n_neighbors=5)
}

# 训练并评估
results = {}

for name, model in models.items():
    # 训练
    if name in ["SVM", "KNN"]:
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
    else:
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
    
    # 评估
    accuracy = accuracy_score(y_test, y_pred)
    results[name] = {
        "accuracy": accuracy,
        "y_pred": y_pred
    }
    
    print(f"\n{name}:")
    print(f"  准确率: {accuracy:.2%}")
    print(f"  分类报告:")
    print(classification_report(y_test, y_pred, target_names=["普通", "高价值", "流失风险"]))
```

### 可视化对比

```python
# 准确率对比
plt.figure(figsize=(10, 6))
names = list(results.keys())
accuracies = [results[name]["accuracy"] for name in names]

plt.barh(names, accuracies)
plt.xlabel("准确率")
plt.title("模型准确率对比")
plt.xlim(0, 1)

for i, v in enumerate(accuracies):
    plt.text(v + 0.01, i, f"{v:.2%}", va="center")

plt.tight_layout()
plt.show()
```

---

## 5 模型评估

### 混淆矩阵

```python
from sklearn.metrics import ConfusionMatrixDisplay

# 选择最佳模型
best_model_name = max(results, key=lambda x: results[x]["accuracy"])
best_y_pred = results[best_model_name]["y_pred"]

# 绘制混淆矩阵
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 1. 混淆矩阵
cm = confusion_matrix(y_test, best_y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["普通", "高价值", "流失风险"])
disp.plot(cmap="Blues", ax=axes[0])
axes[0].set_title(f"{best_model_name} - 混淆矩阵")

# 2. 归一化混淆矩阵
cm_norm = confusion_matrix(y_test, best_y_pred, normalize="true")
disp_norm = ConfusionMatrixDisplay(confusion_matrix=cm_norm, display_labels=["普通", "高价值", "流失风险"])
disp_norm.plot(cmap="Blues", ax=axes[1])
axes[1].set_title("归一化混淆矩阵")

plt.tight_layout()
plt.show()
```

### ROC 曲线（多分类）

```python
from sklearn.preprocessing import label_binarize
from sklearn.metrics import roc_curve, auc

# 二值化标签
y_test_bin = label_binarize(y_test, classes=[0, 1, 2])

# 选择最佳模型（随机森林）
best_model = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)
best_model.fit(X_train, y_train)

# 预测概率
y_score = best_model.predict_proba(X_test)

# 计算 ROC 曲线
fpr = dict()
tpr = dict()
roc_auc = dict()

for i in range(3):
    fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_score[:, i])
    roc_auc[i] = auc(fpr[i], tpr[i])

# 可视化
plt.figure(figsize=(8, 6))
colors = ["blue", "red", "green"]
class_names = ["普通客户", "高价值客户", "流失风险"]

for i, color, name in zip(range(3), colors, class_names):
    plt.plot(fpr[i], tpr[i], color=color, lw=2,
             label=f"{name} (AUC = {roc_auc[i]:.2f})")

plt.plot([0, 1], [0, 1], "k--", lw=2)
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel("假正例率")
plt.ylabel("真正例率")
plt.title("多分类 ROC 曲线")
plt.legend(loc="lower right")
plt.grid(alpha=0.3)
plt.show()
```

---

## 6 模型优化

### 集成学习

```python
from sklearn.ensemble import VotingClassifier, StackingClassifier

# 定义基模型
base_models = [
    ("rf", RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)),
    ("gb", GradientBoostingClassifier(n_estimators=100, random_state=42)),
    ("lr", LogisticRegression(max_iter=1000, class_weight="balanced"))
]

# Voting
voting = VotingClassifier(estimators=base_models, voting="soft")
voting.fit(X_train, y_train)
y_pred_voting = voting.predict(X_test)
print(f"Voting 准确率: {accuracy_score(y_test, y_pred_voting):.2%}")

# Stacking
stacking = StackingClassifier(
    estimators=base_models,
    final_estimator=LogisticRegression(max_iter=1000),
    cv=5
)
stacking.fit(X_train, y_train)
y_pred_stacking = stacking.predict(X_test)
print(f"Stacking 准确率: {accuracy_score(y_test, y_pred_stacking):.2%}")
```

### 超参数调优

```python
from sklearn.model_selection import GridSearchCV

# 参数网格
param_grid = {
    "n_estimators": [100, 200],
    "max_depth": [None, 10, 20],
    "min_samples_split": [2, 5],
    "class_weight": ["balanced"]
}

# 网格搜索
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)

grid_search.fit(X_train, y_train)

print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳准确率: {grid_search.best_score_:.2%}")
```

---

## 7 业务应用

### 客户分群分析

```python
# 使用最佳模型预测所有客户
best_model = grid_search.best_estimator_
all_predictions = best_model.predict(X)

# 添加到数据框
df_balanced["预测类别"] = all_predictions

# 分析各群体特征
print("各客户群体特征均值:")
print(df_balanced.groupby("预测类别")[["年龄", "年收入（万元）", "消费频次（次/月）", "平均消费金额（元）"]].mean())

# 可视化
plt.figure(figsize=(12, 4))

for i, feature in enumerate(["年收入（万元）", "消费频次（次/月）", "平均消费金额（元）"], 1):
    plt.subplot(1, 3, i)
    for cat in [0, 1, 2]:
        plt.hist(df_balanced[df_balanced["预测类别"] == cat][feature], 
                 bins=30, alpha=0.5, label=f"类别{cat}")
    plt.xlabel(feature)
    plt.ylabel("频数")
    plt.title(f"{feature} 按群体分布")
    plt.legend()

plt.tight_layout()
plt.show()
```

### 推荐策略

```python
# 根据客户类别制定营销策略
strategies = {
    0: "普通客户": "提升消费频次，推送优惠券，引导升级",
    1: "高价值客户": "VIP 服务，专属优惠，提高忠诚度",
    2: "流失风险客户": "主动关怀，解决问题，挽回措施"
}

# 统计各群体数量
print("客户分群统计:")
for cat, name, strategy in strategies.items():
    count = len(df_balanced[df_balanced["预测类别"] == cat])
    print(f"\n{name}（{count}人）:")
    print(f"  策略: {strategy}")
```

---

## 8 模型部署

### 保存模型

```python
import joblib

# 保存模型和预处理器
joblib.dump(best_model, "customer_classifier.pkl")
joblib.dump(scaler, "customer_scaler.pkl")

print("模型已保存")
```

### 预测新客户

```python
# 加载模型
loaded_model = joblib.load("customer_classifier.pkl")
loaded_scaler = joblib.load("customer_scaler.pkl")

# 新客户数据
new_customers = pd.DataFrame({
    "年龄": [35, 50, 25],
    "年收入（万元）": [30, 80, 10],
    "消费频次（次/月）": [8, 15, 2],
    "平均消费金额（元）": [500, 3000, 100],
    "会员年限": [3, 8, 1],
    "投诉次数": [0, 1, 4]
})

# 预测
new_customers_scaled = loaded_scaler.transform(new_customers)
predictions = loaded_model.predict(new_customers_scaled)

# 结果
category_names = {0: "普通客户", 1: "高价值客户", 2: "流失风险客户"}
for i, pred in enumerate(predictions):
    print(f"客户 {i+1}: {category_names[pred]}")
```

---

## 9 新手常见误区

### 误区 1："不需要处理类别不平衡"

**错！** 类别不平衡会导致模型偏向多数类。应该用过采样、欠采样或类别权重处理。

### 误区 2："只看准确率就够了"

**错！** 类别不平衡时，准确率会误导。应该看 F1 分数、混淆矩阵。

### 误区 3："不需要特征缩放"

**错！** SVM、KNN、逻辑回归对特征尺度敏感，必须标准化。

### 误区 4："模型越复杂越好"

不是的。简单模型（如逻辑回归）在数据量小时可能更稳健。应该用交叉验证选择。

### 误区 5："部署就是保存模型"

不是的。部署还需要考虑数据预处理、特征工程、API 设计、监控等。

---

## 10 动手练习

### 练习 1：基础练习

加载鸢尾花数据集，训练多个分类模型并对比准确率。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 训练模型
models = {
    "逻辑回归": LogisticRegression(max_iter=200),
    "决策树": DecisionTreeClassifier(random_state=42),
    "随机森林": RandomForestClassifier(n_estimators=100, random_state=42)
}

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    print(f"{name} 准确率: {accuracy_score(y_test, y_pred):.2%}")
```

</details>

### 练习 2：进阶练习

处理类别不平衡问题，对比过采样和类别权重的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.utils import resample
import numpy as np

# 生成不平衡数据
X, y = make_classification(n_samples=1000, n_classes=2, weights=[0.9, 0.1], random_state=42)

df = pd.DataFrame(X, columns=[f"feature_{i}" for i in range(X.shape[1])])
df["target"] = y

print("原始类别分布:")
print(df["target"].value_counts())

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 方法 1：类别权重
model1 = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)
model1.fit(X_train, y_train)
y_pred1 = model1.predict(X_test)
print("\n方法 1（类别权重）:")
print(classification_report(y_test, y_pred1))

# 方法 2：过采样
df_train = pd.DataFrame(X_train, columns=[f"feature_{i}" for i in range(X_train.shape[1])])
df_train["target"] = y_train

df_majority = df_train[df_train["target"] == 0]
df_minority = df_train[df_train["target"] == 1]

df_minority_upsampled = resample(df_minority, replace=True, n_samples=len(df_majority), random_state=42)
df_balanced = pd.concat([df_majority, df_minority_upsampled])

X_train_balanced = df_balanced.drop("target", axis=1).values
y_train_balanced = df_balanced["target"].values

model2 = RandomForestClassifier(n_estimators=100, random_state=42)
model2.fit(X_train_balanced, y_train_balanced)
y_pred2 = model2.predict(X_test)
print("\n方法 2（过采样）:")
print(classification_report(y_test, y_pred2))
```

</details>

### 练习 3（挑战）：综合练习

完成一个完整的客户分类项目，包括数据处理、模型训练、评估和部署。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib

# 1. 生成数据
np.random.seed(42)
n = 1000
data = {
    "年龄": np.random.randint(18, 70, n),
    "收入": np.random.uniform(3, 50, n),
    "消费": np.random.randint(0, 100, n),
    "类别": None
}
df = pd.DataFrame(data)

# 生成类别
df["类别"] = np.where(
    (df["收入"] > 30) & (df["消费"] > 50), 1,
    np.where(df["消费"] < 20, 2, 0)
)

print("类别分布:")
print(df["类别"].value_counts())

# 2. 数据预处理
X = df.drop("类别", axis=1)
y = df["类别"]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# 4. 模型训练与优化
model = RandomForestClassifier(class_weight="balanced", random_state=42)
param_grid = {
    "n_estimators": [50, 100],
    "max_depth": [None, 10]
}
grid_search = GridSearchCV(model, param_grid, cv=5, scoring="accuracy")
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_

# 5. 评估
y_pred = best_model.predict(X_test)
print(f"\n最佳参数: {grid_search.best_params_}")
print(f"准确率: {accuracy_score(y_test, y_pred):.2%}")
print(f"\n分类报告:\n{classification_report(y_test, y_pred)}")

# 6. 保存模型
joblib.dump(best_model, "customer_model.pkl")
joblib.dump(scaler, "customer_scaler.pkl")
print("\n模型已保存")

# 7. 预测新客户
new_customers = pd.DataFrame({
    "年龄": [30, 50, 20],
    "收入": [40, 10, 5],
    "消费": [80, 10, 5]
})
new_scaled = scaler.transform(new_customers)
predictions = best_model.predict(new_scaled)

category_names = {0: "普通", 1: "高价值", 2: "流失风险"}
for i, pred in enumerate(predictions):
    print(f"客户 {i+1}: {category_names[pred]}")
```

</details>

---

## 11 下一章预告

下一章我们会学习 **模型持久化与部署**——如何保存模型、用 Flask 构建 API、以及 Scikit-learn 的进阶学习路线。你会学到如何把模型应用到生产环境。
