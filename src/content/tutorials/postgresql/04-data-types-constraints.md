---
title: "第04章：数据类型与约束"
description: "数值、字符串、日期类型，NOT NULL、UNIQUE、DEFAULT、CHECK"
---

# 第04章：数据类型与约束

## 本章导读

在学这一章之前，你可能会有这些疑问：

- PostgreSQL 支持哪些数据类型？
- 如何选择合适的数据类型？
- 什么是约束？有哪些类型的约束？
- 如何使用约束保证数据完整性？

这一章就是为了解答这些问题。我们会先搞清楚 **PostgreSQL 的数据类型**，再学习如何使用**约束**来保证数据的正确性。

---

## 1 为什么需要数据类型和约束？

### 痛点分析

想象一下，你要存储用户的年龄。如果用 VARCHAR 类型：

```sql
-- ❌ 错误示范：使用 VARCHAR 存储年龄
CREATE TABLE users (
    age VARCHAR(10)  -- 可以输入 'abc'、'-5'、'999' 等
);
```

问题：
- ❌ 可以输入非数字字符
- ❌ 可以输入负数
- ❌ 可以输入不合理的年龄（如 999）
- ❌ 查询时需要转换类型，效率低

### 解决方案

使用合适的数据类型和约束：

```sql
-- ✅ 正确示范：使用 INTEGER + CHECK 约束
CREATE TABLE users (
    age INTEGER CHECK (age >= 0 AND age <= 150)
);
```

优势：
- ✅ 只能输入整数
- ✅ 自动检查范围
- ✅ 查询效率高

> **一句话总结**：选择合适的数据类型和约束，可以保证数据的正确性和一致性。

---

## 2 核心原理

### 概念解释

**数据类型**

数据类型定义了列可以存储的数据种类和格式。

打个比方：

> 数据类型就像是**容器的形状**：
> - 圆形容器只能装圆形物品
> - 方形容器只能装方形物品
> - 选择错误的容器，物品可能装不下或浪费空间

**约束**

约束是用于**限制表中数据规则**的条件。

打个比方：

> 约束就像是**容器的盖子**：
> - NOT NULL 盖子：不能为空
> - UNIQUE 盖子：不能重复
> - CHECK 盖子：必须满足条件

---

## 3 基础用法

### 数值类型

**整数类型**

| 类型 | 存储空间 | 范围 |
| --- | --- | --- |
| SMALLINT | 2 字节 | -32768 到 32767 |
| INTEGER | 4 字节 | -2147483648 到 2147483647 |
| BIGINT | 8 字节 | -9223372036854775808 到 9223372036854775807 |

```sql
-- 创建示例表
CREATE TABLE numeric_demo (
    small_num SMALLINT,      -- 小整数
    normal_num INTEGER,      -- 普通整数
    big_num BIGINT           -- 大整数
);

-- 插入数据
INSERT INTO numeric_demo VALUES (100, 100000, 10000000000);
```

**精确数值类型**

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| NUMERIC(p, s) | 精确数值，p 是总位数，s 是小数位数 | NUMERIC(10, 2) 表示最多 10 位，其中 2 位小数 |
| DECIMAL(p, s) | 和 NUMERIC 相同 | DECIMAL(10, 2) |

```sql
-- 创建价格表
CREATE TABLE prices (
    price NUMERIC(10, 2)  -- 最多 10 位，其中 2 位小数
);

-- 插入数据
INSERT INTO prices VALUES (99.99);
INSERT INTO prices VALUES (1234567.89);
-- INSERT INTO prices VALUES (12345678.99);  -- ❌ 错误：超出范围
```

**序列类型**

SERIAL 是 PostgreSQL 的自增序列。

```sql
-- 创建自增 ID 表
CREATE TABLE auto_increment_demo (
    id SERIAL PRIMARY KEY,  -- 自增主键
    name VARCHAR(50)
);

-- 插入数据（不需要指定 id）
INSERT INTO auto_increment_demo (name) VALUES ('张三');
INSERT INTO auto_increment_demo (name) VALUES ('李四');

-- 查询数据
SELECT * FROM auto_increment_demo;
-- 结果：
-- id | name
-- 1  | 张三
-- 2  | 李四
```

### 字符串类型

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| VARCHAR(n) | 可变长度字符串，最大长度 n | VARCHAR(50) |
| CHAR(n) | 固定长度字符串，长度 n | CHAR(10) |
| TEXT | 可变长度字符串，无长度限制 | TEXT |

```sql
-- 创建字符串表示例
CREATE TABLE string_demo (
    fixed_str CHAR(10),      -- 固定长度
    var_str VARCHAR(50),     -- 可变长度
    text_str TEXT            -- 无长度限制
);

-- 插入数据
INSERT INTO string_demo VALUES ('Hello', 'Hello World', '这是一段很长的文本...');

-- 查看实际存储长度
SELECT 
    LENGTH(fixed_str) AS fixed_len,
    LENGTH(var_str) AS var_len,
    LENGTH(text_str) AS text_len
FROM string_demo;
```

**建议**：
- ✅ 优先使用 VARCHAR 或 TEXT
- ❌ 避免使用 CHAR（除非固定长度，如身份证号）

### 日期时间类型

| 类型 | 存储空间 | 范围 | 说明 |
| --- | --- | --- | --- |
| DATE | 4 字节 | 4713 BC 到 5874897 AD | 日期 |
| TIME | 8 字节 | 00:00:00 到 24:00:00 | 时间 |
| TIMESTAMP | 8 字节 | 4713 BC 到 294276 AD | 日期和时间 |
| INTERVAL | 16 字节 | - | 时间间隔 |

```sql
-- 创建日期时间表示例
CREATE TABLE datetime_demo (
    birth_date DATE,
    alarm_time TIME,
    created_at TIMESTAMP,
    duration INTERVAL
);

-- 插入数据
INSERT INTO datetime_demo VALUES (
    '1990-05-15',
    '08:30:00',
    '2024-01-15 14:30:00',
    '1 year 2 months 3 days'
);

-- 查询当前时间
SELECT CURRENT_DATE AS 今天日期;
SELECT CURRENT_TIME AS 当前时间;
SELECT CURRENT_TIMESTAMP AS 当前时间戳;
SELECT NOW() AS 当前时间;

-- 日期时间运算
SELECT 
    CURRENT_DATE + INTERVAL '1 day' AS 明天,
    CURRENT_DATE - INTERVAL '1 month' AS 上个月,
    CURRENT_TIMESTAMP + INTERVAL '2 hours' AS 两小时后;
```

### 布尔类型

```sql
-- 创建布尔类型表示例
CREATE TABLE boolean_demo (
    is_active BOOLEAN,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 插入数据
INSERT INTO boolean_demo (is_active) VALUES (TRUE);
INSERT INTO boolean_demo (is_active) VALUES (FALSE);
INSERT INTO boolean_demo (is_active) VALUES (NULL);

-- 查询
SELECT * FROM boolean_demo WHERE is_active = TRUE;
```

### JSON 类型

PostgreSQL 支持 JSON 和 JSONB 两种类型。

| 类型 | 说明 |
| --- | --- |
| JSON | 存储 JSON 文本，查询时需要解析 |
| JSONB | 存储二进制格式 JSON，查询时不需要解析，支持索引 |

```sql
-- 创建 JSON 表示例
CREATE TABLE json_demo (
    data_json JSON,
    data_jsonb JSONB
);

-- 插入数据
INSERT INTO json_demo VALUES (
    '{"name": "张三", "age": 25, "city": "北京"}',
    '{"name": "李四", "age": 28, "city": "上海"}'
);

-- 查询 JSON 字段
SELECT 
    data_json->>'name' AS name,
    data_json->>'age' AS age
FROM json_demo;

-- JSONB 支持索引
CREATE INDEX idx_jsonb ON json_demo USING GIN (data_jsonb);
```

---

## 4 约束详解

### NOT NULL 约束

NOT NULL 约束确保列的值不能为 NULL。

```sql
-- 创建带 NOT NULL 约束的表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,  -- 不能为空
    email VARCHAR(100)              -- 可以为空
);

-- ✅ 正确：提供了 username
INSERT INTO users (username, email) VALUES ('张三', 'zhangsan@example.com');

-- ❌ 错误：username 为空
-- INSERT INTO users (email) VALUES ('test@example.com');
```

### UNIQUE 约束

UNIQUE 约束确保列的值不能重复。

```sql
-- 创建带 UNIQUE 约束的表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,  -- 用户名不能重复
    email VARCHAR(100) UNIQUE     -- 邮箱不能重复
);

-- ✅ 正确
INSERT INTO users (username, email) VALUES ('张三', 'zhangsan@example.com');

-- ❌ 错误：用户名重复
-- INSERT INTO users (username, email) VALUES ('张三', 'another@example.com');
```

**多列 UNIQUE**

```sql
-- 多列组合唯一
CREATE TABLE user_roles (
    user_id INTEGER,
    role_id INTEGER,
    UNIQUE (user_id, role_id)  -- user_id 和 role_id 的组合不能重复
);
```

### DEFAULT 约束

DEFAULT 约束为列提供默认值。

```sql
-- 创建带 DEFAULT 约束的表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- 默认状态为 active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 默认创建时间为当前时间
);

-- 插入数据（不指定 status 和 created_at）
INSERT INTO users (username) VALUES ('张三');

-- 查询结果
SELECT * FROM users;
-- 结果：
-- id | username | status | created_at
-- 1  | 张三     | active | 2024-01-15 14:30:00
```

### CHECK 约束

CHECK 约束确保列的值必须满足指定条件。

```sql
-- 创建带 CHECK 约束的表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) CHECK (price > 0),  -- 价格必须大于 0
    stock INTEGER CHECK (stock >= 0),        -- 库存不能为负数
    category VARCHAR(50) CHECK (category IN ('电子产品', '服装', '食品'))  -- 类别必须是其中之一
);

-- ✅ 正确
INSERT INTO products (name, price, stock, category) 
VALUES ('iPhone', 7999, 100, '电子产品');

-- ❌ 错误：价格小于 0
-- INSERT INTO products (name, price, stock, category) 
-- VALUES ('测试', -10, 100, '电子产品');

-- ❌ 错误：库存为负
-- INSERT INTO products (name, price, stock, category) 
-- VALUES ('测试', 100, -5, '电子产品');

-- ❌ 错误：类别不在允许值中
-- INSERT INTO products (name, price, stock, category) 
-- VALUES ('测试', 100, 100, '其他');
```

### PRIMARY KEY 约束

PRIMARY KEY 约束唯一标识表中的每一行。

```sql
-- 单列主键
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50)
);

-- 多列主键（联合主键）
CREATE TABLE student_courses (
    student_id INTEGER,
    course_id INTEGER,
    score DECIMAL(5, 2),
    PRIMARY KEY (student_id, course_id)  -- 联合主键
);
```

### FOREIGN KEY 约束

FOREIGN KEY 约束建立表与表之间的关系。

```sql
-- 创建父表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL
);

-- 创建子表（带外键）
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2),
    FOREIGN KEY (user_id) REFERENCES users(id)  -- 外键约束
);

-- ✅ 正确：user_id 存在于 users 表中
INSERT INTO users (username) VALUES ('张三');
INSERT INTO orders (user_id, amount) VALUES (1, 100);

-- ❌ 错误：user_id 不存在于 users 表中
-- INSERT INTO orders (user_id, amount) VALUES (999, 100);
```

**外键的级联操作**

```sql
-- 创建带级联删除的外键
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2),
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE  -- 删除用户时，自动删除相关订单
        ON UPDATE CASCADE  -- 更新用户 ID 时，自动更新订单中的 user_id
);
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 数值类型 | SMALLINT、INTEGER、BIGINT、NUMERIC、DECIMAL |
| 字符串类型 | VARCHAR、CHAR、TEXT |
| 日期时间类型 | DATE、TIME、TIMESTAMP、INTERVAL |
| 布尔类型 | BOOLEAN |
| JSON 类型 | JSON、JSONB |
| NOT NULL 约束 | 不能为空 |
| UNIQUE 约束 | 不能重复 |
| DEFAULT 约束 | 默认值 |
| CHECK 约束 | 必须满足条件 |
| PRIMARY KEY 约束 | 主键，唯一且非空 |
| FOREIGN KEY 约束 | 外键，引用其他表 |

---

## 6 新手常见误区

### 误区 1："VARCHAR 必须指定长度"

**错！** 在 PostgreSQL 中，VARCHAR 不指定长度时，可以存储任意长度的字符串。

```sql
-- ✅ 正确：指定长度
CREATE TABLE users (
    username VARCHAR(50)
);

-- ✅ 正确：不指定长度
CREATE TABLE users (
    username VARCHAR  -- 可以存储任意长度
);

-- ✅ 推荐：使用 TEXT
CREATE TABLE users (
    username TEXT  -- 无长度限制
);
```

### 误区 2："CHAR 和 VARCHAR 没有区别"

**错！** CHAR 是固定长度，VARCHAR 是可变长度。

```sql
-- CHAR(10)：无论存储什么，都占用 10 个字符的空间
-- 'Hello' 会被填充为 'Hello     '

-- VARCHAR(10)：只占用实际存储长度的空间
-- 'Hello' 只占用 5 个字符的空间
```

建议：
- ✅ 优先使用 VARCHAR 或 TEXT
- ❌ 避免使用 CHAR（除非固定长度）

### 误区 3："TIMESTAMP 和 DATE 是一样的"

**错！** DATE 只存储日期，TIMESTAMP 存储日期和时间。

```sql
-- DATE：只存储日期
SELECT '2024-01-15'::DATE;  -- 结果：2024-01-15

-- TIMESTAMP：存储日期和时间
SELECT '2024-01-15 14:30:00'::TIMESTAMP;  -- 结果：2024-01-15 14:30:00
```

### 误区 4："CHECK 约束只能用于单列"

**错！** CHECK 约束可以用于多列。

```sql
-- 多列 CHECK 约束
CREATE TABLE events (
    start_date DATE,
    end_date DATE,
    CHECK (end_date >= start_date)  -- 结束日期必须大于等于开始日期
);
```

---

## 7 动手练习

### 练习 1：数据类型选择

为以下场景选择合适的数据类型：
- 用户年龄
- 商品价格
- 用户简介
- 身份证号
- 订单状态（pending、paid、shipped、completed）
- 用户注册时间

<details>
<summary>点击查看答案</summary>

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    age INTEGER CHECK (age >= 0 AND age <= 150),  -- 用户年龄
    price DECIMAL(10, 2) CHECK (price > 0),       -- 商品价格
    bio TEXT,                                      -- 用户简介
    id_card CHAR(18),                              -- 身份证号（固定 18 位）
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'shipped', 'completed')),  -- 订单状态
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 用户注册时间
);
```

</details>

### 练习 2：约束应用

创建一个 `employees` 表，包含以下约束：
- id：自增主键
- name：不能为空
- email：不能重复
- age：必须在 18 到 65 之间
- salary：必须大于 0
- department：默认值为 '未分配'
- hire_date：默认值为当前日期

<details>
<summary>点击查看答案</summary>

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    age INTEGER CHECK (age >= 18 AND age <= 65),
    salary DECIMAL(10, 2) CHECK (salary > 0),
    department VARCHAR(50) DEFAULT '未分配',
    hire_date DATE DEFAULT CURRENT_DATE
);
```

</details>

### 练习 3（挑战）：综合设计

设计一个 `blog_posts` 表，包含以下要求：
- id：自增主键
- title：不能为空，最大长度 200
- content：不能为空
- author_id：外键引用 users 表
- status：只能是 'draft'、'published'、'archived' 之一
- view_count：不能为负数，默认值为 0
- created_at：默认值为当前时间
- updated_at：默认值为当前时间
- 添加 CHECK 约束：updated_at 必须大于等于 created_at

<details>
<summary>点击查看答案</summary>

```sql
-- 先创建 users 表（作为外键引用）
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL
);

-- 创建 blog_posts 表
CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    status VARCHAR(20) CHECK (status IN ('draft', 'published', 'archived')),
    view_count INTEGER CHECK (view_count >= 0) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    CHECK (updated_at >= created_at)
);
```

</details>

---

## 下一章预告

下一章我们会学习 **条件查询与排序**——掌握 WHERE 子句的各种用法，包括比较运算符、逻辑运算符、范围查询、模糊查询等，以及如何使用 ORDER BY 对结果进行排序。
