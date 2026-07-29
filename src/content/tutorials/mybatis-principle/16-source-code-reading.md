---
title: "第16章：源码阅读实战"
description: "核心源码阅读方法、调试技巧、关键流程追踪"
---

# 第16章：源码阅读实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何阅读 MyBatis 源码？
- 有哪些调试技巧可以帮助理解源码？
- 关键流程如何追踪？
- 源码阅读的最佳实践是什么？

这一章就是为了解答这些问题。我们会从 **源码阅读方法** 入手，再深入 **调试技巧** 和 **关键流程追踪**。

---

## 1 源码阅读方法

### 1.1 从入口开始

```java
// 从最简单的使用开始追踪
SqlSession session = sqlSessionFactory.openSession();
UserMapper mapper = session.getMapper(UserMapper.class);
User user = mapper.selectById(1);
```

**追踪路径**：
1. `SqlSession.getMapper()` → `Configuration.getMapper()` → `MapperRegistry.getMapper()`
2. `MapperRegistry.getMapper()` → `MapperProxyFactory.newInstance()`
3. `MapperProxy.invoke()` → `MapperMethod.execute()`
4. `SqlSession.selectOne()` → `Executor.query()`

### 1.2 核心类关系

```
SqlSessionFactory
    └── DefaultSqlSessionFactory
            └── Configuration（配置中心）
                    ├── Environment（环境配置）
                    ├── TypeAliasRegistry（类型别名）
                    ├── TypeHandlerRegistry（类型处理器）
                    ├── MapperRegistry（Mapper 注册表）
                    └── MappedStatement（SQL 语句）

SqlSession
    └── DefaultSqlSession
            └── Executor（执行器）
                    ├── SimpleExecutor
                    ├── ReuseExecutor
                    └── BatchExecutor

Executor
    └── BaseExecutor
            └── StatementHandler（语句处理器）
                    ├── SimpleStatementHandler
                    ├── PreparedStatementHandler
                    └── CallableStatementHandler
```

### 1.3 关键接口

| 接口 | 作用 | 实现类 |
|------|------|--------|
| SqlSession | 会话接口 | DefaultSqlSession |
| Executor | 执行器 | SimpleExecutor、ReuseExecutor、BatchExecutor |
| StatementHandler | 语句处理器 | SimpleStatementHandler、PreparedStatementHandler |
| ParameterHandler | 参数处理器 | DefaultParameterHandler |
| ResultSetHandler | 结果集处理器 | DefaultResultSetHandler |

---

## 2 调试技巧

### 2.1 断点调试

```java
// 在关键位置设置断点
// 1. MapperProxy.invoke() - 拦截方法调用
// 2. Executor.query() - SQL 执行入口
// 3. StatementHandler.prepare() - Statement 创建
// 4. ParameterHandler.setParameters() - 参数设置
// 5. ResultSetHandler.handleResultSets() - 结果集处理
```

### 2.2 日志调试

```xml
<!-- mybatis-config.xml -->
<settings>
    <!-- 开启 SQL 日志 -->
    <setting name="logImpl" value="STDOUT_LOGGING"/>
</settings>
```

```properties
# application.properties（Spring Boot）
logging.level.com.example.mapper=DEBUG
```

### 2.3 自定义日志

```java
// 实现自定义日志
public class MyLogImpl implements Log {
    
    @Override
    public boolean isDebugEnabled() {
        return true;
    }
    
    @Override
    public boolean isTraceEnabled() {
        return true;
    }
    
    @Override
    public void error(String s, Throwable e) {
        System.err.println("ERROR: " + s);
        e.printStackTrace();
    }
    
    @Override
    public void debug(String s) {
        System.out.println("DEBUG: " + s);
    }
    
    @Override
    public void trace(String s) {
        System.out.println("TRACE: " + s);
    }
    
    @Override
    public void warn(String s) {
        System.out.println("WARN: " + s);
    }
}
```

```xml
<!-- 使用自定义日志 -->
<settings>
    <setting name="logImpl" value="com.example.MyLogImpl"/>
</settings>
```

---

## 3 关键流程追踪

### 3.1 SQL 执行流程

```java
// 1. 用户调用
UserMapper mapper = session.getMapper(UserMapper.class);
User user = mapper.selectById(1);

// 2. MapperProxy 拦截
public Object invoke(Object proxy, Method method, Object[] args) {
    // 断点位置
    return mapperMethod.execute(sqlSession, args);
}

// 3. MapperMethod 路由
public Object execute(SqlSession sqlSession, Object[] args) {
    // 断点位置：查看 SQL 类型
    switch (command.getType()) {
        case SELECT:
            return sqlSession.selectOne(command.getName(), param);
    }
}

// 4. SqlSession 委托
public <T> T selectOne(String statement, Object parameter) {
    // 断点位置
    return executor.query(ms, parameter, RowBounds.DEFAULT, handler);
}

// 5. Executor 执行
public <E> List<E> query(MappedStatement ms, Object parameter, 
                         RowBounds rowBounds, ResultHandler resultHandler) {
    // 断点位置：查看缓存
    BoundSql boundSql = ms.getBoundSql(parameter);
    CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
    List<E> result = (List<E>) localCache.getObject(key);
    if (result != null) {
        return result; // 缓存命中
    }
    return queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
}

// 6. 数据库查询
protected <E> List<E> doQuery(MappedStatement ms, Object parameter, 
                               RowBounds rowBounds, ResultHandler resultHandler, 
                               BoundSql boundSql) {
    // 断点位置：创建 StatementHandler
    StatementHandler handler = configuration.newStatementHandler(...);
    Statement stmt = prepareStatement(handler);
    return handler.query(stmt, resultHandler);
}
```

### 3.2 参数映射流程

```java
// 1. 获取 BoundSql
BoundSql boundSql = ms.getBoundSql(parameter);
// 断点位置：查看 SQL 和参数映射

// 2. 创建 Statement
Statement stmt = handler.prepare(connection);
// 断点位置：查看 SQL

// 3. 设置参数
handler.parameterize(stmt);
// 断点位置：进入 ParameterHandler

// 4. ParameterHandler 设置参数
public void setParameters(PreparedStatement ps) {
    // 断点位置：查看参数值
    for (ParameterMapping mapping : parameterMappings) {
        Object value = getParameterValue(mapping);
        typeHandler.setParameter(ps, i + 1, value, jdbcType);
    }
}
```

### 3.3 结果映射流程

```java
// 1. 执行查询
ResultSet rs = stmt.executeQuery();

// 2. 处理结果集
handler.handleResultSets(stmt);
// 断点位置：进入 ResultSetHandler

// 3. ResultSetHandler 处理
public <E> List<E> handleResultSets(Statement stmt) {
    ResultSetWrapper rsw = getFirstResultSet(stmt);
    // 断点位置：查看 ResultMap
    return handleResultSet(rsw, resultMap, multipleResults, null);
}

// 4. 创建结果对象
private Object getRowValue(ResultSetWrapper rsw, ResultMap resultMap) {
    // 断点位置：查看结果对象创建
    Object rowValue = createResultObject(rsw, resultMap);
    applyPropertyMappings(rsw, resultMap, metaObject);
    return rowValue;
}
```

---

## 4 源码阅读最佳实践

### 4.1 从简单到复杂

```
1. 先理解简单查询流程
2. 再理解动态 SQL 解析
3. 然后理解缓存机制
4. 最后理解插件机制
```

### 4.2 关注核心类

```
Configuration：配置中心
DefaultSqlSession：会话实现
BaseExecutor：执行器基类
RoutingStatementHandler：语句处理器路由
DefaultParameterHandler：参数处理器
DefaultResultSetHandler：结果集处理器
```

### 4.3 使用 IDE 工具

```
1. 使用 IDEA 的 Call Hierarchy（调用层次）
2. 使用 Type Hierarchy（类型层次）
3. 使用 Find Usages（查找用法）
4. 使用 Debug 模式单步跟踪
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 源码阅读方法 | 从入口开始、关注核心类、使用 IDE 工具 |
| 调试技巧 | 断点调试、日志调试、自定义日志 |
| 关键流程 | SQL 执行、参数映射、结果映射 |
| 最佳实践 | 从简单到复杂、关注核心类、使用 IDE 工具 |

---

## 6 新手常见误区

### 误区 1："源码阅读需要从第一行开始"

**错！** 应该从使用入口开始，追踪关键流程。

### 误区 2："所有源码都需要仔细阅读"

不是的。重点关注核心类和关键方法，忽略次要细节。

### 误区 3："源码阅读不需要调试"

**错！** 调试是理解源码的最好方式，应该结合断点和日志。

---

## 7 动手练习

### 练习 1：基础练习

列出 SQL 执行流程的关键步骤。

<details>
<parameter=点击查看答案