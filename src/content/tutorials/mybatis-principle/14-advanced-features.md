---
title: "第14章：高级特性原理"
description: "延迟加载、关联映射、嵌套查询、分步查询原理"
---

# 第14章：高级特性原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 延迟加载是如何实现的？
- 关联映射的底层原理是什么？
- 嵌套查询和分步查询有什么区别？
- 如何优化关联查询的性能？

这一章就是为了解答这些问题。我们会从 **延迟加载** 入手，再深入 **关联映射** 和 **查询优化**。

---

## 1 延迟加载

### 1.1 什么是延迟加载

延迟加载（Lazy Loading）是指在需要时才加载关联数据：

```java
// 立即加载：查询用户时同时查询订单
User user = userMapper.selectById(1);
// 此时 orders 已加载

// 延迟加载：查询用户时不查询订单
User user = userMapper.selectById(1);
// 此时 orders 未加载

// 访问 orders 时才加载
List<Order> orders = user.getOrders();
// 此时才执行订单查询
```

### 1.2 配置方式

```xml
<!-- mybatis-config.xml -->
<settings>
    <!-- 开启延迟加载 -->
    <setting name="lazyLoadingEnabled" value="true"/>
    <!-- 关闭积极加载 -->
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>
```

### 1.3 实现原理

```java
// 延迟加载通过 JDK 动态代理实现
public class JavassistProxyFactory {
    
    public static <T> T createProxy(Object object, Class<T> type, 
                                     List<ResultLoaderMap.LoadPair> unloadedProperties) {
        // 创建代理对象
        ProxyFactory factory = new ProxyFactory();
        factory.setSuperclass(type);
        
        // 设置方法拦截器
        factory.setHandler((obj, method, args, proceed) -> {
            // 检查是否需要延迟加载
            if (method.getName().startsWith("get")) {
                String property = method.getName().substring(3);
                if (unloadedProperties.contains(property)) {
                    // 执行延迟加载
                    loadProperty(object, property);
                }
            }
            return proceed.invoke(obj, args);
        });
        
        return (T) factory.create();
    }
}
```

### 1.4 使用示例

```xml
<!-- 用户 ResultMap -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- 延迟加载订单 -->
    <collection property="orders" column="id" 
                select="selectOrdersByUserId" 
                fetchType="lazy"/>
</resultMap>

<!-- 查询用户 -->
<select id="selectUser" resultMap="userWithOrdersMap">
    SELECT * FROM user WHERE id = #{id}
</select>

<!-- 查询订单（延迟加载） -->
<select id="selectOrdersByUserId" resultType="Order">
    SELECT * FROM order WHERE user_id = #{id}
</select>
```

---

## 2 关联映射

### 2.1 一对一关联

```xml
<!-- 用户与身份证一对一 -->
<resultMap id="userWithIdCardMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- 一对一关联 -->
    <association property="idCard" javaType="IdCard">
        <id property="id" column="id_card_id"/>
        <result property="cardNo" column="card_no"/>
    </association>
</resultMap>

<select id="selectUserWithIdCard" resultMap="userWithIdCardMap">
    SELECT u.*, ic.id AS id_card_id, ic.card_no 
    FROM user u 
    LEFT JOIN id_card ic ON u.id_card_id = ic.id
    WHERE u.id = #{id}
</select>
```

### 2.2 一对多关联

```xml
<!-- 用户与订单一对多 -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- 一对多关联 -->
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNo" column="order_no"/>
        <result property="amount" column="amount"/>
    </collection>
</resultMap>

<select id="selectUserWithOrders" resultMap="userWithOrdersMap">
    SELECT u.*, o.id AS order_id, o.order_no, o.amount
    FROM user u
    LEFT JOIN order o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>
```

### 2.3 多对多关联

```xml
<!-- 用户与角色多对多 -->
<resultMap id="userWithRolesMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- 多对多关联 -->
    <collection property="roles" ofType="Role">
        <id property="id" column="role_id"/>
        <result property="roleName" column="role_name"/>
    </collection>
</resultMap>

<select id="selectUserWithRoles" resultMap="userWithRolesMap">
    SELECT u.*, r.id AS role_id, r.role_name
    FROM user u
    LEFT JOIN user_role ur ON u.id = ur.user_id
    LEFT JOIN role r ON ur.role_id = r.id
    WHERE u.id = #{id}
</select>
```

---

## 3 嵌套查询 vs 嵌套结果

### 3.1 嵌套查询（分步查询）

```xml
<!-- 分步查询：两次查询 -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- 通过 select 属性执行子查询 -->
    <collection property="orders" column="id" 
                select="selectOrdersByUserId"/>
</resultMap>

<select id="selectUser" resultMap="userWithOrdersMap">
    SELECT * FROM user WHERE id = #{id}
</select>

<select id="selectOrdersByUserId" resultType="Order">
    SELECT * FROM order WHERE user_id = #{id}
</select>
```

**执行过程**：
1. 执行 `selectUser` 查询用户
2. 访问 `orders` 属性时，执行 `selectOrdersByUserId` 查询订单

### 3.2 嵌套结果（关联查询）

```xml
<!-- 关联查询：一次查询 -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- 通过 resultMap 映射关联结果 -->
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNo" column="order_no"/>
    </collection>
</resultMap>

<select id="selectUserWithOrders" resultMap="userWithOrdersMap">
    SELECT u.*, o.id AS order_id, o.order_no
    FROM user u
    LEFT JOIN order o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>
```

**执行过程**：
1. 执行一次 JOIN 查询
2. 通过 resultMap 映射结果

### 3.3 对比分析

| 特性 | 嵌套查询 | 嵌套结果 |
|------|----------|----------|
| 查询次数 | 多次 | 一次 |
| SQL 复杂度 | 简单 | 复杂（JOIN） |
| 性能 | 可能 N+1 问题 | 较好 |
| 延迟加载 | 支持 | 不支持 |
| 使用场景 | 数据量大、按需加载 | 数据量小、一次加载 |

---

## 4 N+1 问题

### 4.1 问题描述

```java
// 查询 10 个用户，每个用户有订单
List<User> users = userMapper.selectAll();

// 嵌套查询会导致：
// 1 次查询所有用户
// + 10 次查询每个用户的订单
// = 11 次查询（N+1 问题）
```

### 4.2 解决方案

#### 方案一：使用嵌套结果

```xml
<!-- 使用 JOIN 一次查询 -->
<select id="selectUsersWithOrders" resultMap="userWithOrdersMap">
    SELECT u.*, o.id AS order_id, o.order_no
    FROM user u
    LEFT JOIN order o ON u.id = o.user_id
</select>
```

#### 方案二：使用批量查询

```xml
<!-- 先查询所有用户 -->
<select id="selectAllUsers" resultType="User">
    SELECT * FROM user
</select>

<!-- 批量查询订单 -->
<select id="selectOrdersByUserIds" resultType="Order">
    SELECT * FROM order WHERE user_id IN
    <foreach collection="list" item="userId" open="(" separator="," close=")">
        #{userId}
    </foreach>
</select>
```

```java
// 代码中批量查询
List<User> users = userMapper.selectAllUsers();
List<Long> userIds = users.stream().map(User::getId).collect(Collectors.toList());
List<Order> orders = orderMapper.selectOrdersByUserIds(userIds);

// 手动组装
Map<Long, List<Order>> orderMap = orders.stream()
    .collect(Collectors.groupingBy(Order::getUserId));
users.forEach(user -> user.setOrders(orderMap.get(user.getId())));
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 延迟加载 | 按需加载关联数据，通过代理实现 |
| 关联映射 | association（一对一）、collection（一对多） |
| 嵌套查询 | 分步查询，支持延迟加载，可能 N+1 |
| 嵌套结果 | JOIN 查询，一次加载，性能较好 |
| N+1 问题 | 使用嵌套结果或批量查询解决 |

---

## 6 新手常见误区

### 误区 1："延迟加载总是更好的选择"

**错！** 延迟加载会导致多次查询，可能产生 N+1 问题。需要根据场景选择。

### 误区 2："嵌套查询性能更好"

不是的。嵌套查询可能产生 N+1 问题，嵌套结果（JOIN）通常性能更好。

### 误区 3："关联映射只能用于一对一"

**错！** 关联映射支持一对一（association）和一对多（collection）。

---

## 7 动手练习

### 练习 1：基础练习

说明延迟加载的实现原理。

<details>