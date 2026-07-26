---
title: '第三章：Pod 基础'
description: '深入理解 Pod 的 YAML 定义、多容器模式、生命周期、探针机制和资源管理'
---

# 第三章：Pod 基础

## 本章导读

上一章我们了解了 Kubernetes 的核心概念，这一章要深入到最小的调度单元——**Pod**。

本章你会学到：

- Pod 的 YAML 文件怎么写？每个字段是什么意思？
- 一个 Pod 里怎么放多个容器？有哪些模式？
- Pod 有哪些状态？生命周期是怎样的？
- 探针（Probe）是什么？liveness、readiness、startup 有什么区别？
- 怎么限制 Pod 的 CPU 和内存使用？

Pod 是 Kubernetes 的"原子"，所有上层资源（Deployment、Service 等）最终都是在管理 Pod。掌握 Pod，就掌握了 K8s 的根基。

---

## 3.1 为什么需要深入理解 Pod？

### Pod 不是容器的简单包装

很多人以为 Pod 就是"一个容器的壳"，但实际上 Pod 提供了容器运行所需的完整环境：

| 能力 | 说明 | 类比 |
| --- | --- | --- |
| 共享网络 | Pod 内的容器共享 IP 和端口空间 | 合租室友共用一个 WiFi |
| 共享存储 | Pod 内的容器可以挂载相同的存储卷 | 室友共用一个冰箱 |
| 生命周期管理 | Pod 定义了容器何时启动、何时停止、何时重启 | 房东规定租客的入住和退租规则 |
| 资源限制 | 为 Pod 内的容器分配 CPU 和内存 | 给每个房间分配水电额度 |

打个比方：容器就像"租客"，Pod 就像"公寓"。租客不能单独存在，必须住在公寓里。公寓提供水电网（网络、存储），还规定了入住规则（生命周期、资源限制）。

---

## 3.2 Pod 的 YAML 定义

### 完整的 Pod YAML 结构

```yaml
# Pod 的完整定义示例
apiVersion: v1                    # API 版本，Pod 属于核心 API 组，用 v1
kind: Pod                         # 资源类型，这里是 Pod
metadata:                         # 元数据区域
  name: my-app-pod                # Pod 的名称，在 Namespace 内唯一
  namespace: default              # 所属的命名空间，不写则默认 default
  labels:                         # 标签，用于分类和筛选
    app: my-app                   # 键值对标签
    version: v1                   # 版本标签
  annotations:                    # 注解，存储非标识性的元数据
    description: "这是一个示例 Pod"  # 注解内容
spec:                             # 规格定义区域
  containers:                     # 容器列表（至少一个）
  - name: my-container            # 容器名称
    image: nginx:1.25             # 使用的镜像及版本
    ports:                        # 容器暴露的端口列表
    - containerPort: 80           # 容器监听的端口
      protocol: TCP               # 协议类型，默认 TCP
    env:                          # 环境变量
    - name: APP_ENV               # 环境变量名
      value: "production"         # 环境变量值
    resources:                    # 资源限制
      requests:                   # 最低保障资源
        cpu: "100m"               # 0.1 个 CPU 核心
        memory: "128Mi"           # 128 MB 内存
      limits:                     # 最大可用资源
        cpu: "500m"               # 0.5 个 CPU 核心
        memory: "256Mi"           # 256 MB 内存
    volumeMounts:                 # 容器内的挂载点
    - name: data-volume           # 挂载的存储卷名称
      mountPath: /usr/share/data  # 容器内的挂载路径
  volumes:                        # Pod 级别的存储卷定义
  - name: data-volume             # 存储卷名称
    emptyDir: {}                  # 临时存储卷，Pod 删除后数据也删除
```

### 逐层解读

```
Pod YAML
├── apiVersion: v1              ← 告诉 K8s 用哪个版本的 API 来解析
├── kind: Pod                   ← 告诉 K8s 要创建什么类型的资源
├── metadata                    ← "信封上的信息"：名字、标签、注解
│   ├── name                    ← 资源名称
│   ├── labels                  ← 用于筛选和匹配的标签
│   └── annotations             ← 附加信息，不参与筛选
└── spec                        ← "信封里的内容"：具体要做什么
    └── containers              ← 容器列表
        └── container           ← 每个容器的配置
            ├── image           ← 用什么镜像
            ├── ports           ← 暴露哪些端口
            ├── env             ← 环境变量
            ├── resources       ← 资源限制
            └── volumeMounts    ← 存储挂载
```

---

## 3.3 多容器 Pod 模式

有时候一个 Pod 里需要多个容器协作。常见的模式有三种：

### 模式对比

| 模式 | 说明 | 适用场景 | 类比 |
| --- | --- | --- | --- |
| **Sidecar** | 辅助容器为主容器提供额外功能 | 日志收集、配置同步 | 外卖骑手（主）+ 导航 App（辅） |
| **Ambassador** | 代理容器为主容器转发请求 | 数据库代理、API 网关 | 翻译官帮你说外语 |
| **Adapter** | 适配容器统一主容器的输出格式 | 监控指标标准化 | 电源转换器把不同插头统一 |

### Sidecar 模式示例

```yaml
# Sidecar 模式：主容器运行 Web 应用，辅助容器收集日志
apiVersion: v1
kind: Pod
metadata:
  name: sidecar-pod               # Pod 名称
spec:
  containers:
  # 主容器：运行 Web 应用
  - name: web-app                 # 主容器名称
    image: nginx:1.25             # Nginx 镜像
    volumeMounts:
    - name: log-volume            # 挂载共享存储卷
      mountPath: /var/log/nginx   # Nginx 日志目录

  # 辅助容器（Sidecar）：收集并转发日志
  - name: log-collector           # Sidecar 容器名称
    image:busybox:latest          # 轻量级镜像
    command: ['sh', '-c', 'tail -f /var/log/nginx/access.log']  # 持续读取日志
    volumeMounts:
    - name: log-volume            # 挂载同一个存储卷
      mountPath: /var/log/nginx   # 相同的挂载路径，实现数据共享

  # 共享存储卷
  volumes:
  - name: log-volume              # 存储卷名称
    emptyDir: {}                  # 临时存储，Pod 存在期间数据保留
```

### Ambassador 模式示例

```yaml
# Ambassador 模式：主容器通过代理容器访问外部数据库
apiVersion: v1
kind: Pod
metadata:
  name: ambassador-pod            # Pod 名称
spec:
  containers:
  # 主容器：应用通过 localhost:3306 访问数据库
  - name: app                     # 主容器名称
    image: my-app:latest          # 应用镜像
    env:
    - name: DB_HOST               # 数据库地址配置
      value: "127.0.0.1"          # 指向本 Pod 的 localhost
    - name: DB_PORT               # 数据库端口
      value: "3306"               # 标准 MySQL 端口

  # 代理容器：负责连接真实的数据库
  - name: db-proxy                # Ambassador 容器名称
    image:mysql-proxy:latest      # 数据库代理镜像
    ports:
    - containerPort: 3306         # 监听 3306 端口
    env:
    - name: REAL_DB_HOST          # 真实数据库地址
      value: "mysql.production.svc.cluster.local"  # K8s 内部 DNS
```

### Adapter 模式示例

```yaml
# Adapter 模式：将不同格式的监控指标统一为标准格式
apiVersion: v1
kind: Pod
metadata:
  name: adapter-pod               # Pod 名称
spec:
  containers:
  # 主容器：输出自定义格式的指标
  - name: app                     # 主容器名称
    image: my-app:latest          # 应用镜像
    volumeMounts:
    - name: metrics-volume        # 挂载共享存储
      mountPath: /app/metrics     # 指标输出目录

  # 适配容器：将指标转换为 Prometheus 格式
  - name: metrics-adapter         # Adapter 容器名称
    image:metrics-adapter:latest  # 指标适配器镜像
    volumeMounts:
    - name: metrics-volume        # 挂载同一个存储卷
      mountPath: /app/metrics     # 读取主容器的原始指标
    ports:
    - containerPort: 9090         # 暴露标准化的指标端口
    command: ['sh', '-c', 'adapt-metrics --input /app/metrics --port 9090']

  volumes:
  - name: metrics-volume          # 共享存储卷
    emptyDir: {}                  # 临时存储
```

---

## 3.4 Pod 的生命周期

Pod 从创建到销毁，会经历不同的状态。就像人的生命周期：出生、成长、工作、退休。

### Pod 的 5 种状态

| 状态 | 含义 | 类比 |
| --- | --- | --- |
| **Pending** | Pod 已被接受，但容器还未运行（可能在拉镜像或调度） | 新员工入职中，还没到岗 |
| **Running** | Pod 已调度到节点，至少一个容器正在运行 | 员工已到岗，正在工作 |
| **Succeeded** | 所有容器都已成功退出（不会重新启动） | 项目完成，团队解散 |
| **Failed** | 至少一个容器异常退出 | 项目失败，被迫终止 |
| **Unknown** | 无法获取 Pod 状态（通常是与节点通信失败） | 联系不上员工，不知道状况 |

### 容器生命周期钩子

Kubernetes 提供了两个钩子，让你在容器的特定时刻执行操作：

```yaml
# 容器生命周期钩子示例
apiVersion: v1
kind: Pod
metadata:
  name: lifecycle-pod             # Pod 名称
spec:
  containers:
  - name: app                     # 容器名称
    image: nginx:1.25             # 镜像
    lifecycle:                    # 生命周期钩子
      postStart:                  # 容器创建后立即执行
        exec:                     # 执行命令
          command:                # 命令列表
          - "/bin/sh"             # 使用 shell
          - "-c"                  # 执行后面的字符串
          - "echo '容器启动了' > /tmp/started"  # 写入启动标记
      preStop:                    # 容器终止前执行
        exec:                     # 执行命令
          command:
          - "/bin/sh"
          - "-c"
          - "sleep 10 && echo '准备关闭'"  # 等待 10 秒再关闭（优雅停机）
```

| 钩子 | 触发时机 | 常见用途 |
| --- | --- | --- |
| postStart | 容器创建后 | 初始化配置、注册服务、发送通知 |
| preStop | 容器终止前 | 优雅关闭连接、保存状态、注销服务 |

---

## 3.5 探针机制

探针是 Kubernetes 检查容器健康状态的手段。就像医生给病人做体检，不同的检查项目对应不同的探针。

### 三种探针

| 探针 | 目的 | 失败后的动作 | 类比 |
| --- | --- | --- | --- |
| **livenessProbe** | 检查容器是否"活着" | 重启容器 | 心电图：心脏停了就电击复苏 |
| **readinessProbe** | 检查容器是否"准备好接收流量" | 从 Service 中移除 | 前台接待：没准备好就不接电话 |
| **startupProbe** | 检查容器是否"已完成启动" | 重启容器 | 开机自检：没启动完就不进入工作状态 |

### 探针的检查方式

| 方式 | 说明 | 适用场景 |
| --- | --- | --- |
| httpGet | 发送 HTTP GET 请求，状态码 2xx/3xx 表示成功 | Web 应用 |
| tcpSocket | 尝试 TCP 连接，端口可连接即成功 | 数据库、消息队列 |
| exec | 执行命令，退出码为 0 表示成功 | 自定义检查逻辑 |

### 完整的探针配置示例

```yaml
# 探针配置示例
apiVersion: v1
kind: Pod
metadata:
  name: probe-pod                   # Pod 名称
spec:
  containers:
  - name: web-app                   # 容器名称
    image: my-web-app:latest        # 镜像

    # 启动探针：确保应用完全启动后再进行其他检查
    startupProbe:                   # 启动探针
      httpGet:                      # 使用 HTTP 检查
        path: /healthz              # 健康检查路径
        port: 8080                  # 检查端口
      failureThreshold: 30          # 允许失败 30 次
      periodSeconds: 10             # 每 10 秒检查一次
      # 含义：最多等待 300 秒（5 分钟）完成启动

    # 存活探针：检查容器是否还在正常工作
    livenessProbe:                  # 存活探针
      httpGet:                      # 使用 HTTP 检查
        path: /healthz              # 健康检查路径
        port: 8080                  # 检查端口
      initialDelaySeconds: 0        # 启动探针成功后立即开始
      periodSeconds: 10             # 每 10 秒检查一次
      failureThreshold: 3           # 连续失败 3 次就重启容器
      timeoutSeconds: 5             # 单次检查超时时间 5 秒

    # 就绪探针：检查是否可以接收用户请求
    readinessProbe:                 # 就绪探针
      httpGet:                      # 使用 HTTP 检查
        path: /ready                # 就绪检查路径（可能检查数据库连接等）
        port: 8080                  # 检查端口
      initialDelaySeconds: 5        # 容器启动后 5 秒开始检查
      periodSeconds: 5              # 每 5 秒检查一次
      successThreshold: 1           # 成功 1 次就标记为就绪
      failureThreshold: 3           # 连续失败 3 次就标记为未就绪
```

### 探针的执行顺序

```
容器启动
  │
  ├── startupProbe 开始检查
  │     ├── 失败 → 继续重试（最多 failureThreshold 次）
  │     └── 成功 → 启动完成，激活其他探针
  │
  ├── livenessProbe 开始检查
  │     ├── 成功 → 容器继续运行
  │     └── 连续失败 → 重启容器
  │
  └── readinessProbe 开始检查
        ├── 成功 → Pod 加入 Service 的端点列表，开始接收流量
        └── 失败 → 从 Service 端点列表移除，不再接收流量
```

---

## 3.6 重启策略

Pod 的 `restartPolicy` 决定了容器退出后是否自动重启。

| 策略 | 行为 | 适用场景 |
| --- | --- | --- |
| **Always** | 任何情况下容器退出都重启（默认值） | 长期运行的服务（Web、API） |
| **OnFailure** | 只在容器异常退出时重启（退出码非 0） | 批处理任务 |
| **Never** | 容器退出后从不重启 | 一次性任务 |

```yaml
# 重启策略示例
apiVersion: v1
kind: Pod
metadata:
  name: restart-pod               # Pod 名称
spec:
  restartPolicy: OnFailure        # 只在失败时重启
  containers:
  - name: worker                  # 容器名称
    image: my-worker:latest       # 工作进程镜像
```

> **注意**：restartPolicy 是针对 Pod 内所有容器的，不能为每个容器单独设置。

---

## 3.7 资源请求与限制

### requests 和 limits 的区别

| 字段 | 含义 | 类比 |
| --- | --- | --- |
| **requests** | 容器需要的最少资源（调度依据） | 向公司申请的最低月薪 |
| **limits** | 容器最多能使用的资源上限 | 公司允许的最高消费额度 |

```yaml
# 资源配置示例
resources:
  requests:                   # 最低保障
    cpu: "250m"               # 0.25 个 CPU 核心（1000m = 1 核）
    memory: "256Mi"           # 256 MB 内存
  limits:                     # 最大上限
    cpu: "500m"               # 0.5 个 CPU 核心
    memory: "512Mi"           # 512 MB 内存
```

### CPU 和内存的单位

| 资源 | 单位 | 说明 |
| --- | --- | --- |
| CPU | `1` = 1 个核心 | `100m` = 0.1 核，`1000m` = 1 核 |
| 内存 | `Mi` = 兆字节 | `128Mi` = 128MB，`1Gi` = 1GB |

### 资源超限的后果

| 情况 | 后果 |
| --- | --- |
| CPU 超过 limits | 被限流（throttle），变慢但不会被杀 |
| 内存超过 limits | 容器被 OOM Kill（内存溢出杀死） |
| 超过 requests 但不超过 limits | 正常使用额外资源 |

---

## 3.8 静态 Pod

### 什么是静态 Pod？

静态 Pod 是由 **kubelet** 直接管理的 Pod，不经过 API Server。它的特点是：

- YAML 文件放在节点的特定目录下（通常是 `/etc/kubernetes/manifests/`）
- kubelet 自动监控该目录，发现 YAML 就创建 Pod
- 不能用 kubectl 删除（kubelet 会重新创建）

```
正常 Pod 的创建流程：
  用户 → kubectl → API Server → Scheduler → kubelet → 创建 Pod

静态 Pod 的创建流程：
  kubelet 直接扫描 manifest 目录 → 发现 YAML → 创建 Pod
```

静态 Pod 通常用于运行 Kubernetes 自身的控制面组件（如 API Server、etcd）。

---

## 3.9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Pod YAML 结构 | apiVersion + kind + metadata + spec |
| 多容器模式 | Sidecar（辅助）、Ambassador（代理）、Adapter（适配） |
| Pod 状态 | Pending、Running、Succeeded、Failed、Unknown |
| 生命周期钩子 | postStart（启动后）、preStop（终止前） |
| 三种探针 | liveness（存活）、readiness（就绪）、startup（启动） |
| 重启策略 | Always、OnFailure、Never |
| 资源管理 | requests（最低保障）、limits（最大上限） |
| 静态 Pod | kubelet 直接管理，不经过 API Server |

---

## 3.10 新手常见误区

### 误区 1："Pod 里多个容器用各自不同的 IP 通信"

❌ 错误理解：Pod 内每个容器有独立的 IP。

✅ 正确理解：Pod 内的所有容器共享同一个 IP 地址和端口空间。容器之间用 `localhost` 就能互相通信。比如主容器监听 8080 端口，Sidecar 容器监听 9090 端口，它们通过 `localhost:8080` 和 `localhost:9090` 互相访问。

### 误区 2："设置了 livenessProbe 就不需要 readinessProbe 了"

❌ 错误理解：存活探针能替代就绪探针。

✅ 正确理解：它们解决的是不同问题。livenessProbe 决定"要不要重启容器"，readinessProbe 决定"要不要给这个 Pod 分配流量"。一个 Web 应用可能活着（liveness 通过），但数据库连接还没建立（readiness 不通过），此时不应该接收用户请求。

### 误区 3："resources.limits 设得越大越好"

❌ 错误理解：给每个 Pod 分配大量资源以防万一。

✅ 正确理解：limits 设太大，节点上的资源会被浪费（其他 Pod 无法使用）。requests 设太大，可能导致 Pod 无法调度（没有节点满足需求）。应该根据实际使用情况合理设置，通常 limits 是 requests 的 2 倍左右。

### 误区 4："Pod 是持久的，IP 不会变"

❌ 错误理解：Pod 创建后 IP 固定不变。

✅ 正确理解：Pod 是"短暂"的（ephemeral）。当 Pod 被重新调度、节点故障、滚动更新时，新 Pod 会获得新的 IP。这就是为什么不能直接通过 Pod IP 通信，而要用 Service。

### 误区 5："startupProbe 可以省略"

❌ 错误理解：有了 livenessProbe 就不需要 startupProbe。

✅ 正确理解：如果应用启动很慢（比如 Java 应用需要 2 分钟启动），livenessProbe 可能在启动过程中误判为"不健康"而反复重启。startupProbe 专门解决这个问题——在启动完成之前，livenessProbe 和 readinessProbe 不会启动。

---

## 3.11 动手练习

### 练习 1：创建一个带资源限制的 Pod

编写一个 Pod YAML 文件，运行 Nginx 容器，设置 CPU 请求 100m、限制 200m，内存请求 128Mi、限制 256Mi。添加一个就绪探针，检查 `/` 路径的 80 端口。

<details>
<summary>点击查看答案</summary>

```yaml
# 带资源限制和就绪探针的 Pod
apiVersion: v1                    # API 版本
kind: Pod                         # 资源类型
metadata:
  name: nginx-resource-pod        # Pod 名称
  labels:
    app: nginx                    # 标签
spec:
  containers:
  - name: nginx                   # 容器名称
    image: nginx:1.25             # 镜像
    ports:
    - containerPort: 80           # 暴露端口
    resources:                    # 资源限制
      requests:                   # 最低保障
        cpu: "100m"               # 0.1 核 CPU
        memory: "128Mi"           # 128 MB 内存
      limits:                     # 最大上限
        cpu: "200m"               # 0.2 核 CPU
        memory: "256Mi"           # 256 MB 内存
    readinessProbe:               # 就绪探针
      httpGet:                    # HTTP 检查
        path: /                   # 检查根路径
        port: 80                  # 检查 80 端口
      initialDelaySeconds: 5      # 启动后 5 秒开始检查
      periodSeconds: 10           # 每 10 秒检查一次
```

```bash
# 创建 Pod
kubectl apply -f nginx-resource-pod.yaml

# 查看 Pod 状态
kubectl get pod nginx-resource-pod

# 查看 Pod 详细信息（包括探针配置）
kubectl describe pod nginx-resource-pod
```

</details>

### 练习 2：创建一个 Sidecar 模式的 Pod

创建一个 Pod，包含两个容器：主容器运行 Nginx，Sidecar 容器用一个循环命令每 5 秒向共享目录写入当前时间戳。验证两个容器能共享文件。

<details>
<summary>点击查看答案</summary>

```yaml
# Sidecar 模式的 Pod
apiVersion: v1                    # API 版本
kind: Pod                         # 资源类型
metadata:
  name: sidecar-demo              # Pod 名称
spec:
  containers:
  # 主容器：Nginx
  - name: nginx                   # 容器名称
    image: nginx:1.25             # 镜像
    volumeMounts:
    - name: shared-data           # 挂载共享存储卷
      mountPath: /usr/share/nginx/html  # Nginx 静态文件目录

  # Sidecar 容器：每 5 秒写入时间戳
  - name: timestamp-writer        # Sidecar 容器名称
    image: busybox:latest         # 轻量级镜像
    command: ['sh', '-c', 'while true; do date > /data/index.html; sleep 5; done']  # 循环写入
    volumeMounts:
    - name: shared-data           # 挂载同一个存储卷
      mountPath: /data            # 挂载路径

  # 共享存储卷
  volumes:
  - name: shared-data             # 存储卷名称
    emptyDir: {}                  # 临时存储
```

```bash
# 创建 Pod
kubectl apply -f sidecar-demo.yaml

# 进入主容器查看共享文件
kubectl exec -it sidecar-demo -c nginx -- cat /usr/share/nginx/html/index.html

# 进入 Sidecar 容器查看
kubectl exec -it sidecar-demo -c timestamp-writer -- cat /data/index.html
```

</details>

### 练习 3（挑战）：创建一个带完整探针配置的 Pod

创建一个 Pod，运行一个模拟慢启动的应用（用 busybox 模拟）。配置 startupProbe 等待启动完成，livenessProbe 检查存活，readinessProbe 检查就绪。观察探针的工作过程。

<details>
<summary>点击查看答案</summary>

```yaml
# 带完整探针的 Pod
apiVersion: v1                    # API 版本
kind: Pod                         # 资源类型
metadata:
  name: probe-demo                # Pod 名称
spec:
  containers:
  - name: app                     # 容器名称
    image: busybox:latest         # 镜像
    # 模拟慢启动：先创建标记文件需要 30 秒
    command: ['sh', '-c', 'sleep 30 && touch /tmp/ready && echo "started" && sleep 3600']
    startupProbe:                 # 启动探针
      exec:                       # 使用命令检查
        command:                  # 检查启动标记文件
        - cat
        - /tmp/ready
      failureThreshold: 30        # 最多失败 30 次
      periodSeconds: 2            # 每 2 秒检查一次（最多等 60 秒）
    livenessProbe:                # 存活探针
      exec:                       # 使用命令检查
        command:
        - ls                      # 检查根目录是否存在
      periodSeconds: 10           # 每 10 秒检查一次
    readinessProbe:               # 就绪探针
      exec:                       # 使用命令检查
        command:
        - test
        - -f                      # 检查文件是否存在
        - /tmp/ready
      periodSeconds: 5            # 每 5 秒检查一次
```

```bash
# 创建 Pod
kubectl apply -f probe-demo.yaml

# 持续观察 Pod 状态变化
kubectl get pod probe-demo -w

# 你会看到：
# 1. 最初 READY 为 0/1（readinessProbe 未通过）
# 2. 约 30 秒后 READY 变为 1/1（启动完成，就绪探针通过）
```

</details>

---

## 下一章预告

下一章我们会学习 Kubernetes 中非常重要的组织工具——**Label 与 Selector**。Label 就像是给资源贴上的"标签"，Selector 则是根据标签来筛选资源的"过滤器"。你会学到如何用标签管理资源、如何用选择器精确匹配目标。这是理解 Deployment、Service 如何找到目标 Pod 的关键。
