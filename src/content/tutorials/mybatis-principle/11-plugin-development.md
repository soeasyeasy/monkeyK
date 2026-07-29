---
title: "第11章：插件开发原理"
description: "Interceptor 机制、责任链模式、插件开发实战"
---

# 第11章：插件开发原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- MyBatis 插件是如何工作的？
- 插件可以拦截哪些对象的方法？
- 如何开发自定义插件？
- 插件的执行顺序是怎样的？

这一章就是为了解答这些问题。我们会从 **插件的作用** 入手，再深入 **Interceptor 机制** 和 **插件开发实战**。

---

## 1 为什么需要插件？

### 痛点分析

在实际开发中，我们经常需要：
- 记录 SQL 执行日志
- 统计 SQL 执行时间
- 实现数据权限控制
- 分页处理
- 多租户支持

这些功能如果直接修改 MyBatis 源码，会导致：
- 维护困难
- 升级困难
- 代码耦合

### 解决方案

MyBatis 提供插件机制，允许在不修改核心代码的情况下扩展功能：

```java
// ✅ 插件方式：非侵入式扩展
@Intercepts({
    @Signature(type = Executor.class, method = "query", 
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class LogPlugin implements Interceptor {
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = invocation.proceed();
        long end = System.currentTimeMillis();
        System.out.println("SQL 执行时间：" + (end - start) + "ms");
        return result;
    }
}
```

> **一句话总结**：插件让你在不修改源码的情况下扩展 MyBatis 功能。

---

## 2 插件机制原理

### 2.1 可拦截的四大对象

```java
// MyBatis 允许拦截以下四大对象的方法
@Intercepts({
    // Executor 层
    @Signature(type = Executor.class, method = "update", 
               args = {MappedStatement.class, Object.class}),
    @Signature(type = Executor.class, method = "query", 
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
    
    // StatementHandler 层
    @Signature(type = StatementHandler.class, method = "prepare", 
               args = {Connection.class}),
    @Signature(type = StatementHandler.class, method = "parameterize", 
               args = {Statement.class}),
    @Signature(type = StatementHandler.class, method = "query", 
               args = {Statement.class, ResultHandler.class}),
    
    // ParameterHandler 层
    @Signature(type = ParameterHandler.class, method = "setParameters", 
               args = {PreparedStatement.class}),
    
    // ResultSetHandler 层
    @Signature(type = ResultSetHandler.class, method = "handleResultSets", 
               args = {Statement.class}),
})
```

### 2.2 责任链模式

MyBatis 使用责任链模式管理插件：

```java
public class InterceptorChain {
    // 插件链
    private final List<Interceptor> interceptors = new ArrayList<>();
    
    // 添加插件
    public void addInterceptor(Interceptor interceptor) {
        interceptors.add(interceptor);
    }
    
    // 创建代理对象
    public Object pluginAll(Object target) {
        for (Interceptor interceptor : interceptors) {
            target = interceptor.plugin(target);
        }
        return target;
    }
}
```

### 2.3 代理过程

```
原始对象（Executor/StatementHandler 等）
    ↓
Interceptor1.plugin() → 代理对象1
    ↓
Interceptor2.plugin() → 代理对象2
    ↓
Interceptor3.plugin() → 代理对象3
    ↓
最终代理对象
```

---

## 3 Interceptor 接口

### 3.1 核心方法

```java
public interface Interceptor {
    // 拦截方法
    Object intercept(Invocation invocation) throws Throwable;
    
    // 创建代理对象
    Object plugin(Object target);
    
    // 设置属性
    void setProperties(Properties properties);
}
```

### 3.2 Invocation 类

```java
public class Invocation {
    private final Object target;      // 被代理对象
    private final Method method;      // 被代理方法
    private final Object[] args;      // 方法参数
    
    // 执行原方法
    public Object proceed() throws InvocationTargetException, IllegalAccessException {
        return method.invoke(target, args);
    }
}
```

---

## 4 插件开发实战

### 4.1 日志插件示例

```java
@Intercepts({
    @Signature(type = Executor.class, method = "query", 
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class LogPlugin implements Interceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(LogPlugin.class);
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        // 1. 获取方法信息
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];
        String statementId = ms.getId();
        
        // 2. 记录开始时间
        long start = System.currentTimeMillis();
        
        try {
            // 3. 执行原方法
            Object result = invocation.proceed();
            
            // 4. 记录执行时间
            long end = System.currentTimeMillis();
            logger.info("SQL [{}] 执行时间：{}ms", statementId, (end - start));
            
            return result;
        } catch (Exception e) {
            logger.error("SQL [{}] 执行异常", statementId, e);
            throw e;
        }
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 可以读取插件配置
    }
}
```

### 4.2 分页插件示例

```java
@Intercepts({
    @Signature(type = StatementHandler.class, method = "prepare", 
               args = {Connection.class})
})
public class PagePlugin implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        // 1. 获取 StatementHandler
        StatementHandler handler = (StatementHandler) invocation.getTarget();
        
        // 2. 获取 MetaObject
        MetaObject metaObject = SystemMetaObject.forObject(handler);
        
        // 3. 获取 MappedStatement
        MappedStatement ms = (MappedStatement) metaObject.getValue("delegate.mappedStatement");
        
        // 4. 获取 RowBounds
        RowBounds rowBounds = (RowBounds) metaObject.getValue("delegate.rowBounds");
        
        // 5. 修改 SQL（添加 LIMIT）
        Connection connection = (Connection) invocation.getArgs()[0];
        String originalSql = (String) metaObject.getValue("delegate.boundSql.sql");
        
        if (rowBounds != RowBounds.DEFAULT) {
            String pageSql = originalSql + " LIMIT " + rowBounds.getOffset() + ", " + rowBounds.getLimit();
            metaObject.setValue("delegate.boundSql.sql", pageSql);
        }
        
        // 6. 执行原方法
        return invocation.proceed();
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 读取配置
    }
}
```

### 4.3 插件配置

```xml
<!-- mybatis-config.xml -->
<plugins>
    <plugin interceptor="com.example.LogPlugin">
        <property name="logLevel" value="INFO"/>
    </plugin>
    <plugin interceptor="com.example.PagePlugin"/>
</plugins>
```

---

## 5 Plugin 工具类

### 5.1 Plugin.wrap() 方法

```java
public class Plugin implements InvocationHandler {
    private final Object target;
    private final Interceptor interceptor;
    private final Map<Class<?>, Set<Method>> signatureMap;
    
    public static Object wrap(Object target, Interceptor interceptor) {
        // 1. 获取签名映射
        Map<Class<?>, Set<Method>> signatureMap = getSignatureMap(interceptor);
        
        // 2. 获取需要拦截的类型
        Class<?>[] interceptedTypes = getInterceptedTypes(signatureMap);
        
        // 3. 检查目标对象是否需要拦截
        if (!isIntercepted(target.getClass(), interceptedTypes)) {
            return target;
        }
        
        // 4. 创建代理对象
        return new Proxy(target, interceptor, signatureMap);
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        try {
            // 1. 检查方法是否需要拦截
            Set<Method> methods = signatureMap.get(method.getDeclaringClass());
            if (methods != null && methods.contains(method)) {
                // 2. 调用拦截器的 intercept 方法
                return interceptor.intercept(new Invocation(target, method, args));
            }
            
            // 3. 不需要拦截，直接执行
            return method.invoke(target, args);
        } catch (InvocationTargetException e) {
            throw e.getCause();
        }
    }
}
```

---

## 6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 可拦截对象 | Executor、StatementHandler、ParameterHandler、ResultSetHandler |
| Interceptor 接口 | intercept()、plugin()、setProperties() |
| 责任链模式 | InterceptorChain 管理插件链 |
| 代理机制 | JDK 动态代理 |
| 执行顺序 | 按配置顺序依次代理 |

---

## 7 新手常见误区

### 误区 1："插件可以拦截任何方法"

**错！** 插件只能拦截四大对象的特定方法，需要 @Signature 注解指定。

### 误区 2："插件执行顺序无所谓"

不是的。插件按配置顺序执行，先配置的插件先执行。

### 误区 3："插件性能开销很大"

**错！** 插件使用 JDK 动态代理，性能开销很小。

---

## 8 动手练习

### 练习 1：基础练习

列举 MyBatis 插件可以拦截的四大对象。

<details>