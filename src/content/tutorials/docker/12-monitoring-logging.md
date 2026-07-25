---
title: "第12章：监控与日志管理"
description: "容器监控、日志收集、性能分析"
---

# 第12章：监控与日志管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何监控容器的运行状态？
- 如何查看和收集容器日志？
- 如何分析容器性能瓶颈？
- 生产环境如何管理大量容器的日志？

这一章会教你 Docker 的监控和日志管理技能。学会这些，你就能实时掌握容器状态，快速排查问题。

---

## 12.1 为什么需要监控和日志？

### 痛点分析

容器运行后，你需要知道：

- 容器是否正常运行？
- CPU、内存使用率是多少？
- 应用报错了，如何查看日志？
- 性能瓶颈在哪里？

### 解决方案

通过监控和日志，你可以：

- 实时掌握容器状态
- 快速定位和解决问题
- 优化应用性能
- 满足合规要求

打个比方：

> 没有监控的容器就像没有仪表盘的飞机，你不知道油量、速度、高度，只能盲飞。
>
> 监控和日志就是飞机的仪表盘，让你随时掌握飞行状态。

---

## 12.2 容器状态监控

### 查看容器状态

```bash
# ❶ 查看所有运行中的容器
docker ps

# ❷ 查看所有容器（包括已停止的）
docker ps -a

# ❸ 查看容器详细信息
docker inspect <container_name>

# ❹ 查看容器资源使用情况
docker stats
```

### docker stats 详解

```bash
# 实时查看所有容器的资源使用情况
docker stats

# 输出示例：
# CONTAINER ID   NAME      CPU %     MEM USAGE / LIMIT   MEM %   NET I/O         BLOCK I/O   PIDS
# abc123def456   web       0.50%     100MiB / 512MiB     19.5%   1.2kB / 600B    0B / 0B     10
# def456ghi789   db        2.30%     500MiB / 1GiB       48.8%   5.6kB / 3.2kB   0B / 0B     25

# 查看指定容器
docker stats <container_name>

# 非实时模式（只显示一次）
docker stats --no-stream
```

### 字段说明

| 字段 | 说明 |
| --- | --- |
| CPU % | CPU 使用率 |
| MEM USAGE / LIMIT | 内存使用量 / 限制 |
| MEM % | 内存使用百分比 |
| NET I/O | 网络输入/输出 |
| BLOCK I/O | 磁盘读写 |
| PIDS | 进程数 |

---

## 12.3 日志管理基础

### 查看容器日志

```bash
# ❶ 查看容器日志
docker logs <container_name>

# ❷ 实时跟踪日志
docker logs -f <container_name>

# ❸ 查看最近 100 行
docker logs --tail 100 <container_name>

# ❹ 查看指定时间之后的日志
docker logs --since 2024-01-01T00:00:00 <container_name>

# ❺ 查看指定时间之前的日志
docker logs --until 2024-01-01T23:59:59 <container_name>

# ❻ 显示时间戳
docker logs -t <container_name>
```

### 日志文件位置

```bash
# Linux 系统
/var/lib/docker/containers/<container_id>/<container_id>-json.log

# 查看日志文件大小
ls -lh /var/lib/docker/containers/<container_id>/<container_id>-json.log
```

---

## 12.4 日志驱动

### 默认日志驱动

Docker 默认使用 `json-file` 日志驱动，将日志以 JSON 格式存储在文件中。

```bash
# 查看当前日志驱动
docker info | grep "Logging Driver"
# 输出：Logging Driver: json-file
```

### 常用日志驱动

| 驱动 | 说明 | 适用场景 |
| --- | --- | --- |
| json-file | 默认，JSON 格式 | 开发环境 |
| syslog | 发送到 syslog | Linux 系统 |
| journald | 发送到 systemd journal | systemd 系统 |
| fluentd | 发送到 Fluentd | 集中日志管理 |
| splunk | 发送到 Splunk | 企业级日志 |
| gelf | 发送到 Graylog | 集中日志管理 |
| awslogs | 发送到 CloudWatch | AWS 环境 |
| none | 不记录日志 | 不需要日志 |

### 配置日志驱动

```bash
# ❶ 全局配置（daemon.json）
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# ❷ 运行时指定
docker run -d \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  nginx

# ❸ docker-compose.yml 配置
services:
  web:
    image: nginx
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

### 日志轮转配置

```bash
# 限制日志文件大小，防止磁盘占满
docker run -d \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  nginx

# max-size: 单个日志文件最大大小
# max-file: 保留的日志文件数量
```

---

## 12.5 性能分析工具

### docker top

```bash
# 查看容器内运行的进程
docker top <container_name>

# 输出示例：
# UID   PID   PPID   C   STIME   TTY   TIME      CMD
# root  1234  5678   0   10:00   ?     00:00:01  nginx: master process
# nginx 1235  1234   0   10:00   ?     00:00:05  nginx: worker process
```

### docker inspect

```bash
# 查看容器详细信息
docker inspect <container_name>

# 查看特定字段
docker inspect -f '{{.State.Status}}' <container_name>
docker inspect -f '{{.NetworkSettings.IPAddress}}' <container_name>
docker inspect -f '{{.HostConfig.Memory}}' <container_name>
```

### cAdvisor（Container Advisor）

```bash
# 运行 cAdvisor 容器
docker run -d \
  --name=cadvisor \
  --privileged \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --volume=/dev/disk/:/dev/disk:ro \
  -p 8080:8080 \
  gcr.io/cadvisor/cadvisor:latest

# 访问 http://localhost:8080 查看容器资源使用情况
```

---

## 12.6 健康检查

### 配置健康检查

```dockerfile
# Dockerfile
FROM nginx:alpine

# 配置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### 健康检查参数

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| interval | 检查间隔 | 30s |
| timeout | 超时时间 | 30s |
| start-period | 启动宽限期 | 0s |
| retries | 重试次数 | 3 |

### 查看健康状态

```bash
# 查看容器健康状态
docker ps

# 输出示例：
# CONTAINER ID   IMAGE   STATUS                    NAMES
# abc123         nginx   Up 5 minutes (healthy)    web

# 查看详细健康信息
docker inspect --format='{{.State.Health.Status}}' <container_name>

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' <container_name> | jq
```

### docker-compose.yml 配置

```yaml
services:
  web:
    image: nginx
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 12.7 事件监控

### docker events

```bash
# 实时查看 Docker 事件
docker events

# 输出示例：
# 2024-01-01T10:00:00.000000000+08:00 container create abc123 (image=nginx, name=web)
# 2024-01-01T10:00:01.000000000+08:00 container start abc123 (image=nginx, name=web)
# 2024-01-01T10:05:00.000000000+08:00 container stop abc123 (image=nginx, name=web)

# 过滤事件类型
docker events --filter 'event=start'
docker events --filter 'event=stop'
docker events --filter 'container=web'

# 指定时间范围
docker events --since '2024-01-01T00:00:00' --until '2024-01-01T23:59:59'
```

### 事件类型

| 事件 | 说明 |
| --- | --- |
| create | 容器创建 |
| start | 容器启动 |
| stop | 容器停止 |
| kill | 容器被杀死 |
| die | 容器退出 |
| destroy | 容器删除 |
| pause | 容器暂停 |
| unpause | 容器恢复 |

---

## 12.8 集中日志管理

### ELK Stack

ELK（Elasticsearch、Logstash、Kibana）是流行的日志管理方案。

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

  logstash:
    image: logstash:7.17.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  kibana:
    image: kibana:7.17.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_URL=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  es-data:
```

### Fluentd + Elasticsearch

```yaml
# docker-compose.yml
services:
  fluentd:
    image: fluent/fluentd:v1.14-1
    volumes:
      - ./fluentd/conf:/fluentd/etc
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    ports:
      - "24224:24224"

  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: kibana:7.17.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

---

## 12.9 Prometheus + Grafana

### 监控方案

Prometheus 用于收集和存储指标，Grafana 用于可视化。

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    ports:
      - "8080:8080"

volumes:
  prometheus-data:
  grafana-data:
```

### Prometheus 配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['cadvisor:8080']
```

---

## 12.10 故障排查

### 常见问题排查

```bash
# ❶ 容器启动失败
docker logs <container_name>
docker inspect <container_name>

# ❷ 容器频繁重启
docker inspect --format='{{.RestartCount}}' <container_name>
docker inspect --format='{{.State.OOMKilled}}' <container_name>

# ❸ 性能问题
docker stats <container_name>
docker top <container_name>

# ❹ 网络问题
docker exec <container_name> ping google.com
docker exec <container_name> nslookup example.com

# ❺ 磁盘空间问题
docker system df
docker system prune
```

### 调试技巧

```bash
# ❶ 进入容器调试
docker exec -it <container_name> sh

# ❷ 查看容器环境变量
docker inspect --format='{{json .Config.Env}}' <container_name> | jq

# ❸ 查看容器挂载点
docker inspect --format='{{json .Mounts}}' <container_name> | jq

# ❹ 查看容器网络配置
docker inspect --format='{{json .NetworkSettings}}' <container_name> | jq
```

---

## 12.11 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| docker stats | 实时查看容器资源使用情况 |
| docker logs | 查看容器日志 |
| 日志驱动 | json-file、syslog、fluentd 等 |
| 健康检查 | 监控容器运行状态 |
| cAdvisor | 容器资源监控工具 |
| ELK Stack | 集中日志管理方案 |
| Prometheus + Grafana | 监控和可视化方案 |

---

## 12.12 新手常见误区

### 误区 1："日志不需要管理"

**错！** 日志会占用大量磁盘空间，需要配置日志轮转和清理策略。

### 误区 2："健康检查不重要"

不是的。健康检查可以自动重启异常容器，提高应用可用性。

### 误区 3："监控只在开发时需要"

不是的。生产环境更需要监控，及时发现问题，避免服务中断。

### 误区 4："所有日志都应该存在容器内"

不是的。容器是临时的，日志应该持久化到外部存储或集中日志系统。

---

## 12.13 动手练习

### 练习 1：查看容器日志

运行一个容器，生成日志，然后查看和分析日志。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 运行容器
docker run -d --name log-test alpine sh -c "while true; do echo $(date) - Log message; sleep 5; done"

# ❷ 查看日志
docker logs log-test

# ❸ 实时跟踪日志
docker logs -f log-test

# ❹ 查看最近 10 行
docker logs --tail 10 log-test

# ❺ 清理
docker stop log-test
docker rm log-test
```

</details>

### 练习 2：配置健康检查

为一个 Web 应用配置健康检查。

<details>
<summary>点击查看答案</summary>

```yaml
# docker-compose.yml
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

```bash
# 启动并查看健康状态
docker compose up -d
docker ps
docker inspect --format='{{.State.Health.Status}}' web
```

</details>

### 练习 3（挑战）：搭建监控系统

搭建 Prometheus + Grafana 监控系统，监控容器资源。

<details>
<summary>点击查看答案</summary>

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    ports:
      - "8080:8080"
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['cadvisor:8080']
```

```bash
# 启动
docker compose up -d

# 访问
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
# cAdvisor: http://localhost:8080
```

</details>

---

## 下一章预告

下一章我们会学习 **CI/CD 集成**——如何将 Docker 集成到持续集成和持续部署流程中。你会学到自动化构建、测试和部署的完整流程。
