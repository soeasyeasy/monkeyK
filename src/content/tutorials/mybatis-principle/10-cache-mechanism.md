---
title: "第10章：缓存机制原理"
description: "一级缓存、二级缓存、缓存Key、缓存失效场景"
---

# 第10章：缓存机制原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MyBatis 的一级缓存和二级缓存有什么区别？
- 缓存是如何实现的？底层数据结构是什么？
- 什么情况下缓存会失效？
- 如何自定义缓存实现？

这一章就是为了解答这些问题。我们会从 **缓存的作用** 入手，再深入 **一级缓存和二级缓存的实现原理**。

---

## 1 为什么需要缓存？

### 痛点分析

频繁查询数据库会导致：
- 性能瓶颈：数据库连接、SQL 解析、网络传输
- 资源浪费：重复查询相同数据
- 响应慢：用户体验差

### 解决方案

MyBatis 提供两级缓存：

```
一级缓存（SqlSession 级别）
    ↓
二级缓存（Mapper 级别）
    ↓
数据库
```

> **一句话总结**：缓存减少数据库查询次数，提升系统性能。

---

## 2 一级缓存

### 2.1 一级缓存特点

| 特性 | 说明 |
|------|------|
| 作用域 | SqlSession 级别 |
| 存储位置 | Executor 的 localCache（PerpetualCache） |
| 默认开启 | 是 |
| 失效时机 | SqlSession 关闭或提交 |

### 2.2 一级缓存实现

```java
public abstract class BaseExecutor implements Executor {
    // 一级缓存
    protected PerpetualCache localCache;
    
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameter, 
                             RowBounds rowBounds, ResultHandler resultHandler) {
        // 1. 获取 BoundSql
        BoundSql boundSql = ms.getBoundSql(parameter);
        
        // 2. 创建缓存 Key
        CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
        
        // 3. 查询缓存
        List<E> result = queryFromCache(ms, parameter, rowBounds, resultHandler, key, boundSql);
        
        return result;
    }
    
    private <E> List<E> queryFromCache(MappedStatement ms, Object parameter, 
                                        RowBounds rowBounds, ResultHandler resultHandler,
                                        CacheKey key, BoundSql boundSql) {
        // 1. 从缓存查询
        List<E> list = (List<E>) localCache.getObject(key);
        
        if (list != null) {
            // 缓存命中
            return list;
        }
        
        // 2. 缓存未命中，查询数据库
        list = queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
        
        return list;
    }
    
    private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter,
                                           RowBounds rowBounds, ResultHandler resultHandler,
                                           CacheKey key, BoundSql boundSql) {
        List<E> list;
        
        // 1. 占位符，防止并发查询
        localCache.putObject(key, ExecutionPlaceholder.EXECUTION_PLACEHOLDER);
        
        try {
            // 2. 查询数据库
            list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
        } finally {
            // 3. 移除占位符
            localCache.removeObject(key);
        }
        
        // 4. 放入缓存
        localCache.putObject(key, list);
        
        return list;
    }
}
```

### 2.3 CacheKey 生成

```java
public CacheKey createCacheKey(MappedStatement ms, Object parameterObject, 
                                RowBounds rowBounds, BoundSql boundSql) {
    CacheKey cacheKey = new CacheKey();
    
    // 1. MappedStatement 的 ID
    cacheKey.update(ms.getId());
    
    // 2. RowBounds（分页参数）
    cacheKey.update(rowBounds.getOffset());
    cacheKey.update(rowBounds.getLimit());
    
    // 3. SQL 语句
    cacheKey.update(boundSql.getSql());
    
    // 4. 参数值
    List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
    for (ParameterMapping parameterMapping : parameterMappings) {
        Object value = getParameterValue(parameterMapping);
        cacheKey.update(value);
    }
    
    return cacheKey;
}
```

### 2.4 一级缓存失效场景

| 场景 | 说明 |
|------|------|
| SqlSession 关闭 | close() 方法调用 |
| SqlSession 提交 | commit() 方法调用 |
| 执行更新操作 | insert/update/delete |
| 手动清空 | clearCache() 方法调用 |

---

## 3 二级缓存

### 3.1 二级缓存特点

| 特性 | 说明 |
|------|------|
| 作用域 | Mapper 级别（namespace） |
| 存储位置 | Configuration 的 caches |
| 默认开启 | 否，需要配置 |
| 失效时机 | 执行更新操作 |

### 3.2 二级缓存配置

```xml
<!-- 开启二级缓存 -->
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>

<!-- Mapper 中配置缓存 -->
<mapper namespace="com.example.UserMapper">
    <!-- 使用默认缓存 -->
    <cache/>
    
    <!-- 自定义缓存配置 -->
    <cache
        eviction="LRU"           <!-- 淘汰策略 -->
        flushInterval="60000"    <!-- 刷新间隔（毫秒） -->
        size="512"               <!-- 缓存大小 -->
        readOnly="true"/>        <!-- 只读 -->
</mapper>
```

### 3.3 二级缓存实现

```java
// CachingExecutor 包装 Executor
public class CachingExecutor implements Executor {
    private final Executor delegate;
    private final TransactionalCacheManager tcm = new TransactionalCacheManager();
    
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameter, 
                             RowBounds rowBounds, ResultHandler resultHandler) {
        // 1. 获取 BoundSql
        BoundSql boundSql = ms.getBoundSql(parameter);
        
        // 2. 创建缓存 Key
        CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
        
        // 3. 查询二级缓存
        List<E> result = tcm.getObject(ms.getId(), key);
        
        if (result != null) {
            return result;
        }
        
        // 4. 查询一级缓存
        result = delegate.query(ms, parameter, rowBounds, resultHandler);
        
        // 5. 放入二级缓存
        tcm.putObject(ms.getId(), key, result);
        
        return result;
    }
    
    @Override
    public void commit(boolean required) {
        delegate.commit(required);
        // 提交时刷新二级缓存
        tcm.commit();
    }
}
```

### 3.4 缓存淘汰策略

| 策略 | 说明 |
|------|------|
| LRU | 最近最少使用（默认） |
| FIFO | 先进先出 |
| SOFT | 软引用 |
| WEAK | 弱引用 |

---

## 4 缓存装饰器

### 4.1 装饰器模式

MyBatis 使用装饰器模式增强缓存功能：

```
Cache（接口）
├── PerpetualCache（基础实现）
├── LruCache（LRU 淘汰）
├── LoggingCache（日志记录）
├── ScheduledCache（定时刷新）
├── SerializedCache（序列化）
├── SoftCache（软引用）
└── WeakCache（弱引用）
```

### 4.2 装饰器链

```java
// 创建缓存装饰器链
private Cache setStandardDecorators(MapperBuilderAssistant assistant, 
                                     String type, Properties props) {
    try {
        // 1. 创建基础缓存
        Class<?> typeClass = valueOrDefault(type, PerpetualCache.class);
        Cache cache = (Cache) typeClass.getConstructor(String.class).newInstance(namespace);
        
        // 2. 添加装饰器
        if (props != null) {
            // 淘汰策略
            String eviction = props.getProperty("eviction");
            if (eviction != null) {
                cache = new LruCache(cache);
            }
            
            // 刷新间隔
            String flushInterval = props.getProperty("flushInterval");
            if (flushInterval != null) {
                cache = new ScheduledCache(cache);
                ((ScheduledCache) cache).setClearInterval(Long.parseLong(flushInterval));
            }
            
            // 大小限制
            String size = props.getProperty("size");
            if (size != null) {
                cache = new LruCache(cache);
                ((LruCache) cache).setSize(Integer.parseInt(size));
            }
            
            // 只读
            String readOnly = props.getProperty("readOnly");
            if ("false".equals(readOnly)) {
                cache = new SerializedCache(cache);
            }
        }
        
        // 3. 添加日志和同步装饰器
        cache = new LoggingCache(cache);
        cache = new SynchronizedCache(cache);
        
        return cache;
    } catch (Exception e) {
        throw new CacheException("Error building standard decorators.", e);
    }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 一级缓存 | SqlSession 级别，PerpetualCache 实现 |
| 二级缓存 | Mapper 级别，需要配置开启 |
| CacheKey | 由 statementId、SQL、参数等生成 |
| 失效场景 | SqlSession 关闭/提交、执行更新操作 |
| 装饰器模式 | LruCache、LoggingCache、ScheduledCache 等 |

---

## 6 新手常见误区

### 误区 1："二级缓存默认开启"

**错！** 二级缓存需要手动配置 `<cache/>` 标签。

### 误区 2："一级缓存和二级缓存互不影响"

不是的。查询顺序：二级缓存 → 一级缓存 → 数据库。

### 误区 3："缓存越多越好"

**错！** 缓存过多会占用大量内存，需要根据业务场景合理配置。

---

## 7 动手练习

### 练习 1：基础练习

说明一级缓存和二级缓存的区别。

<details>
<parameter=点击查看答案