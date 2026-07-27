---
title: "第14章：备份与恢复"
description: "pg_dump、pg_restore、WAL 日志、时间点恢复"
---

# 第14章：备份与恢复

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何备份 PostgreSQL 数据库？
- pg_dump 和 pg_basebackup 有什么区别？
- 什么是 WAL 日志？
- 如何进行时间点恢复（PITR）？
- 有哪些备份策略？

这一章就是为了解答这些问题。我们会先搞清楚 **备份的基本概念**，再学习**各种备份工具**，最后掌握**恢复技术**。

---

## 14.1 为什么需要备份？

### 痛点分析

想象一下，你的数据库服务器突然崩溃：

```
❌ 场景：
- 硬盘损坏
- 误删除数据
- 黑客攻击
- 自然灾害

❌ 没有备份的后果：
- 数据永久丢失
- 业务中断
- 经济损失
- 声誉受损
```

### 解决方案

定期备份数据库：

```bash
# ✅ 每天备份
pg_dump mydb > backup_$(date +%Y%m%d).sql

# ✅ 定期测试恢复
psql mydb_test < backup_20240115.sql
```

优势：
- ✅ 数据安全
- ✅ 业务连续
- ✅ 灾难恢复

> **一句话总结**：备份是数据安全的最后一道防线，必须定期执行并测试恢复。

---

## 14.2 核心原理

### 概念解释

**逻辑备份**

导出数据库的 SQL 语句或数据。

打个比方：

> 逻辑备份就像是**复制文档内容**：
> - 备份的是数据和结构
> - 可以跨版本恢复
> - 备份文件较小

**物理备份**

复制数据库的物理文件。

打个比方：

> 物理备份就像是**复制整个文件夹**：
> - 备份的是数据文件
> - 必须相同版本恢复
> - 备份文件较大

**WAL（Write-Ahead Logging）**

WAL 是 PostgreSQL 的日志机制，记录所有数据变更。

打个比方：

> WAL 就像是**日记本**：
> - 记录所有操作
> - 可以重放操作
> - 用于恢复和复制

---

## 14.3 基础用法

### pg_dump（逻辑备份）

**备份整个数据库**

```bash
# 备份为 SQL 格式
pg_dump mydb > backup.sql

# 备份为自定义格式
pg_dump -F c mydb > backup.dump

# 备份为纯文本格式
pg_dump -F p mydb > backup.sql
```

**备份指定表**

```bash
# 备份单个表
pg_dump -t users mydb > users_backup.sql

# 备份多个表
pg_dump -t users -t orders mydb > tables_backup.sql
```

**备份选项**

```bash
# 只备份数据（不包括结构）
pg_dump -a mydb > data_only.sql

# 只备份结构（不包括数据）
pg_dump -s mydb > schema_only.sql

# 压缩备份
pg_dump -Z 9 mydb > backup.sql.gz

# 并行备份
pg_dump -j 4 -F d mydb -f backup_dir
```

### pg_restore（恢复）

**恢复数据库**

```bash
# 恢复到新数据库
createdb mydb_new
pg_restore -d mydb_new backup.dump

# 恢复到现有数据库
pg_restore -d mydb backup.dump

# 只恢复数据
pg_restore -a -d mydb backup.dump

# 只恢复结构
pg_restore -s -d mydb backup.dump
```

**恢复选项**

```bash
# 恢复前清理
pg_restore -c -d mydb backup.dump

# 创建数据库
pg_restore -C -d mydb backup.dump

# 并行恢复
pg_restore -j 4 -d mydb backup.dump
```

### psql（SQL 格式恢复）

```bash
# 恢复 SQL 格式备份
psql -d mydb -f backup.sql

# 恢复压缩备份
gunzip -c backup.sql.gz | psql -d mydb
```

---

## 14.4 进阶用法

### pg_basebackup（物理备份）

**完整备份**

```bash
# 创建备份目录
mkdir /backup/basebackup

# 执行完整备份
pg_basebackup -D /backup/basebackup -F t -z -P

# 参数说明：
# -D: 备份目录
# -F t: tar 格式
# -z: 压缩
# -P: 显示进度
```

**恢复物理备份**

```bash
# 1. 停止 PostgreSQL
sudo systemctl stop postgresql

# 2. 备份现有数据目录
sudo mv /var/lib/postgresql/data /var/lib/postgresql/data_old

# 3. 解压备份
sudo tar -xzf /backup/basebackup/base.tar -C /var/lib/postgresql/data

# 4. 创建恢复配置文件
sudo vim /var/lib/postgresql/data/recovery.conf
restore_command = 'cp /backup/wal/%f %p'
recovery_target_time = '2024-01-15 14:30:00'

# 5. 启动 PostgreSQL
sudo systemctl start postgresql
```

### WAL 归档

**配置 WAL 归档**

```bash
# 1. 修改 postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'

# 2. 创建归档目录
sudo mkdir -p /backup/wal
sudo chown postgres:postgres /backup/wal

# 3. 重启 PostgreSQL
sudo systemctl restart postgresql
```

**查看 WAL 状态**

```sql
-- 查看当前 WAL 位置
SELECT pg_current_wal_lsn();

-- 查看 WAL 文件
SELECT * FROM pg_ls_waldir();
```

### 时间点恢复（PITR）

**1. 配置归档**

```bash
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
```

**2. 执行完整备份**

```bash
pg_basebackup -D /backup/base -F t -z -P
```

**3. 恢复到指定时间点**

```bash
# 1. 停止 PostgreSQL
sudo systemctl stop postgresql

# 2. 恢复基础备份
sudo rm -rf /var/lib/postgresql/data/*
sudo tar -xzf /backup/base/base.tar.gz -C /var/lib/postgresql/data

# 3. 创建恢复信号文件
sudo touch /var/lib/postgresql/data/recovery.signal

# 4. 配置恢复参数
sudo vim /var/lib/postgresql/data/postgresql.auto.conf
restore_command = 'cp /backup/wal/%f %p'
recovery_target_time = '2024-01-15 14:30:00'

# 5. 启动 PostgreSQL
sudo systemctl start postgresql
```

### 备份脚本

```bash
#!/bin/bash
# backup.sh - PostgreSQL 备份脚本

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="mydb"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -F c -Z 9 $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.dump

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete

# 记录日志
echo "Backup completed: ${DB_NAME}_${DATE}.dump" >> $BACKUP_DIR/backup.log
```

---

## 14.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| pg_dump | 逻辑备份工具 |
| pg_restore | 逻辑恢复工具 |
| pg_basebackup | 物理备份工具 |
| WAL | 预写日志 |
| PITR | 时间点恢复 |
| 归档 | WAL 归档配置 |

---

## 14.6 新手常见误区

### 误区 1："只需要逻辑备份"

**错！** 应该结合逻辑备份和物理备份。

```bash
# ✅ 逻辑备份：用于迁移、升级
pg_dump mydb > backup.sql

# ✅ 物理备份：用于灾难恢复
pg_basebackup -D /backup/base -F t -z -P
```

### 误区 2："备份后不需要测试恢复"

**错！** 应该定期测试恢复。

```bash
# ✅ 定期测试恢复
createdb test_restore
pg_restore -d test_restore backup.dump
# 验证数据完整性
psql -d test_restore -c "SELECT COUNT(*) FROM users;"
```

### 误区 3："备份可以恢复所有数据"

**错！** 备份只能恢复到备份时的状态。

```bash
# ❌ 错误：备份后删除的数据无法恢复
pg_dump mydb > backup.sql
# 删除数据
DELETE FROM users;
# 恢复后数据仍然丢失

# ✅ 正确：使用 PITR 恢复到删除前
# 配置 WAL 归档，恢复到删除前的时间点
```

### 误区 4："备份频率越低越好"

**错！** 备份频率取决于数据变化频率。

建议：
- ✅ 核心数据：每小时备份
- ✅ 重要数据：每天备份
- ✅ 一般数据：每周备份

---

## 14.7 动手练习

### 练习 1：逻辑备份

使用 pg_dump 备份数据库，并恢复到新数据库。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 备份数据库
pg_dump -F c mydb > mydb_backup.dump

# 2. 创建新数据库
createdb mydb_restore

# 3. 恢复数据库
pg_restore -d mydb_restore mydb_backup.dump

# 4. 验证恢复
psql -d mydb_restore -c "SELECT COUNT(*) FROM users;"
```

</details>

### 练习 2：WAL 归档

配置 WAL 归档，并查看归档状态。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 修改 postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'

# 2. 创建归档目录
sudo mkdir -p /backup/wal
sudo chown postgres:postgres /backup/wal

# 3. 重启 PostgreSQL
sudo systemctl restart postgresql

# 4. 查看归档状态
psql -c "SHOW archive_mode;"
psql -c "SHOW archive_command;"

# 5. 查看 WAL 文件
psql -c "SELECT * FROM pg_ls_waldir();"
```

</details>

### 练习 3（挑战）：完整备份策略

设计一个完整的备份策略，包括：
- 每天凌晨 2 点执行完整备份
- 每小时执行增量备份
- 保留 7 天的备份

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# full_backup.sh - 完整备份脚本

BACKUP_DIR="/backup/full"
DATE=$(date +%Y%m%d)
DB_NAME="mydb"

mkdir -p $BACKUP_DIR

# 执行完整备份
pg_basebackup -D $BACKUP_DIR/$DATE -F t -z -P

# 删除 7 天前的备份
find $BACKUP_DIR -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;

echo "Full backup completed: $DATE" >> $BACKUP_DIR/backup.log
```

```bash
#!/bin/bash
# incremental_backup.sh - 增量备份脚本

BACKUP_DIR="/backup/incremental"
DATE=$(date +%Y%m%d_%H%M)
DB_NAME="mydb"

mkdir -p $BACKUP_DIR

# 执行逻辑备份（增量）
pg_dump -F c -Z 9 $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.dump

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete

echo "Incremental backup completed: $DATE" >> $BACKUP_DIR/backup.log
```

```bash
# 配置定时任务
sudo crontab -e

# 每天凌晨 2 点执行完整备份
0 2 * * * /path/to/full_backup.sh

# 每小时执行增量备份
0 * * * * /path/to/incremental_backup.sh
```

</details>

---

## 下一章预告

下一章我们会学习 **性能优化实战**——了解如何分析慢查询，掌握执行计划解读、索引优化、配置调优等技术，以及性能监控工具的使用。
