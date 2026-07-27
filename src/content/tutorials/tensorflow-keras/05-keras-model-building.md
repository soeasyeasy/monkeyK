---
title: "第5章：Keras 模型构建"
description: "Sequential API、Functional API、Model 子类化、模型结构"
---

# 第5章：Keras 模型构建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Keras 有三种建模方式，我该用哪种？
- Sequential API 和 Functional API 有什么区别？
- 什么时候需要用 Model 子类化？
- 怎么查看和修改模型结构？

这一章就是为了解答这些问题。模型构建是深度学习的核心环节——就像盖房子要先画图纸一样，搭好模型结构才能开始训练。我们会从最简单的 Sequential API 开始，逐步学习 Functional API 和 Model 子类化，最后学会查看和分析模型结构。

---

## 1 为什么需要不同的建模方式？

### 痛点分析

假设你要搭建一个神经网络。最简单的方式是：

```python
# 一层一层往上叠
model.add(Dense(128))
model.add(Dense(64))
model.add(Dense(10))
```

但问题来了：
- 如果模型有分支（像 ResNet 的跳跃连接）怎么办？
- 如果模型有多个输入或多个输出怎么办？
- 如果需要完全自定义模型的行为怎么办？

这就像**盖房子**——简单的平房用预制板就行（Sequential），但复杂的别墅需要定制设计（Functional/子类化）。

### 解决方案

Keras 提供三种建模方式，适应不同复杂度：

| 方式 | 适用场景 | 类比 |
| --- | --- | --- |
| Sequential API | 简单的线性堆叠 | 预制板盖平房 |
| Functional API | 有分支、合并的复杂模型 | 定制设计别墅 |
| Model 子类化 | 需要完全自定义的模型 | 自己设计一切 |

> **一句话总结**：简单模型用 Sequential，复杂模型用 Functional，需要极致灵活用子类化。

---

## 2 核心原理

### 概念解释

Keras 的三种建模方式本质上都是在做同一件事：**定义输入到输出的映射关系**。区别在于灵活度和代码风格。

打个比方：

> - **Sequential** 像**流水线**——原材料从一端进入，经过一道道工序，从另一端出来。简单直接，但不能有分支。
> - **Functional** 像**电路图**——可以有多条线路、分支、合并，但整体结构是固定的。
> - **Model 子类化** 像**编程**——你可以用 Python 代码定义任何逻辑，最灵活但也最复杂。

---

## 3 基础用法

### Sequential API

```python
import tensorflow as tf
from tensorflow import keras

# 方式 1：逐层添加
model = keras.Sequential()
model.add(keras.layers.Dense(128, activation='relu', input_shape=(784,)))  # 隐藏层 1
model.add(keras.layers.Dropout(0.3))                                       # Dropout 层
model.add(keras.layers.Dense(64, activation='relu'))                       # 隐藏层 2
model.add(keras.layers.Dense(10, activation='softmax'))                    # 输出层

# 方式 2：一次性传入层列表（更简洁）
model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(784,)),  # 隐藏层 1
    keras.layers.Dropout(0.3),                                       # Dropout 层
    keras.layers.Dense(64, activation='relu'),                       # 隐藏层 2
    keras.layers.Dense(10, activation='softmax')                     # 输出层
])

# 查看模型结构
model.summary()
```

### Functional API

```python
import tensorflow as tf
from tensorflow import keras

# 1. 定义输入
inputs = keras.Input(shape=(784,))              # 输入层，784 维

# 2. 定义隐藏层
x = keras.layers.Dense(128, activation='relu')(inputs)   # 隐藏层 1
x = keras.layers.Dropout(0.3)(x)                         # Dropout
x = keras.layers.Dense(64, activation='relu')(x)         # 隐藏层 2

# 3. 定义输出
outputs = keras.layers.Dense(10, activation='softmax')(x)  # 输出层

# 4. 创建模型
model = keras.Model(inputs=inputs, outputs=outputs)

# 查看模型结构
model.summary()
```

### Functional API 的高级用法

```python
# 多输入模型
input_a = keras.Input(shape=(10,), name="input_a")   # 输入 A
input_b = keras.Input(shape=(5,), name="input_b")    # 输入 B

# 分别处理
x_a = keras.layers.Dense(32, activation='relu')(input_a)
x_b = keras.layers.Dense(16, activation='relu')(input_b)

# 合并
merged = keras.layers.Concatenate()([x_a, x_b])      # 拼接
x = keras.layers.Dense(64, activation='relu')(merged)
outputs = keras.layers.Dense(1, activation='sigmoid')(x)

model = keras.Model(inputs=[input_a, input_b], outputs=outputs)

# 多输出模型
inputs = keras.Input(shape=(100,))
x = keras.layers.Dense(64, activation='relu')(inputs)

# 两个输出分支
output_main = keras.layers.Dense(10, activation='softmax', name="main_output")(x)
output_aux = keras.layers.Dense(5, activation='sigmoid', name="aux_output")(x)

model = keras.Model(inputs=inputs, outputs=[output_main, output_aux])
```

### Model 子类化

```python
import tensorflow as tf
from tensorflow import keras

class MyModel(keras.Model):
    """自定义模型"""
    
    def __init__(self):
        super(MyModel, self).__init__()
        # 定义层
        self.dense1 = keras.layers.Dense(128, activation='relu')
        self.dropout = keras.layers.Dropout(0.3)
        self.dense2 = keras.layers.Dense(64, activation='relu')
        self.output_layer = keras.layers.Dense(10, activation='softmax')
    
    def call(self, inputs, training=False):
        """前向传播"""
        x = self.dense1(inputs)
        x = self.dropout(x, training=training)  # training 模式影响 Dropout
        x = self.dense2(x)
        outputs = self.output_layer(x)
        return outputs

# 创建模型实例
model = MyModel()

# 使用前需要先调用一次（构建模型）
model(tf.zeros((1, 784)))  # 用假数据构建模型
model.summary()
```

---

## 4 常用层详解

### 全连接层（Dense）

```python
# Dense 层是最基本的层
layer = keras.layers.Dense(
    units=128,                              # 神经元数量
    activation='relu',                      # 激活函数
    use_bias=True,                          # 是否使用偏置
    kernel_initializer='glorot_uniform',    # 权重初始化方式
    bias_initializer='zeros',               # 偏置初始化方式
    kernel_regularizer=None,                # 权重正则化
    input_shape=(784,)                      # 输入形状（只在第一层需要）
)
```

### Dropout 层

```python
# Dropout 用于防止过拟合
dropout = keras.layers.Dropout(
    rate=0.3,                               # 丢弃比例（30% 的神经元被随机关闭）
    seed=None                               # 随机种子
)
```

### BatchNormalization 层

```python
# 批归一化，加速训练
bn = keras.layers.BatchNormalization(
    axis=-1,                                # 归一化的轴
    momentum=0.99,                          # 动量
    epsilon=0.001                           # 小常数，防止除以 0
)
```

### 常用层对比

| 层类型 | 作用 | 参数 | 适用场景 |
| --- | --- | --- | --- |
| `Dense` | 全连接层 | `units`, `activation` | 特征提取、分类 |
| `Dropout` | 随机丢弃 | `rate` | 防止过拟合 |
| `BatchNormalization` | 批归一化 | `axis`, `momentum` | 加速训练 |
| `Flatten` | 展平 | 无 | 2D -> 1D |
| `Reshape` | 变形 | `target_shape` | 改变形状 |
| `Embedding` | 词嵌入 | `input_dim`, `output_dim` | 文本处理 |

---

## 5 对比表格

### 三种建模方式对比

| 特性 | Sequential | Functional | Model 子类化 |
| --- | --- | --- | --- |
| 灵活度 | 低 | 中 | 高 |
| 代码复杂度 | 低 | 中 | 高 |
| 支持多输入 | 否 | 是 | 是 |
| 支持多输出 | 否 | 是 | 是 |
| 支持分支/合并 | 否 | 是 | 是 |
| 支持自定义逻辑 | 否 | 否 | 是 |
| 模型可视化 | 支持 | 支持 | 有限 |
| 推荐场景 | 简单线性模型 | 复杂结构模型 | 研究/高度定制 |

### 常用激活函数对比

| 激活函数 | 公式 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| `relu` | max(0, x) | 计算快、缓解梯度消失 | 神经元死亡 | 隐藏层（默认选择） |
| `sigmoid` | 1/(1+e^-x) | 输出 0-1 | 梯度消失 | 二分类输出 |
| `softmax` | e^x / sum(e^x) | 输出概率分布 | 计算量大 | 多分类输出 |
| `tanh` | (e^x - e^-x)/(e^x + e^-x) | 输出 -1 到 1 | 梯度消失 | RNN |
| `leaky_relu` | max(0.01x, x) | 解决神经元死亡 | 效果不稳定 | 隐藏层 |

---

## 6 新手常见误区

### 误区 1："Sequential 能搞定所有模型"

**错！** Sequential 只能处理线性堆叠的层，无法处理：
- 多输入/多输出
- 分支结构（如 ResNet 的跳跃连接）
- 需要共享层的模型

✅ 遇到复杂结构，用 Functional API。

### 误区 2："Functional API 和 Sequential 性能不同"

**不是的。** 两种方式构建的相同模型，性能完全一样。区别只是代码风格：

```python
# ✅ 这两种写法完全等价

# Sequential 方式
model1 = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(10,)),
    keras.layers.Dense(1, activation='sigmoid')
])

# Functional 方式
inputs = keras.Input(shape=(10,))
x = keras.layers.Dense(64, activation='relu')(inputs)
outputs = keras.layers.Dense(1, activation='sigmoid')(x)
model2 = keras.Model(inputs, outputs)
```

### 误区 3："子类化模型不能用 model.summary()"

**不完全对。** 子类化模型需要先"构建"才能查看结构：

```python
class MyModel(keras.Model):
    def __init__(self):
        super().__init__()
        self.dense = keras.layers.Dense(10)
    
    def call(self, inputs):
        return self.dense(inputs)

model = MyModel()
# model.summary()  # 这会报错，模型还没构建

# ✅ 正确：先调用一次
model(tf.zeros((1, 5)))  # 用假数据构建
model.summary()          # 现在可以查看了
```

### 误区 4："input_shape 每一层都要指定"

**错！** 只需要在第一层指定 `input_shape`，后面的层会自动推断：

```python
# ❌ 错误：每层都指定 input_shape
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(10,)),
    keras.layers.Dense(32, activation='relu', input_shape=(64,)),  # 多余
    keras.layers.Dense(1, activation='sigmoid', input_shape=(32,))  # 多余
])

# ✅ 正确：只在第一层指定
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(10,)),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(1, activation='sigmoid')
])
```

### 误区 5："Dropout 在训练和测试时都一样"

**错！** Dropout 只在训练时生效，测试时自动关闭：

```python
# Dropout 层
dropout = keras.layers.Dropout(0.3)

# 训练模式：随机丢弃 30% 的神经元
output_train = dropout(inputs, training=True)

# 测试模式：不丢弃，所有神经元都工作
output_test = dropout(inputs, training=False)
```

---

## 7 动手练习

### 练习 1：基础练习

用 Sequential API 搭建一个手写数字识别模型（输入 28x28 的图片，输出 10 个类别的概率）。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras

# 搭建模型
model = keras.Sequential([
    # 展平层：28x28 -> 784
    keras.layers.Flatten(input_shape=(28, 28)),
    # 隐藏层 1
    keras.layers.Dense(256, activation='relu'),
    # Dropout
    keras.layers.Dropout(0.3),
    # 隐藏层 2
    keras.layers.Dense(128, activation='relu'),
    # Dropout
    keras.layers.Dropout(0.2),
    # 输出层
    keras.layers.Dense(10, activation='softmax')
])

# 查看模型结构
model.summary()
```

</details>

### 练习 2：进阶练习

用 Functional API 搭建一个有两个输入的模型：一个输入是 10 维数值特征，另一个是 20 维文本特征，两个输入分别处理后合并，最终输出 1 个预测值。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras

# 定义两个输入
input_numeric = keras.Input(shape=(10,), name="numeric_input")
input_text = keras.Input(shape=(20,), name="text_input")

# 分别处理
x_num = keras.layers.Dense(32, activation='relu')(input_numeric)
x_text = keras.layers.Dense(32, activation='relu')(input_text)

# 合并两个分支
merged = keras.layers.Concatenate()([x_num, x_text])

# 共同处理
x = keras.layers.Dense(64, activation='relu')(merged)
x = keras.layers.Dropout(0.3)(x)
outputs = keras.layers.Dense(1, activation='sigmoid')(x)

# 创建模型
model = keras.Model(inputs=[input_numeric, input_text], outputs=outputs)

model.summary()
```

</details>

### 练习 3（挑战）：综合练习

用 Model 子类化实现一个带有自定义前向传播逻辑的模型：在训练时使用 Dropout，在测试时不使用；并且添加一个自定义方法 `get_feature_vector` 来提取中间层的特征。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras

class CustomModel(keras.Model):
    def __init__(self):
        super(CustomModel, self).__init__()
        # 定义层
        self.dense1 = keras.layers.Dense(128, activation='relu')
        self.dropout = keras.layers.Dropout(0.3)
        self.dense2 = keras.layers.Dense(64, activation='relu')
        self.output_layer = keras.layers.Dense(10, activation='softmax')
    
    def call(self, inputs, training=False):
        """前向传播"""
        x = self.dense1(inputs)
        x = self.dropout(x, training=training)  # 训练时使用 Dropout
        self.feature_vector = self.dense2(x)    # 保存中间特征
        outputs = self.output_layer(self.feature_vector)
        return outputs
    
    def get_feature_vector(self, inputs):
        """提取中间层特征"""
        x = self.dense1(inputs)
        x = self.dropout(x, training=False)  # 测试时不用 Dropout
        features = self.dense2(x)
        return features

# 创建模型
model = CustomModel()

# 构建模型
model(tf.zeros((1, 784)))
model.summary()

# 测试特征提取
test_input = tf.random.normal((5, 784))
features = model.get_feature_vector(test_input)
print(f"特征向量形状: {features.shape}")  # (5, 64)
```

</details>

---

## 下一章预告

下一章我们会学习 **损失函数与优化器**——也就是模型训练的两大核心组件。你会学到交叉熵损失、均方误差等常用损失函数，以及 SGD、Adam 等优化器的工作原理和使用方法。这些是模型训练的关键配置。
