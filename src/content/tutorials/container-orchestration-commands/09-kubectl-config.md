---
title: '第9章：kubectl 配置管理命令'
description: '掌握 ConfigMap、Secret 的创建与管理，环境变量注入，热更新等命令'
---

# 第9章：kubectl 配置管理命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何管理应用配置？
- 如何安全存储敏感信息？
- 如何注入环境变量？
- 如何实现配置热更新？

这一章会系统讲解 ConfigMap 和 Secret 相关的所有命令，让你能够熟练管理 Kubernetes 中的配置和密钥。

---

## 1 ConfigMap 基础命令

### 1.1 创建 ConfigMap

**从字面值创建**：

```bash
# 创建 ConfigMap
kubectl create configmap my-config --from-literal=key1=value1 --from-literal=key2=value2

# 从文件创建
kubectl create configmap my-config --from-file=config.json

# 从多个文件创建
kubectl create configmap my-config --from-file=config.json --from-file=settings.yaml

# 从目录创建（包含所有文件）
kubectl create configmap my-config --from-file=/path/to/dir/

# 从 env 文件创建
kubectl create configmap my-config --from-env-file=.env
```

**从 YAML 文件创建**：

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  key1: value1
  key2: value2
  config.json: |
    {
      "database": "mysql",
      "port": 3306
    }
```

```bash
kubectl apply -f configmap.yaml
```

### 1.2 查看 ConfigMap

```bash
# 列出所有 ConfigMap
kubectl get configmaps

# 简写
kubectl get cm

# 查看所有命名空间
kubectl get cm -A

# 查看单个 ConfigMap
kubectl get cm my-config

# 输出 YAML
kubectl get cm my-config -o yaml

# 查看详情
kubectl describe configmap my-config
```

### 1.3 更新 ConfigMap

```bash
# 从文件更新
kubectl create configmap my-config --from-file=config.json --dry-run=client -o yaml | kubectl apply -f -

# 编辑 ConfigMap
kubectl edit configmap my-config

# 设置字面值
kubectl set data configmap my-config key1=new-value

# 添加新键
kubectl set data configmap my-config key3=value3

# 删除键
kubectl set data configmap my-config key1-
```

### 1.4 删除 ConfigMap

```bash
# 删除 ConfigMap
kubectl delete configmap my-config

# 从文件删除
kubectl delete -f configmap.yaml
```

---

## 2 Secret 基础命令

### 2.1 创建 Secret

**从字面值创建**：

```bash
# 创建 generic Secret
kubectl create secret generic my-secret --from-literal=password=secret123

# 从文件创建
kubectl create secret generic my-secret --from-file=password.txt

# 多个字面值
kubectl create secret generic my-secret \
  --from-literal=username=admin \
  --from-literal=password=secret123
```

**创建 docker-registry Secret**：

```bash
kubectl create secret docker-registry my-registry \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=pass \
  --docker-email=user@example.com
```

**创建 tls Secret**：

```bash
kubectl create secret tls my-tls \
  --cert=tls.crt \
  --key=tls.key
```

**从 YAML 文件创建**：

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
data:
  # Base64 编码
  password: c2VjcmV0MTIz  # echo -n "secret123" | base64
stringData:
  # 明文（Kubernetes 会自动编码）
  username: admin
```

```bash
kubectl apply -f secret.yaml
```

### 2.2 查看 Secret

```bash
# 列出所有 Secret
kubectl get secrets

# 简写
kubectl get secret

# 查看所有命名空间
kubectl get secret -A

# 查看单个 Secret
kubectl get secret my-secret

# 输出 YAML
kubectl get secret my-secret -o yaml

# 查看详情
kubectl describe secret my-secret
```

**注意**：`kubectl get secret` 不会显示实际数据，需要使用 `-o yaml` 查看。

### 2.3 解码 Secret 数据

```bash
# 获取 Base64 编码的数据
kubectl get secret my-secret -o jsonpath='{.data.password}'

# 解码
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 --decode

# Linux/macOS
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 -d

# Windows PowerShell
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($(kubectl get secret my-secret -o jsonpath='{.data.password}')))
```

### 2.4 更新 Secret

```bash
# 编辑 Secret
kubectl edit secret my-secret

# 从文件更新
kubectl create secret generic my-secret --from-file=password.txt --dry-run=client -o yaml | kubectl apply -f -
```

### 2.5 删除 Secret

```bash
# 删除 Secret
kubectl delete secret my-secret

# 从文件删除
kubectl delete -f secret.yaml
```

---

## 3 在 Pod 中使用 ConfigMap 和 Secret

### 3.1 作为环境变量

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    env:
    # 单个键
    - name: DATABASE_HOST
      valueFrom:
        configMapKeyRef:
          name: my-config
          key: database.host
    
    # 所有键
    envFrom:
    - configMapRef:
        name: my-config
    - secretRef:
        name: my-secret
```

### 3.2 作为文件挂载

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
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: my-config
```

---

## 4 配置热更新

### 4.1 ConfigMap 热更新

**方式 1：环境变量（不支持热更新）**

```yaml
env:
- name: CONFIG_VALUE
  valueFrom:
    configMapKeyRef:
      name: my-config
      key: config-value
```

**说明**：环境变量方式不支持热更新，需要重启 Pod。

**方式 2：文件挂载（支持热更新）**

```yaml
volumeMounts:
- name: config-volume
  mountPath: /etc/config
volumes:
- name: config-volume
  configMap:
    name: my-config
```

**说明**：文件挂载方式支持热更新，但需要应用能够重新加载配置文件。

### 4.2 触发 Pod 重启

```bash
# 更新 ConfigMap
kubectl edit configmap my-config

# 重启 Deployment（触发 Pod 重建）
kubectl rollout restart deployment/my-deployment
```

---

## 5 常用命令组合

### 5.1 完整配置流程

```bash
# 1. 创建 ConfigMap
kubectl create configmap app-config \
  --from-literal=database.host=mysql \
  --from-literal=database.port=3306

# 2. 创建 Secret
kubectl create secret generic app-secret \
  --from-literal=database.password=secret123

# 3. 查看配置
kubectl get cm,secret

# 4. 在 Deployment 中使用
kubectl apply -f deployment.yaml

# 5. 更新配置
kubectl edit configmap app-config

# 6. 重启 Deployment
kubectl rollout restart deployment/my-deployment
```

### 5.2 导出配置

```bash
# 导出 ConfigMap 到文件
kubectl get configmap my-config -o yaml > configmap.yaml

# 导出 Secret 到文件
kubectl get secret my-secret -o yaml > secret.yaml
```

---

## 6 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `kubectl create configmap` | 创建 ConfigMap | `kubectl create cm my-config --from-literal=key=value` |
| `kubectl get configmap` | 列出 ConfigMap | `kubectl get cm` |
| `kubectl describe configmap` | 查看详情 | `kubectl describe cm my-config` |
| `kubectl edit configmap` | 编辑 ConfigMap | `kubectl edit cm my-config` |
| `kubectl delete configmap` | 删除 ConfigMap | `kubectl delete cm my-config` |
| `kubectl create secret generic` | 创建 Secret | `kubectl create secret generic my-secret --from-literal=key=value` |
| `kubectl get secret` | 列出 Secret | `kubectl get secret` |
| `kubectl delete secret` | 删除 Secret | `kubectl delete secret my-secret` |

---

## 7 本章小结

本章系统讲解了 ConfigMap 和 Secret 相关命令，包括：

**ConfigMap 管理**：

- 创建、查看、更新、删除 ConfigMap
- 从字面值、文件、目录创建
- 在 Pod 中使用（环境变量、文件挂载）

**Secret 管理**：

- 创建、查看、更新、删除 Secret
- 不同类型的 Secret（generic、docker-registry、tls）
- 数据编码和解码

**配置热更新**：

- 环境变量 vs 文件挂载
- 触发 Pod 重启

掌握这些命令，你就能够熟练管理 Kubernetes 中的配置和密钥。下一章会讲解存储和网络相关命令。

---

## 8 练习题

1. 创建 ConfigMap 并查看内容
2. 创建 Secret 并解码数据
3. 在 Pod 中使用 ConfigMap 作为环境变量
4. 在 Pod 中挂载 ConfigMap 为文件
5. 更新 ConfigMap 并验证热更新
6. 重启 Deployment 应用新配置
