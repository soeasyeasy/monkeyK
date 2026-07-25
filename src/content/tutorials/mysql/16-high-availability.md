---
title: "第16章：高可用与集群"
description: "主从复制、读写分离、MGR、分库分表"
---

# 第16章：高可用与集群

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如果数据库服务器挂了，整个系统不就瘫痪了吗？
- 用户量太大，一台数据库扛不住怎么办？
- 什么是主从复制？什么是分库分表？

这一章就是为了解答这些问题。我们会从生活中的例子出发，帮你搞懂如何让数据库更稳定、更强大。

---

## 16.1 为什么需要高可用？

### 单点故障的痛苦

假设你有一个电商网站，所有数据都存在一台 MySQL 服务器上。

如果这台服务器突然挂了：
- 用户无法下单
- 商家无法管理商品
- 所有业务停滞

这就像一家公司只有一个会计，会计请假了，整个公司的财务都停摆。

### 高可用的解决方式： redundancy（冗余）

高可用就是让系统有多个"备份"，一个挂了，其他的顶上。

打个比方：公司有多个会计，一个请假了，其他的可以继续工作，业务不受影响。

| 对比项 | 单台服务器 | 高可用集群 |
|--------|------------|------------|
| 故障影响 | 整个系统瘫痪 | 自动切换到备用节点 |
| 可用性 | 低（99%） | 高（99.99%） |
| 扩展性 | 差，单机性能有限 | 好，可以横向扩展 |
| 成本 | 低 | 高（需要多台服务器） |

> 一句话总结：高可用就是让数据库"永不宕机"，即使某台服务器挂了，系统也能继续运行。

---

## 16.2 主从复制

### 什么是主从复制？

主从复制是指一台主数据库（Master）的数据自动同步到一台或多台从数据库（Slave）。

打个比方：主数据库是"老师"，从数据库是"学生"。老师在黑板上写的内容，学生自动抄到自己的笔记本上。

### 主从复制的原理

主从复制分为三个步骤：

1. **Master 记录 binlog**
   - 主库的每次写操作都记录到二进制日志（binlog）

2. **Slave 复制 binlog**
   - 从库的 I/O 线程读取主库的 binlog，写入到本地的 relay log

3. **Slave 重放 binlog**
   - 从库的 SQL 线程读取 relay log，重放 SQL 语句，保持数据一致

```
Master (主库)
  ↓ 写入 binlog
Slave (从库)
  ↓ 读取 binlog → relay log
  ↓ 重放 SQL
数据同步完成
```

### 配置主从复制

**主库配置（my.cnf）**

```ini
[mysqld]
server-id = 1
# 主库的唯一 ID，必须唯一

log-bin = mysql-bin
# 开启二进制日志

binlog-format = ROW
# 使用 ROW 格式（推荐）
```

**从库配置（my.cnf）**

```ini
[mysqld]
server-id = 2
# 从库的唯一 ID，必须与主库不同

relay-log = relay-bin
# 中继日志
```

**启动复制**

```sql
-- 在主库创建复制用户
CREATE USER 'repl'@'%' IDENTIFIED BY 'repl_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';

-- 查看主库状态
SHOW MASTER STATUS;
-- 记录 File 和 Position 值

-- 在从库配置主库信息
CHANGE MASTER TO
  MASTER_HOST = '192.168.1.100',
  -- 主库 IP
  MASTER_USER = 'repl',
  -- 复制用户
  MASTER_PASSWORD = 'repl_password',
  -- 密码
  MASTER_LOG_FILE = 'mysql-bin.000001',
  -- 主库的 binlog 文件名
  MASTER_LOG_POS = 154;
  -- 主库的 binlog 位置

-- 启动复制
START SLAVE;

-- 查看复制状态
SHOW SLAVE STATUS;
-- 检查 Slave_IO_Running 和 Slave_SQL_Running 是否都是 Yes
```

### 复制类型

| 类型 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| 异步复制 | 主库写完 binlog 就返回，不等从库 | 性能最好 | 可能丢数据 |
| 半同步复制 | 主库等待至少一个从库确认 | 较安全 | 性能稍差 |
| 全同步复制 | 主库等待所有从库确认 | 最安全 | 性能最差 |

```sql
-- 查看半同步复制状态
SHOW VARIABLES LIKE 'rpl_semi_sync%';
-- 显示半同步复制相关配置
```

---

## 16.3 读写分离

### 什么是读写分离？

读写分离是指：
- 写操作（INSERT、UPDATE、DELETE）发送到主库
- 读操作（SELECT）发送到从库

打个比方：主库是"仓库管理员"，负责收货（写入）；从库是"展示柜"，负责展示（查询）。顾客看展示柜，管理员在仓库收货。

### 为什么要读写分离？

大多数应用都是"读多写少"：
- 查询操作占 80%-90%
- 写入操作占 10%-20%

通过读写分离，可以把查询压力分散到多个从库，提高整体性能。

| 对比项 | 不分离 | 读写分离 |
|--------|--------|----------|
| 读性能 | 单台数据库承压 | 多台从库分担 |
| 写性能 | 不受影响 | 不受影响 |
| 扩展性 | 差 | 好，可以增加从库 |
| 数据一致性 | 强一致 | 最终一致（有延迟） |

### 读写分离方案

**方案 1：应用层实现**

在应用代码中判断是读还是写，分别连接不同的数据库。

```java
// 伪代码示例
if (isWriteOperation(sql)) {
    connection = getMasterConnection();
    // 写操作连接主库
} else {
    connection = getSlaveConnection();
    // 读操作连接从库
}
```

**方案 2：使用中间件**

使用数据库中间件自动实现读写分离，如：
- MySQL Router（官方）
- ProxySQL
- MyCat

```
应用 → 中间件 → 主库（写）
              → 从库1（读）
              → 从库2（读）
```

### 读写分离的注意事项

| 注意事项 | 说明 |
|----------|------|
| 复制延迟 | 从库数据可能比主库晚几秒 |
| 强一致需求 | 需要强一致的查询还是走主库 |
| 故障切换 | 主库挂了，需要切换到新主库 |
| 负载均衡 | 多个从库需要负载均衡 |

---

## 16.4 MGR（MySQL Group Replication）

### 什么是 MGR？

MGR 是 MySQL 官方提供的高可用解决方案，基于 Paxos 协议实现多节点一致性。

打个比方：MGR 就像一个"委员会"，多个成员共同决策，只有多数成员同意，决策才能生效。

### MGR 的特点

| 特点 | 说明 |
|------|------|
| 强一致性 | 所有节点数据一致 |
| 自动故障检测 | 节点挂了自动检测 |
| 自动故障转移 | 主节点挂了自动选举新主节点 |
| 多主模式 | 支持多节点同时写入（多主模式） |

### MGR 的两种模式

**单主模式（Single-Primary）**
- 只有一个节点可以写入
- 其他节点只读
- 类似主从复制，但更强一致

**多主模式（Multi-Primary）**
- 所有节点都可以写入
- 写入时自动同步到其他节点
- 适合写多读多的场景

### 配置 MGR

```ini
# my.cnf 配置
[mysqld]
server_id = 1
# 节点 ID

gtid_mode = ON
# 开启 GTID

enforce_gtid_consistency = ON
# 强制 GTID 一致性

plugin_load_add = 'group_replication.so'
# 加载 MGR 插件

group_replication_group_name = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
# 组名（UUID 格式）

group_replication_start_on_boot = OFF
# 启动时不自动加入组

group_replication_local_address = "192.168.1.101:33061"
# 本节点通信地址

group_replication_group_seeds = "192.168.1.101:33061,192.168.1.102:33061,192.168.1.103:33061"
# 组内所有节点的通信地址
```

```sql
-- 在第一个节点初始化组
SET GLOBAL group_replication_bootstrap_group = ON;
START GROUP_REPLICATION;
SET GLOBAL group_replication_bootstrap_group = OFF;

-- 在其他节点加入组
START GROUP_REPLICATION;

-- 查看组成员
SELECT * FROM performance_schema.replication_group_members;
-- 显示所有成员及其状态
```

---

## 16.5 分库分表

### 为什么要分库分表？

当数据量达到一定程度，单台数据库扛不住时，就需要分库分表。

打个比方：一个仓库放不下了，就把货物分散到多个仓库。

### 垂直拆分

**垂直分库**
按业务拆分数据库。

```
原始数据库
├── 用户表
├── 订单表
├── 商品表
└── 支付表

拆分后
├── 用户库（用户表、用户地址表）
├── 订单库（订单表、订单详情表）
├── 商品库（商品表、分类表）
└── 支付库（支付表、退款表）
```

**垂直分表**
把一张表的字段拆分到多张表。

```
原始表：users
├── id
├── name
├── email
├── avatar（大字段）
└── bio（大字段）

拆分后
├── users 基础表（id, name, email）
└── users_detail 表（user_id, avatar, bio）
```

### 水平拆分

**水平分库**
按行拆分，把数据分散到多个数据库。

```
原始数据库：所有用户
├── 用户 1-100 万

拆分后
├── 用户库 1：用户 1-25 万
├── 用户库 2：用户 26-50 万
├── 用户库 3：用户 51-75 万
└── 用户库 4：用户 76-100 万
```

**水平分表**
按行拆分，把数据分散到多张表。

```
原始表：orders（1000 万行）

拆分后
├── orders_0（订单 ID 0-250 万）
├── orders_1（订单 ID 251-500 万）
├── orders_2（订单 ID 501-750 万）
└── orders_3（订单 ID 751-1000 万）
```

### 分片策略

| 策略 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| Hash 分片 | 按 ID 的 Hash 值分片 | 数据分布均匀 | 范围查询困难 |
| Range 分片 | 按 ID 范围分片 | 范围查询方便 | 可能数据不均 |
| 时间分片 | 按时间分片 | 历史数据好管理 | 当前表可能很大 |

### ShardingSphere 中间件

ShardingSphere 是一个开源的分库分表中间件。

```yaml
# 配置示例（application.yml）
spring:
  shardingsphere:
    datasource:
      names: ds0,ds1
      ds0:
        url: jdbc:mysql://192.168.1.101:3306/db0
      ds1:
        url: jdbc:mysql://192.168.1.102:3306/db1
    sharding:
      tables:
        t_order:
          actual-data-nodes: ds$->{0..1}.t_order_$->{0..1}
          # 实际数据节点
          database-strategy:
            inline:
              sharding-column: user_id
              algorithm-expression: ds$->{user_id % 2}
              # 按 user_id 取模分库
          table-strategy:
            inline:
              sharding-column: order_id
              algorithm-expression: t_order_$->{order_id % 2}
              # 按 order_id 取模分表
```

---

## 16.6 高可用方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 主从复制 | 简单、成熟 | 主库单点故障 | 读多写少 |
| 读写分离 | 提高读性能 | 数据有延迟 | 读多写少 |
| MGR | 强一致、自动故障转移 | 配置复杂 | 高可用要求高 |
| 分库分表 | 解决大数据量问题 | 复杂度高 | 数据量巨大 |

---

## 16.7 新手常见误区

### 误区 1："主从复制是实时的"

错！主从复制有延迟，从库数据可能比主库晚几秒甚至几分钟。对于需要强一致的场景，应该查询主库，或者使用 MGR。

### 误区 2："分库分表后查询更简单了"

错！分库分表后，跨库查询变得复杂。比如要查询所有用户的订单，需要查询多个库再合并结果。需要使用中间件或应用层处理。

### 误区 3："MGR 可以替代主从复制"

不完全对。MGR 适合对一致性要求高的场景，但配置复杂，性能开销大。对于读多写少的场景，主从复制 + 读写分离可能更合适。

### 误区 4："分片策略随便选"

错！分片策略非常重要，直接影响查询性能。Hash 分片适合点查询，Range 分片适合范围查询。选择不当会导致数据倾斜或查询困难。

### 误区 5："高可用方案越复杂越好"

不是的。应该根据实际需求选择方案。小项目用主从复制就够了，大项目才需要 MGR 或分库分表。过度设计会增加维护成本。

---

## 16.8 动手练习

### 练习 1：配置主从复制

假设有两台 MySQL 服务器，IP 分别为 192.168.1.100（主）和 192.168.1.101（从），请写出配置主从复制的步骤。

<details>
<summary>点击查看答案</summary>

**主库配置（192.168.1.100）**

```ini
# my.cnf
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
```

```sql
-- 创建复制用户
CREATE USER 'repl'@'%' IDENTIFIED BY 'repl_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';

-- 查看主库状态
SHOW MASTER STATUS;
-- 记录 File 和 Position
```

**从库配置（192.168.1.101）**

```ini
# my.cnf
[mysqld]
server-id = 2
relay-log = relay-bin
```

```sql
-- 配置主库信息
CHANGE MASTER TO
  MASTER_HOST = '192.168.1.100',
  MASTER_USER = 'repl',
  MASTER_PASSWORD = 'repl_password',
  MASTER_LOG_FILE = 'mysql-bin.000001',
  MASTER_LOG_POS = 154;

-- 启动复制
START SLAVE;

-- 查看状态
SHOW SLAVE STATUS;
```

</details>

### 练习 2：设计分片策略

有一个订单表 orders，数据量达到 1 亿行。请设计分片策略，将数据分散到 4 个库。

<details>
<summary>点击查看答案</summary>

**方案 1：Hash 分片**

```
按 user_id 取模分库
├── orders_db_0：user_id % 4 = 0
├── orders_db_1：user_id % 4 = 1
├── orders_db_2：user_id % 4 = 2
└── orders_db_3：user_id % 4 = 3
```

优点：数据分布均匀
缺点：按 order_id 查询需要查所有库

**方案 2：Range 分片**

```
按 order_id 范围分库
├── orders_db_0：order_id 1-2500 万
├── orders_db_1：order_id 2501-5000 万
├── orders_db_2：order_id 5001-7500 万
└── orders_db_3：order_id 7501-1 亿
```

优点：按 order_id 范围查询方便
缺点：可能数据不均

</details>

### 练习 3（挑战）：选择高可用方案

一个电商网站，日活用户 10 万，数据量 5000 万行，读多写少（读：写 = 8:2）。请选择合适的高可用方案，并说明理由。

<details>
<summary>点击查看答案</summary>

**推荐方案：主从复制 + 读写分离**

理由：
1. 读多写少（8:2），适合读写分离
2. 数据量 5000 万，单库可以承载
3. 主从复制成熟稳定，维护简单
4. 可以增加多个从库分担读压力

架构：
```
应用 → MySQL Router → 主库（写）
                     → 从库1（读）
                     → 从库2（读）
                     → 从库3（读）
```

如果未来数据量增长到亿级，可以考虑分库分表。

</details>

---

## 总结

恭喜你完成了 MySQL 教程的全部 16 章！

从基础的数据库概念，到高级的索引优化、事务管理、存储过程、视图触发器、用户权限、备份恢复、性能优化，再到高可用集群，你已经掌握了 MySQL 的核心知识。

记住，学习数据库是一个持续的过程，需要在实践中不断积累经验。祝你在今后的开发工作中，能够灵活运用这些知识，构建高效、稳定的数据库系统！
