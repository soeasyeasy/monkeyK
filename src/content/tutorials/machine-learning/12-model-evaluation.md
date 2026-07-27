---
title: "第12章：模型评估与调优"
description: "交叉验证、网格搜索、学习曲线、偏差-方差权衡"
---

# 第12章：模型评估与调优

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何评估模型的性能？
- 什么是过拟合和欠拟合？
- 如何选择最佳超参数？
- 如何诊断模型问题？

这一章就是为了解答这些问题。模型评估和调优是机器学习项目中至关重要的环节。

---

## 1 为什么需要模型评估？

### 痛点分析

训练完模型后，你需要知道：

```
问题1：模型性能如何？
- 准确率90%算好吗？
- 在不同数据上表现一致吗？

问题2：模型有什么问题？
- 过拟合：训练集好，测试集差
- 欠拟合：训练集和测试集都差

问题3：如何改进模型？
- 调整参数？
- 增加数据？
- 换算法？
```

### 解决方案

系统化的评估和调优流程：

```python
# 评估方法：
# 1. 训练集/测试集划分
# 2. 交叉验证
# 3. 学习曲线
# 4. 验证曲线

# 调优方法：
# 1. 网格搜索
# 2. 随机搜索
# 3. 贝叶斯优化

# 诊断方法：
# 1. 偏差-方差分析
# 2. 学习曲线分析
```

打个比方：

> 模型评估像"考试"：训练集是平时作业，测试集是期末考试。交叉验证是多次考试取平均。

> **一句话总结**：模型评估和调优确保模型性能可靠，找到最佳配置。

---

## 2 核心原理

### 过拟合与欠拟合

```python
# 欠拟合（High Bias）
# - 模型太简单
# - 训练集和测试集性能都差
# - 解决：增加模型复杂度，增加特征

# 过拟合（High Variance）
# - 模型太复杂
# - 训练集性能好，测试集性能差
# - 解决：正则化，增加数据，简化模型

# 理想模型
# - 训练集和测试集性能都好
# - 偏差和方差都低
```

### 交叉验证

```python
# K折交叉验证：
# 1. 将数据分成K份
# 2. 每次用K-1份训练，1份测试
# 3. 重复K次，取平均性能

# 优点：
# - 充分利用数据
# - 评估更稳定
# - 减少过拟合风险
```

### 偏差-方差权衡

```python
# 偏差（Bias）
# - 模型预测值与真实值的差异
# - 高偏差：欠拟合

# 方差（Variance）
# - 模型在不同训练集上的预测差异
# - 高方差：过拟合

# 总误差 = 偏差² + 方差 + 噪声
# 目标：找到偏差和方差的平衡点
```

---

## 3 基础用法

### 交叉验证

```python
from sklearn.model_selection import cross_val_score, KFold, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
import numpy as np

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 创建模型管道（包含特征缩放）
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=200))

# 3. K折交叉验证
# cv=5: 5折交叉验证
# scoring: 评估指标
cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')

print("5折交叉验证结果：")
print(f"各折准确率：{cv_scores}")
print(f"平均准确率：{cv_scores.mean():.3f}")
print(f"标准差：{cv_scores.std():.3f}")

# 4. 分层K折交叉验证
# 保证每折中各类别比例一致
stratified_kfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
stratified_scores = cross_val_score(model, X, y, cv=stratified_kfold, scoring='accuracy')

print(f"\n分层5折交叉验证：")
print(f"平均准确率：{stratified_scores.mean():.3f}")

# 5. 留一法交叉验证（LOOCV）
# 每次留一个样本作为测试集
from sklearn.model_selection import LeaveOneOut

loo = LeaveOneOut()
loo_scores = cross_val_score(model, X, y, cv=loo, scoring='accuracy')

print(f"\n留一法交叉验证：")
print(f"平均准确率：{loo_scores.mean():.3f}")

# 6. 重复K折交叉验证
from sklearn.model_selection import RepeatedStratifiedKFold

repeated_kfold = RepeatedStratifiedKFold(n_splits=5, n_repeats=10, random_state=42)
repeated_scores = cross_val_score(model, X, y, cv=repeated_kfold, scoring='accuracy')

print(f"\n重复10次5折交叉验证：")
print(f"平均准确率：{repeated_scores.mean():.3f}")
```

### 网格搜索

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

# 网格搜索：穷举所有参数组合

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 创建模型管道
model = make_pipeline(StandardScaler(), RandomForestClassifier(random_state=42))

# 3. 定义参数网格
param_grid = {
    'randomforestclassifier__n_estimators': [50, 100, 200],
    'randomforestclassifier__max_depth': [None, 5, 10, 20],
    'randomforestclassifier__min_samples_split': [2, 5, 10]
}

print(f"参数组合总数：{3 * 4 * 3} = {3*4*3}")

# 4. 创建网格搜索
grid_search = GridSearchCV(
    estimator=model,
    param_grid=param_grid,
    cv=5,                    # 5折交叉验证
    scoring='accuracy',      # 评估指标
    n_jobs=-1,               # 使用所有CPU核心
    verbose=1                # 打印过程
)

# 5. 执行搜索
grid_search.fit(X, y)

# 6. 查看结果
print(f"\n最佳参数：{grid_search.best_params_}")
print(f"最佳准确率：{grid_search.best_score_:.3f}")

# 7. 查看所有结果
print("\n所有结果（前5个）：")
results = grid_search.cv_results_
for i in range(min(5, len(results['params']))):
    print(f"参数：{results['params'][i]}")
    print(f"平均准确率：{results['mean_test_score'][i]:.3f}")
    print()

# 8. 使用最佳模型
best_model = grid_search.best_estimator_
print(f"最佳模型：{best_model}")
```

### 随机搜索

```python
from sklearn.model_selection import RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from scipy.stats import randint
import numpy as np

# 随机搜索：随机采样参数组合

# 1. 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 2. 创建模型
model = RandomForestClassifier(random_state=42)

# 3. 定义参数分布
param_dist = {
    'n_estimators': randint(50, 300),
    'max_depth': [None, 5, 10, 20, 30],
    'min_samples_split': randint(2, 20),
    'min_samples_leaf': randint(1, 10)
}

# 4. 创建随机搜索
random_search = RandomizedSearchCV(
    estimator=model,
    param_distributions=param_dist,
    n_iter=20,               # 随机采样20次
    cv=5,
    scoring='accuracy',
    random_state=42,
    n_jobs=-1
)

# 5. 执行搜索
random_search.fit(X, y)

# 6. 查看结果
print(f"最佳参数：{random_search.best_params_}")
print(f"最佳准确率：{random_search.best_score_:.3f}")

# 对比网格搜索
print("\n随机搜索优势：")
print("- 参数空间大时更高效")
print("- 可以搜索连续参数")
print("- 不受维度灾难影响")
```

### 学习曲线

```python
from sklearn.model_selection import learning_curve
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
import matplotlib.pyplot as plt
import numpy as np

# 学习曲线：诊断过拟合和欠拟合

# 1. 生成数据
X, y = make_classification(n_samples=1000, n_features=20, random_state=42)

# 2. 创建模型
model_lr = make_pipeline(StandardScaler(), LogisticRegression(max_iter=200))
model_rf = RandomForestClassifier(random_state=42)

# 3. 计算学习曲线
train_sizes, train_scores_lr, test_scores_lr = learning_curve(
    model_lr, X, y,
    cv=5,
    n_jobs=-1,
    train_sizes=np.linspace(0.1, 1.0, 10)
)

train_sizes, train_scores_rf, test_scores_rf = learning_curve(
    model_rf, X, y,
    cv=5,
    n_jobs=-1,
    train_sizes=np.linspace(0.1, 1.0, 10)
)

# 4. 计算平均值和标准差
train_mean_lr = np.mean(train_scores_lr, axis=1)
train_std_lr = np.std(train_scores_lr, axis=1)
test_mean_lr = np.mean(test_scores_lr, axis=1)
test_std_lr = np.std(test_scores_lr, axis=1)

train_mean_rf = np.mean(train_scores_rf, axis=1)
train_std_rf = np.std(train_scores_rf, axis=1)
test_mean_rf = np.mean(test_scores_rf, axis=1)
test_std_rf = np.std(test_scores_rf, axis=1)

# 5. 可视化
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# 逻辑回归
ax1.fill_between(train_sizes, train_mean_lr - train_std_lr, train_mean_lr + train_std_lr, alpha=0.1)
ax1.fill_between(train_sizes, test_mean_lr - test_std_lr, test_mean_lr + test_std_lr, alpha=0.1)
ax1.plot(train_sizes, train_mean_lr, 'o-', label='Training score')
ax1.plot(train_sizes, test_mean_lr, 'o-', label='Cross-validation score')
ax1.set_title('Learning Curve (Logistic Regression)')
ax1.set_xlabel('Training Set Size')
ax1.set_ylabel('Accuracy')
ax1.legend()
ax1.grid(True)

# 随机森林
ax2.fill_between(train_sizes, train_mean_rf - train_std_rf, train_mean_rf + train_std_rf, alpha=0.1)
ax2.fill_between(train_sizes, test_mean_rf - test_std_rf, test_mean_rf + test_std_rf, alpha=0.1)
ax2.plot(train_sizes, train_mean_rf, 'o-', label='Training score')
ax2.plot(train_sizes, test_mean_rf, 'o-', label='Cross-validation score')
ax2.set_title('Learning Curve (Random Forest)')
ax2.set_xlabel('Training Set Size')
ax2.set_ylabel('Accuracy')
ax2.legend()
ax2.grid(True)

plt.tight_layout()
plt.show()

# 6. 分析
print("学习曲线分析：")
print("逻辑回归：训练集和测试集分数接近 → 可能欠拟合")
print("随机森林：训练集分数高，测试集分数低 → 可能过拟合")
```

### 验证曲线

```python
from sklearn.model_selection import validation_curve
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
import matplotlib.pyplot as plt
import numpy as np

# 验证曲线：分析单个参数对性能的影响

# 1. 生成数据
X, y = make_classification(n_samples=1000, n_features=20, random_state=42)

# 2. 定义参数范围
param_range = [1, 5, 10, 20, 30, 50, 100]

# 3. 计算验证曲线
train_scores, test_scores = validation_curve(
    RandomForestClassifier(random_state=42),
    X, y,
    param_name='max_depth',
    param_range=param_range,
    cv=5,
    n_jobs=-1
)

# 4. 计算平均值和标准差
train_mean = np.mean(train_scores, axis=1)
train_std = np.std(train_scores, axis=1)
test_mean = np.mean(test_scores, axis=1)
test_std = np.std(test_scores, axis=1)

# 5. 可视化
plt.figure(figsize=(10, 6))
plt.fill_between(param_range, train_mean - train_std, train_mean + train_std, alpha=0.1)
plt.fill_between(param_range, test_mean - test_std, test_mean + test_std, alpha=0.1)
plt.plot(param_range, train_mean, 'o-', label='Training score')
plt.plot(param_range, test_mean, 'o-', label='Cross-validation score')
plt.xlabel('max_depth')
plt.ylabel('Accuracy')
plt.title('Validation Curve (Random Forest)')
plt.legend()
plt.grid(True)
plt.show()

# 6. 分析
print("验证曲线分析：")
for i, depth in enumerate(param_range):
    print(f"max_depth={depth}: 训练={train_mean[i]:.3f}, 验证={test_mean[i]:.3f}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 用途 |
| --- | --- | --- |
| 交叉验证 | 多次训练测试 | 稳定评估 |
| 网格搜索 | 穷举参数组合 | 参数调优 |
| 随机搜索 | 随机采样参数 | 高效调优 |
| 学习曲线 | 训练集大小 vs 性能 | 诊断问题 |
| 验证曲线 | 参数值 vs 性能 | 选择参数 |
| 偏差 | 预测值与真实值差异 | 欠拟合 |
| 方差 | 不同训练集的预测差异 | 过拟合 |
| 过拟合 | 训练好，测试差 | 需要正则化 |
| 欠拟合 | 训练差，测试差 | 需要增加复杂度 |

---

## 5 新手常见误区

### 误区 1："只看训练集准确率"

**错！** 训练集准确率高不代表模型好。必须看测试集或交叉验证的准确率。

### 误区 2："测试集准确率高就是好模型"

不是的。如果测试集被用于选择模型或调参，就失去了评估的客观性。应该使用独立的验证集或交叉验证。

### 误区 3："参数越多越好"

**错！** 参数太多会导致过拟合。需要通过交叉验证选择合适的参数。

### 误区 4："网格搜索总是最好的"

不是的。参数空间大时，网格搜索计算成本高。随机搜索更高效，贝叶斯优化更智能。

### 误区 5："学习曲线不重要"

**错！** 学习曲线可以诊断模型问题（过拟合/欠拟合），指导改进方向。

---

## 6 动手练习

### 练习 1：基础练习 - 交叉验证

使用5折交叉验证评估模型性能。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 创建模型
model = RandomForestClassifier(n_estimators=100, random_state=42)

# 5折交叉验证
scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')

print(f"各折准确率：{scores}")
print(f"平均准确率：{scores.mean():.3f}")
print(f"标准差：{scores.std():.3f}")
```

</details>

### 练习 2：进阶练习 - 网格搜索

使用网格搜索为随机森林选择最佳参数。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 创建模型
model = RandomForestClassifier(random_state=42)

# 参数网格
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [None, 5, 10],
    'min_samples_split': [2, 5]
}

# 网格搜索
grid = GridSearchCV(model, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid.fit(X, y)

print(f"最佳参数：{grid.best_params_}")
print(f"最佳准确率：{grid.best_score_:.3f}")
```

</details>

### 练习 3（挑战）：综合练习 - 学习曲线分析

绘制学习曲线，诊断模型问题。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.model_selection import learning_curve
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
import matplotlib.pyplot as plt
import numpy as np

# 生成数据
X, y = make_classification(n_samples=500, n_features=20, random_state=42)

# 创建模型
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=200))

# 计算学习曲线
train_sizes, train_scores, test_scores = learning_curve(
    model, X, y, cv=5, n_jobs=-1,
    train_sizes=np.linspace(0.1, 1.0, 10)
)

# 计算平均值
train_mean = np.mean(train_scores, axis=1)
test_mean = np.mean(test_scores, axis=1)

# 可视化
plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_mean, 'o-', label='Training score')
plt.plot(train_sizes, test_mean, 'o-', label='Cross-validation score')
plt.xlabel('Training Set Size')
plt.ylabel('Accuracy')
plt.title('Learning Curve')
plt.legend()
plt.grid(True)
plt.show()

# 分析
if train_mean[-1] - test_mean[-1] > 0.1:
    print("诊断：过拟合（训练集和测试集差距大）")
elif train_mean[-1] < 0.8:
    print("诊断：欠拟合（训练集性能低）")
else:
    print("诊断：模型性能良好")
```

</details>

---

## 下一章预告

下一章我们会学习 **正则化与过拟合** —— 如何防止模型过拟合。你会学到 L1/L2 正则化、Dropout、早停法等防止过拟合的技术。
