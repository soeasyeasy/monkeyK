---
title: "第06章：分组与聚合"
description: "GROUP BY、HAVING、COUNT、SUM、AVG"
---

# 第06章：分组与聚合

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是分组？为什么要分组？
- GROUP BY 子句如何使用？
- HAVING 和 WHERE 有什么区别？
- 如何在分组后使用聚合函数？
- 如何进行多列分组？

这一章就是为了解答这些问题。我们会先搞清楚 **GROUP BY 的基本用法**，再学习**HAVING 子句**，最后掌握**多列分组和分组排序**。

---

## 6.1 为什么需要分组？

### 痛点分析

想象一下，你有一个员工表，想知道"每个部门的平均薪资"。如果不使用分组：

```sql
-- ❌ 低效的方式：分别查询每个部门
SELECT AVG(salary) FROM employees WHERE department = '技术部';
SELECT AVG(salary) FROM employees WHERE department = '市场部';
SELECT AVG(salary) FROM employees WHERE department = '销售部';
```

问题：
- ❌ 需要写多条 SQL 语句
- ❌ 如果部门很多，工作量巨大
- ❌ 无法动态适应部门变化

### 解决方案

使用 GROUP BY 分组：

```sql
-- ✅ 高效的方式：一条 SQL 搞定
SELECT 
    department,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY department;
```

优势：
- ✅ 一条 SQL 语句完成
- ✅ 自动适应所有部门
- ✅ 代码简洁，易于维护

> **一句话总结**：分组可以将数据按某个列分成多个组，然后对每个组进行聚合计算。

---

## 6.2 核心原理

### 概念解释

**GROUP BY 子句**

GROUP BY 子句用于将行分组，使得每个组只返回一行结果。

打个比方：

> GROUP BY 就像是**整理书架**：
> - 你有很多书（数据行）
> - 按照类别（分组列）整理
> - 每个类别放一堆书（一个组）
> - 然后对每个类别统计（聚合计算）

**执行顺序**

包含 GROUP BY 的 SQL 执行顺序：

1. FROM：确定数据源
2. WHERE：过滤行
3. GROUP BY：分组
4. 聚合函数：计算每个组的聚合值
5. HAVING：过滤分组
6. SELECT：选择列
7. ORDER BY：排序
8. LIMIT：限制结果数量

---

## 6.3 基础用法

### 准备工作

使用上一章创建的 `employees` 表：

```sql
-- 查看表数据
SELECT * FROM employees;
```

### GROUP BY 基础

**单列分组**

```sql
-- 查询每个部门的员工数量
SELECT 
    department,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department;
```

**查询每个城市的平均薪资**

```sql
SELECT 
    city,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY city;
```

### 多列分组

```sql
-- 查询每个部门每个城市的员工数量
SELECT 
    department,
    city,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department, city;
```

### 聚合函数

**COUNT 函数**

```sql
-- 查询每个部门的员工数量
SELECT 
    department,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department;

-- 查询每个部门的不同城市数量
SELECT 
    department,
    COUNT(DISTINCT city) AS city_count
FROM employees
GROUP BY department;
```

**SUM 函数**

```sql
-- 查询每个部门的薪资总和
SELECT 
    department,
    SUM(salary) AS total_salary
FROM employees
GROUP BY department;
```

**AVG 函数**

```sql
-- 查询每个部门的平均年龄
SELECT 
    department,
    AVG(age) AS avg_age
FROM employees
GROUP BY department;
```

**MAX 和 MIN 函数**

```sql
-- 查询每个部门的最高和最低薪资
SELECT 
    department,
    MAX(salary) AS max_salary,
    MIN(salary) AS min_salary
FROM employees
GROUP BY department;
```

### HAVING 子句

HAVING 子句用于过滤分组后的结果。

**WHERE vs HAVING**

| 特性 | WHERE | HAVING |
| --- | --- | --- |
| 作用时机 | 分组前过滤行 | 分组后过滤组 |
| 能否使用聚合函数 | 不能 | 能 |
| 语法位置 | GROUP BY 之前 | GROUP BY 之后 |

```sql
-- 查询员工数量大于 2 的部门
SELECT 
    department,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department
HAVING COUNT(*) > 2;

-- 查询平均薪资大于 15000 的部门
SELECT 
    department,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 15000;
```

### 完整示例

```sql
-- 查询每个城市的部门数量、员工数量、平均薪资
-- 只显示员工数量大于 1 的城市
-- 按平均薪资降序排列
SELECT 
    city,
    COUNT(DISTINCT department) AS department_count,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY city
HAVING COUNT(*) > 1
ORDER BY avg_salary DESC;
```

---

## 6.4 进阶用法

### GROUP BY 与表达式

```sql
-- 按年份分组统计入职人数
SELECT 
    EXTRACT(YEAR FROM hire_date) AS hire_year,
    COUNT(*) AS employee_count
FROM employees
GROUP BY EXTRACT(YEAR FROM hire_date)
ORDER BY hire_year;
```

### 使用 CASE 表达式分组

```sql
-- 按薪资等级分组统计
SELECT 
    CASE 
        WHEN salary < 15000 THEN '初级'
        WHEN salary BETWEEN 15000 AND 20000 THEN '中级'
        ELSE '高级'
    END AS salary_level,
    COUNT(*) AS employee_count
FROM employees
GROUP BY 
    CASE 
        WHEN salary < 15000 THEN '初级'
        WHEN salary BETWEEN 15000 AND 20000 THEN '中级'
        ELSE '高级'
    END;
```

### ROLLUP 和 CUBE

**ROLLUP**

ROLLUP 生成小计和总计。

```sql
-- 查询每个部门每个城市的员工数量，并生成小计和总计
SELECT 
    department,
    city,
    COUNT(*) AS employee_count
FROM employees
GROUP BY ROLLUP(department, city);
```

**CUBE**

CUBE 生成所有可能的组合。

```sql
-- 查询所有可能的组合
SELECT 
    department,
    city,
    COUNT(*) AS employee_count
FROM employees
GROUP BY CUBE(department, city);
```

### GROUPING SETS

GROUPING SETS 可以指定任意分组组合。

```sql
-- 查询指定的分组组合
SELECT 
    department,
    city,
    COUNT(*) AS employee_count
FROM employees
GROUP BY GROUPING SETS (
    (department, city),  -- 部门和城市
    (department),        -- 只按部门
    ()                   -- 总计
);
```

---

## 6.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| GROUP BY | 分组子句 |
| HAVING | 过滤分组 |
| COUNT | 计数 |
| SUM | 求和 |
| AVG | 平均值 |
| MAX | 最大值 |
| MIN | 最小值 |
| ROLLUP | 生成小计和总计 |
| CUBE | 生成所有组合 |
| GROUPING SETS | 指定分组组合 |

---

## 6.6 新手常见误区

### 误区 1："SELECT 中可以使用未分组的列"

**错！** 使用 GROUP BY 后，SELECT 中只能包含分组列和聚合函数。

```sql
-- ❌ 错误：name 没有分组，也没有聚合
SELECT 
    department,
    name,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department;

-- ✅ 正确：只包含分组列和聚合函数
SELECT 
    department,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department;
```

### 误区 2："WHERE 中可以使用聚合函数"

**错！** WHERE 在分组前执行，不能使用聚合函数。

```sql
-- ❌ 错误：WHERE 中不能使用聚合函数
SELECT 
    department,
    COUNT(*) AS employee_count
FROM employees
WHERE COUNT(*) > 2
GROUP BY department;

-- ✅ 正确：使用 HAVING 过滤分组
SELECT 
    department,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department
HAVING COUNT(*) > 2;
```

### 误区 3："HAVING 和 WHERE 可以互换"

**错！** WHERE 过滤行，HAVING 过滤组。

```sql
-- ✅ 正确：WHERE 过滤行，HAVING 过滤组
SELECT 
    department,
    AVG(salary) AS avg_salary
FROM employees
WHERE age > 25  -- 先过滤年龄大于 25 的员工
GROUP BY department
HAVING AVG(salary) > 15000;  -- 再过滤平均薪资大于 15000 的部门
```

### 误区 4："GROUP BY 的列顺序很重要"

不是的。GROUP BY 的列顺序不影响结果，但影响显示顺序。

```sql
-- 两种写法结果相同
SELECT department, city, COUNT(*) 
FROM employees 
GROUP BY department, city;

SELECT department, city, COUNT(*) 
FROM employees 
GROUP BY city, department;
```

---

## 6.7 动手练习

### 练习 1：基础分组

使用 `employees` 表，查询：
- 每个部门的员工数量
- 每个城市的平均薪资
- 每个部门的最高和最低薪资

<details>
<summary>点击查看答案</summary>

```sql
-- 查询每个部门的员工数量
SELECT 
    department,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department;

-- 查询每个城市的平均薪资
SELECT 
    city,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY city;

-- 查询每个部门的最高和最低薪资
SELECT 
    department,
    MAX(salary) AS max_salary,
    MIN(salary) AS min_salary
FROM employees
GROUP BY department;
```

</details>

### 练习 2：HAVING 过滤

使用 `employees` 表，查询：
- 员工数量大于 2 的部门
- 平均薪资大于 15000 的城市
- 平均年龄小于 30 的部门

<details>
<summary>点击查看答案</summary>

```sql
-- 查询员工数量大于 2 的部门
SELECT 
    department,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department
HAVING COUNT(*) > 2;

-- 查询平均薪资大于 15000 的城市
SELECT 
    city,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY city
HAVING AVG(salary) > 15000;

-- 查询平均年龄小于 30 的部门
SELECT 
    department,
    AVG(age) AS avg_age
FROM employees
GROUP BY department
HAVING AVG(age) < 30;
```

</details>

### 练习 3（挑战）：综合查询

使用 `employees` 表，查询：
- 每个部门每个城市的员工数量，只显示员工数量大于 1 的组合
- 按年份统计入职人数，只显示入职人数大于 1 的年份
- 每个部门的平均薪资，按平均薪资降序排列，只显示平均薪资大于 15000 的部门

<details>
<summary>点击查看答案</summary>

```sql
-- 查询每个部门每个城市的员工数量，只显示员工数量大于 1 的组合
SELECT 
    department,
    city,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department, city
HAVING COUNT(*) > 1;

-- 按年份统计入职人数，只显示入职人数大于 1 的年份
SELECT 
    EXTRACT(YEAR FROM hire_date) AS hire_year,
    COUNT(*) AS employee_count
FROM employees
GROUP BY EXTRACT(YEAR FROM hire_date)
HAVING COUNT(*) > 1;

-- 查询每个部门的平均薪资，按平均薪资降序排列，只显示平均薪资大于 15000 的部门
SELECT 
    department,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 15000
ORDER BY avg_salary DESC;
```

</details>

---

## 下一章预告

下一章我们会学习 **连接查询**——掌握 INNER JOIN、LEFT JOIN、RIGHT JOIN、FULL JOIN 的用法，了解如何从多个表中查询数据。这是关系型数据库的核心技能。
