---
title: "第14章：Redis 性能优化"
description: "Pipeline 批量操作、慢查询分析、性能监控工具"
---

# 第14章：Redis 性能优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Redis 性能不够好怎么办？
- 如何减少网络往返时间？
- 怎么找出慢查询？
- 有哪些性能监控工具？
- 生产环境如何优化 Redis？

这一章会详细讲解 Redis 性能优化的技巧和方法，帮你打造高性能的 Redis 应用。

---

## 1 为什么需要性能优化？

### 痛点分析

虽然 Redis 本身性能很好，但使用不当会导致性能问题：

- **网络延迟**：每次操作都需要网络往返，大量小操作会累积延迟
- **慢查询**：某些命令执行时间长，阻塞其他请求
- **内存碎片**：频繁删除导致内存碎片，影响性能
- **连接数过多**：大量客户端连接消耗资源

### 优化方向

| 方向 | 方法 |
| --- | --- |
| **减少网络往返** | Pipeline、批量操作 |
| **优化数据结构** | 选择合适的数据类型和编码 |
| **避免慢查询** | 分析慢查询日志，优化命令 |
| **监控性能** | 使用监控工具实时观察 |

---

## 2 Pipeline 批量操作

### 概念解释

Pipeline（管道）可以将多个命令打包一次性发送到服务器，减少网络往返次数。

打个比方：

> 普通操作就像每次寄一封信，都要跑一趟邮局。Pipeline 就像把 100 封信一起打包，只跑一趟邮局。

### 性能对比

```bash
# 普通方式：100 次网络往返
SET key1 value1  # 往返 1
SET key2 value2  # 往返 2
...
SET key100 value100  # 往返 100

# Pipeline：1 次网络往返
Pipeline {
  SET key1 value1
  SET key2 value2
  ...
  SET key100 value100
}
```

### Java 实现

```java
// 普通方式
public void normalSet() {
    long start = System.currentTimeMillis();
    for (int i = 0; i < 10000; i++) {
        redisTemplate.opsForValue().set("key" + i, "value" + i);
    }
    long end = System.currentTimeMillis();
    System.out.println("普通方式耗时：" + (end - start) + "ms");
}

// Pipeline 方式
public void pipelineSet() {
    long start = System.currentTimeMillis();
    
    redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
        for (int i = 0; i < 10000; i++) {
            connection.set(("key" + i).getBytes(), ("value" + i).getBytes());
        }
        return null;
    });
    
    long end = System.currentTimeMillis();
    System.out.println("Pipeline 方式耗时：" + (end - start) + "ms");
}

// 性能对比结果：
// 普通方式：约 1000-2000ms
// Pipeline 方式：约 50-100ms
// 性能提升 10-20 倍！
```

### 批量读取

```java
// 批量读取
public List<String> pipelineGet(List<String> keys) {
    List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
        for (String key : keys) {
            connection.get(key.getBytes());
        }
        return null;
    });
    
    return results.stream()
        .map(result -> result != null ? new String((byte[]) result) : null)
        .collect(Collectors.toList());
}
```

### 注意事项

```java
// ❌ 错误：Pipeline 中不能使用依赖前一个命令结果的操作
redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
    connection.set("key".getBytes(), "value".getBytes());
    connection.get("key".getBytes()); // 获取的是旧值
    return null;
});

// ✅ 正确：Pipeline 中的命令是独立的
redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
    connection.set("key1".getBytes(), "value1".getBytes());
    connection.set("key2".getBytes(), "value2".getBytes());
    connection.set("key3".getBytes(), "value3".getBytes());
    return null;
});
```

---

## 3 慢查询分析

### 配置慢查询日志

```conf
# redis.conf

# 慢查询阈值（微秒），默认 10000（10 毫秒）
slowlog-log-slower-than 10000

# 慢查询日志最大长度
slowlog-max-len 128
```

### 查看慢查询

```bash
# 查看慢查询数量
> SLOWLOG LEN
(integer) 5

# 查看最近的慢查询
> SLOWLOG GET 10
1) 1) (integer) 5           # 慢查询 ID
   2) (integer) 1600000000  # 时间戳
   3) (integer) 15000       # 执行时间（微秒）
   4) 1) "KEYS"              # 命令
      2) "*"
   5) "127.0.0.1:6379"      # 客户端地址
   6) ""                    # 客户端名称

# 重置慢查询日志
> SLOWLOG RESET
OK
```

### 常见慢查询

| 命令 | 问题 | 解决方案 |
| --- | --- | --- |
| **KEYS *** | 遍历所有键，O(N) | 使用 SCAN 代替 |
| **HGETALL** | 大 Hash 操作慢 | 使用 HMGET 获取指定字段 |
| **SMEMBERS** | 大 Set 操作慢 | 使用 SSCAN 分批获取 |
| **LRANGE** | 大 List 操作慢 | 限制范围或分批获取 |
| **DEL** | 删除大键阻塞 | 使用 UNLINK 异步删除 |

### 优化示例

```java
// ❌ 错误：使用 KEYS 遍历
public List<String> getAllUserKeys() {
    Set<String> keys = redisTemplate.keys("user:*");
    return new ArrayList<>(keys);
}

// ✅ 正确：使用 SCAN 分批获取
public List<String> scanUserKeys() {
    List<String> keys = new ArrayList<>();
    ScanOptions options = ScanOptions.scanOptions().match("user:*").count(100).build();
    
    try (Cursor<byte[]> cursor = redisTemplate.getConnectionFactory()
            .getConnection().scan(options)) {
        while (cursor.hasNext()) {
            keys.add(new String(cursor.next()));
        }
    }
    
    return keys;
}

// ❌ 错误：删除大键
redisTemplate.delete("large:hash");

// ✅ 正确：异步删除
redisTemplate.unlink("large:hash");
```

---

## 4 性能监控工具

### redis-cli --stat

```bash
# 实时监控 Redis 状态
$ redis-cli --stat
------- data ------ --------------------- load -------------------- - child -
keys       mem      clients blocked requests            connections children
10         1.00M    1       0       100                 100         0
10         1.00M    1       0       150                 101         0
10         1.00M    1       0       200                 102         0
```

### redis-cli --latency

```bash
# 测试网络延迟
$ redis-cli --latency
min: 0, max: 5, avg: 1.23 (408 samples)
```

### INFO 命令

```bash
# 查看服务器信息
> INFO

# 查看内存信息
> INFO memory

# 查看统计信息
> INFO stats

# 查看客户端连接
> INFO clients

# 查看复制信息
> INFO replication
```

### 监控指标

| 指标 | 说明 | 告警阈值 |
| --- | --- | --- |
| **used_memory** | 已使用内存 | > maxmemory * 80% |
| **connected_clients** | 连接数 | > 1000 |
| **instantaneous_ops_per_sec** | 每秒操作数 | 根据业务需求 |
| **keyspace_hits** | 缓存命中数 | 命中率 < 80% |
| **keyspace_misses** | 缓存未命中数 | 命中率 < 80% |
| **blocked_clients** | 阻塞客户端数 | > 0 |

### 缓存命中率计算

```java
// 计算缓存命中率
public double getCacheHitRate() {
    Properties info = redisTemplate.getConnectionFactory()
        .getConnection().info("stats");
    
    long hits = Long.parseLong(info.getProperty("keyspace_hits"));
    long misses = Long.parseLong(info.getProperty("keyspace_misses"));
    
    if (hits + misses == 0) {
        return 0;
    }
    
    return (double) hits / (hits + misses);
}
```

---

## 5 内存优化

### 选择合适的数据结构

```java
// ❌ 不推荐：用 String 存储对象
redisTemplate.opsForValue().set("user:1", 
    "{\"name\":\"Alice\",\"age\":25,\"email\":\"alice@example.com\"}");

// ✅ 推荐：用 Hash 存储对象
redisTemplate.opsForHash().putAll("user:1", Map.of(
    "name", "Alice",
    "age", "25",
    "email", "alice@example.com"
));
// 节省 30-50% 内存
```

### 特殊编码优化

```conf
# redis.conf

# Hash 优化（元素少时使用 ziplist）
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# List 优化
list-max-ziplist-size -2

# Set 优化（整数集合）
set-max-intset-entries 512

# ZSet 优化
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
```

### 内存碎片处理

```bash
# 查看内存碎片率
> INFO memory
mem_fragmentation_ratio:2.5  # 碎片率 > 1.5 需要处理

# 方法 1：重启 Redis（最彻底）
$ redis-cli shutdown
$ redis-server redis.conf

# 方法 2：主动碎片整理（Redis 4.0+）
> CONFIG SET activedefrag yes
OK
```

---

## 6 连接池优化

### Lettuce 连接池配置

```yaml
spring:
  redis:
    host: 127.0.0.1
    port: 6379
    password: yourpassword
    lettuce:
      pool:
        max-active: 100    # 最大连接数
        max-idle: 50       # 最大空闲连接
        min-idle: 10       # 最小空闲连接
        max-wait: 5000ms   # 获取连接最大等待时间
```

### 连接池监控

```java
@Component
public class RedisPoolMonitor {
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    @Scheduled(fixedRate = 60000) // 每分钟检查一次
    public void monitorPool() {
        if (redisTemplate.getConnectionFactory() instanceof LettuceConnectionFactory) {
            LettuceConnectionFactory factory = 
                (LettuceConnectionFactory) redisTemplate.getConnectionFactory();
            
            // 获取连接池信息
            // 实际项目中可以通过 JMX 或 Metrics 获取
            System.out.println("Redis 连接池监控...");
        }
    }
}
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Pipeline** | 批量操作，减少网络往返 |
| **慢查询** | SLOWLOG 查看，避免 KEYS、大键操作 |
| **监控工具** | redis-cli、INFO、监控指标 |
| **内存优化** | 选择合适的数据结构和编码 |
| **连接池** | 合理配置连接池参数 |

---

## 8 新手常见误区

### 误区 1："Pipeline 可以替代事务"

**错！** Pipeline 只是批量发送命令，不保证原子性。如果需要原子性，应该使用事务或 Lua 脚本。

### 误区 2："KEYS 命令在生产环境可以用"

**绝对不行！** KEYS 命令会遍历所有键，时间复杂度 O(N)，会阻塞 Redis。生产环境必须使用 SCAN。

### 误区 3："连接数越多性能越好"

**不对！** 连接数过多会消耗大量资源。应该使用连接池，合理配置最大连接数。

### 误区 4："内存碎片不影响性能"

**错！** 内存碎片会浪费内存空间，碎片率过高时应该处理。可以使用 activedefrag 或重启 Redis。

---

## 9 动手练习

### 练习 1：Pipeline 批量操作

使用 Pipeline 批量写入 10000 个键值对，并对比普通方式的性能。

<details>
<summary>点击查看答案</summary>

```java
public class PipelineTest {
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    @Test
    public void testPipeline() {
        // 普通方式
        long start = System.currentTimeMillis();
        for (int i = 0; i < 10000; i++) {
            redisTemplate.opsForValue().set("normal:" + i, "value" + i);
        }
        long normalTime = System.currentTimeMillis() - start;
        
        // Pipeline 方式
        start = System.currentTimeMillis();
        redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (int i = 0; i < 10000; i++) {
                connection.set(("pipeline:" + i).getBytes(), ("value" + i).getBytes());
            }
            return null;
        });
        long pipelineTime = System.currentTimeMillis() - start;
        
        System.out.println("普通方式：" + normalTime + "ms");
        System.out.println("Pipeline 方式：" + pipelineTime + "ms");
        System.out.println("性能提升：" + (normalTime / pipelineTime) + "倍");
    }
}
```

</details>

### 练习 2：慢查询分析

配置慢查询日志，找出执行时间超过 10ms 的命令。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 配置慢查询阈值
> CONFIG SET slowlog-log-slower-than 10000
OK

# 2. 执行一些操作
> KEYS *  # 这个会是慢查询
> SET key1 value1
> GET key1

# 3. 查看慢查询
> SLOWLOG GET 10
1) 1) (integer) 1
   2) (integer) 1600000000
   3) (integer) 15000  # 15ms
   4) 1) "KEYS"
      2) "*"

# 4. 分析慢查询原因
# KEYS * 会遍历所有键，应该用 SCAN 代替
```

</details>

### 练习 3（挑战）：性能监控

实现一个简单的 Redis 性能监控工具，每分钟采集一次关键指标。

<details>
<summary>点击查看答案</summary>

```java
@Component
public class RedisMonitor {
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    @Scheduled(fixedRate = 60000)
    public void monitor() {
        Properties info = redisTemplate.getConnectionFactory()
            .getConnection().info();
        
        // 内存使用
        String usedMemory = info.getProperty("used_memory_human");
        
        // 连接数
        String connectedClients = info.getProperty("connected_clients");
        
        // 每秒操作数
        String opsPerSec = info.getProperty("instantaneous_ops_per_sec");
        
        // 缓存命中率
        long hits = Long.parseLong(info.getProperty("keyspace_hits"));
        long misses = Long.parseLong(info.getProperty("keyspace_misses"));
        double hitRate = (hits + misses) > 0 ? 
            (double) hits / (hits + misses) * 100 : 0;
        
        // 记录日志
        System.out.println(String.format(
            "Redis 监控 - 内存：%s, 连接数：%s, QPS：%s, 命中率：%.2f%%",
            usedMemory, connectedClients, opsPerSec, hitRate
        ));
        
        // 告警
        if (hitRate < 80) {
            System.err.println("警告：缓存命中率过低！");
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 安全与权限**——也就是如何保护 Redis 的安全。你会学到 ACL 访问控制、网络安全配置、SSL/TLS 加密等安全特性，掌握如何构建安全的 Redis 环境。
