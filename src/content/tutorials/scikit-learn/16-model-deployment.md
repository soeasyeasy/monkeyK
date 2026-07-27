---
title: "第16章：模型持久化与部署"
description: "模型序列化、Flask API 部署、Docker 容器化、MLOps 入门、持续学习路线"
---

# 第16章：模型持久化与部署

## 本章导读

在学完前面 15 章后，你可能会有这些疑问：

- 训练好的模型怎么保存？下次怎么用？
- 怎么把模型部署到服务器上让别人使用？
- 生产环境的模型需要注意什么？
- 学完 Scikit-learn 后，接下来该学什么？

这一章是教程的最后一章，会带你完成从模型保存到生产部署的全流程，并为你规划后续学习路线。

---

## 1 为什么需要模型部署？

### 痛点分析

训练好的模型如果只存在于 Jupyter Notebook 中：

- **无法复用**：每次使用都要重新训练
- **无法共享**：别人无法使用你的模型
- **无法规模化**：无法服务大量用户
- **无法监控**：无法追踪模型性能

这就像**做了一道好菜但只能自己吃**——无法让更多人品尝。

### 解决方案

模型部署就是**把模型变成可用的服务**：

1. **模型持久化**：保存训练好的模型
2. **API 服务**：提供 HTTP 接口供调用
3. **容器化**：确保环境一致性
4. **监控维护**：追踪模型性能，及时更新

> **一句话总结**：部署让模型从实验室走向生产环境，创造实际价值。

---

## 2 模型持久化

### 方法 1：使用 pickle

```python
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

# 训练模型
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 保存模型
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

print("模型已保存到 model.pkl")

# 加载模型
with open("model.pkl", "rb") as f:
    loaded_model = pickle.load(f)

# 使用加载的模型
predictions = loaded_model.predict(X_test)
print(f"预测结果: {predictions}")
print(f"准确率: {loaded_model.score(X_test, y_test):.2%}")
```

### 方法 2：使用 joblib（推荐）

```python
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

# 训练模型
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 保存模型（推荐用于大型模型）
joblib.dump(model, "model.joblib")
print("模型已保存到 model.joblib")

# 加载模型
loaded_model = joblib.load("model.joblib")

# 使用加载的模型
predictions = loaded_model.predict(X_test)
print(f"预测结果: {predictions}")
print(f"准确率: {loaded_model.score(X_test, y_test):.2%}")
```

### pickle vs joblib

| 特性 | pickle | joblib |
| --- | --- | --- |
| 适用场景 | 通用 Python 对象 | NumPy 数组、大型模型 |
| 性能 | 一般 | 更快（针对 NumPy 优化） |
| 文件大小 | 较大 | 较小（压缩） |
| 推荐度 | 通用场景 | 机器学习模型（推荐） |

---

## 3 Flask API 部署

### 基础 API 服务

```python
# app.py
from flask import Flask, request, jsonify
import joblib
import numpy as np

# 创建 Flask 应用
app = Flask(__name__)

# 加载模型
model = joblib.load("model.joblib")

# 定义预测接口
@app.route("/predict", methods=["POST"])
def predict():
    # 获取请求数据
    data = request.get_json()
    
    # 提取特征
    features = np.array(data["features"]).reshape(1, -1)
    
    # 预测
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0].tolist()
    
    # 返回结果
    return jsonify({
        "prediction": int(prediction),
        "probability": probability
    })

# 健康检查接口
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})

# 启动服务
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

### 调用 API

```python
import requests
import json

# 准备数据
data = {
    "features": [5.1, 3.5, 1.4, 0.2]  # 鸢尾花特征
}

# 发送请求
response = requests.post(
    "http://localhost:5000/predict",
    json=data
)

# 解析结果
result = response.json()
print(f"预测类别: {result['prediction']}")
print(f"预测概率: {result['probability']}")
```

### 完整 API 示例（带预处理）

```python
# app.py
from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd

# 创建 Flask 应用
app = Flask(__name__)

# 加载模型和预处理器
model = joblib.load("customer_model.pkl")
scaler = joblib.load("customer_scaler.pkl")

# 类别映射
category_names = {
    0: "普通客户",
    1: "高价值客户",
    2: "流失风险客户"
}

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # 获取请求数据
        data = request.get_json()
        
        # 验证数据
        required_fields = ["年龄", "收入", "消费"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"缺少字段: {field}"}), 400
        
        # 构建特征向量
        features = pd.DataFrame([{
            "年龄": data["年龄"],
            "收入": data["收入"],
            "消费": data["消费"]
        }])
        
        # 预处理
        features_scaled = scaler.transform(features)
        
        # 预测
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0].tolist()
        
        # 返回结果
        return jsonify({
            "prediction": int(prediction),
            "category": category_names[prediction],
            "probability": {
                category_names[i]: prob
                for i, prob in enumerate(probability)
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "model": "customer_classifier"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

---

## 4 Docker 容器化

### 创建 Dockerfile

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
EXPOSE 5000

# 启动命令
CMD ["python", "app.py"]
```

### requirements.txt

```txt
flask==2.3.0
scikit-learn==1.3.0
joblib==1.3.0
numpy==1.24.0
pandas==2.0.0
requests==2.31.0
```

### 构建和运行

```bash
# 构建 Docker 镜像
docker build -t ml-api .

# 运行容器
docker run -p 5000:5000 ml-api

# 后台运行
docker run -d -p 5000:5000 --name ml-api-container ml-api

# 查看日志
docker logs ml-api-container

# 停止容器
docker stop ml-api-container
```

### Docker Compose（多服务）

```yaml
# docker-compose.yml
version: '3.8'

services:
  ml-api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    restart: always
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - ml-api
```

---

## 5 MLOps 基础

### 什么是 MLOps？

MLOps = Machine Learning + Operations

核心目标：

- **自动化**：模型训练、评估、部署自动化
- **监控**：追踪模型性能、数据漂移
- **版本控制**：模型版本、数据版本管理
- **持续集成**：代码测试、模型验证

### MLOps 工具链

| 环节 | 工具 | 作用 |
| --- | --- | --- |
| 实验追踪 | MLflow, Weights & Biases | 记录实验参数和结果 |
| 模型注册 | MLflow Model Registry | 管理模型版本 |
| 工作流编排 | Airflow, Kubeflow | 自动化训练流程 |
| 模型服务 | Flask, FastAPI, Seldon | 部署模型 API |
| 监控 | Prometheus, Grafana | 监控模型性能 |
| 数据版本 | DVC | 数据版本控制 |

### MLflow 入门

```python
# pip install mlflow
import mlflow
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 启动 MLflow（本地）
# mlflow ui

# 记录实验
with mlflow.start_run():
    # 参数
    n_estimators = 100
    max_depth = 10
    
    # 训练
    iris = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        iris.data, iris.target, test_size=0.2, random_state=42
    )
    
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # 评估
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    # 记录参数和指标
    mlflow.log_param("n_estimators", n_estimators)
    mlflow.log_param("max_depth", max_depth)
    mlflow.log_metric("accuracy", accuracy)
    
    # 保存模型
    mlflow.sklearn.log_model(model, "model")
    
    print(f"Accuracy: {accuracy:.2%}")
    print(f"Run ID: {mlflow.active_run().info.run_id}")
```

---

## 6 生产环境注意事项

### 性能优化

```python
# 1. 批量预测
@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    data = request.get_json()
    features = np.array(data["features"])  # 多个样本
    
    # 批量预测（比循环单个预测快）
    predictions = model.predict(features)
    
    return jsonify({
        "predictions": predictions.tolist()
    })

# 2. 模型缓存（避免重复加载）
_model_cache = {}

def get_model(model_path):
    if model_path not in _model_cache:
        _model_cache[model_path] = joblib.load(model_path)
    return _model_cache[model_path]

# 3. 异步处理（长耗时任务）
from celery import Celery

celery_app = Celery("tasks", broker="redis://localhost:6379/0")

@celery_app.task
def long_prediction_task(features):
    model = get_model("model.joblib")
    return model.predict(features).tolist()
```

### 安全考虑

```python
# 1. 输入验证
def validate_input(data):
    if "features" not in data:
        raise ValueError("缺少 features 字段")
    
    features = data["features"]
    if not isinstance(features, list):
        raise ValueError("features 必须是列表")
    
    if len(features) != 4:  # 鸢尾花 4 个特征
        raise ValueError("特征数量错误")
    
    # 数值范围检查
    for f in features:
        if not isinstance(f, (int, float)):
            raise ValueError("特征必须是数值")
        if f < 0 or f > 10:
            raise ValueError("特征值超出范围")

# 2. 速率限制
from flask_limiter import Limiter

limiter = Limiter(app, default_limits=["100 per hour"])

@app.route("/predict", methods=["POST"])
@limiter.limit("10 per minute")
def predict():
    # ...
    pass

# 3. 认证
from functools import wraps

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get("X-API-Key")
        if api_key != "your-secret-key":
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route("/predict", methods=["POST"])
@require_api_key
def predict():
    # ...
    pass
```

### 监控与日志

```python
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

@app.route("/predict", methods=["POST"])
def predict():
    start_time = datetime.now()
    
    try:
        # 预测逻辑
        # ...
        
        # 记录成功
        logging.info(f"Prediction successful - Duration: {(datetime.now() - start_time).total_seconds():.3f}s")
        
        return jsonify(result)
    
    except Exception as e:
        # 记录错误
        logging.error(f"Prediction failed: {str(e)}")
        return jsonify({"error": str(e)}), 500
```

---

## 7 持续学习路线

### Scikit-learn 进阶

学完本教程后，可以继续深入学习：

1. **高级算法**
   - 支持向量机（SVM）深入理解
   - 集成学习进阶（XGBoost, LightGBM）
   - 聚类算法高级（DBSCAN, 层次聚类）

2. **特征工程**
   - 特征选择高级方法
   - 特征构造技巧
   - 降维算法（PCA, t-SNE, UMAP）

3. **模型优化**
   - 超参数调优（Bayesian Optimization）
   - 交叉验证高级技巧
   - 模型解释性（SHAP, LIME）

### 深度学习

如果要做图像、文本、语音等复杂任务：

1. **PyTorch**
   - 张量操作
   - 自动求导
   - 神经网络构建
   - 训练技巧

2. **TensorFlow/Keras**
   - 高级 API
   - 模型部署（TensorFlow Serving）
   - 移动端部署（TensorFlow Lite）

3. **Transformer**
   - 注意力机制
   - BERT, GPT
   - 微调技巧

### 专业方向

根据兴趣选择：

| 方向 | 核心技能 | 应用场景 |
| --- | --- | --- |
| 计算机视觉 | CNN, 目标检测, 图像分割 | 自动驾驶, 医疗影像 |
| 自然语言处理 | Transformer, 文本分类, 命名实体识别 | 聊天机器人, 文本分析 |
| 推荐系统 | 协同过滤, 深度学习推荐 | 电商, 内容平台 |
| 时间序列 | LSTM, Prophet, ARIMA | 金融预测, 需求预测 |
| 强化学习 | Q-Learning, Policy Gradient | 游戏 AI, 机器人控制 |

### 学习资源

1. **官方文档**
   - Scikit-learn 官方文档（最权威）
   - 示例代码和教程

2. **书籍**
   - 《Hands-On Machine Learning》（实战导向）
   - 《Python 机器学习》（中文友好）

3. **在线课程**
   - Coursera: Machine Learning (Andrew Ng)
   - Kaggle Learn（免费，实战导向）

4. **实践平台**
   - Kaggle（竞赛 + 数据集）
   - GitHub（开源项目）
   - 个人项目（解决实际问题）

---

## 8 新手常见误区

### 误区 1："模型训练完就结束了"

**错！** 模型部署才是创造价值的开始。需要考虑：

- 如何提供服务
- 如何监控性能
- 如何更新迭代

### 误区 2："pickle 可以保存所有模型"

不是的。pickle 有安全风险，且跨版本兼容性差。生产环境建议：

- 使用 joblib（针对 NumPy 优化）
- 使用 ONNX（跨平台）
- 使用 PMML（标准格式）

### 误区 3："部署后不需要监控"

**错！** 模型性能会随时间下降（数据漂移）。需要：

- 监控预测分布
- 追踪准确率变化
- 定期重新训练

### 误区 4："Docker 太复杂，不需要"

不是的。Docker 确保环境一致性，避免"在我电脑上能跑"的问题。生产环境必备。

### 误区 5："学完 Scikit-learn 就可以做所有机器学习任务"

不是的。Scikit-learn 适合传统机器学习任务。深度学习、大规模数据需要其他工具：

- 深度学习：PyTorch, TensorFlow
- 大数据：Spark MLlib
- 推荐系统：Surprise, implicit

---

## 9 动手练习

### 练习 1：基础练习

训练一个模型，用 joblib 保存和加载，验证预测结果一致。

<details>
<summary>点击查看答案</summary>

```python
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

# 1. 训练模型
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 2. 原始预测
original_pred = model.predict(X_test)
original_acc = accuracy_score(y_test, original_pred)

# 3. 保存模型
joblib.dump(model, "iris_model.joblib")
print("模型已保存")

# 4. 加载模型
loaded_model = joblib.load("iris_model.joblib")

# 5. 加载后预测
loaded_pred = loaded_model.predict(X_test)
loaded_acc = accuracy_score(y_test, loaded_pred)

# 6. 验证一致性
print(f"原始准确率: {original_acc:.2%}")
print(f"加载后准确率: {loaded_acc:.2%}")
print(f"预测结果一致: {np.array_equal(original_pred, loaded_pred)}")
```

</details>

### 练习 2：进阶练习

用 Flask 创建一个简单的预测 API，支持 CORS 和错误处理。

<details>
<summary>点击查看答案</summary>

```python
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)  # 允许跨域

# 加载模型
model = joblib.load("iris_model.joblib")
target_names = ["setosa", "versicolor", "virginica"]

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # 获取数据
        data = request.get_json()
        
        if "features" not in data:
            return jsonify({"error": "缺少 features 字段"}), 400
        
        features = np.array(data["features"]).reshape(1, -1)
        
        if features.shape[1] != 4:
            return jsonify({"error": "特征数量必须是 4"}), 400
        
        # 预测
        prediction = model.predict(features)[0]
        probability = model.predict_proba(features)[0].tolist()
        
        return jsonify({
            "prediction": int(prediction),
            "class": target_names[prediction],
            "probability": {
                target_names[i]: round(prob, 3)
                for i, prob in enumerate(probability)
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

测试：

```python
import requests

response = requests.post(
    "http://localhost:5000/predict",
    json={"features": [5.1, 3.5, 1.4, 0.2]}
)

print(response.json())
```

</details>

### 练习 3（挑战）：综合练习

完成一个完整的部署流程：训练模型、保存、创建 API、Docker 化。

<details>
<summary>点击查看答案</summary>

```python
# 1. train_and_save.py
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

# 训练
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 保存
joblib.dump(model, "model.joblib")
print("模型已保存")
```

```python
# 2. app.py
from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)
model = joblib.load("model.joblib")
target_names = ["setosa", "versicolor", "virginica"]

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    features = np.array(data["features"]).reshape(1, -1)
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0].tolist()
    
    return jsonify({
        "prediction": int(prediction),
        "class": target_names[prediction],
        "probability": {target_names[i]: prob for i, prob in enumerate(probability)}
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

```txt
# 3. requirements.txt
flask==2.3.0
scikit-learn==1.3.0
joblib==1.3.0
numpy==1.24.0
```

```dockerfile
# 4. Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

```bash
# 5. 构建和运行
docker build -t iris-api .
docker run -p 5000:5000 iris-api
```

```python
# 6. 测试
import requests

response = requests.post(
    "http://localhost:5000/predict",
    json={"features": [5.1, 3.5, 1.4, 0.2]}
)

print(response.json())
```

</details>

---

## 10 教程总结

恭喜你完成了 Scikit-learn 实战教程的全部 16 章！

### 你学到了什么

1. **基础篇（1-4 章）**
   - Scikit-learn 简介与环境搭建
   - 数据加载与探索
   - 数据预处理
   - 特征工程

2. **进阶篇（5-10 章）**
   - 监督学习：回归算法
   - 监督学习：分类算法
   - 模型评估与验证
   - 无监督学习：聚类算法
   - 无监督学习：降维算法
   - 集成学习方法

3. **实战篇（11-16 章）**
   - 模型优化与调参
   - 特征选择
   - 文本数据处理
   - 实战项目：房价预测系统
   - 实战项目：客户分类与推荐
   - 模型持久化与部署

### 下一步建议

1. **实践项目**：找一个真实数据集，完成端到端的机器学习项目
2. **Kaggle 竞赛**：参加入门级竞赛，提升实战能力
3. **开源贡献**：阅读 Scikit-learn 源码，学习优秀设计
4. **持续学习**：根据兴趣选择深度学习、NLP、CV 等方向

### 最后的建议

- **动手实践**：看十遍不如写一遍
- **解决问题**：遇到 bug 不要怕，解决 bug 的过程就是学习
- **持续学习**：机器学习领域发展很快，保持学习的热情
- **分享交流**：加入社区，与他人交流学习心得

祝你在机器学习的道路上一路顺风！
