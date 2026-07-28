---
title: "第15章：模型服务高可用架构"
description: "高可用设计，负载均衡，故障转移，灾备方案"
---

# 第15章：模型服务高可用架构

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是高可用架构？为什么需要它？
- 如何实现负载均衡？
- 如何处理服务故障？
- 如何设计灾备方案？

这一章就是为了解答这些问题。我们会学习高可用架构的设计原则，掌握如何构建稳定可靠的模型服务。

---

## 1 为什么需要高可用架构？

### 痛点分析

想象一下这个场景：你的模型服务上线了，但是：

```bash
# 单台服务器挂了
# 服务完全不可用
# 用户无法访问
# 业务损失严重...
```

或者更糟糕的情况：

```bash
# 流量高峰
# 单台服务器扛不住
# 响应时间飙升到 10 秒
# 用户流失...
```

> **一句话总结**：单点故障和性能瓶颈会导致服务不可用，需要高可用架构。

### 解决方案

高可用架构的核心：
- **多实例部署**：避免单点故障
- **负载均衡**：分散请求压力
- **故障转移**：自动切换到健康实例
- **灾备方案**：跨区域容灾

打个比方：

> 高可用架构就像是一个有多条车道的公路，一条车道堵了，还有其他车道可以走。

---

## 2 核心原理

### 高可用指标

| 指标 | 说明 | 目标 |
| --- | --- | --- |
| 可用性 | 服务正常运行时间占比 | 99.9%+ |
| MTBF | 平均无故障时间 | 越长越好 |
| MTTR | 平均修复时间 | 越短越好 |
| RTO | 恢复时间目标 | 业务可接受的最长停机时间 |
| RPO | 恢复点目标 | 可接受的数据丢失量 |

### 可用性级别

| 级别 | 可用性 | 年停机时间 |
| --- | --- | --- |
| 99% | 两个 9 | 3.65 天 |
| 99.9% | 三个 9 | 8.76 小时 |
| 99.99% | 四个 9 | 52.6 分钟 |
| 99.999% | 五个 9 | 5.26 分钟 |

---

## 3 基础用法

### 使用 Nginx 负载均衡

创建 `nginx.conf`：

```nginx
# 上游服务器组
upstream model_api {
    # 轮询策略（默认）
    server model-api-1:8000 weight=1;
    server model-api-2:8000 weight=1;
    server model-api-3:8000 weight=1;
    
    # 健康检查
    # 注意：开源版 Nginx 不支持主动健康检查
    # 需要使用 Nginx Plus 或第三方模块
}

server {
    listen 80;
    
    location / {
        proxy_pass http://model_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 超时配置
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
        
        # 重试配置
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
    }
}
```

### 使用 Docker Compose 多实例部署

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # 负载均衡器
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - model-api-1
      - model-api-2
      - model-api-3
    restart: always

  # 模型服务实例 1
  model-api-1:
    build: .
    environment:
      - INSTANCE_ID=1
    volumes:
      - model-data:/app/data
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 模型服务实例 2
  model-api-2:
    build: .
    environment:
      - INSTANCE_ID=2
    volumes:
      - model-data:/app/data
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 模型服务实例 3
  model-api-3:
    build: .
    environment:
      - INSTANCE_ID=3
    volumes:
      - model-data:/app/data
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  model-data:
```

### 使用 Kubernetes 实现高可用

创建 `deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api
spec:
  replicas: 3  # 3 个副本
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # 更新时不允许有不可用的 Pod
  selector:
    matchLabels:
      app: model-api
  template:
    metadata:
      labels:
        app: model-api
    spec:
      # 反亲和性：分散到不同节点
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - model-api
              topologyKey: kubernetes.io/hostname
      containers:
      - name: model-api
        image: model-service:1.0.0
        ports:
        - containerPort: 8000
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
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 3
```

创建 `service.yaml`：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: model-api-service
spec:
  selector:
    app: model-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

---

## 4 进阶用法

### 多区域部署

创建多区域部署架构：

```yaml
# 区域 A
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api-region-a
  labels:
    region: a
spec:
  replicas: 3
  selector:
    matchLabels:
      app: model-api
      region: a
  template:
    metadata:
      labels:
        app: model-api
        region: a
    spec:
      containers:
      - name: model-api
        image: model-service:1.0.0
        env:
        - name: REGION
          value: "a"

---
# 区域 B
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api-region-b
  labels:
    region: b
spec:
  replicas: 3
  selector:
    matchLabels:
      app: model-api
      region: b
  template:
    metadata:
      labels:
        app: model-api
        region: b
    spec:
      containers:
      - name: model-api
        image: model-service:1.0.0
        env:
        - name: REGION
          value: "b"
```

### 故障转移实现

```python
from fastapi import FastAPI, HTTPException
import httpx
import asyncio
from typing import List

app = FastAPI()

# 后端实例列表
BACKEND_INSTANCES = [
    "http://model-api-1:8000",
    "http://model-api-2:8000",
    "http://model-api-3:8000"
]

# 健康状态
health_status = {url: True for url in BACKEND_INSTANCES}

async def check_health(url: str) -> bool:
    """检查实例健康状态"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{url}/health")
            return response.status_code == 200
    except Exception:
        return False

async def get_healthy_instance() -> str:
    """获取健康的实例"""
    for url in BACKEND_INSTANCES:
        if health_status[url]:
            return url
    
    # 所有实例都不健康，尝试重新检查
    for url in BACKEND_INSTANCES:
        if await check_health(url):
            health_status[url] = True
            return url
    
    raise HTTPException(status_code=503, detail="No healthy instances available")

@app.post("/predict")
async def predict(features: list[float]):
    """代理请求到后端实例"""
    instance = await get_healthy_instance()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{instance}/predict",
                json={"features": features}
            )
            return response.json()
    except Exception as e:
        # 标记实例为不健康
        health_status[instance] = False
        # 重试其他实例
        return await predict(features)

@app.get("/health")
async def health():
    """健康检查"""
    healthy_count = sum(1 for status in health_status.values() if status)
    return {
        "status": "healthy" if healthy_count > 0 else "unhealthy",
        "healthy_instances": healthy_count,
        "total_instances": len(BACKEND_INSTANCES)
    }

# 后台健康检查任务
async def background_health_check():
    """后台定期检查健康状态"""
    while True:
        for url in BACKEND_INSTANCES:
            is_healthy = await check_health(url)
            health_status[url] = is_healthy
        await asyncio.sleep(10)

@app.on_event("startup")
async def startup():
    asyncio.create_task(background_health_check())
```

### 熔断器模式

```python
from fastapi import FastAPI, HTTPException
import httpx
import time
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"      # 正常状态
    OPEN = "open"          # 熔断状态
    HALF_OPEN = "half_open"  # 半开状态

class CircuitBreaker:
    """熔断器"""
    
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = CircuitState.CLOSED
    
    def can_execute(self) -> bool:
        """是否可以执行"""
        if self.state == CircuitState.CLOSED:
            return True
        elif self.state == CircuitState.OPEN:
            # 检查是否可以进入半开状态
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        else:  # HALF_OPEN
            return True
    
    def record_success(self):
        """记录成功"""
        self.failure_count = 0
        self.state = CircuitState.CLOSED
    
    def record_failure(self):
        """记录失败"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

app = FastAPI()

# 为每个实例创建熔断器
circuit_breakers = {
    "http://model-api-1:8000": CircuitBreaker(),
    "http://model-api-2:8000": CircuitBreaker(),
    "http://model-api-3:8000": CircuitBreaker()
}

async def call_with_circuit_breaker(url: str, features: list[float]):
    """使用熔断器调用后端"""
    breaker = circuit_breakers[url]
    
    if not breaker.can_execute():
        raise HTTPException(status_code=503, detail=f"Circuit breaker is open for {url}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{url}/predict",
                json={"features": features}
            )
            breaker.record_success()
            return response.json()
    except Exception as e:
        breaker.record_failure()
        raise

@app.post("/predict")
async def predict(features: list[float]):
    """带熔断器的预测"""
    for url, breaker in circuit_breakers.items():
        if breaker.can_execute():
            try:
                return await call_with_circuit_breaker(url, features)
            except Exception:
                continue
    
    raise HTTPException(status_code=503, detail="All instances are unavailable")
```

### 数据备份和恢复

```python
import shutil
import boto3
from pathlib import Path
from datetime import datetime

class BackupManager:
    """备份管理器"""
    
    def __init__(self, backup_dir: str = "backups", s3_bucket: str = None):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
        self.s3_bucket = s3_bucket
        self.s3_client = boto3.client('s3') if s3_bucket else None
    
    def create_backup(self, source_dir: str, backup_name: str = None):
        """创建备份"""
        if not backup_name:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"backup_{timestamp}"
        
        backup_path = self.backup_dir / backup_name
        
        # 复制文件
        shutil.copytree(source_dir, backup_path)
        
        # 压缩
        shutil.make_archive(str(backup_path), 'zip', backup_path)
        shutil.rmtree(backup_path)
        
        # 上传到 S3
        if self.s3_client:
            zip_path = f"{backup_path}.zip"
            self.s3_client.upload_file(
                zip_path,
                self.s3_bucket,
                f"backups/{backup_name}.zip"
            )
        
        print(f"✓ 备份创建成功：{backup_name}")
        return backup_name
    
    def restore_backup(self, backup_name: str, target_dir: str):
        """恢复备份"""
        backup_path = self.backup_dir / f"{backup_name}.zip"
        
        # 从 S3 下载
        if not backup_path.exists() and self.s3_client:
            self.s3_client.download_file(
                self.s3_bucket,
                f"backups/{backup_name}.zip",
                str(backup_path)
            )
        
        # 解压
        shutil.unpack_archive(backup_path, target_dir)
        
        print(f"✓ 备份恢复成功：{backup_name}")
    
    def list_backups(self):
        """列出所有备份"""
        backups = []
        
        # 本地备份
        for file in self.backup_dir.glob("*.zip"):
            backups.append({
                "name": file.stem,
                "size": file.stat().st_size,
                "created_at": datetime.fromtimestamp(file.stat().st_ctime)
            })
        
        # S3 备份
        if self.s3_client:
            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket,
                Prefix="backups/"
            )
            for obj in response.get('Contents', []):
                backups.append({
                    "name": Path(obj['Key']).stem,
                    "size": obj['Size'],
                    "created_at": obj['LastModified']
                })
        
        return sorted(backups, key=lambda x: x['created_at'], reverse=True)

# 使用示例
backup_manager = BackupManager(s3_bucket="my-model-backups")

# 创建备份
backup_manager.create_backup("data/models", "model_backup_v1")

# 列出备份
backups = backup_manager.list_backups()
print(f"可用备份：{[b['name'] for b in backups]}")

# 恢复备份
backup_manager.restore_backup("model_backup_v1", "data/models_restored")
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 高可用指标 | 可用性、MTBF、MTTR、RTO、RPO |
| 负载均衡 | 分散请求压力，提高吞吐量 |
| 故障转移 | 自动切换到健康实例 |
| 熔断器 | 防止故障扩散，快速失败 |
| 多区域部署 | 跨区域容灾 |
| 数据备份 | 定期备份，支持快速恢复 |

---

## 6 新手常见误区

### 误区 1："多部署几个实例就是高可用了"

**错！** 高可用不仅仅是多实例：
- 需要负载均衡
- 需要健康检查
- 需要故障转移
- 需要监控告警

正确做法：构建完整的高可用架构。

### 误区 2："不需要定期备份"

**错！** 不备份会导致：
- 数据丢失无法恢复
- 灾难发生时无法快速恢复
- 业务中断时间长

正确做法：定期备份，并测试恢复流程。

### 误区 3："负载均衡器不需要高可用"

**错！** 负载均衡器本身也需要高可用：
- 使用多个负载均衡器
- 使用 DNS 轮询
- 使用云厂商的高可用负载均衡

正确做法：负载均衡器也要避免单点故障。

### 误区 4："不需要故障演练"

**错！** 不演练会导致：
- 不知道故障转移是否有效
- 恢复流程不清晰
- 真正故障时手忙脚乱

正确做法：定期进行故障演练，验证高可用方案。

### 误区 5："高可用架构越复杂越好"

**错！** 过于复杂会导致：
- 维护成本高
- 故障排查困难
- 引入新的故障点

正确做法：根据业务需求设计合适的高可用方案。

---

## 7 动手练习

### 练习 1：基础练习 - 配置 Nginx 负载均衡

配置 Nginx 实现多个模型服务实例的负载均衡。

<details>
<summary>点击查看答案</summary>

`nginx.conf`：

```nginx
upstream model_api {
    server model-api-1:8000;
    server model-api-2:8000;
    server model-api-3:8000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://model_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

`docker-compose.yml`：

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - model-api-1
      - model-api-2
      - model-api-3

  model-api-1:
    build: .
    environment:
      - INSTANCE_ID=1

  model-api-2:
    build: .
    environment:
      - INSTANCE_ID=2

  model-api-3:
    build: .
    environment:
      - INSTANCE_ID=3
```

</details>

### 练习 2：进阶练习 - 实现故障转移

实现一个简单的故障转移机制。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI, HTTPException
import httpx
import asyncio

app = FastAPI()

BACKENDS = [
    "http://model-api-1:8000",
    "http://model-api-2:8000",
    "http://model-api-3:8000"
]

health_status = {url: True for url in BACKENDS}

async def get_healthy_backend():
    for url in BACKENDS:
        if health_status[url]:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(f"{url}/health")
                    if response.status_code == 200:
                        return url
            except:
                health_status[url] = False
    
    raise HTTPException(status_code=503, detail="No healthy backends")

@app.post("/predict")
async def predict(features: list[float]):
    backend = await get_healthy_backend()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{backend}/predict",
                json={"features": features}
            )
            return response.json()
    except:
        health_status[backend] = False
        return await predict(features)
```

</details>

### 练习 3（挑战）：综合练习 - 实现完整的高可用方案

实现一个包含负载均衡、故障转移、熔断器的高可用方案。

<details>
<summary>点击查看答案</summary>

```python
from fastapi import FastAPI, HTTPException
import httpx
import time
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = CircuitState.CLOSED
    
    def can_execute(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        elif self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        return True
    
    def record_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
    
    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

app = FastAPI()

BACKENDS = [
    "http://model-api-1:8000",
    "http://model-api-2:8000",
    "http://model-api-3:8000"
]

breakers = {url: CircuitBreaker() for url in BACKENDS}

@app.post("/predict")
async def predict(features: list[float]):
    for url, breaker in breakers.items():
        if breaker.can_execute():
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{url}/predict",
                        json={"features": features}
                    )
                    breaker.record_success()
                    return response.json()
            except:
                breaker.record_failure()
    
    raise HTTPException(status_code=503, detail="All backends unavailable")

@app.get("/health")
async def health():
    healthy = sum(1 for b in breakers.values() if b.state == CircuitState.CLOSED)
    return {
        "status": "healthy" if healthy > 0 else "unhealthy",
        "healthy_backends": healthy,
        "total_backends": len(BACKENDS)
    }
```

</details>

---

## 下一章预告

下一章我们会学习 **生产环境最佳实践与总结**——也就是如何在生产环境中稳定运行。你会学到：

- 安全加固措施
- 成本控制技巧
- 运维规范
- MLOps 成熟度评估

这是本教程的最后一章，会总结整个 MLOps 流程的最佳实践。
