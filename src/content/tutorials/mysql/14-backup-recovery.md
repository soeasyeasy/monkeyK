---
title: "第14章：备份与恢复"
description: "mysqldump、mysqlpump、二进制日志、时间点恢复"
---

# 第14章：备份与恢复

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 数据库备份有什么用？为什么不能只靠代码里的数据？
- mysqldump 是什么？怎么用？
- 如果数据被误删了，怎么恢复到删除前的状态？

这一章就是为了解答这些问题。我们会从生活中的例子出发，帮你搞懂备份的重要性，再学会使用各种备份和恢复工具。

---

## 14.1 为什么需要备份？

### 数据丢失的灾难

想象一下这些场景：
- 程序员手滑执行了 DELETE FROM users，没有加 WHERE 条件
- 硬盘坏了，数据库文件全部丢失
- 黑客入侵，删除了所有数据
- 服务器被雷击，机房断电

如果没有备份，这些情况一旦发生，数据就永远丢失了。

这就像你没有给手机里的照片做备份，手机丢了，所有照片都没了。

### 备份的解决方式：数据的"后悔药"

备份就是给数据做"快照"，定期保存一份副本。

打个比方：你每天写日记，每周末都会复印一份放在家里。如果日记本丢了，你还有复印件。备份就是数据库的"复印件"。

| 对比项 | 没有备份 | 有备份 |
|--------|----------|--------|
| 数据丢失 | 永久丢失，无法恢复 | 可以从备份恢复 |
| 误操作 | 无法撤销 | 可以恢复到误操作前的状态 |
| 硬件故障 | 数据全丢 | 可以从备份重建 |
| 灾难恢复 | 无法恢复 | 可以快速恢复业务 |

> 一句话总结：备份是数据的"保险"，平时觉得没用，一旦出事就是救命稻草。

---

## 14.2 逻辑备份：mysqldump

### 什么是逻辑备份？

逻辑备份是把数据库的结构和数据导出为 SQL 文本文件。

打个比方：逻辑备份就像把一本书的内容抄写一遍，虽然慢，但抄写出来的内容可以阅读和编辑。

### mysqldump 基本用法

```bash
# 备份单个数据库
mysqldump -u root -p company > company_backup.sql
# 备份 company 数据库到 company_backup.sql 文件
# -u root：使用 root 用户
# -p：提示输入密码
# company：数据库名
# > company_backup.sql：输出到文件

# 备份多个数据库
mysqldump -u root -p --databases company test > backup.sql
# 同时备份 company 和 test 两个数据库

# 备份所有数据库
mysqldump -u root -p --all-databases > all_backup.sql
# 备份所有数据库

# 备份单个表
mysqldump -u root -p company users > users_backup.sql
# 只备份 company 数据库的 users 表
```

### 恢复备份

```bash
# 恢复数据库
mysql -u root -p company < company_backup.sql
# 将 company_backup.sql 恢复到 company 数据库
# < company_backup.sql：从文件读取

# 在 MySQL 命令行中恢复
mysql> USE company;
mysql> SOURCE /path/to/company_backup.sql;
# 使用 SOURCE 命令执行 SQL 文件
```

### mysqldump 常用选项

| 选项 | 作用 | 示例 |
|------|------|------|
| --single-transaction | 使用事务备份，不锁表 | mysqldump --single-transaction |
| --routines | 备份存储过程和函数 | mysqldump --routines |
| --triggers | 备份触发器 | mysqldump --triggers |
| --events | 备份事件调度器 | mysqldump --events |
| --flush-logs | 备份后刷新日志 | mysqldump --flush-logs |
| --master-data | 记录主从复制信息 | mysqldump --master-data=2 |

```bash
# 完整备份示例
mysqldump -u root -p \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  company > company_full_backup.sql
# 备份数据库，包括存储过程、触发器、事件
```

---

## 14.3 物理备份

### 什么是物理备份？

物理备份是直接复制数据库的文件。

打个比方：物理备份就像把整本书复印一遍，速度快，但复印件不能直接阅读，需要专门的设备。

### 物理备份的方法

**方法 1：直接复制数据文件**

```bash
# 停止 MySQL 服务
systemctl stop mysql

# 复制数据目录
cp -r /var/lib/mysql /backup/mysql_backup

# 启动 MySQL 服务
systemctl start mysql
```

**方法 2：使用 mysqlpump（MySQL 5.7+）**

```bash
# 使用 mysqlpump 备份
mysqlpump -u root -p --databases company > company_backup.sql
# mysqlpump 是 mysqldump 的升级版，支持并行备份，速度更快
```

### 逻辑备份 vs 物理备份

| 对比项 | 逻辑备份 | 物理备份 |
|--------|----------|----------|
| 备份内容 | SQL 文本文件 | 数据库文件 |
| 备份速度 | 慢 | 快 |
| 恢复速度 | 慢（需要执行 SQL） | 快（直接复制文件） |
| 跨平台 | 可以（文本格式） | 不可以（文件格式不同） |
| 可读性 | 好（可以编辑 SQL） | 差（二进制文件） |
| 适用场景 | 小数据库、跨平台迁移 | 大数据库、快速恢复 |

---

## 14.4 全量备份 vs 增量备份

### 全量备份

全量备份是备份所有数据。

打个比方：全量备份就像每天把整本日记都复印一遍。

```bash
# 全量备份
mysqldump -u root -p --all-databases > full_backup_20240101.sql
# 备份所有数据库
```

### 增量备份

增量备份只备份自上次备份以来变化的数据。

打个比方：增量备份就像每天只复印新写的日记页，不重复复印已经复印过的。

增量备份需要借助二进制日志（binlog）：

```bash
# 第一次全量备份
mysqldump -u root -p --flush-logs --all-databases > full_backup.sql
# --flush-logs：刷新日志，开始新的日志文件

# 之后每天增量备份
mysqlbinlog --start-datetime="2024-01-02 00:00:00" \
            --stop-datetime="2024-01-03 00:00:00" \
            /var/log/mysql/binlog.000002 > incremental_backup.sql
# 只备份某一天的变更
```

### 全量 vs 增量对比

| 对比项 | 全量备份 | 增量备份 |
|--------|----------|----------|
| 备份数据量 | 所有数据 | 只备份变化的数据 |
| 备份速度 | 慢 | 快 |
| 占用空间 | 大 | 小 |
| 恢复速度 | 快（一次恢复） | 慢（需要多次恢复） |
| 恢复复杂度 | 简单 | 复杂（需要按顺序恢复） |
| 适用场景 | 数据量小、恢复要求快 | 数据量大、备份频繁 |

---

## 14.5 二进制日志（binlog）

### 什么是二进制日志？

二进制日志记录了所有对数据库的修改操作。

打个比方：binlog 就像银行的监控录像，记录了每一笔交易。如果账目对不上，可以查看录像找出问题。

### 查看 binlog 配置

```sql
-- 查看 binlog 是否开启
SHOW VARIABLES LIKE 'log_bin';
-- 显示 ON 表示已开启

-- 查看 binlog 文件列表
SHOW BINARY LOGS;
-- 显示所有 binlog 文件

-- 查看当前正在写入的 binlog
SHOW MASTER STATUS;
-- 显示当前 binlog 文件名和位置
```

### 查看 binlog 内容

```bash
# 查看 binlog 内容
mysqlbinlog /var/log/mysql/binlog.000001
# 显示 binlog 中的 SQL 语句

# 按时间范围查看
mysqlbinlog --start-datetime="2024-01-01 00:00:00" \
            --stop-datetime="2024-01-02 00:00:00" \
            /var/log/mysql/binlog.000001
# 只查看某一天的操作

# 按位置范围查看
mysqlbinlog --start-position=1000 --stop-position=2000 \
            /var/log/mysql/binlog.000001
# 只查看指定位置范围内的操作
```

### binlog 的三种格式

| 格式 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| STATEMENT | 记录每条 SQL 语句 | 记录小，恢复快 | 某些函数无法正确复制 |
| ROW | 记录每行数据的变化 | 可以精确复制 | 记录大，占用空间多 |
| MIXED | 混合使用两种格式 | 兼顾两者优点 | 配置复杂 |

```sql
-- 查看 binlog 格式
SHOW VARIABLES LIKE 'binlog_format';
-- 显示当前格式

-- 设置 binlog 格式
SET GLOBAL binlog_format = 'ROW';
-- 设置为 ROW 格式（推荐）
```

---

## 14.6 时间点恢复

### 什么是时间点恢复？

时间点恢复是指把数据库恢复到过去某个特定时间的状态。

打个比方：你玩游戏时存档了，后来游戏角色死了，你可以读取之前的存档，回到存档时的状态。

### 恢复步骤

假设在 2024-01-15 10:00:00 误删了数据，需要恢复到 09:59:00 的状态：

```bash
# 第一步：恢复最近的全量备份
mysql -u root -p company < full_backup_20240115.sql
# 恢复到 2024-01-15 的全量备份状态

# 第二步：应用增量备份（binlog）
mysqlbinlog --start-datetime="2024-01-15 00:00:00" \
            --stop-datetime="2024-01-15 09:59:00" \
            /var/log/mysql/binlog.000005 | mysql -u root -p company
# 应用从 00:00:00 到 09:59:00 的所有变更

# 结果：数据库恢复到误删除前的状态
```

### 时间点恢复的注意事项

| 注意事项 | 说明 |
|----------|------|
| 必须有全量备份 | 时间点恢复基于全量备份 |
| 必须有 binlog | binlog 记录了所有变更 |
| binlog 不能中断 | 从全量备份到目标时间点的 binlog 必须完整 |
| 恢复时间长 | 需要应用大量 binlog，耗时较长 |
| 测试恢复 | 定期测试恢复流程，确保能成功恢复 |

---

## 14.7 备份策略

### 备份策略设计

一个完整的备份策略应该包括：

**1. 全量备份频率**
- 每天一次（数据量小）
- 每周一次（数据量大）

**2. 增量备份频率**
- 每小时一次（重要数据）
- 每天一次（一般数据）

**3. 备份保留时间**
- 保留 7 天的备份（日常恢复）
- 保留 30 天的备份（月度恢复）
- 保留 1 年的备份（年度恢复）

### 定时备份

使用 crontab 定时执行备份：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点全量备份
0 2 * * * mysqldump -u root -p'password' --all-databases > /backup/full_$(date +\%Y\%m\%d).sql

# 每小时增量备份
0 * * * * mysqlbinlog --read-from-remote-server --host=localhost -u root -p'password' \
          --stop-never --result-file=/backup/binlog_$(date +\%Y\%m\%d_\%H).sql
```

### 异地备份

把备份文件保存到其他位置，防止本地灾难：

```bash
# 备份到远程服务器
mysqldump -u root -p company | ssh user@remote_server "cat > /backup/company_backup.sql"
# 通过 SSH 将备份传输到远程服务器

# 使用 rsync 同步备份
rsync -avz /backup/ user@remote_server:/backup/
# 同步本地备份到远程服务器
```

### 备份策略对比

| 策略 | 备份频率 | 恢复速度 | 存储空间 | 适用场景 |
|------|----------|----------|----------|----------|
| 每天全量 | 每天 | 快 | 大 | 数据量小，恢复要求快 |
| 每周全量 + 每天增量 | 每周 | 中等 | 中等 | 数据量中等 |
| 每月全量 + 每周增量 | 每月 | 慢 | 小 | 数据量大，备份频繁 |

---

## 14.8 新手常见误区

### 误区 1："有备份就行了，不需要测试恢复"

错！备份文件可能损坏，恢复流程可能有 bug。必须定期测试恢复，确保备份文件可用，恢复流程正确。否则真正需要恢复时会发现备份无效。

### 误区 2："只备份数据，不备份结构和配置"

错！备份应该包括：数据库结构（表、索引）、数据、存储过程、触发器、用户权限等。使用 mysqldump 时加上 --routines --triggers --events 选项。

### 误区 3："备份文件放在同一台服务器"

错！如果服务器硬盘坏了，备份文件也一起丢失。备份文件应该保存在不同的服务器、不同的机房，甚至不同的城市。这就是"异地备份"的重要性。

### 误区 4："binlog 会永久保存"

错！binlog 文件会占用大量空间，MySQL 会自动清理旧的 binlog。可以通过设置 expire_logs_days 控制保留时间。重要操作后应该立即备份 binlog。

### 误区 5："备份会影响数据库性能"

有一定影响，但可以通过优化减少：
- 使用 --single-transaction 选项，不锁表
- 在业务低峰期备份
- 使用从库备份，不影响主库

---

## 14.9 动手练习

### 练习 1：使用 mysqldump 备份

使用 mysqldump 备份 company 数据库，包括存储过程和触发器。

<details>
<summary>点击查看答案</summary>

```bash
mysqldump -u root -p \
  --routines \
  --triggers \
  --events \
  company > company_backup.sql
# 备份 company 数据库，包括存储过程、触发器、事件
```

</details>

### 练习 2：查看 binlog

查看 binlog 文件中 2024-01-15 这一天的所有操作。

<details>
<summary>点击查看答案</summary>

```bash
mysqlbinlog --start-datetime="2024-01-15 00:00:00" \
            --stop-datetime="2024-01-16 00:00:00" \
            /var/log/mysql/binlog.000001
# 查看 2024-01-15 这一天的所有操作
```

</details>

### 练习 3（挑战）：时间点恢复

假设在 2024-01-15 14:00:00 误删了 users 表，请写出恢复到 13:59:00 的完整步骤。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：恢复最近的全量备份（假设是 2024-01-15 凌晨 2 点的备份）
mysql -u root -p company < full_backup_20240115.sql

# 第二步：应用从凌晨 2 点到 13:59:00 的 binlog
mysqlbinlog --start-datetime="2024-01-15 02:00:00" \
            --stop-datetime="2024-01-15 13:59:00" \
            /var/log/mysql/binlog.000005 | mysql -u root -p company

# 结果：数据库恢复到误删除前的状态
```

</details>

---

## 下一章预告

下一章我们会学习 **性能优化实战**。你会了解如何分析慢查询、如何使用 EXPLAIN 查看执行计划、如何优化 SQL 语句和 MySQL 配置。这些是让数据库跑得更快的核心技术。
