---
title: "第16章：综合项目实战"
description: "通过完整项目实战，掌握消息队列在真实项目中的应用，包括订单系统改造、监控告警、选型建议与最佳实践"
---

# 第16章：综合项目实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 消息队列在真实项目中到底怎么落地？
- RabbitMQ、Kafka、RocketMQ 到底该选哪个？
- 生产环境部署消息队列要注意什么？
- 消息丢失、重复消费、顺序错乱这些问题怎么解决？

这一章是整个 MQ 教程的收官之作。我们会通过**订单系统消息化改造**和**监控告警系统**两个完整项目，把前面学的知识串起来。同时会给出**消息队列选型建议**、**生产环境最佳实践**和**常见问题解决方案**，帮你打造一个健壮的消息队列应用。

---

## 16.1 为什么需要综合项目实战？

### 痛点分析

前面我们学了消息队列的基础知识、核心原理和常见场景，但到了真实项目中，问题远比 Demo 复杂：

- 多个系统之间怎么协调？
- 消息丢失了怎么办？
- 消息重复消费怎么处理？
- 消息顺序乱了怎么排查？
- 系统出了问题怎么监控？

打个比方：

> 你在驾校学会了开车，但真正上路时，要面对的是复杂的路况、多变的天气、各种突发状况。综合项目实战就是带你"上路"，把前面学的知识在真实场景中用起来。

### 解决方案

这一章会通过两个完整项目，带你从零搭建一个消息队列应用。每个项目都有：
- 需求分析：要解决什么问题
- 架构设计：怎么设计系统
- 完整代码：可以直接参考的实现
- 问题排查：常见问题怎么解决

---

## 16.2 项目一：订单系统消息化改造

### 需求分析

假设我们有一个电商系统，原来的订单系统是同步处理的，存在以下问题：

1. 用户下单后等待时间长（880ms）
2. 系统耦合度高，改一个地方要改很多地方
3. 某个下游服务挂了，整个下单流程就失败
4. 高峰期系统扛不住

现在要用消息队列进行改造，目标是：
- 响应时间降到 100ms 以内
- 系统解耦，各服务独立部署
- 某个服务挂了不影响下单
- 高峰期能扛住 10 倍流量

### 架构设计

```
                        ┌─────────────────┐
                        │   用户下单请求    │
                        └────────┬────────┘
                                 ↓
                        ┌─────────────────┐
                        │   订单服务       │
                        │  (同步:扣库存+   │
                        │   生成订单)      │
                        └────────┬────────┘
                                 ↓
                        ┌─────────────────┐
                        │  RabbitMQ       │
                        │  order.exchange │
                        └──┬───┬───┬─────┘
                           ↓   ↓   ↓
                    ┌──────┘   │   └──────┐
                    ↓          ↓          ↓
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ 短信服务  │ │ 推送服务  │ │ 积分服务  │
            │sms.queue │ │push.queue│ │pt.queue  │
            └──────────┘ └──────────┘ └──────────┘
                    ↓          ↓          ↓
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ 短信平台  │ │ 推送平台  │ │ 积分数据库│
            └──────────┘ └──────────┘ └──────────┘
```

### 完整代码实现

**第一步：定义消息配置**

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OrderMqConfig {

    // 定义订单交换机
    @Bean
    public DirectExchange orderExchange() {
        // durable=true: 持久化交换机，MQ 重启后还在
        return new DirectExchange("order.exchange", true, false);
    }

    // 定义短信队列
    @Bean
    public Queue smsQueue() {
        // durable=true: 持久化队列
        return QueueBuilder.durable("sms.queue").build();
    }

    // 定义推送队列
    @Bean
    public Queue pushQueue() {
        return QueueBuilder.durable("push.queue").build();
    }

    // 定义积分队列
    @Bean
    public Queue pointQueue() {
        return QueueBuilder.durable("point.queue").build();
    }

    // 绑定短信队列到交换机
    @Bean
    public Binding smsBinding() {
        return BindingBuilder.bind(smsQueue())
            .to(orderExchange())
            .with("order.created.sms"); // 路由键
    }

    // 绑定推送队列到交换机
    @Bean
    public Binding pushBinding() {
        return BindingBuilder.bind(pushQueue())
            .to(orderExchange())
            .with("order.created.push");
    }

    // 绑定积分队列到交换机
    @Bean
    public Binding pointBinding() {
        return BindingBuilder.bind(pointQueue())
            .to(orderExchange())
            .with("order.created.point");
    }
}
```

**第二步：定义消息实体**

```java
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

public class OrderMessage implements Serializable {
    private static final long serialVersionUID = 1L; // 序列化版本号

    private String orderId;       // 订单 ID
    private String orderNo;       // 订单编号
    private String userId;        // 用户 ID
    private String userPhone;     // 用户手机号
    private String productId;     // 商品 ID
    private String productName;   // 商品名称
    private BigDecimal amount;    // 订单金额
    private Date createTime;      // 创建时间

    // 构造方法
    public OrderMessage() {}

    public OrderMessage(String orderId, String orderNo, String userId,
                        String userPhone, String productId,
                        String productName, BigDecimal amount) {
        this.orderId = orderId;
        this.orderNo = orderNo;
        this.userId = userId;
        this.userPhone = userPhone;
        this.productId = productId;
        this.productName = productName;
        this.amount = amount;
        this.createTime = new Date();
    }

    // Getter 和 Setter
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }
    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
```

**第三步：订单服务（生产者）**

```java
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    @Autowired
    private RabbitTemplate rabbitTemplate; // RabbitMQ 模板

    @Autowired
    private InventoryService inventoryService; // 库存服务

    @Autowired
    private OrderRepository orderRepository; // 订单数据仓库

    /**
     * 创建订单
     * @param request 下单请求
     * @return 订单编号
     */
    @Transactional // 保证数据库操作的原子性
    public String createOrder(CreateOrderRequest request) {
        // 1. 同步执行：扣减库存
        boolean deducted = inventoryService.deduct(
            request.getProductId(), request.getQuantity());
        if (!deducted) {
            throw new BusinessException("库存不足");
        }

        // 2. 同步执行：生成订单记录
        Order order = new Order();
        order.setOrderNo(generateOrderNo()); // 生成订单编号
        order.setUserId(request.getUserId());
        order.setProductId(request.getProductId());
        order.setQuantity(request.getQuantity());
        order.setAmount(request.getAmount());
        order.setStatus("CREATED"); // 订单状态：已创建
        order.setCreateTime(new Date());
        orderRepository.save(order);

        // 3. 异步执行：发送消息到 MQ
        OrderMessage message = new OrderMessage(
            order.getId(),
            order.getOrderNo(),
            order.getUserId(),
            request.getUserPhone(),
            order.getProductId(),
            request.getProductName(),
            order.getAmount()
        );

        // 设置消息属性：持久化、消息 ID
        MessageProperties props = new MessageProperties();
        props.setMessageId(order.getId()); // 消息 ID，用于幂等性
        props.setDeliveryMode(MessageDeliveryMode.PERSISTENT); // 消息持久化

        // 发送到交换机，不同路由键对应不同消费者
        rabbitTemplate.convertAndSend("order.exchange", "order.created.sms", message, msg -> {
            msg.getMessageProperties().setMessageId(order.getId() + "_sms");
            msg.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return msg;
        });

        rabbitTemplate.convertAndSend("order.exchange", "order.created.push", message, msg -> {
            msg.getMessageProperties().setMessageId(order.getId() + "_push");
            msg.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return msg;
        });

        rabbitTemplate.convertAndSend("order.exchange", "order.created.point", message, msg -> {
            msg.getMessageProperties().setMessageId(order.getId() + "_point");
            msg.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return msg;
        });

        // 4. 返回订单编号
        return order.getOrderNo();
    }

    /**
     * 生成订单编号
     */
    private String generateOrderNo() {
        return "ORD" + System.currentTimeMillis() + RandomStringUtils.randomNumeric(6);
    }
}
```

**第四步：短信服务（消费者）**

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SmsConsumer {

    @Autowired
    private SmsRepository smsRepository; // 短信记录仓库（用于幂等性）

    @Autowired
    private SmsApi smsApi; // 短信平台 API

    /**
     * 监听短信队列，发送短信通知
     * @param message 订单消息
     * @param channel RabbitMQ 通道
     * @param delivery 消息投递信息
     */
    @RabbitListener(queues = "sms.queue") // 监听的队列
    public void handleSms(OrderMessage message, Channel channel,
                          @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        try {
            // 1. 幂等性检查：检查是否已经处理过
            if (smsRepository.existsByMessageId(message.getOrderId() + "_sms")) {
                // 已经处理过，直接确认消息
                channel.basicAck(deliveryTag, false);
                return;
            }

            // 2. 发送短信
            String content = String.format("您的订单 %s 已创建成功，金额 %.2f 元",
                message.getOrderNo(), message.getAmount());
            smsApi.send(message.getUserPhone(), content);

            // 3. 记录短信日志（用于幂等性检查）
            smsRepository.save(new SmsLog(message.getOrderId() + "_sms",
                message.getUserPhone(), content, new Date()));

            // 4. 手动确认消息
            channel.basicAck(deliveryTag, false);

            System.out.println("短信发送成功: " + message.getUserPhone());

        } catch (Exception e) {
            // 5. 异常处理：拒绝消息，重新入队
            try {
                channel.basicNack(deliveryTag, false, true); // requeue=true
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            System.err.println("短信发送失败: " + e.getMessage());
        }
    }
}
```

**第五步：积分服务（消费者）**

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PointConsumer {

    @Autowired
    private PointRepository pointRepository; // 积分仓库

    @Autowired
    private PointLogRepository pointLogRepository; // 积分日志仓库

    /**
     * 监听积分队列，增加用户积分
     * @param message 订单消息
     * @param channel RabbitMQ 通道
     * @param deliveryTag 消息投递标签
     */
    @RabbitListener(queues = "point.queue")
    public void handlePoints(OrderMessage message, Channel channel,
                             @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        try {
            // 1. 幂等性检查
            if (pointLogRepository.existsByMessageId(message.getOrderId() + "_point")) {
                channel.basicAck(deliveryTag, false);
                return;
            }

            // 2. 计算积分（订单金额的 1%）
            int points = message.getAmount()
                .multiply(new BigDecimal("0.01"))
                .setScale(0, RoundingMode.DOWN)
                .intValue();

            // 3. 增加积分
            pointRepository.addPoints(message.getUserId(), points);

            // 4. 记录积分日志
            pointLogRepository.save(new PointLog(
                message.getOrderId() + "_point",
                message.getUserId(),
                points,
                "订单奖励",
                new Date()
            ));

            // 5. 确认消息
            channel.basicAck(deliveryTag, false);

            System.out.println("积分增加成功: 用户=" + message.getUserId() + ", 积分=" + points);

        } catch (Exception e) {
            try {
                channel.basicNack(deliveryTag, false, true);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            System.err.println("积分增加失败: " + e.getMessage());
        }
    }
}
```

### 改造效果

| 指标 | 改造前 | 改造后 | 提升 |
| --- | --- | --- | --- |
| 响应时间 | 880ms | 35ms | 25 倍 |
| 系统耦合度 | 高 | 低 | 各服务独立部署 |
| 容错能力 | 差 | 好 | 服务挂了不影响下单 |
| 扩展性 | 差 | 好 | 加新服务只需监听 MQ |
| 高峰期表现 | 崩溃 | 正常 | MQ 缓冲保护 |

---

## 16.3 项目二：监控告警系统

### 需求分析

消息队列上线后，需要监控它的运行状态：

- 队列中有多少消息堆积？
- 消费者是否正常工作？
- 消息发送成功率是多少？
- 出现异常怎么告警？

### 架构设计

```
MQ 监控数据 → Kafka → 告警规则引擎 → 告警服务 → 短信/邮件/钉钉
                                         ↓
                                    监控大屏（Grafana）
```

### 完整代码实现

**第一步：MQ 监控数据采集**

```java
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;

@Component
public class MqMonitor {

    @Autowired
    private RabbitTemplate rabbitTemplate; // RabbitMQ 模板

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate; // Kafka 模板

    /**
     * 每 10 秒采集一次 MQ 监控数据
     */
    @Scheduled(fixedRate = 10000) // 每 10 秒执行一次
    public void collectMetrics() {
        // 1. 获取各队列的消息堆积量
        long smsQueueSize = getQueueSize("sms.queue");
        long pushQueueSize = getQueueSize("push.queue");
        long pointQueueSize = getQueueSize("point.queue");

        // 2. 构造监控数据
        MqMetrics metrics = new MqMetrics();
        metrics.setTimestamp(System.currentTimeMillis());
        metrics.setSmsQueueSize(smsQueueSize);
        metrics.setPushQueueSize(pushQueueSize);
        metrics.setPointQueueSize(pointQueueSize);

        // 3. 发送到 Kafka（用于后续分析）
        kafkaTemplate.send("mq.metrics", JSON.toJSONString(metrics));

        // 4. 检查是否需要告警
        checkAlert(metrics);
    }

    /**
     * 获取队列消息堆积量
     */
    private long getQueueSize(String queueName) {
        try {
            // 通过 RabbitMQ HTTP API 获取队列信息
            // 这里简化处理，实际应该调用 Management API
            return rabbitTemplate.execute(channel -> {
                return channel.messageCount(queueName);
            });
        } catch (Exception e) {
            return -1; // 获取失败
        }
    }

    /**
     * 检查是否需要告警
     */
    private void checkAlert(MqMetrics metrics) {
        // 规则 1：队列堆积超过 10000 条消息
        if (metrics.getSmsQueueSize() > 10000) {
            sendAlert("sms.queue 堆积超过 10000 条，当前: " + metrics.getSmsQueueSize());
        }
        if (metrics.getPushQueueSize() > 10000) {
            sendAlert("push.queue 堆积超过 10000 条，当前: " + metrics.getPushQueueSize());
        }

        // 规则 2：队列获取失败（可能 MQ 挂了）
        if (metrics.getSmsQueueSize() == -1) {
            sendAlert("RabbitMQ 连接异常，无法获取队列信息");
        }
    }

    /**
     * 发送告警
     */
    private void sendAlert(String message) {
        // 1. 记录日志
        System.err.println("[MQ告警] " + message);

        // 2. 发送钉钉通知
        dingTalkApi.sendAlert(message);

        // 3. 发送邮件通知
        emailApi.sendAlert("ops@example.com", "MQ告警", message);
    }
}
```

**第二步：告警规则引擎**

```java
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.KStream;
import org.springframework.stereotype.Component;

@Component
public class AlertRuleEngine {

    /**
     * 启动告警规则引擎
     */
    public void start() {
        // 1. 创建流处理拓扑
        StreamsBuilder builder = new StreamsBuilder();

        // 2. 从 Kafka 读取监控数据
        KStream<String, String> metricsStream = builder.stream("mq.metrics");

        // 3. 应用告警规则
        metricsStream.foreach((key, value) -> {
            MqMetrics metrics = JSON.parseObject(value, MqMetrics.class);

            // 规则 1：队列堆积告警
            if (metrics.getSmsQueueSize() > 10000) {
                triggerAlert("QUEUE_BACKLOG", "sms.queue", metrics.getSmsQueueSize());
            }

            // 规则 2：消费者离线告警
            if (metrics.getConsumerCount() == 0) {
                triggerAlert("CONSUMER_OFFLINE", "无消费者在线", 0);
            }

            // 规则 3：消息发送失败率告警
            if (metrics.getFailRate() > 0.05) { // 失败率超过 5%
                triggerAlert("HIGH_FAIL_RATE", "消息发送失败率: " + metrics.getFailRate(), 0);
            }
        });

        // 4. 启动流处理
        KafkaStreams streams = new KafkaStreams(builder.build(), getStreamsConfig());
        streams.start();
    }

    /**
     * 触发告警
     */
    private void triggerAlert(String alertType, String message, long value) {
        Alert alert = new Alert();
        alert.setType(alertType);
        alert.setMessage(message);
        alert.setValue(value);
        alert.setTimestamp(System.currentTimeMillis());
        alert.setLevel(calculateLevel(alertType, value)); // 计算告警级别

        // 发送到告警服务
        alertService.handle(alert);
    }

    /**
     * 计算告警级别
     */
    private String calculateLevel(String alertType, long value) {
        if ("QUEUE_BACKLOG".equals(alertType)) {
            if (value > 100000) return "CRITICAL"; // 严重
            if (value > 50000) return "WARNING";   // 警告
            return "INFO";                          // 信息
        }
        if ("CONSUMER_OFFLINE".equals(alertType)) {
            return "CRITICAL";
        }
        return "WARNING";
    }
}
```

---

## 16.4 消息队列选型建议

### 主流消息队列对比

| 特性 | RabbitMQ | Kafka | RocketMQ |
| --- | --- | --- | --- |
| **开发语言** | Erlang | Java/Scala | Java |
| **吞吐量** | 万级/秒 | 百万级/秒 | 十万级/秒 |
| **延迟** | 微秒级 | 毫秒级 | 毫秒级 |
| **消息可靠性** | 高 | 高 | 非常高 |
| **功能丰富度** | 高 | 中 | 高 |
| **管理界面** | 自带 | 需第三方 | 自带 |
| **社区活跃度** | 高 | 非常高 | 中 |
| **学习难度** | 低 | 中 | 中 |
| **运维难度** | 低 | 中 | 中 |

### 选型决策树

```
你的场景是什么？
│
├── 业务消息（订单、通知、邮件）
│   └── 需要复杂路由？
│       ├── 是 → RabbitMQ
│       └── 否 → 需要事务消息？
│           ├── 是 → RocketMQ
│           └── 否 → RabbitMQ
│
├── 大数据流（日志、监控、行为追踪）
│   └── Kafka
│
├── 金融交易（需要强一致性）
│   └── RocketMQ
│
└── 流式处理（实时计算）
    └── Kafka
```

### 选型建议总结

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 初创团队、快速迭代 | RabbitMQ | 简单易用，文档丰富 |
| 大数据、日志收集 | Kafka | 高吞吐，支持流处理 |
| 金融、电商核心 | RocketMQ | 事务消息，高可靠 |
| 微服务通信 | RabbitMQ / Kafka | 看团队技术栈 |
| 需要消息回溯 | Kafka | 消息保留可配置 |
| 需要延迟消息 | RabbitMQ / RocketMQ | 原生支持 |

---

## 16.5 生产环境最佳实践

### 消息可靠性保证

```java
// 正确做法： 生产者端：开启确认机制
// RabbitMQ
props.put("publisher-confirm-type", "correlated"); // 开启发布者确认
props.put("publisher-returns", "true"); // 开启消息退回

// Kafka
props.put("acks", "all"); // 所有 ISR 副本确认
props.put("retries", 3); // 重试 3 次
props.put("enable.idempotence", "true"); // 开启幂等性

// 正确做法： MQ 端：消息持久化
// RabbitMQ：队列和消息都设置持久化
QueueBuilder.durable("order.queue").build();
props.setDeliveryMode(MessageDeliveryMode.PERSISTENT);

// Kafka：默认持久化，配置副本数
props.put("replication.factor", "3"); // 3 个副本
props.put("min.insync.replicas", "2"); // 至少 2 个 ISR

// 正确做法： 消费者端：手动确认
// RabbitMQ
props.put("acknowledge-mode", "manual"); // 手动确认
channel.basicAck(deliveryTag, false); // 处理成功后确认

// Kafka
props.put("enable.auto.commit", "false"); // 关闭自动提交
consumer.commitSync(); // 手动提交偏移量
```

### 幂等性处理

```java
// 正确做法： 方案 1：唯一消息 ID
String messageId = UUID.randomUUID().toString();
// 消费者端检查是否已处理
if (processedMessages.contains(messageId)) {
    return; // 已处理，跳过
}
processMessage(message);
processedMessages.add(messageId);

// 正确做法： 方案 2：数据库唯一约束
// 用业务唯一键（如订单号）做唯一约束
INSERT INTO order_log (order_id, status) VALUES (?, ?)
ON DUPLICATE KEY UPDATE status = ?;

// 正确做法： 方案 3：Redis 去重
String key = "processed:" + messageId;
if (redisTemplate.hasKey(key)) {
    return; // 已处理
}
processMessage(message);
redisTemplate.opsForValue().set(key, "1", 24, TimeUnit.HOURS); // 24 小时过期
```

### 消息顺序保证

```java
// 正确做法： 生产者端：相同业务 ID 发到同一分区
String orderId = "ORDER_123";
// 用 orderId 作为 Key，保证同一订单的消息有序
producer.send(new ProducerRecord<>("order_topic", orderId, "订单创建"));
producer.send(new ProducerRecord<>("order_topic", orderId, "订单支付"));
producer.send(new ProducerRecord<>("order_topic", orderId, "订单完成"));

// 正确做法： 消费者端：单线程处理同一分区
// Kafka：一个分区只分配给一个消费者
// RabbitMQ：一个队列只有一个消费者

// 错误做法： 错误做法：多线程处理导致顺序错乱
// 消费者内部用线程池处理 → 顺序无法保证
```

### 监控告警配置

```java
// 正确做法： 必须监控的指标
| 指标 | 告警阈值 | 告警级别 |
| --- | --- | --- |
| 队列堆积量 | > 10000 | WARNING |
| 队列堆积量 | > 100000 | CRITICAL |
| 消费者数量 | = 0 | CRITICAL |
| 消息发送失败率 | > 5% | WARNING |
| 消息发送失败率 | > 10% | CRITICAL |
| 消息消费延迟 | > 60 秒 | WARNING |
| MQ 连接数 | 异常 | CRITICAL |
```

---

## 16.6 常见问题与解决方案

### 问题 1：消息丢失

**原因分析**：
- 生产者发送消息失败
- MQ 宕机，消息没持久化
- 消费者处理失败，但消息已被确认

**解决方案**：

```java
// 1. 生产者端：开启确认机制
props.put("publisher-confirm-type", "correlated");
rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
    if (!ack) {
        // 消息发送失败，记录日志并重试
        log.error("消息发送失败: {}", correlationData);
        retrySend(correlationData);
    }
});

// 2. MQ 端：消息持久化
QueueBuilder.durable("order.queue").build(); // 队列持久化
props.setDeliveryMode(MessageDeliveryMode.PERSISTENT); // 消息持久化

// 3. 消费者端：手动确认
channel.basicAck(deliveryTag, false); // 处理成功后再确认
```

### 问题 2：消息重复消费

**原因分析**：
- 网络抖动，消费者确认失败，消息重新入队
- 消费者处理成功但还没确认就挂了

**解决方案**：

```java
// 方案 1：唯一消息 ID + Redis 去重
String messageId = message.getMessageProperties().getMessageId();
String key = "processed:" + messageId;
if (redisTemplate.hasKey(key)) {
    channel.basicAck(deliveryTag, false); // 已处理，直接确认
    return;
}
processMessage(message);
redisTemplate.opsForValue().set(key, "1", 24, TimeUnit.HOURS);
channel.basicAck(deliveryTag, false);

// 方案 2：数据库唯一约束
try {
    orderLogRepository.save(new OrderLog(message.getOrderId(), "PROCESSED"));
    processMessage(message);
} catch (DuplicateKeyException e) {
    // 已处理，跳过
    channel.basicAck(deliveryTag, false);
}
```

### 问题 3：消息顺序错乱

**原因分析**：
- 消息发到了不同的分区
- 消费者多线程处理

**解决方案**：

```java
// 生产者端：相同业务 ID 发到同一分区
String orderId = "ORDER_123";
producer.send(new ProducerRecord<>("order_topic", orderId, "订单创建"));
producer.send(new ProducerRecord<>("order_topic", orderId, "订单支付"));

// 消费者端：单线程处理
// 不要用线程池，保证顺序
@RabbitListener(queues = "order.queue")
public void handleOrder(OrderMessage message) {
    // 单线程处理，保证顺序
    processMessage(message);
}
```

### 问题 4：消息堆积

**原因分析**：
- 消费者处理太慢
- 消费者数量不够
- 消费者挂了

**解决方案**：

```java
// 方案 1：增加消费者数量
// 但消费者数不能超过分区数

// 方案 2：优化消费者处理逻辑
// 批量处理、异步处理、缓存优化

// 方案 3：临时扩容
// 创建临时队列，把堆积的消息转移到临时队列
// 增加临时消费者处理临时队列
Channel tempChannel = connection.createChannel();
tempChannel.queueDeclare("temp.queue", true, false, false, null);
// 用 shovel 插件把消息从原队列转移到临时队列
// 增加临时消费者处理临时队列

// 方案 4：死信队列
// 处理不了的消息发到死信队列，后续人工处理
Map<String, Object> args = new HashMap<>();
args.put("x-dead-letter-exchange", "dlx.exchange");
args.put("x-dead-letter-routing-key", "dlx.key");
QueueBuilder.durable("order.queue").withArguments(args).build();
```

### 问题 5：消费者频繁 Rebalance

**原因分析**：
- 消费者频繁加入/退出
- 消费者处理超时，被踢出组

**解决方案**：

```java
// 方案 1：增加心跳间隔
props.put("heartbeat.interval.ms", "10000"); // 10 秒

// 方案 2：增加会话超时时间
props.put("session.timeout.ms", "30000"); // 30 秒

// 方案 3：增加最大处理时间
props.put("max.poll.interval.ms", "600000"); // 10 分钟

// 方案 4：优化消费者处理逻辑
// 减少处理时间，避免超时
```

---

## 16.7 学习路线总结

### MQ 学习路线图

```
第一阶段：基础入门
├── 消息队列是什么
├── 为什么需要消息队列
├── 主流 MQ 对比
└── 搭建 RabbitMQ 环境

第二阶段：RabbitMQ 核心
├── 核心概念（Exchange、Queue、Binding）
├── 消息模式（简单、工作、发布订阅、路由、主题）
├── 消息确认与持久化
├── Spring Boot 集成
├── 死信队列与延迟消息
└── 集群与高可用

第三阶段：Kafka 入门与原理
├── Kafka 核心概念
├── 分区机制
├── 副本机制与 ISR
├── 消费者组原理
├── 消息存储机制
└── 高吞吐原理

第四阶段：实战应用
├── 异步解耦（订单系统）
├── 削峰填谷（秒杀系统）
├── 数据同步（Binlog + MQ）
└── 事件驱动架构

第五阶段：生产实践
├── 消息可靠性保证
├── 幂等性处理
├── 消息顺序保证
├── 监控告警
├── 常见问题排查
└── 性能调优
```

### 核心知识点回顾

| 知识点 | 说明 |
| --- | --- |
| 消息队列三大作用 | 异步处理、系统解耦、削峰填谷 |
| RabbitMQ 核心概念 | Exchange、Queue、Binding、Routing Key |
| RabbitMQ 消息模式 | 简单、工作、发布订阅、路由、主题 |
| Kafka 核心概念 | Topic、Partition、Broker、Consumer Group |
| Kafka 高吞吐原理 | 顺序写磁盘、零拷贝、批量发送、压缩 |
| 消息可靠性 | 生产者确认、MQ 持久化、消费者确认 |
| 幂等性处理 | 唯一消息 ID、数据库唯一约束、Redis 去重 |
| 消息顺序 | 相同 Key 到同一分区、单线程消费 |

### 给新手的建议

1. **先学 RabbitMQ**：功能完善、文档友好、管理界面直观，适合入门
2. **理解核心概念**：Exchange、Queue、Binding 这些概念要搞懂，后面学什么都轻松
3. **动手实践**：光看不练假把式，一定要动手写代码
4. **理解原理**：知道"怎么用"还要知道"为什么"，出了问题才能排查
5. **关注生产实践**：消息可靠性、幂等性、顺序保证这些是生产环境必须考虑的
6. **多看源码**：遇到问题多看源码，理解底层实现
7. **持续学习**：消息队列技术不断更新，要保持学习的热情

---

## 16.8 新手常见误区

### 误区 1："消息队列能解决所有性能问题"

**错！** 消息队列只能解决异步和解耦的问题，如果你的瓶颈在数据库查询，加消息队列也没用。要先找到瓶颈，再决定是否需要 MQ。

### 误区 2："用了消息队列系统就一定可靠"

不是的。消息队列引入了新的一致性挑战（消息丢失、重复消费、顺序错乱），如果处理不好，反而会让系统更不可靠。要正确理解 MQ 的能力边界，做好可靠性保证。

### 误区 3："RabbitMQ 和 Kafka 随便选一个"

它们适用场景不同。RabbitMQ 适合业务消息，Kafka 适合大数据流。选型要看业务需求，不能随便选。

### 误区 4："消息队列不需要监控"

不是的。消息队列是系统的核心组件，一旦出问题会影响整个系统。必须做好监控告警，及时发现问题。

### 误区 5："学完这个教程就够了"

不够。消息队列是一个很大的领域，这个教程只是带你入门。要真正掌握，还需要：
- 多看官方文档
- 多动手实践
- 多看源码
- 多参与开源项目
- 持续关注技术发展

---

## 16.9 动手练习

### 练习 1：基础练习

设计一个订单系统消息化改造方案，要求：
- 用户下单后，发送短信通知
- 用户下单后，推送 App 消息
- 用户下单后，增加积分
- 保证消息不丢失

请画出架构图，并写出关键代码。

<details>
<summary>点击查看答案</summary>

**架构图**：
```
用户下单 → 订单服务 → 扣库存 + 生成订单（同步）
                    ↓
              RabbitMQ (order.exchange)
                    ↓
        ┌───────────┼───────────┐
        ↓           ↓           ↓
    短信队列    推送队列    积分队列
        ↓           ↓           ↓
    短信服务    推送服务    积分服务
```

**关键代码**：
```java
// 订单服务
@Service
public class OrderService {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Transactional
    public String createOrder(CreateOrderRequest request) {
        // 1. 同步：扣库存 + 生成订单
        inventoryService.deduct(request.getProductId(), request.getQuantity());
        Order order = orderRepository.save(new Order(request));

        // 2. 异步：发送消息到 MQ（持久化）
        OrderMessage msg = new OrderMessage(order);
        rabbitTemplate.convertAndSend("order.exchange", "order.created.sms", msg, m -> {
            m.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return m;
        });
        rabbitTemplate.convertAndSend("order.exchange", "order.created.push", msg, m -> {
            m.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return m;
        });
        rabbitTemplate.convertAndSend("order.exchange", "order.created.point", msg, m -> {
            m.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return m;
        });

        return order.getOrderNo();
    }
}

// 短信消费者（手动确认 + 幂等性）
@Service
public class SmsConsumer {
    @Autowired
    private SmsLogRepository smsLogRepository;

    @RabbitListener(queues = "sms.queue")
    public void handle(OrderMessage msg, Channel channel,
                       @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws Exception {
        String msgId = msg.getOrderId() + "_sms";
        if (smsLogRepository.existsByMessageId(msgId)) {
            channel.basicAck(tag, false);
            return;
        }
        smsApi.send(msg.getUserPhone(), "订单 " + msg.getOrderNo() + " 已创建");
        smsLogRepository.save(new SmsLog(msgId));
        channel.basicAck(tag, false);
    }
}
```

</details>

### 练习 2：进阶练习

设计一个监控告警系统，要求：
- 监控 RabbitMQ 队列堆积量
- 堆积超过 10000 条时发送告警
- 消费者离线时发送告警
- 告警通过钉钉和邮件发送

请写出关键代码。

<details>
<summary>点击查看答案</summary>

```java
@Component
public class MqMonitor {
    @Autowired
    private RabbitTemplate rabbitTemplate;
    @Autowired
    private DingTalkApi dingTalkApi;
    @Autowired
    private EmailApi emailApi;

    @Scheduled(fixedRate = 10000) // 每 10 秒采集一次
    public void monitor() {
        // 1. 获取队列堆积量
        long smsQueueSize = getQueueSize("sms.queue");
        long pushQueueSize = getQueueSize("push.queue");

        // 2. 检查告警规则
        if (smsQueueSize > 10000) {
            alert("sms.queue 堆积: " + smsQueueSize);
        }
        if (pushQueueSize > 10000) {
            alert("push.queue 堆积: " + pushQueueSize);
        }
        if (smsQueueSize == -1) {
            alert("RabbitMQ 连接异常");
        }
    }

    private long getQueueSize(String queueName) {
        try {
            return rabbitTemplate.execute(ch -> ch.messageCount(queueName));
        } catch (Exception e) {
            return -1;
        }
    }

    private void alert(String message) {
        System.err.println("[MQ告警] " + message);
        dingTalkApi.send(message);
        emailApi.send("ops@example.com", "MQ告警", message);
    }
}
```

</details>

### 练习 3（挑战）：综合练习

设计一个完整的消息队列应用，要求：
- 使用 RabbitMQ 作为消息队列
- 实现订单系统消息化改造
- 实现监控告警系统
- 保证消息不丢失、不重复、有序
- 写出完整的项目结构和关键代码

<details>
<summary>点击查看答案</summary>

**项目结构**：
```
mq-project/
├── order-service/          # 订单服务
│   ├── src/main/java/
│   │   ├── config/         # 配置类
│   │   │   └── MqConfig.java
│   │   ├── controller/     # 控制器
│   │   │   └── OrderController.java
│   │   ├── entity/         # 实体类
│   │   │   ├── Order.java
│   │   │   └── OrderMessage.java
│   │   ├── repository/     # 数据仓库
│   │   │   └── OrderRepository.java
│   │   └── service/        # 服务类
│   │       └── OrderService.java
│   └── application.yml
├── sms-service/            # 短信服务
│   ├── src/main/java/
│   │   ├── consumer/       # 消费者
│   │   │   └── SmsConsumer.java
│   │   └── repository/     # 数据仓库
│   │       └── SmsLogRepository.java
│   └── application.yml
├── push-service/           # 推送服务
│   └── ...
├── point-service/          # 积分服务
│   └── ...
└── monitor-service/        # 监控服务
    ├── src/main/java/
    │   ├── monitor/        # 监控采集
    │   │   └── MqMonitor.java
    │   └── alert/          # 告警处理
    │       └── AlertService.java
    └── application.yml
```

**关键代码**：

```java
// MQ 配置
@Configuration
public class MqConfig {
    @Bean
    public DirectExchange orderExchange() {
        return new DirectExchange("order.exchange", true, false);
    }

    @Bean
    public Queue smsQueue() {
        return QueueBuilder.durable("sms.queue").build();
    }

    @Bean
    public Binding smsBinding() {
        return BindingBuilder.bind(smsQueue())
            .to(orderExchange())
            .with("order.created.sms");
    }
}

// 订单服务（生产者）
@Service
public class OrderService {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Transactional
    public String createOrder(CreateOrderRequest req) {
        // 1. 同步：核心流程
        inventoryService.deduct(req.getProductId(), req.getQuantity());
        Order order = orderRepository.save(new Order(req));

        // 2. 异步：发送消息（持久化 + 消息 ID）
        OrderMessage msg = new OrderMessage(order);
        rabbitTemplate.convertAndSend("order.exchange", "order.created.sms", msg, m -> {
            m.getMessageProperties().setMessageId(order.getId() + "_sms");
            m.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return m;
        });

        return order.getOrderNo();
    }
}

// 短信消费者（手动确认 + 幂等性）
@Service
public class SmsConsumer {
    @Autowired
    private SmsLogRepository smsLogRepository;

    @RabbitListener(queues = "sms.queue")
    public void handle(OrderMessage msg, Channel ch,
                       @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws Exception {
        String msgId = msg.getOrderId() + "_sms";
        // 幂等性检查
        if (smsLogRepository.existsByMessageId(msgId)) {
            ch.basicAck(tag, false);
            return;
        }
        // 处理消息
        smsApi.send(msg.getUserPhone(), "订单已创建");
        smsLogRepository.save(new SmsLog(msgId));
        // 手动确认
        ch.basicAck(tag, false);
    }
}

// 监控服务
@Component
public class MqMonitor {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Scheduled(fixedRate = 10000)
    public void monitor() {
        long size = rabbitTemplate.execute(ch -> ch.messageCount("sms.queue"));
        if (size > 10000) {
            alertService.send("sms.queue 堆积: " + size);
        }
    }
}
```

</details>

---

## 全教程总结

恭喜你完成了整个 MQ 消息队列教程！回顾一下我们学过的内容：

- **第 1-2 章**：消息队列基础概念和环境搭建
- **第 3-7 章**：RabbitMQ 核心概念和消息模式
- **第 8-12 章**：Spring Boot 集成、高级特性和集群
- **第 13-14 章**：Kafka 入门和核心原理
- **第 15-16 章**：实战应用和综合项目

消息队列是一个很大的领域，这个教程只是带你入门。要真正掌握，还需要在实践中不断积累经验。希望这个教程能帮你打下扎实的基础，在消息队列的学习之路上走得更远。

加油！
