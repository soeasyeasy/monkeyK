---
title: "第15章：生产环境最佳实践"
description: "资源限制、日志管理、监控告警、安全加固"
---

# 第15章：生产环境最佳实践

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 生产环境运行容器需要注意什么？
- 如何限制容器的资源使用？
- 如何管理容器日志？
- 如何监控和告警？
- 如何加固容器安全？

这一章会教你生产环境运行 Docker 容器的最佳实践。学完这些，你的容器应用会更稳定、更安全、更易维护。

---

## 15.1 为什么需要生产环境最佳实践？

### 开发环境 vs 生产环境

开发环境和生产环境有本质区别：

**开发环境**：
- 资源充足，可以随意使用
- 单用户或少量用户
- 可以重启，影响小
- 日志随便输出

**生产环境**：
- 资源有限，需要精打细算
- 大量用户并发访问
- 不能随意重启，要保证高可用
- 日志需要规范管理和分析
- 安全性要求高

打个比方：

> 开发环境就像在家做饭，食材随便用，厨房乱了慢慢收拾。
> 
> 生产环境就像餐厅厨房，每样食材都要精确计算，厨房要整洁高效，出菜要快且稳定。

### 生产环境的挑战

| 挑战 | 说明 |
|------|------|
| 资源限制 | CPU、内存、磁盘有限，需要合理分配 |
| 高可用 | 服务不能中断，需要故障转移 |
| 性能优化 | 响应时间要快，吞吐量要高 |
| 安全加固 | 防止攻击，保护数据 |
| 监控告警 | 及时发现问题，快速响应 |
| 日志管理 | 收集、存储、分析日志 |

---

## 15.2 资源限制

### 为什么需要资源限制？

如果不限制容器资源：
- 一个容器可能占用所有 CPU，导致其他容器无法运行
- 内存泄漏可能耗尽宿主机内存，导致系统崩溃
- 日志文件无限增长，占满磁盘空间

### CPU 限制

```bash
# 限制容器最多使用 1.5 个 CPU 核心
docker run --cpus=1.5 myapp

# 或者使用 CPU 份额（相对权重）
docker run --cpu-shares=512 myapp
```

```yaml
# docker-compose.yml
services:
  myapp:
    image: myapp:latest
    deploy:
      resources:
        limits:
          cpus: '1.5'
        reservations:
          cpus: '0.5'
```

**参数说明**：
- `limits`：硬限制，容器最多能用这么多
- `reservations`：软限制，保证容器至少有这么多

### 内存限制

```bash
# 限制容器最多使用 512MB 内存
docker run --memory=512m myapp

# 限制内存 + swap
docker run --memory=512m --memory-swap=1g myapp
```

```yaml
# docker-compose.yml
services:
  myapp:
    image: myapp:latest
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

**最佳实践**：
- 设置合理的内存限制，防止 OOM
- 监控内存使用情况，及时调整
- 预留一些内存给系统和其他容器

### 磁盘限制

```bash
# 使用 tmpfs 挂载临时目录（不写入磁盘）
docker run --tmpfs /tmp myapp

# 限制日志文件大小
docker run --log-opt max-size=10m --log-opt max-file=3 myapp
```

```yaml
# docker-compose.yml
services:
  myapp:
    image: myapp:latest
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    tmpfs:
      - /tmp
      - /var/log
```

### 完整资源限制示例

```yaml
services:
  web:
    image: nginx:alpine
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 64M
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
    tmpfs:
      - /tmp:size=100M
      - /var/cache/nginx:size=50M
```

---

## 15.3 健康检查

### 什么是健康检查？

健康检查用于监控容器内应用是否正常运行。Docker 会定期执行检查命令，如果失败，会将容器标记为不健康。

### 配置健康检查

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm ci --production

EXPOSE 3000

# 健康检查配置
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["node", "server.js"]
```

```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 5000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.end();
```

```yaml
# docker-compose.yml
services:
  web:
    image: myapp:latest
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**参数说明**：
- `interval`：检查间隔（默认 30s）
- `timeout`：超时时间（默认 30s）
- `retries`：失败次数后标记为不健康（默认 3）
- `start_period`：启动宽限期，这段时间内失败不计入（默认 0s）

### 查看健康状态

```bash
# 查看容器健康状态
docker ps

# 输出示例：
# CONTAINER ID   IMAGE       STATUS                    PORTS
# abc123         myapp       Up 5 minutes (healthy)    0.0.0.0:3000->3000/tcp

# 查看详细健康信息
docker inspect --format='{{json .State.Health}}' myapp | jq
```

### 健康检查最佳实践

1. **轻量级检查**：检查命令要快速执行，不要做复杂操作
2. **真实验证**：检查应用是否真正可用，而不只是进程在运行
3. **合理间隔**：不要太频繁（浪费资源），也不要太稀疏（发现不及时）
4. **设置宽限期**：应用启动需要时间，设置合理的 `start_period`

---

## 15.4 日志管理

### 日志驱动选择

Docker 支持多种日志驱动：

| 驱动 | 适用场景 | 特点 |
|------|----------|------|
| `json-file` | 开发环境 | 默认驱动，JSON 格式 |
| `syslog` | Linux 系统 | 发送到系统日志 |
| `journald` | systemd 系统 | 发送到 systemd journal |
| `fluentd` | 生产环境 | 发送到 Fluentd 收集 |
| `splunk` | 企业环境 | 发送到 Splunk |
| `awslogs` | AWS 环境 | 发送到 CloudWatch |

### 配置日志驱动

```bash
# 使用 json-file 驱动，限制日志大小
docker run \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=5 \
  myapp
```

```yaml
# docker-compose.yml
services:
  myapp:
    image: myapp:latest
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
        labels: "app,env"
```

### 日志最佳实践

1. **结构化日志**：使用 JSON 格式，便于解析和查询
2. **日志级别**：区分 DEBUG、INFO、WARN、ERROR
3. **日志轮转**：限制日志文件大小和数量
4. **集中收集**：使用 Fluentd、ELK 等工具集中管理

```javascript
// 结构化日志示例
const log = {
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: 'User logged in',
  userId: 123,
  requestId: 'abc-123'
};

console.log(JSON.stringify(log));
```

---

## 15.5 监控与告警

### 使用 Prometheus + Grafana

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
    networks:
      - monitoring

  grafana:
    image: grafana/grafana
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    ports:
      - "8080:8080"
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['cadvisor:8080']
  
  - job_name: 'myapp'
    static_configs:
      - targets: ['myapp:3000']
```

### 应用指标暴露

```javascript
// server.js
const express = require('express');
const promClient = require('prom-client');

const app = express();

// 创建指标注册表
const register = new promClient.Registry();

// 添加默认指标
promClient.collectDefaultMetrics({ register });

// 自定义指标
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// 中间件：记录请求耗时
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
  });
  next();
});

// 暴露指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000);
```

### 告警配置

```yaml
# prometheus.yml
rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

```yaml
# alert_rules.yml
groups:
  - name: myapp
    rules:
      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
      
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
```

---

## 15.6 安全加固

### 使用非 root 用户

```dockerfile
# Dockerfile
FROM node:18-alpine

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 复制文件并设置权限
COPY --chown=nodejs:nodejs . .

# 切换到非 root 用户
USER nodejs

EXPOSE 3000
CMD ["node", "server.js"]
```

### 只读文件系统

```bash
# 将根文件系统设置为只读
docker run --read-only myapp

# 允许写入临时目录
docker run --read-only --tmpfs /tmp myapp
```

```yaml
# docker-compose.yml
services:
  myapp:
    image: myapp:latest
    read_only: true
    tmpfs:
      - /tmp:size=100M
      - /var/log:size=50M
    volumes:
      - app-data:/app/data  # 需要写入的目录单独挂载
```

### 限制 capabilities

```bash
# 删除所有 capabilities，只保留必要的
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp
```

```yaml
# docker-compose.yml
services:
  myapp:
    image: myapp:latest
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # 允许绑定低端口
```

### 网络隔离

```yaml
# docker-compose.yml
services:
  web:
    image: nginx
    networks:
      - frontend
  
  app:
    image: myapp
    networks:
      - frontend
      - backend
  
  db:
    image: postgres
    networks:
      - backend  # 数据库只在内网，不暴露给前端

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # 内部网络，不能访问外网
```

### 安全扫描

```bash
# 使用 Docker Scout 扫描镜像
docker scout cves myapp:latest

# 使用 Trivy 扫描
trivy image myapp:latest
```

---

## 15.7 高可用部署

### 多副本部署

```yaml
# docker-compose.yml
services:
  web:
    image: myapp:latest
    deploy:
      replicas: 3
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 使用 Nginx 负载均衡

```nginx
# nginx.conf
upstream myapp {
    server myapp-1:3000;
    server myapp-2:3000;
    server myapp-3:3000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://myapp;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 自动重启策略

```yaml
# docker-compose.yml
services:
  myapp:
    image: myapp:latest
    restart: unless-stopped
    # 可选值：
    # no - 不自动重启（默认）
    # on-failure - 失败时重启
    # always - 总是重启
    # unless-stopped - 除非手动停止，否则总是重启
```

---

## 15.8 备份与恢复

### 数据库备份

```bash
# 备份 MySQL 数据
docker exec mysql-container mysqldump -u root -p123456 mydb > backup.sql

# 恢复数据
docker exec -i mysql-container mysql -u root -p123456 mydb < backup.sql
```

### 数据卷备份

```bash
# 备份数据卷
docker run --rm \
  -v myapp-data:/data:ro \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/myapp-data-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm \
  -v myapp-data:/data \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/myapp-data-backup.tar.gz -C /data
```

### 自动化备份脚本

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
docker exec mysql-container mysqldump -u root -p123456 mydb > ${BACKUP_DIR}/db_${DATE}.sql

# 备份数据卷
docker run --rm \
  -v myapp-data:/data:ro \
  -v ${BACKUP_DIR}:/backup \
  alpine \
  tar czf /backup/data_${DATE}.tar.gz -C /data .

# 删除 7 天前的备份
find ${BACKUP_DIR} -name "*.sql" -mtime +7 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: ${DATE}"
```

```bash
# 添加定时任务
crontab -e

# 每天凌晨 2 点执行备份
0 2 * * * /path/to/backup.sh
```

---

## 15.9 性能优化

### 镜像优化

```dockerfile
# 使用多阶段构建
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 缓存优化

```dockerfile
# 先复制 package.json，利用缓存
COPY package*.json ./
RUN npm ci

# 再复制源代码
COPY . .
```

### 网络优化

```bash
# 使用 host 网络模式（性能更好）
docker run --network host myapp

# 使用自定义网络（DNS 解析更快）
docker network create --driver bridge myapp-network
docker run --network myapp-network myapp
```

---

## 15.10 核心知识点总结

| 知识点 | 说明 | 最佳实践 |
|--------|------|----------|
| 资源限制 | CPU、内存、磁盘 | 设置合理的 limits 和 reservations |
| 健康检查 | 监控应用状态 | 轻量级检查，设置合理间隔 |
| 日志管理 | 收集和分析日志 | 结构化日志，日志轮转 |
| 监控告警 | 及时发现问题 | Prometheus + Grafana |
| 安全加固 | 保护容器安全 | 非 root 用户，只读文件系统 |
| 高可用 | 服务不中断 | 多副本，负载均衡 |
| 备份恢复 | 数据安全 | 定期备份，自动化脚本 |
| 性能优化 | 提升响应速度 | 镜像优化，缓存优化 |

---

## 15.11 新手常见误区

### 误区 1："生产环境不需要资源限制"

**错！** 不限制资源会导致容器互相影响，一个容器可能占用所有资源，导致其他容器无法运行。

### 误区 2："健康检查越频繁越好"

不是的。过于频繁的健康检查会浪费资源，应该根据应用特点设置合理的间隔。

### 误区 3："日志输出到控制台就行了"

不是的。生产环境需要集中收集日志，便于查询和分析。应该使用日志驱动或日志收集工具。

### 误区 4："容器内用 root 用户更方便"

不是的。使用 root 用户存在安全风险，一旦容器被攻破，攻击者可能获得宿主机权限。应该使用非 root 用户。

---

## 15.12 动手练习

### 练习 1：配置资源限制

为一个 Node.js 应用配置 CPU 和内存限制。

<details>
<summary>点击查看答案</summary>

```yaml
# docker-compose.yml
services:
  myapp:
    image: node:18-alpine
    command: node server.js
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

```bash
# 验证资源限制
docker stats myapp
```

</details>

### 练习 2：添加健康检查

为一个 Web 应用添加健康检查。

<details>
<summary>点击查看答案</summary>

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm ci --production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
```

```javascript
// server.js
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(3000);
```

```bash
# 查看健康状态
docker ps
docker inspect --format='{{json .State.Health}}' myapp | jq
```

</details>

### 练习 3（挑战）：完整的生产环境配置

为一个应用配置完整的生产环境，包括资源限制、健康检查、日志管理、安全加固。

<details>
<summary>点击查看答案</summary>

```yaml
# docker-compose.yml
services:
  myapp:
    image: myapp:latest
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
    read_only: true
    tmpfs:
      - /tmp:size=100M
      - /var/log:size=50M
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

```dockerfile
# Dockerfile
FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --production

COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["node", "server.js"]
```

</details>

---

## 下一章预告

下一章我们会学习**综合项目实战**——从零开始构建一个完整的微服务应用，包括服务拆分、容器化、编排部署、监控告警等完整流程。这是对整个 Docker 教程的综合应用。
