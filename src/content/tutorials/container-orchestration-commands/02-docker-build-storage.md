---
title: '第2章：Docker 高级命令 - 构建与存储'
description: '掌握 Docker 镜像构建、数据持久化、存储管理的核心命令'
---

# 第2章：Docker 高级命令 - 构建与存储

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何从零构建自己的 Docker 镜像？
- Dockerfile 中的指令有哪些？
- 数据卷和挂载目录有什么区别？
- 如何管理容器的持久化数据？

这一章会系统讲解 Docker 构建镜像、数据持久化相关的所有命令，让你能够自定义镜像并管理容器数据。

---

## 1 镜像构建命令

### 1.1 docker build - 构建镜像

**命令格式**：

```bash
docker build [选项] <上下文路径>
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-t` | 指定镜像名称和标签（可多次使用） |
| `-f` | 指定 Dockerfile 路径（默认是上下文目录中的 Dockerfile） |
| `--build-arg` | 传递构建参数 |
| `--no-cache` | 不使用缓存，强制重新构建 |
| `--pull` | 总是尝试拉取基础镜像的最新版本 |
| `--rm` | 构建成功后删除中间容器（默认 true） |
| `--force-rm` | 构建失败时也删除中间容器 |
| `--target` | 指定构建到哪个阶段（多阶段构建） |
| `--platform` | 指定目标平台（如 linux/amd64、linux/arm64） |

**实战示例**：

```bash
# 最简单的构建（使用当前目录的 Dockerfile）
docker build -t my-app:latest .

# 指定 Dockerfile 路径
docker build -f docker/Dockerfile -t my-app:latest .

# 传递构建参数
docker build --build-arg NODE_VERSION=18 -t my-app:latest .

# 不使用缓存构建
docker build --no-cache -t my-app:latest .

# 多阶段构建 - 只构建到 builder 阶段
docker build --target builder -t my-app:builder .

# 指定平台构建
docker build --platform linux/amd64 -t my-app:latest .

# 同时打多个标签
docker build -t my-app:1.0 -t my-app:latest .
```

**输出示例**：

```
[+] Building 12.5s (8/8) FINISHED
 => [internal] load build definition from Dockerfile
 => [internal] load .dockerignore
 => [internal] load metadata for docker.io/library/node:18-alpine
 => [1/4] FROM docker.io/library/node:18-alpine
 => [2/4] COPY package*.json ./
 => [3/4] RUN npm install
 => [4/4] COPY . .
 => exporting to image
 => => naming to docker.io/library/my-app:latest
```

### 1.2 Dockerfile 指令详解

#### FROM - 指定基础镜像

```dockerfile
# 语法
FROM [--platform=<platform>] <image>[:<tag>] [AS <name>]

# 示例
FROM node:18-alpine
FROM --platform=linux/amd64 ubuntu:22.04 AS builder
```

#### RUN - 执行命令

```dockerfile
# Shell 格式（默认）
RUN npm install

# Exec 格式
RUN ["npm", "install"]

# 多行命令（使用反斜杠换行）
RUN apt-get update && \
    apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*
```

#### COPY 和 ADD - 复制文件

```dockerfile
# COPY - 简单复制
COPY package.json ./
COPY src/ /app/src/

# ADD - 支持 URL 和自动解压 tar
ADD https://example.com/file.tar.gz /tmp/
ADD archive.tar.gz /app/

# 区别：
# - COPY 只能复制本地文件
# - ADD 可以下载 URL 文件，自动解压 tar
# - 推荐使用 COPY，更明确
```

#### WORKDIR - 设置工作目录

```dockerfile
# 设置工作目录（后续命令在此目录执行）
WORKDIR /app

# 可以多次使用（相对路径基于前一个 WORKDIR）
WORKDIR /app
WORKDIR src
# 当前目录是 /app/src
```

#### ENV - 设置环境变量

```dockerfile
# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 在后续命令中可以使用
ENV NODE_ENV=production
RUN echo $NODE_ENV  # 输出 production
```

#### EXPOSE - 暴露端口

```dockerfile
# 声明容器监听的端口（仅作文档说明，不会自动映射）
EXPOSE 80
EXPOSE 8080/tcp
EXPOSE 8080/udp
```

#### VOLUME - 创建挂载点

```dockerfile
# 创建匿名卷
VOLUME /data
VOLUME ["/data", "/config"]
```

#### CMD 和 ENTRYPOINT - 容器启动命令

```dockerfile
# CMD - 容器启动时执行的默认命令（可被覆盖）
CMD ["node", "server.js"]
CMD npm start

# ENTRYPOINT - 容器启动时执行的入口命令（不容易被覆盖）
ENTRYPOINT ["node"]
CMD ["server.js"]

# 组合使用
# docker run my-app  -> node server.js
# docker run my-app app.js -> node app.js
```

#### ARG - 构建参数

```dockerfile
# 定义构建参数（只在构建时可用）
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine

# 构建时传递
# docker build --build-arg NODE_VERSION=20 -t my-app .
```

#### LABEL - 添加元数据

```dockerfile
LABEL maintainer="example@example.com"
LABEL version="1.0"
LABEL description="My application"
```

#### USER - 指定用户

```dockerfile
# 切换用户（后续命令以此用户执行）
USER node
USER 1000:1000
```

### 1.3 .dockerignore 文件

在构建上下文中创建 `.dockerignore` 文件，排除不需要发送到构建进程的文件：

```
# .dockerignore 示例
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
.env.*
```

### 1.4 docker tag - 给镜像打标签

**命令格式**：

```bash
docker tag <源镜像>[:<标签>] <目标镜像>[:<标签>]
```

**实战示例**：

```bash
# 给镜像打新标签
docker tag my-app:latest myregistry.com/my-app:1.0

# 打多个标签
docker tag my-app:latest my-app:1.0
docker tag my-app:latest my-app:stable
```

### 1.5 docker push - 推送镜像到仓库

**命令格式**：

```bash
docker push [选项] <镜像名>[:<标签>]
```

**实战示例**：

```bash
# 先登录到仓库
docker login registry.example.com

# 推送镜像
docker push myregistry.com/my-app:1.0

# 推送所有标签
docker push myregistry.com/my-app --all-tags
```

### 1.6 docker save 和 docker load - 镜像导入导出

**保存镜像到文件**：

```bash
# 保存单个镜像
docker save -o my-app.tar my-app:latest

# 保存多个镜像
docker save -o images.tar my-app:latest nginx:latest

# 压缩保存
docker save my-app:latest | gzip > my-app.tar.gz
```

**从文件加载镜像**：

```bash
# 从 tar 文件加载
docker load -i my-app.tar

# 从压缩文件加载
docker load < my-app.tar.gz
```

**使用场景**：

- 离线环境部署镜像
- 备份重要镜像
- 在不同环境间迁移镜像

---

## 2 数据持久化命令

### 2.1 docker volume - 数据卷管理

**命令格式**：

```bash
docker volume [子命令] [选项]
```

**子命令**：

| 子命令 | 说明 |
| --- | --- |
| `create` | 创建数据卷 |
| `ls` | 列出所有数据卷 |
| `inspect` | 查看数据卷详情 |
| `rm` | 删除数据卷 |
| `prune` | 删除未使用的数据卷 |

#### 创建数据卷

```bash
# 创建匿名卷（docker run 时自动创建）
docker run -v /data my-app

# 创建命名卷
docker volume create my-data

# 创建指定驱动的卷
docker volume create --driver local my-data

# 创建带标签的卷
docker volume create --label env=production my-data
```

#### 查看数据卷

```bash
# 列出所有数据卷
docker volume ls

# 只显示卷名
docker volume ls -q

# 过滤：只显示 dangling 卷
docker volume ls -f dangling=true

# 查看卷详情
docker volume inspect my-data
```

**输出示例**：

```json
[
  {
    "CreatedAt": "2024-01-01T00:00:00Z",
    "Driver": "local",
    "Labels": {},
    "Mountpoint": "/var/lib/docker/volumes/my-data/_data",
    "Name": "my-data",
    "Options": {},
    "Scope": "local"
  }
]
```

#### 删除数据卷

```bash
# 删除指定卷
docker volume rm my-data

# 强制删除（即使正在使用）
docker volume rm -f my-data

# 删除所有未使用的卷
docker volume prune

# 删除所有卷（慎用）
docker volume rm $(docker volume ls -q)
```

### 2.2 挂载数据卷到容器

**命名卷**：

```bash
# 使用命名卷（推荐）
docker run -v my-data:/data my-app

# 多个卷
docker run -v my-data:/data -v my-logs:/logs my-app
```

**绑定挂载**：

```bash
# 挂载宿主机目录（绝对路径）
docker run -v /host/path:/container/path my-app

# 相对路径（基于 docker run 的当前目录）
docker run -v ./data:/data my-app

# 只读挂载
docker run -v /host/path:/container/path:ro my-app
```

**挂载单个文件**：

```bash
# 挂载单个文件
docker run -v /host/config.json:/app/config.json my-app
```

**使用 --mount 语法（更明确）**：

```bash
# 命名卷
docker run --mount source=my-data,target=/data my-app

# 绑定挂载
docker run --mount type=bind,source=/host/path,target=/container/path my-app

# 只读
docker run --mount type=bind,source=/host/path,target=/container/path,readonly my-app

# 指定卷选项
docker run --mount source=my-data,target=/data,volume-opt=type=nfs my-app
```

### 2.3 tmpfs 挂载（仅 Linux）

```bash
# 使用 tmpfs 挂载（内存中，不持久化）
docker run --tmpfs /tmp my-app

# 指定大小
docker run --tmpfs /tmp:size=100m my-app

# 使用 --mount 语法
docker run --mount type=tmpfs,target=/app/tmp,tmpfs-size=100m my-app
```

### 2.4 数据持久化最佳实践

**场景 1：数据库数据持久化**

```bash
# 创建命名卷
docker volume create mysql-data

# 挂载到 MySQL 容器
docker run -d \
  --name mysql \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0
```

**场景 2：应用日志持久化**

```bash
# 挂载日志目录
docker run -d \
  --name my-app \
  -v app-logs:/app/logs \
  -v /host/logs:/app/external-logs \
  my-app
```

**场景 3：配置文件挂载**

```bash
# 挂载配置文件
docker run -d \
  --name nginx \
  -v /host/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /host/html:/usr/share/nginx/html:ro \
  nginx:latest
```

**场景 4：开发环境热重载**

```bash
# 挂载源代码目录（代码修改实时同步）
docker run -d \
  --name dev-app \
  -v ./src:/app/src \
  -v ./node_modules:/app/node_modules \
  -p 3000:3000 \
  node:18-alpine \
  npm run dev
```

---

## 3 构建缓存管理

### 3.1 理解构建缓存

Docker 构建时会缓存每一层，后续构建如果某层没变化，会直接使用缓存。

**缓存失效条件**：

- Dockerfile 中的指令发生变化
- COPY/ADD 的文件内容发生变化
- 使用了 `--no-cache` 选项

### 3.2 优化缓存策略

**Dockerfile 顺序很重要**：

```dockerfile
# 好的实践 - 把不常变化的放前面
FROM node:18-alpine

WORKDIR /app

# 先复制依赖文件（不常变化）
COPY package*.json ./
RUN npm ci --only=production

# 再复制源代码（经常变化）
COPY . .

CMD ["node", "server.js"]
```

**坏的实践**：

```dockerfile
# 不推荐 - 每次代码变化都会重新安装依赖
FROM node:18-alpine

WORKDIR /app

COPY . .
RUN npm install

CMD ["node", "server.js"]
```

### 3.3 多阶段构建

**示例**：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段（只包含必要文件）
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

**构建时指定阶段**：

```bash
# 只构建到 builder 阶段（用于测试）
docker build --target builder -t my-app:builder .

# 完整构建
docker build -t my-app:latest .
```

### 3.4 BuildKit 高级功能

**启用 BuildKit**：

```bash
# 临时启用
DOCKER_BUILDKIT=1 docker build -t my-app .

# 永久启用（在 daemon.json 中配置）
{
  "features": {
    "buildkit": true
  }
}
```

**使用 BuildKit 特性**：

```dockerfile
# syntax=docker/dockerfile:1

# 挂载缓存目录
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 秘密文件挂载
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) npm install
```

---

## 4 常用命令组合

### 4.1 完整构建流程

```bash
# 1. 清理旧镜像
docker rmi my-app:latest

# 2. 不使用缓存构建
docker build --no-cache -t my-app:latest .

# 3. 打标签
docker tag my-app:latest myregistry.com/my-app:1.0

# 4. 推送到仓库
docker push myregistry.com/my-app:1.0
```

### 4.2 数据备份与恢复

**备份**：

```bash
# 备份数据卷到宿主机
docker run --rm \
  -v my-data:/data \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/backup.tar.gz -C /data .
```

**恢复**：

```bash
# 从备份恢复数据卷
docker run --rm \
  -v my-data:/data \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/backup.tar.gz -C /data
```

### 4.3 查看容器挂载信息

```bash
# 查看容器挂载的卷
docker inspect -f '{{range .Mounts}}{{.Name}} -> {{.Destination}}{{"\n"}}{{end}}' my-app
```

---

## 5 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `docker build` | 构建镜像 | `docker build -t my-app:latest .` |
| `docker tag` | 打标签 | `docker tag my-app:latest myregistry/my-app:1.0` |
| `docker push` | 推送镜像 | `docker push myregistry/my-app:1.0` |
| `docker save` | 保存镜像 | `docker save -o my-app.tar my-app:latest` |
| `docker load` | 加载镜像 | `docker load -i my-app.tar` |
| `docker volume create` | 创建卷 | `docker volume create my-data` |
| `docker volume ls` | 列出卷 | `docker volume ls` |
| `docker volume rm` | 删除卷 | `docker volume rm my-data` |
| `docker volume prune` | 清理未用卷 | `docker volume prune` |

---

## 6 本章小结

本章系统讲解了 Docker 构建和存储相关的命令，包括：

**镜像构建**：

- `docker build` 构建镜像
- Dockerfile 核心指令详解
- `.dockerignore` 排除文件
- 多阶段构建优化镜像大小

**数据持久化**：

- `docker volume` 数据卷管理
- 命名卷 vs 绑定挂载
- `tmpfs` 挂载
- 数据备份与恢复

**构建优化**：

- 构建缓存机制
- Dockerfile 顺序优化
- BuildKit 高级特性

掌握这些命令，你就能够自定义构建镜像，并管理容器的持久化数据。下一章会讲解 Docker 网络和调试相关的命令。

---

## 7 练习题

1. 编写一个 Dockerfile，构建一个 Node.js 应用镜像
2. 使用多阶段构建，优化镜像大小
3. 创建命名卷，挂载到 MySQL 容器，验证数据持久化
4. 绑定挂载宿主机目录到 Nginx 容器，实现静态文件热更新
5. 备份数据卷到宿主机，然后恢复到新卷中
