---
title: "第5章：RESTful API 服务化"
description: "将模型封装为 API 服务，请求响应设计，API 文档生成"
---

# 第5章：RESTful API 服务化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 RESTful API？为什么要用它？
- 如何设计一个好的模型 API？
- 如何自动生成 API 文档？
- API 设计有哪些最佳实践？

这一章就是为了解答这些问题。我们会学习 RESTful API 的设计原则，掌握如何创建专业、易用的模型 API 服务。

---

## 1 为什么需要 RESTful API？

### 痛点分析

想象一下这个场景：你训练好了模型，但其他系统无法调用：

```python
# 只能在本地使用，其他系统无法调用
model = load_model('model.pkl')
result = model.predict(data)
```

或者更糟糕的情况：

```python
# 没有标准化的接口，每次都要重新写代码
# 前端要调用？写个接口
# 移动端要调用？再写个接口
# 其他服务要调用？又写个接口
```

> **一句话总结**：没有标准化的 API，模型就无法被其他系统方便地调用。

### 解决方案

RESTful API 是一种标准化的 Web API 设计风格：
- **统一接口**：所有系统都通过 HTTP 调用
- **无状态**：每次请求都包含所有必要信息
- **可扩展**：易于添加新功能和版本管理

打个比方：

> RESTful API 就像是模型的"翻译官"，让不同语言（系统）都能和模型对话。

---

## 2 核心原理

### RESTful 设计原则

REST（Representational State Transfer）的核心原则：

| 原则 | 说明 | 示例 |
| --- | --- | --- |
| 资源导向 | 每个 URL 代表一个资源 | `/models`、`/predictions` |
| 统一接口 | 使用标准 HTTP 方法 | GET、POST、PUT、DELETE |
| 无状态 | 服务器不保存客户端状态 | 每次请求都独立 |
| 可缓存 | 响应可以缓存 | 使用 Cache-Control |

### HTTP 方法语义

| 方法 | 语义 | 幂等性 | 示例 |
| --- | --- | --- | --- |
| GET | 获取资源 | 是 | 获取模型信息 |
| POST | 创建资源 | 否 | 创建预测任务 |
| PUT | 更新资源 | 是 | 更新模型配置 |
| DELETE | 删除资源 | 是 | 删除模型 |
| PATCH | 部分更新 | 否 | 更新模型参数 |

---

## 3 基础用法

### 使用 FastAPI 创建 API

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
from typing import List, Optional

app = FastAPI(
    title="模型预测 API",
    description="一个用于模型推理的 RESTful API 服务",
    version="1.0.0"
)

# 加载模型
model = joblib.load('model.joblib')

# 定义请求模型
class PredictRequest(BaseModel):
    features: List[float] = Field(
        ...,
        description="特征列表",
        example=[5.1, 3.5, 1.4, 0.2]
    )

# 定义响应模型
class PredictResponse(BaseModel):
    prediction: int = Field(..., description="预测结果")
    probabilities: List[float] = Field(..., description="各类别概率")
    message: str = Field(default="success", description="响应消息")

# 健康检查接口
@app.get("/health")
def health_check():
    """健康检查"""
    return {"status": "healthy"}

# 预测接口
@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    """
    模型预测接口
    
    - 接收特征列表
    - 返回预测结果和概率
    """
    try:
        # 转换输入数据
        input_data = np.array([request.features])
        
        # 执行预测
        prediction = int(model.predict(input_data)[0])
        probabilities = model.predict_proba(input_data)[0].tolist()
        
        return PredictResponse(
            prediction=prediction,
            probabilities=probabilities,
            message="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 获取模型信息
@app.get("/model/info")
def get_model_info():
    """获取模型信息"""
    return {
        "model_name": "iris_classifier",
        "version": "1.0.0",
        "type": "RandomForestClassifier",
        "features": ["sepal_length", "sepal_width", "petal_length", "petal_width"]
    }
```

### 运行和测试

```bash
# 启动服务
uvicorn api:app --reload --host 0.0.0.0 --port 8000

# 访问 API 文档
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc

# 测试接口
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"features": [5.1, 3.5, 1.4, 0.2]}'
```

---

## 4 进阶用法

### 批量预测接口

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib
import numpy as np
from typing import List

app = FastAPI()
model = joblib.load('model.joblib')

class BatchPredictRequest(BaseModel):
    features_list: List[List[float]] = Field(
        ...,
        description="批量特征列表",
        example=[[5.1, 3.5, 1.4, 0.2], [6.2, 3.4, 5.4, 2.3]]
    )

class BatchPredictResponse(BaseModel):
    predictions: List[int]
    probabilities: List[List[float]]
    total_count: int

@app.post("/predict/batch", response_model=BatchPredictResponse)
def batch_predict(request: BatchPredictRequest):
    """批量预测接口"""
    # 转换输入数据
    input_data = np.array(request.features_list)
    
    # 批量预测
    predictions = model.predict(input_data).tolist()
    probabilities = model.predict_proba(input_data).tolist()
    
    return BatchPredictResponse(
        predictions=[int(p) for p in predictions],
        probabilities=[[float(p) for p in prob] for prob in probabilities],
        total_count=len(predictions)
    )
```

### 异步推理接口

```python
import asyncio
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import joblib
import numpy as np
from typing import Dict
import uuid

app = FastAPI()
model = joblib.load('model.joblib')

# 存储异步任务结果
task_results: Dict[str, dict] = {}

class AsyncPredictRequest(BaseModel):
    features: list[float]

class TaskResponse(BaseModel):
    task_id: str
    status: str

@app.post("/predict/async", response_model=TaskResponse)
async def async_predict(request: AsyncPredictRequest, background_tasks: BackgroundTasks):
    """异步预测接口"""
    # 生成任务 ID
    task_id = str(uuid.uuid4())
    
    # 初始化任务状态
    task_results[task_id] = {"status": "processing", "result": None}
    
    # 添加后台任务
    background_tasks.add_task(process_prediction, task_id, request.features)
    
    return TaskResponse(task_id=task_id, status="processing")

async def process_prediction(task_id: str, features: list[float]):
    """处理预测任务"""
    # 模拟异步处理
    await asyncio.sleep(2)
    
    # 执行预测
    input_data = np.array([features])
    prediction = int(model.predict(input_data)[0])
    
    # 更新任务结果
    task_results[task_id] = {
        "status": "completed",
        "result": {"prediction": prediction}
    }

@app.get("/predict/result/{task_id}")
async def get_prediction_result(task_id: str):
    """获取预测结果"""
    if task_id not in task_results:
        return {"error": "Task not found"}
    
    return task_results[task_id]
```

### 错误处理

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
import joblib
import numpy as np

app = FastAPI()
model = joblib.load('model.joblib')

class PredictRequest(BaseModel):
    features: list[float]
    
    @validator('features')
    def validate_features(cls, v):
        if len(v) != 4:
            raise ValueError('特征数量必须为 4')
        if any(not isinstance(x, (int, float)) for x in v):
            raise ValueError('特征值必须为数字')
        return v

class ErrorResponse(BaseModel):
    error: str
    detail: str

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"error": "Validation Error", "detail": str(exc)}
    )

@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)}
    )

@app.post("/predict")
def predict(request: PredictRequest):
    try:
        input_data = np.array([request.features])
        prediction = int(model.predict(input_data)[0])
        return {"prediction": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### API 版本管理

```python
from fastapi import FastAPI, APIRouter

app = FastAPI()

# 创建版本路由
v1_router = APIRouter(prefix="/v1")
v2_router = APIRouter(prefix="/v2")

# V1 版本
@v1_router.post("/predict")
def predict_v1(features: list[float]):
    """V1 版本：返回简单结果"""
    prediction = model.predict([features])[0]
    return {"prediction": int(prediction)}

# V2 版本
@v2_router.post("/predict")
def predict_v2(features: list[float]):
    """V2 版本：返回详细结果"""
    input_data = np.array([features])
    prediction = int(model.predict(input_data)[0])
    probabilities = model.predict_proba(input_data)[0].tolist()
    
    return {
        "prediction": prediction,
        "probabilities": probabilities,
        "version": "2.0"
    }

# 注册路由
app.include_router(v1_router)
app.include_router(v2_router)
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| RESTful 设计 | 使用标准 HTTP 方法和状态码 |
| 请求验证 | 使用 Pydantic 验证输入数据 |
| 响应模型 | 定义清晰的响应结构 |
| 错误处理 | 使用 HTTPException 返回错误 |
| API 文档 | 自动生成 Swagger 和 ReDoc 文档 |
| 版本管理 | 使用 URL 前缀管理 API 版本 |

---

## 6 新手常见误区

### 误区 1："API 不需要文档"

**错！** 没有文档的 API：
- 其他开发者不知道如何使用
- 需要口头解释每个接口
- 容易出错

正确做法：使用 FastAPI 自动生成 API 文档。

### 误区 2："不需要验证输入数据"

**错！** 不验证输入会导致：
- 模型收到错误数据
- 程序崩溃
- 安全漏洞

正确做法：使用 Pydantic 进行严格的输入验证。

### 误区 3："所有接口都返回 200 状态码"

**错！** 应该使用正确的 HTTP 状态码：
- 200：成功
- 400：客户端错误
- 404：资源不存在
- 500：服务器错误

正确做法：根据场景返回合适的状态码。

### 误区 4："API 不需要版本管理"

**错！** 没有版本管理会导致：
- 修改接口影响现有用户
- 无法平滑升级
- 向后兼容困难

正确做法：使用 URL 前缀或请求头进行版本管理。

### 误区 5："同步接口就够了"

**错！** 对于耗时操作：
- 同步接口会阻塞
- 用户体验差
- 并发能力低

正确做法：对于耗时操作使用异步接口。

---

## 7 动手练习

### 练习 1：基础练习 - 创建简单的预测 API

使用 FastAPI 创建一个简单的模型预测 API。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="简单预测 API")
model = joblib.load('model.joblib')

class PredictRequest(BaseModel):
    features: list[float]

class PredictResponse(BaseModel):
    prediction: int

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    return PredictResponse(prediction=prediction)

@app.get("/health")
def health():
    return {"status": "ok"}
```

</details>

### 练习 2：进阶练习 - 实现批量和异步接口

实现批量预测和异步预测接口。

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

class BatchRequest(BaseModel):
    features_list: list[list[float]]

class BatchResponse(BaseModel):
    predictions: list[int]

class AsyncRequest(BaseModel):
    features: list[float]

@app.post("/predict/batch", response_model=BatchResponse)
def batch_predict(request: BatchRequest):
    input_data = np.array(request.features_list)
    predictions = model.predict(input_data).tolist()
    return BatchResponse(predictions=[int(p) for p in predictions])

@app.post("/predict/async")
async def async_predict(request: AsyncRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "processing"}
    background_tasks.add_task(process_task, task_id, request.features)
    return {"task_id": task_id}

async def process_task(task_id: str, features: list[float]):
    import asyncio
    await asyncio.sleep(2)
    prediction = int(model.predict([features])[0])
    tasks[task_id] = {"status": "completed", "prediction": prediction}

@app.get("/predict/result/{task_id}")
def get_result(task_id: str):
    return tasks.get(task_id, {"error": "not found"})
```

</details>

### 练习 3（挑战）：综合练习 - 完整的 API 服务

实现一个完整的 API 服务，包括版本管理、错误处理、文档。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator, Field
import joblib
import numpy as np
from typing import List

app = FastAPI(
    title="完整模型 API",
    description="一个功能完整的模型预测 API 服务",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

model = joblib.load('model.joblib')

# 请求模型
class PredictRequest(BaseModel):
    features: List[float] = Field(..., description="特征列表", min_items=4, max_items=4)
    
    @validator('features')
    def validate_features(cls, v):
        if any(not isinstance(x, (int, float)) for x in v):
            raise ValueError('特征值必须为数字')
        return v

# 响应模型
class PredictResponse(BaseModel):
    prediction: int
    probabilities: List[float]
    message: str = "success"

# 错误处理
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(status_code=400, content={"error": str(exc)})

@app.exception_handler(Exception)
async def general_error_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": "服务器内部错误"})

# V1 路由
v1_router = APIRouter(prefix="/v1")

@v1_router.post("/predict")
def predict_v1(request: PredictRequest):
    """V1 版本：简单预测"""
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    return {"prediction": prediction}

# V2 路由
v2_router = APIRouter(prefix="/v2")

@v2_router.post("/predict", response_model=PredictResponse)
def predict_v2(request: PredictRequest):
    """V2 版本：详细预测"""
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    probabilities = model.predict_proba(input_data)[0].tolist()
    
    return PredictResponse(
        prediction=prediction,
        probabilities=[float(p) for p in probabilities],
        message="success"
    )

# 注册路由
app.include_router(v1_router, tags=["v1"])
app.include_router(v2_router, tags=["v2"])

# 健康检查
@app.get("/health", tags=["system"])
def health_check():
    """健康检查"""
    return {"status": "healthy", "version": "2.0.0"}

# 模型信息
@app.get("/model/info", tags=["model"])
def model_info():
    """获取模型信息"""
    return {
        "name": "iris_classifier",
        "version": "1.0.0",
        "type": "RandomForestClassifier"
    }
```

</details>

---

## 下一章预告

下一章我们会学习 **FastAPI 构建模型服务**——深入学习 FastAPI 框架的高级特性。你会学到：

- FastAPI 的依赖注入系统
- 中间件和 CORS 配置
- 性能优化技巧
- 生产环境部署

掌握这些知识后，你就能创建高性能、生产级的模型服务了。
