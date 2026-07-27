---
title: "第 13 章：Spring 事件机制原理"
description: "深入理解 Spring 事件机制，掌握 ApplicationEvent 体系与事件发布流程"
---

# 第 13 章：Spring 事件机制原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Spring 事件机制到底是什么？和观察者模式有什么关系？
- 怎么自定义事件？事件发布后谁在监听？
- @EventListener 是怎么工作的？和实现 ApplicationListener 接口有什么区别？
- 同步事件和异步事件有什么区别？怎么实现异步事件？

这一章就是为了解答这些问题。我们会先搞清楚 **事件机制的核心原理**，再动手实现自定义事件，最后深入源码看看 Spring 是怎么玩转观察者模式的。

---

## 1 为什么需要事件机制？

### 痛点分析

想象一下这个场景：用户注册成功后，你需要做三件事：
1. 发送欢迎邮件
2. 初始化用户积分
3. 记录注册日志

没有事件机制时，你可能会这样写：

```java
public void register(User user) {
    // 保存用户
    userRepository.save(user);
    
    // 发送欢迎邮件
    emailService.sendWelcomeEmail(user);
    
    // 初始化积分
    pointsService.initPoints(user);
    
    // 记录日志
    logService.logRegistration(user);
}
```

**问题来了**：
- 注册方法和邮件、积分、日志强耦合
- 如果要加新逻辑（比如发送短信），就得改 register 方法
- 邮件发送失败会影响整个注册流程
- 代码越来越臃肿，难以维护

### 解决方案

有了事件机制，代码变成这样：

```java
public void register(User user) {
    // 保存用户
    userRepository.save(user);
    
    // 发布事件，其他模块自己监听处理
    applicationEventPublisher.publishEvent(new UserRegisteredEvent(user));
}
```

**好处**：
- 注册方法只负责核心逻辑
- 邮件、积分、日志各自独立，互不影响
- 新增功能只需添加新的监听器
- 符合开闭原则，对扩展开放，对修改关闭

> **一句话总结**：事件机制让代码解耦，让模块之间通过事件"对话"，而不是直接调用。

---

## 2 核心原理讲解

### 概念解释

Spring 事件机制基于**观察者模式**，有三个核心角色：

1. **事件（Event）**：发生了什么事
2. **发布者（Publisher）**：宣布这件事的人
3. **监听者（Listener）**：关心这件事并做出反应的人

打个比方：

> 你在微信群里发了一条消息（发布事件），群里关注这个话题的人（监听者）看到后会回复（处理事件）。不关心的人继续聊天，不受影响。

### 事件体系结构

Spring 事件体系的核心类：

```
ApplicationEvent（抽象基类）
    ├── ApplicationEvent（应用事件基类）
    │   ├── ContextStartedEvent（容器启动事件）
    │   ├── ContextStoppedEvent（容器停止事件）
    │   ├── ContextRefreshedEvent（容器刷新事件）
    │   ├── ContextClosedEvent（容器关闭事件）
    │   └── RequestHandledEvent（请求处理事件）
    └── 自定义事件（继承 ApplicationEvent 或普通类）
```

### 源码分析

让我们看看 Spring 事件发布的核心源码：

```java
// ApplicationEventPublisher 接口
public interface ApplicationEventPublisher {
    // 发布事件
    default void publishEvent(ApplicationEvent event) {
        publishEvent((Object) event);
    }
    
    void publishEvent(Object event);
}

// AbstractApplicationContext 实现
public void publishEvent(Object event) {
    // 1. 包装事件
    ApplicationEvent applicationEvent;
    if (event instanceof ApplicationEvent) {
        applicationEvent = (ApplicationEvent) event;
    } else {
        // 如果是普通对象，包装成 PayloadApplicationEvent
        applicationEvent = new PayloadApplicationEvent<>(this, event);
    }
    
    // 2. 获取事件广播器
    getApplicationEventMulticaster().multicastEvent(applicationEvent, eventType);
}

// SimpleApplicationEventMulticaster 广播实现
public void multicastEvent(final ApplicationEvent event, ResolvableType eventType) {
    ResolvableType type = (eventType != null ? eventType : resolveDefaultEventType(event));
    
    // 3. 遍历所有监听器
    for (final ApplicationListener<?> listener : getApplicationListeners(event, type)) {
        Executor executor = getTaskExecutor();
        if (executor != null) {
            // 异步执行
            executor.execute(() -> invokeListener(listener, event));
        } else {
            // 同步执行
            invokeListener(listener, event);
        }
    }
}
```

**关键点**：
- 事件发布时，Spring 会找到所有匹配的监听器
- 如果有线程池，就异步执行；否则同步执行
- 监听器按顺序被调用，一个监听器异常会影响后续监听器

### 对比分析

| 特性 | ApplicationListener 接口 | @EventListener 注解 |
| --- | --- | --- |
| 使用方式 | 实现接口 | 方法上加注解 |
| 代码侵入性 | 高（需要实现接口） | 低（任意方法都可以） |
| 灵活性 | 一般 | 高（支持条件过滤） |
| 异步支持 | 需要自己处理 | 配合 @Async 注解 |
| 推荐使用 | 旧版本 | Spring 4.2+ |

---

## 3 基础用法

### 示例 1：自定义事件

```java
// 1. 定义事件类
// 继承 ApplicationEvent（推荐，也可以不继承）
public class UserRegisteredEvent extends ApplicationEvent {
    // 用户信息
    private final User user;
    
    // 构造函数，source 是事件源（通常是发布事件的对象）
    public UserRegisteredEvent(Object source, User user) {
        super(source);
        this.user = user;
    }
    
    // 获取用户信息
    public User getUser() {
        return user;
    }
}

// 2. 发布事件
@Service
public class UserService {
    // 注入事件发布器
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    @Autowired
    private UserRepository userRepository;
    
    public void register(User user) {
        // 保存用户到数据库
        userRepository.save(user);
        
        // 发布用户注册事件
        // Spring 会自动通知所有监听这个事件的监听器
        eventPublisher.publishEvent(new UserRegisteredEvent(this, user));
        
        System.out.println("用户注册完成");
    }
}

// 3. 监听事件（方式一：实现 ApplicationListener 接口）
@Component
public class EmailNotificationListener implements ApplicationListener<UserRegisteredEvent> {
    @Override
    public void onApplicationEvent(UserRegisteredEvent event) {
        // 获取事件中的用户信息
        User user = event.getUser();
        
        // 发送欢迎邮件
        System.out.println("发送欢迎邮件给：" + user.getUsername());
    }
}

// 4. 监听事件（方式二：使用 @EventListener 注解）
@Component
public class PointsInitializationListener {
    @EventListener
    public void handleUserRegistered(UserRegisteredEvent event) {
        // 获取用户信息
        User user = event.getUser();
        
        // 初始化积分
        System.out.println("初始化用户积分：" + user.getUsername());
    }
}

// 5. 监听事件（方式三：监听多个事件）
@Component
public class AuditLogListener {
    @EventListener({UserRegisteredEvent.class, UserLoginEvent.class})
    public void handleUserActivity(ApplicationEvent event) {
        // 记录审计日志
        System.out.println("记录用户活动日志：" + event.getClass().getSimpleName());
    }
}
```

### 示例 2：条件监听

```java
@Component
public class VipUserListener {
    // 只有 VIP 用户才触发这个监听器
    @EventListener(condition = "#event.user.vip == true")
    public void handleVipUserRegistered(UserRegisteredEvent event) {
        User user = event.getUser();
        System.out.println("VIP 用户注册，发送特别礼物：" + user.getUsername());
    }
}
```

### 示例 3：异步事件

```java
// 1. 配置类启用异步
@Configuration
@EnableAsync  // 启用异步支持
public class AsyncConfig {
    // 配置线程池
    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);      // 核心线程数
        executor.setMaxPoolSize(10);      // 最大线程数
        executor.setQueueCapacity(100);   // 队列容量
        executor.setThreadNamePrefix("async-event-");  // 线程名前缀
        executor.initialize();
        return executor;
    }
}

// 2. 异步监听器
@Component
public class AsyncEmailListener {
    @Async  // 标记为异步执行
    @EventListener
    public void handleUserRegistered(UserRegisteredEvent event) {
        // 这个方法会在另一个线程中执行
        System.out.println("异步发送邮件，线程：" + Thread.currentThread().getName());
        
        // 模拟耗时操作
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("邮件发送完成");
    }
}

// 3. 测试
@SpringBootTest
public class EventTest {
    @Autowired
    private UserService userService;
    
    @Test
    public void testAsyncEvent() {
        System.out.println("主线程开始：" + Thread.currentThread().getName());
        
        // 发布事件
        userService.register(new User("张三", "zhangsan@example.com"));
        
        System.out.println("主线程结束：" + Thread.currentThread().getName());
        
        // 等待异步任务完成
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

**输出结果**：
```
主线程开始：main
用户注册完成
主线程结束：main
异步发送邮件，线程：async-event-1
邮件发送完成
```

可以看到，邮件发送在另一个线程中执行，不会阻塞主线程。

---

## 4 进阶用法

### 泛型事件监听

```java
// 定义泛型事件
public class BaseEntityEvent<T> extends ApplicationEvent {
    private final T entity;
    
    public BaseEntityEvent(Object source, T entity) {
        super(source);
        this.entity = entity;
    }
    
    public T getEntity() {
        return entity;
    }
}

// 用户事件
public class UserEvent extends BaseEntityEvent<User> {
    public UserEvent(Object source, User entity) {
        super(source, entity);
    }
}

// 订单事件
public class OrderEvent extends BaseEntityEvent<Order> {
    public OrderEvent(Object source, Order entity) {
        super(source, entity);
    }
}

// 监听器
@Component
public class UserEventListener {
    // 只监听 UserEvent，不会收到 OrderEvent
    @EventListener
    public void handleUserEvent(UserEvent event) {
        User user = event.getEntity();
        System.out.println("处理用户事件：" + user.getUsername());
    }
}
```

### 事务性事件监听

```java
@Component
public class TransactionalEventListener {
    // 只在事务成功后执行
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAfterCommit(UserRegisteredEvent event) {
        System.out.println("事务已提交，执行后续操作");
    }
    
    // 事务回滚后执行
    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void handleAfterRollback(UserRegisteredEvent event) {
        System.out.println("事务已回滚，执行补偿操作");
    }
    
    // 事务完成后执行（无论成功还是回滚）
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMPLETION)
    public void handleAfterCompletion(UserRegisteredEvent event) {
        System.out.println("事务已完成，执行清理操作");
    }
}
```

### 事件排序

```java
@Component
public class FirstListener {
    @EventListener
    @Order(1)  // 优先级最高
    public void handle(UserRegisteredEvent event) {
        System.out.println("第一个执行");
    }
}

@Component
public class SecondListener {
    @EventListener
    @Order(2)
    public void handle(UserRegisteredEvent event) {
        System.out.println("第二个执行");
    }
}

@Component
public class ThirdListener {
    @EventListener
    @Order(3)
    public void handle(UserRegisteredEvent event) {
        System.out.println("第三个执行");
    }
}
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| ApplicationEvent | 事件基类，所有事件都继承自它 |
| ApplicationListener | 事件监听器接口 |
| ApplicationEventPublisher | 事件发布器接口 |
| @EventListener | 注解方式监听事件，更灵活 |
| @Async | 配合 @EventListener 实现异步事件 |
| @Order | 控制监听器执行顺序 |
| @TransactionalEventListener | 事务性事件监听 |
| ApplicationEventMulticaster | 事件广播器，负责调用所有监听器 |

---

## 6 新手常见误区

### 误区 1："事件发布后所有监听器都会异步执行"

**错！** 默认情况下，事件是**同步**执行的。所有监听器在同一个线程中按顺序执行。

正确做法：
```java
// 需要显式标记 @Async 才会异步执行
@Async
@EventListener
public void handleEvent(MyEvent event) {
    // 异步执行
}
```

### 误区 2："监听器异常不会影响其他监听器"

**错！** 如果一个监听器抛出异常，后续监听器不会被执行。

正确做法：
```java
@EventListener
public void handleEvent(MyEvent event) {
    try {
        // 处理逻辑
    } catch (Exception e) {
        // 捕获异常，避免影响其他监听器
        log.error("处理事件失败", e);
    }
}
```

### 误区 3："@EventListener 方法可以是私有的"

**错！** @EventListener 方法必须是**public**的，否则 Spring 无法调用。

正确做法：
```java
// ✅ 正确
@EventListener
public void handleEvent(MyEvent event) {
    // 处理逻辑
}

// ❌ 错误
@EventListener
private void handleEvent(MyEvent event) {
    // 不会被调用
}
```

### 误区 4："事件只能发布一次"

不是的。你可以在任何地方、任何时候发布事件，包括在监听器中发布新事件。

```java
@EventListener
public void handleEvent(UserRegisteredEvent event) {
    // 在监听器中发布新事件
    applicationEventPublisher.publishEvent(new WelcomeEmailSentEvent(this, event.getUser()));
}
```

### 误区 5："事件机制会严重影响性能"

不一定。同步事件确实会增加响应时间，但：
- 异步事件不会阻塞主线程
- 事件机制本身开销很小
- 性能瓶颈通常在监听器的业务逻辑，而不是事件机制本身

---

## 7 动手练习

### 练习 1：基础练习 - 实现订单事件

实现一个订单创建事件，包含订单信息，发布后打印订单详情。

<details>
<summary>点击查看答案</summary>

```java
// 1. 定义订单事件
public class OrderCreatedEvent extends ApplicationEvent {
    private final Order order;
    
    public OrderCreatedEvent(Object source, Order order) {
        super(source);
        this.order = order;
    }
    
    public Order getOrder() {
        return order;
    }
}

// 2. 订单服务
@Service
public class OrderService {
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    public void createOrder(Order order) {
        // 保存订单
        System.out.println("保存订单：" + order.getOrderNo());
        
        // 发布事件
        eventPublisher.publishEvent(new OrderCreatedEvent(this, order));
    }
}

// 3. 监听器
@Component
public class OrderCreatedListener {
    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        Order order = event.getOrder();
        System.out.println("订单创建成功，订单号：" + order.getOrderNo());
        System.out.println("订单金额：" + order.getAmount());
    }
}

// 4. 测试
@SpringBootTest
public class OrderTest {
    @Autowired
    private OrderService orderService;
    
    @Test
    public void testCreateOrder() {
        Order order = new Order();
        order.setOrderNo("ORD20240101001");
        order.setAmount(new BigDecimal("99.99"));
        
        orderService.createOrder(order);
    }
}
```

</details>

### 练习 2：进阶练习 - 异步事件处理

实现用户登录事件，异步记录登录日志（模拟耗时操作）。

<details>
<summary>点击查看答案</summary>

```java
// 1. 配置异步支持
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(5);
        executor.setThreadNamePrefix("login-log-");
        executor.initialize();
        return executor;
    }
}

// 2. 登录事件
public class UserLoginEvent extends ApplicationEvent {
    private final String username;
    private final LocalDateTime loginTime;
    
    public UserLoginEvent(Object source, String username) {
        super(source);
        this.username = username;
        this.loginTime = LocalDateTime.now();
    }
    
    public String getUsername() {
        return username;
    }
    
    public LocalDateTime getLoginTime() {
        return loginTime;
    }
}

// 3. 异步日志监听器
@Component
public class LoginLogListener {
    @Async
    @EventListener
    public void handleUserLogin(UserLoginEvent event) {
        System.out.println("开始记录登录日志，线程：" + Thread.currentThread().getName());
        
        // 模拟数据库操作
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("记录登录日志：" + event.getUsername() + 
                         " 登录时间：" + event.getLoginTime());
    }
}

// 4. 用户服务
@Service
public class UserService {
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    public void login(String username, String password) {
        // 验证密码（简化）
        System.out.println("验证用户密码");
        
        // 发布登录事件
        eventPublisher.publishEvent(new UserLoginEvent(this, username));
        
        System.out.println("登录成功，返回主页");
    }
}

// 5. 测试
@SpringBootTest
public class LoginTest {
    @Autowired
    private UserService userService;
    
    @Test
    public void testLogin() {
        System.out.println("主线程：" + Thread.currentThread().getName());
        
        userService.login("zhangsan", "123456");
        
        System.out.println("登录方法返回");
        
        // 等待异步任务完成
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 多事件协调

实现商品下单流程：
1. 发布订单创建事件
2. 监听器 1：扣减库存（同步）
3. 监听器 2：发送订单确认邮件（异步）
4. 监听器 3：记录订单日志（异步）
5. 使用 @Order 控制执行顺序

<details>
<summary>点击查看答案</summary>

```java
// 1. 配置异步
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setThreadNamePrefix("order-");
        executor.initialize();
        return executor;
    }
}

// 2. 订单创建事件
public class OrderPlacedEvent extends ApplicationEvent {
    private final Order order;
    
    public OrderPlacedEvent(Object source, Order order) {
        super(source);
        this.order = order;
    }
    
    public Order getOrder() {
        return order;
    }
}

// 3. 库存监听器（同步，优先级最高）
@Component
public class InventoryListener {
    @EventListener
    @Order(1)
    public void handleOrderPlaced(OrderPlacedEvent event) {
        Order order = event.getOrder();
        System.out.println("[" + Thread.currentThread().getName() + "] 扣减库存：" + 
                         order.getProductName() + " x " + order.getQuantity());
        
        // 模拟数据库操作
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("库存扣减完成");
    }
}

// 4. 邮件监听器（异步，第二优先级）
@Component
public class OrderEmailListener {
    @Async
    @EventListener
    @Order(2)
    public void handleOrderPlaced(OrderPlacedEvent event) {
        Order order = event.getOrder();
        System.out.println("[" + Thread.currentThread().getName() + "] 发送订单确认邮件");
        
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("邮件发送完成，订单号：" + order.getOrderNo());
    }
}

// 5. 日志监听器（异步，第三优先级）
@Component
public class OrderLogListener {
    @Async
    @EventListener
    @Order(3)
    public void handleOrderPlaced(OrderPlacedEvent event) {
        Order order = event.getOrder();
        System.out.println("[" + Thread.currentThread().getName() + "] 记录订单日志");
        
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("日志记录完成");
    }
}

// 6. 订单服务
@Service
public class OrderService {
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    public void placeOrder(Order order) {
        System.out.println("开始下单，订单号：" + order.getOrderNo());
        
        // 发布订单创建事件
        eventPublisher.publishEvent(new OrderPlacedEvent(this, order));
        
        System.out.println("下单流程完成");
    }
}

// 7. 测试
@SpringBootTest
public class OrderPlaceTest {
    @Autowired
    private OrderService orderService;
    
    @Test
    public void testPlaceOrder() {
        Order order = new Order();
        order.setOrderNo("ORD20240101001");
        order.setProductName("iPhone 15");
        order.setQuantity(1);
        
        orderService.placeOrder(order);
        
        // 等待异步任务完成
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Spring EL 表达式原理**——也就是 SpEL。你会学到：
- SpEL 的三种表达式类型
- ParserContext 解析流程
- 在 @Value 和 @If 中的使用
- 自定义函数与变量

 SpEL 是 Spring 中非常强大的表达式语言，掌握它能让你在配置和条件判断中更加灵活。我们下一章见！
