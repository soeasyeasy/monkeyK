---
title: "第16章：综合项目实战"
description: "订单系统消息化改造与监控告警系统实战"
---

# 第16章：综合项目实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 消息队列在真实项目中怎么落地？
- 一个完整的消息驱动系统长什么样？
- 怎么处理消息丢失、重复消费等问题？
- 怎么监控消息队列的运行状态？

这一章通过两个实战项目，带你综合运用前面学到的所有知识。

---

## 1 项目一：订单系统消息化改造

### 项目背景

一个电商系统，订单创建后需要：
1. 扣减库存
2. 发送订单确认短信
3. 增加用户积分
4. 通知物流服务准备发货
5. 30分钟未支付自动取消

### 架构设计

```
订单服务 --> [order.exchange (topic)]
                |
                ├── order.inventory.queue --> 库存服务（扣减库存）
                ├── order.sms.queue       --> 短信服务（发送通知）
                ├── order.point.queue     --> 积分服务（增加积分）
                ├── order.logistics.queue --> 物流服务（准备发货）
                └── order.timeout.queue   --> 超时服务（30分钟后取消）
```

### 1. 定义消息结构

```java
// 订单事件消息
public class OrderEvent {
    private String eventId;        // 事件ID（全局唯一）
    private String eventType;      // 事件类型
    private String orderId;        // 订单ID
    private OrderData data;        // 订单数据
    private Long timestamp;        // 时间戳
    private String source;         // 来源服务
}

// 事件类型枚举
public enum EventType {
    ORDER_CREATED,      // 订单创建
    ORDER_PAID,         // 订单支付
    ORDER_CANCELLED,    // 订单取消
    ORDER_SHIPPED       // 订单发货
}
```

### 2. 配置交换机和队列

```java
@Configuration
public class OrderMQConfig {

    // Topic 交换机
    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange("order.exchange");
    }

    // 库存队列
    @Bean
    public Queue inventoryQueue() {
        return QueueBuilder.durable("order.inventory.queue").build();
    }

    // 短信队列
    @Bean
    public Queue smsQueue() {
        return QueueBuilder.durable("order.sms.queue").build();
    }

    // 积分队列
    @Bean
    public Queue pointQueue() {
        return QueueBuilder.durable("order.point.queue").build();
    }

    // 物流队列
    @Bean
    public Queue logisticsQueue() {
        return QueueBuilder.durable("order.logistics.queue").build();
    }

    // 超时队列（配置死信）
    @Bean
    public Queue timeoutQueue() {
        return QueueBuilder.durable("order.timeout.queue")
            .withArgument("x-dead-letter-exchange", "order.timeout.dlx")
            .withArgument("x-message-ttl", 1800000) // 30分钟
            .build();
    }

    // 绑定队列
    @Bean
    public Binding inventoryBinding() {
        return BindingBuilder.bind(inventoryQueue())
            .to(orderExchange()).with("order.created");
    }

    @Bean
    public Binding smsBinding() {
        return BindingBuilder.bind(smsQueue())
            .to(orderExchange()).with("order.created");
    }

    @Bean
    public Binding pointBinding() {
        return BindingBuilder.bind(pointQueue())
            .to(orderExchange()).with("order.created");
    }

    @Bean
    public Binding logisticsBinding() {
        return BindingBuilder.bind(logisticsQueue())
            .to(orderExchange()).with("order.paid");
    }

    @Bean
    public Binding timeoutBinding() {
        return BindingBuilder.bind(timeoutQueue())
            .to(orderExchange()).with("order.created");
    }
}
```

### 3. 订单服务：发布事件

```java
@Service
public class OrderService {

    @Autowired
    private OrderMapper orderMapper;
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Transactional
    public Order createOrder(OrderRequest request) {
        // 1. 创建订单
        Order order = new Order();
        order.setOrderId(generateOrderId());
        order.setUserId(request.getUserId());
        order.setAmount(request.getAmount());
        order.setStatus("PENDING_PAYMENT");
        order.setCreateTime(LocalDateTime.now());
        orderMapper.insert(order);

        // 2. 构建事件消息
        OrderEvent event = new OrderEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventType("ORDER_CREATED");
        event.setOrderId(order.getOrderId());
        event.setData(new OrderData(order));
        event.setTimestamp(System.currentTimeMillis());
        event.setSource("order-service");

        // 3. 发送事件
        rabbitTemplate.convertAndSend("order.exchange", "order.created", event);

        return order;
    }
}
```

### 4. 各服务消费事件

```java
// 库存服务
@Component
public class InventoryConsumer {

    @Autowired
    private InventoryService inventoryService;
    @Autowired
    private StringRedisTemplate redisTemplate;

    @RabbitListener(queues = "order.inventory.queue")
    public void onOrderCreated(OrderEvent event, Channel channel,
                               @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        String eventId = event.getEventId();
        String key = "mq:processed:" + eventId;

        try {
            // 幂等性检查
            Boolean isNew = redisTemplate.opsForValue()
                .setIfAbsent(key, "1", 24, TimeUnit.HOURS);

            if (Boolean.FALSE.equals(isNew)) {
                System.out.println("重复事件，跳过: " + eventId);
                channel.basicAck(deliveryTag, false);
                return;
            }

            // 扣减库存
            inventoryService.deductStock(event.getData());
            channel.basicAck(deliveryTag, false);

        } catch (Exception e) {
            redisTemplate.delete(key);
            channel.basicNack(deliveryTag, false, true);
        }
    }
}

// 短信服务
@Component
public class SmsConsumer {

    @RabbitListener(queues = "order.sms.queue")
    public void onOrderCreated(OrderEvent event) {
        String phone = event.getData().getUserPhone();
        String orderId = event.getOrderId();
        System.out.println("发送订单确认短信: " + phone + ", 订单号: " + orderId);
    }
}

// 积分服务
@Component
public class PointConsumer {

    @RabbitListener(queues = "order.point.queue")
    public void onOrderCreated(OrderEvent event) {
        String userId = event.getData().getUserId();
        BigDecimal amount = event.getData().getAmount();
        int points = amount.intValue(); // 1元=1积分
        System.out.println("增加积分: 用户=" + userId + ", 积分=" + points);
    }
}
```

### 5. 超时取消

```java
@Component
public class OrderTimeoutConsumer {

    @Autowired
    private OrderMapper orderMapper;

    @RabbitListener(queues = "order.timeout.dlx.queue")
    public void onTimeout(OrderEvent event) {
        String orderId = event.getOrderId();
        Order order = orderMapper.findById(orderId);

        if (order != null && "PENDING_PAYMENT".equals(order.getStatus())) {
            // 取消订单
            order.setStatus("CANCELLED");
            orderMapper.update(order);
            System.out.println("订单超时取消: " + orderId);
        }
    }
}
```

---

## 2 项目二：监控告警系统

### 项目背景

监控系统运行状态，当出现异常时发送告警通知。

### 架构设计

```
各服务 --> [log.exchange (topic)] --> 日志消费者 --> 分析引擎
                                                    |
                                                    ├── [alert.exchange] --> 邮件告警
                                                    ├── [alert.exchange] --> 短信告警
                                                    └── [alert.exchange] --> 钉钉告警
```

### 1. 日志收集

```java
// 日志事件
public class LogEvent {
    private String service;     // 服务名
    private String level;       // 日志级别
    private String message;     // 日志内容
    private Long timestamp;     // 时间戳
    private Map<String, String> tags; // 标签
}

// 日志工具类
@Component
public class LogProducer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void info(String service, String message) {
        send(service, "INFO", message);
    }

    public void error(String service, String message) {
        send(service, "ERROR", message);
    }

    private void send(String service, String level, String message) {
        LogEvent event = new LogEvent();
        event.setService(service);
        event.setLevel(level);
        event.setMessage(message);
        event.setTimestamp(System.currentTimeMillis());

        String routingKey = service + "." + level.toLowerCase();
        rabbitTemplate.convertAndSend("log.exchange", routingKey, event);
    }
}

// 业务服务中使用
@Service
public class PaymentService {

    @Autowired
    private LogProducer logProducer;

    public void pay(String orderId, BigDecimal amount) {
        try {
            // 支付逻辑
            logProducer.info("payment-service", "支付成功: " + orderId);
        } catch (Exception e) {
            logProducer.error("payment-service", "支付失败: " + orderId + ", 原因: " + e.getMessage());
            throw e;
        }
    }
}
```

### 2. 日志分析

```java
@Component
public class LogAnalyzer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    // 错误计数器
    private final AtomicInteger errorCount = new AtomicInteger(0);

    @RabbitListener(queues = "log.analyze.queue")
    public void analyze(LogEvent event) {
        // 统计错误数量
        if ("ERROR".equals(event.getLevel())) {
            int count = errorCount.incrementAndGet();

            // 5分钟内错误超过10次，触发告警
            if (count >= 10) {
                AlertEvent alert = new AlertEvent();
                alert.setService(event.getService());
                alert.setAlertType("HIGH_ERROR_RATE");
                alert.setMessage("5分钟内错误数: " + count);
                alert.setTimestamp(System.currentTimeMillis());

                rabbitTemplate.convertAndSend("alert.exchange", "alert.critical", alert);
                errorCount.set(0); // 重置
            }
        }
    }
}
```

### 3. 告警通知

```java
// 告警消费者
@Component
public class AlertConsumer {

    @RabbitListener(queues = "alert.email.queue")
    public void sendEmailAlert(AlertEvent alert) {
        System.out.println("发送邮件告警: " + alert.getMessage());
    }

    @RabbitListener(queues = "alert.sms.queue")
    public void sendSmsAlert(AlertEvent alert) {
        System.out.println("发送短信告警: " + alert.getMessage());
    }

    @RabbitListener(queues = "alert.dingtalk.queue")
    public void sendDingtalkAlert(AlertEvent alert) {
        System.out.println("发送钉钉告警: " + alert.getMessage());
    }
}
```

---

## 3 生产环境最佳实践

### 1. 消息可靠性

| 环节 | 配置 |
| --- | --- |
| 生产者到交换机 | Publisher Confirm |
| 交换机到队列 | 持久化队列 + 持久化消息 |
| 队列到消费者 | 手动确认（autoAck=false） |

### 2. 幂等性保证

```java
// 使用 Redis 去重
String key = "mq:processed:" + eventId;
Boolean isNew = redisTemplate.opsForValue()
    .setIfAbsent(key, "1", 24, TimeUnit.HOURS);
if (Boolean.FALSE.equals(isNew)) {
    return; // 已处理，跳过
}
```

### 3. 死信处理

```java
// 配置死信队列，处理失败的消息
@Bean
public Queue deadLetterQueue() {
    return QueueBuilder.durable("dead.letter.queue").build();
}
```

### 4. 监控指标

```java
// 监控队列积压量
@Scheduled(fixedRate = 60000)
public void monitorQueue() {
    int messageCount = rabbitTemplate.getQueueInfo("order.inventory.queue").getMessageCount();
    if (messageCount > 1000) {
        log.warn("队列积压: order.inventory.queue, 消息数: " + messageCount);
    }
}
```

---

## 4 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 架构设计 | 根据业务场景选择合适的消息模式 |
| 消息结构 | 包含事件ID、类型、数据、时间戳 |
| 幂等性 | 使用 Redis 或数据库去重 |
| 超时处理 | TTL + 死信队列实现延迟任务 |
| 监控告警 | 日志收集 + 分析引擎 + 多渠道通知 |
| 最佳实践 | 消息可靠性、幂等性、死信处理、监控 |

---

## 5 新手常见误区

### 误区 1："项目越复杂，消息队列用得越多"

**错！** 消息队列不是万能的，简单场景用同步调用更合适。只在需要异步、解耦、削峰的场景使用。

### 误区 2："消息队列不需要监控"

不是的。消息队列是系统的关键组件，必须监控队列积压、消费者状态、消息延迟等指标。

### 误区 3："一个项目只能用一种消息队列"

不是的。不同场景可以用不同的消息队列。比如业务消息用 RabbitMQ，日志收集用 Kafka。

---

## 6 动手练习

### 练习 1：基础练习

完善订单系统，添加订单支付事件的处理。

<details>
<summary>点击查看答案</summary>

```java
// 订单支付
@Service
public class OrderService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void payOrder(String orderId) {
        Order order = orderMapper.findById(orderId);
        order.setStatus("PAID");
        orderMapper.update(order);

        // 发送支付事件
        OrderEvent event = new OrderEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventType("ORDER_PAID");
        event.setOrderId(orderId);
        event.setData(new OrderData(order));
        event.setTimestamp(System.currentTimeMillis());

        rabbitTemplate.convertAndSend("order.exchange", "order.paid", event);
    }
}

// 物流服务消费支付事件
@Component
public class LogisticsConsumer {

    @RabbitListener(queues = "order.logistics.queue")
    public void onOrderPaid(OrderEvent event) {
        System.out.println("准备发货: " + event.getOrderId());
    }
}
```

</details>

### 练习 2：进阶练习

实现一个"消息追踪"功能：记录每条消息的发送、接收、处理完成时间。

<details>
<summary>点击查看答案</summary>

```java
// 消息追踪拦截器
@Component
public class MessageTraceInterceptor implements ChannelInterceptor {

    @Override
    public Message preSend(Message<?> message, MessageChannel channel) {
        String traceId = UUID.randomUUID().toString();
        // 在消息头中添加追踪ID
        MessageHeaders headers = message.getHeaders();
        Map<String, Object> newHeaders = new HashMap<>(headers);
        newHeaders.put("traceId", traceId);
        newHeaders.put("sendTime", System.currentTimeMillis());
        return MessageBuilder.createMessage(message.getPayload(), new MessageHeaders(newHeaders));
    }
}

// 消费者中记录处理时间
@RabbitListener(queues = "order.inventory.queue")
public void onOrderCreated(Message message) {
    Long sendTime = (Long) message.getMessageProperties().getHeader("sendTime");
    String traceId = (String) message.getMessageProperties().getHeader("traceId");
    long receiveTime = System.currentTimeMillis();

    System.out.println("消息追踪: traceId=" + traceId);
    System.out.println("  发送时间: " + sendTime);
    System.out.println("  接收时间: " + receiveTime);
    System.out.println("  延迟: " + (receiveTime - sendTime) + "ms");
}
```

</details>

### 练习 3（挑战）：综合练习

实现一个完整的"消息队列健康检查"功能：检查队列状态、积压量、消费者状态。

<details>
<summary>点击查看答案</summary>

```java
@Service
public class MQHealthCheckService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private RabbitAdmin rabbitAdmin;

    /**
     * 健康检查
     */
    public HealthCheckResult check() {
        HealthCheckResult result = new HealthCheckResult();

        // 1. 检查连接
        try {
            rabbitAdmin.getQueueInfo("health.check.queue");
            result.setConnectionOk(true);
        } catch (Exception e) {
            result.setConnectionOk(false);
            result.setError("连接失败: " + e.getMessage());
        }

        // 2. 检查队列积压
        List<QueueInfo> queueInfos = rabbitAdmin.getQueueInfo();
        for (QueueInfo info : queueInfos) {
            if (info.getMessageCount() > 10000) {
                result.addWarning("队列积压: " + info.getName() + ", 消息数: " + info.getMessageCount());
            }
        }

        // 3. 检查消费者
        Collection<ConsumerDetails> consumers = rabbitAdmin.getConsumerDetails();
        for (ConsumerDetails consumer : consumers) {
            if (consumer.getQueueDetails().isEmpty()) {
                result.addWarning("消费者未绑定队列: " + consumer.getConsumerTag());
            }
        }

        return result;
    }
}

// 健康检查结果
public class HealthCheckResult {
    private boolean connectionOk;
    private String error;
    private List<String> warnings = new ArrayList<>();
    private LocalDateTime checkTime = LocalDateTime.now();

    public boolean isHealthy() {
        return connectionOk && warnings.isEmpty();
    }
}

// 定时检查
@Scheduled(fixedRate = 60000)
public void scheduledHealthCheck() {
    HealthCheckResult result = mqHealthCheckService.check();
    if (!result.isHealthy()) {
        log.warn("MQ 健康检查异常: {}", result);
        // 发送告警
    }
}
```

</details>

---

## 教程总结

恭喜你完成了 MQ 消息队列教程的全部学习！回顾一下我们学过的内容：

| 章节 | 内容 |
| --- | --- |
| 1-2 | 消息队列基础概念、RabbitMQ 安装 |
| 3-5 | 简单队列、工作队列、发布订阅模式 |
| 6-7 | 路由模式、主题模式、消息确认与持久化 |
| 8-9 | Spring Boot 集成、消息转换器 |
| 10-11 | 死信队列、延迟消息、幂等性 |
| 12 | RabbitMQ 集群与高可用 |
| 13-14 | Kafka 入门与核心原理 |
| 15-16 | 实战应用与项目实战 |

希望这个教程能帮你掌握消息队列的核心知识，在实际项目中灵活运用！
