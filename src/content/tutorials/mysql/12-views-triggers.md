---
title: "第12章：视图与触发器"
description: "CREATE VIEW、CREATE TRIGGER、应用场景"
---

# 第12章：视图与触发器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是视图？它和普通的表有什么区别？
- 视图有什么用？为什么不直接用查询语句？
- 触发器是什么？什么时候会自动执行？

这一章就是为了解答这些问题。我们会用生活中的例子，帮你搞懂视图和触发器的概念，再学会如何创建和使用它们。

---

## 1 为什么需要视图？

### 复杂查询的痛苦

假设你有一个电商系统，经常需要查询"用户的订单信息"，包括用户名、订单号、商品名、金额等。

每次查询都要写这样的 SQL：

```sql
SELECT u.name, o.order_no, p.product_name, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id;
```

这个查询涉及 4 张表的连接，写起来很麻烦。如果每次都要写这么长的 SQL，既容易出错，又难以维护。

### 视图的解决方式：像窗户一样看数据

视图就像一扇窗户，透过它你可以看到复杂数据的一个"快照"。

打个比方：你家的窗户对着花园，你透过窗户看到的是花园的景色。窗户本身不是花园，但它让你方便地看到花园。

视图也是类似的：它本身不存储数据，只是保存了一个查询语句。你查询视图时，MySQL 会自动执行背后的查询。

| 对比项 | 不用视图 | 用视图 |
|--------|----------|--------|
| 查询复杂度 | 每次都要写完整的 JOIN 语句 | 直接查询视图，像查普通表 |
| 代码复用 | 相同查询要写多次 | 定义一次视图，多次使用 |
| 维护成本 | 修改查询逻辑要改多处 | 只修改视图定义 |
| 安全性 | 暴露所有表和字段 | 可以隐藏敏感字段 |

> 一句话总结：视图是"虚拟表"，不存储数据，只存储查询逻辑，让复杂查询变得简单。

---

## 2 创建与使用视图

### 基本语法

```sql
-- 创建视图
CREATE VIEW user_orders AS
-- 创建名为 user_orders 的视图
SELECT 
    u.name AS user_name,
    -- 用户姓名
    o.order_no,
    -- 订单号
    p.product_name,
    -- 商品名
    o.amount
    -- 金额
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id;
-- 视图背后的查询语句

-- 使用视图
SELECT * FROM user_orders;
-- 像查询普通表一样查询视图

SELECT user_name, order_no 
FROM user_orders 
WHERE amount > 100;
-- 可以在视图上添加条件
```

### 视图的更新

视图是可以更新的，但有条件限制：

```sql
-- 可以更新的视图
CREATE VIEW active_users AS
SELECT * FROM users WHERE status = 1;
-- 只包含状态为 1 的用户

UPDATE active_users SET name = '张三' WHERE id = 1;
-- 可以更新视图，实际会更新 users 表

-- 不能更新的视图
CREATE VIEW user_summary AS
SELECT user_id, COUNT(*) as order_count
FROM orders
GROUP BY user_id;
-- 包含聚合函数的视图不能更新

UPDATE user_summary SET order_count = 10 WHERE user_id = 1;
-- 报错！不能更新包含聚合函数的视图
```

### 视图更新的限制

| 情况 | 能否更新 | 原因 |
|------|----------|------|
| 简单查询（单表） | 能 | 直接映射到基表 |
| 包含 JOIN | 部分能 | 只能更新一个基表 |
| 包含聚合函数 | 不能 | 聚合结果是计算值 |
| 包含 DISTINCT | 不能 | 去重后无法定位原数据 |
| 包含 GROUP BY | 不能 | 分组结果是计算值 |
| 包含子查询 | 不能 | 复杂逻辑无法映射 |

> 一句话总结：视图更新有限制，只有简单查询的视图才能更新。复杂视图只能查询，不能修改。

---

## 3 为什么需要触发器？

### 自动化的需求

假设你有一个库存系统，每次订单创建时，都要自动扣减库存。

如果不用触发器，你需要在应用代码里写两步：
1. 插入订单记录
2. 更新库存数量

如果有多个地方都要创建订单，每个地方都要写这两步。一旦某个地方忘记更新库存，数据就不一致了。

### 触发器的解决方式：自动执行的程序

触发器就像"自动门"，当有人靠近时自动打开。

在数据库中，触发器是当某个事件发生时（INSERT、UPDATE、DELETE），自动执行的程序。

打个比方：你家的自动门，当有人靠近时（事件），自动打开（触发动作）。你不需要手动开门，门会自动响应。

| 对比项 | 不用触发器 | 用触发器 |
|--------|------------|----------|
| 代码位置 | 分散在应用层各处 | 集中在数据库层 |
| 一致性保证 | 依赖应用代码正确性 | 数据库自动保证 |
| 维护成本 | 多处修改 | 只改触发器一处 |
| 可靠性 | 可能遗漏 | 必然执行 |

> 一句话总结：触发器是数据库的"自动化机制"，当数据变化时自动执行预定义的操作。

---

## 4 创建触发器

### 基本语法

```sql
-- 创建触发器
DELIMITER //

CREATE TRIGGER after_order_insert
-- 创建名为 after_order_insert 的触发器
AFTER INSERT
-- 在 INSERT 操作之后触发
ON orders
-- 监听 orders 表
FOR EACH ROW
-- 对每一行都执行
BEGIN
    -- 触发器主体
    UPDATE products 
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    -- 扣减库存：NEW 表示新插入的行
END //

DELIMITER ;

-- 测试触发器
INSERT INTO orders (user_id, product_id, quantity) VALUES (1, 101, 2);
-- 插入订单后，触发器自动执行，扣减 product_id=101 的库存
```

### 触发器的时机

触发器可以在事件之前或之后触发：

**BEFORE 触发器**
- 在事件发生之前执行
- 可以修改即将插入/更新的数据

**AFTER 触发器**
- 在事件发生之后执行
- 通常用于记录日志或更新其他表

```sql
-- BEFORE INSERT 触发器
DELIMITER //

CREATE TRIGGER before_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    SET NEW.create_time = NOW();
    -- 在插入前自动设置创建时间
END //

DELIMITER ;

-- AFTER UPDATE 触发器
DELIMITER //

CREATE TRIGGER after_user_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_logs (user_id, action, action_time)
    VALUES (NEW.id, 'UPDATE', NOW());
    -- 在更新后记录日志
END //

DELIMITER ;
```

### 触发器的事件类型

| 事件类型 | 触发时机 | 常见用途 |
|----------|----------|----------|
| BEFORE INSERT | 插入前 | 数据验证、自动填充字段 |
| AFTER INSERT | 插入后 | 记录日志、更新关联数据 |
| BEFORE UPDATE | 更新前 | 数据验证、记录变更前 |
| AFTER UPDATE | 更新后 | 记录日志、同步关联数据 |
| BEFORE DELETE | 删除前 | 数据备份、级联删除 |
| AFTER DELETE | 删除后 | 记录日志、清理关联数据 |

### NEW 和 OLD 关键字

触发器中可以使用 NEW 和 OLD 访问数据：

- NEW：表示新数据（INSERT 和 UPDATE 时可用）
- OLD：表示旧数据（UPDATE 和 DELETE 时可用）

```sql
-- UPDATE 触发器
DELIMITER //

CREATE TRIGGER before_user_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_history (user_id, old_name, new_name, change_time)
    VALUES (OLD.id, OLD.name, NEW.name, NOW());
    -- OLD.name 是更新前的名字
    -- NEW.name 是更新后的名字
END //

DELIMITER ;
```

---

## 5 视图 vs 触发器

| 对比项 | 视图 | 触发器 |
|--------|------|--------|
| 本质 | 虚拟表，保存查询逻辑 | 自动程序，保存执行逻辑 |
| 触发方式 | 手动查询 | 自动触发（事件发生时） |
| 是否存储数据 | 不存储，动态查询 | 不存储，只执行逻辑 |
| 主要用途 | 简化复杂查询 | 自动化数据操作 |
| 能否更新 | 简单视图可以 | 不能直接更新 |
| 类比 | 窗户（看数据的窗口） | 自动门（自动响应事件） |

> 一句话总结：视图是"看数据的方式"，触发器是"数据变化时的自动反应"。

---

## 6 新手常见误区

### 误区 1："视图会存储数据"

错！视图不存储数据，只存储查询语句。每次查询视图时，MySQL 都会执行背后的查询，返回最新数据。视图只是一个"虚拟表"，数据还是在原来的表里。

### 误区 2："所有视图都能更新"

不是的。只有简单查询的视图才能更新，包含聚合函数、JOIN、DISTINCT、GROUP BY 的视图不能更新。因为复杂视图的数据来自多张表或计算结果，无法映射回原表。

### 误区 3："触发器可以替代应用逻辑"

错！触发器适合做简单的自动化操作（如记录日志、更新关联数据），但不适合做复杂的业务逻辑。复杂逻辑还是应该放在应用层，触发器只是补充。

### 误区 4："触发器会影响性能"

有一定影响，但通常不大。触发器在数据变化时自动执行，会增加一些开销。但如果触发器逻辑简单（如更新一个字段），影响很小。只有触发器逻辑很复杂时，才需要考虑性能问题。

### 误区 5："一个表只能有一个触发器"

错！一个表可以有多个触发器，只要它们监听不同的事件或时机。比如可以有 BEFORE INSERT、AFTER INSERT、BEFORE UPDATE、AFTER UPDATE 等多个触发器。

---

## 7 动手练习

### 练习 1：创建简单视图

创建一个视图 high_score_users，查询积分大于 1000 的用户。

<details>
<summary>点击查看答案</summary>

```sql
CREATE VIEW high_score_users AS
SELECT id, name, score
FROM users
WHERE score > 1000;
-- 查询积分大于 1000 的用户

-- 使用视图
SELECT * FROM high_score_users;
```

</details>

### 练习 2：创建 AFTER INSERT 触发器

创建一个触发器，当向 orders 表插入新订单时，自动更新用户的订单数量（users 表有一个 order_count 字段）。

<details>
<summary>点击查看答案</summary>

```sql
DELIMITER //

CREATE TRIGGER after_order_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    UPDATE users 
    SET order_count = order_count + 1
    WHERE id = NEW.user_id;
    -- 新订单插入后，用户订单数加 1
END //

DELIMITER ;

-- 测试
INSERT INTO orders (user_id, product_id, quantity) VALUES (1, 101, 2);
-- 插入订单后，user_id=1 的 order_count 自动加 1
```

</details>

### 练习 3（挑战）：创建 BEFORE UPDATE 触发器

创建一个触发器，当更新 users 表的 email 字段时，自动记录变更历史到 user_email_history 表。

<details>
<summary>点击查看答案</summary>

```sql
-- 先创建历史记录表
CREATE TABLE user_email_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    old_email VARCHAR(100),
    new_email VARCHAR(100),
    change_time DATETIME
);

-- 创建触发器
DELIMITER //

CREATE TRIGGER before_user_email_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.email != NEW.email THEN
        -- 只有 email 变化时才记录
        INSERT INTO user_email_history (user_id, old_email, new_email, change_time)
        VALUES (OLD.id, OLD.email, NEW.email, NOW());
    END IF;
END //

DELIMITER ;

-- 测试
UPDATE users SET email = 'new@example.com' WHERE id = 1;
-- 更新 email 后，自动记录到 history 表
```

</details>

---

## 下一章预告

下一章我们会学习 **用户权限与安全**。你会了解如何创建数据库用户、分配权限、防止 SQL 注入攻击。这些是保护数据库安全的核心技术，每个开发者都必须掌握。
