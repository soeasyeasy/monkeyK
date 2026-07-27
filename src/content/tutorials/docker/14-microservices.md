---
title: "第14章：微服务架构部署"
description: "服务拆分、容器编排、服务发现"
---

# 第14章：微服务架构部署

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是微服务架构？
- 如何用 Docker 部署微服务？
- 多个服务之间如何通信？
- 如何管理大量的容器？

这一章会教你微服务架构的核心概念和 Docker 部署实践。学完这些，你就能设计和部署一个完整的微服务系统。

---

## 1 为什么需要微服务架构？

### 单体架构的痛点

想象你经营一家餐厅，所有菜品都在一个大厨房里制作：

- **耦合度高**：修改一个功能可能影响整个系统
- **扩展困难**：只能整体扩展，无法针对热点功能单独扩展
- **技术栈受限**：整个系统必须使用同一种技术
- **部署风险大**：小改动也需要全量部署
- **团队协作难**：多个团队修改同一代码库容易冲突

### 微服务架构的优势

微服务就像把大厨房拆分成多个专门的档口：

- **独立部署**：每个服务可以独立部署，互不影响
- **技术多样**：不同服务可以使用不同的技术栈
- **弹性扩展**：可以针对热点服务单独扩展
- **团队自治**：每个团队负责自己的服务
- **故障隔离**：一个服务故障不会影响其他服务

打个比方：

> 单体架构就像一个大型超市，所有商品都在一个屋檐下。
> 
> 微服务就像商业街，每个店铺独立经营，互不干扰。

---

## 2 微服务架构核心概念

### 服务拆分原则

```
单体应用
├── 用户服务（User Service）
├── 订单服务（Order Service）
├── 商品服务（Product Service）
├── 支付服务（Payment Service）
└── 通知服务（Notification Service）
```

拆分原则：

1. **单一职责**：每个服务只做一件事
2. **业务边界**：按业务领域拆分（DDD）
3. **数据独立**：每个服务有自己的数据库
4. **接口清晰**：服务间通过明确的 API 通信

### 架构图

```
                    ┌─────────────┐
                    │   API 网关   │
                    └──────┬──────┘
                           │
        ┌──────────┬───────┼───────┬──────────┐
        │          │       │       │          │
   ┌────▼────┐ ┌──▼───┐ ┌─▼──┐ ┌──▼───┐ ┌───▼────┐
   │ 用户服务 │ │订单服务│ │商品│ │支付服务│ │通知服务 │
   └────┬────┘ └──┬───┘ └─┬──┘ └──┬───┘ └───┬────┘
        │         │       │       │          │
   ┌────▼────┐ ┌──▼───┐ ┌─▼──┐ ┌──▼───┐ ┌───▼────┐
   │用户数据库│ │订单DB │ │商品│ │支付DB │ │通知队列 │
   └─────────┘ └──────┘ │ DB │ └──────┘ └────────┘
                         └────┘
```

---

## 3 Docker Compose 部署微服务

### 项目结构

```
microservices-demo/
├── docker-compose.yml
├── api-gateway/
│   ├── Dockerfile
│   └── src/
├── user-service/
│   ├── Dockerfile
│   └── src/
├── order-service/
│   ├── Dockerfile
│   └── src/
├── product-service/
│   ├── Dockerfile
│   └── src/
└── shared/
    └── config/
```

### docker-compose.yml 完整配置

```yaml
version: '3.8'

services:
  # API 网关
  api-gateway:
    build: ./api-gateway
    ports:
      - "8080:8080"
    environment:
      - USER_SERVICE_URL=http://user-service:3001
      - ORDER_SERVICE_URL=http://order-service:3002
      - PRODUCT_SERVICE_URL=http://product-service:3003
    depends_on:
      - user-service
      - order-service
      - product-service
    networks:
      - microservices-network
    restart: always

  # 用户服务
  user-service:
    build: ./user-service
    environment:
      - DB_HOST=user-db
      - DB_PORT=5432
      - DB_NAME=users
      - DB_USER=postgres
      - DB_PASSWORD=secret
    depends_on:
      - user-db
    networks:
      - microservices-network
      - user-network
    restart: always

  # 订单服务
  order-service:
    build: ./order-service
    environment:
      - DB_HOST=order-db
      - DB_PORT=5432
      - DB_NAME=orders
      - DB_USER=postgres
      - DB_PASSWORD=secret
      - USER_SERVICE_URL=http://user-service:3001
      - PRODUCT_SERVICE_URL=http://product-service:3003
    depends_on:
      - order-db
      - user-service
      - product-service
    networks:
      - microservices-network
      - order-network
    restart: always

  # 商品服务
  product-service:
    build: ./product-service
    environment:
      - DB_HOST=product-db
      - DB_PORT=5432
      - DB_NAME=products
      - DB_USER=postgres
      - DB_PASSWORD=secret
    depends_on:
      - product-db
    networks:
      - microservices-network
      - product-network
    restart: always

  # 数据库服务
  user-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=users
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
    volumes:
      - user-db-data:/var/lib/postgresql/data
    networks:
      - user-network
    restart: always

  order-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=orders
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
    volumes:
      - order-db-data:/var/lib/postgresql/data
    networks:
      - order-network
    restart: always

  product-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=products
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
    volumes:
      - product-db-data:/var/lib/postgresql/data
    networks:
      - product-network
    restart: always

# 网络配置
networks:
  microservices-network:
    driver: bridge
  user-network:
    driver: bridge
  order-network:
    driver: bridge
  product-network:
    driver: bridge

# 数据卷
volumes:
  user-db-data:
  order-db-data:
  product-db-data:
```

### Dockerfile 示例（用户服务）

```dockerfile
# user-service/Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动命令
CMD ["node", "src/index.js"]
```

---

## 4 服务间通信

### REST API 通信

```javascript
// order-service/src/client.js
const axios = require('axios');

class UserServiceClient {
  constructor() {
    // 使用服务名作为主机名
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
  }

  async getUser(userId) {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }
}

module.exports = new UserServiceClient();
```

### 消息队列通信

```yaml
# 添加 RabbitMQ 到 docker-compose.yml
services:
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"   # AMQP 协议端口
      - "15672:15672" # 管理界面端口
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=secret
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - microservices-network
    restart: always

volumes:
  rabbitmq-data:
```

```javascript
// 生产者（订单服务）
const amqp = require('amqplib');

async function publishOrderCreated(order) {
  const connection = await amqp.connect('amqp://rabbitmq');
  const channel = await connection.createChannel();
  
  await channel.assertQueue('order_created');
  channel.sendToQueue('order_created', 
    Buffer.from(JSON.stringify(order))
  );
  
  console.log('Order created event published:', order.id);
  
  await channel.close();
  await connection.close();
}

// 消费者（通知服务）
async function consumeOrderCreated() {
  const connection = await amqp.connect('amqp://rabbitmq');
  const channel = await connection.createChannel();
  
  await channel.assertQueue('order_created');
  
  channel.consume('order_created', (msg) => {
    if (msg !== null) {
      const order = JSON.parse(msg.content.toString());
      console.log('Received order created event:', order.id);
      // 发送通知...
      channel.ack(msg);
    }
  });
}
```

---

## 5 服务发现

### 使用 Docker DNS

Docker Compose 自动提供 DNS 服务发现：

```javascript
// 直接使用服务名
const userServiceUrl = 'http://user-service:3001';
const orderServiceUrl = 'http://order-service:3002';

// Docker 会自动解析服务名到容器 IP
```

### 使用 Consul 服务发现

```yaml
# 添加 Consul 到 docker-compose.yml
services:
  consul:
    image: consul:1.15
    ports:
      - "8500:8500"  # Web UI
      - "8600:8600/udp"  # DNS
    networks:
      - microservices-network
    restart: always

  user-service:
    # ... 其他配置
    environment:
      - CONSUL_URL=http://consul:8500
      - SERVICE_NAME=user-service
      - SERVICE_PORT=3001
```

```javascript
// 服务注册
const Consul = require('consul');

const consul = new Consul({
  host: process.env.CONSUL_URL || 'consul',
  port: 8500
});

async function registerService() {
  await consul.agent.service.register({
    name: process.env.SERVICE_NAME,
    port: parseInt(process.env.SERVICE_PORT),
    check: {
      http: `http://localhost:${process.env.SERVICE_PORT}/health`,
      interval: '10s'
    }
  });
  console.log('Service registered with Consul');
}

// 服务发现
async function discoverService(serviceName) {
  const services = await consul.catalog.service.nodes(serviceName);
  return services;
}
```

---

## 6 API 网关

### 使用 Kong 网关

```yaml
# 添加 Kong 到 docker-compose.yml
services:
  kong:
    image: kong:3.4
    environment:
      - KONG_DATABASE=off
      - KONG_PROXY_ACCESS_LOG=/dev/stdout
      - KONG_ADMIN_ACCESS_LOG=/dev/stdout
      - KONG_PROXY_ERROR_LOG=/dev/stderr
      - KONG_ADMIN_ERROR_LOG=/dev/stderr
      - KONG_ADMIN_LISTEN=0.0.0.0:8001
    ports:
      - "8000:8000"  # 代理端口
      - "8443:8443"  # HTTPS 代理
      - "8001:8001"  # 管理 API
    networks:
      - microservices-network
    restart: always

  kong-migration:
    image: kong:3.4
    command: kong bootstrap -v
    networks:
      - microservices-network
    depends_on:
      - kong
```

```bash
# 注册服务
curl -i -X POST http://localhost:8001/services/ \
  --data name=user-service \
  --data url='http://user-service:3001'

# 注册路由
curl -i -X POST http://localhost:8001/services/user-service/routes \
  --data 'paths[]=/users'

# 访问服务
curl http://localhost:8000/users/123
```

### 使用 Nginx 作为网关

```nginx
# nginx.conf
upstream user_service {
    server user-service:3001;
}

upstream order_service {
    server order-service:3002;
}

upstream product_service {
    server product-service:3003;
}

server {
    listen 80;

    location /users {
        proxy_pass http://user_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /orders {
        proxy_pass http://order_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /products {
        proxy_pass http://product_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 7 配置管理

### 使用环境变量

```yaml
# docker-compose.yml
services:
  user-service:
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - DB_HOST=user-db
      - DB_PORT=5432
      - DB_NAME=users
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
```

```bash
# .env 文件
DB_USER=postgres
DB_PASSWORD=secret123
JWT_SECRET=your-jwt-secret
```

### 使用配置中心

```yaml
# 添加 etcd 到 docker-compose.yml
services:
  etcd:
    image: bitnami/etcd:3.5
    environment:
      - ALLOW_NONE_AUTHENTICATION=yes
      - ETCD_ADVERTISE_CLIENT_URLS=http://etcd:2379
    ports:
      - "2379:2379"
    networks:
      - microservices-network
    restart: always
```

```javascript
// 从 etcd 读取配置
const Etcd3 = require('etcd3');

const client = new Etcd3.Etcd3({
  hosts: 'http://etcd:2379'
});

async function loadConfig() {
  const config = await client.get('config/user-service').string();
  return JSON.parse(config);
}
```

---

## 8 链路追踪

### 使用 Jaeger

```yaml
# 添加 Jaeger 到 docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:1.47
    ports:
      - "6831:6831/udp"  # Jaeger agent
      - "16686:16686"    # Jaeger UI
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    networks:
      - microservices-network
    restart: always

  user-service:
    environment:
      - JAEGER_AGENT_HOST=jaeger
      - JAEGER_AGENT_PORT=6831
      - JAEGER_SERVICE_NAME=user-service
```

```javascript
// 初始化 Jaeger
const initTracer = require('jaeger-client').initTracer;

const config = {
  serviceName: process.env.JAEGER_SERVICE_NAME,
  reporter: {
    agentHost: process.env.JAEGER_AGENT_HOST,
    agentPort: process.env.JAEGER_AGENT_PORT
  },
  sampler: {
    type: 'const',
    param: 1
  }
};

const tracer = initTracer(config);

// 在请求中使用
app.get('/users/:id', (req, res) => {
  const span = tracer.startSpan('get_user');
  
  // 业务逻辑...
  
  span.finish();
});
```

---

## 9 完整部署流程

### 1. 构建所有服务

```bash
# 构建所有镜像
docker-compose build

# 或者单独构建某个服务
docker-compose build user-service
```

### 2. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 验证服务

```bash
# 测试 API 网关
curl http://localhost:8080/users

# 查看服务健康状态
curl http://localhost:8080/health

# 访问 Jaeger UI
open http://localhost:16686
```

### 4. 扩展服务

```bash
# 扩展订单服务到 3 个实例
docker-compose up -d --scale order-service=3

# 查看运行中的容器
docker-compose ps
```

---

## 10 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 服务拆分 | 按业务领域拆分，单一职责原则 |
| 服务通信 | REST API、消息队列、gRPC |
| 服务发现 | Docker DNS、Consul、etcd |
| API 网关 | Kong、Nginx、Traefik |
| 配置管理 | 环境变量、配置中心 |
| 链路追踪 | Jaeger、Zipkin |
| 容器编排 | Docker Compose、Kubernetes |

---

## 11 新手常见误区

### 误区 1："微服务越小越好"

**错！** 过度拆分会增加复杂度。应该按业务边界合理拆分，避免过细。

### 误区 2："微服务不需要 API 网关"

不是的。API 网关提供统一入口、负载均衡、认证授权等功能，是微服务架构的重要组成部分。

### 误区 3："所有服务都要用同一种技术"

不是的。微服务的优势之一就是技术多样性，不同服务可以选择最适合的技术栈。

### 误区 4："微服务可以独立部署，不需要考虑依赖"

不是的。虽然服务可以独立部署，但需要考虑服务间的依赖关系和版本兼容性。

---

## 12 动手练习

### 练习 1：搭建简单的微服务

创建两个服务（用户服务和订单服务），实现基本的 CRUD 功能。

<details>
<summary>点击查看答案</summary>

```yaml
# docker-compose.yml
version: '3.8'

services:
  user-service:
    build: ./user-service
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=user-db
    depends_on:
      - user-db
    networks:
      - app-network

  order-service:
    build: ./order-service
    ports:
      - "3002:3002"
    environment:
      - DB_HOST=order-db
      - USER_SERVICE_URL=http://user-service:3001
    depends_on:
      - order-db
      - user-service
    networks:
      - app-network

  user-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=users
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
    volumes:
      - user-db-data:/var/lib/postgresql/data
    networks:
      - app-network

  order-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=orders
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
    volumes:
      - order-db-data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  user-db-data:
  order-db-data:
```

```javascript
// user-service/src/index.js
const express = require('express');
const app = express();

app.use(express.json());

const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

app.get('/users', (req, res) => {
  res.json(users);
});

app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.listen(3001, () => {
  console.log('User service running on port 3001');
});
```

```javascript
// order-service/src/index.js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const orders = [];

app.post('/orders', async (req, res) => {
  const { userId, productId } = req.body;
  
  // 调用用户服务验证用户
  try {
    const userResponse = await axios.get(`http://user-service:3001/users/${userId}`);
    const user = userResponse.data;
    
    const order = {
      id: orders.length + 1,
      userId,
      productId,
      userName: user.name,
      createdAt: new Date()
    };
    
    orders.push(order);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: 'Invalid user' });
  }
});

app.get('/orders', (req, res) => {
  res.json(orders);
});

app.listen(3002, () => {
  console.log('Order service running on port 3002');
});
```

</details>

### 练习 2：添加 API 网关

为上面的微服务添加 Nginx 作为 API 网关。

<details>
<summary>点击查看答案</summary>

```yaml
# 在 docker-compose.yml 中添加
services:
  api-gateway:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - user-service
      - order-service
    networks:
      - app-network
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream user_service {
        server user-service:3001;
    }

    upstream order_service {
        server order-service:3002;
    }

    server {
        listen 80;

        location /users {
            proxy_pass http://user_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /orders {
            proxy_pass http://order_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

```bash
# 测试
curl http://localhost:8080/users
curl http://localhost:8080/orders
```

</details>

### 练习 3（挑战）：添加消息队列

为微服务添加 RabbitMQ，实现异步通信。

<details>
<summary>点击查看答案</summary>

```yaml
# 在 docker-compose.yml 中添加
services:
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=secret
    networks:
      - app-network

  user-service:
    environment:
      - RABBITMQ_URL=amqp://admin:secret@rabbitmq:5672

  order-service:
    environment:
      - RABBITMQ_URL=amqp://admin:secret@rabbitmq:5672
```

```javascript
// order-service/src/events.js
const amqp = require('amqplib');

let connection;
let channel;

async function initRabbitMQ() {
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue('order_created');
  console.log('Connected to RabbitMQ');
}

async function publishOrderCreated(order) {
  await channel.sendToQueue(
    'order_created',
    Buffer.from(JSON.stringify(order))
  );
  console.log('Published order created event:', order.id);
}

module.exports = { initRabbitMQ, publishOrderCreated };
```

```javascript
// notification-service/src/index.js
const amqp = require('amqplib');

async function startConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  
  await channel.assertQueue('order_created');
  
  console.log('Waiting for messages...');
  
  channel.consume('order_created', (msg) => {
    if (msg !== null) {
      const order = JSON.parse(msg.content.toString());
      console.log('Received order:', order);
      // 发送通知...
      channel.ack(msg);
    }
  });
}

startConsumer();
```

</details>

---

## 下一章预告

下一章我们会学习**生产环境最佳实践**——如何在生产环境中安全、高效地运行 Docker 容器。你会学到资源限制、日志管理、监控告警、安全加固等关键技能。
