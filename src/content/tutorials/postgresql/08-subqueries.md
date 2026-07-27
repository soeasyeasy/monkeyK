---
title: "第08章：子查询与嵌套"
description: "标量子查询、列子查询、行子查询、相关子查询"
---

# 第08章：子查询与嵌套

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是子查询？子查询有哪些类型？
- 如何在 SELECT、WHERE、FROM 中使用子查询？
- 什么是相关子查询？和普通子查询有什么区别？
- 子查询的性能如何？如何优化？

这一章就是为了解答这些问题。我们会先搞清楚 **子查询的基本概念**，再学习**各种子查询类型**，最后掌握**子查询的优化技巧**。

---

## 1 为什么需要子查询？

### 痛点分析

想象一下，你想查询"薪资高于平均薪资的员工"。如果不用子查询：

```sql
-- ❌ 需要两步：先查平均薪资，再查员工
-- 第一步：查询平均薪资
SELECT AVG(salary) FROM employees;  -- 结果：15600

-- 第二步：手动代入查询
SELECT * FROM employees WHERE salary > 15600;
```

问题：
- ❌ 需要手动计算
- ❌ 无法动态适应数据变化
- ❌ 代码冗余

### 解决方案

使用子查询：

```sql
-- ✅ 一条 SQL 搞定
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```

优势：
- ✅ 一条 SQL 语句完成
- ✅ 动态计算
- ✅ 代码简洁

> **一句话总结**：子查询可以将一个查询嵌套在另一个查询中，实现复杂的查询逻辑。

---

## 2 核心原理

### 概念解释

**子查询（Subquery）**

子查询是嵌套在另一个查询中的 SELECT 语句。

打个比方：

> 子查询就像是**嵌套的信封**：
> - 外层查询是外面的信封
> - 子查询是里面的信封
> - 先打开里面的信封（执行子查询），再打开外面的信封（执行外层查询）

**子查询类型**

| 类型 | 说明 | 返回结果 |
| --- | --- | --- |
| 标量子查询 | 返回单个值 | 一行一列 |
| 列子查询 | 返回一列多行 | 多行一列 |
| 行子查询 | 返回一行多列 | 一行多列 |
| 表子查询 | 返回多行多列 | 多行多列 |
| 相关子查询 | 依赖外层查询的值 | 动态执行 |

---

## 3 基础用法

### 准备工作

使用之前的 `employees` 和 `departments` 表：

```sql
-- 查看表数据
SELECT * FROM employees;
SELECT * FROM departments;
```

### 标量子查询

标量子查询返回单个值。

**在 WHERE 中使用**

```sql
-- 查询薪资高于平均薪资的员工
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 查询年龄最小的员工
SELECT * FROM employees
WHERE age = (SELECT MIN(age) FROM employees);
```

**在 SELECT 中使用**

```sql
-- 查询每个员工的薪资与平均薪资的差额
SELECT 
    name,
    salary,
    salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;
```

**在 HAVING 中使用**

```sql
-- 查询平均薪资高于公司平均薪资的部门
SELECT 
    department_id,
    AVG(salary) AS dept_avg_salary
FROM employees
GROUP BY department_id
HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);
```

### 列子查询

列子查询返回一列多行。

**使用 IN**

```sql
-- 查询有员工的部门
SELECT * FROM departments
WHERE id IN (SELECT DISTINCT department_id FROM employees WHERE department_id IS NOT NULL);

-- 查询技术部的所有员工
SELECT * FROM employees
WHERE department_id IN (SELECT id FROM departments WHERE name = '技术部');
```

**使用 EXISTS**

```sql
-- 查询有员工的部门
SELECT * FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id);

-- 查询没有员工的部门
SELECT * FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id);
```

### 行子查询

行子查询返回一行多列。

```sql
-- 查询薪资最高且年龄最小的员工（假设只有一行）
SELECT * FROM employees
WHERE (salary, age) = (SELECT MAX(salary), MIN(age) FROM employees);
```

### 表子查询

表子查询返回多行多列，通常用于 FROM 子句。

```sql
-- 查询每个部门的平均薪资，然后查询平均薪资高于 15000 的部门
SELECT 
    dept_avg.department_id,
    dept_avg.avg_salary
FROM (
    SELECT 
        department_id,
        AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
) AS dept_avg
WHERE dept_avg.avg_salary > 15000;
```

---

## 4 进阶用法

### 相关子查询

相关子查询依赖外层查询的值。

```sql
-- 查询每个部门薪资最高的员工
SELECT * FROM employees e1
WHERE salary = (
    SELECT MAX(salary)
    FROM employees e2
    WHERE e2.department_id = e1.department_id
);

-- 查询薪资高于部门平均薪资的员工
SELECT * FROM employees e1
WHERE salary > (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department_id = e1.department_id
);
```

### 子查询在 INSERT 中使用

```sql
-- 将平均薪资高于 15000 的部门信息插入新表
CREATE TABLE high_salary_departments (
    department_id INTEGER,
    avg_salary DECIMAL(10, 2)
);

INSERT INTO high_salary_departments (department_id, avg_salary)
SELECT 
    department_id,
    AVG(salary)
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 15000;
```

### 子查询在 UPDATE 中使用

```sql
-- 将薪资低于平均薪资的员工薪资提高 10%
UPDATE employees
SET salary = salary * 1.1
WHERE salary < (SELECT AVG(salary) FROM employees);
```

### 子查询在 DELETE 中使用

```sql
-- 删除没有员工的部门
DELETE FROM departments
WHERE id NOT IN (SELECT DISTINCT department_id FROM employees WHERE department_id IS NOT NULL);
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 标量子查询 | 返回单个值 |
| 列子查询 | 返回一列多行 |
| 行子查询 | 返回一行多列 |
| 表子查询 | 返回多行多列 |
| 相关子查询 | 依赖外层查询的值 |
| IN | 判断值是否在集合中 |
| EXISTS | 判断子查询是否返回结果 |
| ANY | 与比较运算符结合使用 |
| ALL | 与比较运算符结合使用 |

---

## 6 新手常见误区

### 误区 1："子查询必须放在 WHERE 中"

**错！** 子查询可以放在 SELECT、FROM、WHERE、HAVING 等多个位置。

```sql
-- ✅ SELECT 中
SELECT 
    name,
    (SELECT AVG(salary) FROM employees) AS avg_salary
FROM employees;

-- ✅ FROM 中
SELECT * FROM (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
) AS dept_avg;

-- ✅ WHERE 中
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- ✅ HAVING 中
SELECT department_id, AVG(salary)
FROM employees
GROUP BY department_id
HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);
```

### 误区 2："IN 和 EXISTS 性能一样"

**错！** 在某些场景下，EXISTS 比 IN 性能更好。

建议：
- ✅ 如果子查询结果集小，使用 IN
- ✅ 如果外层查询结果集小，使用 EXISTS
- ✅ 如果子查询可能返回 NULL，使用 EXISTS

### 误区 3："相关子查询性能一定差"

不是的。虽然相关子查询可能性能较差，但在某些场景下是必要的。

优化建议：
- ✅ 使用 JOIN 替代相关子查询（如果可能）
- ✅ 使用窗口函数替代相关子查询（如果可能）
- ✅ 确保子查询中有合适的索引

### 误区 4："子查询不能嵌套多层"

**错！** PostgreSQL 支持多层嵌套，但建议不要超过 3 层。

```sql
-- ✅ 可以多层嵌套
SELECT * FROM employees
WHERE salary > (
    SELECT AVG(salary) FROM employees
    WHERE department_id IN (
        SELECT id FROM departments
        WHERE name LIKE '%部'
    )
);
```

---

## 7 动手练习

### 练习 1：标量子查询

使用 `employees` 表，查询：
- 薪资高于平均薪资的员工
- 年龄大于平均年龄的员工
- 每个员工的薪资与平均薪资的差额

<details>
<summary>点击查看答案</summary>

```sql
-- 查询薪资高于平均薪资的员工
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 查询年龄大于平均年龄的员工
SELECT * FROM employees
WHERE age > (SELECT AVG(age) FROM employees);

-- 查询每个员工的薪资与平均薪资的差额
SELECT 
    name,
    salary,
    salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;
```

</details>

### 练习 2：列子查询

使用 `employees` 和 `departments` 表，查询：
- 有员工的部门
- 没有员工的部门
- 技术部的所有员工

<details>
<summary>点击查看答案</summary>

```sql
-- 查询有员工的部门
SELECT * FROM departments
WHERE id IN (SELECT DISTINCT department_id FROM employees WHERE department_id IS NOT NULL);

-- 查询没有员工的部门
SELECT * FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id);

-- 查询技术部的所有员工
SELECT * FROM employees
WHERE department_id IN (SELECT id FROM departments WHERE name = '技术部');
```

</details>

### 练习 3（挑战）：相关子查询

使用 `employees` 表，查询：
- 每个部门薪资最高的员工
- 薪资高于部门平均薪资的员工
- 每个部门中薪资排前 2 的员工

<details>
<summary>点击查看答案</summary>

```sql
-- 查询每个部门薪资最高的员工
SELECT * FROM employees e1
WHERE salary = (
    SELECT MAX(salary)
    FROM employees e2
    WHERE e2.department_id = e1.department_id
);

-- 查询薪资高于部门平均薪资的员工
SELECT * FROM employees e1
WHERE salary > (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department_id = e1.department_id
);

-- 查询每个部门中薪资排前 2 的员工
SELECT * FROM employees e1
WHERE 2 >= (
    SELECT COUNT(DISTINCT salary)
    FROM employees e2
    WHERE e2.department_id = e1.department_id
    AND e2.salary >= e1.salary
);
```

</details>

---

## 下一章预告

下一章我们会学习 **索引原理与优化**——了解 B-tree 索引、哈希索引、GiST、GIN 索引的原理和使用场景，掌握如何设计和优化索引以提高查询性能。
