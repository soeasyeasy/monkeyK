---
title: "第9章：Function Calling 与工具调用"
description: "函数调用机制、工具定义、参数提取、外部系统集成"
---

# 第9章：Function Calling 与工具调用

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Function Calling？
- 如何让模型调用外部函数？
- 如何定义工具接口？
- 如何处理函数调用结果？
- 如何集成外部 API？

这一章就是为了解答这些问题。我们会学习 **Function Calling 技术**，让模型能够调用外部工具和 API。

---

## 1 为什么需要 Function Calling？

### 痛点分析

**纯文本模型的局限**：

1. **无法执行操作**：只能生成文本，不能真正执行任务
2. **无法访问实时数据**：不知道当前天气、股价等
3. **无法与系统集成**：不能操作数据库、发送邮件等

**举个例子**：

```
❌ 没有 Function Calling：
用户：北京今天天气怎么样？
AI：抱歉，我无法获取实时天气信息...

✅ 有 Function Calling：
用户：北京今天天气怎么样？
AI：[调用天气 API]
AI：北京今天晴，25°C，空气质量良好
```

### 解决方案

> **一句话总结**：Function Calling 让模型能够调用外部函数，执行真实操作。

---

## 2 核心原理

### Function Calling 流程

```
用户提问
   ↓
模型判断是否需要调用函数
   ↓
返回函数名和参数
   ↓
程序执行函数
   ↓
将结果返回给模型
   ↓
模型生成最终回答
```

---

## 3 基础用法

### 基础 Function Calling

```python
from openai import OpenAI
import json

client = OpenAI()

# 定义函数
functions = [
    {
        "name": "get_weather",
        "description": "获取指定城市的天气信息",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称，如'北京'"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "温度单位"
                }
            },
            "required": ["city"]
        }
    }
]

# 实际的函数实现
def get_weather(city, unit="celsius"):
    """模拟天气 API"""
    weather_data = {
        "北京": {"temp": 25, "condition": "晴"},
        "上海": {"temp": 28, "condition": "多云"},
        "广州": {"temp": 30, "condition": "雨"}
    }
    
    if city in weather_data:
        data = weather_data[city]
        temp = data["temp"]
        if unit == "fahrenheit":
            temp = temp * 9/5 + 32
        return f"{city}：{data['condition']}，{temp}°{'C' if unit=='celsius' else 'F'}"
    return f"未找到{city}的天气信息"

# 调用模型
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "北京今天天气怎么样？"}
    ],
    functions=functions,
    function_call="auto"
)

message = response.choices[0].message

# 检查是否调用函数
if message.function_call:
    function_name = message.function_call.name
    function_args = json.loads(message.function_call.arguments)
    
    print(f"调用函数：{function_name}")
    print(f"参数：{function_args}")
    
    # 执行函数
    result = get_weather(**function_args)
    print(f"结果：{result}")
    
    # 将结果返回给模型
    messages = [
        {"role": "user", "content": "北京今天天气怎么样？"},
        {"role": "assistant", "content": None, "function_call": {
            "name": function_name,
            "arguments": message.function_call.arguments
        }},
        {"role": "function", "name": function_name, "content": result}
    ]
    
    # 获取最终回答
    final_response = client.chat.completions.create(
        model="gpt-4",
        messages=messages
    )
    
    print(f"\n最终回答：{final_response.choices[0].message.content}")
```

### 多函数调用

```python
functions = [
    {
        "name": "get_weather",
        "description": "获取天气",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string"}
            },
            "required": ["city"]
        }
    },
    {
        "name": "get_time",
        "description": "获取当前时间",
        "parameters": {
            "type": "object",
            "properties": {
                "timezone": {"type": "string"}
            },
            "required": []
        }
    },
    {
        "name": "search",
        "description": "搜索信息",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string"}
            },
            "required": ["query"]
        }
    }
]

def execute_function(name, args):
    """执行函数"""
    if name == "get_weather":
        return get_weather(**args)
    elif name == "get_time":
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    elif name == "search":
        return f"搜索结果：{args['query']}的相关信息"
    return "函数不存在"

# 使用
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "北京天气怎么样？现在几点了？"}],
    functions=functions,
    function_call="auto"
)

message = response.choices[0].message
if message.function_call:
    result = execute_function(
        message.function_call.name,
        json.loads(message.function_call.arguments)
    )
    print(result)
```

---

## 4 进阶用法

### 函数注册表

```python
class FunctionRegistry:
    """函数注册表"""
    
    def __init__(self):
        self.functions = {}
    
    def register(self, name, description, parameters, func):
        """注册函数"""
        self.functions[name] = {
            "description": description,
            "parameters": parameters,
            "func": func
        }
    
    def get_definitions(self):
        """获取函数定义列表"""
        return [
            {
                "name": name,
                "description": data["description"],
                "parameters": data["parameters"]
            }
            for name, data in self.functions.items()
        ]
    
    def call(self, name, **kwargs):
        """调用函数"""
        if name not in self.functions:
            raise ValueError(f"Function '{name}' not found")
        return self.functions[name]["func"](**kwargs)

# 使用
registry = FunctionRegistry()

# 注册函数
registry.register(
    name="get_weather",
    description="获取天气",
    parameters={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"]
    },
    func=lambda city: f"{city}：晴，25°C"
)

registry.register(
    name="calculate",
    description="计算数学表达式",
    parameters={
        "type": "object",
        "properties": {"expression": {"type": "string"}},
        "required": ["expression"]
    },
    func=lambda expression: str(eval(expression))
)

# 调用
definitions = registry.get_definitions()
print(definitions)

result = registry.call("calculate", expression="123 * 456")
print(result)
```

### 完整的 Agent

```python
class FunctionCallingAgent:
    """Function Calling Agent"""
    
    def __init__(self, registry):
        self.client = OpenAI()
        self.registry = registry
    
    def run(self, user_input, max_steps=5):
        """运行 Agent"""
        messages = [{"role": "user", "content": user_input}]
        
        for step in range(max_steps):
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                functions=self.registry.get_definitions(),
                function_call="auto"
            )
            
            message = response.choices[0].message
            
            # 如果没有函数调用，返回最终答案
            if not message.function_call:
                return message.content
            
            # 执行函数
            function_name = message.function_call.name
            function_args = json.loads(message.function_call.arguments)
            
            try:
                result = self.registry.call(function_name, **function_args)
            except Exception as e:
                result = f"Error: {e}"
            
            # 添加消息
            messages.append({
                "role": "assistant",
                "content": None,
                "function_call": {
                    "name": function_name,
                    "arguments": message.function_call.arguments
                }
            })
            messages.append({
                "role": "function",
                "name": function_name,
                "content": str(result)
            })
        
        return "达到最大步骤数"

# 使用
registry = FunctionRegistry()
registry.register(
    name="get_weather",
    description="获取天气",
    parameters={
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"]
    },
    func=lambda city: f"{city}：晴，25°C"
)

agent = FunctionCallingAgent(registry)
result = agent.run("北京天气怎么样？")
print(result)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Function Calling | 让模型调用外部函数 |
| 函数定义 | 描述函数名、参数、返回值 |
| 参数提取 | 模型自动提取参数 |
| 函数执行 | 程序执行函数并返回结果 |
| 多轮调用 | 支持连续调用多个函数 |

---

## 6 新手常见误区

### 误区 1："Function Calling 很复杂"

**错！** 本质就是：
- 定义函数接口
- 模型决定调用
- 执行并返回结果

### 误区 2："模型会自动执行函数"

不对。模型只返回函数名和参数，实际执行需要你的代码。

### 误区 3："不需要错误处理"

实际上：
- 函数可能执行失败
- 参数可能无效
- 需要完善的错误处理

---

## 7 动手练习

### 练习 1：基础练习 - 单函数调用

**任务**：实现一个天气查询的 Function Calling。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
import json

client = OpenAI()

functions = [{
    "name": "get_weather",
    "description": "获取天气",
    "parameters": {
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"]
    }
}]

def get_weather(city):
    return f"{city}：晴，25°C"

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "北京天气怎么样？"}],
    functions=functions,
    function_call="auto"
)

message = response.choices[0].message
if message.function_call:
    args = json.loads(message.function_call.arguments)
    result = get_weather(**args)
    print(result)
```

</details>

### 练习 2：进阶练习 - 多函数注册

**任务**：实现一个函数注册表，支持注册和调用多个函数。

<details>
<summary>点击查看答案</summary>

```python
class FunctionRegistry:
    def __init__(self):
        self.functions = {}
    
    def register(self, name, description, parameters, func):
        self.functions[name] = {
            "description": description,
            "parameters": parameters,
            "func": func
        }
    
    def get_definitions(self):
        return [
            {"name": n, "description": d["description"], "parameters": d["parameters"]}
            for n, d in self.functions.items()
        ]
    
    def call(self, name, **kwargs):
        return self.functions[name]["func"](**kwargs)

registry = FunctionRegistry()
registry.register("add", "加法", {"type": "object", "properties": {"a": {"type": "number"}, "b": {"type": "number"}}}, lambda a, b: a + b)
registry.register("multiply", "乘法", {"type": "object", "properties": {"a": {"type": "number"}, "b": {"type": "number"}}}, lambda a, b: a * b)

print(registry.call("add", a=5, b=3))
print(registry.call("multiply", a=4, b=6))
```

</details>

### 练习 3（挑战）：综合练习 - Agent 实现

**任务**：实现一个完整的 Function Calling Agent。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
import json

class Agent:
    def __init__(self, registry):
        self.client = OpenAI()
        self.registry = registry
    
    def run(self, query, max_steps=3):
        messages = [{"role": "user", "content": query}]
        
        for _ in range(max_steps):
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                functions=self.registry.get_definitions(),
                function_call="auto"
            )
            
            msg = response.choices[0].message
            
            if not msg.function_call:
                return msg.content
            
            name = msg.function_call.name
            args = json.loads(msg.function_call.arguments)
            result = self.registry.call(name, **args)
            
            messages.append(msg)
            messages.append({"role": "function", "name": name, "content": str(result)})
        
        return "达到最大步骤数"

registry = FunctionRegistry()
registry.register("get_time", "获取时间", {"type": "object", "properties": {}}, lambda: "2024-01-01 12:00:00")

agent = Agent(registry)
print(agent.run("现在几点了？"))
```

</details>

---

## 下一章预告

下一章我们会学习 **Agent 智能体开发**——如何构建能够自主决策和执行任务的 AI Agent。
