---
title: "第7章：对话系统开发"
description: "多轮对话管理、上下文维护、对话状态跟踪、会话记忆"
---

# 第7章：对话系统开发

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何实现多轮对话？
- 如何让模型记住之前的对话内容？
- 对话上下文太长怎么办？
- 如何跟踪对话状态？
- 如何实现会话记忆？

这一章就是为了解答这些问题。我们会学习 **对话系统开发的核心技术**，构建能够持续对话的 AI 应用。

---

## 1 为什么需要对话系统？

### 痛点分析

**单轮对话的局限**：

1. **无法延续话题**：每次都要重新说明背景
2. **缺乏上下文**：模型不知道之前聊了什么
3. **体验差**：像和一个健忘的人聊天

**举个例子**：

```
❌ 单轮对话：
用户：北京天气怎么样？
AI：北京今天晴，25°C
用户：那明天呢？  ← 模型不知道"那"指的是北京
AI：请问您想查询哪个城市？

✅ 多轮对话：
用户：北京天气怎么样？
AI：北京今天晴，25°C
用户：那明天呢？
AI：北京明天多云，23°C  ← 模型知道是在问北京
```

### 解决方案

> **一句话总结**：对话系统让模型记住上下文，实现流畅的多轮对话。

---

## 2 核心原理

### 对话系统架构

```
┌─────────────────────────────────────┐
│  1. 消息历史管理                     │
│  2. 上下文窗口控制                   │
│  3. 对话状态跟踪                     │
│  4. 会话记忆机制                     │
└─────────────────────────────────────┘
```

---

## 3 基础用法

### 多轮对话基础

```python
from openai import OpenAI

client = OpenAI()

# 维护消息历史
messages = [
    {"role": "system", "content": "你是一个友好的助手"}
]

def chat(user_input):
    """多轮对话"""
    # 添加用户消息
    messages.append({"role": "user", "content": user_input})
    
    # 调用模型
    response = client.chat.completions.create(
        model="gpt-4",
        messages=messages
    )
    
    # 获取回复
    assistant_reply = response.choices[0].message.content
    
    # 添加助手回复到历史
    messages.append({"role": "assistant", "content": assistant_reply})
    
    return assistant_reply

# 使用
print(chat("我叫张三"))  # 你好，张三！
print(chat("我今年25岁"))  # 25岁，很好！
print(chat("我叫什么名字？"))  # 你叫张三
```

### 上下文窗口控制

```python
def chat_with_limit(user_input, max_messages=10):
    """带上下文限制的对话"""
    messages.append({"role": "user", "content": user_input})
    
    # 保留系统消息 + 最近 N 条消息
    system_msg = messages[0]
    recent_messages = messages[-(max_messages-1):]
    context_messages = [system_msg] + recent_messages
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=context_messages
    )
    
    assistant_reply = response.choices[0].message.content
    messages.append({"role": "assistant", "content": assistant_reply})
    
    return assistant_reply
```

### 对话状态跟踪

```python
class ConversationState:
    """对话状态跟踪器"""
    
    def __init__(self):
        self.state = {
            "topic": None,
            "entities": {},
            "intent": None
        }
    
    def update(self, user_input, ai_response):
        """更新状态"""
        # 使用模型提取状态
        prompt = f"""分析以下对话，提取对话状态：

用户：{user_input}
AI：{ai_response}

输出 JSON：
{{
    "topic": "当前话题",
    "entities": {{"实体名": "实体值"}},
    "intent": "用户意图"
}}"""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        import json
        new_state = json.loads(response.choices[0].message.content)
        self.state.update(new_state)
    
    def get_state(self):
        return self.state

# 使用
state_tracker = ConversationState()

user_input = "我想订一张去北京的机票"
ai_response = "好的，请问您什么时候出发？"
state_tracker.update(user_input, ai_response)

print(state_tracker.get_state())
# {'topic': '机票预订', 'entities': {'destination': '北京'}, 'intent': '订票'}
```

### 会话记忆

```python
class ConversationMemory:
    """会话记忆系统"""
    
    def __init__(self, max_length=1000):
        self.max_length = max_length
        self.short_term = []  # 短期记忆
        self.long_term = []   # 长期记忆
    
    def add(self, role, content):
        """添加记忆"""
        self.short_term.append({"role": role, "content": content})
        
        # 超过长度限制时，压缩到长期记忆
        if len(str(self.short_term)) > self.max_length:
            self._compress()
    
    def _compress(self):
        """压缩短期记忆到长期记忆"""
        # 总结短期记忆
        summary_prompt = "请总结以下对话的关键信息：\n"
        for msg in self.short_term:
            summary_prompt += f"{msg['role']}: {msg['content']}\n"
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": summary_prompt}]
        )
        
        summary = response.choices[0].message.content
        self.long_term.append(summary)
        
        # 保留最近的消息
        self.short_term = self.short_term[-5:]
    
    def get_context(self):
        """获取上下文"""
        context = []
        
        # 添加长期记忆摘要
        if self.long_term:
            summary = "\n".join(self.long_term[-3:])
            context.append({
                "role": "system",
                "content": f"之前的对话摘要：{summary}"
            })
        
        # 添加短期记忆
        context.extend(self.short_term)
        
        return context

# 使用
memory = ConversationMemory()

memory.add("user", "我叫张三，是一名程序员")
memory.add("assistant", "你好，张三！很高兴认识你")
memory.add("user", "我喜欢 Python 和 AI")
memory.add("assistant", "Python 和 AI 是很好的组合！")

context = memory.get_context()
print(context)
```

---

## 4 进阶用法

### 完整的对话系统

```python
class DialogueSystem:
    """完整的对话系统"""
    
    def __init__(self, system_prompt="你是一个友好的助手"):
        self.system_prompt = system_prompt
        self.messages = [{"role": "system", "content": system_prompt}]
        self.memory = ConversationMemory()
        self.state = ConversationState()
    
    def chat(self, user_input):
        """处理用户输入"""
        # 更新记忆
        self.memory.add("user", user_input)
        
        # 获取上下文
        context = self.memory.get_context()
        
        # 构建消息
        messages = [{"role": "system", "content": self.system_prompt}]
        messages.extend(context)
        
        # 调用模型
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages
        )
        
        ai_response = response.choices[0].message.content
        
        # 更新记忆和状态
        self.memory.add("assistant", ai_response)
        self.state.update(user_input, ai_response)
        
        return ai_response
    
    def reset(self):
        """重置对话"""
        self.messages = [{"role": "system", "content": self.system_prompt}]
        self.memory = ConversationMemory()
        self.state = ConversationState()

# 使用
dialogue = DialogueSystem()

print(dialogue.chat("你好，我叫张三"))
print(dialogue.chat("我是一名程序员"))
print(dialogue.chat("你还记得我叫什么吗？"))  # 记得，你叫张三
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 消息历史 | 维护完整的对话历史 |
| 上下文窗口 | 控制发送给模型的消息数量 |
| 状态跟踪 | 提取对话中的关键信息 |
| 会话记忆 | 短期记忆 + 长期记忆 |
| 对话压缩 | 总结历史对话，节省 token |

---

## 6 新手常见误区

### 误区 1："把所有历史都发给模型"

**错！** 应该：
- 控制上下文长度
- 压缩历史对话
- 只保留关键信息

### 误区 2："不需要状态跟踪"

不对。状态跟踪的作用：
- 理解用户意图
- 提取关键实体
- 实现个性化回复

### 误区 3："记忆越多越好"

实际上：
- 记忆太多会超出 token 限制
- 需要压缩和筛选
- 保留关键信息即可

---

## 7 动手练习

### 练习 1：基础练习 - 多轮对话

**任务**：实现一个简单的多轮对话系统，能够记住用户之前说的话。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI

client = OpenAI()
messages = [{"role": "system", "content": "你是一个友好的助手"}]

def chat(user_input):
    messages.append({"role": "user", "content": user_input})
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=messages
    )
    
    reply = response.choices[0].message.content
    messages.append({"role": "assistant", "content": reply})
    
    return reply

# 测试
print(chat("我叫张三"))
print(chat("我来自北京"))
print(chat("我叫什么？来自哪里？"))
```

</details>

### 练习 2：进阶练习 - 上下文限制

**任务**：实现带上下文限制的对话系统，只保留最近 N 条消息。

<details>
<summary>点击查看答案</summary>

```python
class LimitedDialogue:
    def __init__(self, max_turns=5):
        self.max_turns = max_turns
        self.messages = [{"role": "system", "content": "你是一个友好的助手"}]
    
    def chat(self, user_input):
        self.messages.append({"role": "user", "content": user_input})
        
        # 限制消息数量
        system_msg = self.messages[0]
        recent = self.messages[-(self.max_turns * 2):]
        context = [system_msg] + recent
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=context
        )
        
        reply = response.choices[0].message.content
        self.messages.append({"role": "assistant", "content": reply})
        
        return reply

# 测试
dialogue = LimitedDialogue(max_turns=3)
for i in range(10):
    print(f"Turn {i+1}:", dialogue.chat(f"这是第{i+1}轮对话"))
```

</details>

### 练习 3（挑战）：综合练习 - 对话状态跟踪

**任务**：实现一个带状态跟踪的对话系统，能够提取用户信息。

<details>
<summary>点击查看答案</summary>

```python
import json

class StateTrackingDialogue:
    def __init__(self):
        self.messages = [{"role": "system", "content": "你是一个客服助手"}]
        self.user_info = {}
    
    def chat(self, user_input):
        self.messages.append({"role": "user", "content": user_input})
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=self.messages
        )
        
        reply = response.choices[0].message.content
        self.messages.append({"role": "assistant", "content": reply})
        
        # 提取用户信息
        self._extract_info(user_input)
        
        return reply
    
    def _extract_info(self, text):
        prompt = f"""从以下文本提取用户信息：

{text}

输出 JSON：
{{"name": "姓名", "age": 年龄, "city": "城市"}}

如果某个字段没有，设为 null"""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        info = json.loads(response.choices[0].message.content)
        for k, v in info.items():
            if v is not None:
                self.user_info[k] = v
    
    def get_user_info(self):
        return self.user_info

# 测试
dialogue = StateTrackingDialogue()
dialogue.chat("我叫张三")
dialogue.chat("我今年25岁")
dialogue.chat("我来自北京")
print(dialogue.get_user_info())
# {'name': '张三', 'age': 25, 'city': '北京'}
```

</details>

---

## 下一章预告

下一章我们会学习 **RAG 检索增强生成**——如何让模型访问外部知识库。你会学到：

- RAG 架构设计
- 向量数据库使用
- 文档切分策略
- 检索优化
