---
title: "第11章：消息幂等性与重复消费"
description: "学习如何保证消息不重复处理，掌握幂等性设计和分布式事务消息"
---

# 第11章：消息幂等性与重复消费

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么同一条消息可能被消费多次？
- 什么是幂等性？为什么消息消费需要幂等性？
- 如何防止消息重复消费？有哪些去重方案？
- 分布式系统中如何保证事务的一致性？

这一章会把这些问题的答案都告诉你。我们会先搞清楚 **消息重复消费的原因**，再学会用 **唯一ID、数据库锁、Redis锁** 三种方案实现幂等性，最后了解分布式事务消息的基本概念。

---

## 1 为什么需要幂等性？

### 痛点分析

想象这样一个场景：用户在电商平台下单，订单服务发送一条"创建订单"的消息到 RabbitMQ。库存服务消费这条消息，扣减商品库存。

正常情况下，一切顺利。但有时候会出现这种情况：

```
生产者发送消息: 订单1001，扣减库存10件
    ↓
消费者收到消息，开始处理
    ↓
处理到一半，网络抖动，消费者没有发送 ACK
    ↓
RabbitMQ 以为消息没被消费，重新投递给另一个消费者
    ↓
第二个消费者又收到同一条消息，又扣减了10件库存
    ↓
结果：库存被扣减了20件，而不是10件！
```

这就是 **消息重复消费** 问题。

打个比方：

> 你去银行转账，转了100块钱。如果因为网络问题，银行系统把这笔交易执行了两次，你的账户就被扣了200块。这肯定不行。所以银行系统必须保证：同一笔转账，不管执行多少次，效果都是一样的（只扣100块）。这种特性就叫"幂等性"。

### 什么是幂等性？

**幂等性（Idempotency）** 是数学和计算机科学中的一个概念，意思是：**同一个操作，执行一次和执行多次，结果是一样的**。

```
幂等操作：
- 第一次执行：库存从100减到90
- 第二次执行：库存还是90（不会继续减）
- 第N次执行：库存还是90

非幂等操作：
- 第一次执行：库存从100减到90
- 第二次执行：库存从90减到80
- 第N次执行：库存继续减少
```

在消息队列中，**幂等性** 指的是：**同一条消息被消费多次，业务结果和只消费一次是一样的**。

### 消息重复消费的原因

| 原因 | 说明 | 举例 |
| --- | --- | --- |
| 网络抖动 | 消费者处理完消息，但 ACK 丢失 | 消费者处理完消息，发送 ACK 时网络断开 |
| 消费者重启 | 消费者处理到一半崩溃，消息重新投递 | 服务宕机，消息还没处理完 |
| 生产者重复发送 | 生产者发送消息时出错，重试发送 | 网络超时，生产者以为消息没发出去 |
| RabbitMQ 重投递 | RabbitMQ 长时间没收到 ACK，重新投递 | 消费者处理太慢，超过 ACK 超时时间 |

> **一句话总结**：消息重复消费是分布式系统的常态，无法完全避免。我们只能通过 **幂等性设计** 来保证：即使消息重复消费，业务结果也不会出错。

---

## 2 核心原理讲解

### 幂等性设计的核心思路

幂等性设计的核心是：**给每条消息一个唯一标识，消费前先检查是否已经处理过**。

```
消费者收到消息
    ↓
检查消息ID是否已处理（查询数据库/Redis）
    ↓
如果已处理 → 直接返回（不重复处理）
    ↓
如果未处理 → 执行业务逻辑 → 标记消息为已处理
```

打个比方：

> 快递签收：快递员送快递时，你会先检查快递单号，看看这个快递是不是已经签收了。如果已经签收了，就不会再签一次。幂等性就是这个"检查快递单号"的过程。

### 常见的幂等性实现方案

| 方案 | 原理 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| 唯一ID + 数据库 | 用消息ID作为唯一键，插入数据库时去重 | 简单可靠 | 依赖数据库 | 订单创建、支付回调 |
| 数据库乐观锁 | 用版本号控制，每次更新检查版本号 | 实现简单 | 高并发下性能差 | 库存扣减、余额变更 |
| Redis 分布式锁 | 用 Redis SETNX 实现分布式锁 | 高性能 | 需要 Redis | 高并发场景 |
| 状态机 | 业务状态只能单向流转 | 逻辑清晰 | 状态设计复杂 | 订单状态流转 |

---

## 3 基础用法

### 11.3.1 方案一：唯一ID + 数据库去重

这是最简单、最常用的方案。

```java
// 1. 数据库表设计：创建消息消费记录表
// CREATE TABLE message_consume_log (
//     message_id VARCHAR(64) PRIMARY KEY,  -- 消息唯一ID
//     consume_status TINYINT DEFAULT 0,    -- 消费状态：0-处理中，1-成功，2-失败
//     create_time DATETIME DEFAULT NOW(),  -- 创建时间
//     update_time DATETIME DEFAULT NOW()   -- 更新时间
// );

// 2. 实体类
public class MessageConsumeLog {
    private String messageId;      // 消息ID
    private Integer consumeStatus; // 消费状态
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    // getter/setter 省略
}

// 3. 生产者：发送消息时带上唯一ID
@Service
public class OrderProducer {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendOrderMessage(Order order) {
        // 生成唯一消息ID
        String messageId = UUID.randomUUID().toString();

        // 创建消息对象
        Message message = MessageBuilder.withPayload(order)
                .setHeader("messageId", messageId)  // 设置消息ID
                .build();

        // 发送消息
        rabbitTemplate.send("order.exchange", "order.create", message);
        System.out.println("发送消息, messageId=" + messageId);
    }
}

// 4. 消费者：消费前先检查消息是否已处理
@Service
public class OrderConsumer {
    @Autowired
    private MessageConsumeLogMapper logMapper;

    @Autowired
    private OrderMapper orderMapper;

    @RabbitListener(queues = "order.queue")
    public void handleOrder(Message message, Channel channel) throws Exception {
        // 1. 获取消息ID
        String messageId = message.getMessageProperties().getMessageId();
        if (messageId == null || messageId.isEmpty()) {
            log.error("消息ID为空，无法处理");
            return;
        }

        // 2. 检查消息是否已处理（利用数据库唯一键去重）
        try {
            // 插入消费记录，如果 messageId 已存在会抛出 DuplicateKeyException
            MessageConsumeLog log = new MessageConsumeLog();
            log.setMessageId(messageId);
            log.setConsumeStatus(0); // 处理中
            logMapper.insert(log);
        } catch (DuplicateKeyException e) {
            // 消息已处理，直接返回
            System.out.println("消息已处理，跳过: " + messageId);
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
            return;
        }

        // 3. 执行业务逻辑
        try {
            Order order = (Order) message.getPayload();
            // 保存订单
            orderMapper.save(order);
            System.out.println("订单保存成功: " + order.getId());

            // 4. 更新消费记录为成功
            logMapper.updateStatus(messageId, 1); // 1=成功

            // 5. 手动 ACK
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        } catch (Exception e) {
            // 业务处理失败，更新消费记录为失败
            logMapper.updateStatus(messageId, 2); // 2=失败
            log.error("消息处理失败: " + messageId, e);
            // 不 ACK，让消息重新投递
            channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, true);
        }
    }
}
```

### 11.3.2 方案二：数据库乐观锁

适用于有版本号字段的场景，比如库存扣减。

```java
// 1. 数据库表设计：商品表带版本号
// CREATE TABLE product (
//     id BIGINT PRIMARY KEY,
//     name VARCHAR(100),
//     stock INT,              -- 库存
//     version INT DEFAULT 0   -- 版本号
// );

// 2. 实体类
public class Product {
    private Long id;
    private String name;
    private Integer stock;
    private Integer version;  // 版本号

    // getter/setter 省略
}

// 3. Mapper：更新时检查版本号
@Mapper
public interface ProductMapper {
    // 更新库存，同时检查版本号
    @Update("UPDATE product SET stock = stock - #{quantity}, version = version + 1 " +
            "WHERE id = #{productId} AND version = #{version}")
    int deductStock(@Param("productId") Long productId,
                    @Param("quantity") Integer quantity,
                    @Param("version") Integer version);
}

// 4. 消费者：使用乐观锁扣减库存
@Service
public class StockConsumer {
    @Autowired
    private ProductMapper productMapper;

    @RabbitListener(queues = "stock.queue")
    public void deductStock(Message message, Channel channel) throws Exception {
        StockMessage stockMsg = (StockMessage) message.getPayload();
        Long productId = stockMsg.getProductId();
        Integer quantity = stockMsg.getQuantity();

        // 1. 查询当前商品信息和版本号
        Product product = productMapper.findById(productId);
        if (product == null) {
            log.error("商品不存在: " + productId);
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
            return;
        }

        // 2. 使用乐观锁扣减库存
        int rows = productMapper.deductStock(productId, quantity, product.getVersion());

        if (rows > 0) {
            // 扣减成功
            System.out.println("库存扣减成功: productId=" + productId + ", quantity=" + quantity);
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        } else {
            // 扣减失败（版本号不匹配，说明已被其他线程修改）
            System.out.println("库存扣减失败，版本号冲突: productId=" + productId);
            // 可以选择重试或丢弃
            channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, false);
        }
    }
}
```

### 11.3.3 方案三：Redis 分布式锁

适用于高并发场景，性能比数据库方案更好。

```java
// 1. 配置 Redis
// application.yml
// spring:
//   redis:
//     host: localhost
//     port: 6379

// 2. 消费者：使用 Redis 分布式锁实现幂等性
@Service
public class PaymentConsumer {
    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private PaymentMapper paymentMapper;

    // Redis 锁的过期时间（秒）
    private static final int LOCK_EXPIRE_TIME = 10;

    @RabbitListener(queues = "payment.queue")
    public void handlePayment(Message message, Channel channel) throws Exception {
        Payment payment = (Payment) message.getPayload();
        String paymentId = payment.getPaymentId();

        // 1. 尝试获取 Redis 分布式锁
        String lockKey = "payment:lock:" + paymentId;
        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "1", LOCK_EXPIRE_TIME, TimeUnit.SECONDS);

        if (locked == null || !locked) {
            // 获取锁失败，说明消息正在被其他消费者处理
            System.out.println("消息正在处理中，跳过: " + paymentId);
            // 不 ACK，让消息稍后重试
            channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, true);
            return;
        }

        try {
            // 2. 检查消息是否已处理（幂等性检查）
            String processedKey = "payment:processed:" + paymentId;
            String processed = redisTemplate.opsForValue().get(processedKey);

            if ("1".equals(processed)) {
                // 消息已处理
                System.out.println("消息已处理，跳过: " + paymentId);
                channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
                return;
            }

            // 3. 执行业务逻辑
            paymentMapper.save(payment);
            System.out.println("支付记录保存成功: " + paymentId);

            // 4. 标记消息为已处理
            redisTemplate.opsForValue().set(processedKey, "1", 24, TimeUnit.HOURS);

            // 5. 手动 ACK
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        } catch (Exception e) {
            log.error("消息处理失败: " + paymentId, e);
            channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, true);
        } finally {
            // 6. 释放锁
            redisTemplate.delete(lockKey);
        }
    }
}
```

---

## 4 分布式事务消息

### 什么是分布式事务？

在微服务架构中，一个业务操作可能涉及多个服务。比如电商下单：

1. 订单服务：创建订单
2. 库存服务：扣减库存
3. 积分服务：增加积分
4. 通知服务：发送短信

这些服务可能部署在不同的机器上，使用不同的数据库。如何保证这些操作要么全部成功，要么全部失败？这就是 **分布式事务** 问题。

### 基于消息队列的最终一致性

完全一致的分布式事务（如 2PC、3PC）性能很差。实际项目中，通常采用 **基于消息队列的最终一致性** 方案。

核心思路：

```
1. 订单服务：创建订单（本地事务）
2. 订单服务：发送"订单创建成功"消息到 MQ
3. 库存服务：消费消息，扣减库存（本地事务）
4. 积分服务：消费消息，增加积分（本地事务）
5. 通知服务：消费消息，发送短信（本地事务）

如果某个服务处理失败，消息会重新投递，直到成功
最终所有服务的数据会达到一致状态
```

### 可靠消息最终一致性方案

```java
// 1. 订单服务：发送可靠消息
@Service
public class OrderService {
    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private MessageMapper messageMapper;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Transactional
    public void createOrder(Order order) {
        // 1. 创建订单（本地事务）
        orderMapper.save(order);

        // 2. 保存消息到本地消息表（本地事务）
        Message msg = new Message();
        msg.setMessageId(UUID.randomUUID().toString());
        msg.setPayload(JSON.toJSONString(order));
        msg.setStatus("PENDING"); // 待发送
        messageMapper.save(msg);

        // 3. 发送消息到 MQ
        try {
            rabbitTemplate.send("order.exchange", "order.create",
                    new StringMessage(msg.getPayload()));
            msg.setStatus("SENT"); // 已发送
            messageMapper.update(msg);
        } catch (Exception e) {
            // 发送失败，消息状态保持 PENDING
            // 后续由定时任务重试发送
            log.error("消息发送失败: " + msg.getMessageId(), e);
        }
    }
}

// 2. 定时任务：重试发送失败的消息
@Scheduled(fixedRate = 5000) // 每5秒执行一次
public void retrySendMessage() {
    // 查询状态为 PENDING 且创建时间超过1分钟的消息
    List<Message> messages = messageMapper.findPendingMessages();

    for (Message msg : messages) {
        try {
            rabbitTemplate.send("order.exchange", "order.create",
                    new StringMessage(msg.getPayload()));
            msg.setStatus("SENT");
            messageMapper.update(msg);
        } catch (Exception e) {
            log.error("消息重试发送失败: " + msg.getMessageId(), e);
        }
    }
}
```

---

## 5 对比表格

### 幂等性方案对比

| 方案 | 实现方式 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| 唯一ID + 数据库 | 消息ID作为唯一键 | 简单可靠 | 依赖数据库 | 订单创建、支付回调 |
| 数据库乐观锁 | 版本号控制 | 实现简单 | 高并发性能差 | 库存扣减、余额变更 |
| Redis 分布式锁 | SETNX 实现锁 | 高性能 | 需要 Redis | 高并发场景 |
| 状态机 | 业务状态单向流转 | 逻辑清晰 | 状态设计复杂 | 订单状态流转 |
| 数据库唯一索引 | 业务字段唯一索引 | 简单 | 字段限制 | 用户名注册等 |

### 分布式事务方案对比

| 方案 | 原理 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| 2PC（两阶段提交） | 协调者统一控制 | 强一致性 | 性能差、单点故障 | 传统企业应用 |
| 3PC（三阶段提交） | 改进的2PC | 减少阻塞 | 复杂度高 | 很少使用 |
| TCC（Try-Confirm-Cancel） | 业务层面实现 | 性能好 | 开发复杂 | 金融交易 |
| 可靠消息最终一致性 | 消息队列 + 本地消息表 | 性能好、解耦 | 最终一致性 | 电商、互联网应用 |
| Saga | 长事务拆分 | 灵活 | 补偿逻辑复杂 | 微服务架构 |

---

## 6 新手常见误区

### 误区 1："消息队列能保证消息不重复"

**错！** 消息队列只能保证消息的可靠投递（At Least Once），但不能保证不重复。RabbitMQ 在网络抖动、消费者重启等情况下，可能会重复投递消息。幂等性必须由消费者自己实现。

### 误区 2："用了自动 ACK 就不会重复消费了"

不是的。自动 ACK（autoAck=true）是指消息一旦被消费者接收，就立即标记为已消费。但如果在接收消息后、处理业务逻辑前，消费者崩溃了，消息就会丢失。而且自动 ACK 不能防止 RabbitMQ 重投递未确认的消息。手动 ACK + 幂等性设计才是正确的做法。

### 误区 3："数据库事务可以保证幂等性"

不完全是。数据库事务只能保证单个数据库操作的原子性，但不能防止同一条消息被多次处理。比如：

```
第一次消费：开启事务 → 扣减库存 → 提交事务
第二次消费：开启事务 → 扣减库存 → 提交事务

两次都会成功，库存被扣减了两次
```

必须在业务层面实现幂等性检查（如唯一ID去重、乐观锁等）。

### 误区 4："Redis 分布式锁不会过期"

不是的。Redis 锁必须设置过期时间，否则如果消费者崩溃，锁永远不会释放。但过期时间设置太短，业务还没处理完锁就过期了，其他消费者又会获取锁。解决方案：使用 Redisson 的看门狗机制自动续期，或者在业务处理完成后主动释放锁。

### 误区 5："分布式事务必须用 2PC 或 TCC"

不是的。对于大部分互联网应用，强一致性（2PC、TCC）的性能代价太高。通常采用 **最终一致性** 方案：通过消息队列 + 本地消息表 + 重试机制，保证数据最终一致。这种方式性能好、解耦强，适合大部分业务场景。

---

## 7 动手练习

### 练习 1：基础练习

使用"唯一ID + 数据库"方案实现幂等性：
1. 创建消息消费记录表 message_consume_log
2. 生产者发送消息时带上唯一 messageId
3. 消费者在执行业务逻辑前，先插入消息记录，利用唯一键去重

<details>
<summary>点击查看答案</summary>

```java
// 1. 数据库表
// CREATE TABLE message_consume_log (
//     message_id VARCHAR(64) PRIMARY KEY,
//     status TINYINT DEFAULT 0,
//     create_time DATETIME DEFAULT NOW()
// );

// 2. 实体类
public class MessageConsumeLog {
    private String messageId;
    private Integer status;
    private LocalDateTime createTime;
    // getter/setter 省略
}

// 3. 生产者
@Service
public class TestProducer {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendMessage(String content) {
        String messageId = UUID.randomUUID().toString();
        Message message = MessageBuilder.withPayload(content)
                .setHeader("messageId", messageId)
                .build();
        rabbitTemplate.send("test.exchange", "test.key", message);
    }
}

// 4. 消费者
@Service
public class TestConsumer {
    @Autowired
    private MessageConsumeLogMapper logMapper;

    @RabbitListener(queues = "test.queue")
    public void handle(Message message, Channel channel) throws Exception {
        String messageId = message.getMessageProperties().getMessageId();
        String content = new String(message.getBody());

        // 1. 尝试插入消息记录
        try {
            MessageConsumeLog log = new MessageConsumeLog();
            log.setMessageId(messageId);
            log.setStatus(0);
            logMapper.insert(log);
        } catch (DuplicateKeyException e) {
            // 消息已处理，跳过
            System.out.println("消息已处理: " + messageId);
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
            return;
        }

        // 2. 执行业务逻辑
        System.out.println("处理消息: " + content);

        // 3. 更新状态为成功
        logMapper.updateStatus(messageId, 1);

        // 4. ACK
        channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
    }
}
```

</details>

### 练习 2：进阶练习

使用 Redis 分布式锁实现幂等性：
1. 消费者收到消息后，先用 Redis SETNX 获取锁
2. 获取锁成功后，检查消息是否已处理
3. 处理完成后，标记消息为已处理，释放锁

<details>
<summary>点击查看答案</summary>

```java
@Service
public class RedisIdempotentConsumer {
    @Autowired
    private StringRedisTemplate redisTemplate;

    @RabbitListener(queues = "test.queue")
    public void handle(Message message, Channel channel) throws Exception {
        String messageId = message.getMessageProperties().getMessageId();
        String content = new String(message.getBody());

        // 1. 获取分布式锁
        String lockKey = "lock:" + messageId;
        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);

        if (locked == null || !locked) {
            // 获取锁失败，消息正在被处理
            channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, true);
            return;
        }

        try {
            // 2. 检查是否已处理
            String processedKey = "processed:" + messageId;
            if ("1".equals(redisTemplate.opsForValue().get(processedKey))) {
                System.out.println("消息已处理: " + messageId);
                channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
                return;
            }

            // 3. 执行业务逻辑
            System.out.println("处理消息: " + content);

            // 4. 标记为已处理
            redisTemplate.opsForValue().set(processedKey, "1", 24, TimeUnit.HOURS);

            // 5. ACK
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        } finally {
            // 6. 释放锁
            redisTemplate.delete(lockKey);
        }
    }
}
```

</details>

### 练习 3（挑战）：综合练习

实现一个可靠的订单创建系统：
1. 订单服务创建订单，同时保存消息到本地消息表
2. 发送消息到 RabbitMQ
3. 如果发送失败，定时任务重试发送
4. 库存服务消费消息，扣减库存，使用数据库乐观锁保证幂等性

<details>
<summary>点击查看答案</summary>

```java
// 1. 订单服务
@Service
public class OrderService {
    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private MessageMapper messageMapper;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Transactional
    public void createOrder(Order order) {
        // 1. 创建订单
        orderMapper.save(order);

        // 2. 保存消息到本地消息表
        Message msg = new Message();
        msg.setMessageId(UUID.randomUUID().toString());
        msg.setPayload(JSON.toJSONString(order));
        msg.setStatus("PENDING");
        messageMapper.save(msg);

        // 3. 发送消息
        try {
            rabbitTemplate.send("order.exchange", "order.create",
                    new StringMessage(msg.getPayload()));
            msg.setStatus("SENT");
            messageMapper.update(msg);
        } catch (Exception e) {
            log.error("消息发送失败", e);
        }
    }
}

// 2. 定时任务：重试发送
@Scheduled(fixedRate = 5000)
public void retrySend() {
    List<Message> messages = messageMapper.findPendingMessages();
    for (Message msg : messages) {
        try {
            rabbitTemplate.send("order.exchange", "order.create",
                    new StringMessage(msg.getPayload()));
            msg.setStatus("SENT");
            messageMapper.update(msg);
        } catch (Exception e) {
            log.error("重试失败", e);
        }
    }
}

// 3. 库存服务：使用乐观锁
@Service
public class StockConsumer {
    @Autowired
    private ProductMapper productMapper;

    @RabbitListener(queues = "stock.queue")
    public void deductStock(Message message, Channel channel) throws Exception {
        Order order = JSON.parseObject(new String(message.getBody()), Order.class);

        // 查询商品
        Product product = productMapper.findById(order.getProductId());
        if (product == null) {
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
            return;
        }

        // 乐观锁扣减库存
        int rows = productMapper.deductStock(
                product.getId(), order.getQuantity(), product.getVersion());

        if (rows > 0) {
            System.out.println("库存扣减成功");
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        } else {
            System.out.println("库存扣减失败，版本号冲突");
            channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, false);
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **RabbitMQ 集群与高可用** -- 如何搭建 RabbitMQ 集群？普通集群和镜像集群有什么区别？什么是 Quorum 队列？如何配置负载均衡和故障转移？学完这一章，你就能搭建生产环境的高可用 RabbitMQ 集群了。
