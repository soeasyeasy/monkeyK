---
title: "第16章：综合项目：完整机器学习流程"
description: "端到端项目：数据探索、特征工程、模型训练、评估与优化"
---

# 第16章：综合项目：完整机器学习流程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 一个完整的机器学习项目包含哪些步骤？
- 怎么把前面学到的知识串联起来？
- 实际项目中会遇到哪些问题？
- 如何优化模型达到最佳效果？

这一章就是为了解答这些问题。我们会用一个完整的实战项目，演示从数据加载到模型部署的全流程。

---

## 1 项目概述

### 项目目标

预测泰坦尼克号乘客的生存情况。这是一个二分类问题，我们需要：

1. 加载和探索数据
2. 做特征工程
3. 训练多个模型
4. 评估和选择最优模型
5. 调优超参数
6. 最终评估

### 项目流程

```
1. 数据加载与探索
      │
2. 数据预处理（缺失值、异常值）
      │
3. 特征工程（编码、构造、选择）
      │
4. 模型训练（多个模型对比）
      │
5. 模型评估（交叉验证）
      │
6. 超参数调优（网格搜索）
      │
7. 最终评估（测试集）
      │
8. 结果分析与总结
```

---

## 2 完整代码实现

### 步骤 1：数据加载与探索

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split

# 模拟泰坦尼克号数据
np.random.seed(42)
n = 891

# 生成模拟数据
data = pd.DataFrame({
    'pclass': np.random.choice([1, 2, 3], n, p=[0.24, 0.21, 0.55]),
    'sex': np.random.choice(['male', 'female'], n, p=[0.65, 0.35]),
    'age': np.random.normal(30, 14, n).clip(0.5, 80),
    'sibsp': np.random.choice([0, 1, 2, 3], n, p=[0.68, 0.23, 0.08, 0.01]),
    'parch': np.random.choice([0, 1, 2], n, p=[0.76, 0.13, 0.11]),
    'fare': np.random.exponential(32, n).round(2),
    'embarked': np.random.choice(['S', 'C', 'Q'], n, p=[0.72, 0.19, 0.09])
})

# 随机引入缺失值
data.loc[np.random.random(n) < 0.2, 'age'] = np.nan
data.loc[np.random.random(n) < 0.02, 'embarked'] = np.nan

# 生成标签（女性、高舱位、低年龄更容易存活）
survival_prob = 0.3 + 0.3 * (data['sex'] == 'female') - 0.1 * (data['pclass'] == 3)
survival_prob = survival_prob.clip(0, 1)
data['survived'] = (np.random.random(n) < survival_prob).astype(int)

print("数据形状:", data.shape)
print("\n前 5 行:")
print(data.head())
print("\n数据信息:")
print(data.info())
print("\n缺失值:")
print(data.isnull().sum())
print("\n统计信息:")
print(data.describe())
```

### 步骤 2：数据可视化

```python
# 可视化探索
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

# 1. 年龄分布
data['age'].hist(bins=30, ax=axes[0, 0], edgecolor='black')
axes[0, 0].set_title('年龄分布')
axes[0, 0].set_xlabel('年龄')

# 2. 性别分布
data['sex'].value_counts().plot(kind='bar', ax=axes[0, 1], color='steelblue')
axes[0, 1].set_title('性别分布')
axes[0, 1].set_xlabel('性别')

# 3. 舱位分布
data['pclass'].value_counts().sort_index().plot(kind='bar', ax=axes[0, 2], color='coral')
axes[0, 2].set_title('舱位分布')
axes[0, 2].set_xlabel('舱位')

# 4. 生存率按性别
data.groupby('sex')['survived'].mean().plot(kind='bar', ax=axes[1, 0], color='green')
axes[1, 0].set_title('性别 vs 生存率')
axes[1, 0].set_ylabel('生存率')

# 5. 生存率按舱位
data.groupby('pclass')['survived'].mean().plot(kind='bar', ax=axes[1, 1], color='purple')
axes[1, 1].set_title('舱位 vs 生存率')
axes[1, 1].set_ylabel('生存率')

# 6. 年龄与生存
data.boxplot(column='age', by='survived', ax=axes[1, 2])
axes[1, 2].set_title('年龄 vs 生存')
axes[1, 2].set_ylabel('年龄')

plt.tight_layout()
plt.show()
```

### 步骤 3：特征工程

```python
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

# 复制数据
df = data.copy()

# 1. 缺失值处理
# 年龄：按舱位和性别分组填充中位数
df['age'] = df.groupby(['pclass', 'sex'])['age'].transform(
    lambda x: x.fillna(x.median())
)
# 登船港口：用众数填充
df['embarked'] = df['embarked'].fillna(df['embarked'].mode()[0])

# 2. 特征构造
df['family_size'] = df['sibsp'] + df['parch'] + 1  # 家庭规模
df['is_alone'] = (df['family_size'] == 1).astype(int)  # 是否独自
df['age_group'] = pd.cut(df['age'], bins=[0, 12, 18, 30, 50, 80],
                         labels=['child', 'teen', 'young', 'middle', 'senior'])
df['fare_per_person'] = df['fare'] / df['family_size']  # 人均票价

# 3. 类别编码
# 性别：LabelEncoder
df['sex_encoded'] = LabelEncoder().fit_transform(df['sex'])

# 登船港口：独热编码
embarked_dummies = pd.get_dummies(df['embarked'], prefix='embarked')
df = pd.concat([df, embarked_dummies], axis=1)

# 年龄组：LabelEncoder
df['age_group_encoded'] = LabelEncoder().fit_transform(df['age_group'])

# 4. 选择特征
feature_cols = ['pclass', 'sex_encoded', 'age', 'sibsp', 'parch', 'fare',
                'family_size', 'is_alone', 'age_group_encoded', 'fare_per_person',
                'embarked_C', 'embarked_Q', 'embarked_S']
X = df[feature_cols]
y = df['survived']

print(f"特征数量: {X.shape[1]}")
print(f"样本数量: {X.shape[0]}")
```

### 步骤 4：模型训练与对比

```python
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score

# 定义模型
models = {
    '逻辑回归': LogisticRegression(max_iter=1000, random_state=42),
    '决策树': DecisionTreeClassifier(random_state=42),
    '随机森林': RandomForestClassifier(n_estimators=100, random_state=42),
    '梯度提升': GradientBoostingClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(probability=True, random_state=42),
    'KNN': KNeighborsClassifier()
}

# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 交叉验证对比
results = []
for name, model in models.items():
    scores = cross_val_score(model, X_scaled, y, cv=5, scoring='accuracy')
    results.append({
        '模型': name,
        '平均准确率': scores.mean(),
        '标准差': scores.std()
    })

results_df = pd.DataFrame(results).sort_values('平均准确率', ascending=False)
print("\n模型对比:")
print(results_df.to_string(index=False))
```

### 步骤 5：超参数调优

```python
from sklearn.model_selection import GridSearchCV

# 选择表现最好的模型（梯度提升）
param_grid = {
    'n_estimators': [50, 100, 200],
    'learning_rate': [0.01, 0.05, 0.1],
    'max_depth': [3, 5, 7],
    'subsample': [0.8, 0.9, 1.0]
}

gb = GradientBoostingClassifier(random_state=42)
grid_search = GridSearchCV(gb, param_grid, cv=5, scoring='accuracy', n_jobs=-1, verbose=1)
grid_search.fit(X_scaled, y)

print(f"\n最优参数: {grid_search.best_params_}")
print(f"最优交叉验证准确率: {grid_search.best_score_:.4f}")
```

### 步骤 6：最终评估

```python
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# 用最优模型训练
best_model = grid_search.best_estimator_
best_model.fit(X_train, y_train)

# 预测
y_pred = best_model.predict(X_test)
y_prob = best_model.predict_proba(X_test)[:, 1]

# 评估
print("\n测试集准确率:", best_model.score(X_test, y_test))
print("\n分类报告:")
print(classification_report(y_test, y_pred))
print("\nAUC:", roc_auc_score(y_test, y_prob))

# 混淆矩阵
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.xlabel('预测')
plt.ylabel('真实')
plt.title('混淆矩阵')
plt.show()
```

### 步骤 7：特征重要性分析

```python
# 特征重要性
importances = best_model.feature_importances_
feature_importance_df = pd.DataFrame({
    '特征': feature_cols,
    '重要性': importances
}).sort_values('重要性', ascending=False)

# 可视化
plt.figure(figsize=(10, 6))
sns.barplot(data=feature_importance_df, x='重要性', y='特征')
plt.title('特征重要性')
plt.tight_layout()
plt.show()

print("\n特征重要性排名:")
print(feature_importance_df.to_string(index=False))
```

---

## 3 项目总结

### 关键步骤回顾

| 步骤 | 做了什么 | 关键点 |
| --- | --- | --- |
| 数据探索 | 查看分布、缺失值、相关性 | 了解数据全貌 |
| 缺失值处理 | 分组填充、众数填充 | 根据特征选择策略 |
| 特征构造 | 家庭规模、年龄组、人均票价 | 基于业务理解 |
| 模型对比 | 6 个模型交叉验证 | 选择最优基线 |
| 超参数调优 | 网格搜索 | 找到最优配置 |
| 最终评估 | 测试集评估 | 报告准确率、AUC |

### 经验总结

1. **数据探索很重要**：通过可视化发现了性别、舱位对生存率的影响
2. **特征工程提升效果**：构造的家庭规模、年龄组等特征有帮助
3. **集成方法表现好**：随机森林和梯度提升效果优于单模型
4. **调优带来提升**：超参数调优进一步提升了模型性能

---

## 4 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 完整流程 | 探索 → 预处理 → 特征工程 → 训练 → 评估 → 调优 |
| 数据探索 | 可视化发现规律 |
| 特征工程 | 缺失值、编码、构造 |
| 模型对比 | 交叉验证公平比较 |
| 超参数调优 | 网格搜索找最优 |
| 特征重要性 | 理解模型决策 |

---

## 5 新手常见误区

### 误区 1："跳过数据探索直接建模"

**错！** 不做探索就建模，像盲人摸象，不知道数据有什么问题。

正确做法：先花时间做数据探索，了解数据再动手。

### 误区 2："只用一个模型"

不对。不同模型有不同的优势，多试几个才能找到最适合的。

正确做法：至少对比 3-5 个不同类型的模型。

### 误区 3："不做特征工程"

不是的。原始数据往往不能直接用于建模，特征工程决定了模型的上限。

正确做法：投入足够时间做特征工程。

---

## 6 动手练习

### 练习 1：基础练习

用 Pipeline 整合整个流程，从原始数据到最终预测。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# 数值和类别特征
numeric_features = ['age', 'fare', 'sibsp', 'parch']
categorical_features = ['sex', 'embarked', 'pclass']

# 数值处理
numeric_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

# 类别处理
categorical_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

# 预处理器
preprocessor = ColumnTransformer([
    ('num', numeric_transformer, numeric_features),
    ('cat', categorical_transformer, categorical_features)
])

# 完整 Pipeline
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', GradientBoostingClassifier(random_state=42))
])

# 使用
X_raw = data[['age', 'fare', 'sibsp', 'parch', 'sex', 'embarked', 'pclass']]
y = data['survived']
scores = cross_val_score(pipeline, X_raw, y, cv=5, scoring='accuracy')
print(f"Pipeline 准确率: {scores.mean():.4f}")
```

</details>

### 练习 2：进阶练习

对加州房价数据集做完整的回归分析流程。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import fetch_california_housing
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score

# 加载数据
data = fetch_california_housing()
X, y = data.data, data.target

# 划分
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 标准化 + 模型
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('regressor', GradientBoostingRegressor(n_estimators=100, random_state=42))
])

# 训练
pipeline.fit(X_train, y_train)

# 评估
y_pred = pipeline.predict(X_test)
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}")
print(f"R²: {r2_score(y_test, y_pred):.4f}")
```

</details>

### 练习 3（挑战）：综合练习

完成一个完整的分类项目，包括数据探索、特征工程、模型对比、调优、最终评估。

<details>
<summary>点击查看答案</summary>

```python
# 使用乳腺癌数据集
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# 加载
data = load_breast_cancer()
X, y = data.data, data.target

# 划分
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('rf', RandomForestClassifier(random_state=42))
])

# 调优
param_grid = {
    'rf__n_estimators': [50, 100, 200],
    'rf__max_depth': [5, 10, None],
    'rf__min_samples_split': [2, 5, 10]
}

grid = GridSearchCV(pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid.fit(X_train, y_train)

# 评估
print(f"最优参数: {grid.best_params_}")
y_pred = grid.predict(X_test)
print(f"准确率: {grid.score(X_test, y_test):.4f}")
print(classification_report(y_test, y_pred))
```

</details>

---

## 总结

恭喜你完成了整个"特征工程与模型评估"教程！通过这 16 章的学习，你已经掌握了：

- 特征工程的完整流程（探索、预处理、构造、选择、提取）
- 模型评估的各种方法（交叉验证、评估指标）
- 超参数调优技术（网格搜索、随机搜索、贝叶斯优化）
- 实战项目的完整流程

希望这些知识能帮助你在机器学习的道路上走得更远！
