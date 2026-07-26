---
title: "第13章：安全与权限"
description: "用户认证、角色授权、TLS/SSL 加密、审计日志"
---

# 第13章：安全与权限

## 本章导读

在学习 MongoDB 安全配置之前，你可能会有这些疑问：

1. **为什么需要配置安全？** 数据库不是在内网就安全了吗？
2. **用户认证和角色授权有什么区别？** 是不是只要设置密码就可以了？
3. **TLS/SSL 加密会影响性能吗？** 生产环境必须开启吗？
4. **审计日志有什么用？** 会不会占用太多存储空间？

如果你正在思考这些问题，说明你已经意识到安全的重要性了。本章将带你从零开始，全面掌握 MongoDB 的安全配置。

## 为什么需要安全配置

### 痛点分析

想象一下这些场景：

- 你的数据库暴露在公网，没有任何密码保护
- 内部员工误删了重要数据，无法追踪是谁操作的
- 数据传输过程中被黑客截获，敏感信息泄露
- 不同应用需要不同的访问权限，但所有人都用同一个账号

这些都不是假设，而是真实发生过的安全事故。2018 年，超过 7 万个 MongoDB 实例被黑客删除，原因就是没有配置认证。

### 生活化类比

把 MongoDB 想象成一栋办公楼：

- **用户认证** = 门禁卡（你是谁？）
- **角色授权** = 不同楼层的通行权限（你能进哪些房间？）
- **TLS/SSL** =  armored 运钞车（数据传输过程是否安全？）
- **审计日志** = 监控录像（谁在什么时间做了什么？）

### 代码对比

**不安全的配置：**
```javascript
// 任何人都可以连接并删除数据
db.users.drop() // 危险！没有任何保护
```

**安全的配置：**
```javascript
// 需要认证，且只有管理员才能删除
db.users.drop() // 报错：未授权
```

## 核心原理讲解

### MongoDB 安全体系

MongoDB 的安全体系包含四个层次：

1. **认证层**：验证用户身份
2. **授权层**：控制用户权限
3. **传输层**：加密数据传输
4. **审计层**：记录操作日志

### 通俗类比

| 安全层次 | 生活类比 | MongoDB 实现 |
|---------|---------|-------------|
| 认证 | 身份证验证 | SCRAM、x.509 证书 |
| 授权 | 门禁权限 | 角色（Role） |
| 传输加密 | 加密信封 | TLS/SSL |
| 审计 | 监控录像 | 审计日志 |

## 基础用法

### 1. 用户认证

MongoDB 支持多种认证机制，最常用的是 SCRAM 和 x.509。

#### SCRAM 认证（默认）

```javascript
// 创建用户
db.createUser({
  user: "admin",           // 用户名
  pwd: "password123",      // 密码
  roles: [                 // 角色列表
    { role: "root", db: "admin" }  // 管理员角色
  ]
})

// 连接时认证
// mongo -u admin -p password123 --authenticationDatabase admin
```

#### x.509 证书认证

```javascript
// 生成证书（Linux/Mac）
// openssl req -new -x509 -days 365 -nodes -text \
//   -out mongodb-server.crt \
//   -keyout mongodb-server.key

// 配置文件 mongod.conf
// security:
//   clusterAuthMode: x509
// net:
//   tls:
//     mode: requireTLS
//     certificateKeyFile: /etc/ssl/mongodb-server.pem
//     CAFile: /etc/ssl/ca.pem
```

### 2. 创建用户与角色管理

```javascript
// 切换到 admin 数据库
use admin

// 创建普通用户
db.createUser({
  user: "appUser",              // 用户名 ✅
  pwd: "appPassword",           // 密码 ✅
  roles: [                      // 角色数组 ✅
    { role: "readWrite", db: "myapp" }  // 对 myapp 数据库有读写权限
  ]
})

// 错误示例：密码太简单
db.createUser({
  user: "test",
  pwd: "123",  // ❌ 密码太弱，容易被破解
  roles: [{ role: "root", db: "admin" }]  // ❌ 权限过大
})

// 查看当前用户
db.getUser("appUser")

// 修改密码
db.updateUser("appUser", {
  pwd: "newPassword"
})

// 删除用户
db.dropUser("appUser")
```

### 3. 内置角色

MongoDB 提供了丰富的内置角色：

```javascript
// read 角色：只能读取数据
db.createUser({
  user: "reader",
  pwd: "readerPass",
  roles: [{ role: "read", db: "myapp" }]
})
// reader 可以执行：db.users.find()
// reader 不能执行：db.users.insertOne() ❌

// readWrite 角色：可以读写数据
db.createUser({
  user: "writer",
  pwd: "writerPass",
  roles: [{ role: "readWrite", db: "myapp" }]
})
// writer 可以执行：db.users.insertOne() ✅
// writer 不能执行：db.users.drop() ❌

// dbAdmin 角色：可以管理数据库结构
db.createUser({
  user: "dbManager",
  pwd: "dbPass",
  roles: [{ role: "dbAdmin", db: "myapp" }]
})
// dbManager 可以执行：db.createCollection() ✅
// dbManager 不能执行：db.users.find() ❌（没有 read 权限）

// root 角色：超级管理员
db.createUser({
  user: "superAdmin",
  pwd: "superPass",
  roles: [{ role: "root", db: "admin" }]
})
// superAdmin 可以执行任何操作 ✅
```

### 4. 自定义角色

```javascript
// 创建自定义角色
db.createRole({
  role: "appRole",              // 角色名
  privileges: [                 // 权限列表
    {
      resource: { db: "myapp", collection: "users" },
      actions: ["find", "insert", "update"]  // 允许的操作
    },
    {
      resource: { db: "myapp", collection: "logs" },
      actions: ["find"]  // 只能读取日志
    }
  ],
  roles: []  // 继承的其他角色
})

// 将自定义角色分配给用户
db.grantRolesToUser("appUser", [
  { role: "appRole", db: "myapp" }
])

// 查看角色权限
db.getRole("appRole", { showPrivileges: true })
```

### 5. 网络隔离与 bind_ip

```yaml
# mongod.conf 配置文件

# 只允许本地连接（开发环境）
net:
  bindIp: 127.0.0.1  # ✅ 安全：只监听本地

# 允许特定 IP 连接（生产环境）
net:
  bindIp: 192.168.1.100,192.168.1.101  # ✅ 只允许内网 IP

# 错误示例：监听所有网卡
net:
  bindIp: 0.0.0.0  # ❌ 危险：暴露在公网
```

### 6. TLS/SSL 加密配置

```yaml
# mongod.conf 配置文件

net:
  tls:
    mode: requireTLS              # 强制使用 TLS
    certificateKeyFile: /etc/ssl/mongodb.pem  # 服务器证书
    CAFile: /etc/ssl/ca.pem       # CA 证书
    allowConnectionsWithoutCertificates: false  # 客户端必须提供证书

# 客户端连接
// mongo --tls \
//   --tlsCertificateKeyFile client.pem \
//   --tlsCAFile ca.pem \
//   mongodb://localhost:27017
```

### 7. 审计日志

```yaml
# mongod.conf 配置文件

auditLog:
  destination: file               # 输出到文件
  path: /var/log/mongodb/audit.log  # 日志文件路径
  format: JSON                    # JSON 格式

# 或者输出到系统日志
auditLog:
  destination: syslog
```

审计日志示例：
```json
{
  "atype": "authCheck",
  "ts": { "$date": "2024-01-15T10:30:00Z" },
  "local": { "ip": "192.168.1.100", "port": 27017 },
  "remote": { "ip": "192.168.1.101", "port": 54321 },
  "users": [{ "user": "appUser", "db": "myapp" }],
  "param": { "command": "find", "ns": "myapp.users" }
}
```

## 对比表格

### 不同角色权限对比

| 角色 | 读取数据 | 写入数据 | 管理结构 | 管理用户 | 管理服务器 |
|------|---------|---------|---------|---------|-----------|
| read | ✅ | ❌ | ❌ | ❌ | ❌ |
| readWrite | ✅ | ✅ | ❌ | ❌ | ❌ |
| dbAdmin | ❌ | ❌ | ✅ | ❌ | ❌ |
| userAdmin | ❌ | ❌ | ❌ | ✅ | ❌ |
| clusterAdmin | ❌ | ❌ | ❌ | ❌ | ✅ |
| root | ✅ | ✅ | ✅ | ✅ | ✅ |

### 认证方式对比

| 认证方式 | 安全性 | 配置复杂度 | 适用场景 |
|---------|-------|-----------|---------|
| SCRAM | 高 | 低 | 一般应用 |
| x.509 证书 | 极高 | 高 | 高安全要求 |
| LDAP | 高 | 中 | 企业内网 |
| Kerberos | 极高 | 高 | 大型企业 |

## 新手常见误区

### 误区 1：只设置密码就够了

**错误认识：** "我设置了密码，数据库就安全了。"

**正确理解：** 密码只是第一步，还需要：
- 限制网络访问（bindIp）
- 配置合适的角色权限
- 启用 TLS/SSL 加密传输
- 开启审计日志

### 误区 2：所有用户都用 root 角色

**错误做法：**
```javascript
db.createUser({
  user: "app",
  pwd: "pass",
  roles: [{ role: "root", db: "admin" }]  // ❌ 权限过大
})
```

**正确做法：**
```javascript
db.createUser({
  user: "app",
  pwd: "pass",
  roles: [{ role: "readWrite", db: "myapp" }]  // ✅ 最小权限原则
})
```

### 误区 3：忽略 TLS/SSL

**错误认识：** "内网传输不需要加密。"

**正确理解：** 即使是内网，也可能存在：
- 内网嗅探攻击
- 中间人攻击
- 合规要求（如 GDPR、等保）

### 误区 4：审计日志会影响性能

**错误认识：** "开启审计日志会拖慢数据库。"

**正确理解：** 
- 审计日志对性能影响通常在 5% 以内
- 可以通过配置过滤条件，只记录关键操作
- 安全收益远大于性能损失

### 误区 5：bindIp 设置为 0.0.0.0

**错误做法：**
```yaml
net:
  bindIp: 0.0.0.0  # ❌ 暴露在所有网卡
```

**正确做法：**
```yaml
net:
  bindIp: 192.168.1.100  # ✅ 只监听特定 IP
```

## 动手练习

### 练习 1：创建不同权限的用户

**需求：** 为博客系统创建三个用户：
1. 读者（只能读取文章）
2. 作者（可以读写文章，但不能删除）
3. 管理员（完全权限）

<details>
<summary>点击查看答案</summary>

```javascript
use admin

// 1. 读者用户
db.createUser({
  user: "reader",
  pwd: "readerPass",
  roles: [{ role: "read", db: "blog" }]
})

// 2. 作者用户
db.createUser({
  user: "author",
  pwd: "authorPass",
  roles: [{ role: "readWrite", db: "blog" }]
})

// 3. 管理员用户
db.createUser({
  user: "admin",
  pwd: "adminPass",
  roles: [{ role: "dbAdmin", db: "blog" }]
})
```

</details>

### 练习 2：创建自定义角色

**需求：** 创建一个角色，允许对 `products` 集合进行所有操作，但对 `orders` 集合只能读取。

<details>
<summary>点击查看答案</summary>

```javascript
use admin

db.createRole({
  role: "shopRole",
  privileges: [
    {
      resource: { db: "shop", collection: "products" },
      actions: ["find", "insert", "update", "remove"]
    },
    {
      resource: { db: "shop", collection: "orders" },
      actions: ["find"]
    }
  ],
  roles: []
})

// 创建用户并分配角色
db.createUser({
  user: "shopUser",
  pwd: "shopPass",
  roles: [{ role: "shopRole", db: "admin" }]
})
```

</details>

### 练习 3：配置安全连接

**需求：** 编写 mongod.conf 配置，要求：
1. 只允许本地和内网连接
2. 强制使用 TLS/SSL
3. 开启审计日志

<details>
<summary>点击查看答案</summary>

```yaml
# mongod.conf

# 网络配置
net:
  port: 27017
  bindIp: 127.0.0.1,192.168.1.100  # 只允许本地和内网
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/ssl/mongodb.pem
    CAFile: /etc/ssl/ca.pem

# 安全配置
security:
  authorization: enabled

# 审计日志
auditLog:
  destination: file
  path: /var/log/mongodb/audit.log
  format: JSON
```

</details>

## 安全最佳实践清单

1. **启用认证**：生产环境必须开启 `authorization: enabled`
2. **最小权限原则**：每个用户只授予必要的最小权限
3. **强密码策略**：密码长度至少 12 位，包含大小写字母、数字、特殊字符
4. **限制网络访问**：使用 `bindIp` 限制监听地址，不要使用 `0.0.0.0`
5. **启用 TLS/SSL**：所有连接都应使用加密传输
6. **定期审计**：开启审计日志，定期检查异常操作
7. **及时更新**：保持 MongoDB 版本更新，修复安全漏洞
8. **备份加密**：备份文件也要加密存储
9. **分离管理账号**：日常操作不要使用 root 账号
10. **网络隔离**：数据库服务器不要直接暴露在公网

## 下一章预告

下一章我们将学习 MongoDB 的备份与恢复。数据安全不仅包括防止未授权访问，还包括防止数据丢失。你将学到：

- 如何使用 mongodump 和 mongorestore 进行备份
- 文件系统快照备份的优势
- 时间点恢复（PITR）的实现
- 副本集和分片集群的备份策略

数据是企业的核心资产，掌握备份恢复技术，才能在意外发生时快速恢复业务。
