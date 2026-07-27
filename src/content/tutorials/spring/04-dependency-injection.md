---
title: "第4章：Spring 依赖注入详解"
description: "深入理解 Spring 依赖注入的各种方式和最佳实践"
---

# 第4章：Spring 依赖注入详解

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 依赖注入有哪几种方式？各有什么优缺点？
- @Autowired 和 @Resource 有什么区别？
- 当有多个实现时，Spring 如何选择注入哪个 Bean？
- 什么是循环依赖？Spring 如何解决？

这一章就是为了解答这些问题。我们会深入理解依赖注入的各种方式，掌握解决多实现和循环依赖的方法，学会依赖注入的最佳实践。

---

## 1 为什么需要依赖注入？

### 痛点分析

如果没有依赖注入，对象之间的依赖关系是硬编码的：

```java
// 没有依赖注入
public class OrderService {
    // 直接创建依赖，耦合度高
    private UserRepository userRepository = new UserRepository();
    private EmailService emailService = new EmailService();
    
    public void createOrder(Order order) {
        userRepository.save(order);
        emailService.send(order.getUser().getEmail(), "订单创建成功");
    }
}
```

**问题**：
- 依赖关系硬编码，难以替换
- 单元测试困难，无法使用 Mock
- 代码耦合度高，难以维护

### 解决方案

依赖注入将依赖关系的创建交给 Spring 容器：

```java
// 使用依赖注入
@Service
public class OrderService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    // 依赖由 Spring 注入
    @Autowired
    public OrderService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
}
```

> **一句话总结**：依赖注入让对象之间的依赖关系由容器管理，降低耦合，提高可测试性。

---

## 2 核心原理

### 依赖注入的三种方式

| 方式 | 说明 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 构造函数注入 | 通过构造函数注入依赖 | 依赖不可变、不为 null | 依赖多时构造函数复杂 |
| Setter 注入 | 通过 Setter 方法注入依赖 | 依赖可选、可重新注入 | 依赖可能为 null |
| 字段注入 | 直接在字段上注入 | 代码简洁 | 无法 final、难以测试 |

> **推荐**：优先使用构造函数注入，这是 Spring 官方推荐的方式。

---

## 3 基础用法

### 4.3.1 构造函数注入（推荐）

```java
package com.example.service;

import org.springframework.stereotype.Service;

@Service
public class OrderService {
    
    // 使用 final 保证依赖不可变
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    // 构造函数注入（Spring 4.3+ 可以省略 @Autowired）
    public OrderService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
    
    public void createOrder(String username) {
        userRepository.save(username);
        emailService.send(username + "@example.com", "订单创建成功");
    }
}
```

> **原理**：Spring 会自动找到构造函数，注入所需的依赖。从 Spring 4.3 开始，如果类只有一个构造函数，可以省略 @Autowired。

### 4.3.2 Setter 注入

```java
package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    
    private UserRepository userRepository;
    private EmailService emailService;
    
    // Setter 注入
    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Autowired
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }
}
```

### 4.3.3 字段注入（不推荐）

```java
package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProductService {
    
    // 字段注入
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CacheService cacheService;
}
```

❌ **不推荐**：无法使用 final，依赖可能为 null，单元测试困难。

### 4.3.4 @Autowired vs @Resource

```java
package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import javax.annotation.Resource;

@Service
public class ComparisonService {
    
    // @Autowired：按类型注入（Spring 提供）
    @Autowired
    private UserService userService;
    
    // @Resource：按名称注入（JSR-250 提供）
    @Resource(name = "userService")
    private UserService userService2;
    
    // @Resource 默认按名称，找不到再按类型
    @Resource
    private EmailService emailService;
}
```

**对比**：

| 特性 | @Autowired | @Resource |
| --- | --- | --- |
| 来源 | Spring | JSR-250 |
| 注入方式 | 按类型 | 按名称（默认） |
| 配合使用 | @Qualifier | name 属性 |
| 必需依赖 | required 属性 | 无 |
| 推荐度 | 推荐 | 可选 |

### 4.3.5 处理多实现

当接口有多个实现时，需要指定注入哪个：

```java
package com.example.service;

// 接口
public interface PaymentService {
    void pay(double amount);
}

// 实现1
@Service("alipay")
public class AlipayService implements PaymentService {
    @Override
    public void pay(double amount) {
        System.out.println("支付宝支付: " + amount);
    }
}

// 实现2
@Service("wechat")
public class WechatPayService implements PaymentService {
    @Override
    public void pay(double amount) {
        System.out.println("微信支付: " + amount);
    }
}
```

**方式一：@Qualifier 指定名称**

```java
@Service
public class OrderService {
    
    private final PaymentService paymentService;
    
    // 使用 @Qualifier 指定注入 alipay
    @Autowired
    public OrderService(@Qualifier("alipay") PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

**方式二：@Primary 标记主要实现**

```java
@Service
@Primary // 标记为主要实现
public class AlipayService implements PaymentService {
    @Override
    public void pay(double amount) {
        System.out.println("支付宝支付: " + amount);
    }
}

@Service
public class OrderService {
    
    private final PaymentService paymentService;
    
    // 自动注入 @Primary 标记的实现
    @Autowired
    public OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

**方式三：注入所有实现**

```java
@Service
public class PaymentServiceManager {
    
    // 注入所有 PaymentService 实现
    private final List<PaymentService> paymentServices;
    
    @Autowired
    public PaymentServiceManager(List<PaymentService> paymentServices) {
        this.paymentServices = paymentServices;
    }
    
    public void payAll(double amount) {
        for (PaymentService service : paymentServices) {
            service.pay(amount);
        }
    }
}
```

---

## 4 进阶用法

### 4.4.1 可选依赖

```java
@Service
public class UserService {
    
    // 可选依赖，如果容器中没有就不会报错
    @Autowired(required = false)
    private CacheService cacheService;
    
    public void doSomething() {
        if (cacheService != null) {
            cacheService.clear();
        }
    }
}
```

### 4.4.2 ObjectProvider

```java
@Service
public class UserService {
    
    private final ObjectProvider<CacheService> cacheServiceProvider;
    
    public UserService(ObjectProvider<CacheService> cacheServiceProvider) {
        this.cacheServiceProvider = cacheServiceProvider;
    }
    
    public void doSomething() {
        // 延迟获取，每次调用都是新的实例（如果是原型）
        CacheService cacheService = cacheServiceProvider.getIfAvailable();
        if (cacheService != null) {
            cacheService.clear();
        }
    }
}
```

### 4.4.3 循环依赖处理

**问题场景**：

```java
@Service
public class ServiceA {
    @Autowired
    private ServiceB serviceB;
}

@Service
public class ServiceB {
    @Autowired
    private ServiceA serviceA;
}
```

**解决方案一：重构代码（推荐）**

循环依赖通常意味着设计问题，应该重构。

**解决方案二：@Lazy**

```java
@Service
public class ServiceA {
    
    @Autowired
    @Lazy // 延迟加载，打破循环
    private ServiceB serviceB;
}
```

**解决方案三：构造函数注入 + @Lazy**

```java
@Service
public class ServiceA {
    
    private final ServiceB serviceB;
    
    public ServiceA(@Lazy ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}
```

> **注意**：Spring Boot 2.6+ 默认禁止循环依赖，需要手动开启：
> ```yaml
> spring:
>   main:
>     allow-circular-references: true
> ```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 构造函数注入 | 推荐方式，依赖不可变 |
| Setter 注入 | 可选依赖，可重新注入 |
| 字段注入 | 不推荐，难以测试 |
| @Autowired | 按类型注入 |
| @Resource | 按名称注入 |
| @Qualifier | 指定 Bean 名称 |
| @Primary | 标记主要实现 |
| required = false | 可选依赖 |
| ObjectProvider | 延迟获取 Bean |
| @Lazy | 延迟加载，解决循环依赖 |

---

## 6 新手常见误区

### 误区 1："字段注入最简单，应该优先使用"

**错！** 虽然字段注入代码简洁，但有以下问题：
- 无法使用 final 修饰符
- 单元测试困难，需要反射
- 隐藏了依赖关系

**推荐做法**：使用构造函数注入

### 误区 2："@Autowired 和 @Resource 完全相同"

**错！** 它们有本质区别：
- @Autowired 按类型注入，配合 @Qualifier 按名称
- @Resource 默认按名称注入

**选择建议**：优先使用 @Autowired（Spring 生态）

### 误区 3："循环依赖 Spring 都能解决"

**错！** Spring 只能解决单例 Bean 的 Setter 注入循环依赖，构造函数注入的循环依赖无法解决。

**正确做法**：重构代码，消除循环依赖

### 误区 4："@Primary 和 @Qualifier 不能同时使用"

**可以！** @Primary 设置默认实现，@Qualifier 可以覆盖 @Primary 的选择。

```java
@Service
public class OrderService {
    
    // 虽然 @Primary 标记了 Alipay，但 @Qualifier 指定 Wechat
    @Autowired
    public OrderService(@Qualifier("wechat") PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

### 误区 5："依赖越多越好"

**错！** 过多的依赖通常意味着类职责过多，应该拆分。

**正确做法**：遵循单一职责原则，一个类只做一件事。

---

## 7 动手练习

### 练习 1：基础练习 - 构造函数注入

创建一个 OrderService，使用构造函数注入 UserRepository 和 EmailService：
1. 定义接口和实现
2. 使用构造函数注入
3. 实现创建订单的方法

<details>
<summary>点击查看答案</summary>

```java
// UserRepository.java
package com.example.repository;

import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    public void save(String username) {
        System.out.println("保存用户: " + username);
    }
}

// EmailService.java
package com.example.service;

import org.springframework.stereotype.Service;

@Service
public class EmailService {
    public void send(String to, String subject) {
        System.out.println("发送邮件到: " + to + ", 主题: " + subject);
    }
}

// OrderService.java
package com.example.service;

import com.example.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    // 构造函数注入
    public OrderService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
    
    public void createOrder(String username) {
        userRepository.save(username);
        emailService.send(username + "@example.com", "订单创建成功");
        System.out.println("订单创建完成");
    }
}
```

</details>

### 练习 2：进阶练习 - 处理多实现

创建一个支付系统，包含支付宝和微信支付两种实现：
1. 定义 PaymentService 接口
2. 创建 AlipayService 和 WechatPayService 实现
3. 使用 @Primary 标记支付宝为主要实现
4. 在 OrderService 中使用 @Qualifier 选择微信支付

<details>
<summary>点击查看答案</summary>

```java
// PaymentService.java
package com.example.service;

public interface PaymentService {
    void pay(double amount);
}

// AlipayService.java
package com.example.service;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service("alipay")
@Primary
public class AlipayService implements PaymentService {
    @Override
    public void pay(double amount) {
        System.out.println("支付宝支付: " + amount + " 元");
    }
}

// WechatPayService.java
package com.example.service;

import org.springframework.stereotype.Service;

@Service("wechat")
public class WechatPayService implements PaymentService {
    @Override
    public void pay(double amount) {
        System.out.println("微信支付: " + amount + " 元");
    }
}

// OrderService.java
package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    
    private final PaymentService paymentService;
    
    // 使用 @Qualifier 指定微信支付
    @Autowired
    public OrderService(@Qualifier("wechat") PaymentService paymentService) {
        this.paymentService = paymentService;
    }
    
    public void createOrder(double amount) {
        System.out.println("创建订单");
        paymentService.pay(amount);
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 注入所有实现

创建一个通知系统，支持邮件、短信、推送三种通知方式：
1. 定义 NotificationService 接口
2. 创建三种实现
3. 注入所有实现到 NotificationManager
4. 实现群发通知功能

<details>
<summary>点击查看答案</summary>

```java
// NotificationService.java
package com.example.service;

public interface NotificationService {
    void send(String message);
    String getType();
}

// EmailNotification.java
package com.example.service;

import org.springframework.stereotype.Service;

@Service
public class EmailNotification implements NotificationService {
    @Override
    public void send(String message) {
        System.out.println("邮件通知: " + message);
    }
    
    @Override
    public String getType() {
        return "邮件";
    }
}

// SmsNotification.java
package com.example.service;

import org.springframework.stereotype.Service;

@Service
public class SmsNotification implements NotificationService {
    @Override
    public void send(String message) {
        System.out.println("短信通知: " + message);
    }
    
    @Override
    public String getType() {
        return "短信";
    }
}

// PushNotification.java
package com.example.service;

import org.springframework.stereotype.Service;

@Service
public class PushNotification implements NotificationService {
    @Override
    public void send(String message) {
        System.out.println("推送通知: " + message);
    }
    
    @Override
    public String getType() {
        return "推送";
    }
}

// NotificationManager.java
package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationManager {
    
    // 注入所有 NotificationService 实现
    private final List<NotificationService> notificationServices;
    
    @Autowired
    public NotificationManager(List<NotificationService> notificationServices) {
        this.notificationServices = notificationServices;
    }
    
    // 发送所有类型的通知
    public void sendAll(String message) {
        System.out.println("开始群发通知...");
        for (NotificationService service : notificationServices) {
            service.send(message);
        }
        System.out.println("群发完成，共发送 " + notificationServices.size() + " 种通知");
    }
    
    // 发送指定类型的通知
    public void sendByType(String type, String message) {
        for (NotificationService service : notificationServices) {
            if (service.getType().equals(type)) {
                service.send(message);
                return;
            }
        }
        System.out.println("未找到通知类型: " + type);
    }
    
    // 显示所有支持的通知类型
    public void listTypes() {
        System.out.println("支持的通知类型:");
        for (NotificationService service : notificationServices) {
            System.out.println("- " + service.getType());
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring AOP 面向切面编程**——也就是如何处理跨切面的关注点。你会学到：

- AOP 的核心概念
- 切面、通知、切入点的定义
- 各种通知类型
- 实战：日志切面、权限切面

准备好了吗？让我们继续深入 Spring 的世界！
