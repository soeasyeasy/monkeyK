---
title: "第7章：连接查询"
description: "INNER JOIN、LEFT JOIN、RIGHT JOIN、自连接"
---

# 第7章：连接查询

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么同时查询学生信息和他们的成绩？
- 怎么把分散在多个表中的数据合并在一起显示？
- INNER JOIN 和 LEFT JOIN 有什么区别？
- 什么是自连接？什么时候用？
- 怎么连接三个或更多的表？

这一章就是为了解答这些问题。我们会学习 **内连接**、**左连接**、**右连接**、**自连接** 和 **多表连接**。学完这章，你就能灵活地从多个关联表中查询数据了。

---

## 1 为什么需要连接查询？

### 痛点分析

在关系型数据库中，数据通常分散在多个表中，以避免冗余。比如：

- 学生信息在 `students` 表
- 课程信息在 `courses` 表
- 成绩信息在 `scores` 表

如果你想查询"张三的数学成绩"，需要同时从三个表中获取数据。如果没有连接查询，你只能分别查询三个表，然后在程序中手动拼接数据，非常麻烦。

### 解决方案

连接查询就像**拼图**：

> 你有一套拼图，分散在三个盒子里。连接查询就是帮你把这三个盒子的拼图按正确的关系拼在一起，形成完整的画面。

### 对比一下

| 没有连接查询 | 有连接查询 |
|------------|-----------|
| 分别查询多个表 | 一条语句查询多个表 |
| 程序中手动拼接 | 数据库自动关联 |
| 代码复杂，效率低 | 代码简洁，效率高 |

> **一句话总结**：连接查询让你用一条 SQL 语句从多个相关表中获取数据，是关系型数据库最强大的功能之一。

---

## 2 准备示例数据

为了更好地理解连接查询，我们先创建几个示例表。

```sql
-- 创建学生表
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(20),
    class_id INT
);

-- 插入学生数据
INSERT INTO students (id, name, class_id) VALUES
(1, '张三', 1),
(2, '李四', 1),
(3, '王五', 2),
(4, '赵六', NULL);  -- 赵六没有班级

-- 创建班级表
CREATE TABLE classes (
    id INT PRIMARY KEY,
    class_name VARCHAR(20)
);

-- 插入班级数据
INSERT INTO classes (id, class_name) VALUES
(1, '计算机1班'),
(2, '计算机2班'),
(3, '数学1班');  -- 数学1班没有学生

-- 创建成绩表
CREATE TABLE scores (
    id INT PRIMARY KEY,
    student_id INT,
    course VARCHAR(20),
    score INT
);

-- 插入成绩数据
INSERT INTO scores (id, student_id, course, score) VALUES
(1, 1, '数学', 85),
(2, 1, '英语', 90),
(3, 2, '数学', 78),
(4, 3, '数学', 92),
(5, 3, '英语', 88);
```

---

## 3 INNER JOIN 内连接

内连接只返回两个表中匹配的行。

### 基本语法

```sql
SELECT 列名
FROM 表1
INNER JOIN 表2 ON 连接条件;
```

### 示例代码

```sql
-- 查询每个学生及其所在的班级
SELECT students.name, classes.class_name
FROM students
INNER JOIN classes ON students.class_id = classes.id;
-- 只返回有班级的学生，赵六（class_id 为 NULL）不会出现在结果中

-- 使用别名简化
SELECT s.name, c.class_name
FROM students s
INNER JOIN classes c ON s.class_id = c.id;
-- s 是 students 的别名，c 是 classes 的别名

-- 查询学生的成绩信息
SELECT s.name, sc.course, sc.score
FROM students s
INNER JOIN scores sc ON s.id = sc.student_id;
-- 只返回有成绩的学生

-- 查询计算机1班的所有学生
SELECT s.name, c.class_name
FROM students s
INNER JOIN classes c ON s.class_id = c.id
WHERE c.class_name = '计算机1班';
-- 连接后可以加 WHERE 条件
```

> **原理**：INNER JOIN 会找出两个表中满足连接条件的行，不匹配的行不会出现在结果中。

---

## 4 LEFT JOIN 左连接

左连接返回左表的所有行，即使右表中没有匹配。

### 基本语法

```sql
SELECT 列名
FROM 表1
LEFT JOIN 表2 ON 连接条件;
```

### 示例代码

```sql
-- 查询所有学生及其班级（包括没有班级的学生）
SELECT students.name, classes.class_name
FROM students
LEFT JOIN classes ON students.class_id = classes.id;
-- 所有学生都会返回，赵六的 class_name 会显示为 NULL

-- 使用别名简化
SELECT s.name, c.class_name
FROM students s
LEFT JOIN classes c ON s.class_id = c.id;
-- 结果：
-- 张三 | 计算机1班
-- 李四 | 计算机1班
-- 王五 | 计算机2班
-- 赵六 | NULL

-- 查询所有班级及其学生（包括没有学生的班级）
SELECT c.class_name, s.name
FROM classes c
LEFT JOIN students s ON c.id = s.class_id;
-- 所有班级都会返回，数学1班没有学生，name 显示为 NULL

-- 查询每个学生的成绩（包括没有成绩的学生）
SELECT s.name, sc.course, sc.score
FROM students s
LEFT JOIN scores sc ON s.id = sc.student_id;
-- 所有学生都会返回，没有成绩的学生 course 和 score 显示为 NULL
```

> **原理**：LEFT JOIN 以左表为主，返回左表所有行。如果右表没有匹配，对应列显示 NULL。

---

## 5 RIGHT JOIN 右连接

右连接返回右表的所有行，即使左表中没有匹配。

### 基本语法

```sql
SELECT 列名
FROM 表1
RIGHT JOIN 表2 ON 连接条件;
```

### 示例代码

```sql
-- 查询所有班级及其学生（包括没有学生的班级）
SELECT s.name, c.class_name
FROM students s
RIGHT JOIN classes c ON s.class_id = c.id;
-- 所有班级都会返回，数学1班没有学生，name 显示为 NULL

-- RIGHT JOIN 等价于交换表位置的 LEFT JOIN
-- 上面这条语句等价于：
SELECT c.class_name, s.name
FROM classes c
LEFT JOIN students s ON c.id = s.class_id;
-- 只是列的顺序不同
```

> **建议**：RIGHT JOIN 可以用 LEFT JOIN 交换表位置来实现，建议统一使用 LEFT JOIN，代码更易读。

---

## 6 模拟 FULL JOIN 全连接

MySQL 不直接支持 FULL JOIN，但可以用 UNION 模拟。

### 示例代码

```sql
-- 查询所有学生和所有班级（包括没有班级的学生和没有学生的班级）
SELECT s.name, c.class_name
FROM students s
LEFT JOIN classes c ON s.class_id = c.id

UNION

SELECT s.name, c.class_name
FROM students s
RIGHT JOIN classes c ON s.class_id = c.id;
-- UNION 会去重，如果想要保留重复行，用 UNION ALL

-- 使用 UNION ALL 保留所有行
SELECT s.name, c.class_name
FROM students s
LEFT JOIN classes c ON s.class_id = c.id

UNION ALL

SELECT s.name, c.class_name
FROM students s
RIGHT JOIN classes c ON s.class_id = c.id
WHERE s.class_id IS NULL;
-- 第二部分只取右表独有的行，避免重复
```

> **原理**：FULL JOIN 返回两个表的所有行。MySQL 用 UNION 组合 LEFT JOIN 和 RIGHT JOIN 来模拟。

---

## 7 自连接

自连接是表和自己进行连接，常用于处理层级关系。

### 示例代码

```sql
-- 创建员工表（包含上级关系）
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(20),
    manager_id INT
);

-- 插入数据
INSERT INTO employees (id, name, manager_id) VALUES
(1, '老板', NULL),
(2, '经理A', 1),
(3, '经理B', 1),
(4, '员工A1', 2),
(5, '员工A2', 2),
(6, '员工B1', 3);

-- 查询每个员工及其上级
SELECT e.name AS 员工, m.name AS 上级
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
-- 表和自己连接，需要起不同的别名
-- 结果：
-- 老板 | NULL
-- 经理A | 老板
-- 经理B | 老板
-- 员工A1 | 经理A
-- 员工A2 | 经理A
-- 员工B1 | 经理B

-- 查询"员工A1"的上级是谁
SELECT e.name AS 员工, m.name AS 上级
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
WHERE e.name = '员工A1';
-- 结果：员工A1 | 经理A
```

> **原理**：自连接把一张表当作两张表来用，通过别名区分。常用于处理树形结构、层级关系。

---

## 8 交叉连接

交叉连接返回两个表的笛卡尔积，即所有可能的组合。

### 示例代码

```sql
-- 交叉连接
SELECT s.name, c.class_name
FROM students s
CROSS JOIN classes c;
-- 返回 4 * 3 = 12 行，每个学生和每个班级的所有组合

-- 交叉连接等价于不带连接条件的 INNER JOIN
SELECT s.name, c.class_name
FROM students s, classes c;
-- 这种写法不推荐，可读性差

-- 实际应用场景：生成日期和用户的组合
SELECT u.name, d.date
FROM users u
CROSS JOIN dates d;
-- 每个用户和每个日期的组合，常用于生成报表
```

> **注意**：交叉连接会产生大量数据，使用时要谨慎。

---

## 9 多表连接

可以连接三个或更多的表。

### 示例代码

```sql
-- 查询学生的姓名、班级和成绩
SELECT s.name, c.class_name, sc.course, sc.score
FROM students s
INNER JOIN classes c ON s.class_id = c.id
INNER JOIN scores sc ON s.id = sc.student_id;
-- 先连接 students 和 classes，再连接 scores

-- 使用 LEFT JOIN 保留所有学生
SELECT s.name, c.class_name, sc.course, sc.score
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN scores sc ON s.id = sc.student_id;
-- 所有学生都会返回，即使没有班级或成绩

-- 查询计算机1班学生的数学成绩
SELECT s.name, c.class_name, sc.score
FROM students s
INNER JOIN classes c ON s.class_id = c.id
INNER JOIN scores sc ON s.id = sc.student_id
WHERE c.class_name = '计算机1班' AND sc.course = '数学';
-- 多表连接后可以加 WHERE 条件

-- 统计每个班级每门课程的平均分
SELECT c.class_name, sc.course, AVG(sc.score) AS 平均分
FROM students s
INNER JOIN classes c ON s.class_id = c.id
INNER JOIN scores sc ON s.id = sc.student_id
GROUP BY c.class_name, sc.course;
-- 多表连接后可以使用 GROUP BY 分组统计
```

> **原理**：多表连接按顺序执行，先连接前两个表，再连接第三个表，依此类推。

---

## 10 核心知识点总结

| 连接类型 | 说明 | 返回结果 |
|---------|------|---------|
| INNER JOIN | 内连接 | 只返回匹配的行 |
| LEFT JOIN | 左连接 | 返回左表所有行，右表不匹配显示 NULL |
| RIGHT JOIN | 右连接 | 返回右表所有行，左表不匹配显示 NULL |
| FULL JOIN | 全连接 | 返回两个表所有行（MySQL 用 UNION 模拟） |
| 自连接 | 表和自己连接 | 处理层级关系 |
| CROSS JOIN | 交叉连接 | 返回笛卡尔积 |

### 连接类型选择

| 场景 | 推荐连接类型 |
|-----|------------|
| 只查询有对应关系的数据 | INNER JOIN |
| 左表数据必须全部显示 | LEFT JOIN |
| 右表数据必须全部显示 | RIGHT JOIN |
| 两个表数据都要全部显示 | FULL JOIN（UNION 模拟） |
| 处理层级关系（如员工-上级） | 自连接 |

---

## 11 新手常见误区

### 误区 1："INNER JOIN 和 LEFT JOIN 结果一样"

不一样。INNER JOIN 只返回匹配的行，LEFT JOIN 返回左表所有行。

```sql
-- INNER JOIN：只返回有班级的学生
SELECT s.name, c.class_name
FROM students s
INNER JOIN classes c ON s.class_id = c.id;
-- 赵六不会出现在结果中

-- LEFT JOIN：返回所有学生
SELECT s.name, c.class_name
FROM students s
LEFT JOIN classes c ON s.class_id = c.id;
-- 赵六也会出现，class_name 为 NULL
```

### 误区 2："连接条件可以用 WHERE 代替"

不推荐。虽然可以用 WHERE 实现连接，但可读性差。

```sql
-- 不推荐：用 WHERE 实现连接
SELECT s.name, c.class_name
FROM students s, classes c
WHERE s.class_id = c.id;

-- 推荐：使用 JOIN 语法
SELECT s.name, c.class_name
FROM students s
INNER JOIN classes c ON s.class_id = c.id;
-- JOIN 语法更清晰，易于维护
```

### 误区 3："自连接没有意义"

不对。自连接在处理层级关系时非常有用。

```sql
-- 查询员工及其上级
SELECT e.name AS 员工, m.name AS 上级
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
-- 这种层级关系只能用自连接实现
```

### 误区 4："多表连接性能很差"

不一定。如果连接字段有索引，性能不会太差。

```sql
-- 为连接字段添加索引
ALTER TABLE students ADD INDEX idx_class_id (class_id);
ALTER TABLE scores ADD INDEX idx_student_id (student_id);
-- 有索引后，连接查询性能会大幅提升
```

---

## 12 动手练习

### 练习 1：基础连接

有两个表：`departments`（部门表）和 `employees`（员工表）。查询：
1. 每个员工及其所在部门
2. 所有部门及其员工（包括没有员工的部门）
3. 研发部的所有员工

<details>
<summary>点击查看答案</summary>

```sql
-- 假设表结构如下
-- departments: id, department_name
-- employees: id, name, department_id

-- 1. 每个员工及其所在部门
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- 2. 所有部门及其员工（包括没有员工的部门）
SELECT d.department_name, e.name
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id;

-- 3. 研发部的所有员工
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
WHERE d.department_name = '研发部';
```

</details>

### 练习 2：多表连接

有三个表：`students`（学生）、`courses`（课程）、`scores`（成绩）。查询：
1. 每个学生的每门课程成绩
2. 张三的所有课程成绩
3. 每门课程的平均分

<details>
<summary>点击查看答案</summary>

```sql
-- 假设表结构如下
-- students: id, name
-- courses: id, course_name
-- scores: id, student_id, course_id, score

-- 1. 每个学生的每门课程成绩
SELECT s.name, c.course_name, sc.score
FROM students s
INNER JOIN scores sc ON s.id = sc.student_id
INNER JOIN courses c ON sc.course_id = c.id;

-- 2. 张三的所有课程成绩
SELECT s.name, c.course_name, sc.score
FROM students s
INNER JOIN scores sc ON s.id = sc.student_id
INNER JOIN courses c ON sc.course_id = c.id
WHERE s.name = '张三';

-- 3. 每门课程的平均分
SELECT c.course_name, AVG(sc.score) AS 平均分
FROM courses c
INNER JOIN scores sc ON c.id = sc.course_id
GROUP BY c.course_name;
```

</details>

### 练习 3（挑战）：综合应用

有一个电商系统的数据库，包含以下表：
- `users`（用户）：id, name
- `orders`（订单）：id, user_id, order_date, amount
- `order_items`（订单明细）：id, order_id, product_id, quantity, price
- `products`（商品）：id, product_name, category

查询：
1. 每个用户的订单总数和总消费金额
2. 2026 年每个月的销售额
3. 每个类别的商品销售数量
4. 消费金额最高的前 5 名用户

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 每个用户的订单总数和总消费金额
SELECT u.name, COUNT(DISTINCT o.id) AS 订单数, SUM(o.amount) AS 总金额
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.name;

-- 2. 2026 年每个月的销售额
SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS 月份, SUM(o.amount) AS 销售额
FROM orders o
WHERE YEAR(o.order_date) = 2026
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
ORDER BY 月份;

-- 3. 每个类别的商品销售数量
SELECT p.category, SUM(oi.quantity) AS 销售数量
FROM products p
INNER JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.category;

-- 4. 消费金额最高的前 5 名用户
SELECT u.name, SUM(o.amount) AS 总消费
FROM users u
INNER JOIN orders o ON u.id = o.user_id
GROUP BY u.name
ORDER BY 总消费 DESC
LIMIT 5;
```

</details>

---

## 下一章预告

下一章我们会学习 **子查询与嵌套**——也就是如何在一条 SQL 语句中嵌入另一条 SQL 语句。你会学到 WHERE 子查询、FROM 子查询（派生表）、EXISTS 和 NOT EXISTS，以及相关子查询。子查询能让你实现更复杂的查询逻辑。
