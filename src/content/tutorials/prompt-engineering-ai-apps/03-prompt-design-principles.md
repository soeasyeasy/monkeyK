---
title: "第3章：Prompt 设计核心原则"
description: "清晰明确、具体指令、角色设定、输出格式控制、Few-shot 示例"
---

# 第3章：Prompt 设计核心原则

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么样的 Prompt 才是好的 Prompt？
- 为什么我的 Prompt 总是得到不理想的结果？
- 如何让模型理解我的真实意图？
- 如何控制输出的格式和质量？
- 什么是 Few-shot，怎么使用？

这一章就是为了解答这些问题。我们会学习 **Prompt 设计的核心原则**，掌握写出高质量 Prompt 的技巧，让你的 AI 应用更加可靠和高效。

---

## 1 为什么需要 Prompt 设计原则？

### 痛点分析

**没有原则指导的问题**：

1. **回答不稳定**：同样的问题，不同的问法得到不同的答案
2. **格式混乱**：有时输出文本，有时输出列表，难以解析
3. **质量不一致**：有时很好，有时答非所问
4. **无法复用**：每次都要重新摸索，没有可复用的模板

**举个例子**：

```
❌ 糟糕的 Prompt：
"帮我分析一下这个数据"

问题：
- 什么数据？（没说清楚）
- 分析什么方面？（没具体说明）
- 输出什么格式？（没要求）
- 分析深度如何？（没标准）

✅ 好的 Prompt：
"你是一个数据分析师。请分析以下销售数据，找出：
1. 销售额最高的3个月份
2. 环比增长最快的月份
3. 可能存在的季节性规律

数据：[1月: 100万, 2月: 120万, 3月: 90万...]

请以表格形式输出分析结果，并给出简短结论。"
```

### 解决方案

> **一句话总结**：好的 Prompt 应该清晰明确、具体可执行、格式可控、质量稳定。

打个比方：

> 想象你在给一个聪明的实习生布置任务：
> 
> ❌ 模糊的任务："帮我写个报告"
> - 实习生不知道写什么主题
> - 不知道要多长
> - 不知道给谁看
> - 结果可能完全不符合预期
> 
> ✅ 清晰的任务："帮我写一份给 CEO 的月度销售报告，包含：
> 1. 本月销售额对比上月
> 2. 各产品线表现
> 3. 下月预测
> 要求：500字以内，用图表展示，语气专业简洁"
> - 目标明确
> - 内容具体
> - 格式清晰
> - 结果可预期

---

## 2 核心原理

### Prompt 设计五原则

```
┌─────────────────────────────────────┐
│  1. 清晰明确（Clarity）              │
│  2. 具体指令（Specificity）          │
│  3. 角色设定（Role）                 │
│  4. 格式控制（Format）               │
│  5. 示例引导（Few-shot）             │
└─────────────────────────────────────┘
```

### 原则详解

| 原则 | 说明 | 示例 |
|------|------|------|
| 清晰明确 | 避免歧义，用词准确 | ❌ "分析一下" → ✅ "分析销售额趋势" |
| 具体指令 | 明确任务要求和约束 | ❌ "写个文案" → ✅ "写150字小红书文案" |
| 角色设定 | 给模型一个身份 | "你是一个资深产品经理" |
| 格式控制 | 规定输出格式 | "以JSON格式输出" |
| 示例引导 | 提供参考答案 | "例如：{'name': '张三', 'age': 25}" |

---

## 3 基础用法

### 原则 1：清晰明确

**核心要点**：
- 使用简单直接的词汇
- 避免模糊表达
- 一次只问一个问题

```python
# ❌ 模糊的 Prompt
prompt1 = "帮我优化一下这段代码"

# ✅ 清晰的 Prompt
prompt2 = """请优化以下 Python 代码的性能：

代码：
```python
def find_duplicates(lst):
    result = []
    for i in range(len(lst)):
        for j in range(i+1, len(lst)):
            if lst[i] == lst[j] and lst[i] not in result:
                result.append(lst[i])
    return result
```

优化要求：
1. 时间复杂度从 O(n²) 降到 O(n)
2. 保持功能不变
3. 添加类型注解
4. 给出优化前后的复杂度对比"""
```

### 原则 2：具体指令

**核心要点**：
- 明确任务范围
- 给出具体的约束条件
- 说明期望的输出长度

```python
# ❌ 不具体的 Prompt
prompt1 = "写一篇文章"

# ✅ 具体的 Prompt
prompt2 = """写一篇关于人工智能在医疗领域应用的技术博客文章。

要求：
1. 目标读者：医疗行业从业者，非技术背景
2. 字数：1500-2000字
3. 结构：
   - 引言（200字）：AI 在医疗的重要性
   - 主体（1200字）：3个具体应用场景
   - 结论（300字）：未来展望
4. 语气：专业但易懂
5. 包含：至少2个真实案例
6. 避免：过于技术化的术语"""
```

### 原则 3：角色设定

**核心要点**：
- 给模型一个明确的身份
- 说明角色的专业背景
- 定义角色的行为准则

```python
# 角色设定示例
prompts = {
    "产品经理": """你是一位有10年经验的产品经理，擅长用户需求和产品设计。
请分析以下用户反馈，提炼核心需求，并给出产品改进建议。

用户反馈：...

请从以下角度分析：
1. 用户的核心痛点是什么？
2. 现有解决方案的不足？
3. 优先级排序（P0/P1/P2）
4. 具体的改进方案""",

    "技术专家": """你是一位资深后端工程师，精通 Python 和分布式系统。
请评审以下代码，指出潜在问题并给出优化建议。

代码：...

请从以下角度评审：
1. 代码质量（可读性、可维护性）
2. 性能问题
3. 安全隐患
4. 最佳实践符合度
5. 具体的改进代码""",

    "营销专家": """你是一位数字营销专家，擅长社交媒体运营和内容营销。
请为以下产品制定小红书推广策略。

产品信息：...

请输出：
1. 目标用户画像
2. 内容策略（3个方向）
3. 5个标题示例
4. 发布时间建议
5. 预期效果指标"""
}
```

### 原则 4：格式控制

**核心要点**：
- 明确输出格式（JSON、Markdown、表格等）
- 给出格式示例
- 说明字段要求

```python
# JSON 格式输出
prompt_json = """分析以下用户评论，提取关键信息并以 JSON 格式输出。

用户评论："这个产品太棒了！我用了3个月，皮肤明显变好，价格也实惠，才99元。强烈推荐！"

输出格式：
{
    "sentiment": "positive/negative/neutral",
    "key_points": ["优点1", "优点2", ...],
    "duration": "使用时长",
    "price": 价格数字,
    "recommendation": true/false
}

要求：
1. sentiment 只能是 positive/negative/neutral
2. key_points 最多5个
3. price 必须是数字
4. recommendation 必须是布尔值"""

# 表格格式输出
prompt_table = """对比分析 Python、Java、Go 三种编程语言。

请以 Markdown 表格形式输出：

| 特性 | Python | Java | Go |
|------|--------|------|-----|
| 类型系统 | ... | ... | ... |
| 并发模型 | ... | ... | ... |
| 学习曲线 | ... | ... | ... |
| 性能 | ... | ... | ... |
| 主要应用 | ... | ... | ... |

要求：
1. 每个特性用简短的词语描述
2. 对比要客观准确
3. 至少包含5个特性"""
```

### 原则 5：示例引导（Few-shot）

**核心要点**：
- 提供2-3个示例
- 示例要覆盖不同情况
- 示例格式要统一

```python
# Few-shot 示例
prompt_fewshot = """将用户评论分类为正面、负面或中性。

示例1：
评论："这个产品太好用了，强烈推荐！"
分类：正面

示例2：
评论："质量一般，不太值这个价格"
分类：负面

示例3：
评论："收到货了，还可以"
分类：中性

现在请分类以下评论：
评论："用了一个月，感觉没什么效果，有点失望"
分类："""

# 使用示例
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt_fewshot}],
    temperature=0  # 使用0确保一致性
)

print(response.choices[0].message.content)  # 输出：负面
```

---

## 4 进阶用法

### 组合使用多个原则

```python
def generate_product_analysis(product_info):
    """
    生成产品分析报告
    
    组合使用：角色设定 + 具体指令 + 格式控制 + Few-shot
    """
    prompt = f"""你是一位资深产品分析师，有10年消费品分析经验。

请分析以下产品，并给出专业的市场分析报告。

产品信息：
{product_info}

分析要求：
1. 目标市场定位
2. 竞争优势分析（至少3点）
3. 潜在风险（至少2点）
4. 改进建议（至少3条）

输出格式（严格遵循）：
```markdown
# 产品分析报告

## 一、市场定位
- 目标用户：...
- 价格区间：...
- 核心卖点：...

## 二、竞争优势
1. ...
2. ...
3. ...

## 三、潜在风险
1. ...
2. ...

## 四、改进建议
1. ...
2. ...
3. ...

## 五、总结
...
```

示例参考：
产品：智能手环
分析：
- 目标用户：25-40岁健康意识强的都市白领
- 竞争优势：1) 医疗级传感器 2) 7天续航 3) AI健康顾问
...

请开始分析："""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    
    return response.choices[0].message.content
```

### Prompt 模板库

```python
class PromptTemplates:
    """Prompt 模板库"""
    
    # 文本摘要模板
    SUMMARY = """请对以下文本进行摘要。

要求：
1. 字数控制在{word_count}字以内
2. 保留关键信息
3. 使用{style}的语气

原文：
{text}

摘要："""

    # 代码审查模板
    CODE_REVIEW = """你是一位资深{language}工程师。
请审查以下代码，指出问题并给出改进建议。

代码：
```{language}
{code}
```

请从以下角度审查：
1. 代码质量
2. 性能问题
3. 安全隐患
4. 最佳实践
5. 改进代码"""

    # 翻译模板
    TRANSLATION = """将以下文本从{source_lang}翻译成{target_lang}。

要求：
1. 保持原文的语气和风格
2. 专业术语准确
3. 符合{target_lang}的表达习惯

原文：
{text}

翻译："""

    # 使用示例
    summary_prompt = PromptTemplates.SUMMARY.format(
        word_count=200,
        style="专业简洁",
        text="这是一篇长文..."
    )
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 清晰明确 | 避免歧义，用词准确，一次一个问题 |
| 具体指令 | 明确任务范围、约束条件、输出长度 |
| 角色设定 | 给模型一个身份，定义专业背景和行为准则 |
| 格式控制 | 规定输出格式（JSON/Markdown/表格），给出示例 |
| Few-shot | 提供2-3个示例，覆盖不同情况 |
| 组合使用 | 多个原则组合，效果更佳 |

---

## 6 新手常见误区

### 误区 1："Prompt 越短越好"

**错！** Prompt 应该：
- **足够清晰**：避免歧义
- **足够具体**：明确要求和约束
- **足够详细**：包含必要的上下文

短 Prompt 的问题：
- 模型需要猜测你的意图
- 结果不可控
- 需要多次调整

### 误区 2："角色设定不重要"

不对。角色设定的作用：
- **激活专业知识**：让模型调用特定领域的知识
- **规范行为**：控制输出的风格和质量
- **提高准确性**：在专业任务上表现更好

```python
# ❌ 没有角色设定
prompt1 = "分析一下这个数据"

# ✅ 有角色设定
prompt2 = "你是一位数据分析师，有10年经验。请分析以下数据..."
```

### 误区 3："不需要给出示例"

实际上：
- 示例是最有效的指导方式
- 能显著提高输出质量
- 减少歧义和误解
- 特别适用于分类、格式化任务

### 误区 4："Temperature 总是设0.7"

不对。Temperature 应该根据任务调整：
- **创意写作**：0.7-0.9（更随机）
- **事实问答**：0.3-0.5（更确定）
- **代码生成**：0.2-0.4（更规范）
- **分类任务**：0（完全确定）

### 误区 5："一个 Prompt 能解决所有问题"

实际上：
- 不同任务需要不同的 Prompt 策略
- 需要持续测试和优化
- 要建立 Prompt 库，积累最佳实践
- 要考虑成本（token 消耗）

---

## 7 动手练习

### 练习 1：基础练习 - 优化 Prompt

**任务**：将以下模糊的 Prompt 改造成符合五原则的高质量 Prompt。

原始 Prompt："帮我写个产品介绍"

<details>
<summary>点击查看答案</summary>

```python
# 优化后的 Prompt
optimized_prompt = """你是一位资深营销专家，擅长产品文案创作。

请为以下产品撰写一段小红书推广文案。

产品信息：
- 名称：智能保温杯 Pro
- 核心功能：温度显示、饮水提醒、316不锈钢
- 价格：199元
- 目标用户：25-35岁注重健康的上班族

要求：
1. 字数：150字以内
2. 语气：活泼、亲切、有感染力
3. 结构：
   - 开头：引起共鸣的痛点
   - 中间：产品卖点展示
   - 结尾：行动号召
4. 包含3-5个相关emoji
5. 突出"智能"和"健康"两个关键词

示例风格：
"姐妹们！今天给大家分享一个我最近入手的宝藏好物～..."

请直接输出文案内容："""
```

</details>

### 练习 2：进阶练习 - 设计 Prompt 模板

**任务**：设计一个代码审查的 Prompt 模板，支持不同编程语言，输出结构化的审查报告。

<details>
<summary>点击查看答案</summary>

```python
class CodeReviewTemplate:
    """代码审查 Prompt 模板"""
    
    def __init__(self, language, focus_areas=None):
        self.language = language
        self.focus_areas = focus_areas or [
            "代码质量",
            "性能优化",
            "安全隐患",
            "最佳实践"
        ]
    
    def generate(self, code):
        """生成代码审查 Prompt"""
        focus_text = "\n".join([f"{i+1}. {area}" for i, area in enumerate(self.focus_areas)])
        
        prompt = f"""你是一位资深{self.language}工程师，有10年开发经验。
请审查以下{self.language}代码，给出专业的审查报告。

代码：
```{self.language}
{code}
```

请从以下角度进行审查：
{focus_text}

输出格式（严格遵循）：
```markdown
# 代码审查报告

## 1. 总体评价
- 代码质量：⭐⭐⭐⭐☆（1-5星）
- 主要问题：...

## 2. 详细问题

### 2.1 代码质量
- 问题1：...
  - 位置：第X行
  - 建议：...

### 2.2 性能问题
- 问题1：...
  - 影响：...
  - 优化方案：...

### 2.3 安全隐患
- 问题1：...
  - 风险等级：高/中/低
  - 修复建议：...

### 2.4 最佳实践
- 建议1：...
  - 原因：...

## 3. 改进代码
```{self.language}
// 改进后的完整代码
```

## 4. 总结
...
```"""
        
        return prompt

# 使用示例
template = CodeReviewTemplate(
    language="Python",
    focus_areas=["代码质量", "性能优化", "类型安全"]
)

code = """
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result
"""

prompt = template.generate(code)
print(prompt)
```

</details>

### 练习 3（挑战）：综合练习 - Few-shot 分类器

**任务**：使用 Few-shot 方法，设计一个情感分类器，能够准确分类用户评论的情感（正面/负面/中性）。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI

class SentimentClassifier:
    """基于 Few-shot 的情感分类器"""
    
    def __init__(self):
        self.client = OpenAI()
        
        # Few-shot 示例
        self.examples = [
            {"text": "这个产品太棒了，强烈推荐！", "label": "正面"},
            {"text": "质量很差，后悔买了", "label": "负面"},
            {"text": "收到货了，一般般吧", "label": "中性"},
            {"text": "用了一个月，感觉还不错", "label": "正面"},
            {"text": "客服态度很差，体验不好", "label": "负面"},
        ]
    
    def classify(self, text):
        """分类文本情感"""
        # 构建 Few-shot Prompt
        prompt = "请将以下用户评论分类为正面、负面或中性。\n\n"
        
        # 添加示例
        for example in self.examples:
            prompt += f"评论：{example['text']}\n"
            prompt += f"分类：{example['label']}\n\n"
        
        # 添加待分类文本
        prompt += f"评论：{text}\n"
        prompt += "分类："
        
        # 调用模型
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0  # 确保一致性
        )
        
        result = response.choices[0].message.content.strip()
        
        # 验证输出
        if result not in ["正面", "负面", "中性"]:
            raise ValueError(f"Invalid classification: {result}")
        
        return result

# 测试
classifier = SentimentClassifier()

test_cases = [
    "这个产品太好用了，非常满意！",
    "太差了，根本不能用",
    "还行吧，没什么特别的",
    "物超所值，下次还买",
    "一般般，不太值这个价格"
]

for text in test_cases:
    label = classifier.classify(text)
    print(f"{text} → {label}")
```

</details>

---

## 下一章预告

下一章我们会学习 **Prompt 进阶技巧**——包括 Chain-of-Thought、Self-Consistency、ReAct 等高级策略。你会学到：

- 思维链（CoT）的原理和应用
- 自我一致性（Self-Consistency）提升准确性
- ReAct 模式结合推理和行动
- 如何选择合适的技巧
- 实际应用场景和案例
