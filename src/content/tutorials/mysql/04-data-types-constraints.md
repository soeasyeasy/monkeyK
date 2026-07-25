---
title: "第4章：数据类型与约束"
description: "数值、字符串、日期类型，NOT NULL、UNIQUE、DEFAULT"
---

# 第4章：数据类型与约束

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么创建表时要指定数据类型？不指定行不行？
- INT 和 DECIMAL 有什么区别？什么时候用哪个？
- CHAR 和 VARCHAR 都是存字符串，该选哪个？
- 什么是约束？为什么需要 NOT NULL、UNIQUE 这些限制？

这一章就是为了解答这些问题。我们会搞清楚 **MySQL 的常用数据类型**，再学会用 **约束** 来保证数据的正确性。学完这章，你就能设计出合理的数据库表结构了。

---

## 4.1 为什么需要数据类型和约束？

### 痛点分析

想象你要设计一个学生信息表，如果没有数据类型和约束：

- 年龄字段可能存成"二十"而不是 20，导致无法计算平均年龄
- 邮箱字段可能存成"abc"，根本不是一个有效的邮箱地址
- 学号字段可能重复，两个学生用同一个学号
- 性别字段可能存"男"、"男性"、"M"各种写法，数据混乱

### 解决方案

数据类型和约束就像**表格的模板**：

> 你去银行开户，表格会明确规定：姓名必须是汉字、身份证号必须是 18 位、手机号必须是 11 位数字。这些规定就是"数据类型"和"约束"，确保你填写的信息是正确且规范的。

### 对比一下

| 没有规范 | 有数据类型和约束 |
|---------|----------------|
| 年龄可以存"二十" | 年龄只能是整数 |
| 邮箱可以存任意内容 | 邮箱必须符合格式 |
| 学号可以重复 | 学号必须唯一 |
| 性别写法混乱 | 性别只能是"男"或"女" |

> **一句话总结**：数据类型规定"这列应该存什么类型的数据"，约束规定"这列的数据必须满足什么条件"。

---

## 4.2 数值类型

MySQL 提供了多种数值类型，根据需求选择合适的类型。

### 整数类型

| 类型 | 占用空间 | 取值范围 | 使用场景 |
|-----|---------|---------|---------|
| TINYINT | 1 字节 | -128 到 127 | 年龄、状态标志 |
| SMALLINT | 2 字节 | -32768 到 32767 | 较小的整数 |
| MEDIUMINT | 3 字节 | -8388608 到 8388607 | 中等大小整数 |
| INT | 4 字节 | -21亿 到 21亿 | 学号、ID、一般整数 |
| BIGINT | 8 字节 | 非常大的整数 | 订单号、时间戳 |

### 小数值类型

| 类型 | 占用空间 | 精度 | 使用场景 |
|-----|---------|------|---------|
| FLOAT | 4 字节 | 单精度，约 7 位有效数字 | 科学计算（精度要求不高） |
| DOUBLE | 8 字节 | 双精度，约 15 位有效数字 | 科学计算（精度要求较高） |
| DECIMAL(M,D) | 可变 | 精确值 | 金额、价格（必须精确） |

### 示例代码

```sql
-- 创建包含各种数值类型的表
CREATE TABLE products (
    id INT PRIMARY KEY,              -- 商品ID，用 INT 类型
    name VARCHAR(50),                -- 商品名称
    stock SMALLINT,                  -- 库存数量，用 SMALLINT 够用
    price DECIMAL(10, 2),            -- 价格，用 DECIMAL 保证精确
    weight FLOAT,                    -- 重量，用 FLOAT 即可
    rating DOUBLE                    -- 评分，用 DOUBLE 更精确
);

-- 插入数据示例
INSERT INTO products (id, name, stock, price, weight, rating)
VALUES (1, '笔记本电脑', 100, 5999.00, 2.5, 4.8);
-- DECIMAL(10,2) 表示总共 10 位，其中 2 位小数
-- 5999.00 符合这个格式

-- 错误示范：价格用 FLOAT 会导致精度问题
-- CREATE TABLE bad_products (
--     price FLOAT  -- 可能出现 5999.0000001 这样的精度问题
-- );
```

> **原理**：DECIMAL 是精确存储，适合金额；FLOAT 和 DOUBLE 是近似存储，适合科学计算。

---

## 4.3 字符串类型

### 常用字符串类型

| 类型 | 最大长度 | 特点 | 使用场景 |
|-----|---------|------|---------|
| CHAR(n) | 255 字符 | 固定长度，不足补空格 | 身份证号、手机号（固定长度） |
| VARCHAR(n) | 65535 字符 | 可变长度，节省空间 | 姓名、地址（长度不固定） |
| TINYTEXT | 255 字符 | 小文本 | 短文本内容 |
| TEXT | 65535 字符 | 普通文本 | 文章正文、评论内容 |
| MEDIUMTEXT | 16MB | 中等文本 | 长文章 |
| LONGTEXT | 4GB | 大文本 | 书籍、超长文档 |

### 示例代码

```sql
-- 创建包含字符串类型的表
CREATE TABLE users (
    id INT PRIMARY KEY,
    phone CHAR(11),           -- 手机号固定 11 位，用 CHAR
    id_card CHAR(18),         -- 身份证号固定 18 位，用 CHAR
    name VARCHAR(20),         -- 姓名长度不固定，用 VARCHAR
    email VARCHAR(50),        -- 邮箱长度不固定，用 VARCHAR
    address VARCHAR(200),     -- 地址长度不固定，用 VARCHAR
    bio TEXT                  -- 个人简介可能很长，用 TEXT
);

-- 插入数据示例
INSERT INTO users (id, phone, id_card, name, email, address, bio)
VALUES (
    1,
    '13800138000',           -- CHAR(11) 固定 11 位
    '110101199001011234',    -- CHAR(18) 固定 18 位
    '张三',                  -- VARCHAR(20) 可变长度
    'zhangsan@example.com',  -- VARCHAR(50) 可变长度
    '北京市朝阳区某某街道',    -- VARCHAR(200) 可变长度
    '这是一个热爱编程的开发者'  -- TEXT 可以存储较长文本
);
```

### CHAR 和 VARCHAR 的区别

| 特性 | CHAR | VARCHAR |
|-----|------|---------|
| 长度 | 固定 | 可变 |
| 存储空间 | 固定占用 n 字节 | 只占用实际长度 + 1-2 字节 |
| 速度 | 快（固定长度易处理） | 稍慢（需要计算长度） |
| 适用场景 | 固定长度的数据 | 长度变化较大的数据 |

> **选择建议**：如果数据长度固定（如手机号、身份证号），用 CHAR；如果长度变化大（如姓名、地址），用 VARCHAR。

---

## 4.4 日期时间类型

### 常用日期时间类型

| 类型 | 格式 | 占用空间 | 取值范围 | 使用场景 |
|-----|------|---------|---------|---------|
| DATE | YYYY-MM-DD | 3 字节 | 1000-01-01 到 9999-12-31 | 生日、入职日期 |
| TIME | HH:MM:SS | 3 字节 | -838:59:59 到 838:59:59 | 营业时间、课程时间 |
| DATETIME | YYYY-MM-DD HH:MM:SS | 8 字节 | 1000-01-01 到 9999-12-31 | 创建时间、更新时间 |
| TIMESTAMP | YYYY-MM-DD HH:MM:SS | 4 字节 | 1970-01-01 到 2038-01-19 | 时间戳、自动记录时间 |
| YEAR | YYYY | 1 字节 | 1901 到 2155 | 出生年份、毕业年份 |

### 示例代码

```sql
-- 创建包含日期时间类型的表
CREATE TABLE events (
    id INT PRIMARY KEY,
    event_name VARCHAR(50),
    event_date DATE,              -- 活动日期，只需要日期
    start_time TIME,              -- 开始时间，只需要时间
    create_time DATETIME,         -- 创建时间，需要日期和时间
    update_time TIMESTAMP         -- 更新时间，自动记录
);

-- 插入数据示例
INSERT INTO events (id, event_name, event_date, start_time, create_time)
VALUES (
    1,
    'MySQL 讲座',
    '2026-08-15',                -- DATE 格式：YYYY-MM-DD
    '14:30:00',                  -- TIME 格式：HH:MM:SS
    '2026-07-25 10:00:00'        -- DATETIME 格式：YYYY-MM-DD HH:MM:SS
);

-- TIMESTAMP 可以自动更新
CREATE TABLE articles (
    id INT PRIMARY KEY,
    title VARCHAR(100),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 插入时自动记录当前时间
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    -- 更新时自动记录当前时间
);
```

> **原理**：TIMESTAMP 会自动转换为当前时区的时间，而 DATETIME 不会。TIMESTAMP 范围较小但节省空间。

---

## 4.5 约束：保证数据正确性

约束是对数据的限制条件，确保数据符合业务规则。

### 常用约束

| 约束 | 作用 | 使用场景 |
|-----|------|---------|
| NOT NULL | 不能为空 | 姓名、密码等必填字段 |
| UNIQUE | 必须唯一 | 学号、邮箱、手机号 |
| DEFAULT | 默认值 | 创建时间、状态标志 |
| CHECK | 满足条件 | 年龄 > 0、性别只能是"男"或"女" |
| PRIMARY KEY | 主键（唯一 + 非空） | 学号、商品ID |
| FOREIGN KEY | 外键（关联其他表） | 学生表中的班级ID |

### 示例代码

```sql
-- 创建包含各种约束的表
CREATE TABLE students (
    id INT PRIMARY KEY,                    -- 主键：唯一且不能为空
    student_no VARCHAR(20) UNIQUE,         -- 学号：必须唯一
    name VARCHAR(20) NOT NULL,             -- 姓名：不能为空
    age INT CHECK (age >= 15 AND age <= 50), -- 年龄：必须在 15-50 之间
    gender CHAR(1) CHECK (gender IN ('男', '女')), -- 性别：只能是"男"或"女"
    email VARCHAR(50) UNIQUE,              -- 邮箱：必须唯一
    class_id INT,                          -- 班级ID
    status VARCHAR(10) DEFAULT '在读',      -- 状态：默认值为"在读"
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间：默认为当前时间
    FOREIGN KEY (class_id) REFERENCES classes(id)   -- 外键：关联 classes 表
);

-- 插入数据示例
INSERT INTO students (id, student_no, name, age, gender, email, class_id)
VALUES (1, '2026001', '张三', 20, '男', 'zhangsan@example.com', 1);
-- 所有约束都会生效

-- 错误示范 1：姓名为空
-- INSERT INTO students (id, student_no, age, gender, email)
-- VALUES (2, '2026002', 21, '男', 'lisi@example.com');
-- 报错：name 列不能为空

-- 错误示范 2：学号重复
-- INSERT INTO students (id, student_no, name, age, gender, email)
-- VALUES (2, '2026001', '李四', 21, '男', 'lisi@example.com');
-- 报错：student_no 必须唯一

-- 错误示范 3：年龄不符合条件
-- INSERT INTO students (id, student_no, name, age, gender, email)
-- VALUES (3, '2026003', '王五', 10, '男', 'wangwu@example.com');
-- 报错：age 必须在 15-50 之间
```

### 约束详解

#### NOT NULL 约束

```sql
-- 创建表时指定 NOT NULL
CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(20) NOT NULL  -- 用户名不能为空
);

-- 修改已有表，添加 NOT NULL 约束
ALTER TABLE users MODIFY email VARCHAR(50) NOT NULL;
```

#### UNIQUE 约束

```sql
-- 创建表时指定 UNIQUE
CREATE TABLE users (
    id INT PRIMARY KEY,
    email VARCHAR(50) UNIQUE  -- 邮箱必须唯一
);

-- 创建表时指定多个 UNIQUE
CREATE TABLE users (
    id INT PRIMARY KEY,
    phone VARCHAR(11) UNIQUE,
    email VARCHAR(50) UNIQUE
);
```

#### DEFAULT 约束

```sql
-- 创建表时指定默认值
CREATE TABLE articles (
    id INT PRIMARY KEY,
    title VARCHAR(100),
    status VARCHAR(10) DEFAULT '草稿',  -- 默认状态为"草稿"
    view_count INT DEFAULT 0            -- 默认阅读数为 0
);

-- 插入时不提供默认值列，会自动使用默认值
INSERT INTO articles (id, title) VALUES (1, 'MySQL 入门');
-- status 自动为 '草稿'，view_count 自动为 0
```

#### CHECK 约束

```sql
-- 创建表时指定 CHECK 约束
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    price DECIMAL(10, 2) CHECK (price > 0),  -- 价格必须大于 0
    stock INT CHECK (stock >= 0)             -- 库存不能为负数
);

-- 插入不符合条件的数据会报错
-- INSERT INTO products (id, name, price, stock) VALUES (1, '商品A', -10, 100);
-- 报错：price 必须大于 0
```

#### PRIMARY KEY 主键

```sql
-- 单列主键
CREATE TABLE students (
    id INT PRIMARY KEY,  -- id 是主键
    name VARCHAR(20)
);

-- 多列主键（复合主键）
CREATE TABLE course_selection (
    student_id INT,
    course_id INT,
    score INT,
    PRIMARY KEY (student_id, course_id)  -- 学生ID和课程ID组合作为主键
);
```

#### FOREIGN KEY 外键

```sql
-- 创建班级表
CREATE TABLE classes (
    id INT PRIMARY KEY,
    class_name VARCHAR(20)
);

-- 创建学生表，添加外键约束
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(20),
    class_id INT,
    FOREIGN KEY (class_id) REFERENCES classes(id)
    -- class_id 必须是 classes 表中已存在的 id
);

-- 插入班级数据
INSERT INTO classes (id, class_name) VALUES (1, '计算机1班');

-- 插入学生数据，class_id 必须是已存在的班级
INSERT INTO students (id, name, class_id) VALUES (1, '张三', 1);

-- 错误示范：插入不存在的班级ID
-- INSERT INTO students (id, name, class_id) VALUES (2, '李四', 999);
-- 报错：class_id 999 在 classes 表中不存在
```

---

## 4.6 核心知识点总结

| 数据类型 | 用途 | 示例 |
|---------|------|------|
| INT | 整数 | 学号、ID |
| DECIMAL | 精确小数 | 价格、金额 |
| CHAR | 固定长度字符串 | 手机号、身份证号 |
| VARCHAR | 可变长度字符串 | 姓名、地址 |
| DATE | 日期 | 生日、入职日期 |
| DATETIME | 日期时间 | 创建时间 |

| 约束 | 作用 | 示例 |
|-----|------|------|
| NOT NULL | 不能为空 | 姓名必填 |
| UNIQUE | 必须唯一 | 学号、邮箱 |
| DEFAULT | 默认值 | 状态默认为"在读" |
| CHECK | 满足条件 | 年龄 15-50 |
| PRIMARY KEY | 主键 | 学号、商品ID |
| FOREIGN KEY | 外键 | 班级ID关联班级表 |

---

## 4.7 新手常见误区

### 误区 1："所有字符串都用 VARCHAR 就行"

不对。如果数据长度固定（如手机号、身份证号），应该用 CHAR，性能更好。

```sql
-- 不推荐：手机号用 VARCHAR
CREATE TABLE users (
    phone VARCHAR(11)  -- 浪费空间，性能稍差
);

-- 推荐：手机号用 CHAR
CREATE TABLE users (
    phone CHAR(11)  -- 固定长度，性能更好
);
```

### 误区 2："金额用 FLOAT 存储没问题"

错！FLOAT 是近似存储，会出现精度问题。

```sql
-- 错误：用 FLOAT 存储金额
CREATE TABLE products (
    price FLOAT  -- 可能出现 5999.0000001 这样的精度问题
);

-- 正确：用 DECIMAL 存储金额
CREATE TABLE products (
    price DECIMAL(10, 2)  -- 精确存储，不会丢失精度
);
```

### 误区 3："约束太多会影响性能，尽量少用"

不是的。约束是为了保证数据正确性，必要的约束不能省略。

```sql
-- 不推荐：为了性能省略约束
CREATE TABLE students (
    id INT,
    name VARCHAR(20),
    age INT
    -- 没有主键、没有约束，数据可能混乱
);

-- 推荐：必要的约束不能省
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    age INT CHECK (age > 0)
);
```

### 误区 4："TIMESTAMP 和 DATETIME 完全一样"

不一样。TIMESTAMP 会自动转换为当前时区，且范围较小（到 2038 年）；DATETIME 不会转换时区，范围更大。

```sql
-- TIMESTAMP：自动转换时区，范围到 2038 年
CREATE TABLE logs (
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DATETIME：不转换时区，范围到 9999 年
CREATE TABLE events (
    event_time DATETIME
);
```

---

## 4.8 动手练习

### 练习 1：基础数据类型

创建一个 `employees` 表，包含以下字段：
- id：整数，主键
- name：字符串，不能为空
- age：整数，必须在 18-65 之间
- salary：精确小数，不能为负
- hire_date：日期
- email：字符串，必须唯一

<details>
<summary>点击查看答案</summary>

```sql
CREATE TABLE employees (
    id INT PRIMARY KEY,                          -- 员工ID，主键
    name VARCHAR(20) NOT NULL,                   -- 姓名，不能为空
    age INT CHECK (age >= 18 AND age <= 65),     -- 年龄，18-65 之间
    salary DECIMAL(10, 2) CHECK (salary >= 0),   -- 薪资，不能为负
    hire_date DATE,                              -- 入职日期
    email VARCHAR(50) UNIQUE                     -- 邮箱，必须唯一
);

-- 插入测试数据
INSERT INTO employees (id, name, age, salary, hire_date, email)
VALUES (1, '张三', 28, 15000.00, '2024-03-15', 'zhangsan@example.com');
```

</details>

### 练习 2：约束应用

创建一个 `orders` 表，包含以下约束：
- 订单ID：主键
- 用户ID：外键，关联 users 表
- 订单金额：必须大于 0
- 订单状态：只能是"待支付"、"已支付"、"已发货"、"已完成"
- 创建时间：默认为当前时间

<details>
<summary>点击查看答案</summary>

```sql
-- 先创建用户表
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(20)
);

-- 创建订单表
CREATE TABLE orders (
    id INT PRIMARY KEY,                                              -- 订单ID，主键
    user_id INT,                                                     -- 用户ID
    amount DECIMAL(10, 2) CHECK (amount > 0),                        -- 金额，必须大于 0
    status VARCHAR(10) CHECK (status IN ('待支付', '已支付', '已发货', '已完成')), -- 状态限制
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                 -- 创建时间，默认当前时间
    FOREIGN KEY (user_id) REFERENCES users(id)                       -- 外键关联用户表
);

-- 插入测试数据
INSERT INTO users (id, name) VALUES (1, '张三');
INSERT INTO orders (id, user_id, amount, status) 
VALUES (1, 1, 299.00, '待支付');
```

</details>

### 练习 3（挑战）：综合设计

设计一个图书管理系统的数据库表结构，包含：
1. 图书表（books）：包含书名、作者、ISBN（唯一）、价格、库存数量、出版日期
2. 读者表（readers）：包含姓名、手机号（唯一）、注册日期
3. 借阅记录表（borrow_records）：记录谁借了哪本书、借出日期、归还日期

要求：
- 所有必填字段都要有 NOT NULL 约束
- 价格和库存要有 CHECK 约束
- 借阅记录要关联图书表和读者表

<details>
<summary>点击查看答案</summary>

```sql
-- 图书表
CREATE TABLE books (
    id INT PRIMARY KEY,                              -- 图书ID，主键
    title VARCHAR(100) NOT NULL,                     -- 书名，必填
    author VARCHAR(50) NOT NULL,                     -- 作者，必填
    isbn VARCHAR(13) UNIQUE NOT NULL,                -- ISBN，唯一且必填
    price DECIMAL(10, 2) CHECK (price > 0),          -- 价格，必须大于 0
    stock INT CHECK (stock >= 0) DEFAULT 0,          -- 库存，不能为负，默认 0
    publish_date DATE                                -- 出版日期
);

-- 读者表
CREATE TABLE readers (
    id INT PRIMARY KEY,                              -- 读者ID，主键
    name VARCHAR(20) NOT NULL,                       -- 姓名，必填
    phone CHAR(11) UNIQUE NOT NULL,                  -- 手机号，唯一且必填
    register_date DATE DEFAULT (CURRENT_DATE)        -- 注册日期，默认今天
);

-- 借阅记录表
CREATE TABLE borrow_records (
    id INT PRIMARY KEY,                              -- 记录ID，主键
    book_id INT NOT NULL,                            -- 图书ID，必填
    reader_id INT NOT NULL,                          -- 读者ID，必填
    borrow_date DATE NOT NULL,                       -- 借出日期，必填
    return_date DATE,                                -- 归还日期，可以为空（未归还）
    FOREIGN KEY (book_id) REFERENCES books(id),      -- 外键关联图书表
    FOREIGN KEY (reader_id) REFERENCES readers(id)   -- 外键关联读者表
);

-- 插入测试数据
INSERT INTO books (id, title, author, isbn, price, stock, publish_date)
VALUES (1, 'MySQL 入门', '张三', '9787111213826', 59.00, 10, '2023-01-15');

INSERT INTO readers (id, name, phone)
VALUES (1, '李四', '13800138000');

INSERT INTO borrow_records (id, book_id, reader_id, borrow_date)
VALUES (1, 1, 1, '2026-07-20');
```

</details>

---

## 下一章预告

下一章我们会学习 **条件查询与排序**——也就是如何用 WHERE 子句进行更复杂的条件筛选，如何用 ORDER BY 对结果排序，如何用 LIMIT 实现分页查询。你还会学到 COUNT、SUM、AVG 等聚合函数的使用。这些知识能让你从数据库中精确地找到需要的数据。
