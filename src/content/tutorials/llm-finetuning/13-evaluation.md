---
title: "第13章：模型评估与质量分析"
description: "掌握模型评估方法，包括自动评估、人工评估和质量分析"
---

# 第13章：模型评估与质量分析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何评估微调后的模型效果？
- 有哪些评估指标？
- 自动评估和人工评估怎么选？
- 如何分析模型的问题？

这一章会讲解 **模型评估的完整方法**。我们会从 **评估指标** 开始，逐步学习 **自动评估**、**人工评估**、**质量分析** 等技巧。

---

## 1 评估指标

### 生成任务指标

```python
from rouge import Rouge
from nltk.translate.bleu_score import sentence_bleu

# BLEU（双语评估替换）
# 衡量生成文本与参考文本的 n-gram 重叠
reference = "你好世界"
hypothesis = "你好，世界"
bleu_score = sentence_bleu([reference.split()], hypothesis.split())
print(f"BLEU: {bleu_score:.4f}")

# ROUGE（召回导向摘要评估）
# 衡量生成文本与参考文本的重叠
rouge = Rouge()
scores = rouge.get_scores(hypothesis, reference)
print(f"ROUGE-1: {scores[0]['rouge-1']['f']:.4f}")
print(f"ROUGE-2: {scores[0]['rouge-2']['f']:.4f}")
print(f"ROUGE-L: {scores[0]['rouge-l']['f']:.4f}")
```

### 分类任务指标

```python
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# 准确率
y_true = [0, 1, 1, 0, 1]
y_pred = [0, 1, 0, 0, 1]

accuracy = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred)
recall = recall_score(y_true, y_pred)
f1 = f1_score(y_true, y_pred)

print(f"准确率: {accuracy:.4f}")
print(f"精确率: {precision:.4f}")
print(f"召回率: {recall:.4f}")
print(f"F1: {f1:.4f}")
```

---

## 2 自动评估

### 使用 GPT 评估

```python
from openai import OpenAI

client = OpenAI()

def evaluate_with_gpt(prompt, response, reference):
    """
    使用 GPT 评估生成质量
    """
    eval_prompt = f"""
请评估以下回答的质量（1-5 分）：

问题：{prompt}
参考回答：{reference}
模型回答：{response}

请从以下维度评分：
1. 准确性（0-5）
2. 相关性（0-5）
3. 流畅性（0-5）
4. 完整性（0-5）

输出格式：
准确性: X
相关性: X
流畅性: X
完整性: X
总分: X
"""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": eval_prompt}],
        temperature=0,
    )
    
    return response.choices[0].message.content

# 使用示例
result = evaluate_with_gpt(
    prompt="什么是机器学习？",
    response="机器学习是人工智能的一个分支...",
    reference="机器学习是一种让计算机从数据中学习的方法..."
)
print(result)
```

### 批量评估

```python
def batch_evaluate(test_data, model, tokenizer):
    """
    批量评估模型
    """
    results = []
    
    for item in test_data:
        # 生成回答
        inputs = tokenizer(item["prompt"], return_tensors="pt")
        outputs = model.generate(**inputs, max_new_tokens=200)
        generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 计算指标
        bleu = sentence_bleu([item["reference"].split()], generated.split())
        rouge_scores = rouge.get_scores(generated, item["reference"])
        
        results.append({
            "prompt": item["prompt"],
            "generated": generated,
            "reference": item["reference"],
            "bleu": bleu,
            "rouge-1": rouge_scores[0]["rouge-1"]["f"],
        })
    
    # 计算平均指标
    avg_bleu = sum(r["bleu"] for r in results) / len(results)
    avg_rouge = sum(r["rouge-1"] for r in results) / len(results)
    
    print(f"平均 BLEU: {avg_bleu:.4f}")
    print(f"平均 ROUGE-1: {avg_rouge:.4f}")
    
    return results
```

---

## 3 人工评估

### 评估表格

```python
# 人工评估模板
evaluation_template = {
    "样本 ID": "001",
    "问题": "什么是机器学习？",
    "模型回答": "...",
    "评估维度": {
        "准确性": "1-5 分",
        "相关性": "1-5 分",
        "流畅性": "1-5 分",
        "完整性": "1-5 分",
        "有害性": "0-1（0=无害，1=有害）",
    },
    "总体评分": "1-5 分",
    "备注": "改进建议",
}

# 评估指南
guidelines = """
1. 准确性：回答是否正确
2. 相关性：回答是否切题
3. 流畅性：语言是否自然
4. 完整性：是否覆盖要点
5. 有害性：是否包含有害内容
"""
```

### 评估脚本

```python
import pandas as pd

def create_evaluation_sheet(test_data, model_outputs):
    """
    创建人工评估表格
    """
    data = []
    
    for i, (test, output) in enumerate(zip(test_data, model_outputs)):
        data.append({
            "ID": i + 1,
            "问题": test["prompt"],
            "模型回答": output,
            "准确性": "",
            "相关性": "",
            "流畅性": "",
            "完整性": "",
            "总体评分": "",
            "备注": "",
        })
    
    df = pd.DataFrame(data)
    df.to_excel("evaluation_sheet.xlsx", index=False)
    print("评估表格已生成：evaluation_sheet.xlsx")
```

---

## 4 质量分析

### 错误分析

```python
def error_analysis(results):
    """
    分析模型错误
    """
    errors = {
        "事实错误": [],
        "逻辑错误": [],
        "语言问题": [],
        "不完整": [],
    }
    
    for result in results:
        if result["rouge-1"] < 0.3:
            # 低分样本
            errors["不完整"].append(result)
        
        # 可以添加更多分析逻辑
    
    # 统计错误分布
    for error_type, samples in errors.items():
        print(f"{error_type}: {len(samples)} 个样本")
    
    return errors
```

### 可视化

```python
import matplotlib.pyplot as plt

def plot_metrics(results):
    """
    可视化评估指标
    """
    metrics = ["bleu", "rouge-1"]
    scores = [sum(r[m] for r in results) / len(results) for m in metrics]
    
    plt.bar(metrics, scores)
    plt.ylabel("Score")
    plt.title("Model Evaluation Metrics")
    plt.show()
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **BLEU** | 衡量 n-gram 重叠 |
| **ROUGE** | 衡量摘要质量 |
| **GPT 评估** | 使用 GPT 自动评分 |
| **人工评估** | 多维度人工打分 |
| **错误分析** | 找出模型弱点 |

---

## 6 动手练习

### 练习 1：实现评估函数

实现一个完整的评估函数。

<details>
<summary>点击查看答案</summary>

```python
def evaluate_model(model, tokenizer, test_data):
    results = []
    for item in test_data:
        # 生成
        inputs = tokenizer(item["prompt"], return_tensors="pt")
        outputs = model.generate(**inputs, max_new_tokens=200)
        generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 评估
        bleu = sentence_bleu([item["reference"].split()], generated.split())
        
        results.append({"generated": generated, "bleu": bleu})
    
    return results
```

</details>

---

## 下一章预告

下一章我们会学习 **微调常见问题与调试**——如何解决训练中的各种问题。你会学到过拟合、灾难性遗忘等问题的解决方案。让我们继续！
