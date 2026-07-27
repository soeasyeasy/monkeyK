---
title: '第七章：Service 服务发现'
description: '深入理解 Service 的作用、类型、服务发现机制和负载均衡原理'
---

# 第七章：Service 服务发现

## 本章导读

在前面的章节中，我们已经知道 Pod 的 IP 是不固定的，直接通过 Pod IP 访问服务是不可靠的。这一章要深入讲解 Kubernetes 中解决这个问题的核心资源——**Service**。

本章你会学到：

- 为什么需要 Service？Pod IP 有什么问题？
- Service 有哪几种类型？各自适用什么场景？
- Service 是怎么找到后端 Pod 的？
- Headless Service 是什么？什么时候用？
- Service 的 DNS 是怎么工作的？

打个比方：Pod 就像公司里的员工，工位经常换（IP 变化）；Service 就像公司的前台总机，不管员工坐在哪，拨打分机号就能找到对应的人。

---

## 1 为什么需要 Service？

### Pod IP 的问题

```
问题场景：

1. 创建了一个 Pod，IP 为 10.244.0.5
2. 其他应用通过 http://10.244.0.5 访问这个 Pod
3. Pod 被删除重建（滚动更新、节点故障等），新 IP 为 10.244.0.8
4. 其他应用仍然访问 http://10.244.0.5 → 访问失败

根本原因：Pod 是"短暂"的（ephemeral），IP 不固定
```

### Service 的解决方案

Service 提供了一个**稳定的访问入口**：

| 特性 | 说明 | 类比 |
| --- | --- | --- |
| 固定 IP | Service 创建后 IP 不变 | 公司总机号码，不会变 |
| 固定端口 | Service 暴露的端口固定 | 分机号，不会变 |
| 自动发现 | 通过名字就能访问，不用记 IP | 通讯录里搜名字就能打电话 |
| 负载均衡 | 自动将请求分发到多个 Pod | 前台把电话随机转接到空闲的客服 |

```
Service 的工作原理：

┌─────────────────────────────────────────────┐
│              Service: web-service            │
│              ClusterIP: 10.96.0.100          │
│              Port: 80                        │
└──────────────────┬──────────────────────────┘
                   │
                   │ 负载均衡
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────┴───┐ ┌────┴───┐ ┌────┴───┐
   │ Pod-1  │ │ Pod-2  │ │ Pod-3  │
   │10.0.0.5│ │10.0.0.6│ │10.0.0.7│
   └────────┘ └────────┘ └────────┘

客户端访问 http://web-service:80
Service 将请求分发到 Pod-1、Pod-2 或 Pod-3
```

---

## 2 Service 的类型

Kubernetes 提供了 4 种 Service 类型，适用于不同的场景：

| 类型 | 说明 | 访问范围 | 适用场景 |
| --- | --- | --- | --- |
| **ClusterIP** | 集群内部 IP | 仅集群内可访问 | 内部服务（数据库、缓存） |
| **NodePort** | 节点端口 | 集群外可通过节点 IP:端口访问 | 开发测试、简单暴露服务 |
| **LoadBalancer** | 云厂商负载均衡器 | 外部可访问 | 生产环境暴露服务 |
| **ExternalName** | CNAME 映射 | 映射到外部服务 | 访问集群外部的服务 |

### ClusterIP：默认类型

```yaml
# ClusterIP Service 示例
apiVersion: v1
kind: Service
metadata:
  name: internal-service            # Service 名称
spec:
  type: ClusterIP                   # 类型：集群内部（默认值）
  selector:                         # 选择器：匹配后端 Pod
    app: web                        # 匹配 app=web 的 Pod
  ports:
  - port: 80                        # Service 暴露的端口
    targetPort: 8080                # 转发到 Pod 的端口
    protocol: TCP                   # 协议（默认 TCP）
```

```bash
# 创建 ClusterIP Service
kubectl apply -f internal-service.yaml

# 查看 Service
kubectl get services

# 输出示例：
# NAME               TYPE        CLUSTER-IP      PORT(S)
# internal-service   ClusterIP   10.96.0.100     80/TCP

# 在集群内访问
curl http://internal-service:80
```

**ClusterIP 的特点：**

- 分配一个集群内部的虚拟 IP
- 只能在集群内部访问
- 适合内部服务之间的通信

### NodePort：节点端口

```yaml
# NodePort Service 示例
apiVersion: v1
kind: Service
metadata:
  name: nodeport-service            # Service 名称
spec:
  type: NodePort                    # 类型：节点端口
  selector:
    app: web                        # 匹配后端 Pod
  ports:
  - port: 80                        # Service 端口（集群内访问）
    targetPort: 8080                # Pod 端口
    nodePort: 30080                 # 节点端口（外部访问，范围 30000-32767）
```

```bash
# 创建 NodePort Service
kubectl apply -f nodeport-service.yaml

# 查看 Service
kubectl get services

# 输出示例：
# NAME               TYPE       CLUSTER-IP      PORT(S)
# nodeport-service   NodePort   10.96.0.101     80:30080/TCP

# 从集群外访问
curl http://<节点IP>:30080
```

**NodePort 的特点：**

- 在每个节点上开放一个端口（30000-32767）
- 外部可以通过 `<节点IP>:<节点端口>` 访问
- 适合开发测试，生产环境不推荐（端口有限，无高可用）

### LoadBalancer：负载均衡器

```yaml
# LoadBalancer Service 示例
apiVersion: v1
kind: Service
metadata:
  name: lb-service                  # Service 名称
spec:
  type: LoadBalancer                # 类型：负载均衡器
  selector:
    app: web                        # 匹配后端 Pod
  ports:
  - port: 80                        # Service 端口
    targetPort: 8080                # Pod 端口
```

```bash
# 创建 LoadBalancer Service（需要在云环境中）
kubectl apply -f lb-service.yaml

# 查看 Service，等待外部 IP 分配
kubectl get services -w

# 输出示例：
# NAME          TYPE           EXTERNAL-IP      PORT(S)
# lb-service    LoadBalancer   203.0.113.50     80:31234/TCP

# 从外部访问
curl http://203.0.113.50:80
```

**LoadBalancer 的特点：**

- 需要云厂商支持（AWS、GCP、Azure 等）
- 自动创建一个外部负载均衡器
- 分配一个外部 IP，外部可以直接访问
- 生产环境暴露服务的标准方式

### ExternalName：外部服务映射

```yaml
# ExternalName Service 示例
apiVersion: v1
kind: Service
metadata:
  name: external-db                 # Service 名称
spec:
  type: ExternalName                # 类型：外部名称
  externalName: db.example.com      # 外部服务的 DNS 名称
```

```bash
# 创建 ExternalName Service
kubectl apply -f external-db.yaml

# 在集群内访问
curl http://external-db:80
# 实际会访问 db.example.com:80
```

**ExternalName 的特点：**

- 不创建 ClusterIP，只做 DNS CNAME 映射
- 将集群内的访问映射到外部服务
- 适合访问集群外部的数据库、API 等

---

## 3 Service 的服务发现

### Selector 关联 Pod

Service 通过 `selector` 找到后端的 Pod：

```yaml
spec:
  selector:                         # 选择器
    app: web                        # 匹配 app=web 的 Pod
    version: v1                     # 匹配 version=v1 的 Pod
```

```
Service（selector: app=web）
        │
        │ 查找匹配的 Pod
        ▼
┌────────────────────────────────┐
│  Pod A: app=web  ✅ 匹配       │
│  Pod B: app=api  ❌ 不匹配     │
│  Pod C: app=web  ✅ 匹配       │
│  Pod D: app=web  ✅ 匹配       │
└────────────────────────────────┘

Service 的 Endpoints 包含 Pod A、C、D
```

### Endpoints 资源

Service 会自动创建对应的 Endpoints 资源，记录后端 Pod 的 IP 列表：

```bash
# 查看 Endpoints
kubectl get endpoints

# 输出示例：
# NAME               ENDPOINTS
# web-service        10.244.0.5:8080,10.244.0.6:8080,10.244.0.7:8080

# 查看详细信息
kubectl describe endpoints web-service
```

```yaml
# Endpoints 资源示例（由 Service 自动创建）
apiVersion: v1
kind: Endpoints
metadata:
  name: web-service                 # 和 Service 同名
subsets:
- addresses:                        # 后端 Pod 的 IP 列表
  - ip: 10.244.0.5                  # Pod IP
    targetRef:                      # 关联的 Pod 引用
      kind: Pod
      name: web-pod-1
  - ip: 10.244.0.6
    targetRef:
      kind: Pod
      name: web-pod-2
  ports:
  - port: 8080                      # Pod 端口
    protocol: TCP
```

---

## 4 Headless Service（无头服务）

### 什么是 Headless Service？

Headless Service 是一种特殊的 Service，**不分配 ClusterIP**，直接返回后端 Pod 的 IP 列表。

```yaml
# Headless Service 示例
apiVersion: v1
kind: Service
metadata:
  name: headless-service            # Service 名称
spec:
  clusterIP: None                   # 设置为 None，表示无头
  selector:
    app: web                        # 匹配后端 Pod
  ports:
  - port: 80
    targetPort: 8080
```

```bash
# 创建 Headless Service
kubectl apply -f headless-service.yaml

# DNS 查询会返回所有 Pod 的 IP
nslookup headless-service.default.svc.cluster.local
# 输出多个 A 记录，每个对应一个 Pod IP
```

### Headless Service 的适用场景

| 场景 | 说明 | 示例 |
| --- | --- | --- |
| StatefulSet | 有状态应用需要知道每个 Pod 的 IP | 数据库集群、消息队列 |
| 客户端负载均衡 | 客户端自己选择后端 Pod | gRPC、自定义负载均衡逻辑 |
| 服务发现 | 需要知道所有后端 Pod 的 IP | 自定义服务发现机制 |

```
普通 Service vs Headless Service：

普通 Service：
客户端 → Service（ClusterIP）→ 负载均衡 → Pod

Headless Service：
客户端 → DNS 查询 → 获取所有 Pod IP → 客户端自己选择
```

---

## 5 端口命名和多云端口

### 端口命名

当 Service 有多个端口时，必须为每个端口命名：

```yaml
# 多端口 Service 示例
apiVersion: v1
kind: Service
metadata:
  name: multi-port-service          # Service 名称
spec:
  selector:
    app: web
  ports:
  - name: http                      # 端口名称（必须）
    port: 80                        # Service 端口
    targetPort: 8080                # Pod 端口
    protocol: TCP
  - name: https                     # 端口名称
    port: 443                       # Service 端口
    targetPort: 8443                # Pod 端口
    protocol: TCP
```

```bash
# 查看多端口 Service
kubectl get services

# 输出示例：
# NAME                 TYPE        CLUSTER-IP      PORT(S)
# multi-port-service   ClusterIP   10.96.0.102     80/TCP,443/TCP
```

### 端口字段说明

| 字段 | 说明 | 示例 |
| --- | --- | --- |
| `port` | Service 暴露的端口 | 80 |
| `targetPort` | Pod 监听的端口 | 8080 |
| `nodePort` | 节点端口（NodePort 类型） | 30080 |

```
端口映射关系：

客户端 → Service:port (80) → Pod:targetPort (8080)
                              ↓
                         NodePort:nodePort (30080)
```

---

## 6 会话亲和性（Session Affinity）

### 什么是会话亲和性？

默认情况下，Service 的负载均衡是随机的。会话亲和性可以让同一个客户端的请求始终发到同一个 Pod。

```yaml
# 会话亲和性配置
apiVersion: v1
kind: Service
metadata:
  name: sticky-service              # Service 名称
spec:
  type: ClusterIP
  sessionAffinity: ClientIP         # 基于客户端 IP 的亲和性
  sessionAffinityConfig:            # 亲和性配置
    clientIP:
      timeoutSeconds: 10800         # 会话超时时间（秒）
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
```

| 亲和性类型 | 说明 | 适用场景 |
| --- | --- | --- |
| `None` | 无亲和性，随机负载均衡（默认） | 无状态服务 |
| `ClientIP` | 同一客户端 IP 的请求发到同一 Pod | 需要会话保持的场景 |

```
会话亲和性的效果：

客户端 A（IP: 192.168.1.10）
  ├── 请求 1 → Pod-1
  ├── 请求 2 → Pod-1  ← 始终发到同一个 Pod
  └── 请求 3 → Pod-1

客户端 B（IP: 192.168.1.20）
  ├── 请求 1 → Pod-2
  ├── 请求 2 → Pod-2
  └── 请求 3 → Pod-2
```

---

## 7 DNS 集成

### Kubernetes DNS 机制

Kubernetes 内置了 DNS 服务（CoreDNS），为每个 Service 提供 DNS 名称解析。

```
DNS 名称格式：

<service-name>.<namespace>.svc.cluster.local

示例：
- web-service.default.svc.cluster.local
- api-service.production.svc.cluster.local
```

```bash
# 在 Pod 内测试 DNS 解析
kubectl run dns-test --image=busybox --rm -it -- nslookup web-service

# 输出示例：
# Server:    10.96.0.10
# Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
# 
# Name:      web-service
# Address 1: 10.96.0.100 web-service.default.svc.cluster.local
```

### 简写形式

在同一个 Namespace 内，可以直接使用 Service 名称：

```bash
# 在 default Namespace 的 Pod 内
curl http://web-service             # 简写
curl http://web-service.default     # 带 Namespace
curl http://web-service.default.svc.cluster.local  # 完整形式

# 跨 Namespace 访问
curl http://api-service.production.svc.cluster.local
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Service 的作用 | 提供稳定的访问入口，负载均衡 |
| ClusterIP | 集群内部访问，默认类型 |
| NodePort | 通过节点端口暴露服务 |
| LoadBalancer | 云厂商负载均衡器，外部可访问 |
| ExternalName | 映射到外部服务 |
| Selector | 匹配后端 Pod |
| Endpoints | 记录后端 Pod 的 IP 列表 |
| Headless Service | 不分配 ClusterIP，返回所有 Pod IP |
| 多端口 | 需要为每个端口命名 |
| 会话亲和性 | 同一客户端请求发到同一 Pod |
| DNS | `<service>.<namespace>.svc.cluster.local` |

---

## 9 新手常见误区

### 误区 1："Service 的 port 和 targetPort 必须一样"

❌ 错误理解：Service 的 port 必须和 Pod 的端口相同。

✅ 正确理解：`port` 是 Service 暴露的端口，`targetPort` 是 Pod 监听的端口，它们可以不同。Service 会将 `port` 的流量转发到 `targetPort`。比如 Service 端口是 80，Pod 端口是 8080，客户端访问 `http://service:80`，流量会被转发到 Pod 的 8080 端口。

### 误区 2："NodePort 类型的 Service 可以替代 LoadBalancer"

❌ 错误理解：NodePort 已经能从外部访问，不需要 LoadBalancer。

✅ 正确理解：NodePort 有几个问题：端口范围有限（30000-32767）、需要知道节点 IP、没有高可用（节点挂了服务就断了）。生产环境应该用 LoadBalancer，它提供固定的外部 IP、自动故障转移、集成云厂商的负载均衡器。

### 误区 3："Service 的 selector 是可选的"

❌ 错误理解：Service 可以不设置 selector。

✅ 正确理解：Service 的 selector 决定了它要把流量发给哪些 Pod。没有 selector，Service 就不知道后端是谁，流量无法转发。除非你手动创建 Endpoints 资源（高级用法），否则必须设置 selector。

### 误区 4："Headless Service 和普通 Service 一样有 ClusterIP"

❌ 错误理解：Headless Service 只是不负载均衡，其他都一样。

✅ 正确理解：Headless Service 的根本区别是**不分配 ClusterIP**（`clusterIP: None`）。DNS 查询不会返回一个虚拟 IP，而是直接返回所有后端 Pod 的 IP 列表。客户端需要自己实现负载均衡逻辑。适合 StatefulSet 或需要客户端负载均衡的场景。

### 误区 5："Service 只能负载均衡到同一 Namespace 的 Pod"

❌ 错误理解：Service 的 selector 只能匹配同一 Namespace 的 Pod。

✅ 正确理解：Service 的 selector 确实只能匹配同一 Namespace 的 Pod。但可以通过 ExternalName 类型的 Service 映射到其他 Namespace 的服务，或者使用完整的 DNS 名称（`<service>.<namespace>.svc.cluster.local`）跨 Namespace 访问。

---

## 10 动手练习

### 练习 1：创建 ClusterIP Service 并验证

创建一个 Deployment 和对应的 ClusterIP Service，验证集群内部可以通过 Service 名称访问。

<details>
<summary>点击查看答案</summary>

```yaml
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deploy                  # Deployment 名称
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
---
# ClusterIP Service
apiVersion: v1
kind: Service
metadata:
  name: web-service                 # Service 名称
spec:
  type: ClusterIP                   # 集群内部访问
  selector:
    app: web                        # 匹配 app=web 的 Pod
  ports:
  - port: 80                        # Service 端口
    targetPort: 80                  # Pod 端口
```

```bash
# 创建资源
kubectl apply -f web-service.yaml

# 查看 Service
kubectl get services

# 在集群内访问
kubectl run test --image=busybox --rm -it -- wget -qO- http://web-service
```

</details>

### 练习 2：创建 NodePort Service 并从外部访问

创建一个 NodePort Service，通过节点 IP 和端口从外部访问服务。

<details>
<summary>点击查看答案</summary>

```yaml
# NodePort Service
apiVersion: v1
kind: Service
metadata:
  name: nodeport-web                # Service 名称
spec:
  type: NodePort                    # 节点端口类型
  selector:
    app: web                        # 匹配后端 Pod
  ports:
  - port: 80                        # Service 端口
    targetPort: 80                  # Pod 端口
    nodePort: 30080                 # 节点端口（30000-32767）
```

```bash
# 创建 Service
kubectl apply -f nodeport-web.yaml

# 查看 Service，确认 nodePort
kubectl get services

# 获取节点 IP
kubectl get nodes -o wide

# 从外部访问
curl http://<节点IP>:30080
```

</details>

### 练习 3（挑战）：创建 Headless Service 并验证 DNS 解析

创建一个 Headless Service，验证 DNS 查询返回的是所有 Pod 的 IP，而不是一个 ClusterIP。

<details>
<summary>点击查看答案</summary>

```yaml
# Headless Service
apiVersion: v1
kind: Service
metadata:
  name: headless-web                # Service 名称
spec:
  clusterIP: None                   # 无头服务
  selector:
    app: web                        # 匹配后端 Pod
  ports:
  - port: 80
    targetPort: 80
```

```bash
# 创建 Headless Service
kubectl apply -f headless-web.yaml

# 查看 Service（CLUSTER-IP 显示为 None）
kubectl get services

# 查看 Endpoints（应该包含所有 Pod 的 IP）
kubectl get endpoints headless-web

# DNS 查询验证
kubectl run dns-test --image=busybox --rm -it -- nslookup headless-web

# 输出应该包含多个 A 记录，每个对应一个 Pod IP
```

</details>

---

## 下一章预告

下一章我们会学习 Kubernetes 中的**七层路由**——Ingress 与 Ingress 控制器。你会学到为什么需要 Ingress、如何配置基于域名和路径的路由、如何配置 HTTPS、Ingress 控制器有哪些选择。Ingress 是暴露 HTTP/HTTPS 服务的标准方式，比 LoadBalancer 更灵活、更经济。
