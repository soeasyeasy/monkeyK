---
title: "第12章：Redis 缓存问题实战"
description: "缓存穿透、缓存击穿、缓存雪崩解决方案"
---

# 第12章：Redis 缓存问题实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是缓存穿透？怎么解决？
- 什么是缓存击穿？和穿透有什么区别？
- 什么是缓存雪崩？为什么这么危险？
- 这些问题在生产环境中怎么预防？
- 有没有一劳永逸的解决方案？

这一章会详细讲解缓存三大经典问题的成因、影响和解决方案，帮你构建稳定的缓存系统。

---

## 12.1 为什么需要解决缓存问题？

### 痛点分析

缓存虽然能提升性能，但使用不当会引发严重问题：

- **缓存穿透**：查询不存在的数据，每次都打到数据库，缓存形同虚设
- **缓存击穿**：热点 key 过期，大量并发请求同时打到数据库，数据库瞬间崩溃
- **缓存雪崩**：大量 key 同时过期或 Redis 宕机，请求全部涌向数据库

这些问题在生产环境中可能导致：
- 数据库压力骤增，响应变慢
- 系统吞吐量下降
- 服务不可用，用户体验极差

### 解决方案概览

| 问题 | 核心原因 | 解决方案 |
| --- | --- | --- |
| **缓存穿透** | 查询不存在的数据 | 布隆过滤器、空值缓存 |
| **缓存击穿** | 热点 key 过期 | 互斥锁、永不过期 |
| **缓存雪崩** | 大量 key 同时过期 | 随机过期时间、多级缓存 |

---

## 12.2 缓存穿透

### 问题描述

**缓存穿透**是指查询一个根本不存在的数据，缓存层和存储层都不会命中，导致所有请求都落到数据库上。

打个比方：

> 缓存穿透就像你查字典，翻遍了整本字典（缓存）都没找到这个字，最后只能去图书馆（数据库）查。如果很多人都来查同一个不存在的字，图书馆就会被挤爆。

### 场景示例

```
攻击者大量请求不存在的用户 ID：
- GET /user/99999999
- GET /user/88888888
- GET /user/77777777
...

这些 ID 在缓存和数据库中都不存在，每次请求都会查询数据库
```

### 解决方案一：空值缓存

```java
public User getUser(Long userId) {
    String key = "user:" + userId;
    
    // 1. 先查缓存
    String cachedValue = redisTemplate.opsForValue().get(key);
    
    // 2. 如果缓存的是空值标记，直接返回 null
    if ("NULL".equals(cachedValue)) {
        return null;
    }
    
    // 3. 缓存命中，返回数据
    if (cachedValue != null) {
        return JSON.parseObject(cachedValue, User.class);
    }
    
    // 4. 缓存未命中，查询数据库
    User user = userMapper.selectById(userId);
    
    // 5. 写入缓存
    if (user != null) {
        redisTemplate.opsForValue().set(
            key, 
            JSON.toJSONString(user),
            30, 
            TimeUnit.MINUTES
        );
    } else {
        // 6. 数据库也没有，缓存空值（较短过期时间）
        redisTemplate.opsForValue().set(key, "NULL", 5, TimeUnit.MINUTES);
    }
    
    return user;
}
```

**优点**：实现简单，能有效防止穿透
**缺点**：
- 如果攻击者使用随机 ID，会占用大量缓存空间
- 空值过期后还是会穿透

### 解决方案二：布隆过滤器

布隆过滤器（Bloom Filter）是一种空间效率很高的概率型数据结构，用于快速判断元素是否存在。

```java
@Component
public class UserBloomFilter {
    private static final int DEFAULT_SIZE = 2 << 24; // 16M
    private static final int[] SEEDS = new int[]{7, 11, 13, 31, 37, 61};
    
    private BitSet bits = new BitSet(DEFAULT_SIZE);
    private SimpleHash[] func = new SimpleHash[SEEDS.length];
    
    public UserBloomFilter() {
        for (int i = 0; i < SEEDS.length; i++) {
            func[i] = new SimpleHash(DEFAULT_SIZE, SEEDS[i]);
        }
    }
    
    // 添加元素
    public void add(String value) {
        for (SimpleHash f : func) {
            bits.set(f.hash(value), true);
        }
    }
    
    // 判断元素是否可能存在
    public boolean contains(String value) {
        if (value == null) {
            return false;
        }
        boolean ret = true;
        for (SimpleHash f : func) {
            ret = ret && bits.get(f.hash(value));
        }
        return ret;
    }
    
    // 哈希函数
    public static class SimpleHash {
        private int cap;
        private int seed;
        
        public SimpleHash(int cap, int seed) {
            this.cap = cap;
            this.seed = seed;
        }
        
        public int hash(String value) {
            int h = 0;
            for (int i = 0; i < value.length(); i++) {
                h = seed * h + value.charAt(i);
            }
            return Math.abs(h % cap);
        }
    }
}

@Service
public class UserService {
    @Autowired
    private UserBloomFilter bloomFilter;
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private UserMapper userMapper;
    
    @PostConstruct
    public void init() {
        // 系统启动时，将所有存在的用户 ID 加入布隆过滤器
        List<Long> allUserIds = userMapper.selectAllUserIds();
        for (Long userId : allUserIds) {
            bloomFilter.add(String.valueOf(userId));
        }
    }
    
    public User getUser(Long userId) {
        String key = "user:" + userId;
        
        // 1. 先用布隆过滤器判断
        if (!bloomFilter.contains(String.valueOf(userId))) {
            // 布隆过滤器说不存在，那一定不存在
            return null;
        }
        
        // 2. 布隆过滤器说可能存在，查缓存
        String cachedValue = redisTemplate.opsForValue().get(key);
        if (cachedValue != null) {
            return JSON.parseObject(cachedValue, User.class);
        }
        
        // 3. 缓存未命中，查数据库
        User user = userMapper.selectById(userId);
        if (user != null) {
            redisTemplate.opsForValue().set(
                key,
                JSON.toJSONString(user),
                30,
                TimeUnit.MINUTES
            );
        }
        
        return user;
    }
}
```

**优点**：
- 空间效率高，内存占用小
- 查询速度快，时间复杂度 O(k)
- 能彻底防止穿透

**缺点**：
- 有误判率（可能将不存在的判断为存在）
- 不能删除元素
- 需要定期重建（新增数据时）

### Redis 布隆过滤器

Redis 4.0+ 提供了布隆过滤器模块：

```bash
# 添加元素
> BF.ADD users:filter "user:1001"
(integer) 1

# 检查元素是否存在
> BF.EXISTS users:filter "user:1001"
(integer) 1

> BF.EXISTS users:filter "user:9999"
(integer) 0

# 批量添加
> BF.MADD users:filter "user:1002" "user:1003" "user:1004"
1) (integer) 1
2) (integer) 1
3) (integer) 1

# 批量检查
> BF.MEXISTS users:filter "user:1001" "user:9999"
1) (integer) 1
2) (integer) 0
```

---

## 12.3 缓存击穿

### 问题描述

**缓存击穿**是指一个热点 key 在过期的瞬间，大量并发请求同时查询这个 key，导致所有请求都落到数据库上。

打个比方：

> 缓存击穿就像演唱会散场时，所有人同时涌向一个出口。如果这个出口突然关闭（key 过期），所有人都会被堵在外面。

### 场景示例

```
热点新闻文章 ID=1001，访问量极大
- 缓存在 12:00:00 过期
- 12:00:00 瞬间，1000 个请求同时到达
- 缓存未命中，1000 个请求同时查询数据库
- 数据库压力骤增，响应变慢甚至崩溃
```

### 解决方案一：互斥锁

```java
public User getUserWithLock(Long userId) {
    String key = "user:" + userId;
    
    // 1. 先查缓存
    String cachedValue = redisTemplate.opsForValue().get(key);
    if (cachedValue != null) {
        return JSON.parseObject(cachedValue, User.class);
    }
    
    // 2. 缓存未命中，尝试获取锁
    String lockKey = "lock:" + key;
    boolean locked = false;
    
    try {
        // 尝试获取分布式锁（10秒过期）
        locked = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
        
        if (locked) {
            // 3. 获取锁成功，再次检查缓存（双重检查）
            cachedValue = redisTemplate.opsForValue().get(key);
            if (cachedValue != null) {
                return JSON.parseObject(cachedValue, User.class);
            }
            
            // 4. 查询数据库
            User user = userMapper.selectById(userId);
            
            // 5. 写入缓存
            if (user != null) {
                redisTemplate.opsForValue().set(
                    key,
                    JSON.toJSONString(user),
                    30,
                    TimeUnit.MINUTES
                );
                return user;
            }
        } else {
            // 6. 获取锁失败，休眠后重试
            Thread.sleep(50);
            return getUserWithLock(userId);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    } finally {
        // 7. 释放锁
        if (locked) {
            redisTemplate.delete(lockKey);
        }
    }
    
    return null;
}
```

**优点**：
- 保证只有一个请求查询数据库
- 其他请求等待或重试

**缺点**：
- 实现复杂
- 可能导致死锁（需要设置过期时间）
- 性能有一定损失

### 解决方案二：永不过期 + 异步更新

```java
@Service
public class HotDataService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private ProductMapper productMapper;
    
    // 热点数据不设置过期时间
    @PostConstruct
    public void initHotData() {
        // 加载热点商品
        List<Product> hotProducts = productMapper.selectHotProducts(100);
        for (Product product : hotProducts) {
            String key = "product:" + product.getId();
            // 不设置过期时间
            redisTemplate.opsForValue().set(key, JSON.toJSONString(product));
        }
    }
    
    // 定时异步更新缓存
    @Scheduled(fixedRate = 300000) // 每 5 分钟更新一次
    public void refreshHotData() {
        List<Product> hotProducts = productMapper.selectHotProducts(100);
        for (Product product : hotProducts) {
            String key = "product:" + product.getId();
            redisTemplate.opsForValue().set(key, JSON.toJSONString(product));
        }
    }
    
    // 数据变更时主动更新
    public void updateProduct(Product product) {
        productMapper.updateById(product);
        String key = "product:" + product.getId();
        redisTemplate.opsForValue().set(key, JSON.toJSONString(product));
    }
}
```

**优点**：
- 避免 key 过期导致的击穿
- 读取性能稳定

**缺点**：
- 需要额外的更新机制
- 数据可能短暂不一致

### 解决方案三：逻辑过期

```java
public class CacheItem<T> {
    private T data;
    private long expireTime; // 逻辑过期时间
    
    public CacheItem(T data, long expireSeconds) {
        this.data = data;
        this.expireTime = System.currentTimeMillis() + expireSeconds * 1000;
    }
    
    public boolean isExpired() {
        return System.currentTimeMillis() > expireTime;
    }
}

public Product getProductWithLogicalExpire(Long productId) {
    String key = "product:" + productId;
    
    // 1. 查询缓存
    String cachedValue = redisTemplate.opsForValue().get(key);
    
    if (cachedValue != null) {
        CacheItem<Product> item = JSON.parseObject(
            cachedValue, 
            new TypeReference<CacheItem<Product>>() {}
        );
        
        // 2. 未过期，直接返回
        if (!item.isExpired()) {
            return item.getData();
        }
        
        // 3. 已过期，异步更新缓存
        CompletableFuture.runAsync(() -> {
            String lockKey = "lock:" + key;
            boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
            
            if (locked) {
                try {
                    Product product = productMapper.selectById(productId);
                    CacheItem<Product> newItem = new CacheItem<>(product, 1800);
                    redisTemplate.opsForValue().set(
                        key,
                        JSON.toJSONString(newItem)
                    );
                } finally {
                    redisTemplate.delete(lockKey);
                }
            }
        });
        
        // 4. 返回旧数据
        return item.getData();
    }
    
    // 5. 缓存不存在，查询数据库
    Product product = productMapper.selectById(productId);
    if (product != null) {
        CacheItem<Product> item = new CacheItem<>(product, 1800);
        redisTemplate.opsForValue().set(key, JSON.toJSONString(item));
    }
    
    return product;
}
```

**优点**：
- 不使用物理过期，避免击穿
- 异步更新，不影响读取性能

**缺点**：
- 实现复杂
- 数据可能短暂不一致

---

## 12.4 缓存雪崩

### 问题描述

**缓存雪崩**是指大量缓存 key 在同一时间过期，或者 Redis 服务宕机，导致大量请求直接打到数据库。

打个比方：

> 缓存雪崩就像雪崩一样，大量的雪（请求）同时从高处（缓存）落下，冲击底部的山谷（数据库），造成灾难性后果。

### 场景示例

```
场景一：大量 key 同时过期
- 系统启动时批量设置缓存，过期时间都是 30 分钟
- 30 分钟后，所有 key 同时过期
- 大量请求同时查询数据库

场景二：Redis 宕机
- Redis 服务突然不可用
- 所有请求都无法命中缓存
- 全部请求打到数据库
```

### 解决方案一：随机过期时间

```java
public void setCacheWithRandomExpire(String key, String value) {
    // 基础过期时间 30 分钟
    long baseExpire = 30 * 60;
    
    // 随机增加 0-10 分钟
    long randomExpire = ThreadLocalRandom.current().nextLong(10 * 60);
    
    // 总过期时间
    long totalExpire = baseExpire + randomExpire;
    
    // 设置缓存
    redisTemplate.opsForValue().set(key, value, totalExpire, TimeUnit.SECONDS);
}

// 批量设置时
public void batchSetCache(Map<String, String> data) {
    for (Map.Entry<String, String> entry : data.entrySet()) {
        setCacheWithRandomExpire(entry.getKey(), entry.getValue());
    }
}
```

**优点**：
- 实现简单
- 有效避免大量 key 同时过期

**缺点**：
- 不能完全避免雪崩，只是缓解

### 解决方案二：多级缓存

```java
@Service
public class MultiLevelCacheService {
    @Autowired
    private Cache<String, String> localCache; // Caffeine 本地缓存
    @Autowired
    private StringRedisTemplate redisTemplate; // Redis 分布式缓存
    @Autowired
    private ProductMapper productMapper;
    
    public Product getProduct(Long productId) {
        String key = "product:" + productId;
        
        // 1. 查询本地缓存
        String localValue = localCache.getIfPresent(key);
        if (localValue != null) {
            return JSON.parseObject(localValue, Product.class);
        }
        
        // 2. 查询 Redis 缓存
        String redisValue = redisTemplate.opsForValue().get(key);
        if (redisValue != null) {
            // 写入本地缓存
            localCache.put(key, redisValue);
            return JSON.parseObject(redisValue, Product.class);
        }
        
        // 3. 查询数据库
        Product product = productMapper.selectById(productId);
        if (product != null) {
            String json = JSON.toJSONString(product);
            // 写入 Redis（随机过期时间）
            long expire = 1800 + ThreadLocalRandom.current().nextLong(600);
            redisTemplate.opsForValue().set(key, json, expire, TimeUnit.SECONDS);
            // 写入本地缓存（较短过期时间）
            localCache.put(key, json);
            return product;
        }
        
        return null;
    }
}

@Configuration
public class CacheConfig {
    @Bean
    public Cache<String, String> localCache() {
        return Caffeine.newBuilder()
            .maximumSize(10000) // 最多 10000 个元素
            .expireAfterWrite(5, TimeUnit.MINUTES) // 5 分钟过期
            .build();
    }
}
```

**优点**：
- 本地缓存响应快
- 多级缓存提高可用性
- Redis 宕机时本地缓存仍可用

**缺点**：
- 实现复杂
- 本地缓存占用内存
- 数据一致性更难保证

### 解决方案三：Redis 高可用

```yaml
# Spring Boot 配置 Redis 哨兵模式
spring:
  redis:
    sentinel:
      master: mymaster
      nodes: 192.168.1.100:26379,192.168.1.101:26379,192.168.1.102:26379
    password: yourpassword
    timeout: 5000ms
    lettuce:
      pool:
        max-active: 100
        max-idle: 50
        min-idle: 10
```

**优点**：
- 从根本上解决 Redis 单点故障
- 自动故障转移

**缺点**：
- 架构复杂
- 运维成本高

### 解决方案四：降级和限流

```java
@Service
public class ProductServiceWithFallback {
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private ProductMapper productMapper;
    
    // 使用 Sentinel 进行限流和降级
    @SentinelResource(
        value = "getProduct",
        blockHandler = "getProductBlockHandler",
        fallback = "getProductFallback"
    )
    public Product getProduct(Long productId) {
        String key = "product:" + productId;
        
        // 查询缓存
        String cachedValue = redisTemplate.opsForValue().get(key);
        if (cachedValue != null) {
            return JSON.parseObject(cachedValue, Product.class);
        }
        
        // 查询数据库
        Product product = productMapper.selectById(productId);
        if (product != null) {
            redisTemplate.opsForValue().set(key, JSON.toJSONString(product), 30, TimeUnit.MINUTES);
        }
        
        return product;
    }
    
    // 限流处理
    public Product getProductBlockHandler(Long productId, BlockException ex) {
        // 返回默认数据或缓存数据
        String key = "product:" + productId;
        String cachedValue = redisTemplate.opsForValue().get(key);
        if (cachedValue != null) {
            return JSON.parseObject(cachedValue, Product.class);
        }
        return getDefaultProduct(productId);
    }
    
    // 降级处理
    public Product getProductFallback(Long productId, Throwable ex) {
        // 数据库不可用时，返回缓存数据或默认数据
        String key = "product:" + productId;
        String cachedValue = redisTemplate.opsForValue().get(key);
        if (cachedValue != null) {
            return JSON.parseObject(cachedValue, Product.class);
        }
        return getDefaultProduct(productId);
    }
    
    private Product getDefaultProduct(Long productId) {
        Product product = new Product();
        product.setId(productId);
        product.setName("商品加载中");
        product.setPrice(0.0);
        return product;
    }
}
```

**优点**：
- 保护数据库不被压垮
- 提供降级数据，用户体验较好

**缺点**：
- 可能返回旧数据或默认数据
- 需要额外的限流和降级逻辑

---

## 12.5 问题对比与解决方案总结

| 问题 | 核心原因 | 解决方案 | 推荐方案 |
| --- | --- | --- | --- |
| **缓存穿透** | 查询不存在的数据 | 空值缓存、布隆过滤器 | 布隆过滤器 |
| **缓存击穿** | 热点 key 过期 | 互斥锁、永不过期、逻辑过期 | 逻辑过期 |
| **缓存雪崩** | 大量 key 同时过期 | 随机过期、多级缓存、高可用 | 多级缓存 + 随机过期 |

---

## 12.6 新手常见误区

### 误区 1："空值缓存可以解决所有穿透问题"

**错！** 空值缓存只能解决固定 ID 的穿透问题。如果攻击者使用随机 ID，会占用大量缓存空间。应该使用布隆过滤器。

### 误区 2："互斥锁会影响性能，不应该用"

**不对！** 互斥锁确实会影响性能，但在高并发场景下是必要的。可以通过设置锁的过期时间和使用逻辑过期来优化。

### 误区 3："随机过期时间可以完全避免雪崩"

**不准确！** 随机过期时间可以缓解雪崩，但不能完全避免。应该结合多级缓存、高可用架构和限流降级。

### 误区 4："有了缓存就不需要数据库了"

**大错特错！** 缓存只是数据库的辅助，用于加速读取。数据库是数据的最终来源，必须保证数据库的稳定性和可靠性。

---

## 12.7 动手练习

### 练习 1：解决缓存穿透

实现一个带布隆过滤器的用户查询服务：
1. 系统启动时将所有用户 ID 加入布隆过滤器
2. 查询时先用布隆过滤器判断
3. 布隆过滤器说不存在，直接返回 null

<details>
<summary>点击查看答案</summary>

```java
@Service
public class UserServiceWithBloomFilter {
    @Autowired
    private RedisBloomFilter bloomFilter; // 使用 Redis 布隆过滤器
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private UserMapper userMapper;
    
    @PostConstruct
    public void init() {
        // 加载所有用户 ID 到布隆过滤器
        List<Long> userIds = userMapper.selectAllUserIds();
        for (Long userId : userIds) {
            bloomFilter.add("user:" + userId);
        }
    }
    
    public User getUser(Long userId) {
        String key = "user:" + userId;
        
        // 1. 布隆过滤器判断
        if (!bloomFilter.exists(key)) {
            return null; // 一定不存在
        }
        
        // 2. 查询缓存
        String cachedValue = redisTemplate.opsForValue().get(key);
        if (cachedValue != null) {
            return JSON.parseObject(cachedValue, User.class);
        }
        
        // 3. 查询数据库
        User user = userMapper.selectById(userId);
        if (user != null) {
            redisTemplate.opsForValue().set(
                key,
                JSON.toJSONString(user),
                30,
                TimeUnit.MINUTES
            );
        }
        
        return user;
    }
}
```

</details>

### 练习 2：解决缓存击穿

实现一个带逻辑过期的热点数据缓存：
1. 缓存中存储逻辑过期时间
2. 过期后异步更新缓存
3. 返回旧数据

<details>
<summary>点击查看答案</summary>

```java
@Data
public class CacheItem<T> {
    private T data;
    private long expireTime;
    
    public CacheItem(T data, long expireSeconds) {
        this.data = data;
        this.expireTime = System.currentTimeMillis() + expireSeconds * 1000;
    }
    
    public boolean isExpired() {
        return System.currentTimeMillis() > expireTime;
    }
}

@Service
public class HotProductService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private ProductMapper productMapper;
    
    public Product getHotProduct(Long productId) {
        String key = "hot:product:" + productId;
        
        // 1. 查询缓存
        String cachedValue = redisTemplate.opsForValue().get(key);
        
        if (cachedValue != null) {
            CacheItem<Product> item = JSON.parseObject(
                cachedValue,
                new TypeReference<CacheItem<Product>>() {}
            );
            
            // 2. 未过期，直接返回
            if (!item.isExpired()) {
                return item.getData();
            }
            
            // 3. 已过期，异步更新
            CompletableFuture.runAsync(() -> refreshCache(productId));
            
            // 4. 返回旧数据
            return item.getData();
        }
        
        // 5. 缓存不存在，同步加载
        return refreshCache(productId);
    }
    
    private Product refreshCache(Long productId) {
        String key = "hot:product:" + productId;
        String lockKey = "lock:" + key;
        
        boolean locked = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
        
        if (locked) {
            try {
                Product product = productMapper.selectById(productId);
                if (product != null) {
                    CacheItem<Product> item = new CacheItem<>(product, 1800);
                    redisTemplate.opsForValue().set(
                        key,
                        JSON.toJSONString(item)
                    );
                }
                return product;
            } finally {
                redisTemplate.delete(lockKey);
            }
        }
        
        return null;
    }
}
```

</details>

### 练习 3（挑战）：综合解决方案

实现一个完整的缓存服务，同时解决穿透、击穿、雪崩问题：
1. 使用布隆过滤器防止穿透
2. 使用逻辑过期防止击穿
3. 使用随机过期时间防止雪崩
4. 添加降级处理

<details>
<summary>点击查看答案</summary>

```java
@Service
public class CompleteCacheService {
    @Autowired
    private RedisBloomFilter bloomFilter;
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private ProductMapper productMapper;
    
    @SentinelResource(
        value = "getProduct",
        fallback = "getProductFallback"
    )
    public Product getProduct(Long productId) {
        String key = "product:" + productId;
        
        // 1. 布隆过滤器防止穿透
        if (!bloomFilter.exists(key)) {
            return null;
        }
        
        // 2. 查询缓存
        String cachedValue = redisTemplate.opsForValue().get(key);
        
        if (cachedValue != null) {
            CacheItem<Product> item = JSON.parseObject(
                cachedValue,
                new TypeReference<CacheItem<Product>>() {}
            );
            
            // 3. 逻辑过期检查
            if (!item.isExpired()) {
                return item.getData();
            }
            
            // 4. 异步更新（防止击穿）
            CompletableFuture.runAsync(() -> refreshCache(productId));
            return item.getData();
        }
        
        // 5. 缓存不存在，同步加载
        return refreshCache(productId);
    }
    
    private Product refreshCache(Long productId) {
        String key = "product:" + productId;
        String lockKey = "lock:" + key;
        
        boolean locked = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
        
        if (locked) {
            try {
                Product product = productMapper.selectById(productId);
                if (product != null) {
                    // 6. 随机过期时间（防止雪崩）
                    long expireSeconds = 1800 + ThreadLocalRandom.current().nextLong(600);
                    CacheItem<Product> item = new CacheItem<>(product, expireSeconds);
                    redisTemplate.opsForValue().set(
                        key,
                        JSON.toJSONString(item)
                    );
                }
                return product;
            } finally {
                redisTemplate.delete(lockKey);
            }
        }
        
        return null;
    }
    
    // 降级处理
    public Product getProductFallback(Long productId, Throwable ex) {
        String key = "product:" + productId;
        String cachedValue = redisTemplate.opsForValue().get(key);
        
        if (cachedValue != null) {
            CacheItem<Product> item = JSON.parseObject(
                cachedValue,
                new TypeReference<CacheItem<Product>>() {}
            );
            return item.getData();
        }
        
        // 返回默认数据
        Product defaultProduct = new Product();
        defaultProduct.setId(productId);
        defaultProduct.setName("商品加载中");
        defaultProduct.setPrice(0.0);
        return defaultProduct;
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Redis 分布式锁**——也就是如何在分布式环境下实现互斥访问。你会学到分布式锁的原理、实现方式、Redlock 算法、锁超时与续期等核心概念，掌握如何在分布式系统中安全地共享资源。
