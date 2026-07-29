---
title: '第8章：kubectl Deployment 与 Service 命令'
description: '掌握 Deployment 创建、扩缩容、滚动更新、回滚，以及 Service 暴露端口的命令'
---

# 第8章：kubectl Deployment 与 Service 命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何创建和管理 Deployment？
- 如何实现滚动更新和回滚？
- 如何扩缩容 Deployment？
- 如何创建 Service 暴露应用？

这一章会系统讲解 Deployment 和 Service 相关的所有命令，让你能够熟练管理应用的部署和访问。

---

## 1 Deployment 基础命令

### 1.1 创建 Deployment

**从命令行创建**：

```bash
# 创建 Deployment
kubectl create deployment my-deployment --image=nginx:latest

# 指定副本数
kubectl create deployment my-deployment --image=nginx:latest --replicas=3

# 指定命名空间
kubectl create deployment my-deployment --image=nginx:latest -n my-namespace

# 指定端口
kubectl create deployment my-deployment --image=nginx:latest --port=80

# 指定资源限制
kubectl create deployment my-deployment --image=nginx:latest --limits=cpu=500m,memory=512Mi

# 干跑模式
kubectl create deployment my-deployment --image=nginx:latest --dry-run=client -o yaml > deployment.yaml
```

**从 YAML 文件创建**：

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
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
kubectl apply -f deployment.yaml
```

### 1.2 查看 Deployment

```bash
# 列出所有 Deployment
kubectl get deployments

# 简写
kubectl get deploy

# 显示更多信息
kubectl get deploy -o wide

# 查看所有命名空间
kubectl get deploy -A

# 查看单个 Deployment
kubectl get deploy my-deployment

# 输出 YAML
kubectl get deploy my-deployment -o yaml

# 按标签过滤
kubectl get deploy -l app=nginx
```

**输出示例**：

```
NAME            READY   UP-TO-DATE   AVAILABLE   AGE
my-deployment   3/3     3            3           5m
```

### 1.3 查看 Deployment 详情

```bash
# 查看 Deployment 详细信息
kubectl describe deployment my-deployment
```

### 1.4 删除 Deployment

```bash
# 删除 Deployment
kubectl delete deployment my-deployment

# 从文件删除
kubectl delete -f deployment.yaml
```

---

## 2 Deployment 扩缩容

### 2.1 kubectl scale - 手动扩缩容

```bash
# 扩容到 5 个副本
kubectl scale deployment my-deployment --replicas=5

# 缩容到 2 个副本
kubectl scale deployment my-deployment --replicas=2

# 指定命名空间
kubectl scale deployment my-deployment --replicas=5 -n my-namespace

# 从文件扩缩容
kubectl scale -f deployment.yaml --replicas=5
```

### 2.2 kubectl autoscale - 自动扩缩容

```bash
# 创建 HPA（CPU 使用率 80%，最小 2，最大 10）
kubectl autoscale deployment my-deployment --cpu-percent=80 --min=2 --max=10

# 查看 HPA
kubectl get hpa

# 查看 HPA 详情
kubectl describe hpa my-deployment

# 删除 HPA
kubectl delete hpa my-deployment
```

**HPA YAML 示例**：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-deployment-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 3 Deployment 滚动更新

### 3.1 kubectl set image - 更新镜像

```bash
# 更新镜像
kubectl set image deployment/my-deployment nginx=nginx:1.25.3

# 更新多个容器
kubectl set image deployment/my-deployment nginx=nginx:1.25.3 sidecar=busybox:latest

# 记录更新原因
kubectl set image deployment/my-deployment nginx=nginx:1.25.3 --record
```

### 3.2 kubectl rollout - 管理滚动更新

#### 查看状态

```bash
# 查看滚动更新状态
kubectl rollout status deployment/my-deployment

# 查看更新历史
kubectl rollout history deployment/my-deployment

# 查看指定版本详情
kubectl rollout history deployment/my-deployment --revision=3
```

#### 回滚

```bash
# 回滚到上一个版本
kubectl rollout undo deployment/my-deployment

# 回滚到指定版本
kubectl rollout undo deployment/my-deployment --to-revision=2

# 查看回滚状态
kubectl rollout status deployment/my-deployment
```

#### 暂停和恢复

```bash
# 暂停滚动更新
kubectl rollout pause deployment/my-deployment

# 恢复滚动更新
kubectl rollout resume deployment/my-deployment
```

#### 重启

```bash
# 重启 Deployment（触发滚动更新）
kubectl rollout restart deployment/my-deployment
```

### 3.3 更新策略

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
spec:
  strategy:
    type: RollingUpdate  # RollingUpdate/Recreate
    rollingUpdate:
      maxSurge: 1         # 最多多出 1 个 Pod
      maxUnavailable: 0   # 不允许不可用
```

---

## 4 Service 基础命令

### 4.1 创建 Service

**从命令行创建**：

```bash
# 暴露 Deployment 为 Service
kubectl expose deployment my-deployment --port=80 --target-port=8080

# 指定 Service 类型
kubectl expose deployment my-deployment --port=80 --type=NodePort

# 指定名称
kubectl expose deployment my-deployment --port=80 --name=my-service

# 指定命名空间
kubectl expose deployment my-deployment --port=80 -n my-namespace

# 干跑模式
kubectl expose deployment my-deployment --port=80 --dry-run=client -o yaml > service.yaml
```

**从 YAML 文件创建**：

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

```bash
# 从文件创建
kubectl apply -f service.yaml
```

### 4.2 查看 Service

```bash
# 列出所有 Service
kubectl get services

# 简写
kubectl get svc

# 显示更多信息
kubectl get svc -o wide

# 查看所有命名空间
kubectl get svc -A

# 查看单个 Service
kubectl get svc my-service

# 输出 YAML
kubectl get svc my-service -o yaml
```

**输出示例**：

```
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
my-service   ClusterIP   10.96.100.50   <none>        80/TCP    5m
```

### 4.3 查看 Service 详情

```bash
# 查看 Service 详细信息
kubectl describe service my-service
```

### 4.4 删除 Service

```bash
# 删除 Service
kubectl delete service my-service

# 从文件删除
kubectl delete -f service.yaml
```

---

## 5 Service 类型

### 5.1 ClusterIP（默认）

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

**说明**：只能在集群内部访问。

### 5.2 NodePort

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080  # 可选，范围 30000-32767
  type: NodePort
```

**说明**：通过节点 IP + NodePort 访问。

### 5.3 LoadBalancer

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

**说明**：需要云提供商支持，会分配外部 IP。

### 5.4 ExternalName

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: ExternalName
  externalName: example.com
```

**说明**：将 Service 映射到外部 DNS 名称。

---

## 6 Service 端口配置

### 6.1 单端口

```yaml
ports:
- port: 80           # Service 端口
  targetPort: 8080   # 容器端口
  protocol: TCP
```

### 6.2 多端口

```yaml
ports:
- name: http
  port: 80
  targetPort: 8080
- name: https
  port: 443
  targetPort: 8443
```

### 6.3 端口范围

```yaml
ports:
- name: http
  port: 80
  targetPort: 8080
```

---

## 7 常用命令组合

### 7.1 完整部署流程

```bash
# 1. 创建 Deployment
kubectl create deployment my-deployment --image=nginx:latest --replicas=3

# 2. 查看 Deployment
kubectl get deployment my-deployment

# 3. 暴露为 Service
kubectl expose deployment my-deployment --port=80 --type=NodePort

# 4. 查看 Service
kubectl get service my-deployment

# 5. 测试访问
kubectl port-forward svc/my-deployment 8080:80

# 6. 扩容
kubectl scale deployment my-deployment --replicas=5

# 7. 更新镜像
kubectl set image deployment/my-deployment nginx=nginx:1.25.3

# 8. 查看更新状态
kubectl rollout status deployment/my-deployment

# 9. 回滚
kubectl rollout undo deployment/my-deployment
```

### 7.2 更新流程

```bash
# 1. 更新镜像
kubectl set image deployment/my-deployment nginx=nginx:1.25.3

# 2. 查看状态
kubectl rollout status deployment/my-deployment

# 3. 查看历史
kubectl rollout history deployment/my-deployment

# 4. 如有问题，回滚
kubectl rollout undo deployment/my-deployment
```

---

## 8 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `kubectl create deployment` | 创建 Deployment | `kubectl create deploy my-deploy --image=nginx` |
| `kubectl get deployment` | 列出 Deployment | `kubectl get deploy` |
| `kubectl scale` | 扩缩容 | `kubectl scale deploy my-deploy --replicas=5` |
| `kubectl set image` | 更新镜像 | `kubectl set image deploy/my-deploy nginx=nginx:1.25` |
| `kubectl rollout status` | 查看更新状态 | `kubectl rollout status deploy/my-deploy` |
| `kubectl rollout undo` | 回滚 | `kubectl rollout undo deploy/my-deploy` |
| `kubectl expose` | 暴露 Service | `kubectl expose deploy my-deploy --port=80` |
| `kubectl get service` | 列出 Service | `kubectl get svc` |

---

## 9 本章小结

本章系统讲解了 Deployment 和 Service 相关命令，包括：

**Deployment 管理**：

- 创建、查看、删除 Deployment
- 手动和自动扩缩容
- 滚动更新和回滚
- 更新策略配置

**Service 管理**：

- 创建、查看、删除 Service
- Service 类型（ClusterIP/NodePort/LoadBalancer/ExternalName）
- 端口配置

**实战技巧**：

- 完整部署流程
- 更新和回滚流程

掌握这些命令，你就能够熟练管理 Kubernetes 中的应用部署和访问。下一章会讲解配置管理相关命令。

---

## 10 练习题

1. 创建一个 3 副本的 Deployment
2. 手动扩容到 5 副本
3. 更新 Deployment 镜像
4. 查看滚动更新状态
5. 回滚到上一个版本
6. 暴露 Deployment 为 NodePort Service
7. 使用端口转发测试 Service
