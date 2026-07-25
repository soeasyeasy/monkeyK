---
title: "第11章：Redis 缓存设计模式"
description: "Cache Aside、Read/Write Through、Write Behind 模式"
---

# 第11章：Redis 缓存设计模式

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 缓存应该怎么用？直接查缓存不行吗？
- 缓存和数据库的数据怎么保持一致？
- 有哪些经典的缓存设计模式？
- 应该选择哪种模式？
- 缓存更新策略怎么设计？

这一章会详细讲解 Redis 缓存的经典设计模式，帮你掌握如何设计高效的缓存架构。

---

## 11.1 为什么需要缓存设计模式？

### 痛点分析

直接使用缓存看似简单，但面临这些问题：

- **数据不一致**：缓存和数据库的数据不同步
- **缓存穿透**：查询不存在的数据，每次都打到数据库
- **缓存击穿**：热点 key 过期，大量请求同时打到数据库
- **缓存雪崩**：大量 key 同时过期，数据库压力骤增

### 解决方案

经典的缓存设计模式提供了标准化的解决方案：

| 模式 | 读操作 | 写操作 | 适用场景 |
| --- | --- | --- | --- |
| **Cache Aside** | 先查缓存，没有查数据库 | 先更新数据库，再删除缓存 | 通用场景 |
| **Read Through** | 缓存层负责加载数据 | 同 Cache Aside | 读多写少 |
| **Write Through** | 同 Cache Aside | 同时更新缓存和数据库 | 写操作重要 |
| **Write Behind** | 同 Cache Aside | 只更新缓存，异步写数据库 | 写多读少 |

---

## 11.2 Cache Aside 模式

### 概念解释

Cache Aside（旁路缓存）是最常用的缓存模式，应用程序直接管理缓存和数据库。

打个比方：

> Cache Aside 就像你去图书馆借书：先查书架（缓存），有就直接拿走；没有就去仓库（数据库）找，找到后放一本到书架上。

### 读流程

```
1. 先查缓存
2. 缓存命中，直接返回
3. 缓存未命中，查询数据库
4. 将数据写入缓存
5. 返回数据
```

### 写流程

```
1. 先更新数据库
2. 再删除缓存（不是更新缓存）
```

### 代码示例

```java
// 读操作
public User getUser(Long userId) {
    String key = "user:" + userId;
    
    // 1. 先查缓存
    User user = redisTemplate.opsForValue().get(key);
    if (user != null) {
        return user; // 缓存命中
    }
    
    // 2. 缓存未命中，查询数据库
    user = userMapper.selectById(userId);
    
    // 3. 写入缓存，设置过期时间
    if (user != null) {
        redisTemplate.opsForValue().set(key, user, 30, TimeUnit.MINUTES);
    }
    
    return user;
}

// 写操作
public void updateUser(User user) {
    // 1. 先更新数据库
    userMapper.updateById(user);
    
    // 2. 再删除缓存
    String key = "user:" + user.getId();
    redisTemplate.delete(key);
}
```

### 为什么删除缓存而不是更新缓存？

```
更新缓存的问题：
1. 并发写时可能出现数据不一致
2. 如果写操作失败，缓存中是脏数据
3. 浪费计算资源（如果没人读这个数据）

删除缓存的优势：
1. 懒加载，下次读取时再更新
2. 避免并发写的不一致问题
3. 保证数据最终一致性
```

---

## 11.3 Read Through 模式

### 概念解释

Read Through 是 Cache Aside 的改进版，由缓存层负责加载数据，应用程序不需要关心缓存未命中的情况。

打个比方：

> Read Through 就像有一个智能书架：你找书时，如果书架上没有，书架会自动去仓库帮你拿，你不需要自己跑仓库。

### 代码示例

```java
// 使用 Caffeine + Redis 实现 Read Through
Cache<Long, User> cache = Caffeine.newBuilder()
    .maximumSize(10000)
    .expireAfterWrite(30, TimeUnit.MINUTES)
    .build();

public User getUser(Long userId) {
    return cache.get(userId, id -> {
        // 缓存未命中时自动加载
        String redisKey = "user:" + id;
        User user = redisTemplate.opsForValue().get(redisKey);
        
        if (user == null) {
            user = userMapper.selectById(id);
            if (user != null) {
                redisTemplate.opsForValue().set(redisKey, user, 30, TimeUnit.MINUTES);
            }
        }
        
        return user;
    });
}
```

---

## 11.4 Write Through 模式

### 概念解释

Write Through 在写操作时同时更新缓存和数据库，保证数据一致性。

打个比方：

> Write Through 就像写日记时同时更新电子备份：你在日记本上写内容的同时，自动同步到云端备份，两边始终保持一致。

### 代码示例

```java
public void updateUser(User user) {
    // 1. 更新数据库
    userMapper.updateById(user);
    
    // 2. 同时更新缓存
    String key = "user:" + user.getId();
    redisTemplate.opsForValue().set(key, user, 30, TimeUnit.MINUTES);
}
```

### 优缺点

| 优点 | 缺点 |
| --- | --- |
| 数据一致性好 | 写操作延迟高 |
| 读取速度快 | 写操作复杂 |
| 缓存命中率高 | 可能写入不需要的数据 |

---

## 11.5 Write Behind 模式

### 概念解释

Write Behind（异步写入）只更新缓存，由后台线程异步将数据写入数据库。

打个比方：

> Write Behind 就像你在白板上记笔记，下课后由课代表统一抄到笔记本上。你只需要快速记录，不用每次都翻笔记本。

### 代码示例

```java
// 使用队列实现 Write Behind
BlockingQueue<User> writeQueue = new LinkedBlockingQueue<>();

// 写操作：只更新缓存，加入队列
public void updateUser(User user) {
    String key = "user:" + user.getId();
    redisTemplate.opsForValue().set(key, user, 30, TimeUnit.MINUTES);
    writeQueue.offer(user);
}

// 后台线程：异步写入数据库
@Scheduled(fixedDelay = 1000)
public void flushToDatabase() {
    List<User> batch = new ArrayList<>();
    writeQueue.drainTo(batch, 100);
    
    if (!batch.isEmpty()) {
        userMapper.batchUpdate(batch);
    }
}
```

### 优缺点

| 优点 | 缺点 |
| --- | --- |
| 写操作极快 | 可能丢失数据 |
| 合并写操作 | 数据一致性差 |
| 适合写多读少 | 实现复杂 |

---

## 11.6 模式对比与选择

### 对比表格

| 模式 | 读性能 | 写性能 | 一致性 | 复杂度 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| **Cache Aside** | 高 | 高 | 最终一致 | 低 | 通用场景 |
| **Read Through** | 高 | 高 | 最终一致 | 中 | 读多写少 |
| **Write Through** | 高 | 中 | 强一致 | 中 | 写操作重要 |
| **Write Behind** | 高 | 极高 | 弱一致 | 高 | 写多读少 |

### 选择建议

```
1. 大部分场景：Cache Aside
   - 简单、可靠、性能好

2. 读多写少：Read Through
   - 缓存层自动管理，代码简洁

3. 写操作重要：Write Through
   - 保证数据一致性

4. 写多读少：Write Behind
   - 极致写性能，允许数据丢失
```

---

## 11.7 缓存更新策略

### 过期时间设计

```java
// 基础过期时间
redisTemplate.opsForValue().set(key, value, 30, TimeUnit.MINUTES);

// 随机过期时间（避免缓存雪崩）
int randomSeconds = 1800 + new Random().nextInt(600); // 30-40 分钟
redisTemplate.opsForValue().set(key, value, randomSeconds, TimeUnit.SECONDS);

// 永不过期（需要主动更新）
redisTemplate.opsForValue().set(key, value);
```

### 主动更新策略

```java
// 数据变更时主动更新缓存
public void updateUser(User user) {
    // 1. 更新数据库
    userMapper.updateById(user);
    
    // 2. 删除缓存
    redisTemplate.delete("user:" + user.getId());
    
    // 3. 可选：异步预热缓存
    CompletableFuture.runAsync(() -> {
        User freshUser = userMapper.selectById(user.getId());
        redisTemplate.opsForValue().set("user:" + user.getId(), freshUser, 30, TimeUnit.MINUTES);
    });
}
```

---

## 11.8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| **Cache Aside** | 先查缓存，没有查数据库；先更新数据库，再删除缓存 |
| **Read Through** | 缓存层负责加载数据 |
| **Write Through** | 同时更新缓存和数据库 |
| **Write Behind** | 只更新缓存，异步写数据库 |
| **选择建议** | 大部分场景用 Cache Aside |

---

## 11.9 新手常见误区

### 误区 1："先删除缓存，再更新数据库"

**错！** 这样会导致并发问题：线程 A 删除缓存，线程 B 读取时缓存未命中，从数据库读取旧值并写入缓存，然后线程 A 更新数据库，导致缓存和数据库不一致。

正确做法：先更新数据库，再删除缓存。

### 误区 2："缓存应该设置固定过期时间"

**不推荐！** 固定过期时间会导致缓存雪崩。应该给过期时间加上随机值，避免大量 key 同时过期。

### 误区 3："缓存更新比删除更好"

**不一定！** 更新缓存在并发场景下可能导致数据不一致。删除缓存更安全，下次读取时再加载最新数据。

### 误区 4："Write Behind 模式最先进，应该总是用它"

**不对！** Write Behind 虽然写性能高，但可能丢失数据，实现复杂。大部分场景用 Cache Aside 就足够了。

---

## 11.10 动手练习

### 练习 1：Cache Aside 实现

实现一个 Cache Aside 模式的商品缓存：
1. 读取商品时先查缓存
2. 缓存未命中时查数据库并写入缓存
3. 更新商品时先更新数据库再删除缓存

<details>
<summary>点击查看答案</summary>

```java
@Service
public class ProductService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private ProductMapper productMapper;
    
    private static final String PRODUCT_KEY_PREFIX = "product:";
    private static final long PRODUCT_EXPIRE_MINUTES = 60;
    
    // 读操作
    public Product getProduct(Long id) {
        String key = PRODUCT_KEY_PREFIX + id;
        
        // 1. 先查缓存
        String json = redisTemplate.opsForValue().get(key);
        if (json != null) {
            return JSON.parseObject(json, Product.class);
        }
        
        // 2. 缓存未命中，查数据库
        Product product = productMapper.selectById(id);
        
        // 3. 写入缓存
        if (product != null) {
            redisTemplate.opsForValue().set(
                key, 
                JSON.toJSONString(product),
                PRODUCT_EXPIRE_MINUTES,
                TimeUnit.MINUTES
            );
        }
        
        return product;
    }
    
    // 写操作
    public void updateProduct(Product product) {
        // 1. 先更新数据库
        productMapper.updateById(product);
        
        // 2. 再删除缓存
        redisTemplate.delete(PRODUCT_KEY_PREFIX + product.getId());
    }
}
```

</details>

### 练习 2：随机过期时间

实现一个带随机过期时间的缓存，避免缓存雪崩：
1. 基础过期时间 30 分钟
2. 随机增加 0-10 分钟
3. 设置缓存

<details>
<summary>点击查看答案</summary>

```java
public void setCacheWithRandomExpire(String key, String value) {
    // 基础过期时间 30 分钟
    long baseExpire = 30 * 60;
    
    // 随机增加 0-10 分钟
    long randomExpire = new Random().nextInt(10 * 60);
    
    // 总过期时间
    long totalExpire = baseExpire + randomExpire;
    
    // 设置缓存
    redisTemplate.opsForValue().set(key, value, totalExpire, TimeUnit.SECONDS);
}

// 使用
setCacheWithRandomExpire("user:1001", "Alice");
```

</details>

### 练习 3（挑战）：缓存预热

实现一个缓存预热功能：
1. 系统启动时加载热点数据
2. 定时刷新缓存
3. 监控缓存命中率

<details>
<summary>点击查看答案</summary>

```java
@Component
public class CacheWarmer {
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private ProductMapper productMapper;
    
    // 系统启动时预热
    @PostConstruct
    public void warmUp() {
        // 加载热销商品
        List<Product> hotProducts = productMapper.selectHotProducts(100);
        for (Product product : hotProducts) {
            String key = "product:" + product.getId();
            redisTemplate.opsForValue().set(
                key,
                JSON.toJSONString(product),
                60,
                TimeUnit.MINUTES
            );
        }
    }
    
    // 定时刷新缓存（每小时）
    @Scheduled(fixedRate = 3600000)
    public void refreshCache() {
        warmUp();
    }
    
    // 监控缓存命中率
    @Scheduled(fixedRate = 60000)
    public void monitorCacheHitRate() {
        // 实际项目中可以通过 INFO stats 获取
        // keyspace_hits 和 keyspace_misses 计算命中率
        System.out.println("Cache hit rate monitoring...");
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 缓存问题实战**——也就是如何解决缓存穿透、缓存击穿、缓存雪崩这三大经典问题。你会学到每种问题的成因、影响和解决方案，掌握如何构建稳定的缓存系统。
