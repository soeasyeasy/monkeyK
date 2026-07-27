---
title: "第7章：模型训练与评估"
description: "compile、fit、evaluate、模型保存加载、回调函数"
---

# 第7章：模型训练与评估

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 模型搭建好了，怎么开始训练？
- `compile`、`fit`、`evaluate` 这三个方法分别做什么？
- 怎么保存训练好的模型？下次怎么加载？
- 训练过程中怎么监控进度？怎么防止过拟合？

这一章就是为了解答这些问题。模型训练与评估是深度学习的**核心流程**——就像学生考试一样，训练是学习过程，评估是考试检验。我们会先理解完整的训练流程，再学习如何保存和加载模型，最后掌握回调函数的使用技巧。

---

## 1 为什么需要完整的训练流程？

### 痛点分析

假设你搭建好了一个神经网络模型。传统做法是：

1. 手动写训练循环
2. 手动计算损失和梯度
3. 手动更新参数
4. 手动评估模型
5. 手动保存模型权重

问题来了：
- 代码冗长，容易出错
- 训练过程无法监控
- 过拟合了才发现
- 训练了一半断电，前功尽弃

这就像**考试没有监考老师**——学生（模型）在作弊（过拟合）你都不知道，考完试卷子（模型）还丢了。

### 解决方案

Keras 提供了标准化的训练流程：

- **`compile()`**：配置训练过程（优化器、损失函数、评估指标）
- **`fit()`**：执行训练（自动处理批次、梯度更新、验证）
- **`evaluate()`**：评估模型（在测试集上计算指标）
- **`save()` / `load_model()`**：保存和加载模型
- **回调函数**：训练过程中自动执行操作（早停、保存最佳模型等）

打个比方：

> - **compile** 像**考试规则**——规定用什么笔、怎么评分
> - **fit** 像**考试过程**——学生答题、老师监考
> - **evaluate** 像**批改试卷**——计算最终成绩
> - **回调函数** 像**监考老师**——发现作弊就停止考试

> **一句话总结**：Keras 的训练流程让模型训练变得标准化、可监控、可恢复。

---

## 2 核心原理

### 概念解释

**训练流程** 是深度学习的核心环节，包含以下步骤：

1. **编译（compile）**：配置优化器、损失函数、评估指标
2. **训练（fit）**：循环执行前向传播、计算损失、反向传播、更新参数
3. **评估（evaluate）**：在测试集上计算模型性能
4. **预测（predict）**：用模型对新数据做预测

打个比方：

> 训练流程就像**教学生做题**：
> 1. 先告诉学生规则（compile）
> 2. 让学生做练习题，老师批改（fit）
> 3. 期末考试检验学习成果（evaluate）
> 4. 让学生做新题目（predict）

### 训练循环内部

```
for epoch in range(epochs):
    for batch_X, batch_y in dataset:
        # 1. 前向传播
        y_pred = model(batch_X)
        
        # 2. 计算损失
        loss = loss_fn(batch_y, y_pred)
        
        # 3. 计算梯度
        gradients = tape.gradient(loss, model.trainable_variables)
        
        # 4. 更新参数
        optimizer.apply_gradients(zip(gradients, model.trainable_variables))
```

---

## 3 基础用法

### compile：配置训练

```python
import tensorflow as tf
from tensorflow import keras

# 搭建模型
model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(10, activation='softmax')
])

# 编译模型
model.compile(
    optimizer='adam',                              # 优化器
    loss='sparse_categorical_crossentropy',        # 损失函数
    metrics=['accuracy']                           # 评估指标
)

# 也可以配置更多参数
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss=keras.losses.SparseCategoricalCrossentropy(),
    metrics=[
        'accuracy',                                # 准确率
        keras.metrics.Precision(),                 # 精确率
        keras.metrics.Recall()                     # 召回率
    ]
)
```

### fit：训练模型

```python
# 加载数据
(X_train, y_train), (X_test, y_test) = keras.datasets.mnist.load_data()
X_train = X_train.astype('float32') / 255.0
X_test = X_test.astype('float32') / 255.0
X_train = X_train.reshape(-1, 784)
X_test = X_test.reshape(-1, 784)

# 训练模型
history = model.fit(
    X_train, y_train,                            # 训练数据
    epochs=10,                                   # 训练轮数
    batch_size=32,                               # 批大小
    validation_split=0.2,                        # 20% 作为验证集
    shuffle=True,                                # 每轮打乱数据
    verbose=1                                    # 显示进度条
)

# 查看训练历史
print(f"训练损失: {history.history['loss']}")
print(f"验证损失: {history.history['val_loss']}")
print(f"训练准确率: {history.history['accuracy']}")
print(f"验证准确率: {history.history['val_accuracy']}")
```

### evaluate：评估模型

```python
# 在测试集上评估
test_loss, test_acc = model.evaluate(
    X_test, y_test,                              # 测试数据
    batch_size=32,                               # 批大小
    verbose=1                                    # 显示进度
)

print(f"测试损失: {test_loss:.4f}")
print(f"测试准确率: {test_acc:.4f}")
```

### predict：预测新数据

```python
# 对新数据做预测
predictions = model.predict(X_test[:5])          # 预测前 5 个样本

for i in range(5):
    predicted_class = tf.argmax(predictions[i]).numpy()  # 取概率最大的索引
    print(f"样本 {i}: 预测是 {predicted_class}, 实际是 {y_test[i]}")
    print(f"  预测概率: {predictions[i]}")
```

---

## 4 模型保存与加载

### 保存模型

```python
# 方式 1：保存整个模型（推荐）
model.save('my_model.h5')                      # HDF5 格式
model.save('my_model.keras')                   # Keras 原生格式

# 方式 2：保存为 SavedModel 格式（TensorFlow 默认）
model.save('my_model_savedmodel')

# 方式 3：只保存权重
model.save_weights('my_model_weights.h5')

# 方式 4：只保存模型结构（JSON）
json_config = model.to_json()
with open('model_config.json', 'w') as f:
    f.write(json_config)
```

### 加载模型

```python
# 方式 1：加载整个模型
loaded_model = keras.models.load_model('my_model.h5')

# 方式 2：加载 SavedModel
loaded_model = keras.models.load_model('my_model_savedmodel')

# 方式 3：先重建结构，再加载权重
with open('model_config.json', 'r') as f:
    json_config = f.read()
new_model = keras.models.model_from_json(json_config)
new_model.load_weights('my_model_weights.h5')

# 验证加载的模型
test_loss, test_acc = loaded_model.evaluate(X_test, y_test)
print(f"加载模型的准确率: {test_acc:.4f}")
```

---

## 5 回调函数

### 常用回调函数

```python
from tensorflow import keras

# 1. EarlyStopping：早停（防止过拟合）
early_stopping = keras.callbacks.EarlyStopping(
    monitor='val_loss',                          # 监控验证集损失
    min_delta=0.001,                             # 最小改善量
    patience=5,                                  # 5 轮不改善就停止
    verbose=1,                                   # 显示信息
    mode='min',                                  # 监控指标越小越好
    restore_best_weights=True                    # 恢复最佳权重
)

# 2. ModelCheckpoint：保存最佳模型
checkpoint = keras.callbacks.ModelCheckpoint(
    filepath='best_model.keras',                 # 保存路径
    monitor='val_accuracy',                      # 监控验证集准确率
    mode='max',                                  # 越大越好
    save_best_only=True,                         # 只保存最佳模型
    verbose=1                                    # 显示信息
)

# 3. ReduceLROnPlateau：学习率衰减
reduce_lr = keras.callbacks.ReduceLROnPlateau(
    monitor='val_loss',                          # 监控验证集损失
    factor=0.5,                                  # 每次降低一半
    patience=3,                                  # 3 轮不改善就降低
    min_lr=1e-6,                                 # 最小学习率
    verbose=1
)

# 4. TensorBoard：可视化训练过程
tensorboard = keras.callbacks.TensorBoard(
    log_dir='./logs',                            # 日志目录
    histogram_freq=1,                            # 每轮记录直方图
    write_graph=True,                            # 记录计算图
    write_images=True                            # 记录权重图片
)

# 使用回调函数
history = model.fit(
    X_train, y_train,
    epochs=50,
    validation_split=0.2,
    callbacks=[early_stopping, checkpoint, reduce_lr, tensorboard]  # 传入回调函数列表
)
```

### 自定义回调函数

```python
class CustomCallback(keras.callbacks.Callback):
    """自定义回调函数"""
    
    def on_train_begin(self, logs=None):
        """训练开始时调用"""
        print("开始训练...")
    
    def on_epoch_end(self, epoch, logs=None):
        """每轮结束时调用"""
        val_acc = logs.get('val_accuracy')
        if val_acc and val_acc > 0.98:
            print(f"\n验证准确率超过 98%，停止训练！")
            self.model.stop_training = True
    
    def on_train_end(self, logs=None):
        """训练结束时调用"""
        print("训练完成！")

# 使用自定义回调
custom_callback = CustomCallback()
model.fit(X_train, y_train, epochs=50, callbacks=[custom_callback])
```

---

## 6 对比表格

### 训练参数对比

| 参数 | 说明 | 推荐值 |
| --- | --- | --- |
| `epochs` | 训练轮数 | 10-100（配合早停） |
| `batch_size` | 批大小 | 32 / 64 / 128 |
| `validation_split` | 验证集比例 | 0.1 - 0.2 |
| `shuffle` | 是否打乱 | True（训练时） |
| `verbose` | 显示模式 | 0=静默, 1=进度条, 2=每轮一行 |

### 常用回调函数对比

| 回调函数 | 作用 | 何时使用 |
| --- | --- | --- |
| `EarlyStopping` | 早停防止过拟合 | 始终推荐 |
| `ModelCheckpoint` | 保存最佳模型 | 始终推荐 |
| `ReduceLROnPlateau` | 学习率衰减 | 训练不稳定时 |
| `TensorBoard` | 可视化训练 | 调试时 |
| `CSVLogger` | 记录到 CSV | 需要分析历史 |
| `LambdaCallback` | 自定义操作 | 特殊需求 |

### 模型保存格式对比

| 格式 | 扩展名 | 优点 | 缺点 |
| --- | --- | --- | --- |
| Keras HDF5 | `.h5` | 单文件、易分享 | 不支持自定义对象 |
| Keras 原生 | `.keras` | 推荐格式 | 较新 |
| SavedModel | 目录 | TensorFlow 标准 | 文件多 |
| 仅权重 | `.h5` | 轻量 | 需要重建结构 |

---

## 7 新手常见误区

### 误区 1："epochs 越大越好"

**错！** epochs 太大会导致过拟合：

```python
# ❌ 错误：epochs 太大，可能过拟合
model.fit(X_train, y_train, epochs=1000)  # 训练 1000 轮

# ✅ 正确：配合早停使用
early_stop = keras.callbacks.EarlyStopping(patience=10)
model.fit(X_train, y_train, epochs=100, callbacks=[early_stop])  # 最多 100 轮，提前停止
```

### 误区 2："batch_size 越小越好"

**不是的。** batch_size 影响训练稳定性和速度：

```python
# ❌ 错误：batch_size 太小，训练不稳定
model.fit(X_train, y_train, batch_size=1)  # 每次只更新 1 个样本

# ✅ 正确：合适的 batch_size
model.fit(X_train, y_train, batch_size=32)  # 通常 32、64、128
```

### 误区 3："不需要验证集"

**错！** 没有验证集就无法检测过拟合：

```python
# ❌ 错误：没有验证集
model.fit(X_train, y_train, epochs=10)

# ✅ 正确：划分验证集
model.fit(X_train, y_train, epochs=10, validation_split=0.2)
```

### 误区 4："保存模型只需要保存权重"

**不推荐。** 只保存权重需要重建结构，容易出错：

```python
# ❌ 不推荐：只保存权重
model.save_weights('weights.h5')
# 加载时需要先重建模型结构

# ✅ 推荐：保存整个模型
model.save('model.keras')
# 加载时直接恢复完整模型
loaded_model = keras.models.load_model('model.keras')
```

### 误区 5："训练准确率高就是好模型"

**不是的。** 要看验证集和测试集的准确率：

```python
# ❌ 错误：只看训练准确率
print(f"训练准确率: {history.history['accuracy'][-1]}")  # 99% 看起来很好

# ✅ 正确：同时看验证准确率
print(f"训练准确率: {history.history['accuracy'][-1]}")  # 99%
print(f"验证准确率: {history.history['val_accuracy'][-1]}")  # 85% 过拟合了！
```

---

## 8 动手练习

### 练习 1：基础练习

搭建一个 MNIST 手写数字识别模型，使用 `compile`、`fit`、`evaluate` 完成完整的训练和评估流程，并绘制训练曲线。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras
import matplotlib.pyplot as plt

# 加载数据
(X_train, y_train), (X_test, y_test) = keras.datasets.mnist.load_data()
X_train = X_train.astype('float32') / 255.0
X_test = X_test.astype('float32') / 255.0
X_train = X_train.reshape(-1, 784)
X_test = X_test.reshape(-1, 784)

# 搭建模型
model = keras.Sequential([
    keras.layers.Dense(256, activation='relu', input_shape=(784,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])

# 编译
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# 训练
history = model.fit(X_train, y_train, epochs=10, validation_split=0.2, verbose=1)

# 评估
test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
print(f"测试准确率: {test_acc:.4f}")

# 绘制训练曲线
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

ax1.plot(history.history['loss'], label='训练损失')
ax1.plot(history.history['val_loss'], label='验证损失')
ax1.set_title('损失曲线')
ax1.set_xlabel('Epoch')
ax1.set_ylabel('Loss')
ax1.legend()

ax2.plot(history.history['accuracy'], label='训练准确率')
ax2.plot(history.history['val_accuracy'], label='验证准确率')
ax2.set_title('准确率曲线')
ax2.set_xlabel('Epoch')
ax2.set_ylabel('Accuracy')
ax2.legend()

plt.tight_layout()
plt.show()
```

</details>

### 练习 2：进阶练习

在练习 1 的基础上，添加回调函数：早停（patience=5）、保存最佳模型、学习率衰减。训练完成后加载最佳模型并评估。

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras

# 加载数据
(X_train, y_train), (X_test, y_test) = keras.datasets.mnist.load_data()
X_train = X_train.astype('float32') / 255.0
X_test = X_test.astype('float32') / 255.0
X_train = X_train.reshape(-1, 784)
X_test = X_test.reshape(-1, 784)

# 搭建模型
model = keras.Sequential([
    keras.layers.Dense(256, activation='relu', input_shape=(784,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# 定义回调函数
callbacks = [
    keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True,
        verbose=1
    ),
    keras.callbacks.ModelCheckpoint(
        filepath='best_model.keras',
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3,
        min_lr=1e-6,
        verbose=1
    )
]

# 训练
history = model.fit(
    X_train, y_train,
    epochs=50,
    validation_split=0.2,
    callbacks=callbacks,
    verbose=1
)

# 加载最佳模型
best_model = keras.models.load_model('best_model.keras')

# 评估
test_loss, test_acc = best_model.evaluate(X_test, y_test, verbose=0)
print(f"最佳模型测试准确率: {test_acc:.4f}")
```

</details>

### 练习 3（挑战）：综合练习

实现一个完整的训练流程，包含以下功能：
1. 自定义回调函数：在每轮结束时打印当前学习率
2. 使用 TensorBoard 记录训练过程
3. 训练完成后保存模型为 SavedModel 格式
4. 加载模型并做预测

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow import keras
import numpy as np

# 自定义回调函数：打印学习率
class LRCallback(keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        lr = self.model.optimizer.learning_rate
        if hasattr(lr, 'numpy'):
            print(f" - 学习率: {lr.numpy():.6f}", end="")

# 加载数据
(X_train, y_train), (X_test, y_test) = keras.datasets.mnist.load_data()
X_train = X_train.astype('float32') / 255.0
X_test = X_test.astype('float32') / 255.0
X_train = X_train.reshape(-1, 784)
X_test = X_test.reshape(-1, 784)

# 搭建模型
model = keras.Sequential([
    keras.layers.Dense(256, activation='relu', input_shape=(784,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# 回调函数
callbacks = [
    LRCallback(),
    keras.callbacks.TensorBoard(log_dir='./logs', histogram_freq=1)
]

# 训练
history = model.fit(
    X_train, y_train,
    epochs=10,
    validation_split=0.2,
    callbacks=callbacks,
    verbose=1
)

# 保存为 SavedModel 格式
model.save('my_model_savedmodel')
print("模型已保存为 SavedModel 格式")

# 加载模型
loaded_model = keras.models.load_model('my_model_savedmodel')

# 预测
predictions = loaded_model.predict(X_test[:5])
for i in range(5):
    predicted_class = np.argmax(predictions[i])
    print(f"样本 {i}: 预测是 {predicted_class}, 实际是 {y_test[i]}")
```

</details>

---

## 下一章预告

下一章我们会学习 **卷积神经网络（CNN）**——这是深度学习在计算机视觉领域的核心架构。你会学到卷积层、池化层的工作原理，以及如何搭建一个 CNN 来做图像分类。CNN 是图像识别、目标检测等任务的基础，掌握它你就能进入计算机视觉的世界了。
