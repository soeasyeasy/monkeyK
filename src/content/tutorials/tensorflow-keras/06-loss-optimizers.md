---
title: "第6章：损失函数与优化器"
description: "常用损失函数、SGD、Adam、学习率调度"
---

# 第6章：损失函数与优化器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是损失函数？为什么需要它？
- 交叉熵损失和均方误差有什么区别？什么时候用哪个？
- 优化器是怎么更新参数的？SGD 和 Adam 有什么区别？
- 学习率是什么？为什么要调整学习率？

这一章就是为了解答这些问题。损失函数和优化器是模型训练的**两大核心组件**——损失函数告诉模型"错得有多离谱"，优化器告诉模型"怎么调整参数才能错得少一点"。我们会先理解损失函数的原理，再学习各种优化器的工作方式，最后掌握学习率调度的技巧。

---

## 1 为什么需要损失函数和优化器？

### 痛点分析

假设你训练了一个模型预测房价。传统做法是：

1. 模型做出预测
2. 人工判断预测准不准
3. 凭感觉调整参数
4. 重复上述过程

问题来了：
- 怎么量化"准不准"？需要一个数学指标
- 怎么知道参数往哪个方向调？需要计算梯度
- 怎么知道调多少？需要控制更新幅度

这就像**蒙着眼睛下山**——你不知道山有多高（损失函数），也不知道哪边是下坡（梯度），更不知道一步迈多大（学习率）。

### 解决方案

TensorFlow 提供了完整的训练组件：

- **损失函数（Loss Function）**：量化预测值和真实值的差距
- **优化器（Optimizer）**：根据梯度更新参数，让损失变小
- **学习率（Learning Rate）**：控制每次更新的步长

打个比方：

> - **损失函数** 像**指南针**——告诉你偏离目标有多远
> - **优化器** 像**导航系统**——告诉你应该往哪走
> - **学习率** 像**油门**——控制你走多快

> **一句话总结**：损失函数衡量错误大小，优化器指导参数更新，学习率控制更新幅度。三者配合让模型不断变好。

---

## 2 核心原理

### 概念解释

**损失函数（Loss Function）** 是一个数学函数，用来衡量模型预测值和真实值之间的差距。损失越小，模型越好。

**优化器（Optimizer）** 是一个算法，用来更新模型参数（权重和偏置），让损失函数变小。

**学习率（Learning Rate）** 是一个超参数，控制每次参数更新的步长。

打个比方：

> 想象你在一个山谷里，要找到最低点（损失最小）：
> - **损失函数** 告诉你当前海拔有多高
> - **梯度** 告诉你哪边是下坡
> - **优化器** 决定你往哪走、走多远
> - **学习率** 决定你每步迈多大

### 训练流程

```
1. 前向传播：输入数据 -> 模型预测 -> 计算损失
2. 反向传播：计算梯度（损失对参数的导数）
3. 参数更新：优化器根据梯度和学习率更新参数
4. 重复 1-3，直到损失收敛
```

---

## 3 损失函数详解

### 回归问题：均方误差（MSE）

```python
import tensorflow as tf
from tensorflow import keras

# 均方误差：预测值和真实值的差的平方再求平均
# 公式：MSE = mean((y_pred - y_true)^2)

# 方式 1：使用函数
y_true = tf.constant([1.0, 2.0, 3.0, 4.0])     # 真实值
y_pred = tf.constant([1.5, 2.5, 2.5, 4.5])     # 预测值

mse = keras.losses.mean_squared_error(y_true, y_pred)
print(f"MSE: {mse.numpy()}")                    # 输出每个样本的损失

# 方式 2：使用类（可以配置）
mse_loss = keras.losses.MeanSquaredError()
loss_value = mse_loss(y_true, y_pred)
print(f"平均 MSE: {loss_value.numpy()}")        # 输出平均损失

# 在模型编译时使用
model.compile(
    optimizer='adam',
    loss='mean_squared_error',                  # 字符串形式
    metrics=['mae']
)

# 或者
model.compile(
    optimizer='adam',
    loss=keras.losses.MeanSquaredError(),       # 类实例形式
    metrics=['mae']
)
```

### 分类问题：交叉熵损失

```python
# 1. 二分类：二元交叉熵（Binary Crossentropy）
# 用于只有两个类别的情况（如猫/狗）

y_true = tf.constant([0, 1, 1, 0])             # 真实标签（0 或 1）
y_pred = tf.constant([0.1, 0.9, 0.8, 0.3])     # 预测概率（0-1 之间）

bce = keras.losses.binary_crossentropy(y_true, y_pred)
print(f"二元交叉熵: {bce.numpy()}")

# 在模型编译时使用
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 2. 多分类：分类交叉熵（Categorical Crossentropy）
# 用于多个类别的情况（如 0-9 数字识别）
# 标签需要是 one-hot 编码

y_true_onehot = tf.constant([
    [1, 0, 0],                                  # 类别 0
    [0, 1, 0],                                  # 类别 1
    [0, 0, 1],                                  # 类别 2
])
y_pred_prob = tf.constant([
    [0.9, 0.05, 0.05],                          # 预测概率
    [0.1, 0.8, 0.1],
    [0.2, 0.3, 0.5],
])

cce = keras.losses.categorical_crossentropy(y_true_onehot, y_pred_prob)
print(f"分类交叉熵: {cce.numpy()}")

# 3. 稀疏分类交叉熵（Sparse Categorical Crossentropy）
# 标签是整数（不是 one-hot），更省内存

y_true_sparse = tf.constant([0, 1, 2])          # 整数标签
y_pred_prob = tf.constant([
    [0.9, 0.05, 0.05],
    [0.1, 0.8, 0.1],
    [0.2, 0.3, 0.5],
])

scce = keras.losses.sparse_categorical_crossentropy(y_true_sparse, y_pred_prob)
print(f"稀疏分类交叉熵: {scce.numpy()}")

# 在模型编译时使用
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',     # 标签是整数时用这个
    metrics=['accuracy']
)
```

### 常用损失函数对比

| 损失函数 | 适用场景 | 标签格式 | 说明 |
| --- | --- | --- | --- |
| `mean_squared_error` | 回归 | 连续值 | 预测值和真实值的平方差 |
| `mean_absolute_error` | 回归 | 连续值 | 预测值和真实值的绝对差 |
| `binary_crossentropy` | 二分类 | 0 或 1 | 二元交叉熵 |
| `categorical_crossentropy` | 多分类 | one-hot | 分类交叉熵 |
| `sparse_categorical_crossentropy` | 多分类 | 整数 | 稀疏分类交叉熵 |
| `hinge` | 二分类（SVM） | -1 或 1 | 支持向量机损失 |
| `huber` | 回归（鲁棒） | 连续值 | 对异常值不敏感 |

---

## 4 优化器详解

### 随机梯度下降（SGD）

```python
import tensorflow as tf
from tensorflow import keras

# SGD 是最基础的优化器
# 公式：w = w - learning_rate * gradient

# 方式 1：字符串形式
model.compile(optimizer='sgd', loss='mse')

# 方式 2：类实例形式（可配置参数）
sgd = keras.optimizers.SGD(
    learning_rate=0.01,                         # 学习率
    momentum=0.9,                               # 动量（加速收敛）
    nesterov=False                              # 是否使用 Nesterov 动量
)
model.compile(optimizer=sgd, loss='mse')

# 手动使用优化器
optimizer = keras.optimizers.SGD(learning_rate=0.01)
w = tf.Variable(1.0)                            # 参数

with tf.GradientTape() as tape:
    loss = (w - 3) ** 2                         # 损失函数

grad = tape.gradient(loss, w)                   # 计算梯度
optimizer.apply_gradients([(grad, w)])          # 更新参数
print(f"更新后的 w: {w.numpy()}")               # w 会向 3 靠近
```

### Adam 优化器

```python
# Adam 是目前最常用的优化器
# 结合了动量和 RMSProp 的优点

# 方式 1：字符串形式
model.compile(optimizer='adam', loss='mse')

# 方式 2：类实例形式
adam = keras.optimizers.Adam(
    learning_rate=0.001,                        # 学习率（默认 0.001）
    beta_1=0.9,                                 # 一阶矩估计的指数衰减率
    beta_2=0.999,                               # 二阶矩估计的指数衰减率
    epsilon=1e-7,                               # 防止除以 0
    amsgrad=False                               # 是否使用 AMSGrad 变体
)
model.compile(optimizer=adam, loss='mse')
```

### 常用优化器对比

| 优化器 | 特点 | 学习率 | 适用场景 | 推荐度 |
| --- | --- | --- | --- | --- |
| `SGD` | 简单、稳定 | 需要手动调 | 小数据集、简单模型 | 中 |
| `SGD + momentum` | 加速收敛 | 需要手动调 | 需要快速训练 | 中 |
| `Adam` | 自适应学习率 | 默认 0.001 | 大多数场景（默认选择） | 高 |
| `RMSprop` | 自适应学习率 | 默认 0.001 | RNN、非平稳目标 | 中 |
| `Adagrad` | 稀疏数据好 | 默认 0.01 | 稀疏特征 | 低 |
| `AdamW` | Adam + 权重衰减 | 默认 0.001 | 需要正则化 | 高 |

### 学习率调度

```python
# 学习率不是一成不变的，可以动态调整

# 1. 指数衰减
scheduler = keras.optimizers.schedules.ExponentialDecay(
    initial_learning_rate=0.1,                  # 初始学习率
    decay_steps=10000,                          # 每 10000 步衰减一次
    decay_rate=0.9                              # 衰减率（每次乘以 0.9）
)
optimizer = keras.optimizers.SGD(learning_rate=scheduler)

# 2. 分段常数衰减
scheduler = keras.optimizers.schedules.PiecewiseConstantDecay(
    boundaries=[10000, 20000],                  # 边界步数
    values=[0.1, 0.05, 0.01]                    # 对应的学习率
)
optimizer = keras.optimizers.SGD(learning_rate=scheduler)

# 3. 余弦退火
scheduler = keras.optimizers.schedules.CosineDecay(
    initial_learning_rate=0.1,
    decay_steps=1000                            # 总步数
)
optimizer = keras.optimizers.SGD(learning_rate=scheduler)

# 4. 使用回调函数动态调整（后面会详细讲）
# ReduceLROnPlateau：当指标不再改善时降低学习率
callback = keras.callbacks.ReduceLROnPlateau(
    monitor='val_loss',                         # 监控验证集损失
    factor=0.5,                                 # 每次降低一半
    patience=5,                                 # 5 轮不改善就降低
    min_lr=1e-6                                 # 最小学习率
)
```

---

## 5 对比表格

### 损失函数选择指南

| 任务类型 | 推荐损失函数 | 输出层激活 | 标签格式 |
| --- | --- | --- | --- |
| 回归（预测连续值） | MSE / MAE | 无 / linear | 连续值 |
| 二分类 | Binary Crossentropy | sigmoid | 0 或 1 |
| 多分类（互斥） | Sparse Categorical CE | softmax | 整数 |
| 多分类（互斥） | Categorical CE | softmax | one-hot |
| 多分类（不互斥） | Binary CE | sigmoid | one-hot |
| 排序 / 排名 | Hinge Loss | 无 | -1 或 1 |

### 优化器选择指南

| 场景 | 推荐优化器 | 学习率建议 |
| --- | --- | --- |
| 快速原型 / 默认选择 | Adam | 0.001 |
| 需要精确控制 | SGD + momentum | 0.01 - 0.1 |
| 训练不稳定 | AdamW | 0.001 |
| RNN / LSTM | RMSprop | 0.001 |
| 稀疏数据 | Adagrad | 0.01 |
| 大规模数据 | Adam | 0.001 |

---

## 6 新手常见误区

### 误区 1："学习率越大，训练越快"

**错！** 学习率太大会导致：
- 参数更新过猛，来回震荡
- 损失不降反升
- 模型无法收敛

```python
# ❌ 错误：学习率太大
optimizer = keras.optimizers.SGD(learning_rate=10.0)  # 太大会发散

# ✅ 正确：合适的学习率
optimizer = keras.optimizers.SGD(learning_rate=0.01)  # 或 0.001
```

### 误区 2："Adam 一定比 SGD 好"

**不是的。** 各有优缺点：
- **Adam**：收敛快、对超参数不敏感，但可能泛化差
- **SGD**：收敛慢、需要调参，但泛化能力可能更好

✅ 建议：先用 Adam 快速验证，如果追求极致性能再换 SGD。

### 误区 3："损失函数可以随便选"

**错！** 损失函数必须和任务匹配：

```python
# ❌ 错误：二分类用分类交叉熵
model.compile(loss='categorical_crossentropy')  # 标签是 0/1 时会报错

# ✅ 正确：二分类用二元交叉熵
model.compile(loss='binary_crossentropy')

# ❌ 错误：回归用交叉熵
model.compile(loss='categorical_crossentropy')  # 回归任务不该用

# ✅ 正确：回归用均方误差
model.compile(loss='mean_squared_error')
```

### 误区 4："优化器不需要调参"

**不完全对。** 虽然 Adam 默认参数通常够用，但有时需要调整：

```python
# 如果训练不稳定，可以调整 Adam 参数
optimizer = keras.optimizers.Adam(
    learning_rate=0.0001,                       # 降低学习率
    beta_1=0.9,                                 # 调整动量
    beta_2=0.999,                               # 调整自适应学习率
    epsilon=1e-7                                # 增大防止除以 0
)
```

### 误区 5："损失越小，模型越好"

**不是的。** 损失小可能意味着**过拟合**——在训练集上表现好，但在新数据上表现差：

```python
# ❌ 错误：只看训练损失
print(f"训练损失: {train_loss}")  # 0.01 看起来很好

# ✅ 正确：同时看验证损失
print(f"训练损失: {train_loss}")  # 0.01
print(f"验证损失: {val_loss}")    # 0.5 过拟合了！
```

---

## 7 动手练习

### 练习 1：基础练习

搭建一个二分类模型，使用二元交叉熵损失和 Adam 优化器，训练一个简单的手写数字二分类任务（区分 0 和 1）。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras
import numpy as np

# 加载 MNIST 数据
(X_train, y_train), (X_test, y_test) = keras.datasets.mnist.load_data()

# 筛选 0 和 1 的数据
train_mask = (y_train == 0) | (y_train == 1)
test_mask = (y_test == 0) | (y_test == 1)

X_train = X_train[train_mask].astype('float32') / 255.0
y_train = y_train[train_mask]
X_test = X_test[test_mask].astype('float32') / 255.0
y_test = y_test[test_mask]

# 展平图片
X_train = X_train.reshape(-1, 28 * 28)
X_test = X_test.reshape(-1, 28 * 28)

# 搭建模型
model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(1, activation='sigmoid')  # 二分类用 sigmoid
])

# 编译模型
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='binary_crossentropy',                  # 二分类用二元交叉熵
    metrics=['accuracy']
)

# 训练模型
model.fit(X_train, y_train, epochs=5, validation_split=0.2)

# 评估
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"测试准确率: {test_acc:.4f}")
```

</details>

### 练习 2：进阶练习

对比 SGD 和 Adam 优化器在同一个任务上的训练速度和最终准确率。使用学习率调度器让学习率随训练逐渐减小。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras

# 加载数据
(X_train, y_train), (X_test, y_test) = keras.datasets.mnist.load_data()
X_train = X_train.astype('float32') / 255.0
X_test = X_test.astype('float32') / 255.0
X_train = X_train.reshape(-1, 28 * 28)
X_test = X_test.reshape(-1, 28 * 28)

# 搭建相同的模型
def create_model():
    return keras.Sequential([
        keras.layers.Dense(256, activation='relu', input_shape=(784,)),
        keras.layers.Dense(128, activation='relu'),
        keras.layers.Dense(10, activation='softmax')
    ])

# 1. 使用 SGD
model_sgd = create_model()
sgd = keras.optimizers.SGD(learning_rate=0.01, momentum=0.9)
model_sgd.compile(optimizer=sgd, loss='sparse_categorical_crossentropy', metrics=['accuracy'])
history_sgd = model_sgd.fit(X_train, y_train, epochs=10, validation_split=0.2, verbose=0)

# 2. 使用 Adam
model_adam = create_model()
adam = keras.optimizers.Adam(learning_rate=0.001)
model_adam.compile(optimizer=adam, loss='sparse_categorical_crossentropy', metrics=['accuracy'])
history_adam = model_adam.fit(X_train, y_train, epochs=10, validation_split=0.2, verbose=0)

# 对比结果
print(f"SGD 最终验证准确率: {history_sgd.history['val_accuracy'][-1]:.4f}")
print(f"Adam 最终验证准确率: {history_adam.history['val_accuracy'][-1]:.4f}")
```

</details>

### 练习 3（挑战）：综合练习

实现一个自定义损失函数（Focal Loss，用于处理类别不平衡问题），并搭建模型使用自定义损失进行训练。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras
import tensorflow.keras.backend as K

# 自定义 Focal Loss
def focal_loss(gamma=2.0, alpha=0.25):
    """
    Focal Loss: 降低易分类样本的权重，关注难分类样本
    gamma: 聚焦参数，越大越关注难分类样本
    alpha: 平衡正负样本权重
    """
    def loss(y_true, y_pred):
        # 计算交叉熵
        ce = K.binary_crossentropy(y_true, y_pred)
        # 计算调制因子
        pt = K.exp(-ce)
        # Focal Loss
        fl = alpha * K.pow(1 - pt, gamma) * ce
        return K.mean(fl)
    return loss

# 加载数据（模拟不平衡数据）
(X_train, y_train), (X_test, y_test) = keras.datasets.mnist.load_data()
X_train = X_train.astype('float32') / 255.0
X_test = X_test.astype('float32') / 255.0
X_train = X_train.reshape(-1, 28 * 28)
X_test = X_test.reshape(-1, 28 * 28)

# 搭建模型
model = keras.Sequential([
    keras.layers.Dense(256, activation='relu', input_shape=(784,)),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])

# 使用自定义损失函数编译
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss=focal_loss(gamma=2.0, alpha=0.25),
    metrics=['accuracy']
)

# 训练
model.fit(X_train, y_train, epochs=5, validation_split=0.2)

# 评估
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"测试准确率: {test_acc:.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **模型训练与评估**——也就是如何使用 `compile`、`fit`、`evaluate` 等方法完整地训练和评估模型。你会学到训练循环、验证集、测试集、模型保存加载、回调函数等核心内容。这是从"搭建模型"到"实际应用"的关键一步。
