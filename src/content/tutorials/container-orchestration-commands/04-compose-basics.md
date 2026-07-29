---
title: '第4章：Docker Compose 基础命令'
description: '掌握 Docker Compose 核心命令，学会使用 YAML 文件管理多容器应用'
---

# 第4章：Docker Compose 基础命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Docker Compose？它解决了什么问题？
- 如何编写 docker-compose.yml 文件？
- 如何一键启动多个容器？
- 如何管理多容器应用的生命周期？

这一章会系统讲解 Docker Compose 的基础命令，让你能够用 YAML 文件定义整个应用栈，一键启动所有服务。

---

## 1 Docker Compose 简介

### 1.1 为什么需要 Docker Compose？

当你需要运行一个复杂应用时，可能需要多个容器：

- Web 服务器（Nginx）
- 应用服务器（Node.js）
- 数据库（MySQL）
- 缓存（Redis）

用 `docker run` 命令手动启动这些容器：

```bash
# ❶ 启动数据库
docker run -d --name mysql -e MYSQL_ROOT_PASSWORD=123456 mysql:8.0

# ❷ 启动缓存
docker run -d --name redis redis:alpine

# ❸ 启动应用
docker run -d --name app --link mysql --link redis -p 3000:3000 myapp

# ❹ 启动 Web 服务器
docker run -d --name nginx --link app -p 80:80 nginx
```

**问题**：

- 命令太多，容易出错
- 依赖关系难以管理
- 每次都要手动执行
- 难以复现环境

**Docker Compose 解决方案**：

用一个 YAML 文件定义所有服务，一条命令启动：

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: 123456
  
  redis:
    image: redis:alpine
  
  app:
    image: myapp
    ports:
      - "3000:3000"
    depends_on:
      - mysql
      - redis
  
  nginx:
    image: nginx
    ports:
      - "80:80"
    depends_on:
      - app
```

```bash
# 一键启动所有服务
docker compose up -d
```

### 1.2 Docker Compose 核心概念

**三个重要概念**：

| 概念 | 说明 |
| --- | --- |
| **服务（Service）** | 一个容器，对应 compose 文件中的一个 service |
| **项目（Project）** | 由一组服务组成的完整应用，对应一个 compose 文件 |
| **Compose 文件** | YAML 格式，定义所有服务、网络、卷等配置 |

---

## 2 docker compose 命令概览

### 2.1 命令格式

Docker Compose V2 使用 `docker compose` 命令（注意中间是空格，不是连字符）：

```bash
docker compose [选项] [命令]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-f, --file` | 指定 compose 文件（默认 docker-compose.yml） |
| `-p, --project-name` | 指定项目名称（默认目录名） |
| `--profile` | 启用指定的 profile |
| `--env-file` | 指定环境变量文件 |

### 2.2 命令分类

**生命周期命令**：

| 命令 | 说明 |
| --- | --- |
| `up` | 创建并启动所有服务 |
| `down` | 停止并删除所有资源 |
| `start` | 启动已停止的服务 |
| `stop` | 停止服务 |
| `restart` | 重启服务 |
| `pause` | 暂停服务 |
| `unpause` | 恢复暂停的服务 |

**查看命令**：

| 命令 | 说明 |
| --- | --- |
| `ps` | 列出容器 |
| `logs` | 查看服务日志 |
| `images` | 列出使用的镜像 |
| `config` | 验证并查看 compose 文件 |

**操作命令**：

| 命令 | 说明 |
| --- | --- |
| `exec` | 在服务中执行命令 |
| `run` | 一次性运行服务 |
| `build` | 构建或重建服务 |
| `pull` | 拉取服务镜像 |
| `push` | 推送服务镜像 |

---

## 3 生命周期命令

### 3.1 docker compose up - 创建并启动

**命令格式**：

```bash
docker compose up [选项] [服务...]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-d, --detach` | 后台运行 |
| `--build` | 启动前强制构建 |
| `--no-build` | 不自动构建 |
| `--no-deps` | 不启动依赖服务 |
| `--force-recreate` | 强制重新创建容器 |
| `--no-recreate` | 不重新创建已存在的容器 |
| `--remove-orphans` | 删除未定义的服务容器 |
| `--scale` | 扩缩容（如 `--scale web=3`） |
| `--timeout` | 停止超时时间（秒） |
| `--wait` | 等待服务健康检查通过 |

**实战示例**：

```bash
# 前台启动（看到所有日志）
docker compose up

# 后台启动（推荐）
docker compose up -d

# 启动前强制构建
docker compose up -d --build

# 只启动指定服务
docker compose up -d web db

# 启动服务及其依赖
docker compose up -d web

# 启动但不启动依赖
docker compose up -d --no-deps web

# 强制重新创建容器
docker compose up -d --force-recreate

# 扩缩容到 3 个实例
docker compose up -d --scale web=3

# 删除未定义的服务容器
docker compose up -d --remove-orphans

# 等待健康检查通过
docker compose up -d --wait
```

**输出示例**：

```
[+] Running 4/4
 ✔ Network myapp_default       Created
 ✔ Container myapp-db-1        Started
 ✔ Container myapp-redis-1     Started
 ✔ Container myapp-web-1       Started
```

### 3.2 docker compose down - 停止并删除

**命令格式**：

```bash
docker compose down [选项]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-v, --volumes` | 同时删除数据卷 |
| `--rmi` | 删除镜像（all 或 local） |
| `--remove-orphans` | 删除未定义的服务容器 |
| `-t, --timeout` | 停止超时时间（秒） |

**实战示例**：

```bash
# 停止并删除所有资源（网络、容器）
docker compose down

# 同时删除数据卷（慎用，会丢失数据）
docker compose down -v

# 删除镜像
docker compose down --rmi all

# 只删除本地镜像
docker compose down --rmi local

# 设置停止超时
docker compose down -t 30

# 删除未定义的服务容器
docker compose down --remove-orphans
```

**输出示例**：

```
[+] Running 4/4
 ✔ Container myapp-web-1       Removed
 ✔ Container myapp-redis-1     Removed
 ✔ Container myapp-db-1        Removed
 ✔ Network myapp_default       Removed
```

### 3.3 docker compose stop - 停止服务

```bash
# 停止所有服务
docker compose stop

# 停止指定服务
docker compose stop web db

# 设置停止超时
docker compose stop -t 30
```

**说明**：`stop` 只停止容器，不删除容器和网络。

### 3.4 docker compose start - 启动已停止的服务

```bash
# 启动所有已停止的服务
docker compose start

# 启动指定服务
docker compose start web db
```

**说明**：`start` 只启动已存在的容器，不创建新容器。

### 3.5 docker compose restart - 重启服务

```bash
# 重启所有服务
docker compose restart

# 重启指定服务
docker compose restart web

# 设置超时
docker compose restart -t 30
```

### 3.6 docker compose pause/unpause - 暂停/恢复

```bash
# 暂停所有服务
docker compose pause

# 恢复暂停的服务
docker compose unpause

# 暂停指定服务
docker compose pause web
```

---

## 4 查看命令

### 4.1 docker compose ps - 列出容器

**命令格式**：

```bash
docker compose ps [选项] [服务...]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-a, --all` | 显示所有容器（包括已停止的） |
| `-q, --quiet` | 只显示容器 ID |
| `--services` | 只显示服务名 |
| `--format` | 格式化输出 |
| `--status` | 按状态过滤 |

**实战示例**：

```bash
# 查看所有运行中的容器
docker compose ps

# 查看所有容器（包括已停止的）
docker compose ps -a

# 只显示容器 ID
docker compose ps -q

# 只显示服务名
docker compose ps --services

# 按状态过滤
docker compose ps --status running
docker compose ps --status exited

# 查看指定服务
docker compose ps web db

# 格式化输出
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

**输出示例**：

```
NAME          IMAGE          COMMAND                  SERVICE   CREATED         STATUS         PORTS
myapp-web-1   nginx:latest   "/docker-entrypoint.…"   web       2 minutes ago   Up 2 minutes   0.0.0.0:80->80/tcp
myapp-db-1    mysql:8.0      "docker-entrypoint.s…"   db        2 minutes ago   Up 2 minutes   3306/tcp, 33060/tcp
```

### 4.2 docker compose logs - 查看日志

**命令格式**：

```bash
docker compose logs [选项] [服务...]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-f, --follow` | 实时跟踪日志 |
| `--tail N` | 显示最后 N 行 |
| `-t, --timestamps` | 显示时间戳 |
| `--since` | 显示某个时间点之后的日志 |
| `--until` | 显示某个时间点之前的日志 |
| `--no-color` | 不使用颜色 |
| `--no-log-prefix` | 不显示日志前缀 |

**实战示例**：

```bash
# 查看所有服务日志
docker compose logs

# 实时跟踪所有日志
docker compose logs -f

# 查看指定服务日志
docker compose logs web

# 查看多个服务日志
docker compose logs web db

# 查看最后 50 行
docker compose logs --tail 50 web

# 显示时间戳
docker compose logs -t web

# 查看最近 1 小时
docker compose logs --since 1h web

# 组合使用
docker compose logs -f --tail 100 -t web db
```

**输出示例**：

```
myapp-web-1  | 172.18.0.1 - - [01/Jan/2024:10:00:00 +0000] "GET / HTTP/1.1" 200 612
myapp-db-1   | 2024-01-01T10:00:00.000000Z 0 [System] [MY-000114] Server hostname (id): 1
```

### 4.3 docker compose images - 列出镜像

```bash
# 列出所有服务使用的镜像
docker compose images
```

**输出示例**：

```
Container          Repository   Tag          Image Id      Size
myapp-web-1        nginx        latest       a1b2c3d4e5f6  142 MB
myapp-db-1         mysql        8.0          b2c3d4e5f6a7  512 MB
```

### 4.4 docker compose config - 验证配置

```bash
# 验证并查看解析后的 compose 文件
docker compose config

# 验证 compose 文件是否有效
docker compose config --quiet

# 查看服务定义
docker compose config --services

# 查看卷定义
docker compose config --volumes

# 输出为 JSON 格式
docker compose config --format json
```

**使用场景**：

- 验证 compose 文件语法
- 查看解析后的完整配置（包括默认值）
- 调试环境变量替换

---

## 5 Compose 文件基础语法

### 5.1 文件结构

```yaml
version: '3.8'  # Compose 文件版本（可选）

services:       # 服务定义（必需）
  service-name:
    # 服务配置
  
networks:       # 网络定义（可选）
  network-name:
  
volumes:        # 卷定义（可选）
  volume-name:
  
configs:        # 配置定义（可选）
  config-name:
  
secrets:        # 密钥定义（可选）
  secret-name:
```

### 5.2 services 配置

#### image - 指定镜像

```yaml
services:
  web:
    image: nginx:latest
```

#### build - 构建镜像

```yaml
services:
  web:
    build: .
    # 或指定详细配置
    build:
      context: ./dir
      dockerfile: Dockerfile
      args:
        NODE_VERSION: 18
```

#### ports - 端口映射

```yaml
services:
  web:
    ports:
      - "8080:80"           # 宿主机:容器
      - "8443:443"
      - "127.0.0.1:8080:80" # 绑定特定 IP
      - "8000-8010:8000-8010" # 端口范围
```

#### environment - 环境变量

```yaml
services:
  web:
    environment:
      - NODE_ENV=production
      - PORT=3000
    # 或使用字典格式
    environment:
      NODE_ENV: production
      PORT: 3000
```

#### env_file - 环境变量文件

```yaml
services:
  web:
    env_file:
      - .env
      - .env.production
```

#### volumes - 数据卷

```yaml
services:
  web:
    volumes:
      - /host/path:/container/path
      - named-volume:/data
      - ./relative:/app
```

#### depends_on - 依赖关系

```yaml
services:
  web:
    depends_on:
      - db
      - redis
  
  db:
    image: mysql:8.0
  
  redis:
    image: redis:alpine
```

**带健康检查的依赖**：

```yaml
services:
  web:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
  
  db:
    image: mysql:8.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

#### networks - 网络配置

```yaml
services:
  web:
    networks:
      - frontend
      - backend
  
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
```

#### restart - 重启策略

```yaml
services:
  web:
    restart: no           # 不自动重启（默认）
    # restart: on-failure # 失败时重启
    # restart: always     # 总是重启
    # restart: unless-stopped # 除非手动停止
```

#### command - 覆盖命令

```yaml
services:
  web:
    image: nginx
    command: nginx -g "daemon off;"
```

#### entrypoint - 覆盖入口点

```yaml
services:
  web:
    image: nginx
    entrypoint: /docker-entrypoint.sh
```

#### working_dir - 工作目录

```yaml
services:
  web:
    working_dir: /app
```

#### user - 用户

```yaml
services:
  web:
    user: "1000:1000"
```

### 5.3 完整示例

```yaml
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro
    depends_on:
      - app
    networks:
      - frontend
  
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - frontend
      - backend
  
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: myapp
    volumes:
      - db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend
  
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    networks:
      - backend

networks:
  frontend:
  backend:

volumes:
  db-data:
  redis-data:
```

---

## 6 环境变量

### 6.1 在 compose 文件中使用环境变量

```yaml
services:
  web:
    image: ${IMAGE_NAME}:${IMAGE_TAG}
    ports:
      - "${HOST_PORT}:80"
```

### 6.2 .env 文件

```bash
# .env
IMAGE_NAME=nginx
IMAGE_TAG=latest
HOST_PORT=8080
```

### 6.3 指定环境变量文件

```bash
# 使用默认 .env 文件
docker compose up

# 指定环境变量文件
docker compose --env-file .env.production up

# 在命令中传递环境变量
HOST_PORT=8080 docker compose up
```

### 6.4 变量优先级

1. 命令行中设置的变量（`--env-file`）
2. Shell 环境变量
3. `.env` 文件
4. compose 文件中的默认值

---

## 7 常用命令组合

### 7.1 完整开发流程

```bash
# 1. 验证配置
docker compose config

# 2. 构建镜像
docker compose build

# 3. 启动服务
docker compose up -d

# 4. 查看状态
docker compose ps

# 5. 查看日志
docker compose logs -f

# 6. 停止服务
docker compose stop

# 7. 重新启动
docker compose start

# 8. 完全清理
docker compose down -v
```

### 7.2 更新应用

```bash
# 1. 拉取最新镜像
docker compose pull

# 2. 重新创建容器
docker compose up -d --force-recreate

# 3. 清理未使用的镜像
docker image prune -f
```

### 7.3 扩缩容

```bash
# 扩容到 3 个 web 实例
docker compose up -d --scale web=3

# 查看状态
docker compose ps
```

---

## 8 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `docker compose up` | 创建并启动 | `docker compose up -d` |
| `docker compose down` | 停止并删除 | `docker compose down -v` |
| `docker compose start` | 启动已停止 | `docker compose start web` |
| `docker compose stop` | 停止服务 | `docker compose stop web` |
| `docker compose restart` | 重启服务 | `docker compose restart web` |
| `docker compose ps` | 列出容器 | `docker compose ps -a` |
| `docker compose logs` | 查看日志 | `docker compose logs -f web` |
| `docker compose images` | 列出镜像 | `docker compose images` |
| `docker compose config` | 验证配置 | `docker compose config` |
| `docker compose build` | 构建镜像 | `docker compose build web` |
| `docker compose pull` | 拉取镜像 | `docker compose pull` |

---

## 9 本章小结

本章系统讲解了 Docker Compose 的基础命令，包括：

**生命周期管理**：

- `up` 创建并启动服务
- `down` 停止并删除资源
- `start/stop/restart` 控制服务状态
- `pause/unpause` 暂停和恢复

**查看命令**：

- `ps` 列出容器
- `logs` 查看日志
- `images` 列出镜像
- `config` 验证配置

**Compose 文件**：

- 基本结构和语法
- 服务配置选项
- 环境变量管理
- 依赖关系和健康检查

掌握这些命令，你就能够使用 Docker Compose 管理多容器应用。下一章会讲解 Docker Compose 的高级命令和实战技巧。

---

## 10 练习题

1. 编写一个 docker-compose.yml 文件，包含 web、db、redis 三个服务
2. 使用 `docker compose up -d` 启动所有服务
3. 查看服务状态和日志
4. 停止并重启指定服务
5. 使用 `docker compose down -v` 完全清理环境
6. 配置环境变量，从 `.env` 文件读取配置
7. 设置服务依赖关系和健康检查
