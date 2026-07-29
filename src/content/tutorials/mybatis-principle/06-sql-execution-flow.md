---
title: "第6章：SQL 执行流程原理"
description: "SQL 从调用到执行的完整流程、四大对象协作"
---

# 第6章：SQL 执行流程原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- SQL 从方法调用到数据库执行，经历了哪些步骤？
- 四大核心对象（Executor、StatementHandler、ParameterHandler、ResultSetHandler）是如何协作的？
- 每个环节分别做了什么？
- 插件是在哪个环节介入的？

这一章就是为了解答这些问题。我们会从 **完整执行流程** 入手，再深入 **四大对象的协作机制**。

---

## 1 为什么需要理解执行流程？

### 痛点分析

很多开发者使用 MyBatis 时：
- 不知道 SQL 是如何执行的
- 不理解插件的执行时机
- 遇到问题时无法定位到具体环节

### 解决方案

深入理解 SQL 执行流程，有助于：
- 编写更高效的 SQL
- 开发自定义插件
- 快速定位和解决问题

---

## 2 完整执行流程

### 2.1 流程图

```
用户调用 Mapper 方法
    ↓
MapperProxy.invoke()
    ↓
MapperMethod.execute()
    ↓
SqlSession.selectOne/update/insert/delete
    ↓
Executor.query/update
    ↓
StatementHandler.prepare()        ← 创建 Statement
    ↓
StatementHandler.parameterize()   ← 设置参数
    ↓
StatementHandler.query/update()   ← 执行 SQL
    ↓
ResultSetHandler.handleResultSets() ← 处理结果集
    ↓
返回结果
```

### 2.2 详细步骤

```java
// 1. 用户调用
UserMapper mapper = sqlSession.getMapper(UserMapper.class);
User user = mapper.selectById(1);

// 2. MapperProxy 拦截
public Object invoke(Object proxy, Method method, Object[] args) {
    return mapperMethod.execute(sqlSession, args);
}

// 3. MapperMethod 路由
public Object execute(SqlSession sqlSession, Object[] args) {
    Object param = method.convertArgsToSqlCommandParam(args);
    return sqlSession.selectOne(command.getName(), param);
}

// 4. SqlSession 委托给 Executor
public <T> T selectOne(String statement, Object parameter) {
    List<T> list = selectList(statement, parameter);
    if (list.size() == 1) {
        return list.get(0);
    }
    return null;
}

public <E> List<E> selectList(String statement, Object parameter) {
    return executor.query(ms, parameter, RowBounds.DEFAULT, NO_RESULT_HANDLER);
}

// 5. Executor 执行查询
public <E> List<E> query(MappedStatement ms, Object parameter, 
                         RowBounds rowBounds, ResultHandler resultHandler) {
    // 获取 BoundSql
    BoundSql boundSql = ms.getBoundSql(parameter);
    
    // 创建缓存 Key
    CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
    
    // 查询缓存
    List<E> result = queryFromCache(ms, parameter, rowBounds, resultHandler, key, boundSql);
    
    return result;
}

// 6. 执行数据库查询（BaseExecutor.queryFromDatabase）
protected <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, 
                                         RowBounds rowBounds, ResultHandler resultHandler,
                                         CacheKey key, BoundSql boundSql) {
    List<E> list;
    localCache.putObject(key, ExecutionPlaceholder.EXECUTION_PLACEHOLDER);
    try {
        // 调用 StatementHandler
        list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
    } finally {
        localCache.removeObject(key);
    }
    localCache.putObject(key, list);
    return list;
}

// 7. SimpleExecutor.doQuery()
protected <E> List<E> doQuery(MappedStatement ms, Object parameter, 
                               RowBounds rowBounds, ResultHandler resultHandler, 
                               BoundSql boundSql) {
    Statement stmt = null;
    try {
        Configuration configuration = ms.getConfiguration();
        
        // 创建 StatementHandler
        StatementHandler handler = configuration.newStatementHandler(
            wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
        
        // 准备 Statement
        stmt = prepareStatement(handler);
        
        // 执行查询
        return handler.query(stmt, resultHandler);
    } finally {
        closeStatement(stmt);
    }
}

// 8. 准备 Statement
private Statement prepareStatement(StatementHandler handler) {
    Statement stmt;
    Connection connection = getConnection(log);
    
    // 8.1 创建 Statement（prepare）
    stmt = handler.prepare(connection);
    
    // 8.2 设置参数（parameterize）
    handler.parameterize(stmt);
    
    return stmt;
}
```

---

## 3 四大对象协作

### 3.1 协作关系图

```
┌─────────────────────────────────────────────────────────┐
│                      Executor                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │  1. 管理缓存（一级缓存）                          │    │
│  │  2. 管理事务                                      │    │
│  │  3. 委托给 StatementHandler                       │    │
│  └──────────────────────┬──────────────────────────┘    │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 StatementHandler                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  1. prepare()：创建 Statement                     │    │
│  │  2. parameterize()：设置参数                      │    │
│  │  3. query()/update()：执行 SQL                    │    │
│  └──────┬───────────────────────────────┬──────────┘    │
└─────────┼───────────────────────────────┼───────────────┘
          │                               │
          ↓                               ↓
┌─────────────────────┐    ┌─────────────────────────────┐
│  ParameterHandler   │    │     ResultSetHandler        │
│  ┌───────────────┐  │    │  ┌─────────────────────┐    │
│  │ 设置 SQL 参数  │  │    │  │ 处理结果集           │    │
│  │ setParameters │  │    │  │ handleResultSets    │    │
│  └───────────────┘  │    │  └─────────────────────┘    │
└─────────────────────┘    └─────────────────────────────┘
```

### 3.2 各对象职责详解

| 对象 | 核心方法 | 职责 |
|------|----------|------|
| **Executor** | query(), update() | 执行 SQL，维护缓存，管理事务 |
| **StatementHandler** | prepare(), parameterize(), query() | 创建 Statement，设置参数，执行 SQL |
| **ParameterHandler** | setParameters() | 设置 SQL 参数 |
| **ResultSetHandler** | handleResultSets() | 将 ResultSet 转换为 Java 对象 |

---

## 4 插件拦截点

### 4.1 可拦截的四大对象

```java
// MyBatis 允许拦截以下四大对象的方法
@Intercepts({
    @Signature(type = Executor.class, method = "update", args = {MappedStatement.class, Object.class}),
    @Signature(type = Executor.class, method = "query", args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
    @Signature(type = StatementHandler.class, method = "prepare", args = {Connection.class}),
    @Signature(type = StatementHandler.class, method = "parameterize", args = {Statement.class}),
    @Signature(type = StatementHandler.class, method = "query", args = {Statement.class, ResultHandler.class}),
    @Signature(type = ParameterHandler.class, method = "setParameters", args = {PreparedStatement.class}),
    @Signature(type = ResultSetHandler.class, method = "handleResultSets", args = {Statement.class}),
})
```

### 4.2 插件链执行

```
用户调用
    ↓
Executor（被插件代理）
    ↓
StatementHandler（被插件代理）
    ↓
ParameterHandler（被插件代理）
    ↓
ResultSetHandler（被插件代理）
    ↓
JDBC 执行
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 执行入口 | MapperProxy.invoke() |
| 核心流程 | SqlSession → Executor → StatementHandler → JDBC |
| 四大对象 | Executor、StatementHandler、ParameterHandler、ResultSetHandler |
| 插件拦截 | 可拦截四大对象的方法 |
| 缓存位置 | Executor 维护一级缓存 |

---

## 6 新手常见误区

### 误区 1："SQL 直接由 Mapper 执行"

**错！** SQL 经过多层委托，最终由 JDBC 执行。

### 误区 2："插件可以拦截任何方法"

不是的。插件只能拦截 Executor、StatementHandler、ParameterHandler、ResultSetHandler 四大对象的特定方法。

### 误区 3："一级缓存由 SqlSession 维护"

**错！** 一级缓存由 Executor 维护，具体实现在 BaseExecutor 中。

---

## 7 动手练习

### 练习 1：基础练习

列出 SQL 执行流程中涉及的四大对象。

<details>
<summary>点击查看答案</summary>

```
1. Executor：执行器，负责 SQL 执行和缓存维护
2. StatementHandler：语句处理器，负责创建 Statement、设置参数、执行 SQL
3. ParameterHandler：参数处理器，负责设置 SQL 参数
4. ResultSetHandler：结果集处理器，负责将 ResultSet 转换为 Java 对象
```

</details>

### 练习 2：进阶练习

说明 StatementHandler 的三个核心方法的作用。

<details>
<summary>点击查看答案</summary>

```java
prepare()：创建 Statement 对象（调用 Connection.prepareStatement()）
parameterize()：设置 SQL 参数（调用 ParameterHandler.setParameters()）
query()/update()：执行 SQL 语句
```

</details>

### 练习 3（挑战）：综合练习

分析插件可以在哪些环节介入，以及介入的时机。

<details>
<summary>点击查看答案</summary>

```java
// 插件可以拦截的方法：

// Executor 层
- update(MappedStatement, Object)：更新操作前
- query(MappedStatement, Object, RowBounds, ResultHandler)：查询操作前

// StatementHandler 层
- prepare(Connection)：创建 Statement 前
- parameterize(Statement)：设置参数前
- query(Statement, ResultHandler)：执行查询前

// ParameterHandler 层
- setParameters(PreparedStatement)：设置参数时

// ResultSetHandler 层
- handleResultSets(Statement)：处理结果集时

// 介入时机：在目标方法执行前/后执行自定义逻辑
```

</details>

---

## 下一章预告

下一章我们会学习 **参数映射原理**——深入理解 #{} 与 ${} 的实现原理，以及 ParameterHandler 如何设置参数。你会学到参数是如何从 Java 对象映射到 SQL 的。
