---
title: "第15章：消息队列实战应用"
description: "掌握异步解耦、削峰填谷、数据同步等常见应用场景"
---

# 第15章：消息队列实战应用

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 消息队列在实际项目中怎么用？
- 异步解耦具体怎么实现？
- 削峰填谷是怎么做到的？
- 数据同步场景怎么设计？

这一章通过真实场景案例，带你掌握消息队列的核心应用场景。

---

## 15.1 异步解耦

### 场景描述

用户注册后需要：发送欢迎邮件、初始化用户数据、发送短信通知。

**同步方式**（耦合度高，响应慢）：

```java
public void register(User user) {
    // 1. 保存用户
    userMapper.insert(user);
    // 2. 发送欢迎邮件（耗时500ms）
    emailService.sendWelcome(user.getEmail());
    // 3. 初始化用户数据（耗时300ms）
    userService.initUserData(user.getId());
    // 4. 发送短信通知（耗时200ms）
    smsService.sendNotification(user.getPhone());
    // 总耗时：1000ms+
}
```

**异步方式**（解耦，响应快）：

```java
// 注册服务
public void register(User user) {
    // 1. 保存用户（100ms）
    userMapper.insert(user);
    // 2. 发送注册事件到消息队列（10ms）
    rabbitTemplate.convertAndSend("user.exchange", "user.registered", user);
    // 总耗时：110ms
}

// 邮件消费者
@RabbitListener(queues = "email.queue")
public void sendWelcomeEmail(User user) {
    emailService.sendWelcome(user.getEmail());
}

// 数据初始化消费者
@RabbitListener(queues = "init.queue")
public void initUserData(User user) {
    userService.initUserData(user.getId());
}

// 短信消费者
@RabbitListener(queues = "sms.queue")
public void sendSms(User user) {
    smsService.sendNotification(user.getPhone());
}
```

### 解耦的好处

| 对比项 | 同步方式 | 异步方式 |
| --- | --- | --- |
| 响应时间 | 1000ms+ | 110ms |
| 系统耦合 | 注册服务依赖邮件、短信服务 | 通过消息队列解耦 |
| 故障影响 | 邮件服务挂了，注册也失败 | 邮件服务挂了，注册不受影响 |
| 扩展性 | 新增功能需要修改注册代码 | 新增消费者即可 |

---

## 15.2 削峰填谷

### 场景描述

电商秒杀活动，瞬间涌入大量请求：

```
秒杀开始：每秒10000个请求
数据库承受能力：每秒1000个请求
```

**不用消息队列**：数据库被打爆，系统崩溃。

**使用消息队列**：

```java
// 秒杀接口
@PostMapping("/seckill")
public Result seckill(@RequestParam Long userId, @RequestParam Long goodsId) {
    // 1. 快速校验（库存预检、用户是否已购买等）
    if (!seckillService.preCheck(userId, goodsId)) {
        return Result.error("抢购失败");
    }

    // 2. 将请求放入消息队列（1ms）
    SeckillRequest request = new SeckillRequest(userId, goodsId);
    rabbitTemplate.convertAndSend("seckill.exchange", "seckill.order", request);

    // 3. 立即返回"排队中"
    return Result.success("排队中，请稍后查看结果");
}

// 消费者：匀速处理（每秒处理1000个）
@RabbitListener(queues = "seckill.queue")
public void processSeckill(SeckillRequest request) {
    try {
        // 限流：控制处理速度
        Thread.sleep(1); // 每秒约1000个
        seckillService.doSeckill(request);
    } catch (Exception e) {
        log.error("秒杀处理失败", e);
    }
}
```

### 削峰填谷原理

```
请求量
  ^
  |    /\
  |   /  \     请求高峰
  |  /    \
  | /      \____________________
  |/                            \
  +-------------------------------> 时间
  |
  |  ----> 消息队列缓冲
  |
  |        _________________
  |       /                 \    匀速处理
  |______/                   \___
  +-------------------------------> 时间
```

- **削峰**：高峰期请求暂存在消息队列，不直接打到数据库
- **填谷**：低谷期消费者继续处理队列中的请求

---

## 15.3 数据同步

### 场景描述

系统中多个服务需要共享数据：
- 用户注册后，搜索服务需要索引用户信息
- 订单创建后，物流服务需要配送信息
- 商品更新后，缓存需要刷新

### 方案1：通过消息队列同步

```java
// 用户服务：用户信息变更时发送消息
@Service
public class UserService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void updateUser(User user) {
        userMapper.update(user);
        // 发送用户变更事件
        rabbitTemplate.convertAndSend("user.exchange", "user.updated", user);
    }
}

// 搜索服务：监听用户变更，更新索引
@RabbitListener(queues = "search.user.queue")
public void updateSearchIndex(User user) {
    elasticsearchService.updateUserIndex(user);
}

// 缓存服务：监听用户变更，刷新缓存
@RabbitListener(queues = "cache.user.queue")
public void updateCache(User user) {
    redisTemplate.opsForValue().set("user:" + user.getId(), JSON.toJSONString(user));
}
```

### 方案2：CDC（Change Data Capture）

使用 Kafka Connect 监听数据库变更，自动同步到 Kafka：

```
MySQL binlog --> Kafka Connect --> Kafka Topic --> 下游消费者
```

这种方式不需要修改业务代码，对业务透明。

---

## 15.4 消息驱动架构

### 事件驱动架构（EDA）

```java
// 定义领域事件
public class OrderCreatedEvent {
    private String orderId;
    private String userId;
    private BigDecimal amount;
    private LocalDateTime createTime;
}

// 订单服务：发布事件
@Service
public class OrderService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public Order createOrder(OrderRequest request) {
        Order order = new Order(request);
        orderMapper.insert(order);

        // 发布领域事件
        OrderCreatedEvent event = new OrderCreatedEvent(
            order.getId(), order.getUserId(), order.getAmount(), order.getCreateTime()
        );
        rabbitTemplate.convertAndSend("order.exchange", "order.created", event);

        return order;
    }
}

// 库存服务：消费事件
@RabbitListener(queues = "inventory.queue")
public void onOrderCreated(OrderCreatedEvent event) {
    inventoryService.deductStock(event.getOrderId());
}

// 积分服务：消费事件
@RabbitListener(queues = "point.queue")
public void onOrderCreated(OrderCreatedEvent event) {
    pointService.addPoints(event.getUserId(), event.getAmount());
}

// 通知服务：消费事件
@RabbitListener(queues = "notification.queue")
public void onOrderCreated(OrderCreatedEvent event) {
    notificationService.sendOrderConfirmation(event.getOrderId());
}
```

---

## 15.5 可靠消息最终一致性

### 场景描述

分布式系统中，订单服务和库存服务需要保证数据一致性。

### 本地消息表方案

```java
@Service
public class OrderService {

    @Autowired
    private OrderMapper orderMapper;
    @Autowired
    private MessageLogMapper messageLogMapper;
    @Autowired
    private RabbitTemplate rabbitTemplate;
    @Autowired
    private TransactionTemplate transactionTemplate;

    public void createOrder(OrderRequest request) {
        // 1. 本地事务：创建订单 + 写入消息日志
        transactionTemplate.execute(status -> {
            // 创建订单
            Order order = new Order(request);
            orderMapper.insert(order);

            // 写入消息日志（状态：待发送）
            MessageLog log = new MessageLog();
            log.setMessageId(UUID.randomUUID().toString());
            log.setEventType("ORDER_CREATED");
            log.setPayload(JSON.toJSONString(order));
            log.setStatus("PENDING");
            messageLogMapper.insert(log);

            return null;
        });

        // 2. 异步发送消息
        asyncSend();
    }

    // 定时任务：重试发送失败的消息
    @Scheduled(fixedDelay = 5000)
    public void retrySend() {
        List<MessageLog> pendingLogs = messageLogMapper.findByStatus("PENDING");
        for (MessageLog log : pendingLogs) {
            try {
                rabbitTemplate.convertAndSend("order.exchange", "order.created", log.getPayload());
                log.setStatus("SENT");
                messageLogMapper.update(log);
            } catch (Exception e) {
                log.setRetryCount(log.getRetryCount() + 1);
                if (log.getRetryCount() >= 3) {
                    log.setStatus("FAILED");
                }
                messageLogMapper.update(log);
            }
        }
    }
}
```

---

## 15.6 核心知识点总结

| 应用场景 | 说明 | 关键实现 |
| --- | --- | --- |
| 异步解耦 | 非核心流程异步化 | 发布事件，多个消费者独立处理 |
| 削峰填谷 | 缓冲高峰请求 | 消息队列暂存，消费者匀速处理 |
| 数据同步 | 多系统数据一致性 | 发布变更事件，下游系统订阅 |
| 事件驱动 | 松耦合的架构模式 | 领域事件 + 消息队列 |
| 最终一致性 | 分布式事务 | 本地消息表 + 重试机制 |

---

## 15.7 新手常见误区

### 误区 1："用了消息队列系统就一定快"

**错！** 消息队列解决的是响应时间问题（通过异步），不是整体处理时间。如果瓶颈在数据库，加消息队列也没用。

### 误区 2："消息队列可以替代数据库"

不是的。消息队列是传递消息的中间件，不是持久化存储。重要数据还是要存数据库，消息队列只是帮你异步处理。

### 误区 3："所有系统间通信都应该用消息队列"

不是的。如果需要实时响应（如查询接口），应该用 RPC 或 HTTP。消息队列适合异步、不需要立即返回结果的场景。

### 误区 4："消息队列保证数据一致性"

不是的。消息队列只保证消息的可靠传递，不保证业务一致性。分布式事务需要配合本地消息表、事务消息等机制实现。

---

## 15.8 动手练习

### 练习 1：基础练习

实现一个"用户注册异步通知"功能：注册后异步发送邮件和短信。

<details>
<summary>点击查看答案</summary>

```java
// 配置类
@Configuration
public class NotifyConfig {

    @Bean
    public FanoutExchange notifyExchange() {
        return new FanoutExchange("user.notify.exchange");
    }

    @Bean
    public Queue emailQueue() {
        return QueueBuilder.durable("user.email.queue").build();
    }

    @Bean
    public Queue smsQueue() {
        return QueueBuilder.durable("user.sms.queue").build();
    }

    @Bean
    public Binding emailBinding() {
        return BindingBuilder.bind(emailQueue()).to(notifyExchange());
    }

    @Bean
    public Binding smsBinding() {
        return BindingBuilder.bind(smsQueue()).to(notifyExchange());
    }
}

// 注册服务
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void register(User user) {
        // 1. 保存用户
        userMapper.insert(user);
        // 2. 广播注册事件
        rabbitTemplate.convertAndSend("user.notify.exchange", "", user);
    }
}

// 邮件消费者
@Component
public class EmailConsumer {

    @RabbitListener(queues = "user.email.queue")
    public void sendEmail(User user) {
        System.out.println("发送欢迎邮件到: " + user.getEmail());
    }
}

// 短信消费者
@Component
public class SmsConsumer {

    @RabbitListener(queues = "user.sms.queue")
    public void sendSms(User user) {
        System.out.println("发送注册通知短信到: " + user.getPhone());
    }
}
```

</details>

### 练习 2：进阶练习

实现一个"秒杀削峰"系统：请求进入消息队列，消费者匀速处理。

<details>
<summary>点击查看答案</summary>

```java
// 秒杀请求
public class SeckillRequest {
    private Long userId;
    private Long goodsId;
    private LocalDateTime requestTime;
}

// 秒杀接口
@RestController
public class SeckillController {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @PostMapping("/seckill")
    public Result seckill(@RequestBody SeckillRequest request) {
        request.setRequestTime(LocalDateTime.now());
        // 放入消息队列
        rabbitTemplate.convertAndSend("seckill.exchange", "seckill.order", request);
        return Result.success("排队中");
    }
}

// 消费者：限流处理
@Component
public class SeckillConsumer {

    @Autowired
    private SeckillService seckillService;

    @RabbitListener(queues = "seckill.queue")
    public void process(SeckillRequest request) {
        try {
            // 限流：每秒处理100个
            Thread.sleep(10);
            seckillService.doSeckill(request);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

</details>

### 练习 3（挑战）：综合练习

实现一个"本地消息表"方案，保证订单创建和消息发送的最终一致性。

<details>
<summary>点击查看答案</summary>

```java
// 消息日志实体
@Entity
@Table(name = "message_log")
public class MessageLog {
    @Id
    private String messageId;
    private String eventType;
    @Lob
    private String payload;
    private String status; // PENDING, SENT, FAILED
    private Integer retryCount = 0;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}

// 订单服务
@Service
public class OrderService {

    @Autowired
    private OrderMapper orderMapper;
    @Autowired
    private MessageLogMapper messageLogMapper;
    @Autowired
    private RabbitTemplate rabbitTemplate;
    @Autowired
    private PlatformTransactionManager transactionManager;

    public void createOrder(OrderRequest request) {
        // 1. 本地事务
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        TransactionStatus status = transactionManager.getTransaction(def);
        try {
            // 创建订单
            Order order = new Order(request);
            orderMapper.insert(order);

            // 写入消息日志
            MessageLog log = new MessageLog();
            log.setMessageId(UUID.randomUUID().toString());
            log.setEventType("ORDER_CREATED");
            log.setPayload(JSON.toJSONString(order));
            log.setStatus("PENDING");
            log.setCreateTime(LocalDateTime.now());
            messageLogMapper.insert(log);

            transactionManager.commit(status);
        } catch (Exception e) {
            transactionManager.rollback(status);
            throw e;
        }

        // 2. 异步发送消息
        sendAsync();
    }

    private void sendAsync() {
        List<MessageLog> pendingLogs = messageLogMapper.findByStatus("PENDING");
        for (MessageLog log : pendingLogs) {
            try {
                rabbitTemplate.convertAndSend("order.exchange", "order.created", log.getPayload());
                log.setStatus("SENT");
                log.setUpdateTime(LocalDateTime.now());
                messageLogMapper.update(log);
            } catch (Exception e) {
                log.setRetryCount(log.getRetryCount() + 1);
                if (log.getRetryCount() >= 3) {
                    log.setStatus("FAILED");
                }
                log.setUpdateTime(LocalDateTime.now());
                messageLogMapper.update(log);
            }
        }
    }

    // 定时重试
    @Scheduled(fixedDelay = 5000)
    public void retryFailed() {
        sendAsync();
    }
}
```

</details>

---

## 下一章预告

下一章是教程的最后一章，我们会做一个 **综合项目实战**——将前面学到的知识应用到一个完整的项目中，包括订单系统消息化改造和监控告警系统。
