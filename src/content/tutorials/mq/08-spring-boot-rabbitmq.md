---
title: "第8章:Spring Boot 集成 RabbitMQ"
description: "学习使用 Spring Boot 集成 RabbitMQ,掌握 RabbitTemplate 和 @RabbitListener 的使用"
---

# 第8章:Spring Boot 集成 RabbitMQ

## 本章导读

在学这一章之前,你可能会有这些疑问:

- Spring Boot 集成 RabbitMQ 有什么好处?
- RabbitTemplate 和原生的 Channel 有什么区别?
- @RabbitListener 注解怎么用?有哪些属性?
- 怎么配置多个队列和交换机?
- 生产环境需要注意什么?

这一章会解答这些问题。我们会学习如何使用 Spring Boot 的封装,更优雅地操作 RabbitMQ。

---

## 8.1 为什么需要 Spring Boot 集成?

### 痛点分析

前面的章节中,我们都是用原生 Java API 操作 RabbitMQ。回顾一下代码:

```java
// ❌ 原生 API:代码繁琐,重复代码多
public class NativeProducer {
    public static void main(String[] argv) throws Exception {
        // 1. 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");

        // 2. 创建连接和通道
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            // 3. 声明交换机
            channel.exchangeDeclare("my_exchange", "direct", true);

            // 4. 声明队列
            channel.queueDeclare("my_queue", true, false, false, null);

            // 5. 绑定队列
            channel.queueBind("my_queue", "my_exchange", "my_key");

            // 6. 发送消息
            String message = "Hello RabbitMQ";
            channel.basicPublish("my_exchange", "my_key", null, message.getBytes("UTF-8"));

            System.out.println("消息已发送: " + message);
        }
    }
}
```

问题很明显:

- **代码繁琐**:每次发送消息都要创建连接、通道、声明交换机和队列
- **重复代码多**:连接配置、资源管理在每个类中都要写一遍
- **难以维护**:配置分散在各个类中,修改配置要改很多地方
- **没有依赖注入**:无法利用 Spring 的 IoC 容器管理 Bean

打个比方:

> 原生 API 就像每次做饭都要自己去买菜、洗菜、切菜。Spring Boot 集成就像请了一个厨师(框架),你只需要告诉他做什么菜(业务逻辑),其他的事情他都帮你搞定。

### 解决方案

使用 Spring Boot 集成 RabbitMQ:

```java
// ✅ Spring Boot:代码简洁,配置集中
@Service
public class SpringProducer {
    
    @Autowired
    private RabbitTemplate rabbitTemplate; // 直接注入,无需手动创建连接

    public void sendMessage(String message) {
        // 一行代码发送消息
        rabbitTemplate.convertAndSend("my_exchange", "my_key", message);
    }
}
```

优势:

- **代码简洁**:一行代码发送消息
- **配置集中**:在 `application.yml` 中统一配置
- **依赖注入**:利用 Spring 的 IoC 容器管理 Bean
- **自动管理**:连接、通道的创建和销毁由框架自动管理
- **功能丰富**:提供了更多高级特性(如消息转换、异常处理等)

> **一句话总结**:Spring Boot 集成让 RabbitMQ 的使用更优雅、更简单。

---

## 8.2 核心原理讲解

### Spring AMQP 架构

Spring AMQP 是 Spring 对 AMQP 协议的封装,它提供了两个核心组件:

1. **RabbitTemplate**:用于发送消息
2. **@RabbitListener**:用于接收消息

打个比方:

> RabbitTemplate 就像快递员,帮你把消息送到 RabbitMQ。
> @RabbitListener 就像门铃,有消息来了自动通知你。

### 核心组件对比

| 组件 | 原生 API | Spring Boot |
| --- | --- | --- |
| **连接管理** | 手动创建 ConnectionFactory | 自动配置,通过 `application.yml` |
| **发送消息** | `channel.basicPublish()` | `rabbitTemplate.convertAndSend()` |
| **接收消息** | `channel.basicConsume()` | `@RabbitListener` 注解 |
| **资源管理** | 手动关闭 Connection/Channel | 自动管理,无需手动关闭 |
| **消息转换** | 手动序列化/反序列化 | 自动转换(支持 JSON、XML 等) |
| **异常处理** | 手动 try-catch | 提供统一的异常处理机制 |

### 工作流程

```
生产者 --[RabbitTemplate]--> RabbitMQ --[@RabbitListener]--> 消费者
     (Spring 封装)                    (Spring 封装)
```

具体步骤:

1. Spring Boot 启动时,自动创建 RabbitTemplate 和相关 Bean
2. 生产者通过 `@Autowired` 注入 RabbitTemplate
3. 调用 `rabbitTemplate.convertAndSend()` 发送消息
4. 消费者通过 `@RabbitListener` 注解标记监听方法
5. Spring 自动将消息转换为方法参数类型

---

## 8.3 基础用法:完整示例

### 第一步:添加依赖

在 `pom.xml` 中添加 Spring AMQP 依赖:

```xml
<!-- Spring Boot Starter AMQP -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>

<!-- Spring Boot Starter Web(如果是 Web 项目) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### 第二步:配置 application.yml

在 `src/main/resources/application.yml` 中配置 RabbitMQ 连接:

```yaml
spring:
  rabbitmq:
    host: localhost          # RabbitMQ 服务器地址
    port: 5672               # 端口(默认 5672)
    username: guest          # 用户名
    password: guest          # 密码
    virtual-host: /          # 虚拟主机(默认 /)
    
    # 生产者配置
    publisher-confirm-type: correlated  # 生产者确认类型
    publisher-returns: true             # 是否启用消息返回
    
    # 消费者配置
    listener:
      simple:
        acknowledge-mode: auto          # 确认模式(auto/manual/none)
        concurrency: 1                  # 最小并发数
        max-concurrency: 10             # 最大并发数
        prefetch: 1                     # 每次从队列获取的消息数
```

### 第三步:创建配置类

创建 RabbitMQ 配置类,定义交换机、队列和绑定关系:

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    
    // 定义交换机名称常量
    public static final String EXCHANGE_NAME = "spring_exchange";
    
    // 定义队列名称常量
    public static final String QUEUE_NAME = "spring_queue";
    
    // 定义路由键常量
    public static final String ROUTING_KEY = "spring.key";
    
    /**
     * 创建 Direct 交换机
     * @return DirectExchange 对象
     */
    @Bean
    public DirectExchange directExchange() {
        // 参数:交换机名称, 是否持久化
        return new DirectExchange(EXCHANGE_NAME, true, false);
    }
    
    /**
     * 创建队列
     * @return Queue 对象
     */
    @Bean
    public Queue springQueue() {
        // 参数:队列名称, 是否持久化, 是否独占, 是否自动删除
        return new Queue(QUEUE_NAME, true, false, false);
    }
    
    /**
     * 绑定队列到交换机
     * @return Binding 对象
     */
    @Bean
    public Binding binding(Queue springQueue, DirectExchange directExchange) {
        // 参数:队列, 交换机, 路由键
        return BindingBuilder.bind(springQueue).to(directExchange).with(ROUTING_KEY);
    }
}
```

### 第四步:创建生产者

创建生产者类,使用 RabbitTemplate 发送消息:

```java
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SpringProducer {
    
    // 注入 RabbitTemplate
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    /**
     * 发送简单消息
     * @param message 消息内容
     */
    public void sendSimpleMessage(String message) {
        // 发送消息到指定交换机,使用指定路由键
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,  // 交换机名称
            RabbitMQConfig.ROUTING_KEY,    // 路由键
            message                         // 消息内容
        );
        System.out.println("消息已发送: " + message);
    }
    
    /**
     * 发送对象消息(自动序列化为 JSON)
     * @param order 订单对象
     */
    public void sendOrderMessage(Order order) {
        // 发送对象,RabbitTemplate 会自动序列化
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            RabbitMQConfig.ROUTING_KEY,
            order
        );
        System.out.println("订单消息已发送: " + order);
    }
}
```

### 第五步:创建消费者

创建消费者类,使用 @RabbitListener 接收消息:

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class SpringConsumer {
    
    /**
     * 监听队列,接收消息
     * @param message 消息内容(自动反序列化)
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void receiveMessage(String message) {
        System.out.println("收到消息: " + message);
        // 处理业务逻辑
        processMessage(message);
    }
    
    /**
     * 监听队列,接收对象消息
     * @param order 订单对象(自动反序列化)
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void receiveOrderMessage(Order order) {
        System.out.println("收到订单消息: " + order);
        // 处理业务逻辑
        processOrder(order);
    }
    
    // 模拟消息处理
    private void processMessage(String message) {
        System.out.println("处理消息: " + message);
    }
    
    private void processOrder(Order order) {
        System.out.println("处理订单: " + order.getOrderNo());
    }
}
```

### 第六步:创建测试 Controller

创建 Controller 用于测试消息发送:

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/mq")
public class MQController {
    
    @Autowired
    private SpringProducer producer;
    
    /**
     * 发送简单消息
     * GET /mq/send?message=hello
     */
    @GetMapping("/send")
    public String sendMessage(@RequestParam String message) {
        producer.sendSimpleMessage(message);
        return "消息已发送: " + message;
    }
    
    /**
     * 发送订单消息
     * POST /mq/sendOrder
     */
    @PostMapping("/sendOrder")
    public String sendOrderMessage(@RequestBody Order order) {
        producer.sendOrderMessage(order);
        return "订单消息已发送: " + order.getOrderNo();
    }
}
```

### 第七步:创建 Order 类

创建 Order 实体类:

```java
import java.io.Serializable;

public class Order implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private String orderNo;      // 订单号
    private String productName;  // 商品名称
    private Double amount;       // 金额
    
    // 构造函数
    public Order() {}
    
    public Order(String orderNo, String productName, Double amount) {
        this.orderNo = orderNo;
        this.productName = productName;
        this.amount = amount;
    }
    
    // Getter 和 Setter
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    
    @Override
    public String toString() {
        return "Order{orderNo='" + orderNo + "', productName='" + productName + "', amount=" + amount + "}";
    }
}
```

### 运行结果

启动 Spring Boot 应用,访问 `http://localhost:8080/mq/send?message=Hello Spring Boot`,控制台输出:

```
消息已发送: Hello Spring Boot
收到消息: Hello Spring Boot
处理消息: Hello Spring Boot
```

---

## 8.4 高级用法

### 1. 手动确认模式

修改 `application.yml`:

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        acknowledge-mode: manual  # 手动确认模式
```

修改消费者代码:

```java
import com.rabbitmq.client.Channel;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
public class ManualAckConsumer {
    
    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void receiveMessage(
            String message,
            Channel channel,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws Exception {
        
        try {
            System.out.println("收到消息: " + message);
            
            // 处理业务逻辑
            processMessage(message);
            
            // 处理成功,手动确认
            channel.basicAck(deliveryTag, false);
            System.out.println("消息已确认");
            
        } catch (Exception e) {
            System.err.println("处理失败: " + e.getMessage());
            
            // 处理失败,拒绝消息,重新入队
            channel.basicNack(deliveryTag, false, true);
            System.out.println("消息已拒绝,重新入队");
        }
    }
    
    private void processMessage(String message) throws Exception {
        // 模拟处理
        if (Math.random() < 0.3) {
            throw new Exception("处理异常");
        }
        System.out.println("处理成功: " + message);
    }
}
```

### 2. 死信队列

修改配置类:

```java
@Configuration
public class RabbitMQConfig {
    
    // 主队列
    @Bean
    public Queue mainQueue() {
        Map<String, Object> args = new HashMap<>();
        // 设置死信交换机
        args.put("x-dead-letter-exchange", "dlx_exchange");
        // 设置死信路由键
        args.put("x-dead-letter-routing-key", "dlx.key");
        return new Queue("main_queue", true, false, false, args);
    }
    
    // 死信交换机
    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange("dlx_exchange", true, false);
    }
    
    // 死信队列
    @Bean
    public Queue dlxQueue() {
        return new Queue("dlx_queue", true, false, false);
    }
    
    // 绑定死信队列到死信交换机
    @Bean
    public Binding dlxBinding(Queue dlxQueue, DirectExchange dlxExchange) {
        return BindingBuilder.bind(dlxQueue).to(dlxExchange).with("dlx.key");
    }
}
```

### 3. 消息转换器

配置 JSON 消息转换器:

```java
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQMessageConfig {
    
    /**
     * 配置 JSON 消息转换器
     * 自动将对象序列化为 JSON,将 JSON 反序列化为对象
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

---

## 8.5 对比表格

### 原生 API vs Spring Boot 对比

| 特性 | 原生 API | Spring Boot |
| --- | --- | --- |
| **代码量** | 多(需要手动管理连接、通道) | 少(自动管理) |
| **配置方式** | 硬编码在代码中 | 配置文件(application.yml) |
| **依赖注入** | 不支持 | 支持(@Autowired) |
| **资源管理** | 手动关闭 | 自动管理 |
| **消息转换** | 手动序列化/反序列化 | 自动转换(支持 JSON) |
| **异常处理** | 手动 try-catch | 统一异常处理 |
| **学习曲线** | 陡峭 | 平缓 |
| **适用场景** | 简单应用、学习原理 | 生产环境、企业应用 |

### @RabbitListener 常用属性

| 属性 | 说明 | 示例 |
| --- | --- | --- |
| **queues** | 监听的队列名称 | `@RabbitListener(queues = "my_queue")` |
| **bindings** | 绑定配置 | `@RabbitListener(bindings = @QueueBinding(...))` |
| **concurrency** | 并发消费者数 | `@RabbitListener(queues = "my_queue", concurrency = "3")` |
| **ackMode** | 确认模式 | `@RabbitListener(queues = "my_queue", ackMode = "MANUAL")` |

### 确认模式对比

| 模式 | 配置 | 说明 | 适用场景 |
| --- | --- | --- | --- |
| **none** | `acknowledge-mode: none` | 不确认,消息发出就不管 | 消息不重要,可丢失 |
| **auto** | `acknowledge-mode: auto` | 自动确认(方法正常执行就确认) | 一般业务场景 |
| **manual** | `acknowledge-mode: manual` | 手动确认(需要调用 basicAck) | 重要消息,需要精确控制 |

---

## 8.6 新手常见误区

### 误区 1:"Spring Boot 会自动创建所有队列和交换机"

**不完全对!** Spring Boot 只会创建配置类中定义的 Bean。如果没有在配置类中定义队列或交换机,它们不会被自动创建。

```java
// ❌ 错误:以为会自动创建,结果消息发送失败
rabbitTemplate.convertAndSend("not_exist_exchange", "key", "message");

// ✅ 正确:在配置类中定义队列和交换机
@Bean
public Queue myQueue() {
    return new Queue("my_queue", true);
}

@Bean
public DirectExchange myExchange() {
    return new DirectExchange("my_exchange", true);
}
```

### 误区 2:"@RabbitListener 可以监听多个队列"

**对的!** 一个监听方法可以监听多个队列,用逗号分隔:

```java
// ✅ 正确:监听多个队列
@RabbitListener(queues = {"queue1", "queue2", "queue3"})
public void receiveMessage(String message) {
    System.out.println("收到消息: " + message);
}
```

### 误区 3:"RabbitTemplate 每次发送消息都要创建新实例"

**错!** RabbitTemplate 是线程安全的,应该复用同一个实例。在 Spring Boot 中,RabbitTemplate 是单例 Bean,直接注入即可:

```java
// ❌ 错误:每次创建新实例
RabbitTemplate template = new RabbitTemplate(connectionFactory);
template.convertAndSend("exchange", "key", "message");

// ✅ 正确:复用 Spring 管理的单例
@Autowired
private RabbitTemplate rabbitTemplate;

rabbitTemplate.convertAndSend("exchange", "key", "message");
```

### 误区 4:"消息转换器只能使用 JSON"

**错!** Spring AMQP 支持多种消息转换器:

- **SimpleMessageConverter**:默认转换器,支持 String 和 Serializable 对象
- **Jackson2JsonMessageConverter**:JSON 转换器
- **MarshallingMessageConverter**:XML 转换器
- **Custom converters**:自定义转换器

```java
// 使用 JSON 转换器
@Bean
public MessageConverter jsonMessageConverter() {
    return new Jackson2JsonMessageConverter();
}

// 使用自定义转换器
@Bean
public MessageConverter customMessageConverter() {
    return new CustomMessageConverter();
}
```

### 误区 5:"生产环境不需要配置生产者确认"

**错!** 生产环境必须配置生产者确认,保证消息可靠到达交换机:

```yaml
# ✅ 生产环境推荐配置
spring:
  rabbitmq:
    publisher-confirm-type: correlated  # 异步确认
    publisher-returns: true             # 消息返回
    listener:
      simple:
        acknowledge-mode: manual        # 手动确认
        prefetch: 10                    # 预取数量
        retry:
          enabled: true                 # 启用重试
          max-attempts: 3               # 最大重试次数
```

---

## 8.7 动手练习

### 练习 1:基础概念

用自己的话解释以下概念:

1. Spring Boot 集成 RabbitMQ 有什么好处?
2. RabbitTemplate 和原生的 Channel 有什么区别?
3. @RabbitListener 注解的作用是什么?

<details>
<summary>点击查看答案</summary>

1. **Spring Boot 集成的好处**:
   - 代码简洁:一行代码发送消息,无需手动管理连接和通道
   - 配置集中:在 application.yml 中统一配置
   - 依赖注入:利用 Spring 的 IoC 容器管理 Bean
   - 自动管理:连接、通道的创建和销毁由框架自动管理
   - 功能丰富:提供消息转换、异常处理等高级特性

2. **RabbitTemplate vs Channel**:
   - RabbitTemplate 是 Spring 封装的高级 API,使用简单
   - Channel 是原生 API,需要手动管理连接和通道
   - RabbitTemplate 自动处理序列化、异常等
   - Channel 需要手动处理所有细节

3. **@RabbitListener 的作用**:
   - 标记一个方法为消息监听器
   - 自动监听指定队列的消息
   - 有消息到来时,自动调用该方法处理
   - 支持自动反序列化为方法参数类型

</details>

### 练习 2:代码实现

实现一个订单处理系统:

- 生产者:发送订单消息(包含订单号、商品名称、金额)
- 消费者:接收订单消息,处理订单(打印订单信息)
- 使用 JSON 消息转换器
- 使用手动确认模式

<details>
<summary>点击查看答案</summary>

**1. 配置 application.yml:**

```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
    listener:
      simple:
        acknowledge-mode: manual
```

**2. 配置类:**

```java
@Configuration
public class OrderRabbitMQConfig {
    
    public static final String ORDER_EXCHANGE = "order_exchange";
    public static final String ORDER_QUEUE = "order_queue";
    public static final String ORDER_ROUTING_KEY = "order.create";
    
    @Bean
    public DirectExchange orderExchange() {
        return new DirectExchange(ORDER_EXCHANGE, true, false);
    }
    
    @Bean
    public Queue orderQueue() {
        return new Queue(ORDER_QUEUE, true, false, false);
    }
    
    @Bean
    public Binding orderBinding(Queue orderQueue, DirectExchange orderExchange) {
        return BindingBuilder.bind(orderQueue).to(orderExchange).with(ORDER_ROUTING_KEY);
    }
    
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

**3. Order 实体类:**

```java
public class Order implements Serializable {
    private String orderNo;
    private String productName;
    private Double amount;
    
    // 构造函数、Getter、Setter、toString
}
```

**4. 生产者:**

```java
@Service
public class OrderProducer {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void sendOrder(Order order) {
        rabbitTemplate.convertAndSend(
            OrderRabbitMQConfig.ORDER_EXCHANGE,
            OrderRabbitMQConfig.ORDER_ROUTING_KEY,
            order
        );
        System.out.println("订单已发送: " + order.getOrderNo());
    }
}
```

**5. 消费者:**

```java
@Component
public class OrderConsumer {
    
    @RabbitListener(queues = OrderRabbitMQConfig.ORDER_QUEUE)
    public void receiveOrder(Order order, Channel channel, 
                            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws Exception {
        try {
            System.out.println("收到订单: " + order.getOrderNo());
            System.out.println("商品: " + order.getProductName());
            System.out.println("金额: " + order.getAmount());
            
            // 处理订单
            processOrder(order);
            
            // 手动确认
            channel.basicAck(deliveryTag, false);
            System.out.println("订单处理成功");
            
        } catch (Exception e) {
            System.err.println("订单处理失败: " + e.getMessage());
            channel.basicNack(deliveryTag, false, true);
        }
    }
    
    private void processOrder(Order order) {
        // 模拟处理
        System.out.println("正在处理订单: " + order.getOrderNo());
    }
}
```

</details>

### 练习 3(挑战):系统设计

设计一个完整的电商消息系统,满足以下要求:

1. 订单创建后,发送订单消息到 RabbitMQ
2. 多个消费者监听订单消息:
   - 库存服务:扣减库存
   - 短信服务:发送订单通知
   - 积分服务:增加积分
3. 使用 Topic 交换机,路由键格式:`order.{操作}.{状态}`
4. 库存服务只监听订单创建消息
5. 短信服务监听所有订单消息
6. 使用手动确认模式
7. 处理失败的消息发送到死信队列

要求:

1. 画出架构图
2. 设计交换机、队列和绑定关系
3. 写出完整的配置类和消费者代码

<details>
<summary>点击查看答案</summary>

**架构图:**

```
订单创建 --> Topic 交换机(order_topic) --> order.create.success --> 库存服务队列
                                        order.*.* --> 短信服务队列
                                        order.# --> 日志服务队列

处理失败 --> 死信交换机 --> 死信队列
```

**配置类:**

```java
@Configuration
public class EcommerceRabbitMQConfig {
    
    // Topic 交换机
    @Bean
    public TopicExchange orderTopicExchange() {
        return new TopicExchange("order_topic", true, false);
    }
    
    // 库存服务队列(只监听订单创建)
    @Bean
    public Queue inventoryQueue() {
        return new Queue("inventory_queue", true);
    }
    
    @Bean
    public Binding inventoryBinding(Queue inventoryQueue, TopicExchange orderTopicExchange) {
        return BindingBuilder.bind(inventoryQueue)
                .to(orderTopicExchange)
                .with("order.create.*");
    }
    
    // 短信服务队列(监听所有订单消息)
    @Bean
    public Queue smsQueue() {
        return new Queue("sms_queue", true);
    }
    
    @Bean
    public Binding smsBinding(Queue smsQueue, TopicExchange orderTopicExchange) {
        return BindingBuilder.bind(smsQueue)
                .to(orderTopicExchange)
                .with("order.#");
    }
    
    // 死信交换机和队列
    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange("dlx_exchange", true, false);
    }
    
    @Bean
    public Queue dlxQueue() {
        return new Queue("dlx_queue", true);
    }
    
    @Bean
    public Binding dlxBinding(Queue dlxQueue, DirectExchange dlxExchange) {
        return BindingBuilder.bind(dlxQueue).to(dlxExchange).with("dlx.key");
    }
}
```

**库存服务消费者:**

```java
@Component
public class InventoryConsumer {
    
    @RabbitListener(queues = "inventory_queue")
    public void receiveOrder(Order order, Channel channel, 
                            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws Exception {
        try {
            System.out.println("[库存服务] 收到订单: " + order.getOrderNo());
            
            // 扣减库存
            deductStock(order);
            
            // 手动确认
            channel.basicAck(deliveryTag, false);
            System.out.println("[库存服务] 库存扣减成功");
            
        } catch (Exception e) {
            System.err.println("[库存服务] 库存扣减失败: " + e.getMessage());
            channel.basicNack(deliveryTag, false, true);
        }
    }
    
    private void deductStock(Order order) throws Exception {
        // 模拟库存扣减
        if (Math.random() < 0.2) {
            throw new Exception("库存不足");
        }
        System.out.println("扣减库存: " + order.getProductName());
    }
}
```

**短信服务消费者:**

```java
@Component
public class SmsConsumer {
    
    @RabbitListener(queues = "sms_queue")
    public void receiveOrder(Order order, Channel channel, 
                            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws Exception {
        try {
            System.out.println("[短信服务] 收到订单: " + order.getOrderNo());
            
            // 发送短信
            sendSms(order);
            
            // 手动确认
            channel.basicAck(deliveryTag, false);
            System.out.println("[短信服务] 短信发送成功");
            
        } catch (Exception e) {
            System.err.println("[短信服务] 短信发送失败: " + e.getMessage());
            channel.basicNack(deliveryTag, false, true);
        }
    }
    
    private void sendSms(Order order) throws Exception {
        // 模拟短信发送
        if (Math.random() < 0.1) {
            throw new Exception("短信服务异常");
        }
        System.out.println("发送短信给用户: 订单 " + order.getOrderNo() + " 已创建");
    }
}
```

</details>

---

## 下一章预告

恭喜你完成了 MQ 消息队列的学习!通过这 8 章的学习,你已经掌握了:

- 消息队列的基本概念和作用
- RabbitMQ 的核心概念(Exchange、Queue、Binding)
- 各种消息模式(简单队列、工作队列、发布订阅、路由、主题)
- 消息确认和持久化机制
- Spring Boot 集成 RabbitMQ

接下来,你可以在实际项目中应用这些知识,构建可靠的消息系统。建议:

1. **动手实践**:在自己的项目中集成 RabbitMQ
2. **深入理解**:阅读 RabbitMQ 官方文档,了解更多高级特性
3. **性能优化**:学习如何优化 RabbitMQ 的性能
4. **高可用**:学习 RabbitMQ 的集群和镜像队列配置

祝你在消息队列的学习道路上越走越远!
