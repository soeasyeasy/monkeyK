---
title: '第5章：Docker Compose 高级命令与实战'
description: '掌握 Docker Compose 高级命令、多环境部署、依赖管理等实战技巧'
---

# 第5章：Docker Compose 高级命令与实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何在容器中执行命令？
- 如何一次性运行任务？
- 如何管理多环境部署？
- 如何实现滚动更新？

这一章会系统讲解 Docker Compose 的高级命令和实战技巧，让你能够灵活应对各种场景。

---

## 1 操作命令

### 1.1 docker compose exec - 在服务中执行命令

**命令格式**：

```bash
docker compose exec [选项] <服务名> <命令> [参数...]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-d, --detach` | 后台执行 |
| `-e` | 设置环境变量 |
| `-u, --user` | 指定用户 |
| `-w, --workdir` | 设置工作目录 |
| `-T` | 禁用伪终端（用于脚本） |
| `--index` | 指定实例索引（多实例时） |
| `--privileged` | 授予特权 |

**实战示例**：

```bash
# 进入交互式 shell
docker compose exec web /bin/bash

# 执行单个命令
docker compose exec web ls /app

# 查看进程
docker compose exec web ps aux

# 查看环境变量
docker compose exec web env

# 以指定用户执行
docker compose exec -u root web whoami

# 设置工作目录
docker compose exec -w /tmp web pwd

# 后台执行
docker compose exec -d web touch /tmp/test.txt

# 多实例时指定索引
docker compose exec --index 1 web cat /etc/hostname

# 禁用伪终端（用于脚本）
docker compose exec -T web npm test
```

**与 docker exec 的区别**：

```bash
# docker exec 需要指定容器名
docker exec -it myapp-web-1 /bin/bash

# docker compose exec 只需要服务名
docker compose exec web /bin/bash
```

### 1.2 docker compose run - 一次性运行服务

**命令格式**：

```bash
docker compose run [选项] <服务名> [命令] [参数...]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-d, --detach` | 后台运行 |
| `--rm` | 运行后自动删除容器 |
| `--no-deps` | 不启动依赖服务 |
| `--service-ports` | 映射服务端口 |
| `--publish, -p` | 发布端口 |
| `--entrypoint` | 覆盖入口点 |
| `-e` | 设置环境变量 |
| `-u, --user` | 指定用户 |
| `-w, --workdir` | 设置工作目录 |
| `-v, --volume` | 挂载卷 |
| `-T` | 禁用伪终端 |

**实战示例**：

```bash
# 运行一次性任务（如数据库迁移）
docker compose run --rm web npm run migrate

# 运行测试
docker compose run --rm web npm test

# 覆盖命令
docker compose run --rm web echo "Hello"

# 后台运行
docker compose run -d --rm web npm start

# 不启动依赖服务
docker compose run --no-deps --rm web npm test

# 映射端口
docker compose run --rm --service-ports web

# 发布指定端口
docker compose run --rm -p 8080:80 web

# 覆盖入口点
docker compose run --rm --entrypoint /bin/bash web

# 设置环境变量
docker compose run --rm -e NODE_ENV=test web npm test

# 挂载卷
docker compose run --rm -v ./test-results:/app/results web npm test

# 以指定用户运行
docker compose run --rm -u root web whoami
```

**与 exec 的区别**：

```bash
# exec 在已运行的容器中执行
docker compose exec web npm test

# run 创建新容器运行（不影响现有容器）
docker compose run --rm web npm test
```

**使用场景**：

- 运行一次性任务（数据库迁移、数据导入）
- 运行测试（不影响开发环境）
- 调试（以不同配置启动）

### 1.3 docker compose cp - 复制文件

**命令格式**：

```bash
docker compose cp [选项] <服务名>:<容器路径> <宿主机路径>
docker compose cp [选项] <宿主机路径> <服务名>:<容器路径>
```

**实战示例**：

```bash
# 从容器复制到宿主机
docker compose cp web:/app/config.json ./config.json

# 从宿主机复制到容器
docker compose cp ./config.json web:/app/config.json

# 复制目录
docker compose cp web:/app/logs ./logs

# 复制多个实例时指定索引
docker compose cp --index 1 web:/app/data ./data
```

---

## 2 构建与镜像命令

### 2.1 docker compose build - 构建镜像

**命令格式**：

```bash
docker compose build [选项] [服务...]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `--build-arg` | 传递构建参数 |
| `--no-cache` | 不使用缓存 |
| `--pull` | 总是拉取最新基础镜像 |
| `--quiet, -q` | 安静模式 |
| `--progress` | 设置输出类型（auto/tty/plain） |

**实战示例**：

```bash
# 构建所有服务
docker compose build

# 构建指定服务
docker compose build web

# 构建多个服务
docker compose build web api

# 传递构建参数
docker compose build --build-arg NODE_VERSION=18 web

# 不使用缓存
docker compose build --no-cache web

# 拉取最新基础镜像
docker compose build --pull web

# 组合使用
docker compose build --no-cache --pull --build-arg NODE_VERSION=18 web
```

### 2.2 docker compose pull - 拉取镜像

```bash
# 拉取所有服务镜像
docker compose pull

# 拉取指定服务
docker compose pull web

# 拉取多个服务
docker compose pull web db
```

### 2.3 docker compose push - 推送镜像

```bash
# 推送所有服务镜像
docker compose push

# 推送指定服务
docker compose push web
```

**说明**：需要在 compose 文件中配置镜像仓库地址。

```yaml
services:
  web:
    image: registry.example.com/myapp:latest
    build: .
```

### 2.4 docker compose create - 创建容器

```bash
# 创建所有服务容器（不启动）
docker compose create

# 创建指定服务
docker compose create web

# 强制重新创建
docker compose create --force-recreate web
```

---

## 3 多环境部署

### 3.1 使用多个 compose 文件

**目录结构**：

```
project/
├── docker-compose.yml          # 基础配置
├── docker-compose.dev.yml      # 开发环境
├── docker-compose.prod.yml     # 生产环境
└── docker-compose.override.yml # 本地覆盖（自动加载）
```

**使用方式**：

```bash
# 使用多个文件
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 简写
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**示例**：

```yaml
# docker-compose.yml（基础配置）
version: '3.8'
services:
  web:
    image: myapp:latest
    ports:
      - "80:80"
```

```yaml
# docker-compose.dev.yml（开发环境）
version: '3.8'
services:
  web:
    build: .
    volumes:
      - ./src:/app/src
    environment:
      - NODE_ENV=development
```

```yaml
# docker-compose.prod.yml（生产环境）
version: '3.8'
services:
  web:
    image: myapp:1.0.0
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
```

### 3.2 使用 Profile

```yaml
version: '3.8'
services:
  web:
    image: myapp
  
  db:
    image: mysql
  
  # 只在开发环境启用
  phpmyadmin:
    image: phpmyadmin
    profiles:
      - dev
  
  # 只在测试环境启用
  test-runner:
    image: test-runner
    profiles:
      - test
  
  # 多个 profile
  debug-tools:
    image: debug-tools
    profiles:
      - dev
      - test
```

**使用方式**：

```bash
# 只启动基础服务
docker compose up -d

# 启动开发环境
docker compose --profile dev up -d

# 启动测试环境
docker compose --profile test up -d

# 启动多个 profile
docker compose --profile dev --profile test up -d
```

### 3.3 使用环境变量

**目录结构**：

```
project/
├── docker-compose.yml
├── .env.dev
├── .env.prod
└── .env.staging
```

**使用方式**：

```bash
# 指定环境变量文件
docker compose --env-file .env.dev up -d
docker compose --env-file .env.prod up -d
```

---

## 4 依赖管理与健康检查

### 4.1 depends_on 基础用法

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

**说明**：默认只等待容器启动，不等待服务就绪。

### 4.2 带条件依赖

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
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
  
  redis:
    image: redis:alpine
```

**条件类型**：

| 条件 | 说明 |
| --- | --- |
| `service_started` | 容器启动后（默认） |
| `service_healthy` | 健康检查通过后 |
| `service_completed_successfully` | 一次性任务成功完成后 |

### 4.3 健康检查配置

```yaml
services:
  web:
    image: myapp
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s      # 检查间隔
      timeout: 10s       # 超时时间
      retries: 3         # 重试次数
      start_period: 40s  # 启动宽限期
```

**查看健康状态**：

```bash
# 查看容器健康状态
docker compose ps

# 查看详细信息
docker inspect --format='{{.State.Health.Status}}' myapp-web-1
```

---

## 5 滚动更新与回滚

### 5.1 滚动更新

```bash
# 1. 拉取最新镜像
docker compose pull web

# 2. 重新创建容器（不中断其他服务）
docker compose up -d --no-deps --build web

# 3. 清理未使用的镜像
docker image prune -f
```

### 5.2 回滚

```bash
# 1. 指定旧版本镜像
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps web

# 或修改 compose 文件中的镜像版本
# image: myapp:0.9.0

# 2. 重新创建容器
docker compose up -d --no-deps web
```

---

## 6 高级配置

### 6.1 资源限制

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 6.2 日志配置

```yaml
services:
  web:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

### 6.3 安全配置

```yaml
services:
  web:
    read_only: true           # 只读文件系统
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp
      - /run
```

### 6.4 网络高级配置

```yaml
services:
  web:
    networks:
      frontend:
        ipv4_address: 192.168.1.100
    dns:
      - 8.8.8.8
      - 8.8.4.4
    extra_hosts:
      - "somehost:192.168.1.100"
```

---

## 7 常用命令组合

### 7.1 完整部署流程

```bash
# 1. 验证配置
docker compose config

# 2. 拉取最新镜像
docker compose pull

# 3. 构建镜像
docker compose build

# 4. 启动服务
docker compose up -d

# 5. 等待健康检查
docker compose ps

# 6. 查看日志
docker compose logs -f

# 7. 测试应用
curl http://localhost
```

### 7.2 更新流程

```bash
# 1. 备份数据（如果有数据卷）
docker run --rm -v myapp_db-data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz -C /data .

# 2. 拉取最新镜像
docker compose pull

# 3. 重新创建容器
docker compose up -d --force-recreate

# 4. 清理未使用资源
docker compose down --rmi all --volumes --remove-orphans
```

### 7.3 调试流程

```bash
# 1. 查看服务状态
docker compose ps

# 2. 查看日志
docker compose logs -f web

# 3. 进入容器
docker compose exec web /bin/bash

# 4. 在容器中执行命令
docker compose exec web curl http://localhost:3000/health

# 5. 查看资源占用
docker compose top
```

---

## 8 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `docker compose exec` | 执行命令 | `docker compose exec web bash` |
| `docker compose run` | 一次性运行 | `docker compose run --rm web npm test` |
| `docker compose cp` | 复制文件 | `docker compose cp web:/app/file ./file` |
| `docker compose build` | 构建镜像 | `docker compose build --no-cache web` |
| `docker compose pull` | 拉取镜像 | `docker compose pull web` |
| `docker compose push` | 推送镜像 | `docker compose push web` |
| `docker compose create` | 创建容器 | `docker compose create web` |

---

## 9 本章小结

本章系统讲解了 Docker Compose 的高级命令和实战技巧，包括：

**操作命令**：
