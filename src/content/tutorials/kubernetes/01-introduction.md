---
title: '第一章：Kubernetes 简介与环境搭建'
description: '从零开始认识 Kubernetes，理解它解决了什么问题，并搭建你的第一个集群'
---

# 第一章：Kubernetes 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Kubernetes 是什么？和 Docker 有什么关系？
- 我已经会用 Docker 跑容器了，为什么还要学 K8s？
- K8s 组件那么多，从哪里开始学？

这一章就是为了解答这些问题。我们会先搞清楚 **Kubernetes 到底解决了什么痛点**，再动手搭建一个本地集群，让你快速看到第一个 Pod 跑起来。

---

## 1.1 为什么需要 Kubernetes？

### 从容器到容器编排

在 Kubernetes 出现之前，部署应用的方式经历了几个阶段：

| 阶段 | 方式 | 问题 |
| --- | --- | --- |
| 物理机时代 | 直接把应用部署到物理服务器 | 资源浪费严重，一台服务器只跑一个应用 |
| 虚拟机时代 | 用 VMware/VirtualBox 创建虚拟机 | 管理成本高，启动慢，占用大量磁盘和内存 |
| 容器时代 | 用 Docker 打包应用和依赖 | 单个容器好管理，但上百个容器就成了噩梦 |

Docker 解决了"应用打包和运行"的问题，但当容器数量增长到几十、上百个时，你会面临新的痛点：

- 一个容器挂了，谁来重启它？
- 流量突然增大，谁来启动更多容器？
- 容器之间的网络怎么互通？
- 新版本怎么做到不停机更新？

这就像一个**快递仓库**：Docker 相当于一个个标准化的快递箱，但谁来负责分拣、调度、补货、处理异常？你需要一个"仓库管理系统"。

**Kubernetes 就是这个"管理系统"**——它是一个容器编排平台，负责自动化部署、扩缩容、故障恢复、负载均衡。

### Kubernetes 的核心优势

| 优势 | 说明 | 生活类比 |
| --- | --- | --- |
| 自我修复 | 容器挂了自动重启，节点挂了自动迁移 | 仓库里某条流水线坏了，系统自动切换到备用线 |
| 弹性伸缩 | 根据流量自动增减容器数量 | 双十一订单暴增，临时多开几条分拣线 |
| 负载均衡 | 自动将流量分配到健康的容器 | 快递分发时自动避开拥堵的通道 |
| 自动部署与回滚 | 发布新版本，出问题自动回退 | 新产品上线后发现缺陷，一键退回上一版 |
| 存储编排 | 自动挂载本地或云端存储 | 仓库自动对接不同的货架和冷库 |

---

## 1.2 Kubernetes 的前世今生

### 从 Google Borg 到 Kubernetes

Kubernetes 并不是凭空出现的，它脱胎于 Google 内部运行了十多年的 **Borg** 系统。

```
时间线：

2003 年 ──── Google 内部开发 Borg 系统
  │          用于管理大规模分布式应用
  │
2010 年 ──── Google 推出 Borg 的继任者 Omega
  │          进一步优化了调度和资源管理
  │
2014 年 ──── Google 将 Borg/Omega 的经验开源
  │          发布了 Kubernetes 项目
  │
2015 年 ──── Kubernetes 1.0 正式发布
  │          Google 与 Linux 基金会合作管理
  │
2018 年 ──── Kubernetes 成为 CNCF 毕业项目
             成为容器编排的事实标准
```

打个比方：Borg 就像 Google 内部用了十几年的"秘方菜谱"，Kubernetes 是 Google 把这道菜的做法公开出来，让所有人都能照着做。

### 名字的由来

- **Kubernetes** 源自希腊语，意思是"舵手"或"领航员"
- 缩写为 **K8s**（K 和 s 之间有 8 个字母）
- Docker 的 Logo 是鲸鱼背着集装箱，Kubernetes 的 Logo 是舵轮——暗示 K8s 是"驾驶集装箱的舵手"

---

## 1.3 Kubernetes 架构总览

Kubernetes 集群由两类节点组成：**Master 节点**（控制面）和 **Worker 节点**（工作节点）。

### 整体架构图

```
┌─────────────────────────────────────────────────────┐
│                    Master 节点                        │
│  ┌──────────┐ ┌──────┐ ┌───────────┐ ┌───────────┐ │
│  │API Server│ │ etcd │ │ Scheduler │ │Controller │ │
│  │          │ │      │ │           │ │ Manager   │ │
│  └────┬─────┘ └──┬───┘ └─────┬─────┘ └─────┬─────┘ │
│       │          │           │              │        │
└───────┼──────────┼───────────┼──────────────┼────────┘
        │          │           │              │
        └──────────┴───────────┴──────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
┌─────────────┴──────┐  ┌────────────┴───────┐
│   Worker 节点 1     │  │   Worker 节点 2     │
│  ┌──────────────┐  │  │  ┌──────────────┐  │
│  │   kubelet    │  │  │  │   kubelet    │  │
│  ├──────────────┤  │  │  ├──────────────┤  │
│  │ kube-proxy   │  │  │  │ kube-proxy   │  │
│  ├──────────────┤  │  │  ├──────────────┤  │
│  │ 容器运行时    │  │  │  │ 容器运行时    │  │
│  │ ┌──┐┌──┐┌──┐│  │  │  │ ┌──┐┌──┐┌──┐│  │
│  │ │P1││P2││P3││  │  │  │ │P4││P5││P6││  │
│  │ └──┘└──┘└──┘│  │  │  │ └──┘└──┘└──┘│  │
│  └──────────────┘  │  │  └──────────────┘  │
└────────────────────┘  └────────────────────┘
```

### 核心组件详解

| 组件 | 所在位置 | 职责 | 生活类比 |
| --- | --- | --- | --- |
| **API Server** | Master | 集群的统一入口，所有操作都通过它 | 公司前台，所有请求都要经过前台 |
| **etcd** | Master | 分布式键值存储，保存集群所有状态数据 | 仓库的台账本，记录所有货物的位置和状态 |
| **Scheduler** | Master | 负责将 Pod 调度到合适的 Worker 节点 | 仓库调度员，决定新来的货物放在哪个货架 |
| **Controller Manager** | Master | 运行各种控制器，维护集群期望状态 | 巡检主管，发现异常就安排修复 |
| **kubelet** | Worker | 管理本节点上的 Pod，向 Master 汇报 | 每个货架的管理员，负责看管本区域的货物 |
| **kube-proxy** | Worker | 维护节点上的网络规则，实现 Service 的网络转发 | 快递中转站的分拣员，负责把包裹送到正确的通道 |
| **容器运行时** | Worker | 真正运行容器的软件（如 containerd、CRI-O） | 实际装货的叉车和工人 |

---

## 1.4 安装 Kubernetes

学习 Kubernetes 有几种常见方式：

| 方式 | 适合场景 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **Minikube** | 本地学习 | 单节点，安装简单，资源占用少 | 功能有限，无法模拟多节点 |
| **kubeadm** | 搭建正式集群 | 官方工具，功能完整 | 需要多台机器或虚拟机 |
| **云厂商托管** | 生产环境 | 免运维，高可用 | 收费，学习成本较高 |
| **Kind** | CI/CD 测试 | 用 Docker 容器模拟 K8s 节点 | 性能有限 |
| **Docker Desktop** | 已有 Docker 的开发者 | 一键开启，零额外安装 | 仅适合 Mac/Windows |

### 使用 Minikube 搭建本地集群（推荐新手）

**前置条件：**

- 安装 Docker（作为容器运行时）
- 至少 2GB 可用内存
- 至少 2 个可用 CPU 核心

**第一步：安装 Minikube**

```bash
# Windows 用户使用 Chocolatey 安装
choco install minikube

# macOS 用户使用 Homebrew 安装
brew install minikube

# Linux 用户直接下载二进制文件
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

**第二步：启动集群**

```bash
# 启动一个单节点集群
minikube start

# 指定资源（推荐）
minikube start --cpus=2 --memory=4096

# 启动完成后查看集群状态
minikube status
```

**第三步：安装 kubectl**

```bash
# kubectl 是 Kubernetes 的命令行工具，用来和集群交互
# Windows 用户
choco install kubernetes-cli

# macOS 用户
brew install kubectl

# Linux 用户
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

**第四步：验证安装**

```bash
# 查看集群信息
kubectl cluster-info

# 查看节点列表
kubectl get nodes
```

你应该能看到一个状态为 `Ready` 的节点。

---

## 1.5 kubectl 基础命令

kubectl 是你和 Kubernetes 集群交流的"对讲机"。所有操作都通过它发出指令。

### 基本语法

```bash
# kubectl 命令的基本格式
kubectl <动词> <资源类型> <资源名称> [选项]

# 类比：kubectl 是你对仓库管理员说的话
# "kubectl get pods" = "管理员，给我看看所有的 Pod"
```

### 常用命令速查

```bash
# 查看集群中所有的 Pod
kubectl get pods

# 以宽格式输出，显示更多信息
kubectl get pods -o wide

# 查看所有的节点
kubectl get nodes

# 查看集群中所有的 Service
kubectl get services

# 查看集群中所有的 Deployment
kubectl get deployments

# 查看某个 Pod 的详细信息
kubectl describe pod <pod名称>

# 删除一个 Pod
kubectl delete pod <pod名称>

# 通过 YAML 文件创建资源
kubectl apply -f <文件名.yaml>

# 通过 YAML 文件删除资源
kubectl delete -f <文件名.yaml>

# 查看某个 Pod 的日志
kubectl logs <pod名称>

# 进入 Pod 内部执行命令（类似 docker exec）
kubectl exec -it <pod名称> -- /bin/sh
```

### 运行第一个应用

```bash
# 运行一个 Nginx 容器
# 这条命令会创建一个 Deployment，Deployment 再创建 Pod
kubectl create deployment my-nginx --image=nginx:latest

# 查看 Deployment 是否创建成功
kubectl get deployments

# 查看 Pod 的运行状态
kubectl get pods

# 将 Pod 暴露为 Service，让外部可以访问
kubectl expose deployment my-nginx --port=80 --type=NodePort

# 查看 Service 信息
kubectl get services

# 在 Minikube 中打开服务的浏览器地址
minikube service my-nginx
```

### 命令输出解读

```bash
# 执行 kubectl get pods 后的输出示例
NAME                        READY   STATUS    RESTARTS   AGE
my-nginx-7d4f6bfc7b-x2k9s  1/1     Running   0          30s
```

| 列名 | 含义 | 说明 |
| --- | --- | --- |
| NAME | Pod 名称 | 由 Deployment 名称 + 随机后缀组成 |
| READY | 就绪状态 | 1/1 表示 1 个容器就绪，共 1 个容器 |
| STATUS | 当前状态 | Running 表示正在运行 |
| RESTARTS | 重启次数 | 0 表示从未重启 |
| AGE | 已运行时间 | 30s 表示已运行 30 秒 |

---

## 1.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Kubernetes 的定位 | 容器编排平台，自动化部署、扩缩容、故障恢复 |
| 与 Docker 的关系 | Docker 负责打包和运行单个容器，K8s 负责管理大量容器 |
| 架构组成 | Master 节点（控制面）+ Worker 节点（工作节点） |
| 核心组件 | API Server、etcd、Scheduler、Controller Manager、kubelet、kube-proxy |
| Minikube | 本地单节点集群，适合学习 |
| kubectl | 命令行工具，用来和集群交互 |

---

## 1.7 新手常见误区

### 误区 1："Kubernetes 就是 Docker 的升级版"

❌ 错误理解：K8s 和 Docker 是同一个东西的不同版本。

✅ 正确理解：Docker 和 Kubernetes 解决的是不同层面的问题。Docker 负责把应用打包成容器并运行，Kubernetes 负责管理成百上千个容器的调度、网络、存储。它们是互补关系，不是替代关系。

### 误区 2："学习 K8s 之前必须精通 Docker"

❌ 错误理解：要先花几个月把 Docker 学透才能碰 K8s。

✅ 正确理解：你只需要了解 Docker 的基本概念（镜像、容器、Dockerfile）就可以开始学 K8s。当然，Docker 用得越熟，学 K8s 越轻松，但不需要"精通"。

### 误区 3："Minikube 和真实集群差别不大，学 Minikube 就够了"

❌ 错误理解：Minikube 能跑通的操作，生产集群也一样。

✅ 正确理解：Minikube 是单节点集群，无法体验多节点调度、网络策略、高可用等特性。它是入门工具，生产环境要用 kubeadm 或云厂商的托管服务。

### 误区 4："kubectl 命令太多，记不住"

❌ 错误理解：要把所有 kubectl 命令背下来才能用。

✅ 正确理解：常用的命令只有十几个（get、describe、apply、delete、logs、exec），其他的可以用 `kubectl --help` 查。而且可以用别名（alias k=kubectl）提高效率。

---

## 1.8 动手练习

### 练习 1：查看集群信息

使用 kubectl 查看当前集群的信息，包括集群地址、节点列表、节点详细信息。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：查看集群基本信息
kubectl cluster-info

# 第二步：查看节点列表
kubectl get nodes

# 第三步：查看某个节点的详细信息
kubectl describe node <节点名称>
```

</details>

### 练习 2：部署一个应用并查看信息

部署一个 Redis 应用，查看它的 Pod 状态、日志，然后进入 Pod 内部执行命令。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：创建一个 Redis 的 Deployment
kubectl create deployment my-redis --image=redis:latest

# 第二步：查看 Deployment 状态
kubectl get deployments

# 第三步：查看 Pod 状态
kubectl get pods

# 第四步：查看 Pod 的详细描述信息
kubectl describe pod -l app=my-redis

# 第五步：查看 Pod 的日志
kubectl logs -l app=my-redis

# 第六步：进入 Pod 内部执行命令
kubectl exec -it $(kubectl get pods -l app=my-redis -o name) -- redis-cli ping
# 应该返回 PONG
```

</details>

### 练习 3（挑战）：部署并暴露服务

部署一个 Nginx 应用，将它暴露为 NodePort 类型的 Service，然后通过浏览器访问确认能看到 Nginx 欢迎页面。最后清理所有资源。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：创建 Deployment
kubectl create deployment web-nginx --image=nginx:latest

# 第二步：确认 Pod 正在运行
kubectl get pods

# 第三步：暴露为 NodePort 类型的 Service
kubectl expose deployment web-nginx --port=80 --type=NodePort

# 第四步：查看 Service 信息，记下端口号
kubectl get services

# 第五步：在 Minikube 中打开浏览器访问
minikube service web-nginx

# 第六步：清理所有资源（删除 Deployment 会自动删除关联的 Pod）
kubectl delete deployment web-nginx
# Service 需要单独删除
kubectl delete service web-nginx
```

</details>

---

## 下一章预告

下一章我们会深入学习 Kubernetes 的 **核心概念**——Pod、Node、Cluster、Namespace、ReplicaSet、Deployment、Service。这些是理解 Kubernetes 的基石，所有的操作都围绕它们展开。你会明白 K8s 就像一个大型港口，如何高效地管理数以千计的"集装箱"。
