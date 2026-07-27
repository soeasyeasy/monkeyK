---
title: "第15章：性能优化实战"
description: "慢查询分析、执行计划、索引优化、配置调优"
---

# 第15章：性能优化实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何发现慢查询？
- 如何解读执行计划？
- 如何优化索引？
- 如何调整 PostgreSQL 配置？
- 有哪些性能监控工具？

这一章就是为了解答这些问题。我们会先搞清楚 **性能分析的基本方法**，再学习**执行计划解读**，最后掌握**配置调优技术**。

---

## 15.1 为什么需要性能优化？

### 痛点分析

想象一下，你的应用响应越来越慢：

```
❌ 场景：
- 查询需要 10 秒才能返回结果
- 数据库 CPU 使用率 100%
- 用户抱怨应用太慢
- 系统经常超时
```

### 解决方案

使用性能优化技术：

```sql
-- ✅ 分析慢查询
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 25;

-- ✅ 添加索引
CREATE INDEX idx_users_age ON users(age);

-- ✅ 优化查询
SELECT id, name FROM users WHERE age > 25;  -- 只查询需要的列
```

优势：
- ✅ 查询速度提升
- ✅ 资源使用降低
- ✅ 用户体验改善

> **一句话总结**：性能优化可以让数据库运行更快、更稳定，提升用户体验。

---

## 15.2 核心原理

### 概念解释

**执行计划**

执行计划是 PostgreSQL 执行查询的步骤。

打个比方：

> 执行计划就像是**导航路线**：
> - 显示从起点到终点的路线
> - 可以选择不同的路线
> - 优化器选择最快的路线

**查询优化器**

查询优化器负责生成执行计划。

打个比方：

> 优化器就像是**导航软件**：
> - 分析所有可能的路线
> - 选择最快的路线
> - 考虑交通状况（数据分布）

---

## 15.3 基础用法

### 慢查询分析

**启用慢查询日志**

```bash
# postgresql.conf
log_min_duration_statement = 1000  # 记录超过 1 秒的查询
```

**查看慢查询**

```sql
-- 查看当前运行的查询
SELECT 
    pid,
    usename,
    query,
    state,
    query_start,
    now() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

### 执行计划

**EXPLAIN**

```sql
-- 查看执行计划
EXPLAIN SELECT * FROM users WHERE age > 25;

-- 结果示例：
-- Seq Scan on users  (cost=0.00..35.50 rows=10 width=100)
--   Filter: (age > 25)
```

**EXPLAIN ANALYZE**

```sql
-- 查看执行计划和实际执行时间
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 25;

-- 结果示例：
-- Seq Scan on users  (cost=0.00..35.50 rows=10 width=100) (actual time=0.015..0.500 rows=10 loops=1)
--   Filter: (age > 25)
-- Planning Time: 0.100 ms
-- Execution Time: 0.600 ms
```

**EXPLAIN (FORMAT JSON)**

```sql
-- 以 JSON 格式查看执行计划
EXPLAIN (FORMAT JSON) SELECT * FROM users WHERE age > 25;
```

### 执行计划解读

**扫描类型**

| 扫描类型 | 说明 | 适用场景 |
| --- | --- | --- |
| Seq Scan | 顺序扫描 | 小表、无索引 |
| Index Scan | 索引扫描 | 选择性高的查询 |
| Index Only Scan | 仅索引扫描 | 覆盖索引 |
| Bitmap Index Scan | 位图索引扫描 | 中等选择性 |

**连接方式**

| 连接方式 | 说明 | 适用场景 |
| --- | --- | --- |
| Nested Loop | 嵌套循环 | 小表连接 |
| Hash Join | 哈希连接 | 大表连接 |
| Merge Join | 归并连接 | 已排序数据 |

### 索引优化

**创建合适的索引**

```sql
-- 单列索引
CREATE INDEX idx_users_age ON users(age);

-- 复合索引
CREATE INDEX idx_users_city_age ON users(city, age);

-- 部分索引
CREATE INDEX idx_users_active ON users(id) WHERE status = 'active';

-- 表达式索引
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
```

**分析索引使用**

```sql
-- 查看索引使用情况
SELECT 
    indexrelname AS index_name,
    idx_scan AS scans,
    idx_tup_read AS tuples_read
FROM pg_stat_user_indexes
WHERE relname = 'users';

-- 查看未使用的索引
SELECT 
    indexrelname AS index_name
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

---

## 15.4 进阶用法

### 配置调优

**内存配置**

```bash
# postgresql.conf

# 共享缓冲区（建议：系统内存的 25%）
shared_buffers = 4GB

# 工作内存（建议：系统内存 / max_connections）
work_mem = 64MB

# 维护工作内存
maintenance_work_mem = 512MB

# 有效缓存大小（建议：系统内存的 75%）
effective_cache_size = 12GB
```

**WAL 配置**

```bash
# WAL 缓冲区
wal_buffers = 64MB

# 检查点配置
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min

# 最大 WAL 大小
max_wal_size = 4GB
min_wal_size = 1GB
```

**查询配置**

```bash
# 随机页面成本
random_page_cost = 1.1  # SSD 设为 1.1，HDD 设为 4.0

# 有效 IO 并发
effective_io_concurrency = 200  # SSD

# 并行查询
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

### 性能监控

**pg_stat_statements**

```sql
-- 安装扩展
CREATE EXTENSION pg_stat_statements;

-- 查看最耗时的查询
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- 查看调用次数最多的查询
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;
```

**pg_stat_activity**

```sql
-- 查看当前活动
SELECT 
    pid,
    usename,
    datname,
    query,
    state,
    wait_event_type,
    wait_event
FROM pg_stat_activity
WHERE state = 'active';
```

**pg_stat_user_tables**

```sql
-- 查看表统计
SELECT 
    relname AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

### 查询优化技巧

**避免 SELECT ***

```sql
-- ❌ 错误
SELECT * FROM users WHERE age > 25;

-- ✅ 正确
SELECT id, name, email FROM users WHERE age > 25;
```

**使用 LIMIT**

```sql
-- ❌ 错误：返回所有数据
SELECT * FROM users;

-- ✅ 正确：限制返回数量
SELECT * FROM users LIMIT 100;
```

**避免函数包装列**

```sql
-- ❌ 错误：不使用索引
SELECT * FROM users WHERE UPPER(name) = 'ZHANGSAN';

-- ✅ 正确：使用表达式索引
CREATE INDEX idx_users_upper_name ON users(UPPER(name));
SELECT * FROM users WHERE UPPER(name) = 'ZHANGSAN';
```

**使用 EXISTS 替代 IN**

```sql
-- ❌ 效率较低
SELECT * FROM users 
WHERE id IN (SELECT user_id FROM orders);

-- ✅ 效率更高
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
```

---

## 15.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| EXPLAIN | 查看执行计划 |
| EXPLAIN ANALYZE | 查看执行计划和实际时间 |
| 顺序扫描 | 全表扫描 |
| 索引扫描 | 使用索引 |
| 哈希连接 | 大表连接 |
| 嵌套循环 | 小表连接 |
| shared_buffers | 共享缓冲区 |
| work_mem | 工作内存 |
| pg_stat_statements | 查询统计 |

---

## 15.6 新手常见误区

### 误区 1："索引越多越好"

**错！** 索引会降低写入性能。

```sql
-- ❌ 错误：创建过多索引
CREATE INDEX idx1 ON users(col1);
CREATE INDEX idx2 ON users(col2);
CREATE INDEX idx3 ON users(col3);

-- ✅ 正确：只创建必要的索引
CREATE INDEX idx_users_email ON users(email);  -- 经常查询的列
```

### 误区 2："EXPLAIN 的结果不重要"

**错！** 执行计划是优化的关键。

```sql
-- ✅ 正确：分析执行计划
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 25;

-- 关注：
-- 1. 扫描类型（Seq Scan vs Index Scan）
-- 2. 实际时间
-- 3. 行数估计
```

### 误区 3："配置调优可以解决所有问题"

**错！** 应该先优化查询和索引。

建议：
- ✅ 先优化查询（避免 SELECT *、使用 LIMIT）
- ✅ 再优化索引（创建合适的索引）
- ✅ 最后调优配置（调整参数）

### 误区 4："不需要监控性能"

**错！** 应该持续监控性能。

```sql
-- ✅ 定期监控
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- ✅ 设置告警
-- 当查询时间超过阈值时告警
```

---

## 15.7 动手练习

### 练习 1：执行计划分析

分析以下查询的执行计划，并优化。

```sql
SELECT * FROM users WHERE age > 25 AND city = '北京';
```

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 分析执行计划
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 25 AND city = '北京';

-- 2. 如果看到 Seq Scan，创建索引
CREATE INDEX idx_users_city_age ON users(city, age);

-- 3. 再次分析
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 25 AND city = '北京';

-- 4. 应该看到 Index Scan
```

</details>

### 练习 2：慢查询优化

优化以下慢查询：

```sql
SELECT * FROM orders 
WHERE user_id IN (SELECT id FROM users WHERE age > 30)
AND created_at > '2024-01-01';
```

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 分析执行计划
EXPLAIN ANALYZE SELECT * FROM orders 
WHERE user_id IN (SELECT id FROM users WHERE age > 30)
AND created_at > '2024-01-01';

-- 2. 优化查询（使用 JOIN）
EXPLAIN ANALYZE 
SELECT o.* 
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.age > 30 AND o.created_at > '2024-01-01';

-- 3. 创建索引
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);
CREATE INDEX idx_users_age ON users(age);

-- 4. 再次分析
EXPLAIN ANALYZE 
SELECT o.* 
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.age > 30 AND o.created_at > '2024-01-01';
```

</details>

### 练习 3（挑战）：配置调优

为一个高并发系统设计 PostgreSQL 配置。

<details>
<summary>点击查看答案</summary>

```bash
# postgresql.conf

# 连接配置
max_connections = 200

# 内存配置（假设 32GB 内存）
shared_buffers = 8GB
work_mem = 64MB
maintenance_work_mem = 1GB
effective_cache_size = 24GB

# WAL 配置
wal_buffers = 64MB
max_wal_size = 8GB
min_wal_size = 2GB
checkpoint_completion_target = 0.9

# 并行查询
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8

# 其他配置
random_page_cost = 1.1  # SSD
effective_io_concurrency = 200

# 日志配置
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
```

</details>

---

## 下一章预告

下一章我们会学习 **高可用与集群**——了解流复制和逻辑复制的原理，掌握主从切换技术，以及使用 Patroni 搭建高可用集群。
