---
title: '第八章：Ingress 与 Ingress 控制器'
description: '掌握 Ingress 的配置、路由规则、TLS 终止和常用 Ingress 控制器的使用'
---

# 第八章：Ingress 与 Ingress 控制器

## 本章导读

在前一章中，我们学习了 Service 的几种类型。但如果要暴露多个 HTTP/HTTPS 服务，为每个服务创建一个 LoadBalancer 太浪费了。这一章要讲解 Kubernetes 中的七层路由方案——**Ingress**。

本章你会学到：

- 为什么需要 Ingress？Service 的不足是什么？
- Ingress 资源怎么配置？路由规则怎么写？
- Ingress 控制器是什么？有哪些选择？
- 如何配置 HTTPS/TLS 终止？
- 如何实现基于域名和路径的路由？

打个比方：Service 的 LoadBalancer 就像每个应用都有自己的大门和保安；Ingress 就像一栋写字楼的统一前台，所有访客先到前台，前台根据访客要找的公司（域名/路径）引导到不同的楼层（应用）。

---

## 1 为什么需要 Ingress？

### Service 的局限性

假设你有三个 Web 应用要暴露到外部：

```
❌ 使用 LoadBalancer Service：

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  LoadBalancer 1 │  │  LoadBalancer 2 │  │  LoadBalancer 3 │
│  IP: 203.0.113.1│  │  IP: 203.0.113.2│  │  IP: 203.0.113.3│
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │  App 1  │          │  App 2  │          │  App 3  │
    └─────────┘          └─────────┘          └─────────┘

问题：
1. 每个应用需要一个 LoadBalancer，成本高
2. 需要多个外部 IP，IP 资源有限
3. 无法统一处理 HTTPS、认证、限流
```

### Ingress 的解决方案

```
✅ 使用 Ingress：

                    ┌──────────────────┐
                    │   LoadBalancer   │
                    │  IP: 203.0.113.1 │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │     Ingress      │
                    │  （七层路由）      │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
         │  App 1  │    │  App 2  │    │  App 3  │
         │app1.com │    │app2.com │    │ /app3   │
         └─────────┘    └─────────┘    └─────────┘

优势：
1. 只需要一个 LoadBalancer，节省成本
2. 根据域名/路径路由到不同应用
3. 统一处理 HTTPS、认证、限流
```

### Ingress 的核心能力

| 能力 | 说明 | 类比 |
| --- | --- | --- |
| 七层路由 | 基于 HTTP/HTTPS 的域名、路径路由 | 写字楼前台根据访客目的引导到不同楼层 |
| TLS 终止 | 统一处理 HTTPS 证书 | 大楼统一配备安检设备 |
| 名称虚拟主机 | 多个域名共用一个 IP | 同一栋楼可以有多个公司地址 |
| 负载均衡 | 在应用层面做负载均衡 | 前台把访客均匀分配到多个电梯 |

---

## 2 Ingress 资源

### 基本结构

```yaml
# Ingress 资源示例
apiVersion: networking.k8s.io/v1      # API 版本
kind: Ingress                         # 资源类型
metadata:
  name: simple-ingress                # Ingress 名称
  annotations:                        # 注解（Ingress 控制器特定的配置）
    nginx.ingress.kubernetes.io/rewrite-target: /  # 重写规则
spec:
  ingressClassName: nginx             # Ingress 控制器类
  rules:                              # 路由规则
  - host: app1.example.com            # 域名
    http:
      paths:                          # 路径规则
      - path: /                       # 路径
        pathType: Prefix              # 路径类型
        backend:                      # 后端服务
          service:
            name: app1-service        # Service 名称
            port:
              number: 80              # Service 端口
```

### 关键字段说明

| 字段 | 说明 | 示例 |
| --- | --- | --- |
| `ingressClassName` | 指定 Ingress 控制器 | `nginx`、`traefik` |
| `rules` | 路由规则列表 | 域名 + 路径 → 后端 |
| `host` | 匹配的域名 | `app1.example.com` |
| `path` | 匹配的 URL 路径 | `/api`、`/` |
| `pathType` | 路径匹配类型 | `Prefix`、`Exact`、`ImplementationSpecific` |
| `backend.service.name` | 后端 Service 名称 | `app1-service` |
| `backend.service.port.number` | 后端 Service 端口 | `80` |

### pathType 的三种类型

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| `Prefix` | 前缀匹配 | `/api` 匹配 `/api`、`/api/v1`、`/api/users` |
| `Exact` | 精确匹配 | `/api` 只匹配 `/api`，不匹配 `/api/v1` |
| `ImplementationSpecific` | 取决于 Ingress 控制器的实现 | 不同控制器行为可能不同 |

```
路径匹配示例：

规则：path=/api, pathType=Prefix
✅ 匹配：/api、/api/、/api/v1、/api/users
❌ 不匹配：/apiv1、/swagger/api

规则：path=/api, pathType=Exact
✅ 匹配：/api
❌ 不匹配：/api/、/api/v1、/api/users
```

---

## 3 Ingress 控制器

### 什么是 Ingress 控制器？

Ingress 资源本身只是路由规则的**声明**，真正执行路由的是 **Ingress 控制器**。

```
Ingress 资源（YAML）
    ↓
    ↓ 声明路由规则
    ↓
Ingress 控制器（软件）
    ↓
    ↓ 监听 Ingress 资源变化
    ↓
    ↓ 动态生成反向代理配置
    ↓
    ↓ 处理实际的 HTTP 请求
    ↓
后端 Service → Pod
```

打个比方：Ingress 资源就像"菜单"，定义了有哪些菜品（路由规则）；Ingress 控制器就像"厨师"，根据菜单做菜（实际处理请求）。

### 常用的 Ingress 控制器

| 控制器 | 特点 | 适用场景 |
| --- | --- | --- |
| **Nginx Ingress Controller** | 基于 Nginx，功能丰富，社区活跃 | 通用场景，最流行 |
| **Traefik** | 自动服务发现，配置简单 | 云原生环境，自动化程度高 |
| **HAProxy Ingress** | 高性能，低延迟 | 高性能要求场景 |
| **Kong** | API 网关功能丰富 | API 管理、微服务网关 |
| **AWS ALB Ingress Controller** | 集成 AWS ALB | AWS 环境 |

### 安装 Nginx Ingress Controller

```bash
# 使用 Helm 安装
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# 安装
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# 查看安装状态
kubectl get pods -n ingress-nginx
kubectl get services -n ingress-nginx
```

---

## 4 路由规则

### 基于域名的路由

```yaml
# 基于域名的路由
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: domain-routing              # Ingress 名称
spec:
  ingressClassName: nginx
  rules:
  # 规则 1：app1.example.com → app1-service
  - host: app1.example.com          # 域名
    http:
      paths:
      - path: /                     # 所有路径
        pathType: Prefix
        backend:
          service:
            name: app1-service      # 后端 Service
            port:
              number: 80
  # 规则 2：app2.example.com → app2-service
  - host: app2.example.com          # 域名
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app2-service
            port:
              number: 80
```

```
路由逻辑：

请求 → Ingress
  ├── Host: app1.example.com → app1-service
  └── Host: app2.example.com → app2-service
```

### 基于路径的路由

```yaml
# 基于路径的路由
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-routing                # Ingress 名称
spec:
  ingressClassName: nginx
  rules:
  - host: example.com               # 统一域名
    http:
      paths:
      # 规则 1：/api → api-service
      - path: /api                  # API 路径
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      # 规则 2：/admin → admin-service
      - path: /admin                # 管理后台路径
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
      # 规则 3：/ → frontend-service（默认）
      - path: /                     # 前端路径
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

```
路由逻辑：

请求 → Ingress（example.com）
  ├── /api/*    → api-service
  ├── /admin/*  → admin-service
  └── /*        → frontend-service
```

### 混合路由（域名 + 路径）

```yaml
# 混合路由
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mixed-routing               # Ingress 名称
spec:
  ingressClassName: nginx
  rules:
  # 域名 1：api.example.com
  - host: api.example.com
    http:
      paths:
      - path: /v1                   # /v1 → api-v1-service
        pathType: Prefix
        backend:
          service:
            name: api-v1-service
            port:
              number: 80
      - path: /v2                   # /v2 → api-v2-service
        pathType: Prefix
        backend:
          service:
            name: api-v2-service
            port:
              number: 80
  # 域名 2：www.example.com
  - host: www.example.com
    http:
      paths:
      - path: /                     # / → web-service
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

---

## 5 TLS/HTTPS 配置

### 为什么需要 TLS？

HTTP 是明文传输，数据容易被窃听或篡改。HTTPS 通过 TLS 加密，保证数据传输安全。

### 配置 TLS

```yaml
# TLS 配置
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress                 # Ingress 名称
spec:
  ingressClassName: nginx
  tls:                              # TLS 配置
  - hosts:                          # 适用的域名列表
    - app.example.com
    secretName: tls-secret          # TLS 证书的 Secret 名称
  rules:
  - host: app.example.com           # 域名
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80
```

### 创建 TLS Secret

```bash
# 生成自签名证书（测试用）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=app.example.com"

# 创建 TLS Secret
kubectl create secret tls tls-secret \
  --cert=tls.crt \
  --key=tls.key

# 查看 Secret
kubectl get secret tls-secret
```

```yaml
# TLS Secret 结构
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret                  # Secret 名称
type: kubernetes.io/tls             # 类型：TLS
data:
  tls.crt: <base64 编码的证书>       # 证书内容
  tls.key: <base64 编码的私钥>       # 私钥内容
```

### TLS 终止的位置

```
客户端 → HTTPS → Ingress（TLS 终止）→ HTTP → Service → Pod

Ingress 控制器负责：
1. 接收 HTTPS 请求
2. 解密请求（TLS 终止）
3. 将 HTTP 请求转发给后端 Service
```

---

## 6 高级功能

### 重写规则（Rewrite）

```yaml
# 重写规则
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rewrite-ingress             # Ingress 名称
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2  # 重写目标
spec:
  ingressClassName: nginx
  rules:
  - host: example.com
    http:
      paths:
      - path: /api(/|$)(.*)         # 匹配 /api 及其子路径
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

```
重写逻辑：

请求：http://example.com/api/users
  ↓ Ingress 匹配 /api(/|$)(.*)
  ↓ 捕获组：$2 = users
  ↓ 重写为：/users
  ↓ 转发到：api-service/users

请求：http://example.com/api/v1/products
  ↓ 重写为：/v1/products
  ↓ 转发到：api-service/v1/products
```

### 限流（Rate Limiting）

```yaml
# 限流配置
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rate-limit-ingress          # Ingress 名称
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "10"      # 每秒请求数限制
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"  # 突发倍数
spec:
  ingressClassName: nginx
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

### 基本认证（Basic Auth）

```yaml
# 基本认证配置
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: auth-ingress                # Ingress 名称
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic       # 认证类型
    nginx.ingress.kubernetes.io/auth-secret: basic-auth  # 认证 Secret
    nginx.ingress.kubernetes.io/auth-realm: "Authentication Required"  # 认证域
spec:
  ingressClassName: nginx
  rules:
  - host: admin.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
```

```bash
# 创建基本认证 Secret
# 先生成密码文件
htpasswd -c auth admin

# 创建 Secret
kubectl create secret generic basic-auth \
  --from-file=auth
```

---

## 7 Ingress 与 Service 类型对比

| 对比项 | NodePort | LoadBalancer | Ingress |
| --- | --- | --- | --- |
| OSI 层级 | 四层（TCP/UDP） | 四层 | 七层（HTTP/HTTPS） |
| 路由能力 | 无 | 无 | 基于域名/路径路由 |
| TLS 终止 | 不支持 | 部分支持 | 支持 |
| 多服务共用 | 每个服务一个端口 | 每个服务一个 LB | 多个服务共用一个 IP |
| 成本 | 低（但端口有限） | 高（每个 LB 收费） | 低（一个 LB 足够） |
| 适用场景 | 开发测试 | 生产环境（非 HTTP） | 生产环境（HTTP/HTTPS） |

```
选择建议：

- 开发测试环境 → NodePort（简单快速）
- 生产环境 TCP/UDP 服务（如数据库）→ LoadBalancer
- 生产环境 HTTP/HTTPS 服务 → Ingress（推荐）
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Ingress 的作用 | 七层路由、TLS 终止、名称虚拟主机 |
| Ingress 资源 | 声明路由规则（域名、路径 → 后端） |
| Ingress 控制器 | 实际执行路由的软件（Nginx、Traefik 等） |
| pathType | `Prefix`（前缀）、`Exact`（精确）、`ImplementationSpecific` |
| 基于域名路由 | 不同域名路由到不同服务 |
| 基于路径路由 | 不同路径路由到不同服务 |
| TLS 配置 | 通过 Secret 存储证书，Ingress 统一处理 HTTPS |
| 高级功能 | 重写、限流、认证等（通过 annotations 配置） |

---

## 9 新手常见误区

### 误区 1："Ingress 可以替代 Service"

❌ 错误理解：有了 Ingress 就不需要 Service 了。

✅ 正确理解：Ingress 和 Service 是互补的。Ingress 是七层路由，负责将 HTTP/HTTPS 请求分发到不同的 Service；Service 是四层负载均衡，负责将流量分发到 Pod。Ingress 的后端必须是 Service，不能直接指向 Pod。

### 误区 2："任何 Ingress 控制器都支持所有 annotations"

❌ 错误理解：重写、限流等 annotations 在所有 Ingress 控制器中都通用。

✅ 正确理解：不同 Ingress 控制器支持的 annotations 不同。比如 `nginx.ingress.kubernetes.io/rewrite-target` 只对 Nginx Ingress Controller 有效，Traefik 有自己的 annotations 格式。切换控制器时需要调整 annotations。

### 误区 3："Ingress 可以处理所有类型的流量"

❌ 错误理解：Ingress 可以路由 TCP、UDP、HTTP 等所有协议。

✅ 正确理解：标准 Ingress 只支持 HTTP 和 HTTPS（七层协议）。对于 TCP/UDP（如数据库、DNS），需要使用其他方案：LoadBalancer Service、NodePort、或者特定的 Ingress 控制器扩展（如 Nginx Ingress Controller 的 TCP/UDP 配置）。

### 误区 4："TLS 证书应该放在 Pod 里"

❌ 错误理解：每个 Pod 自己处理 HTTPS，Ingress 只负责路由。

✅ 正确理解：最佳实践是在 Ingress 层统一处理 TLS 终止。Ingress 接收 HTTPS 请求，解密后以 HTTP 转发给后端 Pod。这样 Pod 不需要管理证书，简化了部署。如果需要端到端加密，可以配置 Ingress 到后端的 HTTPS（后端也需要证书）。

### 误区 5："Ingress 规则修改后立即生效"

❌ 错误理解：apply Ingress YAML 后，路由立即生效。

✅ 正确理解：Ingress 控制器需要监听 API Server 的变化，重新生成配置，然后重新加载（如 Nginx reload）。这个过程通常需要几秒到几十秒。在大规模集群中，可能需要更长时间。可以通过 `kubectl describe ingress` 查看状态。

---

## 10 动手练习

### 练习 1：创建基于域名的 Ingress

创建一个 Ingress，配置两个域名 `app1.example.com` 和 `app2.example.com`，分别路由到不同的 Service。

<details>
<summary>点击查看答案</summary>

```yaml
# 基于域名的 Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: domain-ingress              # Ingress 名称
spec:
  ingressClassName: nginx           # Ingress 控制器
  rules:
  # 规则 1：app1.example.com
  - host: app1.example.com          # 域名
    http:
      paths:
      - path: /                     # 所有路径
        pathType: Prefix
        backend:
          service:
            name: app1-service      # 后端 Service
            port:
              number: 80
  # 规则 2：app2.example.com
  - host: app2.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app2-service
            port:
              number: 80
```

```bash
# 创建 Ingress
kubectl apply -f domain-ingress.yaml

# 查看 Ingress
kubectl get ingress

# 测试（需要修改 hosts 文件或配置 DNS）
curl http://app1.example.com
curl http://app2.example.com
```

</details>

### 练习 2：配置 TLS/HTTPS

为练习 1 的 Ingress 添加 TLS 配置，使用自签名证书，启用 HTTPS。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=app1.example.com"

# 第二步：创建 TLS Secret
kubectl create secret tls tls-secret \
  --cert=tls.crt \
  --key=tls.key
```

```yaml
# 带 TLS 的 Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress                 # Ingress 名称
spec:
  ingressClassName: nginx
  tls:                              # TLS 配置
  - hosts:
    - app1.example.com              # 适用的域名
    secretName: tls-secret          # TLS Secret 名称
  rules:
  - host: app1.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app1-service
            port:
              number: 80
```

```bash
# 创建 Ingress
kubectl apply -f tls-ingress.yaml

# 测试 HTTPS
curl -k https://app1.example.com
```

</details>

### 练习 3（挑战）：配置基于路径的路由和重写规则

创建一个 Ingress，配置基于路径的路由：`/api` 路由到 api-service，`/admin` 路由到 admin-service，其他路径路由到 frontend-service。为 `/api` 配置重写规则，去掉 `/api` 前缀。

<details>
<summary>点击查看答案</summary>

```yaml
# 基于路径的 Ingress + 重写
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-rewrite-ingress        # Ingress 名称
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2  # 重写目标
spec:
  ingressClassName: nginx
  rules:
  - host: example.com
    http:
      paths:
      # /api 路径，带重写
      - path: /api(/|$)(.*)         # 匹配 /api 及其子路径
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      # /admin 路径
      - path: /admin                # 匹配 /admin
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
      # 默认路径
      - path: /                     # 匹配其他路径
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

```bash
# 创建 Ingress
kubectl apply -f path-rewrite-ingress.yaml

# 测试路由
curl http://example.com/api/users      # 转发到 api-service/users
curl http://example.com/admin/dashboard # 转发到 admin-service/admin/dashboard
curl http://example.com/                # 转发到 frontend-service/
```

</details>

---

## 总结

恭喜你完成了 Kubernetes 教程的前八章！你已经掌握了：

1. **Kubernetes 简介与环境搭建** - 了解了 K8s 的架构和安装
2. **核心概念详解** - 掌握了 Pod、Node、Cluster、Namespace 等基础概念
3. **Pod 基础** - 学会了 Pod 的 YAML 定义、多容器模式、探针机制
4. **Label 与 Selector** - 理解了资源组织和筛选的方法
5. **Namespace 与资源配额** - 学会了资源隔离和配额管理
6. **Deployment 控制器** - 掌握了滚动更新、回滚、扩缩容
7. **Service 服务发现** - 理解了 Service 的类型和负载均衡
8. **Ingress 与 Ingress 控制器** - 学会了七层路由和 TLS 配置

这些是 Kubernetes 最核心的基础知识。接下来的学习方向：

- **ConfigMap 和 Secret** - 配置和敏感信息管理
- **Volume 和 PersistentVolume** - 存储管理
- **StatefulSet** - 有状态应用部署
- **DaemonSet** - 节点级应用部署
- **RBAC** - 权限控制
- **Helm** - 包管理工具
- **监控和日志** - Prometheus、Grafana、EFK

继续深入学习，你就能成为一名合格的 Kubernetes 运维工程师！
