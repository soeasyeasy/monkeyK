---
title: "第3章：SQL 基础语法"
description: "SELECT、INSERT、UPDATE、DELETE 基础操作"
---

# 第3章：SQL 基础语法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- SQL 到底是什么？和 Excel 有什么区别？
- 怎么从数据库里查询数据？
- 怎么往数据库里添加新数据？
- 怎么修改或删除已有的数据？

这一章就是为了解答这些问题。我们会先搞清楚 **SQL 的基本概念**，再动手实践增删改查四大基础操作。学完这章，你就能独立完成数据库的基本操作了。

---

## 1 为什么需要 SQL？

### 痛点分析

想象一下，你开了一家奶茶店，每天要记录几百个订单。如果用 Excel：

- 数据量大了，打开文件要等半天
- 多人同时操作容易冲突
- 想找"今天销量最高的产品"要手动筛选
- 数据安全没保障，误删就全没了

### 解决方案

数据库就像是一个**超级智能的文件柜**，而 SQL 就是你和文件柜对话的语言。

打个比方：

> 你去餐厅点餐，不需要自己跑厨房做菜，只需要告诉服务员"我要一份宫保鸡丁"，服务员就会帮你搞定。SQL 就是你的"点餐语言"，数据库就是"厨房"。

### 对比一下

| 操作方式 | Excel | 数据库 + SQL |
|---------|-------|-------------|
| 数据量 | 几万行就卡 | 轻松处理百万级 |
| 多人协作 | 容易冲突 | 支持并发访问 |
| 查询效率 | 手动筛选 | 一条语句秒级查询 |
| 数据安全 | 容易误删 | 有备份和权限控制 |

> **一句话总结**：SQL 是操作数据库的标准语言，学会了它，你就能高效地管理海量数据。

---

## 2 SQL 语言分类

SQL 语句主要分为四大类：

| 分类 | 全称 | 作用 | 常用语句 |
|-----|------|------|---------|
| DQL | 数据查询语言 | 查询数据 | SELECT |
| DML | 数据操作语言 | 增删改数据 | INSERT、UPDATE、DELETE |
| DDL | 数据定义语言 | 定义表结构 | CREATE、ALTER、DROP |
| DCL | 数据控制语言 | 控制权限 | GRANT、REVOKE |

本章我们重点学习 **DQL（查询）** 和 **DML（增删改）**，这是日常开发最常用的部分。

---

## 3 SELECT 查询：从数据库取数据

### 基本语法

```sql
-- 查询表中的所有列
SELECT * FROM 表名;

-- 查询指定列
SELECT 列名1, 列名2 FROM 表名;
```

### 示例：查询学生信息

假设我们有一个 `students` 表：

```sql
-- 查询所有学生的所有信息
SELECT * FROM students;
-- * 表示"所有列"，就像说"我要看全部信息"

-- 只查询学生的姓名和年龄
SELECT name, age FROM students;
-- 指定列名，用逗号分隔，就像只关心姓名和年龄

-- 给列起别名，让结果更易读
SELECT name AS 姓名, age AS 年龄 FROM students;
-- AS 关键字用来起别名，让输出结果更友好
```

### 查询不重复的数据

```sql
-- 查询所有不同的班级
SELECT DISTINCT class FROM students;
-- DISTINCT 去重，就像从名单里找出有哪些不同的班级

-- 查询不同班级的数量
SELECT COUNT(DISTINCT class) FROM students;
-- COUNT 统计数量，配合 DISTINCT 统计不重复的班级数
```

> **原理**：SELECT 语句执行时，数据库会扫描指定的表，找出符合条件的行，然后返回你指定的列。

---

## 4 INSERT 插入：添加新数据

### 基本语法

```sql
-- 插入完整的一行数据
INSERT INTO 表名 (列1, 列2, 列3) VALUES (值1, 值2, 值3);

-- 插入时省略列名（必须按表中列的顺序提供所有值）
INSERT INTO 表名 VALUES (值1, 值2, 值3);
```

### 示例：添加新学生

```sql
-- 插入一个学生的完整信息
INSERT INTO students (id, name, age, class) 
VALUES (1, '张三', 20, '计算机1班');
-- 指定列名和对应的值，一一对应

-- 一次插入多个学生
INSERT INTO students (name, age, class) 
VALUES 
('李四', 21, '计算机1班'),
('王五', 19, '计算机2班'),
('赵六', 22, '计算机2班');
-- 用逗号分隔多组值，批量插入效率更高

-- 省略列名时，必须按表中列的顺序提供所有值
INSERT INTO students 
VALUES (2, '孙七', 20, '数学1班');
-- 不推荐这种写法，因为表结构变化时容易出错
```

> **注意**：字符串和日期类型的值要用单引号括起来，数字不需要。

---

## 5 UPDATE 更新：修改已有数据

### 基本语法

```sql
-- 更新满足条件的记录
UPDATE 表名 SET 列1 = 新值1, 列2 = 新值2 WHERE 条件;

-- 更新所有记录（慎用！）
UPDATE 表名 SET 列 = 新值;
```

### 示例：修改学生信息

```sql
-- 把张三的年龄改成 21 岁
UPDATE students SET age = 21 WHERE name = '张三';
-- WHERE 指定条件，只修改满足条件的记录

-- 同时修改多个字段
UPDATE students SET age = 22, class = '计算机3班' WHERE id = 1;
-- 多个字段用逗号分隔，一次性修改

-- 把计算机1班所有学生的年龄加 1
UPDATE students SET age = age + 1 WHERE class = '计算机1班';
-- 可以在原值基础上计算新值

-- 危险操作：修改所有学生的班级（没有 WHERE 条件）
UPDATE students SET class = '全校统一班';
-- 没有 WHERE 会修改所有记录，一定要小心！
```

> **警告**：UPDATE 语句如果没有 WHERE 子句，会修改表中的所有记录！执行前一定要检查。

---

## 6 DELETE 删除：移除数据

### 基本语法

```sql
-- 删除满足条件的记录
DELETE FROM 表名 WHERE 条件;

-- 删除所有记录（慎用！）
DELETE FROM 表名;
```

### 示例：删除学生记录

```sql
-- 删除学号为 1 的学生
DELETE FROM students WHERE id = 1;
-- WHERE 指定条件，只删除满足条件的记录

-- 删除计算机2班的所有学生
DELETE FROM students WHERE class = '计算机2班';
-- 可以一次删除多条记录

-- 删除年龄大于 25 岁的学生
DELETE FROM students WHERE age > 25;
-- 支持各种比较运算符

-- 危险操作：删除所有学生（没有 WHERE 条件）
DELETE FROM students;
-- 没有 WHERE 会删除所有记录，表还在但数据全没了！
```

> **警告**：DELETE 语句如果没有 WHERE 子句，会删除表中的所有数据！执行前一定要三思。

---

## 7 WHERE 条件：筛选数据

WHERE 子句用来指定筛选条件，只返回满足条件的数据。

### 常用运算符

| 运算符 | 说明 | 示例 |
|-------|------|------|
| = | 等于 | WHERE age = 20 |
| <> 或 != | 不等于 | WHERE age <> 20 |
| > | 大于 | WHERE age > 20 |
| < | 小于 | WHERE age < 20 |
| >= | 大于等于 | WHERE age >= 20 |
| <= | 小于等于 | WHERE age <= 20 |

### 示例

```sql
-- 查询年龄等于 20 岁的学生
SELECT * FROM students WHERE age = 20;

-- 查询年龄不等于 20 岁的学生
SELECT * FROM students WHERE age != 20;

-- 查询年龄大于 20 岁的学生
SELECT * FROM students WHERE age > 20;

-- 查询计算机1班且年龄大于 20 岁的学生
SELECT * FROM students 
WHERE class = '计算机1班' AND age > 20;
-- AND 表示"且"，多个条件要同时满足

-- 查询计算机1班或年龄大于 20 岁的学生
SELECT * FROM students 
WHERE class = '计算机1班' OR age > 20;
-- OR 表示"或"，满足其中一个条件即可
```

---

## 8 核心知识点总结

| 操作 | 语句 | 作用 | 注意事项 |
|-----|------|------|---------|
| 查询 | SELECT | 从表中获取数据 | 用 * 表示所有列 |
| 插入 | INSERT | 添加新记录 | 字符串用单引号 |
| 更新 | UPDATE | 修改现有记录 | 必须有 WHERE，否则改全部 |
| 删除 | DELETE | 移除记录 | 必须有 WHERE，否则删全部 |
| 条件 | WHERE | 筛选数据 | 支持多种运算符 |

---

## 9 新手常见误区

### 误区 1："UPDATE 和 DELETE 不加 WHERE 也没关系"

**错！** 不加 WHERE 会修改或删除所有记录。

```sql
-- 错误示范：修改了所有学生的年龄
UPDATE students SET age = 25;

-- 正确做法：只修改符合条件的
UPDATE students SET age = 25 WHERE id = 1;
```

### 误区 2："INSERT 时可以不提供列名"

不推荐。省略列名时，必须按表中列的顺序提供所有值，一旦表结构变化就会出错。

```sql
-- 不推荐：省略列名
INSERT INTO students VALUES (1, '张三', 20, '计算机1班');

-- 推荐：明确指定列名
INSERT INTO students (id, name, age, class) 
VALUES (1, '张三', 20, '计算机1班');
```

### 误区 3："SELECT * 总是最好的"

不是的。SELECT * 会查询所有列，如果表有很多列，会浪费资源。

```sql
-- 不推荐：查询所有列
SELECT * FROM students;

-- 推荐：只查询需要的列
SELECT name, age FROM students;
```

### 误区 4："字符串和数字可以混用"

不行。字符串必须用单引号括起来，数字不需要。

```sql
-- 错误：字符串没加引号
SELECT * FROM students WHERE name = 张三;

-- 正确：字符串用单引号
SELECT * FROM students WHERE name = '张三';
```

---

## 10 动手练习

### 练习 1：基础查询

创建一个 `products` 表，包含 id、name、price、category 列，插入 5 条商品数据，然后查询所有价格大于 50 的商品。

<details>
<summary>点击查看答案</summary>

```sql
-- 创建商品表
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    price DECIMAL(10, 2),
    category VARCHAR(30)
);

-- 插入 5 条商品数据
INSERT INTO products (id, name, price, category) VALUES
(1, '笔记本电脑', 5999.00, '电子产品'),
(2, '无线鼠标', 89.00, '电子产品'),
(3, '运动鞋', 399.00, '服装'),
(4, '咖啡杯', 45.00, '家居'),
(5, '蓝牙耳机', 299.00, '电子产品');

-- 查询价格大于 50 的商品
SELECT name, price FROM products WHERE price > 50;
```

</details>

### 练习 2：数据更新

把上面 `products` 表中"电子产品"类的所有商品降价 10%。

<details>
<summary>点击查看答案</summary>

```sql
-- 把电子产品类商品降价 10%
UPDATE products 
SET price = price * 0.9 
WHERE category = '电子产品';

-- 验证修改结果
SELECT name, price, category 
FROM products 
WHERE category = '电子产品';
```

</details>

### 练习 3（挑战）：综合操作

1. 查询每个类别的商品数量
2. 删除价格小于 50 的商品
3. 查询剩余商品的平均价格

<details>
<summary>点击查看答案</summary>

```sql
-- 1. 查询每个类别的商品数量
SELECT category, COUNT(*) AS 商品数量 
FROM products 
GROUP BY category;

-- 2. 删除价格小于 50 的商品
DELETE FROM products WHERE price < 50;

-- 3. 查询剩余商品的平均价格
SELECT AVG(price) AS 平均价格 FROM products;
```

</details>

---

## 下一章预告

下一章我们会学习 **数据类型与约束**——也就是如何为表中的每一列选择合适的数据类型，以及如何用约束来保证数据的正确性。你会学到 INT、VARCHAR、DATE 等常用类型，还有 NOT NULL、UNIQUE、PRIMARY KEY 等重要约束。这些知识能帮你设计出更合理、更安全的数据库表结构。
