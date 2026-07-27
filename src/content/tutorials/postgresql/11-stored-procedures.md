---
title: "第11章：存储过程与函数"
description: "CREATE FUNCTION、CREATE PROCEDURE、PL/pgSQL"
---

# 第11章：存储过程与函数

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是存储过程和函数？有什么区别？
- 如何创建和使用函数？
- PL/pgSQL 是什么？如何使用？
- 存储过程有哪些应用场景？
- 如何调试存储过程？

这一章就是为了解答这些问题。我们会先搞清楚 **存储过程和函数的基本概念**，再学习**PL/pgSQL 语言**，最后掌握**存储过程的实战应用**。

---

## 1 为什么需要存储过程和函数？

### 痛点分析

想象一下，你要在多个地方计算员工的年终奖。如果不用函数：

```sql
-- ❌ 重复代码：每次都要写相同的计算逻辑
SELECT name, salary * 2 AS bonus FROM employees;
SELECT name, salary * 2 + 1000 AS bonus FROM employees WHERE department = '技术部';
-- 如果计算逻辑改变，需要修改多处
```

问题：
- ❌ 代码重复
- ❌ 维护困难
- ❌ 容易出错

### 解决方案

使用函数：

```sql
-- ✅ 创建函数
CREATE OR REPLACE FUNCTION calculate_bonus(salary DECIMAL, department VARCHAR)
RETURNS DECIMAL AS $$
BEGIN
    IF department = '技术部' THEN
        RETURN salary * 2 + 1000;
    ELSE
        RETURN salary * 2;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 使用函数
SELECT name, calculate_bonus(salary, department) AS bonus FROM employees;
```

优势：
- ✅ 代码复用
- ✅ 易于维护
- ✅ 逻辑集中

> **一句话总结**：存储过程和函数可以将复杂的业务逻辑封装成可复用的代码块。

---

## 2 核心原理

### 概念解释

**函数（Function）**

函数是一段可复用的代码，接受参数，返回结果。

打个比方：

> 函数就像是**计算器**：
> - 你输入参数（数字）
> - 计算器执行计算
> - 返回结果

**存储过程（Procedure）**

存储过程类似于函数，但不返回值，主要用于执行操作。

**PL/pgSQL**

PL/pgSQL 是 PostgreSQL 的过程语言，支持变量、条件、循环等。

---

## 3 基础用法

### 准备工作

创建示例表：

```sql
-- 创建员工表
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    salary DECIMAL(10, 2)
);

-- 插入示例数据
INSERT INTO employees (name, department, salary) VALUES
    ('张三', '技术部', 15000),
    ('李四', '市场部', 12000),
    ('王五', '技术部', 18000);
```

### 创建简单函数

```sql
-- 创建计算年薪的函数
CREATE OR REPLACE FUNCTION calculate_annual_salary(monthly_salary DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN monthly_salary * 12;
END;
$$ LANGUAGE plpgsql;

-- 使用函数
SELECT 
    name,
    salary,
    calculate_annual_salary(salary) AS annual_salary
FROM employees;
```

### 创建带参数的函数

```sql
-- 创建计算奖金的函数
CREATE OR REPLACE FUNCTION calculate_bonus(
    salary DECIMAL,
    department VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
    bonus DECIMAL;
BEGIN
    IF department = '技术部' THEN
        bonus := salary * 2;
    ELSIF department = '市场部' THEN
        bonus := salary * 1.5;
    ELSE
        bonus := salary;
    END IF;
    
    RETURN bonus;
END;
$$ LANGUAGE plpgsql;

-- 使用函数
SELECT 
    name,
    department,
    salary,
    calculate_bonus(salary, department) AS bonus
FROM employees;
```

### 创建存储过程

```sql
-- 创建更新薪资的存储过程
CREATE OR REPLACE PROCEDURE update_salary(
    emp_id INTEGER,
    new_salary DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE employees 
    SET salary = new_salary 
    WHERE id = emp_id;
    
    RAISE NOTICE '员工 % 的薪资已更新为 %', emp_id, new_salary;
END;
$$;

-- 调用存储过程
CALL update_salary(1, 16000);
```

---

## 4 进阶用法

### 返回表结果

```sql
-- 创建返回表结果的函数
CREATE OR REPLACE FUNCTION get_employees_by_department(dept VARCHAR)
RETURNS TABLE(
    emp_id INTEGER,
    emp_name VARCHAR,
    emp_salary DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, name, salary
    FROM employees
    WHERE department = dept;
END;
$$ LANGUAGE plpgsql;

-- 使用函数
SELECT * FROM get_employees_by_department('技术部');
```

### 循环

```sql
-- 创建批量插入的函数
CREATE OR REPLACE FUNCTION insert_multiple_employees(
    names TEXT[],
    dept VARCHAR,
    base_salary DECIMAL
)
RETURNS VOID AS $$
DECLARE
    name TEXT;
    i INTEGER := 1;
BEGIN
    FOREACH name IN ARRAY names
    LOOP
        INSERT INTO employees (name, department, salary)
        VALUES (name, dept, base_salary + i * 1000);
        i := i + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 使用函数
SELECT insert_multiple_employees(ARRAY['赵六', '孙七', '周八'], '技术部', 15000);
```

### 异常处理

```sql
-- 创建带异常处理的函数
CREATE OR REPLACE FUNCTION safe_divide(a DECIMAL, b DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN a / b;
EXCEPTION
    WHEN division_by_zero THEN
        RAISE NOTICE '除数不能为零';
        RETURN NULL;
    WHEN OTHERS THEN
        RAISE NOTICE '发生错误: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 使用函数
SELECT safe_divide(10, 2);  -- 返回 5
SELECT safe_divide(10, 0);  -- 返回 NULL，提示错误
```

### 动态 SQL

```sql
-- 创建动态查询函数
CREATE OR REPLACE FUNCTION get_column_value(
    table_name VARCHAR,
    column_name VARCHAR,
    condition VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    sql TEXT;
BEGIN
    sql := 'SELECT ' || column_name || ' FROM ' || table_name || ' WHERE ' || condition;
    EXECUTE sql INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 使用函数
SELECT get_column_value('employees', 'name', 'id = 1');
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 函数 | 接受参数，返回结果 |
| 存储过程 | 执行操作，不返回值 |
| PL/pgSQL | PostgreSQL 的过程语言 |
| DECLARE | 声明变量 |
| BEGIN...END | 代码块 |
| IF...THEN...ELSE | 条件判断 |
| LOOP | 循环 |
| EXCEPTION | 异常处理 |
| RETURN QUERY | 返回查询结果 |
| EXECUTE | 动态 SQL |

---

## 6 新手常见误区

### 误区 1："函数和存储过程可以互换"

**错！** 函数返回值，存储过程不返回值。

```sql
-- ✅ 函数：返回值
CREATE OR REPLACE FUNCTION add(a INTEGER, b INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN a + b;
END;
$$ LANGUAGE plpgsql;

-- ✅ 存储过程：不返回值
CREATE OR REPLACE PROCEDURE log_message(msg TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE NOTICE '%', msg;
END;
$$;
```

### 误区 2："函数中不能使用事务"

**错！** 存储过程中可以使用事务，但函数中不能。

```sql
-- ❌ 错误：函数中不能使用事务
CREATE OR REPLACE FUNCTION bad_function()
RETURNS VOID AS $$
BEGIN
    BEGIN;  -- 错误
    -- ...
    COMMIT;
END;
$$ LANGUAGE plpgsql;

-- ✅ 正确：存储过程中可以使用事务
CREATE OR REPLACE PROCEDURE good_procedure()
LANGUAGE plpgsql
AS $$
BEGIN
    -- 存储过程中可以执行事务操作
END;
$$;
```

### 误区 3："函数性能一定差"

**错！** 函数性能取决于实现方式。

建议：
- ✅ 使用 SQL 语言编写简单函数
- ✅ 使用 PL/pgSQL 编写复杂逻辑
- ✅ 避免在函数中使用循环（如果可能）

### 误区 4："存储过程不能返回结果"

**错！** 存储过程可以通过 OUT 参数返回结果。

```sql
-- 创建带 OUT 参数的存储过程
CREATE OR REPLACE PROCEDURE get_employee_info(
    emp_id INTEGER,
    OUT emp_name VARCHAR,
    OUT emp_salary DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT name, salary INTO emp_name, emp_salary
    FROM employees
    WHERE id = emp_id;
END;
$$;

-- 调用存储过程
CALL get_employee_info(1, NULL, NULL);
```

---

## 7 动手练习

### 练习 1：基础函数

创建一个函数，计算员工的月薪和年终奖（月薪的 2 倍）。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建计算年终奖的函数
CREATE OR REPLACE FUNCTION calculate_year_end_bonus(monthly_salary DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN monthly_salary * 2;
END;
$$ LANGUAGE plpgsql;

-- 使用函数
SELECT 
    name,
    salary,
    calculate_year_end_bonus(salary) AS year_end_bonus
FROM employees;
```

</details>

### 练习 2：存储过程

创建一个存储过程，批量更新员工的薪资（根据部门调整）。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建批量更新薪资的存储过程
CREATE OR REPLACE PROCEDURE batch_update_salary()
LANGUAGE plpgsql
AS $$
BEGIN
    -- 技术部薪资上调 10%
    UPDATE employees SET salary = salary * 1.1 WHERE department = '技术部';
    
    -- 市场部薪资上调 5%
    UPDATE employees SET salary = salary * 1.05 WHERE department = '市场部';
    
    RAISE NOTICE '批量更新完成';
END;
$$;

-- 调用存储过程
CALL batch_update_salary();

-- 查看结果
SELECT * FROM employees;
```

</details>

### 练习 3（挑战）：综合函数

创建一个函数，实现以下功能：
- 查询指定部门的员工数量
- 如果员工数量大于 5，返回部门名称和员工数量
- 否则返回 NULL

<details>
<summary>点击查看答案</summary>

```sql
-- 创建综合函数
CREATE OR REPLACE FUNCTION check_department_size(dept VARCHAR)
RETURNS TABLE(department VARCHAR, emp_count INTEGER) AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM employees
    WHERE department = dept;
    
    IF count > 5 THEN
        RETURN QUERY
        SELECT dept, count;
    ELSE
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 使用函数
SELECT * FROM check_department_size('技术部');
```

</details>

---

## 下一章预告

下一章我们会学习 **视图与触发器**——了解如何创建和使用视图，掌握触发器的概念和使用场景，以及物化视图的原理和应用。
