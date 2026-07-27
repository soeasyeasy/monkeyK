---
title: "第13章：RBAC 权限控制"
description: "基于角色的访问控制、ServiceAccount、权限管理"
---

# 第13章：RBAC 权限控制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何控制不同用户对 Kubernetes 集群的访问权限？
- 什么是 RBAC？它解决了什么问题？
- 如何给开发人员只读权限，给运维人员完全控制权限？
- ServiceAccount 是什么？和 User 有什么区别？
- 如何限制某个应用只能访问特定的资源？

这一章会教你 RBAC（基于角色的访问控制）的使用方法。学会这些，你就能实现细粒度的权限管理，确保集群安全。

---

## 1 为什么需要 RBAC？

### 痛点分析

想象一下这个场景：你有一个 Kubernetes 集群，多个团队共用：

1. **开发人员**需要查看 Pod 日志、部署应用
2. **运维人员**需要管理所有资源
3. **监控系统**需要读取指标数据
4. **第三方应用**需要访问特定的 ConfigMap

如果没有权限控制：
- 任何人都可以删除所有 Pod
- 开发人员可能误删生产环境的数据库
- 恶意用户可以获取所有 Secret 中的密码
- 无法追踪谁做了什么操作

### 解决方案

RBAC（Role-Based Access Control，基于角色的访问控制）专门解决这个问题：**通过角色定义权限，然后将角色绑定到用户或组**。

打个比方：

> 传统权限管理像给每个人配钥匙，每把钥匙开特定的门。
>
> RBAC 像公司的门禁系统：先定义角色（员工、经理、管理员），然后给角色分配权限（进入办公区、进入机房、进入服务器房间），最后把人分配到角色。

### RBAC 的核心组件

| 组件 | 说明 | 作用范围 |
|------|------|----------|
| Role | 定义命名空间级别的权限 | 单个命名空间 |
| ClusterRole | 定义集群级别的权限 | 整个集群 |
| RoleBinding | 将 Role 绑定到用户/组/ServiceAccount | 单个命名空间 |
| ClusterRoleBinding | 将 ClusterRole 绑定到用户/组/ServiceAccount | 整个集群 |
| ServiceAccount | Pod 的身份标识 | 单个命名空间 |

---

## 2 ServiceAccount 基础

### 什么是 ServiceAccount？

ServiceAccount 是 Pod 的身份标识，就像员工的工牌。

打个比方：

> User 像真人员工，有用户名和密码。
>
> ServiceAccount 像应用程序的"虚拟员工"，Pod 通过它来证明"我是谁"。

### 创建 ServiceAccount

```yaml
# serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount              # 资源类型
metadata:
  name: my-app-sa                 # ServiceAccount 名称
  namespace: default              # 命名空间
```

```bash
# ❶ 创建 ServiceAccount
kubectl apply -f serviceaccount.yaml

# ❷ 查看 ServiceAccount
kubectl get serviceaccount
# 输出：
# NAME        SECRETS   AGE
# default     1         10d
# my-app-sa   1         5s

# ❸ 查看详细信息
kubectl describe serviceaccount my-app-sa
# 输出：
# Name:                my-app-sa
# Namespace:           default
# Labels:              <none>
# Annotations:         <none>
# Image pull secrets:  <none>
# Mountable secrets:   <none>
# Tokens:              <none>
# Events:              <none>
```

### 在 Pod 中使用 ServiceAccount

```yaml
# pod-with-sa.yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app                        # Pod 名称
spec:
  serviceAccountName: my-app-sa       # 指定 ServiceAccount
  containers:
  - name: app                         # 容器名称
    image: nginx:1.21                 # 镜像
```

```bash
# ❶ 创建 Pod
kubectl apply -f pod-with-sa.yaml

# ❷ 查看 Pod
kubectl get pod my-app
# 输出：
# NAME     READY   STATUS    RESTARTS   AGE
# my-app   1/1     Running   0          5s

# ❸ 进入 Pod 查看 Token
kubectl exec -it my-app -- /bin/bash
# 在 Pod 内执行：
cat /var/run/secrets/kubernetes.io/serviceaccount/token
# 输出：eyJhbGciOiJSUzI1NiIsImtpZCI6Ii...（JWT Token）
```

---

## 3 Role 和 ClusterRole

### Role（命名空间级别）

Role 定义在单个命名空间内的权限。

```yaml
# role-pod-reader.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role                        # 资源类型
metadata:
  namespace: default              # 命名空间
  name: pod-reader                # Role 名称
rules:                            # 权限规则
- apiGroups: [""]                 # API 组（空字符串表示核心 API）
  resources: ["pods"]             # 资源类型
  verbs: ["get", "watch", "list"] # 允许的操作
```

```bash
# ❶ 创建 Role
kubectl apply -f role-pod-reader.yaml

# ❷ 查看 Role
kubectl get role
# 输出：
# NAME          CREATED AT
# pod-reader    2026-07-26T10:00:00Z

# ❸ 查看详细信息
kubectl describe role pod-reader
# 输出：
# Name:         pod-reader
# Labels:       <none>
# Annotations:  <none>
# PolicyRule:
#   Resources  Non-Resource URLs  Resource Names  Verbs
#   ---------  -----------------  --------------  -----
#   pods       []                 []              [get watch list]
```

### ClusterRole（集群级别）

ClusterRole 定义在整个集群内的权限。

```yaml
# clusterrole-node-reader.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole                 # 资源类型
metadata:
  name: node-reader               # ClusterRole 名称
rules:
- apiGroups: [""]
  resources: ["nodes"]            # 节点资源
  verbs: ["get", "watch", "list"]
```

```bash
# ❶ 创建 ClusterRole
kubectl apply -f clusterrole-node-reader.yaml

# ❷ 查看 ClusterRole
kubectl get clusterrole
# 输出：
# NAME                           CREATED AT
# node-reader                    2026-07-26T10:00:00Z
# cluster-admin                  2026-07-16T10:00:00Z
# admin                          2026-07-16T10:00:00Z
# edit                           2026-07-16T10:00:00Z
# view                           2026-07-16T10:00:00Z
```

### 常用 verbs（操作）

| Verb | 说明 | 示例 |
|------|------|------|
| get | 获取单个资源 | `kubectl get pod my-pod` |
| list | 列出多个资源 | `kubectl get pods` |
| watch | 监听资源变化 | `kubectl get pods -w` |
| create | 创建资源 | `kubectl create pod` |
| update | 更新资源 | `kubectl apply -f pod.yaml` |
| patch | 部分更新资源 | `kubectl patch pod` |
| delete | 删除资源 | `kubectl delete pod` |
| deletecollection | 批量删除资源 | `kubectl delete pods --all` |

### 常用 resources（资源）

| Resource | 说明 | API 组 |
|----------|------|--------|
| pods | Pod | "" (核心) |
| services | Service | "" (核心) |
| configmaps | ConfigMap | "" (核心) |
| secrets | Secret | "" (核心) |
| namespaces | Namespace | "" (核心) |
| nodes | Node | "" (核心) |
| deployments | Deployment | "apps" |
| statefulsets | StatefulSet | "apps" |
| daemonsets | DaemonSet | "apps" |
| jobs | Job | "batch" |
| cronjobs | CronJob | "batch" |

---

## 4 RoleBinding 和 ClusterRoleBinding

### RoleBinding（命名空间级别绑定）

RoleBinding 将 Role 绑定到用户、组或 ServiceAccount。

```yaml
# rolebinding-read-pods.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding                   # 资源类型
metadata:
  name: read-pods                   # RoleBinding 名称
  namespace: default                # 命名空间
subjects:                           # 绑定对象
- kind: User                        # 用户类型
  name: dev-user                    # 用户名
  apiGroup: rbac.authorization.k8s.io
roleRef:                            # 引用的 Role
  kind: Role
  name: pod-reader                  # Role 名称
  apiGroup: rbac.authorization.k8s.io
```

```bash
# ❶ 创建 RoleBinding
kubectl apply -f rolebinding-read-pods.yaml

# ❷ 查看 RoleBinding
kubectl get rolebinding
# 输出：
# NAME          ROLE              AGE
# read-pods     Role/pod-reader   5s

# ❸ 查看详细信息
kubectl describe rolebinding read-pods
# 输出：
# Name:         read-pods
# Labels:       <none>
# Annotations:  <none>
# Role:         pod-reader
# Kind:         RoleBinding
# Subjects:
#   Kind  Name      API Group
#   ----  ----      ---------
#   User  dev-user  rbac.authorization.k8s.io
```

### ClusterRoleBinding（集群级别绑定）

ClusterRoleBinding 将 ClusterRole 绑定到用户、组或 ServiceAccount。

```yaml
# clusterrolebinding-node-reader.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding              # 资源类型
metadata:
  name: read-nodes                    # ClusterRoleBinding 名称
subjects:
- kind: Group                         # 组类型
  name: developers                    # 组名
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: node-reader                   # ClusterRole 名称
  apiGroup: rbac.authorization.k8s.io
```

```bash
# ❶ 创建 ClusterRoleBinding
kubectl apply -f clusterrolebinding-node-reader.yaml

# ❷ 查看 ClusterRoleBinding
kubectl get clusterrolebinding
# 输出：
# NAME          ROLE                           AGE
# read-nodes    ClusterRole/node-reader        5s
```

### 绑定到 ServiceAccount

```yaml
# rolebinding-sa.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-sa                  # RoleBinding 名称
  namespace: default
subjects:
- kind: ServiceAccount                # ServiceAccount 类型
  name: my-app-sa                     # ServiceAccount 名称
  namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## 5 默认 ClusterRole

Kubernetes 提供了四个默认的 ClusterRole：

| ClusterRole | 说明 | 权限范围 |
|-------------|------|----------|
| cluster-admin | 超级管理员权限 | 集群内所有资源的所有操作 |
| admin | 命名空间管理员权限 | 单个命名空间内的所有资源（除了 RBAC） |
| edit | 命名空间编辑权限 | 单个命名空间内的读写权限（除了 RBAC 和配额） |
| view | 命名空间只读权限 | 单个命名空间内的只读权限 |

### 使用默认 ClusterRole

```yaml
# clusterrolebinding-admin.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-binding                   # ClusterRoleBinding 名称
subjects:
- kind: User
  name: ops-user                        # 运维人员
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin                   # 使用默认的 cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

```bash
# ❶ 创建绑定
kubectl apply -f clusterrolebinding-admin.yaml

# ❷ 验证权限
kubectl auth can-i --list --as=ops-user
# 输出：
# Resources                                       Non-Resource URLs
# ---------                                       -----------------
# *                                               []
#                                                 [*]
```

---

## 6 自定义 Role 示例

### 示例 1：开发人员权限

```yaml
# role-developer.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: dev                      # 开发环境命名空间
  name: developer-role                # Role 名称
rules:
- apiGroups: [""]                     # 核心 API
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]                 # apps API 组
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["pods/log"]             # Pod 日志
  verbs: ["get", "list"]
```

```bash
# ❶ 创建 Role
kubectl apply -f role-developer.yaml

# ❷ 绑定到开发组
kubectl create rolebinding dev-binding \
  --role=developer-role \
  --group=developers \
  --namespace=dev

# ❸ 验证权限
kubectl auth can-i create pods --as=dev-user --namespace=dev
# 输出：yes

kubectl auth can-i delete secrets --as=dev-user --namespace=dev
# 输出：no
```

### 示例 2：监控权限

```yaml
# role-monitoring.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-role               # ClusterRole 名称
rules:
- apiGroups: [""]
  resources: ["nodes", "pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]     # 只读权限
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["get", "list", "watch"]
- nonResourceURLs: ["/metrics"]       # 非资源 URL
  verbs: ["get"]
```

---

## 7 权限验证

### 检查权限

```bash
# ❶ 检查当前用户权限
kubectl auth can-i create pods
# 输出：yes

# ❷ 检查其他用户权限
kubectl auth can-i delete pods --as=dev-user
# 输出：no

# ❸ 列出所有权限
kubectl auth can-i --list --as=dev-user
# 输出：
# Resources                  Non-Resource URLs
# ---------                  -----------------
# pods                       []
# services                   []
# configmaps                 []
# deployments.apps           []
#                            [/api/*]
#                            [/apis/*]

# ❹ 检查特定命名空间的权限
kubectl auth can-i create deployments --as=dev-user --namespace=dev
# 输出：yes
```

---

## 8 对比表格

| 特性 | Role | ClusterRole | RoleBinding | ClusterRoleBinding |
|------|------|-------------|-------------|-------------------|
| 作用范围 | 单个命名空间 | 整个集群 | 单个命名空间 | 整个集群 |
| 定义权限 | 是 | 是 | 否 | 否 |
| 绑定用户 | 否 | 否 | 是 | 是 |
| 可引用对象 | RoleBinding | ClusterRoleBinding | Role/ClusterRole | ClusterRole |
| 典型用途 | 命名空间内权限 | 集群级权限 | 命名空间内授权 | 集群级授权 |

| 对象类型 | 说明 | 示例 |
|----------|------|------|
| User | 真实用户 | alice, bob, dev-user |
| Group | 用户组 | developers, ops-team |
| ServiceAccount | Pod 身份 | my-app-sa, prometheus-sa |

---

## 9 新手常见误区

### 误区 1："Role 和 ClusterRole 可以混用"

**错！** Role 只能被 RoleBinding 引用，ClusterRole 可以被 RoleBinding 或 ClusterRoleBinding 引用。不能反过来。

✅ 正确：
```yaml
# RoleBinding 引用 Role
kind: RoleBinding
roleRef:
  kind: Role
  name: pod-reader
```

❌ 错误：
```yaml
# RoleBinding 不能引用 ClusterRole（除非是聚合权限）
kind: RoleBinding
roleRef:
  kind: ClusterRole
  name: node-reader
```

### 误区 2："删除 RoleBinding 后用户立即失去权限"

**对！** RoleBinding 删除后，绑定的用户立即失去对应权限。但是，如果用户还有其他 RoleBinding 授予相同权限，权限仍然有效。

### 误区 3："ServiceAccount 和 User 是一回事"

**错！** ServiceAccount 是 Pod 的身份标识，用于 Pod 访问 Kubernetes API。User 是真实用户的身份标识，用于 kubectl 或外部系统访问。

### 误区 4："给了 create 权限就自动有 update 权限"

**错！** 每个 verb 都是独立的。给了 create 权限不代表有 update、delete 等权限。必须明确列出所有需要的 verb。

```yaml
rules:
- resources: ["pods"]
  verbs: ["create"]           # 只能创建，不能更新或删除
```

### 误区 5："ClusterRole 只能用于集群级资源"

**错！** ClusterRole 可以用于任何资源，包括命名空间级资源。当 ClusterRole 被 RoleBinding 引用时，权限限制在该命名空间内。

```yaml
# ClusterRole 定义 Pod 权限
kind: ClusterRole
rules:
- resources: ["pods"]
  verbs: ["get", "list"]

# RoleBinding 引用 ClusterRole（权限限制在命名空间）
kind: RoleBinding
roleRef:
  kind: ClusterRole
  name: pod-reader
```

---

## 10 动手练习

### 练习 1：创建只读 Role

创建一个 Role，允许在 default 命名空间中查看 Pods、Services 和 Deployments，但不允许修改。

<details>
<summary>点击查看答案</summary>

```yaml
# role-readonly.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default              # 命名空间
  name: readonly-role             # Role 名称
rules:
- apiGroups: [""]                 # 核心 API
  resources: ["pods", "services"] # Pod 和 Service
  verbs: ["get", "list", "watch"] # 只读操作
- apiGroups: ["apps"]             # apps API 组
  resources: ["deployments"]      # Deployment
  verbs: ["get", "list", "watch"] # 只读操作
```

```bash
# ❶ 创建 Role
kubectl apply -f role-readonly.yaml

# ❷ 创建 RoleBinding
kubectl create rolebinding readonly-binding \
  --role=readonly-role \
  --user=test-user \
  --namespace=default

# ❸ 验证权限
kubectl auth can-i get pods --as=test-user --namespace=default
# 输出：yes

kubectl auth can-i create pods --as=test-user --namespace=default
# 输出：no

kubectl auth can-i delete deployments --as=test-user --namespace=default
# 输出：no
```

</details>

### 练习 2：创建 ServiceAccount 并授权

创建一个 ServiceAccount，授予它在 default 命名空间中创建和删除 Pods 的权限。

<details>
<summary>点击查看答案</summary>

```yaml
# serviceaccount-app.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa                      # ServiceAccount 名称
  namespace: default
---
# role-pod-manager.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-manager                 # Role 名称
rules:
- apiGroups: [""]
  resources: ["pods"]               # Pod 资源
  verbs: ["get", "list", "watch", "create", "delete"] # 读写操作
---
# rolebinding-app-sa.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-sa-binding              # RoleBinding 名称
  namespace: default
subjects:
- kind: ServiceAccount
  name: app-sa                      # ServiceAccount 名称
  namespace: default
roleRef:
  kind: Role
  name: pod-manager
  apiGroup: rbac.authorization.k8s.io
```

```bash
# ❶ 创建所有资源
kubectl apply -f serviceaccount-app.yaml
kubectl apply -f role-pod-manager.yaml
kubectl apply -f rolebinding-app-sa.yaml

# ❷ 查看 ServiceAccount
kubectl get serviceaccount app-sa
# 输出：
# NAME     SECRETS   AGE
# app-sa   1         5s

# ❸ 创建使用该 ServiceAccount 的 Pod
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  serviceAccountName: app-sa
  containers:
  - name: test
    image: nginx:1.21
EOF

# ❹ 验证权限
kubectl auth can-i create pods --as=system:serviceaccount:default:app-sa
# 输出：yes
```

</details>

### 练习 3（挑战）：创建多环境权限控制

为 dev、staging、prod 三个命名空间创建不同的权限：
- dev 命名空间：开发人员可以完全控制
- staging 命名空间：开发人员只能查看和更新 Deployments
- prod 命名空间：开发人员只能查看，不能修改

<details>
<summary>点击查看答案</summary>

```yaml
# namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dev
---
apiVersion: v1
kind: Namespace
metadata:
  name: staging
---
apiVersion: v1
kind: Namespace
metadata:
  name: prod
---
# role-dev-full.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: dev
  name: dev-full-access               # 完全控制权限
rules:
- apiGroups: ["", "apps", "batch"]
  resources: ["*"]
  verbs: ["*"]
---
# role-staging-limited.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: staging
  name: staging-limited               # 有限权限
rules:
- apiGroups: ["", "apps"]
  resources: ["pods", "services", "deployments", "configmaps"]
  verbs: ["get", "list", "watch", "update", "patch"]
---
# role-prod-readonly.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: prod
  name: prod-readonly                 # 只读权限
rules:
- apiGroups: ["", "apps"]
  resources: ["pods", "services", "deployments", "configmaps"]
  verbs: ["get", "list", "watch"]
---
# rolebindings.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-binding
  namespace: dev
subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: dev-full-access
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: staging-binding
  namespace: staging
subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: staging-limited
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: prod-binding
  namespace: prod
subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: prod-readonly
  apiGroup: rbac.authorization.k8s.io
```

```bash
# ❶ 创建所有资源
kubectl apply -f namespaces.yaml
kubectl apply -f rolebindings.yaml

# ❷ 验证 dev 命名空间权限
kubectl auth can-i create pods --as=dev-user --namespace=dev
# 输出：yes
kubectl auth can-i delete deployments --as=dev-user --namespace=dev
# 输出：yes

# ❸ 验证 staging 命名空间权限
kubectl auth can-i update deployments --as=dev-user --namespace=staging
# 输出：yes
kubectl auth can-i delete pods --as=dev-user --namespace=staging
# 输出：no

# ❹ 验证 prod 命名空间权限
kubectl auth can-i get pods --as=dev-user --namespace=prod
# 输出：yes
kubectl auth can-i create pods --as=dev-user --namespace=prod
# 输出：no
kubectl auth can-i delete deployments --as=dev-user --namespace=prod
# 输出：no
```

</details>

---

## 下一章预告

下一章我们会学习 **Helm 包管理**——Kubernetes 的包管理器，就像 apt 或 yum 一样。你会学到 Chart 的结构、如何创建和发布 Chart、Release 管理、模板语法等。学会 Helm，你就能快速部署复杂的应用，而不需要手写大量的 YAML 文件。
