---
title: "第9章：ConfigMap 与 Secret"
description: "配置管理与敏感信息保护"
---

# 第9章：ConfigMap 与 Secret

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 应用配置写死在代码里，每次修改都要重新构建镜像，怎么办？
- 数据库密码、API 密钥这些敏感信息怎么安全地传给容器？
- 不同环境（开发、测试、生产）的配置怎么管理？
- ConfigMap 和 Secret 有什么区别？

这一章会教你如何使用 ConfigMap 管理普通配置，使用 Secret 管理敏感信息。学会这些，你的应用配置就能和代码解耦，实现一次构建、多处部署。

---

## 1 为什么需要 ConfigMap 和 Secret？

### 痛点分析

想象一下这个场景：你开发了一个 Web 应用，数据库地址、API 密钥都写在代码里。现在要把应用从开发环境部署到生产环境，你需要：

1. 修改代码中的数据库地址
2. 重新构建镜像
3. 推送到镜像仓库
4. 重新部署

更糟糕的是，如果把密码提交到 Git 仓库，所有有权限的人都能看到。

### 解决方案

Kubernetes 提供了两种资源来解决这个问题：

- **ConfigMap**：存储普通配置（数据库地址、日志级别等）
- **Secret**：存储敏感信息（密码、证书、Token 等）

打个比方：

> 应用就像一台洗衣机，ConfigMap 和 Secret 就像洗衣粉和洗衣液。
>
> 洗衣机（应用）本身不包含洗涤剂，你可以根据需要添加不同的洗涤剂（配置）。
>
> ConfigMap 是普通的洗衣粉（不敏感的配置），Secret 是特殊的洗衣液（敏感信息），需要妥善保管。

---

## 2 ConfigMap 基础用法

### 什么是 ConfigMap？

ConfigMap 是一个 API 对象，用来存储非敏感的配置数据。它可以被 Pod 以环境变量或配置文件的 form 使用。

### 创建 ConfigMap

#### 方式一：使用命令行（literal）

```yaml
# ❶ 使用 kubectl 命令直接创建
# 格式：kubectl create configmap 名称 --from-literal=键=值
kubectl create configmap app-config \
  --from-literal=DATABASE_HOST=mysql.default.svc.cluster.local \
  --from-literal=DATABASE_PORT=3306 \
  --from-literal=LOG_LEVEL=info

# ❷ 查看创建的 ConfigMap
kubectl get configmap app-config

# ❸ 查看详细信息
kubectl describe configmap app-config
```

#### 方式二：使用 YAML 文件（推荐）

```yaml
# configmap.yaml
apiVersion: v1                    # API 版本
kind: ConfigMap                   # 资源类型
metadata:                         # 元数据
  name: app-config                # ConfigMap 名称
  namespace: default              # 命名空间
data:                             # 配置数据
  DATABASE_HOST: mysql.default.svc.cluster.local  # 数据库主机地址
  DATABASE_PORT: "3306"           # 数据库端口（必须是字符串）
  LOG_LEVEL: info                 # 日志级别
  APP_CONFIG: |                   # 多行配置（使用 | 保留换行）
    server {
      listen 80;
      server_name example.com;
    }
```

```bash
# ❶ 应用 YAML 文件
kubectl apply -f configmap.yaml

# ❷ 查看 ConfigMap
kubectl get configmap

# ❸ 查看具体内容
kubectl get configmap app-config -o yaml
```

#### 方式三：从文件创建

```bash
# ❶ 创建配置文件
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name example.com;
    location / {
        root /usr/share/nginx/html;
    }
}
EOF

# ❷ 从文件创建 ConfigMap
# --from-file 会将文件名作为 key，文件内容作为 value
kubectl create configmap nginx-config --from-file=nginx.conf

# ❸ 查看内容
kubectl get configmap nginx-config -o yaml
```

### 在 Pod 中使用 ConfigMap

#### 作为环境变量使用

```yaml
# pod-with-configmap-env.yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-demo              # Pod 名称
spec:
  containers:
  - name: demo-container            # 容器名称
    image: nginx:latest             # 镜像
    env:                            # 环境变量配置
    - name: DB_HOST                 # 环境变量名
      valueFrom:                    # 从 ConfigMap 获取值
        configMapKeyRef:            # 引用 ConfigMap 的 key
          name: app-config          # ConfigMap 名称
          key: DATABASE_HOST        # ConfigMap 中的 key
    - name: DB_PORT
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: DATABASE_PORT
```

```bash
# ❶ 创建 Pod
kubectl apply -f pod-with-configmap-env.yaml

# ❷ 进入容器查看环境变量
kubectl exec -it configmap-demo -- env | grep DB
# 输出：
# DB_HOST=mysql.default.svc.cluster.local
# DB_PORT=3306
```

#### 作为配置文件挂载

```yaml
# pod-with-configmap-volume.yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-volume-demo      # Pod 名称
spec:
  containers:
  - name: demo-container           # 容器名称
    image: nginx:latest            # 镜像
    volumeMounts:                  # 挂载卷
    - name: config-volume          # 卷名称
      mountPath: /etc/nginx/conf.d # 挂载到容器内的路径
  volumes:                         # 定义卷
  - name: config-volume            # 卷名称
    configMap:                     # 使用 ConfigMap
      name: nginx-config           # ConfigMap 名称
```

```bash
# ❶ 创建 Pod
kubectl apply -f pod-with-configmap-volume.yaml

# ❷ 查看挂载的配置文件
kubectl exec configmap-volume-demo -- cat /etc/nginx/conf.d/nginx.conf
# 输出：server { listen 80; ... }
```

### ConfigMap 更新策略

ConfigMap 更新后，Pod 不会自动重启。有两种策略：

1. **手动重启**：更新 ConfigMap 后，手动重启 Pod
2. **自动更新**：使用挂载方式，ConfigMap 更新后文件会自动更新（有延迟）

```bash
# ❶ 更新 ConfigMap
kubectl edit configmap app-config
# 修改 LOG_LEVEL 为 debug

# ❷ 手动重启 Pod（使环境变量生效）
kubectl rollout restart deployment/my-app

# ❸ 或者删除 Pod 让其重建
kubectl delete pod configmap-demo
```

---

## 3 Secret 基础用法

### 什么是 Secret？

Secret 和 ConfigMap 类似，但专门用来存储敏感信息。Secret 的数据会以 base64 编码存储（不是加密，只是编码）。

### Secret 的类型

Kubernetes 内置了几种 Secret 类型：

| 类型 | 说明 | 使用场景 |
|------|------|----------|
| Opaque | 通用类型，存储任意数据 | 密码、Token 等 |
| kubernetes.io/tls | TLS 证书 | HTTPS 证书 |
| kubernetes.io/dockerconfigjson | Docker 仓库认证 | 私有镜像仓库 |
| kubernetes.io/service-account-token | ServiceAccount Token | Pod 访问 API Server |
| kubernetes.io/ssh-auth | SSH 认证 | SSH 密钥 |

### 创建 Secret

#### 方式一：使用命令行

```bash
# ❶ 创建 Opaque 类型的 Secret
# --from-literal 会自动进行 base64 编码
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=MyS3cretP@ssw0rd

# ❷ 查看 Secret（不会显示具体值）
kubectl get secret db-secret

# ❸ 查看详细信息
kubectl describe secret db-secret

# ❹ 查看 base64 编码后的值
kubectl get secret db-secret -o yaml
```

#### 方式二：使用 YAML 文件

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret                   # Secret 名称
type: Opaque                        # 类型
data:                               # 数据（必须 base64 编码）
  username: YWRtaW4=                # admin 的 base64 编码
  password: TXlTM2NyZXRAc3N3MHJk    # MyS3cretP@ssw0rd 的 base64 编码
```

```bash
# ❶ 生成 base64 编码
echo -n "admin" | base64
# 输出：YWRtaW4=

echo -n "MyS3cretP@ssw0rd" | base64
# 输出：TXlTM2NyZXRAc3N3MHJk

# ❷ 应用 YAML 文件
kubectl apply -f secret.yaml
```

**注意**：YAML 中的值必须手动进行 base64 编码。使用 `echo -n` 而不是 `echo`，避免换行符被编码。

#### 方式三：使用 stringData（明文）

```yaml
# secret-stringdata.yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret-plain
type: Opaque
stringData:                         # 明文数据（K8s 会自动编码）
  username: admin                   # 不需要手动 base64 编码
  password: MyS3cretP@ssw0rd
```

```bash
# ❶ 应用后，K8s 会自动转换为 data 字段
kubectl apply -f secret-stringdata.yaml

# ❷ 查看时，看到的是 base64 编码后的值
kubectl get secret db-secret-plain -o yaml
# data:
#   username: YWRtaW4=
#   password: TXlTM2NyZXRAc3N3MHJk
```

### 在 Pod 中使用 Secret

#### 作为环境变量

```yaml
# pod-with-secret-env.yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-env-demo              # Pod 名称
spec:
  containers:
  - name: demo-container             # 容器名称
    image: mysql:8.0                 # 镜像
    env:                             # 环境变量
    - name: MYSQL_ROOT_PASSWORD      # 环境变量名
      valueFrom:                     # 从 Secret 获取
        secretKeyRef:                # 引用 Secret 的 key
          name: db-secret            # Secret 名称
          key: password              # Secret 中的 key
    - name: MYSQL_USER
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: username
```

```bash
# ❶ 创建 Pod
kubectl apply -f pod-with-secret-env.yaml

# ❷ 查看环境变量
kubectl exec secret-env-demo -- env | grep MYSQL
# 输出：
# MYSQL_ROOT_PASSWORD=MyS3cretP@ssw0rd
# MYSQL_USER=admin
```

#### 作为文件挂载

```yaml
# pod-with-secret-volume.yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-volume-demo           # Pod 名称
spec:
  containers:
  - name: demo-container             # 容器名称
    image: nginx:latest              # 镜像
    volumeMounts:                    # 挂载卷
    - name: secret-volume            # 卷名称
      mountPath: /etc/secret         # 挂载路径
      readOnly: true                 # 只读挂载
  volumes:                           # 定义卷
  - name: secret-volume              # 卷名称
    secret:                          # 使用 Secret
      secretName: db-secret          # Secret 名称
```

```bash
# ❶ 创建 Pod
kubectl apply -f pod-with-secret-volume.yaml

# ❷ 查看挂载的文件
kubectl exec secret-volume-demo -- ls /etc/secret
# 输出：password  username

# ❸ 查看文件内容（自动 base64 解码）
kubectl exec secret-volume-demo -- cat /etc/secret/username
# 输出：admin

kubectl exec secret-volume-demo -- cat /etc/secret/password
# 输出：MyS3cretP@ssw0rd
```

---

## 4 TLS Secret 示例

TLS Secret 专门用于存储 HTTPS 证书。

```bash
# ❶ 生成自签名证书（测试用）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=example.com"

# ❷ 创建 TLS Secret
# --cert 指定证书文件
# --key 指定私钥文件
kubectl create secret tls example-tls \
  --cert=tls.crt \
  --key=tls.key

# ❸ 查看 Secret
kubectl get secret example-tls -o yaml
```

在 Ingress 中使用：

```yaml
# ingress-with-tls.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
spec:
  tls:                               # TLS 配置
  - hosts:                           # 域名列表
    - example.com
    secretName: example-tls          # TLS Secret 名称
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: example-service
            port:
              number: 80
```

---

## 5 ConfigMap vs Secret 对比

| 特性 | ConfigMap | Secret |
|------|-----------|--------|
| 用途 | 存储普通配置 | 存储敏感信息 |
| 编码 | 明文存储 | base64 编码（不是加密） |
| 大小限制 | 最大 1MB | 最大 1MB |
| 类型 | 无类型限制 | 有内置类型（Opaque、TLS 等） |
| 可见性 | kubectl get 可看到值 | kubectl get 看不到值，需要 -o yaml |
| 安全性 | 低（明文） | 中（编码，但仍可解码） |
| 使用方式 | 环境变量、卷挂载 | 环境变量、卷挂载 |
| 更新策略 | 手动重启或自动更新 | 手动重启或自动更新 |

**重要提示**：Secret 的 base64 编码不是加密！任何有权限读取 Secret 的人都可以解码。真正的安全需要通过 RBAC 权限控制、加密存储（etcd 加密）等方式实现。

---

## 6 安全最佳实践

### 1. 限制 Secret 访问权限

```yaml
# 使用 RBAC 限制谁可以访问 Secret
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: default
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch"]  # 只允许读取，不允许修改
```

### 2. 启用 etcd 加密

Secret 默认以明文存储在 etcd 中，需要配置加密：

```yaml
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:                      # 使用 AES-CBC 加密
      keys:
      - name: key1
        secret: <base64-encoded-key>
    - identity: {}                 # 回退到明文（用于迁移）
```

在 API Server 启动参数中添加：

```bash
--encryption-provider-config=/etc/kubernetes/encryption-config.yaml
```

### 3. 使用外部密钥管理系统

对于生产环境，建议使用专业的密钥管理工具：

- **HashiCorp Vault**：企业级密钥管理
- **AWS Secrets Manager**：AWS 云原生方案
- **Azure Key Vault**：Azure 云原生方案
- **External Secrets Operator**：将外部密钥同步到 K8s Secret

### 4. 避免在日志中泄露敏感信息

```bash
# 错误做法：在日志中打印密码
kubectl exec my-pod -- env | grep PASSWORD

# 正确做法：使用 --show-all=false（默认不显示 Secret）
kubectl describe pod my-pod
# Secret 的值不会显示
```

### 5. 定期轮换密钥

```bash
# ❶ 创建新的 Secret
kubectl create secret generic db-secret-new \
  --from-literal=username=admin \
  --from-literal=password=NewP@ssw0rd

# ❷ 更新 Deployment 使用新 Secret
kubectl set env deployment/my-app \
  MYSQL_ROOT_PASSWORD=NewP@ssw0rd

# ❸ 验证应用正常运行后，删除旧 Secret
kubectl delete secret db-secret-old
```

---

## 7 新手常见误区

### 误区 1："Secret 是加密的，很安全"

**错！** Secret 只是 base64 编码，不是加密。任何有权限读取 Secret 的人都可以轻松解码。真正的安全需要通过 RBAC、etcd 加密、网络策略等多层防护。

### 误区 2："ConfigMap 和 Secret 可以存储任意大小的数据"

**错！** ConfigMap 和 Secret 都有 1MB 的大小限制。如果需要存储更大的配置（如完整的数据库备份），应该使用 PersistentVolume。

### 误区 3："更新 ConfigMap 后，Pod 会自动重启"

**错！** 更新 ConfigMap 后，Pod 不会自动重启。如果使用环境变量方式，需要手动重启 Pod；如果使用卷挂载方式，文件会自动更新（有延迟，约 1-2 分钟）。

### 误区 4："YAML 中的 Secret 可以直接写明文"

**错！** 在 YAML 的 `data` 字段中，值必须是 base64 编码的。如果想写明文，应该使用 `stringData` 字段，K8s 会自动编码。

### 误区 5："Secret 不需要备份"

**错！** Secret 和 ConfigMap 一样需要备份。如果误删 Secret，应用可能无法启动。建议将 Secret 的 YAML 文件保存在安全的密钥管理系统中。

---

## 8 动手练习

### 练习 1：创建并使用 ConfigMap

创建一个 ConfigMap，包含数据库配置信息，然后在 Pod 中通过环境变量使用它。

<details>
<summary>点击查看答案</summary>

```yaml
# ❶ 创建 ConfigMap YAML 文件
# db-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: db-config                    # ConfigMap 名称
data:
  DB_HOST: mysql.default.svc.cluster.local  # 数据库主机
  DB_PORT: "3306"                    # 数据库端口
  DB_NAME: myapp                     # 数据库名称
```

```yaml
# ❷ 创建使用 ConfigMap 的 Pod
# pod-with-db-config.yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-config-demo               # Pod 名称
spec:
  containers:
  - name: demo                       # 容器名称
    image: busybox:latest            # 镜像
    command: ["sh", "-c", "echo Host: $DB_HOST Port: $DB_PORT Name: $DB_NAME && sleep 3600"]
    env:                             # 环境变量
    - name: DB_HOST
      valueFrom:
        configMapKeyRef:
          name: db-config            # 引用 ConfigMap
          key: DB_HOST
    - name: DB_PORT
      valueFrom:
        configMapKeyRef:
          name: db-config
          key: DB_PORT
    - name: DB_NAME
      valueFrom:
        configMapKeyRef:
          name: db-config
          key: DB_NAME
```

```bash
# ❸ 应用配置
kubectl apply -f db-config.yaml
kubectl apply -f pod-with-db-config.yaml

# ❹ 查看 Pod 日志
kubectl logs db-config-demo
# 输出：Host: mysql.default.svc.cluster.local Port: 3306 Name: myapp
```

</details>

### 练习 2：创建并使用 Secret

创建一个 Secret 存储数据库密码，然后在 Pod 中通过卷挂载的方式使用它。

<details>
<summary>点击查看答案</summary>

```yaml
# ❶ 创建 Secret YAML 文件
# db-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret                    # Secret 名称
type: Opaque                         # 类型
stringData:                          # 使用明文（K8s 会自动编码）
  username: admin                    # 用户名
  password: S3cretP@ssw0rd           # 密码
```

```yaml
# ❷ 创建使用 Secret 的 Pod
# pod-with-secret-volume.yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-volume-demo           # Pod 名称
spec:
  containers:
  - name: demo                       # 容器名称
    image: busybox:latest            # 镜像
    command: ["sh", "-c", "cat /etc/secret/username && echo '' && cat /etc/secret/password && sleep 3600"]
    volumeMounts:                    # 挂载卷
    - name: secret-volume            # 卷名称
      mountPath: /etc/secret         # 挂载路径
      readOnly: true                 # 只读
  volumes:                           # 定义卷
  - name: secret-volume
    secret:                          # 使用 Secret
      secretName: db-secret          # Secret 名称
```

```bash
# ❸ 应用配置
kubectl apply -f db-secret.yaml
kubectl apply -f pod-with-secret-volume.yaml

# ❹ 查看 Pod 日志
kubectl logs secret-volume-demo
# 输出：
# admin
# S3cretP@ssw0rd

# ❺ 也可以进入容器查看文件
kubectl exec secret-volume-demo -- cat /etc/secret/username
kubectl exec secret-volume-demo -- cat /etc/secret/password
```

</details>

### 练习 3（挑战）：多环境配置管理

创建三个 ConfigMap（开发、测试、生产环境），使用同一个 Deployment，通过切换 ConfigMap 实现不同环境的配置。

<details>
<summary>点击查看答案</summary>

```yaml
# ❶ 创建开发环境 ConfigMap
# config-dev.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-dev               # 开发环境
data:
  LOG_LEVEL: debug                   # 开发环境日志级别
  DB_HOST: dev-mysql                 # 开发环境数据库
  REPLICAS: "1"                      # 副本数
```

```yaml
# ❷ 创建测试环境 ConfigMap
# config-test.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-test              # 测试环境
data:
  LOG_LEVEL: info                    # 测试环境日志级别
  DB_HOST: test-mysql                # 测试环境数据库
  REPLICAS: "2"                      # 副本数
```

```yaml
# ❸ 创建生产环境 ConfigMap
# config-prod.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-prod              # 生产环境
data:
  LOG_LEVEL: warn                    # 生产环境日志级别
  DB_HOST: prod-mysql                # 生产环境数据库
  REPLICAS: "3"                      # 副本数
```

```yaml
# ❹ 创建 Deployment（使用 ConfigMap）
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app                       # Deployment 名称
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app                    # 容器名称
        image: nginx:latest          # 镜像
        env:                         # 环境变量
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config-dev   # 引用 ConfigMap（可切换）
              key: LOG_LEVEL
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config-dev
              key: DB_HOST
```

```bash
# ❺ 应用所有配置
kubectl apply -f config-dev.yaml
kubectl apply -f config-test.yaml
kubectl apply -f config-prod.yaml
kubectl apply -f deployment.yaml

# ❻ 查看当前环境配置
kubectl exec deploy/my-app -- env | grep -E "LOG_LEVEL|DB_HOST"
# 输出：LOG_LEVEL=debug, DB_HOST=dev-mysql

# ❼ 切换到测试环境
# 修改 deployment.yaml 中的 configMapKeyRef.name 为 app-config-test
kubectl apply -f deployment.yaml
kubectl rollout restart deployment/my-app

# ❽ 验证切换
kubectl exec deploy/my-app -- env | grep -E "LOG_LEVEL|DB_HOST"
# 输出：LOG_LEVEL=info, DB_HOST=test-mysql

# ❾ 切换到生产环境
# 修改 deployment.yaml 中的 configMapKeyRef.name 为 app-config-prod
kubectl apply -f deployment.yaml
kubectl rollout restart deployment/my-app

# ❿ 验证切换
kubectl exec deploy/my-app -- env | grep -E "LOG_LEVEL|DB_HOST"
# 输出：LOG_LEVEL=warn, DB_HOST=prod-mysql
```

</details>

---

## 下一章预告

下一章我们会学习 **Volume 存储卷**——如何让容器的数据持久化存储。你会学到 emptyDir、hostPath、PersistentVolume、PersistentVolumeClaim 等概念，以及如何实现数据的持久化和共享。
