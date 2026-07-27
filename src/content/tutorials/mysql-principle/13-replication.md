---
title: "第 13 章：主从复制原理"
description: "深入理解 MySQL 主从复制，掌握 binlog、GTID、半同步复制及延迟问题"
---

# 第 13 章：主从复制原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 主从复制到底是怎么工作的？数据是怎么从主库"跑"到从库的？
- binlog、GTID 这些名词都是什么意思？有什么区别？
- 异步复制、半同步复制、全同步复制该怎么选？
- 从库数据总是比主库"慢半拍"，这个延迟问题怎么解决？

这一章就是为了解答这些问题。我们会从最底层的原理出发，用生活中的例子帮你搞懂 **MySQL 主从复制的核心机制**，让你不仅"会用"，还能真正"理解"。

---

## 1 为什么需要主从复制？

### 痛点分析

想象你经营一家火爆的奶茶店，只有一个收银员（单台数据库）：
- 点单的、取餐的、查询订单状态的，全都排一条队
- 收银员忙不过来，顾客等得着急
- 万一收银员请假了，整个店就停业了

这就像单台 MySQL 服务器面临的问题：
- 读写都压在同一台机器上，性能瓶颈明显
- 一旦服务器宕机，整个系统就瘫痪
- 数据备份也只能停服来做

### 解决方案：主从复制

有了主从复制，就像奶茶店多了几个"分身店员"：
1. 一个主收银员（Master）负责接单收钱（写操作）
2. 几个辅助店员（Slave）照着主收银员的账本抄一份（数据同步）
3. 顾客查询订单、看菜单这些事儿，找辅助店员就行（读操作）

| 对比项 | 单台数据库 | 主从复制 |
|--------|------------|----------|
| 读性能 | 单机承压，容易慢 | 多从库分担，读性能成倍提升 |
| 写性能 | 单机上限 | 写仍走主库，写性能不变 |
| 可用性 | 单机挂了就全挂 | 主库挂了可切换到从库 |
| 数据备份 | 需要停服 | 可在从库上备份，不影响业务 |

> 一句话总结：主从复制就是让数据在多台机器上"分身"，实现读写分离和高可用。

---

## 2 核心原理讲解

### 概念解释

主从复制的核心是三个线程 + 两类日志：

**三个关键线程：**
1. **Binlog Dump 线程**（主库）：负责把 binlog 发给从库
2. **I/O 线程**（从库）：负责从主库读取 binlog，写入到本地的 relay log
3. **SQL 线程**（从库）：负责读取 relay log，重放 SQL 语句

**两类关键日志：**
- **binlog（二进制日志）**：主库记录的所有写操作（"流水账"）
- **relay log（中继日志）**：从库临时存放从主库拷贝过来的 binlog

打个比方：

> 主库是"老师板书"，binlog 就是老师写的笔记。从库是"学生抄笔记"，I/O 线程是学生把笔记抄到自己本子上（relay log），SQL 线程是学生照着笔记复习消化。

### 复制的三种模式

```
主库写数据 → 写 binlog
            ↓
        [异步复制] 主库写完就返回，不等从库
        [半同步复制] 主库等至少一个从库确认再返回
        [全同步复制] 主库等所有从库确认才返回
```

### 底层流程

```
1. 主库执行写操作（INSERT/UPDATE/DELETE）
2. 主库将操作写入 binlog
3. 主库的 Binlog Dump 线程把 binlog 发送给从库
4. 从库的 I/O 线程接收 binlog，写入 relay log
5. 从库的 SQL 线程读取 relay log，重放 SQL
6. 从库数据与主库保持一致
```

### 对比分析

| 复制模式 | 数据安全性 | 性能 | 延迟 | 适用场景 |
|----------|------------|------|------|----------|
| 异步复制 | 低（可能丢数据） | 最高 | 较大 | 对性能要求高，能容忍少量数据丢失 |
| 半同步复制 | 较高 | 中等 | 较小 | 大多数业务场景（推荐） |
| 全同步复制 | 最高 | 最低 | 最小 | 对数据一致性要求极高（如金融） |

---

## 3 基础用法

### 示例 1：基于 binlog 的传统复制

```sql
-- ============================================
-- 主库配置（my.cnf 或 my.ini）
-- ============================================
[mysqld]
server-id = 1                     # 主库唯一ID，整个集群必须唯一
log-bin = mysql-bin               # 开启二进制日志，文件名前缀
binlog-format = ROW               # 使用ROW格式，记录每行数据变化（最安全）
binlog-row-image = FULL           # 记录行完整镜像，便于数据校验

-- ============================================
-- 从库配置（my.cnf 或 my.ini）
-- ============================================
[mysqld]
server-id = 2                     # 从库唯一ID，必须与主库不同
relay-log = relay-bin             # 中继日志文件名
read-only = ON                    # 从库只读，防止误写

-- ============================================
-- 步骤1：在主库创建复制专用账号
-- ============================================
CREATE USER 'repl'@'%' IDENTIFIED BY 'repl_password';  -- 创建复制用户
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';          -- 授予复制权限

-- ============================================
-- 步骤2：查看主库当前 binlog 状态
-- ============================================
SHOW MASTER STATUS;                 -- 查看主库binlog位置
-- 记下 File 和 Position 值，例如：
-- File: mysql-bin.000001
-- Position: 154

-- ============================================
-- 步骤3：在从库配置主库连接信息
-- ============================================
CHANGE MASTER TO
  MASTER_HOST = '192.168.1.100',        -- 主库IP地址
  MASTER_PORT = 3306,                    -- 主库端口
  MASTER_USER = 'repl',                  -- 复制用户名
  MASTER_PASSWORD = 'repl_password',     -- 复制密码
  MASTER_LOG_FILE = 'mysql-bin.000001',  -- 主库binlog文件名
  MASTER_LOG_POS = 154;                  -- 主库binlog位置

-- ============================================
-- 步骤4：启动从库复制
-- ============================================
START SLAVE;                        -- 启动复制进程

-- ============================================
-- 步骤5：检查复制状态
-- ============================================
SHOW SLAVE STATUS;                  -- 查看复制状态
-- 关键看这两个字段：
-- Slave_IO_Running: Yes   （I/O线程正常）
-- Slave_SQL_Running: Yes  （SQL线程正常）
-- 都是Yes说明复制正常运行
```

### 示例 2：基于 GTID 的复制（推荐）

```sql
-- ============================================
-- GTID（Global Transaction Identifier）复制
-- 每个事务都有全局唯一ID，不再依赖binlog文件名和位置
-- ============================================

-- 主库配置（my.cnf）
[mysqld]
server-id = 1
log-bin = mysql-bin
gtid_mode = ON                      # 开启GTID模式
enforce_gtid_consistency = ON       # 强制GTID一致性

-- 从库配置（my.cnf）
[mysqld]
server-id = 2
gtid_mode = ON                      # 从库也要开启GTID
enforce_gtid_consistency = ON

-- 在从库配置主库（GTID模式，不用指定文件和位置）
CHANGE MASTER TO
  MASTER_HOST = '192.168.1.100',        -- 主库IP
  MASTER_USER = 'repl',                  -- 复制用户
  MASTER_PASSWORD = 'repl_password',     -- 密码
  MASTER_AUTO_POSITION = 1;              -- 自动定位GTID位置（关键）

-- 启动复制
START SLAVE;

-- 查看复制状态
SHOW SLAVE STATUS;
-- 看 Retrieved_Gtid_Set 和 Executed_Gtid_Set
-- 能看出从库接收和执行到哪个GTID了
```

### 示例 3：半同步复制配置

```sql
-- ============================================
-- 半同步复制：主库写完后，等至少一个从库确认再返回
-- 需要安装半同步插件
-- ============================================

-- 在主库安装半同步插件
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';   -- 安装主库半同步插件
INSTALL PLUGIN rpl_semi_sync_slave SONAME 'semisync_slave.so';     -- 安装从库半同步插件

-- 主库开启半同步
SET GLOBAL rpl_semi_sync_master_enabled = ON;            -- 启用主库半同步
SET GLOBAL rpl_semi_sync_master_timeout = 1000;          -- 等待从库确认超时1000毫秒

-- 从库开启半同步
SET GLOBAL rpl_semi_sync_slave_enabled = ON;             -- 启用从库半同步
STOP SLAVE;                                             -- 先停止复制
START SLAVE;                                            -- 再启动，让半同步生效

-- 查看半同步状态（主库）
SHOW VARIABLES LIKE 'rpl_semi_sync_master%';             -- 查看主库半同步配置
SHOW STATUS LIKE 'rpl_semi_sync_master%';                -- 查看主库半同步运行状态
-- 关键看 Rpl_semi_sync_master_clients 值，表示有几个从库开启了半同步
```

### 示例 4：处理复制延迟

```sql
-- ============================================
-- 查看复制延迟
-- ============================================
SHOW SLAVE STATUS;
-- Seconds_Behind_Master: 10   表示从库落后主库10秒

-- ============================================
-- 减少延迟的方法1：多线程并行复制（MySQL 5.7+）
-- ============================================
-- 从库配置（my.cnf）
[mysqld]
slave_parallel_type = LOGICAL_CLOCK              # 使用逻辑时钟并行复制
slave_parallel_workers = 4                       # 开启4个并行SQL线程

-- ============================================
-- 减少延迟的方法2：压缩网络传输
-- ============================================
CHANGE MASTER TO MASTER_COMPRESSION_ALGORITHMS = 'zstd';  -- 使用zstd压缩binlog传输

-- ============================================
-- 减少延迟的方法3：让业务感知不到延迟（强制读主库）
-- ============================================
-- 对于需要强一致性的查询，直接查主库
SELECT * FROM orders WHERE id = 100;  -- 走主库查询，保证读到最新数据
```

---

## 4 对比表格

### binlog 复制 vs GTID 复制

| 对比项 | binlog 复制 | GTID 复制 |
|--------|-------------|-----------|
| 定位方式 | 文件名 + 偏移量 | 全局唯一事务ID |
| 配置复杂度 | 高（需手动计算位置） | 低（自动定位） |
| 故障恢复 | 复杂（要重新找位置） | 简单（自动识别缺失事务） |
| 数据一致性 | 依赖位置，易出错 | 强一致保证 |
| 推荐使用 | 老版本兼容 | MySQL 5.7+ 推荐 |

### 三种复制模式对比

| 模式 | 主库行为 | 数据安全 | 性能 | 延迟 |
|------|----------|----------|------|------|
| 异步复制 | 写完binlog就返回 | 可能丢数据 | 最高 | 大 |
| 半同步复制 | 等至少1个从库确认 | 较安全 | 中等 | 小 |
| 全同步复制 | 等所有从库确认 | 最安全 | 最低 | 最小 |

---

## 5 新手常见误区

### 误区 1："主从复制是实时的"

❌ **错误**：认为主库写完数据，从库立刻就有。

✅ **正确**：主从复制有延迟，从库数据可能比主库晚几秒甚至几分钟。对于刚写入就要读的场景，应该直接查主库。

### 误区 2："从库可以随便写数据"

❌ **错误**：在从库上执行 INSERT/UPDATE，以为能同步到主库。

✅ **正确**：从库应该设置为 `read-only = ON`，所有写操作都走主库。从库写入会导致主从数据不一致，甚至复制中断。

### 误区 3："binlog 格式随便选"

❌ **错误**：使用 STATEMENT 格式，觉得日志小、性能好。

✅ **正确**：推荐使用 ROW 格式。STATEMENT 格式在某些场景（如使用函数 `NOW()`、`UUID()`）会导致主从数据不一致。

### 误区 4："server-id 可以一样"

❌ **错误**：主从库的 server-id 设置成相同值。

✅ **正确**：整个复制集群中，每台 MySQL 的 server-id 必须唯一，否则复制会混乱。

### 误区 5："复制延迟只能干等"

❌ **错误**：遇到延迟就认为没办法，只能等。

✅ **正确**：可以通过多线程并行复制、压缩传输、业务层强制读主库等方式减少延迟影响。

---

## 6 动手练习

### 练习 1（基础）：配置基础主从复制

有两台 MySQL 服务器，主库 IP 192.168.1.10，从库 IP 192.168.1.11。请写出完整的主从复制配置步骤，包括配置文件、创建用户、启动复制、验证状态。

<details>
<summary>点击查看答案</summary>

```sql
-- 主库配置（my.cnf）
[mysqld]
server-id = 10                    # 主库ID
log-bin = mysql-bin               # 开启binlog
binlog-format = ROW               # ROW格式最安全

-- 从库配置（my.cnf）
[mysqld]
server-id = 11                    # 从库ID，必须不同
relay-log = relay-bin             # 中继日志
read-only = ON                    # 从库只读

-- 主库：创建复制用户
CREATE USER 'repl'@'%' IDENTIFIED BY 'repl_pwd';   -- 创建用户
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';      -- 授权

-- 主库：查看状态
SHOW MASTER STATUS;                                  -- 记录File和Position

-- 从库：配置主库信息
CHANGE MASTER TO
  MASTER_HOST = '192.168.1.10',          -- 主库IP
  MASTER_USER = 'repl',                   -- 用户名
  MASTER_PASSWORD = 'repl_pwd',           -- 密码
  MASTER_LOG_FILE = 'mysql-bin.000001',   -- 主库binlog文件
  MASTER_LOG_POS = 154;                   -- 主库binlog位置

-- 从库：启动复制
START SLAVE;                               -- 启动

-- 从库：验证状态
SHOW SLAVE STATUS;                         -- 检查
-- 确保 Slave_IO_Running: Yes
-- 且 Slave_SQL_Running: Yes
```

</details>

### 练习 2（进阶）：GTID 复制配置

将上面的 binlog 复制升级为 GTID 复制，写出完整的配置和启动命令，并说明 GTID 复制的优势。

<details>
<summary>点击查看答案</summary>

```sql
-- 主库配置（my.cnf）
[mysqld]
server-id = 10
log-bin = mysql-bin
gtid_mode = ON                             # 开启GTID
enforce_gtid_consistency = ON              # 强制一致性

-- 从库配置（my.cnf）
[mysqld]
server-id = 11
gtid_mode = ON
enforce_gtid_consistency = ON

-- 从库：使用GTID自动定位
CHANGE MASTER TO
  MASTER_HOST = '192.168.1.10',
  MASTER_USER = 'repl',
  MASTER_PASSWORD = 'repl_pwd',
  MASTER_AUTO_POSITION = 1;                # 关键：自动定位，不用指定文件和位置

START SLAVE;                               -- 启动复制

-- 查看GTID状态
SHOW SLAVE STATUS;
-- 关注：
-- Retrieved_Gtid_Set: 接收到的GTID范围
-- Executed_Gtid_Set: 已执行的GTID范围
```

**GTID 的优势：**
1. 不用手动计算 binlog 文件和位置
2. 故障恢复时自动识别缺失事务
3. 主从切换更方便
4. 数据一致性更有保障

</details>

### 练习 3（挑战）：设计半同步复制 + 延迟处理方案

某电商系统要求：
- 订单数据不能丢失（需要半同步）
- 用户下单后要立刻看到订单详情（需要解决延迟）
- 商品列表查询可以容忍几秒延迟（可以走从库）

请设计完整的复制方案，包括配置和代码层面的处理。

<details>
<summary>点击查看答案</summary>

**方案设计：**

```sql
-- 1. 配置半同步复制（保证数据安全）
-- 主库安装并开启半同步插件
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = ON;         -- 启用半同步
SET GLOBAL rpl_semi_sync_master_timeout = 1000;       -- 超时1秒，超时后退化为异步

-- 从库开启半同步
INSTALL PLUGIN rpl_semi_sync_slave SONAME 'semisync_slave.so';
SET GLOBAL rpl_semi_sync_slave_enabled = ON;
STOP SLAVE;
START SLAVE;

-- 2. 开启多线程并行复制（减少延迟）
-- 从库配置（my.cnf）
[mysqld]
slave_parallel_type = LOGICAL_CLOCK                   # 并行复制模式
slave_parallel_workers = 4                            # 4个并行线程
```

**应用层处理（伪代码）：**

```java
public class OrderService {
    // 下单：写主库，半同步保证不丢数据
    public void createOrder(Order order) {
        masterDb.insert(order);            // 写主库
    }
    
    // 查询订单详情：刚下完单要立刻看到，走主库
    public Order getOrderDetail(Long orderId) {
        return masterDb.selectById(orderId);  // 强制读主库，避免延迟
    }
    
    // 查询商品列表：可以容忍延迟，走从库
    public List<Product> listProducts() {
        return slaveDb.selectAll();           // 读从库，减轻主库压力
    }
}
```

**关键点：**
- 半同步保证订单数据不丢失
- 订单详情查询走主库，解决延迟问题
- 商品列表走从库，发挥读写分离优势
- 超时退化为异步，避免从库全挂时主库也卡死

</details>

---

## 下一章预告

下一章我们会学习 **高可用架构原理**——当主库挂了怎么办？你会学到：
- MGR（MySQL Group Replication）组复制的工作机制
- Keepalived 如何实现虚拟 IP 漂移
- ProxySQL 如何做智能路由和故障切换
- 自动故障转移的完整流程

这些是构建"永不宕机"数据库系统的核心技术，我们下一章见！
