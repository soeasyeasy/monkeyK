---
title: "第15章：监控与日志"
description: "Prometheus 监控、Grafana 可视化、EFK 日志系统"
---

# 第15章：监控与日志

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何监控 Kubernetes 集群的健康状态？
- 如何知道 Pod 的 CPU 和内存使用情况？
- 如何收集和分析容器日志？
- 什么是 Prometheus？它如何工作？
- 如何使用 Grafana 创建监控面板？
- 如何设置告警，及时发现问题？

这一章会教你监控和日志系统的使用方法。学会这些，你就能及时发现和解决问题，确保集群稳定运行。

---

## 1 为什么需要监控和日志？

### 痛点分析

想象一下这个场景：你的 Kubernetes 集群运行着多个微服务，突然用户反馈系统变慢了。

如果没有监控和日志：
- 你不知道哪个服务出了问题
- 你不知道是 CPU 不够还是内存不足
- 你不知道错误发生在哪里
- 你只能猜测和盲目排查

### 解决方案

监控和日志系统专门解决这个问题：**实时收集指标数据，可视化展示，及时告警**。

打个比方：

> 没有监控的集群像没有仪表盘的飞机，飞行员只能靠感觉飞行。
>
> 有监控的集群像有完整仪表盘的飞机，飞行员可以看到所有关键指标，及时发现问题。

### 监控系统的核心组件

| 组件 | 说明 | 示例工具 |
|------|------|----------|
| 指标收集 | 收集系统指标 | Prometheus, Datadog |
| 日志收集 | 收集容器日志 | Fluentd, Fluent Bit, Filebeat |
| 日志存储 | 存储日志数据 | Elasticsearch, Loki |
| 可视化 | 展示监控数据 | Grafana, Kibana |
| 告警 | 发送告警通知 | Alertmanager, PagerDuty |

---

## 2 Prometheus 架构

### 什么是 Prometheus？

Prometheus 是一个开源的监控和告警系统，专门用于云原生环境。

打个比方：

> Prometheus 像医院的体检中心，定期收集病人的各项指标（血压、心率、体温等）。
>
> 如果指标异常，会通知医生（Alertmanager）。
>
> 医生可以通过监控屏幕（Grafana）查看病人的健康状况。

### Prometheus 架构

```
┌─────────────────────────────────────────────────────────┐
│                    Prometheus Server                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  数据采集    │  │  时序数据库  │  │  查询引擎    │  │
│  │  (Scraper)   │  │  (TSDB)      │  │  (PromQL)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                │                │
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Exporters   │  │  Alertmanager│  │   Grafana    │
│  (指标导出)  │  │  (告警管理)  │  │  (可视化)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 核心组件

| 组件 | 说明 | 作用 |
|------|------|------|
| Prometheus Server | 主服务器 | 收集、存储、查询指标 |
| Exporters | 指标导出器 | 导出各种系统的指标 |
| Pushgateway | 推送网关 | 接收短生命周期任务的指标 |
| Alertmanager | 告警管理器 | 处理告警通知 |
| Grafana | 可视化面板 | 展示监控数据 |

### 常用 Exporters

| Exporter | 说明 | 监控对象 |
|----------|------|----------|
| node-exporter | 节点指标 | CPU、内存、磁盘、网络 |
| kube-state-metrics | K8s 资源状态 | Pod、Deployment、Service 等 |
| cadvisor | 容器指标 | 容器 CPU、内存使用 |
| mysql-exporter | MySQL 指标 | 连接数、查询数、慢查询 |
| redis-exporter | Redis 指标 | 内存、连接、命中率 |
| blackbox-exporter | 黑盒监控 | HTTP、TCP、DNS 探测 |

---

## 3 安装 Prometheus

### 使用 Helm 安装

```bash
# ❶ 添加 Prometheus 仓库
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# ❷ 创建命名空间
kubectl create namespace monitoring

# ❸ 安装 Prometheus Stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword=admin123
# 输出：
# NAME: prometheus
# LAST DEPLOYED: Mon Jul 26 10:00:00 2026
# NAMESPACE: monitoring
# STATUS: deployed
# REVISION: 1

# ❹ 查看 Pod
kubectl get pods -n monitoring
# 输出：
# NAME                                                      READY   STATUS    RESTARTS   AGE
# prometheus-kube-prometheus-operator-abc12                 1/1     Running   0          30s
# prometheus-kube-prometheus-prometheus-def34               2/2     Running   0          30s
# prometheus-kube-state-metrics-ghi56                       1/1     Running   0          30s
# prometheus-prometheus-node-exporter-jkl78                 1/1     Running   0          30s
# prometheus-grafana-mno90                                  3/3     Running   0          30s
# prometheus-alertmanager-pqr12                             2/2     Running   0          30s

# ❺ 查看 Service
kubectl get svc -n monitoring
# 输出：
# NAME                                      TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
# prometheus-kube-prometheus-prometheus     ClusterIP   10.96.100.50    <none>        9090/TCP
# prometheus-grafana                        ClusterIP   10.96.100.51    <none>        80/TCP
# prometheus-alertmanager                   ClusterIP   10.96.100.52    <none>        9093/TCP
```

### 访问 Prometheus

```bash
# ❶ 端口转发 Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# ❷ 在浏览器访问
# http://localhost:9090

# ❸ 端口转发 Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# ❹ 在浏览器访问
# http://localhost:3000
# 用户名：admin
# 密码：admin123
```

---

## 4 Prometheus 查询语言（PromQL）

### 基本查询

```bash
# ❶ 查询所有指标
curl http://localhost:9090/api/v1/query?query=up

# ❷ 查询节点 CPU 使用率
curl http://localhost:9090/api/v1/query?query=100-(avg by(instance)(irate(node_cpu_seconds_total{mode="idle"}[5m]))*100)

# ❸ 查询 Pod CPU 使用率
curl http://localhost:9090/api/v1/query?query=sum(rate(container_cpu_usage_seconds_total{container!="",pod!="",namespace="default"}[5m])) by(pod)

# ❹ 查询 Pod 内存使用
curl http://localhost:9090/api/v1/query?query=sum(container_memory_usage_bytes{container!="",pod!="",namespace="default"}) by(pod)
```

### 常用查询示例

```promql
# 节点 CPU 使用率（百分比）
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 节点内存使用率（百分比）
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Pod CPU 使用率
sum(rate(container_cpu_usage_seconds_total{container!="",pod!="",namespace="default"}[5m])) by(pod)

# Pod 内存使用
sum(container_memory_usage_bytes{container!="",pod!="",namespace="default"}) by(pod)

# Pod 网络接收速率
sum(rate(container_network_receive_bytes_total{pod!="",namespace="default"}[5m])) by(pod)

# Pod 网络发送速率
sum(rate(container_network_transmit_bytes_total{pod!="",namespace="default"}[5m])) by(pod)

# Pod 重启次数
sum(kube_pod_container_status_restarts_total{namespace="default"}) by(pod)

# 磁盘使用率
(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100
```

---

## 5 Grafana 仪表板

### 什么是 Grafana？

Grafana 是一个开源的可视化平台，用于展示监控数据。

打个比方：

> Prometheus 像体检中心，收集各种指标数据。
>
> Grafana 像监控屏幕，将数据可视化展示，让医生一目了然。

### 创建仪表板

1. 登录 Grafana（http://localhost:3000）
2. 点击左侧菜单 "Dashboards"
3. 点击 "New Dashboard"
4. 点击 "Add new panel"

### 配置数据源

```yaml
# Grafana 数据源配置
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus-kube-prometheus-prometheus:9090
    isDefault: true
```

### 常用面板配置

```yaml
# CPU 使用率面板
panel:
  title: "Pod CPU Usage"
  type: graph
  targets:
    - expr: sum(rate(container_cpu_usage_seconds_total{container!="",pod!="",namespace="default"}[5m])) by(pod)
      legendFormat: "{{pod}}"

# 内存使用面板
panel:
  title: "Pod Memory Usage"
  type: graph
  targets:
    - expr: sum(container_memory_usage_bytes{container!="",pod!="",namespace="default"}) by(pod)
      legendFormat: "{{pod}}"

# Pod 重启次数面板
panel:
  title: "Pod Restarts"
  type: stat
  targets:
    - expr: sum(kube_pod_container_status_restarts_total{namespace="default"}) by(pod)
      legendFormat: "{{pod}}"
```

### 导入预置仪表板

```bash
# ❶ 访问 Grafana
# http://localhost:3000

# ❷ 点击 "Dashboards" -> "Import"

# ❸ 输入仪表板 ID
# Kubernetes cluster monitoring: 315
# Kubernetes pods: 6417
# Node Exporter Full: 1860

# ❹ 点击 "Load"

# ❺ 选择数据源（Prometheus）

# ❻ 点击 "Import"
```

---

## 6 告警规则

### 创建告警规则

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: custom-alerts                   # 告警规则名称
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
  - name: pod-alerts
    rules:
    - alert: PodCrashLooping            # 告警名称
      expr: increase(kube_pod_container_status_restarts_total[1h]) > 5  # 条件
      for: 5m                           # 持续时间
      labels:
        severity: warning               # 严重级别
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
        description: "Pod {{ $labels.pod }} has restarted {{ $value }} times in the last hour"

    - alert: PodNotReady
      expr: kube_pod_status_phase{phase=~"Pending|Unknown"} == 1
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} is not ready"
        description: "Pod {{ $labels.pod }} has been in {{ $labels.phase }} state for more than 10 minutes"

  - name: node-alerts
    rules:
    - alert: HighCPUUsage
      expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage on {{ $labels.instance }}"
        description: "CPU usage is above 80% for more than 5 minutes"

    - alert: HighMemoryUsage
      expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 85
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage on {{ $labels.instance }}"
        description: "Memory usage is above 85% for more than 5 minutes"

    - alert: DiskSpaceLow
      expr: (1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 > 85
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Disk space is low on {{ $labels.instance }}"
        description: "Disk usage is above 85% on {{ $labels.mountpoint }}"
```

```bash
# ❶ 创建告警规则
kubectl apply -f prometheus-rules.yaml

# ❷ 查看告警规则
kubectl get prometheusrule -n monitoring
# 输出：
# NAME            AGE
# custom-alerts   5s

# ❸ 查看告警状态
kubectl port-forward -n monitoring svc/prometheus-alertmanager 9093:9093
# 访问 http://localhost:9093
```

### 告警通知配置

```yaml
# alertmanager-config.yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-prometheus
  namespace: monitoring
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
    route:
      group_by: ['alertname']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'email'
    receivers:
    - name: 'email'
      email_configs:
      - to: 'admin@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alertmanager@example.com'
        auth_password: 'password'
    - name: 'slack'
      slack_configs:
      - api_url: 'https://hooks.slack.com/services/xxx/yyy/zzz'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'
```

---

## 7 EFK 日志系统

### 什么是 EFK？

EFK 是 Kubernetes 的日志解决方案：
- **E**lasticsearch：存储和搜索日志
- **F**luentd（或 Fluent Bit）：收集日志
- **K**ibana：可视化日志

打个比方：

> Fluentd 像邮递员，收集每个节点的日志。
>
> Elasticsearch 像图书馆，存储所有日志，支持快速搜索。
>
> Kibana 像图书管理员，帮助你查找和分析日志。

### 安装 EFK

```bash
# ❶ 添加 Elastic 仓库
helm repo add elastic https://helm.elastic.co
helm repo update

# ❷ 安装 Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace \
  --set replicas=3 \
  --set minimumMasterNodes=2 \
  --set resources.requests.cpu=500m \
  --set resources.requests.memory=2Gi

# ❸ 安装 Kibana
helm install kibana elastic/kibana \
  --namespace logging \
  --set elasticsearchHosts=http://elasticsearch-master:9200

# ❹ 查看 Pod
kubectl get pods -n logging
# 输出：
# NAME                         READY   STATUS    RESTARTS   AGE
# elasticsearch-master-0       1/1     Running   0          30s
# elasticsearch-master-1       1/1     Running   0          30s
# elasticsearch-master-2       1/1     Running   0          30s
# kibana-abc12                 1/1     Running   0          30s
```

### 安装 Fluent Bit

```yaml
# fluent-bit-daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit                      # DaemonSet 名称
  namespace: logging
  labels:
    app: fluent-bit
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      serviceAccountName: fluent-bit
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:1.9
        resources:
          limits:
            memory: 100Mi
          requests:
            cpu: 50m
            memory: 50Mi
        volumeMounts:
        - name: varlog
          mountPath: /var/log
          readOnly: true
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: config
          mountPath: /fluent-bit/etc/
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      - name: config
        configMap:
          name: fluent-bit-config
---
# fluent-bit-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [INPUT]
        Name              tail
        Tag               kube.*
        Path              /var/lib/docker/containers/*/*.log
        Parser            docker
        DB                /var/log/flb_kube.db
        Mem_Buf_Limit     5MB
        Skip_Long_Lines   On
        Refresh_Interval  10

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off

    [OUTPUT]
        Name                es
        Match               *
        Host                elasticsearch-master
        Port                9200
        Logstash_Format     On
        Retry_Limit         False
        Replace_Dots        On
---
# fluent-bit-rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fluent-bit
  namespace: logging
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: fluent-bit
rules:
- apiGroups: [""]
  resources: ["pods", "namespaces"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: fluent-bit
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: fluent-bit
subjects:
- kind: ServiceAccount
  name: fluent-bit
  namespace: logging
```

```bash
# ❶ 创建 Fluent Bit
kubectl apply -f fluent-bit-daemonset.yaml

# ❷ 查看 DaemonSet
kubectl get daemonset -n logging
# 输出：
# NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   AGE
# fluent-bit   3         3         3       3            3           10s

# ❸ 查看 Pod
kubectl get pods -n logging
# 输出：
# NAME               READY   STATUS    RESTARTS   AGE
# fluent-bit-abc12   1/1     Running   0          10s
# fluent-bit-def34   1/1     Running   0          10s
# fluent-bit-ghi56   1/1     Running   0          10s
```

### 访问 Kibana

```bash
# ❶ 端口转发 Kibana
kubectl port-forward -n logging svc/kibana 5601:5601

# ❷ 在浏览器访问
# http://localhost:5601

# ❸ 创建索引模式
# Management -> Stack Management -> Index Patterns
# 输入：logstash-*
# 时间字段：@timestamp

# ❹ 查看日志
# Discover -> 选择索引模式 -> 查看日志
```

---

## 8 常见监控指标

### 节点级别指标

| 指标 | 说明 | PromQL 示例 |
|------|------|-------------|
| CPU 使用率 | 节点 CPU 使用百分比 | `100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` |
| 内存使用率 | 节点内存使用百分比 | `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100` |
| 磁盘使用率 | 磁盘空间使用百分比 | `(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100` |
| 网络接收速率 | 每秒接收字节数 | `rate(node_network_receive_bytes_total[5m])` |
| 网络发送速率 | 每秒发送字节数 | `rate(node_network_transmit_bytes_total[5m])` |

### Pod 级别指标

| 指标 | 说明 | PromQL 示例 |
|------|------|-------------|
| CPU 使用率 | Pod CPU 使用量 | `sum(rate(container_cpu_usage_seconds_total{container!="",pod!=""}[5m])) by(pod)` |
| 内存使用 | Pod 内存使用量 | `sum(container_memory_usage_bytes{container!="",pod!=""}) by(pod)` |
| 重启次数 | Pod 重启次数 | `sum(kube_pod_container_status_restarts_total) by(pod)` |
| 网络接收 | Pod 网络接收字节 | `sum(rate(container_network_receive_bytes_total{pod!=""}[5m])) by(pod)` |
| 网络发送 | Pod 网络发送字节 | `sum(rate(container_network_transmit_bytes_total{pod!=""}[5m])) by(pod)` |

### 应用级别指标

| 指标 | 说明 | 示例 |
|------|------|------|
| HTTP 请求数 | 每秒请求数 | `sum(rate(http_requests_total[5m])) by(method, status)` |
| 请求延迟 | 请求处理时间 | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` |
| 错误率 | 错误请求占比 | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` |
| 队列长度 | 任务队列长度 | `sum(queue_length) by(queue)` |

---

## 9 对比表格

| 特性 | Prometheus | ELK/EFK |
|------|------------|---------|
| 用途 | 指标监控 | 日志管理 |
| 数据类型 | 时序数据 | 文本日志 |
| 查询语言 | PromQL | Lucene/KQL |
| 可视化 | Grafana | Kibana |
| 告警 | Alertmanager | 无（需配合其他工具） |
| 存储 | 本地存储 | Elasticsearch |
| 适合场景 | 性能监控、告警 | 日志搜索、分析 |

| 日志收集方式 | 说明 | 优点 | 缺点 |
|-------------|------|------|------|
| DaemonSet | 每个节点运行一个收集器 | 简单、资源占用少 | 无法收集 sidecar 日志 |
| Sidecar | 每个 Pod 运行一个收集器 | 灵活、可自定义 | 资源占用多、管理复杂 |
| 节点代理 | 直接读取容器日志 | 性能好、简单 | 需要访问宿主机 |

---

## 10 新手常见误区

### 误区 1："Prometheus 会永久存储所有数据"

**错！** Prometheus 默认只保留 15 天的数据。可以通过 `--storage.tsdb.retention.time` 参数调整。长期存储需要使用 Thanos 或 Cortex。

```yaml
# 设置保留时间为 30 天
prometheus:
  prometheusSpec:
    retention: 30d
```

### 误区 2："日志收集会影响应用性能"

**不完全对！** 合理的日志收集不会影响性能。关键是：
- 设置资源限制（CPU、内存）
- 使用异步写入
- 过滤不必要的日志
- 使用 Fluent Bit 而不是 Fluentd（更轻量）

### 误区 3："告警越多越好"

**错！** 过多的告警会导致"告警疲劳"，真正重要的告警被忽略。应该：
- 只告警真正需要关注的问题
- 设置合理的阈值
- 分级告警（warning、critical）
- 定期审查和调整告警规则

### 误区 4："Grafana 面板越多越好"

**错！** 过多的面板会让仪表板变得混乱。应该：
- 按主题组织面板
- 使用变量过滤数据
- 只显示关键指标
- 提供上下文和说明

### 误区 5："日志只需要收集，不需要分析"

**错！** 收集日志只是第一步，更重要的是：
- 设置日志级别（DEBUG、INFO、WARN、ERROR）
- 结构化日志（JSON 格式）
- 添加上下文信息（trace ID、用户 ID）
- 定期分析和优化

---

## 11 动手练习

### 练习 1：安装 Prometheus 和 Grafana

使用 Helm 安装 Prometheus Stack，访问 Grafana 查看集群监控数据。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 添加仓库
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# ❷ 创建命名空间
kubectl create namespace monitoring

# ❸ 安装 Prometheus Stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin123

# ❹ 查看 Pod
kubectl get pods -n monitoring
# 输出：
# NAME                                                      READY   STATUS    RESTARTS   AGE
# prometheus-kube-prometheus-operator-abc12                 1/1     Running   0          30s
# prometheus-kube-prometheus-prometheus-def34               2/2     Running   0          30s
# prometheus-grafana-mno90                                  3/3     Running   0          30s

# ❺ 端口转发 Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# ❻ 在浏览器访问
# http://localhost:3000
# 用户名：admin
# 密码：admin123

# ❼ 导入仪表板
# Dashboards -> Import -> 输入 ID: 315 (Kubernetes cluster monitoring)
# 选择 Prometheus 数据源 -> Import

# ❽ 查看集群监控
# 可以看到节点 CPU、内存、磁盘、网络等指标

# ❾ 端口转发 Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# ❿ 在浏览器访问
# http://localhost:9090
# 可以执行 PromQL 查询

# ⓫ 卸载
helm uninstall prometheus -n monitoring
```

</details>

### 练习 2：创建自定义告警规则

创建告警规则，当 Pod 重启次数超过 5 次时发送告警。

<details>
<summary>点击查看答案</summary>

```yaml
# pod-restart-alert.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: pod-restart-alert
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
  - name: pod-alerts
    rules:
    - alert: PodCrashLooping
      expr: increase(kube_pod_container_status_restarts_total[1h]) > 5
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
        description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has restarted {{ $value }} times in the last hour"
```

```bash
# ❶ 创建告警规则
kubectl apply -f pod-restart-alert.yaml

# ❷ 查看告警规则
kubectl get prometheusrule -n monitoring
# 输出：
# NAME                AGE
# pod-restart-alert   5s

# ❸ 查看告警规则详情
kubectl describe prometheusrule pod-restart-alert -n monitoring
# 输出：
# Name:         pod-restart-alert
# Namespace:    monitoring
# Labels:       release=prometheus
# Rules:
#   PodCrashLooping
#     expr:     increase(kube_pod_container_status_restarts_total[1h]) > 5
#     for:      5m
#     labels:
#       severity: warning
#     annotations:
#       summary: Pod {{ $labels.pod }} is crash looping

# ❹ 查看 Prometheus 中的告警规则
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# 访问 http://localhost:9090/alerts

# ❺ 测试告警（创建一个频繁重启的 Pod）
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: crash-pod
spec:
  containers:
  - name: crash
    image: busybox
    command: ["sh", "-c", "exit 1"]
  restartPolicy: Always
EOF

# ❻ 等待 5 分钟后查看告警
kubectl get pods
# 输出：
# NAME        READY   STATUS             RESTARTS   AGE
# crash-pod   0/1     CrashLoopBackOff   5          5m

# ❼ 查看告警状态
# 在 Prometheus UI 中可以看到 PodCrashLooping 告警已触发

# ❽ 清理
kubectl delete pod crash-pod
kubectl delete prometheusrule pod-restart-alert -n monitoring
```

</details>

### 练习 3（挑战）：部署完整的 EFK 日志系统

部署 Elasticsearch、Fluent Bit 和 Kibana，收集并查看集群日志。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 添加 Elastic 仓库
helm repo add elastic https://helm.elastic.co
helm repo update

# ❷ 创建命名空间
kubectl create namespace logging

# ❸ 安装 Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --set replicas=2 \
  --set minimumMasterNodes=1 \
  --set resources.requests.cpu=500m \
  --set resources.requests.memory=2Gi

# ❹ 查看 Elasticsearch Pod
kubectl get pods -n logging -l app=elasticsearch
# 输出：
# NAME                     READY   STATUS    RESTARTS   AGE
# elasticsearch-master-0   1/1     Running   0          30s
# elasticsearch-master-1   1/1     Running   0          30s

# ❺ 安装 Kibana
helm install kibana elastic/kibana \
  --namespace logging \
  --set elasticsearchHosts=http://elasticsearch-master:9200

# ❻ 查看 Kibana Pod
kubectl get pods -n logging -l app=kibana
# 输出：
# NAME      READY   STATUS    RESTARTS   AGE
# kibana    1/1     Running   0          30s

# ❼ 端口转发 Kibana
kubectl port-forward -n logging svc/kibana 5601:5601

# ❽ 在浏览器访问
# http://localhost:5601

# ❾ 创建索引模式
# Management -> Stack Management -> Index Patterns
# 输入：logstash-*
# 时间字段：@timestamp

# ❿ 安装 Fluent Bit
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fluent-bit
  namespace: logging
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: fluent-bit
rules:
- apiGroups: [""]
  resources: ["pods", "namespaces"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: fluent-bit
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: fluent-bit
subjects:
- kind: ServiceAccount
  name: fluent-bit
  namespace: logging
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [INPUT]
        Name              tail
        Tag               kube.*
        Path              /var/log/containers/*.log
        Parser            docker
        DB                /var/log/flb_kube.db
        Mem_Buf_Limit     5MB
        Skip_Long_Lines   On
        Refresh_Interval  10
    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
    [OUTPUT]
        Name                es
        Match               *
        Host                elasticsearch-master
        Port                9200
        Logstash_Format     On
        Retry_Limit         False
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      serviceAccountName: fluent-bit
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:1.9
        resources:
          limits:
            memory: 100Mi
          requests:
            cpu: 50m
            memory: 50Mi
        volumeMounts:
        - name: varlog
          mountPath: /var/log
          readOnly: true
        - name: config
          mountPath: /fluent-bit/etc/
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: config
        configMap:
          name: fluent-bit-config
EOF

# ⓫ 查看 Fluent Bit DaemonSet
kubectl get daemonset -n logging
# 输出：
# NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   AGE
# fluent-bit   3         3         3       3            3           10s

# ⓬ 在 Kibana 中查看日志
# Discover -> 选择 logstash-* 索引 -> 查看日志

# ⓭ 搜索特定 Pod 的日志
# 在搜索框输入：kubernetes.pod_name: "my-pod"

# ⓮ 清理
helm uninstall elasticsearch -n logging
helm uninstall kibana -n logging
kubectl delete daemonset fluent-bit -n logging
kubectl delete namespace logging
```

</details>

---

## 下一章预告

下一章我们会学习 **生产环境实战**——如何在生产环境中部署和管理 Kubernetes 集群。你会学到高可用集群搭建、CI/CD 集成、安全加固、性能优化、备份策略等实战经验。学会这些，你就能将 Kubernetes 应用到实际生产环境中。
