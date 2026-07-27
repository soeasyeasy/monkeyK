---
title: "第10章：Volume 存储卷"
description: "数据持久化、PV、PVC、StorageClass"
---

# 第10章：Volume 存储卷

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 容器删除后数据就丢失了，怎么保存数据？
- 多个 Pod 之间如何共享数据？
- 什么是 PV 和 PVC？它们有什么区别？
- StorageClass 是什么？动态供给是怎么工作的？
- 访问模式 RWO、ROX、RWX 是什么意思？

这一章会教你 Kubernetes 的存储管理机制。学会这些，你的数据就能在容器重启、Pod 重建后依然保留。

---

## 1 为什么需要 Volume？

### 痛点分析

容器有一个重要特性：**临时性**。容器的可写层是临时的，当容器被删除时，里面的数据也会丢失。

想象一下这个场景：

1. 你运行了一个 MySQL Pod，用户数据存储在容器内
2. 某天 Pod 崩溃了，Kubernetes 自动重建了一个新 Pod
3. 结果：所有数据都没了！

更糟糕的是：

- 多个 Pod 无法共享数据
- 容器重启后数据丢失
- 无法实现数据备份和迁移

### 解决方案

Kubernetes 提供了 **Volume（存储卷）** 机制，将数据存储从 Pod 中分离出来，实现：

- **数据持久化**：Pod 删除后数据依然保留
- **数据共享**：多个 Pod 可以访问同一份数据
- **灵活管理**：支持多种存储后端（本地、NFS、云存储等）

打个比方：

> 容器就像酒店房间，客人（进程）退房后，房间会被清空。
>
> Volume 就像酒店的保险箱，客人退房后，贵重物品还在保险箱里。
>
> PV（PersistentVolume）是保险箱本身，PVC（PersistentVolumeClaim）是你领取保险箱的凭证。

---

## 2 Volume 类型概览

Kubernetes 支持多种 Volume 类型，常用的有：

| 类型 | 说明 | 生命周期 | 使用场景 |
|------|------|----------|----------|
| emptyDir | 空目录，Pod 存在时数据保留 | Pod 级别 | 临时数据、缓存 |
| hostPath | 挂载宿主机目录 | 节点级别 | 日志收集、系统工具 |
| nfs | NFS 网络存储 | 独立 | 共享存储 |
| configMap | 挂载 ConfigMap | Pod 级别 | 配置文件 |
| secret | 挂载 Secret | Pod 级别 | 敏感信息 |
| persistentVolumeClaim | 持久化存储声明 | 独立 | 数据库、有状态应用 |

---

## 3 emptyDir

emptyDir 是最简单的 Volume 类型，它在 Pod 创建时自动创建，Pod 删除时自动删除。

### 基本用法

```yaml
# emptydir-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: emptydir-demo                  # Pod 名称
spec:
  containers:
  - name: writer                       # 写入容器
    image: busybox:latest              # 镜像
    command: ["sh", "-c", "while true; do echo $(date) >> /data/log.txt; sleep 5; done"]
    volumeMounts:                      # 挂载卷
    - name: data-volume                # 卷名称
      mountPath: /data                 # 挂载路径
  - name: reader                       # 读取容器
    image: busybox:latest              # 镜像
    command: ["sh", "-c", "tail -f /data/log.txt"]
    volumeMounts:
    - name: data-volume                # 同一个卷
      mountPath: /data
  volumes:                             # 定义卷
  - name: data-volume                  # 卷名称
    emptyDir: {}                       # 空目录（默认使用节点磁盘）
```

```bash
# ❶ 创建 Pod
kubectl apply -f emptydir-pod.yaml

# ❷ 查看 Pod 状态
kubectl get pod emptydir-demo

# ❸ 查看 reader 容器的日志
kubectl logs emptydir-demo -c reader
# 输出：每 5 秒写入一次时间戳
# Mon Jul 26 10:00:00 UTC 2026
# Mon Jul 26 10:00:05 UTC 2026
# ...
```

### emptyDir 的特性

| 特性 | 说明 |
|------|------|
| 生命周期 | 与 Pod 绑定，Pod 删除时数据丢失 |
| 共享性 | 同一 Pod 内的多个容器可以共享 |
| 性能 | 使用节点本地磁盘，性能较好 |
| 存储介质 | 默认使用节点磁盘，可配置为内存（tmpfs） |

### 使用内存作为 emptyDir

```yaml
volumes:
- name: data-volume
  emptyDir:
    medium: Memory                   # 使用内存（tmpfs）
    sizeLimit: 100Mi                 # 限制大小
```

**注意**：使用内存的 emptyDir 在 Pod 重启后数据会丢失，且占用容器内存限制。

---

## 4 hostPath

hostPath 将宿主机上的文件或目录挂载到 Pod 中。

### 基本用法

```yaml
# hostpath-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-demo                  # Pod 名称
spec:
  containers:
  - name: demo                         # 容器名称
    image: busybox:latest              # 镜像
    command: ["sh", "-c", "echo 'Hello from Pod' >> /host/data.txt && sleep 3600"]
    volumeMounts:
    - name: host-volume                # 卷名称
      mountPath: /host                 # 容器内挂载路径
  volumes:
  - name: host-volume
    hostPath:
      path: /data                      # 宿主机路径
      type: DirectoryOrCreate          # 目录不存在则创建
```

```bash
# ❶ 创建 Pod
kubectl apply -f hostpath-pod.yaml

# ❷ 查看 Pod 状态
kubectl get pod hostpath-demo

# ❸ 进入容器查看数据
kubectl exec hostpath-demo -- cat /host/data.txt
# 输出：Hello from Pod

# ❹ 在宿主机上查看（需要 SSH 到节点）
# cat /data/data.txt
# 输出：Hello from Pod
```

### hostPath 的类型

| 类型 | 说明 |
|------|------|
| DirectoryOrCreate | 目录不存在则创建 |
| Directory | 目录必须存在 |
| FileOrCreate | 文件不存在则创建 |
| File | 文件必须存在 |
| Socket | UNIX Socket 必须存在 |
| CharDevice | 字符设备必须存在 |
| BlockDevice | 块设备必须存在 |

### hostPath 的使用场景

```yaml
# 日志收集场景
volumes:
- name: varlog
  hostPath:
    path: /var/log                     # 挂载宿主机日志目录
    type: Directory

# 系统工具场景（如 Docker-in-Docker）
volumes:
- name: docker-sock
  hostPath:
    path: /var/run/docker.sock         # 挂载 Docker Socket
    type: Socket
```

**警告**：hostPath 有安全风险，Pod 可以访问宿主机文件系统。生产环境应谨慎使用，建议配合 Pod Security Standards 限制。

---

## 5 PersistentVolume 和 PersistentVolumeClaim

### 核心概念

PV 和 PVC 是 Kubernetes 中最常用的持久化存储方案：

- **PersistentVolume (PV)**：集群级别的存储资源，由管理员创建或动态供给
- **PersistentVolumeClaim (PVC)**：用户对存储的请求，类似 Pod 对计算资源的请求

打个比方：

> PV 就像银行的存款，PVC 就像取款请求。
>
> 你（PVC）去银行（Kubernetes）取钱（存储），银行会根据你的请求（PVC）匹配合适的存款（PV）。
>
> 取到钱后，你可以自由使用（挂载到 Pod）。

### 创建 PersistentVolume

```yaml
# pv.yaml
apiVersion: v1
kind: PersistentVolume               # 资源类型
metadata:
  name: pv-nfs-01                    # PV 名称
spec:
  capacity:                          # 容量
    storage: 10Gi                    # 10GB
  accessModes:                       # 访问模式
  - ReadWriteOnce                    # 单节点读写
  persistentVolumeReclaimPolicy: Retain  # 回收策略
  storageClassName: manual           # 存储类名称
  nfs:                               # NFS 存储
    server: 192.168.1.100            # NFS 服务器地址
    path: /data/pv01                 # NFS 路径
```

```bash
# ❶ 创建 PV
kubectl apply -f pv.yaml

# ❷ 查看 PV
kubectl get pv
# 输出：
# NAME        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      AGE
# pv-nfs-01   10Gi       RWO            Retain           Available   5s
```

### 创建 PersistentVolumeClaim

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim          # 资源类型
metadata:
  name: pvc-demo                     # PVC 名称
spec:
  accessModes:                       # 访问模式
  - ReadWriteOnce                    # 单节点读写
  resources:                         # 资源请求
    requests:                        # 请求
      storage: 5Gi                   # 请求 5GB
  storageClassName: manual           # 存储类名称（必须匹配 PV）
```

```bash
# ❶ 创建 PVC
kubectl apply -f pvc.yaml

# ❷ 查看 PVC
kubectl get pvc
# 输出：
# NAME      STATUS   VOLUME      CAPACITY   ACCESS MODES   STORAGECLASS   AGE
# pvc-demo  Bound    pv-nfs-01   10Gi       RWO            manual         3s

# ❸ 查看 PV 状态变化
kubectl get pv
# 输出：
# NAME        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   AGE
# pv-nfs-01   10Gi       RWO            Retain           Bound    10s
```

### 在 Pod 中使用 PVC

```yaml
# pod-with-pvc.yaml
apiVersion: v1
kind: Pod
metadata:
  name: pvc-demo-pod                 # Pod 名称
spec:
  containers:
  - name: demo                       # 容器名称
    image: nginx:latest              # 镜像
    volumeMounts:
    - name: storage                  # 卷名称
      mountPath: /data               # 挂载路径
  volumes:
  - name: storage                    # 卷名称
    persistentVolumeClaim:           # 使用 PVC
      claimName: pvc-demo            # PVC 名称
```

```bash
# ❶ 创建 Pod
kubectl apply -f pod-with-pvc.yaml

# ❷ 查看 Pod 状态
kubectl get pod pvc-demo-pod

# ❸ 进入容器写入数据
kubectl exec -it pvc-demo-pod -- bash
echo "Hello PVC" > /data/test.txt
exit

# ❹ 删除 Pod
kubectl delete pod pvc-demo-pod

# ❺ 重新创建 Pod
kubectl apply -f pod-with-pvc.yaml

# ❻ 验证数据还在
kubectl exec pvc-demo-pod -- cat /data/test.txt
# 输出：Hello PVC
```

---

## 6 访问模式

PV 和 PVC 都支持三种访问模式：

| 模式 | 缩写 | 说明 | 使用场景 |
|------|------|------|----------|
| ReadWriteOnce | RWO | 单节点读写 | 数据库、单实例应用 |
| ReadOnlyMany | ROX | 多节点只读 | 配置文件、静态资源 |
| ReadWriteMany | RWX | 多节点读写 | 共享存储、Web 服务器 |

### 访问模式示例

```yaml
# RWO - 单节点读写（最常见）
accessModes:
- ReadWriteOnce

# ROX - 多节点只读
accessModes:
- ReadOnlyMany

# RWX - 多节点读写
accessModes:
- ReadWriteMany
```

**注意**：不是所有存储后端都支持所有访问模式。例如：

- NFS 支持 RWO、ROX、RWX
- 云盘（如 AWS EBS）只支持 RWO
- Ceph RBD 支持 RWO、ROX

---

## 7 回收策略

当 PVC 被删除时，PV 的处理方式由回收策略决定：

| 策略 | 说明 | 使用场景 |
|------|------|----------|
| Retain | 保留数据，手动清理 | 重要数据，需要人工审核 |
| Delete | 自动删除 PV 和底层存储 | 动态供给，自动管理 |
| Recycle | 已废弃，不推荐使用 | - |

### 回收策略示例

```yaml
# Retain 策略
spec:
  persistentVolumeReclaimPolicy: Retain  # PVC 删除后，PV 变为 Released 状态

# Delete 策略
spec:
  persistentVolumeReclaimPolicy: Delete  # PVC 删除后，PV 和存储一起删除
```

### PV 的状态流转

```
Available → Bound → Released → (Retain) Available/Failed
                     ↓
                  (Delete) 删除
```

```bash
# 查看 PV 状态
kubectl get pv
# 输出：
# NAME        STATUS     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS
# pv-nfs-01   Bound      10Gi       RWO            Retain           Bound

# 删除 PVC 后
kubectl delete pvc pvc-demo
kubectl get pv
# 输出：
# NAME        STATUS     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS
# pv-nfs-01   Released   10Gi       RWO            Retain           Released

# 手动删除 PV
kubectl delete pv pv-nfs-01
```

---

## 8 StorageClass 与动态供给

### 什么是 StorageClass？

StorageClass 定义了"如何自动创建 PV"。当用户创建 PVC 时，Kubernetes 会根据 StorageClass 自动创建对应的 PV。

打个比方：

> 静态供给（手动创建 PV）就像手动买房：你需要先找好房子（创建 PV），然后才能入住（创建 PVC）。
>
> 动态供给（StorageClass）就像酒店：你只需要预订（创建 PVC），酒店会自动给你安排房间（自动创建 PV）。

### 创建 StorageClass

```yaml
# storageclass-nfs.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass                   # 资源类型
metadata:
  name: nfs-storage                  # StorageClass 名称
provisioner: nfs.csi.k8s.io          # 供给器（NFS CSI 驱动）
parameters:                          # 参数
  server: 192.168.1.100              # NFS 服务器
  share: /data                       # NFS 共享路径
reclaimPolicy: Delete                # 回收策略
volumeBindingMode: Immediate         # 绑定模式
allowVolumeExpansion: true           # 允许扩容
```

```bash
# ❶ 创建 StorageClass
kubectl apply -f storageclass-nfs.yaml

# ❷ 查看 StorageClass
kubectl get storageclass
# 输出：
# NAME           PROVISIONER        AGE
# nfs-storage    nfs.csi.k8s.io     5s
```

### 使用 StorageClass 创建 PVC

```yaml
# pvc-dynamic.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-dynamic                  # PVC 名称
spec:
  accessModes:
  - ReadWriteOnce                    # 访问模式
  resources:
    requests:
      storage: 5Gi                   # 请求 5GB
  storageClassName: nfs-storage      # 使用 StorageClass
```

```bash
# ❶ 创建 PVC
kubectl apply -f pvc-dynamic.yaml

# ❷ 查看 PVC
kubectl get pvc
# 输出：
# NAME          STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
# pvc-dynamic   Bound    pvc-12345678-1234-1234-1234-123456789012   5Gi        RWO            nfs-storage    3s

# ❸ 查看自动创建的 PV
kubectl get pv
# 输出：
# NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   AGE
# pvc-12345678-1234-1234-1234-123456789012   5Gi        RWO            Delete           Bound    5s
```

### 常见的 StorageClass 供给器

| 供给器 | 说明 | 使用场景 |
|--------|------|----------|
| nfs.csi.k8s.io | NFS CSI 驱动 | 本地 NFS 服务器 |
| ebs.csi.aws.com | AWS EBS CSI 驱动 | AWS 云环境 |
| pd.csi.storage.gke.io | GCE PD CSI 驱动 | GCP 云环境 |
| disk.csi.azure.com | Azure Disk CSI 驱动 | Azure 云环境 |
| rook-ceph.rbd | Rook Ceph RBD | 自建 Ceph 集群 |

---

## 9 云环境中的存储

### AWS EBS 示例

```yaml
# storageclass-aws.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-gp3                        # StorageClass 名称
provisioner: ebs.csi.aws.com           # AWS EBS CSI 驱动
parameters:
  type: gp3                            # EBS 卷类型
  fsType: ext4                         # 文件系统
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer  # 等待 Pod 调度后再绑定
allowVolumeExpansion: true
```

### 阿里云云盘示例

```yaml
# storageclass-aliyun.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: alicloud-disk-ssd              # StorageClass 名称
provisioner: diskplugin.csi.alibabacloud.com
parameters:
  type: cloud_ssd                      # SSD 云盘
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

---

## 10 对比表格

| 特性 | emptyDir | hostPath | PV/PVC | StorageClass |
|------|----------|----------|--------|--------------|
| 生命周期 | Pod 级别 | 节点级别 | 独立 | 独立 |
| 数据持久化 | Pod 删除后丢失 | 节点存在则保留 | 持久化 | 持久化 |
| 共享性 | 同 Pod 内共享 | 同节点共享 | 可跨节点共享 | 可跨节点共享 |
| 管理方式 | 自动 | 手动 | 手动/自动 | 自动 |
| 性能 | 高（本地） | 高（本地） | 取决于后端 | 取决于后端 |
| 使用场景 | 临时数据、缓存 | 日志收集、系统工具 | 数据库、有状态应用 | 云环境、大规模集群 |

---

## 11 新手常见误区

### 误区 1："emptyDir 可以持久化数据"

**错！** emptyDir 的生命周期与 Pod 绑定，Pod 删除后数据会丢失。如果需要持久化，应该使用 PV/PVC。

### 误区 2："hostPath 是安全的"

**错！** hostPath 让 Pod 可以访问宿主机文件系统，有安全风险。生产环境应谨慎使用，建议配合 Pod Security Standards 限制。

### 误区 3："PV 和 PVC 是一对一的"

**错！** 一个 PV 只能绑定一个 PVC，但一个 PVC 可以对应多个 PV（通过 StorageClass 动态供给）。另外，多个 Pod 可以同时使用同一个 PVC（取决于访问模式）。

### 误区 4："StorageClass 只能用于云环境"

**错！** StorageClass 可以用于任何存储后端，包括本地 NFS、Ceph、GlusterFS 等。只要安装了对应的 CSI 驱动，就可以使用 StorageClass。

### 误区 5："PVC 删除后，数据会自动保留"

**错！** 这取决于 PV 的回收策略。如果是 `Delete`，数据会被删除；如果是 `Retain`，数据会保留，但需要手动清理 PV。

---

## 12 动手练习

### 练习 1：使用 emptyDir 共享数据

创建一个 Pod，包含两个容器，使用 emptyDir 共享数据。一个容器写入数据，另一个容器读取数据。

<details>
<summary>点击查看答案</summary>

```yaml
# emptydir-share.yaml
apiVersion: v1
kind: Pod
metadata:
  name: emptydir-share               # Pod 名称
spec:
  containers:
  - name: writer                     # 写入容器
    image: busybox:latest            # 镜像
    command: ["sh", "-c", "while true; do echo $(date) >> /data/log.txt; sleep 5; done"]
    volumeMounts:
    - name: shared-data              # 卷名称
      mountPath: /data               # 挂载路径
  - name: reader                     # 读取容器
    image: busybox:latest            # 镜像
    command: ["sh", "-c", "tail -f /data/log.txt"]
    volumeMounts:
    - name: shared-data              # 同一个卷
      mountPath: /data
  volumes:
  - name: shared-data                # 卷名称
    emptyDir: {}                     # 空目录
```

```bash
# ❶ 创建 Pod
kubectl apply -f emptydir-share.yaml

# ❷ 查看 reader 容器的日志
kubectl logs emptydir-share -c reader
# 输出：每 5 秒显示一次时间戳

# ❸ 验证数据共享
kubectl exec emptydir-share -c writer -- cat /data/log.txt
kubectl exec emptydir-share -c reader -- cat /data/log.txt
# 两个容器看到的数据是一样的
```

</details>

### 练习 2：创建并使用 PVC

创建一个 PV 和 PVC，在 Pod 中使用 PVC 存储数据，验证数据持久化。

<details>
<summary>点击查看答案</summary>

```yaml
# pv.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-local                     # PV 名称
spec:
  capacity:
    storage: 1Gi                     # 容量
  accessModes:
  - ReadWriteOnce                    # 单节点读写
  persistentVolumeReclaimPolicy: Retain  # 保留数据
  storageClassName: manual           # 存储类
  hostPath:                          # 使用本地路径（测试用）
    path: /mnt/data                  # 宿主机路径
```

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-local                    # PVC 名称
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi                 # 请求 500MB
  storageClassName: manual
```

```yaml
# pod-with-pvc.yaml
apiVersion: v1
kind: Pod
metadata:
  name: pvc-pod                      # Pod 名称
spec:
  containers:
  - name: demo                       # 容器名称
    image: busybox:latest            # 镜像
    command: ["sh", "-c", "echo 'Hello PVC' > /data/test.txt && sleep 3600"]
    volumeMounts:
    - name: storage                  # 卷名称
      mountPath: /data               # 挂载路径
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: pvc-local           # PVC 名称
```

```bash
# ❶ 创建 PV 和 PVC
kubectl apply -f pv.yaml
kubectl apply -f pvc.yaml

# ❷ 查看状态
kubectl get pv,pvc
# PV 和 PVC 都应该是 Bound 状态

# ❸ 创建 Pod
kubectl apply -f pod-with-pvc.yaml

# ❹ 验证数据
kubectl exec pvc-pod -- cat /data/test.txt
# 输出：Hello PVC

# ❺ 删除 Pod
kubectl delete pod pvc-pod

# ❻ 重新创建 Pod
kubectl apply -f pod-with-pvc.yaml

# ❼ 验证数据还在
kubectl exec pvc-pod -- cat /data/test.txt
# 输出：Hello PVC（数据持久化成功）
```

</details>

### 练习 3（挑战）：使用 StorageClass 动态供给

创建一个 StorageClass 和 PVC，验证动态供给功能。

<details>
<summary>点击查看答案</summary>

```yaml
# storageclass.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage                # StorageClass 名称
provisioner: kubernetes.io/no-provisioner  # 无供给器（本地测试）
volumeBindingMode: WaitForFirstConsumer    # 等待 Pod 调度后绑定
```

```yaml
# pvc-dynamic.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-dynamic                  # PVC 名称
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi                   # 请求 1GB
  storageClassName: local-storage    # 使用 StorageClass
```

```yaml
# pv-template.yaml（需要手动创建匹配的 PV）
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-dynamic                   # PV 名称
spec:
  capacity:
    storage: 1Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage    # 匹配 StorageClass
  hostPath:
    path: /mnt/dynamic
```

```bash
# ❶ 创建 StorageClass
kubectl apply -f storageclass.yaml

# ❷ 创建 PVC（此时 PVC 会处于 Pending 状态）
kubectl apply -f pvc-dynamic.yaml
kubectl get pvc
# 输出：pvc-dynamic   Pending   ...   5s

# ❸ 创建匹配的 PV
kubectl apply -f pv-template.yaml

# ❹ 查看 PVC 状态（应该变为 Bound）
kubectl get pvc
# 输出：pvc-dynamic   Bound    pv-dynamic   1Gi   RWO   local-storage   10s

# ❺ 创建 Pod 使用 PVC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: dynamic-pod
spec:
  containers:
  - name: demo
    image: busybox:latest
    command: ["sh", "-c", "echo 'Dynamic!' > /data/test.txt && sleep 3600"]
    volumeMounts:
    - name: storage
      mountPath: /data
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: pvc-dynamic
EOF

# ❻ 验证数据
kubectl exec dynamic-pod -- cat /data/test.txt
# 输出：Dynamic!
```

</details>

---

## 下一章预告

下一章我们会学习 **StatefulSet 有状态应用**——如何部署数据库、消息队列等需要稳定网络标识和持久化存储的应用。你会学到 StatefulSet 和 Deployment 的区别，以及如何使用 VolumeClaimTemplates。
