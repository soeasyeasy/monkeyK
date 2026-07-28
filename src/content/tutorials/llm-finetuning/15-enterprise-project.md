---
title: "第15章：企业级微调项目实战"
description: "完整的企业级微调项目流程，从需求分析到部署上线的全流程实战"
---

# 第15章：企业级微调项目实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 企业级微调项目包含哪些环节？
- 如何评估项目可行性？
- 怎样选择合适的技术方案？
- 部署上线需要注意什么？

这一章会通过一个 **完整的企业级项目案例**，带你走完从需求分析到部署上线的全流程。

---

## 1 项目背景与需求分析

### 项目案例：智能客服系统

```python
# 项目背景
project_context = {
    "公司": "某电商平台",
    "痛点": "客服人力成本高，响应速度慢",
    "目标": "构建智能客服助手，自动回答 80% 的常见问题",
    "约束": {
        "预算": "10 万元",
        "时间": "2 个月",
        "硬件": "2 张 A100 GPU",
        "数据": "10 万条历史客服对话",
    }
}

# 需求分析
requirements = {
    "功能需求": [
        "回答商品咨询问题",
        "处理订单查询",
        "解答售后政策",
        "转接人工客服",
    ],
    "非功能需求": [
        "响应时间 < 2 秒",
        "准确率 > 85%",
        "支持并发 1000 用户",
        "7x24 小时可用",
    ],
}
```

---

## 2 技术方案设计

### 技术选型

```python
# 模型选择
model_selection = {
    "基座模型": {
        "候选": ["Qwen-7B-Chat", "Llama-2-13B-Chat", "ChatGLM3-6B"],
        "选择": "Qwen-7B-Chat",
        "理由": "中文能力强，显存需求适中，社区活跃",
    },
    "微调方法": {
        "候选": ["全参数微调", "LoRA", "QLoRA"],
        "选择": "LoRA",
        "理由": "显存占用低，训练速度快，效果接近全参数",
    },
    "部署方案": {
        "候选": ["vLLM", "TGI", "Triton"],
        "选择": "vLLM",
        "理由": "推理速度快，支持高并发，易于部署",
    },
}

# 架构设计
architecture = {
    "数据层": "MySQL + Redis",
    "服务层": "FastAPI + vLLM",
    "监控层": "Prometheus + Grafana",
    "网关层": "Nginx + 负载均衡",
}
```

---

## 3 数据准备与处理

### 数据收集

```python
# 数据来源
data_sources = {
    "历史对话": {
        "数量": "100,000 条",
        "格式": "JSON",
        "质量": "中等，需要清洗",
    },
    "知识库": {
        "数量": "5,000 条 FAQ",
        "格式": "Excel",
        "质量": "高，已审核",
    },
    "人工标注": {
        "数量": "10,000 条",
        "格式": "JSON",
        "质量": "高，专家标注",
    },
}

# 数据清洗流程
import json
import re

def clean_customer_service_data(raw_data):
    """
    清洗客服数据
    """
    cleaned = []
    
    for item in raw_data:
        # 1. 去除无效对话
        if len(item["dialog"]) < 2:
            continue
        
        # 2. 去除敏感信息
        dialog = re.sub(r'\d{11}', '[手机号]', item["dialog"])  # 手机号
        dialog = re.sub(r'\d{16,19}', '[银行卡号]', dialog)  # 银行卡号
        
        # 3. 格式化
        formatted = {
            "instruction": item["question"],
            "input": "",
            "output": item["answer"],
            "category": item["category"],
        }
        
        cleaned.append(formatted)
    
    return cleaned

# 数据划分
from sklearn.model_selection import train_test_split

def split_data(data, train_ratio=0.9, val_ratio=0.05, test_ratio=0.05):
    """
    划分数据集
    """
    train, temp = train_test_split(data, train_size=train_ratio, random_state=42)
    val, test = train_test_split(temp, train_size=val_ratio/(val_ratio+test_ratio), random_state=42)
    
    return {"train": train, "validation": val, "test": test}
```

---

## 4 模型训练

### 训练配置

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
from peft import LoraConfig, get_peft_model
import torch

# 1. 加载模型
model_name = "Qwen/Qwen-7B-Chat"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 2. 配置 LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["c_attn", "c_proj", "c_fc"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
print(f"可训练参数: {model.print_trainable_parameters()}")

# 3. 训练配置
training_args = TrainingArguments(
    output_dir="./output/customer-service",
    num_train_epochs=5,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    learning_rate=2e-4,
    lr_scheduler_type="cosine",
    warmup_ratio=0.1,
    logging_steps=100,
    eval_strategy="steps",
    eval_steps=500,
    save_strategy="steps",
    save_steps=500,
    save_total_limit=3,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    fp16=True,
    gradient_checkpointing=True,
)

# 4. 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
)

trainer.train()

# 5. 保存模型
trainer.save_model("./output/customer-service-final")
```

---

## 5 模型评估

### 自动评估

```python
from rouge import Rouge
from nltk.translate.bleu_score import sentence_bleu

def evaluate_model(model, tokenizer, test_data):
    """
    评估模型
    """
    results = []
    rouge = Rouge()
    
    for item in test_data:
        # 生成回答
        inputs = tokenizer(item["instruction"], return_tensors="pt")
        outputs = model.generate(**inputs, max_new_tokens=200)
        generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 计算指标
        bleu = sentence_bleu([item["output"].split()], generated.split())
        rouge_scores = rouge.get_scores(generated, item["output"])
        
        results.append({
            "prompt": item["instruction"],
            "generated": generated,
            "reference": item["output"],
            "bleu": bleu,
            "rouge-1": rouge_scores[0]["rouge-1"]["f"],
        })
    
    # 统计
    avg_bleu = sum(r["bleu"] for r in results) / len(results)
    avg_rouge = sum(r["rouge-1"] for r in results) / len(results)
    
    print(f"BLEU: {avg_bleu:.4f}")
    print(f"ROUGE-1: {avg_rouge:.4f}")
    
    return results
```

### 人工评估

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
            "问题": test["instruction"],
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

## 6 模型部署

### 使用 vLLM 部署

```python
from vllm import LLM, SamplingParams

# 1. 加载模型
llm = LLM(
    model="./output/customer-service-final",
    tokenizer="./output/customer-service-final",
    tensor_parallel_size=2,  # 使用 2 张 GPU
    dtype="float16",
)

# 2. 配置采样参数
sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=500,
)

# 3. 推理
prompts = ["如何查询订单？"]
outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    print(output.outputs[0].text)
```

### API 服务

```python
from fastapi import FastAPI
from pydantic import BaseModel
from vllm import LLM, SamplingParams

app = FastAPI()

# 加载模型
llm = LLM(model="./output/customer-service-final")
sampling_params = SamplingParams(temperature=0.7, max_tokens=500)

class Request(BaseModel):
    prompt: str
    max_tokens: int = 500

@app.post("/generate")
async def generate(request: Request):
    """
    生成回答
    """
    sampling_params.max_tokens = request.max_tokens
    outputs = llm.generate([request.prompt], sampling_params)
    
    return {
        "response": outputs[0].outputs[0].text,
        "usage": {
            "prompt_tokens": len(outputs[0].prompt_token_ids),
            "completion_tokens": len(outputs[0].outputs[0].token_ids),
        }
    }

# 启动服务
# uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 7 监控与运维

### 监控指标

```python
# Prometheus 监控指标
metrics = {
    "请求量": "rate(http_requests_total[5m])",
    "响应时间": "histogram_quantile(0.95, http_request_duration_seconds)",
    "错误率": "rate(http_requests_total{status=~\"5..\"}[5m])",
    "GPU 使用率": "nvidia_gpu_utilization",
    "显存使用": "nvidia_gpu_memory_used_bytes",
}

# Grafana 仪表盘
dashboard_config = {
    "面板": [
        "QPS 趋势图",
        "响应时间分布",
        "错误率统计",
        "GPU 资源使用",
    ],
    "告警": [
        "错误率 > 5%",
        "响应时间 > 2 秒",
        "GPU 使用率 > 90%",
    ],
}
```

---

## 8 项目总结

### 成果

```python
project_results = {
    "性能指标": {
        "准确率": "87%",
        "响应时间": "1.2 秒",
        "并发能力": "1500 QPS",
    },
    "业务指标": {
        "自动回答率": "82%",
        "客户满意度": "4.5/5",
        "人力成本节省": "60%",
    },
    "技术指标": {
        "模型大小": "14 GB",
        "显存占用": "16 GB",
        "训练时间": "8 小时",
    },
}
```

### 经验总结

```python
lessons_learned = {
    "数据": "数据质量比数量更重要，清洗花了 2 周",
    "模型": "Qwen-7B 中文效果好，显存友好",
    "训练": "LoRA 足够用，不需要全参数微调",
    "部署": "vLLM 推理速度快，支持高并发",
    "监控": "必须建立完善的监控体系",
}
```

---

## 核心知识点总结

| 环节 | 关键点 |
|------|--------|
| **需求分析** | 明确目标、约束、评估标准 |
| **技术选型** | 根据场景选择模型和方法 |
| **数据准备** | 清洗、格式化、划分数据集 |
| **模型训练** | LoRA + 合理超参数 |
| **模型评估** | 自动评估 + 人工评估 |
| **模型部署** | vLLM + FastAPI |
| **监控运维** | Prometheus + Grafana |

---

## 动手练习

### 练习：设计企业级项目

为你的业务场景设计一个微调项目方案。

<details>
<summary>点击查看答案</summary>

```python
project_plan = {
    "背景": "你的业务场景",
    "目标": "量化目标",
    "数据": "数据来源和规模",
    "技术": "模型和方法选择",
    "评估": "评估指标",
    "部署": "部署方案",
    "监控": "监控指标",
}
```

</details>

---

## 下一章预告

下一章是教程的最后一章，我们会总结 **微调最佳实践**，梳理学习路径，展望前沿技术。让我们完成最后的学习！
