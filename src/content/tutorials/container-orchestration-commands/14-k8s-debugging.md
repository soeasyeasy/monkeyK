---
title: '第14章：Kubernetes 调试与排障命令'
description: '掌握 kubectl logs/exec/port-forward、top/drain/cordon、事件排查等调试命令'
---

# 第14章：Kubernetes 调试与排障命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Pod 启动失败如何排查？
- 如何查看容器日志？
- 如何进入容器调试？
- 如何维护节点？

这一章会系统讲解 Kubernetes 调试与排障相关的所有命令，让你能够快速定位和解决问题。

---

## 1 Pod 调试命令

### 1.1 查看 Pod 状态

```bash
# 查看 Pod 状态
kubectl get pods

# 显示更多信息
kubectl get pods -o wide

# 查看所有 Pod（包括已终止的）
kubectl get pods --show-all

# 按状态过滤
kubectl get pods --field-selector=status.phase=Failed

# 查看 Pod 状态字段
kubectl get pods -o jsonpath='{.items[*].status.phase}'
```

**Pod 状态说明**：

| 状态 | 说明 |
| --- | --- |
| `Pending` | Pod 已被接受，但尚未运行 |
| `Running` | Pod 已绑定到节点，容器正在运行 |
| `Succeeded` | 所有容器已成功终止 |
| `Failed` | 至少有一个容器失败 |
| `Unknown` | 无法获取 Pod 状态 |
| `CrashLoopBackOff` | 容器反复崩溃 |
| `ImagePullBackOff` | 无法拉取镜像 |
| `ErrImagePull` | 拉取镜像错误 |
| `InvalidImageName` | 镜像名称无效 |

### 1.2 查看 Pod 详情

```bash
# 查看 Pod 详细信息
kubectl describe pod my-pod

# 查看事件
kubectl describe pod my-pod | grep -A 20 Events

# 查看容器状态
kubectl describe pod my-pod | grep -A 10 "Containers:"

# 查看条件
kubectl describe pod my-pod | grep -A 10 "Conditions:"
```

### 1.3 查看 Pod 日志

```bash
# 查看 Pod 日志
kubectl logs my-pod

# 实时跟踪
kubectl logs -f my-pod

# 查看上一个容器的日志
kubectl logs -p my-pod

# 查看最后 100 行
kubectl logs --tail=100 my-pod

# 查看最近 1 小时
kubectl logs --since=1h my-pod

# 多容器 Pod 查看指定容器
kubectl logs my-pod -c container-name

# 查看所有容器日志
kubectl logs my-pod --all-containers

# 显示时间戳
kubectl logs --timestamps my-pod
```

### 1.4 进入容器调试

```bash
# 进入交互式 shell
kubectl exec -it my-pod -- /bin/bash

# 如果没有 bash，使用 sh
kubectl exec -it my-pod -- /bin/sh

# 执行单个命令
kubectl exec my-pod -- ls /app

# 查看环境变量
kubectl exec my-pod -- env

# 查看进程
kubectl exec my-pod -- ps aux

# 测试网络
kubectl exec my-pod -- ping -c 3 google.com

# 查看网络配置
kubectl exec my-pod -- ip addr

# 多容器 Pod 指定容器
kubectl exec -it my-pod -c container-name -- /bin/bash
```

### 1.5 端口转发

```bash
# 转发本地端口到 Pod
kubectl port-forward my-pod 8080:80

# 转发到 Service
kubectl port-forward svc/my-service 8080:80

# 转发到 Deployment
kubectl port-forward deploy/my-deployment 8080:80

# 监听所有地址
kubectl port-forward --address 0.0.0.0 my-pod 8080:80

# 随机本地端口
kubectl port-forward my-pod :80
```

---

## 2 节点管理命令

### 2.1 查看节点状态

```bash
# 列出所有节点
kubectl get nodes

# 显示更多信息
kubectl get nodes -o wide

# 查看节点详情
kubectl describe node node1

# 查看节点条件
kubectl get nodes -o jsonpath='{.items[*].status.conditions[*].type}'

# 查看节点资源
kubectl top node
```

### 2.2 kubectl cordon - 标记节点不可调度

```bash
# 标记节点不可调度
kubectl cordon node1

# 验证
kubectl get nodes
```

**说明**：cordon 后，新 Pod 不会被调度到该节点，但现有 Pod 继续运行。

### 2.3 kubectl uncordon - 恢复节点可调度

```bash
# 恢复节点可调度
kubectl uncordon node1
```

### 2.4 kubectl drain - 排空节点

```bash
# 排空节点（迁移所有 Pod）
kubectl drain node1

# 忽略 DaemonSet
kubectl drain node1 --ignore-daemonsets

# 强制删除（包括没有控制器的 Pod）
kubectl drain node1 --force --ignore-daemonsets

# 设置超时
kubectl drain node1 --grace-period=30

# 删除本地数据
kubectl drain node1 --delete-emptydir-data
```

**说明**：drain 会先 cordon 节点，然后驱逐所有 Pod。

### 2.5 节点维护流程

```bash
# 1. 标记节点不可调度
kubectl cordon node1

# 2. 排空节点
kubectl drain node1 --ignore-daemonsets --delete-emptydir-data

# 3. 执行维护操作
# ...

# 4. 恢复节点
kubectl uncordon node1
```

---

## 3 事件查看命令

### 3.1 查看集群事件

```bash
# 查看所有事件
kubectl get events

# 按时间排序
kubectl get events --sort-by='.lastTimestamp'

# 查看最近事件
kubectl get events --sort-by='.metadata.creationTimestamp'

# 按命名空间过滤
kubectl get events -n my-namespace

# 按类型过滤
kubectl get events --field-selector type=Warning

# 按原因过滤
kubectl get events --field-selector reason=Failed

# 按资源过滤
kubectl get events --field-selector involvedObject.name=my-pod

# 查看最近 1 小时
kubectl get events --since=1h
```

### 3.2 查看 Pod 事件

```bash
# 查看 Pod 事件
kubectl get events --field-selector involvedObject.name=my-pod

# 查看 Pod 相关事件
kubectl get events --field-selector involvedObject.kind=Pod,involvedObject.name=my-pod
```

### 3.3 查看节点事件

```bash
# 查看节点事件
kubectl get events --field-selector involvedObject.kind=Node
```

---

## 4 资源监控命令

### 4.1 kubectl top - 查看资源占用

```bash
# 查看节点资源占用
kubectl top node

# 查看 Pod 资源占用
kubectl top pod

# 查看指定 Pod
kubectl top pod my-pod

# 查看所有命名空间
kubectl top pod -A

# 查看容器资源占用
kubectl top pod my-pod --containers

# 按 CPU 排序
kubectl top pod --sort-by=cpu

# 按内存排序
kubectl top pod --sort-by=memory
```

**输出示例**：

```
NAME     CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
my-pod   50m          5%     128Mi           2%
```

---

## 5 调试工具

### 5.1 kubectl debug - 调试 Pod

**调试运行中的 Pod**：

```bash
# 创建调试容器
kubectl debug my-pod -it --image=busybox

# 附加到现有容器
kubectl debug my-pod -it --container=app --image=busybox

# 调试节点
kubectl debug node/node1 -it --image=busybox
```

### 5.2 kubectl run - 创建调试 Pod

```bash
# 创建调试 Pod
kubectl run debug-pod --image=busybox --rm -it --restart=Never -- /bin/sh

# 创建带网络工具的 Pod
kubectl run debug-pod --image=nicolaka/netshoot --rm -it --restart=Never -- /bin/bash
```

### 5.3 使用 ephemeral containers

```bash
# 附加临时容器到运行中的 Pod
kubectl debug my-pod -it --image=busybox --target=app
```

---

## 6 常见问题排查

### 6.1 Pod 无法启动

```bash
# 1. 查看 Pod 状态
kubectl get pods

# 2. 查看详情
kubectl describe pod my-pod

# 3. 查看日志
kubectl logs my-pod

# 4. 查看上一个容器日志
kubectl logs -p my-pod

# 5. 查看事件
kubectl get events --field-selector involvedObject.name=my-pod
```

**常见原因**：

- 镜像拉取失败
- 资源不足
- 配置错误
- 健康检查失败

### 6.2 Pod 反复重启

```bash
# 1. 查看重启次数
kubectl get pods

# 2. 查看容器状态
kubectl describe pod my-pod

# 3. 查看日志
kubectl logs my-pod --previous

# 4. 查看事件
kubectl get events --field-selector involvedObject.name=my-pod
```

**常见原因**：

- 应用崩溃
- 内存不足（OOMKilled）
- 健康检查失败

### 6.3 Service 无法访问

```bash
# 1. 查看 Service
kubectl get svc

# 2. 查看 Endpoints
kubectl get endpoints my-service

# 3. 查看 Pod 标签
kubectl get pods --show-labels

# 4. 测试连通性
kubectl exec my-pod -- curl my-service:80

# 5. 端口转发测试
kubectl port-forward svc/my-service 8080:80
```

**常见原因**：

- Pod 标签不匹配
- Pod 未就绪
- 端口配置错误

### 6.4 节点 NotReady

```bash
# 1. 查看节点状态
kubectl get nodes

# 2. 查看节点详情
kubectl describe node node1

# 3. 查看节点条件
kubectl get node node1 -o jsonpath='{.status.conditions}'

# 4. 查看 kubelet 日志
journalctl -u kubelet -f
```

**常见原因**：

- kubelet 未运行
- 网络问题
- 资源不足

---

## 7 常用命令组合

### 7.1 完整调试流程

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

# 6. 端口转发
kubectl port-forward my-pod 8080:80

# 7. 查看事件
kubectl get events --sort-by='.lastTimestamp'
```

### 7.2 节点维护流程

```bash
# 1. 标记不可调度
kubectl cordon node1

# 2. 排空节点
kubectl drain node1 --ignore-daemonsets --delete-emptydir-data

# 3. 执行维护
# ...

# 4. 恢复节点
kubectl uncordon node1

# 5. 验证
kubectl get nodes
```

---

## 8 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `kubectl describe pod` | 查看 Pod 详情 | `kubectl describe pod my-pod` |
| `kubectl logs` | 查看日志 | `kubectl logs -f my-pod` |
| `kubectl exec` | 执行命令 | `kubectl exec -it my-pod -- bash` |
| `kubectl port-forward` | 端口转发 | `kubectl port-forward my-pod 8080:80` |
| `kubectl cordon` | 标记不可调度 | `kubectl cordon node1` |
| `kubectl drain` | 排空节点 | `kubectl drain node1 --ignore-daemonsets` |
| `kubectl uncordon` | 恢复可调度 | `kubectl uncordon node1` |
| `kubectl top` | 资源监控 | `kubectl top pod` |
| `kubectl get events` | 查看事件 | `kubectl get events --sort-by='.lastTimestamp'` |
| `kubectl debug` | 调试 Pod | `kubectl debug my-pod -it --image=busybox` |

---

## 9 本章小结

本章系统讲解了 Kubernetes 调试与排障相关命令，包括：

**Pod 调试**：

- 查看状态、详情、日志
- 进入容器执行命令
- 端口转发

**节点管理**：

- cordon/drain/uncordon
- 节点维护流程

**事件查看**：

- 查看集群事件
- 按条件过滤

**资源监控**：

- top 命令查看资源占用

**常见问题排查**：

- Pod 无法启动
- Pod 反复重启
- Service 无法访问
- 节点 NotReady

掌握这些命令，你就能够快速定位和解决 Kubernetes 中的各种问题。下一章会讲解常用命令速查与效率技巧。

---

## 10 练习题

1. 查看 Pod 状态和详情
2. 查看 Pod 日志并实时跟踪
3. 进入 Pod 容器执行命令
4. 使用端口转发测试 Service
5. 标记节点不可调度并排空
6. 查看集群事件并过滤
7. 使用 top 命令监控资源
