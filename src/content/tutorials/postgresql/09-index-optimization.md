---
title: "第09章：索引原理与优化"
description: "B-tree 索引、哈希索引、GiST、GIN 索引"
---

# 第09章：索引原理与优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是索引？为什么需要索引？
- B-tree 索引是什么？如何使用？
- 有哪些类型的索引？分别适用于什么场景？
- 如何创建和管理索引？
- 索引过多会有什么问题？

这一章就是为了解答这些问题。我们会先搞清楚 **索引的基本原理**，再学习**各种索引类型**，最后掌握**索引的优化技巧**。

---

## 1 为什么需要索引？

### 痛点分析

想象一下，你有一本 1000 页的书，想找到"PostgreSQL 索引"这个关键词。如果没有目录：

```
❌ 低效的方式：逐页翻阅，找到关键词
```

问题：
- ❌ 需要翻阅很多页
- ❌ 查找速度慢
- ❌ 效率低

### 解决方案

使用索引：

```sql
-- ✅ 高效的方式：通过索引快速定位
CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE email = 'test@example.com';
```

优势：
- ✅ 快速定位数据
- ✅ 查询速度快
- ✅ 效率高

> **一句话总结**：索引就像是书的目录，可以快速定位数据，提高查询效率。

---

## 2 核心原理

### 概念解释

**索引（Index）**

索引是一种数据结构，用于加速数据库查询。

打个比方：

> 索引就像是**书的目录**：
> - 没有目录：逐页翻阅
> - 有目录：直接翻到对应页码

**B-tree 索引原理**

B-tree（平衡树）是一种树形数据结构：

```
        [50]
       /    \
    [20]    [80]
   /   \    /   \
 [10] [30] [60] [90]
```

- 每个节点包含多个键值
- 树的高度通常不超过 4 层
- 查找时间复杂度：O(log n)

**索引类型对比**

| 索引类型 | 适用场景 | 支持的操作 |
| --- | --- | --- |
| B-tree | 范围查询、排序、等值查询 | =, <, >, <=, >=, BETWEEN, LIKE |
| Hash | 等值查询 | = |
| GiST | 几何类型、全文搜索 | 自定义操作符 |
| GIN | 数组、JSONB、全文搜索 | @>, <@, && |
| BRIN | 大数据块扫描 | 范围查询 |

---

## 3 基础用法

### 准备工作

创建示例表：

```sql
-- 创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    age INTEGER,
    city VARCHAR(50),
    tags TEXT[],  -- 数组类型
    profile JSONB  -- JSONB 类型
);

-- 插入示例数据
INSERT INTO users (username, email, age, city, tags, profile) VALUES
    ('张三', 'zhangsan@example.com', 25, '北京', ARRAY['技术', '编程'], '{"interests": ["读书", "运动"]}'),
    ('李四', 'lisi@example.com', 28, '上海', ARRAY['设计', 'UI'], '{"interests": ["绘画", "音乐"]}'),
    ('王五', 'wangwu@example.com', 30, '广州', ARRAY['技术', '管理'], '{"interests": ["旅行", "摄影"]}');
```

### B-tree 索引

B-tree 是 PostgreSQL 默认的索引类型。

**创建单列索引**

```sql
-- 创建 email 索引
CREATE INDEX idx_users_email ON users(email);

-- 创建 age 索引
CREATE INDEX idx_users_age ON users(age);
```

**创建复合索引**

```sql
-- 创建 city 和 age 的复合索引
CREATE INDEX idx_users_city_age ON users(city, age);

-- 使用索引查询
SELECT * FROM users WHERE city = '北京' AND age > 25;
```

**创建唯一索引**

```sql
-- 创建唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- 插入重复值会报错
-- INSERT INTO users (username, email) VALUES ('张三', 'new@example.com');
```

### 哈希索引

哈希索引只支持等值查询。

```sql
-- 创建哈希索引
CREATE INDEX idx_users_email_hash ON users USING HASH (email);

-- 使用索引查询（只支持等值查询）
SELECT * FROM users WHERE email = 'zhangsan@example.com';
```

### GiST 索引

GiST 索引适用于几何类型和全文搜索。

```sql
-- 创建几何类型表
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    location POINT  -- 几何类型
);

-- 创建 GiST 索引
CREATE INDEX idx_locations_location ON locations USING GIST (location);

-- 插入数据
INSERT INTO locations (name, location) VALUES
    ('北京', POINT(116.4074, 39.9042)),
    ('上海', POINT(121.4737, 31.2304));

-- 查询距离某个点最近的地点
SELECT * FROM locations
ORDER BY location <-> POINT(116.0, 39.0)
LIMIT 5;
```

### GIN 索引

GIN 索引适用于数组和 JSONB 类型。

**数组索引**

```sql
-- 创建数组 GIN 索引
CREATE INDEX idx_users_tags ON users USING GIN (tags);

-- 查询包含特定标签的用户
SELECT * FROM users WHERE tags @> ARRAY['技术'];

-- 查询包含任意标签的用户
SELECT * FROM users WHERE tags && ARRAY['技术', '设计'];
```

**JSONB 索引**

```sql
-- 创建 JSONB GIN 索引
CREATE INDEX idx_users_profile ON users USING GIN (profile);

-- 查询包含特定键值的用户
SELECT * FROM users WHERE profile @> '{"interests": ["读书"]}';
```

---

## 4 进阶用法

### 部分索引

部分索引只对满足条件的行创建索引。

```sql
-- 只为年龄大于 25 的用户创建索引
CREATE INDEX idx_users_age_over_25 ON users(age) WHERE age > 25;

-- 查询时会使用索引
SELECT * FROM users WHERE age > 30;

-- 查询年龄小于 25 的用户不会使用索引
SELECT * FROM users WHERE age < 20;
```

### 表达式索引

表达式索引基于表达式创建。

```sql
-- 创建用户名小写的索引
CREATE INDEX idx_users_username_lower ON users(LOWER(username));

-- 使用索引查询
SELECT * FROM users WHERE LOWER(username) = 'zhangsan';
```

### 覆盖索引

覆盖索引包含查询所需的所有列。

```sql
-- 创建覆盖索引（包含 email 和 age）
CREATE INDEX idx_users_email_age ON users(email, age);

-- 查询只需要扫描索引，不需要回表
SELECT email, age FROM users WHERE email = 'zhangsan@example.com';
```

### 查看索引使用情况

```sql
-- 查看表上的所有索引
\d users

-- 查看索引大小
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes
WHERE tablename = 'users';

-- 查看索引使用统计
SELECT 
    indexrelname AS index_name,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE relname = 'users';
```

### 删除索引

```sql
-- 删除单个索引
DROP INDEX idx_users_email;

-- 删除多个索引
DROP INDEX idx_users_email, idx_users_age;

-- 如果索引存在才删除
DROP INDEX IF EXISTS idx_users_email;
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| B-tree 索引 | 默认索引类型，支持范围查询 |
| Hash 索引 | 只支持等值查询 |
| GiST 索引 | 适用于几何类型、全文搜索 |
| GIN 索引 | 适用于数组、JSONB |
| 部分索引 | 只对满足条件的行创建索引 |
| 表达式索引 | 基于表达式创建索引 |
| 覆盖索引 | 包含查询所需的所有列 |

---

## 6 新手常见误区

### 误区 1："索引越多越好"

**错！** 索引虽然提高查询速度，但会：

- 占用额外的存储空间
- 降低插入、更新、删除的速度（需要维护索引）
- 增加数据库维护成本

建议：
- ✅ 只在经常查询的列上创建索引
- ✅ 避免在更新频繁的列上创建过多索引
- ✅ 定期分析索引使用情况，删除无用索引

### 误区 2："LIKE 查询一定使用索引"

**错！** LIKE 查询只有在模式不以通配符开头时才使用索引。

```sql
-- ✅ 使用索引
SELECT * FROM users WHERE username LIKE '张%';

-- ❌ 不使用索引
SELECT * FROM users WHERE username LIKE '%三';
```

### 误区 3："主键不需要索引"

**错！** 主键自动创建唯一索引，这是 PostgreSQL 的默认行为。

```sql
-- 创建表时，主键自动创建索引
CREATE TABLE users (
    id SERIAL PRIMARY KEY,  -- 自动创建唯一索引
    username VARCHAR(50)
);
```

### 误区 4："索引可以加速所有查询"

**错！** 索引只能加速特定类型的查询。

```sql
-- ❌ 不会使用索引：函数包装列
SELECT * FROM users WHERE UPPER(username) = 'ZHANGSAN';

-- ✅ 会使用索引：创建表达式索引
CREATE INDEX idx_users_username_upper ON users(UPPER(username));
SELECT * FROM users WHERE UPPER(username) = 'ZHANGSAN';
```

---

## 7 动手练习

### 练习 1：基础索引

为 `users` 表创建以下索引：
- username 的唯一索引
- city 的普通索引
- age 的降序索引

<details>
<summary>点击查看答案</summary>

```sql
-- 创建 username 的唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- 创建 city 的普通索引
CREATE INDEX idx_users_city ON users(city);

-- 创建 age 的降序索引
CREATE INDEX idx_users_age_desc ON users(age DESC);
```

</details>

### 练习 2：GIN 索引

为 `users` 表的 tags 数组和 profile JSONB 字段创建 GIN 索引，并查询：
- 包含"技术"标签的用户
- profile 中包含"读书"兴趣的用户

<details>
<summary>点击查看答案</summary>

```sql
-- 创建 tags 的 GIN 索引
CREATE INDEX idx_users_tags ON users USING GIN (tags);

-- 创建 profile 的 GIN 索引
CREATE INDEX idx_users_profile ON users USING GIN (profile);

-- 查询包含"技术"标签的用户
SELECT * FROM users WHERE tags @> ARRAY['技术'];

-- 查询 profile 中包含"读书"兴趣的用户
SELECT * FROM users WHERE profile @> '{"interests": ["读书"]}';
```

</details>

### 练习 3（挑战）：索引优化

分析以下查询，创建合适的索引：

```sql
-- 查询北京年龄大于 25 的用户，按年龄排序
SELECT * FROM users 
WHERE city = '北京' AND age > 25 
ORDER BY age DESC 
LIMIT 10;
```

<details>
<summary>点击查看答案</summary>

```sql
-- 创建复合索引（city, age DESC）
CREATE INDEX idx_users_city_age ON users(city, age DESC);

-- 验证索引使用
EXPLAIN ANALYZE
SELECT * FROM users 
WHERE city = '北京' AND age > 25 
ORDER BY age DESC 
LIMIT 10;

-- 应该看到使用了 idx_users_city_age 索引
```

</details>

---

## 下一章预告

下一章我们会学习 **事务与 ACID**——了解事务的概念，掌握 ACID 特性、隔离级别、MVCC 机制，以及如何使用事务保证数据的一致性。
