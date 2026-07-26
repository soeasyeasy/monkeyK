---
title: "第14章：Helm 包管理"
description: "Kubernetes 包管理器、Chart 结构、模板语法"
---

# 第14章：Helm 包管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Helm？它解决了什么问题？
- 如何快速部署复杂的应用（如 MySQL、Redis、Prometheus）？
- Chart 是什么？它的结构是怎样的？
- 如何自定义应用的配置？
- 如何管理应用的不同版本？
- 如何创建自己的 Chart？

这一章会教你 Helm 的使用方法。学会 Helm，你就能像使用 apt 或 yum 一样管理 Kubernetes 应用，快速部署和配置复杂的应用。

---

## 14.1 为什么需要 Helm？

### 痛点分析

想象一下这个场景：你需要在 Kubernetes 上部署一个完整的 Web 应用，包括：

1. Deployment（应用）
2. Service（暴露端口）
3. Ingress（域名访问）
4. ConfigMap（配置文件）
5. Secret（密码）
6. PersistentVolumeClaim（存储）
7. HorizontalPodAutoscaler（自动扩缩容）

如果手动管理：
- 需要写 7 个 YAML 文件
- 每个环境的配置不同，需要复制修改
- 升级时需要手动更新每个文件
- 回滚更加困难

### 解决方案

Helm 是 Kubernetes 的包管理器，就像：
- Ubuntu 的 apt
- CentOS 的 yum
- macOS 的 brew

打个比方：

> 手动部署像自己买菜做饭，需要自己准备所有食材和调料。
>
> Helm 像点外卖，一键下单，所有食材都准备好了，直接送到你手上。

### Helm 的核心概念

| 概念 | 说明 | 类比 |
|------|------|------|
| Chart | 应用的安装包 | apt 的 .deb 包 |
| Release | Chart 的实例 | 安装后的程序 |
| Repository | Chart 仓库 | apt 源 |
| Values | 配置参数 | 安装选项 |
| Template | 模板文件 | 配置文件模板 |

---

## 14.2 Helm 安装和基本使用

### 安装 Helm

```bash
# macOS
brew install helm

# Windows
choco install kubernetes-helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 验证安装
helm version
# 输出：version.BuildInfo{Version:"v3.12.0", ...}
```

### 基本命令

```bash
# ❶ 添加仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
# 输出："bitnami" has been added to your repositories

# ❷ 更新仓库缓存
helm repo update
# 输出：Hang tight while we grab the latest from your chart repositories...
# Successfully got an update from the "bitnami" chart repository

# ❸ 搜索 Chart
helm search repo nginx
# 输出：
# NAME                    CHART VERSION   APP VERSION     DESCRIPTION
# bitnami/nginx           15.3.1          1.25.2          NGINX Open Source is a web server...
# bitnami/nginx-ingress-controller 10.3.1  1.9.4           NGINX Ingress Controller...

# ❹ 安装 Chart
helm install my-nginx bitnami/nginx
# 输出：
# NAME: my-nginx
# LAST DEPLOYED: Mon Jul 26 10:00:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1

# ❺ 查看 Release
helm list
# 输出：
# NAME      NAMESPACE   REVISION   STATUS    CHART          APP VERSION
# my-nginx  default     1          deployed  nginx-15.3.1   1.25.2

# ❻ 查看 Release 状态
helm status my-nginx
# 输出：
# NAME: my-nginx
# LAST DEPLOYED: Mon Jul 26 10:00:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1
# ...

# ❼ 卸载 Release
helm uninstall my-nginx
# 输出：release "my-nginx" uninstalled
```

---

## 14.3 Chart 结构

### Chart 目录结构

```
mychart/
├── Chart.yaml          # Chart 元数据
├── values.yaml         # 默认配置值
├── charts/             # 依赖的 Chart
├── templates/          # 模板文件
│   ├── deployment.yaml # Deployment 模板
│   ├── service.yaml    # Service 模板
│   ├── ingress.yaml    # Ingress 模板
│   └── _helpers.tpl    # 辅助模板
└── .helmignore         # 忽略文件
```

### Chart.yaml

```yaml
# Chart.yaml
apiVersion: v2                        # API 版本（v2 表示 Helm 3）
name: myapp                           # Chart 名称
description: A simple web application # 描述
type: application                     # 类型（application 或 library）
version: 0.1.0                        # Chart 版本
appVersion: 1.0.0                     # 应用版本
keywords:                             # 关键词
  - web
  - application
maintainers:                          # 维护者
  - name: John Doe
    email: john@example.com
dependencies:                         # 依赖
  - name: redis
    version: 17.0.0
    repository: https://charts.bitnami.com/bitnami
```

### values.yaml

```yaml
# values.yaml
replicaCount: 3                       # 副本数
image:
  repository: nginx                   # 镜像仓库
  tag: 1.21                           # 镜像标签
  pullPolicy: IfNotPresent            # 拉取策略
service:
  type: ClusterIP                     # Service 类型
  port: 80                            # 端口
ingress:
  enabled: true                       # 是否启用 Ingress
  hosts:
    - host: myapp.example.com         # 域名
      paths:
        - path: /
          pathType: Prefix
resources:                            # 资源限制
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

### 模板文件

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}  # 使用辅助模板
  labels:
    {{- include "mychart.labels" . | nindent 4 }}  # 使用辅助模板
spec:
  replicas: {{ .Values.replicaCount }}  # 从 values.yaml 读取
  selector:
    matchLabels:
      {{- include "mychart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "mychart.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: 80
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

---

## 14.4 创建自定义 Chart

### 使用 helm create

```bash
# ❶ 创建 Chart
helm create mychart
# 输出：Creating mychart

# ❷ 查看目录结构
tree mychart
# 输出：
# mychart/
# ├── .helmignore
# ├── Chart.yaml
# ├── charts/
# ├── templates/
# │   ├── NOTES.txt
# │   ├── _helpers.tpl
# │   ├── deployment.yaml
# │   ├── hpa.yaml
# │   ├── ingress.yaml
# │   ├── service.yaml
# │   ├── serviceaccount.yaml
# │   └── tests/
# │       └── test-connection.yaml
# └── values.yaml

# ❸ 安装 Chart
helm install my-release ./mychart
# 输出：
# NAME: my-release
# LAST DEPLOYED: Mon Jul 26 10:00:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1
```

### 手动创建 Chart

```bash
# ❶ 创建目录
mkdir -p myapp/templates
cd myapp

# ❷ 创建 Chart.yaml
cat > Chart.yaml <<EOF
apiVersion: v2
name: myapp
description: A simple web application
version: 0.1.0
appVersion: 1.0.0
EOF

# ❸ 创建 values.yaml
cat > values.yaml <<EOF
replicaCount: 2
image:
  repository: nginx
  tag: 1.21
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
EOF

# ❹ 创建 Deployment 模板
cat > templates/deployment.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-deployment
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: 80
EOF

# ❺ 创建 Service 模板
cat > templates/service.yaml <<EOF
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-service
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
  selector:
    app: {{ .Release.Name }}
EOF

# ❻ 安装 Chart
helm install myapp .
# 输出：
# NAME: myapp
# LAST DEPLOYED: Mon Jul 26 10:00:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1
```

---

## 14.5 模板语法

### 基本语法

```yaml
# 使用 values.yaml 中的值
replicas: {{ .Values.replicaCount }}

# 使用 Release 信息
name: {{ .Release.Name }}
namespace: {{ .Release.Namespace }}

# 使用 Chart 信息
chart: {{ .Chart.Name }}
version: {{ .Chart.Version }}

# 条件判断
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
{{- end }}

# 循环
{{- range .Values.ingress.hosts }}
- host: {{ .host }}
{{- end }}

# 包含辅助模板
{{- include "mychart.labels" . | nindent 4 }}
```

### 辅助模板

```yaml
# templates/_helpers.tpl
{{/*
生成完整名称
*/}}
{{- define "mychart.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
生成标签
*/}}
{{- define "mychart.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
生成选择器标签
*/}}
{{- define "mychart.selectorLabels" -}}
app: {{ .Release.Name }}
{{- end }}
```

### 常用函数

```yaml
# 默认值
{{ .Values.replicaCount | default 1 }}

# 转换为 YAML
{{ toYaml .Values.resources }}

# 缩进
{{ toYaml .Values.resources | nindent 4 }}

# 字符串操作
{{ .Values.image.repository | upper }}
{{ .Values.image.repository | lower }}
{{ .Values.image.repository | title }}

# 条件判断
{{ if .Values.ingress.enabled }}enabled{{ else }}disabled{{ end }}

# 列表操作
{{ range .Values.ingress.hosts }}
- {{ .host }}
{{ end }}
```

---

## 14.6 Release 管理

### 升级 Release

```bash
# ❶ 修改 values.yaml
echo "replicaCount: 5" > values.yaml

# ❷ 升级 Release
helm upgrade myapp .
# 输出：
# Release "myapp" has been upgraded. Happy Helming!
# NAME: myapp
# LAST DEPLOYED: Mon Jul 26 10:05:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 2

# ❸ 查看历史
helm history myapp
# 输出：
# REVISION   UPDATED                   STATUS    CHART       APP VERSION
# 1          Mon Jul 26 10:00:00 2026  superseded myapp-0.1.0 1.0.0
# 2          Mon Jul 26 10:05:00 2026  deployed  myapp-0.1.0 1.0.0

# ❹ 回滚到上一版本
helm rollback myapp 1
# 输出：Rollback was a success!

# ❺ 回滚到指定版本
helm rollback myapp 2
# 输出：Rollback was a success!

# ❻ 使用自定义 values 文件
helm upgrade myapp . -f production-values.yaml

# ❼ 使用命令行参数
helm upgrade myapp . --set replicaCount=3
```

### 查看 Release 信息

```bash
# ❶ 列出所有 Release
helm list
# 输出：
# NAME    NAMESPACE   REVISION   STATUS    CHART          APP VERSION
# myapp   default     3          deployed  myapp-0.1.0    1.0.0

# ❷ 查看 Release 状态
helm status myapp
# 输出：
# NAME: myapp
# LAST DEPLOYED: Mon Jul 26 10:10:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 3

# ❸ 查看 Release 的 values
helm get values myapp
# 输出：
# replicaCount: 3
# image:
#   repository: nginx
#   tag: 1.21

# ❹ 查看 Release 的 manifests
helm get manifest myapp
# 输出：
# ---
# apiVersion: apps/v1
# kind: Deployment
# ...

# ❺ 查看 Release 的 notes
helm get notes myapp
# 输出：
# 1. Get the application URL by running these commands:
#   export POD_NAME=$(kubectl get pods --namespace default -l "app=myapp" -o jsonpath="{.items[0].metadata.name}")
#   kubectl --namespace default port-forward $POD_NAME 8080:80
```

---

## 14.7 仓库管理

### 添加仓库

```bash
# ❶ 添加 Bitnami 仓库
helm repo add bitnami https://charts.bitnami.com/bitnami

# ❷ 添加 Prometheus 仓库
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# ❸ 添加 Elastic 仓库
helm repo add elastic https://helm.elastic.co

# ❹ 列出所有仓库
helm repo list
# 输出：
# NAME                    URL
# bitnami                 https://charts.bitnami.com/bitnami
# prometheus-community    https://prometheus-community.github.io/helm-charts
# elastic                 https://helm.elastic.co

# ❺ 更新仓库缓存
helm repo update

# ❻ 移除仓库
helm repo remove bitnami
```

### 搜索 Chart

```bash
# ❶ 搜索仓库中的 Chart
helm search repo nginx
# 输出：
# NAME                    CHART VERSION   APP VERSION     DESCRIPTION
# bitnami/nginx           15.3.1          1.25.2          NGINX Open Source...

# ❷ 搜索所有版本的 Chart
helm search repo nginx --versions
# 输出：
# NAME                    CHART VERSION   APP VERSION     DESCRIPTION
# bitnami/nginx           15.3.1          1.25.2          NGINX Open Source...
# bitnami/nginx           15.3.0          1.25.1          NGINX Open Source...
# bitnami/nginx           15.2.0          1.25.0          NGINX Open Source...

# ❸ 搜索 Artifact Hub
helm search hub prometheus
# 输出：
# URL                                                CHART VERSION   APP VERSION     DESCRIPTION
# https://artifacthub.io/packages/helm/prometheus... 24.0.0         2.47.0          Prometheus is a monitoring system...
```

---

## 14.8 Hooks（钩子）

### 什么是 Hooks？

Hooks 允许你在 Release 生命周期的特定时间点执行操作。

| Hook | 执行时机 |
|------|----------|
| pre-install | 在资源创建之前 |
| post-install | 在所有资源创建之后 |
| pre-upgrade | 在资源升级之前 |
| post-upgrade | 在所有资源升级之后 |
| pre-delete | 在资源删除之前 |
| post-delete | 在所有资源删除之后 |
| pre-rollback | 在资源回滚之前 |
| post-rollback | 在所有资源回滚之后 |
| test | 在 helm test 命令执行时 |

### 示例：数据库迁移

```yaml
# templates/hooks/pre-upgrade-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-db-migration
  annotations:
    "helm.sh/hook": pre-upgrade        # Hook 类型
    "helm.sh/hook-weight": "-5"         # 权重（越小越先执行）
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      containers:
      - name: db-migration
        image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
        command: ["python", "manage.py", "migrate"]
      restartPolicy: Never
  backoffLimit: 3
```

### 示例：测试 Hook

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ .Release.Name }}-test-connection
  annotations:
    "helm.sh/hook": test               # 测试 Hook
spec:
  containers:
  - name: wget
    image: busybox
    command: ['wget']
    args: ['{{ .Release.Name }}-service:{{ .Values.service.port }}']
  restartPolicy: Never
```

```bash
# 运行测试
helm test myapp
# 输出：
# Pod myapp-test-connection pending
# Pod myapp-test-connection succeeded
# Pod myapp-test-connection deleted
```

---

## 14.9 依赖管理

### 添加依赖

```yaml
# Chart.yaml
dependencies:
  - name: redis                       # 依赖名称
    version: 17.0.0                   # 版本
    repository: https://charts.bitnami.com/bitnami  # 仓库地址
    condition: redis.enabled          # 条件（可选）
    alias: cache                      # 别名（可选）
```

### 管理依赖

```bash
# ❶ 下载依赖
helm dependency update
# 输出：
# Hang tight while we grab the latest from your chart repositories...
# Successfully got an update from the "bitnami" chart repository
# Update Complete. Your dependencies are ready!

# ❷ 查看依赖
helm dependency list
# 输出：
# NAME    VERSION   REPOSITORY                              STATUS
# redis   17.0.0    https://charts.bitnami.com/bitnami      ok

# ❸ 打包依赖
helm dependency build
# 输出：
# Successfully rebuilt an archive with the following charts:
#   - redis-17.0.0

# ❹ 解包依赖
helm dependency update --untar
```

---

## 14.10 对比表格

| 特性 | 手动 YAML | Helm Chart |
|------|-----------|------------|
| 配置管理 | 复制修改 | values.yaml |
| 版本控制 | 手动管理 | 自动管理 |
| 回滚 | 手动恢复 | helm rollback |
| 依赖管理 | 手动处理 | 自动处理 |
| 复用性 | 低 | 高 |
| 学习曲线 | 低 | 中 |
| 适合场景 | 简单应用 | 复杂应用 |

| Helm 命令 | 说明 | 示例 |
|-----------|------|------|
| helm install | 安装 Chart | `helm install myapp ./mychart` |
| helm upgrade | 升级 Release | `helm upgrade myapp ./mychart` |
| helm rollback | 回滚 Release | `helm rollback myapp 1` |
| helm uninstall | 卸载 Release | `helm uninstall myapp` |
| helm list | 列出 Release | `helm list` |
| helm status | 查看状态 | `helm status myapp` |
| helm history | 查看历史 | `helm history myapp` |
| helm repo add | 添加仓库 | `helm repo add bitnami https://...` |
| helm repo update | 更新仓库 | `helm repo update` |
| helm search | 搜索 Chart | `helm search repo nginx` |

---

## 14.11 新手常见误区

### 误区 1："Helm 和 kubectl 是替代关系"

**错！** Helm 和 kubectl 是互补的。Helm 用于管理 Chart 和 Release，kubectl 用于直接操作 Kubernetes 资源。Helm 底层还是调用 kubectl 的 API。

### 误区 2："values.yaml 中的值会覆盖命令行参数"

**错！** 命令行参数（--set）的优先级高于 values.yaml。优先级顺序：
1. 命令行参数（--set）
2. values.yaml 文件
3. Chart 默认值

```bash
# values.yaml 中 replicaCount: 2
helm install myapp . --set replicaCount=5
# 最终 replicaCount 是 5，不是 2
```

### 误区 3："删除 Release 后所有资源都会被删除"

**不完全对！** 默认情况下，helm uninstall 会删除 Release 创建的所有资源。但是：
- 带有 `"helm.sh/resource-policy": keep` 注解的资源不会被删除
- 手动添加的资源不会被删除
- PVC 默认会被删除（可能丢失数据）

### 误区 4："Helm 只能安装官方 Chart"

**错！** Helm 可以安装任何 Chart，包括：
- 官方 Chart（bitnami、prometheus-community 等）
- 第三方 Chart
- 自己创建的 Chart
- 本地目录中的 Chart

### 误区 5："模板语法很复杂，很难学"

**不完全对！** Helm 使用 Go 模板语法，确实有一定学习曲线。但是：
- 基本语法很简单（{{ .Values.xxx }}）
- 官方提供了很多示例
- 可以使用 helm create 生成模板
- 社区有很多现成的 Chart 可以参考

---

## 14.12 动手练习

### 练习 1：安装和配置 MySQL

使用 Helm 安装 MySQL，配置 root 密码和数据库。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 添加 Bitnami 仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# ❷ 创建 values 文件
cat > mysql-values.yaml <<EOF
auth:
  rootPassword: mypassword          # root 密码
  database: mydb                    # 默认数据库
  username: myuser                  # 用户名
  password: myuserpass              # 用户密码
primary:
  persistence:
    enabled: true                   # 启用持久化存储
    size: 8Gi                       # 存储大小
  resources:
    limits:
      cpu: 500m
      memory: 1Gi
    requests:
      cpu: 250m
      memory: 512Mi
EOF

# ❸ 安装 MySQL
helm install my-mysql bitnami/mysql -f mysql-values.yaml
# 输出：
# NAME: my-mysql
# LAST DEPLOYED: Mon Jul 26 10:00:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1

# ❹ 查看 Pod
kubectl get pods
# 输出：
# NAME               READY   STATUS    RESTARTS   AGE
# my-mysql-0         1/1     Running   0          30s

# ❺ 查看 Service
kubectl get svc
# 输出：
# NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
# my-mysql     ClusterIP   10.96.100.50    <none>        3306/TCP   30s

# ❻ 连接 MySQL
kubectl exec -it my-mysql-0 -- mysql -uroot -pmypassword
# 输出：
# Welcome to the MySQL monitor...
# mysql>

# ❼ 查看 Release 状态
helm status my-mysql

# ❽ 升级 MySQL
helm upgrade my-mysql bitnami/mysql --set primary.persistence.size=10Gi

# ❾ 卸载 MySQL
helm uninstall my-mysql
```

</details>

### 练习 2：创建自定义 Chart

创建一个简单的 Web 应用 Chart，包含 Deployment 和 Service。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 创建目录结构
mkdir -p webapp/templates
cd webapp

# ❷ 创建 Chart.yaml
cat > Chart.yaml <<EOF
apiVersion: v2
name: webapp
description: A simple web application
version: 0.1.0
appVersion: 1.0.0
EOF

# ❸ 创建 values.yaml
cat > values.yaml <<EOF
replicaCount: 2
image:
  repository: nginx
  tag: 1.21
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi
EOF

# ❹ 创建 Deployment 模板
cat > templates/deployment.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-webapp
  labels:
    app: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: 80
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
EOF

# ❺ 创建 Service 模板
cat > templates/service.yaml <<EOF
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-webapp
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: 80
  selector:
    app: {{ .Release.Name }}
EOF

# ❻ 安装 Chart
helm install my-webapp .
# 输出：
# NAME: my-webapp
# LAST DEPLOYED: Mon Jul 26 10:00:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1

# ❼ 查看资源
kubectl get deployment,svc
# 输出：
# NAME                          READY   UP-TO-DATE   AVAILABLE   AGE
# deployment.apps/my-webapp     2/2     2            2           10s
#
# NAME                      TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
# service/my-webapp         ClusterIP   10.96.100.51    <none>        80/TCP    10s

# ❽ 升级 Chart
helm upgrade my-webapp . --set replicaCount=3

# ❾ 查看历史
helm history my-webapp
# 输出：
# REVISION   UPDATED                   STATUS      CHART           APP VERSION
# 1          Mon Jul 26 10:00:00 2026  superseded  webapp-0.1.0    1.0.0
# 2          Mon Jul 26 10:05:00 2026  deployed    webapp-0.1.0    1.0.0

# ❿ 卸载 Chart
helm uninstall my-webapp
```

</details>

### 练习 3（挑战）：创建带依赖的 Chart

创建一个 Web 应用 Chart，依赖 Redis 作为缓存。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 创建目录结构
mkdir -p webapp-with-redis/templates
cd webapp-with-redis

# ❷ 创建 Chart.yaml（包含依赖）
cat > Chart.yaml <<EOF
apiVersion: v2
name: webapp-with-redis
description: A web application with Redis cache
version: 0.1.0
appVersion: 1.0.0
dependencies:
  - name: redis
    version: 17.0.0
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
EOF

# ❸ 创建 values.yaml
cat > values.yaml <<EOF
replicaCount: 2
image:
  repository: nginx
  tag: 1.21
redis:
  enabled: true                     # 启用 Redis
  auth:
    enabled: false                  # 禁用密码（测试用）
  architecture: standalone          # 单节点模式
EOF

# ❹ 创建 Deployment 模板
cat > templates/deployment.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-webapp
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        env:
        - name: REDIS_HOST
          value: {{ .Release.Name }}-redis-master
        - name: REDIS_PORT
          value: "6379"
EOF

# ❺ 下载依赖
helm dependency update
# 输出：
# Hang tight while we grab the latest from your chart repositories...
# Successfully got an update from the "bitnami" chart repository
# Update Complete. Your dependencies are ready!

# ❻ 查看依赖
helm dependency list
# 输出：
# NAME    VERSION   REPOSITORY                              STATUS
# redis   17.0.0    https://charts.bitnami.com/bitnami      ok

# ❼ 安装 Chart
helm install my-webapp .
# 输出：
# NAME: my-webapp
# LAST DEPLOYED: Mon Jul 26 10:00:00 2026
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1

# ❽ 查看 Pod（应该有两个：webapp 和 redis）
kubectl get pods
# 输出：
# NAME                          READY   STATUS    RESTARTS   AGE
# my-webapp-webapp-abc12        1/1     Running   0          30s
# my-webapp-webapp-def34        1/1     Running   0          30s
# my-webapp-redis-master-0      1/1     Running   0          30s

# ❾ 查看 Release
helm list
# 输出：
# NAME      NAMESPACE   REVISION   STATUS    CHART                    APP VERSION
# my-webapp default     1          deployed  webapp-with-redis-0.1.0  1.0.0

# ❿ 禁用 Redis 并升级
helm upgrade my-webapp . --set redis.enabled=false

# ⓫ 查看 Pod（Redis 应该被删除）
kubectl get pods
# 输出：
# NAME                          READY   STATUS    RESTARTS   AGE
# my-webapp-webapp-abc12        1/1     Running   0          5m
# my-webapp-webapp-def34        1/1     Running   0          5m

# ⓬ 卸载 Chart（会同时删除 Redis）
helm uninstall my-webapp
```

</details>

---

## 下一章预告

下一章我们会学习 **监控与日志**——如何监控 Kubernetes 集群的健康状态，如何收集和分析日志。你会学到 Prometheus、Grafana、EFK/ELK 等工具的使用方法。学会这些，你就能及时发现和解决问题，确保集群稳定运行。
