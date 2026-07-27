---
title: "第10章：Redis 内存管理"
description: "内存分配策略、内存淘汰策略、内存优化技巧"
---

# 第10章：Redis 内存管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 内存不够用了怎么办？
- Redis 有哪些内存淘汰策略？
- 如何优化 Redis 内存使用？
- 怎么监控 Redis 内存使用情况？
- 内存碎片是什么？怎么处理？

这一章会详细讲解 Redis 的内存管理机制，帮你掌握如何高效使用 Redis 内存。

---

## 1 为什么需要内存管理？

### 痛点分析

Redis 是内存数据库，所有数据都存储在内存中。如果不合理管理内存，会面临这些问题：

- **内存耗尽**：数据量超过物理内存，系统开始使用交换分区，性能急剧下降
- **内存碎片**：频繁删除数据导致内存碎片，浪费内存空间
- **OOM 崩溃**：内存不足时 Redis 可能崩溃

### 解决方案

Redis 提供了完善的内存管理机制：

| 机制 | 说明 |
| --- | --- |
| **内存限制** | 设置最大内存使用量 |
| **淘汰策略** | 内存不足时自动删除数据 |
| **内存优化** | 优化数据结构，减少内存占用 |
| **内存监控** | 实时监控内存使用情况 |

---

## 2 内存分配策略

### Redis 内存分配

Redis 使用两种内存分配器：

| 分配器 | 特点 | 适用场景 |
| --- | --- | --- |
| **jemalloc** | 内存碎片少，性能好 | Linux 系统（默认） |
| **libc malloc** | 系统默认分配器 | 其他系统 |

```bash
# 查看使用的内存分配器
> INFO memory
# Memory
mem_allocator:jemalloc-5.1.0
```

### 内存分配原理

```
Redis 内存分配流程：
1. 应用层请求内存
2. Redis 向操作系统申请内存块
3. 内存分配器管理内存块
4. 分配给应用层使用
```

---

## 3 内存淘汰策略

### 配置最大内存

```conf
# redis.conf

# 设置最大内存
maxmemory 2gb

# 设置内存单位
# maxmemory 2gb
# maxmemory 2048mb
# maxmemory 2147483648  # 字节
```

### 淘汰策略类型

| 策略 | 说明 | 适用场景 |
| --- | --- | --- |
| **noeviction** | 不淘汰，内存满时返回错误 | 不允许丢失数据 |
| **allkeys-lru** | 淘汰最近最少使用的键 | 通用缓存 |
| **volatile-lru** | 只淘汰设置了过期时间的键 | 部分数据有 TTL |
| **allkeys-lfu** | 淘汰最不经常使用的键 | 热点数据缓存 |
| **volatile-lfu** | 只淘汰设置了过期时间的最不常用键 | 部分数据有 TTL |
| **allkeys-random** | 随机淘汰 | 无特定访问模式 |
| **volatile-random** | 只随机淘汰设置了过期时间的键 | 部分数据有 TTL |
| **volatile-ttl** | 淘汰剩余 TTL 最短的键 | 需要快速清理过期数据 |

### 配置淘汰策略

```conf
# redis.conf

# 设置淘汰策略
maxmemory-policy allkeys-lru

# LRU 精度（Redis 3.0+）
maxmemory-samples 5
```

### LRU vs LFU

```bash
# LRU（Least Recently Used）
# 淘汰最近最少使用的数据
# 适合：访问模式有明显时间局部性

# LFU（Least Frequently Used）
# 淘汰最不经常使用的数据
# 适合：访问模式有明显频率局部性

# 配置示例
> CONFIG SET maxmemory-policy allkeys-lfu
OK
> CONFIG SET maxmemory-samples 10
OK
```

---

## 4 内存优化技巧

### 使用合适的数据结构

| 场景 | 不推荐 | 推荐 | 节省内存 |
| --- | --- | --- | --- |
| 存储对象 | String（JSON） | Hash | 30-50% |
| 存储小整数 | String | int 编码 | 70% |
| 存储小集合 | Set/List/Hash | 特殊编码 | 50-80% |

### 特殊编码优化

```bash
# Hash 优化
# 当元素数量少且值短时，使用 ziplist 编码
> CONFIG SET hash-max-ziplist-entries 512
> CONFIG SET hash-max-ziplist-value 64

# List 优化
# 使用 quicklist 编码
> CONFIG SET list-max-ziplist-size -2

# Set 优化
# 当元素都是整数或短字符串时，使用 intset 或 ziplist
> CONFIG SET set-max-intset-entries 512

# ZSet 优化
# 使用 ziplist 编码
> CONFIG SET zset-max-ziplist-entries 128
> CONFIG SET zset-max-ziplist-value 64
```

### 内存分配示例

```bash
# 查看内存使用详情
> INFO memory
# Memory
used_memory:1048576          # 已使用内存（字节）
used_memory_human:1.00M      # 人类可读格式
used_memory_rss:2097152      # 操作系统分配的内存
used_memory_rss_human:2.00M
used_memory_peak:1572864     # 内存使用峰值
used_memory_peak_human:1.50M
used_memory_lua:37888        # Lua 脚本使用的内存
mem_fragmentation_ratio:2.0  # 内存碎片率
mem_allocator:jemalloc-5.1.0 # 内存分配器
```

---

## 5 内存碎片处理

### 什么是内存碎片

```
内存碎片 = used_memory_rss / used_memory

碎片率 > 1.5：内存碎片严重
碎片率 < 1：可能使用了交换分区
```

### 处理内存碎片

```bash
# 方法 1：重启 Redis（最彻底）
$ redis-cli shutdown
$ redis-server redis.conf

# 方法 2：内存清理（Redis 4.0+）
> CONFIG SET activedefrag yes
OK

# 方法 3：使用 jemalloc 的内存清理
> CONFIG SET jemalloc-bg-thread yes
OK
```

---

## 6 内存监控

### 实时监控

```bash
# 查看内存使用
> INFO memory

# 查看内存统计
> INFO stats
# Stats
total_connections_received:100
total_commands_processed:10000
instantaneous_ops_per_sec:50
...

# 查看慢查询
> SLOWLOG GET 10
```

### 监控工具

| 工具 | 说明 |
| --- | --- |
| **redis-cli --stat** | 命令行实时监控 |
| **redis-benchmark** | 性能测试工具 |
| **RedisInsight** | 官方图形化监控 |
| **Prometheus + Grafana** | 专业监控方案 |

```bash
# 使用 redis-cli 实时监控
$ redis-cli --stat
------- data ------ --------------------- load -------------------- - child -
keys       mem      clients blocked requests            connections children
10         1.00M    1       0       100                 100         0
10         1.00M    1       0       150                 101         0
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **内存限制** | maxmemory 设置最大内存 |
| **淘汰策略** | 8 种策略，根据场景选择 |
| **内存优化** | 使用合适的数据结构和编码 |
| **内存碎片** | 碎片率 > 1.5 需要处理 |
| **内存监控** | INFO memory、实时监控工具 |

---

## 8 新手常见误区

### 误区 1："内存越大越好，不设限制"

**错！** 不设限制会导致 Redis 占用所有可用内存，影响其他进程，甚至导致系统崩溃。一定要设置合理的 maxmemory。

### 误区 2："LRU 策略总是最好的"

**不一定！** LRU 适合有时间局部性的场景，但如果某些数据访问频率很高但最近没访问，LFU 可能更合适。需要根据业务场景选择。

### 误区 3："内存碎片不影响性能"

**不对！** 内存碎片会浪费内存空间，导致实际可用内存减少。碎片率过高时应该处理。

### 误区 4："小数据用 String 存储没问题"

**不推荐！** 小数据用 String 存储会浪费内存。比如存储一个整数，String 需要几十字节，而 Redis 内部编码只需要 8 字节。应该让 Redis 自动选择最优编码。

---

## 9 动手练习

### 练习 1：配置内存限制

完成以下操作：
1. 设置最大内存为 1GB
2. 设置淘汰策略为 allkeys-lru
3. 查看内存使用情况

<details>
<summary>点击查看答案</summary>

```bash
# 1. 设置最大内存
> CONFIG SET maxmemory 1gb
OK

# 2. 设置淘汰策略
> CONFIG SET maxmemory-policy allkeys-lru
OK

# 3. 查看内存使用
> INFO memory
# Memory
used_memory:1048576
used_memory_human:1.00M
...

# 验证配置
> CONFIG GET maxmemory
1) "maxmemory"
2) "1073741824"

> CONFIG GET maxmemory-policy
1) "maxmemory-policy"
2) "allkeys-lru"
```

</details>

### 练习 2：内存优化

优化以下数据的内存使用：
1. 存储 1000 个用户信息（姓名、年龄、邮箱）
2. 比较 String 和 Hash 的内存占用

<details>
<summary>点击查看答案</summary>

```bash
# 不推荐：用 String 存储 JSON
> SET user:1 '{"name":"Alice","age":25,"email":"alice@example.com"}'
OK

# 推荐：用 Hash 存储
> HSET user:1 name "Alice" age 25 email "alice@example.com"
(integer) 3

# 查看内存占用
> DEBUG OBJECT user:1
# 比较两种方式的 serialized 大小

# 批量创建用户（Hash 方式）
for i in {1..1000}; do
  redis-cli HSET user:$i name "User$i" age $((20+i%50)) email "user$i@example.com"
done

# 查看内存使用
> INFO memory
```

</details>

### 练习 3（挑战）：内存监控

实现一个简单的内存监控脚本：
1. 每秒采集一次内存使用数据
2. 记录到日志文件
3. 内存超过阈值时告警

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# monitor-redis-memory.sh

THRESHOLD=80  # 内存使用阈值（百分比）
LOG_FILE="/var/log/redis-memory.log"

while true; do
    # 获取内存使用信息
    USED=$(redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '[:space:]')
    MAX=$(redis-cli CONFIG GET maxmemory | tail -1)
    
    # 计算使用百分比
    USED_BYTES=$(redis-cli INFO memory | grep used_memory: | cut -d: -f2 | tr -d '[:space:]')
    PERCENT=$((USED_BYTES * 100 / MAX))
    
    # 记录日志
    echo "$(date '+%Y-%m-%d %H:%M:%S') Memory: $USED / $MAX ($PERCENT%)" >> $LOG_FILE
    
    # 告警
    if [ $PERCENT -gt $THRESHOLD ]; then
        echo "ALERT: Redis memory usage is $PERCENT%!" | mail -s "Redis Alert" admin@example.com
    fi
    
    sleep 1
done
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 缓存设计模式**——也就是如何在应用中合理使用 Redis 缓存。你会学到 Cache Aside、Read/Write Through、Write Behind 等经典模式，掌握如何设计高效的缓存架构。
