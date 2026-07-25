---
title: "第3章：数据类型与字符集原理"
description: "深入理解 MySQL 数据类型的底层存储、字符集编码原理与性能影响"
---

# 第3章：数据类型与字符集原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- INT(10) 和 INT(1) 存储的数据范围一样吗？那个数字到底是什么意思？
- VARCHAR(50) 中的 50 是 50 个字节还是 50 个字符？
- 为什么存中文会乱码？utf8 和 utf8mb4 有什么区别？
- 字符集选错了真的会影响查询性能吗？

这一章就是为了解答这些问题。我们会从底层存储出发，搞清楚 **数据类型的真实占用** 和 **字符集编码的工作原理**，让你彻底告别"数据溢出"和"乱码"两大经典坑。

学完本章，你将能够：
- 准确说出每种数据类型的字节占用和取值范围
- 理解字符集编码的底层原理
- 正确选择字符集避免乱码问题
- 知道字符集转换对性能的影响

---

## 3.1 为什么需要深入了解数据类型？

### 痛点分析

很多开发者在选择数据类型时非常随意，结果踩了各种坑：

- 用 INT 存性别（其实 TINYINT 就够了，浪费 3 字节）
- 用 VARCHAR(255) 存所有字符串（浪费空间，影响索引效率）
- 用 utf8 存 emoji 表情，结果报错或乱码
- 数字字段存了超出范围的值，数据被静默截断
- 表数据量一大，才发现数据类型选错导致索引失效

### 生活化类比

> 选择数据类型就像选快递箱子：
> - 寄一枚戒指用大纸箱 = 浪费空间（用 INT 存性别）
> - 寄一台电视用小盒子 = 装不下（用 TINYINT 存年龄，结果超范围）
> - 寄国际快递用错编码 = 地址看不懂（用 latin1 存中文 = 乱码）
>
> 选对箱子，既省运费又安全；选对数据类型，既省空间又高效。

### 对比一下

| 数据类型选择 | 存储空间 | 查询效率 | 数据安全 |
|------------|---------|---------|---------|
| 随意选 VARCHAR(255) | 浪费大量空间 | 索引效率低 | 无约束 |
| 精确选择合适类型 | 最小化存储 | 索引效率高 | 有范围保护 |
| 1000万行表，每行浪费10字节 | 多占约 95MB | 缓冲池命中率下降 | 可能溢出 |

> **一句话总结**：数据类型选对了，数据库又小又快；选错了，又慢又容易出问题。

---

## 3.2 整数类型

### 底层存储

MySQL 的整数类型按字节数区分，字节越多，能存的范围越大：

| 类型 | 字节数 | 有符号范围 | 无符号范围 |
|------|-------|-----------|-----------|
| TINYINT | 1 字节 | -128 ~ 127 | 0 ~ 255 |
| SMALLINT | 2 字节 | -32768 ~ 32767 | 0 ~ 65535 |
| MEDIUMINT | 3 字节 | -8388608 ~ 8388607 | 0 ~ 16777215 |
| INT | 4 字节 | -21亿 ~ 21亿 | 0 ~ 42亿 |
| BIGINT | 8 字节 | -922亿亿 ~ 922亿亿 | 0 ~ 1844亿亿 |

### INT(10) 中的数字是什么意思？

很多人以为 `INT(10)` 表示存储范围更大，这是**错误的**。`INT(1)` 和 `INT(10)` 的存储范围和字节数**完全一样**，都是 4 字节。

括号里的数字叫**显示宽度**，只在配合 `ZEROFILL` 使用时才有意义——不够位数时用 0 补齐。

```sql
-- INT(1) 和 INT(10) 存储范围完全相同
CREATE TABLE test_int (
    a INT(1),                            -- 4字节，范围 -21亿~21亿
    b INT(10)                            -- 4字节，范围 -21亿~21亿
);
-- a 和 b 能存的最大值一模一样

-- 显示宽度只在 ZEROFILL 时有用
CREATE TABLE test_zerofill (
    id INT(5) ZEROFILL                   -- 不足5位时用0补齐
);
INSERT INTO test_zerofill VALUES (42);
-- 查询结果会显示 00042（补齐到5位）
-- 但存储的值仍然是 42
```

### 通俗类比

> INT 括号里的数字就像手机的"显示字体大小"——你把字体调大调小，电话号码本身不会变。INT(1) 和 INT(10) 就像同一个电话号码用大号字体和小号字体显示，号码本身没区别。

### 基础用法 + 逐行注释

```sql
-- 正确选择整数类型的示例
CREATE TABLE user_stats (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,  -- 主键用 BIGINT，防止 ID 溢出
    age TINYINT UNSIGNED,                        -- 年龄最大 150，TINYINT 足够（0~255）
    login_count SMALLINT UNSIGNED DEFAULT 0,     -- 登录次数，SMALLINT 到 65535
    total_score INT UNSIGNED DEFAULT 0,          -- 总积分，INT 到 42亿
    status TINYINT DEFAULT 0,                    -- 状态值 0/1/2，TINYINT 就够
    PRIMARY KEY (id)                             -- 设置主键
) ENGINE = InnoDB;                               -- 使用 InnoDB 引擎

-- 对比空间占用
-- 如果全部用 INT：每行 5 * 4 = 20 字节
-- 合理选择后：8 + 1 + 2 + 4 + 1 = 16 字节
-- 每行省了 4 字节，1000万行就省了约 38MB
```

---

## 3.3 字符串类型

### CHAR vs VARCHAR

这是最经典的数据类型选择题。两者的核心区别：

| 对比维度 | CHAR(n) | VARCHAR(n) |
|---------|---------|-----------|
| 长度 | 固定长度 n | 可变长度，最大 n |
| 存储空间 | 始终占 n 个字符 | 实际长度 + 1~2 字节长度前缀 |
| 速度 | 更快（定长，不需要计算长度） | 稍慢（需要处理长度前缀） |
| 适用场景 | 长度固定的数据（手机号、身份证） | 长度不固定的数据（昵称、地址） |
| 尾部空格 | 查询时自动去除 | 保留 |

### 通俗类比

> CHAR 就像**固定的停车位**——不管停的是自行车还是大卡车，都占一个完整的车位。
> VARCHAR 就像**可伸缩的收纳袋**——东西小袋子就小，东西大袋子就大，但袋子本身有个最大容量。

### VARCHAR(n) 中的 n 是字符数，不是字节数

```sql
-- 在 utf8mb4 字符集下
CREATE TABLE test_varchar (
    name VARCHAR(10)                       -- 10 个字符，不是 10 个字节
);

-- 英文：每个字符 1 字节
INSERT INTO test_varchar VALUES ('hello'); -- 5个字符 = 5字节

-- 中文：每个字符 3 字节（utf8mb4）
INSERT INTO test_varchar VALUES ('你好');  -- 2个字符 = 6字节

-- 都能存进去，因为 n 是按字符数算的
-- VARCHAR(10) 可以存 10 个英文，也可以存 10 个中文
```

### 基础用法 + 逐行注释

```sql
-- 正确选择字符串类型
CREATE TABLE user_profile (
    id INT PRIMARY KEY,                    -- 主键
    phone CHAR(11) NOT NULL,               -- 手机号固定 11 位，用 CHAR
    id_card CHAR(18),                      -- 身份证号固定 18 位，用 CHAR
    nickname VARCHAR(50),                  -- 昵称长度不固定，用 VARCHAR
    address VARCHAR(200),                  -- 地址长度不固定，用 VARCHAR
    bio VARCHAR(500)                       -- 个人简介，用 VARCHAR
) ENGINE = InnoDB;                         -- InnoDB 引擎

-- 错误示例：所有字段都用 VARCHAR(255)
-- 原因：
-- 1. 手机号用 VARCHAR(255) 浪费空间且无法限制长度
-- 2. VARCHAR(255) 会影响索引效率（MySQL 5.0.3 之前会截断索引）
-- 3. 无法在数据库层面做数据校验
```

### TEXT 和 BLOB 类型

| 类型 | 最大长度 | 用途 |
|------|---------|------|
| TINYTEXT / TINYBLOB | 255 字节 | 短文本 / 小二进制 |
| TEXT / BLOB | 64KB | 普通文本 / 二进制 |
| MEDIUMTEXT / MEDIUMBLOB | 16MB | 长文本 / 中等二进制 |
| LONGTEXT / LONGBLOB | 4GB | 超长文本 / 大二进制 |

```sql
-- TEXT 类型示例
CREATE TABLE article (
    id INT PRIMARY KEY,                    -- 主键
    title VARCHAR(200),                    -- 标题用 VARCHAR
    content MEDIUMTEXT,                    -- 文章内容可能很长，用 MEDIUMTEXT
    cover_image MEDIUMBLOB                 -- 封面图片存二进制，用 MEDIUMBLOB
) ENGINE = InnoDB;                         -- InnoDB 引擎

-- 注意：TEXT 和 BLOB 字段的数据存储在"溢出页"中
-- InnoDB 的数据页是 16KB，如果一行数据太大
-- 超出部分会放到单独的溢出页里，查询时需要额外的 IO
```

---

## 3.4 日期时间类型

### 底层存储对比

| 类型 | 字节数 | 范围 | 精度 |
|------|-------|------|------|
| DATE | 3 字节 | 1000-01-01 ~ 9999-12-31 | 天 |
| TIME | 3 字节 | -838:59:59 ~ 838:59:59 | 秒 |
| DATETIME | 8 字节 | 1000-01-01 ~ 9999-12-31 23:59:59 | 秒 |
| TIMESTAMP | 4 字节 | 1970-01-01 ~ 2038-01-19 03:14:07 | 秒 |
| YEAR | 1 字节 | 1901 ~ 2155 | 年 |

### DATETIME vs TIMESTAMP

这是另一个经典的选择题：

| 对比维度 | DATETIME | TIMESTAMP |
|---------|----------|-----------|
| 字节数 | 8 字节 | 4 字节（省一半） |
| 范围 | 1000~9999 年 | 1970~2038 年 |
| 时区 | 不受时区影响 | 受时区影响（存储 UTC，读取时转换） |
| 默认值 | 无自动默认值 | 可以自动设置为 CURRENT_TIMESTAMP |
| 索引效率 | 一般 | 略好（占用空间小） |

### 通俗类比

> DATETIME 就像你在日记本上写的日期——不管你在哪个国家写，看到的都是你写的那个时间。
> TIMESTAMP 就像手机上的时间——存的是 UTC 标准时间，显示的时候会根据你设置的时区自动转换。

### 基础用法 + 逐行注释

```sql
-- 正确选择日期类型
CREATE TABLE event_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,  -- 主键
    event_date DATE,                       -- 只关心日期（如生日），用 DATE（3字节）
    event_time TIME,                       -- 只关心时间（如每天打卡时间），用 TIME（3字节）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间，用 DATETIME（不受时区影响）
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- updated_at 用 TIMESTAMP
    -- 好处：每次 UPDATE 时自动更新为当前时间
    -- 注意：2038 年后会溢出，但大多数业务场景够用
    register_year YEAR                     -- 只存年份，用 YEAR（1字节）
) ENGINE = InnoDB;                         -- InnoDB 引擎

-- 验证 TIMESTAMP 的时区行为
SET time_zone = '+08:00';                  -- 设置当前会话时区为东八区（北京时间）
INSERT INTO event_log (created_at) VALUES ('2024-01-01 12:00:00');
-- 存储时：2024-01-01 12:00:00 被转换为 UTC 时间 2024-01-01 04:00:00 存储

SET time_zone = '+00:00';                  -- 切换时区到 UTC
SELECT created_at FROM event_log;
-- 读取时：UTC 时间 04:00:00 转换为 04:00:00 显示
-- DATETIME 字段不会随时区变化，TIMESTAMP 字段会
```

---

## 3.5 字符集编码原理

### 什么是字符集？

字符集就是一套"字符到数字的映射表"。计算机只认识数字，所以每个字符都要对应一个数字编号。

### 常见字符集演进

| 字符集 | 出现时间 | 字节数 | 能表示的字符 |
|-------|---------|-------|------------|
| ASCII | 1960s | 1 字节（7位） | 128 个字符（英文字母、数字、符号） |
| latin1 | 1980s | 1 字节 | 256 个字符（西欧语言） |
| GB2312 | 1980 | 2 字节 | 6763 个汉字 |
| GBK | 1995 | 2 字节 | 21886 个汉字（包含繁体） |
| Unicode | 1990s | 2~4 字节 | 全世界所有字符 |
| UTF-8 | 1993 | 1~4 字节 | Unicode 的可变长度编码 |
| utf8mb4 | MySQL 特有 | 1~4 字节 | 完整的 UTF-8（支持 emoji） |

### 通俗类比

> 字符集就像**密码本**。发件人和收件人必须用同一本密码本，否则收到的就是一堆乱码。
> - ASCII 是一本小密码本，只收录了英文字母
> - UTF-8 是一本大密码本，收录了全世界的文字
> - 如果你用 UTF-8 编码发送，但对方用 latin1 解码，就会乱码

### UTF-8 编码规则

UTF-8 是**可变长度**编码，不同字符占用不同字节数：

| 字符类型 | 字节数 | 示例 |
|---------|-------|------|
| 英文字母、数字 | 1 字节 | a = 0x61 |
| 西欧特殊字符 | 2 字节 | e-acute = 0xC3 0xA9 |
| 中文、日文、韩文 | 3 字节 | 中 = 0xE4 0xB8 0xAD |
| emoji、生僻字 | 4 字节 |  smile = 0xF0 0x9F 0x98 0x80 |

### utf8 vs utf8mb4（重要）

这是 MySQL 的一个历史遗留问题：

```
MySQL 的 utf8 编码 = 最多 3 字节的 UTF-8
MySQL 的 utf8mb4 编码 = 完整的 UTF-8（最多 4 字节）

utf8mb4 中的 mb4 = multi byte 4 bytes
```

| 对比 | MySQL 的 utf8 | MySQL 的 utf8mb4 |
|------|-------------|-----------------|
| 最大字节数 | 3 字节 | 4 字节 |
| 能否存 emoji | 不能（会报错） | 能 |
| 能否存生僻汉字 | 部分不能 | 能 |
| 空间占用 | 略小 | 略大（但差异可忽略） |
| 推荐程度 | 不推荐 | 强烈推荐 |

### 基础用法 + 逐行注释

```sql
-- 查看 MySQL 支持的字符集
SHOW CHARACTER SET;
-- 作用：列出所有可用的字符集
-- 重点关注 utf8mb4

-- 查看当前数据库的字符集
SHOW VARIABLES LIKE 'character_set%';
-- 关键参数：
-- character_set_server：服务端默认字符集
-- character_set_database：当前数据库的字符集
-- character_set_connection：当前连接的字符集
-- character_set_client：客户端发送数据的字符集
-- character_set_results：返回结果的字符集

-- 创建数据库时指定字符集
CREATE DATABASE myapp
    DEFAULT CHARACTER SET utf8mb4          -- 数据库级别字符集设为 utf8mb4
    DEFAULT COLLATE utf8mb4_general_ci;    -- 排序规则：不区分大小写

-- 创建表时指定字符集
CREATE TABLE messages (
    id INT PRIMARY KEY,                    -- 主键
    content VARCHAR(500)                   -- 消息内容
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4                -- 表级别字符集
  COLLATE = utf8mb4_general_ci;            -- 排序规则

-- 验证 utf8mb4 能存 emoji
INSERT INTO messages (id, content) VALUES (1, 'Hello');
-- 成功

INSERT INTO messages (id, content) VALUES (2, '你好世界');
-- 成功

INSERT INTO messages (id, content) VALUES (3, '开心');
-- 如果字符集是 utf8（3字节），这里会报错
-- 如果字符集是 utf8mb4（4字节），正常存入

-- 查看某张表的字符集
SHOW CREATE TABLE messages;
-- 输出中会显示 CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
```

---

## 3.6 字符集转换性能

### 什么时候会发生字符集转换？

当客户端字符集和服务端字符集**不一致**时，MySQL 会自动做字符集转换。这个过程有性能开销。

```
客户端（utf8mb4）  -->  转换  -->  服务端（latin1）
     |                              |
     +--- 额外消耗 CPU 做编码转换 ---+
```

### 通俗类比

> 字符集转换就像**翻译**。如果你的朋友说中文，你说英文，每次交流都需要中间有个翻译。翻译本身需要时间（CPU 开销），而且可能翻译错（乱码或数据丢失）。最好的方式是大家说同一种语言（使用相同的字符集）。

### 基础用法 + 逐行注释

```sql
-- 查看当前连接的字符集配置
SELECT
    @@character_set_client,                -- 客户端字符集
    @@character_set_connection,            -- 连接层字符集
    @@character_set_results,               -- 结果集字符集
    @@character_set_server;                -- 服务端字符集
-- 理想情况：四个值都一样，不需要转换

-- 设置连接字符集（推荐在连接时设置）
SET NAMES utf8mb4;
-- 这一条命令同时设置了三个变量：
-- character_set_client = utf8mb4
-- character_set_connection = utf8mb4
-- character_set_results = utf8mb4
-- 确保客户端和服务端使用相同字符集，避免转换开销

-- 验证字符集转换的性能影响
-- 开启 profiling 查看查询耗时
SET profiling = 1;                         -- 开启性能分析

-- 无转换：客户端和服务端字符集一致
SELECT COUNT(*) FROM messages;
-- 直接执行，无额外开销

-- 有转换：手动设置不一致的字符集
SET character_set_connection = latin1;     -- 故意设置不一致
SELECT COUNT(*) FROM messages;
-- MySQL 需要将 utf8mb4 的数据转为 latin1 再返回
-- 会多一步转换开销

SET profiling = 0;                         -- 关闭性能分析
SHOW PROFILES;                             -- 查看各查询的耗时对比
```

### 乱码排查流程

```
发现乱码？按以下步骤排查：

1. 检查服务端字符集
   SHOW VARIABLES LIKE 'character_set_server';
   -- 应该是 utf8mb4

2. 检查数据库字符集
   SELECT DEFAULT_CHARACTER_SET_NAME FROM information_schema.SCHEMATA
   WHERE SCHEMA_NAME = '你的数据库名';

3. 检查表字符集
   SHOW CREATE TABLE 你的表名;

4. 检查连接字符集
   SELECT @@character_set_connection;
   -- 应该和服务端一致

5. 检查客户端工具编码
   -- Navicat / DBeaver / 命令行工具的编码设置
   -- 确保也是 utf8mb4
```

---

## 3.7 对比表格：数据类型选择速查

| 数据场景 | 推荐类型 | 不推荐类型 | 理由 |
|---------|---------|-----------|------|
| 用户年龄 | TINYINT UNSIGNED | INT | 年龄不会超过 255，省 3 字节 |
| 手机号 | CHAR(11) | VARCHAR(255) | 固定 11 位，CHAR 更高效 |
| 用户昵称 | VARCHAR(50) | TEXT | 昵称长度有限，不需要 TEXT |
| 文章内容 | MEDIUMTEXT | VARCHAR(65535) | 文章可能超过 65KB |
| 创建时间 | DATETIME | TIMESTAMP | 不受 2038 问题影响 |
| 更新时间 | TIMESTAMP | DATETIME | 可以自动更新，省空间 |
| 性别 | TINYINT(1) | VARCHAR(10) | 0/1/2 就够了，省空间 |
| 价格/金额 | DECIMAL(10,2) | FLOAT / DOUBLE | 浮点型有精度丢失问题 |
| UUID | CHAR(36) | VARCHAR(255) | UUID 固定 36 字符 |
| 布尔值 | TINYINT(1) | VARCHAR(5) | 0/1 就够了 |

---

## 3.8 新手常见误区

### 误区一：认为 INT(1) 比 INT(10) 省空间

```sql
-- 错误想法 --
INT(1) 只占 1 字节，INT(10) 占 10 字节

-- 正确理解 --
INT(1) 和 INT(10) 都占 4 字节，存储范围完全一样
括号里的数字只是"显示宽度"，不影响存储
只有配合 ZEROFILL 时，显示宽度才有意义
```

### 误区二：认为 MySQL 的 utf8 就是完整的 UTF-8

```sql
-- 错误想法 --
MySQL 的 utf8 能存所有字符

-- 正确理解 --
MySQL 的 utf8 是"阉割版"的 UTF-8，最多只支持 3 字节
无法存储 emoji 和部分生僻汉字（需要 4 字节）
应该使用 utf8mb4，这才是真正的完整 UTF-8
```

### 误区三：认为 VARCHAR 越长越好

```sql
-- 错误写法 --
CREATE TABLE users (
    name VARCHAR(255),                     -- 不管实际多长，都给 255
    phone VARCHAR(255),                    -- 手机号也用 255
    status VARCHAR(255)                    -- 状态值也用 255
);
-- 问题：
-- 1. 虽然 VARCHAR 是变长的，但过大的长度会影响内存分配
-- 2. InnoDB 的索引对字段长度有限制，过长的字段可能导致索引失效
-- 3. 无法在数据库层面做长度校验

-- 正确写法 --
CREATE TABLE users (
    name VARCHAR(50),                      -- 人名不会超过 50 字符
    phone CHAR(11),                        -- 手机号固定 11 位
    status TINYINT                         -- 状态值用数字表示
);
```

### 误区四：认为 FLOAT/DOUBLE 可以存金额

```sql
-- 错误写法 --
CREATE TABLE products (
    price FLOAT(10, 2)                     -- 用浮点型存价格
);
INSERT INTO products VALUES (99.99);
SELECT * FROM products WHERE price = 99.99;
-- 可能查不到！因为浮点数有精度问题
-- 99.99 在计算机中实际存储的可能是 99.99000000000001

-- 正确写法 --
CREATE TABLE products (
    price DECIMAL(10, 2)                   -- 用精确数值型存价格
);
INSERT INTO products VALUES (99.99);
SELECT * FROM products WHERE price = 99.99;
-- DECIMAL 是精确存储，不会有精度丢失
```

### 误区五：认为字符集只在创建表时设置一次就行

```sql
-- 错误想法 --
建表时设了 utf8mb4，以后就不用管了

-- 正确理解 --
字符集需要在多个层面保持一致：
-- 1. 服务端：character_set_server = utf8mb4
-- 2. 数据库：CREATE DATABASE ... CHARSET utf8mb4
-- 3. 表：CREATE TABLE ... CHARSET utf8mb4
-- 4. 连接：SET NAMES utf8mb4
-- 5. 客户端工具：编辑器/客户端的编码也要设为 utf8mb4
-- 任何一层不一致都可能导致乱码
```

---

## 3.9 动手练习

### 练习一（基础）：验证数据类型的空间占用

创建以下三张表，用相同的数据填充，然后比较它们的大小：

```sql
-- 表 A：浪费型设计
CREATE TABLE test_waste (
    id INT,                                -- 4字节
    age INT,                               -- 4字节（浪费，TINYINT 就够）
    gender INT,                            -- 4字节（浪费，TINYINT(1) 就够）
    phone VARCHAR(255)                     -- 变长（浪费，CHAR(11) 就够）
) ENGINE = InnoDB;

-- 表 B：合理设计
CREATE TABLE test_optimal (
    id INT,                                -- 4字节
    age TINYINT UNSIGNED,                  -- 1字节
    gender TINYINT UNSIGNED,               -- 1字节
    phone CHAR(11)                         -- 固定11字符
) ENGINE = InnoDB;
```

请分别插入 10000 条数据，然后用 `SHOW TABLE STATUS` 比较两张表的 `DATA_LENGTH`。

<details>
<summary>点击查看答案</summary>

```sql
-- 插入数据可以用存储过程或批量 INSERT
-- 简化版：各插入几条观察趋势

INSERT INTO test_waste VALUES
    (1, 25, 1, '13800138000'),
    (2, 30, 0, '13900139000'),
    (3, 28, 1, '13700137000');

INSERT INTO test_optimal VALUES
    (1, 25, 1, '13800138000'),
    (2, 30, 0, '13900139000'),
    (3, 28, 1, '13700137000');

-- 比较表大小
SHOW TABLE STATUS WHERE Name LIKE 'test_%';

-- 分析：
-- test_waste 每行约：4+4+4+11+2(长度前缀) = 25 字节
-- test_optimal 每行约：4+1+1+11 = 17 字节
-- 每行省了约 8 字节
-- 10000 行就省了约 78KB
-- 1000万行就省了约 76MB
-- 数据量越大，差距越明显
```

</details>

### 练习二（进阶）：字符集乱码排查

假设你遇到以下情况：从数据库查出的中文显示为乱码。请按照 3.6 节中的排查流程，逐步检查以下环节：

1. 服务端字符集
2. 数据库字符集
3. 表字符集
4. 连接字符集
5. 客户端工具编码

请写出每一步对应的 SQL 命令。

<details>
<summary>点击查看答案</summary>

```sql
-- 步骤 1：检查服务端字符集
SHOW VARIABLES LIKE 'character_set_server';
-- 期望值：utf8mb4
-- 如果不是，修改 my.cnf：character-set-server = utf8mb4

-- 步骤 2：检查数据库字符集
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = '你的数据库名';
-- 期望值：utf8mb4 / utf8mb4_general_ci
-- 如果不是：ALTER DATABASE 你的数据库名 CHARACTER SET utf8mb4;

-- 步骤 3：检查表字符集
SHOW CREATE TABLE 你的表名;
-- 看输出中的 DEFAULT CHARSET
-- 如果不是：ALTER TABLE 你的表名 CONVERT TO CHARACTER SET utf8mb4;

-- 步骤 4：检查连接字符集
SELECT @@character_set_client, @@character_set_connection, @@character_set_results;
-- 三个值应该都是 utf8mb4
-- 如果不是：执行 SET NAMES utf8mb4;

-- 步骤 5：检查客户端工具
-- 这一步不是 SQL 命令，而是在你的数据库客户端工具中设置
-- Navicat：连接属性 -> 高级 -> 字符集 -> 选 utf8mb4
-- DBeaver：连接设置 -> 初始化参数 -> SET NAMES utf8mb4
-- 命令行：启动时加 --default-character-set=utf8mb4
```

</details>

### 练习三（挑战）：设计一张完整的用户表

为一个小系统设计用户表，要求：
- 用户 ID：雪花算法生成的长整型
- 手机号：固定 11 位
- 昵称：最长 50 字符
- 年龄：0~150
- 性别：0=未知，1=男，2=女
- 账户余额：精确到分
- 个人简介：最长 500 字符
- 注册时间：需要自动记录
- 最后登录时间：需要自动更新
- 状态：0=禁用，1=正常

要求：
1. 为每个字段选择最合适的数据类型
2. 指定正确的字符集
3. 每行代码加上注释说明选择理由

<details>
<summary>点击查看答案</summary>

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL,
    -- 雪花算法 ID，范围很大，用 BIGINT UNSIGNED
    -- 不用 AUTO_INCREMENT 因为 ID 由应用层生成

    phone CHAR(11) NOT NULL,
    -- 手机号固定 11 位，用 CHAR 定长类型
    -- 比 VARCHAR 更高效，且能限制长度

    nickname VARCHAR(50) NOT NULL,
    -- 昵称长度不固定，用 VARCHAR
    -- 50 字符足够覆盖大多数昵称

    age TINYINT UNSIGNED,
    -- 年龄范围 0~150，TINYINT UNSIGNED（0~255）完全够用
    -- 只占 1 字节，比 INT 省 3 字节

    gender TINYINT UNSIGNED DEFAULT 0,
    -- 0/1/2 三个值，TINYINT 足够
    -- UNSIGNED 防止出现负数

    balance DECIMAL(10, 2) DEFAULT 0.00,
    -- 金额必须用 DECIMAL，不能用 FLOAT/DOUBLE
    -- 10位总长，2位小数，最大能存 99999999.99

    bio VARCHAR(500),
    -- 个人简介长度不固定，用 VARCHAR
    -- 500 字符上限

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- 注册时间用 DATETIME
    -- 不受 2038 问题影响，不需要自动更新

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- 最后登录时间用 TIMESTAMP
    -- ON UPDATE CURRENT_TIMESTAMP 让每次更新自动刷新时间

    status TINYINT UNSIGNED DEFAULT 1,
    -- 状态值 0/1，TINYINT 足够

    PRIMARY KEY (id),                      -- 主键
    UNIQUE KEY uk_phone (phone)            -- 手机号唯一索引
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4                -- 使用 utf8mb4 支持所有字符
  COLLATE = utf8mb4_general_ci;            -- 排序不区分大小写
```

</details>

---

## 3.10 下一章预告

现在我们了解了 MySQL 的架构、存储引擎和数据类型。但当你输入一条 SQL 语句时，MySQL 内部到底是怎么一步步处理的？从你按下回车到看到结果，中间经历了哪些阶段？

下一章我们将深入 **SQL 执行流程**，追踪一条 SQL 语句在 MySQL 内部的完整旅程——从解析、优化到执行、返回。
