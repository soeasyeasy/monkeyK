---
title: "第5章：Prompt 模板与工程化"
description: "Prompt 模板设计、版本管理、A/B 测试、Prompt 库构建"
---

# 第5章：Prompt 模板与工程化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何设计可复用的 Prompt 模板？
- 如何管理 Prompt 的版本？
- 如何进行 A/B 测试选择最优 Prompt？
- 如何构建团队共享的 Prompt 库？
- 如何自动化评估 Prompt 效果？

这一章就是为了解答这些问题。我们会学习 **Prompt 工程化的最佳实践**，让你的 Prompt 管理更加系统和高效。

---

## 1 为什么需要 Prompt 工程化？

### 痛点分析

**没有工程化管理的问题**：

1. **重复造轮子**：每个项目都重新写 Prompt
2. **版本混乱**：不知道哪个版本效果最好
3. **无法复用**：优秀的 Prompt 无法在团队共享
4. **难以优化**：没有系统化的评估方法

**举个例子**：

```
场景：团队开发 AI 客服系统

❌ 没有工程化：
- 每个开发者自己写 Prompt
- 版本混乱，不知道用哪个
- 效果好的 Prompt 无法共享
- 优化靠感觉，没有数据支撑

✅ 有工程化：
- 统一的 Prompt 模板库
- 版本管理，可追溯
- 团队共享，避免重复
- A/B 测试，数据驱动优化
```

### 解决方案

> **一句话总结**：Prompt 工程化就是像管理代码一样管理 Prompt，实现版本控制、复用和持续优化。

---

## 2 核心原理

### Prompt 工程化四要素

```
┌─────────────────────────────────────┐
│  1. 模板设计（Template Design）      │
│  2. 版本管理（Version Control）      │
│  3. A/B 测试（A/B Testing）          │
│  4. Prompt 库（Prompt Library）      │
└─────────────────────────────────────┘
```

---

## 3 基础用法

### Prompt 模板设计

```python
class PromptTemplate:
    """Prompt 模板基类"""
    
    def __init__(self, name, version, description):
        self.name = name
        self.version = version
        self.description = description
        self.variables = []
    
    def format(self, **kwargs):
        """格式化模板"""
        raise NotImplementedError
    
    def validate(self, **kwargs):
        """验证参数"""
        for var in self.variables:
            if var not in kwargs:
                raise ValueError(f"Missing variable: {var}")

# 示例：文本摘要模板
class SummaryTemplate(PromptTemplate):
    def __init__(self):
        super().__init__(
            name="text_summary",
            version="1.0.0",
            description="文本摘要模板"
        )
        self.variables = ["text", "word_count", "style"]
    
    def format(self, text, word_count=200, style="专业简洁"):
        self.validate(text=text, word_count=word_count, style=style)
        
        return f"""请对以下文本进行摘要。

要求：
1. 字数控制在{word_count}字以内
2. 保留关键信息
3. 使用{style}的语气

原文：
{text}

摘要："""

# 使用
template = SummaryTemplate()
prompt = template.format(
    text="这是一篇长文...",
    word_count=150,
    style="通俗易懂"
)
```

### 版本管理

```python
import json
from datetime import datetime

class PromptVersionManager:
    """Prompt 版本管理器"""
    
    def __init__(self, storage_path="prompts.json"):
        self.storage_path = storage_path
        self.prompts = self._load()
    
    def _load(self):
        """加载 Prompt 库"""
        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def _save(self):
        """保存 Prompt 库"""
        with open(self.storage_path, 'w', encoding='utf-8') as f:
            json.dump(self.prompts, f, ensure_ascii=False, indent=2)
    
    def add_version(self, name, content, changelog=""):
        """添加新版本"""
        if name not in self.prompts:
            self.prompts[name] = {
                "versions": [],
                "current": None
            }
        
        version = {
            "version": f"v{len(self.prompts[name]['versions']) + 1}.0.0",
            "content": content,
            "changelog": changelog,
            "created_at": datetime.now().isoformat()
        }
        
        self.prompts[name]["versions"].append(version)
        self.prompts[name]["current"] = version["version"]
        self._save()
        
        return version["version"]
    
    def get_current(self, name):
        """获取当前版本"""
        if name not in self.prompts:
            raise ValueError(f"Prompt '{name}' not found")
        
        current_version = self.prompts[name]["current"]
        for v in self.prompts[name]["versions"]:
            if v["version"] == current_version:
                return v["content"]
        
        raise ValueError("Current version not found")
    
    def list_versions(self, name):
        """列出所有版本"""
        if name not in self.prompts:
            raise ValueError(f"Prompt '{name}' not found")
        
        return [
            {
                "version": v["version"],
                "changelog": v["changelog"],
                "created_at": v["created_at"]
            }
            for v in self.prompts[name]["versions"]
        ]

# 使用示例
manager = PromptVersionManager()

# 添加版本
manager.add_version(
    name="customer_service",
    content="你是一个专业的客服...",
    changelog="初始版本"
)

manager.add_version(
    name="customer_service",
    content="你是一个友好专业的客服...",
    changelog="优化语气"
)

# 获取当前版本
current = manager.get_current("customer_service")
print(current)

# 查看版本历史
versions = manager.list_versions("customer_service")
for v in versions:
    print(f"{v['version']}: {v['changelog']}")
```

### A/B 测试

```python
import random
from collections import defaultdict

class PromptABTester:
    """Prompt A/B 测试器"""
    
    def __init__(self):
        self.tests = {}
        self.results = defaultdict(lambda: {"success": 0, "total": 0})
    
    def create_test(self, name, variants):
        """
        创建 A/B 测试
        
        Args:
            name: 测试名称
            variants: 变体列表 [{"name": "A", "prompt": "..."}, ...]
        """
        self.tests[name] = {
            "variants": variants,
            "created_at": datetime.now().isoformat()
        }
    
    def get_variant(self, name):
        """获取测试变体（随机分配）"""
        if name not in self.tests:
            raise ValueError(f"Test '{name}' not found")
        
        variants = self.tests[name]["variants"]
        return random.choice(variants)
    
    def record_result(self, test_name, variant_name, success):
        """记录测试结果"""
        key = f"{test_name}:{variant_name}"
        self.results[key]["total"] += 1
        if success:
            self.results[key]["success"] += 1
    
    def get_results(self, test_name):
        """获取测试结果统计"""
        results = {}
        for variant in self.tests[test_name]["variants"]:
            key = f"{test_name}:{variant['name']}"
            stats = self.results[key]
            if stats["total"] > 0:
                success_rate = stats["success"] / stats["total"]
            else:
                success_rate = 0
            
            results[variant["name"]] = {
                "success_rate": success_rate,
                "total": stats["total"],
                "success": stats["success"]
            }
        
        return results

# 使用示例
tester = PromptABTester()

# 创建测试
tester.create_test(
    name="summary_style",
    variants=[
        {"name": "professional", "prompt": "请用专业语气摘要..."},
        {"name": "casual", "prompt": "请用轻松语气摘要..."}
    ]
)

# 模拟测试
for _ in range(100):
    variant = tester.get_variant("summary_style")
    # 模拟使用（随机成功）
    success = random.random() > 0.5
    tester.record_result("summary_style", variant["name"], success)

# 查看结果
results = tester.get_results("summary_style")
for name, stats in results.items():
    print(f"{name}: 成功率 {stats['success_rate']:.2%} ({stats['total']}次)")
```

### Prompt 库构建

```python
class PromptLibrary:
    """Prompt 库"""
    
    def __init__(self):
        self.templates = {}
        self.categories = {}
    
    def register(self, category, name, template):
        """注册模板"""
        if category not in self.categories:
            self.categories[category] = []
        
        self.categories[category].append(name)
        self.templates[name] = template
    
    def get(self, name):
        """获取模板"""
        return self.templates.get(name)
    
    def list_by_category(self, category):
        """按分类列出模板"""
        return self.categories.get(category, [])
    
    def search(self, keyword):
        """搜索模板"""
        results = []
        for name, template in self.templates.items():
            if keyword.lower() in name.lower() or \
               keyword.lower() in template.description.lower():
                results.append(name)
        return results

# 构建 Prompt 库
library = PromptLibrary()

# 注册模板
library.register("文本处理", "摘要", SummaryTemplate())
library.register("文本处理", "翻译", TranslationTemplate())
library.register("代码", "代码审查", CodeReviewTemplate())

# 使用
summary_template = library.get("摘要")
prompt = summary_template.format(text="...", word_count=200)
```

---

## 4 进阶用法

### 自动化评估

```python
class PromptEvaluator:
    """Prompt 自动评估器"""
    
    def __init__(self, client):
        self.client = client
    
    def evaluate_quality(self, prompt, input_text, expected_output=None):
        """评估输出质量"""
        # 生成输出
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        output = response.choices[0].message.content
        
        # 使用另一个模型评估
        eval_prompt = f"""评估以下 AI 输出的质量：

输入：{input_text}
输出：{output}
{f'期望输出：{expected_output}' if expected_output else ''}

请从以下维度评分（1-10分）：
1. 准确性
2. 完整性
3. 相关性
4. 语言质量

输出格式：
{{"accuracy": 8, "completeness": 9, "relevance": 8, "language": 9, "overall": 8.5}}"""
        
        eval_response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": eval_prompt}],
            temperature=0
        )
        
        return eval_response.choices[0].message.content
    
    def batch_evaluate(self, template, test_cases):
        """批量评估"""
        results = []
        for case in test_cases:
            prompt = template.format(**case["input"])
            score = self.evaluate_quality(
                prompt, 
                str(case["input"]),
                case.get("expected")
            )
            results.append({
                "input": case["input"],
                "score": score
            })
        return results
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 模板设计 | 可复用、参数化、易维护 |
| 版本管理 | 追溯历史、回滚、协作 |
| A/B 测试 | 数据驱动选择最优 Prompt |
| Prompt 库 | 分类管理、快速检索 |
| 自动评估 | 量化指标、批量测试 |

---

## 6 新手常见误区

### 误区 1："Prompt 不需要版本管理"

**错！** Prompt 应该像代码一样管理：
- 记录变更历史
- 支持回滚
- 团队协作
- 持续优化

### 误区 2："A/B 测试样本越少越好"

不对。A/B 测试需要：
- 足够的样本量（至少100次）
- 随机分配
- 统计显著性检验
- 考虑置信区间

### 误区 3："Prompt 库越全越好"

实际上：
- 质量比数量重要
- 定期清理过时模板
- 保持模板简洁
- 文档要完善

---

## 7 动手练习

### 练习 1：基础练习 - 设计模板

**任务**：设计一个邮件生成的 Prompt 模板，支持自定义收件人、主题、语气。

<details>
<summary>点击查看答案</summary>

```python
class EmailTemplate(PromptTemplate):
    def __init__(self):
        super().__init__(
            name="email_generation",
            version="1.0.0",
            description="邮件生成模板"
        )
        self.variables = ["recipient", "subject", "tone", "content"]
    
    def format(self, recipient, subject, tone="正式", content=""):
        self.validate(
            recipient=recipient, 
            subject=subject, 
            tone=tone, 
            content=content
        )
        
        return f"""请撰写一封邮件。

收件人：{recipient}
主题：{subject}
语气：{tone}
要点：{content}

要求：
1. 格式规范（称呼、正文、结尾）
2. 语言得体
3. 简洁明了

邮件内容："""

# 使用
template = EmailTemplate()
prompt = template.format(
    recipient="张经理",
    subject="项目进度汇报",
    tone="正式",
    content="本周完成了需求分析，下周开始开发"
)
print(prompt)
```

</details>

### 练习 2：进阶练习 - A/B 测试

**任务**：实现一个简单的 A/B 测试，对比两种不同风格的 Prompt 效果。

<details>
<summary>点击查看答案</summary>

```python
from openai import OpenAI
import random

client = OpenAI()

def ab_test(prompt_a, prompt_b, test_inputs, n_tests=10):
    """A/B 测试"""
    results = {"A": [], "B": []}
    
    for i in range(n_tests):
        test_input = random.choice(test_inputs)
        
        # 测试 A
        response_a = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt_a.format(input=test_input)}]
        )
        output_a = response_a.choices[0].message.content
        
        # 测试 B
        response_b = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt_b.format(input=test_input)}]
        )
        output_b = response_b.choices[0].message.content
        
        # 人工评估（这里简化为长度比较）
        results["A"].append(len(output_a))
        results["B"].append(len(output_b))
    
    # 统计
    avg_a = sum(results["A"]) / len(results["A"])
    avg_b = sum(results["B"]) / len(results["B"])
    
    print(f"Prompt A 平均长度：{avg_a:.1f}")
    print(f"Prompt B 平均长度：{avg_b:.1f}")
    
    return "A" if avg_a > avg_b else "B"

# 测试
prompt_a = "请用专业语气总结：{input}"
prompt_b = "请用轻松语气总结：{input}"

test_inputs = ["人工智能的发展", "量子计算的原理", "区块链的应用"]

winner = ab_test(prompt_a, prompt_b, test_inputs)
print(f"获胜者：Prompt {winner}")
```

</details>

### 练习 3（挑战）：综合练习 - Prompt 库

**任务**：实现一个完整的 Prompt 库系统，支持注册、检索、版本管理。

<details>
<summary>点击查看答案</summary>

```python
import json
from datetime import datetime

class PromptLibrary:
    """完整的 Prompt 库系统"""
    
    def __init__(self, db_path="prompt_library.json"):
        self.db_path = db_path
        self.library = self._load()
    
    def _load(self):
        try:
            with open(self.db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {"templates": {}, "categories": {}}
    
    def _save(self):
        with open(self.db_path, 'w', encoding='utf-8') as f:
            json.dump(self.library, f, ensure_ascii=False, indent=2)
    
    def register(self, category, name, template, description=""):
        """注册模板"""
        # 添加到分类
        if category not in self.library["categories"]:
            self.library["categories"][category] = []
        if name not in self.library["categories"][category]:
            self.library["categories"][category].append(name)
        
        # 添加模板
        if name not in self.library["templates"]:
            self.library["templates"][name] = {
                "category": category,
                "description": description,
                "versions": [],
                "current_version": None
            }
        
        # 添加版本
        version = {
            "version": f"v{len(self.library['templates'][name]['versions']) + 1}.0.0",
            "template": template,
            "created_at": datetime.now().isoformat()
        }
        self.library["templates"][name]["versions"].append(version)
        self.library["templates"][name]["current_version"] = version["version"]
        
        self._save()
        return version["version"]
    
    def get(self, name):
        """获取当前版本"""
        if name not in self.library["templates"]:
            raise ValueError(f"Template '{name}' not found")
        
        template = self.library["templates"][name]
        current_version = template["current_version"]
        
        for v in template["versions"]:
            if v["version"] == current_version:
                return v["template"]
        
        raise ValueError("Current version not found")
    
    def search(self, keyword):
        """搜索模板"""
        results = []
        for name, data in self.library["templates"].items():
            if keyword.lower() in name.lower() or \
               keyword.lower() in data["description"].lower():
                results.append({
                    "name": name,
                    "category": data["category"],
                    "description": data["description"]
                })
        return results
    
    def list_categories(self):
        """列出所有分类"""
        return list(self.library["categories"].keys())
    
    def list_by_category(self, category):
        """按分类列出"""
        return self.library["categories"].get(category, [])

# 使用示例
lib = PromptLibrary()

# 注册模板
lib.register("文本处理", "摘要", "请摘要：{text}", "文本摘要")
lib.register("文本处理", "翻译", "请翻译：{text}", "文本翻译")
lib.register("代码", "审查", "请审查代码：{code}", "代码审查")

# 搜索
results = lib.search("文本")
print(f"搜索结果：{results}")

# 获取模板
template = lib.get("摘要")
print(f"模板：{template}")
```

</details>

---

## 下一章预告

下一章我们会学习 **结构化输出与格式控制**——如何让模型输出 JSON、表格等结构化数据。你会学到：

- JSON 模式的使用方法
- 函数调用（Function Calling）
- Schema 约束输出格式
- 输出解析与验证
- 错误处理
