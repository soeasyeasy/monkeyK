---
title: "第15章：大模型应用开发"
description: "FastAPI 推理服务、vLLM 高性能推理、对话管理、上下文维护、应用层开发实战"
---

# 第15章：大模型应用开发

## 本章导读

前两章我们学习了 Prompt Engineering 和模型微调，现在我们已经有了一个能力足够的大模型。但模型本身只是一个"大脑"，要让它真正为用户服务，我们需要把它包装成一个完整的应用。

你可能会有这些疑问：

- 如何把模型部署为一个 API 服务，让前端或其他系统调用？
- 模型推理很慢，有没有办法加速？
- 如何实现多轮对话？如何管理对话上下文？
- 如何构建一个类似 ChatGPT 的完整应用？
- 生产环境部署有哪些注意事项？

这一章将从零开始，手把手教你构建一个完整的大模型应用。

---

## 1 为什么需要应用开发？

### 痛点分析

**模型 ≠ 应用**：

1. **模型只是核心**：模型只是一个推理函数，需要包装成服务才能被调用
2. **用户体验**：用户需要友好的界面，而不是命令行
3. **系统集成**：企业需要将 AI 能力集成到现有系统中
4. **性能要求**：生产环境需要高并发、低延迟、高可用

**直接调用模型的问题**：

```python
# 直接调用模型的问题
from transformers import pipeline

generator = pipeline("text-generation", model="Qwen/Qwen2-1.5B")
result = generator("你好")  # 每次调用都重新加载模型，慢！
```

**问题**：
- 每次调用都加载模型？不可能
- 如何支持多个用户同时请求？
- 如何处理长对话的上下文？
- 如何监控和日志？

### 解决方案

**构建完整的应用架构**：

| 层次 | 组件 | 作用 |
|------|------|------|
| **接入层** | FastAPI / Flask | 提供 HTTP API |
| **推理层** | vLLM / TGI | 高性能模型推理 |
| **业务层** | 对话管理、上下文维护 | 处理业务逻辑 |
| **存储层** | Redis / 数据库 | 存储对话历史 |
| **监控层** | Prometheus / Grafana | 监控服务状态 |

**直观理解**：

> 模型就像一个厨师，应用就是餐厅。厨师只管做菜（推理），餐厅负责接待客人（API）、记录点单（对话管理）、上菜（返回结果）、处理投诉（错误处理）。

---

## 2 核心原理

### 2.1 推理服务架构

**基本架构**：

```
客户端 → API 网关 → 推理服务 → 模型
                ↓
            对话管理器 → 数据库
```

**关键组件**：

1. **API 服务**：接收 HTTP 请求，返回响应
2. **推理引擎**：加载模型，执行推理
3. **对话管理器**：维护对话历史，处理上下文
4. **流式输出**：逐 token 返回，提升用户体验

### 2.2 流式输出（Streaming）

**为什么需要流式输出？**

- 大模型生成一个完整的回复可能需要 5-10 秒
- 用户等待时间过长，体验差
- 流式输出可以边生成边显示，像 ChatGPT 一样

**实现原理**：

```python
# 非流式：等待全部生成完成
response = model.generate("你好")  # 等待 5 秒
return response  # 一次性返回

# 流式：逐 token 返回
for token in model.generate("你好", stream=True):
    yield token  # 每生成一个 token 就返回
```

### 2.3 对话管理

**多轮对话的挑战**：

1. **上下文窗口限制**：模型只能看到有限长度的历史
2. **上下文管理**：如何截断、压缩对话历史？
3. **会话隔离**：不同用户的对话不能混淆

**解决方案**：

```python
# 对话历史管理
class ConversationManager:
    def __init__(self, max_length=2048):
        self.max_length = max_length
        self.history = []
    
    def add_message(self, role, content):
        self.history.append({"role": role, "content": content})
        self._truncate()
    
    def _truncate(self):
        """截断过长的历史"""
        total_length = sum(len(msg["content"]) for msg in self.history)
        while total_length > self.max_length and len(self.history) > 2:
            self.history.pop(1)  # 保留第一条系统消息
            total_length = sum(len(msg["content"]) for msg in self.history)
    
    def get_messages(self):
        return self.history
```

---

## 3 对比分析

| 推理引擎 | 性能 | 易用性 | 功能 | 适用场景 |
|----------|------|--------|------|----------|
| **Transformers** | 中 | 高 | 全 | 开发测试 |
| **vLLM** | 高 | 中 | 中 | 生产环境 |
| **TGI** | 高 | 中 | 中 | 生产环境 |
| **llama.cpp** | 中 | 低 | 少 | 本地部署 |
| **TensorRT-LLM** | 很高 | 低 | 少 | 极致性能 |

---

## 4 基础用法

### 4.1 FastAPI 推理服务

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import uvicorn

app = FastAPI(title="LLM API")

# 全局变量（生产环境应该用依赖注入）
model = None
tokenizer = None

class ChatRequest(BaseModel):
    """聊天请求"""
    message: str              # 用户消息
    history: list = []        # 对话历史
    max_tokens: int = 512     # 最大生成长度
    temperature: float = 0.7  # 温度

class ChatResponse(BaseModel):
    """聊天响应"""
    reply: str
    usage: dict

@app.on_event("startup")
async def load_model():
    """启动时加载模型"""
    global model, tokenizer
    
    model_name = "Qwen/Qwen2-1.5B"
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True
    )
    model.eval()
    print("模型加载完成")

@app.post("/chat")
async def chat(request: ChatRequest):
    """聊天接口"""
    try:
        # 构建对话历史
        messages = []
        for msg in request.history:
            messages.append(f"{msg['role']}: {msg['content']}")
        messages.append(f"user: {request.message}")
        
        prompt = "\n".join(messages) + "\nassistant: "
        
        # 分词
        inputs = tokenizer(prompt, return_tensors="pt")
        inputs = {k: v.to(model.device) for k, v in inputs.items()}
        
        # 生成
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # 解码（只取新生成的部分）
        new_tokens = outputs[0][inputs["input_ids"].shape[1]:]
        reply = tokenizer.decode(new_tokens, skip_special_tokens=True)
        
        return ChatResponse(
            reply=reply,
            usage={
                "prompt_tokens": inputs["input_ids"].shape[1],
                "completion_tokens": len(new_tokens),
                "total_tokens": inputs["input_ids"].shape[1] + len(new_tokens)
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**测试 API**：

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好",
    "history": [],
    "max_tokens": 100
  }'
```

### 4.2 流式输出

```python
from fastapi.responses import StreamingResponse

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """流式聊天接口"""
    
    async def generate():
        """生成器函数"""
        # 构建 prompt
        messages = []
        for msg in request.history:
            messages.append(f"{msg['role']}: {msg['content']}")
        messages.append(f"user: {request.message}")
        prompt = "\n".join(messages) + "\nassistant: "
        
        # 分词
        inputs = tokenizer(prompt, return_tensors="pt")
        inputs = {k: v.to(model.device) for k, v in inputs.items()}
        
        # 流式生成
        with torch.no_grad():
            for _ in range(request.max_tokens):
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=1,          # 每次只生成 1 个 token
                    temperature=request.temperature,
                    top_p=0.9,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id
                )
                
                # 取新生成的 token
                new_token = outputs[0][inputs["input_ids"].shape[1]:]
                token_text = tokenizer.decode(new_token, skip_special_tokens=True)
                
                # 检查是否结束
                if new_token[-1] == tokenizer.eos_token_id:
                    break
                
                # 更新输入
                inputs["input_ids"] = outputs
                
                # 返回 token（SSE 格式）
                yield f"data: {token_text}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

**前端调用示例**：

```javascript
// JavaScript 调用流式 API
async function chat(message) {
  const response = await fetch('http://localhost:8000/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: [] })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        process.stdout.write(data);  // 实时输出
      }
    }
  }
}
```

### 4.3 对话管理器

```python
from typing import List, Dict
from dataclasses import dataclass, field
import uuid

@dataclass
class Message:
    """消息"""
    role: str          # "user" 或 "assistant"
    content: str
    timestamp: float = field(default_factory=lambda: time.time())

@dataclass
class Conversation:
    """对话"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    messages: List[Message] = field(default_factory=list)
    max_length: int = 2048
    
    def add_message(self, role: str, content: str):
        """添加消息"""
        self.messages.append(Message(role=role, content=content))
        self._truncate()
    
    def _truncate(self):
        """截断过长的历史"""
        total_length = sum(len(msg.content) for msg in self.messages)
        
        # 保留第一条系统消息（如果有）
        start_idx = 1 if self.messages and self.messages[0].role == "system" else 0
        
        while total_length > self.max_length and len(self.messages) > start_idx + 2:
            # 从第二条开始删除（保留系统消息和最新消息）
            self.messages.pop(start_idx + 1)
            total_length = sum(len(msg.content) for msg in self.messages)
    
    def to_dict(self) -> List[Dict]:
        """转换为字典列表"""
        return [{"role": msg.role, "content": msg.content} for msg in self.messages]

class ConversationManager:
    """对话管理器"""
    
    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}
    
    def create_conversation(self) -> str:
        """创建新对话"""
        conv = Conversation()
        self.conversations[conv.id] = conv
        return conv.id
    
    def get_conversation(self, conv_id: str) -> Conversation:
        """获取对话"""
        if conv_id not in self.conversations:
            raise ValueError(f"Conversation {conv_id} not found")
        return self.conversations[conv_id]
    
    def add_message(self, conv_id: str, role: str, content: str):
        """添加消息"""
        conv = self.get_conversation(conv_id)
        conv.add_message(role, content)
    
    def delete_conversation(self, conv_id: str):
        """删除对话"""
        if conv_id in self.conversations:
            del self.conversations[conv_id]

# 使用示例
manager = ConversationManager()

# 创建对话
conv_id = manager.create_conversation()

# 添加消息
manager.add_message(conv_id, "user", "你好")
manager.add_message(conv_id, "assistant", "你好！有什么可以帮助你的吗？")
manager.add_message(conv_id, "user", "介绍一下你自己")

# 获取对话历史
conv = manager.get_conversation(conv_id)
print(conv.to_dict())
```

### 4.4 完整的聊天应用

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import time

app = FastAPI()
conv_manager = ConversationManager()

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    max_tokens: int = 512
    temperature: float = 0.7

class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    usage: dict

@app.post("/chat")
async def chat(request: ChatRequest):
    """完整的聊天接口"""
    try:
        # 获取或创建对话
        if request.conversation_id:
            conv_id = request.conversation_id
            conv = conv_manager.get_conversation(conv_id)
        else:
            conv_id = conv_manager.create_conversation()
            conv = conv_manager.get_conversation(conv_id)
        
        # 添加用户消息
        conv_manager.add_message(conv_id, "user", request.message)
        
        # 构建 prompt
        messages = conv.to_dict()
        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        # 分词和生成
        inputs = tokenizer(prompt, return_tensors="pt")
        inputs = {k: v.to(model.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # 解码
        new_tokens = outputs[0][inputs["input_ids"].shape[1]:]
        reply = tokenizer.decode(new_tokens, skip_special_tokens=True)
        
        # 添加助手回复
        conv_manager.add_message(conv_id, "assistant", reply)
        
        return ChatResponse(
            conversation_id=conv_id,
            reply=reply,
            usage={
                "prompt_tokens": int(inputs["input_ids"].shape[1]),
                "completion_tokens": int(len(new_tokens)),
                "total_tokens": int(inputs["input_ids"].shape[1] + len(new_tokens))
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/conversation/{conv_id}")
async def delete_conversation(conv_id: str):
    """删除对话"""
    conv_manager.delete_conversation(conv_id)
    return {"status": "ok"}
```

---

## 5 进阶用法

### 5.1 vLLM 高性能推理

```python
from vllm import LLM, SamplingParams

# 初始化 vLLM 引擎
llm = LLM(
    model="Qwen/Qwen2-1.5B",
    tensor_parallel_size=1,      # 张量并行数（GPU 数量）
    gpu_memory_utilization=0.9,  # GPU 显存利用率
    max_model_len=4096,          # 最大模型长度
    trust_remote_code=True
)

# 采样参数
sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=512,
)

# 推理
prompts = ["你好，请介绍一下自己"]
outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    prompt = output.prompt
    generated_text = output.outputs[0].text
    print(f"Prompt: {prompt}")
    print(f"Generated: {generated_text}")
```

**vLLM + FastAPI**：

```python
from vllm import AsyncLLMEngine
from vllm.engine.arg_utils import AsyncEngineArgs
from vllm.sampling_params import SamplingParams
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

# 异步引擎
engine_args = AsyncEngineArgs(
    model="Qwen/Qwen2-1.5B",
    trust_remote_code=True
)
engine = AsyncLLMEngine.from_engine_args(engine_args)

@app.post("/chat")
async def chat(request: ChatRequest):
    """使用 vLLM 的聊天接口"""
    
    # 构建 prompt
    prompt = tokenizer.apply_chat_template(
        [{"role": "user", "content": request.message}],
        tokenize=False,
        add_generation_prompt=True
    )
    
    # 采样参数
    sampling_params = SamplingParams(
        temperature=request.temperature,
        top_p=0.9,
        max_tokens=request.max_tokens,
    )
    
    # 异步生成
    results = engine.generate(prompt, sampling_params, request_id="1")
    
    async def generate():
        async for result in results:
            if result.outputs:
                yield f"data: {result.outputs[0].text}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 5.2 模型量化部署

```python
# GPTQ 量化
from transformers import AutoModelForCausalLM, AutoTokenizer, GPTQConfig

# 加载量化后的模型
model = AutoModelForCausalLM.from_pretrained(
    "TheBloke/Qwen2-1.5B-GPTQ",  # 已经量化好的模型
    device_map="auto"
)

# AWQ 量化
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained(
    "casperhansen/qwen2-1.5b-awq",  # AWQ 量化模型
    device_map="auto"
)
```

### 5.3 批量推理

```python
@app.post("/batch_chat")
async def batch_chat(requests: List[ChatRequest]):
    """批量聊天接口"""
    
    # 批量构建 prompts
    prompts = []
    for req in requests:
        messages = [{"role": "user", "content": req.message}]
        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        prompts.append(prompt)
    
    # 批量分词
    inputs = tokenizer(prompts, return_tensors="pt", padding=True)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    # 批量生成
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    # 批量解码
    replies = []
    for i, output in enumerate(outputs):
        input_length = inputs["input_ids"][i].sum().item()  # 排除 padding
        new_tokens = output[input_length:]
        reply = tokenizer.decode(new_tokens, skip_special_tokens=True)
        replies.append(reply)
    
    return {"replies": replies}
```

### 5.4 缓存优化

```python
from functools import lru_cache
import hashlib

class ResponseCache:
    """响应缓存"""
    
    def __init__(self, max_size=1000):
        self.cache = {}
        self.max_size = max_size
    
    def _get_key(self, prompt: str, temperature: float) -> str:
        """生成缓存键"""
        key_str = f"{prompt}:{temperature}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, prompt: str, temperature: float) -> Optional[str]:
        """获取缓存"""
        key = self._get_key(prompt, temperature)
        return self.cache.get(key)
    
    def set(self, prompt: str, temperature: float, response: str):
        """设置缓存"""
        if len(self.cache) >= self.max_size:
            # 简单 LRU：删除最早的
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        
        key = self._get_key(prompt, temperature)
        self.cache[key] = response

# 使用缓存
cache = ResponseCache()

@app.post("/chat")
async def chat(request: ChatRequest):
    prompt = build_prompt(request)
    
    # 尝试从缓存获取
    cached_response = cache.get(prompt, request.temperature)
    if cached_response:
        return {"reply": cached_response, "cached": True}
    
    # 生成回复
    reply = generate_reply(prompt)
    
    # 存入缓存
    cache.set(prompt, request.temperature, reply)
    
    return {"reply": reply, "cached": False}
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **FastAPI** | 高性能异步 Web 框架，适合构建 API 服务 |
| **流式输出** | 逐 token 返回，提升用户体验，使用 SSE 协议 |
| **对话管理** | 维护对话历史，处理上下文截断，会话隔离 |
| **vLLM** | 高性能推理引擎，支持 PagedAttention、连续批处理 |
| **模型量化** | GPTQ、AWQ 等量化技术，降低显存需求 |
| **批量推理** | 同时处理多个请求，提高吞吐量 |
| **缓存优化** | 缓存相同请求的响应，减少重复计算 |

---

## 7 新手常见误区

### 误区 1：每次请求都重新加载模型

**错误做法**：

```python
@app.post("/chat")
async def chat(request: ChatRequest):
    model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2-1.5B")  # 每次加载！
    # ...
```

**为什么错**：

- 模型加载需要 10-30 秒
- 浪费内存和计算资源

**正确做法**：

```python
# 启动时加载一次
@app.on_event("startup")
async def load_model():
    global model
    model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2-1.5B")

@app.post("/chat")
async def chat(request: ChatRequest):
    # 直接使用全局模型
    # ...
```

### 误区 2：忽略 GPU 显存管理

**错误做法**：

```python
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2-1.5B")
# 不指定 device_map，可能 OOM
```

**为什么错**：

- 大模型可能超出单卡显存
- 没有合理分配显存

**正确做法**：

```python
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2-1.5B",
    device_map="auto",           # 自动分配
    torch_dtype=torch.float16,   # 使用 FP16
)
```

### 误区 3：对话历史不截断

**错误做法**：

```python
# 无限累积历史
history.append(new_message)
prompt = build_prompt(history)  # 可能超出上下文窗口
```

**为什么错**：

- 超出模型上下文窗口限制
- 显存溢出

**正确做法**：

```python
# 截断历史
if len(history) > max_turns:
    history = history[-max_turns:]
```

### 误区 4：不使用批处理

**错误做法**：

```python
# 逐个处理请求
for prompt in prompts:
    output = model.generate(prompt)  # 串行，慢！
```

**为什么错**：

- GPU 利用率低
- 吞吐量低

**正确做法**：

```python
# 批量处理
inputs = tokenizer(prompts, padding=True, return_tensors="pt")
outputs = model.generate(**inputs)  # 并行，快！
```

### 误区 5：忽略错误处理

**错误做法**：

```python
@app.post("/chat")
async def chat(request: ChatRequest):
    output = model.generate(...)  # 可能 OOM、超时
    return {"reply": output}
```

**为什么错**：

- 服务崩溃
- 用户体验差

**正确做法**：

```python
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        output = model.generate(...)
        return {"reply": output}
    except torch.cuda.OutOfMemoryError:
        raise HTTPException(status_code=503, detail="GPU 显存不足")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 8 动手练习

### 练习 1：构建完整的聊天 API

**任务**：

1. 使用 FastAPI 构建聊天 API
2. 支持多轮对话
3. 实现对话历史管理

**提示**：

```python
# 使用 ConversationManager 管理对话
manager = ConversationManager()

@app.post("/chat")
async def chat(request: ChatRequest):
    conv_id = request.conversation_id or manager.create_conversation()
    manager.add_message(conv_id, "user", request.message)
    # ...
```

### 练习 2：实现流式输出

**任务**：

实现流式聊天接口，前端可以实时显示生成的内容。

**提示**：

```python
@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        for token in model.generate(..., stream=True):
            yield f"data: {token}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 练习 3：使用 vLLM 加速推理

**任务**：

将推理引擎替换为 vLLM，对比性能提升。

**提示**：

```python
from vllm import LLM

llm = LLM(model="Qwen/Qwen2-1.5B")
outputs = llm.generate(prompts, sampling_params)
```

---

## 9 下一章预告

在下一章"大模型部署与优化"中，我们将学习如何将大模型应用部署到生产环境，并进行性能优化。我们会学习：

- Docker 容器化部署
- Kubernetes 集群部署
- 模型压缩与加速（量化、剪枝、蒸馏）
- 性能监控与调优
- 高可用架构设计

敬请期待！
