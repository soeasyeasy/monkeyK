---
title: "第15章：性能优化原理"
description: "SQL 优化、缓存优化、连接池优化、批量操作优化"
---

# 第15章：性能优化原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MyBatis 性能优化的主要方向有哪些？
- 如何优化 SQL 执行性能？
- 缓存优化的最佳实践是什么？
- 批量操作如何优化？

这一章就是为了解答这些问题。我们会从 **SQL 优化** 入手，再深入 **缓存优化**、**连接池优化** 和 **批量操作优化**。

---

## 1 SQL 优化

### 1.1 避免 SELECT *

```xml
<!-- ❌ 不推荐 -->
<select id="selectUsers" resultType="User">
    SELECT * FROM user
</select>

<!-- ✅ 推荐：只查询需要的字段 -->
<select id="selectUsers" resultType="User">
    SELECT id, name, age FROM user
</select>
```

### 1.2 使用索引

```xml
<!-- ❌ 不推荐：索引失效 -->
<select id="selectUsers" resultType="User">
    SELECT * FROM user WHERE name LIKE '%${name}%'
</select>

<!-- ✅ 推荐：使用索引 -->
<select id="selectUsers" resultType="User">
    SELECT * FROM user WHERE name LIKE CONCAT(#{name}, '%')
</select>
```

### 1.3 避免子查询

```xml
<!-- ❌ 不推荐：子查询 -->
<select id="selectUsersWithOrders" resultType="User">
    SELECT * FROM user 
    WHERE id IN (SELECT user_id FROM order)
</select>

<!-- ✅ 推荐：使用 JOIN -->
<select id="selectUsersWithOrders" resultType="User">
    SELECT DISTINCT u.* 
    FROM user u
    INNER JOIN order o ON u.id = o.user_id
</select>
```

### 1.4 分页优化

```xml
<!-- ❌ 不推荐：深度分页 -->
<select id="selectUsers" resultType="User">
    SELECT * FROM user LIMIT 1000000, 10
</select>

<!-- ✅ 推荐：使用游标分页 -->
<select id="selectUsers" resultType="User">
    SELECT * FROM user WHERE id > #{lastId} ORDER BY id LIMIT 10
</select>
```

---

## 2 缓存优化

### 2.1 一级缓存优化

```java
// 一级缓存默认开启，无需配置
SqlSession session = sqlSessionFactory.openSession();

// 第一次查询，从数据库加载
User user1 = session.selectOne("selectUser", 1);

// 第二次查询，从缓存加载
User user2 = session.selectOne("selectUser", 1);

// 执行更新操作，缓存失效
session.update("updateUser", user);

// 第三次查询，从数据库加载
User user3 = session.selectOne("selectUser", 1);
```

### 2.2 二级缓存优化

```xml
<!-- 开启二级缓存 -->
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>

<!-- Mapper 中配置缓存 -->
<mapper namespace="com.example.UserMapper">
    <cache
        eviction="LRU"           <!-- 淘汰策略 -->
        flushInterval="60000"    <!-- 刷新间隔 60 秒 -->
        size="512"               <!-- 缓存大小 512 -->
        readOnly="true"/>        <!-- 只读 -->
</mapper>
```

### 2.3 自定义缓存

```java
// 使用 Redis 作为缓存
public class RedisCache implements Cache {
    private final String id;
    private static RedisTemplate<String, Object> redisTemplate;
    
    public RedisCache(String id) {
        this.id = id;
    }
    
    @Override
    public String getId() {
        return id;
    }
    
    @Override
    public void putObject(Object key, Object value) {
        redisTemplate.opsForValue().set(key.toString(), value);
    }
    
    @Override
    public Object getObject(Object key) {
        return redisTemplate.opsForValue().get(key.toString());
    }
    
    @Override
    public Object removeObject(Object key) {
        return redisTemplate.delete(key.toString());
    }
    
    @Override
    public void clear() {
        redisTemplate.delete(redisTemplate.keys(id + "*"));
    }
    
    @Override
    public int getSize() {
        return redisTemplate.keys(id + "*").size();
    }
}
```

```xml
<!-- 使用自定义缓存 -->
<cache type="com.example.RedisCache"/>
```

---

## 3 连接池优化

### 3.1 数据源配置

```xml
<!-- 使用 PooledDataSource -->
<dataSource type="POOLED">
    <property name="driver" value="com.mysql.jdbc.Driver"/>
    <property name="url" value="jdbc:mysql://localhost:3306/test"/>
    <property name="username" value="root"/>
    <property name="password" value="password"/>
    
    <!-- 连接池配置 -->
    <property name="poolMaximumActiveConnections" value="10"/>   <!-- 最大连接数 -->
    <property name="poolMaximumIdleConnections" value="5"/>      <!-- 最大空闲连接 -->
    <property name="poolMaximumCheckoutTime" value="20000"/>     <!-- 最大检出时间 -->
    <property name="poolTimeToWait" value="20000"/>              <!-- 等待时间 -->
    <property name="poolPingEnabled" value="true"/>              <!-- 开启连接检测 -->
    <property name="poolPingQuery" value="SELECT 1"/>            <!-- 检测 SQL -->
    <property name="poolPingConnectionsNotUsedFor" value="10000"/> <!-- 检测间隔 -->
</dataSource>
```

### 3.2 使用第三方连接池

```xml
<!-- 使用 Druid 连接池 -->
<dataSource type="com.alibaba.druid.pool.DruidDataSource">
    <property name="driver" value="com.mysql.jdbc.Driver"/>
    <property name="url" value="jdbc:mysql://localhost:3306/test"/>
    <property name="username" value="root"/>
    <property name="password" value="password"/>
    
    <!-- Druid 配置 -->
    <property name="initialSize" value="5"/>
    <property name="maxActive" value="20"/>
    <property name="minIdle" value="5"/>
    <property name="maxWait" value="60000"/>
    <property name="timeBetweenEvictionRunsMillis" value="60000"/>
    <property name="minEvictableIdleTimeMillis" value="300000"/>
    <property name="validationQuery" value="SELECT 1"/>
    <property name="testWhileIdle" value="true"/>
    <property name="testOnBorrow" value="false"/>
    <property name="testOnReturn" value="false"/>
</dataSource>
```

---

## 4 批量操作优化

### 4.1 使用 BatchExecutor

```java
// 使用 BatchExecutor 批量插入
SqlSession session = sqlSessionFactory.openSession(ExecutorType.BATCH);

try {
    UserMapper mapper = session.getMapper(UserMapper.class);
    
    for (int i = 0; i < 10000; i++) {
        User user = new User();
        user.setName("User" + i);
        user.setAge(20 + i % 50);
        mapper.insert(user);
        
        // 每 1000 条提交一次
        if (i % 1000 == 0) {
            session.flushStatements();
            session.commit();
        }
    }
    
    session.commit();
} finally {
    session.close();
}
```

### 4.2 使用 foreach 批量插入

```xml
<!-- 批量插入 -->
<insert id="batchInsert">
    INSERT INTO user (name, age) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.name}, #{user.age})
    </foreach>
</insert>
```

```java
// 批量插入
List<User> users = new ArrayList<>();
for (int i = 0; i < 10000; i++) {
    User user = new User();
    user.setName("User" + i);
    user.setAge(20 + i % 50);
    users.add(user);
}

userMapper.batchInsert(users);
```

### 4.3 批量更新

```xml
<!-- 批量更新 -->
<update id="batchUpdate">
    <foreach collection="list" item="user" separator=";">
        UPDATE user SET name = #{user.name}, age = #{user.age}
        WHERE id = #{user.id}
    </foreach>
</update>
```

```java
// 需要开启多语句支持
<dataSource type="POOLED">
    <property name="url" value="jdbc:mysql://localhost:3306/test?allowMultiQueries=true"/>
</dataSource>
```

---

## 5 其他优化技巧

### 5.1 使用 ResultHandler

```java
// 大数据量查询，避免内存溢出
userMapper.selectUsers(new ResultHandler<User>() {
    @Override
    public void handleResult(ResultContext<? extends User> resultContext) {
        User user = resultContext.getResultObject();
        // 处理每条记录
        processUser(user);
    }
});
```

### 5.2 使用 Cursor

```java
// 使用 Cursor 流式查询
try (Cursor<User> cursor = userMapper.selectUsers()) {
    for (User user : cursor) {
        // 处理每条记录
        processUser(user);
    }
}
```

### 5.3 关闭不必要的功能

```xml
<settings>
    <!-- 关闭二级缓存 -->
    <setting name="cacheEnabled" value="false"/>
    
    <!-- 关闭延迟加载 -->
    <setting name="lazyLoadingEnabled" value="false"/>
    
    <!-- 关闭日志 -->
    <setting name="logImpl" value="NOP_LOGGING"/>
</settings>
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| SQL 优化 | 避免 SELECT *、使用索引、避免子查询、分页优化 |
| 缓存优化 | 一级缓存、二级缓存、自定义缓存 |
| 连接池优化 | 配置连接池参数、使用第三方连接池 |
| 批量操作 | BatchExecutor、foreach 批量、批量更新 |
| 其他优化 | ResultHandler、Cursor、关闭不必要功能 |

---

## 7 新手常见误区

### 误区 1："缓存越多越好"

**错！** 缓存过多会占用大量内存，需要根据业务场景合理配置。

### 误区 2："批量操作不需要分批处理"

不是的。大批量操作需要分批处理，避免内存溢出和事务过大。

### 误区 3："连接池越大越好"

**错！** 连接池过大浪费资源，过小影响性能。需要根据服务器配置和业务量合理设置。

---

## 8 动手练习

### 练习 1：基础练习

列举 SQL 优化的常见方法。

<details>
<parameter=点击查看答案