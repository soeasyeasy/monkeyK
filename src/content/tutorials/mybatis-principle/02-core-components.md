---
title: "第2章：核心组件原理"
description: "SqlSessionFactory、SqlSession、Executor、StatementHandler 核心组件"
---

# 第2章：核心组件原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- SqlSessionFactory 和 SqlSession 有什么区别？
- Executor 有哪些类型？它们的作用是什么？
- StatementHandler 如何封装 JDBC 操作？
- 这些核心组件之间是如何协作的？

这一章就是为了解答这些问题。我们会深入理解 **核心组件的职责**，再掌握 **组件间的协作关系**。

---

## 1 为什么需要核心组件？

### 痛点分析

如果所有功能都堆在一个类里，会导致：
- 代码臃肿，难以维护
- 职责不清晰，耦合度高
- 难以扩展和测试

### 解决方案

MyBatis 采用**分层设计**，将功能拆分到不同的组件中：

```
SqlSessionFactory → 创建 SqlSession
SqlSession → 提供 API 接口
Executor → 执行 SQL，维护缓存
StatementHandler → 封装 JDBC Statement
ParameterHandler → 设置参数
ResultSetHandler → 处理结果集
```

> **一句话总结**：通过组件拆分，实现职责分离，提高代码的可维护性和可扩展性。

---

## 2 SqlSessionFactory

### 2.1 职责

SqlSessionFactory 是 MyBatis 的**核心工厂**，负责创建 SqlSession：

```java
public interface SqlSessionFactory {
    SqlSession openSession();
    SqlSession openSession(boolean autoCommit);
    SqlSession openSession(Connection connection);
    // ...
}
```

### 2.2 创建过程

```java
// 1. 读取配置文件
String resource = "mybatis-config.xml";
InputStream inputStream = Resources.getResourceAsStream(resource);

// 2. 构建 SqlSessionFactory
SqlSessionFactoryBuilder builder = new SqlSessionFactoryBuilder();
SqlSessionFactory sqlSessionFactory = builder.build(inputStream);

// 3. 创建 SqlSession
SqlSession sqlSession = sqlSessionFactory.openSession();
```

### 2.3 生命周期

| 阶段 | 说明 |
|------|------|
| 应用启动时 | 创建 SqlSessionFactory，全局唯一 |
| 应用运行期间 | 使用 SqlSessionFactory 创建 SqlSession |
| 应用关闭时 | 销毁 SqlSessionFactory |

> **注意**：SqlSessionFactory 是线程安全的，可以在多线程间共享。

---

## 3 SqlSession

### 3.1 职责

SqlSession 是 MyBatis 的**核心接口**，提供数据库操作 API：

```java
public interface SqlSession {
    // 查询操作
    <T> T selectOne(String statement, Object parameter);
    <E> List<E> selectList(String statement, Object parameter);
    
    // 增删改操作
    int insert(String statement, Object parameter);
    int update(String statement, Object parameter);
    int delete(String statement, Object parameter);
    
    // 事务控制
    void commit();
    void rollback();
    
    // 获取 Mapper
    <T> T getMapper(Class<T> type);
    
    // 关闭
    void close();
}
```

### 3.2 实现类

SqlSession 有两个主要实现：

| 实现类 | 特点 | 使用场景 |
|--------|------|----------|
| **DefaultSqlSession** | 默认实现，支持所有操作 | 独立使用 |
| **SqlSessionManager** | 支持多线程，线程安全 | Web 应用 |

### 3.3 生命周期

| 阶段 | 说明 |
|------|------|
| 请求开始 | 创建 SqlSession |
| 请求处理 | 使用 SqlSession 执行 SQL |
| 请求结束 | 关闭 SqlSession |

> **注意**：SqlSession **不是线程安全的**，每个线程应该有自己独立的 SqlSession 实例。

---

## 4 Executor

### 4.1 职责

Executor 是**执行器**，负责 SQL 的执行和缓存维护：

```java
public interface Executor {
    // 更新操作（INSERT/UPDATE/DELETE）
    int update(MappedStatement ms, Object parameter) throws SQLException;
    
    // 查询操作
    <E> List<E> query(MappedStatement ms, Object parameter, 
                      RowBounds rowBounds, ResultHandler resultHandler) throws SQLException;
    
    // 批量更新
    void flushStatements() throws SQLException;
    
    // 事务控制
    void commit(boolean required) throws SQLException;
    void rollback(boolean required) throws SQLException;
    
    // 清理缓存
    void clearLocalCache();
}
```

### 4.2 实现类

Executor 有三种实现：

| 实现类 | 特点 | 说明 |
|--------|------|------|
| **SimpleExecutor** | 简单执行器 | 每次执行都创建新的 Statement |
| **ReuseExecutor** | 复用执行器 | 复用 Statement，减少创建开销 |
| **BatchExecutor** | 批处理执行器 | 批量执行，提高性能 |

### 4.3 执行流程

```
SqlSession.update()
    ↓
Executor.update()
    ↓
StatementHandler.update()
    ↓
JDBC PreparedStatement.executeUpdate()
```

---

## 5 StatementHandler

### 5.1 职责

StatementHandler 是**语句处理器**，封装 JDBC Statement 操作：

```java
public interface StatementHandler {
    // 准备 Statement
    Statement prepare(Connection connection) throws SQLException;
    
    // 参数设置
    void parameterize(Statement statement) throws SQLException;
    
    // 执行查询
    void batch(Statement statement) throws SQLException;
    
    // 执行更新
    int update(Statement statement) throws SQLException;
    
    // 执行查询
    <E> List<E> query(Statement statement, ResultHandler resultHandler) throws SQLException;
}
```

### 5.2 实现类

StatementHandler 有四种实现：

| 实现类 | 特点 | 使用场景 |
|--------|------|----------|
| **SimpleStatementHandler** | 处理简单 SQL | 静态 SQL |
| **PreparedStatementHandler** | 处理预编译 SQL | 动态 SQL（最常用） |
| **CallableStatementHandler** | 处理存储过程 | 存储过程调用 |
| **RoutingStatementHandler** | 路由到其他 Handler | 装饰器模式 |

### 5.3 与 JDBC 的对应关系

| MyBatis | JDBC |
|---------|------|
| StatementHandler.prepare() | Connection.prepareStatement() |
| ParameterHandler | PreparedStatement.setXxx() |
| ResultSetHandler | ResultSet → Object |

---

## 6 组件协作关系

### 6.1 协作图

```
┌─────────────────┐
│ SqlSessionFactory │
└────────┬────────┘
         │ 创建
         ↓
┌─────────────────┐
│   SqlSession    │
└────────┬────────┘
         │ 使用
         ↓
┌─────────────────┐
│    Executor     │ ←── 维护缓存
└────────┬────────┘
         │ 委托
         ↓
┌─────────────────┐
│StatementHandler │ ←── 插件拦截点
└────────┬────────┘
         │ 使用
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────────┐
│Parameter│ │ResultSetHandler│
│Handler │ └──────────────┘
└────────┘
```

### 6.2 执行流程

```java
// 1. 获取 SqlSession
SqlSession session = sqlSessionFactory.openSession();

// 2. 获取 Mapper（动态代理）
UserMapper mapper = session.getMapper(UserMapper.class);

// 3. 执行方法
User user = mapper.selectById(1);
// ↓
// SqlSession.selectOne()
// ↓
// Executor.query()
// ↓
// StatementHandler.query()
// ↓
// JDBC PreparedStatement.executeQuery()
```

---

## 7 核心知识点总结

| 组件 | 职责 | 生命周期 | 线程安全 |
|------|------|----------|----------|
| SqlSessionFactory | 创建 SqlSession | 应用级 | 是 |
| SqlSession | 提供 API 接口 | 请求级 | 否 |
| Executor | 执行 SQL，维护缓存 | 请求级 | 否 |
| StatementHandler | 封装 JDBC 操作 | 请求级 | 否 |
| ParameterHandler | 设置参数 | 请求级 | 否 |
| ResultSetHandler | 处理结果集 | 请求级 | 否 |

---

## 8 新手常见误区

### 误区 1："SqlSession 可以长期持有"

**错！** SqlSession 不是线程安全的，应该在请求结束时立即关闭。

### 误区 2："Executor 只有一种实现"

不是的。Executor 有三种实现：SimpleExecutor、ReuseExecutor、BatchExecutor，可以通过配置切换。

### 误区 3："StatementHandler 直接操作 JDBC"

**错！** StatementHandler 封装了 JDBC 操作，真正的 JDBC 操作在底层完成。

---

## 9 动手练习

### 练习 1：基础练习

说明 SqlSessionFactory 和 SqlSession 的区别。

<details>
<summary>点击查看答案</summary>

```
SqlSessionFactory：
- 工厂类，创建 SqlSession
- 线程安全，全局唯一
- 应用启动时创建，应用关闭时销毁

SqlSession：
- 会话对象，提供数据库操作 API
- 非线程安全，每个线程独立
- 请求开始时创建，请求结束时关闭
```

</details>

### 练习 2：进阶练习

列举 Executor 的三种实现，并说明它们的区别。

<details>
<summary>点击查看答案</summary>

```java
SimpleExecutor：每次执行都创建新的 Statement
ReuseExecutor：复用 Statement，减少创建开销
BatchExecutor：批量执行，提高性能
```

</details>

### 练习 3（挑战）：综合练习

分析 StatementHandler 的四种实现类及其使用场景。

<details>
<summary>点击查看答案</summary>

```java
SimpleStatementHandler：处理简单 SQL，对应 JDBC Statement
PreparedStatementHandler：处理预编译 SQL，对应 JDBC PreparedStatement（最常用）
CallableStatementHandler：处理存储过程，对应 JDBC CallableStatement
RoutingStatementHandler：路由到其他 Handler，使用装饰器模式
```

</details>

---

## 下一章预告

下一章我们会学习 **SqlSession 工作原理**——深入理解 SqlSession 的创建流程、生命周期管理和线程安全机制。你会学到 SqlSession 如何与 Spring 集成使用。
