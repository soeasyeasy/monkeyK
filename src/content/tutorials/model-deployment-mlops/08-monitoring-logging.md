---
title: "第8章：模型服务监控与日志"
description: "监控指标设计，日志系统搭建，告警机制，性能分析"
---

# 第8章：模型服务监控与日志

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 模型服务上线后，如何知道它运行是否正常？
- 需要监控哪些指标？
- 如何收集和分析日志？
- 出现问题时如何及时收到告警？

这一章就是为了解答这些问题。我们会学习如何搭建完整的监控和日志系统，让你能够实时掌握模型服务的运行状态。

---

## 1 为什么需要监控和日志？

### 痛点分析

想象一下这个场景：你的模型服务上线了，但是：

```bash
# 用户反馈：服务很慢
用户："这个预测怎么要等 10 秒？"

# 你：不知道问题在哪
你："让我看看...日志太多了，找不到..."
```

或者更糟糕的情况：

```bash
# 模型性能下降，但你不知道
# 准确率从 95% 降到 70%
# 用户已经投诉了，你才发现
```

> **一句话总结**：没有监控和日志，就像蒙着眼睛开车，出了问题都不知道。

### 解决方案

完整的监控和日志系统包括：
- **指标监控**：实时监控系统性能、模型性能
- **日志管理**：收集、存储、分析日志
- **告警机制**：出现问题时及时通知
- **可视化**：通过图表直观展示数据

打个比方：

> 监控和日志就像是汽车的仪表盘和行车记录仪，让你随时了解车况，出问题时有据可查。

---

## 2 核心原理

### 监控指标分类

| 类型 | 指标 | 说明 |
| --- | --- | --- |
| 系统指标 | CPU 使用率 | 反映计算资源消耗 |
| 系统指标 | 内存使用率 | 反映内存消耗 |
| 系统指标 | 磁盘 I/O | 反映存储性能 |
| 应用指标 | 请求延迟 | 响应时间 |
| 应用指标 | 请求成功率 | 服务可用性 |
| 应用指标 | QPS | 每秒请求数 |
| 模型指标 | 推理时间 | 模型推理耗时 |
| 模型指标 | 预测分布 | 预测结果分布 |
| 模型指标 | 模型漂移 | 数据分布变化 |
| 业务指标 | 准确率 | 模型准确性 |
| 业务指标 | 用户满意度 | 业务效果 |

### 日志级别

| 级别 | 说明 | 使用场景 |
| --- | --- | --- |
| DEBUG | 调试信息 | 开发环境 |
| INFO | 一般信息 | 正常运行记录 |
| WARNING | 警告信息 | 潜在问题 |
| ERROR | 错误信息 | 可恢复的错误 |
| CRITICAL | 严重错误 | 系统崩溃 |

---

## 3 基础用法

### 使用 Prometheus 监控

安装依赖：

```bash
pip install prometheus-client fastapi uvicorn
```

在 FastAPI 应用中集成 Prometheus：

```python
from fastapi import FastAPI
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
import time
import joblib
import numpy as np

app = FastAPI()

# 加载模型
model = joblib.load('model.joblib')

# 定义指标
REQUEST_COUNT = Counter(
    'prediction_requests_total',
    'Total prediction requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'prediction_request_latency_seconds',
    'Request latency in seconds'
)

MODEL_INFERENCE_TIME = Histogram(
    'model_inference_time_seconds',
    'Model inference time in seconds'
)

# 中间件：记录请求指标
@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    
    # 处理请求
    response = await call_next(request)
    
    # 记录指标
    process_time = time.time() - start_time
    REQUEST_LATENCY.observe(process_time)
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    return response

# 预测接口
@app.post("/predict")
def predict(features: list[float]):
    start_time = time.time()
    
    # 模型推理
    input_data = np.array([features])
    prediction = model.predict(input_data)[0]
    
    # 记录推理时间
    inference_time = time.time() - start_time
    MODEL_INFERENCE_TIME.observe(inference_time)
    
    return {"prediction": int(prediction)}

# Prometheus 指标端点
@app.get("/metrics")
def metrics():
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
```

### 使用 Loguru 记录日志

安装 Loguru：

```bash
pip install loguru
```

配置日志：

```python
from loguru import logger
import sys
from pathlib import Path

# 配置日志输出到控制台
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)

# 配置日志输出到文件
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

logger.add(
    log_dir / "app.log",
    rotation="10 MB",  # 每个文件最大 10MB
    retention="10 days",  # 保留 10 天
    compression="zip",  # 压缩旧日志
    level="DEBUG"
)

# 使用日志
logger.info("应用启动成功")
logger.debug("调试信息")
logger.warning("警告信息")
logger.error("错误信息")
logger.critical("严重错误")
```

### 在 FastAPI 中使用日志

```python
from fastapi import FastAPI, Request
from loguru import logger
import time
import joblib
import numpy as np

app = FastAPI()
model = joblib.load('model.joblib')

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # 记录请求信息
    logger.info(
        f"请求开始 | {request.method} {request.url.path} | "
        f"Client: {request.client.host}"
    )
    
    # 处理请求
    response = await call_next(request)
    
    # 记录响应信息
    process_time = time.time() - start_time
    logger.info(
        f"请求完成 | {request.method} {request.url.path} | "
        f"Status: {response.status_code} | "
        f"Time: {process_time:.3f}s"
    )
    
    return response

@app.post("/predict")
def predict(features: list[float]):
    try:
        logger.debug(f"开始推理 | 特征: {features}")
        
        # 模型推理
        input_data = np.array([features])
        prediction = int(model.predict(input_data)[0])
        
        logger.info(f"推理成功 | 预测结果: {prediction}")
        
        return {"prediction": prediction}
    
    except Exception as e:
        logger.error(f"推理失败 | 错误: {str(e)}")
        raise
```

### 使用 Grafana 可视化

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # 模型服务
  model-api:
    build: .
    ports:
      - "8000:8000"
  
  # Prometheus
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
  
  # Grafana
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

创建 `prometheus.yml`：

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'model-api'
    static_configs:
      - targets: ['model-api:8000']
    metrics_path: '/metrics'
```

启动服务：

```bash
docker-compose up -d
```

访问：
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

---

## 4 进阶用法

### 自定义监控指标

```python
from prometheus_client import Counter, Histogram, Gauge, Summary
from fastapi import FastAPI
import joblib
import numpy as np

app = FastAPI()
model = joblib.load('model.joblib')

# 自定义指标
PREDICTION_COUNT = Counter(
    'model_predictions_total',
    'Total predictions by class',
    ['prediction_class']
)

FEATURE_STATS = Summary(
    'model_feature_statistics',
    'Feature value statistics',
    ['feature_name']
)

ACTIVE_REQUESTS = Gauge(
    'active_requests',
    'Number of active requests'
)

@app.post("/predict")
def predict(features: list[float]):
    ACTIVE_REQUESTS.inc()
    
    try:
        # 记录特征统计
        feature_names = ['f1', 'f2', 'f3', 'f4']
        for name, value in zip(feature_names, features):
            FEATURE_STATS.labels(feature_name=name).observe(value)
        
        # 模型推理
        input_data = np.array([features])
        prediction = int(model.predict(input_data)[0])
        
        # 记录预测分布
        PREDICTION_COUNT.labels(prediction_class=str(prediction)).inc()
        
        return {"prediction": prediction}
    
    finally:
        ACTIVE_REQUESTS.dec()
```

### 结构化日志

```python
from loguru import logger
import json
import sys

# 配置结构化日志
def serialize(record):
    subset = {
        "timestamp": record["time"].timestamp(),
        "level": record["level"].name,
        "message": record["message"],
        "module": record["module"],
        "function": record["function"],
    }
    return json.dumps(subset)

logger.remove()
logger.add(
    sys.stdout,
    format=lambda _: serialize(_),
    level="INFO"
)

# 使用结构化日志
logger.info("用户登录", extra={"user_id": 123, "ip": "192.168.1.1"})
logger.error("预测失败", extra={"error": "Invalid input", "features": [1, 2, 3]})
```

### 告警配置

创建 `alert_rules.yml`：

```yaml
groups:
  - name: model-alerts
    rules:
      # 高延迟告警
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(prediction_request_latency_seconds_bucket[5m])) > 1
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "高延迟告警"
          description: "95% 请求延迟超过 1 秒"
      
      # 错误率告警
      - alert: HighErrorRate
        expr: rate(prediction_requests_total{status=~"5.."}[5m]) / rate(prediction_requests_total[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "高错误率告警"
          description: "错误率超过 5%"
      
      # 模型漂移告警
      - alert: ModelDrift
        expr: rate(model_predictions_total[1h]) < 10
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "模型漂移告警"
          description: "过去 1 小时预测数量过少"
```

更新 `prometheus.yml`：

```yaml
global:
  scrape_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'model-api'
    static_configs:
      - targets: ['model-api:8000']
    metrics_path: '/metrics'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 性能分析

```python
import cProfile
import pstats
from io import StringIO
from fastapi import FastAPI
import joblib
import numpy as np

app = FastAPI()
model = joblib.load('model.joblib')

@app.post("/predict/profile")
def predict_with_profile(features: list[float]):
    # 性能分析
    profiler = cProfile.Profile()
    profiler.enable()
    
    # 模型推理
    input_data = np.array([features])
    prediction = model.predict(input_data)[0]
    
    profiler.disable()
    
    # 获取分析结果
    stats = StringIO()
    ps = pstats.Stats(profiler, stream=stats).sort_stats('cumulative')
    ps.print_stats(10)  # 显示前 10 个最耗时的函数
    
    return {
        "prediction": int(prediction),
        "profile": stats.getvalue()
    }
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Prometheus | 开源监控系统，收集和存储指标 |
| Grafana | 可视化工具，展示监控数据 |
| Loguru | 现代日志库，功能强大 |
| 结构化日志 | JSON 格式日志，便于分析 |
| 告警规则 | 定义告警条件和阈值 |
| 性能分析 | 使用 cProfile 分析代码性能 |

---

## 6 新手常见误区

### 误区 1："只监控系统指标就够了"

**错！** 只监控系统指标会导致：
- 不知道模型性能如何
- 无法发现模型漂移
- 无法评估业务效果

正确做法：同时监控系统、应用、模型、业务指标。

### 误区 2："日志越多越好"

**错！** 过多日志会导致：
- 存储空间浪费
- 查找困难
- 性能下降

正确做法：根据环境设置合适的日志级别，记录关键信息。

### 误区 3："不需要告警，看监控面板就行"

**错！** 没有告警会导致：
- 问题发现延迟
- 需要人工盯盘
- 响应速度慢

正确做法：配置合理的告警规则，及时通知相关人员。

### 误区 4："日志不需要结构化"

**错！** 非结构化日志会导致：
- 难以解析和分析
- 无法使用日志分析工具
- 排查问题效率低

正确做法：使用结构化日志（JSON 格式），便于分析。

### 误区 5："监控数据不需要保留"

**错！** 不保留监控数据会导致：
- 无法分析历史趋势
- 无法回溯问题
- 无法评估改进效果

正确做法：根据需求设置数据保留策略，至少保留 30 天。

---

## 7 动手练习

### 练习 1：基础练习 - 添加 Prometheus 指标

为一个 FastAPI 应用添加基本的 Prometheus 监控指标。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI
from prometheus_client import Counter, Histogram, generate_latest
from starlette.responses import Response
import time

app = FastAPI()

# 定义指标
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_latency_seconds',
    'Request latency'
)

@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    REQUEST_LATENCY.observe(process_time)
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    return response

@app.get("/")
def root():
    return {"message": "Hello"}

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

</details>

### 练习 2：进阶练习 - 配置结构化日志

使用 Loguru 配置结构化日志，记录请求和响应信息。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI, Request
from loguru import logger
import json
import sys
import time

# 配置结构化日志
def serialize(record):
    return json.dumps({
        "timestamp": record["time"].timestamp(),
        "level": record["level"].name,
        "message": record["message"],
        "module": record["module"],
    })

logger.remove()
logger.add(sys.stdout, format=lambda _: serialize(_))

app = FastAPI()

@app.middleware("http")
async def log_middleware(request: Request, call_next):
    start_time = time.time()
    
    logger.info(
        "请求开始",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host
        }
    )
    
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        "请求完成",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "time": f"{process_time:.3f}s"
        }
    )
    
    return response

@app.get("/")
def root():
    logger.info("处理根路径请求")
    return {"message": "Hello"}
```

</details>

### 练习 3（挑战）：综合练习 - 完整的监控系统

搭建一个完整的监控系统，包括 Prometheus、Grafana 和告警规则。

<details>
<summary>点击查看答案</summary>

项目结构：

```
monitoring/
├── docker-compose.yml
├── prometheus.yml
├── alert_rules.yml
└── main.py
```

`main.py`：

```python
from fastapi import FastAPI
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from starlette.responses import Response
from loguru import logger
import time
import sys

# 配置日志
logger.remove()
logger.add(sys.stdout, level="INFO")

app = FastAPI()

# 定义指标
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_latency_seconds',
    'Request latency'
)

ACTIVE_REQUESTS = Gauge(
    'active_requests',
    'Active requests'
)

@app.middleware("http")
async def metrics_middleware(request, call_next):
    ACTIVE_REQUESTS.inc()
    start_time = time.time()
    
    logger.info(f"请求开始: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    REQUEST_LATENCY.observe(process_time)
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    logger.info(f"请求完成: {response.status_code} in {process_time:.3f}s")
    
    ACTIVE_REQUESTS.dec()
    return response

@app.get("/")
def root():
    return {"message": "Hello"}

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

`docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alert_rules.yml:/etc/prometheus/alert_rules.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

`prometheus.yml`：

```yaml
global:
  scrape_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'app'
    static_configs:
      - targets: ['app:8000']
    metrics_path: '/metrics'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

`alert_rules.yml`：

```yaml
groups:
  - name: app-alerts
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_latency_seconds_bucket[5m])) > 1
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "高延迟告警"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "高错误率告警"
```

启动：

```bash
docker-compose up -d
```

访问：
- 应用: http://localhost:8000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

</details>

---

## 下一章预告

下一章我们会学习 **模型版本管理**——也就是如何管理多个版本的模型。你会学到：

- 模型版本控制策略
- 模型注册表的使用
- 版本切换和回滚
- 模型元数据管理

掌握这些知识后，你就能轻松管理模型的多个版本了。
