---
title: "第5章：Mapper 代理机制"
description: "Mapper 动态代理原理、JDK 动态代理、MapperProxy"
---

# 第5章：Mapper 代理机制

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Mapper 接口没有实现类，是怎么工作的？
- JDK 动态代理在 MyBatis 中是如何应用的？
- MapperProxy 做了什么？
- 方法调用是如何转化为 SQL 执行的？

这一章就是为了解答这些问题。我们会从 **动态代理基础** 入手，再深入 **MapperProxy 实现原理**。

---

## 1 为什么需要代理机制？

### 痛点分析

传统方式需要为每个 DAO 接口编写实现类：

```java
// ❌ 传统方式：需要大量实现类
public interface UserDao {
    User selectById(int id);
}

public class UserDaoImpl implements UserDao {
    @Override
    public User selectById(int id) {
        // 大量重复的 JDBC 代码
        Connection conn = null;
        PreparedStatement pstmt = null;
        // ...
    }
}
```

### 解决方案

MyBatis 使用动态代理，自动生成 Mapper 接口的实现：

```java
// ✅ MyBatis 方式：只需定义接口
public interface UserMapper {
    User selectById(int id);
}

// 无需实现类，MyBatis 自动生成代理对象
UserMapper mapper = sqlSession.getMapper(UserMapper.class);
User user = mapper.selectById(1);
```

> **一句话总结**：动态代理让你只定义接口，框架自动生成实现。

---

## 2 JDK 动态代理基础

### 2.1 核心概念

JDK 动态代理需要两个要素：
- **接口**：被代理的接口
- **InvocationHandler**：调用处理器，拦截方法调用

### 2.2 简单示例

```java
// 1. 定义接口
public interface UserService {
    void save(User user);
}

// 2. 实现 InvocationHandler
public class UserServiceHandler implements InvocationHandler {
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) {
        System.out.println("方法执行前：" + method.getName());
        // 实际逻辑
        System.out.println("方法执行后");
        return null;
    }
}

// 3. 创建代理
UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class[]{UserService.class},
    new UserServiceHandler()
);

// 4. 调用方法
proxy.save(new User()); // 会触发 invoke 方法
```

---

## 3 MapperProxy 实现原理

### 3.1 核心类

```java
public class MapperProxy<T> implements InvocationHandler, Serializable {
    private final SqlSession sqlSession;
    private final Class<T> mapperInterface;
    private final Map<Method, MapperMethodInvoker> methodCache;
    
    public MapperProxy(SqlSession sqlSession, Class<T> mapperInterface, 
                       Map<Method, MapperMethodInvoker> methodCache) {
        this.sqlSession = sqlSession;
        this.mapperInterface = mapperInterface;
        this.methodCache = methodCache;
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) {
        // Object 方法直接执行
        if (Object.class.equals(method.getDeclaringClass())) {
            try {
                return method.invoke(this, args);
            } catch (Throwable t) {
                throw ExceptionUtil.unwrapThrowable(t);
            }
        }
        
        // 其他方法通过 MapperMethod 执行
        final MapperMethodInvoker mapperMethod = resolveMethod(method);
        return mapperMethod.invoke(sqlSession, args);
    }
}
```

### 3.2 方法解析

```java
private MapperMethodInvoker resolveMethod(Method method) {
    // 从缓存获取
    MapperMethodInvoker mapperMethod = methodCache.get(method);
    if (mapperMethod == null) {
        // 缓存未命中，创建新的
        mapperMethod = new MapperMethodInvoker(method);
        methodCache.put(method, mapperMethod);
    }
    return mapperMethod;
}
```

### 3.3 MapperMethodInvoker

```java
private class MapperMethodInvoker {
    private final MapperMethod mapperMethod;
    
    MapperMethodInvoker(Method method) {
        this.mapperMethod = new MapperMethod(mapperInterface, method, sqlSession.getConfiguration());
    }
    
    Object invoke(SqlSession sqlSession, Object[] args) {
        return mapperMethod.execute(sqlSession, args);
    }
}
```

---

## 4 SQL 执行转化

### 4.1 执行流程

```
UserMapper.selectById(1)
    ↓
MapperProxy.invoke()
    ↓
MapperMethod.execute()
    ↓
判断 SQL 类型
    ↓
sqlSession.selectOne("UserMapper.selectById", 1)
    ↓
Executor.query()
```

### 4.2 源码分析

```java
public class MapperMethod {
    private final SqlCommand command;
    private final MethodSignature method;
    
    public Object execute(SqlSession sqlSession, Object[] args) {
        Object result;
        
        switch (command.getType()) {
            case INSERT: {
                Object param = method.convertArgsToSqlCommandParam(args);
                result = rowCountResult(sqlSession.insert(command.getName(), param));
                break;
            }
            case UPDATE: {
                Object param = method.convertArgsToSqlCommandParam(args);
                result = rowCountResult(sqlSession.update(command.getName(), param));
                break;
            }
            case DELETE: {
                Object param = method.convertArgsToSqlCommandParam(args);
                result = rowCountResult(sqlSession.delete(command.getName(), param));
                break;
            }
            case SELECT: {
                if (method.returnsVoid() && method.hasResultHandler()) {
                    // 无返回值的查询
                    executeWithResultHandler(sqlSession, args);
                    result = null;
                } else if (method.returnsMany()) {
                    // 返回列表
                    result = executeForMany(sqlSession, args);
                } else if (method.returnsMap()) {
                    // 返回 Map
                    result = executeForMap(sqlSession, args);
                } else {
                    // 返回单个对象
                    Object param = method.convertArgsToSqlCommandParam(args);
                    result = sqlSession.selectOne(command.getName(), param);
                }
                break;
            }
            default:
                throw new BindingException("Unknown execution method for: " + command.getName());
        }
        
        return result;
    }
}
```

---

## 5 代理对象获取

### 5.1 获取流程

```java
// SqlSession.getMapper() 实现
@Override
public <T> T getMapper(Class<T> type) {
    return configuration.getMapper(type, this);
}

// Configuration.getMapper() 实现
public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
    return mapperRegistry.getMapper(type, sqlSession);
}

// MapperRegistry.getMapper() 实现
public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
    MapperProxyFactory<T> mapperProxyFactory = (MapperProxyFactory<T>) knownMappers.get(type);
    if (mapperProxyFactory == null) {
        throw new BindingException("Type " + type + " is not known to the MapperRegistry.");
    }
    try {
        return mapperProxyFactory.newInstance(sqlSession);
    } catch (Exception e) {
        throw new BindingException("Error getting mapper instance.", e);
    }
}
```

### 5.2 MapperProxyFactory

```java
public class MapperProxyFactory<T> {
    private final Class<T> mapperInterface;
    private final Map<Method, MapperMethodInvoker> methodCache = new ConcurrentHashMap<>();
    
    public T newInstance(SqlSession sqlSession) {
        final MapperProxy<T> mapperProxy = new MapperProxy<>(sqlSession, mapperInterface, methodCache);
        return newInstance(mapperProxy);
    }
    
    @SuppressWarnings("unchecked")
    protected T newInstance(MapperProxy<T> mapperProxy) {
        // 使用 JDK 动态代理创建代理对象
        return (T) Proxy.newProxyInstance(
            mapperInterface.getClassLoader(),
            new Class[]{mapperInterface},
            mapperProxy
        );
    }
}
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 代理模式 | JDK 动态代理 |
| 核心类 | MapperProxy（InvocationHandler 实现） |
| 方法缓存 | methodCache 缓存方法解析结果 |
| 执行转化 | MapperMethod 将方法调用转化为 SQL 执行 |
| 代理创建 | MapperProxyFactory 使用 Proxy.newProxyInstance() |

---

## 7 新手常见误区

### 误区 1："Mapper 接口需要实现类"

**错！** Mapper 接口不需要实现类，MyBatis 通过动态代理自动生成。

### 误区 2："每次调用都创建新的代理对象"

不是的。MapperProxyFactory 会缓存方法解析结果，但代理对象本身是每次 getMapper() 时新建。

### 误区 3："代理对象是线程安全的"

**错！** 代理对象持有的 SqlSession 不是线程安全的，所以代理对象也不是线程安全的。

---

## 8 动手练习

### 练习 1：基础练习

说明 MapperProxy 实现了哪个接口，起什么作用。

<details>
<summary>点击查看答案</summary>

```java
MapperProxy 实现了 InvocationHandler 接口。
作用：拦截 Mapper 接口的方法调用，将方法调用转化为 SQL 执行。
当调用 mapper.selectById(1) 时，实际执行的是 MapperProxy.invoke() 方法。
```

</details>

### 练习 2：进阶练习

分析 MapperMethod.execute() 的执行流程。

<details>
<summary>点击查看答案</summary>

```java
1. 获取 SQL 命令类型（INSERT/UPDATE/DELETE/SELECT）
2. 根据类型执行不同操作：
   - INSERT：sqlSession.insert()
   - UPDATE：sqlSession.update()
   - DELETE：sqlSession.delete()
   - SELECT：根据返回类型选择
     - void：executeWithResultHandler()
     - List：executeForMany()
     - Map：executeForMap()
     - 单个对象：sqlSession.selectOne()
3. 返回执行结果
```

</details>

### 练习 3（挑战）：综合练习

设计一个简单的 Mapper 代理实现，模拟 MyBatis 的核心流程。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义 Mapper 接口
public interface UserMapper {
    @Select("SELECT * FROM user WHERE id = #{id}")
    User selectById(int id);
}

// 2. 实现 InvocationHandler
public class SimpleMapperProxy implements InvocationHandler {
    private final SqlSession sqlSession;
    
    public SimpleMapperProxy(SqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) {
        // 获取注解中的 SQL
        Select select = method.getAnnotation(Select.class);
        String sql = select.value()[0];
        
        // 执行 SQL
        String statementId = method.getDeclaringClass().getName() + "." + method.getName();
        return sqlSession.selectOne(statementId, args[0]);
    }
}

// 3. 创建代理
UserMapper mapper = (UserMapper) Proxy.newProxyInstance(
    UserMapper.class.getClassLoader(),
    new Class[]{UserMapper.class},
    new SimpleMapperProxy(sqlSession)
);
```

</details>

---

## 下一章预告

下一章我们会学习 **SQL 执行流程原理**——深入理解 SQL 从调用到执行的完整流程，以及四大核心对象的协作机制。你会学到 SQL 是如何一步步执行的。
