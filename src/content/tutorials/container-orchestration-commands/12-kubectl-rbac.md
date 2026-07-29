---
title: '第12章：kubectl RBAC 与权限命令'
description: '掌握 Role、ClusterRole、RoleBinding、ServiceAccount 等 RBAC 权限管理命令'
---

# 第12章：kubectl RBAC 与权限命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何管理 Kubernetes 权限？
- 如何创建角色和绑定角色？
- 如何管理 ServiceAccount？
- 如何验证权限？

这一章会系统讲解 RBAC 权限控制相关的所有命令，让你能够熟练管理 Kubernetes 中的权限和访问控制。

---

## 1 RBAC 基础概念

### 1.1 RBAC 核心资源

| 资源 | 说明 | 作用域 |
| --- | --- | --- |
| `Role` | 定义命名空间内权限 | 命名空间 |
| `ClusterRole` | 定义集群级别权限 | 集群 |
| `RoleBinding` | 绑定 Role 到用户/组/ServiceAccount | 命名空间 |
| `ClusterRoleBinding` | 绑定 ClusterRole 到用户/组/ServiceAccount | 集群 |
| `ServiceAccount` | 服务账户，用于 Pod 身份 | 命名空间 |

### 1.2 权限要素

- ** verbs**：操作（get、list、create、update、delete 等）
- **resources**：资源类型（pods、services、deployments 等）
- **apiGroups**：API 组（""、"apps"、"batch" 等）

---

## 2 Role 管理命令

### 2.1 创建 Role

```yaml
# role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
```

```bash
kubectl apply -f role.yaml
```

### 2.2 查看 Role

```bash
# 列出所有 Role
kubectl get role

# 查看所有命名空间
kubectl get role -A

# 查看详情
kubectl describe role pod-reader

# 输出 YAML
kubectl get role pod-reader -o yaml
```

### 2.3 删除 Role

```bash
kubectl delete role pod-reader
```

---

## 3 ClusterRole 管理命令

### 3.1 创建 ClusterRole

```yaml
# clusterrole.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-reader-cluster
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

```bash
kubectl apply -f clusterrole.yaml
```

### 3.2 查看 ClusterRole

```bash
# 列出所有 ClusterRole
kubectl get clusterrole

# 查看详情
kubectl describe clusterrole pod-reader-cluster

# 输出 YAML
kubectl get clusterrole pod-reader-cluster -o yaml
```

### 3.3 删除 ClusterRole

```bash
kubectl delete clusterrole pod-reader-cluster
```

---

## 4 RoleBinding 管理命令

### 4.1 创建 RoleBinding

**绑定到用户**：

```yaml
# rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

```bash
kubectl apply -f rolebinding.yaml
```

**绑定到 ServiceAccount**：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-sa
  namespace: default
subjects:
- kind: ServiceAccount
  name: my-sa
  namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

**绑定到组**：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-group
  namespace: default
subjects:
- kind: Group
  name: dev-team
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### 4.2 查看 RoleBinding

```bash
# 列出所有 RoleBinding
kubectl get rolebinding

# 查看所有命名空间
kubectl get rolebinding -A

# 查看详情
kubectl describe rolebinding read-pods

# 输出 YAML
kubectl get rolebinding read-pods -o yaml
```

### 4.3 删除 RoleBinding

```bash
kubectl delete rolebinding read-pods
```

---

## 5 ClusterRoleBinding 管理命令

### 5.1 创建 ClusterRoleBinding

```yaml
# clusterrolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-pods-cluster
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: pod-reader-cluster
  apiGroup: rbac.authorization.k8s.io
```

```bash
kubectl apply -f clusterrolebinding.yaml
```

### 5.2 查看 ClusterRoleBinding

```bash
# 列出所有 ClusterRoleBinding
kubectl get clusterrolebinding

# 查看详情
kubectl describe clusterrolebinding read-pods-cluster
```

### 5.3 删除 ClusterRoleBinding

```bash
kubectl delete clusterrolebinding read-pods-cluster
```

---

## 6 ServiceAccount 管理命令

### 6.1 创建 ServiceAccount

```bash
# 从命令行创建
kubectl create serviceaccount my-sa

# 指定命名空间
kubectl create serviceaccount my-sa -n my-namespace
```

**从 YAML 文件创建**：

```yaml
# serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-sa
  namespace: default
```

```bash
kubectl apply -f serviceaccount.yaml
```

### 6.2 查看 ServiceAccount

```bash
# 列出所有 ServiceAccount
kubectl get serviceaccount

# 简写
kubectl get sa

# 查看所有命名空间
kubectl get sa -A

# 查看详情
kubectl describe serviceaccount my-sa

# 输出 YAML
kubectl get serviceaccount my-sa -o yaml
```

### 6.3 删除 ServiceAccount

```bash
kubectl delete serviceaccount my-sa
```

### 6.4 在 Pod 中使用 ServiceAccount

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  serviceAccountName: my-sa
  containers:
  - name: app
    image: myapp:latest
```

---

## 7 权限验证命令

### 7.1 kubectl auth can-i - 检查权限

```bash
# 检查当前用户是否可以列出 Pod
kubectl auth can-i list pods

# 检查指定用户
kubectl auth can-i list pods --as=jane

# 检查指定 ServiceAccount
kubectl auth can-i list pods --as=system:serviceaccount:default:my-sa

# 检查多个操作
kubectl auth can-i list pods --as=jane
kubectl auth can-i create pods --as=jane
kubectl auth can-i delete pods --as=jane

# 检查所有操作
kubectl auth can-i '*' '*' --as=jane

# 检查特定资源
kubectl auth can-i get pods/my-pod --as=jane
```

### 7.2 查看用户权限

```bash
# 查看当前用户权限
kubectl auth can-i --list

# 查看指定用户权限
kubectl auth can-i --list --as=jane
```

---

## 8 常用命令组合

### 8.1 完整 RBAC 配置流程

```bash
# 1. 创建 ServiceAccount
kubectl create serviceaccount my-sa

# 2. 创建 Role
kubectl apply -f role.yaml

# 3. 创建 RoleBinding
kubectl apply -f rolebinding.yaml

# 4. 验证权限
kubectl auth can-i list pods --as=system:serviceaccount:default:my-sa

# 5. 在 Pod 中使用
kubectl apply -f pod.yaml

# 6. 查看 Pod 使用的 ServiceAccount
kubectl get pod my-pod -o jsonpath='{.spec.serviceAccountName}'
```

### 8.2 查看权限详情

```bash
# 1. 查看 Role
kubectl get role pod-reader -o yaml

# 2. 查看 RoleBinding
kubectl get rolebinding read-pods -o yaml

# 3. 检查权限
kubectl auth can-i list pods --as=system:serviceaccount:default:my-sa
```

---

## 9 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `kubectl get role` | 列出 Role | `kubectl get role` |
| `kubectl get clusterrole` | 列出 ClusterRole | `kubectl get clusterrole` |
| `kubectl get rolebinding` | 列出 RoleBinding | `kubectl get rolebinding` |
| `kubectl get clusterrolebinding` | 列出 ClusterRoleBinding | `kubectl get clusterrolebinding` |
| `kubectl get serviceaccount` | 列出 ServiceAccount | `kubectl get sa` |
| `kubectl create serviceaccount` | 创建 ServiceAccount | `kubectl create sa my-sa` |
| `kubectl auth can-i` | 检查权限 | `kubectl auth can-i list pods` |

---

## 10 本章小结

本章系统讲解了 RBAC 权限控制相关命令，包括：

**Role 和 ClusterRole**：

- 创建、查看、删除角色
- 定义权限规则

**RoleBinding 和 ClusterRoleBinding**：

- 绑定角色到用户/组/ServiceAccount
- 管理权限分配

**ServiceAccount**：

- 创建和管理服务账户
- 在 Pod 中使用

**权限验证**：

- `auth can-i` 检查权限
- 查看用户权限列表

掌握这些命令，你就能够熟练管理 Kubernetes 中的权限和访问控制。下一章会讲解 Helm 命令。

---

## 11 练习题

1. 创建 Role 允许读取 Pod
2. 创建 ServiceAccount
3. 创建 RoleBinding 绑定 Role 到 ServiceAccount
4. 验证 ServiceAccount 权限
5. 在 Pod 中使用 ServiceAccount
6. 创建 ClusterRole 允许读取所有命名空间的 Pod
