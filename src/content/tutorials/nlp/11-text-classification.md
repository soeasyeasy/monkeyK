---
title: "第11章：文本分类实战"
description: "情感分析、主题分类、垃圾邮件检测、多标签分类"
---

# 第11章：文本分类实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 文本分类有哪些常见任务？
- 情感分析是怎么判断好评差评的？
- 垃圾邮件检测的原理是什么？
- 多标签分类和多分类有什么区别？

这一章就是为了解答这些问题。我们会通过 **四个实战项目**，掌握文本分类的核心技术。

---

## 1 文本分类概述

### 1.1 什么是文本分类？

**文本分类** 是把文本分配到预定义类别的任务。

**数学表达**：
```
f: 文本 → 类别
f("这部电影太好看了") → 好评
f("今天天气不错") → 天气
```

### 1.2 常见任务类型

| 任务 | 输入 | 输出 | 应用 |
| --- | --- | --- | --- |
| **二分类** | 文本 | 2 个类别 | 情感分析、垃圾邮件检测 |
| **多分类** | 文本 | 多个类别（互斥） | 主题分类、语言识别 |
| **多标签分类** | 文本 | 多个类别（可共存） | 文章标签、疾病诊断 |

### 1.3 技术演进

| 方法 | 特点 | 代表 |
| --- | --- | --- |
| **规则方法** | 人工编写规则 | 正则表达式、关键词匹配 |
| **传统机器学习** | 特征工程 + 分类器 | TF-IDF + SVM/朴素贝叶斯 |
| **深度学习** | 自动学习特征 | CNN/RNN/LSTM |
| **预训练模型** | 迁移学习 | BERT、RoBERTa |

---

## 2 实战一：情感分析

### 2.1 任务描述

**目标**：判断电影评论是好评还是差评。

**数据集**：IMDb 电影评论数据集（25000 条训练，25000 条测试）

### 2.2 方法一：传统机器学习

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score, classification_report
import jieba

# 准备数据（简化示例）
train_texts = [
    "这部电影太好看了，剧情紧凑，演员演技在线",
    "剧情拖沓，演员演技尴尬，浪费时间",
    "非常精彩的电影，强烈推荐",
    "太差了，完全看不懂在讲什么",
    "值得一看，很有意义",
    "烂片，浪费生命"
]
train_labels = [1, 0, 1, 0, 1, 0]  # 1=好评，0=差评

# 中文分词
def tokenize(text):
    return ' '.join(jieba.lcut(text))

train_texts_tokenized = [tokenize(t) for t in train_texts]

# 构建管道：TF-IDF + 朴素贝叶斯
model = make_pipeline(
    TfidfVectorizer(max_features=5000),
    MultinomialNB()
)

# 训练
model.fit(train_texts_tokenized, train_labels)

# 测试
test_texts = [
    "这部电影真的很不错，值得一看",
    "剧情太无聊了，完全看不下去"
]
test_texts_tokenized = [tokenize(t) for t in test_texts]

predictions = model.predict(test_texts_tokenized)

for text, pred in zip(test_texts, predictions):
    label = "好评" if pred == 1 else "差评"
    print(f"'{text}' -> {label}")
```

### 2.3 方法二：深度学习（LSTM）

```python
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import jieba
import numpy as np

# 数据集
class SentimentDataset(Dataset):
    def __init__(self, texts, labels, word2idx, max_len=50):
        self.texts = texts
        self.labels = labels
        self.word2idx = word2idx
        self.max_len = max_len
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        
        # 分词
        words = jieba.lcut(text)
        
        # 转索引
        indices = [self.word2idx.get(w, self.word2idx['<unk>']) for w in words]
        
        # 填充或截断
        if len(indices) < self.max_len:
            indices += [self.word2idx['<pad>']] * (self.max_len - len(indices))
        else:
            indices = indices[:self.max_len]
        
        return torch.tensor(indices), torch.tensor(label, dtype=torch.long)

# 构建词汇表
texts = [
    "这部电影太好看了，剧情紧凑，演员演技在线",
    "剧情拖沓，演员演技尴尬，浪费时间",
    "非常精彩的电影，强烈推荐",
    "太差了，完全看不懂在讲什么",
    "值得一看，很有意义",
    "烂片，浪费生命"
]
labels = [1, 0, 1, 0, 1, 0]

word2idx = {'<pad>': 0, '<unk>': 1}
for text in texts:
    for word in jieba.lcut(text):
        if word not in word2idx:
            word2idx[word] = len(word2idx)

# 创建数据集和数据加载器
dataset = SentimentDataset(texts, labels, word2idx, max_len=30)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 模型
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_size, num_classes):
        super(LSTMClassifier, self).__init__()
        
        # 词嵌入层
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        
        # LSTM 层
        self.lstm = nn.LSTM(
            input_size=embedding_dim,
            hidden_size=hidden_size,
            num_layers=2,
            batch_first=True,
            dropout=0.3,
            bidirectional=True  # 双向 LSTM
        )
        
        # 全连接层
        self.fc = nn.Linear(hidden_size * 2, num_classes)
        self.dropout = nn.Dropout(0.3)
    
    def forward(self, x):
        # x: (batch, seq_len)
        embedded = self.embedding(x)  # (batch, seq_len, embedding_dim)
        
        # LSTM
        lstm_out, _ = self.lstm(embedded)  # (batch, seq_len, hidden_size*2)
        
        # 取最后一个时间步
        last_out = lstm_out[:, -1, :]  # (batch, hidden_size*2)
        
        # Dropout + 分类
        out = self.dropout(last_out)
        out = self.fc(out)  # (batch, num_classes)
        
        return out

# 训练
model = LSTMClassifier(
    vocab_size=len(word2idx),
    embedding_dim=100,
    hidden_size=128,
    num_classes=2
)

optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

num_epochs = 20
for epoch in range(num_epochs):
    total_loss = 0
    correct = 0
    total = 0
    
    for texts_batch, labels_batch in dataloader:
        optimizer.zero_grad()
        
        outputs = model(texts_batch)
        loss = criterion(outputs, labels_batch)
        
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        
        # 计算准确率
        _, predicted = torch.max(outputs, 1)
        total += labels_batch.size(0)
        correct += (predicted == labels_batch).sum().item()
    
    if (epoch + 1) % 5 == 0:
        print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {total_loss:.4f}, Acc: {100*correct/total:.2f}%")

# 测试
model.eval()
test_texts = ["这部电影真的很不错，值得一看", "剧情太无聊了，完全看不下去"]

with torch.no_grad():
    for text in test_texts:
        words = jieba.lcut(text)
        indices = [word2idx.get(w, word2idx['<unk>']) for w in words]
        
        if len(indices) < 30:
            indices += [word2idx['<pad>']] * (30 - len(indices))
        else:
            indices = indices[:30]
        
        input_tensor = torch.tensor([indices])
        output = model(input_tensor)
        pred = torch.argmax(output, dim=1).item()
        label = "好评" if pred == 1 else "差评"
        print(f"'{text}' -> {label}")
```

### 2.4 方法三：BERT 微调

```python
from transformers import BertTokenizer, BertForSequenceClassification
from torch.utils.data import Dataset, DataLoader
import torch

# 数据集
class BERTSentimentDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'label': torch.tensor(label, dtype=torch.long)
        }

# 准备数据
texts = [
    "这部电影太好看了，剧情紧凑，演员演技在线",
    "剧情拖沓，演员演技尴尬，浪费时间",
    "非常精彩的电影，强烈推荐",
    "太差了，完全看不懂在讲什么",
    "值得一看，很有意义",
    "烂片，浪费生命"
]
labels = [1, 0, 1, 0, 1, 0]

# 加载中文 BERT
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
dataset = BERTSentimentDataset(texts, labels, tokenizer, max_len=64)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 加载模型
model = BertForSequenceClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=2
)

# 优化器
from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)

# 训练
num_epochs = 5
for epoch in range(num_epochs):
    total_loss = 0
    correct = 0
    total = 0
    
    for batch in dataloader:
        optimizer.zero_grad()
        
        input_ids = batch['input_ids']
        attention_mask = batch['attention_mask']
        labels = batch['label']
        
        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=labels
        )
        
        loss = outputs.loss
        logits = outputs.logits
        
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        
        # 计算准确率
        _, predicted = torch.max(logits, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()
    
    print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}, Acc: {100*correct/total:.2f}%")

# 测试
model.eval()
test_texts = ["这部电影真的很不错，值得一看", "剧情太无聊了，完全看不下去"]

with torch.no_grad():
    for text in test_texts:
        inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=64)
        outputs = model(**inputs)
        pred = torch.argmax(outputs.logits, dim=1).item()
        label = "好评" if pred == 1 else "差评"
        print(f"'{text}' -> {label}")
```

---

## 3 实战二：主题分类

### 3.1 任务描述

**目标**：将新闻分类到不同主题（体育、娱乐、科技、财经等）。

**特点**：多分类任务（类别 > 2）。

### 3.2 实现代码

```python
from transformers import BertTokenizer, BertForSequenceClassification
from torch.utils.data import Dataset, DataLoader
import torch

# 数据集
class NewsDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'label': torch.tensor(label, dtype=torch.long)
        }

# 准备数据
texts = [
    "姚明带领火箭队取得胜利",  # 体育
    "周杰伦发布新专辑",        # 娱乐
    "苹果发布新款 iPhone",      # 科技
    "股市今日大涨",            # 财经
    "中国女排获得世界冠军",     # 体育
    "电影票房突破百亿",        # 娱乐
    "华为推出 5G 技术",        # 科技
    "央行下调利率"             # 财经
]
labels = [0, 1, 2, 3, 0, 1, 2, 3]  # 0=体育, 1=娱乐, 2=科技, 3=财经

# 加载模型
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForSequenceClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=4  # 4 个类别
)

# 创建数据集
dataset = NewsDataset(texts, labels, tokenizer, max_len=64)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 训练
from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

num_epochs = 5
for epoch in range(num_epochs):
    total_loss = 0
    
    for batch in dataloader:
        optimizer.zero_grad()
        
        outputs = model(
            input_ids=batch['input_ids'],
            attention_mask=batch['attention_mask'],
            labels=batch['label']
        )
        
        loss = outputs.loss
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")

# 测试
model.eval()
test_texts = [
    "NBA 总决赛今晚打响",
    "新歌登上热搜榜",
    "人工智能技术突破",
    "房价持续上涨"
]

label_map = {0: '体育', 1: '娱乐', 2: '科技', 3: '财经'}

with torch.no_grad():
    for text in test_texts:
        inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=64)
        outputs = model(**inputs)
        pred = torch.argmax(outputs.logits, dim=1).item()
        print(f"'{text}' -> {label_map[pred]}")
```

---

## 4 实战三：垃圾邮件检测

### 4.1 任务描述

**目标**：识别垃圾邮件（二分类）。

**特点**：类别不平衡（正常邮件多，垃圾邮件少）。

### 4.2 实现代码

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import jieba

# 准备数据
emails = [
    "恭喜您中奖 100 万，请点击链接领取",  # 垃圾
    "免费赠送礼品，立即领取",              # 垃圾
    "今晚一起吃饭吧",                      # 正常
    "明天开会的时间改了",                  # 正常
    "项目进度如何了",                      # 正常
    "您的账户异常，请立即验证",            # 垃圾
    "周末去爬山吗",                        # 正常
    "限时优惠，立即购买享受折扣"          # 垃圾
]
labels = [1, 1, 0, 0, 0, 1, 0, 1]  # 1=垃圾，0=正常

# 分词
def tokenize(text):
    return ' '.join(jieba.lcut(text))

emails_tokenized = [tokenize(e) for e in emails]

# 构建管道
model = RandomForestClassifier(n_estimators=100, random_state=42)
vectorizer = TfidfVectorizer(max_features=1000)

# 训练
X = vectorizer.fit_transform(emails_tokenized)
model.fit(X, labels)

# 测试
test_emails = [
    "恭喜您获得大奖，点击领取",
    "明天下午三点开会",
    "免费试用，限时优惠"
]
test_emails_tokenized = [tokenize(e) for e in test_emails]
X_test = vectorizer.transform(test_emails_tokenized)
predictions = model.predict(X_test)

for email, pred in zip(test_emails, predictions):
    label = "垃圾邮件" if pred == 1 else "正常邮件"
    print(f"'{email}' -> {label}")

# 评估
print("\n分类报告：")
print(classification_report(labels, model.predict(X)))
```

---

## 5 实战四：多标签分类

### 5.1 任务描述

**目标**：为文章打多个标签（如：科技、人工智能、机器学习）。

**特点**：一篇文章可以有多个标签。

### 5.2 实现代码

```python
import torch
import torch.nn as nn
from transformers import BertTokenizer, BertModel
from torch.utils.data import Dataset, DataLoader

# 多标签数据集
class MultiLabelDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels  # 多标签：[[1,0,1], [0,1,0], ...]
        self.tokenizer = tokenizer
        self.max_len = max_len
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        labels = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(labels, dtype=torch.float)
        }

# 准备数据
texts = [
    "深度学习是机器学习的一个分支",      # [科技, AI, 机器学习]
    "今天天气很好，适合出去散步",          # [生活, 天气]
    "苹果公司发布了新款 iPhone",           # [科技, 手机]
    "篮球比赛非常精彩",                    # [体育, 篮球]
    "人工智能正在改变世界",                # [科技, AI]
    "这部电影讲述了爱情故事"              # [娱乐, 电影]
]
labels = [
    [1, 1, 1, 0, 0, 0],  # 科技, AI, 机器学习
    [0, 0, 0, 1, 1, 0],  # 生活, 天气
    [1, 0, 0, 0, 0, 1],  # 科技, 手机
    [0, 0, 0, 0, 1, 0],  # 体育
    [1, 1, 0, 0, 0, 0],  # 科技, AI
    [0, 0, 0, 0, 0, 1]   # 娱乐
]

# 标签映射
label_names = ['科技', 'AI', '机器学习', '生活', '体育', '娱乐']

# 加载模型
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')

# 多标签分类模型
class MultiLabelClassifier(nn.Module):
    def __init__(self, num_labels):
        super(MultiLabelClassifier, self).__init__()
        self.bert = BertModel.from_pretrained('bert-base-chinese')
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(768, num_labels)
    
    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        return logits

# 创建数据集
dataset = MultiLabelDataset(texts, labels, tokenizer, max_len=64)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 模型
model = MultiLabelClassifier(num_labels=6)

# 优化器
from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

# 损失函数（多标签用 BCEWithLogitsLoss）
criterion = nn.BCEWithLogitsLoss()

# 训练
num_epochs = 10
for epoch in range(num_epochs):
    total_loss = 0
    
    for batch in dataloader:
        optimizer.zero_grad()
        
        logits = model(
            input_ids=batch['input_ids'],
            attention_mask=batch['attention_mask']
        )
        
        loss = criterion(logits, batch['labels'])
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    if (epoch + 1) % 2 == 0:
        print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")

# 测试
model.eval()
test_texts = [
    "机器学习算法在医疗领域的应用",
    "周末去看电影"
]

with torch.no_grad():
    for text in test_texts:
        inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=64)
        logits = model(inputs['input_ids'], inputs['attention_mask'])
        probs = torch.sigmoid(logits)
        preds = (probs > 0.5).int()
        
        print(f"\n文本：'{text}'")
        print("预测标签：")
        for i, (name, pred) in enumerate(zip(label_names, preds[0])):
            if pred == 1:
                print(f"  - {name}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **文本分类** | 将文本分配到预定义类别 |
| **二分类** | 2 个类别（如情感分析） |
| **多分类** | 多个互斥类别（如主题分类） |
| **多标签分类** | 多个可共存标签（如文章标签） |
| **方法选择** | 传统 ML 适合小数据，深度学习适合大数据，BERT 效果最好 |

---

## 7 新手常见误区

### 误区 1："分类问题只能用交叉熵损失"

**错！** 二分类可以用 BCELoss，多分类用 CrossEntropyLoss，多标签用 BCEWithLogitsLoss。要根据任务选择。

### 误区 2："BERT 一定比 LSTM 好"

不一定。BERT 效果好但慢，LSTM 快但效果稍差。如果数据量小或实时性要求高，LSTM 可能更合适。

### 误区 3："多标签分类就是多分类"

**错！** 多分类是互斥的（只能选一个），多标签是可以共存的（可以选多个）。损失函数和输出层都不同。

---

## 8 动手练习

### 练习 1：基础练习 - 情感分析

**题目**：使用 BERT 实现一个情感分析模型，区分正面和负面评论。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertTokenizer, BertForSequenceClassification
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForSequenceClassification.from_pretrained('bert-base-chinese', num_labels=2)

texts = ["这部电影太好看了", "剧情太无聊了"]
labels = [1, 0]

# 训练（简化）
from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

for text, label in zip(texts, labels):
    inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=64)
    outputs = model(**inputs, labels=torch.tensor([label]))
    loss = outputs.loss
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()

print("训练完成")
```

</details>

### 练习 2：进阶练习 - 主题分类

**题目**：实现一个新闻主题分类器，区分体育、娱乐、科技三个类别。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertTokenizer, BertForSequenceClassification
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForSequenceClassification.from_pretrained('bert-base-chinese', num_labels=3)

texts = ["姚明带领球队胜利", "周杰伦发新歌", "苹果发布新手机"]
labels = [0, 1, 2]  # 0=体育, 1=娱乐, 2=科技

# 训练
from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

for text, label in zip(texts, labels):
    inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=64)
    outputs = model(**inputs, labels=torch.tensor([label]))
    loss = outputs.loss
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()

print("训练完成")
```

</details>

### 练习 3（挑战）：综合练习 - 多标签分类

**题目**：实现一个多标签分类器，为文章打上多个标签。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
from transformers import BertTokenizer, BertModel

class MultiLabelClassifier(nn.Module):
    def __init__(self, num_labels):
        super().__init__()
        self.bert = BertModel.from_pretrained('bert-base-chinese')
        self.classifier = nn.Linear(768, num_labels)
    
    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        return self.classifier(outputs.pooler_output)

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = MultiLabelClassifier(num_labels=5)

texts = ["深度学习是人工智能的核心", "今天天气很好"]
labels = [[1, 1, 0, 0, 0], [0, 0, 1, 1, 0]]  # 多标签

# 训练
criterion = nn.BCEWithLogitsLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=2e-5)

for text, label in zip(texts, labels):
    inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=64)
    logits = model(inputs['input_ids'], inputs['attention_mask'])
    loss = criterion(logits, torch.tensor([label], dtype=torch.float))
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()

print("训练完成")
```

</details>

---

## 下一章预告

下一章我们会学习 **命名实体识别 NER**——也就是如何从文本中提取人名、地名、机构名等实体。你会学到序列标注、BIO 标注、BiLSTM-CRF 等技术。这是信息抽取的基础任务。
