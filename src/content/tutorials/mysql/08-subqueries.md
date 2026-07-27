---
title: "第8章：子查询与嵌套"
description: "标量子查询、列子查询、行子查询、相关子查询"
---

# 第8章：子查询与嵌套

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是子查询？它和普通查询有什么区别？
- 子查询可以放在哪些位置？
- EXISTS 和 IN 有什么区别？
- 什么是相关子查询？它和普通子查询有什么不同？
- 子查询性能差，该怎么优化？

这一章就是为了解答这些问题。我们会学习 **WHERE 子查询**、**FROM 子查询**、**EXISTS 和 NOT EXISTS**，以及 **相关子查询** 和优化建议。学完这章，你就能实现更复杂的查询逻辑了。

---

## 1 为什么需要子查询？

### 痛点分析

有些查询需求，用一条简单的 SQL 无法实现。比如：

- 查询成绩高于平均分的学生
- 查询有订单的用户信息
- 查询每个类别中价格最高的商品
- 查询不存在员工的部门

这些需求都需要"先查一个结果，再用这个结果去查另一个"，普通查询无法一步完成。

### 解决方案

子查询就像**嵌套的俄罗斯套娃**：

> 你要找"班上成绩最好的学生"，需要先查出最高分是多少（第一个查询），再找出谁得了这个分数（第二个查询）。子查询就是把这两个查询嵌套在一起，一条语句搞定。

### 对比一下

| 不用子查询 | 用子查询 |
|-----------|---------|
| 需要多次查询，程序中拼接 | 一条语句完成 |
| 代码复杂，难以维护 | 逻辑清晰，易于理解 |
| 可能出错 | 数据库自动处理 |

> **一句话总结**：子查询让你在一个查询中嵌入另一个查询，实现"先查这个，再用结果查那个"的复杂逻辑。

---

## 2 子查询的类型

根据返回结果的不同，子查询分为四类：

| 类型 | 返回结果 | 使用场景 |
|-----|---------|---------|
| 标量子查询 | 单个值 | WHERE 中与 =、>、< 等比较 |
| 列子查询 | 一列多行 | WHERE 中与 IN、ANY、ALL 配合 |
| 行子查询 | 一行多列 | WHERE 中与多列比较 |
| 表子查询 | 多行多列 | FROM 中作为派生表 |

---

## 3 WHERE 子查询

子查询放在 WHERE 子句中，用来提供过滤条件。

### 标量子查询

```sql
-- 查询成绩高于平均分的学生
SELECT name, score
FROM students
WHERE score > (SELECT AVG(score) FROM students);
-- 先执行括号内的子查询，算出平均分
-- 再执行外层查询，筛选成绩高于平均分的学生

-- 查询年龄最大的学生信息
SELECT name, age
FROM students
WHERE age = (SELECT MAX(age) FROM students);
-- 先查出最大年龄，再找出这个年龄的学生

-- 查询和"张三"同班级的学生
SELECT name, class_id
FROM students
WHERE class_id = (SELECT class_id FROM students WHERE name = '张三')
AND name != '张三';
-- 先查出张三的班级ID，再找同班的其他学生
```

> **原理**：标量子查询返回单个值，可以和 =、>、<、>=、<=、<> 等运算符配合使用。

### 列子查询

```sql
-- 查询有订单的用户
SELECT name
FROM users
WHERE id IN (SELECT user_id FROM orders);
-- 先查出所有订单的 user_id，再找出在这些 ID 中的用户

-- 查询没有订单的用户
SELECT name
FROM users
WHERE id NOT IN (SELECT user_id FROM orders);
-- 先查出有订单的 user_id，再排除这些用户

-- 查询成绩高于计算机1班所有学生的其他班学生
SELECT name, score
FROM students
WHERE score > ALL (SELECT score FROM students WHERE class_id = 1)
AND class_id != 1;
-- ALL 表示大于子查询结果中的所有值

-- 查询成绩高于计算机1班任意一个学生的其他班学生
SELECT name, score
FROM students
WHERE score > ANY (SELECT score FROM students WHERE class_id = 1)
AND class_id != 1;
-- ANY 表示大于子查询结果中的任意一个值即可

-- 查询年龄等于 20、21、22 岁的学生
SELECT name, age
FROM students
WHERE age IN (20, 21, 22);
-- 等价于 age = 20 OR age = 21 OR age = 22
```

> **原理**：列子查询返回一列多行，可以和 IN、NOT IN、ANY、ALL 配合使用。

---

## 4 FROM 子查询（派生表）

子查询放在 FROM 子句中，作为临时表使用。

### 示例代码

```sql
-- 查询每个班级中成绩最高的学生
SELECT s.class_id, s.name, s.score
FROM students s
INNER JOIN (
    SELECT class_id, MAX(score) AS max_score
    FROM students
    GROUP BY class_id
) AS max_scores ON s.class_id = max_scores.class_id AND s.score = max_scores.max_score;
-- 子查询作为临时表，先算出每个班的最高分
-- 再和原表连接，找出对应的学生

-- 查询平均成绩高于全校平均分的班级
SELECT class_id, avg_score
FROM (
    SELECT class_id, AVG(score) AS avg_score
    FROM students
    GROUP BY class_id
) AS class_avg
WHERE avg_score > (SELECT AVG(score) FROM students);
-- 子查询先算出每个班的平均分
-- 外层查询再筛选高于全校平均分的班级

-- 查询每个用户的订单总数和总消费
SELECT u.name, order_stats.order_count, order_stats.total_amount
FROM users u
INNER JOIN (
    SELECT user_id, COUNT(*) AS order_count, SUM(amount) AS total_amount
    FROM orders
    GROUP BY user_id
) AS order_stats ON u.id = order_stats.user_id;
-- 子查询先统计每个用户的订单信息
-- 再和 users 表连接，获取用户姓名

-- 查询成绩排名前 10 的学生的详细信息
SELECT *
FROM (
    SELECT name, score, RANK() OVER (ORDER BY score DESC) AS rank_num
    FROM students
) AS ranked_students
WHERE rank_num <= 10;
-- 子查询先给所有学生排名
-- 外层查询筛选前 10 名
```

> **原理**：FROM 子查询的结果作为临时表，外层查询可以像操作普通表一样操作它。必须给子查询起别名。

---

## 5 EXISTS 和 NOT EXISTS

EXISTS 检查子查询是否返回至少一行数据，返回 TRUE 或 FALSE。

### 示例代码

```sql
-- 查询有订单的用户
SELECT name
FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);
-- 对每个用户，检查是否存在对应的订单
-- 如果存在，返回该用户

-- 查询没有订单的用户
SELECT name
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);
-- 对每个用户，检查是否不存在对应的订单

-- 查询有员工的部门
SELECT department_name
FROM departments d
WHERE EXISTS (
    SELECT 1 FROM employees e WHERE e.department_id = d.id
);

-- 查询没有员工的部门
SELECT department_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.department_id = d.id
);

-- 查询至少选修了 3 门课程的学生
SELECT name
FROM students s
WHERE EXISTS (
    SELECT 1 FROM scores sc 
    WHERE sc.student_id = s.id 
    GROUP BY sc.student_id 
    HAVING COUNT(DISTINCT course_id) >= 3
);
```

> **原理**：EXISTS 只关心子查询是否返回数据，不关心具体返回什么。通常比 IN 更高效，因为找到第一条匹配就停止搜索。

---

## 6 相关子查询

相关子查询是依赖外层查询的子查询，每处理外层的一行，子查询就执行一次。

### 示例代码

```sql
-- 查询每个班级中成绩最高的学生
SELECT s.class_id, s.name, s.score
FROM students s
WHERE s.score = (
    SELECT MAX(score)
    FROM students s2
    WHERE s2.class_id = s.class_id
);
-- 对每个班级，子查询找出该班的最高分
-- 外层查询筛选成绩等于最高分的学生

-- 查询每个用户最近的一笔订单
SELECT o.user_id, o.order_date, o.amount
FROM orders o
WHERE o.order_date = (
    SELECT MAX(order_date)
    FROM orders o2
    WHERE o2.user_id = o.user_id
);
-- 对每个用户，子查询找出最近的订单日期
-- 外层查询筛选这个日期的订单

-- 查询薪资高于本部门平均薪资的员工
SELECT e.name, e.department_id, e.salary
FROM employees e
WHERE e.salary > (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department_id = e.department_id
);
-- 对每个部门，子查询算出平均薪资
-- 外层查询筛选高于平均薪资的员工

-- 查询每个类别中价格最高的商品
SELECT p.category, p.name, p.price
FROM products p
WHERE p.price = (
    SELECT MAX(price)
    FROM products p2
    WHERE p2.category = p.category
);
-- 对每个类别，子查询找出最高价格
-- 外层查询筛选价格等于最高价的商品
```

> **原理**：相关子查询会引用外层查询的列，每处理外层的一行，子查询就执行一次。性能可能较差，需要优化。

---

## 7 子查询优化建议

子查询虽然强大，但性能可能较差。以下是一些优化建议。

### 用 JOIN 替代子查询

```sql
-- 不推荐：用子查询
SELECT name
FROM users
WHERE id IN (SELECT user_id FROM orders);

-- 推荐：用 JOIN
SELECT DISTINCT u.name
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
-- JOIN 通常比 IN 子查询更高效

-- 不推荐：相关子查询
SELECT s.name, s.score
FROM students s
WHERE s.score = (
    SELECT MAX(score)
    FROM students s2
    WHERE s2.class_id = s.class_id
);

-- 推荐：用 JOIN 和 GROUP BY
SELECT s.class_id, s.name, s.score
FROM students s
INNER JOIN (
    SELECT class_id, MAX(score) AS max_score
    FROM students
    GROUP BY class_id
) AS max_scores ON s.class_id = max_scores.class_id AND s.score = max_scores.max_score;
```

### 用 EXISTS 替代 IN

```sql
-- 不推荐：IN 子查询
SELECT name
FROM users
WHERE id IN (SELECT user_id FROM orders);

-- 推荐：EXISTS
SELECT name
FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
-- EXISTS 找到第一条匹配就停止，通常更高效
```

### 避免在子查询中使用 SELECT *

```sql
-- 不推荐
SELECT name
FROM users
WHERE id IN (SELECT * FROM orders);

-- 推荐：只查询需要的列
SELECT name
FROM users
WHERE id IN (SELECT user_id FROM orders);
```

### 为子查询字段添加索引

```sql
-- 为子查询中常用的字段添加索引
ALTER TABLE orders ADD INDEX idx_user_id (user_id);
ALTER TABLE scores ADD INDEX idx_student_id (student_id);
-- 有索引后，子查询性能会大幅提升
```

---

## 8 核心知识点总结

| 子查询类型 | 位置 | 返回结果 | 使用场景 |
|-----------|------|---------|---------|
| 标量子查询 | WHERE | 单个值 | 与 =、>、< 等比较 |
| 列子查询 | WHERE | 一列多行 | 与 IN、ANY、ALL 配合 |
| 表子查询 | FROM | 多行多列 | 作为派生表 |
| EXISTS | WHERE | TRUE/FALSE | 检查是否存在匹配 |
| 相关子查询 | WHERE | 依赖外层 | 每行执行一次 |

### 子查询 vs JOIN

| 特性 | 子查询 | JOIN |
|-----|-------|------|
| 可读性 | 逻辑清晰 | 需要理解连接 |
| 性能 | 可能较差 | 通常更好 |
| 适用场景 | 存在性检查、复杂条件 | 多表关联查询 |
| 优化建议 | 用 EXISTS 替代 IN | 为连接字段加索引 |

---

## 9 新手常见误区

### 误区 1："子查询和 JOIN 可以随意替换"

不对。虽然很多场景可以替换，但性能和语义可能不同。

```sql
-- 子查询：查询有订单的用户
SELECT name FROM users WHERE id IN (SELECT user_id FROM orders);

-- JOIN：查询有订单的用户
SELECT DISTINCT u.name FROM users u INNER JOIN orders o ON u.id = o.user_id;
-- 结果相同，但 JOIN 通常性能更好
```

### 误区 2："子查询中可以使用外层查询的表，不需要相关子查询"

不对。相关子查询必须引用外层查询的列。

```sql
-- 相关子查询：引用外层查询的 s.class_id
SELECT s.name, s.score
FROM students s
WHERE s.score = (
    SELECT MAX(score)
    FROM students s2
    WHERE s2.class_id = s.class_id  -- 引用了外层的 s.class_id
);
```

### 误区 3："EXISTS 和 IN 性能一样"

不一样。EXISTS 通常比 IN 更高效。

```sql
-- 不推荐：IN 子查询
SELECT name FROM users WHERE id IN (SELECT user_id FROM orders);

-- 推荐：EXISTS
SELECT name FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
-- EXISTS 找到第一条匹配就停止，IN 需要扫描所有结果
```

### 误区 4："子查询中可以用 ORDER BY"

可以，但通常没有意义。子查询的结果会被外层查询使用，排序没有实际作用。

```sql
-- 没有意义：子查询中排序
SELECT name FROM users WHERE id IN (SELECT user_id FROM orders ORDER BY amount);

-- 正确：在外层查询排序
SELECT u.name, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id
ORDER BY o.amount;
```

### 误区 5："FROM 子查询不需要别名"

错！FROM 子查询必须起别名。

```sql
-- 错误：FROM 子查询没有别名
-- SELECT * FROM (SELECT class_id, AVG(score) FROM students GROUP BY class_id);

-- 正确：给子查询起别名
SELECT * FROM (
    SELECT class_id, AVG(score) AS avg_score
    FROM students
    GROUP BY class_id
) AS class_avg;
-- 必须给子查询起别名，否则报错
```

---

## 10 动手练习

### 练习 1：标量子查询

有一个 `employees` 表，包含 id、name、department_id、salary 字段。查询：
1. 薪资高于平均薪资的员工
2. 薪资最高的员工信息
3. 和"张三"同部门的员工

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 薪资高于平均薪资的员工
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 2. 薪资最高的员工信息
SELECT name, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);

-- 3. 和"张三"同部门的员工
SELECT name, department_id
FROM employees
WHERE department_id = (SELECT department_id FROM employees WHERE name = '张三')
AND name != '张三';
```

</details>

### 练习 2：EXISTS 和 FROM 子查询

有两个表：`departments`（部门）和 `employees`（员工）。查询：
1. 有员工的部门
2. 没有员工的部门
3. 每个部门中薪资最高的员工

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 有员工的部门
SELECT department_name
FROM departments d
WHERE EXISTS (
    SELECT 1 FROM employees e WHERE e.department_id = d.id
);

-- 2. 没有员工的部门
SELECT department_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.department_id = d.id
);

-- 3. 每个部门中薪资最高的员工
SELECT d.department_name, e.name, e.salary
FROM employees e
INNER JOIN (
    SELECT department_id, MAX(salary) AS max_salary
    FROM employees
    GROUP BY department_id
) AS max_salaries ON e.department_id = max_salaries.department_id AND e.salary = max_salaries.max_salary
INNER JOIN departments d ON e.department_id = d.id;
```

</details>

### 练习 3（挑战）：综合应用

有一个电商系统的数据库，包含以下表：
- `users`（用户）：id, name
- `orders`（订单）：id, user_id, order_date, amount
- `products`（商品）：id, product_name, category, price

查询：
1. 购买过所有类别商品的用户
2. 每个类别中价格最高的商品
3. 订单金额高于该用户平均订单金额的订单
4. 没有订单的用户

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 购买过所有类别商品的用户
SELECT u.name
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM products p
    WHERE NOT EXISTS (
        SELECT 1 FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = u.id AND oi.product_id = p.id
    )
);
-- 双重 NOT EXISTS：不存在某个类别的商品该用户没有购买过

-- 2. 每个类别中价格最高的商品
SELECT p.category, p.product_name, p.price
FROM products p
WHERE p.price = (
    SELECT MAX(price)
    FROM products p2
    WHERE p2.category = p.category
);
-- 相关子查询：对每个类别找出最高价格

-- 3. 订单金额高于该用户平均订单金额的订单
SELECT o.user_id, o.amount
FROM orders o
WHERE o.amount > (
    SELECT AVG(amount)
    FROM orders o2
    WHERE o2.user_id = o.user_id
);
-- 相关子查询：对每个用户算出平均订单金额

-- 4. 没有订单的用户
SELECT u.name
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);
-- 或者用 LEFT JOIN
SELECT u.name
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;
```

</details>

---

## 下一章预告

恭喜你完成了 MySQL 基础语法的学习！从下一章开始，我们会进入更高级的主题，比如索引优化、事务处理、存储过程等。这些知识能帮你写出更高效、更安全的 SQL 代码。继续加油！
