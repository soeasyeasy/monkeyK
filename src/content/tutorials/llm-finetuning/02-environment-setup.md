---
title: "第02章：环境搭建与工具准备"
description: "配置 GPU 环境，安装 PyTorch 和 Hugging Face 工具链，为微调做好准备"
---

# 第02章：环境搭建与工具准备

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 微调需要什么配置？我的电脑能做吗？
- GPU 显存不够怎么办？
- 需要安装哪些工具？
- Hugging Face 生态有哪些好用的工具？

这一章会帮你搭建完整的微调环境。我们会从 **GPU 配置** 开始，逐步安装 **PyTorch** 和 **Hugging Face 工具链**，确保你能顺利运行后续的所有代码。

---

## 1 为什么需要专门配置环境？

### 痛点分析

**问题 1：微调对硬件有特殊要求**

```bash
# ❌ 直接用 CPU 训练
python train.py
# 训练 1 个 epoch 需要 10 天...
```

**问题 2：依赖版本冲突**

```bash
# ❌ 随意安装各种包
pip install torch transformers datasets
# 报错：版本不兼容，CUDA 版本不对...
```

**问题 3：显存管理困难**

```python
# ❌ 训练时显存溢出
RuntimeError: CUDA out of memory. Tried to allocate 2.00 GiB
```

### 解决方案

正确配置环境可以避免这些问题：

- ✅ 使用 GPU 加速训练
- ✅ 统一依赖版本
- ✅ 合理管理显存

---

## 2 硬件需求分析

### 不同规模的硬件需求

| 模型规模 | 全参数微调 | LoRA 微调 | 推荐 GPU |
|---------|-----------|----------|---------|
| 1-3B | 16GB | 8GB | RTX 3090/4090 |
| 7B | 40GB | 16GB | A100 40GB |
| 13B | 80GB | 24GB | A100 80GB |
| 30B+ | 多卡 | 40GB+ | 多张 A100 |

### 个人开发者方案

**方案 1：本地 GPU（推荐入门）**

```
配置建议：
- GPU：RTX 3090/4090（24GB 显存）
- 内存：32GB+
- 硬盘：1TB SSD
- 预算：8000-15000 元

优点：随时可用，长期成本低
缺点：显存有限，只能微调中小模型
```

**方案 2：云 GPU（推荐生产）**

```
常用平台：
- AutoDL：按小时计费，便宜
- 阿里云/腾讯云：稳定，有优惠
- Google Colab：免费 T4，适合学习
- Lambda Labs：A100 按小时租

优点：配置灵活，显存充足
缺点：按时间计费，长期成本高
```

**方案 3：免费资源（学习用）**

```
- Google Colab：免费 T4 GPU（15GB）
- Kaggle Notebooks：免费 P100（16GB）
- 各云厂商新用户优惠

优点：零成本
缺点：时长限制，显存较小
```

---

## 3 环境搭建步骤

### 步骤 1：安装 CUDA 和 cuDNN

**检查 GPU 和驱动**

```bash
# 查看 GPU 信息
nvidia-smi

# 输出示例：
# +-----------------------------------------------------------------------------+
# | NVIDIA-SMI 525.105.17   Driver Version: 525.105.17   CUDA Version: 12.0     |
# |-------------------------------+----------------------+----------------------+
# | GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
# | Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
# |===============================+======================+======================|
# |   0  NVIDIA GeForce RTX 3090    Off  | 00000000:01:00.0 Off |                  N/A |
# | 30%   45C    P8    25W / 350W |      0MiB / 24576MiB |      0%      Default |
# +-------------------------------+----------------------+----------------------+
```

**安装 CUDA Toolkit**

```bash
# 方法 1：使用 conda 安装（推荐）
conda install cuda -c nvidia

# 方法 2：从官网下载安装
# https://developer.nvidia.com/cuda-toolkit-archive

# 验证安装
nvcc --version
# 输出：Cuda compilation tools, release 12.0
```

### 步骤 2：创建 Python 环境

**使用 conda 创建环境**

```bash
# 创建新环境
conda create -n llm-finetuning python=3.10 -y

# 激活环境
conda activate llm-finetuning

# 验证 Python 版本
python --version
# 输出：Python 3.10.x
```

### 步骤 3：安装 PyTorch

**安装 PyTorch（支持 CUDA）**

```bash
# 方法 1：使用 conda 安装（推荐）
conda install pytorch torchvision torchaudio pytorch-cuda=12.0 -c pytorch -c nvidia

# 方法 2：使用 pip 安装
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu120

# 验证安装
python -c "import torch; print(torch.__version__); print(torch.cuda.is_available())"
# 输出：
# 2.1.0+cu120
# True
```

**测试 GPU 是否可用**

```python
import torch

# 检查 CUDA 是否可用
print(f"CUDA 可用: {torch.cuda.is_available()}")  # True

# 检查 GPU 数量
print(f"GPU 数量: {torch.cuda.device_count()}")  # 1

# 检查 GPU 名称
print(f"GPU 名称: {torch.cuda.get_device_name(0)}")  # NVIDIA GeForce RTX 3090

# 简单测试
x = torch.randn(3, 3).cuda()
print(f"张量设备: {x.device}")  # cuda:0
```

### 步骤 4：安装 Hugging Face 工具链

**安装核心库**

```bash
# 安装 transformers（模型加载和训练）
pip install transformers

# 安装 datasets（数据集处理）
pip install datasets

# 安装 accelerate（分布式训练）
pip install accelerate

# 安装 peft（参数高效微调）
pip install peft

# 安装 trl（强化学习微调）
pip install trl
```

**安装辅助工具**

```bash
# 安装 sentencepiece（分词器）
pip install sentencepiece

# 安装 protobuf（模型序列化）
pip install protobuf

# 安装 bitsandbytes（量化）
pip install bitsandbytes

# 安装 scipy（数值计算）
pip install scipy
```

**验证安装**

```python
import transformers
import datasets
import accelerate
import peft
import trl

print(f"transformers: {transformers.__version__}")
print(f"datasets: {datasets.__version__}")
print(f"accelerate: {accelerate.__version__}")
print(f"peft: {peft.__version__}")
print(f"trl: {trl.__version__}")
```

### 步骤 5：安装其他工具

**安装开发工具**

```bash
# 安装 Jupyter Notebook（交互式开发）
pip install jupyter notebook

# 安装 IPython（增强的 Python 交互式环境）
pip install ipython

# 安装 tqdm（进度条）
pip install tqdm

# 安装 wandb（实验跟踪，可选）
pip install wandb
```

---

## 4 Hugging Face 生态工具

### 核心工具介绍

**1. Transformers**

```python
# 模型加载和训练
from transformers import AutoModel, AutoTokenizer

# 加载模型
model = AutoModel.from_pretrained("bert-base-uncased")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# 功能：
# - 加载预训练模型
# - 提供 Trainer API
# - 支持各种任务
```

**2. Datasets**

```python
# 数据集加载和处理
from datasets import load_dataset

# 加载数据集
dataset = load_dataset("imdb")

# 功能：
# - 加载各种公开数据集
# - 数据预处理
# - 数据映射和过滤
```

**3. Accelerate**

```python
# 分布式训练
from accelerate import Accelerator

accelerator = Accelerator()

# 功能：
# - 单卡/多卡训练
# - 混合精度训练
# - 分布式训练
```

**4. PEFT**

```python
# 参数高效微调
from peft import LoraConfig, get_peft_model

config = LoraConfig(r=8)
model = get_peft_model(model, config)

# 功能：
# - LoRA
# - P-Tuning
# - Prefix Tuning
```

**5. TRL**

```python
# 强化学习微调
from trl import PPOTrainer, DPOTrainer

# 功能：
# - RLHF（PPO）
# - DPO
# - 奖励模型训练
```

---

## 5 环境测试

### 完整测试代码

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# 1. 测试 GPU
print("=" * 50)
print("1. GPU 测试")
print("=" * 50)
print(f"CUDA 可用: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU 名称: {torch.cuda.get_device_name(0)}")
    print(f"显存总量: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")

# 2. 测试模型加载
print("\n" + "=" * 50)
print("2. 模型加载测试")
print("=" * 50)
model_name = "gpt2"  # 用小模型测试
print(f"加载模型: {model_name}")

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# 移到 GPU
if torch.cuda.is_available():
    model = model.cuda()
    print("模型已移到 GPU")

print("模型加载成功！")

# 3. 测试推理
print("\n" + "=" * 50)
print("3. 推理测试")
print("=" * 50)
inputs = tokenizer("Hello, I am", return_tensors="pt")
if torch.cuda.is_available():
    inputs = {k: v.cuda() for k, v in inputs.items()}

outputs = model.generate(**inputs, max_new_tokens=10)
text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(f"生成结果: {text}")

print("\n✅ 环境配置成功！")
```

### 显存监控

```python
import torch

def print_gpu_memory():
    """打印 GPU 显存使用情况"""
    if not torch.cuda.is_available():
        print("CUDA 不可用")
        return
    
    for i in range(torch.cuda.device_count()):
        props = torch.cuda.get_device_properties(i)
        total = props.total_memory / 1e9
        allocated = torch.cuda.memory_allocated(i) / 1e9
        reserved = torch.cuda.memory_reserved(i) / 1e9
        
        print(f"GPU {i}: {props.name}")
        print(f"  总显存: {total:.2f} GB")
        print(f"  已分配: {allocated:.2f} GB")
        print(f"  已预留: {reserved:.2f} GB")
        print(f"  可用: {total - reserved:.2f} GB")

# 使用
print_gpu_memory()
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **硬件需求** | 根据模型规模选择 GPU，个人推荐 RTX 3090/4090 |
| **CUDA 安装** | 使用 conda 安装或从官网下载 |
| **PyTorch 安装** | 选择支持 CUDA 的版本 |
| **核心工具** | transformers、datasets、accelerate、peft、trl |
| **显存管理** | 监控显存使用，避免 OOM |

---

## 7 新手常见误区

### 误区 1："必须用最新版本的 CUDA"

**不一定。** PyTorch 对 CUDA 版本有要求，但不是越新越好。

正确做法：
- 查看 PyTorch 官方推荐的 CUDA 版本
- 使用 conda 安装会自动处理依赖
- 不要随意升级 CUDA

### 误区 2："显存越大越好"

**错！** 显存够用就行，关键是合理利用。

```python
# ❌ 浪费显存
model = model.cuda()  # 整个模型加载到 GPU

# ✅ 按需加载
# 使用梯度累积、混合精度等技术节省显存
```

### 误区 3："CPU 也能训练，只是慢一点"

**大错特错！** CPU 训练大模型几乎不可行。

- GPU 训练 1 小时 = CPU 训练 1 周
- 大模型必须用 GPU
- 小模型可以用 CPU 测试代码

### 误区 4："安装完就不用管了"

**错！** 需要定期检查环境。

```bash
# 定期检查
nvidia-smi  # 检查 GPU 状态
python -c "import torch; print(torch.cuda.is_available())"  # 检查 PyTorch
```

---

## 8 动手练习

### 练习 1：环境检查

编写代码检查你的环境：

1. 检查 CUDA 是否可用
2. 打印 GPU 名称和显存大小
3. 检查 PyTorch 版本

<details>
<summary>点击查看答案</summary>

```python
import torch

# 1. 检查 CUDA
print(f"CUDA 可用: {torch.cuda.is_available()}")

# 2. GPU 信息
if torch.cuda.is_available():
    print(f"GPU 名称: {torch.cuda.get_device_name(0)}")
    props = torch.cuda.get_device_properties(0)
    print(f"显存大小: {props.total_memory / 1e9:.2f} GB")

# 3. PyTorch 版本
print(f"PyTorch 版本: {torch.__version__}")
```

</details>

### 练习 2：模型加载测试

加载一个小型模型（如 gpt2）并测试推理。

<details>
<summary>点击查看答案</summary>

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# 加载模型
model_name = "gpt2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# 移到 GPU
if torch.cuda.is_available():
    model = model.cuda()

# 测试推理
inputs = tokenizer("Once upon a time", return_tensors="pt")
if torch.cuda.is_available():
    inputs = {k: v.cuda() for k, v in inputs.items()}

outputs = model.generate(**inputs, max_new_tokens=20)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

</details>

### 练习 3（挑战）：显存监控工具

编写一个函数，实时监控 GPU 显存使用情况。

<details>
<summary>点击查看答案</summary>

```python
import torch
import time

def monitor_gpu_memory(interval=1, duration=10):
    """
    监控 GPU 显存使用情况
    
    Args:
        interval: 检查间隔（秒）
        duration: 监控总时长（秒）
    """
    if not torch.cuda.is_available():
        print("CUDA 不可用")
        return
    
    start_time = time.time()
    while time.time() - start_time < duration:
        allocated = torch.cuda.memory_allocated(0) / 1e9
        reserved = torch.cuda.memory_reserved(0) / 1e9
        
        print(f"[{time.time() - start_time:.1f}s] "
              f"已分配: {allocated:.2f}GB, "
              f"已预留: {reserved:.2f}GB")
        
        time.sleep(interval)

# 使用示例
monitor_gpu_memory(interval=2, duration=10)
```

</details>

---

## 下一章预告

下一章我们会学习 **微调核心原理**——也就是理解迁移学习、参数高效微调的原理。你会搞明白为什么微调有效，以及各种微调方法的底层逻辑。让我们继续深入！
