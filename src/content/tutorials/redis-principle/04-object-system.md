---
title: "第4章：对象系统与类型编码"
description: "redisObject 结构、五种对象类型的编码转换、内存布局与对象共享"
---

# 第4章：对象系统与类型编码

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 的五种数据类型在底层是怎么实现的？
- 什么是 redisObject？它有什么作用？
- 为什么同一个类型有不同的编码方式（encoding）？
- Redis 是如何优化内存使用的？

这一章就是为了解答这些问题。我们会深入 **redisObject 结构**，搞清楚 **类型与编码的关系**，弄明白 **Redis 的内存优化策略**。

---

## 1 为什么需要对象系统？

### 痛点分析

Redis 支持五种数据类型，每种类型在底层可能有多种实现方式：

```
// 字符串类型
- 可以是整数 → 用 int 编码
- 可以是短字符串 → 用 embstr 编码
- 可以是长字符串 → 用 raw 编码

// 列表类型
- 元素少且短 → 用 ziplist/listpack 编码
- 元素多或长 → 用 quicklist 编码
```

如果直接暴露底层实现，用户会很困惑：

```
// 假设没有对象系统
redis> SET count 100
// 底层用 int 编码
redis> SET name "hello"
// 底层用 embstr 编码

// 用户看到的是"字符串类型"，但底层实现不同
// 如果没有统一的抽象，用户需要关心底层细节
```

### 解决方案

Redis 使用 **redisObject** 来统一抽象：

```c
typedef struct redisObject {
    unsigned type:4;      // 类型（4 位）
    unsigned encoding:4;  // 编码（4 位）
    unsigned lru:24;      // LRU 时间（24 位）
    int refcount;         // 引用计数
    void *ptr;            // 指向实际数据
} robj;
```

打个比方：

> redisObject 就像"快递包裹"——外面贴着标签（type、encoding），里面装着实际物品（ptr）。快递员只需要看标签就知道怎么处理，不需要打开包裹看里面是什么。

---

## 2 redisObject 结构详解

### 2.1 字段说明

| 字段 | 位数 | 说明 |
|------|------|------|
| type | 4 位 | 对象类型（string、list、set、zset、hash） |
| encoding | 4 位 | 编码方式（int、embstr、raw、ziplist 等） |
| lru | 24 位 | 最近访问时间（用于内存淘汰） |
| refcount | 32 位 | 引用计数（用于内存回收） |
| ptr | 64 位 | 指向实际数据的指针 |

### 2.2 类型（type）

```c
// 对象类型定义
#define OBJ_STRING 0    // 字符串
#define OBJ_LIST 1      // 列表
#define OBJ_SET 2       // 集合
#define OBJ_ZSET 3      // 有序集合
#define OBJ_HASH 4      // 哈希
```

### 2.3 编码（encoding）

```c
// 编码方式定义
#define OBJ_ENCODING_RAW 0        // 原始字符串（SDS）
#define OBJ_ENCODING_INT 1        // 整数
#define OBJ_ENCODING_HT 2         // 哈希表
#define OBJ_ENCODING_ZIPLIST 3    // 压缩列表（旧版）
#define OBJ_ENCODING_LINKEDLIST 4 // 双向链表（已废弃）
#define OBJ_ENCODING_INTSET 5     // 整数集合
#define OBJ_ENCODING_SKIPLIST 6   // 跳表
#define OBJ_ENCODING_EMBSTR 7     // 嵌入式字符串
#define OBJ_ENCODING_QUICKLIST 8  // 快速列表
#define OBJ_ENCODING_STREAM 9     // Stream
#define OBJ_ENCODING_LISTPACK 10  // 紧凑列表
```

---

## 3 字符串对象

### 3.1 编码转换

```
// 字符串对象的编码转换
SET count 100
→ type = OBJ_STRING, encoding = OBJ_ENCODING_INT
→ ptr 指向整数值 100

SET name "hello"
→ type = OBJ_STRING, encoding = OBJ_ENCODING_EMBSTR
→ ptr 指向嵌入式字符串

SET content "very long string..."
→ type = OBJ_STRING, encoding = OBJ_ENCODING_RAW
→ ptr 指向 SDS
```

### 3.2 编码规则

| 场景 | 编码 | 说明 |
|------|------|------|
| 整数值 | int | 可以用 long 表示的整数 |
| 短字符串（≤44 字节） | embstr | 嵌入式字符串，一次分配 |
| 长字符串（>44 字节） | raw | SDS，独立分配 |
| 浮点数 | raw | 转为字符串存储 |

### 3.3 embstr 的优势

```c
// embstr 的内存布局
// 一次分配，redisObject 和 SDS 连续存储

┌─────────────┬─────────────────┐
│ redisObject │ sdshdr8 + buf   │
│  (16 字节)  │  (变长)         │
└─────────────┴─────────────────┘

// raw 的内存布局
// 两次分配，redisObject 和 SDS 分离

┌─────────────┐     ┌─────────────────┐
│ redisObject │ ──→ │ sdshdr + buf    │
│  (16 字节)  │     │  (变长)         │
└─────────────┘     └─────────────────┘
```

打个比方：

> embstr 就像"买一送一的套餐"——redisObject 和字符串一起分配，省了一次内存分配的开销。raw 就像"分开购买"——需要两次分配。

---

## 4 列表对象

### 4.1 编码转换

```
// 列表对象的编码转换
RPUSH list 1 2 3
→ encoding = ziplist/listpack（元素少且短）

RPUSH list "very long string..."
→ encoding = quicklist（元素长）

// 超过阈值自动转换
// list-max-ziplist-size 配置控制 ziplist 的大小
```

### 4.2 编码规则

| 场景 | 编码 | 说明 |
|------|------|------|
| 元素少且短 | ziplist/listpack | 节省内存 |
| 元素多或长 | quicklist | 性能更好 |

---

## 5 哈希对象

### 5.1 编码转换

```
// 哈希对象的编码转换
HSET user:1 name "Alice" age 20
→ encoding = ziplist/listpack（字段少且短）

HSET user:1 ... (很多字段)
→ encoding = hashtable（字段多）

// 超过阈值自动转换
// hash-max-ziplist-entries 控制字段数量
// hash-max-ziplist-value 控制字段值大小
```

### 5.2 编码规则

| 场景 | 编码 | 说明 |
|------|------|------|
| 字段少且短 | ziplist/listpack | 节省内存 |
| 字段多或长 | hashtable | 查询高效 |

---

## 6 集合对象

### 6.1 编码转换

```
// 集合对象的编码转换
SADD set 1 2 3
→ encoding = intset（全是整数）

SADD set "hello"
→ encoding = hashtable（包含字符串）

// 超过阈值自动转换
// set-max-intset-entries 控制整数数量
```

### 6.2 编码规则

| 场景 | 编码 | 说明 |
|------|------|------|
| 全是整数 | intset | 紧凑、高效 |
| 包含字符串 | hashtable | 通用 |

---

## 7 有序集合对象

### 7.1 编码转换

```
// 有序集合对象的编码转换
ZADD zset 1 "a" 2 "b" 3 "c"
→ encoding = ziplist/listpack（元素少且短）

ZADD zset ... (很多元素)
→ encoding = skiplist + hashtable（元素多）

// 超过阈值自动转换
// zset-max-ziplist-entries 控制元素数量
// zset-max-ziplist-value 控制元素值大小
```

### 7.2 编码规则

| 场景 | 编码 | 说明 |
|------|------|------|
| 元素少且短 | ziplist/listpack | 节省内存 |
| 元素多或长 | skiplist + hashtable | 查询高效 |

### 7.3 为什么有序集合需要两种结构？

```
// skiplist + hashtable 的组合
// skiplist：按 score 排序，支持范围查询
// hashtable：按 member 查找，支持 O(1) 查询

┌─────────────────────────────────────┐
│           skiplist                  │
│  1:a ──→ 2:b ──→ 3:c ──→ ...      │
└─────────────────────────────────────┘
              ↕ 共享同一个指针
┌─────────────────────────────────────┐
│           hashtable                 │
│  a → 1  b → 2  c → 3              │
└─────────────────────────────────────┘
```

---

## 8 内存优化

### 8.1 对象共享

```c
// Redis 预定义了一些常用对象
// 0-9999 的整数对象是共享的

// 示例
SET a 100
SET b 100
// a 和 b 指向同一个 redisObject

// 通过 refcount 管理共享对象
// refcount > 1 时，不能修改对象
```

### 8.2 引用计数

```c
// 引用计数机制
void incrRefCount(robj *o) {
    o->refcount++;
}

void decrRefCount(robj *o) {
    o->refcount--;
    if (o->refcount == 0) {
        freeObject(o);  // 引用计数为 0，释放内存
    }
}
```

打个比方：

> 引用计数就像"图书馆的书"——每本书有多本副本（refcount），每个借阅者借走一本，refcount 加 1；归还时 refcount 减 1；当 refcount 为 0 时，说明书没有被借，可以下架处理。

### 8.3 LRU 算法

```c
// Redis 的 LRU 近似算法
// 不是精确的 LRU，而是随机采样

// 每次淘汰时，随机采样 N 个键（默认 5）
// 从中选择最久未访问的键淘汰

// 配置
// maxmemory-policy allkeys-lru
// maxmemory-samples 5
```

---

## 9 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| redisObject | 统一抽象五种数据类型，包含 type、encoding、lru、refcount、ptr |
| 类型与编码 | type 表示数据类型，encoding 表示底层实现 |
| 编码转换 | 根据数据特征自动选择最优编码 |
| 对象共享 | 0-9999 的整数对象是共享的 |
| 引用计数 | 管理对象的生命周期 |
| LRU 淘汰 | 随机采样近似 LRU |

---

## 10 新手常见误区

### 误区 1："字符串类型底层都是字符串"

**错！** 字符串类型根据值的不同，可能用 int、embstr、raw 三种编码。整数用 int，短字符串用 embstr，长字符串用 raw。

### 误区 2："列表类型底层都是链表"

**不是的。** 列表类型在元素少且短时用 ziplist/listpack，元素多或长时用 quicklist。Redis 会根据数据特征自动选择。

### 误区 3："对象共享可以节省所有内存"

**不完全对。** 对象共享只适用于不可变对象（如整数）。对于可变对象（如字符串），如果共享会导致修改影响其他引用，所以只有只读对象才能共享。

### 误区 4："LRU 是精确的最近最少使用"

**不是的。** Redis 的 LRU 是近似算法，每次随机采样 N 个键，从中选择最久未访问的。这样既节省内存（不需要维护链表），又能达到较好的效果。

---

## 11 动手练习

### 练习 1：基础练习

**题目**：画出 redisObject 的结构，说明每个字段的作用。

<details>
<summary>点击查看答案</summary>

```
redisObject 结构（16 字节）：

┌──────────┬──────────┬──────────┬────────────┬─────────┐
│ type:4   │encoding:4│ lru:24   │ refcount:32│ ptr:64  │
│ 类型     │ 编码     │ LRU 时间 │ 引用计数   │ 数据指针│
└──────────┴──────────┴──────────┴────────────┴─────────┘

字段作用：
- type：对象类型（string/list/set/zset/hash）
- encoding：底层编码方式（int/embstr/raw/ziplist 等）
- lru：最近访问时间，用于内存淘汰
- refcount：引用计数，用于内存回收
- ptr：指向实际数据的指针
```

</details>

### 练习 2：进阶练习

**题目**：解释字符串对象的三种编码方式，以及它们的适用场景。

<details>
<summary>点击查看答案</summary>

```
字符串对象的三种编码：

1. int（整数编码）
   - 适用场景：值可以用 long 表示的整数
   - 示例：SET count 100
   - 优势：直接存储整数，节省内存

2. embstr（嵌入式字符串）
   - 适用场景：长度 ≤ 44 字节的字符串
   - 示例：SET name "hello"
   - 优势：一次分配，redisObject 和 SDS 连续存储

3. raw（原始字符串）
   - 适用场景：长度 > 44 字节的字符串
   - 示例：SET content "very long string..."
   - 特点：两次分配，redisObject 和 SDS 分离
```

</details>

### 练习 3（挑战）：综合练习

**题目**：解释为什么有序集合需要同时使用 skiplist 和 hashtable？

<details>
<summary>点击查看答案</summary>

```
有序集合需要同时使用 skiplist 和 hashtable 的原因：

1. skiplist 的作用
   - 按 score 排序存储元素
   - 支持范围查询（ZRANGEBYSCORE）
   - 时间复杂度 O(log n)

2. hashtable 的作用
   - 按 member 快速查找
   - 支持 O(1) 查询某个 member 的 score
   - 支持 O(1) 判断 member 是否存在

3. 两者结合
   - skiplist 和 hashtable 共享同一个元素指针
   - 既支持按 score 排序，又支持按 member 快速查找
   - 空间换时间，满足不同场景的需求
```

</details>

---

## 下一章预告

下一章我们会学习 **事件驱动模型**——搞清楚 ae 事件循环的实现、文件事件与时间事件的处理、以及多路复用的底层原理。
