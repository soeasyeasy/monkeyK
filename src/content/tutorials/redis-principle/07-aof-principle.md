---
title: "第7章：AOF 持久化原理"
description: "AOF 追加与重写、aofUseRdbPreamble 混合持久化、AOF 加载与刷盘策略"
---

# 第7章：AOF 持久化原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- AOF 是怎么记录数据的？为什么比 RDB 更安全？
- AOF 文件越来越大怎么办？重写是怎么工作的？
- 混合持久化是什么？它结合了 RDB 和 AOF 的哪些优点？
- AOF 的刷盘策略有哪些？哪种最安全？

这一章就是为了解答这些问题。我们会深入 **AOF 持久化的底层原理**，搞清楚 **追加与重写机制**，弄明白 **混合持久化与刷盘策略**。

---

## 1 为什么需要 AOF 持久化？

### 痛点分析

RDB 持久化有数据丢失的风险：

```
// RDB 的问题
save 900 1      // 900 秒内至少 1 个键变化才保存

// 如果在第 899 秒宕机，这 899 秒的数据就丢失了
```

### 解决方案

AOF（Append Only File）记录每个写命令：

```
// AOF 文件内容示例
*3\r\n$3\r\nSET\r\n$4\r\nname\r\n$5\r\nAlice\r\n
*3\r\n$3\r\nSET\r\n$3\r\nage\r\n$2\r\n20\r\n
*2\r\n$4\r\nINCR\r\n$5\r\ncount\r\n

// 每个写命令都被记录
// 恢复时重新执行这些命令
```

---

## 2 AOF 工作流程

### 2.1 命令追加

```
// AOF 追加流程
1. 客户端发送写命令
   ↓
2. 主进程执行命令
   ↓
3. 将命令追加到 AOF 缓冲区
   ↓
4. 根据刷盘策略写入磁盘
   ↓
5. 更新 AOF 文件
```

### 2.2 代码实现

```c
// AOF 追加的核心代码
void feedAppendOnlyFile(struct redisCommand *cmd, int dictid, robj **argv, int argc) {
    sds buf = sdsempty();
    
    // 1. 将命令转换为 RESP 协议
    buf = catAppendOnlyGenericCommand(buf, argc, argv);
    
    // 2. 追加到 AOF 缓冲区
    if (server.aof_state == AOF_ON) {
        server.aof_buf = sdscatlen(server.aof_buf, buf, sdslen(buf));
    }
    
    // 3. 如果正在重写，也追加到重写缓冲区
    if (server.aof_child_pid != -1) {
        aofRewriteBufferAppend(buf);
    }
    
    sdsfree(buf);
}
```

---

## 3 AOF 刷盘策略

### 3.1 三种策略

| 策略 | 配置 | 说明 | 安全性 | 性能 |
|------|------|------|--------|------|
| always | appendfsync always | 每次写入都刷盘 | 最高 | 最差 |
| everysec | appendfsync everysec | 每秒刷盘一次 | 中等 | 中等 |
| no | appendfsync no | 由操作系统决定 | 最低 | 最好 |

### 3.2 always 策略

```c
// always 策略：每次写入都刷盘
if (server.aof_fsync == AOF_FSYNC_ALWAYS) {
    aof_fsync(server.aof_fd);  // 强制刷盘
}
```

### 3.3 everysec 策略

```c
// everysec 策略：每秒刷盘一次
// 在 serverCron 中定时检查
int flushAppendOnlyFile(int force) {
    // 检查距离上次刷盘的时间
    if (server.aof_fsync == AOF_FSYNC_EVERYSEC) {
        now = time(NULL);
        if (now - server.aof_last_fsync > 1) {
            aof_fsync(server.aof_fd);
            server.aof_last_fsync = now;
        }
    }
}
```

打个比方：

> AOF 刷盘策略就像"写日记"：
> - always：每说一句话就写进日记（最安全，但最慢）
> - everysec：每秒写一次日记（折中方案）
> - no：等日记本满了再写（最快，但可能丢失）

---

## 4 AOF 重写

### 4.1 为什么需要重写？

```
// AOF 文件越来越大的问题
SET counter 1
INCR counter
INCR counter
INCR counter
// 记录了 4 个命令，但实际只需要 SET counter 4

// 重写可以压缩 AOF 文件
// 用最小的命令集表示当前数据
```

### 4.2 重写流程

```
// AOF 重写流程
1. 主进程 fork 子进程
   ↓
2. 子进程根据内存数据生成新的 AOF 文件
   ↓
3. 主进程继续处理命令，新命令追加到重写缓冲区
   ↓
4. 子进程完成后，主进程将重写缓冲区的命令追加到新 AOF 文件
   ↓
5. 用新 AOF 文件替换旧 AOF 文件
   ↓
6. 子进程退出
```

### 4.3 代码实现

```c
// AOF 重写的核心代码
int rewriteAppendOnlyFileBackground(void) {
    pid_t childpid;
    
    // fork 子进程
    childpid = fork();
    
    if (childpid == 0) {
        // 子进程
        // 1. 遍历数据库，生成新的 AOF 文件
        rewriteAppendOnlyFile(server.aof_filename);
        
        // 2. 退出
        exitFromChild(0);
    } else {
        // 父进程
        // 记录子进程 PID
        server.aof_child_pid = childpid;
        return C_OK;
    }
}

// 子进程生成 AOF 文件
int rewriteAppendOnlyFile(char *filename) {
    // 遍历所有数据库
    for (int j = 0; j < server.dbnum; j++) {
        redisDb *db = server.db + j;
        
        // 遍历所有键
        dictIterator *di = dictGetSafeIterator(db->dict);
        while ((de = dictNext(di)) != NULL) {
            // 生成命令
            cmd = rewriteCommand(db, key, val);
            rioWrite(&rdb, cmd);
        }
    }
}
```

---

## 5 混合持久化

### 5.1 为什么需要混合持久化？

```
// RDB 和 AOF 的对比
RDB：
- 优点：恢复快、文件小
- 缺点：数据丢失风险

AOF：
- 优点：数据安全
- 缺点：恢复慢、文件大

// 混合持久化：结合两者的优点
// 前半部分是 RDB 格式，后半部分是 AOF 格式
```

### 5.2 混合格式

```
// 混合持久化的文件结构
| RDB 格式数据 | AOF 格式增量命令 |

// 示例
// 前半部分：RDB 格式（二进制）
REDIS0011...

// 后半部分：AOF 格式（文本）
*3\r\n$3\r\nSET\r\n$4\r\nname\r\n$5\r\nAlice\r\n
```

### 5.3 配置与使用

```bash
# redis.conf 配置
aof-use-rdb-preamble yes  # 开启混合持久化（Redis 4.0+）

// 重写时：
// 1. 子进程将内存数据以 RDB 格式写入新 AOF 文件
// 2. 主进程将新命令以 AOF 格式追加到重写缓冲区
// 3. 子进程完成后，主进程将重写缓冲区追加到新 AOF 文件
```

### 5.4 加载流程

```
// 混合持久化的加载流程
1. 检查 AOF 文件开头是否是 RDB 格式
   ↓
2. 如果是，先加载 RDB 部分
   ↓
3. 再加载 AOF 部分的增量命令
   ↓
4. 恢复完成
```

打个比方：

> 混合持久化就像"拍照 + 记账"：
> - RDB 部分：拍一张照片（快照）
> - AOF 部分：记录之后的变化（记账）
> - 恢复时：先看照片，再按记账补充

---

## 6 AOF 加载流程

### 6.1 启动加载

```
// AOF 加载流程
1. 检查是否存在 AOF 文件
   ↓
2. 检查是否是混合格式
   ↓
3. 如果是混合格式，先加载 RDB 部分
   ↓
4. 逐行读取 AOF 命令
   ↓
5. 解析 RESP 协议
   ↓
6. 执行命令
   ↓
7. 加载完成
```

### 6.2 代码实现

```c
// AOF 加载的核心代码
int loadAppendOnlyFile(char *filename) {
    FILE *fp = fopen(filename, "r");
    
    // 1. 检查是否是 RDB 格式开头
    if (rioRead(&rdb, buf, 5) && memcmp(buf, "REDIS", 5) == 0) {
        // 混合格式，先加载 RDB
        rdbLoadRio(&rdb);
    }
    
    // 2. 逐行读取 AOF 命令
    while (1) {
        // 读取 RESP 协议
        argc = rioReadBulkArgc(&rdb);
        
        // 解析命令
        for (int i = 0; i < argc; i++) {
            argv[j] = rioReadBulkString(&rdb);
        }
        
        // 执行命令
        cmd = lookupCommand(argv[0]);
        cmd->proc(fakeClient);
    }
    
    fclose(fp);
    return C_OK;
}
```

---

## 7 AOF 文件修复

### 7.1 文件损坏

```
// AOF 文件可能损坏的情况
1. 服务器异常退出，最后一条命令没写完
2. 磁盘故障，部分数据丢失
3. 人为误操作，修改了 AOF 文件
```

### 7.2 修复工具

```bash
# 使用 redis-check-aof 修复
redis-check-aof --fix appendonly.aof

// 修复流程：
// 1. 找到最后一条完整的命令
// 2. 截断不完整的部分
// 3. 生成修复后的文件
```

---

## 8 AOF 优缺点

### 8.1 优点

| 优点 | 说明 |
|------|------|
| 数据安全 | 最多丢失 1 秒的数据（everysec 策略） |
| 可读性好 | AOF 文件是文本格式，可以手动编辑 |
| 混合持久化 | 结合 RDB 和 AOF 的优点 |

### 8.2 缺点

| 缺点 | 说明 |
|------|------|
| 文件大 | 比 RDB 文件大很多 |
| 恢复慢 | 需要逐条执行命令，比 RDB 慢 |
| 性能影响 | 刷盘策略影响性能 |

---

## 9 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| AOF 追加 | 记录每个写命令到 AOF 文件 |
| 刷盘策略 | always、everysec、no 三种策略 |
| AOF 重写 | 压缩 AOF 文件，用最小命令集表示数据 |
| 混合持久化 | RDB + AOF 结合，恢复快且数据安全 |
| 加载流程 | 先加载 RDB 部分，再执行 AOF 命令 |

---

## 10 新手常见误区

### 误区 1："AOF 比 RDB 安全，所以只用 AOF"

**不一定。** AOF 文件大、恢复慢。生产环境通常同时开启 RDB 和 AOF，或者使用混合持久化。

### 误区 2："everysec 策略不会丢失数据"

**错！** everysec 策略最多丢失 1 秒的数据。如果需要零丢失，应该使用 always 策略，但性能会下降。

### 误区 3："AOF 重写会阻塞主进程"

**不完全对。** AOF 重写在子进程执行，但 fork 操作会短暂阻塞主进程。重写期间主进程的命令会追加到重写缓冲区。

---

## 11 动手练习

### 练习 1：基础练习

**题目**：画出 AOF 的三种刷盘策略，说明它们的优缺点。

<details>
<summary>点击查看答案</summary>

```
三种刷盘策略：

1. always（每次刷盘）
   - 每次写入都调用 fsync
   - 优点：最安全，不丢失数据
   - 缺点：性能最差

2. everysec（每秒刷盘）
   - 每秒调用一次 fsync
   - 优点：折中方案，最多丢失 1 秒数据
   - 缺点：可能丢失 1 秒数据

3. no（操作系统决定）
   - 由操作系统决定何时刷盘
   - 优点：性能最好
   - 缺点：可能丢失大量数据
```

</details>

### 练习 2：进阶练习

**题目**：解释混合持久化的原理，说明它的优势。

<details>
<summary>点击查看答案</summary>

```
混合持久化原理：
1. AOF 重写时，子进程将内存数据以 RDB 格式写入新 AOF 文件
2. 主进程将新命令以 AOF 格式追加到重写缓冲区
3. 子进程完成后，主进程将重写缓冲区追加到新 AOF 文件
4. 最终文件：前半部分是 RDB，后半部分是 AOF

优势：
1. 恢复快：RDB 部分加载速度快
2. 数据安全：AOF 部分记录增量命令
3. 文件小：比纯 AOF 文件小很多
```

</details>

### 练习 3（挑战）：综合练习

**题目**：分析 AOF 重写期间的数据一致性，以及如何保证不丢失数据。

<details>
<summary>点击查看答案</summary>

```
AOF 重写期间的数据一致性：

1. fork 子进程
   - 子进程获得内存快照
   - 父子进程共享内存页（写时复制）

2. 子进程生成新 AOF 文件
   - 基于内存快照生成命令

3. 主进程继续处理命令
   - 新命令追加到 AOF 缓冲区
   - 同时追加到重写缓冲区

4. 子进程完成
   - 主进程将重写缓冲区追加到新 AOF 文件
   - 替换旧 AOF 文件

保证不丢失数据：
- 重写缓冲区记录所有新命令
- 子进程完成后，主进程追加缓冲区
- 最终文件包含所有数据
```

</details>

---

## 下一章预告

下一章我们会学习 **内存管理原理**——搞清楚 jemalloc 内存分配器、内存碎片的产生与治理、过期删除与内存淘汰策略的底层实现。
