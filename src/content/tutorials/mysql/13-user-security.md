---
title: "第13章：用户权限与安全"
description: "CREATE USER、GRANT、REVOKE、SQL 注入防护"
---

# 第13章：用户权限与安全

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么不能一直用 root 用户操作数据库？
- 如何给不同的用户分配不同的权限？
- 什么是 SQL 注入？如何防止？

这一章就是为了解答这些问题。我们会从生活中的例子出发，帮你搞懂用户管理和权限控制，再学会如何防止 SQL 注入攻击。

---

## 13.1 为什么需要用户权限管理？

### 权限混乱的痛苦

假设你有一个公司数据库，里面有：
- 开发人员：需要创建表、修改结构
- 测试人员：需要查询和插入测试数据
- 运营人员：只需要查询数据
- 财务人员：需要修改订单和财务数据

如果所有人都用 root 用户，会发生什么？
- 运营人员可能误删表
- 测试人员可能修改生产数据
- 任何人都能看到所有敏感信息

这就像公司大门的钥匙人人都有一把，谁都能进任何房间，包括财务室和机房。

### 权限管理的解决方式：按需分配

权限管理就是给不同的人分配不同的"钥匙"。

打个比方：公司有门禁系统，员工只能进自己的办公室，管理员能进机房，保洁阿姨只能进公共区域。每个人只能做自己能做的事。

| 对比项 | 不用权限管理 | 用权限管理 |
|--------|--------------|------------|
| 安全性 | 低，任何人都能做所有事 | 高，只能做被允许的事 |
| 误操作风险 | 高，可能误删重要数据 | 低，限制了危险操作 |
| 责任追踪 | 无法追踪谁做了什么 | 可以追踪每个用户的操作 |
| 合规性 | 不符合安全规范 | 符合最小权限原则 |

> 一句话总结：权限管理是数据库的"门禁系统"，让每个人只能做自己被允许的事。

---

## 13.2 用户管理

### 创建用户

```sql
-- 创建用户
CREATE USER 'developer'@'localhost' IDENTIFIED BY 'password123';
-- 创建名为 developer 的用户，只能从本地登录，密码为 password123

CREATE USER 'remote_user'@'192.168.1.%' IDENTIFIED BY 'password456';
-- 创建用户，只能从 192.168.1.x 网段登录

CREATE USER 'admin'@'%' IDENTIFIED BY 'admin_pass';
-- 创建用户，可以从任何地方登录（% 表示任意主机）

-- 查看用户列表
SELECT user, host FROM mysql.user;
-- 显示所有用户及其允许登录的主机
```

### 删除用户

```sql
-- 删除用户
DROP USER 'developer'@'localhost';
-- 删除 developer 用户

-- 修改密码
ALTER USER 'admin'@'%' IDENTIFIED BY 'new_password';
-- 修改 admin 用户的密码
```

### 用户命名规则

用户名格式：`'用户名'@'主机'`

| 主机格式 | 含义 | 示例 |
|----------|------|------|
| localhost | 只能从本地登录 | 'user'@'localhost' |
| % | 可以从任何地方登录 | 'user'@'%' |
| 192.168.1.% | 只能从指定网段登录 | 'user'@'192.168.1.%' |
| 192.168.1.100 | 只能从指定 IP 登录 | 'user'@'192.168.1.100' |

---

## 13.3 权限管理

### GRANT：授予权限

```sql
-- 授予查询权限
GRANT SELECT ON company.* TO 'developer'@'localhost';
-- 授予 developer 用户对 company 数据库所有表的查询权限

-- 授予多个权限
GRANT SELECT, INSERT, UPDATE ON company.users TO 'developer'@'localhost';
-- 授予对 company.users 表的查询、插入、更新权限

-- 授予所有权限
GRANT ALL PRIVILEGES ON company.* TO 'admin'@'%';
-- 授予 admin 用户对 company 数据库的所有权限

-- 授予创建表的权限
GRANT CREATE ON company.* TO 'developer'@'localhost';
-- 授予创建表的权限

-- 刷新权限
FLUSH PRIVILEGES;
-- 使权限立即生效
```

### REVOKE：撤销权限

```sql
-- 撤销权限
REVOKE INSERT, UPDATE ON company.users FROM 'developer'@'localhost';
-- 撤销 developer 用户对 company.users 表的插入和更新权限

-- 撤销所有权限
REVOKE ALL PRIVILEGES ON company.* FROM 'developer'@'localhost';
-- 撤销 developer 用户对 company 数据库的所有权限

-- 查看用户权限
SHOW GRANTS FOR 'developer'@'localhost';
-- 显示 developer 用户的所有权限
```

### 权限级别

MySQL 的权限可以在不同级别授予：

| 级别 | 语法 | 作用范围 |
|------|------|----------|
| 全局级别 | GRANT ... ON *.* | 所有数据库 |
| 数据库级别 | GRANT ... ON db.* | 指定数据库 |
| 表级别 | GRANT ... ON db.table | 指定表 |
| 列级别 | GRANT SELECT(id, name) ON db.table | 指定列 |

```sql
-- 全局级别
GRANT SELECT ON *.* TO 'admin'@'%';
-- 可以查询所有数据库的所有表

-- 数据库级别
GRANT SELECT ON company.* TO 'developer'@'localhost';
-- 只能查询 company 数据库

-- 表级别
GRANT SELECT ON company.users TO 'developer'@'localhost';
-- 只能查询 company.users 表

-- 列级别
GRANT SELECT(id, name, email) ON company.users TO 'developer'@'localhost';
-- 只能查询 id、name、email 三列
```

---

## 13.4 角色管理

### 什么是角色？

角色是一组权限的集合，可以分配给多个用户。

打个比方：公司有"开发人员"、"测试人员"、"运营人员"等角色，每个角色有固定的权限。新员工入职时，只需要分配对应的角色，不用逐个设置权限。

### 创建和使用角色

```sql
-- 创建角色
CREATE ROLE 'developer_role';
-- 创建名为 developer_role 的角色

-- 给角色授予权限
GRANT SELECT, INSERT, UPDATE, DELETE ON company.* TO 'developer_role';
-- 给角色授予 company 数据库的增删改查权限

-- 将角色分配给用户
GRANT 'developer_role' TO 'dev1'@'localhost';
GRANT 'developer_role' TO 'dev2'@'localhost';
-- 将角色分配给 dev1 和 dev2 两个用户

-- 查看用户的角色
SHOW GRANTS FOR 'dev1'@'localhost';
-- 显示 dev1 用户的权限和角色

-- 撤销角色
REVOKE 'developer_role' FROM 'dev1'@'localhost';
-- 从 dev1 用户撤销 developer_role 角色
```

### 角色的优势

| 对比项 | 不用角色 | 用角色 |
|--------|----------|--------|
| 权限管理 | 每个用户单独设置权限 | 先设置角色权限，再分配给用户 |
| 维护成本 | 修改权限要改多个用户 | 只改角色权限 |
| 一致性 | 容易出现权限不一致 | 同一角色的用户权限一致 |
| 适用场景 | 用户少，权限简单 | 用户多，权限复杂 |

---

## 13.5 SQL 注入防护

### 什么是 SQL 注入？

SQL 注入是一种攻击方式，攻击者通过在输入中插入 SQL 代码，让数据库执行非预期的操作。

打个比方：你去餐厅点菜，菜单上写"菜名"。正常人会写"宫保鸡丁"，但攻击者会写"菜名'; DROP TABLE 菜单; --"，结果餐厅真的把菜单表删了。

### SQL 注入示例

假设有一个登录查询：

```sql
-- 危险的写法
SELECT * FROM users WHERE username = '输入的用户名' AND password = '输入的密码';
```

如果攻击者输入：
- 用户名：`admin' --`
- 密码：任意

实际执行的 SQL 变成：

```sql
SELECT * FROM users WHERE username = 'admin' --' AND password = '任意';
-- -- 后面的内容被注释掉了，相当于只检查用户名
```

结果：攻击者不用密码就登录了！

更严重的注入：
- 用户名：`admin'; DROP TABLE users; --`

实际执行：

```sql
SELECT * FROM users WHERE username = 'admin'; DROP TABLE users; --' AND password = '任意';
-- 执行了两条语句：查询和删除表
```

### 防护方法 1：预处理语句

预处理语句是防止 SQL 注入最有效的方法。

```sql
-- 预处理语句
PREPARE stmt FROM 'SELECT * FROM users WHERE username = ? AND password = ?';
-- 准备语句，? 是占位符

SET @username = 'admin';
SET @password = 'password123';
EXECUTE stmt USING @username, @password;
-- 执行语句，传入参数

DEALLOCATE PREPARE stmt;
-- 释放语句
```

预处理语句的原理：
- SQL 结构和数据是分开的
- 数据不会被当作 SQL 代码执行
- 即使输入包含 SQL 代码，也只会被当作普通字符串

### 防护方法 2：输入验证

```sql
-- 验证输入
SELECT * FROM users WHERE username = ? AND LENGTH(username) <= 50;
-- 限制用户名长度

-- 使用正则表达式验证
SELECT * FROM users WHERE email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$';
-- 验证邮箱格式
```

### 防护方法 3：最小权限原则

```sql
-- 给应用用户只分配必要的权限
GRANT SELECT, INSERT, UPDATE ON company.* TO 'app_user'@'localhost';
-- 不给 DELETE 和 DROP 权限，即使被注入也无法删除数据
```

| 防护方法 | 原理 | 效果 |
|----------|------|------|
| 预处理语句 | SQL 结构和数据分离 | 最有效，推荐使用 |
| 输入验证 | 检查输入格式 | 辅助手段 |
| 最小权限 | 限制用户权限 | 减少损失 |
| 转义特殊字符 | 转义 ' " \ 等字符 | 辅助手段 |

---

## 13.6 密码安全策略

### 密码复杂度要求

```sql
-- 查看密码策略
SHOW VARIABLES LIKE 'validate_password%';
-- 显示密码验证相关的配置

-- 设置密码最小长度
SET GLOBAL validate_password.length = 8;
-- 密码至少 8 位

-- 设置密码必须包含数字
SET GLOBAL validate_password.mixed_case_count = 1;
-- 至少包含 1 个大写字母和 1 个小写字母

SET GLOBAL validate_password.number_count = 1;
-- 至少包含 1 个数字

SET GLOBAL validate_password.special_char_count = 1;
-- 至少包含 1 个特殊字符
```

### 密码过期策略

```sql
-- 设置密码过期时间
ALTER USER 'developer'@'localhost' PASSWORD EXPIRE INTERVAL 90 DAY;
-- 密码 90 天后过期

-- 强制用户下次登录时修改密码
ALTER USER 'developer'@'localhost' PASSWORD EXPIRE;
-- 用户下次登录时必须修改密码

-- 查看密码过期配置
SHOW VARIABLES LIKE 'default_password_lifetime';
-- 显示默认密码有效期
```

### 密码安全建议

| 建议 | 说明 |
|------|------|
| 密码长度至少 8 位 | 越长越安全 |
| 包含大小写字母、数字、特殊字符 | 增加复杂度 |
| 定期更换密码 | 建议 90 天更换一次 |
| 不使用默认密码 | root 用户必须修改默认密码 |
| 不同用户使用不同密码 | 避免密码泄露影响多人 |

---

## 13.7 新手常见误区

### 误区 1："一直用 root 用户开发"

错！root 用户拥有所有权限，一旦代码有 SQL 注入漏洞，攻击者可以删除整个数据库。开发时应该创建权限受限的用户，只给必要的权限。

### 误区 2："密码越简单越好"

错！简单密码容易被破解。生产环境的密码应该包含大小写字母、数字、特殊字符，长度至少 8 位。不要用 123456、password 这种弱密码。

### 误区 3："GRANT 后不需要 FLUSH PRIVILEGES"

错！GRANT 语句执行后，权限不会立即生效，需要执行 FLUSH PRIVILEGES 刷新权限缓存。虽然 MySQL 5.7 之后会自动刷新，但手动执行更保险。

### 误区 4："预处理语句会影响性能"

不是的。预处理语句在第一次执行时会编译优化，后续执行只需要传入不同的参数，比每次都重新编译 SQL 更快。而且预处理语句可以防止 SQL 注入，是必须使用的技术。

### 误区 5："权限分配后不能撤销"

错！可以随时用 REVOKE 撤销权限。而且撤销权限后立即生效，用户不能再执行被撤销的操作。如果用户已经登录，需要断开连接后重新登录才会生效。

---

## 13.8 动手练习

### 练习 1：创建用户并分配权限

创建一个用户 operator，只能从本地登录，密码为 operator123。授予该用户对 company 数据库的查询权限。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建用户
CREATE USER 'operator'@'localhost' IDENTIFIED BY 'operator123';

-- 授予查询权限
GRANT SELECT ON company.* TO 'operator'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证权限
SHOW GRANTS FOR 'operator'@'localhost';
```

</details>

### 练习 2：使用预处理语句

编写一个预处理语句，根据用户名查询用户信息，并执行查询。

<details>
<summary>点击查看答案</summary>

```sql
-- 准备预处理语句
PREPARE stmt FROM 'SELECT * FROM users WHERE username = ?';

-- 设置参数
SET @username = 'admin';

-- 执行语句
EXECUTE stmt USING @username;

-- 释放语句
DEALLOCATE PREPARE stmt;
```

</details>

### 练习 3（挑战）：创建角色并分配

创建一个角色 analyst_role，具有查询 company 数据库的权限。然后创建两个用户 analyst1 和 analyst2，将角色分配给他们。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建角色
CREATE ROLE 'analyst_role';

-- 给角色授予查询权限
GRANT SELECT ON company.* TO 'analyst_role';

-- 创建用户
CREATE USER 'analyst1'@'localhost' IDENTIFIED BY 'analyst123';
CREATE USER 'analyst2'@'localhost' IDENTIFIED BY 'analyst123';

-- 将角色分配给用户
GRANT 'analyst_role' TO 'analyst1'@'localhost';
GRANT 'analyst_role' TO 'analyst2'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证
SHOW GRANTS FOR 'analyst1'@'localhost';
```

</details>

---

## 下一章预告

下一章我们会学习 **备份与恢复**。你会了解如何备份数据库、如何恢复数据、以及如何使用二进制日志进行时间点恢复。这些是保护数据安全的重要技术，每个 DBA 都必须掌握。
