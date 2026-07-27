---
title: "第9章：索引原理与优化"
description: "B+ 树索引、哈希索引、索引设计原则"
---

# 第9章：索引原理与优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是索引？为什么加了索引查询就变快了？
- 索引是不是越多越好？为什么有时候加了索引反而变慢？
- B+ 树是什么东西？和普通的树有什么区别？

这一章就是为了解答这些问题。我们会从生活中的例子出发，搞懂索引的原理，再学会如何正确创建和使用索引。

---

## 1 为什么需要索引？

### 没有索引的痛苦

假设你有一本 1000 页的字典，要找"mysql"这个单词。

如果没有目录，你只能从第 1 页开始，一页一页翻，直到找到为止。平均要翻 500 页才能找到目标。

这就是数据库里没有索引的情况——**全表扫描**。当表里有 100 万条数据时，每次查询都要遍历 100 万行，速度慢得让人抓狂。

### 索引的解决方式：像字典目录一样

字典是怎么解决这个问题的？它有目录！

你只需要翻到目录，找到"m"开头的部分，再定位到"mysql"对应的页码，直接翻到那一页就行了。

数据库的索引就是这个目录。它帮你快速定位到数据所在的位置，不用遍历整张表。

| 对比项 | 没有索引 | 有索引 |
|--------|----------|--------|
| 查询方式 | 从头到尾逐行扫描 | 先查索引，再定位数据 |
| 查询速度 | 慢，数据量大时几乎不可用 | 快，百万数据也能毫秒级响应 |
| 适用场景 | 数据量极小、不常查询的表 | 几乎所有需要查询的表 |
| 代价 | 无额外开销 | 占用存储空间，写入时需要维护索引 |

> 一句话总结：索引是用空间换时间的技术，让查询变快，但会稍微拖慢写入速度。

---

## 2 索引的核心原理

### B+ 树索引：最常用的索引结构

MySQL 默认使用 B+ 树（B+ Tree）作为索引结构。

打个比方：想象你在一个图书馆找书。

- B 树：每个书架的每层都放着书，你要一层一层找
- B+ 树：每层书架只放"指引牌"，告诉你去哪一层找，真正的书都在最底层

B+ 树的特点：
- 所有数据都在叶子节点（最底层）
- 叶子节点之间用链表连接，方便范围查询
- 树是平衡的，每次查询走的层数一样

```
        [10, 20, 30]              <- 非叶子节点：指引方向
       /      |       \
  [5,8]   [12,15]   [25,28]      <- 叶子节点：存实际数据
    |       |         |
  [5,8] - [12,15] - [25,28]      <- 叶子节点用链表连接
```

### 聚簇索引 vs 非聚簇索引

这是两个容易混淆的概念：

**聚簇索引（Clustered Index）**
- 叶子节点直接存整行数据
- 一张表只能有一个聚簇索引（通常就是主键）
- 类比：字典的正文，每个字对应完整的解释

**非聚簇索引（Secondary Index）**
- 叶子节点存的是主键值，不是整行数据
- 一张表可以有多个非聚簇索引
- 类比：字典的目录，每个字对应页码，还要翻到正文才能看到完整解释

| 对比项 | 聚簇索引 | 非聚簇索引 |
|--------|----------|------------|
| 数量限制 | 一张表只能有一个 | 一张表可以有多个 |
| 存储内容 | 叶子节点存整行数据 | 叶子节点存主键值 |
| 查询速度 | 快，直接拿到数据 | 稍慢，需要"回表"查完整数据 |
| 通常是 | 主键索引 | 普通列的索引 |

> 回表：先通过非聚簇索引找到主键，再通过主键去聚簇索引里找完整数据。这个过程叫回表。

---

## 3 索引的创建与管理

### 创建索引的基本语法

```sql
-- 创建普通索引
CREATE INDEX idx_name ON users(name);
-- 在 users 表的 name 列上创建一个名为 idx_name 的索引

-- 创建唯一索引
CREATE UNIQUE INDEX idx_email ON users(email);
-- 在 users 表的 email 列上创建一个唯一索引，保证 email 不重复

-- 创建联合索引（多列组合）
CREATE INDEX idx_age_status ON users(age, status);
-- 在 age 和 status 两列上创建联合索引

-- 删除索引
DROP INDEX idx_name ON users;
-- 删除 users 表上的 idx_name 索引

-- 查看表上的所有索引
SHOW INDEX FROM users;
-- 显示 users 表的所有索引信息
```

### 在创建表时定义索引

```sql
CREATE TABLE users (
    id INT PRIMARY KEY,              -- 主键，自动创建聚簇索引
    name VARCHAR(50),                -- 普通列
    email VARCHAR(100),              -- 邮箱列
    age INT,                         -- 年龄列
    status TINYINT,                  -- 状态列
    
    UNIQUE INDEX idx_email(email),   -- 唯一索引，email 不能重复
    INDEX idx_age_status(age, status) -- 联合索引，包含 age 和 status
);
```

---

## 4 索引失效的场景

即使你创建了索引，以下情况会导致索引失效，查询还是会全表扫描：

### 1. 对索引列使用函数或运算

```sql
-- 错误写法：索引失效
SELECT * FROM users WHERE YEAR(create_time) = 2024;
-- 对 create_time 使用了 YEAR() 函数，索引失效

-- 正确写法：索引生效
SELECT * FROM users WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01';
-- 改成范围查询，索引正常工作
```

### 2. 隐式类型转换

```sql
-- 错误写法：索引失效
SELECT * FROM users WHERE phone = 13800138000;
-- phone 列是 VARCHAR 类型，但查询时用了数字，MySQL 会隐式转换，导致索引失效

-- 正确写法：索引生效
SELECT * FROM users WHERE phone = '13800138000';
-- 使用字符串类型，类型匹配，索引正常工作
```

### 3. LIKE 以通配符开头

```sql
-- 错误写法：索引失效
SELECT * FROM users WHERE name LIKE '%张';
-- 以 % 开头，无法利用索引

-- 正确写法：索引生效
SELECT * FROM users WHERE name LIKE '张%';
-- 以具体字符开头，索引可以工作
```

### 4. 使用 OR 条件

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

---

## 5 覆盖索引与联合索引

### 覆盖索引

覆盖索引是指查询的列全部包含在索引中，不需要回表。

```sql
-- 假设有联合索引 idx_age_status(age, status)

-- 覆盖索引：不需要回表
SELECT age, status FROM users WHERE age = 25;
-- 查询的 age 和 status 都在索引里，直接从索引返回数据

-- 非覆盖索引：需要回表
SELECT * FROM users WHERE age = 25;
-- 查询所有列，索引里只有 age 和 status，还要回表找其他列
```

### 联合索引的最左前缀原则

联合索引 (a, b, c) 会按照从左到右的顺序匹配：

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

| 查询条件 | 索引使用情况 |
|----------|--------------|
| WHERE a = 1 | 使用 a |
| WHERE a = 1 AND b = 2 | 使用 a, b |
| WHERE a = 1 AND b = 2 AND c = 3 | 使用 a, b, c |
| WHERE b = 2 | 不使用索引 |
| WHERE c = 3 | 不使用索引 |
| WHERE a = 1 AND c = 3 | 只使用 a |

> 最左前缀原则：联合索引必须从最左列开始，不能跳过中间的列。

---

## 6 索引设计原则

### 什么时候该建索引？

1. 经常出现在 WHERE 条件中的列
2. 经常用于排序（ORDER BY）或分组（GROUP BY）的列
3. 经常用于连接（JOIN）的列
4. 数据量大的表（小表建索引意义不大）

### 什么时候不该建索引？

1. 表数据量很小（几百行）
2. 经常更新的列（每次更新都要维护索引）
3. 区分度很低的列（比如性别，只有男/女，建索引效果差）
4. 很少被查询的列

### 索引设计的黄金法则

| 原则 | 说明 |
|------|------|
| 选择性高的列优先 | 区分度越高，索引效果越好（比如身份证号 > 性别） |
| 联合索引优于多个单列索引 | 一个联合索引可以替代多个单列索引 |
| 控制索引数量 | 一张表不要超过 5-6 个索引 |
| 避免冗余索引 | (a, b) 已经包含了 a，不需要再单独建 a 的索引 |
| 小表不需要索引 | 数据量小于 1 万的表，全表扫描可能比索引更快 |

---

## 7 新手常见误区

### 误区 1："索引越多越好"

错！索引虽然加快查询，但会拖慢写入。每次 INSERT、UPDATE、DELETE 都要更新所有索引。索引还占用磁盘空间。应该根据实际查询需求，合理创建索引。

### 误区 2："主键不需要索引"

错！主键自动创建聚簇索引，这是 MySQL 的核心索引。没有主键的表，MySQL 会找一个唯一非空索引，或者隐藏一个 rowid 作为聚簇索引。所以一定要定义主键。

### 误区 3："索引失效就是索引没用"

不是的。索引失效是指在某些查询条件下，MySQL 选择不用索引而用全表扫描。这可能是因为优化器认为全表扫描更快，或者查询条件导致索引无法使用。可以通过 EXPLAIN 查看查询是否使用了索引。

### 误区 4："联合索引顺序无所谓"

错！联合索引的顺序非常重要。应该把区分度高的列放在前面，或者根据查询频率调整。比如 (status, age) 和 (age, status) 的效果完全不同。

### 误区 5："加了索引就一定快"

不是的。如果查询的表数据量很小，或者查询条件导致索引失效，加了索引也不会变快。有时候优化器甚至会放弃索引，选择全表扫描。

---

## 8 动手练习

### 练习 1：创建索引

有一个订单表 orders，包含以下字段：
- order_id (INT, 主键)
- user_id (INT)
- order_date (DATE)
- status (TINYINT)

请为 user_id 创建一个普通索引，为 order_date 和 status 创建一个联合索引。

<details>
<summary>点击查看答案</summary>

```sql
-- 为 user_id 创建普通索引
CREATE INDEX idx_user_id ON orders(user_id);

-- 为 order_date 和 status 创建联合索引
CREATE INDEX idx_date_status ON orders(order_date, status);
```

</details>

### 练习 2：判断索引是否生效

假设有联合索引 idx_name_age(name, age)，判断以下查询是否使用了索引：

1. SELECT * FROM users WHERE name = '张三';
2. SELECT * FROM users WHERE age = 25;
3. SELECT * FROM users WHERE name = '张三' AND age = 25;
4. SELECT * FROM users WHERE age = 25 AND name = '张三';

<details>
<summary>点击查看答案</summary>

1. 索引生效 - 使用了最左列 name
2. 索引失效 - 跳过了 name，直接使用 age
3. 索引生效 - 使用了 name 和 age
4. 索引生效 - MySQL 会自动调整顺序，等价于第 3 题

</details>

### 练习 3（挑战）：优化查询

以下查询索引失效了，请改写成索引生效的版本：

```sql
-- 原查询，索引失效
SELECT * FROM users WHERE YEAR(birthday) = 2000;
```

<details>
<summary>点击查看答案</summary>

```sql
-- 优化后的查询，索引生效
SELECT * FROM users 
WHERE birthday >= '2000-01-01' 
AND birthday < '2001-01-01';
```

把对列的函数运算改成范围查询，索引就可以正常工作了。

</details>

---

## 下一章预告

下一章我们会学习 **事务与 ACID**。你会了解什么是事务，为什么银行转账必须用事务，以及事务的四种隔离级别和锁机制。这些是保证数据一致性的核心技术。
