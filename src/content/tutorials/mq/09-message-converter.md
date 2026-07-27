---
title: "第9章：消息转换器与序列化"
description: "掌握 JSON 消息转换、对象序列化、消息格式设计"
---

# 第9章：消息转换器与序列化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- RabbitMQ 只能发送字符串吗？
- 怎么发送 Java 对象到消息队列？
- JSON 和 XML 哪种格式更好？
- 消息格式应该怎么设计？

这一章会解答这些问题。消息转换器让你可以发送任意类型的对象，而不只是字符串。

---

## 1 为什么需要消息转换器？

### 痛点分析

默认情况下，RabbitMQ 只能发送字节数组。发送对象需要手动序列化：

```java
// ❌ 手动序列化：繁琐且容易出错
ObjectMapper mapper = new ObjectMapper();
String json = mapper.writeValueAsString(order);
channel.basicPublish("", "queue", null, json.getBytes("UTF-8"));

// 消费端也要手动反序列化
String json = new String(delivery.getBody(), "UTF-8");
Order order = mapper.readValue(json, Order.class);
```

问题：
- 每个地方都要写序列化代码
- 容易忘记处理异常
- 代码重复，维护困难

### 解决方案

使用消息转换器，自动处理序列化和反序列化：

```java
// ✅ 使用消息转换器：简洁优雅
// 发送端
rabbitTemplate.convertAndSend("exchange", "key", order);

// 消费端
@RabbitListener(queues = "queue")
public void receive(Order order) {
    System.out.println("订单ID: " + order.getId());
}
```

> 类比：消息转换器就像快递公司的包装服务，你只需要把物品交给他们，他们负责打包、运输、拆包，你不需要自己找纸箱、胶带。

---

## 2 常用消息转换器

### Jackson2JsonMessageConverter

最常用的 JSON 转换器，使用 Jackson 库。

```java
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

### MarshallingMessageConverter

使用 JAXB 处理 XML 格式。

```java
import org.springframework.amqp.support.converter.MarshallingMessageConverter;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;

@Bean
public MessageConverter xmlMessageConverter() {
    MarshallingMessageConverter converter = new MarshallingMessageConverter();
    Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
    marshaller.setClassesToBeBound(Order.class);
    converter.setMarshaller(marshaller);
    converter.setUnmarshaller(marshaller);
    return converter;
}
```

### 转换器对比

| 转换器 | 格式 | 优点 | 缺点 |
| --- | --- | --- | --- |
| Jackson2JsonMessageConverter | JSON | 轻量、跨语言、易读 | 需要配置 |
| MarshallingMessageConverter | XML | 标准、严格 | 冗长、性能较差 |
| SimpleMessageConverter | 字节数组 | 默认、简单 | 只能处理基本类型 |

---

## 3 使用 Jackson2JsonMessageConverter

### 配置转换器

```java
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    // 1. 定义 JSON 转换器
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // 2. 配置监听器工厂，使用 JSON 转换器
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        return factory;
    }
}
```

### 发送对象消息

```java
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendOrder(Order order) {
        // 自动序列化为 JSON
        rabbitTemplate.convertAndSend("order_exchange", "order.create", order);
        System.out.println("发送订单: " + order.getId());
    }
}
```

### 接收对象消息

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class OrderConsumer {

    @RabbitListener(queues = "order_queue")
    public void receiveOrder(Order order) {
        // 自动反序列化为对象
        System.out.println("收到订单:");
        System.out.println("  ID: " + order.getId());
        System.out.println("  商品: " + order.getProductName());
        System.out.println("  金额: " + order.getAmount());
    }
}
```

---

## 4 自定义消息格式

### 设计消息结构

好的消息格式应该包含：

```java
public class OrderMessage {
    private String messageId;      // 消息ID，用于追踪
    private Long timestamp;        // 时间戳
    private String eventType;      // 事件类型
    private Order data;            // 业务数据
    private Map<String, Object> metadata; // 元数据
}
```

### 发送结构化消息

```java
@Service
public class OrderService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendOrder(Order order) {
        OrderMessage message = new OrderMessage();
        message.setMessageId(UUID.randomUUID().toString());
        message.setTimestamp(System.currentTimeMillis());
        message.setEventType("ORDER_CREATED");
        message.setData(order);
        message.setMetadata(Map.of(
            "source", "order-service",
            "version", "1.0"
        ));

        rabbitTemplate.convertAndSend("order_exchange", "order.create", message);
    }
}
```

### 接收结构化消息

```java
@Component
public class OrderConsumer {

    @RabbitListener(queues = "order_queue")
    public void receiveOrder(OrderMessage message) {
        System.out.println("消息ID: " + message.getMessageId());
        System.out.println("事件类型: " + message.getEventType());
        System.out.println("时间戳: " + message.getTimestamp());
        
        Order order = message.getData();
        System.out.println("订单ID: " + order.getId());
        
        // 处理业务逻辑
        processOrder(order);
    }
}
```

---

## 5 处理序列化异常

### 全局异常处理

```java
import org.springframework.amqp.rabbit.listener.api.RabbitListenerErrorHandler;
import org.springframework.amqp.rabbit.listener.exception.ListenerExecutionFailedException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitErrorHandler {

    @Bean
    public RabbitListenerErrorHandler rabbitListenerErrorHandler() {
        return (message, springMessage, exception) -> {
            // 记录错误日志
            System.err.println("消息处理失败: " + exception.getMessage());
            
            // 可以发送告警
            if (exception.getCause() instanceof JsonParseException) {
                System.err.println("JSON 解析失败，消息格式错误");
            }
            
            throw new ListenerExecutionFailedException("处理失败", exception);
        };
    }
}
```

### 使用错误处理器

```java
@RabbitListener(queues = "order_queue", errorHandler = "rabbitListenerErrorHandler")
public void receiveOrder(Order order) {
    // 如果反序列化失败，会触发错误处理器
    System.out.println("处理订单: " + order.getId());
}
```

---

## 6 消息版本控制

### 问题

随着业务发展，消息格式可能会变化。如何兼容旧版本的消息？

### 解决方案：使用版本号

```java
public class OrderMessage {
    private String version = "1.0"; // 消息版本
    private String messageId;
    private Order data;
}

// 新版本
public class OrderMessageV2 {
    private String version = "2.0";
    private String messageId;
    private Order data;
    private String newField; // 新增字段
}
```

### 根据版本处理

```java
@RabbitListener(queues = "order_queue")
public void receiveOrder(Message message) {
    String version = (String) message.getMessageProperties().getHeader("version");
    
    if ("1.0".equals(version)) {
        // 处理旧版本
        OrderMessageV1 v1 = convertToV1(message);
        processV1(v1);
    } else if ("2.0".equals(version)) {
        // 处理新版本
        OrderMessageV2 v2 = convertToV2(message);
        processV2(v2);
    }
}
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Jackson2JsonMessageConverter | 最常用的 JSON 转换器 |
| convertAndSend | 发送对象，自动序列化 |
| @RabbitListener | 接收对象，自动反序列化 |
| 消息格式设计 | 包含消息ID、时间戳、事件类型、业务数据 |
| 版本控制 | 通过版本号兼容不同格式的消息 |

---

## 8 新手常见误区

### 误区 1："JSON 格式一定比 XML 好"

**错！** JSON 更轻量、易读，但 XML 更严格、标准。选择要看场景：内部系统用 JSON，跨企业集成可能用 XML。

### 误区 2："消息格式越简单越好"

不是的。简单的消息格式可能缺少必要的元数据（如消息ID、时间戳），不利于追踪和调试。应该根据业务需求设计合理的消息结构。

### 误区 3："不需要处理序列化异常"

不是的。网络传输可能出现数据损坏，消息格式可能不兼容。必须处理序列化异常，否则会导致消费者崩溃。

---

## 9 动手练习

### 练习 1：基础练习

配置 Jackson2JsonMessageConverter，发送和接收 Order 对象。

<details>
<summary>点击查看答案</summary>

```java
// 配置类
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

// 订单对象
public class Order {
    private String id;
    private String productName;
    private Double amount;
    // getter/setter
}

// 生产者
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OrderProducer {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void send(Order order) {
        rabbitTemplate.convertAndSend("order_exchange", "order.create", order);
    }
}

// 消费者
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class OrderConsumer {
    @RabbitListener(queues = "order_queue")
    public void receive(Order order) {
        System.out.println("收到订单: " + order.getId());
    }
}
```

</details>

### 练习 2：进阶练习

设计一个包含消息ID、时间戳、事件类型的消息格式，并实现发送和接收。

<details>
<summary>点击查看答案</summary>

```java
// 消息包装类
public class EventMessage<T> {
    private String messageId;
    private Long timestamp;
    private String eventType;
    private T data;
    
    // 构造函数
    public EventMessage(String eventType, T data) {
        this.messageId = UUID.randomUUID().toString();
        this.timestamp = System.currentTimeMillis();
        this.eventType = eventType;
        this.data = data;
    }
    // getter/setter
}

// 使用
@Service
public class OrderService {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void createOrder(Order order) {
        EventMessage<Order> message = new EventMessage<>("ORDER_CREATED", order);
        rabbitTemplate.convertAndSend("order_exchange", "order.create", message);
    }
}
```

</details>

### 练习 3（挑战）：综合练习

实现一个"消息版本兼容"功能：消费者能处理 V1 和 V2 两个版本的消息。

<details>
<summary>点击查看答案</summary>

```java
// V1 消息
public class OrderMessageV1 {
    private String version = "1.0";
    private String orderId;
    private Double amount;
}

// V2 消息
public class OrderMessageV2 {
    private String version = "2.0";
    private String orderId;
    private Double amount;
    private String currency; // 新增字段
}

// 消费者
@RabbitListener(queues = "order_queue")
public void receive(Message message) {
    String version = (String) message.getMessageProperties().getHeader("version");
    
    if ("1.0".equals(version)) {
        OrderMessageV1 v1 = jsonMessageConverter.fromMessage(message, OrderMessageV1.class);
        System.out.println("V1 订单: " + v1.getOrderId());
    } else if ("2.0".equals(version)) {
        OrderMessageV2 v2 = jsonMessageConverter.fromMessage(message, OrderMessageV2.class);
        System.out.println("V2 订单: " + v2.getOrderId() + ", 货币: " + v2.getCurrency());
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **死信队列与延迟消息**——如何处理过期消息、实现延迟任务。你会学到 DLX（死信交换机）、TTL（消息过期时间）、延迟队列的实现方式。
