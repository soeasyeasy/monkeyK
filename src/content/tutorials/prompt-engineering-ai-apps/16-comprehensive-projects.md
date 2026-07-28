---
title: "第16章：综合实战项目"
description: "智能客服系统、知识库问答、代码助手、多模态应用实战"
---

# 第16章：综合实战项目

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何将前面学到的知识整合到真实项目中？
- 智能客服系统应该怎么设计？
- 知识库问答系统的核心是什么？
- 代码助手如何实现？
- 多模态应用有哪些可能性？

这一章就是为了解答这些问题。我们会通过 **4 个完整的实战项目**，将前面学到的所有知识整合，构建真实的 AI 应用。

---

## 1 项目一：智能客服系统

### 项目概述

构建一个能够回答用户问题、处理投诉、提供产品信息的智能客服系统。

### 核心功能

1. **意图识别**：识别用户是想咨询、投诉还是求助
2. **知识库检索**：从产品文档中检索答案
3. **多轮对话**：记住上下文，支持追问
4. **人工转接**：复杂问题转接人工客服

### 完整实现

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
import redis
import json

app = FastAPI()
client = AsyncOpenAI()
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# 知识库
knowledge_base = [
    {"question": "退货政策是什么？", "answer": "我们支持7天无理由退货..."},
    {"question": "如何修改订单？", "answer": "订单发出前可以修改..."},
    {"question": "配送时间多久？", "answer": "标准配送3-5个工作日..."},
]

# 初始化向量库
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_texts(
    [item["question"] for item in knowledge_base],
    embeddings,
    metadatas=[{"answer": item["answer"]} for item in knowledge_base]
)

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    intent: str
    needs_human: bool

async def identify_intent(message: str) -> str:
    """识别用户意图"""
    prompt = f"""请识别以下用户消息的意图：

消息：{message}

意图分类：
- consultation: 产品咨询
- complaint: 投诉
- help: 求助
- other: 其他

只输出意图分类："""
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    
    return response.choices[0].message.content.strip()

async def search_knowledge(message: str) -> str:
    """检索知识库"""
    docs = vectorstore.similarity_search(message, k=1)
    if docs:
        return docs[0].metadata["answer"]
    return ""

async def generate_response(message: str, intent: str, context: list) -> str:
    """生成回复"""
    knowledge = await search_knowledge(message)
    
    system_prompt = """你是一个专业的客服助手。请根据以下信息回复用户：

要求：
1. 语气友好、专业
2. 如果知识库中有答案，优先使用
3. 如果是投诉，先道歉再解决
4. 如果无法解决，说明会转接人工"""
    
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(context[-5:])  # 最近5轮对话
    
    user_content = f"用户消息：{message}\n"
    if knowledge:
        user_content += f"知识库答案：{knowledge}\n"
    user_content += f"用户意图：{intent}"
    
    messages.append({"role": "user", "content": user_content})
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        temperature=0.7
    )
    
    return response.choices[0].message.content

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """客服聊天接口"""
    # 获取历史对话
    history_key = f"chat_history:{request.session_id}"
    history = redis_client.lrange(history_key, 0, -1)
    context = [json.loads(msg) for msg in history]
    
    # 识别意图
    intent = await identify_intent(request.message)
    
    # 判断是否需要人工
    needs_human = intent == "complaint" or "人工" in request.message
    
    # 生成回复
    response_text = await generate_response(
        request.message, 
        intent, 
        context
    )
    
    # 更新历史
    context.append({"role": "user", "content": request.message})
    context.append({"role": "assistant", "content": response_text})
    
    redis_client.delete(history_key)
    for msg in context[-10:]:  # 保留最近10条
        redis_client.rpush(history_key, json.dumps(msg))
    redis_client.expire(history_key, 3600)  # 1小时过期
    
    return ChatResponse(
        response=response_text,
        intent=intent,
        needs_human=needs_human
    )

@app.post("/transfer/{session_id}")
async def transfer_to_human(session_id: str):
    """转接人工客服"""
    # 通知人工客服系统
    redis_client.rpush("human_queue", session_id)
    return {"status": "已转接人工客服"}
```

---

## 2 项目二：知识库问答系统

### 项目概述

构建一个基于企业文档的知识库问答系统，支持 PDF、Word、网页等多种格式。

### 核心功能

1. **文档加载**：支持多种格式
2. **智能切分**：保持语义完整性
3. **向量检索**：快速找到相关内容
4. **答案生成**：基于检索结果生成答案

### 完整实现

```python
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from langchain.document_loaders import PyPDFLoader, WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI
import os
import tempfile

app = FastAPI()

# 初始化组件
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings)
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", "。", "！", "？"]
)

class QueryRequest(BaseModel):
    question: str
    top_k: int = 3

class QueryResponse(BaseModel):
    answer: str
    sources: list

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """上传文档到知识库"""
    # 保存临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # 加载文档
        if file.filename.endswith('.pdf'):
            loader = PyPDFLoader(tmp_path)
        elif file.filename.endswith('.html'):
            loader = WebBaseLoader(f"file://{tmp_path}")
        else:
            raise HTTPException(status_code=400, detail="不支持的文件格式")
        
        documents = loader.load()
        
        # 切分文档
        chunks = text_splitter.split_documents(documents)
        
        # 添加到向量库
        vectorstore.add_documents(chunks)
        
        return {
            "status": "success",
            "chunks": len(chunks),
            "filename": file.filename
        }
    finally:
        os.unlink(tmp_path)

@app.post("/query", response_model=QueryResponse)
async def query_knowledge_base(request: QueryRequest):
    """查询知识库"""
    # 检索相关文档
    docs = vectorstore.similarity_search(request.question, k=request.top_k)
    
    if not docs:
        return QueryResponse(
            answer="抱歉，知识库中没有相关信息",
            sources=[]
        )
    
    # 构建上下文
    context = "\n\n".join([doc.page_content for doc in docs])
    
    # 生成答案
    prompt = f"""基于以下信息回答问题：

{context}

问题：{request.question}

要求：
1. 只基于提供的信息回答
2. 如果信息中没有答案，明确说明
3. 引用来源"""
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    
    answer = response.choices[0].message.content
    
    # 提取来源
    sources = [
        {
            "content": doc.page_content[:200],
            "metadata": doc.metadata
        }
        for doc in docs
    ]
    
    return QueryResponse(answer=answer, sources=sources)

@app.delete("/clear")
async def clear_knowledge_base():
    """清空知识库"""
    vectorstore.delete()
    return {"status": "cleared"}
```

---

## 3 项目三：代码助手

### 项目概述

构建一个能够帮助开发者写代码、审查代码、解释代码的 AI 助手。

### 核心功能

1. **代码生成**：根据描述生成代码
2. **代码审查**：找出问题和优化建议
3. **代码解释**：解释代码的功能
4. **Bug 修复**：定位并修复 bug

### 完整实现

```python
from fastapi import FastAPI
from pydantic import BaseModel
from openai import AsyncOpenAI

app = FastAPI()
client = AsyncOpenAI()

class CodeRequest(BaseModel):
    task: str  # generate, review, explain, fix
    input: str
    language: str = "python"

class CodeResponse(BaseModel):
    output: str
    explanation: str

async def generate_code(description: str, language: str) -> str:
    """生成代码"""
    prompt = f"""请根据以下描述生成{language}代码：

描述：{description}

要求：
1. 代码要完整可运行
2. 添加必要的注释
3. 遵循最佳实践
4. 包含错误处理

只输出代码："""
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    return response.choices[0].message.content

async def review_code(code: str, language: str) -> str:
    """审查代码"""
    prompt = f"""请审查以下{language}代码：

```{language}
{code}
```

请从以下角度审查：
1. 代码质量（可读性、可维护性）
2. 性能问题
3. 安全隐患
4. 最佳实践
5. 改进建议

输出格式：
## 总体评价
...

## 问题列表
1. ...

## 改进建议
1. ...

## 优化后的代码
```{language}
...
```"""
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    
    return response.choices[0].message.content

async def explain_code(code: str, language: str) -> str:
    """解释代码"""
    prompt = f"""请解释以下{language}代码的功能：

```{language}
{code}
```

请详细说明：
1. 代码的整体功能
2. 每个部分的作用
3. 关键逻辑
4. 可能的使用场景"""
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    
    return response.choices[0].message.content

async def fix_bug(code: str, error: str, language: str) -> str:
    """修复 bug"""
    prompt = f"""以下{language}代码有错误，请修复：

代码：
```{language}
{code}
```

错误信息：
{error}

请：
1. 分析错误原因
2. 提供修复后的代码
3. 解释修复方法"""
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    return response.choices[0].message.content

@app.post("/code", response_model=CodeResponse)
async def code_assistant(request: CodeRequest):
    """代码助手接口"""
    if request.task == "generate":
        output = await generate_code(request.input, request.language)
        explanation = "根据描述生成的代码"
    elif request.task == "review":
        output = await review_code(request.input, request.language)
        explanation = "代码审查结果"
    elif request.task == "explain":
        output = await explain_code(request.input, request.language)
        explanation = "代码解释"
    elif request.task == "fix":
        # input 格式：代码\n错误信息
        parts = request.input.split("\n", 1)
        code = parts[0]
        error = parts[1] if len(parts) > 1 else ""
        output = await fix_bug(code, error, request.language)
        explanation = "Bug 修复方案"
    else:
        raise HTTPException(status_code=400, detail="不支持的任务类型")
    
    return CodeResponse(output=output, explanation=explanation)
```

---

## 4 项目四：多模态应用

### 项目概述

构建一个支持文本、图片、语音的多模态 AI 应用。

### 核心功能

1. **图文理解**：分析图片内容
2. **语音转文本**：语音识别
3. **文本转语音**：语音合成
4. **多模态对话**：结合多种输入

### 完整实现

```python
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from openai import AsyncOpenAI
import base64
import io

app = FastAPI()
client = AsyncOpenAI()

class MultimodalRequest(BaseModel):
    text: str = ""
    image_url: str = ""
    audio_url: str = ""

class MultimodalResponse(BaseModel):
    text: str
    audio_url: str = ""

@app.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...), question: str = "描述这张图片"):
    """分析图片"""
    # 读取图片
    image_data = await image.read()
    base64_image = base64.b64encode(image_data).decode('utf-8')
    
    # 调用 GPT-4 Vision
    response = await client.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=500
    )
    
    return {"description": response.choices[0].message.content}

@app.post("/multimodal-chat", response_model=MultimodalResponse)
async def multimodal_chat(request: MultimodalRequest):
    """多模态对话"""
    messages = []
    
    # 构建用户消息
    user_content = []
    
    if request.text:
        user_content.append({"type": "text", "text": request.text})
    
    if request.image_url:
        user_content.append({
            "type": "image_url",
            "image_url": {"url": request.image_url}
        })
    
    messages.append({"role": "user", "content": user_content})
    
    # 调用模型
    response = await client.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=messages,
        max_tokens=500
    )
    
    text_response = response.choices[0].message.content
    
    # 可选：文本转语音
    audio_url = ""
    if request.text:  # 如果有文本输入，生成语音回复
        audio_response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text_response
        )
        
        # 保存音频（实际应该上传到云存储）
        audio_data = audio_response.content
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        audio_url = f"data:audio/mp3;base64,{audio_base64}"
    
    return MultimodalResponse(text=text_response, audio_url=audio_url)

@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    """语音转文本"""
    # 读取音频
    audio_data = await audio.read()
    
    # 调用 Whisper API
    response = await client.audio.transcriptions.create(
        model="whisper-1",
        file=io.BytesIO(audio_data)
    )
    
    return {"text": response.text}

@app.post("/text-to-speech")
async def text_to_speech(text: str, voice: str = "alloy"):
    """文本转语音"""
    response = await client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text
    )
    
    audio_data = response.content
    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
    
    return {
        "audio_url": f"data:audio/mp3;base64,{audio_base64}"
    }
```

---

## 5 项目部署与集成

### 统一入口

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 创建主应用
app = FastAPI(title="AI Applications Hub")

# 添加 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册子应用
from customer_service import app as customer_service_app
from knowledge_base import app as knowledge_base_app
from code_assistant import app as code_assistant_app
from multimodal import app as multimodal_app

app.mount("/customer-service", customer_service_app)
app.mount("/knowledge-base", knowledge_base_app)
app.mount("/code-assistant", code_assistant_app)
app.mount("/multimodal", multimodal_app)

@app.get("/")
async def root():
    return {
        "message": "AI Applications Hub",
        "applications": [
            {"name": "智能客服", "path": "/customer-service"},
            {"name": "知识库问答", "path": "/knowledge-base"},
            {"name": "代码助手", "path": "/code-assistant"},
            {"name": "多模态应用", "path": "/multimodal"}
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Docker Compose 部署

```yaml
version: '3.8'

services:
  ai-app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: always

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - ai-app

volumes:
  redis-data:
```

---

## 6 核心知识点总结

| 项目 | 核心技术 | 应用场景 |
|------|---------|---------|
| 智能客服 | 意图识别 + RAG + 多轮对话 | 电商、SaaS 客服 |
| 知识库问答 | 文档加载 + 向量检索 + 答案生成 | 企业内部知识库 |
| 代码助手 | Prompt 工程 + 代码分析 | 开发工具、IDE 插件 |
| 多模态应用 | Vision API + 语音 API | 内容审核、辅助工具 |

---

## 7 新手常见误区

### 误区 1："项目越大越好"

**错！** 应该：
- 从 MVP 开始
- 逐步迭代
- 关注核心功能

### 误区 2："不需要测试"

不对。AI 应用需要：
- 单元测试
- 集成测试
- 端到端测试
- 性能测试

### 误区 3："一次性完成所有功能"

实际上：
- 分阶段开发
- 先实现核心功能
- 根据反馈迭代

---

## 8 动手练习

### 练习 1：基础练习 - 智能客服

**任务**：实现一个简单的智能客服，能够回答产品相关问题。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from pydantic import BaseModel
from openai import AsyncOpenAI

app = FastAPI()
client = AsyncOpenAI()

class ChatRequest(BaseModel):
    message: str

knowledge_base = {
    "退货": "我们支持7天无理由退货",
    "配送": "标准配送3-5个工作日",
    "支付": "支持支付宝、微信支付"
}

@app.post("/chat")
async def chat(request: ChatRequest):
    # 简单关键词匹配
    for key, answer in knowledge_base.items():
        if key in request.message:
            return {"response": answer}
    
    # 调用 AI
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是一个客服助手"},
            {"role": "user", "content": request.message}
        ]
    )
    
    return {"response": response.choices[0].message.content}
```

</details>

### 练习 2：进阶练习 - 知识库问答

**任务**：实现一个简单的知识库问答系统。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from pydantic import BaseModel
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from openai import AsyncOpenAI

app = FastAPI()
client = AsyncOpenAI()
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings)

class QueryRequest(BaseModel):
    question: str

@app.post("/add")
async def add_knowledge(text: str):
    vectorstore.add_texts([text])
    return {"status": "added"}

@app.post("/query")
async def query(request: QueryRequest):
    docs = vectorstore.similarity_search(request.question, k=1)
    
    if not docs:
        return {"answer": "没有找到相关信息"}
    
    context = docs[0].page_content
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "user", "content": f"基于以下信息回答：{context}\n\n问题：{request.question}"}
        ]
    )
    
    return {"answer": response.choices[0].message.content}
```

</details>

### 练习 3（挑战）：综合练习 - 代码助手

**任务**：实现一个能够生成、审查、解释代码的助手。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from pydantic import BaseModel
from openai import AsyncOpenAI

app = FastAPI()
client = AsyncOpenAI()

class CodeRequest(BaseModel):
    task: str  # generate, review, explain
    input: str
    language: str = "python"

@app.post("/code")
async def code_assistant(request: CodeRequest):
    if request.task == "generate":
        prompt = f"生成{request.language}代码：{request.input}"
    elif request.task == "review":
        prompt = f"审查代码：\n```{request.language}\n{request.input}\n```"
    elif request.task == "explain":
        prompt = f"解释代码：\n```{request.language}\n{request.input}\n```"
    else:
        return {"error": "不支持的任务类型"}
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {"output": response.choices[0].message.content}
```

</details>

---

## 教程总结

恭喜你完成了《Prompt 工程与 AI 应用开发》教程！

### 你学到了什么

1. **Prompt 工程基础**：API 调用、设计原则、进阶技巧
2. **工程化实践**：模板管理、版本控制、A/B 测试
3. **核心技术**：结构化输出、对话系统、RAG、Function Calling
4. **Agent 开发**：ReAct 模式、任务规划、多 Agent 协作
5. **框架实战**：LangChain、LlamaIndex
6. **前后端集成**：流式响应、状态管理
7. **部署运维**：Docker、监控、成本控制
8. **综合项目**：智能客服、知识库、代码助手、多模态应用

### 下一步建议

1. **深入学习**：选择一个方向深入研究（如 Agent、RAG）
2. **实战项目**：构建自己的 AI 应用
3. **关注前沿**：跟踪最新的 AI 技术发展
4. **社区参与**：加入 AI 开发者社区，分享经验

祝你在 AI 应用开发的道路上越走越远！
