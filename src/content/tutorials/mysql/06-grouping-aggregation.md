---
title: "第6章：分组与聚合"
description: "GROUP BY、HAVING、COUNT、SUM、AVG"
---

# 第6章：分组与聚合

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么统计每个班级的学生人数？
- 怎么计算每个月的总销售额？
- GROUP BY 和 ORDER BY 有什么区别？
- HAVING 和 WHERE 有什么不同？
- 多个字段可以一起分组吗？

这一章就是为了解答这些问题。我们会学习 **GROUP BY 分组**、**HAVING 过滤**，以及 **聚合函数的组合使用**。学完这章，你就能轻松完成各种统计分析任务了。

---

## 1 为什么需要分组与聚合？

### 痛点分析

想象你是一个学校的管理员，需要统计各种数据：

- 每个班级有多少学生？
- 每个班级的平均成绩是多少？
- 每个月的销售总额是多少？
- 哪些班级的平均成绩低于 60 分？

如果没有分组功能，你只能一个一个班级手动筛选、手动计算，效率极低。

### 解决方案

分组与聚合就像**自动统计助手**：

> 你去超市买东西，收银员会按商品类别帮你汇总：水果多少钱、零食多少钱、饮料多少钱。GROUP BY 就是让数据库自动帮你做这种"分类汇总"的工作。

### 对比一下

| 没有分组 | 有分组 |
|---------|-------|
| 手动筛选每个班级 | 一条语句统计所有班级 |
| 手动计算平均值 | AVG 自动计算 |
| 统计结果分散 | 一次性返回所有统计 |

> **一句话总结**：GROUP BY 把数据按某个字段分成若干组，聚合函数对每组数据进行计算，一条语句就能完成复杂的统计。

---

## 2 GROUP BY 基础分组

### 基本语法

```sql
SELECT 分组列, 聚合函数(列)
FROM 表名
GROUP BY 分组列;
```

### 示例代码

```sql
-- 统计每个班级的学生人数
SELECT class, COUNT(*) AS 学生人数
FROM students
GROUP BY class;
-- GROUP BY class 表示按班级分组
-- 每个班级会返回一行统计结果

-- 计算每个班级的平均成绩
SELECT class, AVG(score) AS 平均成绩
FROM students
GROUP BY class;
-- 先按班级分组，再对每组的成绩求平均

-- 计算每个班级的总分
SELECT class, SUM(score) AS 总分
FROM students
GROUP BY class;
-- 先按班级分组，再对每组的成绩求和

-- 查询每个班级的最高分和最低分
SELECT class, MAX(score) AS 最高分, MIN(score) AS 最低分
FROM students
GROUP BY class;
-- 对每组分别求最大值和最小值
```

> **原理**：GROUP BY 执行时，数据库会先按指定列把数据分成若干组，然后对每组分别执行聚合函数。

---

## 3 多字段分组

可以按多个字段进行分组，分组时会考虑所有指定的列。

### 示例代码

```sql
-- 统计每个班级男女生的人数
SELECT class, gender, COUNT(*) AS 人数
FROM students
GROUP BY class, gender;
-- 先按班级分组，再按性别分组
-- 结果类似：
-- 计算机1班 | 男 | 15
-- 计算机1班 | 女 | 10
-- 计算机2班 | 男 | 12
-- 计算机2班 | 女 | 13

-- 统计每年每个月的订单数
SELECT YEAR(order_date) AS 年份, MONTH(order_date) AS 月份, COUNT(*) AS 订单数
FROM orders
GROUP BY YEAR(order_date), MONTH(order_date);
-- 按年份和月份分组统计

-- 统计每个部门每个职位的平均薪资
SELECT department, job_title, AVG(salary) AS 平均薪资
FROM employees
GROUP BY department, job_title;
-- 两个字段组合分组
```

> **注意**：SELECT 中出现的非聚合列，必须出现在 GROUP BY 中。否则 MySQL 会报错或返回不确定的结果。

---

## 4 HAVING 过滤分组

WHERE 在分组前过滤行，HAVING 在分组后过滤组。

### WHERE 和 HAVING 的区别

| 特性 | WHERE | HAVING |
|-----|-------|--------|
| 作用时机 | 分组前过滤行 | 分组后过滤组 |
| 能否使用聚合函数 | 不能 | 能 |
| 作用对象 | 单行数据 | 分组结果 |

### 示例代码

```sql
-- 查询学生人数大于 20 的班级
SELECT class, COUNT(*) AS 学生人数
FROM students
GROUP BY class
HAVING COUNT(*) > 20;
-- HAVING 过滤分组结果，只返回人数大于 20 的班级

-- 查询平均成绩大于 80 分的班级
SELECT class, AVG(score) AS 平均成绩
FROM students
GROUP BY class
HAVING AVG(score) > 80;
-- HAVING 中可以使用聚合函数，WHERE 不行

-- 查询总分超过 1000 的班级
SELECT class, SUM(score) AS 总分
FROM students
GROUP BY class
HAVING SUM(score) > 1000;

-- 先用 WHERE 过滤，再用 GROUP BY 分组，最后用 HAVING 过滤
SELECT class, AVG(score) AS 平均成绩
FROM students
WHERE age > 18          -- 第一步：过滤年龄大于 18 的学生
GROUP BY class          -- 第二步：按班级分组
HAVING AVG(score) > 70; -- 第三步：过滤平均成绩大于 70 的班级

-- 查询男生人数超过女生的班级
SELECT class
FROM students
GROUP BY class, gender
HAVING gender = '男' AND COUNT(*) > (
    SELECT COUNT(*)
    FROM students s2
    WHERE s2.class = students.class AND s2.gender = '女'
);
```

> **原理**：SQL 的执行顺序是 WHERE -> GROUP BY -> HAVING -> ORDER BY -> LIMIT。WHERE 先过滤行，GROUP BY 再分组，HAVING 最后过滤组。

---

## 5 聚合函数组合使用

### 示例代码

```sql
-- 统计每个班级的各项指标
SELECT 
    class AS 班级,
    COUNT(*) AS 人数,
    SUM(score) AS 总分,
    AVG(score) AS 平均分,
    MAX(score) AS 最高分,
    MIN(score) AS 最低分
FROM students
GROUP BY class;
-- 一条语句返回多个统计指标

-- 统计每个类别的商品数量和平均价格
SELECT 
    category AS 类别,
    COUNT(*) AS 商品数量,
    AVG(price) AS 平均价格,
    SUM(stock) AS 总库存
FROM products
GROUP BY category;

-- 查询订单数超过 5 个的用户
SELECT 
    user_id,
    COUNT(*) AS 订单数,
    SUM(amount) AS 总金额
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 5;

-- 查询每月销售额并排序
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') AS 月份,
    COUNT(*) AS 订单数,
    SUM(amount) AS 销售额
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY 月份 DESC;
-- 先分组统计，再按月份降序排列
```

---

## 6 WITH ROLLUP 汇总

WITH ROLLUP 会在分组统计结果的最后添加一行汇总数据。

### 示例代码

```sql
-- 统计每个班级的人数，并在最后添加总计行
SELECT class, COUNT(*) AS 人数
FROM students
GROUP BY class WITH ROLLUP;
-- 结果类似：
-- 计算机1班 | 25
-- 计算机2班 | 30
-- 数学1班   | 20
-- NULL      | 75    <-- 这是汇总行，表示所有班级的总人数

-- 多字段分组时使用 WITH ROLLUP
SELECT class, gender, COUNT(*) AS 人数
FROM students
GROUP BY class, gender WITH ROLLUP;
-- 会在每个层级添加汇总行

-- 使用 GROUPING 函数判断是否为汇总行
SELECT 
    IF(GROUPING(class), '总计', class) AS 班级,
    COUNT(*) AS 人数
FROM students
GROUP BY class WITH ROLLUP;
-- GROUPING(class) 返回 1 表示是汇总行
```

> **原理**：WITH ROLLUP 在 GROUP BY 的结果基础上，逐级添加汇总行。类似于 Excel 中的"分类汇总"功能。

---

## 7 核心知识点总结

| 语法 | 作用 | 使用场景 |
|-----|------|---------|
| GROUP BY | 按指定列分组 | 统计每个班级的学生数 |
| HAVING | 过滤分组结果 | 筛选人数大于 20 的班级 |
| COUNT() | 统计记录数 | 统计总数 |
| SUM() | 求和 | 计算总分、总销售额 |
| AVG() | 平均值 | 计算平均成绩、平均价格 |
| MAX() | 最大值 | 找出最高分 |
| MIN() | 最小值 | 找出最低分 |
| WITH ROLLUP | 添加汇总行 | 在结果末尾添加总计 |

### SQL 执行顺序

```
FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT
```

| 步骤 | 说明 |
|-----|------|
| FROM | 确定数据源表 |
| WHERE | 过滤行 |
| GROUP BY | 分组 |
| HAVING | 过滤分组 |
| SELECT | 选择要返回的列 |
| ORDER BY | 排序 |
| LIMIT | 限制返回数量 |

---

## 8 新手常见误区

### 误区 1："SELECT 的列不用出现在 GROUP BY 中"

错！SELECT 中非聚合列必须出现在 GROUP BY 中。

```sql
-- 错误：name 没有出现在 GROUP BY 中
-- SELECT class, name, COUNT(*) FROM students GROUP BY class;

-- 正确：非聚合列必须在 GROUP BY 中
SELECT class, COUNT(*) FROM students GROUP BY class;
-- 或
SELECT class, name, COUNT(*) FROM students GROUP BY class, name;
```

### 误区 2："WHERE 中可以使用聚合函数"

不行。WHERE 在分组前执行，此时还没有分组结果，不能使用聚合函数。

```sql
-- 错误：WHERE 中不能使用聚合函数
-- SELECT class, AVG(score) FROM students WHERE AVG(score) > 80 GROUP BY class;

-- 正确：用 HAVING 过滤分组结果
SELECT class, AVG(score) AS avg_score
FROM students
GROUP BY class
HAVING AVG(score) > 80;
```

### 误区 3："GROUP BY 和 ORDER BY 是一样的"

不一样。GROUP BY 是分组，ORDER BY 是排序。

```sql
-- GROUP BY：分组统计
SELECT class, COUNT(*) FROM students GROUP BY class;
-- 把数据按班级分成若干组，统计每组的人数

-- ORDER BY：排序
SELECT * FROM students ORDER BY class;
-- 按班级排序显示所有学生
```

### 误区 4："HAVING 和 WHERE 可以互换"

不能互换。WHERE 过滤行，HAVING 过滤组。

```sql
-- WHERE：在分组前过滤行
SELECT class, AVG(score) FROM students WHERE age > 18 GROUP BY class;
-- 先过滤年龄大于 18 的学生，再分组统计

-- HAVING：在分组后过滤组
SELECT class, AVG(score) FROM students GROUP BY class HAVING AVG(score) > 80;
-- 先分组统计，再筛选平均成绩大于 80 的班级
```

### 误区 5："GROUP BY 后只能用聚合函数"

不是的。GROUP BY 后可以使用聚合函数，也可以使用分组列。

```sql
-- 正确：GROUP BY 后可以使用分组列和聚合函数
SELECT class, COUNT(*), AVG(score)
FROM students
GROUP BY class;
-- class 是分组列，COUNT 和 AVG 是聚合函数
```

---

## 9 动手练习

### 练习 1：基础分组

有一个 `employees` 表，包含 id、name、department、salary、hire_date 字段。查询：
1. 每个部门的员工人数
2. 每个部门的平均薪资
3. 每个部门的最高和最低薪资

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 每个部门的员工人数
SELECT department, COUNT(*) AS 员工人数
FROM employees
GROUP BY department;

-- 2. 每个部门的平均薪资
SELECT department, AVG(salary) AS 平均薪资
FROM employees
GROUP BY department;

-- 3. 每个部门的最高和最低薪资
SELECT department, MAX(salary) AS 最高薪资, MIN(salary) AS 最低薪资
FROM employees
GROUP BY department;
```

</details>

### 练习 2：HAVING 过滤

继续上面的 `employees` 表，查询：
1. 员工人数超过 10 人的部门
2. 平均薪资高于 15000 的部门
3. 2024 年入职员工超过 5 人的部门

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 员工人数超过 10 人的部门
SELECT department, COUNT(*) AS 员工人数
FROM employees
GROUP BY department
HAVING COUNT(*) > 10;

-- 2. 平均薪资高于 15000 的部门
SELECT department, AVG(salary) AS 平均薪资
FROM employees
GROUP BY department
HAVING AVG(salary) > 15000;

-- 3. 2024 年入职员工超过 5 人的部门
SELECT department, COUNT(*) AS 入职人数
FROM employees
WHERE YEAR(hire_date) = 2024
GROUP BY department
HAVING COUNT(*) > 5;
-- 先用 WHERE 过滤 2024 年入职的员工，再分组统计
```

</details>

### 练习 3（挑战）：综合统计

有一个 `sales` 表，包含 id、product_id、sale_date、quantity、unit_price 字段。查询：
1. 每个产品的总销售额（quantity * unit_price）
2. 每月总销售额，并按月份排序
3. 销售额超过 10000 的产品
4. 使用 WITH ROLLUP 显示所有产品的总销售额

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 每个产品的总销售额
SELECT 
    product_id,
    SUM(quantity * unit_price) AS 总销售额
FROM sales
GROUP BY product_id;

-- 2. 每月总销售额，按月份排序
SELECT 
    DATE_FORMAT(sale_date, '%Y-%m') AS 月份,
    SUM(quantity * unit_price) AS 月销售额
FROM sales
GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
ORDER BY 月份 ASC;

-- 3. 销售额超过 10000 的产品
SELECT 
    product_id,
    SUM(quantity * unit_price) AS 总销售额
FROM sales
GROUP BY product_id
HAVING SUM(quantity * unit_price) > 10000;

-- 4. 使用 WITH ROLLUP 显示总销售额
SELECT 
    IF(GROUPING(product_id), '总计', product_id) AS 产品,
    SUM(quantity * unit_price) AS 总销售额
FROM sales
GROUP BY product_id WITH ROLLUP;
```

</details>

---

## 下一章预告

下一章我们会学习 **连接查询**——也就是如何把多个表的数据关联起来查询。你会学到 INNER JOIN、LEFT JOIN、RIGHT JOIN 等连接方式，以及如何通过外键关系把学生表和成绩表、课程表联合查询。这是关系型数据库最强大的功能之一。
