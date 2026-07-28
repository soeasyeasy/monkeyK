---
title: "第2章：大模型 API 调用基础"
description: "OpenAI API、Claude API、国产大模型 API 接入与基础调用"
---

# 第2章：大模型 API 调用基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何申请和使用 OpenAI API Key？
- Claude API 和 OpenAI API 有什么区别？
- 国产大模型（文心一言、通义千问）怎么接入？
- 不同模型的价格和性能如何对比？
- API 调用有哪些最佳实践？

这一章就是为了解答这些问题。我们会详细讲解 **主流大模型 API 的接入方法**，对比不同模型的特点，帮你选择最适合的模型，并掌握 API 调用的最佳实践。

---

## 1 为什么需要掌握多种 API？

### 痛点分析

**只用一个 API 的问题**：

1. **成本高**：不同任务用同一个模型可能不划算
2. **效果受限**：某些模型在特定任务上表现更好
3. **风险集中**：单一 API 故障会影响整个应用
4. **无法对比**：不知道哪个模型更适合你的场景

**举个例子**：

```
场景 1：简单文本生成
- 用 GPT-4：成本高，响应慢
- 用 GPT-3.5：成本低，响应快，效果够用

场景 2：复杂推理任务
- 用 GPT-3.5：效果差，逻辑混乱
- 用 GPT-4：效果好，推理能力强

场景 3：中文内容创作
- 用 GPT-4：中文表达不够地道
- 用文心一言：中文更自然，理解更准确
```

### 解决方案

> **一句话总结**：根据任务特点、成本预算、响应速度要求，灵活选择不同的大模型 API。

打个比方：

> 想象你要去旅行：
> - 短途出行 → 骑共享单车（便宜、快速）
> - 长途旅行 → 坐高铁（舒适、高效）
> - 紧急事务 → 坐飞机（最快、最贵）
> 
> 大模型选择也是一样：
> - 简单任务 → GPT-3.5 / 通义千问（便宜、快速）
> - 复杂任务 → GPT-4 / Claude（强大、昂贵）
> - 中文场景 → 文心一言 / 通义千问（更懂中文）

---

## 2 核心原理

### API 调用流程

所有大模型 API 的调用流程都类似：

```
1. 申请 API Key
   ↓
2. 安装 SDK 库
   ↓
3. 配置认证信息
   ↓
4. 构建请求参数
   ↓
5. 发送请求
   ↓
6. 解析响应结果
```

### 主流大模型对比

| 模型 | 优势 | 劣势 | 价格（每1K tokens） | 适用场景 |
|------|------|------|---------------------|---------|
| GPT-4 | 推理能力强，多语言 | 价格高，响应慢 | $0.03 / $0.06 | 复杂推理、代码生成 |
| GPT-3.5 | 价格便宜，响应快 | 复杂任务效果差 | $0.0015 / $0.002 | 简单对话、文本生成 |
| Claude 3 | 长文本处理强，安全性好 | 中文支持一般 | $0.008 / $0.024 | 长文档分析、安全场景 |
| 文心一言 | 中文理解好，国内访问快 | 英文能力较弱 | ¥0.012 / ¥0.012 | 中文内容创作 |
| 通义千问 | 免费额度大，中文优秀 | 复杂推理稍弱 | 免费 / ¥0.008 | 中文对话、成本敏感 |

---

## 3 基础用法

### OpenAI API

**申请 API Key**：

1. 访问 https://platform.openai.com/
2. 注册账号并登录
3. 进入 API Keys 页面
4. 点击 "Create new secret key"
5. 保存好生成的 Key（只显示一次）

**安装 SDK**：

```bash
pip install openai
```

**基础调用示例**：

```python
# 导入库
from openai import OpenAI
import os

# 方式1：从环境变量读取（推荐）
# 先设置环境变量：export OPENAI_API_KEY="your-key-here"
client = OpenAI()

# 方式2：直接传入 API Key
# client = OpenAI(api_key="your-key-here")

# 调用 ChatCompletion API
response = client.chat.completions.create(
    model="gpt-4",  # 模型选择
    messages=[
        # 系统消息：设定 AI 的角色和行为
        {"role": "system", "content": "你是一个专业的技术文档写手"},
        
        # 用户消息：用户输入
        {"role": "user", "content": "解释什么是 API"}
    ],
    temperature=0.7,      # 控制随机性（0-2）
    max_tokens=500,       # 最大输出 token 数
    top_p=0.9,           # 核采样参数
    frequency_penalty=0,  # 频率惩罚（-2 到 2）
    presence_penalty=0    # 存在惩罚（-2 到 2）
)

# 提取回复内容
content = response.choices[0].message.content
print(content)

# 查看 token 使用情况
print(f"Prompt tokens: {response.usage.prompt_tokens}")
print(f"Completion tokens: {response.usage.completion_tokens}")
print(f"Total tokens: {response.usage.total_tokens}")
```

**流式输出**：

```python
# 流式输出（逐字输出，提升用户体验）
stream = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "写一首关于春天的诗"}],
    stream=True  # 开启流式输出
)

# 逐块读取并打印
for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

### Claude API

**申请 API Key**：

1. 访问 https://www.anthropic.com/
2. 注册账号并登录
3. 进入 API 页面
4. 创建 API Key

**安装 SDK**：

```bash
pip install anthropic
```

**基础调用示例**：

```python
# 导入库
from anthropic import Anthropic
import os

# 创建客户端（需要设置 ANTHROPIC_API_KEY 环境变量）
client = Anthropic()

# 调用 Claude API
message = client.messages.create(
    model="claude-3-opus-20240229",  # 模型选择
    max_tokens=1000,                  # 最大输出 token
    temperature=0.7,                  # 控制随机性
    system="你是一个友好的助手",       # 系统提示
    messages=[
        {"role": "user", "content": "你好，介绍一下自己"}
    ]
)

# 提取回复内容
print(message.content[0].text)

# 查看 token 使用
print(f"Input tokens: {message.usage.input_tokens}")
print(f"Output tokens: {message.usage.output_tokens}")
```

**Claude 特点**：

- 支持超长上下文（最高 200K tokens）
- 安全性更好，拒绝有害请求
- 中文理解能力一般
- 价格相对便宜

### 国产大模型

#### 文心一言（百度）

**申请 API Key**：

1. 访问 https://cloud.baidu.com/
2. 注册百度智能云账号
3. 创建文心一言应用
4. 获取 API Key 和 Secret Key

**安装 SDK**：

```bash
pip install qianfan
```

**基础调用示例**：

```python
# 导入库
import qianfan
import os

# 设置环境变量
# export QIANFAN_ACCESS_KEY="your-access-key"
# export QIANFAN_SECRET_KEY="your-secret-key"

# 创建客户端
client = qianfan.ChatCompletion()

# 调用文心一言
response = client.do(
    model="ERNIE-Bot-4",  # 模型选择
    messages=[
        {"role": "user", "content": "写一首关于月亮的诗"}
    ],
    temperature=0.8,
    max_output_tokens=500
)

# 提取回复
print(response["body"]["result"])
```

#### 通义千问（阿里）

**申请 API Key**：

1. 访问 https://www.aliyun.com/
2. 注册阿里云账号
3. 开通通义千问服务
4. 获取 API Key

**安装 SDK**：

```bash
pip install dashscope
```

**基础调用示例**：

```python
# 导入库
from dashscope import Generation
import os

# 设置环境变量
# export DASHSCOPE_API_KEY="your-api-key"

# 调用通义千问
response = Generation.call(
    model="qwen-max",  # 模型选择
    messages=[
        {"role": "system", "content": "你是一个专业的翻译"},
        {"role": "user", "content": "将'Hello World'翻译成中文"}
    ],
    temperature=0.7,
    max_tokens=500,
    result_format="message"  # 返回格式
)

# 提取回复
if response.status_code == 200:
    print(response.output.choices[0].message.content)
else:
    print(f"Error: {response.message}")
```

---

## 4 进阶用法

### 统一封装多模型调用

```python
from openai import OpenAI
from anthropic import Anthropic
import qianfan
from dashscope import Generation

class LLMClient:
    """统一的大模型调用客户端"""
    
    def __init__(self, provider="openai"):
        """
        初始化客户端
        
        Args:
            provider: 模型提供商（openai/claude/ernie/qwen）
        """
        self.provider = provider
        
        # 根据提供商初始化客户端
        if provider == "openai":
            self.client = OpenAI()
        elif provider == "claude":
            self.client = Anthropic()
        elif provider == "ernie":
            self.client = qianfan.ChatCompletion()
        elif provider == "qwen":
            pass  # 通义千问不需要客户端实例
    
    def chat(self, messages, temperature=0.7, max_tokens=500):
        """
        统一的聊天接口
        
        Args:
            messages: 消息列表
            temperature: 温度参数
            max_tokens: 最大输出 token
        
        Returns:
            模型回复文本
        """
        if self.provider == "openai":
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        
        elif self.provider == "claude":
            # 提取系统消息
            system = ""
            user_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    system = msg["content"]
                else:
                    user_messages.append(msg)
            
            response = self.client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=user_messages
            )
            return response.content[0].text
        
        elif self.provider == "ernie":
            response = self.client.do(
                model="ERNIE-Bot-4",
                messages=messages,
                temperature=temperature,
                max_output_tokens=max_tokens
            )
            return response["body"]["result"]
        
        elif self.provider == "qwen":
            response = Generation.call(
                model="qwen-max",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                result_format="message"
            )
            if response.status_code == 200:
                return response.output.choices[0].message.content
            else:
                raise Exception(f"Error: {response.message}")

# 使用示例
client = LLMClient(provider="openai")
response = client.chat([
    {"role": "system", "content": "你是一个友好的助手"},
    {"role": "user", "content": "你好"}
])
print(response)
```

### 错误处理与重试

```python
import time
from tenacity import retry, stop_after_attempt, wait_exponential

class RobustLLMClient(LLMClient):
    """带错误处理的健壮客户端"""
    
    @retry(
        stop=stop_after_attempt(3),  # 最多重试3次
        wait=wait_exponential(multiplier=1, min=2, max=10)  # 指数退避
    )
    def chat_with_retry(self, messages, **kwargs):
        """带重试的聊天接口"""
        try:
            return self.chat(messages, **kwargs)
        except Exception as e:
            print(f"Error: {e}, retrying...")
            raise

# 使用
client = RobustLLMClient(provider="openai")
response = client.chat_with_retry([
    {"role": "user", "content": "你好"}
])
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| API Key 管理 | 使用环境变量存储，不要硬编码在代码中 |
| 模型选择 | 根据任务复杂度、成本、语言要求选择 |
| Temperature | 控制输出随机性，0=确定性，2=非常随机 |
| 流式输出 | 提升用户体验，逐字输出响应 |
| 错误处理 | 使用重试机制应对网络波动和限流 |
| 成本控制 | 监控 token 使用，选择合适的模型 |

---

## 6 新手常见误区

### 误区 1："API Key 可以直接写在代码里"

**错！** API Key 是敏感信息，应该：
- 使用环境变量存储
- 不要提交到 Git 仓库
- 定期轮换 Key
- 设置使用限额

```python
# ❌ 错误做法
client = OpenAI(api_key="sk-xxx")

# ✅ 正确做法
import os
client = OpenAI()  # 从环境变量读取
```

### 误区 2："所有模型都一样，随便选一个"

不对。不同模型有各自的优势：
- GPT-4：复杂推理、代码生成
- Claude：长文本处理、安全性
- 文心一言：中文内容创作
- 通义千问：成本敏感场景

### 误区 3："Temperature 越高越好"

不是的。Temperature 的选择取决于任务：
- **创意写作**：0.7-0.9（更随机、更有创意）
- **事实问答**：0.3-0.5（更确定、更准确）
- **代码生成**：0.2-0.4（更确定、更规范）

### 误区 4："不需要关心 token 消耗"

实际上：
- Token 消耗直接影响成本
- 长 Prompt 会快速耗尽额度
- 需要监控和优化 token 使用
- 考虑缓存机制减少重复调用

### 误区 5："流式输出只是视觉效果"

不对。流式输出的优势：
- **用户体验**：减少等待时间
- **实时反馈**：可以中途停止
- **资源优化**：不需要等待完整响应

---

## 7 动手练习

### 练习 1：基础练习 - 多模型调用

**任务**：分别调用 OpenAI、Claude、文心一言，让它们回答同一个问题，对比效果。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
from anthropic import Anthropic
import qianfan

# 问题
question = "用一句话解释什么是人工智能"

# OpenAI
openai_client = OpenAI()
openai_response = openai_client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": question}],
    temperature=0.7
)
print("OpenAI:", openai_response.choices[0].message.content)

# Claude
claude_client = Anthropic()
claude_response = claude_client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=100,
    messages=[{"role": "user", "content": question}]
)
print("\nClaude:", claude_response.content[0].text)

# 文心一言
ernie_client = qianfan.ChatCompletion()
ernie_response = ernie_client.do(
    model="ERNIE-Bot-4",
    messages=[{"role": "user", "content": question}]
)
print("\n文心一言:", ernie_response["body"]["result"])
```

</details>

### 练习 2：进阶练习 - 流式输出

**任务**：实现一个流式输出的聊天函数，逐字打印模型的回复。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI

def stream_chat(prompt):
    """流式输出聊天"""
    client = OpenAI()
    
    stream = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )
    
    print("AI: ", end="", flush=True)
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            print(chunk.choices[0].delta.content, end="", flush=True)
    print()  # 换行

# 测试
stream_chat("写一个关于春天的短故事，100字以内")
```

</details>

### 练习 3（挑战）：综合练习 - 统一客户端

**任务**：实现一个统一的 LLM 客户端类，支持 OpenAI、Claude、文心一言，可以切换不同模型。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
from anthropic import Anthropic
import qianfan

class UnifiedLLMClient:
    """统一的大模型客户端"""
    
    def __init__(self, provider="openai"):
        self.provider = provider
        
        if provider == "openai":
            self.client = OpenAI()
        elif provider == "claude":
            self.client = Anthropic()
        elif provider == "ernie":
            self.client = qianfan.ChatCompletion()
    
    def chat(self, messages, temperature=0.7, max_tokens=500):
        """统一的聊天接口"""
        if self.provider == "openai":
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        
        elif self.provider == "claude":
            system = ""
            user_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    system = msg["content"]
                else:
                    user_messages.append(msg)
            
            response = self.client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=user_messages
            )
            return response.content[0].text
        
        elif self.provider == "ernie":
            response = self.client.do(
                model="ERNIE-Bob-4",
                messages=messages,
                temperature=temperature,
                max_output_tokens=max_tokens
            )
            return response["body"]["result"]

# 测试
client = UnifiedLLMClient(provider="openai")
response = client.chat([
    {"role": "system", "content": "你是一个友好的助手"},
    {"role": "user", "content": "你好"}
])
print(response)

# 切换到 Claude
client.provider = "claude"
response = client.chat([
    {"role": "user", "content": "你好"}
])
print(response)
```

</details>

---

## 下一章预告

下一章我们会学习 **Prompt 设计核心原则**——如何写出高质量的 Prompt。你会学到：

- Prompt 设计的基本原则
- 角色设定的技巧
- 如何控制输出格式
- Few-shot 示例的使用方法
- 常见错误和优化建议

掌握这些原则后，你就能写出更有效的 Prompt，获得更高质量的模型输出。
