---
title: "第14章：自然语言处理实战"
description: "掌握 TensorFlow/Keras 中文本处理、词嵌入、文本分类和情感分析"
---

# 第14章：自然语言处理实战

## 1. 本章导读

在开始学习自然语言处理之前，你可能会有这些疑问：

- 什么是自然语言处理（NLP）？它能做什么？
- 计算机如何理解文本数据？
- 什么是词嵌入？Word2Vec 和 GloVe 是什么？
- 如何实现文本分类和情感分析？
- 什么是注意力机制和 Transformer？

这一章就是为了解答这些问题。自然语言处理让计算机能够理解和生成人类语言，掌握了它，你就能做聊天机器人、翻译系统、文本生成等有趣的项目。

---

## 2. 为什么需要 NLP？

### 痛点分析

**文本数据的挑战**：

想象一下你要分析用户评论：

- **传统方法**：手动提取特征，如关键词、词频
- **深度学习**：自动学习文本的语义表示
  - 理解上下文
  - 捕捉语义关系
  - 处理长距离依赖

**实际应用场景**：
- 文本分类：新闻分类、垃圾邮件检测
- 情感分析：产品评论分析、舆情监控
- 机器翻译：中译英、英译中
- 问答系统：智能客服、知识问答
- 文本生成：文章生成、对话生成
- 命名实体识别：人名、地名、组织名识别

### 生活化类比

> NLP 就像教计算机学语言：
> - **词嵌入**：把每个词变成一个向量，相似的词向量也相似
> - **RNN/LSTM**：像人一样阅读，记住前面的内容
> - **注意力机制**：像人一样，关注重要的词
> - **Transformer**：同时看所有词，理解全局关系

### NLP 任务分类

```
NLP 任务类型：

序列分类：
- 文本分类
- 情感分析

序列标注：
- 命名实体识别
- 词性标注

序列生成：
- 机器翻译
- 文本摘要
- 对话生成

问答系统：
- 阅读理解
- 知识问答
```

> **一句话总结**：NLP 让计算机能够理解和生成人类语言，应用广泛。

---

## 3. 核心原理讲解

### 文本表示方法

**词袋模型（Bag of Words）**：
```
文本："我喜欢深度学习"
词汇表：{我, 喜欢, 深度, 学习}

词袋表示：[1, 1, 1, 1]
只统计词频，不考虑顺序
```

**N-gram 模型**：
```
文本："我喜欢深度学习"
2-gram：{我喜欢, 喜欢深度, 深度学习}

考虑词的顺序，但维度爆炸
```

**词嵌入（Word Embedding）**：
```
把每个词映射到一个稠密向量
例如：
"猫" -> [0.2, 0.5, -0.1, ...]
"狗" -> [0.3, 0.4, -0.2, ...]

相似的词，向量也相似
```

### Word2Vec 原理

> Word2Vec 像学习单词的含义：
> - **CBOW**：根据上下文预测中心词
>   - 输入："猫 吃 [ ]" → 预测："鱼"
> - **Skip-gram**：根据中心词预测上下文
>   - 输入："鱼" → 预测："猫 吃"

### 词嵌入的优势

**独热编码 vs 词嵌入**：

| 特性 | 独热编码 | 词嵌入 |
|------|----------|--------|
| 维度 | 词汇表大小 | 固定（如 100-300） |
| 稀疏性 | 稀疏 | 稠密 |
| 语义关系 | 无 | 有 |
| 计算效率 | 低 | 高 |

### 文本分类流程

```
文本分类流程：
1. 文本预处理
   - 分词
   - 去除停用词
   - 词干提取

2. 文本向量化
   - 词嵌入
   - 序列填充

3. 模型构建
   - Embedding 层
   - RNN/LSTM/GRU
   - 全连接层

4. 训练和评估
   - 训练模型
   - 评估性能
```

### 注意力机制

> 注意力机制像人阅读文章：
> - 不是每个词都同等重要
> - 关注重要的词，忽略不重要的词
> - 动态调整关注程度

### Transformer 架构

```
Transformer 核心组件：

自注意力（Self-Attention）：
- 计算每个词与其他词的相关性
- 捕捉长距离依赖

多头注意力（Multi-Head Attention）：
- 多个注意力头
- 学习不同的关系

位置编码（Positional Encoding）：
- 添加位置信息
- 因为 Transformer 没有顺序

前馈网络（Feed-Forward Network）：
- 非线性变换
- 提取特征
```

> **一句话总结**：NLP 通过词嵌入和深度学习模型，实现文本的理解和生成。

---

## 4. 基础用法 + 逐行注释

### 4.1 文本预处理

```python
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np

# 示例文本数据
texts = [
    "我喜欢深度学习",
    "自然语言处理很有趣",
    "TensorFlow 是一个强大的框架",
    "Keras 让深度学习更简单",
    "词嵌入是 NLP 的基础"
]

# 创建 Tokenizer
# num_words: 只保留最常用的 num_words 个词
tokenizer = Tokenizer(num_words=10000)

# 拟合文本数据
# 构建词汇表
tokenizer.fit_on_texts(texts)

# 查看词汇表
word_index = tokenizer.word_index
print(f'词汇表大小: {len(word_index)}')
print(f'前10个词: {list(word_index.items())[:10]}')

# 文本转序列
# 每个词被替换为它在词汇表中的索引
sequences = tokenizer.texts_to_sequences(texts)
print(f'\n序列表示:')
for i, seq in enumerate(sequences):
    print(f'文本 {i+1}: {seq}')

# 序列填充
# 使所有序列长度一致
maxlen = 10  # 最大长度
padded_sequences = pad_sequences(
    sequences, 
    maxlen=maxlen,
    padding='post',  # 在末尾填充
    truncating='post',  # 从末尾截断
    value=0  # 填充值
)

print(f'\n填充后的序列形状: {padded_sequences.shape}')
print(f'填充后的序列:\n{padded_sequences}')

# 反向转换：序列转文本
def sequence_to_text(sequence, word_index):
    """将序列转换回文本"""
    index_to_word = {v: k for k, v in word_index.items()}
    words = [index_to_word.get(i, '<UNK>') for i in sequence if i > 0]
    return ' '.join(words)

print(f'\n反向转换示例:')
print(sequence_to_text(padded_sequences[0], word_index))
```

### 4.2 词嵌入层

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.datasets import imdb
from tensorflow.keras.preprocessing import sequence

# 加载 IMDB 数据集
# 数据已经预处理，每个词用整数表示
max_features = 10000  # 词汇表大小
maxlen = 500  # 序列最大长度

print('加载数据...')
(x_train, y_train), (x_test, y_test) = imdb.load_data(num_words=max_features)
print(f'训练样本数: {len(x_train)}')
print(f'测试样本数: {len(x_test)}')

# 填充序列
x_train = sequence.pad_sequences(x_train, maxlen=maxlen)
x_test = sequence.pad_sequences(x_test, maxlen=maxlen)
print(f'训练数据形状: {x_train.shape}')  # (25000, 500)
print(f'测试数据形状: {x_test.shape}')    # (25000, 500)

# 构建模型
model = models.Sequential()

# 词嵌入层
# 把每个词的整数编码转换成稠密向量
# input_dim: 词汇表大小
# output_dim: 嵌入向量维度
# input_length: 输入序列长度
model.add(layers.Embedding(
    input_dim=max_features,  # 词汇表大小
    output_dim=128,          # 嵌入向量维度
    input_length=maxlen      # 输入序列长度
))

# 查看嵌入层的权重
# 权重形状: (词汇表大小, 嵌入维度)
embedding_layer = model.layers[0]
embedding_weights = embedding_layer.get_weights()
print(f'\n嵌入权重形状: {embedding_weights[0].shape}')  # (10000, 128)

# 使用预训练的词嵌入
# 例如：GloVe 或 Word2Vec
def load_glove_embeddings(glove_path, embedding_dim=100):
    """加载预训练的 GloVe 词嵌入"""
    embeddings_index = {}
    
    with open(glove_path, encoding='utf-8') as f:
        for line in f:
            values = line.split()
            word = values[0]
            coefs = np.asarray(values[1:], dtype='float32')
            embeddings_index[word] = coefs
    
    return embeddings_index

# 创建嵌入矩阵
def create_embedding_matrix(word_index, embeddings_index, embedding_dim):
    """创建嵌入矩阵"""
    vocab_size = len(word_index) + 1
    embedding_matrix = np.zeros((vocab_size, embedding_dim))
    
    for word, i in word_index.items():
        embedding_vector = embeddings_index.get(word)
        if embedding_vector is not None:
            embedding_matrix[i] = embedding_vector
    
    return embedding_matrix

# 使用示例（假设你有 GloVe 文件）
# glove_embeddings = load_glove_embeddings('glove.6B.100d.txt')
# embedding_matrix = create_embedding_matrix(word_index, glove_embeddings, 100)
# 
# model.add(layers.Embedding(
#     input_dim=vocab_size,
#     output_dim=100,
#     weights=[embedding_matrix],
#     trainable=False  # 是否微调
# ))
```

### 4.3 文本分类模型

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.datasets import imdb
from tensorflow.keras.preprocessing import sequence

# 加载数据
max_features = 10000
maxlen = 500

(x_train, y_train), (x_test, y_test) = imdb.load_data(num_words=max_features)
x_train = sequence.pad_sequences(x_train, maxlen=maxlen)
x_test = sequence.pad_sequences(x_test, maxlen=maxlen)

# 方法1：使用 LSTM
model_lstm = models.Sequential([
    # 词嵌入层
    layers.Embedding(max_features, 128, input_length=maxlen),
    
    # LSTM 层
    layers.LSTM(64, dropout=0.2, recurrent_dropout=0.2),
    
    # 全连接层
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.5),
    
    # 输出层
    layers.Dense(1, activation='sigmoid')
])

model_lstm.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

print('LSTM 模型结构:')
model_lstm.summary()

# 训练
print('\n训练 LSTM 模型...')
history_lstm = model_lstm.fit(
    x_train, y_train,
    batch_size=32,
    epochs=5,
    validation_split=0.2
)

# 方法2：使用 GRU
model_gru = models.Sequential([
    layers.Embedding(max_features, 128, input_length=maxlen),
    layers.GRU(64, dropout=0.2, recurrent_dropout=0.2),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(1, activation='sigmoid')
])

model_gru.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 方法3：使用双向 LSTM
model_bilstm = models.Sequential([
    layers.Embedding(max_features, 128, input_length=maxlen),
    layers.Bidirectional(layers.LSTM(64, dropout=0.2, recurrent_dropout=0.2)),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(1, activation='sigmoid')
])

model_bilstm.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 评估模型
print('\n评估模型...')
loss_lstm, acc_lstm = model_lstm.evaluate(x_test, y_test)
print(f'LSTM 测试集准确率: {acc_lstm:.4f}')

loss_gru, acc_gru = model_gru.evaluate(x_test, y_test)
print(f'GRU 测试集准确率: {acc_gru:.4f}')

loss_bilstm, acc_bilstm = model_bilstm.evaluate(x_test, y_test)
print(f'Bidirectional LSTM 测试集准确率: {acc_bilstm:.4f}')
```

### 4.4 情感分析实战

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np

# 自定义情感分析数据集
texts = [
    "这部电影真的很精彩，我喜欢",
    "剧情太糟糕了，浪费时间",
    "演员表演出色，值得一看",
    "故事平淡无奇，没什么意思",
    "视觉效果震撼，非常棒",
    "对话生硬，不自然",
    "音乐优美，情节感人",
    "节奏拖沓，看得想睡觉",
    "导演功力深厚，值得学习",
    "烂片一部，不要去看"
]

# 标签：1 表示正面，0 表示负面
labels = np.array([1, 0, 1, 0, 1, 0, 1, 0, 1, 0])

# 文本预处理
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

tokenizer = Tokenizer(num_words=1000)
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)

# 填充序列
maxlen = 20
x_data = pad_sequences(sequences, maxlen=maxlen)
y_data = labels

# 构建情感分析模型
model = models.Sequential([
    # 词嵌入层
    layers.Embedding(1000, 64, input_length=maxlen),
    
    # 双向 LSTM
    layers.Bidirectional(layers.LSTM(32)),
    
    # 全连接层
    layers.Dense(32, activation='relu'),
    layers.Dropout(0.5),
    
    # 输出层
    layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 训练
print('训练情感分析模型...')
model.fit(
    x_data, y_data,
    batch_size=2,
    epochs=20,
    verbose=1
)

# 预测函数
def predict_sentiment(text):
    """预测文本情感"""
    # 文本转序列
    seq = tokenizer.texts_to_sequences([text])
    # 填充
    padded = pad_sequences(seq, maxlen=maxlen)
    # 预测
    prediction = model.predict(padded)[0][0]
    
    sentiment = '正面' if prediction > 0.5 else '负面'
    print(f'文本: {text}')
    print(f'情感: {sentiment} (置信度: {prediction:.4f})')
    print()

# 测试
test_texts = [
    "这部电影非常好看",
    "太差了，不推荐",
    "演员演技在线，剧情也不错",
    "浪费时间，烂片"
]

for text in test_texts:
    predict_sentiment(text)
```

### 4.5 使用预训练模型

```python
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np

# 使用 TensorFlow Hub 的预训练模型

# 方法1：使用 Universal Sentence Encoder
# 可以把文本转换为向量表示
embed = hub.load("https://tfhub.dev/google/universal-sentence-encoder/4")

# 文本列表
sentences = [
    "我喜欢深度学习",
    "自然语言处理很有趣",
    "TensorFlow 是一个强大的框架"
]

# 获取文本嵌入
embeddings = embed(sentences)
print(f'文本嵌入形状: {embeddings.shape}')  # (3, 512)

# 计算相似度
def cosine_similarity(a, b):
    """计算余弦相似度"""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

similarity = cosine_similarity(embeddings[0], embeddings[1])
print(f'\n句子1和句子2的相似度: {similarity:.4f}')

# 方法2：使用 BERT
# BERT 是强大的预训练语言模型
import tensorflow_text as text

# 加载 BERT 预处理器
bert_preprocess = hub.KerasLayer(
    "https://tfhub.dev/tensorflow/bert_en_uncased_preprocess/3"
)

# 加载 BERT 模型
bert = hub.KerasLayer(
    "https://tfhub.dev/tensorflow/bert_en_uncased_L-12_H-768_A-12/4"
)

# 构建文本分类模型
def build_bert_classifier(num_classes=2):
    """构建基于 BERT 的文本分类模型"""
    # 输入层
    text_input = tf.keras.Input(shape=(), dtype=tf.string, name='text')
    
    # 预处理
    preprocessed_text = bert_preprocess(text_input)
    
    # BERT 编码
    outputs = bert(preprocessed_text)
    
    # 使用 [CLS] 标记的输出
    pooled_output = outputs["pooled_output"]
    
    # 分类头
    x = tf.keras.layers.Dropout(0.3)(pooled_output)
    x = tf.keras.layers.Dense(128, activation='relu')(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    predictions = tf.keras.layers.Dense(num_classes, activation='softmax')(x)
    
    model = tf.keras.Model(text_input, predictions)
    return model

# 创建模型
bert_model = build_bert_classifier(num_classes=2)

bert_model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

bert_model.summary()
```

---

## 5. 对比表格

### 文本表示方法对比

| 方法 | 维度 | 稀疏性 | 语义关系 | 计算效率 |
|------|------|--------|----------|----------|
| 词袋模型 | 词汇表大小 | 稀疏 | 无 | 低 |
| N-gram | 很大 | 稀疏 | 部分 | 很低 |
| TF-IDF | 词汇表大小 | 稀疏 | 无 | 中 |
| Word2Vec | 固定（100-300） | 稠密 | 有 | 高 |
| GloVe | 固定 | 稠密 | 有 | 高 |
| BERT | 768 | 稠密 | 强 | 中 |

### NLP 模型对比

| 模型 | 类型 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|----------|
| LSTM | RNN | 处理长序列 | 慢，梯度消失 | 文本分类 |
| GRU | RNN | 快，参数少 | 性能略差 | 实时应用 |
| BiLSTM | RNN | 双向信息 | 慢 | 序列标注 |
| Transformer | Attention | 并行，长距离 | 计算量大 | 翻译，生成 |
| BERT | Transformer | 预训练，强大 | 大，慢 | 通用任务 |

### 词嵌入模型对比

| 模型 | 训练方式 | 优点 | 缺点 | 适用场景 |
|------|----------|------|------|----------|
| Word2Vec | 局部上下文 | 快，简单 | 不考虑多义词 | 通用 |
| GloVe | 全局统计 | 语义好 | 慢 | 语义任务 |
| FastText | 子词信息 | 处理未登录词 | 复杂 | 多语言 |
| ELMo | 上下文相关 | 多义词 | 慢 | 复杂任务 |
| BERT | 双向上下文 | 最强 | 最大最慢 | SOTA |

---

## 6. 新手常见误区

### 误区1：文本可以直接输入模型

❌ **错误写法**：
```python
# 直接使用文本
texts = ["我喜欢深度学习", "NLP很有趣"]
model.fit(texts, labels)  # 报错！
```

✅ **正确写法**：
```python
# 先转换为数值
tokenizer = Tokenizer()
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
padded = pad_sequences(sequences, maxlen=20)
model.fit(padded, labels)
```

### 误区2：不需要处理序列长度

❌ **错误想法**：不同长度的文本可以直接训练

✅ **实际情况**：
- RNN 需要固定长度的输入
- 需要填充或截断
- 填充值通常为 0
- 注意填充位置（前填充/后填充）

### 误区3：词嵌入维度越大越好

❌ **错误想法**：嵌入维度设置为 1000 效果最好

✅ **实际情况**：
- 维度太大会过拟合
- 通常 100-300 就足够
- 根据数据集大小调整
- 小数据集用小维度

### 误区4：不需要预处理

❌ **错误写法**：
```python
# 直接使用原始文本
text = "I love Deep Learning!!! @AI #NLP"
model.predict([text])
```

✅ **正确写法**：
```python
# 文本预处理
import re

def preprocess_text(text):
    # 转小写
    text = text.lower()
    # 去除特殊字符
    text = re.sub(r'[^a-z\s]', '', text)
    # 去除多余空格
    text = ' '.join(text.split())
    return text

text = preprocess_text(text)
```

### 误区5：忽略数据不平衡

❌ **错误想法**：正负样本比例 1:10 也没关系

✅ **实际情况**：
- 类别不平衡会影响模型性能
- 使用类别权重
- 使用过采样/欠采样
- 使用 F1 分数评估

---

## 7. 动手练习

### 练习1：基础 - 构建文本分类模型

**任务**：使用 LSTM 对 IMDB 数据集进行情感分类

**要求**：
- 使用词嵌入层
- 使用 LSTM 处理序列
- 达到 85% 以上准确率

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.datasets import imdb
from tensorflow.keras.preprocessing import sequence

# 加载数据
max_features = 10000
maxlen = 200

(x_train, y_train), (x_test, y_test) = imdb.load_data(num_words=max_features)
x_train = sequence.pad_sequences(x_train, maxlen=maxlen)
x_test = sequence.pad_sequences(x_test, maxlen=maxlen)

# 构建模型
model = models.Sequential([
    layers.Embedding(max_features, 128, input_length=maxlen),
    layers.LSTM(64, dropout=0.2),
    layers.Dense(64, activation='relu'),
    layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# 训练
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

### 练习2：进阶 - 使用预训练词嵌入

**任务**：使用预训练的 GloVe 词嵌入训练文本分类模型

**要求**：
- 加载 GloVe 词向量
- 创建嵌入矩阵
- 冻结嵌入层训练

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np

# 假设你已经下载了 GloVe 文件
def load_glove_embeddings(file_path, embedding_dim=100):
    """加载 GloVe 词嵌入"""
    embeddings_index = {}
    
    with open(file_path, encoding='utf-8') as f:
        for line in f:
            values = line.split()
            word = values[0]
            coefs = np.asarray(values[1:], dtype='float32')
            embeddings_index[word] = coefs
    
    return embeddings_index

# 加载 GloVe
glove_embeddings = load_glove_embeddings('glove.6B.100d.txt')

# 创建嵌入矩阵
def create_embedding_matrix(word_index, embeddings_index, embedding_dim):
    vocab_size = len(word_index) + 1
    embedding_matrix = np.zeros((vocab_size, embedding_dim))
    
    for word, i in word_index.items():
        embedding_vector = embeddings_index.get(word)
        if embedding_vector is not None:
            embedding_matrix[i] = embedding_vector
    
    return embedding_matrix

# 假设你有 word_index
# embedding_matrix = create_embedding_matrix(word_index, glove_embeddings, 100)

# 构建模型
model = models.Sequential([
    layers.Embedding(
        vocab_size, 
        100, 
        weights=[embedding_matrix],
        trainable=False,  # 冻结嵌入层
        input_length=maxlen
    ),
    layers.LSTM(64),
    layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)
```

</details>

### 练习3：挑战 - 实现注意力机制

**任务**：在 LSTM 模型中添加注意力机制

**要求**：
- 实现自定义注意力层
- 集成到模型中
- 可视化注意力权重

<details>
<summary>点击查看答案</summary>

```python
import tensorflow as tf
from tensorflow.keras import layers, models

class AttentionLayer(layers.Layer):
    """自定义注意力层"""
    def __init__(self, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)
    
    def build(self, input_shape):
        # 可训练参数
        self.W = self.add_weight(
            name='attention_weight',
            shape=(input_shape[-1], 1),
            initializer='random_normal',
            trainable=True
        )
        self.b = self.add_weight(
            name='attention_bias',
            shape=(input_shape[1], 1),
            initializer='zeros',
            trainable=True
        )
        super(AttentionLayer, self).build(input_shape)
    
    def call(self, x):
        # 计算注意力权重
        e = tf.keras.backend.tanh(tf.keras.backend.dot(x, self.W) + self.b)
        a = tf.keras.backend.softmax(e, axis=1)
        
        # 加权求和
        output = x * a
        
        return tf.keras.backend.sum(output, axis=1)

# 构建带注意力的模型
model = models.Sequential([
    layers.Embedding(10000, 128, input_length=500),
    layers.LSTM(64, return_sequences=True),  # 返回所有时间步
    AttentionLayer(),  # 自定义注意力层
    layers.Dense(64, activation='relu'),
    layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

model.summary()
```

</details>

---

## 8. 下一章预告

恭喜你完成了自然语言处理的学习！现在你已经掌握了：

- 文本预处理和向量化方法
- 词嵌入的原理和使用
- 文本分类和情感分析
- 预训练模型的应用

**下一章我们将学习模型部署与优化**，这是将模型应用到实际项目的关键步骤：

- 如何保存和加载模型
- 模型压缩和加速
- TensorFlow Serving 部署
- 移动端部署

模型部署让训练好的模型真正发挥作用，掌握它你就能把模型应用到生产环境中！
