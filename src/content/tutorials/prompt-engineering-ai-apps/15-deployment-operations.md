---
title: "第15章：AI 应用部署与运维"
description: "容器化部署、监控告警、日志管理、成本控制、性能优化"
---

# 第15章：AI 应用部署与运维

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何将 AI 应用部署到生产环境？
- 为什么要用 Docker 容器化部署？
- 如何监控 AI 应用的运行状态？
- 如何控制 AI API 的调用成本？
- 如何优化 AI 应用的性能？

这一章就是为了解答这些问题。我们会学习 **AI 应用的部署与运维技术**，让你的应用稳定运行在生产环境。

---

## 1 为什么需要专业的部署运维？

### 痛点分析

**开发环境的局限**：

1. **环境不一致**：开发环境能跑，生产环境报错
2. **无法扩展**：单机部署无法应对高并发
3. **故障难排查**：出了问题不知道哪里错了
4. **成本失控**：API 调用费用飙升

**举个例子**：

```
❌ 简单部署：
- 直接在服务器上运行 Python 脚本
- 没有监控，挂了都不知道
- API 费用一个月 10 万
- 用户抱怨响应慢

✅ 专业部署：
- Docker 容器化，环境一致
- Prometheus + Grafana 监控
- 缓存 + 限流，费用降到 2 万
- P99 响应时间 < 3 秒
```

### 解决方案

> **一句话总结**：专业的部署运维让 AI 应用稳定、可控、省钱。

打个比方：

> 想象你开了一家餐厅：
> - **开发环境** = 在家做饭（随便弄弄）
> - **生产环境** = 开餐厅（需要标准化流程、卫生监控、成本控制）

---

## 2 核心原理

### 部署运维五要素

```
┌─────────────────────────────────────┐
│  1. 容器化部署（Docker）             │
│  2. 监控告警（Monitoring）           │
│  3. 日志管理（Logging）              │
│  4. 成本控制（Cost Control）         │
│  5. 性能优化（Performance）          │
└─────────────────────────────────────┘
```

---

## 3 基础用法

### Docker 容器化

**Dockerfile**：

```dockerfile
# 使用 Python 3.11 基础镜像
FROM python:3.11-slim

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

**docker-compose.yml**：

```yaml
version: '3.8'

services:
  ai-app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: always

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

**部署命令**：

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f ai-app

# 停止服务
docker-compose down
```

### 监控告警

**Prometheus 配置**：

```python
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import FastAPI, Response
import time

app = FastAPI()

# 定义指标
REQUEST_COUNT = Counter(
    'ai_request_total',
    'Total AI requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'ai_request_duration_seconds',
    'Request duration in seconds',
    ['method', 'endpoint']
)

TOKEN_USAGE = Counter(
    'ai_token_usage_total',
    'Total tokens used',
    ['model', 'type']  # type: prompt/completion
)

@app.middleware("http")
async def metrics_middleware(request, call_next):
    """监控中间件"""
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    # 记录指标
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

@app.get("/metrics")
async def metrics():
    """暴露指标接口"""
    return Response(content=generate_latest(), media_type="text/plain")
```

**Grafana 仪表盘**：

```json
{
  "dashboard": {
    "title": "AI Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ai_request_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time P99",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, rate(ai_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Token Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ai_token_usage_total[1h])"
          }
        ]
      }
    ]
  }
}
```

### 日志管理

```python
import logging
from pythonjsonlogger import jsonlogger

# 配置 JSON 格式日志
logger = logging.getLogger()
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

@app.middleware("http")
async def logging_middleware(request, call_next):
    """日志中间件"""
    request_id = str(uuid.uuid4())
    
    logger.info(
        "Request started",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host
        }
    )
    
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    logger.info(
        "Request completed",
        extra={
            "request_id": request_id,
            "status_code": response.status_code,
            "duration": duration
        }
    )
    
    response.headers["X-Request-ID"] = request_id
    return response
```

### 成本控制

```python
import redis
import json

# 连接 Redis
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

class CostTracker:
    """成本追踪器"""
    
    PRICING = {
        "gpt-4": {"prompt": 0.03, "completion": 0.06},
        "gpt-3.5-turbo": {"prompt": 0.0015, "completion": 0.002}
    }
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.daily_budget = 10  # 每日预算 10 美元
    
    def track_usage(self, model: str, prompt_tokens: int, completion_tokens: int):
        """追踪使用量"""
        pricing = self.PRICING.get(model, {})
        cost = (
            prompt_tokens * pricing.get("prompt", 0) / 1000 +
            completion_tokens * pricing.get("completion", 0) / 1000
        )
        
        # 记录到 Redis
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"cost:{self.user_id}:{today}"
        redis_client.incrbyfloat(key, cost)
        redis_client.expire(key, 86400)  # 24 小时过期
        
        # 检查是否超预算
        total_cost = float(redis_client.get(key) or 0)
        if total_cost > self.daily_budget:
            raise ValueError("超出每日预算")
        
        return cost
    
    def get_daily_cost(self) -> float:
        """获取今日成本"""
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"cost:{self.user_id}:{today}"
        return float(redis_client.get(key) or 0)

# 使用示例
@app.post("/chat")
async def chat(request: ChatRequest, user_id: str):
    tracker = CostTracker(user_id)
    
    # 检查预算
    if tracker.get_daily_cost() >= tracker.daily_budget:
        raise HTTPException(status_code=429, detail="超出每日预算")
    
    # 调用 AI API
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": request.message}]
    )
    
    # 追踪成本
    cost = tracker.track_usage(
        model="gpt-4",
        prompt_tokens=response.usage.prompt_tokens,
        completion_tokens=response.usage.completion_tokens
    )
    
    return {
        "response": response.choices[0].message.content,
        "cost": f"${cost:.4f}"
    }
```

### 性能优化

```python
from functools import lru_cache
import hashlib

# 1. 响应缓存
cache = {}

def get_cache_key(message: str, model: str) -> str:
    """生成缓存键"""
    content = f"{model}:{message}"
    return hashlib.md5(content.encode()).hexdigest()

@app.post("/chat")
async def chat(request: ChatRequest):
    cache_key = get_cache_key(request.message, request.model)
    
    # 检查缓存
    if cache_key in cache:
        return {"response": cache[cache_key], "cached": True}
    
    # 调用 API
    response = await client.chat.completions.create(
        model=request.model,
        messages=[{"role": "user", "content": request.message}]
    )
    
    result = response.choices[0].message.content
    
    # 存入缓存（1 小时过期）
    cache[cache_key] = result
    
    return {"response": result, "cached": False}

# 2. 请求批处理
import asyncio
from typing import List

class BatchProcessor:
    """批处理器"""
    
    def __init__(self, batch_size=10, timeout=1.0):
        self.batch_size = batch_size
        self.timeout = timeout
        self.queue = asyncio.Queue()
        asyncio.create_task(self._process_batch())
    
    async def submit(self, message: str) -> str:
        """提交请求"""
        future = asyncio.Future()
        await self.queue.put((message, future))
        return await future
    
    async def _process_batch(self):
        """处理批次"""
        while True:
            batch = []
            futures = []
            
            # 收集一批请求
            try:
                while len(batch) < self.batch_size:
                    message, future = await asyncio.wait_for(
                        self.queue.get(),
                        timeout=self.timeout
                    )
                    batch.append(message)
                    futures.append(future)
            except asyncio.TimeoutError:
                pass
            
            # 批量处理
            if batch:
                results = await self._call_api_batch(batch)
                for future, result in zip(futures, results):
                    future.set_result(result)
    
    async def _call_api_batch(self, messages: List[str]) -> List[str]:
        """批量调用 API"""
        tasks = [
            client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": msg}]
            )
            for msg in messages
        ]
        responses = await asyncio.gather(*tasks)
        return [r.choices[0].message.content for r in responses]

# 使用批处理器
batch_processor = BatchProcessor(batch_size=10, timeout=1.0)

@app.post("/chat/batch")
async def chat_batch(request: ChatRequest):
    result = await batch_processor.submit(request.message)
    return {"response": result}
```

---

## 4 进阶用法

### Kubernetes 部署

**deployment.yaml**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-app
  template:
    metadata:
      labels:
        app: ai-app
    spec:
      containers:
      - name: ai-app
        image: your-registry/ai-app:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**service.yaml**：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-app-service
spec:
  selector:
    app: ai-app
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

**HPA 自动扩缩容**：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: 100
```

### 完整的监控体系

```python
from prometheus_client import Counter, Histogram, Gauge
import psutil
import time

# 业务指标
REQUEST_COUNT = Counter('ai_requests_total', 'Total requests', ['model', 'status'])
TOKEN_USAGE = Counter('ai_tokens_total', 'Token usage', ['model', 'type'])
COST_TRACKER = Counter('ai_cost_usd_total', 'Cost in USD', ['user_id'])

# 性能指标
REQUEST_DURATION = Histogram('ai_request_duration_seconds', 'Request duration')
QUEUE_SIZE = Gauge('ai_queue_size', 'Request queue size')

# 系统指标
CPU_USAGE = Gauge('system_cpu_percent', 'CPU usage percent')
MEMORY_USAGE = Gauge('system_memory_percent', 'Memory usage percent')

@app.middleware("http")
async def comprehensive_monitoring(request, call_next):
    """全面监控中间件"""
    start_time = time.time()
    
    # 更新系统指标
    CPU_USAGE.set(psutil.cpu_percent())
    MEMORY_USAGE.set(psutil.virtual_memory().percent)
    
    try:
        response = await call_next(request)
        
        # 记录成功指标
        duration = time.time() - start_time
        REQUEST_DURATION.observe(duration)
        REQUEST_COUNT.labels(model="gpt-4", status="success").inc()
        
        return response
    except Exception as e:
        # 记录失败指标
        REQUEST_COUNT.labels(model="gpt-4", status="error").inc()
        raise

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory().percent,
        "timestamp": time.time()
    }
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Docker 容器化 | 环境一致性，便于部署和扩展 |
| 监控告警 | Prometheus + Grafana，实时监控系统状态 |
| 日志管理 | 结构化日志，便于排查问题 |
| 成本控制 | 追踪 API 使用量，设置预算限制 |
| 性能优化 | 缓存、批处理、异步处理 |
| Kubernetes | 自动扩缩容，高可用部署 |

---

## 6 新手常见误区

### 误区 1："开发环境能跑就行"

**错！** 生产环境需要：
- 环境一致性（Docker）
- 健康检查
- 自动重启
- 日志收集

### 误区 2："不需要监控"

不对。监控的作用：
- 及时发现问题
- 性能瓶颈分析
- 容量规划
- 成本优化

### 误区 3："日志越多越好"

实际上：
- 日志要结构化
- 包含关键信息（request_id、用户ID）
- 分级（DEBUG/INFO/WARN/ERROR）
- 定期清理

### 误区 4："成本不重要"

实际上：
- AI API 成本可能很高
- 需要追踪每个用户的成本
- 设置预算限制
- 优化缓存策略

### 误区 5："性能优化是后期的事"

不对。应该从一开始就：
- 使用异步处理
- 实现缓存
- 监控性能指标
- 定期优化

---

## 7 动手练习

### 练习 1：基础练习 - Docker 部署

**任务**：为 AI 应用创建 Dockerfile 和 docker-compose.yml。

<details>
<summary>点击查看答案</summary>

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  ai-app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: always
```

</details>

### 练习 2：进阶练习 - 监控指标

**任务**：为 AI 应用添加 Prometheus 监控指标。

<details>
<summary>点击查看答案</summary>

```python
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import FastAPI, Response
import time

app = FastAPI()

REQUEST_COUNT = Counter('ai_requests_total', 'Total requests', ['status'])
REQUEST_DURATION = Histogram('ai_request_duration_seconds', 'Request duration')

@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(status="success").inc()
    REQUEST_DURATION.observe(duration)
    
    return response

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

</details>

### 练习 3（挑战）：综合练习 - 成本控制

**任务**：实现一个带成本追踪和预算限制的 AI 服务。

<details>
<summary>点击查看答案</summary>

```python
import redis
from datetime import datetime
from fastapi import FastAPI, HTTPException

app = FastAPI()
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

PRICING = {
    "gpt-4": {"prompt": 0.03, "completion": 0.06}
}

class CostTracker:
    def __init__(self, user_id: str, daily_budget: float = 10.0):
        self.user_id = user_id
        self.daily_budget = daily_budget
    
    def track_usage(self, model: str, prompt_tokens: int, completion_tokens: int):
        pricing = PRICING.get(model, {})
        cost = (
            prompt_tokens * pricing.get("prompt", 0) / 1000 +
            completion_tokens * pricing.get("completion", 0) / 1000
        )
        
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"cost:{self.user_id}:{today}"
        redis_client.incrbyfloat(key, cost)
        redis_client.expire(key, 86400)
        
        total_cost = float(redis_client.get(key) or 0)
        if total_cost > self.daily_budget:
            raise HTTPException(status_code=429, detail="超出每日预算")
        
        return cost
    
    def get_daily_cost(self) -> float:
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"cost:{self.user_id}:{today}"
        return float(redis_client.get(key) or 0)

@app.post("/chat")
async def chat(message: str, user_id: str):
    tracker = CostTracker(user_id)
    
    if tracker.get_daily_cost() >= tracker.daily_budget:
        raise HTTPException(status_code=429, detail="超出每日预算")
    
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": message}]
    )
    
    cost = tracker.track_usage(
        model="gpt-4",
        prompt_tokens=response.usage.prompt_tokens,
        completion_tokens=response.usage.completion_tokens
    )
    
    return {
        "response": response.choices[0].message.content,
        "cost": f"${cost:.4f}",
        "daily_total": f"${tracker.get_daily_cost():.4f}"
    }
```

</details>

---

## 下一章预告

下一章是**综合实战项目**，我们会将前面学到的所有知识整合，构建完整的 AI 应用项目：

- 智能客服系统
- 知识库问答系统
- 代码助手
- 多模态应用

通过实战项目，你会掌握如何将 Prompt 工程、RAG、Agent、前后端集成等技术应用到真实场景中。
