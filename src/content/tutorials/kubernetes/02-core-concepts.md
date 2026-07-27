---
title: '第二章：核心概念详解'
description: '深入理解 Pod、Node、Cluster、Namespace 等 Kubernetes 核心概念，建立全局认知'
---

# 第二章：核心概念详解

## 本章导读

在学完第一章的环境搭建后，你可能已经跃跃欲试了。但在动手写 YAML 之前，我们需要先搞清楚 Kubernetes 世界里的几个核心概念。

本章你会学到：

- Pod 是什么？为什么不直接管理容器？
- Node 和 Cluster 有什么区别？
- Namespace 怎么隔离资源？
- Deployment 和 ReplicaSet 的关系是什么？
- Service 为什么必不可少？

这些概念是后续所有章节的基础，理解透了，后面学起来会事半功倍。

---

## 1 为什么需要这些概念？

### 一个类比：Kubernetes 就像一个大型集装箱港口

想象你经营着一个**大型集装箱港口**：

- **Pod** = 一个集装箱（最小的运输单元）
- **Node** = 港口里的一个泊位（提供运行空间）
- **Cluster** = 整个港口（所有泊位 + 管理中心）
- **Namespace** = 港口里划分的功能区域（散货区、冷链区、危险品区）
- **ReplicaSet** = 集装箱的"复制模板"（保证同一规格的集装箱始终有 N 个）
- **Deployment** = 港口的调度计划（决定什么时候增加/减少某种集装箱）
- **Service** = 港口的导航系统（不管集装箱搬到哪个泊位，客户都能找到它）

没有这些概念，港口就乱套了——集装箱随便堆放、找不到货、出了问题没人管。Kubernetes 的这些概念就是为了让"容器管理"变得有序、自动化、可预测。

---

## 2 Pod：最小调度单元

### 什么是 Pod？

Pod 是 Kubernetes 中**最小的部署单元**。一个 Pod 里可以包含一个或多个容器。

为什么不直接管理容器？因为有些场景下，多个容器需要紧密协作——它们共享网络、共享存储，必须调度到同一台机器上。Pod 就是把这些"命运共同体"绑在一起的包装。

```
┌──────────────────────────────────┐
│             Pod                   │
│                                   │
│  ┌─────────────┐ ┌─────────────┐ │
│  │  主容器      │ │  辅助容器    │ │
│  │  (Web 应用)  │ │ (日志收集)   │ │
│  │             │ │             │ │
│  │  端口: 8080  │ │  端口: 9090  │ │
│  └──────┬──────┘ └──────┬──────┘ │
│         │               │        │
│         └───────┬───────┘        │
│                 │                │
│         ┌───────┴───────┐        │
│         │  共享网络空间   │        │
│         │  (同一个 IP)   │        │
│         └───────────────┘        │
│         ┌───────────────┐        │
│         │  共享存储卷     │        │
│         │  (Volume)     │        │
│         └───────────────┘        │
└──────────────────────────────────┘
```

### Pod 的特点

| 特点 | 说明 | 类比 |
| --- | --- | --- |
| 共享 IP 和端口空间 | Pod 内的容器用 localhost 互相通信 | 同一间公寓的室友共用一个门牌号 |
| 共享存储卷 | Pod 内的容器可以访问相同的文件 | 室友共用一个冰箱 |
| 一起调度 | Pod 内的容器一定在同一台机器上 | 室友必须住在同一间公寓 |
| 短暂生命周期 | Pod 是临时的，随时可能被销毁重建 | 公寓可以退租换新的，但住户信息不变 |

### 一个最简单的 Pod 示例

```yaml
# 一个最简单的 Pod 定义
apiVersion: v1              # API 版本号
kind: Pod                   # 资源类型是 Pod
metadata:                   # 元数据（名字、标签等）
  name: my-first-pod        # Pod 的名字
spec:                       # 规格定义
  containers:               # 容器列表
  - name: nginx-container   # 容器的名字
    image: nginx:latest     # 使用的镜像
    ports:                  # 暴露的端口
    - containerPort: 80     # 容器监听的端口
```

---

## 3 Node：工作节点

### 什么是 Node？

Node 就是集群中的一台**机器**（可以是物理机，也可以是虚拟机）。它是真正运行 Pod 的地方。

```
┌─────────────────────────────────────┐
│              Node（工作节点）          │
│                                       │
│  ┌──────────┐  负责管理本节点上的 Pod  │
│  │ kubelet  │  ← 向 Master 汇报状态   │
│  └──────────┘                         │
│  ┌──────────┐  负责网络转发             │
│  │kube-proxy│  ← 实现 Service 的负载均衡│
│  └──────────┘                         │
│  ┌──────────┐  运行容器的软件           │
│  │容器运行时 │  ← 如 containerd         │
│  └──────────┘                         │
│                                       │
│  ┌─────┐ ┌─────┐ ┌─────┐             │
│  │Pod 1│ │Pod 2│ │Pod 3│  ← 运行的 Pod│
│  └─────┘ └─────┘ └─────┘             │
└───────────────────────────────────────┘
```

### Node 的类型

| 类型 | 说明 | 类比 |
| --- | --- | --- |
| Master Node | 控制面节点，运行 API Server、etcd 等 | 港口的管理中心大楼 |
| Worker Node | 工作节点，运行 Pod | 港口里的实际泊位 |

### 查看 Node 信息

```bash
# 查看所有节点
kubectl get nodes

# 查看节点的详细信息
kubectl describe node <节点名称>

# 输出示例：
# NAME       STATUS   ROLES           AGE   VERSION
# minikube   Ready    control-plane   1d    v1.28.0
```

---

## 4 Cluster：集群

### 什么是 Cluster？

Cluster = Master 节点 + 所有 Worker 节点 + 所有组件的总和。

它是 Kubernetes 管理的最大范围，所有的资源都在一个 Cluster 内。

```
┌───────────────────────────────────────────────────────┐
│                     Cluster（集群）                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Master 节点（控制面）                 │   │
│  │  API Server / etcd / Scheduler / Controller Mgr  │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│         ┌───────────────┼───────────────┐               │
│         │               │               │               │
│  ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐      │
│  │ Worker 节点1 │ │ Worker 节点2 │ │ Worker 节点3 │      │
│  │ Pod Pod Pod  │ │ Pod Pod Pod  │ │ Pod Pod Pod  │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

打个比方：Cluster 就像整个公司，Master 是总部的管理层，Worker 是各个分公司/部门。

---

## 5 Namespace：虚拟集群

### 什么是 Namespace？

Namespace 是集群内部的"虚拟集群"，用来将资源进行逻辑隔离和分组。

想象一个大仓库，Namespace 就是仓库里划分的不同区域：

- `production` 区域 —— 存放正式运行的应用
- `staging` 区域 —— 存放测试环境的应用
- `development` 区域 —— 存放开发环境的应用

不同区域的货物互不干扰，各自独立管理。

### 默认 Namespace

Kubernetes 安装后会自动创建几个 Namespace：

| Namespace | 用途 | 说明 |
| --- | --- | --- |
| `default` | 默认命名空间 | 没有指定 Namespace 的资源都在这里 |
| `kube-system` | 系统命名空间 | K8s 自身组件运行的地方 |
| `kube-public` | 公共命名空间 | 存放集群中所有用户都能访问的公共资源 |
| `kube-node-lease` | 节点租约命名空间 | 存放节点的心跳信息，用于检测节点是否健康 |

### 创建和使用 Namespace

```yaml
# 创建一个 Namespace
apiVersion: v1            # API 版本号
kind: Namespace           # 资源类型
metadata:
  name: my-app            # Namespace 的名字
  labels:
    env: production       # 给 Namespace 打标签
```

```bash
# 在指定 Namespace 中查看 Pod
kubectl get pods -n my-app

# 设置默认的 Namespace（后续命令不用每次加 -n）
kubectl config set-context --current --namespace=my-app
```

---

## 6 ReplicaSet：副本集

### 什么是 ReplicaSet？

ReplicaSet 的目标很简单：**确保在任何时候都有指定数量的 Pod 副本在运行**。

打个比方：你开了一家连锁奶茶店，规定每家店必须同时有 3 个店员在岗。如果有一个员工请假了，系统会自动派一个替补过去。ReplicaSet 就是这个"自动补员系统"。

```yaml
# 一个 ReplicaSet 示例
apiVersion: apps/v1               # API 版本号
kind: ReplicaSet                  # 资源类型
metadata:
  name: my-app-rs                 # ReplicaSet 的名字
spec:
  replicas: 3                     # 期望的副本数量
  selector:                       # 选择器：哪些 Pod 归我管？
    matchLabels:
      app: my-app                 # 匹配标签 app=my-app 的 Pod
  template:                       # Pod 模板
    metadata:
      labels:
        app: my-app               # Pod 的标签
    spec:
      containers:
      - name: my-app              # 容器名
        image: nginx:latest       # 镜像
```

> **注意**：实际工作中很少直接使用 ReplicaSet，一般用 Deployment 来管理它。

---

## 7 Deployment：部署控制器

### 什么是 Deployment？

Deployment 是 ReplicaSet 的"上级"，它除了管理副本数量，还能做到：

- **滚动更新**：新版本逐步替换旧版本，不中断服务
- **回滚**：新版本有问题，一键退回旧版本
- **暂停/恢复**：更新过程中可以暂停检查

打个比方：如果 ReplicaSet 是"保证店员数量"，Deployment 就是"店长"——它不仅管人数，还负责培训新员工（新版本）、替换老员工（旧版本）、出问题时让老员工重新上岗（回滚）。

```yaml
# 一个 Deployment 示例
apiVersion: apps/v1               # API 版本号
kind: Deployment                  # 资源类型
metadata:
  name: my-app-deployment         # Deployment 名字
spec:
  replicas: 3                     # 副本数量
  selector:                       # 选择器
    matchLabels:
      app: my-app                 # 管理标签为 app=my-app 的 Pod
  strategy:                       # 更新策略
    type: RollingUpdate           # 滚动更新
    rollingUpdate:
      maxSurge: 1                 # 更新时最多多出 1 个 Pod
      maxUnavailable: 0           # 更新时不允许有 Pod 不可用
  template:                       # Pod 模板
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: nginx:1.25         # 使用 nginx 1.25 版本
        ports:
        - containerPort: 80
```

### Deployment 和 ReplicaSet 的关系

```
Deployment（店长）
  │
  ├── 管理 ──→ ReplicaSet v1（旧版员工组）
  │               ├── Pod 1
  │               ├── Pod 2
  │               └── Pod 3
  │
  └── 滚动更新后 ──→ ReplicaSet v2（新版员工组）
                       ├── Pod 4
                       ├── Pod 5
                       └── Pod 6
```

---

## 8 Service：服务发现

### 为什么需要 Service？

Pod 有一个致命问题：**它的 IP 地址是不固定的**。Pod 被销毁重建后，IP 就变了。

这就像员工换了工位，你每次找他都要重新问地址。Service 就是公司的"通讯录"——不管员工坐在哪，你拨分机号就能找到他。

### Service 的核心作用

| 作用 | 说明 | 类比 |
| --- | --- | --- |
| 稳定的访问地址 | Service 有固定的 IP 和端口 | 公司的总机号码，不会变 |
| 负载均衡 | 自动将请求分发到后端的多个 Pod | 前台把电话随机转接到空闲的客服 |
| 服务发现 | 通过名字就能找到服务，不用记 IP | 通讯录里搜名字就能打电话 |

### Service 的基本示例

```yaml
# 一个 Service 示例
apiVersion: v1                # API 版本号
kind: Service                 # 资源类型
metadata:
  name: my-app-service        # Service 名字
spec:
  type: ClusterIP             # 类型：集群内部访问
  selector:                   # 选择器：把流量发给哪些 Pod？
    app: my-app               # 匹配标签 app=my-app 的 Pod
  ports:
  - port: 80                  # Service 暴露的端口
    targetPort: 8080          # 转发到 Pod 的哪个端口
```

---

## 9 概念之间的关系

```
Cluster（集群）
├── Namespace: production（命名空间）
│   ├── Deployment: web-app（部署）
│   │   ├── ReplicaSet v1（副本集）
│   │   │   ├── Pod-1
│   │   │   ├── Pod-2
│   │   │   └── Pod-3
│   │   └── ReplicaSet v2（滚动更新后的新副本集）
│   │       ├── Pod-4
│   │       ├── Pod-5
│   │       └── Pod-6
│   └── Service: web-service（服务）
│       └── 负载均衡 → Pod-4, Pod-5, Pod-6
├── Namespace: staging（命名空间）
│   └── ...
└── Node-1, Node-2, Node-3（节点）
```

| 概念 | 层级 | 核心职责 |
| --- | --- | --- |
| Cluster | 最顶层 | 整个 K8s 环境 |
| Namespace | 集群内 | 逻辑隔离，资源分组 |
| Deployment | 命名空间内 | 管理应用的部署和更新 |
| ReplicaSet | Deployment 内 | 保证 Pod 副本数量 |
| Pod | 最小单元 | 运行容器的载体 |
| Node | 基础设施 | 提供运行 Pod 的机器 |
| Service | 命名空间内 | 稳定的网络入口和负载均衡 |

---

## 10 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Pod | K8s 最小调度单元，包含一个或多个容器，共享网络和存储 |
| Node | 集群中的一台机器，运行 Pod |
| Cluster | Master + Worker 的总和 |
| Namespace | 集群内的逻辑隔离，类似"虚拟集群" |
| ReplicaSet | 确保指定数量的 Pod 副本始终运行 |
| Deployment | 管理 ReplicaSet，支持滚动更新和回滚 |
| Service | 为 Pod 提供稳定的访问入口和负载均衡 |

---

## 11 新手常见误区

### 误区 1："一个 Pod 就是一个容器"

❌ 错误理解：Pod 和容器是一对一的关系。

✅ 正确理解：一个 Pod 可以包含多个容器。大多数情况下确实是一个 Pod 一个容器，但在 Sidecar 模式下，一个 Pod 里会有主容器和辅助容器（如日志收集、监控代理）。Pod 是 K8s 的最小调度单元，不是容器。

### 误区 2："Pod 的 IP 是固定的"

❌ 错误理解：Pod 创建后 IP 不会变。

✅ 正确理解：Pod 是"短暂"的（ephemeral），随时可能被销毁重建，IP 也会变。这就是为什么需要 Service 来提供稳定的访问地址。永远不要直接通过 Pod IP 访问服务。

### 误区 3："Namespace 提供了安全隔离"

❌ 错误理解：不同 Namespace 的资源完全隔离，互不影响。

✅ 正确理解：Namespace 只是逻辑分组，不是安全边界。默认情况下，不同 Namespace 的 Pod 可以互相通信。要实现真正的隔离，需要配合 NetworkPolicy。

### 误区 4："直接创建 ReplicaSet 就好了，不需要 Deployment"

❌ 错误理解：ReplicaSet 已经能管理副本数，Deployment 多余。

✅ 正确理解：ReplicaSet 只能管理副本数量，不支持滚动更新、回滚、暂停等功能。Deployment 是 ReplicaSet 的高级封装，生产环境中应该始终使用 Deployment。

---

## 12 动手练习

### 练习 1：创建 Namespace 并在其中部署应用

创建一个名为 `dev` 的 Namespace，然后在其中部署一个 Nginx Pod，确认 Pod 运行在正确的 Namespace 中。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：创建 Namespace
kubectl create namespace dev

# 第二步：在 dev Namespace 中创建 Pod
kubectl run my-nginx --image=nginx:latest -n dev

# 第三步：查看 dev Namespace 中的 Pod
kubectl get pods -n dev

# 第四步：确认 default Namespace 中没有这个 Pod
kubectl get pods -n default
```

</details>

### 练习 2：使用 Deployment 部署应用并扩容

创建一个 Deployment，初始副本数为 2，然后手动扩容到 5，观察 Pod 的变化。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：创建 Deployment
kubectl create deployment web-app --image=nginx:latest --replicas=2

# 第二步：查看 Deployment 和 Pod
kubectl get deployments
kubectl get pods

# 第三步：扩容到 5 个副本
kubectl scale deployment web-app --replicas=5

# 第四步：观察 Pod 的变化
kubectl get pods -w

# 第五步：缩容回 2 个
kubectl scale deployment web-app --replicas=2
```

</details>

### 练习 3（挑战）：创建 Service 并通过 ClusterIP 访问

为练习 2 中的 Deployment 创建一个 ClusterIP 类型的 Service，然后通过另一个 Pod 验证能否通过 Service 名称访问。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：为 Deployment 创建 Service
kubectl expose deployment web-app --port=80 --type=ClusterIP

# 第二步：查看 Service
kubectl get services

# 第三步：创建一个临时的调试 Pod
kubectl run debug --image=busybox --rm -it --restart=Never -- sh

# 第四步：在调试 Pod 内部通过 Service 名称访问
# wget -qO- http://web-app
# 应该能看到 Nginx 的 HTML 内容

# 第五步：退出调试 Pod 后清理
kubectl delete service web-app
kubectl delete deployment web-app
```

</details>

---

## 下一章预告

下一章我们会深入 Kubernetes 最核心的资源——**Pod**。你将学到 Pod 的 YAML 定义方式、多容器模式（Sidecar、Ambassador、Adapter）、Pod 的生命周期、探针机制（liveness、readiness、startup）、资源限制等。Pod 是 K8s 世界的"原子"，理解透了才能构建稳定的应用。
