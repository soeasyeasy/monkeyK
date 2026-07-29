---
title: "第9章：数据库实现原理"
description: "dict 哈希表、rehash 渐进式迁移、expire 过期字典、SCAN 游标迭代原理"
---

# 第9章：数据库实现原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 的数据库是怎么实现的？键值对存在哪里？
- 哈希表是怎么工作的？rehash 是什么？为什么要渐进式迁移？
- 过期键是怎么存储的？惰性删除和定期删除的底层实现是什么？
- SCAN 命令是怎么工作的？为什么不用 KEYS？

这一章就是为了解答这些问题。我们会深入 **数据库的底层实现**，搞清楚 **dict 哈希表与 rehash 机制**，弄明白 **过期字典与 SCAN 迭代原理**。

---

## 1 Redis 数据库结构

### 1.1 核心结构

```c
// Redis 数据库的核心结构
typedef struct redisDb {
    dict *dict;         // 键空间，存储所有键值对
    dict *expires;      // 过期字典，存储键的过期时间
    long long avg_ttl;  // 平均 TTL
    int id;             // 数据库 ID（0-15）
    // ...
} redisDb;

// 服务器结构
struct redisServer {
    redisDb *db;        // 数据库数组
    int dbnum;          // 数据库数量（默认 16）
    // ...
};
```

### 1.2 键空间

```c
// 键空间是一个哈希表
// 键 → 字符串对象
// 值 → redisObject

// 示例
dict: {
    "name" → robj(type=string, encoding=embstr, ptr="Alice"),
    "age" → robj(type=string, encoding=int, ptr=20),
    "hobby" → robj(type=list, encoding=quicklist, ptr=...)
}
```

打个比方：

> Redis 数据库就像一个"大仓库"：
> - dict（键空间）是仓库的货架，存放所有货物（键值对）
> - expires（过期字典）是货物的保质期标签
> - 每个数据库（db）是一个独立的仓库

---

## 2 dict 哈希表

### 2.1 结构定义

```c
// 哈希表节点
typedef struct dictEntry {
    void *key;              // 键
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;                    // 值（联合体，节省空间）
    struct dictEntry *next; // 链式哈希表的下一个节点
} dictEntry;

// 哈希表
typedef struct dictht {
    dictEntry **table;      // 哈希表数组
    unsigned long size;     // 哈希表大小（2 的幂）
    unsigned long sizemask; // 掩码（size - 1）
    unsigned long used;     // 已有节点数
} dictht;

// 字典
typedef struct dict {
    dictType *type;         // 类型特定函数
    void *privdata;         // 私有数据
    dictht ht[2];           // 两个哈希表（rehash 用）
    long rehashidx;         // rehash 进度（-1 表示未进行）
    int iterators;          // 正在迭代的迭代器数
} dict;
```

### 2.2 哈希算法

```c
// 哈希函数
uint64_t dictHashFunction(const void *key, int len) {
    // 使用 MurmurHash 算法
    return murmurHash(key, len, HASH_SEED);
}

// 计算索引
unsigned int dictKeyIndex(dict *d, const void *key) {
    unsigned int hash = dictHashFunction(key, len);
    return hash & d->ht[0].sizemask;  // 使用位运算，更快
}
```

### 2.3 链式哈希

```c
// 解决哈希冲突：链式法
// 同一个索引的节点用链表连接

// 示例
table[0] → entry1 → entry2 → entry3
table[1] → entry4
table[2] → entry5 → entry6
```

打个比方：

> 哈希表就像"图书馆的书架"：
> - table 数组是书架的格子
> - 哈希函数决定书放在哪个格子
> - 如果多个书放在同一个格子，就用链表串起来

---

## 3 渐进式 rehash

### 3.1 为什么需要 rehash？

```c
// 哈希表的负载因子
load_factor = used / size;

// 负载因子过高：
// - 哈希冲突增多
// - 链表变长
// - 查询性能下降

// 需要扩容，重新分配更大的哈希表
```

### 3.2 rehash 触发条件

```c
// rehash 的触发条件
int dictExpand(dict *d, unsigned long size) {
    // 计算新的大小
    unsigned long realsize = _dictNextPower(size);
    
    // 检查是否允许 rehash
    if (dictIsRehashing(d)) return DICT_ERR;
    
    // 分配新的哈希表
    dictht n;
    n.size = realsize;
    n.sizemask = realsize - 1;
    n.table = zcalloc(realsize * sizeof(dictEntry*));
    n.used = 0;
    
    // 设置 rehash 标志
    d->rehashidx = 0;
    d->ht[1] = n;
    
    return DICT_OK;
}

// 扩容条件
// 1. 负载因子 > 1 且没有 BGSAVE/BGREWRITEAOF 执行
// 2. 负载因子 > 5（强制扩容）
```

### 3.3 渐进式 rehash 流程

```c
// 渐进式 rehash 的核心思想
// 不是一次性迁移所有数据，而是每次操作时迁移一部分

// rehash 步骤
// 1. 为 ht[1] 分配空间
// 2. 将 rehashidx 设为 0，开始 rehash
// 3. 每次操作字典时，迁移 ht[0] 的 rehashidx 桶到 ht[1]
// 4. 迁移完成后，交换 ht[0] 和 ht[1]，重置 rehashidx = -1

// 每次操作时触发迁移
dictEntry *dictAdd(dict *d, void *key, void *val) {
    // 如果正在 rehash，迁移一个桶
    if (dictIsRehashing(d)) {
        _dictRehashStep(d);
    }
    
    // 正常添加操作
    // ...
}

// 迁移一个桶
void _dictRehashStep(dict *d) {
    if (d->rehashidx == -1) return;
    
    // 获取 ht[0] 的 rehashidx 桶
    dictEntry *de = d->ht[0].table[d->rehashidx];
    
    // 遍历桶中的所有节点
    while (de) {
        dictEntry *nextde = de->next;
        
        // 计算在 ht[1] 中的索引
        unsigned int hash = dictHashFunction(de->key);
        unsigned int idx = hash & d->ht[1].sizemask;
        
        // 插入到 ht[1]
        de->next = d->ht[1].table[idx];
        d->ht[1].table[idx] = de;
        
        de = nextde;
    }
    
    // 清空 ht[0] 的桶
    d->ht[0].table[d->rehashidx] = NULL;
    
    // 更新 rehashidx
    d->rehashidx++;
    
    // 检查是否完成
    if (d->ht[0].used == 0) {
        // 迁移完成，交换 ht[0] 和 ht[1]
        d->ht[0] = d->ht[1];
        _dictReset(&d->ht[1]);
        d->rehashidx = -1;
    }
}
```

打个比方：

> 渐进式 rehash 就像"搬家"：
> - 不是一次性把所有东西搬完（会阻塞很久）
> - 而是每次出门时顺手带一点（分散到每次操作）
> - 这样不会一次性占用太多资源，也不会阻塞主线程

---

## 4 过期字典

### 4.1 结构定义

```c
// 过期字典的结构
// expires 字典的键 → 指向键空间的键（同一个指针）
// expires 字典的值 → 过期时间（毫秒时间戳）

// 示例
dict: {
    "name" → robj(...),
    "age" → robj(...)
}

expires: {
    "name" → 1609459200000,  // 2021-01-01 00:00:00
    "age" → 1640995200000    // 2022-01-01 00:00:00
}
```

### 4.2 设置过期时间

```c
// 设置键的过期时间
void setExpire(redisDb *db, robj *key, long long when) {
    dictEntry *de;
    
    // 1. 从键空间获取键
    de = dictFind(db->dict, key->ptr);
    serverAssert(de != NULL);
    
    // 2. 在过期字典中设置过期时间
    dictEntry *expire_de = dictAddRaw(db->expires, dictGetKey(de), NULL);
    dictSetSignedIntegerVal(expire_de, when);
}
```

### 4.3 检查过期

```c
// 检查键是否过期
int keyIsExpired(redisDb *db, robj *key) {
    // 1. 获取过期时间
    long long when = getExpire(db, key);
    
    // 2. 没有设置过期时间
    if (when == -1) return 0;
    
    // 3. 检查是否过期
    return mstime() > when;
}

// 访问键时检查过期（惰性删除）
robj *lookupKeyRead(redisDb *db, robj *key) {
    // 检查是否过期
    if (keyIsExpired(db, key)) {
        // 删除过期键
        deleteExpiredKeyAndPropagate(db, key);
        return NULL;
    }
    
    // 返回键值
    return lookupKey(db, key);
}
```

---

## 5 SCAN 游标迭代

### 5.1 为什么需要 SCAN？

```bash
# KEYS 命令的问题
KEYS *
# 遍历整个键空间，阻塞主线程
# 数据量大时，可能导致 Redis 卡死

# SCAN 命令的优势
SCAN 0
# 渐进式迭代，不阻塞主线程
# 每次返回一部分数据
```

### 5.2 SCAN 实现原理

```c
// SCAN 命令的实现
void scanCommand(client *c) {
    unsigned long cursor;
    
    // 1. 解析游标
    if (parseScanCursor(c, c->argv[1], &cursor) == C_ERR) return;
    
    // 2. 迭代字典
    cursor = dictScan(c->db->dict, cursor, scanCallback, NULL, c);
    
    // 3. 返回新的游标
    addReplyArrayLen(c, 2);
    addReplyBulkLongLong(c, cursor);
    addReplyArrayLen(c, keys_count);
}

// 字典迭代
unsigned long dictScan(dict *d, unsigned long v, dictScanFunction *fn, void *privdata) {
    dictht *t0, *t1;
    const dictEntry *de;
    
    // 如果正在 rehash
    if (dictIsRehashing(d)) {
        // 同时迭代 ht[0] 和 ht[1]
        t0 = &d->ht[0];
        t1 = &d->ht[1];
    } else {
        t0 = &d->ht[0];
        t1 = NULL;
    }
    
    // 迭代 ht[0]
    do {
        de = t0->table[v & t0->sizemask];
        while (de) {
            fn(privdata, de);
            de = de->next;
        }
        
        // 使用位反转算法计算下一个游标
        v = rev(v);
        v++;
        v = rev(v);
    } while (v && (v & t0->sizemask) != (cursor & t0->sizemask));
    
    return v;
}
```

### 5.3 位反转算法

```c
// 位反转算法
// 用于计算下一个游标

// 示例（8 位）
cursor = 00000000  // 初始
next = 10000000    // 位反转后加 1，再反转

// 遍历顺序
000 → 100 → 010 → 110 → 001 → 101 → 011 → 111

// 优势：
// - 保证遍历所有桶
// - 即使 rehash 也能继续迭代
```

打个比方：

> SCAN 就像"查字典"：
> - KEYS 是一次性翻完整个字典（阻塞）
> - SCAN 是每次翻几页，记住页码（游标），下次继续翻
> - 这样不会卡住，可以分批处理

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 数据库结构 | redisDb 包含 dict（键空间）和 expires（过期字典） |
| dict 哈希表 | 链式哈希，使用 MurmurHash 算法 |
| 渐进式 rehash | 每次操作迁移一个桶，避免阻塞 |
| 过期字典 | 存储键的过期时间，惰性删除 + 定期删除 |
| SCAN 迭代 | 渐进式迭代，使用位反转算法计算游标 |

---

## 7 新手常见误区

### 误区 1："rehash 会阻塞主线程"

**不完全对。** 渐进式 rehash 将工作分散到每次操作中，不会一次性阻塞。但 rehash 期间，每次操作的开销会增加。

### 误区 2："SCAN 会返回重复的键"

**不一定。** SCAN 在 rehash 期间可能返回重复的键，但不会遗漏。客户端需要自己去重。

### 误区 3："过期键删除是即时的"

**错！** 过期键使用惰性删除和定期删除，不是即时的。只有在访问时或定期扫描时才会删除。

---

## 8 动手练习

### 练习 1：基础练习

**题目**：画出 dict 哈希表的结构，说明链式哈希的工作原理。

<details>
<summary>点击查看答案</summary>

```
dict 哈希表结构：

dict
├── ht[0]（主哈希表）
│   ├── table[]（桶数组）
│   ├── size（大小）
│   ├── sizemask（掩码）
│   └── used（已用数量）
├── ht[1]（rehash 用）
└── rehashidx（rehash 进度）

链式哈希：
table[0] → entry1 → entry2 → entry3
table[1] → entry4
table[2] → entry5 → entry6

工作原理：
1. 使用哈希函数计算键的索引
2. 如果索引位置已有节点，用链表连接
3. 查询时遍历链表，找到匹配的键
```

</details>

### 练习 2：进阶练习

**题目**：解释渐进式 rehash 的过程，为什么不用一次性 rehash？

<details>
<summary>点击查看答案</summary>

```
渐进式 rehash 过程：
1. 为 ht[1] 分配更大的空间
2. 设置 rehashidx = 0，开始 rehash
3. 每次操作字典时，迁移 ht[0] 的一个桶到 ht[1]
4. 迁移完成后，交换 ht[0] 和 ht[1]，重置 rehashidx = -1

为什么不用一次性 rehash：
- 一次性 rehash 需要遍历所有节点，数据量大时会阻塞很久
- 渐进式 rehash 将工作分散到每次操作中，避免长时间阻塞
- 保证了 Redis 的单线程模型不会因为 rehash 而卡住
```

</details>

### 练习 3（挑战）：综合练习

**题目**：解释 SCAN 命令的位反转算法，说明它如何保证遍历所有桶。

<details>
<summary>点击查看答案</summary>

```
SCAN 位反转算法：

1. 游标计算
   - 初始游标 = 0
   - 每次迭代后，使用位反转算法计算下一个游标
   - 位反转：将二进制位反转，加 1，再反转

2. 遍历顺序（8 位示例）
   000 → 100 → 010 → 110 → 001 → 101 → 011 → 111

3. 保证遍历所有桶
   - 位反转算法保证每个桶都会被访问
   - 即使 rehash 期间，也能继续迭代
   - 可能返回重复的键，但不会遗漏

4. 优势
   - 渐进式迭代，不阻塞主线程
   - 支持 rehash 期间的迭代
   - 可以分批处理大量数据
```

</details>

---

## 下一章预告

下一章我们会学习 **主从复制原理**——搞清楚全量同步与增量同步的实现、replconf 协议、复制偏移量与复制积压缓冲区、心跳机制。
