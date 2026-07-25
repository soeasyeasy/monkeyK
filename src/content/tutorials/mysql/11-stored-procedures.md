---
title: "第11章：存储过程与函数"
description: "CREATE PROCEDURE、CREATE FUNCTION、参数传递"
---

# 第11章：存储过程与函数

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是存储过程？和普通的 SQL 语句有什么区别？
- 存储过程和函数有什么不同？该用哪个？
- IN、OUT、INOUT 参数是什么意思？怎么用？

这一章就是为了解答这些问题。我们会从生活中的例子出发，帮你搞懂如何把常用的 SQL 逻辑封装成可复用的"程序"，让复杂的数据库操作变得简单高效。

---

## 11.1 为什么需要存储过程？

### 重复 SQL 的痛苦

假设你有一个电商系统，每次用户下单都要执行以下操作：
1. 检查库存是否足够
2. 扣减库存
3. 创建订单记录
4. 更新用户积分

如果不用存储过程，每次下单都要在应用代码里写这四条 SQL。如果有 10 个地方都要下单，就要写 10 遍。

这就像你去餐厅点菜，每次都要告诉厨师：先放油、再放蒜、然后放菜、最后放盐。如果 10 个菜都要这么做，你要说 10 遍。

### 存储过程的解决方式：封装复用

存储过程就是把一段 SQL 逻辑封装起来，起个名字，以后直接调用这个名字就行。

打个比方：你把"炒青菜"的做法教给厨师，以后只要说"炒青菜"，厨师就知道怎么做，不用你每次都重复说明。

| 对比项 | 不用存储过程 | 用存储过程 |
|--------|--------------|------------|
| 代码复用 | 每次都要写完整的 SQL | 调用一次存储过程名 |
| 维护成本 | 修改逻辑要改多处 | 只改存储过程一处 |
| 网络传输 | 多条 SQL 多次传输 | 一次调用传输 |
| 安全性 | SQL 暴露在应用层 | 可以控制调用权限 |

> 一句话总结：存储过程就是数据库里的"函数"，封装常用逻辑，一次定义，多次调用。

---

## 11.2 创建与调用存储过程

### 基本语法

```sql
-- 创建存储过程
DELIMITER //
-- 修改分隔符为 //，因为存储过程内部有分号，默认分号会提前结束

CREATE PROCEDURE GetUserInfo()
-- 创建名为 GetUserInfo 的存储过程
BEGIN
    -- BEGIN 和 END 之间是存储过程的主体
    SELECT * FROM users;
    -- 查询所有用户信息
END //
-- 存储过程定义结束

DELIMITER ;
-- 恢复默认分隔符为分号

-- 调用存储过程
CALL GetUserInfo();
-- 执行存储过程，查询所有用户
```

### 带参数的存储过程

```sql
DELIMITER //

CREATE PROCEDURE GetUserById(IN user_id INT)
-- IN 表示输入参数，user_id 是参数名，INT 是类型
BEGIN
    SELECT * FROM users WHERE id = user_id;
    -- 根据传入的 user_id 查询用户
END //

DELIMITER ;

-- 调用存储过程
CALL GetUserById(1);
-- 传入参数 1，查询 id=1 的用户
```

---

## 11.3 参数类型：IN、OUT、INOUT

存储过程有三种参数类型：

### IN 参数：输入参数

IN 参数用于传入值，存储过程内部可以读取，但不能修改原值。

```sql
DELIMITER //

CREATE PROCEDURE GetUserName(IN user_id INT, OUT user_name VARCHAR(50))
-- IN user_id：输入参数，传入用户 ID
-- OUT user_name：输出参数，返回用户名
BEGIN
    SELECT name INTO user_name FROM users WHERE id = user_id;
    -- 查询 id=user_id 的用户名，存入 user_name 变量
END //

DELIMITER ;

-- 调用存储过程
CALL GetUserName(1, @name);
-- 传入 user_id=1，返回值存入 @name 变量

SELECT @name;
-- 查看返回的用户名
```

### OUT 参数：输出参数

OUT 参数用于返回值，存储过程内部会给它赋值，调用后可以读取。

```sql
DELIMITER //

CREATE PROCEDURE GetUserCount(OUT total INT)
-- OUT total：输出参数，返回用户总数
BEGIN
    SELECT COUNT(*) INTO total FROM users;
    -- 统计用户总数，存入 total 变量
END //

DELIMITER ;

-- 调用存储过程
CALL GetUserCount(@count);
-- 调用后，用户总数存入 @count

SELECT @count;
-- 显示用户总数
```

### INOUT 参数：输入输出参数

INOUT 参数既可以传入值，也可以返回值。

```sql
DELIMITER //

CREATE PROCEDURE DoubleNumber(INOUT num INT)
-- INOUT num：既可以传入值，也可以返回值
BEGIN
    SET num = num * 2;
    -- 将传入的 num 乘以 2，再返回
END //

DELIMITER ;

-- 调用存储过程
SET @my_num = 5;
-- 设置变量 @my_num 为 5

CALL DoubleNumber(@my_num);
-- 传入 @my_num，返回后 @my_num 变成 10

SELECT @my_num;
-- 显示 10
```

| 参数类型 | 作用 | 能否修改原值 | 使用场景 |
|----------|------|--------------|----------|
| IN | 传入值 | 不能 | 传入查询条件 |
| OUT | 返回值 | 能 | 返回查询结果 |
| INOUT | 传入并返回 | 能 | 传入并修改 |

---

## 11.4 条件语句

### IF 语句

```sql
DELIMITER //

CREATE PROCEDURE CheckAge(IN age INT, OUT result VARCHAR(20))
BEGIN
    IF age >= 18 THEN
        -- 如果年龄大于等于 18
        SET result = '成年人';
        -- 设置为成年人
    ELSEIF age >= 12 THEN
        -- 如果年龄大于等于 12
        SET result = '青少年';
        -- 设置为青少年
    ELSE
        -- 其他情况
        SET result = '儿童';
        -- 设置为儿童
    END IF;
    -- IF 语句结束
END //

DELIMITER ;

-- 调用测试
CALL CheckAge(20, @result);
SELECT @result;
-- 显示 '成年人'
```

### CASE 语句

```sql
DELIMITER //

CREATE PROCEDURE GetLevel(IN score INT, OUT level VARCHAR(10))
BEGIN
    CASE
        WHEN score >= 90 THEN SET level = '优秀';
        -- 分数大于等于 90，优秀
        WHEN score >= 80 THEN SET level = '良好';
        -- 分数大于等于 80，良好
        WHEN score >= 60 THEN SET level = '及格';
        -- 分数大于等于 60，及格
        ELSE SET level = '不及格';
        -- 其他情况，不及格
    END CASE;
    -- CASE 语句结束
END //

DELIMITER ;

-- 调用测试
CALL GetLevel(85, @level);
SELECT @level;
-- 显示 '良好'
```

---

## 11.5 循环语句

### WHILE 循环

```sql
DELIMITER //

CREATE PROCEDURE SumNumbers(IN n INT, OUT total INT)
BEGIN
    DECLARE i INT DEFAULT 1;
    -- 声明变量 i，初始值为 1
    SET total = 0;
    -- 初始化 total 为 0
    
    WHILE i <= n DO
        -- 当 i 小于等于 n 时循环
        SET total = total + i;
        -- 累加 i 到 total
        SET i = i + 1;
        -- i 加 1
    END WHILE;
    -- 循环结束
END //

DELIMITER ;

-- 调用测试
CALL SumNumbers(10, @sum);
SELECT @sum;
-- 显示 55（1+2+3+...+10）
```

### REPEAT 循环

```sql
DELIMITER //

CREATE PROCEDURE RepeatExample(IN n INT, OUT total INT)
BEGIN
    DECLARE i INT DEFAULT 1;
    SET total = 0;
    
    REPEAT
        -- 先执行一次，再判断条件
        SET total = total + i;
        SET i = i + 1;
    UNTIL i > n
    -- 当 i 大于 n 时停止循环
    END REPEAT;
    -- 循环结束
END //

DELIMITER ;
```

### LOOP 循环

```sql
DELIMITER //

CREATE PROCEDURE LoopExample(IN n INT, OUT total INT)
BEGIN
    DECLARE i INT DEFAULT 1;
    SET total = 0;
    
    loop_label: LOOP
        -- 定义循环标签
        IF i > n THEN
            LEAVE loop_label;
            -- 如果 i 大于 n，跳出循环
        END IF;
        
        SET total = total + i;
        SET i = i + 1;
        
        ITERATE loop_label;
        -- 继续下一次循环
    END LOOP;
    -- 循环结束
END //

DELIMITER ;
```

| 循环类型 | 特点 | 适用场景 |
|----------|------|----------|
| WHILE | 先判断条件，再执行 | 已知循环次数 |
| REPEAT | 先执行一次，再判断条件 | 至少要执行一次 |
| LOOP | 无条件循环，需要手动跳出 | 复杂循环逻辑 |

---

## 11.6 自定义函数

### 创建函数

```sql
DELIMITER //

CREATE FUNCTION GetFullName(first_name VARCHAR(20), last_name VARCHAR(20))
RETURNS VARCHAR(50)
-- 指定返回类型为 VARCHAR(50)
DETERMINISTIC
-- 表示相同输入总是返回相同输出
BEGIN
    RETURN CONCAT(first_name, ' ', last_name);
    -- 返回拼接后的全名
END //

DELIMITER ;

-- 调用函数
SELECT GetFullName('三', '张');
-- 显示 '三 张'
```

### 函数 vs 存储过程

| 对比项 | 函数 | 存储过程 |
|--------|------|----------|
| 返回值 | 必须返回一个值（RETURN） | 可以返回多个值（OUT 参数） |
| 调用方式 | 在 SQL 语句中直接调用 | 用 CALL 语句调用 |
| 参数类型 | 只有 IN 参数 | 支持 IN、OUT、INOUT |
| 使用场景 | 计算并返回单个值 | 执行复杂操作 |
| 能否修改数据 | 不能 | 可以 |

```sql
-- 函数：在 SELECT 中调用
SELECT GetFullName('三', '张');
-- 直接在查询中使用

-- 存储过程：用 CALL 调用
CALL GetUserById(1);
-- 必须用 CALL 语句
```

---

## 11.7 新手常见误区

### 误区 1："存储过程和函数是一样的的"

错！函数必须返回一个值，可以在 SQL 语句中直接调用；存储过程可以返回多个值，必须用 CALL 调用，而且可以修改数据。函数更像"计算器"，存储过程更像"程序"。

### 误区 2："忘记修改 DELIMITER"

这是新手最常犯的错误。存储过程内部有分号，如果不修改 DELIMITER，MySQL 会在遇到第一个分号时就结束定义。记得在创建存储过程前用 DELIMITER // 修改分隔符，结束后用 DELIMITER ; 恢复。

### 误区 3："OUT 参数需要先赋值"

不需要。OUT 参数在存储过程内部会被赋值，调用前不需要初始化。而 INOUT 参数需要先赋值，因为它既要传入值，也要返回值。

### 误区 4："存储过程比 SQL 语句慢"

不是的。存储过程在创建时就被编译优化了，执行时比多条 SQL 语句更快。而且存储过程减少了网络传输，整体性能更好。

### 误区 5："存储过程可以包含所有 SQL 语句"

错！存储过程不能包含某些语句，比如 CREATE DATABASE、CREATE TABLE 等。但可以使用大多数 DML 语句（SELECT、INSERT、UPDATE、DELETE）和控制语句（IF、LOOP 等）。

---

## 11.8 动手练习

### 练习 1：创建简单存储过程

创建一个存储过程 GetTopUsers，查询积分前 10 名的用户。

<details>
<summary>点击查看答案</summary>

```sql
DELIMITER //

CREATE PROCEDURE GetTopUsers()
BEGIN
    SELECT * FROM users 
    ORDER BY score DESC 
    LIMIT 10;
    -- 按积分降序排列，取前 10 名
END //

DELIMITER ;

-- 调用
CALL GetTopUsers();
```

</details>

### 练习 2：带参数的存储过程

创建一个存储过程 UpdateScore，根据用户 ID 增加积分。要求：
1. 输入参数：user_id 和 add_score
2. 输出参数：new_score（更新后的积分）

<details>
<summary>点击查看答案</summary>

```sql
DELIMITER //

CREATE PROCEDURE UpdateScore(
    IN user_id INT, 
    IN add_score INT, 
    OUT new_score INT
)
BEGIN
    UPDATE users 
    SET score = score + add_score 
    WHERE id = user_id;
    -- 更新用户积分
    
    SELECT score INTO new_score 
    FROM users 
    WHERE id = user_id;
    -- 查询更新后的积分
END //

DELIMITER ;

-- 调用
CALL UpdateScore(1, 100, @new_score);
SELECT @new_score;
```

</details>

### 练习 3（挑战）：创建自定义函数

创建一个函数 GetAgeLevel，根据年龄返回年龄级别：
- 小于 18：未成年
- 18-60：成年人
- 大于 60：老年人

<details>
<summary>点击查看答案</summary>

```sql
DELIMITER //

CREATE FUNCTION GetAgeLevel(age INT)
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    DECLARE level VARCHAR(10);
    
    IF age < 18 THEN
        SET level = '未成年';
    ELSEIF age <= 60 THEN
        SET level = '成年人';
    ELSE
        SET level = '老年人';
    END IF;
    
    RETURN level;
END //

DELIMITER ;

-- 调用测试
SELECT GetAgeLevel(25);
-- 显示 '成年人'

SELECT name, GetAgeLevel(age) AS age_level FROM users;
-- 查询所有用户的姓名和年龄级别
```

</details>

---

## 下一章预告

下一章我们会学习 **视图与触发器**。视图是虚拟表，可以简化复杂查询；触发器是自动执行的程序，当数据变化时自动触发。这两个工具能让数据库操作更灵活高效。
