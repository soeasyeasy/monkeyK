---
title: '第10章：kubectl 存储与网络命令'
description: '掌握 PV/PVC 管理、Ingress 配置、NetworkPolicy、Service 类型切换等命令'
---

# 第10章：kubectl 存储与网络命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何管理持久化存储？
- 如何配置 Ingress 暴露服务？
- 如何配置网络策略？
- 如何切换 Service 类型？

这一章会系统讲解存储和网络相关的所有命令，让你能够熟练管理 Kubernetes 中的存储和网络资源。

---

## 1 存储管理命令

### 1.1 PersistentVolume (PV) 管理

**查看 PV**：

```bash
# 列出所有 PV
kubectl get pv

# 显示更多信息
kubectl get pv -o wide

# 查看 PV 详情
kubectl describe pv my-pv

# 输出 YAML
kubectl get pv my-pv -o yaml
```

**创建 PV**：

```yaml
# pv.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  hostPath:
    path: /data/my-pv
```

```bash
kubectl apply -f pv.yaml
```

**删除 PV**：

```bash
kubectl delete pv my-pv
```

### 1.2 PersistentVolumeClaim (PVC) 管理

**查看 PVC**：

```bash
# 列出所有 PVC
kubectl get pvc

# 显示更多信息
kubectl get pvc -o wide

# 查看所有命名空间
kubectl get pvc -A

# 查看 PVC 详情
kubectl describe pvc my-pvc

# 输出 YAML
kubectl get pvc my-pvc -o yaml
```

**创建 PVC**：

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard
```

```bash
kubectl apply -f pvc.yaml
```

**删除 PVC**：

```bash
kubectl delete pvc my-pvc
```

### 1.3 StorageClass 管理

**查看 StorageClass**：

```bash
# 列出所有 StorageClass
kubectl get storageclass

# 简写
kubectl get sc

# 查看默认 StorageClass
kubectl get sc -o jsonpath='{.items[?(@.metadata.annotations.storageclass\.kubernetes\.io/is-default-class=="true")].metadata.name}'
```

**创建 StorageClass**：

```yaml
# storageclass.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-storage
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
reclaimPolicy: Retain
allowVolumeExpansion: true
mountOptions:
  - debug
```

```bash
kubectl apply -f storageclass.yaml
```

### 1.4 在 Pod 中使用 PVC

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    volumeMounts:
    - name: storage
      mountPath: /data
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: my-pvc
```

---

## 2 Ingress 管理命令

### 2.1 查看 Ingress

```bash
# 列出所有 Ingress
kubectl get ingress

# 简写
kubectl get ing

# 显示更多信息
kubectl get ing -o wide

# 查看所有命名空间
kubectl get ing -A

# 查看 Ingress 详情
kubectl describe ingress my-ingress

# 输出 YAML
kubectl get ingress my-ingress -o yaml
```

### 2.2 创建 Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
```

```bash
kubectl apply -f ingress.yaml
```

### 2.3 更新 Ingress

```bash
# 编辑 Ingress
kubectl edit ingress my-ingress

# 从文件更新
kubectl apply -f ingress.yaml
```

### 2.4 删除 Ingress

```bash
kubectl delete ingress my-ingress
```

### 2.5 Ingress TLS 配置

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  tls:
  - hosts:
    - example.com
    secretName: my-tls-secret
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
```

---

## 3 NetworkPolicy 管理命令

### 3.1 查看 NetworkPolicy

```bash
# 列出所有 NetworkPolicy
kubectl get networkpolicy

# 简写
kubectl get netpol

# 查看所有命名空间
kubectl get netpol -A

# 查看详情
kubectl describe networkpolicy my-netpol
```

### 3.2 创建 NetworkPolicy

```yaml
# networkpolicy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: my-netpol
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 80
  egress:
  - to:
    - podSelector:
        matchLabels:
          role: database
    ports:
    - protocol: TCP
      port: 3306
```

```bash
kubectl apply -f networkpolicy.yaml
```

### 3.3 删除 NetworkPolicy

```bash
kubectl delete networkpolicy my-netpol
```

---

## 4 Service 类型切换

### 4.1 修改 Service 类型

```bash
# 编辑 Service
kubectl edit service my-service

# 修改 type 字段
# type: ClusterIP -> type: NodePort
```

**从 YAML 修改**：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: NodePort  # 修改这里
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 8080
```

```bash
kubectl apply -f service.yaml
```

### 4.2 使用 patch 命令修改

```bash
# 修改 Service 类型为 NodePort
kubectl patch service my-service -p '{"spec":{"type":"NodePort"}}'

# 修改 Service 端口
kubectl patch service my-service -p '{"spec":{"ports":[{"port":8080,"targetPort":80}]}}'
```

---

## 5 Endpoint 管理命令

### 5.1 查看 Endpoint

```bash
# 列出所有 Endpoint
kubectl get endpoints

# 简写
kubectl get ep

# 查看所有命名空间
kubectl get ep -A

# 查看详情
kubectl describe endpoints my-service
```

### 5.2 手动创建 Endpoint

```yaml
# endpoints.yaml
apiVersion: v1
kind: Endpoints
metadata:
  name: my-service
subsets:
- addresses:
  - ip: 10.244.0.5
  - ip: 10.244.0.6
  ports:
  - port: 8080
```

```bash
kubectl apply -f endpoints.yaml
```

---

## 6 常用命令组合

### 6.1 完整存储配置流程

```bash
# 1. 查看 StorageClass
kubectl get sc

# 2. 创建 PVC
kubectl apply -f pvc.yaml

# 3. 查看 PVC 状态
kubectl get pvc

# 4. 在 Pod 中使用 PVC
kubectl apply -f pod.yaml

# 5. 验证挂载
kubectl exec my-pod -- df -h
```

### 6.2 完整 Ingress 配置流程

```bash
# 1. 创建 Service
kubectl expose deployment my-deployment --port=80

# 2. 创建 TLS Secret
kubectl create secret tls my-tls --cert=tls.crt --key=tls.key

# 3. 创建 Ingress
kubectl apply -f ingress.yaml

# 4. 查看 Ingress
kubectl get ingress

# 5. 测试访问
curl -k https://example.com
```

---

## 7 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `kubectl get pv` | 列出 PV | `kubectl get pv` |
| `kubectl get pvc` | 列出 PVC | `kubectl get pvc` |
| `kubectl get sc` | 列出 StorageClass | `kubectl get sc` |
| `kubectl get ingress` | 列出 Ingress | `kubectl get ing` |
| `kubectl get networkpolicy` | 列出 NetworkPolicy | `kubectl get netpol` |
| `kubectl get endpoints` | 列出 Endpoint | `kubectl get ep` |
| `kubectl patch` | 修改资源 | `kubectl patch svc my-svc -p '{"spec":{"type":"NodePort"}}'` |

---

## 8 本章小结

本章系统讲解了存储和网络相关命令，包括：

**存储管理**：

- PV、PVC、StorageClass 管理
- 在 Pod 中使用 PVC

**网络管理**：

- Ingress 配置和 TLS
- NetworkPolicy 网络策略
- Service 类型切换
- Endpoint 管理

掌握这些命令，你就能够熟练管理 Kubernetes 中的存储和网络资源。下一章会讲解高级控制器命令。

---

## 9 练习题

1. 创建 PVC 并在 Pod 中挂载
2. 创建 Ingress 暴露 Service
3. 配置 Ingress TLS
4. 创建 NetworkPolicy 限制网络访问
5. 修改 Service 类型
6. 查看 Endpoint 信息
