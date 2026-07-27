---
title: "第 15 章：分库分表原理"
description: "深入理解 MySQL 分库分表，掌握垂直拆分、水平拆分、分片策略及分布式事务"
---

# 第 15 章：分库分表原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 数据量达到亿级，单库单表扛不住了，怎么办？
- 垂直拆分和水平拆分有什么区别？什么时候用哪个？
- 分片策略那么多（Hash、Range、时间），该怎么选？
- 分库分表之后，跨库查询和分布式事务怎么处理？

这一章就是为了解答这些问题。我们会从"一个仓库放不下"这个最朴素的场景出发，用生活中的例子帮你搞懂 **分库分表的核心原理**，让你知道怎么应对海量数据的挑战。

---

## 1 为什么需要分库分表？

### 痛点分析

想象你经营一家快递仓库，所有包裹都堆在一个仓库里：
- 包裹越来越多，仓库快放不下了（存储瓶颈）
- 找一个包裹要在几万件里翻，越来越慢（查询瓶颈）
- 快递员进进出出，仓库门口堵得水泄不通（并发瓶颈）

这就像单台 MySQL 数据库面对的问题：
- 数据量超过千万级，查询越来越慢
- 单表行数过多，索引也救不了
- 写入并发太高，数据库 CPU 打满
- 磁盘空间快满了，扩容无门

**性能下降的临界点：**
- 单表 500 万行：查询开始变慢
- 单表 1000 万行：明显感觉到延迟
- 单表 5000 万行以上：性能急剧下降

### 解决方案：分库分表

有了分库分表，就像快递公司把一个大仓库拆成多个小仓库：
1. 按城市分仓库（垂直分库：不同业务放不同库）
2. 按区域分货架（水平分表：同类数据分散到多张表）
3. 每个仓库独立运作，互不干扰

打个比方：

> 分库分表就像把一本 1000 页的字典拆成 10 本 100 页的小册子。找字的时候，先确定在哪本小册子，再在里面找，速度快多了。

| 对比项 | 单库单表 | 分库分表后 |
|--------|----------|------------|
| 存储容量 | 受限于单机磁盘 | 多机分布式存储，理论上无限 |
| 查询性能 | 数据量大时急剧下降 | 每个分片数据量小，查询快 |
| 写入并发 | 单机写入上限 | 多机并行写入，并发成倍提升 |
| 运维难度 | 简单 | 复杂（需要中间件） |
| 跨库查询 | 不存在 | 困难（需要特殊处理） |

> 一句话总结：分库分表是把大数据"化整为零"，分散到多个库和表中，让每个库/表都保持轻量。

---

## 2 核心原理讲解

### 概念解释

分库分表有两大类型：

**垂直拆分（按业务拆）：**
- 垂直分库：按业务维度，把不同业务的表拆到不同的数据库
- 垂直分表：把一张表中不常用的字段拆到另一张表

**水平拆分（按数据拆）：**
- 水平分库：把同一张表的数据按某个维度拆到不同的数据库
- 水平分表：把同一张表的数据按某个维度拆到不同的表

打个比方：

> 垂直拆分就像把"大杂院"改成"专业楼"——医院一栋楼、学校一栋楼、商场一栋楼。
> 水平拆分就像把"一个班 100 人"拆成"4 个班每班 25 人"——学生还是学生，但分散管理了。

### 分片策略

分片策略决定了"一条数据应该存到哪个库/表"：

```
1. Hash 分片：user_id % 4 → 决定存到哪个分片
   优点：数据分布均匀
   缺点：范围查询困难

2. Range 分片：id 1-100万 → 分片1，id 101-200万 → 分片2
   优点：范围查询方便
   缺点：可能数据不均匀

3. 时间分片：2024年的数据 → 分片1，2025年的数据 → 分片2
   优点：历史数据好管理
   缺点：当前分片可能很大
```

### 分布式事务

分库分表后，一个业务操作可能涉及多个库，如何保证一致性？

```
方案1：XA 协议（强一致）
  协调者：通知所有参与者准备 → 等待确认 → 通知提交/回滚
  优点：强一致
  缺点：性能差（锁定资源时间长）

方案2：TCC（柔性事务）
  Try：预留资源
  Confirm：确认执行
  Cancel：取消回滚
  优点：性能好
  缺点：代码侵入性强

方案3：Saga（长事务）
  每个操作都有对应的补偿操作
  优点：适合长事务
  缺点：不保证隔离性

方案4：本地消息表（最终一致）
  业务操作 + 写消息表在同一个本地事务
  异步消费消息，完成跨库操作
  优点：实现简单，性能好
  缺点：最终一致，非强一致
```

### 对比分析

| 拆分方式 | 适用场景 | 优点 | 缺点 |
|----------|----------|------|------|
| 垂直分库 | 不同业务相互独立 | 业务解耦，独立维护 | 跨库查询困难 |
| 垂直分表 | 表中有大字段不常用 | 减少单表宽度，提高查询效率 | 需要 JOIN 操作 |
| 水平分表 | 单表数据量过大 | 单表数据量小，查询快 | 跨表查询复杂 |
| 水平分库 | 单机写入性能不足 | 多机并行写入 | 分布式事务复杂 |

---

## 3 基础用法

### 示例 1：垂直分库

```sql
-- ============================================
-- 垂直分库：按业务拆分数据库
-- 原来：一个电商库，所有表混在一起
-- ============================================

-- ❌ 拆分前：一个大数据库
-- ecommerce_db
--   ├── users          （用户表）
--   ├── user_addresses （用户地址表）
--   ├── orders         （订单表）
--   ├── order_items    （订单详情表）
--   ├── products       （商品表）
--   ├── categories     （分类表）
--   ├── payments       （支付表）
--   └── refunds        （退款表）

-- ✅ 拆分后：按业务拆成多个库

-- 用户库：只管用户相关
-- user_db
CREATE DATABASE user_db;                       -- 创建用户库
USE user_db;
CREATE TABLE users (                            -- 用户表
    id BIGINT PRIMARY KEY AUTO_INCREMENT,       -- 用户ID
    username VARCHAR(50) NOT NULL,              -- 用户名
    email VARCHAR(100) NOT NULL,                -- 邮箱
    phone VARCHAR(20),                          -- 手机号
    created_at DATETIME DEFAULT NOW()           -- 创建时间
);
CREATE TABLE user_addresses (                   -- 用户地址表
    id BIGINT PRIMARY KEY AUTO_INCREMENT,       -- 地址ID
    user_id BIGINT NOT NULL,                    -- 用户ID
    address VARCHAR(200) NOT NULL,              -- 详细地址
    is_default TINYINT DEFAULT 0                -- 是否默认地址
);

-- 订单库：只管订单相关
-- order_db
CREATE DATABASE order_db;                       -- 创建订单库
USE order_db;
CREATE TABLE orders (                           -- 订单表
    id BIGINT PRIMARY KEY AUTO_INCREMENT,       -- 订单ID
    user_id BIGINT NOT NULL,                    -- 用户ID
    total_amount DECIMAL(10,2) NOT NULL,        -- 总金额
    status TINYINT DEFAULT 0,                   -- 订单状态
    created_at DATETIME DEFAULT NOW()           -- 创建时间
);
CREATE TABLE order_items (                      -- 订单详情表
    id BIGINT PRIMARY KEY AUTO_INCREMENT,       -- 详情ID
    order_id BIGINT NOT NULL,                   -- 订单ID
    product_id BIGINT NOT NULL,                 -- 商品ID
    quantity INT NOT NULL,                      -- 数量
    price DECIMAL(10,2) NOT NULL                -- 单价
);

-- 商品库：只管商品相关
-- product_db
CREATE DATABASE product_db;                     -- 创建商品库
USE product_db;
CREATE TABLE products (                         -- 商品表
    id BIGINT PRIMARY KEY AUTO_INCREMENT,       -- 商品ID
    name VARCHAR(200) NOT NULL,                 -- 商品名称
    price DECIMAL(10,2) NOT NULL,               -- 价格
    stock INT DEFAULT 0,                        -- 库存
    category_id BIGINT                          -- 分类ID
);
CREATE TABLE categories (                       -- 分类表
    id BIGINT PRIMARY KEY AUTO_INCREMENT,       -- 分类ID
    name VARCHAR(50) NOT NULL,                  -- 分类名称
    parent_id BIGINT DEFAULT 0                  -- 父分类ID
);
```

### 示例 2：垂直分表

```sql
-- ============================================
-- 垂直分表：把不常用字段拆出去
-- 用户表中 avatar 和 bio 是大字段，大部分查询不需要
-- ============================================

-- ❌ 拆分前：所有字段在一张表
-- CREATE TABLE users (
--     id BIGINT PRIMARY KEY,
--     name VARCHAR(50),
--     email VARCHAR(100),
--     avatar MEDIUMBLOB,        -- 头像，很大
--     bio TEXT,                 -- 个人简介，很大
--     created_at DATETIME
-- );

-- ✅ 拆分后：常用字段和不常用字段分开

-- 用户基础表（常用字段，查询频繁）
CREATE TABLE users (                            -- 用户基础表
    id BIGINT PRIMARY KEY AUTO_INCREMENT,       -- 用户ID
    name VARCHAR(50) NOT NULL,                  -- 用户名
    email VARCHAR(100) NOT NULL,                -- 邮箱
    phone VARCHAR(20),                          -- 手机号
    created_at DATETIME DEFAULT NOW()           -- 创建时间
);

-- 用户详情表（不常用字段，需要时才查）
CREATE TABLE user_details (                     -- 用户详情表
    user_id BIGINT PRIMARY KEY,                 -- 用户ID（与users表1对1）
    avatar MEDIUMBLOB,                          -- 头像（大字段）
    bio TEXT,                                   -- 个人简介（大字段）
    updated_at DATETIME DEFAULT NOW()           -- 更新时间
);

-- 查询用户列表时，只查基础表（快）
SELECT id, name, email FROM users;              -- 不涉及大字段，查询快

-- 需要头像时，才查详情表
SELECT u.name, d.avatar                         -- 按需查询大字段
FROM users u
JOIN user_details d ON u.id = d.user_id
WHERE u.id = 100;
```

### 示例 3：水平分表（Hash 分片）

```sql
-- ============================================
-- 水平分表：把一张大表拆成多张小表
-- 订单表 4000 万行 → 4 张表，每张 1000 万行
-- 使用 Hash 分片：user_id % 4 决定存到哪张表
-- ============================================

-- 创建 4 张分片表
CREATE TABLE orders_0 (                         -- 分片表0
    id BIGINT PRIMARY KEY AUTO_INCREMENT,       -- 订单ID
    user_id BIGINT NOT NULL,                    -- 用户ID
    order_no VARCHAR(50) NOT NULL,              -- 订单号
    amount DECIMAL(10,2) NOT NULL,              -- 金额
    created_at DATETIME DEFAULT NOW()           -- 创建时间
);
CREATE TABLE orders_1 (                         -- 分片表1
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_no VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT NOW()
);
CREATE TABLE orders_2 (                         -- 分片表2
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_no VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT NOW()
);
CREATE TABLE orders_3 (                         -- 分片表3
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_no VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT NOW()
);

-- ============================================
-- 应用层路由逻辑（伪代码）
-- ============================================
-- int shardIndex = userId % 4;                 // 计算分片索引
-- String tableName = "orders_" + shardIndex;   // 确定表名
-- String sql = "INSERT INTO " + tableName + " ...";  // 拼接SQL

-- ✅ 按 user_id 查询（知道在哪张表）
-- user_id = 100 → 100 % 4 = 0 → 查 orders_0
SELECT * FROM orders_0 WHERE user_id = 100;     -- 只查一张表，快

-- ❌ 按 order_no 查询（不知道在哪张表）
-- 需要查所有分片表，再合并结果（慢）
SELECT * FROM orders_0 WHERE order_no = 'ORD001'   -- 查分片0
UNION ALL
SELECT * FROM orders_1 WHERE order_no = 'ORD001'   -- 查分片1
UNION ALL
SELECT * FROM orders_2 WHERE order_no = 'ORD001'   -- 查分片2
UNION ALL
SELECT * FROM orders_3 WHERE order_no = 'ORD001';  -- 查分片3
```

### 示例 4：ShardingSphere 分库分表配置

```yaml
# ============================================
# Spring Boot + ShardingSphere-JDBC 配置
# 实现 2 库 x 2 表 = 4 个分片
# ============================================
spring:
  shardingsphere:
    datasource:                                     # 数据源配置
      names: ds0,ds1                                # 两个数据源名称
      ds0:                                          # 数据源0
        type: com.zaxxer.hikari.HikariDataSource    # 连接池类型
        driver-class-name: com.mysql.cj.jdbc.Driver # MySQL驱动
        url: jdbc:mysql://192.168.1.101:3306/order_db  # 数据库0地址
        username: root                              # 用户名
        password: root123                           # 密码
      ds1:                                          # 数据源1
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://192.168.1.102:3306/order_db  # 数据库1地址
        username: root
        password: root123

    rules:
      sharding:                                     # 分片规则
        tables:                                     # 分片表配置
          t_order:                                  # 逻辑表名
            actual-data-nodes: ds$->{0..1}.t_order_$->{0..1}  # 实际数据节点
            # 展开后：ds0.t_order_0, ds0.t_order_1, ds1.t_order_0, ds1.t_order_1
            database-strategy:                      # 分库策略
              standard:
                sharding-column: user_id            # 分库字段
                sharding-algorithm-name: db-hash    # 分库算法
            table-strategy:                         # 分表策略
              standard:
                sharding-column: order_id           # 分表字段
                sharding-algorithm-name: table-hash # 分表算法

        sharding-algorithms:                        # 分片算法
          db-hash:                                  # 分库算法
            type: HASH_MOD                          # 取模算法
            props:
              sharding-count: 2                     # 2个库
          table-hash:                               # 分表算法
            type: HASH_MOD
            props:
              sharding-count: 2                     # 2张表

    props:
      sql-show: true                                # 打印实际SQL（调试用）
```

```java
// ============================================
// 使用示例：像操作普通表一样操作分片表
// ShardingSphere 自动路由到正确的库和表
// ============================================

// 插入订单（自动路由）
Order order = new Order();                          // 创建订单对象
order.setOrderId(1001L);                            // 订单ID
order.setUserId(100L);                              // 用户ID
order.setAmount(new BigDecimal("99.99"));           // 金额
orderMapper.insert(order);                          // 插入
// ShardingSphere 自动计算：
// 分库：100 % 2 = 0 → ds0
// 分表：1001 % 2 = 1 → t_order_1
// 实际SQL：INSERT INTO ds0.t_order_1 ...

// 查询订单（自动路由）
Order result = orderMapper.selectById(1001L);       // 查询
// ShardingSphere 自动路由到 ds0.t_order_1
```

### 示例 5：分布式事务（本地消息表方案）

```java
// ============================================
// 本地消息表：保证跨库操作的最终一致性
// 场景：下单时需要扣减库存（商品库）+ 创建订单（订单库）
// ============================================

@Service
public class OrderService {

    @Autowired
    private OrderDb orderDb;                        // 订单库
    @Autowired
    private ProductDb productDb;                    // 商品库
    @Autowired
    private MessageDb messageDb;                    // 消息表（和订单库同库）

    @Transactional                                  // 本地事务
    public void createOrder(Order order) {
        // 步骤1：在订单库创建订单
        orderDb.insert(order);                      // 写入订单

        // 步骤2：在同库的消息表中写入消息
        Message msg = new Message();                // 创建消息对象
        msg.setBizType("CREATE_ORDER");             // 业务类型
        msg.setBizId(order.getOrderId());           // 业务ID
        msg.setStatus("PENDING");                   // 待处理
        msg.setPayload(toJson(order));              // 消息内容（JSON）
        messageDb.insert(msg);                      // 写入消息表（和订单在同一个事务）
    }
    // 上面两步在同一个本地事务中，要么都成功，要么都失败
    }

    // 定时任务：异步消费消息，调用商品库扣减库存
    @Scheduled(fixedDelay = 1000)                   // 每秒执行一次
    public void consumeMessages() {
        List<Message> messages = messageDb.findPending();  // 查询待处理消息
        for (Message msg : messages) {
            try {
                Order order = fromJson(msg.getPayload());  // 解析消息
                productDb.deductStock(order);              // 扣减库存（商品库）
                msg.setStatus("SUCCESS");                  // 标记成功
            } catch (Exception e) {
                msg.setStatus("FAILED");                   // 标记失败
                msg.setRetryCount(msg.getRetryCount() + 1); // 重试次数+1
            }
            messageDb.update(msg);                         // 更新消息状态
        }
    }
}
```

---

## 4 对比表格

### 分片策略对比

| 分片策略 | 算法 | 数据分布 | 范围查询 | 扩容难度 | 适用场景 |
|----------|------|----------|----------|----------|----------|
| Hash 分片 | id % N | 均匀 | 困难（需查所有分片） | 困难（需要数据迁移） | 点查询为主 |
| Range 分片 | id 范围 | 可能不均 | 方便（定位到具体分片） | 容易（新增范围即可） | 范围查询为主 |
| 时间分片 | 按年月 | 当月可能很大 | 按时间方便 | 容易（新增时间分片） | 日志、历史数据 |
| 一致性Hash | 虚拟节点环 | 较均匀 | 困难 | 较容易（只迁移部分） | 大规模分布式系统 |

### 分布式事务方案对比

| 方案 | 一致性 | 性能 | 实现难度 | 适用场景 |
|------|--------|------|----------|----------|
| XA（2PC） | 强一致 | 低（锁资源时间长） | 低（数据库支持） | 对一致性要求极高 |
| TCC | 最终一致 | 高 | 高（需写3套逻辑） | 核心业务，如支付 |
| Saga | 最终一致 | 高 | 中（需补偿逻辑） | 长事务，跨多个服务 |
| 本地消息表 | 最终一致 | 高 | 低 | 大多数业务场景（推荐） |

### 垂直拆分 vs 水平拆分

| 对比项 | 垂直拆分 | 水平拆分 |
|--------|----------|----------|
| 拆分维度 | 按业务/字段 | 按行/数据量 |
| 解决的问题 | 业务耦合、大字段拖慢查询 | 单表数据量过大、写入并发不足 |
| 拆分后结构 | 不同的表/库 | 结构相同的多张表/多个库 |
| 查询方式 | 单库查询或 JOIN | 可能需要查多个分片再合并 |
| 实施难度 | 较低 | 较高（需要中间件） |

---

## 5 新手常见误区

### 误区 1："一上来就分库分表"

❌ **错误**：项目刚开始，数据量才几万行，就急着分库分表。

✅ **正确**：先优化 SQL 和索引，实在扛不住了再考虑分库分表。分库分表会大幅增加系统复杂度，不到万不得已不要上。记住：能不分就不分。

### 误区 2："分片策略随便选"

❌ **错误**：不考虑业务场景，随便选一个 Hash 分片。

✅ **正确**：分片策略要根据查询模式选择。经常按范围查询就选 Range，经常按 ID 点查就选 Hash。选错了策略，查询性能会很差。

### 误区 3："分库分表后跨库 JOIN 没问题"

❌ **错误**：以为分库分表后还能像以前一样 JOIN。

✅ **正确**：跨库 JOIN 是分库分表的最大痛点。解决方案：
- 数据冗余（把需要 JOIN 的字段冗余存储）
- 应用层组装（分别查询，在代码中组装）
- 使用中间件支持跨库 JOIN（如 ShardingSphere）

### 误区 4："扩容直接加分片就行"

❌ **错误**：认为扩容就是加一台机器，数据自动均衡。

✅ **正确**：Hash 分片扩容需要重新计算分片，涉及大量数据迁移。解决方案：
- 提前规划好分片数量
- 使用一致性 Hash，减少迁移量
- 使用 Range 分片，扩容只需新增范围

### 误区 5："分布式事务用 XA 就行了"

❌ **错误**：认为 XA 是万能的，所有场景都用 2PC。

✅ **正确**：XA 性能差，高并发场景扛不住。大多数互联网业务用"最终一致性"方案就够了（如本地消息表、消息队列），只有金融等核心场景才需要强一致。

---

## 6 动手练习

### 练习 1（基础）：垂直分库设计

有一个在线教育平台，包含以下表：
- 学生表、学生地址表
- 课程表、章节表
- 订单表、支付表
- 讲师表、讲师评价表

请设计垂直分库方案，画出拆分后的数据库结构，并说明拆分理由。

<details>
<summary>点击查看答案</summary>

**分库方案：**

```
学生库（student_db）
├── students          -- 学生表
└── student_addresses -- 学生地址表

课程库（course_db）
├── courses           -- 课程表
└── chapters          -- 章节表

订单库（order_db）
├── orders            -- 订单表
└── payments          -- 支付表

讲师库（teacher_db）
├── teachers          -- 讲师表
└── teacher_reviews   -- 讲师评价表
```

**拆分理由：**
1. 学生业务相对独立，查询频率高
2. 课程和章节是内容管理，读多写少
3. 订单和支付是交易核心，对一致性要求高，放一起方便做本地事务
4. 讲师业务独立，评价数据增长快，单独管理

</details>

### 练习 2（进阶）：水平分表 + 分片策略

有一个用户消息表 `messages`，数据量达到 5000 万行，需要拆分到 4 张表。
- 主要查询方式：按 user_id 查询某用户的消息列表
- 次要查询方式：按时间范围查询最新消息

请设计分片方案，写出建表语句和应用层路由逻辑。

<details>
<summary>点击查看答案</summary>

**分片方案：按 user_id Hash 分片**

```sql
-- 创建 4 张分片表（结构相同）
CREATE TABLE messages_0 (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,       -- 消息ID
    user_id BIGINT NOT NULL,                    -- 用户ID（分片键）
    content VARCHAR(500) NOT NULL,              -- 消息内容
    created_at DATETIME DEFAULT NOW(),          -- 创建时间
    INDEX idx_user_time (user_id, created_at)   -- 联合索引
);
-- messages_1, messages_2, messages_3 结构相同

-- 应用层路由逻辑
-- int shardIndex = userId % 4;                 // 按user_id取模
-- String table = "messages_" + shardIndex;     // 确定表名

-- ✅ 按 user_id 查询（快，只查一张表）
-- user_id = 100 → 100 % 4 = 0 → messages_0
SELECT * FROM messages_0
WHERE user_id = 100
ORDER BY created_at DESC
LIMIT 20;

-- ❌ 按时间范围查询（慢，需要查所有分片再合并）
-- 建议在应用层合并排序
```

**选择 Hash 分片的理由：**
1. 主要查询是按 user_id，Hash 分片能精确定位到一张表
2. 数据分布均匀，不会出现某张表特别大
3. 时间范围查询虽然需要查所有分片，但这是次要需求，可以接受

</details>

### 练习 3（挑战）：设计完整的分库分表方案

某电商平台，当前单库单表，面临以下问题：
- 订单表数据量 2 亿行，查询慢
- 每天新增 50 万订单，写入压力大
- 需要按用户 ID 查询订单，也需要按时间范围查询
- 下单时需要扣减库存（商品库）和创建订单（订单库）

请设计完整的分库分表方案，包括：
1. 分片策略选择
2. 分库分表方案
3. 跨库查询处理
4. 分布式事务方案

<details>
<summary>点击查看答案</summary>

**完整方案：**

**1. 分片策略：Hash + Range 混合**
- 按 user_id Hash 分库（4个库），保证同一用户的数据在同一库
- 按 order_id Hash 分表（每库 4 张表），保证数据均匀

**2. 分库分表方案：**
```
order_db_0（用户库0）
├── t_order_0   -- user_id % 4 = 0 且 order_id % 4 = 0
├── t_order_1   -- user_id % 4 = 0 且 order_id % 4 = 1
├── t_order_2   -- user_id % 4 = 0 且 order_id % 4 = 2
└── t_order_3   -- user_id % 4 = 0 且 order_id % 4 = 3

order_db_1 ~ order_db_3 结构相同
总共：4库 x 4表 = 16个分片
```

**3. 跨库查询处理：**
```
- 按 user_id 查询：精确定位到 1 个库，再定位到 1 张表（快）
- 按时间范围查询：需要查所有 16 个分片（慢）
  解决方案：建立"订单索引表"，按时间排序，先查索引表确定分片位置
  或者：使用 ES（Elasticsearch）做时间范围查询
```

**4. 分布式事务方案：本地消息表**
```
下单流程：
1. 订单库：创建订单 + 写入消息表（本地事务）
2. 异步消费消息：调用商品库扣减库存
3. 扣减失败：重试 3 次，仍失败则取消订单
4. 补偿操作：订单状态改为"已取消"

优点：性能好，不阻塞主流程
保证：最终一致性
```

</details>

---

## 下一章预告

下一章我们会学习 **性能调优实战**——数据库慢了怎么排查？你会学到：
- 慢查询日志的开启和分析
- EXPLAIN 执行计划的详细解读
- MySQL 关键参数的调优方法
- 真实的性能优化案例

从理论到实战，帮你成为数据库性能优化的"医生"，我们下一章见！
