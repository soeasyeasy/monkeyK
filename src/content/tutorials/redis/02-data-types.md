---
title: "第2章：Redis 数据类型详解"
description: "String、Hash、List、Set、ZSet 五种基础类型"
---

# 第2章：Redis 数据类型详解

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 支持哪些数据类型？
- String 和 Hash 有什么区别？什么时候用哪个？
- List 和 Set 的区别是什么？
- ZSet 是怎么实现排序的？
- 这些数据类型在实际项目中怎么用？

这一章会详细讲解 Redis 的五种基础数据类型，帮你搞清楚每种类型的特点和适用场景。

---

## 1 为什么需要多种数据类型？

### 痛点分析

想象一下，如果 Redis 只支持字符串类型，你要存储一个用户信息（姓名、年龄、邮箱），只能把数据拼成一个 JSON 字符串：

```json
{"name":"张三","age":25,"email":"zhangsan@example.com"}
```

每次修改年龄，都要先读取整个字符串，解析 JSON，修改年龄，再序列化回去存储。这既麻烦又低效。

### 解决方案

Redis 提供了五种基础数据类型，让你可以根据数据特点选择最合适的存储方式：

| 类型 | 适用场景 | 生活类比 |
| --- | --- | --- |
| **String** | 简单键值对、计数器 | 便利贴，写一个值 |
| **Hash** | 对象存储 | 名片盒，一张名片存多个字段 |
| **List** | 消息队列、时间线 | 排队列表，有顺序 |
| **Set** | 标签、去重 | 集合，不重复 |
| **ZSet** | 排行榜、延迟队列 | 带分数的排行榜 |

---

## 2 String 类型

### 概念解释

String 是 Redis 最基础的类型，可以存储字符串、数字或二进制数据。

打个比方：

> String 就像一张便利贴，你只能写一个值。但这个值可以是文字、数字，甚至是图片的二进制数据。

### 基础用法

```bash
# 设置字符串
> SET name "张三"
OK

# 获取字符串
> GET name
"张三"

# 同时设置多个键值对
> MSET key1 "value1" key2 "value2" key3 "value3"
OK

# 同时获取多个值
> MGET key1 key2 key3
1) "value1"
2) "value2"
3) "value3"

# 设置值并获取旧值
> GETSET name "李四"
"张三"

# 只在键不存在时设置
> SETNX newkey "新值"
(integer) 1

# 设置过期时间（秒）
> SET code "123456" EX 60
OK

# 设置过期时间（毫秒）
> SET code "123456" PX 60000
OK

# 查看剩余时间
> TTL code
(integer) 55
```

### 数字操作

```bash
# 设置数字
> SET counter 0
OK

# 自增 1
> INCR counter
(integer) 1

# 自增指定值
> INCRBY counter 10
(integer) 11

# 自减 1
> DECR counter
(integer) 10

# 自减指定值
> DECRBY counter 5
(integer) 5

# 浮点数自增
> SET price 10.5
OK
> INCRBYFLOAT price 1.5
"12"
```

### 字符串操作

```bash
# 追加字符串
> SET greeting "Hello"
OK
> APPEND greeting " World"
(integer) 11
> GET greeting
"Hello World"

# 获取字符串长度
> STRLEN greeting
(integer) 11

# 获取子字符串
> SET message "Hello Redis"
OK
> GETRANGE message 0 4
"Hello"
> GETRANGE message 6 -1
"Redis"

# 设置子字符串
> SETRANGE message 6 "MongoDB"
(integer) 13
> GET message
"Hello MongoDB"
```

### 应用场景

| 场景 | 示例 |
| --- | --- |
| **缓存** | 存储商品详情、用户信息 |
| **计数器** | 文章阅读量、点赞数 |
| **分布式锁** | SETNX 实现互斥 |
| **Session 共享** | 存储用户登录状态 |
| **验证码** | 带过期时间的验证码 |

---

## 3 Hash 类型

### 概念解释

Hash 是一个键值对集合，适合存储对象。

打个比方：

> Hash 就像一张名片，上面有姓名、电话、邮箱等多个字段。你可以单独修改某个字段，而不用重写整张名片。

### 基础用法

```bash
# 设置单个字段
> HSET user:1 name "张三"
(integer) 1

# 获取单个字段
> HGET user:1 name
"张三"

# 同时设置多个字段
> HMSET user:1 age 25 email "zhangsan@example.com" city "北京"
OK

# 同时获取多个字段
> HMGET user:1 name age email
1) "张三"
2) "25"
3) "zhangsan@example.com"

# 获取所有字段和值
> HGETALL user:1
1) "name"
2) "张三"
3) "age"
4) "25"
5) "email"
6) "zhangsan@example.com"
7) "city"
8) "北京"

# 获取所有字段名
> HKEYS user:1
1) "name"
2) "age"
3) "email"
4) "city"

# 获取所有值
> HVALS user:1
1) "张三"
2) "25"
3) "zhangsan@example.com"
4) "北京"

# 获取字段数量
> HLEN user:1
(integer) 4

# 删除字段
> HDEL user:1 city
(integer) 1

# 字段是否存在
> HEXISTS user:1 name
(integer) 1
> HEXISTS user:1 phone
(integer) 0
```

### 数字操作

```bash
# 设置初始值
> HSET user:1 score 0
(integer) 1

# 自增
> HINCRBY user:1 score 10
(integer) 10

# 自增浮点数
> HINCRBYFLOAT user:1 score 1.5
"11.5"
```

### 应用场景

| 场景 | 示例 |
| --- | --- |
| **用户信息** | 存储用户的姓名、年龄、邮箱等 |
| **商品详情** | 存储商品的名称、价格、库存等 |
| **配置信息** | 存储应用的各项配置 |
| **购物车** | 用户ID为键，商品ID为字段，数量为值 |

### String vs Hash 对比

| 特性 | String（JSON） | Hash |
| --- | --- | --- |
| **存储对象** | 序列化为 JSON | 直接存储字段 |
| **部分更新** | 需要读取-修改-写入 | 直接修改单个字段 |
| **内存占用** | 较大（JSON 格式） | 较小（优化存储） |
| **读取单个字段** | 需要解析整个 JSON | 直接读取 |
| **适用场景** | 简单对象、序列化 | 复杂对象、频繁更新 |

---

## 4 List 类型

### 概念解释

List 是一个有序的字符串列表，可以看作链表结构。

打个比方：

> List 就像排队买奶茶的队伍，先来的排前面，后来的排后面。你可以从队头或队尾添加/删除元素。

### 基础用法

```bash
# 从左侧插入（头部）
> LPUSH queue "任务1"
(integer) 1
> LPUSH queue "任务2"
(integer) 2
> LPUSH queue "任务3"
(integer) 3

# 从右侧插入（尾部）
> RPUSH queue "任务4"
(integer) 4

# 查看列表
> LRANGE queue 0 -1
1) "任务3"
2) "任务2"
3) "任务1"
4) "任务4"

# 从左侧弹出（取出并删除）
> LPOP queue
"任务3"

# 从右侧弹出
> RPOP queue
"任务4"

# 查看列表长度
> LLEN queue
(integer) 2

# 获取指定范围的元素
> LRANGE queue 0 1
1) "任务2"
2) "任务1"

# 获取指定索引的元素
> LINDEX queue 0
"任务2"

# 设置指定索引的值
> LSET queue 0 "新任务2"
OK

# 删除指定数量的指定值
> LPUSH mylist "a" "b" "a" "c" "a"
(integer) 5
> LREM mylist 2 "a"  # 从左到右删除 2 个 "a"
(integer) 2
> LRANGE mylist 0 -1
1) "b"
2) "c"
3) "a"

# 截取列表
> LPUSH mylist "1" "2" "3" "4" "5"
(integer) 5
> LTRIM mylist 1 3  # 只保留索引 1-3 的元素
OK
> LRANGE mylist 0 -1
1) "4"
2) "3"
3) "2"
```

### 阻塞操作

```bash
# 阻塞弹出（队列为空时等待）
> BLPOP queue 10  # 等待 10 秒

# 阻塞弹出到另一个列表
> BRPOPLPUSH source target 10
```

### 应用场景

| 场景 | 示例 |
| --- | --- |
| **消息队列** | LPUSH 生产，RPOP 消费 |
| **时间线** | 存储用户的最新动态 |
| **分页数据** | 存储评论、日志等 |
| **任务队列** | 异步任务处理 |

---

## 5 Set 类型

### 概念解释

Set 是一个无序的字符串集合，元素唯一。

打个比方：

> Set 就像你的朋友圈，每个人都是唯一的，没有顺序之分。你可以快速判断某人是否在朋友圈里。

### 基础用法

```bash
# 添加元素
> SADD tags "redis" "database" "nosql"
(integer) 3

# 查看集合所有元素
> SMEMBERS tags
1) "nosql"
2) "redis"
3) "database"

# 判断元素是否存在
> SISMEMBER tags "redis"
(integer) 1
> SISMEMBER tags "mysql"
(integer) 0

# 获取元素个数
> SCARD tags
(integer) 3

# 删除元素
> SREM tags "nosql"
(integer) 1

# 随机弹出一个元素
> SPOP tags
"database"

# 随机获取（不删除）
> SRANDMEMBER tags 2
1) "redis"
2) "cache"
```

### 集合运算

```bash
# 准备数据
> SADD user:1:follow "user:2" "user:3" "user:4"
(integer) 3
> SADD user:2:follow "user:3" "user:4" "user:5"
(integer) 3

# 交集（共同关注）
> SINTER user:1:follow user:2:follow
1) "user:3"
2) "user:4"

# 并集（所有关注）
> SUNION user:1:follow user:2:follow
1) "user:2"
2) "user:3"
3) "user:4"
4) "user:5"

# 差集（user:1 关注但 user:2 没关注）
> SDIFF user:1:follow user:2:follow
1) "user:2"

# 将结果存储到新集合
> SINTERSTORE common:follow user:1:follow user:2:follow
(integer) 2
> SMEMBERS common:follow
1) "user:3"
2) "user:4"
```

### 应用场景

| 场景 | 示例 |
| --- | --- |
| **标签** | 文章标签、商品标签 |
| **关注/粉丝** | 用户关注列表 |
| **去重** | 记录已访问的 URL |
| **抽奖** | SPOP 随机抽奖 |
| **共同兴趣** | 交集运算 |

---

## 6 ZSet（有序集合）类型

### 概念解释

ZSet 和 Set 类似，但每个元素都关联一个分数（score），Redis 会根据分数自动排序。

打个比方：

> ZSet 就像游戏排行榜，每个玩家（元素）都有一个分数，系统自动按分数从高到低排列。

### 基础用法

```bash
# 添加元素（带分数）
> ZADD leaderboard 100 "player1"
(integer) 1
> ZADD leaderboard 200 "player2"
(integer) 1
> ZADD leaderboard 150 "player3"
(integer) 1

# 查看集合（按分数从低到高）
> ZRANGE leaderboard 0 -1
1) "player1"
2) "player3"
3) "player2"

# 查看集合（按分数从高到低）
> ZREVRANGE leaderboard 0 -1
1) "player2"
2) "player3"
3) "player1"

# 带分数查看
> ZRANGE leaderboard 0 -1 WITHSCORES
1) "player1"
2) "100"
3) "player3"
4) "150"
5) "player2"
6) "200"

# 获取元素个数
> ZCARD leaderboard
(integer) 3

# 获取元素分数
> ZSCORE leaderboard "player1"
"100"

# 增加分数
> ZINCRBY leaderboard 50 "player1"
"150"

# 获取排名（从 0 开始，按分数从低到高）
> ZRANK leaderboard "player1"
(integer) 0

# 获取排名（按分数从高到低）
> ZREVRANK leaderboard "player1"
(integer) 2

# 按范围获取（按分数）
> ZRANGEBYSCORE leaderboard 100 150
1) "player1"
2) "player3"

# 按排名范围获取
> ZRANGE leaderboard 0 1
1) "player1"
2) "player3"

# 删除元素
> ZREM leaderboard "player1"
(integer) 1

# 按分数范围删除
> ZREMRANGEBYSCORE leaderboard 100 150
(integer) 2

# 按排名范围删除
> ZREMRANGEBYRANK leaderboard 0 1
(integer) 2
```

### 应用场景

| 场景 | 示例 |
| --- | --- |
| **排行榜** | 游戏积分、销售排行 |
| **延迟队列** | 用分数表示执行时间 |
| **带权重的任务** | 优先级任务队列 |
| **滑动窗口** | 限流、频率统计 |

---

## 7 核心知识点总结

| 类型 | 结构 | 特点 | 典型应用 |
| --- | --- | --- | --- |
| **String** | 键值对 | 简单、快速 | 缓存、计数器 |
| **Hash** | 字段-值映射 | 适合存储对象 | 用户信息、商品详情 |
| **List** | 有序列表 | 有序、可重复 | 消息队列、时间线 |
| **Set** | 无序集合 | 唯一、支持集合运算 | 标签、关注、去重 |
| **ZSet** | 带分数的集合 | 自动排序 | 排行榜、延迟队列 |

---

## 8 新手常见误区

### 误区 1："List 和 Set 都可以存储列表数据，随便用"

**错！** List 是有序的、可重复的；Set 是无序的、唯一的。如果需要保持顺序或允许重复，用 List；如果需要去重或集合运算，用 Set。

### 误区 2："Hash 比 String 存 JSON 更省内存，所以总是用 Hash"

**不一定。** Hash 在存储对象时确实更省内存，也方便部分更新。但如果对象很小或不需要部分更新，String 存 JSON 更简单直接。

### 误区 3："ZSet 的分数必须是整数"

**不对！** ZSet 的分数可以是浮点数，比如 `ZADD leaderboard 99.5 "player1"`。

### 误区 4："List 适合做消息队列，生产环境都用它"

**不推荐。** Redis List 实现的队列功能简单，不支持消息确认、重试等高级特性。生产环境建议使用专业的消息队列如 RabbitMQ、Kafka，或 Redis Stream。

---

## 9 动手练习

### 练习 1：用户信息存储

使用 Hash 存储一个用户信息（姓名、年龄、邮箱、城市），然后：
1. 修改用户的年龄
2. 获取用户的所有信息
3. 删除城市字段

<details>
<summary>点击查看答案</summary>

```bash
# 设置用户信息
> HMSET user:1001 name "王五" age 28 email "wangwu@example.com" city "上海"
OK

# 修改年龄
> HSET user:1001 age 29
(integer) 0

# 获取所有信息
> HGETALL user:1001
1) "name"
2) "王五"
3) "age"
4) "29"
5) "email"
6) "wangwu@example.com"
7) "city"
8) "上海"

# 删除城市字段
> HDEL user:1001 city
(integer) 1
```

</details>

### 练习 2：实现排行榜

创建一个游戏排行榜，添加 5 个玩家的分数，然后：
1. 查看前 3 名
2. 查看某个玩家的排名
3. 给某个玩家加分

<details>
<summary>点击查看答案</summary>

```bash
# 添加玩家
> ZADD game:rank 100 "Alice" 200 "Bob" 150 "Charlie" 300 "David" 250 "Eve"
(integer) 5

# 查看前 3 名（从高到低）
> ZREVRANGE game:rank 0 2 WITHSCORES
1) "David"
2) "300"
3) "Eve"
4) "250"
5) "Bob"
6) "200"

# 查看 Alice 的排名（从高到低）
> ZREVRANK game:rank "Alice"
(integer) 4

# 给 Alice 加 200 分
> ZINCRBY game:rank 200 "Alice"
"300"

# 再次查看排名
> ZREVRANGE game:rank 0 -1 WITHSCORES
1) "Alice"
2) "300"
3) "David"
4) "300"
5) "Eve"
6) "250"
7) "Bob"
8) "200"
9) "Charlie"
10) "150"
```

</details>

### 练习 3（挑战）：实现简单的消息队列

使用 List 实现一个任务队列：
1. 生产者添加 3 个任务
2. 消费者取出任务并处理
3. 实现阻塞等待新任务

<details>
<summary>点击查看答案</summary>

```bash
# 生产者：添加任务
> LPUSH task:queue "发送邮件给用户1"
(integer) 1
> LPUSH task:queue "处理订单#1001"
(integer) 2
> LPUSH task:queue "生成报表"
(integer) 3

# 消费者：取出任务（从右侧，先进先出）
> RPOP task:queue
"发送邮件给用户1"

# 处理任务...
# 继续取出
> RPOP task:queue
"处理订单#1001"

# 阻塞等待新任务（等待 10 秒）
> BRPOP task:queue 10
# 如果队列为空，会等待 10 秒
# 如果有新任务，立即返回
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 的通用命令**——也就是适用于所有数据类型的操作命令。你会学到键操作、数据库管理、服务器管理等实用命令，这些是日常使用 Redis 的基础。
