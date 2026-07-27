---
title: "第03章：SQL 基础语法"
description: "SELECT、INSERT、UPDATE、DELETE 基础操作"
---

# 第03章：SQL 基础语法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- SQL 是什么？为什么要学 SQL？
- 如何查询数据？如何条件过滤？
- 如何插入、更新、删除数据？
- SQL 语句的语法格式是怎样的？

这一章就是为了解答这些问题。我们会先搞清楚 **SQL 的基本概念**，再动手实践增删改查操作。

---

## 1 为什么需要 SQL？

### 痛点分析

想象一下，你有一个包含 10000 条用户数据的表。如果要用程序来查询"年龄大于 20 岁的用户"：

```python
# ❌ 低效的方式：把数据全部读出来，在程序中过滤
users = database.query("SELECT * FROM users")
result = [u for u in users if u.age > 20]
```

问题：
- ❌ 传输大量无用数据，浪费带宽
- ❌ 程序处理慢，效率低
- ❌ 数据库的优化能力没有利用

### 解决方案

使用 SQL 直接在数据库中查询：

```sql
-- ✅ 高效的方式：在数据库层面过滤
SELECT * FROM users WHERE age > 20;
```

优势：
- ✅ 只传输需要的数据
- ✅ 数据库引擎优化过，速度快
- ✅ 语法简洁，易于理解

> **一句话总结**：SQL 是和数据库沟通的语言，掌握 SQL 可以高效地操作数据。

---

## 2 核心原理

### 概念解释

**SQL（Structured Query Language）** 是结构化查询语言，用于操作关系型数据库。

SQL 分为四大类：

| 类别 | 全称 | 说明 | 常用命令 |
| --- | --- | --- | --- |
| DQL | Data Query Language | 数据查询语言 | SELECT |
| DML | Data Manipulation Language | 数据操作语言 | INSERT、UPDATE、DELETE |
| DDL | Data Definition Language | 数据定义语言 | CREATE、ALTER、DROP |
| DCL | Data Control Language | 数据控制语言 | GRANT、REVOKE |

打个比方：

> SQL 就像是你和数据库之间的**翻译官**：
> - 你用 SQL 告诉数据库要什么
> - 数据库理解后返回结果

---

## 3 基础用法

### 准备工作

先创建一个示例表：

```sql
-- 创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    age INTEGER,
    city VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SELECT 查询

**查询所有数据**

```sql
-- 查询所有用户的所有字段
SELECT * FROM users;
```

**查询指定列**

```sql
-- 只查询用户名和邮箱
SELECT username, email FROM users;
```

**使用别名**

```sql
-- 给列起别名
SELECT 
    username AS 用户名,
    email AS 邮箱,
    age AS 年龄
FROM users;
```

**去重查询**

```sql
-- 查询所有不同的城市
SELECT DISTINCT city FROM users;
```

### WHERE 条件查询

**比较运算符**

```sql
-- 查询年龄大于 20 的用户
SELECT * FROM users WHERE age > 20;

-- 查询年龄等于 25 的用户
SELECT * FROM users WHERE age = 25;

-- 查询年龄不等于 30 的用户
SELECT * FROM users WHERE age <> 30;
-- 或者
SELECT * FROM users WHERE age != 30;
```

**逻辑运算符**

```sql
-- AND：同时满足多个条件
SELECT * FROM users 
WHERE age > 20 AND city = '北京';

-- OR：满足其中一个条件
SELECT * FROM users 
WHERE city = '北京' OR city = '上海';

-- NOT：取反
SELECT * FROM users 
WHERE NOT city = '北京';
```

**范围查询**

```sql
-- BETWEEN：在某个范围内
SELECT * FROM users 
WHERE age BETWEEN 20 AND 30;

-- IN：在某个集合中
SELECT * FROM users 
WHERE city IN ('北京', '上海', '广州');
```

**模糊查询**

```sql
-- LIKE：模糊匹配
-- % 表示任意多个字符
SELECT * FROM users 
WHERE username LIKE '张%';  -- 查询姓张的用户

-- _ 表示任意单个字符
SELECT * FROM users 
WHERE username LIKE '张_';  -- 查询姓张且名字只有两个字的用户
```

**NULL 处理**

```sql
-- 查询 email 为空的用户
SELECT * FROM users WHERE email IS NULL;

-- 查询 email 不为空的用户
SELECT * FROM users WHERE email IS NOT NULL;
```

### ORDER BY 排序

```sql
-- 按年龄升序排列（默认）
SELECT * FROM users ORDER BY age ASC;

-- 按年龄降序排列
SELECT * FROM users ORDER BY age DESC;

-- 多列排序：先按城市排序，城市相同再按年龄排序
SELECT * FROM users 
ORDER BY city ASC, age DESC;
```

### LIMIT 限制结果数量

```sql
-- 只查询前 10 条数据
SELECT * FROM users LIMIT 10;

-- 从第 11 条开始，查询 10 条（分页）
SELECT * FROM users LIMIT 10 OFFSET 10;
```

### INSERT 插入数据

**插入单条数据**

```sql
-- 插入一条用户数据
INSERT INTO users (username, email, age, city)
VALUES ('张三', 'zhangsan@example.com', 25, '北京');
```

**插入多条数据**

```sql
-- 一次插入多条数据
INSERT INTO users (username, email, age, city)
VALUES 
    ('李四', 'lisi@example.com', 28, '上海'),
    ('王五', 'wangwu@example.com', 30, '广州'),
    ('赵六', 'zhaoliu@example.com', 22, '深圳');
```

**插入默认值**

```sql
-- 使用默认值插入
INSERT INTO users DEFAULT VALUES;
```

**返回插入的数据**

```sql
-- 插入并返回插入的数据
INSERT INTO users (username, email, age, city)
VALUES ('孙七', 'sunqi@example.com', 26, '杭州')
RETURNING *;
```

### UPDATE 更新数据

**更新所有行**

```sql
-- 将所有用户的年龄加 1
UPDATE users SET age = age + 1;
```

**条件更新**

```sql
-- 将北京的用户年龄加 1
UPDATE users 
SET age = age + 1 
WHERE city = '北京';
```

**更新多个字段**

```sql
-- 同时更新多个字段
UPDATE users 
SET 
    age = 26,
    city = '北京'
WHERE username = '张三';
```

**返回更新的数据**

```sql
-- 更新并返回更新后的数据
UPDATE users 
SET age = 27 
WHERE username = '张三'
RETURNING *;
```

### DELETE 删除数据

**删除所有数据**

```sql
-- 删除表中所有数据（表结构还在）
DELETE FROM users;
```

**条件删除**

```sql
-- 删除年龄大于 30 的用户
DELETE FROM users WHERE age > 30;
```

**返回删除的数据**

```sql
-- 删除并返回删除的数据
DELETE FROM users 
WHERE age > 30
RETURNING *;
```

**清空表（包括自增序列）**

```sql
-- 清空表，重置自增序列
TRUNCATE TABLE users;
```

---

## 4 进阶用法

### 聚合函数

```sql
-- COUNT：计数
SELECT COUNT(*) FROM users;  -- 查询总行数
SELECT COUNT(city) FROM users;  -- 查询 city 不为 NULL 的行数

-- SUM：求和
SELECT SUM(age) FROM users;  -- 查询年龄总和

-- AVG：平均值
SELECT AVG(age) FROM users;  -- 查询平均年龄

-- MAX：最大值
SELECT MAX(age) FROM users;  -- 查询最大年龄

-- MIN：最小值
SELECT MIN(age) FROM users;  -- 查询最小年龄
```

### 表达式

```sql
-- 算术表达式
SELECT username, age, age + 5 AS age_in_5_years FROM users;

-- 字符串拼接
SELECT username || ' (' || city || ')' AS user_info FROM users;

-- CASE 表达式
SELECT 
    username,
    age,
    CASE 
        WHEN age < 18 THEN '未成年'
        WHEN age BETWEEN 18 AND 30 THEN '青年'
        WHEN age BETWEEN 31 AND 50 THEN '中年'
        ELSE '老年'
    END AS age_group
FROM users;
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| SELECT | 查询数据 |
| WHERE | 条件过滤 |
| ORDER BY | 排序 |
| LIMIT | 限制结果数量 |
| INSERT | 插入数据 |
| UPDATE | 更新数据 |
| DELETE | 删除数据 |
| TRUNCATE | 清空表 |
| 聚合函数 | COUNT、SUM、AVG、MAX、MIN |

---

## 6 新手常见误区

### 误区 1："SELECT * 总是最好的"

**错！** `SELECT *` 会查询所有列，可能导致：

- 传输不必要的数据，浪费带宽
- 如果表结构改变，程序可能出错

建议：只查询需要的列。

```sql
-- ❌ 不推荐
SELECT * FROM users;

-- ✅ 推荐
SELECT username, email FROM users;
```

### 误区 2："UPDATE 和 DELETE 不需要 WHERE"

**错！** 如果不加 WHERE 条件，会更新或删除所有行！

```sql
-- ❌ 危险：会更新所有用户的年龄
UPDATE users SET age = 25;

-- ✅ 安全：只更新特定用户
UPDATE users SET age = 25 WHERE username = '张三';
```

### 误区 3："NULL 和空字符串是一样的"

**错！** NULL 表示"没有值"，空字符串表示"有值，只是为空"。

```sql
-- ❌ 错误：NULL 不能用 = 判断
SELECT * FROM users WHERE email = NULL;

-- ✅ 正确：使用 IS NULL
SELECT * FROM users WHERE email IS NULL;
```

### 误区 4："LIKE 查询不区分大小写"

不是的。PostgreSQL 的 LIKE 默认区分大小写。

```sql
-- 区分大小写
SELECT * FROM users WHERE username LIKE 'Zhang%';  -- 只匹配 Zhang

-- 不区分大小写
SELECT * FROM users WHERE username ILIKE 'Zhang%';  -- 匹配 Zhang、zhang 等
```

---

## 7 动手练习

### 练习 1：基础查询

创建一个 `products` 表，包含 id、name、price、category、stock 字段，插入 5 条商品数据，然后查询：
- 所有价格大于 100 的商品
- 所有电子产品类别的商品
- 库存最少的 3 个商品

<details>
<summary>点击查看答案</summary>

```sql
-- 创建商品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) CHECK (price > 0),
    category VARCHAR(50),
    stock INTEGER DEFAULT 0
);

-- 插入数据
INSERT INTO products (name, price, category, stock) VALUES
    ('iPhone 15', 7999, '电子产品', 50),
    ('MacBook Pro', 14999, '电子产品', 30),
    ('Nike 运动鞋', 899, '服装', 100),
    ('Adidas T恤', 299, '服装', 200),
    ('星巴克咖啡', 38, '食品', 500);

-- 查询价格大于 100 的商品
SELECT * FROM products WHERE price > 100;

-- 查询电子产品类别的商品
SELECT * FROM products WHERE category = '电子产品';

-- 查询库存最少的 3 个商品
SELECT * FROM products ORDER BY stock ASC LIMIT 3;
```

</details>

### 练习 2：数据操作

在 `products` 表中：
- 将所有电子产品的价格降低 10%
- 删除库存为 0 的商品
- 查询每个类别的商品数量和平均价格

<details>
<summary>点击查看答案</summary>

```sql
-- 将电子产品价格降低 10%
UPDATE products 
SET price = price * 0.9 
WHERE category = '电子产品';

-- 删除库存为 0 的商品（假设有一条库存为 0）
INSERT INTO products (name, price, category, stock) VALUES ('测试商品', 10, '测试', 0);
DELETE FROM products WHERE stock = 0;

-- 查询每个类别的商品数量和平均价格
SELECT 
    category AS 类别,
    COUNT(*) AS 商品数量,
    AVG(price) AS 平均价格
FROM products
GROUP BY category;
```

</details>

### 练习 3（挑战）：综合查询

创建一个 `orders` 表，包含 id、user_id、product_id、quantity、total_amount、order_date 字段，实现：
- 查询最近 7 天的订单
- 查询订单金额大于 1000 的订单，按金额降序排列
- 统计每个月的订单数量和总金额

<details>
<summary>点击查看答案</summary>

```sql
-- 创建订单表
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER CHECK (quantity > 0),
    total_amount DECIMAL(10, 2) CHECK (total_amount > 0),
    order_date DATE DEFAULT CURRENT_DATE
);

-- 插入示例数据
INSERT INTO orders (user_id, product_id, quantity, total_amount, order_date) VALUES
    (1, 1, 1, 7999, CURRENT_DATE - INTERVAL '1 day'),
    (2, 2, 1, 14999, CURRENT_DATE - INTERVAL '3 days'),
    (1, 3, 2, 1798, CURRENT_DATE - INTERVAL '5 days'),
    (3, 4, 1, 299, CURRENT_DATE - INTERVAL '10 days');

-- 查询最近 7 天的订单
SELECT * FROM orders 
WHERE order_date >= CURRENT_DATE - INTERVAL '7 days';

-- 查询订单金额大于 1000 的订单，按金额降序
SELECT * FROM orders 
WHERE total_amount > 1000 
ORDER BY total_amount DESC;

-- 统计每个月的订单数量和总金额
SELECT 
    TO_CHAR(order_date, 'YYYY-MM') AS 月份,
    COUNT(*) AS 订单数量,
    SUM(total_amount) AS 总金额
FROM orders
GROUP BY TO_CHAR(order_date, 'YYYY-MM')
ORDER BY 月份;
```

</details>

---

## 下一章预告

下一章我们会学习 **数据类型与约束**——了解 PostgreSQL 支持的各种数据类型（数值、字符串、日期等），以及如何使用约束（NOT NULL、UNIQUE、DEFAULT、CHECK）来保证数据的完整性。
