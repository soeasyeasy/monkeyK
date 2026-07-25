---
title: "第15章：性能优化实战"
description: "慢查询分析、执行计划、索引优化、配置调优"
---

# 第15章：性能优化实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 数据库查询很慢，怎么找出问题 SQL？
- EXPLAIN 是什么？怎么看执行计划？
- 如何优化 SQL 和 MySQL 配置？

这一章就是为了解答这些问题。我们会从实际场景出发，帮你学会如何分析和优化数据库性能。

---

## 15.1 为什么需要性能优化？

### 慢查询的痛苦

假设你有一个电商网站，用户查询订单列表时：
- 第一次查询：3 秒
- 第二次查询：5 秒
- 高峰期：10 秒以上

用户体验极差，可能直接流失。

这就像你去餐厅吃饭，点菜后等了半小时才上菜，下次你还会来吗？

### 性能优化的解决方式：找到瓶颈，针对性优化

性能优化就是找出慢的地方，然后改进。

打个比方：你开车从 A 到 B，发现路上很堵。优化方式可以是：
- 换一条路（优化 SQL）
- 拓宽道路（增加索引）
- 升级发动机（调整配置）

| 对比项 | 不优化 | 优化后 |
|--------|--------|--------|
| 查询速度 | 慢，用户体验差 | 快，用户体验好 |
| 服务器负载 | 高，可能崩溃 | 低，稳定运行 |
| 并发能力 | 低，只能支持少量用户 | 高，支持大量并发 |
| 成本 | 需要更多服务器 | 现有服务器就能支撑 |

> 一句话总结：性能优化是让数据库"跑得更快"的技术，用更少的资源做更多的事。

---

## 15.2 慢查询日志

### 什么是慢查询日志？

慢查询日志记录了所有执行时间超过阈值的 SQL 语句。

打个比方：慢查询日志就像餐厅的"投诉记录"，记录了所有顾客抱怨上菜慢的订单。通过分析这些记录，可以找出哪些菜做得慢。

### 开启慢查询日志

```sql
-- 查看慢查询日志是否开启
SHOW VARIABLES LIKE 'slow_query_log';
-- 显示 ON 表示已开启

-- 查看慢查询阈值
SHOW VARIABLES LIKE 'long_query_time';
-- 显示超过多少秒的查询会被记录

-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
-- 开启慢查询日志

-- 设置慢查询阈值为 1 秒
SET GLOBAL long_query_time = 1;
-- 超过 1 秒的查询会被记录

-- 查看慢查询日志文件路径
SHOW VARIABLES LIKE 'slow_query_log_file';
-- 显示日志文件位置
```

### 查看慢查询日志

```bash
# 直接查看日志文件
tail -100 /var/log/mysql/slow.log
# 查看最后 100 行

# 使用 mysqldumpslow 分析
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log
# -s t：按时间排序
# -t 10：显示前 10 条
# 分析最慢的 10 条查询
```

### 慢查询日志的作用

| 作用 | 说明 |
|------|------|
| 找出慢 SQL | 识别执行时间长的查询 |
| 性能瓶颈分析 | 找出系统的性能瓶颈 |
| 优化依据 | 为优化提供数据支持 |
| 监控趋势 | 监控查询性能的变化趋势 |

---

## 15.3 EXPLAIN 执行计划

### 什么是 EXPLAIN？

EXPLAIN 可以查看 SQL 语句的执行计划，告诉你 MySQL 是如何执行这条 SQL 的。

打个比方：EXPLAIN 就像导航软件，告诉你从 A 到 B 的路线：走哪条路、要不要转弯、预计多长时间。

### 使用 EXPLAIN

```sql
-- 查看查询的执行计划
EXPLAIN SELECT * FROM users WHERE age = 25;
-- 显示这条查询的执行计划
```

### EXPLAIN 各字段含义

| 字段 | 含义 | 重要值 |
|------|------|--------|
| id | 查询的序号 | - |
| select_type | 查询类型 | SIMPLE（简单）、PRIMARY（主查询）、SUBQUERY（子查询） |
| table | 访问的表 | - |
| type | 访问类型 | system > const > eq_ref > ref > range > index > ALL |
| possible_keys | 可能使用的索引 | - |
| key | 实际使用的索引 | NULL 表示未使用索引 |
| key_len | 使用的索引长度 | 越长越好 |
| rows | 预计扫描的行数 | 越少越好 |
| Extra | 额外信息 | Using index（覆盖索引）、Using filesort（需要排序） |

### type 字段详解

type 字段表示访问类型，从好到差：

```
system > const > eq_ref > ref > range > index > ALL
```

| type | 含义 | 性能 |
|------|------|------|
| system | 表只有一行 | 最好 |
| const | 通过索引一次就找到 | 很好 |
| eq_ref | 唯一索引扫描 | 好 |
| ref | 非唯一索引扫描 | 较好 |
| range | 索引范围扫描 | 一般 |
| index | 全索引扫描 | 较差 |
| ALL | 全表扫描 | 最差 |

### EXPLAIN 示例

```sql
-- 示例 1：使用索引
EXPLAIN SELECT * FROM users WHERE id = 1;
-- type: const（常量查询）
-- key: PRIMARY（使用主键索引）
-- rows: 1（只扫描 1 行）

-- 示例 2：未使用索引
EXPLAIN SELECT * FROM users WHERE age = 25;
-- type: ALL（全表扫描）
-- key: NULL（未使用索引）
-- rows: 10000（扫描 10000 行）

-- 示例 3：覆盖索引
EXPLAIN SELECT id, name FROM users WHERE id = 1;
-- Extra: Using index（覆盖索引，不需要回表）
```

---

## 15.4 SQL 优化技巧

### 1. 避免 SELECT *

```sql
-- 错误写法
SELECT * FROM users WHERE age = 25;
-- 查询所有列，可能包含不需要的大字段

-- 正确写法
SELECT id, name, email FROM users WHERE age = 25;
-- 只查询需要的列，减少数据传输
```

### 2. 使用索引

```sql
-- 错误写法：未使用索引
SELECT * FROM users WHERE YEAR(create_time) = 2024;
-- 对索引列使用函数，索引失效

-- 正确写法：使用索引
SELECT * FROM users 
WHERE create_time >= '2024-01-01' 
AND create_time < '2025-01-01';
-- 范围查询，索引正常工作
```

### 3. 避免子查询，使用 JOIN

```sql
-- 错误写法：子查询
SELECT * FROM users 
WHERE id IN (SELECT user_id FROM orders);
-- 子查询效率低

-- 正确写法：JOIN
SELECT DISTINCT u.* 
FROM users u
JOIN orders o ON u.id = o.user_id;
-- JOIN 效率更高
```

### 4. 使用 LIMIT 限制结果

```sql
-- 错误写法：查询所有
SELECT * FROM users WHERE age = 25;
-- 可能返回大量数据

-- 正确写法：限制结果
SELECT * FROM users WHERE age = 25 LIMIT 100;
-- 只返回前 100 条
```

### 5. 避免在 WHERE 中使用函数

```sql
-- 错误写法
SELECT * FROM users WHERE UPPER(name) = 'JOHN';
-- 对列使用函数，索引失效

-- 正确写法
SELECT * FROM users WHERE name = 'john';
-- 在应用层转换，或使用函数索引
```

### SQL 优化对比表

| 优化技巧 | 错误写法 | 正确写法 | 原因 |
|----------|----------|----------|------|
| 避免 SELECT * | SELECT * | SELECT 具体列 | 减少数据传输 |
| 使用索引 | WHERE YEAR(date) | WHERE date >= | 避免函数导致索引失效 |
| 使用 JOIN | WHERE IN (子查询) | JOIN | JOIN 效率更高 |
| 使用 LIMIT | 查询所有 | LIMIT N | 限制结果集大小 |
| 避免函数 | WHERE UPPER(name) | WHERE name | 避免索引失效 |

---

## 15.5 索引优化

### 1. 选择合适的索引列

```sql
-- 好的索引列
CREATE INDEX idx_user_id ON orders(user_id);
-- 经常用于查询、JOIN、排序的列

-- 不好的索引列
CREATE INDEX idx_gender ON users(gender);
-- 区分度低的列（只有男/女），索引效果差
```

### 2. 使用联合索引

```sql
-- 单列索引
CREATE INDEX idx_age ON users(age);
CREATE INDEX idx_status ON users(status);

-- 联合索引（推荐）
CREATE INDEX idx_age_status ON users(age, status);
-- 一个联合索引可以替代多个单列索引
```

### 3. 避免冗余索引

```sql
-- 冗余索引
CREATE INDEX idx_a ON users(a);
CREATE INDEX idx_ab ON users(a, b);
-- idx_a 是 idx_ab 的前缀，冗余了

-- 正确做法
CREATE INDEX idx_ab ON users(a, b);
-- 只需要 idx_ab，它可以覆盖 a 的查询
```

### 4. 定期清理无用索引

```sql
-- 查看索引使用情况
SELECT * FROM sys.schema_unused_indexes;
-- 显示未使用的索引

-- 删除无用索引
DROP INDEX idx_unused ON users;
-- 删除未使用的索引，减少维护成本
```

---

## 15.6 MySQL 配置调优

### 1. innodb_buffer_pool_size

这是最重要的配置，决定了 InnoDB 缓冲池的大小。

```ini
# my.cnf 配置文件
[mysqld]
innodb_buffer_pool_size = 4G
# 设置为物理内存的 50%-70%
```

打个比方：buffer pool 就像餐厅的餐桌，桌子越多，能同时接待的客人越多。

### 2. innodb_log_file_size

决定了 redo log 的大小。

```ini
[mysqld]
innodb_log_file_size = 1G
# 设置为 1-2G，根据写入量调整
```

### 3. max_connections

决定了最大连接数。

```ini
[mysqld]
max_connections = 500
# 根据并发需求设置，不要设置过大
```

### 4. query_cache_size（MySQL 5.7）

查询缓存的大小。

```ini
[mysqld]
query_cache_size = 128M
# MySQL 8.0 已移除查询缓存
```

### 配置调优对比表

| 配置项 | 作用 | 推荐值 | 说明 |
|--------|------|--------|------|
| innodb_buffer_pool_size | 缓冲池大小 | 物理内存的 50%-70% | 最重要的配置 |
| innodb_log_file_size | redo log 大小 | 1-2G | 根据写入量调整 |
| max_connections | 最大连接数 | 500-1000 | 根据并发需求 |
| query_cache_size | 查询缓存 | 128M（5.7） | 8.0 已移除 |

---

## 15.7 新手常见误区

### 误区 1："索引越多越好"

错！索引虽然加快查询，但会拖慢写入。每个索引都要占用空间，每次 INSERT/UPDATE/DELETE 都要维护索引。应该根据实际查询需求，合理创建索引。

### 误区 2："SELECT * 没关系"

错！SELECT * 会查询所有列，包括不需要的大字段（如 TEXT、BLOB），增加数据传输量。应该只查询需要的列。

### 误区 3："EXPLAIN 的 rows 越少越好"

不完全对。rows 是预计扫描的行数，越少越好，但还要看 type 字段。如果 type 是 ALL（全表扫描），即使 rows 少，性能也很差。

### 误区 4："配置调优可以解决所有性能问题"

错！配置调优只是辅助手段，根本还是要优化 SQL 和索引。如果 SQL 写得差，再好的配置也没用。

### 误区 5："慢查询日志开启后不影响性能"

有一定影响。慢查询日志会记录所有超过阈值的查询，增加磁盘 I/O。建议在需要分析时开启，平时可以关闭。

---

## 15.8 动手练习

### 练习 1：使用 EXPLAIN 分析查询

使用 EXPLAIN 分析以下查询的执行计划：

```sql
SELECT * FROM users WHERE age = 25;
```

判断是否使用了索引，type 是什么。

<details>
<summary>点击查看答案</summary>

```sql
EXPLAIN SELECT * FROM users WHERE age = 25;
```

如果 age 列没有索引：
- type: ALL（全表扫描）
- key: NULL（未使用索引）
- rows: 表中所有行数

如果 age 列有索引：
- type: ref（非唯一索引扫描）
- key: idx_age（使用的索引名）
- rows: 预计扫描的行数

</details>

### 练习 2：优化慢查询

以下查询很慢，请优化：

```sql
SELECT * FROM orders 
WHERE DATE(order_date) = '2024-01-15';
```

<details>
<summary>点击查看答案</summary>

```sql
-- 优化后的查询
SELECT * FROM orders 
WHERE order_date >= '2024-01-15 00:00:00' 
AND order_date < '2024-01-16 00:00:00';
```

原查询对 order_date 使用了 DATE() 函数，导致索引失效。改成范围查询后，索引可以正常工作。

</details>

### 练习 3（挑战）：配置调优

假设服务器有 16G 内存，请设置 innodb_buffer_pool_size 的值。

<details>
<summary>点击查看答案</summary>

```ini
# my.cnf
[mysqld]
innodb_buffer_pool_size = 10G
# 设置为物理内存的 60%-70%
# 16G * 0.6 = 9.6G，约 10G
```

innodb_buffer_pool_size 通常设置为物理内存的 50%-70%，留出空间给操作系统和其他进程。

</details>

---

## 下一章预告

下一章我们会学习 **高可用与集群**。你会了解主从复制、读写分离、MGR（MySQL Group Replication）和分库分表。这些是支撑大规模应用的核心技术。
