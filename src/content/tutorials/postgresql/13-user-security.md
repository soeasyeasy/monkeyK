---
title: "第13章：用户权限与安全"
description: "CREATE USER、GRANT、REVOKE、角色管理、SSL 连接"
---

# 第13章：用户权限与安全

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何创建和管理数据库用户？
- 如何分配和回收权限？
- 什么是角色？角色和用户有什么区别？
- 如何配置 SSL 连接？
- 有哪些安全最佳实践？

这一章就是为了解答这些问题。我们会先搞清楚 **用户和角色的基本概念**，再学习**权限管理**，最后掌握**安全配置**。

---

## 1 为什么需要用户权限管理？

### 痛点分析

想象一下，你的数据库只有一个超级用户（postgres）。所有应用和开发者都使用这个用户：

```sql
-- ❌ 所有操作都使用超级用户
psql -U postgres -d mydb

-- 问题：
-- 1. 安全风险：任何代码漏洞都可能导致数据泄露
-- 2. 权限过大：应用可以删除表、修改结构
-- 3. 无法追踪：不知道是谁执行了什么操作
```

### 解决方案

使用用户权限管理：

```sql
-- ✅ 创建专用用户
CREATE USER app_user WITH PASSWORD 'secure_password';

-- 分配最小权限
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT USAGE ON SEQUENCE users_id_seq TO app_user;

-- 应用使用专用用户连接
psql -U app_user -d mydb
```

优势：
- ✅ 最小权限原则
- ✅ 权限分离
- ✅ 操作可追踪

> **一句话总结**：用户权限管理可以控制谁可以访问什么数据，执行什么操作，是数据库安全的基础。

---

## 2 核心原理

### 概念解释

**用户（User）**

用户是可以连接数据库的实体。

**角色（Role）**

角色是权限的集合，可以分配给用户或其他角色。

打个比方：

> 用户就像是**员工**：
> - 每个员工有自己的账号
> - 员工可以属于不同的角色（部门）

> 角色就像是**职位**：
> - 每个职位有特定的权限
> - 员工被分配到职位后，获得该职位的权限

**权限类型**

| 权限类型 | 说明 | 示例 |
| --- | --- | --- |
| SELECT | 查询数据 | `SELECT * FROM users` |
| INSERT | 插入数据 | `INSERT INTO users ...` |
| UPDATE | 更新数据 | `UPDATE users SET ...` |
| DELETE | 删除数据 | `DELETE FROM users` |
| CREATE | 创建对象 | `CREATE TABLE ...` |
| DROP | 删除对象 | `DROP TABLE ...` |
| ALTER | 修改对象 | `ALTER TABLE ...` |
| USAGE | 使用对象 | 序列、类型等 |
| EXECUTE | 执行函数 | `SELECT function()` |

---

## 3 基础用法

### 创建用户

```sql
-- 创建用户（带密码）
CREATE USER app_user WITH PASSWORD 'secure_password';

-- 创建用户（带选项）
CREATE USER app_user WITH 
    PASSWORD 'secure_password'
    VALID UNTIL '2025-12-31'  -- 密码过期时间
    CONNECTION LIMIT 10;      -- 连接数限制

-- 创建用户（无密码，仅用于本地连接）
CREATE USER local_user;
```

### 创建角色

```sql
-- 创建角色
CREATE ROLE app_role;

-- 角色可以登录
CREATE ROLE app_role WITH LOGIN PASSWORD 'secure_password';

-- 角色不能登录（仅用于权限分组）
CREATE ROLE app_role NOLOGIN;
```

### 分配权限

**GRANT 命令**

```sql
-- 分配表权限
GRANT SELECT ON users TO app_user;
GRANT INSERT, UPDATE ON orders TO app_user;
GRANT ALL PRIVILEGES ON products TO app_user;

-- 分配序列权限
GRANT USAGE ON SEQUENCE users_id_seq TO app_user;

-- 分配数据库权限
GRANT CONNECT ON DATABASE mydb TO app_user;

-- 分配模式权限
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;

-- 分配角色给用户
GRANT app_role TO app_user;
```

### 回收权限

**REVOKE 命令**

```sql
-- 回收表权限
REVOKE SELECT ON users FROM app_user;
REVOKE ALL PRIVILEGES ON orders FROM app_user;

-- 回收序列权限
REVOKE USAGE ON SEQUENCE users_id_seq FROM app_user;

-- 回收角色
REVOKE app_role FROM app_user;
```

### 查看权限

```sql
-- 查看用户权限
\du

-- 查看表权限
\dp users

-- 查看当前用户
SELECT current_user;

-- 查看会话用户
SELECT session_user;
```

---

## 4 进阶用法

### 角色继承

```sql
-- 创建角色
CREATE ROLE read_role;
CREATE ROLE write_role;

-- 分配权限给角色
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_role;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO write_role;

-- 创建用户并分配角色
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT read_role TO app_user;
GRANT write_role TO app_user;

-- 角色继承（默认开启）
-- app_user 自动获得 read_role 和 write_role 的所有权限
```

### 行级安全（RLS）

```sql
-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY user_policy ON users
    FOR SELECT
    USING (department_id = current_setting('app.department_id')::INTEGER);

-- 设置会话变量
SET app.department_id = 1;

-- 查询时自动过滤
SELECT * FROM users;  -- 只返回 department_id = 1 的行
```

### SSL 连接

**配置 SSL**

```bash
# 1. 生成证书
openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key

# 2. 设置权限
chmod 600 server.key

# 3. 移动到数据目录
mv server.crt server.key /var/lib/postgresql/data/

# 4. 修改 postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# 5. 修改 pg_hba.conf
hostssl all all 0.0.0.0/0 md5

# 6. 重启 PostgreSQL
sudo systemctl restart postgresql
```

**客户端连接**

```bash
# 使用 SSL 连接
psql "host=localhost dbname=mydb user=app_user sslmode=require"
```

### 审计日志

```sql
-- 配置审计日志（postgresql.conf）
log_connections = on
log_disconnections = on
log_statement = 'all'  -- 记录所有 SQL 语句
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d '

-- 重启 PostgreSQL
sudo systemctl restart postgresql
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| CREATE USER | 创建用户 |
| CREATE ROLE | 创建角色 |
| GRANT | 分配权限 |
| REVOKE | 回收权限 |
| ALTER USER | 修改用户 |
| DROP USER | 删除用户 |
| 行级安全 | 控制行级访问 |
| SSL | 加密连接 |
| 审计日志 | 记录操作 |

---

## 6 新手常见误区

### 误区 1："所有应用都使用 postgres 用户"

**错！** 应该为每个应用创建专用用户。

```sql
-- ❌ 错误：所有应用使用同一个用户
psql -U postgres

-- ✅ 正确：每个应用使用专用用户
CREATE USER app1_user WITH PASSWORD 'password1';
CREATE USER app2_user WITH PASSWORD 'password2';
```

### 误区 2："GRANT ALL 总是最好的"

**错！** 应该遵循最小权限原则。

```sql
-- ❌ 错误：分配所有权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;

-- ✅ 正确：只分配需要的权限
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT ON products TO app_user;
```

### 误区 3："密码可以很简单"

**错！** 密码应该足够复杂。

```sql
-- ❌ 错误：简单密码
CREATE USER app_user WITH PASSWORD '123456';

-- ✅ 正确：复杂密码
CREATE USER app_user WITH PASSWORD 'Str0ng!P@ssw0rd#2024';
```

### 误区 4："不需要定期审查权限"

**错！** 应该定期审查用户权限。

```sql
-- 查看所有用户
\du

-- 查看表权限
\dp

-- 审查权限分配
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.role_table_grants
WHERE grantor = 'postgres';
```

---

## 7 动手练习

### 练习 1：创建用户和角色

创建一个只读用户和一个读写用户。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建只读角色
CREATE ROLE read_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_role;

-- 创建读写角色
CREATE ROLE write_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO write_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO write_role;

-- 创建只读用户
CREATE USER readonly_user WITH PASSWORD 'readonly_password';
GRANT read_role TO readonly_user;

-- 创建读写用户
CREATE USER readwrite_user WITH PASSWORD 'readwrite_password';
GRANT write_role TO readwrite_user;

-- 验证权限
\du
```

</details>

### 练习 2：行级安全

为 `users` 表启用行级安全，只允许用户查看自己部门的数据。

<details>
<summary>点击查看答案</summary>

```sql
-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY department_policy ON users
    FOR SELECT
    USING (department_id = current_setting('app.department_id')::INTEGER);

-- 设置会话变量
SET app.department_id = 1;

-- 查询时自动过滤
SELECT * FROM users;  -- 只返回 department_id = 1 的行

-- 重置会话变量
RESET app.department_id;
```

</details>

### 练习 3（挑战）：完整权限管理

为一个电商系统设计完整的权限管理方案。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建角色
CREATE ROLE app_readonly;
CREATE ROLE app_readwrite;
CREATE ROLE app_admin;

-- 分配权限
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

GRANT SELECT, INSERT, UPDATE ON users, orders, order_items TO app_readwrite;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_readwrite;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_admin;

-- 创建用户
CREATE USER web_app WITH PASSWORD 'web_password';
CREATE USER api_app WITH PASSWORD 'api_password';
CREATE USER admin_user WITH PASSWORD 'admin_password';

-- 分配角色
GRANT app_readonly TO web_app;
GRANT app_readwrite TO api_app;
GRANT app_admin TO admin_user;

-- 设置默认权限（未来创建的表）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO app_readwrite;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_admin;
```

</details>

---

## 下一章预告

下一章我们会学习 **备份与恢复**——了解如何使用 pg_dump 和 pg_restore 备份数据库，掌握 WAL 日志和时间点恢复（PITR）技术，以及备份策略的最佳实践。
