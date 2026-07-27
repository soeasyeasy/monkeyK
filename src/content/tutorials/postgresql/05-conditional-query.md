---
title: "第05章：条件查询与排序"
description: "WHERE、ORDER BY、LIMIT、聚合函数"
---

# 第05章：条件查询与排序

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何使用 WHERE 子句过滤数据？
- 有哪些比较运算符和逻辑运算符？
- 如何对查询结果进行排序？
- 如何使用 LIMIT 限制结果数量？
- 聚合函数有哪些？如何使用？

这一章就是为了解答这些问题。我们会先搞清楚 **WHERE 子句的各种用法**，再学习**排序和限制结果数量**，最后掌握**聚合函数**。

---

## 5.1 为什么需要条件查询？

### 痛点分析

想象一下，你有一个包含 10000 条用户数据的表。如果想找"北京地区年龄大于 25 岁的男性用户"：

```sql
-- ❌ 低效的方式：把所有数据查出来，在程序中过滤
SELECT * FROM users;
-- 然后在程序中过滤：city = '北京' AND age > 25 AND gender = 'male'
```

问题：
- ❌ 传输大量无用数据，浪费带宽
- ❌ 程序处理慢，效率低
- ❌ 数据库的优化能力没有利用

### 解决方案

使用 WHERE 子句直接在数据库中过滤：

```sql
-- ✅ 高效的方式：在数据库层面过滤
SELECT * FROM users 
WHERE city = '北京' AND age > 25 AND gender = 'male';
```

优势：
- ✅ 只传输需要的数据
- ✅ 数据库引擎优化过，速度快
- ✅ 语法简洁，易于理解

> **一句话总结**：条件查询可以精确地筛选出需要的数据，提高查询效率。

---

## 5.2 核心原理

### 概念解释

**WHERE 子句**

WHERE 子句用于过滤记录，只返回满足条件的行。

打个比方：

> WHERE 子句就像是一个**筛子**：
> - 你把所有数据倒进筛子
> - 筛子只让符合条件的数据通过
> - 不符合条件的数据被过滤掉

**执行顺序**

SQL 查询的执行顺序：

1. FROM：确定数据源
2. WHERE：过滤行
3. GROUP BY：分组
4. HAVING：过滤分组
5. SELECT：选择列
6. ORDER BY：排序
7. LIMIT：限制结果数量

---

## 5.3 基础用法

### 准备工作

先创建一个示例表并插入数据：

```sql
-- 创建员工表
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    age INTEGER,
    city VARCHAR(50),
    department VARCHAR(50),
    salary DECIMAL(10, 2),
    hire_date DATE
);

-- 插入示例数据
INSERT INTO employees (name, age, city, department, salary, hire_date) VALUES
    ('张三', 28, '北京', '技术部', 15000, '2020-03-15'),
    ('李四', 32, '上海', '市场部', 18000, '2019-07-20'),
    ('王五', 25, '北京', '技术部', 12000, '2021-01-10'),
    ('赵六', 35, '广州', '销售部', 20000, '2018-05-08'),
    ('孙七', 30, '深圳', '技术部', 22000, '2017-11-25'),
    ('周八', 27, '北京', '市场部', 13000, '2021-06-01'),
    ('吴九', 33, '上海', '技术部', 19000, '2019-09-15'),
    ('郑十', 29, '广州', '销售部', 16000, '2020-08-20');
```

### 比较运算符

| 运算符 | 说明 | 示例 |
| --- | --- | --- |
| = | 等于 | `city = '北京'` |
| <> 或 != | 不等于 | `city <> '北京'` |
| > | 大于 | `age > 30` |
| < | 小于 | `age < 30` |
| >= | 大于等于 | `age >= 30` |
| <= | 小于等于 | `age <= 30` |

```sql
-- 查询北京的所有员工
SELECT * FROM employees WHERE city = '北京';

-- 查询年龄大于 30 的员工
SELECT * FROM employees WHERE age > 30;

-- 查询薪资不等于 15000 的员工
SELECT * FROM employees WHERE salary <> 15000;
```

### 逻辑运算符

**AND 运算符**

AND 运算符要求所有条件都满足。

```sql
-- 查询北京且年龄大于 25 的员工
SELECT * FROM employees 
WHERE city = '北京' AND age > 25;

-- 查询技术部且薪资大于 15000 的员工
SELECT * FROM employees 
WHERE department = '技术部' AND salary > 15000;
```

**OR 运算符**

OR 运算符要求至少一个条件满足。

```sql
-- 查询北京或上海的员工
SELECT * FROM employees 
WHERE city = '北京' OR city = '上海';

-- 查询技术部或市场部的员工
SELECT * FROM employees 
WHERE department = '技术部' OR department = '市场部';
```

**NOT 运算符**

NOT 运算符取反。

```sql
-- 查询不在北京的员工
SELECT * FROM employees 
WHERE NOT city = '北京';

-- 查询年龄不大于 30 的员工
SELECT * FROM employees 
WHERE NOT age > 30;
```

### 范围查询

**BETWEEN 运算符**

BETWEEN 用于查询某个范围内的值。

```sql
-- 查询年龄在 25 到 30 之间的员工（包含 25 和 30）
SELECT * FROM employees 
WHERE age BETWEEN 25 AND 30;

-- 查询薪资在 15000 到 20000 之间的员工
SELECT * FROM employees 
WHERE salary BETWEEN 15000 AND 20000;
```

**IN 运算符**

IN 用于查询值在指定集合中的记录。

```sql
-- 查询北京、上海、广州的员工
SELECT * FROM employees 
WHERE city IN ('北京', '上海', '广州');

-- 查询技术部或市场部的员工
SELECT * FROM employees 
WHERE department IN ('技术部', '市场部');
```

### 模糊查询

**LIKE 运算符**

LIKE 用于模糊匹配字符串。

```sql
-- % 表示任意多个字符（包括 0 个）
-- 查询姓"张"的员工
SELECT * FROM employees 
WHERE name LIKE '张%';

-- 查询名字中包含"三"的员工
SELECT * FROM employees 
WHERE name LIKE '%三%';

-- _ 表示任意单个字符
-- 查询姓"张"且名字只有两个字的员工
SELECT * FROM employees 
WHERE name LIKE '张_';
```

**ILIKE 运算符（PostgreSQL 特有）**

ILIKE 不区分大小写。

```sql
-- LIKE 区分大小写
SELECT * FROM employees WHERE name LIKE 'zhang%';  -- 只匹配小写 zhang

-- ILIKE 不区分大小写
SELECT * FROM employees WHERE name ILIKE 'zhang%';  -- 匹配 Zhang、ZHANG 等
```

### NULL 处理

```sql
-- 查询 email 为 NULL 的员工
SELECT * FROM employees WHERE email IS NULL;

-- 查询 email 不为 NULL 的员工
SELECT * FROM employees WHERE email IS NOT NULL;
```

### ORDER BY 排序

**升序排序（ASC）**

```sql
-- 按年龄升序排列（默认）
SELECT * FROM employees ORDER BY age ASC;

-- 简写
SELECT * FROM employees ORDER BY age;
```

**降序排序（DESC）**

```sql
-- 按年龄降序排列
SELECT * FROM employees ORDER BY age DESC;

-- 按薪资降序排列
SELECT * FROM employees ORDER BY salary DESC;
```

**多列排序**

```sql
-- 先按部门排序，部门相同再按薪资降序
SELECT * FROM employees 
ORDER BY department ASC, salary DESC;

-- 先按城市排序，城市相同再按年龄升序
SELECT * FROM employees 
ORDER BY city ASC, age ASC;
```

### LIMIT 限制结果数量

```sql
-- 只查询前 5 条数据
SELECT * FROM employees LIMIT 5;

-- 从第 6 条开始，查询 5 条（分页）
SELECT * FROM employees LIMIT 5 OFFSET 5;

-- 查询薪资最高的前 3 名员工
SELECT * FROM employees 
ORDER BY salary DESC 
LIMIT 3;
```

---

## 5.4 进阶用法

### 聚合函数

聚合函数对一组值执行计算并返回单个值。

| 函数 | 说明 | 示例 |
| --- | --- | --- |
| COUNT() | 计数 | `COUNT(*)` 统计行数 |
| SUM() | 求和 | `SUM(salary)` 计算薪资总和 |
| AVG() | 平均值 | `AVG(age)` 计算平均年龄 |
| MAX() | 最大值 | `MAX(salary)` 查询最高薪资 |
| MIN() | 最小值 | `MIN(age)` 查询最小年龄 |

**COUNT 函数**

```sql
-- 查询员工总数
SELECT COUNT(*) FROM employees;

-- 查询北京员工数量
SELECT COUNT(*) FROM employees WHERE city = '北京';

-- 查询不同城市的数量（去重）
SELECT COUNT(DISTINCT city) FROM employees;
```

**SUM 函数**

```sql
-- 查询所有员工的薪资总和
SELECT SUM(salary) FROM employees;

-- 查询技术部的薪资总和
SELECT SUM(salary) FROM employees WHERE department = '技术部';
```

**AVG 函数**

```sql
-- 查询所有员工的平均年龄
SELECT AVG(age) FROM employees;

-- 查询技术部的平均薪资
SELECT AVG(salary) FROM employees WHERE department = '技术部';
```

**MAX 和 MIN 函数**

```sql
-- 查询最高薪资
SELECT MAX(salary) FROM employees;

-- 查询最小年龄
SELECT MIN(age) FROM employees;

-- 查询最高和最低薪资
SELECT 
    MAX(salary) AS 最高薪资,
    MIN(salary) AS 最低薪资,
    MAX(salary) - MIN(salary) AS 薪资差距
FROM employees;
```

### 表达式

**算术表达式**

```sql
-- 计算年薪（假设 12 个月 + 年终奖）
SELECT 
    name,
    salary,
    salary * 13 AS annual_salary
FROM employees;
```

**字符串表达式**

```sql
-- 拼接字符串
SELECT 
    name || ' - ' || department AS employee_info
FROM employees;
```

**CASE 表达式**

```sql
-- 根据薪资等级分类
SELECT 
    name,
    salary,
    CASE 
        WHEN salary < 15000 THEN '初级'
        WHEN salary BETWEEN 15000 AND 20000 THEN '中级'
        ELSE '高级'
    END AS salary_level
FROM employees;
```

---

## 5.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| WHERE | 条件过滤 |
| AND | 逻辑与，所有条件都满足 |
| OR | 逻辑或，至少一个条件满足 |
| NOT | 逻辑非，取反 |
| BETWEEN | 在某个范围内 |
| IN | 在某个集合中 |
| LIKE | 模糊匹配 |
| IS NULL | 判断是否为 NULL |
| ORDER BY | 排序 |
| LIMIT | 限制结果数量 |
| COUNT | 计数 |
| SUM | 求和 |
| AVG | 平均值 |
| MAX | 最大值 |
| MIN | 最小值 |

---

## 5.6 新手常见误区

### 误区 1："WHERE 中可以使用列别名"

**错！** WHERE 子句在 SELECT 之前执行，所以不能使用列别名。

```sql
-- ❌ 错误：WHERE 中不能使用别名
SELECT salary * 12 AS annual_salary 
FROM employees 
WHERE annual_salary > 200000;

-- ✅ 正确：使用原始表达式
SELECT salary * 12 AS annual_salary 
FROM employees 
WHERE salary * 12 > 200000;
```

### 误区 2："NULL 可以用 = 判断"

**错！** NULL 表示"未知值"，不能用 = 或 <> 判断。

```sql
-- ❌ 错误：NULL 不能用 = 判断
SELECT * FROM employees WHERE email = NULL;

-- ✅ 正确：使用 IS NULL
SELECT * FROM employees WHERE email IS NULL;
```

### 误区 3："ORDER BY 只能用列名"

不是的。ORDER BY 可以用列名、列别名、表达式或列位置。

```sql
-- ✅ 使用列名
SELECT * FROM employees ORDER BY salary DESC;

-- ✅ 使用列别名
SELECT salary * 12 AS annual_salary 
FROM employees 
ORDER BY annual_salary DESC;

-- ✅ 使用列位置（第 4 列）
SELECT * FROM employees ORDER BY 4 DESC;
```

### 误区 4："LIKE 查询不区分大小写"

**错！** PostgreSQL 的 LIKE 默认区分大小写。

```sql
-- 区分大小写
SELECT * FROM employees WHERE name LIKE 'Zhang%';  -- 只匹配 Zhang

-- 不区分大小写
SELECT * FROM employees WHERE name ILIKE 'Zhang%';  -- 匹配 Zhang、zhang 等
```

---

## 5.7 动手练习

### 练习 1：基础条件查询

使用 `employees` 表，查询：
- 所有技术部的员工
- 年龄大于 30 且薪资大于 15000 的员工
- 北京或上海的员工，按薪资降序排列

<details>
<summary>点击查看答案</summary>

```sql
-- 查询所有技术部的员工
SELECT * FROM employees WHERE department = '技术部';

-- 查询年龄大于 30 且薪资大于 15000 的员工
SELECT * FROM employees 
WHERE age > 30 AND salary > 15000;

-- 查询北京或上海的员工，按薪资降序排列
SELECT * FROM employees 
WHERE city IN ('北京', '上海')
ORDER BY salary DESC;
```

</details>

### 练习 2：聚合函数

使用 `employees` 表，查询：
- 所有员工的平均薪资
- 技术部的员工数量和平均年龄
- 每个城市的员工数量

<details>
<summary>点击查看答案</summary>

```sql
-- 查询所有员工的平均薪资
SELECT AVG(salary) AS 平均薪资 FROM employees;

-- 查询技术部的员工数量和平均年龄
SELECT 
    COUNT(*) AS 员工数量,
    AVG(age) AS 平均年龄
FROM employees 
WHERE department = '技术部';

-- 查询每个城市的员工数量
SELECT 
    city AS 城市,
    COUNT(*) AS 员工数量
FROM employees
GROUP BY city;
```

</details>

### 练习 3（挑战）：综合查询

使用 `employees` 表，查询：
- 薪资在前 3 名的员工信息
- 每个部门的平均薪资，并按平均薪资降序排列
- 入职时间在 2020 年之后的员工，按入职时间排序

<details>
<summary>点击查看答案</summary>

```sql
-- 查询薪资在前 3 名的员工信息
SELECT * FROM employees 
ORDER BY salary DESC 
LIMIT 3;

-- 查询每个部门的平均薪资，并按平均薪资降序排列
SELECT 
    department AS 部门,
    AVG(salary) AS 平均薪资
FROM employees
GROUP BY department
ORDER BY 平均薪资 DESC;

-- 查询入职时间在 2020 年之后的员工，按入职时间排序
SELECT * FROM employees 
WHERE hire_date >= '2020-01-01'
ORDER BY hire_date ASC;
```

</details>

---

## 下一章预告

下一章我们会学习 **分组与聚合**——掌握 GROUP BY 和 HAVING 的用法，了解如何对数据进行分组统计，以及如何使用 HAVING 过滤分组。这是数据分析中非常重要的技能。
