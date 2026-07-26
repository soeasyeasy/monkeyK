---
title: "第14章：备份与恢复"
description: "mongodump、mongorestore、快照备份、时间点恢复"
---

# 第14章：备份与恢复

## 本章导读

在学习备份与恢复之前，你可能会有这些疑问：

1. **为什么需要备份？** MongoDB 有副本集，数据已经有多份了，还需要备份吗？
2. **mongodump 和 mongoexport 有什么区别？** 应该用哪个？
3. **什么是时间点恢复（PITR）？** 和普通备份有什么不同？
4. **备份会不会影响数据库性能？** 生产环境怎么安全地备份？

这些问题都很关键。数据是企业的核心资产，掌握正确的备份恢复策略，才能在灾难发生时快速恢复业务。

## 为什么需要备份与恢复

### 痛点分析

想象这些场景：

- 开发人员误删了生产数据库的重要表
- 硬盘故障导致数据丢失
- 黑客攻击，数据被加密勒索
- 应用 Bug 导致数据被错误修改
- 需要回滚到某个历史时间点的数据

副本集只能防止硬件故障，但无法防止人为误操作。一旦执行了 `db.collection.drop()`，副本集的所有节点都会同步删除数据。

### 生活化类比

把数据备份想象成游戏存档：

- **副本集** = 多个存档点（实时同步，但会被一起覆盖）
- **mongodump** = 手动存档（特定时间点的完整快照）
- **时间点恢复** = 时光倒流（可以回到任意历史时刻）
- **异地备份** = 把存档拷贝到另一个地方（防止本地灾难）

### 代码对比

**没有备份的情况：**
```javascript
// 误删数据
db.users.drop()
// 数据永久丢失，无法恢复 ❌
```

**有备份的情况：**
```javascript
// 误删数据
db.users.drop()
// 从备份恢复 ✅
// mongorestore --db myapp --dir /backup/2024-01-15
```

## 核心原理讲解

### 备份方式分类

MongoDB 的备份方式主要分为两类：

1. **逻辑备份**：导出 JSON/BSON 格式的数据文件
2. **物理备份**：复制底层数据文件（如文件系统快照）

### 通俗类比

| 备份方式 | 生活类比 | 特点 |
|---------|---------|------|
| 逻辑备份 | 把书的内容抄一遍 | 灵活，可跨版本，但慢 |
| 物理备份 | 把书直接复印一本 | 快速，但需要相同环境 |

### 备份策略对比

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| mongodump | 灵活、可部分恢复 | 速度较慢 | 小到中型数据库 |
| 文件系统快照 | 速度快、一致性好 | 需要 LVM 或云快照 | 大型数据库 |
| 时间点恢复 | 可恢复到任意时刻 | 需要 oplog | 高可用要求 |

## 基础用法

### 1. mongodump 逻辑备份

```bash
# 备份整个数据库
mongodump --host localhost --port 27017 --db myapp --out /backup/2024-01-15
# --host: 主机地址 ✅
# --port: 端口号 ✅
# --db: 数据库名 ✅
# --out: 输出目录 ✅

# 备份单个集合
mongodump --db myapp --collection users --out /backup/
# 只备份 users 集合 ✅

# 带认证备份
mongodump --host localhost -u admin -p password --authenticationDatabase admin \
  --db myapp --out /backup/
# -u: 用户名 ✅
# -p: 密码 ✅
# --authenticationDatabase: 认证数据库 ✅

# 错误示例：没有指定输出目录
mongodump --db myapp
# ❌ 默认输出到当前目录的 dump/ 文件夹，可能不是你想要的

# 压缩备份（MongoDB 4.2+）
mongodump --db myapp --out /backup/ --gzip
# --gzip: 启用压缩 ✅ 可以减少 70% 以上的存储空间
```

### 2. mongorestore 恢复数据

```bash
# 恢复整个数据库
mongorestore --db myapp --dir /backup/2024-01-15/myapp
# --db: 目标数据库名 ✅
# --dir: 备份文件目录 ✅

# 恢复单个集合
mongorestore --db myapp --collection users /backup/2024-01-15/myapp/users.bson
# 指定 .bson 文件路径 ✅

# 覆盖已有数据
mongorestore --db myapp --dir /backup/2024-01-15/myapp --drop
# --drop: 恢复前删除原有数据 ✅
# ⚠️ 注意：这会删除目标数据库的现有数据！

# 不带 --drop 的情况
mongorestore --db myapp --dir /backup/2024-01-15/myapp
# ✅ 默认是追加模式，不会删除现有数据

# 恢复压缩文件
mongorestore --db myapp --dir /backup/2024-01-15/myapp --gzip
# --gzip: 解压 gzip 文件 ✅
```

### 3. mongoexport 导出 JSON

```bash
# 导出为 JSON
mongoexport --db myapp --collection users --out users.json
# 默认输出 JSON 格式 ✅

# 导出为 CSV
mongoexport --db myapp --collection users \
  --type=csv --fields name,email,age --out users.csv
# --type=csv: 指定 CSV 格式 ✅
# --fields: 指定要导出的字段 ✅

# 带条件导出
mongoexport --db myapp --collection users \
  --query '{"age": {"$gt": 18}}' --out adults.json
# --query: 过滤条件 ✅

# 格式化输出（易读）
mongoexport --db myapp --collection users --pretty --out users-pretty.json
# --pretty: 格式化 JSON ✅
```

### 4. mongoimport 导入数据

```bash
# 导入 JSON 文件
mongoimport --db myapp --collection users --file users.json
# --file: 指定文件路径 ✅

# 导入 CSV 文件
mongoimport --db myapp --collection users \
  --type=csv --headerline --file users.csv
# --headerline: 第一行作为字段名 ✅

# 覆盖已有数据
mongoimport --db myapp --collection users \
  --file users.json --drop
# --drop: 导入前删除集合 ✅

# 指定字段类型
mongoimport --db myapp --collection users \
  --columnsHaveTypes \
  --fields "name.string(),age.int32(),salary.double()" \
  --file users.csv --type=csv
# 确保数据类型正确 ✅
```

### 5. 文件系统快照备份

```bash
# 1. 先刷新数据到磁盘
mongo --eval "db.getSiblingDB('admin').runCommand({fsync:1})"

# 2. 创建 LVM 快照（Linux）
sudo lvcreate --size 10G --snapshot --name mongo-snapshot /dev/vg0/mongo-data

# 3. 挂载快照
sudo mkdir /mnt/snapshot
sudo mount /dev/vg0/mongo-snapshot /mnt/snapshot

# 4. 拷贝数据文件
sudo cp -r /mnt/snapshot /backup/snapshot-2024-01-15

# 5. 卸载并删除快照
sudo umount /mnt/snapshot
sudo lvremove -f /dev/vg0/mongo-snapshot

# 云环境（如 AWS EBS）
# 使用 EC2 控制台创建 EBS 快照 ✅
```

### 6. 时间点恢复（PITR）

```bash
# 前提：必须开启 oplog
# mongod.conf:
# storage:
#   dbPath: /data/db
# replication:
#   replSetName: rs0  # 副本集必须开启 oplog

# 1. 先做一个基础备份
mongodump --host localhost --db myapp --out /backup/base --oplog
# --oplog: 同时备份 oplog ✅

# 2. 恢复到指定时间点
mongorestore --host localhost --db myapp --dir /backup/base/myapp \
  --oplogReplay --oplogLimit "1642249200:1"
# --oplogReplay: 重放 oplog ✅
# --oplogLimit: 恢复到指定时间戳（Unix时间戳:递增序号）✅

# 计算目标时间戳
# date -d "2024-01-15 10:30:00" +%s
# 输出: 1705286400

# 恢复到 2024-01-15 10:30:00
mongorestore --oplogReplay --oplogLimit "1705286400:1"
```

### 7. 副本集备份策略

```bash
# 在副本集的从节点上备份（推荐）
# 避免影响主节点性能

# 连接到从节点
mongodump --host secondary-node:27017 --db myapp --out /backup/ \
  --readPreference secondary
# --readPreference secondary: 优先读取从节点 ✅

# 备份时加锁（保证一致性）
mongo --host secondary-node:27017 --eval "
  db.getSiblingDB('admin').runCommand({fsync:1, lock:true})
  // 执行备份...
  db.getSiblingDB('admin').runCommand({fsyncUnlock:1})
"
```

### 8. 分片集群备份

```bash
# 方法1：使用 mongodump 逐个分片备份
# 1. 备份 config 数据库
mongodump --host config-server:27017 --db config --out /backup/config

# 2. 备份每个分片
mongodump --host shard1:27017 --db myapp --out /backup/shard1
mongodump --host shard2:27017 --db myapp --out /backup/shard2

# 方法2：使用 MongoDB Cloud Manager 或 Ops Manager
# 提供图形化界面和自动化备份 ✅
```

### 9. 备份自动化脚本

```bash
#!/bin/bash
# backup.sh - MongoDB 自动备份脚本

BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 执行备份
mongodump --host localhost --db myapp \
  --out ${BACKUP_DIR}/backup_${DATE} \
  --gzip

# 压缩备份
cd ${BACKUP_DIR}
tar -czf backup_${DATE}.tar.gz backup_${DATE}
rm -rf backup_${DATE}

# 删除旧备份
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: backup_${DATE}.tar.gz"
```

```yaml
# crontab 定时任务
# 每天凌晨 2 点执行备份
0 2 * * * /path/to/backup.sh >> /var/log/mongodb-backup.log 2>&1
```

## 对比表格

### 不同备份方式对比

| 备份方式 | 速度 | 一致性 | 恢复速度 | 存储空间 | 适用场景 |
|---------|------|--------|---------|---------|---------|
| mongodump | 慢 | 好 | 慢 | 大 | 小到中型数据库 |
| mongoexport | 慢 | 好 | 慢 | 大 | 数据迁移、导出 |
| 文件系统快照 | 快 | 好 | 快 | 小 | 大型数据库 |
| LVM 快照 | 快 | 好 | 快 | 小 | Linux 环境 |
| 云快照 | 快 | 好 | 快 | 小 | 云环境 |
| oplog 备份 | 快 | 实时 | 快 | 小 | 时间点恢复 |

### mongodump vs mongoexport

| 特性 | mongodump | mongoexport |
|------|-----------|-------------|
| 输出格式 | BSON | JSON/CSV |
| 数据类型 | 保留所有类型 | 可能丢失类型 |
| 恢复速度 | 快 | 慢 |
| 可读性 | 差（二进制） | 好（文本） |
| 跨版本 | 支持 | 支持 |
| 适用场景 | 完整备份 | 数据导出 |

## 新手常见误区

### 误区 1：有副本集就不需要备份

**错误认识：** "我的数据在三个节点上都有副本，不需要备份了。"

**正确理解：** 
- 副本集只能防止硬件故障
- 无法防止误删除（drop 操作会同步到所有节点）
- 无法防止数据被错误修改
- 无法恢复到历史时间点

### 误区 2：备份不影响性能

**错误认识：** "备份是只读操作，不会影响数据库。"

**正确理解：** 
- mongodump 会读取大量数据，占用磁盘 I/O
- 可能影响查询性能
- 建议：在从节点备份，或使用 `--readPreference secondary`

### 误区 3：备份文件不需要测试恢复

**错误认识：** "我已经做了备份，数据安全了。"

**正确理解：** 
- 备份文件可能损坏
- 恢复流程可能有问题
- 定期测试恢复演练（建议每季度一次）

### 误区 4：只备份数据就够了

**错误认识：** "只要备份了数据文件就行。"

**正确理解：** 
- 还需要备份配置文件（mongod.conf）
- 备份认证数据（admin 数据库）
- 备份索引定义
- 记录 MongoDB 版本

### 误区 5：备份保留越久越好

**错误认识：** "我应该永久保留所有备份。"

**正确理解：** 
- 存储空间有限
- 合规要求通常规定保留期限
- 建议：日常备份保留 7-30 天，月度备份保留 1 年

## 动手练习

### 练习 1：完整备份与恢复

**需求：** 
1. 使用 mongodump 备份 `myapp` 数据库
2. 删除 `users` 集合
3. 使用 mongorestore 恢复数据

<details>
<summary>点击查看答案</summary>

```bash
# 1. 备份数据库
mongodump --host localhost --db myapp --out /backup/test

# 2. 删除集合（在 mongo shell 中）
mongo
use myapp
db.users.drop()

# 3. 恢复数据
mongorestore --host localhost --db myapp --dir /backup/test/myapp

# 4. 验证恢复
mongo
use myapp
db.users.find()
```

</details>

### 练习 2：导出导入 CSV 数据

**需求：** 
1. 将 `users` 集合导出为 CSV 格式
2. 只导出 `name`、`email`、`age` 字段
3. 将 CSV 文件导入到新的集合

<details>
<summary>点击查看答案</summary>

```bash
# 1. 导出为 CSV
mongoexport --db myapp --collection users \
  --type=csv --fields name,email,age \
  --out users_export.csv

# 2. 查看导出文件
cat users_export.csv

# 3. 导入到新集合
mongoimport --db myapp --collection users_copy \
  --type=csv --headerline \
  --file users_export.csv

# 4. 验证
mongo
use myapp
db.users_copy.find()
```

</details>

### 练习 3：编写自动备份脚本

**需求：** 编写一个备份脚本，要求：
1. 备份 `myapp` 数据库并压缩
2. 保留最近 7 天的备份
3. 设置每天凌晨 3 点自动执行

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# auto_backup.sh

BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# 创建目录
mkdir -p ${BACKUP_DIR}

# 备份并压缩
mongodump --host localhost --db myapp --out ${BACKUP_DIR}/backup_${DATE} --gzip

# 打包
cd ${BACKUP_DIR}
tar -czf backup_${DATE}.tar.gz backup_${DATE}
rm -rf backup_${DATE}

# 清理旧备份
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: backup_${DATE}.tar.gz"
```

```bash
# 设置定时任务
chmod +x auto_backup.sh
crontab -e
# 添加以下行：
0 3 * * * /path/to/auto_backup.sh >> /var/log/mongodb-backup.log 2>&1
```

</details>

## 备份最佳实践

1. **3-2-1 原则**：至少 3 份备份，存储在 2 种不同介质，1 份异地存储
2. **定期测试恢复**：每季度至少做一次恢复演练
3. **监控备份状态**：设置告警，确保备份成功
4. **加密备份文件**：防止备份数据泄露
5. **文档化恢复流程**：确保任何人都能按步骤恢复
6. **考虑 RPO 和 RTO**：
   - RPO（恢复点目标）：最多丢失多少数据？
   - RTO（恢复时间目标）：多久内必须恢复？
7. **使用 oplog**：实现时间点恢复，减少数据丢失
8. **备份验证**：检查备份文件的完整性

## 下一章预告

下一章我们将学习 MongoDB 的驱动与 ORM。你将了解如何在不同编程语言中使用 MongoDB：

- Node.js 官方驱动的使用
- Mongoose ODM 的强大功能
- Spring Data MongoDB 的 Repository 模式
- 不同驱动的特点和适用场景

掌握这些工具，能让你在实际项目中更高效地使用 MongoDB。
