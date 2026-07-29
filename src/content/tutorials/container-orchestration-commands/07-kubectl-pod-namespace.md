---
title: '第7章：kubectl Pod 与 Namespace 命令'
description: '掌握 Pod 创建、查看、删除、日志查看、exec 进入容器、Namespace 管理等命令'
---

# 第7章：kubectl Pod 与 Namespace 命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何创建和管理 Pod？
- 如何查看 Pod 日志？
- 如何进入 Pod 容器？
- 如何管理 Namespace？

这一章会系统讲解 Pod 和 Namespace 相关的所有命令，让你能够熟练管理 Kubernetes 中最基本的资源单元。

---

## 1 Pod 基础命令

### 1.1 创建 Pod

**从命令行创建**：

```bash
# 创建单个 Pod
kubectl run my-pod --image=nginx:latest

# 指定命名空间
kubectl run my-pod --image=nginx:latest -n my-namespace

# 指定标签
kubectl run my-pod --image=nginx:latest --labels=app=nginx,env=dev

# 指定端口
kubectl run my-pod --image=nginx:latest --port=80

# 指定环境变量
kubectl run my-pod --image=nginx:latest --env="NODE_ENV=production"

# 指定资源限制
kubectl run my-pod --image=nginx:latest --limits=cpu=500m,memory=512Mi

# 指定命令
kubectl run my-pod --image=busybox --command -- sleep 3600

# 干跑模式（只生成 YAML，不实际创建）
kubectl run my-pod --image=nginx:latest --dry-run=client -o yaml > pod.yaml
```

**从 YAML 文件创建**：

```yaml
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:latest
    ports:
    - containerPort: 80
```

```bash
# 从文件创建
kubectl apply -f pod.yaml
```

### 1.2 查看 Pod

```bash
# 列出所有 Pod
kubectl get pods

# 显示更多信息
kubectl get pods -o wide

# 查看所有命名空间
kubectl get pods -A

# 指定命名空间
kubectl get pods -n my-namespace

# 查看单个 Pod
kubectl get pod my-pod

# 输出 YAML
kubectl get pod my-pod -o yaml

# 输出 JSON
kubectl get pod my-pod -o json

# 按标签过滤
kubectl get pods -l app=nginx

# 实时监听
kubectl get pods -w

# 查看 Pod 状态
kubectl get pods --field-selector=status.phase=Running
```

**输出示例**：

```
NAME     READY   STATUS    RESTARTS   AGE   IP           NODE
my-pod   1/1     Running   0          5m    10.244.0.5   node1
```

### 1.3 查看 Pod 详情

```bash
# 查看 Pod 详细信息
kubectl describe pod my-pod

# 查看事件
kubectl describe pod my-pod | grep -A 10 Events
```

### 1.4 删除 Pod

```bash
# 删除单个 Pod
kubectl delete pod my-pod

# 删除多个 Pod
kubectl delete pod my-pod1 my-pod2

# 按标签删除
kubectl delete pods -l app=nginx

# 强制删除
kubectl delete pod my-pod --force --grace-period=0

# 删除所有 Pod
kubectl delete pods --all

# 从文件删除
kubectl delete -f pod.yaml
```

---

## 2 Pod 日志命令

### 2.1 kubectl logs - 查看日志

**命令格式**：

```bash
kubectl logs <pod-name> [container-name] [flags]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-f, --follow` | 实时跟踪日志 |
| `--tail=N` | 显示最后 N 行 |
| `-p, --previous` | 查看上一个容器的日志 |
| `-c, --container` | 指定容器（多容器 Pod） |
| `--since=Ns` | 显示最近 N 秒的日志 |
| `--since-time` | 显示某个时间点之后的日志 |
| `--timestamps` | 显示时间戳 |
| `--all-containers` | 所有容器的日志 |
| `--prefix` | 显示容器名前缀 |

**实战示例**：

```bash
# 查看 Pod 日志
kubectl logs my-pod

# 实时跟踪日志
kubectl logs -f my-pod

# 查看最后 50 行
kubectl logs --tail=50 my-pod

# 查看上一个容器的日志
kubectl logs -p my-pod

# 查看多容器 Pod 中指定容器的日志
kubectl logs my-pod -c container-name

# 查看所有容器的日志
kubectl logs my-pod --all-containers

# 查看最近 1 小时的日志
kubectl logs --since=1h my-pod

# 查看最近 60 秒的日志
kubectl logs --since=60s my-pod

# 显示时间戳
kubectl logs --timestamps my-pod

# 组合使用
kubectl logs -f --tail=100 --timestamps my-pod

# 带容器名前缀
kubectl logs my-pod --all-containers --prefix
```

### 2.2 多容器 Pod 日志

```yaml
# 多容器 Pod 示例
apiVersion: v1
kind: Pod
metadata:
  name: multi-container-pod
spec:
  containers:
  - name: app
    image: myapp:latest
  - name: sidecar
    image: busybox
    command: ['sh', '-c', 'while true; do echo "sidecar"; sleep 10; done']
```

```bash
# 查看指定容器日志
kubectl logs multi-container-pod -c app
kubectl logs multi-container-pod -c sidecar

# 查看所有容器日志
kubectl logs multi-container-pod --all-containers
```

---

## 3 进入容器命令

### 3.1 kubectl exec - 在容器中执行命令

**命令格式**：

```bash
kubectl exec <pod-name> [-c container] -- <command> [args...]
```

**常用选项**：

| 选项 | 说明 |
| --- | --- |
| `-i, --stdin` | 保持标准输入打开 |
| `-t, --tty` | 分配伪终端 |
| `-c, --container` | 指定容器 |

**实战示例**：

```bash
# 进入交互式 shell
kubectl exec -it my-pod -- /bin/bash

# 如果容器没有 bash，使用 sh
kubectl exec -it my-pod -- /bin/sh

# 执行单个命令
kubectl exec my-pod -- ls /app

# 查看环境变量
kubectl exec my-pod -- env

# 查看进程
kubectl exec my-pod -- ps aux

# 查看网络配置
kubectl exec my-pod -- ip addr

# 测试网络连通性
kubectl exec my-pod -- ping -c 3 google.com

# 多容器 Pod 中指定容器
kubectl exec -it my-pod -c app -- /bin/bash

# 在指定命名空间执行
kubectl exec -it my-pod -n my-namespace -- /bin/bash
```

### 3.2 kubectl attach - 附加到运行中的容器

```bash
# 附加到容器（查看输出）
kubectl attach my-pod -i

# 附加到指定容器
kubectl attach my-pod -c app -i
```

**区别**：

- `exec`：在容器中执行新命令
- `attach`：附加到容器的主进程（查看输出）

---

## 4 Pod 调试命令

### 4.1 kubectl port-forward - 端口转发

```bash
# 转发本地端口到 Pod
kubectl port-forward my-pod 8080:80

# 转发到指定端口（随机本地端口）
kubectl port-forward my-pod :80

# 转发到 Pod 的指定端口
kubectl port-forward pod/my-pod 8080:80

# 转发到 Service
kubectl port-forward svc/my-service 8080:80

# 转发到 Deployment
kubectl port-forward deploy/my-deployment 8080:80

# 转发到指定命名空间
kubectl port-forward -n my-namespace my-pod 8080:80

# 监听所有地址
kubectl port-forward --address 0.0.0.0 my-pod 8080:80
```

### 4.2 kubectl cp - 复制文件

```bash
# 从 Pod 复制到本地
kubectl cp my-pod:/app/config.json ./config.json

# 从本地复制到 Pod
kubectl cp ./config.json my-pod:/app/config.json

# 指定容器
kubectl cp my-pod:/app/config.json ./config.json -c app

# 复制目录
kubectl cp my-pod:/app/logs ./logs

# 指定命名空间
kubectl cp -n my-namespace my-pod:/app/config.json ./config.json
```

---

## 5 Namespace 管理命令

### 5.1 创建 Namespace

```bash
# 从命令行创建
kubectl create namespace my-namespace

# 从 YAML 文件创建
kubectl apply -f namespace.yaml
```

**namespace.yaml 示例**：

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
  labels:
    env: dev
```

### 5.2 查看 Namespace

```bash
# 列出所有 Namespace
kubectl get namespaces

# 简写
kubectl get ns

# 查看详细信息
kubectl describe namespace my-namespace

# 输出 YAML
kubectl get namespace my-namespace -o yaml
```

### 5.3 切换默认 Namespace

```bash
# 为当前上下文设置默认命名空间
kubectl config set-context --current --namespace=my-namespace

# 验证
kubectl config view --minify | grep namespace
```

### 5.4 删除 Namespace

```bash
# 删除 Namespace（会删除其中所有资源）
kubectl delete namespace my-namespace

# 强制删除
kubectl delete namespace my-namespace --force --grace-period=0
```

**警告**：删除 Namespace 会删除其中所有资源，包括 Pod、Service、Deployment 等。

### 5.5 在指定 Namespace 操作

```bash
# 在所有命名空间查看 Pod
kubectl get pods -A

# 在指定命名空间查看 Pod
kubectl get pods -n my-namespace

# 在指定命名空间创建 Pod
kubectl run my-pod --image=nginx -n my-namespace

# 在指定命名空间删除 Pod
kubectl delete pod my-pod -n my-namespace
```

---

## 6 Pod 生命周期管理

### 6.1 查看 Pod 状态

```bash
# 查看 Pod 状态
kubectl get pods

# 查看 Pod 状态字段
kubectl get pods -o jsonpath='{.items[*].status.phase}'
```

**Pod 状态**：

| 状态 | 说明 |
| --- | --- |
| `Pending` | Pod 已被接受，但尚未运行 |
| `Running` | Pod 已绑定到节点，容器正在运行 |
| `Succeeded` | 所有容器已成功终止 |
| `Failed` | 至少有一个容器失败 |
| `Unknown` | 无法获取 Pod 状态 |

### 6.2 查看 Pod 事件

```bash
# 查看 Pod 事件
kubectl get events --field-selector involvedObject.name=my-pod

# 按时间排序
kubectl get events --sort-by='.lastTimestamp'

# 查看最近事件
kubectl get events --field-selector reason=Failed
```

### 6.3 Pod 重启策略

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  restartPolicy: Always  # Always/OnFailure/Never
  containers:
  - name: app
    image: myapp:latest
```

---

## 7 常用命令组合

### 7.1 Pod 调试流程

```bash
# 1. 查看 Pod 状态
kubectl get pods -o wide

# 2. 查看 Pod 详情
kubectl describe pod my-pod

# 3. 查看日志
kubectl logs my-pod

# 4. 进入容器
kubectl exec -it my-pod -- /bin/bash

# 5. 在容器中测试
kubectl exec my-pod -- curl localhost:80

# 6. 端口转发到本地
kubectl port-forward my-pod 8080:80
```

### 7.2 批量操作

```bash
# 删除所有失败的 Pod
kubectl delete pods --field-selector=status.phase=Failed

# 删除所有命名空间的 Pod（慎用）
kubectl delete pods --all -A

# 按标签批量删除
kubectl delete pods -l app=test
```

---

## 8 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `kubectl run` | 创建 Pod | `kubectl run my-pod --image=nginx` |
| `kubectl get pods` | 列出 Pod | `kubectl get pods -A` |
| `kubectl describe pod` | 查看详情 | `kubectl describe pod my-pod` |
| `kubectl delete pod` | 删除 Pod | `kubectl delete pod my-pod` |
| `kubectl logs` | 查看日志 | `kubectl logs -f my-pod` |
| `kubectl exec` | 执行命令 | `kubectl exec -it my-pod -- bash` |
| `kubectl port-forward` | 端口转发 | `kubectl port-forward my-pod 8080:80` |
| `kubectl cp` | 复制文件 | `kubectl cp my-pod:/file ./file` |
| `kubectl create ns` | 创建命名空间 | `kubectl create ns my-ns` |
| `kubectl get ns` | 列出命名空间 | `kubectl get ns` |

---

## 9 本章小结

本章系统讲解了 Pod 和 Namespace 相关命令，包括：

**Pod 管理**：

- 创建、查看、删除 Pod
- 查看 Pod 日志
- 进入 Pod 容器
- 端口转发和文件复制

**Namespace 管理**：

- 创建、查看、删除 Namespace
- 切换默认 Namespace
- 在指定 Namespace 操作

**调试技巧**：

- 查看 Pod 状态和事件
- 日志分析
- 端口转发调试

掌握这些命令，你就能够熟练管理 Kubernetes 中的 Pod 和 Namespace。下一章会讲解 Deployment 和 Service 相关命令。

---

## 10 练习题

1. 创建一个 Nginx Pod 并查看状态
2. 查看 Pod 日志，实时跟踪输出
3. 进入 Pod 容器，执行命令
4. 将本地文件复制到 Pod 中
5. 使用端口转发访问 Pod
6. 创建多个 Namespace 并在不同 Namespace 中操作
7. 删除 Pod 并验证删除
