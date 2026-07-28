---
title: "第12章：命名实体识别 NER"
description: "序列标注、BIO 标注、CRF、BiLSTM-CRF、实体识别系统"
---

# 第12章：命名实体识别 NER

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是命名实体识别？它有什么用？
- 序列标注是怎么工作的？
- BIO 标注法是什么意思？
- CRF 层有什么作用？

这一章就是为了解答这些问题。我们会从 **NER 的基本概念** 开始，逐步学习序列标注、BIO 标注、BiLSTM-CRF 等技术。

---

## 1 什么是命名实体识别？

### 1.1 任务定义

**命名实体识别（Named Entity Recognition，NER）** 是从文本中识别出具有特定意义的实体。

**常见实体类型**：

| 类型 | 英文缩写 | 示例 |
| --- | --- | --- |
| 人名 | PER | 张三、李四、姚明 |
| 地名 | LOC | 北京、上海、中国 |
| 机构名 | ORG | 清华大学、阿里巴巴、联合国 |
| 时间 | TIME | 2024 年、今天、明天 |
| 金额 | MONEY | 100 元、50 万美元 |

### 1.2 应用场景

| 应用 | 说明 | 示例 |
| --- | --- | --- |
| **信息抽取** | 从文本中提取结构化信息 | "张三在北京大学工作" → {人名：张三，机构：北京大学} |
| **知识图谱构建** | 构建实体关系网络 | 实体 + 关系 → 图谱 |
| **问答系统** | 理解问题中的实体 | "姚明在哪里打球？" → 识别"姚明"（人名） |
| **搜索引擎** | 提升搜索效果 | 识别查询中的实体，优化搜索结果 |

---

## 2 序列标注

### 2.1 基本概念

**序列标注（Sequence Labeling）** 是为序列中的每个元素分配一个标签。

**NER 就是序列标注任务**：

```
输入序列：张 三 在 北 京 大 学 工 作
标签序列：B-PER I-PER O B-ORG I-ORG I-ORG I-ORG O
```

### 2.2 BIO 标注法

**BIO 标注法** 是最常用的标注方案：

| 标签 | 含义 | 说明 |
| --- | --- | --- |
| **B-XXX** | 实体开始 | 实体的第一个字 |
| **I-XXX** | 实体内部 | 实体的中间或最后一个字 |
| **O** | 非实体 | 不属于任何实体 |

**示例**：

```
文本：张 三 在 北 京 大 学 工 作
标签：B-PER I-PER O B-ORG I-ORG I-ORG I-ORG O

文本：我 喜 欢 吃 苹 果
标签：O O O O B-FOOD I-FOOD
```

**为什么用 BIO？**
- B 标记实体开始，I 标记实体延续
- 可以区分相邻的同类实体
- 简单直观，易于实现

### 2.3 BIOES 标注法

**BIOES** 是 BIO 的扩展，更精确：

| 标签 | 含义 |
| --- | --- |
| **B-XXX** | 实体开始（多字实体的第一个字） |
| **I-XXX** | 实体内部（多字实体的中间字） |
| **O** | 非实体 |
| **E-XXX** | 实体结束（多字实体的最后一个字） |
| **S-XXX** | 单字实体 |

**示例**：

```
文本：张 三 在 北 京 大 学 工 作
BIO:  B-PER I-PER O B-ORG I-ORG I-ORG I-ORG O
BIOES: B-PER E-PER O B-ORG I-ORG I-ORG E-ORG O

文本：我 去 了 北 京
BIO:  O O O B-LOC I-LOC
BIOES: O O O B-LOC E-LOC
```

---

## 3 NER 模型演进

### 3.1 方法对比

| 方法 | 特点 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **规则方法** | 人工编写规则 | 简单、可解释 | 覆盖率低、维护难 |
| **HMM** | 隐马尔可夫模型 | 简单、快速 | 假设太强、效果有限 |
| **CRF** | 条件随机场 | 考虑上下文、效果好 | 需要特征工程 |
| **BiLSTM** | 双向 LSTM | 自动学习特征 | 不考虑标签依赖 |
| **BiLSTM-CRF** | BiLSTM + CRF | 结合两者优点 | 复杂 |
| **BERT-CRF** | BERT + CRF | 效果最好 | 计算资源需求大 |

### 3.2 CRF 层

**CRF（Conditional Random Field）** 是判别式概率图模型，考虑了标签之间的依赖关系。

**为什么需要 CRF？**

BiLSTM 独立预测每个位置的标签，可能出现不合法的标签序列：

```
BiLSTM 预测：B-PER I-ORG O B-LOC
问题：I-ORG 前面应该是 B-ORG，而不是 B-PER
```

**CRF 的作用**：
- 学习标签之间的转移规则
- 确保输出的标签序列合法
- 提升整体序列的预测效果

**CRF 的转移矩阵**：

```
     B-PER  I-PER  B-ORG  I-ORG  O
B-PER  0.1    0.8    0.05   0.02   0.03
I-PER  0.05   0.7    0.1    0.1    0.05
B-ORG  0.05   0.05   0.1    0.7    0.1
I-ORG  0.02   0.02   0.05   0.8    0.11
O      0.3    0.1    0.3    0.1    0.2
```

---

## 4 实战：BiLSTM-CRF 实现

### 4.1 数据准备

```python
import torch
from torch.utils.data import Dataset, DataLoader

# 标注数据（简化示例）
sentences = [
    ['张', '三', '在', '北', '京', '大', '学', '工', '作'],
    ['我', '喜', '欢', '吃', '苹', '果'],
    ['李', '四', '去', '了', '上', '海']
]

tags = [
    ['B-PER', 'I-PER', 'O', 'B-ORG', 'I-ORG', 'I-ORG', 'I-ORG', 'O'],
    ['O', 'O', 'O', 'O', 'B-FOOD', 'I-FOOD'],
    ['B-PER', 'I-PER', 'O', 'O', 'B-LOC', 'I-LOC']
]

# 构建标签映射
tag2idx = {'<pad>': 0, 'O': 1, 'B-PER': 2, 'I-PER': 3, 'B-ORG': 4, 
           'I-ORG': 5, 'B-LOC': 6, 'I-LOC': 7, 'B-FOOD': 8, 'I-FOOD': 9}
idx2tag = {idx: tag for tag, idx in tag2idx.items()}

# 构建字符映射
char2idx = {'<pad>': 0, '<unk>': 1}
for sent in sentences:
    for char in sent:
        if char not in char2idx:
            char2idx[char] = len(char2idx)

# 数据集
class NERDataset(Dataset):
    def __init__(self, sentences, tags, char2idx, tag2idx, max_len=50):
        self.sentences = sentences
        self.tags = tags
        self.char2idx = char2idx
        self.tag2idx = tag2idx
        self.max_len = max_len
    
    def __len__(self):
        return len(self.sentences)
    
    def __getitem__(self, idx):
        sent = self.sentences[idx]
        tags = self.tags[idx]
        
        # 字符转索引
        char_indices = [self.char2idx.get(c, self.char2idx['<unk>']) for c in sent]
        
        # 标签转索引
        tag_indices = [self.tag2idx[t] for t in tags]
        
        # 填充
        if len(char_indices) < self.max_len:
            pad_len = self.max_len - len(char_indices)
            char_indices += [self.char2idx['<pad>']] * pad_len
            tag_indices += [self.tag2idx['<pad>']] * pad_len
        else:
            char_indices = char_indices[:self.max_len]
            tag_indices = tag_indices[:self.max_len]
        
        return (
            torch.tensor(char_indices),
            torch.tensor(tag_indices),
            len(sent)  # 原始长度
        )

# 创建数据集
dataset = NERDataset(sentences, tags, char2idx, tag2idx, max_len=20)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)
```

### 4.2 BiLSTM-CRF 模型

```python
import torch
import torch.nn as nn

class BiLSTM_CRF(nn.Module):
    def __init__(self, vocab_size, tagset_size, embedding_dim, hidden_dim):
        super(BiLSTM_CRF, self).__init__()
        
        self.embedding_dim = embedding_dim
        self.hidden_dim = hidden_dim
        self.vocab_size = vocab_size
        self.tagset_size = tagset_size
        
        # 词嵌入层
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        
        # BiLSTM 层
        self.lstm = nn.LSTM(
            embedding_dim, 
            hidden_dim // 2,  # 双向，所以除以 2
            num_layers=1, 
            bidirectional=True, 
            batch_first=True
        )
        
        # 线性层：映射到标签空间
        self.hidden2tag = nn.Linear(hidden_dim, tagset_size)
        
        # CRF 层
        self.crf = CRF(tagset_size, batch_first=True)
    
    def get_lstm_features(self, sentence):
        # sentence: (batch, seq_len)
        embeds = self.embedding(sentence)  # (batch, seq_len, embedding_dim)
        lstm_out, _ = self.lstm(embeds)  # (batch, seq_len, hidden_dim)
        lstm_feats = self.hidden2tag(lstm_out)  # (batch, seq_len, tagset_size)
        return lstm_feats
    
    def forward(self, sentence, tags, mask=None):
        # 训练模式：计算损失
        feats = self.get_lstm_features(sentence)
        loss = -self.crf(feats, tags, mask=mask, reduction='mean')
        return loss
    
    def predict(self, sentence, mask=None):
        # 预测模式：解码最优路径
        feats = self.get_lstm_features(sentence)
        best_path = self.crf.decode(feats, mask=mask)
        return best_path

class CRF(nn.Module):
    """条件随机场"""
    
    def __init__(self, num_tags, batch_first=True):
        super(CRF, self).__init__()
        self.num_tags = num_tags
        self.batch_first = batch_first
        
        # 转移矩阵
        self.transitions = nn.Parameter(torch.randn(num_tags, num_tags))
        
        # 起始和结束标签的转移分数
        self.start_transitions = nn.Parameter(torch.randn(num_tags))
        self.end_transitions = nn.Parameter(torch.randn(num_tags))
    
    def forward(self, emissions, tags, mask=None, reduction='mean'):
        # 计算负对数似然损失
        if mask is None:
            mask = torch.ones_like(tags, dtype=torch.uint8)
        
        # 计算 gold score
        gold_score = self._score_sentence(emissions, tags, mask)
        
        # 计算 forward score
        forward_score = self._forward_algorithm(emissions, mask)
        
        # 负对数似然
        nll = forward_score - gold_score
        
        if reduction == 'mean':
            return nll.mean()
        elif reduction == 'sum':
            return nll.sum()
        else:
            return nll
    
    def _score_sentence(self, emissions, tags, mask):
        # 计算给定标签序列的分数
        batch_size, seq_len, _ = emissions.shape
        
        score = torch.zeros(batch_size, device=emissions.device)
        
        # 起始转移
        score += self.start_transitions[tags[:, 0]]
        
        # 发射分数
        score += emissions[:, 0].gather(1, tags[:, 0].unsqueeze(1)).squeeze(1)
        
        for t in range(1, seq_len):
            # 转移分数
            score += self.transitions[tags[:, t-1], tags[:, t]] * mask[:, t].float()
            
            # 发射分数
            score += emissions[:, t].gather(1, tags[:, t].unsqueeze(1)).squeeze(1) * mask[:, t].float()
        
        # 结束转移
        last_tag_indices = mask.long().sum(1) - 1
        last_tags = tags.gather(1, last_tag_indices.unsqueeze(1)).squeeze(1)
        score += self.end_transitions[last_tags]
        
        return score
    
    def _forward_algorithm(self, emissions, mask):
        # 计算所有可能路径的总分数
        batch_size, seq_len, num_tags = emissions.shape
        
        # 初始化
        alpha = self.start_transitions + emissions[:, 0]  # (batch, num_tags)
        
        for t in range(1, seq_len):
            emit_score = emissions[:, t]  # (batch, num_tags)
            
            # alpha_t = log_sum_exp(alpha_{t-1} + transition + emit)
            broadcast_alpha = alpha.unsqueeze(2)  # (batch, num_tags, 1)
            broadcast_emissions = emit_score.unsqueeze(1)  # (batch, 1, num_tags)
            
            inner = broadcast_alpha + self.transitions + broadcast_emissions  # (batch, num_tags, num_tags)
            
            new_alpha = torch.logsumexp(inner, dim=1)  # (batch, num_tags)
            
            # 根据 mask 更新
            alpha = torch.where(mask[:, t].unsqueeze(1).bool(), new_alpha, alpha)
        
        # 加上结束转移
        final_score = torch.logsumexp(alpha + self.end_transitions, dim=1)  # (batch,)
        
        return final_score
    
    def decode(self, emissions, mask=None):
        # 维特比解码：找到最优路径
        if mask is None:
            mask = torch.ones(emissions.shape[:2], dtype=torch.uint8, device=emissions.device)
        
        batch_size, seq_len, num_tags = emissions.shape
        
        # 初始化
        viterbi = self.start_transitions + emissions[:, 0]  # (batch, num_tags)
        backpointers = []
        
        for t in range(1, seq_len):
            # viterbi_t = max(viterbi_{t-1} + transition) + emit_t
            broadcast_viterbi = viterbi.unsqueeze(2)  # (batch, num_tags, 1)
            
            inner = broadcast_viterbi + self.transitions  # (batch, num_tags, num_tags)
            
            max_score, max_idx = torch.max(inner, dim=1)  # (batch, num_tags)
            
            viterbi_t = max_score + emissions[:, t]
            
            # 根据 mask 更新
            viterbi = torch.where(mask[:, t].unsqueeze(1).bool(), viterbi_t, viterbi)
            
            backpointers.append(max_idx)
        
        # 加上结束转移
        viterbi += self.end_transitions
        
        # 找到最佳结束标签
        best_last_idx, best_last_tag = torch.max(viterbi, dim=1)
        
        # 回溯
        best_paths = [best_last_tag.unsqueeze(1)]
        
        for backpointer in reversed(backpointers):
            best_tag = backpointer.gather(1, best_paths[-1])
            best_paths.append(best_tag)
        
        best_paths.reverse()
        
        # 转换为列表
        best_paths = [path.squeeze(1).tolist() for path in best_paths]
        
        return best_paths

# 创建模型
vocab_size = len(char2idx)
tagset_size = len(tag2idx)
embedding_dim = 100
hidden_dim = 128

model = BiLSTM_CRF(vocab_size, tagset_size, embedding_dim, hidden_dim)

# 优化器
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# 训练
num_epochs = 50
for epoch in range(num_epochs):
    total_loss = 0
    
    for chars, tags, lengths in dataloader:
        optimizer.zero_grad()
        
        # 创建 mask
        batch_size, seq_len = chars.shape
        mask = torch.zeros(batch_size, seq_len, dtype=torch.uint8)
        for i, length in enumerate(lengths):
            mask[i, :length] = 1
        
        # 前向传播
        loss = model(chars, tags, mask)
        
        # 反向传播
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")

# 测试
model.eval()
test_sent = ['王', '五', '去', '了', '北', '京']
char_indices = [char2idx.get(c, char2idx['<unk>']) for c in test_sent]
char_tensor = torch.tensor([char_indices])

with torch.no_grad():
    mask = torch.ones(1, len(test_sent), dtype=torch.uint8)
    best_path = model.predict(char_tensor, mask)
    
    print(f"\n测试句子：{''.join(test_sent)}")
    print("预测标签：")
    for char, tag_idx in zip(test_sent, best_path[0]):
        print(f"  {char}: {idx2tag[tag_idx]}")
```

---

## 5 使用 Hugging Face 进行 NER

### 5.1 使用预训练模型

```python
from transformers import AutoTokenizer, AutoModelForTokenClassification
import torch

# 加载中文 NER 模型
model_name = "bert-base-chinese"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForTokenClassification.from_pretrained(
    model_name,
    num_labels=9  # BIO 标注的标签数
)

# 测试文本
text = "张三在北京大学工作"

# 编码
inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True)

# 预测
with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits
    predictions = torch.argmax(logits, dim=2)

# 解码
tokens = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
preds = predictions[0].tolist()

# 标签映射
label_map = {
    0: 'O', 1: 'B-PER', 2: 'I-PER', 3: 'B-ORG', 4: 'I-ORG',
    5: 'B-LOC', 6: 'I-LOC', 7: '[CLS]', 8: '[SEP]'
}

print("NER 结果：")
for token, pred in zip(tokens, preds):
    if token not in ['[CLS]', '[SEP]', '[PAD]']:
        print(f"  {token}: {label_map.get(pred, 'O')}")
```

### 5.2 微调 BERT 进行 NER

```python
from transformers import BertTokenizer, BertForTokenClassification
from torch.utils.data import Dataset, DataLoader
import torch

# 数据集
class NERDataset(Dataset):
    def __init__(self, sentences, tags, tokenizer, tag2idx, max_len=128):
        self.sentences = sentences
        self.tags = tags
        self.tokenizer = tokenizer
        self.tag2idx = tag2idx
        self.max_len = max_len
    
    def __len__(self):
        return len(self.sentences)
    
    def __getitem__(self, idx):
        sent = self.sentences[idx]
        tags = self.tags[idx]
        
        # 分字
        chars = list(sent)
        
        # 编码
        encoding = self.tokenizer(
            chars,
            is_split_into_words=True,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        # 标签编码（添加 [CLS] 和 [SEP]）
        tag_indices = [self.tag2idx['O']]  # [CLS]
        tag_indices += [self.tag2idx[t] for t in tags]
        tag_indices += [self.tag2idx['O']]  # [SEP]
        
        # 填充
        if len(tag_indices) < self.max_len:
            tag_indices += [self.tag2idx['<pad>']] * (self.max_len - len(tag_indices))
        else:
            tag_indices = tag_indices[:self.max_len]
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(tag_indices, dtype=torch.long)
        }

# 准备数据
sentences = [
    "张三在北京大学工作",
    "李四去了上海",
    "王五喜欢吃苹果"
]
tags = [
    ['B-PER', 'I-PER', 'O', 'B-ORG', 'I-ORG', 'I-ORG', 'I-ORG', 'O'],
    ['B-PER', 'I-PER', 'O', 'O', 'B-LOC', 'I-LOC'],
    ['B-PER', 'I-PER', 'O', 'O', 'O', 'B-FOOD', 'I-FOOD']
]

tag2idx = {'<pad>': 0, 'O': 1, 'B-PER': 2, 'I-PER': 3, 'B-ORG': 4, 
           'I-ORG': 5, 'B-LOC': 6, 'I-LOC': 7, 'B-FOOD': 8, 'I-FOOD': 9}

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
dataset = NERDataset(sentences, tags, tokenizer, tag2idx, max_len=32)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

# 加载模型
model = BertForTokenClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=len(tag2idx)
)

# 训练
from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

num_epochs = 10
for epoch in range(num_epochs):
    total_loss = 0
    
    for batch in dataloader:
        optimizer.zero_grad()
        
        outputs = model(
            input_ids=batch['input_ids'],
            attention_mask=batch['attention_mask'],
            labels=batch['labels']
        )
        
        loss = outputs.loss
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    if (epoch + 1) % 2 == 0:
        print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")

# 测试
model.eval()
test_sent = "赵六在清华大学学习"

inputs = tokenizer(list(test_sent), is_split_into_words=True, return_tensors='pt', padding=True, truncation=True, max_length=32)

with torch.no_grad():
    outputs = model(**inputs)
    predictions = torch.argmax(outputs.logits, dim=2)

idx2tag = {idx: tag for tag, idx in tag2idx.items()}

print(f"\n测试句子：{test_sent}")
print("NER 结果：")
tokens = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
preds = predictions[0].tolist()

for token, pred in zip(tokens, preds):
    if token not in ['[CLS]', '[SEP]', '[PAD]']:
        print(f"  {token}: {idx2tag.get(pred, 'O')}")
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **NER** | 从文本中识别命名实体（人名、地名、机构名等） |
| **序列标注** | 为序列中的每个元素分配标签 |
| **BIO 标注** | B-开始、I-内部、O-非实体 |
| **CRF** | 考虑标签依赖关系的概率图模型 |
| **BiLSTM-CRF** | BiLSTM 提取特征 + CRF 解码最优路径 |
| **BERT-CRF** | BERT 提取特征 + CRF 解码，效果最好 |

---

## 7 新手常见误区

### 误区 1："NER 只需要识别实体，不需要考虑标签顺序"

**错！** 标签序列必须合法。例如，I-PER 前面必须是 B-PER 或 I-PER，不能是 O 或 B-ORG。CRF 层就是用来保证标签序列合法性的。

### 误区 2："字符级和词级 NER 是一样的"

不是的。中文 NER 通常用字符级（每个字一个标签），英文通常用词级（每个词一个标签）。字符级能处理未登录词，但可能丢失词边界信息。

### 误区 3："BERT 不需要 CRF 层"

不一定。BERT 本身可以输出每个位置的标签，但加上 CRF 层可以考虑标签依赖，提升整体序列的预测效果。实验表明 BERT-CRF 通常比纯 BERT 效果好。

---

## 8 动手练习

### 练习 1：基础练习 - BIO 标注

**题目**：对以下句子进行 BIO 标注：
1. "姚明是美国职业篮球联赛的球员"
2. "阿里巴巴集团在杭州"

<details>
<summary>点击查看答案</summary>

```
句子 1：姚 明 是 美 国 职 业 篮 球 联 赛 的 球 员
标签：B-PER I-PER O B-ORG I-ORG I-ORG I-ORG I-ORG I-ORG O O O

句子 2：阿 里 巴 巴 集 团 在 杭 州
标签：B-ORG I-ORG I-ORG I-ORG I-ORG O B-LOC I-LOC
```

</details>

### 练习 2：进阶练习 - 实现 BiLSTM-CRF

**题目**：实现一个简单的 BiLSTM-CRF 模型，进行 NER 任务。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class BiLSTM_CRF(nn.Module):
    def __init__(self, vocab_size, tagset_size, embedding_dim, hidden_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim // 2, 
                           num_layers=1, bidirectional=True, batch_first=True)
        self.hidden2tag = nn.Linear(hidden_dim, tagset_size)
        self.crf = CRF(tagset_size, batch_first=True)
    
    def forward(self, sentence, tags, mask=None):
        feats = self.hidden2tag(self.lstm(self.embedding(sentence))[0])
        return -self.crf(feats, tags, mask, reduction='mean')
    
    def predict(self, sentence, mask=None):
        feats = self.hidden2tag(self.lstm(self.embedding(sentence))[0])
        return self.crf.decode(feats, mask)

class CRF(nn.Module):
    def __init__(self, num_tags, batch_first=True):
        super().__init__()
        self.num_tags = num_tags
        self.transitions = nn.Parameter(torch.randn(num_tags, num_tags))
        self.start_transitions = nn.Parameter(torch.randn(num_tags))
        self.end_transitions = nn.Parameter(torch.randn(num_tags))
    
    def forward(self, emissions, tags, mask=None, reduction='mean'):
        if mask is None:
            mask = torch.ones_like(tags, dtype=torch.uint8)
        gold_score = self._score_sentence(emissions, tags, mask)
        forward_score = self._forward_algorithm(emissions, mask)
        nll = forward_score - gold_score
        return nll.mean() if reduction == 'mean' else nll.sum()
    
    def _score_sentence(self, emissions, tags, mask):
        batch_size, seq_len, _ = emissions.shape
        score = self.start_transitions[tags[:, 0]]
        score += emissions[:, 0].gather(1, tags[:, 0].unsqueeze(1)).squeeze(1)
        
        for t in range(1, seq_len):
            score += self.transitions[tags[:, t-1], tags[:, t]] * mask[:, t].float()
            score += emissions[:, t].gather(1, tags[:, t].unsqueeze(1)).squeeze(1) * mask[:, t].float()
        
        last_tags = tags.gather(1, (mask.long().sum(1) - 1).unsqueeze(1)).squeeze(1)
        score += self.end_transitions[last_tags]
        return score
    
    def _forward_algorithm(self, emissions, mask):
        batch_size, seq_len, num_tags = emissions.shape
        alpha = self.start_transitions + emissions[:, 0]
        
        for t in range(1, seq_len):
            broadcast_alpha = alpha.unsqueeze(2)
            broadcast_emissions = emissions[:, t].unsqueeze(1)
            inner = torch.logsumexp(broadcast_alpha + self.transitions + broadcast_emissions, dim=1)
            alpha = torch.where(mask[:, t].unsqueeze(1).bool(), inner, alpha)
        
        return torch.logsumexp(alpha + self.end_transitions, dim=1)
    
    def decode(self, emissions, mask=None):
        if mask is None:
            mask = torch.ones(emissions.shape[:2], dtype=torch.uint8, device=emissions.device)
        
        batch_size, seq_len, num_tags = emissions.shape
        viterbi = self.start_transitions + emissions[:, 0]
        backpointers = []
        
        for t in range(1, seq_len):
            broadcast_viterbi = viterbi.unsqueeze(2)
            inner = broadcast_viterbi + self.transitions
            max_score, max_idx = torch.max(inner, dim=1)
            viterbi_t = max_score + emissions[:, t]
            viterbi = torch.where(mask[:, t].unsqueeze(1).bool(), viterbi_t, viterbi)
            backpointers.append(max_idx)
        
        viterbi += self.end_transitions
        _, best_last_tag = torch.max(viterbi, dim=1)
        
        best_paths = [best_last_tag.unsqueeze(1)]
        for bp in reversed(backpointers):
            best_paths.append(bp.gather(1, best_paths[-1]))
        best_paths.reverse()
        
        return [p.squeeze(1).tolist() for p in best_paths]

# 测试
model = BiLSTM_CRF(vocab_size=100, tagset_size=10, embedding_dim=50, hidden_dim=64)
sentence = torch.randint(0, 100, (2, 10))
tags = torch.randint(0, 10, (2, 10))
loss = model(sentence, tags)
print(f"Loss: {loss.item():.4f}")
```

</details>

### 练习 3（挑战）：综合练习 - 使用 BERT 进行 NER

**题目**：使用 BERT 微调一个 NER 模型，识别中文人名、地名、机构名。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertTokenizer, BertForTokenClassification
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForTokenClassification.from_pretrained('bert-base-chinese', num_labels=9)

sentences = ["张三在北京大学工作", "李四去了上海"]
tags = [[2, 3, 1, 4, 5, 5, 5, 1], [2, 3, 1, 1, 6, 7]]  # 简化标签

from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

for sent, tag in zip(sentences, tags):
    inputs = tokenizer(list(sent), return_tensors='pt', padding=True, truncation=True, max_length=32)
    labels = torch.tensor([[1] + tag + [1]])  # 添加 [CLS] 和 [SEP]
    
    outputs = model(**inputs, labels=labels)
    loss = outputs.loss
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()

print("训练完成")
```

</details>

---

## 下一章预告

下一章我们会学习 **机器翻译系统**——也就是如何实现自动翻译。你会学到统计机器翻译、神经机器翻译、BLEU 评估等概念。这是 NLP 最经典的应用之一。
