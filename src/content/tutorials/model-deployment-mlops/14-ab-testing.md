---
title: "第14章：A/B 测试与灰度发布"
description: "A/B 测试原理，流量分配策略，灰度发布实现"
---

# 第14章：A/B 测试与灰度发布

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 A/B 测试？为什么要用它？
- 如何安全地发布新版本？
- 如何控制流量分配？
- 发现问题如何快速回滚？

这一章就是为了解答这些问题。我们会学习 A/B 测试和灰度发布的原理，掌握如何安全地发布新版本。

---

## 1 为什么需要 A/B 测试和灰度发布？

### 痛点分析

想象一下这个场景：你训练了一个新模型，准备上线：

```python
# 直接替换旧模型
model = load_model('model_v2.pkl')

# 结果：
# - 新模型效果比旧模型差
# - 用户投诉：预测不准
# - 需要紧急回滚
# - 但回滚也需要时间...
```

或者更糟糕的情况：

```python
# 新模型有 bug
# 所有用户都受影响
# 业务损失严重...
```

> **一句话总结**：直接全量发布风险太大，需要逐步验证。

### 解决方案

核心思路：
- **A/B 测试**：同时运行多个版本，对比效果
- **灰度发布**：先发布给小部分用户，逐步扩大
- **流量控制**：精确控制每个版本的流量比例
- **快速回滚**：发现问题立即回滚

打个比方：

> 灰度发布就像试吃，先让少数人尝尝，没问题再推广给所有人。

---

## 2 核心原理

### A/B 测试原理

```
用户请求 → 流量分配 → A 版本（50%）
                    → B 版本（50%）
                    
收集数据 → 对比分析 → 选择最优版本
```

### 灰度发布策略

| 策略 | 说明 | 适用场景 |
| --- | --- | --- |
| 固定比例 | 固定百分比流量 | 简单场景 |
| 用户分组 | 按用户 ID 分组 | 需要一致性 |
| 地域分组 | 按地域分配 | 地域性测试 |
| 渐进式 | 逐步增加比例 | 风险控制 |

---

## 3 基础用法

### 简单的 A/B 测试实现

```python
from fastapi import FastAPI, Request
from pydantic import BaseModel
import joblib
import numpy as np
import random

app = FastAPI()

# 加载两个版本的模型
model_a = joblib.load('model_v1.joblib')
model_b = joblib.load('model_v2.joblib')

class PredictRequest(BaseModel):
    features: list[float]

class PredictResponse(BaseModel):
    prediction: int
    model_version: str

# 流量分配
TRAFFIC_SPLIT = 0.5  # 50% 流量到 A，50% 到 B

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest, req: Request):
    # 随机分配流量
    if random.random() < TRAFFIC_SPLIT:
        model = model_a
        version = "A"
    else:
        model = model_b
        version = "B"
    
    # 推理
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    
    return PredictResponse(
        prediction=prediction,
        model_version=version
    )
```

### 基于用户 ID 的流量分配

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import hashlib

app = FastAPI()

model_a = joblib.load('model_v1.joblib')
model_b = joblib.load('model_v2.joblib')

class PredictRequest(BaseModel):
    user_id: str
    features: list[float]

def get_model_version(user_id: str) -> str:
    """根据用户 ID 确定模型版本"""
    # 使用哈希确保同一用户总是使用同一版本
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    return "A" if hash_value % 100 < 50 else "B"

@app.post("/predict")
def predict(request: PredictRequest):
    version = get_model_version(request.user_id)
    model = model_a if version == "A" else model_b
    
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    
    return {
        "prediction": prediction,
        "model_version": version,
        "user_id": request.user_id
    }
```

### 使用 Nginx 实现流量分配

创建 `nginx.conf`：

```nginx
upstream model_a {
    server model-a:8000;
}

upstream model_b {
    server model-b:8000;
}

# 使用 split_clients 实现流量分配
split_clients $request_id $model_version {
    50% model_a;
    50% model_b;
}

server {
    listen 80;

    location /predict {
        # 根据分配结果转发到不同后端
        if ($model_version = model_a) {
            proxy_pass http://model_a;
        }
        if ($model_version = model_b) {
            proxy_pass http://model_b;
        }
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Model-Version $model_version;
    }
}
```

---

## 4 进阶用法

### 渐进式灰度发布

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import time

app = FastAPI()

# 模型版本
models = {
    "v1": joblib.load('model_v1.joblib'),
    "v2": joblib.load('model_v2.joblib')
}

# 灰度配置
gray_config = {
    "current_version": "v1",
    "new_version": "v2",
    "traffic_percentage": 0,  # 初始 0%
    "step": 10,               # 每次增加 10%
    "max_percentage": 100,
    "monitor_duration": 300   # 监控 5 分钟
}

class PredictRequest(BaseModel):
    features: list[float]
    user_id: str = None

def should_use_new_version(user_id: str = None) -> bool:
    """决定是否使用新版本"""
    if gray_config["traffic_percentage"] == 0:
        return False
    if gray_config["traffic_percentage"] == 100:
        return True
    
    # 基于用户 ID 或随机分配
    if user_id:
        import hashlib
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        return (hash_value % 100) < gray_config["traffic_percentage"]
    else:
        import random
        return random.random() * 100 < gray_config["traffic_percentage"]

@app.post("/predict")
def predict(request: PredictRequest):
    use_new = should_use_new_version(request.user_id)
    version = gray_config["new_version"] if use_new else gray_config["current_version"]
    model = models[version]
    
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    
    return {
        "prediction": prediction,
        "model_version": version,
        "traffic_percentage": gray_config["traffic_percentage"]
    }

@app.post("/admin/gray-release")
def update_gray_release(percentage: int):
    """更新灰度比例"""
    if 0 <= percentage <= 100:
        gray_config["traffic_percentage"] = percentage
        return {"message": f"灰度比例已更新为 {percentage}%"}
    return {"error": "百分比必须在 0-100 之间"}

@app.post("/admin/promote")
def promote_version():
    """将新版本提升为正式版本"""
    gray_config["current_version"] = gray_config["new_version"]
    gray_config["traffic_percentage"] = 0
    return {"message": "版本提升成功"}
```

### 使用 Istio 实现流量管理

创建 `virtual-service.yaml`：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: model-api
spec:
  hosts:
  - model-api
  http:
  - route:
    - destination:
        host: model-api
        subset: v1
      weight: 90  # 90% 流量到 v1
    - destination:
        host: model-api
        subset: v2
      weight: 10  # 10% 流量到 v2
```

创建 `destination-rule.yaml`：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: model-api
spec:
  host: model-api
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

应用配置：

```bash
kubectl apply -f virtual-service.yaml
kubectl apply -f destination-rule.yaml

# 更新流量比例
kubectl patch virtualservice model-api -p '{"spec":{"http":[{"route":[{"destination":{"host":"model-api","subset":"v1"},"weight":80},{"destination":{"host":"model-api","subset":"v2"},"weight":20}]}]}}'
```

### 监控和自动回滚

```python
from fastapi import FastAPI
import time
import threading
from collections import deque

app = FastAPI()

# 监控数据
metrics = {
    "v1": {"requests": 0, "errors": 0, "latencies": deque(maxlen=1000)},
    "v2": {"requests": 0, "errors": 0, "latencies": deque(maxlen=1000)}
}

# 灰度配置
gray_config = {
    "current_version": "v1",
    "new_version": "v2",
    "traffic_percentage": 10,
    "auto_rollback": True,
    "error_threshold": 0.05,  # 错误率超过 5% 自动回滚
    "latency_threshold": 2.0   # 延迟超过 2 秒自动回滚
}

def record_metric(version: str, latency: float, error: bool = False):
    """记录指标"""
    metrics[version]["requests"] += 1
    metrics[version]["latencies"].append(latency)
    if error:
        metrics[version]["errors"] += 1

def monitor_gray_release():
    """监控灰度发布"""
    while True:
        time.sleep(60)  # 每分钟检查一次
        
        v2_metrics = metrics["v2"]
        if v2_metrics["requests"] == 0:
            continue
        
        # 计算错误率
        error_rate = v2_metrics["errors"] / v2_metrics["requests"]
        
        # 计算平均延迟
        avg_latency = sum(v2_metrics["latencies"]) / len(v2_metrics["latencies"])
        
        # 检查是否需要回滚
        if gray_config["auto_rollback"]:
            if error_rate > gray_config["error_threshold"]:
                print(f"错误率过高 ({error_rate:.2%})，自动回滚...")
                gray_config["traffic_percentage"] = 0
            elif avg_latency > gray_config["latency_threshold"]:
                print(f"延迟过高 ({avg_latency:.2f}s)，自动回滚...")
                gray_config["traffic_percentage"] = 0

# 启动监控线程
@app.on_event("startup")
def startup():
    thread = threading.Thread(target=monitor_gray_release, daemon=True)
    thread.start()

@app.get("/metrics")
def get_metrics():
    """获取监控指标"""
    result = {}
    for version, data in metrics.items():
        if data["requests"] > 0:
            result[version] = {
                "requests": data["requests"],
                "errors": data["errors"],
                "error_rate": data["errors"] / data["requests"],
                "avg_latency": sum(data["latencies"]) / len(data["latencies"]) if data["latencies"] else 0
            }
    return result
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| A/B 测试 | 同时运行多个版本，对比效果 |
| 灰度发布 | 先发布给小部分用户，逐步扩大 |
| 流量分配 | 精确控制每个版本的流量比例 |
| 用户分组 | 基于用户 ID 确保一致性 |
| 渐进式发布 | 逐步增加新版本流量比例 |
| 自动回滚 | 监控指标异常时自动回滚 |

---

## 6 新手常见误区

### 误区 1："A/B 测试只需要随机分配流量"

**错！** 随机分配可能导致：
- 同一用户在不同请求中使用不同版本
- 用户体验不一致
- 数据不准确

正确做法：使用用户 ID 哈希，确保同一用户总是使用同一版本。

### 误区 2："灰度发布不需要监控"

**错！** 没有监控会导致：
- 无法及时发现问题
- 影响范围扩大
- 回滚延迟

正确做法：实时监控错误率、延迟等指标，设置自动回滚。

### 误区 3："灰度比例可以一次性调到 100%"

**错！** 直接全量发布会导致：
- 风险集中
- 无法逐步验证
- 回滚成本高

正确做法：逐步增加比例（10% → 30% → 50% → 100%）。

### 误区 4："A/B 测试时间越短越好"

**错！** 测试时间太短会导致：
- 样本量不足
- 结果不可靠
- 无法发现长期问题

正确做法：根据业务特点确定测试时间，通常至少 1-2 周。

### 误区 5："不需要记录 A/B 测试数据"

**错！** 不记录数据会导致：
- 无法分析结果
- 无法对比效果
- 无法优化策略

正确做法：记录每个版本的请求数、错误率、延迟等指标。

---

## 7 动手练习

### 练习 1：基础练习 - 实现简单的 A/B 测试

实现一个支持 A/B 测试的预测接口。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import random

app = FastAPI()

model_a = joblib.load('model_v1.joblib')
model_b = joblib.load('model_v2.joblib')

class PredictRequest(BaseModel):
    features: list[float]

@app.post("/predict")
def predict(request: PredictRequest):
    # 随机分配
    if random.random() < 0.5:
        model, version = model_a, "A"
    else:
        model, version = model_b, "B"
    
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    
    return {"prediction": prediction, "version": version}
```

</details>

### 练习 2：进阶练习 - 基于用户 ID 的流量分配

实现基于用户 ID 的流量分配，确保同一用户总是使用同一版本。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import hashlib

app = FastAPI()

model_a = joblib.load('model_v1.joblib')
model_b = joblib.load('model_v2.joblib')

class PredictRequest(BaseModel):
    user_id: str
    features: list[float]

def get_version(user_id: str) -> str:
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    return "A" if hash_value % 100 < 50 else "B"

@app.post("/predict")
def predict(request: PredictRequest):
    version = get_version(request.user_id)
    model = model_a if version == "A" else model_b
    
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    
    return {"prediction": prediction, "version": version, "user_id": request.user_id}
```

</details>

### 练习 3（挑战）：综合练习 - 实现渐进式灰度发布

实现一个渐进式灰度发布系统，支持流量控制、监控和自动回滚。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import hashlib
import time
import threading
from collections import deque

app = FastAPI()

models = {
    "v1": joblib.load('model_v1.joblib'),
    "v2": joblib.load('model_v2.joblib')
}

config = {
    "current": "v1",
    "new": "v2",
    "percentage": 0,
    "auto_rollback": True,
    "error_threshold": 0.05
}

metrics = {
    "v1": {"requests": 0, "errors": 0},
    "v2": {"requests": 0, "errors": 0}
}

class PredictRequest(BaseModel):
    user_id: str
    features: list[float]

def get_version(user_id: str) -> str:
    if config["percentage"] == 0:
        return config["current"]
    if config["percentage"] == 100:
        return config["new"]
    
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    return config["new"] if hash_value % 100 < config["percentage"] else config["current"]

@app.post("/predict")
def predict(request: PredictRequest):
    version = get_version(request.user_id)
    model = models[version]
    
    metrics[version]["requests"] += 1
    
    try:
        input_data = np.array([request.features])
        prediction = int(model.predict(input_data)[0])
        return {"prediction": prediction, "version": version}
    except Exception as e:
        metrics[version]["errors"] += 1
        raise

@app.post("/admin/gray")
def update_gray(percentage: int):
    if 0 <= percentage <= 100:
        config["percentage"] = percentage
        return {"message": f"灰度比例: {percentage}%"}
    return {"error": "Invalid percentage"}

@app.get("/metrics")
def get_metrics():
    result = {}
    for v, m in metrics.items():
        if m["requests"] > 0:
            result[v] = {
                "requests": m["requests"],
                "errors": m["errors"],
                "error_rate": m["errors"] / m["requests"]
            }
    return result

def monitor():
    while True:
        time.sleep(60)
        v2 = metrics["v2"]
        if v2["requests"] > 0:
            error_rate = v2["errors"] / v2["requests"]
            if config["auto_rollback"] and error_rate > config["error_threshold"]:
                print(f"自动回滚: 错误率 {error_rate:.2%}")
                config["percentage"] = 0

@app.on_event("startup")
def startup():
    threading.Thread(target=monitor, daemon=True).start()
```

</details>

---

## 下一章预告

下一章我们会学习 **模型服务高可用架构**——也就是如何保证服务的高可用性。你会学到：

- 高可用设计原则
- 负载均衡策略
- 故障转移机制
- 灾备方案

掌握这些知识后，你就能构建高可用的模型服务了。
