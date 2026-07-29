---
title: "第4章：配置文件解析原理"
description: "mybatis-config.xml 解析流程、Configuration 对象构建"
---

# 第4章：配置文件解析原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- mybatis-config.xml 是如何被解析的？
- Configuration 对象包含哪些信息？
- XML 配置是如何转化为内存对象的？
- 解析过程中有哪些重要的设计模式？

这一章就是为了解答这些问题。我们会从 **XML 解析流程** 入手，再深入 **Configuration 对象构建**。

---

## 1 为什么需要配置文件解析？

### 痛点分析

MyBatis 需要管理大量配置：
- 数据源配置（数据库连接信息）
- 事务管理配置
- 类型别名配置
- 插件配置
- Mapper 映射配置

这些配置需要一种统一的方式来组织和管理。

### 解决方案

MyBatis 使用 XML 配置文件 + Configuration 对象来管理所有配置。

> **一句话总结**：XML 是配置的载体，Configuration 是配置的内存表示。

---

## 2 配置文件解析流程

### 2.1 整体流程

```
mybatis-config.xml
    ↓
XMLConfigBuilder.parse()
    ↓
Configuration 对象
    ↓
SqlSessionFactory
```

### 2.2 解析步骤

```java
// 1. 创建 XMLConfigBuilder
XMLConfigBuilder parser = new XMLConfigBuilder(inputStream);

// 2. 解析配置
Configuration config = parser.parse();

// 3. 构建 SqlSessionFactory
SqlSessionFactory factory = new SqlSessionFactoryBuilder().build(config);
```

### 2.3 源码分析

```java
public Configuration parse() {
    // 防止重复解析
    if (parsed) {
        throw new BuilderException("Each XMLConfigBuilder can only be used once.");
    }
    parsed = true;
    
    // 解析 <configuration> 根节点
    parseConfiguration(parser.evalNode("/configuration"));
    return configuration;
}

private void parseConfiguration(XNode root) {
    try {
        // 按顺序解析各子节点
        propertiesElement(root.evalNode("properties"));        // 属性配置
        settingsAsProperties(root.evalNode("settings"));       // 设置配置
        typeAliasesElement(root.evalNode("typeAliases"));      // 类型别名
        pluginElement(root.evalNode("plugins"));               // 插件
        objectFactoryElement(root.evalNode("objectFactory"));  // 对象工厂
        objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));
        reflectorFactoryElement(root.evalNode("reflectorFactory"));
        settingsAsProperties(root.evalNode("settings"));       // 设置（再次）
        environmentsElement(root.evalNode("environments"));    // 环境配置
        databaseIdProviderElement(root.evalNode("databaseIdProvider"));
        typeHandlerElement(root.evalNode("typeHandlers"));     // 类型处理器
        mapperElement(root.evalNode("mappers"));               // Mapper 配置
    } catch (Exception e) {
        throw new BuilderException("Error parsing SQL Mapper Configuration.", e);
    }
}
```

---

## 3 Configuration 对象

### 3.1 核心属性

```java
public class Configuration {
    // 环境配置
    protected Environment environment;
    
    // 全局设置
    protected boolean autoMappingBehavior = true;
    protected boolean cacheEnabled = true;
    protected boolean lazyLoadingEnabled = false;
    
    // 类型别名注册表
    protected final MapperRegistry mapperRegistry = new MapperRegistry(this);
    
    // 类型别名
    protected final TypeAliasRegistry typeAliasRegistry = new TypeAliasRegistry();
    
    // 类型处理器
    protected final TypeHandlerRegistry typeHandlerRegistry = new TypeHandlerRegistry();
    
    // Mapper 映射语句
    protected final Map<String, MappedStatement> mappedStatements = new StrictMap<>("Mapped Statements collection");
    
    // 缓存
    protected final Map<String, Cache> caches = new StrictMap<>("Caches collection");
    
    // 结果映射
    protected final Map<String, ResultMap> resultMaps = new StrictMap<>("Result Maps collection");
    
    // 参数映射
    protected final Map<String, ParameterMap> parameterMaps = new StrictMap<>("Parameter Maps collection");
    
    // 插件链
    protected final InterceptorChain interceptorChain = new InterceptorChain();
    
    // ... 更多属性
}
```

### 3.2 Configuration 的作用

| 功能 | 说明 |
|------|------|
| 配置存储 | 存储所有解析后的配置信息 |
| 组件注册 | 注册类型别名、类型处理器、Mapper 等 |
| 工厂方法 | 提供创建 Executor、StatementHandler 等组件的方法 |
| 全局配置 | 管理全局设置（缓存、懒加载等） |

---

## 4 关键配置解析

### 4.1 环境配置解析

```xml
<environments default="development">
    <environment id="development">
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

解析过程：
```java
private void environmentsElement(XNode context) {
    if (context != null) {
        if (environment == null) {
            environment = context.getStringAttribute("default");
        }
        for (XNode child : context.getChildren()) {
            String id = child.getStringAttribute("id");
            if (isSpecifiedEnvironment(id)) {
                // 创建事务工厂
                TransactionFactory txFactory = transactionManagerElement(child.evalNode("transactionManager"));
                // 创建数据源
                DataSourceFactory dsFactory = dataSourceElement(child.evalNode("dataSource"));
                DataSource dataSource = dsFactory.getDataSource();
                
                // 构建 Environment
                Environment.Builder environmentBuilder = new Environment.Builder(id)
                    .transactionFactory(txFactory)
                    .dataSource(dataSource);
                this.environment = environmentBuilder.build();
            }
        }
    }
}
```

### 4.2 类型别名解析

```xml
<typeAliases>
    <typeAlias alias="User" type="com.example.User"/>
    <package name="com.example.model"/>
</typeAliases>
```

```java
private void typeAliasesElement(XNode parent) {
    if (parent != null) {
        for (XNode child : parent.getChildren()) {
            if ("package".equals(child.getName())) {
                // 批量注册包下所有类
                String typeAliasPackage = child.getStringAttribute("name");
                configuration.getTypeAliasRegistry().registerAliases(typeAliasPackage);
            } else {
                // 注册单个类型别名
                String alias = child.getStringAttribute("alias");
                String type = child.getStringAttribute("type");
                try {
                    Class<?> clazz = Resources.classForName(type);
                    configuration.getTypeAliasRegistry().registerAlias(alias, clazz);
                } catch (ClassNotFoundException e) {
                    throw new BuilderException("Error registering typeAlias for '" + alias + "'.", e);
                }
            }
        }
    }
}
```

### 4.3 插件解析

```xml
<plugins>
    <plugin interceptor="com.example.MyPlugin">
        <property name="someProperty" value="someValue"/>
    </plugin>
</plugins>
```

```java
private void pluginElement(XNode parent) {
    if (parent != null) {
        for (XNode child : parent.getChildren()) {
            String interceptor = child.getStringAttribute("interceptor");
            Properties properties = child.getChildrenAsProperties();
            Interceptor interceptorInstance = (Interceptor) resolveClass(interceptor).newInstance();
            interceptorInstance.setProperties(properties);
            configuration.addInterceptor(interceptorInstance);
        }
    }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 解析入口 | XMLConfigBuilder.parse() |
| 解析顺序 | properties → settings → typeAliases → plugins → environments → mappers |
| Configuration | 配置的内存表示，包含所有解析后的信息 |
| 解析模式 | 基于 XPath 的 DOM 解析 |
| 防重复解析 | parsed 标志位控制 |

---

## 6 新手常见误区

### 误区 1："配置文件可以任意顺序写"

**错！** MyBatis 对配置节点的顺序有严格要求，必须按照文档定义的顺序书写。

### 误区 2："Configuration 可以手动创建"

理论上可以，但不推荐。应该通过 XMLConfigBuilder 解析生成。

### 误区 3："类型别名只是语法糖"

不完全是。类型别名还涉及包扫描、自动注册等机制。

---

## 7 动手练习

### 练习 1：基础练习

列出 mybatis-config.xml 的解析顺序。

<details>
<summary>点击查看答案</summary>

```
1. properties（属性）
2. settings（设置）
3. typeAliases（类型别名）
4. plugins（插件）
5. objectFactory（对象工厂）
6. objectWrapperFactory
7. reflectorFactory
8. settings（再次）
9. environments（环境）
10. databaseIdProvider
11. typeHandlers（类型处理器）
12. mappers（Mapper）
```

</details>

### 练习 2：进阶练习

说明 Configuration 对象的核心作用。

<details>
<summary>点击查看答案</summary>

```
Configuration 的核心作用：
1. 存储所有解析后的配置信息
2. 注册类型别名、类型处理器、Mapper 等组件
3. 提供工厂方法创建 Executor、StatementHandler 等
4. 管理全局设置（缓存、懒加载等）
5. 作为 MyBatis 运行时的配置中心
```

</details>

### 练习 3（挑战）：综合练习

分析环境配置的解析过程。

<details>
<summary>点击查看答案</summary>

```java
// 1. 获取默认环境 ID
String defaultEnv = context.getStringAttribute("default");

// 2. 遍历 environment 子节点
for (XNode child : context.getChildren()) {
    String id = child.getStringAttribute("id");
    if (id.equals(defaultEnv)) {
        // 3. 解析事务管理器
        TransactionFactory txFactory = transactionManagerElement(...);
        
        // 4. 解析数据源
        DataSourceFactory dsFactory = dataSourceElement(...);
        DataSource dataSource = dsFactory.getDataSource();
        
        // 5. 构建 Environment 对象
        Environment env = new Environment.Builder(id)
            .transactionFactory(txFactory)
            .dataSource(dataSource)
            .build();
        
        configuration.setEnvironment(env);
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Mapper 代理机制**——深入理解 Mapper 接口的动态代理实现原理。你会学到 MyBatis 如何通过 JDK 动态代理让接口方法执行 SQL。
