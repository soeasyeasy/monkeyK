---
title: "第1章：MyBatis 架构概述"
description: "MyBatis 整体架构、设计模式、核心模块划分"
---

# 第1章：MyBatis 架构概述

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MyBatis 到底是什么？它和 Hibernate 有什么区别？
- MyBatis 的架构是怎样的？有哪些核心模块？
- 为什么 MyBatis 在国内这么流行？
- 学习 MyBatis 原理有什么实际价值？

这一章就是为了解答这些问题。我们会先搞清楚 **MyBatis 的整体架构**，再理解 **核心模块划分**，最后了解 **设计模式的应用**。

---

## 1 为什么需要 MyBatis？

### 痛点分析

在没有 MyBatis 之前，我们使用 JDBC 操作数据库：

```java
// ❌ 传统 JDBC 的痛点
Connection conn = null;
PreparedStatement pstmt = null;
ResultSet rs = null;

try {
    // 1. 加载驱动
    Class.forName("com.mysql.jdbc.Driver");
    
    // 2. 获取连接
    conn = DriverManager.getConnection(
        "jdbc:mysql://localhost:3306/test", "root", "password");
    
    // 3. 编写 SQL
    String sql = "SELECT * FROM user WHERE id = ?";
    
    // 4. 创建 PreparedStatement
    pstmt = conn.prepareStatement(sql);
    pstmt.setInt(1, 1);
    
    // 5. 执行查询
    rs = pstmt.executeQuery();
    
    // 6. 处理结果集
    while (rs.next()) {
        int id = rs.getInt("id");
        String name = rs.getString("name");
        // ... 手动映射字段
    }
} catch (Exception e) {
    e.printStackTrace();
} finally {
    // 7. 关闭资源
    if (rs != null) rs.close();
    if (pstmt != null) pstmt.close();
    if (conn != null) conn.close();
}
```

**痛点总结**：
- 代码冗长，大量重复代码
- SQL 硬编码在 Java 中，修改需要重新编译
- 参数设置和结果映射需要手动处理
- 资源管理容易出错

### MyBatis 的解决方案

MyBatis 是一个**半自动化的持久层框架**，它将 SQL 语句提取到 XML 配置文件中，通过简单的配置就能完成数据库操作：

```java
// ✅ MyBatis 的简洁方式
UserMapper mapper = sqlSession.getMapper(UserMapper.class);
User user = mapper.selectById(1);
```

```xml
<!-- SQL 在 XML 中管理 -->
<select id="selectById" resultType="User">
    SELECT * FROM user WHERE id = #{id}
</select>
```

> **一句话总结**：MyBatis 让你专注于 SQL 本身，而不必关心 JDBC 的繁琐细节。

---

## 2 MyBatis 整体架构

### 架构图

MyBatis 的架构可以分为三层：

```
┌─────────────────────────────────────┐
│           接口层                     │
│    SqlSession 及 API 接口            │
├─────────────────────────────────────┤
│           核心处理层                  │
│  ┌──────────┬──────────┬─────────┐  │
│  │ 配置解析  │ SQL 解析  │ SQL 执行 │  │
│  │ Builder  │ Language │ Executor │  │
│  └──────────┴──────────┴─────────┘  │
│  ┌──────────┬──────────┬─────────┐  │
│  │ 参数映射  │ 结果映射  │ 插件    │  │
│  │Parameter │ ResultSet│Plugin  │  │
│  │Handler   │ Handler  │        │  │
│  └──────────┴──────────┴─────────┘  │
├─────────────────────────────────────┤
│           基础支撑层                  │
│  数据源、事务、缓存、反射、日志        │
└─────────────────────────────────────┘
```

### 三层架构详解

| 层级 | 职责 | 核心组件 |
|------|------|----------|
| **接口层** | 提供对外 API | SqlSession、Mapper 接口 |
| **核心处理层** | SQL 解析与执行 | Configuration、SqlSessionFactory、Executor、StatementHandler |
| **基础支撑层** | 提供基础能力 | DataSource、Transaction、Cache、Reflection |

---

## 3 核心模块划分

### 3.1 接口层

接口层是 MyBatis 与应用程序交互的入口：

```java
// 核心接口
public interface SqlSession {
    <T> T selectOne(String statement, Object parameter);
    <E> List<E> selectList(String statement, Object parameter);
    int insert(String statement, Object parameter);
    int update(String statement, Object parameter);
    int delete(String statement, Object parameter);
    // ...
}
```

**SqlSession 的生命周期**：
- 创建：通过 SqlSessionFactory 创建
- 使用：执行 SQL 操作
- 关闭：使用完毕后必须关闭

### 3.2 核心处理层

核心处理层包含四大对象：

| 对象 | 职责 | 说明 |
|------|------|------|
| **Executor** | 执行器 | 负责 SQL 执行和缓存维护 |
| **StatementHandler** | 语句处理器 | 封装 JDBC Statement 操作 |
| **ParameterHandler** | 参数处理器 | 负责设置参数 |
| **ResultSetHandler** | 结果集处理器 | 负责将 ResultSet 转换为对象 |

### 3.3 基础支撑层

基础支撑层提供底层能力：

- **数据源**：支持简单数据源、Pooled 数据源、JNDI 数据源
- **事务**：支持 JDBC 事务、Managed 事务
- **缓存**：一级缓存（SqlSession 级别）、二级缓存（Mapper 级别）
- **反射**：封装 Java 反射和 OGNL 表达式
- **日志**：支持多种日志实现（Log4j、Slf4j 等）

---

## 4 设计模式应用

MyBatis 中使用了大量设计模式：

| 设计模式 | 应用场景 | 示例 |
|----------|----------|------|
| **工厂模式** | 创建对象 | SqlSessionFactory、ObjectFactory |
| **代理模式** | Mapper 接口实现 | MapperProxy |
| **模板方法模式** | 定义执行框架 | BaseExecutor、BaseStatementHandler |
| **责任链模式** | 插件机制 | InterceptorChain |
| **装饰器模式** | 缓存实现 | LruCache、LoggingCache |
| **建造者模式** | 复杂对象构建 | SqlSessionFactoryBuilder |

### 代理模式示例

```java
// MapperProxy 是 JDK 动态代理的 InvocationHandler
public class MapperProxy<T> implements InvocationHandler {
    private final SqlSession sqlSession;
    private final Class<T> mapperInterface;
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) {
        // 执行 Mapper 方法时，实际执行的是 SQL
        return sqlSession.selectOne(statementName, args[0]);
    }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| MyBatis 定位 | 半自动化 ORM 框架，专注于 SQL |
| 三层架构 | 接口层、核心处理层、基础支撑层 |
| 四大核心对象 | Executor、StatementHandler、ParameterHandler、ResultSetHandler |
| 设计模式 | 工厂、代理、模板方法、责任链、装饰器、建造者 |
| 与 Hibernate 对比 | MyBatis 更灵活，SQL 可控；Hibernate 更自动化 |

---

## 6 新手常见误区

### 误区 1："MyBatis 是全自动化 ORM 框架"

**错！** MyBatis 是半自动化框架，需要手动编写 SQL，而 Hibernate 是全自动化框架，自动生成 SQL。

### 误区 2："MyBatis 只能使用 XML 配置"

不是的。MyBatis 支持 XML 和注解两种方式，注解方式更适合简单 SQL。

### 误区 3："SqlSession 可以长期持有"

**错！** SqlSession 不是线程安全的，应该用完即关闭，通常在方法级别使用。

---

## 7 动手练习

### 练习 1：基础练习

画出 MyBatis 的三层架构图，并说明每层的职责。

<details>
<summary>点击查看答案</summary>

```
接口层：提供 SqlSession 等对外 API
核心处理层：SQL 解析、执行、参数映射、结果映射
基础支撑层：数据源、事务、缓存、反射、日志
```

</details>

### 练习 2：进阶练习

列举 MyBatis 中的四大核心对象，并说明它们的职责。

<details>
<summary>点击查看答案</summary>

```java
Executor：执行器，负责 SQL 执行和缓存维护
StatementHandler：语句处理器，封装 JDBC Statement 操作
ParameterHandler：参数处理器，负责设置参数
ResultSetHandler：结果集处理器，负责将 ResultSet 转换为对象
```

</details>

### 练习 3（挑战）：综合练习

分析 MyBatis 中使用代理模式的场景，并说明其作用。

<details>
<summary>点击查看答案</summary>

```java
// MapperProxy 实现 Mapper 接口的动态代理
public class MapperProxy<T> implements InvocationHandler {
    private final SqlSession sqlSession;
    private final Class<T> mapperInterface;
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) {
        // 将 Mapper 方法调用转换为 SQL 执行
        MapperMethod mapperMethod = new MapperMethod(method);
        return mapperMethod.execute(sqlSession, args);
    }
}
```

作用：让开发者只需定义 Mapper 接口，无需编写实现类，MyBatis 动态生成代理对象执行 SQL。

</details>

---

## 下一章预告

下一章我们会学习 **核心组件原理**——深入理解 SqlSessionFactory、SqlSession、Executor、StatementHandler 等核心组件的工作原理。你会学到这些组件如何协作完成 SQL 执行。
