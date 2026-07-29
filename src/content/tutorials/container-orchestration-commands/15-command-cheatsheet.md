---
title: '第15章：常用命令速查与效率技巧'
description: '掌握别名配置、jsonpath/output 格式化、dry-run、命令组合技巧等效率工具'
---

# 第15章：常用命令速查与效率技巧

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何提高 kubectl 命令效率？
- 如何配置别名？
- 如何使用 jsonpath 格式化输出？
- 如何使用 dry-run 生成 YAML？

这一章会系统讲解各种效率技巧和速查表，让你能够更高效地使用 kubectl。

---

## 1 别名配置

### 1.1 kubectl 别名

**Bash/Zsh 配置**：

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中添加
alias k='kubectl'
alias kg='kubectl get'
alias kd='kubectl describe'
alias kl='kubectl logs'
alias ke='kubectl exec'
alias kdel='kubectl delete'

# Pod 相关
alias kgp='kubectl get pods'
alias kgpa='kubectl get pods -A'
alias kgpw='kubectl get pods -o wide'
alias kdp='kubectl describe pod'
alias klp='kubectl logs -f'

# Deployment 相关
alias kgd='kubectl get deployment'
alias kdd='kubectl describe deployment'

# Service 相关
alias kgs='kubectl get service'
alias kds='kubectl describe service'

# Node 相关
alias kgn='kubectl get nodes'
alias kdn='kubectl describe node'

# Namespace 相关
alias kgn='kubectl get namespaces'
alias kns='kubectl config set-context --current --namespace'

# 常用操作
alias krf='kubectl rollout restart deployment'
alias krs='kubectl rollout status deployment'
```

**应用配置**：

```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

### 1.2 自动补全

**Bash**：

```bash
# 安装自动补全
source <(kubectl completion bash)

# 永久生效
echo 'source <(kubectl completion bash)' >> ~/.bashrc
```

**Zsh**：

```bash
# 安装自动补全
source <(kubectl completion zsh)

# 永久生效
echo 'source <(kubectl completion zsh)' >> ~/.zshrc
```

---

## 2 JSONPath 表达式

### 2.1 基础语法

```bash
# 获取单个字段
kubectl get pod my-pod -o jsonpath='{.status.phase}'

# 获取多个字段
kubectl get pod my-pod -o jsonpath='{.metadata.name} {.status.phase}'

# 获取数组元素
kubectl get pods -o jsonpath='{.items[0].metadata.name}'

# 获取所有数组元素
kubectl get pods -o jsonpath='{.items[*].metadata.name}'

# 获取嵌套字段
kubectl get pod my-pod -o jsonpath='{.spec.containers[0].image}'
```

### 2.2 格式化输出

```bash
# 换行输出
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'

# 表格输出
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'

# 带标题
echo -e "NAME\tSTATUS"
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'
```

### 2.3 条件过滤

```bash
# 过滤运行中的 Pod
kubectl get pods -o jsonpath='{.items[?(@.status.phase=="Running")].metadata.name}'

# 过滤失败的 Pod
kubectl get pods -o jsonpath='{.items[?(@.status.phase=="Failed")].metadata.name}'

# 过滤特定标签
kubectl get pods -o jsonpath='{.items[?(@.metadata.labels.app=="nginx")].metadata.name}'
```

### 2.4 数学运算

```bash
# 计算 Pod 数量
kubectl get pods -o jsonpath='{len .items}'

# 计算容器数量
kubectl get pod my-pod -o jsonpath='{len .spec.containers}'
```

---

## 3 输出格式化

### 3.1 常用输出格式

```bash
# YAML 格式
kubectl get pod my-pod -o yaml

# JSON 格式
kubectl get pod my-pod -o json

# 宽表格
kubectl get pods -o wide

# 只输出名称
kubectl get pods -o name

# 自定义列
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase

# 从文件读取自定义列
kubectl get pods -o custom-columns-file=columns.txt
```

**columns.txt 示例**：

```
NAME          STATUS
metadata.name status.phase
```

### 3.2 排序输出

```bash
# 按名称排序
kubectl get pods --sort-by=.metadata.name

# 按创建时间排序
kubectl get pods --sort-by=.metadata.creationTimestamp

# 按状态排序
kubectl get pods --sort-by=.status.phase

# 按 CPU 使用排序（需要 metrics-server）
kubectl top pods --sort-by=cpu

# 按内存使用排序
kubectl top pods --sort-by=memory
```

### 3.3 标签输出

```bash
# 显示标签
kubectl get pods -L app,env

# 按标签过滤
kubectl get pods -l app=nginx

# 按多个标签过滤
kubectl get pods -l app=nginx,env=prod

# 按标签不存在过滤
kubectl get pods -l '!app'
```

---

## 4 dry-run 模式

### 4.1 生成 YAML

```bash
# 生成 Pod YAML
kubectl run my-pod --image=nginx --dry-run=client -o yaml

# 生成 Deployment YAML
kubectl create deployment my-deploy --image=nginx --dry-run=client -o yaml

# 生成 Service YAML
kubectl expose deployment my-deploy --port=80 --dry-run=client -o yaml

# 生成 ConfigMap YAML
kubectl create configmap my-config --from-literal=key=value --dry-run=client -o yaml

# 生成 Secret YAML
kubectl create secret generic my-secret --from-literal=password=secret --dry-run=client -o yaml
```

### 4.2 保存到文件

```bash
# 保存到文件
kubectl run my-pod --image=nginx --dry-run=client -o yaml > pod.yaml

# 应用文件
kubectl apply -f pod.yaml
```

### 4.3 验证配置

```bash
# 验证但不执行
kubectl apply -f deployment.yaml --dry-run=server

# 客户端验证
kubectl apply -f deployment.yaml --dry-run=client
```

---

## 5 命令组合技巧

### 5.1 批量操作

```bash
# 删除所有失败的 Pod
kubectl delete pods --field-selector=status.phase=Failed

# 删除所有命名空间的 Pod（慎用）
kubectl delete pods --all -A

# 按标签批量删除
kubectl delete pods -l app=test

# 批量重启 Deployment
kubectl rollout restart deployment -l app=myapp
```

### 5.2 管道操作

```bash
# 获取 Pod 名称并处理
kubectl get pods -o name | xargs kubectl delete

# 获取镜像列表
kubectl get pods -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n' | sort -u

# 获取所有节点 IP
kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}'
```

### 5.3 xargs 使用

```bash
# 删除多个 Pod
kubectl get pods -l app=test -o name | xargs kubectl delete

# 查看多个 Pod 日志
kubectl get pods -l app=myapp -o name | xargs -I {} kubectl logs {}
```

### 5.4 watch 命令

```bash
# 实时监控 Pod
watch -n 1 kubectl get pods

# 实时监控节点
watch -n 1 kubectl get nodes

# 实时监控 Deployment
watch -n 1 kubectl get deployment
```

---

## 6 常用速查表

### 6.1 Docker 命令速查

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `docker pull` | 拉取镜像 | `docker pull nginx:latest` |
| `docker images` | 查看镜像 | `docker images -a` |
| `docker rmi` | 删除镜像 | `docker rmi nginx:latest` |
| `docker run` | 运行容器 | `docker run -d -p 80:80 nginx` |
| `docker ps` | 查看容器 | `docker ps -a` |
| `docker stop` | 停止容器 | `docker stop my-nginx` |
| `docker rm` | 删除容器 | `docker rm my-nginx` |
| `docker logs` | 查看日志 | `docker logs -f my-nginx` |
| `docker exec` | 执行命令 | `docker exec -it my-nginx bash` |
| `docker build` | 构建镜像 | `docker build -t my-app .` |
| `docker-compose up` | 启动服务 | `docker-compose up -d` |
| `docker-compose down` | 停止服务 | `docker-compose down` |

### 6.2 kubectl 命令速查

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `kubectl get` | 列出资源 | `kubectl get pods -A` |
| `kubectl describe` | 查看详情 | `kubectl describe pod my-pod` |
| `kubectl logs` | 查看日志 | `kubectl logs -f my-pod` |
| `kubectl exec` | 执行命令 | `kubectl exec -it my-pod -- bash` |
| `kubectl apply` | 应用配置 | `kubectl apply -f deployment.yaml` |
| `kubectl delete` | 删除资源 | `kubectl delete pod my-pod` |
| `kubectl create` | 创建资源 | `kubectl create -f pod.yaml` |
| `kubectl scale` | 扩缩容 | `kubectl scale deploy my-deploy --replicas=5` |
| `kubectl rollout` | 滚动更新 | `kubectl rollout status deploy/my-deploy` |
| `kubectl port-forward` | 端口转发 | `kubectl port-forward my-pod 8080:80` |

### 6.3 Helm 命令速查

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `helm repo add` | 添加仓库 | `helm repo add bitnami https://charts.bitnami.com/bitnami` |
| `helm repo update` | 更新仓库 | `helm repo update` |
| `helm search` | 搜索 Chart | `helm search repo nginx` |
| `helm install` | 安装 Release | `helm install my-release bitnami/nginx` |
| `helm upgrade` | 升级 Release | `helm upgrade my-release bitnami/nginx` |
| `helm rollback` | 回滚 Release | `helm rollback my-release 1` |
| `helm uninstall` | 卸载 Release | `helm uninstall my-release` |
| `helm list` | 列出 Release | `helm list -A` |
| `helm status` | 查看状态 | `helm status my-release` |

---

## 7 高级技巧

### 7.1 使用 kubectl patch

```bash
# 修改 Deployment 副本数
kubectl patch deployment my-deploy -p '{"spec":{"replicas":5}}'

# 修改 Service 类型
kubectl patch service my-service -p '{"spec":{"type":"NodePort"}}'

# 修改 Pod 标签
kubectl patch pod my-pod -p '{"metadata":{"labels":{"env":"prod"}}}'

# 修改 ConfigMap
kubectl patch configmap my-config -p '{"data":{"key":"new-value"}}'
```

### 7.2 使用 kubectl edit

```bash
# 编辑 Deployment
kubectl edit deployment my-deploy

# 编辑 Service
kubectl edit service my-service

# 编辑 ConfigMap
kubectl edit configmap my-config
```

### 7.3 使用 kubectl replace

```bash
# 替换资源
kubectl replace -f deployment.yaml

# 强制替换
kubectl replace -f deployment.yaml --force
```

### 7.4 使用 kubectl label

```bash
# 添加标签
kubectl label pod my-pod env=prod

# 覆盖标签
kubectl label pod my-pod env=prod --overwrite

# 删除标签
kubectl label pod my-pod env-

# 给所有 Pod 添加标签
kubectl label pods --all env=prod
```

### 7.5 使用 kubectl annotate

```bash
# 添加注解
kubectl annotate pod my-pod description="my app"

# 覆盖注解
kubectl annotate pod my-pod description="my app" --overwrite

# 删除注解
kubectl annotate pod my-pod description-
```

---

## 8 实用脚本

### 8.1 清理资源

```bash
#!/bin/bash
# 清理所有失败的 Pod
kubectl delete pods --field-selector=status.phase=Failed

# 清理所有已完成的 Job
kubectl delete job --field-selector=status.successful=1

# 清理所有未使用的 PV
kubectl delete pv $(kubectl get pv -o jsonpath='{.items[?(@.status.phase=="Available")].metadata.name}')
```

### 8.2 备份资源

```bash
#!/bin/bash
# 备份所有 Deployment
for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  kubectl get deploy -n $ns -o yaml > deploy-$ns.yaml
done

# 备份所有 ConfigMap
kubectl get cm -A -o yaml > configmaps-backup.yaml

# 备份所有 Secret
kubectl get secret -A -o yaml > secrets-backup.yaml
```

### 8.3 监控脚本

```bash
#!/bin/bash
# 监控 Pod 状态
while true; do
  clear
  echo "=== Pod Status ==="
  kubectl get pods -A
  echo -e "\n=== Node Status ==="
  kubectl get nodes
  echo -e "\n=== Events (last 10) ==="
  kubectl get events --sort-by='.lastTimestamp' | tail -n 10
  sleep 5
done
```

---

## 9 本章小结

本章系统讲解了各种效率技巧和速查表，包括：

**别名配置**：

- kubectl 别名
- 自动补全

**JSONPath**：

- 基础语法
- 格式化输出
- 条件过滤

**输出格式化**：

- 常用输出格式
- 排序输出
- 标签输出

**dry-run 模式**：

- 生成 YAML
- 验证配置

**命令组合技巧**：

- 批量操作
- 管道操作
- xargs 使用
- watch 命令

**速查表**：

- Docker 命令
- kubectl 命令
- Helm 命令

**高级技巧**：

- patch/edit/replace
- label/annotate

掌握这些技巧，你就能够更高效地使用 kubectl 和其他容器工具。下一章会讲解生产环境命令最佳实践。

---

## 10 练习题

1. 配置 kubectl 别名和自动补全
2. 使用 jsonpath 格式化输出 Pod 信息
3. 使用 dry-run 生成 YAML 文件
4. 使用管道和 xargs 批量操作资源
5. 编写脚本备份 Kubernetes 资源
6. 使用 patch 命令修改资源
