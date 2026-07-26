---
title: '第六章：Deployment 控制器'
description: '掌握 Deployment 的使用，包括滚动更新、回滚、扩缩容、暂停恢复等核心功能'
---

# 第六章：Deployment 控制器

## 本章导读

在前面几章中，我们已经多次提到 Deployment，但一直没有深入讲解。这一章要全面解析 Deployment 的方方面面。

本章你会学到：

- Deployment 的 YAML 结构是怎样的？每个字段什么意思？
- 滚动更新是怎么做到的？maxSurge 和 maxUnavailable 怎么配？
- 更新出问题了怎么回滚？怎么查看历史版本？
- 怎么手动扩容？HPA 自动扩容又是什么？
- 暂停和恢复 Deployment 有什么用？

打个比方：Deployment 就像一个"项目经理"，负责管理一群 Pod 员工。它不仅保证员工数量充足，还负责培训新员工（滚动更新）、处理不合格员工（回滚）、根据工作量增减人手（扩缩容）。

---

## 6.1 为什么需要 Deployment？

### 没有 Deployment 的痛点

假设你要部署一个 Web 应用，需要 3 个副本。

```bash
# 手动创建 3 个 Pod
kubectl run web-1 --image=nginx:1.24
kubectl run web-2 --image=nginx:1.24
kubectl run web-3 --image=nginx:1.24
```

问题来了：

| 问题 | 说明 |
| --- | --- |
| 一个 Pod 挂了 | 谁来重启？你需要手动监控并重启 |
| 要更新版本 | 你需要一个个删除旧 Pod，创建新 Pod，还要保证服务不中断 |
| 新版本有 Bug | 你需要手动回滚到旧版本，操作复杂且容易出错 |
| 流量突增 | 你需要手动创建更多 Pod，流量下降后再手动删除 |

### Deployment 的解决方案

Deployment 自动化了这一切：

| 功能 | 说明 | 类比 |
| --- | --- | --- |
| 副本管理 | 保证始终有指定数量的 Pod 运行 | 项目经理保证团队人数充足 |
| 滚动更新 | 逐步替换旧 Pod，不中断服务 | 新员工逐步替换老员工，边工作边交接 |
| 回滚 | 一键退回历史版本 | 发现新员工不合格，立即让老员工重新上岗 |
| 扩缩容 | 手动或自动调整副本数量 | 根据项目量增减人手 |
| 暂停/恢复 | 更新过程中暂停检查 | 项目进行中暂停开会讨论 |

---

## 6.2 Deployment YAML 详解

### 完整的 Deployment 结构

```yaml
# 完整的 Deployment 示例
apiVersion: apps/v1                     # API 版本（Deployment 属于 apps 组）
kind: Deployment                        # 资源类型
metadata:                               # 元数据
  name: web-deployment                  # Deployment 名称
  namespace: production                 # 所属 Namespace
  labels:                               # Deployment 自身的标签
    app: web                            # 应用标签
    version: v1.0                       # 版本标签
spec:                                   # 规格定义
  replicas: 3                           # 期望的副本数量
  revisionHistoryLimit: 10              # 保留的历史版本数量（用于回滚）
  progressDeadlineSeconds: 600          # 更新超时时间（秒）
  strategy:                             # 更新策略
    type: RollingUpdate                 # 滚动更新（另一种是 Recreate）
    rollingUpdate:                      # 滚动更新参数
      maxSurge: 1                       # 更新时最多多出的 Pod 数量
      maxUnavailable: 0                 # 更新时允许不可用的 Pod 数量
  selector:                             # 选择器：管理哪些 Pod
    matchLabels:                        # 基于标签匹配
      app: web                          # 匹配 app=web 的 Pod
  template:                             # Pod 模板
    metadata:                           # Pod 的元数据
      labels:                           # Pod 的标签
        app: web                        # 必须和 selector 匹配
        version: v1.0                   # 版本标签
    spec:                               # Pod 的规格
      containers:                       # 容器列表
      - name: web-container             # 容器名称
        image: nginx:1.24               # 镜像
        ports:                          # 端口
        - containerPort: 80             # 容器监听端口
        resources:                      # 资源限制
          requests:                     # 最低保障
            cpu: "100m"                 # 0.1 核 CPU
            memory: "128Mi"             # 128 MB 内存
          limits:                       # 最大上限
            cpu: "500m"                 # 0.5 核 CPU
            memory: "256Mi"             # 256 MB 内存
        livenessProbe:                  # 存活探针
          httpGet:                      # HTTP 检查
            path: /                     # 检查路径
            port: 80                    # 检查端口
          periodSeconds: 10             # 每 10 秒检查一次
        readinessProbe:                 # 就绪探针
          httpGet:
            path: /
            port: 80
          periodSeconds: 5              # 每 5 秒检查一次
```

### 关键字段解读

| 字段 | 说明 | 默认值 |
| --- | --- | --- |
| `replicas` | 期望的 Pod 副本数量 | 1 |
| `revisionHistoryLimit` | 保留的历史 ReplicaSet 数量 | 10 |
| `progressDeadlineSeconds` | 更新超时时间，超时视为失败 | 600 |
| `strategy.type` | 更新策略：RollingUpdate 或 Recreate | RollingUpdate |
| `maxSurge` | 更新时最多多出的 Pod 数 | 25% |
| `maxUnavailable` | 更新时允许不可用的 Pod 数 | 25% |

---

## 6.3 滚动更新（Rolling Update）

### 滚动更新的工作原理

滚动更新是 Deployment 的默认策略，它逐步用新版本的 Pod 替换旧版本的 Pod，保证服务不中断。

```
初始状态：3 个旧版本 Pod（v1）
┌──────┐ ┌──────┐ ┌──────┐
│ v1-1 │ │ v1-2 │ │ v1-3 │
└──────┘ └──────┘ └──────┘

第 1 步：创建 1 个新版本 Pod（v2），同时保留 3 个旧版本
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ v1-1 │ │ v1-2 │ │ v1-3 │ │ v2-1 │  ← 新增
└──────┘ └──────┘ └──────┘ └──────┘

第 2 步：v2-1 就绪后，删除 1 个旧版本 Pod
┌──────┐ ┌──────┐ ┌──────┐
│ v1-2 │ │ v1-3 │ │ v2-1 │  ← v1-1 已删除
└──────┘ └──────┘ └──────┘

第 3 步：继续创建新版本，删除旧版本
...

最终状态：3 个新版本 Pod（v2）
┌──────┐ ┌──────┐ ┌──────┐
│ v2-1 │ │ v2-2 │ │ v2-3 │
└──────┘ └──────┘ └──────┘
```

### maxSurge 和 maxUnavailable

| 参数 | 含义 | 示例（replicas=3） |
| --- | --- | --- |
| `maxSurge` | 更新时最多多出的 Pod 数量 | `maxSurge=1`：更新时最多 4 个 Pod |
| `maxUnavailable` | 更新时允许不可用的 Pod 数量 | `maxUnavailable=0`：更新时不能少于 3 个可用 Pod |

```yaml
# 滚动更新配置
strategy:
  type: RollingUpdate                 # 滚动更新策略
  rollingUpdate:
    maxSurge: 1                       # 更新时最多多 1 个 Pod
    maxUnavailable: 0                 # 更新时不允许有 Pod 不可用
```

**不同配置的效果：**

| 配置 | 更新过程 | 适用场景 |
| --- | --- | --- |
| `maxSurge=1, maxUnavailable=0` | 先创建新 Pod，就绪后再删除旧 Pod，始终保证 3 个可用 | 对可用性要求高的服务 |
| `maxSurge=0, maxUnavailable=1` | 先删除旧 Pod，再创建新 Pod，更新期间可能只有 2 个可用 | 资源紧张，不能临时多出 Pod |
| `maxSurge=25%, maxUnavailable=25%` | 默认配置，按百分比计算 | 一般场景 |

### 执行滚动更新

```bash
# 方式 1：修改镜像版本
kubectl set image deployment/web-deployment web-container=nginx:1.25

# 方式 2：编辑 Deployment YAML
kubectl edit deployment/web-deployment

# 方式 3：apply 新的 YAML 文件
kubectl apply -f updated-deployment.yaml

# 查看更新状态
kubectl rollout status deployment/web-deployment

# 查看 Deployment 详情
kubectl describe deployment web-deployment
```

---

## 6.4 回滚（Rollback）

### 为什么需要回滚？

滚动更新后，新版本可能有 Bug，或者性能下降。这时候需要快速退回到上一个稳定版本。

### 查看历史版本

```bash
# 查看 Deployment 的更新历史
kubectl rollout history deployment/web-deployment

# 输出示例：
# REVISION  CHANGE-CAUSE
# 1         Initial deployment
# 2         Update to nginx:1.25
# 3         Update to nginx:1.26

# 查看某个版本的详细信息
kubectl rollout history deployment/web-deployment --revision=2
```

### 执行回滚

```bash
# 回滚到上一个版本
kubectl rollout undo deployment/web-deployment

# 回滚到指定版本
kubectl rollout undo deployment/web-deployment --to-revision=1

# 查看回滚状态
kubectl rollout status deployment/web-deployment
```

### 回滚的工作原理

```
Deployment 维护了一个 ReplicaSet 历史列表：

Deployment: web-deployment
├── ReplicaSet v1（revision 1）── replicas: 0  ← 旧版本
├── ReplicaSet v2（revision 2）── replicas: 0  ← 当前版本
└── ReplicaSet v3（revision 3）── replicas: 3  ← 最新版本

执行 kubectl rollout undo 后：
├── ReplicaSet v1（revision 1）── replicas: 0
├── ReplicaSet v2（revision 2）── replicas: 3  ← 恢复到这个版本
└── ReplicaSet v3（revision 3）── replicas: 0
```

> **注意**：`revisionHistoryLimit` 决定了保留多少个历史版本。默认是 10，超过的会被清理。

---

## 6.5 扩缩容（Scaling）

### 手动扩缩容

```bash
# 查看当前副本数
kubectl get deployment web-deployment

# 手动扩容到 5 个副本
kubectl scale deployment/web-deployment --replicas=5

# 查看扩容后的状态
kubectl get pods -w  # 实时观察 Pod 创建过程

# 缩容回 3 个
kubectl scale deployment/web-deployment --replicas=3
```

### 自动扩缩容（HPA）

HPA（Horizontal Pod Autoscaler）根据 CPU 使用率或其他指标自动调整副本数。

```yaml
# HPA 示例
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa                     # HPA 名称
spec:
  scaleTargetRef:                   # 要扩缩容的目标
    apiVersion: apps/v1             # 目标 API 版本
    kind: Deployment                # 目标类型
    name: web-deployment            # 目标名称
  minReplicas: 2                    # 最小副本数
  maxReplicas: 10                   # 最大副本数
  metrics:                          # 扩缩容指标
  - type: Resource                  # 资源类型指标
    resource:
      name: cpu                     # CPU 使用率
      target:
        type: Utilization           # 目标类型：利用率
        averageUtilization: 70      # 目标 CPU 使用率：70%
```

**HPA 的工作原理：**

```
当前状态：3 个 Pod，平均 CPU 使用率 85%
目标：维持 70% 的 CPU 使用率

计算：
- 当前总 CPU = 3 * 85% = 255%
- 目标总 CPU = 3 * 70% = 210%
- 需要扩容到 = 255% / 70% ≈ 4 个 Pod

HPA 将副本数从 3 调整到 4
```

```bash
# 查看 HPA 状态
kubectl get hpa

# 查看 HPA 详情
kubectl describe hpa web-hpa
```

---

## 6.6 暂停和恢复（Pause/Resume）

### 为什么需要暂停？

在滚动更新过程中，你可能想：

- 先更新一部分 Pod，观察效果
- 确认没问题后再继续更新剩余的 Pod
- 或者发现问题时立即停止更新

```bash
# 暂停 Deployment（停止滚动更新）
kubectl rollout pause deployment/web-deployment

# 此时可以修改配置
kubectl set resources deployment/web-deployment -c web-container --limits=cpu=500m

# 恢复 Deployment（继续滚动更新）
kubectl rollout resume deployment/web-deployment
```

**暂停/恢复的典型场景：**

```
1. 开始更新
   kubectl set image deployment/web web=nginx:1.25
   
2. 观察前几个 Pod 的更新情况
   kubectl get pods -w
   
3. 发现问题，暂停更新
   kubectl rollout pause deployment/web
   
4. 修改配置或回滚
   kubectl rollout undo deployment/web
   
5. 或者确认没问题，恢复更新
   kubectl rollout resume deployment/web
```

---

## 6.7 清理策略（Cleanup Policy）

### revisionHistoryLimit

`revisionHistoryLimit` 决定了保留多少个历史 ReplicaSet，用于回滚。

```yaml
spec:
  revisionHistoryLimit: 5           # 保留 5 个历史版本
```

| 值 | 说明 |
| --- | --- |
| `0` | 不保留历史，无法回滚 |
| `5` | 保留 5 个历史版本 |
| `10` | 默认值，保留 10 个历史版本 |

> **建议**：生产环境保留 5-10 个历史版本，既能回滚，又不会占用太多 etcd 空间。

### 清理旧的 ReplicaSet

```bash
# 手动清理超出 revisionHistoryLimit 的 ReplicaSet
# Kubernetes 会自动清理，但也可以手动触发
kubectl rollout history deployment/web-deployment
```

---

## 6.8 更新策略对比

### RollingUpdate vs Recreate

| 策略 | 工作原理 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| **RollingUpdate** | 逐步替换，新旧 Pod 共存 | 不中断服务 | 更新期间新旧版本共存，可能有兼容性问题 | 大多数 Web 应用 |
| **Recreate** | 先删除所有旧 Pod，再创建新 Pod | 简单，不会有新旧版本共存 | 更新期间服务完全不可用 | 不支持多版本并存的应用 |

```yaml
# Recreate 策略
strategy:
  type: Recreate                      # 先全部删除，再全部创建
```

---

## 6.9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Deployment 的作用 | 管理 Pod 的副本、更新、回滚、扩缩容 |
| 滚动更新 | 逐步替换 Pod，不中断服务 |
| maxSurge | 更新时最多多出的 Pod 数 |
| maxUnavailable | 更新时允许不可用的 Pod 数 |
| 回滚 | `kubectl rollout undo` 退回历史版本 |
| 手动扩缩容 | `kubectl scale` 调整副本数 |
| HPA | 根据 CPU/内存自动扩缩容 |
| 暂停/恢复 | 更新过程中暂停检查 |
| revisionHistoryLimit | 保留的历史版本数量 |

---

## 6.10 新手常见误区

### 误区 1："滚动更新时 maxUnavailable 设为 0 最好"

❌ 错误理解：maxUnavailable=0 保证所有 Pod 都可用，是最安全的配置。

✅ 正确理解：maxUnavailable=0 确实保证了可用性，但会导致更新变慢（必须先创建新 Pod 并等待就绪，才能删除旧 Pod）。如果 maxSurge 也设为 0，更新会卡住。需要根据业务需求平衡：对可用性要求高的服务用 maxUnavailable=0，资源紧张的场景可以适当放宽。

### 误区 2："回滚就是修改镜像版本"

❌ 错误理解：回滚只需要把镜像改回旧版本。

✅ 正确理解：回滚是切换到上一个 ReplicaSet，不仅包括镜像版本，还包括所有配置（环境变量、资源限制、探针等）。用 `kubectl rollout undo` 是最安全的回滚方式。

### 误区 3："HPA 可以替代手动扩容"

❌ 错误理解：有了 HPA 就不需要手动扩容了。

✅ 正确理解：HPA 根据指标自动调整副本数，但有滞后性（需要等指标变化）。对于可预见的流量高峰（如促销活动），应该提前手动扩容。HPA 适合应对突发流量，手动扩容适合应对计划性流量。

### 误区 4："Deployment 的 selector 可以随意修改"

❌ 错误理解：Deployment 创建后还能修改 selector。

✅ 正确理解：Deployment 的 `selector` 在创建后是**不可变的**（immutable）。如果需要修改 selector，只能删除 Deployment 重新创建。这是因为 selector 决定了 Deployment 管理哪些 Pod，修改会导致混乱。

### 误区 5："revisionHistoryLimit 设为 0 可以节省空间，推荐这样做"

❌ 错误理解：不保留历史版本可以节省 etcd 空间，是最佳实践。

✅ 正确理解：revisionHistoryLimit=0 意味着无法回滚。一旦新版本出问题，只能手动修复或重新部署，风险很高。建议至少保留 5 个历史版本，以便快速回滚。

---

## 6.11 动手练习

### 练习 1：创建 Deployment 并执行滚动更新

创建一个 Nginx Deployment，初始版本为 1.24，然后滚动更新到 1.25，观察更新过程。

<details>
<summary>点击查看答案</summary>

```yaml
# 初始 Deployment（nginx:1.24）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deploy                # Deployment 名称
spec:
  replicas: 3                       # 3 个副本
  selector:
    matchLabels:
      app: nginx                    # 匹配标签
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx                 # 容器名称
        image: nginx:1.24           # 初始版本
        ports:
        - containerPort: 80
```

```bash
# 创建 Deployment
kubectl apply -f nginx-deploy.yaml

# 查看 Pod 状态
kubectl get pods

# 滚动更新到 1.25
kubectl set image deployment/nginx-deploy nginx=nginx:1.25

# 观察更新过程
kubectl rollout status deployment/nginx-deploy

# 查看更新后的 Pod
kubectl get pods
```

</details>

### 练习 2：回滚到历史版本

在练习 1 的基础上，假设 1.25 版本有问题，回滚到 1.24。然后再次更新到 1.26，验证回滚和更新都能正常工作。

<details>
<summary>点击查看答案</summary>

```bash
# 查看更新历史
kubectl rollout history deployment/nginx-deploy

# 回滚到上一版本（1.24）
kubectl rollout undo deployment/nginx-deploy

# 或者回滚到指定版本
kubectl rollout undo deployment/nginx-deploy --to-revision=1

# 查看回滚后的状态
kubectl get pods

# 再次更新到 1.26
kubectl set image deployment/nginx-deploy nginx=nginx:1.26

# 观察更新过程
kubectl rollout status deployment/nginx-deploy
```

</details>

### 练习 3（挑战）：配置 HPA 自动扩缩容

为 Deployment 创建 HPA，设置 CPU 使用率目标为 50%，最小副本数 2，最大副本数 10。然后用压力测试工具模拟流量，观察 HPA 是否自动扩容。

<details>
<summary>点击查看答案</summary>

```yaml
# HPA 配置
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nginx-hpa                   # HPA 名称
spec:
  scaleTargetRef:                   # 目标 Deployment
    apiVersion: apps/v1
    kind: Deployment
    name: nginx-deploy              # 目标名称
  minReplicas: 2                    # 最小副本数
  maxReplicas: 10                   # 最大副本数
  metrics:
  - type: Resource
    resource:
      name: cpu                     # CPU 指标
      target:
        type: Utilization
        averageUtilization: 50      # 目标 CPU 使用率 50%
```

```bash
# 创建 HPA
kubectl apply -f nginx-hpa.yaml

# 查看 HPA 状态
kubectl get hpa

# 模拟负载（需要安装压力测试工具，如 apache-bench）
# kubectl run load-test --image=busybox --rm -it -- sh
# 在 Pod 内执行：while true; do wget -q -O- http://nginx-deploy; done

# 观察 HPA 自动扩容
kubectl get pods -w

# 停止负载后，观察 HPA 自动缩容
```

</details>

---

## 下一章预告

下一章我们会学习 Kubernetes 中的**服务发现与负载均衡**——Service。你会学到为什么需要 Service、Service 有哪几种类型、如何通过 Selector 关联 Pod、如何实现负载均衡。Service 是让 Pod 能够被稳定访问的关键，也是微服务架构的基础。
