---
title: "第3章：Spring Bean 管理"
description: "深入理解 Spring Bean 的生命周期、作用域和条件装配"
---

# 第3章：Spring Bean 管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring 容器中的 Bean 是如何管理的？
- Bean 的生命周期是怎样的？什么时候创建，什么时候销毁？
- Bean 的作用域有哪些？单例和原型有什么区别？
- 如何根据条件动态创建 Bean？

这一章就是为了解答这些问题。我们会深入理解 Spring Bean 的管理机制，掌握 Bean 的生命周期和作用域，学会使用条件装配灵活控制 Bean 的创建。

---

## 3.1 为什么需要 Bean 管理？

### 痛点分析

如果没有 Spring 的 Bean 管理机制，你需要：

1. **手动管理对象创建**：每个对象都要自己 new 出来
2. **手动管理依赖关系**：对象之间的依赖要自己设置
3. **手动管理生命周期**：什么时候创建、什么时候销毁都要自己控制
4. **难以实现单例模式**：每个地方都要保证只有一个实例

用代码来说，就是这样的：

```java
// 没有 Spring 时的代码
public class UserService {
    private static UserService instance;
    private UserRepository userRepository;
    
    // 手动实现单例
    public static synchronized UserService getInstance() {
        if (instance == null) {
            instance = new UserService();
        }
        return instance;
    }
    
    // 手动设置依赖
    public void init() {
        this.userRepository = new UserRepository();
    }
    
    // 手动管理销毁
    public void destroy() {
        // 清理资源
    }
}
```

### 解决方案

Spring 的 Bean 管理机制帮你解决这些问题：

1. **自动创建对象**：Spring 容器自动创建 Bean 实例
2. **自动注入依赖**：自动处理对象之间的依赖关系
3. **自动管理生命周期**：提供回调方法控制创建和销毁时机
4. **灵活的作用域**：支持单例、原型等多种作用域

用 Spring 写同样的代码：

```java
// 使用 Spring 后的代码
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @PostConstruct
    public void init() {
        System.out.println("Bean 初始化完成");
    }
    
    @PreDestroy
    public void destroy() {
        System.out.println("Bean 即将销毁");
    }
}
```

> **一句话总结**：Spring Bean 管理让对象管理变得自动化、标准化，让你专注于业务逻辑。

---

## 3.2 核心原理

### 3.2.1 Bean 生命周期

Bean 的生命周期是指从创建到销毁的整个过程。Spring 提供了多个回调点，让你可以在不同阶段执行自定义逻辑。

打个比方：

> Bean 的生命周期就像人的成长过程：出生（创建）→ 成长（初始化）→ 工作（使用）→ 退休（销毁）。Spring 就像人生的管理者，在每个阶段都提供回调机会。

**完整的生命周期流程**：

1. **实例化**：创建 Bean 实例
2. **属性赋值**：注入依赖
3. **初始化前**：调用 `@PostConstruct` 或 `InitializingBean.afterPropertiesSet()`
4. **初始化**：调用自定义初始化方法
5. **就绪**：Bean 可以使用了
6. **销毁前**：调用 `@PreDestroy` 或 `DisposableBean.destroy()`
7. **销毁**：Bean 被销毁

### 3.2.2 Bean 作用域

Spring 支持多种 Bean 作用域：

| 作用域 | 说明 | 使用场景 |
| --- | --- | --- |
| singleton | 单例（默认） | 无状态的 Service、DAO |
| prototype | 每次获取都创建新实例 | 有状态的 Bean |
| request | 每个 HTTP 请求一个实例 | Web 应用 |
| session | 每个 HTTP 会话一个实例 | Web 应用 |
| application | 每个 ServletContext 一个实例 | Web 应用 |
| websocket | 每个 WebSocket 一个实例 | WebSocket 应用 |

> **原理**：Spring 容器根据作用域决定何时创建和销毁 Bean。单例 Bean 在容器启动时创建，原型 Bean 在每次获取时创建。

---

## 3.3 基础用法

### 3.3.1 Bean 的创建方式

**方式一：@Component 注解（推荐）**

```java
package com.example.service;

import org.springframework.stereotype.Component;

// 使用 @Component 标记为 Spring Bean
@Component
public class UserService {
    
    public void createUser(String username) {
        System.out.println("创建用户: " + username);
    }
}
```

**方式二：@Bean 注解（配置类中）**

```java
package com.example.config;

import com.example.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 标记为配置类
@Configuration
public class AppConfig {
    
    // 使用 @Bean 定义 Bean
    @Bean
    public UserRepository userRepository() {
        return new UserRepository();
    }
}
```

**方式三：@Service、@Repository、@Controller**

```java
package com.example.service;

import org.springframework.stereotype.Service;

// @Service 是 @Component 的特化，语义更明确
@Service
public class UserService {
    // 业务逻辑
}

package com.example.repository;

import org.springframework.stereotype.Repository;

// @Repository 用于数据访问层
@Repository
public class UserRepository {
    // 数据访问逻辑
}

package com.example.controller;

import org.springframework.web.bind.annotation.RestController;

// @Controller 用于控制器层
@RestController
public class UserController {
    // 控制器逻辑
}
```

> **原理**：@Service、@Repository、@Controller 都是 @Component 的特化注解，功能相同，只是语义更明确。

### 3.3.2 Bean 的生命周期回调

```java
package com.example.service;

import org.springframework.stereotype.Component;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Component
public class UserService {
    
    // 构造函数：Bean 被创建时调用
    public UserService() {
        System.out.println("1. 构造函数：Bean 被创建");
    }
    
    // 依赖注入
    @Autowired
    private UserRepository userRepository;
    
    // 初始化前：依赖注入完成后调用
    @PostConstruct
    public void init() {
        System.out.println("2. @PostConstruct：Bean 初始化完成");
    }
    
    // 销毁前：容器关闭时调用
    @PreDestroy
    public void destroy() {
        System.out.println("3. @PreDestroy：Bean 即将被销毁");
    }
    
    // 业务方法
    public void doSomething() {
        System.out.println("4. 使用 Bean");
    }
}
```

### 3.3.3 Bean 的作用域配置

```java
package com.example.service;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

// 单例作用域（默认）
@Component
@Scope("singleton")
public class SingletonService {
    public SingletonService() {
        System.out.println("SingletonService 被创建");
    }
}

// 原型作用域
@Component
@Scope("prototype")
public class PrototypeService {
    public PrototypeService() {
        System.out.println("PrototypeService 被创建");
    }
}
```

**测试作用域**：

```java
package com.example;

import com.example.service.SingletonService;
import com.example.service.PrototypeService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        ApplicationContext context = SpringApplication.run(DemoApplication.class, args);
        
        // 单例：两次获取是同一个对象
        SingletonService s1 = context.getBean(SingletonService.class);
        SingletonService s2 = context.getBean(SingletonService.class);
        System.out.println("单例: " + (s1 == s2)); // true
        
        // 原型：两次获取是不同对象
        PrototypeService p1 = context.getBean(PrototypeService.class);
        PrototypeService p2 = context.getBean(PrototypeService.class);
        System.out.println("原型: " + (p1 == p2)); // false
    }
}
```

### 3.3.4 条件装配

```java
package com.example.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConditionalConfig {
    
    // 当类路径中存在 RedisTemplate 类时创建 Bean
    @Bean
    @ConditionalOnClass(name = "org.springframework.data.redis.core.RedisTemplate")
    public RedisService redisService() {
        return new RedisService();
    }
    
    // 当容器中没有 UserService 时创建
    @Bean
    @ConditionalOnMissingBean
    public UserService defaultUserService() {
        return new UserService();
    }
    
    // 当配置属性 app.cache.enabled=true 时创建
    @Bean
    @ConditionalOnProperty(name = "app.cache.enabled", havingValue = "true")
    public CacheService cacheService() {
        return new CacheService();
    }
}
```

### 3.3.5 自定义初始化方法

```java
package com.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BeanConfig {
    
    // 使用 initMethod 和 destroyMethod 指定方法
    @Bean(initMethod = "init", destroyMethod = "cleanup")
    public DatabaseService databaseService() {
        return new DatabaseService();
    }
}

class DatabaseService {
    
    public void init() {
        System.out.println("数据库连接初始化");
    }
    
    public void cleanup() {
        System.out.println("数据库连接关闭");
    }
}
```

---

## 3.4 进阶用法

### 3.4.1 Bean 的延迟初始化

```java
package com.example.service;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
@Lazy // 延迟初始化，第一次使用时才创建
public class ExpensiveService {
    
    public ExpensiveService() {
        System.out.println("ExpensiveService 被创建");
    }
}
```

### 3.4.2 Bean 的继承

```java
package com.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InheritanceConfig {
    
    // 父 Bean
    @Bean
    public ParentService parentService() {
        ParentService parent = new ParentService();
        parent.setName("父服务");
        return parent;
    }
    
    // 子 Bean，继承父 Bean 的属性
    @Bean(parent = "parentService")
    public ChildService childService() {
        ChildService child = new ChildService();
        child.setExtra("额外属性");
        return child;
    }
}
```

### 3.4.3 Bean 的依赖检查

```java
package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    
    private final UserService userService;
    
    // 构造函数注入，依赖必须存在
    @Autowired
    public OrderService(UserService userService) {
        this.userService = userService;
    }
    
    // 可选依赖
    @Autowired(required = false)
    private CacheService cacheService;
}
```

---

## 3.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| @Component | 标记类为 Spring Bean |
| @Service/@Repository/@Controller | @Component 的特化注解 |
| @Bean | 在配置类中定义 Bean |
| @PostConstruct | 初始化回调 |
| @PreDestroy | 销毁回调 |
| @Scope | 指定 Bean 作用域 |
| singleton | 单例作用域（默认） |
| prototype | 原型作用域 |
| @ConditionalOnClass | 条件装配：类存在时创建 |
| @ConditionalOnMissingBean | 条件装配：Bean 不存在时创建 |
| @Lazy | 延迟初始化 |

---

## 3.6 新手常见误区

### 误区 1："单例 Bean 是线程安全的"

**错！** Spring 的单例 Bean 只保证容器中只有一个实例，但不保证线程安全。如果 Bean 中有可变状态，需要自己处理并发问题。

**正确做法**：
- 尽量设计无状态的 Bean
- 使用 ThreadLocal 保存线程私有数据
- 必要时使用 synchronized 或 Lock

### 误区 2："原型 Bean 注入到单例 Bean 中会每次创建新实例"

**错！** 原型 Bean 注入到单例 Bean 中时，只会在单例 Bean 创建时注入一次，之后都是同一个实例。

**正确做法**：使用 `@Lookup` 注解或 `ObjectProvider`

```java
@Service
public class SingletonService {
    
    @Lookup
    public PrototypeService getPrototypeService() {
        return null; // Spring 会自动实现这个方法
    }
}
```

### 误区 3："@PostConstruct 可以注入依赖"

**可以！** @PostConstruct 方法在依赖注入完成后调用，所以可以安全地使用注入的依赖。

**执行顺序**：构造函数 → 依赖注入 → @PostConstruct

### 误区 4："Bean 的作用域可以随意切换"

**不建议！** 单例 Bean 注入原型 Bean 会有问题（见误区2）。应该根据实际需求选择合适的作用域。

**选择建议**：
- 无状态服务：使用 singleton
- 有状态服务：使用 prototype
- Web 请求相关：使用 request

### 误区 5："条件装配只在 Spring Boot 中可用"

**错！** 条件装配是 Spring Framework 的功能，Spring Boot 只是扩展了更多条件注解。在纯 Spring 项目中也可以使用 @Conditional 系列注解。

---

## 3.7 动手练习

### 练习 1：基础练习 - Bean 生命周期

创建一个 Bean，实现以下功能：
1. 在构造函数中打印 "Bean 创建"
2. 使用 @PostConstruct 打印 "Bean 初始化"
3. 使用 @PreDestroy 打印 "Bean 销毁"
4. 验证执行顺序

<details>
<summary>点击查看答案</summary>

```java
// LifecycleBean.java
package com.example.bean;

import org.springframework.stereotype.Component;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Component
public class LifecycleBean {
    
    public LifecycleBean() {
        System.out.println("1. Bean 创建");
    }
    
    @PostConstruct
    public void init() {
        System.out.println("2. Bean 初始化");
    }
    
    @PreDestroy
    public void destroy() {
        System.out.println("3. Bean 销毁");
    }
    
    public void doSomething() {
        System.out.println("Bean 工作中");
    }
}

// DemoApplication.java
package com.example;

import com.example.bean.LifecycleBean;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(DemoApplication.class, args);
        
        LifecycleBean bean = context.getBean(LifecycleBean.class);
        bean.doSomething();
        
        // 关闭容器，触发 @PreDestroy
        context.close();
    }
}
```

</details>

### 练习 2：进阶练习 - 条件装配

创建一个配置类，根据条件创建不同的 Bean：
1. 当配置 `app.database.type=mysql` 时创建 MySQL 数据源
2. 当配置 `app.database.type=postgresql` 时创建 PostgreSQL 数据源
3. 当没有配置时创建默认数据源

<details>
<summary>点击查看答案</summary>

```yaml
# application.yml
app:
  database:
    type: mysql
```

```java
// DataSourceConfig.java
package com.example.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceConfig {
    
    @Bean
    @ConditionalOnProperty(name = "app.database.type", havingValue = "mysql")
    public DataSource mysqlDataSource() {
        System.out.println("创建 MySQL 数据源");
        return new MySQLDataSource();
    }
    
    @Bean
    @ConditionalOnProperty(name = "app.database.type", havingValue = "postgresql")
    public DataSource postgresqlDataSource() {
        System.out.println("创建 PostgreSQL 数据源");
        return new PostgreSQLDataSource();
    }
    
    @Bean
    @ConditionalOnProperty(name = "app.database.type", matchIfMissing = true)
    public DataSource defaultDataSource() {
        System.out.println("创建默认数据源");
        return new DefaultDataSource();
    }
}

interface DataSource {}
class MySQLDataSource implements DataSource {}
class PostgreSQLDataSource implements DataSource {}
class DefaultDataSource implements DataSource {}
```

</details>

### 练习 3（挑战）：综合练习 - Bean 作用域

创建一个应用，验证单例和原型 Bean 的区别：
1. 创建单例 Service 和原型 Service
2. 在单例 Service 中注入原型 Service
3. 验证原型 Service 是否每次都是新实例
4. 使用 @Lookup 解决问题

<details>
<summary>点击查看答案</summary>

```java
// PrototypeService.java
package com.example.service;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Service;

@Service
@Scope("prototype")
public class PrototypeService {
    private static int counter = 0;
    private final int id;
    
    public PrototypeService() {
        this.id = ++counter;
        System.out.println("PrototypeService 创建, id=" + id);
    }
    
    public int getId() { return id; }
}

// SingletonService.java
package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Lookup;
import org.springframework.stereotype.Service;

@Service
public class SingletonService {
    
    // 方式一：直接注入（有问题）
    @Autowired
    private PrototypeService prototypeService1;
    
    // 方式二：使用 @Lookup（正确）
    @Lookup
    public PrototypeService getPrototypeService() {
        return null;
    }
    
    public void test() {
        System.out.println("直接注入的 id: " + prototypeService1.getId());
        System.out.println("@Lookup 获取的 id: " + getPrototypeService().getId());
        System.out.println("@Lookup 再次获取的 id: " + getPrototypeService().getId());
    }
}

// DemoApplication.java
package com.example;

import com.example.service.SingletonService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        ApplicationContext context = SpringApplication.run(DemoApplication.class, args);
        
        SingletonService singletonService = context.getBean(SingletonService.class);
        singletonService.test();
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring 依赖注入详解**——也就是 Spring DI 的各种用法和最佳实践。你会学到：

- 构造函数注入 vs Setter 注入 vs 字段注入
- @Qualifier 和 @Primary 的使用
- 循环依赖的处理
- 依赖注入的最佳实践

准备好了吗？让我们继续深入 Spring 的世界！
