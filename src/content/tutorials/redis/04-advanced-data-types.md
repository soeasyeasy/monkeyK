---
title: "第4章：Redis 高级数据类型"
description: "Bitmap、HyperLogLog、Geospatial、Stream"
---

# 第4章：Redis 高级数据类型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 除了五种基础类型，Redis 还有哪些特殊数据类型？
- Bitmap 是什么？怎么用位运算节省内存？
- HyperLogLog 如何统计海量数据的基数？
- 如何用 Redis 存储地理位置信息？
- Stream 和传统的消息队列有什么区别？

这一章会详细讲解 Redis 的高级数据类型，帮你掌握这些特殊类型的用法和适用场景。

---

## 4.1 为什么需要高级数据类型？

### 痛点分析

想象一下这些场景：

- 统计 1 亿用户的签到状态，用 String 存储需要 100MB，太浪费
- 统计 10 亿个不同 URL 的数量，精确统计需要大量内存
- 存储用户的地理位置，计算"附近的人"
- 实现一个可靠的消息队列，支持消费者组

基础数据类型无法满足这些特殊需求，Redis 提供了专门的高级数据类型来解决这些问题。

### 解决方案

| 类型 | 适用场景 | 优势 |
| --- | --- | --- |
| **Bitmap** | 签到统计、在线状态 | 极致节省内存 |
| **HyperLogLog** | 基数统计（UV） | 海量数据只需 12KB |
| **Geospatial** | 地理位置、附近的人 | 内置距离计算 |
| **Stream** | 消息队列、事件流 | 支持消费者组 |

---

## 4.2 Bitmap 类型

### 概念解释

Bitmap 本质上是一个 String 类型，但通过位操作来存储数据，每个位（bit）可以表示一个 0 或 1。

打个比方：

> Bitmap 就像一排开关，每个开关只有开（1）和关（0）两种状态。你可以用 8 个开关表示 8 个布尔值，只占 1 字节内存。

### 基础用法

```bash
# 设置位（第 0 位设为 1）
> SETBIT user:1:sign 0 1
(integer) 0

# 设置第 1 位
> SETBIT user:1:sign 1 1
(integer) 0

# 设置第 5 位
> SETBIT user:1:sign 5 1
(integer) 0

# 获取位
> GETBIT user:1:sign 0
(integer) 1
> GETBIT user:1:sign 2
(integer) 0

# 统计 1 的个数（签到天数）
> BITCOUNT user:1:sign
(integer) 3

# 统计指定范围的 1 的个数
> BITCOUNT user:1:sign 0 0  # 第 1 个字节
(integer) 3
```

### 位运算

```bash
# 准备数据
> SETBIT user:1:sign 0 1
> SETBIT user:1:sign 1 1
> SETBIT user:1:sign 2 0
> SETBIT user:1:sign 3 1

> SETBIT user:2:sign 0 1
> SETBIT user:2:sign 1 0
> SETBIT user:2:sign 2 1
> SETBIT user:2:sign 3 1

# AND 运算（两人都签到）
> BITOP AND result:and user:1:sign user:2:sign
(integer) 1
> BITCOUNT result:and
(integer) 2  # 第 0 位和第 3 位

# OR 运算（任一人签到）
> BITOP OR result:or user:1:sign user:2:sign
(integer) 1
> BITCOUNT result:or
(integer) 4  # 所有位

# XOR 运算（只有一人签到）
> BITOP XOR result:xor user:1:sign user:2:sign
(integer) 1
> BITCOUNT result:xor
(integer) 2  # 第 1 位和第 2 位

# NOT 运算（取反）
> BITOP NOT result:not user:1:sign
(integer) 1
```

### 应用场景

| 场景 | 实现方式 |
| --- | --- |
| **用户签到** | 每天一个位，1 表示签到 |
| **在线状态** | 每个用户一个位，1 表示在线 |
| **布隆过滤器** | 判断元素是否存在 |
| **权限控制** | 每个权限一个位 |

### 内存优势

```bash
# 统计 1 亿用户的签到状态
# String 方式：1 亿字节 = 100MB
# Bitmap 方式：1 亿位 = 12.5MB

# 节省 87.5% 的内存！
```

---

## 4.3 HyperLogLog 类型

### 概念解释

HyperLogLog 用于基数统计（统计不重复元素的数量），它是一种概率算法，用极小的内存实现近似统计。

打个比方：

> 假设你要统计 10 亿个 URL 中有多少个不同的 URL。精确统计需要大量内存，而 HyperLogLog 只需要 12KB，就能给出 99.5% 准确度的结果。

### 基础用法

```bash
# 添加元素
> PFADD page:views "user:1" "user:2" "user:3"
(integer) 1

# 添加更多元素
> PFADD page:views "user:2" "user:4" "user:5"
(integer) 1  # 1 表示内部被修改过

# 统计基数
> PFCOUNT page:views
(integer) 5

# 合并多个 HyperLogLog
> PFADD page1:views "user:1" "user:2"
(integer) 1
> PFADD page2:views "user:2" "user:3"
(integer) 1
> PFMERGE all:views page1:views page2:views
OK
> PFCOUNT all:views
(integer) 3
```

### 应用场景

| 场景 | 说明 |
| --- | --- |
| **UV 统计** | 网站独立访客数 |
| **DAU 统计** | 日活跃用户数 |
| **去重统计** | 不重复的元素数量 |

### 精度与内存

```bash
# HyperLogLog 特点
- 固定占用 12KB 内存
- 标准误差 0.81%
- 理论上可以统计 2^64 个元素
- 不存储元素本身，只统计数量
```

---

## 4.4 Geospatial 类型

### 概念解释

Geospatial 用于存储地理位置信息，支持距离计算和范围查询。

打个比方：

> Geospatial 就像一张地图，你可以在上面标记位置，然后查询"附近 5 公里内的餐厅"或"两个城市之间的距离"。

### 基础用法

```bash
# 添加地理位置（经度、纬度、成员）
> GEOADD cities 116.40 39.90 "北京"
(integer) 1
> GEOADD cities 121.47 31.23 "上海"
(integer) 1
> GEOADD cities 113.26 23.13 "广州"
(integer) 1
> GEOADD cities 114.06 22.54 "深圳"
(integer) 1

# 获取位置信息
> GEOPOS cities "北京"
1) 1) "116.39999896287918091"
   2) "39.90000009434384993"

# 计算距离
> GEODIST cities "北京" "上海" km
"1068.4512"  # 公里
> GEODIST cities "北京" "上海" mi
"663.9312"   # 英里
> GEODIST cities "北京" "上海" m
"1068451.2"  # 米

# 获取指定范围内的位置
> GEORADIUS cities 116.40 39.90 1500 km
1) "北京"
2) "上海"

# 获取指定范围内的位置（带距离）
> GEORADIUS cities 116.40 39.90 1500 km WITHDIST
1) 1) "北京"
   2) "0.0000"
2) 1) "上海"
   2) "1068.4512"

# 按成员位置查询范围
> GEORADIUSBYMEMBER cities "上海" 1500 km
1) "上海"
2) "广州"
3) "深圳"

# 获取指定范围内的位置（按矩形区域）
> GEOSEARCH cities FROMLONLAT 116.40 39.90 BYRADIUS 1500 km
1) "北京"
2) "上海"
```

### 应用场景

| 场景 | 说明 |
| --- | --- |
| **附近的人** | 社交应用 |
| **附近的餐厅** | 外卖、点评应用 |
| **物流追踪** | 计算配送距离 |
| **LBS 服务** | 基于位置的服务 |

---

## 4.5 Stream 类型

### 概念解释

Stream 是 Redis 5.0 引入的数据类型，用于实现消息队列。它支持消费者组、消息确认、历史消息查询等高级特性。

打个比方：

> Stream 就像一个专业的邮局：你可以投递信件（发布消息），邮局会按顺序保存，多个邮递员（消费者）可以分工处理，而且邮局会记录每封信是否被签收（消息确认）。

### 基础用法

```bash
# 添加消息
> XADD mystream * name "张三" age "25"
"1600000000000-0"

> XADD mystream * name "李四" age "30"
"1600000000001-0"

# 查看消息
> XRANGE mystream - +
1) 1) "1600000000000-0"
   2) 1) "name"
      2) "张三"
      3) "age"
      4) "25"
2) 1) "1600000000001-0"
   2) 1) "name"
      2) "李四"
      3) "age"
      4) "30"

# 查看消息数量
> XLEN mystream
(integer) 2

# 读取消息（从开头）
> XREAD COUNT 2 STREAMS mystream 0
1) 1) "mystream"
   2) 1) 1) "1600000000000-0"
         2) 1) "name"
            2) "张三"
            3) "age"
            4) "25"
      2) 1) "1600000000001-0"
         2) 1) "name"
            2) "李四"
            3) "age"
            4) "30"
```

### 消费者组

```bash
# 创建消费者组
> XGROUP CREATE mystream mygroup 0
OK

# 消费者读取消息
> XREADGROUP GROUP mygroup consumer1 COUNT 1 STREAMS mystream >
1) 1) "mystream"
   2) 1) 1) "1600000000000-0"
         2) 1) "name"
            2) "张三"
            3) "age"
            4) "25"

# 确认消息
> XACK mystream mygroup 1600000000000-0
(integer) 1

# 查看消费者组信息
> XINFO GROUPS mystream
1) 1) "name"
   2) "mygroup"
   3) "consumers"
   4) (integer) 1
   5) "pending"
   6) (integer) 0
```

### 应用场景

| 场景 | 说明 |
| --- | --- |
| **消息队列** | 异步任务处理 |
| **事件流** | 事件驱动架构 |
| **日志收集** | 实时日志处理 |
| **订单处理** | 分布式订单系统 |

---

## 4.6 核心知识点总结

| 类型 | 用途 | 内存占用 | 特点 |
| --- | --- | --- | --- |
| **Bitmap** | 签到、状态 | 极致节省 | 位操作 |
| **HyperLogLog** | 基数统计 | 固定 12KB | 概率算法 |
| **Geospatial** | 地理位置 | 中等 | 距离计算 |
| **Stream** | 消息队列 | 较大 | 消费者组 |

---

## 4.7 新手常见误区

### 误区 1："Bitmap 可以存储任意值"

**错！** Bitmap 只能存储 0 和 1，每个位只有两种状态。如果需要存储更多状态，需要用多个位或改用其他类型。

### 误区 2："HyperLogLog 可以精确统计"

**不对！** HyperLogLog 是概率算法，有 0.81% 的误差。如果需要精确统计，应该用 Set。

### 误区 3："Geospatial 可以存储任意坐标"

**不是的！** Redis Geospatial 使用 GeoHash 编码，经纬度有范围限制：经度 -180 到 180，纬度 -85.05112878 到 85.05112878。

### 误区 4："Stream 可以替代所有消息队列"

**不推荐！** Redis Stream 功能强大，但相比 RabbitMQ、Kafka 等专业消息队列，缺少持久化保证、消息回溯等高级特性。简单场景可以用，复杂场景建议用专业工具。

---

## 4.8 动手练习

### 练习 1：Bitmap 签到统计

实现一个用户签到系统：
1. 用户 1 在第 1、3、5 天签到
2. 统计用户 1 的签到天数
3. 检查用户 1 第 2 天是否签到

<details>
<summary>点击查看答案</summary>

```bash
# 1. 用户 1 签到
> SETBIT user:1:sign 0 1  # 第 1 天
(integer) 0
> SETBIT user:1:sign 2 1  # 第 3 天
(integer) 0
> SETBIT user:1:sign 4 1  # 第 5 天
(integer) 0

# 2. 统计签到天数
> BITCOUNT user:1:sign
(integer) 3

# 3. 检查第 2 天是否签到
> GETBIT user:1:sign 1
(integer) 0  # 未签到
```

</details>

### 练习 2：HyperLogLog UV 统计

统计网站独立访客数：
1. 添加 10 个访客（部分重复）
2. 统计 UV

<details>
<summary>点击查看答案</summary>

```bash
# 1. 添加访客
> PFADD page:uv "user:1" "user:2" "user:3" "user:1" "user:4"
(integer) 1
> PFADD page:uv "user:2" "user:5" "user:6" "user:3" "user:7"
(integer) 1

# 2. 统计 UV
> PFCOUNT page:uv
(integer) 7  # 去重后的访客数
```

</details>

### 练习 3（挑战）：附近餐厅查询

实现附近餐厅查询：
1. 添加 3 个餐厅的位置
2. 查询 2 公里内的餐厅

<details>
<summary>点击查看答案</summary>

```bash
# 1. 添加餐厅位置（以某点为中心）
> GEOADD restaurants 116.39 39.90 "餐厅A"
(integer) 1
> GEOADD restaurants 116.40 39.91 "餐厅B"
(integer) 1
> GEOADD restaurants 116.50 40.00 "餐厅C"
(integer) 1

# 2. 查询 2 公里内的餐厅
> GEORADIUS restaurants 116.39 39.90 2 km
1) "餐厅A"
2) "餐厅B"
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 的事务与 Lua 脚本**——也就是如何保证多个命令的原子性执行，以及如何使用 Lua 脚本实现复杂逻辑。你会学到 MULTI/EXEC 事务、WATCH 乐观锁、Lua 脚本执行等高级特性。
