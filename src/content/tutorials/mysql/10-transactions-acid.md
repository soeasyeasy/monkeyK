---
title: "第10章：事务与 ACID"
description: "事务概念、隔离级别、锁机制、死锁处理"
---

# 第10章：事务与 ACID

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是事务？为什么银行转账必须用事务？
- 事务的 ACID 到底是什么？听起来很抽象
- 隔离级别是什么？为什么还有好几种？

这一章就是为了解答这些问题。我们会用银行转账这个经典场景，帮你搞懂事务的核心概念，再深入理解隔离级别和锁机制。

---

## 10.1 为什么需要事务？

### 没有事务的灾难

想象一下这个场景：小明要给小红转账 1000 元。

这个操作分两步：
1. 小明账户扣 1000 元
2. 小红账户加 1000 元

如果没有事务，假设第一步执行成功了，但第二步执行时系统崩溃了，会发生什么？

结果：小明少了 1000 元，但小红没收到。这 1000 元凭空消失了！

这就是没有事务的后果——**操作不完整，数据不一致**。

### 事务的解决方式：要么全做，要么全不做

事务的核心思想是：**把多个操作绑在一起，要么全部成功，要么全部失败**。

还是转账的例子：
- 如果两步都成功，转账完成
- 如果任何一步失败，两步都撤销，回到转账前的状态

| 对比项 | 没有事务 | 有事务 |
|--------|----------|--------|
| 操作方式 | 每一步独立执行 | 多步操作绑定在一起 |
| 失败处理 | 已执行的步骤无法撤销 | 任何一步失败，全部撤销 |
| 数据一致性 | 无法保证 | 严格保证 |
| 适用场景 | 单步操作 | 多步关联操作 |

> 一句话总结：事务就是数据库的"后悔药"，出错了可以全部回退，保证数据不会处于中间状态。

---

## 10.2 事务的基本操作

### BEGIN / COMMIT / ROLLBACK

```sql
-- 开始事务
BEGIN;
-- 标记事务的开始，之后的所有操作都在事务中

-- 小明账户扣 1000 元
UPDATE accounts SET balance = balance - 1000 WHERE user_id = 1;
-- 从 user_id=1 的账户扣除 1000 元

-- 小红账户加 1000 元
UPDATE accounts SET balance = balance + 1000 WHERE user_id = 2;
-- 给 user_id=2 的账户增加 1000 元

-- 提交事务
COMMIT;
-- 确认提交，所有修改永久生效

-- 如果中途出错，可以回滚
ROLLBACK;
-- 撤销事务中所有操作，回到 BEGIN 之前的状态
```

### 实际例子：完整的转账流程

```sql
-- 开始事务
BEGIN;

-- 第一步：检查小明账户余额是否足够
SELECT balance FROM accounts WHERE user_id = 1;
-- 查询 user_id=1 的余额，假设返回 5000

-- 第二步：如果余额足够，执行转账
UPDATE accounts SET balance = balance - 1000 WHERE user_id = 1;
-- 小明账户扣 1000 元

UPDATE accounts SET balance = balance + 1000 WHERE user_id = 2;
-- 小红账户加 1000 元

-- 第三步：确认无误，提交事务
COMMIT;
-- 如果中间任何一步出错，执行 ROLLBACK 撤销所有操作
```

---

## 10.3 ACID 特性详解

事务有四个核心特性，简称 ACID：

### A - 原子性（Atomicity）

原子性是指事务中的操作要么全部成功，要么全部失败。

打个比方：你去超市买东西，结账时要么全部商品都买成功，要么全部失败。不可能买到一半，一半付了钱，一半没付。

```sql
BEGIN;
UPDATE accounts SET balance = balance - 1000 WHERE user_id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE user_id = 2;
-- 如果这里出错，两步操作都会撤销
COMMIT;
```

### C - 一致性（Consistency）

一致性是指事务执行前后，数据的状态是一致的。

打个比方：转账前，小明和小红总共有 10000 元。转账后，总金额还是 10000 元，只是分配变了。

```sql
-- 转账前：小明 5000 + 小红 5000 = 10000
-- 转账 1000 元后：小明 4000 + 小红 6000 = 10000
-- 总金额不变，这就是一致性
```

### I - 隔离性（Isolation）

隔离性是指多个事务并发执行时，互不干扰。

打个比方：你和朋友同时在 ATM 上操作，你的操作不会影响朋友的操作。

```sql
-- 事务 A：小明转账给小红
BEGIN;
UPDATE accounts SET balance = balance - 1000 WHERE user_id = 1;

-- 事务 B：小明查询余额（在事务 A 提交前）
SELECT balance FROM accounts WHERE user_id = 1;
-- 根据隔离级别不同，可能看到旧值或新值

COMMIT;
```

### D - 持久性（Durability）

持久性是指事务一旦提交，修改就永久保存了，即使系统崩溃也不会丢失。

打个比方：你把钱存进银行，拿到存折后，即使银行停电了，你的钱也不会丢。

```sql
BEGIN;
UPDATE accounts SET balance = balance + 1000 WHERE user_id = 2;
COMMIT;
-- 一旦 COMMIT 成功，即使数据库马上断电，数据也已经保存到磁盘了
```

| ACID 特性 | 含义 | 生活类比 |
|-----------|------|----------|
| 原子性 | 全部成功或全部失败 | 超市结账，要么全买，要么全不买 |
| 一致性 | 数据状态保持一致 | 转账前后总金额不变 |
| 隔离性 | 并发事务互不干扰 | 多人同时用 ATM，互不影响 |
| 持久性 | 提交后永久保存 | 存折拿到手，银行停电钱也不丢 |

---

## 10.4 事务的隔离级别

### 并发带来的问题

多个事务同时操作数据库时，如果没有适当的隔离，会出现以下问题：

**脏读（Dirty Read）**
- 事务 A 读到了事务 B 已修改但未提交的数据
- 如果事务 B 回滚，事务 A 读到的就是"脏"数据

**不可重复读（Non-Repeatable Read）**
- 事务 A 两次读同一行数据，结果不同
- 因为中间事务 B 修改了这行数据并提交

**幻读（Phantom Read）**
- 事务 A 两次查询同一范围的数据，行数不同
- 因为中间事务 B 插入或删除了数据

| 问题 | 场景 | 后果 |
|------|------|------|
| 脏读 | 读到未提交的数据 | 数据可能是无效的 |
| 不可重复读 | 两次读同一行，结果不同 | 数据被修改了 |
| 幻读 | 两次查询范围数据，行数不同 | 数据被插入或删除了 |

### 四种隔离级别

MySQL 支持四种隔离级别，从低到高：

```sql
-- 查看当前隔离级别
SELECT @@transaction_isolation;
-- 显示当前会话的隔离级别

-- 设置隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
-- 设置为读未提交

SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- 设置为读已提交

SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- 设置为可重复读（MySQL 默认级别）

SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- 设置为串行化
```

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|----------|------|------------|------|------|
| READ UNCOMMITTED（读未提交） | 会 | 会 | 会 | 最好 |
| READ COMMITTED（读已提交） | 不会 | 会 | 会 | 较好 |
| REPEATABLE READ（可重复读） | 不会 | 不会 | 可能 | 一般 |
| SERIALIZABLE（串行化） | 不会 | 不会 | 不会 | 最差 |

> 一句话总结：隔离级别越高，数据越安全，但性能越差。MySQL 默认使用 REPEATABLE READ，在安全和性能之间取得平衡。

---

## 10.5 锁机制

### 共享锁与排他锁

数据库通过锁来控制并发访问：

**共享锁（Shared Lock，S 锁）**
- 允许多个事务同时读取同一行数据
- 类比：图书馆里多人可以同时看同一本书

**排他锁（Exclusive Lock，X 锁）**
- 只允许一个事务修改数据，其他事务不能读也不能写
- 类比：你把书借回家了，别人既不能看也不能借

```sql
-- 加共享锁（读锁）
SELECT * FROM accounts WHERE user_id = 1 LOCK IN SHARE MODE;
-- 其他事务可以读，但不能修改

-- 加排他锁（写锁）
SELECT * FROM accounts WHERE user_id = 1 FOR UPDATE;
-- 其他事务不能读也不能修改
```

| 锁类型 | 读操作 | 写操作 | 适用场景 |
|--------|--------|--------|----------|
| 共享锁（S 锁） | 允许 | 不允许 | 只读操作 |
| 排他锁（X 锁） | 不允许 | 不允许 | 修改操作 |

### 死锁

死锁是指两个或多个事务互相持有对方需要的锁，导致都无法继续执行。

打个比方：两个人在窄路上相遇，谁都不让路，结果谁也过不去。

```
事务 A：持有 user_id=1 的锁，等待 user_id=2 的锁
事务 B：持有 user_id=2 的锁，等待 user_id=1 的锁
结果：两个事务都在等待，形成死锁
```

### 死锁的处理

MySQL 有死锁检测机制，当检测到死锁时，会选择一个事务作为"牺牲者"，回滚它的操作。

```sql
-- 查看死锁检测是否开启
SELECT @@innodb_lock_wait_timeout;
-- 显示锁等待超时时间

-- 设置锁等待超时时间（秒）
SET SESSION innodb_lock_wait_timeout = 10;
-- 如果 10 秒内拿不到锁，事务会报错

-- 手动查看死锁信息
SHOW ENGINE INNODB STATUS;
-- 显示 InnoDB 引擎的状态信息，包括死锁详情
```

### 避免死锁的建议

| 建议 | 说明 |
|------|------|
| 按相同顺序访问资源 | 所有事务都按 user_id 从小到大操作 |
| 缩短事务长度 | 尽快提交事务，减少持锁时间 |
| 使用合适的隔离级别 | 隔离级别越低，锁越少 |
| 避免用户交互 | 事务中不要等待用户输入 |

---

## 10.6 新手常见误区

### 误区 1："事务越大越好"

错！大事务会长时间持有锁，影响并发性能。而且大事务回滚时，代价也很大。应该把大事务拆分成多个小事务，每个事务只做一件事。

### 误区 2："隔离级别越高越好"

不是的。隔离级别越高，性能越差。大多数应用场景，MySQL 默认的 REPEATABLE READ 就足够了。只有在对数据一致性要求极高的场景（如金融系统），才需要考虑 SERIALIZABLE。

### 误区 3："死锁是 Bug，应该避免"

死锁是并发系统的正常现象，无法完全避免。关键是设计好事务，减少死锁发生的概率，并处理好死锁发生后的回滚逻辑。

### 误区 4："BEGIN 之后忘记 COMMIT"

这是新手常犯的错误。BEGIN 开启事务后，如果忘记 COMMIT，所有修改都不会生效。而且长时间不提交的事务会持有锁，影响其他事务。记得及时 COMMIT 或 ROLLBACK。

### 误区 5："ROLLBACK 只能回滚最后一条 SQL"

错！ROLLBACK 会撤销事务中从 BEGIN 开始的所有操作，不是只回滚最后一条。这就是原子性的体现——要么全做，要么全不做。

---

## 10.7 动手练习

### 练习 1：编写转账事务

编写一个完整的转账事务，从 user_id=1 向 user_id=2 转账 500 元。要求：
1. 先检查 user_id=1 的余额是否大于等于 500
2. 如果余额足够，执行转账
3. 如果余额不足，回滚事务

<details>
<summary>点击查看答案</summary>

```sql
-- 开始事务
BEGIN;

-- 检查余额
SELECT balance FROM accounts WHERE user_id = 1;
-- 假设返回 2000，余额足够

-- 执行转账
UPDATE accounts SET balance = balance - 500 WHERE user_id = 1;
-- user_id=1 扣 500 元

UPDATE accounts SET balance = balance + 500 WHERE user_id = 2;
-- user_id=2 加 500 元

-- 提交事务
COMMIT;
```

如果余额不足，执行 ROLLBACK 撤销所有操作。

</details>

### 练习 2：理解隔离级别

假设有两个事务同时执行：

```sql
-- 事务 A
BEGIN;
SELECT balance FROM accounts WHERE user_id = 1;
-- 返回 5000

-- 事务 B
BEGIN;
UPDATE accounts SET balance = 4000 WHERE user_id = 1;
COMMIT;

-- 事务 A 再次查询
SELECT balance FROM accounts WHERE user_id = 1;
-- 在 REPEATABLE READ 级别下，返回什么？
```

问题：在 REPEATABLE READ 隔离级别下，事务 A 第二次查询会返回什么？

<details>
<summary>点击查看答案</summary>

返回 5000。

在 REPEATABLE READ 隔离级别下，事务 A 在整个事务期间看到的数据是一致的。即使事务 B 修改了数据并提交，事务 A 仍然看到事务开始时的值（5000）。这就是"可重复读"的含义。

如果在 READ COMMITTED 级别下，第二次查询会返回 4000。

</details>

### 练习 3（挑战）：死锁场景

设计一个死锁场景：两个事务分别操作 user_id=1 和 user_id=2，形成死锁。

<details>
<summary>点击查看答案</summary>

```sql
-- 事务 A
BEGIN;
-- 先锁 user_id=1
SELECT * FROM accounts WHERE user_id = 1 FOR UPDATE;

-- 事务 B
BEGIN;
-- 先锁 user_id=2
SELECT * FROM accounts WHERE user_id = 2 FOR UPDATE;

-- 事务 A 等待 user_id=2
UPDATE accounts SET balance = balance - 100 WHERE user_id = 2;
-- 此时事务 A 被阻塞，等待事务 B 释放 user_id=2 的锁

-- 事务 B 等待 user_id=1
UPDATE accounts SET balance = balance + 100 WHERE user_id = 1;
-- 此时事务 B 也被阻塞，等待事务 A 释放 user_id=1 的锁

-- 结果：死锁！MySQL 会检测到并回滚其中一个事务
```

</details>

---

## 下一章预告

下一章我们会学习 **存储过程与函数**。你会了解如何把常用的 SQL 逻辑封装成可复用的程序，就像编程里的函数一样。这能让复杂的数据库操作变得简单高效。
