---
title: "第11章：迁移学习与模型微调"
description: "掌握 TensorFlow/Keras 中迁移学习原理，实现高效模型训练"
---

# 第11章：迁移学习与模型微调

## 1. 本章导读

在开始学习迁移学习之前，你可能会有这些疑问：

- 什么是迁移学习？为什么要用它？
- 预训练模型是什么？从哪里获取？
- 如何微调模型适应自己的任务？
- 数据量很少时也能训练出好模型吗？
- 迁移学习有哪些常见的方法？

这一章就是为了解答这些问题。迁移学习是深度学习中最实用的技术之一，它能让你用很少的数据和时间训练出强大的模型。

---

## 2. 为什么需要迁移学习？

### 痛点分析

**从零训练的问题**：

想象一下你要训练一个图像分类模型：

- **需要大量数据**：通常需要几十万张图片
- **需要很长时间**：训练几天甚至几周
- **需要强大硬件**：高端 GPU
- **容易过拟合**：数据少时效果差

**迁移学习的优势**：
- **数据需求少**：几百张图片就能训练
- **训练时间短**：几分钟到几小时
- **效果好**：利用预训练知识
- **节省资源**：普通硬件也能用

### 生活化类比

> 迁移学习就像学做菜：
> - **从零学习**：完全不会做菜，从切菜开始学
> - **迁移学习**：已经会做中餐，现在学西餐
>   - 刀工、火候控制这些基础技能可以迁移
>   - 只需要学习新的调味和做法
>   - 学得更快，效果更好

### 迁移学习的应用场景

```
迁移学习能做什么？
├─ 图像分类：用少量数据训练分类器
├─ 目标检测：快速构建检测模型
├─ 语义分割：医学图像分割
├─ 自然语言处理：文本分类、情感分析
├─ 语音识别：语音转文字
└─ 推荐系统：个性化推荐
```

> **一句话总结**：迁移学习利用预训练模型的 knowledge，用少量数据快速训练出好模型。

---

## 3. 核心原理讲解

### 迁移学习的基本思想

打个比方：

> 迁移学习像换工作：
> - **预训练模型**：你在上一份工作积累的经验
> - **新任务**：新的工作要求
> - **微调**：把之前的经验应用到新工作
>   - 通用技能（如沟通、管理）直接迁移
>   - 专业技能需要重新学习

### 预训练模型

**什么是预训练模型？**

在大规模数据集（如 ImageNet）上训练好的模型：

- **VGG**：经典的卷积网络
- **ResNet**：残差网络，解决梯度消失
- **Inception**：多尺度特征提取
- **MobileNet**：轻量级网络，适合移动端
- **EfficientNet**：高效网络架构

**预训练模型的优势**：
- 学习了通用的特征提取能力
- 底层学习边缘、纹理等基础特征
- 高层学习物体部件等抽象特征
- 这些知识可以迁移到新任务

### 迁移学习的方法

**特征提取（Feature Extraction）**：
- 冻结预训练模型的卷积层
- 只训练新的分类器
- 适合数据量小的情况

**微调（Fine-tuning）**：
- 解冻部分或全部预训练层
- 用新数据继续训练
- 适合数据量大的情况

### 微调策略

```
微调的三种方式：
1. 只训练分类器
   - 冻结所有预训练层
   - 只训练新添加的全连接层
   - 适合：数据量很小（<1000）

2. 微调部分层
   - 冻结前面的层（学习通用特征）
   - 微调后面的层（学习特定特征）
   - 适合：数据量中等（1000-10000）

3. 微调所有层
   - 解冻所有层
   - 用较小的学习率训练
   - 适合：数据量大（>10000）
```

### 迁移学习的注意事项

| 场景 | 数据量 | 相似度 | 推荐方法 |
|------|--------|--------|----------|
| 数据少，任务相似 | 小 | 高 | 特征提取 |
| 数据少，任务不同 | 小 | 低 | 特征提取 + 数据增强 |
| 数据多，任务相似 | 大 | 高 | 微调部分层 |
| 数据多，任务不同 | 大 | 低 | 微调所有层 |

> **一句话总结**：迁移学习通过复用预训练模型的知识，大幅降低训练成本。

---

## 4. 基础用法 + 逐行注释

### 4.1 使用预训练模型进行特征提取

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import VGG16
from tensorflow.keras.datasets import cifar10
from tensorflow.keras.utils import to_categorical
import numpy as np

# 加载 CIFAR-10 数据集
# 60000张32x32彩色图像，10个类别
(x_train, y_train), (x_test, y_test) = cifar10.load_data()

# 归一化到[0, 1]范围
x_train = x_train.astype('float32') / 255.0
x_test = x_test.astype('float32') / 255.0

# 标签 one-hot 编码
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

print(f'训练数据形状: {x_train.shape}')  # (50000, 32, 32, 3)
print(f'测试数据形状: {x_test.shape}')    # (10000, 32, 32, 3)

# 加载预训练的 VGG16 模型
# include_top=False: 不包含顶部的全连接层
# weights='imagenet': 使用在 ImageNet 上预训练的权重
# input_shape: 输入图像大小（VGG16 最小 32x32）
base_model = VGG16(
    include_top=False,        # 不包含顶部全连接层
    weights='imagenet',       # 使用 ImageNet 预训练权重
    input_shape=(32, 32, 3)   # 输入图像形状
)

# 冻结预训练模型的权重
# 训练时不会更新这些层的参数
base_model.trainable = False

# 查看模型结构
base_model.summary()

# 构建新的分类模型
model = models.Sequential([
    # 使用预训练的 VGG16 作为特征提取器
    base_model,
    
    # 展平特征图
    layers.Flatten(),
    
    # 添加新的全连接层
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.5),  # Dropout 防止过拟合
    
    # 输出层，10个类别
    layers.Dense(10, activation='softmax')
])

# 编译模型
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 查看模型结构
model.summary()

# 训练模型
# 只训练新添加的层，预训练层保持冻结
history = model.fit(
    x_train, y_train,
    batch_size=64,
    epochs=20,
    validation_data=(x_test, y_test)
)

# 评估模型
loss, accuracy = model.evaluate(x_test, y_test)
print(f'测试集准确率: {accuracy:.4f}')
```

### 4.2 微调预训练模型

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.datasets import cifar10
from tensorflow.keras.utils import to_categorical

# 加载数据
(x_train, y_train), (x_test, y_test) = cifar10.load_data()
x_train = x_train.astype('float32') / 255.0
x_test = x_test.astype('float32') / 255.0
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

# 加载预训练的 ResNet50
# 使用较小的输入尺寸以加快训练
base_model = ResNet50(
    include_top=False,
    weights='imagenet',
    input_shape=(32, 32, 3),
    pooling='avg'  # 全局平均池化
)

# 第一阶段：冻结所有层，只训练分类器
base_model.trainable = False

model = models.Sequential([
    base_model,
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 先训练几轮，让分类器收敛
print("第一阶段：训练分类器...")
model.fit(
    x_train, y_train,
    batch_size=64,
    epochs=5,
    validation_data=(x_test, y_test)
)

# 第二阶段：微调部分层
# 解冻最后几个卷积块
base_model.trainable = True

# 冻结前面的层，只微调后面的层
for layer in base_model.layers[:-20]:  # 冻结前面的层
    layer.trainable = False

# 使用较小的学习率进行微调
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),  # 小学习率
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 继续训练
print("第二阶段：微调模型...")
history = model.fit(
    x_train, y_train,
    batch_size=64,
    epochs=10,
    validation_data=(x_test, y_test)
)

# 评估
loss, accuracy = model.evaluate(x_test, y_test)
print(f'微调后测试集准确率: {accuracy:.4f}')
```

### 4.3 使用 TensorFlow Hub 的预训练模型

```python
import tensorflow as tf
import tensorflow_hub as hub
from tensorflow.keras import layers, models
import numpy as np

# TensorFlow Hub 提供了大量预训练模型
# 可以方便地加载和使用

# 方法1：使用 Keras 层加载
# 加载 MobileNetV2 特征提取器
feature_extractor = hub.KerasLayer(
    "https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/feature_vector/4",
    trainable=False,  # 冻结预训练层
    input_shape=(224, 224, 3)
)

# 构建模型
model = models.Sequential([
    # 数据预处理层
    layers.Rescaling(1.0/255, input_shape=(224, 224, 3)),
    
    # 使用 TensorFlow Hub 的特征提取器
    feature_extractor,
    
    # 添加分类器
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# 方法2：使用 saved_model 加载
# 保存模型到本地
model.save('my_model')

# 加载模型
loaded_model = tf.keras.models.load_model(
    'my_model',
    custom_objects={'KerasLayer': hub.KerasLayer}
)
```

### 4.4 自定义数据集的迁移学习

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing import image_dataset_from_directory
import os

# 假设你有自己的数据集，目录结构如下：
# dataset/
#   train/
#     cats/
#     dogs/
#   validation/
#     cats/
#     dogs/

# 加载数据集
# 自动从目录结构读取标签
train_dataset = image_dataset_from_directory(
    'dataset/train',
    image_size=(224, 224),    # 图像大小
    batch_size=32,            # 批次大小
    shuffle=True              # 打乱数据
)

validation_dataset = image_dataset_from_directory(
    'dataset/validation',
    image_size=(224, 224),
    batch_size=32,
    shuffle=False
)

# 获取类别名称
class_names = train_dataset.class_names
print(f'类别: {class_names}')

# 数据增强
data_augmentation = models.Sequential([
    layers.RandomFlip('horizontal'),  # 随机水平翻转
    layers.RandomRotation(0.2),       # 随机旋转
    layers.RandomZoom(0.2),           # 随机缩放
])

# 加载预训练的 EfficientNetB0
base_model = EfficientNetB0(
    include_top=False,
    weights='imagenet',
    input_shape=(224, 224, 3),
    pooling='avg'
)

# 冻结预训练层
base_model.trainable = False

# 构建完整模型
inputs = tf.keras.Input(shape=(224, 224, 3))

# 数据增强
x = data_augmentation(inputs)

# 预处理（EfficientNet 需要特定的预处理）
x = tf.keras.applications.efficientnet.preprocess_input(x)

# 特征提取
x = base_model(x, training=False)

# 分类器
x = layers.Dropout(0.3)(x)
outputs = layers.Dense(len(class_names), activation='softmax')(x)

model = models.Model(inputs, outputs)

# 编译模型
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# 训练
history = model.fit(
    train_dataset,
    validation_data=validation_dataset,
    epochs=10
)

# 保存模型
model.save('custom_classifier.h5')
```

### 4.5 完整微调流程

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2

# 完整的迁移学习流程

# 步骤1：创建基础模型
base_model = MobileNetV2(
    input_shape=(160, 160, 3),
    include_top=False,
    weights='imagenet'
)

# 步骤2：冻结基础模型
base_model.trainable = False

# 步骤3：添加分类头
inputs = tf.keras.Input(shape=(160, 160, 3))

# 预处理
x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)

# 特征提取
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(1, activation='sigmoid')(x)  # 二分类

model = models.Model(inputs, outputs)

# 步骤4：训练分类头
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

print("训练分类头...")
# model.fit(train_data, epochs=10)

# 步骤5：解冻基础模型
base_model.trainable = True

# 步骤6：使用较小的学习率重新编译
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 步骤7：继续训练
print("微调基础模型...")
# model.fit(train_data, epochs=10)

# 步骤8：评估和保存
# model.evaluate(test_data)
# model.save('fine_tuned_model.h5')
```

---

## 5. 对比表格

### 迁移学习方法对比

| 方法 | 训练层数 | 数据需求 | 训练时间 | 适用场景 |
|------|----------|----------|----------|----------|
| 特征提取 | 只训练分类器 | 小 | 快 | 数据少，任务简单 |
| 部分微调 | 微调部分层 | 中 | 中 | 数据中等，任务复杂 |
| 全微调 | 微调所有层 | 大 | 慢 | 数据多，任务复杂 |

### 常用预训练模型对比

| 模型 | 参数量 | 速度 | 精度 | 适用场景 |
|------|--------|------|------|----------|
| VGG16 | 138M | 慢 | 中 | 教学、小数据集 |
| ResNet50 | 25M | 中 | 高 | 通用任务 |
| InceptionV3 | 23M | 中 | 高 | 多尺度特征 |
| MobileNetV2 | 3.5M | 快 | 中 | 移动端 |
| EfficientNetB0 | 5.3M | 快 | 高 | 高效推理 |

### 微调策略对比

| 策略 | 学习率 | 冻结层数 | 训练轮数 | 效果 |
|------|--------|----------|----------|------|
| 保守微调 | 1e-5 | 多 | 少 | 稳定，但可能欠拟合 |
| 激进微调 | 1e-4 | 少 | 多 | 快速，但可能过拟合 |
| 渐进微调 | 从大到小 | 从多到少 | 分阶段 | 平衡，推荐 |

---

## 6. 新手常见误区

### 误区1：预训练模型可以直接用于任何任务

❌ **错误想法**：加载预训练模型就能直接分类

✅ **实际情况**：
- 预训练模型的输出层是针对原任务的
- 需要替换输出层适应新任务
- 需要重新训练输出层

❌ **错误写法**：
```python
# 直接使用预训练模型
model = VGG16(weights='imagenet')
model.predict(new_images)  # 只能分类 ImageNet 的 1000 类
```

✅ **正确写法**：
```python
# 替换输出层
base_model = VGG16(include_top=False, weights='imagenet')
model = models.Sequential([
    base_model,
    layers.Dense(num_classes, activation='softmax')  # 新的输出层
])
```

### 误区2：微调时学习率设置太大

❌ **错误写法**：
```python
# 使用默认学习率微调
model.compile(optimizer='adam')  # 学习率 0.001
model.fit(...)  # 可能破坏预训练权重
```

✅ **正确写法**：
```python
# 使用较小的学习率
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5)  # 小学习率
)
model.fit(...)
```

### 误区3：不需要数据预处理

❌ **错误写法**：
```python
# 直接使用原始图像
images = load_images(...)
model.predict(images)  # 效果差
```

✅ **正确写法**：
```python
# 使用模型对应的预处理
from tensorflow.keras.applications import resnet50
images = resnet50.preprocess_input(images)  # 特定预处理
model.predict(images)
```

### 误区4：数据量很少时全微调

❌ **错误想法**：数据少也要微调所有层

✅ **实际情况**：
- 数据少时全微调容易过拟合
- 应该先冻结大部分层
- 只微调最后几层或只训练分类器

### 误区5：忽略批次归一化层

❌ **错误写法**：
```python
# 训练时设置 training=True
base_model.trainable = True
model.fit(...)  # BN 层会更新统计量
```

✅ **正确写法**：
```python
# 训练时保持 BN 层使用预训练统计量
base_model.trainable = True
model.fit(..., training=False)  # 或者在调用时指定
```

---

## 7. 动手练习

### 练习1：基础 - 使用预训练模型分类

**任务**：使用 VGG16 对 CIFAR-10 数据集进行分类

**要求**：
- 加载预训练的 VGG16
- 冻结所有层
- 添加新的分类头
- 达到 70% 以上准确率

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import VGG16
from tensorflow.keras.datasets import cifar10
from tensorflow.keras.utils import to_categorical

# 加载数据
(x_train, y_train), (x_test, y_test) = cifar10.load_data()
x_train = x_train.astype('float32') / 255.0
x_test = x_test.astype('float32') / 255.0
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

# 加载预训练模型
base_model = VGG16(
    include_top=False,
    weights='imagenet',
    input_shape=(32, 32, 3)
)
base_model.trainable = False

# 构建模型
model = models.Sequential([
    base_model,
    layers.Flatten(),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 训练
model.fit(
    x_train, y_train,
    batch_size=64,
    epochs=10,
    validation_data=(x_test, y_test)
)

# 评估
loss, accuracy = model.evaluate(x_test, y_test)
print(f'准确率: {accuracy:.4f}')
```

</details>

### 练习2：进阶 - 微调 ResNet50

**任务**：对 ResNet50 进行部分微调

**要求**：
- 先冻结所有层训练分类器
- 再解冻最后 20 层微调
- 使用较小的学习率

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.datasets import cifar10
from tensorflow.keras.utils import to_categorical

# 加载数据
(x_train, y_train), (x_test, y_test) = cifar10.load_data()
x_train = x_train.astype('float32') / 255.0
x_test = x_test.astype('float32') / 255.0
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

# 加载预训练模型
base_model = ResNet50(
    include_top=False,
    weights='imagenet',
    input_shape=(32, 32, 3),
    pooling='avg'
)

# 第一阶段：冻结所有层
base_model.trainable = False

model = models.Sequential([
    base_model,
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 训练分类器
model.fit(x_train, y_train, epochs=5, validation_data=(x_test, y_test))

# 第二阶段：解冻最后 20 层
base_model.trainable = True
for layer in base_model.layers[:-20]:
    layer.trainable = False

# 使用小学习率
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 微调
model.fit(x_train, y_train, epochs=5, validation_data=(x_test, y_test))
```

</details>

### 练习3：挑战 - 自定义数据集迁移学习

**任务**：使用 EfficientNet 对自定义数据集进行分类

**要求**：
- 使用 image_dataset_from_directory 加载数据
- 添加数据增强
- 实现完整的迁移学习流程

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetB0

# 加载数据集
train_dataset = tf.keras.preprocessing.image_dataset_from_directory(
    'dataset/train',
    image_size=(224, 224),
    batch_size=32
)

validation_dataset = tf.keras.preprocessing.image_dataset_from_directory(
    'dataset/validation',
    image_size=(224, 224),
    batch_size=32
)

# 数据增强
data_augmentation = models.Sequential([
    layers.RandomFlip('horizontal'),
    layers.RandomRotation(0.2),
    layers.RandomZoom(0.2),
])

# 加载预训练模型
base_model = EfficientNetB0(
    include_top=False,
    weights='imagenet',
    input_shape=(224, 224, 3),
    pooling='avg'
)
base_model.trainable = False

# 构建模型
inputs = tf.keras.Input(shape=(224, 224, 3))
x = data_augmentation(inputs)
x = tf.keras.applications.efficientnet.preprocess_input(x)
x = base_model(x, training=False)
x = layers.Dropout(0.3)(x)
outputs = layers.Dense(2, activation='softmax')(x)  # 假设2个类别

model = models.Model(inputs, outputs)

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# 训练
model.fit(
    train_dataset,
    validation_data=validation_dataset,
    epochs=10
)

# 保存模型
model.save('custom_model.h5')
```

</details>

---

## 8. 下一章预告

恭喜你完成了迁移学习的学习！现在你已经掌握了：

- 迁移学习的基本原理和优势
- 如何使用预训练模型
- 特征提取和微调的区别
- 完整的迁移学习流程

**下一章我们将学习目标检测实战**，这是一个非常实用的计算机视觉任务：

- 什么是目标检测？和图像分类有什么不同？
- YOLO 系列模型的使用方法
- 如何训练自己的目标检测模型
- 实际应用场景和案例

目标检测是计算机视觉中最实用的技术之一，掌握了它，你就能做很多有趣的项目，比如人脸识别、自动驾驶、安防监控等！
