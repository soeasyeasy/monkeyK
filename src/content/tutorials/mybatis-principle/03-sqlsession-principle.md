---
title: "第3章：SqlSession 工作原理"
description: "SqlSession 创建流程、生命周期、线程安全机制"
---

# 第3章：SqlSession 工作原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- SqlSession 是怎么创建出来的？
- SqlSession 的生命周期应该如何管理？
- 为什么 SqlSession 不是线程安全的？
- SqlSession 在 Spring 中如何管理？

这一章就是为了解答这些问题。我们会从 **创建流程** 入手，再深入 **生命周期管理** 和 **线程安全机制**。

---

## 1 为什么需要理解 SqlSession 原理？

### 痛点分析

很多新手在使用 MyBatis 时：
- 不知道 SqlSession 应该在哪里创建和关闭
- 在 Web 应用中复用 SqlSession 导致数据错乱
- 不理解为什么 Spring 集成后不需要手动管理 SqlSession

### 解决方案

深入理解 SqlSession 的工作原理，才能正确使用它。

---

## 2 SqlSession 创建流程

### 2.1 创建过程详解

```java
// 1. 读取配置文件
String resource = "mybatis-config.xml";
InputStream inputStream = Resources.getResourceAsStream(resource);

// 2. 构建 SqlSessionFactory（建造者模式）
SqlSessionFactoryBuilder builder = new SqlSessionFactoryBuilder();
SqlSessionFactory factory = builder.build(inputStream);

// 3. 打开 SqlSession
SqlSession session = factory.openSession();
```

### 2.2 内部创建流程

```
SqlSessionFactory.openSession()
    ↓
SqlSessionFactory.openSessionFromDataSource()
    ↓
1. 获取 Environment（包含数据源、事务工厂）
    ↓
2. 创建 Transaction（事务管理器）
    ↓
3. 创建 Executor（执行器）
    ↓
4. 创建 DefaultSqlSession
    ↓
5. 返回 SqlSession
```

### 2.3 源码分析

```java
// DefaultSqlSessionFactory 核心方法
private SqlSession openSessionFromDataSource(
        ExecutorType execType, 
        TransactionIsolationLevel level, 
        boolean autoCommit) {
    
    Transaction tx = null;
    try {
        // 1. 获取环境配置
        Environment environment = configuration.getEnvironment();
        
        // 2. 创建事务管理器
        TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
        tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
        
        // 3. 创建执行器
        Executor executor = configuration.newExecutor(tx, execType);
        
        // 4. 创建并返回 SqlSession
        return new DefaultSqlSession(configuration, executor, autoCommit);
    } catch (Exception e) {
        closeTransaction(tx);
        throw ExceptionFactory.wrapException("Error opening session.", e);
    }
}
```

---

## 3 SqlSession 生命周期

### 3.1 四种作用域对比

| 作用域 | 说明 | 推荐程度 |
|--------|------|----------|
| **方法作用域** | 方法开始时创建，方法结束时关闭 | ✅ 推荐 |
| **请求作用域** | 请求开始时创建，请求结束时关闭 | ⚠️ 谨慎使用 |
| **应用作用域** | 应用启动时创建，应用关闭时销毁 | ❌ 不推荐 |
| **线程作用域** | 绑定到 ThreadLocal | ⚠️ Spring 中使用 |

### 3.2 推荐用法

```java
// ✅ 正确：方法作用域
public User selectUser(int id) {
    SqlSession session = sqlSessionFactory.openSession();
    try {
        UserMapper mapper = session.getMapper(UserMapper.class);
        return mapper.selectById(id);
    } finally {
        session.close(); // 确保关闭
    }
}
```

```java
// ❌ 错误：将 SqlSession 作为成员变量
public class UserService {
    private SqlSession session; // 线程不安全！
    
    public User selectUser(int id) {
        return session.selectOne("selectById", id);
    }
}
```

---

## 4 线程安全机制

### 4.1 为什么不是线程安全的？

SqlSession 内部持有：
- **Connection**：数据库连接，非线程安全
- **一级缓存**：HashMap 实现，非线程安全
- **Transaction**：事务状态，非线程安全

### 4.2 类比理解

> 把 SqlSession 想象成一个**私人助手**：
> - 每个人都有自己的私人助手（每个线程一个 SqlSession）
> - 助手记住你当前的工作状态（一级缓存、事务状态）
> - 如果多人共用一个助手，就会混乱

### 4.3 Spring 中的解决方案

```java
// Spring 使用 SqlSessionTemplate 包装 SqlSession
// 内部使用 SqlSessionInterceptor 动态代理

public class SqlSessionTemplate implements SqlSession {
    private final SqlSession sqlSessionProxy;
    
    public SqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        this.sqlSessionProxy = (SqlSession) Proxy.newProxyInstance(
            SqlSession.class.getClassLoader(),
            new Class[]{SqlSession.class},
            new SqlSessionInterceptor()  // 动态代理
        );
    }
}
```

**SqlSessionInterceptor 工作原理**：
1. 检查当前线程是否已有 SqlSession（ThreadLocal）
2. 如果有，直接复用
3. 如果没有，创建新的并绑定到 ThreadLocal
4. 方法执行完毕后，自动关闭或解绑

---

## 5 SqlSession 与 Spring 集成

### 5.1 集成原理

```
Spring 管理 SqlSessionFactory
    ↓
SqlSessionTemplate 代理 SqlSession
    ↓
SqlSessionInterceptor 拦截方法调用
    ↓
ThreadLocal 管理 SqlSession 生命周期
    ↓
事务结束时自动关闭 SqlSession
```

### 5.2 使用方式

```java
// ✅ Spring 中直接使用 Mapper（推荐）
@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;  // 无需关心 SqlSession
    
    public User getUser(int id) {
        return userMapper.selectById(id);
    }
}
```

```java
// ✅ 手动获取 SqlSession（需要时）
@Service
public class UserService {
    @Autowired
    private SqlSessionTemplate sqlSessionTemplate;
    
    public void batchInsert(List<User> users) {
        try (SqlSession session = sqlSessionTemplate.getSqlSessionFactory().openSession(ExecutorType.BATCH)) {
            UserMapper mapper = session.getMapper(UserMapper.class);
            for (User user : users) {
                mapper.insert(user);
            }
            session.commit();
        }
    }
}
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 创建流程 | Factory → DataSource → Transaction → Executor → SqlSession |
| 生命周期 | 推荐方法作用域，用完即关 |
| 线程安全 | SqlSession 非线程安全，每线程一个 |
| Spring 集成 | SqlSessionTemplate + ThreadLocal 管理 |
| 关闭方式 | try-finally 或 try-with-resources |

---

## 7 新手常见误区

### 误区 1："SqlSession 可以全局共享"

**错！** SqlSession 包含 Connection 和一级缓存，不是线程安全的，必须每个线程独立。

### 误区 2："忘记关闭 SqlSession 没关系"

**错！** 不关闭会导致连接泄漏，最终耗尽数据库连接池。

### 误区 3："Spring 中不需要关心 SqlSession"

不完全对。虽然 Spring 自动管理，但批量操作等特殊场景仍需手动获取。

---

## 8 动手练习

### 练习 1：基础练习

写出 SqlSession 的正确使用模板代码。

<details>
<summary>点击查看答案</summary>

```java
SqlSession session = sqlSessionFactory.openSession();
try {
    UserMapper mapper = session.getMapper(UserMapper.class);
    User user = mapper.selectById(1);
    session.commit();
} finally {
    session.close(); // 必须关闭
}
```

</details>

### 练习 2：进阶练习

解释为什么 SqlSession 不是线程安全的。

<details>
<parameter=点击查看答案