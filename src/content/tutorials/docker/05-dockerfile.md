---
title: "第5章：Dockerfile 详解"
description: "Dockerfile 语法、指令详解、构建镜像"
---

# 第5章：Dockerfile 详解

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Dockerfile？它和 docker commit 有什么区别？
- Dockerfile 的指令有哪些？每条指令是什么意思？
- 如何编写一个高效的 Dockerfile？
- 构建镜像时发生了什么？

这一章会彻底搞懂 Dockerfile，学会用代码定义镜像。这是 Docker 最核心的技能之一。

---

## 5.1 为什么需要 Dockerfile？

### 痛点分析

前面我们学了用 `docker commit` 创建镜像，但这种方式有明显的问题：

- **不可重复**：手动操作的步骤无法记录，别人无法复现
- **不可追溯**：不知道镜像里装了什么，怎么装的
- **不可维护**：修改镜像需要重新手动操作

### 解决方案

Dockerfile 是一个文本文件，包含了构建镜像所需的所有指令。

打个比方：

> `docker commit` 就像你跟着菜谱做了一道菜，但没记下步骤。下次想做同样的菜，只能凭感觉。
>
> Dockerfile 就像一份详细的菜谱，任何人都能按照它做出同样的菜。

### 对比

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| docker commit | 快速、直观 | 不可重复、不可维护 |
| Dockerfile | 可重复、可追溯、可维护 | 需要学习语法 |

---

## 5.2 Dockerfile 基础语法

### 基本结构

```dockerfile
# 这是一个注释
FROM ubuntu:22.04

# 设置维护者信息
LABEL maintainer="your@email.com"

# 设置环境变量
ENV APP_HOME=/app

# 设置工作目录
WORKDIR $APP_HOME

# 复制文件
COPY package.json .

# 运行命令
RUN npm install

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "app.js"]
```

### 指令分类

Dockerfile 指令分为两类：

| 类型 | 指令 | 说明 |
| --- | --- | --- |
| 构建指令 | FROM、RUN、COPY 等 | 构建镜像时执行，结果会保存到镜像 |
| 运行指令 | CMD、ENTRYPOINT | 容器启动时执行，不会保存到镜像 |

---

## 5.3 核心指令详解

### FROM：指定基础镜像

```dockerfile
# ❶ 使用官方 Ubuntu 镜像
FROM ubuntu:22.04

# ❷ 使用 Alpine（精简版，推荐）
FROM node:18-alpine

# ❸ 多阶段构建
FROM node:18 AS builder
# ... 构建代码
FROM nginx:alpine
# ... 复制构建结果
```

> 建议：优先使用 `alpine` 版本，镜像更小。

### RUN：执行命令

```dockerfile
# ❶ Shell 格式（推荐，可读性好）
RUN apt-get update && apt-get install -y nginx

# ❷ Exec 格式
RUN ["apt-get", "install", "-y", "nginx"]

# ❸ 多行命令（用反斜杠换行）
RUN apt-get update && \
    apt-get install -y \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*
```

> 注意：每条 RUN 指令都会创建一个新的镜像层。尽量合并多个命令到一个 RUN。

### COPY 和 ADD：复制文件

```dockerfile
# ❶ COPY：复制本地文件到镜像
COPY package.json /app/
COPY . /app/

# ❷ ADD：功能更强，支持 URL 和解压
ADD https://example.com/file.tar.gz /tmp/
ADD archive.tar.gz /app/  # 会自动解压

# ❸ 推荐使用 COPY，除非需要自动解压
COPY requirements.txt /app/
```

| 指令 | 支持 URL | 自动解压 | 推荐度 |
| --- | --- | --- | --- |
| COPY | 否 | 否 | 推荐 |
| ADD | 是 | 是 | 特殊场景使用 |

### WORKDIR：设置工作目录

```dockerfile
# ❶ 设置工作目录
WORKDIR /app

# ❷ 后续命令都会在这个目录下执行
COPY package.json .
RUN npm install

# ❸ 可以使用环境变量
ENV APP_HOME=/app
WORKDIR $APP_HOME
```

> 建议：总是使用 WORKDIR，不要用 `RUN cd /app && ...`。

### ENV：设置环境变量

```dockerfile
# ❶ 设置单个环境变量
ENV NODE_ENV=production

# ❷ 设置多个环境变量
ENV NODE_ENV=production \
    PORT=3000

# ❸ 在后续指令中使用
ENV APP_HOME=/app
WORKDIR $APP_HOME
```

### EXPOSE：声明端口

```dockerfile
# ❶ 声明容器运行时监听的端口
EXPOSE 3000

# ❷ 声明多个端口
EXPOSE 3000 8080

# ❸ 声明 UDP 端口
EXPOSE 53/udp
```

> 注意：EXPOSE 只是声明，不会自动映射端口。运行时还需要 `-p` 参数。

### CMD 和 ENTRYPOINT：启动命令

```dockerfile
# ❶ CMD：容器启动时执行的默认命令
CMD ["node", "app.js"]

# ❷ ENTRYPOINT：容器启动时执行的入口命令
ENTRYPOINT ["node"]

# ❸ 组合使用
ENTRYPOINT ["node"]
CMD ["app.js"]
# 运行时可以覆盖 CMD：docker run image server.js
```

| 指令 | 可被覆盖 | 用途 |
| --- | --- | --- |
| CMD | 是 | 默认命令，可被覆盖 |
| ENTRYPOINT | 否（需用 --entrypoint） | 固定命令，不易被覆盖 |

### 其他常用指令

```dockerfile
# ❶ ARG：构建时变量（只在构建时有效）
ARG VERSION=1.0
FROM node:${VERSION}

# ❷ VOLUME：声明匿名卷
VOLUME ["/data"]

# ❸ USER：指定运行用户
USER node

# ❹ LABEL：添加元数据
LABEL version="1.0" description="My app"

# ❺ STOPSIGNAL：设置停止信号
STOPSIGNAL SIGTERM

# ❻ HEALTHCHECK：健康检查
HEALTHCHECK --interval=30s CMD curl -f http://localhost/ || exit 1
```

---

## 5.4 构建镜像

### 基础构建

```bash
# ❶ 构建镜像
docker build -t myapp:v1 .

# ❷ 指定 Dockerfile 路径
docker build -t myapp:v1 -f docker/Dockerfile .

# ❸ 不使用缓存
docker build --no-cache -t myapp:v1 .

# ❹ 构建时传递参数
docker build --build-arg VERSION=1.0 -t myapp:v1 .
```

### 构建上下文

```bash
# ❶ 构建上下文是当前目录
docker build -t myapp .

# ❷ 构建上下文是指定目录
docker build -t myapp /path/to/context
```

> 注意：构建上下文会发送给 Docker daemon，避免在上下文中有大文件（如 node_modules）。

### .dockerignore 文件

```bash
# 创建 .dockerignore 文件，排除不需要的文件
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
```

---

## 5.5 多阶段构建

### 为什么需要多阶段构建？

单阶段构建的问题：

- 构建工具和依赖都会被打包到最终镜像
- 镜像体积大
- 安全风险（包含不必要的工具）

### 多阶段构建示例

```dockerfile
# ❶ 第一阶段：构建
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ❷ 第二阶段：运行
FROM nginx:alpine

# 只复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 好处

| 方面 | 单阶段 | 多阶段 |
| --- | --- | --- |
| 镜像大小 | 大（包含构建工具） | 小（只有运行依赖） |
| 安全性 | 低（包含不必要工具） | 高（最小化攻击面） |
| 构建速度 | 快 | 稍慢（但可缓存） |

---

## 5.6 最佳实践

### 1. 使用小镜像

```dockerfile
# 推荐
FROM node:18-alpine

# 不推荐
FROM node:18
```

### 2. 合并 RUN 指令

```dockerfile
# 推荐
RUN apt-get update && \
    apt-get install -y nginx curl && \
    rm -rf /var/lib/apt/lists/*

# 不推荐
RUN apt-get update
RUN apt-get install -y nginx
RUN apt-get install -y curl
```

### 3. 利用缓存

```dockerfile
# 推荐：先复制依赖文件，利用缓存
COPY package.json .
RUN npm install
COPY . .

# 不推荐：每次都重新安装依赖
COPY . .
RUN npm install
```

### 4. 不要以 root 运行

```dockerfile
# 创建用户
RUN adduser -D appuser
USER appuser
```

### 5. 使用 .dockerignore

排除不必要的文件，减小构建上下文。

---

## 5.7 核心知识点总结

| 指令 | 说明 | 示例 |
| --- | --- | --- |
| FROM | 指定基础镜像 | `FROM node:18-alpine` |
| RUN | 执行命令 | `RUN npm install` |
| COPY | 复制文件 | `COPY . /app` |
| ADD | 复制文件（支持 URL） | `ADD file.tar.gz /app` |
| WORKDIR | 设置工作目录 | `WORKDIR /app` |
| ENV | 设置环境变量 | `ENV NODE_ENV=production` |
| EXPOSE | 声明端口 | `EXPOSE 3000` |
| CMD | 启动命令 | `CMD ["node", "app.js"]` |
| ENTRYPOINT | 入口命令 | `ENTRYPOINT ["node"]` |
| ARG | 构建时变量 | `ARG VERSION=1.0` |

---

## 5.8 新手常见误区

### 误区 1："EXPOSE 会自动映射端口"

**错！** EXPOSE 只是声明，不会自动映射。运行时还需要 `-p` 参数。

### 误区 2："CMD 和 ENTRYPOINT 是一样的"

不是的。CMD 是默认命令，可以被覆盖；ENTRYPOINT 是入口命令，不易被覆盖。

### 误区 3："每条 RUN 指令都应该单独写"

不是的。每条 RUN 都会创建新层，应该合并多个命令到一个 RUN，减少层数。

### 误区 4："Dockerfile 越简单越好"

不是的。应该考虑镜像大小、安全性、构建速度。使用多阶段构建、alpine 镜像等优化。

---

## 5.9 动手练习

### 练习 1：编写 Node.js 应用的 Dockerfile

为一个简单的 Node.js 应用编写 Dockerfile。

<details>
<summary>点击查看答案</summary>

```dockerfile
# 使用 Node.js Alpine 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production

# 声明端口
EXPOSE 3000

# 启动命令
CMD ["node", "app.js"]
```

构建并运行：

```bash
docker build -t my-node-app .
docker run -d -p 3000:3000 my-node-app
```

</details>

### 练习 2：多阶段构建

为一个前端项目编写多阶段构建的 Dockerfile。

<details>
<summary>点击查看答案</summary>

```dockerfile
# 第一阶段：构建
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 第二阶段：运行
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建并运行：

```bash
docker build -t my-frontend .
docker run -d -p 8080:80 my-frontend
```

</details>

### 练习 3（挑战）：优化 Dockerfile

优化一个现有的 Dockerfile，减小镜像大小。

<details>
<summary>点击查看答案</summary>

优化前：

```dockerfile
FROM ubuntu:22.04
RUN apt-get update
RUN apt-get install -y nodejs npm
COPY . /app
WORKDIR /app
RUN npm install
CMD ["node", "app.js"]
```

优化后：

```dockerfile
# 使用 Alpine 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件（利用缓存）
COPY package*.json ./

# 安装依赖（合并命令，清理缓存）
RUN npm ci --only=production && \
    npm cache clean --force

# 复制应用代码
COPY . .

# 使用非 root 用户
USER node

# 声明端口
EXPOSE 3000

# 启动命令
CMD ["node", "app.js"]
```

优化点：
1. 使用 Alpine 镜像（更小）
2. 合并 RUN 指令
3. 利用缓存（先复制 package.json）
4. 使用非 root 用户
5. 清理 npm 缓存

</details>

---

## 下一章预告

下一章我们会学习 **数据持久化**——如何让容器的数据不丢失。你会学到数据卷、挂载目录等概念，让容器也能持久化存储数据。
