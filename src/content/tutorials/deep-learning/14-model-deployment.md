# 第 14 章：模型部署与应用

## 本章导读

模型训练好了，怎么让它真正"上线"服务用户？本章将解决以下问题：

1. 训练好的模型怎么保存？怎么加载使用？
2. 什么是 ONNX？为什么要转换格式？
3. 怎么用 Flask/FastAPI 搭建模型推理服务？
4. 模型怎么部署到移动端或嵌入式设备？
5. 生产环境部署有哪些注意事项？

## 技术必要性分析

很多新手训练完模型，只会在 Jupyter Notebook 里跑推理。但实际项目中，模型需要：

- **提供服务接口**：让前端、APP 或其他系统调用
- **高并发支持**：同时处理多个用户请求
- **低延迟**：快速响应，用户体验好
- **跨平台运行**：在服务器、手机、IoT 设备上都能跑

本章的部署技术，就是让模型从"实验室"走向"生产线"。

## 核心原理讲解

### 1. 模型保存与加载

**PyTorch 模型保存方式**：

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| `torch.save(model.state_dict())` | 只保存参数 | 推荐，灵活 |
| `torch.save(model)` | 保存整个模型 | 不推荐，依赖目录结构 |
| `torch.jit.save()` | TorchScript 格式 | 生产部署，跨语言 |
| `torch.onnx.export()` | ONNX 格式 | 跨框架、跨平台 |

**最佳实践**：只保存模型参数（state_dict），加载时先构建模型结构，再加载参数。

### 2. ONNX（Open Neural Network Exchange）

**ONNX 是什么**：开放的神经网络模型格式，可以让模型在不同框架（PyTorch、TensorFlow、MXNet）和硬件（CPU、GPU、NPU）之间迁移。

**优势**：

- **跨框架**：PyTorch 训练的模型可以转成 ONNX，再用 TensorFlow 推理
- **跨硬件**：支持 CPU、GPU、FPGA、NPU 等多种后端
- **优化加速**：ONNX Runtime 提供推理优化，比原生 PyTorch 快

### 3. Flask API 部署

**Flask**：Python 轻量级 Web 框架，适合快速搭建模型推理服务。

**流程**：

```
客户端请求 -> Flask API -> 模型推理 -> 返回结果
```

### 4. FastAPI 部署

**FastAPI**：现代 Python Web 框架，性能比 Flask 好，支持异步，自动生成 API 文档。

**优势**：

- 性能更高（基于 Starlette 和 Uvicorn）
- 支持异步请求处理
- 自动生成 OpenAPI 文档
- 类型提示友好

### 5. 移动端部署

**方案**：

| 方案 | 平台 | 说明 |
|------|------|------|
| PyTorch Mobile | Android/iOS | PyTorch 官方移动端方案 |
| ONNX Runtime Mobile | Android/iOS | 跨平台，性能好 |
| TensorFlow Lite | Android/iOS | Google 官方方案 |
| Core ML | iOS | Apple 官方方案 |

## 基础用法

### 模型保存与加载

```python
import torch
import torch.nn as nn

# 定义模型
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(10, 20)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(20, 2)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

model = SimpleModel()

# ===== 方式一：保存和加载模型参数（推荐） =====

# 保存
torch.save(model.state_dict(), 'model_weights.pth')
print("模型参数已保存")

# 加载
model_loaded = SimpleModel()                                   # 先构建模型结构
model_loaded.load_state_dict(torch.load('model_weights.pth'))  # 再加载参数
model_loaded.eval()                                            # 切换到推理模式
print("模型已加载")

# ===== 方式二：保存整个模型（不推荐） =====

# 保存
torch.save(model, 'model_full.pth')

# 加载
model_loaded = torch.load('model_full.pth')
model_loaded.eval()

# 缺点：依赖类的定义路径，换目录可能加载失败

# ===== 方式三：保存检查点（包含更多信息） =====

checkpoint = {
    'epoch': 50,                                               # 训练轮数
    'model_state_dict': model.state_dict(),                    # 模型参数
    'optimizer_state_dict': torch.optim.Adam(model.parameters(), lr=0.001).state_dict(),  # 优化器状态
    'loss': 0.123,                                             # 最终损失
}
torch.save(checkpoint, 'checkpoint.pth')

# 加载检查点
checkpoint_loaded = torch.load('checkpoint.pth')
model = SimpleModel()
model.load_state_dict(checkpoint_loaded['model_state_dict'])
epoch = checkpoint_loaded['epoch']
loss = checkpoint_loaded['loss']
print(f"从第 {epoch} 轮恢复训练，损失: {loss}")
```

### 导出为 ONNX 格式

```python
import torch
import torch.nn as nn

# 定义模型
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(10, 20)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(20, 2)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

model = SimpleModel()
model.eval()                                                   # 必须切换到推理模式

# 创建示例输入（用于追踪模型计算图）
dummy_input = torch.randn(1, 10)                               # batch=1, features=10

# 导出为 ONNX
torch.onnx.export(
    model,                                                     # 要导出的模型
    dummy_input,                                               # 示例输入
    'model.onnx',                                              # 输出文件名
    export_params=True,                                        # 导出训练好的参数
    opset_version=11,                                          # ONNX 算子版本
    do_constant_folding=True,                                  # 常量折叠优化
    input_names=['input'],                                     # 输入节点名
    output_names=['output'],                                   # 输出节点名
    dynamic_axes={                                             # 动态维度（支持可变 batch size）
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)
print("ONNX 模型已导出")

# 使用 ONNX Runtime 推理
import onnxruntime as ort

# 创建推理会话
ort_session = ort.InferenceSession('model.onnx')

# 准备输入
import numpy as np
input_data = np.random.randn(1, 10).astype(np.float32)
ort_inputs = {ort_session.get_inputs()[0].name: input_data}

# 推理
ort_outputs = ort_session.run(None, ort_inputs)
output = ort_outputs[0]
print(f"ONNX 推理结果: {output}")

# 对比 PyTorch 和 ONNX 的结果
with torch.no_grad():
    torch_output = model(torch.from_numpy(input_data)).numpy()

print(f"PyTorch 结果: {torch_output}")
print(f"结果差异: {np.abs(torch_output - output).max()}")      # 应该非常小
```

### Flask API 部署

```python
# app.py
from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision import transforms
import io

# 创建 Flask 应用
app = Flask(__name__)

# 加载模型
class SimpleClassifier(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.fc = nn.Linear(784, num_classes)

    def forward(self, x):
        return self.fc(x)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = SimpleClassifier(num_classes=10)
model.load_state_dict(torch.load('model_weights.pth', map_location=device))
model.to(device)
model.eval()

# 图像预处理
transform = transforms.Compose([
    transforms.Grayscale(),
    transforms.Resize((28, 28)),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

# API 接口：图像分类
@app.route('/predict', methods=['POST'])
def predict():
    """接收图像，返回预测结果"""
    # 检查是否有文件上传
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']

    try:
        # 读取图像
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))

        # 预处理
        input_tensor = transform(image).unsqueeze(0).to(device)  # [1, 1, 28, 28]
        input_tensor = input_tensor.view(-1, 784)                # [1, 784]

        # 推理
        with torch.no_grad():
            output = model(input_tensor)
            probabilities = torch.softmax(output, dim=1)
            predicted_class = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][predicted_class].item()

        # 返回结果
        return jsonify({
            'class': predicted_class,
            'confidence': confidence,
            'probabilities': probabilities[0].cpu().numpy().tolist()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 健康检查接口
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'device': str(device)})

# 启动服务
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

# 运行：python app.py
# 测试：curl -X POST -F "image=@test.jpg" http://localhost:5000/predict
```

### FastAPI 部署（推荐）

```python
# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
import io
from pydantic import BaseModel
from typing import List

# 创建 FastAPI 应用
app = FastAPI(title="图像分类 API", version="1.0")

# 定义响应模型
class PredictionResponse(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    probabilities: List[float]

# 加载模型
class SimpleClassifier(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.fc = nn.Linear(784, num_classes)

    def forward(self, x):
        return self.fc(x)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = SimpleClassifier(num_classes=10)
model.load_state_dict(torch.load('model_weights.pth', map_location=device))
model.to(device)
model.eval()

# 类别名称
CLASS_NAMES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

# 图像预处理
transform = transforms.Compose([
    transforms.Grayscale(),
    transforms.Resize((28, 28)),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

# API 接口
@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """接收图像，返回预测结果"""
    # 检查文件类型
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # 读取图像
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))

        # 预处理
        input_tensor = transform(image).unsqueeze(0).to(device)
        input_tensor = input_tensor.view(-1, 784)

        # 推理
        with torch.no_grad():
            output = model(input_tensor)
            probabilities = torch.softmax(output, dim=1)
            predicted_class = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][predicted_class].item()

        return PredictionResponse(
            class_id=predicted_class,
            class_name=CLASS_NAMES[predicted_class],
            confidence=confidence,
            probabilities=probabilities[0].cpu().numpy().tolist()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 批量预测接口
@app.post("/predict/batch")
async def predict_batch(files: List[UploadFile] = File(...)):
    """批量预测多张图像"""
    results = []

    for file in files:
        try:
            image_bytes = await file.read()
            image = Image.open(io.BytesIO(image_bytes))
            input_tensor = transform(image).unsqueeze(0).to(device)
            input_tensor = input_tensor.view(-1, 784)

            with torch.no_grad():
                output = model(input_tensor)
                probabilities = torch.softmax(output, dim=1)
                predicted_class = torch.argmax(probabilities, dim=1).item()

            results.append({
                'filename': file.filename,
                'class_id': predicted_class,
                'class_name': CLASS_NAMES[predicted_class]
            })
        except Exception as e:
            results.append({
                'filename': file.filename,
                'error': str(e)
            })

    return {'results': results}

# 健康检查
@app.get("/health")
async def health_check():
    return {
        'status': 'ok',
        'device': str(device),
        'model_loaded': True
    }

# 运行：uvicorn main:app --host 0.0.0.0 --port 8000
# 访问 API 文档：http://localhost:8000/docs
```

### 使用 ONNX Runtime 加速推理

```python
import onnxruntime as ort
import numpy as np
from PIL import Image
from torchvision import transforms

# 创建 ONNX Runtime 推理会话
ort_session = ort.InferenceSession('model.onnx')

# 查看输入输出信息
input_name = ort_session.get_inputs()[0].name
input_shape = ort_session.get_inputs()[0].shape
print(f"输入名称: {input_name}")
print(f"输入形状: {input_shape}")

# 图像预处理
transform = transforms.Compose([
    transforms.Grayscale(),
    transforms.Resize((28, 28)),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

# 加载图像
image = Image.open('test.jpg')
input_tensor = transform(image).unsqueeze(0)                     # [1, 1, 28, 28]
input_tensor = input_tensor.view(-1, 784)                        # [1, 784]
input_numpy = input_tensor.numpy().astype(np.float32)

# ONNX Runtime 推理
ort_inputs = {input_name: input_numpy}
ort_outputs = ort_session.run(None, ort_inputs)
output = ort_outputs[0]

# 解析结果
probabilities = np.exp(output) / np.sum(np.exp(output))          # Softmax
predicted_class = np.argmax(probabilities)
confidence = probabilities[0][predicted_class]

print(f"预测类别: {predicted_class}")
print(f"置信度: {confidence:.4f}")

# 性能对比（PyTorch vs ONNX Runtime）
import torch
import time

# PyTorch 推理时间
model = torch.load('model_full.pth')
model.eval()

start = time.time()
for _ in range(100):
    with torch.no_grad():
        _ = model(input_tensor)
pytorch_time = time.time() - start
print(f"PyTorch 推理 100 次: {pytorch_time:.4f} 秒")

# ONNX Runtime 推理时间
start = time.time()
for _ in range(100):
    _ = ort_session.run(None, ort_inputs)
ort_time = time.time() - start
print(f"ONNX Runtime 推理 100 次: {ort_time:.4f} 秒")
print(f"加速比: {pytorch_time / ort_time:.2f}x")
```

## 进阶用法

### Docker 容器化部署

```dockerfile
# Dockerfile
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```txt
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
torch==2.1.0
torchvision==0.16.0
pillow==10.1.0
python-multipart==0.0.6
onnxruntime==1.16.3
numpy==1.26.2
```

```bash
# 构建 Docker 镜像
docker build -t image-classifier:latest .

# 运行容器
docker run -d -p 8000:8000 --name classifier image-classifier:latest

# 测试
curl -X POST -F "image=@test.jpg" http://localhost:8000/predict
```

### 模型量化（减小体积、加速推理）

```python
import torch
import torch.nn as nn

# 原始模型
model = SimpleClassifier()
model.eval()

# ===== 动态量化（Post-Training Dynamic Quantization） =====
# 将权重从 FP32 转为 INT8，推理时动态量化激活值
quantized_model = torch.quantization.quantize_dynamic(
    model,
    {nn.Linear},                                                 # 要量化的层类型
    dtype=torch.qint8                                            # 量化为 8 位整数
)

# 对比模型大小
import os
torch.save(model.state_dict(), 'original.pth')
torch.save(quantized_model.state_dict(), 'quantized.pth')

original_size = os.path.getsize('original.pth')
quantized_size = os.path.getsize('quantized.pth')

print(f"原始模型大小: {original_size / 1e6:.2f} MB")
print(f"量化模型大小: {quantized_size / 1e6:.2f} MB")
print(f"压缩比: {original_size / quantized_size:.2f}x")

# 对比推理速度
import time
x = torch.randn(1, 784)

# 原始模型
start = time.time()
for _ in range(1000):
    with torch.no_grad():
        _ = model(x)
original_time = time.time() - start

# 量化模型
start = time.time()
for _ in range(1000):
    with torch.no_grad():
        _ = quantized_model(x)
quantized_time = time.time() - start

print(f"原始模型推理 1000 次: {original_time:.4f} 秒")
print(f"量化模型推理 1000 次: {quantized_time:.4f} 秒")
print(f"加速比: {original_time / quantized_time:.2f}x")

# ===== 静态量化（Post-Training Static Quantization） =====
# 需要校准数据，精度更高
model_fp32 = SimpleClassifier()
model_fp32.eval()

# 设置量化配置
model_fp32.qconfig = torch.quantization.get_default_qconfig('fbgemm')  # CPU 后端

# 准备量化
model_prepared = torch.quantization.prepare(model_fp32)

# 校准（用一些代表性数据）
calibration_data = torch.randn(100, 784)
with torch.no_grad():
    for i in range(100):
        model_prepared(calibration_data[i:i+1])

# 完成量化
model_quantized = torch.quantization.convert(model_prepared)

# 测试量化模型
output = model_quantized(x)
print(f"量化模型输出: {output}")
```

### TorchScript 导出（跨语言部署）

```python
import torch
import torch.nn as nn

# 定义模型
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 2)

    def forward(self, x):
        return self.fc(x)

model = SimpleModel()
model.eval()

# ===== 方式一：追踪（Trace） =====
# 用示例输入追踪模型计算图
example_input = torch.randn(1, 10)
traced_model = torch.jit.trace(model, example_input)

# 保存
traced_model.save('traced_model.pt')

# 加载
loaded_model = torch.jit.load('traced_model.pt')

# 推理
output = loaded_model(example_input)
print(f"追踪模型输出: {output}")

# ===== 方式二：脚本（Script） =====
# 适用于包含控制流的模型（if、for 等）
@torch.jit.script
def custom_forward(x):
    if x.sum() > 0:
        return x * 2
    else:
        return x * 0

# 保存脚本模型
custom_forward.save('script_model.pt')

# 在 C++ 中加载（示例代码）
"""
#include <torch/script.h>

int main() {
    // 加载模型
    torch::jit::script::Module model;
    model = torch::jit::load("traced_model.pt");

    // 准备输入
    std::vector<torch::jit::IValue> inputs;
    inputs.push_back(torch::randn({1, 10}));

    // 推理
    torch::Tensor output = model.forward(inputs).toTensor();

    // 输出结果
    std::cout << output << std::endl;
    return 0;
}
"""

# 编译 C++ 代码
# g++ -std=c++14 -I<libtorch_path>/include -L<libtorch_path>/lib -ltorch main.cpp -o main
```

### 模型服务化（TorchServe）

```bash
# 安装 TorchServe
pip install torchserve torch-model-archiver

# 打包模型
torch-model-archiver --model-name simple_classifier \
    --version 1.0 \
    --model-file model.py \
    --serialized-file model_weights.pth \
    --handler image_classifier

# 启动服务
torchserve --start --model-store model_store --models my_model=simple_classifier.mar

# 推理
curl http://localhost:8080/predictions/my_model -T test.jpg

# 停止服务
torchserve --stop
```

## 核心知识点总结

| 部署方式 | 优点 | 缺点 | 适用场景 |
|---------|------|------|----------|
| Flask API | 简单快速 | 性能一般 | 原型验证、小规模服务 |
| FastAPI | 高性能、异步、自动文档 | 学习成本稍高 | 生产环境、高并发 |
| ONNX Runtime | 跨平台、推理快 | 需要转换 | 跨框架部署 |
| TorchScript | 跨语言（C++） | 调试困难 | 高性能 C++ 服务 |
| TorchServe | 官方方案、功能全 | 配置复杂 | 大规模生产部署 |
| 模型量化 | 体积小、速度快 | 精度可能下降 | 移动端、嵌入式 |

## 新手常见误区

### 误区 1：推理时忘记 model.eval()

```python
# 错误：推理时忘记切换模式
output = model(input_data)    # BN 和 Dropout 还在用训练模式

# 正确：推理时必须调用 eval()
model.eval()
with torch.no_grad():
    output = model(input_data)
```

### 误区 2：ONNX 导出时不设置动态维度

```python
# 错误：固定 batch size，无法处理可变数量的输入
torch.onnx.export(model, dummy_input, 'model.onnx')

# 正确：设置动态 batch size
torch.onnx.export(
    model,
    dummy_input,
    'model.onnx',
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
)
```

### 误区 3：Flask 服务不设置多线程

```python
# 错误：单线程，只能处理一个请求
app.run(host='0.0.0.0', port=5000)

# 正确：开启多线程
app.run(host='0.0.0.0', port=5000, threaded=True)

# 或使用生产级 WSGI 服务器
# gunicorn -w 4 -t 0 app:app
```

### 误区 4：量化后不测试精度

```python
# 错误：量化后直接用，不检查精度损失
quantized_model = torch.quantization.quantize_dynamic(model, {nn.Linear})
# 直接部署 -> 精度下降严重

# 正确：量化后测试精度
original_output = model(test_input)
quantized_output = quantized_model(test_input)
accuracy_diff = (original_output.argmax(1) != quantized_output.argmax(1)).float().mean()
print(f"精度差异: {accuracy_diff:.4f}")

if accuracy_diff > 0.01:  # 超过 1%
    print("量化导致精度下降过多，考虑其他方案")
```

### 误区 5：Docker 镜像太大

```dockerfile
# 错误：用完整 Python 镜像，体积几个 GB
FROM python:3.9

# 正确：用 slim 版本，体积小很多
FROM python:3.9-slim

# 或使用多阶段构建
FROM python:3.9-slim as builder
# 编译依赖...

FROM python:3.9-slim
# 只复制编译好的文件...
```

## 下一章预告

学会了模型部署后，下一章将介绍深度学习的前沿技术，包括 Transformer、BERT、GPT、扩散模型（Diffusion）、图神经网络（GNN）等，让你了解领域最新进展。
