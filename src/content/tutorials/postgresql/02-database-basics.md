---
title: "第02章：数据库基础概念"
description: "数据库、表、列、行、主键、外键、约束"
---

# 第02章：数据库基础概念

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 数据库、表、列、行到底是什么关系？
- 什么是主键？为什么需要主键？
- 什么是外键？外键有什么用？
- 数据库约束有哪些？如何使用？

这一章就是为了解答这些问题。我们会先搞清楚 **数据库的核心概念**，再学习如何设计合理的数据库结构。

---

## 1 为什么需要数据库设计？

### 痛点分析

想象一下，你要开发一个学生管理系统。如果不设计数据库，直接把数据存在文件里：

```
学生信息.txt：
张三，18岁，大一，计算机学院，张老师，计算机楼301
李四，19岁，大二，数学学院，李老师，数学楼201
```

问题出现了：

- ❌ 数据冗余：每个学生的学院信息都要重复写一遍
- ❌ 更新困难：如果张老师换办公室，要修改所有学生的记录
- ❌ 数据不一致：可能有些学生记录更新了，有些没更新
- ❌ 查询困难：想查"计算机学院所有学生"需要逐行扫描

### 解决方案

通过**数据库设计**，把数据组织成多个表，减少冗余，提高效率：

```
学生表（students）：
id | 姓名 | 年龄 | 年级 | 学院ID
1  | 张三 | 18   | 大一 | 1
2  | 李四 | 19   | 大二 | 2

学院表（colleges）：
id | 学院名称   | 负责人 | 办公室
1  | 计算机学院 | 张老师 | 计算机楼301
2  | 数学学院   | 李老师 | 数学楼201
```

> **一句话总结**：好的数据库设计可以减少数据冗余、保证数据一致性、提高查询效率。

---

## 2 核心原理

### 概念解释

**数据库（Database）**

数据库是存储数据的容器，就像一个**大型仓库**，里面有很多货架（表）。

**表（Table）**

表是数据库中的基本单位，就像仓库里的**货架**，每个货架存放一类物品。

**列（Column）**

列定义了表的属性，就像货架上每个物品的**标签**（名称、价格、数量）。

**行（Row）**

行是表中的一条记录，就像货架上的**一个具体物品**。

打个比方：

> 把数据库想象成一个**Excel 文件**：
> - **数据库** = 整个 Excel 文件
> - **表** = Excel 中的一个工作表（Sheet）
> - **列** = 工作表中的列（字段）
> - **行** = 工作表中的一行数据（记录）

### 主键（Primary Key）

主键是表中用来**唯一标识每一行**的列或列组合。

特点：
- ✅ 唯一性：主键的值不能重复
- ✅ 非空性：主键的值不能为 NULL
- ✅ 稳定性：主键的值不应该经常改变

示例：

```sql
-- 创建用户表，id 为主键
CREATE TABLE users (
    id INTEGER PRIMARY KEY,  -- 主键，唯一标识每个用户
    username VARCHAR(50),
    email VARCHAR(100)
);
```

### 外键（Foreign Key）

外键是用于**建立表与表之间关系**的列。

打个比方：

> 外键就像是一个**引用链接**，指向另一个表中的某一行。

示例：

```sql
-- 创建订单表
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,  -- 外键，引用 users 表的 id
    order_date DATE,
    -- 定义外键约束
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 约束（Constraints）

约束是用于**限制表中数据规则**的条件。

| 约束类型 | 说明 | 示例 |
| --- | --- | --- |
| PRIMARY KEY | 主键约束，唯一且非空 | `id INTEGER PRIMARY KEY` |
| FOREIGN KEY | 外键约束，引用其他表 | `FOREIGN KEY (user_id) REFERENCES users(id)` |
| UNIQUE | 唯一约束，值不能重复 | `email VARCHAR(100) UNIQUE` |
| NOT NULL | 非空约束，值不能为 NULL | `username VARCHAR(50) NOT NULL` |
| CHECK | 检查约束，值必须满足条件 | `age INTEGER CHECK (age >= 0)` |
| DEFAULT | 默认值约束 | `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |

---

## 3 基础用法

### 创建数据库

```sql
-- 创建一个名为 shop 的数据库
CREATE DATABASE shop;

-- 查看所有数据库
\l

-- 切换到 shop 数据库
\c shop
```

### 创建表

```sql
-- 创建用户表
CREATE TABLE users (
    -- 用户ID，自增主键
    id SERIAL PRIMARY KEY,
    -- 用户名，不能为空，最大长度50
    username VARCHAR(50) NOT NULL,
    -- 邮箱，不能重复
    email VARCHAR(100) UNIQUE,
    -- 年龄，必须大于0
    age INTEGER CHECK (age > 0),
    -- 创建时间，默认为当前时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 查看表结构
\d users
```

### 创建带外键的表

```sql
-- 创建订单表
CREATE TABLE orders (
    -- 订单ID，自增主键
    id SERIAL PRIMARY KEY,
    -- 用户ID，外键引用 users 表
    user_id INTEGER NOT NULL,
    -- 订单金额，必须大于0
    amount DECIMAL(10, 2) CHECK (amount > 0),
    -- 订单状态，默认为 'pending'
    status VARCHAR(20) DEFAULT 'pending',
    -- 创建时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 定义外键约束
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 查看表结构
\d orders
```

### 修改表结构

```sql
-- 添加新列
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- 修改列类型
ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(30);

-- 删除列
ALTER TABLE users DROP COLUMN phone;

-- 重命名表
ALTER TABLE users RENAME TO customers;

-- 重命名列
ALTER TABLE customers RENAME COLUMN username TO name;
```

### 删除表

```sql
-- 删除表（如果表中有数据，会报错）
DROP TABLE orders;

-- 强制删除表（包括表中的数据）
DROP TABLE orders CASCADE;

-- 如果表存在才删除
DROP TABLE IF EXISTS orders;
```

---

## 4 进阶用法

### 表之间的关系

**一对一关系**

一个用户只有一个身份证，一个身份证只属于一个用户。

```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL
);

-- 身份证表（一对一）
CREATE TABLE id_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE,  -- UNIQUE 保证一对一
    card_number VARCHAR(18) UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**一对多关系**

一个用户可以有多个订单，一个订单只属于一个用户。

```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL
);

-- 订单表（一对多）
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**多对多关系**

一个学生可以选多门课，一门课可以被多个学生选。

```sql
-- 学生表
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 课程表
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL
);

-- 选课表（中间表，实现多对多）
CREATE TABLE student_courses (
    student_id INTEGER,
    course_id INTEGER,
    score DECIMAL(5, 2),
    PRIMARY KEY (student_id, course_id),  -- 联合主键
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

### 索引基础

索引可以提高查询速度，就像书的目录一样。

```sql
-- 创建单列索引
CREATE INDEX idx_users_email ON users(email);

-- 创建复合索引
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- 删除索引
DROP INDEX idx_users_email;

-- 查看表上的所有索引
\d users
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 数据库 | 存储数据的容器 |
| 表 | 数据库中的基本单位，存储一类数据 |
| 列 | 表的属性定义 |
| 行 | 表中的一条记录 |
| 主键 | 唯一标识每一行的列 |
| 外键 | 建立表与表之间关系的列 |
| 约束 | 限制数据规则的 condition |
| 索引 | 提高查询速度的数据结构 |

---

## 6 新手常见误区

### 误区 1："主键必须是自增整数"

**错！** 主键可以是任何类型，只要保证唯一性：

```sql
-- ✅ 正确：使用 UUID 作为主键
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50)
);

-- ✅ 正确：使用字符串作为主键
CREATE TABLE products (
    product_code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100)
);
```

### 误区 2："外键必须有索引"

不是的。虽然外键通常建议创建索引以提高查询性能，但 PostgreSQL 不强制要求外键必须有索引。

### 误区 3："表越多越好"

**错！** 表的设计要遵循**规范化原则**：

- 避免过度拆分（导致查询时需要大量 JOIN）
- 避免过度合并（导致数据冗余和更新异常）

### 误区 4："索引越多越好"

**错！** 索引虽然提高查询速度，但会：

- 占用额外的存储空间
- 降低插入、更新、删除的速度（因为需要维护索引）

建议：只在经常查询的列上创建索引。

---

## 7 动手练习

### 练习 1：基础表设计

设计一个图书管理系统，包含以下表：
- books（图书表）：id、title、author、isbn、price
- members（会员表）：id、name、email、phone
- borrow_records（借阅记录表）：id、book_id、member_id、borrow_date、return_date

<details>
<summary>点击查看答案</summary>

```sql
-- 创建图书表
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    price DECIMAL(10, 2) CHECK (price >= 0)
);

-- 创建会员表
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20)
);

-- 创建借阅记录表
CREATE TABLE borrow_records (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    borrow_date DATE DEFAULT CURRENT_DATE,
    return_date DATE,
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
);
```

</details>

### 练习 2：约束应用

在 `books` 表中，添加以下约束：
- price 必须大于 0
- isbn 不能重复
- title 不能为空

<details>
<summary>点击查看答案</summary>

```sql
-- 创建带约束的图书表
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,  -- NOT NULL 约束
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20) UNIQUE,      -- UNIQUE 约束
    price DECIMAL(10, 2) CHECK (price > 0)  -- CHECK 约束
);
```

</details>

### 练习 3（挑战）：关系设计

设计一个电商系统，包含以下关系：
- 用户可以有多个收货地址（一对多）
- 用户可以有多个订单（一对多）
- 订单可以包含多个商品（多对多）
- 商品可以属于多个分类（多对多）

<details>
<summary>点击查看答案</summary>

```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE
);

-- 收货地址表（一对多）
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 商品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) CHECK (price > 0)
);

-- 分类表
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 商品-分类关系表（多对多）
CREATE TABLE product_categories (
    product_id INTEGER,
    category_id INTEGER,
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 订单表（一对多）
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) CHECK (total_amount > 0),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 订单商品表（多对多）
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER CHECK (quantity > 0),
    price DECIMAL(10, 2) CHECK (price > 0),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

</details>

---

## 下一章预告

下一章我们会学习 **SQL 基础语法**——掌握 SELECT、INSERT、UPDATE、DELETE 等基础操作。你会学会如何查询、插入、更新和删除数据，这是使用数据库的基本技能。
