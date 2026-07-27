---
title: "第15章：模型部署与优化"
description: "掌握模型导出、ONNX、TorchScript、GPU 优化、量化技术"
---

# 第15章：模型部署与优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 训练好的模型如何部署到生产环境？
- 什么是 ONNX？为什么需要它？
- TorchScript 是什么？和 ONNX 有什么区别？
- 如何让模型跑得更快？有哪些优化技术？

这一章就是为了解答这些问题。模型部署是将研究成果转化为实际应用的关键步骤。

---

## 1 为什么需要模型部署？

### 痛点分析

想象一下你训练了一个很好的模型：

**只在本地运行**：只能在你的电脑上用，别人无法使用。

**部署到生产**：可以让成千上万的用户通过 API 使用你的模型。

### 部署场景

```
Web 服务：通过 API 提供预测服务
移动端：在手机 APP 中运行模型
边缘设备：在 IoT 设备上运行
嵌入式系统：在硬件芯片上运行
```

> **一句话总结**：部署让模型从实验室走向实际应用。

---

## 2 核心原理

### 模型部署流程

打个比方：

> 模型部署像开餐厅：训练好的模型是菜谱，部署是把菜谱翻译成不同语言（ONNX、TorchScript），让不同的厨房（服务器、手机、边缘设备）都能做菜。

### 部署技术对比

| 技术 | 说明 | 适用场景 |
| --- | --- | --- |
| PyTorch 原生 | 直接保存模型 | 快速原型 |
| TorchScript | PyTorch 的序列化格式 | PyTorch 生态 |
| ONNX | 通用模型格式 | 跨框架部署 |
| TensorRT | NVIDIA 优化 | GPU 加速 |
| Core ML | Apple 优化 | iOS/macOS |

---

## 3 模型保存与加载

### 保存模型参数

```python
import torch
import torch.nn as nn

# 定义模型
class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNet()

# 方式1：保存模型参数（推荐）
torch.save(model.state_dict(), 'model_params.pth')

# 方式2：保存整个模型（不推荐）
torch.save(model, 'model_full.pth')
```

### 加载模型

```python
import torch
import torch.nn as nn

# 定义相同的模型结构
class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# 方式1：加载模型参数（推荐）
model = SimpleNet()
model.load_state_dict(torch.load('model_params.pth'))
model.eval()  # 设置为评估模式

# 方式2：加载整个模型（不推荐）
model = torch.load('model_full.pth')
model.eval()
```

### 保存检查点

```python
import torch

# 保存完整检查点
checkpoint = {
    'epoch': 10,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'loss': 0.5,
}

torch.save(checkpoint, 'checkpoint.pth')

# 加载检查点
checkpoint = torch.load('checkpoint.pth')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
epoch = checkpoint['epoch']
loss = checkpoint['loss']
```

---

## 4 TorchScript

### 什么是 TorchScript？

TorchScript 是 PyTorch 的序列化格式，可以：

- 独立于 Python 运行
- 在 C++ 中加载
- 进行优化加速

### 使用 tracing 转换

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNet()
model.eval()

# 创建示例输入
example_input = torch.randn(1, 1, 28, 28)

# 使用 tracing 转换为 TorchScript
traced_model = torch.jit.trace(model, example_input)

# 保存
traced_model.save('traced_model.pt')

# 加载
loaded_model = torch.jit.load('traced_model.pt')

# 推理
output = loaded_model(example_input)
print(f"输出形状: {output.shape}")
```

### 使用 scripting 转换

```python
import torch
import torch.nn as nn

class ComplexNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 5)

    def forward(self, x):
        # 包含控制流
        if x.sum() > 0:
            x = torch.relu(self.fc(x))
        else:
            x = self.fc(x)
        return x

model = ComplexNet()
model.eval()

# 使用 scripting（支持控制流）
scripted_model = torch.jit.script(model)

# 保存
scripted_model.save('scripted_model.pt')

# 加载
loaded_model = torch.jit.load('scripted_model.pt')

# 推理
x = torch.randn(1, 10)
output = loaded_model(x)
print(f"输出形状: {output.shape}")
```

---

## 5 ONNX 导出

### 什么是 ONNX？

ONNX（Open Neural Network Exchange）是通用的模型格式，支持：

- 跨框架（PyTorch、TensorFlow、MXNet）
- 跨平台（服务器、移动端、边缘设备）
- 硬件加速（TensorRT、OpenVINO）

### 导出为 ONNX

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNet()
model.eval()

# 创建示例输入
dummy_input = torch.randn(1, 1, 28, 28)

# 导出为 ONNX
torch.onnx.export(
    model,
    dummy_input,
    'model.onnx',
    export_params=True,
    opset_version=11,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)

print("模型已导出为 ONNX 格式")
```

### 验证 ONNX 模型

```python
import onnx
import onnxruntime as ort
import numpy as np

# 验证 ONNX 模型
onnx_model = onnx.load('model.onnx')
onnx.checker.check_model(onnx_model)
print("ONNX 模型验证通过")

# 使用 ONNX Runtime 推理
ort_session = ort.InferenceSession('model.onnx')

# 准备输入
input_name = ort_session.get_inputs()[0].name
input_data = np.random.randn(1, 1, 28, 28).astype(np.float32)

# 推理
ort_outputs = ort_session.run(None, {input_name: input_data})
output = ort_outputs[0]

print(f"ONNX 输出形状: {output.shape}")
```

---

## 6 GPU 优化

### 使用 CUDA

```python
import torch
import torch.nn as nn

# 检查 CUDA 是否可用
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"使用设备: {device}")

# 创建模型并移到 GPU
model = SimpleNet().to(device)

# 创建输入并移到 GPU
x = torch.randn(32, 1, 28, 28).to(device)

# 推理
model.eval()
with torch.no_grad():
    output = model(x)

print(f"输出形状: {output.shape}")
print(f"输出设备: {output.device}")
```

### 多 GPU 并行

```python
import torch
import torch.nn as nn

# 检查 GPU 数量
num_gpus = torch.cuda.device_count()
print(f"可用 GPU 数量: {num_gpus}")

# 使用 DataParallel
if num_gpus > 1:
    model = nn.DataParallel(model)

# 使用 DistributedDataParallel（推荐）
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

# 初始化分布式环境
dist.init_process_group(backend='nccl')
model = DDP(model, device_ids=[local_rank])
```

### 混合精度训练

```python
import torch
import torch.nn as nn
from torch.cuda.amp import autocast, GradScaler

model = SimpleNet().cuda()
optimizer = torch.optim.Adam(model.parameters())
scaler = GradScaler()

for epoch in range(10):
    for images, labels in dataloader:
        images, labels = images.cuda(), labels.cuda()

        optimizer.zero_grad()

        # 混合精度前向传播
        with autocast():
            outputs = model(images)
            loss = criterion(outputs, labels)

        # 混合精度反向传播
        scaler.scale(loss).backward()

        # 更新参数
        scaler.step(optimizer)
        scaler.update()
```

---

## 7 模型量化

### 什么是量化？

量化将模型参数从浮点数转换为低精度整数（如 INT8），可以：

- 减小模型大小
- 加快推理速度
- 降低内存占用

### 动态量化

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNet()
model.eval()

# 动态量化（推理时量化）
quantized_model = torch.quantization.quantize_dynamic(
    model,
    {nn.Linear},  # 要量化的层
    dtype=torch.qint8
)

# 比较模型大小
import os
print(f"原始模型大小: {os.path.getsize('model.pth') / 1024:.2f} KB")

# 保存量化模型
torch.save(quantized_model.state_dict(), 'quantized_model.pth')
print(f"量化模型大小: {os.path.getsize('quantized_model.pth') / 1024:.2f} KB")
```

### 静态量化

```python
import torch
import torch.nn as nn

class QuantizableNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.quant = torch.quantization.QuantStub()
        self.fc1 = nn.Linear(784, 256)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(256, 10)
        self.dequant = torch.quantization.DeQuantStub()

    def forward(self, x):
        x = self.quant(x)
        x = x.view(-1, 784)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        x = self.dequant(x)
        return x

model = QuantizableNet()
model.eval()

# 设置量化配置
model.qconfig = torch.quantization.get_default_qconfig('fbgemm')

# 准备量化
torch.quantization.prepare(model, inplace=True)

# 校准（使用代表性数据）
for images, _ in dataloader:
    model(images)

# 转换量化模型
torch.quantization.convert(model, inplace=True)

# 推理
output = model(test_input)
```

---

## 8 模型优化技术

### 剪枝

```python
import torch
import torch.nn as nn
import torch.nn.utils.prune as prune

model = SimpleNet()

# 随机剪枝 30%
prune.random_unstructured(model.fc1, name='weight', amount=0.3)

# 查看稀疏度
print(f"稀疏度: {float(model.fc1.weight == 0).mean():.2f}")

# L1 范数剪枝
prune.l1_unstructured(model.fc1, name='weight', amount=0.3)

# 永久剪枝
prune.remove(model.fc1, 'weight')
```

### 知识蒸馏

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class TeacherNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 512)
        self.fc2 = nn.Linear(512, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

class StudentNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

teacher = TeacherNet()
student = StudentNet()

# 知识蒸馏损失
def distillation_loss(student_outputs, teacher_outputs, labels, temperature=3.0, alpha=0.5):
    # 软标签损失
    soft_loss = F.kl_div(
        F.log_softmax(student_outputs / temperature, dim=1),
        F.softmax(teacher_outputs / temperature, dim=1),
        reduction='batchmean'
    ) * (temperature ** 2)

    # 硬标签损失
    hard_loss = F.cross_entropy(student_outputs, labels)

    return alpha * soft_loss + (1 - alpha) * hard_loss

# 训练学生模型
teacher.eval()
optimizer = torch.optim.Adam(student.parameters())

for images, labels in dataloader:
    with torch.no_grad():
        teacher_outputs = teacher(images)

    student_outputs = student(images)
    loss = distillation_loss(student_outputs, teacher_outputs, labels)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
```

---

## 9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 模型保存 | state_dict() 保存参数 |
| TorchScript | PyTorch 序列化格式 |
| ONNX | 通用模型格式 |
| GPU 优化 | CUDA、混合精度 |
| 量化 | INT8 量化，减小模型 |
| 剪枝 | 移除冗余参数 |
| 知识蒸馏 | 大模型教小模型 |

---

## 10 新手常见误区

### 误区 1："保存整个模型更方便"

**错！** 保存整个模型依赖 Python 环境，不灵活。

正确做法：保存 state_dict，模型结构代码单独管理。

### 误区 2："量化后精度不会下降"

不是的。量化会导致精度损失，需要权衡。

正确做法：使用量化感知训练（QAT）减少精度损失。

### 误区 3："ONNX 模型在所有平台都一样快"

实际上不同硬件需要不同的优化。

正确做法：根据目标平台选择合适的优化方案（TensorRT、OpenVINO 等）。

---

## 11 动手练习

### 练习 1：基础练习

实现模型的保存和加载功能。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(10, 5)
        self.fc2 = nn.Linear(5, 2)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# 创建并训练模型
model = SimpleNet()

# 保存模型参数
torch.save(model.state_dict(), 'model.pth')
print("模型已保存")

# 加载模型
loaded_model = SimpleNet()
loaded_model.load_state_dict(torch.load('model.pth'))
loaded_model.eval()

# 测试
x = torch.randn(1, 10)
output = loaded_model(x)
print(f"输出: {output}")
```

</details>

### 练习 2：进阶练习

将模型导出为 TorchScript 和 ONNX 格式。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(10, 5)
        self.fc2 = nn.Linear(5, 2)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNet()
model.eval()

# 导出为 TorchScript
example_input = torch.randn(1, 10)
traced_model = torch.jit.trace(model, example_input)
traced_model.save('model.pt')
print("TorchScript 模型已保存")

# 导出为 ONNX
torch.onnx.export(
    model,
    example_input,
    'model.onnx',
    export_params=True,
    opset_version=11,
    input_names=['input'],
    output_names=['output']
)
print("ONNX 模型已保存")

# 验证 ONNX
import onnx
onnx_model = onnx.load('model.onnx')
onnx.checker.check_model(onnx_model)
print("ONNX 模型验证通过")
```

</details>

### 练习 3（挑战）：综合练习

实现模型量化，并比较量化前后的模型大小和推理速度。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import time
import os

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# 创建原始模型
model = SimpleNet()
model.eval()

# 保存原始模型
torch.save(model.state_dict(), 'original_model.pth')
original_size = os.path.getsize('original_model.pth')
print(f"原始模型大小: {original_size / 1024:.2f} KB")

# 动态量化
quantized_model = torch.quantization.quantize_dynamic(
    model,
    {nn.Linear},
    dtype=torch.qint8
)

# 保存量化模型
torch.save(quantized_model.state_dict(), 'quantized_model.pth')
quantized_size = os.path.getsize('quantized_model.pth')
print(f"量化模型大小: {quantized_size / 1024:.2f} KB")
print(f"压缩比: {original_size / quantized_size:.2f}x")

# 测试推理速度
test_input = torch.randn(1000, 1, 28, 28)

# 原始模型推理
start = time.time()
with torch.no_grad():
    for _ in range(100):
        _ = model(test_input)
original_time = time.time() - start
print(f"原始模型推理时间: {original_time:.4f}s")

# 量化模型推理
start = time.time()
with torch.no_grad():
    for _ in range(100):
        _ = quantized_model(test_input)
quantized_time = time.time() - start
print(f"量化模型推理时间: {quantized_time:.4f}s")
print(f"加速比: {original_time / quantized_time:.2f}x")
```

</details>

---

## 下一章预告

下一章我们会学习 **综合实战项目**——将前面学到的知识应用到实际项目中。你会完成图像分类系统、风格迁移和推荐系统三个完整项目。