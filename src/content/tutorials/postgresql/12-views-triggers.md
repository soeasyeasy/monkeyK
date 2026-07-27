---
title: "第12章：视图与触发器"
description: "CREATE VIEW、CREATE TRIGGER、物化视图"
---

# 第12章：视图与触发器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是视图？为什么需要视图？
- 视图和表有什么区别？
- 什么是触发器？触发器有哪些类型？
- 什么是物化视图？和普通视图有什么区别？
- 触发器有哪些应用场景？

这一章就是为了解答这些问题。我们会先搞清楚 **视图的基本概念**，再学习**触发器**，最后掌握**物化视图**。

---

## 12.1 为什么需要视图和触发器？

### 痛点分析

想象一下，你有一个复杂的查询，需要在多个地方使用。如果不用视图：

```sql
-- ❌ 重复代码：每次都要写相同的复杂查询
SELECT 
    e.name,
    e.salary,
    d.name AS department_name,
    e.salary * 12 AS annual_salary
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary > 15000;

-- 在另一个地方又要写一遍
SELECT 
    e.name,
    e.salary,
    d.name AS department_name
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary > 15000
ORDER BY e.salary DESC;
```

问题：
- ❌ 代码重复
- ❌ 维护困难
- ❌ 容易出错

### 解决方案

使用视图：

```sql
-- ✅ 创建视图
CREATE VIEW high_salary_employees AS
SELECT 
    e.name,
    e.salary,
    d.name AS department_name,
    e.salary * 12 AS annual_salary
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary > 15000;

-- 使用视图
SELECT * FROM high_salary_employees;
SELECT name, department_name FROM high_salary_employees ORDER BY salary DESC;
```

优势：
- ✅ 代码复用
- ✅ 易于维护
- ✅ 简化查询

> **一句话总结**：视图是虚拟表，可以简化复杂查询；触发器是自动执行的代码块，可以在数据变化时自动执行操作。

---

## 12.2 核心原理

### 概念解释

**视图（View）**

视图是基于查询结果的虚拟表。

打个比方：

> 视图就像是**快捷方式**：
> - 不存储实际数据
> - 只是保存了一个查询
> - 每次访问视图时，执行查询

**触发器（Trigger）**

触发器是在特定事件发生时自动执行的代码块。

打个比方：

> 触发器就像是**门铃**：
> - 有人按门铃（事件发生）
> - 门铃自动响起（触发器执行）
> - 你不需要手动操作

**物化视图（Materialized View）**

物化视图是存储实际数据的视图。

---

## 12.3 基础用法

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
    hire_date DATE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 插入示例数据
INSERT INTO departments (name) VALUES ('技术部'), ('市场部'), ('销售部');
INSERT INTO employees (name, department_id, salary, hire_date) VALUES
    ('张三', 1, 15000, '2020-03-15'),
    ('李四', 1, 18000, '2019-07-20'),
    ('王五', 2, 12000, '2021-01-10');
```

### 创建视图

```sql
-- 创建简单视图
CREATE VIEW employee_details AS
SELECT 
    e.id,
    e.name,
    e.salary,
    d.name AS department_name,
    e.hire_date
FROM employees e
JOIN departments d ON e.department_id = d.id;

-- 使用视图
SELECT * FROM employee_details;
SELECT name, department_name FROM employee_details WHERE salary > 15000;
```

### 更新视图

```sql
-- 创建可更新视图
CREATE VIEW high_salary_employees AS
SELECT id, name, salary, department_id
FROM employees
WHERE salary > 15000;

-- 通过视图更新数据
UPDATE high_salary_employees SET salary = 16000 WHERE id = 1;

-- 通过视图插入数据（有限制）
INSERT INTO high_salary_employees (name, salary, department_id) 
VALUES ('赵六', 16000, 1);
```

### 删除视图

```sql
-- 删除视图
DROP VIEW employee_details;
DROP VIEW IF EXISTS high_salary_employees;
```

---

## 12.4 进阶用法

### 触发器基础

**创建触发器函数**

```sql
-- 创建触发器函数
CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        RAISE NOTICE '插入员工: %', NEW.name;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        RAISE NOTICE '更新员工: % -> %', OLD.name, NEW.name;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        RAISE NOTICE '删除员工: %', OLD.name;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**创建触发器**

```sql
-- 创建触发器
CREATE TRIGGER employee_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION log_employee_changes();
```

**测试触发器**

```sql
-- 插入数据（触发器会执行）
INSERT INTO employees (name, department_id, salary, hire_date) 
VALUES ('孙七', 1, 14000, '2022-01-01');

-- 更新数据（触发器会执行）
UPDATE employees SET salary = 15000 WHERE name = '孙七';

-- 删除数据（触发器会执行）
DELETE FROM employees WHERE name = '孙七';
```

### 触发器类型

| 触发时机 | 说明 |
| --- | --- |
| BEFORE | 在操作之前执行 |
| AFTER | 在操作之后执行 |
| INSTEAD OF | 替代操作执行（用于视图） |

**BEFORE 触发器**

```sql
-- 创建 BEFORE 触发器函数
CREATE OR REPLACE FUNCTION validate_salary()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.salary < 0 THEN
        RAISE EXCEPTION '薪资不能为负数';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建 BEFORE 触发器
CREATE TRIGGER validate_salary_trigger
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION validate_salary();
```

### 物化视图

**创建物化视图**

```sql
-- 创建物化视图
CREATE MATERIALIZED VIEW department_stats AS
SELECT 
    d.name AS department_name,
    COUNT(e.id) AS employee_count,
    AVG(e.salary) AS avg_salary,
    MAX(e.salary) AS max_salary,
    MIN(e.salary) AS min_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.name;

-- 查询物化视图
SELECT * FROM department_stats;
```

**刷新物化视图**

```sql
-- 刷新物化视图
REFRESH MATERIALIZED VIEW department_stats;

-- 并发刷新（不阻塞查询）
REFRESH MATERIALIZED VIEW CONCURRENTLY department_stats;
```

**删除物化视图**

```sql
-- 删除物化视图
DROP MATERIALIZED VIEW department_stats;
DROP MATERIALIZED VIEW IF EXISTS department_stats;
```

---

## 12.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 视图 | 虚拟表，基于查询结果 |
| 触发器 | 事件发生时自动执行的代码块 |
| 物化视图 | 存储实际数据的视图 |
| BEFORE 触发器 | 在操作之前执行 |
| AFTER 触发器 | 在操作之后执行 |
| INSTEAD OF 触发器 | 替代操作执行 |
| REFRESH | 刷新物化视图 |

---

## 12.6 新手常见误区

### 误区 1："视图和表一样存储数据"

**错！** 视图不存储数据，只是保存了一个查询。

```sql
-- ✅ 视图：不存储数据
CREATE VIEW employee_details AS
SELECT * FROM employees;

-- ✅ 物化视图：存储数据
CREATE MATERIALIZED VIEW employee_details_mv AS
SELECT * FROM employees;
```

### 误区 2："视图可以更新所有查询"

**错！** 只有简单查询的视图可以更新。

```sql
-- ❌ 不可更新视图（包含聚合函数）
CREATE VIEW department_stats AS
SELECT department_id, COUNT(*) FROM employees GROUP BY department_id;

-- ✅ 可更新视图（简单查询）
CREATE VIEW high_salary_employees AS
SELECT * FROM employees WHERE salary > 15000;
```

### 误区 3："触发器会影响性能"

**错！** 触发器性能取决于实现方式。

建议：
- ✅ 触发器逻辑要简单
- ✅ 避免在触发器中执行复杂查询
- ✅ 定期审查触发器

### 误区 4："物化视图不需要刷新"

**错！** 物化视图需要手动刷新才能看到最新数据。

```sql
-- ✅ 刷新物化视图
REFRESH MATERIALIZED VIEW department_stats;

-- ✅ 并发刷新（推荐）
REFRESH MATERIALIZED VIEW CONCURRENTLY department_stats;
```

---

## 12.7 动手练习

### 练习 1：创建视图

创建一个视图，显示每个部门的员工数量和平均薪资。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建部门统计视图
CREATE VIEW department_stats_view AS
SELECT 
    d.name AS department_name,
    COUNT(e.id) AS employee_count,
    AVG(e.salary) AS avg_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.name;

-- 使用视图
SELECT * FROM department_stats_view;
```

</details>

### 练习 2：创建触发器

创建一个触发器，当员工薪资变化时，记录变化日志。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建薪资日志表
CREATE TABLE salary_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    old_salary DECIMAL(10, 2),
    new_salary DECIMAL(10, 2),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION log_salary_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.salary != NEW.salary THEN
        INSERT INTO salary_logs (employee_id, old_salary, new_salary)
        VALUES (OLD.id, OLD.salary, NEW.salary);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER salary_change_trigger
    AFTER UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION log_salary_changes();

-- 测试触发器
UPDATE employees SET salary = 16000 WHERE id = 1;

-- 查看日志
SELECT * FROM salary_logs;
```

</details>

### 练习 3（挑战）：物化视图

创建一个物化视图，显示每个月的入职员工数量和平均薪资。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建月度统计物化视图
CREATE MATERIALIZED VIEW monthly_stats AS
SELECT 
    TO_CHAR(hire_date, 'YYYY-MM') AS hire_month,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY TO_CHAR(hire_date, 'YYYY-MM')
ORDER BY hire_month;

-- 查询物化视图
SELECT * FROM monthly_stats;

-- 刷新物化视图
REFRESH MATERIALIZED VIEW monthly_stats;
```

</details>

---

## 下一章预告

下一章我们会学习 **用户权限与安全**——了解如何创建和管理用户，掌握权限分配和回收，以及 SSL 连接等安全配置。
