---
title: "第12章：LLaMA-Factory 一站式微调"
description: "掌握 LLaMA-Factory 的使用方法，快速微调各种大模型"
---

# 第12章：LLaMA-Factory 一站式微调

## 本章导读

在学这一章之前，你可能会有这些疑问：

- LLaMA-Factory 是什么？
- 如何用 LLaMA-Factory 微调模型？
- 支持哪些模型？
- 如何配置训练参数？

这一章会讲解 **LLaMA-Factory** 的使用方法。这是一个开箱即用的微调框架，支持多种模型和微调方法。

---

## 1 LLaMA-Factory 简介

### 特点

```python
# LLaMA-Factory 的优势
features = {
    "支持模型": "LLaMA、Qwen、ChatGLM、Mistral 等 100+ 模型",
    "微调方法": "LoRA、QLoRA、全参数微调、P-Tuning 等",
    "训练方式": "SFT、RLHF、DPO",
    "界面": "WebUI、命令行",
    "易用性": "配置文件驱动，无需写代码",
}
```

---

## 2 安装和配置

### 安装

```bash
# 克隆仓库
git clone https://github.com/hiyouga/LLaMA-Factory.git
cd LLaMA-Factory

# 安装依赖
pip install -e .

# 安装可选依赖
pip install bitsandbytes  # 量化
pip install vllm          # 推理加速
```

### 启动 WebUI

```bash
# 启动 WebUI
llamafactory-cli webui

# 访问 http://localhost:7860
```

---

## 3 配置文件

### 基础配置

```yaml
# config.yaml
model_name_or_path: meta-llama/Llama-2-7b-hf
output_dir: ./output

# 数据配置
dataset: alpaca_zh
template: llama2

# 训练配置
finetuning_type: lora
lora_rank: 8
lora_alpha: 16
lora_target: q_proj,v_proj

# 训练参数
num_train_epochs: 3
per_device_train_batch_size: 4
learning_rate: 2e-4
lr_scheduler_type: cosine
warmup_ratio: 0.1

# 优化
bf16: true
gradient_accumulation_steps: 4
```

### 运行训练

```bash
# 使用配置文件训练
llamafactory-cli train config.yaml

# 或者使用命令行参数
llamafactory-cli train \
  --model_name_or_path meta-llama/Llama-2-7b-hf \
  --dataset alpaca_zh \
  --finetuning_type lora \
  --output_dir ./output
```

---

## 4 数据准备

### 数据格式

```json
// alpaca.json
[
  {
    "instruction": "翻译这句话成英文",
    "input": "你好世界",
    "output": "Hello World"
  },
  {
    "instruction": "写一首关于春天的诗",
    "input": "",
    "output": "春风拂面花满枝..."
  }
]
```

### 注册数据集

```yaml
# dataset_info.yaml
alpaca_zh:
  file_name: alpaca_zh.json
  formatting: alpaca
```

---

## 5 模型导出

```bash
# 导出合并后的模型
llamafactory-cli export \
  --model_name_or_path meta-llama/Llama-2-7b-hf \
  --adapter_name_or_path ./output/lora-adapter \
  --template llama2 \
  --finetuning_type lora \
  --export_dir ./output/merged-model \
  --export_size 2
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **LLaMA-Factory** | 开箱即用的微调框架 |
| **配置驱动** | 通过配置文件控制训练 |
| **多模型支持** | 支持 100+ 模型 |
| **WebUI** | 图形界面，易于使用 |

---

## 7 动手练习

### 练习 1：使用 LLaMA-Factory 微调

用 LLaMA-Factory 微调一个模型。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 准备数据
# 2. 创建配置文件
# 3. 运行训练
llamafactory-cli train config.yaml
```

</details>

---

## 下一章预告

下一章我们会学习 **模型评估与质量分析**——如何评估微调后的模型效果。你会学到各种评估指标和方法。让我们继续！
