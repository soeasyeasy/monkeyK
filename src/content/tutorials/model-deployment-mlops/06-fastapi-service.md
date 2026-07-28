---
title: "第6章：FastAPI 构建模型服务"
description: "FastAPI 框架详解，异步处理，请求验证，性能优化"
---

# 第6章：FastAPI 构建模型服务

## 本章导读

在学这一章之前，你可能会有这些疑问：

- FastAPI 有什么优势？为什么选择它？
- 如何使用 FastAPI 的依赖注入？
- 如何配置中间件和 CORS？
- 如何优化 FastAPI 的性能？

这一章就是为了解答这些问题。我们会深入学习 FastAPI 的高级特性，掌握如何构建高性能的模型服务。

---

## 1 为什么选择 FastAPI？

### 痛点分析

传统的 Web 框架（如 Flask）在构建模型服务时存在一些问题：

```python
# Flask 示例：需要手动处理很多细节
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    
    # 需要手动验证数据
    if 'features' not in data:
        return jsonify({'error': 'Missing features'}), 400
    
    # 需要手动转换类型
    features = [float(x) for x in data['features']]
    
    # 需要手动处理异常
    try:
        result = model.predict([features])
        return jsonify({'prediction': int(result[0])})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

> **一句话总结**：传统框架需要手动处理很多细节，开发效率低，容易出错。

### 解决方案

FastAPI 的优势：
- **自动文档生成**：自动生成 Swagger 和 ReDoc 文档
- **类型验证**：使用 Pydantic 自动验证请求数据
- **异步支持**：原生支持异步处理
- **高性能**：基于 Starlette，性能接近 Node.js
- **依赖注入**：强大的依赖注入系统

---

## 2 核心原理

### FastAPI 架构

FastAPI 的核心组件：

```
FastAPI
├── Starlette（Web 框架）
│   ├── 路由
│   ├── 中间件
│   └── 请求/响应
├── Pydantic（数据验证）
│   ├── 请求模型
│   └── 响应模型
└── Uvicorn（ASGI 服务器）
    └── 异步运行
```

### 依赖注入原理

依赖注入是一种设计模式，让代码更易于测试和维护：

```python
from fastapi import Depends

# 定义依赖
def get_db():
    db = Database()
    try:
        yield db
    finally:
        db.close()

# 使用依赖
@app.post("/predict")
def predict(db = Depends(get_db)):
    # db 会自动注入
    result = db.query(...)
    return {"result": result}
```

---

## 3 基础用法

### 完整的 FastAPI 模型服务

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
from typing import List
import time

# 创建应用
app = FastAPI(
    title="模型预测服务",
    description="使用 FastAPI 构建的高性能模型服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该指定具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载模型
model = joblib.load('model.joblib')

# 请求模型
class PredictRequest(BaseModel):
    features: List[float] = Field(
        ...,
        description="特征列表",
        example=[5.1, 3.5, 1.4, 0.2]
    )

# 响应模型
class PredictResponse(BaseModel):
    prediction: int
    probabilities: List[float]
    inference_time_ms: float

# 依赖：获取模型
def get_model():
    return model

# 健康检查
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}

# 预测接口
@app.post("/predict", response_model=PredictResponse)
def predict(
    request: PredictRequest,
    model = Depends(get_model)
):
    start_time = time.time()
    
    # 执行预测
    input_data = np.array([request.features])
    prediction = int(model.predict(input_data)[0])
    probabilities = model.predict_proba(input_data)[0].tolist()
    
    inference_time = (time.time() - start_time) * 1000
    
    return PredictResponse(
        prediction=prediction,
        probabilities=[float(p) for p in probabilities],
        inference_time_ms=round(inference_time, 2)
    )
```

### 运行服务

```bash
# 开发模式
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 4 进阶用法

### 中间件配置

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import logging

app = FastAPI()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 前端域名
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# 自定义中间件：请求日志
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # 处理请求
    response = await call_next(request)
    
    # 记录日志
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    
    # 添加自定义响应头
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# 自定义中间件：认证
@app.middleware("http")
async def authenticate(request: Request, call_next):
    # 跳过健康检查接口
    if request.url.path == "/health":
        return await call_next(request)
    
    # 检查 API Key
    api_key = request.headers.get("X-API-Key")
    if api_key != "your-secret-key":
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=401,
            content={"error": "Invalid API Key"}
        )
    
    return await call_next(request)
```

### 依赖注入高级用法

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

# 安全方案
security = HTTPBearer()

# 依赖：验证 API Key
async def verify_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials.credentials != "your-secret-key":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return credentials.credentials

# 依赖：获取当前用户
async def get_current_user(api_key: str = Depends(verify_api_key)):
    # 根据 API Key 获取用户信息
    return {"user_id": 1, "username": "admin"}

# 依赖：权限检查
async def check_permission(user: dict = Depends(get_current_user)):
    if user["user_id"] != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission"
        )
    return user

# 使用依赖
@app.post("/predict")
def predict(user: dict = Depends(check_permission)):
    return {"message": f"Hello, {user['username']}"}
```

### 异步处理

```python
import asyncio
from fastapi import FastAPI, BackgroundTasks
import joblib
import numpy as np

app = FastAPI()
model = joblib.load('model.joblib')

# 异步推理
@app.post("/predict/async")
async def predict_async(features: list[float]):
    # 在线程池中执行 CPU 密集型任务
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: model.predict([features])[0]
    )
    return {"prediction": int(result)}

# 后台任务
@app.post("/train")
async def train_model(background_tasks: BackgroundTasks):
    # 添加后台任务
    background_tasks.add_task(train_in_background)
    return {"message": "Training started"}

async def train_in_background():
    # 模拟训练过程
    await asyncio.sleep(10)
    print("Training completed")
```

### 性能优化

```python
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
import joblib
import numpy as np
from functools import lru_cache

app = FastAPI(default_response_class=ORJSONResponse)  # 使用更快的 JSON 序列化

# 缓存模型加载
@lru_cache()
def load_model():
    return joblib.load('model.joblib')

# 预热模型
@app.on_event("startup")
async def startup_event():
    model = load_model()
    # 预热
    dummy_input = np.random.rand(10, 4)
    _ = model.predict(dummy_input)
    print("Model warmed up")

# 使用连接池
from sqlalchemy import create_engine

engine = create_engine(
    "postgresql://user:pass@localhost/db",
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True
)
```

### 生产环境配置

```python
from fastapi import FastAPI
from pydantic import BaseSettings

class Settings(BaseSettings):
    # 应用配置
    app_name: str = "Model Service"
    debug: bool = False
    
    # 服务配置
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    
    # 模型配置
    model_path: str = "model.joblib"
    
    # 日志配置
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug
)

# 使用配置
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        workers=settings.workers,
        log_level=settings.log_level.lower()
    )
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| FastAPI 优势 | 自动文档、类型验证、异步支持、高性能 |
| 依赖注入 | 使用 Depends 管理依赖关系 |
| 中间件 | 处理 CORS、日志、认证等横切关注点 |
| 异步处理 | 使用 async/await 提高并发能力 |
| 性能优化 | 缓存、预热、连接池、ORJSONResponse |
| 生产配置 | 使用 Settings 管理配置 |

---

## 6 新手常见误区

### 误区 1："FastAPI 比 Flask 快很多，所以不需要优化"

**错！** 虽然 FastAPI 性能更好，但仍需要优化：
- 模型推理是 CPU 密集型
- 需要合理使用异步
- 需要配置合适的 worker 数量

正确做法：根据实际场景进行性能测试和优化。

### 误区 2："CORS 配置 allow_origins=['*'] 就行了"

**错！** 生产环境不应该使用 `*`：
- 安全风险
- 可能被恶意网站调用
- 不符合安全规范

正确做法：指定具体的前端域名。

### 误区 3："所有接口都应该用 async"

**错！** 只有 I/O 密集型任务才适合 async：
- CPU 密集型（如模型推理）会阻塞事件循环
- 需要使用 run_in_executor

正确做法：根据任务类型选择合适的处理方式。

### 误区 4："不需要依赖注入，直接全局变量就行"

**错！** 全局变量会导致：
- 难以测试
- 耦合度高
- 难以管理生命周期

正确做法：使用依赖注入管理依赖。

### 误区 5："生产环境不需要 reload"

**对！** 生产环境不应该使用 `--reload`：
- 性能开销
- 安全风险
- 不稳定

正确做法：生产环境使用 `--workers` 配置多进程。

---

## 7 动手练习

### 练习 1：基础练习 - 创建带 CORS 的 API

创建一个 FastAPI 应用，配置 CORS 和日志中间件。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import time

app = FastAPI()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"{response.status_code} - {process_time:.3f}s"
    )
    
    return response

@app.get("/")
def root():
    return {"message": "Hello World"}
```

</details>

### 练习 2：进阶练习 - 实现依赖注入

实现一个带认证的依赖注入系统。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI()
security = HTTPBearer()

# 模拟用户数据库
users_db = {
    "admin-key": {"id": 1, "username": "admin", "role": "admin"},
    "user-key": {"id": 2, "username": "user", "role": "user"}
}

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    api_key = credentials.credentials
    if api_key not in users_db:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return users_db[api_key]

def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

@app.get("/admin")
def admin_only(user: dict = Depends(require_admin)):
    return {"message": f"Hello, {user['username']}"}

@app.get("/profile")
def profile(user: dict = Depends(get_current_user)):
    return {"user": user}
```

</details>

### 练习 3（挑战）：综合练习 - 完整的生产级服务

实现一个完整的模型服务，包括认证、日志、CORS、异步处理。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, BaseSettings
import joblib
import numpy as np
import logging
import time
import asyncio

# 配置
class Settings(BaseSettings):
    app_name: str = "Production Model Service"
    debug: bool = False
    model_path: str = "model.joblib"
    api_key: str = "secret-key"
    
    class Config:
        env_file = ".env"

settings = Settings()

# 日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 应用
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 安全
security = HTTPBearer()

async def verify_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials.credentials != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return credentials.credentials

# 中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"{response.status_code} - {process_time:.3f}s"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response

# 模型
model = None

@app.on_event("startup")
async def startup():
    global model
    model = joblib.load(settings.model_path)
    # 预热
    dummy = np.random.rand(10, 4)
    _ = model.predict(dummy)
    logger.info("Model loaded and warmed up")

# 请求/响应模型
class PredictRequest(BaseModel):
    features: list[float]

class PredictResponse(BaseModel):
    prediction: int
    probabilities: list[float]
    inference_time_ms: float

# 接口
@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict", response_model=PredictResponse)
async def predict(
    request: PredictRequest,
    api_key: str = Depends(verify_api_key)
):
    start_time = time.time()
    
    # 异步推理
    loop = asyncio.get_event_loop()
    input_data = np.array([request.features])
    
    prediction = await loop.run_in_executor(
        None,
        lambda: int(model.predict(input_data)[0])
    )
    probabilities = await loop.run_in_executor(
        None,
        lambda: model.predict_proba(input_data)[0].tolist()
    )
    
    inference_time = (time.time() - start_time) * 1000
    
    return PredictResponse(
        prediction=prediction,
        probabilities=[float(p) for p in probabilities],
        inference_time_ms=round(inference_time, 2)
    )
```

</details>

---

## 下一章预告

下一章我们会学习 **Docker 容器化部署**——也就是如何使用 Docker 打包和部署模型服务。你会学到：

- Docker 基础概念和命令
- 编写 Dockerfile
- 构建和运行容器
- Docker Compose 多容器编排

掌握这些知识后，你就能将模型服务打包成可移植的容器了。
