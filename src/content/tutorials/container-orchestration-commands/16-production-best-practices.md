---
title: '第16章：生产环境命令最佳实践'
description: '掌握安全操作规范、权限控制、审计日志、自动化脚本编写等生产环境最佳实践'
---

# 第16章：生产环境命令最佳实践

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 生产环境有哪些安全规范？
- 如何控制命令权限？
- 如何记录审计日志？
- 如何编写自动化脚本？

这一章会系统讲解生产环境中的命令最佳实践，让你能够安全、高效地管理 Kubernetes 集群。

---

## 1 安全操作规范

### 1.1 最小权限原则

**使用 RBAC 限制权限**：

```yaml
# 只读角色
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: readonly
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "watch"]
```

```bash
# 绑定到用户
kubectl create rolebinding dev-readonly --role=readonly --user=developer
```

**避免使用 cluster-admin**：

```bash
# 不推荐
kubectl create rolebinding admin --clusterrole=cluster-admin --user=developer

# 推荐：使用细粒度权限
kubectl create rolebinding dev --role=developer --user=developer
```

### 1.2 命名空间隔离

```bash
# 为不同团队创建命名空间
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace prod

# 设置资源配额
kubectl apply -f resourcequota.yaml
```

**resourcequota.yaml**：

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: dev
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
```

### 1.3 避免危险操作

**生产环境禁止的操作**：

```bash
# 禁止强制删除
kubectl delete pod my-pod --force --grace-period=0

# 禁止删除命名空间（会删除所有资源）
kubectl delete namespace prod

# 禁止使用 --all 删除所有资源
kubectl delete pods --all -n prod

# 禁止直接修改生产配置
kubectl edit deployment my-deploy -n prod
```

**推荐做法**：

```bash
# 使用正常的删除流程
kubectl delete pod my-pod -n prod

# 使用 GitOps 管理配置
kubectl apply -f deployment.yaml

# 使用审批流程
# 1. 提交变更请求
# 2. 代码审查
# 3. 自动化部署
```

### 1.4 使用 kubectl 安全选项

```bash
# 使用 --dry-run 验证
kubectl apply -f deployment.yaml --dry-run=server

# 使用 --validate 验证
kubectl apply -f deployment.yaml --validate=true

# 使用 --server-dry-run 服务端验证
kubectl apply -f deployment.yaml --server-dry-run
```

---

## 2 权限控制

### 2.1 ServiceAccount 管理

```yaml
# 为应用创建专用 ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-sa
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: my-app-role
  namespace: default
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: my-app-binding
  namespace: default
subjects:
- kind: ServiceAccount
  name: my-app-sa
  namespace: default
roleRef:
  kind: Role
  name: my-app-role
  apiGroup: rbac.authorization.k8s.io
```

**在 Pod 中使用**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  serviceAccountName: my-app-sa
  automountServiceAccountToken: false  # 不自动挂载 token
  containers:
  - name: app
    image: myapp:latest
```

### 2.2 用户认证

**使用 OIDC 认证**：

```bash
# 配置 kubeconfig
kubectl config set-credentials oidc-user \
  --auth-provider=oidc \
  --auth-provider-arg=idp-issuer-url=https://accounts.google.com \
  --auth-provider-arg=client-id=my-client-id \
  --auth-provider-arg=client-secret=my-client-secret
```

**使用证书认证**：

```bash
# 生成证书
openssl genrsa -out user.key 2048
openssl req -new -key user.key -out user.csr -subj "/CN=user/O=dev"

# 签署证书
openssl x509 -req -in user.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out user.crt -days 365

# 配置 kubeconfig
kubectl config set-credentials user --client-certificate=user.crt --client-key=user.key
```

### 2.3 审计日志

**启用审计日志**：

```yaml
# kube-apiserver 配置
apiVersion: v1
kind: Pod
metadata:
  name: kube-apiserver
spec:
  containers:
  - name: kube-apiserver
    command:
    - kube-apiserver
    - --audit-policy-file=/etc/kubernetes/audit-policy.yaml
    - --audit-log-path=/var/log/kubernetes/audit.log
    - --audit-log-maxage=30
    - --audit-log-maxbackup=10
    - --audit-log-maxsize=100
```

**audit-policy.yaml**：

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: Metadata
  resources:
  - group: ""
    resources: ["pods", "services", "configmaps", "secrets"]
- level: Request
  resources:
  - group: ""
    resources: ["pods/exec", "pods/portforward"]
- level: None
  resources:
  - group: ""
    resources: ["events"]
```

---

## 3 自动化脚本

### 3.1 部署脚本

```bash
#!/bin/bash
set -e  # 遇到错误退出

# 配置
NAMESPACE="production"
DEPLOYMENT="my-app"
IMAGE="myregistry.com/my-app:$1"

# 验证参数
if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

# 更新镜像
echo "Updating deployment to version $1..."
kubectl set image deployment/$DEPLOYMENT $DEPLOYMENT=$IMAGE -n $NAMESPACE

# 等待更新完成
echo "Waiting for rollout to complete..."
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=5m

# 验证部署
echo "Verifying deployment..."
kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT

echo "Deployment completed successfully!"
```

### 3.2 回滚脚本

```bash
#!/bin/bash
set -e

NAMESPACE="production"
DEPLOYMENT="my-app"

# 查看历史
echo "Deployment history:"
kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE

# 回滚到上一版本
echo "Rolling back to previous version..."
kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE

# 等待回滚完成
echo "Waiting for rollback to complete..."
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=5m

echo "Rollback completed successfully!"
```

### 3.3 健康检查脚本

```bash
#!/bin/bash

NAMESPACE="production"

# 检查 Pod 状态
echo "=== Pod Status ==="
kubectl get pods -n $NAMESPACE -o wide

# 检查失败 Pod
echo -e "\n=== Failed Pods ==="
FAILED_PODS=$(kubectl get pods -n $NAMESPACE --field-selector=status.phase=Failed -o name)
if [ -n "$FAILED_PODS" ]; then
  echo "Found failed pods:"
  echo "$FAILED_PODS"
  for pod in $FAILED_PODS; do
    echo -e "\nLogs for $pod:"
    kubectl logs $pod -n $NAMESPACE --tail=50
  done
else
  echo "No failed pods found"
fi

# 检查重启次数
echo -e "\n=== Pods with Restarts ==="
kubectl get pods -n $NAMESPACE -o custom-columns=NAME:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount | grep -v "0$"

# 检查节点状态
echo -e "\n=== Node Status ==="
kubectl get nodes -o wide

# 检查事件
echo -e "\n=== Recent Events ==="
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -n 20
```

### 3.4 备份脚本

```bash
#!/bin/bash
set -e

BACKUP_DIR="/backup/$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

echo "Starting backup to $BACKUP_DIR..."

# 备份所有命名空间的资源
for resource in deployments services configmaps secrets ingress; do
  echo "Backing up $resource..."
  kubectl get $resource -A -o yaml > $BACKUP_DIR/$resource.yaml
done

# 备份 PV
echo "Backing up persistent volumes..."
kubectl get pv -o yaml > $BACKUP_DIR/pv.yaml

# 备份 RBAC
echo "Backing up RBAC..."
kubectl get role,rolebinding,clusterrole,clusterrolebinding -A -o yaml > $BACKUP_DIR/rbac.yaml

# 压缩备份
echo "Compressing backup..."
tar -czf $BACKUP_DIR.tar.gz -C /backup $(basename $BACKUP_DIR)
rm -rf $BACKUP_DIR

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

---

## 4 GitOps 实践

### 4.1 使用 Git 管理配置

**目录结构**：

```
k8s-config/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/
│   │   └── kustomization.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── prod/
│       └── kustomization.yaml
└── README.md
```

**base/deployment.yaml**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: myregistry.com/my-app:latest
```

**overlays/prod/kustomization.yaml**：

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
patches:
- path: replica-patch.yaml
- path: image-patch.yaml
```

**overlays/prod/replica-patch.yaml**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
```

### 4.2 使用 Kustomize

```bash
# 应用基础配置
kubectl apply -k base/

# 应用生产环境配置
kubectl apply -k overlays/prod/

# 查看生成的配置
kubectl kustomize overlays/prod/
```

### 4.3 使用 ArgoCD

```yaml
# application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/k8s-config.git
    targetRevision: HEAD
    path: overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```bash
# 应用 ArgoCD Application
kubectl apply -f application.yaml
```

---

## 5 监控与告警

### 5.1 使用 Prometheus 监控

```yaml
# service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: metrics
    interval: 30s
```

### 5.2 配置告警

```yaml
# prometheus-rule.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: my-app-alerts
  namespace: monitoring
spec:
  groups:
  - name: my-app
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{job="my-app",status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is above 10%"
```

---

## 6 常用命令组合

### 6.1 生产环境部署流程

```bash
# 1. 验证配置
kubectl apply -f deployment.yaml --dry-run=server

# 2. 应用配置
kubectl apply -f deployment.yaml

# 3. 查看状态
kubectl rollout status deployment/my-app

# 4. 验证部署
kubectl get pods -l app=my-app

# 5. 测试服务
kubectl port-forward svc/my-app 8080:80

# 6. 查看日志
kubectl logs -f deployment/my-app
```

### 6.2 生产环境回滚流程

```bash
# 1. 查看历史
kubectl rollout history deployment/my-app

# 2. 回滚
kubectl rollout undo deployment/my-app

# 3. 查看状态
kubectl rollout status deployment/my-app

# 4. 验证
kubectl get pods -l app=my-app
```

### 6.3 生产环境故障排查

```bash
# 1. 查看 Pod 状态
kubectl get pods -A | grep -v Running

# 2. 查看失败 Pod
kubectl get pods --field-selector=status.phase=Failed -A

# 3. 查看日志
kubectl logs deployment/my-app --tail=100

# 4. 查看事件
kubectl get events --sort-by='.lastTimestamp' | tail -n 20

# 5. 进入容器调试
kubectl exec -it deployment/my-app -- /bin/bash
```

---

## 7 本章小结

本章系统讲解了生产环境中的命令最佳实践，包括：

**安全操作规范**：

- 最小权限原则
- 命名空间隔离
- 避免危险操作
- 使用安全选项

**权限控制**：

- ServiceAccount 管理
- 用户认证
- 审计日志

**自动化脚本**：

- 部署脚本
- 回滚脚本
- 健康检查脚本
- 备份脚本

**GitOps 实践**：

- 使用 Git 管理配置
- 使用 Kustomize
- 使用 ArgoCD

**监控与告警**：

- Prometheus 监控
- 配置告警

掌握这些最佳实践，你就能够在生产环境中安全、高效地管理 Kubernetes 集群。

---

## 8 练习题

1. 配置 RBAC 限制用户权限
2. 创建命名空间并设置资源配额
3. 编写自动化部署脚本
4. 编写健康检查脚本
5. 使用 Kustomize 管理多环境配置
6. 配置审计日志
7. 使用 GitOps 工具管理应用
