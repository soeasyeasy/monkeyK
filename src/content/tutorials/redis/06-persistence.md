---
title: "第6章：Redis 持久化机制"
description: "RDB 快照、AOF 日志、混合持久化、持久化策略"
---

# 第6章：Redis 持久化机制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 是内存数据库，数据会丢失吗？
- 如何保证 Redis 重启后数据还在？
- RDB 和 AOF 有什么区别？
- 应该选择哪种持久化方式？
- 混合持久化是什么？

这一章会详细讲解 Redis 的持久化机制，帮你掌握如何保证数据的安全性。

---

## 6.1 为什么需要持久化？

### 痛点分析

Redis 是内存数据库，所有数据都存储在内存中。如果服务器宕机或重启，内存中的数据会全部丢失。

想象一下这个场景：你用 Redis 存储了用户的会话信息和购物车数据，突然服务器断电重启，所有数据都没了，用户被迫重新登录，购物车也空了。

### 解决方案

Redis 提供了两种持久化方式：

| 方式 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **RDB** | 定时生成数据快照 | 文件紧凑，恢复快 | 可能丢失最后一次快照后的数据 |
| **AOF** | 记录每次写操作 | 数据完整性高 | 文件较大，恢复较慢 |

---

## 6.2 RDB 持久化

### 概念解释

RDB（Redis Database）是在指定时间间隔内将内存中的数据集快照写入磁盘。

打个比方：

> RDB 就像给内存数据拍照：每隔一段时间拍一张照片，如果数据丢失了，可以用最近的照片恢复。

### 触发方式

```bash
# 手动触发
> SAVE      # 阻塞式保存，不推荐
> BGSAVE    # 后台保存，推荐

# 自动触发（配置文件）
save 900 1      # 900 秒内至少 1 个 key 变化
save 300 10     # 300 秒内至少 10 个 key 变化
save 60 10000   # 60 秒内至少 10000 个 key 变化
```

### 配置示例

```conf
# redis.conf

# RDB 文件名
dbfilename dump.rdb

# RDB 文件目录
dir /var/lib/redis

# 压缩
rdbcompression yes

# 校验和
rdbchecksum yes

# 停止时加载 RDB
stop-writes-on-bgsave-error yes
```

### 工作原理

```
1. Redis 父进程 fork 出一个子进程
2. 子进程将内存数据写入临时 RDB 文件
3. 写入完成后，替换旧的 RDB 文件
```

### 优缺点

| 优点 | 缺点 |
| --- | --- |
| 文件紧凑，适合备份 | 可能丢失最后一次快照后的数据 |
| 恢复速度快 | fork 过程可能阻塞 |
| 对性能影响小 | 数据量大时 fork 耗时长 |

---

## 6.3 AOF 持久化

### 概念解释

AOF（Append Only File）记录每次写操作，重启时重放这些命令恢复数据。

打个比方：

> AOF 就像记账本：每次花钱都记下来，如果账本丢了，可以从头到尾重新算一遍。

### 配置示例

```conf
# redis.conf

# 开启 AOF
appendonly yes

# AOF 文件名
appendfilename "appendonly.aof"

# 同步策略
appendfsync everysec  # 每秒同步（推荐）
# appendfsync always   # 每次写都同步（最安全，但慢）
# appendfsync no       # 不同步（最快，但可能丢失数据）

# AOF 重写
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# 混合持久化（Redis 4.0+）
aof-use-rdb-preamble yes
```

### 同步策略对比

| 策略 | 说明 | 性能 | 安全性 |
| --- | --- | --- | --- |
| **always** | 每次写操作都同步 | 慢 | 最高 |
| **everysec** | 每秒同步一次 | 中等 | 高 |
| **no** | 由操作系统决定 | 快 | 低 |

### AOF 重写

```bash
# 手动触发 AOF 重写
> BGREWRITEAOF

# AOF 重写过程
1.  fork 子进程
2.  将内存数据转换为 AOF 命令
3.  替换旧的 AOF 文件
```

### 优缺点

| 优点 | 缺点 |
| --- | --- |
| 数据完整性高 | 文件较大 |
| 可配置同步策略 | 恢复速度较慢 |
| 支持重写压缩 | 写入性能受影响 |

---

## 6.4 混合持久化

### 概念解释

混合持久化是 Redis 4.0 引入的特性，结合了 RDB 和 AOF 的优点。

打个比方：

> 混合持久化就像先拍照（RDB），再把之后的变化记在账本上（AOF）。恢复时先加载照片，再补上账本上的变化。

### 配置

```conf
# 开启混合持久化
aof-use-rdb-preamble yes
```

### 工作原理

```
AOF 重写时：
1. 将内存数据以 RDB 格式写入 AOF 文件开头
2. 将重写期间的增量命令以 AOF 格式追加到文件末尾
```

### 优势

- 恢复速度快（RDB 部分）
- 数据完整性高（AOF 部分）
- 文件紧凑（RDB 压缩）

---

## 6.5 持久化策略选择

### 场景建议

| 场景 | 推荐方案 | 理由 |
| --- | --- | --- |
| **纯缓存** | 不开启持久化 | 重启后从数据库加载 |
| **一般应用** | RDB + AOF 混合 | 平衡性能和安全性 |
| **高安全要求** | AOF everysec | 数据丢失最少 |
| **备份归档** | RDB | 文件紧凑，便于传输 |

### 配置示例

```conf
# 推荐配置（混合持久化）

# RDB 配置
save 900 1
save 300 10
save 60 10000
dbfilename dump.rdb

# AOF 配置
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# 混合持久化
aof-use-rdb-preamble yes
```

---

## 6.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **RDB** | 定时快照，文件紧凑，恢复快 |
| **AOF** | 记录写操作，数据完整，文件大 |
| **混合持久化** | RDB + AOF，兼顾速度和安全性 |
| **选择建议** | 根据场景选择合适的持久化方式 |

---

## 6.7 新手常见误区

### 误区 1："开启持久化就万无一失了"

**错！** 持久化不能保证 100% 不丢数据。RDB 可能丢失最后一次快照后的数据，AOF everysec 可能丢失 1 秒内的数据。重要数据应该多副本备份。

### 误区 2："AOF always 最安全，应该总是用它"

**不一定！** AOF always 每次写操作都要同步磁盘，性能很差。生产环境推荐 everysec，每秒同步一次，最多丢失 1 秒数据，性能提升明显。

### 误区 3："RDB 和 AOF 不能同时开启"

**不对！** Redis 支持同时开启 RDB 和 AOF，而且推荐这样做。重启时优先使用 AOF 恢复数据，因为 AOF 更完整。

### 误区 4："持久化会影响性能，应该关闭"

**不推荐！** 关闭持久化意味着重启后数据全部丢失。合理配置持久化策略，性能影响可以控制在可接受范围内。

---

## 6.8 动手练习

### 练习 1：RDB 持久化

完成以下操作：
1. 配置 RDB 自动保存策略
2. 手动触发 BGSAVE
3. 查看 RDB 文件

<details>
<summary>点击查看答案</summary>

```bash
# 1. 配置 RDB（redis.conf）
save 900 1
save 300 10
save 60 10000
dbfilename dump.rdb
dir /var/lib/redis

# 2. 手动触发 BGSAVE
> BGSAVE
Background saving started

# 3. 查看 RDB 文件
$ ls -lh /var/lib/redis/dump.rdb
-rw-r--r-- 1 redis redis 1.2M Jan 1 12:00 dump.rdb
```

</details>

### 练习 2：AOF 持久化

完成以下操作：
1. 开启 AOF 持久化
2. 设置同步策略为 everysec
3. 手动触发 AOF 重写

<details>
<summary>点击查看答案</summary>

```bash
# 1. 开启 AOF（redis.conf）
appendonly yes
appendfilename "appendonly.aof"

# 2. 设置同步策略
appendfsync everysec

# 3. 手动触发 AOF 重写
> BGREWRITEAOF
Background append only file rewriting started

# 查看 AOF 文件
$ ls -lh /var/lib/redis/appendonly.aof
-rw-r--r-- 1 redis redis 2.5M Jan 1 12:00 appendonly.aof
```

</details>

### 练习 3（挑战）：混合持久化

配置混合持久化，并验证其效果：
1. 开启混合持久化
2. 写入一些数据
3. 触发 AOF 重写
4. 查看 AOF 文件格式

<details>
<summary>点击查看答案</summary>

```bash
# 1. 配置混合持久化（redis.conf）
appendonly yes
aof-use-rdb-preamble yes

# 2. 写入数据
> SET user:1 "Alice"
OK
> SET user:2 "Bob"
OK

# 3. 触发 AOF 重写
> BGREWRITEAOF
Background append only file rewriting started

# 4. 查看 AOF 文件（前几行是 RDB 格式）
$ head -c 100 /var/lib/redis/appendonly.aof | xxd
00000000: 5245 4449 5330 3031 31fe 00fa 0900 0000  REDIS0011.......
# 看到 REDIS 开头说明是混合格式
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 主从复制**——也就是如何将数据从主节点复制到一个或多个从节点。你会学到主从架构的原理、配置方法、复制流程和故障转移机制。
