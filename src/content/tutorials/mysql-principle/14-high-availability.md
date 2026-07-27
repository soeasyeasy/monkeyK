---
title: "第 14 章：高可用架构原理"
description: "深入理解 MySQL 高可用架构，掌握 MGR 组复制、Keepalived、ProxySQL 及故障切换机制"
---

# 第 14 章：高可用架构原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 主库挂了，整个系统就瘫痪了，怎么办？
- MGR 组复制和传统主从复制有什么区别？为什么叫"组"复制？
- Keepalived 是怎么做到"自动切换"的？虚拟 IP 是什么鬼？
- ProxySQL 在架构中扮演什么角色？它和普通的数据库连接有什么区别？

这一章就是为了解答这些问题。我们会从"让数据库永不宕机"这个目标出发，用生活中的例子帮你搞懂 **高可用架构的核心原理**，让你知道怎么搭建一个"挂了也能自动恢复"的数据库系统。

---

## 1 为什么需要高可用架构？

### 痛点分析

想象你经营一家 24 小时便利店，只有一台收银机（单台数据库）：
- 收银机坏了，整个店就无法结账
- 顾客排着队，但只能干等
- 老板急得团团转，因为每分钟都在亏钱

这就像单点数据库面临的问题：
- 服务器硬件故障，整个系统瘫痪
- 网络抖动，用户无法访问
- 计划内维护（如升级），必须停服

**单点故障的代价：**
- 电商网站宕机 1 小时，可能损失几十万
- 银行系统宕机，影响金融稳定
- 游戏服务器宕机，玩家流失

### 解决方案：高可用架构

有了高可用架构，就像便利店有了"备用收银机 + 自动切换系统"：
1. 多台收银机同时待命（多节点）
2. 主收银机坏了，备用机自动顶上（自动故障转移）
3. 顾客根本感觉不到切换（无缝切换）

打个比方：

> 高可用架构就像飞机的双发动机。一个发动机故障了，另一个自动启动，飞机继续飞行，乘客甚至感觉不到异常。

| 对比项 | 单点数据库 | 高可用架构 |
|--------|------------|------------|
| 故障影响 | 系统完全瘫痪 | 自动切换，业务不中断 |
| 可用性 | 99%（一年宕机 3.65 天） | 99.99%（一年宕机 52 分钟） |
| 恢复方式 | 人工介入，手动恢复 | 自动检测，自动切换 |
| 成本 | 低 | 高（需要多台服务器） |

> 一句话总结：高可用架构就是让数据库"永不宕机"，即使某台服务器挂了，系统也能自动恢复。

---

## 2 核心原理讲解

### 概念解释

高可用架构的三个核心技术：

1. **MGR（MySQL Group Replication）组复制**
   - 多个 MySQL 节点组成一个"组"
   - 基于 Paxos 协议保证数据一致性
   - 类似"委员会投票"，多数同意才能生效

2. **Keepalived 虚拟 IP 漂移**
   - 提供一个"虚拟 IP"（VIP），应用连接这个 IP
   - 主节点挂了，VIP 自动漂移到备用节点
   - 应用无感知，继续连接同一个 IP

3. **ProxySQL 智能路由**
   - 应用不直接连数据库，而是连代理
   - 代理自动判断连哪个节点
   - 写操作路由到主库，读操作路由到从库

打个比方：

> 高可用架构就像医院的"备用电源系统"。市电断了，UPS 立刻接管，发电机随后启动，整个过程手术室的灯都没闪一下。

### MGR 工作原理

```
MGR 组复制流程：
1. 事务提交前，发起投票
2. 其他节点检查是否有冲突
3. 多数节点同意，事务提交
4. 少数节点反对，事务回滚

节点角色：
- Primary 节点：可读写
- Secondary 节点：只读（单主模式）
```

### Keepalived 工作原理

```
Keepalived 虚拟 IP 漂移：
1. 正常状态：VIP 在主节点（192.168.1.100）
2. 主节点挂了，Keepalived 检测到
3. VIP 自动漂移到备用节点（192.168.1.101）
4. 应用继续连接 VIP，无感知切换
```

### ProxySQL 工作原理

```
ProxySQL 智能路由：
应用 → ProxySQL（代理层）
         ├→ 主库（写操作）
         ├→ 从库1（读操作）
         └→ 从库2（读操作）

功能：
- 读写分离
- 负载均衡
- 故障检测与切换
- 查询缓存
```

### 对比分析

| 技术 | 作用 | 优点 | 缺点 |
|------|------|------|------|
| MGR | 数据多副本 | 强一致性，自动故障转移 | 配置复杂，性能开销大 |
| Keepalived | VIP 漂移 | 应用无感知切换 | 只能做主备，不能负载均衡 |
| ProxySQL | 智能路由 | 读写分离，负载均衡 | 多一层代理，有延迟 |

---

## 3 基础用法

### 示例 1：MGR 组复制配置

```sql
-- ============================================
-- MGR（MySQL Group Replication）配置
-- 基于 Paxos 协议，多节点强一致
-- ============================================

-- 节点1配置（my.cnf）
[mysqld]
server_id = 1                                  # 节点ID，必须唯一
gtid_mode = ON                                 # 必须开启GTID
enforce_gtid_consistency = ON                  # 强制GTID一致性
plugin_load_add = 'group_replication.so'       # 加载MGR插件
group_replication_group_name = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"  # 组名（UUID格式）
group_replication_start_on_boot = OFF          # 启动时不自动加入组
group_replication_local_address = "192.168.1.101:33061"  # 本节点通信地址
group_replication_group_seeds = "192.168.1.101:33061,192.168.1.102:33061,192.168.1.103:33061"  # 所有节点通信地址

-- 节点2配置（my.cnf）
[mysqld]
server_id = 2                                  # 节点ID
gtid_mode = ON
enforce_gtid_consistency = ON
plugin_load_add = 'group_replication.so'
group_replication_group_name = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"  # 组名必须相同
group_replication_start_on_boot = OFF
group_replication_local_address = "192.168.1.102:33061"  # 本节点通信地址
group_replication_group_seeds = "192.168.1.101:33061,192.168.1.102:33061,192.168.1.103:33061"

-- 节点3配置（my.cnf）
[mysqld]
server_id = 3
gtid_mode = ON
enforce_gtid_consistency = ON
plugin_load_add = 'group_replication.so'
group_replication_group_name = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
group_replication_start_on_boot = OFF
group_replication_local_address = "192.168.1.103:33061"
group_replication_group_seeds = "192.168.1.101:33061,192.168.1.102:33061,192.168.1.103:33061"

-- ============================================
-- 在节点1上初始化组（第一个节点）
-- ============================================
SET GLOBAL group_replication_bootstrap_group = ON;   -- 设置为引导模式
START GROUP_REPLICATION;                              -- 启动组复制
SET GLOBAL group_replication_bootstrap_group = OFF;  -- 关闭引导模式

-- ============================================
-- 在节点2和节点3上加入组
-- ============================================
START GROUP_REPLICATION;                              -- 直接加入组

-- ============================================
-- 查看组成员状态
-- ============================================
SELECT * FROM performance_schema.replication_group_members;  -- 查看所有成员
-- 结果示例：
-- MEMBER_ID | MEMBER_HOST | MEMBER_PORT | STATE
-- uuid-1    | 192.168.1.101 | 3306        | ONLINE
-- uuid-2    | 192.168.1.102 | 3306        | ONLINE
-- uuid-3    | 192.168.1.103 | 3306        | ONLINE
```

### 示例 2：Keepalived 配置

```bash
# ============================================
# Keepalived 配置文件（/etc/keepalived/keepalived.conf）
# ============================================

# 主节点配置（192.168.1.101）
vrrp_instance VI_1 {
    state MASTER                          # 主节点状态
    interface eth0                        # 网卡名称
    virtual_router_id 51                  # 虚拟路由ID，主备必须相同
    priority 100                          # 优先级，主节点高
    advert_int 1                          # 心跳间隔（秒）
    
    authentication {                      # 认证配置
        auth_type PASS                    # 认证方式
        auth_pass 1111                    # 认证密码，主备必须相同
    }
    
    virtual_ipaddress {                   # 虚拟IP地址
        192.168.1.200/24                  # VIP，应用连接这个IP
    }
    
    # 健康检查脚本
    track_script {
        check_mysql                       # 检查MySQL是否存活
    }
}

# 备用节点配置（192.168.1.102）
vrrp_instance VI_1 {
    state BACKUP                          # 备用节点状态
    interface eth0
    virtual_router_id 51                  # 必须与主节点相同
    priority 90                           # 优先级，比主节点低
    advert_int 1
    
    authentication {
        auth_type PASS
        auth_pass 1111                    # 必须与主节点相同
    }
    
    virtual_ipaddress {
        192.168.1.200/24                  # VIP必须与主节点相同
    }
    
    track_script {
        check_mysql
    }
}

# ============================================
# MySQL 健康检查脚本（/etc/keepalived/check_mysql.sh）
# ============================================
#!/bin/bash
# 检查MySQL是否存活
mysql -u keepalived_user -p'password' -e "SELECT 1" > /dev/null 2>&1

# 如果MySQL挂了，降低优先级，触发VIP漂移
if [ $? -ne 0 ]; then
    systemctl stop keepalived             # 停止Keepalived，VIP漂移
fi
```

### 示例 3：ProxySQL 配置

```bash
# ============================================
# ProxySQL 配置文件（/etc/proxysql.cnf）
# ============================================

# 1. 添加后端 MySQL 服务器
mysql -u admin -padmin -h 127.0.0.1 -P 6032 -e "
INSERT INTO mysql_servers (hostgroup_id, hostname, port, weight) 
VALUES 
(1, '192.168.1.101', 3306, 100),   -- 主库，权重100
(2, '192.168.1.102', 3306, 50),    -- 从库1，权重50
(2, '192.168.1.103', 3306, 50);    -- 从库2，权重50
"

# 2. 配置用户
mysql -u admin -padmin -h 127.0.0.1 -P 6032 -e "
INSERT INTO mysql_users (username, password, default_hostgroup) 
VALUES ('app_user', 'password', 1);  -- 默认连接主库（hostgroup 1）
"

# 3. 配置查询路由规则
mysql -u admin -padmin -h 127.0.0.1 -P 6032 -e "
INSERT INTO mysql_query_rules (rule_id, active, match_pattern, destination_hostgroup, apply) 
VALUES 
(1, 1, '^SELECT.*FOR UPDATE$', 1, 1),      -- SELECT FOR UPDATE 走主库
(2, 1, '^SELECT', 2, 1);                   -- 普通 SELECT 走从库
"

# 4. 加载配置并保存
mysql -u admin -padmin -h 127.0.0.1 -P 6032 -e "
LOAD MYSQL SERVERS TO RUNTIME;             -- 加载服务器配置到运行时
SAVE MYSQL SERVERS TO DISK;                -- 保存到磁盘
LOAD MYSQL USERS TO RUNTIME;               -- 加载用户配置
SAVE MYSQL USERS TO DISK;
LOAD MYSQL QUERY RULES TO RUNTIME;         -- 加载查询规则
SAVE MYSQL QUERY RULES TO DISK;
"

# ============================================
# 应用连接 ProxySQL
# ============================================
# 应用连接 ProxySQL 的 6033 端口（默认代理端口）
# jdbc:mysql://127.0.0.1:6033/mydb
# ProxySQL 会自动路由：写操作→主库，读操作→从库
```

### 示例 4：故障切换演练

```sql
-- ============================================
-- 模拟主库故障，观察自动切换
-- ============================================

-- 1. 查看当前 MGR 状态
SELECT * FROM performance_schema.replication_group_members;
-- MEMBER_HOST | STATE
-- 192.168.1.101 | ONLINE   -- 当前主库
-- 192.168.1.102 | ONLINE
-- 192.168.1.103 | ONLINE

-- 2. 停止主库 MySQL（模拟故障）
-- systemctl stop mysqld

-- 3. 在备用节点查看状态
SELECT * FROM performance_schema.replication_group_members;
-- MEMBER_HOST | STATE
-- 192.168.1.101 | OFFLINE  -- 主库离线
-- 192.168.1.102 | ONLINE   -- 自动选举为新主库
-- 192.168.1.103 | ONLINE

-- 4. 验证新主库可写
INSERT INTO test_table VALUES (1, 'test');  -- 在新主库写入成功

-- 5. 恢复原主库
-- systemctl start mysqld

-- 6. 原主库自动加入组，成为从库（只读）
SELECT * FROM performance_schema.replication_group_members;
-- 所有节点恢复 ONLINE 状态
```

---

## 4 对比表格

### MGR vs 传统主从复制

| 对比项 | MGR 组复制 | 传统主从复制 |
|--------|------------|--------------|
| 一致性 | 强一致（多数派同意） | 弱一致（异步/半同步） |
| 故障转移 | 自动选举新主库 | 需要手动切换或借助其他工具 |
| 数据安全性 | 高（不会丢数据） | 较低（异步可能丢数据） |
| 配置复杂度 | 高 | 低 |
| 性能 | 有开销（投票机制） | 较好 |
| 节点数量 | 推荐 3-5 个（奇数） | 1主多从 |
| 适用场景 | 对一致性要求高的核心业务 | 读多写少，能容忍少量数据丢失 |

### Keepalived vs ProxySQL

| 对比项 | Keepalived | ProxySQL |
|--------|------------|----------|
| 作用 | VIP 漂移，故障切换 | 智能路由，负载均衡 |
| 切换方式 | 自动（秒级） | 自动（毫秒级） |
| 读写分离 | 不支持 | 支持 |
| 负载均衡 | 不支持 | 支持（多从库负载均衡） |
| 应用感知 | 无感知（连同一个VIP） | 无感知（连代理地址） |
| 适用场景 | 主备切换 | 读写分离 + 高可用 |

### 高可用方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| MGR | 强一致，自动故障转移 | 配置复杂，性能开销 | 金融、订单等核心系统 |
| Keepalived + 主从 | 成熟稳定，切换快 | 只能主备，不能负载均衡 | 中小型系统 |
| ProxySQL + 主从 | 读写分离，负载均衡 | 多一层代理 | 读多写少的互联网应用 |
| MGR + ProxySQL | 强一致 + 智能路由 | 最复杂 | 大型核心系统 |

---

## 5 新手常见误区

### 误区 1："MGR 节点越多越好"

❌ **错误**：认为节点越多，数据越安全。

✅ **正确**：MGR 推荐 3-5 个节点（奇数）。节点太多，投票开销大，性能下降。3 个节点能容忍 1 个故障，5 个能容忍 2 个，足够用了。

### 误区 2："Keepalived 能替代 MGR"

❌ **错误**：认为 Keepalived 能做故障切换，就不需要 MGR 了。

✅ **正确**：Keepalived 只解决"主库挂了怎么切换"的问题，不解决数据一致性问题。MGR 既解决故障切换，又保证数据一致。两者可以配合使用。

### 误区 3："ProxySQL 配置完就不用管了"

❌ **错误**：认为 ProxySQL 配置好就一劳永逸。

✅ **正确**：ProxySQL 需要监控后端节点状态，配置健康检查。如果从库挂了，ProxySQL 要能自动摘除；如果恢复了，要能自动加回。

### 误区 4："高可用架构能解决所有问题"

❌ **错误**：认为上了高可用，数据库就不会出问题了。

✅ **正确**：高可用只解决"服务器挂了"的问题，解决不了慢查询、索引失效、数据量过大等性能问题。高可用 + 性能优化，才能构建稳定的系统。

### 误区 5："故障切换是瞬间完成的"

❌ **错误**：认为故障切换是 0 延迟，用户完全无感知。

✅ **正确**：故障切换有延迟（秒级），期间会有少量请求失败。应用层需要实现重试机制，或者使用连接池自动重连。

---

## 6 动手练习

### 练习 1（基础）：配置 MGR 组复制

有 3 台 MySQL 服务器，IP 分别为 192.168.1.101、192.168.1.102、192.168.1.103。请写出完整的 MGR 配置步骤，包括配置文件、初始化组、加入组、查看状态。

<details>
<summary>点击查看答案</summary>

```sql
-- 节点1配置（my.cnf）
[mysqld]
server_id = 1
gtid_mode = ON
enforce_gtid_consistency = ON
plugin_load_add = 'group_replication.so'
group_replication_group_name = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
group_replication_start_on_boot = OFF
group_replication_local_address = "192.168.1.101:33061"
group_replication_group_seeds = "192.168.1.101:33061,192.168.1.102:33061,192.168.1.103:33061"

-- 节点2和节点3配置类似，只需修改 server_id 和 local_address

-- 节点1初始化组
SET GLOBAL group_replication_bootstrap_group = ON;
START GROUP_REPLICATION;
SET GLOBAL group_replication_bootstrap_group = OFF;

-- 节点2和节点3加入组
START GROUP_REPLICATION;

-- 查看状态
SELECT * FROM performance_schema.replication_group_members;
-- 确保所有节点 STATE 为 ONLINE
```

</details>

### 练习 2（进阶）：Keepalived + ProxySQL 高可用架构

设计一个高可用架构：
- 1 主 2 从（MGR 模式）
- Keepalived 做 VIP 漂移
- ProxySQL 做读写分离

画出架构图，并写出关键配置。

<details>
<summary>点击查看答案</summary>

**架构图：**
```
应用层
  ↓
ProxySQL（192.168.1.200:6033）
  ↓
Keepalived VIP（192.168.1.200）
  ↓
├── 主库（192.168.1.101）← VIP 漂移
├── 从库1（192.168.1.102）
└── 从库2（192.168.1.103）
```

**关键配置：**

```bash
# Keepalived（3个节点都配置）
vrrp_instance VI_1 {
    state BACKUP                          # 都用BACKUP，靠优先级选主
    interface eth0
    virtual_router_id 51
    priority 100                          # 节点1优先级最高
    advert_int 1
    virtual_ipaddress {
        192.168.1.200/24
    }
}

# ProxySQL 配置
# 添加MGR节点
INSERT INTO mysql_servers (hostgroup_id, hostname, port) 
VALUES 
(1, '192.168.1.101', 3306),  -- 主库
(2, '192.168.1.102', 3306),  -- 从库
(2, '192.168.1.103', 3306);

# 配置查询路由
INSERT INTO mysql_query_rules (rule_id, match_pattern, destination_hostgroup) 
VALUES 
(1, '^SELECT.*FOR UPDATE$', 1),  -- 写操作走主库
(2, '^SELECT', 2);               -- 读操作走从库
```

</details>

### 练习 3（挑战）：故障切换演练

在 MGR 环境中，模拟主库故障，观察自动切换过程，并验证数据一致性。写出完整的演练步骤和验证方法。

<details>
<summary>点击查看答案</summary>

**演练步骤：**

```sql
-- 1. 准备测试数据
CREATE TABLE test_order (
    id INT PRIMARY KEY,
    order_no VARCHAR(50),
    amount DECIMAL(10,2)
);

INSERT INTO test_order VALUES (1, 'ORD001', 100.00);  -- 插入测试数据

-- 2. 查看当前主库
SELECT * FROM performance_schema.replication_group_members;
-- 假设 192.168.1.101 是 PRIMARY

-- 3. 在主库写入数据
INSERT INTO test_order VALUES (2, 'ORD002', 200.00);  -- 主库写入

-- 4. 验证从库已同步
-- 在从库（192.168.1.102）查询
SELECT * FROM test_order;  -- 应该能看到2条数据

-- 5. 模拟主库故障
-- systemctl stop mysqld（在192.168.1.101上执行）

-- 6. 在从库查看新主库选举
SELECT * FROM performance_schema.replication_group_members;
-- 192.168.1.101 变为 OFFLINE
-- 192.168.1.102 或 192.168.1.103 变为 PRIMARY

-- 7. 在新主库写入数据
INSERT INTO test_order VALUES (3, 'ORD003', 300.00);  -- 新主库写入成功

-- 8. 恢复原主库
-- systemctl start mysqld（在192.168.1.101上执行）

-- 9. 验证数据一致性
-- 在所有节点查询
SELECT * FROM test_order;
-- 所有节点都应该有3条数据，数据一致

-- 10. 验证原主库变为从库（只读）
INSERT INTO test_order VALUES (4, 'ORD004', 400.00);
-- 报错：ERROR 1290 - The MySQL server is running with the --super-read-only option
```

**验证要点：**
- 故障切换是否自动完成
- 切换期间数据是否丢失
- 恢复后原主库是否正确变为从库
- 所有节点数据是否一致

</details>

---

## 下一章预告

下一章我们会学习 **分库分表原理**——当数据量达到亿级，单库扛不住时怎么办？你会学到：
- 垂直拆分和水平拆分的区别
- Hash 分片、Range 分片、时间分片等策略
- 分布式事务的解决方案
- ShardingSphere 中间件的使用

这些是支撑海量数据的核心技术，我们下一章见！
