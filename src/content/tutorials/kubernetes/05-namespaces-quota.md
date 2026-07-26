---
title: '第五章：Namespace 与资源配额'
description: '深入理解 Namespace 的使用场景，掌握 ResourceQuota 和 LimitRange 的资源管理方法'
---

# 第五章：Namespace 与资源配额

## 本章导读

在前面的章节中，我们已经简单介绍了 Namespace 的概念。但在实际的生产环境中，Namespace 的使用远不止"创建一个隔离空间"这么简单。

本章你会学到：

- Kubernetes 默认有哪些 Namespace？各自的作用是什么？
- 如何合理规划 Namespace 的组织结构？
- ResourceQuota 怎么限制团队的资源使用量？
- LimitRange 怎么为每个容器设置默认的资源限制？
- 多团队共享集群时，怎么防止资源争抢？

打个比方：Namespace 就像一栋写字楼里的不同公司。ResourceQuota 是物业给每个公司分配的水电额度，LimitRange 是每个办公室电器的功率上限。没有这些管理手段，某个公司可能把整栋楼的资源用光。

---

## 5.1 为什么需要 Namespace 和资源配额？

### 没有 Namespace 的混乱

想象一个场景：公司有三个团队（前端、后端、数据），共用一个 Kubernetes 集群。

```
❌ 没有 Namespace 的集群：

所有 Pod 混在一起：
├── frontend-pod-1
├── backend-pod-1
├── data-pod-1
├── frontend-pod-2
├── backend-pod-2
└── ...

问题：
1. 找不到哪个 Pod 属于哪个团队
2. 某个团队创建了 100 个 Pod，把集群资源用光
3. 删除资源时误删其他团队的东西
4. 无法给不同团队设置不同的权限
```

### Namespace 的解决方案

```
✅ 有 Namespace 的集群：

├── Namespace: frontend（前端团队）
│   ├── frontend-pod-1
│   └── frontend-pod-2
├── Namespace: backend（后端团队）
│   ├── backend-pod-1
│   └── backend-pod-2
└── Namespace: data（数据团队）
    ├── data-pod-1
    └── data-pod-2

优势：
1. 资源分组清晰，一目了然
2. 每个 Namespace 可以独立设置配额
3. 权限隔离，各管各的
4. 删除 Namespace 可以批量清理资源
```

---

## 5.2 默认的 Namespace

Kubernetes 安装后会自动创建 4 个 Namespace：

| Namespace | 用途 | 说明 |
| --- | --- | --- |
| **default** | 默认命名空间 | 没有指定 Namespace 的资源都在这里 |
| **kube-system** | 系统命名空间 | K8s 自身组件运行的地方（如 CoreDNS、kube-proxy） |
| **kube-public** | 公共命名空间 | 存放集群中所有用户都能访问的公共资源（如集群信息） |
| **kube-node-lease** | 节点租约命名空间 | 存放节点的心跳信息，用于检测节点是否健康 |

```bash
# 查看集群中的所有 Namespace
kubectl get namespaces

# 输出示例：
# NAME              STATUS   AGE
# default           Active   30d
# kube-system       Active   30d
# kube-public       Active   30d
# kube-node-lease   Active   30d

# 查看 kube-system 中的 Pod（K8s 系统组件）
kubectl get pods -n kube-system
```

> **注意**：不要随意修改或删除 `kube-*` 开头的 Namespace，这些是 K8s 正常运行所必需的。

---

## 5.3 创建和管理 Namespace

### 创建 Namespace

```yaml
# 创建一个 Namespace
apiVersion: v1                      # API 版本
kind: Namespace                     # 资源类型
metadata:
  name: frontend                    # Namespace 名称
  labels:                           # 标签
    team: frontend                  # 团队标签
    env: production                 # 环境标签
  annotations:                      # 注解
    description: "前端团队的命名空间"   # 描述信息
```

```bash
# 用命令行快速创建
kubectl create namespace frontend

# 用 YAML 文件创建
kubectl apply -f frontend-namespace.yaml

# 查看 Namespace
kubectl get namespaces

# 查看详细信息
kubectl describe namespace frontend
```

### 在 Namespace 中创建资源

```bash
# 在指定 Namespace 中创建 Pod
kubectl run my-pod --image=nginx -n frontend

# 在指定 Namespace 中查看资源
kubectl get pods -n frontend

# 查看所有 Namespace 中的 Pod
kubectl get pods --all-namespaces

# 设置默认 Namespace（后续命令不用每次加 -n）
kubectl config set-context --current --namespace=frontend

# 验证当前 Namespace
kubectl config view --minify --output 'jsonpath={..namespace}'
```

### 删除 Namespace

```bash
# 删除 Namespace（会同时删除其中所有资源）
kubectl delete namespace frontend

# 警告：这个操作不可逆！
# Namespace 中的所有 Pod、Service、Deployment 都会被删除
```

> **类比**：删除 Namespace 就像拆除一整层办公楼——里面的所有办公室、设备、文件全部清空。

---

## 5.4 ResourceQuota：资源配额

### 什么是 ResourceQuota？

ResourceQuota 用来限制一个 Namespace 中可以使用的**资源总量**。

打个比方：物业给每个公司分配每月用电额度——前端公司最多用 1000 度电，后端公司最多用 2000 度电。超过额度就不让用了。

### ResourceQuota 的类型

| 配额类型 | 说明 | 示例 |
| --- | --- | --- |
| **计算资源配额** | 限制 CPU 和内存的 requests/limits | 最多使用 10 核 CPU、20GB 内存 |
| **存储资源配额** | 限制存储卷的数量和容量 | 最多 50 个 PVC，总容量 100GB |
| **对象数量配额** | 限制各类资源的数量 | 最多 50 个 Pod、20 个 Service |

### 计算资源配额示例

```yaml
# 计算资源配额
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota               # 配额名称
  namespace: frontend               # 应用的 Namespace
spec:
  hard:                             # 硬性限制（不可超过）
    requests.cpu: "10"              # CPU 请求总量上限：10 核
    requests.memory: 20Gi           # 内存请求总量上限：20 GB
    limits.cpu: "20"                # CPU 限制总量上限：20 核
    limits.memory: 40Gi             # 内存限制总量上限：40 GB
```

### 对象数量配额示例

```yaml
# 对象数量配额
apiVersion: v1
kind: ResourceQuota
metadata:
  name: object-quota                # 配额名称
  namespace: frontend               # 应用的 Namespace
spec:
  hard:                             # 硬性限制
    pods: "50"                      # 最多 50 个 Pod
    services: "20"                  # 最多 20 个 Service
    deployments.apps: "10"          # 最多 10 个 Deployment
    configmaps: "30"                # 最多 30 个 ConfigMap
    secrets: "30"                   # 最多 30 个 Secret
    persistentvolumeclaims: "20"    # 最多 20 个 PVC
```

### 查看配额使用情况

```bash
# 查看 ResourceQuota
kubectl get resourcequota -n frontend

# 输出示例：
# NAME            REQUEST                                      LIMIT
# compute-quota   requests.cpu: 2/10, requests.memory: 4Gi/20Gi  limits.cpu: 4/20, limits.memory: 8Gi/40Gi

# 查看详细信息
kubectl describe resourcequota compute-quota -n frontend
```

---

## 5.5 LimitRange：默认限制

### 什么是 LimitRange？

LimitRange 为 Namespace 中的**每个容器**设置默认的资源限制。

打个比方：ResourceQuota 是公司的总用电额度，LimitRange 是每个办公室电器的功率上限——每台空调最多 2000W，每台电脑最多 500W。即使公司总额度没用完，单个电器也不能超过上限。

### 为什么需要 LimitRange？

| 问题 | 说明 |
| --- | --- |
| 用户忘记设置 resources | 创建的 Pod 没有资源限制，可能占用过多资源 |
| 资源设置不合理 | 有人给一个小应用分配了 10 核 CPU |
| 统一规范 | 确保所有容器都有合理的资源限制 |

### LimitRange 示例

```yaml
# LimitRange 示例
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits              # LimitRange 名称
  namespace: frontend               # 应用的 Namespace
spec:
  limits:
  - type: Container                 # 应用于容器级别
    default:                        # 默认的 limits（用户不设置时使用）
      cpu: "500m"                   # 默认 CPU 上限：0.5 核
      memory: "256Mi"               # 默认内存上限：256 MB
    defaultRequest:                 # 默认的 requests（用户不设置时使用）
      cpu: "100m"                   # 默认 CPU 请求：0.1 核
      memory: "128Mi"               # 默认内存请求：128 MB
    max:                            # 单个容器允许的最大值
      cpu: "2"                      # 最大 2 核 CPU
      memory: "1Gi"                 # 最大 1 GB 内存
    min:                            # 单个容器允许的最小值
      cpu: "50m"                    # 最小 0.05 核 CPU
      memory: "64Mi"                # 最小 64 MB 内存
```

### LimitRange 的工作机制

```
用户创建 Pod 时的资源处理流程：

1. 用户在 YAML 中设置了 resources
   └── 检查是否在 min 和 max 之间
       ├── 在范围内 → 使用用户设置的值
       └── 超出范围 → 拒绝创建，报错

2. 用户没有设置 resources
   └── 自动注入 LimitRange 的 default 和 defaultRequest
       └── Pod 创建成功，使用默认值
```

### 验证 LimitRange

```bash
# 查看 LimitRange
kubectl get limitrange -n frontend

# 查看详细信息
kubectl describe limitrange default-limits -n frontend

# 创建一个不设置资源的 Pod
kubectl run test-pod --image=nginx -n frontend

# 查看 Pod 的资源（会自动填充默认值）
kubectl get pod test-pod -n frontend -o jsonpath='{.spec.containers[0].resources}'
# 输出：{"limits":{"cpu":"500m","memory":"256Mi"},"requests":{"cpu":"100m","memory":"128Mi"}}
```

---

## 5.6 Namespace 的作用域

### 哪些资源是 Namespace 级别的？

| 资源类型 | 是否属于 Namespace | 说明 |
| --- | --- | --- |
| Pod | 是 | 运行在特定 Namespace |
| Service | 是 | 属于特定 Namespace |
| Deployment | 是 | 属于特定 Namespace |
| ConfigMap | 是 | 属于特定 Namespace |
| Secret | 是 | 属于特定 Namespace |
| Node | 否 | 集群级别，不属于任何 Namespace |
| PersistentVolume | 否 | 集群级别资源 |
| Namespace | 否 | 自身就是命名空间，不属于其他 Namespace |

### 跨 Namespace 访问

```bash
# 在 Namespace A 中访问 Namespace B 的 Service
# 使用完整的 DNS 名称：<service>.<namespace>.svc.cluster.local

# 示例：在 frontend Namespace 中访问 backend Namespace 的 API
curl http://api-service.backend.svc.cluster.local
```

```yaml
# 在 Pod 中通过环境变量引用其他 Namespace 的 Service
apiVersion: v1
kind: Pod
metadata:
  name: cross-ns-pod                # Pod 名称
  namespace: frontend               # 当前 Namespace
spec:
  containers:
  - name: app                       # 容器名称
    image: my-app:latest            # 镜像
    env:
    - name: BACKEND_URL             # 环境变量
      value: "http://api-service.backend.svc.cluster.local"  # 跨 Namespace 访问
```

---

## 5.7 Namespace 组织最佳实践

### 按团队划分

```
集群
├── Namespace: team-frontend        # 前端团队
├── Namespace: team-backend         # 后端团队
├── Namespace: team-data            # 数据团队
└── Namespace: team-ops             # 运维团队
```

### 按环境划分

```
集群
├── Namespace: dev                  # 开发环境
├── Namespace: staging              # 预发布环境
├── Namespace: production           # 生产环境
└── Namespace: testing              # 测试环境
```

### 混合划分（推荐）

```
集群
├── Namespace: dev-frontend         # 开发-前端
├── Namespace: dev-backend          # 开发-后端
├── Namespace: prod-frontend        # 生产-前端
├── Namespace: prod-backend         # 生产-后端
└── Namespace: monitoring           # 监控（跨环境）
```

### 配额规划建议

| 环境 | CPU 配额 | 内存配额 | Pod 数量 |
| --- | --- | --- | --- |
| dev | 4 核 | 8 GB | 20 |
| staging | 8 核 | 16 GB | 40 |
| production | 32 核 | 64 GB | 200 |

---

## 5.8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 默认 Namespace | default、kube-system、kube-public、kube-node-lease |
| 创建 Namespace | `kubectl create namespace` 或 YAML |
| ResourceQuota | 限制 Namespace 的资源总量（CPU、内存、对象数量） |
| LimitRange | 为每个容器设置默认的资源限制 |
| Namespace 作用域 | Pod、Service、Deployment 等属于 Namespace；Node、PV 不属于 |
| 跨 Namespace 访问 | 使用完整 DNS：`<service>.<namespace>.svc.cluster.local` |
| 组织方式 | 按团队、按环境、或混合划分 |

---

## 5.9 新手常见误区

### 误区 1："Namespace 提供了完全的安全隔离"

❌ 错误理解：不同 Namespace 的 Pod 完全隔离，互不影响。

✅ 正确理解：Namespace 只是逻辑分组，默认情况下不同 Namespace 的 Pod 可以互相通信。要实现真正的网络隔离，需要配合 NetworkPolicy。Namespace 也不是安全边界，需要配合 RBAC 做权限控制。

### 误区 2："设置了 ResourceQuota 就不需要 LimitRange 了"

❌ 错误理解：ResourceQuota 已经限制了总量，不需要 LimitRange。

✅ 正确理解：它们解决的是不同层面的问题。ResourceQuota 限制 Namespace 的总资源量，LimitRange 限制单个容器的资源范围。没有 LimitRange，用户可能创建一个没有资源限制的 Pod，导致 ResourceQuota 无法正确计算。建议两者配合使用。

### 误区 3："删除 Namespace 只会删除 Pod"

❌ 错误理解：删除 Namespace 只清理 Pod，其他资源需要手动删除。

✅ 正确理解：删除 Namespace 会**级联删除**其中所有资源——Pod、Service、Deployment、ConfigMap、Secret 等全部清空。这个操作不可逆，要非常小心。

### 误区 4："LimitRange 的默认值会覆盖用户设置的值"

❌ 错误理解：LimitRange 会强制使用默认值，忽略用户的设置。

✅ 正确理解：LimitRange 只在用户**没有设置** resources 时才注入默认值。如果用户明确设置了 resources，LimitRange 只检查是否在 min 和 max 范围内，不会覆盖。

### 误区 5："所有资源都属于某个 Namespace"

❌ 错误理解：Kubernetes 中所有资源都在某个 Namespace 里。

✅ 正确理解：有些资源是集群级别的，不属于任何 Namespace——比如 Node、PersistentVolume、ClusterRole。这些资源在整个集群范围内可见。只有部分资源（Pod、Service、Deployment 等）属于 Namespace。

---

## 5.10 动手练习

### 练习 1：创建 Namespace 并设置 ResourceQuota

创建一个名为 `dev-team` 的 Namespace，设置 ResourceQuota 限制最多使用 4 核 CPU、8GB 内存、最多 20 个 Pod。然后尝试在该 Namespace 中创建资源，验证配额是否生效。

<details>
<summary>点击查看答案</summary>

```yaml
# Namespace 定义
apiVersion: v1
kind: Namespace
metadata:
  name: dev-team                    # Namespace 名称
  labels:
    team: development               # 团队标签
---
# ResourceQuota 定义
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota                   # 配额名称
  namespace: dev-team               # 应用的 Namespace
spec:
  hard:                             # 硬性限制
    requests.cpu: "4"               # CPU 请求上限：4 核
    requests.memory: 8Gi            # 内存请求上限：8 GB
    limits.cpu: "8"                 # CPU 限制上限：8 核
    limits.memory: 16Gi             # 内存限制上限：16 GB
    pods: "20"                      # 最多 20 个 Pod
```

```bash
# 创建 Namespace 和 ResourceQuota
kubectl apply -f dev-namespace.yaml

# 查看配额
kubectl get resourcequota -n dev-team

# 尝试创建超过配额的 Pod（会失败）
# 例如：创建 21 个 Pod 时，第 21 个会被拒绝
```

</details>

### 练习 2：创建 LimitRange 并验证默认值

在 `dev-team` Namespace 中创建 LimitRange，设置默认的 CPU 请求 100m、限制 500m，内存请求 128Mi、限制 256Mi。然后创建一个不设置资源的 Pod，验证是否自动注入了默认值。

<details>
<summary>点击查看答案</summary>

```yaml
# LimitRange 定义
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits              # LimitRange 名称
  namespace: dev-team               # 应用的 Namespace
spec:
  limits:
  - type: Container                 # 容器级别
    default:                        # 默认 limits
      cpu: "500m"                   # CPU 上限
      memory: "256Mi"               # 内存上限
    defaultRequest:                 # 默认 requests
      cpu: "100m"                   # CPU 请求
      memory: "128Mi"               # 内存请求
```

```bash
# 创建 LimitRange
kubectl apply -f limitrange.yaml -n dev-team

# 创建不设置资源的 Pod
kubectl run test-pod --image=nginx -n dev-team

# 查看 Pod 的资源配置
kubectl get pod test-pod -n dev-team -o jsonpath='{.spec.containers[0].resources}'
# 应该看到自动注入的默认值
```

</details>

### 练习 3（挑战）：跨 Namespace 访问 Service

创建两个 Namespace：`frontend` 和 `backend`。在 `backend` 中部署一个 Nginx Service，在 `frontend` 中创建一个 Pod，通过完整 DNS 名称访问 `backend` 的 Service。

<details>
<summary>点击查看答案</summary>

```yaml
# backend Namespace 的 Service
apiVersion: v1
kind: Service
metadata:
  name: api-service                 # Service 名称
  namespace: backend                # 在 backend Namespace
spec:
  selector:
    app: api                        # 匹配 app=api 的 Pod
  ports:
  - port: 80                        # Service 端口
    targetPort: 80                  # Pod 端口
---
# backend Namespace 的 Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment              # Deployment 名称
  namespace: backend                # 在 backend Namespace
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: nginx
        image: nginx:latest
---
# frontend Namespace 的 Pod
apiVersion: v1
kind: Pod
metadata:
  name: frontend-pod                # Pod 名称
  namespace: frontend               # 在 frontend Namespace
spec:
  containers:
  - name: curl                      # 容器名称
    image: curlimages/curl          # curl 镜像
    command: ["sleep", "3600"]      # 保持运行
```

```bash
# 创建 Namespace
kubectl create namespace backend
kubectl create namespace frontend

# 部署 backend 的 Service 和 Deployment
kubectl apply -f backend-service.yaml

# 创建 frontend 的 Pod
kubectl apply -f frontend-pod.yaml

# 进入 frontend Pod 访问 backend Service
kubectl exec -it frontend-pod -n frontend -- curl http://api-service.backend.svc.cluster.local
# 应该能看到 Nginx 的欢迎页面
```

</details>

---

## 下一章预告

下一章我们会学习 Kubernetes 中最常用的控制器——**Deployment**。你会学到如何定义 Deployment、如何进行滚动更新、如何回滚到历史版本、如何手动和自动扩缩容。Deployment 是管理无状态应用的标准方式，掌握它是运维 Kubernetes 的必备技能。
