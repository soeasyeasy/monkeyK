---
title: "第05章：Output Parser 输出解析"
description: "掌握结构化输出解析，学习 JSON 解析、Pydantic 解析、自定义解析器"
---

# 第05章：Output Parser 输出解析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 模型输出的是文本，如何转成结构化数据？
- 如何让模型输出 JSON 格式？
- 如何解析复杂的嵌套数据？
- 输出格式不对怎么办？

这一章就是为了解答这些问题。我们会学习如何使用 Output Parser 把模型的输出解析成结构化数据，让你的程序能够方便地处理结果。

---

## 1 为什么需要 Output Parser？

### 痛点分析

大模型的输出是纯文本，但我们的程序通常需要结构化数据：

```python
# ❌ 模型输出的是文本
response = chat.invoke([HumanMessage(content="列出 3 个 Python 的优点，用 JSON 格式")])
print(response.content)
# 输出：
# [
#   {"优点": "简单易学", "说明": "语法简洁，容易上手"},
#   {"优点": "生态丰富", "说明": "有大量的第三方库"},
#   {"优点": "跨平台", "说明": "可以在多个操作系统上运行"}
# ]

# 问题：这是字符串，不是 Python 字典
# 无法直接访问：response.content[0]["优点"]  # 报错
```

### 解决方案

**Output Parser** 可以把模型的文本输出解析成结构化数据（如字典、列表、对象）。

打个比方：

> **Output Parser 就像翻译官**：
> - 模型说的是"英语"（文本）
> - Output Parser 把它翻译成"中文"（结构化数据）
> - 你的程序就能方便地使用了

---

## 2 基础 Output Parser

### 2.1 StrOutputParser（字符串解析器）

最简单的解析器，直接返回字符串。

```python
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(model="gpt-3.5-turbo")
parser = StrOutputParser()

# 使用
response = chat.invoke([HumanMessage(content="你好")])
result = parser.parse(response.content)
print(result)  # "你好"
print(type(result))  # <class 'str'>
```

> **原理**：StrOutputParser 不做任何处理，直接返回原始文本。

### 2.2 JsonOutputParser（JSON 解析器）

把模型输出解析成 JSON 对象。

```python
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# 创建解析器
parser = JsonOutputParser()

# 创建 Prompt，要求输出 JSON
prompt = ChatPromptTemplate.from_messages([
    ("system", "请以 JSON 格式输出：{{\"name\": \"名字\", \"age\": 年龄}}"),
    ("human", "请介绍 {person}")
])

# 创建 Chain
chain = prompt | chat | parser

# 使用
result = chain.invoke({"person": "小明"})
print(result)  # {"name": "小明", "age": 25}
print(type(result))  # <class 'dict'>
print(result["name"])  # "小明"
```

**代码解释**：

1. **创建解析器**：使用 `JsonOutputParser()` 创建 JSON 解析器
2. **Prompt 要求**：在 Prompt 中明确要求输出 JSON 格式
3. **串联组件**：使用 `|` 把 Prompt、LLM、Parser 串联起来
4. **解析结果**：Parser 会自动把文本解析成字典

> **原理**：JsonOutputParser 会使用 JSON 解析库把文本解析成 Python 字典。

### 2.3 PydanticOutputParser（Pydantic 解析器）

使用 Pydantic 模型定义输出格式，更强大。

```python
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

# 定义数据模型
class Person(BaseModel):
    name: str = Field(description="姓名")
    age: int = Field(description="年龄")
    occupation: str = Field(description="职业")

# 创建解析器
parser = PydanticOutputParser(pydantic_object=Person)

# 创建 Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "请以 JSON 格式输出人物信息。\n{format_instructions}"),
    ("human", "请介绍 {person}")
])

# 获取格式说明
format_instructions = parser.get_format_instructions()

# 创建 Chain
chain = prompt | chat | parser

# 使用
result = chain.invoke({
    "person": "小明",
    "format_instructions": format_instructions
})
print(result)  # Person(name='小明', age=25, occupation='工程师')
print(type(result))  # <class 'Person'>
print(result.name)  # "小明"
```

**代码解释**：

1. **定义模型**：使用 Pydantic 定义数据结构
2. **创建解析器**：使用 `PydanticOutputParser` 创建解析器
3. **获取格式说明**：使用 `get_format_instructions()` 获取格式说明
4. **注入 Prompt**：把格式说明注入到 Prompt 中
5. **解析结果**：返回 Pydantic 对象

> **原理**：PydanticOutputParser 会根据 Pydantic 模型自动生成格式说明，并把输出解析成 Pydantic 对象。

---

## 3 高级 Output Parser

### 3.1 CommaSeparatedListOutputParser（逗号分隔列表）

解析逗号分隔的列表。

```python
from langchain_core.output_parsers import CommaSeparatedListOutputParser

parser = CommaSeparatedListOutputParser()

# 获取格式说明
format_instructions = parser.get_format_instructions()
print(format_instructions)  # "Your response should be a list of comma separated values..."

# 使用
prompt = ChatPromptTemplate.from_messages([
    ("system", "列出 3 个编程语言。{format_instructions}"),
    ("human", "请列出 {topic}")
])

chain = prompt | chat | parser
result = chain.invoke({
    "topic": "编程语言",
    "format_instructions": format_instructions
})
print(result)  # ['Python', 'Java', 'JavaScript']
print(type(result))  # <class 'list'>
```

### 3.2 DatetimeOutputParser（日期时间解析器）

解析日期时间格式。

```python
from langchain_core.output_parsers import DatetimeOutputParser

parser = DatetimeOutputParser(format="%Y-%m-%d")

prompt = ChatPromptTemplate.from_messages([
    ("system", "输出日期。{format_instructions}"),
    ("human", "今天是几号？")
])

chain = prompt | chat | parser
result = chain.invoke({"format_instructions": parser.get_format_instructions()})
print(result)  # datetime.datetime(2024, 1, 15, 0, 0)
print(type(result))  # <class 'datetime.datetime'>
```

### 3.3 EnumOutputParser（枚举解析器）

解析枚举值。

```python
from langchain_core.output_parsers import EnumOutputParser
from enum import Enum

class Sentiment(Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

parser = EnumOutputParser(enum=Sentiment)

prompt = ChatPromptTemplate.from_messages([
    ("system", "判断情感。{format_instructions}"),
    ("human", "这段文字的情感是什么？{text}")
])

chain = prompt | chat | parser
result = chain.invoke({
    "text": "这个产品太棒了！",
    "format_instructions": parser.get_format_instructions()
})
print(result)  # Sentiment.POSITIVE
print(type(result))  # <class 'Sentiment'>
```

---

## 4 自定义 Output Parser

### 4.1 简单自定义解析器

```python
from langchain_core.output_parsers import BaseOutputParser

class NumberListParser(BaseOutputParser):
    """解析数字列表"""
    
    def parse(self, text: str):
        # 提取所有数字
        import re
        numbers = re.findall(r'\d+', text)
        return [int(n) for n in numbers]

# 使用
parser = NumberListParser()
result = parser.parse("我买了 3 个苹果，5 个香蕉，2 个橙子")
print(result)  # [3, 5, 2]
```

### 4.2 复杂自定义解析器

```python
from langchain_core.output_parsers import BaseOutputParser
from pydantic import BaseModel

class MovieReview(BaseModel):
    title: str
    rating: float
    summary: str

class MovieReviewParser(BaseOutputParser):
    """解析电影评论"""
    
    def parse(self, text: str):
        # 假设模型输出格式：
        # 标题：xxx
        # 评分：x.x
        # 总结：xxx
        
        lines = text.strip().split('\n')
        data = {}
        for line in lines:
            if '：' in line:
                key, value = line.split('：', 1)
                data[key.strip()] = value.strip()
        
        return MovieReview(
            title=data.get('标题', ''),
            rating=float(data.get('评分', 0)),
            summary=data.get('总结', '')
        )

# 使用
parser = MovieReviewParser()
text = """
标题：流浪地球 2
评分：8.5
总结：一部优秀的科幻电影，特效震撼，剧情紧凑。
"""
result = parser.parse(text)
print(result)  # MovieReview(title='流浪地球 2', rating=8.5, summary='...')
print(result.title)  # "流浪地球 2"
```

---

## 5 错误处理

### 5.1 处理解析错误

```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel

class Person(BaseModel):
    name: str
    age: int

parser = PydanticOutputParser(pydantic_object=Person)

# 错误的输出
wrong_output = "这是一个人的信息：小明，25岁"

try:
    result = parser.parse(wrong_output)
except Exception as e:
    print(f"解析错误：{e}")
    # 可以重试或返回默认值
    result = Person(name="未知", age=0)
```

### 5.2 使用 RetryOutputParser（重试解析器）

```python
from langchain.output_parsers import RetryOutputParser
from langchain_core.prompts import PromptTemplate

# 创建重试解析器
retry_parser = RetryOutputParser.from_llm(
    parser=parser,
    llm=chat,
    prompt_template=PromptTemplate(template="{prompt}\n{completion}"),
    max_retries=3
)

# 使用
result = retry_parser.parse_with_prompt(
    completion=wrong_output,
    prompt_value=prompt.format_prompt(person="小明")
)
print(result)  # 会自动重试，直到解析成功
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **StrOutputParser** | 字符串解析器，直接返回文本 |
| **JsonOutputParser** | JSON 解析器，返回字典 |
| **PydanticOutputParser** | Pydantic 解析器，返回 Pydantic 对象 |
| **CommaSeparatedListOutputParser** | 逗号分隔列表解析器 |
| **DatetimeOutputParser** | 日期时间解析器 |
| **EnumOutputParser** | 枚举解析器 |
| **自定义解析器** | 继承 BaseOutputParser，实现 parse 方法 |

---

## 7 新手常见误区

### 误区 1："不指定输出格式"

**错！** 不指定格式，模型输出会不稳定。

正确做法：在 Prompt 中明确要求输出格式，并使用对应的 Parser。

### 误区 2："忽略格式说明"

**错！** 不使用 `get_format_instructions()`，模型可能不知道输出什么格式。

正确做法：把格式说明注入到 Prompt 中。

### 误区 3："不处理解析错误"

**错！** 模型输出可能不符合格式，导致解析失败。

正确做法：添加异常处理，使用重试机制。

### 误区 4："所有场景都用 JSON"

**错！** 简单的列表用 CommaSeparatedListOutputParser 更方便。

正确做法：根据场景选择合适的 Parser。

---

## 8 动手练习

### 练习 1：基础练习

**题目**：使用 JsonOutputParser 解析模型输出。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(model="gpt-3.5-turbo")
parser = JsonOutputParser()

prompt = ChatPromptTemplate.from_messages([
    ("system", "请以 JSON 格式输出：{{\"name\": \"名字\", \"age\": 年龄}}"),
    ("human", "请介绍 {person}")
])

chain = prompt | chat | parser
result = chain.invoke({"person": "小红"})
print(result)  # {"name": "小红", "age": 22}
print(result["name"])  # "小红"
```

</details>

### 练习 2：进阶练习

**题目**：使用 PydanticOutputParser 创建结构化输出。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

class Book(BaseModel):
    title: str = Field(description="书名")
    author: str = Field(description="作者")
    year: int = Field(description="出版年份")

chat = ChatOpenAI(model="gpt-3.5-turbo")
parser = PydanticOutputParser(pydantic_object=Book)

prompt = ChatPromptTemplate.from_messages([
    ("system", "请以 JSON 格式输出书籍信息。\n{format_instructions}"),
    ("human", "请介绍 {book}")
])

chain = prompt | chat | parser
result = chain.invoke({
    "book": "三体",
    "format_instructions": parser.get_format_instructions()
})
print(result)  # Book(title='三体', author='刘慈欣', year=2008)
print(result.title)  # "三体"
```

</details>

### 练习 3（挑战）：综合练习

**题目**：创建自定义解析器，解析模型输出的表格数据。

<details>
<summary>点击查看答案</summary>

```python
from langchain_core.output_parsers import BaseOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

class TableParser(BaseOutputParser):
    """解析表格数据"""
    
    def parse(self, text: str):
        lines = text.strip().split('\n')
        table = []
        for line in lines:
            if '|' in line and '---' not in line:
                cells = [cell.strip() for cell in line.split('|')]
                cells = [c for c in cells if c]  # 移除空单元格
                if cells:
                    table.append(cells)
        return table

chat = ChatOpenAI(model="gpt-3.5-turbo")
parser = TableParser()

prompt = ChatPromptTemplate.from_messages([
    ("system", "请以 Markdown 表格格式输出数据。"),
    ("human", "请列出 {topic}")
])

chain = prompt | chat | parser
result = chain.invoke({"topic": "3 个编程语言的优缺点"})
print(result)
# [['语言', '优点', '缺点'], ['Python', '简单易学', '速度慢'], ...]
```

</details>

---

## 下一章预告

下一章我们会学习 **Chain 链式调用详解**——也就是如何把多个组件串联起来，形成完整的工作流。你会学到 SimpleChain、SequentialChain、自定义 Chain 等高级用法。
