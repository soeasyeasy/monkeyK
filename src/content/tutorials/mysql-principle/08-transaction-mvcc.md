---
title: "第8章：事务与 MVCC 原理"
description: "深入理解 ACID 实现原理、MVCC 机制、undo log、版本链"
---

# 第8章：事务与 MVCC 原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 事务的 ACID 特性是怎么实现的？原子性、隔离性到底靠什么保证？
- 什么是 MVCC？为什么它能解决读写冲突？
- undo log 是什么？它和事务回滚有什么关系？
- 版本链是怎么工作的？MVCC 是怎么实现可重复读的？

这一章我们会彻底搞懂 **事务与 MVCC 的底层原理**，从 ACID 的实现机制到 MVCC 的多版本控制，理解 MySQL 是如何保证数据一致性和并发性能的。搞懂了这些，你就能真正理解事务的本质，写出更可靠的并发代码。

---

## 1 为什么需要事务和 MVCC？

### 痛点分析

在数据库操作中，你可能会遇到这些问题：

1. **转账问题**：A 给 B 转账 100 元，A 扣款成功但 B 加款失败，钱凭空消失了
2. **脏读问题**：事务 A 读到了事务 B 未提交的数据，事务 B 回滚后，事务 A 读到的是"脏数据"
3. **不可重复读**：事务 A 两次读同一行数据，结果不一样（被事务 B 修改了）
4. **幻读问题**：事务 A 两次查询，第二次多出了几行数据（事务 B 插入的）

### 生活化类比

把事务想象成**银行转账**：

- **原子性**：转账要么成功（A 扣款 + B 加款），要么失败（都不做），不能只做一半
- **一致性**：转账前后，总金额不变（A 少 100，B 多 100，总额不变）
- **隔离性**：多个转账操作互不干扰，不能互相影响
- **持久性**：转账成功后，即使断电，数据也不会丢失

**MVCC 的作用**：

就像**图书馆的借阅系统**：
- 读者在借阅时，看到的是图书的某个版本（快照）
- 其他读者可以同时借阅其他版本，互不干扰
- 不需要加锁，提高了并发性能

---

## 2 核心原理讲解

### 8.2.1 ACID 特性的实现原理

#### 原子性（Atomicity）

**定义**：事务中的操作要么全部成功，要么全部失败回滚。

**实现机制**：undo log（回滚日志）

**生活化类比**：

就像**写草稿**：
- 你在草稿纸上写了一堆计算
- 如果发现算错了，可以把整页草稿撕掉，重新写
- undo log 就像草稿纸，记录了事务修改前的数据
- 事务失败时，用 undo log 恢复数据

**undo log 的作用**：

```sql
-- 事务开始
BEGIN;

-- 修改数据
UPDATE users SET balance = balance - 100 WHERE id = 1;
-- undo log 记录：修改前的 balance 值

UPDATE users SET balance = balance + 100 WHERE id = 2;
-- undo log 记录：修改前的 balance 值

-- 如果事务失败，用 undo log 回滚
ROLLBACK;
-- 恢复修改前的数据
```

**undo log 的内容**：

| 操作类型 | undo log 记录内容 |
|---------|------------------|
| INSERT | 记录主键值，回滚时删除插入的行 |
| UPDATE | 记录修改前的完整行数据，回滚时恢复 |
| DELETE | 记录删除前的完整行数据，回滚时重新插入 |

#### 一致性（Consistency）

**定义**：事务执行前后，数据库从一个一致性状态转换到另一个一致性状态。

**实现机制**：其他三个特性共同保证

**生活化类比**：

就像**会计记账**：
- 每笔交易都要符合会计规则（借方 = 贷方）
- 转账前后，总金额不变
- 一致性是目的，其他三个特性是手段

**示例**：

```sql
-- 转账前：A 有 1000 元，B 有 500 元，总额 1500 元

BEGIN;
UPDATE users SET balance = balance - 100 WHERE id = 1;  -- A 变成 900 元
UPDATE users SET balance = balance + 100 WHERE id = 2;  -- B 变成 600 元
COMMIT;

-- 转账后：A 有 900 元，B 有 600 元，总额 1500 元
-- 一致性得到保证
```

#### 隔离性（Isolation）

**定义**：并发事务之间互不干扰。

**实现机制**：锁 + MVCC

**生活化类比**：

就像**排队办事**：
- 每个人都在自己的窗口办事（事务隔离）
- 不能互相干扰（隔离性）
- 可以通过加锁（排队）或 MVCC（看快照）实现

**隔离级别**：

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 实现方式 |
|---------|------|-----------|------|---------|
| READ UNCOMMITTED | 可能 | 可能 | 可能 | 无 |
| READ COMMITTED | 不会 | 可能 | 可能 | MVCC |
| REPEATABLE READ | 不会 | 不会 | 可能 | MVCC + 间隙锁 |
| SERIALIZABLE | 不会 | 不会 | 不会 | 锁 |

#### 持久性（Durability）

**定义**：事务一旦提交，其修改永久保存，即使系统故障也不会丢失。

**实现机制**：redo log（重做日志）

**生活化类比**：

就像**写正式文件**：
- 草稿（内存中的数据）写完后，要抄写到正式文件（磁盘）
- redo log 就像正式文件的副本
- 即使草稿丢了，也可以从副本恢复

**redo log 的作用**：

```sql
-- 事务提交时
COMMIT;
-- 1. 先把修改写入 redo log
-- 2. 再写入内存中的数据页
-- 3. 后台异步刷入磁盘

-- 即使断电，也可以从 redo log 恢复数据
```

### 8.2.2 MVCC（多版本并发控制）

**定义**：通过保存数据的多个版本，实现读写不冲突的并发控制机制。

**生活化类比**：

就像**文档的版本管理**：
- 你在编辑文档 v1
- 同事同时编辑文档 v2
- 你们看到的是不同版本，互不干扰
- 不需要加锁，提高了并发性能

**MVCC 的核心组件**：

1. **隐藏列**：每行数据有两个隐藏列
   - DB_TRX_ID：最近修改该行的事务 ID
   - DB_ROLL_PTR：指向该行的上一个版本（在 undo log 中）

2. **undo log**：保存数据的历史版本

3. **版本链**：通过 DB_ROLL_PTR 把多个版本串起来

4. **Read View**：事务读取数据时创建的读视图，决定能看到哪个版本

**示例**：

```sql
-- 初始数据：id=1, name='张三', balance=1000
-- DB_TRX_ID=0（初始版本）

-- 事务 A 开始（trx_id=10）
BEGIN;

-- 事务 A 修改数据
UPDATE users SET balance = 900 WHERE id = 1;
-- 新版本：DB_TRX_ID=10, balance=900
-- 旧版本保存在 undo log：DB_TRX_ID=0, balance=1000
-- 版本链：新版本 -> 旧版本

-- 事务 B 开始（trx_id=11）
BEGIN;

-- 事务 B 读取数据（REPEATABLE READ 隔离级别）
SELECT balance FROM users WHERE id = 1;
-- 事务 B 的 Read View 在事务开始时创建
-- 只能看到 trx_id < 11 的版本
-- 所以看到的是旧版本：balance=1000

-- 事务 A 提交
COMMIT;

-- 事务 B 再次读取
SELECT balance FROM users WHERE id = 1;
-- 事务 B 的 Read View 没有变化
-- 仍然看到旧版本：balance=1000
-- 实现了可重复读
```

### 8.2.3 Read View 的工作原理

**定义**：Read View 是事务在读取数据时创建的读视图，决定能看到哪个版本的数据。

**Read View 的三个重要字段**：

| 字段 | 含义 |
|------|------|
| m_ids | 创建 Read View 时，当前系统中所有活跃（未提交）事务的 ID 列表 |
| min_trx_id | m_ids 中的最小值（最早的活跃事务） |
| max_trx_id | 创建 Read View 时，系统应该分配给下一个事务的 ID（最大值） |
| creator_trx_id | 创建该 Read View 的事务 ID |

**可见性判断规则**：

对于某个版本的行数据，其 DB_TRX_ID 为 trx_id：

1. **trx_id = creator_trx_id**：自己修改的，可见
2. **trx_id < min_trx_id**：在 Read View 创建前已提交，可见
3. **trx_id >= max_trx_id**：在 Read View 创建后才开始的事务，不可见
4. **min_trx_id <= trx_id < max_trx_id**：
   - 如果 trx_id 在 m_ids 中：事务还未提交，不可见
   - 如果 trx_id 不在 m_ids 中：事务已提交，可见

**示例**：

```sql
-- 假设当前活跃事务：trx_id = 10, 11
-- Read View 创建时：
-- m_ids = [10, 11]
-- min_trx_id = 10
-- max_trx_id = 12（下一个事务的 ID）
-- creator_trx_id = 10（事务 A 创建）

-- 版本 1：DB_TRX_ID = 5（在 Read View 创建前已提交）
-- trx_id < min_trx_id，可见

-- 版本 2：DB_TRX_ID = 10（事务 A 自己修改的）
-- trx_id = creator_trx_id，可见

-- 版本 3：DB_TRX_ID = 11（事务 B 修改的，还未提交）
-- trx_id 在 m_ids 中，不可见

-- 版本 4：DB_TRX_ID = 12（在 Read View 创建后才开始）
-- trx_id >= max_trx_id，不可见
```

### 8.2.4 不同隔离级别的 Read View

**READ COMMITTED**：

- 每次 SELECT 都创建一个新的 Read View
- 所以能看到其他事务已提交的修改
- 导致不可重复读

**REPEATABLE READ**：

- 只在第一次 SELECT 时创建 Read View
- 后续 SELECT 复用同一个 Read View
- 所以看不到其他事务的修改
- 实现可重复读

**示例对比**：

```sql
-- 事务 A
BEGIN;
SELECT balance FROM users WHERE id = 1;  -- 读到 1000

-- 事务 B
BEGIN;
UPDATE users SET balance = 900 WHERE id = 1;
COMMIT;

-- 事务 A（READ COMMITTED）
SELECT balance FROM users WHERE id = 1;  -- 读到 900（创建了新 Read View）

-- 事务 A（REPEATABLE READ）
SELECT balance FROM users WHERE id = 1;  -- 读到 1000（复用旧 Read View）
```

---

## 3 基础用法 + 逐行注释

### 8.3.1 创建测试表和数据

```sql
-- 创建用户表
CREATE TABLE users (
    id INT PRIMARY KEY,              -- 主键
    name VARCHAR(50),                -- 用户名
    balance DECIMAL(10, 2)           -- 余额
);

-- 插入测试数据
INSERT INTO users (id, name, balance) VALUES
(1, '张三', 1000.00),
(2, '李四', 500.00);

-- 查看当前事务 ID
SELECT trx_id FROM information_schema.innodb_trx;
-- 查看当前活跃的事务
```

### 8.3.2 验证事务的原子性

```sql
-- 事务 1：转账操作
BEGIN;
-- 开始事务

UPDATE users SET balance = balance - 100 WHERE id = 1;
-- A 扣款 100 元
-- undo log 记录修改前的 balance

UPDATE users SET balance = balance + 100 WHERE id = 2;
-- B 加款 100 元
-- undo log 记录修改前的 balance

-- 模拟事务失败
ROLLBACK;
-- 回滚事务，恢复修改前的数据

-- 验证数据是否恢复
SELECT * FROM users;
-- A 的余额仍然是 1000，B 的余额仍然是 500
-- 原子性得到保证：要么全部成功，要么全部失败
```

### 8.3.3 验证事务的隔离性

```sql
-- 事务 A
BEGIN;
-- 开始事务 A

SELECT balance FROM users WHERE id = 1;
-- 读到 balance = 1000

-- 事务 B（在另一个会话）
BEGIN;
-- 开始事务 B

UPDATE users SET balance = 900 WHERE id = 1;
-- 修改 balance 为 900

-- 事务 A（在 REPEATABLE READ 隔离级别）
SELECT balance FROM users WHERE id = 1;
-- 仍然读到 balance = 1000
-- 因为事务 B 还未提交，事务 A 看不到修改

-- 事务 B
COMMIT;
-- 提交事务 B

-- 事务 A
SELECT balance FROM users WHERE id = 1;
-- 仍然读到 balance = 1000
-- 因为事务 A 的 Read View 没有变化
-- 实现了可重复读

-- 事务 A
COMMIT;
-- 提交事务 A

-- 新事务
SELECT balance FROM users WHERE id = 1;
-- 读到 balance = 900
-- 现在可以看到事务 B 的修改了
```

### 8.3.4 查看 undo log

```sql
-- 查看 undo log 的相关信息
SHOW VARIABLES LIKE 'innodb_undo%';
-- 查看 undo log 的配置

-- 查看 undo tablespace 的信息
SELECT * FROM information_schema.innodb_undo_tablespaces;
-- 查看 undo 表空间

-- 修改数据，触发 undo log 记录
BEGIN;
UPDATE users SET balance = 800 WHERE id = 1;
-- undo log 会记录修改前的 balance = 900

-- 查看当前事务的 undo log
-- （MySQL 没有直接查看 undo log 的命令，但可以通过性能模式查看）
SET GLOBAL innodb_status_output = ON;
-- 开启 InnoDB 状态输出

SHOW ENGINE INNODB STATUS;
-- 查看 InnoDB 的状态信息，包括 undo log 的使用情况

-- 关闭状态输出
SET GLOBAL innodb_status_output = OFF;
```

### 8.3.5 验证 MVCC 的可见性

```sql
-- 事务 A（REPEATABLE READ 隔离级别）
BEGIN;
-- 开始事务 A（trx_id = 10）

SELECT balance FROM users WHERE id = 1;
-- 读到 balance = 900（假设这是事务 A 第一次查询）
-- 创建 Read View：m_ids = [10], min_trx_id = 10, max_trx_id = 11

-- 事务 B（在另一个会话）
BEGIN;
-- 开始事务 B（trx_id = 11）

UPDATE users SET balance = 800 WHERE id = 1;
-- 修改 balance 为 800
-- 新版本的 DB_TRX_ID = 11

-- 事务 A
SELECT balance FROM users WHERE id = 1;
-- 仍然读到 balance = 900
-- 因为事务 B 的 trx_id = 11，在 m_ids 中，不可见
-- MVCC 让事务 A 看到旧版本

-- 事务 B
COMMIT;
-- 提交事务 B

-- 事务 A
SELECT balance FROM users WHERE id = 1;
-- 仍然读到 balance = 900
-- 因为事务 A 的 Read View 没有变化
-- 事务 B 的 trx_id = 11，仍然在 m_ids 中（Read View 创建时的快照）
-- 实现了可重复读

-- 事务 A
COMMIT;
-- 提交事务 A

-- 新事务
SELECT balance FROM users WHERE id = 1;
-- 读到 balance = 800
-- 现在可以看到事务 B 的修改了
```

---

## 4 对比表格

### ACID 特性实现机制对比

| 特性 | 含义 | 实现机制 | 日志类型 |
|------|------|---------|---------|
| 原子性 | 要么全部成功，要么全部失败 | undo log | 回滚日志 |
| 一致性 | 事务前后，数据状态一致 | 其他三个特性共同保证 | - |
| 隔离性 | 并发事务互不干扰 | 锁 + MVCC | - |
| 持久性 | 提交后永久保存 | redo log | 重做日志 |

### 隔离级别对比

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 实现方式 | 性能 |
|---------|------|-----------|------|---------|------|
| READ UNCOMMITTED | 可能 | 可能 | 可能 | 无 | 最高 |
| READ COMMITTED | 不会 | 可能 | 可能 | MVCC | 较高 |
| REPEATABLE READ | 不会 | 不会 | 可能 | MVCC + 间隙锁 | 中等 |
| SERIALIZABLE | 不会 | 不会 | 不会 | 锁 | 最低 |

### undo log vs redo log

| 对比项 | undo log | redo log |
|--------|----------|----------|
| 作用 | 事务回滚 | 崩溃恢复 |
| 记录内容 | 修改前的数据 | 修改后的数据 |
| 日志类型 | 逻辑日志（记录行变化） | 物理日志（记录页变化） |
| 写入时机 | 事务修改数据时 | 事务提交时 |
| 空间管理 | 循环使用 | 循环使用 |
| 保证特性 | 原子性 | 持久性 |

### MVCC 在不同隔离级别的行为

| 隔离级别 | Read View 创建时机 | 可见性 | 是否可重复读 |
|---------|-------------------|--------|-------------|
| READ COMMITTED | 每次 SELECT | 能看到已提交的修改 | 否 |
| REPEATABLE READ | 第一次 SELECT | 只能看到事务开始时的快照 | 是 |

---

## 5 新手常见误区

### 误区 1："MVCC 可以替代锁"

❌ 错误理解：MVCC 不需要加锁，可以完全替代锁机制。

✅ 正确理解：MVCC 只能解决读写冲突（读不阻塞写，写不阻塞读），但不能解决写写冲突。多个事务同时修改同一行数据时，仍然需要加锁（排他锁）。MVCC 和锁是互补的关系，不是替代关系。

### 误区 2："REPEATABLE READ 完全解决了幻读"

❌ 错误理解：REPEATABLE READ 隔离级别完全解决了幻读问题。

✅ 正确理解：REPEATABLE READ 通过 MVCC 解决了快照读（普通 SELECT）的幻读问题，但当前读（SELECT ... FOR UPDATE、UPDATE、DELETE）仍然可能出现幻读。MySQL 通过间隙锁（Gap Lock）来减少当前读的幻读，但不能完全解决。只有 SERIALIZABLE 隔离级别才能完全解决幻读。

### 误区 3："undo log 就是回滚日志"

❌ 错误理解：undo log 只用于事务回滚，没有其他作用。

✅ 正确理解：undo log 有两个主要作用：
1. 事务回滚：恢复修改前的数据
2. MVCC：保存数据的历史版本，供其他事务读取

### 误区 4："事务提交后，undo log 立即删除"

❌ 错误理解：事务提交后，undo log 就没用了，应该立即删除。

✅ 正确理解：事务提交后，undo log 不能立即删除，因为可能还有其他事务在读取旧版本。只有当所有活跃事务都提交后，undo log 才能被清理。MySQL 使用 purge 线程来异步清理不再需要的 undo log。

### 误区 5："Read View 只在事务开始时创建一次"

❌ 错误理解：Read View 在事务开始时创建一次，整个事务期间不变。

✅ 正确理解：Read View 的创建时机取决于隔离级别：
- READ COMMITTED：每次 SELECT 都创建新的 Read View
- REPEATABLE READ：只在第一次 SELECT 时创建，后续复用

---

## 6 动手练习

### 练习 1：验证事务的原子性（基础）

有以下转账操作，请验证事务的原子性：

```sql
-- 事务：A 给 B 转账 100 元
BEGIN;
UPDATE users SET balance = balance - 100 WHERE id = 1;
UPDATE users SET balance = balance + 100 WHERE id = 2;
-- 模拟事务失败
ROLLBACK;
```

请验证回滚后，数据是否恢复到事务开始前的状态。

<details>
<summary>点击查看答案</summary>

**验证步骤**：

```sql
-- 1. 查看事务开始前的数据
SELECT * FROM users;
-- 假设 A 的余额是 1000，B 的余额是 500

-- 2. 开始事务
BEGIN;

-- 3. 修改数据
UPDATE users SET balance = balance - 100 WHERE id = 1;
-- A 的余额变成 900

UPDATE users SET balance = balance + 100 WHERE id = 2;
-- B 的余额变成 600

-- 4. 查看修改后的数据
SELECT * FROM users;
-- A 的余额是 900，B 的余额是 600

-- 5. 回滚事务
ROLLBACK;

-- 6. 查看回滚后的数据
SELECT * FROM users;
-- A 的余额恢复到 1000，B 的余额恢复到 500
-- 原子性得到验证：事务回滚后，数据恢复到修改前的状态
```

**原理**：
- undo log 记录了修改前的数据
- ROLLBACK 时，用 undo log 恢复数据
- 保证了事务的原子性：要么全部成功，要么全部失败

</details>

### 练习 2：验证 MVCC 的可重复读（进阶）

有以下两个并发事务，请验证在 REPEATABLE READ 隔离级别下，事务 A 是否能实现可重复读：

```sql
-- 事务 A
BEGIN;
SELECT balance FROM users WHERE id = 1;  -- 第一次查询

-- 事务 B（在另一个会话）
BEGIN;
UPDATE users SET balance = 800 WHERE id = 1;
COMMIT;

-- 事务 A
SELECT balance FROM users WHERE id = 1;  -- 第二次查询
```

请解释事务 A 两次查询的结果是否相同，以及 MVCC 的工作原理。

<details>
<summary>点击查看答案</summary>

**验证步骤**：

```sql
-- 事务 A（REPEATABLE READ 隔离级别）
BEGIN;
-- 事务 A 开始（trx_id = 10）

SELECT balance FROM users WHERE id = 1;
-- 第一次查询，读到 balance = 900
-- 创建 Read View：m_ids = [10], min_trx_id = 10, max_trx_id = 11

-- 事务 B（在另一个会话）
BEGIN;
-- 事务 B 开始（trx_id = 11）

UPDATE users SET balance = 800 WHERE id = 1;
-- 修改 balance 为 800
-- 新版本的 DB_TRX_ID = 11

COMMIT;
-- 事务 B 提交

-- 事务 A
SELECT balance FROM users WHERE id = 1;
-- 第二次查询，仍然读到 balance = 900
-- 因为事务 A 的 Read View 没有变化
-- 事务 B 的 trx_id = 11，在 m_ids 中，不可见
-- MVCC 让事务 A 看到旧版本

COMMIT;
-- 事务 A 提交
```

**原理**：
- REPEATABLE READ 隔离级别下，Read View 在第一次 SELECT 时创建
- 后续 SELECT 复用同一个 Read View
- 事务 B 的修改（trx_id = 11）在事务 A 的 Read View 中不可见
- 实现了可重复读：事务 A 两次查询结果相同

</details>

### 练习 3：分析 MVCC 的可见性（挑战）

有以下场景，请分析事务 C 能看到哪个版本的数据：

```sql
-- 初始数据：balance = 1000（DB_TRX_ID = 0）

-- 事务 A（trx_id = 10）
BEGIN;
UPDATE users SET balance = 900 WHERE id = 1;
COMMIT;
-- 新版本：DB_TRX_ID = 10, balance = 900

-- 事务 B（trx_id = 11）
BEGIN;
UPDATE users SET balance = 800 WHERE id = 1;
COMMIT;
-- 新版本：DB_TRX_ID = 11, balance = 800

-- 事务 C（trx_id = 12）
BEGIN;
-- 事务 C 开始，创建 Read View
-- m_ids = [12], min_trx_id = 12, max_trx_id = 13

SELECT balance FROM users WHERE id = 1;
-- 事务 C 能看到哪个版本的数据？
```

<details>
<summary>点击查看答案</summary>

**分析过程**：

```sql
-- 版本链：
-- 版本 3：DB_TRX_ID = 11, balance = 800（事务 B 修改）
-- 版本 2：DB_TRX_ID = 10, balance = 900（事务 A 修改）
-- 版本 1：DB_TRX_ID = 0, balance = 1000（初始版本）

-- 事务 C 的 Read View：
-- m_ids = [12]（事务 C 自己）
-- min_trx_id = 12
-- max_trx_id = 13
-- creator_trx_id = 12

-- 可见性判断：
-- 版本 3：DB_TRX_ID = 11
-- 11 < min_trx_id（12），在 Read View 创建前已提交
-- 可见！事务 C 读到 balance = 800
```

**答案**：
- 事务 C 能看到 balance = 800（事务 B 修改的版本）
- 因为事务 B 的 trx_id = 11，在事务 C 的 Read View 创建前已提交（11 < min_trx_id = 12）
- 所以事务 C 能看到事务 B 的修改

</details>

---

## 下一章预告

下一章我们会学习 **锁机制原理**。你会了解 MySQL 中的各种锁类型（共享锁、排他锁、间隙锁等）、锁的粒度（表锁、行锁）、死锁的产生原因和解决方法，以及锁优化的技巧。这些是保证并发控制的核心技术。
