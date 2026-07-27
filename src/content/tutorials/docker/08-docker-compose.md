---
title: "第8章：Docker Compose 编排"
description: "Compose 文件、服务定义、多容器管理"
---

# 第8章：Docker Compose 编排

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Docker Compose？它解决了什么问题？
- 如何编写 docker-compose.yml 文件？
- 如何一键启动多个容器？
- 如何在 Compose 中配置网络和数据卷？

这一章会教你使用 Docker Compose 来管理多容器应用。学会这个工具，你就能用一个 YAML 文件定义整个应用栈，一键启动所有服务。

---

## 1 为什么需要 Docker Compose？

### 痛点分析

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
- 难以复用和分享
- 停止和清理也很麻烦

### 解决方案

Docker Compose 让你用一个 YAML 文件定义所有服务，一条命令启动整个应用。

打个比方：

> 手动启动容器就像手动做每道菜，一道一道来，容易忘记步骤。
>
> Docker Compose 就像一份完整的菜谱，按照它一次性做好所有菜。

### 对比

| 方式 | 命令数量 | 依赖管理 | 可复用性 |
| --- | --- | --- | --- |
| docker run | 多个 | 手动管理 | 差 |
| docker-compose | 1 个 | 自动管理 | 好 |

---

## 2 安装 Docker Compose

### Docker Desktop（推荐）

如果你使用 Docker Desktop（Windows/macOS），Docker Compose 已经内置，无需额外安装。

```bash
# 验证安装
docker compose version
# 输出：Docker Compose version v2.x.x
```

### Linux 安装

```bash
# ❶ 下载 Docker Compose 插件
sudo apt-get update
sudo apt-get install docker-compose-plugin

# ❷ 验证安装
docker compose version
```

### 独立安装（旧版本）

```bash
# ❶ 下载二进制文件
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# ❷ 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# ❸ 验证安装
docker-compose version
```

> 注意：新版 Docker Compose 使用 `docker compose`（空格），旧版使用 `docker-compose`（连字符）。本教程使用新版语法。

---

## 3 docker-compose.yml 基础

### 基本结构

```yaml
# docker-compose.yml 示例
version: '3.8'  # Compose 文件版本

services:  # 服务定义
  web:  # 服务名称
    image: nginx:latest
    ports:
      - "80:80"
  
  app:
    image: node:18
    depends_on:
      - db
  
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: 123456

volumes:  # 数据卷定义
  db-data:

networks:  # 网络定义
  app-network:
```

### 核心概念

| 概念 | 说明 |
| --- | --- |
| version | Compose 文件版本（可选，新版可省略） |
| services | 服务定义，每个服务是一个容器 |
| volumes | 数据卷定义 |
| networks | 网络定义 |

---

## 4 服务配置详解

### image 和 build

```yaml
services:
  # ❶ 使用现成镜像
  web:
    image: nginx:latest
  
  # ❷ 从 Dockerfile 构建
  app:
    build: .
  
  # ❸ 指定 Dockerfile 路径
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
```

### ports 端口映射

```yaml
services:
  web:
    image: nginx
    ports:
      - "80:80"        # 宿主机:容器
      - "443:443"
      - "8080:8080/tcp"
```

### environment 环境变量

```yaml
services:
  app:
    image: myapp
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
```

或者使用 env_file：

```yaml
services:
  app:
    image: myapp
    env_file:
      - .env
```

### volumes 数据卷

```yaml
services:
  db:
    image: mysql:8.0
    volumes:
      - db-data:/var/lib/mysql  # 命名卷
      - ./config:/etc/mysql     # 绑定挂载

volumes:
  db-data:  # 声明命名卷
```

### depends_on 依赖关系

```yaml
services:
  web:
    image: nginx
    depends_on:
      - app
  
  app:
    image: myapp
    depends_on:
      - db
      - redis
  
  db:
    image: mysql:8.0
  
  redis:
    image: redis:alpine
```

> 注意：`depends_on` 只控制启动顺序，不等待服务完全就绪。

### networks 网络

```yaml
services:
  web:
    image: nginx
    networks:
      - frontend
      - backend
  
  app:
    image: myapp
    networks:
      - backend
  
  db:
    image: mysql
    networks:
      - backend

networks:
  frontend:
  backend:
```

### restart 重启策略

```yaml
services:
  web:
    image: nginx
    restart: always  # 总是重启
    # 其他选项：
    # no - 不重启（默认）
    # on-failure - 失败时重启
    # unless-stopped - 除非手动停止
```

### command 覆盖启动命令

```yaml
services:
  web:
    image: nginx
    command: nginx -g "daemon off;"
```

---

## 5 Compose 命令

### 基础命令

```bash
# ❶ 启动所有服务（后台运行）
docker compose up -d

# ❷ 启动所有服务（前台运行，查看日志）
docker compose up

# ❸ 停止所有服务
docker compose stop

# ❹ 停止并删除所有容器
docker compose down

# ❺ 停止并删除所有容器、网络、数据卷
docker compose down -v

# ❻ 查看运行状态
docker compose ps

# ❼ 查看日志
docker compose logs

# ❽ 实时查看日志
docker compose logs -f

# ❾ 重启服务
docker compose restart

# ❿ 进入容器
docker compose exec web bash
```

### 构建命令

```bash
# ❶ 构建镜像
docker compose build

# ❷ 不使用缓存构建
docker compose build --no-cache

# ❸ 构建并启动
docker compose up --build
```

### 管理命令

```bash
# ❶ 暂停服务
docker compose pause

# ❷ 恢复服务
docker compose unpause

# ❸ 删除服务
docker compose rm

# ❹ 查看资源占用
docker compose top
```

---

## 6 完整示例：Web 应用栈

### 项目结构

```
my-app/
├── docker-compose.yml
├── web/
│   └── nginx.conf
├── api/
│   ├── Dockerfile
│   ├── package.json
│   └── app.js
└── .env
```

### docker-compose.yml

```yaml
services:
  # Web 服务器
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./web/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
    networks:
      - frontend
      - backend
    restart: always

  # API 服务
  api:
    build: ./api
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    networks:
      - backend
    restart: always

  # 数据库
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: myapp
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - backend
    restart: always

  # 缓存
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    networks:
      - backend
    restart: always

volumes:
  db-data:
  redis-data:

networks:
  frontend:
  backend:
```

### .env 文件

```bash
DB_PASSWORD=your_password_here
```

### 启动应用

```bash
# ❶ 启动所有服务
docker compose up -d

# ❷ 查看状态
docker compose ps

# ❸ 查看日志
docker compose logs -f

# ❹ 停止应用
docker compose down
```

---

## 7 环境变量与配置

### 使用 .env 文件

```yaml
# docker-compose.yml
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
```

```bash
# .env
DB_PASSWORD=secret123
```

### 使用 env_file

```yaml
services:
  app:
    image: myapp
    env_file:
      - .env
      - .env.production
```

### 变量插值

```yaml
services:
  web:
    image: nginx:${NGINX_VERSION:-latest}
    # 如果 NGINX_VERSION 未定义，使用 latest
```

---

## 8 多环境配置

### 使用多个 Compose 文件

```bash
# ❶ 基础配置
docker compose -f docker-compose.yml up -d

# ❷ 覆盖配置
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# ❸ 开发环境
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### docker-compose.dev.yml

```yaml
services:
  api:
    build: ./api
    volumes:
      - ./api:/app  # 代码热更新
    environment:
      - NODE_ENV=development
```

### docker-compose.prod.yml

```yaml
services:
  api:
    image: myapp:latest  # 使用构建好的镜像
    restart: always
    deploy:
      replicas: 3  # 运行 3 个实例
```

---

## 9 核心知识点总结

| 配置项 | 说明 | 示例 |
| --- | --- | --- |
| image | 使用镜像 | `image: nginx:latest` |
| build | 构建镜像 | `build: ./api` |
| ports | 端口映射 | `ports: ["80:80"]` |
| environment | 环境变量 | `environment: [NODE_ENV=production]` |
| volumes | 数据卷 | `volumes: [db-data:/var/lib/mysql]` |
| depends_on | 依赖关系 | `depends_on: [db]` |
| networks | 网络 | `networks: [backend]` |
| restart | 重启策略 | `restart: always` |
| command | 启动命令 | `command: nginx -g "daemon off;"` |

---

## 10 新手常见误区

### 误区 1："depends_on 会等待服务完全启动"

**错！** `depends_on` 只控制启动顺序，不会等待服务完全就绪。例如 MySQL 启动需要时间，但 `depends_on` 不会等它准备好。

解决方案：使用健康检查或等待脚本。

### 误区 2："Compose 文件版本必须指定"

不是的。新版 Docker Compose（v2）可以省略 `version` 字段。

### 误区 3："docker-compose 和 docker compose 是一样的"

不是的。`docker-compose` 是旧版独立工具，`docker compose` 是新版 Docker 插件。推荐使用新版。

### 误区 4："Compose 只能用于开发环境"

不是的。Compose 也可以用于生产环境，但对于大规模部署，建议使用 Kubernetes。

---

## 11 动手练习

### 练习 1：简单的 Web 应用

创建一个包含 Nginx 和 Redis 的 Compose 配置。

<details>
<summary>点击查看答案</summary>

```yaml
# docker-compose.yml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    depends_on:
      - redis
    networks:
      - app-network
  
  redis:
    image: redis:alpine
    networks:
      - app-network

networks:
  app-network:
```

启动：

```bash
docker compose up -d
docker compose ps
```

</details>

### 练习 2：WordPress 博客

使用 Compose 部署 WordPress + MySQL。

<details>
<summary>点击查看答案</summary>

```yaml
# docker-compose.yml
services:
  wordpress:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress_pass
      WORDPRESS_DB_NAME: wordpress
    depends_on:
      - db
    volumes:
      - wordpress-data:/var/www/html
  
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress_pass
      MYSQL_ROOT_PASSWORD: root_pass
    volumes:
      - db-data:/var/lib/mysql

volumes:
  wordpress-data:
  db-data:
```

启动：

```bash
docker compose up -d
# 访问 http://localhost:8080
```

</details>

### 练习 3（挑战）：完整应用栈

创建一个包含 Web、API、数据库、缓存的完整应用栈。

<details>
<summary>点击查看答案</summary>

```yaml
# docker-compose.yml
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
    networks:
      - frontend
      - backend
    restart: always

  api:
    build: ./api
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    networks:
      - backend
    restart: always

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: myapp
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - backend
    restart: always

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    networks:
      - backend
    restart: always

volumes:
  db-data:
  redis-data:

networks:
  frontend:
  backend:
```

启动：

```bash
docker compose up -d
docker compose ps
docker compose logs -f
```

</details>

---

## 下一章预告

下一章我们会学习 **多容器应用实战**——通过实际案例（WordPress、前后端分离应用）来巩固所学知识。你会看到一个完整的应用是如何用 Docker 部署的。
