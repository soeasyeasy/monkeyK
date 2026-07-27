---
title: "第4章：数据加载与处理"
description: "tf.data.Dataset、数据预处理、数据增强、自定义数据集"
---

# 第4章：数据加载与处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- TensorFlow 怎么加载数据？直接用 NumPy 不行吗？
- `tf.data.Dataset` 是什么？为什么要用它？
- 数据量太大，内存放不下怎么办？
- 怎么做数据增强来扩充数据集？

这一章就是为了解答这些问题。数据是深度学习的"燃料"，数据加载的效率直接影响训练速度。我们会先理解 `tf.data.Dataset` 的核心概念，再动手实践各种数据加载和处理方式，最后学会数据增强的技巧。

---

## 1 为什么需要 tf.data.Dataset？

### 痛点分析

假设你有 100 万张图片要训练模型。传统做法是：

1. 把所有图片一次性加载到内存
2. 用 NumPy 数组存储
3. 直接传给模型训练

问题来了：
- 100 万张图片可能需要几十 GB 内存，根本放不下
- 数据加载成为瓶颈，GPU 闲着等数据
- 想做数据增强很麻烦
- 想做批量处理、打乱、预取等操作要手写很多代码

这就像**一个餐厅一次性把所有食材堆在厨房**——放不下、找不到、用不好！

### 解决方案

`tf.data.Dataset` 就像一个**智能的食材配送系统**：

- **按需加载**：不一次性把所有数据加载到内存，用多少取多少
- **管道流水线**：支持链式操作（打乱、批处理、预取等）
- **高性能**：自动并行处理，GPU 不用等数据
- **灵活**：支持从文件、内存、网络等各种来源加载

> **一句话总结**：`tf.data.Dataset` 是 TensorFlow 的高效数据管道，让你用流式方式处理大规模数据。

### 代码对比

**直接用 NumPy**：

```python
import numpy as np

# 一次性加载所有数据到内存
X = np.load("huge_data.npy")            # 可能几十 GB，内存爆了
y = np.load("huge_labels.npy")

# 手动打乱
indices = np.random.permutation(len(X))
X = X[indices]
y = y[indices]

# 手动分批
batch_size = 32
for i in range(0, len(X), batch_size):
    batch_X = X[i:i+batch_size]
    batch_y = y[i:i+batch_size]
    # 训练...
```

**使用 tf.data.Dataset**：

```python
import tensorflow as tf

# 从 NumPy 数组创建 Dataset
dataset = tf.data.Dataset.from_tensor_slices((X, y))

# 链式操作：打乱 -> 批处理 -> 预取
dataset = dataset.shuffle(10000)        # 打乱，缓冲区大小 10000
dataset = dataset.batch(32)             # 每批 32 个样本
dataset = dataset.prefetch(tf.data.AUTOTUNE)  # 预取，自动优化

# 训练时自动按批取数据
for batch_X, batch_y in dataset:
    # 训练...
    pass
```

---

## 2 核心原理

### 概念解释

`tf.data.Dataset` 是 TensorFlow 的**数据管道 API**。它的核心思想是：**把数据操作组织成一条流水线，数据像水流一样通过管道，按需处理**。

打个比方：

> `tf.data.Dataset` 就像**奶茶店的点单系统**——你不是一次性把所有奶茶做完堆在柜台上（内存放不下），而是顾客点一杯做一杯（按需加载），同时后台提前准备原料（预取），多个窗口同时工作（并行处理）。

### 数据管道的核心操作

| 操作 | 作用 | 类比 |
| --- | --- | --- |
| `map()` | 对每个元素应用函数 | 给每杯奶茶加配料 |
| `batch()` | 把元素组合成批次 | 一次做 32 杯 |
| `shuffle()` | 随机打乱顺序 | 打乱订单顺序 |
| `prefetch()` | 提前准备下一批数据 | 提前准备原料 |
| `cache()` | 缓存到内存/磁盘 | 把常用原料放冰箱 |
| `repeat()` | 重复数据集 | 循环接单 |

### 数据管道执行流程

```
原始数据 -> map(预处理) -> shuffle(打乱) -> batch(分批) -> prefetch(预取) -> 模型训练
```

---

## 3 基础用法

### 从内存创建 Dataset

```python
import tensorflow as tf
import numpy as np

# 1. 从 NumPy 数组创建
X = np.array([[1, 2], [3, 4], [5, 6], [7, 8]])  # 4 个样本，每个 2 个特征
y = np.array([0, 1, 0, 1])                       # 4 个标签

dataset = tf.data.Dataset.from_tensor_slices((X, y))  # 创建 Dataset

# 遍历数据集
for features, label in dataset:
    print(f"特征: {features.numpy()}, 标签: {label.numpy()}")

# 2. 从 Python 列表创建
dataset2 = tf.data.Dataset.from_tensor_slices([1, 2, 3, 4, 5])
for item in dataset2:
    print(item.numpy())

# 3. 从字典创建（多特征场景）
features_dict = {
    "age": np.array([25, 30, 35, 40]),
    "salary": np.array([5000, 8000, 12000, 15000]),
}
labels = np.array([0, 1, 1, 0])

dataset3 = tf.data.Dataset.from_tensor_slices((features_dict, labels))
for features, label in dataset3:
    print(f"年龄: {features['age'].numpy()}, 薪资: {features['salary'].numpy()}, 标签: {label.numpy()}")
```

### 常用操作

```python
# 创建示例数据集
dataset = tf.data.Dataset.range(10)       # 创建 0-9 的数据集

# 1. map：对每个元素应用函数
dataset_doubled = dataset.map(lambda x: x * 2)  # 每个元素乘以 2
print("map 操作:")
for item in dataset_doubled:
    print(item.numpy(), end=" ")          # 输出: 0 2 4 6 8 10 12 14 16 18

# 2. batch：分批
dataset_batched = dataset.batch(3)        # 每批 3 个元素
print("\nbatch 操作:")
for batch in dataset_batched:
    print(batch.numpy())                  # [0,1,2], [3,4,5], [6,7,8], [9]

# 3. shuffle：打乱
dataset_shuffled = dataset.shuffle(buffer_size=10)  # 打乱
print("shuffle 操作:")
for item in dataset_shuffled:
    print(item.numpy(), end=" ")

# 4. prefetch：预取（提高性能）
dataset_prefetch = dataset.batch(3).prefetch(tf.data.AUTOTUNE)  # 预取

# 5. cache：缓存
dataset_cached = dataset.map(lambda x: x * 2).cache()  # 缓存到内存
```

### 完整的数据管道

```python
import tensorflow as tf
import numpy as np

# 模拟数据
X = np.random.rand(1000, 10).astype(np.float32)   # 1000 个样本，10 个特征
y = np.random.randint(0, 2, 1000)                  # 二分类标签

# 构建数据管道
def create_dataset(X, y, batch_size=32, is_training=True):
    """创建数据管道"""
    # 从 NumPy 数组创建 Dataset
    dataset = tf.data.Dataset.from_tensor_slices((X, y))
    
    if is_training:
        # 训练模式：打乱 + 重复
        dataset = dataset.shuffle(buffer_size=len(X))  # 打乱数据
        dataset = dataset.repeat()                      # 无限重复
    
    # 批处理
    dataset = dataset.batch(batch_size)
    
    # 预取（提高性能）
    dataset = dataset.prefetch(tf.data.AUTOTUNE)
    
    return dataset

# 创建训练集和验证集
train_dataset = create_dataset(X, y, batch_size=32, is_training=True)
val_dataset = create_dataset(X, y, batch_size=32, is_training=False)

# 查看一批数据
for batch_X, batch_y in train_dataset.take(1):  # take(1) 只取 1 批
    print(f"批次特征形状: {batch_X.shape}")      # (32, 10)
    print(f"批次标签形状: {batch_y.shape}")      # (32,)
```

---

## 4 从文件加载数据

### 从 CSV 文件加载

```python
import tensorflow as tf

# 假设有一个 CSV 文件 data.csv
# 先用 Python 创建一个示例 CSV
import csv
with open("sample_data.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["age", "salary", "label"])  # 表头
    for i in range(100):
        writer.writerow([25 + i % 20, 5000 + i * 100, i % 2])

# 使用 tf.data 读取 CSV
dataset = tf.data.experimental.make_csv_dataset(
    "sample_data.csv",                            # 文件路径
    batch_size=16,                                # 批大小
    label_name="label",                           # 标签列名
    num_epochs=1,                                 # 只读 1 轮
    shuffle=True                                  # 打乱
)

for batch_features, batch_labels in dataset:
    print(f"特征列: {list(batch_features.keys())}")  # ['age', 'salary']
    print(f"年龄批次: {batch_features['age'].numpy()[:5]}")
    print(f"标签批次: {batch_labels.numpy()[:5]}")
    break
```

### 从图片文件加载

```python
import tensorflow as tf
import os

# 假设图片目录结构如下：
# images/
#   cats/
#     cat_001.jpg
#     cat_002.jpg
#   dogs/
#     dog_001.jpg
#     dog_002.jpg

# 使用 image_dataset_from_directory 一步到位
train_dataset = tf.keras.utils.image_dataset_from_directory(
    "images",                                # 根目录
    validation_split=0.2,                    # 20% 作为验证集
    subset="training",                       # 当前是训练集
    seed=42,                                 # 随机种子
    image_size=(224, 224),                   # 图片缩放到 224x224
    batch_size=32                            # 批大小
)

val_dataset = tf.keras.utils.image_dataset_from_directory(
    "images",
    validation_split=0.2,
    subset="validation",                     # 当前是验证集
    seed=42,
    image_size=(224, 224),
    batch_size=32
)

# 查看数据集信息
print(f"类别: {train_dataset.class_names}")  # ['cats', 'dogs']

for images, labels in train_dataset.take(1):
    print(f"图片批次形状: {images.shape}")   # (32, 224, 224, 3)
    print(f"标签批次形状: {labels.shape}")   # (32,)
```

---

## 5 数据增强

### 使用 Keras 预处理层

```python
import tensorflow as tf
from tensorflow import keras

# 创建数据增强层
data_augmentation = keras.Sequential([
    # 随机水平翻转
    keras.layers.RandomFlip("horizontal"),
    # 随机旋转（正负 10% 弧度）
    keras.layers.RandomRotation(0.1),
    # 随机缩放（正负 10%）
    keras.layers.RandomZoom(0.1),
    # 随机对比度调整
    keras.layers.RandomContrast(0.1),
])

# 使用示例（在模型中嵌入）
model = keras.Sequential([
    # 先做归一化
    keras.layers.Rescaling(1.0 / 255, input_shape=(224, 224, 3)),
    # 数据增强（只在训练时生效）
    data_augmentation,
    # 后面的网络层...
    keras.layers.Conv2D(32, 3, activation='relu'),
    keras.layers.GlobalAveragePooling2D(),
    keras.layers.Dense(10, activation='softmax')
])
```

### 使用 tf.image 手动增强

```python
import tensorflow as tf

def augment(image, label):
    """自定义数据增强函数"""
    # 随机左右翻转
    image = tf.image.random_flip_left_right(image)
    # 随机调整亮度
    image = tf.image.random_brightness(image, max_delta=0.2)
    # 随机调整对比度
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)
    # 确保像素值在 0-1 之间
    image = tf.clip_by_value(image, 0.0, 1.0)
    return image, label

# 应用到数据集
# dataset = dataset.map(augment, num_parallel_calls=tf.data.AUTOTUNE)
```

---

## 6 对比表格

### 数据加载方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
| --- | --- | --- | --- |
| `from_tensor_slices` | 数据能放进内存 | 简单直接 | 数据量大时内存不够 |
| `make_csv_dataset` | CSV 文件 | 自动解析 | 只支持 CSV |
| `image_dataset_from_directory` | 图片分类 | 一步到位 | 只支持图片 |
| `TFRecord` | 大规模数据 | 高效、可压缩 | 需要预处理 |
| `tf.data.TextLineDataset` | 文本文件 | 逐行读取 | 需要手动解析 |

### 数据管道操作对比

| 操作 | 作用 | 何时使用 |
| --- | --- | --- |
| `map()` | 对每个元素做变换 | 预处理、数据增强 |
| `batch()` | 组合成批次 | 训练前必须 |
| `shuffle()` | 随机打乱 | 训练时必须 |
| `prefetch()` | 预取下一批 | 始终推荐使用 |
| `cache()` | 缓存数据 | 数据集小、反复使用 |
| `repeat()` | 重复数据集 | 多轮训练 |

---

## 7 新手常见误区

### 误区 1："数据量小，不需要用 tf.data"

**不推荐。** 即使数据量小，使用 `tf.data.Dataset` 也有好处：
- 代码更规范，方便后续扩展
- 自动优化性能（预取、并行）
- 和 Keras 的 `fit()` 无缝配合

✅ 建议从一开始就养成使用 `tf.data` 的习惯。

### 误区 2："shuffle 的 buffer_size 随便设一个就行"

**错！** `buffer_size` 直接影响打乱效果：

```python
# ❌ 错误：buffer_size 太小，打乱不充分
dataset = dataset.shuffle(buffer_size=10)  # 只从 10 个元素里打乱

# ✅ 正确：buffer_size 设为数据集大小
dataset = dataset.shuffle(buffer_size=len(X))  # 完全打乱
```

### 误区 3："数据增强应该在 map 里做"

**不完全对。** 数据增强有两种方式：
- **离线增强**：在 `map()` 中做，预处理阶段完成
- **在线增强**：用 Keras 预处理层嵌入模型，训练时实时增强

✅ 推荐用 Keras 预处理层，只在训练时生效，验证/测试时自动关闭。

### 误区 4："prefetch 没必要加"

**错！** `prefetch` 能显著提升训练速度：

```python
# ❌ 错误：没有 prefetch，GPU 要等数据
dataset = dataset.batch(32)

# ✅ 正确：加了 prefetch，GPU 不用等
dataset = dataset.batch(32).prefetch(tf.data.AUTOTUNE)
```

### 误区 5："数据不需要归一化"

**错！** 归一化是数据预处理的关键步骤：

```python
# ❌ 错误：直接用原始像素值（0-255）
# 模型很难收敛，因为数值范围太大

# ✅ 正确：归一化到 0-1
dataset = dataset.map(lambda x, y: (x / 255.0, y))

# 或者用 Keras 预处理层
rescale = keras.layers.Rescaling(1.0 / 255)
```

---

## 8 动手练习

### 练习 1：基础练习

创建一个包含 100 个样本的 Dataset，实现以下管道：打乱 -> 批处理（每批 10 个）-> 预取，并遍历打印前 3 批数据。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
import numpy as np

# 创建模拟数据
X = np.arange(100)                          # 0-99
y = np.arange(100) * 2                      # 0, 2, 4, ..., 198

# 创建 Dataset
dataset = tf.data.Dataset.from_tensor_slices((X, y))

# 构建管道：打乱 -> 批处理 -> 预取
dataset = dataset.shuffle(buffer_size=100)  # 打乱
dataset = dataset.batch(10)                 # 每批 10 个
dataset = dataset.prefetch(tf.data.AUTOTUNE)  # 预取

# 遍历前 3 批
for i, (batch_X, batch_y) in enumerate(dataset.take(3)):
    print(f"第 {i+1} 批:")
    print(f"  X: {batch_X.numpy()}")
    print(f"  y: {batch_y.numpy()}")
```

</details>

### 练习 2：进阶练习

创建一个 Dataset，使用 `map` 操作对每个样本做以下预处理：
1. 将特征归一化到 0-1 之间
2. 将标签转为 one-hot 编码（共 3 个类别）

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
import numpy as np

# 创建模拟数据
X = np.array([[10, 200], [30, 400], [50, 600], [70, 800]], dtype=np.float32)
y = np.array([0, 1, 2, 1])                  # 3 个类别

# 创建 Dataset
dataset = tf.data.Dataset.from_tensor_slices((X, y))

# 定义预处理函数
def preprocess(features, label):
    # 归一化特征到 0-1
    features = features / 1000.0            # 假设最大值是 1000
    # 标签转 one-hot
    label = tf.one_hot(label, depth=3)      # 3 个类别
    return features, label

# 应用预处理
dataset = dataset.map(preprocess)

# 查看结果
for features, label in dataset:
    print(f"特征: {features.numpy()}, 标签: {label.numpy()}")
```

</details>

### 练习 3（挑战）：综合练习

构建一个完整的数据管道，包含以下操作：
1. 从随机数据创建 Dataset
2. 使用 `map` 做数据增强（添加噪声）
3. 打乱 + 批处理
4. 用 `cache` 缓存预处理后的数据
5. 用 `prefetch` 优化性能
6. 统计处理 1000 个样本的总耗时

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
import numpy as np
import time

# 创建模拟数据
X = np.random.rand(1000, 10).astype(np.float32)
y = np.random.randint(0, 2, 1000)

# 定义数据增强函数
def augment(features, label):
    # 添加高斯噪声
    noise = tf.random.normal(shape=tf.shape(features), mean=0.0, stddev=0.01)
    features = features + noise
    return features, label

# 构建完整管道
start_time = time.time()

dataset = tf.data.Dataset.from_tensor_slices((X, y))  # 创建
dataset = dataset.map(augment, num_parallel_calls=tf.data.AUTOTUNE)  # 增强
dataset = dataset.cache()                             # 缓存
dataset = dataset.shuffle(buffer_size=1000)           # 打乱
dataset = dataset.batch(32)                           # 批处理
dataset = dataset.prefetch(tf.data.AUTOTUNE)          # 预取

# 遍历所有数据
count = 0
for batch_X, batch_y in dataset:
    count += batch_X.shape[0]
    if count >= 1000:
        break

end_time = time.time()
print(f"处理 {count} 个样本，耗时: {end_time - start_time:.4f} 秒")
```

</details>

---

## 下一章预告

下一章我们会学习 **Keras 模型构建**——也就是如何用 Keras 的三种 API（Sequential、Functional、Model 子类化）搭建神经网络。你会学到全连接层、Dropout 层、模型编译等核心内容。这是从"数据处理"到"模型训练"的关键一步。
