---
title: "第 16 章：性能调优实战"
description: "深入 MySQL 性能调优，掌握慢查询分析、执行计划解读、参数调优及实战案例"
---

# 第 16 章：性能调优实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 数据库查询越来越慢，怎么找出是哪些 SQL 拖慢了系统？
- EXPLAIN 输出的那一堆字段到底怎么看？哪些指标最关键？
- MySQL 那么多配置参数，该调哪些？怎么调？
- 有没有真实的优化案例可以参考？

这一章就是为了解答这些问题。我们会从"给数据库看病"这个角度出发，用生活中的例子帮你搞懂 **MySQL 性能调优的完整方法论**，让你学会"诊断 → 分析 → 开方 → 验证"的优化流程。

---

## 1 为什么需要性能调优？

### 痛点分析

想象你开了一家餐厅，最近顾客总抱怨上菜慢：
- 你不知道哪个菜做得慢（找不到慢查询）
- 厨师在做菜，但不知道他在哪个步骤卡住了（不知道执行计划）
- 厨房设备可能没调到最佳状态（参数没优化）
- 有些菜的做法本身就很费时间（SQL 写法有问题）

这就像 MySQL 性能问题：
- 用户反馈页面加载慢，不知道是哪条 SQL 的问题
- SQL 写得有问题，全表扫描，但不知道
- MySQL 配置不合理，白白浪费硬件资源
- 数据量增长后，性能急剧下降

**不优化的后果：**
- 用户体验差，流失率高
- 服务器资源浪费，成本增加
- 高峰期系统崩溃，业务中断
- 问题越积越多，最后只能"推倒重来"

### 解决方案：系统化的性能调优

性能调优就像"给数据库做体检"：
1. 体检报告（慢查询日志）：找出有问题的 SQL
2. 详细检查（EXPLAIN 执行计划）：分析 SQL 为什么慢
3. 开处方（SQL 优化 + 参数调优）：针对性解决
4. 复查（验证效果）：确认优化有效

打个比方：

> 性能调优就像医生看病——先做检查（慢查询日志），再看化验单（EXPLAIN），然后开药（优化方案），最后复查（验证效果）。不能不看报告就瞎开药。

| 对比项 | 不调优 | 调优后 |
|--------|--------|--------|
| 查询速度 | 慢，用户抱怨 | 快，用户满意 |
| 服务器负载 | 高，CPU/内存吃满 | 低，资源利用合理 |
| 并发能力 | 低，几百人就卡 | 高，轻松应对上万并发 |
| 成本 | 需要不断加机器 | 现有机器就能支撑 |

> 一句话总结：性能调优是用最少的资源，做最多的事。

---

## 2 核心原理讲解

### 概念解释

性能调优的四个核心环节：

1. **慢查询分析**：找出"慢"在哪里
   - 开启慢查询日志，记录所有超过阈值的 SQL
   - 分析日志，找出最慢、最频繁的 SQL

2. **执行计划解读**：理解 MySQL 怎么执行 SQL
   - EXPLAIN 查看 SQL 的执行计划
   - 分析是否走了索引、扫描了多少行

3. **SQL 优化**：改写 SQL，让它更快
   - 避免全表扫描
   - 善用索引
   - 减少不必要的数据传输

4. **参数调优**：调整 MySQL 配置，让它跑得更好
   - innodb_buffer_pool_size：缓冲池大小
   - max_connections：最大连接数
   - innodb_log_file_size：redo log 大小

打个比方：

> 慢查询日志是"体检报告"，EXPLAIN 是"化验单"，SQL 优化是"治疗方案"，参数调优是"调理身体"。四步缺一不可。

### 性能优化流程

```
1. 发现问题
   └── 用户反馈慢 / 监控告警

2. 定位问题
   └── 开启慢查询日志 → 找出慢SQL

3. 分析原因
   └── EXPLAIN 执行计划 → 找出瓶颈

4. 制定方案
   └── SQL优化 / 索引优化 / 参数调优

5. 实施优化
   └── 修改SQL / 添加索引 / 调整配置

6. 验证效果
   └── 再次EXPLAIN → 对比优化前后
```

### 对比分析

| 优化手段 | 效果 | 难度 | 风险 | 优先级 |
|----------|------|------|------|--------|
| SQL 优化 | 立竿见影 | 低 | 低 | 最高 |
| 索引优化 | 显著提升 | 中 | 低 | 高 |
| 参数调优 | 辅助提升 | 中 | 中 | 中 |
| 架构调整 | 根本解决 | 高 | 高 | 最后手段 |

---

## 3 基础用法

### 示例 1：慢查询日志分析

```sql
-- ============================================
-- 步骤1：开启慢查询日志
-- ============================================

-- 查看慢查询日志是否开启
SHOW VARIABLES LIKE 'slow_query_log';              -- 查看是否开启
-- 结果：ON 表示已开启，OFF 表示未开启

-- 查看慢查询阈值（超过多少秒算"慢"）
SHOW VARIABLES LIKE 'long_query_time';             -- 查看阈值
-- 默认 10 秒，建议设为 1 秒

-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';                  -- 开启慢查询日志

-- 设置阈值为 1 秒
SET GLOBAL long_query_time = 1;                    -- 超过1秒的查询会被记录

-- 查看日志文件路径
SHOW VARIABLES LIKE 'slow_query_log_file';         -- 查看日志文件位置
-- 例如：/var/log/mysql/slow.log

-- ============================================
-- 步骤2：分析慢查询日志
-- ============================================

-- 方法1：使用 mysqldumpslow 工具（MySQL自带）
-- mysqldumpslow -s t -t 10 /var/log/mysql/slow.log
-- -s t：按执行时间排序
-- -t 10：显示前10条
-- 找出最慢的10条SQL

-- mysqldumpslow -s c -t 10 /var/log/mysql/slow.log
-- -s c：按执行次数排序
-- 找出执行最频繁的10条SQL

-- 方法2：使用 pt-query-digest（Percona工具，更强大）
-- pt-query-digest /var/log/mysql/slow.log
-- 生成详细的分析报告，包括：
-- - 最慢的SQL排名
-- - 每条SQL的执行次数、平均时间、总时间
-- - 按数据库、用户、主机等维度分析

-- ============================================
-- 步骤3：永久配置（my.cnf）
-- ============================================
-- [mysqld]
-- slow_query_log = ON                            -- 开启慢查询日志
-- long_query_time = 1                            -- 阈值1秒
-- slow_query_log_file = /var/log/mysql/slow.log  -- 日志文件路径
-- log_queries_not_using_indexes = ON             -- 记录未使用索引的查询
```

### 示例 2：EXPLAIN 执行计划详解

```sql
-- ============================================
-- EXPLAIN：查看SQL的执行计划
-- 告诉你MySQL是怎么执行这条SQL的
-- ============================================

-- 准备测试数据
CREATE TABLE users (                              -- 用户表
    id BIGINT PRIMARY KEY AUTO_INCREMENT,         -- 主键
    username VARCHAR(50) NOT NULL,                -- 用户名
    email VARCHAR(100) NOT NULL,                  -- 邮箱
    age INT NOT NULL,                             -- 年龄
    status TINYINT DEFAULT 1,                     -- 状态
    created_at DATETIME DEFAULT NOW(),            -- 创建时间
    INDEX idx_age (age),                          -- 年龄索引
    INDEX idx_email (email),                      -- 邮箱索引
    INDEX idx_age_status (age, status)            -- 联合索引
);

-- ============================================
-- 示例1：主键查询（最优）
-- ============================================
EXPLAIN SELECT * FROM users WHERE id = 1;         -- 查看执行计划
-- 结果分析：
-- id: 1                  查询序号
-- select_type: SIMPLE    简单查询
-- table: users           访问的表
-- type: const            通过主键索引一次找到（最好）
-- possible_keys: PRIMARY 可能使用的索引
-- key: PRIMARY           实际使用的索引
-- key_len: 8             使用的索引长度
-- rows: 1                预计扫描行数（只扫1行）
-- Extra: NULL            无额外操作

-- ============================================
-- 示例2：普通索引查询（较好）
-- ============================================
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';  -- 查看执行计划
-- 结果分析：
-- type: ref              非唯一索引扫描（较好）
-- key: idx_email         使用了email索引
-- rows: 1                预计扫描1行

-- ============================================
-- 示例3：全表扫描（最差）
-- ============================================
EXPLAIN SELECT * FROM users WHERE username = 'john';  -- 查看执行计划
-- 结果分析：
-- type: ALL              全表扫描（最差！）
-- key: NULL              没有使用任何索引
-- rows: 100000           预计扫描10万行
-- Extra: Using where     需要逐行过滤

-- ============================================
-- 示例4：覆盖索引（不需要回表）
-- ============================================
EXPLAIN SELECT age, status FROM users WHERE age = 25;  -- 查看执行计划
-- 结果分析：
-- type: ref              索引扫描
-- key: idx_age_status    使用联合索引
-- Extra: Using index     覆盖索引！只查索引，不回表
-- 解释：查询的列（age, status）都在索引中，不需要回表查数据行

-- ============================================
-- 示例5：索引失效（函数导致）
-- ============================================
EXPLAIN SELECT * FROM users WHERE YEAR(created_at) = 2024;  -- 查看执行计划
-- 结果分析：
-- type: ALL              全表扫描！
-- key: NULL              索引失效
-- 原因：对索引列使用函数，索引无法使用
```

### 示例 3：SQL 优化实战

```sql
-- ============================================
-- 优化1：避免 SELECT *
-- ============================================

-- ❌ 错误写法：查询所有列
SELECT * FROM users WHERE age = 25;               -- 查询所有列
-- 问题：可能包含不需要的大字段（如TEXT、BLOB），浪费带宽

-- ✅ 正确写法：只查需要的列
SELECT id, username, email FROM users WHERE age = 25;  -- 只查需要的列
-- 好处：减少数据传输量，可能触发覆盖索引

-- ============================================
-- 优化2：避免索引列使用函数
-- ============================================

-- ❌ 错误写法：索引列使用函数
SELECT * FROM orders                              -- 查询订单
WHERE DATE(create_time) = '2024-01-15';           -- 对create_time使用函数
-- 问题：DATE()函数导致索引失效，全表扫描

-- ✅ 正确写法：改为范围查询
SELECT * FROM orders                              -- 查询订单
WHERE create_time >= '2024-01-15 00:00:00'        -- 范围起点
AND create_time < '2024-01-16 00:00:00';          -- 范围终点
-- 好处：索引正常工作，type变为range

-- ============================================
-- 优化3：用 JOIN 替代子查询
-- ============================================

-- ❌ 错误写法：子查询
SELECT * FROM users                               -- 查询用户
WHERE id IN (                                     -- 在子查询结果中
    SELECT user_id FROM orders WHERE amount > 100 -- 子查询：金额>100的订单
);
-- 问题：子查询效率低，MySQL可能无法优化

-- ✅ 正确写法：JOIN
SELECT DISTINCT u.*                               -- 查询用户（去重）
FROM users u                                      -- 用户表
JOIN orders o ON u.id = o.user_id                 -- 关联订单表
WHERE o.amount > 100;                             -- 金额>100
-- 好处：JOIN效率更高，MySQL能更好地优化

-- ============================================
-- 优化4：使用 LIMIT 限制结果
-- ============================================

-- ❌ 错误写法：不限制结果
SELECT * FROM users WHERE status = 1;             -- 查询所有活跃用户
-- 问题：可能返回几万条数据，内存撑爆

-- ✅ 正确写法：限制结果数量
SELECT * FROM users WHERE status = 1 LIMIT 100;   -- 只取前100条
-- 好处：控制返回数据量，分页查询

-- ============================================
-- 优化5：避免隐式类型转换
-- ============================================

-- ❌ 错误写法：类型不匹配
SELECT * FROM users WHERE phone = 13800138000;    -- phone是VARCHAR，但传了数字
-- 问题：隐式类型转换导致索引失效

-- ✅ 正确写法：类型匹配
SELECT * FROM users WHERE phone = '13800138000';  -- 传入字符串，类型匹配
-- 好处：索引正常工作
```

### 示例 4：索引优化

```sql
-- ============================================
-- 索引优化：创建合适的索引
-- ============================================

-- ============================================
-- 优化1：选择合适的索引列
-- ============================================

-- ✅ 好的索引列：区分度高、经常用于查询/JOIN/排序
CREATE INDEX idx_user_id ON orders(user_id);      -- 用户ID，区分度高

-- ❌ 不好的索引列：区分度低
CREATE INDEX idx_gender ON users(gender);         -- 性别只有男/女，区分度太低
-- 问题：索引效果差，MySQL可能直接全表扫描

-- ============================================
-- 优化2：使用联合索引（最左前缀原则）
-- ============================================

-- 联合索引：(age, status)
-- 可以支持的查询：
SELECT * FROM users WHERE age = 25;               -- ✅ 使用索引（最左前缀）
SELECT * FROM users WHERE age = 25 AND status = 1; -- ✅ 使用索引（完整匹配）
SELECT * FROM users WHERE status = 1;             -- ❌ 不使用索引（跳过age）
-- 解释：联合索引遵循最左前缀原则

-- ============================================
-- 优化3：避免冗余索引
-- ============================================

-- ❌ 冗余索引
CREATE INDEX idx_a ON users(age);                 -- 单列索引
CREATE INDEX idx_age_status ON users(age, status); -- 联合索引
-- 问题：idx_a 是 idx_age_status 的前缀，冗余了

-- ✅ 正确做法
CREATE INDEX idx_age_status ON users(age, status); -- 只需要联合索引
-- 联合索引已经覆盖了age的查询，不需要额外的单列索引

-- ============================================
-- 优化4：覆盖索引
-- ============================================

-- 如果有联合索引 (age, status)
-- ✅ 覆盖索引：查询的列都在索引中
SELECT age, status FROM users WHERE age = 25;     -- 不需要回表
-- Extra: Using index（覆盖索引，性能最好）

-- ❌ 非覆盖索引：查询的列不在索引中
SELECT * FROM users WHERE age = 25;               -- 需要回表查数据行
-- 解释：虽然用了索引，但还需要回表，多一次IO
```

### 示例 5：参数调优

```ini
# ============================================
# MySQL 关键参数调优（my.cnf）
# ============================================

[mysqld]
# ============================================
# 1. innodb_buffer_pool_size（最重要）
# 决定InnoDB缓冲池大小，缓存数据和索引
# ============================================
innodb_buffer_pool_size = 4G                      # 物理内存的50%-70%
# 类比：就像餐厅的餐桌数量，桌子越多能同时接待的客人越多
# 16G内存的服务器 → 设为8-10G
# 32G内存的服务器 → 设为20-22G

# ============================================
# 2. innodb_log_file_size
# 决定redo log大小，影响写入性能
# ============================================
innodb_log_file_size = 1G                         # 建议1-2G
# 类比：就像笔记本的大小，本子越大能记录的越多，不用频繁换本子
# 写入量大 → 设大一点（2G）
# 写入量小 → 设小一点（256M）

# ============================================
# 3. max_connections
# 最大连接数
# ============================================
max_connections = 500                             # 根据并发需求设置
# 类比：餐厅最多能同时接待多少桌客人
# 不要设太大，每个连接都占内存
# 一般 500-1000 足够

# ============================================
# 4. innodb_flush_log_at_trx_commit
# 控制redo log刷盘策略
# ============================================
innodb_flush_log_at_trx_commit = 1                # 1=最安全 2=较快 0=最快
# 1：每次提交都刷盘（最安全，性能一般）
# 2：每次提交写OS缓存，每秒刷盘（较快，宕机可能丢1秒数据）
# 0：每秒刷盘（最快，宕机可能丢1秒数据）

# ============================================
# 5. sync_binlog
# 控制binlog刷盘策略
# ============================================
sync_binlog = 1                                   # 1=最安全 0=最快
# 1：每次提交都刷盘（最安全）
# 0：由OS决定何时刷盘（较快，可能丢数据）
# 建议：innodb_flush_log_at_trx_commit=1 + sync_binlog=1（双1配置，最安全）

# ============================================
# 6. tmp_table_size / max_heap_table_size
# 内存临时表大小
# ============================================
tmp_table_size = 64M                              # 内存临时表大小
max_heap_table_size = 64M                         # 与tmp_table_size保持一致
# 类比：厨师的案板大小，案板太小就得频繁去仓库拿东西
```

### 示例 6：实战优化案例

```sql
-- ============================================
-- 实战案例：优化一个电商查询
-- ============================================

-- ❌ 优化前：慢查询（执行时间 5.2 秒）
SELECT o.*, u.username, p.name AS product_name    -- 查询订单+用户名+商品名
FROM orders o                                     -- 订单表
LEFT JOIN users u ON o.user_id = u.id             -- 关联用户表
LEFT JOIN products p ON o.product_id = p.id       -- 关联商品表
WHERE o.create_time >= '2024-01-01'               -- 时间范围
AND o.create_time < '2024-02-01'
AND o.status = 1                                  -- 状态过滤
ORDER BY o.create_time DESC                       -- 按时间倒序
LIMIT 20;                                         -- 取前20条

-- EXPLAIN 分析：
-- type: ALL（orders表全表扫描）
-- key: NULL（没有使用索引）
-- rows: 2000000（扫描200万行）
-- Extra: Using filesort（需要额外排序）

-- ============================================
-- 优化步骤1：添加合适的索引
-- ============================================
CREATE INDEX idx_status_time ON orders(status, create_time);  -- 联合索引
-- status 用于等值过滤，create_time 用于范围查询和排序

-- ============================================
-- 优化步骤2：只查需要的列
-- ============================================

-- ✅ 优化后：快查询（执行时间 0.05 秒）
SELECT o.id, o.order_no, o.amount, o.create_time, -- 只查需要的列
       u.username,                                 -- 用户名
       p.name AS product_name                      -- 商品名
FROM orders o                                     -- 订单表
INNER JOIN users u ON o.user_id = u.id            -- 改用INNER JOIN（确保有用户）
INNER JOIN products p ON o.product_id = p.id      -- 改用INNER JOIN
WHERE o.status = 1                                -- 先过滤状态
AND o.create_time >= '2024-01-01'                 -- 时间范围
AND o.create_time < '2024-02-01'
ORDER BY o.create_time DESC                       -- 排序
LIMIT 20;                                         -- 限制数量

-- EXPLAIN 分析：
-- type: range（范围扫描）
-- key: idx_status_time（使用了联合索引）
-- rows: 5000（只扫描5000行，比之前少了400倍）
-- Extra: Using index condition（索引条件下推）

-- ============================================
-- 优化效果对比
-- ============================================
-- 优化前：5.2秒 → 优化后：0.05秒
-- 提升：100倍以上！
```

---

## 4 对比表格

### EXPLAIN type 字段对比

| type | 含义 | 性能 | 说明 |
|------|------|------|------|
| system | 表只有一行 | 最好 | 系统表 |
| const | 主键/唯一索引等值查询 | 极好 | 一次就找到 |
| eq_ref | JOIN时主键/唯一索引匹配 | 很好 | 每个JOIN行只匹配一行 |
| ref | 普通索引等值查询 | 好 | 可能匹配多行 |
| range | 索引范围扫描 | 较好 | 有范围条件 |
| index | 全索引扫描 | 较差 | 扫描整棵索引树 |
| ALL | 全表扫描 | 最差 | 必须优化 |

### EXPLAIN Extra 字段对比

| Extra | 含义 | 是否需要优化 |
|-------|------|--------------|
| Using index | 覆盖索引 | 不需要，很好 |
| Using where | 需要WHERE过滤 | 正常 |
| Using index condition | 索引条件下推 | 不需要，很好 |
| Using filesort | 需要额外排序 | 需要优化 |
| Using temporary | 使用临时表 | 需要优化 |
| Using join buffer | 使用JOIN缓冲 | 需要优化（加索引） |

### 参数调优对比

| 参数 | 作用 | 推荐值 | 调大效果 | 调小效果 |
|------|------|--------|----------|----------|
| innodb_buffer_pool_size | 缓冲池 | 内存50-70% | 缓存更多数据，查询快 | 缓存少，频繁磁盘IO |
| innodb_log_file_size | redo log | 1-2G | 写入性能好 | 频繁切换日志 |
| max_connections | 最大连接数 | 500-1000 | 支持更多并发 | 连接被拒绝 |
| innodb_flush_log_at_trx_commit | 刷盘策略 | 1（安全）/2（快） | 1最安全 | 2/0更快但可能丢数据 |

---

## 5 新手常见误区

### 误区 1："索引越多越好"

❌ **错误**：给每个列都加上索引，觉得这样查询都快。

✅ **正确**：索引虽然加快查询，但会拖慢写入（每次 INSERT/UPDATE/DELETE 都要维护索引），还占用磁盘空间。应该根据实际查询需求，合理创建索引。

### 误区 2："SELECT * 没关系"

❌ **错误**：习惯性写 `SELECT *`，觉得方便。

✅ **正确**：`SELECT *` 会查询所有列，包括不需要的大字段（如 TEXT、BLOB），增加数据传输量。而且无法利用覆盖索引。应该只查询需要的列。

### 误区 3："EXPLAIN 的 rows 越少越好"

❌ **错误**：只看 rows 字段，觉得少就好。

✅ **正确**：rows 是预计扫描行数，越少越好，但还要看 type 字段。如果 type 是 ALL（全表扫描），即使 rows 少，性能也很差。要综合看 type、key、Extra。

### 误区 4："配置调优能解决所有性能问题"

❌ **错误**：SQL 写得差，却指望通过调参数来提升性能。

✅ **正确**：配置调优只是辅助手段，根本还是要优化 SQL 和索引。如果 SQL 全表扫描，再好的配置也救不了。优先级：SQL 优化 > 索引优化 > 参数调优。

### 误区 5："慢查询日志一直开着没关系"

❌ **错误**：生产环境一直开着慢查询日志，不管不问。

✅ **正确**：慢查询日志会增加磁盘 I/O，对性能有一定影响。建议在需要分析时开启，分析完就关闭。或者设置较高的阈值（如 2 秒），只记录真正慢的查询。

---

## 6 动手练习

### 练习 1（基础）：EXPLAIN 分析

有以下查询，使用 EXPLAIN 分析执行计划，判断是否使用了索引，type 是什么，是否需要优化。

```sql
SELECT * FROM users WHERE age = 25 AND status = 1;
```

已知 users 表有索引 `idx_age_status (age, status)`。

<details>
<summary>点击查看答案</summary>

```sql
EXPLAIN SELECT * FROM users WHERE age = 25 AND status = 1;
```

**预期结果：**
- type: ref（非唯一索引等值查询）
- key: idx_age_status（使用了联合索引）
- rows: 预计扫描行数（应该很少）
- Extra: Using where 或 Using index condition

**分析：**
- 使用了联合索引，性能较好
- 如果 Extra 显示 Using index，说明是覆盖索引，性能更好
- 但 `SELECT *` 无法覆盖索引，建议改为具体列

**优化建议：**
```sql
-- 如果只需要 age 和 status
SELECT age, status FROM users WHERE age = 25 AND status = 1;
-- Extra: Using index（覆盖索引，不需要回表）
```

</details>

### 练习 2（进阶）：优化慢查询

以下查询执行很慢（5 秒），请分析原因并优化：

```sql
SELECT * FROM orders
WHERE DATE_FORMAT(create_time, '%Y-%m-%d') = '2024-01-15'
AND UPPER(username) = 'JOHN';
```

<details>
<summary>点击查看答案</summary>

**问题分析：**
1. `DATE_FORMAT(create_time, ...)` 对索引列使用函数，索引失效
2. `UPPER(username)` 对索引列使用函数，索引失效
3. 两个条件都导致全表扫描

**优化后的查询：**

```sql
-- ✅ 优化后
SELECT id, order_no, amount, create_time           -- 只查需要的列
FROM orders
WHERE create_time >= '2024-01-15 00:00:00'         -- 范围查询，不用函数
AND create_time < '2024-01-16 00:00:00'            -- 范围终点
AND username = 'john';                             -- 不用UPPER，直接匹配
-- 如果username存的是大写，就传大写：username = 'JOHN'
```

**添加索引：**
```sql
CREATE INDEX idx_time_user ON orders(create_time, username);  -- 联合索引
```

**优化效果：**
- 优化前：全表扫描，5秒
- 优化后：索引范围扫描，预计 0.01 秒以内

</details>

### 练习 3（挑战）：综合优化方案

某电商系统，用户反馈"我的订单"页面加载很慢（3-5秒）。页面需要展示：
- 用户最近 20 条订单
- 每条订单的商品信息
- 订单总金额

已知信息：
- orders 表 500 万行
- order_items 表 2000 万行
- 当前查询使用了 LEFT JOIN + 子查询

请设计完整的优化方案，包括 SQL 优化、索引优化、参数优化。

<details>
<summary>点击查看答案</summary>

**完整优化方案：**

**1. SQL 优化：**

```sql
-- ❌ 优化前（慢）
SELECT o.*,
       (SELECT GROUP_CONCAT(p.name)
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = o.id) AS products,     -- 子查询，每条订单都执行一次
       (SELECT SUM(oi.price * oi.quantity)
        FROM order_items oi
        WHERE oi.order_id = o.id) AS total          -- 又一个子查询
FROM orders o
WHERE o.user_id = 100
ORDER BY o.create_time DESC;

-- ✅ 优化后（快）
SELECT o.id, o.order_no, o.create_time, o.status,  -- 只查需要的列
       oi_summary.product_names,                    -- 商品名称（预聚合）
       oi_summary.total_amount                      -- 总金额（预聚合）
FROM orders o
JOIN (                                              -- 先聚合order_items
    SELECT order_id,
           GROUP_CONCAT(p.name) AS product_names,
           SUM(oi.price * oi.quantity) AS total_amount
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE order_id IN (                             -- 只查当前用户的订单
        SELECT id FROM orders
        WHERE user_id = 100
        ORDER BY create_time DESC
        LIMIT 20
    )
    GROUP BY order_id
) oi_summary ON o.id = oi_summary.order_id
WHERE o.user_id = 100
ORDER BY o.create_time DESC
LIMIT 20;
```

**2. 索引优化：**

```sql
-- orders表索引
CREATE INDEX idx_user_time ON orders(user_id, create_time);  -- 用户+时间联合索引
-- 支持：WHERE user_id = ? ORDER BY create_time DESC LIMIT 20

-- order_items表索引
CREATE INDEX idx_order_id ON order_items(order_id);           -- 订单ID索引
-- 支持：WHERE order_id = ?

-- products表索引
-- 主键 id 已有索引
```

**3. 参数优化：**

```ini
[mysqld]
innodb_buffer_pool_size = 8G                      # 增大缓冲池（假设16G内存）
# 让更多数据缓存在内存中

sort_buffer_size = 4M                             # 排序缓冲区
# ORDER BY 操作会用到，适当增大

join_buffer_size = 4M                             # JOIN缓冲区
# JOIN操作会用到，适当增大
```

**4. 其他优化建议：**
- 开启查询缓存（MySQL 5.7）
- 考虑使用 Redis 缓存用户的最近订单
- 如果数据量继续增长，考虑分库分表

**预期效果：**
- 优化前：3-5 秒
- 优化后：0.1 秒以内（提升 30-50 倍）

</details>

---

## 下一章预告

恭喜你完成了 MySQL 原理教程的全部 16 章！

从主从复制、高可用架构、分库分表，到性能调优实战，你已经掌握了 MySQL 从基础到高级的核心知识。这些技术是支撑大规模应用的基础，也是面试中的高频考点。

记住，学习数据库是一个持续的过程，需要在实践中不断积累经验。祝你在今后的开发工作中，能够灵活运用这些知识，构建高效、稳定的数据库系统！
