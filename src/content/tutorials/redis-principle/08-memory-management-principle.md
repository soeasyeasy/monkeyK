---
title: "第8章：内存管理原理"
description: "内存分配器 jemalloc、内存碎片产生与治理、过期删除与内存淘汰策略底层实现"
---

# 第8章：内存管理原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 为什么选择 jemalloc 作为内存分配器？
- 内存碎片是怎么产生的？如何治理？
- Redis 是如何删除过期键的？惰性删除和定期删除有什么区别？
- 内存淘汰策略有哪些？底层是怎么实现的？

这一章就是为了解答这些问题。我们会深入 **内存管理的底层原理**，搞清楚 **jemalloc 的工作机制**，弄明白 **过期删除与内存淘汰策略**。

---

## 1 为什么需要内存管理？

### 痛点分析

Redis 是内存数据库，内存管理直接影响性能：

```
// 内存管理的问题
1. 内存分配效率低 → 性能下降
2. 内存碎片多 → 浪费内存
3. 内存不足 → 需要淘汰数据

// 需要高效的内存管理机制
```

### 解决方案

Redis 使用 **jemalloc** 作为默认内存分配器：

| 分配器 | 特点 | 说明 |
|--------|------|------|
| libc malloc | 通用 | Linux 默认，但性能一般 |
| jemalloc | 高性能 | FreeBSD 开发，Redis 默认 |
| tcmalloc | 高性能 | Google 开发，性能好但碎片多 |

---

## 2 jemalloc 内存分配器

### 2.1 设计思想

```
// jemalloc 的设计思想
1. 多线程友好：每个线程有独立的内存池
2. 减少碎片：使用大小类别管理内存
3. 高性能：无锁分配，减少竞争

// 内存分类
- 小内存：< 4KB
- 中内存：4KB - 1MB
- 大内存：> 1MB
```

### 2.2 内存分配流程

```
// jemalloc 的内存分配流程
1. 请求分配内存
   ↓
2. 根据大小选择类别
   ↓
3. 从对应的内存池分配
   ↓
4. 返回内存地址

// 内存池结构
Arena（内存域）
├── Chunk（内存块，4MB）
│   ├── Region（小内存区域）
│   └── Run（连续内存）
```

打个比方：

> jemalloc 就像"图书馆的书架"——不同大小的书放在不同大小的书架上。小书放在小书架，大书放在大书架。这样找书快，放书也快，不会浪费空间。

### 2.3 配置与使用

```bash
# redis.conf 配置
# 默认使用 jemalloc
# 可以通过编译时指定其他分配器

# 查看内存分配器
INFO memory
# mem_allocator: jemalloc-5.2.1
```

---

## 3 内存碎片

### 3.1 碎片产生原因

```
// 内存碎片的产生
1. 频繁分配释放：小块内存不断分配释放
2. 大小不一：不同大小的对象混在一起
3. 分配器特性：jemalloc 为了性能，会预留空间

// 碎片率计算
碎片率 = 实际使用内存 / Redis 申请内存
// 正常范围：1.0 - 1.5
// > 1.5：碎片严重
// < 1.0：使用 swap，性能下降
```

### 3.2 碎片治理

```bash
# 方法 1：重启 Redis（最简单）
# 缺点：服务中断

# 方法 2：自动碎片整理（Redis 4.0+）
CONFIG SET activedefrag yes

# 方法 3：手动碎片整理
MEMORY PURGE

// 碎片整理原理：
// 1. 找到碎片严重的内存页
// 2. 将数据迁移到新的内存页
// 3. 释放旧的内存页
```

### 3.3 碎片整理配置

```bash
# redis.conf 配置
activedefrag yes              # 开启自动碎片整理
active-defrag-enabled yes     # 开启碎片整理
active-defrag-threshold-lower 10   # 碎片率超过 10% 开始整理
active-defrag-threshold-upper 100  # 碎片率超过 100% 全力整理
active-defrag-cycle-min 5        # 最小 CPU 占用 5%
active-defrag-cycle-max 75       # 最大 CPU 占用 75%
```

---

## 4 过期键删除

### 4.1 过期字典

```c
// 过期字典的结构
typedef struct redisDb {
    dict *dict;         // 键空间
    dict *expires;      // 过期字典
    // ...
} redisDb;

// 过期字典的键 → 指向键空间的键
// 过期字典的值 → 过期时间（毫秒时间戳）

// 示例
键空间：{ "name" → "Alice", "age" → 20 }
过期字典：{ "name" → 1609459200000 }  // name 在 2021-01-01 过期
```

### 4.2 惰性删除

```c
// 惰性删除：访问键时检查是否过期
int dbExpiredKeyDeleted(redisDb *db, robj *key) {
    // 1. 检查过期字典
    mstime_t expire = getExpire(db, key);
    
    // 2. 检查是否过期
    if (expire != -1 && mstime() > expire) {
        // 3. 删除键
        dbDelete(db, key);
        return 1;
    }
    
    return 0;
}
```

### 4.3 定期删除

```c
// 定期删除：定时检查过期键
void activeExpireCycle(int type) {
    // 每次检查的数据库数量
    int dbs_per_call = CRON_DBS_PER_CALL;
    
    // 遍历数据库
    for (int j = 0; j < dbs_per_call; j++) {
        redisDb *db = server.db + (server.dbnum * j / dbs_per_call);
        
        // 检查过期键
        int num = dictSize(db->expires);
        if (num == 0) continue;
        
        // 随机采样
        int iterations = ACTIVE_EXPIRE_CYCLE_LOOKUPS_PER_LOOP;
        while (iterations-- > 0) {
            dictEntry *de = dictGetRandomKey(db->expires);
            mstime_t expire = dictGetVal(de);
            
            if (mstime() > expire) {
                // 删除过期键
                dbDelete(db, dictGetKey(de));
            }
        }
    }
}
```

打个比方：

> 过期键删除就像"清理冰箱"：
> - 惰性删除：拿东西时检查是否过期（访问时检查）
> - 定期删除：定时检查冰箱里的东西（定时检查）
> - 两者结合，既及时又高效

---

## 5 内存淘汰策略

### 5.1 八种策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| noeviction | 不淘汰，返回错误 | 不允许丢失数据 |
| allkeys-lru | 所有键中淘汰最久未使用 | 缓存场景 |
| allkeys-lfu | 所有键中淘汰最少使用 | 缓存场景 |
| allkeys-random | 所有键中随机淘汰 | 无特殊要求 |
| volatile-lru | 设置了过期时间的键中淘汰最久未使用 | 部分缓存 |
| volatile-lfu | 设置了过期时间的键中淘汰最少使用 | 部分缓存 |
| volatile-random | 设置了过期时间的键中随机淘汰 | 部分缓存 |
| volatile-ttl | 设置了过期时间的键中淘汰剩余时间最短 | TTL 优先 |

### 5.2 LRU 实现

```c
// Redis 的 LRU 是近似算法
// 每次随机采样 N 个键，淘汰最久未使用的

void performEvictions(void) {
    // 1. 随机采样
    for (int j = 0; j < maxmemory_samples; j++) {
        dictEntry *de = dictGetRandomKey(db->dict);
        robj *o = dictGetVal(de);
        
        // 2. 记录 LRU 时间
        if (o->lru < best_lru) {
            best_key = dictGetKey(de);
            best_lru = o->lru;
        }
    }
    
    // 3. 淘汰最久未使用的键
    dbDelete(db, best_key);
}
```

### 5.3 LFU 实现

```c
// LFU（Least Frequently Used）
// 记录键的访问频率，淘汰访问最少的

// 访问频率的更新
void updateLFU(robj *val) {
    // 获取当前频率
    int counter = LFUDecrAndReturn(val);
    
    // 根据时间衰减
    counter = LFULogIncr(counter);
    
    // 更新频率
    val->lru = counter;
}

// LFU 的优势：
// - 考虑访问频率，不是单纯的时间
// - 热门数据不会被误淘汰
```

### 5.4 配置与使用

```bash
# redis.conf 配置
maxmemory 100mb              # 最大内存
maxmemory-policy allkeys-lru # 淘汰策略
maxmemory-samples 5          # LRU 采样数量
```

---

## 6 内存优化

### 6.1 编码优化

```
// 使用更节省内存的编码
// 小数据使用 ziplist/listpack
// 整数使用 int 编码

// 配置
list-max-ziplist-size 10     # 列表使用 ziplist 的最大长度
hash-max-listpack-entries 5  # 哈希使用 listpack 的最大字段数
set-max-intset-entries 5     # 集合使用 intset 的最大元素数
```

### 6.2 对象共享

```
// Redis 预定义了一些共享对象
// 0-9999 的整数对象是共享的

// 示例
SET a 100
SET b 100
// a 和 b 指向同一个对象，节省内存
```

### 6.3 大 Key 治理

```
// 大 Key 的问题
1. 占用内存多
2. 操作耗时长
3. 可能阻塞主线程

// 治理方法
1. 拆分大 Key（大哈希拆成多个小哈希）
2. 异步删除（UNLINK 命令）
3. 定期清理（设置过期时间）
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| jemalloc | 高性能内存分配器，多线程友好 |
| 内存碎片 | 频繁分配释放导致，可通过重启或自动整理治理 |
| 过期删除 | 惰性删除 + 定期删除，结合使用 |
| 内存淘汰 | 8 种策略，LRU/LFU 是近似算法 |
| 内存优化 | 编码优化、对象共享、大 Key 治理 |

---

## 8 新手常见误区

### 误区 1："jemalloc 比 libc malloc 快很多"

**不一定。** jemalloc 的优势在于多线程场景，单线程场景两者差距不大。jemalloc 的主要优势是减少碎片和线程竞争。

### 误区 2："内存碎片率高一定要重启"

**不一定。** Redis 4.0+ 支持自动碎片整理，可以在不重启的情况下治理碎片。重启是最简单的方法，但会导致服务中断。

### 误区 3："LRU 是精确的最近最少使用"

**错！** Redis 的 LRU 是近似算法，每次随机采样 N 个键，从中选择最久未使用的。这样既节省内存，又能达到较好的效果。

---

## 9 动手练习

### 练习 1：基础练习

**题目**：解释 jemalloc 的设计思想，说明它为什么比 libc malloc 好。

<details>
<summary>点击查看答案</summary>

```
jemalloc 设计思想：
1. 多线程友好：每个线程有独立的内存池，减少竞争
2. 减少碎片：使用大小类别管理内存
3. 高性能：无锁分配，减少竞争

比 libc malloc 好的原因：
1. 多线程场景下性能更好
2. 内存碎片更少
3. 内存分配更均匀
```

</details>

### 练习 2：进阶练习

**题目**：解释惰性删除和定期删除的区别，以及它们如何配合工作。

<details>
<summary>点击查看答案</summary>

```
惰性删除：
- 访问键时检查是否过期
- 如果过期，立即删除
- 优点：及时删除
- 缺点：如果键一直不被访问，会一直占用内存

定期删除：
- 定时检查过期键
- 每次随机采样，删除过期的
- 优点：定期清理，释放内存
- 缺点：可能不是最及时的

配合工作：
- 惰性删除保证访问时及时删除
- 定期删除保证不被访问的键也能被清理
- 两者结合，既及时又高效
```

</details>

### 练习 3（挑战）：综合练习

**题目**：分析 Redis 的 LRU 算法，说明为什么使用近似算法而不是精确算法。

<details>
<summary>点击查看答案</summary>

```
Redis LRU 算法：
1. 每次淘汰时，随机采样 N 个键（默认 5）
2. 从中选择最久未使用的键淘汰
3. 不是精确的 LRU，而是近似算法

为什么使用近似算法：
1. 精确 LRU 需要维护一个链表，记录所有键的访问时间
2. 每次访问都要更新链表，开销很大
3. 近似算法只需要记录每个键的访问时间（24 位）
4. 采样数量可以配置，平衡精度和性能
5. 实践证明，近似算法的效果接近精确算法
```

</details>

---

## 下一章预告

下一章我们会学习 **数据库实现原理**——搞清楚 dict 哈希表的实现、渐进式 rehash 的底层原理、expire 过期字典的实现、以及 SCAN 游标迭代的工作原理。
