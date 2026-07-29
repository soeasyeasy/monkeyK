---
title: "第3章：底层数据结构详解"
description: "SDS、ziplist、quicklist、skiplist、intset、hashtable、listpack 编码原理"
---

# 第3章：底层数据结构详解

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 的五种数据类型底层是用什么结构存储的？
- 为什么 Redis 要自己实现字符串（SDS），不用 C 语言原生的字符串？
- ziplist、quicklist、listpack 有什么区别？为什么要不断演进？
- 跳表（skiplist）是什么？为什么不用平衡树？

这一章就是为了解答这些问题。我们会深入 Redis 的 **底层数据结构**，搞清楚每种结构的 **实现原理** 和 **适用场景**。

---

## 1 为什么需要自定义数据结构？

### 痛点分析

C 语言原生的数据结构有很多局限：

```c
// C 语言原生字符串
char *str = "hello";
// 问题：
// 1. 获取长度需要 O(n) 遍历
// 2. 不是二进制安全（遇到 \0 就结束）
// 3. 修改容易溢出

// C 语言原生数组
int arr[100];
// 问题：
// 1. 固定大小，不能动态扩容
// 2. 没有记录已使用数量
```

### 解决方案

Redis 实现了自己的数据结构：

| 数据结构 | 用途 | 优势 |
|----------|------|------|
| SDS | 字符串 | O(1) 获取长度、二进制安全、防溢出 |
| 链表 | 列表基础 | 双向、动态扩容 |
| 字典 | 哈希表 | 哈希表 + 渐进式 rehash |
| 跳表 | 有序集合 | O(log n) 查找、范围查询高效 |
| 整数集合 | 只存整数的集合 | 紧凑、高效 |
| ziplist | 压缩列表 | 内存连续、节省空间 |
| quicklist | 快速列表 | 结合双向链表和 ziplist |
| listpack | 紧凑列表 | 解决 ziplist 的级联更新问题 |

---

## 2 SDS（Simple Dynamic String）

### 2.1 结构定义

```c
// Redis 3.0 之前的 SDS
struct sdshdr {
    unsigned int len;    // 已使用长度
    unsigned int free;   // 剩余可用
    char buf[];          // 实际存储
};

// Redis 3.2 之后的 SDS（根据长度分多种类型）
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len;         // 1 字节长度（最大 255）
    uint8_t alloc;       // 1 字节总长度
    unsigned char flags; // 1 字节类型标识
    char buf[];
};

struct __attribute__ ((__packed__)) sdshdr16 {
    uint16_t len;        // 2 字节长度（最大 65535）
    uint16_t alloc;
    unsigned char flags;
    char buf[];
};
// 还有 sdshdr32、sdshdr64
```

### 2.2 与 C 字符串对比

| 特性 | C 字符串 | SDS |
|------|----------|-----|
| 获取长度 | O(n) | O(1) |
| 二进制安全 | 否（\0 结尾） | 是 |
| 防溢出 | 需要手动分配 | 自动扩容 |
| 内存预分配 | 无 | 有（减少重分配） |
| 兼容 C 函数 | 是 | 是（buf 也是 \0 结尾） |

### 2.3 空间分配策略

```c
// SDS 的空间分配策略
sds sdsMakeRoomFor(sds s, size_t addlen) {
    size_t free = sdsavail(s);
    size_t newlen;
    
    if (free >= addlen) return s;  // 空间足够，不分配
    
    newlen = len + addlen;
    if (newlen < 1024 * 1024) {
        // 小于 1MB，翻倍分配
        newlen *= 2;
    } else {
        // 大于 1MB，每次多分配 1MB
        newlen += 1024 * 1024;
    }
    
    // 重新分配内存
    newsh = s_realloc(sh, hdrlen + newlen + 1);
    return newsh->buf;
}
```

打个比方：

> SDS 就像"带刻度的水杯"——杯子上有刻度（len 字段），随时知道装了多少水（字符串长度），不用每次都数。而且杯子有预留空间（free 字段），加水时不用每次都换杯子。

---

## 3 链表

### 3.1 双向链表

```c
// 链表节点
typedef struct listNode {
    struct listNode *prev;  // 前驱节点
    struct listNode *next;  // 后继节点
    void *value;            // 节点值
} listNode;

// 链表结构
typedef struct list {
    listNode *head;         // 头节点
    listNode *tail;         // 尾节点
    unsigned long len;      // 节点数量
    void *(*dup)(void *);   // 复制函数
    void (*free)(void *);   // 释放函数
    int (*match)(void *, void *);  // 匹配函数
} list;
```

### 3.2 特点

- 双向遍历——有 prev 和 next 指针
- O(1) 获取头尾——有 head 和 tail 指针
- O(1) 获取长度——有 len 字段
- 类型无关——value 是 void*，可以存任意类型

---

## 4 字典（哈希表）

### 4.1 结构定义

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

### 4.2 渐进式 rehash

```c
// 渐进式 rehash 的过程
// 1. 为 ht[1] 分配空间
// 2. 将 rehashidx 设为 0，开始 rehash
// 3. 每次操作字典时，迁移一个桶（bucket）
// 4. 迁移完成后，交换 ht[0] 和 ht[1]，重置 rehashidx

// 每次操作时触发迁移
dictEntry *dictAdd(dict *d, void *key, void *val) {
    // 如果正在 rehash，迁移一个桶
    if (dictIsRehashing(d)) {
        dictRehashStep(d);
    }
    // 正常添加操作...
}
```

打个比方：

> 渐进式 rehash 就像"搬家"——不是一次性把所有东西搬完，而是每次出门时顺手带一点，直到搬完。这样不会一次性占用太多资源。

---

## 5 跳表（skiplist）

### 5.1 结构定义

```c
// 跳表节点
typedef struct zskiplistNode {
    sds ele;                    // 成员对象
    double score;               // 分值
    struct zskiplistNode *backward;  // 后退指针
    struct zskiplistLevel {
        struct zskiplistNode *forward;  // 前进指针
        unsigned long span;             // 跨度（用于计算排名）
    } level[];                  // 层级数组
} zskiplistNode;

// 跳表
typedef struct zskiplist {
    struct zskiplistNode *header;  // 头节点
    struct zskiplistNode *tail;    // 尾节点
    unsigned long length;          // 节点数
    int level;                     // 当前层数
} zskiplist;
```

### 5.2 跳表结构图

```
// 跳表示例（查找 7）
Level 3:  1 ──────────────────────────────── 9
Level 2:  1 ──────── 4 ──────────────────── 9
Level 1:  1 ──── 3 ──── 4 ──── 6 ──── 7 ──── 9
          H                               T

// 查找路径：1 → 4 → 6 → 7
// 时间复杂度：O(log n)
```

### 5.3 为什么用跳表不用平衡树？

| 特性 | 跳表 | 平衡树（如红黑树） |
|------|------|-------------------|
| 实现复杂度 | 简单 | 复杂 |
| 范围查询 | 高效（找到起点后顺序遍历） | 需要中序遍历 |
| 插入删除 | 简单（修改指针） | 复杂（需要旋转平衡） |
| 内存局部性 | 较差 | 较好 |
| 并发友好 | 是（锁粒度小） | 否（旋转影响范围大） |

Redis 选择跳表的原因：

- 实现简单——代码容易理解和维护
- 范围查询高效——ZSet 经常需要范围操作（ZRANGE）
- 并发友好——未来如果要支持并发，跳表更容易改造

---

## 6 整数集合（intset）

### 6.1 结构定义

```c
typedef struct intset {
    uint32_t encoding;    // 编码方式（int16/int32/int64）
    uint32_t length;      // 元素数量
    int8_t contents[];    // 元素数组（有序）
} intset;
```

### 6.2 特点

- 只存整数——节省内存
- 有序排列——支持二分查找
- 自动升级——小类型存不下时自动升级为大类型

```c
// 整数集合的升级过程
// 初始：encoding = int16，存 [1, 2, 3]
// 插入 65536（超出 int16 范围）
// 升级：encoding = int32，重新分配内存，迁移数据
// 结果：[1, 2, 3, 65536]，encoding = int32
```

---

## 7 压缩列表（ziplist）

### 7.1 结构定义

```
// ziplist 的整体结构
| zlbytes | zltail | zllen | entry1 | entry2 | ... | entryN | zlend |
| 4 字节  | 4 字节 | 1 字节|        |        |     |        | 1 字节|

// entry 的结构
| prevlen | encoding | content |
| 1/5 字节| 1/5 字节 | 变长    |
```

### 7.2 特点

- 内存连续——一块连续的内存
- 节省空间——没有指针开销
- 级联更新问题——修改一个节点可能导致连锁反应

### 7.3 级联更新问题

```
// 级联更新示例
// 初始状态：
| entry1(50) | entry2(127) | entry3(128) | entry4(128) |

// 在 entry1 前插入一个新节点，导致 entry1 的 prevlen 从 1 字节变成 5 字节
// entry1 总长度变成 128，prevlen 字段需要 5 字节
// entry2 的 prevlen 也要从 1 字节变成 5 字节
// entry3 的 prevlen 也要从 1 字节变成 5 字节
// 连锁反应，直到某个节点长度不变

// 最坏情况：O(N^2)
```

---

## 8 快速列表（quicklist）

### 8.1 结构定义

```c
// quicklist 节点
typedef struct quicklistNode {
    struct quicklistNode *prev;
    struct quicklistNode *next;
    unsigned char *zl;      // 指向 ziplist
    unsigned int sz;        // ziplist 大小
    unsigned int count;     // 元素数量
    unsigned int encoding;  // 编码方式
    // ...
} quicklistNode;

// quicklist
typedef struct quicklist {
    quicklistNode *head;
    quicklistNode *tail;
    unsigned long len;      // 节点数量
    // ...
} quicklist;
```

### 8.2 设计思想

```
// quicklist = 双向链表 + ziplist
// 每个节点是一个 ziplist

quicklist
├── node1 → ziplist[elem1, elem2, elem3]
├── node2 → ziplist[elem4, elem5, elem6]
└── node3 → ziplist[elem7, elem8, elem9]
```

打个比方：

> quicklist 就像"火车"——每节车厢（ziplist）可以装很多人（元素），车厢之间用挂钩（指针）连接。这样既保持了内存连续的优势，又解决了单个 ziplist 太大的问题。

---

## 9 紧凑列表（listpack）

### 9.1 为什么需要 listpack？

ziplist 有级联更新问题，listpack 是为了解决这个问题：

```
// ziplist 的 prevlen 字段
// 如果前一个节点长度 < 254，prevlen 占 1 字节
// 如果前一个节点长度 >= 254，prevlen 占 5 字节

// 问题：修改节点可能导致 prevlen 长度变化，引发级联更新

// listpack 的改进
// 每个节点只记录自己的长度，不记录前一个节点的长度
// 修改节点不会影响其他节点
```

### 9.2 结构对比

```
// ziplist
| prevlen | encoding | content |
| 1/5 字节| 1/5 字节 | 变长    |

// listpack
| lpbytes | lplen | entry1 | entry2 | ... | entryN | lpend |
| 4 字节  | 2 字节|        |        |     |        | 1 字节|

// entry 结构
| len | backlen | encoding | content |
| 变长| 变长    | 变长     | 变长    |
```

### 9.3 Redis 7.0 的演进

Redis 7.0 中，listpack 完全替代了 ziplist：

| 版本 | 列表/哈希/有序集合的底层实现 |
|------|------------------------------|
| 3.2 之前 | ziplist |
| 3.2 - 6.2 | quicklist（列表）、ziplist（哈希/有序集合） |
| 7.0 之后 | quicklist（列表）、listpack（哈希/有序集合） |

---

## 10 核心知识点总结

| 数据结构 | 用途 | 特点 |
|----------|------|------|
| SDS | 字符串 | O(1) 长度、二进制安全、防溢出 |
| 链表 | 列表基础 | 双向、动态、类型无关 |
| 字典 | 哈希表 | 哈希表 + 渐进式 rehash |
| 跳表 | 有序集合 | O(log n) 查找、范围查询高效 |
| 整数集合 | 整数集合 | 紧凑、自动升级 |
| ziplist | 小列表/小哈希 | 内存连续、级联更新问题 |
| quicklist | 列表 | 双向链表 + ziplist |
| listpack | 哈希/有序集合 | 解决级联更新问题 |

---

## 11 新手常见误区

### 误区 1："Redis 的字符串就是 C 字符串"

**错！** Redis 使用 SDS（Simple Dynamic String），不是 C 字符串。SDS 可以 O(1) 获取长度，是二进制安全的，而且有空间预分配机制。

### 误区 2："跳表比平衡树慢"

**不一定。** 跳表和平衡树的时间复杂度都是 O(log n)，但跳表的实现更简单，范围查询更高效，而且在并发场景下更容易优化。

### 误区 3："ziplist 节省内存，所以总是用它"

**不是的。** ziplist 虽然有内存优势，但有级联更新问题。当元素数量或大小超过阈值时，Redis 会自动转换为 hashtable 或 skiplist，避免性能问题。

### 误区 4："listpack 是 ziplist 的简单替换"

**不完全对。** listpack 解决了 ziplist 的级联更新问题，但实现方式不同。listpack 不记录前一个节点的长度，而是记录自己的长度，这样修改节点不会影响其他节点。

---

## 12 动手练习

### 练习 1：基础练习

**题目**：画出 SDS 的结构，说明它比 C 字符串的优势。

<details>
<summary>点击查看答案</summary>

```
SDS 结构：
| len | alloc | flags | buf[] |
| 长度| 总容量| 类型  | 数据  |

优势：
1. O(1) 获取长度（len 字段）
2. 二进制安全（不依赖 \0 结尾）
3. 防溢出（自动扩容）
4. 空间预分配（减少重分配次数）
5. 兼容 C 字符串函数（buf 也是 \0 结尾）
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
3. 每次操作字典时，迁移 ht[0] 的一个桶（bucket）到 ht[1]
4. 迁移完成后，交换 ht[0] 和 ht[1]，重置 rehashidx = -1

为什么不用一次性 rehash：
- 一次性 rehash 需要遍历所有节点，如果数据量大，会阻塞很长时间
- 渐进式 rehash 将工作分散到每次操作中，避免长时间阻塞
- 保证了 Redis 的单线程模型不会因为 rehash 而卡住
```

</details>

### 练习 3（挑战）：综合练习

**题目**：画出跳表的结构，说明查找元素 7 的过程。

<details>
<summary>点击查看答案</summary>

```
跳表示例：
Level 3:  1 ──────────────────────────────── 9
Level 2:  1 ──────── 4 ──────────────────── 9
Level 1:  1 ──── 3 ──── 4 ──── 6 ──── 7 ──── 9
          H                               T

查找 7 的过程：
1. 从最高层（Level 3）的头节点开始
2. 头节点的值是 1，小于 7，前进到 9
3. 9 大于 7，下降到 Level 2
4. Level 2 的当前节点是 1，前进到 4
5. 4 小于 7，前进到 9
6. 9 大于 7，下降到 Level 1
7. Level 1 的当前节点是 4，前进到 6
8. 6 小于 7，前进到 7
9. 找到目标元素 7

查找路径：1 → 4 → 6 → 7
时间复杂度：O(log n)
```

</details>

---

## 下一章预告

下一章我们会学习 **对象系统与类型编码**——搞清楚 redisObject 的结构、五种对象类型的编码转换、内存布局与对象共享机制。
