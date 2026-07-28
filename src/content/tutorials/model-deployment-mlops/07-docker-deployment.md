---
title: "第7章：Docker 容器化部署"
description: "Docker 基础，模型服务镜像构建，容器编排基础"
---

# 第7章：Docker 容器化部署

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Docker？为什么要用它部署模型？
- 如何编写 Dockerfile 打包模型服务？
- 如何优化 Docker 镜像大小？
- 如何使用 Docker Compose 管理多个容器？

这一章就是为了解答这些问题。我们会学习 Docker 的核心概念，掌握如何将模型服务容器化部署。

---

## 1 为什么需要 Docker？

### 痛点分析

想象一下这个场景：你的模型服务在本地运行正常，部署到服务器就报错：

```bash
# 本地运行正常
python app.py  # 成功

# 服务器运行报错
python app.py  # ModuleNotFoundError: No module named 'sklearn'
```

或者更糟糕的情况：

```bash
# 本地环境
Python 3.9
scikit-learn 1.3.2

# 服务器环境
Python 3.8
scikit-learn 0.24.2  # 版本不兼容！
```

> **一句话总结**：环境不一致是部署最常见的坑，Docker 能彻底解决这个问题。

### 解决方案

Docker 是一个容器化平台，可以把应用和所有依赖打包成一个独立的容器。

打个比方：

> Docker 就像是一个"集装箱"，把你的应用、依赖、配置全部装进去，在任何机器上都能运行。

---

## 2 核心原理

### Docker 核心概念

| 概念 | 说明 | 类比 |
| --- | --- | --- |
| 镜像（Image） | 应用的模板，包含代码和依赖 | 菜谱 |
| 容器（Container） | 镜像的运行实例 | 做好的菜 |
| Dockerfile | 构建镜像的脚本 | 菜谱的写法 |
| 仓库（Registry） | 存储镜像的地方 | 菜谱本 |
| 卷（Volume） | 持久化存储 | 冰箱 |
| 网络（Network） | 容器间通信 | 厨房之间的通道 |

### Docker 工作流程

```
编写 Dockerfile → 构建镜像 → 运行容器 → 部署应用
```

---

## 3 基础用法

### 创建 Dockerfile

```dockerfile
# 使用 Python 3.9 基础镜像
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

### 构建和运行

```bash
# 构建镜像
docker build -t model-service:1.0.0 .

# 查看镜像
docker images

# 运行容器
docker run -d -p 8000:8000 --name model-api model-service:1.0.0

# 查看运行中的容器
docker ps

# 查看容器日志
docker logs model-api

# 停止容器
docker stop model-api

# 删除容器
docker rm model-api

# 删除镜像
docker rmi model-service:1.0.0
```

### 测试服务

```bash
# 测试健康检查
curl http://localhost:8000/health

# 测试预测接口
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"features": [5.1, 3.5, 1.4, 0.2]}'
```

---

## 4 进阶用法

### 多阶段构建优化镜像大小

```dockerfile
# 阶段 1：构建阶段
FROM python:3.9-slim as builder

WORKDIR /build

# 安装构建依赖
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# 阶段 2：运行阶段
FROM python:3.9-slim

WORKDIR /app

# 从构建阶段复制安装的包
COPY --from=builder /root/.local /root/.local

# 复制应用代码
COPY . .

# 设置环境变量
ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 使用 .dockerignore

创建 `.dockerignore` 文件，避免复制不必要的文件：

```
# Python
__pycache__/
*.py[cod]
venv/
.env

# 数据文件
data/raw/
data/processed/
*.csv
*.pkl

# IDE
.vscode/
.idea/

# Git
.git/
.gitignore

# Docker
Dockerfile
.dockerignore

# 文档
*.md
docs/
```

### 使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # 模型服务
  model-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - MODEL_PATH=/app/data/models/model.joblib
    volumes:
      - ./data/models:/app/data/models:ro
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis 缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - model-api
    restart: unless-stopped

volumes:
  redis-data:
```

### Nginx 配置

创建 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream model_api {
        server model-api:8000;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://model_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /health {
            proxy_pass http://model_api/health;
        }
    }
}
```

### 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 扩展服务实例
docker-compose up -d --scale model-api=3
```

### 环境变量管理

创建 `.env` 文件：

```bash
# 应用配置
ENVIRONMENT=production
DEBUG=False

# 模型配置
MODEL_PATH=/app/data/models/model.joblib

# Redis 配置
REDIS_URL=redis://redis:6379/0

# API 配置
API_KEY=your-secret-key
```

在 `docker-compose.yml` 中使用：

```yaml
services:
  model-api:
    build: .
    env_file:
      - .env
    environment:
      - ENVIRONMENT=${ENVIRONMENT}
```

### GPU 支持（深度学习模型）

```dockerfile
# 使用 NVIDIA CUDA 基础镜像
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# 安装 Python
RUN apt-get update && apt-get install -y python3 python3-pip

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

在 `docker-compose.yml` 中配置 GPU：

```yaml
services:
  model-api:
    build: .
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Dockerfile | 定义镜像构建步骤 |
| 多阶段构建 | 减小镜像体积，分离构建和运行环境 |
| .dockerignore | 排除不必要的文件 |
| Docker Compose | 管理多容器应用 |
| 数据卷 | 持久化存储和共享数据 |
| 网络配置 | 容器间通信 |
| GPU 支持 | 使用 NVIDIA Container Toolkit |

---

## 6 新手常见误区

### 误区 1："Docker 镜像越大越好"

**错！** 大镜像会导致：
- 构建和推送慢
- 占用更多存储
- 启动时间长

正确做法：使用多阶段构建，清理不必要的文件，选择 slim 基础镜像。

### 误区 2："不需要 .dockerignore"

**错！** 没有 .dockerignore 会导致：
- 复制不必要的文件
- 镜像体积增大
- 可能泄露敏感信息

正确做法：创建 .dockerignore 排除不需要的文件。

### 误区 3："容器数据不需要持久化"

**错！** 容器删除后数据会丢失：
- 模型文件
- 日志文件
- 数据库数据

正确做法：使用数据卷（Volume）持久化重要数据。

### 误区 4："一个容器运行所有服务"

**错！** 违反容器设计原则：
- 难以扩展
- 故障影响范围大
- 资源分配不灵活

正确做法：每个服务一个容器，使用 Docker Compose 编排。

### 误区 5："生产环境不需要健康检查"

**错！** 没有健康检查会导致：
- 无法自动重启故障容器
- 负载均衡器无法判断服务状态
- 故障发现延迟

正确做法：配置健康检查，监控服务状态。

---

## 7 动手练习

### 练习 1：基础练习 - 创建简单的 Dockerfile

为一个 FastAPI 应用创建 Dockerfile。

<details>
<summary>点击查看答案</summary>

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

构建和运行：

```bash
docker build -t fastapi-app .
docker run -p 8000:8000 fastapi-app
```

</details>

### 练习 2：进阶练习 - 使用 Docker Compose

创建一个包含 API 服务和 Redis 的多容器应用。

<details>
<summary>点击查看答案</summary>

`docker-compose.yml`：

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

启动：

```bash
docker-compose up -d
```

</details>

### 练习 3（挑战）：综合练习 - 完整的生产部署

创建一个完整的模型服务部署方案，包括 API、Redis、Nginx。

<details>
<summary>点击查看答案</summary>

项目结构：

```
project/
├── main.py
├── requirements.txt
├── Dockerfile
├── .dockerignore
├── docker-compose.yml
├── nginx.conf
└── .env
```

`Dockerfile`：

```dockerfile
FROM python:3.9-slim as builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.9-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`docker-compose.yml`：

```yaml
version: '3.8'

services:
  api:
    build: .
    environment:
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api

volumes:
  redis-data:
```

启动：

```bash
docker-compose up -d
```

</details>

---

## 下一章预告

下一章我们会学习 **模型服务监控与日志**——也就是如何监控模型服务的运行状态。你会学到：

- 监控指标设计
- 日志系统搭建
- 告警机制配置
- 性能分析工具

掌握这些知识后，你就能及时发现和处理生产环境的问题了。
