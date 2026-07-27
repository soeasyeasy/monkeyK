---
title: "第10章：事务与 ACID"
description: "事务概念、隔离级别、MVCC、锁机制"
---

# 第10章：事务与 ACID

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是事务？为什么需要事务？
- ACID 特性是什么？
- 有哪些隔离级别？有什么区别？
- 什么是 MVCC？如何工作？
- 锁机制是什么？有哪些类型？

这一章就是为了解答这些问题。我们会先搞清楚 **事务的基本概念**，再学习**ACID 特性**，最后掌握**隔离级别和 MVCC 机制**。

---

## 1 为什么需要事务？

### 痛点分析

想象一下，你要进行银行转账：从 A 账户转 1000 元到 B 账户。

```sql
-- ❌ 没有事务保护：可能只执行了一半
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;  -- A 账户扣款
-- 如果这里出错（断电、网络中断等）
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;  -- B 账户收款（未执行）
```

问题：
- ❌ 数据不一致：A 账户扣了钱，B 账户没收到
- ❌ 无法回滚：出错后无法恢复
- ❌ 并发问题：多人同时操作可能出错

### 解决方案

使用事务：

```sql
-- ✅ 使用事务保护
BEGIN;  -- 开始事务

UPDATE accounts SET balance = balance - 1000 WHERE id = 1;  -- A 账户扣款
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;  -- B 账户收款

COMMIT;  -- 提交事务（所有操作生效）

-- 如果出错：
ROLLBACK;  -- 回滚事务（所有操作撤销）
```

优势：
- ✅ 保证数据一致性
- ✅ 可以回滚
- ✅ 并发安全

> **一句话总结**：事务是一组操作的集合，要么全部成功，要么全部失败。

---

## 2 核心原理

### 概念解释

**事务（Transaction）**

事务是一个或多个 SQL 语句的集合，作为一个整体执行。

打个比方：

> 事务就像是**签合同**：
> - 所有条款都同意，合同生效（COMMIT）
> - 有一条不同意，合同作废（ROLLBACK）

**ACID 特性**

| 特性 | 全称 | 说明 |
| --- | --- | --- |
| Atomicity | 原子性 | 事务中的所有操作要么全部成功，要么全部失败 |
| Consistency | 一致性 | 事务执行前后，数据库保持一致状态 |
| Isolation | 隔离性 | 多个事务并发执行时，互不干扰 |
| Durability | 持久性 | 事务提交后，结果永久保存 |

---

## 3 基础用法

### 准备工作

创建示例表：

```sql
-- 创建账户表
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    balance DECIMAL(10, 2) CHECK (balance >= 0)
);

-- 插入示例数据
INSERT INTO accounts (name, balance) VALUES
    ('张三', 5000),
    ('李四', 3000);
```

### 基本事务操作

**BEGIN**

开始一个事务。

```sql
BEGIN;
-- 或者
BEGIN TRANSACTION;
```

**COMMIT**

提交事务，使所有操作生效。

```sql
COMMIT;
-- 或者
COMMIT TRANSACTION;
```

**ROLLBACK**

回滚事务，撤销所有操作。

```sql
ROLLBACK;
-- 或者
ROLLBACK TRANSACTION;
```

### 转账示例

```sql
-- 开始事务
BEGIN;

-- A 账户扣款
UPDATE accounts 
SET balance = balance - 1000 
WHERE id = 1;

-- B 账户收款
UPDATE accounts 
SET balance = balance + 1000 
WHERE id = 2;

-- 检查余额是否足够
-- 如果 A 账户余额不足，回滚
-- 这里可以添加检查逻辑

-- 提交事务
COMMIT;
```

### 带错误处理的事务

```sql
-- 开始事务
BEGIN;

-- A 账户扣款
UPDATE accounts 
SET balance = balance - 1000 
WHERE id = 1;

-- 如果出错，回滚
-- 在应用程序中捕获错误后执行 ROLLBACK

-- B 账户收款
UPDATE accounts 
SET balance = balance + 1000 
WHERE id = 2;

-- 提交事务
COMMIT;
```

---

## 4 进阶用法

### 隔离级别

隔离级别决定了事务之间的可见性。

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| READ UNCOMMITTED | 可能 | 可能 | 可能 |
| READ COMMITTED | 不可能 | 可能 | 可能 |
| REPEATABLE READ | 不可能 | 不可能 | 可能 |
| SERIALIZABLE | 不可能 | 不可能 | 不可能 |

**设置隔离级别**

```sql
-- 设置事务隔离级别
BEGIN ISOLATION LEVEL READ COMMITTED;

-- 或者
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

**READ COMMITTED（默认）**

```sql
-- 事务 A
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- 读取余额：5000

-- 事务 B（在事务 A 执行期间）
BEGIN;
UPDATE accounts SET balance = 4000 WHERE id = 1;
COMMIT;

-- 事务 A 再次读取
SELECT balance FROM accounts WHERE id = 1;  -- 读取余额：4000（已提交的新值）
COMMIT;
```

**REPEATABLE READ**

```sql
-- 事务 A
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1;  -- 读取余额：5000

-- 事务 B（在事务 A 执行期间）
BEGIN;
UPDATE accounts SET balance = 4000 WHERE id = 1;
COMMIT;

-- 事务 A 再次读取
SELECT balance FROM accounts WHERE id = 1;  -- 读取余额：5000（快照值）
COMMIT;
```

### SAVEPOINT

SAVEPOINT 允许在事务中设置保存点，可以回滚到保存点。

```sql
BEGIN;

-- 第一步操作
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;

-- 设置保存点
SAVEPOINT step1;

-- 第二步操作
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;

-- 如果第二步出错，回滚到保存点
ROLLBACK TO SAVEPOINT step1;

-- 重新执行第二步
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;

-- 提交事务
COMMIT;
```

### 隐式事务

PostgreSQL 默认每条 SQL 语句都是一个隐式事务。

```sql
-- 隐式事务（自动提交）
UPDATE accounts SET balance = 4000 WHERE id = 1;  -- 自动提交

-- 显式事务
BEGIN;
UPDATE accounts SET balance = 4000 WHERE id = 1;
COMMIT;
```

---

## 5 MVCC 机制

### 概念解释

**MVCC（Multi-Version Concurrency Control）**

MVCC 是多版本并发控制，通过维护数据的多个版本来实现并发控制。

打个比方：

> MVCC 就像是**文档的版本控制**：
> - 每次修改都创建一个新版本
> - 不同事务看到不同版本
> - 不需要锁，提高并发性能

### MVCC 工作原理

1. 每次 UPDATE 或 DELETE 时，不直接修改原数据
2. 创建一个新版本的数据
3. 事务根据隔离级别看到相应版本的数据
4. 旧版本数据在不再需要时被清理（VACUUM）

```sql
-- 初始数据
SELECT * FROM accounts WHERE id = 1;
-- id | name | balance
-- 1  | 张三 | 5000

-- 事务 A 更新
BEGIN;
UPDATE accounts SET balance = 4000 WHERE id = 1;

-- 事务 B 读取（READ COMMITTED）
BEGIN;
SELECT * FROM accounts WHERE id = 1;  -- 看到新值 4000（如果事务 A 已提交）

-- 事务 B 读取（REPEATABLE READ）
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT * FROM accounts WHERE id = 1;  -- 看到旧值 5000（快照）
```

---

## 6 锁机制

### 锁类型

| 锁类型 | 说明 | 示例 |
| --- | --- | --- |
| 行级锁 | 锁定单行 | `SELECT ... FOR UPDATE` |
| 表级锁 | 锁定整个表 | `LOCK TABLE` |
| 咨询锁 | 应用级锁 | `pg_advisory_lock` |

### 行级锁

```sql
-- 锁定查询的行，防止其他事务修改
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- 其他事务尝试锁定同一行会等待
-- 直到当前事务提交或回滚

COMMIT;
```

### 表级锁

```sql
-- 锁定整个表
BEGIN;
LOCK TABLE accounts IN EXCLUSIVE MODE;

-- 执行操作
UPDATE accounts SET balance = 4000 WHERE id = 1;

COMMIT;
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 事务 | 一组操作的集合，要么全部成功，要么全部失败 |
| ACID | 原子性、一致性、隔离性、持久性 |
| 隔离级别 | READ UNCOMMITTED、READ COMMITTED、REPEATABLE READ、SERIALIZABLE |
| MVCC | 多版本并发控制 |
| 锁机制 | 行级锁、表级锁、咨询锁 |
| SAVEPOINT | 事务保存点 |

---

## 8 新手常见误区

### 误区 1："事务会自动提交"

**错！** PostgreSQL 默认自动提交每条语句，但显式 BEGIN 后必须手动 COMMIT 或 ROLLBACK。

```sql
-- ❌ 错误：忘记提交
BEGIN;
UPDATE accounts SET balance = 4000 WHERE id = 1;
-- 没有 COMMIT 或 ROLLBACK，事务会一直挂着

-- ✅ 正确：记得提交
BEGIN;
UPDATE accounts SET balance = 4000 WHERE id = 1;
COMMIT;
```

### 误区 2："隔离级别越高越好"

**错！** 高隔离级别会降低并发性能。

建议：
- ✅ 默认使用 READ COMMITTED
- ✅ 需要强一致性时使用 REPEATABLE READ
- ✅ 避免使用 SERIALIZABLE（除非必要）

### 误区 3："MVCC 不需要 VACUUM"

**错！** MVCC 会产生死元组，需要定期 VACUUM 清理。

```sql
-- 手动清理死元组
VACUUM accounts;

-- 自动清理（PostgreSQL 默认开启）
-- autovacuum = on
```

### 误区 4："FOR UPDATE 可以防止所有并发问题"

**错！** FOR UPDATE 只能防止行级冲突，不能防止幻读。

```sql
-- FOR UPDATE 锁定行
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- 但其他事务仍然可以插入新行（幻读）
```

---

## 9 动手练习

### 练习 1：基础事务

创建一个 `orders` 表，实现以下事务：
- 创建订单
- 扣减库存
- 如果库存不足，回滚事务

<details>
<summary>点击查看答案</summary>

```sql
-- 创建订单表
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    quantity INTEGER,
    total_amount DECIMAL(10, 2)
);

-- 创建产品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    stock INTEGER CHECK (stock >= 0),
    price DECIMAL(10, 2)
);

-- 插入产品数据
INSERT INTO products (name, stock, price) VALUES ('iPhone', 100, 7999);

-- 事务：创建订单并扣减库存
BEGIN;

-- 检查库存
SELECT stock FROM products WHERE id = 1;

-- 扣减库存
UPDATE products SET stock = stock - 1 WHERE id = 1 AND stock > 0;

-- 创建订单
INSERT INTO orders (product_id, quantity, total_amount)
VALUES (1, 1, 7999);

COMMIT;
```

</details>

### 练习 2：隔离级别

演示 READ COMMITTED 和 REPEATABLE READ 的区别。

<details>
<summary>点击查看答案</summary>

```sql
-- 会话 1：READ COMMITTED
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- 读取：5000

-- 会话 2：更新并提交
BEGIN;
UPDATE accounts SET balance = 4000 WHERE id = 1;
COMMIT;

-- 会话 1：再次读取
SELECT balance FROM accounts WHERE id = 1;  -- 读取：4000（新值）
COMMIT;

-- 会话 1：REPEATABLE READ
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1;  -- 读取：5000

-- 会话 2：更新并提交
BEGIN;
UPDATE accounts SET balance = 3000 WHERE id = 1;
COMMIT;

-- 会话 1：再次读取
SELECT balance FROM accounts WHERE id = 1;  -- 读取：5000（快照值）
COMMIT;
```

</details>

### 练习 3（挑战）：复杂事务

实现一个完整的转账事务，包含以下要求：
- 检查转出账户余额是否足够
- 扣减转出账户余额
- 增加转入账户余额
- 记录转账日志
- 如果任何步骤失败，回滚事务

<details>
<summary>点击查看答案</summary>

```sql
-- 创建转账日志表
CREATE TABLE transfer_logs (
    id SERIAL PRIMARY KEY,
    from_account INTEGER,
    to_account INTEGER,
    amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 转账事务
BEGIN;

-- 检查余额
DO $$
DECLARE
    balance DECIMAL(10, 2);
BEGIN
    SELECT balance INTO balance FROM accounts WHERE id = 1;
    IF balance < 1000 THEN
        RAISE EXCEPTION '余额不足';
    END IF;
END $$;

-- 扣减转出账户
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;

-- 增加转入账户
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;

-- 记录日志
INSERT INTO transfer_logs (from_account, to_account, amount)
VALUES (1, 2, 1000);

COMMIT;
```

</details>

---

## 下一章预告

下一章我们会学习 **存储过程与函数**——了解如何创建和使用存储过程与函数，掌握 PL/pgSQL 语言，实现复杂的业务逻辑。
