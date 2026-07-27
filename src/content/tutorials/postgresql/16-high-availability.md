---
title: "第16章：高可用与集群"
description: "流复制、逻辑复制、主从切换、Patroni 高可用"
---

# 第16章：高可用与集群

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是高可用？为什么需要高可用？
- 流复制和逻辑复制有什么区别？
- 如何实现主从切换？
- 什么是 Patroni？如何使用？
- 有哪些集群架构？

这一章就是为了解答这些问题。我们会先搞清楚 **高可用的基本概念**，再学习**复制技术**，最后掌握**集群搭建**。

---

## 16.1 为什么需要高可用？

### 痛点分析

想象一下，你的数据库服务器突然宕机：

```
❌ 场景：
- 硬件故障
- 网络中断
- 软件崩溃
- 自然灾害

❌ 单点故障的后果：
- 业务中断
- 数据丢失
- 用户流失
- 经济损失
```

### 解决方案

使用高可用架构：

```
✅ 主从复制：
- 主库故障时，从库接管
- 数据不丢失
- 业务连续

✅ 集群架构：
- 多个节点
- 自动故障转移
- 负载均衡
```

优势：
- ✅ 业务连续
- ✅ 数据安全
- ✅ 自动恢复

> **一句话总结**：高可用架构可以确保数据库在故障时自动恢复，保证业务连续性。

---

## 16.2 核心原理

### 概念解释

**高可用（High Availability）**

高可用是指系统在部分组件故障时仍能正常运行的能力。

打个比方：

> 高可用就像是**备用发电机**：
> - 主发电机故障时，备用发电机启动
> - 电力供应不中断
> - 用户无感知

**复制（Replication）**

复制是将数据从一个节点复制到另一个节点的技术。

**主从复制**

主从复制是数据从主节点复制到从节点。

打个比方：

> 主从复制就像是**老师讲课**：
> - 老师（主库）讲课
> - 学生（从库）听课并记录
> - 学生可以回答问题（只读查询）

---

## 16.3 基础用法

### 流复制

**配置主库**

```bash
# 1. 修改 postgresql.conf
wal_level = replica
max_wal_senders = 10
wal_keep_segments = 64

# 2. 修改 pg_hba.conf
host replication replicator 192.168.1.0/24 md5

# 3. 创建复制用户
CREATE ROLE replicator WITH REPLICATION PASSWORD 'replicator_password' LOGIN;

# 4. 重启 PostgreSQL
sudo systemctl restart postgresql
```

**配置从库**

```bash
# 1. 停止 PostgreSQL
sudo systemctl stop postgresql

# 2. 清空数据目录
sudo rm -rf /var/lib/postgresql/data/*

# 3. 从主库复制数据
pg_basebackup -h 192.168.1.100 -D /var/lib/postgresql/data -U replicator -P -R

# 4. 修改配置
sudo vim /var/lib/postgresql/data/postgresql.auto.conf
primary_conninfo = 'host=192.168.1.100 port=5432 user=replicator password=replicator_password'

# 5. 创建备用信号文件
sudo touch /var/lib/postgresql/data/standby.signal

# 6. 启动 PostgreSQL
sudo systemctl start postgresql
```

**验证复制**

```sql
-- 在主库查询
SELECT * FROM pg_stat_replication;

-- 在从库查询
SELECT pg_is_in_recovery();  -- 应该返回 true
```

### 逻辑复制

**配置发布端（主库）**

```bash
# 1. 修改 postgresql.conf
wal_level = logical

# 2. 重启 PostgreSQL
sudo systemctl restart postgresql
```

```sql
-- 3. 创建发布
CREATE PUBLICATION mypub FOR TABLE users, orders;

-- 或发布所有表
CREATE PUBLICATION mypub FOR ALL TABLES;
```

**配置订阅端（从库）**

```sql
-- 1. 创建订阅
CREATE SUBSCRIPTION mysub
CONNECTION 'host=192.168.1.100 port=5432 dbname=mydb user=replicator password=replicator_password'
PUBLICATION mypub;

-- 2. 查看订阅状态
SELECT * FROM pg_stat_subscription;
```

### 主从切换

**手动切换**

```bash
# 1. 在从库执行提升
pg_ctl promote -D /var/lib/postgresql/data

# 2. 验证从库已提升为主库
SELECT pg_is_in_recovery();  -- 应该返回 false

# 3. 将旧主库配置为从库
# 在旧主库执行
pg_basebackup -h 新主库IP -D /var/lib/postgresql/data -U replicator -P -R
```

**使用 pg_rewind**

```bash
# 1. 停止旧主库
pg_ctl stop -D /var/lib/postgresql/data

# 2. 使用 pg_rewind 同步
pg_rewind -D /var/lib/postgresql/data --source-server=host=新主库IP port=5432

# 3. 配置为从库
echo "primary_conninfo = 'host=新主库IP port=5432 user=replicator password=replicator_password'" >> /var/lib/postgresql/data/postgresql.auto.conf
touch /var/lib/postgresql/data/standby.signal

# 4. 启动 PostgreSQL
pg_ctl start -D /var/lib/postgresql/data
```

---

## 16.4 进阶用法

### Patroni 高可用

**安装 Patroni**

```bash
# 安装 Patroni
sudo pip3 install patroni

# 安装 etcd（用于集群协调）
sudo apt-get install etcd
```

**配置 etcd**

```bash
# etcd.conf
ETCD_NAME="etcd0"
ETCD_DATA_DIR="/var/lib/etcd"
ETCD_LISTEN_PEER_URLS="http://192.168.1.100:2380"
ETCD_LISTEN_CLIENT_URLS="http://192.168.1.100:2379"
ETCD_INITIAL_ADVERTISE_PEER_URLS="http://192.168.1.100:2380"
ETCD_ADVERTISE_CLIENT_URLS="http://192.168.1.100:2379"
ETCD_INITIAL_CLUSTER="etcd0=http://192.168.1.100:2380"

# 启动 etcd
sudo systemctl start etcd
```

**配置 Patroni**

```yaml
# patroni.yml
scope: postgres-cluster
namespace: /db/
name: postgres0

restapi:
  listen: 0.0.0.0:8008
  connect_address: 192.168.1.100:8008

etcd:
  hosts: 192.168.1.100:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    postgresql:
      use_pg_rewind: true
      parameters:
        max_wal_senders: 10
        wal_level: replica
  initdb:
    - encoding: UTF8
    - data-checksums
  pg_hba:
    - host replication replicator 0.0.0.0/0 md5
    - host all all 0.0.0.0/0 md5
  users:
    admin:
      password: admin
      options:
        - createrole
        - createdb

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.1.100:5432
  data_dir: /var/lib/postgresql/data
  bin_dir: /usr/lib/postgresql/16/bin
  authentication:
    replication:
      username: replicator
      password: replicator_password
    superuser:
      username: postgres
      password: postgres_password

tags:
  nofailover: false
  noloadbalance: false
  clonefrom: false
  nosync: false
```

**启动 Patroni**

```bash
# 启动 Patroni
patroni patroni.yml

# 查看集群状态
patronictl -c patroni.yml list
```

### 负载均衡

**使用 HAProxy**

```bash
# haproxy.cfg
global
    log /dev/log local0
    maxconn 4096

defaults
    log global
    mode tcp
    timeout connect 5s
    timeout client 30s
    timeout server 30s

frontend postgres
    bind *:5000
    default_backend postgres_backend

backend postgres_backend
    balance roundrobin
    option httpchk GET /primary
    server postgres0 192.168.1.100:5432 check port 8008
    server postgres1 192.168.1.101:5432 check port 8008
    server postgres2 192.168.1.102:5432 check port 8008
```

### 监控

**Patroni 监控**

```bash
# 查看集群状态
patronictl -c patroni.yml list

# 查看节点状态
curl http://192.168.1.100:8008/patroni
```

**Prometheus 监控**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'patroni'
    static_configs:
      - targets: ['192.168.1.100:8008', '192.168.1.101:8008']
```

---

## 16.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 高可用 | 系统在部分组件故障时仍能正常运行 |
| 流复制 | 物理复制，复制 WAL 日志 |
| 逻辑复制 | 逻辑复制，复制数据变更 |
| 主从切换 | 从库提升为主库 |
| Patroni | 高可用管理工具 |
| etcd | 分布式协调服务 |
| HAProxy | 负载均衡器 |

---

## 16.6 新手常见误区

### 误区 1："从库可以写入数据"

**错！** 从库默认是只读的。

```sql
-- ❌ 错误：在从库写入
INSERT INTO users (name) VALUES ('张三');  -- 报错

-- ✅ 正确：在主库写入
-- 连接到主库
INSERT INTO users (name) VALUES ('张三');
```

### 误区 2："流复制和逻辑复制可以互换"

**错！** 流复制是物理复制，逻辑复制是逻辑复制。

```sql
-- ✅ 流复制：复制整个数据库
-- 适用于：灾难恢复、读写分离

-- ✅ 逻辑复制：复制特定表
-- 适用于：数据同步、跨版本复制
```

### 误区 3："高可用不需要测试"

**错！** 应该定期测试故障转移。

```bash
# ✅ 定期测试
# 1. 模拟主库故障
sudo systemctl stop postgresql

# 2. 验证从库自动提升
patronictl -c patroni.yml list

# 3. 恢复主库
sudo systemctl start postgresql
```

### 误区 4："集群节点越多越好"

**错！** 节点越多，同步开销越大。

建议：
- ✅ 3 节点集群（1 主 2 从）
- ✅ 地理分布（不同机房）
- ✅ 定期监控

---

## 16.7 动手练习

### 练习 1：流复制配置

配置一个主从复制环境。

<details>
<summary>点击查看答案</summary>

```bash
# 主库配置
# 1. 修改 postgresql.conf
wal_level = replica
max_wal_senders = 10
wal_keep_segments = 64

# 2. 修改 pg_hba.conf
host replication replicator 192.168.1.0/24 md5

# 3. 创建复制用户
CREATE ROLE replicator WITH REPLICATION PASSWORD 'replicator_password' LOGIN;

# 从库配置
# 1. 停止 PostgreSQL
sudo systemctl stop postgresql

# 2. 清空数据目录
sudo rm -rf /var/lib/postgresql/data/*

# 3. 从主库复制数据
pg_basebackup -h 主库IP -D /var/lib/postgresql/data -U replicator -P -R

# 4. 创建备用信号文件
sudo touch /var/lib/postgresql/data/standby.signal

# 5. 启动 PostgreSQL
sudo systemctl start postgresql

# 验证
# 主库
SELECT * FROM pg_stat_replication;

# 从库
SELECT pg_is_in_recovery();
```

</details>

### 练习 2：逻辑复制配置

配置一个逻辑复制环境。

<details>
<summary>点击查看答案</summary>

```sql
-- 发布端配置
# 1. 修改 postgresql.conf
wal_level = logical

# 2. 重启 PostgreSQL
sudo systemctl restart postgresql

# 3. 创建发布
CREATE PUBLICATION mypub FOR TABLE users;

-- 订阅端配置
# 1. 创建订阅
CREATE SUBSCRIPTION mysub
CONNECTION 'host=发布端IP port=5432 dbname=mydb user=replicator password=replicator_password'
PUBLICATION mypub;

# 2. 查看订阅状态
SELECT * FROM pg_stat_subscription;
```

</details>

### 练习 3（挑战）：Patroni 集群

使用 Patroni 搭建一个 3 节点的高可用集群。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 安装 etcd 和 Patroni
sudo pip3 install patroni
sudo apt-get install etcd

# 2. 配置 etcd（3 个节点）
# etcd0.conf
ETCD_NAME="etcd0"
ETCD_INITIAL_CLUSTER="etcd0=http://192.168.1.100:2380,etcd1=http://192.168.1.101:2380,etcd2=http://192.168.1.102:2380"

# 3. 配置 Patroni（3 个节点）
# patroni0.yml
scope: postgres-cluster
namespace: /db/
name: postgres0

etcd:
  hosts: 192.168.1.100:2379,192.168.1.101:2379,192.168.1.102:2379

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.1.100:5432
  data_dir: /var/lib/postgresql/data

# 4. 启动 Patroni
patroni patroni0.yml

# 5. 查看集群状态
patronictl -c patroni0.yml list

# 6. 测试故障转移
# 停止主库
sudo systemctl stop postgresql

# 验证从库自动提升
patronictl -c patroni0.yml list
```

</details>

---

## 总结

恭喜你完成了 PostgreSQL 从入门到精通的学习！

通过本教程，你已经掌握了：

- **基础篇**：数据库概念、SQL 语法、数据类型、约束
- **进阶篇**：连接查询、子查询、索引、事务、存储过程、视图、触发器
- **实战篇**：用户权限、备份恢复、性能优化、高可用集群

继续实践和学习，你将成为 PostgreSQL 专家！
