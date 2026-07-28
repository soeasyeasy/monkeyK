---
title: "第10章：Agent 智能体开发"
description: "Agent 架构、ReAct 模式、任务规划、自主决策、多 Agent 协作"
---

# 第10章：Agent 智能体开发

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 AI Agent？和普通对话有什么区别？
- ReAct 模式是什么？
- 如何让 Agent 自主规划任务？
- 如何实现多 Agent 协作？
- Agent 有哪些实际应用场景？

这一章就是为了解答这些问题。我们会学习 **Agent 开发技术**，构建能够自主决策和执行任务的智能体。

---

## 1 为什么需要 Agent？

### 痛点分析

**普通对话的局限**：

1. **被动响应**：只能回答问题，不能主动行动
2. **单步执行**：一次只能做一件事
3. **无法规划**：不能分解复杂任务

**举个例子**：

```
❌ 普通对话：
用户：帮我订一张明天去北京的机票
AI：好的，请问您想要什么时间的航班？
用户：上午
AI：请问您需要经济舱还是商务舱？
...（需要多轮手动引导）

✅ Agent：
用户：帮我订一张明天去北京的机票
Agent：[自动规划任务]
  1. 查询明天去北京的航班
  2. 比较价格
  3. 推荐最优选项
  4. 等待用户确认
  5. 完成订票
Agent：已为您找到3个航班选项，推荐...
```

### 解决方案

> **一句话总结**：Agent 能够自主规划、决策和执行复杂任务。

---

## 2 核心原理

### Agent 架构

```
┌─────────────────────────────────────┐
│  感知（Perception）                  │
│  - 接收用户输入                      │
│  - 理解环境和上下文                  │
├─────────────────────────────────────┤
│  规划（Planning）                    │
│  - 分解任务                          │
│  - 制定执行计划                      │
├─────────────────────────────────────┤
│  行动（Action）                      │
│  - 调用工具                          │
│  - 执行操作                          │
├─────────────────────────────────────┤
│  反思（Reflection）                  │
│  - 评估结果                          │
│  - 调整策略                          │
└─────────────────────────────────────┘
```

### ReAct 模式

```
Thought: 思考下一步该做什么
Action: 调用工具
Observation: 观察工具返回结果
...（循环）
Final Answer: 最终答案
```

---

## 3 基础用法

### 简单的 ReAct Agent

```python
from openai import OpenAI
import json

client = OpenAI()

# 定义工具
tools = {
    "search": lambda query: f"搜索结果：{query}的相关信息",
    "calculate": lambda expr: str(eval(expr)),
    "get_weather": lambda city: f"{city}：晴，25°C"
}

def react_agent(question, max_steps=5):
    """ReAct Agent"""
    
    system_prompt = """你是一个智能助手，可以使用工具解决问题。

可用工具：
- search(query): 搜索信息
- calculate(expression): 计算
- get_weather(city): 获取天气

按以下格式回答：
Thought: 思考过程
Action: 工具名称
Action Input: 参数
Observation: 工具结果
...（循环）
Thought: 得到最终答案
Final Answer: 答案"""
    
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
            
            if action and action_input and action in tools:
                observation = tools[action](action_input)
                messages.append({"role": "assistant", "content": output})
                messages.append({"role": "user", "content": f"Observation: {observation}"})
            else:
                messages.append({"role": "assistant", "content": output})
                messages.append({"role": "user", "content": "请继续"})
        else:
            messages.append({"role": "assistant", "content": output})
            messages.append({"role": "user", "content": "请继续"})
    
    return "未能找到答案"

# 测试
result = react_agent("北京天气怎么样？如果25°C，转换成华氏度是多少？")
print(f"\n最终答案：{result}")
```

### 任务规划 Agent

```python
class PlanningAgent:
    """任务规划 Agent"""
    
    def __init__(self):
        self.client = OpenAI()
        self.tools = {
            "search": lambda q: f"搜索：{q}",
            "email": lambda to, content: f"发送邮件给{to}",
            "calendar": lambda date, event: f"添加日程：{event}"
        }
    
    def plan(self, task):
        """制定执行计划"""
        prompt = f"""请将以下任务分解为具体步骤：

任务：{task}

输出 JSON 格式：
{{
    "steps": [
        {{"action": "工具名", "params": {{}}, "description": "步骤描述"}},
        ...
    ]
}}"""
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        plan = json.loads(response.choices[0].message.content)
        return plan["steps"]
    
    def execute(self, plan):
        """执行计划"""
        results = []
        for step in plan:
            action = step["action"]
            params = step["params"]
            
            if action in self.tools:
                result = self.tools[action](**params)
                results.append({"step": step, "result": result})
                print(f"执行：{step['description']} → {result}")
            else:
                print(f"工具不存在：{action}")
        
        return results
    
    def run(self, task):
        """运行 Agent"""
        print(f"任务：{task}\n")
        
        # 规划
        print("制定计划...")
        plan = self.plan(task)
        print(f"计划：{json.dumps(plan, ensure_ascii=False, indent=2)}\n")
        
        # 执行
        print("执行计划...")
        results = self.execute(plan)
        
        return results

# 使用
agent = PlanningAgent()
agent.run("帮我安排明天的日程：上午10点开会，下午给客户发邮件")
```

### 多 Agent 协作

```python
class MultiAgentSystem:
    """多 Agent 协作系统"""
    
    def __init__(self):
        self.client = OpenAI()
        self.agents = {
            "planner": "你是一个任务规划专家，擅长分解复杂任务",
            "executor": "你是一个执行专家，擅长调用工具完成任务",
            "reviewer": "你是一个审查专家，擅长评估结果质量"
        }
    
    def run(self, task):
        """运行多 Agent 系统"""
        
        # 1. Planner 规划
        print("=== Planner ===")
        planner_response = self._ask_agent("planner", f"请分解任务：{task}")
        print(planner_response)
        
        # 2. Executor 执行
        print("\n=== Executor ===")
        executor_response = self._ask_agent("executor", f"请执行以下计划：\n{planner_response}")
        print(executor_response)
        
        # 3. Reviewer 审查
        print("\n=== Reviewer ===")
        reviewer_response = self._ask_agent("reviewer", f"请评估执行结果：\n{executor_response}")
        print(reviewer_response)
        
        return reviewer_response
    
    def _ask_agent(self, agent_type, message):
        """向特定 Agent 提问"""
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": self.agents[agent_type]},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content

# 使用
system = MultiAgentSystem()
result = system.run("开发一个简单的待办事项应用")
```

---

## 4 进阶用法

### 带记忆的 Agent

```python
class MemoryAgent:
    """带记忆的 Agent"""
    
    def __init__(self):
        self.client = OpenAI()
        self.memory = []
        self.tools = {
            "search": lambda q: f"搜索：{q}",
            "calculate": lambda e: str(eval(e))
        }
    
    def add_to_memory(self, role, content):
        """添加到记忆"""
        self.memory.append({"role": role, "content": content})
    
    def run(self, task):
        """运行 Agent"""
        self.add_to_memory("user", task)
        
        # 构建上下文
        messages = [{"role": "system", "content": "你是一个智能助手"}]
        messages.extend(self.memory[-10:])  # 保留最近10条
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=messages
        )
        
        result = response.choices[0].message.content
        self.add_to_memory("assistant", result)
        
        return result

# 使用
agent = MemoryAgent()
print(agent.run("我叫张三"))
print(agent.run("我今年25岁"))
print(agent.run("我叫什么？多大了？"))  # 能记住之前的信息
```

### 自适应 Agent

```python
class AdaptiveAgent:
    """自适应 Agent"""
    
    def __init__(self):
        self.client = OpenAI()
        self.tools = {
            "simple": lambda q: f"简单回答：{q}",
            "search": lambda q: f"搜索：{q}",
            "calculate": lambda e: str(eval(e))
        }
    
    def select_tool(self, task):
        """选择合适的工具"""
        prompt = f"""根据任务选择合适的工具：

任务：{task}

可用工具：
- simple: 简单问答
- search: 需要搜索信息
- calculate: 需要计算

输出工具名称："""
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        
        tool = response.choices[0].message.content.strip()
        return tool if tool in self.tools else "simple"
    
    def run(self, task):
        """运行 Agent"""
        tool = self.select_tool(task)
        print(f"选择工具：{tool}")
        
        result = self.tools[tool](task)
        return result

# 使用
agent = AdaptiveAgent()
print(agent.run("1+1等于几？"))  # 可能选择 calculate
print(agent.run("Python 是什么？"))  # 可能选择 search
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Agent 架构 | 感知-规划-行动-反思 |
| ReAct 模式 | Thought-Action-Observation 循环 |
| 任务规划 | 分解复杂任务为步骤 |
| 多 Agent 协作 | 不同角色分工合作 |
| 记忆机制 | 保持上下文和历史 |

---

## 6 新手常见误区

### 误区 1："Agent 可以解决所有问题"

**错！** Agent 适用场景：
- ✅ 多步骤任务
- ✅ 需要工具调用
- ❌ 简单问答
- ❌ 实时性要求高

### 误区 2："Agent 不需要规划"

不对。规划的作用：
- 分解复杂任务
- 避免盲目行动
- 提高效率

### 误区 3："多 Agent 总是比单 Agent 好"

实际上：
- 多 Agent 更复杂
- 通信成本高
- 简单任务单 Agent 就够

---

## 7 动手练习

### 练习 1：基础练习 - ReAct Agent

**任务**：实现一个简单的 ReAct Agent，能够调用搜索和计算工具。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI

client = OpenAI()

tools = {
    "search": lambda q: f"搜索结果：{q}",
    "calculate": lambda e: str(eval(e))
}

def react_agent(question):
    messages = [
        {"role": "system", "content": "使用 search 或 calculate 工具。格式：Thought/Action/Action Input/Observation"},
        {"role": "user", "content": question}
    ]
    
    for _ in range(3):
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages
        )
        
        output = response.choices[0].message.content
        
        if "Final Answer:" in output:
            return output.split("Final Answer:")[-1].strip()
        
        if "Action:" in output:
            # 解析并执行工具
            lines = output.split('\n')
            action = next((l.split(":")[-1].strip() for l in lines if "Action:" in l), None)
            action_input = next((l.split(":")[-1].strip() for l in lines if "Action Input:" in l), None)
            
            if action in tools:
                result = tools[action](action_input)
                messages.append({"role": "assistant", "content": output})
                messages.append({"role": "user", "content": f"Observation: {result}"})
    
    return "未完成"

print(react_agent("计算 123 * 456"))
```

</details>

### 练习 2：进阶练习 - 任务规划

**任务**：实现一个任务规划 Agent，能够将复杂任务分解为步骤。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
import json

client = OpenAI()

def plan_task(task):
    prompt = f"""分解任务为步骤：

任务：{task}

输出 JSON：
{{"steps": ["步骤1", "步骤2", ...]}}"""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)["steps"]

steps = plan_task("开发一个电商网站")
for i, step in enumerate(steps, 1):
    print(f"{i}. {step}")
```

</details>

### 练习 3（挑战）：综合练习 - 多 Agent 系统

**任务**：实现一个多 Agent 系统，包含规划者、执行者和审查者。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI

client = OpenAI()

agents = {
    "planner": "你是任务规划专家",
    "executor": "你是任务执行专家",
    "reviewer": "你是质量审查专家"
}

def multi_agent_system(task):
    # 规划
    plan = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": agents["planner"]},
            {"role": "user", "content": f"规划任务：{task}"}
        ]
    ).choices[0].message.content
    
    # 执行
    result = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": agents["executor"]},
            {"role": "user", "content": f"执行计划：\n{plan}"}
        ]
    ).choices[0].message.content
    
    # 审查
    review = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": agents["reviewer"]},
            {"role": "user", "content": f"审查结果：\n{result}"}
        ]
    ).choices[0].message.content
    
    return review

print(multi_agent_system("写一篇技术博客"))
```

</details>

---

## 下一章预告

下一章我们会学习 **LangChain 框架实战**——使用 LangChain 快速构建 AI 应用。
