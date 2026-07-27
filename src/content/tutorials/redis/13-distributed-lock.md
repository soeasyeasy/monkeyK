---
title: "第13章：Redis 分布式锁"
description: "SETNX 实现、Redlock 算法、锁超时与续期"
---

# 第13章：Redis 分布式锁

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是分布式锁？为什么需要它？
- Redis 如何实现分布式锁？
- SETNX 实现锁有什么问题？
- 什么是 Redlock 算法？
- 锁超时和续期怎么处理？

这一章会详细讲解 Redis 分布式锁的实现原理和最佳实践，帮你掌握如何在分布式系统中安全地共享资源。

---

## 1 为什么需要分布式锁？

### 痛点分析

在单机环境下，我们可以使用 `synchronized` 或 `ReentrantLock` 来保证线程安全。但在分布式环境下，多个服务实例运行在不同的机器上，本地锁无法跨机器工作。

想象一下这个场景：

```
电商秒杀活动：
- 商品库存 100 件
- 3 个服务实例同时处理订单
- 每个实例都检查库存 > 0，然后扣减库存
- 结果：超卖，实际卖出 300 件
```

### 解决方案

分布式锁可以在分布式环境下保证互斥访问，常见实现方案：

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| **数据库锁** | 实现简单 | 性能差，单点故障 |
| **Redis 锁** | 性能好，实现简单 | 需要处理超时、续期 |
| **ZooKeeper 锁** | 强一致性 | 性能较差，依赖 ZK |

---

## 2 Redis 分布式锁原理

### 核心思想

Redis 分布式锁的核心思想：

```
加锁：SET key value NX EX timeout
- NX：只有 key 不存在时才设置成功
- EX：设置过期时间，防止死锁

解锁：删除 key
- 需要验证锁的归属，防止误删别人的锁
```

### 基本实现

```java
public class RedisLock {
    private StringRedisTemplate redisTemplate;
    private String lockKey;
    private String lockValue; // 唯一标识
    private int expireSeconds;
    
    public RedisLock(StringRedisTemplate redisTemplate, String lockKey, int expireSeconds) {
        this.redisTemplate = redisTemplate;
        this.lockKey = lockKey;
        this.lockValue = UUID.randomUUID().toString();
        this.expireSeconds = expireSeconds;
    }
    
    // 加锁
    public boolean tryLock() {
        // SET key value NX EX timeout（原子操作）
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, lockValue, expireSeconds, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(result);
    }
    
    // 解锁
    public void unlock() {
        // 先检查锁的归属，再删除
        String currentValue = redisTemplate.opsForValue().get(lockKey);
        if (lockValue.equals(currentValue)) {
            redisTemplate.delete(lockKey);
        }
    }
}

// 使用示例
public void seckill(Long productId) {
    RedisLock lock = new RedisLock(redisTemplate, "lock:product:" + productId, 10);
    
    try {
        if (lock.tryLock()) {
            // 获取锁成功，执行业务逻辑
            reduceStock(productId);
        } else {
            // 获取锁失败，快速返回或重试
            throw new RuntimeException("系统繁忙，请稍后重试");
        }
    } finally {
        lock.unlock();
    }
}
```

### 问题一：解锁的原子性

上面的实现中，检查和删除是两个操作，不是原子的。可能出现：

```
线程 A：检查锁是自己的
线程 A：准备删除锁
线程 A：锁过期了（业务执行时间超过超时时间）
线程 B：获取到锁
线程 A：删除锁（误删了线程 B 的锁）
```

**解决方案：使用 Lua 脚本保证原子性**

```java
public void unlock() {
    String luaScript = 
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]) " +
        "else " +
        "    return 0 " +
        "end";
    
    redisTemplate.execute(
        new DefaultRedisScript<>(luaScript, Long.class),
        Collections.singletonList(lockKey),
        lockValue
    );
}
```

### 问题二：锁超时

如果业务执行时间超过锁的超时时间，锁会自动释放，导致多个线程同时持有锁。

**解决方案：锁续期（Watch Dog 机制）**

```java
public class RedisLockWithRenew {
    private StringRedisTemplate redisTemplate;
    private String lockKey;
    private String lockValue;
    private int expireSeconds;
    private ScheduledExecutorService scheduler;
    private ScheduledFuture<?> renewTask;
    
    public RedisLockWithRenew(StringRedisTemplate redisTemplate, String lockKey, int expireSeconds) {
        this.redisTemplate = redisTemplate;
        this.lockKey = lockKey;
        this.lockValue = UUID.randomUUID().toString();
        this.expireSeconds = expireSeconds;
        this.scheduler = Executors.newScheduledThreadPool(1);
    }
    
    public boolean tryLock() {
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, lockValue, expireSeconds, TimeUnit.SECONDS);
        
        if (Boolean.TRUE.equals(result)) {
            // 启动续期任务（每 expireSeconds/3 续期一次）
            startRenewTask();
            return true;
        }
        return false;
    }
    
    private void startRenewTask() {
        renewTask = scheduler.scheduleAtFixedRate(() -> {
            // 检查锁是否还是自己的
            String currentValue = redisTemplate.opsForValue().get(lockKey);
            if (lockValue.equals(currentValue)) {
                // 续期
                redisTemplate.expire(lockKey, expireSeconds, TimeUnit.SECONDS);
            }
        }, expireSeconds / 3, expireSeconds / 3, TimeUnit.SECONDS);
    }
    
    public void unlock() {
        // 停止续期任务
        if (renewTask != null) {
            renewTask.cancel(false);
        }
        
        // 删除锁
        String luaScript = 
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";
        
        redisTemplate.execute(
            new DefaultRedisScript<>(luaScript, Long.class),
            Collections.singletonList(lockKey),
            lockValue
        );
        
        scheduler.shutdown();
    }
}
```

---

## 3 Redlock 算法

### 问题背景

在 Redis 主从架构中，如果主节点挂了，锁可能还没同步到从节点就发生了故障转移，导致多个客户端同时持有锁。

### Redlock 原理

Redlock 是 Redis 作者提出的分布式锁算法，使用多个独立的 Redis 实例（通常是 5 个）来实现锁。

```
加锁流程：
1. 获取当前时间（毫秒）
2. 依次向所有 Redis 实例请求加锁
3. 计算加锁耗时
4. 如果在超过一半的实例上加锁成功，且总耗时小于锁的有效期，则认为加锁成功
5. 否则加锁失败，向所有实例释放锁
```

### Redlock 实现

```java
public class RedLock {
    private List<StringRedisTemplate> redisInstances;
    private String lockKey;
    private String lockValue;
    private int expireMillis;
    private int quorum; // 半数以上
    
    public RedLock(List<StringRedisTemplate> redisInstances, String lockKey, int expireMillis) {
        this.redisInstances = redisInstances;
        this.lockKey = lockKey;
        this.lockValue = UUID.randomUUID().toString();
        this.expireMillis = expireMillis;
        this.quorum = redisInstances.size() / 2 + 1;
    }
    
    public boolean tryLock() {
        long startTime = System.currentTimeMillis();
        int successCount = 0;
        
        // 1. 依次向所有实例请求加锁
        for (StringRedisTemplate redis : redisInstances) {
            try {
                Boolean result = redis.opsForValue()
                    .setIfAbsent(lockKey, lockValue, expireMillis, TimeUnit.MILLISECONDS);
                if (Boolean.TRUE.equals(result)) {
                    successCount++;
                }
            } catch (Exception e) {
                // 某个实例失败，继续尝试其他实例
            }
        }
        
        // 2. 计算耗时
        long elapsed = System.currentTimeMillis() - startTime;
        
        // 3. 判断是否成功
        if (successCount >= quorum && elapsed < expireMillis) {
            return true;
        }
        
        // 4. 失败则释放所有锁
        unlock();
        return false;
    }
    
    public void unlock() {
        String luaScript = 
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";
        
        for (StringRedisTemplate redis : redisInstances) {
            try {
                redis.execute(
                    new DefaultRedisScript<>(luaScript, Long.class),
                    Collections.singletonList(lockKey),
                    lockValue
                );
            } catch (Exception e) {
                // 忽略异常
            }
        }
    }
}

// 配置多个 Redis 实例
@Configuration
public class RedLockConfig {
    @Bean
    public List<StringRedisTemplate> redisInstances() {
        List<StringRedisTemplate> instances = new ArrayList<>();
        
        // 创建 5 个独立的 Redis 连接
        for (int i = 0; i < 5; i++) {
            RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
            config.setHostName("192.168.1." + (100 + i));
            config.setPort(6379);
            
            LettuceConnectionFactory factory = new LettuceConnectionFactory(config);
            factory.afterPropertiesSet();
            
            StringRedisTemplate template = new StringRedisTemplate(factory);
            instances.add(template);
        }
        
        return instances;
    }
}
```

### Redlock 争议

Redlock 算法存在争议，主要问题：

1. **时钟跳跃问题**：如果某个节点的时钟发生跳跃，可能导致锁提前过期
2. **GC 停顿问题**：客户端 GC 停顿期间，锁可能已过期
3. **网络延迟问题**：网络延迟可能导致加锁失败

**建议**：
- 如果对一致性要求极高，建议使用 ZooKeeper
- 如果可以容忍小概率的不一致，可以使用单节点 Redis 锁
- Redlock 适用于对一致性要求较高，但可以容忍小概率失败的场景

---

## 4 Redisson 分布式锁

Redisson 是一个基于 Redis 的 Java 驻内存数据网格，提供了开箱即用的分布式锁实现。

### 基本使用

```java
// 引入依赖
// <dependency>
//     <groupId>org.redisson</groupId>
//     <artifactId>redisson-spring-boot-starter</artifactId>
//     <version>3.17.7</version>
// </dependency>

// 配置 Redisson
@Configuration
public class RedissonConfig {
    @Bean
    public RedissonClient redissonClient() {
        Config config = new Config();
        config.useSingleServer()
            .setAddress("redis://127.0.0.1:6379")
            .setPassword("yourpassword");
        return Redisson.create(config);
    }
}

// 使用分布式锁
@Service
public class SeckillService {
    @Autowired
    private RedissonClient redissonClient;
    
    public void seckill(Long productId) {
        RLock lock = redissonClient.getLock("lock:product:" + productId);
        
        try {
            // 尝试加锁（等待 3 秒，锁持有 10 秒）
            boolean acquired = lock.tryLock(3, 10, TimeUnit.SECONDS);
            
            if (acquired) {
                // 获取锁成功，执行业务逻辑
                reduceStock(productId);
            } else {
                // 获取锁失败
                throw new RuntimeException("系统繁忙，请稍后重试");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            // 释放锁
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}
```

### Redisson 的优势

1. **Watch Dog 机制**：自动续期，防止锁超时
2. **可重入锁**：支持同一个线程多次获取同一把锁
3. **公平锁**：支持公平锁模式
4. **红锁**：内置 Redlock 实现
5. **读写锁**：支持读写分离的锁

### 配置 Watch Dog

```java
// Redisson 默认开启 Watch Dog，锁超时时间默认 30 秒
// 可以通过配置修改
Config config = new Config();
config.useSingleServer()
    .setAddress("redis://127.0.0.1:6379")
    .setLockWatchdogTimeout(30000); // 30 秒
```

---

## 5 分布式锁最佳实践

### 锁的粒度

```java
// ❌ 错误：锁粒度太大
public void processOrder(Order order) {
    RLock lock = redissonClient.getLock("lock:order");
    try {
        lock.lock();
        // 处理订单...
    } finally {
        lock.unlock();
    }
}

// ✅ 正确：锁粒度细化到具体资源
public void processOrder(Order order) {
    RLock lock = redissonClient.getLock("lock:order:" + order.getId());
    try {
        lock.lock();
        // 处理订单...
    } finally {
        lock.unlock();
    }
}
```

### 超时时间设置

```java
// ❌ 错误：超时时间设置不合理
lock.lock(); // 默认 30 秒，可能不够

// ✅ 正确：根据业务执行时间设置
// 预估业务执行时间 5 秒，设置 10 秒超时
lock.tryLock(0, 10, TimeUnit.SECONDS);
```

### 异常处理

```java
// ❌ 错误：异常时没有释放锁
public void process() {
    RLock lock = redissonClient.getLock("lock:resource");
    lock.lock();
    // 业务逻辑（可能抛出异常）
    lock.unlock(); // 异常时不会执行
}

// ✅ 正确：使用 try-finally
public void process() {
    RLock lock = redissonClient.getLock("lock:resource");
    try {
        lock.lock();
        // 业务逻辑
    } finally {
        if (lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }
}
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **基本原理** | SETNX + 过期时间 |
| **原子解锁** | Lua 脚本保证原子性 |
| **锁续期** | Watch Dog 机制 |
| **Redlock** | 多节点实现，解决主从切换问题 |
| **Redisson** | 开箱即用的分布式锁库 |
| **最佳实践** | 合理设置粒度、超时时间、异常处理 |

---

## 7 新手常见误区

### 误区 1："SETNX 后设置过期时间是安全的"

**错！** `SETNX` 和 `EXPIRE` 是两个命令，不是原子的。如果 `SETNX` 成功后进程崩溃，锁永远不会过期。应该使用 `SET key value NX EX timeout` 原子命令。

### 误区 2："锁的超时时间设置越长越好"

**不对！** 超时时间太长会导致资源占用，太短会导致业务未完成锁就释放。应该根据业务执行时间合理设置，并使用 Watch Dog 自动续期。

### 误区 3："Redlock 是完美的分布式锁"

**不准确！** Redlock 存在时钟跳跃、GC 停顿等问题，不能保证 100% 的一致性。对一致性要求极高的场景建议使用 ZooKeeper。

### 误区 4："有了分布式锁就不需要数据库乐观锁"

**错！** 分布式锁只能保证互斥访问，不能保证数据一致性。关键业务应该结合数据库乐观锁或事务来保证数据正确性。

---

## 8 动手练习

### 练习 1：实现简单的分布式锁

使用 Redis 实现一个分布式锁：
1. 使用 SETNX 加锁
2. 设置过期时间
3. 使用 Lua 脚本解锁

<details>
<summary>点击查看答案</summary>

```java
public class SimpleRedisLock {
    private StringRedisTemplate redisTemplate;
    private String lockKey;
    private String lockValue;
    private int expireSeconds;
    
    public SimpleRedisLock(StringRedisTemplate redisTemplate, String lockKey, int expireSeconds) {
        this.redisTemplate = redisTemplate;
        this.lockKey = lockKey;
        this.lockValue = UUID.randomUUID().toString();
        this.expireSeconds = expireSeconds;
    }
    
    public boolean tryLock() {
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, lockValue, expireSeconds, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(result);
    }
    
    public void unlock() {
        String luaScript = 
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";
        
        redisTemplate.execute(
            new DefaultRedisScript<>(luaScript, Long.class),
            Collections.singletonList(lockKey),
            lockValue
        );
    }
}

// 使用示例
public void test() {
    SimpleRedisLock lock = new SimpleRedisLock(redisTemplate, "test:lock", 10);
    try {
        if (lock.tryLock()) {
            System.out.println("获取锁成功");
            // 业务逻辑
        }
    } finally {
        lock.unlock();
    }
}
```

</details>

### 练习 2：实现带续期的分布式锁

实现一个带 Watch Dog 机制的分布式锁：
1. 加锁成功后启动定时任务
2. 定时检查锁是否还是自己的
3. 如果是，续期锁

<details>
<summary>点击查看答案</summary>

```java
public class RedisLockWithWatchDog {
    private StringRedisTemplate redisTemplate;
    private String lockKey;
    private String lockValue;
    private int expireSeconds;
    private ScheduledExecutorService scheduler;
    private ScheduledFuture<?> watchDog;
    
    public RedisLockWithWatchDog(StringRedisTemplate redisTemplate, String lockKey, int expireSeconds) {
        this.redisTemplate = redisTemplate;
        this.lockKey = lockKey;
        this.lockValue = UUID.randomUUID().toString();
        this.expireSeconds = expireSeconds;
        this.scheduler = Executors.newScheduledThreadPool(1);
    }
    
    public boolean tryLock() {
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, lockValue, expireSeconds, TimeUnit.SECONDS);
        
        if (Boolean.TRUE.equals(result)) {
            startWatchDog();
            return true;
        }
        return false;
    }
    
    private void startWatchDog() {
        // 每 expireSeconds/3 检查一次
        watchDog = scheduler.scheduleAtFixedRate(() -> {
            String currentValue = redisTemplate.opsForValue().get(lockKey);
            if (lockValue.equals(currentValue)) {
                redisTemplate.expire(lockKey, expireSeconds, TimeUnit.SECONDS);
                System.out.println("Watch Dog: 锁已续期");
            }
        }, expireSeconds / 3, expireSeconds / 3, TimeUnit.SECONDS);
    }
    
    public void unlock() {
        if (watchDog != null) {
            watchDog.cancel(false);
        }
        
        String luaScript = 
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";
        
        redisTemplate.execute(
            new DefaultRedisScript<>(luaScript, Long.class),
            Collections.singletonList(lockKey),
            lockValue
        );
        
        scheduler.shutdown();
    }
}
```

</details>

### 练习 3（挑战）：使用 Redisson 实现秒杀

使用 Redisson 实现一个秒杀功能：
1. 使用分布式锁保证库存扣减的原子性
2. 处理并发请求
3. 验证库存正确性

<details>
<summary>点击查看答案</summary>

```java
@Service
public class SeckillService {
    @Autowired
    private RedissonClient redissonClient;
    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private OrderMapper orderMapper;
    
    public Order seckill(Long productId, Long userId) {
        RLock lock = redissonClient.getLock("lock:seckill:" + productId);
        
        try {
            // 尝试加锁（等待 3 秒，锁持有 10 秒）
            boolean acquired = lock.tryLock(3, 10, TimeUnit.SECONDS);
            
            if (!acquired) {
                throw new RuntimeException("系统繁忙，请稍后重试");
            }
            
            // 1. 查询库存
            Product product = productMapper.selectById(productId);
            if (product == null || product.getStock() <= 0) {
                throw new RuntimeException("商品已售罄");
            }
            
            // 2. 扣减库存
            int updated = productMapper.decreaseStock(productId);
            if (updated == 0) {
                throw new RuntimeException("库存不足");
            }
            
            // 3. 创建订单
            Order order = new Order();
            order.setProductId(productId);
            order.setUserId(userId);
            order.setOrderTime(new Date());
            orderMapper.insert(order);
            
            return order;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("系统异常");
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}

// 测试类
@SpringBootTest
public class SeckillTest {
    @Autowired
    private SeckillService seckillService;
    
    @Test
    public void testSeckill() throws InterruptedException {
        int threadCount = 100;
        CountDownLatch latch = new CountDownLatch(threadCount);
        
        for (int i = 0; i < threadCount; i++) {
            new Thread(() -> {
                try {
                    Order order = seckillService.seckill(1L, (long) (i % 10 + 1));
                    System.out.println("秒杀成功：" + order.getId());
                } catch (Exception e) {
                    System.out.println("秒杀失败：" + e.getMessage());
                } finally {
                    latch.countDown();
                }
            }).start();
        }
        
        latch.await();
        System.out.println("秒杀结束");
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 性能优化**——也就是如何提升 Redis 的性能。你会学到 Pipeline 批量操作、慢查询分析、性能监控工具等优化技巧，掌握如何打造高性能的 Redis 应用。
