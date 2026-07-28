---
title: "第6章：结构化输出与格式控制"
description: "JSON 模式、函数调用、Schema 约束、输出解析与验证"
---

# 第6章：结构化输出与格式控制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何让模型输出 JSON 格式的数据？
- 什么是 Function Calling？怎么使用？
- 如何确保输出符合预定义的 Schema？
- 如何解析和验证模型的输出？
- 输出格式错误时怎么处理？

这一章就是为了解答这些问题。我们会学习 **结构化输出的技术**，让模型输出可控、可解析的数据。

---

## 1 为什么需要结构化输出？

### 痛点分析

**纯文本输出的问题**：

1. **难以解析**：需要复杂的正则表达式或 NLP
2. **格式不稳定**：同样的 Prompt 可能输出不同格式
3. **无法直接用于程序**：需要额外的转换步骤
4. **错误处理困难**：格式错误难以发现

**举个例子**：

```
❌ 纯文本输出：
"用户张三，年龄25岁，来自北京"

问题：
- 难以提取姓名、年龄、城市
- 格式不统一
- 需要正则表达式解析

✅ 结构化输出：
{
    "name": "张三",
    "age": 25,
    "city": "北京"
}

优势：
- 直接解析使用
- 格式统一
- 类型安全
```

### 解决方案

> **一句话总结**：结构化输出让模型返回 JSON、表格等格式，便于程序解析和使用。

---

## 2 核心原理

### 结构化输出方式

```
┌─────────────────────────────────────┐
│  1. JSON 模式                        │
│  2. Function Calling                 │
│  3. Schema 约束                      │
│  4. 输出解析与验证                   │
└─────────────────────────────────────┘
```

---

## 3 基础用法

### JSON 模式

```python
from openai import OpenAI
import json

client = OpenAI()

# 使用 JSON 模式
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "system",
            "content": "你是一个数据提取助手，总是以 JSON 格式输出"
        },
        {
            "role": "user",
            "content": """从以下文本中提取信息：

"张三今年25岁，来自北京，是一名软件工程师"

请以 JSON 格式输出，包含以下字段：
{
    "name": "姓名",
    "age": 年龄（数字）,
    "city": "城市",
    "occupation": "职业"
}"""
        }
    ],
    response_format={"type": "json_object"}  # 启用 JSON 模式
)

# 解析 JSON
result = json.loads(response.choices[0].message.content)
print(result)
# 输出：{'name': '张三', 'age': 25, 'city': '北京', 'occupation': '软件工程师'}
```

### Function Calling

```python
import json

# 定义函数
functions = [
    {
        "name": "get_weather",
        "description": "获取指定城市的天气",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称"
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

# 调用模型
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "北京今天天气怎么样？"}
    ],
    functions=functions,
    function_call="auto"  # 自动决定是否调用函数
)

# 检查是否调用函数
message = response.choices[0].message

if message.function_call:
    function_name = message.function_call.name
    function_args = json.loads(message.function_call.arguments)
    
    print(f"调用函数：{function_name}")
    print(f"参数：{function_args}")
    
    # 执行函数
    if function_name == "get_weather":
        result = get_weather(**function_args)
        print(f"结果：{result}")
```

### Schema 约束

```python
from pydantic import BaseModel, Field
from typing import Optional

# 定义 Schema
class UserInfo(BaseModel):
    name: str = Field(description="用户姓名")
    age: int = Field(description="年龄", ge=0, le=150)
    city: str = Field(description="城市")
    occupation: Optional[str] = Field(default=None, description="职业")

# 使用 Schema 约束
def extract_user_info(text: str) -> UserInfo:
    prompt = f"""从以下文本中提取用户信息：

{text}

请以 JSON 格式输出，严格遵循以下 Schema：
{{
    "name": "string",
    "age": "number (0-150)",
    "city": "string",
    "occupation": "string | null"
}}"""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    data = json.loads(response.choices[0].message.content)
    
    # 使用 Pydantic 验证
    return UserInfo(**data)

# 使用
user = extract_user_info("张三今年25岁，来自北京，是一名软件工程师")
print(user.name)  # 张三
print(user.age)   # 25
```

### 输出解析与验证

```python
import json
from typing import Any, Dict

class OutputParser:
    """输出解析器"""
    
    def __init__(self, schema: Dict[str, Any]):
        self.schema = schema
    
    def parse(self, text: str) -> Dict[str, Any]:
        """解析 JSON 输出"""
        try:
            # 尝试提取 JSON
            data = self._extract_json(text)
            
            # 验证 Schema
            self._validate(data)
            
            return data
        except Exception as e:
            raise ValueError(f"Parse error: {e}")
    
    def _extract_json(self, text: str) -> Dict[str, Any]:
        """从文本中提取 JSON"""
        # 尝试直接解析
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # 尝试提取 JSON 块
        import re
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        raise ValueError("No valid JSON found")
    
    def _validate(self, data: Dict[str, Any]):
        """验证 Schema"""
        for key, expected_type in self.schema.items():
            if key not in data:
                raise ValueError(f"Missing field: {key}")
            
            if not isinstance(data[key], expected_type):
                raise ValueError(
                    f"Field '{key}' should be {expected_type.__name__}, "
                    f"got {type(data[key]).__name__}"
                )

# 使用示例
parser = OutputParser({
    "name": str,
    "age": int,
    "city": str
})

text = """用户信息如下：
{
    "name": "张三",
    "age": 25,
    "city": "北京"
}
"""

data = parser.parse(text)
print(data)
```

---

## 4 进阶用法

### 批量结构化提取

```python
def batch_extract(texts: list, schema: dict) -> list:
    """批量提取结构化信息"""
    results = []
    
    for text in texts:
        try:
            prompt = f"""从以下文本中提取信息：

{text}

输出格式：{json.dumps(schema, ensure_ascii=False)}"""
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            data = json.loads(response.choices[0].message.content)
            results.append({"success": True, "data": data})
        except Exception as e:
            results.append({"success": False, "error": str(e)})
    
    return results

# 使用
texts = [
    "张三，25岁，北京",
    "李四，30岁，上海",
    "王五，28岁，广州"
]

schema = {"name": "string", "age": "number", "city": "string"}
results = batch_extract(texts, schema)

for r in results:
    if r["success"]:
        print(r["data"])
    else:
        print(f"Error: {r['error']}")
```

### 动态 Function Calling

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
        """获取函数定义"""
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

# 注册函数
registry = FunctionRegistry()

registry.register(
    name="get_weather",
    description="获取天气",
    parameters={
        "type": "object",
        "properties": {
            "city": {"type": "string"}
        },
        "required": ["city"]
    },
    func=lambda city: f"{city}：晴，25°C"
)

registry.register(
    name="calculate",
    description="计算数学表达式",
    parameters={
        "type": "object",
        "properties": {
            "expression": {"type": "string"}
        },
        "required": ["expression"]
    },
    func=lambda expression: str(eval(expression))
)

# 使用
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "北京天气怎么样？然后计算 123 * 456"}],
    functions=registry.get_definitions(),
    function_call="auto"
)

# 处理函数调用
message = response.choices[0].message
if message.function_call:
    result = registry.call(
        message.function_call.name,
        **json.loads(message.function_call.arguments)
    )
    print(f"结果：{result}")
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| JSON 模式 | 使用 `response_format={"type": "json_object"}` |
| Function Calling | 定义函数，让模型决定调用 |
| Schema 约束 | 使用 Pydantic 等工具验证输出 |
| 输出解析 | 提取 JSON，处理格式错误 |
| 批量处理 | 循环处理多个文本 |

---

## 6 新手常见误区

### 误区 1："JSON 模式总是有效"

**错！** JSON 模式可能失败：
- Prompt 不够明确
- 模型理解错误
- 需要重试机制

### 误区 2："Function Calling 很复杂"

不对。Function Calling 的本质：
- 定义函数接口
- 让模型决定调用哪个函数
- 执行函数并返回结果

### 误区 3："不需要验证输出"

实际上：
- 模型可能输出格式错误
- 类型可能不匹配
- 必须验证和错误处理

---

## 7 动手练习

### 练习 1：基础练习 - JSON 提取

**任务**：使用 JSON 模式从文本中提取产品信息。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
import json

client = OpenAI()

def extract_product_info(text):
    prompt = f"""从以下文本中提取产品信息：

{text}

输出 JSON 格式：
{{
    "name": "产品名称",
    "price": 价格（数字）,
    "category": "分类"
}}"""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)

# 测试
text = "iPhone 15 Pro，售价7999元，属于智能手机"
result = extract_product_info(text)
print(result)
```

</details>

### 练习 2：进阶练习 - Function Calling

**任务**：实现一个支持多个函数的 Function Calling 系统。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
import json

client = OpenAI()

functions = [
    {
        "name": "get_weather",
        "description": "获取天气",
        "parameters": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"]
        }
    },
    {
        "name": "search",
        "description": "搜索信息",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"]
        }
    }
]

def execute_function(name, args):
    if name == "get_weather":
        return f"{args['city']}：晴，25°C"
    elif name == "search":
        return f"搜索结果：{args['query']}的相关信息"

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "北京天气怎么样？"}],
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

</details>

### 练习 3（挑战）：综合练习 - Schema 验证

**任务**：实现一个带 Schema 验证的结构化输出解析器。

<details>
<summary>点击查看答案</summary>

```python
from pydantic import BaseModel, Field, ValidationError
from openai import OpenAI
import json

client = OpenAI()

class ProductInfo(BaseModel):
    name: str = Field(description="产品名称")
    price: float = Field(description="价格", gt=0)
    category: str = Field(description="分类")
    in_stock: bool = Field(default=True, description="是否有货")

def extract_with_validation(text):
    prompt = f"""从文本中提取产品信息：

{text}

输出 JSON：
{{
    "name": "string",
    "price": "number (>0)",
    "category": "string",
    "in_stock": "boolean"
}}"""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    data = json.loads(response.choices[0].message.content)
    
    try:
        return ProductInfo(**data)
    except ValidationError as e:
        raise ValueError(f"Validation error: {e}")

# 测试
text = "MacBook Pro 16寸，售价19999元，笔记本电脑，有货"
product = extract_with_validation(text)
print(f"名称：{product.name}")
print(f"价格：{product.price}")
```

</details>

---

## 下一章预告

下一章我们会学习 **对话系统开发**——如何构建多轮对话系统。你会学到：

- 多轮对话管理
- 上下文维护
- 对话状态跟踪
- 会话记忆机制
