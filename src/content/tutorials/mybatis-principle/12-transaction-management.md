---
title: "第12章：事务管理原理"
description: "Transaction 接口、事务隔离级别、Spring 事务集成"
---

# 第12章：事务管理原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MyBatis 是如何管理事务的？
- Transaction 接口有哪些实现？
- MyBatis 事务与 Spring 事务如何集成？
- 事务隔离级别如何设置？

这一章就是为了解答这些问题。我们会从 **事务的基本概念** 入手，再深入 **MyBatis 事务管理原理**。

---

## 1 为什么需要事务管理？

### 痛点分析

在数据库操作中，经常需要保证多个操作的原子性：

```java
// ❌ 没有事务：部分成功导致数据不一致
public void transfer(int fromId, int toId, BigDecimal amount) {
    // 扣款
    accountMapper.deduct(fromId, amount);
    
    // 如果这里发生异常，扣款成功但转账失败
    if (someError) {
        throw new RuntimeException("转账失败");
    }
    
    // 加款
    accountMapper.add(toId, amount);
}
```

### 解决方案

使用事务保证原子性：

```java
// ✅ 使用事务：要么全部成功，要么全部失败
public void transfer(int fromId, int toId, BigDecimal amount) {
    SqlSession session = sqlSessionFactory.openSession();
    try {
        AccountMapper mapper = session.getMapper(AccountMapper.class);
        
        // 扣款
        mapper.deduct(fromId, amount);
        
        // 加款
        mapper.add(toId, amount);
        
        // 提交事务
        session.commit();
    } catch (Exception e) {
        // 回滚事务
        session.rollback();
        throw e;
    } finally {
        session.close();
    }
}
```

> **一句话总结**：事务保证多个操作的原子性，要么全部成功，要么全部失败。

---

## 2 Transaction 接口

### 2.1 核心接口

```java
public interface Transaction {
    // 获取数据库连接
    Connection getConnection() throws SQLException;
    
    // 提交事务
    void commit() throws SQLException;
    
    // 回滚事务
    void rollback() throws SQLException;
    
    // 关闭连接
    void close() throws SQLException;
    
    // 获取事务超时时间
    Integer getTimeout() throws SQLException;
}
```

### 2.2 实现类

| 实现类 | 说明 | 使用场景 |
|--------|------|----------|
| **JdbcTransaction** | JDBC 事务 | 独立使用 MyBatis |
| **ManagedTransaction** | 容器管理事务 | 与 Spring 等容器集成 |

---

## 3 JdbcTransaction

### 3.1 实现原理

```java
public class JdbcTransaction implements Transaction {
    private Connection connection;
    private final DataSource dataSource;
    private TransactionIsolationLevel level;
    private boolean autoCommit;
    
    @Override
    public Connection getConnection() throws SQLException {
        if (connection == null) {
            // 1. 从数据源获取连接
            connection = dataSource.getConnection();
            
            // 2. 设置隔离级别
            if (level != null) {
                connection.setTransactionIsolation(level.getLevel());
            }
            
            // 3. 设置自动提交
            if (autoCommit != connection.getAutoCommit()) {
                connection.setAutoCommit(autoCommit);
            }
        }
        return connection;
    }
    
    @Override
    public void commit() throws SQLException {
        if (connection != null && !connection.isClosed() && !autoCommit) {
            connection.commit();
        }
    }
    
    @Override
    public void rollback() throws SQLException {
        if (connection != null && !connection.isClosed() && !autoCommit) {
            connection.rollback();
        }
    }
    
    @Override
    public void close() throws SQLException {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }
}
```

### 3.2 配置方式

```xml
<!-- mybatis-config.xml -->
<environments default="development">
    <environment id="development">
        <!-- 使用 JDBC 事务 -->
        <transactionManager type="JDBC"/>
        <dataSource type="POOLED">
            <property name="driver" value="com.mysql.jdbc.Driver"/>
            <property name="url" value="jdbc:mysql://localhost:3306/test"/>
            <property name="username" value="root"/>
            <property name="password" value="password"/>
        </dataSource>
    </environment>
</environments>
```

---

## 4 ManagedTransaction

### 4.1 实现原理

```java
public class ManagedTransaction implements Transaction {
    private Connection connection;
    private final DataSource dataSource;
    private final boolean closeConnection;
    
    @Override
    public Connection getConnection() throws SQLException {
        if (connection == null) {
            connection = dataSource.getConnection();
        }
        return connection;
    }
    
    @Override
    public void commit() throws SQLException {
        // 容器管理事务，MyBatis 不提交
        // Does nothing
    }
    
    @Override
    public void rollback() throws SQLException {
        // 容器管理事务，MyBatis 不回滚
        // Does nothing
    }
    
    @Override
    public void close() throws SQLException {
        if (connection != null && closeConnection) {
            connection.close();
        }
    }
}
```

### 4.2 配置方式

```xml
<!-- mybatis-config.xml -->
<environments default="development">
    <environment id="development">
        <!-- 使用容器管理事务 -->
        <transactionManager type="MANAGED">
            <property name="closeConnection" value="false"/>
        </transactionManager>
        <dataSource type="POOLED">
            <!-- ... -->
        </dataSource>
    </environment>
</environments>
```

---

## 5 事务隔离级别

### 5.1 隔离级别

| 级别 | 说明 | 问题 |
|------|------|------|
| **NONE** | 不支持事务 | - |
| **READ_UNCOMMITTED** | 读未提交 | 脏读、不可重复读、幻读 |
| **READ_COMMITTED** | 读已提交 | 不可重复读、幻读 |
| **REPEATABLE_READ** | 可重复读 | 幻读 |
| **SERIALIZABLE** | 串行化 | 无 |

### 5.2 配置方式

```java
// 代码方式
SqlSession session = sqlSessionFactory.openSession(TransactionIsolationLevel.REPEATABLE_READ);

// XML 方式
<environments default="development">
    <environment id="development">
        <transactionManager type="JDBC"/>
        <dataSource type="POOLED">
            <!-- ... -->
        </dataSource>
    </environment>
</environments>
```

---

## 6 与 Spring 事务集成

### 6.1 集成原理

```
Spring 事务管理器（PlatformTransactionManager）
    ↓
SpringManagedTransaction（MyBatis 事务）
    ↓
从 Spring 事务管理器获取连接
    ↓
使用 Spring 管理的连接
```

### 6.2 SpringManagedTransaction

```java
public class SpringManagedTransaction implements Transaction {
    private final DataSource dataSource;
    private Connection connection;
    
    @Override
    public Connection getConnection() throws SQLException {
        if (connection == null) {
            // 从 Spring 事务管理器获取连接
            connection = DataSourceUtils.getConnection(dataSource);
        }
        return connection;
    }
    
    @Override
    public void commit() throws SQLException {
        // Spring 管理事务提交
        if (connection != null && !connection.isClosed() && !connection.getAutoCommit()) {
            if (DataSourceUtils.isConnectionTransactional(connection, dataSource)) {
                // Spring 管理的连接，不提交
            } else {
                connection.commit();
            }
        }
    }
    
    @Override
    public void rollback() throws SQLException {
        // Spring 管理事务回滚
        if (connection != null && !connection.isClosed() && !connection.getAutoCommit()) {
            if (DataSourceUtils.isConnectionTransactional(connection, dataSource)) {
                // Spring 管理的连接，不回滚
            } else {
                connection.rollback();
            }
        }
    }
    
    @Override
    public void close() throws SQLException {
        // 释放连接回 Spring
        DataSourceUtils.releaseConnection(connection, dataSource);
    }
}
```

### 6.3 配置方式

```java
// Spring 配置
@Configuration
@MapperScan("com.example.mapper")
public class MyBatisConfig {
    
    @Bean
    public SqlSessionFactoryBean sqlSessionFactory(DataSource dataSource) {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        return factory;
    }
    
    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

```java
// 使用 @Transactional 注解
@Service
public class AccountService {
    
    @Autowired
    private AccountMapper accountMapper;
    
    @Transactional
    public void transfer(int fromId, int toId, BigDecimal amount) {
        // 扣款
        accountMapper.deduct(fromId, amount);
        
        // 加款
        accountMapper.add(toId, amount);
    }
}
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| Transaction 接口 | 事务管理核心接口 |
| JdbcTransaction | JDBC 事务，独立使用 |
| ManagedTransaction | 容器管理事务 |
| 隔离级别 | NONE、READ_UNCOMMITTED、READ_COMMITTED、REPEATABLE_READ、SERIALIZABLE |
| Spring 集成 | SpringManagedTransaction + @Transactional |

---

## 8 新手常见误区

### 误区 1："MyBatis 自动提交事务"

**错！** MyBatis 默认不自动提交，需要手动调用 commit()。

### 误区 2："Spring 集成后还需要配置事务管理器"

不是的。Spring 集成后使用 Spring 的事务管理器，MyBatis 的 transactionManager 配置会被忽略。

### 误区 3："事务隔离级别越高越好"

**错！** 隔离级别越高，性能越差。需要根据业务场景选择合适的隔离级别。

---

## 9 动手练习

### 练习 1：基础练习

说明 JdbcTransaction 和 ManagedTransaction 的区别。

<details>
<parameter=点击查看答案