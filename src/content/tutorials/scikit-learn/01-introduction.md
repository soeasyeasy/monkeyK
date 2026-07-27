---
title: "第1章：Scikit-learn 简介与环境搭建"
description: "什么是 Scikit-learn，核心优势，安装配置，第一个机器学习模型"
---

# 第1章：Scikit-learn 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Scikit-learn 是什么？为什么要学它？
- 它和 TensorFlow、PyTorch 有什么区别？
- 安装会不会很复杂？需要什么前置知识？
- 我完全不懂机器学习，能学会吗？

这一章就是为了解答这些问题。我们会先搞清楚 **Scikit-learn 的核心价值**，再动手搭建环境，最后用 5 行代码训练你的第一个机器学习模型。

---

## 1 为什么需要 Scikit-learn？

### 痛点分析

想象你要预测房价，传统做法是：

1. 手写数学公式计算线性回归
2. 自己实现梯度下降算法
3. 手动调参、评估模型
4. 写一堆重复代码处理数据

这就像**每次做饭都要从种菜开始**——太累了！

### 解决方案

Scikit-learn 就像一个**功能齐全的厨房**：

- 数据预处理工具一应俱全
- 经典算法开箱即用
- 模型评估标准化
- API 设计统一，学会一个就会用全部

> **一句话总结**：Scikit-learn 让机器学习变得像调用函数一样简单。

### 代码对比

**没有 Scikit-learn**（手写线性回归）：

```python
# 手动实现梯度下降
def gradient_descent(X, y, lr=0.01, epochs=1000):
    m = len(y)
    theta = np.zeros(X.shape[1])
    
    for _ in range(epochs):
        predictions = X.dot(theta)
        errors = predictions - y
        gradients = X.T.dot(errors) / m
        theta -= lr * gradients
    
    return theta

# 还要自己写评估函数、交叉验证...
```

**使用 Scikit-learn**：

```python
from sklearn.linear_model import LinearRegression

# 一行代码创建模型
model = LinearRegression()

# 一行代码训练
model.fit(X_train, y_train)

# 一行代码预测
predictions = model.predict(X_test)
```

---

## 2 核心原理

### 概念解释

Scikit-learn 是一个基于 Python 的**机器学习库**，它封装了常用的机器学习算法和数据处理工具。

打个比方：

> Scikit-learn 就像一个**瑞士军刀**——虽然不能造房子（深度学习），但日常任务（分类、回归、聚类）它都能轻松搞定。

### 核心特性

| 特性 | 说明 |
| --- | --- |
| 统一 API | 所有模型都有 `fit()`、`predict()` 方法 |
| 丰富算法 | 分类、回归、聚类、降维一应俱全 |
| 数据处理 | 标准化、编码、特征选择内置 |
| 模型评估 | 交叉验证、指标计算标准化 |
| 文档完善 | 示例丰富，新手友好 |

### 与其他库对比

| 库 | 定位 | 难度 | 适用场景 |
| --- | --- | --- | --- |
| Scikit-learn | 传统机器学习 | 低 | 中小规模数据、经典算法 |
| TensorFlow | 深度学习 | 高 | 图像、NLP、复杂神经网络 |
| PyTorch | 深度学习 | 中高 | 研究、动态图、灵活开发 |
| XGBoost | 集成学习 | 中 | 表格数据、竞赛 |

---

## 3 环境搭建

### 安装步骤

#### 1. 安装 Python

确保你已安装 Python 3.8+：

```bash
# 检查 Python 版本
python --version
```

#### 2. 创建虚拟环境（推荐）

```bash
# 创建虚拟环境
python -m venv sklearn-env

# 激活虚拟环境
# Windows:
sklearn-env\Scripts\activate
# macOS/Linux:
source sklearn-env/bin/activate
```

#### 3. 安装 Scikit-learn

```bash
# 使用 pip 安装
pip install scikit-learn

# 或使用 conda（推荐 Anaconda 用户）
conda install scikit-learn
```

#### 4. 验证安装

```python
import sklearn
print(f"Scikit-learn 版本: {sklearn.__version__}")
```

### 依赖库

Scikit-learn 依赖以下库（会自动安装）：

- **NumPy**：数值计算
- **SciPy**：科学计算
- **Joblib**：并行计算
- **Matplotlib**：数据可视化（需单独安装）

```bash
# 安装可视化相关库
pip install matplotlib seaborn pandas
```

---

## 4 第一个机器学习模型

### 完整示例

让我们用 Scikit-learn 训练一个鸢尾花分类器：

```python
# 导入所需库
from sklearn.datasets import load_iris  # 加载内置数据集
from sklearn.model_selection import train_test_split  # 划分训练集和测试集
from sklearn.ensemble import RandomForestClassifier  # 随机森林分类器
from sklearn.metrics import accuracy_score  # 准确率评估

# 1. 加载数据
iris = load_iris()  # 鸢尾花数据集，包含 150 个样本
X = iris.data  # 特征矩阵：花萼长度、花萼宽度、花瓣长度、花瓣宽度
y = iris.target  # 标签：0、1、2 分别代表三种鸢尾花

# 2. 划分数据集
# test_size=0.2 表示 20% 作为测试集
# random_state=42 确保每次运行结果一致
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. 创建模型
# n_estimators=100 表示使用 100 棵决策树
model = RandomForestClassifier(n_estimators=100, random_state=42)

# 4. 训练模型
model.fit(X_train, y_train)  # 用训练数据拟合模型

# 5. 预测
y_pred = model.predict(X_test)  # 对测试集进行预测

# 6. 评估
accuracy = accuracy_score(y_test, y_pred)  # 计算准确率
print(f"模型准确率: {accuracy:.2%}")  # 输出：模型准确率: 100.00%
```

### 代码解析

| 步骤 | 代码 | 作用 |
| --- | --- | --- |
| 加载数据 | `load_iris()` | 获取内置数据集 |
| 划分数据 | `train_test_split()` | 分离训练集和测试集 |
| 创建模型 | `RandomForestClassifier()` | 初始化算法 |
| 训练 | `model.fit()` | 让模型学习数据规律 |
| 预测 | `model.predict()` | 对新数据做预测 |
| 评估 | `accuracy_score()` | 衡量模型好坏 |

---

## 5 Scikit-learn 统一 API

### 核心方法

Scikit-learn 最强大的设计是**统一的 API**：

```python
# 所有模型都遵循这个模式
from sklearn.xxx import SomeModel

# 1. 创建模型
model = SomeModel()

# 2. 训练（拟合）
model.fit(X_train, y_train)

# 3. 预测
predictions = model.predict(X_test)

# 4. 评估
score = model.score(X_test, y_test)
```

### 对比不同模型

```python
# 线性回归
from sklearn.linear_model import LinearRegression
model1 = LinearRegression()
model1.fit(X_train, y_train)

# 决策树
from sklearn.tree import DecisionTreeRegressor
model2 = DecisionTreeRegressor()
model2.fit(X_train, y_train)

# 随机森林
from sklearn.ensemble import RandomForestRegressor
model3 = RandomForestRegressor()
model3.fit(X_train, y_train)

# 使用方式完全一样！
```

---

## 6 新手常见误区

### 误区 1："Scikit-learn 能做深度学习"

**错！** Scikit-learn 专注于**传统机器学习**，不支持深度学习（神经网络）。如果需要深度学习，应该用 TensorFlow 或 PyTorch。

### 误区 2："模型越复杂越好"

不是的。简单模型（如线性回归）在数据量小、特征少时往往更合适。复杂模型容易**过拟合**——在训练集上表现好，在新数据上表现差。

### 误区 3："训练集准确率 100% 就是好模型"

**错！** 这可能是过拟合的信号。一定要用**测试集**评估模型，或者使用**交叉验证**。

### 误区 4："不需要划分训练集和测试集"

**错！** 如果用训练数据评估模型，就像考试前把答案告诉学生——测不出真实水平。必须留出测试集。

### 误区 5："特征越多越好"

不是的。无关特征会干扰模型学习，甚至降低性能。需要做**特征选择**，只保留有用的特征。

---

## 7 动手练习

### 练习 1：基础练习

加载 Scikit-learn 内置的乳腺癌数据集（`load_breast_cancer`），查看数据集的特征数量和样本数量。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_breast_cancer

# 加载乳腺癌数据集
data = load_breast_cancer()

# 查看特征数量
print(f"特征数量: {data.data.shape[1]}")

# 查看样本数量
print(f"样本数量: {data.data.shape[0]}")

# 查看特征名称
print(f"特征名称: {data.feature_names[:5]}...")  # 只显示前 5 个

# 查看标签
print(f"标签类别: {data.target_names}")
```

</details>

### 练习 2：进阶练习

使用 `load_diabetes` 数据集，用线性回归模型训练并评估（提示：这是回归任务，用 `LinearRegression`）。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# 1. 加载数据
diabetes = load_diabetes()
X = diabetes.data
y = diabetes.target

# 2. 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 3. 创建并训练模型
model = LinearRegression()
model.fit(X_train, y_train)

# 4. 预测
y_pred = model.predict(X_test)

# 5. 评估（回归任务用 MSE 和 R²）
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"均方误差 (MSE): {mse:.2f}")
print(f"R² 分数: {r2:.2f}")
```

</details>

### 练习 3（挑战）：综合练习

用鸢尾花数据集，对比逻辑回归、决策树、SVM 三种分类器的准确率。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score

# 1. 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 2. 定义三个模型
models = {
    "逻辑回归": LogisticRegression(max_iter=200),
    "决策树": DecisionTreeClassifier(random_state=42),
    "SVM": SVC(kernel="linear", random_state=42)
}

# 3. 训练并评估
for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"{name} 准确率: {accuracy:.2%}")
```

</details>

---

## 8 下一章预告

下一章我们会学习 **数据加载与探索**——了解 Scikit-learn 内置的数据集，以及如何用 Pandas 和 Matplotlib 探索数据。你会学到如何加载自己的数据、查看数据分布、发现数据中的规律。
