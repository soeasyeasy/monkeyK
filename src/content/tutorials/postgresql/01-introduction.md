---
title: "第01章：PostgreSQL 简介与环境搭建"
description: "什么是 PostgreSQL，核心优势，安装配置，第一个数据库"
---

# 第01章：PostgreSQL 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- PostgreSQL 是什么？和 MySQL 有什么区别？
- 为什么要学 PostgreSQL 而不是其他数据库？
- 怎么安装和配置 PostgreSQL？
- 如何创建第一个数据库和数据表？

这一章就是为了解答这些问题。我们会先搞清楚 **PostgreSQL 的核心概念**，再动手搭建环境，最后创建第一个数据库。

---

## 1.1 为什么需要 PostgreSQL？

### 痛点分析

想象一下，你开发了一个电商网站，每天有成千上万的用户下单。如果用 Excel 来存储订单数据：

- ❌ 多人同时修改会冲突
- ❌ 数据量大时查询慢得要命
- ❌ 断电后数据可能丢失
- ❌ 无法保证订单金额和库存的一致性

这时候就需要一个**数据库管理系统**来帮你解决这些问题。

### 解决方案

PostgreSQL 就像是一个**超级智能的仓库管理员**：

- ✅ 多人可以同时访问，不会冲突
- ✅ 即使数据量很大，也能快速查询
- ✅ 自动保存数据，不怕断电
- ✅ 保证事务的完整性（要么全做，要么全不做）

> **一句话总结**：PostgreSQL 是一个功能强大、稳定可靠的开源关系型数据库，特别适合需要复杂查询和高并发场景的应用。

---

## 1.2 核心原理

### 概念解释

PostgreSQL 是一个**对象-关系型数据库管理系统（ORDBMS）**。

打个比方：

> 把数据库想象成一个**大型图书馆**：
> - **数据库（Database）** = 整个图书馆
> - **表（Table）** = 书架
> - **行（Row）** = 一本书
> - **列（Column）** = 书的属性（书名、作者、ISBN）
> - **SQL** = 你和图书管理员沟通的语言

### PostgreSQL vs MySQL 对比

| 特性 | PostgreSQL | MySQL |
| --- | --- | --- |
| 复杂查询 | 支持窗口函数、CTE、递归查询 | 支持有限 |
| 数据类型 | 支持 JSON、数组、几何类型等 | 支持基础类型 |
| 事务支持 | 完整的 ACID 支持 | 部分支持 |
| 扩展性 | 支持自定义类型、函数、索引 | 扩展性有限 |
| 并发控制 | MVCC 多版本并发控制 | 类似机制 |
| 适用场景 | 复杂业务逻辑、数据分析 | 简单 Web 应用 |

---

## 1.3 安装与配置

### Windows 安装

1. 下载 PostgreSQL 安装包
   - 访问官网：https://www.postgresql.org/download/windows/
   - 下载最新版本的安装程序

2. 运行安装程序
   - 双击安装包
   - 选择安装路径（建议默认）
   - 设置数据目录（建议默认）
   - 设置密码（**重要：记住这个密码**）
   - 设置端口（默认 5432）
   - 选择区域（Chinese, China）

3. 安装完成后，会自动安装以下组件：
   - PostgreSQL Server（数据库服务器）
   - pgAdmin 4（图形化管理工具）
   - Stack Builder（扩展工具）
   - Command Line Tools（命令行工具）

### 验证安装

打开命令行，输入：

```bash
# 检查 PostgreSQL 版本
psql --version

# 如果显示版本号，说明安装成功
# 例如：psql (PostgreSQL) 16.0
```

### 启动服务

Windows 会自动将 PostgreSQL 设置为系统服务：

```bash
# 查看服务状态
pg_ctl status -D "C:\Program Files\PostgreSQL\16\data"

# 启动服务（如果需要手动启动）
pg_ctl start -D "C:\Program Files\PostgreSQL\16\data"

# 停止服务
pg_ctl stop -D "C:\Program Files\PostgreSQL\16\data"
```

---

## 1.4 基础用法

### 连接到 PostgreSQL

安装完成后，使用 `psql` 命令行工具连接数据库：

```bash
# 连接到默认数据库（postgres）
psql -U postgres

# 输入安装时设置的密码
# 连接成功后会显示：
# psql (16.0)
# 输入 "help" 来获取帮助信息。
# postgres=#
```

### 创建第一个数据库

```sql
-- 创建一个名为 mydb 的数据库
CREATE DATABASE mydb;

-- 查看所有数据库
\l

-- 切换到 mydb 数据库
\c mydb

-- 查看当前数据库
SELECT current_database();
```

### 创建第一个数据表

```sql
-- 创建一个用户表
CREATE TABLE users (
    -- 用户ID，自增主键
    id SERIAL PRIMARY KEY,
    -- 用户名，不能为空，最大长度50
    username VARCHAR(50) NOT NULL,
    -- 邮箱，不能重复
    email VARCHAR(100) UNIQUE,
    -- 创建时间，默认为当前时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 查看表结构
\d users

-- 查看所有表
\dt
```

### 插入数据

```sql
-- 插入一条用户数据
INSERT INTO users (username, email) 
VALUES ('张三', 'zhangsan@example.com');

-- 插入多条数据
INSERT INTO users (username, email) 
VALUES 
    ('李四', 'lisi@example.com'),
    ('王五', 'wangwu@example.com');

-- 查询所有用户
SELECT * FROM users;
```

### 查询数据

```sql
-- 查询所有用户
SELECT * FROM users;

-- 查询特定字段
SELECT username, email FROM users;

-- 条件查询
SELECT * FROM users WHERE username = '张三';

-- 排序查询
SELECT * FROM users ORDER BY created_at DESC;
```

---

## 1.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| PostgreSQL | 开源的对象-关系型数据库管理系统 |
| 关系型数据库 | 使用表来组织数据，表与表之间可以建立关系 |
| SQL | 结构化查询语言，用于操作数据库 |
| psql | PostgreSQL 的命令行客户端工具 |
| pgAdmin | PostgreSQL 的图形化管理工具 |
| 默认端口 | 5432 |
| 默认用户 | postgres |

---

## 1.6 新手常见误区

### 误区 1："PostgreSQL 和 MySQL 完全一样"

**错！** 虽然都是关系型数据库，但 PostgreSQL 功能更强大：

- PostgreSQL 支持更复杂的查询（窗口函数、CTE）
- PostgreSQL 支持更多数据类型（JSON、数组、几何类型）
- PostgreSQL 扩展性更好（可以自定义类型、函数）

### 误区 2："安装后不需要设置密码"

**错！** 安装时必须设置 postgres 用户的密码，否则无法连接数据库。如果忘记了密码，需要重置。

### 误区 3："psql 命令行很难用"

不是的。psql 是专业工具，支持：
- `\l` 列出所有数据库
- `\c` 切换数据库
- `\dt` 列出所有表
- `\d` 查看表结构
- `\q` 退出

### 误区 4："数据库名可以用中文"

**错！** 数据库名、表名、列名建议使用英文，避免使用中文或特殊字符，防止跨平台兼容性问题。

---

## 1.7 动手练习

### 练习 1：基础操作

创建一个名为 `school` 的数据库，并在其中创建一个 `students` 表，包含以下字段：
- id（自增主键）
- name（姓名，不能为空）
- age（年龄）
- grade（年级）

<details>
<summary>点击查看答案</summary>

```sql
-- 创建数据库
CREATE DATABASE school;

-- 切换到 school 数据库
\c school

-- 创建学生表
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    age INTEGER,
    grade VARCHAR(20)
);

-- 验证表结构
\d students
```

</details>

### 练习 2：数据操作

在 `students` 表中插入 3 条学生数据，并查询所有年龄大于 18 岁的学生。

<details>
<summary>点击查看答案</summary>

```sql
-- 插入数据
INSERT INTO students (name, age, grade) 
VALUES 
    ('小明', 20, '大二'),
    ('小红', 19, '大一'),
    ('小刚', 22, '大四');

-- 查询年龄大于 18 岁的学生
SELECT * FROM students WHERE age > 18;
```

</details>

### 练习 3（挑战）：综合查询

查询 `students` 表中每个年级的学生人数，并按人数降序排列。

<details>
<summary>点击查看答案</summary>

```sql
-- 按年级分组统计人数，并降序排列
SELECT 
    grade AS 年级,
    COUNT(*) AS 人数
FROM students
GROUP BY grade
ORDER BY 人数 DESC;
```

</details>

---

## 下一章预告

下一章我们会学习 **数据库基础概念**——了解数据库、表、列、行、主键、外键等核心概念。你会明白如何设计一个合理的数据库结构，为后续的 SQL 学习打下坚实基础。
