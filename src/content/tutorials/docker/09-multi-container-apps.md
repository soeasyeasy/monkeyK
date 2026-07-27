---
title: "第9章：多容器应用实战"
description: "WordPress + MySQL、前后端分离应用"
---

# 第9章：多容器应用实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何用 Docker 部署一个完整的 Web 应用？
- WordPress 博客如何用 Docker 搭建？
- 前后端分离应用如何容器化？
- 多个容器之间如何协作？

这一章会通过实际案例，带你部署完整的应用。学完这些，你就能把真实项目容器化了。

---

## 1 为什么需要多容器应用？

### 痛点分析

单个容器只能运行一个服务，但真实应用通常需要多个服务协作：

- Web 服务器（Nginx）
- 应用服务器（Node.js/Python/Java）
- 数据库（MySQL/PostgreSQL）
- 缓存（Redis/Memcached）
- 消息队列（RabbitMQ/Kafka）

如果把所有服务放在一个容器里：

- 容器变得臃肿
- 难以维护和扩展
- 违反容器"单一职责"原则

### 解决方案

使用多个容器，每个容器运行一个服务，通过网络通信。

打个比方：

> 单容器应用就像一个多功能瑞士军刀，什么都能做，但每样都不精。
>
> 多容器应用就像专业工具套装，每个工具专注做一件事，组合起来更强大。

---

## 2 案例一：WordPress 博客

### 项目结构

```
wordpress-docker/
├── docker-compose.yml
└── .env
```

### docker-compose.yml

```yaml
# WordPress + MySQL 完整配置
services:
  # WordPress 服务
  wordpress:
    image: wordpress:latest
    container_name: wordpress
    ports:
      - "8080:80"  # 映射到宿主机 8080 端口
    environment:
      WORDPRESS_DB_HOST: db  # 数据库主机名（容器名）
      WORDPRESS_DB_USER: ${DB_USER}  # 从 .env 读取
      WORDPRESS_DB_PASSWORD: ${DB_PASSWORD}
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wordpress-data:/var/www/html  # 持久化 WordPress 文件
    depends_on:
      - db  # 依赖数据库服务
    networks:
      - wordpress-network
    restart: always

  # MySQL 数据库服务
  db:
    image: mysql:8.0
    container_name: wordpress-db
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - db-data:/var/lib/mysql  # 持久化数据库文件
    networks:
      - wordpress-network
    restart: always

# 数据卷
volumes:
  wordpress-data:
  db-data:

# 网络
networks:
  wordpress-network:
    driver: bridge
```

### .env 文件

```bash
DB_USER=wordpress
DB_PASSWORD=wordpress123
DB_ROOT_PASSWORD=root123
```

### 启动应用

```bash
# ❶ 启动所有服务
docker compose up -d

# ❷ 查看运行状态
docker compose ps

# ❸ 查看日志
docker compose logs -f

# ❹ 访问 WordPress
# 浏览器打开 http://localhost:8080
# 按照提示完成安装

# ❺ 停止应用
docker compose down

# ❻ 停止并删除数据（谨慎使用）
docker compose down -v
```

### 配置说明

| 配置项 | 说明 |
| --- | --- |
| `WORDPRESS_DB_HOST: db` | 数据库主机名，使用容器名 `db` |
| `volumes` | 数据持久化，防止数据丢失 |
| `depends_on` | 启动顺序控制 |
| `restart: always` | 容器退出后自动重启 |

---

## 3 案例二：前后端分离应用

### 项目结构

```
fullstack-app/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── nginx/
    └── nginx.conf
```

### 后端 Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### 前端 Dockerfile

```dockerfile
# frontend/Dockerfile
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

### Nginx 配置

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;  # 后端服务地址
    }

    server {
        listen 80;
        server_name localhost;

        # 前端静态文件
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;  # SPA 路由支持
        }

        # API 代理
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### docker-compose.yml

```yaml
services:
  # 前端服务
  frontend:
    build: ./frontend
    container_name: frontend
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro  # 挂载 Nginx 配置
    depends_on:
      - backend
    networks:
      - app-network
    restart: always

  # 后端服务
  backend:
    build: ./backend
    container_name: backend
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    networks:
      - app-network
    restart: always

  # 数据库
  db:
    image: mysql:8.0
    container_name: mysql
    environment:
      MYSQL_DATABASE: myapp
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - app-network
    restart: always

  # 缓存
  redis:
    image: redis:alpine
    container_name: redis
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: always

volumes:
  db-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

### 启动应用

```bash
# ❶ 构建并启动
docker compose up -d --build

# ❷ 查看状态
docker compose ps

# ❸ 查看日志
docker compose logs -f

# ❹ 访问应用
# 前端：http://localhost
# API：http://localhost/api/
```

---

## 4 案例三：Node.js + MongoDB

### 项目结构

```
node-mongo-app/
├── docker-compose.yml
├── app/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── mongo-init/
    └── init.js
```

### 应用代码

```javascript
// app/server.js
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// 连接 MongoDB
mongoose.connect('mongodb://mongo:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// 定义模型
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String
}));

// 路由
app.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Dockerfile

```dockerfile
# app/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
services:
  app:
    build: ./app
    container_name: node-app
    ports:
      - "3000:3000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/myapp
    depends_on:
      - mongo
    networks:
      - app-network
    restart: always

  mongo:
    image: mongo:6
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d  # 初始化脚本
    environment:
      MONGO_INITDB_DATABASE: myapp
    networks:
      - app-network
    restart: always

  mongo-express:
    image: mongo-express
    container_name: mongo-ui
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_SERVER: mongo
      ME_CONFIG_MONGODB_PORT: 27017
    depends_on:
      - mongo
    networks:
      - app-network
    restart: always

volumes:
  mongo-data:

networks:
  app-network:
    driver: bridge
```

### 启动应用

```bash
# ❶ 启动服务
docker compose up -d

# ❷ 查看状态
docker compose ps

# ❸ 访问应用
# API：http://localhost:3000
# MongoDB UI：http://localhost:8081
```

---

## 5 服务发现与通信

### 容器间通信方式

```yaml
# 方式一：使用容器名
services:
  app:
    environment:
      - DB_HOST=db  # 直接使用容器名

# 方式二：使用网络别名
services:
  app:
    networks:
      app-network:
        aliases:
          - database

networks:
  app-network:
```

### DNS 解析

```bash
# 在容器内测试 DNS 解析
docker exec app nslookup db
# 输出：db 的 IP 地址

# 测试连接
docker exec app ping db
```

---

## 6 数据持久化策略

### 数据库持久化

```yaml
services:
  mysql:
    image: mysql:8.0
    volumes:
      - mysql-data:/var/lib/mysql  # 数据目录
      - ./config/my.cnf:/etc/mysql/my.cnf:ro  # 配置文件

  postgres:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data

  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
```

### 应用文件持久化

```yaml
services:
  wordpress:
    volumes:
      - wordpress-data:/var/www/html  # WordPress 文件
      - ./uploads:/var/www/html/wp-content/uploads  # 上传目录

  nginx:
    volumes:
      - ./static:/usr/share/nginx/html:ro  # 静态文件
      - ./logs:/var/log/nginx  # 日志文件
```

---

## 7 健康检查

### 配置健康检查

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

  db:
    image: mysql:8.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### 使用健康检查

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy  # 等待数据库健康
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 多容器架构 | 每个服务一个容器，通过网络通信 |
| 服务发现 | 使用容器名或网络别名 |
| 数据持久化 | 使用数据卷保存重要数据 |
| 健康检查 | 监控服务状态，确保服务可用 |
| 依赖管理 | `depends_on` 控制启动顺序 |

---

## 9 新手常见误区

### 误区 1："所有服务都应该放在一个容器里"

**错！** 这违反了容器的"单一职责"原则。应该每个服务一个容器，便于维护、扩展和监控。

### 误区 2："depends_on 会等待服务完全就绪"

不是的。`depends_on` 只控制启动顺序，不会等待服务完全启动。应该使用健康检查。

### 误区 3："容器名可以随便起"

不是的。容器名在网络中作为 DNS 名称使用，应该使用有意义的名称，如 `db`、`redis`、`api`。

### 误区 4："数据卷不需要管理"

不是的。数据卷需要定期备份和清理，否则会占用大量磁盘空间。

---

## 10 动手练习

### 练习 1：部署 WordPress

使用 Docker Compose 部署 WordPress 博客。

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
      WORDPRESS_DB_PASSWORD: wordpress123
    depends_on:
      - db
    volumes:
      - wordpress-data:/var/www/html

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress123
      MYSQL_ROOT_PASSWORD: root123
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

### 练习 2：前后端分离应用

创建一个简单的前后端分离应用，前端使用 Nginx，后端使用 Node.js。

<details>
<summary>点击查看答案</summary>

```yaml
# docker-compose.yml
services:
  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
```

</details>

### 练习 3（挑战）：完整应用栈

部署一个包含 Web、API、数据库、缓存的完整应用。

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

  api:
    build: ./api
    environment:
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - backend

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
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

volumes:
  db-data:
  redis-data:

networks:
  frontend:
  backend:
```

</details>

---

## 下一章预告

下一章我们会学习 **Docker 安全与权限**——如何保证容器安全，如何管理用户权限。安全是生产环境的重要考虑因素。
