---
title: "第5章：Redis 事务与 Lua 脚本"
description: "MULTI/EXEC 事务、WATCH 乐观锁、Lua 脚本执行"
---

# 第5章：Redis 事务与 Lua 脚本

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 事务和数据库事务有什么区别？
- 如何保证多个命令的原子性？
- 什么是乐观锁？WATCH 怎么用？
- Lua 脚本有什么优势？
- 如何在 Redis 中执行复杂逻辑？

这一章会详细讲解 Redis 的事务机制和 Lua 脚本，帮你掌握如何保证命令的原子性和执行复杂逻辑。

---

## 1 为什么需要事务和 Lua 脚本？

### 痛点分析

想象一下这个场景：你要实现一个转账功能，从用户 A 转账 100 元给用户 B。这需要两步操作：

1. 用户 A 余额减少 100 元
2. 用户 B 余额增加 100 元

如果第一步执行成功，第二步执行失败，就会导致数据不一致。

### 解决方案

Redis 提供了两种方式来保证操作的原子性：

| 方式 | 特点 | 适用场景 |
| --- | --- | --- |
| **事务** | 批量执行命令，保证顺序 | 简单的批量操作 |
| **Lua 脚本** | 原子执行，支持复杂逻辑 | 复杂的业务逻辑 |

---

## 2 Redis 事务

### 概念解释

Redis 事务通过 MULTI、EXEC、DISCARD 命令实现，可以保证一批命令被顺序执行，期间不会被其他客户端打断。

打个比方：

> Redis 事务就像你去银行办理业务：你先告诉柜员要办理哪些业务（MULTI），然后柜员把这些业务记录下来，最后一次性执行（EXEC）。如果中途取消（DISCARD），所有操作都不会执行。

### 基础用法

```bash
# 开始事务
> MULTI
OK

# 命令入队
> SET account:A 900
QUEUED
> SET account:B 1100
QUEUED

# 执行事务
> EXEC
1) OK
2) OK

# 查看结果
> GET account:A
"900"
> GET account:B
"1100"
```

### 事务特点

| 特性 | 说明 |
| --- | --- |
| **原子性** | 事务中的命令要么全部执行，要么全部不执行 |
| **顺序性** | 命令按顺序执行 |
| **隔离性** | 事务执行期间不会被其他客户端打断 |
| **不支持回滚** | 如果某个命令执行失败，其他命令仍会执行 |

### 事务的错误处理

```bash
# 语法错误（整个事务不会执行）
> MULTI
OK
> SETTX key value  # 错误的命令
(error) ERR unknown command
> DISCARD  # 必须取消事务
OK

# 运行时错误（其他命令仍会执行）
> MULTI
OK
> SET count 0
QUEUED
> INCR count  # 正常执行
QUEUED
> INCR name   # 运行时错误（name 不是数字）
QUEUED
> INCR count  # 正常执行
QUEUED
> EXEC
1) OK
2) (integer) 1
3) (error) ERR value is not an integer
4) (integer) 2
```

### WATCH 乐观锁

```bash
# 场景：检查余额后转账
> WATCH account:A
OK

# 检查余额
> GET account:A
"1000"

# 开始事务
> MULTI
OK

# 执行转账
> DECRBY account:A 100
QUEUED
> INCRBY account:B 100
QUEUED

# 执行事务
> EXEC
1) (integer) 900
2) (integer) 1100

# 如果在 WATCH 后，account:A 被其他客户端修改，EXEC 会返回 nil
```

### WATCH 实现原理

```bash
# 客户端 1
> WATCH account:A
OK
> GET account:A
"1000"

# 客户端 2（在客户端 1 执行 EXEC 前修改了 account:A）
> SET account:A 500
OK

# 客户端 1
> MULTI
OK
> DECRBY account:A 100
QUEUED
> EXEC
(nil)  # 事务被取消，因为 account:A 被修改过

# 需要重试
```

---

## 3 Lua 脚本

### 概念解释

Lua 脚本可以在 Redis 服务器端原子执行，支持复杂的逻辑控制，是 Redis 事务的增强版。

打个比方：

> Lua 脚本就像给 Redis 写了一个小程序，可以在服务器端执行复杂的业务逻辑，避免多次网络往返，保证原子性。

### 基础用法

```bash
# 简单脚本
> EVAL "return 'Hello Redis'" 0
"Hello Redis"

# 带参数的脚本
> EVAL "return KEYS[1]" 1 mykey
"mykey"

> EVAL "return ARGV[1]" 0 myarg
"myarg"

# 设置键值
> EVAL "redis.call('SET', KEYS[1], ARGV[1]); return 'OK'" 1 mykey myvalue
"OK"
> GET mykey
"myvalue"
```

### 转账示例

```bash
# Lua 脚本实现转账
local from_balance = redis.call('GET', KEYS[1])
local to_balance = redis.call('GET', KEYS[2])
local amount = tonumber(ARGV[1])

if tonumber(from_balance) >= amount then
    redis.call('DECRBY', KEYS[1], amount)
    redis.call('INCRBY', KEYS[2], amount)
    return 'OK'
else
    return 'Insufficient balance'
end

# 执行脚本
> EVAL "..." 2 account:A account:B 100
"OK"
```

### 脚本缓存

```bash
# 加载脚本到服务器
> SCRIPT LOAD "return 'Hello'"
"5d3a3b8b1e8e6e6e6e6e6e6e6e6e6e6e6e6e6e6e"

# 执行缓存的脚本
> EVALSHA 5d3a3b8b1e8e6e6e6e6e6e6e6e6e6e6e6e6e6e6e 0
"Hello"

# 检查脚本是否存在
> SCRIPT EXISTS 5d3a3b8b1e8e6e6e6e6e6e6e6e6e6e6e6e6e6e6e
1) (integer) 1

# 清除脚本缓存
> SCRIPT FLUSH
OK
```

### 脚本优势

| 优势 | 说明 |
| --- | --- |
| **原子性** | 整个脚本作为一个原子执行 |
| **减少网络往返** | 一次调用执行多个命令 |
| **复用** | 脚本可以缓存，多次调用 |
| **复杂逻辑** | 支持条件判断、循环等 |

---

## 4 事务 vs Lua 脚本

| 特性 | 事务 | Lua 脚本 |
| --- | --- | --- |
| **原子性** | 命令顺序执行，但不支持回滚 | 完全原子，出错可回滚 |
| **复杂逻辑** | 不支持 | 支持条件、循环 |
| **性能** | 多次网络往返 | 一次网络往返 |
| **可读性** | 命令清晰 | 需要学习 Lua 语法 |
| **适用场景** | 简单批量操作 | 复杂业务逻辑 |

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **事务命令** | MULTI、EXEC、DISCARD |
| **乐观锁** | WATCH 监控键变化 |
| **Lua 脚本** | EVAL、EVALSHA、SCRIPT |
| **选择建议** | 简单操作用事务，复杂逻辑用 Lua |

---

## 6 新手常见误区

### 误区 1："Redis 事务支持回滚"

**错！** Redis 事务不支持回滚。如果某个命令执行失败，其他命令仍会执行。如果需要回滚，应该用 Lua 脚本。

### 误区 2："WATCH 可以监控多个键"

**不对！** WATCH 可以监控多个键，只要其中一个被修改，事务就会被取消。

```bash
> WATCH key1 key2 key3
OK
```

### 误区 3："Lua 脚本可以执行很长时间"

**不是的！** Lua 脚本执行时间过长会阻塞 Redis。建议脚本执行时间控制在毫秒级，复杂逻辑应该拆分。

### 误区 4："事务和 Lua 脚本可以混用"

**不能！** 事务中的命令不能包含 Lua 脚本。如果需要原子执行 Lua 脚本，直接用 EVAL 即可。

---

## 7 动手练习

### 练习 1：基础事务

使用事务实现以下操作：
1. 设置 user:1 的余额为 1000
2. 设置 user:2 的余额为 500
3. 从 user:1 转账 200 给 user:2

<details>
<summary>点击查看答案</summary>

```bash
# 初始化余额
> SET user:1:balance 1000
OK
> SET user:2:balance 500
OK

# 开始事务
> MULTI
OK

# 转账操作
> DECRBY user:1:balance 200
QUEUED
> INCRBY user:2:balance 200
QUEUED

# 执行事务
> EXEC
1) (integer) 800
2) (integer) 700

# 验证结果
> GET user:1:balance
"800"
> GET user:2:balance
"700"
```

</details>

### 练习 2：Lua 脚本实现库存扣减

实现一个库存扣减脚本：
1. 检查库存是否充足
2. 如果充足，扣减库存并返回成功
3. 如果不充足，返回失败

<details>
<summary>点击查看答案</summary>

```bash
# Lua 脚本
local stock = tonumber(redis.call('GET', KEYS[1]))
local amount = tonumber(ARGV[1])

if stock >= amount then
    redis.call('DECRBY', KEYS[1], amount)
    return 'OK'
else
    return 'Insufficient stock'
end

# 初始化库存
> SET product:1001:stock 100
OK

# 扣减库存
> EVAL "..." 1 product:1001:stock 30
"OK"

# 再次扣减（超过库存）
> EVAL "..." 1 product:1001:stock 80
"Insufficient stock"

# 查看库存
> GET product:1001:stock
"70"
```

</details>

### 练习 3（挑战）：乐观锁实现

使用 WATCH 实现一个安全的转账：
1. 监控账户余额
2. 检查余额是否充足
3. 执行转账
4. 如果被其他客户端修改，重试

<details>
<summary>点击查看答案</summary>

```bash
# 初始化账户
> SET account:A 1000
OK
> SET account:B 500
OK

# 安全的转账逻辑（伪代码）
while true do
    -- 监控账户 A
    redis.call('WATCH', 'account:A')
    
    -- 检查余额
    local balance = tonumber(redis.call('GET', 'account:A'))
    local amount = 200
    
    if balance >= amount then
        -- 开始事务
        redis.call('MULTI')
        redis.call('DECRBY', 'account:A', amount)
        redis.call('INCRBY', 'account:B', amount)
        
        -- 执行事务
        local result = redis.call('EXEC')
        if result ~= nil then
            return 'OK'
        end
    else
        return 'Insufficient balance'
    end
    
    -- 如果 EXEC 返回 nil，说明被其他客户端修改，重试
end
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 的持久化机制**——也就是如何将内存中的数据保存到磁盘。你会学到 RDB 快照、AOF 日志、混合持久化等持久化方式，掌握如何保证数据的安全性。
