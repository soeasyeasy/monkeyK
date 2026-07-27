---
title: "第15章：机器学习实战项目"
description: "房价预测、图像分类、文本情感分析完整项目"
---

# 第15章：机器学习实战项目

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何从零开始完成一个机器学习项目？
- 回归、分类、文本分析项目有什么不同？
- 项目流程是怎样的？
- 如何评估和优化项目结果？

这一章就是为了解答这些问题。通过三个完整的实战项目，你将掌握机器学习项目的完整流程。

---

## 1 为什么需要实战项目？

### 痛点分析

学了很多算法，但面对真实问题时：

```
问题1：不知道从哪里开始
- 数据怎么获取？
- 先做什么，后做什么？

问题2：不知道选什么算法
- 回归还是分类？
- 简单模型还是复杂模型？

问题3：不知道如何评估
- 用什么指标？
- 结果好不好？
```

### 解决方案

标准化的项目流程：

```python
# 机器学习项目标准流程：
# 1. 问题定义 → 2. 数据收集 → 3. 数据探索
# 4. 数据预处理 → 5. 特征工程 → 6. 模型选择
# 7. 模型训练 → 8. 模型评估 → 9. 模型优化
# 10. 结果分析 → 11. 部署应用
```

打个比方：

> 机器学习项目像"做菜"：先确定做什么菜（问题定义），再准备食材（数据收集），然后切菜炒菜（预处理和训练），最后装盘上桌（部署应用）。

> **一句话总结**：实战项目将所学知识应用到真实场景，掌握完整流程。

---

## 2 项目一：房价预测（回归任务）

### 问题定义

根据房屋特征预测房价。

```
输入特征：面积、房间数、房龄、地段等
输出：房价（连续值）
任务类型：回归
评估指标：RMSE、R²
```

### 完整代码

```python
import numpy as np
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns

# ========== 步骤1：加载数据 ==========

# 使用加州房价数据集
housing = fetch_california_housing()
X = pd.DataFrame(housing.data, columns=housing.feature_names)
y = housing.target  # 房价（单位：10万美元）

print("数据集信息：")
print(f"样本数：{X.shape[0]}")
print(f"特征数：{X.shape[1]}")
print(f"\n特征列表：")
for col in X.columns:
    print(f"  - {col}")

# ========== 步骤2：数据探索 ==========

print(f"\n数据统计信息：")
print(X.describe())

# 目标变量分布
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.hist(y, bins=50, edgecolor='black')
plt.title('房价分布')
plt.xlabel('房价（10万美元）')
plt.ylabel('频数')

# 特征相关性
plt.subplot(1, 2, 2)
X_with_target = X.copy()
X_with_target['Price'] = y
corr = X_with_target.corr()['Price'].drop('Price').sort_values(ascending=False)
corr.plot(kind='bar', title='特征与房价的相关性')
plt.ylabel('相关系数')
plt.tight_layout()
plt.show()

print(f"\n特征与房价的相关性：")
for feature, corr_value in corr.items():
    print(f"  {feature}: {corr_value:.3f}")

# ========== 步骤3：数据预处理 ==========

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"\n训练集大小：{X_train.shape}")
print(f"测试集大小：{X_test.shape}")

# ========== 步骤4：模型训练与评估 ==========

# 定义模型
models = {
    'Ridge回归': Ridge(alpha=1.0),
    '随机森林': RandomForestRegressor(n_estimators=100, random_state=42),
    'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42)
}

print("\n模型评估结果：")
print("-" * 70)
print(f"{'模型':<25} {'RMSE':<10} {'MAE':<10} {'R²':<10} {'CV R²':<10}")
print("-" * 70)

results = {}
for name, model in models.items():
    # 训练
    model.fit(X_train_scaled, y_train)
    
    # 预测
    y_pred = model.predict(X_test_scaled)
    
    # 评估
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    # 交叉验证
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='r2')
    cv_r2 = cv_scores.mean()
    
    results[name] = {
        'rmse': rmse,
        'mae': mae,
        'r2': r2,
        'cv_r2': cv_r2,
        'model': model
    }
    
    print(f"{name:<25} {rmse:<10.3f} {mae:<10.3f} {r2:<10.3f} {cv_r2:<10.3f}")

# ========== 步骤5：特征重要性分析 ==========

# 随机森林特征重要性
rf_model = results['随机森林']['model']
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\n特征重要性（随机森林）：")
for _, row in feature_importance.iterrows():
    print(f"  {row['feature']}: {row['importance']:.4f}")

# 可视化
plt.figure(figsize=(10, 6))
plt.barh(feature_importance['feature'], feature_importance['importance'])
plt.xlabel('重要性')
plt.title('特征重要性（随机森林）')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.show()

# ========== 步骤6：模型优化 ==========

# 对最佳模型进行网格搜索
best_model_name = max(results, key=lambda k: results[k]['r2'])
print(f"\n最佳模型：{best_model_name}")

if best_model_name == '随机森林':
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [None, 10, 20],
        'min_samples_split': [2, 5]
    }
    base_model = RandomForestRegressor(random_state=42)
elif best_model_name == 'Gradient Boosting':
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [3, 5, 7],
        'learning_rate': [0.01, 0.1, 0.2]
    }
    base_model = GradientBoostingRegressor(random_state=42)

grid_search = GridSearchCV(
    base_model, param_grid, cv=5,
    scoring='r2', n_jobs=-1
)
grid_search.fit(X_train_scaled, y_train)

print(f"最佳参数：{grid_search.best_params_}")
print(f"最佳CV R²：{grid_search.best_score_:.3f}")

# 使用最佳模型预测
best_model = grid_search.best_estimator_
y_pred_optimized = best_model.predict(X_test_scaled)
r2_optimized = r2_score(y_test, y_pred_optimized)
rmse_optimized = np.sqrt(mean_squared_error(y_test, y_pred_optimized))

print(f"\n优化后测试集R²：{r2_optimized:.3f}")
print(f"优化后测试集RMSE：{rmse_optimized:.3f}")

# ========== 步骤7：预测新数据 ==========

# 假设你有一栋新房子
new_house = pd.DataFrame({
    'MedInc': [8.5],           # 收入中位数
    'HouseAge': [10],          # 房龄
    'AveRooms': [6.5],         # 平均房间数
    'AveBedrms': [1.2],        # 平均卧室数
    'Population': [1500],      # 人口
    'AveOccup': [3.5],         # 平均入住率
    'Latitude': [34.5],        # 纬度
    'Longitude': [-118.5]      # 经度
})

# 特征缩放
new_house_scaled = scaler.transform(new_house)

# 预测
predicted_price = best_model.predict(new_house_scaled)[0]
print(f"\n新房子预测价格：${predicted_price * 100000:.0f}")
```

---

## 3 项目二：图像分类（分类任务）

### 问题定义

识别手写数字（0-9）。

```
输入：8x8灰度图像
输出：数字类别（0-9）
任务类型：多分类
评估指标：准确率、混淆矩阵
```

### 完整代码

```python
import numpy as np
import pandas as pd
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# ========== 步骤1：加载数据 ==========

digits = load_digits()
X = digits.data  # 64维特征（8x8图像展平）
y = digits.target  # 0-9标签

print("数据集信息：")
print(f"样本数：{X.shape[0]}")
print(f"特征数：{X.shape[1]}")
print(f"类别数：{len(digits.target_names)}")

# ========== 步骤2：数据探索 ==========

# 可视化样本
fig, axes = plt.subplots(2, 5, figsize=(12, 5))
axes = axes.flatten()

for i in range(10):
    image = digits.images[i]
    axes[i].imshow(image, cmap='gray')
    axes[i].set_title(f'数字：{y[i]}')
    axes[i].axis('off')

plt.tight_layout()
plt.show()

# 类别分布
print(f"\n类别分布：")
for digit in range(10):
    count = np.sum(y == digit)
    print(f"  数字{digit}: {count}个样本")

# ========== 步骤3：数据预处理 ==========

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"\n训练集大小：{X_train.shape}")
print(f"测试集大小：{X_test.shape}")

# ========== 步骤4：模型训练 ==========

models = {
    'SVM（RBF核）': SVC(kernel='rbf', C=10, gamma='scale', random_state=42),
    '随机森林': RandomForestClassifier(n_estimators=100, random_state=42)
}

print("\n模型评估结果：")
print("-" * 50)
print(f"{'模型':<25} {'准确率':<10} {'CV准确率':<10}")
print("-" * 50)

results = {}
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    
    accuracy = accuracy_score(y_test, y_pred)
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
    cv_accuracy = cv_scores.mean()
    
    results[name] = {
        'accuracy': accuracy,
        'cv_accuracy': cv_accuracy,
        'model': model,
        'y_pred': y_pred
    }
    
    print(f"{name:<25} {accuracy:<10.3f} {cv_accuracy:<10.3f}")

# ========== 步骤5：详细评估 ==========

# 选择最佳模型
best_model_name = max(results, key=lambda k: results[k]['accuracy'])
best_model = results[best_model_name]['model']
y_pred = results[best_model_name]['y_pred']

print(f"\n最佳模型：{best_model_name}")
print(f"\n分类报告：")
print(classification_report(y_test, y_pred, target_names=[str(i) for i in range(10)]))

# 混淆矩阵
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=range(10), yticklabels=range(10))
plt.xlabel('预测标签')
plt.ylabel('真实标签')
plt.title('混淆矩阵')
plt.show()

# ========== 步骤6：错误分析 ==========

# 找出预测错误的样本
errors = y_test != y_pred
error_indices = np.where(errors)[0]

print(f"\n错误预测数量：{len(error_indices)}")
print(f"错误率：{len(error_indices) / len(y_test):.2%}")

# 可视化错误样本
if len(error_indices) > 0:
    fig, axes = plt.subplots(2, 5, figsize=(12, 5))
    axes = axes.flatten()
    
    for i, idx in enumerate(error_indices[:10]):
        image = X_test[idx].reshape(8, 8)
        axes[i].imshow(image, cmap='gray')
        axes[i].set_title(f'预测：{y_pred[idx]}, 真实：{y_test[idx]}')
        axes[i].axis('off')
    
    plt.tight_layout()
    plt.show()

# ========== 步骤7：预测新数据 ==========

# 随机选择测试集样本进行预测
sample_indices = np.random.choice(len(X_test), 5, replace=False)

print("\n新样本预测：")
for idx in sample_indices:
    sample = X_test_scaled[idx].reshape(1, -1)
    prediction = best_model.predict(sample)[0]
    true_label = y_test[idx]
    
    # 显示图像
    image = X_test[idx].reshape(8, 8)
    print(f"预测：{prediction}, 真实：{true_label}")
    plt.imshow(image, cmap='gray')
    plt.title(f'预测：{prediction}, 真实：{true_label}')
    plt.axis('off')
    plt.show()
```

---

## 4 项目三：文本情感分析（NLP任务）

### 问题定义

判断评论是正面还是负面。

```
输入：文本评论
输出：情感类别（正面/负面）
任务类型：二分类
评估指标：准确率、精确率、召回率、F1
```

### 完整代码

```python
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import make_pipeline
import matplotlib.pyplot as plt
import seaborn as sns

# ========== 步骤1：准备数据 ==========

# 模拟评论数据
reviews = [
    "这个产品非常好用，强烈推荐",
    "质量太差了，完全不能用",
    "性价比很高，值得购买",
    "客服态度很差，不推荐",
    "物流很快，包装完好",
    "用了一次就坏了，差评",
    "外观漂亮，功能强大",
    "价格太贵，不值这个价",
    "非常满意，五星好评",
    "一般般，没有想象中好",
    "超级棒，已经回购多次了",
    "收到就坏了，申请退货",
    "很好用，家人都喜欢",
    "太失望了，浪费钱",
    "物超所值，下次还来",
    "做工粗糙，不建议购买",
    "速度快，效果好",
    "噪音太大，影响使用",
    "操作简单，老人也能用",
    "电池不耐用，半天就没电了"
]

labels = [
    1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    1, 0, 1, 0, 1, 0, 1, 0, 1, 0
]  # 1:正面, 0:负面

print("数据集信息：")
print(f"评论数：{len(reviews)}")
print(f"正面评论：{sum(labels)}条")
print(f"负面评论：{len(labels) - sum(labels)}条")

# ========== 步骤2：数据探索 ==========

# 词频统计
from collections import Counter

all_words = []
for review in reviews:
    all_words.extend(list(review))

word_freq = Counter(all_words)
print(f"\n最常见字符（前10）：")
for char, freq in word_freq.most_common(10):
    print(f"  '{char}': {freq}次")

# ========== 步骤3：特征提取 ==========

# TF-IDF向量化
vectorizer = TfidfVectorizer(
    max_features=1000,     # 最多1000个特征
    ngram_range=(1, 2),    # 使用1-gram和2-gram
    min_df=1,              # 最小文档频率
    max_df=1.0             # 最大文档频率
)

X = vectorizer.fit_transform(reviews)
y = np.array(labels)

print(f"\n特征矩阵形状：{X.shape}")
print(f"词汇表大小：{len(vectorizer.vocabulary_)}")

# ========== 步骤4：模型训练 ==========

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

# 使用管道（特征提取 + 模型）
models = {
    '朴素贝叶斯': make_pipeline(MultinomialNB()),
    '逻辑回归': make_pipeline(LogisticRegression(max_iter=1000)),
    '线性SVM': make_pipeline(LinearSVC())
}

print("\n模型评估结果：")
print("-" * 60)
print(f"{'模型':<25} {'准确率':<10} {'F1':<10} {'CV准确率':<10}")
print("-" * 60)

results = {}
for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    f1 = report['macro avg']['f1-score']
    
    cv_scores = cross_val_score(model, X, y, cv=3)
    cv_accuracy = cv_scores.mean()
    
    results[name] = {
        'accuracy': accuracy,
        'f1': f1,
        'cv_accuracy': cv_accuracy,
        'model': model,
        'y_pred': y_pred
    }
    
    print(f"{name:<25} {accuracy:<10.3f} {f1:<10.3f} {cv_accuracy:<10.3f}")

# ========== 步骤5：详细评估 ==========

best_model_name = max(results, key=lambda k: results[k]['f1'])
best_model = results[best_model_name]['model']
y_pred = results[best_model_name]['y_pred']

print(f"\n最佳模型：{best_model_name}")
print(f"\n分类报告：")
print(classification_report(y_test, y_pred, target_names=['负面', '正面']))

# 混淆矩阵
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['负面', '正面'],
            yticklabels=['负面', '正面'])
plt.xlabel('预测标签')
plt.ylabel('真实标签')
plt.title('混淆矩阵')
plt.show()

# ========== 步骤6：特征重要性 ==========

# 逻辑回归的特征权重
if '逻辑回归' in results:
    lr_model = results['逻辑回归']['model'].named_steps['logisticregression']
    feature_names = vectorizer.get_feature_names_out()
    coef = lr_model.coef_[0]
    
    # 最重要的正面特征
    top_positive = np.argsort(coef)[-5:][::-1]
    # 最重要的负面特征
    top_negative = np.argsort(coef)[:5]
    
    print(f"\n最重要的正面特征：")
    for idx in top_positive:
        print(f"  '{feature_names[idx]}': {coef[idx]:.4f}")
    
    print(f"\n最重要的负面特征：")
    for idx in top_negative:
        print(f"  '{feature_names[idx]}': {coef[idx]:.4f}")

# ========== 步骤7：预测新评论 ==========

new_reviews = [
    "这个产品太棒了，非常喜欢",
    "质量很差，不推荐购买",
    "还行吧，没什么特别的",
    "超级好用，已经推荐给朋友了"
]

X_new = vectorizer.transform(new_reviews)
predictions = best_model.predict(X_new)
probabilities = best_model.predict_proba(X_new)

print(f"\n新评论预测：")
for review, pred, prob in zip(new_reviews, predictions, probabilities):
    sentiment = "正面" if pred == 1 else "负面"
    confidence = max(prob) * 100
    print(f"'{review}'")
    print(f"  → {sentiment}（置信度：{confidence:.1f}%）\n")
```

---

## 5 核心知识点总结

| 知识点 | 说明 | 项目应用 |
| --- | --- | --- |
| 问题定义 | 明确任务类型 | 回归/分类/NLP |
| 数据探索 | 了解数据分布 | 可视化、统计 |
| 特征工程 | 提取有效特征 | TF-IDF、缩放 |
| 模型选择 | 选择合适算法 | 对比多个模型 |
| 模型评估 | 评估性能 | 准确率、RMSE |
| 模型优化 | 调参改进 | 网格搜索 |
| 错误分析 | 分析预测错误 | 混淆矩阵 |
| 部署应用 | 预测新数据 | 实际应用 |

---

## 6 动手练习

### 练习 1：基础练习 - 回归项目

使用波士顿房价数据集完成回归项目。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# 加载数据
housing = fetch_california_housing()
X = housing.data
y = housing.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 训练模型
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"RMSE: {rmse:.3f}")
print(f"R²: {r2:.3f}")
```

</details>

### 练习 2：进阶练习 - 分类项目

使用鸢尾花数据集完成分类项目。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 训练模型
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 预测
y_pred = model.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2%}")
print(f"\n分类报告：")
print(classification_report(y_test, y_pred, target_names=iris.target_names))
```

</details>

### 练习 3（挑战）：综合练习 - 自定义数据集

创建自己的数据集并完成完整的机器学习项目。

<details>
<summary>点击查看答案</summary>

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# 创建自定义数据集
np.random.seed(42)
n_samples = 500

# 特征
age = np.random.randint(18, 70, n_samples)
income = np.random.randint(20000, 150000, n_samples)
score = np.random.randint(0, 100, n_samples)

# 标签（基于规则生成）
label = ((age > 30) & (income > 50000) & (score > 60)).astype(int)

# 创建DataFrame
df = pd.DataFrame({
    'age': age,
    'income': income,
    'score': score,
    'label': label
})

print("数据集信息：")
print(df.describe())
print(f"\n类别分布：")
print(df['label'].value_counts())

# 划分数据集
X = df[['age', 'income', 'score']]
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 训练模型
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# 预测
y_pred = model.predict(X_test_scaled)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"\n准确率: {accuracy:.2%}")
print(f"\n分类报告：")
print(classification_report(y_test, y_pred, target_names=['类别0', '类别1']))

# 预测新数据
new_data = np.array([[35, 80000, 75]])
new_data_scaled = scaler.transform(new_data)
prediction = model.predict(new_data_scaled)[0]
print(f"\n新数据预测: 类别{prediction}")
```

</details>

---

## 下一章预告

下一章我们会学习 **机器学习部署与进阶路线** —— 如何将模型部署到生产环境，以及后续的学习方向。你会学到模型序列化、API部署、MLOps等实用技术。
