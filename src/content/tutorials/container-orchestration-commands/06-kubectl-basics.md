---
title: '第6章：kubectl 入门 - 集群操作基础'
description: '掌握 kubectl 基础命令，学会管理 Kubernetes 集群、查看集群信息、切换上下文'
---

# 第6章：kubectl 入门 - 集群操作基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- kubectl 是什么？如何安装？
- 如何连接到 Kubernetes 集群？
- 如何查看集群信息？
- 如何在多个集群间切换？

这一章会系统讲解 kubectl 基础命令，让你能够熟练管理 Kubernetes 集群。

---

## 1 kubectl 简介

### 1.1 什么是 kubectl？

kubectl 是 Kubernetes 的命令行工具，用于与集群通信，执行各种操作：

- 部署应用
- 管理资源
- 查看日志
- 调试问题

### 1.2 安装 kubectl

**Linux**：

```bash
# 下载最新版本
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# 添加执行权限
chmod +x kubectl

# 移动到 PATH
sudo mv kubectl /usr/local/bin/
```

**macOS**：

```bash
# 使用 Homebrew
brew install kubectl
```

**Windows**：

```powershell
# 使用 Chocolatey
choco install kubernetes-cli

# 或使用 scoop
scoop install kubectl
```

### 1.3 验证安装

```bash
# 查看版本
kubectl version --client

# 查看详细信息
kubectl version --client --output=yaml
```

---

## 2 kubectl 命令格式

### 2.1 基本语法

```bash
kubectl [command] [type] [name] [flags]
```

**说明**：

- `command`：操作类型（get、create、delete 等）
- `type`：资源类型（pod、service、deployment 等）
- `name`：资源名称
- `flags`：可选参数

**示例**：

```bash
kubectl get pod my-pod
kubectl delete service my-service
kubectl describe deployment my-deployment
```

### 2.2 常用命令分类

**查看类**：

| 命令 | 说明 |
| --- | --- |
| `get` | 列出资源 |
| `describe` | 显示详细信息 |
| `logs` | 查看容器日志 |
| `top` | 查看资源占用 |

**管理类**：

| 命令 | 说明 |
| --- | --- |
| `create` | 创建资源 |
| `apply` | 应用配置 |
| `delete` | 删除资源 |
| `edit` | 编辑资源 |
| `patch` | 更新资源 |

**操作类**：

| 命令 | 说明 |
| --- | --- |
| `exec` | 在容器中执行命令 |
| `cp` | 复制文件 |
| `port-forward` | 端口转发 |
| `expose` | 暴露服务 |

**配置类**：

| 命令 | 说明 |
| --- | --- |
| `config` | 管理 kubeconfig |
| `cluster-info` | 查看集群信息 |
| `api-resources` | 列出 API 资源 |
| `api-versions` | 列出 API 版本 |

---

## 3 集群信息命令

### 3.1 kubectl cluster-info - 查看集群信息

```bash
# 查看集群基本信息
kubectl cluster-info

# 查看详细版本信息
kubectl version

# 查看集群信息（详细）
kubectl cluster-info dump
```

**输出示例**：

```
Kubernetes control plane is running at https://192.168.1.100:6443
CoreDNS is running at https://192.168.1.100:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

### 3.2 kubectl api-resources - 列出 API 资源

```bash
# 列出所有 API 资源
kubectl api-resources

# 按名称排序
kubectl api-resources --sort-by=name

# 只显示支持特定操作的资源
kubectl api-resources --verbs=list
kubectl api-resources --verbs=get,list,watch

# 按类别过滤
kubectl api-resources --category=all
```

**输出示例**：

```
NAME                              SHORTNAMES   APIVERSION                        NAMESPACED   KIND
pods                              po           v1                                true         Pod
services                          svc          v1                                true         Service
deployments                       deploy       apps/v1                           true         Deployment
replicasets                       rs           apps/v1                           true         ReplicaSet
```

### 3.3 kubectl api-versions - 列出 API 版本

```bash
# 列出所有 API 版本
kubectl api-versions
```

**输出示例**：

```
admissionregistration.k8s.io/v1
apiextensions.k8s.io/v1
apps/v1
authentication.k8s.io/v1
authorization.k8s.io/v1
autoscaling/v1
autoscaling/v2
batch/v1
```

---

## 4 kubeconfig 管理

### 4.1 kubeconfig 文件结构

kubeconfig 文件默认位于 `~/.kube/config`，包含：

- **clusters**：集群连接信息
- **users**：用户认证信息
- **contexts**：集群和用户组合

```yaml
apiVersion: v1
kind: Config
clusters:
- cluster:
    server: https://192.168.1.100:6443
    certificate-authority-data: ...
  name: my-cluster
contexts:
- context:
    cluster: my-cluster
    user: my-user
    namespace: default
  name: my-context
current-context: my-context
users:
- name: my-user
  user:
    client-certificate-data: ...
    client-key-data: ...
```

### 4.2 kubectl config - 管理 kubeconfig

#### 查看当前配置

```bash
# 查看当前上下文
kubectl config current-context

# 查看所有上下文
kubectl config get-contexts

# 查看完整配置
kubectl config view
```

#### 切换上下文

```bash
# 切换到指定上下文
kubectl config use-context my-context

# 简写
kubectl config use-context dev-cluster
```

#### 设置默认命名空间

```bash
# 为当前上下文设置默认命名空间
kubectl config set-context --current --namespace=my-namespace
```

#### 删除上下文

```bash
# 删除上下文
kubectl config delete-context old-context
```

### 4.3 使用多个 kubeconfig 文件

```bash
# 指定 kubeconfig 文件
kubectl --kubeconfig=/path/to/kubeconfig get pods

# 或使用环境变量
export KUBECONFIG=/path/to/kubeconfig
kubectl get pods

# 合并多个 kubeconfig 文件
export KUBECONFIG=~/.kube/config:~/.kube/config2
kubectl config view --merge
```

---

## 5 基础查看命令

### 5.1 kubectl get - 列出资源

**命令格式**：

```bash
kubectl get <resource-type> [name] [flags]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-A, --all-namespaces` | 所有命名空间 |
| `-n, --namespace` | 指定命名空间 |
| `-o, --output` | 输出格式（json/yaml/wide/name） |
| `-l, --selector` | 标签选择器 |
| `--sort-by` | 排序字段 |
| `-w, --watch` | 实时监听 |
| `--no-headers` | 不显示表头 |
| `-L` | 显示标签列 |

**实战示例**：

```bash
# 列出所有 Pod
kubectl get pods

# 列出所有命名空间的 Pod
kubectl get pods -A

# 指定命名空间
kubectl get pods -n kube-system

# 显示详细信息
kubectl get pods -o wide

# 输出 YAML 格式
kubectl get pod my-pod -o yaml

# 输出 JSON 格式
kubectl get pod my-pod -o json

# 按标签过滤
kubectl get pods -l app=nginx

# 按名称排序
kubectl get pods --sort-by=.metadata.name

# 实时监听
kubectl get pods -w

# 不显示表头
kubectl get pods --no-headers

# 显示标签
kubectl get pods -L app,env

# 列出所有资源
kubectl get all
```

### 5.2 kubectl describe - 显示详细信息

```bash
# 查看 Pod 详细信息
kubectl describe pod my-pod

# 查看 Deployment 详细信息
kubectl describe deployment my-deployment

# 查看 Node 详细信息
kubectl describe node node1

# 查看 Service 详细信息
kubectl describe service my-service

# 查看事件
kubectl describe pod my-pod | grep -A 10 Events
```

**输出示例**：

```
Name:         my-pod
Namespace:    default
Priority:     0
Node:         node1/192.168.1.101
Start Time:   Mon, 01 Jan 2024 10:00:00 +0800
Labels:       app=nginx
Status:       Running
IP:           10.244.0.5
Containers:
  nginx:
    Image:          nginx:latest
    Port:           80/TCP
    State:          Running
      Started:      Mon, 01 Jan 2024 10:00:05 +0800
    Ready:          True
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  5m    default-scheduler  Successfully assigned default/my-pod to node1
  Normal  Pulled     5m    kubelet            Container image "nginx:latest" already present
  Normal  Created    5m    kubelet            Created container nginx
  Normal  Started    5m    kubelet            Started container nginx
```

### 5.3 kubectl explain - 查看资源文档

```bash
# 查看 Pod 文档
kubectl explain pod

# 查看 Pod 的 spec 字段
kubectl explain pod.spec

# 查看 Pod 的 containers 字段
kubectl explain pod.spec.containers

# 递归查看
kubectl explain pod --recursive
```

---

## 6 资源创建与删除

### 6.1 kubectl create - 创建资源

**从命令行创建**：

```bash
# 创建命名空间
kubectl create namespace my-namespace

# 创建 Deployment
kubectl create deployment my-deployment --image=nginx:latest

# 创建 Service
kubectl expose deployment my-deployment --port=80 --target-port=8080

# 创建 ConfigMap
kubectl create configmap my-config --from-file=config.json

# 创建 Secret
kubectl create secret generic my-secret --from-literal=password=secret
```

**从文件创建**：

```bash
# 从 YAML 文件创建
kubectl create -f pod.yaml

# 从目录创建
kubectl create -f ./dir/

# 从 URL 创建
kubectl create -f https://example.com/pod.yaml
```

### 6.2 kubectl apply - 应用配置

```bash
# 应用配置文件
kubectl apply -f deployment.yaml

# 应用目录
kubectl apply -f ./dir/

# 应用 URL
kubectl apply -f https://example.com/deployment.yaml

# 应用多个文件
kubectl apply -f deployment.yaml -f service.yaml

# 应用 stdin
cat deployment.yaml | kubectl apply -f -
```

**create vs apply 的区别**：

- `create`：创建资源，如果已存在会报错
- `apply`：创建或更新资源，幂等操作

### 6.3 kubectl delete - 删除资源

```bash
# 删除 Pod
kubectl delete pod my-pod

# 删除多个资源
kubectl delete pod my-pod1 my-pod2

# 按标签删除
kubectl delete pods -l app=nginx

# 删除命名空间所有资源
kubectl delete all --all -n my-namespace

# 从文件删除
kubectl delete -f deployment.yaml

# 强制删除
kubectl delete pod my-pod --force --grace-period=0

# 不等待删除完成
kubectl delete pod my-pod --wait=false
```

---

## 7 kubectl 输出格式

### 7.1 常用输出格式

```bash
# 表格格式（默认）
kubectl get pods

# 宽表格
kubectl get pods -o wide

# YAML 格式
kubectl get pod my-pod -o yaml

# JSON 格式
kubectl get pod my-pod -o json

# 只输出名称
kubectl get pods -o name

# 只输出 JSONPath
kubectl get pod my-pod -o jsonpath='{.status.phase}'

# 自定义列
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
```

### 7.2 JSONPath 表达式

```bash
# 获取 Pod 名称
kubectl get pods -o jsonpath='{.items[*].metadata.name}'

# 获取 Pod 状态
kubectl get pods -o jsonpath='{.items[*].status.phase}'

# 获取容器镜像
kubectl get pods -o jsonpath='{.items[*].spec.containers[*].image}'

# 格式化输出
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'
```

---

## 8 常用命令组合

### 8.1 查看集群状态

```bash
# 1. 查看集群信息
kubectl cluster-info

# 2. 查看节点状态
kubectl get nodes

# 3. 查看所有命名空间
kubectl get namespaces

# 4. 查看系统 Pod
kubectl get pods -n kube-system
```

### 8.2 快速调试

```bash
# 1. 查看 Pod 状态
kubectl get pods -o wide

# 2. 查看 Pod 详情
kubectl describe pod my-pod

# 3. 查看日志
kubectl logs my-pod

# 4. 进入容器
kubectl exec -it my-pod -- /bin/bash
```

---

## 9 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `kubectl cluster-info` | 查看集群信息 | `kubectl cluster-info` |
| `kubectl version` | 查看版本 | `kubectl version --client` |
| `kubectl config` | 管理配置 | `kubectl config get-contexts` |
| `kubectl get` | 列出资源 | `kubectl get pods -A` |
| `kubectl describe` | 查看详情 | `kubectl describe pod my-pod` |
| `kubectl create` | 创建资源 | `kubectl create -f pod.yaml` |
| `kubectl apply` | 应用配置 | `kubectl apply -f deployment.yaml` |
| `kubectl delete` | 删除资源 | `kubectl delete pod my-pod` |
| `kubectl explain` | 查看文档 | `kubectl explain pod.spec` |

---

## 10 本章小结

本章系统讲解了 kubectl 基础命令，包括：

**集群管理**：

- `cluster-info` 查看集群信息
- `version` 查看版本
- `config` 管理 kubeconfig
- 上下文切换

**资源查看**：

- `get` 列出资源
- `describe` 显示详情
- `explain` 查看文档

**资源管理**：

- `create` 创建资源
- `apply` 应用配置
- `delete` 删除资源

**输出格式**：

- YAML/JSON 格式
- JSONPath 表达式
- 自定义列

掌握这些命令，你就能够熟练使用 kubectl 管理 Kubernetes 集群。下一章会讲解 Pod 和 Namespace 相关命令。

---

## 11 练习题

1. 安装 kubectl 并验证安装
2. 配置 kubeconfig 连接到集群
3. 查看集群信息和节点状态
4. 切换不同的上下文
5. 列出所有命名空间的 Pod
6. 使用不同输出格式查看资源
7. 创建并删除一个测试 Pod
