---
title: "第1章：Redis 简介与环境搭建"
description: "什么是 Redis，核心优势，安装配置，第一个 Redis 实例"
---

# 第1章：Redis 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Redis？它和 MySQL 有什么区别？
- 为什么 Redis 速度那么快？
- Redis 只能做缓存吗？还有哪些用途？
- 安装 Redis 复杂吗？怎么开始使用？

这一章就是为了解答这些问题。我们会先搞清楚 **Redis 是什么、为什么需要它**，再动手把环境搭好，为后面的学习打下基础。

---

## 1 为什么需要 Redis？

### 痛点分析

想象一下这个场景：你的电商网站访问量越来越大，用户每次打开商品详情页都要查询数据库。虽然 MySQL 性能不错，但面对每秒上万次的请求，数据库开始扛不住了，响应时间从 50ms 变成了 2 秒，用户体验急剧下降。

这就是经典的 **"数据库瓶颈"** 问题。

没有 Redis 之前，我们面临这些痛点：

- **数据库压力大**：所有请求都打到数据库，高并发时数据库扛不住
- **响应速度慢**：磁盘 I/O 成为瓶颈，复杂查询耗时较长
- **实时性差**：排行榜、计数器等需要频繁更新的功能，用数据库实现效率低
- **会话管理难**：分布式环境下，用户登录状态难以在多台服务器间共享

### 解决方案

Redis 的出现就是为了解决这些问题。它是一个 **内存数据库**，所有数据都存储在内存中，读写速度极快。

打个比方：

> 传统数据库就像去图书馆找书：你要先跑到书架前，找到书，再拿回来阅读。整个过程虽然可靠，但来回跑路很耗时。
>
> Redis 就像把书直接放在你的书桌上：伸手就能拿到，速度飞快。而且 Redis 还支持把常用的书提前放到桌上（缓存），这样就不用每次都跑图书馆了。

### 代码对比

没有 Redis 时查询商品信息：

```java
// ❌ 每次都查询数据库，高并发时性能差
public Product getProduct(Long id) {
    // 直接查询 MySQL，需要磁盘 I/O，耗时约 10-50ms
    return productMapper.selectById(id);
}

// 问题：每秒 1 万次请求时，数据库压力巨大
```

使用 Redis 缓存后：

```java
// ✅ 先查缓存，缓存没有再查数据库
public Product getProduct(Long id) {
    // 1. 先从 Redis 查询（内存操作，耗时约 0.1ms）
    String key = "product:" + id;
    Product product = redisTemplate.opsForValue().get(key);
    
    if (product != null) {
        return product; // 缓存命中，直接返回
    }
    
    // 2. 缓存没有，查询数据库
    product = productMapper.selectById(id);
    
    // 3. 放入缓存，设置过期时间 1 小时
    if (product != null) {
        redisTemplate.opsForValue().set(key, product, 1, TimeUnit.HOURS);
    }
    
    return product;
}

// 结果：90% 的请求直接从缓存读取，数据库压力大幅降低
```

> **一句话总结**：Redis 让你的应用从"每次都要跑图书馆"变成"书就在手边"，速度提升 10 倍以上。

---

## 2 Redis 是什么？

### 概念解释

Redis 是一个开源的 **内存数据结构存储系统**，它可以用作数据库、缓存和消息中间件。

关键词解析：

- **内存**：所有数据存储在内存中，读写速度极快
- **数据结构**：支持字符串、哈希、列表、集合等多种数据类型
- **存储系统**：不仅仅是缓存，还可以作为持久化数据库使用

打个比方：

> Redis 就像一个超级快的"数据仓库"，你可以通过"键"来存取数据。就像快递柜一样，你输入取件码（键），就能立刻拿到你的包裹（值），整个过程只需要几毫秒。

### Redis 核心优势

| 特性 | 说明 | 对比 MySQL |
| --- | --- | --- |
| **速度** | 读写速度极快，单机可达 10 万+ QPS | MySQL 约 5000-10000 QPS |
| **数据类型** | 支持 String、Hash、List、Set、ZSet 等 | 只支持关系型数据 |
| **持久化** | 支持 RDB 快照和 AOF 日志 | 天然支持 |
| **高可用** | 支持主从复制、哨兵、集群 | 需要额外配置 |
| **内存存储** | 数据在内存中，速度快 | 数据在磁盘，速度较慢 |

### Redis 应用场景

| 场景 | 说明 | 示例 |
| --- | --- | --- |
| **缓存** | 加速数据读取，减轻数据库压力 | 商品详情、用户信息缓存 |
| **会话管理** | 分布式 Session 共享 | 用户登录状态 |
| **排行榜** | 使用 ZSet 实现实时排行 | 游戏积分排行、热销商品 |
| **计数器** | 原子操作实现计数 | 文章阅读量、点赞数 |
| **分布式锁** | 控制分布式环境下的并发 | 防止重复提交、库存扣减 |
| **消息队列** | 简单的异步消息处理 | 订单处理、邮件发送 |

---

## 3 Redis 安装与配置

### Windows 安装

由于 Redis 官方不支持 Windows，我们可以使用以下两种方式：

#### 方式一：使用 WSL（推荐）

```bash
# 1. 安装 WSL（Windows Subsystem for Linux）
# 在 PowerShell（管理员）中执行：
wsl --install

# 2. 重启电脑后，打开 Ubuntu

# 3. 在 Ubuntu 中安装 Redis
sudo apt update
sudo apt install redis-server

# 4. 启动 Redis
sudo service redis-server start

# 5. 测试连接
redis-cli ping
# 输出 PONG 表示成功
```

#### 方式二：使用 Docker（最简单）

```bash
# 1. 拉取 Redis 镜像
docker pull redis:latest

# 2. 启动 Redis 容器
docker run -d --name my-redis -p 6379:6379 redis:latest

# 3. 连接到 Redis
docker exec -it my-redis redis-cli
```

### Mac 安装

```bash
# 使用 Homebrew 安装
brew install redis

# 启动 Redis
brew services start redis

# 或者前台运行
redis-server

# 测试连接
redis-cli ping
# 输出 PONG 表示成功
```

### Linux 安装

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# CentOS/RHEL
sudo yum install redis

# 启动 Redis
sudo systemctl start redis

# 设置开机自启
sudo systemctl enable redis

# 测试连接
redis-cli ping
```

### 配置文件说明

Redis 的配置文件通常位于 `/etc/redis/redis.conf`，以下是常用配置项：

```conf
# 绑定 IP，默认只允许本地访问
bind 127.0.0.1

# 端口号，默认 6379
port 6379

# 是否以守护进程运行
daemonize yes

# 日志级别：debug, verbose, notice, warning
loglevel notice

# 日志文件路径
logfile /var/log/redis/redis-server.log

# 数据库数量，默认 16 个（0-15）
databases 16

# 最大内存限制
maxmemory 2gb

# 内存淘汰策略
maxmemory-policy allkeys-lru

# RDB 持久化配置
save 900 1      # 900 秒内至少 1 个 key 变化，就保存
save 300 10     # 300 秒内至少 10 个 key 变化，就保存
save 60 10000   # 60 秒内至少 10000 个 key 变化，就保存

# AOF 持久化配置
appendonly yes
appendfsync everysec
```

---

## 4 第一个 Redis 实例

### 使用 redis-cli 连接

```bash
# 连接本地 Redis
redis-cli

# 连接远程 Redis
redis-cli -h 192.168.1.100 -p 6379

# 带密码连接
redis-cli -h 127.0.0.1 -p 6379 -a yourpassword
```

### 基础操作演示

```bash
# 设置字符串
> SET name "张三"
OK

# 获取字符串
> GET name
"张三"

# 设置过期时间（秒）
> SET code "123456" EX 60
OK

# 查看剩余时间
> TTL code
(integer) 55

# 自增操作
> INCR counter
(integer) 1
> INCR counter
(integer) 2

# 删除键
> DEL name
(integer) 1

# 查看键是否存在
> EXISTS name
(integer) 0

# 查看所有键
> KEYS *
1) "code"
2) "counter"

# 清空当前数据库
> FLUSHDB
OK
```

### 使用图形化客户端

推荐使用以下图形化工具：

| 工具 | 特点 | 平台 |
| --- | --- | --- |
| **RedisInsight** | 官方工具，功能强大，免费 | 跨平台 |
| **Another Redis Desktop Manager** | 开源免费，界面友好 | 跨平台 |
| **Medis** | Mac 专属，简洁美观 | Mac |

---

## 5 Redis 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Redis 是什么** | 内存数据结构存储系统，可用作数据库、缓存、消息队列 |
| **为什么快** | 数据在内存中、单线程避免锁竞争、I/O 多路复用 |
| **应用场景** | 缓存、会话管理、排行榜、计数器、分布式锁、消息队列 |
| **安装方式** | WSL、Docker、Homebrew、包管理器 |
| **配置文件** | redis.conf，常用配置：bind、port、maxmemory、save |
| **连接方式** | redis-cli 命令行、图形化客户端 |

---

## 6 新手常见误区

### 误区 1："Redis 只能做缓存"

**错！** Redis 不仅仅是缓存。它支持丰富的数据类型和持久化，完全可以作为主数据库使用。很多项目用 Redis 存储会话、排行榜、计数器等，甚至有些项目完全用 Redis 作为数据库。

正确做法：根据业务场景选择合适的用途，缓存只是 Redis 最常见的应用之一。

### 误区 2："Redis 数据会丢失，不安全"

不是的。Redis 支持两种持久化方式：
- **RDB**：定时快照，将内存数据保存到磁盘
- **AOF**：记录每次写操作，重启后重放恢复数据

合理配置持久化策略，Redis 的数据安全性是有保障的。

### 误区 3："Redis 是万能的，可以替代 MySQL"

**不对！** Redis 和 MySQL 各有所长：
- Redis 适合：高速缓存、简单数据结构、实时性要求高的场景
- MySQL 适合：复杂查询、事务处理、数据一致性要求高的场景

正确做法：两者配合使用，Redis 做缓存加速，MySQL 做持久化存储。

### 误区 4："Redis 单线程很慢"

**恰恰相反！** Redis 虽然是单线程，但正是因为单线程，避免了多线程的上下文切换和锁竞争，再加上内存操作和 I/O 多路复用，性能反而比很多多线程数据库更高。

---

## 7 动手练习

### 练习 1：基础操作

使用 redis-cli 完成以下操作：
1. 设置一个键值对 `user:1:name` 为 "李四"
2. 设置一个键值对 `user:1:age` 为 25
3. 获取这两个值
4. 设置 `verify:code` 为 "888888"，过期时间 5 分钟
5. 查看 `verify:code` 的剩余时间

<details>
<summary>点击查看答案</summary>

```bash
# 1. 设置用户名
> SET user:1:name "李四"
OK

# 2. 设置用户年龄
> SET user:1:age 25
OK

# 3. 获取值
> GET user:1:name
"李四"
> GET user:1:age
"25"

# 4. 设置验证码，过期时间 300 秒
> SET verify:code "888888" EX 300
OK

# 5. 查看剩余时间
> TTL verify:code
(integer) 295
```

</details>

### 练习 2：计数器应用

实现一个简单的文章阅读量统计：
1. 创建文章 `article:1001` 的阅读量，初始为 0
2. 每次访问时自增 1
3. 模拟 10 次访问
4. 获取最终阅读量

<details>
<summary>点击查看答案</summary>

```bash
# 1. 初始化阅读量为 0
> SET article:1001:views 0
OK

# 2-4. 模拟 10 次访问，每次自增
> INCR article:1001:views
(integer) 1
> INCR article:1001:views
(integer) 2
> INCR article:1001:views
(integer) 3
> INCR article:1001:views
(integer) 4
> INCR article:1001:views
(integer) 5
> INCR article:1001:views
(integer) 6
> INCR article:1001:views
(integer) 7
> INCR article:1001:views
(integer) 8
> INCR article:1001:views
(integer) 9
> INCR article:1001:views
(integer) 10

# 获取最终阅读量
> GET article:1001:views
"10"
```

</details>

### 练习 3（挑战）：批量操作

使用 Pipeline 批量设置 100 个用户的缓存，格式为 `user:{id}:name`，值为 `用户{id}`。

<details>
<summary>点击查看答案</summary>

```bash
# 使用 Pipeline 批量操作
> redis-cli --pipe <<EOF
SET user:1:name 用户1
SET user:2:name 用户2
SET user:3:name 用户3
...
SET user:100:name 用户100
EOF

# 或者在代码中使用（以 Java 为例）
```java
// Java 代码示例
List<String> keys = new ArrayList<>();
for (int i = 1; i <= 100; i++) {
    keys.add("user:" + i + ":name");
}

// 使用 Pipeline 批量设置
redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
    for (int i = 1; i <= 100; i++) {
        connection.set(("user:" + i + ":name").getBytes(), 
                      ("用户" + i).getBytes());
    }
    return null;
});
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 的数据类型**——也就是 Redis 支持的各种数据存储方式。你会学到 String、Hash、List、Set、ZSet 这五种基础类型的使用方法、适用场景和常用命令。这些是 Redis 的核心基础，掌握它们才能灵活运用 Redis。
