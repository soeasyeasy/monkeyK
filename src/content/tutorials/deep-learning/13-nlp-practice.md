# 第 13 章：自然语言处理实战

## 本章导读

学完了 RNN 和 NLP 基础，本章将实战自然语言处理的核心任务：

1. 文本分类怎么做？从数据预处理到完整训练流程是怎样的？
2. 情感分析有哪些方法？如何处理中文文本？
3. 命名实体识别（NER）是什么？怎么用深度学习实现？
4. 机器翻译的原理是什么？Seq2Seq + Attention 怎么实现？
5. 预训练语言模型（BERT）怎么用？

## 技术必要性分析

自然语言处理（NLP）是人工智能的核心领域之一。从智能客服、机器翻译，到舆情分析、内容推荐，NLP 技术无处不在。

但直接处理文本面临挑战：

- **文本是非结构化的**：不像图像有固定的像素矩阵，文本长度不一、语义复杂
- **语言有歧义性**：同一个词在不同上下文含义不同（如"苹果"是水果还是手机？）
- **需要理解上下文**：句子含义依赖前后文，不能只看单个词

本章介绍的深度学习 NLP 技术，就是让机器真正"理解"人类语言。

## 核心原理讲解

### 1. 文本分类（Text Classification）

**任务**：给定一段文本，判断它属于哪个类别。

**流程**：

```
文本 -> 分词 -> 词嵌入 -> 序列模型（RNN/CNN/Transformer） -> 分类头 -> 类别
```

**应用场景**：

| 场景 | 输入 | 输出 |
|------|------|------|
| 垃圾邮件检测 | 邮件内容 | 垃圾/正常 |
| 新闻分类 | 新闻标题 | 体育/财经/科技... |
| 意图识别 | 用户问题 | 查询/投诉/咨询... |

### 2. 情感分析（Sentiment Analysis）

**任务**：判断文本的情感倾向（正面/负面/中性）。

**方法**：

| 方法 | 原理 | 优缺点 |
|------|------|--------|
| 词典法 | 统计情感词数量 | 简单但不够准确 |
| 机器学习 | 提取特征 + 分类器 | 需要特征工程 |
| 深度学习 | RNN/CNN/Transformer 自动学习 | 效果好，需要大量数据 |

### 3. 命名实体识别（Named Entity Recognition, NER）

**任务**：从文本中识别出人名、地名、机构名等实体。

**输出格式**：序列标注（BIO 或 BIOES）

```
输入：张三在北京大学读书
标注：B-PER I-PER O B-ORG I-ORG I-ORG O O
```

B（Begin）：实体开始
I（Inside）：实体内部
O（Outside）：非实体

### 4. 机器翻译（Machine Translation）

**任务**：将一种语言的文本翻译成另一种语言。

**经典架构**：Seq2Seq + Attention

```
源语言句子 -> 编码器（Encoder） -> 上下文向量 -> 解码器（Decoder） -> 目标语言句子
```

Attention 机制：解码时动态关注源句子的不同部分，而不是只用一个固定向量。

### 5. 预训练语言模型（BERT）

**核心思想**：在大规模语料上预训练，学习通用的语言表示，然后微调到下游任务。

**BERT 特点**：

- 双向 Transformer 编码器
- Masked Language Model（MLM）：随机遮盖词，预测被遮盖的词
- Next Sentence Prediction（NSP）：判断两个句子是否连续

**优势**：只需少量标注数据微调，就能在很多 NLP 任务上达到 SOTA 效果。

## 基础用法

### 文本分类完整流程

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import jieba
import re

# ===== 第一步：文本预处理 =====

def tokenize_chinese(text):
    """中文分词"""
    text = re.sub(r'[^\u4e00-\u9fa5]', '', text)  # 只保留中文字符
    words = jieba.lcut(text)                       # 使用结巴分词
    return words

# 示例
text = "这部电影非常好看，推荐给大家"
tokens = tokenize_chinese(text)
print(f"分词结果: {tokens}")

# 构建词汇表
class Vocabulary:
    """词汇表：词 -> 索引的映射"""
    def __init__(self):
        self.word2idx = {'<pad>': 0, '<unk>': 1}   # 特殊标记
        self.idx2word = {0: '<pad>', 1: '<unk>'}
        self.word_count = {}

    def add_sentence(self, sentence):
        """添加一个句子的词"""
        for word in sentence:
            if word not in self.word_count:
                self.word_count[word] = 0
            self.word_count[word] += 1

    def build(self, min_freq=1):
        """构建词汇表，过滤低频词"""
        idx = len(self.word2idx)
        for word, count in self.word_count.items():
            if count >= min_freq and word not in self.word2idx:
                self.word2idx[word] = idx
                self.idx2word[idx] = word
                idx += 1

    def encode(self, sentence, max_len=50):
        """将句子转换为索引序列"""
        tokens = tokenize_chinese(sentence) if isinstance(sentence, str) else sentence
        indices = [self.word2idx.get(w, 1) for w in tokens]  # 未知词用 <unk>

        # 填充或截断
        if len(indices) < max_len:
            indices += [0] * (max_len - len(indices))        # 填充 <pad>
        else:
            indices = indices[:max_len]                      # 截断

        return indices

    def __len__(self):
        return len(self.word2idx)

# 模拟训练数据
train_texts = [
    "这部电影非常好看，推荐给大家",
    "剧情太糟糕了，浪费我的时间",
    "演员表演很精彩，值得一看",
    "故事无聊，节奏太慢",
    "画面精美，特效震撼",
    "完全看不懂在讲什么",
]
train_labels = [1, 0, 1, 0, 1, 0]  # 1=正面，0=负面

# 构建词汇表
vocab = Vocabulary()
for text in train_texts:
    vocab.add_sentence(tokenize_chinese(text))
vocab.build(min_freq=1)

print(f"词汇表大小: {len(vocab)}")

# ===== 第二步：构建数据集 =====

class TextClassificationDataset(Dataset):
    """文本分类数据集"""
    def __init__(self, texts, labels, vocab, max_len=50):
        self.texts = texts
        self.labels = labels
        self.vocab = vocab
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text_indices = self.vocab.encode(self.texts[idx], self.max_len)
        label = self.labels[idx]
        return torch.tensor(text_indices, dtype=torch.long), torch.tensor(label, dtype=torch.float)

train_dataset = TextClassificationDataset(train_texts, train_labels, vocab, max_len=30)
train_loader = DataLoader(train_dataset, batch_size=2, shuffle=True)

# ===== 第三步：构建模型 =====

class TextCNN(nn.Module):
    """TextCNN：用 CNN 做文本分类"""
    def __init__(self, vocab_size, embed_dim=128, num_classes=2):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)  # 词嵌入层

        # 不同尺寸的卷积核，捕捉不同长度的 n-gram 特征
        self.convs = nn.ModuleList([
            nn.Conv1d(embed_dim, 64, kernel_size=3, padding=1),  # 3-gram
            nn.Conv1d(embed_dim, 64, kernel_size=4, padding=1),  # 4-gram
            nn.Conv1d(embed_dim, 64, kernel_size=5, padding=1),  # 5-gram
        ])

        self.dropout = nn.Dropout(0.5)
        self.fc = nn.Linear(64 * 3, num_classes)                 # 拼接后分类

    def forward(self, x):
        # x: [batch, seq_len]
        x = self.embedding(x)                                    # [batch, seq_len, embed_dim]
        x = x.permute(0, 2, 1)                                   # [batch, embed_dim, seq_len]

        # 多尺度卷积
        conv_outputs = []
        for conv in self.convs:
            out = conv(x)                                        # [batch, 64, seq_len]
            out = torch.relu(out)
            out = out.max(dim=2)[0]                              # 最大池化 [batch, 64]
            conv_outputs.append(out)

        x = torch.cat(conv_outputs, dim=1)                       # [batch, 192]
        x = self.dropout(x)
        x = self.fc(x)                                           # [batch, num_classes]
        return x

# 创建模型
model = TextCNN(vocab_size=len(vocab), embed_dim=128, num_classes=1)
print(model)

# ===== 第四步：训练 =====

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

criterion = nn.BCEWithLogitsLoss()                               # 二分类用 BCE
optimizer = optim.Adam(model.parameters(), lr=0.001)

num_epochs = 20

for epoch in range(num_epochs):
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for texts, labels in train_loader:
        texts, labels = texts.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(texts).squeeze()                         # [batch]
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        predicted = (torch.sigmoid(outputs) > 0.5).float()
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

    train_acc = 100. * correct / total
    print(f"Epoch [{epoch+1}/{num_epochs}] Loss: {total_loss/len(train_loader):.4f} Acc: {train_acc:.2f}%")

# ===== 第五步：推理 =====

def predict_sentiment(text, model, vocab, device):
    """预测文本情感"""
    model.eval()
    text_indices = vocab.encode(text, max_len=30)
    text_tensor = torch.tensor([text_indices], dtype=torch.long).to(device)

    with torch.no_grad():
        output = model(text_tensor)
        prob = torch.sigmoid(output).item()

    label = "正面" if prob > 0.5 else "负面"
    print(f"文本: {text}")
    print(f"情感: {label} (概率: {prob:.3f})")
    return label

# 测试
predict_sentiment("这部电影真的很精彩", model, vocab, device)
predict_sentiment("太难看了，完全不推荐", model, vocab, device)
```

### 情感分析（使用预训练词向量）

```python
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# 预训练词向量（模拟，实际使用时加载真实词向量如 Word2Vec、GloVe）
def load_pretrained_embeddings(vocab, embedding_dim=100):
    """加载预训练词向量"""
    # 实际项目中从文件加载
    # embeddings = load_glove_vectors('glove.6B.100d.txt', vocab)

    # 模拟随机初始化
    embeddings = torch.randn(len(vocab), embedding_dim)
    embeddings[0] = torch.zeros(embedding_dim)                   # <pad> 保持为 0
    return embeddings

class BiLSTMClassifier(nn.Module):
    """双向 LSTM 文本分类器"""
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes, pretrained_embeddings=None):
        super().__init__()

        # 词嵌入层
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)

        # 加载预训练词向量
        if pretrained_embeddings is not None:
            self.embedding.weight.data.copy_(pretrained_embeddings)
            self.embedding.weight.requires_grad = True           # 允许微调

        # 双向 LSTM
        self.lstm = nn.LSTM(
            embed_dim,
            hidden_dim,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=0.3
        )

        # 分类头
        self.attention = nn.Linear(hidden_dim * 2, 1)            # 注意力机制
        self.dropout = nn.Dropout(0.5)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)

    def attention_layer(self, lstm_output):
        """注意力层：加权求和"""
        # lstm_output: [batch, seq_len, hidden_dim*2]
        attn_weights = torch.softmax(self.attention(lstm_output), dim=1)  # [batch, seq_len, 1]
        context = torch.bmm(attn_weights.transpose(1, 2), lstm_output)    # [batch, 1, hidden_dim*2]
        return context.squeeze(1)

    def forward(self, x):
        # x: [batch, seq_len]
        x = self.embedding(x)                                    # [batch, seq_len, embed_dim]
        lstm_out, _ = self.lstm(x)                               # [batch, seq_len, hidden_dim*2]

        # 注意力加权
        context = self.attention_layer(lstm_out)                 # [batch, hidden_dim*2]

        x = self.dropout(context)
        x = self.fc(x)                                           # [batch, num_classes]
        return x

# 使用示例
vocab_size = 10000
embed_dim = 100
hidden_dim = 128

# 模拟预训练词向量
pretrained_embeddings = load_pretrained_embeddings(None, embed_dim)

model = BiLSTMClassifier(
    vocab_size=vocab_size,
    embed_dim=embed_dim,
    hidden_dim=hidden_dim,
    num_classes=2,
    pretrained_embeddings=pretrained_embeddings
)

print(model)
print(f"模型参数量: {sum(p.numel() for p in model.parameters()):,}")
```

### 命名实体识别（NER）

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# BIO 标注体系
# B-PER: 人名开始
# I-PER: 人名内部
# B-ORG: 机构名开始
# I-ORG: 机构名内部
# B-LOC: 地名开始
# I-LOC: 地名内部
# O: 非实体

# 示例数据
train_data = [
    {
        'text': ['张', '三', '在', '北', '京', '大', '学', '读', '书'],
        'labels': ['B-PER', 'I-PER', 'O', 'B-ORG', 'I-ORG', 'I-ORG', 'I-ORG', 'O', 'O']
    },
    {
        'text': ['李', '四', '去', '上', '海', '工', '作'],
        'labels': ['B-PER', 'I-PER', 'O', 'B-LOC', 'I-LOC', 'O', 'O']
    },
]

# 构建标签映射
label2idx = {'<pad>': 0, 'O': 1, 'B-PER': 2, 'I-PER': 3, 'B-ORG': 4, 'I-ORG': 5, 'B-LOC': 6, 'I-LOC': 7}
idx2label = {v: k for k, v in label2idx.items()}

class NERDataset(Dataset):
    """NER 数据集"""
    def __init__(self, data, vocab, label2idx, max_len=50):
        self.data = data
        self.vocab = vocab
        self.label2idx = label2idx
        self.max_len = max_len

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        text_indices = self.vocab.encode(item['text'], self.max_len)
        label_indices = [self.label2idx.get(l, 0) for l in item['labels']]

        # 填充
        if len(label_indices) < self.max_len:
            label_indices += [0] * (self.max_len - len(label_indices))
        else:
            label_indices = label_indices[:self.max_len]

        return torch.tensor(text_indices), torch.tensor(label_indices)

class BiLSTM_CRF(nn.Module):
    """BiLSTM + CRF 命名实体识别模型"""
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_tags):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=2, batch_first=True, bidirectional=True)
        self.dropout = nn.Dropout(0.5)
        self.hidden2tag = nn.Linear(hidden_dim * 2, num_tags)

        # CRF 层（简化版，实际使用需引入 torchcrf 库）
        self.transitions = nn.Parameter(torch.randn(num_tags, num_tags))  # 转移矩阵

    def forward(self, x):
        # x: [batch, seq_len]
        x = self.embedding(x)                                    # [batch, seq_len, embed_dim]
        lstm_out, _ = self.lstm(x)                               # [batch, seq_len, hidden_dim*2]
        lstm_out = self.dropout(lstm_out)
        emissions = self.hidden2tag(lstm_out)                    # [batch, seq_len, num_tags]
        return emissions

# 简化版：只用 BiLSTM，不用 CRF
class BiLSTM_NER(nn.Module):
    """BiLSTM 命名实体识别（简化版）"""
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_tags):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=2, batch_first=True, bidirectional=True, dropout=0.3)
        self.dropout = nn.Dropout(0.5)
        self.fc = nn.Linear(hidden_dim * 2, num_tags)

    def forward(self, x):
        x = self.embedding(x)
        lstm_out, _ = self.lstm(x)
        lstm_out = self.dropout(lstm_out)
        tags = self.fc(lstm_out)                                 # [batch, seq_len, num_tags]
        return tags

# 创建模型
vocab_size = 5000
model = BiLSTM_NER(vocab_size=vocab_size, embed_dim=100, hidden_dim=128, num_tags=len(label2idx))
print(model)

# 训练
optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss(ignore_index=0)                  # 忽略 <pad>

# 模拟训练数据
x = torch.randint(0, vocab_size, (4, 30))                        # [batch=4, seq_len=30]
y = torch.randint(0, len(label2idx), (4, 30))                    # [batch=4, seq_len=30]

for epoch in range(10):
    model.train()
    optimizer.zero_grad()
    outputs = model(x)                                           # [4, 30, num_tags]
    loss = criterion(outputs.view(-1, len(label2idx)), y.view(-1))
    loss.backward()
    optimizer.step()
    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")

# 推理
def predict_ner(text, model, vocab, label2idx):
    """预测命名实体"""
    model.eval()
    text_indices = vocab.encode(list(text), max_len=50)
    x = torch.tensor([text_indices])

    with torch.no_grad():
        outputs = model(x)                                       # [1, seq_len, num_tags]
        predictions = outputs.argmax(dim=2)[0]                   # [seq_len]

    # 解码
    entities = []
    current_entity = []
    current_type = None

    for i, idx in enumerate(predictions):
        if i >= len(text):
            break
        label = idx2label[idx.item()]
        if label.startswith('B-'):
            if current_entity:
                entities.append((current_type, ''.join(current_entity)))
            current_entity = [text[i]]
            current_type = label[2:]
        elif label.startswith('I-'):
            if current_type == label[2:]:
                current_entity.append(text[i])
        else:
            if current_entity:
                entities.append((current_type, ''.join(current_entity)))
                current_entity = []
                current_type = None

    if current_entity:
        entities.append((current_type, ''.join(current_entity)))

    return entities

# 注意：实际使用时需要先训练模型，这里只是演示推理流程
# entities = predict_ner("张三在北京大学读书", model, vocab, label2idx)
# print(f"识别到的实体: {entities}")
# 输出: [('PER', '张三'), ('ORG', '北京大学')]
```

### 使用 BERT 进行文本分类

```python
# 需要安装 transformers 库：pip install transformers

from transformers import BertTokenizer, BertForSequenceClassification
import torch

# 加载预训练 BERT 模型和分词器
model_name = 'bert-base-chinese'                                 # 中文 BERT
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(model_name, num_labels=2)

print(f"模型参数量: {sum(p.numel() for p in model.parameters()):,}")

# 文本预处理
texts = ["这部电影非常好看", "剧情太糟糕了"]

# 分词和编码
inputs = tokenizer(
    texts,
    padding=True,                                                # 填充到相同长度
    truncation=True,                                             # 截断超长部分
    max_length=128,                                              # 最大长度
    return_tensors='pt'                                          # 返回 PyTorch 张量
)

print(f"输入 IDs 形状: {inputs['input_ids'].shape}")             # [2, 128]
print(f"注意力掩码形状: {inputs['attention_mask'].shape}")       # [2, 128]

# 推理
model.eval()
with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits                                      # [2, 2]
    predictions = torch.argmax(logits, dim=1)                    # [2]

print(f"预测结果: {predictions}")                                # [1, 0] 或类似

# 微调 BERT
from torch.utils.data import Dataset, DataLoader
import torch.optim as optim

class SentimentDataset(Dataset):
    """情感分析数据集"""
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
            padding='max_length',
            truncation=True,
            max_length=self.max_len,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'label': torch.tensor(label, dtype=torch.long)
        }

# 模拟训练数据
train_texts = ["这部电影很好看", "太差了不推荐"] * 10
train_labels = [1, 0] * 10

train_dataset = SentimentDataset(train_texts, train_labels, tokenizer)
train_loader = DataLoader(train_dataset, batch_size=4, shuffle=True)

# 配置优化器（BERT 常用 AdamW）
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

optimizer = optim.AdamW(model.parameters(), lr=2e-5)             # BERT 微调学习率要小
criterion = torch.nn.CrossEntropyLoss()

# 训练
num_epochs = 3
for epoch in range(num_epochs):
    model.train()
    total_loss = 0

    for batch in train_loader:
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['label'].to(device)

        optimizer.zero_grad()
        outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
        loss = outputs.loss
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {total_loss/len(train_loader):.4f}")

# 保存微调后的模型
# model.save_pretrained('./finetuned_bert')
# tokenizer.save_pretrained('./finetuned_bert')
```

## 进阶用法

### Seq2Seq 机器翻译基础

```python
import torch
import torch.nn as nn
import torch.optim as optim

class Encoder(nn.Module):
    """编码器：将源句子编码为上下文向量"""
    def __init__(self, input_dim, embed_dim, hidden_dim, num_layers=2, dropout=0.3):
        super().__init__()
        self.embedding = nn.Embedding(input_dim, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        # x: [batch, src_len]
        embedded = self.dropout(self.embedding(x))               # [batch, src_len, embed_dim]
        outputs, (hidden, cell) = self.lstm(embedded)            # hidden: [num_layers, batch, hidden_dim]
        return outputs, hidden, cell

class Decoder(nn.Module):
    """解码器：从上下文向量生成目标句子"""
    def __init__(self, output_dim, embed_dim, hidden_dim, num_layers=2, dropout=0.3):
        super().__init__()
        self.output_dim = output_dim
        self.embedding = nn.Embedding(output_dim, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout)
        self.fc_out = nn.Linear(hidden_dim, output_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, input, hidden, cell):
        # input: [batch] 当前时间步的输入词
        input = input.unsqueeze(1)                               # [batch, 1]
        embedded = self.dropout(self.embedding(input))           # [batch, 1, embed_dim]
        output, (hidden, cell) = self.lstm(embedded, (hidden, cell))
        prediction = self.fc_out(output.squeeze(1))              # [batch, output_dim]
        return prediction, hidden, cell

class Seq2Seq(nn.Module):
    """Seq2Seq 机器翻译模型"""
    def __init__(self, encoder, decoder, device):
        super().__init__()
        self.encoder = encoder
        self.decoder = decoder
        self.device = device

    def forward(self, src, trg, teacher_forcing_ratio=0.5):
        # src: [batch, src_len] 源句子
        # trg: [batch, trg_len] 目标句子

        batch_size = src.shape[0]
        trg_len = trg.shape[1]
        trg_vocab_size = self.decoder.output_dim

        # 存储解码器输出
        outputs = torch.zeros(batch_size, trg_len, trg_vocab_size).to(self.device)

        # 编码
        encoder_outputs, hidden, cell = self.encoder(src)

        # 解码器的第一个输入是 <sos> 标记
        input = trg[:, 0]

        for t in range(1, trg_len):
            output, hidden, cell = self.decoder(input, hidden, cell)
            outputs[:, t] = output

            # Teacher forcing：用真实标签或预测结果作为下一步输入
            teacher_force = torch.rand(1).item() < teacher_forcing_ratio
            top1 = output.argmax(1)
            input = trg[:, t] if teacher_force else top1

        return outputs

# 创建模型
src_vocab_size = 10000                                           # 源语言词汇表大小
trg_vocab_size = 8000                                            # 目标语言词汇表大小
embed_dim = 256
hidden_dim = 512

encoder = Encoder(src_vocab_size, embed_dim, hidden_dim)
decoder = Decoder(trg_vocab_size, embed_dim, hidden_dim)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Seq2Seq(encoder, decoder, device).to(device)

print(f"模型参数量: {sum(p.numel() for p in model.parameters()):,}")

# 训练
optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss(ignore_index=0)                  # 忽略 <pad>

# 模拟数据
src = torch.randint(0, src_vocab_size, (4, 20))                  # [batch=4, src_len=20]
trg = torch.randint(0, trg_vocab_size, (4, 25))                  # [batch=4, trg_len=25]

for epoch in range(10):
    model.train()
    optimizer.zero_grad()
    outputs = model(src, trg)                                    # [4, 25, trg_vocab_size]

    # 计算损失（跳过第一个 <sos>）
    outputs = outputs[:, 1:].reshape(-1, trg_vocab_size)
    trg = trg[:, 1:].reshape(-1)
    loss = criterion(outputs, trg)

    loss.backward()
    optimizer.step()

    print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")
```

### 注意力机制

```python
import torch
import torch.nn as nn

class Attention(nn.Module):
    """注意力机制"""
    def __init__(self, hidden_dim):
        super().__init__()
        self.attn = nn.Linear(hidden_dim * 3, hidden_dim)        # 拼接后映射
        self.v = nn.Linear(hidden_dim, 1, bias=False)            # 注意力权重

    def forward(self, hidden, encoder_outputs):
        # hidden: [batch, hidden_dim] 解码器当前隐藏状态
        # encoder_outputs: [batch, src_len, hidden_dim] 编码器所有时间步输出

        batch_size = encoder_outputs.shape[0]
        src_len = encoder_outputs.shape[1]

        # 重复 hidden 以匹配 encoder_outputs 的时间步
        hidden = hidden.unsqueeze(1).repeat(1, src_len, 1)       # [batch, src_len, hidden_dim]

        # 拼接并计算注意力能量
        energy = torch.tanh(self.attn(torch.cat((hidden, encoder_outputs), dim=2)))  # [batch, src_len, hidden_dim]
        attention = self.v(energy).squeeze(2)                    # [batch, src_len]

        # Softmax 归一化得到注意力权重
        return torch.softmax(attention, dim=1)                   # [batch, src_len]

# 使用示例
hidden_dim = 512
attention = Attention(hidden_dim)

hidden = torch.randn(4, hidden_dim)                              # [batch=4, hidden_dim]
encoder_outputs = torch.randn(4, 20, hidden_dim)                 # [batch=4, src_len=20, hidden_dim]

attn_weights = attention(hidden, encoder_outputs)                # [batch=4, src_len=20]
print(f"注意力权重形状: {attn_weights.shape}")
print(f"注意力权重和: {attn_weights.sum(dim=1)}")                # 应该接近 1

# 加权求和得到上下文向量
context = torch.bmm(attn_weights.unsqueeze(1), encoder_outputs)  # [batch, 1, src_len] @ [batch, src_len, hidden_dim]
context = context.squeeze(1)                                     # [batch, hidden_dim]
print(f"上下文向量形状: {context.shape}")
```

## 核心知识点总结

| 任务 | 输入 | 输出 | 常用模型 |
|------|------|------|----------|
| 文本分类 | 文本 | 类别 | TextCNN、BiLSTM、BERT |
| 情感分析 | 文本 | 情感极性 | BiLSTM + Attention、BERT |
| 命名实体识别 | 文本 | 实体标注序列 | BiLSTM + CRF、BERT |
| 机器翻译 | 源语言句子 | 目标语言句子 | Seq2Seq + Attention、Transformer |

| 技术 | 作用 | 适用场景 |
|------|------|----------|
| 词嵌入 | 将词映射为稠密向量 | 所有 NLP 任务 |
| 注意力机制 | 动态关注重要部分 | 序列到序列任务 |
| 预训练模型 | 复用通用语言知识 | 数据少、任务复杂 |
| Teacher Forcing | 加速 Seq2Seq 训练 | 机器翻译、文本生成 |

## 新手常见误区

### 误区 1：中文文本不做分词

```python
# 错误：直接把字符作为输入（对中文效果差）
text = "我爱北京"
tokens = list(text)  # ['我', '爱', '北', '京']

# 正确：使用分词工具
import jieba
tokens = jieba.lcut(text)  # ['我', '爱', '北京']
```

### 误区 2：序列长度不统一

```python
# 错误：不同长度的序列直接放入 batch
texts = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]  # 长度不一

# 正确：填充到相同长度
from torch.nn.utils.rnn import pad_sequence
texts = [torch.tensor([1, 2, 3]), torch.tensor([4, 5]), torch.tensor([6, 7, 8, 9])]
padded = pad_sequence(texts, batch_first=True, padding_value=0)
# [[1, 2, 3, 0], [4, 5, 0, 0], [6, 7, 8, 9]]
```

### 误区 3：BERT 微调学习率太大

```python
# 错误：用默认学习率 0.001 微调 BERT
optimizer = optim.Adam(model.parameters(), lr=0.001)  # 太大会破坏预训练权重

# 正确：BERT 微调用很小的学习率
optimizer = optim.AdamW(model.parameters(), lr=2e-5)  # 常用范围 1e-5 ~ 5e-5
```

### 误区 4：忘记处理特殊标记

```python
# 错误：不处理 <pad>、<unk> 等特殊标记
vocab = {'我': 0, '爱': 1, '北': 2, '京': 3}

# 正确：添加特殊标记
vocab = {'<pad>': 0, '<unk>': 1, '<sos>': 2, '<eos>': 3, '我': 4, '爱': 5, '北': 6, '京': 7}
```

### 误区 5：Seq2Seq 不用 Teacher Forcing

```python
# 错误：训练时完全用预测结果作为下一步输入（收敛慢）
for t in range(trg_len):
    output, hidden, cell = decoder(input, hidden, cell)
    input = output.argmax(1)  # 总是用预测结果

# 正确：训练时用 Teacher Forcing，推理时不用
teacher_force_ratio = 0.5
if torch.rand(1).item() < teacher_force_ratio:
    input = trg[:, t]  # 用真实标签
else:
    input = output.argmax(1)  # 用预测结果
```

## 下一章预告

学会了 NLP 实战后，下一章将讲解如何将训练好的模型部署到生产环境，包括模型导出、ONNX 格式转换、Flask API 服务搭建、移动端部署等内容，让你的模型真正"上线"。
