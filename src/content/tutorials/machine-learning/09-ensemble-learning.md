---
title: "第9章：集成学习"
description: "Bagging、Boosting、随机森林、XGBoost、LightGBM"
---

# 第9章：集成学习

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是集成学习？为什么组合多个模型更好？
- Bagging 和 Boosting 有什么区别？
- 随机森林是怎么工作的？
- XGBoost 为什么这么强大？

这一章就是为了解答这些问题。集成学习是机器学习竞赛的常胜将军。

---

## 1 为什么需要集成学习？

### 痛点分析

单个模型可能有局限：

- 决策树容易过拟合
- 线性模型表达能力有限
- 不同模型在不同数据上表现不同

问题：如何获得更稳定、更准确的模型？

### 解决方案

集成学习组合多个模型：

```python
# 集成学习思路
# 1. Bagging: 并行训练多个模型，投票决定
# 2. Boosting: 串行训练，后一个修正前一个的错误
# 3. Stacking: 用另一个模型组合多个模型的输出

# 打个比方：
# Bagging = "三个臭皮匠，顶个诸葛亮"
# Boosting = "知错能改，善莫大焉"
```

打个比方：

> 集成学习像"专家会诊"：一个医生可能误诊，多个医生一起讨论，诊断更准确。

> **一句话总结**：集成学习组合多个弱学习器，构建强学习器。

---

## 2 核心原理

### Bagging（Bootstrap Aggregating）

```python
# Bagging 流程：
# 1. 从训练集中有放回地抽样，生成多个子集
# 2. 在每个子集上训练一个模型
# 3. 分类：多数投票；回归：取平均

# 优点：降低方差，防止过拟合
# 代表算法：随机森林
```

### Boosting

```python
# Boosting 流程：
# 1. 训练第一个模型
# 2. 关注被错分的样本，训练第二个模型
# 3. 继续训练，每个模型修正前面的错误
# 4. 加权组合所有模型

# 优点：降低偏差，提高准确率
# 代表算法：AdaBoost, Gradient Boosting, XGBoost
```

### 随机森林

```python
# 随机森林 = Bagging + 决策树 + 特征随机选择

# 1. 有放回抽样（Bootstrap）
# 2. 每棵树只用部分特征
# 3. 多棵树投票决定

# 优点：
# - 降低过拟合
# - 可以评估特征重要性
# - 不需要调参太多
```

---

## 3 基础用法

### 随机森林

```python
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.datasets import load_iris, make_regression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, mean_squared_error
import numpy as np

# ========== 随机森林分类 ==========

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 3. 创建模型
# n_estimators: 树的数量
# max_depth: 最大深度
# min_samples_split: 内部节点最小样本数
# min_samples_leaf: 叶节点最小样本数
# max_features: 每棵树使用的特征数
# random_state: 随机种子
model_rf = RandomForestClassifier(
    n_estimators=100,        # 100棵树
    max_depth=None,          # 不限制深度
    min_samples_split=2,     # 最少2个样本才划分
    min_samples_leaf=1,      # 叶节点最少1个样本
    max_features='sqrt',     # 每棵树用sqrt(n)个特征
    random_state=42,
    n_jobs=-1                # 使用所有CPU核心
)

# 4. 训练
model_rf.fit(X_train, y_train)

# 5. 预测
y_pred = model_rf.predict(X_test)

# 6. 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"随机森林准确率: {accuracy:.2%}")

# 7. 交叉验证
cv_scores = cross_val_score(model_rf, X, y, cv=5)
print(f"交叉验证准确率: {cv_scores.mean():.2%} ± {cv_scores.std():.2%}")

# 8. 特征重要性
print(f"\n特征重要性：")
for name, importance in zip(iris.feature_names, model_rf.feature_importances_):
    print(f"{name}: {importance:.4f}")

# ========== 随机森林回归 ==========

# 1. 生成数据
X_reg, y_reg = make_regression(n_samples=1000, n_features=10, noise=0.1, random_state=42)

# 2. 划分数据集
X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

# 3. 创建模型
model_rf_reg = RandomForestRegressor(n_estimators=100, random_state=42)

# 4. 训练
model_rf_reg.fit(X_train_reg, y_train_reg)

# 5. 预测
y_pred_reg = model_rf_reg.predict(X_test_reg)

# 6. 评估
mse = mean_squared_error(y_test_reg, y_pred_reg)
rmse = np.sqrt(mse)
print(f"\n随机森林回归 RMSE: {rmse:.2f}")
```

### Gradient Boosting

```python
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Gradient Boosting 逐步添加树，每棵树修正前面的错误

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 3. 创建模型
# n_estimators: 树的数量
# learning_rate: 学习率（步长）
# max_depth: 每棵树的最大深度
# subsample: 子采样比例
model_gb = GradientBoostingClassifier(
    n_estimators=100,        # 100棵树
    learning_rate=0.1,       # 学习率
    max_depth=3,             # 每棵树最大深度3
    subsample=0.8,           # 80%子采样
    random_state=42
)

# 4. 训练
model_gb.fit(X_train, y_train)

# 5. 预测
y_pred = model_gb.predict(X_test)

# 6. 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"Gradient Boosting准确率: {accuracy:.2%}")

# 7. 特征重要性
print(f"\n特征重要性：")
for name, importance in zip(iris.feature_names, model_gb.feature_importances_):
    print(f"{name}: {importance:.4f}")
```

### XGBoost

```python
# XGBoost 需要安装：pip install xgboost

try:
    import xgboost as xgb
    from sklearn.datasets import load_iris
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score
    
    # XGBoost 是 Gradient Boosting 的高效实现
    
    # 1. 加载数据
    iris = load_iris()
    X = iris.data
    y = iris.target
    
    # 2. 划分数据集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )
    
    # 3. 创建模型
    model_xgb = xgb.XGBClassifier(
        n_estimators=100,        # 树的数量
        learning_rate=0.1,       # 学习率
        max_depth=3,             # 最大深度
        subsample=0.8,           # 子采样
        colsample_bytree=0.8,    # 特征采样
        random_state=42,
        use_label_encoder=False,
        eval_metric='mlogloss'
    )
    
    # 4. 训练
    model_xgb.fit(X_train, y_train)
    
    # 5. 预测
    y_pred = model_xgb.predict(X_test)
    
    # 6. 评估
    accuracy = accuracy_score(y_test, y_pred)
    print(f"XGBoost准确率: {accuracy:.2%}")
    
    # 7. 特征重要性
    print(f"\n特征重要性：")
    for name, importance in zip(iris.feature_names, model_xgb.feature_importances_):
        print(f"{name}: {importance:.4f}")

except ImportError:
    print("请先安装 xgboost: pip install xgboost")
```

### 对比不同集成方法

```python
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    AdaBoostClassifier,
    VotingClassifier
)
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

# 对比不同集成方法

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 定义模型
models = {
    '单棵决策树': DecisionTreeClassifier(random_state=42),
    '随机森林': RandomForestClassifier(n_estimators=100, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
    'AdaBoost': AdaBoostClassifier(n_estimators=100, random_state=42),
    '投票分类器': VotingClassifier(
        estimators=[
            ('lr', LogisticRegression(max_iter=200)),
            ('rf', RandomForestClassifier(n_estimators=100)),
            ('svc', SVC(probability=True))
        ],
        voting='soft'  # 软投票（基于概率）
    )
}

# 3. 交叉验证对比
print("模型\t\t\t准确率")
print("-" * 40)
for name, model in models.items():
    # 对于需要特征缩放的模型
    if name in ['投票分类器']:
        model = make_pipeline(StandardScaler(), model)
    
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"{name:20s}\t{scores.mean():.3f} ± {scores.std():.3f}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 代表算法 |
| --- | --- | --- |
| Bagging | 并行训练，降低方差 | 随机森林 |
| Boosting | 串行训练，降低偏差 | AdaBoost, GBDT |
| 随机森林 | 多棵树投票 | RandomForest |
| Gradient Boosting | 逐步修正错误 | GBDT |
| XGBoost | 高效GBDT实现 | XGBoost |
| LightGBM | 更快的GBDT | LightGBM |
| Stacking | 模型组合模型 | 自定义 |
| Voting | 多模型投票 | VotingClassifier |

---

## 5 新手常见误区

### 误区 1："树越多越好"

**错！** 树太多会增加计算成本，性能提升有限。需要通过交叉验证确定合适的树数量。

### 误区 2："随机森林不需要调参"

不是的。虽然随机森林对参数不敏感，但 max_depth、min_samples_split 等参数仍然影响性能。需要适当调参。

### 误区 3："Boosting 一定比 Bagging 好"

不是的。Boosting 降低偏差，Bagging 降低方差。如果基学习器偏差高，用 Boosting；如果方差高，用 Bagging。

### 误区 4："集成学习可以解决所有问题"

**错！** 集成学习不能解决数据质量问题。如果数据有噪声、特征无关，集成学习也无效。

### 误区 5："XGBoost 总是最好的"

不是的。XGBoost 在很多场景表现好，但不是万能的。简单问题用简单模型，复杂问题可以尝试不同算法。

---

## 6 动手练习

### 练习 1：基础练习 - 随机森林

使用随机森林对乳腺癌数据集进行分类。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
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
model = RandomForestClassifier(n_estimators=100, random_state=42)
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

### 练习 2：进阶练习 - 对比不同方法

对比随机森林、Gradient Boosting、XGBoost 的性能。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import cross_val_score

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 定义模型
models = {
    '随机森林': RandomForestClassifier(n_estimators=100, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
}

# 尝试导入XGBoost
try:
    import xgboost as xgb
    models['XGBoost'] = xgb.XGBClassifier(
        n_estimators=100, random_state=42,
        use_label_encoder=False, eval_metric='mlogloss'
    )
except ImportError:
    print("XGBoost 未安装，跳过")

# 对比
print("模型\t\t\t准确率")
print("-" * 40)
for name, model in models.items():
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"{name:20s}\t{scores.mean():.3f} ± {scores.std():.3f}")
```

</details>

### 练习 3（挑战）：综合练习 - VotingClassifier

使用 VotingClassifier 组合多个模型。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.ensemble import VotingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 定义基学习器
estimators = [
    ('lr', LogisticRegression(max_iter=200, random_state=42)),
    ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
    ('svc', make_pipeline(StandardScaler(), SVC(probability=True, random_state=42)))
]

# 创建投票分类器
voting = VotingClassifier(estimators=estimators, voting='soft')

# 交叉验证
scores = cross_val_score(voting, X, y, cv=5, scoring='accuracy')
print(f"VotingClassifier 准确率: {scores.mean():.3f} ± {scores.std():.3f}")

# 对比单个模型
for name, estimator in estimators:
    if isinstance(estimator, SVC):
        estimator = make_pipeline(StandardScaler(), estimator)
    scores = cross_val_score(estimator, X, y, cv=5, scoring='accuracy')
    print(f"{name} 准确率: {scores.mean():.3f} ± {scores.std():.3f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **聚类算法** —— 无监督学习的核心算法。你会学到 K-Means、DBSCAN、层次聚类等算法，以及如何评估聚类效果。
