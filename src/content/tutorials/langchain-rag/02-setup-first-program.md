---
title: "第02章：环境搭建与第一个 LangChain 程序"
description: "安装配置 LangChain 环境，配置 API Key，编写第一个 LangChain 应用"
---

# 第02章：环境搭建与第一个 LangChain 程序

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何安装 LangChain？需要哪些依赖？
- API Key 怎么获取？如何安全地管理密钥？
- 第一个 LangChain 程序应该怎么写？
- 如何测试环境是否配置正确？

这一章就是为了解答这些问题。我们会先搭建开发环境，配置 API Key，然后写出你的第一个 LangChain 程序。

---

## 1 为什么需要环境搭建？

### 痛点分析

很多新手在开始学习 LangChain 时，会遇到这些问题：

**问题 1：Python 版本混乱**

```bash
# ❌ 系统有多个 Python 版本，不知道用哪个
python --version  # Python 2.7.18
python3 --version  # Python 3.8.10
# 项目要求 Python 3.9+，但不知道如何切换
```

**问题 2：依赖冲突**

```bash
# ❌ 直接安装，导致依赖冲突
pip install langchain
# 报错：Requirement already satisfied，版本不对
```

**问题 3：API Key 泄露**

```python
# ❌ 直接把 API Key 写在代码里
import os
os.environ["OPENAI_API_KEY"] = "sk-xxx"  # 提交到 GitHub，密钥泄露
```

### 解决方案

正确的环境搭建流程应该是：

1. **使用虚拟环境**：隔离项目依赖，避免冲突
2. **使用 .env 文件**：安全地管理 API Key
3. **使用 requirements.txt**：记录依赖版本，方便复现

打个比方：

> **环境搭建就像装修房子**：
> - 虚拟环境 = 独立的房间，每个项目有自己的空间
> - .env 文件 = 保险箱，安全存放密钥
> - requirements.txt = 装修清单，记录需要什么材料

---

## 2 环境准备

### 2.1 安装 Python

LangChain 需要 Python 3.9 或更高版本。

**检查 Python 版本**：

```bash
python --version
# 或者
python3 --version
```

如果版本低于 3.9，需要升级 Python。

**推荐安装方式**：

- **Windows**：从 [python.org](https://www.python.org/downloads/) 下载安装包
- **macOS**：使用 Homebrew 安装 `brew install python@3.11`
- **Linux**：使用包管理器安装 `sudo apt install python3.11`

### 2.2 创建虚拟环境

虚拟环境可以隔离项目依赖，避免不同项目之间的冲突。

**创建虚拟环境**：

```bash
# 进入项目目录
cd my-langchain-project

# 创建虚拟环境（推荐使用 venv）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

激活后，命令行前面会出现 `(venv)` 标识。

> **原理**：虚拟环境会创建一个独立的 Python 环境，所有安装的包都会放在这个环境里，不会影响系统的 Python。

### 2.3 安装 LangChain

**安装核心包**：

```bash
pip install langchain
```

**安装常用集成包**：

```bash
# OpenAI 集成
pip install langchain-openai

# 社区集成包（包含各种工具）
pip install langchain-community

# 向量数据库
pip install faiss-cpu  # 或者 chromadb

# 文档加载器
pip install pypdf  # PDF 加载
pip install python-docx  # Word 加载
```

**一键安装所有依赖**：

```bash
pip install langchain langchain-openai langchain-community faiss-cpu pypdf python-dotenv
```

### 2.4 创建 requirements.txt

记录项目依赖，方便复现环境。

```bash
# 导出当前环境的依赖
pip freeze > requirements.txt
```

**requirements.txt 示例**：

```txt
langchain==0.1.0
langchain-openai==0.0.5
langchain-community==0.0.10
faiss-cpu==1.7.4
pypdf==3.17.4
python-dotenv==1.0.0
```

**从 requirements.txt 安装依赖**：

```bash
pip install -r requirements.txt
```

---

## 3 API Key 配置

### 3.1 获取 API Key

**OpenAI API Key**：

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册/登录账号
3. 进入 API Keys 页面
4. 点击 "Create new secret key"
5. 复制生成的 Key（以 `sk-` 开头）

**国内替代方案**：

如果无法访问 OpenAI，可以使用国内的大模型：

- **智谱 AI**：[open.bigmodel.cn](https://open.bigmodel.cn/)
- **文心一言**：[yiyan.baidu.com](https://yiyan.baidu.com/)
- **通义千问**：[tongyi.aliyun.com](https://tongyi.aliyun.com/)
- **讯飞星火**：[xinghuo.xfyun.cn](https://xinghuo.xfyun.cn/)

### 3.2 安全存储 API Key

**❌ 错误做法：直接写在代码里**

```python
# ❌ 不要这样做
import os
os.environ["OPENAI_API_KEY"] = "sk-xxx"  # 提交到 GitHub 会泄露
```

**✅ 正确做法：使用 .env 文件**

1. **创建 .env 文件**：

```bash
# 在项目根目录创建 .env 文件
touch .env
```

2. **编辑 .env 文件**：

```env
OPENAI_API_KEY=sk-xxx
OPENAI_API_BASE=https://api.openai.com/v1  # 可选：自定义 API 端点
```

3. **添加到 .gitignore**：

```bash
# .gitignore
.env
```

4. **在代码中加载**：

```python
# 安装 python-dotenv
# pip install python-dotenv

from dotenv import load_dotenv
import os

# 加载 .env 文件
load_dotenv()

# 获取 API Key
api_key = os.getenv("OPENAI_API_KEY")
print(f"API Key: {api_key[:10]}...")  # 只打印前 10 位，保护隐私
```

---

## 4 第一个 LangChain 程序

### 4.1 Hello World 示例

让我们写一个简单的 LangChain 程序，调用 ChatGPT 回答问题。

**完整代码**：

```python
# 导入必要的库
from dotenv import load_dotenv  # 加载环境变量
from langchain_openai import ChatOpenAI  # 导入 ChatOpenAI 模型
from langchain_core.messages import HumanMessage, SystemMessage  # 导入消息类型

# 加载 .env 文件中的环境变量
load_dotenv()

# 创建 ChatOpenAI 实例
# temperature=0 表示输出更确定，适合问答场景
# model_name 指定使用的模型
llm = ChatOpenAI(
    temperature=0,  # 温度参数，0-2，越高越随机
    model_name="gpt-3.5-turbo"  # 使用的模型
)

# 构建消息列表
# SystemMessage：系统消息，设置模型的行为
# HumanMessage：用户消息，用户的问题
messages = [
    SystemMessage(content="你是一个友好的 AI 助手，请用中文回答问题。"),
    HumanMessage(content="什么是 LangChain？")
]

# 调用模型，获取响应
response = llm.invoke(messages)

# 打印结果
print("用户：什么是 LangChain？")
print(f"AI：{response.content}")
```

**代码解释**：

1. **加载环境变量**：使用 `load_dotenv()` 加载 `.env` 文件中的 API Key
2. **创建模型实例**：使用 `ChatOpenAI` 创建 ChatGPT 实例
3. **构建消息**：使用 `SystemMessage` 和 `HumanMessage` 构建对话
4. **调用模型**：使用 `invoke()` 方法调用模型
5. **获取结果**：从 `response.content` 获取模型的输出

> **原理**：LangChain 把 OpenAI 的 API 封装成了统一的接口，让你可以方便地调用大模型。

### 4.2 使用 Prompt Template

Prompt Template 可以让你更方便地构建提示词。

```python
from langchain_core.prompts import ChatPromptTemplate

# 创建 Prompt 模板
# {topic} 是变量，会在运行时替换
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的技术讲师，请用通俗易懂的语言解释 {topic}。"),
    ("human", "请解释一下 {topic}")
])

# 格式化 Prompt
formatted_prompt = prompt.format(topic="LangChain")
print("格式化后的 Prompt：")
print(formatted_prompt)

# 使用 Prompt 调用模型
messages = prompt.format_messages(topic="LangChain")
response = llm.invoke(messages)
print(f"\nAI 回答：{response.content}")
```

**代码解释**：

1. **创建模板**：使用 `ChatPromptTemplate.from_messages()` 创建模板
2. **定义变量**：使用 `{topic}` 定义变量
3. **格式化**：使用 `format()` 或 `format_messages()` 替换变量
4. **调用模型**：把格式化后的消息传给模型

> **原理**：Prompt Template 让你可以复用 Prompt 结构，只需要替换变量即可。

### 4.3 使用 Chain 串联组件

Chain 可以把多个组件串联起来，形成完整的工作流。

```python
from langchain_core.output_parsers import StrOutputParser

# 创建组件
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的技术讲师"),
    ("human", "请解释一下 {topic}")
])
llm = ChatOpenAI(temperature=0, model_name="gpt-3.5-turbo")
output_parser = StrOutputParser()  # 字符串输出解析器

# 创建 Chain
# 使用 | 操作符串联组件
chain = prompt | llm | output_parser

# 调用 Chain
result = chain.invoke({"topic": "LangChain"})
print(f"结果：{result}")
```

**代码解释**：

1. **创建组件**：分别创建 Prompt、LLM、Output Parser
2. **串联组件**：使用 `|` 操作符把组件串联起来
3. **调用 Chain**：使用 `invoke()` 方法调用，传入变量

> **原理**：Chain 的工作流程是：Prompt 格式化 → LLM 生成 → Output Parser 解析。

### 4.4 流式输出

如果你希望实时看到模型的输出，可以使用流式输出。

```python
# 流式输出
print("AI：", end="")
for chunk in llm.stream(messages):
    print(chunk.content, end="", flush=True)
print()  # 换行
```

**代码解释**：

1. **使用 stream()**：使用 `stream()` 方法代替 `invoke()`
2. **逐块输出**：遍历每个 chunk，实时打印内容

> **原理**：流式输出可以让你在模型生成过程中实时看到结果，提升用户体验。

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **虚拟环境** | 隔离项目依赖，避免冲突，使用 `python -m venv venv` 创建 |
| **API Key 管理** | 使用 `.env` 文件存储，不要硬编码在代码里 |
| **ChatOpenAI** | LangChain 封装的 ChatGPT 接口，支持多种模型 |
| **Prompt Template** | 提示词模板，可以复用 Prompt 结构 |
| **Chain** | 链式调用，把多个组件串联起来 |
| **流式输出** | 使用 `stream()` 方法实时输出，提升用户体验 |

---

## 6 新手常见误区

### 误区 1："直接把 API Key 写在代码里"

**错！** 这样做会导致密钥泄露，可能被他人盗用。

正确做法：使用 `.env` 文件存储 API Key，并添加到 `.gitignore`。

### 误区 2："不使用虚拟环境"

**错！** 直接在全局环境安装依赖，会导致不同项目之间的依赖冲突。

正确做法：每个项目都使用独立的虚拟环境。

### 误区 3："temperature 设置过高"

**错！** temperature 越高，输出越随机，可能导致回答不准确。

正确做法：
- 问答场景：temperature=0 或 0.2
- 创意写作：temperature=0.7-1.0
- 头脑风暴：temperature=1.5-2.0

### 误区 4："不记录依赖版本"

**错！** 不记录依赖版本，会导致在其他机器上无法复现环境。

正确做法：使用 `pip freeze > requirements.txt` 记录依赖版本。

### 误区 5："忽略 API 调用限制"

**错！** OpenAI API 有调用限制，频繁调用会被限流。

正确做法：
- 添加重试机制
- 使用缓存减少调用
- 监控 API 使用量

---

## 7 动手练习

### 练习 1：基础练习

**题目**：创建一个 LangChain 程序，调用 ChatGPT 回答"什么是 Python？"

<details>
<summary>点击查看答案</summary>

```python
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# 加载环境变量
load_dotenv()

# 创建模型实例
llm = ChatOpenAI(temperature=0, model_name="gpt-3.5-turbo")

# 构建消息
messages = [
    SystemMessage(content="你是一个友好的 AI 助手"),
    HumanMessage(content="什么是 Python？")
]

# 调用模型
response = llm.invoke(messages)
print(f"AI：{response.content}")
```

</details>

### 练习 2：进阶练习

**题目**：使用 Prompt Template，创建一个可以解释任意技术概念的程序。

<details>
<summary>点击查看答案</summary>

```python
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 加载环境变量
load_dotenv()

# 创建组件
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的技术讲师，请用通俗易懂的语言解释技术概念。"),
    ("human", "请解释一下 {concept}")
])
llm = ChatOpenAI(temperature=0, model_name="gpt-3.5-turbo")
output_parser = StrOutputParser()

# 创建 Chain
chain = prompt | llm | output_parser

# 调用 Chain
concept = input("请输入你想了解的技术概念：")
result = chain.invoke({"concept": concept})
print(f"\n{result}")
```

</details>

### 练习 3（挑战）：综合练习

**题目**：创建一个多轮对话程序，能够记住对话历史。

<details>
<summary>点击查看答案</summary>

```python
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# 加载环境变量
load_dotenv()

# 创建模型实例
llm = ChatOpenAI(temperature=0, model_name="gpt-3.5-turbo")

# 对话历史
chat_history = [
    SystemMessage(content="你是一个友好的 AI 助手，请记住之前的对话内容。")
]

# 多轮对话
while True:
    # 获取用户输入
    user_input = input("你：")
    
    # 退出条件
    if user_input.lower() in ["exit", "quit", "退出"]:
        print("AI：再见！")
        break
    
    # 添加用户消息到历史
    chat_history.append(HumanMessage(content=user_input))
    
    # 调用模型
    response = llm.invoke(chat_history)
    
    # 添加 AI 回复到历史
    chat_history.append(AIMessage(content=response.content))
    
    # 打印 AI 回复
    print(f"AI：{response.content}\n")
```

</details>

---

## 下一章预告

下一章我们会学习 **LLM 与 Chat Model 核心概念**——也就是大语言模型和聊天模型的区别、模型调用方式、以及如何选择合适的模型。你会学到如何调用不同的大模型、如何设置模型参数、以及如何优化模型输出。
