---
title: "第12章：Kubernetes 部署模型服务"
description: "K8s 基础，Deployment 配置，Service 暴露，自动扩缩容"
---

# 第12章：Kubernetes 部署模型服务

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Kubernetes？为什么要用它部署模型？
- 如何编写 Deployment 和 Service 配置？
- 如何实现自动扩缩容？
- 如何进行滚动更新和回滚？

这一章就是为了解答这些问题。我们会学习 Kubernetes 的核心概念，掌握如何在 K8s 上部署和管理模型服务。

---

## 1 为什么需要 Kubernetes？

### 痛点分析

想象一下这个场景：你的模型服务上线了，用户量激增：

```bash
# 单台服务器扛不住了
# 需要手动扩容：
# 1. 购买新服务器
# 2. 配置环境
# 3. 部署应用
# 4. 配置负载均衡
# 太麻烦了...
```

或者更糟糕的情况：

```bash
# 服务挂了
# 需要手动重启
# 用户已经投诉了...

# 流量高峰
# 需要手动扩容
# 等扩容完成，用户已经走了...
```

> **一句话总结**：手动运维效率低、响应慢，无法满足生产环境的需求。

### 解决方案

Kubernetes（K8s）是一个容器编排平台，可以自动化部署、扩展和管理容器化应用。

核心能力：
- **自动部署**：声明式配置，自动部署应用
- **自动扩缩容**：根据负载自动调整实例数
- **自愈能力**：自动重启故障容器
- **滚动更新**：零停机更新应用
- **服务发现**：自动分配 IP 和 DNS

打个比方：

> K8s 就像是一个智能管家，自动管理你的应用，帮你处理扩容、重启、更新等琐事。

---

## 2 核心原理

### K8s 核心概念

| 概念 | 说明 | 类比 |
| --- | --- | --- |
| Pod | 最小部署单元，包含一个或多个容器 | 一个应用实例 |
| Deployment | 管理 Pod 的部署和更新 | 应用管理器 |
| Service | 暴露 Pod 的网络接口 | 负载均衡器 |
| Namespace | 资源隔离 | 文件夹 |
| ConfigMap | 配置文件 | 配置中心 |
| Secret | 敏感信息 | 保险箱 |
| Ingress | 外部访问入口 | 网关 |

### K8s 架构

```
Master Node（控制平面）
├── API Server（API 入口）
├── Scheduler（调度器）
├── Controller Manager（控制器）
└── etcd（数据存储）

Worker Node（工作节点）
├── Kubelet（节点代理）
├── Kube Proxy（网络代理）
└── Container Runtime（容器运行时）
```

---

## 3 基础用法

### 创建 Deployment

创建 `deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api
  labels:
    app: model-api
spec:
  replicas: 3  # 运行 3 个副本
  selector:
    matchLabels:
      app: model-api
  template:
    metadata:
      labels:
        app: model-api
    spec:
      containers:
      - name: model-api
        image: model-service:1.0.0
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

应用配置：

```bash
# 应用 Deployment
kubectl apply -f deployment.yaml

# 查看 Pod 状态
kubectl get pods

# 查看 Deployment 状态
kubectl get deployments

# 查看 Pod 日志
kubectl logs -f deployment/model-api

# 进入 Pod
kubectl exec -it deployment/model-api -- /bin/bash
```

### 创建 Service

创建 `service.yaml`：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: model-api-service
spec:
  selector:
    app: model-api
  ports:
  - protocol: TCP
    port: 80        # Service 端口
    targetPort: 8000  # Pod 端口
  type: LoadBalancer  # 外部可访问
```

应用配置：

```bash
# 应用 Service
kubectl apply -f service.yaml

# 查看 Service
kubectl get services

# 获取外部 IP
kubectl get service model-api-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### 使用 ConfigMap 和 Secret

创建 `configmap.yaml`：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: model-config
data:
  MODEL_PATH: "/app/data/models/model.joblib"
  LOG_LEVEL: "INFO"
  ENVIRONMENT: "production"
```

创建 `secret.yaml`：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: model-secret
type: Opaque
data:
  # base64 编码
  API_KEY: c2VjcmV0LWtleS0xMjM=  # echo -n "secret-key-123" | base64
  DATABASE_URL: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0Bsb2NhbGhvc3QvZGI=
```

在 Deployment 中使用：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: model-api
  template:
    metadata:
      labels:
        app: model-api
    spec:
      containers:
      - name: model-api
        image: model-service:1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: MODEL_PATH
          valueFrom:
            configMapKeyRef:
              name: model-config
              key: MODEL_PATH
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: model-config
              key: LOG_LEVEL
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: model-secret
              key: API_KEY
```

---

## 4 进阶用法

### 自动扩缩容

创建 `hpa.yaml`（Horizontal Pod Autoscaler）：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: model-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: model-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # CPU 使用率超过 70% 时扩容
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80  # 内存使用率超过 80% 时扩容
```

应用配置：

```bash
kubectl apply -f hpa.yaml

# 查看 HPA 状态
kubectl get hpa

# 查看详细信息
kubectl describe hpa model-api-hpa
```

### 滚动更新

更新镜像版本：

```bash
# 更新镜像
kubectl set image deployment/model-api model-api=model-service:1.1.0

# 查看更新状态
kubectl rollout status deployment/model-api

# 查看更新历史
kubectl rollout history deployment/model-api

# 回滚到上一版本
kubectl rollout undo deployment/model-api

# 回滚到指定版本
kubectl rollout undo deployment/model-api --to-revision=2
```

在 Deployment 中配置更新策略：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多多出 1 个 Pod
      maxUnavailable: 0  # 不允许有不可用的 Pod
  selector:
    matchLabels:
      app: model-api
  template:
    metadata:
      labels:
        app: model-api
    spec:
      containers:
      - name: model-api
        image: model-service:1.0.0
        ports:
        - containerPort: 8000
```

### 使用 Ingress

创建 `ingress.yaml`：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: model-api-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: model-api-service
            port:
              number: 80
```

应用配置：

```bash
kubectl apply -f ingress.yaml

# 查看 Ingress
kubectl get ingress
```

### 使用 Persistent Volume

创建 `pvc.yaml`：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
```

在 Deployment 中使用：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: model-api
  template:
    metadata:
      labels:
        app: model-api
    spec:
      containers:
      - name: model-api
        image: model-service:1.0.0
        ports:
        - containerPort: 8000
        volumeMounts:
        - name: model-data
          mountPath: /app/data
      volumes:
      - name: model-data
        persistentVolumeClaim:
          claimName: model-data-pvc
```

### GPU 支持

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api-gpu
spec:
  replicas: 1
  selector:
    matchLabels:
      app: model-api-gpu
  template:
    metadata:
      labels:
        app: model-api-gpu
    spec:
      containers:
      - name: model-api
        image: model-service-gpu:1.0.0
        ports:
        - containerPort: 8000
        resources:
          limits:
            nvidia.com/gpu: 1  # 请求 1 个 GPU
            memory: "8Gi"
            cpu: "4000m"
          requests:
            nvidia.com/gpu: 1
            memory: "4Gi"
            cpu: "2000m"
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Deployment | 管理 Pod 的部署和更新 |
| Service | 暴露 Pod 的网络接口 |
| ConfigMap | 存储配置信息 |
| Secret | 存储敏感信息 |
| HPA | 自动扩缩容 |
| Ingress | 外部访问入口 |
| PVC | 持久化存储 |
| 滚动更新 | 零停机更新应用 |

---

## 6 新手常见误区

### 误区 1："K8s 太复杂，小项目不需要"

**错！** K8s 适合各种规模的项目：
- 小项目可以使用 Minikube 或 K3s
- 可以简化部署和运维
- 提供自动扩缩容和自愈能力

正确做法：根据项目规模选择合适的 K8s 发行版。

### 误区 2："不需要配置资源限制"

**错！** 不配置资源限制会导致：
- Pod 占用过多资源
- 影响其他 Pod
- 节点资源耗尽

正确做法：为每个 Pod 配置 requests 和 limits。

### 误区 3："不需要健康检查"

**错！** 没有健康检查会导致：
- 无法自动重启故障 Pod
- 负载均衡器无法判断 Pod 状态
- 用户请求失败

正确做法：配置 livenessProbe 和 readinessProbe。

### 误区 4："所有配置都写在代码里"

**错！** 硬编码配置会导致：
- 不同环境需要修改代码
- 敏感信息泄露
- 难以维护

正确做法：使用 ConfigMap 和 Secret 管理配置。

### 误区 5："不需要自动扩缩容"

**错！** 没有自动扩缩容会导致：
- 流量高峰时服务不可用
- 流量低谷时资源浪费
- 需要人工干预

正确做法：配置 HPA，根据负载自动调整实例数。

---

## 7 动手练习

### 练习 1：基础练习 - 创建 Deployment 和 Service

创建一个简单的模型服务 Deployment 和 Service。

<details>
<summary>点击查看答案</summary>

`deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: model-api
  template:
    metadata:
      labels:
        app: model-api
    spec:
      containers:
      - name: model-api
        image: model-service:1.0.0
        ports:
        - containerPort: 8000
```

`service.yaml`：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: model-api-service
spec:
  selector:
    app: model-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

应用：

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

</details>

### 练习 2：进阶练习 - 配置自动扩缩容

为模型服务配置 HPA，根据 CPU 使用率自动扩缩容。

<details>
<summary>点击查看答案</summary>

`hpa.yaml`：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: model-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: model-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

应用：

```bash
kubectl apply -f hpa.yaml
kubectl get hpa
```

</details>

### 练习 3（挑战）：综合练习 - 完整的 K8s 部署

创建一个完整的 K8s 部署方案，包括 Deployment、Service、ConfigMap、Secret、HPA。

<details>
<summary>点击查看答案</summary>

项目结构：

```
k8s/
├── configmap.yaml
├── secret.yaml
├── deployment.yaml
├── service.yaml
└── hpa.yaml
```

`configmap.yaml`：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: model-config
data:
  MODEL_PATH: "/app/data/models/model.joblib"
  LOG_LEVEL: "INFO"
```

`secret.yaml`：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: model-secret
type: Opaque
data:
  API_KEY: c2VjcmV0LWtleS0xMjM=
```

`deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: model-api
  template:
    metadata:
      labels:
        app: model-api
    spec:
      containers:
      - name: model-api
        image: model-service:1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: MODEL_PATH
          valueFrom:
            configMapKeyRef:
              name: model-config
              key: MODEL_PATH
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: model-secret
              key: API_KEY
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

`service.yaml`：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: model-api-service
spec:
  selector:
    app: model-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

`hpa.yaml`：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: model-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: model-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

部署：

```bash
kubectl apply -f k8s/
kubectl get all
```

</details>

---

## 下一章预告

下一章我们会学习 **CI/CD 自动化部署**——也就是如何搭建自动化部署流水线。你会学到：

- CI/CD 基本概念
- GitHub Actions 配置
- 自动化测试和部署
- 蓝绿部署和金丝雀发布

掌握这些知识后，你就能实现自动化的模型部署了。
