---
title: "第16章：生产环境实战"
description: "高可用集群、CI/CD 集成、安全加固、性能优化"
---

# 第16章：生产环境实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何搭建高可用的 Kubernetes 集群？
- 如何将 Kubernetes 集成到 CI/CD 流程？
- 如何加固集群安全？
- 如何优化集群性能？
- 如何备份和恢复集群？
- 如何排查常见问题？

这一章会教你生产环境的实战经验。学会这些，你就能将 Kubernetes 应用到实际生产环境中，确保集群稳定、安全、高效运行。

---

## 1 为什么需要生产环境实战？

### 痛点分析

想象一下这个场景：你的团队决定将 Kubernetes 应用到生产环境。

如果没有生产经验：
- 单点故障导致整个集群不可用
- 部署流程手动操作，容易出错
- 安全漏洞被攻击者利用
- 性能问题导致服务响应慢
- 数据丢失无法恢复

### 解决方案

生产环境实战专门解决这个问题：**提供完整的最佳实践，确保集群稳定运行**。

打个比方：

> 开发环境像练习场，可以随意尝试。
>
> 生产环境像战场，需要严谨的规划和执行。
>
> 生产实战经验像作战手册，告诉你如何打赢这场仗。

### 生产环境的关键要素

| 要素 | 说明 | 最佳实践 |
|------|------|----------|
| 高可用 | 避免单点故障 | 多 master、多 etcd、多 worker |
| CI/CD | 自动化部署 | Jenkins、GitLab CI、ArgoCD |
| 安全 | 保护集群安全 | RBAC、NetworkPolicy、镜像扫描 |
| 性能 | 优化资源使用 | 资源限制、自动扩缩容、亲和性 |
| 备份 | 防止数据丢失 | etcd 快照、Velero |
| 监控 | 及时发现问题 | Prometheus、Grafana、告警 |

---

## 2 高可用集群搭建

### 架构设计

```
                    ┌─────────────┐
                    │  Load       │
                    │  Balancer   │
                    │  (HAProxy)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Master 1   │ │  Master 2   │ │  Master 3   │
    │  (API Server│ │  (API Server│ │  (API Server│
    │   etcd)     │ │   etcd)     │ │   etcd)     │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Worker 1   │ │  Worker 2   │ │  Worker 3   │
    │  (kubelet)  │ │  (kubelet)  │ │  (kubelet)  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### 高可用要点

| 组件 | 高可用方案 | 说明 |
|------|------------|------|
| API Server | 多实例 + 负载均衡 | 至少 3 个 master 节点 |
| etcd | 集群模式 | 奇数节点（3、5、7） |
| Controller Manager | 多实例 + Leader 选举 | 自动故障转移 |
| Scheduler | 多实例 + Leader 选举 | 自动故障转移 |
| Worker | 多节点 | 根据负载调整数量 |

### 使用 kubeadm 搭建高可用集群

```bash
# ❶ 准备 3 个 master 节点和多个 worker 节点
# master1: 192.168.1.10
# master2: 192.168.1.11
# master3: 192.168.1.12
# worker1: 192.168.1.20
# worker2: 192.168.1.21
# worker3: 192.168.1.22

# ❷ 在所有节点安装 kubeadm、kubelet、kubectl
apt-get update && apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
cat <<EOF >/etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
apt-get update
apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl

# ❸ 在 master1 初始化第一个 control plane
kubeadm init \
  --control-plane-endpoint "192.168.1.100:6443" \
  --upload-certs \
  --pod-network-cidr=10.244.0.0/16 \
  --service-cidr=10.96.0.0/12
# 输出：
# Your Kubernetes control-plane has initialized successfully!
# ...
# You can now join any number of the control-plane node running the following command on each as root:
#   kubeadm join 192.168.1.100:6443 --token xxx \
#     --discovery-token-ca-cert-hash sha256:xxx \
#     --control-plane --certificate-key xxx

# ❹ 在 master2 和 master3 加入集群
kubeadm join 192.168.1.100:6443 \
  --token xxx \
  --discovery-token-ca-cert-hash sha256:xxx \
  --control-plane \
  --certificate-key xxx

# ❺ 在 worker 节点加入集群
kubeadm join 192.168.1.100:6443 \
  --token xxx \
  --discovery-token-ca-cert-hash sha256:xxx

# ❻ 配置 kubectl
mkdir -p $HOME/.kube
cp /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# ❼ 安装网络插件（Calico）
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# ❽ 查看节点
kubectl get nodes
# 输出：
# NAME      STATUS   ROLES           AGE   VERSION
# master1   Ready    control-plane   10m   v1.26.0
# master2   Ready    control-plane   5m    v1.26.0
# master3   Ready    control-plane   5m    v1.26.0
# worker1   Ready    <none>          3m    v1.26.0
# worker2   Ready    <none>          3m    v1.26.0
# worker3   Ready    <none>          3m    v1.26.0
```

### 配置负载均衡

```yaml
# haproxy.cfg
global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

defaults
    log     global
    mode    tcp
    option  tcplog
    option  dontlognull
    timeout connect 5000
    timeout client  50000
    timeout server  50000

frontend kubernetes-apiserver
    bind *:6443
    mode tcp
    option tcplog
    default_backend kubernetes-apiserver

backend kubernetes-apiserver
    mode tcp
    option tcp-check
    balance roundrobin
    server master1 192.168.1.10:6443 check
    server master2 192.168.1.11:6443 check
    server master3 192.168.1.12:6443 check
```

---

## 3 CI/CD 集成

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "myapp:${BUILD_NUMBER}"
        KUBE_NAMESPACE = "production"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'docker build -t ${DOCKER_IMAGE} .'
            }
        }
        
        stage('Test') {
            steps {
                sh 'docker run ${DOCKER_IMAGE} npm test'
            }
        }
        
        stage('Push') {
            steps {
                sh 'docker push ${DOCKER_IMAGE}'
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                    kubectl set image deployment/myapp myapp=${DOCKER_IMAGE} -n ${KUBE_NAMESPACE}
                    kubectl rollout status deployment/myapp -n ${KUBE_NAMESPACE}
                '''
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
            sh 'kubectl rollout undo deployment/myapp -n ${KUBE_NAMESPACE}'
        }
    }
}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - push
  - deploy

variables:
  DOCKER_IMAGE: myapp:${CI_COMMIT_SHA}
  KUBE_NAMESPACE: production

build:
  stage: build
  script:
    - docker build -t ${DOCKER_IMAGE} .

test:
  stage: test
  script:
    - docker run ${DOCKER_IMAGE} npm test

push:
  stage: push
  script:
    - docker push ${DOCKER_IMAGE}
  only:
    - main

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=${DOCKER_IMAGE} -n ${KUBE_NAMESPACE}
    - kubectl rollout status deployment/myapp -n ${KUBE_NAMESPACE}
  only:
    - main
  when: manual
```

### ArgoCD GitOps

```yaml
# application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp                         # 应用名称
  namespace: argocd
spec:
  project: default
  
  source:
    repoURL: https://github.com/myorg/myapp.git  # Git 仓库
    targetRevision: main
    path: k8s                       # K8s 配置路径
    
  destination:
    server: https://kubernetes.default.svc
    namespace: production
    
  syncPolicy:
    automated:                      # 自动同步
      prune: true                   # 删除多余资源
      selfHeal: true                # 自动修复
    syncOptions:
    - CreateNamespace=true
```

```bash
# ❶ 安装 ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# ❷ 查看 ArgoCD Server
kubectl get svc -n argocd
# 输出：
# NAME                    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
# argocd-server           ClusterIP   10.96.100.50    <none>        80/TCP,443/TCP

# ❸ 获取 admin 密码
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# ❹ 端口转发
kubectl port-forward -n argocd svc/argocd-server 8080:443

# ❺ 在浏览器访问
# https://localhost:8080
# 用户名：admin
# 密码：上一步获取的密码

# ❻ 创建应用
kubectl apply -f application.yaml

# ❼ 查看应用
kubectl get application -n argocd
# 输出：
# NAME    SYNC STATUS   HEALTH STATUS
# myapp   Synced        Healthy
```

---

## 4 安全加固

### Pod Security Standards

```yaml
# pod-security-policy.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: restricted-ns
  labels:
    pod-security.kubernetes.io/enforce: restricted      # 强制策略
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: restricted        # 审计策略
    pod-security.kubernetes.io/warn: restricted         # 警告策略
```

### NetworkPolicy

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny                  # 默认拒绝所有流量
  namespace: production
spec:
  podSelector: {}                     # 匹配所有 Pod
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend                # 允许前端访问后端
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend                    # 目标 Pod
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend               # 来源 Pod
    ports:
    - protocol: TCP
      port: 8080
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-database                # 允许后端访问数据库
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: database                   # 目标 Pod
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend                # 来源 Pod
    ports:
    - protocol: TCP
      port: 5432
```

### 镜像扫描

```bash
# ❶ 安装 Trivy
brew install aquasecurity/trivy/trivy  # macOS
# 或
apt-get install trivy                  # Linux

# ❷ 扫描镜像
trivy image nginx:1.21
# 输出：
# 2026-07-26T10:00:00.000+0800    INFO    Detecting vulnerabilities...
# 
# nginx:1.21 (debian 11.3)
# ========================
# Total: 15 (UNKNOWN: 0, LOW: 8, MEDIUM: 5, HIGH: 2, CRITICAL: 0)
# 
# +---------+------------------+----------+-------------------+---------------+--------------------------------+
# | LIBRARY | VULNERABILITY ID | SEVERITY | INSTALLED VERSION | FIXED VERSION |            TITLE               |
# +---------+------------------+----------+-------------------+---------------+--------------------------------+
# | libssl  | CVE-2022-0778    | HIGH     | 1.1.1k-1          | 1.1.1n-0      | OpenSSL: Infinite loop in      |
# |         |                  |          |                   |               | BN_mod_sqrt()                  |
# +---------+------------------+----------+-------------------+---------------+--------------------------------+

# ❸ 扫描 Kubernetes 集群
trivy k8s --report summary cluster
# 输出：
# Summary Report for Kubernetes
# =============================
# 
# Workload Vulnerabilities (HIGH/CRITICAL): 15
# 
# ┌──────────────┬──────────────┬───────────────────┬──────────────────┐
│   NAMESPACE   │   KIND       │      NAME         │  VULNERABILITIES │
├──────────────┼──────────────┼───────────────────┼──────────────────┤
│ default      │ Deployment   │ myapp             │  HIGH: 2         │
│ production   │ Deployment   │ backend           │  HIGH: 5         │
└──────────────┴──────────────┴───────────────────┴──────────────────┘
```

### Secrets 管理

```yaml
# sealed-secret.yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: my-secret
  namespace: default
spec:
  encryptedData:
    password: AgBy3i4OJSWK+PiTySYZZA9fO...  # 加密后的数据
  template:
    metadata:
      name: my-secret
      namespace: default
    type: Opaque
```

```bash
# ❶ 安装 Sealed Secrets
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.19.5/controller.yaml

# ❷ 安装 kubeseal 命令行工具
brew install kubeseal  # macOS
# 或
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.19.5/kubeseal-linux-amd64 -O kubeseal
chmod +x kubeseal
sudo mv kubeseal /usr/local/bin/

# ❸ 创建 Secret
kubectl create secret generic my-secret \
  --from-literal=password=mypassword \
  --dry-run=client -o yaml > secret.yaml

# ❹ 加密 Secret
kubeseal --format yaml < secret.yaml > sealed-secret.yaml

# ❺ 查看加密后的 Secret
cat sealed-secret.yaml
# 输出：
# apiVersion: bitnami.com/v1alpha1
# kind: SealedSecret
# metadata:
#   name: my-secret
#   namespace: default
# spec:
#   encryptedData:
#     password: AgBy3i4OJSWK+PiTySYZZA9fO...

# ❻ 部署 SealedSecret
kubectl apply -f sealed-secret.yaml

# ❼ 查看解密后的 Secret
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 -d
# 输出：mypassword
```

---

## 5 性能优化

### 资源限制

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        resources:
          requests:                     # 请求资源（调度依据）
            cpu: 100m                   # 0.1 核
            memory: 128Mi               # 128 MB
          limits:                       # 限制资源（上限）
            cpu: 500m                   # 0.5 核
            memory: 512Mi               # 512 MB
```

### HPA 自动扩缩容

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3                        # 最小副本数
  maxReplicas: 10                       # 最大副本数
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70          # CPU 使用率目标
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80          # 内存使用率目标
```

```bash
# ❶ 创建 HPA
kubectl apply -f hpa.yaml

# ❷ 查看 HPA
kubectl get hpa
# 输出：
# NAME        REFERENCE          TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
# myapp-hpa   Deployment/myapp   45%/70%         3         10        3          10s

# ❸ 查看 HPA 详情
kubectl describe hpa myapp-hpa
# 输出：
# Name:                                                  myapp-hpa
# Namespace:                                             default
# Labels:                                                <none>
# Annotations:                                           <none>
# CreationTimestamp:                                     Mon, 26 Jul 2026 10:00:00 +0800
# Reference:                                             Deployment/myapp
# Metrics:                                               ( current / target )
#   resource cpu on pods  (as a percentage of request):  45% (45m) / 70%
#   resource memory on pods  (as a percentage of request):  60% (76Mi) / 80%
# Min replicas:                                          3
# Max replicas:                                          10
# Deployment pods:                                       3 current / 3 desired
# Conditions:
#   Type            Status  Reason            Message
#   ----            ------  ------            -------
#   AbleToScale     True    ReadyForNewScale  the last scaling time was sufficiently old
#   ScalingActive   True    ValidMetricsFound the HPA was able to successfully calculate a replica count
```

### 节点亲和性

```yaml
# node-affinity.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: disktype
                operator: In
                values:
                - ssd                       # 必须调度到有 SSD 的节点
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 1
            preference:
              matchExpressions:
              - key: zone
                operator: In
                values:
                - us-west-1a                # 优先调度到 us-west-1a 区域
```

### 污点和容忍

```yaml
# taint-toleration.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      tolerations:
      - key: "dedicated"
        operator: "Equal"
        value: "special-user"
        effect: "NoSchedule"                # 容忍 dedicated=special-user 污点
      containers:
      - name: myapp
        image: myapp:latest
```

```bash
# ❶ 给节点添加污点
kubectl taint nodes node1 dedicated=special-user:NoSchedule

# ❷ 查看节点污点
kubectl describe node node1 | grep Taint
# 输出：
# Taints:  dedicated=special-user:NoSchedule

# ❸ 移除污点
kubectl taint nodes node1 dedicated=special-user:NoSchedule-
```

---

## 6 备份策略

### etcd 快照备份

```bash
# ❶ 备份 etcd
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# ❷ 查看备份
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-snapshot.db --write-out=table
# 输出：
# +---------+---------+------------+------------+
# |  HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
# +---------+---------+------------+------------+
# | 1234567 |   10000  |     5000   |    50 MB   |
# +---------+---------+------------+------------+

# ❸ 恢复 etcd
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot.db \
  --data-dir=/var/lib/etcd-restored

# ❹ 定时备份（CronJob）
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: etcd-backup
  namespace: kube-system
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          hostNetwork: true
          containers:
          - name: etcd-backup
            image: bitnami/etcd:3.5.0
            command:
            - /bin/sh
            - -c
            - |
              ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot-$(date +%Y%m%d).db \
                --endpoints=https://127.0.0.1:2379 \
                --cacert=/etc/kubernetes/pki/etcd/ca.crt \
                --cert=/etc/kubernetes/pki/etcd/server.crt \
                --key=/etc/kubernetes/pki/etcd/server.key
            volumeMounts:
            - name: etcd-certs
              mountPath: /etc/kubernetes/pki/etcd
              readOnly: true
            - name: backup
              mountPath: /backup
          volumes:
          - name: etcd-certs
            hostPath:
              path: /etc/kubernetes/pki/etcd
          - name: backup
            hostPath:
              path: /backup
          restartPolicy: OnFailure
EOF
```

### Velero 备份

```bash
# ❶ 安装 Velero
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm repo update
helm install velero vmware-tanzu/velero \
  --namespace velero \
  --create-namespace \
  --set configuration.provider=aws \
  --set configuration.backupStorageLocation.bucket=my-backup-bucket \
  --set configuration.backupStorageLocation.config.region=us-west-2 \
  --set credentials.useSecret=true \
  --set credentials.secretContents.cloud="AWS_ACCESS_KEY_ID=xxx\nAWS_SECRET_ACCESS_KEY=xxx"

# ❷ 查看 Velero
kubectl get pods -n velero
# 输出：
# NAME                      READY   STATUS    RESTARTS   AGE
# velero-abc12              1/1     Running   0          30s

# ❸ 创建备份
velero backup create my-backup --include-namespaces production
# 输出：
# Backup request "my-backup" submitted successfully.
# Run `velero backup describe my-backup` for more details.

# ❹ 查看备份
velero backup get
# 输出：
# NAME         STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES   STORAGE LOCATION   SELECTOR
# my-backup    Completed   0        0          2026-07-26 10:00:00 +0800 CST   29d       default            <none>

# ❺ 查看备份详情
velero backup describe my-backup
# 输出：
# Name:         my-backup
# Namespace:    velero
# Labels:       <none>
# Annotations:  <none>
# 
# Phase:  Completed
# 
# Namespaces:
#   Included:  production
#   Excluded:  <none>
# 
# Resources:
#   Included:  *
#   Excluded:  <none>

# ❻ 恢复备份
velero restore create --from-backup my-backup
# 输出：
# Restore request "my-backup-20260726100000" submitted successfully.
# Run `velero restore describe my-backup-20260726100000` for more details.

# ❼ 定时备份
velero schedule create daily-backup --schedule="0 2 * * *" --include-namespaces production
# 输出：
# Schedule "daily-backup" created successfully.

# ❽ 查看定时备份
velero schedule get
# 输出：
# NAME            STATUS    CREATED                         SCHEDULE    BACKUP TTL   LAST BACKUP   SELECTOR
# daily-backup    Enabled   2026-07-26 10:00:00 +0800 CST   0 2 * * *   720h0m0s     1m ago        <none>
```

---

## 7 常见问题排查

### CrashLoopBackOff

```bash
# ❶ 查看 Pod 状态
kubectl get pods
# 输出：
# NAME     READY   STATUS             RESTARTS   AGE
# myapp    0/1     CrashLoopBackOff   5          5m

# ❷ 查看 Pod 日志
kubectl logs myapp
# 输出：
# Error: Database connection failed
# ...

# ❸ 查看上一次崩溃的日志
kubectl logs myapp --previous
# 输出：
# Starting application...
# Connecting to database...
# Error: Database connection failed
# ...

# ❹ 查看 Pod 详情
kubectl describe pod myapp
# 输出：
# Events:
#   Type     Reason     Age   From               Message
#   ----     ------     ----  ----               -------
#   Normal   Scheduled  5m    default-scheduler  Successfully assigned default/myapp to node1
#   Normal   Pulled     4m    kubelet            Container image "myapp:latest" already present
#   Normal   Created    4m    kubelet            Created container myapp
#   Normal   Started    4m    kubelet            Started container myapp
#   Warning  BackOff    3m    kubelet            Back-off restarting failed container
#   Warning  BackOff    2m    kubelet            Back-off restarting failed container
#   Warning  BackOff    1m    kubelet            Back-off restarting failed container

# ❺ 解决方案
# - 检查应用配置
# - 检查依赖服务（数据库、缓存等）
# - 检查资源限制
# - 检查环境变量
```

### ImagePullBackOff

```bash
# ❶ 查看 Pod 状态
kubectl get pods
# 输出：
# NAME     READY   STATUS              RESTARTS   AGE
# myapp    0/1     ImagePullBackOff    0          5m

# ❷ 查看 Pod 详情
kubectl describe pod myapp
# 输出：
# Events:
#   Type     Reason     Age   From               Message
#   ----     ------     ----  ----               -------
#   Normal   Scheduled  5m    default-scheduler  Successfully assigned default/myapp to node1
#   Normal   Pulling    4m    kubelet            Pulling image "myapp:latest"
#   Warning  Failed     4m    kubelet            Failed to pull image "myapp:latest": rpc error: code = Unknown desc = Error response from daemon: manifest for myapp:latest not found
#   Warning  Failed     4m    kubelet            Error: ErrImagePull
#   Normal   BackOff    3m    kubelet            Back-off pulling image "myapp:latest"
#   Warning  Failed     3m    kubelet            Error: ImagePullBackOff

# ❸ 解决方案
# - 检查镜像名称和标签
# - 检查镜像仓库认证
# - 检查网络连接
# - 手动拉取镜像测试

# ❹ 创建镜像拉取 Secret
kubectl create secret docker-registry my-registry \
  --docker-server=registry.example.com \
  --docker-username=admin \
  --docker-password=password \
  --docker-email=admin@example.com

# ❺ 在 Pod 中使用 Secret
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  imagePullSecrets:
  - name: my-registry
  containers:
  - name: myapp
    image: registry.example.com/myapp:latest
EOF
```

### Pending Pods

```bash
# ❶ 查看 Pod 状态
kubectl get pods
# 输出：
# NAME     READY   STATUS    RESTARTS   AGE
# myapp    0/1     Pending   0          5m

# ❷ 查看 Pod 详情
kubectl describe pod myapp
# 输出：
# Events:
#   Type     Reason            Age   From               Message
#   ----     ------            ----  ----               -------
#   Warning  FailedScheduling  5m    default-scheduler  0/3 nodes are available: 1 Insufficient cpu, 2 Insufficient memory.

# ❸ 解决方案
# - 检查节点资源
kubectl top nodes
# 输出：
# NAME     CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
# node1    450m         45%    1500Mi          75%
# node2    380m         38%    1200Mi          60%
# node3    520m         52%    1800Mi          90%

# - 检查 Pod 资源请求
kubectl get pod myapp -o jsonpath='{.spec.containers[*].resources}'
# 输出：
# {"requests":{"cpu":"2","memory":"4Gi"}}

# - 调整资源请求
# - 添加节点
# - 检查节点污点
kubectl describe nodes | grep -A 5 Taints
```

### 网络问题

```bash
# ❶ 检查 Service
kubectl get svc
# 输出：
# NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
# myapp-svc    ClusterIP   10.96.100.50    <none>        80/TCP    10m

# ❷ 检查 Endpoints
kubectl get endpoints myapp-svc
# 输出：
# NAME         ENDPOINTS                         AGE
# myapp-svc    10.244.1.5:80,10.244.2.3:80       10m

# ❸ 测试 Service 连通性
kubectl run test --rm -it --image=busybox -- wget -qO- http://myapp-svc
# 输出：
# If you don't see a command prompt, try pressing enter.
# Welcome to myapp!

# ❹ 检查 DNS
kubectl run test --rm -it --image=busybox -- nslookup myapp-svc
# 输出：
# Server:    10.96.0.10
# Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
# 
# Name:      myapp-svc
# Address 1: 10.96.100.50 myapp-svc.default.svc.cluster.local

# ❺ 检查网络策略
kubectl get networkpolicy
# 输出：
# NAME          POD-SELECTOR   AGE
# default-deny  <none>         10m

# ❻ 检查 CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
# 输出：
# NAME                       READY   STATUS    RESTARTS   AGE
# coredns-abc12              1/1     Running   0          10m
# coredns-def34              1/1     Running   0          10m

# ❼ 查看 CoreDNS 日志
kubectl logs -n kube-system deployment/coredns
```

---

## 8 对比表格

| 部署方式 | 说明 | 优点 | 缺点 |
|----------|------|------|------|
| kubectl apply | 手动部署 | 简单直接 | 无法回滚、无审计 |
| Jenkins | CI/CD 流水线 | 自动化、可追溯 | 需要维护 Jenkins |
| GitLab CI | CI/CD 流水线 | 与 GitLab 集成 | 需要 GitLab |
| ArgoCD | GitOps | 声明式、自动同步 | 学习曲线 |

| 备份工具 | 说明 | 优点 | 缺点 |
|----------|------|------|------|
| etcd snapshot | etcd 数据备份 | 简单、快速 | 只备份 etcd |
| Velero | 集群资源备份 | 完整备份、支持恢复 | 需要对象存储 |

| 安全工具 | 说明 | 用途 |
|----------|------|------|
| RBAC | 权限控制 | 控制用户访问 |
| NetworkPolicy | 网络隔离 | 控制 Pod 通信 |
| Pod Security | 安全策略 | 限制 Pod 权限 |
| Trivy | 镜像扫描 | 发现漏洞 |
| Sealed Secrets | Secret 加密 | 安全存储密码 |

---

## 9 新手常见误区

### 误区 1："生产环境只需要一个 master 节点"

**错！** 单 master 节点是单点故障。生产环境至少需要 3 个 master 节点，确保高可用。etcd 集群也需要奇数节点（3、5、7）。

### 误区 2："CI/CD 只是开发环境的事"

**错！** 生产环境更需要 CI/CD。手动部署容易出错，无法回滚。CI/CD 提供自动化、可追溯、可回滚的部署流程。

### 误区 3："安全只是运维的事"

**错！** 安全是全员责任。开发需要写安全的代码，运维需要配置安全的集群，测试需要验证安全性。安全左移（Shift Left）是现代 DevOps 的核心理念。

### 误区 4："资源限制越低越好"

**错！** 资源限制过低会导致：
- Pod 被 OOM Killed
- CPU 被限流，响应变慢
- 调度失败

应该根据实际使用情况合理设置 requests 和 limits。

### 误区 5："备份只需要做一次"

**错！** 备份需要定期执行，并且要：
- 验证备份的完整性
- 测试恢复流程
- 保留多个历史版本
- 存储在不同位置

---

## 10 动手练习

### 练习 1：配置 HPA 自动扩缩容

为 Deployment 配置 HPA，当 CPU 使用率超过 70% 时自动扩容。

<details>
<summary>点击查看答案</summary>

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: nginx:1.21
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        ports:
        - containerPort: 80
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-svc
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 80
---
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
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

```bash
# ❶ 创建资源
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml

# ❷ 查看 HPA
kubectl get hpa
# 输出：
# NAME        REFERENCE          TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
# myapp-hpa   Deployment/myapp   0%/70%    2         10        2          10s

# ❸ 生成负载
kubectl run load-gen --image=busybox -it --rm -- /bin/sh -c "while true; do wget -qO- http://myapp-svc; done"

# ❹ 观察 HPA 扩容
kubectl get hpa -w
# 输出：
# NAME        REFERENCE          TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
# myapp-hpa   Deployment/myapp   85%/70%   2         10        2          2m
# myapp-hpa   Deployment/myapp   85%/70%   2         10        4          3m
# myapp-hpa   Deployment/myapp   90%/70%   2         10        6          4m

# ❺ 查看 Pod
kubectl get pods
# 输出：
# NAME                     READY   STATUS    RESTARTS   AGE
# myapp-abc12              1/1     Running   0          5m
# myapp-def34              1/1     Running   0          5m
# myapp-ghi56              1/1     Running   0          1m
# myapp-jkl78              1/1     Running   0          1m

# ❻ 停止负载后观察缩容
kubectl get hpa -w
# 输出：
# myapp-hpa   Deployment/myapp   10%/70%   2         10        6          10m
# myapp-hpa   Deployment/myapp   5%/70%    2         10        6          15m
# myapp-hpa   Deployment/myapp   2%/70%    2         10        2          20m
```

</details>

### 练习 2：创建 NetworkPolicy 网络隔离

创建 NetworkPolicy，只允许 frontend 访问 backend，只允许 backend 访问 database。

<details>
<summary>点击查看答案</summary>

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-database
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 5432
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
  - Ingress
  ingress:
  - ports:
    - protocol: TCP
      port: 80
```

```bash
# ❶ 创建命名空间
kubectl create namespace production

# ❷ 创建 NetworkPolicy
kubectl apply -f network-policy.yaml

# ❸ 查看 NetworkPolicy
kubectl get networkpolicy -n production
# 输出：
# NAME             POD-SELECTOR   AGE
# default-deny     <none>         5s
# allow-frontend   app=backend    5s
# allow-database   app=database   5s
# allow-external   app=frontend   5s

# ❹ 创建测试 Pod
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: frontend
  namespace: production
  labels:
    app: frontend
spec:
  containers:
  - name: frontend
    image: nginx:1.21
---
apiVersion: v1
kind: Pod
metadata:
  name: backend
  namespace: production
  labels:
    app: backend
spec:
  containers:
  - name: backend
    image: nginx:1.21
---
apiVersion: v1
kind: Pod
metadata:
  name: database
  namespace: production
  labels:
    app: database
spec:
  containers:
  - name: database
    image: nginx:1.21
EOF

# ❺ 测试连通性
# frontend -> backend (应该成功)
kubectl exec -n production frontend -- wget -qO- http://backend:8080
# 输出：Welcome to backend!

# backend -> database (应该成功)
kubectl exec -n production backend -- wget -qO- http://database:5432
# 输出：Welcome to database!

# frontend -> database (应该失败)
kubectl exec -n production frontend -- wget -qO- http://database:5432
# 输出：wget: can't connect to remote host (10.96.100.50): Connection refused

# ❻ 查看 NetworkPolicy 详情
kubectl describe networkpolicy allow-frontend -n production
# 输出：
# Name:         allow-frontend
# Namespace:    production
# Created:      5 minutes ago
# Labels:       <none>
# Annotations:  <none>
# Spec:
#   PodSelector:     app=backend
#   Allowing ingress traffic:
#     To Port: 8080/TCP
#     From:
#       PodSelector: app=frontend
#   Not affecting egress traffic
#   Policy Types: Ingress
```

</details>

### 练习 3（挑战）：配置 Velero 备份和恢复

使用 Velero 备份 production 命名空间，然后恢复。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 安装 MinIO（本地对象存储）
kubectl create namespace minio
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: minio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: minio/minio:latest
        args: ["server", "/data"]
        env:
        - name: MINIO_ACCESS_KEY
          value: "minio"
        - name: MINIO_SECRET_KEY
          value: "minio123"
        ports:
        - containerPort: 9000
---
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: minio
spec:
  type: ClusterIP
  ports:
  - port: 9000
    targetPort: 9000
  selector:
    app: minio
EOF

# ❷ 创建 MinIO bucket
kubectl run mc --image=minio/mc -it --rm -- /bin/sh -c "
  mc config host add minio http://minio.minio:9000 minio minio123 &&
  mc mb minio/velero-backups
"

# ❸ 安装 Velero
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm repo update

cat <<EOF > velero-values.yaml
configuration:
  provider: aws
  backupStorageLocation:
    bucket: velero-backups
    config:
      region: minio
      s3Url: http://minio.minio:9000
      s3ForcePathStyle: "true"
credentials:
  useSecret: true
  secretContents:
    cloud: |
      [default]
      aws_access_key_id=minio
      aws_secret_access_key=minio123
EOF

helm install velero vmware-tanzu/velero \
  --namespace velero \
  --create-namespace \
  -f velero-values.yaml

# ❹ 查看 Velero
kubectl get pods -n velero
# 输出：
# NAME                      READY   STATUS    RESTARTS   AGE
# velero-abc12              1/1     Running   0          30s

# ❺ 创建测试应用
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: production
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: nginx:1.21
        ports:
        - containerPort: 80
EOF

# ❻ 创建备份
velero backup create production-backup --include-namespaces production
# 输出：
# Backup request "production-backup" submitted successfully.
# Run `velero backup describe production-backup` for more details.

# ❼ 查看备份
velero backup get
# 输出：
# NAME                STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES   STORAGE LOCATION   SELECTOR
# production-backup   Completed   0        0          2026-07-26 10:00:00 +0800 CST   29d       default            <none>

# ❽ 删除 production 命名空间
kubectl delete namespace production

# ❾ 查看命名空间已删除
kubectl get namespace production
# 输出：Error from server (NotFound): namespaces "production" not found

# ❿ 恢复备份
velero restore create --from-backup production-backup
# 输出：
# Restore request "production-backup-20260726100000" submitted successfully.
# Run `velero restore describe production-backup-20260726100000` for more details.

# ⓫ 查看恢复状态
velero restore get
# 输出：
# NAME                                BACKUP              STATUS      ERRORS   WARNINGS   CREATED                         SELECTOR
# production-backup-20260726100000    production-backup   Completed   0        0          2026-07-26 10:05:00 +0800 CST   <none>

# ⓬ 查看命名空间已恢复
kubectl get namespace production
# 输出：
# NAME          STATUS   AGE
# production    Active   10s

# ⓭ 查看 Pod 已恢复
kubectl get pods -n production
# 输出：
# NAME                     READY   STATUS    RESTARTS   AGE
# myapp-abc12              1/1     Running   0          10s
# myapp-def34              1/1     Running   0          10s
# myapp-ghi56              1/1     Running   0          10s

# ⓮ 查看 Deployment 已恢复
kubectl get deployment -n production
# 输出：
# NAME    READY   UP-TO-DATE   AVAILABLE   AGE
# myapp   3/3     3            3           10s
```

</details>

---

## 总结

恭喜你完成了 Kubernetes 系列教程的全部 16 章！

从基础概念到生产实战，你已经掌握了：
- Kubernetes 核心概念和架构
- Pod、Deployment、Service、Ingress 等资源
- 配置管理、存储、状态管理
- RBAC 权限控制
- Helm 包管理
- 监控和日志
- 生产环境最佳实践

继续实践和学习，你将成为 Kubernetes 专家！
