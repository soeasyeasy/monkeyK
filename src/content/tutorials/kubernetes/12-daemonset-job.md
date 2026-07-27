---
title: "第12章：DaemonSet 与 Job"
description: "节点级应用部署、批处理任务、定时任务"
---

# 第12章：DaemonSet 与 Job

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何让每个节点都运行一个日志收集 Pod？
- 什么是 DaemonSet？它和 Deployment 有什么区别？
- 如何运行一次性批处理任务？
- 如何运行定时任务（类似 cron）？
- Job 的并行度和重试机制怎么配置？

这一章会教你 DaemonSet、Job 和 CronJob 的使用方法。学会这些，你就能部署节点级服务（如日志收集、监控代理）和运行批处理任务。

---

## 1 为什么需要 DaemonSet？

### 痛点分析

想象一下这个场景：你有一个 10 个节点的 Kubernetes 集群，需要在每个节点上运行一个日志收集工具。

如果用 Deployment：

1. 你需要设置 `replicas: 10`
2. 如果新增一个节点，需要手动修改 replicas 为 11
3. 如果某个节点宕机，Pod 会在其他节点重建，导致某些节点有多个 Pod，某些节点没有

### 解决方案

DaemonSet 专门解决这个问题：**确保每个节点都运行一个 Pod 副本**。

打个比方：

> Deployment 就像快递公司的配送员，公司可以决定在哪些区域分配送员。
>
> DaemonSet 就像邮局的邮递员，每个片区（节点）都有一个固定的邮递员，负责收集该片区的所有邮件（日志）。

### DaemonSet 的典型使用场景

| 场景 | 说明 | 示例工具 |
|------|------|----------|
| 日志收集 | 收集每个节点的容器日志 | Fluentd, Filebeat, Fluent Bit |
| 监控代理 | 收集节点和容器指标 | Prometheus Node Exporter, Datadog Agent |
| 网络代理 | 提供网络功能 | Calico, Flannel, Cilium |
| 存储守护进程 | 提供存储功能 | Ceph, GlusterFS, Rook |
| 安全代理 | 安全监控和防护 | Falco, Aqua Security |

---

## 2 DaemonSet 基础用法

### 基本结构

```yaml
# daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet                    # 资源类型
metadata:
  name: fluentd                    # DaemonSet 名称
  labels:
    app: fluentd
spec:
  selector:
    matchLabels:
      app: fluentd                 # 标签选择器
  template:                        # Pod 模板
    metadata:
      labels:
        app: fluentd
    spec:
      tolerations:                 # 容忍度（允许在 master 节点运行）
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      containers:
      - name: fluentd              # 容器名称
        image: fluentd:v1.14       # 镜像
        resources:                 # 资源限制
          limits:
            memory: 200Mi
          requests:
            cpu: 100m
            memory: 200Mi
        volumeMounts:              # 挂载卷
        - name: varlog             # 卷名称
          mountPath: /var/log      # 挂载路径
          readOnly: true           # 只读
        - name: varlibdockercontainers  # 卷名称
          mountPath: /var/lib/docker/containers  # 挂载路径
          readOnly: true
      volumes:                     # 定义卷
      - name: varlog
        hostPath:                  # 宿主机路径
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

```bash
# ❶ 创建 DaemonSet
kubectl apply -f daemonset.yaml

# ❷ 查看 DaemonSet
kubectl get daemonset
# 输出：
# NAME      DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   AGE
# fluentd   3         3         3       3            3           10s

# ❸ 查看 Pod（每个节点一个）
kubectl get pods -o wide
# 输出：
# NAME            READY   STATUS    RESTARTS   AGE   IP           NODE
# fluentd-abc12   1/1     Running   0          10s   10.244.1.5   node1
# fluentd-def34   1/1     Running   0          10s   10.244.2.3   node2
# fluentd-ghi56   1/1     Running   0          10s   10.244.3.7   node3

# ❹ 查看 Pod 分布
kubectl get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName
# 输出：
# NAME            NODE
# fluentd-abc12   node1
# fluentd-def34   node2
# fluentd-ghi56   node3
```

### DaemonSet 的工作原理

1. **调度**：DaemonSet 控制器确保每个节点都有一个 Pod 副本
2. **自动扩展**：新节点加入集群时，自动创建 Pod
3. **自动清理**：节点移除时，自动删除对应的 Pod
4. **不处理驱逐**：如果 Pod 被驱逐，不会在其他节点重建（除非节点重新加入）

---

## 3 DaemonSet 更新策略

DaemonSet 支持两种更新策略：

### RollingUpdate（默认）

滚动更新，逐步替换旧 Pod：

```yaml
spec:
  updateStrategy:
    type: RollingUpdate              # 滚动更新
    rollingUpdate:
      maxUnavailable: 1              # 每次最多不可用的 Pod 数
      maxSurge: 0                    # 最多超出的 Pod 数（DaemonSet 通常为 0）
```

```bash
# ❶ 更新 DaemonSet（修改镜像版本）
kubectl set image daemonset/fluentd fluentd=fluentd:v1.15

# ❷ 观察更新过程
kubectl rollout status daemonset/fluentd
# 输出：
# Waiting for daemon set "fluentd" rollout to finish: 1 out of 3 new pods have been updated...
# Waiting for daemon set "fluentd" rollout to finish: 2 out of 3 new pods have been updated...
# daemon set "fluentd" successfully rolled out
```

### OnDelete

手动控制更新：

```yaml
spec:
  updateStrategy:
    type: OnDelete                   # 手动更新
```

```bash
# ❶ 更新 DaemonSet 定义
kubectl set image daemonset/fluentd fluentd=fluentd:v1.15

# ❷ Pod 不会自动更新，需要手动删除
kubectl delete pod fluentd-abc12     # 删除后重建，使用新镜像

# ❸ 查看 Pod
kubectl get pods
# 输出：
# NAME            READY   STATUS    RESTARTS   AGE
# fluentd-abc12   1/1     Running   0          5s    # 新 Pod
# fluentd-def34   1/1     Running   0          10m   # 旧 Pod
# fluentd-ghi56   1/1     Running   0          10m   # 旧 Pod
```

---

## 4 节点选择器

使用 nodeSelector 或 nodeAffinity 控制 DaemonSet 在特定节点运行：

### nodeSelector

```yaml
spec:
  template:
    spec:
      nodeSelector:                  # 节点选择器
        disktype: ssd                # 只运行在有 SSD 的节点
```

### nodeAffinity

```yaml
spec:
  template:
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node-role.kubernetes.io/worker  # 只运行在 worker 节点
                operator: Exists
```

---

## 5 Job 基础用法

### 什么是 Job？

Job 用于运行一次性任务，确保指定数量的 Pod 成功完成。

打个比方：

> Deployment 像餐厅的服务员，持续运行，随时为顾客服务。
>
> Job 像外卖配送员，完成一次配送任务后就下班了。

### 基本结构

```yaml
# job.yaml
apiVersion: batch/v1
kind: Job                            # 资源类型
metadata:
  name: pi-job                       # Job 名称
spec:
  completions: 1                     # 需要成功完成的 Pod 数
  parallelism: 1                     # 并行运行的 Pod 数
  backoffLimit: 3                    # 失败重试次数
  activeDeadlineSeconds: 600         # 超时时间（秒）
  template:                          # Pod 模板
    spec:
      containers:
      - name: pi                     # 容器名称
        image: perl:5.34             # 镜像
        command: ["perl", "-Mbignum=bpi", "-wle", "print bpi(2000)"]  # 计算 PI
      restartPolicy: Never           # 重启策略（Job 必须是 Never 或 OnFailure）
```

```bash
# ❶ 创建 Job
kubectl apply -f job.yaml

# ❷ 查看 Job
kubectl get job
# 输出：
# NAME      COMPLETIONS   DURATION   AGE
# pi-job    1/1           10s        15s

# ❸ 查看 Pod
kubectl get pods
# 输出：
# NAME            READY   STATUS      RESTARTS   AGE
# pi-job-abc12    0/1     Completed   0          15s

# ❹ 查看 Pod 日志
kubectl logs pi-job-abc12
# 输出：3.14159265358979323846...

# ❺ 查看 Job 详情
kubectl describe job pi-job
# 输出：
# Events:
#   Type    Reason            Age   From            Message
#   ----    ------            ----  ----            -------
#   Normal  SuccessfulCreate  15s   job-controller  Created pod: pi-job-abc12
#   Normal  Completed         10s   job-controller  Job completed
```

---

## 6 Job 的并行模式

### 串行执行（默认）

```yaml
spec:
  completions: 5                     # 总共需要完成 5 个 Pod
  parallelism: 1                     # 每次只运行 1 个
```

```bash
# 观察执行顺序
kubectl get pods -w
# 输出：
# job-abc12   0/1   Pending   0          0s
# job-abc12   1/1   Running   0          5s
# job-abc12   0/1   Completed 0          10s
# job-def34   0/1   Pending   0          0s    # 第一个完成后才开始第二个
# job-def34   1/1   Running   0          5s
# ...
```

### 并行执行

```yaml
spec:
  completions: 5                     # 总共需要完成 5 个 Pod
  parallelism: 3                     # 每次最多运行 3 个
```

```bash
# 观察并行执行
kubectl get pods -w
# 输出：
# job-abc12   0/1   Pending   0          0s
# job-def34   0/1   Pending   0          0s
# job-ghi56   0/1   Pending   0          0s    # 同时启动 3 个
# job-abc12   1/1   Running   0          5s
# job-def34   1/1   Running   0          5s
# job-ghi56   1/1   Running   0          5s
# job-abc12   0/1   Completed 0          10s
# job-jkl78   0/1   Pending   0          0s    # 有 Pod 完成后立即启动新的
# ...
```

### 工作队列模式

```yaml
spec:
  completions: 5                     # 总共需要 5 个 Pod 成功完成
  parallelism: 2                     # 并行运行 2 个
  completionMode: Indexed            # 索引模式（K8s 1.22+）
```

---

## 7 Job 的重试和超时

### backoffLimit

```yaml
spec:
  backoffLimit: 3                    # 最多重试 3 次
```

```bash
# 如果 Pod 失败，会自动重试
kubectl get pods
# 输出：
# job-abc12   0/1   Error     0          10s   # 第一次失败
# job-def34   0/1   Running   0          5s    # 第二次尝试
# job-ghi56   0/1   Pending   0          0s    # 等待第三次尝试
```

### activeDeadlineSeconds

```yaml
spec:
  activeDeadlineSeconds: 600         # 超时时间 600 秒（10 分钟）
```

```bash
# 如果 Job 超过 10 分钟未完成，会被自动终止
kubectl get job
# 输出：
# NAME      STATUS     AGE
# pi-job    DeadlineExceeded   10m
```

### TTL 自动清理

```yaml
spec:
  ttlSecondsAfterFinished: 3600      # 完成后 1 小时自动删除
```

```bash
# Job 完成后 1 小时会被自动清理
kubectl get job
# 1 小时后：
# No resources found
```

---

## 8 CronJob 定时任务

### 什么是 CronJob？

CronJob 用于运行定时任务，类似 Linux 的 cron。

### 基本结构

```yaml
# cronjob.yaml
apiVersion: batch/v1
kind: CronJob                        # 资源类型
metadata:
  name: backup-job                   # CronJob 名称
spec:
  schedule: "0 2 * * *"              # 每天凌晨 2 点执行
  concurrencyPolicy: Forbid          # 并发策略
  successfulJobsHistoryLimit: 3      # 保留最近 3 个成功的 Job
  failedJobsHistoryLimit: 1          # 保留最近 1 个失败的 Job
  jobTemplate:                       # Job 模板
    spec:
      template:
        spec:
          containers:
          - name: backup             # 容器名称
            image: busybox:latest    # 镜像
            command: ["sh", "-c", "echo 'Backing up data...' && sleep 10"]
          restartPolicy: OnFailure
```

### Cron 表达式语法

```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日 (1 - 31)
│ │ │ ┌───────────── 月 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6) (0 表示周日)
│ │ │ │ │
* * * * *
```

### 常用 Cron 表达式

| 表达式 | 说明 |
|--------|------|
| `* * * * *` | 每分钟 |
| `0 * * * *` | 每小时 |
| `0 0 * * *` | 每天午夜 |
| `0 2 * * *` | 每天凌晨 2 点 |
| `0 0 * * 0` | 每周日午夜 |
| `0 0 1 * *` | 每月 1 号午夜 |
| `*/5 * * * *` | 每 5 分钟 |
| `0 9-17 * * *` | 每天 9 点到 17 点每小时 |

```bash
# ❶ 创建 CronJob
kubectl apply -f cronjob.yaml

# ❷ 查看 CronJob
kubectl get cronjob
# 输出：
# NAME         SCHEDULE    SUSPEND   ACTIVE   LAST SCHEDULE   AGE
# backup-job   0 2 * * *   False     0        <none>          5s

# ❸ 手动触发（测试用）
kubectl create job --from=cronjob/backup-job backup-job-manual

# ❹ 查看 Job
kubectl get job
# 输出：
# NAME                  COMPLETIONS   DURATION   AGE
# backup-job-27654      1/1           10s        5m    # 定时触发的 Job
# backup-job-manual     1/1           10s        10s   # 手动触发的 Job

# ❺ 查看 CronJob 日志
kubectl logs job/backup-job-27654
# 输出：Backing up data...
```

### 并发策略

CronJob 支持三种并发策略：

| 策略 | 说明 |
|------|------|
| Allow | 允许并发执行（默认） |
| Forbid | 禁止并发，如果上一次还没完成，跳过本次 |
| Replace | 替换当前运行的 Job |

```yaml
spec:
  concurrencyPolicy: Forbid          # 禁止并发
```

```bash
# 假设 Job 需要 10 分钟完成，schedule 是每分钟执行
# Forbid 策略：上一次未完成时，跳过本次调度
kubectl get cronjob
# 输出：
# NAME         SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
# backup-job   * * * * *     False     1        30s             5m
# 如果 ACTIVE=1，说明上一次还在运行，本次会被跳过
```

---

## 9 对比表格

| 特性 | Deployment | DaemonSet | Job | CronJob |
|------|------------|-----------|-----|---------|
| 用途 | 无状态应用 | 节点级服务 | 一次性任务 | 定时任务 |
| Pod 数量 | 固定副本数 | 每节点一个 | 完成指定数量 | 定时创建 Job |
| 生命周期 | 持续运行 | 持续运行 | 完成后结束 | 定时触发 |
| 重启策略 | Always | Always | Never/OnFailure | Never/OnFailure |
| 更新策略 | RollingUpdate, Recreate | RollingUpdate, OnDelete | 不支持 | 不支持 |
| 适用场景 | Web、API | 日志、监控 | 批处理、数据迁移 | 备份、清理、报告 |

---

## 10 新手常见误区

### 误区 1："DaemonSet 的 Pod 可以随意删除"

**错！** 删除 DaemonSet 的 Pod 后，控制器会自动在其他节点重建。如果想永久删除，应该删除 DaemonSet 本身，或者使用 nodeSelector 排除某些节点。

### 误区 2："Job 失败后会自动重试无限次"

**错！** Job 的重试次数由 `backoffLimit` 控制，默认是 6 次。超过限制后，Job 会标记为失败，不会继续重试。

### 误区 3："CronJob 的 schedule 和 Linux cron 完全一样"

**不完全对！** Kubernetes 的 CronJob 使用标准的 cron 表达式，但有一些限制：
- 不支持秒级精度（最小是分钟）
- 不支持 `@reboot` 等特殊字符串
- 时区默认是 UTC，需要手动配置

### 误区 4："Job 的 Pod 失败后会立即重启"

**错！** Job 的 Pod 失败后，会创建一个新的 Pod，而不是重启原来的 Pod。这是为了避免状态污染。

### 误区 5："DaemonSet 可以在 master 节点运行"

**默认不行！** master 节点有污点（Taint），DaemonSet 需要添加容忍度（Toleration）才能在 master 节点运行：

```yaml
spec:
  template:
    spec:
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
```

---

## 11 动手练习

### 练习 1：创建 DaemonSet 部署日志收集

创建一个 DaemonSet，在每个节点上运行 Fluent Bit 日志收集工具。

<details>
<summary>点击查看答案</summary>

```yaml
# daemonset-fluentbit.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit                   # DaemonSet 名称
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
      tolerations:                   # 容忍 master 节点污点
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      containers:
      - name: fluent-bit             # 容器名称
        image: fluent/fluent-bit:1.9 # 镜像
        resources:
          limits:
            memory: 100Mi            # 内存限制
          requests:
            cpu: 50m                 # CPU 请求
            memory: 50Mi             # 内存请求
        volumeMounts:
        - name: varlog               # 卷名称
          mountPath: /var/log        # 挂载路径
          readOnly: true             # 只读
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

```bash
# ❶ 创建 DaemonSet
kubectl apply -f daemonset-fluentbit.yaml

# ❷ 查看 DaemonSet
kubectl get daemonset fluent-bit
# 输出：
# NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   AGE
# fluent-bit   3         3         3       3            3           10s

# ❸ 查看 Pod 分布
kubectl get pods -o wide
# 输出：
# NAME               READY   STATUS    RESTARTS   AGE   IP           NODE
# fluent-bit-abc12   1/1     Running   0          10s   10.244.1.5   node1
# fluent-bit-def34   1/1     Running   0          10s   10.244.2.3   node2
# fluent-bit-ghi56   1/1     Running   0          10s   10.244.3.7   node3

# ❹ 查看日志
kubectl logs fluent-bit-abc12
# 输出：Fluent Bit 启动日志...
```

</details>

### 练习 2：创建 Job 执行批处理任务

创建一个 Job，计算 10000 的阶乘，验证任务完成。

<details>
<summary>点击查看答案</summary>

```yaml
# job-factorial.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: factorial-job                # Job 名称
spec:
  completions: 1                     # 完成 1 个 Pod
  parallelism: 1                     # 并行 1 个
  backoffLimit: 3                    # 最多重试 3 次
  activeDeadlineSeconds: 300         # 超时 5 分钟
  template:
    spec:
      containers:
      - name: factorial              # 容器名称
        image: python:3.9            # 镜像
        command: ["python", "-c"]    # 执行 Python 命令
        args:
        - |
          import math
          result = math.factorial(10000)
          print(f"Factorial of 10000 has {len(str(result))} digits")
          print(f"First 100 digits: {str(result)[:100]}")
      restartPolicy: Never           # 不重启
```

```bash
# ❶ 创建 Job
kubectl apply -f job-factorial.yaml

# ❷ 查看 Job
kubectl get job
# 输出：
# NAME            COMPLETIONS   DURATION   AGE
# factorial-job   1/1           15s        20s

# ❸ 查看 Pod 状态
kubectl get pods
# 输出：
# NAME                  READY   STATUS      RESTARTS   AGE
# factorial-job-abc12   0/1     Completed   0          20s

# ❹ 查看结果
kubectl logs factorial-job-abc12
# 输出：
# Factorial of 10000 has 35660 digits
# First 100 digits: 284625968091705451890641321211986889014805140170279923079417999427...

# ❺ 删除 Job（自动清理 Pod）
kubectl delete job factorial-job
```

</details>

### 练习 3（挑战）：创建 CronJob 定时备份

创建一个 CronJob，每 5 分钟执行一次备份任务，限制并发策略为 Forbid，保留最近 3 个成功的 Job。

<details>
<summary>点击查看答案</summary>

```yaml
# cronjob-backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: data-backup                  # CronJob 名称
spec:
  schedule: "*/5 * * * *"            # 每 5 分钟执行一次
  concurrencyPolicy: Forbid          # 禁止并发
  successfulJobsHistoryLimit: 3      # 保留 3 个成功的 Job
  failedJobsHistoryLimit: 1          # 保留 1 个失败的 Job
  jobTemplate:
    spec:
      backoffLimit: 2                # 最多重试 2 次
      ttlSecondsAfterFinished: 3600  # 完成后 1 小时自动删除
      template:
        spec:
          containers:
          - name: backup             # 容器名称
            image: busybox:latest    # 镜像
            command: ["sh", "-c"]
            args:
            - |
              echo "Starting backup at $(date)"
              echo "Backing up database..."
              sleep 10               # 模拟备份过程
              echo "Backup completed successfully"
              echo "Backup size: $(du -sh /var/lib/mysql | cut -f1)"
          restartPolicy: OnFailure
```

```bash
# ❶ 创建 CronJob
kubectl apply -f cronjob-backup.yaml

# ❷ 查看 CronJob
kubectl get cronjob
# 输出：
# NAME          SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
# data-backup   */5 * * * *   False     0        <none>          5s

# ❸ 等待 5 分钟后查看 Job
kubectl get job
# 输出：
# NAME                     COMPLETIONS   DURATION   AGE
# data-backup-27654300     1/1           10s        5m

# ❹ 查看 Job 日志
kubectl logs job/data-backup-27654300
# 输出：
# Starting backup at Mon Jul 26 10:00:00 UTC 2026
# Backing up database...
# Backup completed successfully
# Backup size: 1.2G

# ❺ 手动触发（测试用）
kubectl create job --from=cronjob/data-backup data-backup-manual

# ❻ 查看手动触发的 Job
kubectl get job
# 输出：
# NAME                     COMPLETIONS   DURATION   AGE
# data-backup-27654300     1/1           10s        10m
# data-backup-manual       1/1           10s        10s

# ❼ 暂停 CronJob（停止调度）
kubectl patch cronjob data-backup -p '{"spec":{"suspend":true}}'

# ❽ 恢复 CronJob
kubectl patch cronjob data-backup -p '{"spec":{"suspend":false}}'

# ❾ 删除 CronJob（自动清理相关 Job）
kubectl delete cronjob data-backup
```

</details>

---

## 下一章预告

下一章我们会学习 **RBAC 权限控制**——如何管理用户和服务对 Kubernetes 资源的访问权限。你会学到 ServiceAccount、Role、ClusterRole、RoleBinding、ClusterRoleBinding 等概念，以及如何实现细粒度的权限控制。
