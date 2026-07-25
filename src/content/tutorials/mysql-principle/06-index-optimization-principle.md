---
title: "第6章：索引优化原理"
description: "深入理解索引失效场景、覆盖索引、索引下推、最左前缀原则"
---

# 第6章：索引优化原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 明明创建了索引，为什么查询还是很慢？索引什么时候会失效？
- 什么是最左前缀原则？为什么联合索引 (a, b, c) 不能直接用 b 查询？
- 覆盖索引是什么？为什么说它能优化查询性能？
- 索引下推是什么？它是怎么减少回表次数的？

这一章我们会彻底搞懂 **索引优化的底层原理**，从底层机制理解索引失效的原因和优化技巧。搞懂了这些，你就能写出真正高效的查询，避免常见的性能陷阱。

---

## 6.1 为什么需要索引优化？

### 痛点分析

很多开发者创建了索引，但查询还是很慢，常见的问题包括：

1. **索引失效**：创建了索引，但 MySQL 选择不用，还是全表扫描
2. **回表过多**：查询需要大量回表，性能反而不如全表扫描
3. **最左前缀用错**：联合索引创建了，但查询条件不符合最左前缀，索引用不上
4. **不知道如何优化**：看到慢查询，不知道从哪里入手优化

### 生活化类比

把索引优化想象成**图书馆找书**：

- **索引失效**：就像目录页被撕掉了，只能一本本翻
- **最左前缀**：就像字典的目录，必须先查第一个字，再查第二个字，不能跳着查
- **覆盖索引**：就像目录里就有完整信息，不用翻到正文
- **索引下推**：就像在目录里就过滤掉不需要的书，减少翻正文的次数

---

## 6.2 核心原理讲解

### 6.2.1 索引失效的常见场景

索引虽然能加快查询，但在某些情况下会失效，MySQL 会选择全表扫描。

#### 场景 1：对索引列使用函数或运算

```sql
-- 错误写法：索引失效
SELECT * FROM users WHERE YEAR(create_time) = 2024;
-- 对 create_time 使用了 YEAR() 函数，MySQL 无法使用索引

-- 正确写法：索引生效
SELECT * FROM users WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01';
-- 改成范围查询，索引可以正常工作
```

**原理**：索引是建立在列的原始值上的，如果对列使用函数，MySQL 需要先计算函数值再比较，无法直接利用索引。

#### 场景 2：隐式类型转换

```sql
-- 错误写法：索引失效
SELECT * FROM users WHERE phone = 13800138000;
-- phone 列是 VARCHAR 类型，但查询时用了数字，MySQL 会隐式转换，导致索引失效

-- 正确写法：索引生效
SELECT * FROM users WHERE phone = '13800138000';
-- 使用字符串类型，类型匹配，索引正常工作
```

**原理**：类型不匹配时，MySQL 会尝试隐式转换，转换后的值无法直接使用索引。

#### 场景 3：LIKE 以通配符开头

```sql
-- 错误写法：索引失效
SELECT * FROM users WHERE name LIKE '%张';
-- 以 % 开头，无法利用索引（不知道从哪里开始找）

-- 正确写法：索引生效
SELECT * FROM users WHERE name LIKE '张%';
-- 以具体字符开头，索引可以工作（知道从"张"开始找）
```

**原理**：B+ 树索引是按顺序组织的，`%张` 表示任意字符结尾，无法确定起点；`张%` 表示以"张"开头，可以从"张"开始顺序查找。

#### 场景 4：使用 OR 条件

```sql
-- 错误写法：索引可能失效
SELECT * FROM users WHERE age = 25 OR status = 1;
-- 如果 age 和 status 没有联合索引，OR 会导致全表扫描

-- 正确写法：使用 UNION 代替 OR
SELECT * FROM users WHERE age = 25
UNION
SELECT * FROM users WHERE status = 1;
-- UNION 会分别查询再合并结果，索引可以正常工作
```

**原理**：OR 条件需要同时满足两个索引，MySQL 可能认为全表扫描更快。UNION 分别查询，每个查询都能用索引。

#### 场景 5：NOT IN、NOT EXISTS、!=

```sql
-- 错误写法：索引可能失效
SELECT * FROM users WHERE age NOT IN (20, 25, 30);
SELECT * FROM users WHERE age != 25;
-- 否定条件通常会导致全表扫描

-- 正确写法：尽量用肯定条件
SELECT * FROM users WHERE age IN (21, 22, 23, 24, 26, 27, 28, 29);
-- 改成肯定条件，索引可以工作
```

**原理**：否定条件的选择性通常很低（大部分数据都满足），MySQL 认为全表扫描更快。

### 6.2.2 最左前缀原则

**定义**：联合索引必须从最左列开始使用，不能跳过中间的列。

**生活化类比**：

联合索引就像**电话号码的搜索**：
- 索引 (a, b, c) 就像先查区号（a），再查局号（b），最后查号码（c）
- 你不能跳过区号直接查局号，因为不同区号可能有相同的局号

**示例**：

```sql
-- 假设有联合索引 idx_abc(a, b, c)

-- 索引生效
SELECT * FROM users WHERE a = 1;                    -- 使用 a
SELECT * FROM users WHERE a = 1 AND b = 2;          -- 使用 a, b
SELECT * FROM users WHERE a = 1 AND b = 2 AND c = 3; -- 使用 a, b, c

-- 索引部分生效或失效
SELECT * FROM users WHERE b = 2;                    -- 没有 a，索引失效
SELECT * FROM users WHERE b = 2 AND c = 3;          -- 没有 a，索引失效
SELECT * FROM users WHERE a = 1 AND c = 3;          -- 只有 a 生效，c 无法使用
```

| 查询条件 | 索引使用情况 | 说明 |
|----------|--------------|------|
| WHERE a = 1 | 使用 a | 符合最左前缀 |
| WHERE a = 1 AND b = 2 | 使用 a, b | 符合最左前缀 |
| WHERE a = 1 AND b = 2 AND c = 3 | 使用 a, b, c | 符合最左前缀 |
| WHERE b = 2 | 不使用索引 | 缺少最左列 a |
| WHERE c = 3 | 不使用索引 | 缺少最左列 a、b |
| WHERE a = 1 AND c = 3 | 只使用 a | 跳过了 b，c 无法使用 |

**原理**：联合索引的 B+ 树是先按 a 排序，a 相同再按 b 排序，b 相同再按 c 排序。如果没有 a，就无法确定 b 的起点；如果跳过了 b，c 就无法连续查找。

### 6.2.3 覆盖索引

**定义**：查询的列全部包含在索引中，不需要回表。

**生活化类比**：

覆盖索引就像**字典的目录里就有完整信息**：
- 普通查询：先在目录查到页码，再翻到正文看完整解释（需要回表）
- 覆盖索引：目录里就有完整解释，不用翻正文（不需要回表）

**示例**：

```sql
-- 假设有联合索引 idx_age_status(age, status)

-- 覆盖索引：不需要回表
SELECT age, status FROM users WHERE age = 25;
-- 查询的 age 和 status 都在索引里，直接从索引返回数据

-- 非覆盖索引：需要回表
SELECT * FROM users WHERE age = 25;
-- 查询所有列，索引里只有 age 和 status，还要回表找其他列
```

**性能对比**：

| 查询类型 | 是否需要回表 | IO 次数 | 性能 |
|---------|------------|---------|------|
| 覆盖索引 | 不需要 | 1 次 | 快 |
| 非覆盖索引 | 需要 | 2 次 | 慢 |

**优化技巧**：

```sql
-- 错误写法：需要回表
SELECT name, email, age FROM users WHERE name = '张三';

-- 正确写法：创建覆盖索引
CREATE INDEX idx_name_email_age ON users(name, email, age);
-- 现在查询的列都在索引中，不需要回表
```

### 6.2.4 索引下推（Index Condition Pushdown）

**定义**：在索引遍历过程中，先过滤掉不满足条件的记录，减少回表次数。

**生活化类比**：

索引下推就像**在目录里就过滤掉不需要的书**：
- 没有索引下推：先在目录查到所有符合条件的页码，再一本本翻正文看是否满足其他条件
- 有索引下推：在目录里就判断是否满足其他条件，只翻正文那些真正需要的书

**示例**：

```sql
-- 假设有联合索引 idx_name_age(name, age)

-- 查询：SELECT * FROM users WHERE name LIKE '张%' AND age = 25;

-- 没有索引下推（MySQL 5.6 之前）：
-- 1. 在索引中找到所有 name 以"张"开头的记录，得到一批 (name, age, id)
-- 2. 用这些 id 去聚簇索引中查找完整行数据（回表）
-- 3. 再过滤 age = 25 的记录
-- 回表次数多，性能差

-- 有索引下推（MySQL 5.6 及之后）：
-- 1. 在索引中找到所有 name 以"张"开头的记录
-- 2. 在索引中直接判断 age = 25，过滤掉不满足的记录
-- 3. 只对满足条件的记录回表查完整数据
-- 回表次数少，性能好
```

**查看是否使用索引下推**：

```sql
EXPLAIN SELECT * FROM users WHERE name LIKE '张%' AND age = 25;
-- Extra 列显示 'Using index condition'，表示使用了索引下推
```

**原理**：索引下推是 MySQL 5.6 引入的优化技术，它把原本需要在回表后过滤的条件，提前到索引遍历过程中进行，从而减少回表次数。

---

## 6.3 基础用法 + 逐行注释

### 6.3.1 创建表和索引

```sql
-- 创建用户表
CREATE TABLE users (
    id INT PRIMARY KEY,              -- 主键，自动创建聚簇索引
    name VARCHAR(50) NOT NULL,       -- 用户名
    email VARCHAR(100),              -- 邮箱
    age INT,                         -- 年龄
    status TINYINT,                  -- 状态
    created_at DATETIME              -- 创建时间
);

-- 创建联合索引
CREATE INDEX idx_name_age ON users(name, age);
-- 创建包含 name 和 age 的联合索引，支持最左前缀原则

-- 创建覆盖索引
CREATE INDEX idx_age_status ON users(age, status);
-- 创建包含 age 和 status 的联合索引，用于覆盖索引优化

-- 插入测试数据
INSERT INTO users (id, name, email, age, status, created_at) VALUES
(1, '张三', 'zhangsan@example.com', 25, 1, NOW()),
(2, '张四', 'zhangsi@example.com', 28, 1, NOW()),
(3, '李四', 'lisi@example.com', 30, 0, NOW()),
(4, '王五', 'wangwu@example.com', 25, 1, NOW());
```

### 6.3.2 验证索引失效场景

```sql
-- 场景 1：对索引列使用函数
-- 错误写法：索引失效
SELECT * FROM users WHERE YEAR(created_at) = 2024;
-- 对 created_at 使用函数，索引失效

-- 正确写法：索引生效
SELECT * FROM users WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
-- 改成范围查询，索引正常工作

-- 场景 2：隐式类型转换
-- 假设 email 是 VARCHAR 类型
-- 错误写法：索引失效
SELECT * FROM users WHERE email = 12345;
-- email 是字符串，但查询用了数字，隐式转换导致索引失效

-- 正确写法：索引生效
SELECT * FROM users WHERE email = '12345';
-- 使用字符串类型，类型匹配

-- 场景 3：LIKE 以通配符开头
-- 错误写法：索引失效
SELECT * FROM users WHERE name LIKE '%张';
-- 以 % 开头，无法利用索引

-- 正确写法：索引生效
SELECT * FROM users WHERE name LIKE '张%';
-- 以具体字符开头，索引可以工作

-- 使用 EXPLAIN 验证
EXPLAIN SELECT * FROM users WHERE YEAR(created_at) = 2024;
-- type 列显示 'ALL'，表示全表扫描，索引失效

EXPLAIN SELECT * FROM users WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
-- type 列显示 'range'，表示范围查询，索引生效
```

### 6.3.3 验证最左前缀原则

```sql
-- 假设有联合索引 idx_name_age(name, age)

-- 索引生效
SELECT * FROM users WHERE name = '张三';
-- 使用了最左列 name，索引生效

SELECT * FROM users WHERE name = '张三' AND age = 25;
-- 使用了 name 和 age，索引生效

-- 索引失效
SELECT * FROM users WHERE age = 25;
-- 跳过了 name，直接使用 age，索引失效

SELECT * FROM users WHERE age = 25 AND name = '张三';
-- 虽然条件都有，但 MySQL 会自动调整顺序，等价于上一题，索引失效

-- 使用 EXPLAIN 验证
EXPLAIN SELECT * FROM users WHERE name = '张三';
-- type 列显示 'ref'，表示使用了索引

EXPLAIN SELECT * FROM users WHERE age = 25;
-- type 列显示 'ALL'，表示全表扫描，索引失效

EXPLAIN SELECT * FROM users WHERE name = '张三' AND age = 25;
-- type 列显示 'ref'，表示使用了索引
```

### 6.3.4 验证覆盖索引

```sql
-- 假设有联合索引 idx_age_status(age, status)

-- 覆盖索引：不需要回表
SELECT age, status FROM users WHERE age = 25;
-- 查询的 age 和 status 都在索引中，不需要回表

-- 非覆盖索引：需要回表
SELECT * FROM users WHERE age = 25;
-- 查询所有列，索引里只有 age 和 status，需要回表

-- 使用 EXPLAIN 验证
EXPLAIN SELECT age, status FROM users WHERE age = 25;
-- Extra 列显示 'Using index'，表示使用覆盖索引

EXPLAIN SELECT * FROM users WHERE age = 25;
-- Extra 列没有 'Using index'，表示需要回表
```

### 6.3.5 验证索引下推

```sql
-- 假设有联合索引 idx_name_age(name, age)

-- 查询：SELECT * FROM users WHERE name LIKE '张%' AND age = 25;

-- 使用 EXPLAIN 查看
EXPLAIN SELECT * FROM users WHERE name LIKE '张%' AND age = 25;
-- Extra 列显示 'Using index condition'，表示使用了索引下推

-- 关闭索引下推（用于对比）
SET optimizer_switch = 'index_condition_pushdown=off';
-- 关闭索引下推功能

EXPLAIN SELECT * FROM users WHERE name LIKE '张%' AND age = 25;
-- Extra 列不再显示 'Using index condition'

-- 重新开启索引下推
SET optimizer_switch = 'index_condition_pushdown=on';
-- 开启索引下推功能
```

---

## 6.4 对比表格

### 索引失效场景对比

| 失效场景 | 示例 | 原因 | 优化方法 |
|---------|------|------|---------|
| 对索引列使用函数 | WHERE YEAR(date) = 2024 | 函数值无法使用索引 | 改成范围查询 |
| 隐式类型转换 | WHERE varchar_col = 123 | 类型不匹配 | 使用正确的类型 |
| LIKE 以通配符开头 | WHERE name LIKE '%张' | 无法确定起点 | 改用 '张%' |
| 使用 OR 条件 | WHERE a = 1 OR b = 2 | 需要同时用两个索引 | 改用 UNION |
| NOT IN、!= | WHERE age != 25 | 选择性低 | 改用肯定条件 |
| 索引列参与运算 | WHERE age + 1 = 26 | 运算后无法使用索引 | 改成 age = 25 |

### 最左前缀原则对比

| 查询条件 | 索引 (a, b, c) 使用情况 | 说明 |
|----------|------------------------|------|
| WHERE a = 1 | 使用 a | 符合最左前缀 |
| WHERE a = 1 AND b = 2 | 使用 a, b | 符合最左前缀 |
| WHERE a = 1 AND b = 2 AND c = 3 | 使用 a, b, c | 符合最左前缀 |
| WHERE b = 2 | 不使用索引 | 缺少最左列 a |
| WHERE c = 3 | 不使用索引 | 缺少最左列 a、b |
| WHERE a = 1 AND c = 3 | 只使用 a | 跳过了 b，c 无法使用 |
| WHERE a = 1 AND b > 2 AND c = 3 | 使用 a, b | b 是范围查询，c 无法使用 |

### 覆盖索引 vs 非覆盖索引

| 对比项 | 覆盖索引 | 非覆盖索引 |
|--------|----------|------------|
| 定义 | 查询列都在索引中 | 查询列不在索引中 |
| 是否需要回表 | 不需要 | 需要 |
| IO 次数 | 少（1 次） | 多（2 次） |
| 查询速度 | 快 | 慢 |
| EXPLAIN 特征 | Extra 显示 'Using index' | Extra 不显示 'Using index' |
| 适用场景 | 查询列少且都在索引中 | 查询列多或包含非索引列 |

### 索引下推前后对比

| 对比项 | 没有索引下推 | 有索引下推 |
|--------|--------------|------------|
| MySQL 版本 | 5.6 之前 | 5.6 及之后 |
| 过滤时机 | 回表后过滤 | 索引遍历中过滤 |
| 回表次数 | 多 | 少 |
| 查询速度 | 慢 | 快 |
| EXPLAIN 特征 | 无 'Using index condition' | 显示 'Using index condition' |

---

## 6.5 新手常见误区

### 误区 1："联合索引顺序无所谓"

❌ 错误理解：联合索引 (a, b) 和 (b, a) 是一样的，查询都能用。

✅ 正确理解：联合索引的顺序非常重要，它决定了最左前缀的起点。比如：
- 索引 (name, age)：可以用 name 查询，也可以用 name + age 查询
- 索引 (age, name)：可以用 age 查询，也可以用 age + name 查询
- 如果经常用 name 查询，应该把 name 放在前面

### 误区 2："索引失效就是索引没用"

❌ 错误理解：索引失效说明这个索引没有用，应该删除。

✅ 正确理解：索引失效是指在某些查询条件下，MySQL 选择不用索引而用全表扫描。这可能是因为：
- 查询条件导致索引无法使用（如对索引列使用函数）
- 优化器认为全表扫描更快（如表数据量小）
- 索引选择性低（如性别列只有男/女）
应该通过 EXPLAIN 分析查询，优化查询条件，而不是删除索引。

### 误区 3："覆盖索引可以优化所有查询"

❌ 错误理解：只要创建覆盖索引，所有查询都会变快。

✅ 正确理解：覆盖索引只适用于查询列少且都在索引中的场景。如果查询 SELECT * 或查询很多列，覆盖索引就不适用了。应该根据实际查询需求，合理设计索引。

### 误区 4："最左前缀原则意味着不能跳过列"

❌ 错误理解：联合索引 (a, b, c)，查询 WHERE a = 1 AND c = 3 时，c 完全不能用。

✅ 正确理解：最左前缀原则确实要求从最左列开始，但不能跳过中间的列。不过，MySQL 5.6 之后引入了索引下推，可以在索引遍历过程中过滤不满足条件的记录，从而部分利用跳过的列。但总体来说，还是应该尽量符合最左前缀。

### 误区 5："索引越多越好"

❌ 错误理解：给每个列都建索引，查询肯定最快。

✅ 正确理解：索引虽然加快查询，但会带来问题：
- 占用磁盘空间：每个索引都要额外的存储空间
- 拖慢写入：每次 INSERT/UPDATE/DELETE 都要更新所有索引
- 维护成本：索引越多，维护开销越大
应该根据实际查询需求，合理创建索引。一般一张表不超过 5-6 个索引。

---

## 6.6 动手练习

### 练习 1：判断索引是否生效（基础）

假设有联合索引 idx_name_age_status(name, age, status)，判断以下查询是否使用了索引：

1. `SELECT * FROM users WHERE name = '张三';`
2. `SELECT * FROM users WHERE age = 25;`
3. `SELECT * FROM users WHERE name = '张三' AND age = 25;`
4. `SELECT * FROM users WHERE name = '张三' AND status = 1;`
5. `SELECT * FROM users WHERE age = 25 AND status = 1;`

<details>
<summary>点击查看答案</summary>

1. **索引生效** - 使用了最左列 name
2. **索引失效** - 跳过了 name，直接使用 age
3. **索引生效** - 使用了 name 和 age
4. **索引部分生效** - 只使用了 name，status 无法使用（跳过了 age）
5. **索引失效** - 没有最左列 name，age 和 status 都无法使用

</details>

### 练习 2：优化查询避免索引失效（进阶）

以下查询索引失效了，请改写成索引生效的版本：

```sql
-- 原查询，索引失效
SELECT * FROM users WHERE YEAR(birthday) = 2000;
SELECT * FROM users WHERE phone = 13800138000;  -- phone 是 VARCHAR 类型
SELECT * FROM users WHERE name LIKE '%张';
```

<details>
<summary>点击查看答案</summary>

```sql
-- 优化后的查询，索引生效

-- 1. 把函数运算改成范围查询
SELECT * FROM users 
WHERE birthday >= '2000-01-01' 
AND birthday < '2001-01-01';

-- 2. 使用正确的类型
SELECT * FROM users WHERE phone = '13800138000';

-- 3. 改成以具体字符开头
SELECT * FROM users WHERE name LIKE '张%';
```

</details>

### 练习 3：设计覆盖索引（挑战）

有以下查询，执行时发现性能较差（需要回表）：

```sql
SELECT name, email, age, status FROM users WHERE name = '张三' AND age > 25;
```

已知有索引 idx_name_age(name, age)，请优化查询或创建合适的索引，避免回表。

<details>
<summary>点击查看答案</summary>

**方案 1：创建覆盖索引**

```sql
-- 创建联合索引，包含查询需要的所有列
CREATE INDEX idx_name_age_email_status ON users(name, age, email, status);

-- 优化后的查询
SELECT name, email, age, status FROM users WHERE name = '张三' AND age > 25;
-- 现在查询的 name、email、age、status 都在索引中，不需要回表
```

**方案 2：调整索引列顺序**

```sql
-- 如果经常按 name 和 age 查询，可以创建包含所有查询列的索引
CREATE INDEX idx_name_age_cover ON users(name, age, email, status);

-- 查询时，MySQL 会使用覆盖索引优化
EXPLAIN SELECT name, email, age, status FROM users WHERE name = '张三' AND age > 25;
-- Extra 列会显示 'Using index'，表示使用覆盖索引
```

**原理**：覆盖索引是指查询的列全部包含在索引中，不需要回表查聚簇索引。这样可以减少一次 IO，提升查询性能。设计覆盖索引时，要把查询条件中的列和查询结果中的列都包含进去。

</details>

---

## 下一章预告

下一章我们会学习 **查询优化器原理**。你会了解 MySQL 是如何选择最优执行计划的、基于成本的优化策略、连接算法的选择，以及子查询的优化技巧。这些知识能帮你理解 MySQL 的"智能"决策过程。
