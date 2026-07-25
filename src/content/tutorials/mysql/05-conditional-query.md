---
title: "第5章：条件查询与排序"
description: "WHERE、ORDER BY、LIMIT、聚合函数"
---

# 第5章：条件查询与排序

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么查询满足特定条件的数据？比如"年龄大于 20 岁的学生"
- 怎么对查询结果进行排序？比如按成绩从高到低
- 数据太多时，怎么分页显示？
- 怎么统计总数、求和、平均值？

这一章就是为了解答这些问题。我们会学习 **WHERE 条件查询**、**ORDER BY 排序**、**LIMIT 分页**，以及 **聚合函数** 的使用。学完这章，你就能精确地从数据库中找到需要的数据了。

---

## 5.1 为什么需要条件查询和排序？

### 痛点分析

想象你有一个包含 1000 名学生的表，如果没有条件查询和排序：

- 想找"计算机1班的学生"，只能把所有数据都取出来，然后人工筛选
- 想找出"成绩前 10 名的学生"，只能手动排序
- 想统计"全校有多少学生"，只能一行行数
- 想分页显示数据，不知道该怎么截取

### 解决方案

条件查询和排序就像**智能筛选器**：

> 你在淘宝购物，可以筛选"价格 100-500 元"、"销量从高到低"、"只看前 100 个结果"。数据库的条件查询和排序就是这个原理，帮你快速找到需要的数据。

### 对比一下

| 没有条件查询 | 有条件查询 |
|------------|-----------|
| 取出所有数据，人工筛选 | 直接查询符合条件的数据 |
| 手动排序，容易出错 | 自动排序，准确高效 |
| 统计靠数，容易遗漏 | 聚合函数秒级统计 |
| 无法分页 | LIMIT 轻松实现分页 |

> **一句话总结**：条件查询让你精确找到数据，排序让数据更有条理，聚合函数帮你快速统计。

---

## 5.2 WHERE 条件查询

WHERE 子句用来筛选满足条件的记录。

### 比较运算符

| 运算符 | 说明 | 示例 |
|-------|------|------|
| = | 等于 | WHERE age = 20 |
| <> 或 != | 不等于 | WHERE age != 20 |
| > | 大于 | WHERE age > 20 |
| < | 小于 | WHERE age < 20 |
| >= | 大于等于 | WHERE age >= 20 |
| <= | 小于等于 | WHERE age <= 20 |

### 示例代码

```sql
-- 查询年龄等于 20 岁的学生
SELECT * FROM students WHERE age = 20;
-- 只返回 age 等于 20 的记录

-- 查询年龄不等于 20 岁的学生
SELECT * FROM students WHERE age != 20;
-- 只返回 age 不等于 20 的记录

-- 查询年龄大于 20 岁的学生
SELECT * FROM students WHERE age > 20;
-- 只返回 age 大于 20 的记录

-- 查询年龄小于等于 25 岁的学生
SELECT * FROM students WHERE age <= 25;
-- 只返回 age 小于等于 25 的记录
```

---

## 5.3 逻辑运算符

当需要多个条件组合时，使用逻辑运算符。

### 逻辑运算符

| 运算符 | 说明 | 示例 |
|-------|------|------|
| AND | 且，多个条件都要满足 | WHERE age > 20 AND class = '计算机1班' |
| OR | 或，满足其中一个条件 | WHERE age > 20 OR class = '计算机1班' |
| NOT | 非，取反 | WHERE NOT age = 20 |

### 示例代码

```sql
-- 查询计算机1班且年龄大于 20 岁的学生
SELECT * FROM students 
WHERE class = '计算机1班' AND age > 20;
-- 必须同时满足两个条件：班级是"计算机1班"，且年龄大于 20

-- 查询计算机1班或年龄大于 20 岁的学生
SELECT * FROM students 
WHERE class = '计算机1班' OR age > 20;
-- 满足其中一个条件即可

-- 查询年龄不在 20-25 岁之间的学生
SELECT * FROM students 
WHERE NOT (age >= 20 AND age <= 25);
-- 等价于 age < 20 OR age > 25

-- 复杂条件组合
SELECT * FROM students 
WHERE (class = '计算机1班' OR class = '计算机2班') 
AND age > 20;
-- 先判断班级，再判断年龄
```

> **注意**：AND 的优先级高于 OR，必要时使用括号明确优先级。

---

## 5.4 高级条件查询

### BETWEEN 范围查询

```sql
-- 查询年龄在 20-25 岁之间的学生
SELECT * FROM students WHERE age BETWEEN 20 AND 25;
-- 等价于 age >= 20 AND age <= 25

-- 查询入学日期在 2024 年的学生
SELECT * FROM students 
WHERE enroll_date BETWEEN '2024-01-01' AND '2024-12-31';
-- 日期也可以用 BETWEEN
```

### IN 列表查询

```sql
-- 查询计算机1班、计算机2班、计算机3班的学生
SELECT * FROM students 
WHERE class IN ('计算机1班', '计算机2班', '计算机3班');
-- 等价于 class = '计算机1班' OR class = '计算机2班' OR class = '计算机3班'

-- 查询年龄为 20、22、24 岁的学生
SELECT * FROM students WHERE age IN (20, 22, 24);
-- 查询年龄在这些值中的学生
```

### LIKE 模糊查询

```sql
-- 查询姓"张"的学生
SELECT * FROM students WHERE name LIKE '张%';
-- % 表示任意多个字符，"张%"表示以"张"开头

-- 查询名字中包含"三"的学生
SELECT * FROM students WHERE name LIKE '%三%';
-- "%三%"表示名字中任意位置包含"三"

-- 查询姓"张"且名字只有两个字的学生
SELECT * FROM students WHERE name LIKE '张_';
-- _ 表示任意一个字符，"张_"表示姓张且名字只有两个字

-- 查询邮箱以 "abc" 开头的学生
SELECT * FROM students WHERE email LIKE 'abc%';
-- "abc%"表示以 "abc" 开头
```

### 通配符说明

| 通配符 | 说明 | 示例 |
|-------|------|------|
| % | 任意多个字符（0 个或多个） | '张%' 表示以"张"开头 |
| _ | 任意一个字符 | '张_' 表示姓张且名字两个字 |

> **注意**：LIKE 查询在大数据量时性能较差，尽量避免在索引列上使用 % 开头的模糊查询。

---

## 5.5 ORDER BY 排序

ORDER BY 子句用来对查询结果进行排序。

### 基本语法

```sql
-- 按年龄升序排序
SELECT * FROM students ORDER BY age ASC;
-- ASC 表示升序（从小到大），可以省略，默认就是升序

-- 按年龄降序排序
SELECT * FROM students ORDER BY age DESC;
-- DESC 表示降序（从大到小）

-- 按多个字段排序
SELECT * FROM students 
ORDER BY class ASC, age DESC;
-- 先按班级升序，同一班级内再按年龄降序
```

### 示例代码

```sql
-- 查询所有学生，按成绩从高到低排序
SELECT name, score FROM students ORDER BY score DESC;
-- 成绩高的在前面

-- 查询所有学生，按姓名拼音排序
SELECT * FROM students ORDER BY name;
-- 字符串默认按字母顺序排序

-- 查询计算机1班的学生，按年龄升序
SELECT * FROM students 
WHERE class = '计算机1班' 
ORDER BY age ASC;
-- WHERE 和 ORDER BY 可以一起使用

-- 查询前 10 名学生的姓名和成绩
SELECT name, score FROM students 
ORDER BY score DESC 
LIMIT 10;
-- 先排序，再取前 10 条
```

> **原理**：ORDER BY 在查询结果返回前进行排序，ASC 是升序（默认），DESC 是降序。

---

## 5.6 LIMIT 分页查询

LIMIT 子句用来限制查询结果的数量，常用于分页。

### 基本语法

```sql
-- 查询前 10 条记录
SELECT * FROM students LIMIT 10;
-- 只返回前 10 条记录

-- 从第 11 条开始，查询 10 条记录
SELECT * FROM students LIMIT 10 OFFSET 10;
-- OFFSET 10 表示跳过前 10 条，然后取 10 条

-- 简写形式
SELECT * FROM students LIMIT 10, 10;
-- 等价于 LIMIT 10 OFFSET 10
-- 第一个 10 是偏移量，第二个 10 是数量
```

### 分页示例

```sql
-- 第 1 页，每页 10 条
SELECT * FROM students LIMIT 10 OFFSET 0;
-- 或 SELECT * FROM students LIMIT 0, 10;

-- 第 2 页，每页 10 条
SELECT * FROM students LIMIT 10 OFFSET 10;
-- 或 SELECT * FROM students LIMIT 10, 10;

-- 第 3 页，每页 10 条
SELECT * FROM students LIMIT 10 OFFSET 20;
-- 或 SELECT * FROM students LIMIT 20, 10;

-- 通用公式：第 n 页，每页 pageSize 条
-- LIMIT pageSize OFFSET (n-1) * pageSize
-- 或 LIMIT (n-1)*pageSize, pageSize
```

> **原理**：LIMIT 限制返回的记录数，OFFSET 指定跳过的记录数。分页时，第 n 页的偏移量是 (n-1) * pageSize。

---

## 5.7 聚合函数

聚合函数用来对一组值进行计算，返回单个值。

### 常用聚合函数

| 函数 | 说明 | 示例 |
|-----|------|------|
| COUNT() | 统计记录数 | COUNT(*) 或 COUNT(列名) |
| SUM() | 求和 | SUM(score) |
| AVG() | 平均值 | AVG(score) |
| MAX() | 最大值 | MAX(score) |
| MIN() | 最小值 | MIN(score) |

### 示例代码

```sql
-- 统计学生总数
SELECT COUNT(*) FROM students;
-- COUNT(*) 统计所有记录数

-- 统计有邮箱的学生数量
SELECT COUNT(email) FROM students;
-- COUNT(列名) 统计该列不为 NULL 的记录数

-- 统计不同班级的数量
SELECT COUNT(DISTINCT class) FROM students;
-- DISTINCT 去重后统计

-- 计算所有学生的总分
SELECT SUM(score) FROM students;
-- SUM 对指定列求和

-- 计算计算机1班学生的总分
SELECT SUM(score) FROM students WHERE class = '计算机1班';
-- 可以先用 WHERE 筛选，再求和

-- 计算全校学生的平均成绩
SELECT AVG(score) FROM students;
-- AVG 计算平均值

-- 查询最高分和最低分
SELECT MAX(score) AS 最高分, MIN(score) AS 最低分 FROM students;
-- MAX 和 MIN 可以一起使用

-- 查询每个班级的平均分（配合 GROUP BY）
SELECT class, AVG(score) FROM students GROUP BY class;
-- 这个会在第 6 章详细讲解
```

> **注意**：聚合函数会忽略 NULL 值。COUNT(*) 统计所有记录，COUNT(列名) 只统计该列不为 NULL 的记录。

---

## 5.8 核心知识点总结

| 功能 | 语法 | 作用 |
|-----|------|------|
| 条件查询 | WHERE | 筛选满足条件的记录 |
| 逻辑运算 | AND、OR、NOT | 组合多个条件 |
| 范围查询 | BETWEEN | 查询指定范围内的数据 |
| 列表查询 | IN | 查询在列表中的数据 |
| 模糊查询 | LIKE | 模式匹配 |
| 排序 | ORDER BY | 对结果排序（ASC/DESC） |
| 分页 | LIMIT、OFFSET | 限制返回记录数 |
| 统计 | COUNT | 统计记录数 |
| 求和 | SUM | 计算总和 |
| 平均 | AVG | 计算平均值 |
| 最大/最小 | MAX、MIN | 找出最大/最小值 |

---

## 5.9 新手常见误区

### 误区 1："WHERE 中可以使用聚合函数"

错！聚合函数不能用在 WHERE 子句中。

```sql
-- 错误：WHERE 中不能使用 AVG
-- SELECT * FROM students WHERE score > AVG(score);

-- 正确：使用子查询
SELECT * FROM students 
WHERE score > (SELECT AVG(score) FROM students);
-- 子查询会在第 8 章讲解
```

### 误区 2："ORDER BY 必须放在最后"

不对。ORDER BY 后面还可以跟 LIMIT。

```sql
-- 正确：ORDER BY 在 LIMIT 之前
SELECT * FROM students 
ORDER BY score DESC 
LIMIT 10;
-- 先排序，再取前 10 条
```

### 误区 3："LIKE '%abc' 和 LIKE 'abc%' 性能一样"

不一样。以 % 开头的模糊查询无法使用索引，性能较差。

```sql
-- 性能较好：可以使用索引
SELECT * FROM students WHERE name LIKE '张%';

-- 性能较差：无法使用索引
SELECT * FROM students WHERE name LIKE '%三';
-- 大数据量时尽量避免 % 开头的模糊查询
```

### 误区 4："LIMIT 10 和 LIMIT 0, 10 不一样"

一样。LIMIT 10 等价于 LIMIT 0, 10 或 LIMIT 10 OFFSET 0。

```sql
-- 这三种写法等价
SELECT * FROM students LIMIT 10;
SELECT * FROM students LIMIT 0, 10;
SELECT * FROM students LIMIT 10 OFFSET 0;
```

---

## 5.10 动手练习

### 练习 1：基础条件查询

有一个 `products` 表，包含 id、name、price、category、stock 字段。查询：
1. 价格大于 100 的所有商品
2. 类别为"电子产品"且库存大于 50 的商品
3. 价格在 50-200 之间的商品

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 价格大于 100 的所有商品
SELECT * FROM products WHERE price > 100;

-- 2. 类别为"电子产品"且库存大于 50 的商品
SELECT * FROM products 
WHERE category = '电子产品' AND stock > 50;

-- 3. 价格在 50-200 之间的商品
SELECT * FROM products WHERE price BETWEEN 50 AND 200;
-- 或 SELECT * FROM products WHERE price >= 50 AND price <= 200;
```

</details>

### 练习 2：排序和分页

继续上面的 `products` 表，查询：
1. 所有商品按价格从高到低排序
2. 库存最少的 5 个商品
3. 第 2 页的商品（每页 10 条）

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 所有商品按价格从高到低排序
SELECT * FROM products ORDER BY price DESC;

-- 2. 库存最少的 5 个商品
SELECT * FROM products ORDER BY stock ASC LIMIT 5;

-- 3. 第 2 页的商品（每页 10 条）
SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 10;
-- 或 SELECT * FROM products ORDER BY id LIMIT 10, 10;
```

</details>

### 练习 3（挑战）：聚合函数

有一个 `orders` 表，包含 id、user_id、amount、order_date 字段。查询：
1. 订单总数
2. 订单总金额
3. 平均订单金额
4. 最大和最小的订单金额
5. 2026 年的订单总数

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 订单总数
SELECT COUNT(*) AS 订单总数 FROM orders;

-- 2. 订单总金额
SELECT SUM(amount) AS 总金额 FROM orders;

-- 3. 平均订单金额
SELECT AVG(amount) AS 平均金额 FROM orders;

-- 4. 最大和最小的订单金额
SELECT MAX(amount) AS 最大金额, MIN(amount) AS 最小金额 FROM orders;

-- 5. 2026 年的订单总数
SELECT COUNT(*) AS 订单总数 
FROM orders 
WHERE order_date BETWEEN '2026-01-01' AND '2026-12-31';
-- 或 WHERE YEAR(order_date) = 2026
```

</details>

---

## 下一章预告

下一章我们会学习 **分组与聚合**——也就是如何用 GROUP BY 对数据进行分组统计，如何用 HAVING 过滤分组结果，以及聚合函数和 GROUP BY 的组合使用。你会学到如何统计"每个班级的学生数"、"每个月的销售额"这类分组统计数据。
