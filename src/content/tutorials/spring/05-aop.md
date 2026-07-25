---
title: "第5章：Spring AOP 面向切面编程"
description: "使用 AOP 处理日志、事务、权限等跨切面关注点"
---

# 第5章：Spring AOP 面向切面编程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 AOP？它能解决什么问题？
- 切面、通知、切入点这些概念是什么意思？
- Spring AOP 是如何工作的？
- 如何在实际项目中使用 AOP？

这一章就是为了解答这些问题。我们会从 AOP 的核心概念开始，理解它的工作原理，然后通过实际案例掌握 AOP 的使用。

---

## 5.1 为什么需要 AOP？

### 痛点分析

在开发中，我们经常需要处理一些"跨切面"的功能，比如：

1. **日志记录**：每个方法都要记录日志
2. **权限检查**：每个接口都要检查权限
3. **事务管理**：每个数据库操作都要管理事务
4. **性能监控**：每个方法都要记录执行时间

传统方式是在每个方法中手动添加这些逻辑：

```java
@Service
public class UserService {
    
    public void createUser(String username) {
        // 1. 记录日志
        log.info("方法开始: createUser");
        long start = System.currentTimeMillis();
        
        // 2. 权限检查
        if (!hasPermission()) {
            throw new UnauthorizedException();
        }
        
        // 3. 开启事务
        Transaction tx = beginTransaction();
        try {
            // 业务逻辑
            userRepository.save(username);
            tx.commit();
        } catch (Exception e) {
            tx.rollback();
            throw e;
        }
        
        // 4. 记录执行时间
        long elapsed = System.currentTimeMillis() - start;
        log.info("方法结束: createUser, 耗时: " + elapsed + "ms");
    }
    
    public void updateUser(String username) {
        // 同样的代码又要写一遍...
        log.info("方法开始: updateUser");
        // ... 重复的代码
    }
}
```

**问题**：
- 代码重复，难以维护
- 业务逻辑和非业务逻辑混在一起
- 修改日志格式需要改所有方法

### 解决方案

AOP（面向切面编程）将这些跨切面功能集中管理：

```java
// 业务代码只关心业务逻辑
@Service
public class UserService {
    
    public void createUser(String username) {
        // 只有业务逻辑，干净简洁
        userRepository.save(username);
    }
}

// 日志、权限、事务等由 AOP 切面处理
@Aspect
@Component
public class LogAspect {
    
    @Around("execution(* com.example.service.*.*(..))")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        log.info("方法开始: " + pjp.getSignature().getName());
        
        Object result = pjp.proceed(); // 执行目标方法
        
        long elapsed = System.currentTimeMillis() - start;
        log.info("方法结束, 耗时: " + elapsed + "ms");
        return result;
    }
}
```

> **一句话总结**：AOP 让你专注于业务逻辑，把日志、事务等通用功能交给框架处理。

---

## 5.2 核心原理

### 5.2.1 AOP 核心概念

| 术语 | 说明 | 例子 |
| --- | --- | --- |
| 切面（Aspect） | 跨切面功能的模块化封装 | 日志切面、事务切面 |
| 连接点（JoinPoint） | 程序执行过程中的某个点 | 方法调用、异常抛出 |
| 通知（Advice） | 切面在特定连接点执行的动作 | 前置通知、后置通知 |
| 切入点（Pointcut） | 匹配连接点的表达式 | 匹配所有 Service 方法 |
| 目标对象（Target） | 被通知的对象 | UserService |
| 代理（Proxy） | 创建的通知对象 | JDK 动态代理或 CGLIB |

打个比方：

> AOP 就像公司的行政部门：
> - 切面 = 行政部门（负责所有员工的考勤、福利等）
> - 通知 = 具体的行政行为（发工资、组织活动）
> - 切入点 = 适用规则（所有正式员工）
> - 目标对象 = 具体员工
> - 代理 = 行政助理（帮员工处理行政事务）

### 5.2.2 通知类型

| 通知类型 | 注解 | 执行时机 | 使用场景 |
| --- | --- | --- | --- |
| 前置通知 | @Before | 方法执行前 | 权限检查、参数验证 |
| 后置通知 | @After | 方法执行后（无论成功失败） | 资源清理 |
| 返回通知 | @AfterReturning | 方法成功返回后 | 日志记录、结果处理 |
| 异常通知 | @AfterThrowing | 方法抛出异常后 | 异常处理、错误日志 |
| 环绕通知 | @Around | 环绕方法执行 | 最灵活，可控制是否执行 |

### 5.2.3 动态代理原理

Spring AOP 基于动态代理实现：

1. **JDK 动态代理**：目标对象实现了接口
2. **CGLIB 代理**：目标对象没有实现接口

```java
// JDK 动态代理示例
public class JdkProxyExample {
    public static void main(String[] args) {
        // 目标对象
        UserService target = new UserServiceImpl();
        
        // 创建代理
        UserService proxy = (UserService) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            (proxyObj, method, args) -> {
                System.out.println("前置通知");
                Object result = method.invoke(target, args);
                System.out.println("后置通知");
                return result;
            }
        );
        
        // 调用代理方法
        proxy.createUser("张三");
    }
}
```

> **原理**：Spring 在运行时为目标对象创建代理对象，在代理对象中织入切面逻辑。

---

## 5.3 基础用法

### 5.3.1 启用 AOP

```java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAspectJAutoProxy // 启用 AspectJ 自动代理
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### 5.3.2 创建切面

```java
package com.example.aspect;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;
import java.util.Arrays;

// 标记为切面
@Aspect
@Component
public class LogAspect {
    
    // 定义切入点：匹配所有 Service 类的方法
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}
    
    // 前置通知
    @Before("serviceLayer()")
    public void logBefore(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        System.out.println("[前置通知] 方法: " + methodName + ", 参数: " + Arrays.toString(args));
    }
    
    // 后置通知
    @After("serviceLayer()")
    public void logAfter(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        System.out.println("[后置通知] 方法: " + methodName + " 执行完成");
    }
    
    // 返回通知
    @AfterReturning(pointcut = "serviceLayer()", returning = "result")
    public void logAfterReturning(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        System.out.println("[返回通知] 方法: " + methodName + ", 返回值: " + result);
    }
    
    // 异常通知
    @AfterThrowing(pointcut = "serviceLayer()", throwing = "ex")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable ex) {
        String methodName = joinPoint.getSignature().getName();
        System.out.println("[异常通知] 方法: " + methodName + ", 异常: " + ex.getMessage());
    }
    
    // 环绕通知
    @Around("serviceLayer()")
    public Object logAround(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        String methodName = pjp.getSignature().getName();
        
        System.out.println("[环绕通知] 方法 " + methodName + " 开始执行");
        
        // 执行目标方法
        Object result = pjp.proceed();
        
        long elapsed = System.currentTimeMillis() - start;
        System.out.println("[环绕通知] 方法 " + methodName + " 执行时间: " + elapsed + "ms");
        
        return result;
    }
}
```

### 5.3.3 切入点表达式

```java
@Aspect
@Component
public class PointcutExamples {
    
    // 匹配所有 public 方法
    @Pointcut("execution(public * *(..))")
    public void publicMethods() {}
    
    // 匹配所有 Service 类的方法
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceMethods() {}
    
    // 匹配所有以 find 开头的方法
    @Pointcut("execution(* find*(..))")
    public void findMethods() {}
    
    // 匹配所有带 @Log 注解的方法
    @Pointcut("@annotation(com.example.annotation.Log)")
    public void logAnnotation() {}
    
    // 匹配所有带 @Service 注解的类的方法
    @Pointcut("@within(org.springframework.stereotype.Service)")
    public void serviceClass() {}
    
    // 组合切入点
    @Pointcut("serviceMethods() && !findMethods()")
    public void serviceButNotFind() {}
}
```

**切入点表达式语法**：

| 语法 | 说明 | 例子 |
| --- | --- | --- |
| execution | 匹配方法执行 | execution(* com.example.service.*.*(..)) |
| @annotation | 匹配注解 | @annotation(com.example.Log) |
| @within | 匹配类注解 | @within(org.springframework.stereotype.Service) |
| @args | 匹配参数注解 | @args(com.example.MyAnnotation) |
| within | 匹配类范围 | within(com.example.service.*) |
| args | 匹配参数类型 | args(String, int) |

### 5.3.4 自定义注解

```java
package com.example.annotation;

import java.lang.annotation.*;

// 自定义日志注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Log {
    String value() default ""; // 日志描述
}

// 使用注解
@Service
public class UserService {
    
    @Log("创建用户")
    public void createUser(String username) {
        System.out.println("创建用户: " + username);
    }
}

// 切面处理注解
@Aspect
@Component
public class LogAnnotationAspect {
    
    @Around("@annotation(log)")
    public Object around(ProceedingJoinPoint pjp, Log log) throws Throwable {
        long start = System.currentTimeMillis();
        
        System.out.println("[日志] " + log.value() + " 开始");
        
        Object result = pjp.proceed();
        
        long elapsed = System.currentTimeMillis() - start;
        System.out.println("[日志] " + log.value() + " 完成, 耗时: " + elapsed + "ms");
        
        return result;
    }
}
```

---

## 5.4 进阶用法

### 5.4.1 获取方法参数

```java
@Aspect
@Component
public class ParameterAspect {
    
    // 使用 @Before 获取参数
    @Before("execution(* com.example.service.*.*(..)) && args(username, age)")
    public void logParams(String username, int age) {
        System.out.println("参数: username=" + username + ", age=" + age);
    }
    
    // 使用 JoinPoint 获取参数
    @Before("execution(* com.example.service.*.*(..))")
    public void logParams2(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        System.out.println("参数: " + Arrays.toString(args));
    }
}
```

### 5.4.2 切面顺序

```java
@Aspect
@Component
@Order(1) // 数字越小优先级越高
public class FirstAspect {
    @Before("execution(* com.example.service.*.*(..))")
    public void before() {
        System.out.println("第一个切面");
    }
}

@Aspect
@Component
@Order(2)
public class SecondAspect {
    @Before("execution(* com.example.service.*.*(..))")
    public void before() {
        System.out.println("第二个切面");
    }
}
```

### 5.4.3 引入接口

```java
@Aspect
@Component
public class IntroductionAspect {
    
    // 为所有 Service 类引入 Auditable 接口
    @DeclareParents(value = "com.example.service.*", defaultImpl = AuditableImpl.class)
    public Auditable auditable;
}

// 接口
public interface Auditable {
    void audit();
}

// 默认实现
public class AuditableImpl implements Auditable {
    @Override
    public void audit() {
        System.out.println("审计方法被调用");
    }
}

// 使用
@Service
public class UserService {
    // 自动实现了 Auditable 接口
}

// 调用
UserService userService = context.getBean(UserService.class);
((Auditable) userService).audit(); // 可以调用
```

---

## 5.5 实战案例

### 5.5.1 日志切面

```java
@Aspect
@Component
public class LoggingAspect {
    
    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    
    @Around("@annotation(log)")
    public Object logMethod(ProceedingJoinPoint pjp, Log log) throws Throwable {
        String methodName = pjp.getSignature().getName();
        String description = log.value();
        
        logger.info("[{}] 方法: {} 开始执行", description, methodName);
        long start = System.currentTimeMillis();
        
        try {
            Object result = pjp.proceed();
            long elapsed = System.currentTimeMillis() - start;
            logger.info("[{}] 方法: {} 执行完成, 耗时: {}ms", description, methodName, elapsed);
            return result;
        } catch (Throwable e) {
            long elapsed = System.currentTimeMillis() - start;
            logger.error("[{}] 方法: {} 执行异常, 耗时: {}ms, 错误: {}", 
                description, methodName, elapsed, e.getMessage());
            throw e;
        }
    }
}
```

### 5.5.2 权限切面

```java
@Aspect
@Component
public class PermissionAspect {
    
    @Before("@annotation(permission)")
    public void checkPermission(Permission permission) {
        String role = permission.value();
        
        // 获取当前用户
        User currentUser = getCurrentUser();
        
        // 检查权限
        if (!currentUser.hasRole(role)) {
            throw new UnauthorizedException("没有权限: " + role);
        }
    }
}

// 注解定义
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Permission {
    String value(); // 所需角色
}

// 使用
@RestController
public class UserController {
    
    @Permission("admin")
    @DeleteMapping("/users/{id}")
    public String deleteUser(@PathVariable Long id) {
        // 只有 admin 角色可以删除
        userService.delete(id);
        return "删除成功";
    }
}
```

### 5.5.3 缓存切面

```java
@Aspect
@Component
public class CacheAspect {
    
    private final Map<String, Object> cache = new ConcurrentHashMap<>();
    
    @Around("@annotation(cacheable)")
    public Object cacheResult(ProceedingJoinPoint pjp, Cacheable cacheable) throws Throwable {
        String key = buildKey(pjp, cacheable.key());
        
        // 检查缓存
        if (cache.containsKey(key)) {
            System.out.println("从缓存获取: " + key);
            return cache.get(key);
        }
        
        // 执行方法
        Object result = pjp.proceed();
        
        // 存入缓存
        cache.put(key, result);
        System.out.println("存入缓存: " + key);
        
        return result;
    }
    
    private String buildKey(ProceedingJoinPoint pjp, String keyExpression) {
        // 简单实现：方法名 + 参数
        return pjp.getSignature().getName() + ":" + Arrays.toString(pjp.getArgs());
    }
}

// 注解定义
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Cacheable {
    String key() default "";
}

// 使用
@Service
public class UserService {
    
    @Cacheable(key = "user")
    public User getUser(Long id) {
        // 模拟数据库查询
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return new User(id, "张三");
    }
}
```

---

## 5.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @Aspect | 标记类为切面 |
| @Pointcut | 定义切入点 |
| @Before | 前置通知 |
| @After | 后置通知 |
| @AfterReturning | 返回通知 |
| @AfterThrowing | 异常通知 |
| @Around | 环绕通知 |
| execution | 匹配方法执行 |
| @annotation | 匹配注解 |
| @Order | 切面优先级 |

---

## 5.7 新手常见误区

### 误区 1："AOP 会严重影响性能"

**影响很小！** Spring AOP 使用动态代理实现，虽然有一定开销，但在大多数业务场景中可以忽略不计。AOP 带来的代码清晰度和可维护性提升，远大于这点性能损失。

**注意**：在高频调用的方法（如循环内）中，可以考虑使用 AspectJ 编译时织入。

### 误区 2："切面可以拦截所有方法"

**错！** Spring AOP 只能拦截 Spring 管理的 Bean 的方法调用。以下情况无法拦截：
- 非 Spring 管理的对象
- 内部方法调用（同一个类中的方法互相调用）
- final 方法
- 静态方法

**正确理解**：Spring AOP 基于代理，只能拦截通过代理调用的方法。

### 误区 3："@Before 和 @Around 功能一样"

**不一样！** 虽然都可以实现前置逻辑，但：
- @Before 只能做前置处理
- @Around 可以控制是否执行目标方法、修改返回值、处理异常

**选择建议**：需要完全控制用 @Around，只需前置处理用 @Before。

### 误区 4："切入点表达式越复杂越好"

**不是！** 切入点表达式应该清晰明确，避免过于复杂。复杂的表达式难以维护，容易出错。

**正确做法**：
- 使用 @annotation 匹配自定义注解
- 使用 @within 匹配类级别注解
- 避免使用过于宽泛的表达式

### 误区 5："AOP 只能用于日志"

**错！** AOP 可以用于任何跨切面关注点：
- 日志记录
- 事务管理
- 权限检查
- 性能监控
- 缓存处理
- 异常处理
- 数据脱敏

---

## 5.8 动手练习

### 练习 1：基础练习 - 日志切面

创建一个日志切面，实现以下功能：
1. 记录所有 Controller 方法的执行时间
2. 记录方法名和参数
3. 记录方法返回值

<details>
<summary>点击查看答案</summary>

```java
// ControllerLog.java
package com.example.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ControllerLog {
}

// ControllerLogAspect.java
package com.example.aspect;

import com.example.annotation.ControllerLog;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import java.util.Arrays;

@Aspect
@Component
public class ControllerLogAspect {
    
    @Around("@annotation(controllerLog)")
    public Object log(ProceedingJoinPoint pjp, ControllerLog controllerLog) throws Throwable {
        String methodName = pjp.getSignature().getName();
        Object[] args = pjp.getArgs();
        
        System.out.println("========== 请求开始 ==========");
        System.out.println("方法: " + methodName);
        System.out.println("参数: " + Arrays.toString(args));
        
        long start = System.currentTimeMillis();
        
        Object result = pjp.proceed();
        
        long elapsed = System.currentTimeMillis() - start;
        System.out.println("返回值: " + result);
        System.out.println("耗时: " + elapsed + "ms");
        System.out.println("========== 请求结束 ==========");
        
        return result;
    }
}

// UserController.java
package com.example.controller;

import com.example.annotation.ControllerLog;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {
    
    @ControllerLog
    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id) {
        return "用户: " + id;
    }
    
    @ControllerLog
    @PostMapping
    public String createUser(@RequestBody String username) {
        return "创建成功: " + username;
    }
}
```

</details>

### 练习 2：进阶练习 - 权限切面

创建一个权限切面，实现以下功能：
1. 定义 @RequirePermission 注解
2. 在方法执行前检查权限
3. 没有权限时抛出异常

<details>
<summary>点击查看答案</summary>

```java
// RequirePermission.java
package com.example.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String value(); // 所需权限
}

// PermissionException.java
package com.example.exception;

public class PermissionException extends RuntimeException {
    public PermissionException(String message) {
        super(message);
    }
}

// PermissionAspect.java
package com.example.aspect;

import com.example.annotation.RequirePermission;
import com.example.exception.PermissionException;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class PermissionAspect {
    
    @Before("@annotation(permission)")
    public void checkPermission(JoinPoint joinPoint, RequirePermission permission) {
        String requiredPermission = permission.value();
        
        // 模拟获取当前用户权限
        String currentUserPermission = getCurrentUserPermission();
        
        if (!hasPermission(currentUserPermission, requiredPermission)) {
            throw new PermissionException("没有权限: " + requiredPermission);
        }
    }
    
    private String getCurrentUserPermission() {
        // 实际项目中从 SecurityContext 获取
        return "user"; // 模拟当前用户只有 user 权限
    }
    
    private boolean hasPermission(String current, String required) {
        // 简单权限检查逻辑
        if ("admin".equals(current)) {
            return true; // admin 有所有权限
        }
        return current.equals(required);
    }
}

// UserController.java
package com.example.controller;

import com.example.annotation.RequirePermission;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {
    
    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id) {
        return "用户: " + id;
    }
    
    @RequirePermission("admin")
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        return "删除成功: " + id;
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 缓存切面

创建一个缓存切面，实现以下功能：
1. 定义 @Cacheable 注解，支持指定缓存 key
2. 方法执行前检查缓存
3. 缓存命中直接返回，未命中则执行方法并缓存结果
4. 定义 @CacheEvict 注解，支持清除缓存

<details>
<summary>点击查看答案</summary>

```java
// Cacheable.java
package com.example.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Cacheable {
    String key() default "";
    long ttl() default 3600; // 过期时间，秒
}

// CacheEvict.java
package com.example.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CacheEvict {
    String key() default "";
    boolean allEntries() default false; // 是否清除所有
}

// CacheAspect.java
package com.example.aspect;

import com.example.annotation.Cacheable;
import com.example.annotation.CacheEvict;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Aspect
@Component
public class CacheAspect {
    
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    
    @Around("@annotation(cacheable)")
    public Object cacheable(ProceedingJoinPoint pjp, Cacheable cacheable) throws Throwable {
        String key = buildKey(pjp, cacheable.key());
        
        // 检查缓存
        CacheEntry entry = cache.get(key);
        if (entry != null && !entry.isExpired()) {
            System.out.println("缓存命中: " + key);
            return entry.getValue();
        }
        
        // 执行方法
        System.out.println("缓存未命中，执行方法: " + key);
        Object result = pjp.proceed();
        
        // 存入缓存
        cache.put(key, new CacheEntry(result, cacheable.ttl()));
        System.out.println("缓存已更新: " + key);
        
        return result;
    }
    
    @Around("@annotation(cacheEvict)")
    public Object cacheEvict(ProceedingJoinPoint pjp, CacheEvict cacheEvict) throws Throwable {
        Object result = pjp.proceed();
        
        if (cacheEvict.allEntries()) {
            cache.clear();
            System.out.println("清除所有缓存");
        } else {
            String key = buildKey(pjp, cacheEvict.key());
            cache.remove(key);
            System.out.println("清除缓存: " + key);
        }
        
        return result;
    }
    
    private String buildKey(ProceedingJoinPoint pjp, String keyExpression) {
        if (!keyExpression.isEmpty()) {
            return keyExpression;
        }
        return pjp.getSignature().toShortString() + ":" + 
               java.util.Arrays.toString(pjp.getArgs());
    }
    
    // 缓存条目
    private static class CacheEntry {
        private final Object value;
        private final long expireTime;
        
        public CacheEntry(Object value, long ttl) {
            this.value = value;
            this.expireTime = System.currentTimeMillis() + ttl * 1000;
        }
        
        public Object getValue() { return value; }
        public boolean isExpired() {
            return System.currentTimeMillis() > expireTime;
        }
    }
}

// UserService.java
package com.example.service;

import com.example.annotation.Cacheable;
import com.example.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    
    @Cacheable(key = "user")
    public String getUser(Long id) {
        System.out.println("查询用户: " + id);
        try {
            Thread.sleep(1000); // 模拟慢查询
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "用户: " + id;
    }
    
    @CacheEvict(key = "user")
    public void updateUser(Long id, String name) {
        System.out.println("更新用户: " + id);
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring MVC 基础**——也就是如何使用 Spring 构建 Web 应用。你会学到：

- DispatcherServlet 的工作原理
- 控制器的编写方式
- 请求映射和参数绑定
- 视图解析和响应处理

准备好了吗？让我们继续深入 Spring 的世界！
