# 第10章 日志系统原理

## 本章导读

在开始学习之前，让我们先思考几个新手常见的问题：

1. **MySQL如何保证数据不丢失？断电了怎么办？**
2. **为什么需要三种不同的日志（redo、undo、binlog）？**
3. **事务回滚是怎么实现的？撤销操作时发生了什么？**
4. **主从复制是怎么工作的？数据如何同步到从库？**

如果你对这些疑问感到困惑，别担心，本章将一一为你解答。

## 为什么需要日志系统

### 生活化类比

想象你在写一本重要的日记：

**场景1：防止丢失（redo log的作用）**
- 你每天写日记，但纸张容易损坏
- 你先在一个小本子上记录"今天写了第10页到第15页"
- 如果日记本被水泼了，你可以根据小本子重新写一遍
- 这个小本子就是redo log（重做日志）

**场景2：后悔药（undo log的作用）**
- 你写错了内容，想撤回
- 你在写之前先拍个照片，记录原来的样子
- 写错了就对照照片恢复
- 这些照片就是undo log（回滚日志）

**场景3：备份给其他人（binlog的作用）**
- 你想让朋友也有一份你的日记
- 你每天把写的内容抄一份给朋友
- 朋友根据你抄的内容，在自己的本子上写一遍
- 这个抄写的过程就是binlog（二进制日志）用于主从复制

### 痛点分析

| 场景 | 没有日志的问题 | 有日志的解决方案 |
|------|---------------|-----------------|
| 数据库崩溃 | 数据丢失，无法恢复 | redo log重做已提交事务 |
| 操作失误 | 无法撤销错误操作 | undo log回滚到之前状态 |
| 数据同步 | 主从数据不一致 | binlog复制到从库 |
| 数据恢复 | 只能从备份恢复 | 结合binlog做时间点恢复 |

## 核心原理讲解

### 三种日志的作用

#### 1. redo log（重做日志）

**作用**：保证事务的持久性（Durability）

**工作原理**：
- 事务提交时，先将修改写入redo log
- 即使数据库崩溃，重启后可以根据redo log恢复数据
- 采用WAL（Write-Ahead Logging）机制：先写日志，再写数据文件

**物理结构**：
- 固定大小的环形文件（默认2个文件，每个1GB）
- 两个指针：write pos（写入位置）、checkpoint（刷盘位置）
- write pos追上checkpoint时，需要触发刷盘

**生活类比**：
就像你在图书馆借书，管理员先在登记本上记录"张三借了《MySQL原理》"，然后再去书架上找书。即使管理员中途去上厕所，回来后看登记本就知道该做什么。

#### 2. undo log（回滚日志）

**作用**：保证事务的原子性（Atomicity）和实现MVCC

**工作原理**：
- 事务修改数据前，先记录原始值
- 事务回滚时，根据undo log恢复数据
- 事务失败时，自动回滚保证原子性
- MVCC通过undo log实现多版本并发控制

**记录内容**：
- 逻辑日志：记录SQL语句（如INSERT、DELETE、UPDATE）
- 对于UPDATE，记录被修改列的原始值

**生活类比**：
就像你编辑Word文档时的"撤销"功能。每次修改前，Word都会记录原来的状态，你可以随时撤销到之前的版本。

#### 3. binlog（二进制日志）

**作用**：用于数据备份和主从复制

**工作原理**：
- 记录所有修改数据的SQL语句或数据变更
- 归档日志，可以保留很长时间
- 用于恢复到任意时间点
- 主库将binlog发送给从库，从库重放实现同步

**三种格式**：
- STATEMENT：记录SQL语句（可能导致主从不一致）
- ROW：记录行变更（数据量大，但最准确）
- MIXED：混合模式（默认使用STATEMENT，遇到函数时切换为ROW）

**生活类比**：
就像你每天写工作日志，记录做了什么工作。同事请假了，你告诉他日志内容，他就能知道该做什么。

### 两阶段提交

**为什么需要两阶段提交？**

MySQL有两个日志系统：
- InnoDB的redo log（ crash-safe能力）
- Server层的binlog（归档和复制）

如果分别提交，可能出现不一致：

**场景1：先写redo log，再写binlog**
```
1. 写redo log成功
2. 写binlog时数据库崩溃
3. 重启后，redo log恢复数据，但binlog没有记录
4. 主从数据不一致
```

**场景2：先写binlog，再写redo log**
```
1. 写binlog成功
2. 写redo log时数据库崩溃
3. 重启后，binlog有记录，但redo log没有恢复数据
4. 主从数据不一致
```

**两阶段提交的流程**：

```
阶段1：Prepare阶段
- 写redo log，标记为prepare状态
- 不提交事务

阶段2：Commit阶段
- 写binlog
- 将redo log标记为commit
- 事务真正提交
```

**崩溃恢复逻辑**：
- 如果redo log是prepare状态，检查binlog是否完整
- 如果binlog完整，提交事务
- 如果binlog不完整，回滚事务

### 日志写入时机

| 日志类型 | 写入时机 | 刷盘时机 |
|---------|---------|---------|
| redo log | 事务执行过程中 | 事务提交时（默认） |
| undo log | 数据修改前 | 事务提交时 |
| binlog | 事务提交时 | 事务提交时 |

## 基础用法 + 逐行注释

### 示例1：查看日志配置

```sql
-- 查看redo log配置
SHOW VARIABLES LIKE 'innodb_log_file_size';  -- 单个redo log文件大小
SHOW VARIABLES LIKE 'innodb_log_files_in_group';  -- redo log文件数量
SHOW VARIABLES LIKE 'innodb_log_buffer_size';  -- redo log缓冲区大小

-- 查看binlog配置
SHOW VARIABLES LIKE 'log_bin';  -- 是否开启binlog
SHOW VARIABLES LIKE 'binlog_format';  -- binlog格式
SHOW VARIABLES LIKE 'binlog_file_size';  -- binlog文件大小限制
SHOW VARIABLES LIKE 'expire_logs_days';  -- binlog过期天数

-- 查看当前的binlog文件
SHOW BINARY LOGS;

-- 查看binlog事件
SHOW BINLOG EVENTS IN 'binlog.000001' LIMIT 10;
```

### 示例2：redo log演示

```sql
-- 查看当前redo log状态
SHOW ENGINE INNODB STATUS\G

-- 关注以下信息：
-- Log sequence number: 当前LSN（日志序列号）
-- Last checkpoint at: 检查点位置
-- Log flushed up to: 已刷盘的LSN

-- 模拟崩溃恢复
-- 1. 执行事务
START TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE user_id = 2;
COMMIT;

-- 2. 突然断电（模拟）
-- 此时数据可能还在Buffer Pool中，没有写入磁盘

-- 3. 重启MySQL
-- MySQL启动时会自动检查redo log
-- 如果发现未刷盘的数据，会根据redo log重做

-- 查看redo log文件（在MySQL数据目录下）
-- 文件名：ib_logfile0, ib_logfile1
```

### 示例3：undo log演示

```sql
-- 开启事务
START TRANSACTION;

-- 查看当前数据
SELECT * FROM accounts WHERE user_id = 1;  -- 假设余额是1000

-- 修改数据（此时会生成undo log）
UPDATE accounts SET balance = 900 WHERE user_id = 1;

-- 查看修改后的数据
SELECT * FROM accounts WHERE user_id = 1;  -- 余额变成900

-- 回滚事务（使用undo log恢复数据）
ROLLBACK;

-- 查看数据已恢复
SELECT * FROM accounts WHERE user_id = 1;  -- 余额回到1000

-- undo log在后台自动清理
-- 当没有其他事务需要这个版本时，undo log会被purge线程清理
```

### 示例4：binlog演示

```sql
-- 查看binlog是否开启
SHOW VARIABLES LIKE 'log_bin';

-- 如果未开启，需要在my.cnf中配置：
-- [mysqld]
-- log-bin=mysql-bin
-- binlog-format=ROW

-- 查看当前的binlog文件
SHOW BINARY LOGS;

-- 查看binlog内容（ROW格式）
SHOW BINLOG EVENTS IN 'mysql-bin.000001' LIMIT 10;

-- 使用mysqlbinlog工具查看详细内容
-- 命令行执行：
-- mysqlbinlog --base64-output=DECODE-ROWS -v mysql-bin.000001

-- 示例输出：
-- # at 154
-- #210101 10:00:00 server id 1  end_log_pos 219
-- BEGIN
-- # at 219
-- #210101 10:00:00 server id 1  end_log_pos 313
-- INSERT INTO `test`.`users` SET `id`=1, `name`='Tom'
-- # at 313
-- #210101 10:00:00 server id 1  end_log_pos 344
-- COMMIT

-- 删除旧的binlog文件
PURGE BINARY LOGS BEFORE '2021-01-01 00:00:00';
PURGE BINARY LOGS TO 'mysql-bin.000003';
```

### 示例5：使用binlog恢复数据

```sql
-- 场景：误删除了数据，需要从binlog恢复

-- 1. 找到误操作的时间点
-- 假设在2021-01-01 10:00:00执行了DELETE FROM users WHERE id = 1

-- 2. 查看binlog，找到误操作之前的位置
SHOW BINLOG EVENTS IN 'mysql-bin.000001' 
WHERE pos < 1000 AND event_time < '2021-01-01 10:00:00';

-- 3. 使用mysqlbinlog导出需要恢复的数据
-- 命令行执行：
-- mysqlbinlog --start-datetime="2021-01-01 09:00:00" \
--             --stop-datetime="2021-01-01 10:00:00" \
--             --database=test \
--             mysql-bin.000001 > restore.sql

-- 4. 检查restore.sql的内容
-- 确认只包含需要恢复的操作

-- 5. 恢复数据
-- mysql -u root -p test < restore.sql
```

### 示例6：主从复制配置

```sql
-- 主库配置（my.cnf）
-- [mysqld]
-- server-id=1
-- log-bin=mysql-bin
-- binlog-format=ROW

-- 从库配置（my.cnf）
-- [mysqld]
-- server-id=2
-- relay-log=relay-bin
-- log-slave-updates=1

-- 在主库创建复制用户
CREATE USER 'repl'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;

-- 在主库查看binlog状态
SHOW MASTER STATUS;
-- 记录File和Position，例如：
-- File: mysql-bin.000001
-- Position: 154

-- 在从库配置主库信息
CHANGE MASTER TO
  MASTER_HOST='192.168.1.100',      -- 主库IP
  MASTER_USER='repl',                -- 复制用户
  MASTER_PASSWORD='password',        -- 密码
  MASTER_LOG_FILE='mysql-bin.000001', -- 主库的binlog文件
  MASTER_LOG_POS=154;                -- 主库的Position

-- 启动从库复制
START SLAVE;

-- 查看从库状态
SHOW SLAVE STATUS\G
-- 关注以下字段：
-- Slave_IO_Running: Yes（IO线程运行中）
-- Slave_SQL_Running: Yes（SQL线程运行中）
-- Seconds_Behind_Master: 0（延迟秒数）
```

## 对比表格

### 三种日志对比

| 特性 | redo log | undo log | binlog |
|------|----------|----------|--------|
| 所属层 | InnoDB引擎层 | InnoDB引擎层 | Server层 |
| 日志类型 | 物理日志（记录"在某个数据页上做了什么修改"） | 逻辑日志（记录SQL语句） | 逻辑日志（STATEMENT/MIXED）或物理日志（ROW） |
| 写入时机 | 事务执行过程中 | 数据修改前 | 事务提交时 |
| 刷盘时机 | 事务提交时 | 事务提交时 | 事务提交时 |
| 循环使用 | 是（环形写入） | 是（事务提交后清理） | 否（归档日志） |
| 主要作用 | crash-safe（崩溃恢复） | 事务回滚、MVCC | 数据备份、主从复制 |
| 文件大小 | 固定大小（默认2个1GB） | 动态增长 | 动态增长，可设置过期时间 |

### binlog格式对比

| 格式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| STATEMENT | 数据量小 | 可能导致主从不一致（如NOW()函数） | 简单SQL，无函数 |
| ROW | 最准确，不会不一致 | 数据量大（尤其是批量操作） | 生产环境推荐 |
| MIXED | 兼顾两者 | 复杂，难以调试 | 默认选项 |

### 两阶段提交 vs 单阶段提交

| 特性 | 两阶段提交 | 单阶段提交 |
|------|-----------|-----------|
| 一致性 | 保证redo log和binlog一致 | 可能不一致 |
| 性能 | 略低（两次写盘） | 略高 |
| 崩溃恢复 | 可以正确恢复 | 可能丢失或重复 |
| 使用场景 | MySQL默认 | 不推荐 |

## 新手常见误区

### 误区1：认为redo log和binlog是一样的的

❌ **错误理解**：redo log和binlog都是日志，功能差不多

✅ **正确理解**：
- redo log是InnoDB引擎特有的，用于崩溃恢复
- binlog是Server层的，用于备份和复制
- redo log是物理日志（记录数据页的修改），binlog是逻辑日志（记录SQL或行变更）
- redo log是循环写的，binlog是追加写的

```sql
-- ❌ 错误理解：关闭binlog就不需要redo log了
-- 即使关闭binlog，InnoDB仍然需要redo log保证crash-safe

-- ✅ 正确理解：两者缺一不可
-- redo log：保证InnoDB的持久性
-- binlog：保证备份和复制的能力
```

### 误区2：认为undo log在事务提交后立即删除

❌ **错误理解**：事务提交后，undo log就没用了，应该立即删除

✅ **正确理解**：
- 事务提交后，undo log不会立即删除
- 其他事务可能还需要这个版本的数据（MVCC）
- 当没有其他事务需要这个版本时，purge线程才会清理

```sql
-- ❌ 错误理解：事务提交后undo log立即清理
-- 实际上，长事务会导致undo log长时间保留

-- ✅ 正确做法：避免长时间运行的事务
-- 长事务会占用undo log空间，影响性能

-- 查看当前未清理的undo log
SELECT * FROM information_schema.innodb_trx;

-- 查看undo log表空间
SELECT * FROM information_schema.innodb_metrics 
WHERE name LIKE '%undo%';
```

### 误区3：认为binlog格式无所谓

❌ **错误做法**：使用STATEMENT格式，因为数据量小

✅ **正确做法**：生产环境使用ROW格式，保证主从一致性

```sql
-- ❌ 错误配置：使用STATEMENT格式
-- binlog-format=STATEMENT
-- 问题：如果SQL包含NOW()、RAND()等函数，主从数据会不一致

-- ✅ 正确配置：使用ROW格式
-- binlog-format=ROW
-- 虽然数据量大，但保证主从完全一致

-- 查看当前binlog格式
SHOW VARIABLES LIKE 'binlog_format';
```

### 误区4：认为两阶段提交影响性能，可以关闭

❌ **错误做法**：为了性能，关闭两阶段提交

✅ **正确理解**：两阶段提交是保证一致性的关键，不能关闭

```sql
-- ❌ 错误配置：关闭两阶段提交
-- 没有参数可以直接关闭两阶段提交
-- 但可以通过设置sync_binlog和innodb_flush_log_at_trx_commit来调整性能

-- ✅ 正确配置：平衡性能和安全性
-- 最安全配置（默认）：
-- sync_binlog=1  -- 每次事务都刷盘binlog
-- innodb_flush_log_at_trx_commit=1  -- 每次事务都刷盘redo log

-- 性能优先配置（可能丢失1秒数据）：
-- sync_binlog=0  -- 由操作系统决定何时刷盘binlog
-- innodb_flush_log_at_trx_commit=2  -- 每次事务写入OS缓存，由OS决定何时刷盘
```

### 误区5：认为binlog可以恢复所有数据

❌ **错误理解**：只要有binlog，就可以恢复所有数据

✅ **正确理解**：
- binlog只记录修改数据的SQL（不包含SELECT）
- 需要结合全量备份 + binlog增量备份
- 恢复时需要先恢复全量备份，再应用binlog

```sql
-- ❌ 错误理解：只依赖binlog恢复数据
-- 如果binlog被清理了，就无法恢复

-- ✅ 正确做法：定期全量备份 + binlog增量备份
-- 1. 每周日做全量备份
-- mysqldump --single-transaction --master-data=2 -u root -p test > backup.sql

-- 2. 保留每天的binlog
-- 3. 恢复时：
-- 先恢复全量备份：mysql -u root -p test < backup.sql
-- 再应用binlog：mysqlbinlog mysql-bin.000001 | mysql -u root -p
```

## 动手练习

### 练习1：基础 - 查看和分析日志

**题目**：查看当前MySQL的redo log、undo log和binlog配置，并解释每个参数的含义。

<details>
<summary>点击查看答案</summary>

```sql
-- 查看redo log配置
SHOW VARIABLES LIKE 'innodb_log_file_size';  
-- 含义：单个redo log文件的大小，默认1GB
-- 越大性能越好，但崩溃恢复时间越长

SHOW VARIABLES LIKE 'innodb_log_files_in_group';  
-- 含义：redo log文件数量，默认2个
-- 环形写入，文件越多越不容易追上checkpoint

SHOW VARIABLES LIKE 'innodb_log_buffer_size';  
-- 含义：redo log缓冲区大小，默认16MB
-- 大事务会直接写入磁盘，不经过缓冲区

-- 查看binlog配置
SHOW VARIABLES LIKE 'log_bin';  
-- 含义：是否开启binlog，ON表示开启

SHOW VARIABLES LIKE 'binlog_format';  
-- 含义：binlog格式，推荐ROW

SHOW VARIABLES LIKE 'binlog_file_size';  
-- 含义：单个binlog文件大小限制

SHOW VARIABLES LIKE 'expire_logs_days';  
-- 含义：binlog过期天数，0表示永不过期

-- 查看undo log相关
SHOW VARIABLES LIKE 'innodb_undo_tablespaces';  
-- 含义：undo表空间数量

SHOW VARIABLES LIKE 'innodb_undo_logs';  
-- 含义：undo log数量（已废弃，使用innodb_rollback_segments）

SHOW VARIABLES LIKE 'innodb_rollback_segments';  
-- 含义：回滚段数量，每个回滚段可以容纳1024个undo log
```

**要点**：
- redo log关注文件大小和数量
- binlog关注格式和过期时间
- undo log关注回滚段数量

</details>

### 练习2：进阶 - 分析两阶段提交

**题目**：假设MySQL在以下两个时刻崩溃，分析数据是否会丢失或重复：
1. 写完redo log（prepare状态），还没写binlog
2. 写完binlog，还没将redo log标记为commit

<details>
<summary>点击查看答案</summary>

**场景1：写完redo log（prepare状态），还没写binlog时崩溃**

```
崩溃前的状态：
- redo log：已写入，标记为prepare
- binlog：未写入

崩溃恢复过程：
1. MySQL启动，检查redo log
2. 发现事务处于prepare状态
3. 检查binlog是否完整
4. binlog不完整（没有写入）
5. 回滚事务

结果：数据不会丢失，也不会重复
原因：两阶段提交保证了只有binlog完整的事务才会提交
```

**场景2：写完binlog，还没将redo log标记为commit时崩溃**

```
崩溃前的状态：
- redo log：已写入，标记为prepare
- binlog：已写入

崩溃恢复过程：
1. MySQL启动，检查redo log
2. 发现事务处于prepare状态
3. 检查binlog是否完整
4. binlog完整（已写入）
5. 提交事务，将redo log标记为commit

结果：数据不会丢失，也不会重复
原因：两阶段提交保证了binlog完整的事务会被提交
```

**总结**：
- 两阶段提交保证了redo log和binlog的一致性
- 无论何时崩溃，都不会丢失或重复数据
- 关键在于：通过binlog是否完整来判断事务是否应该提交

</details>

### 练习3：挑战 - 设计数据恢复方案

**题目**：设计一个完整的数据恢复方案，要求：
1. 可以恢复到任意时间点
2. 尽量减少数据丢失
3. 考虑恢复效率

<details>
<summary>点击查看答案</summary>

**方案设计**：

**1. 备份策略**

```bash
# 全量备份（每周日凌晨2点）
# 使用mysqldump，开启single-transaction保证一致性
mysqldump --single-transaction \
          --master-data=2 \
          --routines \
          --triggers \
          --events \
          -u root -p test > /backup/full_$(date +%Y%m%d).sql

# 记录备份时的binlog位置
# --master-data=2会在备份文件中添加：
# CHANGE MASTER TO MASTER_LOG_FILE='mysql-bin.000001', MASTER_LOG_POS=154;
```

**2. binlog管理**

```bash
# 保留binlog，设置过期时间为30天
# my.cnf配置：
expire_logs_days = 30

# 定期清理过期的binlog
PURGE BINARY LOGS BEFORE DATE_SUB(NOW(), INTERVAL 30 DAY);
```

**3. 恢复流程**

```bash
# 假设需要恢复到2021-01-15 14:30:00

# 步骤1：找到最近的全量备份
# 假设是2021-01-14 02:00:00的备份

# 步骤2：恢复全量备份
mysql -u root -p test < /backup/full_20210114.sql

# 步骤3：查看备份时的binlog位置
# 从备份文件中找到：
# CHANGE MASTER TO MASTER_LOG_FILE='mysql-bin.000010', MASTER_LOG_POS=500;

# 步骤4：应用binlog增量
mysqlbinlog --start-datetime="2021-01-14 02:00:00" \
            --stop-datetime="2021-01-15 14:30:00" \
            --database=test \
            /var/lib/mysql/mysql-bin.000010 \
            /var/lib/mysql/mysql-bin.000011 \
            | mysql -u root -p test
```

**4. 自动化脚本**

```bash
#!/bin/bash
# restore.sh - 数据恢复脚本

TARGET_TIME=$1  # 目标时间点，格式：2021-01-15 14:30:00

# 1. 找到最近的全量备份
BACKUP_FILE=$(ls -t /backup/full_*.sql | head -1)
echo "使用备份文件：$BACKUP_FILE"

# 2. 恢复全量备份
mysql -u root -p test < $BACKUP_FILE

# 3. 提取binlog位置
BINLOG_INFO=$(grep "CHANGE MASTER TO" $BACKUP_FILE | head -1)
BINLOG_FILE=$(echo $BINLOG_INFO | grep -oP "MASTER_LOG_FILE='\K[^']+")
BINLOG_POS=$(echo $BINLOG_INFO | grep -oP "MASTER_LOG_POS=\K[0-9]+")

echo "从binlog位置开始：$BINLOG_FILE, $BINLOG_POS"

# 4. 应用binlog
mysqlbinlog --start-position=$BINLOG_POS \
            --stop-datetime="$TARGET_TIME" \
            --database=test \
            /var/lib/mysql/$BINLOG_FILE* \
            | mysql -u root -p test

echo "恢复到时间点：$TARGET_TIME"
```

**5. 性能优化**

```sql
-- 恢复时临时调整参数，提高性能
SET GLOBAL innodb_flush_log_at_trx_commit = 0;  -- 不每次刷盘
SET GLOBAL sync_binlog = 0;  -- 不同步binlog
SET GLOBAL unique_checks = 0;  -- 关闭唯一性检查
SET GLOBAL foreign_key_checks = 0;  -- 关闭外键检查

-- 恢复完成后，恢复参数
SET GLOBAL innodb_flush_log_at_trx_commit = 1;
SET GLOBAL sync_binlog = 1;
SET GLOBAL unique_checks = 1;
SET GLOBAL foreign_key_checks = 1;
```

**方案优势**：
- 可以恢复到任意时间点
- 全量备份 + 增量备份，减少恢复时间
- 自动化脚本，降低人为错误

**注意事项**：
- 定期测试恢复流程，确保备份可用
- 保留足够的binlog，避免过期清理
- 恢复时注意字符集和时区设置

</details>

## 下一章预告

恭喜你完成了日志系统的学习！在下一章中，我们将深入探讨MySQL的缓冲池机制，包括：

- **Buffer Pool**：如何减少磁盘IO，提升查询性能？
- **LRU算法**：如何管理内存，决定哪些数据留在内存中？
- **脏页刷盘**：修改后的数据如何安全地写回磁盘？
- **预读机制**：如何预测并提前加载可能需要的数据？

缓冲池是MySQL性能优化的关键，让我们继续探索吧！
