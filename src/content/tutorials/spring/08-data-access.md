---
title: "第8章：Spring 数据访问"
description: "使用 JdbcTemplate 和 Spring Data 操作数据库"
---

# 第8章：Spring 数据访问

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring 如何简化数据库操作？
- JdbcTemplate 是什么？怎么用？
- 如何配置数据源？
- Spring Data 又是什么？

这一章就是为了解答这些问题。我们会从最基础的 JDBC 开始，逐步学习 Spring 提供的数据访问抽象，掌握 JdbcTemplate 的使用，了解 Spring Data 的理念。

---

## 8.1 为什么需要 Spring 数据访问？

### 痛点分析

使用原生 JDBC 操作数据库：

```java
// 原生 JDBC 代码
public User findById(Long id) {
    Connection conn = null;
    PreparedStatement stmt = null;
    ResultSet rs = null;
    try {
        // 1. 获取连接
        conn = DriverManager.getConnection(URL, USER, PASSWORD);
        
        // 2. 创建语句
        stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
        stmt.setLong(1, id);
        
        // 3. 执行查询
        rs = stmt.executeQuery();
        
        // 4. 处理结果
        if (rs.next()) {
            User user = new User();
            user.setId(rs.getLong("id"));
            user.setUsername(rs.getString("username"));
            user.setEmail(rs.getString("email"));
            return user;
        }
    } catch (SQLException e) {
        e.printStackTrace();
    } finally {
        // 5. 关闭资源（大量重复代码）
        if (rs != null) try { rs.close(); } catch (SQLException e) {}
        if (stmt != null) try { stmt.close(); } catch (SQLException e) {}
        if (conn != null) try { conn.close(); } catch (SQLException e) {}
    }
    return null;
}
```

**问题**：
- 大量重复的模板代码
- 资源管理容易出错
- 异常处理繁琐
- 代码可读性差

### 解决方案

Spring 的 JdbcTemplate 简化了数据库操作：

```java
// 使用 JdbcTemplate
@Repository
public class UserDao {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public User findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, new UserRowMapper(), id);
    }
}

// RowMapper：结果集映射
class UserRowMapper implements RowMapper<User> {
    @Override
    public User mapRow(ResultSet rs, int rowNum) throws SQLException {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setUsername(rs.getString("username"));
        user.setEmail(rs.getString("email"));
        return user;
    }
}
```

> **一句话总结**：Spring 数据访问抽象了 JDBC 的模板代码，让你专注于 SQL 和结果处理。

---

## 8.2 核心原理

### 8.2.1 Spring 数据访问体系

| 技术 | 说明 | 适用场景 |
| --- | --- | --- |
| JdbcTemplate | Spring 提供的 JDBC 模板 | 简单 CRUD |
| NamedParameterJdbcTemplate | 支持命名参数 | 复杂查询 |
| Spring Data JPA | JPA 的封装 | 快速开发 |
| Spring Data JDBC | 轻量级数据访问 | 简单场景 |
| Spring Data MyBatis | MyBatis 集成 | 复杂 SQL |

打个比方：

> Spring 数据访问就像不同级别的餐厅服务：
> - JdbcTemplate：自助餐厅，你准备食材，餐厅提供工具
> - Spring Data JPA：全包餐厅，你点菜，餐厅全搞定
> - Spring Data JDBC：简餐店，快速简单

### 8.2.2 数据源配置

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/test?useSSL=false&serverTimezone=UTC
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
    
    # HikariCP 连接池配置
    hikari:
      minimum-idle: 5           # 最小空闲连接
      maximum-pool-size: 20     # 最大连接数
      idle-timeout: 300000      # 空闲超时（毫秒）
      connection-timeout: 20000 # 连接超时
      max-lifetime: 1800000     # 连接最大生命周期
```

---

## 8.3 基础用法

### 8.3.1 JdbcTemplate CRUD

```java
package com.example.dao;

import com.example.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class UserDao {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // RowMapper：结果集映射
    private final RowMapper<User> userRowMapper = (rs, rowNum) -> {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setUsername(rs.getString("username"));
        user.setEmail(rs.getString("email"));
        user.setAge(rs.getInt("age"));
        return user;
    };
    
    // 查询所有
    public List<User> findAll() {
        String sql = "SELECT * FROM users";
        return jdbcTemplate.query(sql, userRowMapper);
    }
    
    // 根据 ID 查询
    public User findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, userRowMapper, id);
    }
    
    // 新增
    public int save(User user) {
        String sql = "INSERT INTO users (username, email, age) VALUES (?, ?, ?)";
        return jdbcTemplate.update(sql, user.getUsername(), user.getEmail(), user.getAge());
    }
    
    // 更新
    public int update(User user) {
        String sql = "UPDATE users SET username = ?, email = ?, age = ? WHERE id = ?";
        return jdbcTemplate.update(sql, user.getUsername(), user.getEmail(), 
                                   user.getAge(), user.getId());
    }
    
    // 删除
    public int deleteById(Long id) {
        String sql = "DELETE FROM users WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }
    
    // 统计
    public int count() {
        String sql = "SELECT COUNT(*) FROM users";
        return jdbcTemplate.queryForObject(sql, Integer.class);
    }
}
```

### 8.3.2 NamedParameterJdbcTemplate

```java
@Repository
public class UserDao {
    
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    
    // 使用命名参数
    public List<User> findByCondition(String username, String email) {
        String sql = "SELECT * FROM users WHERE username = :username AND email = :email";
        
        Map<String, Object> params = new HashMap<>();
        params.put("username", username);
        params.put("email", email);
        
        return namedParameterJdbcTemplate.query(sql, params, userRowMapper);
    }
    
    // 批量操作
    public void batchInsert(List<User> users) {
        String sql = "INSERT INTO users (username, email, age) VALUES (:username, :email, :age)";
        
        SqlParameterSource[] sources = users.stream()
                .map(user -> new BeanPropertySqlParameterSource(user))
                .toArray(SqlParameterSource[]::new);
        
        namedParameterJdbcTemplate.batchUpdate(sql, sources);
    }
}
```

### 8.3.3 事务管理

```java
@Service
public class UserService {
    
    @Autowired
    private UserDao userDao;
    
    // 声明式事务
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        // 扣款
        User from = userDao.findById(fromId);
        from.setBalance(from.getBalance().subtract(amount));
        userDao.update(from);
        
        // 模拟异常
        // int i = 1 / 0;
        
        // 入账
        User to = userDao.findById(toId);
        to.setBalance(to.getBalance().add(amount));
        userDao.update(to);
    }
}
```

---

## 8.4 进阶用法

### 8.4.1 回调接口

```java
@Repository
public class UserDao {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // 使用 RowCallbackHandler
    public void printAllUsers() {
        String sql = "SELECT * FROM users";
        jdbcTemplate.query(sql, rs -> {
            // 每行数据都会调用
            System.out.println("用户: " + rs.getString("username"));
        });
    }
    
    // 使用 ResultSetExtractor
    public Map<Long, String> getIdNameMap() {
        String sql = "SELECT id, username FROM users";
        return jdbcTemplate.query(sql, rs -> {
            Map<Long, String> map = new HashMap<>();
            while (rs.next()) {
                map.put(rs.getLong("id"), rs.getString("username"));
            }
            return map;
        });
    }
}
```

### 8.4.2 存储过程调用

```java
@Repository
public class UserDao {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // 调用存储过程
    public void callProcedure(Long userId) {
        jdbcTemplate.update(con -> {
            CallableStatement stmt = con.prepareCall("{call update_user(?)}");
            stmt.setLong(1, userId);
            return stmt;
        });
    }
}
```

### 8.4.3 BeanPropertyRowMapper

```java
@Repository
public class UserDao {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // 使用 BeanPropertyRowMapper（自动映射）
    public User findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        // 自动将列名映射到属性名（下划线转驼峰）
        return jdbcTemplate.queryForObject(sql, 
                new BeanPropertyRowMapper<>(User.class), id);
    }
    
    public List<User> findAll() {
        String sql = "SELECT * FROM users";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(User.class));
    }
}
```

---

## 8.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| JdbcTemplate | Spring JDBC 模板类 |
| RowMapper | 结果集行映射 |
| NamedParameterJdbcTemplate | 命名参数支持 |
| @Transactional | 声明式事务 |
| BeanPropertyRowMapper | 自动属性映射 |
| HikariCP | 默认连接池 |

---

## 8.6 新手常见误区

### 误区 1："JdbcTemplate 需要手动管理连接"

**错！** JdbcTemplate 自动管理连接的获取和释放，你不需要手动关闭连接。

### 误区 2："RowMapper 和 ResultSetExtractor 是一样的"

**不一样！**
- RowMapper：映射单行数据
- ResultSetExtractor：映射整个结果集

### 误区 3："@Transactional 可以加在任何方法上"

**错！** @Transactional 只能加在 public 方法上，且类必须被 Spring 管理。

---

## 8.7 动手练习

### 练习 1：基础练习 - JdbcTemplate CRUD

使用 JdbcTemplate 实现用户管理的 CRUD 操作。

<details>
<summary>点击查看答案</summary>

```java
@Repository
public class UserDao {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    private final RowMapper<User> rowMapper = (rs, rowNum) -> {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setUsername(rs.getString("username"));
        user.setEmail(rs.getString("email"));
        return user;
    };
    
    public List<User> findAll() {
        return jdbcTemplate.query("SELECT * FROM users", rowMapper);
    }
    
    public User findById(Long id) {
        return jdbcTemplate.queryForObject(
                "SELECT * FROM users WHERE id = ?", rowMapper, id);
    }
    
    public int save(User user) {
        return jdbcTemplate.update(
                "INSERT INTO users (username, email) VALUES (?, ?)",
                user.getUsername(), user.getEmail());
    }
    
    public int update(User user) {
        return jdbcTemplate.update(
                "UPDATE users SET username = ?, email = ? WHERE id = ?",
                user.getUsername(), user.getEmail(), user.getId());
    }
    
    public int deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM users WHERE id = ?", id);
    }
}
```

</details>

### 练习 2：进阶练习 - 事务管理

实现转账功能，使用事务保证数据一致性。

<details>
<summary>点击查看答案</summary>

```java
@Service
public class AccountService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        // 扣款
        jdbcTemplate.update(
                "UPDATE accounts SET balance = balance - ? WHERE id = ?",
                amount, fromId);
        
        // 入账
        jdbcTemplate.update(
                "UPDATE accounts SET balance = balance + ? WHERE id = ?",
                amount, toId);
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 批量操作

实现批量插入用户的功能。

<details>
<summary>点击查看答案</summary>

```java
@Repository
public class UserDao {
    
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    
    public void batchInsert(List<User> users) {
        String sql = "INSERT INTO users (username, email, age) VALUES (:username, :email, :age)";
        
        SqlParameterSource[] sources = users.stream()
                .map(BeanPropertySqlParameterSource::new)
                .toArray(SqlParameterSource[]::new);
        
        namedParameterJdbcTemplate.batchUpdate(sql, sources);
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring MyBatis 集成**——也就是如何整合 MyBatis 进行数据访问。你会学到：

- MyBatis-Spring 的配置
- Mapper 接口扫描
- 动态 SQL
- 分页插件

准备好了吗？让我们继续深入 Spring 的世界！
