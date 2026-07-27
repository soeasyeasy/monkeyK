---
title: "第11章：StatefulSet 有状态应用"
description: "有状态应用部署、稳定网络标识、持久化存储"
---

# 第11章：StatefulSet 有状态应用

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Deployment 和 StatefulSet 有什么区别？
- 为什么部署数据库不能用 Deployment？
- 什么是稳定的网络标识？为什么需要它？
- StatefulSet 的 Pod 命名规则是什么？
- 如何实现有序部署和扩缩容？
- VolumeClaimTemplates 是什么？怎么用？

这一章会教你如何使用 StatefulSet 部署有状态应用。学会这些，你就能在 Kubernetes 中运行数据库、消息队列等需要稳定标识和持久化存储的应用。

---

## 1 Deployment vs StatefulSet

### 痛点分析

Deployment 适合部署无状态应用（如 Web 服务器），每个 Pod 都是等价的，可以随意替换。但对于有状态应用（如数据库），Deployment 就不合适了：

1. **Pod 名称随机**：Deployment 创建的 Pod 名称是随机的（如 `mysql-5d8f7b6c4-abc12`），无法预测
2. **存储不固定**：每个 Pod 无法绑定固定的存储卷
3. **网络标识不稳定**：Pod 重启后名称和 IP 都会变化
4. **无序部署**：所有 Pod 同时启动，无法保证启动顺序

### 解决方案

StatefulSet 专门用于部署有状态应用，它提供：

- **稳定的网络标识**：Pod 名称固定，格式为 `<statefulset-name>-<ordinal>`
- **稳定的存储**：每个 Pod 可以绑定固定的 PVC
- **有序部署和扩缩容**：按顺序创建和删除 Pod
- **Headless Service**：为每个 Pod 提供独立的 DNS 记录

打个比方：

> Deployment 就像酒店的标准间，每个房间都一样，客人可以住任何房间。
>
> StatefulSet 就像酒店的套房，每个房间都有固定的编号（如 001、002、003），客人预订时会指定房间号，下次入住还是同一个房间。

### 对比表格

| 特性 | Deployment | StatefulSet |
|------|------------|-------------|
| Pod 名称 | 随机（如 `app-5d8f7b6c4-abc12`） | 固定（如 `app-0`、`app-1`） |
| 存储 | 所有 Pod 共享同一个 Volume | 每个 Pod 有独立的 PVC |
| 网络标识 | 不稳定，Pod 重启后变化 | 稳定，Pod 名称和 DNS 固定 |
| 部署顺序 | 无序，所有 Pod 同时启动 | 有序，按顺序创建和删除 |
| 扩缩容顺序 | 无序 | 有序（从最大序号开始删除） |
| 适用场景 | 无状态应用（Web、API） | 有状态应用（数据库、消息队列） |

---

## 2 StatefulSet 基础用法

### 基本结构

```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet                    # 资源类型
metadata:
  name: mysql                        # StatefulSet 名称
spec:
  serviceName: mysql-headless        # 关联的 Headless Service
  replicas: 3                        # 副本数
  selector:
    matchLabels:
      app: mysql                     # 标签选择器
  template:                          # Pod 模板
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql                  # 容器名称
        image: mysql:8.0             # 镜像
        ports:
        - containerPort: 3306        # 容器端口
        env:                         # 环境变量
        - name: MYSQL_ROOT_PASSWORD
          value: "rootpassword"
        volumeMounts:                # 挂载卷
        - name: mysql-data           # 卷名称
          mountPath: /var/lib/mysql  # MySQL 数据目录
  volumeClaimTemplates:              # PVC 模板
  - metadata:
      name: mysql-data               # PVC 名称前缀
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 1Gi               # 每个 Pod 请求 1GB 存储
```

### Headless Service

StatefulSet 必须配合 Headless Service 使用：

```yaml
# headless-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless               # Service 名称
spec:
  clusterIP: None                    # 关键：设置为 None（Headless）
  selector:
    app: mysql                       # 选择器
  ports:
  - port: 3306                       # 端口
    targetPort: 3306
```

```bash
# ❶ 先创建 Headless Service
kubectl apply -f headless-service.yaml

# ❷ 再创建 StatefulSet
kubectl apply -f statefulset.yaml

# ❸ 查看 StatefulSet
kubectl get statefulset
# 输出：
# NAME    READY   AGE
# mysql   3/3     30s

# ❹ 查看 Pod（注意命名规则）
kubectl get pods
# 输出：
# NAME      READY   STATUS    RESTARTS   AGE
# mysql-0   1/1     Running   0          30s
# mysql-1   1/1     Running   0          25s
# mysql-2   1/1     Running   0          20s

# ❺ 查看 PVC（每个 Pod 都有独立的 PVC）
kubectl get pvc
# 输出：
# NAME             STATUS   VOLUME          CAPACITY   ACCESS MODES   AGE
# mysql-data-0     Bound    pv-local-0      1Gi        RWO            30s
# mysql-data-1     Bound    pv-local-1      1Gi        RWO            25s
# mysql-data-2     Bound    pv-local-2      1Gi        RWO            20s
```

---

## 3 Pod 命名规则

StatefulSet 的 Pod 命名遵循固定规则：

```
<statefulset-name>-<ordinal>
```

- `<statefulset-name>`：StatefulSet 的名称
- `<ordinal>`：序号，从 0 开始递增

### 示例

```bash
# StatefulSet 名称为 mysql，副本数为 3
# Pod 名称为：
mysql-0                          # 第一个 Pod
mysql-1                          # 第二个 Pod
mysql-2                          # 第三个 Pod
```

### DNS 记录

每个 Pod 都有独立的 DNS 记录：

```bash
# Pod DNS 格式
<pod-name>.<headless-service-name>.<namespace>.svc.cluster.local

# 示例
mysql-0.mysql-headless.default.svc.cluster.local
mysql-1.mysql-headless.default.svc.cluster.local
mysql-2.mysql-headless.default.svc.cluster.local

# 简写（同命名空间内）
mysql-0.mysql-headless
mysql-1.mysql-headless
mysql-2.mysql-headless
```

```bash
# 在 Pod 内测试 DNS
kubectl exec mysql-0 -- nslookup mysql-1.mysql-headless
# 输出：
# Name:      mysql-1.mysql-headless.default.svc.cluster.local
# Address: 10.244.1.6
```

---

## 4 有序部署和扩缩容

### 有序部署

StatefulSet 按顺序创建 Pod：

```bash
# 创建 StatefulSet（replicas: 3）
kubectl apply -f statefulset.yaml

# 观察 Pod 创建顺序
kubectl get pods -w
# 输出：
# NAME      READY   STATUS    RESTARTS   AGE
# mysql-0   0/1     Pending   0          0s
# mysql-0   1/1     Running   0          5s    # mysql-0 就绪后
# mysql-1   0/1     Pending   0          0s    # 才开始创建 mysql-1
# mysql-1   1/1     Running   0          5s    # mysql-1 就绪后
# mysql-2   0/1     Pending   0          0s    # 才开始创建 mysql-2
# mysql-2   1/1     Running   0          5s
```

### 有序扩缩容

```bash
# 扩容到 5 个副本
kubectl scale statefulset mysql --replicas=5

# 观察扩容顺序
kubectl get pods -w
# 输出：
# mysql-3   0/1     Pending   0          0s    # 先创建 mysql-3
# mysql-3   1/1     Running   0          5s
# mysql-4   0/1     Pending   0          0s    # 再创建 mysql-4
# mysql-4   1/1     Running   0          5s

# 缩容到 2 个副本
kubectl scale statefulset mysql --replicas=2

# 观察缩容顺序（从最大序号开始删除）
kubectl get pods -w
# 输出：
# mysql-4   1/1     Terminating   0          5m    # 先删除 mysql-4
# mysql-3   1/1     Terminating   0          5m    # 再删除 mysql-3
# mysql-2   1/1     Terminating   0          5m    # 最后删除 mysql-2
```

### 有序删除

删除 StatefulSet 时，Pod 按逆序删除：

```bash
# 删除 StatefulSet
kubectl delete statefulset mysql

# 观察删除顺序
kubectl get pods -w
# 输出：
# mysql-2   1/1     Terminating   0          10m   # 先删除 mysql-2
# mysql-1   1/1     Terminating   0          10m   # 再删除 mysql-1
# mysql-0   1/1     Terminating   0          10m   # 最后删除 mysql-0
```

---

## 5 VolumeClaimTemplates

VolumeClaimTemplates 是 StatefulSet 的核心特性，它为每个 Pod 自动创建独立的 PVC。

### 工作原理

```yaml
volumeClaimTemplates:              # PVC 模板
- metadata:
    name: mysql-data               # PVC 名称前缀
  spec:
    accessModes: ["ReadWriteOnce"]
    resources:
      requests:
        storage: 1Gi
```

Kubernetes 会自动创建：

```
mysql-data-mysql-0                 # mysql-0 的 PVC
mysql-data-mysql-1                 # mysql-1 的 PVC
mysql-data-mysql-2                 # mysql-2 的 PVC
```

### 存储绑定

每个 Pod 绑定固定的 PVC：

```
mysql-0 → mysql-data-mysql-0
mysql-1 → mysql-data-mysql-1
mysql-2 → mysql-data-mysql-2
```

即使 Pod 重启或迁移，也会绑定同一个 PVC。

```bash
# 查看 Pod 和 PVC 的绑定关系
kubectl describe pod mysql-0 | grep -A 5 "Volumes:"
# 输出：
# Volumes:
#   mysql-data:
#     Type:       PersistentVolumeClaim
#     ClaimName:  mysql-data-mysql-0    # 固定的 PVC

kubectl describe pod mysql-1 | grep -A 5 "Volumes:"
# 输出：
# Volumes:
#   mysql-data:
#     Type:       PersistentVolumeClaim
#     ClaimName:  mysql-data-mysql-1    # 固定的 PVC
```

---

## 6 更新策略

StatefulSet 支持两种更新策略：

### RollingUpdate（默认）

按顺序滚动更新 Pod：

```yaml
spec:
  updateStrategy:
    type: RollingUpdate              # 滚动更新
    rollingUpdate:
      partition: 0                   # 分区点（可选）
```

```bash
# 更新 StatefulSet（修改镜像版本）
kubectl set image statefulset/mysql mysql=mysql:8.0.32

# 观察更新顺序
kubectl get pods -w
# 输出：
# mysql-2   1/1     Terminating   0          10m   # 先更新 mysql-2
# mysql-2   0/1     Pending       0          0s
# mysql-2   1/1     Running       0          5s
# mysql-1   1/1     Terminating   0          10m   # 再更新 mysql-1
# mysql-1   0/1     Pending       0          0s
# mysql-1   1/1     Running       0          5s
# mysql-0   1/1     Terminating   0          10m   # 最后更新 mysql-0
# mysql-0   0/1     Pending       0          0s
# mysql-0   1/1     Running       0          5s
```

### OnDelete

手动控制更新：

```yaml
spec:
  updateStrategy:
    type: OnDelete                   # 手动更新
```

```bash
# 更新 StatefulSet 定义
kubectl set image statefulset/mysql mysql=mysql:8.0.32

# Pod 不会自动更新，需要手动删除 Pod
kubectl delete pod mysql-0           # 删除后重建，使用新镜像
kubectl delete pod mysql-1
kubectl delete pod mysql-2
```

### Partition 分区更新

使用 partition 可以实现金丝雀发布：

```yaml
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 2                   # 只更新序号 >= 2 的 Pod
```

```bash
# StatefulSet 有 3 个副本（mysql-0, mysql-1, mysql-2）
# partition: 2 表示只更新 mysql-2

kubectl set image statefulset/mysql mysql=mysql:8.0.32

# 观察：只有 mysql-2 被更新
kubectl get pods
# 输出：
# NAME      READY   STATUS    RESTARTS   AGE
# mysql-0   1/1     Running   0          10m   # 未更新
# mysql-1   1/1     Running   0          10m   # 未更新
# mysql-2   1/1     Running   0          5s    # 已更新

# 验证通过后，将 partition 改为 0，更新所有 Pod
kubectl patch statefulset mysql -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":0}}}}'
```

---

## 7 常见使用场景

### 场景 1：MySQL 主从复制

```yaml
# mysql-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
        - name: config
          mountPath: /etc/mysql/conf.d
      volumes:
      - name: config
        configMap:
          name: mysql-config
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

### 场景 2：Redis 集群

```yaml
# redis-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
spec:
  serviceName: redis-headless
  replicas: 6                        # Redis 集群至少 6 个节点（3 主 3 从）
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7.0
        ports:
        - containerPort: 6379
        command: ["redis-server"]
        args:
        - "--cluster-enabled"
        - "yes"
        - "--cluster-config-file"
        - "/data/nodes.conf"
        volumeMounts:
        - name: redis-data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 5Gi
```

### 场景 3：Kafka 消息队列

```yaml
# kafka-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  serviceName: kafka-headless
  replicas: 3
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      containers:
      - name: kafka
        image: confluentinc/cp-kafka:7.3.0
        ports:
        - containerPort: 9092
        env:
        - name: KAFKA_BROKER_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name    # 使用 Pod 名称作为 Broker ID
        volumeMounts:
        - name: kafka-data
          mountPath: /var/lib/kafka/data
  volumeClaimTemplates:
  - metadata:
      name: kafka-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
```

---

## 8 对比表格

| 特性 | Deployment | StatefulSet |
|------|------------|-------------|
| Pod 名称 | 随机 | 固定（`<name>-<ordinal>`） |
| 存储 | 共享 Volume | 独立 PVC（VolumeClaimTemplates） |
| 网络标识 | 不稳定 | 稳定（Headless Service） |
| 部署顺序 | 无序 | 有序（0 → 1 → 2） |
| 缩容顺序 | 无序 | 有序（2 → 1 → 0） |
| 更新策略 | RollingUpdate, Recreate | RollingUpdate, OnDelete |
| 适用场景 | 无状态应用 | 有状态应用 |

---

## 9 新手常见误区

### 误区 1："StatefulSet 比 Deployment 更强大，应该优先使用"

**错！** StatefulSet 和 Deployment 适用于不同场景。无状态应用（如 Web 服务器）应该用 Deployment，有状态应用（如数据库）才用 StatefulSet。StatefulSet 的管理复杂度更高，不要滥用。

### 误区 2："StatefulSet 的 Pod 可以随意删除"

**错！** StatefulSet 的 Pod 有固定的标识和存储，删除 Pod 会导致数据丢失（如果没有备份）。删除前应该确认数据已经备份或迁移。

### 误区 3："删除 StatefulSet 会自动删除 PVC"

**错！** 删除 StatefulSet 不会自动删除 PVC，需要手动清理。这是为了保护数据，防止误删。

```bash
# 删除 StatefulSet
kubectl delete statefulset mysql

# 手动删除 PVC
kubectl delete pvc mysql-data-mysql-0
kubectl delete pvc mysql-data-mysql-1
kubectl delete pvc mysql-data-mysql-2
```

### 误区 4："StatefulSet 不需要 Headless Service"

**错！** StatefulSet 必须配合 Headless Service 使用，否则 Pod 无法获得稳定的网络标识。Headless Service 的 `clusterIP: None` 是必须的。

### 误区 5："VolumeClaimTemplates 可以修改"

**错！** VolumeClaimTemplates 一旦创建就不能修改。如果需要调整存储大小，应该直接修改 PVC，或者创建新的 StatefulSet。

---

## 10 动手练习

### 练习 1：创建基础 StatefulSet

创建一个 StatefulSet，包含 3 个 MySQL Pod，使用 Headless Service 和 VolumeClaimTemplates。

<details>
<summary>点击查看答案</summary>

```yaml
# headless-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None                    # Headless Service
  selector:
    app: mysql
  ports:
  - port: 3306
```

```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless        # 关联 Headless Service
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "rootpassword"
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 1Gi
```

```bash
# ❶ 创建 Headless Service
kubectl apply -f headless-service.yaml

# ❷ 创建 StatefulSet
kubectl apply -f statefulset.yaml

# ❸ 查看 Pod
kubectl get pods
# 输出：
# NAME      READY   STATUS    RESTARTS   AGE
# mysql-0   1/1     Running   0          30s
# mysql-1   1/1     Running   0          25s
# mysql-2   1/1     Running   0          20s

# ❹ 查看 PVC
kubectl get pvc
# 输出：
# NAME             STATUS   VOLUME          CAPACITY   ACCESS MODES   AGE
# mysql-data-0     Bound    pv-xxx          1Gi        RWO            30s
# mysql-data-1     Bound    pv-yyy          1Gi        RWO            25s
# mysql-data-2     Bound    pv-zzz          1Gi        RWO            20s

# ❺ 测试 DNS
kubectl exec mysql-0 -- nslookup mysql-1.mysql-headless
# 输出：mysql-1.mysql-headless.default.svc.cluster.local
```

</details>

### 练习 2：有序扩缩容

对练习 1 创建的 StatefulSet 进行扩缩容，观察 Pod 的创建和删除顺序。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 扩容到 5 个副本
kubectl scale statefulset mysql --replicas=5

# ❷ 观察扩容顺序
kubectl get pods -w
# 输出：
# mysql-3   0/1     Pending   0          0s    # 先创建 mysql-3
# mysql-3   1/1     Running   0          5s
# mysql-4   0/1     Pending   0          0s    # 再创建 mysql-4
# mysql-4   1/1     Running   0          5s

# ❸ 验证数据
kubectl exec mysql-3 -- mysql -uroot -prootpassword -e "SELECT 1;"
kubectl exec mysql-4 -- mysql -uroot -prootpassword -e "SELECT 1;"

# ❹ 缩容到 2 个副本
kubectl scale statefulset mysql --replicas=2

# ❺ 观察缩容顺序（从最大序号开始删除）
kubectl get pods -w
# 输出：
# mysql-4   1/1     Terminating   0          5m    # 先删除 mysql-4
# mysql-3   1/1     Terminating   0          5m    # 再删除 mysql-3
# mysql-2   1/1     Terminating   0          5m    # 最后删除 mysql-2

# ❻ 验证剩余 Pod
kubectl get pods
# 输出：
# NAME      READY   STATUS    RESTARTS   AGE
# mysql-0   1/1     Running   0          10m
# mysql-1   1/1     Running   0          10m

# ❼ 注意：PVC 不会被自动删除
kubectl get pvc
# 输出：
# NAME             STATUS   VOLUME   CAPACITY   ACCESS MODES   AGE
# mysql-data-0     Bound    pv-xxx   1Gi        RWO            10m
# mysql-data-1     Bound    pv-yyy   1Gi        RWO            10m
# mysql-data-2     Bound    pv-zzz   1Gi        RWO            10m   # 仍然存在
# mysql-data-3     Bound    pv-aaa   1Gi        RWO            5m    # 仍然存在
# mysql-data-4     Bound    pv-bbb   1Gi        RWO            5m    # 仍然存在
```

</details>

### 练习 3（挑战）：使用 Partition 实现金丝雀发布

创建一个 StatefulSet，使用 Partition 策略实现金丝雀发布，只更新部分 Pod。

<details>
<summary>点击查看答案</summary>

```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: web-headless
  replicas: 5
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: nginx
        image: nginx:1.20             # 初始版本
        ports:
        - containerPort: 80
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 3                    # 只更新序号 >= 3 的 Pod
```

```bash
# ❶ 创建 StatefulSet
kubectl apply -f statefulset.yaml

# ❷ 查看 Pod
kubectl get pods
# 输出：
# NAME    READY   STATUS    RESTARTS   AGE
# web-0   1/1     Running   0          30s
# web-1   1/1     Running   0          25s
# web-2   1/1     Running   0          20s
# web-3   1/1     Running   0          15s
# web-4   1/1     Running   0          10s

# ❸ 更新镜像版本
kubectl set image statefulset/web nginx=nginx:1.22

# ❹ 观察：只有 web-3 和 web-4 被更新
kubectl get pods -w
# 输出：
# web-4   1/1     Terminating   0          10m   # 先更新 web-4
# web-4   0/1     Pending       0          0s
# web-4   1/1     Running       0          5s
# web-3   1/1     Terminating   0          10m   # 再更新 web-3
# web-3   0/1     Pending       0          0s
# web-3   1/1     Running       0          5s
# web-2   1/1     Running       0          10m   # web-2 未更新
# web-1   1/1     Running       0          10m   # web-1 未更新
# web-0   1/1     Running       0          10m   # web-0 未更新

# ❺ 验证版本
kubectl exec web-4 -- nginx -v       # 输出：nginx version: nginx/1.22
kubectl exec web-3 -- nginx -v       # 输出：nginx version: nginx/1.22
kubectl exec web-2 -- nginx -v       # 输出：nginx version: nginx/1.20
kubectl exec web-1 -- nginx -v       # 输出：nginx version: nginx/1.20
kubectl exec web-0 -- nginx -v       # 输出：nginx version: nginx/1.20

# ❻ 验证通过后，更新所有 Pod
kubectl patch statefulset web -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":0}}}}'

# ❼ 观察：web-2, web-1, web-0 依次更新
kubectl get pods -w
# 输出：
# web-2   1/1     Terminating   0          10m
# web-2   0/1     Pending       0          0s
# web-2   1/1     Running       0          5s
# web-1   1/1     Terminating   0          10m
# web-1   0/1     Pending       0          0s
# web-1   1/1     Running       0          5s
# web-0   1/1     Terminating   0          10m
# web-0   0/1     Pending       0          0s
# web-0   1/1     Running       0          5s

# ❽ 验证所有 Pod 版本
kubectl exec web-0 -- nginx -v       # 输出：nginx version: nginx/1.22
kubectl exec web-1 -- nginx -v       # 输出：nginx version: nginx/1.22
kubectl exec web-2 -- nginx -v       # 输出：nginx version: nginx/1.22
kubectl exec web-3 -- nginx -v       # 输出：nginx version: nginx/1.22
kubectl exec web-4 -- nginx -v       # 输出：nginx version: nginx/1.22
```

</details>

---

## 下一章预告

下一章我们会学习 **DaemonSet 与 Job**——如何部署日志收集、监控代理等需要在每个节点运行的应用，以及如何运行批处理任务。你会学到 DaemonSet 的更新策略、Job