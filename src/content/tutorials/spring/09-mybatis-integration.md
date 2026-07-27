---
title: "第9章：Spring MyBatis 集成"
description: "整合 MyBatis 进行数据访问，掌握 Mapper 和动态 SQL"
---

# 第9章：Spring MyBatis 集成

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MyBatis 是什么？它和 JdbcTemplate 有什么区别？
- 如何在 Spring Boot 中集成 MyBatis？
- 什么是 Mapper 接口？如何编写？
- 动态 SQL 是什么？怎么用？

这一章就是为了解答这些问题。我们会学习 MyBatis 的核心理念，掌握 Spring Boot 集成 MyBatis 的方法，学会使用 Mapper 接口和动态 SQL。

---

## 1 为什么需要 MyBatis？

### 痛点分析

JdbcTemplate 虽然简化了 JDBC，但在复杂查询时仍有问题：

```java
// JdbcTemplate 复杂查询
public List<User> searchUsers(String username, String email, Integer age) {
    StringBuilder sql = new StringBuilder("SELECT * FROM users WHERE 1=1");
    List<Object> params = new ArrayList<>();
    
    if (username != null) {
        sql.append(" AND username LIKE ?");
        params.add("%" + username + "%");
    }
    if (email != null) {
        sql.append(" AND email LIKE ?");
        params.add("%" + email + "%");
    }
    if (age != null) {
        sql.append(" AND age = ?");
        params.add(age);
    }
    
    return jdbcTemplate.query(sql.toString(), params.toArray(), userRowMapper);
}
```

**问题**：
- SQL 和 Java 代码混在一起
- 动态条件拼接复杂
- 难以维护和调试

### 解决方案

MyBatis 将 SQL 和代码分离：

```xml
<!-- UserMapper.xml -->
<select id="searchUsers" resultType="User">
    SELECT * FROM users
    <where>
        <if test="username != null">
            AND username LIKE CONCAT('%', #{username}, '%')
        </if>
        <if test="email != null">
            AND email LIKE CONCAT('%', #{email}, '%')
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
    </where>
</select>
```

```java
// Mapper 接口
@Mapper
public interface UserMapper {
    List<User> searchUsers(@Param("username") String username,
                           @Param("email") String email,
                           @Param("age") Integer age);
}
```

> **一句话总结**：MyBatis 让你专注于 SQL，框架帮你处理对象映射和动态 SQL。

---

## 2 核心原理

### 9.2.1 MyBatis 架构

| 组件 | 职责 |
| --- | --- |
| SqlSessionFactory | 创建 SqlSession |
| SqlSession | 执行 SQL 的会话 |
| Mapper | SQL 映射接口 |
| XML/注解 | SQL 定义 |

打个比方：

> MyBatis 就像翻译官：
> - 你说中文（Java 方法调用）
> - 翻译官翻译成英文（SQL）
> - 数据库执行后返回英文结果
> - 翻译官再翻译成中文（Java 对象）

### 9.2.2 MyBatis vs JdbcTemplate

| 特性 | MyBatis | JdbcTemplate |
| --- | --- | --- |
| SQL 管理 | XML/注解分离 | 代码中拼接 |
| 动态 SQL | 强大支持 | 手动拼接 |
| 对象映射 | 自动 | 手动 RowMapper |
| 学习曲线 | 中等 | 低 |
| 适用场景 | 复杂查询 | 简单 CRUD |

---

## 3 基础用法

### 9.3.1 添加依赖

```xml
<!-- pom.xml -->
<dependencies>
    <!-- MyBatis Spring Boot Starter -->
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>3.0.3</version>
    </dependency>
    
    <!-- MySQL 驱动 -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
    </dependency>
</dependencies>
```

### 9.3.2 配置 MyBatis

```yaml
# application.yml
mybatis:
  mapper-locations: classpath:mapper/*.xml  # XML 文件位置
  type-aliases-package: com.example.model   # 实体类包
  configuration:
    map-underscore-to-camel-case: true      # 下划线转驼峰
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # 日志
```

### 9.3.3 创建实体类

```java
package com.example.model;

public class User {
    private Long id;
    private String username;
    private String email;
    private Integer age;
    
    // getter 和 setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
```

### 9.3.4 创建 Mapper 接口

```java
package com.example.mapper;

import com.example.model.User;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface UserMapper {
    
    // 注解方式
    @Select("SELECT * FROM users WHERE id = #{id}")
    User findById(@Param("id") Long id);
    
    @Select("SELECT * FROM users")
    List<User> findAll();
    
    @Insert("INSERT INTO users (username, email, age) VALUES (#{username}, #{email}, #{age})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int save(User user);
    
    @Update("UPDATE users SET username = #{username}, email = #{email}, age = #{age} WHERE id = #{id}")
    int update(User user);
    
    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteById(@Param("id") Long id);
}
```

### 9.3.5 XML 方式

```xml
<!-- resources/mapper/UserMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">
    
    <!-- 结果映射 -->
    <resultMap id="UserResultMap" type="User">
        <id property="id" column="id"/>
        <result property="username" column="username"/>
        <result property="email" column="email"/>
        <result property="age" column="age"/>
    </resultMap>
    
    <!-- 查询 -->
    <select id="findById" resultMap="UserResultMap">
        SELECT * FROM users WHERE id = #{id}
    </select>
    
    <select id="findAll" resultMap="UserResultMap">
        SELECT * FROM users
    </select>
    
    <!-- 新增 -->
    <insert id="save" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO users (username, email, age)
        VALUES (#{username}, #{email}, #{age})
    </insert>
    
    <!-- 更新 -->
    <update id="update">
        UPDATE users
        SET username = #{username}, email = #{email}, age = #{age}
        WHERE id = #{id}
    </update>
    
    <!-- 删除 -->
    <delete id="deleteById">
        DELETE FROM users WHERE id = #{id}
    </delete>
</mapper>
```

### 9.3.6 使用 Mapper

```java
package com.example.service;

import com.example.mapper.UserMapper;
import com.example.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {
    
    @Autowired
    private UserMapper userMapper;
    
    public User findById(Long id) {
        return userMapper.findById(id);
    }
    
    public List<User> findAll() {
        return userMapper.findAll();
    }
    
    public void save(User user) {
        userMapper.save(user);
    }
    
    public void update(User user) {
        userMapper.update(user);
    }
    
    public void deleteById(Long id) {
        userMapper.deleteById(id);
    }
}
```

---

## 4 进阶用法

### 9.4.1 动态 SQL

```xml
<!-- 动态查询 -->
<select id="searchUsers" resultMap="UserResultMap">
    SELECT * FROM users
    <where>
        <if test="username != null and username != ''">
            AND username LIKE CONCAT('%', #{username}, '%')
        </if>
        <if test="email != null and email != ''">
            AND email LIKE CONCAT('%', #{email}, '%')
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
        <if test="minAge != null and maxAge != null">
            AND age BETWEEN #{minAge} AND #{maxAge}
        </if>
    </where>
    ORDER BY id DESC
</select>

<!-- 动态更新 -->
<update id="updateSelective">
    UPDATE users
    <set>
        <if test="username != null">username = #{username},</if>
        <if test="email != null">email = #{email},</if>
        <if test="age != null">age = #{age},</if>
    </set>
    WHERE id = #{id}
</update>

<!-- 批量插入 -->
<insert id="batchInsert">
    INSERT INTO users (username, email, age) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.username}, #{user.email}, #{user.age})
    </foreach>
</insert>

<!-- 批量查询 -->
<select id="findByIds" resultMap="UserResultMap">
    SELECT * FROM users WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>
```

### 9.4.2 关联查询

```xml
<!-- 一对一：用户-地址 -->
<resultMap id="UserWithAddress" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <association property="address" javaType="Address">
        <id property="id" column="address_id"/>
        <result property="city" column="city"/>
        <result property="street" column="street"/>
    </association>
</resultMap>

<select id="findUserWithAddress" resultMap="UserWithAddress">
    SELECT u.*, a.id as address_id, a.city, a.street
    FROM users u
    LEFT JOIN addresses a ON u.address_id = a.id
    WHERE u.id = #{id}
</select>

<!-- 一对多：用户-订单 -->
<resultMap id="UserWithOrders" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNo" column="order_no"/>
        <result property="amount" column="amount"/>
    </collection>
</resultMap>

<select id="findUserWithOrders" resultMap="UserWithOrders">
    SELECT u.*, o.id as order_id, o.order_no, o.amount
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>
```

### 9.4.3 分页查询

```java
// 使用 PageHelper 插件
// pom.xml 添加依赖
// <dependency>
//     <groupId>com.github.pagehelper</groupId>
//     <artifactId>pagehelper-spring-boot-starter</artifactId>
//     <version>1.4.7</version>
// </dependency>

@Service
public class UserService {
    
    @Autowired
    private UserMapper userMapper;
    
    public PageInfo<User> findByPage(int pageNum, int pageSize) {
        // 开始分页
        PageHelper.startPage(pageNum, pageSize);
        
        // 查询（自动拦截）
        List<User> users = userMapper.findAll();
        
        // 包装分页信息
        return new PageInfo<>(users);
    }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @Mapper | 标记 Mapper 接口 |
| @Select/@Insert/@Update/@Delete | SQL 注解 |
| resultMap | 结果映射 |
| <if> | 条件判断 |
| <where> | 自动处理 WHERE |
| <set> | 自动处理 SET |
| <foreach> | 循环遍历 |
| PageHelper | 分页插件 |

---

## 6 新手常见误区

### 误区 1："Mapper 接口需要实现类"

**错！** Mapper 接口不需要实现类，MyBatis 会自动生成代理实现。

### 误区 2："XML 和注解必须二选一"

**不是！** 可以混用，简单 SQL 用注解，复杂 SQL 用 XML。

### 误区 3："#{ }和${ }是一样的"

**不一样！**
- #{ }：预编译，防止 SQL 注入（推荐）
- ${ }：字符串替换，有注入风险（慎用）

---

## 7 动手练习

### 练习 1：基础练习 - MyBatis CRUD

使用 MyBatis 实现用户管理的 CRUD。

<details>
<summary>点击查看答案</summary>

```java
@Mapper
public interface UserMapper {
    
    @Select("SELECT * FROM users WHERE id = #{id}")
    User findById(Long id);
    
    @Select("SELECT * FROM users")
    List<User> findAll();
    
    @Insert("INSERT INTO users (username, email) VALUES (#{username}, #{email})")
    int save(User user);
    
    @Update("UPDATE users SET username = #{username}, email = #{email} WHERE id = #{id}")
    int update(User user);
    
    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteById(Long id);
}
```

</details>

### 练习 2：进阶练习 - 动态 SQL

实现用户搜索功能，支持多条件组合查询。

<details>
<summary>点击查看答案</summary>

```xml
<select id="search" resultMap="UserResultMap">
    SELECT * FROM users
    <where>
        <if test="username != null">
            AND username LIKE CONCAT('%', #{username}, '%')
        </if>
        <if test="email != null">
            AND email LIKE CONCAT('%', #{email}, '%')
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
    </where>
</select>
```

</details>

### 练习 3（挑战）：综合练习 - 关联查询

实现用户-订单关联查询。

<details>
<summary>点击查看答案</summary>

```xml
<resultMap id="UserWithOrders" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNo" column="order_no"/>
        <result property="amount" column="amount"/>
    </collection>
</resultMap>

<select id="findWithOrders" resultMap="UserWithOrders">
    SELECT u.*, o.id as order_id, o.order_no, o.amount
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring 事务管理**——也就是如何管理数据库事务。你会学到：

- 声明式事务
- @Transactional 详解
- 事务传播行为
- 事务隔离级别

准备好了吗？让我们继续深入 Spring 的世界！
