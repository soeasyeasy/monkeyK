---
title: "第13章：事务与 Lua 脚本原理"
description: "MULTI/EXEC 实现原理、WATCH 乐观锁机制、Lua 脚本原子执行与 redis.call"
---

# 第13章：事务与 Lua 脚本原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 的事务是怎么实现的？和数据库事务有什么区别？
- WATCH 乐观锁是怎么工作的？和 MULTI 怎么配合？
- Lua 脚本为什么能原子执行？底层是怎么实现的？
- redis.call 和 redis.pcall 有什么区别？

这一章就是为了解答这些问题。我们会深入 **事务与 Lua 脚本的底层原理**，搞清楚 **MULTI/EXEC 与 WATCH 机制**，弄明白 **Lua 脚本的原子执行原理**。

---

## 1 为什么需要事务？

### 痛点分析

多个命令需要原子执行：

```bash
# 转账操作
DECR account:A 100  # A 减少 100
INCR account:B 100  # B 增加 100

# 问题：
# 如果第一个命令执行后，第二个命令失败
# A 的钱减少了，但 B 的钱没增加
# 数据不一致
```

### 解决方案

Redis 事务：

```bash
# 使用事务
MULTI
DECR account:A 100
INCR account:B 100
EXEC

# 要么全部执行，要么全部不执行
```

---

## 2 事务实现原理

### 2.1 事务状态

```c
// 客户端的事务状态
typedef struct client {
    multiState mstate;      // 事务状态
    int flags;              // 客户端标志
    // ...
} client;

// 事务状态
typedef struct multiState {
    multiCmd *commands;     // 命令数组
    int count;              // 命令数量
} multiState;

// 事务命令
typedef struct multiCmd {
    robj **argv;            // 命令参数
    int argc;               // 参数数量
    struct redisCommand *cmd;  // 命令对象
} multiCmd;
```

### 2.2 MULTI 命令

```c
// MULTI 命令的实现
void multiCommand(client *c) {
    // 检查是否已经在事务中
    if (c->flags & CLIENT_MULTI) {
        addReplyError(c, "MULTI calls can not be nested");
        return;
    }
    
    // 设置事务标志
    c->flags |= CLIENT_MULTI;
    
    // 返回 OK
    addReply(c, shared.ok);
}
```

### 2.3 命令入队

```c
// 事务中的命令不会立即执行，而是入队
void processCommand(client *c) {
    // 检查是否在事务中
    if (c->flags & CLIENT_MULTI) {
        // 命令入队
        queueMultiCommand(c);
        addReply(c, shared.queued);
        return;
    }
    
    // 正常执行命令
    call(c, CMD_CALL_FULL);
}

// 命令入队
void queueMultiCommand(client *c) {
    multiState *ms = &c->mstate;
    
    // 扩展命令数组
    ms->commands = zrealloc(ms->commands, sizeof(multiCmd) * (ms->count + 1));
    
    // 添加命令
    multiCmd *mc = ms->commands + ms->count;
    mc->cmd = c->cmd;
    mc->argc = c->argc;
    mc->argv = c->argv;
    
    ms->count++;
}
```

### 2.4 EXEC 命令

```c
// EXEC 命令的实现
void execCommand(client *c) {
    // 检查是否在事务中
    if (!(c->flags & CLIENT_MULTI)) {
        addReplyError(c, "EXEC without MULTI");
        return;
    }
    
    // 检查 WATCH 的键是否被修改
    if (c->flags & CLIENT_DIRTY_EXEC) {
        addReply(c, shared.abort);
        discardTransaction(c);
        return;
    }
    
    // 执行所有命令
    execCommandPropagateMulti(c);
    
    for (int j = 0; j < c->mstate.count; j++) {
        // 执行命令
        call(c, CMD_CALL_FULL);
    }
    
    // 清理事务状态
    discardTransaction(c);
}
```

打个比方：

> Redis 事务就像"打包快递"：
> - MULTI：开始打包
> - 命令入队：把物品放进箱子
> - EXEC：封箱并发送
> - 要么全部发出，要么全部不发

---

## 3 WATCH 乐观锁

### 3.1 为什么需要 WATCH？

```bash
# 问题：竞态条件
# 客户端 A 和 B 同时读取 balance = 100

A: GET balance  → 100
B: GET balance  → 100

A: SET balance 50   # A 认为余额是 100，花掉 50
B: SET balance 0    # B 认为余额是 100，花掉 100

# 最终 balance = 0，但实际应该拒绝 B 的操作
```

### 3.2 WATCH 实现

```c
// WATCH 命令的实现
void watchCommand(client *c) {
    // 遍历所有键
    for (int j = 1; j < c->argc; j++) {
        // 将键添加到监视列表
        watchForKey(c, c->argv[j]);
    }
    
    addReply(c, shared.ok);
}

// 监视键
void watchForKey(client *c, robj *key) {
    // 获取键的监视列表
    list *clients = dictFetchValue(c->db->watched_keys, key);
    
    if (clients == NULL) {
        // 创建新的监视列表
        clients = listCreate();
        dictAdd(c->db->watched_keys, key, clients);
    }
    
    // 将客户端添加到列表
    listAddNodeTail(clients, c);
    
    // 将键添加到客户端的监视列表
    listAddNodeTail(c->watched_keys, key);
}
```

### 3.3 键修改通知

```c
// 键被修改时，通知所有监视该键的客户端
void touchWatchedKey(redisDb *db, robj *key) {
    list *clients = dictFetchValue(db->watched_keys, key);
    
    if (clients == NULL) return;
    
    // 遍历所有监视该键的客户端
    listIter li;
    listNode *ln;
    listRewind(clients, &li);
    
    while ((ln = listNext(&li)) != NULL) {
        client *c = ln->value;
        // 标记客户端为脏状态
        c->flags |= CLIENT_DIRTY_EXEC;
    }
}
```

### 3.4 EXEC 检查

```c
// EXEC 时检查键是否被修改
void execCommand(client *c) {
    // 检查 CLIENT_DIRTY_EXEC 标志
    if (c->flags & CLIENT_DIRTY_EXEC) {
        // 键被修改，事务失败
        addReply(c, shared.abort);
        discardTransaction(c);
        return;
    }
    
    // 正常执行事务
    // ...
}
```

打个比方：

> WATCH 就像"给商品贴标签"：
> - 监视键：给商品贴上"我正在关注"的标签
> - 键被修改：有人动了商品，标签自动提醒
> - EXEC 时检查：结账时检查标签，如果被碰过就放弃购买

---

## 4 Lua 脚本

### 4.1 为什么需要 Lua 脚本？

```bash
# 事务的局限
1. 不支持条件判断
2. 无法根据结果决定下一步
3. 命令必须提前确定

# Lua 脚本的优势
1. 支持条件判断
2. 可以根据结果决定下一步
3. 原子执行，不会被中断
```

### 4.2 Lua 脚本执行

```bash
# 使用 EVAL 执行 Lua 脚本
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue

# 参数说明
# KEYS[1]：第一个键参数（mykey）
# ARGV[1]：第一个值参数（myvalue）
```

### 4.3 Lua 环境

```c
// Lua 环境的初始化
lua_State *lua = lua_open();

// 注册 Redis 函数
lua_register(lua, "redis.call", redisCallCommand);
lua_register(lua, "redis.pcall", redisPCallCommand);
lua_register(lua, "redis.log", redisLogCommand);

// 设置全局变量
lua_pushstring(lua, "mykey");
lua_setglobal(lua, "KEYS[1]");
```

### 4.4 redis.call vs redis.pcall

```lua
-- redis.call：执行命令，失败时抛出错误
redis.call('SET', 'key', 'value')
-- 如果命令失败，脚本停止执行

-- redis.pcall：执行命令，失败时返回错误对象
local result = redis.pcall('SET', 'key', 'value')
if type(result) == 'table' and result.err then
    -- 处理错误
    redis.log(redis.LOG_WARNING, result.err)
end
```

### 4.5 原子执行

```c
// Lua 脚本的原子执行
// 脚本执行期间，不会被其他命令中断

void evalCommand(client *c) {
    // 1. 加载 Lua 脚本
    lua_State *lua = server.lua;
    
    // 2. 设置参数
    luaSetGlobalArray(lua, "KEYS", c->argv, c->argc);
    luaSetGlobalArray(lua, "ARGV", c->argv + c->argc, c->argc);
    
    // 3. 执行脚本
    int err = lua_pcall(lua, 0, 1, 0);
    
    // 4. 处理结果
    if (err) {
        addReplyError(lua, lua_tostring(lua, -1));
    } else {
        // 将 Lua 结果转换为 Redis 响应
        luaReplyToRedisReply(c, lua);
    }
    
    // 5. 清理
    luaSetGlobalArray(lua, "KEYS", NULL, 0);
    luaSetGlobalArray(lua, "ARGV", NULL, 0);
}
```

打个比方：

> Lua 脚本就像"自动售货机"：
> - 投入硬币（传入参数）
> - 选择商品（执行脚本）
> - 机器内部处理（原子执行）
> - 吐出商品（返回结果）
> - 整个过程不会被中断

---

## 5 脚本缓存

### 5.1 SCRIPT LOAD

```bash
# 预加载脚本
SCRIPT LOAD "return redis.call('SET', KEYS[1], ARGV[1])"
# 返回 SHA1 校验和：a1b2c3d4...

# 使用 EVALSHA 执行
EVALSHA a1b2c3d4... 1 mykey myvalue
```

### 5.2 缓存机制

```c
// 脚本缓存
// 使用 SHA1 作为键，脚本作为值

dict *scripts;  // SHA1 → script

// 加载脚本
void scriptLoadCommand(client *c) {
    // 计算 SHA1
    char sha1[41];
    sha1_hex(c->argv[1]->ptr, sdslen(c->argv[1]->ptr), sha1);
    
    // 缓存脚本
    dictAdd(server.lua_scripts, sha1, c->argv[1]->ptr);
    
    addReplyBulkCBuffer(c, sha1, 40);
}

// 执行缓存的脚本
void evalShaCommand(client *c) {
    // 查找缓存
    sds script = dictFetchValue(server.lua_scripts, c->argv[1]->ptr);
    
    if (script == NULL) {
        addReplyError(c, "NOSCRIPT");
        return;
    }
    
    // 执行脚本
    evalGenericCommand(c, 1);
}
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| MULTI/EXEC | 事务命令，命令入队后批量执行 |
| WATCH | 乐观锁，监视键是否被修改 |
| Lua 脚本 | 支持条件判断，原子执行 |
| redis.call | 执行命令，失败时抛出错误 |
| redis.pcall | 执行命令，失败时返回错误对象 |
| 脚本缓存 | 使用 SHA1 缓存脚本，避免重复传输 |

---

## 7 新手常见误区

### 误区 1："Redis 事务支持回滚"

**错！** Redis 事务不支持回滚。如果命令执行失败，其他命令仍然会执行。这是为了保持简单和高效。

### 误区 2："WATCH 可以监视多个键"

**对的。** WATCH 可以监视多个键，只要其中一个被修改，事务就会失败。

### 误区 3："Lua 脚本可以执行任意 Redis 命令"

**不完全对。** Lua 脚本可以执行大部分 Redis 命令，但不能执行阻塞命令（如 BLPOP）和事务命令（如 MULTI）。

---

## 8 动手练习

### 练习 1：基础练习

**题目**：解释 Redis 事务的实现原理，说明 MULTI/EXEC 的工作流程。

<details>
<summary>点击查看答案</summary>

```
Redis 事务实现原理：

1. MULTI 命令
   - 设置 CLIENT_MULTI 标志
   - 进入事务模式

2. 命令入队
   - 事务中的命令不会立即执行
   - 而是添加到 multiState.commands 数组

3. EXEC 命令
   - 检查 WATCH 的键是否被修改
   - 如果修改，返回 ABORT
   - 否则，依次执行所有命令
   - 清理事务状态

工作流程：
MULTI → 命令入队 → EXEC → 批量执行
```

</details>

### 练习 2：进阶练习

**题目**：解释 WATCH 乐观锁的实现原理，说明它如何防止竞态条件。

<details>
<summary>点击查看答案</summary>

```
WATCH 乐观锁实现原理：

1. WATCH 命令
   - 将键添加到 watched_keys 字典
   - 将客户端添加到键的监视列表

2. 键修改通知
   - 键被修改时，调用 touchWatchedKey
   - 遍历监视该键的所有客户端
   - 设置 CLIENT_DIRTY_EXEC 标志

3. EXEC 检查
   - 检查 CLIENT_DIRTY_EXEC 标志
   - 如果标志被设置，返回 ABORT
   - 否则，执行事务

防止竞态条件：
- 客户端 A 监视 balance
- 客户端 B 修改 balance
- A 的 EXEC 检查发现 balance 被修改，事务失败
- A 可以重试，避免数据不一致
```

</details>

### 练习 3（挑战）：综合练习

**题目**：编写一个 Lua 脚本，实现原子性的转账操作。

<details>
<summary>点击查看答案</summary>

```lua
-- 转账脚本
-- KEYS[1]: 源账户
-- KEYS[2]: 目标账户
-- ARGV[1]: 转账金额

local from = KEYS[1]
local to = KEYS[2]
local amount = tonumber(ARGV[1])

-- 获取源账户余额
local balance = tonumber(redis.call('GET', from))

-- 检查余额是否足够
if balance < amount then
    return {ok = false, error = "Insufficient balance"}
end

-- 执行转账
redis.call('DECRBY', from, amount)
redis.call('INCRBY', to, amount)

return {ok = true, balance = balance - amount}
```

使用方式：
```bash
EVAL "脚本内容" 2 account:A account:B 100
```

</details>

---

## 下一章预告

下一章我们会学习 **Pipeline 与网络通信原理**——搞清楚 RESP 协议、Pipeline 批量原理、客户端缓冲区、大 Key 与慢命令影响分析。
