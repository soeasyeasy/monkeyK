---
title: "第10章：Docker 安全与权限"
description: "用户命名空间、安全配置、镜像安全扫描"
---

# 第10章：Docker 安全与权限

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Docker 容器安全吗？有什么安全隐患？
- 如何限制容器的权限？
- 如何防止容器攻击宿主机？
- 如何扫描镜像中的漏洞？

这一章会教你 Docker 的安全机制和最佳实践。安全是生产环境的重要考虑因素，学完这些，你的容器会更加安全可靠。

---

## 1 为什么需要关注 Docker 安全？

### 痛点分析

Docker 容器共享宿主机内核，如果配置不当，可能存在安全风险：

- 容器以 root 用户运行，权限过大
- 容器可以访问宿主机敏感文件
- 镜像中包含漏洞或恶意代码
- 容器之间没有隔离，互相影响

### 解决方案

通过安全配置，你可以：

- 限制容器权限
- 隔离容器资源
- 扫描镜像漏洞
- 保护敏感数据

打个比方：

> 不安全的容器就像没有锁的房间，任何人都可以进出。
>
> 安全的容器就像有门禁系统的房间，只有授权人员才能进入。

---

## 2 用户命名空间

### 默认情况

默认情况下，容器内的 root 用户映射到宿主机的 root 用户：

```bash
# ❶ 运行容器
docker run -it ubuntu bash

# ❷ 在容器内查看用户
whoami
# 输出：root

# ❸ 查看进程
ps aux
# 容器内的 root 实际上是宿主机的 root
```

**风险**：如果容器被攻破，攻击者可能获得宿主机的 root 权限。

### 启用用户命名空间重映射

```bash
# ❶ 编辑 Docker 配置
sudo vim /etc/docker/daemon.json

# 添加配置
{
  "userns-remap": "default"
}

# ❷ 重启 Docker
sudo systemctl restart docker

# ❸ 验证
docker info | grep "Security Options"
```

### 使用非 root 用户

```dockerfile
# Dockerfile
FROM node:18-alpine

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 设置文件所有权
COPY --chown=nodejs:nodejs . .

USER nodejs

CMD ["node", "app.js"]
```

```yaml
# docker-compose.yml
services:
  app:
    build: .
    user: "1001:1001"  # 指定用户和组
```

---

## 3 能力（Capabilities）管理

### 什么是 Capabilities？

Linux 将 root 用户的权限细分为多个能力（Capabilities），可以精确控制容器的权限。

```bash
# ❶ 查看容器当前的 capabilities
docker exec my-container capsh --print

# ❷ 查看默认 capabilities
docker run --rm alpine cat /proc/1/status | grep Cap
```

### 删除不必要的 Capabilities

```bash
# ❶ 删除所有 capabilities
docker run --cap-drop all alpine

# ❷ 只保留必要的 capabilities
docker run \
  --cap-drop all \
  --cap-add NET_BIND_SERVICE \
  --cap-add CHOWN \
  alpine

# ❸ 常用 capabilities
# NET_BIND_SERVICE - 绑定低端口（<1024）
# CHOWN - 修改文件所有者
# SETUID - 设置用户 ID
# SETGID - 设置组 ID
```

### docker-compose.yml 配置

```yaml
services:
  app:
    image: myapp
    cap_drop:
      - ALL  # 删除所有能力
    cap_add:
      - NET_BIND_SERVICE  # 只添加必要的能力
```

---

## 4 只读文件系统

### 限制容器写入

```bash
# ❶ 设置根文件系统为只读
docker run --read-only alpine

# ❷ 允许写入临时目录
docker run --read-only --tmpfs /tmp alpine

# ❸ 挂载可写数据卷
docker run --read-only -v /data alpine
```

### docker-compose.yml 配置

```yaml
services:
  app:
    image: myapp
    read_only: true  # 根文件系统只读
    tmpfs:
      - /tmp
      - /run
    volumes:
      - app-data:/data  # 只有数据卷可写
```

**好处**：
- 防止恶意软件写入
- 提高安全性
- 容器更稳定

---

## 5 安全选项（Security Options）

### AppArmor

```bash
# ❶ 使用默认 AppArmor 配置
docker run --security-opt="apparmor=docker-default" alpine

# ❷ 禁用 AppArmor（不推荐）
docker run --security-opt="apparmor=unconfined" alpine
```

### Seccomp

```bash
# ❶ 使用默认 Seccomp 配置
docker run --security-opt="seccomp=unconfined" alpine

# ❷ 使用自定义 Seccomp 配置
docker run --security-opt="seccomp=/path/to/profile.json" alpine
```

### No New Privileges

```bash
# 禁止容器内进程获取新权限
docker run --security-opt="no-new-privileges=true" alpine
```

### docker-compose.yml 配置

```yaml
services:
  app:
    image: myapp
    security_opt:
      - no-new-privileges:true
      - apparmor=docker-default
```

---

## 6 网络隔离

### 使用自定义网络

```bash
# ❶ 创建隔离网络
docker network create isolated-network

# ❷ 运行容器
docker run --network isolated-network alpine
```

### 限制网络访问

```bash
# ❶ 禁止容器访问外网
docker run --network none alpine

# ❷ 使用防火墙限制
sudo iptables -A DOCKER -i docker0 -j DROP
```

### docker-compose.yml 配置

```yaml
services:
  db:
    image: mysql
    networks:
      - backend  # 只在后端网络
    # 不映射端口到宿主机

networks:
  backend:
    driver: bridge
    internal: true  # 内部网络，不能访问外网
```

---

## 7 资源限制

### CPU 限制

```bash
# ❶ 限制 CPU 使用率
docker run --cpus="1.5" alpine

# ❷ 限制 CPU 份额
docker run --cpu-shares=512 alpine
```

### 内存限制

```bash
# ❶ 限制内存使用
docker run --memory="512m" alpine

# ❷ 限制内存 + swap
docker run --memory="512m" --memory-swap="1g" alpine
```

### docker-compose.yml 配置

```yaml
services:
  app:
    image: myapp
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

**好处**：
- 防止单个容器占用过多资源
- 提高系统稳定性
- 防止 DoS 攻击

---

## 8 镜像安全扫描

### Docker Scout（推荐）

```bash
# ❶ 扫描镜像漏洞
docker scout cves myapp:latest

# ❷ 查看漏洞详情
docker scout cves --format sarif myapp:latest

# ❸ 比较镜像
docker scout compare myapp:v1 myapp:v2
```

### Trivy

```bash
# ❶ 安装 Trivy
brew install trivy  # macOS
# 或参考 https://github.com/aquasecurity/trivy

# ❷ 扫描镜像
trivy image myapp:latest

# ❸ 扫描并输出 JSON
trivy image --format json -o results.json myapp:latest
```

### Snyk

```bash
# ❶ 安装 Snyk
npm install -g snyk

# ❷ 登录
snyk auth

# ❸ 扫描镜像
snyk test --docker myapp:latest
```

---

## 9 敏感数据管理

### 使用 Docker Secrets

```bash
# ❶ 创建 secret
echo "my_password" | docker secret create db_password -

# ❷ 在服务中使用
docker service create \
  --secret db_password \
  --name myapp \
  myapp
```

### docker-compose.yml 配置

```yaml
services:
  app:
    image: myapp
    secrets:
      - db_password
      - api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    environment: API_KEY
```

### 环境变量 vs Secrets

| 方式 | 安全性 | 适用场景 |
| --- | --- | --- |
| 环境变量 | 低（可见） | 非敏感配置 |
| Secrets | 高（加密） | 密码、密钥等 |
| 配置文件 | 中 | 复杂配置 |

---

## 10 安全最佳实践

### 1. 使用最小权限原则

```dockerfile
# 推荐：使用非 root 用户
USER node

# 推荐：删除不必要的 capabilities
RUN apk add --no-cache libcap && \
    setcap cap_net_bind_service=+ep /usr/local/bin/node
```

### 2. 使用官方镜像

```dockerfile
# 推荐：使用官方镜像
FROM node:18-alpine

# 不推荐：使用来路不明的镜像
FROM unknown/node:latest
```

### 3. 定期更新镜像

```bash
# 定期拉取最新镜像
docker pull node:18-alpine

# 重新构建应用镜像
docker compose build --no-cache
```

### 4. 扫描镜像漏洞

```bash
# CI/CD 中集成漏洞扫描
docker scout cves myapp:latest
```

### 5. 限制资源使用

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

### 6. 使用只读文件系统

```yaml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
```

---

## 11 核心知识点总结

| 安全措施 | 说明 | 重要性 |
| --- | --- | --- |
| 非 root 用户 | 使用普通用户运行容器 | 高 |
| Capabilities | 删除不必要的权限 | 高 |
| 只读文件系统 | 防止恶意写入 | 中 |
| 资源限制 | 防止资源滥用 | 高 |
| 镜像扫描 | 发现漏洞 | 高 |
| Secrets | 保护敏感数据 | 高 |
| 网络隔离 | 限制网络访问 | 中 |

---

## 12 新手常见误区

### 误区 1："容器天然就是安全的"

**错！** 容器共享宿主机内核，如果配置不当，可能存在安全隐患。需要主动配置安全措施。

### 误区 2："以 root 运行容器没问题"

不是的。以 root 运行容器风险很高，一旦容器被攻破，攻击者可能获得宿主机 root 权限。应该使用非 root 用户。

### 误区 3："镜像扫描只在开发时做"

不是的。应该在整个生命周期中持续扫描，包括 CI/CD 和生产环境。

### 误区 4："安全配置会降低性能"

不是的。大多数安全措施（如非 root 用户、只读文件系统）对性能影响很小，但能显著提高安全性。

---

## 13 动手练习

### 练习 1：使用非 root 用户

修改 Dockerfile，使用非 root 用户运行应用。

<details>
<summary>点击查看答案</summary>

```dockerfile
FROM node:18-alpine

# 创建非 root 用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# 复制文件并设置所有权
COPY --chown=appuser:appgroup . .

# 切换到非 root 用户
USER appuser

CMD ["node", "app.js"]
```

</details>

### 练习 2：限制容器权限

运行一个容器，删除所有不必要的 capabilities。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 运行容器，删除所有 capabilities
docker run -d \
  --name secure-app \
  --cap-drop all \
  --cap-add NET_BIND_SERVICE \
  --read-only \
  --tmpfs /tmp \
  nginx:alpine

# ❷ 验证 capabilities
docker exec secure-app capsh --print

# ❸ 验证文件系统只读
docker exec secure-app touch /test.txt
# 应该报错：Read-only file system

# ❹ 清理
docker stop secure-app
docker rm secure-app
```

</details>

### 练习 3（挑战）：完整安全配置

创建一个安全的 docker-compose.yml，包含用户、权限、资源限制等配置。

<details>
<summary>点击查看答案</summary>

```yaml
services:
  app:
    build: .
    user: "1001:1001"
    read_only: true
    tmpfs:
      - /tmp
      - /run
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    networks:
      - app-network

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - db-data:/var/lib/mysql
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

secrets:
  db_password:
    file: ./secrets/db_password.txt

volumes:
  db-data:

networks:
  app-network:
    driver: bridge
```

</details>

---

## 下一章预告

下一章我们会学习 **镜像优化与最佳实践**——如何减小镜像大小、加快构建速度。你会学到多阶段构建、层缓存优化等技巧。
