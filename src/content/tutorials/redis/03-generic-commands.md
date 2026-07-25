---
title: "第3章：Redis 通用命令"
description: "键操作、数据库管理、服务器管理命令"
---

# 第3章：Redis 通用命令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 有哪些通用的键操作命令？
- 如何管理多个数据库？
- 怎么查看 Redis 服务器状态？
- 如何批量操作键？
- 这些命令在实际项目中怎么用？

这一章会详细讲解 Redis 的通用命令，包括键操作、数据库管理和服务器管理，帮你掌握日常使用 Redis 的基础技能。

---

## 3.1 为什么需要通用命令？

### 痛点分析

想象一下，你在使用 Redis 存储各种数据，但遇到这些问题：

- 想查看所有键，但键太多，不知道有哪些
- 想删除某个类型的键，但不知道键名
- 想切换数据库，不知道怎么操作
- 想了解服务器状态，但不知道用什么命令

### 解决方案

Redis 提供了一套通用命令，适用于所有数据类型。掌握这些命令，你可以：

- 灵活管理键（查看、删除、重命名、设置过期时间）
- 管理多个数据库（切换、清空、查看键数量）
- 监控服务器状态（信息、配置、性能）

---

## 3.2 键操作命令

### 查看所有键

```bash
# 查看所有键
> KEYS *
1) "user:1:name"
2) "user:1:age"
3) "product:1001"
4) "order:2001"

# 使用模式匹配
> KEYS user:*
1) "user:1:name"
2) "user:1:age"

> KEYS user:1:*
1) "user:1:name"
2) "user:1:age"

# ⚠️ 注意：KEYS 命令会遍历所有键，生产环境慎用
# 推荐用 SCAN 代替
```

### 使用 SCAN 遍历

```bash
# SCAN 命令（游标遍历）
> SCAN 0
1) "17"  # 下一个游标
2) 1) "user:1:name"
   2) "user:1:age"

# 继续遍历
> SCAN 17
1) "0"  # 游标为 0 表示遍历完成
2) 1) "product:1001"
   2) "order:2001"

# 带模式匹配
> SCAN 0 MATCH user:* COUNT 10
1) "5"
2) 1) "user:1:name"
   2) "user:1:age"

# 遍历指定类型的键
> SCAN 0 TYPE string
1) "10"
2) 1) "name"
   2) "counter"
```

### 键是否存在

```bash
# 检查单个键
> EXISTS user:1:name
(integer) 1

# 检查多个键（Redis 3.0.3+）
> EXISTS user:1:name user:1:age user:999:name
(integer) 2  # 返回存在的键数量
```

### 删除键

```bash
# 删除单个键
> DEL user:1:name
(integer) 1

# 删除多个键
> DEL user:1:name user:1:age product:1001
(integer) 3

# 异步删除（Redis 4.0+，推荐）
> UNLINK user:1:name
(integer) 1

# 删除所有键（慎用）
> FLUSHDB  # 清空当前数据库
OK
> FLUSHALL  # 清空所有数据库
OK

# 异步清空（Redis 4.0+）
> FLUSHDB ASYNC
OK
```

### 重命名键

```bash
# 重命名
> RENAME old:key new:key
OK

# 只有当新键不存在时才重命名
> RENAMENX temp:user:1 user:1
(integer) 1

# ⚠️ 注意：如果新键已存在，RENAME 会覆盖它
```

### 查看键类型

```bash
# 查看键的数据类型
> TYPE user:1:name
string

> TYPE user:1
hash

> TYPE task:queue
list

> TYPE tags
set

> TYPE leaderboard
zset
```

### 设置过期时间

```bash
# 设置过期时间（秒）
> EXPIRE user:1:name 3600
(integer) 1

# 设置过期时间（毫秒）
> PEXPIRE user:1:name 3600000
(integer) 1

# 设置过期时间点（Unix 时间戳，秒）
> EXPIREAT user:1:name 1700000000
(integer) 1

# 设置过期时间点（Unix 时间戳，毫秒）
> PEXPIREAT user:1:name 1700000000000
(integer) 1

# 移除过期时间（永久保存）
> PERSIST user:1:name
(integer) 1

# 查看剩余时间（秒）
> TTL user:1:name
(integer) 3595

# 查看剩余时间（毫秒）
> PTTL user:1:name
(integer) 3595000

# 设置键时同时设置过期时间
> SET code "123456" EX 60  # 60 秒
OK
> SET code "123456" PX 60000  # 60000 毫秒
OK
```

### 键的迁移

```bash
# 移动键到另一个数据库
> MOVE user:1:name 1
(integer) 1

# 移动键到另一个 Redis 实例（需要 MIGRATE 命令）
> MIGRATE 192.168.1.100 6379 user:1:name 1 5000
OK
```

---

## 3.3 数据库管理命令

### 切换数据库

```bash
# Redis 默认有 16 个数据库（0-15）
# 切换到数据库 1
> SELECT 1
OK

# 查看当前数据库
> CLIENT INFO
... db=1 ...

# 切换回数据库 0
> SELECT 0
OK
```

### 查看数据库信息

```bash
# 查看当前数据库的键数量
> DBSIZE
(integer) 42

# 查看数据库统计信息
> INFO keyspace
# Keyspace
db0:keys=42,expires=5,avg_ttl=3600000
db1:keys=10,expires=2,avg_ttl=1800000
```

### 清空数据库

```bash
# 清空当前数据库
> FLUSHDB
OK

# 清空所有数据库
> FLUSHALL
OK

# 异步清空（不阻塞主线程）
> FLUSHDB ASYNC
OK
> FLUSHALL ASYNC
OK
```

---

## 3.4 服务器管理命令

### 查看服务器信息

```bash
# 查看所有信息
> INFO

# 查看特定部分
> INFO server      # 服务器信息
> INFO clients     # 客户端连接
> INFO memory      # 内存使用
> INFO persistence # 持久化统计
> INFO stats       # 通用统计
> INFO replication # 复制信息
> INFO keyspace    # 数据库统计

# 示例：查看内存信息
> INFO memory
# Memory
used_memory:1048576
used_memory_human:1.00M
used_memory_rss:2097152
used_memory_rss_human:2.00M
```

### 查看配置

```bash
# 查看所有配置
> CONFIG GET *

# 查看特定配置
> CONFIG GET maxmemory
1) "maxmemory"
2) "2147483648"

> CONFIG GET bind
1) "bind"
2) "127.0.0.1"

# 动态修改配置
> CONFIG SET maxmemory 3221225472
OK

# 保存配置到文件
> CONFIG REWRITE
OK
```

### 查看客户端连接

```bash
# 查看所有客户端连接
> CLIENT LIST
id=1 addr=127.0.0.1:6379 fd=5 name= db=0 ...
id=2 addr=127.0.0.1:6380 fd=6 name= db=0 ...

# 设置当前客户端名称
> CLIENT SETNAME my-client
OK

# 获取当前客户端名称
> CLIENT GETNAME
"my-client"

# 关闭指定客户端
> CLIENT KILL 127.0.0.1:6380
OK
```

### 慢查询日志

```bash
# 查看慢查询配置
> CONFIG GET slowlog-log-slower-than
1) "slowlog-log-slower-than"
2) "10000"  # 10 毫秒

> CONFIG GET slowlog-max-len
1) "slowlog-max-len"
2) "128"

# 查看慢查询日志
> SLOWLOG GET
1) 1) (integer) 5
   2) (integer) 1600000000
   3) (integer) 15000
   4) 1) "KEYS"
      2) "*"
   5) "127.0.0.1:6379"
   6) ""

# 查看慢查询数量
> SLOWLOG LEN
(integer) 5

# 重置慢查询日志
> SLOWLOG RESET
OK
```

### 监控命令执行

```bash
# 实时监控所有命令
> MONITOR
OK
1600000000.123456 [0 127.0.0.1:6379] "GET" "user:1:name"
1600000001.234567 [0 127.0.0.1:6379] "SET" "counter" "1"

# ⚠️ 注意：MONITOR 会影响性能，生产环境慎用
# 按 Ctrl+C 停止监控
```

### 服务器控制

```bash
# 保存数据到磁盘
> SAVE      # 阻塞保存
OK
> BGSAVE    # 后台保存
Background saving started

# 关闭服务器
> SHUTDOWN        # 正常关闭
> SHUTDOWN SAVE   # 保存后关闭
> SHUTDOWN NOSAVE # 不保存直接关闭

# 重启服务器
> DEBUG RESTART
```

---

## 3.5 批量操作命令

### MGET/MSET

```bash
# 同时设置多个键值对
> MSET key1 "value1" key2 "value2" key3 "value3"
OK

# 同时获取多个值
> MGET key1 key2 key3
1) "value1"
2) "value2"
3) "value3"

# 只有当所有键都不存在时才设置
> MSETNX key4 "value4" key5 "value5"
(integer) 1
```

### Pipeline（管道）

```bash
# 使用 Pipeline 批量执行命令
> redis-cli
> MULTI
OK
> SET key1 value1
QUEUED
> SET key2 value2
QUEUED
> GET key1
QUEUED
> EXEC
1) OK
2) OK
3) "value1"

# 在代码中使用 Pipeline（Java 示例）
```java
List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
    for (int i = 0; i < 100; i++) {
        connection.set(("key" + i).getBytes(), ("value" + i).getBytes());
    }
    return null;
});
```

---

## 3.6 核心知识点总结

| 命令类型 | 常用命令 | 说明 |
| --- | --- | --- |
| **键操作** | KEYS, SCAN, EXISTS, DEL, RENAME, TYPE | 查看、删除、重命名、类型检查 |
| **过期时间** | EXPIRE, TTL, PERSIST | 设置和查看过期时间 |
| **数据库** | SELECT, DBSIZE, FLUSHDB, FLUSHALL | 切换、清空数据库 |
| **服务器** | INFO, CONFIG, CLIENT, SLOWLOG | 查看信息、配置、客户端、慢查询 |
| **批量操作** | MGET, MSET, Pipeline | 批量读写 |

---

## 3.7 新手常见误区

### 误区 1："生产环境可以用 KEYS * 查看所有键"

**错！** KEYS 命令会遍历所有键，时间复杂度 O(N)，会阻塞 Redis。生产环境应该用 SCAN 命令代替，它是增量遍历，不会阻塞。

### 误区 2："DEL 和 UNLINK 没有区别"

**不对！** DEL 是同步删除，会阻塞主线程；UNLINK 是异步删除（Redis 4.0+），在后台线程删除，不会阻塞。删除大键时推荐用 UNLINK。

### 误区 3："FLUSHDB 和 FLUSHALL 可以随便用"

**危险！** 这两个命令会清空数据，生产环境必须谨慎使用。建议：
- 设置密码保护
- 禁用或重命名危险命令
- 使用 ACL 控制权限

### 误区 4："过期时间只能在设置键时指定"

**不是的。** 可以用 EXPIRE、PEXPIRE 等命令随时为已存在的键设置过期时间，也可以用 PERSIST 移除过期时间。

---

## 3.8 动手练习

### 练习 1：键操作

完成以下操作：
1. 设置 3 个键：user:1、user:2、user:3
2. 查看所有 user:* 的键
3. 检查 user:2 是否存在
4. 删除 user:2
5. 将 user:3 重命名为 user:2

<details>
<summary>点击查看答案</summary>

```bash
# 1. 设置键
> SET user:1 "Alice"
OK
> SET user:2 "Bob"
OK
> SET user:3 "Charlie"
OK

# 2. 查看所有 user:* 的键
> KEYS user:*
1) "user:1"
2) "user:2"
3) "user:3"

# 3. 检查 user:2 是否存在
> EXISTS user:2
(integer) 1

# 4. 删除 user:2
> DEL user:2
(integer) 1

# 5. 重命名
> RENAME user:3 user:2
OK
> GET user:2
"Charlie"
```

</details>

### 练习 2：过期时间管理

完成以下操作：
1. 设置一个验证码，过期时间 60 秒
2. 查看剩余时间
3. 移除过期时间
4. 再次设置过期时间为 30 秒

<details>
<summary>点击查看答案</summary>

```bash
# 1. 设置验证码
> SET verify:code "888888" EX 60
OK

# 2. 查看剩余时间
> TTL verify:code
(integer) 58

# 3. 移除过期时间
> PERSIST verify:code
(integer) 1
> TTL verify:code
(integer) -1  # -1 表示永不过期

# 4. 重新设置过期时间
> EXPIRE verify:code 30
(integer) 1
> TTL verify:code
(integer) 28
```

</details>

### 练习 3（挑战）：服务器监控

完成以下操作：
1. 查看 Redis 内存使用情况
2. 查看当前连接的客户端数量
3. 查看慢查询日志配置
4. 修改慢查询阈值为 5 毫秒

<details>
<summary>点击查看答案</summary>

```bash
# 1. 查看内存使用
> INFO memory
# Memory
used_memory:1048576
used_memory_human:1.00M
...

# 2. 查看客户端连接
> INFO clients
# Clients
connected_clients:5
...

# 3. 查看慢查询配置
> CONFIG GET slowlog-log-slower-than
1) "slowlog-log-slower-than"
2) "10000"

# 4. 修改慢查询阈值
> CONFIG SET slowlog-log-slower-than 5000
OK
> CONFIG GET slowlog-log-slower-than
1) "slowlog-log-slower-than"
2) "5000"
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 的高级数据类型**——也就是 Bitmap、HyperLogLog、Geospatial、Stream 等特殊类型。你会学到这些类型的特点和应用场景，掌握它们在特定问题上的优势。
