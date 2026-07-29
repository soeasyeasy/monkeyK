---
title: '第11章：kubectl 高级控制器命令'
description: '掌握 StatefulSet、DaemonSet、Job、CronJob 操作，以及 HPA 自动伸缩命令'
---

# 第11章：kubectl 高级控制器命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何管理有状态应用？
- 如何在每个节点运行守护进程？
- 如何运行批处理任务？
- 如何配置定时任务？
- 如何实现自动伸缩？

这一章会系统讲解高级控制器相关的所有命令，让你能够熟练管理各种工作负载。

---

## 1 StatefulSet 管理命令

### 1.1 创建 StatefulSet

**从 YAML 文件创建**：

```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: my-statefulset
spec:
  serviceName: my-service
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
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 80
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 1Gi
```

```bash
kubectl apply -f statefulset.yaml
```

### 1.2 查看 StatefulSet

```bash
# 列出所有 StatefulSet
kubectl get statefulset

# 简写
kubectl get sts

# 显示更多信息
kubectl get sts -o wide

# 查看所有命名空间
kubectl get sts -A

# 查看详情
kubectl describe statefulset my-statefulset

# 输出 YAML
kubectl get statefulset my-statefulset -o yaml
```

### 1.3 管理 StatefulSet

```bash
# 扩缩容
kubectl scale statefulset my-statefulset --replicas=5

# 滚动更新
kubectl set image statefulset/my-statefulset app=myapp:1.1.0

# 查看更新状态
kubectl rollout status statefulset/my-statefulset

# 回滚
kubectl rollout undo statefulset/my-statefulset

# 删除
kubectl delete statefulset my-statefulset
```

---

## 2 DaemonSet 管理命令

### 2.1 创建 DaemonSet

```yaml
# daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: my-daemonset
spec:
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
```

```bash
kubectl apply -f daemonset.yaml
```

### 2.2 查看 DaemonSet

```bash
# 列出所有 DaemonSet
kubectl get daemonset

# 简写
kubectl get ds

# 显示更多信息
kubectl get ds -o wide

# 查看所有命名空间
kubectl get ds -A

# 查看详情
kubectl describe daemonset my-daemonset
```

### 2.3 管理 DaemonSet

```bash
# 更新镜像
kubectl set image daemonset/my-daemonset app=myapp:1.1.0

# 查看更新状态
kubectl rollout status daemonset/my-daemonset

# 回滚
kubectl rollout undo daemonset/my-daemonset

# 删除
kubectl delete daemonset my-daemonset
```

---

## 3 Job 管理命令

### 3.1 创建 Job

**从命令行创建**：

```bash
# 创建 Job
kubectl create job my-job --image=busybox -- sleep 60

# 指定命令
kubectl create job my-job --image=busybox -- /bin/sh -c "echo Hello"
```

**从 YAML 文件创建**：

```yaml
# job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: my-job
spec:
  completions: 3
  parallelism: 2
  template:
    spec:
      containers:
      - name: app
        image: busybox
        command: ["echo", "Hello"]
      restartPolicy: Never
```

```bash
kubectl apply -f job.yaml
```

### 3.2 查看 Job

```bash
# 列出所有 Job
kubectl get job

# 显示更多信息
kubectl get job -o wide

# 查看所有命名空间
kubectl get job -A

# 查看详情
kubectl describe job my-job

# 查看 Pod
kubectl get pods --selector=job-name=my-job
```

### 3.3 管理 Job

```bash
# 查看日志
kubectl logs job/my-job

# 删除 Job
kubectl delete job my-job
```

---

## 4 CronJob 管理命令

### 4.1 创建 CronJob

**从命令行创建**：

```bash
kubectl create cronjob my-cronjob --image=busybox --schedule="*/1 * * * *" -- /bin/sh -c "date"
```

**从 YAML 文件创建**：

```yaml
# cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: my-cronjob
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: app
            image: busybox
            command: ["echo", "Hello"]
          restartPolicy: OnFailure
```

```bash
kubectl apply -f cronjob.yaml
```

### 4.2 查看 CronJob

```bash
# 列出所有 CronJob
kubectl get cronjob

# 简写
kubectl get cj

# 显示更多信息
kubectl get cj -o wide

# 查看所有命名空间
kubectl get cj -A

# 查看详情
kubectl describe cronjob my-cronjob
```

### 4.3 管理 CronJob

```bash
# 暂停 CronJob
kubectl patch cronjob my-cronjob -p '{"spec":{"suspend":true}}'

# 恢复 CronJob
kubectl patch cronjob my-cronjob -p '{"spec":{"suspend":false}}'

# 手动触发 Job
kubectl create job --from=cronjob/my-cronjob my-job-manual

# 删除 CronJob
kubectl delete cronjob my-cronjob
```

---

## 5 HPA 自动伸缩命令

### 5.1 创建 HPA

**从命令行创建**：

```bash
# 创建 HPA（CPU 使用率 80%，最小 2，最大 10）
kubectl autoscale deployment my-deployment --cpu-percent=80 --min=2 --max=10

# 指定内存
kubectl autoscale deployment my-deployment --cpu-percent=80 --min=2 --max=10
```

**从 YAML 文件创建**：

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-deployment-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

```bash
kubectl apply -f hpa.yaml
```

### 5.2 查看 HPA

```bash
# 列出所有 HPA
kubectl get hpa

# 显示更多信息
kubectl get hpa -o wide

# 查看所有命名空间
kubectl get hpa -A

# 查看详情
kubectl describe hpa my-deployment-hpa
```

### 5.3 管理 HPA

```bash
# 更新 HPA
kubectl autoscale deployment my-deployment --cpu-percent=70 --min=3 --max=15

# 删除 HPA
kubectl delete hpa my-deployment-hpa
```

---

## 6 ReplicaSet 管理命令

### 6.1 查看 ReplicaSet

```bash
# 列出所有 ReplicaSet
kubectl get replicaset

# 简写
kubectl get rs

# 显示更多信息
kubectl get rs -o wide

# 查看所有命名空间
kubectl get rs -A
```

### 6.2 管理 ReplicaSet

```bash
# 扩缩容
kubectl scale replicaset my-replicaset --replicas=5

# 删除
kubectl delete replicaset my-replicaset
```

---

## 7 常用命令组合

### 7.1 StatefulSet 完整流程

```bash
# 1. 创建 Headless Service
kubectl apply -f service.yaml

# 2. 创建 StatefulSet
kubectl apply -f statefulset.yaml

# 3. 查看状态
kubectl get statefulset

# 4. 查看 Pod
kubectl get pods -l app=myapp

# 5. 扩缩容
kubectl scale statefulset my-statefulset --replicas=5

# 6. 删除
kubectl delete statefulset my-statefulset
kubectl delete service my-service
```

### 7.2 CronJob 完整流程

```bash
# 1. 创建 CronJob
kubectl apply -f cronjob.yaml

# 2. 查看状态
kubectl get cronjob

# 3. 查看 Job
kubectl get jobs --watch

# 4. 手动触发
kubectl create job --from=cronjob/my-cronjob my-job-manual

# 5. 查看日志
kubectl logs job/my-job-manual
```

---

## 8 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `kubectl get statefulset` | 列出 StatefulSet | `kubectl get sts` |
| `kubectl get daemonset` | 列出 DaemonSet | `kubectl get ds` |
| `kubectl get job` | 列出 Job | `kubectl get job` |
| `kubectl get cronjob` | 列出 CronJob | `kubectl get cj` |
| `kubectl get hpa` | 列出 HPA | `kubectl get hpa` |
| `kubectl autoscale` | 创建 HPA | `kubectl autoscale deploy --cpu-percent=80 --min=2 --max=10` |
| `kubectl create job` | 创建 Job | `kubectl create job my-job --image=busybox` |
| `kubectl create cronjob` | 创建 CronJob | `kubectl create cronjob my-cj --image=busybox --schedule="* * * * *"` |

---

## 9 本章小结

本章系统讲解了高级控制器相关命令，包括：

**StatefulSet**：

- 创建、查看、管理有状态应用
- 滚动更新和回滚

**DaemonSet**：

- 创建、查看守护进程
- 更新和回滚

**Job 和 CronJob**：

- 创建批处理任务
- 配置定时任务
- 手动触发和暂停

**HPA**：

- 创建自动伸缩规则
- 查看伸缩状态

掌握这些命令，你就能够熟练管理各种工作负载。下一章会讲解 RBAC 权限控制命令。

---

## 10 练习题

1. 创建 StatefulSet 并验证 Pod 名称
2. 创建 DaemonSet 并在每个节点运行
3. 创建 Job 并查看执行结果
4. 创建 CronJob 并手动触发
5. 创建 HPA 并测试自动伸缩
6. 查看各种控制器的状态和日志
