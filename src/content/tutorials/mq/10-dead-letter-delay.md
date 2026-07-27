---
title: "第10章：死信队列与延迟消息"
description: "掌握死信队列、TTL、延迟队列的实现方式"
---

# 第10章：死信队列与延迟消息

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是死信队列？有什么用？
- 怎么让消息在指定时间后才被消费？
- 订单30分钟未支付自动取消怎么实现？
- RabbitMQ 原生支持延迟队列吗？

这一章会解答这些问题。死信队列和延迟消息是消息队列的高级特性，在实际业务中非常有用。

---

## 1 为什么需要死信队列？

### 痛点分析

场景1：订单30分钟未支付自动取消

```
用户下单 --> 创建订单 --> 等待支付 --> 30分钟后未支付 --> 取消订单
```

问题：怎么知道"30分钟到了"？轮询数据库效率太低。

场景2：消息处理失败

```
消费者收到消息 --> 处理失败 --> 重试3次还是失败 --> ？
```

问题：失败的消息怎么处理？丢弃还是保存？

### 解决方案

使用 **死信队列（Dead Letter Queue，DLQ）**：

- 死信队列是专门存放"死信"的队列
- 死信是指不能被正常消费的消息
- 消息变成死信后会被自动转发到死信队列

> 类比：死信队列就像快递的"退回仓库"，无法正常投递的快递会被退回到这里，等待进一步处理。

---

## 2 什么是死信？

消息变成死信的三种情况：

| 情况 | 说明 |
| --- | --- |
| **消息被拒绝** | `basic.reject` 或 `basic.nack`，且 `requeue=false` |
| **消息过期** | 消息的 TTL（生存时间）到期 |
| **队列达到最大长度** | 队列满了，新消息无法入队 |

---

## 3 配置死信队列

### 步骤1：声明死信交换机和死信队列

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DeadLetterConfig {

    // 1. 声明死信交换机
    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange("dlx_exchange");
    }

    // 2. 声明死信队列
    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable("dlx_queue").build();
    }

    // 3. 绑定死信队列到死信交换机
    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue())
                .to(deadLetterExchange())
                .with("dlx_routing_key");
    }
}
```

### 步骤2：配置业务队列的死信参数

```java
@Configuration
public class OrderConfig {

    // 业务队列（订单队列）
    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable("order_queue")
                // 指定死信交换机
                .withArgument("x-dead-letter-exchange", "dlx_exchange")
                // 指定死信路由键
                .withArgument("x-dead-letter-routing-key", "dlx_routing_key")
                // 可选：设置消息过期时间（毫秒）
                .withArgument("x-message-ttl", 30 * 60 * 1000) // 30分钟
                // 可选：设置队列最大长度
                .withArgument("x-max-length", 1000)
                .build();
    }
}
```

### 步骤3：消费死信队列

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class DeadLetterConsumer {

    @RabbitListener(queues = "dlx_queue")
    public void handleDeadLetter(String message) {
        System.out.println("收到死信: " + message);
        // 处理死信：记录日志、发送告警、人工处理等
    }
}
```

---

## 4 实现延迟队列

### 方案1：使用 TTL + 死信队列

原理：
1. 消息发送到业务队列，设置 TTL（过期时间）
2. 消息过期后自动转发到死信队列
3. 消费者监听死信队列，收到消息时就是"延迟时间到了"

```java
// 生产者：发送延迟消息
@Service
public class OrderService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void createOrder(Order order) {
        // 发送消息到订单队列，设置30分钟过期
        rabbitTemplate.convertAndSend("order_exchange", "order.create", order, message -> {
            // 设置消息过期时间（毫秒）
            message.getMessageProperties().setExpiration("1800000"); // 30分钟
            return message;
        });
        System.out.println("订单已创建，等待30分钟后处理");
    }
}

// 消费者：监听死信队列（延迟后的消息）
@Component
public class OrderTimeoutConsumer {

    @RabbitListener(queues = "dlx_queue")
    public void handleTimeout(Order order) {
        System.out.println("订单超时: " + order.getId());
        // 取消订单、释放库存等
        cancelOrder(order);
    }
}
```

### 方案2：使用 RabbitMQ 延迟插件

RabbitMQ 官方提供了 `rabbitmq_delayed_message_exchange` 插件，可以直接实现延迟消息。

#### 安装插件

```bash
# 下载插件
# https://www.rabbitmq.com/community-plugins.html

# 将插件放入 plugins 目录
# 启用插件
rabbitmq-plugins enable rabbitmq_delayed_message_exchange
```

#### 使用延迟交换机

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class DelayConfig {

    // 声明延迟交换机
    @Bean
    public CustomExchange delayExchange() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-delayed-type", "direct");
        return new CustomExchange("delay_exchange", "x-delayed-message", true, false, args);
    }

    @Bean
    public Queue delayQueue() {
        return QueueBuilder.durable("delay_queue").build();
    }

    @Bean
    public Binding delayBinding() {
        return BindingBuilder.bind(delayQueue()).to(delayExchange()).with("delay_key").noargs();
    }
}

// 生产者：发送延迟消息
@Service
public class DelayService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendDelay(String message, int delayMs) {
        rabbitTemplate.convertAndSend("delay_exchange", "delay_key", message, msg -> {
            // 设置延迟时间（毫秒）
            msg.getMessageProperties().setDelay(delayMs);
            return msg;
        });
    }
}

// 消费者
@Component
public class DelayConsumer {

    @RabbitListener(queues = "delay_queue")
    public void receive(String message) {
        System.out.println("收到延迟消息: " + message);
    }
}
```

---

## 5 TTL（消息过期时间）

### 设置方式

#### 1. 队列级别 TTL

```java
// 队列中所有消息都有相同的过期时间
@Bean
public Queue ttlQueue() {
    return QueueBuilder.durable("ttl_queue")
            .withArgument("x-message-ttl", 60000) // 60秒
            .build();
}
```

#### 2. 消息级别 TTL

```java
// 每条消息可以单独设置过期时间
rabbitTemplate.convertAndSend("exchange", "key", message, msg -> {
    msg.getMessageProperties().setExpiration("30000"); // 30秒
    return msg;
});
```

> 注意：消息级别的 TTL 控制更灵活，但性能稍差（需要检查每条消息是否过期）。

---

## 6 死信队列的应用场景

| 场景 | 实现方式 |
| --- | --- |
| 订单超时取消 | 消息设置30分钟TTL，过期后进入死信队列处理 |
| 重试失败处理 | 消息重试3次后拒绝，进入死信队列人工处理 |
| 延迟任务 | 使用延迟插件或TTL+死信实现定时任务 |
| 消息追踪 | 所有死信集中处理，记录日志和告警 |

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 死信队列 | 存放不能被正常消费的消息 |
| 死信来源 | 消息被拒绝、消息过期、队列满了 |
| x-dead-letter-exchange | 指定死信交换机 |
| x-dead-letter-routing-key | 指定死信路由键 |
| x-message-ttl | 消息过期时间 |
| 延迟队列 | TTL + 死信 或 延迟插件 |

---

## 8 新手常见误区

### 误区 1："死信队列会自动创建"

**错！** 死信队列需要手动声明。业务队列只是配置了死信交换机，如果死信交换机或死信队列不存在，消息会被丢弃。

### 误区 2："TTL 设置后消息立即过期"

不是的。RabbitMQ 只在消息到达队列头部时才检查是否过期。如果前面有消息没过期，后面的消息即使过期了也会被阻塞。

### 误区 3："延迟队列必须用死信队列"

不是的。可以使用 RabbitMQ 延迟插件（`rabbitmq_delayed_message_exchange`），它直接在交换机层面实现延迟，不需要死信队列。

---

## 9 动手练习

### 练习 1：基础练习

实现一个"订单超时取消"功能：订单创建后30分钟未支付自动取消。

<details>
<summary>点击查看答案</summary>

```java
// 配置类
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OrderTimeoutConfig {

    // 订单队列（配置死信）
    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable("order_queue")
                .withArgument("x-dead-letter-exchange", "dlx_exchange")
                .withArgument("x-dead-letter-routing-key", "order_timeout")
                .build();
    }

    // 死信交换机
    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange("dlx_exchange");
    }

    // 死信队列
    @Bean
    public Queue dlxQueue() {
        return QueueBuilder.durable("order_timeout_queue").build();
    }

    // 绑定
    @Bean
    public Binding dlxBinding() {
        return BindingBuilder.bind(dlxQueue()).to(dlxExchange()).with("order_timeout");
    }
}

// 生产者：创建订单
@Service
public class OrderService {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void createOrder(Order order) {
        // 发送消息，设置30分钟过期
        rabbitTemplate.convertAndSend("order_exchange", "order.create", order, msg -> {
            msg.getMessageProperties().setExpiration("1800000"); // 30分钟
            return msg;
        });
    }
}

// 消费者：处理超时订单
@Component
public class OrderTimeoutConsumer {
    @RabbitListener(queues = "order_timeout_queue")
    public void handleTimeout(Order order) {
        System.out.println("订单超时，取消订单: " + order.getId());
        // 取消订单、释放库存
    }
}
```

</details>

### 练习 2：进阶练习

实现一个"消息重试"机制：消息处理失败后重试3次，然后进入死信队列。

<details>
<summary>点击查看答案</summary>

```yaml
# application.yml
spring:
  rabbitmq:
    listener:
      simple:
        acknowledge-mode: manual
        retry:
          enabled: true
          max-attempts: 3
```

```java
// 消费者
import com.rabbitmq.client.Channel;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
public class RetryConsumer {

    @RabbitListener(queues = "order_queue")
    public void receive(Order order, Channel channel,
                       @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        try {
            // 模拟处理，可能失败
            processOrder(order);
            channel.basicAck(deliveryTag, false);
        } catch (Exception e) {
            System.out.println("处理失败，准备重试: " + e.getMessage());
            // Spring 会自动重试
            // 重试次数达到上限后，消息会被拒绝并进入死信队列
            try {
                channel.basicNack(deliveryTag, false, false);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }
}
```

</details>

### 练习 3（挑战）：综合练习

使用延迟插件实现一个"定时任务调度器"：支持在指定时间后执行任务。

<details>
<summary>点击查看答案</summary>

```java
// 配置延迟交换机
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class SchedulerConfig {

    @Bean
    public CustomExchange schedulerExchange() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-delayed-type", "direct");
        return new CustomExchange("scheduler_exchange", "x-delayed-message", true, false, args);
    }

    @Bean
    public Queue schedulerQueue() {
        return QueueBuilder.durable("scheduler_queue").build();
    }

    @Bean
    public Binding schedulerBinding() {
        return BindingBuilder.bind(schedulerQueue()).to(schedulerExchange()).with("task").noargs();
    }
}

// 任务调度服务
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TaskScheduler {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    /**
     * 调度任务
     * @param task 任务内容
     * @param delayMs 延迟时间（毫秒）
     */
    public void schedule(String task, long delayMs) {
        rabbitTemplate.convertAndSend("scheduler_exchange", "task", task, msg -> {
            msg.getMessageProperties().setDelay((int) delayMs);
            return msg;
        });
        System.out.println("任务已调度，" + delayMs + "ms 后执行");
    }

    // 示例：5秒后执行
    public void scheduleIn5Seconds(String task) {
        schedule(task, 5000);
    }

    // 示例：1分钟后执行
    public void scheduleIn1Minute(String task) {
        schedule(task, 60000);
    }
}

// 任务执行器
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class TaskExecutor {

    @RabbitListener(queues = "scheduler_queue")
    public void execute(String task) {
        System.out.println("执行任务: " + task);
        // 执行实际的业务逻辑
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **消息幂等性与重复消费**——如何保证消息不被重复处理。你会学到消息去重、幂等性保证、分布式事务消息等高级特性。
