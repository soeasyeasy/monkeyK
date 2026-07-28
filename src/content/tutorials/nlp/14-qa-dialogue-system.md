---
title: "第14章：问答系统与对话系统"
description: "检索式问答、生成式问答、任务型对话、意图识别、槽位填充"
---

# 第14章：问答系统与对话系统

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 问答系统和对话系统有什么区别？
- 检索式问答和生成式问答有什么不同？
- 什么是意图识别和槽位填充？
- 如何构建一个完整的对话系统？

这一章就是为了解答这些问题。我们会从 **问答系统的基本类型** 开始，逐步学习检索式、生成式、任务型对话等技术。

---

## 1 问答系统概述

### 1.1 什么是问答系统？

**问答系统（Question Answering，QA）** 是自动回答用户问题的系统。

**数学表达**：
```
f: 问题 → 答案
f("中国的首都是哪里？") → "北京"
```

### 1.2 问答系统类型

| 类型 | 特点 | 示例 |
| --- | --- | --- |
| **检索式 QA** | 从知识库中检索答案 | 搜索引擎、FAQ 系统 |
| **生成式 QA** | 生成自然语言答案 | ChatGPT、智能客服 |
| **知识图谱 QA** | 基于知识图谱回答 | 实体查询、关系查询 |
| **表格 QA** | 从表格中提取答案 | 数据分析问答 |
| **视觉 QA** | 基于图像回答 | 图像内容理解 |

### 1.3 应用场景

| 应用 | 说明 |
| --- | --- |
| **智能客服** | 自动回答用户问题 |
| **搜索引擎** | 直接返回答案 |
| **语音助手** | Siri、小爱同学 |
| **教育辅导** | 自动答疑 |
| **医疗咨询** | 症状诊断 |

---

## 2 检索式问答

### 2.1 基本思想

**检索式问答** 从预定义的知识库中检索最匹配的答案。

**流程**：
1. **问题理解**：解析用户问题
2. **检索**：从知识库中检索候选答案
3. **排序**：对候选答案进行排序
4. **返回**：返回最佳答案

### 2.2 基于 TF-IDF 的检索

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import jieba

# 知识库
faq_data = [
    {"question": "如何重置密码", "answer": "点击登录页面的'忘记密码'，按照提示操作"},
    {"question": "如何修改手机号", "answer": "进入个人中心-账号安全-修改手机号"},
    {"question": "如何取消订单", "answer": "在订单详情页点击'取消订单'按钮"},
    {"question": "如何申请退款", "answer": "在订单详情页点击'申请退款'，填写退款原因"}
]

# 分词
def tokenize(text):
    return ' '.join(jieba.lcut(text))

questions = [tokenize(item["question"]) for item in faq_data]
answers = [item["answer"] for item in faq_data]

# 构建 TF-IDF 向量
vectorizer = TfidfVectorizer()
question_vectors = vectorizer.fit_transform(questions)

def retrieve_answer(user_question, top_k=1):
    """检索答案"""
    # 分词
    user_question_tokenized = tokenize(user_question)
    
    # 向量化
    user_vector = vectorizer.transform([user_question_tokenized])
    
    # 计算相似度
    similarities = cosine_similarity(user_vector, question_vectors)[0]
    
    # 获取 Top-K
    top_indices = similarities.argsort()[-top_k:][::-1]
    
    results = []
    for idx in top_indices:
        results.append({
            "question": faq_data[idx]["question"],
            "answer": faq_data[idx]["answer"],
            "similarity": similarities[idx]
        })
    
    return results

# 测试
user_question = "怎么修改手机号"
results = retrieve_answer(user_question, top_k=2)

print(f"用户问题：{user_question}")
for i, result in enumerate(results, 1):
    print(f"\n候选 {i}:")
    print(f"  问题：{result['question']}")
    print(f"  答案：{result['answer']}")
    print(f"  相似度：{result['similarity']:.4f}")
```

### 2.3 基于 BERT 的检索

```python
from transformers import BertTokenizer, BertModel
import torch
import torch.nn.functional as F

# 加载 BERT
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertModel.from_pretrained('bert-base-chinese')

def get_embedding(text):
    """获取文本的 BERT 嵌入"""
    inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model(**inputs)
        # 使用 [CLS] 标记的输出作为句子表示
        embedding = outputs.last_hidden_state[:, 0, :]
    return embedding

# 知识库
faq_data = [
    {"question": "如何重置密码", "answer": "点击登录页面的'忘记密码'，按照提示操作"},
    {"question": "如何修改手机号", "answer": "进入个人中心-账号安全-修改手机号"},
    {"question": "如何取消订单", "answer": "在订单详情页点击'取消订单'按钮"},
    {"question": "如何申请退款", "answer": "在订单详情页点击'申请退款'，填写退款原因"}
]

# 预计算问题嵌入
question_embeddings = []
for item in faq_data:
    emb = get_embedding(item["question"])
    question_embeddings.append(emb)
question_embeddings = torch.cat(question_embeddings, dim=0)

def retrieve_answer_bert(user_question, top_k=1):
    """基于 BERT 的检索"""
    # 获取问题嵌入
    user_emb = get_embedding(user_question)
    
    # 计算余弦相似度
    similarities = F.cosine_similarity(user_emb, question_embeddings)
    
    # 获取 Top-K
    top_indices = similarities.argsort()[-top_k:][::-1]
    
    results = []
    for idx in top_indices:
        results.append({
            "question": faq_data[idx]["question"],
            "answer": faq_data[idx]["answer"],
            "similarity": similarities[idx].item()
        })
    
    return results

# 测试
user_question = "怎么修改手机号"
results = retrieve_answer_bert(user_question, top_k=2)

print(f"用户问题：{user_question}")
for i, result in enumerate(results, 1):
    print(f"\n候选 {i}:")
    print(f"  问题：{result['question']}")
    print(f"  答案：{result['answer']}")
    print(f"  相似度：{result['similarity']:.4f}")
```

---

## 3 生成式问答

### 3.1 基本思想

**生成式问答** 使用序列到序列模型直接生成答案。

**流程**：
1. **问题编码**：将问题编码为向量
2. **答案生成**：逐步生成答案文本

### 3.2 基于 Seq2Seq 的生成式 QA

```python
import torch
import torch.nn as nn

class Seq2SeqQA(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim):
        super(Seq2SeqQA, self).__init__()
        
        # 编码器
        self.encoder_embedding = nn.Embedding(vocab_size, embedding_dim)
        self.encoder_lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        
        # 解码器
        self.decoder_embedding = nn.Embedding(vocab_size, embedding_dim)
        self.decoder_lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc_out = nn.Linear(hidden_dim, vocab_size)
    
    def encode(self, question):
        embedded = self.encoder_embedding(question)
        _, (hidden, cell) = self.encoder_lstm(embedded)
        return hidden, cell
    
    def decode(self, answer, hidden, cell):
        embedded = self.decoder_embedding(answer)
        output, (hidden, cell) = self.decoder_lstm(embedded, (hidden, cell))
        prediction = self.fc_out(output)
        return prediction, hidden, cell
    
    def forward(self, question, answer):
        hidden, cell = self.encode(question)
        output, _, _ = self.decode(answer, hidden, cell)
        return output

# 使用示例（简化）
vocab_size = 10000
model = Seq2SeqQA(vocab_size, embedding_dim=256, hidden_dim=512)

question = torch.randint(0, vocab_size, (2, 10))  # (batch, seq_len)
answer = torch.randint(0, vocab_size, (2, 8))

output = model(question, answer)
print(f"输出形状：{output.shape}")  # (2, 8, vocab_size)
```

### 3.3 基于 BERT 的生成式 QA

```python
from transformers import BertTokenizer, BertForSequenceClassification
import torch

# 对于生成式 QA，可以使用 T5 或 BART 等模型
# 这里简化为使用 BERT + 生成头

class GenerativeQA(nn.Module):
    def __init__(self, vocab_size):
        super(GenerativeQA, self).__init__()
        self.bert = BertModel.from_pretrained('bert-base-chinese')
        self.decoder = nn.LSTM(768, 768, batch_first=True)
        self.fc = nn.Linear(768, vocab_size)
    
    def forward(self, question, max_len=50):
        # 编码问题
        outputs = self.bert(question)
        context = outputs.last_hidden_state[:, 0, :]  # [CLS] 输出
        
        # 解码生成答案
        hidden = context.unsqueeze(0).unsqueeze(0)
        cell = torch.zeros_like(hidden)
        
        generated = []
        input_token = torch.zeros(question.size(0), 1, dtype=torch.long)  # <sos>
        
        for _ in range(max_len):
            embedded = self.bert.embeddings(input_token)
            output, (hidden, cell) = self.decoder(embedded, (hidden, cell))
            prediction = self.fc(output.squeeze(1))
            
            next_token = prediction.argmax(1).unsqueeze(1)
            generated.append(next_token)
            input_token = next_token
        
        return torch.cat(generated, dim=1)

# 使用示例
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = GenerativeQA(vocab_size=len(tokenizer))

question = "中国的首都是哪里"
inputs = tokenizer(question, return_tensors='pt', padding=True, truncation=True, max_length=128)

with torch.no_grad():
    generated = model(inputs['input_ids'])

# 解码
generated_text = tokenizer.decode(generated[0], skip_special_tokens=True)
print(f"问题：{question}")
print(f"答案：{generated_text}")
```

### 3.4 使用大语言模型（GPT）

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

# 加载 GPT-2
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

def generate_answer(question, max_length=100):
    """使用 GPT 生成答案"""
    # 构建提示
    prompt = f"问：{question}\n答："
    
    # 编码
    inputs = tokenizer(prompt, return_tensors='pt')
    
    # 生成
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=max_length,
            num_return_sequences=1,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            temperature=0.7,
            pad_token_id=tokenizer.eos_token_id
        )
    
    # 解码
    generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # 提取答案
    if "答：" in generated:
        answer = generated.split("答：")[-1].strip()
    else:
        answer = generated
    
    return answer

# 测试
questions = [
    "中国的首都是哪里？",
    "人工智能是什么？",
    "如何学习自然语言处理？"
]

for question in questions:
    answer = generate_answer(question)
    print(f"问：{question}")
    print(f"答：{answer}\n")
```

---

## 4 任务型对话系统

### 4.1 基本概念

**任务型对话系统** 帮助用户完成特定任务（如订机票、订酒店）。

**核心组件**：
- **意图识别**：理解用户想做什么
- **槽位填充**：提取任务所需的信息
- **对话管理**：维护对话状态，决定下一步行动
- **自然语言生成**：生成回复

### 4.2 意图识别

**意图识别** 是分类任务，判断用户的意图。

```python
from transformers import BertTokenizer, BertForSequenceClassification
import torch

# 定义意图
intents = {
    0: "查询天气",
    1: "预订机票",
    2: "查询订单",
    3: "申请退款",
    4: "其他"
}

# 加载模型
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForSequenceClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=len(intents)
)

# 训练数据（简化）
train_data = [
    ("今天北京天气怎么样", 0),
    ("明天会下雨吗", 0),
    ("帮我订一张去上海的机票", 1),
    ("我想订后天去北京的机票", 1),
    ("我的订单在哪里", 2),
    ("查看订单状态", 2),
    ("我要退款", 3),
    ("怎么申请退款", 3),
    ("你好", 4),
    ("谢谢", 4)
]

# 训练
from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

for text, label in train_data:
    inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=64)
    outputs = model(**inputs, labels=torch.tensor([label]))
    loss = outputs.loss
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()

# 测试
model.eval()
test_texts = [
    "明天天气如何",
    "帮我订机票",
    "我的订单呢"
]

with torch.no_grad():
    for text in test_texts:
        inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=64)
        outputs = model(**inputs)
        pred = torch.argmax(outputs.logits, dim=1).item()
        print(f"'{text}' -> 意图：{intents[pred]}")
```

### 4.3 槽位填充

**槽位填充** 是序列标注任务，提取任务所需的信息。

```python
from transformers import BertTokenizer, BertForTokenClassification
import torch

# 定义槽位
slots = {
    0: "O",           # 非槽位
    1: "B-目的地",    # 目的地开始
    2: "I-目的地",    # 目的地内部
    3: "B-时间",      # 时间开始
    4: "I-时间",      # 时间内部
    5: "B-人数",      # 人数开始
    6: "I-人数"       # 人数内部
}

# 加载模型
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForTokenClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=len(slots)
)

# 训练数据（简化）
train_data = [
    ("帮我订去上海的机票", [0, 0, 1, 2, 2, 0, 0]),
    ("明天去北京", [3, 4, 1, 2, 2]),
    ("后天去广州，两个人", [3, 4, 1, 2, 2, 0, 5, 6, 6])
]

# 训练
from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

for text, slot_labels in train_data:
    inputs = tokenizer(list(text), return_tensors='pt', padding=True, truncation=True, max_length=64, is_split_into_words=True)
    
    # 调整标签（添加 [CLS] 和 [SEP]）
    labels = [0] + slot_labels + [0]  # 0 表示 O
    
    outputs = model(**inputs, labels=torch.tensor([labels]))
    loss = outputs.loss
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()

# 测试
model.eval()
test_text = "后天去深圳，三个人"

inputs = tokenizer(list(test_text), return_tensors='pt', padding=True, truncation=True, max_length=64, is_split_into_words=True)

with torch.no_grad():
    outputs = model(**inputs)
    predictions = torch.argmax(outputs.logits, dim=2)

# 解码
idx2slot = {idx: slot for slot, idx in slots.items()}
tokens = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
preds = predictions[0].tolist()

print(f"文本：{test_text}")
print("槽位填充结果：")
for token, pred in zip(tokens, preds):
    if token not in ['[CLS]', '[SEP]', '[PAD]']:
        slot_name = idx2slot.get(pred, 'O')
        if slot_name != 'O':
            print(f"  {token}: {slot_name}")
```

### 4.4 完整对话系统

```python
class TaskOrientedDialogueSystem:
    def __init__(self):
        # 意图识别模型
        self.intent_tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
        self.intent_model = BertForSequenceClassification.from_pretrained(
            'bert-base-chinese',
            num_labels=5
        )
        
        # 槽位填充模型
        self.slot_tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
        self.slot_model = BertForTokenClassification.from_pretrained(
            'bert-base-chinese',
            num_labels=7
        )
        
        # 意图映射
        self.intents = {
            0: "查询天气",
            1: "预订机票",
            2: "查询订单",
            3: "申请退款",
            4: "其他"
        }
        
        # 槽位映射
        self.slots = {
            0: "O",
            1: "B-目的地",
            2: "I-目的地",
            3: "B-时间",
            4: "I-时间",
            5: "B-人数",
            6: "I-人数"
        }
        
        # 对话状态
        self.dialogue_state = {}
    
    def recognize_intent(self, text):
        """识别意图"""
        inputs = self.intent_tokenizer(
            text,
            return_tensors='pt',
            padding=True,
            truncation=True,
            max_length=64
        )
        
        with torch.no_grad():
            outputs = self.intent_model(**inputs)
            pred = torch.argmax(outputs.logits, dim=1).item()
        
        return self.intents[pred]
    
    def fill_slots(self, text):
        """填充槽位"""
        inputs = self.slot_tokenizer(
            list(text),
            return_tensors='pt',
            padding=True,
            truncation=True,
            max_length=64,
            is_split_into_words=True
        )
        
        with torch.no_grad():
            outputs = self.slot_model(**inputs)
            predictions = torch.argmax(outputs.logits, dim=2)
        
        # 解码
        idx2slot = {idx: slot for slot, idx in self.slots.items()}
        tokens = self.slot_tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
        preds = predictions[0].tolist()
        
        slots = {}
        current_slot = None
        current_value = []
        
        for token, pred in zip(tokens, preds):
            if token in ['[CLS]', '[SEP]', '[PAD]']:
                continue
            
            slot_name = idx2slot.get(pred, 'O')
            
            if slot_name.startswith('B-'):
                # 保存之前的槽位
                if current_slot and current_value:
                    slots[current_slot] = ''.join(current_value)
                
                # 开始新槽位
                current_slot = slot_name[2:]
                current_value = [token]
            elif slot_name.startswith('I-') and current_slot:
                # 继续当前槽位
                current_value.append(token)
            else:
                # 结束当前槽位
                if current_slot and current_value:
                    slots[current_slot] = ''.join(current_value)
                    current_slot = None
                    current_value = []
        
        # 保存最后一个槽位
        if current_slot and current_value:
            slots[current_slot] = ''.join(current_value)
        
        return slots
    
    def manage_dialogue(self, intent, slots):
        """对话管理"""
        # 更新对话状态
        self.dialogue_state['intent'] = intent
        self.dialogue_state.update(slots)
        
        # 根据意图和槽位生成回复
        if intent == "预订机票":
            if '目的地' not in slots:
                return "请问您要去哪里？"
            elif '时间' not in slots:
                return f"好的，去{slots['目的地']}。请问什么时候出发？"
            elif '人数' not in slots:
                return f"好的，{slots['时间']}去{slots['目的地']}。请问几个人？"
            else:
                return f"已为您预订{slots['时间']}{slots['人数']}人去{slots['目的地']}的机票。"
        
        elif intent == "查询天气":
            if '目的地' not in slots:
                return "请问您要查询哪个城市的天气？"
            else:
                return f"{slots['目的地']}今天天气晴朗，温度 20-25 度。"
        
        elif intent == "查询订单":
            return "您的订单状态是：已发货，预计明天送达。"
        
        elif intent == "申请退款":
            return "请问您要退款哪个订单？"
        
        else:
            return "抱歉，我不太理解您的意思。"
    
    def chat(self, user_input):
        """对话主循环"""
        # 意图识别
        intent = self.recognize_intent(user_input)
        print(f"意图：{intent}")
        
        # 槽位填充
        slots = self.fill_slots(user_input)
        print(f"槽位：{slots}")
        
        # 对话管理
        response = self.manage_dialogue(intent, slots)
        print(f"回复：{response}\n")
        
        return response

# 测试
system = TaskOrientedDialogueSystem()

dialogue = [
    "帮我订机票",
    "去上海",
    "明天",
    "两个人"
]

for user_input in dialogue:
    print(f"用户：{user_input}")
    response = system.chat(user_input)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **问答系统** | 自动回答用户问题 |
| **检索式 QA** | 从知识库中检索答案 |
| **生成式 QA** | 生成自然语言答案 |
| **意图识别** | 理解用户想做什么 |
| **槽位填充** | 提取任务所需的信息 |
| **对话管理** | 维护对话状态，决定下一步行动 |

---

## 6 新手常见误区

### 误区 1："生成式 QA 一定比检索式 QA 好"

不一定。检索式 QA 答案准确、可控，但灵活性差；生成式 QA 灵活、流畅，但可能生成错误答案。要根据场景选择。

### 误区 2："意图识别和槽位填充是独立的"

**错！** 意图识别和槽位填充可以联合训练，共享底层表示，效果更好。

### 误区 3："对话系统不需要对话管理"

不是的。对话管理是对话系统的核心，负责维护对话状态、决定下一步行动。没有对话管理，系统无法进行多轮对话。

---

## 7 动手练习

### 练习 1：基础练习 - 检索式 QA

**题目**：实现一个简单的检索式 QA 系统，从 FAQ 中检索答案。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import jieba

faq_data = [
    {"question": "如何重置密码", "answer": "点击忘记密码"},
    {"question": "如何修改手机号", "answer": "进入个人中心修改"},
    {"question": "如何取消订单", "answer": "点击取消订单按钮"}
]

def tokenize(text):
    return ' '.join(jieba.lcut(text))

questions = [tokenize(item["question"]) for item in faq_data]
answers = [item["answer"] for item in faq_data]

vectorizer = TfidfVectorizer()
question_vectors = vectorizer.fit_transform(questions)

def retrieve_answer(user_question):
    user_vector = vectorizer.transform([tokenize(user_question)])
    similarities = cosine_similarity(user_vector, question_vectors)[0]
    best_idx = similarities.argmax()
    return answers[best_idx]

# 测试
print(retrieve_answer("怎么重置密码"))
```

</details>

### 练习 2：进阶练习 - 意图识别

**题目**：使用 BERT 实现意图识别，区分"查询天气"和"预订机票"。

<details>
<summary>点击查看答案</summary>

```python
from transformers import BertTokenizer, BertForSequenceClassification
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForSequenceClassification.from_pretrained('bert-base-chinese', num_labels=2)

train_data = [
    ("今天天气怎么样", 0),
    ("明天会下雨吗", 0),
    ("帮我订机票", 1),
    ("我想订去上海的机票", 1)
]

from transformers import AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

for text, label in train_data:
    inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=64)
    outputs = model(**inputs, labels=torch.tensor([label]))
    loss = outputs.loss
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()

print("训练完成")
```

</details>

### 练习 3（挑战）：综合练习 - 完整对话系统

**题目**：实现一个完整的任务型对话系统，支持意图识别、槽位填充和对话管理。

<details>
<summary>点击查看答案</summary>

```python
class SimpleDialogueSystem:
    def __init__(self):
        self.state = {}
    
    def recognize_intent(self, text):
        if "天气" in text:
            return "查询天气"
        elif "机票" in text or "订" in text:
            return "预订机票"
        else:
            return "其他"
    
    def fill_slots(self, text):
        slots = {}
        cities = ["北京", "上海", "广州", "深圳"]
        for city in cities:
            if city in text:
                slots["目的地"] = city
        return slots
    
    def manage_dialogue(self, intent, slots):
        self.state['intent'] = intent
        self.state.update(slots)
        
        if intent == "查询天气":
            if '目的地' in slots:
                return f"{slots['目的地']}天气晴朗"
            else:
                return "请问查询哪个城市？"
        elif intent == "预订机票":
            if '目的地' in slots:
                return f"已为您预订去{slots['目的地']}的机票"
            else:
                return "请问去哪里？"
        else:
            return "抱歉，我不理解"
    
    def chat(self, user_input):
        intent = self.recognize_intent(user_input)
        slots = self.fill_slots(user_input)
        return self.manage_dialogue(intent, slots)

# 测试
system = SimpleDialogueSystem()
print(system.chat("北京天气怎么样"))
print(system.chat("帮我订去上海的机票"))
```

</details>

---

## 下一章预告

下一章我们会学习 **文本生成与摘要**——也就是如何自动生成文本和提取摘要。你会学到文本摘要、关键词提取、文本生成、控制生成等技术。这是 NLP 最有趣的应用之一。
