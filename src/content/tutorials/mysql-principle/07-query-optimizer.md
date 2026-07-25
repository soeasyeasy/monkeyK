---
title: "第7章：查询优化器原理"
description: "深入理解基于成本优化、执行计划生成、连接算法、子查询优化"
---

# 第7章：查询优化器原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MySQL 是怎么决定用哪个索引的？为什么有时候选了"错误"的索引？
- 什么是执行计划？MySQL 是怎么生成执行计划的？
- JOIN 查询时，MySQL 是怎么选择连接算法的？Nested Loop、Hash Join、Sort Merge 有什么区别？
- 子查询为什么通常性能较差？如何优化子查询？

这一章我们会彻底搞懂 **查询优化器的底层原理**，从 MySQL 的决策过程理解它是如何选择最优执行计划的。搞懂了这些，你就能理解 MySQL 的"智能"决策，写出更高效的查询。

---

## 7.1 为什么需要查询优化器？

### 痛点分析

写 SQL 查询时，你可能会想：

1. **同样的查询，不同的写法，性能差异巨大**：为什么有的写法快，有的写法慢？
2. **MySQL 怎么选索引**：有多个索引时，MySQL 怎么选？为什么有时候选错了？
3. **JOIN 查询很慢**：多表 JOIN 时，MySQL 是怎么执行的？为什么有时候特别慢？
4. **子查询性能差**：为什么子查询通常比 JOIN 慢？怎么优化？

### 生活化类比

把查询优化器想象成**导航软件**：

- **SQL 查询**：就像你要从 A 地到 B 地
- **查询优化器**：就像导航软件，帮你规划最优路线
- **执行计划**：就像导航给出的路线方案
- **成本估算**：就像导航估算的时间（考虑距离、路况、红绿灯等）

导航软件会考虑多条路线，计算每条路线的成本（时间、距离），然后选择最优的。查询优化器也是一样，它会考虑多种执行方式，计算每种方式的成本（IO、CPU），然后选择成本最低的执行计划。

---

## 7.2 核心原理讲解

### 7.2.1 基于成本的优化（Cost-Based Optimization）

**定义**：查询优化器通过估算每种执行计划的成本（IO + CPU），选择成本最低的执行计划。

**生活化类比**：

基于成本的优化就像**购物时比较价格**：
- 你要买一件商品，有多个商店可选
- 你会比较每个商店的价格、距离、交通成本
- 选择总成本最低的商店

**成本估算因素**：

| 因素 | 说明 | 影响 |
|------|------|------|
| 表的大小 | 表有多少行数据 | 影响全表扫描的成本 |
| 索引的选择性 | 索引能过滤掉多少数据 | 影响索引扫描的成本 |
| 数据分布 | 数据的分布情况（如年龄分布） | 影响过滤后的行数估算 |
| IO 成本 | 读取磁盘的次数 | 磁盘 IO 很慢，成本最高 |
| CPU 成本 | 计算和比较的次数 | CPU 很快，成本较低 |

**示例**：

```sql
-- 查询：SELECT * FROM users WHERE age = 25;

-- 优化器会考虑两种执行计划：
-- 计划 1：全表扫描
--   成本 = 读取所有行的 IO 成本
--   如果表有 100 万行，成本很高

-- 计划 2：使用 idx_age 索引
--   成本 = 索引扫描 + 回表的 IO 成本
--   如果 age = 25 的行有 1000 行，成本 = 1000 次回表

-- 优化器会选择成本低的计划
```

**查看优化器的选择**：

```sql
EXPLAIN SELECT * FROM users WHERE age = 25;
-- 查看 type、key、rows 等列，了解优化器的选择

-- type 列：
-- ALL：全表扫描
-- index：全索引扫描
-- range：索引范围扫描
-- ref：索引等值查询
-- const：主键或唯一索引等值查询

-- key 列：
-- 实际使用的索引名称
-- NULL 表示没有使用索引

-- rows 列：
-- 预估需要扫描的行数
```

### 7.2.2 执行计划生成

**定义**：查询优化器根据 SQL 语句和表统计信息，生成一个最优的执行计划。

**执行计划的组成部分**：

1. **访问路径**：如何访问表（全表扫描、索引扫描等）
2. **连接顺序**：多表 JOIN 时，表的连接顺序
3. **连接算法**：使用什么连接算法（Nested Loop、Hash Join 等）
4. **过滤条件**：在哪个阶段过滤数据
5. **排序方式**：如何排序（文件排序、索引排序）

**生成过程**：

```
1. 解析 SQL 语句
   ↓
2. 查询重写（简化查询、子查询转 JOIN 等）
   ↓
3. 生成候选执行计划
   ↓
4. 估算每个计划的成本
   ↓
5. 选择成本最低的计划
   ↓
6. 执行查询
```

**查看执行计划**：

```sql
-- 使用 EXPLAIN 查看执行计划
EXPLAIN SELECT * FROM users WHERE age = 25;

-- 执行计划的关键列：
-- id：查询的标识符
-- select_type：查询类型（SIMPLE、PRIMARY、SUBQUERY 等）
-- table：访问的表
-- type：访问类型（ALL、index、range、ref、const）
-- possible_keys：可能使用的索引
-- key：实际使用的索引
-- key_len：使用的索引长度
-- ref：索引的哪一列被使用了
-- rows：预估扫描行数
-- Extra：额外信息（Using index、Using where 等）
```

### 7.2.3 连接算法

多表 JOIN 时，MySQL 使用不同的连接算法，性能差异很大。

#### 算法 1：Nested Loop Join（嵌套循环连接）

**原理**：对外层表的每一行，扫描内层表找到匹配的行。

**生活化类比**：

就像**找对象**：
- 你有 10 个朋友（外层表）
- 每个朋友都要在 100 个候选人（内层表）中找对象
- 每个朋友都要遍历 100 个候选人
- 总共要比较 10 × 100 = 1000 次

**示例**：

```sql
-- 查询：SELECT * FROM users u JOIN orders o ON u.id = o.user_id;

-- Nested Loop Join 执行过程：
-- 1. 扫描 users 表的每一行
-- 2. 对 users 的每一行，扫描 orders 表找到 user_id 匹配的行
-- 3. 返回匹配的结果

-- 成本：O(M × N)，M 和 N 是两个表的行数
-- 如果 users 有 1000 行，orders 有 10000 行，总共要比较 1000 × 10000 = 1000 万次
```

**适用场景**：
- 小表 JOIN 大表
- 内层表有索引
- 数据量不大

#### 算法 2：Hash Join（哈希连接）

**原理**：先扫描一个小表，建立哈希表；然后扫描大表，用哈希表快速查找匹配的行。

**生活化类比**：

就像**查字典**：
- 先把小表（字典目录）建成哈希表（目录）
- 然后扫描大表（字典正文），用哈希表快速查找
- 只需要扫描两遍，不需要嵌套循环

**示例**：

```sql
-- 查询：SELECT * FROM users u JOIN orders o ON u.id = o.user_id;

-- Hash Join 执行过程：
-- 1. 扫描 users 表（小表），建立哈希表，key 是 user_id
-- 2. 扫描 orders 表（大表），对每一行用哈希表查找匹配的 user_id
-- 3. 返回匹配的结果

-- 成本：O(M + N)，M 和 N 是两个表的行数
-- 如果 users 有 1000 行，orders 有 10000 行，总共只需扫描 11000 次
```

**适用场景**：
- 大表 JOIN 大表
- 没有合适的索引
- MySQL 8.0 及之后版本支持

**注意**：MySQL 8.0 之前不支持 Hash Join，只能用 Nested Loop Join。MySQL 8.0 引入了 Hash Join，性能大幅提升。

#### 算法 3：Sort Merge Join（排序合并连接）

**原理**：先对两个表按连接键排序，然后合并两个有序序列。

**生活化类比**：

就像**合并两个有序数组**：
- 先把两个数组排序
- 然后用两个指针，从头到尾合并
- 只需要扫描两遍

**示例**：

```sql
-- 查询：SELECT * FROM users u JOIN orders o ON u.id = o.user_id;

-- Sort Merge Join 执行过程：
-- 1. 对 users 表按 id 排序
-- 2. 对 orders 表按 user_id 排序
-- 3. 用两个指针，合并两个有序序列

-- 成本：O(M log M + N log N)，主要是排序的成本
-- 如果表已经有序（如使用了索引），成本会大幅降低
```

**适用场景**：
- 两个表都很大
- 连接键已经有序（如使用了索引）
- 不适合 Nested Loop 和 Hash Join

**连接算法对比**：

| 算法 | 成本 | 适用场景 | MySQL 版本 |
|------|------|---------|-----------|
| Nested Loop | O(M × N) | 小表 JOIN 大表，内层有索引 | 所有版本 |
| Hash Join | O(M + N) | 大表 JOIN 大表，无索引 | 8.0+ |
| Sort Merge | O(M log M + N log N) | 大表 JOIN，连接键已有序 | 所有版本 |

### 7.2.4 子查询优化

**定义**：子查询是指在一个查询中嵌套另一个查询。

**问题**：子查询通常性能较差，因为可能会被执行多次。

**示例**：

```sql
-- 子查询：查找有订单的用户
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- 执行过程（未优化）：
-- 1. 对 users 表的每一行
-- 2. 执行子查询 SELECT user_id FROM orders
-- 3. 检查 user_id 是否在子查询结果中
-- 4. 如果 users 有 1000 行，子查询要执行 1000 次

-- 成本：O(M × N)，和 Nested Loop 一样
```

**优化方法 1：改写为 JOIN**

```sql
-- 原查询：子查询
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- 优化后：改写为 JOIN
SELECT DISTINCT u.* FROM users u JOIN orders o ON u.id = o.user_id;

-- 优化原理：
-- JOIN 只需要扫描两个表一次
-- 成本：O(M + N) 或 O(M × N)（取决于连接算法）
-- 比子查询快很多
```

**优化方法 2：使用 EXISTS**

```sql
-- 原查询：IN 子查询
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- 优化后：EXISTS 子查询
SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- 优化原理：
-- EXISTS 子查询在找到第一个匹配行后就停止
-- 不需要扫描所有 orders
-- 如果匹配行很多，EXISTS 比 IN 快
```

**优化方法 3：MySQL 自动优化**

MySQL 5.6 及之后版本会自动优化子查询：

```sql
-- 子查询
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- MySQL 会自动改写为 semi-join
-- 类似于 JOIN，但只返回 users 表的列
-- 性能大幅提升
```

**查看优化效果**：

```sql
-- 使用 EXPLAIN 查看
EXPLAIN SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- 如果 Extra 列显示 'Materialization' 或 'FirstMatch'，表示 MySQL 自动优化了子查询
```

---

## 7.3 基础用法 + 逐行注释

### 7.3.1 创建测试表和数据

```sql
-- 创建用户表
CREATE TABLE users (
    id INT PRIMARY KEY,              -- 主键
    name VARCHAR(50),                -- 用户名
    age INT,                         -- 年龄
    INDEX idx_age(age)               -- 年龄索引
);

-- 创建订单表
CREATE TABLE orders (
    id INT PRIMARY KEY,              -- 主键
    user_id INT,                     -- 用户 ID
    amount DECIMAL(10, 2),           -- 金额
    INDEX idx_user_id(user_id)       -- 用户 ID 索引
);

-- 插入测试数据
INSERT INTO users (id, name, age) VALUES
(1, '张三', 25),
(2, '李四', 30),
(3, '王五', 28);

INSERT INTO orders (id, user_id, amount) VALUES
(1, 1, 100.00),
(2, 1, 200.00),
(3, 2, 150.00);
```

### 7.3.2 查看执行计划

```sql
-- 查看简单查询的执行计划
EXPLAIN SELECT * FROM users WHERE age = 25;
-- 查看优化器选择的执行计划

-- 关键列说明：
-- type：访问类型（ALL、index、range、ref、const）
-- key：实际使用的索引
-- rows：预估扫描行数
-- Extra：额外信息

-- 查看复杂查询的执行计划
EXPLAIN SELECT * FROM users u JOIN orders o ON u.id = o.user_id;
-- 查看 JOIN 查询的执行计划

-- 关键列说明：
-- table：访问的表顺序
-- type：连接类型
-- key：使用的索引
-- rows：预估扫描行数
```

### 7.3.3 验证优化器的选择

```sql
-- 查询 1：使用索引
EXPLAIN SELECT * FROM users WHERE age = 25;
-- type 列显示 'ref'，表示使用了 idx_age 索引
-- key 列显示 'idx_age'

-- 查询 2：全表扫描
EXPLAIN SELECT * FROM users WHERE age > 20;
-- type 列显示 'ALL'，表示全表扫描
-- 因为 age > 20 的数据太多，优化器认为全表扫描更快

-- 强制使用索引
EXPLAIN SELECT * FROM users FORCE INDEX(idx_age) WHERE age > 20;
-- 使用 FORCE INDEX 强制使用 idx_age 索引
-- 但性能可能不如全表扫描
```

### 7.3.4 验证连接算法

```sql
-- 查询：JOIN 查询
EXPLAIN SELECT * FROM users u JOIN orders o ON u.id = o.user_id;
-- 查看执行计划

-- MySQL 8.0 之前：使用 Nested Loop Join
-- MySQL 8.0 及之后：可能使用 Hash Join

-- 查看是否使用 Hash Join
EXPLAIN SELECT * FROM users u JOIN orders o ON u.id = o.user_id;
-- 如果 Extra 列显示 'Using join buffer (hash join)'，表示使用了 Hash Join

-- 关闭 Hash Join（用于对比）
SET optimizer_switch = 'hash_join=off';
-- 关闭 Hash Join，强制使用 Nested Loop Join

EXPLAIN SELECT * FROM users u JOIN orders o ON u.id = o.user_id;
-- 现在会使用 Nested Loop Join

-- 重新开启 Hash Join
SET optimizer_switch = 'hash_join=on';
-- 开启 Hash Join
```

### 7.3.5 优化子查询

```sql
-- 原查询：子查询
EXPLAIN SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);
-- 查看执行计划，看是否自动优化

-- 优化 1：改写为 JOIN
EXPLAIN SELECT DISTINCT u.* FROM users u JOIN orders o ON u.id = o.user_id;
-- 性能通常比子查询好

-- 优化 2：使用 EXISTS
EXPLAIN SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
-- 如果匹配行很多，EXISTS 比 IN 快

-- 优化 3：使用 LEFT JOIN
EXPLAIN SELECT u.* FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.id IS NOT NULL;
-- 也可以达到同样的效果
```

---

## 7.4 对比表格

### 执行计划类型对比

| type 值 | 说明 | 性能 | 场景 |
|---------|------|------|------|
| system | 表只有一行 | 最快 | 系统表 |
| const | 主键或唯一索引等值查询 | 很快 | WHERE id = 1 |
| eq_ref | JOIN 时，内层表用主键或唯一索引 | 快 | JOIN 时内层有唯一索引 |
| ref | 非唯一索引等值查询 | 较快 | WHERE age = 25 |
| range | 索引范围查询 | 中等 | WHERE age > 20 |
| index | 全索引扫描 | 较慢 | 扫描整个索引 |
| ALL | 全表扫描 | 最慢 | 没有索引或索引失效 |

### 连接算法对比

| 算法 | 成本 | 适用场景 | 优点 | 缺点 |
|------|------|---------|------|------|
| Nested Loop | O(M × N) | 小表 JOIN 大表，内层有索引 | 实现简单，内存占用小 | 数据量大时性能差 |
| Hash Join | O(M + N) | 大表 JOIN 大表，无索引 | 性能好，适合大数据 | 需要额外内存 |
| Sort Merge | O(M log M + N log N) | 大表 JOIN，连接键已有序 | 适合有序数据 | 排序成本高 |

### 子查询优化方法对比

| 优化方法 | 原查询 | 优化后 | 性能提升 | 适用场景 |
|---------|--------|--------|---------|---------|
| 改写为 JOIN | WHERE id IN (子查询) | JOIN | 高 | 大多数场景 |
| 使用 EXISTS | WHERE id IN (子查询) | WHERE EXISTS (子查询) | 中 | 匹配行很多时 |
| MySQL 自动优化 | WHERE id IN (子查询) | semi-join | 高 | MySQL 5.6+ |

---

## 7.5 新手常见误区

### 误区 1："优化器总是选最优的索引"

❌ 错误理解：MySQL 优化器总是能选出最优的索引，不需要人工干预。

✅ 正确理解：优化器是基于统计信息做估算的，有时候会选错。比如：
- 统计信息过期：表的统计信息没有更新，优化器基于旧信息做决策
- 数据分布不均：某个索引的选择性估算错误
- 可以使用 FORCE INDEX 强制使用某个索引，但要谨慎使用

### 误区 2："JOIN 总是比子查询快"

❌ 错误理解：子查询总是很慢，应该永远用 JOIN 代替。

✅ 正确理解：虽然 JOIN 通常比子查询快，但不是绝对的。比如：
- 子查询结果很小：子查询只返回几行，性能可能比 JOIN 好
- EXISTS 子查询：找到第一个匹配就停止，性能可能比 JOIN 好
- 应该用 EXPLAIN 分析具体场景，而不是一概而论

### 误区 3："Hash Join 总是最快"

❌ 错误理解：Hash Join 性能最好，应该总是使用 Hash Join。

✅ 正确理解：Hash Join 适合大表 JOIN，但不是所有场景都最快。比如：
- 小表 JOIN：Nested Loop 可能更快，因为不需要建立哈希表
- 内存不足：Hash Join 需要额外内存，内存不足时性能会下降
- 连接键有索引：Nested Loop 利用索引，性能可能比 Hash Join 好

### 误区 4："执行计划中的 rows 是精确值"

❌ 错误理解：EXPLAIN 中的 rows 列显示的是精确的扫描行数。

✅ 正确理解：rows 列显示的是优化器估算的值，不是精确值。比如：
- 基于统计信息估算：统计信息可能不准确
- 估算误差：有时候估算值和实际值差异很大
- 可以使用 ANALYZE TABLE 更新统计信息，提高估算准确性

### 误区 5："优化器不需要调优"

❌ 错误理解：MySQL 优化器很智能，不需要人工调优。

✅ 正确理解：优化器是基于规则和成本做决策的，有时候需要人工干预。比如：
- 强制使用索引：使用 FORCE INDEX 或 USE INDEX
- 调整连接顺序：使用 STRAIGHT_JOIN 强制指定连接顺序
- 调整优化器参数：修改 optimizer_switch 等参数
- 应该先分析执行计划，再决定是否需要调优

---

## 7.6 动手练习

### 练习 1：分析执行计划（基础）

有以下查询，请使用 EXPLAIN 分析执行计划，并解释关键列的含义：

```sql
EXPLAIN SELECT * FROM users WHERE age = 25;
EXPLAIN SELECT * FROM users u JOIN orders o ON u.id = o.user_id;
```

<details>
<summary>点击查看答案</summary>

**查询 1：SELECT * FROM users WHERE age = 25**

关键列说明：
- **type**：显示 'ref'，表示使用了非唯一索引等值查询
- **key**：显示 'idx_age'，表示使用了 age 索引
- **rows**：显示预估扫描行数（如 1）
- **Extra**：可能显示 'Using where'，表示使用了 WHERE 过滤

**查询 2：SELECT * FROM users u JOIN orders o ON u.id = o.user_id**

关键列说明：
- **table**：显示访问的表顺序（先 users，后 orders）
- **type**：显示连接类型（users 是 'ALL' 全表扫描，orders 是 'ref' 索引查询）
- **key**：显示 orders 表使用的索引 'idx_user_id'
- **rows**：显示每个表的预估扫描行数
- **Extra**：可能显示 'Using join buffer'，表示使用了连接缓冲

</details>

### 练习 2：优化子查询（进阶）

有以下子查询，请优化为更高效的写法：

```sql
-- 原查询：子查询
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);
```

<details>
<summary>点击查看答案</summary>

**优化方案 1：改写为 JOIN**

```sql
-- 优化后：改写为 JOIN
SELECT DISTINCT u.* FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE o.amount > 100;
```

**优化方案 2：使用 EXISTS**

```sql
-- 优化后：使用 EXISTS
SELECT * FROM users u 
WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.user_id = u.id AND o.amount > 100
);
```

**优化原理**：
- 原查询：子查询可能会被执行多次（每个 users 行执行一次）
- 优化后：JOIN 或 EXISTS 只需要扫描两个表一次
- 性能提升：从 O(M × N) 降低到 O(M + N)

</details>

### 练习 3：强制使用索引（挑战）

有以下查询，优化器选择了全表扫描，但你认为使用索引更快，请强制使用索引并验证：

```sql
-- 原查询：优化器选择全表扫描
SELECT * FROM users WHERE age > 20;
-- 因为 age > 20 的数据太多，优化器认为全表扫描更快

-- 请强制使用 idx_age 索引，并验证性能
```

<details>
<summary>点击查看答案</summary>

**强制使用索引**

```sql
-- 使用 FORCE INDEX 强制使用 idx_age 索引
SELECT * FROM users FORCE INDEX(idx_age) WHERE age > 20;

-- 使用 EXPLAIN 验证
EXPLAIN SELECT * FROM users FORCE INDEX(idx_age) WHERE age > 20;
-- type 列应该显示 'range'，key 列显示 'idx_age'
```

**注意事项**：
- FORCE INDEX 会强制使用指定索引，但性能不一定更好
- 如果 age > 20 的数据占大多数，全表扫描可能更快
- 应该用 EXPLAIN 对比两种方式的成本，再决定是否强制使用索引

</details>

---

## 下一章预告

下一章我们会学习 **事务与 MVCC 原理**。你会了解 ACID 特性的实现原理、MVCC 多版本并发控制机制、undo log 的作用，以及版本链的工作原理。这些是保证数据一致性和并发控制的核心技术。
