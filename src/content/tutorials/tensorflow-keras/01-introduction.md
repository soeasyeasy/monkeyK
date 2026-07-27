---
title: "第1章：TensorFlow 与 Keras 简介"
description: "什么是 TensorFlow 和 Keras，核心优势，安装配置，第一个深度学习模型"
---

# 第1章：TensorFlow 与 Keras 简介

## 本章导读

在学这一章之前，你可能会有这些疑问：

- TensorFlow 和 Keras 到底是什么关系？为什么要一起学？
- 深度学习框架那么多（PyTorch、TensorFlow、JAX），为什么选 TensorFlow？
- 我的电脑没有 GPU，能学 TensorFlow 吗？
- 我数学不好、编程基础一般，能学会深度学习吗？

这一章就是为了解答这些问题。我们会先搞清楚 **TensorFlow 和 Keras 的核心价值**，再动手搭建环境，最后用几行代码训练你的第一个深度学习模型。学完这一章，你就能对深度学习有一个完整的感性认识。

---

## 1 为什么需要 TensorFlow 与 Keras？

### 痛点分析

想象你要做一个图片分类系统——让电脑识别一张照片是猫还是狗。传统做法是：

1. 手动设计特征提取规则（比如"有尖耳朵的是猫"）
2. 手写大量数学公式实现神经网络
3. 自己实现反向传播、梯度下降等算法
4. 手动管理 GPU 加速
5. 写一堆重复代码处理数据管道

这就像**每次做菜都要从盖房子、砌灶台开始**——太累了！

### 解决方案

TensorFlow + Keras 就像一个**全自动的智能厨房**：

- **TensorFlow** 是底层的"厨房基础设施"——提供强大的计算引擎，自动管理 GPU
- **Keras** 是上层的"智能菜谱系统"——用简洁的 API 搭积木一样搭建神经网络
- 两者结合，让你专注于"设计模型"，而不是"实现算法"

> **一句话总结**：TensorFlow 负责底层计算，Keras 负责上层接口，两者配合让深度学习变得像搭积木一样简单。

### 代码对比

**没有 TensorFlow/Keras**（手写神经网络）：

```python
import numpy as np

# 手动实现一个全连接层的前向传播
def forward(X, W, b):
    return np.dot(X, W) + b

# 手动实现 ReLU 激活函数
def relu(x):
    return np.maximum(0, x)

# 手动实现 softmax 交叉熵损失
def softmax_cross_entropy(logits, y):
    exp_logits = np.exp(logits - np.max(logits, axis=1, keepdims=True))
    probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
    loss = -np.mean(np.log(probs[range(len(y)), y] + 1e-8))
    return loss

# 还要自己写反向传播、梯度更新、数据加载...
# 几百行代码才能跑一个简单的模型
```

**使用 TensorFlow + Keras**：

```python
import tensorflow as tf
from tensorflow import keras

# 几行代码搭建一个神经网络
model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(784,)),  # 隐藏层
    keras.layers.Dense(10, activation='softmax')                      # 输出层
])

# 一行代码编译模型
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# 一行代码训练模型
model.fit(X_train, y_train, epochs=5)
```

---

## 2 核心原理

### 概念解释

**TensorFlow** 是 Google 在 2015 年开源的深度学习框架。它的核心思想是：**把计算表示成一张图（计算图），图中的节点是数学运算，边是数据流（张量）**。

打个比方：

> TensorFlow 就像一个**大型工厂的流水线**——原材料（数据）从一端进入，经过一道道工序（神经网络层），最终变成产品（预测结果）。工厂会自动优化每条流水线的效率，还能用多条流水线并行工作（GPU 加速）。

**Keras** 最初是一个独立的高级 API，后来被 TensorFlow 官方收编，成为 TensorFlow 2.x 的默认高层接口。

打个比方：

> Keras 就像**乐高积木的说明书**——你不需要关心每块积木怎么制造（底层计算），只需要按照说明书把积木拼起来（搭建模型），就能造出各种东西。

### TensorFlow 发展历程

| 版本 | 时间 | 核心变化 |
| --- | --- | --- |
| TensorFlow 1.x | 2015-2018 | 静态图模式，需要先建图再执行，代码复杂 |
| TensorFlow 2.x | 2019-至今 | 引入 Eager Execution（动态图），集成 Keras，代码更直观 |
| TensorFlow 2.16+ | 2024+ | 默认使用 Keras 3，支持多后端（JAX、PyTorch、Torch） |

### TensorFlow vs PyTorch vs JAX

| 特性 | TensorFlow + Keras | PyTorch | JAX |
| --- | --- | --- | --- |
| 上手难度 | 低（Keras 简洁） | 中 | 高 |
| 生产部署 | 强（TF Serving、TF Lite） | 中 | 弱 |
| 学术研究 | 中 | 强（动态图灵活） | 强 |
| 移动端支持 | 好（TF Lite） | 一般 | 无 |
| 社区生态 | 丰富 | 非常丰富 | 增长中 |
| 适合人群 | 初学者、工程师 | 研究者、开发者 | 高级研究者 |

---

## 3 环境搭建

### 安装步骤

#### 1. 安装 Python

确保你已安装 Python 3.9+：

```bash
# 检查 Python 版本
python --version
```

#### 2. 创建虚拟环境（推荐）

```bash
# 创建虚拟环境
python -m venv tf-env

# 激活虚拟环境
# Windows:
tf-env\Scripts\activate
# macOS/Linux:
source tf-env/bin/activate
```

#### 3. 安装 TensorFlow

```bash
# 使用 pip 安装 TensorFlow（自动包含 Keras）
pip install tensorflow

# 如果需要 GPU 支持（需要 NVIDIA GPU + CUDA）
# TensorFlow 2.x 已内置 GPU 支持，无需额外安装 CUDA 包
pip install tensorflow[and-cuda]
```

#### 4. 验证安装

```python
import tensorflow as tf           # 导入 TensorFlow
print(f"TensorFlow 版本: {tf.__version__}")  # 打印版本号

# 检查 GPU 是否可用
gpus = tf.config.list_physical_devices('GPU')  # 列出所有 GPU
print(f"可用 GPU 数量: {len(gpus)}")           # 打印 GPU 数量
if len(gpus) > 0:
    print("GPU 加速已启用！")
else:
    print("使用 CPU 运行（也能学习，只是慢一些）")
```

### 依赖库

TensorFlow 安装时会自动安装以下依赖：

- **NumPy**：数值计算
- **protobuf**：序列化协议
- **absl-py**：Google 工具库
- **h5py**：模型文件存储

```bash
# 安装辅助库（用于数据可视化和处理）
pip install matplotlib pandas seaborn scikit-learn
```

---

## 4 第一个深度学习模型

### 完整示例：手写数字识别

让我们用 TensorFlow + Keras 训练一个识别手写数字的模型（MNIST 数据集）：

```python
# 导入所需库
import tensorflow as tf                                    # 导入 TensorFlow
from tensorflow import keras                               # 导入 Keras
import matplotlib.pyplot as plt                             # 导入绘图库

# 1. 加载数据
# MNIST 是经典的手写数字数据集，包含 70000 张 28x28 的灰度图片
# 训练集 60000 张，测试集 10000 张
(X_train, y_train), (X_test, y_test) = keras.datasets.mnist.load_data()

# 2. 数据预处理
# 将像素值从 0-255 归一化到 0-1 之间，让模型更容易学习
X_train = X_train.astype('float32') / 255.0               # 训练集归一化
X_test = X_test.astype('float32') / 255.0                 # 测试集归一化

# 3. 搭建模型
# 使用 Sequential 按顺序堆叠层，像叠汉堡一样
model = keras.Sequential([
    # 第一层：展平层，把 28x28 的图片"拉平"成 784 的一维向量
    keras.layers.Flatten(input_shape=(28, 28)),
    # 第二层：全连接层，128 个神经元，ReLU 激活函数
    keras.layers.Dense(128, activation='relu'),
    # 第三层（输出层）：10 个神经元对应 0-9 十个数字
    keras.layers.Dense(10, activation='softmax')
])

# 4. 编译模型
# 指定优化器、损失函数和评估指标
model.compile(
    optimizer='adam',                                      # Adam 优化器
    loss='sparse_categorical_crossentropy',                # 稀疏交叉熵损失
    metrics=['accuracy']                                   # 评估指标：准确率
)

# 5. 训练模型
# epochs=5 表示把所有训练数据看 5 遍
history = model.fit(X_train, y_train, epochs=5, validation_split=0.1)

# 6. 评估模型
# 在测试集上评估模型表现
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"测试集准确率: {test_acc:.4f}")                     # 通常能达到 97%+

# 7. 进行预测
# 用训练好的模型预测测试集的前 5 张图片
predictions = model.predict(X_test[:5])
for i in range(5):
    predicted_digit = tf.argmax(predictions[i]).numpy()    # 取概率最大的索引
    print(f"图片 {i}: 预测是 {predicted_digit}, 实际是 {y_test[i]}")
```

### 代码解析

| 步骤 | 代码 | 作用 |
| --- | --- | --- |
| 加载数据 | `keras.datasets.mnist.load_data()` | 获取内置手写数字数据集 |
| 预处理 | `X / 255.0` | 归一化像素值到 0-1 |
| 搭建模型 | `keras.Sequential([...])` | 按顺序堆叠神经网络层 |
| 编译模型 | `model.compile(...)` | 配置优化器、损失函数、指标 |
| 训练 | `model.fit(...)` | 让模型从数据中学习规律 |
| 评估 | `model.evaluate(...)` | 在测试集上衡量模型表现 |
| 预测 | `model.predict(...)` | 用模型对新数据做预测 |

---

## 5 对比表格

### Keras 三种建模方式对比

| 方式 | 适用场景 | 灵活度 | 难度 |
| --- | --- | --- | --- |
| Sequential API | 简单的线性堆叠模型 | 低 | 低 |
| Functional API | 有分支、合并的复杂模型 | 中 | 中 |
| Model 子类化 | 需要完全自定义的模型 | 高 | 高 |

### TensorFlow 部署方式对比

| 方式 | 适用场景 | 说明 |
| --- | --- | --- |
| TF Serving | 服务器端部署 | 高性能、支持模型热更新 |
| TF Lite | 移动端/嵌入式 | 模型压缩、轻量推理 |
| TF.js | 浏览器端 | 在网页上运行模型 |
| SavedModel | 通用格式 | 跨平台保存和加载模型 |

---

## 6 新手常见误区

### 误区 1："必须先学完数学才能学 TensorFlow"

**不是的。** 虽然深度学习背后是数学，但 TensorFlow + Keras 已经把复杂的数学运算封装好了。你可以先学会"用"，再逐步理解"为什么"。就像你不需要懂发动机原理也能学开车。

### 误区 2："没有 GPU 就没法学深度学习"

**错！** GPU 能加速训练，但学习阶段用 CPU 完全够了。MNIST 这种小数据集，CPU 几分钟就能训练完。等你需要处理大数据集时，还可以用 Google Colab 免费 GPU。

### 误区 3："TensorFlow 1.x 和 2.x 是一样的"

**错！** TensorFlow 2.x 是一次大改版，核心变化是：
- 1.x 用"静态图"——先画图再执行，代码复杂
- 2.x 用"动态图"——边写边执行，像写普通 Python 代码
- 2.x 集成了 Keras 作为官方高级 API

✅ 现在学习直接用 TensorFlow 2.x + Keras 即可。

### 误区 4："Keras 只是一个独立的框架"

**不完全对。** Keras 最初是独立框架，但现在 TensorFlow 2.x 内置的 `tf.keras` 是官方推荐版本。两者 API 基本一致，但 `tf.keras` 能和 TensorFlow 的其他功能（如 `tf.data`、`tf.function`）无缝配合。

### 误区 5："模型层数越多、参数越多就越好"

**错！** 模型太复杂容易**过拟合**——在训练数据上表现很好，但在新数据上表现很差。就像背答案的学生，遇到新题就不会了。应该根据任务复杂度选择合适的模型大小。

---

## 7 动手练习

### 练习 1：基础练习

安装 TensorFlow 并验证安装成功，打印 TensorFlow 版本号，检查是否有可用的 GPU。

<details>
<summary>点击查看答案</summary>

```python
# 导入 TensorFlow 库
import tensorflow as tf

# 打印 TensorFlow 版本号
print(f"TensorFlow 版本: {tf.__version__}")

# 检查 GPU 是否可用
gpus = tf.config.list_physical_devices('GPU')  # 获取所有物理 GPU 设备
print(f"可用 GPU 数量: {len(gpus)}")           # 打印 GPU 数量

# 如果有 GPU，打印 GPU 详细信息
if len(gpus) > 0:
    for gpu in gpus:
        print(f"GPU 名称: {gpu.name}")         # 打印每块 GPU 的名称
else:
    print("当前使用 CPU 运行")
```

</details>

### 练习 2：进阶练习

使用 Keras 加载 Fashion-MNIST 数据集（比 MNIST 更有挑战性），搭建一个简单的全连接网络，训练 5 个 epoch 并评估准确率。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras

# 1. 加载 Fashion-MNIST 数据集
# 包含 70000 张 28x28 的灰度图片，共 10 个类别（T恤、裤子、套头衫等）
(X_train, y_train), (X_test, y_test) = keras.datasets.fashion_mnist.load_data()

# 2. 数据预处理：归一化到 0-1
X_train = X_train.astype('float32') / 255.0   # 训练集归一化
X_test = X_test.astype('float32') / 255.0     # 测试集归一化

# 3. 搭建模型
model = keras.Sequential([
    keras.layers.Flatten(input_shape=(28, 28)),  # 展平 28x28 -> 784
    keras.layers.Dense(256, activation='relu'),   # 隐藏层 256 个神经元
    keras.layers.Dense(128, activation='relu'),   # 隐藏层 128 个神经元
    keras.layers.Dense(10, activation='softmax')  # 输出层 10 个类别
])

# 4. 编译模型
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# 5. 训练模型
history = model.fit(X_train, y_train, epochs=5, validation_split=0.1)

# 6. 评估模型
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"测试集准确率: {test_acc:.4f}")
```

</details>

### 练习 3（挑战）：综合练习

在练习 2 的基础上，尝试修改网络结构（增加或减少层数、改变神经元数量），对比不同结构对训练速度和准确率的影响。用 `history.history` 画出训练过程的 loss 和 accuracy 曲线。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras
import matplotlib.pyplot as plt

# 加载数据
(X_train, y_train), (X_test, y_test) = keras.datasets.fashion_mnist.load_data()
X_train = X_train.astype('float32') / 255.0
X_test = X_test.astype('float32') / 255.0

# 搭建模型（尝试不同结构）
model = keras.Sequential([
    keras.layers.Flatten(input_shape=(28, 28)),
    keras.layers.Dense(512, activation='relu'),   # 更大的隐藏层
    keras.layers.Dropout(0.3),                     # 加入 Dropout 防止过拟合
    keras.layers.Dense(256, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# 训练模型，保存历史记录
history = model.fit(X_train, y_train, epochs=10, validation_split=0.1)

# 绘制训练曲线
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))  # 创建 1 行 2 列的子图

# 绘制损失曲线
ax1.plot(history.history['loss'], label='训练损失')         # 训练损失
ax1.plot(history.history['val_loss'], label='验证损失')     # 验证损失
ax1.set_title('损失曲线')                                   # 设置标题
ax1.set_xlabel('Epoch')                                     # 设置 x 轴标签
ax1.set_ylabel('Loss')                                      # 设置 y 轴标签
ax1.legend()                                                # 显示图例

# 绘制准确率曲线
ax2.plot(history.history['accuracy'], label='训练准确率')   # 训练准确率
ax2.plot(history.history['val_accuracy'], label='验证准确率')  # 验证准确率
ax2.set_title('准确率曲线')                                  # 设置标题
ax2.set_xlabel('Epoch')
ax2.set_ylabel('Accuracy')
ax2.legend()

plt.tight_layout()   # 自动调整布局
plt.show()           # 显示图表

# 评估
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"测试集准确率: {test_acc:.4f}")
```

</details>

---

## 下一章预告

下一章我们会学习 **TensorFlow 基础**——也就是 TensorFlow 的核心数据结构：张量（Tensor）。你会学到如何创建张量、索引切片、维度变换、数学运算等。这些是所有深度学习操作的"地基"，打好了后面的内容学起来会轻松很多。
