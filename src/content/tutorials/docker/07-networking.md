---
title: "第7章：Docker 网络"
description: "网络模式、自定义网络、容器间通信"
---

# 第7章：Docker 网络

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 容器之间如何通信？
- 容器如何访问外部网络？
- 不同的网络模式有什么区别？
- 如何创建自定义网络？

这一章会教你 Docker 的网络机制。学会这些，你就能让容器之间、容器与外部世界正常通信了。

---

## 1 为什么需要理解 Docker 网络？

### 痛点分析

很多新手在使用 Docker 时遇到这些问题：

- 容器之间无法互相访问
- 容器无法访问外网
- 端口映射搞不清楚
- 不知道用什么网络模式

### 解决方案

理解 Docker 网络，你可以：

- 让容器之间正常通信
- 控制容器的网络访问
- 选择合适的网络模式
- 排查网络问题

---

## 2 Docker 网络模式

### 默认网络

Docker 安装后会创建三个默认网络：

```bash
# ❶ 查看所有网络
docker network ls

# 输出示例：
# NETWORK ID     NAME      DRIVER    SCOPE
# xxx            bridge    bridge    local    ← 默认桥接网络
# xxx            host      host      local    ← 主机网络
# xxx            none      null      local    ← 无网络
```

### bridge 模式（默认）

```bash
# ❶ 容器使用 bridge 网络（默认）
docker run -d --network bridge nginx

# ❷ 等同于
docker run -d nginx
```

**特点**：
- 容器有独立的网络栈
- 容器之间通过 IP 地址通信
- 需要端口映射才能从宿主机访问

**原理**：
```
宿主机
├── docker0（虚拟网桥）
│   ├── 容器1 (172.17.0.2)
│   ├── 容器2 (172.17.0.3)
│   └── 容器3 (172.17.0.4)
```

### host 模式

```bash
# ❶ 使用 host 网络
docker run -d --network host nginx

# ❷ 容器直接使用宿主机的网络
# 不需要端口映射，容器监听 80 端口，宿主机 80 端口就能访问
```

**特点**：
- 容器和宿主机共享网络命名空间
- 性能最好（没有 NAT 转换）
- 端口冲突风险高

**适用场景**：
- 对网络性能要求极高的应用
- 不需要端口隔离的场景

### none 模式

```bash
# ❶ 使用 none 网络
docker run -d --network none alpine sleep 3600

# ❷ 容器没有网络接口（只有 loopback）
docker exec <container_id> ip addr
# 只有 127.0.0.1
```

**特点**：
- 完全隔离的网络
- 需要手动配置网络

**适用场景**：
- 对安全性要求极高的场景
- 特殊网络配置需求

### container 模式

```bash
# ❶ 运行第一个容器
docker run -d --name container1 nginx

# ❷ 第二个容器使用第一个容器的网络
docker run -d --network container:container1 alpine sleep 3600

# ❸ 两个容器共享同一个网络命名空间
# 它们可以通过 localhost 互相访问
```

**特点**：
- 两个容器共享网络栈
- 可以通过 localhost 互相通信
- 端口冲突风险

---

## 3 自定义网络

### 创建自定义网络

```bash
# ❶ 创建 bridge 网络
docker network create my-network

# ❷ 创建指定子网的网络
docker network create \
  --subnet 192.168.1.0/24 \
  --gateway 192.168.1.1 \
  my-network

# ❸ 创建 overlay 网络（跨主机）
docker network create -d overlay my-overlay-network
```

### 使用自定义网络

```bash
# ❶ 运行容器并连接到自定义网络
docker run -d --network my-network --name web1 nginx

# ❷ 运行另一个容器
docker run -d --network my-network --name web2 nginx

# ❸ 容器之间可以通过容器名互相访问
docker exec web1 ping web2
# 能 ping 通
```

### 自定义网络的优势

| 特性 | 默认 bridge | 自定义 bridge |
| --- | --- | --- |
| DNS 解析 | 不支持容器名 | 支持容器名 |
| 隔离性 | 所有容器在同一网络 | 可以创建多个隔离网络 |
| 连接管理 | 需要手动配置 | 自动 DNS 解析 |

---

## 4 容器间通信

### 使用容器名通信

```bash
# ❶ 创建自定义网络
docker network create app-network

# ❷ 运行 MySQL
docker run -d \
  --network app-network \
  --name mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0

# ❸ 运行应用容器
docker run -d \
  --network app-network \
  --name app \
  -e DB_HOST=mysql \
  myapp

# ❹ 应用中可以直接用 "mysql" 作为主机名
# jdbc:mysql://mysql:3306/mydb
```

### 使用 IP 地址通信

```bash
# ❶ 查看容器 IP
docker inspect -f '{{.NetworkSettings.IPAddress}}' mysql

# ❷ 使用 IP 地址连接
# jdbc:mysql://172.18.0.2:3306/mydb
```

> 建议：使用容器名而不是 IP 地址，因为 IP 可能会变。

---

## 5 端口映射

### 基础端口映射

```bash
# ❶ 映射单个端口
docker run -d -p 8080:80 nginx

# ❷ 映射多个端口
docker run -d \
  -p 8080:80 \
  -p 8443:443 \
  nginx

# ❸ 映射端口范围
docker run -d -p 8000-8010:80-90 nginx

# ❹ 指定绑定 IP
docker run -d -p 127.0.0.1:8080:80 nginx
```

### 随机端口映射

```bash
# ❶ 随机映射到宿主机端口
docker run -d -p 80 nginx

# ❷ 查看映射的端口
docker port <container_name>
# 输出类似：80/tcp -> 0.0.0.0:32768
```

### 端口映射原理

```
外部请求 → 宿主机:8080 → Docker → 容器:80
```

---

## 6 网络操作命令

### 查看网络

```bash
# ❶ 查看所有网络
docker network ls

# ❷ 查看网络详情
docker network inspect my-network

# ❸ 查看容器连接的网络
docker inspect -f '{{json .NetworkSettings.Networks}}' my-container | jq
```

### 管理网络连接

```bash
# ❶ 连接容器到网络
docker network connect my-network my-container

# ❷ 断开容器的网络连接
docker network disconnect my-network my-container

# ❸ 删除网络
docker network rm my-network

# ❹ 删除所有未使用的网络
docker network prune
```

---

## 7 DNS 配置

### 自定义 DNS

```bash
# ❶ 指定 DNS 服务器
docker run -d \
  --dns 8.8.8.8 \
  --dns 8.8.4.4 \
  nginx

# ❷ 指定 DNS 搜索域
docker run -d \
  --dns-search example.com \
  nginx
```

### 容器内 DNS 配置

```bash
# 查看容器内的 DNS 配置
docker exec my-container cat /etc/resolv.conf

# 输出示例：
# nameserver 127.0.0.11
# options ndots:0
```

> Docker 内置了 DNS 服务器（127.0.0.11），用于容器名解析。

---

## 8 网络最佳实践

### 1. 使用自定义网络

```bash
# 推荐
docker network create app-network
docker run -d --network app-network myapp

# 不推荐（使用默认 bridge）
docker run -d myapp
```

### 2. 使用容器名通信

```bash
# 推荐
docker exec app ping mysql

# 不推荐
docker exec app ping 172.18.0.2
```

### 3. 合理划分网络

```bash
# 前端网络
docker network create frontend-network

# 后端网络
docker network create backend-network

# 数据库网络（私有）
docker network create db-network
```

### 4. 限制网络访问

```bash
# 使用防火墙或网络策略限制访问
# 例如：只允许特定 IP 访问数据库端口
```

---

## 9 核心知识点总结

| 网络模式 | 说明 | 适用场景 |
| --- | --- | --- |
| bridge | 默认模式，容器有独立网络栈 | 大多数场景 |
| host | 共享宿主机网络 | 高性能需求 |
| none | 无网络 | 高安全需求 |
| container | 共享其他容器的网络 | 特殊场景 |
| 自定义 bridge | 用户创建的网络 | 生产环境推荐 |

---

## 10 新手常见误区

### 误区 1："容器之间默认可以互相访问"

**错！** 默认 bridge 网络下，容器之间可以通过 IP 访问，但不能通过容器名。自定义 bridge 网络才支持容器名解析。

### 误区 2："端口映射是自动的"

不是的。必须使用 `-p` 参数显式映射端口，否则外部无法访问容器内的服务。

### 误区 3："host 模式是最好的选择"

不是的。host 模式虽然性能好，但失去了网络隔离，端口冲突风险高。大多数场景应该用 bridge 模式。

### 误区 4："容器删除后网络配置还在"

不是的。容器删除后，它在自定义网络中的连接也会自动删除。但网络本身还在，除非手动删除。

---

## 11 动手练习

### 练习 1：自定义网络通信

创建自定义网络，运行两个容器，验证它们可以通过容器名互相访问。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 创建自定义网络
docker network create my-network

# ❷ 运行两个容器
docker run -d --network my-network --name web1 nginx
docker run -d --network my-network --name web2 nginx

# ❸ 从 web1 ping web2
docker exec web1 ping -c 3 web2
# 能 ping 通

# ❹ 从 web2 ping web1
docker exec web2 ping -c 3 web1
# 能 ping 通

# ❺ 清理
docker stop web1 web2
docker rm web1 web2
docker network rm my-network
```

</details>

### 练习 2：前后端分离应用网络

创建一个前端容器和后端容器，让它们能够互相通信。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 创建应用网络
docker network create app-network

# ❷ 运行后端 API（模拟）
docker run -d \
  --network app-network \
  --name api \
  -e PORT=3000 \
  alpine/socat \
  tcp-listen:3000,fork tcp-connect:localhost:3000

# ❸ 运行前端容器
docker run -d \
  --network app-network \
  --name frontend \
  -p 8080:80 \
  nginx

# ❹ 前端可以通过 "api" 访问后端
# 例如：fetch('http://api:3000/data')

# ❺ 验证网络连通性
docker exec frontend ping -c 3 api

# ❻ 清理
docker stop api frontend
docker rm api frontend
docker network rm app-network
```

</details>

### 练习 3（挑战）：多网络隔离

创建一个应用容器连接到多个网络，验证网络隔离。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 创建两个网络
docker network create frontend
docker network create backend

# ❷ 运行数据库（只在 backend 网络）
docker run -d \
  --network backend \
  --name db \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0

# ❸ 运行 Web 服务器（只在 frontend 网络）
docker run -d \
  --network frontend \
  --name web \
  nginx

# ❹ 运行应用容器（连接两个网络）
docker run -d \
  --network frontend \
  --name app \
  alpine sleep 3600

docker network connect backend app

# ❺ 验证：app 可以访问 db 和 web
docker exec app ping -c 2 db
docker exec app ping -c 2 web

# ❻ 验证：web 不能访问 db
docker exec web ping -c 2 db
# ping 不通

# ❼ 清理
docker stop db web app
docker rm db web app
docker network rm frontend backend
```

</details>

---

## 下一章预告

下一章我们会学习 **Docker Compose**——一个用来定义和运行多容器应用的工具。你会学到如何用 YAML 文件配置多个服务，一键启动整个应用栈。再也不用手动一个个运行容器了。