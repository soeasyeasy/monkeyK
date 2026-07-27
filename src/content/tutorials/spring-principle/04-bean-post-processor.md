---
title: "第4章：BeanPostProcessor 原理"
description: "深入理解 BeanPostProcessor 的执行时机、初始化前后处理、Aware 接口和内置后处理器"
---

# 第4章：BeanPostProcessor 原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- BeanPostProcessor 是什么？它在 Bean 生命周期中起什么作用？
- BeanPostProcessor 的执行时机是什么？在初始化前还是初始化后？
- Aware 接口（如 BeanNameAware、ApplicationContextAware）是如何工作的？
- Spring 内置了哪些 BeanPostProcessor？它们分别做什么？

这一章就是为了解答这些问题。我们会深入理解 BeanPostProcessor 的工作原理，掌握它在 Bean 生命周期中的关键作用，学会使用它来扩展 Spring 的功能。

---

## 1 为什么需要 BeanPostProcessor？

### 痛点分析

在 Spring 开发中，我们经常需要在 Bean 初始化前后做一些额外处理，比如：

1. **属性检查**：检查 Bean 的属性是否设置正确
2. **代理创建**：为 Bean 创建代理对象（AOP 就是靠这个实现的）
3. **注解处理**：处理 Bean 上的特定注解
4. **依赖注入**：完成 @Autowired 等注解的注入

如果没有 BeanPostProcessor，你需要：

```java
// 没有 BeanPostProcessor 时的做法
public class UserService {
    
    // 手动在初始化方法中做各种处理
    @PostConstruct
    public void init() {
        // 1. 检查属性
        if (this.userRepository == null) {
            throw new IllegalStateException("userRepository 不能为空");
        }
        
        // 2. 创建代理（如果要实现 AOP）
        // 这需要在每个类中手动写...
        
        // 3. 处理注解
        // 又要手动写反射代码...
    }
}
```

**问题**：
- 每个 Bean 都要重复写相同的处理逻辑
- 业务代码和框架代码混在一起
- 难以统一管理和扩展

### 解决方案

BeanPostProcessor 就像 Bean 的"质检员"，在 Bean 初始化前后统一处理：

```java
// 使用 BeanPostProcessor 后的做法
@Component
public class CheckBeanPostProcessor implements BeanPostProcessor {
    
    // 初始化前检查
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        // 统一检查所有 Bean 的属性
        if (bean instanceof UserService) {
            UserService service = (UserService) bean;
            if (service.getUserRepository() == null) {
                throw new IllegalStateException("userRepository 不能为空");
            }
        }
        return bean;
    }
    
    // 初始化后处理
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        // 统一为 Bean 创建代理
        return createProxy(bean);
    }
}
```

> **一句话总结**：BeanPostProcessor 是 Spring 提供的扩展点，让你在 Bean 初始化前后插入自定义逻辑，实现统一处理。

---

## 2 核心原理

### 4.2.1 BeanPostProcessor 执行时机

BeanPostProcessor 在 Bean 生命周期中的位置：

```
1. Bean 实例化（调用构造函数）
2. 属性填充（依赖注入）
3. Aware 接口回调（如 BeanNameAware、BeanFactoryAware）
4. 【BeanPostProcessor.postProcessBeforeInitialization】← 初始化前
5. 执行 @PostConstruct 和 InitializingBean.afterPropertiesSet()
6. 执行自定义 init-method
7. 【BeanPostProcessor.postProcessAfterInitialization】← 初始化后
8. Bean 可以使用了
9. 【销毁时调用 DisposableBean.destroy() 或 @PreDestroy】
```

打个比方：

> BeanPostProcessor 就像工厂的质检环节：
> - 初始化前检查：产品组装完成后，先检查零件是否齐全
> - 初始化后处理：检查通过后，再贴上标签、包装出厂

### 4.2.2 源码解析

Spring 容器中 BeanPostProcessor 的执行流程：

```java
// AbstractAutowireCapableBeanFactory 中的核心方法
protected Object initializeBean(String beanName, Object bean, RootBeanDefinition mbd) {
    // 1. 执行 Aware 接口回调
    invokeAwareMethods(beanName, bean);
    
    // 2. 执行 BeanPostProcessor 的初始化前处理
    Object wrappedBean = bean;
    if (mbd == null || !mbd.isSynthetic()) {
        wrappedBean = applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName);
    }
    
    // 3. 执行初始化方法（@PostConstruct、InitializingBean、init-method）
    try {
        invokeInitMethods(beanName, wrappedBean, mbd);
    } catch (Throwable ex) {
        throw new BeanCreationException("Invocation of init method failed", ex);
    }
    
    // 4. 执行 BeanPostProcessor 的初始化后处理
    if (mbd == null || !mbd.isSynthetic()) {
        wrappedBean = applyBeanPostProcessorsAfterInitialization(wrappedBean, beanName);
    }
    
    return wrappedBean;
}

// 初始化前处理
public Object applyBeanPostProcessorsBeforeInitialization(Object existingBean, String beanName) {
    Object result = existingBean;
    // 遍历所有 BeanPostProcessor
    for (BeanPostProcessor processor : getBeanPostProcessors()) {
        Object current = processor.postProcessBeforeInitialization(result, beanName);
        if (current == null) {
            return result;  // 如果返回 null，直接返回原对象
        }
        result = current;  // 否则使用返回的对象（可能是代理）
    }
    return result;
}

// 初始化后处理
public Object applyBeanPostProcessorsAfterInitialization(Object existingBean, String beanName) {
    Object result = existingBean;
    // 遍历所有 BeanPostProcessor
    for (BeanPostProcessor processor : getBeanPostProcessors()) {
        Object current = processor.postProcessAfterInitialization(result, beanName);
        if (current == null) {
            return result;
        }
        result = current;
    }
    return result;
}
```

> **关键点**：
> - BeanPostProcessor 可以返回原对象，也可以返回代理对象
> - AOP 就是通过 `postProcessAfterInitialization` 返回代理对象实现的
> - 多个 BeanPostProcessor 按注册顺序执行

### 4.2.3 BeanPostProcessor 注册时机

BeanPostProcessor 本身也是 Bean，但它的注册有特殊之处：

```java
// AbstractApplicationContext 中的注册逻辑
public void refresh() {
    // ...
    
    // 1. 先注册 BeanFactoryPostProcessor
    invokeBeanFactoryPostProcessors(beanFactory);
    
    // 2. 注册 BeanPostProcessor（优先于其他 Bean）
    registerBeanPostProcessors(beanFactory);
    
    // 3. 初始化其他非懒加载的 Bean
    finishBeanFactoryInitialization(beanFactory);
    
    // ...
}
```

> **原理**：BeanPostProcessor 必须在普通 Bean 之前注册，这样才能在普通 Bean 初始化时生效。

---

## 3 Aware 接口回调机制

### 4.3.1 什么是 Aware 接口？

Aware 接口是 Spring 提供的一组标记接口，让 Bean 可以感知到容器的某些能力。

常见的 Aware 接口：

| Aware 接口 | 作用 | 回调方法 |
|-----------|------|----------|
| BeanNameAware | 获取 Bean 名称 | setBeanName(String) |
| BeanFactoryAware | 获取 BeanFactory | setBeanFactory(BeanFactory) |
| ApplicationContextAware | 获取 ApplicationContext | setApplicationContext(ApplicationContext) |
| EnvironmentAware | 获取 Environment | setEnvironment(Environment) |
| ResourceLoaderAware | 获取 ResourceLoader | setResourceLoader(ResourceLoader) |

### 4.3.2 Aware 接口执行时机

Aware 接口在 BeanPostProcessor 之前执行：

```java
// AbstractAutowireCapableBeanFactory 中的 Aware 回调
private void invokeAwareMethods(String beanName, Object bean) {
    if (bean instanceof Aware) {
        if (bean instanceof BeanNameAware) {
            // 设置 Bean 名称
            ((BeanNameAware) bean).setBeanName(beanName);
        }
        if (bean instanceof BeanClassLoaderAware) {
            // 设置 ClassLoader
            ((BeanClassLoaderAware) bean).setBeanClassLoader(getClassLoader());
        }
        if (bean instanceof BeanFactoryAware) {
            // 设置 BeanFactory
            ((BeanFactoryAware) bean).setBeanFactory(this);
        }
    }
}
```

### 4.3.3 使用示例

```java
@Component
public class MyService implements BeanNameAware, ApplicationContextAware {
    
    private String beanName;
    private ApplicationContext applicationContext;
    
    // BeanNameAware 回调
    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        System.out.println("Bean 名称: " + name);
    }
    
    // ApplicationContextAware 回调
    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        this.applicationContext = ctx;
        System.out.println("获取到 ApplicationContext");
    }
    
    @PostConstruct
    public void init() {
        // 此时 beanName 和 applicationContext 已经设置好了
        System.out.println("初始化完成，Bean 名称: " + beanName);
    }
}
```

> **注意**：Aware 接口虽然方便，但会让 Bean 与 Spring 耦合。如果不是必须，建议使用依赖注入代替。

---

## 4 Spring 内置 BeanPostProcessor

Spring 内置了很多 BeanPostProcessor，实现各种核心功能：

### 4.4.1 常用内置后处理器

| BeanPostProcessor | 作用 |
|-------------------|------|
| AutowiredAnnotationBeanPostProcessor | 处理 @Autowired、@Value 注解 |
| CommonAnnotationBeanPostProcessor | 处理 @PostConstruct、@PreDestroy、@Resource |
| AnnotationAwareAspectJAutoProxyCreator | AOP 代理创建 |
| AsyncAnnotationBeanPostProcessor | 处理 @Async 注解 |
| ScheduledAnnotationBeanPostProcessor | 处理 @Scheduled 注解 |
| PersistenceAnnotationBeanPostProcessor | 处理 JPA 相关注解 |

### 4.4.2 AutowiredAnnotationBeanPostProcessor

这个后处理器负责处理 @Autowired 和 @Value 注解：

```java
// 简化版源码
public class AutowiredAnnotationBeanPostProcessor implements BeanPostProcessor {
    
    // 初始化前：注入依赖
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        // 扫描 Bean 中的 @Autowired 字段和方法
        InjectionMetadata metadata = findAutowiringMetadata(beanName, bean.getClass(), null);
        // 执行注入
        metadata.inject(bean, beanName, null);
        return bean;
    }
    
    // 查找需要注入的元数据
    private InjectionMetadata findAutowiringMetadata(String beanName, Class<?> clazz, PropertyValues pvs) {
        // 扫描字段上的 @Autowired
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Autowired.class)) {
                // 记录需要注入的字段
            }
        }
        // 扫描方法上的 @Autowired
        for (Method method : clazz.getDeclaredMethods()) {
            if (method.isAnnotationPresent(Autowired.class)) {
                // 记录需要注入的方法
            }
        }
        return metadata;
    }
}
```

### 4.4.3 CommonAnnotationBeanPostProcessor

处理 JSR-250 注解：

```java
// 简化版源码
public class CommonAnnotationBeanPostProcessor implements BeanPostProcessor {
    
    // 初始化前：处理 @PostConstruct
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        // 查找 @PostConstruct 标注的方法
        InitDestroyAnnotationBeanPostProcessor processor = ...;
        processor.invokeInitMethods(bean);
        return bean;
    }
    
    // 初始化后：处理 @Resource
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        // 处理 @Resource 注入
        return bean;
    }
}
```

### 4.4.4 AnnotationAwareAspectJAutoProxyCreator

AOP 的核心，负责创建代理对象：

```java
// 简化版源码
public class AnnotationAwareAspectJAutoProxyCreator extends AbstractAutoProxyCreator {
    
    // 初始化后：创建代理
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        // 判断是否需要代理
        if (isEligibleForProxy(bean, beanName)) {
            // 创建代理对象
            return createProxy(bean, beanName, getSpecificInterceptors(bean));
        }
        return bean;
    }
    
    // 判断是否需要代理
    private boolean isEligibleForProxy(Object bean, String beanName) {
        // 检查是否有 @Aspect 切面匹配
        // 检查是否满足代理条件
        return hasAspect(bean) && isProxyNeeded(beanName);
    }
}
```

---

## 5 自定义 BeanPostProcessor

### 4.5.1 基础用法

```java
// 自定义 BeanPostProcessor
@Component
public class MyBeanPostProcessor implements BeanPostProcessor {
    
    // 初始化前处理
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        System.out.println("初始化前: " + beanName);
        
        // 可以在这里修改 Bean 的属性
        if (bean instanceof UserService) {
            UserService service = (UserService) bean;
            service.setInitTime(System.currentTimeMillis());
        }
        
        return bean;  // 返回原对象或修改后的对象
    }
    
    // 初始化后处理
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        System.out.println("初始化后: " + beanName);
        
        // 可以在这里创建代理
        if (bean instanceof UserService) {
            return Proxy.newProxyInstance(
                bean.getClass().getClassLoader(),
                bean.getClass().getInterfaces(),
                (proxy, method, args) -> {
                    System.out.println("方法调用前");
                    Object result = method.invoke(bean, args);
                    System.out.println("方法调用后");
                    return result;
                }
            );
        }
        
        return bean;
    }
}
```

### 4.5.2 使用 @Order 控制顺序

```java
// 多个 BeanPostProcessor 时，使用 @Order 控制执行顺序
@Component
@Order(1)  // 数字越小，优先级越高
public class FirstBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        System.out.println("First - 初始化前");
        return bean;
    }
}

@Component
@Order(2)
public class SecondBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        System.out.println("Second - 初始化前");
        return bean;
    }
}

// 执行顺序：First -> Second
```

### 4.5.3 实现属性检查

```java
// 检查 Bean 的属性是否满足要求
@Component
public class RequiredPropertyCheckPostProcessor implements BeanPostProcessor {
    
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        // 扫描 @RequiredProperty 注解
        Class<?> clazz = bean.getClass();
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(RequiredProperty.class)) {
                field.setAccessible(true);
                try {
                    Object value = field.get(bean);
                    if (value == null) {
                        throw new IllegalStateException(
                            "Bean " + beanName + " 的属性 " + field.getName() + " 不能为空"
                        );
                    }
                } catch (IllegalAccessException e) {
                    throw new BeansException("无法访问属性", e) {};
                }
            }
        }
        return bean;
    }
}

// 自定义注解
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiredProperty {
}

// 使用
@Service
public class UserService {
    
    @RequiredProperty
    private UserRepository userRepository;
    
    // ...
}
```

---

## 6 对比表格

### BeanPostProcessor vs BeanFactoryPostProcessor

| 特性 | BeanPostProcessor | BeanFactoryPostProcessor |
|------|-------------------|--------------------------|
| 作用对象 | Bean 实例 | BeanDefinition |
| 执行时机 | Bean 初始化前后 | Bean 实例化之前 |
| 主要用途 | 修改 Bean 属性、创建代理 | 修改 BeanDefinition |
| 典型实现 | AutowiredAnnotationBeanPostProcessor | PropertySourcesPlaceholderConfigurer |
| 返回值 | 可以返回代理对象 | 无返回值（void） |

### 常见 BeanPostProcessor 对比

| BeanPostProcessor | 执行时机 | 主要功能 |
|-------------------|----------|----------|
| AutowiredAnnotationBeanPostProcessor | 初始化前 | 处理 @Autowired、@Value |
| CommonAnnotationBeanPostProcessor | 初始化前/后 | 处理 @PostConstruct、@Resource |
| AnnotationAwareAspectJAutoProxyCreator | 初始化后 | 创建 AOP 代理 |
| AsyncAnnotationBeanPostProcessor | 初始化后 | 处理 @Async |

---

## 7 新手常见误区

### 误区 1："BeanPostProcessor 可以修改 BeanDefinition"

**错！** BeanPostProcessor 操作的是 Bean 实例，不是 BeanDefinition。如果要修改 BeanDefinition，需要使用 BeanFactoryPostProcessor。

**正确理解**：
- BeanFactoryPostProcessor：修改 Bean 的定义信息（如 scope、lazy-init 等）
- BeanPostProcessor：修改 Bean 的实例（如属性值、创建代理）

### 误区 2："BeanPostProcessor 的执行顺序不重要"

**错！** 多个 BeanPostProcessor 的执行顺序会影响结果。比如 AOP 代理创建必须在依赖注入之后。

**正确做法**：使用 @Order 注解或 Ordered 接口控制顺序。

### 误区 3："BeanPostProcessor 可以注入到其他 Bean 中"

**不推荐！** BeanPostProcessor 本身是基础设施，不应该被业务代码依赖。

**正确做法**：通过 ApplicationContext 获取 Bean，而不是直接依赖 BeanPostProcessor。

### 误区 4："Aware 接口和依赖注入效果一样"

**不完全一样！** Aware 接口让 Bean 与 Spring 耦合，而依赖注入可以通过接口解耦。

**建议**：
- 优先使用依赖注入
- 只有在必须获取容器能力时才使用 Aware

### 误区 5："BeanPostProcessor 对所有 Bean 都生效"

**错！** BeanPostProcessor 可以选择性地对某些 Bean 生效。

**正确做法**：在方法中判断 Bean 类型：

```java
@Override
public Object postProcessAfterInitialization(Object bean, String beanName) {
    // 只对 Service 类生效
    if (bean.getClass().isAnnotationPresent(Service.class)) {
        // 处理逻辑
    }
    return bean;
}
```

---

## 8 动手练习

### 练习 1：基础练习 - 实现简单的 BeanPostProcessor

创建一个 BeanPostProcessor，实现以下功能：
1. 在初始化前打印 Bean 名称
2. 在初始化后为所有 Service 类添加日志功能

<details>
<summary>点击查看答案</summary>

```java
// LoggingBeanPostProcessor.java
package com.example;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;
import java.lang.reflect.Proxy;

@Component
public class LoggingBeanPostProcessor implements BeanPostProcessor {
    
    // 初始化前：打印 Bean 名称
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        System.out.println("[初始化前] Bean: " + beanName);
        return bean;
    }
    
    // 初始化后：为 Service 类添加日志
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        // 判断是否是 Service 类
        if (bean.getClass().isAnnotationPresent(org.springframework.stereotype.Service.class)) {
            System.out.println("[初始化后] 为 " + beanName + " 添加日志功能");
            
            // 创建代理
            return Proxy.newProxyInstance(
                bean.getClass().getClassLoader(),
                bean.getClass().getInterfaces(),
                (proxy, method, args) -> {
                    System.out.println("[日志] 调用方法: " + method.getName());
                    long start = System.currentTimeMillis();
                    
                    // 执行原方法
                    Object result = method.invoke(bean, args);
                    
                    long elapsed = System.currentTimeMillis() - start;
                    System.out.println("[日志] 方法执行时间: " + elapsed + "ms");
                    
                    return result;
                }
            );
        }
        
        return bean;
    }
}

// UserService.java
package com.example;

import org.springframework.stereotype.Service;

@Service
public class UserService implements IUserService {
    
    @Override
    public void createUser(String username) {
        System.out.println("创建用户: " + username);
    }
}

// IUserService.java
package com.example;

public interface IUserService {
    void createUser(String username);
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
        
        IUserService userService = context.getBean(IUserService.class);
        userService.createUser("张三");
    }
}
```

</details>

### 练习 2：进阶练习 - 实现属性检查

创建一个 BeanPostProcessor，检查所有标注了 @Required 的属性是否已注入：

<details>
<summary>点击查看答案</summary>

```java
// Required.java
package com.example;

import java.lang.annotation.*;

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Required {
}

// RequiredPropertyCheckPostProcessor.java
package com.example;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;
import java.lang.reflect.Field;

@Component
public class RequiredPropertyCheckPostProcessor implements BeanPostProcessor {
    
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        Class<?> clazz = bean.getClass();
        
        // 扫描所有字段
        for (Field field : clazz.getDeclaredFields()) {
            // 检查是否有 @Required 注解
            if (field.isAnnotationPresent(Required.class)) {
                field.setAccessible(true);
                try {
                    Object value = field.get(bean);
                    // 如果为 null，抛出异常
                    if (value == null) {
                        throw new IllegalStateException(
                            "Bean [" + beanName + "] 的属性 [" + field.getName() + "] 标注了 @Required，但不能为空"
                        );
                    }
                } catch (IllegalAccessException e) {
                    throw new BeansException("无法访问属性: " + field.getName(), e) {};
                }
            }
        }
        
        return bean;
    }
}

// OrderService.java
package com.example;

import org.springframework.stereotype.Service;

@Service
public class OrderService {
    
    @Required
    private UserRepository userRepository;
    
    // 如果没有注入 userRepository，启动时会报错
    
    public void createOrder() {
        System.out.println("创建订单");
    }
}

// UserRepository.java
package com.example;

import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    public void save() {
        System.out.println("保存数据");
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
        orderService.createOrder();
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 实现简单的 AOP

创建一个 BeanPostProcessor，实现简单的 AOP 功能：
1. 定义 @Log 注解
2. 在 BeanPostProcessor 中为标注了 @Log 的方法添加日志

<details>
<summary>点击查看答案</summary>

```java
// Log.java
package com.example;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Log {
    String value() default "";
}

// SimpleAopPostProcessor.java
package com.example;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;
import java.lang.reflect.*;

@Component
public class SimpleAopPostProcessor implements BeanPostProcessor {
    
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        // 检查是否有 @Component 或 @Service 注解
        if (bean.getClass().isAnnotationPresent(Component.class) || 
            bean.getClass().isAnnotationPresent(org.springframework.stereotype.Service.class)) {
            
            // 创建代理
            return Proxy.newProxyInstance(
                bean.getClass().getClassLoader(),
                bean.getClass().getInterfaces(),
                new LogInvocationHandler(bean)
            );
        }
        
        return bean;
    }
    
    // 调用处理器
    private static class LogInvocationHandler implements InvocationHandler {
        private final Object target;
        
        public LogInvocationHandler(Object target) {
            this.target = target;
        }
        
        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            // 检查方法是否有 @Log 注解
            Log logAnnotation = method.getAnnotation(Log.class);
            
            if (logAnnotation != null) {
                String message = logAnnotation.value().isEmpty() ? method.getName() : logAnnotation.value();
                System.out.println("[日志] 开始执行: " + message);
                long start = System.currentTimeMillis();
                
                // 执行目标方法
                Object result = method.invoke(target, args);
                
                long elapsed = System.currentTimeMillis() - start;
                System.out.println("[日志] 执行完成: " + message + ", 耗时: " + elapsed + "ms");
                
                return result;
            }
            
            // 没有注解，直接执行
            return method.invoke(target, args);
        }
    }
}

// UserService.java
package com.example;

import org.springframework.stereotype.Service;

@Service
public class UserService implements IUserService {
    
    @Override
    @Log("创建用户")
    public void createUser(String username) {
        System.out.println("创建用户: " + username);
    }
    
    @Override
    @Log("删除用户")
    public void deleteUser(String username) {
        System.out.println("删除用户: " + username);
    }
}

// IUserService.java
package com.example;

public interface IUserService {
    void createUser(String username);
    void deleteUser(String username);
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
        
        IUserService userService = context.getBean(IUserService.class);
        userService.createUser("张三");
        System.out.println("---");
        userService.deleteUser("李四");
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **依赖注入底层实现**——深入理解 Spring 是如何完成依赖注入的。你会学到：

- @Autowired、@Resource、@Inject 三者的区别
- 依赖注入的完整流程
- 候选 Bean 的解析和选择机制
- 限定符和 @Primary 的工作原理

准备好了吗？让我们继续深入 Spring 的世界！
