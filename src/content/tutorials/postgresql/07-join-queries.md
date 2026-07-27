---
title: "第07章：连接查询"
description: "INNER JOIN、LEFT JOIN、RIGHT JOIN、FULL JOIN、自连接"
---

# 第07章：连接查询

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是连接查询？为什么需要连接？
- INNER JOIN 和 LEFT JOIN 有什么区别？
- 如何从多个表中查询数据？
- 什么是自连接？如何使用？
- 连接查询的性能如何优化？

这一章就是为了解答这些问题。我们会先搞清楚 **连接查询的基本概念**，再学习**各种连接类型**，最后掌握**自连接和连接优化**。

---

## 7.1 为什么需要连接查询？

### 痛点分析

想象一下，你有一个电商系统，包含用户表和订单表。如果想查询"每个用户的订单信息"：

```sql
-- ❌ 低效的方式：分别查询，在程序中组合
SELECT * FROM users WHERE id = 1;
SELECT * FROM orders WHERE user_id = 1;
-- 然后在程序中组合结果
```

问题：
- ❌ 需要多次查询数据库
- ❌ 程序逻辑复杂
- ❌ 效率低

### 解决方案

使用连接查询：

```sql
-- ✅ 高效的方式：一条 SQL 搞定
SELECT 
    u.username,
    o.order_id,
    o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
```

优势：
- ✅ 一条 SQL 语句完成
- ✅ 数据库引擎优化
- ✅ 代码简洁

> **一句话总结**：连接查询可以从多个表中同时查询数据，是关系型数据库的核心功能。

---

## 7.2 核心原理

### 概念解释

**连接（JOIN）**

连接是将两个或多个表根据相关列组合在一起的操作。

打个比方：

> 连接就像是**拼图**：
> - 每个表是一块拼图
> - 连接条件是将拼图拼在一起的规则
> - 结果是完整的拼图

**连接类型**

| 连接类型 | 说明 | 结果 |
| --- | --- | --- |
| INNER JOIN | 内连接，只返回匹配的行 | A ∩ B |
| LEFT JOIN | 左连接，返回左表所有行，右表不匹配则为 NULL | A + A ∩ B |
| RIGHT JOIN | 右连接，返回右表所有行，左表不匹配则为 NULL | B + A ∩ B |
| FULL JOIN | 全连接，返回两个表的所有行 | A ∪ B |
| CROSS JOIN | 交叉连接，返回笛卡尔积 | A × B |

---

## 7.3 基础用法

### 准备工作

创建示例表：

```sql
-- 创建部门表
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 创建员工表
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department_id INTEGER,
    salary DECIMAL(10, 2),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 插入部门数据
INSERT INTO departments (name) VALUES 
    ('技术部'),
    ('市场部'),
    ('销售部');

-- 插入员工数据
INSERT INTO employees (name, department_id, salary) VALUES 
    ('张三', 1, 15000),
    ('李四', 1, 18000),
    ('王五', 2, 12000),
    ('赵六', 3, 20000),
    ('孙七', NULL, 13000);  -- 孙七没有分配部门
```

### INNER JOIN（内连接）

INNER JOIN 只返回两个表中匹配的行。

```sql
-- 查询每个员工及其部门信息
SELECT 
    e.name AS employee_name,
    d.name AS department_name,
    e.salary
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- 结果：
-- employee_name | department_name | salary
-- 张三          | 技术部          | 15000
-- 李四          | 技术部          | 18000
-- 王五          | 市场部          | 12000
-- 赵六          | 销售部          | 20000
-- 注意：孙七没有部门，所以不会出现在结果中
```

### LEFT JOIN（左连接）

LEFT JOIN 返回左表所有行，右表不匹配则为 NULL。

```sql
-- 查询所有员工及其部门信息（包括没有部门的员工）
SELECT 
    e.name AS employee_name,
    d.name AS department_name,
    e.salary
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- 结果：
-- employee_name | department_name | salary
-- 张三          | 技术部          | 15000
-- 李四          | 技术部          | 18000
-- 王五          | 市场部          | 12000
-- 赵六          | 销售部          | 20000
-- 孙七          | NULL            | 13000  -- 孙七没有部门
```

### RIGHT JOIN（右连接）

RIGHT JOIN 返回右表所有行，左表不匹配则为 NULL。

```sql
-- 查询所有部门及其员工信息（包括没有员工的部门）
-- 先添加一个没有员工的部门
INSERT INTO departments (name) VALUES ('人事部');

SELECT 
    e.name AS employee_name,
    d.name AS department_name,
    e.salary
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;

-- 结果：
-- employee_name | department_name | salary
-- 张三          | 技术部          | 15000
-- 李四          | 技术部          | 18000
-- 王五          | 市场部          | 12000
-- 赵六          | 销售部          | 20000
-- NULL          | 人事部          | NULL  -- 人事部没有员工
```

### FULL JOIN（全连接）

FULL JOIN 返回两个表的所有行。

```sql
-- 查询所有员工和所有部门
SELECT 
    e.name AS employee_name,
    d.name AS department_name,
    e.salary
FROM employees e
FULL JOIN departments d ON e.department_id = d.id;

-- 结果：
-- employee_name | department_name | salary
-- 张三          | 技术部          | 15000
-- 李四          | 技术部          | 18000
-- 王五          | 市场部          | 12000
-- 赵六          | 销售部          | 20000
-- 孙七          | NULL            | 13000  -- 没有部门的员工
-- NULL          | 人事部          | NULL   -- 没有员工的部门
```

### CROSS JOIN（交叉连接）

CROSS JOIN 返回笛卡尔积。

```sql
-- 查询所有员工和所有部门的组合
SELECT 
    e.name AS employee_name,
    d.name AS department_name
FROM employees e
CROSS JOIN departments d;

-- 结果：5 个员工 × 4 个部门 = 20 行
```

---

## 7.4 进阶用法

### 多表连接

```sql
-- 创建项目表
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INTEGER,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 插入项目数据
INSERT INTO projects (name, department_id) VALUES 
    ('项目A', 1),
    ('项目B', 1),
    ('项目C', 2);

-- 查询员工、部门、项目信息
SELECT 
    e.name AS employee_name,
    d.name AS department_name,
    p.name AS project_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
INNER JOIN projects p ON p.department_id = d.id;
```

### 自连接

自连接是表与自己连接。

```sql
-- 创建员工表（添加经理字段）
CREATE TABLE employees_with_manager (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    manager_id INTEGER,
    FOREIGN KEY (manager_id) REFERENCES employees_with_manager(id)
);

-- 插入数据
INSERT INTO employees_with_manager (name, manager_id) VALUES 
    ('老板', NULL),
    ('张三', 1),
    ('李四', 1),
    ('王五', 2),
    ('赵六', 2);

-- 查询每个员工及其经理
SELECT 
    e.name AS employee_name,
    m.name AS manager_name
FROM employees_with_manager e
LEFT JOIN employees_with_manager m ON e.manager_id = m.id;

-- 结果：
-- employee_name | manager_name
-- 老板          | NULL
-- 张三          | 老板
-- 李四          | 老板
-- 王五          | 张三
-- 赵六          | 张三
```

### 连接中使用聚合函数

```sql
-- 查询每个部门的员工数量和平均薪资
SELECT 
    d.name AS department_name,
    COUNT(e.id) AS employee_count,
    AVG(e.salary) AS avg_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.name;
```

### 连接中使用子查询

```sql
-- 查询薪资高于部门平均薪资的员工
SELECT 
    e.name,
    e.salary,
    d.name AS department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
WHERE e.salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE department_id = e.department_id
);
```

---

## 7.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| INNER JOIN | 内连接，只返回匹配的行 |
| LEFT JOIN | 左连接，返回左表所有行 |
| RIGHT JOIN | 右连接，返回右表所有行 |
| FULL JOIN | 全连接，返回两个表所有行 |
| CROSS JOIN | 交叉连接，返回笛卡尔积 |
| 自连接 | 表与自己连接 |
| 多表连接 | 连接多个表 |

---

## 7.6 新手常见误区

### 误区 1："LEFT JOIN 和 RIGHT JOIN 可以互换"

**错！** LEFT JOIN 和 RIGHT JOIN 的结果不同。

```sql
-- LEFT JOIN：返回左表所有行
SELECT * FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- RIGHT JOIN：返回右表所有行
SELECT * FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;
```

### 误区 2："连接条件只能用 ="

**错！** 连接条件可以使用任何比较运算符。

```sql
-- 使用 > 连接
SELECT * FROM employees e
INNER JOIN departments d ON e.department_id > d.id;

-- 使用 BETWEEN 连接
SELECT * FROM employees e
INNER JOIN departments d ON e.department_id BETWEEN d.id AND d.id + 1;
```

### 误区 3："INNER JOIN 和 JOIN 不一样"

不是的。在 PostgreSQL 中，JOIN 默认就是 INNER JOIN。

```sql
-- 两种写法等价
SELECT * FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

SELECT * FROM employees e
JOIN departments d ON e.department_id = d.id;
```

### 误区 4："连接查询性能一定差"

**错！** 如果正确使用索引，连接查询性能可以很好。

建议：
- ✅ 在连接列上创建索引
- ✅ 使用 EXPLAIN 分析查询计划
- ✅ 避免连接太多表（一般不超过 5 个）

---

## 7.7 动手练习

### 练习 1：基础连接

使用 `employees` 和 `departments` 表，查询：
- 每个员工及其部门信息（使用 INNER JOIN）
- 所有员工及其部门信息（使用 LEFT JOIN）
- 所有部门及其员工信息（使用 RIGHT JOIN）

<details>
<summary>点击查看答案</summary>

```sql
-- 查询每个员工及其部门信息（INNER JOIN）
SELECT 
    e.name AS employee_name,
    d.name AS department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- 查询所有员工及其部门信息（LEFT JOIN）
SELECT 
    e.name AS employee_name,
    d.name AS department_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- 查询所有部门及其员工信息（RIGHT JOIN）
SELECT 
    e.name AS employee_name,
    d.name AS department_name
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;
```

</details>

### 练习 2：多表连接

创建 `projects` 表，查询：
- 每个员工参与的项目
- 每个部门的项目数量
- 没有项目的部门

<details>
<summary>点击查看答案</summary>

```sql
-- 创建项目表
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INTEGER,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 插入数据
INSERT INTO projects (name, department_id) VALUES 
    ('项目A', 1),
    ('项目B', 1),
    ('项目C', 2);

-- 查询每个员工参与的项目
SELECT 
    e.name AS employee_name,
    p.name AS project_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
INNER JOIN projects p ON p.department_id = d.id;

-- 查询每个部门的项目数量
SELECT 
    d.name AS department_name,
    COUNT(p.id) AS project_count
FROM departments d
LEFT JOIN projects p ON d.id = p.department_id
GROUP BY d.name;

-- 查询没有项目的部门
SELECT 
    d.name AS department_name
FROM departments d
LEFT JOIN projects p ON d.id = p.department_id
WHERE p.id IS NULL;
```

</details>

### 练习 3（挑战）：自连接

使用 `employees_with_manager` 表，查询：
- 每个员工及其经理
- 每个经理管理的员工数量
- 没有下属的员工

<details>
<summary>点击查看答案</summary>

```sql
-- 创建员工表（添加经理字段）
CREATE TABLE employees_with_manager (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    manager_id INTEGER,
    FOREIGN KEY (manager_id) REFERENCES employees_with_manager(id)
);

-- 插入数据
INSERT INTO employees_with_manager (name, manager_id) VALUES 
    ('老板', NULL),
    ('张三', 1),
    ('李四', 1),
    ('王五', 2),
    ('赵六', 2);

-- 查询每个员工及其经理
SELECT 
    e.name AS employee_name,
    m.name AS manager_name
FROM employees_with_manager e
LEFT JOIN employees_with_manager m ON e.manager_id = m.id;

-- 查询每个经理管理的员工数量
SELECT 
    m.name AS manager_name,
    COUNT(e.id) AS employee_count
FROM employees_with_manager e
LEFT JOIN employees_with_manager m ON e.manager_id = m.id
WHERE m.id IS NOT NULL
GROUP BY m.name;

-- 查询没有下属的员工
SELECT 
    e.name AS employee_name
FROM employees_with_manager e
LEFT JOIN employees_with_manager sub ON sub.manager_id = e.id
WHERE sub.id IS NULL;
```

</details>

---

## 下一章预告

下一章我们会学习 **子查询与嵌套**——掌握标量子查询、列子查询、行子查询、相关子查询的用法，了解如何将一个查询嵌套在另一个查询中。
