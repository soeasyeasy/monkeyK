---
title: "第13章：AI 应用前端集成"
description: "流式响应、SSE、WebSocket、前端状态管理、用户体验优化"
---

# 第13章：AI 应用前端集成

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何在前端集成 AI 功能？
- 什么是流式响应？如何实现？
- SSE 和 WebSocket 有什么区别？
- 如何管理 AI 对话的前端状态？
- 如何优化用户体验？

这一章就是为了解答这些问题。我们会学习 **AI 应用的前端集成技术**，构建流畅的 AI 交互体验。

---

## 1 为什么需要前端集成？

### 痛点分析

**传统请求的问题**：

1. **等待时间长**：AI 生成需要时间，用户看着空白页面等待
2. **体验差**：一次性返回所有内容，没有打字效果
3. **无法中断**：一旦开始就无法停止

**举个例子**：

```
❌ 传统方式：
用户提问 → 等待 10 秒 → 一次性显示 1000 字
体验：用户不知道进度，可能以为卡住了

✅ 流式响应：
用户提问 → 第 1 秒开始逐字显示 → 10 秒完成
体验：实时反馈，像和人聊天一样
```

### 解决方案

> **一句话总结**：流式响应让 AI 回答逐字显示，提升用户体验。

---

## 2 核心原理

### 流式响应技术

```
┌─────────────────────────────────────┐
│  1. SSE (Server-Sent Events)        │
│  2. WebSocket                       │
│  3. Fetch API + ReadableStream      │
└─────────────────────────────────────┘
```

### 技术对比

| 技术 | 方向 | 复杂度 | 适用场景 |
|------|------|--------|---------|
| SSE | 服务器→客户端 | 低 | 流式文本输出 |
| WebSocket | 双向 | 中 | 实时聊天 |
| Fetch Stream | 客户端读取 | 低 | 简单流式 |

---

## 3 基础用法

### SSE 实现流式响应

**后端（Python FastAPI）**：

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from openai import OpenAI

app = FastAPI()
client = OpenAI()

@app.post("/chat")
async def chat(request: dict):
    """流式聊天接口"""
    user_input = request.get("message", "")
    
    def generate():
        """生成流式响应"""
        stream = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": user_input}],
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                yield f"data: {content}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

**前端（JavaScript）**：

```javascript
async function chatStream(message) {
    const response = await fetch('/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message})
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let result = '';
    
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                result += data;
                // 实时更新 UI
                updateUI(result);
            }
        }
    }
    
    return result;
}

function updateUI(text) {
    document.getElementById('response').textContent = text;
}
```

### EventSource API

```javascript
// 使用 EventSource（更简单）
const eventSource = new EventSource('/chat-stream');

eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
        eventSource.close();
        return;
    }
    
    // 追加内容
    const current = document.getElementById('response').textContent;
    document.getElementById('response').textContent = current + event.data;
};

eventSource.onerror = (error) => {
    console.error('EventSource failed:', error);
    eventSource.close();
};
```

### Vue 3 集成示例

```vue
<template>
  <div class="chat-container">
    <div class="messages">
      <div v-for="(msg, idx) in messages" :key="idx" class="message">
        <div class="role">{{ msg.role }}</div>
        <div class="content">{{ msg.content }}</div>
      </div>
      <div v-if="isLoading" class="loading">AI 正在思考...</div>
    </div>
    
    <div class="input-area">
      <input 
        v-model="userInput" 
        @keyup.enter="sendMessage"
        placeholder="输入消息..."
        :disabled="isLoading"
      />
      <button @click="sendMessage" :disabled="isLoading">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const messages = ref([]);
const userInput = ref('');
const isLoading = ref(false);

async function sendMessage() {
  if (!userInput.value.trim() || isLoading.value) return;
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userInput.value
  });
  
  const userMessage = userInput.value;
  userInput.value = '';
  isLoading.value = true;
  
  // 添加 AI 消息占位
  messages.value.push({
    role: 'assistant',
    content: ''
  });
  
  try {
    // 流式请求
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: userMessage})
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let aiResponse = '';
    
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          aiResponse += data;
          // 更新最后一条消息
          messages.value[messages.value.length - 1].content = aiResponse;
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
    messages.value[messages.value.length - 1].content = '出错了，请重试';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.messages {
  margin-bottom: 20px;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  background: #f5f5f5;
}

.role {
  font-weight: bold;
  color: #666;
  margin-bottom: 5px;
}

.loading {
  color: #999;
  font-style: italic;
}

.input-area {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```

### React 集成示例

```jsx
import { useState, useRef } from 'react';

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);
  
  async function sendMessage() {
    if (!input.trim() || isLoading) return;
    
    setMessages(prev => [...prev, {role: 'user', content: input}]);
    const userMessage = input;
    setInput('');
    setIsLoading(true);
    
    // 添加 AI 消息占位
    setMessages(prev => [...prev, {role: 'assistant', content: ''}]);
    
    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: userMessage}),
        signal: abortControllerRef.current.signal
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let aiResponse = '';
      
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            aiResponse += data;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].content = aiResponse;
              return newMessages;
            });
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  function stopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className="message">
            <div className="role">{msg.role}</div>
            <div className="content">{msg.content}</div>
          </div>
        ))}
        {isLoading && <div className="loading">AI 正在思考...</div>}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="输入消息..."
          disabled={isLoading}
        />
        {isLoading ? (
          <button onClick={stopGeneration}>停止</button>
        ) : (
          <button onClick={sendMessage}>发送</button>
        )}
      </div>
    </div>
  );
}

export default ChatApp;
```

---

## 4 进阶用法

### Markdown 渲染

```javascript
import { marked } from 'marked';

// 在流式响应中渲染 Markdown
function renderMarkdown(text) {
  return marked.parse(text);
}

// 在 Vue 中使用
<div v-html="renderMarkdown(aiResponse)"></div>
```

### 代码高亮

```javascript
import hljs from 'highlight.js';

// 渲染后高亮代码
function highlightCode() {
  document.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightBlock(block);
  });
}

// 在流式完成后调用
watch(aiResponse, () => {
  nextTick(() => {
    highlightCode();
  });
});
```

### 打字机效果

```javascript
function typeWriter(text, element, speed = 30) {
  let i = 0;
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// 使用
const response = await chatStream("你好");
typeWriter(response, document.getElementById('output'));
```

### 错误处理与重试

```javascript
async function chatWithRetry(message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await chatStream(message);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      
      // 指数退避
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| SSE | 服务器推送事件，单向流 |
| WebSocket | 双向通信 |
| Fetch Stream | 客户端读取流 |
| 状态管理 | 管理对话历史和加载状态 |
| 错误处理 | 重试机制、超时处理 |
| UI 优化 | Markdown 渲染、代码高亮 |

---

## 6 新手常见误区

### 误区 1："流式响应很复杂"

**错！** 核心就是：
- 后端逐块发送数据
- 前端逐块读取并更新 UI
- 使用 Fetch API 或 EventSource

### 误区 2："不需要错误处理"

不对。应该：
- 处理网络错误
- 实现重试机制
- 给用户明确的错误提示

### 误区 3："流式响应不需要加载状态"

实际上：
- 用户需要知道正在加载
- 可以显示打字指示器
- 提升用户体验

---

## 7 动手练习

### 练习 1：基础练习 - 简单流式

**任务**：实现一个简单的流式聊天界面。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <div>{{ response }}</div>
    <input v-model="input" @keyup.enter="send" />
    <button @click="send">发送</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const input = ref('');
const response = ref('');

async function send() {
  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({message: input.value})
  });
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  
  response.value = '';
  
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    response.value += chunk;
  }
}
</script>
```

</details>

### 练习 2：进阶练习 - 对话历史

**任务**：实现带对话历史的聊天界面。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <div v-for="msg in messages" :key="msg.id">
      <strong>{{ msg.role }}:</strong> {{ msg.content }}
    </div>
    <input v-model="input" @keyup.enter="send" />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const messages = ref([]);
const input = ref('');

async function send() {
  messages.value.push({id: Date.now(), role: 'user', content: input.value});
  
  const userMsg = input.value;
  input.value = '';
  
  messages.value.push({id: Date.now() + 1, role: 'assistant', content: ''});
  
  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({message: userMsg})
  });
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  
  let content = '';
  
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    
    content += decoder.decode(value);
    messages.value[messages.value.length - 1].content = content;
  }
}
</script>
```

</details>

### 练习 3（挑战）：综合练习 - 完整聊天应用

**任务**：实现一个完整的聊天应用，支持流式响应、Markdown 渲染、代码高亮。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="chat-app">
    <div class="messages">
      <div v-for="msg in messages" :key="msg.id" class="message" :class="msg.role">
        <div class="content" v-html="renderMarkdown(msg.content)"></div>
      </div>
    </div>
    
    <div class="input-area">
      <textarea v-model="input" @keyup.ctrl.enter="send" />
      <button @click="send" :disabled="isLoading">
        {{ isLoading ? '生成中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';

const messages = ref([]);
const input = ref('');
const isLoading = ref(false);

function renderMarkdown(text) {
  return marked.parse(text);
}

async function send() {
  if (!input.value.trim() || isLoading.value) return;
  
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: input.value
  });
  
  const userMsg = input.value;
  input.value = '';
  isLoading.value = true;
  
  const aiMsg = {
    id: Date.now() + 1,
    role: 'assistant',
    content: ''
  };
  messages.value.push(aiMsg);
  
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({message: userMsg})
    });
    
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      
      aiMsg.content += decoder.decode(value);
      
      await nextTick();
      hljs.highlightAll();
    }
  } catch (error) {
    aiMsg.content = '出错了：' + error.message;
  } finally {
    isLoading.value = false;
  }
}
</script>
```

</details>

---

## 下一章预告

下一章我们会学习 **AI 应用后端架构**——如何使用 FastAPI 构建高性能的 AI 应用后端。
