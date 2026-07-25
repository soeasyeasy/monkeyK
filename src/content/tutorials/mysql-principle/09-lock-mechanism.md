# 第09章 锁机制原理

## 本章导读

在开始学习之前，让我们先思考几个新手常见的问题：

1. **为什么多个用户同时操作数据库时，数据不会混乱？**
2. **什么是行级锁？和表级锁有什么区别？**
3. **为什么有时候查询会被卡住，提示"等待锁释放"？**
4. **间隙锁和临键锁是什么？它们解决了什么问题？**

如果你对这些疑问感到困惑，别担心，本章将一一为你解答。

## 为什么需要锁机制

### 生活化类比

想象一个共享的银行账户：
- 小明和小红同时在ATM机上操作
- 小明要取100元，小红要存50元
- 如果没有锁机制，可能同时读取到余额1000元
- 小明操作后：1000 - 100 = 900
- 小红操作后：1000 + 50 = 1050
- 最终余额应该是950元，但系统可能记录成1050元或900元

这就像两个人同时编辑同一个文档，如果没有"锁定"机制，后保存的会覆盖前面的修改。

### 痛点分析

| 场景 | 没有锁的问题 | 有锁的解决方案 |
|------|-------------|---------------|
| 并发转账 | 余额计算错误 | 锁定账户，串行处理 |
| 库存扣减 | 超卖现象 | 锁定商品记录 |
| 订单创建 | 重复订单 | 锁定用户或商品 |

## 核心原理讲解

### MySQL的锁类型

MySQL的锁可以从多个维度分类：

#### 1. 按锁的粒度分类

**全局锁（Global Lock）**
- 锁定整个数据库实例
- 典型场景：全库备份（mysqldump --single-transaction）
- 类比：把整个图书馆锁上，谁都不能进出

**表级锁（Table Lock）**
- 锁定整张表
- 典型场景：DDL操作（ALTER TABLE）
- 类比：锁定某个书架，整排书都不能动

**行级锁（Row Lock）**
- 只锁定特定的行
- 典型场景：UPDATE、DELETE、SELECT ... FOR UPDATE
- 类比：只锁定某一本书，其他书还可以借阅

#### 2. 按锁的类型分类

**共享锁（S锁 / 读锁）**
- 多个事务可以同时读取同一行
- 但不能修改
- 类比：多个人可以同时看同一本书，但不能在上面写字

**排他锁（X锁 / 写锁）**
- 一个事务持有排他锁时，其他事务不能读也不能写
- 类比：一个人把书借走了，别人既不能看也不能写

**意向锁（Intention Lock）**
- 用于快速判断表是否被锁定
- 分为IS（意向共享锁）和IX（意向排他锁）
- 类比：图书馆门口的登记簿，记录谁想借哪个书架的书

#### 3. 行级锁的特殊类型

**记录锁（Record Lock）**
- 锁定索引上的单条记录
- 类比：精确锁定某一本书

**间隙锁（Gap Lock）**
- 锁定索引之间的间隙
- 防止幻读（Phantom Read）
- 类比：锁定书架上的空位，防止别人插入新书

**临键锁（Next-Key Lock）**
- 记录锁 + 间隙锁的组合
- 锁定记录本身 + 记录之前的间隙
- MySQL InnoDB默认的行锁算法
- 类比：锁定某本书 + 它前面的空位

### 锁的兼容性矩阵

| 已持有\请求 | 共享锁(S) | 排他锁(X) | 意向共享(IS) | 意向排他(IX) |
|------------|----------|----------|-------------|-------------|
| 共享锁(S)   | ✅ 兼容   | ❌ 冲突   | ✅ 兼容      | ❌ 冲突      |
| 排他锁(X)   | ❌ 冲突   | ❌ 冲突   | ❌ 冲突      | ❌ 冲突      |
| 意向共享(IS) | ✅ 兼容   | ❌ 冲突   | ✅ 兼容      | ✅ 兼容      |
| 意向排他(IX) | ❌ 冲突   | ❌ 冲突   | ✅ 兼容      | ✅ 兼容      |

## 基础用法 + 逐行注释

### 示例1：共享锁（读锁）

```sql
-- 开启事务
START TRANSACTION;

-- 查询用户余额，并加上共享锁
-- 其他事务也可以读取这行数据，但不能修改
SELECT balance 
FROM accounts 
WHERE user_id = 1 
LOCK IN SHARE MODE;  -- 加共享锁，允许其他事务读取

-- 读取余额（假设是1000元）
-- 此时其他事务可以查询，但不能UPDATE这行数据

-- 提交事务，释放锁
COMMIT;
```

### 示例2：排他锁（写锁）

```sql
-- 开启事务
START TRANSACTION;

-- 查询用户余额，并加上排他锁
-- 其他事务既不能读也不能写这行数据
SELECT balance 
FROM accounts 
WHERE user_id = 1 
FOR UPDATE;  -- 加排他锁，其他事务不能读也不能写

-- 假设读取到余额1000元
-- 此时其他事务如果想UPDATE或SELECT FOR UPDATE这行数据，会被阻塞

-- 执行扣款操作
UPDATE accounts 
SET balance = balance - 100 
WHERE user_id = 1;

-- 提交事务，释放锁
-- 其他事务此时才能继续操作这行数据
COMMIT;
```

### 示例3：间隙锁演示

```sql
-- 假设表中有以下数据：id = 5, 10, 15

-- 事务A
START TRANSACTION;

-- 查询id在10-15之间的记录，加间隙锁
-- 会锁定id=10的记录 + id在(10,15)之间的间隙
SELECT * FROM users 
WHERE id >= 10 AND id < 15 
FOR UPDATE;

-- 此时事务B如果想插入id=12的记录，会被阻塞
-- 因为间隙锁阻止了新记录的插入

-- 事务B（在另一个会话）
START TRANSACTION;
INSERT INTO users (id, name) VALUES (12, 'Tom');  
-- 这条INSERT会被阻塞，等待事务A释放锁

-- 事务A提交
COMMIT;

-- 事务B的INSERT才能继续执行
```

### 示例4：死锁场景

```sql
-- 事务A
START TRANSACTION;
UPDATE accounts SET balance = 100 WHERE user_id = 1;  -- 锁定user_id=1
UPDATE accounts SET balance = 200 WHERE user_id = 2;  -- 等待user_id=2的锁

-- 事务B（同时执行）
START TRANSACTION;
UPDATE accounts SET balance = 300 WHERE user_id = 2;  -- 锁定user_id=2
UPDATE accounts SET balance = 400 WHERE user_id = 1;  -- 等待user_id=1的锁

-- 结果：两个事务互相等待，形成死锁
-- MySQL会自动检测到死锁，并回滚其中一个事务
-- 错误提示：ERROR 1213 (40001): Deadlock found when trying to get lock
```

### 示例5：查看锁信息

```sql
-- 查看当前被锁定的表
SHOW OPEN TABLES WHERE In_use > 0;

-- 查看当前事务和锁信息（MySQL 5.7+）
SELECT * FROM information_schema.innodb_locks;

-- 查看锁等待关系
SELECT * FROM information_schema.innodb_lock_waits;

-- 查看当前运行的事务
SELECT * FROM information_schema.innodb_trx;

-- 杀死阻塞的事务（假设线程ID是123）
KILL 123;
```

## 对比表格

### 锁类型对比

| 锁类型 | 锁定范围 | 并发性能 | 冲突概率 | 典型场景 |
|--------|---------|---------|---------|---------|
| 全局锁 | 整个数据库 | 最低 | 最高 | 全库备份 |
| 表级锁 | 整张表 | 较低 | 较高 | DDL操作 |
| 行级锁 | 单行记录 | 最高 | 最低 | UPDATE/DELETE |
| 间隙锁 | 索引间隙 | 中等 | 中等 | 防止幻读 |
| 临键锁 | 记录+间隙 | 中等 | 中等 | InnoDB默认 |

### 共享锁 vs 排他锁

| 特性 | 共享锁(S) | 排他锁(X) |
|------|----------|----------|
| 其他事务读 | ✅ 允许 | ❌ 阻塞 |
| 其他事务写 | ❌ 阻塞 | ❌ 阻塞 |
| 多个事务同时持有 | ✅ 允许 | ❌ 不允许 |
| 语法 | LOCK IN SHARE MODE | FOR UPDATE |
| 适用场景 | 只读操作 | 读写操作 |

## 新手常见误区

### 误区1：认为行锁是锁住物理行

❌ **错误理解**：行锁是锁住磁盘上的某一行数据

✅ **正确理解**：行锁是锁住索引记录。如果没有索引，InnoDB会使用表锁

```sql
-- 假设name字段没有索引
-- ❌ 错误写法：会导致全表扫描，锁住所有行
UPDATE users SET status = 1 WHERE name = 'Tom';

-- ✅ 正确写法：给name加索引，只锁住匹配的行
ALTER TABLE users ADD INDEX idx_name (name);
UPDATE users SET status = 1 WHERE name = 'Tom';  -- 只锁name='Tom'的行
```

### 误区2：认为锁的时间越短越好

❌ **错误做法**：在事务中做大量计算，长时间持有锁

✅ **正确做法**：事务要尽量短，只包含必要的数据库操作

```sql
-- ❌ 错误写法：事务中包含耗时的计算
START TRANSACTION;
SELECT * FROM orders WHERE user_id = 1 FOR UPDATE;
-- 在应用程序中做复杂的计算（耗时10秒）
UPDATE orders SET status = 'processed' WHERE user_id = 1;
COMMIT;

-- ✅ 正确写法：事务尽量短
SELECT * FROM orders WHERE user_id = 1;  -- 在事务外查询
-- 在应用程序中做计算
START TRANSACTION;
UPDATE orders SET status = 'processed' WHERE user_id = 1;  -- 只包含必要的UPDATE
COMMIT;
```

### 误区3：忽视死锁的可能性

❌ **错误做法**：多个事务以不同的顺序访问资源

✅ **正确做法**：保证所有事务以相同的顺序访问资源

```sql
-- ❌ 错误写法：事务A和B以相反顺序访问资源
-- 事务A：先锁user_id=1，再锁user_id=2
-- 事务B：先锁user_id=2，再锁user_id=1
-- 可能导致死锁

-- ✅ 正确写法：所有事务以相同顺序访问资源
-- 事务A和B都先锁user_id=1，再锁user_id=2
-- 这样就不会形成循环等待
```

### 误区4：认为SELECT不需要加锁

❌ **错误理解**：查询操作不会影响数据，不需要考虑锁

✅ **正确理解**：普通SELECT使用MVCC，不会加锁；但如果需要保证数据不被修改，必须加锁

```sql
-- ❌ 错误写法：查询后更新，可能导致数据不一致
SELECT balance FROM accounts WHERE user_id = 1;  -- 读到1000
-- 此时其他事务修改了balance为800
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;  -- 基于旧值计算，结果错误

-- ✅ 正确写法：查询时加锁，保证数据不被修改
SELECT balance FROM accounts WHERE user_id = 1 FOR UPDATE;  -- 读到1000，并加锁
-- 其他事务无法修改这行数据
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;  -- 结果正确
COMMIT;
```

### 误区5：认为间隙锁只在范围查询时生效

❌ **错误理解**：只有WHERE id BETWEEN 1 AND 10才会产生间隙锁

✅ **正确理解**：等值查询如果记录不存在，也会产生间隙锁

```sql
-- 假设表中有id=5和id=10的记录，没有id=7的记录

-- 事务A
START TRANSACTION;
SELECT * FROM users WHERE id = 7 FOR UPDATE;  -- 记录不存在，但会产生间隙锁
-- 间隙锁锁定(5, 10)这个区间

-- 事务B
START TRANSACTION;
INSERT INTO users (id, name) VALUES (7, 'Tom');  -- 被阻塞，因为间隙锁
-- 即使事务A查询的记录不存在，仍然阻止了插入
```

## 动手练习

### 练习1：基础 - 实现安全的转账操作

**题目**：编写一个转账事务，从用户A转100元给用户B，要求使用排他锁保证数据一致性。

<details>
<summary>点击查看答案</summary>

```sql
-- 开启事务
START TRANSACTION;

-- 锁定用户A的账户（加排他锁）
SELECT balance FROM accounts WHERE user_id = 'A' FOR UPDATE;

-- 检查余额是否足够（假设在应用程序中检查）
-- 如果余额 >= 100，继续执行

-- 扣减用户A的余额
UPDATE accounts SET balance = balance - 100 WHERE user_id = 'A';

-- 增加用户B的余额
UPDATE accounts SET balance = balance + 100 WHERE user_id = 'B';

-- 提交事务，释放锁
COMMIT;
```

**要点**：
- 使用FOR UPDATE加排他锁
- 事务要尽量短，只包含必要的操作
- 确保余额检查在锁定之后进行

</details>

### 练习2：进阶 - 分析死锁场景

**题目**：有两个事务，事务A先锁定user_id=1再锁定user_id=2，事务B先锁定user_id=2再锁定user_id=1。请分析为什么会发生死锁，并给出解决方案。

<details>
<summary>点击查看答案</summary>

**死锁原因分析**：
1. 事务A持有user_id=1的锁，等待user_id=2的锁
2. 事务B持有user_id=2的锁，等待user_id=1的锁
3. 形成循环等待，两个事务都无法继续

**解决方案**：

```sql
-- 方案1：保证所有事务以相同顺序访问资源
-- 事务A和B都先访问user_id=1，再访问user_id=2

-- 事务A
START TRANSACTION;
UPDATE accounts SET balance = 100 WHERE user_id = 1;
UPDATE accounts SET balance = 200 WHERE user_id = 2;
COMMIT;

-- 事务B
START TRANSACTION;
UPDATE accounts SET balance = 300 WHERE user_id = 1;  -- 先访问user_id=1
UPDATE accounts SET balance = 400 WHERE user_id = 2;  -- 再访问user_id=2
COMMIT;

-- 方案2：设置锁等待超时时间
SET innodb_lock_wait_timeout = 10;  -- 等待10秒后超时

-- 方案3：使用死锁检测（InnoDB默认开启）
-- MySQL会自动检测死锁并回滚其中一个事务
SHOW VARIABLES LIKE 'innodb_deadlock_detect';
```

</details>

### 练习3：挑战 - 设计一个防超卖的库存系统

**题目**：设计一个电商库存扣减系统，要求：
1. 防止超卖（库存不能为负）
2. 支持高并发
3. 避免死锁

<details>
<summary>点击查看答案</summary>

```sql
-- 创建商品表
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    stock INT NOT NULL,  -- 库存数量
    version INT NOT NULL DEFAULT 0  -- 版本号，用于乐观锁
);

-- 方案1：悲观锁（适合并发不高、冲突频繁的场景）
START TRANSACTION;

-- 查询并锁定库存
SELECT stock FROM products WHERE id = 1 FOR UPDATE;

-- 检查库存（在应用程序中）
-- 如果stock >= 购买数量，继续执行

-- 扣减库存
UPDATE products 
SET stock = stock - 1 
WHERE id = 1 AND stock >= 1;  -- 确保库存不为负

-- 检查是否更新成功
-- 如果affected_rows = 0，说明库存不足

COMMIT;

-- 方案2：乐观锁（适合并发高、冲突少的场景）
-- 先查询当前库存和版本号
SELECT stock, version FROM products WHERE id = 1;

-- 在应用程序中检查库存
-- 如果stock >= 购买数量，继续执行

-- 使用版本号更新
UPDATE products 
SET stock = stock - 1, 
    version = version + 1 
WHERE id = 1 
  AND version = 查询到的version  -- 确保版本号一致
  AND stock >= 1;  -- 确保库存不为负

-- 检查是否更新成功
-- 如果affected_rows = 0，说明有冲突，需要重试

-- 方案3：使用Redis预扣减（适合高并发场景）
-- 在Redis中预先扣减库存，然后再异步更新数据库
-- 这样可以避免大量请求直接打到数据库
```

**性能对比**：
- 悲观锁：并发低，但保证一致性
- 乐观锁：并发高，冲突时需要重试
- Redis预扣减：并发最高，但实现复杂

</details>

## 下一章预告

恭喜你完成了锁机制的学习！在下一章中，我们将深入探讨MySQL的日志系统，包括：

- **redo log**：如何保证事务的持久性？
- **undo log**：如何实现事务回滚和MVCC？
- **binlog**：如何实现主从复制和数据恢复？
- **两阶段提交**：如何保证redo log和binlog的一致性？

这些日志是MySQL可靠运行的基石，让我们继续探索吧！
