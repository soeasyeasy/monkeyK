---
title: "第16章：综合项目实战"
description: "从零构建完整的微服务应用"
---

# 第16章：综合项目实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何将前面学到的知识应用到实际项目中？
- 一个完整的微服务项目包含哪些部分？
- 如何从零开始构建、部署和运维？
- 有哪些最佳实践和常见陷阱？

这一章会带你从零开始构建一个完整的微服务电商系统，包括用户服务、商品服务、订单服务、API 网关、数据库、缓存、消息队列等。通过这个项目，你会将前面学到的所有知识串联起来。

---

## 1 项目概述

### 项目目标

构建一个电商微服务系统，包含以下功能：

- **用户服务**：用户注册、登录、信息管理
- **商品服务**：商品 CRUD、库存管理
- **订单服务**：下单、支付、订单查询
- **API 网关**：统一入口、负载均衡、认证授权
- **基础设施**：数据库、缓存、消息队列、监控

### 技术栈

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 编程语言 | Node.js | 简单易学，生态丰富 |
| Web 框架 | Express | 轻量级，灵活 |
| 数据库 | PostgreSQL | 关系型数据库，支持事务 |
| 缓存 | Redis | 高性能缓存，支持分布式锁 |
| 消息队列 | RabbitMQ | 异步通信，解耦服务 |
| API 网关 | Kong | 功能强大，插件丰富 |
| 监控 | Prometheus + Grafana | 指标收集和可视化 |
| 日志 | Fluentd + Elasticsearch | 集中日志管理 |
| 容器化 | Docker + Docker Compose | 容器编排 |

### 架构图

```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Kong API   │
                    │   Gateway   │
                    └──────┬──────┘
                           │
        ┌──────────┬───────┼───────┬──────────┐
        │          │       │       │          │
   ┌────▼────┐ ┌──▼───┐ ┌─▼──┐ ┌──▼───┐ ┌───▼────┐
   │ 用户服务 │ │商品服务│ │订单│ │支付服务│ │通知服务 │
   └────┬────┘ └──┬───┘ └─┬──┘ └──┬───┘ └───┬────┘
        │         │       │       │          │
   ┌────▼────┐ ┌──▼───┐ ┌─▼──┐ ┌──▼───┐ ┌───▼────┐
   │PostgreSQL│ │Redis │ │PG  │ │ PG   │ │RabbitMQ│
   └─────────┘ └──────┘ └────┘ └──────┘ └────────┘
                           │
                    ┌──────▼──────┐
                    │ Prometheus  │
                    │  + Grafana  │
                    └─────────────┘
```

---

## 2 项目结构

```
ecommerce-microservices/
├── docker-compose.yml
├── .env
├── api-gateway/
│   ├── Dockerfile
│   ├── kong.yml
│   └── src/
├── user-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── models/
│       └── middleware/
├── product-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── routes/
│       └── models/
├── order-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── routes/
│       └── models/
├── notification-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       └── consumers/
├── monitoring/
│   ├── prometheus.yml
│   └── alert_rules.yml
└── scripts/
    ├── init-db.sh
    └── backup.sh
```

---

## 3 基础设施配置

### docker-compose.yml

```yaml
version: '3.8'

services:
  # API 网关
  api-gateway:
    image: kong:3.4
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8000:8000"
      - "8443:8443"
      - "8001:8001"
    volumes:
      - ./api-gateway/kong.yml:/kong/kong.yml
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "kong", "health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 用户服务
  user-service:
    build: ./user-service
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: user-db
      DB_PORT: 5432
      DB_NAME: users
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      user-db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

  # 商品服务
  product-service:
    build: ./product-service
    environment:
      NODE_ENV: production
      PORT: 3002
      DB_HOST: product-db
      DB_PORT: 5432
      DB_NAME: products
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      product-db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

  # 订单服务
  order-service:
    build: ./order-service
    environment:
      NODE_ENV: production
      PORT: 3003
      DB_HOST: order-db
      DB_PORT: 5432
      DB_NAME: orders
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      RABBITMQ_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672
      USER_SERVICE_URL: http://user-service:3001
      PRODUCT_SERVICE_URL: http://product-service:3002
    depends_on:
      order-db:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

  # 通知服务
  notification-service:
    build: ./notification-service
    environment:
      NODE_ENV: production
      PORT: 3004
      RABBITMQ_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672
    depends_on:
      rabbitmq:
        condition: service_healthy
    networks:
      - ecommerce-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 64M

  # 数据库
  user-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: users
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - user-db-data:/var/lib/postgresql/data
      - ./scripts/init-user-db.sh:/docker-entrypoint-initdb.d/init.sh
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  product-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: products
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - product-db-data:/var/lib/postgresql/data
      - ./scripts/init-product-db.sh:/docker-entrypoint-initdb.d/init.sh
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  order-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - order-db-data:/var/lib/postgresql/data
      - ./scripts/init-order-db.sh:/docker-entrypoint-initdb.d/init.sh
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  # 缓存
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  # 消息队列
  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "15672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  # 监控
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - ecommerce-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  grafana:
    image: grafana/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3000:3000"
    networks:
      - ecommerce-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

volumes:
  user-db-data:
  product-db-data:
  order-db-data:
  redis-data:
  rabbitmq-data:
  prometheus-data:
  grafana-data:

networks:
  ecommerce-network:
    driver: bridge
```

### .env 文件

```bash
# 数据库配置
DB_USER=ecommerce
DB_PASSWORD=your_secure_password_here

# Redis 配置
REDIS_PASSWORD=your_redis_password_here

# RabbitMQ 配置
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=your_rabbitmq_password_here

# JWT 配置
JWT_SECRET=your_jwt_secret_here

# Grafana 配置
GRAFANA_PASSWORD=admin

# 其他配置
NODE_ENV=production
LOG_LEVEL=info
```

---

## 4 用户服务实现

### Dockerfile

```dockerfile
# user-service/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
```

### package.json

```json
{
  "name": "user-service",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "prom-client": "^15.0.0"
  }
}
```

### 主文件

```javascript
// user-service/src/index.js
const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const promClient = require('prom-client');

const app = express();
app.use(express.json());

// 数据库连接
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Redis 连接
const redisClient = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.connect();

// Prometheus 指标
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

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

// 健康检查
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redisClient.ping();
    res.status(200).json({ status: 'healthy', service: 'user-service' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Prometheus 指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 用户注册
app.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, hashedPassword, name]
    );
    
    const user = result.rows[0];
    
    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 用户登录
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 查询用户
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 缓存到 Redis
    await redisClient.setEx(
      `user:${user.id}:token`,
      86400,
      token
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取用户信息
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 先从缓存查询
    const cachedUser = await redisClient.get(`user:${id}`);
    if (cachedUser) {
      return res.json(JSON.parse(cachedUser));
    }
    
    // 从数据库查询
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // 缓存到 Redis
    await redisClient.setEx(
      `user:${id}`,
      3600,
      JSON.stringify(user)
    );
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 启动服务
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
```

### 数据库初始化脚本

```bash
#!/bin/bash
# scripts/init-user-db.sh

psql -U $POSTGRES_USER -d $POSTGRES_DB <<EOF
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
EOF
```

---

## 5 商品服务实现

### Dockerfile

```dockerfile
# product-service/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "src/index.js"]
```

### 主文件

```javascript
// product-service/src/index.js
const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const promClient = require('prom-client');

const app = express();
app.use(express.json());

// 数据库连接
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Redis 连接
const redisClient = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.connect();

// Prometheus 指标
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

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

// 健康检查
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redisClient.ping();
    res.status(200).json({ status: 'healthy', service: 'product-service' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Prometheus 指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 创建商品
app.post('/products', async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, stock]
    );
    
    const product = result.rows[0];
    
    // 缓存到 Redis
    await redisClient.setEx(
      `product:${product.id}`,
      3600,
      JSON.stringify(product)
    );
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取商品列表
app.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    const countResult = await pool.query('SELECT COUNT(*) FROM products');
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      products: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取商品详情
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 先从缓存查询
    const cachedProduct = await redisClient.get(`product:${id}`);
    if (cachedProduct) {
      return res.json(JSON.parse(cachedProduct));
    }
    
    // 从数据库查询
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = result.rows[0];
    
    // 缓存到 Redis
    await redisClient.setEx(
      `product:${id}`,
      3600,
      JSON.stringify(product)
    );
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新库存
app.patch('/products/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    const result = await pool.query(
      'UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND stock >= $1 RETURNING *',
      [quantity, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    const product = result.rows[0];
    
    // 更新缓存
    await redisClient.setEx(
      `product:${id}`,
      3600,
      JSON.stringify(product)
    );
    
    res.json(product);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 启动服务
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});
```

---

## 6 订单服务实现

### 主文件

```javascript
// order-service/src/index.js
const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const amqp = require('amqplib');
const axios = require('axios');
const promClient = require('prom-client');

const app = express();
app.use(express.json());

// 数据库连接
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Redis 连接
const redisClient = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.connect();

// RabbitMQ 连接
let rabbitChannel;

async function initRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  rabbitChannel = await connection.createChannel();
  await rabbitChannel.assertQueue('order_created');
  console.log('Connected to RabbitMQ');
}

initRabbitMQ();

// Prometheus 指标
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

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

// 健康检查
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redisClient.ping();
    res.status(200).json({ status: 'healthy', service: 'order-service' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Prometheus 指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 创建订单
app.post('/orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { userId, productId, quantity } = req.body;
    
    await client.query('BEGIN');
    
    // 验证用户
    const userResponse = await axios.get(`${process.env.USER_SERVICE_URL}/users/${userId}`);
    const user = userResponse.data;
    
    // 验证商品并检查库存
    const productResponse = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/products/${productId}`);
    const product = productResponse.data;
    
    if (product.stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    // 计算总价
    const totalPrice = product.price * quantity;
    
    // 创建订单
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, productId, quantity, totalPrice, 'pending']
    );
    
    const order = orderResult.rows[0];
    
    // 更新商品库存
    await axios.patch(`${process.env.PRODUCT_SERVICE_URL}/products/${productId}/stock`, {
      quantity
    });
    
    await client.query('COMMIT');
    
    // 发布订单创建事件
    await rabbitChannel.sendToQueue(
      'order_created',
      Buffer.from(JSON.stringify({
        orderId: order.id,
        userId,
        productId,
        quantity,
        totalPrice
      }))
    );
    
    console.log('Order created:', order.id);
    
    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// 获取用户订单
app.get('/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 启动服务
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});
```

---

## 7 通知服务实现

### 主文件

```javascript
// notification-service/src/index.js
const amqp = require('amqplib');

async function startConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  
  await channel.assertQueue('order_created');
  
  console.log('Notification service waiting for messages...');
  
  channel.consume('order_created', async (msg) => {
    if (msg !== null) {
      const order = JSON.parse(msg.content.toString());
      console.log('Received order created event:', order);
      
      // 发送通知（这里只是打印，实际可以发送邮件、短信等）
      await sendNotification(order);
      
      channel.ack(msg);
    }
  });
}

async function sendNotification(order) {
  // 模拟发送通知
  console.log(`Sending notification for order ${order.orderId}:`);
  console.log(`- User ID: ${order.userId}`);
  console.log(`- Product ID: ${order.productId}`);
  console.log(`- Quantity: ${order.quantity}`);
  console.log(`- Total Price: $${order.totalPrice}`);
  console.log('Notification sent successfully!');
}

startConsumer().catch(console.error);
```

---

## 8 API 网关配置

### Kong 配置

```yaml
# api-gateway/kong.yml
_format_version: "3.0"

services:
  - name: user-service
    url: http://user-service:3001
    routes:
      - name: user-routes
        paths:
          - /users
          - /register
          - /login
        strip_path: false
    
  - name: product-service
    url: http://product-service:3002
    routes:
      - name: product-routes
        paths:
          - /products
        strip_path: false
    
  - name: order-service
    url: http://order-service:3003
    routes:
      - name: order-routes
        paths:
          - /orders
        strip_path: false

plugins:
  - name: cors
    config:
      origins: ["*"]
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
      headers: ["Accept", "Accept-Version", "Content-Length", "Content-MD5", "Content-Type", "Date", "X-Auth-Token"]
      exposed_headers: ["X-Auth-Token"]
      credentials: true
      max_age: 3600
  
  - name: rate-limiting
    config:
      minute: 100
      hour: 1000
      policy: local
```

---

## 9 监控配置

### Prometheus 配置

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'user-service'
    static_configs:
      - targets: ['user-service:3001']
    metrics_path: '/metrics'
  
  - job_name: 'product-service'
    static_configs:
      - targets: ['product-service:3002']
    metrics_path: '/metrics'
  
  - job_name: 'order-service'
    static_configs:
      - targets: ['order-service:3003']
    metrics_path: '/metrics'
```

---

## 10 部署和测试

### 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

### 测试 API

```bash
# 注册用户
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 登录
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 创建商品
curl -X POST http://localhost:8000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"iPhone 15","description":"Latest iPhone","price":999,"stock":100}'

# 获取商品列表
curl http://localhost:8000/products

# 创建订单
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"productId":1,"quantity":2}'
```

### 访问监控

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)
- **Kong Manager**: http://localhost:8001

---

## 11 项目总结

### 学到的技能

通过这个项目，你实践了：

1. **微服务架构设计**：服务拆分、职责划分
2. **容器化部署**：Dockerfile 编写、多阶段构建
3. **服务编排**：Docker Compose 配置、服务依赖
4. **服务通信**：REST API、消息队列
5. **数据持久化**：数据库、缓存
6. **API 网关**：Kong 配置、路由、插件
7. **监控告警**：Prometheus、Grafana
8. **安全加固**：非 root 用户、资源限制、健康检查
9. **日志管理**：结构化日志、集中收集
10. **性能优化**：缓存、索引、连接池

### 最佳实践

1. **服务拆分**：按业务领域拆分，单一职责
2. **数据独立**：每个服务有自己的数据库
3. **异步通信**：使用消息队列解耦服务
4. **健康检查**：监控服务状态，自动重启
5. **资源限制**：防止资源滥用
6. **安全加固**：非 root 用户、只读文件系统
7. **监控告警**：及时发现问题
8. **日志管理**：集中收集，便于分析

### 常见问题

1. **服务启动顺序**：使用 `depends_on` 和健康检查
2. **数据库迁移**：使用初始化脚本或迁移工具
3. **服务发现**：使用 Docker DNS 或服务注册中心
4. **配置管理**：使用环境变量或配置中心
5. **日志收集**：使用日志驱动或 Fluentd

---

## 12 下一步学习

恭喜你完成了整个 Docker 教程！接下来你可以：

1. **学习 Kubernetes**：更强大的容器编排工具
2. **深入学习微服务**：服务网格、分布式追踪
3. **学习 CI/CD**：Jenkins、GitLab CI、GitHub Actions
4. **学习云平台**：AWS、Azure、GCP
5. **实践更多项目**：将所学知识应用到实际项目中

---

## 13 动手练习

### 练习 1：扩展项目功能

为电商系统添加支付服务和库存服务。

<details>
<summary>点击查看答案</summary>

添加支付服务：

```yaml
# 在 docker-compose.yml 中添加
payment-service:
  build: ./payment-service
  environment:
    NODE_ENV: production
    PORT: 3005
    DB_HOST: payment-db
    RABBITMQ_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672
  depends_on:
    payment-db:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy
  networks:
    - ecommerce-network
  restart: unless-stopped

payment-db:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: payments
    POSTGRES_USER: ${DB_USER}
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  volumes:
    - payment-db-data:/var/lib/postgresql/data
  networks:
    - ecommerce-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

```javascript
// payment-service/src/index.js
const express = require('express');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

let rabbitChannel;

async function initRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  rabbitChannel = await connection.createChannel();
  await rabbitChannel.assertQueue('payment_processed');
  console.log('Connected to RabbitMQ');
}

initRabbitMQ();

app.post('/payments', async (req, res) => {
  const { orderId, amount, method } = req.body;
  
  // 模拟支付处理
  console.log(`Processing payment for order ${orderId}: $${amount}`);
  
  // 发布支付成功事件
  await rabbitChannel.sendToQueue(
    'payment_processed',
    Buffer.from(JSON.stringify({ orderId, amount, status: 'success' }))
  );
  
  res.json({ status: 'success', transactionId: `TXN-${Date.now()}` });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});
```

</details>

### 练习 2：添加自动化测试

为微服务添加单元测试和集成测试。

<details>
<summary>点击查看答案</summary>

```javascript
// user-service/tests/user.test.js
const request = require('supertest');
const app = require('../src/index');

describe('User Service', () => {
  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('user');
    });
    
    it('should not register duplicate email', async () => {
      await request(app)
        .post('/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test User'
        });
      
      const res = await request(app)
        .post('/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test User 2'
        });
      
      expect(res.statusCode).toEqual(400);
    });
  });
  
  describe('POST /login', () => {
    it('should login with valid credentials', async () => {
      // 先注册用户
      await request(app)
        .post('/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          name: 'Login User'
        });
      
      const res = await request(app)
        .post('/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });
  });
});
```

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

</details>

### 练习 3（挑战）：部署到生产环境

将项目部署到云服务器（如 AWS、阿里云）。

<details>
<summary>点击查看答案</summary>

1. **准备云服务器**：
   - 购买云服务器（推荐 4 核 8G 以上）
   - 安装 Docker 和 Docker Compose
   - 配置安全组，开放必要端口

2. **上传代码**：
   ```bash
   # 使用 git 或 scp 上传代码
   git clone https://github.com/your-repo/ecommerce-microservices.git
   cd ecommerce-microservices
   ```

3. **配置环境变量**：
   ```bash
   # 修改 .env 文件，使用生产环境的配置
   vim .env
   ```

4. **构建和启动**：
   ```bash
   docker-compose up -d --build
   ```

5. **配置域名和 SSL**：
   ```bash
   # 使用 Nginx 反向代理
   # 使用 Let's Encrypt 申请免费 SSL 证书
   ```

6. **配置监控和日志**：
   - 配置 Grafana 告警
   - 配置日志收集（如 ELK）
   - 配置备份脚本

7. **配置自动部署**：
   ```bash
   # 使用 GitHub Actions 或 Jenkins
   # 代码提交后自动构建和部署
   ```

</details>

---

## 教程总结

恭喜你完成了整个 Docker 教程！从基础概念到生产实践，你已经掌握了：

- **基础篇**：Docker 简介、核心概念、镜像管理、容器操作
- **进阶篇**：Dockerfile、数据持久化、网络、Docker Compose
- **实战篇**：多容器应用、安全、镜像优化、监控日志、CI/CD、微服务、生产实践、综合项目

希望这个教程能帮助你掌握 Docker 技术，在实际工作中发挥作用！
