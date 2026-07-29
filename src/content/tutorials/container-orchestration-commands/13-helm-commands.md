---
title: '第13章：Helm 命令实战'
description: '掌握 Helm 安装、Chart 管理、Release 管理、仓库配置等命令'
---

# 第13章：Helm 命令实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Helm？
- 如何安装和使用 Helm？
- 如何管理 Chart 和 Release？
- 如何配置 Helm 仓库？

这一章会系统讲解 Helm 相关的所有命令，让你能够熟练使用 Helm 管理 Kubernetes 应用。

---

## 1 Helm 简介

### 1.1 什么是 Helm？

Helm 是 Kubernetes 的包管理工具，类似于 apt、yum、brew：

- 简化应用部署
- 管理应用依赖
- 版本控制和回滚
- 模板化配置

### 1.2 核心概念

| 概念 | 说明 |
| --- | --- |
| **Chart** | Helm 包，包含 Kubernetes 资源定义 |
| **Release** | Chart 的一个部署实例 |
| **Repository** | Chart 仓库 |

### 1.3 安装 Helm

**Linux/macOS**：

```bash
# 使用脚本安装
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 或使用包管理器
# macOS
brew install helm

# Linux (Ubuntu/Debian)
snap install helm --classic
```

**Windows**：

```powershell
# 使用 Chocolatey
choco install kubernetes-helm

# 或使用 scoop
scoop install helm
```

### 1.4 验证安装

```bash
helm version
```

---

## 2 Helm 仓库管理

### 2.1 helm repo - 管理仓库

**添加仓库**：

```bash
# 添加 Bitnami 仓库
helm repo add bitnami https://charts.bitnami.com/bitnami

# 添加 stable 仓库
helm repo add stable https://charts.helm.sh/stable

# 添加 ingress-nginx 仓库
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# 添加自定义仓库
helm repo add my-repo https://charts.example.com
```

**列出仓库**：

```bash
# 列出所有仓库
helm repo list

# 输出 YAML
helm repo list -o yaml
```

**更新仓库**：

```bash
# 更新所有仓库
helm repo update

# 更新指定仓库
helm repo update bitnami
```

**删除仓库**：

```bash
# 删除仓库
helm repo remove my-repo
```

**搜索仓库**：

```bash
# 搜索 Chart
helm search repo nginx

# 搜索所有版本
helm search repo nginx --versions

# 搜索 Hub
helm search hub nginx
```

---

## 3 Chart 管理命令

### 3.1 helm search - 搜索 Chart

```bash
# 搜索仓库中的 Chart
helm search repo nginx

# 搜索所有版本
helm search repo nginx --versions

# 搜索指定版本
helm search repo nginx --version "1.0.0"

# 搜索 Hub
helm search hub nginx
```

### 3.2 helm show - 查看 Chart 信息

```bash
# 查看 Chart 所有信息
helm show all bitnami/nginx

# 查看 Chart 值
helm show values bitnami/nginx

# 查看 Chart README
helm show readme bitnami/nginx

# 查看 Chart Chart.yaml
helm show chart bitnami/nginx
```

### 3.3 helm pull - 下载 Chart

```bash
# 下载 Chart
helm pull bitnami/nginx

# 下载到指定目录
helm pull bitnami/nginx --destination ./charts

# 下载并解压
helm pull bitnami/nginx --untar

# 下载指定版本
helm pull bitnami/nginx --version 1.0.0
```

### 3.4 helm create - 创建 Chart

```bash
# 创建新 Chart
helm create my-chart

# 查看创建的 Chart 结构
ls my-chart
```

### 3.5 helm lint - 验证 Chart

```bash
# 验证 Chart
helm lint my-chart

# 详细输出
helm lint my-chart --debug
```

### 3.6 helm package - 打包 Chart

```bash
# 打包 Chart
helm package my-chart

# 指定输出目录
helm package my-chart --destination ./packages

# 指定版本
helm package my-chart --version 1.0.0
```

---

## 4 Release 管理命令

### 4.1 helm install - 安装 Chart

**基本安装**：

```bash
# 安装 Chart
helm install my-release bitnami/nginx

# 指定命名空间
helm install my-release bitnami/nginx -n my-namespace

# 创建命名空间
helm install my-release bitnami/nginx -n my-namespace --create-namespace

# 指定版本
helm install my-release bitnami/nginx --version 1.0.0

# 自定义值
helm install my-release bitnami/nginx --set replicaCount=3

# 使用 values 文件
helm install my-release bitnami/nginx -f values.yaml

# 多个 values 文件
helm install my-release bitnami/nginx -f values.yaml -f values-prod.yaml

# 干跑模式
helm install my-release bitnami/nginx --dry-run

# 干跑模式并输出 YAML
helm install my-release bitnami/nginx --dry-run --debug

# 等待就绪
helm install my-release bitnami/nginx --wait

# 等待超时
helm install my-release bitnami/nginx --wait --timeout 5m0s

# 生成名称
helm install bitnami/nginx --generate-name
```

### 4.2 helm list - 列出 Release

```bash
# 列出所有 Release
helm list

# 所有命名空间
helm list -A

# 指定命名空间
helm list -n my-namespace

# 显示所有状态
helm list -a

# 显示已删除的
helm list -d

# 显示失败的
helm list -f

# 输出 JSON
helm list -o json

# 按名称过滤
helm list --filter 'my-.*'

# 限制数量
helm list --max 10
```

### 4.3 helm status - 查看 Release 状态

```bash
# 查看 Release 状态
helm status my-release

# 指定命名空间
helm status my-release -n my-namespace

# 显示修订版本
helm status my-release --revision 3
```

### 4.4 helm upgrade - 升级 Release

```bash
# 升级到最新版本
helm upgrade my-release bitnami/nginx

# 升级到指定版本
helm upgrade my-release bitnami/nginx --version 1.1.0

# 自定义值
helm upgrade my-release bitnami/nginx --set replicaCount=5

# 使用 values 文件
helm upgrade my-release bitnami/nginx -f values-prod.yaml

# 重用上次值
helm upgrade my-release bitnami/nginx --reuse-values

# 重置值
helm upgrade my-release bitnami/nginx --reset-values

# 干跑模式
helm upgrade my-release bitnami/nginx --dry-run

# 等待就绪
helm upgrade my-release bitnami/nginx --wait

# 强制更新
helm upgrade my-release bitnami/nginx --force
```

### 4.5 helm rollback - 回滚 Release

```bash
# 回滚到上一版本
helm rollback my-release

# 回滚到指定版本
helm rollback my-release 2

# 等待就绪
helm rollback my-release --wait

# 干跑模式
helm rollback my-release --dry-run
```

### 4.6 helm uninstall - 卸载 Release

```bash
# 卸载 Release
helm uninstall my-release

# 指定命名空间
helm uninstall my-release -n my-namespace

# 保留历史记录
helm uninstall my-release --keep-history

# 不等待
helm uninstall my-release --no-hooks
```

### 4.7 helm history - 查看 Release 历史

```bash
# 查看 Release 历史
helm history my-release

# 指定命名空间
helm history my-release -n my-namespace

# 输出 YAML
helm history my-release -o yaml

# 限制数量
helm history my-release --max 5
```

---

## 5 值管理

### 5.1 查看默认值

```bash
# 查看 Chart 默认值
helm show values bitnami/nginx
```

### 5.2 自定义值

**命令行指定**：

```bash
# 单个值
helm install my-release bitnami/nginx --set replicaCount=3

# 多个值
helm install my-release bitnami/nginx --set replicaCount=3 --set image.tag=1.25.3

# 数组值
helm install my-release bitnami/nginx --set service.ports[0].port=80

# 嵌套值
helm install my-release bitnami/nginx --set resources.limits.cpu=500m
```

**使用 values 文件**：

```yaml
# values.yaml
replicaCount: 3
image:
  tag: "1.25.3"
service:
  type: NodePort
  ports:
    - port: 80
resources:
  limits:
    cpu: 500m
    memory: 512Mi
```

```bash
helm install my-release bitnami/nginx -f values.yaml
```

### 5.3 合并多个 values 文件

```bash
# 多个文件，后面的覆盖前面的
helm install my-release bitnami/nginx -f values.yaml -f values-prod.yaml
```

---

## 6 常用命令组合

### 6.1 完整部署流程

```bash
# 1. 添加仓库
helm repo add bitnami https://charts.bitnami.com/bitnami

# 2. 更新仓库
helm repo update

# 3. 搜索 Chart
helm search repo nginx

# 4. 查看 Chart 信息
helm show values bitnami/nginx

# 5. 安装 Release
helm install my-nginx bitnami/nginx --set replicaCount=3

# 6. 查看状态
helm status my-nginx

# 7. 列出 Release
helm list

# 8. 升级 Release
helm upgrade my-nginx bitnami/nginx --set replicaCount=5

# 9. 查看历史
helm history my-nginx

# 10. 回滚
helm rollback my-nginx 1

# 11. 卸载
helm uninstall my-nginx
```

### 6.2 自定义部署

```bash
# 1. 下载 Chart
helm pull bitnami/nginx --untar

# 2. 修改 values.yaml
# 编辑 nginx/values.yaml

# 3. 本地安装
helm install my-nginx ./nginx -f custom-values.yaml

# 4. 验证
helm status my-nginx
```

---

## 7 命令速查表

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `helm repo add` | 添加仓库 | `helm repo add bitnami https://charts.bitnami.com/bitnami` |
| `helm repo update` | 更新仓库 | `helm repo update` |
| `helm search repo` | 搜索 Chart | `helm search repo nginx` |
| `helm show values` | 查看值 | `helm show values bitnami/nginx` |
| `helm install` | 安装 Release | `helm install my-release bitnami/nginx` |
| `helm list` | 列出 Release | `helm list -A` |
| `helm status` | 查看状态 | `helm status my-release` |
| `helm upgrade` | 升级 Release | `helm upgrade my-release bitnami/nginx` |
| `helm rollback` | 回滚 Release | `helm rollback my-release 1` |
| `helm uninstall` | 卸载 Release | `helm uninstall my-release` |
| `helm history` | 查看历史 | `helm history my-release` |

---

## 8 本章小结

本章系统讲解了 Helm 相关命令，包括：

**仓库管理**：

- 添加、更新、删除仓库
- 搜索 Chart

**Chart 管理**：

- 查看 Chart 信息
- 下载、创建、打包 Chart

**Release 管理**：

- 安装、升级、回滚、卸载 Release
- 查看状态和历史

**值管理**：

- 自定义配置
- 使用 values 文件

掌握这些命令，你就能够熟练使用 Helm 管理 Kubernetes 应用。下一章会讲解 Kubernetes 调试与排障命令。

---

## 9 练习题

1. 添加 Helm 仓库并更新
2. 搜索并查看 Chart 信息
3. 安装 Release 并自定义配置
4. 升级 Release 并查看历史
5. 回滚到指定版本
6. 卸载 Release
