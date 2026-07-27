---
title: "第15章：模型部署与应用"
description: "模型保存与加载、Flask API 部署、ONNX 格式"
---

# 第15章：模型部署与应用

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 训练好的模型如何保存和加载？
- 如何让模型提供在线服务？
- 什么是 ONNX？为什么需要它？
- 模型部署有哪些注意事项？

这一章就是为了解答这些问题。模型部署是 AI 项目的最后一步，让训练好的模型真正为用户服务。

---

## 1 为什么需要模型部署？

### 痛点分析

模型训练完成后，只能在本地使用：

```python
# ❌ 问题：模型只能在训练环境使用
model = train_model()
prediction = model.predict(new_data)
# 其他程序无法使用这个模型
```

```python
# ✅ 部署：让模型提供服务
# 保存模型 → 构建 API → 上线服务
# 任何程序都可以通过 API 调用模型
```

> **一句话总结**：部署让模型从实验室走向生产环境。

### 生活化类比

打个比方：

> 训练模型就像做菜，部署就像开餐厅。
> 做菜是自己吃，开餐厅是让所有人都能品尝。

---

## 2 模型保存与加载

### PyTorch 模型保存

```python
import torch
import torch.nn as nn

# 定义模型
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 1)
    
    def forward(self, x):
        return self.fc(x)

model = SimpleModel()

# 方法1：保存整个模型（不推荐）
torch.save(model, 'model.pkl')

# 加载
model = torch.load('model.pkl')

# 方法2：保存模型状态字典（推荐）
torch.save(model.state_dict(), 'model_weights.pth')

# 加载
model = SimpleModel()
model.load_state_dict(torch.load('model_weights.pth'))
model.eval()  # 设置为评估模式
```

### Scikit-learn 模型保存

```python
from sklearn.linear_model import LogisticRegression
import joblib

# 训练模型
model = LogisticRegression()
model.fit(X_train, y_train)

# 保存模型
joblib.dump(model, 'model.pkl')

# 加载模型
loaded_model = joblib.load('model.pkl')
predictions = loaded_model.predict(X_test)
```

### 保存完整信息

```python
# 保存模型和相关信息
checkpoint = {
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'epoch': epoch,
    'loss': loss,
    'vocab': vocab,  # 词汇表
    'config': config  # 配置信息
}

torch.save(checkpoint, 'checkpoint.pth')

# 加载
checkpoint = torch.load('checkpoint.pth')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
epoch = checkpoint['epoch']
```

---

## 3 Flask API 部署

### 基础 Flask 应用

```python
from flask import Flask, request, jsonify
import torch
import torch.nn as nn

app = Flask(__name__)

# 加载模型
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 1)
    
    def forward(self, x):
        return self.fc(x)

model = SimpleModel()
model.load_state_dict(torch.load('model_weights.pth'))
model.eval()

@app.route('/predict', methods=['POST'])
def predict():
    # 获取输入数据
    data = request.get_json()
    input_data = torch.tensor(data['features']).float()
    
    # 预测
    with torch.no_grad():
        output = model(input_data)
        prediction = output.item()
    
    # 返回结果
    return jsonify({
        'prediction': prediction,
        'status': 'success'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### 文本分类 API

```python
from flask import Flask, request, jsonify
import torch
import jieba

app = Flask(__name__)

# 加载模型和词汇表
model = load_model()  # 加载你的模型
vocab = load_vocab()  # 加载词汇表

def tokenize(text):
    return list(jieba.cut(text))

def text_to_indices(text, vocab):
    return [vocab.get(w, vocab['<unk>']) for w in tokenize(text)]

@app.route('/sentiment', methods=['POST'])
def sentiment_analysis():
    data = request.get_json()
    text = data.get('text', '')
    
    # 预处理
    indices = text_to_indices(text, vocab)
    input_tensor = torch.tensor([indices])
    
    # 预测
    with torch.no_grad():
        output = model(input_tensor.float())
        sentiment = '正面' if output.item() > 0.5 else '负面'
        confidence = output.item() if sentiment == '正面' else 1 - output.item()
    
    return jsonify({
        'text': text,
        'sentiment': sentiment,
        'confidence': confidence
    })

if __name__ == '__main__':
    app.run(debug=True)
```

### 测试 API

```python
import requests

# 测试情感分析 API
url = 'http://localhost:5000/sentiment'
data = {'text': '这部电影太好看了'}

response = requests.post(url, json=data)
print(response.json())
# {'text': '这部电影太好看了', 'sentiment': '正面', 'confidence': 0.85}
```

---

## 4 ONNX 模型格式

### 什么是 ONNX

ONNX（Open Neural Network Exchange）是开放的模型格式：

```
PyTorch 模型 → ONNX → 其他框架（TensorFlow、Caffe2...）

优势：
- 跨框架：可以在不同框架间转换
- 跨平台：可以在不同硬件上运行
- 优化：可以使用各种优化工具
```

### 导出 ONNX 模型

```python
import torch
import torch.onnx

# 创建模型
model = SimpleModel()
model.load_state_dict(torch.load('model_weights.pth'))
model.eval()

# 创建示例输入
dummy_input = torch.randn(1, 10)

# 导出 ONNX
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

print("ONNX 模型已保存")
```

### 使用 ONNX 模型

```python
import onnxruntime as ort

# 加载 ONNX 模型
session = ort.InferenceSession('model.onnx')

# 获取输入信息
input_name = session.get_inputs()[0].name

# 准备输入
import numpy as np
input_data = np.random.randn(1, 10).astype(np.float32)

# 推理
outputs = session.run(None, {input_name: input_data})
print("预测结果:", outputs[0])
```

---

## 5 Docker 部署

### 创建 Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["python", "app.py"]
```

### requirements.txt

```txt
flask==2.3.0
torch==2.0.0
numpy==1.24.0
jieba==0.42.1
```

### 构建和运行

```bash
# 构建镜像
docker build -t ai-model-api .

# 运行容器
docker run -p 5000:5000 ai-model-api

# 后台运行
docker run -d -p 5000:5000 --name model-api ai-model-api
```

---

## 6 性能优化

### 批处理

```python
# ❌ 低效：逐个处理
for data in request_list:
    result = model.predict(data)

# ✅ 高效：批处理
batch = torch.stack(request_list)
results = model(batch)
```

### 模型量化

```python
import torch.quantization

# 量化模型（减小体积，加速推理）
quantized_model = torch.quantization.quantize_dynamic(
    model, {nn.Linear}, dtype=torch.qint8
)

# 保存量化模型
torch.save(quantized_model.state_dict(), 'quantized_model.pth')
```

### GPU 加速

```python
# 使用 GPU
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

# 推理时
input_data = input_data.to(device)
with torch.no_grad():
    output = model(input_data)
```

---

## 7 监控与日志

### 添加日志

```python
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    logger.info("收到预测请求")
    
    try:
        # 处理逻辑
        result = model.predict(data)
        logger.info(f"预测成功: {result}")
        return jsonify({'result': result})
    except Exception as e:
        logger.error(f"预测失败: {str(e)}")
        return jsonify({'error': str(e)}), 500
```

### 性能监控

```python
import time
from prometheus_client import Counter, Histogram

# 定义指标
REQUEST_COUNT = Counter('request_total', 'Total requests')
REQUEST_LATENCY = Histogram('request_latency_seconds', 'Request latency')

@app.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()
    
    # 处理逻辑
    result = model.predict(data)
    
    # 记录指标
    REQUEST_COUNT.inc()
    REQUEST_LATENCY.observe(time.time() - start_time)
    
    return jsonify({'result': result})
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 模型保存 | state_dict、joblib、checkpoint |
| Flask API | 构建 RESTful 服务 |
| ONNX | 跨框架模型格式 |
| Docker | 容器化部署 |
| 性能优化 | 批处理、量化、GPU 加速 |
| 监控日志 | 记录请求和性能 |

---

## 9 新手常见误区

### 误区 1："保存整个模型更好"

**错！** 保存 state_dict 更灵活：

```python
# ❌ 不推荐：保存整个模型
torch.save(model, 'model.pkl')
# 问题：依赖类定义，跨环境可能出错

# ✅ 推荐：保存状态字典
torch.save(model.state_dict(), 'model_weights.pth')
# 优点：只保存参数，更灵活
```

### 误区 2："API 不需要错误处理"

不是的。生产环境必须处理异常：

```python
# ❌ 错误：不处理异常
@app.route('/predict')
def predict():
    result = model.predict(data)  # 可能出错
    return jsonify({'result': result})

# ✅ 正确：完整的错误处理
@app.route('/predict')
def predict():
    try:
        result = model.predict(data)
        return jsonify({'result': result})
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
```

### 误区 3："部署后不需要监控"

监控是生产环境的必备部分：

```python
# ❌ 错误：没有监控
# 出问题不知道

# ✅ 正确：添加日志和指标
logger.info("Request received")
REQUEST_COUNT.inc()
REQUEST_LATENCY.observe(latency)
```

---

## 10 动手练习

### 练习 1：基础练习

用 joblib 保存和加载一个 Scikit-learn 模型。

<details>
<summary>点击查看答案</summary>

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
import joblib

# 训练模型
iris = load_iris()
X, y = iris.data, iris.target
model = LogisticRegression()
model.fit(X, y)

# 保存模型
joblib.dump(model, 'iris_model.pkl')
print("模型已保存")

# 加载模型
loaded_model = joblib.load('iris_model.pkl')

# 测试
test_data = [[5.1, 3.5, 1.4, 0.2]]
prediction = loaded_model.predict(test_data)
print("预测结果:", prediction)
```

</details>

### 练习 2：进阶练习

用 Flask 创建一个简单的图像分类 API。

<details>
<summary>点击查看答案</summary>

```python
from flask import Flask, request, jsonify
import torch
import torchvision.transforms as transforms
from PIL import Image
import io

app = Flask(__name__)

# 加载模型
model = load_model()  # 加载你的模型
model.eval()

# 图像预处理
transform = transforms.Compose([
    transforms.Resize(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.route('/classify', methods=['POST'])
def classify():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    image = Image.open(io.BytesIO(file.read()))
    
    # 预处理
    input_tensor = transform(image).unsqueeze(0)
    
    # 预测
    with torch.no_grad():
        output = model(input_tensor)
        _, predicted = torch.max(output, 1)
    
    return jsonify({
        'prediction': predicted.item(),
        'status': 'success'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

</details>

### 练习 3（挑战）：综合练习

将 PyTorch 模型导出为 ONNX 格式，并用 onnxruntime 推理。

<details>
<summary>点击查看答案</summary>

```python
import torch
import torch.nn as nn
import onnxruntime as ort
import numpy as np

# 1. 定义并训练模型
class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(10, 20)
        self.fc2 = nn.Linear(20, 1)
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

model = SimpleNet()
model.eval()

# 2. 导出 ONNX
dummy_input = torch.randn(1, 10)
torch.onnx.export(
    model,
    dummy_input,
    'simple_model.onnx',
    export_params=True,
    opset_version=11,
    input_names=['input'],
    output_names=['output']
)

# 3. 用 onnxruntime 推理
session = ort.InferenceSession('simple_model.onnx')
input_name = session.get_inputs()[0].name

# 准备输入
input_data = np.random.randn(1, 10).astype(np.float32)

# 推理
outputs = session.run(None, {input_name: input_data})
print("ONNX 推理结果:", outputs[0])

# 4. 对比 PyTorch 结果
with torch.no_grad():
    pytorch_output = model(torch.tensor(input_data)).numpy()
print("PyTorch 结果:", pytorch_output)
print("差异:", np.abs(outputs[0] - pytorch_output).max())
```

</details>

---

## 下一章预告

下一章是 **综合实战项目**——图像识别系统、推荐系统、聊天机器人，将所学知识融会贯通。
