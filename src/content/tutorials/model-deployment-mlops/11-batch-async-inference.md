---
title: "第11章：批处理与异步推理"
description: "批量推理策略，异步任务队列，消息队列集成"
---

# 第11章：批处理与异步推理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何处理高并发的推理请求？
- 批量推理和单条推理有什么区别？
- 如何实现异步推理，不阻塞主线程？
- 如何使用消息队列处理大量请求？

这一章就是为了解答这些问题。我们会学习批处理和异步推理的技术，掌握如何构建高并发的模型服务。

---

## 1 为什么需要批处理和异步？

### 痛点分析

想象一下这个场景：你的模型服务上线了，用户量激增：

```python
# 100 个并发请求
for request in requests:
    result = model.predict(request)  # 一个一个处理，太慢了！

# 结果：
# - 响应时间：5 秒
# - 用户投诉：太慢了！
# - 服务器：CPU 100%，内存溢出
```

或者更糟糕的情况：

```python
# 用户提交了一个耗时的推理任务
# 同步等待，页面卡死
# 用户以为系统崩了，刷新页面
# 任务丢失...
```

> **一句话总结**：同步单条推理无法满足高并发需求，需要批处理和异步。

### 解决方案

核心思路：
- **批量推理**：将多个请求合并为一批处理
- **异步推理**：不阻塞主线程，立即返回
- **任务队列**：使用消息队列管理任务
- **结果回调**：推理完成后通知客户端

打个比方：

> 批量推理就像公交车，一次载多人；异步推理就像外卖，下单后不用等，做好了送来。

---

## 2 核心原理

### 批量推理原理

```
单条推理：
请求1 → 推理 → 响应
请求2 → 推理 → 响应
请求3 → 推理 → 响应
总时间：3T

批量推理：
请求1 ┐
请求2 ├→ 批量推理 → 响应
请求3 ┘
总时间：1.5T（通常比单条快）
```

### 异步推理原理

```
同步推理：
客户端 → 等待 → 结果
（阻塞，用户需要等待）

异步推理：
客户端 → 提交任务 → 立即返回任务ID
         ↓
      后台处理
         ↓
      完成通知
（非阻塞，用户可以继续操作）
```

---

## 3 基础用法

### 批量推理

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import time
from typing import List

app = FastAPI()
model = joblib.load('model.joblib')

class PredictRequest(BaseModel):
    features: List[float]

class BatchPredictRequest(BaseModel):
    requests: List[PredictRequest]

class PredictResponse(BaseModel):
    prediction: int
    inference_time_ms: float

class BatchPredictResponse(BaseModel):
    predictions: List[int]
    total_time_ms: float
    avg_time_ms: float

# 单条推理
@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    start = time.time()
    
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    
    inference_time = (time.time() - start) * 1000
    
    return PredictResponse(
        prediction=prediction,
        inference_time_ms=round(inference_time, 2)
    )

# 批量推理
@app.post("/predict/batch", response_model=BatchPredictResponse)
def batch_predict(request: BatchPredictRequest):
    start = time.time()
    
    # 提取所有特征
    features_list = [req.features for req in request.requests]
    input_data = np.array(features_list)
    
    # 批量推理
    predictions = model.predict(input_data).tolist()
    
    total_time = (time.time() - start) * 1000
    avg_time = total_time / len(predictions)
    
    return BatchPredictResponse(
        predictions=[int(p) for p in predictions],
        total_time_ms=round(total_time, 2),
        avg_time_ms=round(avg_time, 2)
    )
```

### 异步推理

```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import joblib
import numpy as np
import uuid
from typing import Dict
import asyncio

app = FastAPI()
model = joblib.load('model.joblib')

# 存储任务状态和结果
tasks: Dict[str, dict] = {}

class AsyncPredictRequest(BaseModel):
    features: list[float]

class TaskResponse(BaseModel):
    task_id: str
    status: str

class TaskResult(BaseModel):
    task_id: str
    status: str
    result: dict = None

# 异步推理接口
@app.post("/predict/async", response_model=TaskResponse)
async def async_predict(
    request: AsyncPredictRequest,
    background_tasks: BackgroundTasks
):
    # 生成任务 ID
    task_id = str(uuid.uuid4())
    
    # 初始化任务状态
    tasks[task_id] = {
        "status": "processing",
        "result": None
    }
    
    # 添加后台任务
    background_tasks.add_task(
        process_prediction,
        task_id,
        request.features
    )
    
    return TaskResponse(task_id=task_id, status="processing")

# 后台处理任务
async def process_prediction(task_id: str, features: list[float]):
    # 模拟异步处理（实际中可能是 I/O 操作）
    await asyncio.sleep(2)
    
    # 执行推理
    input_data = np.array([features])
    prediction = int(model.predict(input_data)[0])
    
    # 更新任务结果
    tasks[task_id] = {
        "status": "completed",
        "result": {"prediction": prediction}
    }

# 查询任务结果
@app.get("/predict/result/{task_id}", response_model=TaskResult)
async def get_result(task_id: str):
    if task_id not in tasks:
        return TaskResult(
            task_id=task_id,
            status="not_found"
        )
    
    task = tasks[task_id]
    return TaskResult(
        task_id=task_id,
        status=task["status"],
        result=task["result"]
    )
```

### 使用 Redis 队列

```python
from fastapi import FastAPI
from pydantic import BaseModel
import redis
import json
import uuid
import threading
import joblib
import numpy as np
import time

app = FastAPI()

# Redis 连接
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# 加载模型
model = joblib.load('model.joblib')

class PredictRequest(BaseModel):
    features: list[float]

class TaskResponse(BaseModel):
    task_id: str
    status: str

# 提交任务到队列
@app.post("/predict/queue", response_model=TaskResponse)
def submit_to_queue(request: PredictRequest):
    task_id = str(uuid.uuid4())
    
    # 创建任务
    task = {
        "task_id": task_id,
        "features": request.features,
        "status": "pending",
        "created_at": time.time()
    }
    
    # 推入 Redis 队列
    redis_client.lpush("prediction_queue", json.dumps(task))
    
    # 保存任务状态
    redis_client.hset(f"task:{task_id}", mapping={
        "status": "pending",
        "created_at": task["created_at"]
    })
    
    return TaskResponse(task_id=task_id, status="pending")

# 查询任务状态
@app.get("/task/{task_id}")
def get_task_status(task_id: str):
    task_data = redis_client.hgetall(f"task:{task_id}")
    
    if not task_data:
        return {"error": "Task not found"}
    
    return {
        "task_id": task_id,
        "status": task_data.get(b"status", b"unknown").decode(),
        "result": task_data.get(b"result", b"").decode()
    }

# 后台工作线程
def worker():
    print("Worker started")
    
    while True:
        # 从队列获取任务（阻塞）
        _, task_json = redis_client.brpop("prediction_queue")
        task = json.loads(task_json)
        
        task_id = task["task_id"]
        features = task["features"]
        
        # 更新状态为处理中
        redis_client.hset(f"task:{task_id}", "status", "processing")
        
        try:
            # 执行推理
            input_data = np.array([features])
            prediction = int(model.predict(input_data)[0])
            
            # 保存结果
            redis_client.hset(f"task:{task_id}", mapping={
                "status": "completed",
                "result": json.dumps({"prediction": prediction}),
                "completed_at": time.time()
            })
            
            print(f"Task {task_id} completed")
        
        except Exception as e:
            redis_client.hset(f"task:{task_id}", mapping={
                "status": "failed",
                "error": str(e)
            })

# 启动工作线程
@app.on_event("startup")
def startup():
    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
```

---

## 4 进阶用法

### 动态批处理

```python
import asyncio
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import time
from typing import List
from collections import deque

app = FastAPI()
model = joblib.load('model.joblib')

# 批处理配置
BATCH_SIZE = 32
BATCH_TIMEOUT = 0.1  # 100ms

# 请求队列
request_queue = deque()
result_futures = {}

class PredictRequest(BaseModel):
    features: list[float]

class PredictResponse(BaseModel):
    prediction: int
    inference_time_ms: float

# 批处理工作协程
async def batch_worker():
    while True:
        # 等待请求或超时
        batch = []
        futures = []
        
        start_time = time.time()
        
        # 收集一批请求
        while len(batch) < BATCH_SIZE:
            if time.time() - start_time > BATCH_TIMEOUT:
                break
            
            if request_queue:
                features, future = request_queue.popleft()
                batch.append(features)
                futures.append(future)
            else:
                await asyncio.sleep(0.001)
        
        if batch:
            # 批量推理
            input_data = np.array(batch)
            predictions = model.predict(input_data).tolist()
            
            # 设置结果
            for future, prediction in zip(futures, predictions):
                future.set_result(int(prediction))
        
        await asyncio.sleep(0.001)

# 启动工作协程
@app.on_event("startup")
async def startup():
    asyncio.create_task(batch_worker())

# 预测接口
@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    start_time = time.time()
    
    # 创建 Future
    loop = asyncio.get_event_loop()
    future = loop.create_future()
    
    # 加入队列
    request_queue.append((request.features, future))
    
    # 等待结果
    prediction = await future
    
    inference_time = (time.time() - start_time) * 1000
    
    return PredictResponse(
        prediction=prediction,
        inference_time_ms=round(inference_time, 2)
    )
```

### 使用 Celery 任务队列

```python
from celery import Celery
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

# 创建 Celery 应用
celery_app = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# 加载模型
model = joblib.load('model.joblib')

# 定义 Celery 任务
@celery_app.task
def predict_task(features: list[float]):
    input_data = np.array([features])
    prediction = int(model.predict(input_data)[0])
    return {"prediction": prediction}

# FastAPI 应用
app = FastAPI()

class PredictRequest(BaseModel):
    features: list[float]

class TaskResponse(BaseModel):
    task_id: str
    status: str

# 提交异步任务
@app.post("/predict/celery", response_model=TaskResponse)
def predict_celery(request: PredictRequest):
    # 提交任务到 Celery
    task = predict_task.delay(request.features)
    
    return TaskResponse(
        task_id=task.id,
        status="pending"
    )

# 查询任务结果
@app.get("/task/{task_id}")
def get_task_result(task_id: str):
    # 获取任务结果
    task = predict_task.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        return {"task_id": task_id, "status": "pending"}
    elif task.state == 'SUCCESS':
        return {
            "task_id": task_id,
            "status": "completed",
            "result": task.result
        }
    elif task.state == 'FAILURE':
        return {
            "task_id": task_id,
            "status": "failed",
            "error": str(task.info)
        }
    else:
        return {"task_id": task_id, "status": task.state}
```

启动 Celery Worker：

```bash
celery -A main.celery_app worker --loglevel=info
```

### 使用 RabbitMQ 消息队列

```python
import pika
import json
import threading
import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
import uuid

app = FastAPI()

# 加载模型
model = joblib.load('model.joblib')

# RabbitMQ 连接
connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost')
)
channel = connection.channel()

# 声明队列
channel.queue_declare(queue='prediction_requests')
channel.queue_declare(queue='prediction_results')

class PredictRequest(BaseModel):
    features: list[float]
    callback_url: str = None  # 可选的回调 URL

class TaskResponse(BaseModel):
    task_id: str
    status: str

# 提交任务
@app.post("/predict/rabbitmq", response_model=TaskResponse)
def submit_to_rabbitmq(request: PredictRequest):
    task_id = str(uuid.uuid4())
    
    # 创建任务消息
    message = {
        "task_id": task_id,
        "features": request.features,
        "callback_url": request.callback_url
    }
    
    # 发送到队列
    channel.basic_publish(
        exchange='',
        routing_key='prediction_requests',
        body=json.dumps(message)
    )
    
    return TaskResponse(task_id=task_id, status="pending")

# 工作线程
def worker():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters('localhost')
    )
    channel = connection.channel()
    
    def callback(ch, method, properties, body):
        task = json.loads(body)
        task_id = task["task_id"]
        features = task["features"]
        
        # 执行推理
        input_data = np.array([features])
        prediction = int(model.predict(input_data)[0])
        
        # 发送结果
        result = {
            "task_id": task_id,
            "prediction": prediction
        }
        
        channel.basic_publish(
            exchange='',
            routing_key='prediction_results',
            body=json.dumps(result)
        )
        
        # 确认消息
        ch.basic_ack(delivery_tag=method.delivery_tag)
    
    channel.basic_consume(
        queue='prediction_requests',
        on_message_callback=callback
    )
    
    print("Worker started")
    channel.start_consuming()

# 启动工作线程
@app.on_event("startup")
def startup():
    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 批量推理 | 将多个请求合并为一批处理，提高吞吐量 |
| 异步推理 | 不阻塞主线程，立即返回任务 ID |
| 任务队列 | 使用 Redis/RabbitMQ/Celery 管理任务 |
| 动态批处理 | 根据请求量动态调整批次大小 |
| 结果回调 | 推理完成后通知客户端 |
| 并发优化 | 使用异步、多线程、多进程提高并发能力 |

---

## 6 新手常见误区

### 误区 1："批量推理一定比单条推理快"

**错！** 批量推理的优势在于：
- 提高吞吐量
- 充分利用硬件并行能力
- 减少函数调用开销

但如果批次太小或太大，可能没有优势。

正确做法：测试不同批次大小，找到最优值。

### 误区 2："异步推理不需要考虑并发"

**错！** 异步推理仍然需要考虑：
- 任务队列的容量
- 工作线程的数量
- 内存限制

正确做法：合理配置队列大小和 worker 数量。

### 误区 3："任务队列不需要监控"

**错！** 任务队列需要监控：
- 队列长度
- 处理延迟
- 失败率

正确做法：监控队列状态，及时发现和处理问题。

### 误区 4："异步推理的结果不需要持久化"

**错！** 不持久化会导致：
- 服务重启后结果丢失
- 无法查询历史结果
- 无法重试失败任务

正确做法：将结果存储到数据库或 Redis。

### 误区 5："所有任务都适合异步"

**错！** 异步适合：
- 耗时较长的任务
- 不需要立即返回结果
- 可以接受延迟

不适合：
- 需要实时响应的场景
- 简单的快速推理

正确做法：根据场景选择同步或异步。

---

## 7 动手练习

### 练习 1：基础练习 - 实现批量推理

实现一个支持批量推理的 API 接口。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import time
from typing import List

app = FastAPI()
model = joblib.load('model.joblib')

class BatchRequest(BaseModel):
    features_list: List[list[float]]

class BatchResponse(BaseModel):
    predictions: List[int]
    total_time_ms: float

@app.post("/predict/batch", response_model=BatchResponse)
def batch_predict(request: BatchRequest):
    start = time.time()
    
    # 批量推理
    input_data = np.array(request.features_list)
    predictions = model.predict(input_data).tolist()
    
    total_time = (time.time() - start) * 1000
    
    return BatchResponse(
        predictions=[int(p) for p in predictions],
        total_time_ms=round(total_time, 2)
    )
```

</details>

### 练习 2：进阶练习 - 实现异步推理

使用 FastAPI 的 BackgroundTasks 实现异步推理。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import joblib
import numpy as np
import uuid
from typing import Dict

app = FastAPI()
model = joblib.load('model.joblib')
tasks: Dict[str, dict] = {}

class PredictRequest(BaseModel):
    features: list[float]

@app.post("/predict/async")
async def async_predict(request: PredictRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "processing"}
    
    background_tasks.add_task(process_task, task_id, request.features)
    
    return {"task_id": task_id, "status": "processing"}

async def process_task(task_id: str, features: list[float]):
    import asyncio
    await asyncio.sleep(2)  # 模拟耗时
    
    input_data = np.array([features])
    prediction = int(model.predict(input_data)[0])
    
    tasks[task_id] = {
        "status": "completed",
        "prediction": prediction
    }

@app.get("/task/{task_id}")
def get_result(task_id: str):
    return tasks.get(task_id, {"error": "not found"})
```

</details>

### 练习 3（挑战）：综合练习 - 使用 Redis 队列

实现一个基于 Redis 队列的异步推理系统。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from pydantic import BaseModel
import redis
import json
import uuid
import threading
import joblib
import numpy as np
import time

app = FastAPI()
redis_client = redis.Redis(host='localhost', port=6379, db=0)
model = joblib.load('model.joblib')

class PredictRequest(BaseModel):
    features: list[float]

@app.post("/predict/queue")
def submit_to_queue(request: PredictRequest):
    task_id = str(uuid.uuid4())
    
    task = {
        "task_id": task_id,
        "features": request.features,
        "status": "pending",
        "created_at": time.time()
    }
    
    redis_client.lpush("prediction_queue", json.dumps(task))
    redis_client.hset(f"task:{task_id}", mapping={
        "status": "pending",
        "created_at": task["created_at"]
    })
    
    return {"task_id": task_id, "status": "pending"}

@app.get("/task/{task_id}")
def get_task(task_id: str):
    task_data = redis_client.hgetall(f"task:{task_id}")
    
    if not task_data:
        return {"error": "not found"}
    
    return {
        "task_id": task_id,
        "status": task_data.get(b"status", b"unknown").decode(),
        "result": task_data.get(b"result", b"").decode()
    }

def worker():
    while True:
        _, task_json = redis_client.brpop("prediction_queue")
        task = json.loads(task_json)
        
        task_id = task["task_id"]
        features = task["features"]
        
        redis_client.hset(f"task:{task_id}", "status", "processing")
        
        try:
            input_data = np.array([features])
            prediction = int(model.predict(input_data)[0])
            
            redis_client.hset(f"task:{task_id}", mapping={
                "status": "completed",
                "result": json.dumps({"prediction": prediction})
            })
        except Exception as e:
            redis_client.hset(f"task:{task_id}", mapping={
                "status": "failed",
                "error": str(e)
            })

@app.on_event("startup")
def startup():
    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
```

</details>

---

## 下一章预告

下一章我们会学习 **Kubernetes 部署模型服务**——也就是如何使用 K8s 管理模型服务。你会学到：

- Kubernetes 基础概念
- Deployment 和 Service 配置
- 自动扩缩容
- 滚动更新和回滚

掌握这些知识后，你就能在 K8s 上部署和管理模型服务了。
