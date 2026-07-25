---
title: "第15章：Redis 安全与权限"
description: "ACL 访问控制、网络安全配置、SSL/TLS 加密"
---

# 第15章：Redis 安全与权限

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 如何防止未授权访问？
- 如何给不同用户设置不同权限？
- 如何保护 Redis 的网络安全？
- 什么是 ACL？怎么使用？
- 生产环境如何保障 Redis 安全？

这一章会详细讲解 Redis 的安全机制和权限管理，帮你构建安全的 Redis 环境。

---

## 15.1 为什么需要安全配置？

### 痛点分析

Redis 默认配置是不安全的，如果不做安全配置，可能面临：

- **未授权访问**：任何人都可以连接 Redis，读写数据
- **数据泄露**：敏感数据被窃取
- **恶意攻击**：被黑客利用，执行危险命令
- **数据篡改**：数据被恶意修改或删除

### 安全威胁案例

```
2018 年，某公司 Redis 未设置密码，暴露在公网，被黑客入侵：
- 黑客通过 Redis 写入 SSH 公钥
- 获取服务器 root 权限
- 勒索公司，要求支付比特币

教训：Redis 安全配置至关重要！
```

---

## 15.2 基础安全配置

### 设置密码

```conf
# redis.conf

# 设置密码
requirepass yourStrongPassword123!

# 主从复制时，从节点连接主节点的密码
masterauth yourStrongPassword123!
```

```bash
# 带密码连接
redis-cli -a yourStrongPassword123!

# 或者连接后认证
redis-cli
> AUTH yourStrongPassword123!
OK
```

### 绑定 IP

```conf
# redis.conf

# 只允许本地访问
bind 127.0.0.1

# 允许特定 IP 访问
bind 127.0.0.1 192.168.1.100

# ⚠️ 不要绑定 0.0.0.0，会允许所有 IP 访问
```

### 保护模式

```conf
# redis.conf

# 开启保护模式（默认开启）
protected-mode yes

# 保护模式下，如果没有设置密码且绑定了 0.0.0.0，只允许本地连接
```

### 禁用危险命令

```conf
# redis.conf

# 禁用或重命名危险命令
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command CONFIG ""
rename-command KEYS ""

# 或者重命名为复杂名称
rename-command CONFIG "CONFIG_b840fc02d524045429941cc15f59e41cb7be6c52"
```

---

## 15.3 ACL 访问控制

### 概念解释

ACL（Access Control List）是 Redis 6.0 引入的细粒度权限控制机制，可以为不同用户设置不同的权限。

打个比方：

> ACL 就像公司的门禁系统：不同员工有不同的门禁卡，有的可以进入所有区域（管理员），有的只能进入特定区域（普通用户），有的只能看不能动（只读用户）。

### 创建用户

```bash
# 创建用户
> ACL SETUSER alice on >alicePassword ~cached:* +get +set +del
OK

# 参数说明：
# alice：用户名
# on：启用用户
# >alicePassword：设置密码
# ~cached:*：允许访问 cached:* 的键
# +get +set +del：允许执行 get、set、del 命令

# 查看用户
> ACL GETUSER alice
1) "flags"
2) 1) "on"
3) "passwords"
4) 1) "alicePassword"
5) "commands"
6) "+get +set +del"
7) "keys"
8) "cached:*"
9) "channels"
10) ""

# 查看用户列表
> ACL LIST
1) "user default on nopass ~* &* +@all"
2) "user alice on #9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08 ~cached:* +get +set +del"
```

### 用户权限

```bash
# 权限类型
~pattern    # 键权限，如 ~cached:* 表示可以访问 cached:* 的键
&pattern    # 频道权限，如 &chat:* 表示可以发布/订阅 chat:* 频道
+command    # 允许执行命令，如 +get 表示允许执行 GET 命令
-command    # 禁止执行命令，如 -flushdb 表示禁止执行 FLUSHDB 命令
+@category  # 允许执行某类命令，如 +@read 表示允许所有读命令
-@category  # 禁止执行某类命令，如 -@dangerous 表示禁止所有危险命令

# 命令分类
@read       # 读命令
@write      # 写命令
@admin      # 管理命令
@dangerous  # 危险命令
@all        # 所有命令
```

### 创建只读用户

```bash
# 创建只读用户
> ACL SETUSER bob on >bobPassword ~* +@read -@dangerous
OK

# bob 只能执行读命令，不能执行危险命令
```

### 创建管理员用户

```bash
# 创建管理员用户
> ACL SETUSER admin on >adminPassword ~* &* +@all
OK

# admin 可以访问所有键、所有频道、执行所有命令
```

### 用户认证

```bash
# 使用用户名和密码连接
redis-cli --user alice --pass alicePassword

# 或者连接后认证
redis-cli
> AUTH alice alicePassword
OK

# 查看当前用户
> ACL WHOAMI
"alice"
```

### 用户管理

```bash
# 禁用用户
> ACL SETUSER alice off
OK

# 启用用户
> ACL SETUSER alice on
OK

# 删除用户
> ACL DELUSER alice
(integer) 1

# 修改用户密码
> ACL SETUSER alice >newPassword
OK

# 重置用户
> ACL SETUSER alice reset
OK
```

### ACL 持久化

```conf
# redis.conf

# ACL 文件路径
aclfile /etc/redis/users.acl

# 修改 ACL 后保存到文件
> ACL SAVE
OK

# 重新加载 ACL 文件
> ACL LOAD
OK
```

---

## 15.4 网络安全配置

### 端口配置

```conf
# redis.conf

# 默认端口 6379，建议修改为其他端口
port 6380

# TLS 端口（启用 SSL 时）
tls-port 6381
```

### 超时配置

```conf
# redis.conf

# 客户端超时时间（秒），0 表示不超时
timeout 300

# TCP keepalive（秒）
tcp-keepalive 60
```

### 连接数限制

```conf
# redis.conf

# 最大客户端连接数
maxclients 10000
```

### SSL/TLS 配置

```conf
# redis.conf

# 启用 TLS
tls-port 6381
tls-cert-file /etc/redis/redis.crt
tls-key-file /etc/redis/redis.key
tls-ca-cert-file /etc/redis/ca.crt

# 要求客户端使用 TLS
tls-auth-clients yes

# TLS 协议版本
tls-protocols "TLSv1.2 TLSv1.3"

# 加密套件
tls-ciphers "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384"
```

### 生成 SSL 证书

```bash
# 生成 CA 私钥
openssl genrsa -out ca.key 4096

# 生成 CA 证书
openssl req -x509 -new -nodes -sha256 -key ca.key -days 3650 -out ca.crt

# 生成 Redis 私钥
openssl genrsa -out redis.key 2048

# 生成证书签名请求
openssl req -new -key redis.key -out redis.csr

# 签发证书
openssl x509 -req -sha256 -days 365 -in redis.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out redis.crt
```

### 客户端连接 SSL

```bash
# 使用 redis-cli 连接 SSL
redis-cli --tls \
  --cert /etc/redis/redis.crt \
  --key /etc/redis/redis.key \
  --cacert /etc/redis/ca.crt \
  -h 127.0.0.1 -p 6381
```

---

## 15.5 生产环境安全清单

### 基础安全

| 配置项 | 建议值 | 说明 |
| --- | --- | --- |
| **requirepass** | 强密码 | 必须设置密码 |
| **bind** | 127.0.0.1 或特定 IP | 不要绑定 0.0.0.0 |
| **protected-mode** | yes | 开启保护模式 |
| **port** | 非默认端口 | 修改默认端口 |

### 权限控制

| 配置项 | 建议值 | 说明 |
| --- | --- | --- |
| **ACL** | 细粒度权限 | 为不同用户设置不同权限 |
| **禁用危险命令** | FLUSHDB、FLUSHALL 等 | 防止误操作 |
| **只读用户** | 读操作使用只读用户 | 减少误操作风险 |

### 网络安全

| 配置项 | 建议值 | 说明 |
| --- | --- | --- |
| **防火墙** | 只开放必要端口 | 限制访问来源 |
| **SSL/TLS** | 启用加密 | 保护数据传输 |
| **VPN** | 内网访问 | 不直接暴露公网 |

### 监控告警

| 配置项 | 建议值 | 说明 |
| --- | --- | --- |
| **慢查询日志** | 开启 | 监控慢查询 |
| **连接监控** | 告警阈值 | 异常连接告警 |
| **命令审计** | 记录关键操作 | 安全审计 |

---

## 15.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **基础安全** | 密码、绑定 IP、保护模式 |
| **ACL** | 细粒度权限控制 |
| **网络安全** | SSL/TLS、防火墙 |
| **危险命令** | 禁用或重命名 |
| **监控审计** | 慢查询、连接监控 |

---

## 15.7 新手常见误区

### 误区 1："Redis 在内网，不需要密码"

**错！** 内网也可能被攻破，或者内部人员恶意操作。必须设置密码和 ACL 权限控制。

### 误区 2："设置了密码就安全了"

**不够！** 密码只是基础安全，还需要配置 ACL、禁用危险命令、启用 SSL 等多层防护。

### 误区 3："ACL 太复杂，不需要用"

**不对！** ACL 可以细粒度控制权限，避免误操作和越权访问。生产环境应该为不同应用设置不同用户和权限。

### 误区 4："SSL 会影响性能，不应该用"

**不一定！** SSL 确实会有一定性能开销，但对于敏感数据传输是必要的。可以在内网使用非加密连接，外网使用 SSL。

---

## 15.8 动手练习

### 练习 1：基础安全配置

配置 Redis 的基础安全：
1. 设置强密码
2. 绑定特定 IP
3. 开启保护模式

<details>
<summary>点击查看答案</summary>

```conf
# redis.conf

# 1. 设置强密码（至少 16 位，包含大小写字母、数字、特殊字符）
requirepass MyStr0ngP@ssw0rd!2024

# 2. 绑定特定 IP（只允许本地和内网访问）
bind 127.0.0.1 192.168.1.100

# 3. 开启保护模式
protected-mode yes

# 4. 修改默认端口
port 6380

# 重启 Redis 使配置生效
```

</details>

### 练习 2：ACL 权限控制

创建三个用户：
1. admin：管理员，所有权限
2. app：应用用户，只能访问 app:* 的键
3. readonly：只读用户，只能读操作

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建管理员用户
> ACL SETUSER admin on >AdminP@ss2024 ~* &* +@all
OK

# 2. 创建应用用户
> ACL SETUSER app on >AppP@ss2024 ~app:* +get +set +del +expire +ttl
OK

# 3. 创建只读用户
> ACL SETUSER readonly on >ReadOnlyP@ss2024 ~* +@read -@dangerous
OK

# 4. 保存 ACL 配置
> ACL SAVE
OK

# 5. 验证权限
redis-cli --user app --pass AppP@ss2024
> SET app:key1 value1
OK
> SET other:key2 value2
(error) NOPERM this user has no permissions to run the 'set' command or access the key 'other:key2'

redis-cli --user readonly --pass ReadOnlyP@ss2024
> GET app:key1
"value1"
> SET app:key2 value2
(error) NOPERM this user has no permissions to run the 'set' command
```

</details>

### 练习 3（挑战）：完整安全配置

实现一个完整的 Redis 安全配置：
1. 基础安全（密码、绑定 IP）
2. ACL 权限控制
3. 禁用危险命令
4. SSL/TLS 加密

<details>
<summary>点击查看答案</summary>

```conf
# redis.conf

# 基础安全
requirepass MyStr0ngP@ssw0rd!2024
bind 127.0.0.1 192.168.1.100
protected-mode yes
port 6380

# 禁用危险命令
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command KEYS ""

# SSL/TLS
tls-port 6381
tls-cert-file /etc/redis/redis.crt
tls-key-file /etc/redis/redis.key
tls-ca-cert-file /etc/redis/ca.crt
tls-auth-clients yes
tls-protocols "TLSv1.2 TLSv1.3"

# ACL
aclfile /etc/redis/users.acl

# 超时和连接数
timeout 300
tcp-keepalive 60
maxclients 10000
```

```bash
# /etc/redis/users.acl
user admin on >AdminP@ss2024 ~* &* +@all
user app on >AppP@ss2024 ~app:* +get +set +del +expire +ttl
user readonly on >ReadOnlyP@ss2024 ~* +@read -@dangerous
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 综合实战项目**——也就是如何在实际项目中应用 Redis。你会学到秒杀系统、排行榜、会话管理、消息队列等实战案例，掌握 Redis 的真实应用场景。
