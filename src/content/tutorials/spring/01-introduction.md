---
title: "第1章：Spring 概述与核心原理"
description: "理解 Spring 框架的核心思想、IoC 和 AOP 原理"
---

# 第1章：Spring 概述与核心原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring 到底是什么？为什么企业开发都在用它？
- IoC（控制反转）和 DI（依赖注入）是什么？听起来很抽象
- AOP（面向切面编程）能解决什么问题？
- Spring 和 Spring Boot 有什么区别？

这一章就是为了解答这些问题。我们会先搞清楚 **Spring 的核心概念**，理解它为什么能成为 Java 开发的"标准配置"，然后通过实际代码感受 Spring 的魅力。

---

## 1.1 为什么需要 Spring？

### 痛点分析

想象一下，你要开一家餐厅。如果没有 Spring，你需要：

1. **自己管理所有对象**：每个服务员、厨师、收银员都要你自己创建和管理
2. **手动处理各种关系**：谁负责哪桌客人、谁给谁传菜，都要你自己协调
3. **重复造轮子**：每次开新餐厅，都要重新写一套管理逻辑
4. **难以测试**：想换个厨师试试？得把整个餐厅的运作都停掉

用代码来说，就是这样的：

```java
// 没有 Spring 时的代码
public class OrderService {
    // 直接创建依赖对象，耦合度高
    private UserRepository userRepository = new UserRepository();
    private EmailService emailService = new EmailService();
    
    public void createOrder(Order order) {
        // 保存订单
        userRepository.save(order);
        // 发送邮件
        emailService.send(order.getUser().getEmail(), "订单创建成功");
    }
}
```

**问题**：
- 如果 `UserRepository` 要换成 `DatabaseRepository`，要改代码
- 如果想测试 `OrderService`，必须同时创建 `UserRepository` 和 `EmailService`
- 对象之间的依赖关系硬编码，难以维护和扩展

### 解决方案

Spring 就像一个**专业的餐厅管理系统**：

1. **帮你管理所有对象**：你只需要说"我需要一个服务员"，系统自动给你
2. **自动处理关系**：谁依赖谁，系统自动注入，不用你操心
3. **提供现成模板**：常用的功能都有标准实现，拿来就用
4. **方便测试**：可以随时替换任何组件，不影响整体运作

用 Spring 写同样的代码：

```java
// 使用 Spring 后的代码
@Service
public class OrderService {
    // 依赖由 Spring 自动注入
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    // 通过构造函数注入依赖
    @Autowired
    public OrderService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
    
    public void createOrder(Order order) {
        userRepository.save(order);
        emailService.send(order.getUser().getEmail(), "订单创建成功");
    }
}
```

> **一句话总结**：Spring 帮你管理对象的创建和依赖关系，让你专注于业务逻辑，而不是对象管理。

---

## 1.2 核心原理

### 1.2.1 IoC（控制反转）

**概念解释**：

IoC（Inversion of Control，控制反转）是 Spring 最核心的思想。简单来说，就是**把对象的创建和管理权交给 Spring 容器**，而不是由你自己直接控制。

打个比方：

> 传统方式就像你自己做饭：要买菜、洗菜、切菜、炒菜，所有步骤都要自己来。
> 
> IoC 就像请了个厨师：你只需要说"我要吃宫保鸡丁"，厨师帮你把所有步骤都做了。你不用关心怎么做，只管吃就行。

**对比分析**：

| 特性 | 传统方式 | IoC 方式 |
| --- | --- | --- |
| 对象创建 | 自己 new 出来 | Spring 容器创建 |
| 依赖管理 | 手动设置依赖 | Spring 自动注入 |
| 耦合度 | 高（硬编码） | 低（接口编程） |
| 可测试性 | 差（依赖具体类） | 好（可以注入 Mock） |
| 代码复杂度 | 高 | 低 |

### 1.2.2 DI（依赖注入）

**概念解释**：

DI（Dependency Injection，依赖注入）是 IoC 的具体实现方式。Spring 通过**构造函数、Setter 方法或字段注入**的方式，把对象依赖的其他对象自动注入进来。

打个比方：

> 依赖注入就像组装电脑：你买了一个主板（OrderService），CPU（UserRepository）、内存（EmailService）等配件由 Spring 自动帮你装好，不用你自己一个个插上去。

**三种注入方式**：

```java
// 1. 构造函数注入（推荐）
@Service
public class OrderService {
    private final UserRepository userRepository;
    
    // 通过构造函数注入
    @Autowired
    public OrderService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// 2. Setter 注入
@Service
public class OrderService {
    private UserRepository userRepository;
    
    // 通过 Setter 方法注入
    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// 3. 字段注入（不推荐，但代码简洁）
@Service
public class OrderService {
    // 直接在字段上注入
    @Autowired
    private UserRepository userRepository;
}
```

> **推荐做法**：优先使用构造函数注入，因为可以保证依赖不可变（final）且不为 null。

### 1.2.3 AOP（面向切面编程）

**概念解释**：

AOP（Aspect-Oriented Programming，面向切面编程）用于处理**跨切面的关注点**，比如日志、事务、权限检查等。这些功能会分散在多个业务方法中，用 AOP 可以把它们集中管理。

打个比方：

> 传统方式就像每个房间都要单独装监控：厨房装一个、客厅装一个、卧室装一个，每个都要单独配置。
> 
> AOP 就像装了一个中央监控系统：你只需要设置"所有房间都要监控"，系统自动帮你搞定，不用每个房间单独处理。

**AOP 的核心概念**：

| 术语 | 说明 | 例子 |
| --- | --- | --- |
| 切面（Aspect） | 跨切面功能的模块化封装 | 日志记录、事务管理 |
| 连接点（JoinPoint） | 程序执行过程中的某个点 | 方法调用、异常抛出 |
| 通知（Advice） | 切面在特定连接点执行的动作 | 前置通知、后置通知 |
| 切入点（Pointcut） | 匹配连接点的表达式 | 匹配所有 Service 方法 |
| 目标对象（Target） | 被通知的对象 | OrderService |
| 代理（Proxy） | 创建的通知对象 | JDK 动态代理或 CGLIB |

**AOP 示例代码**：

```java
// 定义一个日志切面
@Aspect
@Component
public class LogAspect {
    
    // 定义切入点：匹配所有 Service 类的方法
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}
    
    // 前置通知：方法执行前记录日志
    @Before("serviceLayer()")
    public void logBefore(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        System.out.println("方法开始: " + methodName);
    }
    
    // 后置通知：方法执行后记录日志
    @After("serviceLayer()")
    public void logAfter(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        System.out.println("方法结束: " + methodName);
    }
    
    // 环绕通知：可以控制是否执行目标方法
    @Around("serviceLayer()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        
        // 执行目标方法
        Object result = joinPoint.proceed();
        
        long elapsed = System.currentTimeMillis() - start;
        System.out.println("执行时间: " + elapsed + "ms");
        
        return result;
    }
}
```

> **原理**：AOP 通过动态代理实现。Spring 会在运行时为目标对象创建代理对象，在代理对象中织入切面逻辑。

---

## 1.3 Spring 容器

### 概念解释

Spring 容器是 Spring 框架的核心，负责：

1. **创建对象**：根据配置创建 Bean 实例
2. **管理依赖**：自动注入对象之间的依赖关系
3. **管理生命周期**：控制 Bean 的创建和销毁时机

打个比方：

> Spring 容器就像一个**智能管家**：你告诉它"我需要一个厨师"，它会帮你找到合适的厨师，给他配备需要的工具（依赖），并在不需要时让他离开。

### Bean 的生命周期

```java
@Component
public class MyBean {
    
    // 1. 构造函数：Bean 被创建时调用
    public MyBean() {
        System.out.println("构造函数：Bean 被创建");
    }
    
    // 2. 依赖注入：注入依赖
    @Autowired
    private Dependency dependency;
    
    // 3. 初始化方法：依赖注入完成后调用
    @PostConstruct
    public void init() {
        System.out.println("初始化：依赖注入完成");
    }
    
    // 4. 使用 Bean
    public void doSomething() {
        System.out.println("使用 Bean");
    }
    
    // 5. 销毁方法：容器关闭时调用
    @PreDestroy
    public void destroy() {
        System.out.println("销毁：Bean 即将被销毁");
    }
}
```

**Bean 的作用域**：

| 作用域 | 说明 | 使用场景 |
| --- | --- | --- |
| singleton | 单例（默认） | 无状态的 Service、DAO |
| prototype | 每次获取都创建新实例 | 有状态的 Bean |
| request | 每个 HTTP 请求一个实例 | Web 应用 |
| session | 每个 HTTP 会话一个实例 | Web 应用 |

---

## 1.4 基础用法

### 1.4.1 创建 Spring 项目

使用 Maven 创建 Spring 项目，`pom.xml` 配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 项目基本信息 -->
    <groupId>com.example</groupId>
    <artifactId>spring-demo</artifactId>
    <version>1.0-SNAPSHOT</version>

    <!-- 引入 Spring 依赖 -->
    <dependencies>
        <!-- Spring 核心 -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>6.0.0</version>
        </dependency>
        
        <!-- Spring 测试 -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-test</artifactId>
            <version>6.0.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

### 1.4.2 定义 Bean

```java
// 使用 @Component 注解标记为 Spring Bean
@Component
public class UserService {
    
    // 业务方法
    public void createUser(String username) {
        System.out.println("创建用户: " + username);
    }
}
```

### 1.4.3 配置类

```java
// 使用 @Configuration 标记配置类
@Configuration
@ComponentScan("com.example") // 扫描指定包下的组件
public class AppConfig {
    
    // 使用 @Bean 手动定义 Bean
    @Bean
    public UserRepository userRepository() {
        return new UserRepository();
    }
}
```

### 1.4.4 启动容器

```java
public class Main {
    public static void main(String[] args) {
        // 创建 Spring 容器
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        
        // 从容器中获取 Bean
        UserService userService = context.getBean(UserService.class);
        
        // 使用 Bean
        userService.createUser("张三");
    }
}
```

> **原理**：`AnnotationConfigApplicationContext` 会扫描配置类和组件注解，自动创建和管理 Bean。

---

## 1.5 Spring vs Spring Boot

| 特性 | Spring | Spring Boot |
| --- | --- | --- |
| 配置方式 | 需要大量 XML 或 Java 配置 | 自动配置，开箱即用 |
| 依赖管理 | 手动管理版本 | 提供 starter 依赖 |
| 内嵌服务器 | 需要外部部署到 Tomcat | 内嵌 Tomcat/Jetty |
| 启动方式 | 需要配置 DispatcherServlet | 直接运行 main 方法 |
| 学习曲线 | 陡峭 | 平缓 |
| 适用场景 | 传统企业应用 | 微服务、快速开发 |

> **建议**：新项目优先使用 Spring Boot，除非有特殊需求。

---

## 1.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| IoC | 控制反转，把对象管理权交给 Spring |
| DI | 依赖注入，IoC 的具体实现方式 |
| AOP | 面向切面编程，处理跨切面关注点 |
| Bean | Spring 容器管理的对象 |
| ApplicationContext | Spring 容器接口 |
| @Component | 标记类为 Spring Bean |
| @Autowired | 标记需要注入的依赖 |
| @Configuration | 标记配置类 |
| @Bean | 在配置类中定义 Bean |

---

## 1.7 新手常见误区

### 误区 1："Spring 和 Spring Boot 是一回事"

**错！** Spring 是一个框架，Spring Boot 是基于 Spring 的快速开发工具。Spring Boot 简化了 Spring 的配置，提供了自动配置和内嵌服务器，让开发更简单。

**正确理解**：
- Spring 是核心框架，提供 IoC、AOP 等功能
- Spring Boot 是 Spring 的封装，让你快速创建独立运行的应用
- 学习 Spring 是基础，Spring Boot 是应用

### 误区 2："必须用 XML 配置 Spring"

不是的。Spring 支持三种配置方式：
1. **XML 配置**（传统方式，现在很少用）
2. **注解配置**（@Component、@Autowired 等，主流方式）
3. **Java 配置**（@Configuration、@Bean，推荐方式）

现代 Spring 开发主要使用注解和 Java 配置，XML 已经很少用了。

### 误区 3："@Autowired 必须用在字段上"

**不推荐！** 虽然字段注入代码简洁，但有以下问题：
- 无法使用 final 修饰符，依赖不可变性差
- 无法通过构造函数保证依赖不为 null
- 单元测试困难，需要反射注入

**推荐做法**：使用构造函数注入

```java
// 推荐
@Service
public class UserService {
    private final UserRepository userRepository;
    
    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// 不推荐
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
}
```

### 误区 4："单例 Bean 是线程安全的"

**错！** Spring 的单例 Bean 只是保证容器中只有一个实例，但不保证线程安全。如果 Bean 中有可变状态，需要自己处理并发问题。

**正确做法**：
- 尽量设计无状态的 Bean
- 使用 ThreadLocal 保存线程私有数据
- 必要时使用同步机制

### 误区 5："AOP 会影响性能"

**影响很小！** Spring AOP 使用动态代理实现，虽然会有一定性能开销，但在大多数业务场景中可以忽略不计。AOP 带来的代码清晰度和可维护性提升，远大于这点性能损失。

**注意**：在高性能场景（如高频调用的方法）中，可以考虑使用 AspectJ 编译时织入。

---

## 1.8 动手练习

### 练习 1：基础练习 - 创建简单的 Spring 应用

创建一个 Spring 应用，包含以下功能：
1. 定义一个 `MessageService` 类，有 `sendMessage(String message)` 方法
2. 使用 `@Component` 标记为 Spring Bean
3. 创建配置类，扫描 `com.example` 包
4. 从容器中获取 Bean 并调用方法

<details>
<summary>点击查看答案</summary>

```java
// MessageService.java
package com.example;

import org.springframework.stereotype.Component;

// 使用 @Component 标记为 Spring Bean
@Component
public class MessageService {
    
    // 发送消息的方法
    public void sendMessage(String message) {
        System.out.println("发送消息: " + message);
    }
}

// AppConfig.java
package com.example;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ComponentScan;

// 标记为配置类
@Configuration
// 扫描 com.example 包下的组件
@ComponentScan("com.example")
public class AppConfig {
}

// Main.java
package com.example;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class Main {
    public static void main(String[] args) {
        // 创建 Spring 容器
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        
        // 从容器中获取 MessageService Bean
        MessageService messageService = context.getBean(MessageService.class);
        
        // 调用方法
        messageService.sendMessage("Hello Spring!");
    }
}
```

</details>

### 练习 2：进阶练习 - 依赖注入

创建一个 `OrderService`，依赖 `UserRepository` 和 `EmailService`：
1. 使用构造函数注入依赖
2. 实现 `createOrder(String username)` 方法
3. 在方法中调用依赖对象的方法

<details>
<summary>点击查看答案</summary>

```java
// UserRepository.java
package com.example;

import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    
    public void saveUser(String username) {
        System.out.println("保存用户: " + username);
    }
}

// EmailService.java
package com.example;

import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    public void sendEmail(String to, String subject) {
        System.out.println("发送邮件到: " + to + ", 主题: " + subject);
    }
}

// OrderService.java
package com.example;

import org.springframework.stereotype.Service;

@Service
public class OrderService {
    
    // 依赖对象，使用 final 保证不可变
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    // 构造函数注入依赖
    public OrderService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
    
    // 创建订单的方法
    public void createOrder(String username) {
        // 保存用户
        userRepository.saveUser(username);
        // 发送邮件通知
        emailService.sendEmail(username + "@example.com", "订单创建成功");
        System.out.println("订单创建完成");
    }
}

// Main.java
package com.example;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan("com.example")
public class AppConfig {
}

public class Main {
    public static void main(String[] args) {
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        
        OrderService orderService = context.getBean(OrderService.class);
        orderService.createOrder("张三");
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - AOP 日志切面

创建一个日志切面，实现以下功能：
1. 定义一个 `LogAspect` 切面
2. 使用 `@Before` 通知记录方法开始日志
3. 使用 `@After` 通知记录方法结束日志
4. 使用 `@Around` 通知记录方法执行时间
5. 切入点匹配所有 `Service` 类的方法

<details>
<summary>点击查看答案</summary>

```java
// LogAspect.java
package com.example;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

// 标记为切面
@Aspect
@Component
public class LogAspect {
    
    // 定义切入点：匹配所有 Service 类的方法
    @Pointcut("execution(* com.example.*Service.*(..))")
    public void serviceLayer() {}
    
    // 前置通知：方法执行前记录日志
    @Before("serviceLayer()")
    public void logBefore(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        System.out.println("[日志] 方法开始: " + methodName);
    }
    
    // 后置通知：方法执行后记录日志
    @After("serviceLayer()")
    public void logAfter(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        System.out.println("[日志] 方法结束: " + methodName);
    }
    
    // 环绕通知：记录方法执行时间
    @Around("serviceLayer()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        
        // 执行目标方法
        Object result = joinPoint.proceed();
        
        long elapsed = System.currentTimeMillis() - start;
        String methodName = joinPoint.getSignature().getName();
        System.out.println("[日志] " + methodName + " 执行时间: " + elapsed + "ms");
        
        return result;
    }
}

// UserService.java
package com.example;

import org.springframework.stereotype.Service;

@Service
public class UserService {
    
    public void createUser(String username) {
        System.out.println("创建用户: " + username);
    }
    
    public void deleteUser(String username) {
        System.out.println("删除用户: " + username);
    }
}

// Main.java
package com.example;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@Configuration
@ComponentScan("com.example")
// 启用 AspectJ 自动代理
@EnableAspectJAutoProxy
public class AppConfig {
}

public class Main {
    public static void main(String[] args) {
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        
        UserService userService = context.getBean(UserService.class);
        userService.createUser("张三");
        System.out.println("---");
        userService.deleteUser("李四");
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring Boot 快速入门**——也就是如何使用 Spring Boot 快速创建一个可运行的 Web 应用。你会学到：

- Spring Boot 项目的创建和结构
- 自动配置的原理
- 如何编写 RESTful API
- 如何连接数据库

准备好了吗？让我们继续深入 Spring 的世界！
