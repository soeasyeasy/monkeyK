---
title: "第9章：循环神经网络（RNN）"
description: "掌握 TensorFlow/Keras 中 RNN、LSTM、GRU 原理，实现序列数据处理"
---

# 第9章：循环神经网络（RNN）

## 1. 本章导读

在开始学习循环神经网络之前，你可能会有这些疑问：

- 什么是循环神经网络？它和普通神经网络有什么不同？
- 为什么要用 RNN？全连接网络处理不了序列数据吗？
- LSTM 和 GRU 是什么？为什么要有这么多变种？
- RNN 能用来做什么？实际应用场景有哪些？
- 如何处理变长的序列数据？

这一章就是为了解答这些问题。RNN 是处理序列数据（文本、时间序列、语音）的核心技术，掌握了它，你就能做很多实用的项目。

---

## 2. 为什么需要 RNN？

### 痛点分析

想象一下你要理解一句话："我昨天去了北京，今天去了上海"

**用全连接网络的问题**：
- 每个词独立处理，"上海"和"北京"之间没有联系
- 无法理解时间顺序和上下文关系
- 就像看照片一样，只能看到瞬间，看不到过程

**用 RNN 的优势**：
- 像人一样阅读，记住前面的信息
- 理解"今天去了上海"时，知道之前去过北京
- 有记忆能力，能处理序列数据

### 生活化类比

> RNN 就像你看连续剧：
> - 每一集（时间步）你都会看
> - 你会记住之前的剧情（隐藏状态）
> - 看新一集时，结合之前的记忆理解新内容
> - 这样你才能理解完整的故事情节

### 序列数据的特点

```
"我 喜欢 深度 学习"
 ↓    ↓     ↓     ↓
词1  词2   词3   词4

问题：理解"学习"需要知道前面是"深度"
解决：RNN 会传递之前的信息到下一步
```

> **一句话总结**：RNN 有记忆能力，能处理有顺序关系的序列数据。

---

## 3. 核心原理讲解

### RNN 的基本结构

打个比方：

> RNN 像一个勤奋的学生：
> - 每学一个新知识（输入 xt）
> - 会结合之前学到的知识（隐藏状态 ht-1）
> - 形成新的理解（新的隐藏状态 ht）
> - 这个理解会传给下一步

### 数学原理（通俗版）

```
隐藏状态更新：
ht = tanh(Whh · ht-1 + Wxh · xt + bh)

输出：
yt = Why · ht + by

其中：
- ht: 当前时刻的隐藏状态（记忆）
- ht-1: 上一时刻的隐藏状态
- xt: 当前输入
- Whh, Wxh, Why: 权重矩阵（可学习的参数）
- tanh: 激活函数，把值压缩到 -1 到 1 之间
```

### RNN 的问题：梯度消失

**问题**：
- 序列太长时，早期的信息会逐渐消失
- 就像你背一篇长文章，背着背着就忘了开头

**解决方案**：
- LSTM（长短期记忆网络）：加入门控机制
- GRU（门控循环单元）：LSTM 的简化版

### LSTM 的核心思想

> LSTM 像一个聪明的图书管理员：
> - 有选择性记住重要信息（遗忘门）
> - 有选择性保存新信息（输入门）
> - 有选择性输出信息（输出门）
> - 这样就能记住长期依赖关系

### GRU vs LSTM

| 特性 | LSTM | GRU |
|------|------|-----|
| 门控数量 | 3个门 | 2个门 |
| 参数数量 | 较多 | 较少 |
| 训练速度 | 较慢 | 较快 |
| 性能 | 长序列更好 | 短序列足够 |
| 复杂度 | 高 | 低 |

> **一句话总结**：LSTM 像精密的瑞士手表，GRU 像简约的电子表，各有优势。

---

## 4. 基础用法 + 逐行注释

### 4.1 简单 RNN 实现

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np

# 创建简单的 RNN 模型
model = models.Sequential()

# 添加 SimpleRNN 层
# input_shape: (时间步数, 特征数)
# units: 隐藏层神经元数量
model.add(layers.SimpleRNN(
    units=32,              # 隐藏层维度
    input_shape=(10, 5),   # 序列长度10，每个时间步5个特征
    return_sequences=False # False只返回最后时刻的输出
))

# 添加全连接输出层
model.add(layers.Dense(1, activation='sigmoid'))

# 编译模型
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 查看模型结构
model.summary()

# 创建模拟数据
# 100个样本，序列长度10，每个时间步5个特征
x_train = np.random.random((100, 10, 5))
y_train = np.random.randint(2, size=(100, 1))

# 训练模型
model.fit(
    x_train, 
    y_train, 
    epochs=10, 
    batch_size=32
)
```

### 4.2 LSTM 实现文本分类

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.datasets import imdb
from tensorflow.keras.preprocessing import sequence

# 设置词汇表大小
max_features = 10000  # 最常用的10000个词
maxlen = 500          # 每条评论最多500个词

# 加载 IMDB 数据集
# 数据已经预处理，每个词用整数表示
print('加载数据...')
(x_train, y_train), (x_test, y_test) = imdb.load_data(num_words=max_features)
print(f'训练样本数: {len(x_train)}')
print(f'测试样本数: {len(x_test)}')

# 填充序列，使长度一致
# 短的补0，长的截断
print('填充序列...')
x_train = sequence.pad_sequences(x_train, maxlen=maxlen)
x_test = sequence.pad_sequences(x_test, maxlen=maxlen)
print(f'训练数据形状: {x_train.shape}')  # (25000, 500)
print(f'测试数据形状: {x_test.shape}')    # (25000, 500)

# 构建 LSTM 模型
model = models.Sequential()

# 词嵌入层
# 把每个词的整数编码转换成稠密向量
model.add(layers.Embedding(
    input_dim=max_features,  # 词汇表大小
    output_dim=128,          # 嵌入向量维度
    input_length=maxlen      # 输入序列长度
))

# LSTM 层
# return_sequences=False 只返回最后一个时间步的输出
model.add(layers.LSTM(
    units=64,                # LSTM 单元数量
    dropout=0.2,             # 循环连接的 dropout
    recurrent_dropout=0.2    # 循环状态的 dropout
))

# 全连接输出层
# 二分类问题，用 sigmoid 激活
model.add(layers.Dense(1, activation='sigmoid'))

# 编译模型
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 查看模型结构
model.summary()

# 训练模型
print('开始训练...')
history = model.fit(
    x_train, y_train,
    batch_size=32,
    epochs=5,
    validation_split=0.2  # 20% 作为验证集
)

# 评估模型
print('评估模型...')
loss, accuracy = model.evaluate(x_test, y_test)
print(f'测试集损失: {loss:.4f}')
print(f'测试集准确率: {accuracy:.4f}')
```

### 4.3 GRU 实现时间序列预测

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
import matplotlib.pyplot as plt

# 生成模拟的时间序列数据
# 比如股票价格、温度等
def generate_data(n_samples=1000, sequence_length=30):
    """生成正弦波数据用于预测"""
    x = []
    y = []
    
    for i in range(n_samples):
        # 随机起始点
        start = np.random.randint(0, 100)
        # 生成连续的正弦波序列
        sequence = np.sin(np.arange(start, start + sequence_length + 1) * 0.1)
        x.append(sequence[:-1])  # 前30个值作为输入
        y.append(sequence[-1])   # 第31个值作为目标
    
    return np.array(x), np.array(y)

# 生成训练和测试数据
x_train, y_train = generate_data(800)
x_test, y_test = generate_data(200)

# 调整形状以适配 RNN 输入
# RNN 期望的输入形状: (batch_size, time_steps, features)
x_train = x_train.reshape((x_train.shape[0], x_train.shape[1], 1))
x_test = x_test.reshape((x_test.shape[0], x_test.shape[1], 1))

print(f'训练数据形状: {x_train.shape}')  # (800, 30, 1)
print(f'测试数据形状: {x_test.shape}')    # (200, 30, 1)

# 构建 GRU 模型
model = models.Sequential()

# GRU 层
model.add(layers.GRU(
    units=64,
    input_shape=(30, 1),
    return_sequences=False
))

# 全连接层
model.add(layers.Dense(32, activation='relu'))
model.add(layers.Dense(1))  # 回归问题，不需要激活函数

# 编译模型
model.compile(
    optimizer='adam',
    loss='mse'  # 均方误差，适合回归任务
)

# 训练模型
history = model.fit(
    x_train, y_train,
    epochs=50,
    batch_size=32,
    validation_data=(x_test, y_test),
    verbose=1
)

# 预测
predictions = model.predict(x_test)

# 可视化结果
plt.figure(figsize=(12, 6))
plt.plot(y_test[:50], label='真实值', marker='o')
plt.plot(predictions[:50], label='预测值', marker='x')
plt.xlabel('样本')
plt.ylabel('值')
plt.title('时间序列预测结果')
plt.legend()
plt.show()
```

### 4.4 双向 RNN

```python
import tensorflow as tf
from tensorflow.keras import layers, models

# 双向 RNN 可以同时利用过去和未来的信息
# 比如：理解一句话中间的词，需要看前后文

model = models.Sequential()

# 双向 LSTM
# 会同时从左到右和从右到左处理序列
model.add(layers.Bidirectional(
    layers.LSTM(64, return_sequences=True),
    input_shape=(100, 128)
))

# 再添加一层双向 LSTM
model.add(layers.Bidirectional(layers.LSTM(32)))

# 输出层
model.add(layers.Dense(10, activation='softmax'))

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()
```

---

## 5. 对比表格

### RNN 类型对比

| 特性 | SimpleRNN | LSTM | GRU |
|------|-----------|------|-----|
| 结构复杂度 | 简单 | 复杂 | 中等 |
| 参数数量 | 最少 | 最多 | 中等 |
| 训练速度 | 最快 | 最慢 | 中等 |
| 长序列处理 | 差（梯度消失） | 好 | 较好 |
| 适用场景 | 短序列 | 长序列 | 中短序列 |
| 记忆能力 | 弱 | 强 | 较强 |

### RNN vs CNN 对比

| 特性 | RNN | CNN |
|------|-----|-----|
| 输入类型 | 序列数据 | 网格数据（图像） |
| 参数共享 | 时间步共享 | 空间共享 |
| 局部连接 | 无 | 有（卷积核） |
| 顺序敏感 | 是 | 否 |
| 典型应用 | 文本、语音、时间序列 | 图像、视频 |
| 并行计算 | 难（依赖前一步） | 易 |

### 常见 RNN 应用场景

| 应用 | 输入 | 输出 | 示例 |
|------|------|------|------|
| 文本分类 | 文本序列 | 类别 | 情感分析 |
| 机器翻译 | 源语言序列 | 目标语言序列 | 中译英 |
| 语音识别 | 语音信号 | 文本 | 语音转文字 |
| 时间序列预测 | 历史数据 | 未来值 | 股票预测 |
| 图像描述 | 图像 | 文本序列 | 看图说话 |

---

## 6. 新手常见误区

### 误区1：RNN 可以处理任意长度的序列

❌ **错误想法**：RNN 理论上可以处理无限长的序列

✅ **实际情况**：
- 序列太长会导致梯度消失或爆炸
- 实际应用中需要限制序列长度
- 长序列考虑使用 LSTM/GRU 或截断

### 误区2：SimpleRNN 和 LSTM 效果差不多

❌ **错误想法**：SimpleRNN 简单，效果应该和 LSTM 差不多

✅ **实际情况**：
- SimpleRNN 只能处理短序列
- 超过 10-20 个时间步，SimpleRNN 性能急剧下降
- LSTM/GRU 能处理更长的依赖关系

### 误区3：RNN 层数越多越好

❌ **错误想法**：堆叠很多层 RNN 效果会更好

✅ **实际情况**：
- RNN 层数太多容易过拟合
- 通常 1-2 层就足够
- 更深的网络考虑用 CNN 或 Transformer

### 误区4：不需要处理序列长度

❌ **错误写法**：
```python
# 不同长度的序列直接扔给 RNN
sequences = [[1, 2, 3], [4, 5, 6, 7, 8]]  # 长度不一致
model.fit(sequences, labels)  # 会报错！
```

✅ **正确写法**：
```python
# 需要填充到相同长度
from tensorflow.keras.preprocessing import sequence
sequences_padded = sequence.pad_sequences(sequences, maxlen=10)
model.fit(sequences_padded, labels)
```

### 误区5：RNN 只能用于文本

❌ **错误想法**：RNN 只能处理文本数据

✅ **实际情况**：
- RNN 可以处理任何序列数据
- 时间序列（股票、天气）
- 音频信号
- 视频帧序列
- 甚至 DNA 序列

---

## 7. 动手练习

### 练习1：基础 - 构建简单的 RNN 模型

**任务**：创建一个 SimpleRNN 模型，用于二分类任务

**要求**：
- 输入序列长度 20，特征维度 10
- 使用 32 个 RNN 单元
- 输出层用 sigmoid 激活

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models

# 构建模型
model = models.Sequential()

# 添加 SimpleRNN 层
model.add(layers.SimpleRNN(
    units=32,              # 32个隐藏单元
    input_shape=(20, 10),  # 序列长度20，特征维度10
    activation='tanh'      # 默认激活函数
))

# 添加输出层
model.add(layers.Dense(1, activation='sigmoid'))

# 编译模型
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 查看模型结构
model.summary()
```

</details>

### 练习2：进阶 - LSTM 情感分析

**任务**：使用 LSTM 对 IMDB 电影评论进行情感分类

**要求**：
- 使用词嵌入层
- 使用 LSTM 处理序列
- 达到 85% 以上的准确率

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.datasets import imdb
from tensorflow.keras.preprocessing import sequence

# 参数设置
max_features = 10000  # 词汇表大小
maxlen = 200          # 序列最大长度

# 加载数据
(x_train, y_train), (x_test, y_test) = imdb.load_data(num_words=max_features)

# 填充序列
x_train = sequence.pad_sequences(x_train, maxlen=maxlen)
x_test = sequence.pad_sequences(x_test, maxlen=maxlen)

# 构建模型
model = models.Sequential()

# 词嵌入层
model.add(layers.Embedding(max_features, 128, input_length=maxlen))

# LSTM 层
model.add(layers.LSTM(64, dropout=0.2, recurrent_dropout=0.2))

# 输出层
model.add(layers.Dense(1, activation='sigmoid'))

# 编译和训练
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

model.fit(
    x_train, y_train,
    batch_size=32,
    epochs=5,
    validation_data=(x_test, y_test)
)

# 评估
loss, accuracy = model.evaluate(x_test, y_test)
print(f'准确率: {accuracy:.4f}')
```

</details>

### 练习3：挑战 - 时间序列预测

**任务**：使用 GRU 预测正弦波的未来值

**要求**：
- 用过去 50 个时间步预测下一个值
- 使用 GRU 而不是 LSTM
- 绘制预测结果对比图

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
import matplotlib.pyplot as plt

# 生成数据
def create_data(n_samples, seq_length):
    x, y = [], []
    for i in range(n_samples):
        start = np.random.randint(0, 100)
        seq = np.sin(np.arange(start, start + seq_length + 1) * 0.1)
        x.append(seq[:-1])
        y.append(seq[-1])
    return np.array(x), np.array(y)

# 准备数据
x_train, y_train = create_data(1000, 50)
x_test, y_test = create_data(200, 50)

# 调整形状
x_train = x_train.reshape(-1, 50, 1)
x_test = x_test.reshape(-1, 50, 1)

# 构建 GRU 模型
model = models.Sequential()
model.add(layers.GRU(64, input_shape=(50, 1)))
model.add(layers.Dense(32, activation='relu'))
model.add(layers.Dense(1))

model.compile(optimizer='adam', loss='mse')

# 训练
model.fit(x_train, y_train, epochs=50, batch_size=32, verbose=1)

# 预测
predictions = model.predict(x_test)

# 可视化
plt.figure(figsize=(12, 6))
plt.plot(y_test[:50], label='真实值', marker='o', linestyle='-')
plt.plot(predictions[:50], label='预测值', marker='x', linestyle='--')
plt.xlabel('样本索引')
plt.ylabel('预测值')
plt.title('GRU 时间序列预测')
plt.legend()
plt.grid(True)
plt.show()
```

</details>

---

## 8. 下一章预告

恭喜你完成了 RNN 的学习！现在你已经掌握了：

- RNN 的基本原理和应用场景
- LSTM 和 GRU 的优势
- 如何使用 TensorFlow/Keras 构建 RNN 模型
- 处理序列数据的技巧

**下一章我们将学习生成对抗网络（GAN）**，这是一个非常有趣的技术：

- 如何让 AI 生成逼真的图片
- 生成器和判别器如何对抗训练
- 实现一个简单的 GAN 生成手写数字
- GAN 的各种变体和应用

GAN 是深度学习中最有创意的技术之一，准备好进入 AI 创作的世界了吗？
