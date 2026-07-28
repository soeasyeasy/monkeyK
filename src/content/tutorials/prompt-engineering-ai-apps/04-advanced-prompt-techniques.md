---
title: "第4章：Prompt 进阶技巧"
description: "Chain-of-Thought、Self-Consistency、ReAct、思维链与推理增强"
---

# 第4章：Prompt 进阶技巧

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是思维链（Chain-of-Thought）？怎么让模型"想清楚再回答"？
- Self-Consistency 是什么？如何提升模型回答的准确性？
- ReAct 模式是什么？怎么让模型既能思考又能行动？
- 这些高级技巧在什么场景下使用？
- 如何组合使用这些技巧？

这一章就是为了解答这些问题。我们会学习 **Prompt 工程的高级技巧**，让你的 AI 应用能够处理更复杂的推理任务。

---

## 1 为什么需要进阶技巧？

### 痛点分析

**基础 Prompt 的局限**：

1. **复杂推理能力差**：多步骤数学题、逻辑推理容易出错
2. **事实性错误**：模型可能"一本正经地胡说八道"
3. **无法与外部交互**：只能生成文本，不能调用工具
4. **一致性差**：同样的问题多次回答可能不同

**举个例子**：

```
问题：小明有5个苹果，给了小红2个，又买了3个，现在有几个？

❌ 基础 Prompt 直接回答：
"小明现在有7个苹果"（可能算错）

✅ 思维链 Prompt：
"让我们一步一步思考：
1. 小明一开始有5个苹果
2. 给了小红2个，还剩5-2=3个
3. 又买了3个，现在有3+3=6个
所以小明现在有6个苹果"
```

### 解决方案

> **一句话总结**：高级 Prompt 技巧能让模型"慢思考"，提高复杂任务的准确性和可靠性。

打个比方：

> 想象你在考试：
> - **基础 Prompt** = 直接写答案（容易出错）
> - **思维链** = 在草稿纸上演算（更准确）
> - **Self-Consistency** = 算3遍取多数（最可靠）
> - **ReAct** = 边算边查公式（能处理未知问题）

---

## 2 核心原理

### 四大进阶技巧

```
┌─────────────────────────────────────────┐
│  1. Chain-of-Thought（思维链）           │
│     → 让模型展示推理过程                  │
│                                          │
│  2. Self-Consistency（自我一致性）        │
│     → 多次采样取最一致的答案              │
│                                          │
│  3. ReAct（推理+行动）                   │
│     → 思考-行动-观察循环                  │
│                                          │
│  4. Tree of Thoughts（思维树）            │
│     → 探索多条推理路径                    │
└─────────────────────────────────────────┘
```

### 技巧对比

| 技巧 | 适用场景 | 优势 | 劣势 |
|------|---------|------|------|
| CoT | 数学、逻辑推理 | 提高准确性 | Token 消耗增加 |
| Self-Consistency | 需要高准确度的任务 | 显著提升正确率 | 成本翻倍 |
| ReAct | 需要外部信息的任务 | 能调用工具 | 实现复杂 |
| ToT | 需要探索多种方案 | 找到最优解 | 成本最高 |

---

## 3 基础用法

### 技巧 1：Chain-of-Thought（思维链）

**核心思想**：让模型展示推理过程，而不是直接给出答案。

```python
from openai import OpenAI

client = OpenAI()

# ❌ 直接提问（容易出错）
prompt_direct = """
一个商店有100个苹果，第一天卖了20个，第二天卖了剩下的30%，
第三天又进了50个，现在有多少个苹果？
"""

# ✅ 思维链提问（更准确）
prompt_cot = """
一个商店有100个苹果，第一天卖了20个，第二天卖了剩下的30%，
第三天又进了50个，现在有多少个苹果？

让我们一步一步思考：
1. 首先计算第一天结束后剩余多少
2. 然后计算第二天卖了多少
3. 再计算第二天结束后剩余多少
4. 最后计算第三天进货后的总数

请展示每一步的计算过程：
"""

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt_cot}],
    temperature=0
)

print(response.choices[0].message.content)
```

**Zero-shot CoT**：

```python
# 最简单的思维链：加一句"让我们一步一步思考"
prompt_zero_shot_cot = """
一个商店有100个苹果，第一天卖了20个，第二天卖了剩下的30%，
第三天又进了50个，现在有多少个苹果？

让我们一步一步思考：
"""

# 或者使用魔法指令
prompt_magic = """
一个商店有100个苹果，第一天卖了20个，第二天卖了剩下的30%，
第三天又进了50个，现在有多少个苹果？

Q: 这个问题需要逐步推理
A: 让我们一步一步解决：
"""
```

**Few-shot CoT**：

```python
# 提供带推理过程的示例
prompt_fewshot_cot = """
我会给你一些数学题和解答过程，然后请你解答新的题目。

示例1：
问题：小明有5个苹果，给了小红2个，又买了3个，现在有几个？
解答：
- 小明一开始有5个苹果
- 给了小红2个，还剩5-2=3个
- 又买了3个，现在有3+3=6个
答案：6个

示例2：
问题：一个班级有40人，男生占60%，女生有多少人？
解答：
- 班级总人数40人
- 男生占60%，所以男生有40×0.6=24人
- 女生有40-24=16人
答案：16人

现在请解答：
问题：一个商店有100个苹果，第一天卖了20个，第二天卖了剩下的30%，第三天又进了50个，现在有多少个苹果？
解答：
"""

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt_fewshot_cot}],
    temperature=0
)

print(response.choices[0].message.content)
```

### 技巧 2：Self-Consistency（自我一致性）

**核心思想**：多次采样，选择最一致的答案。

```python
def self_consistency_solve(question, n_samples=5):
    """
    使用 Self-Consistency 解决问题
    
    Args:
        question: 问题
        n_samples: 采样次数
    
    Returns:
        最一致的答案
    """
    from collections import Counter
    
    answers = []
    
    # 多次采样
    for i in range(n_samples):
        prompt = f"""{question}

让我们一步一步思考，展示完整的推理过程："""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7  # 使用较高温度增加多样性
        )
        
        answer = response.choices[0].message.content
        answers.append(answer)
        print(f"第{i+1}次采样：\n{answer}\n")
    
    # 提取最终答案（简化版：提取最后一行）
    final_answers = []
    for ans in answers:
        lines = ans.strip().split('\n')
        final_answers.append(lines[-1])
    
    # 统计最一致的答案
    counter = Counter(final_answers)
    most_common = counter.most_common(1)[0][0]
    
    return most_common

# 使用示例
question = """
一个水池有甲乙两个进水管。单独开甲管6小时可以注满，
单独开乙管8小时可以注满。如果两管同时开，几小时可以注满？
"""

result = self_consistency_solve(question, n_samples=3)
print(f"\n最终答案：{result}")
```

### 技巧 3：ReAct（推理+行动）

**核心思想**：思考-行动-观察循环，让模型能够调用外部工具。

```python
import json

# 定义可用工具
tools = {
    "search": lambda query: f"搜索结果：{query}的相关信息...",
    "calculate": lambda expr: str(eval(expr)),
    "get_weather": lambda city: f"{city}今天晴，25°C"
}

def react_agent(question, max_steps=5):
    """
    ReAct Agent 实现
    
    Args:
        question: 用户问题
        max_steps: 最大步骤数
    """
    messages = [
        {
            "role": "system",
            "content": """你是一个智能助手，可以使用工具来帮助用户。

可用工具：
1. search(query): 搜索信息
2. calculate(expression): 计算数学表达式
3. get_weather(city): 获取天气

请按以下格式回答：
Thought: 思考下一步该做什么
Action: 工具名称
Action Input: 工具参数
Observation: 工具返回结果
...（重复思考-行动-观察）
Thought: 我现在知道最终答案了
Final Answer: 最终答案"""
        },
        {"role": "user", "content": question}
    ]
    
    for step in range(max_steps):
        # 让模型决定下一步
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0
        )
        
        output = response.choices[0].message.content
        print(f"Step {step+1}:\n{output}\n")
        
        # 检查是否得到最终答案
        if "Final Answer:" in output:
            final_answer = output.split("Final Answer:")[-1].strip()
            return final_answer
        
        # 解析 Action
        if "Action:" in output:
            lines = output.split('\n')
            action_line = next(l for l in lines if l.startswith("Action:"))
            action_input_line = next(l for l in lines if l.startswith("Action Input:"))
            
            action = action_line.split("Action:")[-1].strip()
            action_input = action_input_line.split("Action Input:")[-1].strip()
            
            # 执行工具
            if action in tools:
                observation = tools[action](action_input)
                
                # 添加观察结果到对话
                messages.append({"role": "assistant", "content": output})
                messages.append({"role": "user", "content": f"Observation: {observation}"})
            else:
                messages.append({"role": "assistant", "content": output})
                messages.append({"role": "user", "content": f"Observation: 工具 {action} 不存在"})
        else:
            messages.append({"role": "assistant", "content": output})
            messages.append({"role": "user", "content": "请继续"})
    
    return "未能找到答案"

# 使用示例
question = "北京今天天气怎么样？如果温度是25°C，转换成华氏度是多少？"
answer = react_agent(question)
print(f"\n最终答案：{answer}")
```

### 技巧 4：Tree of Thoughts（思维树）

**核心思想**：探索多条推理路径，选择最优解。

```python
def tree_of_thoughts(question, branching_factor=3, max_depth=3):
    """
    Tree of Thoughts 实现（简化版）
    
    Args:
        question: 问题
        branching_factor: 每个节点生成的思路数
        max_depth: 最大深度
    """
    
    def generate_thoughts(context, depth):
        """生成多个可能的思路"""
        prompt = f"""问题：{question}

当前思路：{context}

请生成{branching_factor}个不同的下一步思路，每个思路用数字标号：
1. ...
2. ...
3. ...
"""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8
        )
        
        return response.choices[0].message.content
    
    def evaluate_thought(thought):
        """评估思路的质量"""
        prompt = f"""评估以下解题思路的质量（1-10分）：

问题：{question}
思路：{thought}

请给出评分和理由："""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        
        # 提取评分（简化处理）
        return 7  # 实际应该解析评分
    
    # 简化的树搜索
    current_best = "初始思路"
    for depth in range(max_depth):
        thoughts = generate_thoughts(current_best, depth)
        # 选择最佳思路（简化）
        current_best = thoughts
    
    return current_best

# 使用示例
question = """
如何设计一个高并发的电商系统？
"""

solution = tree_of_thoughts(question)
print(f"最优方案：\n{solution}")
```

---

## 4 进阶用法

### 组合使用多种技巧

```python
def advanced_reasoning(question):
    """
    高级推理：组合 CoT + Self-Consistency
    """
    from collections import Counter
    
    answers = []
    
    # 多次采样，每次使用 CoT
    for i in range(3):
        prompt = f"""{question}

让我们一步一步思考：
1. 首先分析问题
2. 列出已知条件
3. 制定解题计划
4. 执行计划
5. 验证答案

请展示完整的推理过程："""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        answer = response.choices[0].message.content
        answers.append(answer)
    
    # 选择最一致的答案
    # 实际应该提取最终答案并统计
    return answers[0]

# 使用
question = """
一个农场有鸡和兔共35只，它们共有94只脚。
问鸡和兔各有多少只？
"""

result = advanced_reasoning(question)
print(result)
```

### 自动选择技巧

```python
def auto_select_technique(question):
    """
    根据问题类型自动选择合适的技巧
    """
    # 简单分类问题类型
    if any(keyword in question for keyword in ["计算", "多少", "几"]):
        return "cot"  # 数学问题用 CoT
    elif any(keyword in question for keyword in ["搜索", "查询", "最新"]):
        return "react"  # 需要外部信息用 ReAct
    elif any(keyword in question for keyword in ["方案", "设计", "如何"]):
        return "tot"  # 开放性问题用 ToT
    else:
        return "self_consistency"  # 默认用 Self-Consistency

# 使用
question = "计算 1+2+3+...+100 的和"
technique = auto_select_technique(question)
print(f"推荐使用技巧：{technique}")
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Chain-of-Thought | 让模型展示推理过程，提高准确性 |
| Zero-shot CoT | 只需加"让我们一步一步思考" |
| Few-shot CoT | 提供带推理过程的示例 |
| Self-Consistency | 多次采样取最一致的答案 |
| ReAct | 思考-行动-观察循环，能调用工具 |
| Tree of Thoughts | 探索多条推理路径 |
| 技巧选择 | 根据问题类型选择合适的技巧 |

---

## 6 新手常见误区

### 误区 1："CoT 总是比直接回答好"

**错！** CoT 的适用场景：
- ✅ 数学计算
- ✅ 逻辑推理
- ✅ 多步骤问题
- ❌ 简单事实查询
- ❌ 创意写作

### 误区 2："Self-Consistency 采样次数越多越好"

不对。采样次数需要权衡：
- 次数太少：效果提升有限
- 次数太多：成本过高
- 建议：3-5次通常足够

### 误区 3："ReAct 可以替代所有工具"

实际上：
- ReAct 需要定义清晰的工具接口
- 工具的执行需要代码支持
- 不是所有任务都需要外部工具
- 实现复杂度较高

### 误区 4："这些技巧可以解决所有问题"

要注意：
- 模型能力有上限
- 复杂问题可能需要微调
- 成本会显著增加
- 需要评估 ROI

---

## 7 动手练习

### 练习 1：基础练习 - CoT 推理

**任务**：使用思维链解决以下数学问题，展示完整的推理过程。

问题：一个水池有甲乙两个进水管。单独开甲管6小时可以注满，单独开乙管8小时可以注满。如果两管同时开，几小时可以注满？

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI

client = OpenAI()

prompt = """一个水池有甲乙两个进水管。单独开甲管6小时可以注满，单独开乙管8小时可以注满。如果两管同时开，几小时可以注满？

让我们一步一步思考：
1. 首先确定甲管和乙管每小时的注水速度
2. 然后计算两管同时开时每小时的总注水量
3. 最后计算注满水池需要的时间

请展示完整的计算过程："""

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}],
    temperature=0
)

print(response.choices[0].message.content)
```

</details>

### 练习 2：进阶练习 - Self-Consistency 实现

**任务**：实现一个 Self-Consistency 函数，对同一个问题进行3次采样，选择最一致的答案。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
from collections import Counter
import re

client = OpenAI()

def self_consistency_solve(question, n_samples=3):
    """Self-Consistency 求解"""
    
    answers = []
    
    for i in range(n_samples):
        prompt = f"""{question}

让我们一步一步思考，展示完整的推理过程："""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        answer = response.choices[0].message.content
        print(f"=== 第{i+1}次采样 ===\n{answer}\n")
        
        # 提取数字答案（简化版）
        numbers = re.findall(r'\d+', answer)
        if numbers:
            answers.append(numbers[-1])
    
    # 统计最一致的答案
    if answers:
        counter = Counter(answers)
        return counter.most_common(1)[0][0]
    return None

# 测试
question = "一个商品原价100元，先涨价20%，再打8折出售，最终售价是多少元？"
result = self_consistency_solve(question)
print(f"\n最终答案：{result}元")
```

</details>

### 练习 3（挑战）：综合练习 - ReAct Agent

**任务**：实现一个简单的 ReAct Agent，能够调用搜索和计算工具回答问题。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI

client = OpenAI()

# 定义工具
def search(query):
    """模拟搜索"""
    return f"搜索结果：关于'{query}'，我找到了相关信息..."

def calculate(expression):
    """计算数学表达式"""
    try:
        return str(eval(expression))
    except:
        return "计算错误"

def react_agent(question, max_steps=3):
    """ReAct Agent"""
    
    system_prompt = """你是一个智能助手，可以使用工具来帮助用户。

可用工具：
1. search(query): 搜索信息
2. calculate(expression): 计算数学表达式

请按以下格式回答：
Thought: 思考下一步该做什么
Action: 工具名称
Action Input: 工具参数
...（重复）
Thought: 我现在知道最终答案了
Final Answer: 最终答案"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question}
    ]
    
    for step in range(max_steps):
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0
        )
        
        output = response.choices[0].message.content
        print(f"Step {step+1}:\n{output}\n")
        
        # 检查是否完成
        if "Final Answer:" in output:
            return output.split("Final Answer:")[-1].strip()
        
        # 解析并执行工具
        if "Action:" in output:
            lines = output.split('\n')
            action = next((l.split("Action:")[-1].strip() for l in lines if "Action:" in l), None)
            action_input = next((l.split("Action Input:")[-1].strip() for l in lines if "Action Input:" in l), None)
            
            if action and action_input:
                # 执行工具
                if action == "search":
                    observation = search(action_input)
                elif action == "calculate":
                    observation = calculate(action_input)
                else:
                    observation = "工具不存在"
                
                messages.append({"role": "assistant", "content": output})
                messages.append({"role": "user", "content": f"Observation: {observation}"})
    
    return "未能找到答案"

# 测试
question = "搜索一下Python的创始人，然后计算 123 * 456 的结果"
answer = react_agent(question)
print(f"\n最终答案：{answer}")
```

</details>

---

## 下一章预告

下一章我们会学习 **Prompt 模板与工程化**——如何系统化管理和优化 Prompt。你会学到：

- Prompt 模板的设计原则
- 版本管理和 A/B 测试
- Prompt 库的构建方法
- 团队协作中的 Prompt 管理
- 自动化评估和优化
