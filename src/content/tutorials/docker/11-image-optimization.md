---
title: "第11章：镜像优化与最佳实践"
description: "多阶段构建、镜像瘦身、层缓存优化"
---

# 第11章：镜像优化与最佳实践

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么我的 Docker 镜像这么大？
- 如何减小镜像体积？
- 如何加快镜像构建速度？
- 有什么镜像优化的最佳实践？

这一章会教你镜像优化的各种技巧。优化后的镜像更小、更快、更安全，适合生产环境使用。

---

## 11.1 为什么需要优化镜像？

### 痛点分析

不优化的镜像会带来这些问题：

- **镜像体积大**：几百 MB 甚至几 GB，下载慢、占用磁盘多
- **构建速度慢**：每次构建都要重新安装所有依赖
- **启动速度慢**：镜像大，容器启动慢
- **安全隐患**：包含不必要的工具和库，攻击面大

### 解决方案

通过优化，你可以：

- 减小镜像体积（从 GB 级降到 MB 级）
- 加快构建速度（利用缓存）
- 提高安全性（最小化攻击面）

打个比方：

> 不优化的镜像就像搬家时把所有东西都打包，包括几年没穿的衣服。
>
> 优化的镜像就像精简行李，只带必需品，轻装上阵。

---

## 11.2 选择合适的基础镜像

### 镜像大小对比

```bash
# 不同 Node.js 基础镜像的大小
docker images | grep node

# node:18              约 1GB
# node:18-bullseye     约 800MB
# node:18-buster       约 700MB
# node:18-alpine       约 120MB
# node:18-slim         约 150MB
```

### 推荐使用 Alpine

```dockerfile
# 推荐：使用 Alpine 版本
FROM node:18-alpine

# 或者使用 slim 版本（如果需要 glibc）
FROM node:18-slim

# 不推荐：使用完整版本
FROM node:18
```

### 其他语言的推荐镜像

| 语言 | 推荐镜像 | 大小 |
| --- | --- | --- |
| Node.js | `node:18-alpine` | ~120MB |
| Python | `python:3.11-alpine` | ~50MB |
| Java | `eclipse-temurin:17-jre-alpine` | ~200MB |
| Go | `golang:1.21-alpine` | ~250MB |
| Ruby | `ruby:3.2-alpine` | ~100MB |

---

## 11.3 多阶段构建

### 问题：单阶段构建

```dockerfile
# 单阶段构建的问题
FROM node:18-alpine

WORKDIR /app

# ❶ 复制所有文件
COPY . .

# ❷ 安装所有依赖（包括开发依赖）
RUN npm install

# ❸ 构建
RUN npm run build

# 问题：构建工具、开发依赖都在最终镜像中
# 镜像体积大，安全隐患多
```

### 解决方案：多阶段构建

```dockerfile
# 第一阶段：构建
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件（利用缓存）
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 第二阶段：运行
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production

# 只复制构建产物
COPY --from=builder /app/dist ./dist

# 设置环境变量
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 效果对比

| 方式 | 镜像大小 | 安全性 |
| --- | --- | --- |
| 单阶段 | ~500MB | 低（包含构建工具） |
| 多阶段 | ~150MB | 高（只有运行依赖） |

---

## 11.4 优化层缓存

### 问题：缓存失效

```dockerfile
# 不推荐的写法
FROM node:18-alpine

WORKDIR /app

# ❶ 复制所有文件
COPY . .

# ❷ 安装依赖
RUN npm install

# 问题：只要代码有变化，npm install 就会重新执行
# 因为 COPY . . 导致缓存失效
```

### 解决方案：分离依赖和代码

```dockerfile
FROM node:18-alpine

WORKDIR /app

# ❶ 先复制 package 文件
COPY package*.json ./

# ❷ 安装依赖（这层会被缓存）
RUN npm ci

# ❸ 再复制源代码
COPY . .

# 好处：只要 package.json 没变，npm ci 就会使用缓存
# 大大加快构建速度
```

### 缓存原理

```
构建过程：
1. FROM node:18-alpine        ← 缓存命中
2. WORKDIR /app               ← 缓存命中
3. COPY package*.json ./      ← 缓存命中（package.json 没变）
4. RUN npm ci                 ← 缓存命中（跳过安装）
5. COPY . .                   ← 缓存失效（代码变了）
6. CMD ["node", "app.js"]     ← 重新执行
```

---

## 11.5 合并 RUN 指令

### 问题：多层镜像

```dockerfile
# 不推荐：每条 RUN 创建一层
RUN apt-get update
RUN apt-get install -y nginx
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

### 解决方案：合并命令

```dockerfile
# 推荐：合并到一个 RUN
RUN apt-get update && \
    apt-get install -y nginx curl && \
    rm -rf /var/lib/apt/lists/*
```

### 效果对比

| 方式 | 层数 | 镜像大小 |
| --- | --- | --- |
| 分开写 | 4 层 | 更大（中间文件） |
| 合并写 | 1 层 | 更小 |

---

## 11.6 清理临时文件

### 清理包管理器缓存

```dockerfile
# Alpine (apk)
RUN apk add --no-cache nginx curl

# 或者
RUN apk add nginx curl && \
    rm -rf /var/cache/apk/*

# Debian/Ubuntu (apt)
RUN apt-get update && \
    apt-get install -y nginx curl && \
    rm -rf /var/lib/apt/lists/*

# CentOS/RHEL (yum)
RUN yum install -y nginx && \
    yum clean all
```

### 清理构建文件

```dockerfile
# Python
RUN pip install --no-cache-dir -r requirements.txt

# Node.js
RUN npm ci && \
    npm cache clean --force

# Java
RUN mvn package && \
    rm -rf ~/.m2
```

---

## 11.7 使用 .dockerignore

### 问题：构建上下文过大

```bash
# 构建时会把整个目录发送给 Docker daemon
# 如果包含 node_modules、.git 等，会非常慢
```

### 解决方案：.dockerignore

```bash
# .dockerignore 文件
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
.env.*
*.md
tests
__tests__
coverage
.nyc_output
.vscode
.idea
*.log
dist
build
```

### 效果

| 场景 | 构建上下文大小 | 构建时间 |
| --- | --- | --- |
| 无 .dockerignore | ~500MB | 慢 |
| 有 .dockerignore | ~10MB | 快 |

---

## 11.8 使用 distroless 镜像

### 什么是 distroless？

Google 提供的 distroless 镜像只包含应用运行时，不包含 shell、包管理器等工具。

### 使用示例

```dockerfile
# Node.js
FROM gcr.io/distroless/nodejs18-debian11

COPY dist /app
WORKDIR /app

CMD ["index.js"]

# Python
FROM gcr.io/distroless/python3

COPY . /app
WORKDIR /app

CMD ["main.py"]

# Java
FROM gcr.io/distroless/java17-debian11

COPY target/app.jar /app.jar

CMD ["/app.jar"]
```

### 优势

| 特性 | 普通镜像 | distroless |
| --- | --- | --- |
| 镜像大小 | ~150MB | ~50MB |
| 安全性 | 中（有 shell） | 高（无 shell） |
| 调试 | 容易 | 困难 |

---

## 11.9 镜像标签管理

### 语义化版本

```bash
# 推荐：使用具体版本
FROM node:18.17.0-alpine

# 或者：使用主版本
FROM node:18-alpine

# 不推荐：使用 latest
FROM node:latest
```

### 标签策略

```bash
# 构建时打标签
docker build -t myapp:v1.2.3 .
docker build -t myapp:v1.2 .
docker build -t myapp:v1 .
docker build -t myapp:latest .

# 推送到仓库
docker push myapp:v1.2.3
docker push myapp:v1.2
docker push myapp:v1
docker push myapp:latest
```

---

## 11.10 镜像安全扫描

### 使用 Docker Scout

```bash
# 扫描镜像漏洞
docker scout cves myapp:latest

# 查看漏洞详情
docker scout cves --format sarif myapp:latest

# 修复建议
docker scout recommendations myapp:latest
```

### 使用 Trivy

```bash
# 安装 Trivy
brew install trivy  # macOS

# 扫描镜像
trivy image myapp:latest

# 只报告高危漏洞
trivy image --severity HIGH,CRITICAL myapp:latest
```

---

## 11.11 最佳实践总结

### Dockerfile 优化清单

```dockerfile
# 1. 使用小镜像
FROM node:18-alpine

# 2. 设置工作目录
WORKDIR /app

# 3. 复制 package 文件（利用缓存）
COPY package*.json ./

# 4. 安装依赖（无缓存）
RUN npm ci --only=production && \
    npm cache clean --force

# 5. 复制源代码
COPY . .

# 6. 使用非 root 用户
USER node

# 7. 暴露端口
EXPOSE 3000

# 8. 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

# 9. 启动命令
CMD ["node", "app.js"]
```

### 优化效果对比

| 优化项 | 优化前 | 优化后 |
| --- | --- | --- |
| 镜像大小 | 1.2GB | 150MB |
| 构建时间 | 5 分钟 | 30 秒 |
| 安全漏洞 | 15 个 | 0 个 |
| 启动时间 | 10 秒 | 2 秒 |

---

## 11.12 核心知识点总结

| 优化技巧 | 说明 | 效果 |
| --- | --- | --- |
| 使用 Alpine 镜像 | 选择小体积基础镜像 | 减小 80% |
| 多阶段构建 | 分离构建和运行环境 | 减小 70% |
| 优化层缓存 | 先复制 package.json | 加快 50% |
| 合并 RUN 指令 | 减少镜像层数 | 减小 20% |
| 清理临时文件 | 删除缓存和临时文件 | 减小 30% |
| .dockerignore | 排除不必要文件 | 加快构建 |
| distroless 镜像 | 最小化运行时 | 减小 60% |

---

## 11.13 新手常见误区

### 误区 1："latest 标签总是最好的"

**错！** `latest` 标签不稳定，可能导致不同环境使用不同版本。应该使用具体版本号。

### 误区 2："镜像越大越好"

不是的。大镜像意味着下载慢、占用磁盘多、启动慢、安全隐患多。应该尽量减小镜像体积。

### 误区 3："多阶段构建很复杂"

不是的。多阶段构建只是把构建和运行分开，逻辑更清晰，效果非常好。

### 误区 4："缓存不重要"

不是的。合理利用缓存可以大幅加快构建速度，特别是在 CI/CD 中。

---

## 11.14 动手练习

### 练习 1：优化 Node.js 镜像

将一个 Node.js 应用镜像从 1GB 优化到 150MB 以内。

<details>
<summary>点击查看答案</summary>

优化前：

```dockerfile
FROM node:18
COPY . /app
WORKDIR /app
RUN npm install
CMD ["node", "app.js"]
```

优化后：

```dockerfile
# 使用 Alpine 镜像
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建（如果有）
# RUN npm run build

# 第二阶段：运行
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 复制构建产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/*.js ./

# 使用非 root 用户
USER node

EXPOSE 3000

CMD ["node", "app.js"]
```

</details>

### 练习 2：优化 Python 镜像

优化一个 Python Flask 应用的镜像。

<details>
<summary>点击查看答案</summary>

```dockerfile
# 第一阶段：构建
FROM python:3.11-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖到指定目录
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# 第二阶段：运行
FROM python:3.11-alpine

WORKDIR /app

# 从构建阶段复制安装的依赖
COPY --from=builder /install /usr/local

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN adduser -D appuser
USER appuser

EXPOSE 5000

CMD ["python", "app.py"]
```

</details>

### 练习 3（挑战）：完整优化方案

为一个前后端分离应用编写完整的优化方案。

<details>
<summary>点击查看答案</summary>

```dockerfile
# 前端 Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# 后端 Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

```bash
# .dockerignore
node_modules
dist
build
.git
.gitignore
README.md
*.md
tests
coverage
.env
.vscode
.idea
```

</details>

---

## 下一章预告

下一章我们会学习 **监控与日志管理**——如何监控容器状态、收集和分析日志。这是运维的重要技能。
