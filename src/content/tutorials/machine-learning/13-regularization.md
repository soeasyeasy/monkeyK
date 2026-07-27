---
title: "第13章：正则化与过拟合"
description: "L1/L2 正则化、Dropout、早停法、数据增强"
---

# 第13章：正则化与过拟合

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是过拟合？为什么会发生过拟合？
- 正则化是如何防止过拟合的？
- L1 和 L2 正则化有什么区别？
- 还有哪些方法可以防止过拟合？

这一章就是为了解答这些问题。过拟合是机器学习中最常见的问题之一，掌握正则化技术对构建可靠模型至关重要。

---

## 1 为什么需要正则化？

### 痛点分析

过拟合的表现：

```python
# 训练集准确率：99%
# 测试集准确率：70%

# 问题：模型记住了训练数据的噪声
# 在新数据上表现很差
```

过拟合的原因：

```
1. 模型太复杂
   - 参数太多
   - 网络层数太深

2. 数据太少
   - 样本数量不足
   - 特征维度太高

3. 训练太久
   - 迭代次数过多
   - 模型过度学习噪声
```

### 解决方案

正则化限制模型复杂度：

```python
# 正则化思路：
# 在损失函数中加入惩罚项
# 惩罚过大的参数值

# 打个比方：
# 正则化像"考试扣分"：
# - 答对题目加分
# - 答案太复杂扣分
# - 鼓励简洁的答案
```

打个比方：

> 正则化像"减肥"：模型太胖（参数太大）容易过拟合，正则化让模型保持苗条，更健壮。

> **一句话总结**：正则化通过惩罚复杂模型，防止过拟合，提高泛化能力。

---

## 2 核心原理

### L1 正则化（Lasso）

```python
# L1 正则化：在损失函数中加入参数的绝对值之和
# Loss = 原始损失 + λ * Σ|w|

# 特点：
# - 产生稀疏解（很多参数变为0）
# - 可以做特征选择
# - 适合高维稀疏数据

# 打个比方：
# L1像"断舍离"：不重要的特征直接丢弃（参数为0）
```

### L2 正则化（Ridge）

```python
# L2 正则化：在损失函数中加入参数的平方和
# Loss = 原始损失 + λ * Σw²

# 特点：
# - 参数趋向于小但不为0
# - 防止过拟合
# - 适合大多数场景

# 打个比方：
# L2像"节食"：所有特征都保留，但权重都减小
```

### Elastic Net

```python
# Elastic Net：L1 + L2 的组合
# Loss = 原始损失 + λ1 * Σ|w| + λ2 * Σw²

# 优点：
# - 结合L1和L2的优势
# - 既能特征选择，又能防止过拟合
```

### Dropout

```python
# Dropout：随机丢弃神经网络中的神经元
# 训练时：每次随机关闭一部分神经元
# 测试时：使用所有神经元，但权重减半

# 效果：
# - 防止神经元共适应
# - 相当于训练多个模型的集成
# - 提高泛化能力
```

---

## 3 基础用法

### L1/L2 正则化对比

```python
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import numpy as np

# 1. 生成数据（高维，容易过拟合）
X, y = make_regression(
    n_samples=100,
    n_features=50,
    n_informative=10,  # 只有10个有效特征
    noise=10,
    random_state=42
)

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 3. 不同模型对比
models = {
    '线性回归（无正则化）': LinearRegression(),
    'Ridge（L2）': Ridge(alpha=1.0),
    'Lasso（L1）': Lasso(alpha=0.1),
    'Elastic Net': ElasticNet(alpha=0.1, l1_ratio=0.5)
}

print("模型\t\t\t训练MSE\t\t测试MSE")
print("-" * 60)

for name, model in models.items():
    model.fit(X_train, y_train)
    
    # 训练集性能
    y_train_pred = model.predict(X_train)
    train_mse = mean_squared_error(y_train, y_train_pred)
    
    # 测试集性能
    y_test_pred = model.predict(X_test)
    test_mse = mean_squared_error(y_test, y_test_pred)
    
    print(f"{name:20s}\t{train_mse:.2f}\t\t{test_mse:.2f}")

# 4. 查看参数稀疏性
print("\n参数稀疏性（非零参数数量）：")
for name, model in models.items():
    n_nonzero = np.sum(model.coef_ != 0)
    print(f"{name:20s}: {n_nonzero}/{len(model.coef_)}")
```

### 正则化参数调优

```python
from sklearn.linear_model import RidgeCV, LassoCV
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split
import numpy as np

# 自动选择最佳正则化参数

# 1. 生成数据
X, y = make_regression(n_samples=100, n_features=50, noise=10, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 2. RidgeCV：自动选择最佳alpha
alphas = np.logspace(-3, 3, 100)  # 0.001到1000
ridge_cv = RidgeCV(alphas=alphas, cv=5)
ridge_cv.fit(X_train, y_train)

print(f"Ridge最佳alpha: {ridge_cv.alpha_:.4f}")
print(f"Ridge测试集R²: {ridge_cv.score(X_test, y_test):.3f}")

# 3. LassoCV：自动选择最佳alpha
lasso_cv = LassoCV(alphas=alphas, cv=5, max_iter=10000)
lasso_cv.fit(X_train, y_train)

print(f"\nLasso最佳alpha: {lasso_cv.alpha_:.4f}")
print(f"Lasso测试集R²: {lasso_cv.score(X_test, y_test):.3f}")

# 4. 查看Lasso选择的特征
selected_features = np.sum(lasso_cv.coef_ != 0)
print(f"Lasso选择的特征数: {selected_features}/{len(lasso_cv.coef_)}")
```

### 逻辑回归中的正则化

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
import numpy as np

# 逻辑回归中的正则化

# 1. 加载数据
data = load_breast_cancer()
X = data.data
y = data.target

# 2. 特征缩放
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. 不同正则化强度对比
# C参数：正则化强度的倒数
# C越小，正则化越强
# C越大，正则化越弱

Cs = [0.001, 0.01, 0.1, 1, 10, 100]
print("C值\t\t训练准确率\t测试准确率")
print("-" * 50)

for C in Cs:
    model = LogisticRegression(C=C, max_iter=10000, random_state=42)
    
    # 交叉验证
    scores = cross_val_score(model, X_scaled, y, cv=5, scoring='accuracy')
    
    # 训练集准确率
    model.fit(X_scaled, y)
    train_score = model.score(X_scaled, y)
    
    print(f"{C:6.3f}\t{train_score:.3f}\t\t{scores.mean():.3f}")

# 4. 不同正则化类型
# penalty: 'l1', 'l2', 'elasticnet', 'none'
# solver: 优化算法
#   - 'liblinear': 支持L1和L2
#   - 'saga': 支持所有类型

print("\n不同正则化类型对比：")
penalties = ['l1', 'l2']
for penalty in penalties:
    model = LogisticRegression(
        penalty=penalty,
        C=1.0,
        solver='liblinear',
        max_iter=10000,
        random_state=42
    )
    scores = cross_val_score(model, X_scaled, y, cv=5, scoring='accuracy')
    print(f"{penalty}正则化: {scores.mean():.3f}")
```

### 早停法

```python
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 早停法：当验证集性能不再提升时停止训练

# 1. 加载数据
digits = load_digits()
X = digits.data
y = digits.target

# 2. 划分训练集和验证集
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)

# 4. 创建模型（启用早停）
model = MLPClassifier(
    hidden_layer_sizes=(100, 50),
    max_iter=1000,           # 最大迭代次数
    early_stopping=True,     # 启用早停
    validation_fraction=0.1, # 10%作为验证集
    n_iter_no_change=10,     # 10次迭代没有提升就停止
    random_state=42,
    verbose=True
)

# 5. 训练
model.fit(X_train_scaled, y_train)

# 6. 查看结果
print(f"\n实际迭代次数: {model.n_iter_}")
print(f"训练集准确率: {model.score(X_train_scaled, y_train):.3f}")
print(f"验证集准确率: {model.score(X_val_scaled, y_val):.3f}")

# 7. 可视化训练过程
plt.figure(figsize=(10, 6))
plt.plot(model.loss_curve_, label='Training Loss')
if hasattr(model, 'validation_scores_'):
    plt.plot(model.validation_scores_, label='Validation Score')
plt.xlabel('Iteration')
plt.ylabel('Loss/Score')
plt.title('Training Process with Early Stopping')
plt.legend()
plt.grid(True)
plt.show()
```

### 数据增强

```python
import numpy as np
from sklearn.datasets import load_digits
import matplotlib.pyplot as plt

# 数据增强：通过变换增加训练数据

# 1. 加载数据
digits = load_digits()
X = digits.images  # 8x8图像
y = digits.target

# 2. 数据增强函数
def augment_image(image, noise_level=0.1):
    """对图像进行数据增强"""
    augmented = image.copy()
    
    # 添加噪声
    noise = np.random.normal(0, noise_level, image.shape)
    augmented += noise
    
    # 随机平移
    shift_x = np.random.randint(-1, 2)
    shift_y = np.random.randint(-1, 2)
    augmented = np.roll(augmented, shift_x, axis=0)
    augmented = np.roll(augmented, shift_y, axis=1)
    
    # 确保值在合理范围
    augmented = np.clip(augmented, 0, 16)
    
    return augmented

# 3. 可视化增强效果
fig, axes = plt.subplots(2, 5, figsize=(12, 5))
original = X[0]

# 原始图像
axes[0, 0].imshow(original, cmap='gray')
axes[0, 0].set_title('Original')
axes[0, 0].axis('off')

# 增强图像
for i in range(1, 5):
    augmented = augment_image(original)
    axes[0, i].imshow(augmented, cmap='gray')
    axes[0, i].set_title(f'Augmented {i}')
    axes[0, i].axis('off')

# 另一个样本
original2 = X[10]
axes[1, 0].imshow(original2, cmap='gray')
axes[1, 0].set_title('Original')
axes[1, 0].axis('off')

for i in range(1, 5):
    augmented = augment_image(original2)
    axes[1, i].imshow(augmented, cmap='gray')
    axes[1, i].set_title(f'Augmented {i}')
    axes[1, i].axis('off')

plt.tight_layout()
plt.show()

# 4. 使用增强数据训练
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 原始数据
X_flat = X.reshape(len(X), -1)
X_train, X_test, y_train, y_test = train_test_split(
    X_flat, y, test_size=0.3, random_state=42
)

# 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 训练模型
model = MLPClassifier(hidden_layer_sizes=(100,), max_iter=500, random_state=42)
model.fit(X_train_scaled, y_train)

print(f"原始数据训练准确率: {model.score(X_train_scaled, y_train):.3f}")
print(f"原始数据测试准确率: {model.score(X_test_scaled, y_test):.3f}")

# 使用增强数据
X_augmented = []
y_augmented = []

for x, label in zip(X_train, y_train):
    X_augmented.append(x)
    y_augmented.append(label)
    
    # 每个样本增强3次
    for _ in range(3):
        x_img = x.reshape(8, 8)
        x_aug = augment_image(x_img).flatten()
        X_augmented.append(x_aug)
        y_augmented.append(label)

X_augmented = np.array(X_augmented)
y_augmented = np.array(y_augmented)

# 特征缩放
scaler_aug = StandardScaler()
X_aug_scaled = scaler_aug.fit_transform(X_augmented)

# 训练模型
model_aug = MLPClassifier(hidden_layer_sizes=(100,), max_iter=500, random_state=42)
model_aug.fit(X_aug_scaled, y_augmented)

X_test_aug_scaled = scaler_aug.transform(X_test)
print(f"\n增强数据训练准确率: {model_aug.score(X_aug_scaled, y_augmented):.3f}")
print(f"增强数据测试准确率: {model_aug.score(X_test_aug_scaled, y_test):.3f}")
```

---

## 4 核心知识点总结

| 知识点 | 说明 | 适用场景 |
| --- | --- | --- |
| L1正则化 | 产生稀疏解 | 特征选择 |
| L2正则化 | 参数趋向小 | 防止过拟合 |
| Elastic Net | L1+L2组合 | 高维数据 |
| Dropout | 随机丢弃神经元 | 神经网络 |
| 早停法 | 验证集性能不再提升时停止 | 所有迭代算法 |
| 数据增强 | 通过变换增加数据 | 图像、文本 |
| 正则化参数 | 控制正则化强度 | 需要调优 |
| 过拟合 | 训练好，测试差 | 需要正则化 |

---

## 5 新手常见误区

### 误区 1："正则化越强越好"

**错！** 正则化太强会导致欠拟合，模型无法学习数据中的规律。需要通过交叉验证选择合适的正则化强度。

### 误区 2："L1 总是比 L2 好"

不是的。L1 产生稀疏解，适合特征选择。L2 更稳定，适合大多数场景。需要根据数据特点选择。

### 误区 3："正则化可以解决所有过拟合"

不是的。正则化只是防止过拟合的方法之一。还可以增加数据、简化模型、使用集成学习等。

### 误区 4："早停法会浪费训练时间"

**错！** 早停法可以防止过拟合，节省训练时间。关键是设置合适的验证集和停止条件。

### 误区 5："数据增强会引入噪声"

不是的。适度的数据增强可以提高模型鲁棒性。但增强要合理，不能引入错误的标签或破坏数据结构。

---

## 6 动手练习

### 练习 1：基础练习 - L1/L2 对比

对比 L1 和 L2 正则化的效果。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.linear_model import Ridge, Lasso
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import numpy as np

# 生成高维数据
X, y = make_regression(n_samples=100, n_features=50, n_informative=10, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# L2正则化
ridge = Ridge(alpha=1.0)
ridge.fit(X_train, y_train)
y_pred_ridge = ridge.predict(X_test)
mse_ridge = mean_squared_error(y_test, y_pred_ridge)

# L1正则化
lasso = Lasso(alpha=0.1)
lasso.fit(X_train, y_train)
y_pred_lasso = lasso.predict(X_test)
mse_lasso = mean_squared_error(y_test, y_pred_lasso)

print(f"Ridge MSE: {mse_ridge:.2f}")
print(f"Lasso MSE: {mse_lasso:.2f}")
print(f"\nRidge非零参数: {np.sum(ridge.coef_ != 0)}")
print(f"Lasso非零参数: {np.sum(lasso.coef_ != 0)}")
```

</details>

### 练习 2：进阶练习 - 正则化参数调优

使用交叉验证选择最佳正则化参数。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.linear_model import RidgeCV
from sklearn.datasets import load_boston
from sklearn.model_selection import train_test_split
import numpy as np

# 加载数据
from sklearn.datasets import make_regression
X, y = make_regression(n_samples=200, n_features=50, noise=10, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 自动选择最佳alpha
alphas = np.logspace(-3, 3, 100)
ridge_cv = RidgeCV(alphas=alphas, cv=5)
ridge_cv.fit(X_train, y_train)

print(f"最佳alpha: {ridge_cv.alpha_:.4f}")
print(f"测试集R²: {ridge_cv.score(X_test, y_test):.3f}")
```

</details>

### 练习 3（挑战）：综合练习 - 早停法实现

实现带早停法的训练过程。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 加载数据
iris = load_iris()
X = iris.data
y = iris.target

# 划分数据
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# 特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)

# 创建模型（启用早停）
model = MLPClassifier(
    hidden_layer_sizes=(50,),
    max_iter=1000,
    early_stopping=True,
    validation_fraction=0.2,
    n_iter_no_change=10,
    random_state=42
)

# 训练
model.fit(X_train_scaled, y_train)

print(f"实际迭代次数: {model.n_iter_}")
print(f"训练集准确率: {model.score(X_train_scaled, y_train):.3f}")
print(f"验证集准确率: {model.score(X_val_scaled, y_val):.3f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **深度学习入门** —— 神经网络的基础。你会学到神经网络结构、反向传播、激活函数等核心概念，以及如何使用 PyTorch 构建简单的神经网络。
