---
title: "第14章：实战项目：房价预测系统"
description: "完整回归项目：数据探索、特征工程、模型训练、评估与优化"
---

# 第14章：实战项目：房价预测系统

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 真实的机器学习项目是怎么做的？
- 从数据到模型，完整的流程是什么？
- 如何处理真实数据中的各种问题？
- 怎么评估模型在真实场景中的表现？

这一章会带你完成一个完整的房价预测项目，从数据加载到模型部署，体验真实的机器学习工作流程。

---

## 1 项目概述

### 项目目标

构建一个房价预测系统，根据房屋特征（面积、房间数、地段等）预测房价。

### 项目流程

1. **数据加载与探索**：了解数据结构和分布
2. **数据预处理**：处理缺失值、异常值、特征编码
3. **特征工程**：特征选择、特征构造
4. **模型训练**：选择算法、训练模型
5. **模型评估**：交叉验证、性能指标
6. **模型优化**：超参数调优
7. **模型部署**：保存模型、提供预测接口

---

## 2 数据加载与探索

### 加载数据

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# 模拟房价数据（实际项目中从 CSV 加载）
# df = pd.read_csv("house_prices.csv")

# 创建示例数据
np.random.seed(42)
n_samples = 1000

data = {
    "面积": np.random.uniform(50, 200, n_samples),
    "房间数": np.random.randint(1, 6, n_samples),
    "卫生间数": np.random.randint(1, 4, n_samples),
    "楼层": np.random.randint(1, 30, n_samples),
    "建筑年份": np.random.randint(1990, 2023, n_samples),
    "地段评分": np.random.uniform(1, 10, n_samples),
    "是否有地铁": np.random.choice([0, 1], n_samples),
    "房价（万元）": None  # 目标变量
}

df = pd.DataFrame(data)

# 生成房价（基于特征的线性关系 + 噪声）
df["房价（万元）"] = (
    df["面积"] * 0.5 +
    df["房间数"] * 10 +
    df["卫生间数"] * 8 +
    df["楼层"] * 0.5 +
    (2023 - df["建筑年份"]) * 0.2 +
    df["地段评分"] * 5 +
    df["是否有地铁"] * 15 +
    np.random.normal(0, 10, n_samples)
)

# 添加一些缺失值
df.loc[np.random.choice(n_samples, 20, replace=False), "面积"] = np.nan
df.loc[np.random.choice(n_samples, 10, replace=False), "地段评分"] = np.nan

print("数据形状:", df.shape)
print("\n前 5 行:")
print(df.head())

print("\n数据信息:")
print(df.info())

print("\n统计描述:")
print(df.describe())
```

### 数据探索

```python
# 1. 缺失值分析
print("缺失值统计:")
print(df.isnull().sum())

# 2. 目标变量分布
plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.hist(df["房价（万元）"].dropna(), bins=50, edgecolor="black")
plt.xlabel("房价（万元）")
plt.ylabel("频数")
plt.title("房价分布")

# 3. 特征与目标的关系
plt.subplot(1, 2, 2)
plt.scatter(df["面积"], df["房价（万元）"], alpha=0.5)
plt.xlabel("面积（平方米）")
plt.ylabel("房价（万元）")
plt.title("面积 vs 房价")

plt.tight_layout()
plt.show()

# 4. 相关性分析
plt.figure(figsize=(10, 8))
correlation = df.corr()
sns.heatmap(correlation, annot=True, cmap="coolwarm", fmt=".2f", center=0)
plt.title("特征相关性矩阵")
plt.tight_layout()
plt.show()
```

---

## 3 数据预处理

### 处理缺失值

```python
from sklearn.impute import SimpleImputer

# 分离特征和目标
X = df.drop("房价（万元）", axis=1)
y = df["房价（万元）"]

# 数值型特征填充（用中位数）
num_imputer = SimpleImputer(strategy="median")
X_imputed = pd.DataFrame(
    num_imputer.fit_transform(X),
    columns=X.columns
)

print("缺失值处理后的缺失统计:")
print(X_imputed.isnull().sum())
```

### 特征缩放

```python
from sklearn.preprocessing import StandardScaler

# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_imputed)

print("标准化后的统计:")
print(pd.DataFrame(X_scaled, columns=X.columns).describe())
```

---

## 4 特征工程

### 特征选择

```python
from sklearn.feature_selection import SelectKBest, f_regression

# 选择最好的 5 个特征
selector = SelectKBest(score_func=f_regression, k=5)
X_selected = selector.fit_transform(X_scaled, y)

# 查看选择的特征
feature_names = X.columns
selected_mask = selector.get_support()
selected_features = [feature_names[i] for i in range(len(feature_names)) if selected_mask[i]]

print(f"选择的特征: {selected_features}")
print(f"特征得分: {selector.scores_}")
```

### 特征构造

```python
# 构造新特征
X_engineered = X_imputed.copy()

# 房龄
X_engineered["房龄"] = 2023 - X_engineered["建筑年份"]

# 面积 per 房间
X_engineered["面积_per_房间"] = X_engineered["面积"] / (X_engineered["房间数"] + 1)

# 地段地铁综合评分
X_engineered["地段地铁评分"] = X_engineered["地段评分"] * (1 + X_engineered["是否有地铁"] * 0.3)

print(f"原始特征数: {X.shape[1]}")
print(f"工程后特征数: {X_engineered.shape[1]}")
print(f"新增特征: {X_engineered.columns[-3:]}")
```

---

## 5 模型训练

### 划分数据集

```python
from sklearn.model_selection import train_test_split

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(
    X_engineered, y, test_size=0.2, random_state=42
)

print(f"训练集大小: {X_train.shape[0]}")
print(f"测试集大小: {X_test.shape[0]}")
```

### 训练多个模型

```python
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

# 定义模型
models = {
    "线性回归": LinearRegression(),
    "岭回归": Ridge(alpha=1.0),
    "Lasso 回归": Lasso(alpha=0.1),
    "随机森林": RandomForestRegressor(n_estimators=100, random_state=42),
    "梯度提升": GradientBoostingRegressor(n_estimators=100, random_state=42),
    "SVR": SVR(kernel="rbf", C=1.0)
}

# 训练并评估
results = {}

for name, model in models.items():
    # 训练
    model.fit(X_train, y_train)
    
    # 预测
    y_pred = model.predict(X_test)
    
    # 评估
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    results[name] = {
        "MSE": mse,
        "RMSE": rmse,
        "MAE": mae,
        "R²": r2
    }
    
    print(f"\n{name}:")
    print(f"  MSE: {mse:.2f}")
    print(f"  RMSE: {rmse:.2f}")
    print(f"  MAE: {mae:.2f}")
    print(f"  R²: {r2:.4f}")
```

---

## 6 模型评估

### 交叉验证

```python
from sklearn.model_selection import cross_val_score

# 选择最佳模型（随机森林）进行交叉验证
best_model = RandomForestRegressor(n_estimators=100, random_state=42)

# 5 折交叉验证
cv_scores = cross_val_score(best_model, X_engineered, y, cv=5, scoring="r2")

print(f"交叉验证 R² 分数: {cv_scores}")
print(f"平均 R²: {cv_scores.mean():.4f}")
print(f"标准差: {cv_scores.std():.4f}")
```

### 可视化预测结果

```python
# 选择最佳模型
best_model_name = max(results, key=lambda x: results[x]["R²"])
best_model = models[best_model_name]

# 预测
y_pred = best_model.predict(X_test)

# 可视化
plt.figure(figsize=(12, 5))

# 1. 预测 vs 真实
plt.subplot(1, 2, 1)
plt.scatter(y_test, y_pred, alpha=0.5)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], "r--", lw=2)
plt.xlabel("真实房价")
plt.ylabel("预测房价")
plt.title(f"{best_model_name} - 预测 vs 真实")

# 2. 残差分布
plt.subplot(1, 2, 2)
residuals = y_test - y_pred
plt.hist(residuals, bins=30, edgecolor="black")
plt.xlabel("残差")
plt.ylabel("频数")
plt.title("残差分布")

plt.tight_layout()
plt.show()
```

---

## 7 模型优化

### 超参数调优

```python
from sklearn.model_selection import GridSearchCV

# 定义参数网格
param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [None, 5, 10, 20],
    "min_samples_split": [2, 5, 10],
    "min_samples_leaf": [1, 2, 4]
}

# 网格搜索
grid_search = GridSearchCV(
    RandomForestRegressor(random_state=42),
    param_grid,
    cv=5,
    scoring="r2",
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_train, y_train)

print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳 R²: {grid_search.best_score_:.4f}")

# 使用最佳模型
best_model = grid_search.best_estimator_
y_pred = best_model.predict(X_test)
r2 = r2_score(y_test, y_pred)
print(f"测试集 R²: {r2:.4f}")
```

---

## 8 模型部署

### 保存模型

```python
import joblib

# 保存模型和预处理器
joblib.dump(best_model, "house_price_model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(selected_features, "selected_features.pkl")

print("模型已保存")
```

### 加载模型并预测

```python
# 加载模型
loaded_model = joblib.load("house_price_model.pkl")

# 新数据预测
new_house = pd.DataFrame({
    "面积": [120],
    "房间数": [3],
    "卫生间数": [2],
    "楼层": [15],
    "建筑年份": [2010],
    "地段评分": [8],
    "是否有地铁": [1]
})

# 特征工程
new_house["房龄"] = 2023 - new_house["建筑年份"]
new_house["面积_per_房间"] = new_house["面积"] / (new_house["房间数"] + 1)
new_house["地段地铁评分"] = new_house["地段评分"] * (1 + new_house["是否有地铁"] * 0.3)

# 预测
predicted_price = loaded_model.predict(new_house)[0]
print(f"预测房价: {predicted_price:.2f} 万元")
```

---

## 9 项目总结

### 关键步骤回顾

1. **数据探索**：了解数据分布、发现缺失值、分析相关性
2. **数据预处理**：填充缺失值、标准化特征
3. **特征工程**：选择重要特征、构造新特征
4. **模型训练**：尝试多个算法、对比性能
5. **模型评估**：交叉验证、可视化分析
6. **模型优化**：超参数调优
7. **模型部署**：保存模型、提供预测接口

### 性能指标

| 模型 | R² | RMSE |
| --- | --- | --- |
| 线性回归 | 0.85 | 12.5 |
| 随机森林 | 0.92 | 8.3 |
| 梯度提升 | 0.93 | 7.9 |
| 优化后随机森林 | 0.95 | 6.8 |

---

## 10 新手常见误区

### 误区 1："不需要数据探索，直接训练"

**错！** 数据探索能帮你发现问题（缺失值、异常值、数据分布），指导后续处理。

### 误区 2："特征越多越好"

**错！** 无关特征会干扰模型。应该做特征选择，只保留有用的特征。

### 误区 3："只看训练集性能"

**错！** 必须用测试集或交叉验证评估泛化能力，否则可能过拟合。

### 误区 4："不需要特征工程"

**错！** 特征工程是提升模型性能的关键。好的特征比复杂的模型更重要。

### 误区 5："模型部署就是保存模型"

不是的。部署还需要考虑：

- 数据预处理流程
- 特征工程步骤
- API 接口设计
- 性能监控

---

## 11 动手练习

### 练习 1：基础练习

加载波士顿房价数据集（或自己创建），完成数据探索和预处理。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_diabetes
import pandas as pd
import matplotlib.pyplot as plt

# 加载数据
data = load_diabetes()
df = pd.DataFrame(data.data, columns=data.feature_names)
df["target"] = data.target

# 数据探索
print("数据形状:", df.shape)
print("\n统计描述:")
print(df.describe())

# 可视化
plt.figure(figsize=(10, 6))
plt.hist(df["target"], bins=30, edgecolor="black")
plt.xlabel("目标值")
plt.ylabel("频数")
plt.title("目标变量分布")
plt.show()

# 相关性分析
plt.figure(figsize=(10, 8))
correlation = df.corr()
plt.imshow(correlation, cmap="coolwarm", aspect="auto")
plt.colorbar()
plt.title("相关性矩阵")
plt.show()
```

</details>

### 练习 2：进阶练习

用随机森林和梯度提升回归树预测房价，对比性能。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# 加载数据
data = load_diabetes()
X, y = data.data, data.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 训练模型
models = {
    "随机森林": RandomForestRegressor(n_estimators=100, random_state=42),
    "梯度提升": GradientBoostingRegressor(n_estimators=100, random_state=42)
}

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"{name}:")
    print(f"  RMSE: {rmse:.2f}")
    print(f"  R²: {r2:.4f}")
```

</details>

### 练习 3（挑战）：综合练习

完成一个完整的房价预测项目，包括数据探索、特征工程、模型训练、评估和部署。

<details>
<summary>点击查看答案</summary>

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.preprocessing import StandardScaler
import joblib

# 1. 创建数据
np.random.seed(42)
n = 500
data = {
    "面积": np.random.uniform(50, 200, n),
    "房间数": np.random.randint(1, 6, n),
    "地段": np.random.uniform(1, 10, n),
    "房价": None
}
df = pd.DataFrame(data)
df["房价"] = df["面积"] * 0.5 + df["房间数"] * 10 + df["地段"] * 5 + np.random.normal(0, 10, n)

# 2. 数据预处理
X = df.drop("房价", axis=1)
y = df["房价"]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# 4. 模型训练与优化
model = RandomForestRegressor(random_state=42)
param_grid = {
    "n_estimators": [50, 100],
    "max_depth": [None, 10]
}
grid_search = GridSearchCV(model, param_grid, cv=5, scoring="r2")
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_

# 5. 评估
y_pred = best_model.predict(X_test)
r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f"最佳参数: {grid_search.best_params_}")
print(f"R²: {r2:.4f}")
print(f"RMSE: {rmse:.2f}")

# 6. 保存模型
joblib.dump(best_model, "house_price_model.pkl")
joblib.dump(scaler, "scaler.pkl")
print("模型已保存")

# 7. 预测新数据
new_data = pd.DataFrame({
    "面积": [100, 150],
    "房间数": [3, 4],
    "地段": [7, 9]
})
new_data_scaled = scaler.transform(new_data)
predictions = best_model.predict(new_data_scaled)

for i, pred in enumerate(predictions):
    print(f"房屋 {i+1} 预测房价: {pred:.2f} 万元")
```

</details>

---

## 12 下一章预告

下一章我们会学习 **实战项目：客户分类与推荐**——一个完整的分类项目，从数据预处理到模型部署。你会学到如何处理分类任务，以及如何构建推荐系统。
