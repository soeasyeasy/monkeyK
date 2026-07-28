---
title: "第13章：Prompt Engineering 实战"
description: "Prompt 设计技巧、角色扮演、结构化输出、Prompt 模板、高级策略"
---

# 第13章：Prompt Engineering 实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Prompt Engineering？为什么它这么重要？
- 怎么设计一个有效的 Prompt？
- 什么是角色扮演？怎么让模型扮演特定角色？
- 怎么让模型输出结构化的数据（JSON、表格等）？
- 有哪些高级的 Prompt 技巧？

这一章就是为了解答这些问题。我们会从 **Prompt 设计的基本原则** 开始，学习角色扮演、结构化输出，然后深入各种高级技巧，让你能够充分发挥大模型的潜力。

---

## 1 为什么需要 Prompt Engineering？

### 痛点分析

**直接使用大模型的问题**：

1. **回答不稳定**：同样的问题，不同的问法可能得到不同的答案
2. **格式不统一**：有时输出文本，有时输出列表，难以解析
3. **质量参差不齐**：有时回答很好，有时答非所问
4. **无法控制行为**：模型可能生成有害、不相关的内容

**例子**：
> 你想让模型帮你写代码：
> 
> 差的 Prompt："帮我写个排序算法"
> - 可能返回 Python，也可能返回 Java
> - 可能返回快速排序，也可能返回冒泡排序
> - 代码风格不统一
> 
> 好的 Prompt："请用 Python 实现快速排序算法，要求：1. 使用递归方式 2. 添加类型注解 3. 包含示例用法"
> - 明确的语言、算法、风格要求
> - 输出可预期、可控制

### 解决方案

**Prompt Engineering（提示工程）**：
- ✅ 设计有效的提示，引导模型生成期望的输出
- ✅ 控制输出格式和内容
- ✅ 提高回答质量和稳定性
- ✅ 无需修改模型参数

打个比方：

> 大模型就像一个博学的助手，但需要明确的指令；Prompt Engineering 就是学习如何更好地与这个助手沟通，让它给出你想要的答案。

> **一句话总结**：Prompt Engineering 是通过设计好的提示，让大模型按照你的期望工作的艺术和科学。

---

## 2 核心原理

### 2.1 Prompt 设计的基本原则

#### 原则 1：明确具体

```
❌ 差的 Prompt：
"写点什么"

✅ 好的 Prompt：
"写一篇关于人工智能在医疗领域应用的 500 字文章，目标读者是医疗专业人士"
```

#### 原则 2：提供上下文

```
❌ 差的 Prompt：
"这个怎么样？"

✅ 好的 Prompt：
"我是一名 Python 初学者，正在学习机器学习。请评价以下代码的质量和可读性：[代码]"
```

#### 原则 3：指定输出格式

```
❌ 差的 Prompt：
"列出 5 个编程语言的优点"

✅ 好的 Prompt：
"请用 JSON 格式列出 5 个编程语言的优点，格式如下：
[
  {
    \"language\": \"语言名\",
    \"advantages\": [\"优点1\", \"优点2\"]
  }
]"
```

#### 原则 4：使用分隔符

```
✅ 好的 Prompt：
"请总结以下文章：

---
文章内容...
---

请用 3 句话总结："
```

#### 原则 5：提供示例（Few-shot）

```
✅ 好的 Prompt：
"请将以下句子翻译为英文：

示例：
中文：今天天气很好
英文：The weather is nice today

中文：我喜欢编程
英文：I like programming

中文：机器学习很有趣
英文："
```

### 2.2 角色扮演（Role Playing）

**核心思想**：让模型扮演特定角色，以该角色的视角和风格回答问题。

**应用场景**：
- 专业顾问（医生、律师、心理咨询师）
- 历史人物（孔子、爱因斯坦）
- 虚构角色（福尔摩斯、哈利·波特）
- 职业角色（产品经理、程序员、设计师）

**代码实现**：

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

def role_playing_prompt(role, task, context=""):
    """
    角色扮演 Prompt
    
    参数：
    - role: 角色名称
    - task: 任务描述
    - context: 背景信息
    """
    prompt = f"""你是一位{role}。请基于你的专业知识和经验，完成以下任务。

{f'背景信息：{context}' if context else ''}

任务：{task}

请以{role}的身份回答，保持专业、准确、有帮助。"""
    
    return prompt

# 使用示例
role = "资深 Python 程序员，有 10 年开发经验"
task = "请评价以下代码的质量，并给出改进建议：\n\ndef calculate_sum(n):\n    sum = 0\n    for i in range(n):\n        sum += i\n    return sum"

prompt = role_playing_prompt(role, task)
print(prompt)

# 生成回答
tokenizer = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")

inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(inputs["input_ids"], max_length=500)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

**高级角色扮演**：

```python
def advanced_role_playing(role, personality, expertise, task):
    """
    高级角色扮演
    
    参数：
    - role: 角色
    - personality: 性格特点
    - expertise: 专业领域
    - task: 任务
    """
    prompt = f"""# 角色设定

你扮演：{role}

## 性格特点
{personality}

## 专业领域
{expertise}

## 回答风格
- 保持角色一致性
- 使用符合角色身份的语言
- 展现角色的专业知识

## 任务
{task}

请以该角色的身份回答："""
    
    return prompt

# 使用示例
role = "一位经验丰富的 Python 导师"
personality = """
- 耐心、友好
- 善于用简单的例子解释复杂概念
- 鼓励学生思考
- 偶尔使用幽默
"""
expertise = """
- Python 编程（15 年经验）
- 软件架构设计
- 机器学习
- 代码审查和优化
"""
task = "学生问：'什么是装饰器？我什么时候应该使用它？'"

prompt = advanced_role_playing(role, personality, expertise, task)
print(prompt)
```

### 2.3 结构化输出

**核心思想**：让模型输出特定格式的数据，便于程序解析。

#### JSON 输出

```python
def json_output_prompt(task, schema):
    """
    JSON 输出 Prompt
    
    参数：
    - task: 任务描述
    - schema: JSON 格式说明
    """
    prompt = f"""请完成以下任务，并以 JSON 格式输出结果。

任务：{task}

输出格式：
{schema}

要求：
1. 严格遵循 JSON 格式
2. 不要输出任何额外的解释
3. 确保 JSON 有效（可以被 json.loads 解析）

输出："""
    
    return prompt

# 使用示例
task = "分析以下 Python 代码，提取函数名、参数和返回值类型"
schema = """
{
  "functions": [
    {
      "name": "函数名",
      "parameters": ["参数1", "参数2"],
      "return_type": "返回值类型",
      "description": "函数描述"
    }
  ]
}
"""

code = """
def calculate_area(radius: float) -> float:
    \"\"\"计算圆的面积\"\"\"
    return 3.14 * radius ** 2

def greet(name: str) -> str:
    \"\"\"问候用户\"\"\"
    return f"Hello, {name}!"
"""

prompt = json_output_prompt(f"{task}\n\n代码：\n{code}", schema)
print(prompt)
```

#### 表格输出

```python
def table_output_prompt(task, columns):
    """
    表格输出 Prompt
    
    参数：
    - task: 任务描述
    - columns: 列名列表
    """
    columns_str = " | ".join(columns)
    separator = " | ".join(["---"] * len(columns))
    
    prompt = f"""请完成以下任务，并以 Markdown 表格格式输出。

任务：{task}

表格格式：
{columns_str}
{separator}

要求：
1. 使用 Markdown 表格格式
2. 每列对齐
3. 数据准确

输出："""
    
    return prompt

# 使用示例
task = "比较 Python、Java、JavaScript 三种编程语言的特点"
columns = ["特性", "Python", "Java", "JavaScript"]

prompt = table_output_prompt(task, columns)
print(prompt)
```

#### 列表输出

```python
def list_output_prompt(task, item_format):
    """
    列表输出 Prompt
    
    参数：
    - task: 任务描述
    - item_format: 每个项目的格式
    """
    prompt = f"""请完成以下任务，并以列表格式输出。

任务：{task}

每个项目的格式：
{item_format}

要求：
1. 每个项目占一行
2. 使用统一的格式
3. 项目之间用空行分隔

输出："""
    
    return prompt

# 使用示例
task = "列出 5 个 Python 最佳实践"
item_format = "- **实践名称**：简要描述"

prompt = list_output_prompt(task, item_format)
print(prompt)
```

### 2.4 高级 Prompt 技巧

#### 技巧 1：思维链（Chain-of-Thought）

```python
def cot_prompt(question, examples=None):
    """
    思维链 Prompt
    
    参数：
    - question: 问题
    - examples: 示例列表
    """
    prompt = "请一步一步思考并回答以下问题。\n\n"
    
    if examples:
        for q, reasoning in examples:
            prompt += f"问题：{q}\n{reasoning}\n\n"
    
    prompt += f"问题：{question}\n让我们一步一步思考："
    
    return prompt

# 使用示例
question = "一个商店有 23 个苹果，卖了 15 个，又进了 8 个，现在有多少个？"
examples = [
    ("小明有 5 个苹果，小红给了他 3 个，他又买了 2 个，现在有多少个？",
     "让我们一步一步思考：\n1. 小明初始有 5 个苹果\n2. 小红给了他 3 个，现在有 5 + 3 = 8 个\n3. 他又买了 2 个，现在有 8 + 2 = 10 个\n答案：10 个")
]

prompt = cot_prompt(question, examples)
print(prompt)
```

#### 技巧 2：自我反思（Self-Reflection）

```python
def self_reflection_prompt(task, initial_response):
    """
    自我反思 Prompt
    
    参数：
    - task: 原始任务
    - initial_response: 初始回答
    """
    prompt = f"""任务：{task}

初始回答：
{initial_response}

请反思你的回答：
1. 回答是否准确？
2. 是否有遗漏或错误？
3. 如何改进？

然后提供改进后的回答："""
    
    return prompt

# 使用示例
task = "解释什么是递归"
initial_response = "递归就是函数调用自己。"

prompt = self_reflection_prompt(task, initial_response)
print(prompt)
```

#### 技巧 3：分步执行（Step-by-Step）

```python
def step_by_step_prompt(complex_task, steps):
    """
    分步执行 Prompt
    
    参数：
    - complex_task: 复杂任务
    - steps: 步骤列表
    """
    prompt = f"""请完成以下复杂任务。

任务：{complex_task}

请按以下步骤执行：
"""
    
    for i, step in enumerate(steps, 1):
        prompt += f"\n步骤 {i}：{step}"
    
    prompt += "\n\n请逐步完成每个步骤，并展示你的思考过程："
    
    return prompt

# 使用示例
complex_task = "设计一个简单的待办事项应用"
steps = [
    "分析需求，确定核心功能",
    "设计数据模型",
    "设计用户界面",
    "编写核心代码",
    "测试和优化"
]

prompt = step_by_step_prompt(complex_task, steps)
print(prompt)
```

---

## 3 基础用法

### 3.1 使用 OpenAI API

```python
import openai

def chat_with_prompt(system_prompt, user_message, model="gpt-3.5-turbo"):
    """
    使用 OpenAI API 进行对话
    
    参数：
    - system_prompt: 系统提示
    - user_message: 用户消息
    - model: 模型名称
    """
    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.7,
        max_tokens=500
    )
    
    return response.choices[0].message.content

# 使用示例
system_prompt = "你是一位资深 Python 程序员，擅长代码审查和优化。请用专业、友好的语气回答问题。"
user_message = "请帮我优化这段代码：\n\ndef process_data(data):\n    result = []\n    for item in data:\n        if item > 0:\n            result.append(item * 2)\n    return result"

response = chat_with_prompt(system_prompt, user_message)
print(response)
```

### 3.2 使用 Hugging Face 模型

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

def generate_with_system(system_prompt, user_message, model_name="gpt2"):
    """
    使用系统提示生成
    
    参数：
    - system_prompt: 系统提示
    - user_message: 用户消息
    - model_name: 模型名称
    """
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    # 构造完整提示
    full_prompt = f"""系统：{system_prompt}

用户：{user_message}

助手："""
    
    inputs = tokenizer(full_prompt, return_tensors="pt")
    outputs = model.generate(
        inputs["input_ids"],
        max_length=500,
        do_sample=True,
        temperature=0.7
    )
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# 使用示例
system_prompt = "你是一位 Python 专家。"
user_message = "什么是列表推导式？"

response = generate_with_system(system_prompt, user_message)
print(response)
```

---

## 4 进阶用法

### 4.1 Prompt 模板库

```python
class PromptTemplateLibrary:
    """Prompt 模板库"""
    
    def __init__(self):
        self.templates = {}
    
    def add_template(self, name, template, variables):
        """
        添加模板
        
        参数：
        - name: 模板名称
        - template: 模板字符串
        - variables: 变量列表
        """
        self.templates[name] = {
            "template": template,
            "variables": variables
        }
    
    def get_template(self, name, **kwargs):
        """
        获取格式化的模板
        
        参数：
        - name: 模板名称
        - kwargs: 变量值
        """
        if name not in self.templates:
            raise ValueError(f"模板 '{name}' 不存在")
        
        template_info = self.templates[name]
        
        # 验证变量
        for var in template_info["variables"]:
            if var not in kwargs:
                raise ValueError(f"缺少变量: {var}")
        
        return template_info["template"].format(**kwargs)

# 使用示例
library = PromptTemplateLibrary()

# 添加代码审查模板
library.add_template(
    "code_review",
    """请审查以下{language}代码：

代码：
```{language}
{code}
```

请从以下方面进行审查：
1. 代码质量（可读性、命名规范）
2. 性能优化
3. 潜在 bug
4. 最佳实践

请给出具体的改进建议和示例代码。""",
    ["language", "code"]
)

# 使用模板
prompt = library.get_template(
    "code_review",
    language="Python",
    code="def f(x):\n    return x*2"
)
print(prompt)
```

### 4.2 动态 Prompt 生成

```python
class DynamicPromptGenerator:
    """动态 Prompt 生成器"""
    
    def __init__(self, base_template):
        self.base_template = base_template
        self.context = {}
    
    def set_context(self, **kwargs):
        """设置上下文"""
        self.context.update(kwargs)
    
    def generate(self, task, constraints=None):
        """
        生成 Prompt
        
        参数：
        - task: 任务描述
        - constraints: 约束条件列表
        """
        prompt = self.base_template + "\n\n"
        
        # 添加上下文
        if self.context:
            prompt += "背景信息：\n"
            for key, value in self.context.items():
                prompt += f"- {key}: {value}\n"
            prompt += "\n"
        
        # 添加任务
        prompt += f"任务：{task}\n\n"
        
        # 添加约束
        if constraints:
            prompt += "要求：\n"
            for i, constraint in enumerate(constraints, 1):
                prompt += f"{i}. {constraint}\n"
        
        return prompt

# 使用示例
generator = DynamicPromptGenerator("你是一位专业的代码助手。")
generator.set_context(
    用户="Python 初学者",
    项目="数据分析项目",
    经验="熟悉 pandas 和 numpy"
)

prompt = generator.generate(
    task="帮我写一个函数，读取 CSV 文件并计算某列的平均值",
    constraints=[
        "使用 pandas 库",
        "添加错误处理",
        "包含类型注解",
        "提供示例用法"
    ]
)
print(prompt)
```

### 4.3 Prompt 优化技巧

```python
def optimize_prompt(original_prompt, optimization_type="clarity"):
    """
    Prompt 优化
    
    参数：
    - original_prompt: 原始 Prompt
    - optimization_type: 优化类型
      - clarity: 提高清晰度
      - specificity: 增加具体性
      - structure: 改善结构
    """
    optimization_instructions = {
        "clarity": "请优化以下提示，使其更清晰、更易理解：",
        "specificity": "请优化以下提示，增加更多具体细节和要求：",
        "structure": "请优化以下提示，改善其结构和组织："
    }
    
    instruction = optimization_instructions.get(
        optimization_type,
        optimization_instructions["clarity"]
    )
    
    meta_prompt = f"""{instruction}

原始提示：
{original_prompt}

优化后的提示："""
    
    return meta_prompt

# 使用示例
original = "帮我写代码"
optimized = optimize_prompt(original, "specificity")
print(optimized)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **明确具体** | 清楚地说明你想要什么 |
| **提供上下文** | 给出必要的背景信息 |
| **指定格式** | 明确输出格式（JSON、表格等） |
| **使用分隔符** | 用分隔符区分不同部分 |
| **提供示例** | Few-shot 学习 |
| **角色扮演** | 让模型扮演特定角色 |
| **思维链** | 逐步推理 |
| **自我反思** | 让模型反思和改进 |
| **分步执行** | 将复杂任务分解为步骤 |

---

## 6 新手常见误区

### 误区 1："Prompt 越短越好"

**错！** 好的 Prompt 应该：
- 足够详细，包含必要信息
- 避免冗长，去除无关内容
- 平衡简洁和完整

**正确做法**：
- 先写完整的 Prompt
- 逐步精简，保留关键信息
- 测试并迭代

### 误区 2："一次就能得到完美答案"

**不完全对。** 通常需要：
- 多次迭代
- 调整 Prompt
- 尝试不同的策略

**正确做法**：
- 从简单的 Prompt 开始
- 根据结果调整
- 记录有效的 Prompt

### 误区 3："所有模型都用同样的 Prompt"

**错！** 不同模型有特点：
- GPT 系列：擅长遵循指令
- Claude：擅长长文本
- LLaMA：需要更明确的指令

**正确做法**：
- 了解模型的特点
- 根据模型调整 Prompt
- 参考模型的文档

### 误区 4："Prompt Engineering 不需要学习"

**错！** Prompt Engineering 是一门技能：
- 需要学习和实践
- 有最佳实践和技巧
- 可以显著提升效果

**正确做法**：
- 学习基本原则
- 多实践、多总结
- 关注最新研究

### 误区 5："复杂的 Prompt 一定更好"

**不完全对。** 复杂的 Prompt 可能：
- 让模型困惑
- 增加出错概率
- 难以维护

**正确做法**：
- 从简单开始
- 逐步增加复杂度
- 保持清晰和一致

---

## 7 动手练习

### 练习 1：基础练习 - 设计角色扮演 Prompt

**题目**：设计一个让模型扮演 Python 导师的 Prompt。

<details>
<summary>点击查看答案</summary>

```python
def python_tutor_prompt():
    """Python 导师 Prompt"""
    prompt = """你是一位经验丰富的 Python 导师，有 10 年教学经验。

你的特点：
- 耐心、友好
- 善于用简单的例子解释复杂概念
- 鼓励学生思考
- 提供实用的建议

请回答以下问题，保持导师的角色：

学生问题：什么是装饰器？我什么时候应该使用它？

请以导师的身份回答："""
    
    return prompt

prompt = python_tutor_prompt()
print(prompt)
```

</details>

### 练习 2：进阶练习 - 结构化输出

**题目**：设计一个让模型输出 JSON 格式代码分析结果的 Prompt。

<details>
<summary>点击查看答案</summary>

```python
def code_analysis_json_prompt(code):
    """代码分析 JSON 输出 Prompt"""
    prompt = f"""请分析以下 Python 代码，并以 JSON 格式输出分析结果。

代码：
```python
{code}
```

输出格式：
{{
  "functions": [
    {{
      "name": "函数名",
      "parameters": ["参数列表"],
      "return_type": "返回值类型",
      "complexity": "复杂度（低/中/高）",
      "issues": ["问题列表"],
      "suggestions": ["改进建议"]
    }}
  ],
  "overall_quality": "整体质量评分（1-10）",
  "recommendations": ["总体建议"]
}}

要求：
1. 严格遵循 JSON 格式
2. 分析每个函数
3. 识别潜在问题
4. 提供改进建议

输出："""
    
    return prompt

code = """
def calculate_average(numbers):
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)
"""

prompt = code_analysis_json_prompt(code)
print(prompt)
```

</details>

### 练习 3（挑战）：综合练习 - 完整的 Prompt 工程系统

**题目**：实现一个完整的 Prompt 工程系统，支持模板、上下文、优化。

<details>
<summary>点击查看答案</summary>

```python
class PromptEngineeringSystem:
    """Prompt 工程系统"""
    
    def __init__(self):
        self.templates = {}
        self.context = {}
    
    def add_template(self, name, template, variables):
        """添加模板"""
        self.templates[name] = {
            "template": template,
            "variables": variables
        }
    
    def set_context(self, **kwargs):
        """设置上下文"""
        self.context.update(kwargs)
    
    def generate_prompt(self, template_name, task, **kwargs):
        """生成 Prompt"""
        if template_name not in self.templates:
            raise ValueError(f"模板 '{template_name}' 不存在")
        
        template_info = self.templates[template_name]
        
        # 合并变量
        all_vars = {**self.context, **kwargs}
        
        # 验证变量
        for var in template_info["variables"]:
            if var not in all_vars:
                raise ValueError(f"缺少变量: {var}")
        
        # 格式化模板
        base_prompt = template_info["template"].format(**all_vars)
        
        # 添加任务
        full_prompt = f"{base_prompt}\n\n任务：{task}"
        
        return full_prompt
    
    def optimize_prompt(self, prompt, strategy="clarity"):
        """优化 Prompt"""
        strategies = {
            "clarity": "请优化以下提示，使其更清晰：",
            "specificity": "请优化以下提示，增加具体细节：",
            "structure": "请优化以下提示，改善结构："
        }
        
        instruction = strategies.get(strategy, strategies["clarity"])
        
        meta_prompt = f"""{instruction}

原始提示：
{prompt}

优化后的提示："""
        
        return meta_prompt

# 使用示例
system = PromptEngineeringSystem()

# 添加模板
system.add_template(
    "code_review",
    "你是一位{role}。请审查以下{language}代码：\n\n{code}",
    ["role", "language", "code"]
)

# 设置上下文
system.set_context(role="资深 Python 程序员")

# 生成 Prompt
prompt = system.generate_prompt(
    "code_review",
    task="请提供改进建议",
    language="Python",
    code="def f(x): return x*2"
)

print(prompt)
```

</details>

---

## 下一章预告

下一章我们会学习 **模型微调实战**——如何对大语言模型进行微调。你会学到 LoRA、QLoRA、PEFT、数据集准备、微调流程、效果评估等实用技能。这些是让模型适应特定任务的核心技术。
